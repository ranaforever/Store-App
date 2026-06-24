import React from "react";
import { Product, StaffCode, ExpenseCategory, Sale, Expense } from "../types";
import { formatCurrency, exportToCSV } from "../utils";
import { 
  Lock, KeyRound, Save, Plus, Trash2, Edit2, Download, 
  Settings, Users, ShoppingBag, Database, ListPlus, Calendar, ArrowDownCircle, ArrowUpCircle,
  Cloud, RefreshCw, Check, AlertCircle, Copy, FileCode
} from "lucide-react";
import { SETUP_SQL_CODE } from "../supabase";

interface AdminPanelProps {
  products: Product[];
  staffCodes: StaffCode[];
  categories: ExpenseCategory[];
  sales: Sale[];
  expenses: Expense[];
  storeName: string;
  adminPasswordHash: string;
  
  // Supabase Sync Props
  isSupabaseEnabled: boolean;
  isSupabaseConnected: boolean;
  supabaseSyncing: boolean;
  supabaseError: string | null;
  supabaseAutoSync: boolean;
  onToggleSupabaseAutoSync: () => void;
  onSupabasePush: () => Promise<boolean>;
  onSupabasePull: () => Promise<boolean>;
  onSupabaseCheckStatus: () => Promise<void>;

  onAddProduct: (name: string, price: number) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateProduct: (id: string, name: string, price: number) => void;
  
  onAddStaffCode: (code: string, name: string) => void;
  onDeleteStaffCode: (code: string) => void;
  onUpdateStaffCode: (oldCode: string, newCode: string, name: string) => void;
  
  onAddCategory: (name: string) => void;
  onDeleteCategory: (id: string) => void;
  onUpdateCategory: (id: string, name: string, oldName: string) => void;
  
  onDeleteSale: (id: string) => void;
  onUpdateSale: (id: string, updatedSale: Sale) => void;
  
  onDeleteExpense: (id: string) => void;
  onUpdateExpense: (id: string, updatedExpense: Expense) => void;
  
  onUpdateStoreName: (name: string) => void;
  onUpdatePassword: (newPass: string) => void;
  onImportBackup: (dataStr: string) => boolean;
  onExportBackup: () => void;
}

