type HistoryEntryData = {
  id: string;
  type?: string;
  delta: number;
  note?: string | null;
  createdAt: string;
  product: { id?: string; name: string; sku?: string };
  user: { id?: string; name: string } | null;
};

export function HistoryEntry({ e }: { e: HistoryEntryData }) {
  const actor = e.user?.name ?? (e.delta > 0 ? "System" : "Unknown");
  const verb = e.delta < 0 ? "just took" : e.delta > 0 ? "restocked" : "updated";
  const badge =
    e.delta < 0
      ? "bg-error-container/30 text-on-error-container"
      : e.delta > 0
        ? "bg-secondary-container text-secondary"
        : "bg-surface-container-highest text-on-surface-variant";
  const iconWrap =
    e.delta < 0
      ? "bg-tertiary-container text-tertiary"
      : e.delta > 0
        ? "bg-outline-variant text-white"
        : "bg-secondary-container text-secondary";

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-surface-container-lowest/60 p-4 shadow-sm transition-transform hover:translate-x-2">
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconWrap}`}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
          person
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold">
          {actor} <span className="font-normal text-outline">{verb}</span> {Math.abs(e.delta)}x{" "}
          {e.product.name}
        </p>
        <p className="text-xs text-outline-variant">
          {new Date(e.createdAt).toLocaleString()}
          {e.type && ` · ${e.type}`}
          {e.note && ` · ${e.note}`}
        </p>
      </div>
      <div className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full ${badge}`}>
        {e.delta > 0 ? `+${e.delta} items` : `${e.delta} item${Math.abs(e.delta) === 1 ? "" : "s"}`}
      </div>
    </div>
  );
}

function formatDelta(delta: number) {
  return delta > 0 ? `+${delta} items` : `${delta} item${Math.abs(delta) === 1 ? "" : "s"}`;
}

export { formatDelta };
