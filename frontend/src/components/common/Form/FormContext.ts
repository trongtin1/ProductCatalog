import { createContext, useContext } from "react";
import type { FormErrors, FormValues } from "./Form.types";

export interface FormContextValue {
  values: FormValues;
  errors: FormErrors;
  setFieldValue: (name: string, value: unknown) => void;
  registerRules: (name: string, rules: FormContextValue["rules"][string]) => void;
  rules: Record<string, import("./Form.types").Rule[]>;
}

export const FormContext = createContext<FormContextValue | null>(null);

export const useFormContext = (): FormContextValue => {
  const context = useContext(FormContext);

  if (!context) {
    throw new Error("Form.Item phải được sử dụng bên trong Form");
  }

  return context;
};