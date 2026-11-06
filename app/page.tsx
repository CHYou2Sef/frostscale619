import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Snowflake, ShieldCheck, Factory, Truck } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-lg">
              ❄
            </div>
            <span className="font-bold text-xl tracking-tight">FROSTSCALE619</span>
            <span className="rounded bg-accent px-1.5 py-0.5 text-xs font-medium text-accent-foreground">
              Tunisie
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/auth/login">Connexion</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/auth/sign-up">Commencer</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="container mx-auto flex max-w-6xl flex-col items-center justify-center gap-6 px-4 py-24 text-center md:py-32">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-sm font-medium">
            <span className="text-primary font-bold">ERP Industriel</span>
            <span>·</span>
            <span>Fabrication et distribution de glace alimentaire</span>
          </div>

          <h1 className="max-w-4xl font-extrabold text-4xl tracking-tight sm:text-5xl md:text-6xl">
            La plateforme tout-en-un pour les{" "}
            <span className="text-primary">fabricants de glace</span> en Tunisie
          </h1>

          <p className="max-w-2xl text-lg text-muted-foreground">
            Pilotez votre production de glaçons, écailles et blocs de glace.
            Gérez vos chambres froides, vos tournées de livraison et votre facturation
            avec une isolation multi-tenant native.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="gap-2">
              <Link href="/auth/sign-up">
                <Snowflake className="h-5 w-5" />
                Créer une entreprise
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth/login">Accéder à mon espace</Link>
            </Button>
          </div>
        </section>

        {/* Feature grid */}
        <section className="border-t bg-muted/40 py-16">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col gap-3 rounded-lg border bg-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-primary">
                  <Factory className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg">3 Lignes de Production</h3>
                <p className="text-sm text-muted-foreground">
                  Glaçons cylindriques/creux, glace en écailles pour la marée,
                  et blocs de glace industriels. Suivi par lot en temps réel.
                </p>
              </div>

              <div className="flex flex-col gap-3 rounded-lg border bg-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-primary">
                  <Truck className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg">Distribution Cold-Chain</h3>
                <p className="text-sm text-muted-foreground">
                  Tournées matinales vers les marchés de poisson, poissonneries
                  et restaurants. Gestion des caisses isothermes et consignes.
                </p>
              </div>

              <div className="flex flex-col gap-3 rounded-lg border bg-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg">Isolation Multi-Tenant</h3>
                <p className="text-sm text-muted-foreground">
                  Sécurité au niveau de la base de données (PostgreSQL RLS).
                  Vos données de production et financières restent hermétiquement isolées.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <div className="container mx-auto max-w-6xl px-4">
          <p>© {new Date().getFullYear()} FROSTSCALE619 — ERP pour fabricants de glace tunisiens. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
