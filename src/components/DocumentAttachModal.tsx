'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Paperclip, Upload, FileText, Image as ImageIcon, Link as LinkIcon, Copy, Check, ExternalLink, X, Trash2 } from 'lucide-react';

interface DocumentAttachModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'INVOICE' | 'ITEM' | 'VOUCHER' | 'EMPLOYEE';
  entityId: number;
  entityTitle: string;
  userName: string;
}

export default function DocumentAttachModal({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityTitle,
  userName
}: DocumentAttachModalProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cloudProvider, setCloudProvider] = useState<'GOOGLE_DRIVE' | 'DROPBOX' | 'ONEDRIVE' | 'LOCAL_SECURE'>('GOOGLE_DRIVE');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents?entityType=${entityType}&entityId=${entityId}`);
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    if (isOpen) {
      fetchDocs();
    }
  }, [isOpen, fetchDocs]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();

    reader.onload = async () => {
      const base64Data = reader.result as string;
      try {
        const res = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entity_type: entityType,
            entity_id: entityId,
            file_name: file.name,
            file_type: file.type || 'application/octet-stream',
            file_size: file.size,
            file_data: base64Data,
            uploaded_by: userName,
            cloud_provider: cloudProvider
          })
        });
        const data = await res.json();
        if (data.success) {
          fetchDocs();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setUploading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const copyShareLink = (docId: number, shareUrl: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedId(docId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Paperclip className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-base">Document & Image Attachments</h3>
              <p className="text-xs text-slate-400">{entityType}: {entityTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center bg-slate-50/50 hover:bg-slate-50 transition">
            <div className="flex items-center justify-center gap-4 mb-3">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                Target Cloud Drive:
              </label>
              <select
                value={cloudProvider}
                onChange={(e) => setCloudProvider(e.target.value as any)}
                className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-700 focus:outline-none"
              >
                <option value="GOOGLE_DRIVE">Google Drive (Authenticated)</option>
                <option value="DROPBOX">Dropbox</option>
                <option value="ONEDRIVE">Microsoft OneDrive</option>
                <option value="LOCAL_SECURE">ERP Local Vault</option>
              </select>
            </div>

            <label className="cursor-pointer inline-flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold text-slate-700">
                {uploading ? 'Uploading to Drive...' : 'Click to Upload PDF, Excel, or Image'}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                Supports Tax Invoices (.pdf), Stock sheets (.xlsx), Photos (.jpg, .png)
              </span>
              <input
                type="file"
                className="hidden"
                disabled={uploading}
                onChange={handleFileUpload}
                accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.doc,.docx"
              />
            </label>
          </div>

          {/* Document List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Attached Documents ({documents.length})
            </h4>

            {loading ? (
              <p className="text-xs text-slate-400 py-4 text-center">Loading attached documents...</p>
            ) : documents.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-slate-100 rounded-xl bg-slate-50">
                No documents or item photos attached yet. Upload a file above to store in {cloudProvider.replace('_', ' ')}!
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {documents.map((doc) => {
                  const isImg = doc.file_type?.startsWith('image/');
                  const isPdf = doc.file_type?.includes('pdf');
                  const isExcel = doc.file_type?.includes('excel') || doc.file_type?.includes('sheet');

                  return (
                    <div
                      key={doc.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-xs hover:border-blue-300 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isImg ? 'bg-purple-100 text-purple-700' : isPdf ? 'bg-rose-100 text-rose-700' : isExcel ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {isImg ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{doc.file_name}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-medium text-blue-600">{doc.cloud_provider?.replace('_', ' ')}</span>
                            <span>•</span>
                            <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <span>By {doc.uploaded_by}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Share Link Button */}
                        <button
                          type="button"
                          onClick={() => copyShareLink(doc.id, doc.share_url)}
                          title="Copy Public Share Link"
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition"
                        >
                          {copiedId === doc.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Link Copied!</span>
                            </>
                          ) : (
                            <>
                              <LinkIcon className="w-3.5 h-3.5" />
                              <span>Share Link</span>
                            </>
                          )}
                        </button>

                        {/* Open Link / Preview */}
                        <a
                          href={doc.share_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open Shareable Page"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
