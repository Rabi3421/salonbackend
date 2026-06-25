type SalonInput = {
  salonId: string;
  name: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  city?: string;
  state?: string;
  address?: string;
  logoUrl?: string;
  businessType?: string;
};

function s(salonName: string) {
  return salonName || "Our Salon";
}

function homePageSections(salon: SalonInput) {
  const name = s(salon.name);
  return [
    {
      sectionKey: "hero",
      sectionType: "hero",
      enabled: true,
      sortOrder: 0,
      content: {
        eyebrow: "BECAUSE YOU DESERVE TO SHINE",
        title: `Premium Salon Experience For Modern Women`,
        subtitle: `Indulge in luxury treatments crafted by expert stylists. Where beauty meets elegance, and every visit feels like a retreat.`,
      },
      images: [
        { key: "background", url: "https://img.rocket.new/generatedImages/rocket_gen_img_1ab0090f8-1771885425178.png", alt: `${name} interior`, sortOrder: 0 },
      ],
      buttons: [
        { label: "Book Appointment", href: "/book-appointment", type: "primary" as const, enabled: true },
        { label: "Explore Services", href: "/services", type: "secondary" as const, enabled: true },
      ],
      items: [],
      settings: {},
    },
    {
      sectionKey: "trustStats",
      sectionType: "stats-bar",
      enabled: true,
      sortOrder: 1,
      content: {},
      images: [],
      buttons: [],
      items: [
        { icon: "StarIcon", value: "4.9", label: "Rating" },
        { icon: "UsersIcon", value: "6000+", label: "Happy Clients" },
        { icon: "MapPinIcon", value: salon.city || "India", label: "Location" },
      ],
      settings: {},
    },
    {
      sectionKey: "featuredServices",
      sectionType: "services-grid",
      enabled: true,
      sortOrder: 2,
      content: {
        eyebrow: "OUR SERVICES",
        title: "Crafted for Your Beauty",
        subtitle: `From trending hairstyles to relaxing spa treatments — ${name} offers a full range of premium beauty services tailored for you.`,
      },
      images: [],
      buttons: [
        { label: "View All Services", href: "/services", type: "primary" as const, enabled: true },
      ],
      items: [
        { icon: "ScissorsIcon", title: "Hair Styling", description: "Precision cuts, blowouts, and styling for every occasion.", price: "From ₹499" },
        { icon: "SparklesIcon", title: "Bridal Makeup", description: "Complete bridal packages for your special day.", price: "From ₹5,999" },
        { icon: "HandRaisedIcon", title: "Nail Art", description: "Gel nails, nail art, manicure & pedicure services.", price: "From ₹399" },
        { icon: "FaceSmileIcon", title: "Facials & Skin Care", description: "Deep cleansing facials and advanced skin treatments.", price: "From ₹799" },
        { icon: "PaintBrushIcon", title: "Makeup", description: "Party makeup, HD makeup, and airbrush services.", price: "From ₹1,499" },
        { icon: "HeartIcon", title: "Spa & Wellness", description: "Body massage, aromatherapy, and relaxation treatments.", price: "From ₹999" },
      ],
      settings: { showPrices: true, columns: 3 },
    },
    {
      sectionKey: "aboutPreview",
      sectionType: "about-preview",
      enabled: true,
      sortOrder: 3,
      content: {
        eyebrow: "ABOUT US",
        title: `Where Beauty Meets Excellence`,
        subtitle: `At ${name}, we believe every client deserves a personalized beauty experience. Our team of skilled professionals is dedicated to making you look and feel your absolute best.`,
        highlights: [
          "Expert team of certified stylists",
          "Premium international products",
          "Hygienic and relaxing environment",
          "Personalized beauty consultations",
        ],
      },
      images: [
        { key: "about", url: "https://images.unsplash.com/photo-1703792686756-c82bf734c89b", alt: `About ${name}`, sortOrder: 0 },
      ],
      buttons: [
        { label: "Learn More About Us", href: "/about", type: "secondary" as const, enabled: true },
      ],
      items: [],
      settings: {},
    },
    {
      sectionKey: "whyChooseUs",
      sectionType: "features-grid",
      enabled: true,
      sortOrder: 4,
      content: {
        eyebrow: "WHY CHOOSE US",
        title: "The Premium Salon Difference",
        subtitle: "Experience what sets us apart from the rest.",
      },
      images: [],
      buttons: [],
      items: [
        { icon: "ShieldCheckIcon", title: "Hygiene First", description: "Sanitized tools, disposable kits, and clean workstations for every client." },
        { icon: "SparklesIcon", title: "Premium Products", description: "We use only internationally trusted brands for all our treatments." },
        { icon: "UserGroupIcon", title: "Expert Team", description: "Certified professionals with years of experience in the beauty industry." },
        { icon: "ClockIcon", title: "On-Time Service", description: "We respect your time. Pre-booked appointments start on schedule." },
      ],
      settings: { columns: 4 },
    },
    {
      sectionKey: "galleryPreview",
      sectionType: "gallery-preview",
      enabled: true,
      sortOrder: 5,
      content: {
        eyebrow: "OUR WORK",
        title: "A Gallery of Beauty, Confidence & Transformation",
        subtitle: `Step inside our world of premium salon care — from elegant hair styling and glowing facials to bridal transformations and luxury nail art.`,
      },
      images: [
        { key: "gallery-1", url: "https://img.rocket.new/generatedImages/rocket_gen_img_1d8541d94-1775930656878.png", alt: "Hair styling", sortOrder: 0 },
        { key: "gallery-2", url: "https://images.unsplash.com/photo-1684867570683-93a966539191", alt: "Bridal makeup", sortOrder: 1 },
        { key: "gallery-3", url: "https://img.rocket.new/generatedImages/rocket_gen_img_19ff22ea0-1772690996045.png", alt: "Nail art", sortOrder: 2 },
        { key: "gallery-4", url: "https://img.rocket.new/generatedImages/rocket_gen_img_18b6b449e-1772479985833.png", alt: "Facial treatment", sortOrder: 3 },
      ],
      buttons: [
        { label: "View Full Gallery", href: "/gallery", type: "secondary" as const, enabled: true },
      ],
      items: [],
      settings: { maxItems: 8 },
    },
    {
      sectionKey: "testimonials",
      sectionType: "testimonials-carousel",
      enabled: true,
      sortOrder: 6,
      content: {
        eyebrow: "TESTIMONIALS",
        title: "What Our Clients Say",
        subtitle: "Real experiences from our valued clients.",
      },
      images: [],
      buttons: [],
      items: [
        { name: "Priya S.", rating: 5, service: "Bridal Makeup", review: "Absolutely loved my bridal look! The team was so professional and made me feel so special on my big day.", initials: "PS" },
        { name: "Neha P.", rating: 5, service: "Hair Spa", review: "Best hair spa experience ever! My hair feels so soft and healthy now. Will definitely come back.", initials: "NP" },
        { name: "Anita R.", rating: 5, service: "Facial", review: "The gold facial was amazing. My skin is glowing and the staff was very friendly and attentive.", initials: "AR" },
        { name: "Kavita M.", rating: 4, service: "Nail Art", review: "Beautiful nail art designs and very hygienic setup. Love the attention to detail.", initials: "KM" },
      ],
      settings: { autoplay: true },
    },
    {
      sectionKey: "finalCta",
      sectionType: "cta-banner",
      enabled: true,
      sortOrder: 7,
      content: {
        title: "Ready to Transform Your Look?",
        subtitle: `Book your appointment today and experience the ${name} difference.`,
      },
      images: [],
      buttons: [
        { label: "Book Now", href: "/book-appointment", type: "primary" as const, enabled: true },
        { label: "Call Us", href: "tel:", type: "phone" as const, enabled: true },
      ],
      items: [],
      settings: {},
    },
  ];
}

