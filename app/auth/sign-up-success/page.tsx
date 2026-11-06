import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MailCheck, ArrowRight } from "lucide-react";

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-muted/20">
      <div className="w-full max-w-md">
        <Card className="text-center shadow-lg border-muted">
          <CardHeader className="space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MailCheck className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Compte créé avec succès !
            </CardTitle>
            <CardDescription>
              Vérifiez votre boîte e-mail pour activer votre compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Un e-mail de confirmation vient de vous être envoyé. Veuillez cliquer sur le lien qu&apos;il contient avant de vous connecter à votre espace usine.
            </p>
            <Button asChild className="w-full gap-2">
              <Link href="/auth/login">
                Aller à la page de connexion
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
