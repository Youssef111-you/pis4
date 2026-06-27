'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { apiGet, apiPost } from '@/lib/api';
import { fmt } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TimeSeriesChart } from '@/components/charts/charts';
import { Zap, Cpu, MemoryStick, Thermometer, Play, Square } from 'lucide-react';
import { WS_EVENTS, type LiveSample, type Machine, type Scenario } from '@energie-si/shared';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001';

export default function RealtimePage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [machineId, setMachineId] = useState<number | ''>('');
  const [scenarioCode, setScenarioCode] = useState<string>('');
  const [duration, setDuration] = useState(20);
  const [running, setRunning] = useState(false);
  const [latest, setLatest] = useState<LiveSample | null>(null);
  const [series, setSeries] = useState<Array<{ t: number; powerW: number; cpuPct: number }>>([]);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    apiGet<Machine[]>('/machines').then((m) => {
      setMachines(m);
      if (m[0]) setMachineId(m[0].id);
    }).catch(() => setError('API injoignable.'));
    apiGet<Scenario[]>('/scenarios').then((s) => {
      setScenarios(s);
      if (s[0]) setScenarioCode(s[0].code);
    }).catch(() => {});

    const socket = io(WS_URL, { transports: ['websocket'] });
    socketRef.current = socket;
    socket.on(WS_EVENTS.TEST_STARTED, () => {
      setRunning(true);
      setSeries([]);
      setLatest(null);
    });
    socket.on(WS_EVENTS.SAMPLE, (s: LiveSample) => {
      setLatest(s);
      setSeries((prev) => [...prev.slice(-120), { t: s.elapsedS, powerW: s.powerW, cpuPct: s.cpuPct }]);
    });
    socket.on(WS_EVENTS.TEST_COMPLETED, () => setRunning(false));
    return () => {
      socket.disconnect();
    };
  }, []);

  const start = async () => {
    setError(null);
    try {
      await apiPost('/runner/run', {
        machineId: Number(machineId),
        scenarioCode,
        durationS: duration,
        intervalMs: 1000,
      });
    } catch (e: any) {
      setError(e.message ?? 'Impossible de démarrer le test.');
    }
  };

  const stop = async () => {
    try {
      await apiPost('/runner/stop');
    } catch {
      /* ignore */
    }
  };

  return (
    <div>
      <PageHeader title="Mesure en temps réel" subtitle="Lancez un scénario et suivez la consommation en direct (WebSocket)">
        {running ? (
          <Badge variant="warning">● Mesure en cours…</Badge>
        ) : (
          <Badge variant="muted">En attente</Badge>
        )}
      </PageHeader>

      {/* Contrôles */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Configuration du test</CardTitle>
          <CardDescription>La mesure utilise les capteurs réels de cette machine.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <Field label="Machine">
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={machineId}
              onChange={(e) => setMachineId(Number(e.target.value))}
            >
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Scénario">
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={scenarioCode}
              onChange={(e) => setScenarioCode(e.target.value)}
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Durée (s)">
            <input
              type="number"
              min={5}
              max={600}
              className="h-10 w-24 rounded-md border border-input bg-background px-3 text-sm"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </Field>
          {running ? (
            <Button variant="danger" onClick={stop}>
              <Square className="h-4 w-4" /> Arrêter
            </Button>
          ) : (
            <Button onClick={start} disabled={!machineId || !scenarioCode}>
              <Play className="h-4 w-4" /> Démarrer la mesure
            </Button>
          )}
          {error && <p className="text-sm text-danger">{error}</p>}
        </CardContent>
      </Card>

      {/* Jauges live */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Puissance" value={fmt(latest?.powerW ?? 0)} unit="W" icon={Zap} accent="primary" />
        <StatCard label="CPU" value={fmt(latest?.cpuPct ?? 0)} unit="%" icon={Cpu} accent="warning" />
        <StatCard label="Mémoire" value={fmt(latest?.ramPct ?? 0)} unit="%" icon={MemoryStick} accent="success" />
        <StatCard
          label="Température"
          value={latest?.cpuTempC != null ? fmt(latest.cpuTempC) : '—'}
          unit="°C"
          icon={Thermometer}
          accent="danger"
        />
      </div>

      {/* Courbe live */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Évolution en direct</CardTitle>
          <CardDescription>
            Énergie cumulée : {fmt((latest?.energyJ ?? 0) / 3600, 3)} Wh • backend {latest?.backend ?? '—'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {series.length ? (
            <TimeSeriesChart
              data={series}
              lines={[
                { key: 'powerW', name: 'Puissance (W)', color: '#3b82f6' },
                { key: 'cpuPct', name: 'CPU (%)', color: '#f59e0b' },
              ]}
            />
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              Démarrez une mesure pour voir la courbe en temps réel.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
