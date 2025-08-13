import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";


const HeaderNav = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b border-border">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary shadow-[var(--shadow-elevate)] flex items-center justify-center" aria-hidden>
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-primary-foreground" aria-hidden="true" focusable="false">
              <path fill="currentColor" d="M12 2c-2.76 0-5 2.24-5 5 0 .25.02.5.06.74C6.3 7.25 5.7 7 5 7 3.34 7 2 8.34 2 10s1.34 3 3 3h1v4c0 1.66 1.34 3 3 3h6c1.66 0 3-1.34 3-3v-4h1c1.66 0 3-1.34 3-3s-1.34-3-3-3c-.7 0-1.3.25-2.06.74.04-.24.06-.49.06-.74 0-2.76-2.24-5-5-5zm-3 12h6v4c0 .55-.45 1-1 1H10c-.55 0-1-.45-1-1v-4z"/>
            </svg>
          </div>
          <span className="font-brandSerif font-bold tracking-tight text-lg text-primary">
            homemade
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm">
          <NavLink to="/" className={({isActive}) => isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground transition-colors"}>Browse</NavLink>
          <a href="#chefs" className="text-muted-foreground hover:text-foreground transition-colors">Chefs</a>
          <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How it works</a>
        </div>
        {user ? (
          <div className="hidden md:flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Welcome</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt="User avatar" />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user.email?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  Signed in as {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/chef-dashboard">My Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/chef-dashboard">Edit Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm" aria-label="Sign in">Sign in</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" aria-label="Create account">Sign up</Button>
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
};

export default HeaderNav;
