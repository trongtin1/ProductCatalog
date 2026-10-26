import type React from "react";

export type FormValues = Record<string, unknown>;

export type FormErrors = Record<string, string>;

export type RuleType = "string" | "number" | "integer" | "url";

export interface Rule {
  required?: boolean;
  type?: RuleType;
  min?: number;
  max?: number;
  whitespace?: boolean;
  message?: string;

  validator?: (
    value: unknown,
    values: FormValues,
  ) => boolean | string | void | Promise<boolean | string | void>;
}

export interface FormProps {
  initialValues?: FormValues;
  onFinish: (values: FormValues) => void | Promise<void>;
  onFinishFailed?: (errors: FormErrors) => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export interface FormItemProps {
  name: string;
  label?: string;
  rules?: Rule[];
  children: React.ReactElement;
}