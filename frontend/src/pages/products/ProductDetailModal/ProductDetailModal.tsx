import React from "react";
import type { ProductDetailModalProps } from "./ProductDetailModal.types";
import { Modal } from "../../../components/common/Modal";
import { Button } from "../../../components/common/Button";
import { Badge } from "../../../components/common/Badge";
import "./ProductDetailModal.css";

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  product,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!product) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString("vi-VN");
    } catch {
      return dateStr;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết sản phẩm"
      width={640}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
          {onDelete && (
            <Button
              variant="danger"
              onClick={() => {
                onClose();
                onDelete(product);
              }}
            >
              Xóa
            </Button>
          )}
          {onEdit && (
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onEdit(product);
              }}
            >
              Chỉnh sửa
            </Button>
          )}
        </>
      }
    >
      <div className="product-detail-layout">
        <div className="product-detail-image-wrapper">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="product-detail-image"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="product-detail-image-fallback">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <span>Không có ảnh</span>
            </div>
          )}
        </div>

        <div className="product-detail-content">
          <div className="product-detail-name">{product.name}</div>
          <div className="product-detail-price">
            {formatPrice(product.price)}
          </div>

          <div className="product-detail-meta">
            <Badge variant="primary">
              {product.category
                ? product.category.name
                : `Danh mục #${product.category_id}`}
            </Badge>

            {product.stock > 10 ? (
              <Badge variant="success">Còn hàng ({product.stock})</Badge>
            ) : product.stock > 0 ? (
              <Badge variant="warning">Sắp hết hàng ({product.stock})</Badge>
            ) : (
              <Badge variant="danger">Hết hàng (0)</Badge>
            )}
          </div>

          <div className="product-detail-desc">
            {product.description || "Chưa có mô tả cho sản phẩm này."}
          </div>

          <div className="product-detail-timestamps">
            <div>
              <strong>Mã sản phẩm (ID):</strong> #{product.id}
            </div>
            <div>
              <strong>Ngày tạo:</strong> {formatDate(product.created_at)}
            </div>
            <div>
              <strong>Cập nhật lần cuối:</strong>{" "}
              {formatDate(product.updated_at)}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
