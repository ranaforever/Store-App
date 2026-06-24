import React from "react";
import { Product, StaffCode, CartItem, Sale } from "../types";
import { formatCurrency } from "../utils";
import { 
  Search, Plus, Minus, Trash2, ShoppingCart, 
  CheckCircle, HelpCircle, ShieldCheck, Tag, Eye, EyeOff
} from "lucide-react";

interface POSProps {
  products: Product[];
  staffCodes: StaffCode[];
  onSaleComplete: (sale: Sale) => void;
}

export default function POS({ products, staffCodes, onSaleComplete }: POSProps) {
  // POS State
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedStaff, setSelectedStaff] = React.useState(() => {
    return localStorage.getItem("activeStaffCode") || "";
  });
  const [showStaffCode, setShowStaffCode] = React.useState(false);
  const [discount, setDiscount] = React.useState<number>(0);
  const [receivedAmount, setReceivedAmount] = React.useState<number>(0);
  const [isMobileCartOpen, setIsMobileCartOpen] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");

  // Product Filter
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Cart Management
  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
    setErrorMsg("");
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const total = Math.max(subtotal - discount, 0);
  const changeAmount = Math.max(receivedAmount - total, 0);

  // Handle Checkout
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (cart.length === 0) {
      setErrorMsg("দয়া করে ঝুড়িতে অন্ততঃ একটি পণ্য যোগ করুন!");
      return;
    }

    if (!selectedStaff) {
      setErrorMsg("দয়া করে বিক্রয়কর্মীর কোড নির্বাচন বা প্রবেশ করুন!");
      return;
    }

    // Validate staff code exists
    const isValidStaff = selectedStaff.toUpperCase() === "ADMIN" || staffCodes.some(
      (s) => s.code.toUpperCase() === selectedStaff.toUpperCase()
    );
    if (!isValidStaff) {
      setErrorMsg("ভুল বিক্রয়কর্মী কোড! সঠিক কোড নির্বাচন করুন বা এডমিন প্যানেল থেকে তৈরি করুন।");
      return;
    }

    if (receivedAmount < total) {
      setErrorMsg("গৃহীত টাকার পরিমাণ সর্বমোট বিলের চেয়ে কম হতে পারবে না!");
      return;
    }

    // Generate Invoice Number
    const invoiceNo = `INV-${Math.floor(100000 + Math.random() * 900000)}`;

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      invoiceNo,
      date: new Date().toISOString(),
      items: cart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
      })),
      discount,
      subtotal,
      total,
      staffCode: selectedStaff.toUpperCase(),
      receivedAmount,
      changeAmount,
    };

    // Callback to App
    onSaleComplete(newSale);

    // Reset State
    setCart([]);
    setDiscount(0);
    setReceivedAmount(0);
    setSelectedStaff("");
    setIsMobileCartOpen(false);
  };

  // Auto set received amount to total for quick convenience
  const handleQuickExactPayment = () => {
    setReceivedAmount(total);
  };

  return (
    <div id="pos-tab-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* LEFT COLUMN: PRODUCT LISTING (8 Cols on Large Screen) */}
      <div id="pos-product-section" className="lg:col-span-7 xl:col-span-8 space-y-4">
        
        {/* Search Bar Widget */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="product-search-input"
              type="text"
              placeholder="পণ্য খুঁজুন (যেমন: তেল, চাল)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
            />
          </div>
          <span className="hidden sm:inline-block text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded">
            মোট পণ্য: {products.length}টি
          </span>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 text-xs">
            কোন পণ্য খুঁজে পাওয়া যায়নি। এডমিন প্যানেল থেকে নতুন পণ্য যোগ করতে পারেন।
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-300 text-left hover:shadow-md hover:shadow-blue-50/40 transition-all cursor-pointer flex flex-col justify-between h-36 relative group"
              >
                {/* Price Tag */}
                <span className="absolute top-3 right-3 text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
                  ৳{product.price}
                </span>

                <div className="pt-4 pr-6">
                  <h4 className="font-bold text-slate-800 text-xs line-clamp-2 leading-relaxed">
                    {product.name}
                  </h4>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 w-full text-slate-400 group-hover:text-blue-600 transition-colors">
                  <span className="text-[10px] font-semibold">কার্টে যোগ করুন</span>
                  <Plus className="w-4 h-4 p-0.5 bg-slate-50 group-hover:bg-blue-50 rounded-full text-blue-600" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: DESKTOP CHECKOUT PANEL (4 Cols on Large Screen) */}
      <div id="pos-checkout-section" className="hidden lg:block lg:col-span-5 xl:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 sticky top-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShoppingCart className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-800 text-sm">হিসাব ও মেমো এন্ট্রি</h3>
        </div>

        {/* Error Notification Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl font-medium leading-relaxed">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Cart Listing */}
        {cart.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            ঝুড়ি খালি! বিক্রয় করতে বাম পাশের পণ্যে ক্লিক করুন।
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 text-xs truncate">{item.product.name}</h4>
                  <span className="text-[10px] text-slate-400 block mt-0.5">৳{item.product.price} / প্রতি ইউনিট</span>
                </div>

                {/* Qty Controllers */}
                <div className="flex items-center bg-white rounded-lg border border-slate-100 p-1 gap-1">
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="p-1 hover:bg-slate-50 text-slate-500 rounded"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold px-1.5 min-w-[20px] text-center text-slate-800">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="p-1 hover:bg-slate-50 text-slate-500 rounded"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Subtotal & Delete */}
                <div className="flex items-center gap-2 pl-1">
                  <span className="text-xs font-extrabold text-slate-800">
                    ৳{item.product.price * item.quantity}
                  </span>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Checkout Forms & Calculations */}
        <form onSubmit={handleCheckout} className="space-y-4 border-t border-slate-100 pt-4">
          
          {/* Salesman input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 block">বিক্রয়কর্মী কোড *</label>
            <div className="relative">
              <input
                type={(selectedStaff.toUpperCase() === "ADMIN" || staffCodes.some(s => s.code.toUpperCase() === selectedStaff.toUpperCase())) ? "password" : (showStaffCode ? "text" : "password")}
                value={selectedStaff}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setSelectedStaff(val);
                  const matched = staffCodes.find(s => s.code.toUpperCase() === val);
                  if (matched) {
                    localStorage.setItem("activeStaffCode", val);
                  }
                }}
                placeholder="বিক্রয়কর্মী কোড লিখুন..."
                className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
              />
              {!(selectedStaff.toUpperCase() === "ADMIN" || staffCodes.some(s => s.code.toUpperCase() === selectedStaff.toUpperCase())) && (
                <button
                  type="button"
                  onClick={() => setShowStaffCode(!showStaffCode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showStaffCode ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              )}
            </div>
            {selectedStaff && (() => {
              if (selectedStaff.toUpperCase() === "ADMIN") {
                return (
                  <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                    <span>● কর্মী: এডমিন (মালিক) ✅</span>
                  </p>
                );
              }
              const matched = staffCodes.find(s => s.code.toUpperCase() === selectedStaff.toUpperCase());
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

          {/* Discount Field */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-slate-500 block">ডিসকাউন্ট বা ছাড় (৳)</label>
              <span className="text-[9px] text-blue-600 font-bold flex items-center gap-0.5">
                <Tag className="w-3 h-3" />
                ফ্ল্যাট ছাড়
              </span>
            </div>
            <input
              type="number"
              min="0"
              max={subtotal}
              placeholder="0"
              value={discount || ""}
              onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Money Maths */}
          <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-100">
            <div className="flex justify-between text-xs text-slate-500">
              <span>উপ-মোট বিল:</span>
              <span className="font-bold">{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-xs text-amber-600 font-medium">
                <span>ছাড় (মাইনাস):</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-800 border-t border-slate-200/50 pt-2">
              <span>সর্বমোট প্রদেয়:</span>
              <span className="text-blue-700 text-base">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Paid Received Amount */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-slate-500 block">গৃহীত নগদ টাকা (৳) *</label>
              <button
                type="button"
                onClick={handleQuickExactPayment}
                disabled={total === 0}
                className="text-[10px] text-blue-700 hover:text-blue-800 font-bold bg-blue-50 px-2 py-0.5 rounded-sm transition-colors cursor-pointer"
              >
                বরাবর পরিশোধ (Exact)
              </button>
            </div>
            <input
              type="number"
              min="0"
              required
              placeholder="0"
              value={receivedAmount || ""}
              onChange={(e) => setReceivedAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Change Math return */}
          {receivedAmount > total && (
            <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 font-bold">
              <span>খদ্দেরকে ফেরত দিন:</span>
              <span className="text-base">{formatCurrency(changeAmount)}</span>
            </div>
          )}

          {/* Check out Trigger Button */}
          <button
            id="checkout-trigger-btn"
            type="submit"
            disabled={cart.length === 0}
            className={`w-full py-3 rounded-xl font-bold text-xs text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              cart.length === 0
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200"
            }`}
          >
            <CheckCircle className="w-4.5 h-4.5" />
            <span>মেমো জেনারেট করুন (রশিদ তৈরী)</span>
          </button>

        </form>
      </div>

      {/* MOBILE FLOATING ACTION SUMMARY BAR */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 px-4 py-3 bg-slate-900 text-white flex items-center justify-between z-30 shadow-2xl rounded-t-2xl border-t border-slate-800">
        <div className="flex items-center gap-2">
          <div className="relative">
            <ShoppingCart className="w-5 h-5 text-blue-400" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">মোট বিল</span>
            <span className="text-sm font-bold text-blue-300">{formatCurrency(total)}</span>
          </div>
        </div>

        <button
          id="mobile-checkout-drawer-trigger"
          onClick={() => setIsMobileCartOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
        >
          <span>হিসাব ও মেমো</span>
        </button>
      </div>

      {/* MOBILE FULLSCREEN CART DRAWER MODAL */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end z-50">
          <div className="bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6 flex flex-col shadow-2xl border-t border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">হিসাব ও মেমো এন্ট্রি</h3>
              </div>
              <button
                id="close-mobile-cart-btn"
                onClick={() => setIsMobileCartOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-lg"
              >
                বন্ধ করুন
              </button>
            </div>

            {/* Error Notification inside drawer */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl font-medium leading-relaxed">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Mobile Cart Items */}
            {cart.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                ঝুড়ি খালি! বিক্রয় করতে পণ্যে ক্লিক করুন।
              </div>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-xs truncate">{item.product.name}</h4>
                      <span className="text-[10px] text-slate-400 block mt-0.5">৳{item.product.price} / প্রতি ইউনিট</span>
                    </div>

                    {/* Qty Controllers */}
                    <div className="flex items-center bg-white rounded-lg border border-slate-100 p-1 gap-1">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="p-1 hover:bg-slate-50 text-slate-500 rounded"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold px-1.5 text-slate-800">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="p-1 hover:bg-slate-50 text-slate-500 rounded"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Subtotal & Delete */}
                    <div className="flex items-center gap-2 pl-1">
                      <span className="text-xs font-extrabold text-slate-800">৳{item.product.price * item.quantity}</span>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCheckout} className="space-y-4 border-t border-slate-100 pt-4">
              
              {/* Salesman input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 block">বিক্রয়কর্মী কোড *</label>
                <div className="relative">
                  <input
                    type={(selectedStaff.toUpperCase() === "ADMIN" || staffCodes.some(s => s.code.toUpperCase() === selectedStaff.toUpperCase())) ? "password" : (showStaffCode ? "text" : "password")}
                    value={selectedStaff}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setSelectedStaff(val);
                      const matched = staffCodes.find(s => s.code.toUpperCase() === val);
                      if (matched) {
                        localStorage.setItem("activeStaffCode", val);
                      }
                    }}
                    placeholder="বিক্রয়কর্মী কোড লিখুন..."
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
                  />
                  {!(selectedStaff.toUpperCase() === "ADMIN" || staffCodes.some(s => s.code.toUpperCase() === selectedStaff.toUpperCase())) && (
                    <button
                      type="button"
                      onClick={() => setShowStaffCode(!showStaffCode)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showStaffCode ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  )}
                </div>
                {selectedStaff && (() => {
                  if (selectedStaff.toUpperCase() === "ADMIN") {
                    return (
                      <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                        <span>● কর্মী: এডমিন (মালিক) ✅</span>
                      </p>
                    );
                  }
                  const matched = staffCodes.find(s => s.code.toUpperCase() === selectedStaff.toUpperCase());
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

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 block">ডিসকাউন্ট বা ছাড় (৳)</label>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  placeholder="0"
                  value={discount || ""}
                  onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-100">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>উপ-মোট বিল:</span>
                  <span className="font-bold">{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xs text-amber-600 font-medium">
                    <span>ছাড়:</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-800 border-t border-slate-200/50 pt-2">
                  <span>সর্বমোট প্রদেয়:</span>
                  <span className="text-blue-700 text-base">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-500 block">গৃহীত নগদ টাকা (৳) *</label>
                  <button
                    type="button"
                    onClick={handleQuickExactPayment}
                    className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-sm"
                  >
                    Exact Pay
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="0"
                  value={receivedAmount || ""}
                  onChange={(e) => setReceivedAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold focus:outline-none focus:border-blue-500"
                />
              </div>

              {receivedAmount > total && (
                <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 font-bold">
                  <span>খদ্দেরকে ফেরত দিন:</span>
                  <span className="text-base">{formatCurrency(changeAmount)}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-blue-100"
              >
                মেমো জেনারেট করুন (রশিদ তৈরী)
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
