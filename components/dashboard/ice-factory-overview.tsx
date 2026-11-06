"use client";

import type { TenantContext } from "@/types/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Factory,
  Package,
  Scale,
  ThermometerSnowflake,
  ShieldCheck,
  MapPin,
  FileText,
  Phone,
  ArrowRight,
} from "lucide-react";

interface IceFactoryOverviewProps {
  context: TenantContext;
}

export function IceFactoryOverview({ context }: IceFactoryOverviewProps) {
  const { organization, role } = context;

  const iceTypeLabels = {
    glacons: {
      name: "Glaçons Alimentaires",
      icon: "🧊",
      description: "Sacs de 2kg & 5kg pour restaurants, hôtels et cafés.",
      active: organization.ice_types.includes("glacons"),
    },
    ecailles: {
      name: "Glace en Écailles",
      icon: "❄️",
      description: "Glace sous-refroidie (-7°C) pour poissonneries et chalutiers.",
      active: organization.ice_types.includes("ecailles"),
    },
    blocs: {
      name: "Blocs de Glace",
      icon: "🧊",
      description: "Pains 25kg / 50kg pour conservation longue durée.",
      active: organization.ice_types.includes("blocs"),
    },
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-xl border bg-gradient-to-r from-card via-accent/30 to-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-background">
                Tenant ID: {organization.slug}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Devise: {organization.currency} (Dinar Tunisien)
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {organization.name}
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-3 flex-wrap">
              {organization.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {organization.city}, Tunisie
                </span>
              )}
              {organization.tax_id && (
                <span className="inline-flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  MF: {organization.tax_id}
                </span>
              )}
              {organization.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {organization.phone}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/settings">Paramètres Usine</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Operational Ice Lines Overview */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight mb-4 flex items-center gap-2">
          <ThermometerSnowflake className="h-5 w-5 text-primary" />
          Lignes de Production Industrielle
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(iceTypeLabels).map(([key, item]) => (
            <Card
              key={key}
              className={`transition-all ${
                item.active
                  ? "border-primary/40 shadow-sm"
                  : "opacity-60 bg-muted/30"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{item.icon}</span>
                  <Badge
                    variant={item.active ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {item.active ? "Actif" : "Non configuré"}
                  </Badge>
                </div>
                <CardTitle className="text-base mt-2">{item.name}</CardTitle>
                <CardDescription className="text-xs">
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                  <span>Phase 2 : Lots & Peseuses</span>
                  <span className="font-mono">En attente</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Metrics & Foundation Status */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sécurité Multi-Tenant</CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PostgreSQL RLS</div>
            <p className="text-xs text-muted-foreground mt-1">
              Isolation hermétique par organization_id active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rôle Actuel</CardTitle>
            <Factory className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{role}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Permissions configurées selon la matrice de rôles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bascule de Production</CardTitle>
            <Scale className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">TND (Dinar)</div>
            <p className="text-xs text-muted-foreground mt-1">
              Norme comptable et fiscale tunisienne
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Next Phase Preparation Banner */}
      <Card className="border-dashed bg-muted/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Fondation Technique (Phase 1) Active
              </h3>
              <p className="text-sm text-muted-foreground">
                L&apos;authentification Supabase SSR, l&apos;isolation multi-tenant RLS et la gestion des profils
                et organisations sont opérationnelles.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="gap-1 shrink-0">
              <Link href="/settings">
                Gérer l&apos;Entreprise
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
