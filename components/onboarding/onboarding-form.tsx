"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOrganizationAction } from "@/lib/actions/organization";
import {
  createOrganizationSchema,
  TUNISIAN_CITIES,
  type IceType,
} from "@/lib/validations/organization";
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
import { Factory, Loader2, Sparkles } from "lucide-react";

export function OnboardingForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [phone, setPhone] = useState("+216 ");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Sfax");
  const [iceTypes, setIceTypes] = useState<IceType[]>(["glacons", "ecailles"]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleIceType = (type: IceType) => {
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
    setError(null);

    const validation = createOrganizationSchema.safeParse({
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
      const res = await createOrganizationAction(validation.data);
      if (!res.success) {
        setError(res.error);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl shadow-xl border-muted">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">
          <Factory className="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl font-bold">Configuration de votre Entreprise</CardTitle>
        <CardDescription>
          FROSTSCALE619 adapte les flux de travail à votre type de production de glace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nom commercial de l&apos;Entreprise *</Label>
              <Input
                id="name"
                placeholder="Ex. Glacière Moderne de Sfax"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="legalName">Raison Sociale (Optionnel)</Label>
              <Input
                id="legalName"
                placeholder="Ex. Ste Glace & Froid SARL"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxId">Matricule Fiscal (Tunisie)</Label>
              <Input
                id="taxId"
                placeholder="1234567/A/P/M/000"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone Usine / Responsable</Label>
              <Input
                id="phone"
                placeholder="+216 74 123 456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Gouvernorat / Ville</Label>
              <select
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={loading}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {TUNISIAN_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Adresse de l&apos;Usine / Dépôt</Label>
              <Input
                id="address"
                placeholder="Zone Portuaire ou Industrielle"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t">
            <Label className="text-sm font-semibold">
              Lignes de Glace Fabriquées (Sélectionnez au moins une)
            </Label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  iceTypes.includes("glacons")
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <Checkbox
                  checked={iceTypes.includes("glacons")}
                  onCheckedChange={() => toggleIceType("glacons")}
                  disabled={loading}
                />
                <div className="space-y-1">
                  <div className="font-medium text-sm">🧊 Glaçons</div>
                  <div className="text-xs text-muted-foreground">
                    Cylindres et creux pour CHR & grande distribution.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  iceTypes.includes("ecailles")
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <Checkbox
                  checked={iceTypes.includes("ecailles")}
                  onCheckedChange={() => toggleIceType("ecailles")}
                  disabled={loading}
                />
                <div className="space-y-1">
                  <div className="font-medium text-sm">❄️ Écailles</div>
                  <div className="text-xs text-muted-foreground">
                    Glace sous-refroidie pour marée et pêche côtière.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  iceTypes.includes("blocs")
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <Checkbox
                  checked={iceTypes.includes("blocs")}
                  onCheckedChange={() => toggleIceType("blocs")}
                  disabled={loading}
                />
                <div className="space-y-1">
                  <div className="font-medium text-sm">🧊 Blocs</div>
                  <div className="text-xs text-muted-foreground">
                    Pains de glace 25kg / 50kg pour chalutiers & stockage.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Valider et Accéder au Tableau de Bord
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
