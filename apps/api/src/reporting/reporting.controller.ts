import { Controller, Get, Param, ParseIntPipe, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ReportingService } from './reporting.service';

@Controller('reporting')
export class ReportingController {
  constructor(private readonly reporting: ReportingService) {}

  @Get('measurements/:testId.csv')
  async csvMeasurements(@Param('testId', ParseIntPipe) testId: number, @Res() res: Response) {
    const csv = await this.reporting.csvMeasurements(testId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="test-${testId}-mesures.csv"`);
    res.send(csv);
  }

  @Get('results.csv')
  async csvResults(@Res() res: Response) {
    const csv = await this.reporting.csvResults();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="resultats.csv"');
    res.send(csv);
  }

  @Get('results.xlsx')
  async excel(@Res() res: Response) {
    const buf = await this.reporting.excelResults();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="resultats.xlsx"');
    res.send(buf);
  }

  @Get('report.pdf')
  async pdf(@Res() res: Response) {
    const buf = await this.reporting.pdfReport();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="rapport-energie-si.pdf"');
    res.send(buf);
  }
}
