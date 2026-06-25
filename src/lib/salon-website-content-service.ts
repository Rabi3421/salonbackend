import { connectDB } from "@/src/lib/db";
import { SalonWebsiteContent } from "@/src/models/SalonWebsiteContent";
import { createDefaultSalonWebsiteContentPayload } from "@/src/lib/default-salon-website-content";
import { validatePageKey, type PageKey } from "@/src/lib/website-content-utils";

type SalonLike = {
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

export async function createDefaultWebsiteContentForSalon(
  salon: SalonLike,
  createdBy?: string,
) {
  await connectDB();

  const existing = await SalonWebsiteContent.findOne({
    salonId: salon.salonId,
    isDeleted: false,
  }).lean();

  if (existing) return existing;

  const payload = createDefaultSalonWebsiteContentPayload(salon);

  const doc = await SalonWebsiteContent.create({
    ...payload,
    createdBy: createdBy || null,
    updatedBy: createdBy || null,
  });

  return doc.toObject();
}

export async function getWebsiteContentBySalonId(salonId: string) {
  await connectDB();
  return SalonWebsiteContent.findOne({ salonId, isDeleted: false }).lean();
}

export async function ensureWebsiteContentForSalon(
  salon: SalonLike,
  createdBy?: string,
) {
  await connectDB();

  const existing = await SalonWebsiteContent.findOne({
    salonId: salon.salonId,
    isDeleted: false,
  }).lean();

  if (existing) return existing;

  return createDefaultWebsiteContentForSalon(salon, createdBy);
}

export async function updateWebsiteTopLevel(
  salonId: string,
  payload: Record<string, unknown>,
  updatedBy?: string,
) {
  await connectDB();

  const update: Record<string, unknown> = { $inc: { version: 1 } };
  const set: Record<string, unknown> = { updatedBy: updatedBy || null };

  if (payload.theme && typeof payload.theme === "object") {
    for (const [k, v] of Object.entries(payload.theme as Record<string, unknown>)) {
      set[`theme.${k}`] = v;
    }
  }

  if (payload.global && typeof payload.global === "object") {
    for (const [k, v] of Object.entries(payload.global as Record<string, unknown>)) {
      set[`global.${k}`] = v;
    }
  }

  if (payload.status === "published" || payload.status === "draft") {
    set.status = payload.status;
    if (payload.status === "published") {
      set.publishedAt = new Date();
    }
  }

  update.$set = set;

  const doc = await SalonWebsiteContent.findOneAndUpdate(
    { salonId, isDeleted: false },
    update,
    { new: true },
  ).lean();

  return doc;
}

export async function updateWebsitePageContent(
  salonId: string,
  pageKey: PageKey,
  payload: Record<string, unknown>,
  updatedBy?: string,
) {
  await connectDB();

  if (!validatePageKey(pageKey)) return null;

  const set: Record<string, unknown> = {
    updatedBy: updatedBy || null,
  };

  if (payload.title !== undefined) {
    set["pages.$[page].title"] = String(payload.title);
  }
  if (payload.slug !== undefined) {
    set["pages.$[page].slug"] = String(payload.slug);
  }
  if (payload.seo !== undefined && typeof payload.seo === "object") {
    set["pages.$[page].seo"] = payload.seo;
  }
  if (Array.isArray(payload.sections)) {
    set["pages.$[page].sections"] = payload.sections;
  }

  const doc = await SalonWebsiteContent.findOneAndUpdate(
    { salonId, isDeleted: false },
    { $set: set, $inc: { version: 1 } },
    {
      new: true,
      arrayFilters: [{ "page.pageKey": pageKey }],
    },
  ).lean();

  return doc;
}

export async function updateWebsiteSectionContent(
  salonId: string,
  pageKey: PageKey,
  sectionKey: string,
  payload: Record<string, unknown>,
  updatedBy?: string,
) {
  await connectDB();

  if (!validatePageKey(pageKey)) return null;

  const content = await SalonWebsiteContent.findOne({
    salonId,
    isDeleted: false,
  }).lean();

  if (!content) return null;

  const contentObj = content as Record<string, unknown>;
  const pages = contentObj.pages as Array<{
    pageKey: string;
    sections: Array<{ sectionKey: string }>;
  }>;

  const page = pages?.find((p) => p.pageKey === pageKey);
  if (!page) return null;

  const sectionIndex = page.sections?.findIndex(
    (sec) => sec.sectionKey === sectionKey,
  );
  if (sectionIndex === undefined || sectionIndex === -1) return null;

  const pageIndex = pages.indexOf(page);
  const basePath = `pages.${pageIndex}.sections.${sectionIndex}`;
  const set: Record<string, unknown> = {
    updatedBy: updatedBy || null,
  };

  if (payload.enabled !== undefined) set[`${basePath}.enabled`] = Boolean(payload.enabled);
  if (payload.sortOrder !== undefined) set[`${basePath}.sortOrder`] = Number(payload.sortOrder);
  if (payload.content !== undefined) set[`${basePath}.content`] = payload.content;
  if (payload.images !== undefined) set[`${basePath}.images`] = payload.images;
  if (payload.buttons !== undefined) set[`${basePath}.buttons`] = payload.buttons;
  if (payload.items !== undefined) set[`${basePath}.items`] = payload.items;
  if (payload.settings !== undefined) set[`${basePath}.settings`] = payload.settings;

  const doc = await SalonWebsiteContent.findOneAndUpdate(
    { salonId, isDeleted: false },
    { $set: set, $inc: { version: 1 } },
    { new: true },
  ).lean();

  return doc;
}

export async function publishWebsiteContent(
  salonId: string,
  updatedBy?: string,
) {
  await connectDB();

  return SalonWebsiteContent.findOneAndUpdate(
    { salonId, isDeleted: false },
    {
      $set: {
        status: "published",
        publishedAt: new Date(),
        updatedBy: updatedBy || null,
      },
      $inc: { version: 1 },
    },
    { new: true },
  ).lean();
}

export async function resetWebsiteContentToDefault(
  salonId: string,
  salon: SalonLike,
  updatedBy?: string,
) {
  await connectDB();

  const payload = createDefaultSalonWebsiteContentPayload(salon);
  const { version: _v, salonId: _sid, ...setFields } = payload;

  const doc = await SalonWebsiteContent.findOneAndUpdate(
    { salonId, isDeleted: false },
    {
      $set: {
        ...setFields,
        updatedBy: updatedBy || null,
      },
      $inc: { version: 1 },
    },
    { new: true },
  ).lean();

  return doc;
}
