import { createClient } from "@supabase/supabase-js";
import { Product, StaffCode, ExpenseCategory, Sale, Expense, StaffAdvance, MomoLog } from "./types";

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Initialize Supabase Client safely
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Copyable SQL queries for the user to set up their database
export const SETUP_SQL_CODE = `-- ১. settings টেবিল তৈরি করুন
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- ২. products টেবিল তৈরি করুন
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  created_at TEXT NOT NULL
);

-- ৩. staff_codes টেবিল তৈরি করুন
CREATE TABLE IF NOT EXISTS staff_codes (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- ৪. expense_categories টেবিল তৈরি করুন
CREATE TABLE IF NOT EXISTS expense_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- ৫. sales টেবিল তৈরি করুন (পেমেন্ট টাইপ সহ আপডেট করা হয়েছে)
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  invoice_no TEXT NOT NULL,
  date TEXT NOT NULL,
  items JSONB NOT NULL,
  discount NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  staff_code TEXT NOT NULL,
  received_amount NUMERIC NOT NULL,
  change_amount NUMERIC NOT NULL,
  payment_type TEXT DEFAULT 'Cash',
  payment_details TEXT
);

-- ৬. expenses টেবিল তৈরি করুন
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date TEXT NOT NULL,
  note TEXT NOT NULL,
  staff_code TEXT NOT NULL
);

-- ৭. staff_advances টেবিল তৈরি করুন (কর্মীদের দৈনিক টাকা নেয়ার হিসাব)
CREATE TABLE IF NOT EXISTS staff_advances (
  id TEXT PRIMARY KEY,
  staff_code TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date TEXT NOT NULL,
  note TEXT
);

-- ৮. momo_logs টেবিল তৈরি করুন (মোমো পার্টনারশিপ ব্যবসার হিসাব)
CREATE TABLE IF NOT EXISTS momo_logs (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  received_qty INTEGER NOT NULL,
  paid_qty INTEGER DEFAULT 0,
  purchase_price NUMERIC DEFAULT 8,
  sold_qty INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_sales NUMERIC NOT NULL,
  expense NUMERIC NOT NULL,
  partner_share_percent NUMERIC NOT NULL,
  note TEXT
);

-- পূর্বের ডাটাবেজ আপডেট করার জন্য নিচের কুয়েরিগুলো রান করুন (যদি অলরেডি টেবিল তৈরি থাকে):
ALTER TABLE momo_logs ADD COLUMN IF NOT EXISTS paid_qty INTEGER DEFAULT 0;
ALTER TABLE momo_logs ADD COLUMN IF NOT EXISTS purchase_price NUMERIC DEFAULT 8;

-- ৯. সব টেবিলের RLS নিষ্ক্রিয় অথবা পাবলিক এক্সেস পলিসি তৈরি করুন
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE momo_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read-write for settings" ON settings;
CREATE POLICY "Allow public read-write for settings" ON settings FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public read-write for products" ON products;
CREATE POLICY "Allow public read-write for products" ON products FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public read-write for staff_codes" ON staff_codes;
CREATE POLICY "Allow public read-write for staff_codes" ON staff_codes FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public read-write for expense_categories" ON expense_categories;
CREATE POLICY "Allow public read-write for expense_categories" ON expense_categories FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public read-write for sales" ON sales;
CREATE POLICY "Allow public read-write for sales" ON sales FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public read-write for expenses" ON expenses;
CREATE POLICY "Allow public read-write for expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public read-write for staff_advances" ON staff_advances;
CREATE POLICY "Allow public read-write for staff_advances" ON staff_advances FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read-write for momo_logs" ON momo_logs;
CREATE POLICY "Allow public read-write for momo_logs" ON momo_logs FOR ALL USING (true) WITH CHECK (true);`;

// GRACEFUL SYNC HELPERS

