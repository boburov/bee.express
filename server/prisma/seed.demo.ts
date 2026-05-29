/**
 * Demo data seeder — Uzbek-localized fake content for MVP testing.
 *
 * Idempotent: every entity is prefixed with `demo-` so a re-run wipes the
 * old set and recreates from scratch. Run via:
 *
 *   npm run db:seed:demo         # create
 *   npm run db:seed:demo:clear   # delete demo data only
 *
 * Real (non-demo) data is untouched.
 */
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) });

const DEMO = "demo";
const DEMO_PHONE_PREFIX = 70n; // BigInt prefix — all demo phones start with 70xxxxxxx

// Toshkent bounding box for random coordinates.
const TASHKENT_BBOX = {
  latMin: 41.2400, latMax: 41.3800,
  lngMin: 69.1800, lngMax: 69.3300,
};

function rnd(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomTashkentCoord(): { lat: number; lng: number } {
  return {
    lat: Math.round(rnd(TASHKENT_BBOX.latMin, TASHKENT_BBOX.latMax) * 1e7) / 1e7,
    lng: Math.round(rnd(TASHKENT_BBOX.lngMin, TASHKENT_BBOX.lngMax) * 1e7) / 1e7,
  };
}

// ─── Cleanup ──────────────────────────────────────────────────────────

/**
 * Delete every demo entity. Cascades handle most relations; we order from
 * leaf to root for safety. Identified by slug/key prefix `demo-`.
 */
async function clearDemo() {
  console.log("[demo] Clearing previous demo data…");
  // Orders → items + history cascade via @relation onDelete: Cascade.
  await prisma.order.deleteMany({ where: { orderNumber: { startsWith: "DEMO-" } } });
  // Reviews — by product slug prefix.
  await prisma.review.deleteMany({
    where: { product: { slug: { startsWith: `${DEMO}-` } } },
  });
  // Cart items + cart for demo users.
  await prisma.cartItem.deleteMany({
    where: { cart: { user: { phone: { gte: 700000000n, lt: 800000000n } } } },
  });
  await prisma.cart.deleteMany({
    where: { user: { phone: { gte: 700000000n, lt: 800000000n } } },
  });
  await prisma.address.deleteMany({
    where: { user: { phone: { gte: 700000000n, lt: 800000000n } } },
  });
  // Offers + variants + products
  await prisma.sellerOffer.deleteMany({
    where: { variant: { product: { slug: { startsWith: `${DEMO}-` } } } },
  });
  await prisma.productVariant.deleteMany({
    where: { product: { slug: { startsWith: `${DEMO}-` } } },
  });
  await prisma.productImage.deleteMany({
    where: { product: { slug: { startsWith: `${DEMO}-` } } },
  });
  await prisma.productAttributeValue.deleteMany({
    where: { product: { slug: { startsWith: `${DEMO}-` } } },
  });
  await prisma.product.deleteMany({ where: { slug: { startsWith: `${DEMO}-` } } });
  // Stores
  await prisma.store.deleteMany({ where: { slug: { startsWith: `${DEMO}-` } } });
  // Users (sellers + customers + couriers — phone-range identifies them)
  await prisma.user.deleteMany({
    where: { phone: { gte: 700000000n, lt: 800000000n } },
  });
  // Brands
  await prisma.brand.deleteMany({ where: { slug: { startsWith: `${DEMO}-` } } });
  // Category attributes link → attribute values → attributes
  await prisma.categoryAttribute.deleteMany({
    where: {
      OR: [
        { category: { slug: { startsWith: `${DEMO}-` } } },
        { attribute: { slug: { startsWith: `${DEMO}-` } } },
      ],
    },
  });
  await prisma.attributeValue.deleteMany({
    where: { attribute: { slug: { startsWith: `${DEMO}-` } } },
  });
  await prisma.attribute.deleteMany({ where: { slug: { startsWith: `${DEMO}-` } } });
  // Categories (children first because @relation NoAction)
  await prisma.category.deleteMany({
    where: { slug: { startsWith: `${DEMO}-` }, parentId: { not: null } },
  });
  await prisma.category.deleteMany({ where: { slug: { startsWith: `${DEMO}-` } } });
  console.log("[demo] Cleared.");
}

// ─── Categories ───────────────────────────────────────────────────────

const FOOD_CATS = [
  { slug: "lavash",   name: "Lavash",       icon: "🌯" },
  { slug: "burger",   name: "Burger",       icon: "🍔" },
  { slug: "pizza",    name: "Pitsa",        icon: "🍕" },
  { slug: "osh",      name: "Milliy taom",  icon: "🍲" },
  { slug: "somsa",    name: "Somsa",        icon: "🥟" },
  { slug: "shashlik", name: "Shashlik",     icon: "🍢" },
  { slug: "ichimlik", name: "Ichimliklar", icon: "🥤" },
  { slug: "dessert",  name: "Shirinliklar", icon: "🍰" },
] as const;

const MARKETPLACE_CATS = [
  { slug: "electronics", name: "Elektronika" },
  { slug: "clothing",    name: "Kiyim-kechak" },
  { slug: "home",        name: "Uy mollari" },
  { slug: "books",       name: "Kitoblar" },
] as const;

async function seedCategories() {
  console.log("[demo] Seeding categories…");
  const food = await Promise.all(
    FOOD_CATS.map((c) =>
      prisma.category.create({
        data: {
          slug: `${DEMO}-${c.slug}`,
          name: c.name,
          nameRu: c.name,
          type: "FOOD",
          isActive: true,
          sortOrder: 0,
          deliveryRadiusKm: 10,
          deliveryBaseFee: 5000,
          deliveryPerKmFee: 2000,
          deliveryEtaMinMinutes: 30,
          deliveryEtaMaxMinutes: 60,
        },
      }),
    ),
  );
  const market = await Promise.all(
    MARKETPLACE_CATS.map((c) =>
      prisma.category.create({
        data: {
          slug: `${DEMO}-${c.slug}`,
          name: c.name,
          nameRu: c.name,
          type: "MARKETPLACE",
          isActive: true,
          sortOrder: 0,
          deliveryRadiusKm: 30,
          deliveryBaseFee: 10000,
          deliveryPerKmFee: 1500,
        },
      }),
    ),
  );
  console.log(`[demo] ${food.length} FOOD + ${market.length} MARKETPLACE categories.`);
  return { food, market };
}

// ─── Brands ───────────────────────────────────────────────────────────

const BRAND_NAMES = ["Hisar", "Korzinka", "Makro", "Samsung", "Xiaomi", "Apple", "LG"];

async function seedBrands() {
  console.log("[demo] Seeding brands…");
  return Promise.all(
    BRAND_NAMES.map((name) =>
      prisma.brand.create({
        data: {
          slug: `${DEMO}-${name.toLowerCase()}`,
          name,
          isActive: true,
        },
      }),
    ),
  );
}

// ─── Users (sellers, customers, couriers) ─────────────────────────────

const FIRST_NAMES = [
  "Akmal", "Bekzod", "Sherzod", "Otabek", "Javlon", "Aziz", "Rustam",
  "Sanjar", "Bobur", "Jasur", "Davron", "Eldor", "Farrux", "Ulug'bek",
  "Madina", "Nigora", "Dilnoza", "Shahnoza", "Zarina", "Kamola",
];
const LAST_NAMES = [
  "Karimov", "Yusupov", "Saidov", "Rahimov", "Toshmatov", "Inomov",
  "Olimov", "Ergashev", "Mirzayev", "Komilov", "Tursunov", "Yo'ldoshev",
];

function fakeUzbekName(): { first: string; last: string } {
  return { first: pick(FIRST_NAMES), last: pick(LAST_NAMES) };
}

interface DemoUser {
  id: string;
  phone: bigint;
  firstName: string;
  lastName: string;
}

async function seedUsers(opts: {
  customers: number;
  sellers: number;
  couriers: number;
  customerRoleId: string;
  sellerRoleId: string;
  courierRoleId: string;
}): Promise<{ customers: DemoUser[]; sellers: DemoUser[]; couriers: DemoUser[] }> {
  console.log("[demo] Seeding users…");
  let phoneCounter = 700000001n;

  async function makeBatch(count: number, roleId: string): Promise<DemoUser[]> {
    const out: DemoUser[] = [];
    for (let i = 0; i < count; i++) {
      const { first, last } = fakeUzbekName();
      const phone = phoneCounter++;
      const user = await prisma.user.create({
        data: { phone, firstName: first, lastName: last, roleId },
      });
      out.push({ id: user.id, phone, firstName: first, lastName: last });
    }
    return out;
  }

  const customers = await makeBatch(opts.customers, opts.customerRoleId);
  const sellers = await makeBatch(opts.sellers, opts.sellerRoleId);
  const couriers = await makeBatch(opts.couriers, opts.courierRoleId);
  console.log(
    `[demo] ${customers.length} customers, ${sellers.length} sellers, ${couriers.length} couriers.`,
  );
  return { customers, sellers, couriers };
}

// ─── Stores ───────────────────────────────────────────────────────────

const FOOD_STORE_NAMES = [
  "Lavash Paradise", "Burger Town", "Tashkent Pizza", "Osh Center",
  "Somsa King", "Shashlik House", "Bek Café", "Old City Kitchen",
  "Chinor Restaurant", "Mevali Lavash",
];
const MARKETPLACE_STORE_NAMES = [
  "TechWorld", "Phone Bazar", "Uy Plus", "Stil Shop",
  "Modali Style", "Knigi Plus", "Smart Home", "Elektro UZ",
  "Family Market", "Diqqat Mahsulot",
];

interface DemoStore {
  id: string;
  ownerId: string;
  type: "FOOD" | "MARKETPLACE";
  name: string;
  lat: number;
  lng: number;
}

async function seedStores(sellers: DemoUser[]): Promise<DemoStore[]> {
  console.log("[demo] Seeding stores…");
  const stores: DemoStore[] = [];
  const foodCount = Math.min(FOOD_STORE_NAMES.length, Math.floor(sellers.length * 0.6));
  for (let i = 0; i < sellers.length; i++) {
    const isFood = i < foodCount;
    const namePool = isFood ? FOOD_STORE_NAMES : MARKETPLACE_STORE_NAMES;
    const name = namePool[i % namePool.length] + (i >= namePool.length ? ` #${Math.floor(i / namePool.length) + 1}` : "");
    const { lat, lng } = randomTashkentCoord();
    const store = await prisma.store.create({
      data: {
        ownerId: sellers[i].id,
        slug: `${DEMO}-store-${i + 1}`,
        name,
        description: isFood
          ? "Toza, mazali va tez yetkazib beriladi."
          : "Sifatli mahsulot, ishonchli yetkazib berish.",
        status: "ACTIVE",
        isOpen: true,
        phone: `998${String(900000000 + Math.floor(Math.random() * 99999999))}`,
        address: `${pick(["Mirobod", "Yunusobod", "Chilonzor", "Yakkasaroy", "Olmazor"])} tumani`,
        latitude: lat,
        longitude: lng,
      },
    });
    stores.push({
      id: store.id,
      ownerId: sellers[i].id,
      type: isFood ? "FOOD" : "MARKETPLACE",
      name,
      lat,
      lng,
    });
  }
  console.log(`[demo] ${stores.length} stores.`);
  return stores;
}

// ─── Products + variants + offers ─────────────────────────────────────

// Per-category product templates. Each yields a list of (title, price-range).
const PRODUCT_TEMPLATES: Record<string, Array<[string, [number, number]]>> = {
  // FOOD
  lavash: [
    ["Big Lavash (200g)", [22000, 35000]],
    ["Mini Lavash (120g)", [15000, 22000]],
    ["Cheese Lavash", [25000, 38000]],
    ["Chicken Lavash", [28000, 42000]],
  ],
  burger: [
    ["Cheese Burger", [35000, 50000]],
    ["Double Burger", [45000, 65000]],
    ["Chicken Burger", [30000, 45000]],
    ["Veggie Burger", [28000, 42000]],
  ],
  pizza: [
    ["Margarita (30cm)", [60000, 90000]],
    ["Pepperoni (30cm)", [70000, 110000]],
    ["4 Cheese (30cm)", [75000, 115000]],
    ["BBQ Chicken (30cm)", [80000, 120000]],
  ],
  osh: [
    ["Toy oshi (1 porsiya)", [25000, 35000]],
    ["Devzira osh", [30000, 45000]],
    ["Bog'iri osh", [35000, 50000]],
  ],
  somsa: [
    ["Go'shtli somsa", [8000, 14000]],
    ["Tovuq somsa", [9000, 15000]],
    ["Qovurilgan somsa", [10000, 16000]],
  ],
  shashlik: [
    ["Tandir kabob", [22000, 35000]],
    ["Mol shashlik", [25000, 40000]],
    ["Tovuq shashlik", [18000, 28000]],
  ],
  ichimlik: [
    ["Coca-Cola 0.5L", [10000, 14000]],
    ["Pepsi 0.5L", [10000, 14000]],
    ["Fanta 0.5L", [10000, 14000]],
    ["Suv 1L", [5000, 8000]],
    ["Choy (yashil)", [3000, 5000]],
  ],
  dessert: [
    ["Tort bo'lagi", [18000, 28000]],
    ["Muz qaymoq", [12000, 20000]],
    ["Brownie", [15000, 22000]],
  ],
  // MARKETPLACE
  electronics: [
    ["Samsung Galaxy A15", [1800000, 2400000]],
    ["Xiaomi Redmi Note 13", [2200000, 2900000]],
    ["AirPods 3", [1900000, 2500000]],
    ["LG TV 43\"", [3500000, 4500000]],
  ],
  clothing: [
    ["Erkak ko'ylak", [85000, 180000]],
    ["Ayollar futbolka", [55000, 120000]],
    ["Jinsi shim", [150000, 280000]],
    ["Kurtka qishki", [350000, 650000]],
  ],
  home: [
    ["Idish-tovoq to'plami", [180000, 320000]],
    ["Yostiq", [45000, 95000]],
    ["Choydon", [70000, 140000]],
  ],
  books: [
    ["Cho'lpon — Kecha va Kunduz", [25000, 45000]],
    ["O'tkir Hoshimov — Daftar", [22000, 38000]],
    ["Abdulla Qahhor hikoyalar", [18000, 32000]],
  ],
};

interface DemoOffer {
  offerId: string;
  variantId: string;
  productId: string;
  storeId: string;
  storeType: "FOOD" | "MARKETPLACE";
  price: number;
}

async function seedProductsAndOffers(opts: {
  categories: Array<{ id: string; slug: string; type: "FOOD" | "MARKETPLACE" }>;
  stores: DemoStore[];
  brandIds: string[];
}): Promise<DemoOffer[]> {
  console.log("[demo] Seeding products + offers…");
  const offers: DemoOffer[] = [];
  let productCounter = 1;

  // Map category slug (without demo- prefix) → category id
  const catBySlug = new Map(
    opts.categories.map((c) => [c.slug.replace(`${DEMO}-`, ""), c]),
  );

  // For each category, pick from its templates and assign to matching-type stores.
  for (const [catSlug, templates] of Object.entries(PRODUCT_TEMPLATES)) {
    const cat = catBySlug.get(catSlug);
    if (!cat) continue;
    const matchingStores = opts.stores.filter((s) => s.type === cat.type);
    if (matchingStores.length === 0) continue;

    for (const [title, [pMin, pMax]] of templates) {
      // Create the master product. Owner = first matching store's seller.
      const owner = matchingStores[0].ownerId;
      const slug = `${DEMO}-prod-${productCounter++}`;
      const product = await prisma.product.create({
        data: {
          slug,
          title,
          description: cat.type === "FOOD"
            ? "Mazali va sifatli. Toza ingredientlar, yangi tayyorlanadi."
            : "Original mahsulot, kafolat bilan.",
          categoryId: cat.id,
          brandId: cat.type === "MARKETPLACE" ? pick(opts.brandIds) : null,
          status: "ACTIVE",
          createdById: owner,
        },
      });
      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: `${slug.toUpperCase()}-V1`,
          isDefault: true,
        },
      });

      // 1-4 stores carry this product (random subset).
      const carriers = [...matchingStores]
        .sort(() => Math.random() - 0.5)
        .slice(0, 1 + Math.floor(Math.random() * Math.min(3, matchingStores.length)));

      for (const s of carriers) {
        const price = Math.round(rnd(pMin, pMax) / 500) * 500;
        const stock = cat.type === "FOOD" ? 20 + Math.floor(Math.random() * 80) : 5 + Math.floor(Math.random() * 30);
        const offer = await prisma.sellerOffer.create({
          data: {
            storeId: s.id,
            variantId: variant.id,
            price,
            stock,
            isActive: true,
          },
        });
        offers.push({
          offerId: offer.id,
          variantId: variant.id,
          productId: product.id,
          storeId: s.id,
          storeType: cat.type,
          price,
        });
      }
    }
  }
  console.log(`[demo] ${productCounter - 1} products, ${offers.length} offers.`);
  return offers;
}

