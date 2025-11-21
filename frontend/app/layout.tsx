import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PIX Automático - Soul Policlínica',
  description: 'Sistema de gestão de recorrências PIX',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}