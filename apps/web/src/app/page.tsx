import { safeGet } from '@/lib/api';
import { fmt } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SimpleBarChart, GroupedBarChart } from '@/components/charts/charts';
import { Cpu, Gauge, Database, Server, Zap } from 'lucide-react';
import type { HypothesisResult } from '@energie-si/shared';

const TYPE_LABEL: Record<string, string> = {
  DESKTOP: 'Ordinateur fixe',
  LAPTOP: 'Ordinateur portable',
  HOST: 'Hôte virtualisation',
  VM: 'Machine virtuelle',
};
const TYPE_COLOR: Record<string, string> = {
  DESKTOP: '#ef4444',
  LAPTOP: '#22c55e',
  HOST: '#8b5cf6',
  VM: '#f59e0b',
};

export default async function OverviewPage() {
  const summary = await safeGet<any>('/analysis/summary', {
    counts: { machines: 0, tests: 0, measurements: 0, results: 0 },
    powerByType: [],
  });
  const hypotheses = await safeGet<HypothesisResult[]>('/analysis/hypotheses', []);
  const hardware = await safeGet<any[]>('/analysis/compare/hardware', []);
  const backends = await safeGet<any>('/power/backends', { active: 'MODEL', backends: [] });

  const powerData = summary.powerByType.map((p: any) => ({
    name: TYPE_LABEL[p.type] ?? p.type,
    value: p.powerMeanW,
    color: TYPE_COLOR[p.type],
  }));

  const hwData = hardware.map((r) => ({
    name: r.scenario.replace(/^.*S\d\s?/, ''),
    Fixe: r.desktopW,
    Portable: r.laptopW,
  }));

  const verdict = (v: string) =>
    v === 'CONFIRMED' ? 'success' : v === 'REJECTED' ? 'danger' : 'muted';

  return (
    <div>
      <PageHeader
        title="Vue d’ensemble"
        subtitle="Étude comparative de la consommation énergétique des systèmes informatiques"
      >
        <Badge variant="default">Backend énergie : {backends.active}</Badge>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Machines" value={summary.counts.machines} icon={Server} />
        <StatCard label="Campagnes" value={summary.counts.tests} icon={Gauge} accent="warning" />
        <StatCard label="Mesures" value={summary.counts.measurements} icon={Database} accent="success" />
        <StatCard
          label="Hypothèses validées"
          value={`${hypotheses.filter((h) => h.verdict === 'CONFIRMED').length}/${hypotheses.length}`}
          icon={Cpu}
          accent="primary"
        />
      </div>

      {/* Graphiques */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Puissance moyenne par type de machine</CardTitle>
            <CardDescription>Moyenne sur l’ensemble des scénarios mesurés</CardDescription>
          </CardHeader>
          <CardContent>
            {powerData.length ? (
              <SimpleBarChart data={powerData} unit=" W" />
            ) : (
              <EmptyApi />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fixe vs Portable par scénario</CardTitle>
            <CardDescription>Puissance moyenne (W) — cas d’étude 1</CardDescription>
          </CardHeader>
          <CardContent>
            {hwData.length ? (
              <GroupedBarChart
                data={hwData}
                series={[
                  { key: 'Fixe', name: 'Fixe', color: '#ef4444' },
                  { key: 'Portable', name: 'Portable', color: '#22c55e' },
                ]}
              />
            ) : (
              <EmptyApi />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hypothèses */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {hypotheses.map((h) => (
          <Card key={h.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" /> {h.id}
              </CardTitle>
              <Badge variant={verdict(h.verdict)}>{h.verdict}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{h.statement}</p>
              {h.differencePct != null && (
                <p className="mt-2 text-2xl font-bold">{fmt(h.differencePct)} %</p>
              )}
            </CardContent>
          </Card>
        ))}
        {hypotheses.length === 0 && (
          <Card className="lg:col-span-3">
            <CardContent className="py-6">
              <EmptyApi />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function EmptyApi() {
  return (
    <div className="flex h-40 flex-col items-center justify-center text-center text-sm text-muted-foreground">
      <p>Aucune donnée.</p>
      <p className="mt-1">
        Lancez l’API (<code className="text-primary">npm run dev:api</code>) puis le seed
        (<code className="text-primary">npm run db:seed</code>).
      </p>
    </div>
  );
}
