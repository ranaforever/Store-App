import { Product, StaffCode, ExpenseCategory, Sale, Expense } from "./types";

export const INITIAL_PRODUCTS: Product[] = [
  { id: "p1", name: "সয়াবিন তেল ১ লিটার", price: 185, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "p2", name: "মিনিকেট চাল ৫০ কেজি বস্তা", price: 3400, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "p3", name: "ডিম ১ ডজন", price: 145, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "p4", name: "পেঁয়াজ ১ কেজি", price: 80, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "p5", name: "রুই মাছ ১ কেজি", price: 350, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "p6", name: "গুঁড়ো দুধ ৫০০ গ্রাম", price: 420, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "p7", name: "চিনি ১ কেজি", price: 135, createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "p8", name: "মটর ডাল ১ কেজি", price: 110, createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
];

export const INITIAL_STAFF_CODES: StaffCode[] = [
  { code: "RANA101", name: "রানা আহমেদ", createdAt: new Date().toISOString() },
  { code: "MASUM102", name: "মাসুম বিল্লাহ", createdAt: new Date().toISOString() },
  { code: "BADSHA001", name: "বাদশা ভাই (মালিক)", createdAt: new Date().toISOString() },
];

export const INITIAL_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: "c1", name: "দোকান ভাড়া" },
  { id: "c2", name: "বিদ্যুৎ বিল" },
  { id: "c3", name: "পরিবহন খরচ" },
  { id: "c4", name: "বাজার খরচ" },
  { id: "c5", name: "কর্মীর বেতন" },
  { id: "c6", name: "অন্যান্য খরচ" },
];

// Seed sales and expenses over the past 4 days to build beautiful, realistic charts
export const INITIAL_SALES: Sale[] = [
  {
    id: "s1",
    invoiceNo: "INV-1001",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    items: [
      { productId: "p1", name: "সয়াবিন তেল ১ লিটার", price: 185, quantity: 2, subtotal: 370 },
      { productId: "p3", name: "ডিম ১ ডজন", price: 145, quantity: 1, subtotal: 145 }
    ],
    discount: 15,
    subtotal: 515,
    total: 500,
    staffCode: "RANA101",
    receivedAmount: 500,
    changeAmount: 0
  },
  {
    id: "s2",
    invoiceNo: "INV-1002",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    items: [
      { productId: "p2", name: "মিনিকেট চাল ৫০ কেজি বস্তা", price: 3400, quantity: 1, subtotal: 3400 },
      { productId: "p6", name: "গুঁড়ো দুধ ৫০০ গ্রাম", price: 420, quantity: 2, subtotal: 840 }
    ],
    discount: 140,
    subtotal: 4240,
    total: 4100,
    staffCode: "BADSHA001",
    receivedAmount: 5000,
    changeAmount: 900
  },
  {
    id: "s3",
    invoiceNo: "INV-1003",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    items: [
      { productId: "p4", name: "পেঁয়াজ ১ কেজি", price: 80, quantity: 5, subtotal: 400 },
      { productId: "p5", name: "রুই মাছ ১ কেজি", price: 350, quantity: 2, subtotal: 700 },
      { productId: "p7", name: "চিনি ১ কেজি", price: 135, quantity: 3, subtotal: 405 }
    ],
    discount: 5,
    subtotal: 1505,
    total: 1500,
    staffCode: "MASUM102",
    receivedAmount: 1500,
    changeAmount: 0
  },
  {
    id: "s4",
    invoiceNo: "INV-1004",
    date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // Today
    items: [
      { productId: "p1", name: "সয়াবিন তেল ১ লিটার", price: 185, quantity: 3, subtotal: 555 },
      { productId: "p3", name: "ডিম ১ ডজন", price: 145, quantity: 2, subtotal: 290 },
      { productId: "p8", name: "মটর ডাল ১ কেজি", price: 110, quantity: 2, subtotal: 220 }
    ],
    discount: 65,
    subtotal: 1065,
    total: 1000,
    staffCode: "RANA101",
    receivedAmount: 1000,
    changeAmount: 0
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: "e1",
    category: "পরিবহন খরচ",
    amount: 350,
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    note: "ঢাকা হতে পণ্য চালানি খরচ",
    staffCode: "BADSHA001"
  },
  {
    id: "e2",
    category: "বিদ্যুৎ বিল",
    amount: 1200,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    note: "দোকানের গত মাসের কারেন্ট বিল",
    staffCode: "BADSHA001"
  },
  {
    id: "e3",
    category: "বাজার খরচ",
    amount: 150,
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    note: "দোকানের আপ্যায়ন খরচ",
    staffCode: "MASUM102"
  }
];
