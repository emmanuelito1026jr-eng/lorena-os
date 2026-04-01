import { Download } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { CMAPdfDocument } from './CMAPdfDocument';
import type { CMAPdfProps } from './CMAPdfDocument';

interface CMAPdfButtonProps {
  data: CMAPdfProps;
}

export function CMAPdfButton({ data }: CMAPdfButtonProps) {
  const safeAddress = data.subjectProperty.address
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 40);
  const dateSlug = new Date().toISOString().slice(0, 10);
  const filename = `CMA-${safeAddress}-${dateSlug}.pdf`;

  return (
    <PDFDownloadLink
      document={<CMAPdfDocument {...data} />}
      fileName={filename}
    >
      {({ loading }) => (
        <button
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] disabled:opacity-50 text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]"
        >
          <Download size={16} />
          {loading ? 'Generating PDF...' : 'Download PDF'}
        </button>
      )}
    </PDFDownloadLink>
  );
}
