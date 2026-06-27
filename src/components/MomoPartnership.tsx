import React from "react";
import { MomoLog } from "../types";
import { formatCurrency, formatDateBengali } from "../utils";
import VoiceInputButton from "./VoiceInputButton";
import NumericKeypad from "./NumericKeypad";
import { 
  PlusCircle, Calendar, Trash2, Check, Keyboard,
  ShoppingBag, Layers, CreditCard, Edit2, Save, X, 
  Store, ArrowRight, TrendingDown, ShoppingCart, Activity
} from "lucide-react";

interface MomoPartnershipProps {
  momoLogs: MomoLog[];
  onAddMomoLog: (logData: Omit<MomoLog, "id" | "totalSales">) => void;
  onDeleteMomoLog: (id: string) => void;
  onUpdateMomoLog: (id: string, updatedLog: MomoLog) => void;
}

type PeriodType = "today" | "week" | "month" | "year";

export default function MomoPartnership({
  momoLogs,
  onAddMomoLog,
  onDeleteMomoLog,
  onUpdateMomoLog,
}: MomoPartnershipProps) {
  // Entry Tab State ("receive" = মোমো গ্রহণ ও বিল পরিশোধ, "sell" = মোমো বিক্রয়)
  const [entryTab, setEntryTab] = React.useState<"receive" | "sell">("receive");

  // Form State
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [receivedQty, setReceivedQty] = React.useState<number>(0);
  const [paidQty, setPaidQty] = React.useState<number>(0);
  const [purchasePrice, setPurchasePrice] = React.useState<number>(8); // default to 8 tk per piece
  const [soldQty, setSoldQty] = React.useState<number>(0);
  const [unitPrice, setUnitPrice] = React.useState<number>(12); // default to 12 tk per piece (selling price)
  const [expense, setExpense] = React.useState<number>(0);
  const [note, setNote] = React.useState("");

  // Period Tab State
  const [activePeriod, setActivePeriod] = React.useState<PeriodType>("week");

  // Edit State
  const [editingLogId, setEditingLogId] = React.useState<string | null>(null);
  const [editDate, setEditDate] = React.useState("");
  const [editReceivedQty, setEditReceivedQty] = React.useState<number>(0);
  const [editPaidQty, setEditPaidQty] = React.useState<number>(0);
  const [editPurchasePrice, setEditPurchasePrice] = React.useState<number>(0);
  const [editSoldQty, setEditSoldQty] = React.useState<number>(0);
  const [editUnitPrice, setEditUnitPrice] = React.useState<number>(0);
  const [editExpense, setEditExpense] = React.useState<number>(0);
  const [editNote, setEditNote] = React.useState("");
  const [editError, setEditError] = React.useState("");

  const [success, setSuccess] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");

  // Keypad State
  const [keypadOpen, setKeypadOpen] = React.useState(false);
  const [keypadTitle, setKeypadTitle] = React.useState("");
  const [keypadValue, setKeypadValue] = React.useState<number>(0);
  const [keypadField, setKeypadField] = React.useState("");
  const [keypadIsDecimal, setKeypadIsDecimal] = React.useState(false);

  // Helper to open keypad
  const triggerKeypad = (field: string, title: string, currentVal: number, isDecimal = false) => {
    setKeypadField(field);
    setKeypadTitle(title);
    setKeypadValue(currentVal);
    setKeypadIsDecimal(isDecimal);
    setKeypadOpen(true);
  };

  const handleKeypadConfirm = (value: number) => {
    if (keypadField === "receivedQty") {
      setReceivedQty(value);
      if (soldQty === 0) setSoldQty(value); // Autofill sold Qty with received
    } else if (keypadField === "paidQty") {
      setPaidQty(value);
    } else if (keypadField === "purchasePrice") {
      setPurchasePrice(value);
    } else if (keypadField === "soldQty") {
      setSoldQty(value);
    } else if (keypadField === "unitPrice") {
      setUnitPrice(value);
    } else if (keypadField === "expense") {
      setExpense(value);
    }
  };

  // Filter logs by period
  const filteredLogsByPeriod = React.useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return momoLogs.filter((log) => {
      const logDate = new Date(log.date);
      if (activePeriod === "today") {
        return logDate >= startOfToday;
      } else if (activePeriod === "week") {
        const oneWeekAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
        return logDate >= oneWeekAgo;
      } else if (activePeriod === "month") {
        const oneMonthAgo = new Date(startOfToday.getFullYear(), startOfToday.getMonth() - 1, startOfToday.getDate());
        return logDate >= oneMonthAgo;
      } else if (activePeriod === "year") {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return logDate >= startOfYear;
      }
      return true;
    });
  }, [momoLogs, activePeriod]);

  // Statistics for the chosen period
  const periodStats = React.useMemo(() => {
    let received = 0;
    let paid = 0;
    let totalBillVal = 0;
    let totalPaidVal = 0;
    let sold = 0;
    let totalSales = 0;
    let expenseSum = 0;
    let netProfitSum = 0;

    filteredLogsByPeriod.forEach((l) => {
      received += l.receivedQty || 0;
      sold += l.soldQty || 0;
      totalSales += l.totalSales || 0;
      expenseSum += l.expense || 0;

      const pq = l.paidQty !== undefined ? l.paidQty : l.receivedQty; // fallback
      const pp = l.purchasePrice !== undefined && l.purchasePrice > 0 ? l.purchasePrice : 8; // fallback

      paid += pq;
      totalBillVal += (l.receivedQty || 0) * pp;
      totalPaidVal += pq * pp;

      const salesVal = (l.soldQty || 0) * (l.unitPrice || 0);
      const rowNetProfit = salesVal - (l.expense || 0) - ((l.soldQty || 0) * pp);
      netProfitSum += rowNetProfit;
    });

    const dueQty = received - paid;
    const dueBillVal = totalBillVal - totalPaidVal;
    const remainingStock = received - sold;

    return {
      received,
      paid,
      dueQty,
      totalBillVal,
      totalPaidVal,
      dueBillVal,
      sold,
      totalSales,
      expenseSum,
      remainingStock,
      netProfit: netProfitSum
    };
  }, [filteredLogsByPeriod]);

  // Overall/All-Time Totals
  const grandTotals = React.useMemo(() => {
    let totalReceived = 0;
    let totalPaidQty = 0;
    let totalSold = 0;
    let totalSales = 0;
    let totalExpenses = 0;
    let grandBillVal = 0;
    let grandPaidVal = 0;

    momoLogs.forEach((log) => {
      totalReceived += log.receivedQty || 0;
      totalSold += log.soldQty || 0;
      totalSales += log.totalSales || 0;
      totalExpenses += log.expense || 0;

      const pq = log.paidQty !== undefined ? log.paidQty : log.receivedQty;
      const pp = log.purchasePrice !== undefined && log.purchasePrice > 0 ? log.purchasePrice : 8;

      totalPaidQty += pq;
      grandBillVal += (log.receivedQty || 0) * pp;
      grandPaidVal += pq * pp;
    });

    return {
      totalReceived,
      totalPaidQty,
      dueQty: totalReceived - totalPaidQty,
      totalSales,
      totalExpenses,
      grandBillVal,
      grandPaidVal,
      grandDueVal: grandBillVal - grandPaidVal,
      remainingStock: totalReceived - totalSold,
    };
  }, [momoLogs]);

  // Dynamic calculations in form
  const autoCalculatedValue = React.useMemo(() => {
    const bill = receivedQty * purchasePrice;
    const paid = paidQty * purchasePrice;
    const duePcs = receivedQty - paidQty;
    const dueAmt = bill - paid;
    const stockPcs = receivedQty - soldQty;
    return { bill, paid, duePcs, dueAmt, stockPcs };
  }, [receivedQty, paidQty, purchasePrice, soldQty]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccess(false);

    if (entryTab === "receive") {
      if (receivedQty < 0) {
        setErrorMsg("গ্রহণ করা পরিমাণ অবশ্যই ০ বা ইতিবাচক হতে হবে!");
        return;
      }
      if (paidQty < 0) {
        setErrorMsg("পরিশোধকৃত মোমো পরিমাণ অবশ্যই ০ বা ইতিবাচক হতে হবে!");
        return;
      }
      if (receivedQty === 0 && paidQty === 0) {
        setErrorMsg("দয়া করে গ্রহণ পরিমাণ অথবা পরিশোধ পরিমাণ এন্ট্রি করুন!");
        return;
      }
      if (paidQty > receivedQty) {
        setErrorMsg("পরিশোধকৃত বিলের পিস গ্রহনের পরিমাণের চেয়ে বেশি হতে পারে না!");
        return;
      }
      if (purchasePrice <= 0) {
        setErrorMsg("কেনার দাম বা রেট অবশ্যই ০ এর বেশি হতে হবে!");
        return;
      }

      onAddMomoLog({
        date: new Date(date).toISOString(),
        receivedQty,
        paidQty,
        purchasePrice,
        soldQty: 0,
        unitPrice: 0,
        expense: 0,
        partnerSharePercent: 0,
        note,
      });

      // Reset fields
      setReceivedQty(0);
      setPaidQty(0);
      setNote("");
      setDate(new Date().toISOString().slice(0, 10));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);

    } else { // "sell"
      if (soldQty <= 0) {
        setErrorMsg("বিক্রি করা পরিমাণ অবশ্যই ০ এর বেশি হতে হবে!");
        return;
      }
      if (unitPrice <= 0) {
        setErrorMsg("বিক্রয় মূল্য অবশ্যই ০ এর চেয়ে বড় হতে হবে!");
        return;
      }
      if (expense < 0) {
        setErrorMsg("আনুষঙ্গিক খরচ অবশ্যই ০ বা তার বেশি হতে হবে!");
        return;
      }

      onAddMomoLog({
        date: new Date(date).toISOString(),
        receivedQty: 0,
        paidQty: 0,
        purchasePrice: 0,
        soldQty,
        unitPrice,
        expense,
        partnerSharePercent: 0,
        note,
      });

      // Reset fields
      setSoldQty(0);
      setExpense(0);
      setNote("");
      setDate(new Date().toISOString().slice(0, 10));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    }
  };

  const handleEditSubmit = (id: string) => {
    setEditError("");
    if (editReceivedQty < 0 || editSoldQty < 0 || editPaidQty < 0) {
      setEditError("পরিমাণ অবশ্যই ০ বা ইতিবাচক হতে হবে!");
      return;
    }
    if (editReceivedQty > 0 && editPaidQty > editReceivedQty) {
      setEditError("পরিশোধকৃত পিস গ্রহনের পরিমাণের চেয়ে বেশি হতে পারে না!");
      return;
    }
    if (editReceivedQty > 0 && editPurchasePrice <= 0) {
      setEditError("কেনার দাম রেট ০ এর বেশি হতে হবে!");
      return;
    }
    if (editSoldQty > 0 && editUnitPrice <= 0) {
      setEditError("বিক্রয় মূল্য অবশ্যই ০ এর চেয়ে বড় হতে হবে!");
      return;
    }

    const updatedLog: MomoLog = {
      id,
      date: new Date(editDate).toISOString(),
      receivedQty: editReceivedQty,
      paidQty: editPaidQty,
      purchasePrice: editPurchasePrice,
      soldQty: editSoldQty,
      unitPrice: editUnitPrice,
      totalSales: editSoldQty * editUnitPrice,
      expense: editExpense,
      partnerSharePercent: 0,
      note: editNote,
    };

    onUpdateMomoLog(id, updatedLog);
    setEditingLogId(null);
  };

  return (
    <div id="momo-partnership-container" className="space-y-6">
      
      {/* HEADER SECTION WITH STOCK & BILL BANNER */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 translate-x-12 -translate-y-12">
          <Store className="w-80 h-80" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-bold uppercase tracking-wider text-amber-50">
              <Store className="w-3.5 h-3.5" /> মোমো স্টক ও বিল খতিয়ান (Momo Stock & Bills)
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight font-sans">
              মোমো ক্রয়, বিল পরিশোধ ও স্টক হিসাব
            </h2>
            <p className="text-xs text-amber-50 max-w-xl font-medium leading-relaxed">
              কারখানা বা মহাজন থেকে আনা মোমো পিসের হিসাব, কত পিস এর বিল দিলেন, কত পিস এর বিল বাকি এবং বর্তমানে কত পিস স্টক আছে তার সহজ খতিয়ান।
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="bg-white/10 p-3.5 rounded-2xl backdrop-blur-md border border-white/10">
              <span className="text-[10px] text-amber-100 font-bold block uppercase">সর্বমোট বকেয়া বিল</span>
              <span className="text-xl font-black text-white">{formatCurrency(grandTotals.grandDueVal)}</span>
              <span className="text-[10px] text-amber-100 block mt-0.5">
                বাকি আছে: {grandTotals.dueQty} পিস বিল
              </span>
            </div>
            <div className="bg-white/10 p-3.5 rounded-2xl backdrop-blur-md border border-white/10">
              <span className="text-[10px] text-amber-100 font-bold block uppercase">মোট বর্তমান স্টক</span>
              <span className="text-xl font-black text-white">{grandTotals.remainingStock} পিস</span>
              <span className="text-[10px] text-amber-100 block mt-0.5">
                বিক্রির জন্য অবশিষ্টাংশ
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: STOCK & BILL PERIODIC REPORT */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-amber-500" />
              সময়ভিত্তিক মোমো স্টক ও বিল রিপোর্ট (Momo Stock & Bill Status)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">নির্বাচিত সময়ে মোমো প্রাপ্তি, স্টক ও বিলের হালনাগাদ বিবরণী</p>
          </div>

          {/* Period Selector Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200/40">
            {[
              { id: "today" as const, label: "আজ (Today)" },
              { id: "week" as const, label: "সপ্তাহ (Week)" },
              { id: "month" as const, label: "মাস (Month)" },
              { id: "year" as const, label: "বছর (Year)" }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePeriod(tab.id)}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  activePeriod === tab.id
                    ? "bg-white text-amber-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Periodic Stats Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          
          {/* Card 1: Received Pieces */}
          <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-100/50 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-amber-700">কত পিস কিনলাম (Received)</span>
            <div className="mt-2">
              <span className="text-xl font-black text-slate-800">{periodStats.received}</span>
              <span className="text-[10px] text-slate-400 font-bold ml-1">পিস</span>
            </div>
            <span className="text-[9px] text-slate-400 font-medium mt-1">কারখানা থেকে প্রাপ্ত মোমো</span>
          </div>

          {/* Card 2: Paid Pieces */}
          <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100/50 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-emerald-700">কত পিস বিল দিলাম (Paid)</span>
            <div className="mt-2">
              <span className="text-xl font-black text-slate-800">{periodStats.paid}</span>
              <span className="text-[10px] text-slate-400 font-bold ml-1">পিস</span>
            </div>
            <span className="text-[9px] text-slate-400 font-medium mt-1">পরিশোধিত মোমো পিস</span>
          </div>

          {/* Card 3: Due Pieces */}
          <div className="bg-rose-50/40 p-3 rounded-xl border border-rose-100/50 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-rose-700">বাকি বিলের পিস (Due)</span>
            <div className="mt-2">
              <span className="text-xl font-black text-rose-600">{periodStats.dueQty}</span>
              <span className="text-[10px] text-slate-400 font-bold ml-1">পিস</span>
            </div>
            <span className="text-[9px] text-slate-400 font-medium mt-1">বকেয়া পরিশোধের বাকি</span>
          </div>

          {/* Card 4: Remaining Stock */}
          <div className="bg-blue-50/40 p-3 rounded-xl border border-blue-100/50 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-blue-700">কত পিস স্টক আছে (Stock)</span>
            <div className="mt-2">
              <span className="text-xl font-black text-blue-600">{periodStats.remainingStock}</span>
              <span className="text-[10px] text-slate-400 font-bold ml-1">পিস</span>
            </div>
            <span className="text-[9px] text-slate-400 font-medium mt-1">বিক্রি করার মত স্টক</span>
          </div>

          {/* Card 5: Paid Bill Amount */}
          <div className="bg-teal-50/40 p-3 rounded-xl border border-teal-100/50 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-teal-700">মোট পরিশোধিত বিল</span>
            <div className="mt-2">
              <span className="text-base font-black text-slate-800">{formatCurrency(periodStats.totalPaidVal)}</span>
            </div>
            <span className="text-[9px] text-slate-400 font-medium mt-1">পরিশোধ করা বিলের টাকা</span>
          </div>

          {/* Card 6: Due Amount */}
          <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-rose-800">মোট বকেয়া বিল</span>
            <div className="mt-2">
              <span className="text-base font-black text-rose-600">{formatCurrency(periodStats.dueBillVal)}</span>
            </div>
            <span className="text-[9px] text-slate-400 font-medium mt-1">পরিশোধের বাকি বকেয়া</span>
          </div>

        </div>
      </div>

      {/* SECTION 2: INPUT FORM & RECENT TRANSACTION LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Log Entry Form */}
        <form 
          onSubmit={handleSubmit} 
          className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 lg:col-span-5"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-800 text-sm">নতুন মোমো তথ্য এন্ট্রি</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Keyboard className="w-3.5 h-3.5" /> কীবোর্ড রেডি
            </span>
          </div>

          {/* Entry Tab Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/40 w-full">
            <button
              type="button"
              onClick={() => {
                setEntryTab("receive");
                setErrorMsg("");
              }}
              className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer text-center ${
                entryTab === "receive"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              মোমো গ্রহণ (Receive)
            </button>
            <button
              type="button"
              onClick={() => {
                setEntryTab("sell");
                setErrorMsg("");
              }}
              className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer text-center ${
                entryTab === "sell"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              মোমো বিক্রয় (Sales)
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl font-medium">
              ⚠️ {errorMsg}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-xl font-semibold flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>সফলভাবে সংরক্ষণ করা হয়েছে!</span>
            </div>
          )}

          {/* Date Picker */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 block">এন্ট্রির তারিখ *</label>
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

          {entryTab === "receive" ? (
            /* Received and Paid Quantities */
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/50 space-y-3">
              <h4 className="text-[11px] font-bold text-slate-700 border-b border-slate-200/60 pb-1.5 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-amber-500" /> মোমো ডেলিভারি ও বিল ট্র্যাকিং
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 block">কত পিস কিনলাম *</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      min="0"
                      required
                      value={receivedQty || ""}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                        setReceivedQty(val);
                      }}
                      className="w-full flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-extrabold focus:outline-none focus:border-blue-500 transition-all text-slate-800"
                      placeholder="যেমন: ৫০"
                    />
                    <button
                      type="button"
                      onClick={() => triggerKeypad("receivedQty", "কত পিস কিনলাম (Received Pcs)", receivedQty)}
                      className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl border border-amber-200 cursor-pointer text-xs"
                      title="কাস্টম টাচ কীবোর্ড দিয়ে ইনপুট"
                    >
                      <Keyboard className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 block">কত পিস বিল দিলাম *</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      min="0"
                      required
                      value={paidQty || ""}
                      onChange={(e) => setPaidQty(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-extrabold focus:outline-none focus:border-blue-500 transition-all text-slate-800"
                      placeholder="যেমন: ২০"
                    />
                    <button
                      type="button"
                      onClick={() => triggerKeypad("paidQty", "কত পিস বিল দিলাম (Paid Pcs)", paidQty)}
                      className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl border border-amber-200 cursor-pointer text-xs"
                      title="কাস্টম টাচ কীবোর্ড দিয়ে ইনপুট"
                    >
                      <Keyboard className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 block">মোমো প্রতি পিস কেনা দাম (৳ রেট) *</label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    required
                    value={purchasePrice || ""}
                    onChange={(e) => setPurchasePrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-extrabold focus:outline-none focus:border-blue-500 transition-all text-slate-800"
                    placeholder="যেমন: ৮"
                  />
                  <button
                    type="button"
                    onClick={() => triggerKeypad("purchasePrice", "কেনা দাম রেট (Purchase Price)", purchasePrice, true)}
                    className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl border border-amber-200 cursor-pointer text-xs"
                    title="কাস্টম টাচ কীবোর্ড দিয়ে ইনপুট"
                  >
                    <Keyboard className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Calculations display */}
              {(receivedQty > 0 || paidQty > 0) && (
                <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 text-[10px] font-semibold text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>মোট বিলের টাকা:</span>
                    <span className="font-bold text-slate-800">{receivedQty} পিস × ৳{purchasePrice} = {formatCurrency(autoCalculatedValue.bill)}</span>
                  </div>
                  <div className="flex justify-between text-teal-600">
                    <span>বিলের পরিশোধিত টাকা:</span>
                    <span className="font-bold">{paidQty} পিস × ৳{purchasePrice} = {formatCurrency(autoCalculatedValue.paid)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-1 text-rose-600 font-bold">
                    <span>বকেয়া বিলের বাকি:</span>
                    <span>{autoCalculatedValue.duePcs} পিস মোমো ({formatCurrency(autoCalculatedValue.dueAmt)})</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Sales Tracking */
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/50 space-y-3">
              <h4 className="text-[11px] font-bold text-slate-700 border-b border-slate-200/60 pb-1.5 flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-500" /> মোমো বিক্রয় ও স্টক ট্র্যাকার
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 block">কত পিস বিক্রি করলাম *</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      min="0"
                      required
                      value={soldQty || ""}
                      onChange={(e) => setSoldQty(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 transition-all text-slate-800"
                      placeholder="যেমন: ৪৫"
                    />
                    <button
                      type="button"
                      onClick={() => triggerKeypad("soldQty", "কত পিস বিক্রি করলাম (Sold Pcs)", soldQty)}
                      className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl border border-amber-200 cursor-pointer text-xs"
                      title="কাস্টম কীবোর্ড দিয়ে ইনপুট"
                    >
                      <Keyboard className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 block">বিক্রয় মূল্য (৳ প্রতি পিস) *</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      min="1"
                      required
                      value={unitPrice || ""}
                      onChange={(e) => setUnitPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 transition-all text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => triggerKeypad("unitPrice", "বিক্রয় মূল্য প্রতি পিস (Selling Price)", unitPrice, true)}
                      className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl border border-amber-200 cursor-pointer text-xs"
                      title="কাস্টম কীবোর্ড দিয়ে ইনপুট"
                    >
                      <Keyboard className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 block">আনুষঙ্গিক খরচ (৳) *</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      min="0"
                      required
                      value={expense || ""}
                      onChange={(e) => setExpense(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 transition-all text-slate-800"
                      placeholder="মশলা, গ্যাস ইত্যাদি..."
                    />
                    <button
                      type="button"
                      onClick={() => triggerKeypad("expense", "আনুষঙ্গিক খরচ (Expense Amt)", expense)}
                      className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl border border-amber-200 cursor-pointer text-xs"
                      title="কাস্টম কীবোর্ড দিয়ে ইনপুট"
                    >
                      <Keyboard className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Sales calculation display */}
              {soldQty > 0 && (
                <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 text-[10px] font-semibold text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>মোট বিক্রয়:</span>
                    <span className="font-bold text-slate-800">{soldQty} পিস × ৳{unitPrice} = {formatCurrency(soldQty * unitPrice)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>আনুষঙ্গিক খরচ:</span>
                    <span className="font-bold">{formatCurrency(expense)}</span>
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <span>আনুমানিক মোমো খরচ (৳৮ হিসেবে):</span>
                    <span className="font-bold">{soldQty} পিস × ৳৮ = {formatCurrency(soldQty * 8)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-1 text-emerald-600 font-bold">
                    <span>নিট লাভ:</span>
                    <span>{formatCurrency((soldQty * unitPrice) - expense - (soldQty * 8))}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Comments with Bengali Voice dictation button */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 block">মন্তব্য / নোট (ঐচ্ছিক)</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="কোন বিবরণী থাকলে লিখুন..."
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

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
          >
            <PlusCircle className="w-4.5 h-4.5" />
            <span>
              {entryTab === "receive" 
                ? "মোমো গ্রহণ এন্ট্রি সংরক্ষণ করুন" 
                : "মোমো বিক্রয় এন্ট্রি সংরক্ষণ করুন"}
            </span>
          </button>
        </form>

        {/* Right Side: Log Data View */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">মোমো প্রতিদিনের খতিয়ান ও বিবরণী তালিকা</h3>
              <p className="text-xs text-slate-400 mt-1">সবচেয়ে নতুন রেকর্ড আগে প্রদর্শিত হচ্ছে</p>
            </div>
            <span className="text-[10px] bg-amber-50 text-amber-600 font-bold px-2 py-1 rounded">
              মোট রেকর্ড: {momoLogs.length}টি
            </span>
          </div>

          {momoLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              এখনো কোনো মোমো খতিয়ান এন্ট্রি নেই! শুরু করতে বাম পাশের ফর্মে এন্ট্রি দিন।
            </div>
          ) : (
            <>
              {/* DESKTOP VIEW (TABLE) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase bg-slate-50/50">
                      <th className="py-3 px-2">তারিখ</th>
                      <th className="py-3 px-2">টাইপ ও পরিমাণ</th>
                      <th className="py-3 px-2">ক্রয় রেট ও বিল বকেয়া</th>
                      <th className="py-3 px-2">বিক্রয় ও লাভ (Profit)</th>
                      <th className="py-3 px-2 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {momoLogs.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log) => {
                      const pq = log.paidQty !== undefined ? log.paidQty : log.receivedQty;
                      const pp = log.purchasePrice !== undefined && log.purchasePrice > 0 ? log.purchasePrice : 8;
                      const duePcs = log.receivedQty - pq;
                      const billVal = log.receivedQty * pp;
                      const paidVal = pq * pp;
                      const dueVal = billVal - paidVal;
                      const salesVal = log.soldQty * log.unitPrice;
                      const netProfit = salesVal - log.expense - (log.soldQty * pp);

                      return editingLogId === log.id ? (
                        <tr key={log.id} className="bg-amber-50/20">
                          <td className="py-3 px-1">
                            <input
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="px-1.5 py-1 bg-white border border-slate-200 rounded text-xs font-semibold focus:outline-none focus:border-blue-500 w-24 text-slate-700"
                            />
                          </td>
                          <td className="py-3 px-1 space-y-1">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400">গ্রহন:</span>
                              <input
                                type="number"
                                value={editReceivedQty}
                                onChange={(e) => setEditReceivedQty(Math.max(0, parseInt(e.target.value, 10) || 0))}
                                className="px-1 py-0.5 bg-white border border-slate-200 rounded text-xs font-bold w-12 text-slate-800"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400">পরিশোধ পিস:</span>
                              <input
                                type="number"
                                value={editPaidQty}
                                onChange={(e) => setEditPaidQty(Math.max(0, parseInt(e.target.value, 10) || 0))}
                                className="px-1 py-0.5 bg-white border border-slate-200 rounded text-xs font-bold w-12 text-slate-800"
                              />
                            </div>
                          </td>
                          <td className="py-3 px-1 space-y-1">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400">রেট:</span>
                              <input
                                type="number"
                                value={editPurchasePrice}
                                step="0.1"
                                onChange={(e) => setEditPurchasePrice(Math.max(0, parseFloat(e.target.value) || 0))}
                                className="px-1 py-0.5 bg-white border border-slate-200 rounded text-xs font-bold w-12 text-slate-800"
                              />
                            </div>
                          </td>
                          <td className="py-3 px-1 space-y-1">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400">বিক্রিত:</span>
                              <input
                                type="number"
                                value={editSoldQty}
                                onChange={(e) => setEditSoldQty(Math.max(0, parseInt(e.target.value, 10) || 0))}
                                className="px-1 py-0.5 bg-white border border-slate-200 rounded text-xs font-bold w-12 text-slate-800"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400">বিক্রয় দর:</span>
                              <input
                                type="number"
                                value={editUnitPrice}
                                onChange={(e) => setEditUnitPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                                className="px-1 py-0.5 bg-white border border-slate-200 rounded text-xs font-bold w-12 text-slate-800"
                              />
                            </div>
                            {editError && <div className="text-[9px] text-rose-500 font-bold block mt-1">{editError}</div>}
                          </td>
                          <td className="py-3 px-1 text-right whitespace-nowrap space-x-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingLogId(null)}
                              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-bold cursor-pointer"
                            >
                              X
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditSubmit(log.id)}
                              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              ওকে
                            </button>
                          </td>
                        </tr>
                      ) : (
                        <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-3 px-2 text-slate-500 font-semibold whitespace-nowrap">
                            {formatDateBengali(log.date)}
                          </td>
                          <td className="py-3 px-2 text-slate-700 font-medium">
                            {log.receivedQty > 0 ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 mb-1">
                                  মোমো গ্রহণ
                                </span>
                                <div>গ্রহণ: <span className="font-extrabold text-slate-800">{log.receivedQty}</span> পিস</div>
                                <div className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                                  <span>বকেয়া: {duePcs} পিস</span>
                                  {duePcs > 0 && <span className="w-1.5 h-1.5 bg-rose-500 rounded-full inline-block animate-pulse"></span>}
                                </div>
                              </div>
                            ) : log.paidQty && log.paidQty > 0 ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-100 text-teal-800 mb-1">
                                  বকেয়া পরিশোধ
                                </span>
                                <div>পরিশোধ: <span className="font-extrabold text-slate-800">{log.paidQty}</span> পিস বিল</div>
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800 mb-1">
                                  মোমো বিক্রয়
                                </span>
                                <div>বিক্রিত: <span className="font-extrabold text-slate-800">{log.soldQty}</span> পিস</div>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-2 font-semibold text-slate-600">
                            {log.receivedQty > 0 || (log.paidQty && log.paidQty > 0) ? (
                              <div className="space-y-0.5">
                                {log.receivedQty > 0 && <div>মোট বিল: <span className="font-bold text-slate-800">{formatCurrency(billVal)}</span></div>}
                                <div className="text-[11px] text-teal-600 font-bold">পরিশোধ: {formatCurrency(paidVal)}</div>
                                {dueVal > 0 && <div className="text-[10px] text-rose-600 font-bold">বকেয়া বিল: {formatCurrency(dueVal)}</div>}
                                <div className="text-[10px] text-slate-400 font-medium">রেট: ৳{pp}/পিস</div>
                              </div>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-slate-700">
                            {log.soldQty > 0 ? (
                              <div className="space-y-0.5">
                                <div className="font-extrabold text-blue-600">মোট বিক্রয়: {formatCurrency(salesVal)}</div>
                                <div className="font-extrabold text-emerald-600 text-[11px]">নিট লাভ: {formatCurrency(netProfit)}</div>
                                <div className="text-[9px] text-slate-400 font-medium mt-0.5 leading-none">
                                  দর: ৳{log.unitPrice}/পিস | খরচ: {formatCurrency(log.expense)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                            {log.note && (
                              <div className="text-[9px] text-slate-400 font-medium mt-1 italic max-w-[150px] truncate" title={log.note}>
                                {log.note}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-2 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLogId(log.id);
                                setEditDate(log.date.slice(0, 10));
                                setEditReceivedQty(log.receivedQty);
                                setEditPaidQty(pq);
                                setEditPurchasePrice(pp);
                                setEditSoldQty(log.soldQty);
                                setEditUnitPrice(log.unitPrice);
                                setEditExpense(log.expense);
                                setEditNote(log.note);
                                setEditError("");
                              }}
                              className="text-slate-300 hover:text-blue-600 p-1 rounded-lg transition-colors inline-block cursor-pointer mr-1"
                              title="সম্পাদনা"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteMomoLog(log.id)}
                              className="text-slate-300 hover:text-rose-600 p-1 rounded-lg transition-colors inline-block cursor-pointer"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARD VIEW */}
              <div className="block sm:hidden space-y-3">
                {momoLogs.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log) => {
                  const pq = log.paidQty !== undefined ? log.paidQty : log.receivedQty;
                  const pp = log.purchasePrice !== undefined && log.purchasePrice > 0 ? log.purchasePrice : 8;
                  const duePcs = log.receivedQty - pq;
                  const billVal = log.receivedQty * pp;
                  const paidVal = pq * pp;
                  const dueVal = billVal - paidVal;
                  const salesVal = log.soldQty * log.unitPrice;
                  const netProfit = salesVal - log.expense - (log.soldQty * pp);

                  return editingLogId === log.id ? (
                    <div key={log.id} className="bg-amber-50/30 p-4 rounded-xl border border-amber-200 space-y-3">
                      <div className="flex justify-between items-center border-b border-amber-100 pb-2">
                        <span className="text-xs font-bold text-slate-800">সম্পাদনা মোড</span>
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none text-slate-700"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block">গ্রহনকৃত (পিস)</label>
                          <input
                            type="number"
                            value={editReceivedQty}
                            onChange={(e) => setEditReceivedQty(Math.max(0, parseInt(e.target.value, 10) || 0))}
                            className="px-2 py-1 w-full bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block">পরিশোধ (পিস)</label>
                          <input
                            type="number"
                            value={editPaidQty}
                            onChange={(e) => setEditPaidQty(Math.max(0, parseInt(e.target.value, 10) || 0))}
                            className="px-2 py-1 w-full bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block">কেনা রেট (৳)</label>
                          <input
                            type="number"
                            value={editPurchasePrice}
                            step="0.1"
                            onChange={(e) => setEditPurchasePrice(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="px-2 py-1 w-full bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block">বিক্রিত (পিস)</label>
                          <input
                            type="number"
                            value={editSoldQty}
                            onChange={(e) => setEditSoldQty(Math.max(0, parseInt(e.target.value, 10) || 0))}
                            className="px-2 py-1 w-full bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block">বিক্রয় দর (৳)</label>
                          <input
                            type="number"
                            value={editUnitPrice}
                            onChange={(e) => setEditUnitPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="px-2 py-1 w-full bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block">আনুষঙ্গিক খরচ (৳)</label>
                          <input
                            type="number"
                            value={editExpense}
                            onChange={(e) => setEditExpense(Math.max(0, parseInt(e.target.value, 10) || 0))}
                            className="px-2 py-1 w-full bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                          />
                        </div>
                      </div>

                      {editError && <div className="text-[10px] text-rose-500 font-bold text-center">{editError}</div>}

                      <div className="flex justify-end gap-2 border-t border-amber-100 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingLogId(null)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold"
                        >
                          বাতিল
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditSubmit(log.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                        >
                          সংরক্ষণ
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div key={log.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold text-slate-700">{formatDateBengali(log.date)}</span>
                          {log.receivedQty > 0 ? (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-100 text-amber-800">
                              মোমো গ্রহণ
                            </span>
                          ) : log.paidQty && log.paidQty > 0 ? (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-teal-100 text-teal-800">
                              বকেয়া পরিশোধ
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-100 text-blue-800">
                              মোমো বিক্রয়
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLogId(log.id);
                              setEditDate(log.date.slice(0, 10));
                              setEditReceivedQty(log.receivedQty);
                              setEditPaidQty(pq);
                              setEditPurchasePrice(pp);
                              setEditSoldQty(log.soldQty);
                              setEditUnitPrice(log.unitPrice);
                              setEditExpense(log.expense);
                              setEditNote(log.note);
                              setEditError("");
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteMomoLog(log.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {log.receivedQty > 0 || (log.paidQty && log.paidQty > 0) ? (
                          <>
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 block font-bold uppercase">ডেলিভারি পরিমাণ</span>
                              {log.receivedQty > 0 && <p className="font-semibold text-slate-700">গ্রহণ: <b className="text-slate-800">{log.receivedQty} পিস</b></p>}
                              <p className="font-semibold text-rose-600">বকেয়া বিল পিস: <b>{duePcs} পিস</b></p>
                            </div>

                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 block font-bold uppercase">বিলের হিসাব (৳)</span>
                              {log.receivedQty > 0 && <p className="font-semibold text-slate-700">মোট বিল: <b>{formatCurrency(billVal)}</b></p>}
                              <p className="font-semibold text-teal-600">পরিশোধ: <b>{formatCurrency(paidVal)}</b></p>
                              {dueVal > 0 && <p className="font-semibold text-rose-600">বকেয়া বাকি: <b>{formatCurrency(dueVal)}</b></p>}
                              <p className="text-[10px] text-slate-400 font-medium">রেট: ৳{pp}/পিস</p>
                            </div>
                          </>
                        ) : (
                          <div className="col-span-2 text-slate-400 text-[11px] font-medium py-1">
                            এই এন্ট্রিতে কোনো নতুন মোমো ডেলিভারি নেই।
                          </div>
                        )}
                      </div>

                      {log.soldQty > 0 && (
                        <div className="border-t border-slate-100 pt-2 flex justify-between items-center bg-white/40 -mx-4 -mb-4 p-4 rounded-b-xl">
                          <div>
                            <span className="text-[9px] text-slate-400 block font-bold uppercase">বিক্রয় ও নিট লাভ</span>
                            <span className="text-blue-600 font-extrabold text-xs block">বিক্রয়: {formatCurrency(salesVal)}</span>
                            <span className="text-emerald-600 font-black text-xs block">লাভ: {formatCurrency(netProfit)}</span>
                          </div>
                          <div className="text-right text-[10px] text-slate-400">
                            <span>বিক্রিত: {log.soldQty} পিস</span>
                            {log.note && <span className="block italic truncate max-w-[120px]">{log.note}</span>}
                          </div>
                        </div>
                      )}
                      {log.soldQty === 0 && log.note && (
                        <div className="border-t border-slate-100 pt-2 text-[10px] text-slate-400 italic bg-white/40 -mx-4 -mb-4 p-3 rounded-b-xl">
                          মন্তব্য: {log.note}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* NUMERIC KEYPAD COMPONENT */}
      <NumericKeypad
        isOpen={keypadOpen}
        onClose={() => setKeypadOpen(false)}
        title={keypadTitle}
        initialValue={keypadValue}
        onConfirm={handleKeypadConfirm}
        isDecimal={keypadIsDecimal}
      />
    </div>
  );
}
