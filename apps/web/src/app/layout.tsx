import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/sidebar';

export const metadata: Metadata = {
  title: 'EnergieSI — Consommation énergétique des systèmes informatiques',
  description:
    'Étude comparative de la consommation énergétique : ordinateurs fixes, portables et environnements virtualisés.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className="font-sans">
        <Sidebar />
        <main className="ml-64 min-h-screen px-8 py-8">{children}</main>
      </body>
    </html>
  );
}
