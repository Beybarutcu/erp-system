import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ============================================
  // 1. CLEAN DATABASE
  // ============================================
  console.log('🧹 Cleaning database...');
  
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.reportExport.deleteMany();
  await prisma.reportSchedule.deleteMany();
  await prisma.systemSettings.deleteMany();
  await prisma.sampleApproval.deleteMany();
  await prisma.sampleProduction.deleteMany();
  await prisma.sampleRequest.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderConfirmation.deleteMany();
  await prisma.purchaseOrderConfirmation.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.personnelCapacity.deleteMany();
  await prisma.personnel.deleteMany();
  await prisma.qualityDefect.deleteMany();
  await prisma.finalInspection.deleteMany();
  await prisma.qualityMeasurement.deleteMany();
  await prisma.moldUsage.deleteMany();
  await prisma.moldMaintenance.deleteMany();
  await prisma.stockRevision.deleteMany();
  await prisma.locationTransfer.deleteMany();
  await prisma.shipmentItem.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.outsourcingJob.deleteMany();
  await prisma.workOrderOperation.deleteMany();
  await prisma.workOrderMaterial.deleteMany();
  await prisma.lotAllocation.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.inventoryLot.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.machineMaintenance.deleteMany();
  await prisma.machineShift.deleteMany();
  await prisma.machineTranslation.deleteMany();
  await prisma.machine.deleteMany();
  await prisma.bomItem.deleteMany();
  await prisma.productTranslation.deleteMany();
  await prisma.product.deleteMany();
  await prisma.mold.deleteMany();
  await prisma.warehouseLocation.deleteMany();
  await prisma.warehouseZone.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workshop.deleteMany();

  console.log('✅ Database cleaned');

  // ============================================
  // 2. WORKSHOPS
  // ============================================
  console.log('🏭 Creating workshops...');

  const workshop1 = await prisma.workshop.create({
    data: {
      code: 'INJ-01',
      name: 'Enjeksiyon Atölyesi 1',
      type: 'INJECTION',
    },
  });

  const workshop2 = await prisma.workshop.create({
    data: {
      code: 'ASM-01',
      name: 'Montaj Atölyesi',
      type: 'ASSEMBLY',
    },
  });

  const workshopQC = await prisma.workshop.create({
    data: {
      code: 'QC-01',
      name: 'Kalite Kontrol',
      type: 'QUALITY_CONTROL',
    },
  });

  console.log(`✅ Created ${3} workshops`);

  // ============================================
  // 3. USERS & PERMISSIONS
  // ============================================
  console.log('👥 Creating users...');

  const hashedPassword = await bcrypt.hash('admin123', 10);
  const hashedUserPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@erp.com',
      passwordHash: hashedPassword,
      fullName: 'Admin User',
      role: 'ADMIN',
      languagePreference: 'tr',
      isActive: true,
    },
  });

  const manager = await prisma.user.create({
    data: {
      username: 'manager',
      email: 'manager@erp.com',
      passwordHash: hashedUserPassword,
      fullName: 'Manager User',
      role: 'MANAGER',
      languagePreference: 'tr',
      isActive: true,
    },
  });

  const operator = await prisma.user.create({
    data: {
      username: 'operator',
      email: 'operator@erp.com',
      passwordHash: hashedUserPassword,
      fullName: 'Operator User',
      role: 'OPERATOR',
      workshopId: workshop1.id,
      languagePreference: 'tr',
      isActive: true,
    },
  });

  const qcUser = await prisma.user.create({
    data: {
      username: 'quality',
      email: 'quality@erp.com',
      passwordHash: hashedUserPassword,
      fullName: 'Quality Control',
      role: 'QUALITY_CONTROL',
      workshopId: workshopQC.id,
      languagePreference: 'tr',
      isActive: true,
    },
  });

  console.log(`✅ Created ${4} users`);

  // ============================================
  // 4. WAREHOUSES & LOCATIONS
  // ============================================
  console.log('🏢 Creating warehouses...');

  const mainWarehouse = await prisma.warehouse.create({
    data: {
      code: 'MAIN',
      name: 'Ana Depo',
      address: 'Merkez Lokasyon',
    },
  });

  const zoneA = await prisma.warehouseZone.create({
    data: {
      warehouseId: mainWarehouse.id,
      code: 'A',
      name: 'Bölge A - Hammaddeler',
    },
  });

  const zoneB = await prisma.warehouseZone.create({
    data: {
      warehouseId: mainWarehouse.id,
      code: 'B',
      name: 'Bölge B - Mamüller',
    },
  });

  // Create locations
  const locations = [];
  for (let i = 1; i <= 10; i++) {
    const loc = await prisma.warehouseLocation.create({
      data: {
        warehouseId: mainWarehouse.id,
        zoneId: i <= 5 ? zoneA.id : zoneB.id,
        code: `R${Math.ceil(i / 2)}-${i % 2 === 0 ? '02' : '01'}`,
        fullCode: `MAIN-${i <= 5 ? 'A' : 'B'}-R${Math.ceil(i / 2)}-${i % 2 === 0 ? '02' : '01'}`,
        locationType: 'SHELF',
        capacity: 1000,
        currentOccupancy: 0,
      },
    });
    locations.push(loc);
  }

  console.log(`✅ Created warehouse with ${2} zones and ${10} locations`);

  // ============================================
  // 5. MOLDS
  // ============================================
  console.log('🔧 Creating molds...');

  const mold1 = await prisma.mold.create({
    data: {
      code: 'MOLD-001',
      name: 'Plastik Kapak Kalıbı',
      cavityCount: 4,
      cycleTimeSeconds: 45,
      ownership: 'OWN',
      status: 'ACTIVE',
      locationId: locations[0].id,
      totalShots: 15000,
      maintenanceIntervalShots: 50000,
      nextMaintenanceShots: 35000,
    },
  });

  const mold2 = await prisma.mold.create({
    data: {
      code: 'MOLD-002',
      name: 'Gövde Kalıbı',
      cavityCount: 2,
      cycleTimeSeconds: 60,
      ownership: 'CUSTOMER',
      status: 'ACTIVE',
      locationId: locations[1].id,
      totalShots: 8000,
      maintenanceIntervalShots: 30000,
      nextMaintenanceShots: 22000,
    },
  });

  console.log(`✅ Created ${2} molds`);

  // ============================================
  // 6. PRODUCTS
  // ============================================
  console.log('📦 Creating products...');

  const rawMaterial1 = await prisma.product.create({
    data: {
      code: 'RM-001',
      type: 'RAW_MATERIAL',
      isStocked: true,
      minStockLevel: 500,
      maxStockLevel: 5000,
      allowNegativeStock: false,
      createdBy: admin.id,
      translations: {
        create: [
          {
            languageCode: 'tr',
            name: 'Polipropilen Granül',
            description: 'PP hammadde granülü',
          },
          {
            languageCode: 'en',
            name: 'Polypropylene Granule',
            description: 'PP raw material granule',
          },
        ],
      },
    },
  });

  const rawMaterial2 = await prisma.product.create({
    data: {
      code: 'RM-002',
      type: 'RAW_MATERIAL',
      isStocked: true,
      minStockLevel: 300,
      maxStockLevel: 3000,
      translations: {
        create: [
          {
            languageCode: 'tr',
            name: 'Renklendirici - Mavi',
            description: 'RAL 5015 Mavi renklendirici',
          },
        ],
      },
    },
  });

  const semiFinished1 = await prisma.product.create({
    data: {
      code: 'SF-001',
      type: 'SEMI_FINISHED',
      isStocked: true,
      moldId: mold1.id,
      translations: {
        create: [
          {
            languageCode: 'tr',
            name: 'Plastik Kapak (Ham)',
            description: 'İşlenmemiş plastik kapak',
          },
        ],
      },
    },
  });

  const finished1 = await prisma.product.create({
    data: {
      code: 'FG-001',
      type: 'FINISHED',
      isStocked: true,
      minStockLevel: 100,
      maxStockLevel: 1000,
      translations: {
        create: [
          {
            languageCode: 'tr',
            name: 'Mamül Ürün A',
            description: 'Montajlı mamül ürün',
          },
        ],
      },
    },
  });

  const packaging1 = await prisma.product.create({
    data: {
      code: 'PKG-001',
      type: 'PACKAGING',
      isStocked: true,
      translations: {
        create: [
          {
            languageCode: 'tr',
            name: 'Karton Kutu 30x20x15',
          },
        ],
      },
    },
  });

  console.log(`✅ Created ${5} products`);

  // ============================================
  // 7. BOM (Bill of Materials)
  // ============================================
  console.log('🌳 Creating BOM...');

  // Semi-finished BOM
  await prisma.bomItem.create({
    data: {
      parentId: semiFinished1.id,
      childId: rawMaterial1.id,
      quantity: 0.05, // 50 gram
      unit: 'KG',
      scrapRate: 2,
    },
  });

  await prisma.bomItem.create({
    data: {
      parentId: semiFinished1.id,
      childId: rawMaterial2.id,
      quantity: 0.002, // 2 gram
      unit: 'KG',
      scrapRate: 1,
    },
  });

  // Finished product BOM
  await prisma.bomItem.create({
    data: {
      parentId: finished1.id,
      childId: semiFinished1.id,
      quantity: 2,
      unit: 'PCS',
    },
  });

  await prisma.bomItem.create({
    data: {
      parentId: finished1.id,
      childId: packaging1.id,
      quantity: 1,
      unit: 'PCS',
    },
  });

  console.log(`✅ Created multi-level BOM`);

  // ============================================
  // 8. SUPPLIERS & CUSTOMERS
  // ============================================
  console.log('🤝 Creating suppliers & customers...');

  const supplier1 = await prisma.supplier.create({
    data: {
      code: 'SUP-001',
      name: 'Hammadde A.Ş.',
      type: 'MATERIAL',
      contactPerson: 'Ahmet Yılmaz',
      email: 'ahmet@hammadde.com',
      phone: '+90 532 111 2233',
      leadTimeDays: 7,
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      code: 'SUP-002',
      name: 'Fason İşleme Ltd.',
      type: 'OUTSOURCING',
      contactPerson: 'Mehmet Demir',
      email: 'info@fason.com',
      leadTimeDays: 3,
    },
  });

  const customer1 = await prisma.customer.create({
    data: {
      code: 'CUS-001',
      name: 'ABC Otomotiv',
      contactPerson: 'Ali Kaya',
      email: 'ali@abc.com',
      phone: '+90 533 444 5566',
      paymentTerms: 30,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      code: 'CUS-002',
      name: 'XYZ Elektronik',
      contactPerson: 'Ayşe Şahin',
      email: 'ayse@xyz.com',
      paymentTerms: 45,
    },
  });

  console.log(`✅ Created ${2} suppliers and ${2} customers`);

  // ============================================
  // 9. PURCHASE ORDERS
  // ============================================
  console.log('🛒 Creating purchase orders...');

  const po1 = await prisma.purchaseOrder.create({
    data: {
      orderNumber: 'PO-2025-001',
      supplierId: supplier1.id,
      orderDate: new Date('2025-02-01'),
      expectedDeliveryDate: new Date('2025-02-08'),
      status: 'CONFIRMED',
      totalAmount: 15000,
      items: {
        create: [
          {
            productId: rawMaterial1.id,
            quantity: 1000,
            unitPrice: 12.5,
            receivedQuantity: 1000,
            receivedDate: new Date('2025-02-07'),
          },
          {
            productId: rawMaterial2.id,
            quantity: 100,
            unitPrice: 25,
            receivedQuantity: 100,
            receivedDate: new Date('2025-02-07'),
          },
        ],
      },
      confirmations: {
        create: {
          confirmationDate: new Date('2025-02-02'),
          confirmedBy: 'Ahmet Yılmaz',
          status: 'CONFIRMED',
        },
      },
    },
  });

  console.log(`✅ Created purchase order with confirmation`);

  // ============================================
  // 10. INVENTORY LOTS
  // ============================================
  console.log('📦 Creating inventory lots...');

  const lot1 = await prisma.inventoryLot.create({
    data: {
      lotNumber: 'LOT-2025-001',
      productId: rawMaterial1.id,
      quantity: 1000,
      unitCost: 12.5,
      supplierId: supplier1.id,
      locationId: locations[0].id,
      receivedDate: new Date('2025-02-07'),
      status: 'AVAILABLE',
      qualityStatus: 'APPROVED',
      purchaseOrderId: po1.id,
    },
  });

  const lot2 = await prisma.inventoryLot.create({
    data: {
      lotNumber: 'LOT-2025-002',
      productId: rawMaterial2.id,
      quantity: 100,
      unitCost: 25,
      supplierId: supplier1.id,
      locationId: locations[1].id,
      receivedDate: new Date('2025-02-07'),
      status: 'AVAILABLE',
      qualityStatus: 'APPROVED',
      purchaseOrderId: po1.id,
    },
  });

  console.log(`✅ Created ${2} inventory lots`);

  // ============================================
  // 11. MACHINES
  // ============================================
  console.log('⚙️ Creating machines...');

  const machine1 = await prisma.machine.create({
    data: {
      code: 'MACH-001',
      machineType: 'INJECTION',
      capacityPerHour: 120,
      status: 'ACTIVE',
      translations: {
        create: [
          {
            languageCode: 'tr',
            name: 'Enjeksiyon Makinesi 1',
            description: '200 ton enjeksiyon',
          },
        ],
      },
    },
  });

  console.log(`✅ Created machine`);

  // ============================================
  // 12. ORDERS & WORK ORDERS
  // ============================================
  console.log('📋 Creating orders & work orders...');

  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'SO-2025-001',
      customerId: customer1.id,
      orderDate: new Date('2025-02-01'),
      deliveryDate: new Date('2025-02-20'),
      status: 'IN_PRODUCTION',
      confirmationStatus: 'CONFIRMED',
      totalAmount: 50000,
      createdBy: manager.id,
      items: {
        create: {
          productId: finished1.id,
          quantity: 500,
          unitPrice: 100,
        },
      },
      confirmations: {
        create: {
          quotationSentDate: new Date('2025-01-25'),
          quotationNumber: 'QT-2025-001',
          customerConfirmationDate: new Date('2025-01-28'),
          confirmedBy: 'Ali Kaya',
          status: 'CONFIRMED',
        },
      },
    },
  });

  const wo1 = await prisma.workOrder.create({
    data: {
      woNumber: 'WO-2025-001',
      productId: semiFinished1.id,
      orderId: order1.id,
      workshopId: workshop1.id,
      plannedQuantity: 1000,
      producedQuantity: 750,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      machineId: machine1.id,
      plannedStartDate: new Date('2025-02-10'),
      plannedEndDate: new Date('2025-02-15'),
      actualStartDate: new Date('2025-02-10'),
      allowBomChanges: true,
      createdBy: manager.id,
    },
  });

  console.log(`✅ Created order and work order`);

  // ============================================
  // 13. QUALITY MEASUREMENTS
  // ============================================
  console.log('🔬 Creating quality records...');

  await prisma.qualityMeasurement.create({
    data: {
      workOrderId: wo1.id,
      measuredBy: qcUser.id,
      sampleSize: 10,
      parametersJson: {
        length: { value: 150.2, min: 149.5, max: 150.5, pass: true },
        width: { value: 80.1, min: 79.7, max: 80.3, pass: true },
        weight: { value: 50.5, min: 49, max: 51, pass: true },
      },
      overallResult: 'PASS',
      defectCount: 0,
    },
  });

  console.log(`✅ Created quality measurement`);

  // ============================================
  // 14. PERSONNEL
  // ============================================
  console.log('👷 Creating personnel...');

  const personnel1 = await prisma.personnel.create({
    data: {
      code: 'PER-001',
      name: 'Mustafa Özdemir',
      position: 'OPERATOR',
      shift: 'DAY',
      weeklyHours: 40,
      skills: {
        machines: ['MACH-001'],
        operations: ['INJECTION', 'QUALITY_CHECK'],
      },
    },
  });

  await prisma.personnelCapacity.create({
    data: {
      personnelId: personnel1.id,
      weekNumber: 7,
      year: 2025,
      plannedHours: 40,
      actualHours: 38,
      overtimeHours: 2,
    },
  });

  console.log(`✅ Created personnel with capacity`);

  // ============================================
  // 15. SAMPLE REQUEST
  // ============================================
  console.log('🧪 Creating sample request...');

  await prisma.sampleRequest.create({
    data: {
      requestNumber: 'SAMPLE-2025-001',
      customerId: customer2.id,
      requestDate: new Date('2025-02-05'),
      requestedQuantity: 10,
      deadline: new Date('2025-02-12'),
      status: 'PENDING',
      notes: 'Yeni ürün için numune talebi',
    },
  });

  console.log(`✅ Created sample request`);

  // ============================================
  // 16. SYSTEM SETTINGS
  // ============================================
  console.log('⚙️ Creating system settings...');

  const settings = [
    {
      key: 'allow_negative_stock',
      value: 'false',
      dataType: 'BOOLEAN',
      category: 'INVENTORY',
      description: 'Allow inventory to go negative',
    },
    {
      key: 'default_negative_stock_limit',
      value: '-100',
      dataType: 'NUMBER',
      category: 'INVENTORY',
      description: 'Default negative stock limit',
    },
    {
      key: 'auto_generate_work_orders',
      value: 'false',
      dataType: 'BOOLEAN',
      category: 'PRODUCTION',
      description: 'Auto generate work orders from orders',
    },
    {
      key: 'min_stock_alert_enabled',
      value: 'true',
      dataType: 'BOOLEAN',
      category: 'INVENTORY',
      description: 'Enable minimum stock alerts',
    },
    {
      key: 'quality_check_required',
      value: 'true',
      dataType: 'BOOLEAN',
      category: 'QUALITY',
      description: 'Require quality checks before completion',
    },
  ];

  for (const setting of settings) {
    await prisma.systemSettings.create({ data: setting });
  }

  console.log(`✅ Created ${settings.length} system settings`);

  // ============================================
  // 17. PERMISSIONS
  // ============================================
  console.log('🔐 Creating permissions...');

  const modules = [
    'products',
    'work_orders',
    'inventory',
    'orders',
    'purchase_orders',
    'quality',
    'reports',
    'machines',
    'warehouse',
    'molds',
    'quality',
    'personnel',
    'samples',
  ];
  const actions = ['view', 'create', 'edit', 'delete'];

  const permissions: Array<{
  role: UserRole;
  module: string;
  action: string;
}> = [];

  // ADMIN - full access
  for (const module of modules) {
    for (const action of actions) {
      permissions.push({
        role: 'ADMIN',
        module,
        action,
      });
    }
  }

  // MANAGER - no delete
  for (const module of modules) {
    for (const action of ['view', 'create', 'edit']) {
      permissions.push({
        role: 'MANAGER',
        module,
        action,
      });
    }
  }

  // OPERATOR - limited
  permissions.push(
    { role: 'OPERATOR', module: 'work_orders', action: 'view' },
    { role: 'OPERATOR', module: 'work_orders', action: 'edit' },
    { role: 'OPERATOR', module: 'products', action: 'view' },
    { role: 'OPERATOR', module: 'inventory', action: 'view' }
  );

  // QUALITY_CONTROL
  permissions.push(
    { role: 'QUALITY_CONTROL', module: 'quality', action: 'view' },
    { role: 'QUALITY_CONTROL', module: 'quality', action: 'create' },
    { role: 'QUALITY_CONTROL', module: 'quality', action: 'edit' },
    { role: 'QUALITY_CONTROL', module: 'work_orders', action: 'view' },
    { role: 'QUALITY_CONTROL', module: 'inventory', action: 'view' }
  );

  // WAREHOUSE
  permissions.push(
    { role: 'WAREHOUSE', module: 'warehouse', action: 'view' },
    { role: 'WAREHOUSE', module: 'warehouse', action: 'create' },
    { role: 'WAREHOUSE', module: 'warehouse', action: 'edit' },
    { role: 'WAREHOUSE', module: 'inventory', action: 'view' },
    { role: 'WAREHOUSE', module: 'inventory', action: 'edit' }
  );

  await prisma.permission.createMany({
    data: permissions,
    skipDuplicates: true,
  });

  console.log(`✅ Created ${permissions.length} permissions`);

  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   - Workshops: 3`);
  console.log(`   - Users: 4 (admin/manager/operator/quality)`);
  console.log(`   - Warehouses: 1 with 2 zones and 10 locations`);
  console.log(`   - Molds: 2`);
  console.log(`   - Products: 5 (with multi-level BOM)`);
  console.log(`   - Suppliers: 2`);
  console.log(`   - Customers: 2`);
  console.log(`   - Purchase Orders: 1 (confirmed)`);
  console.log(`   - Inventory Lots: 2`);
  console.log(`   - Machines: 1`);
  console.log(`   - Orders: 1 (with confirmation)`);
  console.log(`   - Work Orders: 1 (in progress)`);
  console.log(`   - Quality Measurements: 1`);
  console.log(`   - Personnel: 1`);
  console.log(`   - Sample Requests: 1`);
  console.log(`   - System Settings: 5`);
  console.log(`   - Permissions: ${permissions.length}`);
  console.log('');
  console.log('🔑 Login credentials:');
  console.log('   admin / admin123');
  console.log('   manager / user123');
  console.log('   operator / user123');
  console.log('   quality / user123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });