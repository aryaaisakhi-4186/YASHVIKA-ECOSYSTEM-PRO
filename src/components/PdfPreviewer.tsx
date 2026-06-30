import React, { useEffect, useRef, useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCw, 
  AlertTriangle,
  Eye,
  FileText
} from "lucide-react";

interface PdfPreviewerProps {
  file: File;
  fileUrl: string | null;
}

export default function PdfPreviewer({ file, fileUrl }: PdfPreviewerProps) {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [libLoaded, setLibLoaded] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  // 1. Load PDF.js dynamically from CDN
  useEffect(() => {
    const scriptId = "pdfjs-cdn-script";
    const existingScript = document.getElementById(scriptId);

    const initPdfJs = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
        setLibLoaded(true);
      } else {
        setError("PDF library failed to initialize.");
        setIsLoading(false);
      }
    };

    if (existingScript && (window as any).pdfjsLib) {
      initPdfJs();
      return;
    }

    if (!existingScript) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
      script.async = true;
      script.onload = () => {
        // Give a tiny timeout to ensure global state is fully bound
        setTimeout(initPdfJs, 100);
      };
      script.onerror = () => {
        setError("Failed to load PDF viewer engine from CDN.");
        setIsLoading(false);
      };
      document.body.appendChild(script);
    }
  }, []);

  // 2. Read PDF file and parse document
  useEffect(() => {
    if (!libLoaded || !file) return;

    setIsLoading(true);
    setError(null);
    setPdfDoc(null);
    setPageNum(1);

    const pdfjsLib = (window as any).pdfjsLib;
    const fileReader = new FileReader();

    fileReader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
        const loadingTask = pdfjsLib.getDocument({ data: typedArray });
        
        loadingTask.promise.then(
          (pdf: any) => {
            setPdfDoc(pdf);
            setTotalPages(pdf.numPages);
            setIsLoading(false);
          },
          (err: any) => {
            console.error("Error loading PDF: ", err);
            setError("PDF could not be loaded. Please ensure it is a valid PDF document.");
            setIsLoading(false);
          }
        );
      } catch (err: any) {
        console.error("Error parsing file buffer: ", err);
        setError("Failed to parse file content.");
        setIsLoading(false);
      }
    };

    fileReader.onerror = () => {
      setError("Failed to read PDF file.");
      setIsLoading(false);
    };

    fileReader.readAsArrayBuffer(file);
  }, [file, libLoaded]);

  // 3. Render current page on canvas
  const renderPage = async () => {
    if (!pdfDoc || !canvasRef.current || !containerRef.current) return;

    try {
      // Cancel any ongoing rendering task to prevent overlaps/flicker
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;

      // Calculate container width for autoscale/fit
      const containerWidth = containerRef.current.clientWidth || 450;
      const unscaledViewport = page.getViewport({ scale: 1.0 });
      
      // Target viewport width with margins
      const padding = 24;
      const targetWidth = Math.max(containerWidth - padding, 200);
      const fitScale = targetWidth / unscaledViewport.width;
      
      const viewport = page.getViewport({ scale: fitScale * scale });

      // Handle high-resolution screens (Retina)
      const dpr = window.devicePixelRatio || 1;
      canvas.width = viewport.width * dpr;
      canvas.height = viewport.height * dpr;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      context.scale(dpr, dpr);

      // Render PDF page into canvas context
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;

      await renderTask.promise;
      renderTaskRef.current = null;
    } catch (err: any) {
      if (err.name === "RenderingCancelledException" || err.message?.includes("cancelled")) {
        // Graceful skip - triggered by rapid page switching or zoom updates
        return;
      }
      console.error("Error rendering PDF page: ", err);
    }
  };

  // Trigger page render when page, scale, or document updates
  useEffect(() => {
    renderPage();
  }, [pdfDoc, pageNum, scale]);

  // Auto-resize handler to make it responsive
  useEffect(() => {
    const handleResize = () => {
      renderPage();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [pdfDoc, pageNum, scale]);

  const changePage = (offset: number) => {
    setPageNum((prev) => {
      const next = prev + offset;
      return next >= 1 && next <= totalPages ? next : prev;
    });
  };

  const handleZoom = (factor: number) => {
    setScale((prev) => {
      const next = prev * factor;
      return next >= 0.5 && next <= 3.0 ? next : prev;
    });
  };

  const handleResetZoom = () => {
    setScale(1.0);
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col h-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
      
      {/* Dynamic Header Controls */}
      {pdfDoc && !isLoading && !error && (
        <div className="bg-slate-900 text-slate-100 px-3 py-2 flex items-center justify-between border-b border-slate-800 shrink-0 text-xs">
          
          {/* Navigation Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => changePage(-1)}
              disabled={pageNum <= 1}
              className="p-1 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent rounded-lg text-slate-300 transition-all cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-mono font-bold px-1 select-none">
              {pageNum} / {totalPages}
            </span>
            <button
              onClick={() => changePage(1)}
              disabled={pageNum >= totalPages}
              className="p-1 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent rounded-lg text-slate-300 transition-all cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleZoom(0.85)}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-300 transition-all cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="font-mono text-[10px] bg-slate-800 px-2 py-0.5 rounded-md select-none">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => handleZoom(1.15)}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-300 transition-all cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <div className="w-[1px] h-3 bg-slate-800 mx-1"></div>
            <button
              onClick={handleResetZoom}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-300 transition-all cursor-pointer"
              title="Reset Zoom"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Canvas Scroll Area */}
      <div className="flex-1 overflow-auto p-4 flex justify-center items-start min-h-[380px] max-h-[480px] bg-slate-50 relative">
        
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/90 z-10 gap-3 text-center p-4">
            <RotateCw className="h-6 w-6 text-amber-500 animate-spin" />
            <div>
              <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Generating PDF Viewport</p>
              <p className="text-[10px] text-slate-400 mt-1">Reading pages securely client-side...</p>
            </div>
          </div>
        )}

        {/* Error Fallback Panel */}
        {error && (
          <div className="w-full max-w-sm m-auto p-5 bg-white border border-red-150 rounded-2xl shadow-xs text-center space-y-3.5">
            <div className="h-11 w-11 rounded-full bg-red-50 flex items-center justify-center mx-auto text-red-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Rendering Blocked</h4>
              <p className="text-[10px] text-red-600 leading-relaxed">{error}</p>
            </div>
            
            <div className="p-2.5 bg-slate-50 rounded-xl text-[9px] text-slate-500 font-mono text-left space-y-0.5 border border-slate-100">
              <p className="truncate"><span className="font-bold text-slate-700">File:</span> {file.name}</p>
              <p><span className="font-bold text-slate-700">Size:</span> {(file.size / 1024).toFixed(1)} KB</p>
            </div>

            {fileUrl && (
              <a 
                href={fileUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm items-center justify-center gap-1.5"
              >
                <Eye className="h-3.5 w-3.5" />
                Open PDF in new tab 🌐
              </a>
            )}
          </div>
        )}

        {/* The PDF Canvas */}
        <div className={`transition-all duration-150 ${isLoading || error ? "hidden" : "block"}`}>
          <div className="bg-white p-1 rounded-lg shadow-md border border-slate-200">
            <canvas ref={canvasRef} className="block mx-auto bg-white rounded" />
          </div>
        </div>

      </div>

      {/* Page Footer Tip */}
      {pdfDoc && !isLoading && !error && (
        <div className="bg-slate-50 px-3 py-1.5 border-t border-slate-150 flex items-center justify-between shrink-0 text-[10px] text-slate-400 font-medium">
          <span>📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
          <span className="text-amber-600 font-semibold">Ready for Scan ⚡</span>
        </div>
      )}
    </div>
  );
}
