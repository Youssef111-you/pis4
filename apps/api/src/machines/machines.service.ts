import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CollectorService } from '../collector/collector.service';
import { CreateMachineDto } from './dto/create-machine.dto';
import { MachineType } from '@energie-si/shared';

@Injectable()
export class MachinesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly collector: CollectorService,
  ) {}

  findAll() {
    return this.prisma.machine.findMany({ orderBy: { id: 'asc' } });
  }

  async findOne(id: number) {
    const machine = await this.prisma.machine.findUnique({
      where: { id },
      include: { tests: { include: { scenario: true, result: true } } },
    });
    if (!machine) throw new NotFoundException(`Machine ${id} introuvable`);
    return machine;
  }

  create(dto: CreateMachineDto) {
    return this.prisma.machine.create({ data: dto });
  }

  async remove(id: number) {
    await this.prisma.machine.delete({ where: { id } });
    return { deleted: true, id };
  }

  /** Crée une machine à partir des caractéristiques détectées de l'hôte courant. */
  async autoDetect() {
    const specs = await this.collector.detectSpecs();
    return this.prisma.machine.create({
      data: {
        name: `Cette machine (${specs.os})`,
        type: MachineType.LAPTOP,
        cpuModel: specs.cpuModel,
        cpuCores: specs.cpuCores,
        ramGo: specs.ramGo,
        os: specs.os,
        pIdleW: 10,
        pMaxW: 45,
      },
    });
  }
}
