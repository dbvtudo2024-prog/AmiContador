import React, { useState } from 'react';
import { Download, Smartphone, X, Check, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'button' | 'card' | 'minimal';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'button',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed as PWA on home screen, do not show button
  if (isInstalled) {
    return null;
  }

  // Android / Chromium / Desktop prompt
  if (isInstallable) {
    if (variant === 'card') {
      return (
        <div className={`p-4 rounded-3xl bg-gradient-to-r from-[#8C5E47] to-[#C85A32] text-white shadow-md flex items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h4 className="font-comfortaa font-bold text-sm leading-tight truncate">
                Instalar no seu Celular
              </h4>
              <p className="text-xs text-white/80 truncate">
                Acesse como aplicativo direto na tela de início
              </p>
            </div>
          </div>
          <button
            onClick={install}
            className="px-3.5 py-2 rounded-xl bg-white text-[#8C5E47] hover:bg-[#FAF5ED] font-bold text-xs shrink-0 cursor-pointer shadow-xs active:scale-95 transition-transform"
          >
            Instalar App
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={install}
        className={`px-3 py-1.5 rounded-xl bg-[#8C5E47] hover:bg-[#724A36] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${className}`}
        title="Instalar AmiContador no celular"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        {variant === 'card' ? (
          <div className={`p-4 rounded-3xl bg-gradient-to-r from-[#8C5E47] to-[#C85A32] text-white shadow-md flex items-center justify-between gap-3 ${className}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h4 className="font-comfortaa font-bold text-sm leading-tight truncate">
                  Instalar no iPhone / iPad
                </h4>
                <p className="text-xs text-white/80 truncate">
                  Toque para ver o passo a passo no Safari
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(true)}
              className="px-3.5 py-2 rounded-xl bg-white text-[#8C5E47] hover:bg-[#FAF5ED] font-bold text-xs shrink-0 cursor-pointer shadow-xs active:scale-95 transition-transform"
            >
              Como Instalar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowIOSGuide(true)}
            className={`px-3 py-1.5 rounded-xl border border-[#D6C8B8] dark:border-stone-700 bg-[#FAF5ED] dark:bg-stone-800 text-[#2D2824] dark:text-stone-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${className}`}
            title="Instalar no iPhone / iPad"
          >
            <Download className="w-3.5 h-3.5 text-[#C85A32]" />
            <span>Instalar no iOS</span>
          </button>
        )}

        {showIOSGuide && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-[#FAF5ED] dark:bg-stone-900 border border-[#D6C8B8] dark:border-stone-700 p-5 shadow-2xl space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-[#EAE0D2] dark:border-stone-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#8C5E47]/15 flex items-center justify-center text-[#8C5E47]">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#2D2824] dark:text-stone-100 font-comfortaa">
                      Instalar no iPhone / iPad
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Adicione à Tela de Início em 2 passos
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-stone-700 dark:text-stone-300">
                <div className="flex items-start gap-2.5 bg-white dark:bg-stone-800 p-3 rounded-2xl border border-[#D6C8B8] dark:border-stone-700">
                  <div className="w-6 h-6 rounded-full bg-[#EDE4D6] dark:bg-stone-700 flex items-center justify-center font-bold text-stone-700 shrink-0">
                    1
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold">
                      Toque no botão de <strong>Compartilhar</strong> na barra do Safari:
                    </p>
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 text-[11px] font-bold">
                      <Share2 className="w-3.5 h-3.5 text-[#8C5E47]" /> Ícone de Compartilhar
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-white dark:bg-stone-800 p-3 rounded-2xl border border-[#D6C8B8] dark:border-stone-700">
                  <div className="w-6 h-6 rounded-full bg-[#EDE4D6] dark:bg-stone-700 flex items-center justify-center font-bold text-stone-700 shrink-0">
                    2
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold">
                      Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>:
                    </p>
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 text-[11px] font-bold">
                      <PlusSquare className="w-3.5 h-3.5 text-[#8C5E47]" /> Adicionar à Tela de Início
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-[#8C5E47] hover:bg-[#724A36] text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback for general browsers: instructions button
  return (
    <button
      onClick={() => {
        alert('Para instalar o app no celular: abra no Chrome ou Safari e clique no menu do navegador (três pontinhos ou compartilhar) > "Adicionar à tela de início".');
      }}
      className={`px-3 py-1.5 rounded-xl border border-[#D6C8B8] dark:border-stone-700 bg-[#FAF5ED] dark:bg-stone-800 text-[#2D2824] dark:text-stone-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${className}`}
      title="Como instalar no celular"
    >
      <Download className="w-3.5 h-3.5 text-[#8C5E47]" />
      <span>Instalar App</span>
    </button>
  );
};
