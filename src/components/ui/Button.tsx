import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "quiet" | "alert";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary: "btn-primary",
  quiet: "btn-quiet",
  alert: "btn-alert",
};
const SIZE: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-12 px-4 text-lg",
  lg: "h-16 px-5 text-2xl",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

/** Sticker-style button. Always pass `type` through; defaults to "button". */
export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`btn ${VARIANT[variant]} ${SIZE[size]} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon ${className}`}
      {...rest}
    />
  );
}
