'use client';

import React from 'react';
import { Printer, Download, X, Award } from 'lucide-react';
import { CompanyProfile, PayrollRecord } from '@/lib/types';

interface PayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: PayrollRecord;
  company: CompanyProfile;
}

export default function PayslipModal({ isOpen, onClose, record, company }: PayslipModalProps) {
  if (!isOpen || !record) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-6 overflow-hidden border border-slate-300 print:border-none print:shadow-none print:m-0 print:max-w-none">
        {/* Controls */}
        <div className="bg-slate-900 px-6 py-3.5 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold">Salary Slip for Month: {record.month}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" /> Print Payslip
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Slip Sheet */}
        <div className="p-8 text-slate-900 text-xs font-sans print:p-4 bg-white">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
            <h2 className="text-lg font-black text-slate-950 uppercase">{company.company_name}</h2>
            <p className="text-[11px] text-slate-600">{company.address_line1}, {company.city} - {company.pincode}</p>
            <p className="text-[11px] text-slate-600">GSTIN: {company.gstin} | PAN: {company.pan} | TAN: {company.tan || 'N/A'}</p>
            <div className="mt-2 inline-block px-4 py-1 bg-slate-100 border border-slate-300 rounded font-bold text-xs uppercase text-slate-800 tracking-wider">
              PAYSLIP FOR {record.month}
            </div>
          </div>

          {/* Employee Details Grid */}
          <div className="border border-slate-900 mb-4 divide-y divide-slate-300 text-[11px]">
            <div className="grid grid-cols-2 divide-x divide-slate-900">
              <div className="p-2.5 space-y-1">
                <p><span className="text-slate-500 font-semibold">Employee ID:</span> <strong className="font-mono">{record.emp_code}</strong></p>
                <p><span className="text-slate-500 font-semibold">Employee Name:</span> <strong className="text-slate-950 text-xs">{record.employee_name}</strong></p>
                <p><span className="text-slate-500 font-semibold">Designation:</span> <strong>{record.designation}</strong></p>
                <p><span className="text-slate-500 font-semibold">Department:</span> <span>{record.department || 'Production'}</span></p>
              </div>
              <div className="p-2.5 space-y-1">
                <p><span className="text-slate-500 font-semibold">PAN Number:</span> <span className="font-mono font-bold">{record.pan}</span></p>
                <p><span className="text-slate-500 font-semibold">EPF UAN:</span> <span className="font-mono font-bold">{record.uan || 'N/A'}</span></p>
                <p><span className="text-slate-500 font-semibold">ESIC Number:</span> <span className="font-mono">{record.esic_number || 'N/A (Exempt)'}</span></p>
                <p><span className="text-slate-500 font-semibold">Bank A/c:</span> <span className="font-mono font-bold">{record.bank_account_no}</span> ({record.bank_name})</p>
              </div>
            </div>
            <div className="grid grid-cols-4 p-2 bg-slate-50 text-[10px] font-semibold text-slate-700">
              <div>Total Working Days: <strong>{record.working_days}</strong></div>
              <div>Days Present: <strong className="text-emerald-700">{record.present_days}</strong></div>
              <div>Days Absent: <strong className="text-rose-700">{record.working_days - record.present_days}</strong></div>
              <div>Payment Mode: <strong className="text-blue-800">Bank Transfer (NEFT)</strong></div>
            </div>
          </div>

          {/* Earnings vs Deductions Table */}
          <div className="border border-slate-900 mb-4">
            <div className="grid grid-cols-2 divide-x divide-slate-900">
              {/* Earnings */}
              <div>
                <div className="bg-slate-100 p-2 font-bold text-center border-b border-slate-900 text-[11px] uppercase">
                  Earnings
                </div>
                <div className="p-3 space-y-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-700">Basic Salary:</span>
                    <span className="font-mono font-semibold">₹{Number(record.basic_earned).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">House Rent Allowance (HRA):</span>
                    <span className="font-mono font-semibold">₹{Number(record.hra_earned).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Special Allowance:</span>
                    <span className="font-mono font-semibold">₹{Number(record.special_allowance_earned).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Statutory Deductions */}
              <div>
                <div className="bg-slate-100 p-2 font-bold text-center border-b border-slate-900 text-[11px] uppercase">
                  Deductions (EPF / ESI / Taxes)
                </div>
                <div className="p-3 space-y-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-700">EPF Employee (12%):</span>
                    <span className="font-mono font-semibold text-rose-700">₹{Number(record.epf_employee).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">ESI Employee (0.75%):</span>
                    <span className="font-mono font-semibold text-rose-700">₹{Number(record.esi_employee).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Professional Tax (PT):</span>
                    <span className="font-mono font-semibold text-rose-700">₹{Number(record.professional_tax).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">TDS on Salary (Sec 192):</span>
                    <span className="font-mono font-semibold text-rose-700">₹{Number(record.tds_deducted).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Totals Row */}
            <div className="grid grid-cols-2 divide-x divide-slate-900 border-t-2 border-slate-900 bg-slate-50 p-2.5 font-bold text-[11px]">
              <div className="flex justify-between px-2">
                <span>Gross Earnings:</span>
                <span className="font-mono text-emerald-800">₹{Number(record.gross_earned).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between px-2">
                <span>Total Deductions:</span>
                <span className="font-mono text-rose-800">₹{Number(record.total_deductions).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Net Pay Box */}
          <div className="border-2 border-slate-900 p-3 bg-emerald-50/70 mb-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-600 block">NET SALARY PAYABLE:</span>
              <span className="text-xs text-slate-500">Transferred to Bank Account</span>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-emerald-950 font-mono">
                ₹{Number(record.net_payable).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Employer Statutory Contribution Summary */}
          <div className="border border-slate-200 rounded p-2.5 text-[10px] bg-slate-50 text-slate-600 mb-6">
            <span className="font-bold text-slate-800 block mb-1">Employer Statutory Contributions (Not deducted from salary):</span>
            <div className="grid grid-cols-3 gap-2">
              <div>Employer EPF (3.67% + 8.33% EPS): <strong>₹{Number(record.epf_employer).toFixed(2)}</strong></div>
              <div>Employer ESI (3.25%): <strong>₹{Number(record.esi_employer).toFixed(2)}</strong></div>
              <div>Status: <strong className="text-emerald-700">{record.payment_status}</strong></div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 pt-6 text-[10px] text-center">
            <div>
              <div className="border-b border-dashed border-slate-400 w-44 mx-auto mb-1"></div>
              <span>Employee Signature</span>
            </div>
            <div>
              <div className="border-b border-dashed border-slate-400 w-44 mx-auto mb-1"></div>
              <span>Authorised Signatory ({company.company_name})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
