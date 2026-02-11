// ============================================
// TYPES - personnel.types.ts
// ============================================

import { Personnel, PersonnelCapacity } from '@prisma/client';

export interface PersonnelWithCapacity extends Personnel {
  capacities: PersonnelCapacity[];
  currentWeekCapacity?: PersonnelCapacity | null;
}

export interface CreatePersonnelDTO {
  code: string;
  name: string;
  position: string;
  shift: string;
  weeklyHours: number;
  skills?: any;
}

export interface UpdatePersonnelDTO {
  name?: string;
  position?: string;
  shift?: string;
  weeklyHours?: number;
  skills?: any;
  isActive?: boolean;
}

export interface CreateCapacityDTO {
  personnelId: string;
  weekNumber: number;
  year: number;
  plannedHours: number;
  actualHours?: number;
  overtimeHours?: number;
}

export interface PersonnelFilters {
  position?: string;
  shift?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PersonnelStats {
  total: number;
  byPosition: Array<{ position: string; count: number }>;
  byShift: Array<{ shift: string; count: number }>;
  averageWeeklyHours: number;
  currentWeekUtilization: number;
}
