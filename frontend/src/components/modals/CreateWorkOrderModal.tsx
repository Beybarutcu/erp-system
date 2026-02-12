"use client";

import * as React from "react";
import { useState, useEffect } from "react";
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
import { Calendar } from "lucide-react";

interface CreateWorkOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface WorkOrderFormData {
  productId: string;
  quantity: string;
  dueDate: string;
  priority: string;
  assignedMachine: string;
  notes: string;
}

interface FormErrors {
  [key: string]: string;
}

interface TouchedFields {
  [key: string]: boolean;
}

export function CreateWorkOrderModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateWorkOrderModalProps) {
  const [formData, setFormData] = useState<WorkOrderFormData>({
    productId: "",
    quantity: "",
    dueDate: "",
    priority: "medium",
    assignedMachine: "",
    notes: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // TODO: Fetch from API
  const productOptions = [
    { value: "1", label: "Product A - SKU-001" },
    { value: "2", label: "Product B - SKU-002" },
    { value: "3", label: "Product C - SKU-003" },
  ];

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

  const machineOptions = [
    { value: "1", label: "Machine 1 - Injection Molding" },
    { value: "2", label: "Machine 2 - CNC" },
    { value: "3", label: "Machine 3 - Assembly Line" },
  ];

  const validate = (data: WorkOrderFormData): FormErrors => {
    const errors: FormErrors = {};

    if (!data.productId) {
      errors.productId = "Product is required";
    }

    if (!data.quantity.trim()) {
      errors.quantity = "Quantity is required";
    } else if (isNaN(Number(data.quantity)) || Number(data.quantity) <= 0) {
      errors.quantity = "Quantity must be a positive number";
    }

    if (!data.dueDate) {
      errors.dueDate = "Due date is required";
    } else {
      const selectedDate = new Date(data.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        errors.dueDate = "Due date cannot be in the past";
      }
    }

    if (!data.assignedMachine) {
      errors.assignedMachine = "Machine assignment is required";
    }

    return errors;
  };

  const handleChange = (field: keyof WorkOrderFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));

    const newData = { ...formData, [field]: value };
    const newErrors = validate(newData);
    setErrors(newErrors);
  };

  const handleBlur = (field: keyof WorkOrderFormData) => {
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
      // await workOrdersApi.create(formData);
      
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Work order created successfully");
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to create work order");
      console.error("Error creating work order:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      productId: "",
      quantity: "",
      dueDate: "",
      priority: "medium",
      assignedMachine: "",
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

  // Set default due date to tomorrow
  useEffect(() => {
    if (open && !formData.dueDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split("T")[0];
      setFormData((prev) => ({ ...prev, dueDate: dateStr }));
    }
  }, [open]);

  return (
    <Modal open={open} onOpenChange={handleClose}>
      <ModalContent size="lg">
        <ModalHeader>
          <ModalTitle>Create Work Order</ModalTitle>
          <ModalDescription>
            Schedule a new production order
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <FormSelect
              name="productId"
              label="Product"
              placeholder="Select product to manufacture"
              options={productOptions}
              value={formData.productId}
              onValueChange={(value) => handleChange("productId", value)}
              error={errors.productId}
              touched={touched.productId}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="quantity"
                label="Quantity"
                type="number"
                placeholder="Enter quantity"
                value={formData.quantity}
                onChange={(e) => handleChange("quantity", e.target.value)}
                onBlur={() => handleBlur("quantity")}
                error={errors.quantity}
                touched={touched.quantity}
                required
              />

              <FormField
                name="dueDate"
                label="Due Date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleChange("dueDate", e.target.value)}
                onBlur={() => handleBlur("dueDate")}
                error={errors.dueDate}
                touched={touched.dueDate}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                name="priority"
                label="Priority"
                placeholder="Select priority"
                options={priorityOptions}
                value={formData.priority}
                onValueChange={(value) => handleChange("priority", value)}
                required
              />

              <FormSelect
                name="assignedMachine"
                label="Assigned Machine"
                placeholder="Select machine"
                options={machineOptions}
                value={formData.assignedMachine}
                onValueChange={(value) => handleChange("assignedMachine", value)}
                error={errors.assignedMachine}
                touched={touched.assignedMachine}
                required
              />
            </div>

            <FormTextarea
              name="notes"
              label="Notes"
              placeholder="Add any special instructions or notes (optional)"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={3}
            />

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-medium">Production Summary</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  • Product:{" "}
                  {productOptions.find((p) => p.value === formData.productId)
                    ?.label || "Not selected"}
                </p>
                <p>• Quantity: {formData.quantity || "0"} units</p>
                <p>
                  • Estimated completion:{" "}
                  {formData.dueDate
                    ? new Date(formData.dueDate).toLocaleDateString()
                    : "Not set"}
                </p>
              </div>
            </div>
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
              Create Work Order
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
