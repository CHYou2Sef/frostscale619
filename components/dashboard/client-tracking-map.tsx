"use client";

import { useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Client, ClientCategory } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileDown,
  Navigation,
  Phone,
  Search,
  Package,
  RotateCcw,
  Truck,
  Anchor,
  Filter,
} from "lucide-react";

interface ClientTrackingMapProps {
  clients: Client[];
}

function createClientIcon(
  category: ClientCategory,
  deliveryStatus: string,
  containersCount: number
) {
  const colorMap: Record<ClientCategory, string> = {
    mareyeur: "bg-cyan-600 border-cyan-300",
    poissonnerie: "bg-sky-500 border-sky-200",
    chr: "bg-amber-500 border-amber-200",
    peche_artisanale: "bg-emerald-600 border-emerald-300",
    industriel: "bg-purple-600 border-purple-200",
  };

  const iconEmoji: Record<ClientCategory, string> = {
    mareyeur: "🌊",
    poissonnerie: "🐟",
    chr: "🏨",
    peche_artisanale: "🚢",
    industriel: "🏭",
  };

  const isTransit = deliveryStatus === "in_transit";
  const bgClass = colorMap[category] || "bg-blue-600 border-blue-300";
  const emoji = iconEmoji[category] || "📍";

  const html = `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
      ${
        isTransit
          ? '<span style="position: absolute; inset: -4px; border-radius: 9999px; background-color: #38bdf8; opacity: 0.75; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>'
          : ""
      }
      <div style="position: relative; display: flex; width: 32px; height: 32px; align-items: center; justify-content: center; border-radius: 9999px; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); font-size: 14px;" class="${bgClass}">
        ${emoji}
      </div>
      ${
        containersCount > 0
          ? `<span style="position: absolute; bottom: -2px; right: -4px; display: flex; height: 16px; min-width: 16px; padding: 0 3px; align-items: center; justify-content: center; border-radius: 9999px; background-color: #0f172a; border: 1px solid #38bdf8; color: #38bdf8; font-size: 9px; font-weight: 700; font-family: monospace;">${containersCount}</span>`
          : ""
      }
    </div>
  `;

  return L.divIcon({
    html,
    className: "client-marker-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

export function ClientTrackingMap({ clients }: ClientTrackingMapProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [onlyTransit, setOnlyTransit] = useState(false);

  // Tunisia central coordinates: [Lat 35.5, Lng 10.5], Zoom 7 covers north to south
  const defaultCenter: [number, number] = [35.5, 10.5];
  const defaultZoom = 7;

  // Filter clients
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        search === "" ||
        client.name.toLowerCase().includes(search.toLowerCase()) ||
        client.city.toLowerCase().includes(search.toLowerCase()) ||
        (client.port_or_zone &&
          client.port_or_zone.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory =
        selectedCategory === "all" || client.category === selectedCategory;

      const matchesTransit = !onlyTransit || client.delivery_status === "in_transit";

      return matchesSearch && matchesCategory && matchesTransit;
    });
  }, [clients, search, selectedCategory, onlyTransit]);

  // Aggregate metrics
  const totalContainers = useMemo(
    () => clients.reduce((sum, c) => sum + c.containers_balance, 0),
    [clients]
  );
  const activeDeliveries = useMemo(
    () => clients.filter((c) => c.delivery_status === "in_transit").length,
    [clients]
  );
  const totalTurnoverTND = useMemo(
    () => clients.reduce((sum, c) => sum + Number(c.last_order_amount_tnd || 0), 0),
    [clients]
  );

  const categoryLabels: Record<string, string> = {
    all: "Tous",
    mareyeur: "🌊 Mareyeurs (Ports)",
    poissonnerie: "🐟 Poissonneries",
    chr: "🏨 Hôtels & Restos",
    peche_artisanale: "🚢 Pêcheurs / Chalutiers",
  };

  const statusBadges: Record<
    string,
    { label: string; variant: "default" | "secondary" | "outline" }
  > = {
    in_transit: { label: "En cours de route 🚚", variant: "default" },
    delivered: { label: "Livré ✓", variant: "secondary" },
    pending: { label: "En attente ⏳", variant: "outline" },
    idle: { label: "Inactif", variant: "outline" },
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards across Tunisia delivery grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border bg-card p-3 shadow-sm">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Anchor className="h-3.5 w-3.5 text-primary" />
            Clients Géolocalisés
          </p>
          <p className="text-xl font-bold mt-1">{clients.length}</p>
          <span className="text-[11px] text-muted-foreground">Ports & villes maritimes</span>
        </div>

        <div className="rounded-lg border bg-card p-3 shadow-sm">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-cyan-500" />
            Bacs Isothermes Déposés
          </p>
          <p className="text-xl font-bold mt-1 text-cyan-600 dark:text-cyan-400">
            {totalContainers} <span className="text-xs font-normal">bacs</span>
          </p>
          <span className="text-[11px] text-muted-foreground">Emballages consignés</span>
        </div>

        <div className="rounded-lg border bg-card p-3 shadow-sm">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5 text-emerald-500" />
            Livraisons en Cours
          </p>
          <p className="text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
            {activeDeliveries}
          </p>
          <span className="text-[11px] text-muted-foreground">Camions isothermes actifs</span>
        </div>

        <div className="rounded-lg border bg-card p-3 shadow-sm">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Navigation className="h-3.5 w-3.5 text-amber-500" />
            CA Livré (TND)
          </p>
          <p className="text-xl font-bold mt-1 font-mono text-amber-600 dark:text-amber-400">
            {totalTurnoverTND.toFixed(3)}
          </p>
          <span className="text-[11px] text-muted-foreground">Dinar Tunisien</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-lg border bg-card/60 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher mareyeur, poissonnerie, port (Sfax, Bizerte, La Goulette)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            <span>Filtre :</span>
          </div>

          {Object.entries(categoryLabels).map(([catKey, label]) => (
            <Button
              key={catKey}
              variant={selectedCategory === catKey ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(catKey)}
              className="text-xs h-7 px-2.5"
            >
              {label}
            </Button>
          ))}

          <Button
            variant={onlyTransit ? "default" : "outline"}
            size="sm"
            onClick={() => setOnlyTransit(!onlyTransit)}
            className={`text-xs h-7 px-2.5 ${
              onlyTransit ? "bg-cyan-600 hover:bg-cyan-700 text-white" : ""
            }`}
          >
            🚚 En route ({activeDeliveries})
          </Button>

          {(search || selectedCategory !== "all" || onlyTransit) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setSelectedCategory("all");
                setOnlyTransit(false);
              }}
              className="text-xs h-7 px-2 text-muted-foreground"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Réinitialiser
            </Button>
          )}
        </div>
      </div>

      {/* Leaflet Map Canvas with OpenStreetMap tiles */}
      <div className="relative h-[480px] w-full overflow-hidden rounded-xl border shadow-sm">
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%", zIndex: 0 }}
        >
          {/* Free OpenStreetMap Tile Layer - $0 budget */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {filteredClients.map((client) => {
            const icon = createClientIcon(
              client.category,
              client.delivery_status,
              client.containers_balance
            );

            const badgeInfo = statusBadges[client.delivery_status] || statusBadges.idle;

            return (
              <Marker
                key={client.id}
                position={[Number(client.latitude), Number(client.longitude)]}
                icon={icon}
              >
                <Popup className="frostscale-map-popup">
                  <div className="p-1 space-y-2 max-w-[280px]">
                    <div className="flex items-start justify-between gap-2 border-b pb-1.5">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-tight">
                          {client.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {client.port_or_zone || client.city}
                        </p>
                      </div>
                      <Badge variant={badgeInfo.variant} className="text-[10px] whitespace-nowrap">
                        {badgeInfo.label}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-xs text-slate-700">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Glace demandée :</span>
                        <span className="font-semibold capitalize">
                          {client.ice_preference === "ecailles"
                            ? "❄️ Écailles"
                            : client.ice_preference === "blocs"
                            ? "🧊 Blocs"
                            : "🧊 Glaçons"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Bacs consignés :</span>
                        <span className="font-mono font-bold text-cyan-700">
                          {client.containers_balance} unités
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Dernière facture :</span>
                        <span className="font-mono font-bold">
                          {Number(client.last_order_amount_tnd).toFixed(3)} TND
                        </span>
                      </div>

                      {client.phone && (
                        <div className="flex items-center gap-1 pt-1 text-[11px]">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <a
                            href={`tel:${client.phone}`}
                            className="text-cyan-700 hover:underline font-mono"
                          >
                            {client.phone}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Server-side PDF generation trigger */}
                    <div className="pt-2 border-t">
                      <Button
                        asChild
                        size="sm"
                        className="w-full h-8 text-xs bg-cyan-700 hover:bg-cyan-800 text-white flex items-center justify-center gap-1.5"
                      >
                        <a
                          href={`/api/invoices/${client.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FileDown className="h-3.5 w-3.5" />
                          Générer Facture TND (PDF)
                        </a>
                      </Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Floating Quick Legend */}
        <div className="absolute bottom-3 left-3 z-[400] rounded-lg border bg-background/90 p-2.5 shadow-md backdrop-blur-sm text-xs space-y-1.5 max-w-[200px] hidden sm:block">
          <p className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wide">
            Légende Carte
          </p>
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 items-center justify-center rounded-full bg-cyan-600 text-[8px] text-white">
              🌊
            </span>
            <span>Mareyeur (Port)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 items-center justify-center rounded-full bg-sky-500 text-[8px] text-white">
              🐟
            </span>
            <span>Poissonnerie</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 items-center justify-center rounded-full bg-amber-500 text-[8px] text-white">
              🏨
            </span>
            <span>Hôtel / Resto</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 items-center justify-center rounded-full bg-emerald-600 text-[8px] text-white">
              🚢
            </span>
            <span>Chalutier / Bateau</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-cyan-600 dark:text-cyan-400 font-medium pt-1 border-t">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping inline-block mr-1"></span>
            Cercle pulsant = En route
          </div>
        </div>
      </div>
    </div>
  );
}
