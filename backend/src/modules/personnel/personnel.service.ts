// ============================================
// SERVICE - personnel.service.ts
// ============================================

import { prisma } from '@shared/database/client';
import { AppError } from '@shared/middleware/error-handler';
import { Prisma } from '@prisma/client';

export class PersonnelService {
  async getPersonnel(filters: PersonnelFilters = {}) {
    const { page = 1, limit = 20, ...restFilters } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.PersonnelWhereInput = {};

    if (restFilters.position) where.position = restFilters.position;
    if (restFilters.shift) where.shift = restFilters.shift;
    if (restFilters.isActive !== undefined) where.isActive = restFilters.isActive;

    if (restFilters.search) {
      where.OR = [
        { code: { contains: restFilters.search, mode: 'insensitive' } },
        { name: { contains: restFilters.search, mode: 'insensitive' } },
      ];
    }

    // Get current week
    const now = new Date();
    const weekNumber = this.getWeekNumber(now);
    const year = now.getFullYear();

    const [personnel, total] = await Promise.all([
      prisma.personnel.findMany({
        where,
        include: {
          capacities: {
            where: { year, weekNumber },
            take: 1,
          },
        },
        skip,
        take: limit,
        orderBy: { code: 'asc' },
      }),
      prisma.personnel.count({ where }),
    ]);

    return {
      data: personnel,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPersonnelById(id: string) {
    const personnel = await prisma.personnel.findUnique({
      where: { id },
      include: {
        capacities: {
          orderBy: { year: 'desc' },
          take: 12,
        },
      },
    });

    if (!personnel) throw new AppError('Personnel not found', 404);
    return personnel;
  }

  async createPersonnel(data: CreatePersonnelDTO) {
    const existing = await prisma.personnel.findUnique({ where: { code: data.code } });
    if (existing) throw new AppError('Personnel code already exists', 400);

    const personnel = await prisma.personnel.create({ data });
    return personnel;
  }

  async updatePersonnel(id: string, data: UpdatePersonnelDTO) {
    const personnel = await prisma.personnel.update({ where: { id }, data });
    return personnel;
  }

  async deletePersonnel(id: string) {
    await prisma.personnel.update({
      where: { id },
      data: { isActive: false },
    });
    return { message: 'Personnel deactivated successfully' };
  }

  async recordCapacity(data: CreateCapacityDTO) {
    const personnel = await prisma.personnel.findUnique({
      where: { id: data.personnelId },
    });

    if (!personnel) throw new AppError('Personnel not found', 404);

    const capacity = await prisma.personnelCapacity.upsert({
      where: {
        personnelId_year_weekNumber: {
          personnelId: data.personnelId,
          year: data.year,
          weekNumber: data.weekNumber,
        },
      },
      create: data,
      update: {
        plannedHours: data.plannedHours,
        actualHours: data.actualHours,
        overtimeHours: data.overtimeHours,
      },
      include: { personnel: true },
    });

    return capacity;
  }

  async getCapacityReport(weekNumber: number, year: number) {
    const capacities = await prisma.personnelCapacity.findMany({
      where: { weekNumber, year },
      include: { personnel: true },
    });

    return capacities;
  }

  async getStats(): Promise<PersonnelStats> {
    const [total, byPosition, byShift, avgHours, currentWeekCap] = await Promise.all([
      prisma.personnel.count({ where: { isActive: true } }),
      prisma.personnel.groupBy({
        by: ['position'],
        where: { isActive: true },
        _count: { position: true },
      }),
      prisma.personnel.groupBy({
        by: ['shift'],
        where: { isActive: true },
        _count: { shift: true },
      }),
      prisma.personnel.aggregate({
        where: { isActive: true },
        _avg: { weeklyHours: true },
      }),
      prisma.personnelCapacity.aggregate({
        where: {
          year: new Date().getFullYear(),
          weekNumber: this.getWeekNumber(new Date()),
        },
        _avg: { actualHours: true, plannedHours: true },
      }),
    ]);

    const utilization =
      currentWeekCap._avg.plannedHours && currentWeekCap._avg.actualHours
        ? (Number(currentWeekCap._avg.actualHours) / Number(currentWeekCap._avg.plannedHours)) * 100
        : 0;

    return {
      total,
      byPosition: byPosition.map((item) => ({ position: item.position, count: item._count.position })),
      byShift: byShift.map((item) => ({ shift: item.shift, count: item._count.shift })),
      averageWeeklyHours: Number(avgHours._avg.weeklyHours || 0),
      currentWeekUtilization: Math.round(utilization),
    };
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
}

export default new PersonnelService();
