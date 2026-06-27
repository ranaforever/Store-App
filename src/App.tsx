import React from "react";
import { Product, StaffCode, ExpenseCategory, Sale, Expense, StaffAdvance, MomoLog } from "./types";
import { 
  INITIAL_PRODUCTS, 
  INITIAL_STAFF_CODES, 
  INITIAL_EXPENSE_CATEGORIES, 
  INITIAL_SALES, 
  INITIAL_EXPENSES 
} from "./data";
import Dashboard from "./components/Dashboard";
import POS from "./components/POS";
import Expenses from "./components/Expenses";
import AdminPanel from "./components/AdminPanel";
import POSReceiptModal from "./components/POSReceiptModal";
import MomoPartnership from "./components/MomoPartnership";
import { 
  supabase,
  isSupabaseConfigured,
  checkTablesExist,
  downloadConfig as fetchStoreSettings,
  downloadProducts as fetchProducts,
  downloadStaff as fetchStaffCodes,
  downloadCategories as fetchExpenseCategories,
  downloadExpenses as fetchExpenses,
  downloadSales as fetchSales,
  downloadStaffAdvances as fetchStaffAdvances,
  downloadMomoLogs as fetchMomoLogs,
  upsertStoreSetting,
  saveProduct,
  deleteProductFromDb,
  saveStaffCode,
  deleteStaffCodeFromDb,
  saveExpenseCategory,
  deleteExpenseCategoryFromDb,
  saveExpense,
  deleteExpenseFromDb,
  saveSale,
  deleteSaleFromDb,
  saveStaffAdvance,
  deleteStaffAdvanceFromDb,
  saveMomoLog,
  deleteMomoLogFromDb,
  fullSyncToSupabase,
  fullSyncFromSupabase
} from "./supabase";

const testSupabaseConnection = async () => {
  const res = await checkTablesExist();
  return res.ok;
};

const uploadLocalToSupabase = async (data: any) => {
  const res = await fullSyncToSupabase(data);
  return res.success;
};

