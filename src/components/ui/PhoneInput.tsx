"use client";

import React, { useState, useEffect, useId } from "react";
import { PatternFormat, PatternFormatProps } from "react-number-format";

interface PhoneInputProps extends Omit<PatternFormatProps, "format"> {
  label?: string;
  error?: string;
  className?: string;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-bold text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        <PatternFormat
          {...props}
          id={inputId}
          format="(##) #####-####"
          mask="_"
          getInputRef={ref}
          onValueChange={(values, sourceInfo) => {
            if (props.onValueChange) {
              props.onValueChange(values, sourceInfo);
            }
          }}
          className={`w-full p-2 border rounded-md outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
            error ? "border-red-500 focus:ring-red-500" : "border-gray-300"
          } ${className}`}
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";
