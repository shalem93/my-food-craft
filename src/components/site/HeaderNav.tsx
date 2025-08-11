import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const HeaderNav = () => {
  return (
    <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b border-border">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="inline-flex items-center gap-2">
          <span className="h-7 w-7 rounded-lg bg-primary shadow-[var(--shadow-elevate)]" aria-hidden />
          <span className="font-brandSerif font-bold tracking-tight text-lg text-primary">
            homemade
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm">
          <NavLink to="/" className={({isActive}) => isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground transition-colors"}>Browse</NavLink>
          <a href="#chefs" className="text-muted-foreground hover:text-foreground transition-colors">Chefs</a>
          <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How it works</a>
        </div>
      </nav>
    </header>
  );
};

export default HeaderNav;
