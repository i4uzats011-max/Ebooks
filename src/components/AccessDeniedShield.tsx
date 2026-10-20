'use client';

import React from 'react';
import { ShieldAlert, Lock, UserCheck } from 'lucide-react';

interface AccessDeniedShieldProps {
  requiredPermission: string;
  roleName: string;
  userName: string;
  onSwitchAdmin?: () => void;
}

export default function AccessDeniedShield({
  requiredPermission,
  roleName,
  userName,
  onSwitchAdmin
}: AccessDeniedShieldProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-8 text-center max-w-xl mx-auto my-12">
      <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
        <ShieldAlert className="w-9 h-9" />
      </div>

      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 mb-3">
        <Lock className="w-3.5 h-3.5" /> Access Control Protection Active
      </span>

      <h3 className="text-xl font-bold text-slate-800 mb-2">Restricted Module Access</h3>
      
      <p className="text-sm text-slate-600 mb-4 leading-relaxed">
        Your current active account <strong className="text-slate-900">{userName}</strong> ({roleName}) does not have the required permission <code className="bg-slate-100 px-2 py-0.5 rounded text-amber-700 font-mono text-xs">{requiredPermission}</code> to view or operate this section.
      </p>

      <div className="bg-slate-50 rounded-lg p-3.5 text-xs text-slate-600 mb-6 text-left border border-slate-200">
        <p className="font-semibold text-slate-800 mb-1">Role Hierarchy Policy:</p>
        <ul className="list-disc pl-4 space-y-1 text-slate-600">
          <li>As per company security policy, sensitive financial accounts (like Balance Sheet, Profit & Loss, or Ledger Editing) are restricted to Authorized Accountants and Super Admins.</li>
          <li>To gain access, request the Super Admin to toggle this permission in the <strong>Access Rights Matrix</strong>.</li>
        </ul>
      </div>

      {onSwitchAdmin && (
        <button
          onClick={onSwitchAdmin}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition"
        >
          <UserCheck className="w-4 h-4" /> Switch to Super Admin (Demo Mode)
        </button>
      )}
    </div>
  );
}
