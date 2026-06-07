"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { apiUrl, ApiError } from "@/lib/api";
import { toast } from "@/lib/toast";

export default function ImportProductsPage() {
  const { token, user } = useAuth();
  const qc = useQueryClient();
  const canImport = user?.role.slug === "ADMIN" || user?.role.slug === "MANAGER";
  const [result, setResult] = useState<{ created: number; errors: { row: number; sku: string; message: string }[] } | null>(null);

  const importCsv = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch(apiUrl("/api/products/import"), {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new ApiError(data?.error ?? "IMPORT_FAILED", res.status, data?.details);
      return data as { created: number; errors: { row: number; sku: string; message: string }[] };
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success(`Imported ${data.created} product(s).`);
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e) => toast.fromError(e, "Import failed."),
  });

  if (!canImport) {
    return (
      <div className="rounded-[var(--radius-lg)] bg-error-container/20 p-8 text-center font-headline">
        Only managers can import products.
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href="/inventory" className="text-sm font-bold text-primary hover:underline">
          ← Inventory
        </Link>
        <h1 className="mt-2 font-headline text-4xl font-extrabold text-primary">Batch Import</h1>
        <p className="text-on-surface-variant">Upload a CSV file to create multiple snacks at once.</p>
      </div>

      <section className="rounded-[var(--radius-lg)] bg-surface-container-low p-6 sticker-shadow">
        <a
          href={apiUrl("/api/products/import/template")}
          className="text-sm font-bold text-secondary hover:underline"
          onClick={(e) => {
            e.preventDefault();
            void fetch(apiUrl("/api/products/import/template"), {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            })
              .then((r) => r.text())
              .then((csv) => {
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "products-template.csv";
                a.click();
                URL.revokeObjectURL(url);
              });
          }}
        >
          Download CSV template
        </a>
        <div className="mt-4">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importCsv.mutate(f);
            }}
            className="w-full rounded-xl bg-surface-container-highest px-4 py-3 ring-1 ring-outline-variant/15"
          />
        </div>
        {importCsv.isPending && <p className="mt-2 text-sm text-on-surface-variant">Importing…</p>}
      </section>

      {result && (
        <section className="rounded-[var(--radius-lg)] bg-surface-container-lowest p-6 sticker-shadow">
          <h2 className="font-headline font-bold">Import result</h2>
          <p className="mt-2 text-sm">Created: {result.created}</p>
          {result.errors.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm text-error">
              {result.errors.map((err) => (
                <li key={`${err.row}-${err.sku}`}>
                  Row {err.row} ({err.sku}): {err.message}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
