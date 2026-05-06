import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { InventoryService } from '../src/domain/inventory/services/inventory.service';
import { UsersService } from '../src/domain/users/services/users.service';
import { InventoryScope } from '../src/common/enums/inventory-scope.enum';
import { AuditUserContext } from '../src/common/interfaces/audit-user-context.interface';

// ---------------------------------------------------------------------------
// Catalog definitions
// ---------------------------------------------------------------------------

const BED_ITEMS = [
  {
    nameEn: 'Single Bed Frame',
    nameTr: 'Tek Kişilik Yatak Çerçevesi',
    descriptionEn: 'Metal-frame single bed (90×190 cm)',
    descriptionTr: 'Metal çerçeveli tek kişilik yatak (90×190 cm)',
    basePriceTry: 3500,
    basePriceForeign: 95,
    isOptional: false,
  },
  {
    nameEn: 'Foam Mattress',
    nameTr: 'Sünger Yatak Minderi',
    descriptionEn: '10 cm high-density foam mattress',
    descriptionTr: '10 cm yüksek yoğunluklu sünger yatak minderi',
    basePriceTry: 2800,
    basePriceForeign: 75,
    isOptional: false,
  },
  {
    nameEn: 'Standard Pillow',
    nameTr: 'Standart Yastık',
    descriptionEn: 'Hypoallergenic hollow-fibre pillow',
    descriptionTr: 'Hipoalerjenik içi dolu elyaf yastık',
    basePriceTry: 300,
    basePriceForeign: 8,
    isOptional: false,
  },
  {
    nameEn: 'Orthopedic Pillow',
    nameTr: 'Ortopedik Yastık',
    descriptionEn: 'Memory-foam orthopedic pillow',
    descriptionTr: 'Hafıza köpüğü ortopedik yastık',
    basePriceTry: 500,
    basePriceForeign: 14,
    isOptional: true,
  },
  {
    nameEn: 'Mattress Protector',
    nameTr: 'Yatak Koruyucu',
    descriptionEn: 'Waterproof quilted mattress protector',
    descriptionTr: 'Su geçirmez kapitoneli yatak koruyucu',
    basePriceTry: 350,
    basePriceForeign: 10,
    isOptional: false,
  },
  {
    nameEn: 'Bedside Table',
    nameTr: 'Komodin',
    descriptionEn: 'Small bedside table with one drawer',
    descriptionTr: 'Tek çekmeceli küçük komodin',
    basePriceTry: 900,
    basePriceForeign: 25,
    isOptional: false,
  },
  {
    nameEn: 'Bedside Lamp',
    nameTr: 'Gece Lambası',
    descriptionEn: 'LED bedside reading lamp',
    descriptionTr: 'LED okuma gece lambası',
    basePriceTry: 250,
    basePriceForeign: 7,
    isOptional: true,
  },
];

const ROOM_ITEMS = [
  {
    nameEn: 'Study Desk',
    nameTr: 'Çalışma Masası',
    descriptionEn: 'Wooden study desk with built-in shelf',
    descriptionTr: 'Raflı ahşap çalışma masası',
    basePriceTry: 1800,
    basePriceForeign: 50,
    isOptional: false,
  },
  {
    nameEn: 'Desk Chair',
    nameTr: 'Çalışma Koltuğu',
    descriptionEn: 'Ergonomic adjustable desk chair',
    descriptionTr: 'Ergonomik ayarlanabilir çalışma koltuğu',
    basePriceTry: 1200,
    basePriceForeign: 33,
    isOptional: false,
  },
  {
    nameEn: 'Wardrobe',
    nameTr: 'Dolap',
    descriptionEn: '2-door wardrobe with hanging rail and shelves',
    descriptionTr: 'Askı barlı ve raflı 2 kapılı dolap',
    basePriceTry: 4500,
    basePriceForeign: 120,
    isOptional: false,
  },
  {
    nameEn: 'Bookshelf',
    nameTr: 'Kitaplık',
    descriptionEn: '5-tier bookshelf',
    descriptionTr: '5 katlı kitaplık',
    basePriceTry: 900,
    basePriceForeign: 25,
    isOptional: false,
  },
  {
    nameEn: 'Curtains',
    nameTr: 'Perde',
    descriptionEn: 'Blackout curtains with rod',
    descriptionTr: 'Karartma perdesi ve ray',
    basePriceTry: 600,
    basePriceForeign: 17,
    isOptional: false,
  },
  {
    nameEn: 'Ceiling Light Fixture',
    nameTr: 'Tavan Armatürü',
    descriptionEn: 'LED ceiling light (6000 K, 24 W)',
    descriptionTr: 'LED tavan armatürü (6000 K, 24 W)',
    basePriceTry: 450,
    basePriceForeign: 12,
    isOptional: false,
  },
  {
    nameEn: 'Rubbish Bin',
    nameTr: 'Çöp Kutusu',
    descriptionEn: '20 L pedal rubbish bin',
    descriptionTr: '20 L pedallı çöp kutusu',
    basePriceTry: 150,
    basePriceForeign: 4,
    isOptional: false,
  },
  {
    nameEn: 'Mini Refrigerator',
    nameTr: 'Mini Buzdolabı',
    descriptionEn: '60 L mini refrigerator',
    descriptionTr: '60 L mini buzdolabı',
    basePriceTry: 5500,
    basePriceForeign: 150,
    isOptional: true,
  },
];

