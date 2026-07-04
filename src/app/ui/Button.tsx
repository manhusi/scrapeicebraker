import type { ButtonHTMLAttributes } from "react";

// Az EGYETLEN gomb-komponens (UX.md v3). Variánsok a globals.css-ből.
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "warn"
  | "purple"
  | "ghost";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export default function Button({ variant = "secondary", ...rest }: Props) {
  const cls = variant === "secondary" ? "btn" : `btn btn-${variant}`;
  return <button {...rest} className={cls} />;
}
