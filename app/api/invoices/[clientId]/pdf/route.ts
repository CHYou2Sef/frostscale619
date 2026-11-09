import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { resolveTenantContext } from "@/lib/tenant/context";
import { getClientsAction } from "@/lib/actions/clients";
import { InvoiceDocument } from "@/lib/pdf/invoice-document";
import { renderToBuffer } from "@react-pdf/renderer";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const resolvedParams = await params;
  const { clientId } = resolvedParams;

  const tenantResult = await resolveTenantContext();
  if (!tenantResult.success) {
    return new NextResponse("Non autorisé — Veuillez vous connecter", { status: 401 });
  }

  const { context } = tenantResult;
  const clientsResult = await getClientsAction();

  const clients = clientsResult.success ? clientsResult.data : [];
  const client = clients.find((c) => c.id === clientId) || clients[0];

  if (!client) {
    return new NextResponse("Client introuvable", { status: 404 });
  }

  try {
    const documentElement = React.createElement(InvoiceDocument, {
      client,
      companyName: context.organization.name,
      companyTaxId: context.organization.tax_id,
      companyAddress: context.organization.address,
      companyPhone: context.organization.phone,
      invoiceNumber: `FAC-${new Date().getFullYear()}-${client.slug.slice(0, 4).toUpperCase()}`,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(documentElement as any);

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="facture-glace-${client.slug}.pdf"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Erreur lors de la génération PDF:", error);
    return new NextResponse("Erreur lors de la génération du document PDF", { status: 500 });
  }
}
