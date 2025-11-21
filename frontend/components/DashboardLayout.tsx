'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, LogOut, Bell } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-900 text-white transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold">Soulidari</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavLink href="/dashboard" icon="📊" label="Dashboard" open={sidebarOpen} />
          <NavLink href="/clientes" icon="👥" label="Clientes" open={sidebarOpen} />
          <NavLink href="/recorrencias" icon="🔄" label="Recorrências" open={sidebarOpen} />
          <NavLink href="/pagamentos" icon="💳" label="Pagamentos" open={sidebarOpen} />
          <NavLink href="/relatorios" icon="📈" label="Relatórios" open={sidebarOpen} />
        </nav>

        <div className="p-4 border-t border-gray-800">
          <Link
            href="/login"
            className="w-full flex items-center gap-3 p-2 hover:bg-gray-800 rounded text-red-400"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Sair</span>}
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Sistema PIX Automático</h2>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavLink({
  href,
  icon,
  label,
  open,
}: {
  href: string;
  icon: string;
  label: string;
  open: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg transition"
    >
      <span className="text-xl">{icon}</span>
      {open && <span>{label}</span>}
    </Link>
  );
}
