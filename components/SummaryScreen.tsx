import React, { useMemo } from 'react';
import { Friend, ReceiptItem, Allocation } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Share2, RefreshCw, DollarSign } from 'lucide-react';

interface SummaryScreenProps {
  friends: Friend[];
  items: ReceiptItem[];
  allocations: Allocation;
  tax: number;
  tip: number;
  onReset: () => void;
}

const SummaryScreen: React.FC<SummaryScreenProps> = ({ friends, items, allocations, tax, tip, onReset }) => {
  const subtotal = items.reduce((acc, item) => acc + item.price, 0);
  const totalExtras = tax + tip;

  const results = useMemo(() => {
    const friendTotals: Record<string, { total: number; items: { desc: string; cost: number }[] }> = {};
    
    // Initialize
    friends.forEach(f => {
      friendTotals[f.id] = { total: 0, items: [] };
    });

    // Distribute items
    items.forEach(item => {
      const assignees = allocations[item.id] || [];
      if (assignees.length > 0) {
        const splitCost = item.price / assignees.length;
        assignees.forEach(fid => {
          if (friendTotals[fid]) {
            friendTotals[fid].total += splitCost;
            friendTotals[fid].items.push({
              desc: `${item.description} ${assignees.length > 1 ? `(1/${assignees.length})` : ''}`,
              cost: splitCost
            });
          }
        });
      }
    });

    // Distribute tax and tip proportionally based on individual subtotal vs total assigned subtotal
    // Note: We base proportion on assigned subtotal to avoid division by zero if nothing assigned
    const assignedSubtotal = Object.values(friendTotals).reduce((sum, f) => sum + f.total, 0);
    
    const finalData = friends.map(friend => {
      const baseTotal = friendTotals[friend.id].total;
      let shareOfExtras = 0;
      
      if (assignedSubtotal > 0) {
        shareOfExtras = (baseTotal / assignedSubtotal) * totalExtras;
      }

      return {
        ...friend,
        baseTotal,
        extraTotal: shareOfExtras,
        finalTotal: baseTotal + shareOfExtras,
        items: friendTotals[friend.id].items
      };
    }).filter(f => f.finalTotal > 0); // Only show people who owe money

    return finalData.sort((a, b) => b.finalTotal - a.finalTotal);
  }, [friends, items, allocations, tax, tip]);

  const grandTotal = subtotal + tax + tip;
  
  // Chart Data
  const chartData = results.map(r => ({
    name: r.name,
    value: r.finalTotal,
    color: r.color.replace('bg-', '') // This is a hacky simplification, strictly we need hex codes for Recharts
  }));
  
  // Map tailwind color names to hex for Recharts (simplified set)
  const getColorHex = (className: string) => {
     if(className.includes('red')) return '#EF4444';
     if(className.includes('blue')) return '#3B82F6';
     if(className.includes('green')) return '#10B981';
     if(className.includes('yellow')) return '#F59E0B';
     if(className.includes('purple')) return '#8B5CF6';
     if(className.includes('pink')) return '#EC4899';
     if(className.includes('indigo')) return '#6366F1';
     return '#9CA3AF';
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-24 pt-[calc(1rem+env(safe-area-inset-top))]">
        <div className="bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-1">Bill Summary</h2>
            <p className="text-center text-gray-500 text-sm mb-6">Total with Tip: <span className="font-bold text-gray-900">${grandTotal.toFixed(2)}</span></p>
            
            <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie
                    data={chartData}
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                >
                    {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColorHex(entry.color)} />
                    ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                </PieChart>
            </ResponsiveContainer>
            </div>
        </div>

        <div className="p-4 space-y-4">
            {results.map(person => (
            <div key={person.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div className={`h-1 ${person.color}`}></div>
                <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${person.color} flex items-center justify-center text-white font-bold shadow-sm`}>
                            {person.name.charAt(0).toUpperCase()}
                        </div>
                        <h3 className="font-bold text-lg text-gray-800">{person.name}</h3>
                    </div>
                    <div className="text-right">
                        <span className="block text-xl font-bold text-gray-900">${person.finalTotal.toFixed(2)}</span>
                    </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                    {person.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-gray-600">
                            <span className="truncate pr-2">{item.desc}</span>
                            <span>${item.cost.toFixed(2)}</span>
                        </div>
                    ))}
                    {(person.extraTotal > 0) && (
                        <div className="flex justify-between text-gray-500 border-t border-gray-200 pt-2 mt-2 font-medium">
                            <span className="flex items-center gap-1 text-xs uppercase tracking-wide"><DollarSign size={10}/> Tax & Tip</span>
                            <span>${person.extraTotal.toFixed(2)}</span>
                        </div>
                    )}
                </div>
                </div>
            </div>
            ))}
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="absolute bottom-0 w-full bg-white border-t p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <button 
            onClick={onReset}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
        >
            <RefreshCw size={18} /> New Bill
        </button>
        <button 
            className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            onClick={() => alert("Feature coming soon: Send payment requests via link!")}
        >
            <Share2 size={18} /> Share
        </button>
      </div>
    </div>
  );
};

export default SummaryScreen;