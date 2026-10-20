'use client';

import React, { useEffect, useState, use, Suspense } from 'react';
import Link from 'next/link';

interface SharePageProps {
  params: Promise<{ token: string }>;
}

function DocumentViewer({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadDoc() {
      try {
        const res = await fetch(`/api/documents?token=${token}`);
        const data = await res.json();
        if (data.success && data.document) {
          setDoc(data.document);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    loadDoc();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 font-medium">Retrieving shared document from Cloud Vault...</p>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow border border-slate-200 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            !
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Document Link Expired or Not Found</h2>
          <p className="text-slate-600 text-sm mb-6">
            The shared document link is invalid or has been removed by the administrator.
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Return to ERP Portal
          </Link>
        </div>
      </div>
    );
  }

  const isImage = doc.file_type?.startsWith('image/') || doc.file_data?.startsWith('data:image/');
  const isPdf = doc.file_type?.includes('pdf') || doc.file_name?.toLowerCase().endsWith('.pdf');

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-blue-700 text-white rounded-lg flex items-center justify-center font-bold text-base shadow">
            MB
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">Bharat Enterprise ERP - Document Vault</h1>
            <p className="text-xs text-slate-500">Secure Document Share via {doc.cloud_provider?.replace('_', ' ') || 'Cloud Drive'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <a
            href={doc.file_data}
            download={doc.file_name}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition flex items-center gap-2 shadow"
          >
            <span>⬇ Download Original</span>
          </a>
        </div>
      </header>

      {/* Main Content Viewer */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6">
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden mb-6">
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                {doc.entity_type} ATTACHMENT
              </span>
              <h2 className="text-lg font-bold text-slate-800 mt-1">{doc.file_name}</h2>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p>Uploaded by: <strong className="text-slate-700">{doc.uploaded_by}</strong></p>
              <p>{new Date(doc.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>

          <div className="p-6 flex items-center justify-center min-h-[400px] bg-slate-50/50">
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={doc.file_data}
                alt={doc.file_name}
                className="max-h-[600px] max-w-full object-contain rounded border border-slate-200 shadow"
              />
            ) : isPdf ? (
              <iframe
                src={doc.file_data}
                className="w-full h-[650px] rounded border border-slate-300"
                title={doc.file_name}
              />
            ) : (
              <div className="text-center p-8 bg-white border border-slate-200 rounded-lg max-w-md">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  📄
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">{doc.file_name}</h3>
                <p className="text-xs text-slate-500 mb-4">
                  File type: {doc.file_type} ({(doc.file_size / 1024).toFixed(1)} KB)
                </p>
                <a
                  href={doc.file_data}
                  download={doc.file_name}
                  className="inline-block px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700 transition"
                >
                  Download Document
                </a>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SharedDocumentPage(props: SharePageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <DocumentViewer params={props.params} />
    </Suspense>
  );
}
