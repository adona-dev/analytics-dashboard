import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { showToast } from '../components/Toast';
import SaleModal from '../components/SaleModal';
import ConfirmModal from '../components/ConfirmModal';
import ViewDetailsModal from '../components/ViewDetailsModal';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Download, 
  Eye, 
  Edit3, 
  Trash2, 
  ChevronsUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  const categories = [
    'All', 
    'Electronics', 
    'Clothing', 
    'Home & Kitchen', 
    'Sports & Outdoors', 
    'Books & Media'
  ];

  const fetchSales = async () => {
    setLoading(true);
    try {
      const response = await api.get('/sales', {
        params: {
          page,
          size,
          search: search.trim() || undefined,
          category: category !== 'All' ? category : undefined,
          status: status !== 'All' ? status : undefined,
          sort_by: sortBy,
          sort_dir: sortDir
        }
      });
      setSales(response.data.items);
      setTotal(response.data.total);
      setPages(response.data.pages);
    } catch (err) {
      console.error(err);
      showToast('Failed to retrieve sales records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [page, size, category, status, sortBy, sortDir]);

  // Debounced search on enter key or search click
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSales();
  };

  // Trigger reload on Topbar refresh
  useEffect(() => {
    const handleGlobalRefresh = () => {
      fetchSales();
    };
    window.addEventListener('app-refresh', handleGlobalRefresh);
    return () => window.removeEventListener('app-refresh', handleGlobalRefresh);
  }, [page, size, search, category, status, sortBy, sortDir]);

  // Resolve Column Sorting Indicators
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
    setPage(1);
  };

  const renderSortIcon = (column) => {
    if (sortBy !== column) return <ChevronsUpDown size={14} className="text-slate-400" />;
    return sortDir === 'asc' 
      ? <ArrowUp size={14} className="text-brand-600 dark:text-brand-400" /> 
      : <ArrowDown size={14} className="text-brand-600 dark:text-brand-400" />;
  };

  // CRUD API Calls
  const handleSaveSale = async (payload) => {
    try {
      if (selectedSale) {
        // Edit Mode
        const response = await api.put(`/sales/${selectedSale.id}`, payload);
        showToast('Sales record updated successfully.', 'success');
      } else {
        // Add Mode
        const response = await api.post('/sales', payload);
        showToast('New sales record created successfully.', 'success');
      }
      fetchSales();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || 'Failed to save sales record.';
      showToast(errMsg, 'error');
      throw err;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSale) return;
    try {
      await api.delete(`/sales/${selectedSale.id}`);
      showToast('Sales record deleted successfully.', 'success');
      setIsConfirmModalOpen(false);
      setSelectedSale(null);
      fetchSales();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete sales record.', 'error');
    }
  };

  // CSV Exporter
  const handleExportCSV = () => {
    if (sales.length === 0) {
      showToast('No record available to export.', 'warning');
      return;
    }

    const headers = ['Order ID', 'Customer Name', 'Customer Email', 'Product Name', 'Category Name', 'Quantity', 'Price', 'Date', 'Status', 'Total Price'];
    const rows = sales.map(s => [
      `ORD-${String(s.id).padStart(5, '0')}`,
      s.customer_name,
      s.customer_email,
      s.product_name,
      s.category_name,
      s.quantity,
      s.price,
      s.date,
      s.status,
      s.quantity * s.price
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_export_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported current page sales to CSV.', 'success');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400';
      default:
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Search & Actions Panel */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-96 flex gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, product..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm shadow-premium"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm shadow-md shadow-brand-500/10 cursor-pointer transition-colors"
          >
            Search
          </button>
        </form>

        {/* Buttons: Add & Export */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 shadow-premium transition-colors cursor-pointer"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            onClick={() => {
              setSelectedSale(null);
              setIsSaleModalOpen(true);
            }}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all cursor-pointer"
          >
            <Plus size={16} />
            Add Sale
          </button>
        </div>

      </div>

      {/* Advanced Filters Panel */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-premium flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <Filter size={14} />
          Filters
        </div>
        
        {/* Category Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">Category:</span>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs text-slate-700 dark:text-slate-350 focus:outline-none cursor-pointer"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Status Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">Status:</span>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs text-slate-700 dark:text-slate-350 focus:outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Info Label */}
        <span className="text-xs text-slate-400 ml-auto">
          Found {total} transactions
        </span>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800/80 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th onClick={() => handleSort('id')} className="py-4 px-6 cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-slate-800/40">
                  <div className="flex items-center gap-1.5">Order ID {renderSortIcon('id')}</div>
                </th>
                <th onClick={() => handleSort('customer')} className="py-4 px-6 cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-slate-800/40">
                  <div className="flex items-center gap-1.5">Customer {renderSortIcon('customer')}</div>
                </th>
                <th onClick={() => handleSort('product')} className="py-4 px-6 cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-slate-800/40">
                  <div className="flex items-center gap-1.5">Product {renderSortIcon('product')}</div>
                </th>
                <th onClick={() => handleSort('category')} className="py-4 px-6 cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-slate-800/40">
                  <div className="flex items-center gap-1.5">Category {renderSortIcon('category')}</div>
                </th>
                <th onClick={() => handleSort('quantity')} className="py-4 px-6 cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-slate-800/40">
                  <div className="flex items-center gap-1.5">Qty {renderSortIcon('quantity')}</div>
                </th>
                <th onClick={() => handleSort('price')} className="py-4 px-6 cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-slate-800/40">
                  <div className="flex items-center gap-1.5">Price {renderSortIcon('price')}</div>
                </th>
                <th onClick={() => handleSort('total')} className="py-4 px-6 cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-slate-800/40">
                  <div className="flex items-center gap-1.5">Total {renderSortIcon('total')}</div>
                </th>
                <th onClick={() => handleSort('date')} className="py-4 px-6 cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-slate-800/40">
                  <div className="flex items-center gap-1.5">Date {renderSortIcon('date')}</div>
                </th>
                <th onClick={() => handleSort('status')} className="py-4 px-6 cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-slate-800/40">
                  <div className="flex items-center gap-1.5">Status {renderSortIcon('status')}</div>
                </th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/85 dark:divide-slate-800/70 text-sm">
              {loading ? (
                // Skeletons
                [...Array(size)].map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    {[...Array(10)].map((_, cellIdx) => (
                      <td key={cellIdx} className="py-4 px-6">
                        <div className="h-4 bg-slate-150 dark:bg-slate-800 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sales.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-3xl">📭</span>
                      <p className="font-semibold text-sm mt-1">No sales records found</p>
                      <p className="text-xs text-slate-400">Try adjusting your filters or upload a CSV file.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Rows
                sales.map((sale) => (
                  <tr 
                    key={sale.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="py-3.5 px-6 font-mono text-xs font-bold text-slate-700 dark:text-slate-350">
                      #ORD-{String(sale.id).padStart(5, '0')}
                    </td>
                    <td className="py-3.5 px-6 min-w-[140px]">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{sale.customer_name}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{sale.customer_email}</div>
                    </td>
                    <td className="py-3.5 px-6 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                      {sale.product_name}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {sale.category_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-700 dark:text-slate-300 font-semibold">
                      {sale.quantity}
                    </td>
                    <td className="py-3.5 px-6 text-slate-700 dark:text-slate-300 font-semibold">
                      ${sale.price.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-slate-800 dark:text-slate-200">
                      ${(sale.quantity * sale.price).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-6 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {sale.date}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-lg ${getStatusBadge(sale.status)}`}>
                        {sale.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedSale(sale);
                            setIsDetailsModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSale(sale);
                            setIsSaleModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSale(sale);
                            setIsConfirmModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pages > 0 && (
          <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
            {/* Limit Selector */}
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select
                value={size}
                onChange={(e) => {
                  setSize(parseInt(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none"
              >
                <option value="10">10 rows</option>
                <option value="20">20 rows</option>
                <option value="50">50 rows</option>
              </select>
            </div>

            {/* Range Text */}
            <span>
              Showing {Math.min((page - 1) * size + 1, total)} to {Math.min(page * size, total)} of {total} records
            </span>

            {/* Pagination Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1 || loading}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-semibold text-slate-700 dark:text-slate-350 px-2">
                Page {page} of {pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(p + 1, pages))}
                disabled={page === pages || loading}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sale Modal (Add/Edit) */}
      <SaleModal
        isOpen={isSaleModalOpen}
        sale={selectedSale}
        onClose={() => {
          setIsSaleModalOpen(false);
          setSelectedSale(null);
        }}
        onSave={handleSaveSale}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Delete Sales Record"
        message="Are you sure you want to delete this sales record? This action is permanent and cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsConfirmModalOpen(false);
          setSelectedSale(null);
        }}
      />

      {/* Details View Modal */}
      <ViewDetailsModal
        isOpen={isDetailsModalOpen}
        sale={selectedSale}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedSale(null);
        }}
      />

    </div>
  );
};

export default Sales;
