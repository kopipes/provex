'use client';

import { useEffect, useState } from 'react';
import { FileText, Maximize2, Printer, X } from 'lucide-react';

interface ReceiptViewerProps {
  path: string;
}

export function ReceiptViewer({ path }: ReceiptViewerProps) {
  const [open, setOpen] = useState(false);
  const url = `/api${path}`;
  const isPdf = path.toLowerCase().endsWith('.pdf');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const handlePrint = () => {
    const absoluteUrl = `${window.location.origin}${url}`;
    if (isPdf) {
      const win = window.open(absoluteUrl, '_blank');
      win?.addEventListener('load', () => win.print());
      return;
    }
    const win = window.open('', '_blank', 'width=900,height=1000');
    if (!win) return;
    win.document.write(
      `<!DOCTYPE html><html><head><title>Cetak Kwitansi</title>` +
      `<style>@page{margin:10mm}html,body{margin:0;padding:0}body{display:flex;align-items:center;justify-content:center;min-height:100vh}` +
      `img{max-width:100%;max-height:100vh;object-fit:contain}</style></head>` +
      `<body><img src="${absoluteUrl}" onload="window.focus();window.print();" onerror="window.close()"/></body></html>`
    );
    win.document.close();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative inline-flex items-center justify-center border border-border-default rounded-lg bg-bg-subtle overflow-hidden hover:border-accent/50 transition-colors"
        title="Klik untuk memperbesar"
      >
        {isPdf ? (
          <div className="w-32 h-24 flex flex-col items-center justify-center gap-1 text-accent">
            <FileText className="w-8 h-8" />
            <span className="text-xs text-text-secondary">PDF</span>
          </div>
        ) : (
          <img src={url} alt="Thumbnail kwitansi" className="w-32 h-24 object-cover" />
        )}
        <span className="absolute bottom-1 right-1 bg-black/60 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Maximize2 className="w-3 h-3" />
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/85 z-[60] flex flex-col"
          onClick={() => setOpen(false)}
        >
          <div className="flex items-center justify-between p-4">
            <span className="text-white text-sm font-medium">Bukti Kwitansi</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handlePrint(); }}
                className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-radius-md transition-colors"
              >
                <Printer className="w-4 h-4" />Cetak
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-radius-md transition-colors"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden px-4 pb-4" onClick={(e) => e.stopPropagation()}>
            {isPdf ? (
              <iframe src={url} className="w-full h-full bg-white rounded-radius-md" title="PDF Preview" />
            ) : (
              <img
                src={url}
                alt="Bukti kwitansi"
                className="w-full h-full object-contain"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
