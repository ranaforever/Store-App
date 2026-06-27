import React from "react";
import { ExpenseCategory, StaffCode, Expense, StaffAdvance } from "../types";
import { formatCurrency, formatDateBengali } from "../utils";
import VoiceInputButton from "./VoiceInputButton";
import { 
  DollarSign, PlusCircle, Calendar, Trash2, Tag, 
  FileText, Check, Eye, EyeOff, Edit2, Save, 
  Users, TrendingDown, ArrowUpRight, CreditCard
} from "lucide-react";

interface ExpensesProps {
  categories: ExpenseCategory[];
  staffCodes: StaffCode[];
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onUpdateExpense: (id: string, updatedExpense: Expense) => void;
  
  // Staff Advances props
  staffAdvances: StaffAdvance[];
  onAddStaffAdvance: (staffCode: string, amount: number, date: string, note: string) => void;
  onDeleteStaffAdvance: (id: string) => void;
  onUpdateStaffAdvance: (id: string, updatedAdvance: StaffAdvance) => void;
}

export default function Expenses({
  categories,
  staffCodes,
  expenses,
  onAddExpense,
  onDeleteExpense,
  onUpdateExpense,
  staffAdvances,
  onAddStaffAdvance,
  onDeleteStaffAdvance,
  onUpdateStaffAdvance,
}: ExpensesProps) {
  // Top Level Navigation State
  const [activeSubTab, setActiveSubTab] = React.useState<"general" | "advances">("general");

  // 1. General Expense Form State
  const [selectedCategory, setSelectedCategory] = React.useState("");
  const [amount, setAmount] = React.useState<number>(0);
  const [staffCode, setStaffCode] = React.useState(() => {
    return localStorage.getItem("activeStaffCode") || "";
  });
  const [showStaffCode, setShowStaffCode] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));

  // Edit Expense State
  const [editingExpenseId, setEditingExpenseId] = React.useState<string | null>(null);
  const [editCategory, setEditCategory] = React.useState("");
  const [editAmount, setEditAmount] = React.useState<number>(0);
  const [editStaff, setEditStaff] = React.useState("");
  const [editNote, setEditNote] = React.useState("");
  const [editDate, setEditDate] = React.useState("");
  const [editError, setEditError] = React.useState("");

  // Success message for General Expenses
  const [success, setSuccess] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");

  // 2. Staff Advance Form State
  const [advStaff, setAdvStaff] = React.useState("");
  const [advAmount, setAdvAmount] = React.useState<number>(0);
  const [advDate, setAdvDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [advNote, setAdvNote] = React.useState("");
  const [advError, setAdvError] = React.useState("");
  const [advSuccess, setAdvSuccess] = React.useState(false);

  // Edit Staff Advance State
  const [editingAdvId, setEditingAdvId] = React.useState<string | null>(null);
  const [editAdvStaff, setEditAdvStaff] = React.useState("");
  const [editAdvAmount, setEditAdvAmount] = React.useState<number>(0);
  const [editAdvDate, setEditAdvDate] = React.useState("");
  const [editAdvNote, setEditAdvNote] = React.useState("");
  const [editAdvError, setEditAdvError] = React.useState("");

  // Handlers for General Expenses
  const handleEditExpenseSubmit = (id: string) => {
    setEditError("");
    if (!editCategory) {
      setEditError("খাত নির্বাচন আবশ্যক!");
      return;
    }
    if (editAmount <= 0) {
      setEditError("টাকার পরিমাণ ০ এর বেশি হতে হবে!");
      return;
    }
    if (!editStaff) {
      setEditError("কর্মী কোড আবশ্যক!");
      return;
    }
    const isValidStaff = editStaff.toUpperCase() === "ADMIN" || staffCodes.some(
      (s) => s.code.toUpperCase() === editStaff.toUpperCase()
    );
    if (!isValidStaff) {
      setEditError("ভুল কর্মী কোড!");
      return;
    }

    const updatedExpense: Expense = {
      id,
      category: editCategory,
      amount: editAmount,
      date: new Date(editDate).toISOString(),
      note: editNote,
      staffCode: editStaff.toUpperCase(),
    };

    onUpdateExpense(id, updatedExpense);
    setEditingExpenseId(null);
  };

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccess(false);

    if (!selectedCategory) {
      setErrorMsg("দয়া করে খরচের খাত নির্বাচন করুন!");
      return;
    }
    if (amount <= 0) {
      setErrorMsg("দয়া করে শূন্যের চেয়ে বেশি টাকার পরিমাণ প্রবেশ করুন!");
      return;
    }
    if (!staffCode) {
      setErrorMsg("দয়া করে বিক্রয়কর্মী কোড নির্বাচন বা প্রবেশ করুন!");
      return;
    }

    // Validate staff code
    const isValidStaff = staffCode.toUpperCase() === "ADMIN" || staffCodes.some(
      (s) => s.code.toUpperCase() === staffCode.toUpperCase()
    );
    if (!isValidStaff) {
      setErrorMsg("ভুল বিক্রয়কর্মী কোড! সঠিক কোড দিন অথবা এডমিন প্যানেল থেকে তৈরি করুন।");
      return;
    }

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      category: selectedCategory,
      amount,
      date: new Date(date).toISOString(),
      note,
      staffCode: staffCode.toUpperCase(),
    };

    onAddExpense(newExpense);

    // Reset Form & show success
    setSelectedCategory("");
    setAmount(0);
    setStaffCode("");
    setNote("");
    setDate(new Date().toISOString().slice(0, 10));
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  // Handlers for Staff Advances
  const handleSubmitAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    setAdvError("");
    setAdvSuccess(false);

    if (!advStaff) {
      setAdvError("দয়া করে কর্মী নির্বাচন করুন!");
      return;
    }
    if (advAmount <= 0) {
      setAdvError("টাকার পরিমাণ শূন্যের বেশি হতে হবে!");
      return;
    }

    onAddStaffAdvance(advStaff, advAmount, new Date(advDate).toISOString(), advNote);

    setAdvStaff("");
    setAdvAmount(0);
    setAdvNote("");
    setAdvDate(new Date().toISOString().slice(0, 10));
    setAdvSuccess(true);
    setTimeout(() => setAdvSuccess(false), 3000);
  };

  const handleEditAdvSubmit = (id: string) => {
    setEditAdvError("");
    if (!editAdvStaff) {
      setEditAdvError("কর্মী নির্বাচন আবশ্যক!");
      return;
    }
    if (editAdvAmount <= 0) {
      setEditAdvError("টাকার পরিমাণ ০ এর বেশি হতে হবে!");
      return;
    }

    const updatedAdv: StaffAdvance = {
      id,
      staffCode: editAdvStaff,
      amount: editAdvAmount,
      date: new Date(editAdvDate).toISOString(),
      note: editAdvNote,
    };

    onUpdateStaffAdvance(id, updatedAdv);
    setEditingAdvId(null);
  };

  // Total calculations
  const totalAdvances = React.useMemo(() => {
    return staffAdvances.reduce((sum, item) => sum + item.amount, 0);
  }, [staffAdvances]);

  const totalExpenses = React.useMemo(() => {
    return expenses.reduce((sum, item) => sum + item.amount, 0);
  }, [expenses]);

  // Staff advance totals per period (daily, weekly, monthly)
  const staffAdvancePeriodTotals = React.useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneWeekAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(startOfToday.getFullYear(), startOfToday.getMonth() - 1, startOfToday.getDate());

    let todaySum = 0;
    let weekSum = 0;
    let monthSum = 0;

    staffAdvances.forEach((adv) => {
      const advDate = new Date(adv.date);
      const amount = adv.amount || 0;

      if (advDate >= startOfToday) {
        todaySum += amount;
      }
      if (advDate >= oneWeekAgo) {
        weekSum += amount;
      }
      if (advDate >= oneMonthAgo) {
        monthSum += amount;
      }
    });

    return {
      todaySum,
      weekSum,
      monthSum
    };
  }, [staffAdvances]);

  // Staff advance totals per employee (all-time aggregate)
  const staffTotalAdvances = React.useMemo(() => {
    const totals: Record<string, number> = {};
    staffCodes.forEach((s) => {
      totals[s.code] = 0;
    });
    staffAdvances.forEach((adv) => {
      const code = adv.staffCode;
      totals[code] = (totals[code] || 0) + adv.amount;
    });
    return staffCodes.map((s) => ({
      code: s.code,
      name: s.name,
      total: totals[s.code] || 0
    })).filter(s => s.total > 0).sort((a, b) => b.total - a.total);
  }, [staffAdvances, staffCodes]);

  return (
    <div className="space-y-6">
      
      {/* TOP SEGMENTED SUB-TAB CONTROLLER */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-full max-w-lg mx-auto border border-slate-200/50">
        <button
          onClick={() => setActiveSubTab("general")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
            activeSubTab === "general" 
              ? "bg-white text-slate-900 shadow-xs border border-slate-200/20" 
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          📁 সাধারণ খরচের হিসাব
        </button>
        <button
          onClick={() => setActiveSubTab("advances")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
            activeSubTab === "advances" 
              ? "bg-white text-slate-900 shadow-xs border border-slate-200/20" 
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          👤 কর্মী দৈনিক টাকা উত্তোলন / অগ্রিম
        </button>
      </div>

      {activeSubTab === "general" ? (
        /* GENERAL EXPENSES SUB-TAB VIEW */
        <div id="expenses-tab-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT PANEL: EXPENSE LOGGING FORM */}
          <form 
            onSubmit={handleSubmitExpense} 
            className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5 lg:col-span-5"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <DollarSign className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-slate-800 text-sm">নতুন সাধারণ খরচ এন্ট্রি</h3>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl font-medium">
                ⚠️ {errorMsg}
              </div>
            )}

            {success && (
              <div className="p-3 bg-blue-50 border border-blue-100 text-blue-700 text-xs rounded-xl font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-blue-600" />
                <span>খরচ সফলভাবে ট্যালী খাতায় লিপিবদ্ধ করা হয়েছে!</span>
              </div>
            )}

            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 block">খরচের খাত নির্বাচন করুন *</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-700"
              >
                <option value="">-- খাত নির্বাচন করুন --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 block">টাকার পরিমাণ (৳) *</label>
              <input
                type="number"
                min="1"
                required
                placeholder="0"
                value={amount || ""}
                onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Sales Staff Code */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 block">খরচকারী কর্মী কোড *</label>
              <div className="relative">
                <input
                  type={(staffCode.toUpperCase() === "ADMIN" || staffCodes.some(s => s.code.toUpperCase() === staffCode.toUpperCase())) ? "password" : (showStaffCode ? "text" : "password")}
                  value={staffCode}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setStaffCode(val);
                    const matched = staffCodes.find(s => s.code.toUpperCase() === val);
                    if (matched) {
                      localStorage.setItem("activeStaffCode", val);
                    }
                  }}
                  placeholder="কর্মী কোড লিখুন..."
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
                />
                {!(staffCode.toUpperCase() === "ADMIN" || staffCodes.some(s => s.code.toUpperCase() === staffCode.toUpperCase())) && (
                  <button
                    type="button"
                    onClick={() => setShowStaffCode(!showStaffCode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showStaffCode ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                )}
              </div>
              {staffCode && (() => {
                if (staffCode.toUpperCase() === "ADMIN") {
                  return (
                    <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                      <span>● কর্মী: এডমিন (মালিক) ✅</span>
                    </p>
                  );
                }
                const matched = staffCodes.find(s => s.code.toUpperCase() === staffCode.toUpperCase());
                return matched ? (
                  <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                    <span>● কর্মী: {matched.name} ✅</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 mt-1">
                    <span>● অকার্যকর বা ভুল কোড ❌</span>
                  </p>
                );
              })()}
            </div>

            {/* Date Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 block">তারিখ *</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-700"
                />
              </div>
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 block">মন্তব্য / বিবরণ (ঐচ্ছিক)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="যেমন: আপ্যায়ন বা গাড়ী ভাড়া..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-700"
                />
                <VoiceInputButton 
                  onResult={(text) => setNote((prev) => (prev ? prev + " " + text : text))} 
                  placeholderName="মন্তব্য" 
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-xs shadow-sm shadow-rose-100 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <PlusCircle className="w-4.5 h-4.5" />
              <span>খরচ সংরক্ষণ করুন</span>
            </button>
          </form>

          {/* RIGHT PANEL: RECENT EXPENSES HISTORY */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-7 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">সাধারণ খরচ বিবরণী</h3>
                <p className="text-xs text-slate-400 mt-1">মোট সাধারণ খরচ: <span className="text-rose-600 font-black">{formatCurrency(totalExpenses)}</span></p>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded">
                মোট এন্ট্রি: {expenses.length}টি
              </span>
            </div>

            {expenses.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                এখনো কোন খরচের এন্ট্রি নেই!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase bg-slate-50/50">
                      <th className="py-3 px-2">তারিখ</th>
                      <th className="py-3 px-2">খাত</th>
                      <th className="py-3 px-2">টাকা</th>
                      <th className="py-3 px-2">কর্মী</th>
                      <th className="py-3 px-2">বিবরণ</th>
                      <th className="py-3 px-2 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {expenses.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((exp) => (
                      editingExpenseId === exp.id ? (
                        <tr key={exp.id} className="bg-blue-50/40">
                          <td className="py-3 px-1">
                            <input
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="px-1.5 py-1 bg-white border border-slate-200 rounded text-xs font-semibold focus:outline-none focus:border-blue-500 w-24"
                            />
                          </td>
                          <td className="py-3 px-1">
                            <select
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              className="px-1.5 py-1 bg-white border border-slate-200 rounded text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-800 w-24"
                            >
                              <option value="">-- খাত --</option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.name}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-1">
                            <input
                              type="number"
                              value={editAmount || ""}
                              onChange={(e) => setEditAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                              className="px-1.5 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 w-16"
                            />
                          </td>
                          <td className="py-3 px-1">
                            <input
                              type="text"
                              value={editStaff}
                              onChange={(e) => setEditStaff(e.target.value.toUpperCase())}
                              className="px-1.5 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 uppercase w-16"
                            />
                          </td>
                          <td className="py-3 px-1">
                            <input
                              type="text"
                              value={editNote}
                              onChange={(e) => setEditNote(e.target.value)}
                              className="px-1.5 py-1 bg-white border border-slate-200 rounded text-xs font-semibold focus:outline-none focus:border-blue-500 w-24"
                            />
                            {editError && <div className="text-[9px] text-rose-500 font-bold block mt-1 leading-tight">{editError}</div>}
                          </td>
                          <td className="py-3 px-1 text-right whitespace-nowrap space-x-1">
                            <button
                              type="button"
                              onClick={() => setEditingExpenseId(null)}
                              className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold cursor-pointer"
                            >
                              বাতিল
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditExpenseSubmit(exp.id)}
                              className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              সংরক্ষণ
                            </button>
                          </td>
                        </tr>
                      ) : (
                        <tr key={exp.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-3 px-2 text-slate-500 font-medium">{formatDateBengali(exp.date)}</td>
                          <td className="py-3 px-2 font-bold text-slate-700">{exp.category}</td>
                          <td className="py-3 px-2 font-extrabold text-rose-600">{formatCurrency(exp.amount)}</td>
                          <td className="py-3 px-2">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-600">
                              {exp.staffCode}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-slate-400 max-w-[120px] truncate" title={exp.note}>{exp.note || "-"}</td>
                          <td className="py-3 px-2 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingExpenseId(exp.id);
                                setEditCategory(exp.category);
                                setEditAmount(exp.amount);
                                setEditStaff(exp.staffCode);
                                setEditNote(exp.note);
                                setEditDate(exp.date.slice(0, 10));
                                setEditError("");
                              }}
                              className="text-slate-300 hover:text-blue-600 p-1 rounded-lg transition-colors cursor-pointer mr-1"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteExpense(exp.id)}
                              className="text-slate-300 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* STAFF ADVANCES / WITHDRAWALS SUB-TAB VIEW */
        <div id="staff-advances-container" className="space-y-6">
          
          {/* STAFF ADVANCE PERIODIC STATS CARD BLOCK */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">আজকের অগ্রিম (Today)</span>
                <span className="text-xl font-black text-slate-800 block mt-0.5">{formatCurrency(staffAdvancePeriodTotals.todaySum)}</span>
                <p className="text-[10px] text-slate-400 mt-0.5">আজকে দেওয়া মোট অগ্রিম টাকা</p>
              </div>
            </div>
            
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">৭ দিনের অগ্রিম (This Week)</span>
                <span className="text-xl font-black text-indigo-600 block mt-0.5">{formatCurrency(staffAdvancePeriodTotals.weekSum)}</span>
                <p className="text-[10px] text-slate-400 mt-0.5">৭ দিনে দেওয়া মোট অগ্রিম টাকা</p>
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">৩০ দিনের অগ্রিম (This Month)</span>
                <span className="text-xl font-black text-purple-600 block mt-0.5">{formatCurrency(staffAdvancePeriodTotals.monthSum)}</span>
                <p className="text-[10px] text-slate-400 mt-0.5">৩০ দিনে দেওয়া মোট অগ্রিম টাকা</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: FORM & EMPLOYEE WISE TOTALS */}
          <div className="lg:col-span-5 space-y-6">
            <form 
              onSubmit={handleSubmitAdvance} 
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5"
            >
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Users className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-slate-800 text-sm">নতুন কর্মী অগ্রিম / টাকা উত্তোলন</h3>
              </div>

              {advError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl font-medium">
                  ⚠️ {advError}
                </div>
              )}

              {advSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-xl font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>অগ্রিম উত্তোলন রেকর্ডটি সফলভাবে সংরক্ষণ করা হয়েছে!</span>
                </div>
              )}

              {/* Staff Dropdown list */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 block">কর্মী নির্বাচন করুন *</label>
                <select
                  value={advStaff}
                  onChange={(e) => setAdvStaff(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-700"
                  required
                >
                  <option value="">-- কর্মী নির্বাচন করুন --</option>
                  {staffCodes.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 block">টাকার পরিমাণ (৳) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="0"
                  value={advAmount || ""}
                  onChange={(e) => setAdvAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* Date Picker */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 block">তারিখ *</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={advDate}
                    onChange={(e) => setAdvDate(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-700"
                  />
                </div>
              </div>

              {/* Purpose Note */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 block">কিসের জন্য নেয়া হলো / মন্তব্য</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="যেমন: দুপুরের খাবার, হাত খরচ, অগ্রিম বেতন..."
                    value={advNote}
                    onChange={(e) => setAdvNote(e.target.value)}
                    className="w-full flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-700"
                  />
                  <VoiceInputButton 
                    onResult={(text) => setAdvNote((prev) => (prev ? prev + " " + text : text))} 
                    placeholderName="মন্তব্য" 
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <PlusCircle className="w-4.5 h-4.5" />
                <span>অগ্রিম এন্ট্রি সংরক্ষণ করুন</span>
              </button>
            </form>

            {/* EMPLOYEE-WISE TOTAL ADVANCE TAKEN */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="border-b border-slate-100 pb-2.5">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-500" />
                  কর্মী ভিত্তিক মোট অগ্রিম (Employee Total Advanced)
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">কোন কর্মী আজ পর্যন্ত মোট কত টাকা নিয়েছেন</p>
              </div>
              
              {staffTotalAdvances.length === 0 ? (
                <p className="text-[10px] text-slate-400 py-2 italic text-center">কোনো কর্মীর অগ্রিম এন্ট্রি নেই</p>
              ) : (
                <div className="space-y-2">
                  {staffTotalAdvances.map((st) => (
                    <div key={st.code} className="flex items-center justify-between text-xs bg-slate-50/50 p-2.5 rounded-xl border border-slate-200/40">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                          {st.code}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800">{st.name}</span>
                          <span className="text-[9px] text-slate-400 block font-mono">{st.code}</span>
                        </div>
                      </div>
                      <span className="font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                        {formatCurrency(st.total)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL: RECENT ADVANCES LOGS LIST */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-7 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">কর্মীদের অগ্রিম গ্রহণের বিবরণী</h3>
                <p className="text-xs text-slate-400 mt-1">মোট কর্মীদের উত্তোলন: <span className="text-blue-600 font-black">{formatCurrency(totalAdvances)}</span></p>
              </div>
              <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-1 rounded">
                মোট রেকর্ড: {staffAdvances.length}টি
              </span>
            </div>

            {staffAdvances.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                আজ অব্দি কোন কর্মী অগ্রিম টাকা গ্রহণ করেননি!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase bg-slate-50/50">
                      <th className="py-3 px-2">তারিখ</th>
                      <th className="py-3 px-2">কর্মী</th>
                      <th className="py-3 px-2">টাকা</th>
                      <th className="py-3 px-2">মন্তব্য</th>
                      <th className="py-3 px-2 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {staffAdvances.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((adv) => {
                      const matchedStaff = staffCodes.find(s => s.code.toUpperCase() === adv.staffCode.toUpperCase());
                      const staffName = matchedStaff ? matchedStaff.name : adv.staffCode;

                      return editingAdvId === adv.id ? (
                        <tr key={adv.id} className="bg-blue-50/40">
                          <td className="py-3 px-1">
                            <input
                              type="date"
                              value={editAdvDate}
                              onChange={(e) => setEditAdvDate(e.target.value)}
                              className="px-1.5 py-1 bg-white border border-slate-200 rounded text-xs font-semibold focus:outline-none w-24"
                            />
                          </td>
                          <td className="py-3 px-1">
                            <select
                              value={editAdvStaff}
                              onChange={(e) => setEditAdvStaff(e.target.value)}
                              className="px-1.5 py-1 bg-white border border-slate-200 rounded text-xs font-semibold focus:outline-none text-slate-800 w-28"
                            >
                              <option value="">-- কর্মী --</option>
                              {staffCodes.map((s) => (
                                <option key={s.code} value={s.code}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-1">
                            <input
                              type="number"
                              value={editAdvAmount || ""}
                              onChange={(e) => setEditAdvAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                              className="px-1.5 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800 focus:outline-none w-16"
                            />
                          </td>
                          <td className="py-3 px-1">
                            <input
                              type="text"
                              value={editAdvNote}
                              onChange={(e) => setEditAdvNote(e.target.value)}
                              className="px-1.5 py-1 bg-white border border-slate-200 rounded text-xs font-semibold focus:outline-none w-24"
                            />
                            {editAdvError && <div className="text-[9px] text-rose-500 font-bold block mt-1 leading-tight">{editAdvError}</div>}
                          </td>
                          <td className="py-3 px-1 text-right whitespace-nowrap space-x-1">
                            <button
                              type="button"
                              onClick={() => setEditingAdvId(null)}
                              className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold cursor-pointer"
                            >
                              বাতিল
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditAdvSubmit(adv.id)}
                              className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              সংরক্ষণ
                            </button>
                          </td>
                        </tr>
                      ) : (
                        <tr key={adv.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-3 px-2 text-slate-500 font-medium">{formatDateBengali(adv.date)}</td>
                          <td className="py-3 px-2">
                            <div className="font-bold text-slate-700">{staffName}</div>
                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5 bg-slate-100 px-1.5 py-0.2 rounded inline-block">
                              {adv.staffCode}
                            </div>
                          </td>
                          <td className="py-3 px-2 font-extrabold text-blue-600">{formatCurrency(adv.amount)}</td>
                          <td className="py-3 px-2 text-slate-400 max-w-[120px] truncate" title={adv.note}>{adv.note || "-"}</td>
                          <td className="py-3 px-2 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAdvId(adv.id);
                                setEditAdvStaff(adv.staffCode);
                                setEditAdvAmount(adv.amount);
                                setEditAdvNote(adv.note);
                                setEditAdvDate(adv.date.slice(0, 10));
                                setEditAdvError("");
                              }}
                              className="text-slate-300 hover:text-blue-600 p-1 rounded-lg transition-colors cursor-pointer mr-1"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteStaffAdvance(adv.id)}
                              className="text-slate-300 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          </div> {/* Closing nested grid */}
        </div>
      )}

    </div>
  );
}
