"use client";

import React, { useState, useEffect } from "react";
import { PatternFormat, PatternFormatProps } from "react-number-format";

interface PhoneInputProps extends Omit<PatternFormatProps, "format"> {
  label?: string;
  error?: string;
  className?: string;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ label, error, className, ...props }, ref) => {
    // Estado para controlar o formato atual e os dígitos brutos
    const [format, setFormat] = useState("(##) ####-####");
    const [digits, setDigits] = useState("");

    // Sincroniza o formato inicial se houver valor
    useEffect(() => {
      if (props.value) {
        const val = String(props.value).replace(/\D/g, "");
        setDigits(val);
        setFormat(val.length > 10 ? "(##) #####-####" : "(##) ####-####");
      }
    }, [props.value]);

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-bold text-gray-700 mb-1">
            {label}
          </label>
        )}
        <PatternFormat
          {...props}
          format={format}
          mask="_"
          getInputRef={ref}
          onValueChange={(values, sourceInfo) => {
            const { value } = values;
            setDigits(value);
            
            // Atualiza o formato com base no valor atual
            const newFormat = value.length <= 10 ? "(##) ####-####" : "(##) #####-####";
            if (newFormat !== format) {
              setFormat(newFormat);
            }

            if (props.onValueChange) {
              props.onValueChange(values, sourceInfo);
            }
          }}
          onKeyDown={(e) => {
            // "Pre-unblock": Se o usuário tem 10 dígitos e vai digitar mais um, 
            // expandimos o formato antes do evento de input ser processado
            if (format === "(##) ####-####" && /\d/.test(e.key) && digits.length === 10) {
              setFormat("(##) #####-####");
            }
            if (props.onKeyDown) {
              props.onKeyDown(e);
            }
          }}
          onPaste={(e) => {
            // Trata colagem de números longos
            const pastedData = e.clipboardData.getData("text");
            const digitsOnly = pastedData.replace(/\D/g, "");
            if (digitsOnly.length > 10) {
              setFormat("(##) #####-####");
            }
            if (props.onPaste) {
              props.onPaste(e);
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
