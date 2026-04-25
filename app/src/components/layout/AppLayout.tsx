import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, ShoppingCart, Store, Megaphone, Search, Mail, Route, GitCompare, ShieldCheck, Menu, X } from 'lucide-react';
import TimeWindowSelector from './TimeWindowSelector';

const navItems = [
  { to: '/', label: 'CEO Overview', icon: BarChart3 },
  { to: '/web', label: 'Web Orders', icon: ShoppingCart },
  { to: '/store', label: 'Store Sales', icon: Store },
  { to: '/paid', label: 'Paid Media', icon: Megaphone },
  { to: '/organic', label: 'Organic', icon: Search },
  { to: '/email', label: 'Email', icon: Mail },
  { to: '/journey', label: 'Journey', icon: Route },
  { to: '/cross-channel', label: 'Cross-Channel', icon: GitCompare },
  { to: '/qa', label: 'Data Trust', icon: ShieldCheck },
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
          {navItems.map((item) => (
            <NavLink
              key={item.to}
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
          ))}
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