const SHARED_ITEMS = [
  {
    nameEn: 'Electric Oven',
    nameTr: 'Elektrikli Fırın',
    descriptionEn: '60 L electric oven with grill',
    descriptionTr: '60 L ızgaralı elektrikli fırın',
    basePriceTry: 8000,
    basePriceForeign: 220,
    isOptional: false,
  },
  {
    nameEn: 'Microwave',
    nameTr: 'Mikrodalga Fırın',
    descriptionEn: '20 L microwave oven',
    descriptionTr: '20 L mikrodalga fırın',
    basePriceTry: 3200,
    basePriceForeign: 88,
    isOptional: false,
  },
  {
    nameEn: 'Refrigerator',
    nameTr: 'Buzdolabı',
    descriptionEn: '350 L two-door refrigerator',
    descriptionTr: '350 L çift kapılı buzdolabı',
    basePriceTry: 18000,
    basePriceForeign: 490,
    isOptional: false,
  },
  {
    nameEn: 'Washing Machine',
    nameTr: 'Çamaşır Makinesi',
    descriptionEn: '8 kg front-load washing machine',
    descriptionTr: '8 kg öne yüklemeli çamaşır makinesi',
    basePriceTry: 22000,
    basePriceForeign: 600,
    isOptional: false,
  },
  {
    nameEn: 'Dryer',
    nameTr: 'Kurutma Makinesi',
    descriptionEn: '8 kg heat-pump dryer',
    descriptionTr: '8 kg ısı pompalı kurutma makinesi',
    basePriceTry: 25000,
    basePriceForeign: 680,
    isOptional: true,
  },
  {
    nameEn: 'Iron & Ironing Board',
    nameTr: 'Ütü ve Ütü Masası',
    descriptionEn: 'Steam iron with foldable ironing board',
    descriptionTr: 'Katlanabilir ütü masası ile buharlı ütü',
    basePriceTry: 1800,
    basePriceForeign: 50,
    isOptional: false,
  },
  {
    nameEn: 'Vacuum Cleaner',
    nameTr: 'Elektrik Süpürgesi',
    descriptionEn: 'Upright bagged vacuum cleaner',
    descriptionTr: 'Torbalı dik elektrik süpürgesi',
    basePriceTry: 4500,
    basePriceForeign: 125,
    isOptional: false,
  },
  {
    nameEn: 'Mop & Bucket Set',
    nameTr: 'Paspas ve Kova Seti',
    descriptionEn: 'Spin-mop with wringer bucket',
    descriptionTr: 'Sıkmalı kovası ile döner paspas',
    basePriceTry: 400,
    basePriceForeign: 11,
    isOptional: false,
  },
  {
    nameEn: 'Common-Area Sofa',
    nameTr: 'Ortak Alan Koltuk Takımı',
    descriptionEn: '3-seat fabric sofa for common room',
    descriptionTr: 'Ortak alan için 3 kişilik kumaş koltuk',
    basePriceTry: 12000,
    basePriceForeign: 330,
    isOptional: false,
  },
  {
    nameEn: 'Dining Table',
    nameTr: 'Yemek Masası',
    descriptionEn: '6-person dining table',
    descriptionTr: '6 kişilik yemek masası',
    basePriceTry: 7500,
    basePriceForeign: 205,
    isOptional: false,
  },
  {
    nameEn: 'Dining Chair',
    nameTr: 'Yemek Sandalyesi',
    descriptionEn: 'Metal-frame padded dining chair',
    descriptionTr: 'Metal çerçeveli dolgulu yemek sandalyesi',
    basePriceTry: 700,
    basePriceForeign: 19,
    isOptional: false,
  },
  {
    nameEn: 'Fire Extinguisher',
    nameTr: 'Yangın Söndürücü',
    descriptionEn: '6 kg dry-powder fire extinguisher',
    descriptionTr: '6 kg kuru tozlu yangın söndürücü',
    basePriceTry: 1200,
    basePriceForeign: 33,
    isOptional: false,
  },
  {
    nameEn: 'First-Aid Kit',
    nameTr: 'İlk Yardım Çantası',
    descriptionEn: 'Standard 50-piece first-aid kit',
    descriptionTr: 'Standart 50 parçalı ilk yardım çantası',
    basePriceTry: 350,
    basePriceForeign: 10,
    isOptional: false,
  },
  {
    nameEn: 'Whiteboard',
    nameTr: 'Beyaz Tahta',
    descriptionEn: '90×120 cm magnetic whiteboard with markers',
    descriptionTr: 'Kalemli 90×120 cm manyetik beyaz tahta',
    basePriceTry: 800,
    basePriceForeign: 22,
    isOptional: true,
  },
];

