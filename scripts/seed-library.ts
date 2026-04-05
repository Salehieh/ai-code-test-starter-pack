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
  // --- ACCOMMODATION ---
  { title: 'Standard Double Room', description: 'Comfortable 25sqm room with a queen bed, city view, and high-speed WiFi. Perfect for conference attendees.' },
  { title: 'Executive Suite', description: 'Spacious 50sqm suite with a separate living area, king bed, and premium amenities. Ideal for VIPs and speakers.' },
  { title: 'The Bridal Suite', description: 'Our most luxurious 80sqm suite featuring a panoramic ocean view, soaking tub, and complimentary champagne. Designed specifically for newlyweds.' },
  { title: 'Family Room', description: 'Connecting rooms accommodating up to 4 guests. Includes kid-friendly amenities.' },

  // --- EVENT SPACES (MEETING & CONFERENCES) ---
  { title: 'The Executive Boardroom', description: 'Intimate meeting space for up to 15 people. Features a mahogany table, ergonomic chairs, and built-in video conferencing.' },
  { title: 'Breakout Room Alpha', description: 'Flexible space for up to 30 people. Can be configured in classroom, U-shape, or theater style.' },
  { title: 'Breakout Room Beta', description: 'Flexible space for up to 30 people. Features natural daylight and interactive whiteboards.' },
  { title: 'The Grand Auditorium (Main Stage)', description: 'Massive 500sqm hall seating up to 400 guests. Features a raised main stage, theatrical lighting, and dual projection screens. Perfect for product launches.' },
  { title: 'The Atrium Foyer', description: 'Bright, open space ideal for registration desks, networking, and coffee breaks. Capacity: 200 standing.' },

  // --- EVENT SPACES (WEDDINGS & SOCIAL) ---
  { title: 'The Oceanfront Terrace', description: 'Stunning outdoor venue overlooking the sea. Ideal for wedding ceremonies or sunset cocktail receptions. Capacity: 150.' },
  { title: 'The Crystal Ballroom', description: 'Elegant indoor ballroom with crystal chandeliers and a dedicated dance floor. Perfect as an indoor backup for ceremonies or for grand seated dinners. Capacity: 200.' },
  { title: 'The Secret Garden', description: 'Intimate, lush outdoor garden space. Perfect for small rehearsal dinners or private cocktail hours. Capacity: 60.' },

  // --- FOOD & BEVERAGE (CATERING) ---
  { title: 'All-Day Coffee Service', description: 'Continuous supply of premium coffee, tea, and sparkling water throughout the event day.' },
  { title: 'Morning & Afternoon Fika', description: 'Traditional Swedish coffee breaks featuring fresh pastries, fruit, and smoothies.' },
  { title: 'Working Lunch Buffet', description: 'Efficient, high-quality buffet lunch designed for conferences. Includes hot dishes, salads, and desserts.' },
  { title: 'Networking Finger Food Lunch', description: 'Standing lunch with premium canapés, sliders, and bowl food. Encourages mingling.' },
  { title: 'Welcome Dinner / Rehearsal Dinner Package', description: 'A relaxed, informal 2-course dinner package perfect for welcoming guests on the first evening. Includes house wine and beer.' },
  { title: 'Premium 3-Course Seated Dinner', description: 'Elegant, plated 3-course meal. Our culinary team accommodates all dietary requirements (vegan, gluten-free, vegetarian) with bespoke alternatives.' },
  { title: 'Farewell Brunch Buffet', description: 'A lavish morning-after brunch featuring a live omelet station, fresh pastries, mimosas, and artisan coffee. Perfect for concluding a multi-day event.' },
  { title: 'Midnight Snack Station', description: 'Late-night comfort food (sliders, fries, pizza bites) served at 11 PM to keep the party going.' },

  // --- BEVERAGE PACKAGES ---
  { title: 'Standard Open Bar (4 Hours)', description: 'Unlimited house wine, local beer, and soft drinks for a 4-hour duration.' },
  { title: 'Premium Open Bar Until Midnight', description: 'Unlimited premium spirits, signature cocktails, fine wines, and craft beers. Keeps the celebration going until the clock strikes twelve.' },
  { title: 'Champagne Toast', description: 'One glass of premium champagne per guest, served during speeches or ceremony conclusion.' },

  // --- AUDIO VISUAL (AV) & EQUIPMENT ---
  { title: 'Standard AV Package (Projector & Screen)', description: 'High-definition projector, 100-inch screen, and basic PA system for presentations.' },
  { title: 'Conference AV Package (All Rooms)', description: 'Comprehensive AV setup including projectors, screens, and wireless microphones for a main stage and up to 3 breakout rooms.' },
  { title: 'High-Speed Dedicated Event WiFi', description: 'Upgraded, dedicated bandwidth ensuring seamless streaming and connectivity for up to 500 devices.' },
  { title: 'Live Band Entertainment Package', description: 'Professional 5-piece live band playing a mix of jazz, pop, and dance hits. Includes stage setup and sound engineering.' },
  { title: 'DJ & Lighting Package', description: 'Professional DJ, turntables, and dynamic dance floor lighting.' },

  // --- SERVICES & EXTRAS (DISTRACTORS / SPECIFIC REQUESTS) ---
  { title: 'Registration Desk & Staffing', description: 'A fully branded registration desk staffed by two professional hosts for guest check-in and badge printing.' },
  { title: 'Bespoke Floral Arrangements', description: 'Custom floral design by our in-house florist. Includes ceremony arch, bridal bouquets, and elegant table centerpieces for the dinner.' },
  { title: 'Exclusive Bridal Party Spa Access', description: 'Private half-day access to the wellness center for up to 6 people. Includes massages, champagne, and use of the thermal pools.' },
  { title: 'Airport VIP Transfer', description: 'Luxury black car service from the airport to the hotel.' },
  { title: '18-Hole Golf Tournament', description: 'Organized tournament on our championship golf course, including cart rental and lunch boxes.' }
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