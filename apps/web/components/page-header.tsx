export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-headline text-5xl font-extrabold tracking-tight text-primary md:text-6xl">
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-on-surface-variant">{subtitle}</p>}
      </div>
      {children}
    </header>
  );
}
