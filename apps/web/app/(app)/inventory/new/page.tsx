"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { apiFetch, ApiError, apiUrl } from "@/lib/api";

type Product = {
  id: string;
  sku: string;
  name: string;
};

export default function NewSnackPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const canCreate = user?.role.slug === "ADMIN" || user?.role.slug === "MANAGER";
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("Drink");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [initialQuantity, setInitialQuantity] = useState("10");
  const [lowStockThreshold, setLowStockThreshold] = useState("10");
  const [error, setError] = useState<string | null>(null);

  const existing = useQuery({
    queryKey: ["products"],
    queryFn: () => apiFetch<Product[]>("/api/products", { token }),
    enabled: !!token,
  });

  const skuTaken = useMemo(() => {
    const list = existing.data ?? [];
    return sku.trim() && list.some((p) => p.sku.toLowerCase() === sku.trim().toLowerCase());
  }, [existing.data, sku]);

  const create = useMutation({
    mutationFn: async () => {
      await apiFetch("/api/products", {
        method: "POST",
        token,
        body: JSON.stringify({
          name,
          sku,
          category,
          description: description || undefined,
          imageUrl: imageUrl || undefined,
          initialQuantity: Number(initialQuantity),
          lowStockThreshold: Number(lowStockThreshold),
        }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      router.push("/inventory");
    },
    onError: (e) => {
      if (e instanceof ApiError) setError(e.message);
      else setError("Could not create product.");
    },
  });

  const upload = useMutation({
    mutationFn: async (f: File) => {
      const form = new FormData();
      form.set("file", f);
      const res = await fetch(apiUrl("/api/uploads"), {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new ApiError(data?.error ?? "UPLOAD_FAILED", res.status, data?.details);
      return data as { url: string };
    },
    onSuccess: (d) => setImageUrl(apiUrl(d.url)),
    onError: () => setError("Image upload failed."),
  });

  if (!canCreate) {
    return (
      <div className="rounded-[var(--radius-lg)] bg-error-container/20 p-8 text-center font-headline">
        Only managers can create new snacks.
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <header className="mb-8">
        <h1 className="font-headline text-5xl font-extrabold tracking-tight text-primary md:text-6xl">
          Add New Protocol
        </h1>
        <p className="mt-2 text-on-surface-variant">
          Create a new snack and optionally provide an image link.
        </p>
      </header>

      <div className="rounded-[var(--radius-lg)] bg-surface-container-low p-8 sticker-shadow">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Snack name">
            <input
              className="w-full rounded-xl bg-surface-container-highest px-4 py-4 ring-1 ring-outline-variant/15 focus:ring-2 focus:ring-primary"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cola Classic"
            />
          </Field>
          <Field label="SKU">
            <input
              className="w-full rounded-xl bg-surface-container-highest px-4 py-4 ring-1 ring-outline-variant/15 focus:ring-2 focus:ring-primary"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. COLA-001"
            />
            {skuTaken && <p className="mt-1 text-xs font-bold text-error">SKU already exists.</p>}
          </Field>
          <Field label="Category">
            <input
              className="w-full rounded-xl bg-surface-container-highest px-4 py-4 ring-1 ring-outline-variant/15 focus:ring-2 focus:ring-primary"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Drink / Fruit / Noodles / Snack"
            />
          </Field>
          <Field label="Image URL (optional)">
            <input
              className="w-full rounded-xl bg-surface-container-highest px-4 py-4 ring-1 ring-outline-variant/15 focus:ring-2 focus:ring-primary"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </Field>
          <Field label="Upload image (optional)">
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                className="w-full rounded-xl bg-surface-container-highest px-4 py-4 ring-1 ring-outline-variant/15"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                disabled={!file || upload.isPending}
                onClick={() => file && upload.mutate(file)}
                className="rounded-xl bg-primary px-4 py-4 font-headline font-bold text-on-primary disabled:opacity-60"
              >
                Upload
              </button>
            </div>
            <p className="mt-1 text-xs text-on-surface-variant">Max 5MB. Managers only.</p>
          </Field>
          <Field label="Initial quantity">
            <input
              type="number"
              min={0}
              className="w-full rounded-xl bg-surface-container-highest px-4 py-4 ring-1 ring-outline-variant/15 focus:ring-2 focus:ring-primary"
              value={initialQuantity}
              onChange={(e) => setInitialQuantity(e.target.value)}
            />
          </Field>
          <Field label="Low-stock threshold">
            <input
              type="number"
              min={0}
              className="w-full rounded-xl bg-surface-container-highest px-4 py-4 ring-1 ring-outline-variant/15 focus:ring-2 focus:ring-primary"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Description (optional)">
          <textarea
            className="w-full rounded-xl bg-surface-container-highest px-4 py-4 ring-1 ring-outline-variant/15 focus:ring-2 focus:ring-primary"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What makes this snack special?"
          />
        </Field>

        {error && <p className="mt-3 text-sm font-bold text-error">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={!name || !sku || skuTaken || create.isPending}
            onClick={() => {
              setError(null);
              create.mutate();
            }}
            className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary-container py-4 font-headline font-extrabold text-on-primary shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-60"
          >
            Create snack
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl bg-surface-container-highest px-6 py-4 font-headline font-bold text-primary ring-1 ring-outline-variant/15 hover:scale-105 active:scale-95 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="pl-2 text-xs font-bold uppercase tracking-widest text-outline">{label}</div>
      <div className="mt-2">{children}</div>
    </label>
  );
}

