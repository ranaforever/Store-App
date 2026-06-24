import React from "react";
import { Sale, Expense } from "../types";
import { formatCurrency, toBengaliDigits, formatDateBengali } from "../utils";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, RefreshCcw, Calendar, ShoppingCart, Landmark } from "lucide-react";

interface DashboardProps {
  sales: Sale[];
  expenses: Expense[];
  storeName: string;
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ sales, expenses, storeName, onNavigate }: DashboardProps) {
  const [filterRange, setFilterRange] = React.useState<"all" | "today" | "week" | "month">("all");

  // Filter items based on selected range
  const filterByRange = <T extends { date: string }>(items: T[]): T[] => {
    if (filterRange === "all") return items;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return items.filter((item) => {
      const itemDate = new Date(item.date);
      if (filterRange === "today") {
        return itemDate >= startOfToday;
      } else if (filterRange === "week") {
        const oneWeekAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
        return itemDate >= oneWeekAgo;
      } else if (filterRange === "month") {
        const oneMonthAgo = new Date(startOfToday.getFullYear(), startOfToday.getMonth() - 1, startOfToday.getDate());
        return itemDate >= oneMonthAgo;
      }
      return true;
    });
  };

  const filteredSales = filterByRange(sales);
  const filteredExpenses = filterByRange(expenses);

  // Calculate totals
  const totalSales = filteredSales.reduce((acc, sale) => acc + sale.total, 0);
  const totalExpenses = filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0);
  const balance = totalSales - totalExpenses;

  // Combine into a single unified transaction history feed
  const unifiedFeed = [
    ...filteredSales.map((sale) => ({
      id: sale.id,
      type: "sale" as const,
      title: `বিক্রয় রশিদ - ${sale.invoiceNo}`,
      subtitle: `${sale.items.length}টি পণ্য`,
      staffCode: sale.staffCode,
      amount: sale.total,
      date: sale.date,
    })),
    ...filteredExpenses.map((exp) => ({
      id: exp.id,
      type: "expense" as const,
      title: exp.category,
      subtitle: exp.note || "কোন বিবরণ নেই",
      staffCode: exp.staffCode,
      amount: exp.amount,
      date: exp.date,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Generate 7-day sales vs expense chart data
  const getLast7DaysData = () => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      
      const daySales = sales
        .filter((s) => s.date.slice(0, 10) === dateStr)
        .reduce((sum, s) => sum + s.total, 0);
        
      const dayExpenses = expenses
        .filter((e) => e.date.slice(0, 10) === dateStr)
        .reduce((sum, e) => sum + e.amount, 0);

      const dayLabel = date.toLocaleDateString("bn-BD", { weekday: "short" });
      data.push({
        label: dayLabel,
        sales: daySales,
        expenses: dayExpenses,
      });
    }
    return data;
  };

  const chartData = getLast7DaysData();
  const maxVal = Math.max(...chartData.map((d) => Math.max(d.sales, d.expenses)), 1000); // Minimum scale height 1000

  // Category chart data
  const getCategoryExpenseShares = () => {
    const categories: Record<string, number> = {};
    expenses.forEach((e) => {
      categories[e.category] = (categories[e.category] || 0) + e.amount;
    });
    return Object.entries(categories)
      .map(([name, val]) => ({ name, value: val }))
      .sort((a, b) => b.value - a.value);
  };

  const expenseCategories = getCategoryExpenseShares().slice(0, 5);
  const totalExpenseAllTime = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div id="dashboard-tab-container" className="space-y-6">
      
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
            লাইভ আপডেট
          </span>
          <h2 id="dashboard-welcome-heading" className="text-2xl font-bold text-slate-800 mt-2">
            {storeName}
          </h2>
          <p className="text-slate-500 text-sm mt-1">আজকের ব্যবসা পরিচালন ও নগদ হিসাব এক নজরে</p>
        </div>
        
        {/* Quick range filters */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-center">
          {(["all", "today", "week", "month"] as const).map((range) => {
            const labels = { all: "সব হিসাব", today: "আজ", week: "৭ দিন", month: "৩০ দিন" };
            return (
              <button
                key={range}
                onClick={() => setFilterRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterRange === range
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {labels[range]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Numerical Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Total Sales Card */}
        <div id="card-total-sales" className="stat-card bg-white rounded-xl border-l-4 border-l-emerald-500 p-5 shadow-sm border border-slate-200/60 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block">মোট বিক্রয় (আয়)</span>
            <span className="text-2xl font-bold text-slate-800 block">{formatCurrency(totalSales)}</span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{filteredSales.length}টি মেমো সম্পন্ন</span>
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Total Expenses Card */}
        <div id="card-total-expenses" className="stat-card bg-white rounded-xl border-l-4 border-l-rose-500 p-5 shadow-sm border border-slate-200/60 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block">মোট খরচ (ব্যয়)</span>
            <span className="text-2xl font-bold text-slate-800 block">{formatCurrency(totalExpenses)}</span>
            <span className="text-xs text-rose-600 font-semibold flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>{filteredExpenses.length}টি এন্ট্রি</span>
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <TrendingDown className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Balance Card */}
        <div id="card-balance" className="stat-card bg-white rounded-xl border-l-4 border-l-blue-500 p-5 shadow-sm border border-slate-200/60 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block">অবশিষ্ট ক্যাশ (লাভ/ক্ষতি)</span>
            <span className={`text-2xl font-bold block ${balance >= 0 ? "text-slate-800" : "text-rose-600"}`}>
              {formatCurrency(balance)}
            </span>
            <span className={`text-xs font-semibold flex items-center gap-1 ${balance >= 0 ? "text-blue-600" : "text-rose-600"}`}>
              <Wallet className="w-3.5 h-3.5" />
              <span>{balance >= 0 ? "ক্যাশ পজিটিভ" : "ব্যয় বেশি রয়েছে"}</span>
            </span>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${balance >= 0 ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"}`}>
            <Landmark className="w-5.5 h-5.5" />
          </div>
        </div>

      </div>

      {/* Analytics Visualizations (Two Columns on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Custom SVG Bar Chart - past 7 days */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs lg:col-span-8 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>বিগত ৭ দিনের আয় ও ব্যয় তুলনা</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">সবুজ স্তম্ভে বিক্রয় এবং লাল স্তম্ভে খরচ বোঝানো হয়েছে</p>
          </div>

          {/* SVG Canvas Chart */}
          <div className="h-64 mt-6 flex flex-col justify-between">
            {/* Chart Area */}
            <div className="flex-1 flex items-end justify-around gap-2 px-2 relative border-b border-slate-100 pb-2">
              {/* Grid background guidelines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                <div className="border-t border-slate-100 w-full" />
                <div className="border-t border-slate-100 w-full" />
                <div className="border-t border-slate-100 w-full" />
              </div>

              {chartData.map((day, idx) => {
                const salesHeight = Math.max((day.sales / maxVal) * 100, 2); // Minimum 2% height for empty bars to render cleanly
                const expensesHeight = Math.max((day.expenses / maxVal) * 100, 2);

                return (
                  <div key={idx} className="flex flex-col items-center flex-1 h-full max-w-[50px] relative group">
                    
                    {/* Tooltip on Hover */}
                    <div className="absolute bottom-full mb-2 bg-slate-800 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg min-w-[80px] text-center">
                      <p className="font-semibold text-amber-400">{day.label}</p>
                      <p>বিক্রয়: ৳{day.sales}</p>
                      <p>খরচ: ৳{day.expenses}</p>
                    </div>

                    {/* Bars Container */}
                    <div className="flex items-end justify-center gap-1.5 w-full h-[85%] pb-1">
                      {/* Sales Bar */}
                      <div 
                        className="w-4 rounded-t-md bg-emerald-500 hover:bg-emerald-600 transition-all duration-500"
                        style={{ height: `${salesHeight}%` }}
                      />
                      {/* Expenses Bar */}
                      <div 
                        className="w-4 rounded-t-md bg-rose-400 hover:bg-rose-500 transition-all duration-500"
                        style={{ height: `${expensesHeight}%` }}
                      />
                    </div>

                    {/* X-axis Label */}
                    <span className="text-[10px] text-slate-500 font-medium truncate w-full text-center mt-1">
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Chart Legends */}
            <div className="flex items-center gap-4 px-2 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-emerald-500 rounded-xs" />
                <span className="text-[10px] text-slate-500 font-medium">বিক্রয় (৳)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-rose-400 rounded-xs" />
                <span className="text-[10px] text-slate-500 font-medium">খরচ (৳)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Expense Category Share */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs lg:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">খরচের প্রধান খাতসমূহ</h3>
            <p className="text-xs text-slate-400 mt-1">কোন খাতে কত বেশি খরচ হয়েছে</p>
          </div>

          <div className="flex-1 flex flex-col justify-center mt-6 space-y-4">
            {expenseCategories.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                কোন খরচের রেকর্ড পাওয়া যায়নি
              </div>
            ) : (
              expenseCategories.map((cat, idx) => {
                const percentage = totalExpenseAllTime > 0 ? (cat.value / totalExpenseAllTime) * 100 : 0;
                
                // Color array
                const colors = ["bg-rose-500", "bg-orange-400", "bg-amber-400", "bg-indigo-400", "bg-sky-400"];
                const colorClass = colors[idx % colors.length];

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">{cat.name}</span>
                      <span className="font-bold text-slate-500">
                        {formatCurrency(cat.value)} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    {/* Progress Bar background */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${colorClass} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {expenses.length > 0 && (
            <div className="pt-4 border-t border-slate-100 mt-4 text-center">
              <span className="text-[10px] text-slate-400 font-medium">
                সর্বমোট সর্বকালীন ব্যয়: <strong className="text-slate-700">{formatCurrency(totalExpenseAllTime)}</strong>
              </span>
            </div>
          )}
        </div>

      </div>

      {/* Unified Transaction Tally Feed */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <RefreshCcw className="w-4 h-4 text-blue-600" />
              <span>আজকের খাতা (লেজার বুক)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">সবচেয়ে সাম্প্রতিক লেনদেনসমূহ আগে দেখানো হয়েছে</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onNavigate("pos")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all shadow-sm shadow-blue-100"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>বিক্রয় করুন</span>
            </button>
          </div>
        </div>

        {unifiedFeed.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            এই সময়কালের কোন লেনদেন বা খরচের রেকর্ড পাওয়া যায়নি।
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
            {unifiedFeed.slice(0, 10).map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 hover:bg-slate-50/50 px-2 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    item.type === "sale" 
                      ? "bg-emerald-50 text-emerald-600" 
                      : "bg-rose-50 text-rose-600"
                  }`}>
                    {item.type === "sale" ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400">{item.subtitle}</span>
                      {item.staffCode && (
                        <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          item.type === "sale" 
                            ? "bg-blue-50 text-blue-700 border border-blue-100/50" 
                            : "bg-rose-50 text-rose-700 border border-rose-100/50"
                        }`}>
                          {item.type === "sale" ? "বিক্রয়কর্মী: " : "ডাটা এন্ট্রি: "}{item.staffCode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-xs font-bold block ${
                    item.type === "sale" ? "text-emerald-600" : "text-rose-600"
                  }`}>
                    {item.type === "sale" ? "+" : "-"}{formatCurrency(item.amount)}
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5 font-medium">
                    {formatDateBengali(item.date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
