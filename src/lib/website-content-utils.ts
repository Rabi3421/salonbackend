const VALID_PAGE_KEYS = [
  "home",
  "services",
  "about",
  "gallery",
  "contact",
  "booking",
] as const;

export type PageKey = (typeof VALID_PAGE_KEYS)[number];

const VALID_STATUSES = ["draft", "published"] as const;
export type ContentStatus = (typeof VALID_STATUSES)[number];

export function validatePageKey(key: unknown): key is PageKey {
  return typeof key === "string" && VALID_PAGE_KEYS.includes(key as PageKey);
}

export function validateStatus(status: unknown): status is ContentStatus {
  return typeof status === "string" && VALID_STATUSES.includes(status as ContentStatus);
}

type PageLike = { pageKey: string; sections?: SectionLike[] };
type SectionLike = { sectionKey: string };

export function getPage<T extends PageLike>(
  content: { pages?: T[] } | null | undefined,
  pageKey: string,
): T | null {
  if (!content?.pages) return null;
  return content.pages.find((p) => p.pageKey === pageKey) ?? null;
}

export function getSection<T extends SectionLike>(
  page: { sections?: T[] } | null | undefined,
  sectionKey: string,
): T | null {
  if (!page?.sections) return null;
  return page.sections.find((s) => s.sectionKey === sectionKey) ?? null;
}

export function sanitizeWebsiteContentForPublic(
  content: Record<string, unknown>,
): Record<string, unknown> {
  const {
    _id,
    __v,
    createdBy,
    updatedBy,
    isDeleted,
    createdAt,
    updatedAt,
    ...safe
  } = content;
  return safe;
}
