type ProductUnitLike = {
  unit?: string;
  unitLabel?: string | null;
  category?: string;
};

const UNIT_LABELS: Record<string, string> = {
  PIECE: "pcs",
  BOX: "boxes",
  PACK: "packs",
  BOTTLE: "bottles",
  CUP: "cups",
  KG: "kg",
  G: "g",
};

export function formatProductUnit(product: ProductUnitLike) {
  if (product.unitLabel?.trim()) return product.unitLabel.trim();
  if (product.unit && UNIT_LABELS[product.unit]) return UNIT_LABELS[product.unit];
  if (product.category && /drink/i.test(product.category)) return "bottles";
  if (product.category && /noodle/i.test(product.category)) return "cups";
  if (product.category && /fruit/i.test(product.category)) return "pcs";
  return "packs";
}

export function expiryStatus(expiryDate: string | Date | null | undefined) {
  if (!expiryDate) return null;
  const exp = new Date(expiryDate);
  const now = new Date();
  const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / 86400000);
  if (daysLeft < 0) return { label: "EXPIRED", tone: "error" as const, daysLeft };
  if (daysLeft <= 7) return { label: "EXPIRING SOON", tone: "warning" as const, daysLeft };
  return null;
}

export const PRODUCT_UNITS = ["PIECE", "BOX", "PACK", "BOTTLE", "CUP", "KG", "G"] as const;
