import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";

// --- 1. Import pdfjs from react-pdf ---
import { pdfjs } from 'react-pdf';

// --- 2. Configure the worker globally ---
// This uses the unpkg CDN to load the worker file matching your installed version.
// This resolves the "missing worker" or "version mismatch" errors.
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AppWrapper>
          <AuthProvider>
            <App />
          </AuthProvider>
        </AppWrapper>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);