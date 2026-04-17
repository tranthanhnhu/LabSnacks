import Image from "next/image";
import Link from "next/link";

export default function RolesPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-surface px-6 pb-20 pt-28 font-body text-on-surface selection:bg-primary-container selection:text-on-primary-container">
      <header className="fixed left-0 right-0 top-0 z-50 flex w-full items-center justify-between bg-pink-50/60 px-6 py-3 shadow-sm backdrop-blur-md">
        <span className="font-headline text-2xl font-black tracking-tight text-primary">Kawaii Lab</span>
        <Link
          href="/login"
          className="rounded-full bg-gradient-to-r from-primary to-primary-container px-6 py-2 font-headline text-sm font-bold text-on-primary shadow-md transition active:scale-95"
        >
          Sign in
        </Link>
      </header>

      <div className="pointer-events-none absolute -left-12 top-[15%] h-64 w-64 rounded-full bg-surface-container-high opacity-60 blur-[80px]" />
      <div className="pointer-events-none absolute -right-20 bottom-[10%] h-80 w-80 rounded-full bg-secondary-container opacity-40 blur-[100px]" />

      <div className="absolute right-[15%] top-[22%] z-10 rotate-12">
        <span className="rounded-full bg-tertiary-container px-4 py-2 text-sm font-bold text-on-tertiary-container shadow-lg">
          New Protocol!
        </span>
      </div>

      <div className="relative z-20 mb-12 max-w-2xl text-center">
        <h1 className="font-headline text-5xl font-black leading-tight tracking-tight text-on-surface md:text-6xl">
          Pick your <span className="italic text-primary">role</span>
        </h1>
        <p className="mt-4 text-lg font-medium text-on-surface-variant">
          Set your access level before opening snack data — Admin, Inventory Manager, or Staff.
        </p>
      </div>

      <div className="relative z-20 grid w-full max-w-5xl gap-8 md:grid-cols-2">
        <div className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl bg-surface-container-low p-8 shadow-[0_12px_32px_rgba(69,34,63,0.08)] transition hover:-translate-y-1">
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary-container/20 transition-transform duration-700 group-hover:scale-150" />
          <div className="relative z-10 mb-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-surface-container-highest shadow-sm">
              <span className="material-symbols-outlined text-4xl text-primary">science</span>
            </div>
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface">Staff</h2>
            <p className="text-on-surface-variant">View inventory, create restock requests, and get notifications.</p>
          </div>
          <div className="z-10 mt-auto flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-widest text-primary/60">staff@kawaii.lab</span>
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-full bg-surface-container-highest px-6 py-3 font-headline font-bold text-primary transition hover:bg-primary hover:text-on-primary"
            >
              Get started
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </Link>
          </div>
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_1XOsaZyOc5RpRwG8SrG5BaAN4yFqxDKEOCDYB1KS0hDUTamYCh_1s5XkrwVUqVeN3KBjPr6pTzbM5zVGyX-yzAE_wzX33TBWNQeGA0p-qry2TfWA-QBYmghEeTKrrqdo-c53epKlAyFR6BQjaM1sYl80TND4sGc3_alMJr45j_5_qyD7hmfu0ss7ZTmvEE6wvzX6uUqtPV9WnmkZExesQsb5unQcjfK6gx58wJzbqhUOpWDnohEhj_gYyNxTSoxsjXLlcKM1p9g"
            alt="Mascot"
            width={128}
            height={128}
            className="pointer-events-none absolute -bottom-4 -right-4 h-32 w-32 rotate-12 object-contain opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        </div>

        <div className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-primary/5 bg-surface-container-lowest p-8 shadow-[0_12px_32px_rgba(69,34,63,0.08)] transition hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary-container/10 to-primary-container/5 opacity-50" />
          <div className="relative z-10 mb-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-container shadow-md">
              <span className="material-symbols-outlined text-4xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
            </div>
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface">Admin / Manager</h2>
            <p className="text-on-surface-variant">Adjust stock, approve restocks, and view analytics (by permission).</p>
          </div>
          <div className="z-10 mt-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold uppercase tracking-widest text-secondary">manager@ / admin@</span>
              <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
            </div>
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-container px-8 py-3 font-headline font-bold text-on-primary shadow-lg shadow-primary/20 transition active:scale-95"
            >
              Open dashboard
              <span className="material-symbols-outlined text-xl">bolt</span>
            </Link>
          </div>
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_eIBgoaxn6AL6Pqy9NeIyBpBxxCXn8brG0Xnq6_o0tsUMrc2zA4eTpV4CFKITHDcHrPKj4As2ImZ2F5a_0oRL0sZ98M5aRAA1yqF8PtTvSzOqA7kmvxqmKPHNHL6sDQWoWDy4hojOFNxG4xgNLaIP7IRQeFx3w-v30vncX4vIpRaplXZZLvAg8LO3cQlHD5VkViYHchUjPernho7F12DO6JYEGnaHW8fUNbWCqaVRifMtvOZK069YWn8spYqQR_iP25rMLI8Zm6k"
            alt="Snack bot"
            width={144}
            height={144}
            className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 -rotate-12 object-contain transition-transform duration-500 group-hover:rotate-0"
          />
        </div>
      </div>

      <footer className="relative z-20 mt-16 flex items-center gap-2 text-sm font-medium text-on-surface-variant/70">
        <span className="material-symbols-outlined text-lg">help_outline</span>
        Need help? Contact a Lab Assistant.
      </footer>
    </main>
  );
}
