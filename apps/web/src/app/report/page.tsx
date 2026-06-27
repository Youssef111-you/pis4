import { API_URL } from '@/lib/api';
import { PageHeader } from '@/components/page-header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { FileSpreadsheet, FileText, FileDown } from 'lucide-react';

const exports = [
  {
    href: `${API_URL}/reporting/report.pdf`,
    title: 'Rapport PDF',
    desc: 'Synthèse, comparaisons et validation des hypothèses, généré automatiquement.',
    icon: FileText,
    accent: 'text-danger bg-danger/10',
  },
  {
    href: `${API_URL}/reporting/results.xlsx`,
    title: 'Classeur Excel',
    desc: 'Résultats, comparaison fixe/portable et hypothèses sur 3 feuilles.',
    icon: FileSpreadsheet,
    accent: 'text-success bg-success/10',
  },
  {
    href: `${API_URL}/reporting/results.csv`,
    title: 'Export CSV',
    desc: 'Tous les résultats agrégés, exploitables dans n’importe quel tableur.',
    icon: FileDown,
    accent: 'text-primary bg-primary/10',
  },
];

export default function ReportPage() {
  return (
    <div>
      <PageHeader title="Rapport & exports" subtitle="Générez les livrables à partir des données mesurées" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {exports.map((e) => (
          <a key={e.href} href={e.href} target="_blank" rel="noopener noreferrer">
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardHeader>
                <div className={`mb-2 flex h-12 w-12 items-center justify-center rounded-lg ${e.accent}`}>
                  <e.icon className="h-6 w-6" />
                </div>
                <CardTitle>{e.title}</CardTitle>
                <CardDescription>{e.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-sm font-medium text-primary">Télécharger →</span>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
