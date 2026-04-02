// scripts/seed-library.ts
import 'dotenv/config';
import { ProposalesClient } from '../src/core/proposales-client/proposales-client';
import { CreateProductPayload } from '../src/core/proposales-client/proposales-client.schemas';

// --- Configuration ---
const apiKey = process.env.PROPOSALES_API_KEY;
// Using parseInt with a radix is a best practice for type safety
const companyId = parseInt(process.env.PROPOSALES_COMPANY_ID || '', 10);

if (!apiKey || !companyId) {
  throw new Error('FATAL: PROPOSALES_API_KEY and PROPOSALES_COMPANY_ID must be set in your .env file.');
}

const client = new ProposalesClient(apiKey);

// --- Sample Data ---
// This defines our "hotel's" offerings.
// Using Omit<> makes this type-safe: TypeScript ensures we only define the product-specific parts here.
const sampleHotelProducts: Omit<CreateProductPayload, 'company_id' | 'language'>[] = [
  { title: 'The Grand Ballroom', description: 'Seats up to 100 guests theater-style. Equipped with a modern projector and professional sound system.' },
  { title: 'The "Aspen" Boardroom', description: 'An elegant boardroom for up to 12 people. Features a large LED screen for video conferencing and a magnetic whiteboard.' },
  { title: 'Full-Day Delegate Package', description: 'Includes morning coffee with pastries, a nutritious lunch buffet, and an afternoon coffee break with homemade cookies. Price is per person.' },
  { title: 'AV Equipment: Projector & Screen', description: 'High-quality HD projector and a 2-meter screen, perfect for presentations.' },
  { title: 'Standard Double Room', description: 'One night\'s accommodation for two people in one of our comfortable and modern standard rooms, including breakfast buffet.' },
  { title: 'The Bridal Suite', description: 'Our most luxurious suite with a panoramic view, king-size bed, and jacuzzi. Includes a bottle of champagne upon arrival.' },
  { title: 'Three-Course Dinner Package', description: 'A culinary experience crafted by our head chef. Includes a starter, main course, and dessert. Wine pairing available.' }
];

// --- Seeding Logic ---
async function seed() {
  console.log('🌱 Starting to seed the Proposales content library...');
  
  const existingProducts = await client.getProducts();
  console.log(`🔎 Found ${existingProducts.length} existing products.`);

  for (const product of sampleHotelProducts) {
    const productExists = existingProducts.some(p => p.title.en === product.title);

    if (!productExists) {
      try {
        const payload: CreateProductPayload = {
          ...product,
          company_id: companyId,
          language: 'en', // Changed to English
        };
        console.log(`➕ Creating product: "${payload.title}"...`);
        await client.createProduct(payload);
        console.log(`✅ Product "${payload.title}" created successfully.`);
      } catch (error) {
        console.error(`❌ Failed to create product "${product.title}":`, error);
      }
    } else {
      console.log(`👍 Product "${product.title}" already exists, skipping.`);
    }
  }
  console.log('🎉 Seeding complete!');
}

seed().catch(error => {
    console.error("💥 A critical error occurred during the seeding process:", error);
    process.exit(1);
});