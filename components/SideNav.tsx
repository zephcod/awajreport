"use client";

/**
 * Responsive navigation shell shared by the client report and admin areas:
 * fixed sidebar on desktop (lg+), hamburger + drawer on mobile.
 * Styled after the Awaj ET leadgen admin app.
 */
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/app/login/actions";

export interface NavItem {
  href: string;
  label: string;
  code: string;
}

/** Longest matching href wins, so "/admin" isn't active on "/admin/issues". */
function activeHref(pathname: string, items: NavItem[]): string | undefined {
  return items
    .filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

function Brand({
  subtitle,
  homeHref,
}: {
  subtitle: string;
  /** When set, the brand block links here (e.g. /admin for quick access). */
  homeHref?: string;
}) {
  const content = (
    <>
      <p className="font-display text-xl font-bold tracking-tight">
        Awaj<span className="text-gold"> ET</span>
      </p>
      <p className="mt-1 font-mono text-[10px] tracking-[0.18em] text-white/40 uppercase">
        {subtitle}
      </p>
    </>
  );
  if (homeHref) {
    return (
      <Link
        href={homeHref}
        className="block rounded-md transition-opacity hover:opacity-80"
      >
        {content}
      </Link>
    );
  }
  return <div>{content}</div>;
}

function NavLinks({
  items,
  pathname,
  large = false,
}: {
  items: NavItem[];
  pathname: string;
  large?: boolean;
}) {
  const active = activeHref(pathname, items);
  return (
    <nav className={`flex flex-col gap-1 ${large ? "mt-8" : "px-3"}`}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-3 rounded-md px-3 transition-colors ${
            large ? "py-3 text-[15px]" : "py-2.5 text-sm"
          } ${
            item.href === active
              ? "bg-white/10 font-semibold text-gold"
              : "text-white/70 hover:bg-white/5 hover:text-white"
          }`}
        >
          <span className="font-mono text-[10px] text-white/30">{item.code}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function SignOut() {
  return (
    <form action={logout}>
      <button className="font-mono text-[10px] tracking-[0.14em] text-white/40 uppercase transition-colors hover:text-amber">
        🔒 Sign out
      </button>
    </form>
  );
}

export function Sidebar({
  items,
  subtitle,
  homeHref,
}: {
  items: NavItem[];
  subtitle: string;
  homeHref?: string;
}) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col bg-navy text-white lg:flex print:!hidden">
      <div className="px-6 pt-8 pb-6">
        <Brand subtitle={subtitle} homeHref={homeHref} />
      </div>
      <NavLinks items={items} pathname={pathname} />
      <div className="mt-auto px-6 pb-8">
        <p className="font-mono text-[10px] leading-relaxed tracking-wider text-white/30 uppercase">
          <span className="text-gold/60">Awaj ET</span>
          <br />
          All in one solutions
          <br />
          From pitch to profit
          <br />
        </p>
        <div className="mt-5">
          <SignOut />
        </div>
      </div>
    </aside>
  );
}

export function MobileNav({
  items,
  subtitle,
  homeHref,
}: {
  items: NavItem[];
  subtitle: string;
  homeHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer whenever navigation happens.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between bg-navy px-4 py-3 lg:hidden print:!hidden">
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger
          aria-label="Open menu"
          className="rounded-md p-2 text-white/80 hover:bg-white/10 hover:text-white"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path
              d="M3 5h14M3 10h14M3 15h14"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-navy/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-navy p-6 text-white shadow-2xl outline-none">
            <Dialog.Title className="sr-only">Navigation</Dialog.Title>
            <Dialog.Description className="sr-only">
              Main navigation menu
            </Dialog.Description>

            <div className="flex items-center justify-between">
              <Brand subtitle={subtitle} homeHref={homeHref} />
              <Dialog.Close
                aria-label="Close menu"
                className="rounded-md p-2 text-white/60 hover:bg-white/10 hover:text-white"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path
                    d="M3 3l10 10M13 3L3 13"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </Dialog.Close>
            </div>

            <NavLinks items={items} pathname={pathname} large />

            <div className="mt-auto">
              <SignOut />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {homeHref ? (
        <Link
          href={homeHref}
          className="font-display text-lg font-bold text-white transition-opacity hover:opacity-80"
        >
          Awaj<span className="text-gold"> ET</span>
        </Link>
      ) : (
        <span className="font-display text-lg font-bold text-white">
          Awaj<span className="text-gold"> ET</span>
        </span>
      )}
    </header>
  );
}

/** Full shell: mobile header + sidebar + content column. */
export function NavShell({
  items,
  subtitle,
  homeHref,
  children,
}: {
  items: NavItem[];
  subtitle: string;
  homeHref?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <MobileNav items={items} subtitle={subtitle} homeHref={homeHref} />
      <div className="flex min-h-screen">
        <Sidebar items={items} subtitle={subtitle} homeHref={homeHref} />
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 lg:px-12 lg:py-8 print:p-0">
          {children}
        </main>
      </div>
    </>
  );
}