export async function checkTablesExist(): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "Supabase কনফিগার করা হয়নি।" };
  try {
    const { error } = await supabase.from("settings").select("key").limit(1);
    if (error) {
      if (error.code === "PGRST116" || error.code === "42P01") {
        return { ok: false, error: "Supabase-এ টেবিলগুলো তৈরি করা নেই! অনুগ্রহ করে ডান পাশের SQL রান করুন।" };
      }
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "কানেকশন এরর।" };
  }
}

// 1. Config Sync
export async function uploadConfig(storeName: string, adminPasswordHash: string) {
  if (!supabase) return;
  await supabase.from("settings").upsert([
    { key: "store_name", value: storeName },
    { key: "admin_password", value: adminPasswordHash },
  ]);
}

export async function downloadConfig(): Promise<{ storeName: string; adminPasswordHash: string } | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("settings").select("*");
  if (error || !data || data.length === 0) return null;
  const storeNameObj = data.find((row) => row.key === "store_name");
  const pwdObj = data.find((row) => row.key === "admin_password");
  return {
    storeName: storeNameObj ? storeNameObj.value : "বাদশা ভাইয়ের ট্যালী খাতা",
    adminPasswordHash: pwdObj ? pwdObj.value : "1234",
  };
}

export async function upsertStoreSetting(key: "tally_store_name" | "tally_admin_password", value: string): Promise<void> {
  if (!supabase) return;
  try {
    const dbKey = key === "tally_store_name" ? "store_name" : "admin_password";
    const { error } = await supabase.from("settings").upsert({ key: dbKey, value });
    if (error) throw error;
  } catch (err) {
    console.error(`Error saving setting ${key}:`, err);
  }
}

// 2. Products Sync
export async function uploadProducts(products: Product[]) {
  if (!supabase) return;
  const ids = products.map(p => p.id);
  if (ids.length > 0) {
    await supabase.from("products").delete().not("id", "in", `(${ids.join(",")})`);
  } else {
    await supabase.from("products").delete().neq("id", "");
  }
  if (products.length === 0) return;
  const formatted = products.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    created_at: p.createdAt
  }));
  const { error } = await supabase.from("products").upsert(formatted);
  if (error) throw error;
}

export async function downloadProducts(): Promise<Product[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("products").select("*");
  if (error) return null;
  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    price: Number(row.price),
    createdAt: row.created_at
  }));
}

export async function saveProduct(product: Product): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("products").upsert({
      id: product.id,
      name: product.name,
      price: product.price,
      created_at: product.createdAt
    });
    if (error) throw error;
  } catch (err) {
    console.error("Error saving product:", err);
  }
}

export async function deleteProductFromDb(id: string): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
  } catch (err) {
    console.error("Error deleting product:", err);
  }
}

// 3. Staff Sync
export async function uploadStaff(staff: StaffCode[]) {
  if (!supabase) return;
  const formatted = staff.map(s => ({
    code: s.code,
    name: s.name,
    created_at: s.createdAt
  }));
  const { error } = await supabase.from("staff_codes").upsert(formatted);
  if (error) throw error;
}

export async function downloadStaff(): Promise<StaffCode[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("staff_codes").select("*");
  if (error) return null;
  return (data || []).map(row => ({
    code: row.code,
    name: row.name,
    createdAt: row.created_at
  }));
}

export async function saveStaffCode(staff: StaffCode): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("staff_codes").upsert({
      code: staff.code,
      name: staff.name,
      created_at: staff.createdAt
    });
    if (error) throw error;
  } catch (err) {
    console.error("Error saving staff code:", err);
  }
}

export async function deleteStaffCodeFromDb(code: string): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("staff_codes").delete().eq("code", code);
    if (error) throw error;
  } catch (err) {
    console.error("Error deleting staff code:", err);
  }
}

// 4. Categories Sync
export async function uploadCategories(categories: ExpenseCategory[]) {
  if (!supabase) return;
  const formatted = categories.map(c => ({
    id: c.id,
    name: c.name
  }));
  const { error } = await supabase.from("expense_categories").upsert(formatted);
  if (error) throw error;
}

