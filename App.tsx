import React, { useState } from 'react';
import { AppStep, ReceiptItem, Friend, Allocation } from './types';
import UploadScreen from './components/UploadScreen';
import AssignmentScreen from './components/AssignmentScreen';
import SummaryScreen from './components/SummaryScreen';
import { parseReceiptImage } from './services/geminiService';
import { Loader2, AlertCircle, X } from 'lucide-react';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('upload');
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Final Data
  const [finalFriends, setFinalFriends] = useState<Friend[]>([]);
  const [finalAllocations, setFinalAllocations] = useState<Allocation>({});
  const [finalTax, setFinalTax] = useState(0);
  const [finalTip, setFinalTip] = useState(0);

  const handleImageSelected = async (base64: string) => {
    setStep('processing');
    setError(null);
    try {
      const extractedItems = await parseReceiptImage(base64);
      if (extractedItems.length === 0) {
        setError("We couldn't find any items in that receipt. Please try a clearer photo.");
        setStep('upload');
      } else {
        setItems(extractedItems);
        setStep('assigning');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong analyzing the receipt. Please try again.");
      setStep('upload');
    }
  };

  const handleAssignmentComplete = (friends: Friend[], allocation: Allocation, tax: number, tip: number) => {
    setFinalFriends(friends);
    setFinalAllocations(allocation);
    setFinalTax(tax);
    setFinalTip(tip);
    setStep('summary');
  };

  const handleEditAllocation = () => {
    setStep('assigning');
  };

  const resetApp = () => {
    setItems([]);
    setFinalFriends([]);
    setFinalAllocations({});
    setStep('upload');
    setError(null);
  };

  return (
    <div className="min-h-[100dvh] bg-gray-100 flex items-center justify-center md:p-8 safe-area-padding">
      
      <div className="w-full h-[100dvh] md:h-[85vh] md:max-w-md bg-white md:rounded-3xl md:shadow-2xl overflow-hidden relative md:border border-gray-200 flex flex-col">
        
        {/* Dynamic Content */}
        <div className="flex-1 relative overflow-hidden flex flex-col">
          {step === 'upload' && (
            <UploadScreen onImageSelected={handleImageSelected} />
          )}

          {step === 'processing' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-50">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="text-primary animate-pulse" size={24} />
                </div>
              </div>
              <p className="mt-6 text-lg font-medium text-gray-700 animate-pulse">Reading receipt...</p>
              <p className="text-sm text-gray-400 mt-2">This might take a few seconds</p>
            </div>
          )}

          {step === 'assigning' && (
            <AssignmentScreen 
              items={items} 
              onComplete={handleAssignmentComplete}
              initialFriends={finalFriends.length > 0 ? finalFriends : undefined}
              initialAllocations={Object.keys(finalAllocations).length > 0 ? finalAllocations : undefined}
              initialTax={finalTax}
              initialTip={finalTip}
            />
          )}

          {step === 'summary' && (
            <SummaryScreen 
              friends={finalFriends} 
              items={items} 
              allocations={finalAllocations} 
              tax={finalTax} 
              tip={finalTip}
              onReset={resetApp}
              onEdit={handleEditAllocation}
            />
          )}
        </div>

        {/* Error Toast - Positioned safer for mobile */}
        {error && (
          <div className="absolute top-safe-offset left-4 right-4 z-50 animate-bounce-in">
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl shadow-xl flex items-start gap-3 backdrop-blur-sm bg-opacity-95">
              <AlertCircle className="shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                  <p className="text-sm font-medium leading-relaxed">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)} 
                className="p-1 -mr-2 -mt-2 text-red-400 hover:text-red-700 rounded-full hover:bg-red-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

      </div>
      
      <style>{`
        .top-safe-offset {
            top: env(safe-area-inset-top, 20px);
            margin-top: 1rem;
        }
      `}</style>
    </div>
  );
};

export default App;