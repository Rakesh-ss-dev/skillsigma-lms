import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// 1. Configure Worker
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
        // Root: set h-full/w-full to fill the parent container defined in your CoursePlayer
        <div className="flex flex-col h-full w-full bg-gray-100 dark:bg-gray-800">

            {/* Toolbar: shrink-0 ensures it doesn't collapse, z-10 keeps it above scroll content */}
            <div className="shrink-0 flex items-center justify-center gap-4 p-2 bg-white dark:bg-gray-900 shadow-sm z-10 border-b">
                <button
                    disabled={pageNumber <= 1}
                    onClick={() => setPageNumber(prev => prev - 1)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30 dark:text-white"
                >
                    <ChevronLeft />
                </button>

                <span className="text-sm font-medium dark:text-white">
                    Page {pageNumber} of {numPages || '--'}
                </span>

                <button
                    disabled={pageNumber >= numPages}
                    onClick={() => setPageNumber(prev => prev + 1)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30 dark:text-white"
                >
                    <ChevronRight />
                </button>

                <div className="h-4 w-px bg-gray-300 mx-2"></div>

                <button className="dark:text-white" onClick={() => setScale(s => Math.max(0.5, s - 0.1))}>
                    <ZoomOut size={18} />
                </button>
                <span className="text-xs w-8 text-center dark:text-white">{Math.round(scale * 100)}%</span>
                <button className="dark:text-white" onClick={() => setScale(s => Math.min(2.0, s + 0.1))}>
                    <ZoomIn size={18} />
                </button>
            </div>

            {/* Scroll Container: flex-1 takes remaining height, overflow-auto adds scrollbars */}
            <div className="flex-1 overflow-auto w-full flex justify-center p-8 bg-gray-200/50 dark:bg-gray-800">
                <div className="shadow-lg h-fit"> {/* h-fit ensures the border wraps the PDF exactly */}
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
                                Failed to load PDF.
                            </div>
                        }
                    >
                        <Page
                            pageNumber={pageNumber}
                            scale={scale}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                            className="bg-white" // Ensures the page background is white
                        />
                    </Document>
                </div>
            </div>
        </div>
    );
};

export default PDFViewer;