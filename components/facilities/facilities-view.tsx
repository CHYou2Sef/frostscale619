"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FacilityWithDetails, MachineStatus, StorageLocationType } from "@/types/database";
import type { TenantContext } from "@/types/auth";
import {
  createFacilityAction,
  createStorageLocationAction,
  createMachineAction,
  toggleMachineStatusAction,
} from "@/lib/actions/facilities";
import {
  STORAGE_TYPES,
  MACHINE_STATUSES,
  ICE_PRODUCTION_TYPES,
} from "@/lib/validations/facilities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Factory,
  Plus,
  ThermometerSnowflake,
  Cpu,
  MapPin,
  Building,
  CheckCircle2,
  AlertTriangle,
  PowerOff,
  Loader2,
  X,
} from "lucide-react";

interface FacilitiesViewProps {
  initialFacilities: FacilityWithDetails[];
  context: TenantContext;
}

export function FacilitiesView({ initialFacilities, context }: FacilitiesViewProps) {
  const router = useRouter();
  const { role } = context;
  const canManage = ["owner", "admin"].includes(role);

  const [facilities, setFacilities] = useState<FacilityWithDetails[]>(initialFacilities);
  const [showAddFacility, setShowAddFacility] = useState(false);
  const [activeFacilityForStorage, setActiveFacilityForStorage] = useState<string | null>(null);
  const [activeFacilityForMachine, setActiveFacilityForMachine] = useState<string | null>(null);

  // Facility form state
  const [facName, setFacName] = useState("");
  const [facCode, setFacCode] = useState("");
  const [facAddress, setFacAddress] = useState("");
  const [facCity, setFacCity] = useState("Sfax");

  // Storage form state
  const [storageName, setStorageName] = useState("");
  const [storageType, setStorageType] = useState<StorageLocationType>("cold_room");
  const [storageTemp, setStorageTemp] = useState("-5");
  const [storageCap, setStorageCap] = useState("20");

  // Machine form state
  const [machineName, setMachineName] = useState("");
  const [machineModel, setMachineModel] = useState("");
  const [machineIceType, setMachineIceType] = useState<"glacons" | "ecailles" | "blocs">("glacons");
  const [machineCap, setMachineCap] = useState("5");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await createFacilityAction({
      name: facName,
      code: facCode,
      address: facAddress,
      city: facCity,
    });

    setLoading(false);
    if (!res.success) {
      setError(res.error);
      return;
    }

    setShowAddFacility(false);
    setFacName("");
    setFacCode("");
    setFacAddress("");
    router.refresh();
  };

  const handleCreateStorage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFacilityForStorage) return;

    setLoading(true);
    setError(null);

    const res = await createStorageLocationAction({
      facility_id: activeFacilityForStorage,
      name: storageName,
      type: storageType,
      target_temp_celsius: parseFloat(storageTemp) || -5,
      capacity_tonnes: parseFloat(storageCap) || 10,
    });

    setLoading(false);
    if (!res.success) {
      setError(res.error);
      return;
    }

    setActiveFacilityForStorage(null);
    setStorageName("");
    router.refresh();
  };

  const handleCreateMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFacilityForMachine) return;

    setLoading(true);
    setError(null);

    const res = await createMachineAction({
      facility_id: activeFacilityForMachine,
      name: machineName,
      model: machineModel,
      produces_ice_type: machineIceType,
      capacity_tonnes_per_day: parseFloat(machineCap) || 5,
      status: "operational",
    });

    setLoading(false);
    if (!res.success) {
      setError(res.error);
      return;
    }

    setActiveFacilityForMachine(null);
    setMachineName("");
    setMachineModel("");
    router.refresh();
  };

  const handleToggleStatus = async (machineId: string, currentStatus: MachineStatus) => {
    const nextStatus: MachineStatus =
      currentStatus === "operational"
        ? "maintenance"
        : currentStatus === "maintenance"
        ? "offline"
        : "operational";

    await toggleMachineStatusAction(machineId, nextStatus);
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Installations, Chambres Froides & Machines
          </h1>
          <p className="text-sm text-muted-foreground">
            Configuration des sites de fabrication, silos de stockage et générateurs de glace
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setShowAddFacility(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau Site de Production
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

      {/* Add Facility Form Card */}
      {showAddFacility && (
        <Card className="border-primary/50 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Ajouter un Site de Production / Dépôt</CardTitle>
              <CardDescription>
                Définissez une usine ou un point de vente portuaire
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowAddFacility(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateFacility} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="facName">Nom de l&apos;Usine *</Label>
                  <Input
                    id="facName"
                    placeholder="Ex: Usine Port de Pêche"
                    value={facName}
                    onChange={(e) => setFacName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facCode">Code Unique (ex: USINE-01) *</Label>
                  <Input
                    id="facCode"
                    placeholder="USINE-01"
                    value={facCode}
                    onChange={(e) => setFacCode(e.target.value.toUpperCase())}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facCity">Ville / Port</Label>
                  <Input
                    id="facCity"
                    placeholder="Sfax, Bizerte, Mahdia..."
                    value={facCity}
                    onChange={(e) => setFacCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facAddress">Adresse Précise</Label>
                  <Input
                    id="facAddress"
                    placeholder="Quai Sud, Zone Industrielle..."
                    value={facAddress}
                    onChange={(e) => setFacAddress(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddFacility(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer le site"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Facilities List */}
      {facilities.length === 0 ? (
        <Card className="text-center p-12 border-dashed">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
            <Building className="h-7 w-7" />
          </div>
          <h3 className="font-semibold text-lg">Aucune installation configurée</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            Créez votre première usine pour commencer à enregistrer vos chambres froides et vos machines à glace.
          </p>
          {canManage && (
            <Button onClick={() => setShowAddFacility(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter une Usine
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-6">
          {facilities.map((fac) => (
            <Card key={fac.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Factory className="h-5 w-5 text-primary" />
                        {fac.name}
                      </CardTitle>
                      <Badge variant="outline">{fac.code}</Badge>
                    </div>
                    {(fac.city || fac.address) && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {[fac.city, fac.address].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveFacilityForStorage(fac.id)}
                        className="gap-1.5 text-xs"
                      >
                        <ThermometerSnowflake className="h-3.5 w-3.5" />
                        + Chambre / Silo
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveFacilityForMachine(fac.id)}
                        className="gap-1.5 text-xs"
                      >
                        <Cpu className="h-3.5 w-3.5" />
                        + Machine à Glace
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Storage Locations Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <ThermometerSnowflake className="h-3.5 w-3.5 text-primary" />
                      Chambres Froides & Silos ({fac.storage_locations?.length || 0})
                    </h4>
                  </div>

                  {(!fac.storage_locations || fac.storage_locations.length === 0) ? (
                    <div className="text-xs text-muted-foreground border border-dashed rounded-md p-4 text-center">
                      Aucune chambre froide ou silo enregistré pour ce site.
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {fac.storage_locations.map((loc) => (
                        <div
                          key={loc.id}
                          className="rounded-lg border p-3.5 bg-card flex items-start justify-between gap-3 shadow-sm"
                        >
                          <div className="space-y-1">
                            <div className="font-medium text-sm">{loc.name}</div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {loc.type === "cold_room"
                                ? "Chambre Froide"
                                : loc.type === "flake_silo"
                                ? "Silo Écailles"
                                : "Fosse / Bac Tampon"}
                            </div>
                            <div className="text-xs font-mono text-primary pt-1">
                              Temp. cible : {loc.target_temp_celsius}°C
                            </div>
                          </div>
                          <Badge variant="secondary" className="shrink-0 text-xs">
                            {loc.capacity_tonnes} T
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Machines Section */}
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-primary" />
                    Machines & Générateurs de Glace ({fac.machines?.length || 0})
                  </h4>

                  {(!fac.machines || fac.machines.length === 0) ? (
                    <div className="text-xs text-muted-foreground border border-dashed rounded-md p-4 text-center">
                      Aucune machine enregistrée pour ce site.
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {fac.machines.map((mac) => (
                        <div
                          key={mac.id}
                          className="rounded-lg border p-3.5 bg-card space-y-2 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-medium text-sm">{mac.name}</div>
                              {mac.model && (
                                <div className="text-xs text-muted-foreground">
                                  Modèle : {mac.model}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(mac.id, mac.status)}
                              className="focus:outline-none"
                              title="Cliquez pour basculer le statut"
                            >
                              <Badge
                                variant={
                                  mac.status === "operational"
                                    ? "default"
                                    : mac.status === "maintenance"
                                    ? "secondary"
                                    : "destructive"
                                }
                                className="text-xs capitalize cursor-pointer flex items-center gap-1"
                              >
                                {mac.status === "operational" && <CheckCircle2 className="h-3 w-3" />}
                                {mac.status === "maintenance" && <AlertTriangle className="h-3 w-3" />}
                                {mac.status === "offline" && <PowerOff className="h-3 w-3" />}
                                {mac.status === "operational"
                                  ? "En service"
                                  : mac.status === "maintenance"
                                  ? "Maintenance"
                                  : "Arrêt"}
                              </Badge>
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                            <span>
                              Type :{" "}
                              <strong className="text-foreground capitalize">
                                {mac.produces_ice_type}
                              </strong>
                            </span>
                            <span className="font-mono text-primary font-medium">
                              {mac.capacity_tonnes_per_day} T / 24h
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Storage Modal Dialog */}
      {activeFacilityForStorage && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Ajouter un Emplacement de Stockage</CardTitle>
                <CardDescription>Chambre froide, silo ou bac tampon</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveFacilityForStorage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateStorage} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="storageName">Nom / Désignation *</Label>
                  <Input
                    id="storageName"
                    placeholder="Ex: Chambre Froide N°1"
                    value={storageName}
                    onChange={(e) => setStorageName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storageType">Type d&apos;emplacement</Label>
                  <select
                    id="storageType"
                    value={storageType}
                    onChange={(e) => setStorageType(e.target.value as StorageLocationType)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="cold_room">Chambre Froide (-5°C à -18°C)</option>
                    <option value="flake_silo">Silo à Écailles (-7°C sous-refroidie)</option>
                    <option value="buffer_pit">Bac Tampon / Fosse à glace</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="storageTemp">Température (°C)</Label>
                    <Input
                      id="storageTemp"
                      type="number"
                      step="0.5"
                      value={storageTemp}
                      onChange={(e) => setStorageTemp(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storageCap">Capacité (Tonnes)</Label>
                    <Input
                      id="storageCap"
                      type="number"
                      step="1"
                      value={storageCap}
                      onChange={(e) => setStorageCap(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveFacilityForStorage(null)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ajouter"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Machine Modal Dialog */}
      {activeFacilityForMachine && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Ajouter une Machine à Glace</CardTitle>
                <CardDescription>Générateur d&apos;écailles, glaçons ou blocs</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveFacilityForMachine(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateMachine} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="machineName">Nom / Identifiant *</Label>
                  <Input
                    id="machineName"
                    placeholder="Ex: Générateur Geneglace F900"
                    value={machineName}
                    onChange={(e) => setMachineName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="machineModel">Marque & Modèle</Label>
                  <Input
                    id="machineModel"
                    placeholder="Ex: Scotsman MV1000, Geneglace..."
                    value={machineModel}
                    onChange={(e) => setMachineModel(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="machineIceType">Type de Glace</Label>
                    <select
                      id="machineIceType"
                      value={machineIceType}
                      onChange={(e) =>
                        setMachineIceType(e.target.value as "glacons" | "ecailles" | "blocs")
                      }
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="glacons">Glaçons 🧊</option>
                      <option value="ecailles">Écailles ❄️</option>
                      <option value="blocs">Blocs 🧊</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="machineCap">Capacité (T / 24h)</Label>
                    <Input
                      id="machineCap"
                      type="number"
                      step="0.5"
                      value={machineCap}
                      onChange={(e) => setMachineCap(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveFacilityForMachine(null)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ajouter la machine"}
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
