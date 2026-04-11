/**
 * Open House QR Generator
 * Generates printable QR codes linking to /open-house?address=...&price=...
 * Lorena prints this and puts it at every open house
 */
import { useState } from 'react';
import { QrCode, Printer, Copy, Check, ExternalLink } from 'lucide-react';
import { useTranslation } from '../../lib/i18n/LanguageContext';

const BASE_URL = 'https://lorena-os.vercel.app';

interface QRConfig {
  address: string;
  price: string;
}

function QRCodeDisplay({ url, size = 200 }: { url: string; size?: number }) {
  // Use Google Charts QR API (free, no key needed)
  const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=${size}x${size}&chl=${encodeURIComponent(url)}&choe=UTF-8&chld=H|1`;
  return (
    <img
      src={qrUrl}
      alt="QR Code"
      width={size}
      height={size}
      className="rounded-lg"
    />
  );
}

export function OpenHouseQRGenerator() {
  const [config, setConfig] = useState<QRConfig>({ address: '', price: '' });
  const [copied, setCopied] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generatedUrl = config.address
    ? `${BASE_URL}/open-house?address=${encodeURIComponent(config.address)}${config.price ? `&price=${encodeURIComponent(config.price)}` : ''}`
    : '';

  const handleCopy = async () => {
    if (!generatedUrl) return;
    await navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-xl border border-dashboard-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-dashboard-gold/10 rounded-lg flex items-center justify-center">
          <QrCode size={16} className="text-dashboard-gold" />
        </div>
        <div>
          <p className="text-sm font-semibold text-dashboard-black">Open House QR Generator</p>
          <p className="text-xs text-dashboard-secondary">Print & place at every showing</p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <label className="text-xs text-dashboard-secondary mb-1 block">Property Address *</label>
          <input
            value={config.address}
            onChange={e => setConfig(p => ({ ...p, address: e.target.value }))}
            placeholder="4521 Mesa Hills Dr, El Paso TX 79912"
            className="w-full border border-dashboard-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-dashboard-gold"
          />
        </div>
        <div>
          <label className="text-xs text-dashboard-secondary mb-1 block">Listing Price (optional)</label>
          <input
            value={config.price}
            onChange={e => setConfig(p => ({ ...p, price: e.target.value }))}
            placeholder="$329,000"
            className="w-full border border-dashboard-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-dashboard-gold"
          />
        </div>
        <button
          onClick={() => setGenerated(true)}
          disabled={!config.address}
          className="w-full py-2.5 bg-dashboard-gold hover:bg-dashboard-gold-dark disabled:bg-gray-200 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Generate QR Code
        </button>
      </div>

      {generated && generatedUrl && (
        <div className="border border-dashboard-border rounded-xl p-4 text-center print:border-0">
          <div className="flex justify-center mb-3">
            <QRCodeDisplay url={generatedUrl} size={180} />
          </div>
          <p className="text-xs font-semibold text-dashboard-black mb-0.5">Scan for property details</p>
          <p className="text-[11px] text-dashboard-secondary mb-3">{config.address}</p>

          <div className="flex gap-2 print:hidden">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-dashboard-border rounded-lg text-xs text-dashboard-body hover:bg-dashboard-surface transition-colors"
            >
              {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy URL'}
            </button>
            <a
              href={generatedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-dashboard-border rounded-lg text-xs text-dashboard-body hover:bg-dashboard-surface transition-colors"
            >
              <ExternalLink size={12} />
              Preview
            </a>
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-dashboard-gold text-white rounded-lg text-xs font-medium hover:bg-dashboard-gold-dark transition-colors"
            >
              <Printer size={12} />
              Print
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
