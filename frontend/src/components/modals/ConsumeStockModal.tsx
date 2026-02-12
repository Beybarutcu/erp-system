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
import { Package, AlertCircle } from "lucide-react";

interface ConsumeStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
  lotId?: string;
  availableStock?: number;
  onSuccess?: () => void;
}

interface ConsumeStockFormData {
  productId: string;
  lotId: string;
  quantity: string;
  reason: string;
  workOrderId: string;
  notes: string;
}

interface FormErrors {
  [key: string]: string;
}

interface TouchedFields {
  [key: string]: boolean;
}

export function ConsumeStockModal({
  open,
  onOpenChange,
  productId,
  lotId,
  availableStock = 0,
  onSuccess,
}: ConsumeStockModalProps) {
  const [formData, setFormData] = useState<ConsumeStockFormData>({
    productId: productId || "",
    lotId: lotId || "",
    quantity: "",
    reason: "production",
    workOrderId: "",
    notes: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // TODO: Fetch from API
  const productOptions = [
    { value: "1", label: "Raw Material A - Available: 1000 kg" },
    { value: "2", label: "Raw Material B - Available: 500 kg" },
    { value: "3", label: "Component C - Available: 2000 pcs" },
  ];

  const lotOptions = [
    { value: "LOT-001", label: "LOT-001 - Exp: 2025-06-01 (500 units)" },
    { value: "LOT-002", label: "LOT-002 - Exp: 2025-07-15 (300 units)" },
    { value: "LOT-003", label: "LOT-003 - Exp: 2025-08-20 (700 units)" },
  ];

  const reasonOptions = [
    { value: "production", label: "Production Consumption" },
    { value: "quality-testing", label: "Quality Testing" },
    { value: "rework", label: "Rework/Repair" },
    { value: "waste", label: "Waste/Scrap" },
    { value: "sample", label: "Sample/Demo" },
    { value: "other", label: "Other" },
  ];

  const workOrderOptions = [
    { value: "WO-001", label: "WO-001 - Product A (1000 units)" },
    { value: "WO-002", label: "WO-002 - Product B (500 units)" },
    { value: "WO-003", label: "WO-003 - Product C (2000 units)" },
  ];

  const validate = (data: ConsumeStockFormData): FormErrors => {
    const errors: FormErrors = {};

    if (!data.productId) {
      errors.productId = "Product is required";
    }

    if (!data.lotId) {
      errors.lotId = "Lot is required";
    }

    if (!data.quantity.trim()) {
      errors.quantity = "Quantity is required";
    } else if (isNaN(Number(data.quantity)) || Number(data.quantity) <= 0) {
      errors.quantity = "Quantity must be a positive number";
    } else if (availableStock > 0 && Number(data.quantity) > availableStock) {
      errors.quantity = `Cannot consume more than available stock (${availableStock})`;
    }

    if (data.reason === "production" && !data.workOrderId) {
      errors.workOrderId = "Work order is required for production consumption";
    }

    return errors;
  };

  const handleChange = (field: keyof ConsumeStockFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));

    const newData = { ...formData, [field]: value };
    const newErrors = validate(newData);
    setErrors(newErrors);
  };

  const handleBlur = (field: keyof ConsumeStockFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

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
      // await inventoryApi.consumeStock(formData);
      
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(`Successfully consumed ${formData.quantity} units`);
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to consume stock");
      console.error("Error consuming stock:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      productId: productId || "",
      lotId: lotId || "",
      quantity: "",
      reason: "production",
      workOrderId: "",
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
    if (open) {
      setFormData((prev) => ({
        ...prev,
        productId: productId || prev.productId,
        lotId: lotId || prev.lotId,
      }));
    }
  }, [open, productId, lotId]);

  const remainingStock =
    availableStock > 0 && formData.quantity
      ? availableStock - Number(formData.quantity)
      : availableStock;

  return (
    <Modal open={open} onOpenChange={handleClose}>
      <ModalContent size="lg">
        <ModalHeader>
          <ModalTitle>Consume Stock</ModalTitle>
          <ModalDescription>
            Record inventory consumption for production or other purposes
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Stock Info Alert */}
            {availableStock > 0 && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-2">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Available Stock: {availableStock} units
                  </p>
                  {formData.quantity && (
                    <p className="text-blue-700 dark:text-blue-300 mt-1">
                      Remaining after consumption: {remainingStock} units
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                name="productId"
                label="Product"
                placeholder="Select product"
                options={productOptions}
                value={formData.productId}
                onValueChange={(value) => handleChange("productId", value)}
                error={errors.productId}
                touched={touched.productId}
                disabled={!!productId}
                required
              />

              <FormSelect
                name="lotId"
                label="Lot Number"
                placeholder="Select lot"
                options={lotOptions}
                value={formData.lotId}
                onValueChange={(value) => handleChange("lotId", value)}
                error={errors.lotId}
                touched={touched.lotId}
                disabled={!!lotId}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="quantity"
                label="Quantity to Consume"
                type="number"
                placeholder="Enter quantity"
                value={formData.quantity}
                onChange={(e) => handleChange("quantity", e.target.value)}
                onBlur={() => handleBlur("quantity")}
                error={errors.quantity}
                touched={touched.quantity}
                required
              />

              <FormSelect
                name="reason"
                label="Consumption Reason"
                placeholder="Select reason"
                options={reasonOptions}
                value={formData.reason}
                onValueChange={(value) => handleChange("reason", value)}
                required
              />
            </div>

            {formData.reason === "production" && (
              <FormSelect
                name="workOrderId"
                label="Work Order"
                placeholder="Select work order"
                options={workOrderOptions}
                value={formData.workOrderId}
                onValueChange={(value) => handleChange("workOrderId", value)}
                error={errors.workOrderId}
                touched={touched.workOrderId}
                required
              />
            )}

            <FormTextarea
              name="notes"
              label="Additional Notes"
              placeholder="Add any relevant notes (optional)"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={3}
            />

            {/* Warning for high consumption */}
            {availableStock > 0 &&
              formData.quantity &&
              Number(formData.quantity) > availableStock * 0.8 && (
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Warning: You're consuming a large portion of available stock.
                    This may trigger low stock alerts.
                  </p>
                </div>
              )}
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
              Consume Stock
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
