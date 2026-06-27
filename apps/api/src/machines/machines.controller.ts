import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { MachinesService } from './machines.service';
import { CreateMachineDto } from './dto/create-machine.dto';

@Controller('machines')
export class MachinesController {
  constructor(private readonly machines: MachinesService) {}

  @Get()
  findAll() {
    return this.machines.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.machines.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateMachineDto) {
    return this.machines.create(dto);
  }

  @Post('auto-detect')
  autoDetect() {
    return this.machines.autoDetect();
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.machines.remove(id);
  }
}
