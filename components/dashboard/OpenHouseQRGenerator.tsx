/**
 * Open House QR Code Generator
 * Generates a printable QR code card for each property showing
 * Visitors scan → /open-house?address=...&price=...
 * Captures lead, routes through capture-lead edge function
 */
import { useState } from 'react';
import { QrCode, Printer, Copy, Check, ExternalLink } from 'lucide-react';

const BASE_URL = 'https://lorena-os.vercel.app';

function buildUrl(address: string, price: string): string {
  const params = new URLSearchParams();
  if (address) params.set('address', address);
  if (price) params.set('price', price);
  return `${BASE_URL}/open-house?${params.toString()}`;
}

// Minimal QR code using Google Charts API (no npm package needed)
function QRCodeImage({ url, size = 200 }: { url: string; size?: number }) {
  const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=1a1a1a&margin=10&format=png`;
  return (
    <img 
      src={apiUrl} 
      alt="QR Code" 
      width={size} 
      height={size}
      className="rounded-lg"
    />
  );
}

export function OpenHouseQRGenerator() {
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState('');
  const [copied, setCopied] = useState(false);

  const url = buildUrl(address, price);
  const isReady = address.trim().length > 5;

  const copyUrl = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=1a1a1a&margin=15&format=png`;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Open House QR — ${address}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Georgia', serif; background: white; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
          .card { width: 4in; border: 3px solid #C9A84C; border-radius: 16px; padding: 32px; text-align: center; }
          .logo { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin-bottom: 20px; }
          h1 { font-size: 24px; color: #1a1a1a; margin-bottom: 4px; }
          .sub { font-size: 14px; color: #666; margin-bottom: 24px; }
          .qr { margin: 0 auto 20px; }
          .address { font-size: 13px; color: #333; font-weight: bold; margin-bottom: 6px; }
          .price { font-size: 22px; color: #C9A84C; font-weight: bold; margin-bottom: 20px; }
          .cta { background: #C9A84C; color: white; padding: 10px 24px; border-radius: 8px; font-size: 13px; display: inline-block; margin-bottom: 16px; }
          .agent { font-size: 12px; color: #666; }
          .phone { font-size: 14px; color: #C9A84C; font-weight: bold; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">Casas En El Paso · InnoClose</div>
          <h1>Welcome!</h1>
          <div class="sub">Scan to get property details & updates</div>
          <div class="qr">
            <img src="${qrApiUrl}" width="220" height="220" />
          </div>
          ${address ? `<div class="address">${address}</div>` : ''}
          ${price ? `<div class="price">${price}</div>` : ''}
          <div class="cta">Scan for Home Details</div>
          <div class="agent">Lorena Ontiveros-Ortega · REALTOR®</div>
          <div class="phone">(915) 500-0573</div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <div className="bg-white rounded-xl border border-dashboard-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-dashboard-gold/10 rounded-lg flex items-center justify-center">
          <QrCode size={16} className="text-dashboard-gold" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-dashboard-black">Open House QR Generator</h3>
          <p className="text-xs text-dashboard-secondary">Print QR codes for every showing</p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <label className="text-xs text-dashboard-secondary mb-1 block">Property Address *</label>
          <input
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="e.g. 1234 Mesa Hills Dr, El Paso TX 79912"
            className="w-full border border-dashboard-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-dashboard-gold"
          />
        </div>
        <div>
          <label className="text-xs text-dashboard-secondary mb-1 block">Asking Price</label>
          <input
            value={price}
            onChange={e => setPrice(e.target.value)}
            placeholder="e.g. $299,000"
            className="w-full border border-dashboard-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-dashboard-gold"
          />
        </div>
      </div>

      {isReady && (
        <div className="flex flex-col items-center gap-4 py-4 border border-dashboard-border rounded-xl bg-dashboard-surface/30 mb-4">
          <QRCodeImage url={url} size={180} />
          <div className="text-center">
            <p className="text-xs font-medium text-dashboard-black">{address}</p>
            {price && <p className="text-sm font-bold text-dashboard-gold mt-0.5">{price}</p>}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handlePrint}
          disabled={!isReady}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-lg text-sm font-medium transition-colors flex-1 justify-center"
        >
          <Printer size={14} /> Print QR Card
        </button>
        <button
          onClick={copyUrl}
          disabled={!isReady}
          className="flex items-center gap-1.5 px-3 py-2.5 border border-dashboard-border hover:border-dashboard-gold rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
          title="Copy link"
        >
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
        </button>
        {isReady && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2.5 border border-dashboard-border hover:border-dashboard-gold rounded-lg text-sm font-medium transition-colors"
            title="Preview page"
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  );
}