export async function downloadCategories(): Promise<ExpenseCategory[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("expense_categories").select("*");
  if (error) return null;
  return data as ExpenseCategory[];
}

export async function saveExpenseCategory(category: ExpenseCategory): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("expense_categories").upsert({
      id: category.id,
      name: category.name
    });
    if (error) throw error;
  } catch (err) {
    console.error("Error saving expense category:", err);
  }
}

export async function deleteExpenseCategoryFromDb(id: string): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("expense_categories").delete().eq("id", id);
    if (error) throw error;
  } catch (err) {
    console.error("Error deleting expense category:", err);
  }
}

// 5. Sales Sync
export async function uploadSales(sales: Sale[]) {
  if (!supabase) return;
  const ids = sales.map(s => s.id);
  if (ids.length > 0) {
    await supabase.from("sales").delete().not("id", "in", `(${ids.join(",")})`);
  } else {
    await supabase.from("sales").delete().neq("id", "");
  }
  if (sales.length === 0) return;
  
  // Deep clone and format objects for JSON compatibility
  const formatted = sales.map(s => ({
    id: s.id,
    invoice_no: s.invoiceNo,
    date: s.date,
    items: JSON.parse(JSON.stringify(s.items)), // array of sale items as jsonb
    discount: s.discount,
    subtotal: s.subtotal,
    total: s.total,
    staff_code: s.staffCode,
    received_amount: s.receivedAmount,
    change_amount: s.changeAmount,
    payment_type: s.paymentType || "Cash",
    payment_details: s.paymentDetails || ""
  }));
  const { error } = await supabase.from("sales").upsert(formatted);
  if (error) throw error;
}

export async function downloadSales(): Promise<Sale[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("sales").select("*");
  if (error) return null;
  return (data || []).map(row => ({
    id: row.id,
    invoiceNo: row.invoice_no,
    date: row.date,
    items: typeof row.items === "string" ? JSON.parse(row.items) : row.items,
    discount: Number(row.discount || 0),
    subtotal: Number(row.subtotal),
    total: Number(row.total),
    staffCode: row.staff_code,
    receivedAmount: Number(row.received_amount),
    changeAmount: Number(row.change_amount),
    paymentType: row.payment_type || "Cash",
    paymentDetails: row.payment_details || ""
  }));
}

export async function saveSale(sale: Sale): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("sales").upsert({
      id: sale.id,
      invoice_no: sale.invoiceNo,
      date: sale.date,
      items: sale.items,
      discount: sale.discount,
      subtotal: sale.subtotal,
      total: sale.total,
      staff_code: sale.staffCode,
      received_amount: sale.receivedAmount,
      change_amount: sale.changeAmount,
      payment_type: sale.paymentType || "Cash",
      payment_details: sale.paymentDetails || ""
    });
    if (error) throw error;
  } catch (err) {
    console.error("Error saving sale:", err);
  }
}

export async function deleteSaleFromDb(id: string): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("sales").delete().eq("id", id);
    if (error) throw error;
  } catch (err) {
    console.error("Error deleting sale:", err);
  }
}

// 6. Expenses Sync
export async function uploadExpenses(expenses: Expense[]) {
  if (!supabase) return;
  const ids = expenses.map(e => e.id);
  if (ids.length > 0) {
    await supabase.from("expenses").delete().not("id", "in", `(${ids.join(",")})`);
  } else {
    await supabase.from("expenses").delete().neq("id", "");
  }
  if (expenses.length === 0) return;

  const formatted = expenses.map(e => ({
    id: e.id,
    category: e.category,
    amount: e.amount,
    date: e.date,
    note: e.note || "",
    staff_code: e.staffCode
  }));
  const { error } = await supabase.from("expenses").upsert(formatted);
  if (error) throw error;
}

export async function downloadExpenses(): Promise<Expense[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("expenses").select("*");
  if (error) return null;
  return (data || []).map(row => ({
    id: row.id,
    category: row.category,
    amount: Number(row.amount),
    date: row.date,
    note: row.note || "",
    staffCode: row.staff_code
  }));
}

