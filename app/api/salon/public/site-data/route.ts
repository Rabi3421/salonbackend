import { NextResponse } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { resolveSalonFromRequest } from "@/src/lib/tenant/resolve-salon";
import { SalonService } from "@/src/models/SalonService";
import { SalonPackage } from "@/src/models/SalonPackage";
import { SalonStaff } from "@/src/models/SalonStaff";
import { SalonSettings } from "@/src/models/SalonSettings";

const SEEDED_PLACEHOLDER_VALUES = new Set([
  "Demo Luxury Salon",
  "Rosé Luxe",
  "Rosé Luxe Salon",
  "RoseLuxe Salon",
]);

function cleanText(value: unknown): string {
  return String(value ?? "").trim();
}

function settingsTextOrSalonDefault(value: unknown, salonDefault: unknown): string {
  const text = cleanText(value);
  const fallback = cleanText(salonDefault);

  if (!text) return fallback;
  if (fallback && SEEDED_PLACEHOLDER_VALUES.has(text) && text !== fallback) return fallback;

  return text;
}

function replaceSeededPlaceholders(value: string, replacement: string): string {
  let next = value;
  for (const placeholder of SEEDED_PLACEHOLDER_VALUES) {
    next = next.replaceAll(placeholder, replacement);
  }
  return next;
}

function isSeededSocialLink(href: unknown): boolean {
  const text = cleanText(href).toLowerCase();
  return text.includes("demoluxurysalon") || text.includes("roseluxe");
}

