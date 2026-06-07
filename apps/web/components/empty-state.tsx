export function EmptyState({ icon = "inbox", title, message }: { icon?: string; title: string; message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] bg-surface-container-low py-16 text-center">
      <span className="material-symbols-outlined mb-4 text-5xl text-outline opacity-50">{icon}</span>
      <h3 className="font-headline text-xl font-bold text-on-surface">{title}</h3>
      {message && <p className="mt-2 max-w-sm text-sm text-on-surface-variant">{message}</p>}
    </div>
  );
}
