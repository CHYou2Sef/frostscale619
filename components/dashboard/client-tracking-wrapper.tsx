"use client";

import dynamic from "next/dynamic";
import type { Client } from "@/types/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Loader2 } from "lucide-react";

const ClientTrackingMapDynamic = dynamic(
  () => import("./client-tracking-map").then((mod) => mod.ClientTrackingMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[480px] w-full flex-col items-center justify-center rounded-xl border bg-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground font-medium">
          Chargement de la carte des expéditions maritimes tunisiennes...
        </p>
        <span className="text-xs text-muted-foreground/70">OpenStreetMap & Leaflet</span>
      </div>
    ),
  }
);

interface ClientTrackingWrapperProps {
  clients: Client[];
}

export function ClientTrackingWrapper({ clients }: ClientTrackingWrapperProps) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold tracking-tight flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Suivi Géolocalisé des Clients & Livraisons de Glace
              </CardTitle>
              <Badge variant="outline" className="text-xs bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200">
                OpenStreetMap Free
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Positionnement en direct des halles de marée, poissonneries et chalutiers à quai. Suivi
              des bacs isothermes consignés et émission de factures PDF en TND.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ClientTrackingMapDynamic clients={clients} />
      </CardContent>
    </Card>
  );
}
