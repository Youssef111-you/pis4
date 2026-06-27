import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScenariosService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.scenario.findMany({ orderBy: { id: 'asc' } });
  }

  findByCase(studyCase: string) {
    return this.prisma.scenario.findMany({ where: { studyCase }, orderBy: { id: 'asc' } });
  }
}
