'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function QRCodePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [qrData, setQrData] = useState<{
    payload: string;
    jornada: string;
    recurrenceId: string;
    santanderRecurrenceId: string;
  } | null>(null);

  useEffect(() => {
    const payload = searchParams.get('payload');
    const jornada = searchParams.get('jornada');
    const recurrenceId = searchParams.get('recurrenceId');
    const santanderRecurrenceId = searchParams.get('santanderRecurrenceId');

    if (payload && jornada) {
      setQrData({
        payload: decodeURIComponent(payload),
        jornada,
        recurrenceId: recurrenceId || '',
        santanderRecurrenceId: santanderRecurrenceId || '',
      });
    }
  }, [searchParams]);

  const jornadaInfo: { [key: string]: { title: string; description: string } } = {
    jornada2: {
      title: 'QR Code de Autorização',
      description: 'O cliente deve escanear este QR Code para autorizar a recorrência. Não há pagamento imediato.',
    },
    jornada3: {
      title: 'QR Code com Pagamento Inicial',
      description: 'O cliente autoriza a recorrência e realiza o primeiro pagamento ao escanear este QR Code.',
    },
    jornada4: {
      title: 'QR Code com Vencimento',
      description: 'O cliente autoriza a recorrência e o primeiro pagamento será cobrado na data de vencimento.',
    },
  };

  if (!qrData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-600">Carregando QR Code...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const info = jornadaInfo[qrData.jornada] || {
    title: 'QR Code PIX',
    description: 'Escaneie o QR Code para continuar.',
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <button
          onClick={() => router.push('/recorrencias')}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6"
        >
          <ArrowLeft size={20} />
          Voltar para Recorrências
        </button>

        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded">
          <div className="flex items-start">
            <CheckCircle className="text-green-600 mr-3 mt-0.5" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-green-900">
                Recorrência Criada com Sucesso!
              </h3>
              <p className="text-sm text-green-700 mt-1">
                ID da Recorrência: <strong>{qrData.recurrenceId}</strong>
              </p>
              {qrData.santanderRecurrenceId && (
                <p className="text-sm text-green-700">
                  ID Santander: <strong>{qrData.santanderRecurrenceId}</strong>
                </p>
              )}
            </div>
          </div>
        </div>

        <QRCodeDisplay
          payload={qrData.payload}
          title={info.title}
          description={info.description}
        />

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Próximos Passos
          </h3>
          <ol className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm mr-3">
                1
              </span>
              <span>Compartilhe o QR Code com o cliente (por email, WhatsApp, etc.)</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm mr-3">
                2
              </span>
              <span>O cliente deve abrir o app do banco e escanear o QR Code</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm mr-3">
                3
              </span>
              <span>O cliente autoriza a recorrência no app do banco</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm mr-3">
                4
              </span>
              <span>
                {qrData.jornada === 'jornada2' && 'Aguarde a data do primeiro pagamento automático'}
                {qrData.jornada === 'jornada3' && 'O primeiro pagamento será processado imediatamente'}
                {qrData.jornada === 'jornada4' && 'O primeiro pagamento será processado na data de vencimento'}
              </span>
            </li>
          </ol>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={() => router.push('/recorrencias')}
            className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Ver Todas as Recorrências
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Ir para Dashboard
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
