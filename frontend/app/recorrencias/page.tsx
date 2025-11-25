'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function RecorrenciasPage() {
  const router = useRouter();
  const [recorrencias, setRecorrencias] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const getInitialFormData = () => ({
    clienteId: '',
    descricao: '',
    valor: '',
    periodicidade: 'MENSAL',
    jornada: 'jornada2',
    // Campos Santander com valores padrão
    contract: 'CONTRATO_PADRAO_001',
    cpfCnpj: '',
    name: '',
    dataInicial: new Date().toISOString().split('T')[0],
    politicaRetentativa: 'NAO_PERMITE',
    ativacao: true,
    // Campos opcionais para Jornada 4
    dataVencimento: '',
  });

  const [formData, setFormData] = useState(getInitialFormData());

  const searchParams = useSearchParams();
  const clienteIdFromUrl = searchParams.get('clienteId');

  const jornadaDescriptions: { [key: string]: string } = {
    jornada2: 'O cliente autoriza a recorrência lendo o QR Code, mas não há pagamento imediato. Exemplo: Cliente autoriza hoje e o primeiro pagamento será na próxima data de vencimento (daqui a um mês).',
    jornada3: 'O cliente autoriza a recorrência e realiza o primeiro pagamento imediatamente lendo o QR Code. Exemplo: Cliente paga a primeira mensalidade hoje e as próximas serão automáticas.',
    jornada4: 'O cliente autoriza a recorrência e o QR Code já contém a data de vencimento do primeiro pagamento. Exemplo: Cliente autoriza hoje, mas o primeiro pagamento vence em 30 dias.',
  };

  useEffect(() => {
    fetchClientes();
    fetchRecorrencias();
  }, []);

  useEffect(() => {
    if (clienteIdFromUrl && clientes.length > 0) {
      const cliente = clientes.find(c => c.id.toString() === clienteIdFromUrl);
      if (cliente) {
        setFormData(prev => ({
          ...prev,
          clienteId: clienteIdFromUrl,
          cpfCnpj: cliente.cpf,
          name: cliente.name,
        }));
        setShowModal(true);
      }
    }
  }, [clienteIdFromUrl, clientes]);

  const fetchClientes = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trpc/clients.list`);
      if (response.ok) {
        const data = await response.json();
        setClientes(data.result?.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const fetchRecorrencias = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trpc/recurrences.listLatest`);
      if (response.ok) {
        const data = await response.json();
        setRecorrencias(data.result?.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar últimas recorrências:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      // Calcular data de vencimento se for Jornada 4 e não foi informada
      let dataVencimento = formData.dataVencimento;
      if (formData.jornada === 'jornada4' && !dataVencimento) {
        const dataInicial = new Date(formData.dataInicial);
        dataInicial.setDate(dataInicial.getDate() + 30); // 30 dias após data inicial
        dataVencimento = dataInicial.toISOString().split('T')[0];
      }

      const payload = {
        clientId: parseInt(formData.clienteId),
        amount: parseFloat(formData.valor.replace(',', '.')),
        valorRec: parseFloat(formData.valor.replace(',', '.')),
        frequency: formData.periodicidade,
        startDate: formData.dataInicial,
        description: formData.descricao,
        contract: formData.contract,
        cpfCnpj: formData.cpfCnpj,
        name: formData.name,
        dataInicial: formData.dataInicial,
        periodicidade: formData.periodicidade,
        politicaRetentativa: formData.politicaRetentativa,
        ativacao: formData.ativacao,
        jornada: formData.jornada,
        dataVencimento: dataVencimento,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trpc/recurrences.create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.result?.data;

        if (data?.qrCodePayload) {
          // Redirecionar para página de QR Code
          const params = new URLSearchParams({
            payload: encodeURIComponent(data.qrCodePayload),
            jornada: data.jornada,
            recurrenceId: data.recurrence.id.toString(),
            santanderRecurrenceId: data.santanderRecurrenceId || '',
          });
          
          router.push(`/recorrencias/qrcode?${params.toString()}`);
        } else {
          alert('Recorrência criada com sucesso!');
          setShowModal(false);
          setFormData(getInitialFormData());
          fetchRecorrencias();
        }
      } else {
        const errorData = await response.json();
        alert(`Erro: ${errorData.error?.message || 'Erro ao criar recorrência'}`);
      }
    } catch (error) {
      console.error('Erro ao criar recorrência:', error);
      alert('Erro ao criar recorrência. Verifique o console para mais detalhes.');
    } finally {
      setCreating(false);
    }
  };

  const handleSelectCliente = (selectedId: string) => {
    const cliente = clientes.find(c => c.id.toString() === selectedId);
    setFormData({
      ...formData,
      clienteId: selectedId,
      cpfCnpj: cliente?.cpf || '',
      name: cliente?.name || '',
    });
  };

  const clienteSelecionado = clientes.find(c => c.id.toString() === formData.clienteId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recorrências</h1>
            <p className="text-gray-600 mt-1">Últimas 5 Recorrências Criadas</p>
          </div>
          <button
            onClick={() => {
              setFormData(getInitialFormData());
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            <Plus size={20} />
            Nova Recorrência
          </button>
        </div>

        {/* Tabela de Últimas Recorrências */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criada em</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={4} className="py-8 text-center text-gray-500">Carregando...</td></tr>
              ) : recorrencias.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-sm text-gray-500">Nenhuma recorrência encontrada.</td></tr>
              ) : (
                recorrencias.map((rec) => (
                  <tr key={rec.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rec.client_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {parseFloat(rec.amount).toFixed(2).replace('.', ',')}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        rec.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        rec.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {rec.status === 'APPROVED' ? 'Aprovada' :
                         rec.status === 'PENDING_APPROVAL' ? 'Aguardando' :
                         'Não Aprovada'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(rec.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-8 max-w-md w-full my-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {clienteSelecionado ? `Recorrência para ${clienteSelecionado.name}` : 'Nova Recorrência'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                  <select
                    value={formData.clienteId}
                    onChange={(e) => handleSelectCliente(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                    disabled={creating}
                  >
                    <option value="">Selecione um cliente</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.name} - {cliente.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (Ex: Mensalidade)</label>
                  <input
                    type="text"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                    disabled={creating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                  <input
                    type="text"
                    placeholder="0,00"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                    disabled={creating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Periodicidade</label>
                  <select
                    value={formData.periodicidade}
                    onChange={(e) => setFormData({ ...formData, periodicidade: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                    disabled={creating}
                  >
                    <option value="SEMANAL">Semanal</option>
                    <option value="MENSAL">Mensal</option>
                    <option value="TRIMESTRAL">Trimestral</option>
                    <option value="SEMESTRAL">Semestral</option>
                    <option value="ANUAL">Anual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jornada de Pagamento</label>
                  <select
                    value={formData.jornada}
                    onChange={(e) => setFormData({ ...formData, jornada: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                    disabled={creating}
                  >
                    <option value="jornada2">Jornada 2 - Apenas QR Code (Autorização)</option>
                    <option value="jornada3">Jornada 3 - QR Code + Pagamento Inicial</option>
                    <option value="jornada4">Jornada 4 - QR Code + Vencimento</option>
                  </select>
                </div>

                {formData.jornada && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mt-2 rounded">
                    <p className="text-sm text-blue-800">
                      {jornadaDescriptions[formData.jornada]}
                    </p>
                  </div>
                )}

                {formData.jornada === 'jornada4' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Vencimento (opcional)
                    </label>
                    <input
                      type="date"
                      value={formData.dataVencimento}
                      onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      disabled={creating}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Se não informado, será 30 dias após a data inicial
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    disabled={creating}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                    disabled={creating}
                  >
                    {creating ? 'Criando...' : 'Criar Recorrência'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
