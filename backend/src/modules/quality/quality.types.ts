// ============================================
// QUALITY CONTROL TYPES
// backend/src/modules/quality/quality.types.ts
// ============================================

import {
  QualityMeasurement,
  FinalInspection,
  QualityDefect,
  WorkOrder,
  InventoryLot,
  User,
  Product,
} from '@prisma/client';

// ============================================
// BASE TYPES
// ============================================

export interface QualityMeasurementWithDetails extends QualityMeasurement {
  workOrder: WorkOrder & {
    product: Product & {
      translations: Array<{
        languageCode: string;
        name: string;
      }>;
    };
  };
  measurer: User;
  defects: QualityDefect[];
}

export interface FinalInspectionWithDetails extends FinalInspection {
  lot: InventoryLot & {
    product: Product & {
      translations: Array<{
        languageCode: string;
        name: string;
      }>;
    };
  };
  workOrder?: WorkOrder | null;
  inspector: User;
  defects: QualityDefect[];
}

export interface QualityDefectWithContext extends QualityDefect {
  measurement?: QualityMeasurement | null;
  inspection?: FinalInspection | null;
}

// ============================================
// DTO TYPES
// ============================================

export interface CreateQualityMeasurementDTO {
  workOrderId: string;
  measuredBy: string;
  sampleSize: number;
  parametersJson: MeasurementParameters;
  overallResult: 'PASS' | 'FAIL' | 'CONDITIONAL';
  defectCount?: number;
  defectTypes?: string;
  notes?: string;
  defects?: CreateDefectDTO[];
}

export interface MeasurementParameters {
  [key: string]: {
    value: number;
    min?: number;
    max?: number;
    unit?: string;
    pass: boolean;
  };
}

export interface CreateFinalInspectionDTO {
  lotId: string;
  workOrderId?: string;
  inspectedBy: string;
  totalQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  measurementsJson?: MeasurementParameters;
  visualInspectionPass: boolean;
  functionalTestPass: boolean;
  overallResult: 'APPROVED' | 'REJECTED' | 'CONDITIONAL';
  photos?: string[];
  notes?: string;
  defects?: CreateDefectDTO[];
}

export interface CreateDefectDTO {
  defectType: string;
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
  quantity: number;
  description?: string;
  photo?: string;
}

export interface UpdateQualityMeasurementDTO {
  overallResult?: 'PASS' | 'FAIL' | 'CONDITIONAL';
  notes?: string;
}

export interface UpdateFinalInspectionDTO {
  overallResult?: 'APPROVED' | 'REJECTED' | 'CONDITIONAL';
  notes?: string;
}

// ============================================
// QUERY FILTERS
// ============================================