function servicesPageSections(salon: SalonInput) {
  const name = s(salon.name);
  return [
    {
      sectionKey: "hero",
      sectionType: "page-hero",
      enabled: true,
      sortOrder: 0,
      content: {
        eyebrow: "OUR SERVICES",
        title: "Beauty Services Tailored for You",
        subtitle: `Explore our comprehensive range of premium beauty and wellness services at ${name}.`,
      },
      images: [],
      buttons: [],
      items: [],
      settings: {},
    },
    {
      sectionKey: "serviceCategories",
      sectionType: "category-tabs",
      enabled: true,
      sortOrder: 1,
      content: {
        title: "Browse by Category",
      },
      images: [],
      buttons: [],
      items: [
        { key: "all", label: "All" },
        { key: "hair", label: "Hair" },
        { key: "makeup", label: "Makeup" },
        { key: "skin", label: "Skin Care" },
        { key: "nails", label: "Nails" },
        { key: "spa", label: "Spa & Wellness" },
        { key: "bridal", label: "Bridal" },
      ],
      settings: {},
    },
    {
      sectionKey: "servicesIntro",
      sectionType: "text-block",
      enabled: true,
      sortOrder: 2,
      content: {
        title: "Premium Beauty Services",
        description: `At ${name}, we combine skilled craftsmanship with premium products to deliver results that exceed your expectations. Each service is performed by certified professionals in a clean, hygienic environment.`,
      },
      images: [],
      buttons: [],
      items: [],
      settings: {},
    },
    {
      sectionKey: "bookingCta",
      sectionType: "cta-banner",
      enabled: true,
      sortOrder: 3,
      content: {
        title: "Can't Decide? Let Us Help!",
        subtitle: "Book a consultation and our experts will recommend the perfect services for you.",
      },
      images: [],
      buttons: [
        { label: "Book Consultation", href: "/book-appointment", type: "primary" as const, enabled: true },
        { label: "WhatsApp Us", href: "https://wa.me/", type: "whatsapp" as const, enabled: true },
      ],
      items: [],
      settings: {},
    },
    {
      sectionKey: "faq",
      sectionType: "faq-accordion",
      enabled: true,
      sortOrder: 4,
      content: {
        title: "Frequently Asked Questions",
        subtitle: "Common questions about our services.",
      },
      images: [],
      buttons: [],
      items: [
        { question: "Do I need to book in advance?", answer: "While walk-ins are welcome, we recommend booking in advance to ensure your preferred time slot and stylist.", category: "booking" },
        { question: "What products do you use?", answer: "We use premium, internationally trusted brands for all our treatments to ensure the best results for your hair and skin.", category: "products" },
        { question: "How long does a bridal makeup session take?", answer: "A complete bridal makeup session typically takes 2-3 hours, including a trial run. We recommend scheduling a trial session before your wedding day.", category: "services" },
        { question: "Do you offer home services?", answer: "Yes, we offer select home services for bridal makeup and special occasions. Please contact us for availability and pricing.", category: "services" },
      ],
      settings: {},
    },
  ];
}

