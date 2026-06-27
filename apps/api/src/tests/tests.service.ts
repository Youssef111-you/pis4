import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TestsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filter?: { machineId?: number; scenarioId?: number }) {
    return this.prisma.test.findMany({
      where: {
        machineId: filter?.machineId,
        scenarioId: filter?.scenarioId,
      },
      include: { machine: true, scenario: true, result: true },
      orderBy: { startedAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const test = await this.prisma.test.findUnique({
      where: { id },
      include: { machine: true, scenario: true, result: true },
    });
    if (!test) throw new NotFoundException(`Test ${id} introuvable`);
    return test;
  }

  measurements(testId: number) {
    return this.prisma.measurement.findMany({
      where: { testId },
      orderBy: { timestamp: 'asc' },
    });
  }

  async remove(id: number) {
    await this.prisma.test.delete({ where: { id } });
    return { deleted: true, id };
  }
}
