export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface-subtle py-5 px-4 text-center">
      <p className="text-sm text-foreground-muted">
        © {year} PriceCompare India. All rights reserved.
      </p>
    </footer>
  );
}
