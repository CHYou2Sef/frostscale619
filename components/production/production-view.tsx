"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ProductionBatchWithDetails,
  FacilityWithDetails,
  IceProduct,
} from "@/types/database";
import type { TenantContext } from "@/types/auth";
import {
  startProductionBatchAction,
  completeProductionBatchAction,
  cancelProductionBatchAction,
} from "@/lib/actions/production";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Factory,
  Plus,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Droplets,
  Zap,
  Scale,
  Loader2,
  X,
  AlertCircle,
} from "lucide-react";

interface ProductionViewProps {
  initialBatches: ProductionBatchWithDetails[];
  facilities: FacilityWithDetails[];
  products: IceProduct[];
  context: TenantContext;
}

export function ProductionView({
  initialBatches,
  facilities,
  products,
  context,
}: ProductionViewProps) {
  const router = useRouter();
  const { role } = context;
  const canOperate = ["owner", "admin", "operator"].includes(role);

  const [batches, setBatches] = useState<ProductionBatchWithDetails[]>(initialBatches);
  const [showStartModal, setShowStartModal] = useState(false);
  const [completingBatch, setCompletingBatch] = useState<ProductionBatchWithDetails | null>(null);

  // Start Batch Form state
  const [selectedFacilityId, setSelectedFacilityId] = useState(facilities[0]?.id || "");
  const currentFacility = facilities.find((f) => f.id === selectedFacilityId) || facilities[0];
  const [selectedMachineId, setSelectedMachineId] = useState(currentFacility?.machines[0]?.id || "");
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || "");
  const [selectedStorageId, setSelectedStorageId] = useState(currentFacility?.storage_locations[0]?.id || "");
  const [batchNumber, setBatchNumber] = useState(
    `LOT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 90 + 10)}`
  );
  const [startNotes, setStartNotes] = useState("");

  // Complete Batch Form state
  const [qtyUnits, setQtyUnits] = useState("100");
  const [weightKg, setWeightKg] = useState("500");
  const [runtimeHours, setRuntimeHours] = useState("7.5");
  const [waterM3, setWaterM3] = useState("");
  const [electricityKwh, setElectricityKwh] = useState("");
  const [completeNotes, setCompleteNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await startProductionBatchAction({
      facility_id: selectedFacilityId,
      machine_id: selectedMachineId,
      product_id: selectedProductId,
      storage_location_id: selectedStorageId,
      batch_number: batchNumber,
      notes: startNotes,
    });

    setLoading(false);
    if (!res.success) {
      setError(res.error);
      return;
    }

    setShowStartModal(false);
    setStartNotes("");
    router.refresh();
  };

  const handleCompleteBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingBatch) return;

    setLoading(true);
    setError(null);

    const res = await completeProductionBatchAction({
      batch_id: completingBatch.id,
      quantity_units: parseFloat(qtyUnits) || 0,
      total_weight_kg: parseFloat(weightKg) || 1,
      runtime_hours: parseFloat(runtimeHours) || 1,
      water_meter_m3: waterM3 ? parseFloat(waterM3) : undefined,
      electricity_kwh: electricityKwh ? parseFloat(electricityKwh) : undefined,
      notes: completeNotes,
    });

    setLoading(false);
    if (!res.success) {
      setError(res.error);
      return;
    }

    setCompletingBatch(null);
    setCompleteNotes("");
    router.refresh();
  };

  const handleCancelBatch = async (batchId: string) => {
    if (!confirm("Voulez-vous vraiment annuler ce lot de production ?")) return;
    setLoading(true);
    const res = await cancelProductionBatchAction(batchId, "Annulé par l'opérateur");
    setLoading(false);
    if (!res.success) {
      setError(res.error);
      return;
    }
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Ordres de Fabrication & Suivi des Postes
          </h1>
          <p className="text-sm text-muted-foreground">
            Lancement des lots, suivi horaire des machines et dépôts automatiques en chambres froides
          </p>
        </div>
        {canOperate && (
          <Button onClick={() => setShowStartModal(true)} className="gap-2">
            <Play className="h-4 w-4" />
            Lancer un Lot de Fabrication
          </Button>
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

      {/* Batches List */}
      {batches.length === 0 ? (
        <Card className="text-center p-12 border-dashed">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
            <Factory className="h-7 w-7" />
          </div>
          <h3 className="font-semibold text-lg">Aucun lot de fabrication enregistré</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            Lancez un lot de production pour enregistrer le temps machine, les relevés compteurs et incrémenter le stock.
          </p>
          {canOperate && (
            <Button onClick={() => setShowStartModal(true)} className="gap-2">
              <Play className="h-4 w-4" />
              Lancer la Production
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => (
            <Card
              key={batch.id}
              className={`transition-all ${
                batch.status === "in_progress"
                  ? "border-primary/50 shadow-md bg-card"
                  : "border-border opacity-90"
              }`}
            >
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-base">
                      {batch.batch_number}
                    </span>
                    <Badge
                      variant={
                        batch.status === "in_progress"
                          ? "default"
                          : batch.status === "completed"
                          ? "secondary"
                          : "outline"
                      }
                      className="text-xs capitalize"
                    >
                      {batch.status === "in_progress" && "En cours de fabrication"}
                      {batch.status === "completed" && "Clôturé & En Stock"}
                      {batch.status === "cancelled" && "Annulé"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Site: <strong>{batch.facility?.name}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span>
                      Machine: <strong className="text-foreground">{batch.machine?.name}</strong>
                    </span>
                    <span>
                      Article: <strong className="text-foreground">{batch.product?.name}</strong>
                    </span>
                    <span>
                      Destination:{" "}
                      <strong className="text-foreground">
                        {batch.storage_location?.name}
                      </strong>
                    </span>
                    <span>
                      Opérateur:{" "}
                      <strong className="text-foreground">
                        {batch.operator?.full_name || "Équipe Usine"}
                      </strong>
                    </span>
                  </div>

                  {batch.status === "completed" && (
                    <div className="flex items-center gap-4 text-xs pt-1 text-foreground font-medium flex-wrap">
                      <span className="inline-flex items-center gap-1 text-primary">
                        <Scale className="h-3.5 w-3.5" />
                        {batch.total_weight_kg} kg ({batch.quantity_units} {batch.product?.unit}s)
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {batch.runtime_hours} h runtime
                      </span>
                      {batch.water_meter_m3 && (
                        <span className="inline-flex items-center gap-1">
                          <Droplets className="h-3.5 w-3.5 text-blue-500" />
                          {batch.water_meter_m3} m³ eau
                        </span>
                      )}
                      {batch.electricity_kwh && (
                        <span className="inline-flex items-center gap-1">
                          <Zap className="h-3.5 w-3.5 text-amber-500" />
                          {batch.electricity_kwh} kWh
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {batch.status === "in_progress" && canOperate && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => setCompletingBatch(batch)}
                      className="gap-1.5"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Clôturer & Déposer en Stock
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancelBatch(batch.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      Annuler
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Start Batch Modal */}
      {showStartModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Lancement d&apos;un Lot de Fabrication</CardTitle>
                <CardDescription>
                  Démarrage du poste de production de glace
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowStartModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStartBatch} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="batchNumber">Numéro de Lot (Traçabilité) *</Label>
                  <Input
                    id="batchNumber"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value.toUpperCase())}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facility">Site de Production *</Label>
                  <select
                    id="facility"
                    value={selectedFacilityId}
                    onChange={(e) => {
                      setSelectedFacilityId(e.target.value);
                      const f = facilities.find((fac) => fac.id === e.target.value);
                      if (f) {
                        setSelectedMachineId(f.machines[0]?.id || "");
                        setSelectedStorageId(f.storage_locations[0]?.id || "");
                      }
                    }}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {facilities.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="machine">Machine Utilisée *</Label>
                    <select
                      id="machine"
                      value={selectedMachineId}
                      onChange={(e) => setSelectedMachineId(e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {currentFacility?.machines?.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.produces_ice_type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="product">Article Fabriqué *</Label>
                    <select
                      id="product"
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storage">Chambre Froide / Silo Récepteur *</Label>
                  <select
                    id="storage"
                    value={selectedStorageId}
                    onChange={(e) => setSelectedStorageId(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {currentFacility?.storage_locations?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.target_temp_celsius}°C - Cap: {s.capacity_tonnes}T)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startNotes">Notes Opérateur</Label>
                  <Input
                    id="startNotes"
                    placeholder="Ex: Début de poste 06h00, eau pré-filtrée..."
                    value={startNotes}
                    onChange={(e) => setStartNotes(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowStartModal(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Démarrer le lot"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Complete Batch Modal */}
      {completingBatch && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Clôture du Lot {completingBatch.batch_number}</CardTitle>
                <CardDescription>
                  Saisie des pesées réelles et dépôt automatique en chambre froide
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setCompletingBatch(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCompleteBatch} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="qtyUnits">
                      Nombre de {completingBatch.product?.unit || "unités"} *
                    </Label>
                    <Input
                      id="qtyUnits"
                      type="number"
                      step="1"
                      value={qtyUnits}
                      onChange={(e) => setQtyUnits(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weightKg">Poids Total Réel (kg) *</Label>
                    <Input
                      id="weightKg"
                      type="number"
                      step="0.5"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="runtime">Runtime (Heures) *</Label>
                    <Input
                      id="runtime"
                      type="number"
                      step="0.5"
                      value={runtimeHours}
                      onChange={(e) => setRuntimeHours(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="water">Eau (m³)</Label>
                    <Input
                      id="water"
                      type="number"
                      step="0.05"
                      placeholder="Ex: 1.25"
                      value={waterM3}
                      onChange={(e) => setWaterM3(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="electricity">Élec (kWh)</Label>
                    <Input
                      id="electricity"
                      type="number"
                      step="1"
                      placeholder="Ex: 85"
                      value={electricityKwh}
                      onChange={(e) => setElectricityKwh(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="completeNotes">Remarques Qualité & Dépôt</Label>
                  <Input
                    id="completeNotes"
                    placeholder="Ex: Bonne transparence, stockage rangée A3"
                    value={completeNotes}
                    onChange={(e) => setCompleteNotes(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCompletingBatch(null)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={loading} className="gap-2">
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Valider l&apos;Entrée en Stock
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
