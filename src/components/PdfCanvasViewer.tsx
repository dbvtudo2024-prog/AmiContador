import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ExternalLink,
  Download,
  RefreshCw,
  AlertCircle,
  FileText,
  RotateCw,
  Highlighter,
} from 'lucide-react';

// Setup local worker via Vite URL import
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

interface PdfCanvasViewerProps {
  blob: Blob;
  fileName: string;
  isCompact?: boolean;
}

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  blob,
  fileName,
  isCompact = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(1);
  const [scale, setScale] = useState<number>(isCompact ? 1.0 : 1.3);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [rendering, setRendering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string>('');
  const [showRuler, setShowRuler] = useState<boolean>(false);
  const [rulerTop, setRulerTop] = useState<number>(100);

  // Keep active render task to cancel if page/scale changes quickly
  const renderTaskRef = useRef<any>(null);

  // Generate blob URL for download / open in new tab
  useEffect(() => {
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [blob]);

  // Load PDF Document
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    async function loadDocument() {
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.4.299/cmaps/',
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (!isCancelled) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setCurrentPage(1);
          setLoading(false);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Erro ao carregar PDF no canvas:', err);
          setError(
            err?.message ||
              'Não foi possível renderizar o PDF diretamente. Você pode abri-lo em uma nova aba ou baixar o arquivo.'
          );
          setLoading(false);
        }
      }
    }

    loadDocument();

    return () => {
      isCancelled = true;
    };
  }, [blob]);

  // Render current page onto canvas
  const renderPage = useCallback(
    async (pageNumber: number) => {
      if (!pdfDoc || !canvasRef.current) return;

      // Cancel any ongoing render
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // Ignore
        }
      }

      try {
        setRendering(true);
        const page = await pdfDoc.getPage(pageNumber);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Auto fit width if in compact mode
        let currentScale = scale;
        if (containerRef.current && isCompact) {
          const containerWidth = containerRef.current.clientWidth - 24;
          const unscaledViewport = page.getViewport({ scale: 1.0, rotation });
          if (containerWidth > 100 && unscaledViewport.width > 0) {
            currentScale = (containerWidth / unscaledViewport.width) * scale;
          }
        }

        const viewport = page.getViewport({ scale: currentScale, rotation });
        const dpr = window.devicePixelRatio || 1;

        // Set dimensions for high-DPI crisp display
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        const task = page.render(renderContext);
        renderTaskRef.current = task;
        await task.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Erro ao desenhar página no canvas:', err);
        }
      } finally {
        setRendering(false);
      }
    },
    [pdfDoc, scale, rotation, isCompact]
  );

  useEffect(() => {
    if (pdfDoc) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, scale, rotation, renderPage]);

  // Navigation handlers
  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < numPages) {
      setCurrentPage((p) => p + 1);
    }
  };

  const handleZoomIn = () => {
    setScale((s) => Math.min(2.5, +(s + 0.2).toFixed(1)));
  };

  const handleZoomOut = () => {
    setScale((s) => Math.max(0.6, +(s - 0.2).toFixed(1)));
  };

  const handleResetZoom = () => {
    setScale(1.0);
  };

  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360);
  };

  const handleOpenNewTab = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank');
    }
  };

  const handleDownload = () => {
    if (blobUrl) {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName || 'receita-amigurumi.pdf';
      a.click();
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-stone-500 dark:text-stone-400">
        <RefreshCw className="w-8 h-8 animate-spin text-[#C85A32] mb-3" />
        <p className="text-sm font-bold text-stone-700 dark:text-stone-200 font-comfortaa">
          Carregando receita em PDF...
        </p>
        <span className="text-xs text-stone-400 mt-1">Renderizando com alta definição</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-stone-600 dark:text-stone-300">
        <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
        <h4 className="text-sm font-bold text-stone-800 dark:text-stone-100 mb-1">
          Visualização direta protegida pelo navegador
        </h4>
        <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mb-4">
          Navegadores com escudos restritivos (como Brave) podem requerer abrir o PDF em uma aba separada.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenNewTab}
            className="px-4 py-2 rounded-xl bg-[#8C5E47] hover:bg-[#724A36] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Abrir PDF em Nova Aba</span>
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Arquivo</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-[#24211E] overflow-hidden select-none">
      {/* Top Floating Controls Bar */}
      <div className="px-3 py-2 bg-[#1C1A18] border-b border-stone-800 flex items-center justify-between gap-2 text-stone-200 shrink-0 flex-wrap">
        {/* Left: Page Navigation */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentPage <= 1 || rendering}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-40 transition-colors cursor-pointer text-stone-200"
            title="Página Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-stone-900 border border-stone-700 text-xs font-mono">
            <span className="font-bold text-amber-400">{currentPage}</span>
            <span className="text-stone-500">/</span>
            <span className="text-stone-400">{numPages}</span>
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentPage >= numPages || rendering}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-40 transition-colors cursor-pointer text-stone-200"
            title="Próxima Página"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Zoom and Rotate */}
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 transition-colors cursor-pointer text-stone-300"
            title="Diminuir Zoom"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleResetZoom}
            className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-[11px] font-mono text-stone-300 cursor-pointer"
            title="Zoom 100%"
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 transition-colors cursor-pointer text-stone-300"
            title="Aumentar Zoom"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleRotate}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 transition-colors cursor-pointer text-stone-300 ml-1"
            title="Girar Página (90°)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setShowRuler(!showRuler)}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ml-1 ${
              showRuler
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
            }`}
            title="Ativar marcador de linha para acompanhar a leitura da receita"
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Marca-texto</span>
          </button>
        </div>

        {/* Right: Open in new tab & Download */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={handleOpenNewTab}
            className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title="Abrir PDF em nova aba do navegador"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Nova Aba</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white transition-colors cursor-pointer"
            title="Baixar PDF no dispositivo"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas Viewport (Scrollable with zoom) */}
      <div className="flex-1 overflow-auto p-4 flex items-start justify-center bg-[#292622]">
        <div
          className="relative shadow-2xl rounded-lg overflow-hidden border border-stone-700/60 bg-white"
          onClick={(e) => {
            if (showRuler) {
              const rect = e.currentTarget.getBoundingClientRect();
              setRulerTop(Math.max(0, e.clientY - rect.top - 16));
            }
          }}
        >
          <canvas ref={canvasRef} className="block max-w-none" />

          {/* Movable pattern line highlighter */}
          {showRuler && (
            <div
              style={{ top: `${rulerTop}px` }}
              className="absolute inset-x-0 h-8 bg-yellow-400/35 border-y-2 border-yellow-500 z-10 flex items-center justify-between px-2 select-none shadow-xs pointer-events-none transition-all duration-75"
            >
              <span className="text-[10px] font-extrabold text-amber-950 bg-amber-300/95 px-1.5 py-0.5 rounded shadow-2xs">
                📍 Linha da receita (clique no PDF para posicionar)
              </span>
            </div>
          )}

          {rendering && (
            <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1.5 pointer-events-none">
              <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
              <span>Atualizando...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
