import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { baseURL } from "../utils/apiBase";
import { FiUploadCloud } from "react-icons/fi";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "./pdfStyles.css";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const steps = ["Upload PDF", "Preview", "Download"];

export default function UploadPDF() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [step, setStep] = useState(0);
  const [numPages, setNumPages] = useState(1);
  const [pageNumber, setPageNumber] = useState(1);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfList, setPdfList] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPdfList = async () => {
    setListLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${baseURL}/api/pdf/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPdfList(res.data.files || []);
    } catch (err) {
      setError("Failed to fetch PDF list.");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchPdfList();
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setStep(1);
      setPageNumber(1);
    } else {
      toast.error("Please upload a valid PDF file.");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.warning("No file selected.");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("pdf", file);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${baseURL}/api/pdf/upload`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("✅ PDF uploaded successfully!");
      setUploadedFileUrl(`http://localhost:5000${res.data.filePath}`);
      setStep(2);
      fetchPdfList();
    } catch (err) {
      console.error(err);
      toast.error("❌ Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (url, name) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name || "download.pdf";
    link.click();
  };

  const handleDelete = async (filename) => {
    if (!window.confirm("Are you sure you want to delete this PDF?")) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${baseURL}/api/pdf/${filename}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("PDF deleted.");
      fetchPdfList();
    } catch (err) {
      toast.error("Failed to delete PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-gray-950 text-[var(--color-text-main)] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar pageTitle="Upload PDF" />
        <main className="flex-1 flex flex-col items-center justify-start pt-6 relative overflow-x-hidden overflow-y-auto" style={{ maxHeight: '100vh' }}>
          {/* Animated background shapes */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-500 opacity-20 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-500 opacity-10 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-blue-400 opacity-10 rounded-full blur-2xl animate-pulse-slow" />
          </div>
          <div className="relative z-10 w-full max-w-3xl bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 border border-white/10 flex flex-col items-center animate-fadeIn">
            {/* Stepper */}
            <div className="flex justify-center mb-8 w-full">
              {steps.map((label, idx) => (
                <div key={label} className="flex items-center">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-lg transition-all duration-300 ${step === idx ? "bg-indigo-500 text-white shadow-lg scale-110" : "bg-white/20 text-indigo-300"}`}>{idx + 1}</div>
                  {idx < steps.length - 1 && <div className="w-12 h-1 bg-indigo-400/30 mx-2 rounded" />}
                </div>
              ))}
            </div>
            {/* Step 1: Upload PDF */}
            {step === 0 && (
              <div className="flex flex-col items-center w-full animate-fadeIn">
                <h1 className="text-3xl font-extrabold mb-6 text-center text-indigo-300 drop-shadow">📄 Upload PDF</h1>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-500/40 p-8 rounded-2xl bg-white/10 hover:bg-white/20 transition duration-300 cursor-pointer w-full max-w-md">
                  <FiUploadCloud size={40} className="text-indigo-400 mb-4" />
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <span className="text-gray-300 text-sm mt-2">Drag & drop or click to upload</span>
                </label>
                <div className="mt-8 w-full">
                  <h2 className="text-xl font-semibold mb-4 text-white">Your PDFs</h2>
                  {listLoading ? (
                    <div className="text-white">Loading...</div>
                  ) : error ? (
                    <div className="text-red-400">{error}</div>
                  ) : pdfList.length === 0 ? (
                    <div className="text-gray-300">No PDFs uploaded yet.</div>
                  ) : (
                    <table className="w-full text-left text-sm bg-white/10 rounded-xl overflow-hidden">
                      <thead className="bg-[var(--color-table-header)] text-[var(--color-primary)] uppercase">
                        <tr>
                          <th className="p-3">File Name</th>
                          <th className="p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pdfList.map((pdf, i) => (
                          <tr key={i} className="border-t border-[var(--color-border)] hover:bg-[var(--color-table-row-alt)] transition">
                            <td className="p-3 text-white">{pdf}</td>
                            <td className="p-3 flex gap-2">
                              <a href={`http://localhost:5000/uploads/${pdf}`} target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:text-[var(--color-secondary)] underline transition-all">View</a>
                              <button onClick={() => handleDownload(`http://localhost:5000/api/pdf/download/${pdf}`, pdf)} className="text-[var(--color-secondary)] hover:text-[var(--color-primary)] underline transition-all">Download</button>
                              <button onClick={() => handleDelete(pdf)} className="text-red-400 hover:text-red-600 underline transition-all">Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
            {/* Step 2: Preview */}
            {step === 1 && preview && (
              <div className="w-full flex flex-col items-center animate-fadeIn">
                <div className="relative border-2 border-white/10 rounded-2xl p-4 bg-white/10 max-w-2xl w-full flex flex-col items-center shadow-xl">
                  <Document
                    file={preview}
                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                    className="w-full flex flex-col items-center"
                  >
                    <Page pageNumber={pageNumber} />
                  </Document>
                  {/* Page navigation */}
                  <div className="flex items-center justify-center gap-4 mt-4">
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
                </div>
                <button
                  onClick={handleUpload}
                  className={`mt-8 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg transition ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
                  disabled={loading}
                >
                  {loading ? "Uploading..." : "🚀 Upload"}
                </button>
                <button
                  onClick={() => setStep(0)}
                  className="mt-4 px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold shadow transition"
                  title="Start Over"
                >
                  Start Over
                </button>
              </div>
            )}
            {/* Step 3: Download */}
            {step === 2 && (
              <div className="flex flex-col items-center w-full animate-fadeIn">
                <h2 className="text-2xl font-bold text-indigo-300 mb-4">🎉 Uploaded!</h2>
                <p className="text-gray-200 mb-6 text-center max-w-md">Your PDF has been uploaded. You can now download it or upload another file.</p>
                {uploadedFileUrl && (
                  <div className="w-full flex flex-col items-center mb-6">
                    <Document
                      file={uploadedFileUrl}
                      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                      className="w-full flex flex-col items-center"
                    >
                      <Page pageNumber={1} />
                    </Document>
                  </div>
                )}
                <button
                  onClick={() => handleDownload(uploadedFileUrl, file?.name)}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg shadow-lg transition mb-4"
                  title="Download PDF"
                >
                  ⬇️ Download PDF
                </button>
                <button
                  onClick={() => {
                    setStep(0);
                    setFile(null);
                    setPreview(null);
                    setUploadedFileUrl(null);
                    fetchPdfList();
                  }}
                  className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold shadow transition"
                  title="Upload Another"
                >
                  Upload Another
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
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
      `}</style>
    </div>
  );
}
