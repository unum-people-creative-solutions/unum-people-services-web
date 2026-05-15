"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
            {icon} {label}
          </label>
        )}
        <div className="relative">
          <input
            {...props}
            ref={ref}
            className={`w-full p-2 border rounded-md outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
              error ? "border-red-500 focus:ring-red-500" : "border-gray-300"
            } ${className}`}
          />
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
