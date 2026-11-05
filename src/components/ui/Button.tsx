"use client";

import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const variantClass: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-press disabled:opacity-50",
  secondary: "bg-white text-primary border border-primary hover:bg-primary-weak",
  danger: "bg-accent text-white hover:opacity-90 disabled:opacity-50",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`h-11 shrink-0 whitespace-nowrap rounded-xl px-4 text-sm font-bold transition-colors ${variantClass[variant]} ${className}`}
      {...props}
    />
  );
}
