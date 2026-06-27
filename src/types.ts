export interface Product {
  id: string;
  name: string;
  price: number;
  createdAt: string;
}

export interface StaffCode {
  code: string;
  name: string;
  createdAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  note: string;
  staffCode: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SaleItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  date: string;
  items: SaleItem[];
  discount: number; // Flat discount amount in Taka
  subtotal: number;
  total: number;
  staffCode: string;
  receivedAmount: number;
  changeAmount: number;
  paymentType?: "Cash" | "bKash" | "Nogod" | "Rocket" | "Card" | "Others" | string; // e.g. 'Cash', 'Bkash', 'Nogod', 'Rocket', 'Card', 'Others'
  paymentDetails?: string;  // Custom text for Others
}

export interface StaffAdvance {
  id: string;
  staffCode: string;
  amount: number;
  date: string;
  note: string;
}

export interface MomoLog {
  id: string;
  date: string;
  receivedQty: number; // পিস গ্রহন
  paidQty?: number;    // বিল পরিশোধকৃত পিস (নতুন সংযোজন)
  purchasePrice?: number; // পার্টনারের রেট/প্রতি পিস কেনা দাম (৳) (নতুন সংযোজন)
  soldQty: number;     // পিস বিক্রি
  unitPrice: number;   // বিক্রয় মূল্য (প্রতি পিস)
  totalSales: number;  // মোট বিক্রয় (soldQty * unitPrice)
  expense: number;     // আনুষঙ্গিক খরচ
  partnerSharePercent: number; // পার্টনারের অংশ (%) যেমন ৫০%
  note: string;        // মন্তব্য
}

export interface StoreSettings {
  storeName: string;
  adminPasswordHash: string; // Saved directly as string password
}
