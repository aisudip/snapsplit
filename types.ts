export interface ReceiptItem {
  id: string;
  description: string;
  price: number;
}

export interface Friend {
  id: string;
  name: string;
  color: string;
}

export interface Allocation {
  [itemId: string]: string[]; // Array of friend IDs sharing this item
}

export type AppStep = 'upload' | 'processing' | 'assigning' | 'summary';

export interface BillData {
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  tip: number;
}
