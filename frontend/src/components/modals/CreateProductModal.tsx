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

interface CreateProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ProductFormData {
  name: string;
  sku: string;
  category: string;
  unit: string;
  description: string;
  minStockLevel: string;
  reorderPoint: string;
}

interface FormErrors {
  [key: string]: string;
}

interface TouchedFields {
  [key: string]: boolean;
}

export function CreateProductModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateProductModalProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    sku: "",
    category: "",
    unit: "pieces",
    description: "",
    minStockLevel: "",
    reorderPoint: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryOptions = [
    { value: "raw-material", label: "Raw Material" },
    { value: "semi-finished", label: "Semi-Finished" },
    { value: "finished-product", label: "Finished Product" },
    { value: "packaging", label: "Packaging" },
  ];

  const unitOptions = [
    { value: "pieces", label: "Pieces" },
    { value: "kg", label: "Kilograms" },
    { value: "liters", label: "Liters" },
    { value: "meters", label: "Meters" },
    { value: "boxes", label: "Boxes" },
  ];

  const validate = (data: ProductFormData): FormErrors => {
    const errors: FormErrors = {};

    if (!data.name.trim()) {
      errors.name = "Product name is required";
    }

    if (!data.sku.trim()) {
      errors.sku = "SKU is required";
    } else if (!/^[A-Z0-9-]+$/.test(data.sku)) {
      errors.sku = "SKU must contain only uppercase letters, numbers, and hyphens";
    }

    if (!data.category) {
      errors.category = "Category is required";
    }

    if (data.minStockLevel && isNaN(Number(data.minStockLevel))) {
      errors.minStockLevel = "Must be a valid number";
    }

    if (data.reorderPoint && isNaN(Number(data.reorderPoint))) {
      errors.reorderPoint = "Must be a valid number";
    }

    return errors;
  };

  const handleChange = (
    field: keyof ProductFormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));

    // Validate on change
    const newData = { ...formData, [field]: value };
    const newErrors = validate(newData);
    setErrors(newErrors);
  };

  const handleBlur = (field: keyof ProductFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {}
    );
    setTouched(allTouched);

    // Validate
    const validationErrors = validate(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Replace with actual API call
      // await productsApi.create(formData);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Product created successfully");
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to create product");
      console.error("Error creating product:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      category: "",
      unit: "pieces",
      description: "",
      minStockLevel: "",
      reorderPoint: "",
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

  return (
    <Modal open={open} onOpenChange={handleClose}>
      <ModalContent size="lg">
        <ModalHeader>
          <ModalTitle>Create New Product</ModalTitle>
          <ModalDescription>
            Add a new product to your inventory system
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="name"
                label="Product Name"
                placeholder="Enter product name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                onBlur={() => handleBlur("name")}
                error={errors.name}
                touched={touched.name}
                required
              />

              <FormField
                name="sku"
                label="SKU"
                placeholder="e.g., PROD-001"
                value={formData.sku}
                onChange={(e) => handleChange("sku", e.target.value.toUpperCase())}
                onBlur={() => handleBlur("sku")}
                error={errors.sku}
                touched={touched.sku}
                helperText="Uppercase letters, numbers, and hyphens only"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                name="category"
                label="Category"
                placeholder="Select category"
                options={categoryOptions}
                value={formData.category}
                onValueChange={(value) => handleChange("category", value)}
                error={errors.category}
                touched={touched.category}
                required
              />

              <FormSelect
                name="unit"
                label="Unit of Measurement"
                placeholder="Select unit"
                options={unitOptions}
                value={formData.unit}
                onValueChange={(value) => handleChange("unit", value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="minStockLevel"
                label="Minimum Stock Level"
                type="number"
                placeholder="0"
                value={formData.minStockLevel}
                onChange={(e) => handleChange("minStockLevel", e.target.value)}
                onBlur={() => handleBlur("minStockLevel")}
                error={errors.minStockLevel}
                touched={touched.minStockLevel}
                helperText="Alert when stock falls below this level"
              />

              <FormField
                name="reorderPoint"
                label="Reorder Point"
                type="number"
                placeholder="0"
                value={formData.reorderPoint}
                onChange={(e) => handleChange("reorderPoint", e.target.value)}
                onBlur={() => handleBlur("reorderPoint")}
                error={errors.reorderPoint}
                touched={touched.reorderPoint}
                helperText="Trigger purchase order at this level"
              />
            </div>

            <FormTextarea
              name="description"
              label="Description"
              placeholder="Enter product description (optional)"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
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
              Create Product
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
