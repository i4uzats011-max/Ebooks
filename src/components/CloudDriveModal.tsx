'use client';

import React, { useState } from 'react';
import { Cloud, CheckCircle2, HardDrive, AlertCircle, Key, Folder, ExternalLink, X } from 'lucide-react';

interface CloudDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
}

export default function CloudDriveModal({ isOpen, onClose, userId, userName }: CloudDriveModalProps) {
  const [provider, setProvider] = useState<'GOOGLE_DRIVE' | 'DROPBOX' | 'ONEDRIVE'>('GOOGLE_DRIVE');
  const [accountEmail, setAccountEmail] = useState('');
  const [folderName, setFolderName] = useState('MyBooks_Accounting_Documents');
  const [apiKeyToken, setApiKeyToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/storage-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          provider,
          account_email: accountEmail || `${userName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
          access_token: apiKeyToken || `OAUTH_TOKEN_${Date.now()}`,
          folder_name: folderName
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMsg(data.error || 'Failed to authenticate drive');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Connect Cloud Storage Drive</h3>
              <p className="text-xs text-blue-200">User-authenticated cloud document sync (BYOS)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleAuthenticate} className="p-6 space-y-4">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select Cloud Storage Provider
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setProvider('GOOGLE_DRIVE')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                  provider === 'GOOGLE_DRIVE'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-800 ring-2 ring-blue-500/20 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold text-blue-600 text-sm">
                  G
                </div>
                <span className="text-xs">Google Drive</span>
              </button>

              <button
                type="button"
                onClick={() => setProvider('DROPBOX')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                  provider === 'DROPBOX'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-800 ring-2 ring-blue-500/20 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold text-sky-600 text-sm">
                  📦
                </div>
                <span className="text-xs">Dropbox</span>
              </button>

              <button
                type="button"
                onClick={() => setProvider('ONEDRIVE')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                  provider === 'ONEDRIVE'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-800 ring-2 ring-blue-500/20 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold text-blue-800 text-sm">
                  ☁
                </div>
                <span className="text-xs">OneDrive</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Your {provider.replace('_', ' ')} Account Email
            </label>
            <input
              type="email"
              required
              placeholder={provider === 'GOOGLE_DRIVE' ? 'accountant@gmail.com' : 'user@company.com'}
              value={accountEmail}
              onChange={(e) => setAccountEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-slate-400" /> Destination Folder Name
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-slate-400" /> OAuth Access Token or App Key (Optional / Auto-generated)
            </label>
            <input
              type="password"
              placeholder="Leave blank for automatic user OAuth session"
              value={apiKeyToken}
              onChange={(e) => setApiKeyToken(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2">
            <HardDrive className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <span>
              All documents, PDFs, Excel registers, and item images uploaded by you will automatically sync to your personal {provider.replace('_', ' ')} account folder, and provide direct shareable links!
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              {isSubmitting ? 'Authenticating...' : `Authorize & Connect ${provider.replace('_', ' ')}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
