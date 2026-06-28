import React, { useState } from 'react';
import api from '../services/api';
import { showToast } from '../components/Toast';
import { UploadCloud, FileSpreadsheet, Download, Info, CheckCircle2, AlertCircle } from 'lucide-react';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setResult(null);
    setError(null);
    if (!selectedFile.name.endsWith('.csv')) {
      showToast('Only CSV files are supported.', 'error');
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/sales/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      setResult(response.data.message);
      showToast(response.data.message, 'success');
      setFile(null); // Clear selected file after success
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || "CSV upload failed. Please verify format.";
      setError(detail);
      showToast("Import failed", 'error');
    } finally {
      setUploading(false);
    }
  };

  // Helper to generate a preformatted template CSV client-side
  const handleDownloadSample = () => {
    const headers = ['Customer Name', 'Customer Email', 'Product Name', 'Category Name', 'Quantity', 'Price', 'Date', 'Status'];
    const sampleRows = [
      ['John Doe', 'john.doe@gmail.com', 'Laptop Pro 15', 'Electronics', '1', '1299.99', '2026-06-25', 'Completed'],
      ['Emma Wilson', 'emma.wilson@icloud.com', 'Organic Cotton Hoodie', 'Clothing', '2', '59.99', '2026-06-26', 'Pending'],
      ['Robert Miller', 'robert.miller@gmail.com', 'Single-Serve Coffee Maker', 'Home & Kitchen', '1', '89.99', '2026-06-27', 'Cancelled']
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...sampleRows.map(row => row.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "andon_sales_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Template downloaded successfully.', 'success');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 animate-fade-in">
      
      {/* Description Info Banner */}
      <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 text-indigo-800 dark:text-indigo-300 flex items-start gap-3 shadow-premium">
        <Info size={20} className="shrink-0 text-indigo-500 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200">CSV Template Guidelines</p>
          <p className="text-slate-500 dark:text-slate-400">
            For smooth importing, make sure your CSV contains exactly these columns (headers are case-insensitive):
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {['Customer Name', 'Customer Email', 'Product Name', 'Category Name', 'Quantity', 'Price', 'Date', 'Status'].map((c) => (
              <code key={c} className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border font-mono font-semibold text-[10px] text-brand-600 dark:text-brand-400">
                {c}
              </code>
            ))}
          </div>
        </div>
      </div>

      {/* Drag & Drop Input Zone */}
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 md:p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 bg-white dark:bg-slate-900 shadow-premium
          ${dragActive 
            ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/10' 
            : 'border-slate-350 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
          }
        `}
      >
        <input
          type="file"
          id="csv-file-input"
          accept=".csv"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />
        
        <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4 shadow-inner">
          <UploadCloud size={28} />
        </div>

        {file ? (
          <div className="space-y-1 z-10">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 justify-center">
              <FileSpreadsheet size={16} className="text-emerald-500" />
              {file.name}
            </p>
            <p className="text-xs text-slate-400">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 z-10 pointer-events-none">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Drag & Drop your CSV file here, or click to browse
            </p>
            <p className="text-xs text-slate-400">
              Supports only .csv files up to 10MB
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleDownloadSample}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 shadow-premium transition-colors cursor-pointer"
        >
          <Download size={18} />
          Download Sample Template
        </button>
        
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:bg-brand-500/40 text-white font-semibold text-sm shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all cursor-pointer"
        >
          {uploading ? (
            <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            'Import Sales Data'
          )}
        </button>
      </div>

      {/* Success Indicator Card */}
      {result && (
        <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/40 flex gap-3.5 shadow-premium animate-slide-up">
          <CheckCircle2 size={22} className="text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Import Successful</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{result}</p>
            <p className="text-[11px] text-brand-600 dark:text-brand-400 mt-2 font-medium">
              Check the Dashboard or Sales Records to view your updated metrics!
            </p>
          </div>
        </div>
      )}

      {/* Error Indicator Card */}
      {error && (
        <div className="p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-250 dark:border-rose-900/40 flex gap-3.5 shadow-premium animate-slide-up">
          <AlertCircle size={22} className="text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Import Failed</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              There was an issue processing your CSV. Please check the error details below:
            </p>
            <pre className="mt-3 p-3 bg-rose-950/10 dark:bg-rose-950/40 border border-rose-900/25 rounded-xl font-mono text-[11px] text-rose-800 dark:text-rose-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
              {error}
            </pre>
          </div>
        </div>
      )}

    </div>
  );
};

export default Upload;
