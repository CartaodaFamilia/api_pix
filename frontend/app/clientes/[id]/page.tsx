'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ClienteDetailPage() {
  const params = useParams();
  const [cliente, setCliente] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchCliente();
    }
  }, [params.id]);

  const fetchCliente = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/trpc/clients.getById?input=${JSON.stringify({
          id: parseInt(params.id as string)
        })}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setCliente(data.result?.data || null);
      }
    } catch (error) {
      console.error('Erro ao carregar cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Carregando...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!cliente) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-lg text-red-600 mb-4">Cliente não encontrado</div>
          <Link href="/clientes" className="text-indigo-600 hover:text-indigo-900">
            Voltar para lista
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/clientes" className="text-indigo-600 hover:text-indigo-900 mb-2 inline-block">
              ← Voltar para clientes
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Detalhes do Cliente</h1>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome</label>
              <p className="mt-1 text-lg text-gray-900">{cliente.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-lg text-gray-900">{cliente.email || 'Não informado'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">CPF</label>
              <p className="mt-1 text-lg text-gray-900">{cliente.cpf || 'Não informado'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Telefone</label>
              <p className="mt-1 text-lg text-gray-900">{cliente.phone || 'Não informado'}</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Data de Cadastro</label>
              <p className="mt-1 text-lg text-gray-900">
                {new Date(cliente.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recorrências</h2>
          <p className="text-gray-500">Nenhuma recorrência cadastrada para este cliente.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}