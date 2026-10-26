import React, { useEffect } from "react";
import { useFormContext } from "./FormContext";
import type { FormItemProps } from "./Form.types";

export const FormItem: React.FC<FormItemProps> = ({
  name,
  label,
  rules = [],
  children,
}) => {
  const { values, errors, setFieldValue, registerRules } = useFormContext();

  useEffect(() => {
    registerRules(name, rules);
  }, [name, rules, registerRules]);

  const child = React.Children.only(children);
  const error = errors[name];

  const childProps = {
    value: values[name] ?? "",
    error,
    "aria-invalid": Boolean(error),
    onChange: (
      eventOrValue:
        | React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
          >
        | string
        | number,
    ) => {
      const value =
        typeof eventOrValue === "object" &&
        eventOrValue !== null &&
        "target" in eventOrValue
          ? (eventOrValue as React.ChangeEvent<HTMLInputElement>).target.value
          : eventOrValue;

      setFieldValue(name, value);
    },
  };

  return (
    <div
      className="form-item"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        marginBottom: 14,
      }}
    >
      {label && (
        <label className="form-item-label">
          {label}
          {rules.some((rule) => rule.required) && (
            <span aria-hidden="true" style={{ color: "red", marginLeft: 4 }}>
              *
            </span>
          )}
        </label>
      )}

      {React.cloneElement(child, childProps)}

      {error && (
        <div
          className="form-item-error"
          role="alert"
          style={{ color: "#dc2626", fontSize: 12 }}
        >
          {error}
        </div>
      )}
    </div>
  );
};
