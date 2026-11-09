import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Client } from "@/types/database";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: "#0284c7",
    paddingBottom: 14,
    marginBottom: 16,
  },
  companyName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#0369a1",
  },
  companyMeta: {
    fontSize: 8,
    color: "#475569",
    marginTop: 2,
  },
  invoiceTitleBadge: {
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: "#bae6fd",
    padding: 8,
    borderRadius: 4,
    textAlign: "right",
  },
  invoiceTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#0369a1",
  },
  invoiceNumber: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginTop: 3,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  clientBox: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    padding: 10,
    backgroundColor: "#f8fafc",
  },
  boxTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  clientName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 2,
  },
  table: {
    marginTop: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0284c7",
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    padding: 6,
    fontSize: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    padding: 6,
    fontSize: 8,
  },
  colDesc: { width: "45%" },
  colUnit: { width: "15%", textAlign: "center" },
  colQty: { width: "12%", textAlign: "right" },
  colPrice: { width: "14%", textAlign: "right" },
  colTotal: { width: "14%", textAlign: "right" },
  containersCallout: {
    borderWidth: 1,
    borderColor: "#38bdf8",
    backgroundColor: "#f0f9ff",
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  containersTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0369a1",
    marginBottom: 2,
  },
  totalsSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 24,
  },
  totalsTable: {
    width: "45%",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 4,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#0f172a",
    color: "#ffffff",
  },
  signatures: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingTop: 10,
  },
  signatureBox: {
    width: "42%",
    borderTopWidth: 1,
    borderTopColor: "#94a3b8",
    paddingTop: 6,
    textAlign: "center",
    fontSize: 8,
    color: "#475569",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    textAlign: "center",
    fontSize: 7,
    color: "#94a3b8",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 6,
  },
});

interface InvoiceDocumentProps {
  client: Client;
  companyName: string;
  companyTaxId?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;
  invoiceNumber?: string;
  invoiceDate?: string;
}

