// Seed script to populate the database with dummy data
import 'dotenv/config';
import { db } from '../server/db';
import { 
  companies, 
  contacts, 
  suppliers, 
  products, 
  orders, 
  orderItems, 
  users 
} from '../shared/schema';

const sampleCompanies = [
  {
    name: 'TechCorp Solutions',
    industry: 'Technology',
    website: 'https://techcorp.com',
    phone: '(555) 123-4567',
    email: 'contact@techcorp.com',
    address: '123 Tech Street',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94105',
    country: 'USA',
  },
  {
    name: 'GreenEarth Marketing',
    industry: 'Marketing',
    website: 'https://greenearth.com',
    phone: '(555) 234-5678',
    email: 'hello@greenearth.com',
    address: '456 Eco Avenue',
    city: 'Portland',
    state: 'OR',
    zipCode: '97201',
    country: 'USA',
  }
];

const sampleSuppliers = [
  {
    name: 'PromoWear International',
    contactPerson: 'James Wilson',
    email: 'james@promowear.com',
    phone: '(800) 555-1234',
    address: '100 Industrial Blvd',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90028',
    country: 'USA',
    website: 'https://promowear.com',
    paymentTerms: 'Net 30',
  }
];

async function seed() {
  console.log('Starting database seeding...');

  try {
    // 1. Seed Users (Team Members)
    const teamMembers = [
      { email: 'dev@example.com', firstName: 'Developer', lastName: 'Local', role: 'admin' },
      { email: 'sarah@swag.com', firstName: 'Sarah', lastName: 'Johnson', role: 'user' },
      { email: 'mike@swag.com', firstName: 'Mike', lastName: 'Chen', role: 'user' },
      { email: 'alex@swag.com', firstName: 'Alex', lastName: 'Rodriguez', role: 'manager' },
      { email: 'emily@swag.com', firstName: 'Emily', lastName: 'Davis', role: 'user' },
      { email: 'david@swag.com', firstName: 'David', lastName: 'Wilson', role: 'user' },
      { email: 'lisa@swag.com', firstName: 'Lisa', lastName: 'Thompson', role: 'user' },
    ];

    let salesRep;
    const insertedUsers = [];
    
    for (const member of teamMembers) {
      const existingUser = await db.query.users.findFirst({
        columns: { id: true, email: true },
        where: (users, { eq }) => eq(users.email, member.email)
      });

      if (existingUser) {
        insertedUsers.push(existingUser);
        console.log('✓ User already exists:', existingUser.email);
        if (member.email === 'dev@example.com') {
          salesRep = existingUser;
        }
      } else {
        const [newUser] = await db.insert(users).values(member).returning();
        insertedUsers.push(newUser);
        console.log('✓ User seeded:', newUser.email);
        if (member.email === 'dev@example.com') {
          salesRep = newUser;
        }
      }
    }
    
    console.log(`✓ Total users in database: ${insertedUsers.length}`);

    // 2. Seed Companies
    const insertedCompanies = await db.insert(companies).values(sampleCompanies).returning();
    console.log('✓ Companies seeded:', insertedCompanies.length);

    // 3. Seed Contacts (linked to first company)
    const [contact] = await db.insert(contacts).values({
      companyId: insertedCompanies[0].id,
      firstName: 'Sarah',
      lastName: 'Johnson',
      title: 'Marketing Director',
      email: 'sarah.johnson@techcorp.com',
      phone: '(555) 123-4567',
      isPrimary: true
    }).returning();
    console.log('✓ Contact seeded:', contact.email);

    // 4. Seed Suppliers
    const [supplier] = await db.insert(suppliers).values(sampleSuppliers).returning();
    console.log('✓ Supplier seeded:', supplier.name);

    // 5. Seed Products
    const [product] = await db.insert(products).values({
      name: 'Classic Cotton T-Shirt',
      sku: 'TEE-001',
      supplierId: supplier.id,
      description: 'High-quality 100% cotton t-shirt',
      basePrice: '8.50',
      minimumQuantity: 100,
      leadTime: 7
    }).returning();
    console.log('✓ Product seeded:', product.name);

    // 6. Seed Order
    const [order] = await db.insert(orders).values({
      orderNumber: `ORD-${Date.now()}`,
      companyId: insertedCompanies[0].id,
      contactId: contact.id,
      assignedUserId: salesRep.id,
      status: 'quote',
      total: '850.00',
      subtotal: '850.00',
      notes: 'Initial test order'
    }).returning();
    console.log('✓ Order seeded:', order.orderNumber);

    // 7. Seed Order Item
    await db.insert(orderItems).values({
      orderId: order.id,
      productId: product.id,
      quantity: 100,
      unitPrice: '8.50',
      totalPrice: '850.00'
    });
    console.log('✓ Order Items seeded');

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
