import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer';

// ---------------------------------------------------------------------------
// Font registration (Google Fonts CDN)
// ---------------------------------------------------------------------------
Font.register({
  family: 'Playfair Display',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDTbtPY_Q.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKd3vEDTbtPY_Q.ttf', fontWeight: 700 },
  ],
});

Font.register({
  family: 'Lato',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHvxk.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/lato/v24/S6u9w4BMUTPHh6UVew8.ttf', fontWeight: 700 },
  ],
});

// ---------------------------------------------------------------------------
// Colours
// ---------------------------------------------------------------------------
const GOLD = '#C9A84C';
const NEAR_BLACK = '#1a1a1a';
const GRAY = '#666666';
const LIGHT_GRAY = '#888888';
const LIGHT_GOLD_TINT = '#FBF8F0';
const WHITE = '#FFFFFF';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface CMAPdfProps {
  agentName: string;
  agentPhone: string;
  agentEmail: string;
  agentPhoto?: string;
  clientName: string;
  subjectProperty: {
    address: string;
    beds: number;
    baths: number;
    sqft: number;
    yearBuilt: number;
    listPrice?: number;
  };
  comparables: Array<{
    address: string;
    beds: number;
    baths: number;
    sqft: number;
    salePrice: number;
    pricePerSqft: number;
    soldDate: string;
    daysOnMarket: number;
    distanceMiles?: number;
  }>;
  estimatedValue: number;
  estimatedLow: number;
  estimatedHigh: number;
  marketNotes?: string;
  generatedDate: string;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  // Global page
  page: {
    fontFamily: 'Lato',
    fontSize: 10,
    color: NEAR_BLACK,
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 45,
  },
  goldTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: GOLD,
  },

  // Footer (fixed)
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 45,
    right: 45,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5E0',
    paddingTop: 8,
  },
  footerText: {
    fontFamily: 'Lato',
    fontSize: 7,
    color: LIGHT_GRAY,
  },

  // Shared
  sectionHeader: {
    fontFamily: 'Playfair Display',
    fontSize: 18,
    fontWeight: 700,
    color: NEAR_BLACK,
    marginBottom: 4,
  },
  goldUnderline: {
    width: 50,
    height: 2,
    backgroundColor: GOLD,
    marginBottom: 16,
  },

  // Cover page
  coverCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 28,
    fontWeight: 700,
    color: NEAR_BLACK,
    marginBottom: 8,
    textAlign: 'center',
  },
  coverSubtitle: {
    fontFamily: 'Lato',
    fontSize: 12,
    color: GRAY,
    marginBottom: 6,
    textAlign: 'center',
  },
  coverAddress: {
    fontFamily: 'Playfair Display',
    fontSize: 16,
    fontWeight: 700,
    color: GOLD,
    marginTop: 16,
    textAlign: 'center',
  },
  coverDate: {
    fontFamily: 'Lato',
    fontSize: 9,
    color: LIGHT_GRAY,
    marginTop: 12,
    textAlign: 'center',
  },
  coverAgentBlock: {
    marginTop: 30,
    alignItems: 'center',
  },
  coverAgentName: {
    fontFamily: 'Playfair Display',
    fontSize: 13,
    fontWeight: 700,
    color: NEAR_BLACK,
  },
  coverAgentDetail: {
    fontFamily: 'Lato',
    fontSize: 9,
    color: GRAY,
    marginTop: 2,
  },
  coverTagline: {
    fontFamily: 'Lato',
    fontSize: 9,
    color: GOLD,
    marginTop: 8,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  coverAgentPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },

  // Subject Property
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
  },
  detailCell: {
    width: '33%',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  detailLabel: {
    fontFamily: 'Lato',
    fontSize: 8,
    color: LIGHT_GRAY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    fontFamily: 'Lato',
    fontSize: 12,
    fontWeight: 700,
    color: NEAR_BLACK,
  },
  estimateBox: {
    marginTop: 20,
    padding: 20,
    backgroundColor: LIGHT_GOLD_TINT,
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 4,
    alignItems: 'center',
  },
  estimateLabel: {
    fontFamily: 'Lato',
    fontSize: 9,
    color: GRAY,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  estimateValue: {
    fontFamily: 'Playfair Display',
    fontSize: 30,
    fontWeight: 700,
    color: GOLD,
    marginTop: 4,
  },
  estimateRange: {
    fontFamily: 'Lato',
    fontSize: 10,
    color: GRAY,
    marginTop: 4,
  },
  bodyText: {
    fontFamily: 'Lato',
    fontSize: 10,
    color: GRAY,
    lineHeight: 1.5,
    marginTop: 14,
  },

  // Comps table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: GOLD,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 2,
  },
  tableHeaderCell: {
    fontFamily: 'Lato',
    fontSize: 7,
    fontWeight: 700,
    color: WHITE,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E0',
  },
  tableRowAlt: {
    backgroundColor: LIGHT_GOLD_TINT,
  },
  tableCell: {
    fontFamily: 'Lato',
    fontSize: 8,
    color: NEAR_BLACK,
  },
  tableSummaryRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderTopWidth: 1.5,
    borderTopColor: GOLD,
    marginTop: 2,
  },
  tableSummaryCell: {
    fontFamily: 'Lato',
    fontSize: 8,
    fontWeight: 700,
    color: NEAR_BLACK,
  },

  // column widths (8 columns)
  colAddress: { width: '26%' },
  colBeds: { width: '7%', textAlign: 'center' as const },
  colBaths: { width: '7%', textAlign: 'center' as const },
  colSqft: { width: '12%', textAlign: 'right' as const },
  colPrice: { width: '16%', textAlign: 'right' as const },
  colPpSqft: { width: '12%', textAlign: 'right' as const },
  colDate: { width: '12%', textAlign: 'center' as const },
  colDom: { width: '8%', textAlign: 'center' as const },

  // Market summary
  statRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 4,
    padding: 14,
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: 'Lato',
    fontSize: 8,
    color: GRAY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: 'Playfair Display',
    fontSize: 18,
    fontWeight: 700,
    color: NEAR_BLACK,
  },
  disclaimer: {
    fontFamily: 'Lato',
    fontSize: 7,
    color: LIGHT_GRAY,
    lineHeight: 1.4,
    marginTop: 24,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5E0',
    paddingTop: 10,
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmtCurrency(n: number): string {
  return '$' + n.toLocaleString('en-US');
}

function PageFooter({ agentName, pageNum }: { agentName: string; pageNum: number }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>{agentName}</Text>
      <Text style={s.footerText}>Casas En El Paso TX</Text>
      <Text style={s.footerText}>Page {pageNum}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------
export function CMAPdfDocument(props: CMAPdfProps) {
  const {
    agentName,
    agentPhone,
    agentEmail,
    agentPhoto,
    clientName,
    subjectProperty: sp,
    comparables,
    estimatedValue,
    estimatedLow,
    estimatedHigh,
    marketNotes,
    generatedDate,
  } = props;

  // Compute averages for summary
  const avgPrice = comparables.length
    ? Math.round(comparables.reduce((s, c) => s + c.salePrice, 0) / comparables.length)
    : 0;
  const avgPpSqft = comparables.length
    ? Math.round(comparables.reduce((s, c) => s + c.pricePerSqft, 0) / comparables.length)
    : 0;
  const avgDom = comparables.length
    ? Math.round(comparables.reduce((s, c) => s + c.daysOnMarket, 0) / comparables.length)
    : 0;

  return (
    <Document title={`CMA - ${sp.address}`} author={agentName}>
      {/* ---------------------------------------------------------------- */}
      {/* PAGE 1 — Cover                                                   */}
      {/* ---------------------------------------------------------------- */}
      <Page size="LETTER" style={[s.page, { paddingTop: 0, paddingBottom: 0 }]}>
        <View style={s.goldTopBar} />
        <View style={s.coverCenter}>
          <Text style={s.coverTitle}>Comparative Market Analysis</Text>
          <Text style={s.coverSubtitle}>Prepared for {clientName}</Text>
          <Text style={s.coverAddress}>{sp.address}</Text>
          <Text style={s.coverDate}>{generatedDate}</Text>

          <View style={s.coverAgentBlock}>
            {agentPhoto && <Image src={agentPhoto} style={s.coverAgentPhoto} />}
            <Text style={s.coverAgentName}>{agentName}</Text>
            <Text style={s.coverAgentDetail}>{agentPhone}  |  {agentEmail}</Text>
            <Text style={s.coverTagline}>El Paso&apos;s Trusted Real Estate Expert</Text>
          </View>
        </View>
        <PageFooter agentName={agentName} pageNum={1} />
      </Page>

      {/* ---------------------------------------------------------------- */}
      {/* PAGE 2 — Subject Property Summary                                */}
      {/* ---------------------------------------------------------------- */}
      <Page size="LETTER" style={s.page}>
        <View style={s.goldTopBar} />
        <Text style={s.sectionHeader}>Your Property</Text>
        <View style={s.goldUnderline} />

        <View style={s.detailGrid}>
          <View style={s.detailCell}>
            <Text style={s.detailLabel}>Address</Text>
            <Text style={s.detailValue}>{sp.address}</Text>
          </View>
          <View style={s.detailCell}>
            <Text style={s.detailLabel}>Bedrooms</Text>
            <Text style={s.detailValue}>{sp.beds}</Text>
          </View>
          <View style={s.detailCell}>
            <Text style={s.detailLabel}>Bathrooms</Text>
            <Text style={s.detailValue}>{sp.baths}</Text>
          </View>
          <View style={s.detailCell}>
            <Text style={s.detailLabel}>Square Feet</Text>
            <Text style={s.detailValue}>{sp.sqft.toLocaleString()}</Text>
          </View>
          <View style={s.detailCell}>
            <Text style={s.detailLabel}>Year Built</Text>
            <Text style={s.detailValue}>{sp.yearBuilt}</Text>
          </View>
          {sp.listPrice && (
            <View style={s.detailCell}>
              <Text style={s.detailLabel}>List Price</Text>
              <Text style={s.detailValue}>{fmtCurrency(sp.listPrice)}</Text>
            </View>
          )}
        </View>

        <View style={s.estimateBox}>
          <Text style={s.estimateLabel}>Estimated Market Value</Text>
          <Text style={s.estimateValue}>{fmtCurrency(estimatedValue)}</Text>
          <Text style={s.estimateRange}>
            Range: {fmtCurrency(estimatedLow)} {'\u2014'} {fmtCurrency(estimatedHigh)}
          </Text>
        </View>

        <Text style={s.bodyText}>
          This estimate is based on {comparables.length} recent comparable sale{comparables.length !== 1 ? 's' : ''} within
          your area. Market conditions in El Paso are reflected in the analysis below.
        </Text>

        <PageFooter agentName={agentName} pageNum={2} />
      </Page>

      {/* ---------------------------------------------------------------- */}
      {/* PAGE 3 — Comparable Sales Table                                  */}
      {/* ---------------------------------------------------------------- */}
      <Page size="LETTER" style={s.page}>
        <View style={s.goldTopBar} />
        <Text style={s.sectionHeader}>Recent Comparable Sales</Text>
        <View style={s.goldUnderline} />

        {/* Header */}
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderCell, s.colAddress]}>Address</Text>
          <Text style={[s.tableHeaderCell, s.colBeds]}>Beds</Text>
          <Text style={[s.tableHeaderCell, s.colBaths]}>Baths</Text>
          <Text style={[s.tableHeaderCell, s.colSqft]}>SqFt</Text>
          <Text style={[s.tableHeaderCell, s.colPrice]}>Sale Price</Text>
          <Text style={[s.tableHeaderCell, s.colPpSqft]}>$/SqFt</Text>
          <Text style={[s.tableHeaderCell, s.colDate]}>Sold</Text>
          <Text style={[s.tableHeaderCell, s.colDom]}>DOM</Text>
        </View>

        {/* Rows */}
        {comparables.map((comp, i) => (
          <View
            key={i}
            style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}
            wrap={false}
          >
            <Text style={[s.tableCell, s.colAddress]}>{comp.address}</Text>
            <Text style={[s.tableCell, s.colBeds]}>{comp.beds}</Text>
            <Text style={[s.tableCell, s.colBaths]}>{comp.baths}</Text>
            <Text style={[s.tableCell, s.colSqft]}>{comp.sqft.toLocaleString()}</Text>
            <Text style={[s.tableCell, s.colPrice]}>{fmtCurrency(comp.salePrice)}</Text>
            <Text style={[s.tableCell, s.colPpSqft]}>{fmtCurrency(comp.pricePerSqft)}</Text>
            <Text style={[s.tableCell, s.colDate]}>{comp.soldDate}</Text>
            <Text style={[s.tableCell, s.colDom]}>{comp.daysOnMarket}</Text>
          </View>
        ))}

        {/* Summary row */}
        {comparables.length > 0 && (
          <View style={s.tableSummaryRow}>
            <Text style={[s.tableSummaryCell, s.colAddress]}>Averages ({comparables.length} comps)</Text>
            <Text style={[s.tableSummaryCell, s.colBeds]} />
            <Text style={[s.tableSummaryCell, s.colBaths]} />
            <Text style={[s.tableSummaryCell, s.colSqft]} />
            <Text style={[s.tableSummaryCell, s.colPrice]}>{fmtCurrency(avgPrice)}</Text>
            <Text style={[s.tableSummaryCell, s.colPpSqft]}>{fmtCurrency(avgPpSqft)}</Text>
            <Text style={[s.tableSummaryCell, s.colDate]} />
            <Text style={[s.tableSummaryCell, s.colDom]}>{avgDom}</Text>
          </View>
        )}

        <PageFooter agentName={agentName} pageNum={3} />
      </Page>

      {/* ---------------------------------------------------------------- */}
      {/* PAGE 4 — Market Summary                                          */}
      {/* ---------------------------------------------------------------- */}
      <Page size="LETTER" style={s.page}>
        <View style={s.goldTopBar} />
        <Text style={s.sectionHeader}>El Paso Market Snapshot</Text>
        <View style={s.goldUnderline} />

        <View style={s.statRow}>
          <View style={s.statBox}>
            <Text style={s.statLabel}>Average Sale Price</Text>
            <Text style={s.statValue}>{fmtCurrency(avgPrice)}</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statLabel}>Avg Days on Market</Text>
            <Text style={s.statValue}>{avgDom}</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statLabel}>Price Per SqFt Avg</Text>
            <Text style={s.statValue}>{fmtCurrency(avgPpSqft)}</Text>
          </View>
        </View>

        {marketNotes && (
          <Text style={s.bodyText}>{marketNotes}</Text>
        )}

        <Text style={s.bodyText}>
          Based on current market conditions and comparable sales data, the subject property is positioned
          competitively in the El Paso market.
        </Text>

        <Text style={s.disclaimer}>
          This CMA is not an appraisal and is provided for informational purposes only. It should not be
          used as a substitute for a professional appraisal. Market conditions can change rapidly and actual
          sale prices may vary. Prepared by {agentName}, licensed Texas REALTOR{'\u00AE'}.
        </Text>

        <PageFooter agentName={agentName} pageNum={4} />
      </Page>
    </Document>
  );
}
