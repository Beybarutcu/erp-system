import { Machine, MachineStatus, MachineShift, MachineMaintenance } from '@prisma/client';
import { CapacityReport } from '@shared/types';

export interface MachineWithRelations extends Machine {
  translations: any[];
  shifts: MachineShift[];
  maintenance?: MachineMaintenance[];
  workOrders?: any[];
  _count?: {
    workOrders: number;
    maintenance: number;
  };
}

export interface CreateMachineDTO {
  code: string;
  machineType: string;
  capacityPerHour?: number;
  location?: string;
  translations: Array<{
    languageCode: string;
    name: string;
    description?: string;
  }>;
}

export interface UpdateMachineDTO {
  code?: string;
  machineType?: string;
  capacityPerHour?: number;
  status?: MachineStatus;
  location?: string;
}

export interface MachineSchedule {
  machine: any;
  workOrders: any[];
  maintenance: MachineMaintenance[];
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export interface ScheduleMaintenanceDTO {
  machineId: string;
  maintenanceType: 'PREVENTIVE' | 'BREAKDOWN';
  scheduledDate: Date;
  durationHours: number;
  notes?: string;
}

export interface ShiftDTO {
  dayOfWeek: number; // 1=Monday, 7=Sunday
  shiftName: string;
  startTime: Date;
  endTime: Date;
}

export interface UtilizationOverview {
  summary: {
    totalMachines: number;
    available: number;
    busy: number;
    critical: number;
    overloaded: number;
    averageUtilization: number;
  };
  machines: Array<{
    machine: {
      id: string;
      code: string;
      name: string;
      machineType: string;
    };
  } & CapacityReport>;
}

export interface MachinePerformance {
  machineId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  completedWorkOrders: number;
  totalPlanned: number;
  totalProduced: number;
  totalScrap: number;
  efficiency: number;
  scrapRate: number;
  averageCycleTime: number;
}

export interface MachineTypeSummary {
  machineType: string;
  status: MachineStatus;
  count: number;
}

export interface MachineFilters {
  status?: MachineStatus;
  machineType?: string;
  location?: string;
  page?: number;
  limit?: number;
}

export { MachineStatus };
