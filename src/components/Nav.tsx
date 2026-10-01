import { UserButton } from "@clerk/nextjs";
import Brand from "./Brand";
import ThemeToggle from "./ThemeToggle";
import CurrencySelect from "./CurrencySelect";
import NavLinks from "./NavLinks";
import { getCurrency } from "@/app/actions";

export default async function Nav() {
  const currency = await getCurrency();
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2">
        <Brand />
        <NavLinks />
        <div className="ml-auto flex items-center gap-3">
          <CurrencySelect current={currency} />
          <ThemeToggle />
          <UserButton />
        </div>
      </div>
    </header>
  );
}
