"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  StockLevelSummary,
  InventoryMovementWithDetails,
  FacilityWithDetails,
  IceProduct,
} from "@/types/database";
import type { TenantContext } from "@/types/auth";
import {
  recordMeltLossAction,
  recordTransferAction,
} from "@/lib/actions/inventory";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ThermometerSnowflake,
  Flame,
  ArrowRightLeft,
  History,
  TrendingDown,
  TrendingUp,
  Scale,
  Building,
  Loader2,
  X,
  Package,
} from "lucide-react";

interface InventoryViewProps {
  stockLevels: StockLevelSummary[];
  movements: InventoryMovementWithDetails[];
  facilities: FacilityWithDetails[];
  products: IceProduct[];
  context: TenantContext;
}

export function InventoryView({
  stockLevels,
  movements,
  facilities,
  products,
  context,
}: InventoryViewProps) {
  const router = useRouter();
  const { role } = context;
  const canManage = ["owner", "admin", "operator"].includes(role);

  const [showMeltLossModal, setShowMeltLossModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Melt Loss Form state
  const [selectedFacilityId, setSelectedFacilityId] = useState(facilities[0]?.id || "");
  const currentFacility = facilities.find((f) => f.id === selectedFacilityId) || facilities[0];
  const [selectedStorageId, setSelectedStorageId] = useState(currentFacility?.storage_locations[0]?.id || "");
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || "");
  const [lostUnits, setLostUnits] = useState("0");
  const [lostWeightKg, setLostWeightKg] = useState("50");
  const [meltReason, setMeltReason] = useState("Dégivrage et chaleur ambiante quai");

  // Transfer Form state
  const [trfFacilityId, setTrfFacilityId] = useState(facilities[0]?.id || "");
  const trfFacility = facilities.find((f) => f.id === trfFacilityId) || facilities[0];
  const [fromStorageId, setFromStorageId] = useState(trfFacility?.storage_locations[0]?.id || "");
  const [toStorageId, setToStorageId] = useState(trfFacility?.storage_locations[1]?.id || "");
  const [trfProductId, setTrfProductId] = useState(products[0]?.id || "");
  const [trfUnits, setTrfUnits] = useState("50");
  const [trfWeightKg, setTrfWeightKg] = useState("250");
  const [trfReason, setTrfReason] = useState("Rééquilibrage chambre tampon");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMeltLossSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await recordMeltLossAction({
      facility_id: selectedFacilityId,
      storage_location_id: selectedStorageId,
      product_id: selectedProductId,
      quantity_units: parseFloat(lostUnits) || 0,
      weight_lost_kg: parseFloat(lostWeightKg) || 1,
      reason: meltReason,
    });

    setLoading(false);
    if (!res.success) {
      setError(res.error);
      return;
    }

    setShowMeltLossModal(false);
    router.refresh();
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await recordTransferAction({
      facility_id: trfFacilityId,
      from_storage_location_id: fromStorageId,
      to_storage_location_id: toStorageId,
      product_id: trfProductId,
      quantity_units: parseFloat(trfUnits) || 0,
      weight_kg: parseFloat(trfWeightKg) || 1,
      reason: trfReason,
    });

    setLoading(false);
    if (!res.success) {
      setError(res.error);
      return;
    }

    setShowTransferModal(false);
    router.refresh();
  };

  const movementLabels: Record<string, { label: string; color: string }> = {
    production_in: { label: "Entrée Production", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    dispatch_out: { label: "Sortie Livraison", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    transfer: { label: "Transfert Interne", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
    melt_loss: { label: "Fondue de Glace", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    adjustment: { label: "Ajustement Inventaire", color: "bg-gray-500/10 text-gray-600 border-gray-500/20" },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Stocks Froids & Grand Livre Immuable
          </h1>
          <p className="text-sm text-muted-foreground">
            Soldes en temps réel par chambre froide/silo et traçabilité comptable des mouvements
          </p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowTransferModal(true)}
              className="gap-2"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Transfert Interne
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowMeltLossModal(true)}
              className="gap-2 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
            >
              <Flame className="h-4 w-4" />
              Déclarer Fondue de Glace
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive flex justify-between items-center">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Current Stock Levels Grid */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight mb-4 flex items-center gap-2">
          <ThermometerSnowflake className="h-5 w-5 text-primary" />
          État des Stocks par Emplacement Froid
        </h2>

        {stockLevels.length === 0 ? (
          <Card className="text-center p-12 border-dashed">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
              <ThermometerSnowflake className="h-7 w-7" />
            </div>
            <h3 className="font-semibold text-lg">Aucun stock disponible</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
              Les stocks apparaîtront dès la clôture de vos premiers lots de fabrication ou réceptions.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stockLevels.map((item, idx) => (
              <Card key={idx} className="shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        {item.facility_name}
                      </div>
                      <CardTitle className="text-base font-bold">
                        {item.storage_location_name}
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="capitalize text-xs">
                      {item.ice_type}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-2">
                  <div className="flex items-baseline justify-between border-t pt-3">
                    <span className="font-medium text-sm text-foreground">
                      {item.product_name}
                    </span>
                    <span className="text-xl font-black text-primary">
                      {item.current_weight_kg >= 1000
                        ? `${(item.current_weight_kg / 1000).toFixed(2)} T`
                        : `${item.current_weight_kg.toFixed(1)} kg`}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground flex justify-between items-center bg-muted/40 p-2 rounded-md">
                    <span>Quantité conditionnée :</span>
                    <strong className="text-foreground">
                      {item.current_quantity} {item.unit}s
                    </strong>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Append-Only Movements Ledger */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Grand Livre des Mouvements de Glace (Immuable)
          </h2>
          <Badge variant="outline" className="font-mono text-xs">
            Append-Only
          </Badge>
        </div>

        {movements.length === 0 ? (
          <div className="text-sm text-muted-foreground border border-dashed rounded-lg p-8 text-center">
            Aucun mouvement enregistré dans le grand livre.
          </div>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3">Horodatage</th>
                    <th className="p-3">Type de Mouvement</th>
                    <th className="p-3">Article</th>
                    <th className="p-3">Emplacement</th>
                    <th className="p-3">Delta Unités</th>
                    <th className="p-3">Delta Poids</th>
                    <th className="p-3">Motif / Justificatif</th>
                    <th className="p-3">Responsable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {movements.map((m) => {
                    const isPositive = Number(m.weight_delta_kg) >= 0;
                    const meta = movementLabels[m.movement_type] || {
                      label: m.movement_type,
                      color: "bg-muted text-foreground",
                    };

                    return (
                      <tr key={m.id} className="hover:bg-muted/20">
                        <td className="p-3 font-mono text-muted-foreground">
                          {new Date(m.created_at).toLocaleString("fr-FR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${meta.color}`}
                          >
                            {isPositive ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {meta.label}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-foreground">
                          {m.product?.name}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {m.storage_location?.name}
                        </td>
                        <td
                          className={`p-3 font-mono font-bold ${
                            isPositive ? "text-emerald-600" : "text-amber-600"
                          }`}
                        >
                          {isPositive ? `+${m.quantity_delta}` : m.quantity_delta}{" "}
                          {m.product?.unit}s
                        </td>
                        <td
                          className={`p-3 font-mono font-bold ${
                            isPositive ? "text-emerald-600" : "text-amber-600"
                          }`}
                        >
                          {isPositive ? `+${m.weight_delta_kg}` : m.weight_delta_kg} kg
                        </td>
                        <td className="p-3 text-muted-foreground max-w-xs truncate">
                          {m.reason || "—"}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {m.performer?.full_name || "Opérateur"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Melt Loss Modal */}
      {showMeltLossModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <Flame className="h-5 w-5" />
                  Déclaration de Fondue de Glace
                </CardTitle>
                <CardDescription>
                  Comptabilisation des pertes thermiques ou dégivrage
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMeltLossModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMeltLossSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="meltFac">Site *</Label>
                  <select
                    id="meltFac"
                    value={selectedFacilityId}
                    onChange={(e) => {
                      setSelectedFacilityId(e.target.value);
                      const f = facilities.find((fac) => fac.id === e.target.value);
                      if (f) setSelectedStorageId(f.storage_locations[0]?.id || "");
                    }}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {facilities.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meltStorage">Chambre Froide / Silo Affecté *</Label>
                  <select
                    id="meltStorage"
                    value={selectedStorageId}
                    onChange={(e) => setSelectedStorageId(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {currentFacility?.storage_locations?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meltProd">Article de Glace Affecté *</Label>
                  <select
                    id="meltProd"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="lostWeight">Poids Fondu (kg) *</Label>
                    <Input
                      id="lostWeight"
                      type="number"
                      step="1"
                      value={lostWeightKg}
                      onChange={(e) => setLostWeightKg(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lostUnits">Unités Perdues</Label>
                    <Input
                      id="lostUnits"
                      type="number"
                      step="1"
                      value={lostUnits}
                      onChange={(e) => setLostUnits(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meltReason">Motif / Contexte *</Label>
                  <Input
                    id="meltReason"
                    value={meltReason}
                    onChange={(e) => setMeltReason(e.target.value)}
                    placeholder="Ex: Température extérieure 42°C, dégivrage trimestriel..."
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowMeltLossModal(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Déclarer la perte"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Transfert Interne de Glace</CardTitle>
                <CardDescription>
                  Déplacement de stock entre deux chambres froides ou silos
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTransferModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTransferSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="trfFac">Site *</Label>
                  <select
                    id="trfFac"
                    value={trfFacilityId}
                    onChange={(e) => {
                      setTrfFacilityId(e.target.value);
                      const f = facilities.find((fac) => fac.id === e.target.value);
                      if (f) {
                        setFromStorageId(f.storage_locations[0]?.id || "");
                        setToStorageId(f.storage_locations[1]?.id || "");
                      }
                    }}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {facilities.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="fromStorage">Emplacement Source *</Label>
                    <select
                      id="fromStorage"
                      value={fromStorageId}
                      onChange={(e) => setFromStorageId(e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {trfFacility?.storage_locations?.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="toStorage">Emplacement Cible *</Label>
                    <select
                      id="toStorage"
                      value={toStorageId}
                      onChange={(e) => setToStorageId(e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {trfFacility?.storage_locations?.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trfProd">Article *</Label>
                  <select
                    id="trfProd"
                    value={trfProductId}
                    onChange={(e) => setTrfProductId(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="trfWeight">Poids Déplacé (kg) *</Label>
                    <Input
                      id="trfWeight"
                      type="number"
                      step="1"
                      value={trfWeightKg}
                      onChange={(e) => setTrfWeightKg(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trfUnits">Unités (Sacs/Blocs)</Label>
                    <Input
                      id="trfUnits"
                      type="number"
                      step="1"
                      value={trfUnits}
                      onChange={(e) => setTrfUnits(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trfReason">Motif du Transfert</Label>
                  <Input
                    id="trfReason"
                    value={trfReason}
                    onChange={(e) => setTrfReason(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowTransferModal(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Transférer"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
