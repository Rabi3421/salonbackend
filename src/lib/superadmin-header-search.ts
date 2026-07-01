export const SUPERADMIN_HEADER_SEARCH_EVENT = "superadmin:header-search";

export type SuperadminSearchSection =
  | "salons"
  | "plans"
  | "subscriptions"
  | "payments"
  | "enquiries"
  | "audit-logs";

export type SuperadminHeaderSearchDetail = {
  section: SuperadminSearchSection;
  search: string;
};

const searchableSections: SuperadminSearchSection[] = [
  "salons",
  "plans",
  "subscriptions",
  "payments",
  "enquiries",
  "audit-logs",
];

export function getSuperadminSearchSection(pathname: string): SuperadminSearchSection {
  const section = pathname.split("/").filter(Boolean)[2];
  return searchableSections.includes(section as SuperadminSearchSection)
    ? (section as SuperadminSearchSection)
    : "salons";
}

export function getSuperadminSearchPath(section: SuperadminSearchSection) {
  return `/superadmin/dashboard/${section}`;
}

export function readInitialSuperadminSearch() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("search") ?? "";
}
