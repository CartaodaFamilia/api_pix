'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Download, Filter } from 'lucide-react';

export default function RelatoriosPage() {
  const [relatorios, setRelatorios] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('mes');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchReports();
  }, [filtro, startDate, endDate]);

  const getDatesFromFilter = (filter: string) => {
    const now = new Date();
    let start = '';
    let end = now.toISOString().split('T')[0];

    switch (filter) {
      case 'dia':
        start = end;
        break;
      case 'semana':
        const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        start = firstDayOfWeek.toISOString().split('T')[0];
        break;
      case 'mes':
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        break;
      case 'trimestre':
        const currentMonth = now.getMonth();
        const startMonth = currentMonth - (currentMonth % 3);
        start = new Date(now.getFullYear(), startMonth, 1).toISOString().split('T')[0];
        break;
      case 'ano':
        start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
      case 'custom':
        start = startDate;
        end = endDate;
        break;
    }
    return { start, end };
  };

  const fetchReports = async () => {
    setLoading(true);
    const { start, end } = getDatesFromFilter(filtro);
    
    const params = new URLSearchParams();
    if (start) params.append('startDate', start);
    if (end) params.append('endDate', end);

    try {
      // 1. Buscar Resumo
      const summaryResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trpc/reports.getSummary?${params.toString()}`);
      if (summaryResponse.ok) {
        const data = await summaryResponse.json();
        setSummary(data.result?.data || {});
      }

      // 2. Buscar Detalhes
      const detailedResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trpc/reports.getDetailedReport?${params.toString()}`);
      if (detailedResponse.ok) {
        const data = await detailedResponse.json();
        setRelatorios(data.result?.data || []);
      }

    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    console.log(`Exportando em ${format}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download size={20} />
              CSV
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Download size={20} />
              PDF
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <Filter size={20} className="text-gray-400" />
	            <select
	              value={filtro}
	              onChange={(e) => setFiltro(e.target.value)}
	              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
	            >
	              <option value="dia">Hoje</option>
	              <option value="semana">Esta Semana</option>
	              <option value="mes">Este Mês</option>
	              <option value="trimestre">Este Trimestre</option>
	              <option value="ano">Este Ano</option>
	              <option value="custom">Período Personalizado</option>
	            </select>
	            {filtro === 'custom' && (
	              <>
	                <input
	                  type="date"
	                  value={startDate}
	                  onChange={(e) => setStartDate(e.target.value)}
	                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
	                  placeholder="Data Início"
	                />
	                <input
	                  type="date"
	                  value={endDate}
	                  onChange={(e) => setEndDate(e.target.value)}
	                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
	                  placeholder="Data Fim"
	                />
	              </>
	            )}
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
	            <p className="text-gray-600 text-sm">Adimplentes</p>
	            <p className="text-3xl font-bold text-gray-900 mt-2">{summary.adimplentes || 0}</p>
	            <p className="text-gray-500 text-sm mt-2">{((summary.adimplentes / summary.totalClientes) * 100).toFixed(2) || 0}%</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
	            <p className="text-gray-600 text-sm">Inadimplentes</p>
	            <p className="text-3xl font-bold text-gray-900 mt-2">{summary.inadimplentes || 0}</p>
	            <p className="text-gray-500 text-sm mt-2">{((summary.inadimplentes / summary.totalClientes) * 100).toFixed(2) || 0}%</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
	            <p className="text-gray-600 text-sm">Taxa de Recuperação</p>
	            <p className="text-3xl font-bold text-gray-900 mt-2">{summary.taxaRecuperacao?.toFixed(2) || 0}%</p>
	            <p className="text-gray-500 text-sm mt-2">{summary.totalClientes || 0} clientes</p>
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
                  <th className="text-left py-3 px-6 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-700">Total Pago</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-700">Última Cobrança</th>
                </tr>
              </thead>
	              <tbody>
	                {relatorios.length === 0 ? (
	                  <tr>
	                    <td colSpan={4} className="py-8 text-center text-gray-500">
	                      Nenhum dado disponível
	                    </td>
	                  </tr>
	                ) : (
	                  relatorios.map((relatorio, index) => (
	                    <tr key={index} className="hover:bg-gray-50">
	                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
	                        {relatorio.client_name}
	                      </td>
	                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
	                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
	                          relatorio.status === 'PAID' ? 'bg-green-100 text-green-800' :
	                          relatorio.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
	                          'bg-red-100 text-red-800'
	                        }`}>
	                          {relatorio.status}
	                        </span>
	                      </td>
	                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
	                        R$ {relatorio.total_paid.toFixed(2).replace('.', ',')}
	                      </td>
	                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
	                        {relatorio.last_charge}
	                      </td>
	                    </tr>
	                  ))
	                )}
	              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