export async function saveExpense(expense: Expense): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("expenses").upsert({
      id: expense.id,
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      note: expense.note || "",
      staff_code: expense.staffCode
    });
    if (error) throw error;
  } catch (err) {
    console.error("Error saving expense:", err);
  }
}

export async function deleteExpenseFromDb(id: string): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) throw error;
  } catch (err) {
    console.error("Error deleting expense:", err);
  }
}

// 7. Staff Advances Sync
export async function uploadStaffAdvances(advances: StaffAdvance[]) {
  if (!supabase) return;
  const ids = advances.map(a => a.id);
  if (ids.length > 0) {
    await supabase.from("staff_advances").delete().not("id", "in", `(${ids.join(",")})`);
  } else {
    await supabase.from("staff_advances").delete().neq("id", "");
  }
  if (advances.length === 0) return;

  const formatted = advances.map(a => ({
    id: a.id,
    staff_code: a.staffCode,
    amount: a.amount,
    date: a.date,
    note: a.note || ""
  }));
  const { error } = await supabase.from("staff_advances").upsert(formatted);
  if (error) throw error;
}

export async function downloadStaffAdvances(): Promise<StaffAdvance[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("staff_advances").select("*");
  if (error) return null;
  return (data || []).map(row => ({
    id: row.id,
    staffCode: row.staff_code,
    amount: Number(row.amount),
    date: row.date,
    note: row.note || ""
  }));
}

export async function saveStaffAdvance(advance: StaffAdvance): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("staff_advances").upsert({
      id: advance.id,
      staff_code: advance.staffCode,
      amount: advance.amount,
      date: advance.date,
      note: advance.note || ""
    });
    if (error) throw error;
  } catch (err) {
    console.error("Error saving staff advance:", err);
  }
}

export async function deleteStaffAdvanceFromDb(id: string): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("staff_advances").delete().eq("id", id);
    if (error) throw error;
  } catch (err) {
    console.error("Error deleting staff advance:", err);
  }
}

// 8. Momo Logs Sync
export async function uploadMomoLogs(logs: MomoLog[]) {
  if (!supabase) return;
  const ids = logs.map(l => l.id);
  if (ids.length > 0) {
    await supabase.from("momo_logs").delete().not("id", "in", `(${ids.join(",")})`);
  } else {
    await supabase.from("momo_logs").delete().neq("id", "");
  }
  if (logs.length === 0) return;

  const formatted = logs.map(l => {
    return {
      id: l.id,
      date: l.date,
      received_qty: l.receivedQty,
      paid_qty: l.paidQty !== undefined ? l.paidQty : 0,
      purchase_price: l.purchasePrice !== undefined ? l.purchasePrice : 8,
      sold_qty: l.soldQty,
      unit_price: l.unitPrice,
      total_sales: l.totalSales,
      expense: l.expense,
      partner_share_percent: l.partnerSharePercent,
      note: l.note || ""
    };
  });
  const { error } = await supabase.from("momo_logs").upsert(formatted);
  if (error) throw error;
}

export async function downloadMomoLogs(): Promise<MomoLog[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("momo_logs").select("*");
  if (error) return null;
  return (data || []).map(row => {
    const fullNote = row.note || "";
    const match = fullNote.match(/\[META:(\{.*?\})\]/);
    
    // Default values from native columns if present, otherwise default to 0 and 8
    let paidQty = row.paid_qty !== undefined && row.paid_qty !== null ? Number(row.paid_qty) : 0;
    let purchasePrice = row.purchase_price !== undefined && row.purchase_price !== null ? Number(row.purchase_price) : 8;
    let note = fullNote;

    if (match) {
      try {
        const meta = JSON.parse(match[1]);
        note = fullNote.replace(/\s*\[META:\{.*?\}\]\s*$/, "").trim();
        // If native columns were default or null, fallback to metadata parsing for backward compatibility
        if (paidQty === 0 && meta.pq !== undefined) {
          paidQty = Number(meta.pq) || 0;
        }
        if ((purchasePrice === 8 || purchasePrice === 0) && meta.pp !== undefined) {
          purchasePrice = Number(meta.pp) || 8;
        }
      } catch (e) {}
    }

    return {
      id: row.id,
      date: row.date,
      receivedQty: Number(row.received_qty),
      soldQty: Number(row.sold_qty),
      unitPrice: Number(row.unit_price),
      totalSales: Number(row.total_sales),
      expense: Number(row.expense || 0),
      partnerSharePercent: Number(row.partner_share_percent || 50),
      note: note,
      paidQty,
      purchasePrice
    };
  });
}

