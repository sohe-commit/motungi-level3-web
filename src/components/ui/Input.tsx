"use client";

import { InputHTMLAttributes } from "react";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-11 w-full rounded-xl border border-neutral-weak3 px-4 text-sm text-neutral outline-none placeholder:text-neutral-medium focus:border-primary ${props.className ?? ""}`}
    />
  );
}
