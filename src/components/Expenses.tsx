import React from "react";
import { ExpenseCategory, StaffCode, Expense } from "../types";
import { formatCurrency, formatDateBengali } from "../utils";
import { DollarSign, PlusCircle, Calendar, Trash2, Tag, FileText, Check, Eye, EyeOff, Edit2, Save } from "lucide-react";

interface ExpensesProps {
  categories: ExpenseCategory[];
  staffCodes: StaffCode[];
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onUpdateExpense: (id: string, updatedExpense: Expense) => void;
}

export default function Expenses({
  categories,
  staffCodes,
  expenses,
  onAddExpense,
  onDeleteExpense,
  onUpdateExpense,
}: ExpensesProps) {
  // Expense Form State
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

  // Success message
  const [success, setSuccess] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");

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

  const handleSubmit = (e: React.FormEvent) => {
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

  return (
    <div id="expenses-tab-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* LEFT PANEL: EXPENSE LOGGING FORM (5 Cols) */}
      <form 
        onSubmit={handleSubmit} 
        className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5 lg:col-span-5"
      >
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <DollarSign className="w-5 h-5 text-rose-500" />
          <h3 className="font-bold text-slate-800 text-sm">নতুন খরচ এন্ট্রি (খরচের খাত)</h3>
        </div>

        {/* Alerts */}
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

        {/* Note / Description */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 block">মন্তব্য / বিবরণ (ঐচ্ছিক)</label>
          <input
            type="text"
            placeholder="যেমন: চা-নাস্তা আপ্যায়ন বা গাড়ী ভাড়া..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Submit */}
        <button
          id="add-expense-submit-btn"
          type="submit"
          className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-xs shadow-sm shadow-rose-100 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
        >
          <PlusCircle className="w-4.5 h-4.5" />
          <span>খরচ সংরক্ষণ করুন</span>
        </button>
      </form>

      {/* RIGHT PANEL: RECENT EXPENSES HISTORY TABLE (7 Cols) */}
      <div id="expenses-history-section" className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-7 space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">খরচের সাম্প্রতিক বিবরণী</h3>
            <p className="text-xs text-slate-400 mt-1">সবচেয়ে নতুন রেকর্ড আগে প্রদর্শিত হচ্ছে</p>
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded">
            মোট খরচ এন্ট্রি: {expenses.length}টি
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
                          placeholder="কোড"
                        />
                      </td>
                      <td className="py-3 px-1">
                        <input
                          type="text"
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          className="px-1.5 py-1 bg-white border border-slate-200 rounded text-xs font-semibold focus:outline-none focus:border-blue-500 w-24"
                          placeholder="মন্তব্য"
                        />
                        {editError && (
                          <div className="text-[9px] text-rose-500 font-bold block mt-1 leading-tight">{editError}</div>
                        )}
                      </td>
                      <td className="py-3 px-1 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingExpenseId(null)}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-bold cursor-pointer"
                        >
                          বাতিল
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditExpenseSubmit(exp.id)}
                          className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer"
                        >
                          সংরক্ষণ
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={exp.id} className="hover:bg-slate-50/40 transition-colors group">
                      <td className="py-3 px-2 text-slate-500 font-medium">
                        {formatDateBengali(exp.date)}
                      </td>
                      <td className="py-3 px-2 font-bold text-slate-700">
                        {exp.category}
                      </td>
                      <td className="py-3 px-2 font-extrabold text-rose-600">
                        {formatCurrency(exp.amount)}
                      </td>
                      <td className="py-3 px-2 text-slate-500 font-medium">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-600">
                          {exp.staffCode}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-400 max-w-[120px] truncate" title={exp.note}>
                        {exp.note || "-"}
                      </td>
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
                          className="text-slate-300 hover:text-blue-600 p-1 rounded-lg transition-colors inline-block cursor-pointer mr-1"
                          title="সম্পাদনা"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteExpense(exp.id)}
                          className="text-slate-300 hover:text-rose-600 p-1 rounded-lg transition-colors inline-block cursor-pointer"
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
  );
}
