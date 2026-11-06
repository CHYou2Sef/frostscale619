"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrganizationAction } from "@/lib/actions/organization";
import {
  updateOrganizationSchema,
  TUNISIAN_CITIES,
  type IceType,
} from "@/lib/validations/organization";
import type { TenantContext } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, CheckCircle2, ShieldAlert } from "lucide-react";

interface CompanySettingsFormProps {
  context: TenantContext;
}

export function CompanySettingsForm({ context }: CompanySettingsFormProps) {
  const router = useRouter();
  const { organization, role } = context;

  const canEdit = ["owner", "admin"].includes(role);

  const [name, setName] = useState(organization.name);
  const [legalName, setLegalName] = useState(organization.legal_name || "");
  const [taxId, setTaxId] = useState(organization.tax_id || "");
  const [phone, setPhone] = useState(organization.phone || "");
  const [address, setAddress] = useState(organization.address || "");
  const [city, setCity] = useState(organization.city || "Sfax");
  const [iceTypes, setIceTypes] = useState<IceType[]>(organization.ice_types);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleIceType = (type: IceType) => {
    if (!canEdit) return;
    if (iceTypes.includes(type)) {
      if (iceTypes.length > 1) {
        setIceTypes(iceTypes.filter((t) => t !== type));
      }
    } else {
      setIceTypes([...iceTypes, type]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setError(null);
    setSuccess(false);

    const validation = updateOrganizationSchema.safeParse({
      name,
      legal_name: legalName,
      tax_id: taxId,
      phone,
      address,
      city,
      ice_types: iceTypes,
    });

    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? "Veuillez vérifier les informations.");
      return;
    }

    setLoading(true);

    try {
      const res = await updateOrganizationAction(organization.id, validation.data);
      if (!res.success) {
        setError(res.error);
        return;
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Paramètres de l&apos;Usine</h1>
          <p className="text-sm text-muted-foreground">
            Gérez les informations légales, fiscales et opérationnelles de l&apos;entreprise
          </p>
        </div>
        <Badge variant={canEdit ? "default" : "secondary"}>
          {canEdit ? "Droits de modification" : "Lecture seule"}
        </Badge>
      </div>

      {!canEdit && (
        <div className="flex items-center gap-3 rounded-md bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-600 dark:text-amber-400">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <span>
            Seuls les rôles <strong>Propriétaire</strong> ou <strong>Gestionnaire Usine</strong> sont
            autorisés à modifier les coordonnées de l&apos;entreprise.
          </span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Informations Générales & Fiscales</CardTitle>
          <CardDescription>
            Ces coordonnées apparaîtront sur les bons de pesée et de livraison
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Paramètres enregistrés avec succès.</span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Nom commercial de l&apos;Entreprise</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!canEdit || loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="legalName">Raison Sociale</Label>
                <Input
                  id="legalName"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  disabled={!canEdit || loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId">Matricule Fiscal (Tunisie)</Label>
                <Input
                  id="taxId"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  disabled={!canEdit || loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!canEdit || loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Gouvernorat / Ville</Label>
                <select
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={!canEdit || loading}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                >
                  {TUNISIAN_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Adresse de l&apos;Usine</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={!canEdit || loading}
                />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <Label className="text-sm font-semibold">Lignes de Production Activées</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                <label
                  className={`flex items-start gap-3 rounded-lg border p-3 ${
                    canEdit ? "cursor-pointer" : "cursor-not-allowed opacity-75"
                  } ${
                    iceTypes.includes("glacons")
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <Checkbox
                    checked={iceTypes.includes("glacons")}
                    onCheckedChange={() => toggleIceType("glacons")}
                    disabled={!canEdit || loading}
                  />
                  <div>
                    <div className="font-medium text-sm">🧊 Glaçons</div>
                    <div className="text-xs text-muted-foreground">Sacs & vrac</div>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 rounded-lg border p-3 ${
                    canEdit ? "cursor-pointer" : "cursor-not-allowed opacity-75"
                  } ${
                    iceTypes.includes("ecailles")
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <Checkbox
                    checked={iceTypes.includes("ecailles")}
                    onCheckedChange={() => toggleIceType("ecailles")}
                    disabled={!canEdit || loading}
                  />
                  <div>
                    <div className="font-medium text-sm">❄️ Écailles</div>
                    <div className="text-xs text-muted-foreground">Pêche & marée</div>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 rounded-lg border p-3 ${
                    canEdit ? "cursor-pointer" : "cursor-not-allowed opacity-75"
                  } ${
                    iceTypes.includes("blocs")
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <Checkbox
                    checked={iceTypes.includes("blocs")}
                    onCheckedChange={() => toggleIceType("blocs")}
                    disabled={!canEdit || loading}
                  />
                  <div>
                    <div className="font-medium text-sm">🧊 Blocs</div>
                    <div className="text-xs text-muted-foreground">Pains 25/50kg</div>
                  </div>
                </label>
              </div>
            </div>

            {canEdit && (
              <div className="flex justify-end pt-2">
                <Button type="submit" className="gap-2" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Enregistrer les modifications
                    </>
                  )}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
