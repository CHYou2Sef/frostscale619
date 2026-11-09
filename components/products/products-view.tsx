"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { IceProduct } from "@/types/database";
import type { TenantContext } from "@/types/auth";
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
  toggleProductActiveAction,
} from "@/lib/actions/products";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";

interface ProductsViewProps {
  initialProducts: IceProduct[];
  context: TenantContext;
}

export function ProductsView({ initialProducts, context }: ProductsViewProps) {
  const router = useRouter();
  const { role } = context;
  const canManage = ["owner", "admin"].includes(role);

  const [products] = useState<IceProduct[]>(initialProducts);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IceProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<IceProduct | null>(null);

  // Add Form state
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [iceType, setIceType] = useState<"glacons" | "ecailles" | "blocs">("glacons");
  const [unit, setUnit] = useState<"sac" | "kg" | "bloc" | "tonne" | "caisse">("sac");
  const [weightKg, setWeightKg] = useState("5.0");
  const [priceTnd, setPriceTnd] = useState("3.500");

  // Edit Form state
  const [editName, setEditName] = useState("");
  const [editWeightKg, setEditWeightKg] = useState("");
  const [editPriceTnd, setEditPriceTnd] = useState("");
  const [editUnit, setEditUnit] = useState<"sac" | "kg" | "bloc" | "tonne" | "caisse">("sac");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await createProductAction({
      name,
      code,
      ice_type: iceType,
      unit,
      nominal_weight_kg: parseFloat(weightKg) || 1,
      unit_price_tnd: parseFloat(priceTnd) || 0,
    });

    setLoading(false);
    if (!res.success) {
      setError(res.error);
      return;
    }

    setShowAddModal(false);
    setName("");
    setCode("");
    router.refresh();
  };

  const openEditModal = (p: IceProduct) => {
    setEditingProduct(p);
    setEditName(p.name);
    setEditWeightKg(p.nominal_weight_kg.toString());
    setEditPriceTnd(Number(p.unit_price_tnd).toFixed(3));
    setEditUnit(p.unit);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setLoading(true);
    setError(null);

    const res = await updateProductAction(editingProduct.id, {
      name: editName,
      unit: editUnit,
      nominal_weight_kg: parseFloat(editWeightKg) || 1,
      unit_price_tnd: parseFloat(editPriceTnd) || 0,
    });

    setLoading(false);
    if (!res.success) {
      setError(res.error);
      return;
    }

    setEditingProduct(null);
    router.refresh();
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    setLoading(true);
    setError(null);

    const res = await deleteProductAction(deletingProduct.id);
    setLoading(false);

    if (!res.success) {
      setError(res.error);
      return;
    }

    setDeletingProduct(null);
    router.refresh();
  };

  const handleToggleActive = async (productId: string, currentActive: boolean) => {
    if (!canManage) return;
    await toggleProductActiveAction(productId, !currentActive);
    router.refresh();
  };

  const iceTypeBadges = {
    glacons: { label: "Glaçons", icon: "🧊" },
    ecailles: { label: "Écailles", icon: "❄️" },
    blocs: { label: "Blocs", icon: "🧊" },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Catalogue Produits & Tarification
          </h1>
          <p className="text-sm text-muted-foreground">
            Articles de vente (sacs de glaçons, vrac marée, pains de glace) et tarifs en Dinars Tunisiens
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvel Article Glace
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

      {/* Products Grid */}
      {products.length === 0 ? (
        <Card className="text-center p-12 border-dashed">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
            <Package className="h-7 w-7" />
          </div>
          <h3 className="font-semibold text-lg">Aucun produit configuré</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            Enregistrez vos conditionnements (ex: Sac Glaçons 5kg, Caisse Écailles 20kg, Pain de glace 25kg).
          </p>
          {canManage && (
            <Button onClick={() => setShowAddModal(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Créer un Article
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Card
              key={p.id}
              className={`transition-all ${
                p.is_active ? "border-border shadow-sm" : "opacity-60 bg-muted/20"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-xs font-mono">
                      {p.code}
                    </Badge>
                    <CardTitle className="text-lg pt-1">{p.name}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {iceTypeBadges[p.ice_type]?.icon} {iceTypeBadges[p.ice_type]?.label}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-2 gap-2 text-xs border rounded-lg p-3 bg-muted/30">
                  <div>
                    <span className="text-muted-foreground block">Poids Nominal</span>
                    <strong className="font-semibold text-sm">
                      {p.nominal_weight_kg} kg
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Conditionnement</span>
                    <strong className="font-semibold text-sm capitalize">
                      {p.unit}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t pt-3">
                  <div>
                    <span className="text-xs text-muted-foreground block">Prix Unitaire</span>
                    <span className="text-lg font-bold text-primary font-mono">
                      {Number(p.unit_price_tnd).toFixed(3)} <small className="text-xs font-sans">TND</small>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(p.id, p.is_active)}
                          className="focus:outline-none"
                          title={p.is_active ? "Désactiver" : "Activer"}
                        >
                          <Badge
                            variant={p.is_active ? "default" : "outline"}
                            className="cursor-pointer text-xs flex items-center gap-1"
                          >
                            {p.is_active ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                Actif
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3" />
                                Inactif
                              </>
                            )}
                          </Badge>
                        </button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => openEditModal(p)}
                          title="Modifier"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeletingProduct(p)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Nouvel Article Glace</CardTitle>
                <CardDescription>Ajoutez une référence à votre catalogue de vente</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prodName">Désignation Commerciale *</Label>
                  <Input
                    id="prodName"
                    placeholder="Ex: Sac Glaçons 5kg CHR"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prodCode">Code Article (ex: GLAC-05KG) *</Label>
                  <Input
                    id="prodCode"
                    placeholder="GLAC-05KG"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prodType">Type de Glace</Label>
                    <select
                      id="prodType"
                      value={iceType}
                      onChange={(e) =>
                        setIceType(e.target.value as "glacons" | "ecailles" | "blocs")
                      }
                      className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm shadow-sm"
                    >
                      <option value="glacons">🧊 Glaçons</option>
                      <option value="ecailles">❄️ Écailles</option>
                      <option value="blocs">🧊 Blocs</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prodUnit">Conditionnement</Label>
                    <select
                      id="prodUnit"
                      value={unit}
                      onChange={(e) =>
                        setUnit(
                          e.target.value as "sac" | "kg" | "bloc" | "tonne" | "caisse"
                        )
                      }
                      className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm shadow-sm"
                    >
                      <option value="sac">Sac</option>
                      <option value="kg">Kilogramme (kg)</option>
                      <option value="bloc">Bloc</option>
                      <option value="tonne">Tonne</option>
                      <option value="caisse">Caisse</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prodWeight">Poids Nominal (kg) *</Label>
                    <Input
                      id="prodWeight"
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prodPrice">Prix Unitaire HT (TND) *</Label>
                    <Input
                      id="prodPrice"
                      type="number"
                      step="0.001"
                      min="0"
                      value={priceTnd}
                      onChange={(e) => setPriceTnd(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={loading} className="gap-2">
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Enregistrer le Produit
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Modifier Article : {editingProduct.code}</CardTitle>
                <CardDescription>Mettez à jour le tarif et conditionnement</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setEditingProduct(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProduct} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editName">Désignation Commerciale *</Label>
                  <Input
                    id="editName"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editUnit">Conditionnement</Label>
                  <select
                    id="editUnit"
                    value={editUnit}
                    onChange={(e) =>
                      setEditUnit(
                        e.target.value as "sac" | "kg" | "bloc" | "tonne" | "caisse"
                      )
                    }
                    className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="sac">Sac</option>
                    <option value="kg">Kilogramme (kg)</option>
                    <option value="bloc">Bloc</option>
                    <option value="tonne">Tonne</option>
                    <option value="caisse">Caisse</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editWeight">Poids Nominal (kg) *</Label>
                    <Input
                      id="editWeight"
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={editWeightKg}
                      onChange={(e) => setEditWeightKg(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editPrice">Prix Unitaire HT (TND) *</Label>
                    <Input
                      id="editPrice"
                      type="number"
                      step="0.001"
                      min="0"
                      value={editPriceTnd}
                      onChange={(e) => setEditPriceTnd(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingProduct(null)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={loading} className="gap-2">
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Mettre à jour
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-sm shadow-2xl border-destructive/30">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <CardTitle className="text-base">Confirmer la Suppression</CardTitle>
              </div>
              <CardDescription>
                Êtes-vous sûr de vouloir supprimer l&apos;article <strong>{deletingProduct.name}</strong> ({deletingProduct.code}) ?
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingProduct(null)}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={loading}
                onClick={handleDeleteProduct}
                className="gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Supprimer
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
