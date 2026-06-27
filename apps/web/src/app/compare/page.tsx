import { safeGet } from '@/lib/api';
import { fmt } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { GroupedBarChart, VmScalingChart } from '@/components/charts/charts';

export default async function ComparePage() {
  const hardware = await safeGet<any[]>('/analysis/compare/hardware', []);
  const hypervisors = await safeGet<any>('/analysis/compare/hypervisors', null);
  const scaling = await safeGet<any[]>('/analysis/vm-scaling', []);

  const hwChart = hardware.map((r) => ({
    name: r.scenario,
    Fixe: r.desktopW,
    Portable: r.laptopW,
  }));

  return (
    <div className="space-y-8">
      <PageHeader title="Comparaisons" subtitle="Analyse comparative des équipements et des hyperviseurs" />

      {/* Cas 1 */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Cas 1 — Ordinateur fixe vs portable</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Puissance par scénario</CardTitle>
              <CardDescription>Watts moyens mesurés</CardDescription>
            </CardHeader>
            <CardContent>
              {hwChart.length ? (
                <GroupedBarChart
                  data={hwChart}
                  series={[
                    { key: 'Fixe', name: 'Fixe', color: '#ef4444' },
                    { key: 'Portable', name: 'Portable', color: '#22c55e' },
                  ]}
                />
              ) : (
                <Empty />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tableau comparatif</CardTitle>
              <CardDescription>Écart = (portable − fixe) / fixe</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <THead>
                  <TR>
                    <TH>Scénario</TH>
                    <TH className="text-right">Fixe (W)</TH>
                    <TH className="text-right">Portable (W)</TH>
                    <TH className="text-right">Écart</TH>
                  </TR>
                </THead>
                <TBody>
                  {hardware.map((r) => (
                    <TR key={r.code}>
                      <TD className="font-medium">{r.scenario}</TD>
                      <TD className="text-right">{fmt(r.desktopW)}</TD>
                      <TD className="text-right">{fmt(r.laptopW)}</TD>
                      <TD className="text-right">
                        <Badge variant={r.diffPct < 0 ? 'success' : 'danger'}>{fmt(r.diffPct)} %</Badge>
                      </TD>
                    </TR>
                  ))}
                  {hardware.length === 0 && (
                    <TR>
                      <TD colSpan={4} className="py-8 text-center text-muted-foreground">
                        Aucune donnée.
                      </TD>
                    </TR>
                  )}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Cas 2 */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Cas 2 — Virtualisation</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>VirtualBox vs VMware</CardTitle>
              <CardDescription>Même charge CPU, une VM (scénario S5)</CardDescription>
            </CardHeader>
            <CardContent>
              {hypervisors ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <HvCard name="VirtualBox" w={hypervisors.virtualbox?.powerMeanW} color="text-primary" />
                    <HvCard name="VMware" w={hypervisors.vmware?.powerMeanW} color="text-accent" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Écart VirtualBox / VMware :{' '}
                    <span className="font-semibold text-foreground">{fmt(hypervisors.diffPct)} %</span>
                  </p>
                </div>
              ) : (
                <Empty />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Consommation selon le nombre de VM</CardTitle>
              <CardDescription>Montée en charge — hypothèse H3</CardDescription>
            </CardHeader>
            <CardContent>{scaling.length ? <VmScalingChart data={scaling} /> : <Empty />}</CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function HvCard({ name, w, color }: { name: string; w?: number; color: string }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-xs uppercase text-muted-foreground">{name}</p>
      <p className={`mt-1 text-3xl font-bold ${color}`}>{fmt(w)}</p>
      <p className="text-xs text-muted-foreground">W moyens</p>
    </div>
  );
}

function Empty() {
  return <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">Aucune donnée.</div>;
}