// ─── Addresses ─────────────────────────────────────────────────────────

async function seedAddresses(customers: DemoUser[]) {
  console.log("[demo] Seeding addresses…");
  let total = 0;
  for (const c of customers) {
    const count = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const { lat, lng } = randomTashkentCoord();
      await prisma.address.create({
        data: {
          userId: c.id,
          label: i === 0 ? "Uy" : pick(["Ish", "Onam", "Do'st"]),
          fullText: `${pick(["Mirobod", "Yunusobod", "Chilonzor", "Yakkasaroy", "Olmazor", "Sergeli", "Mirzo Ulug'bek"])} tumani, ${pick(["Amir Temur", "Mustaqillik", "Navoiy", "Beruniy", "Buyuk Ipak Yo'li"])} ko'chasi, ${1 + Math.floor(Math.random() * 90)}-uy`,
          latitude: lat,
          longitude: lng,
          isDefault: i === 0,
        },
      });
      total++;
    }
  }
  console.log(`[demo] ${total} addresses.`);
}

// ─── Orders ────────────────────────────────────────────────────────────

const ORDER_STATUSES = [
  "PENDING", "ACCEPTED", "PREPARING", "READY", "ON_WAY",
  "DELIVERED", "DELIVERED", "DELIVERED", "DELIVERED", // weighted toward delivered
  "CANCELLED",
] as const;

