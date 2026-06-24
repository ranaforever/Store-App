import { Sale, Expense } from "./types";

// Helper to format numbers with Bengali or English digits (English is usually easier to read on POS)
export function formatCurrency(amount: number): string {
  return `৳${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// Convert English digits/months to Bengali for a traditional look if requested
export function toBengaliDigits(num: number | string): string {
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return num
    .toString()
    .replace(/[0-9]/g, (digit) => bengaliDigits[parseInt(digit, 10)]);
}

export function formatDateBengali(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = [
      "জানুয়ারী", "ফেব্রুয়ারী", "মার্চ", "এপ্রিল", "মে", "জুন",
      "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${toBengaliDigits(day)} ${month}, ${toBengaliDigits(year)}`;
  } catch (e) {
    return dateStr;
  }
}

// Generate the text layout for 58mm/80mm POS slip
export function generatePOSSlip(sale: Sale, storeName: string, staffName?: string): string {
  const line = "--------------------------------";
  const doubleLine = "================================";
  
  let slip = "";
  slip += `${storeName.toUpperCase()}\n`;
  slip += `ডিজিটাল মেমো / POS রশিদ\n`;
  slip += `${line}\n`;
  slip += `রশিদ নং: ${sale.invoiceNo}\n`;
  slip += `তারিখ: ${new Date(sale.date).toLocaleString("bn-BD")}\n`;
  slip += `বিক্রয়কর্মী: ${staffName || sale.staffCode || "N/A"}\n`;
  slip += `${doubleLine}\n`;
  slip += `আইটেম            পরিমাণ   মূল্য   মোট\n`;
  slip += `${line}\n`;

  sale.items.forEach((item) => {
    // Pad product name to 16 chars
    const name = item.name.substring(0, 15).padEnd(16, " ");
    const qty = item.quantity.toString().padStart(3, " ");
    const price = item.price.toString().padStart(5, " ");
    const subtotal = item.subtotal.toString().padStart(6, " ");
    slip += `${name}${qty}x${price}${subtotal}\n`;
  });

  slip += `${line}\n`;
  slip += `উপ-মোট:`.padEnd(24, " ") + `৳${sale.subtotal}\n`;
  if (sale.discount > 0) {
    slip += `ডিসকাউন্ট (ছাড়):`.padEnd(24, " ") + `-৳${sale.discount}\n`;
  }
  slip += `${doubleLine}\n`;
  slip += `সর্বমোট বিল:`.padEnd(24, " ") + `৳${sale.total}\n`;
  slip += `গ্রহণ করা হলো:`.padEnd(24, " ") + `৳${sale.receivedAmount}\n`;
  slip += `ফেরত দেওয়া হলো:`.padEnd(24, " ") + `৳${sale.changeAmount}\n`;
  slip += `${doubleLine}\n`;
  slip += `ধন্যবাদ, আবার আসবেন!\n`;
  slip += `Powered by বাদশা ভাইয়ের ট্যালী খাতা\n\n\n`;

  return slip;
}

// Create a formatted message for WhatsApp sharing
export function generateWhatsAppMessage(sale: Sale, storeName: string, staffName?: string): string {
  let msg = `*🛍️ ${storeName}*\n`;
  msg += `*ডিজিটাল মেমো / বিক্রয় রশিদ*\n`;
  msg += `----------------------------------------\n`;
  msg += `*রশিদ নং:* ${sale.invoiceNo}\n`;
  msg += `*তারিখ:* ${new Date(sale.date).toLocaleDateString("bn-BD")}\n`;
  msg += `*বিক্রয়কর্মী:* ${staffName || sale.staffCode || "N/A"}\n`;
  msg += `----------------------------------------\n`;
  msg += `*ক্রয়কৃত পণ্যসমূহ:*\n`;

  sale.items.forEach((item, index) => {
    msg += `${index + 1}. ${item.name} (${item.quantity} x ৳${item.price}) = *৳${item.subtotal}*\n`;
  });

  msg += `----------------------------------------\n`;
  msg += `*উপ-মোট:* ৳${sale.subtotal}\n`;
  if (sale.discount > 0) {
    msg += `*ডিসকাউন্ট (ছাড়):* -৳${sale.discount}\n`;
  }
  msg += `*সর্বমোট বিল:* *৳${sale.total}*\n`;
  msg += `*পেইড:* ৳${sale.receivedAmount}\n`;
  msg += `*ফেরত:* ৳${sale.changeAmount}\n`;
  msg += `----------------------------------------\n`;
  msg += `✨ আমাদের দোকানে আসার জন্য ধন্যবাদ! ✨\n`;
  msg += `_বাদশা ভাইয়ের ডিজিটাল ট্যালী খাতা থেকে প্রেরিত_`;

  return encodeURIComponent(msg);
}

