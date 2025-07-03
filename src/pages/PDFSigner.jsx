import React, { useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import SignaturePad from "signature_pad";
import axios from "axios";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "./pdfStyles.css";
import { FaSpinner } from 'react-icons/fa';
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";

const steps = ["Upload PDF", "Preview & Sign", "Download"];

export default function PDFSigner() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfFileObj, setPdfFileObj] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [step, setStep] = useState(0);
  const [signatureURL, setSignatureURL] = useState(null);
  const [signaturePos, setSignaturePos] = useState(null); // { x, y, page }
  const [signatureSize, setSignatureSize] = useState({ width: 120, height: 40 });
  const [pdfPageDims, setPdfPageDims] = useState({ width: 1, height: 1 }); // actual PDF page size in px
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [signedPdfUrl, setSignedPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pdfLoadError, setPdfLoadError] = useState(null);
  const sigCanvasRef = useRef(null);
  const sigPadInstance = useRef(null);
  const pdfWrapperRef = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== "application/pdf") {
      setError("Please select a valid PDF file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError("PDF file is too large (max 10MB). Try a smaller file.");
      return;
    }
    setPdfFileObj(file);
    setPdfFile(file); // Pass File object directly to <Document />
    setStep(1);
    setPdfLoadError(null);
    setError(null);
  };

  const handlePdfLoadError = (err) => {
    setPdfLoadError("Failed to load PDF file. Please try another file.");
  };

  const handleSignature = () => {
    if (sigPadInstance.current && !sigPadInstance.current.isEmpty()) {
      const url = sigPadInstance.current.toDataURL("image/png");
    setSignatureURL(url);
    } else {
      setError("Please draw your signature before previewing.");
    }
  };

  // Place signature on click (initial placement)
  const handlePdfClick = (e) => {
    if (!signatureURL) return;
    const rect = pdfWrapperRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - signatureSize.width / 2;
    // Fix Y calculation: allow dragging to the very bottom
    const y = rect.height - (e.clientY - rect.top) - signatureSize.height / 2;
    setSignaturePos({ x, y, page: pageNumber });
  };

  // PDF page onLoadSuccess: get actual PDF page size in px
  const handlePageLoadSuccess = (page) => {
    // page.width and page.height are in px at 72dpi (PDF points)
    setPdfPageDims({ width: page.width, height: page.height });
  };

  // Drag handlers
  const handleDragStart = (e) => {
    e.stopPropagation();
    setDragging(true);
    const rect = pdfWrapperRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - (rect.left + (signaturePos?.x ?? 0)),
      y: e.clientY - (rect.bottom - (signaturePos?.y ?? 0) - signatureSize.height),
    });
  };
  const handleDrag = (e) => {
    if (!dragging || !signaturePos) return;
    const rect = pdfWrapperRef.current.getBoundingClientRect();
    let x = e.clientX - rect.left - dragOffset.x;
    // Fix Y calculation: allow dragging to the very bottom
    let y = rect.height - (e.clientY - rect.top) - dragOffset.y - signatureSize.height / 2;
    // Clamp to bounds
    x = Math.max(0, Math.min(x, pdfWrapperRef.current.offsetWidth - signatureSize.width));
    y = Math.max(0, Math.min(y, pdfWrapperRef.current.offsetHeight - signatureSize.height));
    setSignaturePos({ ...signaturePos, x, y });
  };
  const handleDragEnd = () => setDragging(false);

  // Resize handlers
  const handleResizeStart = (e) => {
    e.stopPropagation();
    setResizing(true);
  };
  const handleResize = (e) => {
    if (!resizing) return;
    let newWidth = signatureSize.width + e.movementX;
    let newHeight = signatureSize.height + e.movementY;
    // Clamp size
    newWidth = Math.max(40, Math.min(newWidth, pdfWrapperRef.current.offsetWidth - (signaturePos?.x ?? 0)));
    newHeight = Math.max(20, Math.min(newHeight, pdfWrapperRef.current.offsetHeight - (signaturePos?.y ?? 0)));
    setSignatureSize({ width: newWidth, height: newHeight });
  };
  const handleResizeEnd = () => setResizing(false);

  // Mouse event listeners for drag/resize
  React.useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleDrag);
      window.addEventListener("mouseup", handleDragEnd);
    } else if (resizing) {
      window.addEventListener("mousemove", handleResize);
      window.addEventListener("mouseup", handleResizeEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleDrag);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("mousemove", handleResize);
      window.removeEventListener("mouseup", handleResizeEnd);
    };
    // eslint-disable-next-line
  }, [dragging, resizing, signaturePos, signatureSize]);

  const handleSign = async () => {
    if (!pdfFileObj || !signatureURL) {
      setError("Please upload PDF and draw signature.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🚀 Starting PDF signing process...');

      const formData = new FormData();
      formData.append("pdf", pdfFileObj);

      // --- Calculate scale between preview and actual PDF page ---
      const previewRect = pdfWrapperRef.current?.getBoundingClientRect();
      const previewWidth = previewRect?.width || 1;
      const previewHeight = previewRect?.height || 1;
      const pdfWidth = pdfPageDims.width || 1;
      const pdfHeight = pdfPageDims.height || 1;
      const scaleX = pdfWidth / previewWidth;
      const scaleY = pdfHeight / previewHeight;

      // --- Map overlay position and size to PDF coordinates ---
      let pos = signaturePos || { x: 50, y: 50, page: 1 };
      const overlayW = signatureSize.width || 1;
      const overlayH = signatureSize.height || 1;
      const mappedX = Math.round((pos.x || 0) * scaleX);
      const mappedY = Math.round((pos.y || 0) * scaleY);
      const mappedWidth = Math.round(overlayW * scaleX);
      const mappedHeight = Math.round(overlayH * scaleY);

      // --- Use original signature pad canvas for best quality, scale down if needed ---
      // Signature pad is always high-res (e.g. 1020x360)
      const sigPadCanvas = sigCanvasRef.current;
      const sigPadW = sigPadCanvas.width;
      const sigPadH = sigPadCanvas.height;

      // Calculate scale to fit mappedWidth/mappedHeight, but never upscale
      const scaleDown = Math.min(mappedWidth / sigPadW, mappedHeight / sigPadH, 1);
      const exportW = Math.round(sigPadW * scaleDown);
      const exportH = Math.round(sigPadH * scaleDown);

      // Draw signature at best quality, scale down if needed
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = exportW;
      exportCanvas.height = exportH;
      const exportCtx = exportCanvas.getContext('2d');
      exportCtx.clearRect(0, 0, exportW, exportH);
      exportCtx.drawImage(sigPadCanvas, 0, 0, sigPadW, sigPadH, 0, 0, exportW, exportH);
      const exportDataUrl = exportCanvas.toDataURL('image/png');
      const exportBlob = await (await fetch(exportDataUrl)).blob();
      formData.append("signature", exportBlob, "signature.png");

      formData.append("x", mappedX);
      formData.append("y", mappedY);
      formData.append("page", pos.page);
      formData.append("width", exportW); // send width and height for backend to use
      formData.append("height", exportH);

      console.log('📍 Sending mapped position/size:', { x: mappedX, y: mappedY, width: exportW, height: exportH, page: pos.page });

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      console.log('📤 Sending request to backend...');
      const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await axios.post(`${baseURL}/api/pdf/sign`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        responseType: "blob",
        timeout: 30000, // 30 second timeout
      });

      console.log('📥 Response received:', response.status, response.headers);

      if (response.status !== 200 || !response.data) {
        throw new Error("Server returned an invalid response.");
      }

      // Check if response is actually a PDF
      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.includes('application/pdf')) {
        // Try to read error message from response
        const text = await new Response(response.data).text();
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || "Server returned an error");
        } catch {
          throw new Error("Server returned an invalid response format");
        }
      }

      console.log('✅ Creating download URL...');
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      setSignedPdfUrl(url);
      setStep(2);

      console.log('🎉 PDF signing completed successfully!');

    } catch (err) {
      console.error('❌ Sign error:', err);

      let errorMessage = "Failed to sign PDF. ";

      if (err.code === 'ECONNABORTED') {
        errorMessage += "Request timed out. Please try again.";
      } else if (err.response) {
        // Server responded with error status
        const status = err.response.status;
        if (status === 401) {
          errorMessage += "Authentication failed. Please login again.";
        } else if (status === 400) {
          try {
            const errorText = await new Response(err.response.data).text();
            const errorData = JSON.parse(errorText);
            errorMessage += errorData.message || "Invalid request data.";
          } catch {
            errorMessage += "Invalid request data.";
          }
        } else if (status === 413) {
          errorMessage += "File too large. Please use a smaller PDF.";
        } else if (status >= 500) {
          errorMessage += "Server error. Please try again later.";
        } else {
          errorMessage += `Server error (${status}).`;
        }
      } else if (err.request) {
        // Network error
        errorMessage += "Network error. Please check your connection.";
      } else {
        // Other error
        errorMessage += err.message || "Unknown error occurred.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (signedPdfUrl) {
      const link = document.createElement("a");
      link.href = signedPdfUrl;
      link.download = "signed.pdf";
      link.click();
    }
  };

  // Initialize signature pad after render and resize canvas to match display size (high DPI for crisp signature)
  React.useEffect(() => {
    if (sigCanvasRef.current) {
      const canvas = sigCanvasRef.current;
      // Use a fixed high DPI for signature pad (e.g., 3x display size)
      const dpr = 3;
      const displayWidth = 340;
      const displayHeight = 120;
      canvas.style.width = displayWidth + "px";
      canvas.style.height = displayHeight + "px";
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      const ctx = canvas.getContext("2d");
      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
      ctx.scale(dpr, dpr);
      sigPadInstance.current = new SignaturePad(canvas, {
        penColor: "black",
        backgroundColor: "white"
      });
    }
    return () => {
      if (sigPadInstance.current) sigPadInstance.current.off();
    };
  }, [step]);

  const handleClear = () => {
    if (sigPadInstance.current) {
      sigPadInstance.current.clear();
      setSignatureURL(null);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-indigo-950 via-slate-950 to-gray-950 text-[var(--color-text-main)] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar pageTitle="Sign PDF" />
        <main className="flex-1 flex flex-col items-center justify-center relative overflow-x-hidden">
          {/* Modern background shapes */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-[-8%] left-[-8%] w-[320px] h-[320px] bg-indigo-600 opacity-30 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute bottom-[-8%] right-[-8%] w-[400px] h-[400px] bg-pink-600 opacity-10 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute top-1/2 left-1/2 w-[220px] h-[220px] bg-blue-500 opacity-10 rounded-full blur-2xl animate-pulse-slow" />
          </div>
          <div className="relative z-10 w-full max-w-5xl px-2 md:px-0 flex flex-col items-center animate-fadeIn" style={{margin: '40px auto'}}>
            {/* Stepper */}
            <div className="flex justify-center mb-10 w-full gap-4">
              {steps.map((label, idx) => (
                <div key={label} className="flex flex-col items-center flex-1 min-w-[90px]">
                  <div className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg transition-all duration-300 border-2 ${step === idx ? "bg-indigo-600 text-white border-indigo-400 shadow-lg scale-110" : "bg-white/10 text-indigo-200 border-indigo-900"}`}>{idx + 1}</div>
                  <span className={`mt-2 text-xs font-semibold tracking-wide ${step === idx ? "text-indigo-200" : "text-indigo-400/60"}`}>{label}</span>
                  {idx < steps.length - 1 && <div className="w-full h-1 bg-gradient-to-r from-indigo-400/30 to-indigo-900/10 my-2 rounded" />}
                </div>
              ))}
            </div>
            {/* Step 1: Upload PDF */}
            {step === 0 && (
              <div className="flex flex-col items-center w-full animate-fadeIn">
                <div className="w-full max-w-md bg-white/5 border border-indigo-900/40 rounded-2xl shadow-xl p-10 flex flex-col items-center">
                  <h1 className="text-3xl font-extrabold mb-4 text-center text-indigo-200 tracking-tight">🖊️ PDF Signer</h1>
                  <p className="text-indigo-300/80 mb-6 text-center text-base">Easily sign your PDF documents in seconds.</p>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-400/40 p-8 rounded-xl bg-white/10 hover:bg-white/20 transition duration-300 cursor-pointer w-full">
                    <span className="text-lg text-indigo-200 mb-2 font-semibold">Select a PDF file</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <span className="text-gray-300 text-sm mt-2">Drag & drop or click to upload</span>
                  </label>
                  {error && <div className="text-red-400 mt-4 text-center text-sm font-medium bg-red-900/20 px-4 py-2 rounded-lg w-full">{error}</div>}
                </div>
              </div>
            )}
            {/* Step 2: Preview & Sign (Side by Side) */}
            {step === 1 && pdfFile && (
              <div className="w-full flex flex-col md:flex-row gap-8 items-start justify-center animate-fadeIn">
                {/* Left: Signature Pad Card */}
                <section className="flex-1 bg-white/5 border border-indigo-900/40 rounded-2xl shadow-xl p-8 flex flex-col items-center min-w-[320px] max-w-[400px] w-full">
                  <h2 className="text-xl font-bold text-indigo-200 mb-4 w-full text-center">Draw Your Signature</h2>
                  <canvas
                    ref={sigCanvasRef}
                    width={340}
                    height={120}
                    className="bg-white rounded-lg shadow border border-indigo-100/30 mb-4"
                    style={{ touchAction: "none", width: '100%', maxWidth: 340, height: 120, maxHeight: 140 }}
                  />
                  {signatureURL && (
                    <div className="flex flex-col items-center animate-fadeIn mb-2 w-full mt-1">
                      <span className="text-indigo-200 font-semibold mb-1 text-sm">Signature Preview</span>
                      <img src={signatureURL} alt="Signature Preview" className="w-full max-w-[280px] h-20 object-contain bg-white rounded-lg shadow border border-indigo-100/30" />
                    </div>
                  )}
                  <div className="flex flex-row gap-2 w-full mt-3">
                    <button
                      onClick={handleClear}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-base shadow transition"
                      title="Clear signature"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleSignature}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-base shadow transition"
                      title="Preview signature"
                    >
                      Preview
                    </button>
                  </div>
                  <button
                    onClick={handleSign}
                    className="w-full mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg transition flex items-center justify-center gap-2"
                    title="Sign PDF"
                    disabled={loading || !signatureURL}
                  >
                    {loading ? (<><FaSpinner className="animate-spin" /> Signing...</>) : "Sign & Download"}
                  </button>
                  {pdfLoadError && signatureURL && (
                    <div className="mt-2 text-yellow-400 text-xs text-center">Signature will be placed at a default position (bottom left) since preview is unavailable.</div>
                  )}
                  {error && <div className="text-red-400 mt-3 text-center text-sm font-medium bg-red-900/20 px-4 py-2 rounded-lg w-full">{error}</div>}
                </section>
                {/* Right: PDF Preview Card */}
                <section className="flex-[2] bg-white/5 border border-indigo-900/40 rounded-2xl shadow-xl p-6 flex flex-col items-center min-h-[400px] md:min-h-[500px] w-full max-w-3xl relative">
                  <div
                    ref={pdfWrapperRef}
                    style={{
                      position: "relative",
                      width: "100%",
                      minHeight: 320,
                      // Remove maxHeight and overflowY to allow full page display
                      cursor: signatureURL ? (signaturePos ? "default" : "crosshair") : "default",
                      background: "#181f2a",
                      borderRadius: 14,
                      marginBottom: 12,
                      boxSizing: 'border-box',
                      boxShadow: '0 2px 16px #0001',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onClick={e => {
                      // Only allow placing signature if not already placed and PDF is loaded
                      if (!signaturePos && !pdfLoadError && signatureURL) handlePdfClick(e);
                    }}
                  >
                    <Document
                      file={pdfFile}
                      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                      onLoadError={handlePdfLoadError}
                      className="w-full flex flex-col items-center"
                    >
                      <Page pageNumber={pageNumber} width={500} onLoadSuccess={handlePageLoadSuccess} />
                    </Document>
                    {/* Show signature overlay if signatureURL exists, even if not placed yet */}
                    {signatureURL && (!signaturePos || (signaturePos && signaturePos.page === pageNumber && !pdfLoadError)) && (
                      <div
                        style={{
                          position: "absolute",
                          left: signaturePos ? Math.max(0, Math.min(signaturePos.x, pdfWrapperRef.current?.offsetWidth - signatureSize.width)) : "50%",
                          bottom: signaturePos ? Math.max(0, Math.min(signaturePos.y, pdfWrapperRef.current?.offsetHeight - signatureSize.height)) : 40,
                          width: signatureSize.width,
                          height: signatureSize.height,
                          cursor: signaturePos ? (dragging ? "grabbing" : "grab") : "crosshair",
                          opacity: 0.98,
                          zIndex: 100,
                          transform: signaturePos ? undefined : "translateX(-50%)",
                          pointerEvents: signaturePos ? "auto" : "none",
                          boxShadow: dragging || resizing ? "0 0 0 3px #6366f1, 0 2px 16px #0003" : "0 2px 8px #0002",
                          border: dragging || resizing ? "2px solid #6366f1" : "2px solid #6366f1aa",
                          borderRadius: 8,
                          background: dragging || resizing ? "#fff8" : "#fff6",
                          transition: 'box-shadow 0.2s, border 0.2s, background 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onMouseDown={signaturePos ? handleDragStart : undefined}
                        tabIndex={0}
                        aria-label="Signature overlay. Drag to move, resize from corner."
                      >
                        <img
                          src={signatureURL}
                          alt="Signature Preview"
                          style={{
                            width: "100%",
                            height: "100%",
                            userSelect: "none",
                            pointerEvents: "none",
                            border: "none",
                            borderRadius: 7,
                            boxShadow: "none"
                          }}
                          draggable={false}
                        />
                        {/* Resize handle */}
                        {signaturePos && (
                          <div
                            onMouseDown={handleResizeStart}
                            style={{
                              position: "absolute",
                              right: -10,
                              bottom: -10,
                              width: 24,
                              height: 24,
                              background: dragging || resizing ? "#6366f1" : "#fff",
                              borderRadius: "50%",
                              border: "2px solid #6366f1",
                              cursor: "nwse-resize",
                              zIndex: 200,
                              boxShadow: dragging || resizing ? "0 0 8px #6366f1" : "0 2px 8px #0002",
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="Resize signature"
                          >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M2 14L14 2" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
                              <circle cx="14" cy="2" r="2" fill="#6366f1"/>
                            </svg>
                          </div>
                        )}
                        {/* Close (X) button */}
                        {signaturePos && (
                          <button
                            onClick={e => { e.stopPropagation(); setSignaturePos(null); }}
                            style={{
                              position: "absolute",
                              top: -14,
                              right: -14,
                              width: 28,
                              height: 28,
                              background: "#fff",
                              border: "2px solid #6366f1",
                              borderRadius: "50%",
                              color: "#6366f1",
                              fontWeight: 700,
                              fontSize: 16,
                              cursor: "pointer",
                              zIndex: 300,
                              boxShadow: "0 2px 8px #0002"
                            }}
                            title="Remove signature placement"
                            aria-label="Remove signature placement"
                          >
                            ×
                          </button>
                        )}
                        {/* Helper text */}
                        {signaturePos && !dragging && !resizing && (
                          <div
                            style={{
                              position: "absolute",
                              bottom: -28,
                              left: "50%",
                              transform: "translateX(-50%)",
                              background: "#6366f1",
                              color: "#fff",
                              padding: "2px 10px",
                              borderRadius: 5,
                              fontSize: 12,
                              opacity: 0.92,
                              pointerEvents: "none",
                              whiteSpace: "nowrap",
                              zIndex: 250
                            }}
                          >
                            Drag to move, resize from corner
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Floating action bar at the bottom of the card */}
                  <div className="absolute left-0 right-0 bottom-0 flex items-center justify-between gap-4 px-6 py-3 bg-white/10 rounded-b-2xl border-t border-indigo-900/20 shadow-lg" style={{ zIndex: 10 }}>
                    <button
                      onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                      disabled={pageNumber === 1}
                      className="px-3 py-1 bg-indigo-600/80 hover:bg-indigo-700 text-white rounded-lg shadow disabled:opacity-40 transition"
                      title="Previous Page"
                    >
                      ◀
                    </button>
                    <span className="text-indigo-200 font-semibold">Page {pageNumber} of {numPages}</span>
                    <button
                      onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
                      disabled={pageNumber === numPages}
                      className="px-3 py-1 bg-indigo-600/80 hover:bg-indigo-700 text-white rounded-lg shadow disabled:opacity-40 transition"
                      title="Next Page"
                    >
                      ▶
                    </button>
                  </div>
                  {/* Error message below preview */}
                  {pdfLoadError && (
                    <div className="mt-2 w-full text-center">
                      <div className="inline-block bg-red-100 text-red-700 px-4 py-2 rounded shadow">
                        {pdfLoadError}
                      </div>
                      <div className="mt-2 text-yellow-400 text-xs">PDF preview failed to load. Please try another file. Signature placement is disabled.</div>
                    </div>
                  )}
                </section>
              </div>
            )}
            {/* Step 3: Download */}
            {step === 2 && (
              <div className="flex flex-col items-center w-full animate-fadeIn">
                <div className="w-full max-w-md bg-white/5 border border-indigo-900/40 rounded-2xl shadow-xl p-10 flex flex-col items-center">
                  <h2 className="text-2xl font-bold text-green-300 mb-2">🎉 Signed!</h2>
                  <p className="text-indigo-200 mb-6 text-center max-w-md">Your signature has been applied. Download your signed PDF below.</p>
                  <button
                    onClick={handleDownload}
                    className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg shadow-lg transition mb-4"
                    title="Download Signed PDF"
                    disabled={!signedPdfUrl}
                  >
                    ⬇️ Download Signed PDF
                  </button>
                  {signedPdfUrl && (
                    <a
                      href={signedPdfUrl}
                      download="signed.pdf"
                      className="text-green-300 underline text-sm mb-4 hover:text-green-400"
                      style={{ wordBreak: 'break-all' }}
                    >
                      Or click here if the button does not work
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setStep(0);
                      setPdfFile(null);
                      setPdfFileObj(null);
                      setSignatureURL(null);
                      setSignaturePos(null);
                      setSignedPdfUrl(null);
                      setError(null);
                      setPdfLoadError(null);
                      if (sigCanvasRef.current) sigCanvasRef.current.clear();
                    }}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow transition mt-2"
                    title="Start Over"
                  >
                    Start Over
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="flex flex-col items-center">
            <FaSpinner className="animate-spin text-4xl text-indigo-300 mb-4" />
            <span className="text-white text-lg font-semibold">Processing, please wait...</span>
          </div>
        </div>
      )}
      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: none; }
        }
        .animate-fadeIn { animation: fadeIn 0.7s cubic-bezier(.4,0,.2,1) both; }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.25; }
        }
        .animate-pulse-slow { animation: pulse-slow 6s infinite alternate; }
        /* Custom scrollbar for PDF preview */
        .pdf-preview-scroll::-webkit-scrollbar {
          width: 8px;
          background: #181f2a;
        }
        .pdf-preview-scroll::-webkit-scrollbar-thumb {
          background: #6366f1;
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
}
