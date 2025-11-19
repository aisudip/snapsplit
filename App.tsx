import React, { useState } from 'react';
import { AppStep, ReceiptItem, Friend, Allocation } from './types';
import UploadScreen from './components/UploadScreen';
import AssignmentScreen from './components/AssignmentScreen';
import SummaryScreen from './components/SummaryScreen';
import { parseReceiptImage } from './services/geminiService';
import { Loader2, AlertCircle } from 'lucide-react';

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
    } catch (err) {
      console.error(err);
      setError("Something went wrong analyzing the receipt. Please try again.");
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

  const resetApp = () => {
    setItems([]);
    setFinalFriends([]);
    setFinalAllocations({});
    setStep('upload');
    setError(null);
  };

  return (
    // Changed: min-h-[100dvh] ensures it fills mobile viewports correctly
    // md:p-8 adds padding only on desktop to center the card
    <div className="min-h-[100dvh] bg-gray-100 flex items-center justify-center md:p-8">
      
      {/* Changed: 
          - w-full h-[100dvh] on mobile (full screen app feel)
          - md:h-[85vh] md:max-w-md on desktop (constrained card)
          - md:rounded-3xl only on desktop
      */}
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
            <AssignmentScreen items={items} onComplete={handleAssignmentComplete} />
          )}

          {step === 'summary' && (
            <SummaryScreen 
              friends={finalFriends} 
              items={items} 
              allocations={finalAllocations} 
              tax={finalTax} 
              tip={finalTip}
              onReset={resetApp}
            />
          )}
        </div>

        {/* Error Toast */}
        {error && (
          <div className="absolute top-4 left-4 right-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-start gap-3 shadow-lg animate-bounce-in z-50">
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
            <div className="flex-1">
                <p className="text-sm font-medium">{error}</p>
                <button onClick={() => setError(null)} className="text-xs underline mt-1 opacity-80 hover:opacity-100">Dismiss</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default App;