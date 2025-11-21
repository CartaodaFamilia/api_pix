'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function PagamentosPage() {
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPagamentos();
  }, []);

  const fetchPagamentos = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trpc/health.check`);
      if (response.ok) {
        setPagamentos([]);
      }
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pago':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'pendente':
        return <Clock className="text-yellow-600" size={20} />;
      case 'cancelado':
        return <XCircle className="text-red-600" size={20} />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pago: 'bg-green-100 text-green-800',
      pendente: 'bg-yellow-100 text-yellow-800',
      cancelado: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Pagamentos</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm">Pagos</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">R$ 0,00</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <p className="text-gray-600 text-sm">Pendentes</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">R$ 0,00</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <p className="text-gray-600 text-sm">Cancelados</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">R$ 0,00</p>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 font-semibold text-gray-700">Cliente</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-700">Valor</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-700">Data</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pagamentos.length > 0 ? (
                  pagamentos.map((pag) => (
                    <tr key={pag.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-6 text-gray-900 font-medium">{pag.cliente}</td>
                      <td className="py-3 px-6 text-gray-600">{pag.valor}</td>
                      <td className="py-3 px-6 text-gray-600">{pag.data}</td>
                      <td className="py-3 px-6">
                        <span className={`px-3 py-1 rounded-full text-sm ${getStatusBadge(pag.status)}`}>
                          {pag.status}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <button className="text-indigo-600 hover:text-indigo-900 font-medium">
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      Nenhum pagamento encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
