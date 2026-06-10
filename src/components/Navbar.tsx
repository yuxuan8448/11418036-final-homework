import { User } from 'firebase/auth';
import { auth } from '../firebase';
import { Search, LogOut, Moon, Sparkles, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onLogout: () => void;
  onTriggerLogin: () => void;
}

export default function Navbar({
  user,
  searchQuery,
  setSearchQuery,
  onLogout,
  onTriggerLogin,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-natural-bg/80 backdrop-blur-md border-b border-natural-border" id="main-navbar">
      <div className="flex items-center justify-between h-16 px-4 md:px-8 max-w-7xl mx-auto">
        
        {/* Brand Logo Accent */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-natural-primary rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
            木
          </div>
          <div>
            <h1 className="font-sans text-base font-semibold tracking-tight text-natural-dark flex items-center gap-1">
              Komorebi <span className="text-[10px] font-light text-natural-light font-mono">木漏れ日</span>
            </h1>
            <p className="text-[9px] text-natural-muted tracking-wider uppercase font-sans leading-none">日系簡約手帳</p>
          </div>
        </div>

        {/* Global Task Search Bar */}
        <div className="flex-1 max-w-md mx-6 hidden sm:block">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-natural-light" />
            <input
              type="text"
              placeholder="搜尋手帳任務、日程細節..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs font-sans placeholder-natural-muted/70 text-natural-text bg-natural-badge border border-natural-border/70 rounded-full focus:outline-none focus:border-natural-primary focus:bg-white transition-all-custom"
              id="navbar-search-input"
            />
          </div>
        </div>

        {/* User Identity Section */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3" id="navbar-user-profile-widget">
              <div className="flex items-center gap-2 px-2.5 py-1 bg-natural-badge/70 border border-natural-border rounded-full">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-6 h-6 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-natural-border text-natural-primary">
                    <UserIcon size={12} />
                  </div>
                )}
                <span className="text-xs font-medium text-natural-text hidden md:inline">
                  {user.displayName || '手帳會員'}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-natural-light hover:text-red-600 hover:bg-red-50/40 rounded-lg transition-colors cursor-pointer"
                title="登出系統"
                id="logout-button"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={onTriggerLogin}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-natural-primary hover:bg-natural-primary-hover rounded-lg shadow-sm transition-colors cursor-pointer"
              id="navbar-login-trigger"
            >
              <span>立即登入 / 註冊</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
