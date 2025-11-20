import React, { useState, useMemo } from 'react';
import { ReceiptItem, Friend, Allocation } from '../types';
import { Plus, User, Trash2, UserPlus, Check, DollarSign, Split } from 'lucide-react';

interface AssignmentScreenProps {
  items: ReceiptItem[];
  initialFriends?: Friend[];
  initialAllocations?: Allocation;
  initialTax?: number;
  initialTip?: number;
  onComplete: (friends: Friend[], allocation: Allocation, tax: number, tip: number) => void;
}

const COLORS = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'
];

const AssignmentScreen: React.FC<AssignmentScreenProps> = ({ 
  items, 
  onComplete,
  initialFriends,
  initialAllocations,
  initialTax,
  initialTip
}) => {
  const [friends, setFriends] = useState<Friend[]>(initialFriends || [
    { id: 'me', name: 'Me', color: COLORS[0] }
  ]);
  const [allocations, setAllocations] = useState<Allocation>(initialAllocations || {});
  const [newFriendName, setNewFriendName] = useState('');
  const [activeFriendId, setActiveFriendId] = useState<string>(initialFriends?.[0]?.id || 'me');
  const [tax, setTax] = useState<string>(initialTax?.toString() || '0');
  const [tip, setTip] = useState<string>(initialTip?.toString() || '0');

  // Calculate subtotal
  const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.price, 0), [items]);

  const addFriend = () => {
    if (!newFriendName.trim()) return;
    const newFriend: Friend = {
      id: `friend-${Date.now()}`,
      name: newFriendName.trim(),
      color: COLORS[friends.length % COLORS.length]
    };
    setFriends([...friends, newFriend]);
    setNewFriendName('');
    setActiveFriendId(newFriend.id);
  };

  const toggleAllocation = (itemId: string) => {
    setAllocations(prev => {
      const currentAssignees = prev[itemId] || [];
      const isAssigned = currentAssignees.includes(activeFriendId);
      
      let newAssignees;
      if (isAssigned) {
        newAssignees = currentAssignees.filter(id => id !== activeFriendId);
      } else {
        newAssignees = [...currentAssignees, activeFriendId];
      }

      // Cleanup empty arrays
      if (newAssignees.length === 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }

      return { ...prev, [itemId]: newAssignees };
    });
  };

  const getItemStatusColor = (itemId: string) => {
    const assignees = allocations[itemId] || [];
    if (assignees.length === 0) return 'border-gray-200 bg-white';
    if (assignees.length === 1) {
      const friend = friends.find(f => f.id === assignees[0]);
      return friend ? `border-l-4 ${friend.color.replace('bg-', 'border-')} bg-gray-50` : 'bg-white';
    }
    return 'border-l-4 border-gray-800 bg-gray-50'; // Multiple people
  };

  const getFriendColor = (id: string) => friends.find(f => f.id === id)?.color || 'bg-gray-400';

  const handleFinish = () => {
    onComplete(friends, allocations, parseFloat(tax) || 0, parseFloat(tip) || 0);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 relative">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 z-10 sticky top-0 pt-[calc(1rem+env(safe-area-inset-top))]">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Who ate what?</h2>
        
        {/* Friends List / Selector */}
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {friends.map(friend => (
            <button
              key={friend.id}
              onClick={() => setActiveFriendId(friend.id)}
              className={`flex flex-col items-center min-w-[60px] transition-all duration-200 ${activeFriendId === friend.id ? 'scale-110 opacity-100' : 'opacity-60 scale-100'}`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md mb-1 ${friend.color} ${activeFriendId === friend.id ? 'ring-2 ring-offset-2 ring-primary' : ''}`}>
                <span className="font-bold text-lg">{friend.name.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-xs font-medium truncate max-w-[60px]">{friend.name}</span>
            </button>
          ))}
          
          {/* Add Friend Button */}
          <div className="flex flex-col items-center min-w-[60px]">
             <button 
                onClick={() => document.getElementById('add-friend-input')?.focus()}
                className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-300 transition-colors mb-1"
             >
               <Plus size={24} />
             </button>
             <span className="text-xs text-gray-400">Add</span>
          </div>
        </div>

        {/* Quick Add Input */}
        <div className="mt-2 flex items-center gap-2">
            <div className="relative flex-1">
                <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                    id="add-friend-input"
                    type="text"
                    value={newFriendName}
                    onChange={(e) => setNewFriendName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addFriend()}
                    placeholder="Add new friend..."
                    className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
            </div>
            <button 
                onClick={addFriend}
                disabled={!newFriendName.trim()}
                className="bg-primary text-white p-2 rounded-full disabled:opacity-50 hover:bg-primary/90"
            >
                <Check size={16} />
            </button>
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
        <p className="text-sm text-gray-500 mb-2">
            Select <span className="font-bold text-gray-700">{friends.find(f => f.id === activeFriendId)?.name}</span>, then tap items to assign.
        </p>
        {items.map((item) => {
          const assignees = allocations[item.id] || [];
          const isAssignedToActive = assignees.includes(activeFriendId);

          return (
            <div 
              key={item.id}
              onClick={() => toggleAllocation(item.id)}
              className={`relative p-4 rounded-xl border shadow-sm transition-all cursor-pointer flex justify-between items-center ${getItemStatusColor(item.id)} ${isAssignedToActive ? 'ring-2 ring-primary ring-opacity-50' : ''}`}
            >
              <div className="flex-1 pr-4">
                <h3 className="font-medium text-gray-800">{item.description}</h3>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-gray-600">${item.price.toFixed(2)}</span>
                    {/* Assignee Indicators */}
                    <div className="flex -space-x-1">
                        {assignees.map(id => (
                            <div key={id} className={`w-4 h-4 rounded-full border border-white ${getFriendColor(id)}`} />
                        ))}
                    </div>
                </div>
              </div>
              
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isAssignedToActive ? 'bg-primary border-primary text-white' : 'border-gray-300 text-transparent'}`}>
                <Check size={14} />
              </div>
            </div>
          );
        })}
        
        {/* Extra Costs Section */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mt-6">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <DollarSign size={18} /> Extra Costs
            </h3>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Tax ($)</label>
                    <input 
                        type="number" 
                        min="0" 
                        step="0.01"
                        value={tax} 
                        onChange={(e) => setTax(e.target.value)}
                        className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Tip ($)</label>
                    <input 
                        type="number" 
                        min="0" 
                        step="0.01"
                        value={tip} 
                        onChange={(e) => setTip(e.target.value)}
                        className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                    />
                </div>
            </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-white border-t absolute bottom-0 w-full shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex justify-between items-center mb-2 text-sm text-gray-500">
            <span>Subtotal: ${subtotal.toFixed(2)}</span>
            <span>Assigned: ${Object.keys(allocations).reduce((total, itemId) => {
                const item = items.find(i => i.id === itemId);
                return total + (item ? item.price : 0);
            }, 0).toFixed(2)}</span>
        </div>
        <button 
            onClick={handleFinish}
            className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold shadow-lg hover:bg-gray-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
            <Split size={18} /> Calculate Split
        </button>
      </div>
    </div>
  );
};

export default AssignmentScreen;