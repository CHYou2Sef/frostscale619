"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Badge } from "@/components/ui/badge";
import type { TenantContext } from "@/types/auth";
import { Building2, Settings, LayoutDashboard, Snowflake, Factory, Package } from "lucide-react";

interface TenantHeaderProps {
  context: TenantContext;
}

const roleLabels: Record<string, string> = {
  owner: "Propriétaire",
  admin: "Gestionnaire Usine",
  operator: "Opérateur",
  driver: "Chauffeur",
};

export function TenantHeader({ context }: TenantHeaderProps) {
  const pathname = usePathname();
  const { organization, role, user } = context;

  const navLinks = [
    {
      href: "/dashboard",
      label: "Tableau de Bord",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      href: "/facilities",
      label: "Installations & Froid",
      icon: Factory,
      active: pathname.startsWith("/facilities"),
    },
    {
      href: "/products",
      label: "Produits & Tarifs",
      icon: Package,
      active: pathname.startsWith("/products"),
    },
    {
      href: "/settings",
      label: "Paramètres Entreprise",
      icon: Settings,
      active: pathname === "/settings",
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand & Organization */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-sm">
              <Snowflake className="h-4 w-4" />
            </div>
            <span className="font-bold text-lg tracking-tight hidden sm:inline">
              FROSTSCALE619
            </span>
          </Link>

          <div className="h-6 w-px bg-border hidden sm:block" />

          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm truncate max-w-[180px]">
              {organization.name}
            </span>
            <Badge variant="outline" className="text-xs capitalize font-normal">
              {roleLabels[role] ?? role}
            </Badge>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  link.active
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground hidden lg:inline">
            {user.email}
          </span>
          <ThemeSwitcher />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
