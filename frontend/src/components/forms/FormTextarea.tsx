import * as React from "react";
import { cn } from "@/lib/utils";

export interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: string;
  label?: string;
  error?: string | null;
  touched?: boolean;
  showError?: boolean;
  helperText?: string;
}

/**
 * FormTextarea - Textarea component for forms
 * Consistent styling with Input component
 */
export const FormTextarea = React.forwardRef<
  HTMLTextAreaElement,
  FormTextareaProps
>(
  (
    {
      className,
      name,
      label,
      error,
      touched,
      showError = true,
      helperText,
      ...props
    },
    ref
  ) => {
    const displayError = showError && touched && error;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          name={name}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            displayError && "border-destructive focus-visible:ring-destructive",
            className
          )}
          {...props}
        />

        {(displayError || helperText) && (
          <p
            className={cn(
              "text-sm mt-1.5",
              displayError ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {displayError ? error : helperText}
          </p>
        )}
      </div>
    );
  }
);

FormTextarea.displayName = "FormTextarea";
