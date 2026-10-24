import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { AmigurumiProject } from '../types/amigurumi';
import { StorageService } from '../services/storage';
import { X, QrCode, Smartphone, Laptop, Copy, Check, Share2, Database, Download } from 'lucide-react';

interface SyncShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: AmigurumiProject;
  onOpenSupabaseModal: () => void;
}

export const SyncShareModal: React.FC<SyncShareModalProps> = ({
  isOpen,
  onClose,
  project,
  onOpenSupabaseModal,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !project) return;

    try {
      const payload = StorageService.encodeForSharing(project);
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${origin}/#project=${payload}`;
      setShareUrl(url);

      QRCode.toDataURL(url, {
        width: 280,
        margin: 2,
        color: {
          dark: '#1c1917',
          light: '#ffffff',
        },
      }).then((dataUrl) => {
        setQrDataUrl(dataUrl);
      });
    } catch (err) {
      console.error('Falha ao gerar QR Code:', err);
    }
  }, [isOpen, project]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleNativeShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: `Amigurumi: ${project.title}`,
        text: `Acompanhe o contador de voltas do meu amigurumi ${project.title}!`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-stone-800 dark:text-stone-100 font-comfortaa">
                Sincronizar entre PC e Celular
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Transfira este projeto para seu celular instantaneamente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-center">
          {/* Method 1: QR Code Scanner */}
          <div className="bg-stone-50 dark:bg-stone-800/50 p-5 rounded-2xl border border-stone-200 dark:border-stone-700">
            <div className="flex items-center justify-center gap-2 mb-2 text-stone-700 dark:text-stone-200 text-sm font-bold">
              <Laptop className="w-4 h-4 text-purple-500" />
              <span>PC</span>
              <span className="text-stone-400">➔</span>
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <span>Celular</span>
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
              Aponte a câmera do celular para este QR Code para abrir o projeto nele com todas as voltas e cores!
            </p>

            <div className="inline-block p-3 bg-white rounded-2xl shadow-md border border-stone-200">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code para sincronizar com o celular" className="w-52 h-52 mx-auto" />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-stone-400">
                  <QrCode className="w-12 h-12 animate-pulse" />
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Link Copiado!' : 'Copiar Link'}
              </button>

              <button
                onClick={handleNativeShare}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                Compartilhar no WhatsApp/Redes
              </button>
            </div>
          </div>

          {/* Option: Supabase Cloud Database */}
          <div className="p-4 rounded-2xl border border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-left">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-stone-800 dark:text-stone-100 font-comfortaa">
                  Sincronização em Nuvem (Supabase)
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5 leading-relaxed">
                  Prefere sincronização automática contínua em tempo real pelo seu próprio banco de dados Supabase? Configure em 1 minuto!
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onOpenSupabaseModal();
                  }}
                  className="mt-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Configurar Supabase ➔
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 flex justify-end bg-stone-50/50 dark:bg-stone-800/30">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold text-sm cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
