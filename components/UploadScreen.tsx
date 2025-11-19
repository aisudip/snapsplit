import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, ScanLine, UploadCloud } from 'lucide-react';

interface UploadScreenProps {
  onImageSelected: (base64: string) => void;
}

const UploadScreen: React.FC<UploadScreenProps> = ({ onImageSelected }) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset value to allow selecting same file again immediately if needed
    event.target.value = '';
  };

  const processFile = (file: File) => {
    // Basic validation
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        onImageSelected(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
        className={`flex flex-col items-center justify-center h-full p-6 text-center animate-fade-in transition-colors duration-300 ${dragActive ? 'bg-primary/5' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
    >
      <div className="mb-8 relative">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
        <div className="relative bg-white p-6 rounded-full shadow-xl ring-1 ring-gray-100">
          <ScanLine size={48} className="text-primary" />
        </div>
      </div>

      <h1 className="text-3xl font-bold text-gray-800 mb-2">SnapSplit</h1>
      <p className="text-gray-500 mb-8 max-w-xs leading-relaxed">
        Scan your receipt or upload a photo to start splitting the bill.
      </p>

      <div className="w-full max-w-xs space-y-4 z-10">
        
        {/* Camera Button - Triggers Native Camera */}
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="w-full py-4 bg-gray-900 text-white rounded-2xl shadow-xl hover:bg-gray-800 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
        >
          <div className="bg-white/10 p-2 rounded-xl group-hover:scale-110 transition-transform">
             <Camera size={22} strokeWidth={2.5} />
          </div>
          <span className="text-lg font-semibold tracking-wide">Scan Receipt</span>
        </button>

        {/* Upload Button - Opens Gallery/File Picker */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl shadow-sm hover:border-primary/30 hover:bg-gray-50 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
           <ImageIcon size={22} className="text-gray-400" strokeWidth={2.5} />
           <span className="font-semibold">Upload Image</span>
        </button>
      
      </div>

      {/* Drag Drop Hint for Desktop */}
      <div className="mt-8 flex items-center gap-2 text-sm text-gray-400/80 font-medium">
         <UploadCloud size={16} />
         <span>or drop image anywhere</span>
      </div>

      {/* Hidden Inputs */}
      {/* capture="environment" prefers the rear camera on mobile devices */}
      <input 
        type="file" 
        ref={cameraInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
};

export default UploadScreen;