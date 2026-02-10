import { PrismaClient, UserRole, ProductType, LotStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (development only!)
  if (process.env.NODE_ENV === 'development') {
    console.log('🗑️  Clearing existing data...');
    await prisma.auditLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.inventoryTransaction.deleteMany();
    await prisma.inventoryLot.deleteMany();
    await prisma.workOrderOperation.deleteMany();
    await prisma.workOrder.deleteMany();
    await prisma.shipmentItem.deleteMany();
    await prisma.shipment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.outsourcingJob.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.machineMaintenance.deleteMany();
    await prisma.machineShift.deleteMany();
    await prisma.machineTranslation.deleteMany();
    await prisma.machine.deleteMany();
    await prisma.bomOperationTranslation.deleteMany();
    await prisma.bomItem.deleteMany();
    await prisma.productTranslation.deleteMany();
    await prisma.product.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.user.deleteMany();
  }

  // 1. Create Users
  console.log('👤 Creating users...');
  
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@erp.com',
      passwordHash: adminPassword,
      fullName: 'System Administrator',
      role: UserRole.ADMIN,
      languagePreference: 'tr',
    },
  });

  const manager = await prisma.user.create({
    data: {
      username: 'manager',
      email: 'manager@erp.com',
      passwordHash: userPassword,
      fullName: 'Production Manager',
      role: UserRole.MANAGER,
      languagePreference: 'tr',
    },
  });

  const operator = await prisma.user.create({
    data: {
      username: 'operator',
      email: 'operator@erp.com',
      passwordHash: userPassword,
      fullName: 'Machine Operator',
      role: UserRole.OPERATOR,
      languagePreference: 'tr',
    },
  });

  console.log(`✅ Created ${3} users`);

  // 2. Create Permissions
  console.log('🔐 Creating permissions...');
  
  const permissions = [
    // Admin - Full access
    ...['products', 'bom', 'inventory', 'work_orders', 'machines', 'capacity', 'orders', 'suppliers', 'reporting'].flatMap(module =>
      ['view', 'create', 'edit', 'delete'].map(action => ({
        role: UserRole.ADMIN,
        module,
        action,
      }))
    ),
    
    // Manager - Most access
    ...['products', 'bom', 'inventory', 'work_orders', 'machines', 'capacity', 'orders', 'reporting'].flatMap(module =>
      ['view', 'create', 'edit'].map(action => ({
        role: UserRole.MANAGER,
        module,
        action,
      }))
    ),
    
    // Operator - Limited access
    ...['work_orders', 'inventory'].flatMap(module =>
      ['view', 'edit'].map(action => ({
        role: UserRole.OPERATOR,
        module,
        action,
      }))
    ),
  ];

  await prisma.permission.createMany({ data: permissions });
  console.log(`✅ Created ${permissions.length} permissions`);

  // 3. Create Products
  console.log('📦 Creating products...');
  
  // Raw materials
  const plasticPP = await prisma.product.create({
    data: {
      code: 'PP-1000',
      type: ProductType.RAW_MATERIAL,
      isStocked: true,
      createdBy: admin.id,
      translations: {
        create: [
          { languageCode: 'tr', name: 'Polipropilen Granül', description: 'Yüksek kalite PP hammadde' },
          { languageCode: 'en', name: 'Polypropylene Granules', description: 'High quality PP raw material' },
        ],
      },
    },
  });

  const plasticABS = await prisma.product.create({
    data: {
      code: 'ABS-2000',
      type: ProductType.RAW_MATERIAL,
      isStocked: true,
      createdBy: admin.id,
      translations: {
        create: [
          { languageCode: 'tr', name: 'ABS Granül', description: 'Darbe dayanımlı ABS' },
          { languageCode: 'en', name: 'ABS Granules', description: 'Impact resistant ABS' },
        ],
      },
    },
  });

  // Finished products
  const plasticCup = await prisma.product.create({
    data: {
      code: 'CUP-100',
      type: ProductType.FINISHED,
      isStocked: true,
      createdBy: admin.id,
      translations: {
        create: [
          { languageCode: 'tr', name: 'Plastik Bardak 250ml', description: 'Şeffaf plastik bardak' },
          { languageCode: 'en', name: 'Plastic Cup 250ml', description: 'Transparent plastic cup' },
        ],
      },
    },
  });

  const containerLid = await prisma.product.create({
    data: {
      code: 'LID-200',
      type: ProductType.FINISHED,
      isStocked: true,
      createdBy: admin.id,
      translations: {
        create: [
          { languageCode: 'tr', name: 'Kap Kapağı', description: 'Universal kap kapağı' },
          { languageCode: 'en', name: 'Container Lid', description: 'Universal container lid' },
        ],
      },
    },
  });

  console.log(`✅ Created ${4} products`);

  // 4. Create BOM
  console.log('🌳 Creating BOM (Bill of Materials)...');
  
  // Plastic Cup BOM
  await prisma.bomItem.create({
    data: {
      parentProductId: plasticCup.id,
      childProductId: plasticPP.id,
      sequenceOrder: 1,
      quantity: 0.025, // 25 grams
      operationType: 'INJECTION',
      machineType: 'INJECTION_50T',
      cycleTimeSeconds: 15,
      setupTimeMinutes: 30,
      scrapRate: 2.5,
      level: 0,
      translations: {
        create: [
          { languageCode: 'tr', operationName: 'Enjeksiyon Kalıplama', notes: '50 ton makine' },
          { languageCode: 'en', operationName: 'Injection Molding', notes: '50 ton machine' },
        ],
      },
    },
  });

  // Container Lid BOM
  await prisma.bomItem.create({
    data: {
      parentProductId: containerLid.id,
      childProductId: plasticABS.id,
      sequenceOrder: 1,
      quantity: 0.015, // 15 grams
      operationType: 'INJECTION',
      machineType: 'INJECTION_35T',
      cycleTimeSeconds: 12,
      setupTimeMinutes: 25,
      scrapRate: 3.0,
      level: 0,
      translations: {
        create: [
          { languageCode: 'tr', operationName: 'Enjeksiyon Kalıplama', notes: '35 ton makine' },
          { languageCode: 'en', operationName: 'Injection Molding', notes: '35 ton machine' },
        ],
      },
    },
  });

  console.log(`✅ Created BOM items`);

  // 5. Create Machines
  console.log('⚙️  Creating machines...');
  
  const machine50T = await prisma.machine.create({
    data: {
      code: 'INJ-50T-01',
      machineType: 'INJECTION_50T',
      capacityPerHour: 200,
      status: 'ACTIVE',
      location: 'Üretim Hattı A',
      translations: {
        create: [
          { languageCode: 'tr', name: '50 Ton Enjeksiyon Makinesi #1', description: 'Ana üretim makinesi' },
          { languageCode: 'en', name: '50 Ton Injection Machine #1', description: 'Main production machine' },
        ],
      },
      shifts: {
        create: [
          { dayOfWeek: 1, shiftName: 'Sabah', startTime: new Date('1970-01-01T08:00:00'), endTime: new Date('1970-01-01T16:00:00') },
          { dayOfWeek: 1, shiftName: 'Akşam', startTime: new Date('1970-01-01T16:00:00'), endTime: new Date('1970-01-01T00:00:00') },
        ],
      },
    },
  });

  const machine35T = await prisma.machine.create({
    data: {
      code: 'INJ-35T-01',
      machineType: 'INJECTION_35T',
      capacityPerHour: 300,
      status: 'ACTIVE',
      location: 'Üretim Hattı B',
      translations: {
        create: [
          { languageCode: 'tr', name: '35 Ton Enjeksiyon Makinesi #1', description: 'Küçük parça üretimi' },
          { languageCode: 'en', name: '35 Ton Injection Machine #1', description: 'Small part production' },
        ],
      },
    },
  });

  console.log(`✅ Created ${2} machines`);

  // 6. Create Suppliers
  console.log('🏭 Creating suppliers...');
  
  const materialSupplier = await prisma.supplier.create({
    data: {
      code: 'SUP-001',
      name: 'Plastik Hammadde A.Ş.',
      type: 'MATERIAL',
      contactPerson: 'Ahmet Yılmaz',
      email: 'info@plastikhammadde.com',
      phone: '+90 212 555 0001',
      leadTimeDays: 7,
    },
  });

  const outsourceSupplier = await prisma.supplier.create({
    data: {
      code: 'SUP-002',
      name: 'Boya ve Kaplama Ltd.',
      type: 'OUTSOURCING',
      contactPerson: 'Mehmet Kaya',
      email: 'info@boyakaplama.com',
      phone: '+90 212 555 0002',
      leadTimeDays: 3,
    },
  });

  console.log(`✅ Created ${2} suppliers`);

  // 7. Create Inventory Lots (FIFO demo)
  console.log('📊 Creating inventory lots...');
  
  // PP lots (different dates for FIFO testing)
  const lot1 = await prisma.inventoryLot.create({
    data: {
      lotNumber: 'PP-1000-20240101-001',
      productId: plasticPP.id,
      initialQuantity: 1000,
      currentQuantity: 800,
      receivedDate: new Date('2024-01-01'),
      locationCode: 'A-01-01',
      status: LotStatus.ACTIVE,
      supplierId: materialSupplier.id,
      unitCost: 25.50,
    },
  });

  const lot2 = await prisma.inventoryLot.create({
    data: {
      lotNumber: 'PP-1000-20240115-001',
      productId: plasticPP.id,
      initialQuantity: 1000,
      currentQuantity: 1000,
      receivedDate: new Date('2024-01-15'),
      locationCode: 'A-01-02',
      status: LotStatus.ACTIVE,
      supplierId: materialSupplier.id,
      unitCost: 26.00,
    },
  });

  // ABS lots
  const lot3 = await prisma.inventoryLot.create({
    data: {
      lotNumber: 'ABS-2000-20240110-001',
      productId: plasticABS.id,
      initialQuantity: 500,
      currentQuantity: 450,
      receivedDate: new Date('2024-01-10'),
      locationCode: 'A-02-01',
      status: LotStatus.ACTIVE,
      supplierId: materialSupplier.id,
      unitCost: 35.00,
    },
  });

  console.log(`✅ Created ${3} inventory lots`);

  // 8. Create Customers
  console.log('👥 Creating customers...');
  
  const customer = await prisma.customer.create({
    data: {
      code: 'CUST-001',
      name: 'Ambalaj Dünyası A.Ş.',
      contactPerson: 'Ayşe Demir',
      email: 'siparis@ambalajdunyasi.com',
      phone: '+90 216 555 0001',
      address: 'İstanbul, Türkiye',
      taxNumber: '1234567890',
      paymentTerms: 30,
    },
  });

  console.log(`✅ Created ${1} customer`);

  // 9. Create Order
  console.log('📋 Creating orders...');
  
  const order = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2024-0001',
      customerId: customer.id,
      orderDate: new Date('2024-02-01'),
      deliveryDate: new Date('2024-02-15'),
      status: 'PENDING',
      totalAmount: 5000,
      currency: 'TRY',
      createdBy: manager.id,
      items: {
        create: [
          {
            productId: plasticCup.id,
            quantity: 10000,
            unitPrice: 0.35,
          },
          {
            productId: containerLid.id,
            quantity: 5000,
            unitPrice: 0.25,
          },
        ],
      },
    },
  });

  console.log(`✅ Created ${1} order with ${2} items`);

  // 10. Create Work Orders
  console.log('🏗️  Creating work orders...');
  
  const workOrder1 = await prisma.workOrder.create({
    data: {
      woNumber: 'WO-2024-0001',
      productId: plasticCup.id,
      orderId: order.id,
      plannedQuantity: 10000,
      producedQuantity: 0,
      status: 'PLANNED',
      machineId: machine50T.id,
      plannedStartDate: new Date('2024-02-02'),
      plannedEndDate: new Date('2024-02-05'),
      priority: 8,
      createdBy: manager.id,
    },
  });

  const workOrder2 = await prisma.workOrder.create({
    data: {
      woNumber: 'WO-2024-0002',
      productId: containerLid.id,
      orderId: order.id,
      plannedQuantity: 5000,
      producedQuantity: 0,
      status: 'PLANNED',
      machineId: machine35T.id,
      plannedStartDate: new Date('2024-02-03'),
      plannedEndDate: new Date('2024-02-06'),
      priority: 7,
      createdBy: manager.id,
    },
  });

  console.log(`✅ Created ${2} work orders`);

  console.log('');
  console.log('✨ Seed completed successfully!');
  console.log('');
  console.log('📝 Demo Credentials:');
  console.log('   Admin:    admin / admin123');
  console.log('   Manager:  manager / user123');
  console.log('   Operator: operator / user123');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
