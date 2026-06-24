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
}

export interface StoreSettings {
  storeName: string;
  adminPasswordHash: string; // Saved directly as string password
}
