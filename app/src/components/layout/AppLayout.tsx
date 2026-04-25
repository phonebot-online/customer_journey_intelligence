import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, ShoppingCart, Store, Megaphone, Search, Mail, Route, GitCompare, ShieldCheck, Menu, X, Network, FlaskConical, PauseCircle } from 'lucide-react';
import TimeWindowSelector from './TimeWindowSelector';

type NavItem = { to: string; label: string; icon: typeof BarChart3; section?: string };

const navItems: NavItem[] = [
  { to: '/', label: 'CEO Overview', icon: BarChart3 },
  { to: '/platform-mix', label: 'Platform Mix', icon: Network, section: 'Strategy' },
  { to: '/scenarios', label: 'Scenarios', icon: FlaskConical, section: 'Strategy' },
  { to: '/holdout', label: 'FB Holdout', icon: PauseCircle, section: 'Strategy' },
  { to: '/web', label: 'Web Orders', icon: ShoppingCart, section: 'Channels' },
  { to: '/store', label: 'Store Sales', icon: Store, section: 'Channels' },
  { to: '/paid', label: 'Paid Media', icon: Megaphone, section: 'Channels' },
  { to: '/organic', label: 'Organic', icon: Search, section: 'Channels' },
  { to: '/email', label: 'Email', icon: Mail, section: 'Channels' },
  { to: '/journey', label: 'Journey', icon: Route, section: 'Channels' },
  { to: '/cross-channel', label: 'Cross-Channel', icon: GitCompare, section: 'Channels' },
  { to: '/qa', label: 'Data Trust', icon: ShieldCheck, section: 'Meta' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900">Phonebot</h1>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <nav className="p-2 space-y-1">
          {navItems.map((item, i) => {
            const prevSection = i > 0 ? navItems[i - 1].section : undefined;
            const showHeader = item.section && item.section !== prevSection;
            return (
              <div key={item.to}>
                {showHeader && (
                  <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{item.section}</p>
                )}
                <NavLink
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex-1" />
          <TimeWindowSelector />
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
