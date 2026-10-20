'use client';

import React, { useRef } from 'react';
import { Printer, Download, X, QrCode } from 'lucide-react';
import { CompanyProfile, Invoice } from '@/lib/types';
import { formatToIndianDate } from '@/lib/gst-engine';

interface InvoicePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  company: CompanyProfile;
}

export default function InvoicePrintModal({ isOpen, onClose, invoice, company }: InvoicePrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const isIntraState = invoice.party_state_code === company.state_code;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-6 overflow-hidden border border-slate-300 print:border-none print:shadow-none print:m-0 print:max-w-none">
        {/* Modal Controls - Hidden during print */}
        <div className="bg-slate-900 px-6 py-3.5 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-blue-400">GST Rule 46 Compliant</span>
            <span className="text-sm font-bold text-white">| {invoice.invoice_no}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Tax Invoice Sheet */}
        <div ref={printRef} className="p-8 text-slate-900 text-xs font-sans print:p-2 bg-white">
          {/* Header */}
          <div className="text-center border-b border-slate-900 pb-3 mb-3">
            <h2 className="text-xl font-black uppercase tracking-wider text-slate-950">TAX INVOICE</h2>
            <div className="flex justify-between items-center text-[11px] font-semibold text-slate-600 mt-1">
              <span>(See Rule 46 of CGST Rules, 2017)</span>
              <span className="px-2 py-0.5 border border-slate-700 text-slate-900 font-bold uppercase rounded">
                Original for Recipient
              </span>
            </div>
          </div>

          {/* Supplier & Consignee Details */}
          <div className="grid grid-cols-2 border border-slate-900 mb-3 divide-x divide-slate-900">
            {/* Supplier Information */}
            <div className="p-3 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Details of Supplier (Consignor)</span>
              <h3 className="text-sm font-black text-slate-950 leading-tight">{company.company_name}</h3>
              <p className="text-[11px] text-slate-700 leading-snug">{company.address_line1}, {company.address_line2 || ''}, {company.city} - {company.pincode}</p>
              <p className="text-[11px] font-semibold text-slate-900">State: <span className="font-bold">{company.state_name}</span> (Code: {company.state_code})</p>
              <p className="text-[11px] font-semibold text-slate-900">GSTIN: <span className="font-mono font-bold tracking-wider">{company.gstin}</span></p>
              <p className="text-[11px] text-slate-700">PAN: <span className="font-mono font-bold">{company.pan}</span> | TAN: {company.tan || 'N/A'}</p>
            </div>

            {/* Invoice Meta */}
            <div className="p-3 space-y-1">
              <div className="grid grid-cols-2 gap-2 text-[11px] pb-1 border-b border-slate-200">
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px]">INVOICE NO:</span>
                  <span className="font-mono font-bold text-slate-950 text-xs">{invoice.invoice_no}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px]">INVOICE DATE:</span>
                  <span className="font-bold text-slate-950">{formatToIndianDate(invoice.invoice_date)}</span>
                </div>
              </div>

              {invoice.eway_bill_no && (
                <div className="bg-slate-50 p-1.5 border border-slate-200 rounded text-[10px] space-y-0.5 mt-1">
                  <p className="font-bold text-slate-900">E-Way Bill No: <span className="font-mono text-blue-800">{invoice.eway_bill_no}</span></p>
                  <p className="text-slate-600">Vehicle No: <span className="font-mono font-bold">{invoice.vehicle_no || 'MH12RN4590'}</span> | Mode: Road</p>
                  <p className="text-slate-600">Transporter: {invoice.transporter_name || 'Direct Transport'}</p>
                </div>
              )}

              <div className="pt-1 text-[11px]">
                <span className="text-slate-500 text-[10px] font-semibold">PLACE OF SUPPLY:</span>
                <span className="font-bold block text-slate-900">{invoice.place_of_supply}</span>
              </div>
            </div>
          </div>

          {/* Billed To / Recipient Details */}
          <div className="border border-slate-900 p-3 mb-3 bg-slate-50/50">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Details of Recipient (Billed To)</span>
            <div className="grid grid-cols-2 gap-4 mt-1 text-[11px]">
              <div>
                <h4 className="text-xs font-black text-slate-950">{invoice.party_name}</h4>
                <p className="text-slate-700 leading-snug">{invoice.party_address || 'Address on file'}</p>
              </div>
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-900">GSTIN / UIN: <span className="font-mono font-bold text-slate-950">{invoice.party_gstin || 'URP (Unregistered)'}</span></p>
                <p className="text-slate-700">PAN: <span className="font-mono font-bold">{invoice.party_pan || 'N/A'}</span></p>
                <p className="text-slate-700">State / Code: <span className="font-bold">{invoice.place_of_supply}</span></p>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-900 mb-3 overflow-hidden">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-900 text-slate-900 font-bold text-[10px] uppercase">
                  <th className="p-2 border-r border-slate-900 w-8 text-center">#</th>
                  <th className="p-2 border-r border-slate-900">Item Description</th>
                  <th className="p-2 border-r border-slate-900 text-center w-20">HSN/SAC</th>
                  <th className="p-2 border-r border-slate-900 text-right w-24">Quantity & Unit</th>
                  <th className="p-2 border-r border-slate-900 text-right w-20">Rate (₹)</th>
                  <th className="p-2 border-r border-slate-900 text-right w-24">Taxable Value (₹)</th>
                  {isIntraState ? (
                    <>
                      <th className="p-2 border-r border-slate-900 text-right w-20">CGST (9%)</th>
                      <th className="p-2 border-r border-slate-900 text-right w-20">SGST (9%)</th>
                    </>
                  ) : (
                    <th className="p-2 border-r border-slate-900 text-right w-28">IGST (18%)</th>
                  )}
                  <th className="p-2 text-right w-28">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {(invoice.items || []).map((itm, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-2 border-r border-slate-900 text-center font-mono">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-900 font-medium text-slate-900">
                      <div>{itm.product_name}</div>
                      {itm.secondary_qty && (
                        <div className="text-[10px] text-slate-500 font-normal">
                          Dual measure: {itm.secondary_qty} {itm.secondary_unit}
                        </div>
                      )}
                    </td>
                    <td className="p-2 border-r border-slate-900 text-center font-mono">{itm.hsn_code}</td>
                    <td className="p-2 border-r border-slate-900 text-right font-semibold">
                      {itm.primary_qty} {itm.primary_unit}
                    </td>
                    <td className="p-2 border-r border-slate-900 text-right font-mono">
                      {Number(itm.unit_rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 border-r border-slate-900 text-right font-mono font-semibold">
                      {Number(itm.taxable_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    {isIntraState ? (
                      <>
                        <td className="p-2 border-r border-slate-900 text-right font-mono">
                          {Number(itm.cgst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 border-r border-slate-900 text-right font-mono">
                          {Number(itm.sgst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </>
                    ) : (
                      <td className="p-2 border-r border-slate-900 text-right font-mono">
                        {Number(itm.igst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    )}
                    <td className="p-2 text-right font-mono font-bold text-slate-950">
                      {Number(itm.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-900 bg-slate-50 font-bold">
                <tr>
                  <td colSpan={5} className="p-2 border-r border-slate-900 text-right uppercase text-[10px]">
                    Total Taxable & Taxes:
                  </td>
                  <td className="p-2 border-r border-slate-900 text-right font-mono">
                    ₹{Number(invoice.taxable_value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  {isIntraState ? (
                    <>
                      <td className="p-2 border-r border-slate-900 text-right font-mono">
                        ₹{Number(invoice.cgst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 border-r border-slate-900 text-right font-mono">
                        ₹{Number(invoice.sgst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </>
                  ) : (
                    <td className="p-2 border-r border-slate-900 text-right font-mono">
                      ₹{Number(invoice.igst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  )}
                  <td className="p-2 text-right font-mono font-black text-sm text-blue-900">
                    ₹{Number(invoice.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Bottom Summary: Bank Details + Amount in Words + Signatory */}
          <div className="grid grid-cols-2 border border-slate-900 divide-x divide-slate-900 mb-2">
            {/* Bank details & Terms */}
            <div className="p-3 text-[11px] space-y-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Bank Details for RTGS / NEFT:</span>
                <p className="font-bold text-slate-950">{company.bank_name || 'HDFC Bank Ltd'}</p>
                <p className="font-mono">Account No: <span className="font-bold">{company.bank_account_no || '50200088992211'}</span></p>
                <p className="font-mono">IFSC Code: <span className="font-bold">{company.bank_ifsc || 'HDFC0000123'}</span></p>
                <p className="text-slate-600">Branch: {company.bank_branch || 'Hadapsar, Pune'}</p>
              </div>

              <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-600 leading-tight">
                <p className="font-bold text-slate-800">Terms & Conditions:</p>
                <ol className="list-decimal pl-3 space-y-0.5">
                  <li>Goods once sold will not be taken back without prior written inspection.</li>
                  <li>Interest @ 18% p.a. will be charged if payment is delayed beyond due date.</li>
                  <li>Subject to Pune jurisdiction only.</li>
                </ol>
              </div>
            </div>

            {/* Grand Total & Signatory */}
            <div className="p-3 flex flex-col justify-between">
              <div className="space-y-1 text-right text-[11px] border-b border-slate-200 pb-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Taxable Amount:</span>
                  <span className="font-mono font-semibold">₹{Number(invoice.taxable_value).toFixed(2)}</span>
                </div>
                {isIntraState ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-600">CGST Total:</span>
                      <span className="font-mono">₹{Number(invoice.cgst_amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">SGST Total:</span>
                      <span className="font-mono">₹{Number(invoice.sgst_amount).toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-slate-600">IGST Total:</span>
                    <span className="font-mono">₹{Number(invoice.igst_amount).toFixed(2)}</span>
                  </div>
                )}
                {Number(invoice.round_off) !== 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Round Off:</span>
                    <span className="font-mono">₹{Number(invoice.round_off).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-slate-900 text-sm font-black text-slate-950">
                  <span>Grand Total:</span>
                  <span className="font-mono">₹{Number(invoice.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="text-right pt-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">For {company.company_name}</p>
                <div className="h-12 flex items-end justify-end">
                  <div className="border-b border-dashed border-slate-400 w-36 text-center text-[10px] text-slate-400">
                    Authorised Signatory
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[9px] text-center text-slate-400 uppercase tracking-wider">
            This is a computer generated tax invoice as per Rule 46 of the Central Goods and Services Tax Rules, 2017.
          </p>
        </div>
      </div>
    </div>
  );
}
