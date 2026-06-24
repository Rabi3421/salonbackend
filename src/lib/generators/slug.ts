import { Salon } from "@/src/models/Salon";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function generateUniqueSalonSlug(name: string): Promise<string> {
  const base = toSlug(name);

  if (!base) {
    throw new Error("Cannot generate slug from empty name");
  }

  const existing = await Salon.findOne({ slug: base }).select("slug").lean();

  if (!existing) {
    return base;
  }

  const slugPattern = new RegExp(`^${base}(-\\d+)?$`);
  const matches = await Salon.find({ slug: slugPattern })
    .select("slug")
    .lean();

  let maxSuffix = 1;

  for (const doc of matches) {
    if (typeof doc.slug === "string") {
      const match = doc.slug.match(/-(\d+)$/);

      if (match) {
        const num = parseInt(match[1], 10);

        if (num >= maxSuffix) {
          maxSuffix = num + 1;
        }
      }
    }
  }

  return `${base}-${maxSuffix}`;
}
