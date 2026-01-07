import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

// crucial: css for text layer and annotation layer to align correctly
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// 1. Configure Worker (Standard for Vite/Webpack 5+)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDFViewer = ({ pdfUrl }: any) => {
    const [numPages, setNumPages] = useState(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);

    function onDocumentLoadSuccess({ numPages }: any) {
        setNumPages(numPages);
        setPageNumber(1);
    }

    return (
        <div className="flex flex-col items-center bg-gray-100 dark:bg-gray-800 p-4 min-h-[500px]">
            {/* Toolbar */}
            <div className="flex items-center gap-4 mb-4 bg-white p-2 rounded shadow-sm">
                <button
                    disabled={pageNumber <= 1}
                    onClick={() => setPageNumber(prev => prev - 1)}
                    className="p-1 hover:bg-gray-100 disabled:opacity-30"
                >
                    <ChevronLeft />
                </button>

                <span className="text-sm font-medium">
                    Page {pageNumber} of {numPages || '--'}
                </span>

                <button
                    disabled={pageNumber >= numPages}
                    onClick={() => setPageNumber(prev => prev + 1)}
                    className="p-1 hover:bg-gray-100 disabled:opacity-30"
                >
                    <ChevronRight />
                </button>

                <div className="h-4 w-px bg-gray-300 mx-2"></div>

                <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))}><ZoomOut size={18} /></button>
                <span className="text-xs w-8 text-center">{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale(s => Math.min(2.0, s + 0.1))}><ZoomIn size={18} /></button>
            </div>

            {/* Document Wrapper */}
            <div className="border shadow-lg">
                <Document
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={(error) => console.error("Error loading PDF:", error)}
                    loading={
                        <div className="h-96 w-64 flex items-center justify-center bg-white text-gray-400">
                            Loading PDF...
                        </div>
                    }
                    error={
                        <div className="h-64 w-full flex items-center justify-center bg-red-50 text-red-500 p-4">
                            Failed to load PDF. Please check your connection.
                        </div>
                    }
                >
                    <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                    />
                </Document>
            </div>
        </div>
    );
};

export default PDFViewer;