// Helper to check if a date falls within a specific range
export function isDateInRange(
  dateStr: string,
  rangeType: string,
  customStart?: string,
  customEnd?: string
): boolean {
  const dateObj = new Date(dateStr);
  const now = new Date();
  
  // Set times to midnight to avoid issues with hour comparisons
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (rangeType) {
    case "daily": {
      return dateObj >= startOfToday;
    }
    case "weekly": {
      const oneWeekAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
      return dateObj >= oneWeekAgo;
    }
    case "monthly": {
      const oneMonthAgo = new Date(startOfToday.getFullYear(), startOfToday.getMonth() - 1, startOfToday.getDate());
      return dateObj >= oneMonthAgo;
    }
    case "semi-annually": {
      const sixMonthsAgo = new Date(startOfToday.getFullYear(), startOfToday.getMonth() - 6, startOfToday.getDate());
      return dateObj >= sixMonthsAgo;
    }
    case "annually": {
      const oneYearAgo = new Date(startOfToday.getFullYear() - 1, startOfToday.getMonth(), startOfToday.getDate());
      return dateObj >= oneYearAgo;
    }
    case "custom": {
      if (!customStart || !customEnd) return true;
      const start = new Date(customStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      return dateObj >= start && dateObj <= end;
    }
    default:
      return true;
  }
}

// Export sales and expenses combined or separately as CSV (Excel compatible)
export function exportToCSV(
  sales: Sale[],
  expenses: Expense[],
  rangeType: string,
  storeName: string,
  customStart?: string,
  customEnd?: string
): void {
  // Let's filter first
  const filteredSales = sales.filter(s => isDateInRange(s.date, rangeType, customStart, customEnd));
  const filteredExpenses = expenses.filter(e => isDateInRange(e.date, rangeType, customStart, customEnd));

  let csvContent = "";

  // Section 1: Summary Header
  csvContent += `"${storeName} - হিসাবের রিপোর্ট"\n`;
  csvContent += `"রিপোর্ট ধরণ:","${rangeType.toUpperCase()}"\n`;
  if (rangeType === "custom" && customStart && customEnd) {
    csvContent += `"তারিখ পরিসীমা:","${customStart} হতে ${customEnd}"\n`;
  }
  csvContent += `"রিপোর্ট তৈরীর তারিখ:","${new Date().toLocaleString("bn-BD")}"\n\n`;

  // Summary Math
  const totalSalesVal = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const totalExpensesVal = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalSalesVal - totalExpensesVal;

  csvContent += `"মোট বিক্রয় (আয়):","৳${totalSalesVal}"\n`;
  csvContent += `"মোট খরচ:","৳${totalExpensesVal}"\n`;
  csvContent += `"নীট লাভ/ক্ষতি:","৳${netProfit}"\n\n`;

  // Section 2: Sales Records
  csvContent += `"--- বিক্রয় তালিকা (SALES) ---"\n`;
  csvContent += `"রশিদ নং","তারিখ","বিক্রয়কর্মী কোড","পণ্যের নাম ও পরিমাণ","উপ-মোট","ছাড়","সর্বমোট"\n`;
  
  filteredSales.forEach((sale) => {
    const itemsDescription = sale.items
      .map((item) => `${item.name}(${item.quantity}টি x ৳${item.price})`)
      .join("; ");
    const dateFormatted = new Date(sale.date).toLocaleString("bn-BD");
    csvContent += `"${sale.invoiceNo}","${dateFormatted}","${sale.staffCode || "N/A"}","${itemsDescription}","৳${sale.subtotal}","৳${sale.discount}","৳${sale.total}"\n`;
  });

  csvContent += `\n`;

  // Section 3: Expenses Records
  csvContent += `"--- খরচ তালিকা (EXPENSES) ---"\n`;
  csvContent += `"তারিখ","খরচের খাত","পরিমাণ","মন্তব্য/বিবরণ","কর্মী কোড"\n`;

  filteredExpenses.forEach((exp) => {
    const dateFormatted = new Date(exp.date).toLocaleString("bn-BD");
    csvContent += `"${dateFormatted}","${exp.category}","৳${exp.amount}","${exp.note || ""}","${exp.staffCode || "N/A"}"\n`;
  });

  // Adding Excel-friendly UTF-8 BOM representation for correct Bengali rendering
  const BOM = "\ufeff";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${storeName.replace(/\s+/g, "_")}_Report_${rangeType}_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
