import React from "react";
import { Sale, StaffCode } from "../types";
import { formatCurrency, generatePOSSlip, generateWhatsAppMessage } from "../utils";
import { X, Printer, Share2, Copy, Check, ShoppingBag } from "lucide-react";

interface POSReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  storeName: string;
  staffCodes: StaffCode[];
}

export default function POSReceiptModal({
  isOpen,
  onClose,
  sale,
  storeName,
  staffCodes,
}: POSReceiptModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !sale) return null;

  const staffName = sale.staffCode.toUpperCase() === "ADMIN" 
    ? "এডমিন (মালিক)" 
    : (staffCodes.find(s => s.code.toUpperCase() === sale.staffCode.toUpperCase())?.name || sale.staffCode);

  const slipText = generatePOSSlip(sale, storeName, staffName);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${generateWhatsAppMessage(sale, storeName, staffName)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(slipText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handlePrint = () => {
    // We can use a clean printing technique:
    // Create an iframe or temporary styled div for printing, or use window.print() 
    // with a CSS class that hides everything else. 
    // Let's implement a clean custom print window to print only the receipt.
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("পপ-আপ লকার নিষ্ক্রিয় করুন এবং আবার চেষ্টা করুন।");
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>রশিদ নং: ${sale.invoiceNo}</title>
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 58mm;
              margin: 0;
              padding: 10px;
              font-size: 11px;
              color: #000;
              line-height: 1.3;
            }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            .border-t { border-top: 1px dashed #000; }
            .py-2 { padding-top: 8px; padding-bottom: 8px; }
            .py-1 { padding-top: 4px; padding-bottom: 4px; }
            .my-2 { margin-top: 8px; margin-bottom: 8px; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .grid { display: grid; }
            .grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }
            .col-span-6 { grid-column: span 6 / span 6; }
            .col-span-2 { grid-column: span 2 / span 2; }
            .col-span-4 { grid-column: span 4 / span 4; }
            .text-right { text-align: right; }
            .gap-1 { gap: 4px; }
            .qr-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 1px; width: 60px; height: 60px; background: #fff; margin: 5px auto; }
            .qr-cell { width: 100%; height: 100%; }
            .qr-black { background: #000; }
            .qr-white { background: #fff; }
            .barcode-line { height: 25px; display: inline-block; width: 1px; }
            .barcode-container { display: flex; justify-content: center; margin: 5px auto; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <h3 style="margin: 0; font-size: 14px;">${storeName}</h3>
            <p style="margin: 3px 0; font-size: 9px;">ডিজিটাল মেমো / POS রশিদ</p>
            <p style="margin: 3px 0; font-size: 9px;">রশিদ নং: ${sale.invoiceNo}</p>
          </div>

          <div class="border-t py-2">
            <div class="flex justify-between">
              <span>তারিখ:</span>
              <span>${new Date(sale.date).toLocaleString("bn-BD")}</span>
            </div>
            <div class="flex justify-between">
              <span>বিক্রয়কর্মী:</span>
              <span>${staffName}</span>
            </div>
            <div class="flex justify-between">
              <span>পেমেন্ট মাধ্যম:</span>
              <span>${sale.paymentType === "Cash" ? "Cash (নগদ)" : sale.paymentType === "bKash" ? "bKash (বিকাশ)" : sale.paymentType === "Nogod" ? "Nogod (নগদ)" : sale.paymentType === "Rocket" ? "Rocket (রকেট)" : sale.paymentType === "Card" ? "Card (কার্ড)" : sale.paymentType || "Cash"} ${sale.paymentDetails ? `(${sale.paymentDetails})` : ""}</span>
            </div>
          </div>

          <div class="border-t py-2">
            <div class="grid grid-cols-12 font-bold gap-1" style="border-b: 1px solid #000; padding-bottom: 3px;">
              <span class="col-span-6">আইটেম</span>
              <span class="col-span-2 text-center">পরিমাণ</span>
              <span class="col-span-4 text-right">মূল্য</span>
            </div>
            <div class="py-1">
              ${sale.items.map(item => `
                <div class="grid grid-cols-12 gap-1" style="margin-top: 3px;">
                  <span class="col-span-6">${item.name}</span>
                  <span class="col-span-2 text-center">x${item.quantity}</span>
                  <span class="col-span-4 text-right">${formatCurrency(item.subtotal)}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="border-t py-2" style="font-size: 11px;">
            <div class="flex justify-between">
              <span>উপ-মোট:</span>
              <span>${formatCurrency(sale.subtotal)}</span>
            </div>
            ${sale.discount > 0 ? `
              <div class="flex justify-between">
                <span>ডিসকাউন্ট:</span>
                <span>-${formatCurrency(sale.discount)}</span>
              </div>
            ` : ''}
            <div class="flex justify-between font-bold" style="font-size: 12px; border-top: 1px solid #000; padding-top: 3px; margin-top: 3px;">
              <span>সর্বমোট বিল:</span>
              <span>${formatCurrency(sale.total)}</span>
            </div>
            <div class="flex justify-between">
              <span>গৃহীত টাকা:</span>
              <span>${formatCurrency(sale.receivedAmount)}</span>
            </div>
            <div class="flex justify-between font-bold">
              <span>ফেরত টাকা:</span>
              <span>${formatCurrency(sale.changeAmount)}</span>
            </div>
          </div>

          <div class="border-t py-2 text-center">
            <div style="display: flex; justify-content: center; align-items: center;">
              <!-- Barcode -->
              <div style="display: flex; flex-direction: column; align-items: center;">
                <div class="barcode-container">
                  ${[1,3,1,2,1,1,3,2,1,1,2,3,1,1,2,1,1,3,1,2,1,1,3,1,2,1].map(val => `
                    <div class="barcode-line" style="background: #000; width: ${val === 3 ? '2px' : '1px'}; margin-right: 1px; opacity: ${val === 3 ? '1' : val === 2 ? '0.6' : '0.15'}"></div>
                  `).join('')}
                </div>
                <span style="font-size: 7px; letter-spacing: 1px;">${sale.invoiceNo}</span>
              </div>
            </div>
            <p style="margin: 5px 0 0 0; font-size: 8px;">★ ডিজিটাল ভেরিফিকেশন রশিদ ★</p>
          </div>

          <div class="border-t py-2 text-center" style="font-size: 9px; line-height: 1.4;">
            <p style="margin: 0; font-weight: bold;">✨ ধন্যবাদ, আবার আসবেন! ✨</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div id="receipt-modal-container" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div id="receipt-modal-card" className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-blue-50/50">
          <div className="flex items-center gap-2 text-blue-800">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-800">বিক্রয় রশিদ (ডিজিটাল মেমো)</h3>
          </div>
          <button
            id="close-receipt-btn"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-50 flex flex-col items-center">
          
          {/* Thermal Slip Styling Container */}
          <div 
            id="thermal-slip-view" 
            className="bg-white p-6 shadow-md border border-slate-200 w-full max-w-xs font-mono text-xs text-slate-800 rounded-lg relative overflow-hidden"
            style={{ backgroundImage: "linear-gradient(#f9fafb 0%, #ffffff 100%)" }}
          >
            {/* Top serrated edge look */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[linear-gradient(45deg,transparent_33.333%,#cbd5e1_33.333%,#cbd5e1_66.667%,transparent_66.667%)] bg-[size:8px_8px]" />
            
            {/* Shop Ribbon / Logo Badge */}
            <div className="flex flex-col items-center pt-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-1.5 border border-blue-100">
                <ShoppingBag className="w-4.5 h-4.5" />
              </div>
              <h4 className="font-extrabold text-sm text-slate-950 text-center tracking-wide">{storeName}</h4>
              <p className="text-[9px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full mt-1">রশিদ নং: {sale.invoiceNo}</p>
            </div>

            <div className="border-t border-dashed border-slate-300 py-2.5 space-y-1 text-[10px] text-slate-600">
              <div className="flex justify-between">
                <span className="font-medium">তারিখ:</span>
                <span className="font-semibold text-slate-800">{new Date(sale.date).toLocaleString("bn-BD", { hour12: true })}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">বিক্রয়কর্মী:</span>
                <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[9px]">
                  {staffName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">পেমেন্ট মাধ্যম:</span>
                <span className="font-bold text-slate-800 text-[9px]">
                  {sale.paymentType === "Cash" ? "Cash (নগদ)" : 
                   sale.paymentType === "bKash" ? "bKash (বিকাশ)" : 
                   sale.paymentType === "Nogod" ? "Nogod (নগদ)" : 
                   sale.paymentType === "Rocket" ? "Rocket (রকেট)" : 
                   sale.paymentType === "Card" ? "Card (কার্ড)" : sale.paymentType || "Cash"} 
                  {sale.paymentDetails ? ` (${sale.paymentDetails})` : ""}
                </span>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-300 py-2">
              <div className="grid grid-cols-12 gap-1 font-bold text-slate-800 pb-1.5 mb-1.5 border-b border-slate-200 text-[10px]">
                <span className="col-span-6">আইটেম</span>
                <span className="col-span-2 text-center">পরিমাণ</span>
                <span className="col-span-4 text-right">মূল্য</span>
              </div>
              
              <div className="space-y-1.5 py-1 text-[11px]">
                {sale.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-1 text-slate-600">
                    <span className="col-span-6 truncate font-semibold text-slate-800">{item.name}</span>
                    <span className="col-span-2 text-center text-slate-700">×{item.quantity}</span>
                    <span className="col-span-4 text-right font-semibold text-slate-800">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-dashed border-slate-300 pt-2.5 pb-1.5 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-500">
                <span>উপ-মোট:</span>
                <span>{formatCurrency(sale.subtotal)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>ডিসকাউন্ট (ছাড়):</span>
                  <span>-{formatCurrency(sale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-slate-950 border-t border-slate-200 pt-1.5 text-xs">
                <span>সর্বমোট বিল:</span>
                <span className="text-blue-700 text-sm">{formatCurrency(sale.total)}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1">
                <span>গৃহীত টাকা:</span>
                <span>{formatCurrency(sale.receivedAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-1">
                <span>ফেরত টাকা:</span>
                <span>{formatCurrency(sale.changeAmount)}</span>
              </div>
            </div>

            {/* Custom Barcode Aesthetic */}
            <div className="border-t border-dashed border-slate-300 pt-3.5 pb-2 flex flex-col items-center">
              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center gap-[1px] h-9 w-28 bg-white opacity-90 border border-slate-200 p-0.5 shadow-xs">
                  {[1,3,1,2,1,1,3,2,1,1,2,3,1,1,2,1,1,3,1,2,1,1,3,1,2,1].map((val, i) => (
                    <div 
                      key={i} 
                      className="bg-slate-900 h-full flex-1" 
                      style={{ opacity: val === 3 ? 1 : val === 2 ? 0.6 : 0.15 }}
                    />
                  ))}
                </div>
                <span className="text-[7px] text-slate-400 uppercase tracking-widest mt-1 font-bold">{sale.invoiceNo}</span>
              </div>
              <span className="text-[7px] text-slate-400 uppercase tracking-widest font-semibold mt-1">★ ডিজিটাল বারকোড রশিদ ★</span>
            </div>

            <div className="pt-2 text-center text-[10px] text-slate-400 space-y-1">
              <p className="font-bold text-slate-600">✨ ধন্যবাদ, আবার আসবেন! ✨</p>
            </div>

            {/* Bottom serrated edge look */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[linear-gradient(45deg,transparent_33.333%,#cbd5e1_33.333%,#cbd5e1_66.667%,transparent_66.667%)] bg-[size:8px_8px] transform rotate-180" />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              id="print-pos-btn"
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-sm shadow-blue-200"
            >
              <Printer className="w-4 h-4" />
              <span>রশিদ প্রিন্ট</span>
            </button>

            <a
              id="share-whatsapp-btn"
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-all shadow-sm shadow-green-100"
            >
              <Share2 className="w-4 h-4" />
              <span>হোয়াটসঅ্যাপে শেয়ার</span>
            </a>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              id="copy-text-btn"
              onClick={handleCopy}
              className={`flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-medium border transition-all ${
                copied
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-blue-600" />
                  <span>কপি হয়েছে</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>লেখা কপি করুন</span>
                </>
              )}
            </button>

            <button
              id="new-sale-btn"
              onClick={onClose}
              className="py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium transition-all text-center"
            >
              নতুন খদ্দের / বিক্রয়
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