async function seedOrders(opts: {
  customers: DemoUser[];
  offers: DemoOffer[];
  count: number;
}) {
  console.log("[demo] Seeding orders…");
  let made = 0;
  for (let i = 0; i < opts.count; i++) {
    const customer = pick(opts.customers);
    const offer = pick(opts.offers);
    const address = await prisma.address.findFirst({ where: { userId: customer.id } });
    if (!address) continue;
    const qty = 1 + Math.floor(Math.random() * 3);
    const subtotal = offer.price * qty;
    const deliveryFee = offer.storeType === "FOOD" ? 8000 + Math.floor(Math.random() * 12000) : 12000 + Math.floor(Math.random() * 18000);
    const total = subtotal + deliveryFee;
    const status = pick(ORDER_STATUSES);
    const product = await prisma.product.findUnique({
      where: { id: offer.productId },
      include: { images: { take: 1 } },
    });
    if (!product) continue;

    const now = Date.now();
    const createdAt = new Date(now - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);

    await prisma.order.create({
      data: {
        orderNumber: `DEMO-${String(i + 1).padStart(5, "0")}`,
        userId: customer.id,
        storeId: offer.storeId,
        addressId: address.id,
        status,
        paymentMethod: "COD",
        subtotal, deliveryFee, total,
        distanceKm: rnd(0.5, 8),
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerPhone: customer.phone,
        addressSnapshot: {
          label: address.label, fullText: address.fullText,
          latitude: Number(address.latitude), longitude: Number(address.longitude),
          notes: address.notes,
        },
        acceptedAt: ["ACCEPTED", "PREPARING", "READY", "ON_WAY", "DELIVERED"].includes(status) ? createdAt : null,
        deliveredAt: status === "DELIVERED" ? new Date(createdAt.getTime() + 60 * 60 * 1000) : null,
        cancelledAt: status === "CANCELLED" ? createdAt : null,
        createdAt,
        items: {
          create: [{
            offerId: offer.offerId,
            productTitle: product.title,
            imageUrl: product.images[0]?.url ?? null,
            price: offer.price,
            qty,
            subtotal,
          }],
        },
        history: {
          create: [{ status: "PENDING", changedBy: customer.id, note: "Buyurtma yaratildi", createdAt }],
        },
      },
    });
    made++;
  }
  console.log(`[demo] ${made} orders.`);
}

