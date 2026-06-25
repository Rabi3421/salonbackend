import { SalonInventoryProduct } from "@/src/models/SalonInventoryProduct";
import { SalonStockAdjustment } from "@/src/models/SalonStockAdjustment";

async function generateSequential(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Model: any,
  field: string,
  prefix: string,
  salonId: string,
): Promise<string> {
  const latest = await Model.findOne({
    salonId,
    [field]: { $regex: `^${prefix}` },
  })
    .sort({ [field]: -1 })
    .select(field)
    .lean();

  let nextNumber = 1;

  if (latest && typeof (latest as Record<string, unknown>)[field] === "string") {
    const lastPart = ((latest as Record<string, unknown>)[field] as string).replace(prefix, "");
    const parsed = parseInt(lastPart, 10);
    if (!isNaN(parsed)) nextNumber = parsed + 1;
  }

  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
}

export async function generateInventoryProductNo(salonId: string): Promise<string> {
  const year = new Date().getFullYear();
  return generateSequential(SalonInventoryProduct, "productNo", `PRD-${year}-`, salonId);
}

export async function generateStockAdjustmentNo(salonId: string): Promise<string> {
  const year = new Date().getFullYear();
  return generateSequential(SalonStockAdjustment, "adjustmentNo", `STK-${year}-`, salonId);
}
