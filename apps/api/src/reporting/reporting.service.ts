import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';
import { AnalysisService } from '../analysis/analysis.service';

@Injectable()
export class ReportingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analysis: AnalysisService,
  ) {}

  // ─────────────────────────────── CSV ──────────────────────────────────────

  /** Export CSV des mesures d'un test. */
  async csvMeasurements(testId: number): Promise<string> {
    const ms = await this.prisma.measurement.findMany({
      where: { testId },
      orderBy: { timestamp: 'asc' },
    });
    const header = 'id,timestamp,cpu_pct,ram_pct,ram_mo,cpu_temp_c,power_w,energy_j';
    const rows = ms.map((m) =>
      [
        m.id,
        m.timestamp.toISOString(),
        m.cpuPct,
        m.ramPct,
        m.ramMo,
        m.cpuTempC ?? '',
        m.powerW,
        m.energyJ,
      ].join(','),
    );
    return [header, ...rows].join('\n');
  }

  /** Export CSV de tous les résultats agrégés. */
  async csvResults(): Promise<string> {
    const results = await this.prisma.result.findMany({
      include: { test: { include: { machine: true, scenario: true } } },
      orderBy: { id: 'asc' },
    });
    const header =
      'test_id,machine,type,scenario,hypervisor,vm_count,power_mean_w,power_median_w,power_std_w,cpu_mean_pct,ram_mean_pct,temp_mean_c,energy_wh,corr_power_cpu';
    const rows = results.map((r) =>
      [
        r.testId,
        r.test.machine.name,
        r.test.machine.type,
        r.test.scenario.name,
        r.test.hypervisor,
        r.test.vmCount,
        r.powerMeanW,
        r.powerMedianW,
        r.powerStdW,
        r.cpuMeanPct,
        r.ramMeanPct,
        r.tempMeanC ?? '',
        r.energyWh,
        r.corrPowerCpu,
      ].join(','),
    );
    return [header, ...rows].join('\n');
  }

  // ─────────────────────────────── Excel ────────────────────────────────────

  async excelResults(): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'EnergieSI';
    wb.created = new Date();

    // Feuille 1 : Résultats
    const results = await this.prisma.result.findMany({
      include: { test: { include: { machine: true, scenario: true } } },
      orderBy: { id: 'asc' },
    });
    const ws = wb.addWorksheet('Résultats');
    ws.columns = [
      { header: 'Machine', key: 'machine', width: 24 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Scénario', key: 'scenario', width: 26 },
      { header: 'Hyperviseur', key: 'hyp', width: 14 },
      { header: 'Nb VM', key: 'vm', width: 8 },
      { header: 'Puissance moy (W)', key: 'p', width: 18 },
      { header: 'Énergie (Wh)', key: 'e', width: 14 },
      { header: 'CPU moy (%)', key: 'cpu', width: 14 },
      { header: 'Temp moy (°C)', key: 't', width: 14 },
      { header: 'Corr P↔CPU', key: 'corr', width: 12 },
    ];
    ws.getRow(1).font = { bold: true };
    for (const r of results) {
      ws.addRow({
        machine: r.test.machine.name,
        type: r.test.machine.type,
        scenario: r.test.scenario.name,
        hyp: r.test.hypervisor,
        vm: r.test.vmCount,
        p: r.powerMeanW,
        e: r.energyWh,
        cpu: r.cpuMeanPct,
        t: r.tempMeanC,
        corr: r.corrPowerCpu,
      });
    }

    // Feuille 2 : Comparaison fixe vs portable
    const hw = await this.analysis.compareHardware();
    const ws2 = wb.addWorksheet('Fixe vs Portable');
    ws2.columns = [
      { header: 'Scénario', key: 's', width: 28 },
      { header: 'Fixe (W)', key: 'd', width: 12 },
      { header: 'Portable (W)', key: 'l', width: 14 },
      { header: 'Écart (%)', key: 'diff', width: 12 },
    ];
    ws2.getRow(1).font = { bold: true };
    hw.forEach((row) => ws2.addRow({ s: row.scenario, d: row.desktopW, l: row.laptopW, diff: row.diffPct }));

    // Feuille 3 : Hypothèses
    const hyp = await this.analysis.hypotheses();
    const ws3 = wb.addWorksheet('Hypothèses');
    ws3.columns = [
      { header: 'ID', key: 'id', width: 6 },
      { header: 'Énoncé', key: 'st', width: 60 },
      { header: 'Verdict', key: 'v', width: 14 },
      { header: 'Conclusion', key: 'c', width: 80 },
    ];
    ws3.getRow(1).font = { bold: true };
    hyp.forEach((h) => ws3.addRow({ id: h.id, st: h.statement, v: h.verdict, c: h.conclusion }));

    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf as ArrayBuffer);
  }

  // ─────────────────────────────── PDF ──────────────────────────────────────

  async pdfReport(): Promise<Buffer> {
    const summary = await this.analysis.summary();
    const hw = await this.analysis.compareHardware();
    const hyp = await this.analysis.hypotheses();
    const hv = await this.analysis.compareHypervisors();

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c as Buffer));
    const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

    const C = { primary: '#2563eb', dark: '#0f172a', muted: '#64748b', ok: '#16a34a', bad: '#dc2626' };

    // En-tête
    doc.fillColor(C.primary).fontSize(20).text('Rapport — Consommation énergétique des systèmes informatiques', { align: 'left' });
    doc.moveDown(0.3);
    doc.fillColor(C.muted).fontSize(10).text(`Généré le ${new Date().toLocaleString('fr-FR')} — EnergieSI`);
    doc.moveDown(1);

    // Synthèse
    doc.fillColor(C.dark).fontSize(14).text('1. Synthèse');
    doc.moveDown(0.3);
    doc.fillColor(C.dark).fontSize(10).text(
      `Machines : ${summary.counts.machines}  •  Tests : ${summary.counts.tests}  •  Mesures : ${summary.counts.measurements}`,
    );
    doc.moveDown(0.5);
    summary.powerByType.forEach((p: any) => {
      doc.text(`• ${p.type} : puissance moyenne ${p.powerMeanW} W, énergie moyenne ${p.energyMeanWh} Wh (${p.tests} tests)`);
    });
    doc.moveDown(1);

    // Comparaison fixe vs portable
    doc.fillColor(C.dark).fontSize(14).text('2. Comparaison ordinateur fixe vs portable');
    doc.moveDown(0.3);
    doc.fontSize(10);
    hw.forEach((row: any) => {
      doc.fillColor(C.dark).text(
        `• ${row.scenario} : fixe ${row.desktopW} W, portable ${row.laptopW} W (écart ${row.diffPct} %)`,
      );
    });
    doc.moveDown(1);

    // Hyperviseurs
    doc.fillColor(C.dark).fontSize(14).text('3. VirtualBox vs VMware');
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor(C.dark).text(
      `VirtualBox : ${hv.virtualbox.powerMeanW} W  •  VMware : ${hv.vmware.powerMeanW} W  •  écart ${hv.diffPct} %`,
    );
    doc.moveDown(1);

    // Hypothèses
    doc.fillColor(C.dark).fontSize(14).text('4. Validation des hypothèses');
    doc.moveDown(0.3);
    hyp.forEach((h: any) => {
      const color = h.verdict === 'CONFIRMED' ? C.ok : h.verdict === 'REJECTED' ? C.bad : C.muted;
      doc.fillColor(C.dark).fontSize(11).text(`${h.id} — ${h.statement}`);
      doc.fillColor(color).fontSize(10).text(`Verdict : ${h.verdict}`);
      doc.fillColor(C.dark).fontSize(10).text(h.conclusion, { align: 'justify' });
      doc.moveDown(0.6);
    });

    doc.moveDown(1);
    doc.fillColor(C.muted).fontSize(8).text(
      'Rapport généré automatiquement par EnergieSI — outil de mesure et d’analyse de la consommation énergétique.',
      { align: 'center' },
    );

    doc.end();
    return done;
  }
}