export default function AdminPanel({
  products,
  staffCodes,
  categories,
  sales,
  expenses,
  storeName,
  adminPasswordHash,
  
  // Supabase Props
  isSupabaseEnabled,
  isSupabaseConnected,
  supabaseSyncing,
  supabaseError,
  supabaseAutoSync,
  onToggleSupabaseAutoSync,
  onSupabasePush,
  onSupabasePull,
  onSupabaseCheckStatus,

  onAddProduct,
  onDeleteProduct,
  onUpdateProduct,
  onAddStaffCode,
  onDeleteStaffCode,
  onUpdateStaffCode,
  onAddCategory,
  onDeleteCategory,
  onUpdateCategory,
  onDeleteSale,
  onUpdateSale,
  onDeleteExpense,
  onUpdateExpense,
  onUpdateStoreName,
  onUpdatePassword,
  onImportBackup,
  onExportBackup,
}: AdminPanelProps) {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [passwordInput, setPasswordInput] = React.useState("");
  const [authError, setAuthError] = React.useState("");

  // Editing state
  const [editingProductId, setEditingProductId] = React.useState<string | null>(null);
  const [editProductName, setEditProductName] = React.useState("");
  const [editProductPrice, setEditProductPrice] = React.useState<number>(0);

  const [editingStaffCode, setEditingStaffCode] = React.useState<string | null>(null);
  const [editStaffCodeVal, setEditStaffCodeVal] = React.useState("");
  const [editStaffName, setEditStaffName] = React.useState("");

  const [editingCategoryId, setEditingCategoryId] = React.useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = React.useState("");

  // Sub-navigation tabs
  const [activeSubTab, setActiveSubTab] = React.useState<"reports" | "sales" | "expenses" | "products" | "staff" | "categories" | "settings" | "supabase">("reports");

  // Sales List Search & Edit States
  const [saleSearchQuery, setSaleSearchQuery] = React.useState("");
  const [editingSaleId, setEditingSaleId] = React.useState<string | null>(null);
  const [editSaleDate, setEditSaleDate] = React.useState("");
  const [editSaleStaff, setEditSaleStaff] = React.useState("");
  const [editSaleDiscount, setEditSaleDiscount] = React.useState<number>(0);
  const [editSaleItems, setEditSaleItems] = React.useState<any[]>([]);
  const [editSaleReceivedAmount, setEditSaleReceivedAmount] = React.useState<number>(0);
  const [editSaleError, setEditSaleError] = React.useState("");

  // Expenses List Search & Edit States
  const [expenseSearchQuery, setExpenseSearchQuery] = React.useState("");
  const [editingExpenseIdAdmin, setEditingExpenseIdAdmin] = React.useState<string | null>(null);
  const [editExpenseCategoryAdmin, setEditExpenseCategoryAdmin] = React.useState("");
  const [editExpenseAmountAdmin, setEditExpenseAmountAdmin] = React.useState<number>(0);
  const [editExpenseDateAdmin, setEditExpenseDateAdmin] = React.useState("");
  const [editExpenseNoteAdmin, setEditExpenseNoteAdmin] = React.useState("");
  const [editExpenseStaffAdmin, setEditExpenseStaffAdmin] = React.useState("");
  const [editExpenseErrorAdmin, setEditExpenseErrorAdmin] = React.useState("");


  // Admin Operations State
  const [newProductName, setNewProductName] = React.useState("");
  const [newProductPrice, setNewProductPrice] = React.useState<number>(0);
  
  const [newStaffCode, setNewStaffCode] = React.useState("");
  const [newStaffName, setNewStaffName] = React.useState("");
  
  const [newCategoryName, setNewCategoryName] = React.useState("");
  
  // Reports states
  const [reportRange, setReportRange] = React.useState<"daily" | "weekly" | "monthly" | "semi-annually" | "annually" | "custom">("monthly");
  const [customStart, setCustomStart] = React.useState(new Date().toISOString().slice(0, 10));
  const [customEnd, setCustomEnd] = React.useState(new Date().toISOString().slice(0, 10));

  // Store Setting States
  const [tempStoreName, setTempStoreName] = React.useState(storeName);
  const [tempPassword, setTempPassword] = React.useState("");
  const [tempPasswordConfirm, setTempPasswordConfirm] = React.useState("");
  const [settingsSuccess, setSettingsSuccess] = React.useState("");
  const [settingsError, setSettingsError] = React.useState("");

  // Master Passwords
  const MASTER_PASSWORD = "@Rana&01625@";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (passwordInput === MASTER_PASSWORD || passwordInput === adminPasswordHash) {
      setIsAuthenticated(true);
      setPasswordInput("");
    } else {
      setAuthError("ভুল পাসওয়ার্ড! দয়া করে সঠিক পাসওয়ার্ড দিয়ে পুনরায় চেষ্টা করুন।");
    }
  };

  // CRUD Submissions
  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || newProductPrice <= 0) return;
    onAddProduct(newProductName, newProductPrice);
    setNewProductName("");
    setNewProductPrice(0);
  };

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffCode || !newStaffName) return;
    onAddStaffCode(newStaffCode.trim().toUpperCase(), newStaffName.trim());
    setNewStaffCode("");
    setNewStaffName("");
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) return;
    onAddCategory(newCategoryName.trim());
    setNewCategoryName("");
  };

  const handleEditProductSubmit = (id: string) => {
    if (!editProductName.trim() || editProductPrice <= 0) return;
    onUpdateProduct(id, editProductName.trim(), editProductPrice);
    setEditingProductId(null);
  };

  const handleEditStaffSubmit = (oldCode: string) => {
    if (!editStaffCodeVal.trim() || !editStaffName.trim()) return;
    onUpdateStaffCode(oldCode, editStaffCodeVal.trim().toUpperCase(), editStaffName.trim());
    setEditingStaffCode(null);
  };

  const handleEditCategorySubmit = (id: string, oldName: string) => {
    if (!editCategoryName.trim()) return;
    onUpdateCategory(id, editCategoryName.trim(), oldName);
    setEditingCategoryId(null);
  };

  const handleUpdateStoreNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess("");
    setSettingsError("");
    if (!tempStoreName.trim()) {
      setSettingsError("স্টোরের নাম খালি হতে পারবে না!");
      return;
    }
    onUpdateStoreName(tempStoreName.trim());
    setSettingsSuccess("স্টোরের নাম সফলভাবে পরিবর্তন করা হয়েছে!");
  };

  const handleUpdatePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess("");
    setSettingsError("");
    if (!tempPassword) {
      setSettingsError("নতুন পাসওয়ার্ড প্রদান করুন!");
      return;
    }
    if (tempPassword !== tempPasswordConfirm) {
      setSettingsError("পাসওয়ার্ড দুটি মেলেনি!");
      return;
    }
    onUpdatePassword(tempPassword);
    setTempPassword("");
    setTempPasswordConfirm("");
    setSettingsSuccess("এডমিন পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে!");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettingsSuccess("");
    setSettingsError("");
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        const success = onImportBackup(content);
        if (success) {
          setSettingsSuccess("ডাটা ব্যাকআপ সফলভাবে ইম্পোর্ট ও রিস্টোর করা হয়েছে!");
        } else {
          setSettingsError("ভুল ফাইল ফরম্যাট! ব্যাকআপ ফাইলটি সঠিক নয়।");
        }
      }
    };
    fileReader.readAsText(file);
  };

  const handleEditExpenseAdminSubmit = (id: string) => {
    setEditExpenseErrorAdmin("");
    if (!editExpenseCategoryAdmin) {
      setEditExpenseErrorAdmin("খাত নির্বাচন আবশ্যক!");
      return;
    }
    if (editExpenseAmountAdmin <= 0) {
      setEditExpenseErrorAdmin("টাকার পরিমাণ ০ এর বেশি হতে হবে!");
      return;
    }
    if (!editExpenseStaffAdmin) {
      setEditExpenseErrorAdmin("কর্মী কোড আবশ্যক!");
      return;
    }
    const isValidStaff = editExpenseStaffAdmin.toUpperCase() === "ADMIN" || staffCodes.some(
      (s) => s.code.toUpperCase() === editExpenseStaffAdmin.toUpperCase()
    );
    if (!isValidStaff) {
      setEditExpenseErrorAdmin("ভুল কর্মী কোড!");
      return;
    }

    const matchedExpense = expenses.find(e => e.id === id);
    if (!matchedExpense) return;

    const updatedExpense: Expense = {
      ...matchedExpense,
      category: editExpenseCategoryAdmin,
      amount: editExpenseAmountAdmin,
      date: new Date(editExpenseDateAdmin).toISOString(),
      note: editExpenseNoteAdmin,
      staffCode: editExpenseStaffAdmin.toUpperCase(),
    };

    onUpdateExpense(id, updatedExpense);
    setEditingExpenseIdAdmin(null);
  };

  const handleEditSaleSubmit = (id: string) => {
    setEditSaleError("");
    if (!editSaleStaff) {
      setEditSaleError("কর্মী কোড আবশ্যক!");
      return;
    }
    const isValidStaff = editSaleStaff.toUpperCase() === "ADMIN" || staffCodes.some(
      (s) => s.code.toUpperCase() === editSaleStaff.toUpperCase()
    );
    if (!isValidStaff) {
      setEditSaleError("ভুল কর্মী কোড!");
      return;
    }
    if (editSaleItems.length === 0) {
      setEditSaleError("রশিদে অন্তত একটি পণ্য থাকা আবশ্যক!");
      return;
    }

    // Recalculate everything to be 100% correct
    const newSubtotal = editSaleItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const newTotal = Math.max(0, newSubtotal - editSaleDiscount);
    const newChange = Math.max(0, editSaleReceivedAmount - newTotal);

    const updatedSale: Sale = {
      id,
      invoiceNo: sales.find(s => s.id === id)?.invoiceNo || `INV-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date(editSaleDate).toISOString(),
      items: editSaleItems.map(item => ({
        ...item,
        total: item.price * item.quantity
      })),
      discount: editSaleDiscount,
      subtotal: newSubtotal,
      total: newTotal,
      staffCode: editSaleStaff.toUpperCase(),
      receivedAmount: editSaleReceivedAmount,
      changeAmount: newChange
    };

    onUpdateSale(id, updatedSale);
    setEditingSaleId(null);
  };

  const formatDateForInput = (dateStr: string) => {
    try {
      return new Date(dateStr).toISOString().slice(0, 10);
    } catch (e) {
      return new Date().toISOString().slice(0, 10);
    }
  };

  const handleUpdateSaleItemQty = (productId: string, newQty: number) => {
    setEditSaleItems(prev => prev.map(item => {
      if (item.id === productId) {
        return { ...item, quantity: newQty, total: item.price * newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handleAddProductToEditedSale = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const exists = editSaleItems.find(item => item.id === product.id);
    if (exists) {
      setEditSaleItems(prev => prev.map(item => {
        if (item.id === product.id) {
          return { ...item, quantity: item.quantity + 1, total: item.price * (item.quantity + 1) };
        }
        return item;
      }));
    } else {
      setEditSaleItems(prev => [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        total: product.price
      }]);
    }
  };

  // Filter Sales & Expenses for screen preview before download
  const filteredSalesCount = sales.length;
  const filteredExpensesCount = expenses.length;

  if (!isAuthenticated) {
    return (
      <div id="admin-login-screen" className="flex flex-col items-center justify-center py-12 px-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-800">এডমিন প্যানেলে প্রবেশাধিকার</h3>
            <p className="text-xs text-slate-400">
              এই প্যানেল থেকে পণ্য এন্ট্রি, কর্মী কোড ও এক্সেল রিপোর্ট ডাউনলোড করা যায়। দয়া করে এডমিন পাসওয়ার্ড দিন।
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl font-medium">
              ❌ {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="admin-password-field"
                type="password"
                required
                placeholder="এডমিন পাসওয়ার্ড লিখুন..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            <button
              id="admin-login-submit"
              type="submit"
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-950 text-white rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer"
            >
              প্যানেলে প্রবেশ করুন
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div id="admin-panel-tabs" className="space-y-6">
      
      {/* Verified Admin Tab Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">নিয়ন্ত্রণ কক্ষ (Admin Panel)</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">সবকিছু এন্ট্রি করুন, মুছুন এবং এক্সেল শীট ডাউনলোড করুন</p>
          </div>
        </div>

        {/* Admin Navigation */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-center">
          {[
            { id: "reports" as const, label: "এক্সেল রিপোর্ট", icon: Download },
            { id: "sales" as const, label: "বিক্রয় তালিকা", icon: ArrowUpCircle },
            { id: "expenses" as const, label: "খরচ তালিকা", icon: ArrowDownCircle },
            { id: "products" as const, label: "পণ্য তালিকা", icon: ShoppingBag },
            { id: "staff" as const, label: "কর্মী তালিকা", icon: Users },
            { id: "categories" as const, label: "খরচের খাত", icon: ListPlus },
            { id: "supabase" as const, label: "সুপাবেস ক্লাউড", icon: Cloud },
            { id: "settings" as const, label: "সেটিংস ও ব্যাকআপ", icon: Database },
          ].map((tab) => {
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeSubTab === tab.id
                    ? "bg-white text-blue-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB CONTENTS */}

      {/* 1. Excel/CSV Reports Exporter */}
      {activeSubTab === "reports" && (
        <div id="reports-subtab-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Exporter selector */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5 lg:col-span-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Download className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">হিসাব এর এক্সেল শীট ডাউনলোড</h3>
            </div>

            <div className="space-y-4">
              {/* Range type selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 block">রিপোর্ট সময়কাল নির্বাচন করুন *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: "daily" as const, label: "দৈনিক" },
                    { id: "weekly" as const, label: "সাপ্তাহিক" },
                    { id: "monthly" as const, label: "মাসিক" },
                    { id: "semi-annually" as const, label: "অর্ধবার্ষিক" },
                    { id: "annually" as const, label: "বার্ষিক" },
                    { id: "custom" as const, label: "কাস্টম পরিসীমা" },
                  ].map((range) => (
                    <button
                      key={range.id}
                      type="button"
                      onClick={() => setReportRange(range.id)}
                      className={`py-2 px-3 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        reportRange === range.id
                          ? "bg-blue-50 border-blue-300 text-blue-700 font-bold"
                          : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Range calendars */}
              {reportRange === "custom" && (
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">শুরুর তারিখ</label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">শেষের তারিখ</label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Export Button */}
              <button
                id="excel-download-submit-btn"
                onClick={() => exportToCSV(sales, expenses, reportRange, storeName, customStart, customEnd)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-100 flex items-center justify-center gap-2 cursor-pointer transition-all mt-4"
              >
                <Download className="w-4.5 h-4.5" />
                <span>হিসাব এর এক্সেল শীট ডাউনলোড করুন</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics previews */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-7 space-y-6">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">রিপোর্ট ডেটা প্রিভিউ</h3>
              <p className="text-xs text-slate-400 mt-1">ট্যালী খাতায় রক্ষিত মোট লেনদেনের সারাংশ</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex items-center gap-3">
                <ArrowUpCircle className="w-8 h-8 text-blue-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">মোট বিক্রয় রেকর্ড</span>
                  <span className="text-lg font-extrabold text-slate-800">{filteredSalesCount} টি রশিদ</span>
                </div>
              </div>

              <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100/50 flex items-center gap-3">
                <ArrowDownCircle className="w-8 h-8 text-rose-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">মোট খরচ রেকর্ড</span>
                  <span className="text-lg font-extrabold text-slate-800">{filteredExpensesCount} টি এন্ট্রি</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 leading-relaxed border border-slate-100 space-y-2">
              <p className="font-bold text-slate-600">💡 মাইক্রোসফট এক্সেল সতর্কতা (Tips for Excel):</p>
              <p>১. ডাউনলোড করা ফাইলটি একটি স্ট্যান্ডার্ড UTF-8 এনকোডেড CSV ফরম্যাট।</p>
              <p>২. এতে বাংলা লেখার পূর্ণ ডিকোড সাপোর্ট রয়েছে, তাই এক্সেলে সরাসরি ডবল ক্লিক করে চালু করলে বাংলা অক্ষর সুন্দরভাবে প্রদর্শিত হবে।</p>
              <p>৩. ডাটা সিকিউরিটি বজায় রাখতে নিয়মিত ব্যাকআপ ডাউনলোড করে রাখুন।</p>
            </div>
          </div>

        </div>
      )}

      {/* 1.1 Sales Management */}
      {activeSubTab === "sales" && (
        <div id="sales-subtab-container" className="space-y-6">
          
          {/* Sale Editing Form (if editingSaleId is set) */}
          {editingSaleId && (
            <div className="bg-amber-50/50 border border-amber-200/80 p-6 rounded-2xl shadow-sm space-y-4 animate-fade-in">
              <div className="flex justify-between items-center border-b border-amber-200 pb-3">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-amber-700 animate-pulse" />
                  <h3 className="font-bold text-amber-900 text-sm">
                    বিক্রয় মেমো সংশোধন — রশিদ নং: {sales.find(s => s.id === editingSaleId)?.invoiceNo}
                  </h3>
                </div>
                <button 
                  onClick={() => setEditingSaleId(null)}
                  className="text-amber-800 hover:text-amber-950 font-bold text-xs cursor-pointer"
                >
                  বাতিল করুন
                </button>
              </div>

              {editSaleError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                  ❌ {editSaleError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 block">বিক্রয় তারিখ *</label>
                  <input
                    type="date"
                    value={editSaleDate}
                    onChange={(e) => setEditSaleDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 block">বিক্রয়কর্মী কোড *</label>
                  <select
                    value={editSaleStaff}
                    onChange={(e) => setEditSaleStaff(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                  >
                    <option value="ADMIN">ADMIN</option>
                    {staffCodes.map((s) => (
                      <option key={s.code} value={s.code}>{s.code} ({s.name})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 block">পণ্য যোগ করুন (ঐচ্ছিক)</label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddProductToEditedSale(e.target.value);
                        e.target.value = ""; // reset dropdown
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500 text-slate-600"
                  >
                    <option value="">-- পণ্য নির্বাচন করুন --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} - ৳{p.price}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 block">মেমোর পণ্যসমূহ ও পরিমাণ *</label>
                <div className="border border-amber-200/60 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-500">
                        <th className="p-3">পণ্যের নাম</th>
                        <th className="p-3 text-center">একক মূল্য (৳)</th>
                        <th className="p-3 text-center" style={{ width: '100px' }}>পরিমাণ</th>
                        <th className="p-3 text-right">মোট মূল্য (৳)</th>
                        <th className="p-3 text-center" style={{ width: '60px' }}>মুছুন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {editSaleItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-800">{item.name}</td>
                          <td className="p-3 text-center font-bold text-slate-600">৳{item.price}</td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateSaleItemQty(item.id, Math.max(0, parseInt(e.target.value, 10) || 0))}
                              className="w-16 px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded-md text-xs font-bold focus:outline-none focus:border-amber-500"
                            />
                          </td>
                          <td className="p-3 text-right font-extrabold text-slate-800">
                            ৳{item.price * item.quantity}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => setEditSaleItems(prev => prev.filter(i => i.id !== item.id))}
                              className="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Adjust discount / received */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-amber-200/50">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">ছাড় (Discount ৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={editSaleDiscount}
                    onChange={(e) => setEditSaleDiscount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-rose-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">গ্রহনকৃত টাকা (Received ৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={editSaleReceivedAmount}
                    onChange={(e) => setEditSaleReceivedAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-green-700"
                  />
                </div>

                {/* Live math */}
                <div className="flex flex-col justify-center px-2 py-1 border-l border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400">নতুন মোট মূল্য:</span>
                  <span className="text-base font-extrabold text-blue-700">
                    ৳{Math.max(0, editSaleItems.reduce((acc, item) => acc + (item.price * item.quantity), 0) - editSaleDiscount)}
                  </span>
                </div>

                <div className="flex flex-col justify-center px-2 py-1 border-l border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400">ফেরতযোগ্য টাকা:</span>
                  <span className="text-base font-extrabold text-emerald-700">
                    ৳{Math.max(0, editSaleReceivedAmount - Math.max(0, editSaleItems.reduce((acc, item) => acc + (item.price * item.quantity), 0) - editSaleDiscount))}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSaleId(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="button"
                  onClick={() => handleEditSaleSubmit(editingSaleId)}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-100 transition-all cursor-pointer flex items-center gap-1"
                >
                  <Save className="w-4 h-4" />
                  <span>মেমো আপডেট করুন</span>
                </button>
              </div>
            </div>
          )}

          {/* Sales Listing Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">বিক্রয় মেমো তালিকা (Invoices)</h4>
                <p className="text-xs text-slate-400 mt-0.5">সব বিক্রয় মেমো অনুসন্ধান করুন, সংশোধন বা ডিলিট করুন</p>
              </div>
              
              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="রশিদ নং বা কর্মী কোড..."
                  value={saleSearchQuery}
                  onChange={(e) => setSaleSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
                {saleSearchQuery && (
                  <button 
                    onClick={() => setSaleSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-500">
                    <th className="p-3">তারিখ</th>
                    <th className="p-3">রশিদ নং</th>
                    <th className="p-3">বিক্রয়কর্মী</th>
                    <th className="p-3">ক্রয়কৃত পণ্যসমূহ</th>
                    <th className="p-3 text-right">উপমোট (৳)</th>
                    <th className="p-3 text-right">ছাড় (৳)</th>
                    <th className="p-3 text-right">মোট (৳)</th>
                    <th className="p-3 text-center" style={{ width: '100px' }}>অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {sales
                    .filter(s => {
                      const query = saleSearchQuery.toLowerCase().trim();
                      if (!query) return true;
                      return (
                        s.invoiceNo.toLowerCase().includes(query) ||
                        s.staffCode.toLowerCase().includes(query) ||
                        s.items.some(item => item.name.toLowerCase().includes(query))
                      );
                    })
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50/30">
                        <td className="p-3 text-slate-500 font-normal">
                          {new Date(sale.date).toLocaleDateString('bn-BD', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="p-3 font-bold text-slate-700">{sale.invoiceNo}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                            {sale.staffCode}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 max-w-xs truncate" title={sale.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}>
                          {sale.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                        </td>
                        <td className="p-3 text-right text-slate-500">৳{sale.subtotal}</td>
                        <td className="p-3 text-right text-rose-500">৳{sale.discount || 0}</td>
                        <td className="p-3 text-right font-extrabold text-slate-800">৳{sale.total}</td>
                        <td className="p-3 text-center flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSaleId(sale.id);
                              setEditSaleDate(formatDateForInput(sale.date));
                              setEditSaleStaff(sale.staffCode);
                              setEditSaleDiscount(sale.discount || 0);
                              setEditSaleItems([...sale.items]);
                              setEditSaleReceivedAmount(sale.receivedAmount || sale.total);
                              setEditSaleError("");
                            }}
                            className="text-slate-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="সম্পাদনা"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`আপনি কি নিশ্চিতভাবে এই বিক্রয় রশিদটি (${sale.invoiceNo}) ডিলিট করতে চান?`)) {
                                onDeleteSale(sale.id);
                              }
                            }}
                            className="text-slate-400 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  {sales.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-semibold">
                        কোন বিক্রয় রেকর্ড পাওয়া যায়নি!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 1.2 Expenses Management */}
      {activeSubTab === "expenses" && (
        <div id="expenses-subtab-container" className="space-y-6">
          
          {/* Expense Editing Form */}
          {editingExpenseIdAdmin && (
            <div className="bg-amber-50/50 border border-amber-200/80 p-6 rounded-2xl shadow-sm space-y-4 animate-fade-in">
              <div className="flex justify-between items-center border-b border-amber-200 pb-3">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-amber-700 animate-pulse" />
                  <h3 className="font-bold text-amber-900 text-sm">খরচ রেকর্ড সংশোধন করুন</h3>
                </div>
                <button 
                  onClick={() => setEditingExpenseIdAdmin(null)}
                  className="text-amber-800 hover:text-amber-950 font-bold text-xs cursor-pointer"
                >
                  বাতিল করুন
                </button>
              </div>

              {editExpenseErrorAdmin && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                  ❌ {editExpenseErrorAdmin}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 block">খরচের খাত *</label>
                  <select
                    value={editExpenseCategoryAdmin}
                    onChange={(e) => setEditExpenseCategoryAdmin(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- খাত নির্বাচন করুন --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 block">টাকার পরিমাণ (৳) *</label>
                  <input
                    type="number"
                    min="1"
                    value={editExpenseAmountAdmin || ""}
                    onChange={(e) => setEditExpenseAmountAdmin(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-rose-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 block">তারিখ *</label>
                  <input
                    type="date"
                    value={editExpenseDateAdmin}
                    onChange={(e) => setEditExpenseDateAdmin(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 block">কর্মী কোড *</label>
                  <select
                    value={editExpenseStaffAdmin}
                    onChange={(e) => setEditExpenseStaffAdmin(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                  >
                    <option value="ADMIN">ADMIN</option>
                    {staffCodes.map((s) => (
                      <option key={s.code} value={s.code}>{s.code} ({s.name})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 block">মন্তব্য / বিবরণ</label>
                <input
                  type="text"
                  placeholder="যেমন: চা নাস্তা বিল..."
                  value={editExpenseNoteAdmin}
                  onChange={(e) => setEditExpenseNoteAdmin(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingExpenseIdAdmin(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="button"
                  onClick={() => handleEditExpenseAdminSubmit(editingExpenseIdAdmin)}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-100 transition-all cursor-pointer flex items-center gap-1"
                >
                  <Save className="w-4 h-4" />
                  <span>খরচ আপডেট করুন</span>
                </button>
              </div>
            </div>
          )}

          {/* Expenses Listing Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">খরচ তালিকা (Expenses)</h4>
                <p className="text-xs text-slate-400 mt-0.5">সব খরচের হিসাব অনুসন্ধান করুন, সংশোধন বা ডিলিট করুন</p>
              </div>
              
              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="খাত বা কর্মী কোড লিখে খুঁজুন..."
                  value={expenseSearchQuery}
                  onChange={(e) => setExpenseSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
                {expenseSearchQuery && (
                  <button 
                    onClick={() => setExpenseSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-500">
                    <th className="p-3">তারিখ</th>
                    <th className="p-3">খরচের খাত</th>
                    <th className="p-3">কর্মী</th>
                    <th className="p-3">বিবরণ / মন্তব্য</th>
                    <th className="p-3 text-right">পরিমাণ (৳)</th>
                    <th className="p-3 text-center" style={{ width: '100px' }}>অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {expenses
                    .filter(e => {
                      const query = expenseSearchQuery.toLowerCase().trim();
                      if (!query) return true;
                      return (
                        e.category.toLowerCase().includes(query) ||
                        e.staffCode.toLowerCase().includes(query) ||
                        (e.note && e.note.toLowerCase().includes(query))
                      );
                    })
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/30">
                        <td className="p-3 text-slate-500 font-normal">
                          {new Date(exp.date).toLocaleDateString('bn-BD', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="p-3 font-bold text-slate-700">{exp.category}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                            {exp.staffCode}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">{exp.note || "---"}</td>
                        <td className="p-3 text-right font-extrabold text-rose-600">৳{exp.amount}</td>
                        <td className="p-3 text-center flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingExpenseIdAdmin(exp.id);
                              setEditExpenseCategoryAdmin(exp.category);
                              setEditExpenseAmountAdmin(exp.amount);
                              setEditExpenseDateAdmin(formatDateForInput(exp.date));
                              setEditExpenseNoteAdmin(exp.note || "");
                              setEditExpenseStaffAdmin(exp.staffCode);
                              setEditExpenseErrorAdmin("");
                            }}
                            className="text-slate-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="সম্পাদনা"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`আপনি কি নিশ্চিতভাবে এই খরচ রেকর্ডটি (${exp.category}: ৳${exp.amount}) ডিলিট করতে চান?`)) {
                                onDeleteExpense(exp.id);
                              }
                            }}
                            className="text-slate-400 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                        কোন খরচ রেকর্ড পাওয়া যায়নি!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. Product Management */}
      {activeSubTab === "products" && (
        <div id="products-subtab-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Add form */}
          <form onSubmit={handleAddProductSubmit} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 lg:col-span-5">
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">নতুন পণ্য এন্ট্রি ও দাম নির্ধারণ</h3>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 block">পণ্যের পূর্ণ নাম *</label>
              <input
                type="text"
                required
                placeholder="যেমন: মিনিকেট চাল ৫০ কেজি বস্তা..."
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 block">বিক্রয় মূল্য বা দাম (৳) *</label>
              <input
                type="number"
                min="1"
                required
                placeholder="0"
                value={newProductPrice || ""}
                onChange={(e) => setNewProductPrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            <button
              id="add-product-btn"
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer shadow-sm shadow-blue-100"
            >
              <Plus className="w-4 h-4" />
              <span>পণ্য সংরক্ষণ করুন</span>
            </button>
          </form>

          {/* List display */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-7 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-800 text-sm">বিদ্যমান পণ্যের তালিকা</h4>
              <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded">
                মোট পণ্য: {products.length}টি
              </span>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
              {products.map((p) => (
                editingProductId === p.id ? (
                  <div key={p.id} className="py-3 px-1 space-y-2 hover:bg-slate-50/50 rounded-lg transition-colors">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold focus:outline-none focus:border-blue-500"
                        value={editProductName}
                        onChange={(e) => setEditProductName(e.target.value)}
                        placeholder="পণ্যের নাম"
                      />
                      <input
                        type="number"
                        className="w-20 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-blue-700 focus:outline-none focus:border-blue-500"
                        value={editProductPrice}
                        onChange={(e) => setEditProductPrice(Math.max(1, parseInt(e.target.value, 10) || 0))}
                        placeholder="মূল্য"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingProductId(null)}
                        className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        বাতিল
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditProductSubmit(p.id)}
                        className="px-2.5 py-1 bg-blue-600 text-white rounded text-[10px] font-bold hover:bg-blue-700 transition-colors cursor-pointer"
                      >
                        সংরক্ষণ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={p.id} className="flex justify-between items-center py-3 px-1 hover:bg-slate-50/50 rounded-lg transition-colors">
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">{p.name}</h5>
                      <span className="text-[10px] text-slate-400 block mt-0.5">আইডি: {p.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-1 rounded-md mr-1">
                        {formatCurrency(p.price)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProductId(p.id);
                          setEditProductName(p.name);
                          setEditProductPrice(p.price);
                        }}
                        className="text-slate-300 hover:text-blue-600 p-1 transition-colors cursor-pointer"
                        title="সম্পাদনা করুন"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProduct(p.id)}
                        className="text-slate-300 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 3. Sales Staff Codes Management */}
      {activeSubTab === "staff" && (
        <div id="staff-subtab-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Add form */}
          <form onSubmit={handleAddStaffSubmit} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 lg:col-span-5">
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">নতুন বিক্রয়কর্মী কোড এন্ট্রি</h3>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 block">কর্মী কোড (উদা: RANA101) *</label>
              <input
                type="text"
                required
                placeholder="RANA101"
                value={newStaffCode}
                onChange={(e) => setNewStaffCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 block">কর্মীর নাম *</label>
              <input
                type="text"
                required
                placeholder="রানা আহমেদ"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            <button
              id="add-staff-btn"
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer shadow-sm shadow-blue-100"
            >
              <Plus className="w-4 h-4" />
              <span>কর্মী সংরক্ষণ করুন</span>
            </button>
          </form>

          {/* List display */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-7 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-800 text-sm">অনুমোদিত বিক্রয়কর্মী কোডসমূহ</h4>
              <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded">
                মোট কর্মী: {staffCodes.length}জন
              </span>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
              {staffCodes.map((s) => (
                editingStaffCode === s.code ? (
                  <div key={s.code} className="py-3 px-1 space-y-2 hover:bg-slate-50/50 rounded-lg transition-colors">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="w-28 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800 uppercase focus:outline-none focus:border-blue-500"
                        value={editStaffCodeVal}
                        onChange={(e) => setEditStaffCodeVal(e.target.value)}
                        placeholder="কর্মী কোড"
                        disabled={s.code === "BADSHA001"}
                      />
                      <input
                        type="text"
                        className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold focus:outline-none focus:border-blue-500"
                        value={editStaffName}
                        onChange={(e) => setEditStaffName(e.target.value)}
                        placeholder="কর্মীর নাম"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingStaffCode(null)}
                        className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        বাতিল
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditStaffSubmit(s.code)}
                        className="px-2.5 py-1 bg-blue-600 text-white rounded text-[10px] font-bold hover:bg-blue-700 transition-colors cursor-pointer"
                      >
                        সংরক্ষণ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={s.code} className="flex justify-between items-center py-3 px-1 hover:bg-slate-50/50 rounded-lg transition-colors">
                    <div>
                      <span className="text-xs font-extrabold text-blue-800 bg-blue-50 px-2 py-1 rounded-md uppercase">
                        {s.code}
                      </span>
                      <h5 className="text-xs font-bold text-slate-800 inline-block ml-3">{s.name}</h5>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingStaffCode(s.code);
                          setEditStaffCodeVal(s.code);
                          setEditStaffName(s.name);
                        }}
                        className="text-slate-300 hover:text-blue-600 p-1 transition-colors cursor-pointer"
                        title="সম্পাদনা করুন"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteStaffCode(s.code)}
                        className="text-slate-300 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                        disabled={s.code === "BADSHA001"} // Prevent deletion of primary owner
                        title={s.code === "BADSHA001" ? "মালিকের কোড মুছা সম্ভব নয়" : ""}
                        style={{ opacity: s.code === "BADSHA001" ? 0.3 : 1 }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 4. Expense Categories Management */}
      {activeSubTab === "categories" && (
        <div id="categories-subtab-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Add form */}
          <form onSubmit={handleAddCategorySubmit} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 lg:col-span-5">
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <ListPlus className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">নতুন খরচের খাত সংযুক্তি</h3>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 block">খরচের খাতের নাম *</label>
              <input
                type="text"
                required
                placeholder="যেমন: কারেন্ট বিল, পরিবহন খরচ..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            <button
              id="add-category-btn"
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer shadow-sm shadow-blue-100"
            >
              <Plus className="w-4 h-4" />
              <span>খাত সংরক্ষণ করুন</span>
            </button>
          </form>

          {/* List display */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-7 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-800 text-sm">নিবন্ধিত খরচের খাতসমূহ</h4>
              <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded">
                মোট খাত: {categories.length}টি
              </span>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
              {categories.map((c) => (
                editingCategoryId === c.id ? (
                  <div key={c.id} className="py-3 px-1 space-y-2 hover:bg-slate-50/50 rounded-lg transition-colors">
                    <input
                      type="text"
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold focus:outline-none focus:border-blue-500"
                      value={editCategoryName}
                      onChange={(e) => setEditCategoryName(e.target.value)}
                      placeholder="খরচের খাত"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingCategoryId(null)}
                        className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        বাতিল
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditCategorySubmit(c.id, c.name)}
                        className="px-2.5 py-1 bg-blue-600 text-white rounded text-[10px] font-bold hover:bg-blue-700 transition-colors cursor-pointer"
                      >
                        সংরক্ষণ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={c.id} className="flex justify-between items-center py-3 px-1 hover:bg-slate-50/50 rounded-lg transition-colors">
                    <h5 className="text-xs font-bold text-slate-800">{c.name}</h5>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategoryId(c.id);
                          setEditCategoryName(c.name);
                        }}
                        className="text-slate-300 hover:text-blue-600 p-1 transition-colors cursor-pointer"
                        title="সম্পাদনা করুন"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCategory(c.id)}
                        className="text-slate-300 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 5. General Configuration, Store Name & Backup restore */}
      {activeSubTab === "settings" && (
        <div id="settings-subtab-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main settings column */}
          <div className="space-y-6 lg:col-span-6">
            
            {/* Store Name Edit Form */}
            <form onSubmit={handleUpdateStoreNameSubmit} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Settings className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">স্টোর নেম কনফিগারেশন</h3>
              </div>

              {settingsSuccess && (
                <div className="p-3 bg-blue-50 border border-blue-100 text-blue-700 text-xs rounded-xl font-semibold">
                  ✅ {settingsSuccess}
                </div>
              )}
              {settingsError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl font-semibold">
                  ⚠️ {settingsError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 block">দোকানের নাম (ব্যানার টেক্সট) *</label>
                <input
                  type="text"
                  required
                  placeholder="বাদশা ভাইয়ের ট্যালী খাতা"
                  value={tempStoreName}
                  onChange={(e) => setTempStoreName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              <button
                id="update-store-name-btn"
                type="submit"
                className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer shadow-sm shadow-blue-100"
              >
                <Save className="w-4 h-4" />
                <span>স্টোরের নাম পরিবর্তন করুন</span>
              </button>
            </form>

            {/* Admin Password Change Form */}
            <form onSubmit={handleUpdatePasswordSubmit} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <KeyRound className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">এডমিন পাসওয়ার্ড পরিবর্তন</h3>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 block">নতুন এডমিন পাসওয়ার্ড লিখুন *</label>
                <input
                  type="password"
                  required
                  placeholder="যেমন: ৫৬৭৮..."
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 block">নতুন পাসওয়ার্ড নিশ্চিত করুন *</label>
                <input
                  type="password"
                  required
                  placeholder="পাসওয়ার্ড পুনরায় টাইপ করুন..."
                  value={tempPasswordConfirm}
                  onChange={(e) => setTempPasswordConfirm(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              <button
                id="update-password-btn"
                type="submit"
                className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer shadow-sm shadow-blue-100"
              >
                <Save className="w-4 h-4" />
                <span>পাসওয়ার্ড পরিবর্তন করুন</span>
              </button>
            </form>

          </div>

          {/* Backup Restore & Local Persistence column */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Database className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">ডাটা নিরাপত্তা ও ব্যাকআপ</h3>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              আপনার সমস্ত ট্যালী খাতা ব্রাউজারের লোকাল স্টোরেজে সম্পূর্ণ নিরাপদে সংরক্ষিত থাকে। তবে ব্রাউজার ক্যাশ পরিষ্কার করলে ডাটা ডিলিট হতে পারে। তাই নিয়মিত ব্যাকআপ ডাউনলোড করে ফাইলটি আপনার পিসিতে বা ফোনে সংরক্ষণ করে রাখুন।
            </p>

            {/* Backup triggers */}
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 block">১. ব্যাকআপ ডাউনলোড (Export)</span>
                <button
                  id="backup-export-btn"
                  onClick={onExportBackup}
                  className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4.5 h-4.5" />
                  <span>সম্পূর্ণ খাতা ব্যাকআপ ফাইল ডাউনলোড করুন (.json)</span>
                </button>
              </div>

              <div className="space-y-1.5 border-t border-slate-100 pt-4">
                <span className="text-[11px] font-bold text-slate-500 block">২. ব্যাকআপ রিস্টোর (Import)</span>
                <div className="relative">
                  <input
                    id="backup-import-uploader"
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all text-center">
                    <span>ফাইল আপলোড করে খাতা রিস্টোর করুন</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 6. Supabase Cloud Sync */}
      {activeSubTab === "supabase" && (
        <div id="supabase-subtab-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Controls Panel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">সুপাবেস ক্লাউড ডাটাবেজ সিঙ্ক</h3>
              </div>
              <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                isSupabaseEnabled 
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                  : "bg-rose-50 text-rose-700 border border-rose-100"
              }`}>
                {isSupabaseEnabled ? "সক্রিয় (Active)" : "নিষ্ক্রিয় (Inactive)"}
              </span>
            </div>

            {/* Connection Status Indicator */}
            <div className={`p-4 rounded-xl border ${
              isSupabaseConnected 
                ? "bg-emerald-50/50 border-emerald-100 text-emerald-900" 
                : "bg-amber-50/50 border-amber-100 text-amber-900"
            }`}>
              <div className="flex items-start gap-3">
                {isSupabaseConnected ? (
                  <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <h4 className="font-bold text-xs">
                    {isSupabaseConnected ? "সুপাবেস ডাটাবেজ সংযুক্ত আছে! ✅" : "সুপাবেস ডাটাবেজে সংযোগ করা সম্ভব হচ্ছে না ⚠️"}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {isSupabaseConnected 
                      ? "আপনার সমস্ত তথ্য সুপাবেস ক্লাউডে রিয়েল-টাইমে সিঙ্ক করার জন্য প্রস্তুত।" 
                      : "অনুগ্রহ করে নিশ্চিত করুন যে আপনার সুপাবেস প্রজেক্টে প্রয়োজনীয় টেবিলগুলো তৈরি করা আছে এবং আপনি সঠিক কোড বা আরএলএস পলিসি সেটআপ করেছেন।"}
                  </p>
                  {supabaseError && (
                    <p className="text-[10px] text-rose-600 font-mono mt-1 bg-white p-2 rounded border border-rose-100">
                      এরর: {supabaseError}
                    </p>
                  )}
                  <button 
                    onClick={onSupabaseCheckStatus}
                    className="mt-2 px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <RefreshCw className={`w-3 h-3 ${supabaseSyncing ? "animate-spin" : ""}`} />
                    <span>সংযোগ রিফ্রেশ করুন</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Auto Sync Toggle */}
            <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between">
              <div className="space-y-0.5 pr-4">
                <h4 className="font-bold text-xs text-slate-800">অটো-সিঙ্ক (Real-time Auto-Sync)</h4>
                <p className="text-[10px] text-slate-400">মেমো জেনারেট বা খরচ যোগ করলেই স্বয়ংক্রিয়ভাবে ক্লাউডে আপলোড হবে।</p>
              </div>
              <button
                type="button"
                onClick={onToggleSupabaseAutoSync}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  supabaseAutoSync ? "bg-blue-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    supabaseAutoSync ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Manual Action Buttons */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-xs text-slate-700">ম্যানুয়াল ডাটা সিঙ্ক (Manual Sync):</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={async () => {
                    const confirmPush = window.confirm("আপনি কি লোকাল খাতার সমস্ত ডাটা ক্লাউডে আপলোড করতে চান? এটি ক্লাউডের আগের ডাটা ওভাররাইট করবে।");
                    if (confirmPush) {
                      const success = await onSupabasePush();
                      if (success) {
                        alert("সফলভাবে সমস্ত ডাটা সুপাবেস ক্লাউডে আপলোড করা হয়েছে! 🎉");
                      } else {
                        alert("আপলোড ব্যর্থ হয়েছে! অনুগ্রহ করে টেবিল ও পলিসি চেক করুন।");
                      }
                    }
                  }}
                  disabled={supabaseSyncing || !isSupabaseEnabled}
                  className="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 border border-blue-200 text-blue-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${supabaseSyncing ? "animate-spin" : ""}`} />
                  <span>ক্লাউডে ডাটা পাঠান (Push)</span>
                </button>

                <button
                  onClick={async () => {
                    const confirmPull = window.confirm("আপনি কি ক্লাউড থেকে ডাটা ডাউনলোড করে লোকাল খাতায় রিস্টোর করতে চান? আপনার লোকাল খাতার বর্তমান হিসাবগুলো মুছে যাবে।");
                    if (confirmPull) {
                      const success = await onSupabasePull();
                      if (success) {
                        alert("সফলভাবে ক্লাউড থেকে সমস্ত ডাটা লোকাল খাতায় রিস্টোর করা হয়েছে! 🎉");
                      } else {
                        alert("ডাউনলোড ব্যর্থ হয়েছে! অনুগ্রহ করে সুপাবেসের ডাটা এবং কানেকশন চেক করুন।");
                      }
                    }
                  }}
                  disabled={supabaseSyncing || !isSupabaseEnabled}
                  className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 border border-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>ক্লাউড থেকে আনুন (Pull)</span>
                </button>
              </div>
            </div>
          </div>

          {/* SQL Setup Instructions Panel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileCode className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">সুপাবেস ডাটাবেজ টেবিল সেটআপ</h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              সুপাবেস ডাটাবেজ সঠিকভাবে কাজ করার জন্য নিচের SQL কমান্ডগুলো কপি করে আপনার Supabase ড্যাশবোর্ডের <span className="font-bold text-blue-600">SQL Editor</span>-এ রান করুন:
            </p>

            <div className="relative">
              <pre className="text-[10px] font-mono bg-slate-900 text-slate-200 p-4 rounded-xl overflow-x-auto max-h-[220px] leading-relaxed border border-slate-800">
                {SETUP_SQL_CODE}
              </pre>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(SETUP_SQL_CODE);
                  alert("SQL কোড ক্লিপবোর্ডে কপি করা হয়েছে! এখন সুপাবেসের SQL Editor-এ পেস্ট করে রান করুন।");
                }}
                className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>কপি করুন</span>
              </button>
            </div>

            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100/50 text-[11px] text-slate-600 leading-relaxed space-y-1">
              <p className="font-bold text-slate-700">💡 আরএলএস পলিসি সতর্কতা (RLS Policy):</p>
              <p>আমরা কোডের নিচের অংশে আরএলএস পলিসি যুক্ত করেছি যাতে অ্যাপটি ক্লায়েন্ট-সাইড থেকে সরাসরি ডাটাবেজ পড়তে ও লিখতে পারে। সিকিউরিটি বাড়াতে চাইলে আপনি অথেনটিকেশন বা নির্দিষ্ট সিক্রেট রুলস ব্যবহার করতে পারেন।</p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
