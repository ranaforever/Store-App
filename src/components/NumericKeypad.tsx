import React from "react";
import { X, Delete, Check, CornerDownLeft } from "lucide-react";

interface NumericKeypadProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialValue: string | number;
  onConfirm: (value: number) => void;
  isDecimal?: boolean;
}

export default function NumericKeypad({
  isOpen,
  onClose,
  title,
  initialValue,
  onConfirm,
  isDecimal = false,
}: NumericKeypadProps) {
  const [currentValue, setCurrentValue] = React.useState<string>("");

  React.useEffect(() => {
    if (isOpen) {
      setCurrentValue(initialValue !== undefined && initialValue !== null && initialValue !== 0 ? initialValue.toString() : "");
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleKeyPress = (key: string) => {
    if (key === ".") {
      if (!isDecimal) return; // Ignore decimals if not allowed
      if (currentValue.includes(".")) return; // Allow only one dot
      setCurrentValue((prev) => (prev === "" ? "0." : prev + "."));
    } else {
      // Avoid leading zeros unless followed by decimal
      if (currentValue === "0" && key === "0") return;
      if (currentValue === "0" && key !== ".") {
        setCurrentValue(key);
      } else {
        setCurrentValue((prev) => prev + key);
      }
    }
  };

  const handleBackspace = () => {
    setCurrentValue((prev) => {
      if (prev.length <= 1) return "";
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    setCurrentValue("");
  };

  const handleDone = () => {
    const numericValue = parseFloat(currentValue) || 0;
    onConfirm(numericValue);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in">
      <div 
        className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-2xl border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up"
        id="numeric-keypad-panel"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-extrabold text-slate-800 text-sm">{title}</h4>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Display screen */}
        <div className="p-4 bg-slate-900 text-white flex flex-col items-end justify-center min-h-[70px] px-6 select-none">
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">বর্তমান টাইপ</span>
          <div className="text-3xl font-black font-mono tracking-wider truncate max-w-full">
            {currentValue || "0"}
          </div>
        </div>

        {/* Grid keys */}
        <div className="p-4 bg-slate-50/50 grid grid-cols-3 gap-2.5">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="py-4 bg-white hover:bg-slate-100 text-slate-800 font-black text-xl rounded-2xl shadow-xs border border-slate-200/50 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
            >
              {num}
            </button>
          ))}

          {/* Special & Bottom Row */}
          <button
            type="button"
            onClick={handleClear}
            className="py-4 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs rounded-2xl shadow-xs border border-rose-100 transition-all cursor-pointer active:scale-95 flex items-center justify-center uppercase tracking-wide"
          >
            মুছুন
          </button>

          <button
            type="button"
            onClick={() => handleKeyPress("0")}
            className="py-4 bg-white hover:bg-slate-100 text-slate-800 font-black text-xl rounded-2xl shadow-xs border border-slate-200/50 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            className="py-4 bg-amber-50 hover:bg-amber-100 text-amber-600 font-extrabold text-xl rounded-2xl shadow-xs border border-amber-100 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
            aria-label="Delete"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Decimal option if enabled & Done Block */}
        <div className="p-4 pt-0 bg-slate-50/50 flex gap-2">
          {isDecimal && (
            <button
              type="button"
              onClick={() => handleKeyPress(".")}
              className="py-3 px-6 bg-white hover:bg-slate-100 text-slate-700 font-black text-lg rounded-xl border border-slate-200 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              .
            </button>
          )}
          <button
            type="button"
            onClick={handleDone}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>নিশ্চিত করুন (Done)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
