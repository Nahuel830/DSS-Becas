import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

/** Botón del sistema (usa .btn del CSS global). */
export function Button({ variant = "primary", className, ...rest }: ButtonProps) {
  return <button className={clsx("btn", variant === "primary" ? "btn-primary" : "btn-secondary", className)} {...rest} />;
}
