import React from 'react';
import { X, Calendar, User, ShoppingBag, DollarSign, Tag, Info } from 'lucide-react';

const ViewDetailsModal = ({ isOpen, sale, onClose }) => {
  if (!isOpen || !sale) return null;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(val);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200 dark:border-amber-900/30';
      default:
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-200 dark:border-rose-900/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-scale-in"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <Info size={18} className="text-brand-500" />
            <span className="font-display font-bold">Transaction Details</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Order ID & Status Banner */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Order Identifier</p>
              <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">#ORD-{String(sale.id).padStart(5, '0')}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${getStatusStyle(sale.status)}`}>
              {sale.status}
            </span>
          </div>

          {/* Details list */}
          <div className="space-y-4">
            
            {/* Customer Details */}
            <div className="flex gap-3">
              <User size={16} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Customer Information</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-250 mt-0.5">{sale.customer_name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{sale.customer_email}</p>
              </div>
            </div>

            {/* Product & Category */}
            <div className="flex gap-3">
              <ShoppingBag size={16} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Product Name</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-250 mt-0.5">{sale.product_name}</p>
                <div className="inline-flex items-center gap-1 mt-1 text-xs text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/20 px-2 py-0.5 rounded-md font-medium">
                  <Tag size={12} />
                  {sale.category_name}
                </div>
              </div>
            </div>

            {/* Price Calculations */}
            <div className="flex gap-3">
              <DollarSign size={16} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Purchase Calculations</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {sale.quantity} unit{sale.quantity > 1 ? 's' : ''} @ {formatCurrency(sale.price)} each
                </p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
                  Total Order Value: {formatCurrency(sale.quantity * sale.price)}
                </p>
              </div>
            </div>

            {/* Date */}
            <div className="flex gap-3">
              <Calendar size={16} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Transaction Date</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {new Date(sale.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewDetailsModal;
