// src/components/SignaturePlacer.jsx
import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";

// Required for pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function SignaturePlacer({ pdfUrl, signature }) {
  const [numPages, setNumPages] = useState(null);
  const [positions, setPositions] = useState([]);
  const containerRef = useRef();

  const handlePdfLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleClick = (e) => {
    if (!signature) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPositions([...positions, { x, y }]);
  };

  return (
    <div
      className="relative border border-gray-500 rounded p-2 overflow-auto max-h-screen bg-white"
      ref={containerRef}
      onClick={handleClick}
    >
      <Document file={pdfUrl} onLoadSuccess={handlePdfLoadSuccess}>
        {Array.from({ length: numPages }, (_, i) => (
          <Page
            key={`page_${i + 1}`}
            pageNumber={i + 1}
            width={600}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        ))}
      </Document>

      {positions.map((pos, index) => (
        <img
          key={index}
          src={signature}
          alt="Signature"
          className="absolute w-32"
          style={{
            left: pos.x,
            top: pos.y,
          }}
        />
      ))}
    </div>
  );
}
