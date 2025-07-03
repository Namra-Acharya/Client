// src/components/SignatureInput.jsx
import { useRef, useState } from "react";

export default function SignatureInput({ onSignatureSelect }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureImage, setSignatureImage] = useState(null);

  const startDrawing = (e) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureImage(null);
  };

  const handleSave = () => {
    const dataURL = canvasRef.current.toDataURL("image/png");
    setSignatureImage(dataURL);
    onSignatureSelect(dataURL); // send to parent component
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSignatureImage(reader.result);
        onSignatureSelect(reader.result); // send to parent
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4 text-white">
      <h3 className="text-xl font-bold">Add Signature</h3>

      <div className="flex flex-col space-y-2">
        <canvas
          ref={canvasRef}
          width={300}
          height={100}
          className="border border-gray-300 bg-white rounded"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        ></canvas>

        <div className="space-x-2">
          <button onClick={handleClear} className="px-3 py-1 bg-gray-600 rounded">
            Clear
          </button>
          <button onClick={handleSave} className="px-3 py-1 bg-green-600 rounded">
            Save
          </button>
        </div>
      </div>

      <div className="pt-2">
        <input type="file" accept="image/*" onChange={handleUpload} />
      </div>

      {signatureImage && (
        <div className="pt-4">
          <p className="mb-2">Preview:</p>
          <img src={signatureImage} alt="Signature" className="w-48 border rounded" />
        </div>
      )}
    </div>
  );
}
