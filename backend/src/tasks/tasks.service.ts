import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.task.findMany({ orderBy: { id: 'desc' } });
  }

  async create(dto: CreateTaskDto) {
    return this.prisma.task.create({ data: { title: dto.title } });
  }

  async update(id: number, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');
    return this.prisma.task.update({
      where: { id },
      data: dto,
    });
  }

  async toggle(id: number) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');
    return this.prisma.task.update({
      where: { id },
      data: { done: !task.done },
    });
  }

  async remove(id: number) {
    return this.prisma.task.delete({ where: { id } });
  }
}
