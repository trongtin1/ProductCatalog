import React, { useState } from "react";
import {
  Table,
  Button,
  Badge,
  Pagination,
  ConfirmModal,
  useToast,
} from "../../components";
import type { ColumnType } from "../../components/common/Table";
import {
  useProducts,
  useProductFilters,
  useDeleteProduct,
} from "../../hooks/useProducts";
import { useAuth } from "../../context";
import type { Product } from "../../models/product";
import { ProductFilter } from "./ProductFilter/ProductFilter";
import { ProductDetailModal } from "./ProductDetailModal/ProductDetailModal";
import { ProductFormModal } from "./ProductFormModal/ProductFormModal";

export const ProductListPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const filter = useProductFilters();
  const { data, isLoading, isError, error, refetch } = useProducts(
    filter.query,
  );
  const deleteMutation = useDeleteProduct();
  const toast = useToast();

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleOpenDetail = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  const handleOpenCreate = () => {
    setProductToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setProductToEdit(product);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (product: Product) => {
    setProductToDelete(product);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteMutation.mutateAsync(productToDelete.id);
      toast.success(`Đã xóa sản phẩm "${productToDelete.name}" thành công!`);
      setProductToDelete(null);
      // Return to the previous page if its last item was deleted.
      if (data && data.items.length === 1 && filter.page > 1) {
        filter.onPageChange(filter.page - 1);
      }
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : "Không thể xóa sản phẩm";
      toast.error(errMsg);
    }
  };

  const columns: ColumnType<Product>[] = [
    {
      key: "id",
      dataIndex: "id",
      title: "ID",
      width: 70,
      sortable: true,
      align: "center",
    },
    {
      key: "image_url",
      title: "Hình ảnh",
      width: 80,
      align: "center",
      render: (_, record) => (
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "var(--radius-sm)",
            overflow: "hidden",
            backgroundColor: "#f1f5f9",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid var(--color-border)",
          }}
        >
          {record.image_url ? (
            <img
              src={record.image_url}
              alt={record.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
              N/A
            </span>
          )}
        </div>
      ),
    },
    {
      key: "name",
      dataIndex: "name",
      title: "Tên sản phẩm",
      sortable: true,
      render: (_, record) => (
        <div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDetail(record);
            }}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: "var(--color-text-primary)",
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
              fontSize: 13,
            }}
            onMouseOver={(e) => {
              (e.target as HTMLElement).style.color = "var(--color-primary)";
            }}
            onMouseOut={(e) => {
              (e.target as HTMLElement).style.color =
                "var(--color-text-primary)";
            }}
          >
            {record.name}
          </button>
          {record.description && (
            <div
              style={{
                fontSize: 12,
                color: "var(--color-text-muted)",
                marginTop: 2,
                maxWidth: 320,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "category",
      title: "Danh mục",
      width: 150,
      render: (_, record) => (
        <Badge variant="primary">
          {record.category
            ? record.category.name
            : `Danh mục #${record.category_id}`}
        </Badge>
      ),
    },
    {
      key: "price",
      dataIndex: "price",
      title: "Giá bán",
      width: 140,
      sortable: true,
      align: "right",
      render: (_, record) => (
        <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
          {formatPrice(record.price)}
        </span>
      ),
    },
    {
      key: "stock",
      dataIndex: "stock",
      title: "Tồn kho",
      width: 120,
      sortable: true,
      align: "center",
      render: (_, record) => {
        if (record.stock > 10) {
          return <Badge variant="success">{record.stock} chiếc</Badge>;
        }
        if (record.stock > 0) {
          return <Badge variant="warning">{record.stock} chiếc</Badge>;
        }
        return <Badge variant="danger">Hết hàng</Badge>;
      },
    },
    {
      key: "actions",
      title: "Thao tác",
      width: isAdmin ? 160 : 80,
      align: "right",
      render: (_, record) => (
        <div style={{ display: "inline-flex", gap: 6 }}>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDetail(record);
            }}
            title="Xem chi tiết"
          >
            Xem
          </Button>
          {isAdmin && (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEdit(record);
                }}
                title="Chỉnh sửa"
              >
                Sửa
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDelete(record);
                }}
                title="Xóa sản phẩm"
              >
                Xóa
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Header info */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "var(--color-text-primary)",
            }}
          >
            Danh sách sản phẩm
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "var(--color-text-secondary)",
              marginTop: 2,
            }}
          >
            Quản lý thông tin, phân loại và giá bán sản phẩm trong hệ thống
          </p>
        </div>
      </div>

      <ProductFilter
        searchTerm={filter.search}
        categoryId={filter.categoryId}
        minPrice={filter.minPrice}
        maxPrice={filter.maxPrice}
        onSearchChange={filter.onSearchChange}
        onCategoryChange={(catId) => {
          filter.updateFilters({ category_id: catId, page: 1 });
        }}
        onPriceRangeChange={(min, max) => {
          filter.updateFilters({ min_price: min, max_price: max, page: 1 });
        }}
        onReset={filter.resetFilters}
        onAddNew={handleOpenCreate}
        canAdd={isAdmin}
      />

      {/* Error state */}
      {isError && (
        <div
          style={{
            padding: "14px 18px",
            backgroundColor: "var(--color-danger-bg)",
            border: "1px solid var(--color-danger-border)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-danger)",
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <strong>Lỗi tải dữ liệu:</strong>{" "}
            {(error as Error)?.message || "Không thể kết nối đến máy chủ API."}
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Thử lại
          </Button>
        </div>
      )}

      {/* Data Table */}
      <Table
        columns={columns}
        dataSource={data?.items || []}
        rowKey="id"
        loading={isLoading}
        sortColumn={filter.sortBy}
        isAscending={filter.order === 'asc'}
        onSortChange={filter.onSortChange}
        onClearSort={() => filter.onSortChange("id", true)}
        emptyText={
          filter.search ||
          filter.categoryId ||
          filter.minPrice ||
          filter.maxPrice
            ? "Không tìm thấy sản phẩm nào khớp với bộ lọc"
            : "Chưa có sản phẩm nào trong hệ thống"
        }
      />

      {/* Pagination */}
      {data && (
        <div style={{ marginTop: 16 }}>
          <Pagination
            page={filter.page}
            pageSize={filter.pageSize}
            total={data.total}
            totalPages={data.total_pages}
            onPageChange={filter.onPageChange}
            onPageSizeChange={filter.onPageSizeChange}
          />
        </div>
      )}

      {/* Modals */}
      <ProductDetailModal
        isOpen={isDetailOpen}
        product={selectedProduct}
        onClose={() => setIsDetailOpen(false)}
        onEdit={isAdmin ? (prod) => handleOpenEdit(prod) : undefined}
        onDelete={isAdmin ? (prod) => handleOpenDelete(prod) : undefined}
      />

      <ProductFormModal
        isOpen={isFormOpen}
        product={productToEdit}
        onClose={() => {
          setIsFormOpen(false);
          setProductToEdit(null);
        }}
        onSuccess={() => {
          setIsFormOpen(false);
          setProductToEdit(null);
        }}
      />

      <ConfirmModal
        isOpen={Boolean(productToDelete)}
        title="Xác nhận xóa sản phẩm"
        message={
          productToDelete ? (
            <>
              Bạn có chắc chắn muốn xóa sản phẩm{" "}
              <strong style={{ color: "var(--color-text-primary)" }}>
                "{productToDelete.name}"
              </strong>{" "}
              (ID: #{productToDelete.id}) không? Hành động này không thể hoàn
              tác.
            </>
          ) : (
            ""
          )
        }
        confirmText="Xác nhận xóa"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setProductToDelete(null)}
      />
    </div>
  );
};