// ─── Main ──────────────────────────────────────────────────────────────

async function main() {
  const action = process.argv[2] ?? "seed";

  if (action === "clear") {
    await clearDemo();
    return;
  }

  // Ensure system roles exist (base seed should have done this).
  const customerRole = await prisma.role.findUnique({ where: { slug: "customer" } });
  const sellerRole = await prisma.role.findUnique({ where: { slug: "seller" } });
  const courierRole = await prisma.role.findUnique({ where: { slug: "courier" } });
  if (!customerRole || !sellerRole || !courierRole) {
    throw new Error("Run `npm run db:seed` first to create system roles.");
  }

  await clearDemo();

  const { food, market } = await seedCategories();
  const brands = await seedBrands();
  const users = await seedUsers({
    customers: 50,
    sellers: 20,
    couriers: 5,
    customerRoleId: customerRole.id,
    sellerRoleId: sellerRole.id,
    courierRoleId: courierRole.id,
  });
  const stores = await seedStores(users.sellers);
  const allCats = [...food, ...market];
  const offers = await seedProductsAndOffers({
    categories: allCats,
    stores,
    brandIds: brands.map((b) => b.id),
  });
  await seedAddresses(users.customers);
  await seedOrders({ customers: users.customers, offers, count: 30 });

  console.log("\n[demo] ✅ Done.\n");
  console.log("Test login (phone OTP yo'q — direct DB):");
  console.log(`  Birinchi customer phone: 998${users.customers[0].phone}`);
  console.log(`  Birinchi seller phone:   998${users.sellers[0].phone}`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
