/**
 * Salon Demo Data Seed Script
 *
 * Run: npx tsx src/scripts/seed-salon-demo-data.ts
 *
 * Creates a demo salon with sample data for all modules.
 * Idempotent — safe to run multiple times.
 * Blocked in production unless ALLOW_DEMO_SEED=true.
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const SALON_ID = "SALON-2026-0001";
const OWNER_EMAIL = "owner@demo-salon.com";
const OWNER_PASSWORD = "Demo@12345";

async function main() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_DEMO_SEED !== "true"
  ) {
    console.error("❌ Seed blocked in production. Set ALLOW_DEMO_SEED=true to override.");
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI not set.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("✅ Connected to MongoDB");

  const db = mongoose.connection.db!;

  // ── 1. Salon ──
  const salonsColl = db.collection("salons");
  const existingSalon = await salonsColl.findOne({ salonId: SALON_ID });
  if (!existingSalon) {
    await salonsColl.insertOne({
      salonId: SALON_ID,
      name: "Demo Luxury Salon",
      slug: "demo-luxury-salon",
      ownerName: "Ananya Sharma",
      ownerEmail: OWNER_EMAIL,
      ownerPhone: "9876500000",
      businessType: "salon",
      address: "14 Park Street",
      city: "Ahmedabad",
      state: "Gujarat",
      pincode: "380001",
      gstNumber: "",
      logoUrl: "",
      websiteStatus: "active",
      accountStatus: "active",
      subscriptionStatus: "active",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("  ✅ Salon created");
  } else {
    console.log("  ⏭️ Salon exists");
  }

  // ── 2. Owner user ──
  const usersColl = db.collection("salonusers");
  const existingOwner = await usersColl.findOne({ salonId: SALON_ID, email: OWNER_EMAIL });
  if (!existingOwner) {
    const hash = await bcrypt.hash(OWNER_PASSWORD, 12);
    await usersColl.insertOne({
      salonId: SALON_ID,
      name: "Ananya Sharma",
      email: OWNER_EMAIL,
      phone: "9876500000",
      passwordHash: hash,
      role: "salon_owner",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("  ✅ Owner user created");
  } else {
    console.log("  ⏭️ Owner user exists");
  }

  // ── 3. Services ──
  const servicesColl = db.collection("salonservices");
  const serviceData = [
    { name: "Hair Styling", category: "Hair", price: 1500, duration: 60, slug: "hair-styling", isFeatured: true },
    { name: "Hair Spa", category: "Hair", price: 2500, duration: 45, slug: "hair-spa" },
    { name: "Hair Color", category: "Hair", price: 3000, duration: 90, slug: "hair-color" },
    { name: "Facial Treatment", category: "Skin", price: 2000, duration: 45, slug: "facial-treatment", isFeatured: true },
    { name: "Cleanup", category: "Skin", price: 800, duration: 30, slug: "cleanup" },
    { name: "Manicure & Pedicure", category: "Nails", price: 800, duration: 60, slug: "manicure-pedicure", isFeatured: true },
    { name: "Bridal Makeup", category: "Bridal", price: 12000, duration: 180, slug: "bridal-makeup", isFeatured: true },
    { name: "Party Makeup", category: "Makeup", price: 3000, duration: 60, slug: "party-makeup" },
  ];
  for (const s of serviceData) {
    const exists = await servicesColl.findOne({ salonId: SALON_ID, slug: s.slug });
    if (!exists) {
      await servicesColl.insertOne({
        salonId: SALON_ID, ...s, description: `Professional ${s.name} service.`, status: "active",
        assignedStaffIds: [], assignedStaffNames: [], sortOrder: 0,
        createdAt: new Date(), updatedAt: new Date(),
      });
    }
  }
  console.log("  ✅ Services seeded");

  // ── 4. Packages ──
  const pkgColl = db.collection("salonpackages");
  const pkgData = [
    { name: "Bridal Glow Package", slug: "bridal-glow", price: 18999, tag: "Most Popular", bestFor: "Bride-to-be", isHighlighted: true, includedServices: ["Facial", "Hair Spa", "Manicure & Pedicure", "Bridal Makeup"] },
    { name: "Monthly Grooming", slug: "monthly-grooming", price: 4999, bestFor: "Monthly self-care", includedServices: ["Cleanup", "Hair Spa", "Manicure"] },
    { name: "Party Ready", slug: "party-ready", price: 6999, bestFor: "Events", includedServices: ["Party Makeup", "Hair Styling"] },
    { name: "Hair Care Package", slug: "hair-care", price: 3999, bestFor: "Hair nourishment", includedServices: ["Hair Spa", "Hair Styling"] },
  ];
  for (const p of pkgData) {
    const exists = await pkgColl.findOne({ salonId: SALON_ID, slug: p.slug });
    if (!exists) {
      await pkgColl.insertOne({
        salonId: SALON_ID, ...p, description: `${p.name} bundle.`, status: "active",
        includedServiceIds: [], validityDays: 30, sortOrder: 0,
        createdAt: new Date(), updatedAt: new Date(),
      });
    }
  }
  console.log("  ✅ Packages seeded");

  // ── 5. Customers ──
  const custColl = db.collection("saloncustomers");
  const custData = [
    { customerNo: "CUST-2026-0001", name: "Priya Sharma", phone: "9876543210", email: "priya@email.com", gender: "female", source: "website" },
    { customerNo: "CUST-2026-0002", name: "Neha Patel", phone: "9876543211", email: "neha@email.com", gender: "female", source: "phone" },
    { customerNo: "CUST-2026-0003", name: "Aisha Khan", phone: "9876543212", gender: "female", source: "website" },
    { customerNo: "CUST-2026-0004", name: "Kavita Mehta", phone: "9876543213", email: "kavita@email.com", gender: "female", source: "walk_in" },
    { customerNo: "CUST-2026-0005", name: "Riya Shah", phone: "9876543214", gender: "female", source: "whatsapp" },
    { customerNo: "CUST-2026-0006", name: "Simran Kaur", phone: "9876543215", email: "simran@email.com", gender: "female", source: "referral" },
    { customerNo: "CUST-2026-0007", name: "Pooja Desai", phone: "9876543216", gender: "female", source: "dashboard" },
    { customerNo: "CUST-2026-0008", name: "Anjali Verma", phone: "9876543217", gender: "female", source: "phone" },
  ];
  for (const c of custData) {
    const exists = await custColl.findOne({ salonId: SALON_ID, phone: c.phone });
    if (!exists) {
      await custColl.insertOne({
        salonId: SALON_ID, ...c, status: "active", totalVisits: 0, totalSpent: 0, dueAmount: 0,
        favoriteServices: [], notes: "", allergies: "", hairSkinNotes: "",
        createdAt: new Date(), updatedAt: new Date(),
      });
    }
  }
  console.log("  ✅ Customers seeded");

  // ── 6. Staff ──
  const staffColl = db.collection("salonstaffs");
  const staffData = [
    { staffNo: "STF-2026-0001", name: "Ananya Sharma", email: "ananya@demo-salon.com", phone: "9876500001", role: "owner", designation: "Salon Owner & Senior Stylist", specialties: ["Hair Styling", "Hair Spa"] },
    { staffNo: "STF-2026-0002", name: "Meera Kapoor", email: "meera@demo-salon.com", phone: "9876500002", role: "manager", designation: "Bridal Makeup Artist", specialties: ["Bridal Makeup", "Party Makeup"] },
    { staffNo: "STF-2026-0003", name: "Riya Patel", email: "riya@demo-salon.com", phone: "9876500003", role: "receptionist", designation: "Nail Artist", specialties: ["Nail Art", "Manicure", "Pedicure"] },
    { staffNo: "STF-2026-0004", name: "Sana Khan", email: "sana@demo-salon.com", phone: "9876500004", role: "stylist", designation: "Skin & Facial Expert", specialties: ["Facials", "Cleanup"] },
    { staffNo: "STF-2026-0005", name: "Kavya Mehta", email: "kavya@demo-salon.com", phone: "9876500005", role: "accountant", designation: "Hair Color Specialist", specialties: ["Hair Color", "Highlights"] },
  ];
  for (const s of staffData) {
    const exists = await staffColl.findOne({ salonId: SALON_ID, email: s.email });
    if (!exists) {
      await staffColl.insertOne({
        salonId: SALON_ID, ...s, status: "active", employmentType: "full_time",
        experience: "5+ Years", workingDays: [], assignedServiceIds: [], assignedServiceNames: [],
        salary: 0, commissionPercent: 0, appointmentsToday: 0, completedServicesThisMonth: 0,
        revenueThisMonth: 0, rating: 4.5,
        createdAt: new Date(), updatedAt: new Date(),
      });
    }
  }
  console.log("  ✅ Staff seeded");

  // ── 7. Inventory ──
  const invColl = db.collection("saloninventoryproducts");
  const invData = [
    { productNo: "PRD-2026-0001", name: "L'Oréal Hair Spa Cream", sku: "LOR-HSC-500", brand: "L'Oréal", category: "hair_care", unit: "jar", currentStock: 8, minStockLevel: 5, purchasePrice: 850, sellingPrice: 1200 },
    { productNo: "PRD-2026-0002", name: "Keratin Shampoo", sku: "MTX-KS-1L", brand: "Matrix", category: "hair_care", unit: "bottle", currentStock: 3, minStockLevel: 5, purchasePrice: 650 },
    { productNo: "PRD-2026-0003", name: "Facial Kit", sku: "VLCC-FK", brand: "VLCC", category: "skin_care", unit: "kit", currentStock: 12, minStockLevel: 4, purchasePrice: 450 },
    { productNo: "PRD-2026-0004", name: "Nail Polish Set", sku: "OPI-NP-12", brand: "OPI", category: "nails", unit: "set", currentStock: 6, minStockLevel: 3, purchasePrice: 2200, sellingPrice: 3500 },
    { productNo: "PRD-2026-0005", name: "Waxing Roll", sku: "RCA-WR-100", brand: "Rica", category: "consumables", unit: "roll", currentStock: 0, minStockLevel: 3, purchasePrice: 550 },
    { productNo: "PRD-2026-0006", name: "Threading Cotton", sku: "LIL-TC-500", brand: "Lily's", category: "consumables", unit: "spool", currentStock: 15, minStockLevel: 5, purchasePrice: 120 },
    { productNo: "PRD-2026-0007", name: "Bridal Makeup Fixer", sku: "MAC-FIX-100", brand: "MAC", category: "makeup", unit: "bottle", currentStock: 4, minStockLevel: 3, purchasePrice: 1800, sellingPrice: 2500 },
    { productNo: "PRD-2026-0008", name: "Disposable Towels", sku: "CW-DT-100", brand: "CleanWrap", category: "consumables", unit: "pack", currentStock: 20, minStockLevel: 5, purchasePrice: 350 },
  ];
  for (const p of invData) {
    const exists = await invColl.findOne({ salonId: SALON_ID, sku: p.sku });
    if (!exists) {
      const stockState = p.currentStock <= 0 ? "out_of_stock" : p.currentStock <= p.minStockLevel ? "low_stock" : "in_stock";
      await invColl.insertOne({
        salonId: SALON_ID, ...p, description: "", status: "active", stockState,
        inventoryValue: p.currentStock * p.purchasePrice, notes: "",
        sellingPrice: p.sellingPrice ?? 0, supplierName: "", supplierPhone: "",
        createdAt: new Date(), updatedAt: new Date(),
      });
    }
  }
  console.log("  ✅ Inventory seeded");

  // ── 8. Settings (upsert with full content) ──
  const settingsColl = db.collection("salonsettings");
  const contentFields = {
    businessName: "Demo Luxury Salon",
    displayName: "Demo Luxury Salon",
    phone: "9876500000",
    email: OWNER_EMAIL,
    address: "14 Park Street, Bodakdev",
    city: "Ahmedabad",
    state: "Gujarat",
    pincode: "380054",
    description: "A luxury sanctuary where beauty meets elegance. Premium salon services crafted for modern women.",
    logo: "",
    businessHours: [
      { day: "Monday", isOpen: true, openTime: "09:00", closeTime: "20:00" },
      { day: "Tuesday", isOpen: true, openTime: "09:00", closeTime: "20:00" },
      { day: "Wednesday", isOpen: true, openTime: "09:00", closeTime: "20:00" },
      { day: "Thursday", isOpen: true, openTime: "09:00", closeTime: "20:00" },
      { day: "Friday", isOpen: true, openTime: "09:00", closeTime: "20:00" },
      { day: "Saturday", isOpen: true, openTime: "09:00", closeTime: "20:00" },
      { day: "Sunday", isOpen: true, openTime: "10:00", closeTime: "18:00" },
    ],
    bookingRules: { allowOnlineBooking: true, requireApproval: true, advanceBookingDays: 30, minAdvanceHours: 2, slotIntervalMinutes: 30, cancellationWindowHours: 4, allowWalkIns: true },
    notifications: { appointmentConfirmation: true, appointmentReminder: true, paymentReceipt: true, enquiryAlert: true, lowStockAlert: false, whatsappEnabled: false, smsEnabled: false, emailEnabled: true },
    aboutTitle: "Crafting Beauty Since 2014",
    aboutParagraphs: [
      "At Demo Luxury Salon, beauty is not just a service — it is an experience. We created a calm, premium space where every client feels confident, cared for, and beautifully transformed.",
      "Our team combines modern styling techniques, premium products, strict hygiene practices, and personalized consultation to deliver salon experiences that feel luxurious and reliable.",
    ],
    aboutStats: [
      { value: "10+", label: "Years Experience" },
      { value: "20+", label: "Expert Stylists" },
      { value: "6000+", label: "Happy Clients" },
      { value: "15+", label: "Awards Won" },
    ],
    whyChooseUs: [
      { icon: "StarIcon", title: "Premium Quality", description: "Only the finest products and techniques for exceptional results every single time." },
      { icon: "ShieldCheckIcon", title: "Hygienic Products", description: "100% sanitized tools and premium branded products for your safety and care." },
      { icon: "ClockIcon", title: "On-Time Service", description: "We respect your time with punctual appointments and zero unnecessary waiting." },
      { icon: "HeartIcon", title: "Client Satisfaction", description: "Your happiness is our top priority — always. Every visit, every treatment." },
    ],
    gallery: [
      { title: "Luxury Salon Interior", category: "Salon Interior", image: "https://images.unsplash.com/photo-1703792686756-c82bf734c89b", height: "h-72" },
      { title: "Elegant Hair Styling", category: "Hair", image: "https://images.unsplash.com/photo-1560066984-138dadb4c035", height: "h-56" },
      { title: "Bridal Glow", category: "Bridal", image: "https://images.unsplash.com/photo-1684867570683-93a966539191", height: "h-64" },
      { title: "Premium Facial", category: "Facial", image: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9", height: "h-56" },
      { title: "Modern Nail Art", category: "Nails", image: "https://images.unsplash.com/photo-1604654894610-df63bc536371", height: "h-64" },
      { title: "Party Makeup", category: "Makeup", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e", height: "h-72" },
    ],
    reviews: [
      { name: "Priya M.", rating: 5, service: "Bridal Makeup", review: "Absolutely loved my bridal look! Meera understood exactly what I wanted. The whole experience was stress-free and magical.", initials: "P" },
      { name: "Neha S.", rating: 5, service: "Hair Spa", review: "Best hair spa I have ever had. My hair felt silky smooth for weeks. The ambiance is so relaxing too.", initials: "N" },
      { name: "Aisha K.", rating: 5, service: "Facial Treatment", review: "Sana is incredibly skilled. My skin glowed for days after the facial. Highly recommend their premium facials.", initials: "A" },
      { name: "Kavita R.", rating: 4, service: "Nail Art", review: "Beautiful nail art designs! Riya is so creative and patient. The only reason for 4 stars is the slight wait time.", initials: "K" },
      { name: "Riya D.", rating: 5, service: "Hair Color", review: "Kavya did an amazing balayage. The color blending was perfect and looked very natural. Will definitely come back!", initials: "R" },
      { name: "Simran P.", rating: 5, service: "Party Makeup", review: "Got ready for my anniversary dinner here. The makeup lasted all night and I received so many compliments!", initials: "S" },
    ],
    faqs: [
      { question: "How do I book an appointment?", answer: "You can book online through our website, call us, or send a WhatsApp message. Walk-ins are also welcome based on availability.", category: "Booking" },
      { question: "What are your salon timings?", answer: "We are open Monday to Saturday from 9:00 AM to 8:00 PM, and Sunday from 10:00 AM to 6:00 PM.", category: "General" },
      { question: "Do you offer bridal packages?", answer: "Yes! We have comprehensive bridal packages that include pre-bridal sessions, trials, and the final bridal look. Contact us for customized packages.", category: "Services" },
      { question: "What products do you use?", answer: "We use premium international brands including L'Oréal, Matrix, Wella, MAC, and OPI for all our services.", category: "Products" },
      { question: "Can I cancel or reschedule my appointment?", answer: "Yes, you can cancel or reschedule up to 4 hours before your appointment time. Late cancellations may incur a charge.", category: "Booking" },
      { question: "Do you offer home services?", answer: "Currently, we provide services only at our salon location. However, bridal home services can be arranged for groups.", category: "Services" },
      { question: "What payment methods do you accept?", answer: "We accept cash, UPI, credit/debit cards, and bank transfers. Online payment links can also be shared.", category: "Payments" },
      { question: "Is there parking available?", answer: "Yes, we have complimentary parking available for our clients at the salon premises.", category: "General" },
    ],
    socialLinks: [
      { label: "Instagram", href: "https://instagram.com/demoluxurysalon" },
      { label: "Facebook", href: "https://facebook.com/demoluxurysalon" },
      { label: "YouTube", href: "https://youtube.com/@demoluxurysalon" },
    ],
    privacyPolicy: {
      title: "Privacy Policy",
      description: "How we collect, use, and protect your personal information.",
      lastUpdated: "2026-01-01",
      sections: [
        { title: "Information We Collect", content: "We collect personal information such as your name, phone number, email address, and service preferences when you book appointments, make enquiries, or visit our salon." },
        { title: "How We Use Your Information", content: ["To confirm and manage your appointments", "To send service reminders and follow-ups", "To process payments and maintain billing records", "To improve our services based on your feedback"] },
        { title: "Data Security", content: "We implement industry-standard security measures to protect your personal data. Your information is stored securely and is only accessible to authorized salon staff." },
        { title: "Contact", content: "For privacy-related queries, please contact us at our salon phone number or email address." },
      ],
    },
    termsOfService: {
      title: "Terms of Service",
      description: "Terms and conditions for using our salon services.",
      lastUpdated: "2026-01-01",
      sections: [
        { title: "Appointments", content: "Appointments are confirmed upon booking. Please arrive 5-10 minutes before your scheduled time. Late arrivals may result in reduced service time." },
        { title: "Payments", content: "Payment is due upon completion of services. We accept cash, UPI, cards, and bank transfers. Prices are inclusive of applicable taxes." },
        { title: "Service Guarantee", content: "We strive for 100% client satisfaction. If you are not satisfied with a service, please inform us within 24 hours and we will address your concern." },
        { title: "Liability", content: "Please inform your stylist of any allergies or skin conditions before services. The salon is not liable for reactions not disclosed prior to treatment." },
      ],
    },
    cancellationPolicy: {
      title: "Cancellation & Refund Policy",
      description: "Our policy on appointment cancellations and refunds.",
      lastUpdated: "2026-01-01",
      notice: "Please read our cancellation policy carefully before booking.",
      sections: [
        { title: "Cancellation Window", content: "Appointments can be cancelled or rescheduled free of charge up to 4 hours before the scheduled time." },
        { title: "Late Cancellation", content: "Cancellations made less than 4 hours before the appointment may be subject to a cancellation fee of up to 25% of the service cost." },
        { title: "No-Shows", content: "Clients who do not show up for their appointment without prior notice may be charged the full service amount." },
        { title: "Refunds", content: "Refunds for prepaid services are processed within 5-7 business days. Package/membership refunds are subject to terms at the time of purchase." },
      ],
    },
    updatedAt: new Date(),
  };
  await settingsColl.updateOne(
    { salonId: SALON_ID },
    { $set: contentFields, $setOnInsert: { salonId: SALON_ID, createdAt: new Date() } },
    { upsert: true },
  );
  console.log("  ✅ Settings + content seeded");

  console.log("\n🎉 Demo salon seed complete!");
  console.log(`   Salon ID: ${SALON_ID}`);
  console.log(`   Login:    ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