// ---------------------------------------------------------------------------
// Template definitions — resolved after catalog ids are known
// ---------------------------------------------------------------------------

type TemplateSpec = {
  name: string;
  description: string;
  scope: InventoryScope;
  items: Array<{ nameEn: string; quantity: number }>;
};

const TEMPLATES: TemplateSpec[] = [
  {
    name: 'Standard Single Bed Kit',
    description: 'All items for one bed: frame, mattress, protector, pillows, bedside table',
    scope: InventoryScope.BED,
    items: [
      { nameEn: 'Single Bed Frame', quantity: 1 },
      { nameEn: 'Foam Mattress', quantity: 1 },
      { nameEn: 'Mattress Protector', quantity: 1 },
      { nameEn: 'Standard Pillow', quantity: 1 },
      { nameEn: 'Bedside Table', quantity: 1 },
    ],
  },
  {
    name: 'Standard Single Room',
    description: 'Room furniture for a single-occupancy room (desk, chair, wardrobe, bookshelf)',
    scope: InventoryScope.ROOM,
    items: [
      { nameEn: 'Study Desk', quantity: 1 },
      { nameEn: 'Desk Chair', quantity: 1 },
      { nameEn: 'Wardrobe', quantity: 1 },
      { nameEn: 'Bookshelf', quantity: 1 },
      { nameEn: 'Curtains', quantity: 1 },
      { nameEn: 'Ceiling Light Fixture', quantity: 1 },
      { nameEn: 'Rubbish Bin', quantity: 1 },
    ],
  },
  {
    name: 'Standard Triple Room',
    description: 'Room furniture for a 3-person room (3× desk+chair+wardrobe, shared items)',
    scope: InventoryScope.ROOM,
    items: [
      { nameEn: 'Study Desk', quantity: 3 },
      { nameEn: 'Desk Chair', quantity: 3 },
      { nameEn: 'Wardrobe', quantity: 3 },
      { nameEn: 'Bookshelf', quantity: 1 },
      { nameEn: 'Curtains', quantity: 1 },
      { nameEn: 'Ceiling Light Fixture', quantity: 1 },
      { nameEn: 'Rubbish Bin', quantity: 1 },
    ],
  },
  {
    name: 'Floor Common Area',
    description: 'Shared appliances and furniture for a floor common area',
    scope: InventoryScope.SHARED,
    items: [
      { nameEn: 'Electric Oven', quantity: 1 },
      { nameEn: 'Microwave', quantity: 1 },
      { nameEn: 'Refrigerator', quantity: 1 },
      { nameEn: 'Washing Machine', quantity: 2 },
      { nameEn: 'Dryer', quantity: 1 },
      { nameEn: 'Iron & Ironing Board', quantity: 1 },
      { nameEn: 'Vacuum Cleaner', quantity: 1 },
      { nameEn: 'Mop & Bucket Set', quantity: 2 },
      { nameEn: 'Common-Area Sofa', quantity: 1 },
      { nameEn: 'Dining Table', quantity: 1 },
      { nameEn: 'Dining Chair', quantity: 6 },
      { nameEn: 'Fire Extinguisher', quantity: 1 },
      { nameEn: 'First-Aid Kit', quantity: 1 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const inventoryService = app.get(InventoryService);
  const usersService = app.get(UsersService);
  const logger = new Logger('SeedInventory');

  const adminUser = await usersService.findByEmail('recovery_admin@dorm.com');
  if (!adminUser) {
    logger.error('Recovery admin not found. Please run npm run init:prod first.');
    await app.close();
    return;
  }

  const ctx: AuditUserContext = {
    userId: adminUser.id,
    username: 'seed_inventory',
    ipAddress: '127.0.0.1',
    userAgent: 'Seed Script',
  };

  try {
    // ------------------------------------------------------------------
    // 1. Catalog
    // ------------------------------------------------------------------
    logger.log('Seeding inventory catalog…');
    const existingCatalog = await inventoryService.findAllCatalog();
    const byNameEn = (nameEn: string) => existingCatalog.find((c) => c.nameEn === nameEn);

    const getOrCreateCatalog = async (scope: InventoryScope, item: (typeof BED_ITEMS)[number]) => {
      const existing = byNameEn(item.nameEn);
      if (existing) return existing;
      const created = await inventoryService.createCatalog(
        {
          nameEn: item.nameEn,
          nameTr: item.nameTr,
          descriptionEn: item.descriptionEn,
          descriptionTr: item.descriptionTr,
          scope,
          basePriceTry: item.basePriceTry,
          basePriceForeign: item.basePriceForeign,
          foreignCurrencyCode: 'EUR',
          isOptional: item.isOptional ?? false,
        },
        ctx,
      );
      logger.log(`  + Catalog: ${item.nameEn}`);
      return created;
    };

    for (const item of BED_ITEMS) await getOrCreateCatalog(InventoryScope.BED, item as any);
    for (const item of ROOM_ITEMS) await getOrCreateCatalog(InventoryScope.ROOM, item as any);
    for (const item of SHARED_ITEMS) await getOrCreateCatalog(InventoryScope.SHARED, item as any);

    // ------------------------------------------------------------------
    // 2. Reload catalog after inserts
    // ------------------------------------------------------------------
    const catalog = await inventoryService.findAllCatalog();
    const catalogId = (nameEn: string) => catalog.find((c) => c.nameEn === nameEn)?.id;

    // ------------------------------------------------------------------
    // 3. Templates
    // ------------------------------------------------------------------
    logger.log('Seeding inventory templates…');
    const existingTemplates = await inventoryService.findAllTemplates();

    for (const spec of TEMPLATES) {
      if (existingTemplates.find((t) => t.name === spec.name)) {
        logger.log(`  = Template already exists: ${spec.name}`);
        continue;
      }

      const items = spec.items
        .map(({ nameEn, quantity }) => {
          const id = catalogId(nameEn);
          if (!id) logger.warn(`  ! Catalog item not found for template item: ${nameEn}`);
          return id ? { catalogId: id, quantity } : null;
        })
        .filter(Boolean) as { catalogId: number; quantity: number }[];

      if (items.length === 0) {
        logger.warn(`  ! Skipping template "${spec.name}" — no resolvable catalog items`);
        continue;
      }

      await inventoryService.createTemplate(
        { name: spec.name, description: spec.description, scope: spec.scope, items },
        ctx,
      );
      logger.log(`  + Template: ${spec.name}`);
    }

    logger.log('✅ Inventory seeding complete.');
  } catch (err) {
    logger.error('Inventory seeding failed', err);
  } finally {
    await app.close();
  }
}

bootstrap();