import { 
  LayoutDashboard, ShoppingCart, DollarSign, Lock, 
  Store, Calendar, Clock, ChevronRight, Menu, X, Eye, EyeOff
} from "lucide-react";

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = React.useState<"dashboard" | "pos" | "expenses" | "admin" | "momo">("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Core Ledger States with Lazy Initializers (loads immediately from localStorage, then updates from Supabase)
  const [storeName, setStoreName] = React.useState(() => {
    return localStorage.getItem("tally_store_name") || "বাদশা ভাইয়ের ট্যালী খাতা";
  });
  const [adminPasswordHash, setAdminPasswordHash] = React.useState(() => {
    return localStorage.getItem("tally_admin_password") || "1234";
  });
  const [products, setProducts] = React.useState<Product[]>(() => {
    const stored = localStorage.getItem("tally_products");
    return stored ? JSON.parse(stored) : INITIAL_PRODUCTS;
  });
  const [staffCodes, setStaffCodes] = React.useState<StaffCode[]>(() => {
    const stored = localStorage.getItem("tally_staff");
    return stored ? JSON.parse(stored) : INITIAL_STAFF_CODES;
  });
  const [categories, setCategories] = React.useState<ExpenseCategory[]>(() => {
    const stored = localStorage.getItem("tally_categories");
    return stored ? JSON.parse(stored) : INITIAL_EXPENSE_CATEGORIES;
  });
  const [sales, setSales] = React.useState<Sale[]>(() => {
    const stored = localStorage.getItem("tally_sales");
    return stored ? JSON.parse(stored) : INITIAL_SALES;
  });
  const [expenses, setExpenses] = React.useState<Expense[]>(() => {
    const stored = localStorage.getItem("tally_expenses");
    return stored ? JSON.parse(stored) : INITIAL_EXPENSES;
  });
  const [staffAdvances, setStaffAdvances] = React.useState<StaffAdvance[]>(() => {
    const stored = localStorage.getItem("tally_staff_advances");
    return stored ? JSON.parse(stored) : [];
  });
  const [momoLogs, setMomoLogs] = React.useState<MomoLog[]>(() => {
    const stored = localStorage.getItem("tally_momo_logs");
    return stored ? JSON.parse(stored) : [];
  });

  // Supabase Sync Status State
  const [supabaseStatus, setSupabaseStatus] = React.useState<"loading" | "connected" | "error" | "not-configured">("loading");
  const [supabaseSyncing, setSupabaseSyncing] = React.useState(false);
  const [supabaseError, setSupabaseError] = React.useState<string | null>(null);
  const [supabaseAutoSync, setSupabaseAutoSync] = React.useState(() => {
    const stored = localStorage.getItem("tally_supabase_auto_sync");
    return stored !== "false";
  });

  const handleToggleSupabaseAutoSync = () => {
    setSupabaseAutoSync(prev => {
      const next = !prev;
      localStorage.setItem("tally_supabase_auto_sync", String(next));
      return next;
    });
  };

  const handleSupabaseCheckStatus = async () => {
    if (!isSupabaseConfigured) {
      setSupabaseStatus("not-configured");
      return;
    }
    setSupabaseSyncing(true);
    setSupabaseError(null);
    const isConnected = await testSupabaseConnection();
    if (isConnected) {
      setSupabaseStatus("connected");
    } else {
      setSupabaseStatus("error");
      setSupabaseError("সংযোগ করা যাচ্ছে না। দয়া করে সুপাবেস আরএলএস এবং টেবিল চেক করুন।");
    }
    setSupabaseSyncing(false);
  };

  const handleSupabasePush = async (): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;
    setSupabaseSyncing(true);
    setSupabaseError(null);
    try {
      const success = await uploadLocalToSupabase({
        storeName,
        adminPasswordHash,
        products,
        staffCodes,
        categories,
        sales,
        expenses,
        staffAdvances,
        momoLogs
      });
      if (success) {
        setSupabaseStatus("connected");
      } else {
        setSupabaseError("ডাটাবেজে টেবিলগুলো তৈরি করা নেই অথবা পারমিশন নেই।");
      }
      return success;
    } catch (err: any) {
      setSupabaseError(err.message || "Push error");
      return false;
    } finally {
      setSupabaseSyncing(false);
    }
  };

  const handleSupabasePull = async (): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;
    setSupabaseSyncing(true);
    setSupabaseError(null);
    try {
      const dbStore = await fetchStoreSettings();
      const dbProducts = await fetchProducts();
      const dbStaff = await fetchStaffCodes();
      const dbCategories = await fetchExpenseCategories();
      const dbExpenses = await fetchExpenses();
      const dbSales = await fetchSales();
      const dbAdvances = await fetchStaffAdvances();
      const dbMomoLogs = await fetchMomoLogs();

      if (dbStore) {
        setStoreName(dbStore.storeName);
        localStorage.setItem("tally_store_name", dbStore.storeName);
        setAdminPasswordHash(dbStore.adminPasswordHash);
        localStorage.setItem("tally_admin_password", dbStore.adminPasswordHash);
      }
      if (dbProducts) {
         setProducts(dbProducts);
         localStorage.setItem("tally_products", JSON.stringify(dbProducts));
      }
      if (dbStaff) {
         setStaffCodes(dbStaff);
         localStorage.setItem("tally_staff", JSON.stringify(dbStaff));
      }
      if (dbCategories) {
         setCategories(dbCategories);
         localStorage.setItem("tally_categories", JSON.stringify(dbCategories));
      }
      if (dbExpenses) {
         setExpenses(dbExpenses);
         localStorage.setItem("tally_expenses", JSON.stringify(dbExpenses));
      }
      if (dbSales) {
         setSales(dbSales);
         localStorage.setItem("tally_sales", JSON.stringify(dbSales));
      }
      if (dbAdvances) {
         setStaffAdvances(dbAdvances);
         localStorage.setItem("tally_staff_advances", JSON.stringify(dbAdvances));
      }
      if (dbMomoLogs) {
         setMomoLogs(dbMomoLogs);
         localStorage.setItem("tally_momo_logs", JSON.stringify(dbMomoLogs));
      }

      setSupabaseStatus("connected");
      return true;
    } catch (err: any) {
      setSupabaseError(err.message || "Pull error");
      return false;
    } finally {
      setSupabaseSyncing(false);
    }
  };

  const handleSilentSupabasePull = async () => {
    if (!isSupabaseConfigured || !supabaseAutoSync || supabaseStatus !== "connected") return;
    try {
      const dbStore = await fetchStoreSettings();
      if (dbStore) {
        setStoreName(prev => {
          if (prev !== dbStore.storeName) {
            localStorage.setItem("tally_store_name", dbStore.storeName);
            return dbStore.storeName;
          }
          return prev;
        });
        setAdminPasswordHash(prev => {
          if (prev !== dbStore.adminPasswordHash) {
            localStorage.setItem("tally_admin_password", dbStore.adminPasswordHash);
            return dbStore.adminPasswordHash;
          }
          return prev;
        });
      }

      const dbProducts = await fetchProducts();
      if (dbProducts) {
        setProducts(prev => {
          const dbStr = JSON.stringify(dbProducts);
          if (JSON.stringify(prev) !== dbStr) {
            localStorage.setItem("tally_products", dbStr);
            return dbProducts;
          }
          return prev;
        });
      }

      const dbStaff = await fetchStaffCodes();
      if (dbStaff) {
        setStaffCodes(prev => {
          const dbStr = JSON.stringify(dbStaff);
          if (JSON.stringify(prev) !== dbStr) {
            localStorage.setItem("tally_staff", dbStr);
            return dbStaff;
          }
          return prev;
        });
      }

      const dbCategories = await fetchExpenseCategories();
      if (dbCategories) {
        setCategories(prev => {
          const dbStr = JSON.stringify(dbCategories);
          if (JSON.stringify(prev) !== dbStr) {
            localStorage.setItem("tally_categories", dbStr);
            return dbCategories;
          }
          return prev;
        });
      }

      const dbExpenses = await fetchExpenses();
      if (dbExpenses) {
        setExpenses(prev => {
          const dbStr = JSON.stringify(dbExpenses);
          if (JSON.stringify(prev) !== dbStr) {
            localStorage.setItem("tally_expenses", dbStr);
            return dbExpenses;
          }
          return prev;
        });
      }

      const dbSales = await fetchSales();
      if (dbSales) {
        setSales(prev => {
          const dbStr = JSON.stringify(dbSales);
          if (JSON.stringify(prev) !== dbStr) {
            localStorage.setItem("tally_sales", dbStr);
            return dbSales;
          }
          return prev;
        });
      }

      const dbAdvances = await fetchStaffAdvances();
      if (dbAdvances) {
        setStaffAdvances(prev => {
          const dbStr = JSON.stringify(dbAdvances);
          if (JSON.stringify(prev) !== dbStr) {
            localStorage.setItem("tally_staff_advances", dbStr);
            return dbAdvances;
          }
          return prev;
        });
      }

      const dbMomoLogs = await fetchMomoLogs();
      if (dbMomoLogs) {
        setMomoLogs(prev => {
          const dbStr = JSON.stringify(dbMomoLogs);
          if (JSON.stringify(prev) !== dbStr) {
            localStorage.setItem("tally_momo_logs", dbStr);
            return dbMomoLogs;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Silent sync background error:", err);
    }
  };

  // Real-time channel listener for instant synchronization
  React.useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !supabaseAutoSync || supabaseStatus !== "connected") return;

    const channel = supabase
      .channel("tally-realtime-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        (payload) => {
          console.log("Real-time change detected:", payload);
          handleSilentSupabasePull();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabaseStatus, supabaseAutoSync]);

  // Background interval polling fallback (runs every 6 seconds)
  React.useEffect(() => {
    if (!isSupabaseConfigured || !supabaseAutoSync || supabaseStatus !== "connected") return;

    // Run once on status transition to connected
    handleSilentSupabasePull();

    const interval = setInterval(() => {
      handleSilentSupabasePull();
    }, 6000);

    return () => clearInterval(interval);
  }, [supabaseStatus, supabaseAutoSync]);

  // Sync with Supabase on mount
  React.useEffect(() => {
    async function initSupabase() {
      if (!isSupabaseConfigured) {
        setSupabaseStatus("not-configured");
        return;
      }
      
      const isConnected = await testSupabaseConnection();
      if (!isConnected) {
        setSupabaseStatus("error");
        return;
      }
      
      try {
        setSupabaseStatus("loading");
        
        // Only download if auto-sync is enabled
        const autoSyncStored = localStorage.getItem("tally_supabase_auto_sync");
        if (autoSyncStored === "false") {
          setSupabaseStatus("connected");
          return;
        }

        // 1. Fetch Store Settings
        const settings = await fetchStoreSettings();
        if (settings) {
          setStoreName(settings.storeName);
          localStorage.setItem("tally_store_name", settings.storeName);
          setAdminPasswordHash(settings.adminPasswordHash);
          localStorage.setItem("tally_admin_password", settings.adminPasswordHash);
        } else {
          // If empty in DB, seed current local settings to DB
          await upsertStoreSetting("tally_store_name", storeName);
          await upsertStoreSetting("tally_admin_password", adminPasswordHash);
        }

        // 2. Fetch Products
        const dbProducts = await fetchProducts();
        if (dbProducts && dbProducts.length > 0) {
          setProducts(dbProducts);
          localStorage.setItem("tally_products", JSON.stringify(dbProducts));
        } else if (products.length > 0) {
          // Upload local products to DB to seed it
          for (const p of products) {
            await saveProduct(p);
          }
        }

        // 3. Fetch Staff Codes
        const dbStaff = await fetchStaffCodes();
        if (dbStaff && dbStaff.length > 0) {
          setStaffCodes(dbStaff);
          localStorage.setItem("tally_staff", JSON.stringify(dbStaff));
        } else if (staffCodes.length > 0) {
          for (const s of staffCodes) {
            await saveStaffCode(s);
          }
        }

        // 4. Fetch Expense Categories
        const dbCategories = await fetchExpenseCategories();
        if (dbCategories && dbCategories.length > 0) {
          setCategories(dbCategories);
          localStorage.setItem("tally_categories", JSON.stringify(dbCategories));
        } else if (categories.length > 0) {
          for (const c of categories) {
            await saveExpenseCategory(c);
          }
        }

        // 5. Fetch Expenses
        const dbExpenses = await fetchExpenses();
        if (dbExpenses && dbExpenses.length > 0) {
          setExpenses(dbExpenses);
          localStorage.setItem("tally_expenses", JSON.stringify(dbExpenses));
        } else if (expenses.length > 0) {
          for (const e of expenses) {
            await saveExpense(e);
          }
        }

        // 6. Fetch Sales
        const dbSales = await fetchSales();
        if (dbSales && dbSales.length > 0) {
          setSales(dbSales);
          localStorage.setItem("tally_sales", JSON.stringify(dbSales));
        } else if (sales.length > 0) {
          for (const s of sales) {
            await saveSale(s);
          }
        }

        // 7. Fetch Staff Advances
        const dbAdvances = await fetchStaffAdvances();
        if (dbAdvances && dbAdvances.length > 0) {
          setStaffAdvances(dbAdvances);
          localStorage.setItem("tally_staff_advances", JSON.stringify(dbAdvances));
        } else if (staffAdvances.length > 0) {
          for (const a of staffAdvances) {
            await saveStaffAdvance(a);
          }
        }

        // 8. Fetch Momo Logs
        const dbMomoLogs = await fetchMomoLogs();
        if (dbMomoLogs && dbMomoLogs.length > 0) {
          setMomoLogs(dbMomoLogs);
          localStorage.setItem("tally_momo_logs", JSON.stringify(dbMomoLogs));
        } else if (momoLogs.length > 0) {
          for (const l of momoLogs) {
            await saveMomoLog(l);
          }
        }

        setSupabaseStatus("connected");
      } catch (err) {
        console.error("Supabase load error:", err);
        setSupabaseStatus("error");
      }
    }
    
    initSupabase();
  }, []);

  // Lock / Gate Screen State
  const [isGatePassed, setIsGatePassed] = React.useState(() => {
    return localStorage.getItem("tally_gate_passed") === "true";
  });
  const [activeStaffCode, setActiveStaffCode] = React.useState(() => {
    return localStorage.getItem("activeStaffCode") || "";
  });
  const [gateInput, setGateInput] = React.useState("");
  const [gateError, setGateError] = React.useState("");
  const [showGatePassword, setShowGatePassword] = React.useState(false);

  // Auto route non-admin staff to POS
  React.useEffect(() => {
    if (isGatePassed && activeStaffCode !== "ADMIN" && (activeTab === "dashboard" || activeTab === "admin")) {
      setActiveTab("pos");
    }
  }, [activeStaffCode, isGatePassed, activeTab]);

  // Receipt modal state
  const [activeReceipt, setActiveReceipt] = React.useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);

  // Live Clock State
  const [currentTime, setCurrentTime] = React.useState(new Date());

  // Initial Load clock tick
  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync states to LocalStorage
  const updateLocalStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // State Callbacks & Operations
  const handleAddProduct = async (name: string, price: number) => {
    const newProduct = { id: `prod-${Date.now()}`, name, price, createdAt: new Date().toISOString() };
    const updated = [
      ...products,
      newProduct,
    ];
    setProducts(updated);
    updateLocalStorage("tally_products", updated);
    if (supabaseStatus === "connected" && supabaseAutoSync) {
      await saveProduct(newProduct);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    updateLocalStorage("tally_products", updated);
    if (supabaseStatus === "connected" && supabaseAutoSync) {
      await deleteProductFromDb(id);
    }
  };

  const handleAddStaffCode = async (code: string, name: string) => {
    const newStaff = { code, name, createdAt: new Date().toISOString() };
    const updated = [
      ...staffCodes,
      newStaff,
    ];
    setStaffCodes(updated);
    updateLocalStorage("tally_staff", updated);
    if (supabaseStatus === "connected" && supabaseAutoSync) {
      await saveStaffCode(newStaff);
    }
  };

  const handleDeleteStaffCode = async (code: string) => {
    const updated = staffCodes.filter((s) => s.code !== code);
    setStaffCodes(updated);
    updateLocalStorage("tally_staff", updated);
    if (supabaseStatus === "connected" && supabaseAutoSync) {
      await deleteStaffCodeFromDb(code);
    }
  };

  const handleAddCategory = async (name: string) => {
    const newCat = { id: `cat-${Date.now()}`, name };
    const updated = [
      ...categories,
      newCat,
    ];
    setCategories(updated);
    updateLocalStorage("tally_categories", updated);
    if (supabaseStatus === "connected" && supabaseAutoSync) {
      await saveExpenseCategory(newCat);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const updated = categories.filter((c) => c.id !== id);
    setCategories(updated);
    updateLocalStorage("tally_categories", updated);
    if (supabaseStatus === "connected" && supabaseAutoSync) {
      await deleteExpenseCategoryFromDb(id);
    }
  };

  const handleUpdateProduct = async (id: string, name: string, price: number) => {
    const updated = products.map((p) => p.id === id ? { ...p, name, price } : p);
    setProducts(updated);
    updateLocalStorage("tally_products", updated);
    const updatedProd = updated.find(p => p.id === id);
    if (updatedProd && supabaseStatus === "connected" && supabaseAutoSync) {
      await saveProduct(updatedProd);
    }
  };

  const handleUpdateStaffCode = async (oldCode: string, newCode: string, name: string) => {
    const updatedStaff = staffCodes.map((s) => s.code === oldCode ? { ...s, code: newCode, name } : s);
    setStaffCodes(updatedStaff);
    updateLocalStorage("tally_staff", updatedStaff);

    // Update sales and expenses reference to new staff code
    const updatedSales = sales.map((s) => s.staffCode === oldCode ? { ...s, staffCode: newCode } : s);
    setSales(updatedSales);
    updateLocalStorage("tally_sales", updatedSales);

    const updatedExpenses = expenses.map((e) => e.staffCode === oldCode ? { ...e, staffCode: newCode } : e);
    setExpenses(updatedExpenses);
    updateLocalStorage("tally_expenses", updatedExpenses);

    if (supabaseStatus === "connected" && supabaseAutoSync) {
      await deleteStaffCodeFromDb(oldCode);
      const newStaffObj = updatedStaff.find(s => s.code === newCode);
      if (newStaffObj) {
        await saveStaffCode(newStaffObj);
      }
      for (const s of updatedSales) {
        if (s.staffCode === newCode) {
          await saveSale(s);
        }
      }
      for (const e of updatedExpenses) {
        if (e.staffCode === newCode) {
          await saveExpense(e);
        }
      }
    }
  };

  const handleUpdateCategory = async (id: string, name: string, oldName: string) => {
    const updatedCategories = categories.map((c) => c.id === id ? { ...c, name } : c);
    setCategories(updatedCategories);
    updateLocalStorage("tally_categories", updatedCategories);

    // Update category name in past expenses
    const updatedExpenses = expenses.map((e) => e.category === oldName ? { ...e, category: name } : e);
    setExpenses(updatedExpenses);
    updateLocalStorage("tally_expenses", updatedExpenses);

    if (supabaseStatus === "connected" && supabaseAutoSync) {
      const updatedCat = updatedCategories.find(c => c.id === id);
      if (updatedCat) {
        await saveExpenseCategory(updatedCat);
      }
      for (const e of updatedExpenses) {
        if (e.category === name) {
          await saveExpense(e);
        }
      }
    }
  };

  const handleAddExpense = async (newExpense: Expense) => {
    const updated = [...expenses, newExpense];
    setExpenses(updated);
    updateLocalStorage("tally_expenses", updated);
    if (supabaseStatus === "connected" && supabaseAutoSync) {
      await saveExpense(newExpense);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    updateLocalStorage("tally_expenses", updated);
    if (supabaseStatus === "connected" && supabaseAutoSync) {
      await deleteExpenseFromDb(id);
    }
  };

  const handleUpdateExpense = async (id: string, updatedExpense: Expense) => {
    const updated = expenses.map((e) => e.id === id ? updatedExpense : e);
    setExpenses(updated);
    updateLocalStorage("tally_expenses", updated);
    if (supabaseStatus === "connected" && supabaseAutoSync) {
      await saveExpense(updatedExpense);
    }
  };

  const handleSaleComplete = async (newSale: Sale) => {
    const updated = [...sales, newSale];
    setSales(updated);
    updateLocalStorage("tally_sales", updated);
    
    // Open receipt modal automatically
    setActiveReceipt(newSale);
    setIsReceiptOpen(true);

    if (supabaseStatus === "connected" && supabaseAutoSync) {
      await saveSale(newSale);
    }
  };

  const handleDeleteSale = async (id: string) => {
    const updated = sales.filter((s) => s.id !== id);
    setSales(updated);
    updateLocalStorage("tally_sales", updated);
    if (supabaseStatus === "connected" && supabaseAutoSync) {
      await deleteSaleFromDb(id);
    }
  };

  const handleUpdateSale = async (id: string, updatedSale: Sale) => {
    const updated = sales.map((s) => s.id === id ? updatedSale : s);
    setSales(updated);
    updateLocalStorage("tally_sales", updated);
    if (supabaseStatus === "connected" && supabaseAutoSync) {
      await saveSale(updatedSale);
    }
  };

  const handleAddStaffAdvance = async (staffCode: string, amount: number, date: string, note: string) => {
    const newAdvance: StaffAdvance = {
      id: `adv-${Date.now()}`,
      staffCode,
      amount,
      date,
      note
    };
    const updated = [...staffAdvances, newAdvance];
    setStaffAdvances(updated);
    updateLocalStorage("tally_staff_advances", updated);
    if (supabaseStatus === "connected" && supabaseAutoSync) {
      await saveStaffAdvance(newAdvance);
    }
  };

  const handleDeleteStaffAdvance = async (id: string) => {
    const updated = staffAdvances.filter((a) => a.id !== id);
    setStaffAdvances(updated);
    updateLocalStorage("tally_staff_advances", updated);
    if (supabaseStatus === "connected" && supabaseAutoSync) {
      await deleteStaffAdvanceFromDb(id);
    }
  };

  const handleUpdateStaffAdvance = async (id: string, updatedAdvance: StaffAdvance) => {
    const updated = staffAdvances.map((a) => a.id === id ? updatedAdvance : a);
    setStaffAdvances(updated);
    updateLocalStorage("tally_staff_advances", updated);
    if (supabaseStatus === "connected" && supabaseAutoSync) {
      await saveStaffAdvance(updatedAdvance);
    }
  };

  const handleAddMomoLog = async (logData: Omit<MomoLog, "id" | "totalSales">) => {
    const newLog: MomoLog = {
      ...logData,
      id: `momo-${Date.now()}`,
      totalSales: logData.soldQty * logData.unitPrice
    };
    const updated = [...momoLogs, newLog];
    setMomoLogs(updated);
    updateLocalStorage("tally_momo_logs", updated);
    if (supabaseStatus === "connected" && supabaseAutoSync) {
      await saveMomoLog(newLog);
    }
  };

  const handleDeleteMomoLog = async (id: string) => {
    const updated = momoLogs.filter((l) => l.id !== id);
    setMomoLogs(updated);
    updateLocalStorage("tally_momo_logs", updated);
    if (supabaseStatus === "connected" && supabaseAutoSync) {
      await deleteMomoLogFromDb(id);
    }
  };

  const handleUpdateMomoLog = async (id: string, updatedLog: MomoLog) => {
    const updatedObj = {
      ...updatedLog,
      totalSales: updatedLog.soldQty * updatedLog.unitPrice
    };
    const updated = momoLogs.map((l) => l.id === id ? updatedObj : l);
    setMomoLogs(updated);
    updateLocalStorage("tally_momo_logs", updated);
    if (supabaseStatus === "connected" && supabaseAutoSync) {
      await saveMomoLog(updatedObj);
    }
  };

  const handleUpdateStoreName = async (name: string) => {
    setStoreName(name);
    localStorage.setItem("tally_store_name", name);
    if (supabaseStatus === "connected" && supabaseAutoSync) {
      await upsertStoreSetting("tally_store_name", name);
    }
  };

  const handleUpdatePassword = async (newPass: string) => {
    setAdminPasswordHash(newPass);
    localStorage.setItem("tally_admin_password", newPass);
    if (supabaseStatus === "connected" && supabaseAutoSync) {
      await upsertStoreSetting("tally_admin_password", newPass);
    }
  };

  // Backup Import & Export handlers
  const handleExportBackup = () => {
    const fullState = {
      storeName,
      adminPasswordHash,
      products,
      staffCodes,
      categories,
      sales,
      expenses,
    };
    
    const jsonStr = JSON.stringify(fullState, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `Tally_Backup_${storeName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportBackup = (dataStr: string): boolean => {
    try {
      const parsed = JSON.parse(dataStr);
      if (
        parsed.storeName &&
        parsed.products &&
        parsed.staffCodes &&
        parsed.categories &&
        parsed.sales &&
        parsed.expenses
      ) {
        setStoreName(parsed.storeName);
        localStorage.setItem("tally_store_name", parsed.storeName);

        if (parsed.adminPasswordHash) {
          setAdminPasswordHash(parsed.adminPasswordHash);
          localStorage.setItem("tally_admin_password", parsed.adminPasswordHash);
        }

        setProducts(parsed.products);
        updateLocalStorage("tally_products", parsed.products);

        setStaffCodes(parsed.staffCodes);
        updateLocalStorage("tally_staff", parsed.staffCodes);

        setCategories(parsed.categories);
        updateLocalStorage("tally_categories", parsed.categories);

        setSales(parsed.sales);
        updateLocalStorage("tally_sales", parsed.sales);

        setExpenses(parsed.expenses);
        updateLocalStorage("tally_expenses", parsed.expenses);

        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  // Gate Submit handler
  const handleGateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGateError("");
    
    const inputUpper = gateInput.trim().toUpperCase();
    const MASTER_PASSWORD = "@Rana&01625@";

    // 1. Check if matches admin password or master password
    if (gateInput === MASTER_PASSWORD || gateInput === adminPasswordHash) {
      localStorage.setItem("tally_gate_passed", "true");
      localStorage.setItem("activeStaffCode", "ADMIN");
      setActiveStaffCode("ADMIN");
      setIsGatePassed(true);
      setGateInput("");
      return;
    }

    // 2. Check if matches registered staff codes
    const matchedStaff = staffCodes.find(
      (s) => s.code.toUpperCase() === inputUpper
    );

    if (matchedStaff) {
      localStorage.setItem("tally_gate_passed", "true");
      localStorage.setItem("activeStaffCode", matchedStaff.code);
      setActiveStaffCode(matchedStaff.code);
      setIsGatePassed(true);
      setGateInput("");
    } else {
      setGateError("ভুল কর্মী কোড বা পাসওয়ার্ড! দয়া করে সঠিক কোডটি পুনরায় প্রদান করুন।");
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("tally_gate_passed");
    localStorage.removeItem("activeStaffCode");
    setActiveStaffCode("");
    setIsGatePassed(false);
  };

  // Navigation Links definition
  const menuItems = [
    { id: "dashboard" as const, label: "ড্যাশবোর্ড (হিসাব)", icon: LayoutDashboard },
    { id: "pos" as const, label: "নতুন বিক্রয় (POS)", icon: ShoppingCart },
    { id: "expenses" as const, label: "নতুন খরচ এন্ট্রি", icon: DollarSign },
    { id: "momo" as const, label: "মোমো স্টক ও বিক্রয়", icon: Store },
    { id: "admin" as const, label: "এডমিন প্যানেল", icon: Lock },
  ];

  const allowedMenuItems = menuItems.filter(item => {
    if (activeStaffCode !== "ADMIN") {
      return item.id === "pos" || item.id === "expenses";
    }
    return true;
  });

  // GATE / LOCK SCREEN RENDER IF NOT AUTHENTICATED
  if (!isGatePassed) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white antialiased">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800/80 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
          {/* Logo */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/10 mb-4 border border-blue-500/20">
              <Store className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-extrabold text-blue-400 tracking-wide">{storeName}</h1>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">ডিজিটাল ক্যাশ কাউন্টার ও লেজার খাতা</p>
          </div>

          <div className="border-t border-slate-800/80 pt-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-200">সিস্টেমে প্রবেশ গেটওয়ে</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              সফ্টওয়্যারে প্রবেশ করতে আপনার নির্ধারিত <span className="text-blue-400 font-bold">বিক্রয়কর্মী কোড</span> অথবা <span className="text-blue-400 font-bold">এডমিন পাসওয়ার্ড</span> প্রদান করুন।
            </p>
          </div>

          <form onSubmit={handleGateSubmit} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 block tracking-wide">কর্মী কোড বা পাসওয়ার্ড</label>
              <div className="relative">
                <input
                  type={showGatePassword ? "text" : "password"}
                  value={gateInput}
                  onChange={(e) => setGateInput(e.target.value)}
                  placeholder="কোড বা পাসওয়ার্ড লিখুন..."
                  className="w-full pl-4 pr-11 py-3 bg-slate-800/50 border border-slate-700/80 rounded-xl text-xs font-bold text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:bg-slate-800 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowGatePassword(!showGatePassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showGatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {gateError && (
              <p className="text-[11px] text-rose-400 font-bold bg-rose-950/20 border border-rose-900/30 px-3 py-2.5 rounded-xl text-center">
                ⚠️ {gateError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/10 cursor-pointer hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span>প্রবেশ করুন</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono">
            <p>© {new Date().getFullYear()} {storeName}</p>
            <p className="mt-1 opacity-75">ভার্সন ২.১.০ • ডেভেলপার: মাসুদ রানা</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 font-sans antialiased pb-20 md:pb-0">
      
      {/* PERSISTENT LEFT SIDEBAR FOR DESKTOP (PC) */}
      <aside id="desktop-sidebar" className="hidden md:flex flex-col w-72 bg-slate-900 text-white shrink-0 border-r border-slate-800 sticky top-0 h-screen">
        
        {/* Brand Banner */}
        <div className="p-6 border-b border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <Store className="w-5 h-5 font-bold" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-wide text-blue-400 truncate max-w-[160px] leading-tight">
                {storeName}
              </h1>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">
                স্মার্ট একাউন্টিং
              </span>
              <div className="mt-1.5 flex">
                {supabaseStatus === "connected" && (
                  <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[9px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    ক্লাউড সিঙ্কড (Supabase)
                  </span>
                )}
                {supabaseStatus === "loading" && (
                  <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-[9px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce"></span>
                    সিঙ্ক হচ্ছে...
                  </span>
                )}
                {supabaseStatus === "error" && (
                  <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full text-[9px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                    অফলাইন মোড (লোকাল)
                  </span>
                )}
                {supabaseStatus === "not-configured" && (
                  <span className="inline-flex items-center gap-1 bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2 py-0.5 rounded-full text-[9px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    লোকাল মোড
                  </span>
                )}
              </div>
            </div>
          </div>
 
          {/* Time & Date display */}
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/30 text-[11px] space-y-1.5">
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>{currentTime.toLocaleDateString("bn-BD", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="font-mono font-bold tracking-wider">{currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
            </div>
          </div>
        </div>
 
        {/* Sidebar Navigation Links */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {allowedMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? "translate-x-0.5 text-white" : "text-slate-600"}`} />
              </button>
            );
          })}
        </nav>
 
        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 text-center space-y-3">
          <button
            onClick={handleLogout}
            className="w-full py-1.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-200 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-300 transition-all cursor-pointer flex items-center justify-center gap-1.5 uppercase"
          >
            <Lock className="w-3 h-3" />
            <span>নিরাপদ প্রস্থান (লগআউট)</span>
          </button>
          <div className="text-[10px] text-slate-500 font-mono">
            <p>© {new Date().getFullYear()} {storeName}</p>
            <p className="mt-1 opacity-70">ভার্সন ২.১.০ • ডেভেলপার: মাসুদ রানা</p>
          </div>
        </div>
      </aside>
 
      {/* MOBILE HEADER (Phones) */}
      <header id="mobile-header" className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0">
            <Store className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-xs text-blue-400 truncate max-w-[150px]">
              {storeName}
            </h1>
            <span className="text-[8px] text-slate-400 font-bold tracking-wider block uppercase mt-0.5">
              স্মার্ট একাউন্টিং
            </span>
            <div className="mt-0.5">
              {supabaseStatus === "connected" && (
                <span className="inline-flex items-center gap-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.2 rounded-full text-[8px] font-semibold">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                  ক্লাউড সিঙ্কড
                </span>
              )}
              {supabaseStatus === "loading" && (
                <span className="inline-flex items-center gap-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-0.2 rounded-full text-[8px] font-semibold">
                  <span className="w-1 h-1 rounded-full bg-amber-400 animate-bounce"></span>
                  সিঙ্ক হচ্ছে...
                </span>
              )}
              {(supabaseStatus === "error" || supabaseStatus === "not-configured") && (
                <span className="inline-flex items-center gap-0.5 bg-slate-500/10 text-slate-400 border border-slate-500/20 px-1 py-0.2 rounded-full text-[8px] font-semibold">
                  <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                  অফলাইন মোড
                </span>
              )}
            </div>
          </div>
        </div>
 
        {/* Quick Date display for Mobile Header */}
        <div className="flex items-center gap-3 text-right text-[10px] text-slate-400">
          <span className="font-mono font-bold">{currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
          <button
            onClick={handleLogout}
            className="p-1.5 bg-slate-800 text-rose-400 hover:text-rose-300 rounded-lg border border-slate-700/60"
            title="লগআউট"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>
 
      {/* CORE WORKSPACE / CONTENT PANEL */}
      <main className="flex-1 overflow-y-auto max-w-7xl mx-auto w-full p-4 md:p-8">
        
        {/* Render Active View Tab */}
        <div className="animate-fade-in duration-300">
          {activeTab === "dashboard" && (
            <Dashboard 
              sales={sales} 
              expenses={expenses} 
              storeName={storeName} 
              onNavigate={(tab) => setActiveTab(tab as any)}
            />
          )}
 
          {activeTab === "pos" && (
            <POS 
              products={products} 
              staffCodes={staffCodes} 
              onSaleComplete={handleSaleComplete} 
            />
          )}
 
          {activeTab === "expenses" && (
            <Expenses 
              categories={categories} 
              staffCodes={staffCodes} 
              expenses={expenses} 
              onAddExpense={handleAddExpense} 
              onDeleteExpense={handleDeleteExpense}
              onUpdateExpense={handleUpdateExpense}
              staffAdvances={staffAdvances}
              onAddStaffAdvance={handleAddStaffAdvance}
              onDeleteStaffAdvance={handleDeleteStaffAdvance}
              onUpdateStaffAdvance={handleUpdateStaffAdvance}
            />
          )}
 
          {activeTab === "admin" && (
            <AdminPanel 
              products={products}
              staffCodes={staffCodes}
              categories={categories}
              sales={sales}
              expenses={expenses}
              storeName={storeName}
              adminPasswordHash={adminPasswordHash}
              
              // Supabase Props
              isSupabaseEnabled={isSupabaseConfigured}
              isSupabaseConnected={supabaseStatus === "connected"}
              supabaseSyncing={supabaseSyncing}
              supabaseError={supabaseError}
              supabaseAutoSync={supabaseAutoSync}
              onToggleSupabaseAutoSync={handleToggleSupabaseAutoSync}
              onSupabasePush={handleSupabasePush}
              onSupabasePull={handleSupabasePull}
              onSupabaseCheckStatus={handleSupabaseCheckStatus}
              
              onAddProduct={handleAddProduct}
              onDeleteProduct={handleDeleteProduct}
              onUpdateProduct={handleUpdateProduct}
              onAddStaffCode={handleAddStaffCode}
              onDeleteStaffCode={handleDeleteStaffCode}
              onUpdateStaffCode={handleUpdateStaffCode}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteSale={handleDeleteSale}
              onUpdateSale={handleUpdateSale}
              onDeleteExpense={handleDeleteExpense}
              onUpdateExpense={handleUpdateExpense}
              onUpdateStoreName={handleUpdateStoreName}
              onUpdatePassword={handleUpdatePassword}
              onImportBackup={handleImportBackup}
              onExportBackup={handleExportBackup}
            />
          )}

          {activeTab === "momo" && (
            <MomoPartnership
              momoLogs={momoLogs}
              onAddMomoLog={handleAddMomoLog}
              onDeleteMomoLog={handleDeleteMomoLog}
              onUpdateMomoLog={handleUpdateMomoLog}
            />
          )}
        </div>
 
      </main>
 
      {/* MOBILE FIXED BOTTOM NAVIGATION BAR */}
      <nav id="mobile-bottom-nav" className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 grid py-2 z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]" style={{ gridTemplateColumns: `repeat(${allowedMenuItems.length}, minmax(0, 1fr))` }}>
        {allowedMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
              }}
              className="flex flex-col items-center justify-center text-center gap-1 cursor-pointer"
            >
              <div className={`p-1 rounded-xl transition-all ${
                isActive ? "bg-blue-50 text-blue-600" : "text-slate-400"
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[9px] font-bold ${
                isActive ? "text-blue-900" : "text-slate-400"
              }`}>
                {item.label.split(" ")[0]} {/* First word for mobile navbar */}
              </span>
            </button>
          );
        })}
      </nav>
 
      {/* GLOBAL POS THERMAL RECEIPT SLIP MODAL */}
      <POSReceiptModal 
        isOpen={isReceiptOpen} 
        onClose={() => setIsReceiptOpen(false)} 
        sale={activeReceipt} 
        storeName={storeName} 
        staffCodes={staffCodes}
      />
 
    </div>
  );
}
