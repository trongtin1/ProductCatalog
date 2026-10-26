import React, { useState } from "react";
import { FormContext } from "./FormContext";

import type { FormErrors, FormProps, FormValues, Rule } from "./Form.types";
import { FormItem } from "./FormItem";

const validateField = async (
  value: unknown,
  rules: Rule[],
  values: FormValues,
): Promise<string | undefined> => {
  const isEmpty =
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.length === 0);

  for (const rule of rules) {
    if (rule.required && isEmpty) {
      return rule.message ?? "Trường này là bắt buộc";
    }

    if (rule.whitespace && typeof value === "string" && value.trim() === "") {
      return rule.message ?? "Không được chỉ nhập khoảng trắng";
    }

    // Không kiểm tra các rule khác khi giá trị không bắt buộc và đang trống.
    if (isEmpty) {
      continue;
    }

    if (rule.type === "string" && typeof value !== "string") {
      return rule.message ?? "Giá trị phải là chuỗi";
    }

    if (rule.type === "url") {
      if (typeof value !== "string") {
        return rule.message ?? "URL không hợp lệ";
      }

      try {
        const url = new URL(value);

        if (url.protocol !== "http:" && url.protocol !== "https:") {
          return rule.message ?? "URL phải bắt đầu bằng http:// hoặc https://";
        }
      } catch {
        return rule.message ?? "URL không hợp lệ";
      }
    }

    if (rule.type === "number" || rule.type === "integer") {
      const num =
        typeof value === "number"
          ? value
          : typeof value === "string" && value.trim() !== ""
            ? Number(value)
            : NaN;

      if (!Number.isFinite(num)) {
        return rule.message ?? "Vui lòng nhập một số hợp lệ";
      }

      if (rule.type === "integer" && !Number.isInteger(num)) {
        return rule.message ?? "Giá trị phải là số nguyên";
      }

      if (rule.min !== undefined && num < rule.min) {
        return rule.message ?? `Giá trị phải lớn hơn hoặc bằng ${rule.min}`;
      }

      if (rule.max !== undefined && num > rule.max) {
        return rule.message ?? `Giá trị phải nhỏ hơn hoặc bằng ${rule.max}`;
      }
    }

    if (rule.validator) {
      try {
        const result = await rule.validator(value, values);

        if (result === false) {
          return rule.message ?? "Giá trị không hợp lệ";
        }

        if (typeof result === "string") {
          return result;
        }
      } catch (error) {
        return error instanceof Error
          ? error.message
          : (rule.message ?? "Giá trị không hợp lệ");
      }
    }
  }

  return undefined;
};

const FormRoot: React.FC<FormProps> = ({
  initialValues = {},
  onFinish,
  onFinishFailed,
  children,
  className,
  style,
}) => {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [rules, setRules] = useState<Record<string, Rule[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setFieldValue = (name: string, value: unknown) => {
    setValues((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => {
      if (!(name in previous)) {
        return previous;
      }

      const next = { ...previous };
      delete next[name];
      return next;
    });
  };

  const registerRules = (name: string, fieldRules: Rule[]) => {
    setRules((previous) => {
      if (previous[name] === fieldRules) {
        return previous;
      }

      return {
        ...previous,
        [name]: fieldRules,
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const newErrors: FormErrors = {};

      for (const [name, fieldRules] of Object.entries(rules)) {
        const error = await validateField(values[name], fieldRules, values);

        if (error) {
          newErrors[name] = error;
        }
      }

      setErrors(newErrors);

      if (Object.keys(newErrors).length > 0) {
        onFinishFailed?.(newErrors);
        return;
      }

      await onFinish(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormContext.Provider
      value={{
        values,
        errors,
        rules,
        setFieldValue,
        registerRules,
      }}
    >
      <form
        onSubmit={handleSubmit}
        className={className}
        style={style}
        noValidate
        aria-busy={isSubmitting}
      >
        {children}
      </form>
    </FormContext.Provider>
  );
};

export const Form = Object.assign(FormRoot, {
  Item: FormItem,
});