export async function saveMomoLog(log: MomoLog): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("momo_logs").upsert({
      id: log.id,
      date: log.date,
      received_qty: log.receivedQty,
      paid_qty: log.paidQty !== undefined ? log.paidQty : 0,
      purchase_price: log.purchasePrice !== undefined ? log.purchasePrice : 8,
      sold_qty: log.soldQty,
      unit_price: log.unitPrice,
      total_sales: log.totalSales,
      expense: log.expense,
      partner_share_percent: log.partnerSharePercent,
      note: log.note || ""
    });
    if (error) throw error;
  } catch (err) {
    console.error("Error saving momo log:", err);
  }
}

export async function deleteMomoLogFromDb(id: string): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("momo_logs").delete().eq("id", id);
    if (error) throw error;
  } catch (err) {
    console.error("Error deleting momo log:", err);
  }
}

// FULL TWO-WAY SYNC CORE LOGIC
export async function fullSyncToSupabase(data: {
  storeName: string;
  adminPasswordHash: string;
  products: Product[];
  staffCodes: StaffCode[];
  categories: ExpenseCategory[];
  sales: Sale[];
  expenses: Expense[];
  staffAdvances: StaffAdvance[];
  momoLogs: MomoLog[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    const tableCheck = await checkTablesExist();
    if (!tableCheck.ok) {
      return { success: false, error: tableCheck.error };
    }

    // Sync all to Supabase (Upsert pattern keeps existing, adds new)
    await uploadConfig(data.storeName, data.adminPasswordHash);
    await uploadProducts(data.products);
    await uploadStaff(data.staffCodes);
    await uploadCategories(data.categories);
    await uploadSales(data.sales);
    await uploadExpenses(data.expenses);
    await uploadStaffAdvances(data.staffAdvances);
    await uploadMomoLogs(data.momoLogs);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "ডাটা সিঙ্ক করার সময় সমস্যা হয়েছে।" };
  }
}

export async function fullSyncFromSupabase(): Promise<{
  success: boolean;
  error?: string;
  data?: {
    storeName?: string;
    adminPasswordHash?: string;
    products?: Product[];
    staffCodes?: StaffCode[];
    categories?: ExpenseCategory[];
    sales?: Sale[];
    expenses?: Expense[];
    staffAdvances?: StaffAdvance[];
    momoLogs?: MomoLog[];
  };
}> {
  try {
    const tableCheck = await checkTablesExist();
    if (!tableCheck.ok) {
      return { success: false, error: tableCheck.error };
    }

    const config = await downloadConfig();
    const products = await downloadProducts();
    const staffCodes = await downloadStaff();
    const categories = await downloadCategories();
    const sales = await downloadSales();
    const expenses = await downloadExpenses();
    const staffAdvances = await downloadStaffAdvances();
    const momoLogs = await downloadMomoLogs();

    return {
      success: true,
      data: {
        storeName: config?.storeName,
        adminPasswordHash: config?.adminPasswordHash,
        products: products || undefined,
        staffCodes: staffCodes || undefined,
        categories: categories || undefined,
        sales: sales || undefined,
        expenses: expenses || undefined,
        staffAdvances: staffAdvances || undefined,
        momoLogs: momoLogs || undefined,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "ডাটা ডাউনলোড করার সময় সমস্যা হয়েছে।" };
  }
}
