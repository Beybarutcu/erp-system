"use client";

import * as React from "react";
import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/forms/FormField";
import { FormSelect } from "@/components/forms/FormSelect";
import { FormTextarea } from "@/components/forms/FormTextarea";
import { toast } from "sonner";
import { CheckCircle, AlertTriangle } from "lucide-react";

interface RecordProductionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrderId?: string;
  plannedQuantity?: number;
  onSuccess?: () => void;
}

interface ProductionFormData {
  workOrderId: string;
  producedQuantity: string;
  goodQuantity: string;
  defectiveQuantity: string;
  wasteQuantity: string;
  lotNumber: string;
  warehouseLocation: string;
  qualityStatus: string;
  notes: string;
}

interface FormErrors {
  [key: string]: string;
}

interface TouchedFields {
  [key: string]: boolean;
}

export function RecordProductionModal({
  open,
  onOpenChange,
  workOrderId,
  plannedQuantity = 0,
  onSuccess,
}: RecordProductionModalProps) {
  const [formData, setFormData] = useState<ProductionFormData>({
    workOrderId: workOrderId || "",
    producedQuantity: "",
    goodQuantity: "",
    defectiveQuantity: "",
    wasteQuantity: "",
    lotNumber: "",
    warehouseLocation: "",
    qualityStatus: "passed",
    notes: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // TODO: Fetch from API
  const workOrderOptions = [
    { value: "WO-001", label: "WO-001 - Product A (Plan: 1000)" },
    { value: "WO-002", label: "WO-002 - Product B (Plan: 500)" },
    { value: "WO-003", label: "WO-003 - Product C (Plan: 2000)" },
  ];

  const warehouseOptions = [
    { value: "WH-A-01", label: "Warehouse A - Rack 01" },
    { value: "WH-A-02", label: "Warehouse A - Rack 02" },
    { value: "WH-B-01", label: "Warehouse B - Rack 01" },
    { value: "QUARANTINE", label: "Quarantine Area" },
  ];

  const qualityStatusOptions = [
    { value: "passed", label: "Quality Passed" },
    { value: "pending", label: "Pending Inspection" },
    { value: "failed", label: "Quality Failed" },
  ];

  const validate = (data: ProductionFormData): FormErrors => {
    const errors: FormErrors = {};

    if (!data.workOrderId) {
      errors.workOrderId = "Work order is required";
    }

    if (!data.producedQuantity.trim()) {
      errors.producedQuantity = "Produced quantity is required";
    } else if (isNaN(Number(data.producedQuantity)) || Number(data.producedQuantity) <= 0) {
      errors.producedQuantity = "Must be a positive number";
    }

    if (!data.goodQuantity.trim()) {
      errors.goodQuantity = "Good quantity is required";
    } else if (isNaN(Number(data.goodQuantity)) || Number(data.goodQuantity) < 0) {
      errors.goodQuantity = "Must be a non-negative number";
    }

    const produced = Number(data.producedQuantity) || 0;
    const good = Number(data.goodQuantity) || 0;
    const defective = Number(data.defectiveQuantity) || 0;
    const waste = Number(data.wasteQuantity) || 0;

    const total = good + defective + waste;
    if (total > produced) {
      errors.goodQuantity = "Total (good + defective + waste) cannot exceed produced quantity";
    }

    if (!data.lotNumber.trim()) {
      errors.lotNumber = "Lot number is required";
    } else if (!/^LOT-\d{4}-\d{2}-\d{2}/.test(data.lotNumber)) {
      errors.lotNumber = "Lot number format should be LOT-YYYY-MM-DD-XXX";
    }

    if (!data.warehouseLocation) {
      errors.warehouseLocation = "Warehouse location is required";
    }

    return errors;
  };

  const handleChange = (field: keyof ProductionFormData, value: string) => {
    const newData = { ...formData, [field]: value };
    
    // Auto-calculate defective if produced and good are filled
    if (field === "producedQuantity" || field === "goodQuantity") {
      const produced = Number(field === "producedQuantity" ? value : formData.producedQuantity) || 0;
      const good = Number(field === "goodQuantity" ? value : formData.goodQuantity) || 0;
      const waste = Number(formData.wasteQuantity) || 0;
      
      if (produced > 0 && good >= 0) {
        const defective = Math.max(0, produced - good - waste);
        newData.defectiveQuantity = defective.toString();
      }
    }

    setFormData(newData);
    setTouched((prev) => ({ ...prev, [field]: true }));

    const newErrors = validate(newData);
    setErrors(newErrors);
  };

  const handleBlur = (field: keyof ProductionFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const generateLotNumber = () => {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `LOT-${dateStr}-${random}`;
  };

  React.useEffect(() => {
    if (open && !formData.lotNumber) {
      setFormData((prev) => ({ ...prev, lotNumber: generateLotNumber() }));
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const allTouched = Object.keys(formData).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {}
    );
    setTouched(allTouched);

    const validationErrors = validate(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Replace with actual API call
      // await workOrdersApi.recordProduction(formData);
      
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(`Production recorded: ${formData.goodQuantity} good units`);
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to record production");
      console.error("Error recording production:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      workOrderId: workOrderId || "",
      producedQuantity: "",
      goodQuantity: "",
      defectiveQuantity: "",
      wasteQuantity: "",
      lotNumber: "",
      warehouseLocation: "",
      qualityStatus: "passed",
      notes: "",
    });
    setErrors({});
    setTouched({});
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      resetForm();
    }
  };

  React.useEffect(() => {
    if (open && workOrderId) {
      setFormData((prev) => ({ ...prev, workOrderId }));
    }
  }, [open, workOrderId]);

  const yieldPercentage =
    formData.producedQuantity && formData.goodQuantity
      ? ((Number(formData.goodQuantity) / Number(formData.producedQuantity)) * 100).toFixed(1)
      : "0";

  const defectRate =
    formData.producedQuantity && formData.defectiveQuantity
      ? ((Number(formData.defectiveQuantity) / Number(formData.producedQuantity)) * 100).toFixed(1)
      : "0";

  return (
    <Modal open={open} onOpenChange={handleClose}>
      <ModalContent size="xl">
        <ModalHeader>
          <ModalTitle>Record Production</ModalTitle>
          <ModalDescription>
            Complete work order and record production output
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <FormSelect
              name="workOrderId"
              label="Work Order"
              placeholder="Select work order"
              options={workOrderOptions}
              value={formData.workOrderId}
              onValueChange={(value) => handleChange("workOrderId", value)}
              error={errors.workOrderId}
              touched={touched.workOrderId}
              disabled={!!workOrderId}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="producedQuantity"
                label="Total Produced Quantity"
                type="number"
                placeholder="Enter total produced"
                value={formData.producedQuantity}
                onChange={(e) => handleChange("producedQuantity", e.target.value)}
                onBlur={() => handleBlur("producedQuantity")}
                error={errors.producedQuantity}
                touched={touched.producedQuantity}
                helperText={plannedQuantity ? `Planned: ${plannedQuantity}` : undefined}
                required
              />

              <FormField
                name="goodQuantity"
                label="Good Quantity"
                type="number"
                placeholder="Enter good units"
                value={formData.goodQuantity}
                onChange={(e) => handleChange("goodQuantity", e.target.value)}
                onBlur={() => handleBlur("goodQuantity")}
                error={errors.goodQuantity}
                touched={touched.goodQuantity}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="defectiveQuantity"
                label="Defective Quantity"
                type="number"
                placeholder="Auto-calculated"
                value={formData.defectiveQuantity}
                onChange={(e) => handleChange("defectiveQuantity", e.target.value)}
                helperText="Auto-calculated from produced - good - waste"
              />

              <FormField
                name="wasteQuantity"
                label="Waste Quantity"
                type="number"
                placeholder="Enter waste"
                value={formData.wasteQuantity}
                onChange={(e) => handleChange("wasteQuantity", e.target.value)}
              />
            </div>

            {/* Production Metrics */}
            {formData.producedQuantity && formData.goodQuantity && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        Yield Rate
                      </p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {yieldPercentage}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        Defect Rate
                      </p>
                      <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                        {defectRate}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="lotNumber"
                label="Lot Number"
                placeholder="LOT-YYYY-MM-DD-XXX"
                value={formData.lotNumber}
                onChange={(e) => handleChange("lotNumber", e.target.value.toUpperCase())}
                onBlur={() => handleBlur("lotNumber")}
                error={errors.lotNumber}
                touched={touched.lotNumber}
                required
              />

              <FormSelect
                name="warehouseLocation"
                label="Warehouse Location"
                placeholder="Select storage location"
                options={warehouseOptions}
                value={formData.warehouseLocation}
                onValueChange={(value) => handleChange("warehouseLocation", value)}
                error={errors.warehouseLocation}
                touched={touched.warehouseLocation}
                required
              />
            </div>

            <FormSelect
              name="qualityStatus"
              label="Quality Status"
              placeholder="Select quality status"
              options={qualityStatusOptions}
              value={formData.qualityStatus}
              onValueChange={(value) => handleChange("qualityStatus", value)}
              required
            />

            <FormTextarea
              name="notes"
              label="Production Notes"
              placeholder="Add any relevant notes about this production run (optional)"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={3}
            />
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Record Production
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
