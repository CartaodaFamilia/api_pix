'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, Download } from 'lucide-react';

interface QRCodeDisplayProps {
  payload: string;
  title?: string;
  description?: string;
}

export default function QRCodeDisplay({ payload, title, description }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (canvasRef.current && payload) {
      QRCode.toCanvas(canvasRef.current, payload, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
    }
  }, [payload]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  const handleDownload = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'qrcode-pix.png';
      link.href = url;
      link.click();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      {title && (
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          {title}
        </h2>
      )}
      
      {description && (
        <p className="text-gray-600 mb-6 text-center">
          {description}
        </p>
      )}

      <div className="flex justify-center mb-6">
        <canvas ref={canvasRef} className="border-4 border-gray-200 rounded-lg" />
      </div>

      <div className="space-y-3">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-xs text-gray-500 mb-2">PIX Copia e Cola:</p>
          <p className="text-sm font-mono text-gray-800 break-all">
            {payload}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {copied ? (
              <>
                <Check size={20} />
                Copiado!
              </>
            ) : (
              <>
                <Copy size={20} />
                Copiar Código
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <Download size={20} />
            Baixar QR
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
        <p className="text-sm text-blue-800">
          <strong>Como usar:</strong> O cliente pode escanear o QR Code com o app do banco 
          ou copiar e colar o código PIX para autorizar a recorrência.
        </p>
      </div>
    </div>
  );
}
