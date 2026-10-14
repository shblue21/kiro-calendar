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

// Subset of the host SDK used by the drafts experiment (see public app-sdk/index.ts).
declare module "@kirocrew/app-sdk" {
  export interface AppApi {
    get<T = unknown>(path: string, init?: RequestInit): Promise<T>;
    put<T = unknown>(path: string, body?: unknown, init?: RequestInit): Promise<T>;
    post<T = unknown>(path: string, body?: unknown, init?: RequestInit): Promise<T>;
  }
  export function useAppApi(): AppApi;
  export function activeLocale(): string;
  export function useLanguageGeneration(): number;
  export function useAppInfo(): { name: string; version: string };
  export function useChatLauncher(): {
    openChat: (opts?: { agent?: string; message?: string; slotKey?: string; autoSend?: boolean }) => void;
  };
}
