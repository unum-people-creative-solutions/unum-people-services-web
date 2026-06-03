"use client";

import React, { useId } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-bold text-brand-blue mb-1 flex items-center gap-2"
          >
            {icon} {label}
          </label>
        )}
        <div className="relative">
          <input
            {...props}
            id={inputId}
            ref={ref}
            className={`w-full p-2 border rounded-md outline-none focus:ring-2 focus:ring-brand-blue transition-all ${
              error ? "border-brand-orange focus:ring-brand-orange" : "border-support-grey/30"
            } ${className}`}
          />
        </div>
        {error && <p className="text-brand-orange text-xs mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
