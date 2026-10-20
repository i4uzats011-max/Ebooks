'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  FileText,
  Package,
  BookOpen,
  PieChart,
  ShieldCheck,
  FileCheck,
  Award,
  Settings,
  ChevronDown,
  Plus,
  Printer,
  Truck,
  Paperclip,
  Download,
  AlertCircle,
  CheckCircle2,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Cloud,
  Check,
  Eye,
  ArrowRight,
  TrendingUp,
  Receipt,
  CreditCard,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert
} from 'lucide-react';
import { ERPUser, CompanyProfile, Invoice, StockItem, Ledger, PayrollRecord, TdsTcsEntry } from '@/lib/types';
import { hasPermission } from '@/lib/rbac';
import { INDIAN_STATES, GST_UQC_LIST, TDS_TCS_RATES_2026_27 } from '@/lib/tax-masters';
import AccessDeniedShield from '@/components/AccessDeniedShield';
import CloudDriveModal from '@/components/CloudDriveModal';
import DocumentAttachModal from '@/components/DocumentAttachModal';
import InvoicePrintModal from '@/components/InvoicePrintModal';
import EwayBillModal from '@/components/EwayBillModal';
import PayslipModal from '@/components/PayslipModal';

export default function ERPDashboard() {
  // Global ERP State
  const [activeUser, setActiveUser] = useState<ERPUser | null>(null);
  const [allUsers, setAllUsers] = useState<ERPUser[]>([]);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [loading, setLoading] = useState(true);

  // Data Collections
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [stockMovements, setStockMovements] = useState<any[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [daybook, setDaybook] = useState<any[]>([]);
  const [balanceSheet, setBalanceSheet] = useState<any>(null);
  const [profitLoss, setProfitLoss] = useState<any>(null);
  const [trialBalance, setTrialBalance] = useState<any>(null);
  const [gstOverview, setGstOverview] = useState<any>(null);
  const [tdsEntries, setTdsEntries] = useState<TdsTcsEntry[]>([]);
  const [tdsSummary, setTdsSummary] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);

  // Modals & Action States
  const [cloudDriveOpen, setCloudDriveOpen] = useState(false);
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);
  const [ewayInvoice, setEwayInvoice] = useState<Invoice | null>(null);
  const [attachModal, setAttachModal] = useState<{ open: boolean; type: any; id: number; title: string }>({
    open: false,
    type: 'INVOICE',
    id: 0,
    title: ''
  });
  const [printPayslip, setPrintPayslip] = useState<PayrollRecord | null>(null);

  // Forms State
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceDirection, setInvoiceDirection] = useState<'OUTWARD' | 'INWARD'>('OUTWARD');
  const [invPartyName, setInvPartyName] = useState('');
  const [invPartyGstin, setInvPartyGstin] = useState('');
  const [invPartyStateCode, setInvPartyStateCode] = useState(27);
  const [invPartyAddress, setInvPartyAddress] = useState('');
  const [invTransMode, setInvTransMode] = useState(1);
  const [invVehicleNo, setInvVehicleNo] = useState('MH12RN4590');
  const [invDistance, setInvDistance] = useState(45);
  const [invLines, setInvLines] = useState<any[]>([
    {
      item_id: null,
      product_name: '',
      hsn_code: '',
      primary_qty: 1,
      primary_unit: 'BOX',
      secondary_qty: 24,
      secondary_unit: 'PCS',
      unit_rate: 1000,
      gst_rate: 18,
      cess_rate: 0
    }
  ]);

  // New Item Form State
  const [showItemForm, setShowItemForm] = useState(false);
  const [newItemSku, setNewItemSku] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemHsn, setNewItemHsn] = useState('73181500');
  const [newItemCategory, setNewItemCategory] = useState('Hardware');
  const [newItemPUnit, setNewItemPUnit] = useState('BOX');
  const [newItemSUnit, setNewItemSUnit] = useState('PCS');
  const [newItemRelType, setNewItemRelType] = useState<'FIXED_COMPOUND' | 'LOOSE_VARIABLE'>('FIXED_COMPOUND');
  const [newItemFactor, setNewItemFactor] = useState(24);
  const [newItemCost, setNewItemCost] = useState(500);
  const [newItemSale, setNewItemSale] = useState(750);
  const [newItemStock, setNewItemStock] = useState(100);
  const [newItemImageUrl, setNewItemImageUrl] = useState('');

  // Initial Load
  const loadAllData = async (userId?: number) => {
    setLoading(true);
    try {
      // 1. Auth & Users
      const authRes = await fetch(`/api/auth${userId ? `?userId=${userId}` : ''}`);
      const authData = await authRes.json();
      if (authData.success) {
        setActiveUser(authData.activeUser);
        setAllUsers(authData.allUsers);
        setCompany(authData.company);
      }

      // 2. Invoices
      const invRes = await fetch('/api/invoices');
      const invData = await invRes.json();
      if (invData.success) setInvoices(invData.invoices);

      // 3. Inventory
      const itmRes = await fetch('/api/inventory');
      const itmData = await itmRes.json();
      if (itmData.success) {
        setStockItems(itmData.items);
        setStockMovements(itmData.stockMovements);
      }

      // 4. Ledgers
      const ledRes = await fetch('/api/ledgers');
      const ledData = await ledRes.json();
      if (ledData.success) {
        setLedgers(ledData.ledgers);
      }

      // 5. Reports
      const repRes = await fetch('/api/reports');
      const repData = await repRes.json();
      if (repData.success) {
        setBalanceSheet(repData.balanceSheet);
        setProfitLoss(repData.profitLoss);
        setTrialBalance(repData.trialBalance);
      }

      // 6. GST
      const gstRes = await fetch('/api/compliance/gst');
      const gstData = await gstRes.json();
      if (gstData.success) setGstOverview(gstData);

      // 7. TDS
      const tdsRes = await fetch('/api/compliance/tds');
      const tdsData = await tdsRes.json();
      if (tdsData.success) {
        setTdsEntries(tdsData.entries);
        setTdsSummary(tdsData.summary);
      }

      // 8. Payroll
      const payRes = await fetch('/api/payroll');
      const payData = await payRes.json();
      if (payData.success) {
        setEmployees(payData.employees);
        setPayrollRecords(payData.payrollRecords);
      }
    } catch (e) {
      console.error('Error loading ERP data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const switchActiveUser = (id: number) => {
    loadAllData(id);
  };

  // Helper to handle invoice submission
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedState = INDIAN_STATES.find(s => s.code === invPartyStateCode);
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direction: invoiceDirection,
          invoice_type: 'TAX_INVOICE',
          party_name: invPartyName,
          party_gstin: invPartyGstin,
          party_state_code: invPartyStateCode,
          place_of_supply: `${invPartyStateCode}-${selectedState?.name || 'STATE'}`,
          party_address: invPartyAddress,
          invoice_date: new Date().toISOString().split('T')[0],
          items: invLines,
          trans_mode: invTransMode,
          vehicle_no: invVehicleNo,
          trans_distance: invDistance,
          created_by_user_id: activeUser?.id || 1,
          generate_eway_bill: true
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowInvoiceForm(false);
        loadAllData(activeUser?.id);
        alert(`Invoice #${data.invoice.invoice_no} created successfully with automatic accounting and inventory update!`);
      } else {
        alert(`Error creating invoice: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Helper to handle new stock item creation
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_item',
          sku: newItemSku,
          name: newItemName,
          hsn_code: newItemHsn,
          category: newItemCategory,
          primary_unit: newItemPUnit,
          secondary_unit: newItemSUnit || null,
          unit_relation_type: newItemRelType,
          conversion_factor: newItemFactor,
          cost_price: newItemCost,
          selling_price: newItemSale,
          opening_stock_primary: newItemStock,
          image_url: newItemImageUrl || null
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowItemForm(false);
        loadAllData(activeUser?.id);
        alert(`Stock Item "${newItemName}" created with multi-unit configuration!`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Helper to download JSON files
  const downloadJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Toggle permission for a role in control center
  const togglePermission = async (targetUser: ERPUser, permKey: any) => {
    const currentPerms = new Set(targetUser.permissions || []);
    if (currentPerms.has(permKey)) {
      currentPerms.delete(permKey);
    } else {
      currentPerms.add(permKey);
    }

    const updated = Array.from(currentPerms);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_permissions',
          userId: targetUser.id,
          permissions: updated
        })
      });
      const data = await res.json();
      if (data.success) {
        loadAllData(activeUser?.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Run Monthly Payroll
  const handleRunPayroll = async () => {
    if (!confirm('Run monthly payroll calculation for all active employees?')) return;
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run_payroll',
          month: '2026-10'
        })
      });
      const data = await res.json();
      if (data.success) {
        loadAllData(activeUser?.id);
        alert(`Processed payroll for ${data.count} employees with statutory EPF, ESI, and PT!`);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading && !activeUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-lg font-bold">Initializing Indian Enterprise Accounting ERP...</h2>
        <p className="text-xs text-slate-400 mt-1">Connecting to Supabase PostgreSQL & Indian Compliance Engines</p>
      </div>
    );
  }

  const outwardInvoices = invoices.filter(i => i.direction === 'OUTWARD');
  const inwardInvoices = invoices.filter(i => i.direction === 'INWARD');
  const totalSalesVal = outwardInvoices.reduce((s, i) => s + Number(i.taxable_value), 0);
  const totalPurchaseVal = inwardInvoices.reduce((s, i) => s + Number(i.taxable_value), 0);
  const totalStockVal = stockItems.reduce((s, i) => s + (Number(i.current_stock_primary) * Number(i.cost_price)), 0);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* 1. TOP HEADER & MULTI-USER ROLE SWITCHER */}
      <header className="bg-slate-900 border-b border-slate-800 text-white px-6 py-3 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Company Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-lg shadow-md border border-white/20">
              BE
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm md:text-base tracking-tight text-white">
                  {company?.company_name || 'BHARAT HEAVY ENGINEERING & METALS PVT LTD'}
                </h1>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">
                  GST Active
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>GSTIN: <strong className="font-mono text-slate-200">{company?.gstin}</strong></span>
                <span>•</span>
                <span>State: <strong className="text-slate-200">{company?.state_name} ({company?.state_code})</strong></span>
              </p>
            </div>
          </div>

          {/* Right Header: Cloud Storage & Active User Control Switcher */}
          <div className="flex items-center gap-3">
            {/* Cloud Storage Button */}
            <button
              onClick={() => setCloudDriveOpen(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition shadow-xs"
              title="Connect Google Drive, Dropbox, or OneDrive"
            >
              <Cloud className="w-4 h-4 text-blue-400" />
              <span>Drive Storage (BYOS)</span>
            </button>

            {/* Active User Switcher Pill */}
            <div className="relative group">
              <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-800 transition">
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                  {activeUser?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-100">{activeUser?.full_name?.split(' ')[0]}</span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-semibold border border-blue-500/30">
                      {activeUser?.role}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">{activeUser?.department}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </div>

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-1 w-72 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 py-2 hidden group-hover:block z-50">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Switch Operating Persona</p>
                  <p className="text-xs text-slate-600">Simulate role control & right restrictions</p>
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => switchActiveUser(u.id)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition ${
                        activeUser?.id === u.id ? 'bg-blue-50/80 font-bold text-blue-900' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <p className="font-semibold">{u.full_name}</p>
                        <p className="text-[10px] text-slate-500">{u.role} • {u.department}</p>
                      </div>
                      {activeUser?.id === u.id && <Check className="w-4 h-4 text-blue-600" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN ERP WORKSPACE */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6">
        {/* Left Vertical Navigation Menu */}
        <aside className="w-full md:w-64 bg-white rounded-2xl shadow-sm border border-slate-200 p-3 shrink-0 self-start">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2">
            Enterprise Modules
          </div>
          <nav className="space-y-1 text-xs font-medium">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${
                activeTab === 'dashboard' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <PieChart className="w-4 h-4" /> Dashboard Overview
            </button>

            <button
              onClick={() => setActiveTab('invoices')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition ${
                activeTab === 'invoices' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Receipt className="w-4 h-4" /> Sales Invoices (F8)
              </div>
              <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded-md font-mono">
                {outwardInvoices.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('purchases')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition ${
                activeTab === 'purchases' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4" /> Purchases (F9)
              </div>
              <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded-md font-mono">
                {inwardInvoices.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition ${
                activeTab === 'inventory' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4" /> Multi-Unit Stock
              </div>
              <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded-md font-mono">
                {stockItems.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ledgers')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${
                activeTab === 'ledgers' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Chart of Accounts
            </button>

            <div className="pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3">
              Statements & Compliances
            </div>

            <button
              onClick={() => setActiveTab('financials')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${
                activeTab === 'financials' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <TrendingUp className="w-4 h-4" /> Balance Sheet & P&L
            </button>

            <button
              onClick={() => setActiveTab('gst')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${
                activeTab === 'gst' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <FileCheck className="w-4 h-4 text-emerald-500" /> GST Portal (1, 2B, 3B)
            </button>

            <button
              onClick={() => setActiveTab('tds')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${
                activeTab === 'tds' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-blue-500" /> TDS & TCS (2026-27)
            </button>

            <button
              onClick={() => setActiveTab('payroll')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${
                activeTab === 'payroll' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Award className="w-4 h-4 text-purple-500" /> HRMS, EPF & ESI
            </button>

            <button
              onClick={() => setActiveTab('controls')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${
                activeTab === 'controls' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-4 h-4 text-amber-500" /> Access Rights Matrix
            </button>
          </nav>

          <div className="mt-4 pt-3 border-t border-slate-100 px-3 text-[11px] text-slate-500">
            <p className="font-semibold text-slate-700">Role Permissions:</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {activeUser?.role === 'SUPER_ADMIN' ? 'Full Access Granted' : `${activeUser?.permissions?.length || 0} permissions active`}
            </p>
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 min-w-0">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Financial KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                    <span>SALES TURNOVER</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 font-mono">
                    ₹{totalSalesVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </h3>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                    {outwardInvoices.length} Outward Tax Invoices
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                    <span>INWARD PURCHASES</span>
                    <CreditCard className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 font-mono">
                    ₹{totalPurchaseVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </h3>
                  <p className="text-[11px] text-blue-600 font-semibold mt-1">
                    {inwardInvoices.length} Vendor Bills (ITC eligible)
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                    <span>STOCK VALUATION</span>
                    <Package className="w-4 h-4 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 font-mono">
                    ₹{totalStockVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </h3>
                  <p className="text-[11px] text-purple-600 font-semibold mt-1">
                    Across {stockItems.length} multi-unit items
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                    <span>NET GST PAYABLE</span>
                    <FileCheck className="w-4 h-4 text-amber-600" />
                  </div>
                  <h3 className="text-2xl font-black text-amber-700 font-mono">
                    ₹{(gstOverview?.gstr3b?.sec_sum?.table6_1?.paid_in_cash?.iamt + gstOverview?.gstr3b?.sec_sum?.table6_1?.paid_in_cash?.camt + gstOverview?.gstr3b?.sec_sum?.table6_1?.paid_in_cash?.samt || 0).toLocaleString('en-IN')}
                  </h3>
                  <p className="text-[11px] text-amber-600 font-semibold mt-1">
                    GSTR-3B Period: 10/2026
                  </p>
                </div>
              </div>

              {/* Quick Actions & Role Notification */}
              <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                    Indian Statutory Compliance & Double-Entry Accounting
                  </span>
                  <h2 className="text-xl font-bold mt-1">
                    Welcome, {activeUser?.full_name}
                  </h2>
                  <p className="text-xs text-blue-100 max-w-xl mt-1 leading-relaxed">
                    Operating under role: <strong>{activeUser?.role}</strong> ({activeUser?.department}). You can create invoices, manage multi-unit stock, file GSTR-1 & 3B, generate E-Way Bills, deduct TDS/TCS, run labor payroll (EPF & ESI), and attach files to your personal Google Drive account.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => {
                      setInvoiceDirection('OUTWARD');
                      setShowInvoiceForm(true);
                      setActiveTab('invoices');
                    }}
                    className="px-4 py-2 bg-white text-blue-900 rounded-xl text-xs font-bold hover:bg-blue-50 transition shadow-sm flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> New Tax Invoice (F8)
                  </button>
                  <button
                    onClick={() => setActiveTab('financials')}
                    className="px-4 py-2 bg-blue-600/80 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/20"
                  >
                    <BookOpen className="w-4 h-4" /> View Balance Sheet
                  </button>
                </div>
              </div>

              {/* Recent Invoices Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-800">Recent Accounting Transactions</h3>
                  <button
                    onClick={() => setActiveTab('invoices')}
                    className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="p-3">Doc #</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Party Name</th>
                        <th className="p-3">Place of Supply</th>
                        <th className="p-3 text-right">Taxable</th>
                        <th className="p-3 text-right">Total Amount</th>
                        <th className="p-3 text-center">E-Way Bill</th>
                        <th className="p-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoices.slice(0, 5).map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono font-bold text-slate-800">{inv.invoice_no}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              inv.direction === 'OUTWARD' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {inv.direction === 'OUTWARD' ? 'Sale (F8)' : 'Purchase (F9)'}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-slate-800">{inv.party_name}</td>
                          <td className="p-3 text-slate-600">{inv.place_of_supply}</td>
                          <td className="p-3 text-right font-mono">₹{Number(inv.taxable_value).toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">₹{Number(inv.total_amount).toLocaleString('en-IN')}</td>
                          <td className="p-3 text-center">
                            {inv.eway_bill_no ? (
                              <button
                                onClick={() => setEwayInvoice(inv)}
                                className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-mono text-[10px] font-bold hover:bg-emerald-100"
                              >
                                {inv.eway_bill_no}
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400">N/A</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setPrintInvoice(inv)}
                                title="Print Rule 46 Tax Invoice"
                                className="p-1 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setAttachModal({
                                  open: true,
                                  type: 'INVOICE',
                                  id: inv.id,
                                  title: inv.invoice_no
                                })}
                                title="Attach Documents & Share via Cloud Drive"
                                className="p-1 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded"
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2 & 3: TAX INVOICING & PURCHASES */}
          {(activeTab === 'invoices' || activeTab === 'purchases') && (
            <div className="space-y-6">
              {/* Permission Check */}
              {!hasPermission(activeUser, 'invoices:view') ? (
                <AccessDeniedShield
                  requiredPermission="invoices:view"
                  roleName={activeUser?.role || 'User'}
                  userName={activeUser?.full_name || 'User'}
                  onSwitchAdmin={() => switchActiveUser(1)}
                />
              ) : (
                <>
                  {/* Top Bar with Filter & Create */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        {activeTab === 'invoices' ? 'Outward Supplies / Sales Invoices (F8)' : 'Inward Supplies / Vendor Bills (F9)'}
                      </h2>
                      <p className="text-xs text-slate-500">
                        GST Rule 46 compliant billing with multi-unit items, automatic tax split & E-Way Bill JSON
                      </p>
                    </div>
                    {hasPermission(activeUser, 'invoices:create') && (
                      <button
                        onClick={() => {
                          setInvoiceDirection(activeTab === 'invoices' ? 'OUTWARD' : 'INWARD');
                          setShowInvoiceForm(!showInvoiceForm);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        {showInvoiceForm ? 'Close Form' : `Create ${activeTab === 'invoices' ? 'Sales Invoice' : 'Purchase Bill'}`}
                      </button>
                    )}
                  </div>

                  {/* Create Invoice Form */}
                  {showInvoiceForm && (
                    <div className="bg-white p-6 rounded-2xl border border-blue-200 shadow-md">
                      <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-4 border-b pb-2">
                        New {invoiceDirection === 'OUTWARD' ? 'GST Tax Invoice (Sales F8)' : 'Purchase Bill (F9)'}
                      </h3>
                      <form onSubmit={handleCreateInvoice} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Party / Customer Name</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Tata Motors Ltd"
                              value={invPartyName}
                              onChange={(e) => setInvPartyName(e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Party GSTIN (15 Digits)</label>
                            <input
                              type="text"
                              maxLength={15}
                              placeholder="27AAACT2345K1Z3 (or URP for unregistered)"
                              value={invPartyGstin}
                              onChange={(e) => setInvPartyGstin(e.target.value.toUpperCase())}
                              className="w-full px-3 py-2 border rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Place of Supply / State
                            </label>
                            <select
                              value={invPartyStateCode}
                              onChange={(e) => setInvPartyStateCode(parseInt(e.target.value, 10))}
                              className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                            >
                              {INDIAN_STATES.map((s) => (
                                <option key={s.code} value={s.code}>
                                  {s.code} - {s.name} {s.code === company?.state_code ? '(Intra-State: CGST+SGST)' : '(Inter-State: IGST)'}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Transport / E-Way Bill fields */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Transport Mode</label>
                            <select
                              value={invTransMode}
                              onChange={(e) => setInvTransMode(parseInt(e.target.value, 10))}
                              className="w-full px-2.5 py-1.5 border rounded-lg bg-white"
                            >
                              <option value={1}>1 - Road</option>
                              <option value={2}>2 - Rail</option>
                              <option value={3}>3 - Air</option>
                              <option value={4}>4 - Ship</option>
                            </select>
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Vehicle Number</label>
                            <input
                              type="text"
                              placeholder="MH12RN4590"
                              value={invVehicleNo}
                              onChange={(e) => setInvVehicleNo(e.target.value.toUpperCase())}
                              className="w-full px-2.5 py-1.5 border rounded-lg bg-white uppercase font-mono"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Distance (KM)</label>
                            <input
                              type="number"
                              value={invDistance}
                              onChange={(e) => setInvDistance(parseInt(e.target.value, 10))}
                              className="w-full px-2.5 py-1.5 border rounded-lg bg-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Address</label>
                            <input
                              type="text"
                              placeholder="MIDC Area, Pune"
                              value={invPartyAddress}
                              onChange={(e) => setInvPartyAddress(e.target.value)}
                              className="w-full px-2.5 py-1.5 border rounded-lg bg-white"
                            />
                          </div>
                        </div>

                        {/* Line Items with Multi-Unit */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-700 uppercase">
                              Line Items (Recorded with Multiple Units)
                            </span>
                            <button
                              type="button"
                              onClick={() => setInvLines([
                                ...invLines,
                                {
                                  item_id: null,
                                  product_name: '',
                                  hsn_code: '73181500',
                                  primary_qty: 1,
                                  primary_unit: 'BOX',
                                  secondary_qty: 24,
                                  secondary_unit: 'PCS',
                                  unit_rate: 500,
                                  gst_rate: 18,
                                  cess_rate: 0
                                }
                              ])}
                              className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Item Line
                            </button>
                          </div>

                          <div className="space-y-2">
                            {invLines.map((line, idx) => (
                              <div key={idx} className="p-3 bg-slate-50 border rounded-xl grid grid-cols-12 gap-2 text-xs items-center">
                                <div className="col-span-3">
                                  <label className="block text-[10px] text-slate-500 font-semibold">Select / Type Product</label>
                                  <select
                                    value={line.item_id || ''}
                                    onChange={(e) => {
                                      const sel = stockItems.find(it => it.id === parseInt(e.target.value, 10));
                                      const updated = [...invLines];
                                      if (sel) {
                                        updated[idx].item_id = sel.id;
                                        updated[idx].product_name = sel.name;
                                        updated[idx].hsn_code = sel.hsn_code;
                                        updated[idx].primary_unit = sel.primary_unit;
                                        updated[idx].secondary_unit = sel.secondary_unit;
                                        updated[idx].unit_rate = invoiceDirection === 'OUTWARD' ? sel.selling_price : sel.cost_price;
                                        updated[idx].gst_rate = sel.gst_rate;
                                      }
                                      setInvLines(updated);
                                    }}
                                    className="w-full px-2 py-1.5 border rounded bg-white"
                                  >
                                    <option value="">-- Choose Stock Item --</option>
                                    {stockItems.map(stk => (
                                      <option key={stk.id} value={stk.id}>
                                        {stk.name} ({stk.primary_unit}{stk.secondary_unit ? ` / ${stk.secondary_unit}` : ''}) - Stock: {stk.current_stock_primary}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="col-span-2">
                                  <label className="block text-[10px] text-slate-500 font-semibold">HSN Code</label>
                                  <input
                                    type="text"
                                    value={line.hsn_code}
                                    onChange={(e) => {
                                      const updated = [...invLines];
                                      updated[idx].hsn_code = e.target.value;
                                      setInvLines(updated);
                                    }}
                                    className="w-full px-2 py-1.5 border rounded bg-white font-mono"
                                  />
                                </div>

                                <div className="col-span-2">
                                  <label className="block text-[10px] text-slate-500 font-semibold">Primary Qty & Unit</label>
                                  <div className="flex gap-1">
                                    <input
                                      type="number"
                                      step="any"
                                      value={line.primary_qty}
                                      onChange={(e) => {
                                        const updated = [...invLines];
                                        updated[idx].primary_qty = parseFloat(e.target.value) || 0;
                                        setInvLines(updated);
                                      }}
                                      className="w-full px-2 py-1.5 border rounded bg-white font-mono"
                                    />
                                    <span className="px-2 py-1 bg-slate-200 rounded font-bold">{line.primary_unit}</span>
                                  </div>
                                </div>

                                <div className="col-span-2">
                                  <label className="block text-[10px] text-slate-500 font-semibold">Secondary Qty</label>
                                  <div className="flex gap-1">
                                    <input
                                      type="number"
                                      step="any"
                                      value={line.secondary_qty || ''}
                                      onChange={(e) => {
                                        const updated = [...invLines];
                                        updated[idx].secondary_qty = parseFloat(e.target.value) || 0;
                                        setInvLines(updated);
                                      }}
                                      className="w-full px-2 py-1.5 border rounded bg-white font-mono"
                                    />
                                    <span className="px-2 py-1 bg-slate-200 rounded font-bold">{line.secondary_unit || 'PCS'}</span>
                                  </div>
                                </div>

                                <div className="col-span-2">
                                  <label className="block text-[10px] text-slate-500 font-semibold">Rate (₹)</label>
                                  <input
                                    type="number"
                                    value={line.unit_rate}
                                    onChange={(e) => {
                                      const updated = [...invLines];
                                      updated[idx].unit_rate = parseFloat(e.target.value) || 0;
                                      setInvLines(updated);
                                    }}
                                    className="w-full px-2 py-1.5 border rounded bg-white font-mono"
                                  />
                                </div>

                                <div className="col-span-1 text-right">
                                  <label className="block text-[10px] text-slate-500 font-semibold">Line Amt</label>
                                  <span className="font-mono font-bold text-slate-900 block pt-1">
                                    ₹{(line.primary_qty * line.unit_rate).toFixed(0)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t">
                          <button
                            type="button"
                            onClick={() => setShowInvoiceForm(false)}
                            className="px-4 py-2 border rounded-lg text-xs text-slate-600 hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm"
                          >
                            Save Invoice & Post Double-Entry Journal
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Invoices List */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                            <th className="p-3">Doc #</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">Party Name</th>
                            <th className="p-3">Party GSTIN</th>
                            <th className="p-3">State Code</th>
                            <th className="p-3 text-right">Taxable</th>
                            <th className="p-3 text-right">CGST</th>
                            <th className="p-3 text-right">SGST</th>
                            <th className="p-3 text-right">IGST</th>
                            <th className="p-3 text-right">Total (₹)</th>
                            <th className="p-3 text-center">E-Way Bill</th>
                            <th className="p-3 text-center">Documents & Print</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(activeTab === 'invoices' ? outwardInvoices : inwardInvoices).map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-mono font-bold text-slate-900">{inv.invoice_no}</td>
                              <td className="p-3 text-slate-600">{new Date(inv.invoice_date).toLocaleDateString('en-IN')}</td>
                              <td className="p-3 font-semibold text-slate-800">{inv.party_name}</td>
                              <td className="p-3 font-mono text-[11px] text-slate-600">{inv.party_gstin || 'URP'}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  inv.party_state_code === company?.state_code ? 'bg-blue-50 text-blue-800' : 'bg-purple-50 text-purple-800'
                                }`}>
                                  {inv.party_state_code} {inv.party_state_code === company?.state_code ? '(Intra)' : '(Inter)'}
                                </span>
                              </td>
                              <td className="p-3 text-right font-mono">₹{Number(inv.taxable_value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="p-3 text-right font-mono text-slate-600">₹{Number(inv.cgst_amount).toFixed(2)}</td>
                              <td className="p-3 text-right font-mono text-slate-600">₹{Number(inv.sgst_amount).toFixed(2)}</td>
                              <td className="p-3 text-right font-mono text-slate-600">₹{Number(inv.igst_amount).toFixed(2)}</td>
                              <td className="p-3 text-right font-mono font-bold text-slate-950">₹{Number(inv.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="p-3 text-center">
                                {inv.eway_bill_no ? (
                                  <button
                                    onClick={() => setEwayInvoice(inv)}
                                    className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-mono text-[10px] font-bold hover:bg-emerald-100"
                                    title="View & Download Official NIC JSON"
                                  >
                                    {inv.eway_bill_no}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setEwayInvoice(inv)}
                                    className="text-[10px] text-blue-600 hover:underline font-semibold"
                                  >
                                    Generate EWB
                                  </button>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => setPrintInvoice(inv)}
                                    className="p-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded text-slate-600 transition"
                                    title="Print Rule 46 Tax Invoice"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setAttachModal({
                                      open: true,
                                      type: 'INVOICE',
                                      id: inv.id,
                                      title: inv.invoice_no
                                    })}
                                    className="p-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded text-slate-600 transition"
                                    title="Attach to Google Drive & Create Share Link"
                                  >
                                    <Paperclip className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 4: INVENTORY & MULTI-UNIT STOCK */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              {!hasPermission(activeUser, 'inventory:view_stock') ? (
                <AccessDeniedShield
                  requiredPermission="inventory:view_stock"
                  roleName={activeUser?.role || 'User'}
                  userName={activeUser?.full_name || 'User'}
                  onSwitchAdmin={() => switchActiveUser(1)}
                />
              ) : (
                <>
                  <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Multi-Unit Stock Inventory & Valuation</h2>
                      <p className="text-xs text-slate-500">
                        Items with Compound Fixed Units (1 Box = 24 Pcs) & Loose Variable Units (Bags & Kgs)
                      </p>
                    </div>
                    {hasPermission(activeUser, 'inventory:create_item') && (
                      <button
                        onClick={() => setShowItemForm(!showItemForm)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        {showItemForm ? 'Close Form' : 'Create Stock Item'}
                      </button>
                    )}
                  </div>

                  {/* Create Item Form */}
                  {showItemForm && (
                    <div className="bg-white p-6 rounded-2xl border border-blue-200 shadow-md">
                      <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-4 border-b pb-2">
                        Create New Stock Item with Multi-Unit Setup
                      </h3>
                      <form onSubmit={handleCreateItem} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Item SKU / Code</label>
                            <input
                              type="text"
                              required
                              placeholder="ITM-BOLT-01"
                              value={newItemSku}
                              onChange={(e) => setNewItemSku(e.target.value.toUpperCase())}
                              className="w-full px-3 py-2 border rounded-lg font-mono uppercase"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Item / Product Name</label>
                            <input
                              type="text"
                              required
                              placeholder="Stainless Steel Hex Bolt M12"
                              value={newItemName}
                              onChange={(e) => setNewItemName(e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">HSN / SAC Code</label>
                            <input
                              type="text"
                              required
                              placeholder="73181500"
                              value={newItemHsn}
                              onChange={(e) => setNewItemHsn(e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg font-mono"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Category</label>
                            <input
                              type="text"
                              placeholder="Fasteners"
                              value={newItemCategory}
                              onChange={(e) => setNewItemCategory(e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                          </div>
                        </div>

                        {/* Unit Setup: Related / Compound vs Unrelated / Loose */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                          <span className="text-xs font-bold text-blue-900 uppercase">
                            Unit Measurement Configuration
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Primary Unit (UQC)</label>
                              <select
                                value={newItemPUnit}
                                onChange={(e) => setNewItemPUnit(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg bg-white"
                              >
                                {GST_UQC_LIST.map(u => (
                                  <option key={u.code} value={u.code}>{u.code} - {u.name}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Secondary / Alternate Unit</label>
                              <select
                                value={newItemSUnit}
                                onChange={(e) => setNewItemSUnit(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg bg-white"
                              >
                                <option value="">-- None (Single Unit) --</option>
                                {GST_UQC_LIST.map(u => (
                                  <option key={u.code} value={u.code}>{u.code} - {u.name}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Unit Relation Type</label>
                              <select
                                value={newItemRelType}
                                onChange={(e) => setNewItemRelType(e.target.value as any)}
                                className="w-full px-3 py-2 border rounded-lg bg-white"
                              >
                                <option value="FIXED_COMPOUND">Fixed Compound (e.g. 1 Box = 24 Pcs)</option>
                                <option value="LOOSE_VARIABLE">Loose / Variable / Unrelated (e.g. Bags + Kgs)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">
                                Conversion Factor {newItemRelType === 'FIXED_COMPOUND' ? '(1 Primary = ? Secondary)' : '(Not applicable for loose)'}
                              </label>
                              <input
                                type="number"
                                step="any"
                                disabled={newItemRelType === 'LOOSE_VARIABLE'}
                                value={newItemFactor}
                                onChange={(e) => setNewItemFactor(parseFloat(e.target.value) || 1)}
                                className="w-full px-3 py-2 border rounded-lg bg-white font-mono"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Pricing & Image URL */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Cost Price (₹)</label>
                            <input
                              type="number"
                              value={newItemCost}
                              onChange={(e) => setNewItemCost(parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border rounded-lg font-mono"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Selling Price (₹)</label>
                            <input
                              type="number"
                              value={newItemSale}
                              onChange={(e) => setNewItemSale(parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border rounded-lg font-mono"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Opening Stock (Primary)</label>
                            <input
                              type="number"
                              value={newItemStock}
                              onChange={(e) => setNewItemStock(parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border rounded-lg font-mono"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Product Photograph / Image URL</label>
                            <input
                              type="text"
                              placeholder="https://... or attach file"
                              value={newItemImageUrl}
                              onChange={(e) => setNewItemImageUrl(e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t">
                          <button
                            type="button"
                            onClick={() => setShowItemForm(false)}
                            className="px-4 py-2 border rounded-lg text-xs text-slate-600"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                          >
                            Save Item Master
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Stock Items Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stockItems.map((item) => (
                      <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                {item.sku}
                              </span>
                              <h3 className="font-bold text-sm text-slate-900 mt-1">{item.name}</h3>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              HSN: {item.hsn_code}
                            </span>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs my-3">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Current Stock:</span>
                              <span className="font-mono font-black text-slate-900">
                                {item.current_stock_primary} {item.primary_unit}
                                {item.secondary_unit && (
                                  <span className="text-slate-500 font-normal">
                                    {' '}({item.current_stock_secondary} {item.secondary_unit})
                                  </span>
                                )}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-slate-500">Unit Relation:</span>
                              <span className="font-semibold text-slate-700">
                                {item.unit_relation_type === 'FIXED_COMPOUND'
                                  ? `Fixed (1 ${item.primary_unit} = ${item.conversion_factor} ${item.secondary_unit})`
                                  : 'Loose / Variable Measure'}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-slate-500">Stock Valuation:</span>
                              <span className="font-mono font-bold text-emerald-700">
                                ₹{(Number(item.current_stock_primary) * Number(item.cost_price)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Selling Rate:</span>
                            <span className="font-mono font-bold text-slate-800">₹{Number(item.selling_price).toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setAttachModal({
                                open: true,
                                type: 'ITEM',
                                id: item.id,
                                title: item.name
                              })}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-700 font-semibold text-[11px] flex items-center gap-1"
                              title="Attach Item Catalog Image / Specs"
                            >
                              <Paperclip className="w-3.5 h-3.5" /> Photos & Docs
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Stock Movement Register (Item Ledger) */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-slate-100">
                      <h3 className="font-bold text-sm text-slate-800">Item-Wise Stock Movement Register (Accounting Integration)</h3>
                      <p className="text-xs text-slate-500">Tracking physical quantities and ledger valuation for every invoice</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                            <th className="p-3">Item Name</th>
                            <th className="p-3">Ref Invoice #</th>
                            <th className="p-3">Direction</th>
                            <th className="p-3">Party Name</th>
                            <th className="p-3 text-right">Primary Qty</th>
                            <th className="p-3 text-right">Secondary Qty</th>
                            <th className="p-3 text-right">Rate (₹)</th>
                            <th className="p-3 text-right">Value (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {stockMovements.map((mov, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="p-3 font-sans font-medium text-slate-800">{mov.item_name}</td>
                              <td className="p-3 font-bold text-blue-700">{mov.invoice_no}</td>
                              <td className="p-3 font-sans">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  mov.direction === 'OUTWARD' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {mov.direction === 'OUTWARD' ? 'Outward (Sale)' : 'Inward (Purchase)'}
                                </span>
                              </td>
                              <td className="p-3 font-sans text-slate-700">{mov.party_name}</td>
                              <td className="p-3 text-right font-bold">
                                {mov.direction === 'OUTWARD' ? `-${mov.primary_qty}` : `+${mov.primary_qty}`} {mov.primary_unit}
                              </td>
                              <td className="p-3 text-right text-slate-600">
                                {mov.secondary_qty ? `${mov.secondary_qty} ${mov.secondary_unit}` : '-'}
                              </td>
                              <td className="p-3 text-right">₹{Number(mov.unit_rate).toFixed(2)}</td>
                              <td className="p-3 text-right font-bold text-slate-900">₹{Number(mov.taxable_amount).toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 5: CHART OF ACCOUNTS & LEDGERS */}
          {activeTab === 'ledgers' && (
            <div className="space-y-6">
              {!hasPermission(activeUser, 'ledgers:view') ? (
                <AccessDeniedShield
                  requiredPermission="ledgers:view"
                  roleName={activeUser?.role || 'User'}
                  userName={activeUser?.full_name || 'User'}
                  onSwitchAdmin={() => switchActiveUser(1)}
                />
              ) : (
                <>
                  <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Indian Chart of Accounts (28 Standard Groups)</h2>
                      <p className="text-xs text-slate-500">Tally-compatible double-entry ledger hierarchy with real-time debit/credit balances</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                            <th className="p-3">Code</th>
                            <th className="p-3">Ledger Name</th>
                            <th className="p-3">Account Group</th>
                            <th className="p-3 text-center">Type</th>
                            <th className="p-3 text-right">Opening Balance</th>
                            <th className="p-3 text-right">Voucher Debits</th>
                            <th className="p-3 text-right">Voucher Credits</th>
                            <th className="p-3 text-right">Closing Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {ledgers.map((l) => (
                            <tr key={l.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-mono font-bold text-blue-700">{l.code}</td>
                              <td className="p-3 font-semibold text-slate-900">{l.name}</td>
                              <td className="p-3">
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium text-slate-700">
                                  {l.group_type}
                                </span>
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-slate-600">{l.balance_type}</td>
                              <td className="p-3 text-right font-mono">₹{Number(l.opening_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="p-3 text-right font-mono text-emerald-700">₹{(l as any).total_debit ? Number((l as any).total_debit).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</td>
                              <td className="p-3 text-right font-mono text-rose-700">₹{(l as any).total_credit ? Number((l as any).total_credit).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</td>
                              <td className="p-3 text-right font-mono font-bold text-slate-950">
                                ₹{Number(l.current_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })} {l.balance_type}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 6: FINANCIAL STATEMENTS (BALANCE SHEET & P&L) */}
          {activeTab === 'financials' && (
            <div className="space-y-6">
              {!hasPermission(activeUser, 'reports:balance_sheet') ? (
                <AccessDeniedShield
                  requiredPermission="reports:balance_sheet"
                  roleName={activeUser?.role || 'User'}
                  userName={activeUser?.full_name || 'User'}
                  onSwitchAdmin={() => switchActiveUser(1)}
                />
              ) : (
                <>
                  <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Financial Statements (Real-Time Double Entry)</h2>
                      <p className="text-xs text-slate-500">Live Indian Balance Sheet, Trading & Profit & Loss Statement, and Trial Balance</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Books Balanced (Debits = Credits)
                      </span>
                    </div>
                  </div>

                  {/* 1. BALANCE SHEET (T-FORMAT / ASSETS VS LIABILITIES) */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-sm">BALANCE SHEET</h3>
                        <p className="text-xs text-slate-400">As on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                      </div>
                      <span className="text-xs bg-white/10 px-3 py-1 rounded font-mono font-bold">
                        Indian GAAP / Schedule III Format
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 text-xs">
                      {/* Liabilities Side */}
                      <div className="p-5 space-y-4">
                        <h4 className="font-bold text-slate-800 uppercase tracking-wider text-xs border-b pb-2 flex justify-between">
                          <span>LIABILITIES & EQUITY</span>
                          <span>AMOUNT (₹)</span>
                        </h4>

                        <div className="space-y-3">
                          <div>
                            <span className="font-bold text-blue-900 uppercase block text-[11px]">1. Capital & Reserves:</span>
                            <div className="pl-3 space-y-1 mt-1">
                              {balanceSheet?.liabilities?.capitalAndReserves?.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between text-slate-700">
                                  <span>{item.name}</span>
                                  <span className="font-mono font-semibold">₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <span className="font-bold text-blue-900 uppercase block text-[11px]">2. Long-Term Borrowings:</span>
                            <div className="pl-3 space-y-1 mt-1">
                              {balanceSheet?.liabilities?.longTermLiabilities?.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between text-slate-700">
                                  <span>{item.name}</span>
                                  <span className="font-mono font-semibold">₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <span className="font-bold text-blue-900 uppercase block text-[11px]">3. Current Liabilities & Provisions:</span>
                            <div className="pl-3 space-y-1 mt-1">
                              {balanceSheet?.liabilities?.currentLiabilities?.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between text-slate-700">
                                  <span>{item.name}</span>
                                  <span className="font-mono font-semibold">₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t-2 border-slate-900 flex justify-between font-black text-sm text-slate-950">
                          <span>TOTAL LIABILITIES:</span>
                          <span className="font-mono">₹{Number(balanceSheet?.liabilities?.totalLiabilities || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      {/* Assets Side */}
                      <div className="p-5 space-y-4">
                        <h4 className="font-bold text-slate-800 uppercase tracking-wider text-xs border-b pb-2 flex justify-between">
                          <span>ASSETS</span>
                          <span>AMOUNT (₹)</span>
                        </h4>

                        <div className="space-y-3">
                          <div>
                            <span className="font-bold text-emerald-900 uppercase block text-[11px]">1. Non-Current / Fixed Assets:</span>
                            <div className="pl-3 space-y-1 mt-1">
                              {balanceSheet?.assets?.fixedAssets?.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between text-slate-700">
                                  <span>{item.name}</span>
                                  <span className="font-mono font-semibold">₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <span className="font-bold text-emerald-900 uppercase block text-[11px]">2. Current Assets:</span>
                            <div className="pl-3 space-y-1 mt-1">
                              {balanceSheet?.assets?.currentAssets?.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between text-slate-700">
                                  <span>{item.name}</span>
                                  <span className="font-mono font-semibold">₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t-2 border-slate-900 flex justify-between font-black text-sm text-slate-950">
                          <span>TOTAL ASSETS:</span>
                          <span className="font-mono">₹{Number(balanceSheet?.assets?.totalAssets || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. PROFIT & LOSS STATEMENT */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
                    <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-4 border-b pb-2">
                      Trading & Profit and Loss Statement (FY 2026-27)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                      {/* Trading Section */}
                      <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200">
                        <span className="font-bold text-slate-900 uppercase text-[11px]">Trading Account:</span>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Revenue from Operations (Sales):</span>
                          <span className="font-mono font-bold">₹{Number(profitLoss?.tradingAccount?.sales || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Less: Cost of Materials Purchased:</span>
                          <span className="font-mono text-rose-700">-₹{Number(profitLoss?.tradingAccount?.purchases || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Less: Direct Factory Expenses & Freight:</span>
                          <span className="font-mono text-rose-700">-₹{Number(profitLoss?.tradingAccount?.directExpenses || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t font-bold text-emerald-800">
                          <span>GROSS PROFIT:</span>
                          <span className="font-mono">₹{Number(profitLoss?.tradingAccount?.grossProfit || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      {/* P&L Section */}
                      <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200">
                        <span className="font-bold text-slate-900 uppercase text-[11px]">Net Income Statement:</span>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Gross Profit b/f:</span>
                          <span className="font-mono font-bold">₹{Number(profitLoss?.incomeStatement?.grossProfit || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Add: Indirect Incomes (Interest, Scrap):</span>
                          <span className="font-mono text-emerald-700">+₹{Number(profitLoss?.incomeStatement?.indirectIncomes || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Less: Employee Payroll (EPF & ESI) & Admin:</span>
                          <span className="font-mono text-rose-700">-₹{Number(profitLoss?.incomeStatement?.indirectExpenses || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t font-black text-sm text-blue-900">
                          <span>NET PROFIT FOR THE PERIOD:</span>
                          <span className="font-mono">₹{Number(profitLoss?.incomeStatement?.netProfit || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 7: GST COMPLIANCE (GSTR-1, 2B, 3B, E-WAY BILL) */}
          {activeTab === 'gst' && (
            <div className="space-y-6">
              {!hasPermission(activeUser, 'compliance:gst1') ? (
                <AccessDeniedShield
                  requiredPermission="compliance:gst1"
                  roleName={activeUser?.role || 'User'}
                  userName={activeUser?.full_name || 'User'}
                  onSwitchAdmin={() => switchActiveUser(1)}
                />
              ) : (
                <>
                  <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">GST Portal Filing & Reconciliation Center</h2>
                      <p className="text-xs text-slate-500">Government-ready GSTR-1, GSTR-2B, GSTR-3B and NIC E-Way Bill JSON generation</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-bold border border-blue-200">
                      Tax Period: 10/2026 (October)
                    </span>
                  </div>

                  {/* 3 GST Action Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* GSTR-1 */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold text-[10px] rounded">GSTR-1</span>
                          <span className="text-xs text-slate-400">Monthly Return</span>
                        </div>
                        <h3 className="font-bold text-sm text-slate-900">Outward Supplies Return</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Contains B2B, B2CS, and HSN summary tables for GST Portal upload.
                        </p>
                        <div className="my-3 p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                          <div className="flex justify-between">
                            <span>B2B Invoices:</span>
                            <span className="font-mono font-bold">{gstOverview?.gstr1?.b2b?.length || 0} Parties</span>
                          </div>
                          <div className="flex justify-between">
                            <span>HSN Summary Lines:</span>
                            <span className="font-mono font-bold">{gstOverview?.gstr1?.hsn?.data?.length || 0} Lines</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => downloadJSON(gstOverview?.gstr1, `GSTR1_${company?.gstin}_102026.json`)}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                      >
                        <Download className="w-3.5 h-3.5" /> Download GSTR-1 JSON
                      </button>
                    </div>

                    {/* GSTR-2A / 2B */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-bold text-[10px] rounded">GSTR-2B</span>
                          <span className="text-xs text-slate-400">ITC Recon</span>
                        </div>
                        <h3 className="font-bold text-sm text-slate-900">Inward Supplies & ITC Auto-Draft</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Auto-reconciles purchase register against supplier returns for ITC eligibility.
                        </p>
                        <div className="my-3 p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                          <div className="flex justify-between">
                            <span>Total Eligible ITC:</span>
                            <span className="font-mono font-bold text-emerald-700">
                              ₹{(gstOverview?.gstr3b?.sec_sum?.table4?.itc_net?.camt + gstOverview?.gstr3b?.sec_sum?.table4?.itc_net?.samt + gstOverview?.gstr3b?.sec_sum?.table4?.itc_net?.iamt || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Inward Invoices:</span>
                            <span className="font-mono font-bold">{inwardInvoices.length} Bills</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => downloadJSON(gstOverview?.inwardInvoices, `GSTR2B_Recon_${company?.gstin}_102026.json`)}
                        className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                      >
                        <Download className="w-3.5 h-3.5" /> Export ITC Match Data
                      </button>
                    </div>

                    {/* GSTR-3B */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded">GSTR-3B</span>
                          <span className="text-xs text-slate-400">Summary Return</span>
                        </div>
                        <h3 className="font-bold text-sm text-slate-900">Monthly Tax Liability & Set-Off</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Table 3.1 Outward Tax, Table 4 ITC, Table 6.1 Net Tax Paid in Cash.
                        </p>
                        <div className="my-3 p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                          <div className="flex justify-between">
                            <span>Outward Tax:</span>
                            <span className="font-mono font-bold">
                              ₹{(gstOverview?.gstr3b?.sec_sum?.table3_1?.osup_det?.camt + gstOverview?.gstr3b?.sec_sum?.table3_1?.osup_det?.samt + gstOverview?.gstr3b?.sec_sum?.table3_1?.osup_det?.iamt || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cash Payable:</span>
                            <span className="font-mono font-bold text-rose-700">
                              ₹{(gstOverview?.gstr3b?.sec_sum?.table6_1?.paid_in_cash?.iamt + gstOverview?.gstr3b?.sec_sum?.table6_1?.paid_in_cash?.camt + gstOverview?.gstr3b?.sec_sum?.table6_1?.paid_in_cash?.samt || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => downloadJSON(gstOverview?.gstr3b, `GSTR3B_${company?.gstin}_102026.json`)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                      >
                        <Download className="w-3.5 h-3.5" /> Download GSTR-3B JSON
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 8: INCOME TAX TDS & TCS */}
          {activeTab === 'tds' && (
            <div className="space-y-6">
              {!hasPermission(activeUser, 'compliance:tds_tcs') ? (
                <AccessDeniedShield
                  requiredPermission="compliance:tds_tcs"
                  roleName={activeUser?.role || 'User'}
                  userName={activeUser?.full_name || 'User'}
                  onSwitchAdmin={() => switchActiveUser(1)}
                />
              ) : (
                <>
                  <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Income Tax TDS & TCS Register (Tax Year 2026-27)</h2>
                      <p className="text-xs text-slate-500">
                        Compliant with IT Act 2025 Sections 392, 393, 394, Return Codes 1001-1092, Form 26Q & 27EQ
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadJSON(tdsEntries, `Form26Q_Q3_2026_27_${company?.pan}.json`)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" /> Export Form 26Q Data
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 font-semibold block">TOTAL TAX DEDUCTED / COLLECTED:</span>
                      <span className="text-xl font-bold font-mono text-slate-900">
                        ₹{Number(tdsSummary?.totalDeducted || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 font-semibold block">DEPOSITED VIA CHALLAN 281:</span>
                      <span className="text-xl font-bold font-mono text-emerald-700">
                        ₹{Number(tdsSummary?.totalPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 font-semibold block">PENDING GOVERNMENT DEPOSIT:</span>
                      <span className="text-xl font-bold font-mono text-rose-700">
                        ₹{Number(tdsSummary?.totalPending || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* TDS / TCS Entries Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                            <th className="p-3">Section</th>
                            <th className="p-3">Code</th>
                            <th className="p-3">Deductee / Party Name</th>
                            <th className="p-3">PAN</th>
                            <th className="p-3">Ref Invoice</th>
                            <th className="p-3 text-right">Gross Amount</th>
                            <th className="p-3 text-right">Tax Rate</th>
                            <th className="p-3 text-right">TDS/TCS (₹)</th>
                            <th className="p-3 text-center">Challan 281 Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {tdsEntries.map((tds) => (
                            <tr key={tds.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-bold text-slate-900">
                                <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200 font-mono text-[10px]">
                                  {tds.old_section} ({tds.new_section})
                                </span>
                              </td>
                              <td className="p-3 font-mono text-slate-500">{tds.return_code}</td>
                              <td className="p-3 font-semibold text-slate-800">{tds.party_name}</td>
                              <td className="p-3 font-mono font-bold text-slate-700">{tds.party_pan}</td>
                              <td className="p-3 font-mono text-blue-700">{tds.invoice_ref || '-'}</td>
                              <td className="p-3 text-right font-mono">₹{Number(tds.booking_amount).toLocaleString('en-IN')}</td>
                              <td className="p-3 text-right font-mono font-bold">{tds.tax_rate}%</td>
                              <td className="p-3 text-right font-mono font-bold text-rose-700">₹{Number(tds.tax_deducted).toFixed(2)}</td>
                              <td className="p-3 text-center">
                                {tds.is_paid ? (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                                    Challan #{tds.challan_no} (BSR: {tds.challan_bsr_code})
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-[10px] font-bold">
                                    Pending Payment
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 9: HRMS, PAYROLL, EPF & ESI */}
          {activeTab === 'payroll' && (
            <div className="space-y-6">
              {!hasPermission(activeUser, 'payroll:manage_employees') ? (
                <AccessDeniedShield
                  requiredPermission="payroll:manage_employees"
                  roleName={activeUser?.role || 'User'}
                  userName={activeUser?.full_name || 'User'}
                  onSwitchAdmin={() => switchActiveUser(1)}
                />
              ) : (
                <>
                  <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">HRMS & Labor Compliance (EPF, ESI, PT)</h2>
                      <p className="text-xs text-slate-500">
                        Provident Fund (12%/12%), ESI (0.75%/3.25%), Professional Tax (₹200) and Printable Payslips
                      </p>
                    </div>
                    {hasPermission(activeUser, 'payroll:process_salary') && (
                      <button
                        onClick={handleRunPayroll}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Run Monthly Payroll (10/2026)
                      </button>
                    )}
                  </div>

                  {/* Payroll Records Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-slate-100">
                      <h3 className="font-bold text-sm text-slate-800">Monthly Payslip Register - October 2026</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                            <th className="p-3">Emp ID</th>
                            <th className="p-3">Employee Name</th>
                            <th className="p-3">Designation</th>
                            <th className="p-3 text-right">Gross Earned</th>
                            <th className="p-3 text-right">EPF (12%)</th>
                            <th className="p-3 text-right">ESI (0.75%)</th>
                            <th className="p-3 text-right">PT (₹)</th>
                            <th className="p-3 text-right">Total Deductions</th>
                            <th className="p-3 text-right font-black">Net Salary</th>
                            <th className="p-3 text-center">Payslip</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {payrollRecords.map((pr) => (
                            <tr key={pr.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-mono font-bold text-slate-700">{pr.emp_code}</td>
                              <td className="p-3 font-semibold text-slate-900">{pr.employee_name}</td>
                              <td className="p-3 text-slate-600">{pr.designation}</td>
                              <td className="p-3 text-right font-mono">₹{Number(pr.gross_earned).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="p-3 text-right font-mono text-rose-700">₹{Number(pr.epf_employee).toFixed(2)}</td>
                              <td className="p-3 text-right font-mono text-rose-700">{Number(pr.esi_employee) > 0 ? `₹${Number(pr.esi_employee).toFixed(2)}` : 'Exempt'}</td>
                              <td className="p-3 text-right font-mono text-rose-700">₹{Number(pr.professional_tax).toFixed(2)}</td>
                              <td className="p-3 text-right font-mono text-rose-700">₹{Number(pr.total_deductions).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="p-3 text-right font-mono font-black text-emerald-800 text-sm">
                                ₹{Number(pr.net_payable).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => setPrintPayslip(pr)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 mx-auto transition"
                                >
                                  <Printer className="w-3.5 h-3.5" /> View Payslip
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 10: ACCESS RIGHTS & RBAC CONTROL MATRIX */}
          {activeTab === 'controls' && (
            <div className="space-y-6">
              {!hasPermission(activeUser, 'users:manage_roles') ? (
                <AccessDeniedShield
                  requiredPermission="users:manage_roles"
                  roleName={activeUser?.role || 'User'}
                  userName={activeUser?.full_name || 'User'}
                  onSwitchAdmin={() => switchActiveUser(1)}
                />
              ) : (
                <>
                  <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Multi-User Control Center & Access Rights Matrix</h2>
                      <p className="text-xs text-slate-500">
                        Granular permission toggles: Give or revoke rights like make invoice, view balance sheet, create item, ledger, file GST
                      </p>
                    </div>
                  </div>

                  {/* Matrix Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-slate-100">
                      <p className="text-xs text-slate-600">
                        Click on any checkbox below to grant or revoke specific operational permissions in real-time. Changes are immediately saved to Supabase PostgreSQL.
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                            <th className="p-3">User / Persona</th>
                            <th className="p-3">Role</th>
                            <th className="p-3 text-center">Invoices: Create</th>
                            <th className="p-3 text-center">Balance Sheet</th>
                            <th className="p-3 text-center">Create Item</th>
                            <th className="p-3 text-center">Create Ledger</th>
                            <th className="p-3 text-center">GST Filing</th>
                            <th className="p-3 text-center">Payroll</th>
                            <th className="p-3 text-center">Switch User</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {allUsers.map((u) => {
                            const perms = new Set(u.permissions || []);
                            const isSuper = u.role === 'SUPER_ADMIN';

                            return (
                              <tr key={u.id} className="hover:bg-slate-50/50">
                                <td className="p-3 font-semibold text-slate-900">
                                  <div>{u.full_name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
                                </td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-700">
                                    {u.role}
                                  </span>
                                </td>

                                {/* 1. Invoices: Create */}
                                <td className="p-3 text-center">
                                  <input
                                    type="checkbox"
                                    disabled={isSuper}
                                    checked={isSuper || perms.has('invoices:create')}
                                    onChange={() => togglePermission(u, 'invoices:create')}
                                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                                  />
                                </td>

                                {/* 2. Balance Sheet */}
                                <td className="p-3 text-center">
                                  <input
                                    type="checkbox"
                                    disabled={isSuper}
                                    checked={isSuper || perms.has('reports:balance_sheet')}
                                    onChange={() => togglePermission(u, 'reports:balance_sheet')}
                                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                                  />
                                </td>

                                {/* 3. Create Item */}
                                <td className="p-3 text-center">
                                  <input
                                    type="checkbox"
                                    disabled={isSuper}
                                    checked={isSuper || perms.has('inventory:create_item')}
                                    onChange={() => togglePermission(u, 'inventory:create_item')}
                                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                                  />
                                </td>

                                {/* 4. Create Ledger */}
                                <td className="p-3 text-center">
                                  <input
                                    type="checkbox"
                                    disabled={isSuper}
                                    checked={isSuper || perms.has('ledgers:create')}
                                    onChange={() => togglePermission(u, 'ledgers:create')}
                                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                                  />
                                </td>

                                {/* 5. GST Filing */}
                                <td className="p-3 text-center">
                                  <input
                                    type="checkbox"
                                    disabled={isSuper}
                                    checked={isSuper || perms.has('compliance:gst1')}
                                    onChange={() => togglePermission(u, 'compliance:gst1')}
                                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                                  />
                                </td>

                                {/* 6. Payroll */}
                                <td className="p-3 text-center">
                                  <input
                                    type="checkbox"
                                    disabled={isSuper}
                                    checked={isSuper || perms.has('payroll:process_salary')}
                                    onChange={() => togglePermission(u, 'payroll:process_salary')}
                                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                                  />
                                </td>

                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => switchActiveUser(u.id)}
                                    className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-semibold"
                                  >
                                    Test Login
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* MODALS */}
      {/* 1. Cloud Storage Integration Modal (Google Drive, Dropbox, OneDrive) */}
      <CloudDriveModal
        isOpen={cloudDriveOpen}
        onClose={() => setCloudDriveOpen(false)}
        userId={activeUser?.id || 1}
        userName={activeUser?.full_name || 'Admin'}
      />

      {/* 2. Document Attach & Cloud Share Modal */}
      <DocumentAttachModal
        isOpen={attachModal.open}
        onClose={() => setAttachModal({ ...attachModal, open: false })}
        entityType={attachModal.type}
        entityId={attachModal.id}
        entityTitle={attachModal.title}
        userName={activeUser?.full_name || 'Admin'}
      />

      {/* 3. GST Rule 46 Tax Invoice Print Modal */}
      {printInvoice && company && (
        <InvoicePrintModal
          isOpen={true}
          onClose={() => setPrintInvoice(null)}
          invoice={printInvoice}
          company={company}
        />
      )}

      {/* 4. NIC E-Way Bill JSON Modal */}
      {ewayInvoice && company && (
        <EwayBillModal
          isOpen={true}
          onClose={() => setEwayInvoice(null)}
          invoice={ewayInvoice}
          company={company}
        />
      )}

      {/* 5. Indian Statutory Payslip Modal */}
      {printPayslip && company && (
        <PayslipModal
          isOpen={true}
          onClose={() => setPrintPayslip(null)}
          record={printPayslip}
          company={company}
        />
      )}
    </div>
  );
}
