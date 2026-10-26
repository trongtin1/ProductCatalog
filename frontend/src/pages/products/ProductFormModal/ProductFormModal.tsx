import React, { useState } from "react";
import type {
  ProductFormModalProps,
  ProductFormErrors,
} from "./ProductFormModal.types";
import {
  Modal,
  Button,
  Input,
  Select,
  useToast,
} from "../../../components/common";
import { useCategories } from "../../../hooks/useCategories";
import { useCreateProduct, useUpdateProduct } from "../../../hooks/useProducts";
import type {
  Product,
  ProductCreate,
  ProductUpdate,
} from "../../../models/product";

interface FormContentProps {
  product?: Product | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const ProductFormContent: React.FC<FormContentProps> = ({
  product,
  onClose,
  onSuccess,
}) => {
  const isEdit = Boolean(product);
  const { data: categories = [] } = useCategories();
  const toast = useToast();

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price !== undefined ? String(product.price) : "",
    stock: product?.stock !== undefined ? String(product.stock) : "0",
    category_id: product?.category_id ? String(product.category_id) : "",
    image_url: product?.image_url || "",
  });

  const [errors, setErrors] = useState<ProductFormErrors>({});

  const validate = (): boolean => {
    const newErrors: ProductFormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tên sản phẩm không được để trống";
    }

    const priceNum = Number(formData.price);
    if (formData.price === "" || isNaN(priceNum) || priceNum <= 0) {
      newErrors.price = "Giá sản phẩm phải lớn hơn 0";
    }

    const stockNum = Number(formData.stock);
    if (
      formData.stock === "" ||
      isNaN(stockNum) ||
      stockNum < 0 ||
      !Number.isInteger(stockNum)
    ) {
      newErrors.stock = "Số lượng tồn kho phải là số nguyên ≥ 0";
    }

    const catIdNum = Number(formData.category_id);
    if (!formData.category_id || isNaN(catIdNum) || catIdNum <= 0) {
      newErrors.category_id = "Vui lòng chọn danh mục hợp lệ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const priceNum = Number(formData.price);
    const stockNum = Number(formData.stock);
    const categoryIdNum = Number(formData.category_id);

    try {
      if (isEdit && product) {
        const payload: ProductUpdate = {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          price: priceNum,
          stock: stockNum,
          category_id: categoryIdNum,
          image_url: formData.image_url.trim() || null,
        };
        await updateMutation.mutateAsync({ id: product.id, data: payload });
        toast.success(`Cập nhật sản phẩm "${payload.name}" thành công!`);
      } else {
        const payload: ProductCreate = {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          price: priceNum,
          stock: stockNum,
          category_id: categoryIdNum,
          image_url: formData.image_url.trim() || null,
        };
        await createMutation.mutateAsync(payload);
        toast.success(`Thêm mới sản phẩm "${payload.name}" thành công!`);
      }

      onClose();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu sản phẩm";
      toast.error(errMsg);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      <Input
        label="Tên sản phẩm *"
        placeholder="Ví dụ: Bàn phím cơ không dây"
        value={formData.name}
        error={errors.name}
        disabled={isLoading}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Select
          label="Danh mục *"
          placeholder="-- Chọn danh mục --"
          value={formData.category_id}
          options={categoryOptions}
          error={errors.category_id}
          disabled={isLoading}
          onChange={(e) =>
            setFormData({ ...formData, category_id: e.target.value })
          }
        />

        <Input
          label="Số lượng tồn kho *"
          type="number"
          min={0}
          step={1}
          placeholder="0"
          value={formData.stock}
          error={errors.stock}
          disabled={isLoading}
          onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
        />
      </div>

      <Input
        label="Giá bán (VNĐ) *"
        type="number"
        min={1}
        step={1000}
        placeholder="Ví dụ: 250000"
        value={formData.price}
        error={errors.price}
        disabled={isLoading}
        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
      />

      <Input
        label="URL Hình ảnh"
        placeholder="https://example.com/image.jpg"
        value={formData.image_url}
        error={errors.image_url}
        disabled={isLoading}
        onChange={(e) =>
          setFormData({ ...formData, image_url: e.target.value })
        }
      />

      <div className="custom-input-group">
        <label className="custom-input-label">Mô tả sản phẩm</label>
        <textarea
          className="custom-input"
          style={{ minHeight: 76, padding: "8px 12px", resize: "vertical" }}
          placeholder="Mô tả chi tiết tính năng sản phẩm..."
          value={formData.description}
          disabled={isLoading}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginTop: 12,
        }}
      >
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={isLoading}
          type="button"
        >
          Hủy
        </Button>
        <Button variant="primary" type="submit" isLoading={isLoading}>
          {isEdit ? "Lưu thay đổi" : "Thêm mới"}
        </Button>
      </div>
    </form>
  );
};

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  product,
  onClose,
  onSuccess,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
      width={560}
    >
      {isOpen && (
        <ProductFormContent
          key={product ? `edit-${product.id}` : "create"}
          product={product}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )}
    </Modal>
  );
};
