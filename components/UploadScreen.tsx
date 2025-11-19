import React, { useRef, useState } from 'react';
import { Camera, Upload, ScanLine } from 'lucide-react';

interface UploadScreenProps {
  onImageSelected: (base64: string) => void;
}

const UploadScreen: React.FC<UploadScreenProps> = ({ onImageSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
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
    <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-fade-in">
      <div className="mb-8 relative">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
        <div className="relative bg-white p-6 rounded-full shadow-xl">
          <ScanLine size={48} className="text-primary" />
        </div>
      </div>

      <h1 className="text-3xl font-bold text-gray-800 mb-2">SnapSplit</h1>
      <p className="text-gray-500 mb-8 max-w-xs">
        Split bills effortlessly. Scan your receipt and let AI handle the math.
      </p>

      <div 
        className={`w-full max-w-md border-2 border-dashed rounded-2xl p-8 transition-all duration-200 flex flex-col items-center justify-center gap-4 cursor-pointer bg-white/50 backdrop-blur-sm hover:bg-white/80 ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="p-4 bg-primary/10 rounded-full text-primary">
           <Camera size={32} />
        </div>
        <div>
          <p className="font-semibold text-gray-700">Tap to upload receipt</p>
          <p className="text-sm text-gray-400 mt-1">or drag and drop image here</p>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
      </div>

      <div className="mt-8 flex gap-2 text-xs text-gray-400">
        <span>Powered by Gemini 2.5 Flash</span>
      </div>
    </div>
  );
};

export default UploadScreen;
