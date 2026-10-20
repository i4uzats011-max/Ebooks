'use client';

import React, { useState } from 'react';
import { Truck, Download, Copy, Check, X, FileJson, ShieldCheck } from 'lucide-react';
import { CompanyProfile, Invoice } from '@/lib/types';
import { generateEwayBillJSON } from '@/lib/gst-engine';

interface EwayBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  company: CompanyProfile;
}

export default function EwayBillModal({ isOpen, onClose, invoice, company }: EwayBillModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !invoice) return null;

  const ewbData = generateEwayBillJSON(company, invoice, invoice.items || []);
  const jsonString = JSON.stringify(ewbData, null, 2);

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EWB_${invoice.invoice_no.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                NIC E-Way Bill JSON Generator <span className="text-[10px] bg-emerald-900/80 px-2 py-0.5 rounded font-mono">v1.0.1118</span>
              </h3>
              <p className="text-xs text-emerald-200">
                Government Schema Compliant • Invoice #{invoice.invoice_no}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Quick Summary Grid */}
          <div className="grid grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block">From GSTIN:</span>
              <span className="font-mono font-bold text-slate-800">{company.gstin}</span>
            </div>
            <div>
              <span className="text-slate-500 block">To GSTIN:</span>
              <span className="font-mono font-bold text-slate-800">{invoice.party_gstin || 'URP'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Total Invoice Value:</span>
              <span className="font-mono font-bold text-emerald-700">₹{Number(invoice.total_amount).toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Distance / Vehicle:</span>
              <span className="font-bold text-slate-800">{invoice.trans_distance || 50} km | {invoice.vehicle_no || 'MH12RN4590'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <FileJson className="w-4 h-4 text-emerald-600" /> E-Way Bill Bulk Upload JSON Payload:
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition"
              >
                <Download className="w-3.5 h-3.5" /> Download JSON File
              </button>
            </div>
          </div>

          {/* JSON viewer */}
          <div className="relative">
            <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl text-xs font-mono max-h-72 overflow-y-auto leading-relaxed border border-slate-800">
              {jsonString}
            </pre>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              This file matches the NIC E-Way Bill Offline Tool & Portal bulk schema. You can directly upload this JSON file to the official government portal (<strong>ewaybillgst.gov.in</strong>) to generate Part-A & Part-B E-Way bills in one click!
            </span>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
