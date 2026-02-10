import { prisma } from '@shared/database/client';
import { AppError } from '@shared/middleware/error-handler';
import { Decimal } from '@prisma/client/runtime/library';

export class InventoryService {
  /**
   * Consume stock with FIFO algorithm
   */
  async consumeStock(
    data: {
      productId: string;
      quantity: number;
      workOrderId?: string;
      manualLotId?: string;
      notes?: string;
    },
    userId: string
  ) {
    const { productId, quantity, workOrderId, manualLotId, notes } = data;

    if (manualLotId && !notes) {
      throw new AppError('Reason is required for manual lot selection', 400);
    }

    let lotsToConsume: any[];

    if (manualLotId) {
      // Manual lot selection
      const lot = await prisma.inventoryLot.findUnique({
        where: { id: manualLotId },
      });

      if (!lot || lot.productId !== productId) {
        throw new AppError('Invalid lot selected', 400);
      }

      if (lot.currentQuantity.lessThan(quantity)) {
        throw new AppError('Insufficient quantity in selected lot', 400);
      }

      lotsToConsume = [lot];
    } else {
      // FIFO automatic selection
      lotsToConsume = await prisma.inventoryLot.findMany({
        where: {
          productId,
          status: 'ACTIVE',
          currentQuantity: { gt: 0 },
        },
        orderBy: [
          { receivedDate: 'asc' },
          { id: 'asc' },
        ],
      });
    }

    // Check total availability
    const totalAvailable = lotsToConsume.reduce(
      (sum, lot) => sum.plus(lot.currentQuantity),
      new Decimal(0)
    );

    if (totalAvailable.lessThan(quantity)) {
      throw new AppError(
        `Insufficient stock. Required: ${quantity}, Available: ${totalAvailable}`,
        400
      );
    }

    // Consume from lots (FIFO)
    let remaining = new Decimal(quantity);
    const consumed: any[] = [];

    await prisma.$transaction(async (tx) => {
      for (const lot of lotsToConsume) {
        if (remaining.lessThanOrEqualTo(0)) break;

        const toConsume = Decimal.min(lot.currentQuantity, remaining);

        // Update lot quantity
        await tx.inventoryLot.update({
          where: { id: lot.id },
          data: {
            currentQuantity: lot.currentQuantity.minus(toConsume),
          },
        });

        // Create transaction record
        await tx.inventoryTransaction.create({
          data: {
            lotId: lot.id,
            transactionType: 'OUT',
            quantity: toConsume.toNumber(),
            referenceType: 'WORK_ORDER',
            referenceId: workOrderId,
            createdBy: userId,
            notes: manualLotId
              ? `Manual lot selection: ${notes}`
              : 'FIFO consumption',
          },
        });

        consumed.push({
          lotId: lot.id,
          lotNumber: lot.lotNumber,
          quantity: toConsume.toNumber(),
          unitCost: lot.unitCost?.toNumber() || 0,
          fifoOrder: !manualLotId,
        });

        remaining = remaining.minus(toConsume);
      }
    });

    return {
      productId,
      consumedQuantity: quantity,
      consumed,
      totalCost: consumed.reduce((sum, c) => sum + c.quantity * c.unitCost, 0),
      method: manualLotId ? 'MANUAL' : 'FIFO',
    };
  }
}

export default new InventoryService();