export function InvoiceDocument({
  client,
  companyName,
  companyTaxId = "1234567/A/P/M/000",
  companyAddress = "Zone Portuaire Industrielle, Tunisie",
  companyPhone = "+216 71 000 000",
  invoiceNumber = "FAC-2026-0089",
  invoiceDate = new Date().toLocaleDateString("fr-TN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }),
}: InvoiceDocumentProps) {
  const isFlake = client.ice_preference === "ecailles";
  const isBlock = client.ice_preference === "blocs";

  const productName = isFlake
    ? "Glace en Écailles Alimentaire (-7°C)"
    : isBlock
    ? "Pains de Glace Alimentaire (Blocs 25kg)"
    : "Glaçons Alimentaires Cylindriques (Sacs 5kg)";

  const unitName = isFlake ? "Tonne" : isBlock ? "Bloc 25kg" : "Sac 5kg";
  const quantity = isFlake ? 2.5 : isBlock ? 80 : 150;
  const unitPrice = isFlake ? 120.0 : isBlock ? 6.5 : 2.8;

  const totalBrutHT = quantity * unitPrice;
  const tva19 = totalBrutHT * 0.19;
  const timbreFiscal = 1.0;
  const totalNetTTC = totalBrutHT + tva19 + timbreFiscal;

  const fmt = (val: number) => val.toFixed(3);

  return (
    <Document title={`Facture-${invoiceNumber}-${client.slug}`} author="FROSTSCALE619">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.companyMeta}>Fabrication & Logistique de Glace Alimentaire</Text>
            <Text style={styles.companyMeta}>Matricule Fiscal : {companyTaxId || "En cours"}</Text>
            <Text style={styles.companyMeta}>{companyAddress}</Text>
            <Text style={styles.companyMeta}>Tél : {companyPhone}</Text>
          </View>

          <View style={styles.invoiceTitleBadge}>
            <Text style={styles.invoiceTitle}>FACTURE / BON DE LIVRAISON</Text>
            <Text style={styles.invoiceNumber}>Réf : {invoiceNumber}</Text>
            <Text style={styles.companyMeta}>Date : {invoiceDate}</Text>
            <Text style={styles.companyMeta}>Devise : TND (Dinar Tunisien)</Text>
          </View>
        </View>

        {/* Client & Delivery Info */}
        <View style={styles.metaRow}>
          <View style={styles.clientBox}>
            <Text style={styles.boxTitle}>Client Destinataire / Mareyeur</Text>
            <Text style={styles.clientName}>{client.name}</Text>
            <Text style={styles.companyMeta}>Catégorie : {client.category.toUpperCase()}</Text>
            <Text style={styles.companyMeta}>Port / Zone : {client.port_or_zone || client.city}</Text>
            <Text style={styles.companyMeta}>Adresse : {client.address || `${client.city}, Tunisie`}</Text>
            {client.tax_id && (
              <Text style={styles.companyMeta}>Matricule Fiscal : {client.tax_id}</Text>
            )}
            {client.phone && <Text style={styles.companyMeta}>Tél : {client.phone}</Text>}
          </View>

          <View style={styles.clientBox}>
            <Text style={styles.boxTitle}>Détails de la Livraison & Pesée</Text>
            <Text style={styles.companyMeta}>Statut expédition : {client.delivery_status.toUpperCase()}</Text>
            <Text style={styles.companyMeta}>Chauffeur / Tournée : Flotte FROSTSCALE619</Text>
            <Text style={styles.companyMeta}>Conditionnement : Isotherme froid continu</Text>
            <Text style={styles.companyMeta}>Mode de paiement : Comptant / Traite à 30j</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Désignation du Produit de Glace</Text>
            <Text style={styles.colUnit}>Unité</Text>
            <Text style={styles.colQty}>Quantité</Text>
            <Text style={styles.colPrice}>P.U. HT (TND)</Text>
            <Text style={styles.colTotal}>Total HT (TND)</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.colDesc}>{productName}</Text>
            <Text style={styles.colUnit}>{unitName}</Text>
            <Text style={styles.colQty}>{quantity.toFixed(1)}</Text>
            <Text style={styles.colPrice}>{fmt(unitPrice)}</Text>
            <Text style={styles.colTotal}>{fmt(totalBrutHT)}</Text>
          </View>
        </View>

        {/* Reusable Containers Callout */}
        <View style={styles.containersCallout}>
          <Text style={styles.containersTitle}>
            Suivi des Bacs Isothermes Consignés (Emballages Réutilisables)
          </Text>
          <Text style={styles.companyMeta}>
            Bacs isothermes 500L/1000L actuellement déposés chez le client :{" "}
            {client.containers_balance} unités consignées. Les emballages demeurent la propriété
            exclusive de la société fabricante de glace.
          </Text>
        </View>

        {/* Totals Section */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsTable}>
            <View style={styles.totalRow}>
              <Text>Total Brut HT :</Text>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>{fmt(totalBrutHT)} TND</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>TVA (19.000%) :</Text>
              <Text>{fmt(tva19)} TND</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>Droit de Timbre Fiscal :</Text>
              <Text>{fmt(timbreFiscal)} TND</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={{ fontFamily: "Helvetica-Bold", color: "#ffffff" }}>
                NET À PAYER TTC :
              </Text>
              <Text style={{ fontFamily: "Helvetica-Bold", color: "#ffffff" }}>
                {fmt(totalNetTTC)} TND
              </Text>
            </View>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatures}>
          <View style={styles.signatureBox}>
            <Text>Visa Responsable Expédition / Usine</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>Cachet & Signature Réceptionnaire / Mareyeur</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Document généré par FROSTSCALE619 — ERP Multi-Tenant pour Fabricants de Glace en Tunisie
          (TND Millimes)
        </Text>
      </Page>
    </Document>
  );
}
