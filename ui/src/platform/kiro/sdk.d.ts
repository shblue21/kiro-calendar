declare module "@kirocrew/app-sdk/ui" {
  import type { ComponentType, ButtonHTMLAttributes, ReactNode } from "react";
  export const PageHeader: ComponentType<{
    title: ReactNode;
    subtitle?: string;
    actions?: ReactNode;
  }>;
  export const Btn: ComponentType<
    ButtonHTMLAttributes<HTMLButtonElement> & {
      primary?: boolean;
      danger?: boolean;
    }
  >;
  export const Badge: ComponentType<{
    variant: "ok" | "err" | "warn" | "aim" | "muted";
    children: ReactNode;
  }>;
}
