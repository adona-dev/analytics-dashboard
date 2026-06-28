import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { 
  Menu, 
  Sun, 
  Moon, 
  RefreshCw, 
  User
} from 'lucide-react';

const Topbar = ({ onMenuToggle }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const location = useLocation();
  const [refreshing, setRefreshing] = React.useState(false);

  // Derive section title from path
  const getSectionTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard Overview';
      case '/sales':
        return 'Sales Database';
      case '/upload':
        return 'Import Sales Records';
      default:
        return 'Analytics Console';
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // Dispatch a global event so active pages can catch and reload
    const event = new CustomEvent('app-refresh');
    window.dispatchEvent(event);
    
    // Animate spinner briefly
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  };

  return (
    <header className="h-16 px-4 md:px-6 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md sticky top-0 z-30">
      
      {/* Mobile Hamburger & Title */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuToggle}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="font-display font-bold text-lg md:text-xl text-slate-800 dark:text-slate-100 tracking-tight">
          {getSectionTitle()}
        </h1>
      </div>

      {/* Global Utilities */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
          title="Refresh Dashboard Data"
          disabled={refreshing}
        >
          <RefreshCw size={18} className={`${refreshing ? 'animate-spin text-brand-600 dark:text-brand-400' : ''}`} />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme Mode"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

        {/* Compact User Identity */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-semibold text-sm shadow-md shadow-brand-500/10">
            <User size={15} />
          </div>
          <span className="hidden sm:inline text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize truncate max-w-[100px]">
            {user?.username}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