function aboutPageSections(salon: SalonInput) {
  const name = s(salon.name);
  return [
    {
      sectionKey: "hero",
      sectionType: "page-hero",
      enabled: true,
      sortOrder: 0,
      content: {
        eyebrow: "OUR STORY",
        title: `About ${name}`,
        subtitle: `Discover the passion, people, and purpose behind ${name}.`,
      },
      images: [],
      buttons: [],
      items: [],
      settings: {},
    },
    {
      sectionKey: "story",
      sectionType: "text-with-image",
      enabled: true,
      sortOrder: 1,
      content: {
        title: "Our Journey",
        paragraphs: [
          `${name} was founded with a simple vision — to create a space where beauty, comfort, and professionalism come together.`,
          "We started as a small studio and have grown into a trusted name in the beauty industry, serving thousands of happy clients over the years.",
          "Every service we offer is backed by continuous training, premium products, and a genuine passion for making our clients feel confident and beautiful.",
        ],
      },
      images: [
        { key: "story", url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80", alt: `${name} story`, sortOrder: 0 },
      ],
      buttons: [],
      items: [],
      settings: {},
    },
    {
      sectionKey: "founderMessage",
      sectionType: "quote-block",
      enabled: true,
      sortOrder: 2,
      content: {
        quote: "Beauty is not about looking perfect — it's about feeling confident in your own skin. That's what we strive to deliver every single day.",
        author: salon.ownerName || "Founder",
        designation: "Founder & Lead Stylist",
      },
      images: [
        { key: "founder", url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80", alt: salon.ownerName || "Founder", sortOrder: 0 },
      ],
      buttons: [],
      items: [],
      settings: {},
    },
    {
      sectionKey: "hygienePromise",
      sectionType: "features-grid",
      enabled: true,
      sortOrder: 3,
      content: {
        title: "Our Hygiene Promise",
        subtitle: "Your safety and comfort are our top priority.",
      },
      images: [],
      buttons: [],
      items: [
        { icon: "ShieldCheckIcon", title: "Sterilized Tools", description: "All tools are sterilized after every use using hospital-grade sanitizers." },
        { icon: "SparklesIcon", title: "Disposable Kits", description: "Single-use items for waxing, threading, and facial treatments." },
        { icon: "BeakerIcon", title: "Premium Products", description: "Only dermatologically tested, branded products used in all services." },
        { icon: "HomeIcon", title: "Clean Environment", description: "Regular deep cleaning and sanitization of all workstations and common areas." },
      ],
      settings: { columns: 4 },
    },
    {
      sectionKey: "stats",
      sectionType: "stats-bar",
      enabled: true,
      sortOrder: 4,
      content: {},
      images: [],
      buttons: [],
      items: [
        { value: "5+", label: "Years of Experience" },
        { value: "6000+", label: "Happy Clients" },
        { value: "50+", label: "Services Offered" },
        { value: "15+", label: "Expert Stylists" },
      ],
      settings: {},
    },
    {
      sectionKey: "teamPreview",
      sectionType: "team-grid",
      enabled: true,
      sortOrder: 5,
      content: {
        eyebrow: "OUR TEAM",
        title: "Meet the Experts",
        subtitle: "Our talented team of beauty professionals is here to serve you.",
      },
      images: [],
      buttons: [],
      items: [],
      settings: { showSpecialties: true },
    },
    {
      sectionKey: "cta",
      sectionType: "cta-banner",
      enabled: true,
      sortOrder: 6,
      content: {
        title: "Experience the Difference",
        subtitle: `Visit ${name} and let our experts take care of you.`,
      },
      images: [],
      buttons: [
        { label: "Book Appointment", href: "/book-appointment", type: "primary" as const, enabled: true },
      ],
      items: [],
      settings: {},
    },
  ];
}

function galleryPageSections(salon: SalonInput) {
  const name = s(salon.name);
  return [
    {
      sectionKey: "hero",
      sectionType: "page-hero",
      enabled: true,
      sortOrder: 0,
      content: {
        eyebrow: "OUR WORK",
        title: "A Gallery Of Beauty, Confidence & Transformation",
        subtitle: `Step inside our world of premium salon care — from elegant hair styling and glowing facials to bridal transformations and luxury nail art.`,
      },
      images: [],
      buttons: [],
      items: [],
      settings: {},
    },
    {
      sectionKey: "galleryGrid",
      sectionType: "gallery-filterable",
      enabled: true,
      sortOrder: 1,
      content: {
        title: "Our Portfolio",
      },
      images: [],
      buttons: [],
      items: [
        { title: "Elegant Updo", category: "Hair", image: "https://img.rocket.new/generatedImages/rocket_gen_img_1d8541d94-1775930656878.png" },
        { title: "Bridal Glam", category: "Bridal", image: "https://images.unsplash.com/photo-1684867570683-93a966539191" },
        { title: "Gel Nails", category: "Nails", image: "https://img.rocket.new/generatedImages/rocket_gen_img_19ff22ea0-1772690996045.png" },
        { title: "Gold Facial", category: "Facial", image: "https://img.rocket.new/generatedImages/rocket_gen_img_18b6b449e-1772479985833.png" },
        { title: "Party Makeup", category: "Makeup", image: "https://img.rocket.new/generatedImages/rocket_gen_img_1deedb7f9-1769009931732.png" },
        { title: "Salon Interior", category: "Salon Interior", image: "https://images.unsplash.com/photo-1703792686756-c82bf734c89b" },
      ],
      settings: {
        categories: ["All", "Hair", "Makeup", "Bridal", "Nails", "Facial", "Salon Interior"],
        columns: 3,
      },
    },
    {
      sectionKey: "beforeAfter",
      sectionType: "before-after-slider",
      enabled: false,
      sortOrder: 2,
      content: {
        title: "Before & After Transformations",
        subtitle: "See the magic our team creates.",
      },
      images: [],
      buttons: [],
      items: [],
      settings: {},
    },
    {
      sectionKey: "instagramCta",
      sectionType: "social-cta",
      enabled: true,
      sortOrder: 3,
      content: {
        title: "Follow Us on Instagram",
        subtitle: "Stay updated with our latest work, offers, and behind-the-scenes content.",
        handle: `@${salon.name?.toLowerCase().replace(/[^a-z0-9]/g, "") || "oursalon"}`,
      },
      images: [],
      buttons: [
        { label: "Follow on Instagram", href: "#", type: "link" as const, enabled: true },
      ],
      items: [],
      settings: {},
    },
    {
      sectionKey: "cta",
      sectionType: "cta-banner",
      enabled: true,
      sortOrder: 4,
      content: {
        title: "Love What You See?",
        subtitle: `Book your appointment at ${name} and let us create your perfect look.`,
      },
      images: [],
      buttons: [
        { label: "Book Now", href: "/book-appointment", type: "primary" as const, enabled: true },
      ],
      items: [],
      settings: {},
    },
  ];
}

function contactPageSections(salon: SalonInput) {
  const name = s(salon.name);
  const phone = salon.ownerPhone || "";
  const email = salon.ownerEmail || "";
  const fullAddress = [salon.address, salon.city, salon.state].filter(Boolean).join(", ");
  return [
    {
      sectionKey: "hero",
      sectionType: "page-hero",
      enabled: true,
      sortOrder: 0,
      content: {
        eyebrow: "GET IN TOUCH",
        title: "We'd Love to Hear From You",
        subtitle: `Have a question, need help with booking, or just want to say hello? Reach out to ${name} and we'll get back to you promptly.`,
      },
      images: [],
      buttons: [],
      items: [],
      settings: {},
    },
    {
      sectionKey: "contactInfo",
      sectionType: "contact-cards",
      enabled: true,
      sortOrder: 1,
      content: {},
      images: [],
      buttons: [],
      items: [
        { icon: "MapPinIcon", label: "Visit Us", value: fullAddress || "Our Salon Address" },
        { icon: "PhoneIcon", label: "Call Us", value: phone, href: `tel:${phone}` },
        { icon: "EnvelopeIcon", label: "Email Us", value: email, href: `mailto:${email}` },
        { icon: "ClockIcon", label: "Opening Hours", value: "Mon – Sat: 10:00 AM – 8:00 PM" },
      ],
      settings: {},
    },
    {
      sectionKey: "contactFormText",
      sectionType: "text-block",
      enabled: true,
      sortOrder: 2,
      content: {
        title: "Send Us a Message",
        description: "Fill out the form below and our team will get back to you within 24 hours.",
      },
      images: [],
      buttons: [],
      items: [],
      settings: {},
    },
    {
      sectionKey: "mapSection",
      sectionType: "map-embed",
      enabled: true,
      sortOrder: 3,
      content: {
        title: "Find Us on the Map",
        mapEmbedUrl: "",
      },
      images: [],
      buttons: [],
      items: [],
      settings: {},
    },
    {
      sectionKey: "businessHours",
      sectionType: "hours-table",
      enabled: true,
      sortOrder: 4,
      content: {
        title: "Business Hours",
      },
      images: [],
      buttons: [],
      items: [
        { day: "Monday", hours: "10:00 AM – 8:00 PM", isOpen: true },
        { day: "Tuesday", hours: "10:00 AM – 8:00 PM", isOpen: true },
        { day: "Wednesday", hours: "10:00 AM – 8:00 PM", isOpen: true },
        { day: "Thursday", hours: "10:00 AM – 8:00 PM", isOpen: true },
        { day: "Friday", hours: "10:00 AM – 8:00 PM", isOpen: true },
        { day: "Saturday", hours: "10:00 AM – 8:00 PM", isOpen: true },
        { day: "Sunday", hours: "Closed", isOpen: false },
      ],
      settings: {},
    },
    {
      sectionKey: "cta",
      sectionType: "cta-banner",
      enabled: true,
      sortOrder: 5,
      content: {
        title: "Prefer to Book Online?",
        subtitle: "Skip the call — book your appointment instantly.",
      },
      images: [],
      buttons: [
        { label: "Book Appointment", href: "/book-appointment", type: "primary" as const, enabled: true },
        { label: "WhatsApp Us", href: `https://wa.me/91${phone}`, type: "whatsapp" as const, enabled: true },
      ],
      items: [],
      settings: {},
    },
  ];
}

function bookingPageSections(salon: SalonInput) {
  const name = s(salon.name);
  return [
    {
      sectionKey: "hero",
      sectionType: "page-hero",
      enabled: true,
      sortOrder: 0,
      content: {
        eyebrow: "BOOK APPOINTMENT",
        title: "Book Your Visit",
        subtitle: `Schedule your appointment at ${name} in just a few steps. Choose your service, pick a time, and we'll handle the rest.`,
      },
      images: [],
      buttons: [],
      items: [],
      settings: {},
    },
    {
      sectionKey: "bookingIntro",
      sectionType: "text-block",
      enabled: true,
      sortOrder: 1,
      content: {
        title: "Easy Online Booking",
        description: "Select your preferred services, choose a date and time, and confirm your appointment. It's that simple!",
      },
      images: [],
      buttons: [],
      items: [],
      settings: {},
    },
    {
      sectionKey: "bookingFormText",
      sectionType: "text-block",
      enabled: true,
      sortOrder: 2,
      content: {
        title: "Appointment Details",
        description: "Please fill in your details below. We'll confirm your booking via phone or WhatsApp.",
      },
      images: [],
      buttons: [],
      items: [],
      settings: {},
    },
    {
      sectionKey: "policies",
      sectionType: "policy-list",
      enabled: true,
      sortOrder: 3,
      content: {
        title: "Booking Policies",
      },
      images: [],
      buttons: [],
      items: [
        { title: "Cancellation", description: "Free cancellation up to 2 hours before your appointment." },
        { title: "Late Arrival", description: "If you arrive more than 15 minutes late, your appointment may be rescheduled." },
        { title: "Payment", description: "Payment is collected at the salon after your service is complete." },
        { title: "Walk-ins", description: "Walk-ins are welcome but subject to availability. Booking in advance is recommended." },
      ],
      settings: {},
    },
  ];
}

export function createDefaultSalonWebsiteContentPayload(salon: SalonInput) {
  const name = salon.name || "Our Salon";
  const phone = salon.ownerPhone || "";
  const email = salon.ownerEmail || "";
  const city = salon.city || "";
  const state = salon.state || "";
  const address = salon.address || "";

  return {
    salonId: salon.salonId,
    status: "published" as const,
    version: 1,
    theme: {
      primaryColor: "#0f766e",
      secondaryColor: "#f59e0b",
      accentColor: "#ec4899",
      backgroundColor: "#fffaf7",
      textColor: "#111827",
      fontFamily: "",
    },
    global: {
      salonName: name,
      tagline: `Welcome to ${name}`,
      logoUrl: salon.logoUrl || "",
      faviconUrl: "",
      phone,
      whatsapp: phone.replace(/[^0-9]/g, ""),
      email,
      address,
      city,
      state,
      instagramUrl: "",
      facebookUrl: "",
      googleMapUrl: "",
      openingHours: "Mon – Sat: 10:00 AM – 8:00 PM | Sun: Closed",
    },
    pages: [
      {
        pageKey: "home" as const,
        title: "Home",
        slug: "/",
        seo: {
          metaTitle: `${name} | Premium Beauty & Salon Services`,
          metaDescription: `${name} offers premium hair styling, bridal makeup, facials, nail art and spa services in ${city || "your city"}. Book your appointment today.`,
          keywords: ["salon", "beauty", "hair styling", "bridal makeup", "spa", city].filter(Boolean),
          ogImageUrl: "",
        },
        sections: homePageSections(salon),
      },
      {
        pageKey: "services" as const,
        title: "Services",
        slug: "/services",
        seo: {
          metaTitle: `Services | ${name}`,
          metaDescription: `Explore our full range of beauty services — hair styling, makeup, facials, nail art, spa treatments and bridal packages at ${name}.`,
          keywords: ["salon services", "hair styling", "makeup", "facial", "nail art", "spa"],
          ogImageUrl: "",
        },
        sections: servicesPageSections(salon),
      },
      {
        pageKey: "about" as const,
        title: "About",
        slug: "/about",
        seo: {
          metaTitle: `About Us | ${name}`,
          metaDescription: `Learn about ${name} — our story, team, hygiene standards, and commitment to premium beauty services.`,
          keywords: ["about salon", "beauty professionals", "salon team"],
          ogImageUrl: "",
        },
        sections: aboutPageSections(salon),
      },
      {
        pageKey: "gallery" as const,
        title: "Gallery",
        slug: "/gallery",
        seo: {
          metaTitle: `Gallery | ${name}`,
          metaDescription: `View our portfolio of hair styling, bridal makeup, nail art and beauty transformations at ${name}.`,
          keywords: ["salon gallery", "beauty portfolio", "hair transformations", "bridal looks"],
          ogImageUrl: "",
        },
        sections: galleryPageSections(salon),
      },
      {
        pageKey: "contact" as const,
        title: "Contact",
        slug: "/contact",
        seo: {
          metaTitle: `Contact Us | ${name}`,
          metaDescription: `Get in touch with ${name}. Visit us, call, WhatsApp or email. Located in ${city || "your city"}.`,
          keywords: ["contact salon", "salon address", "book appointment"],
          ogImageUrl: "",
        },
        sections: contactPageSections(salon),
      },
      {
        pageKey: "booking" as const,
        title: "Book Appointment",
        slug: "/book-appointment",
        seo: {
          metaTitle: `Book Appointment | ${name}`,
          metaDescription: `Book your appointment at ${name} online. Choose your service, pick a time, and confirm in seconds.`,
          keywords: ["book salon appointment", "online booking", "salon appointment"],
          ogImageUrl: "",
        },
        sections: bookingPageSections(salon),
      },
    ],
    publishedAt: new Date(),
    isDeleted: false,
  };
}
