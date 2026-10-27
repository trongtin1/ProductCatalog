import React, { useState } from "react";

import type { ProductFormModalProps } from "./ProductFormModal.types";

import {
  Modal,
  Button,
  Input,
  Select,
  Form,
  useToast,
  ImageUploader,
} from "../../../components/common";

import { useCategories } from "../../../hooks/useCategories";
import { useCreateProduct, useUpdateProduct } from "../../../hooks/useProducts";
import type {
  Product,
  ProductCreate,
  ProductUpdate,
} from "../../../models/product";

import type { FormValues } from "../../../components/common/Form/Form.types";

interface ProductFormContentProps {
  product?: Product | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const ProductFormContent: React.FC<ProductFormContentProps> = ({
  product,
  onClose,
  onSuccess,
}) => {
  const isEdit = Boolean(product);

  const { data: categories = [] } = useCategories();
  const toast = useToast();

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // imageUrl state – separate from the form to avoid HTMLInputElement type mismatch
  const [imageUrl, setImageUrl] = useState<string>(product?.image_url ?? "");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const initialValues: FormValues = {
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product?.price !== undefined ? String(product.price) : "",
    stock: product?.stock !== undefined ? String(product.stock) : "0",
    category_id: product?.category_id ? String(product.category_id) : "",
  };

  const categoryOptions = categories.map((category) => ({
    value: String(category.id),
    label: category.name,
  }));

  const handleUpload = async (file: File) => {
    setUploadError(null);
    setPendingFile(file);
    setImageUrl(URL.createObjectURL(file));
  };

  const handleFinish = async (values: FormValues) => {
    const name = String(values.name ?? "").trim();
    const description = String(values.description ?? "").trim();
    const price = Number(values.price);
    const stock = Number(values.stock);
    const categoryId = Number(values.category_id);

    try {
      if (isEdit && product) {
        const payload: ProductUpdate = {
          name,
          description: description || null,
          price,
          stock,
          category_id: categoryId,
        };

        await updateMutation.mutateAsync({
          id: product.id,
          data: payload,
          file: pendingFile,
        });
        toast.success(`Cập nhật sản phẩm "${payload.name}" thành công!`);
      } else {
        // Step 1: create product (image_url left null for now)
        const payload: ProductCreate = {
          name,
          description: description || null,
          price,
          stock,
          category_id: categoryId,
        };

        await createMutation.mutateAsync({ data: payload, file: pendingFile });

        toast.success(`Thêm mới sản phẩm "${payload.name}" thành công!`);
      }

      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu sản phẩm";
      toast.error(errorMessage);
    }
  };

  return (
    <Form
      initialValues={initialValues}
      onFinish={handleFinish}
      style={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      <Form.Item
        name="name"
        label="Tên sản phẩm"
        rules={[
          {
            required: true,
            whitespace: true,
            message: "Tên sản phẩm không được để trống",
          },
        ]}
      >
        <Input
          placeholder="Ví dụ: Bàn phím cơ không dây"
          disabled={isLoading}
        />
      </Form.Item>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Form.Item
          name="category_id"
          label="Danh mục"
          rules={[
            { required: true, message: "Vui lòng chọn danh mục" },
            { type: "number", min: 1, message: "Vui lòng chọn danh mục hợp lệ" },
          ]}
        >
          <Select
            placeholder="-- Chọn danh mục --"
            options={categoryOptions}
            disabled={isLoading}
          />
        </Form.Item>

        <Form.Item
          name="stock"
          label="Số lượng tồn kho"
          rules={[
            { required: true, message: "Vui lòng nhập số lượng tồn kho" },
            { type: "integer", min: 0, message: "Số lượng tồn kho phải là số nguyên ≥ 0" },
          ]}
        >
          <Input
            type="number"
            min={0}
            step={1}
            placeholder="0"
            disabled={isLoading}
          />
        </Form.Item>
      </div>

      <Form.Item
        name="price"
        label="Giá bán (VNĐ)"
        rules={[
          { required: true, message: "Vui lòng nhập giá sản phẩm" },
          { type: "number", min: 0.01, message: "Giá sản phẩm phải lớn hơn 0" },
        ]}
      >
        <Input
          type="number"
          min={1}
          step={1000}
          placeholder="Ví dụ: 250000"
          disabled={isLoading}
        />
      </Form.Item>

      {/* Image upload – managed outside the Form to avoid event type conflicts */}
      <div>
        <label
          style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: 500,
            marginBottom: 6,
            color: "var(--color-text)",
          }}
        >
          Hình ảnh sản phẩm
        </label>
        <ImageUploader
          value={imageUrl}
          onChange={setImageUrl}
          onUpload={handleUpload}
          disabled={isLoading}
          uploading={uploading}
          error={uploadError}
        />
      </div>

      <Form.Item name="description" label="Mô tả sản phẩm">
        <textarea
          className="custom-input"
          placeholder="Mô tả chi tiết tính năng sản phẩm..."
          disabled={isLoading}
          style={{
            minHeight: 76,
            padding: "8px 12px",
            resize: "vertical",
            font: "inherit",
          }}
        />
      </Form.Item>

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
          disabled={isLoading || uploading}
          type="button"
        >
          Hủy
        </Button>

        <Button
          variant="primary"
          type="submit"
          isLoading={isLoading || uploading}
        >
          {isEdit ? "Lưu thay đổi" : "Thêm mới"}
        </Button>
      </div>
    </Form>
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