export interface QualityMeasurementFilters {
  workOrderId?: string;
  measuredBy?: string;
  overallResult?: 'PASS' | 'FAIL' | 'CONDITIONAL';
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface FinalInspectionFilters {
  lotId?: string;
  workOrderId?: string;
  inspectedBy?: string;
  overallResult?: 'APPROVED' | 'REJECTED' | 'CONDITIONAL';
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface DefectFilters {
  defectType?: string;
  severity?: 'MINOR' | 'MAJOR' | 'CRITICAL';
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface QualityStats {
  measurements: {
    total: number;
    passed: number;
    failed: number;
    conditional: number;
    passRate: number; // percentage
  };
  inspections: {
    total: number;
    approved: number;
    rejected: number;
    conditional: number;
    approvalRate: number; // percentage
  };
  defects: {
    total: number;
    minor: number;
    major: number;
    critical: number;
    byType: Array<{
      type: string;
      count: number;
    }>;
  };
  trends: {
    period: 'week' | 'month';
    passRateTrend: number; // +/- percentage change
    defectRateTrend: number;
  };
}

export interface ProductQualityReport {
  product: {
    id: string;
    code: string;
    name: string;
  };
  period: {
    startDate: Date;
    endDate: Date;
  };
  measurements: {
    total: number;
    passed: number;
    passRate: number;
  };
  inspections: {
    total: number;
    approved: number;
    approvalRate: number;
  };
  defects: {
    total: number;
    byType: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
  };
  qualityScore: number; // 0-100
}

export interface DefectAnalysis {
  totalDefects: number;
  period: {
    startDate: Date;
    endDate: Date;
  };
  bySeverity: Array<{
    severity: string;
    count: number;
    percentage: number;
  }>;
  byType: Array<{
    type: string;
    count: number;
    percentage: number;
    severity: string;
  }>;
  topDefects: Array<{
    type: string;
    count: number;
    affectedProducts: number;
  }>;
  trend: {
    previousPeriodTotal: number;
    change: number; // percentage
    direction: 'up' | 'down' | 'stable';
  };
}

export interface InspectorPerformance {
  inspector: {
    id: string;
    name: string;
  };
  period: {
    startDate: Date;
    endDate: Date;
  };
  inspections: {
    total: number;
    approved: number;
    rejected: number;
    approvalRate: number;
  };
  defectsFound: number;
  averageInspectionTime?: number; // minutes
  qualityScore: number; // 0-100
}

export interface QualityTrend {
  date: Date;
  measurements: {
    total: number;
    passed: number;
    passRate: number;
  };
  defects: {
    total: number;
    critical: number;
  };
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

export const createMeasurementSchema = {
  workOrderId: { required: true, format: 'uuid' },
  measuredBy: { required: true, format: 'uuid' },
  sampleSize: { required: true, min: 1 },
  parametersJson: { required: true, type: 'object' },
  overallResult: { required: true, enum: ['PASS', 'FAIL', 'CONDITIONAL'] },
  defectCount: { required: false, min: 0 },
};

export const createInspectionSchema = {
  lotId: { required: true, format: 'uuid' },
  inspectedBy: { required: true, format: 'uuid' },
  totalQuantity: { required: true, min: 0.001 },
  acceptedQuantity: { required: true, min: 0 },
  rejectedQuantity: { required: true, min: 0 },
  visualInspectionPass: { required: true, type: 'boolean' },
  functionalTestPass: { required: true, type: 'boolean' },
  overallResult: { required: true, enum: ['APPROVED', 'REJECTED', 'CONDITIONAL'] },
};

export const createDefectSchema = {
  defectType: { required: true, maxLength: 100 },
  severity: { required: true, enum: ['MINOR', 'MAJOR', 'CRITICAL'] },
  quantity: { required: true, min: 1 },
  description: { required: false, maxLength: 500 },
};

// ============================================
// COMMON DEFECT TYPES
// ============================================

export const COMMON_DEFECT_TYPES = [
  'SCRATCH',
  'DISCOLORATION',
  'DIMENSION',
  'CRACK',
  'WARPING',
  'FLASH',
  'SINK_MARK',
  'SHORT_SHOT',
  'BURN_MARK',
  'CONTAMINATION',
  'SURFACE_DEFECT',
  'ASSEMBLY_ERROR',
  'MISSING_PART',
  'FUNCTIONAL_FAILURE',
  'OTHER',
];

// ============================================
// MEASUREMENT PARAMETER TEMPLATES
// ============================================

export interface ParameterTemplate {
  name: string;
  parameters: Array<{
    key: string;
    label: string;
    unit: string;
    min?: number;
    max?: number;
    required: boolean;
  }>;
}

export const MEASUREMENT_TEMPLATES: Record<string, ParameterTemplate> = {
  DIMENSIONAL: {
    name: 'Dimensional Check',
    parameters: [
      { key: 'length', label: 'Length', unit: 'mm', required: true },
      { key: 'width', label: 'Width', unit: 'mm', required: true },
      { key: 'height', label: 'Height', unit: 'mm', required: true },
      { key: 'thickness', label: 'Thickness', unit: 'mm', required: false },
    ],
  },
  WEIGHT: {
    name: 'Weight Check',
    parameters: [
      { key: 'weight', label: 'Weight', unit: 'g', required: true },
    ],
  },
  VISUAL: {
    name: 'Visual Inspection',
    parameters: [
      { key: 'surface_quality', label: 'Surface Quality', unit: 'score', min: 0, max: 10, required: true },
      { key: 'color_match', label: 'Color Match', unit: 'score', min: 0, max: 10, required: true },
    ],
  },
  FUNCTIONAL: {
    name: 'Functional Test',
    parameters: [
      { key: 'assembly_fit', label: 'Assembly Fit', unit: 'score', min: 0, max: 10, required: true },
      { key: 'operation_test', label: 'Operation Test', unit: 'score', min: 0, max: 10, required: true },
    ],
  },
};