export async function GET(request: Request) {
  try {
    const salonResult = await resolveSalonFromRequest(request);
    if (!salonResult.success) {
      return errorResponse(salonResult.error, salonResult.status);
    }

    await connectDB();

    const salonId = salonResult.salon.salonId as string;
    const salon = salonResult.salon;

    const [services, packages, staff, settings] = await Promise.all([
      SalonService.find({ salonId, status: "active" })
        .sort({ sortOrder: 1, createdAt: -1 })
        .select("name slug category description price duration isFeatured")
        .lean(),
      SalonPackage.find({ salonId, status: "active" })
        .sort({ sortOrder: 1, createdAt: -1 })
        .select("name slug description price tag bestFor includedServices isHighlighted validityDays")
        .lean(),
      SalonStaff.find({ salonId, status: "active" })
        .sort({ createdAt: 1 })
        .select("name role designation experience specialties avatar")
        .lean(),
      SalonSettings.findOne({ salonId }).lean(),
    ]);

    const settingsObj = settings as Record<string, unknown> | null;

    const rawAboutStats = (settingsObj?.aboutStats as { value: string; label: string }[]) ?? [];
    const filteredAboutStats = rawAboutStats.filter(
      (stat) => !(stat.label?.toLowerCase().includes("happy") && stat.value === "6000+"),
    );
    const happyClients = filteredAboutStats.find((stat) =>
      stat.label?.toLowerCase().includes("happy"),
    )?.value;

    const brandName = settingsTextOrSalonDefault(
      settingsObj?.displayName ?? settingsObj?.businessName,
      salon.name,
    );
    const fullName = settingsTextOrSalonDefault(settingsObj?.businessName, salon.name);
    const description = cleanText(settingsObj?.description);

    const brand = {
      name: brandName,
      fullName,
      tagline: `Welcome to ${brandName}`,
      shortDescription: description,
      logoText: brandName,
      rating: "4.9",
      happyClients: String(happyClients ?? "Clients"),
      location: settingsTextOrSalonDefault(settingsObj?.city, salon.city),
    };

    const contact = {
      phone: String(settingsObj?.phone ?? salon.ownerPhone ?? ""),
      whatsapp: String(settingsObj?.phone ?? salon.ownerPhone ?? "").replace(/[^0-9]/g, ""),
      email: String(settingsObj?.email ?? salon.ownerEmail ?? ""),
      address: [
        settingsObj?.address ?? salon.address ?? "",
        settingsObj?.city ?? salon.city ?? "",
        settingsObj?.state ?? salon.state ?? "",
        settingsObj?.pincode ?? "",
      ].filter(Boolean).join(", "),
      city: String(settingsObj?.city ?? salon.city ?? ""),
      state: String(settingsObj?.state ?? salon.state ?? ""),
      openingHours: [] as string[],
      mapLabel: `${brand.name}, ${brand.location}`,
    };

    const bh = (settingsObj?.businessHours ?? []) as {
      day: string;
      isOpen: boolean;
      openTime: string;
      closeTime: string;
    }[];
    const openDays = bh.filter((d) => d.isOpen);
    const closedDays = bh.filter((d) => !d.isOpen);
    if (openDays.length > 0) {
      const firstOpen = openDays[0];
      contact.openingHours.push(
        `${openDays.map((d) => d.day.slice(0, 3)).join(", ")}: ${firstOpen.openTime} – ${firstOpen.closeTime}`,
      );
    }
    if (closedDays.length > 0) {
      contact.openingHours.push(`${closedDays.map((d) => d.day).join(", ")}: Closed`);
    }

    const siteServices = (services as Record<string, unknown>[]).map((s) => ({
      slug: String(s.slug ?? ""),
      title: String(s.name ?? ""),
      category: String(s.category ?? ""),
      description: String(s.description ?? ""),
      price: `From ₹${Number(s.price ?? 0).toLocaleString("en-IN")}`,
      duration: `${s.duration ?? 0} min`,
      featured: s.isFeatured === true,
    }));

    const categories = ["All", ...new Set(siteServices.map((s) => s.category))];

    const sitePackages = (packages as Record<string, unknown>[]).map((p) => ({
      name: String(p.name ?? ""),
      price: `₹${Number(p.price ?? 0).toLocaleString("en-IN")}`,
      tag: String(p.tag ?? ""),
      bestFor: String(p.bestFor ?? ""),
      highlighted: p.isHighlighted === true,
      includes: (p.includedServices as string[]) ?? [],
    }));

    const team = (staff as Record<string, unknown>[]).map((s) => ({
      name: String(s.name ?? ""),
      role: String(s.designation ?? s.role ?? ""),
      experience: String(s.experience ?? ""),
      specialties: (s.specialties as string[]) ?? [],
      bio: "",
      initials: String(s.name ?? "").charAt(0),
    }));

    const about = {
      title: replaceSeededPlaceholders(String(settingsObj?.aboutTitle ?? ""), brandName),
      paragraphs: ((settingsObj?.aboutParagraphs as string[]) ?? []).map((paragraph) =>
        replaceSeededPlaceholders(String(paragraph), brandName),
      ),
      stats: filteredAboutStats,
    };

    const whyChooseUs = (settingsObj?.whyChooseUs as { icon: string; title: string; description: string }[]) ?? [];
    const gallery = (settingsObj?.gallery as { title: string; category: string; image: string; height?: string }[]) ?? [];
    const reviews = (settingsObj?.reviews as { name: string; rating: number; service: string; review: string; initials: string }[]) ?? [];
    const faqs = (settingsObj?.faqs as { question: string; answer: string; category: string }[]) ?? [];
    const socialLinks = ((settingsObj?.socialLinks as { label: string; href: string }[]) ?? [])
      .filter((link) => !isSeededSocialLink(link.href));

    const policies = {
      privacy: settingsObj?.privacyPolicy ?? null,
      terms: settingsObj?.termsOfService ?? null,
      cancellation: settingsObj?.cancellationPolicy ?? null,
    };

    return successResponse({
      brand,
      contact,
      services: siteServices,
      serviceCategories: categories,
      packages: sitePackages,
      team,
      whyChooseUs,
      about,
      gallery,
      reviews,
      faqs,
      socialLinks,
      policies,
      navLinks: [
        { label: "Home", href: "/" },
        { label: "Services", href: "/services" },
        { label: "About", href: "/about" },
        { label: "Gallery", href: "/gallery" },
        { label: "Contact", href: "/contact" },
      ],
    });
  } catch {
    return errorResponse("Unable to load site data.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
