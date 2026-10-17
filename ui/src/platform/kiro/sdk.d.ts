declare module "@kirocrew/app-sdk/ui" {
  import type {
    ComponentType,
    ButtonHTMLAttributes,
    InputHTMLAttributes,
    ForwardRefExoticComponent,
    RefAttributes,
    ReactNode,
  } from "react";
  export const Input: ForwardRefExoticComponent<
    InputHTMLAttributes<HTMLInputElement> & RefAttributes<HTMLInputElement>
  >;
  export const Toggle: ComponentType<{
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    label: string;
    describedBy?: string;
  }>;
  export function SegmentedControl<K extends string>(props: {
    segments: readonly {
      key: K;
      label: string;
      count?: number;
      disabled?: boolean;
      icon?: ReactNode;
    }[];
    value: K;
    onChange: (value: K) => void;
    layoutId: string;
    ariaLabel: string;
    collapse?: boolean;
    wrap?: boolean | "hug";
  }): ReactNode;
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

// Public host SDK subset used by Calendar; runtime implementations remain host-owned.
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
    openChat: (opts?: {
      agent?: string;
      message?: string;
      slotKey?: string;
      autoSend?: boolean;
    }) => void;
  };
}
