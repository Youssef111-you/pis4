import { safeGet } from '@/lib/api';
import { fmt } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import type { Test } from '@energie-si/shared';

const TYPE_VARIANT: Record<string, 'default' | 'success' | 'danger' | 'warning' | 'muted'> = {
  DESKTOP: 'danger',
  LAPTOP: 'success',
  HOST: 'default',
  VM: 'warning',
};

export default async function HistoryPage() {
  const tests = await safeGet<Test[]>('/tests', []);

  return (
    <div>
      <PageHeader title="Historique des mesures" subtitle={`${tests.length} campagnes enregistrées`} />
      <Card>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Machine</TH>
                <TH>Scénario</TH>
                <TH>Hyperviseur</TH>
                <TH className="text-right">VM</TH>
                <TH className="text-right">Puissance (W)</TH>
                <TH className="text-right">Énergie (Wh)</TH>
                <TH className="text-right">CPU (%)</TH>
                <TH className="text-right">Temp (°C)</TH>
                <TH className="text-right">Mesures</TH>
              </TR>
            </THead>
            <TBody>
              {tests.map((t) => (
                <TR key={t.id}>
                  <TD>
                    <div className="flex items-center gap-2">
                      <Badge variant={TYPE_VARIANT[t.machine?.type ?? ''] ?? 'muted'}>
                        {t.machine?.type}
                      </Badge>
                      <span className="font-medium">{t.machine?.name}</span>
                    </div>
                  </TD>
                  <TD>{t.scenario?.name}</TD>
                  <TD>{t.hypervisor === 'NONE' ? '—' : t.hypervisor}</TD>
                  <TD className="text-right">{t.vmCount || '—'}</TD>
                  <TD className="text-right font-semibold text-primary">{fmt(t.result?.powerMeanW)}</TD>
                  <TD className="text-right">{fmt(t.result?.energyWh, 3)}</TD>
                  <TD className="text-right">{fmt(t.result?.cpuMeanPct)}</TD>
                  <TD className="text-right">{fmt(t.result?.tempMeanC)}</TD>
                  <TD className="text-right text-muted-foreground">{t.result?.samples ?? 0}</TD>
                </TR>
              ))}
              {tests.length === 0 && (
                <TR>
                  <TD colSpan={9} className="py-10 text-center text-muted-foreground">
                    Aucune campagne. Lancez l’API puis <code className="text-primary">npm run db:seed</code>.
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
