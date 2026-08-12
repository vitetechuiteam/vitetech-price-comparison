import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="flex h-14 items-center">
          <Link href="/" className="flex items-center no-underline hover:no-underline">
            <Image
              src="/logo.svg"
              alt="PriceCompare India"
              width={160}
              height={36}
              priority
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
