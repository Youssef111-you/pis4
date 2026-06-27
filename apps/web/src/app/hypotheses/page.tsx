import { safeGet } from '@/lib/api';
import { fmt } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import type { HypothesisResult } from '@energie-si/shared';

export default async function HypothesesPage() {
  const hypotheses = await safeGet<HypothesisResult[]>('/analysis/hypotheses', []);

  return (
    <div>
      <PageHeader
        title="Validation des hypothèses"
        subtitle="Vérification statistique automatique à partir des mesures collectées"
      />
      <div className="space-y-5">
        {hypotheses.map((h) => {
          const ok = h.verdict === 'CONFIRMED';
          const ko = h.verdict === 'REJECTED';
          const Icon = ok ? CheckCircle2 : ko ? XCircle : HelpCircle;
          const color = ok ? 'text-success' : ko ? 'text-danger' : 'text-muted-foreground';
          return (
            <Card key={h.id}>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div className="flex items-start gap-3">
                  <Icon className={`mt-0.5 h-6 w-6 ${color}`} />
                  <div>
                    <CardTitle>
                      {h.id} — {h.statement}
                    </CardTitle>
                  </div>
                </div>
                <Badge variant={ok ? 'success' : ko ? 'danger' : 'muted'}>{h.verdict}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{h.conclusion}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {Object.entries(h.evidence).map(([k, v]) => (
                    <span
                      key={k}
                      className="rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground"
                    >
                      <span className="text-foreground">{k}</span> :{' '}
                      {typeof v === 'number' ? fmt(v, 2) : String(v)}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {hypotheses.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Aucune donnée. Lancez l’API puis <code className="text-primary">npm run db:seed</code>.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
