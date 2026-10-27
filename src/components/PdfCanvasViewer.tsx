import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  ZoomIn,
  ZoomOut,
  ExternalLink,
  Download,
  RefreshCw,
  AlertCircle,
  RotateCw,
  Highlighter,
  ChevronDown,
  Layers,
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

interface SinglePageCanvasProps {
  pdfDoc: any;
  pageNum: number;
  scale: number;
  rotation: number;
  isCompact: boolean;
  containerWidth: number;
  showRuler: boolean;
  onPageVisible?: (pageNum: number) => void;
}

// Single Page Canvas with lazy rendering via IntersectionObserver
const SinglePageCanvas: React.FC<SinglePageCanvasProps> = ({
  pdfDoc,
  pageNum,
  scale,
  rotation,
  isCompact,
  containerWidth,
  showRuler,
  onPageVisible,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<any>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [rulerTop, setRulerTop] = useState<number | null>(null);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number }>({
    width: 320,
    height: 450,
  });

  // Observe visibility in scroll container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsVisible(true);
          onPageVisible?.(pageNum);
        } else {
          // Keep rendered once loaded, but track current page
        }
      },
      {
        root: null,
        rootMargin: '500px 0px', // Pre-render 500px before entering viewport
        threshold: 0.1,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [pageNum, onPageVisible]);

  // Render the page onto the canvas
  useEffect(() => {
    let isCancelled = false;

    async function render() {
      if (!pdfDoc || !canvasRef.current || !isVisible) return;

      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }

      try {
        setIsRendering(true);
        const page = await pdfDoc.getPage(pageNum);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Auto-fit page width to container
        let currentScale = scale;
        const unscaledViewport = page.getViewport({ scale: 1.0, rotation });

        if (containerWidth > 120 && unscaledViewport.width > 0) {
          // In compact/split/mobile, fit page width with padding
          const availableWidth = Math.max(280, containerWidth - (isCompact ? 16 : 32));
          const fitRatio = availableWidth / unscaledViewport.width;
          currentScale = fitRatio * scale;
        }

        const viewport = page.getViewport({ scale: currentScale, rotation });
        const dpr = window.devicePixelRatio || 1;

        setPageDimensions({
          width: Math.floor(viewport.width),
          height: Math.floor(viewport.height),
        });

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

        if (!isCancelled) {
          setIsRendered(true);
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn(`Erro ao renderizar página ${pageNum}:`, err);
        }
      } finally {
        if (!isCancelled) {
          setIsRendering(false);
        }
      }
    }

    render();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }
    };
  }, [pdfDoc, pageNum, scale, rotation, isVisible, containerWidth, isCompact]);

  return (
    <div
      ref={containerRef}
      id={`pdf-page-${pageNum}`}
      className="relative flex flex-col items-start my-2 sm:my-3 mx-auto transition-all"
      style={{
        width: pageDimensions.width > 0 ? `${pageDimensions.width}px` : 'auto',
      }}
    >
      {/* Page Header / Number Badge */}
      <div className="w-full flex items-center justify-between px-2 py-1 mb-1 text-[11px] font-mono text-stone-400">
        <span className="font-bold bg-stone-800/80 px-2 py-0.5 rounded-md text-amber-300">
          Pág. {pageNum}
        </span>
      </div>

      {/* Page Canvas Container */}
      <div
        style={{
          width: pageDimensions.width > 0 ? `${pageDimensions.width}px` : 'auto',
          minHeight: `${pageDimensions.height}px`,
        }}
        onClick={(e) => {
          if (showRuler) {
            const rect = e.currentTarget.getBoundingClientRect();
            setRulerTop(Math.max(0, e.clientY - rect.top - 14));
          }
        }}
        className="relative bg-white shadow-xl rounded-lg overflow-hidden border border-stone-700/60 cursor-pointer"
      >
        <canvas ref={canvasRef} className="block" />

        {/* Placeholder skeleton before page renders */}
        {!isRendered && (
          <div
            style={{ width: `${pageDimensions.width}px`, height: `${pageDimensions.height}px` }}
            className="flex flex-col items-center justify-center bg-stone-100 text-stone-400"
          >
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mb-2" />
            <span className="text-xs font-semibold">Carregando página {pageNum}...</span>
          </div>
        )}

        {/* Pattern line reading highlighter on this page */}
        {showRuler && rulerTop !== null && (
          <div
            style={{ top: `${rulerTop}px` }}
            className="absolute inset-x-0 h-8 bg-yellow-400/35 border-y-2 border-yellow-500 z-10 flex items-center justify-between px-2 select-none shadow-xs pointer-events-none transition-all duration-75"
          >
            <span className="text-[10px] font-extrabold text-amber-950 bg-amber-300/95 px-1.5 py-0.5 rounded shadow-2xs">
              📍 Linha da receita (clique para reposicionar)
            </span>
          </div>
        )}

        {/* Small subtle rendering indicator */}
        {isRendering && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono pointer-events-none flex items-center gap-1">
            <RefreshCw className="w-2.5 h-2.5 animate-spin text-amber-400" />
            <span>renderizando</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  blob,
  fileName,
  isCompact = false,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentVisiblePage, setCurrentVisiblePage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string>('');
  const [showRuler, setShowRuler] = useState<boolean>(false);
  const [containerWidth, setContainerWidth] = useState<number>(360);
  const [showPageMenu, setShowPageMenu] = useState<boolean>(false);

  // Generate blob URL for download / open in new tab
  useEffect(() => {
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [blob]);

  // Track container width for responsive auto-fit
  useEffect(() => {
    const updateWidth = () => {
      if (scrollContainerRef.current) {
        setContainerWidth(scrollContainerRef.current.clientWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

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
          setCurrentVisiblePage(1);
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

  // Jump to specific page
  const scrollToPage = (pageNum: number) => {
    const el = document.getElementById(`pdf-page-${pageNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentVisiblePage(pageNum);
      setShowPageMenu(false);
    }
  };

  const handleZoomIn = () => {
    setScale((s) => Math.min(2.5, +(s + 0.15).toFixed(2)));
  };

  const handleZoomOut = () => {
    setScale((s) => Math.max(0.6, +(s - 0.15).toFixed(2)));
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
      <div className="h-full flex flex-col items-center justify-center p-8 text-stone-500 dark:text-stone-400 bg-[#24211E]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#C85A32] mb-3" />
        <p className="text-sm font-bold text-stone-200 font-comfortaa">
          Carregando receita em PDF...
        </p>
        <span className="text-xs text-stone-400 mt-1">Preparando rolagem contínua</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-stone-300 bg-[#24211E]">
        <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
        <h4 className="text-sm font-bold text-stone-100 mb-1">
          Visualização direta protegida pelo navegador
        </h4>
        <p className="text-xs text-stone-400 max-w-sm mb-4">
          Navegadores com escudos restritivos podem requerer abrir o PDF em uma aba separada.
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
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Arquivo</span>
          </button>
        </div>
      </div>
    );
  }

  // Generate page numbers array [1, 2, 3, ... numPages]
  const pageNumbers = Array.from({ length: numPages }, (_, i) => i + 1);

  return (
    <div className="h-full flex flex-col bg-[#24211E] overflow-hidden select-none relative">
      {/* Continuous Scroll Floating Controls Bar */}
      <div className="px-3 py-2 bg-[#1C1A18] border-b border-stone-800 flex items-center justify-between gap-2 text-stone-200 shrink-0 z-20">
        {/* Left: Continuous Scroll Page Indicator & Quick Jump */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPageMenu(!showPageMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-xs font-mono text-stone-200 cursor-pointer transition-colors shadow-2xs"
            title="Clique para ir direto para outra página"
          >
            <span className="font-bold text-amber-400">Pág. {currentVisiblePage}</span>
            <span className="text-stone-500">/</span>
            <span className="text-stone-400">{numPages}</span>
            <ChevronDown className="w-3 h-3 text-stone-400" />
          </button>

          {/* Quick Page Jump Dropdown */}
          {showPageMenu && (
            <div className="absolute top-full left-0 mt-1 w-40 max-h-60 overflow-y-auto bg-stone-900 border border-stone-700 rounded-xl shadow-2xl p-1 z-30 space-y-0.5">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-800">
                Pular para:
              </div>
              {pageNumbers.map((p) => (
                <button
                  key={p}
                  onClick={() => scrollToPage(p)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between cursor-pointer ${
                    p === currentVisiblePage
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  <span>Página {p}</span>
                  {p === currentVisiblePage && <span className="text-[10px]">●</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center: Zoom, Rotate & Highlighter */}
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
            title="Redefinir Zoom para 100%"
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
            title="Girar todas as páginas (90°)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setShowRuler(!showRuler)}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ml-1 ${
              showRuler
                ? 'bg-amber-500 text-stone-950 shadow-xs'
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

      {/* CONTINUOUS VERTICAL SCROLL VIEWPORT: All pages stacked vertically with full horizontal pan */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-auto p-2 sm:p-4 bg-[#292622] touch-pan-x touch-pan-y"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >
        <div className="flex flex-col items-center min-h-full min-w-full w-max mx-auto pb-24">
          {pageNumbers.map((p) => (
            <SinglePageCanvas
              key={`${p}-${rotation}`}
              pdfDoc={pdfDoc}
              pageNum={p}
              scale={scale}
              rotation={rotation}
              isCompact={isCompact}
              containerWidth={containerWidth}
              showRuler={showRuler}
              onPageVisible={(visiblePage) => setCurrentVisiblePage(visiblePage)}
            />
          ))}

          {/* End of pattern indicator */}
          <div className="py-6 text-center text-xs text-stone-500 flex items-center gap-2">
            <span>🧶</span>
            <span>Fim da receita em PDF</span>
            <span>🧶</span>
          </div>
        </div>
      </div>
    </div>
  );
};
