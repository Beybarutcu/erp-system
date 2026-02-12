import * as React from "react";
import { Input, InputProps } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export interface FormFieldProps extends Omit<InputProps, 'error'> {
  name: string;
  error?: string | null;
  touched?: boolean;
  showError?: boolean;
}

/**
 * FormField - Wrapper around Input for form integration
 * Works with Formik, React Hook Form, or manual state management
 */
export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ name, error, touched, showError = true, className, ...props }, ref) => {
    const displayError = showError && touched && error;

    return (
      <Input
        ref={ref}
        name={name}
        error={displayError ? error : undefined}
        className={cn(className)}
        {...props}
      />
    );
  }
);

FormField.displayName = "FormField";
