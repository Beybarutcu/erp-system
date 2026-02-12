import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

export interface FormSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FormSelectProps {
  name: string;
  label?: string;
  placeholder?: string;
  options: FormSelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  error?: string | null;
  touched?: boolean;
  showError?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

/**
 * FormSelect - Select component for forms
 * Simplifies option rendering and error handling
 */
export const FormSelect = React.forwardRef<HTMLButtonElement, FormSelectProps>(
  (
    {
      name,
      label,
      placeholder = "Select an option",
      options,
      value,
      onValueChange,
      error,
      touched,
      showError = true,
      disabled,
      required,
      className,
    },
    ref
  ) => {
    const displayError = showError && touched && error;

    return (
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          ref={ref}
          label={label}
          error={displayError ? error : undefined}
          className={className}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
);

FormSelect.displayName = "FormSelect";
