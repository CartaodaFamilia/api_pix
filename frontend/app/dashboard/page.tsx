'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { TrendingUp, Users, CreditCard, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trpc/health.check`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p>Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Clientes Ativos"
            value="0"
            icon={<Users className="text-blue-600" />}
            color="bg-blue-50"
          />
          <StatCard
            title="Recorrências Ativas"
            value="0"
            icon={<TrendingUp className="text-green-600" />}
            color="bg-green-50"
          />
          <StatCard
            title="Total Recebido"
            value="R$ 0,00"
            icon={<CreditCard className="text-emerald-600" />}
            color="bg-emerald-50"
          />
          <StatCard
            title="Inadimplentes"
            value="0"
            icon={<AlertCircle className="text-red-600" />}
            color="bg-red-50"
          />
        </div>

        {/* Welcome Message */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Bem-vindo ao Sistema PIX Automático</h2>
          <p className="text-gray-600">
            Use o menu lateral para navegar entre as seções do sistema. Aqui você pode gerenciar clientes, recorrências, pagamentos e visualizar relatórios.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className={`${color} rounded-lg p-6 border border-gray-200`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}
