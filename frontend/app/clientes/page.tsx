'use client';


import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';

interface Cliente {
  id: number;
  name: string;
  email?: string;
  cpf?: string;
  phone?: string;
  created_at: string;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null); // ← ADICIONE ESTA LINHA
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trpc/clients.list`);
      if (response.ok) {
        const data = await response.json();
        // Ajuste para a estrutura do tRPC
        if (data.result?.data) {
          setClientes(data.result.data);
        }
      } else {
        console.error('Erro na resposta:', response.status);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  
  try {
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim() || null,
      cpf: formData.cpf.trim() || null,
      phone: formData.phone.trim() || null,
    };

    console.log('📤 Enviando dados:', payload);

    // Tentar formato mais direto
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trpc/clients.create`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload), // Enviar direto sem wrapper
    });

    console.log('📊 Status:', response.status, response.statusText);
    
    const responseText = await response.text();
    console.log('📥 Resposta bruta:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      throw new Error('Resposta não é JSON válido');
    }

    if (response.ok) {
      setFormData({ name: '', cpf: '', email: '', phone: '' });
      setShowModal(false);
      fetchClientes();
      console.log('✅ Cliente criado com sucesso!');
    } else {
      setError(`Erro ${response.status}: ${responseData.error?.message || 'Erro desconhecido'}`);
    }
  } catch (error: any) {
    console.error('Erro ao criar cliente:', error);
    setError(error.message || 'Erro de conexão com o servidor');
  }
};

  const filteredClientes = clientes.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cpf?.includes(searchTerm)
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            <Plus size={20} />
            Novo Cliente
          </button>
        </div>

        {/* Mensagem de erro - ADICIONE ESTE BLOCO */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Table */}
   {/* Table */}
{loading ? (
  <div className="text-center py-8">Carregando...</div>
) : (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="text-left py-3 px-6 font-semibold text-gray-700">Nome</th>
          <th className="text-left py-3 px-6 font-semibold text-gray-700">CPF</th>
          <th className="text-left py-3 px-6 font-semibold text-gray-700">Email</th>
          <th className="text-left py-3 px-6 font-semibold text-gray-700">Telefone</th>
          <th className="text-left py-3 px-6 font-semibold text-gray-700">Ações</th>
          <th className="text-left py-3 px-6 font-semibold text-gray-700">Serviço</th>
        </tr>
      </thead>
      <tbody>
        {filteredClientes.length > 0 ? (
          filteredClientes.map((cliente) => (
            <tr key={cliente.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-6 text-gray-900 font-medium">{cliente.name}</td>
              <td className="py-3 px-6 text-gray-600">{cliente.cpf || '-'}</td>
              <td className="py-3 px-6 text-gray-600">{cliente.email || '-'}</td>
              <td className="py-3 px-6 text-gray-600">{cliente.phone || '-'}</td>
              <td className="py-3 px-6">
                <div className="flex gap-2">
                  <Link 
                    href={`/clientes/${cliente.id}`}
                    className="text-indigo-600 hover:text-indigo-900 font-medium text-sm"
                  >
                    Ver
                  </Link>
                </div>
              </td>
               <td className="py-3 px-6">
                 <div className="flex gap-2">
                  <Link 
                    href={`/recorrencias?clienteId=${cliente.id}`}
                    className="flex items-center gap-1 text-green-600 hover:text-green-900 font-medium text-sm"
                  >
                    <Plus size={14} />
                    Gerar Recorrência
                  </Link>
                </div>
               </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={5} className="py-8 text-center text-gray-500">
              Nenhum cliente encontrado
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
)}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Novo Cliente</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Nome"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <input
                  type="text"
                  placeholder="CPF"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="tel"
                  placeholder="Telefone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
                  >
                    Criar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setError(null); // Limpar erro ao cancelar
                    }}
                    className="flex-1 bg-gray-300 text-gray-900 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancelar
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