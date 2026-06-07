import { parse } from "csv-parse/sync";
import { ProductUnit } from "@prisma/client";
import type { ProductService } from "./ProductService.js";
import { prisma } from "../lib/prisma.js";

export type ImportRow = {
  sku: string;
  name: string;
  category: string;
  quantity: number;
  threshold: number;
  unit?: ProductUnit;
  unitLabel?: string;
  expiryDate?: Date;
  description?: string;
};

export type ImportResult = {
  created: number;
  errors: { row: number; sku: string; message: string }[];
};

const VALID_UNITS = new Set<string>(Object.values(ProductUnit));

export class ImportService {
  constructor(private readonly products: ProductService) {}

  templateCsv() {
    return "sku,name,category,quantity,threshold,unit,unitLabel,expiryDate,description\nCOLA-002,New Cola,Drink,20,5,BOTTLE,lon,,Sparkling drink\n";
  }

  async importCsv(content: string): Promise<ImportResult> {
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    const errors: ImportResult["errors"] = [];
    let created = 0;

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const line = i + 2;
      try {
        const parsed = this.parseRow(row);
        const existing = await prisma.product.findUnique({ where: { sku: parsed.sku } });
        if (existing) {
          errors.push({ row: line, sku: parsed.sku, message: "SKU already exists" });
          continue;
        }
        await this.products.create({
          name: parsed.name,
          sku: parsed.sku,
          category: parsed.category,
          description: parsed.description,
          initialQuantity: parsed.quantity,
          lowStockThreshold: parsed.threshold,
          unit: parsed.unit,
          unitLabel: parsed.unitLabel,
          expiryDate: parsed.expiryDate,
        });
        created++;
      } catch (e) {
        errors.push({
          row: line,
          sku: row.sku ?? "?",
          message: e instanceof Error ? e.message : "Invalid row",
        });
      }
    }

    return { created, errors };
  }

  private parseRow(row: Record<string, string>): ImportRow {
    const sku = row.sku?.trim();
    const name = row.name?.trim();
    const category = row.category?.trim();
    if (!sku || !name || !category) throw new Error("sku, name, category required");

    const quantity = Number(row.quantity ?? 0);
    const threshold = Number(row.threshold ?? 5);
    if (Number.isNaN(quantity) || quantity < 0) throw new Error("invalid quantity");
    if (Number.isNaN(threshold) || threshold < 0) throw new Error("invalid threshold");

    let unit: ProductUnit | undefined;
    if (row.unit?.trim()) {
      const u = row.unit.trim().toUpperCase();
      if (!VALID_UNITS.has(u)) throw new Error(`invalid unit: ${row.unit}`);
      unit = u as ProductUnit;
    }

    let expiryDate: Date | undefined;
    if (row.expiryDate?.trim()) {
      expiryDate = new Date(row.expiryDate.trim());
      if (Number.isNaN(expiryDate.getTime())) throw new Error("invalid expiryDate");
    }

    return {
      sku,
      name,
      category,
      quantity,
      threshold,
      unit,
      unitLabel: row.unitLabel?.trim() || undefined,
      expiryDate,
      description: row.description?.trim() || undefined,
    };
  }
}
