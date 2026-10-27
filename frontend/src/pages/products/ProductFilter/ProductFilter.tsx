import React, { useState } from "react";
import type { ProductFilterProps } from "./ProductFilter.types";
import { SearchInput } from "../../../components/common/SearchInput";
import { Select } from "../../../components/common/Select";
import { Input } from "../../../components/common/Input";
import { Button } from "../../../components/common/Button";
import { useCategories } from "../../../hooks/useCategories";
import "./ProductFilter.css";

export const ProductFilter: React.FC<ProductFilterProps> = ({
  searchTerm,
  categoryId,
  minPrice,
  maxPrice,
  onSearchChange,
  onCategoryChange,
  onPriceRangeChange,
  onReset,
  onAddNew,
  className = "",
}) => {
  const { data: categories = [], isLoading: isLoadingCategories } =
    useCategories();

  const [localMin, setLocalMin] = useState<string>(
    minPrice !== undefined ? String(minPrice) : "",
  );
  const [localMax, setLocalMax] = useState<string>(
    maxPrice !== undefined ? String(maxPrice) : "",
  );

  const [prevMin, setPrevMin] = useState(minPrice);
  const [prevMax, setPrevMax] = useState(maxPrice);

  // Adjust state during render when props change
  if (minPrice !== prevMin) {
    setPrevMin(minPrice);
    setLocalMin(minPrice !== undefined ? String(minPrice) : "");
  }

  if (maxPrice !== prevMax) {
    setPrevMax(maxPrice);
    setLocalMax(maxPrice !== undefined ? String(maxPrice) : "");
  }

  const handleApplyPrice = () => {
    const minVal =
      localMin !== "" && !isNaN(Number(localMin))
        ? Number(localMin)
        : undefined;
    const maxVal =
      localMax !== "" && !isNaN(Number(localMax))
        ? Number(localMax)
        : undefined;
    if (minVal === minPrice && maxVal === maxPrice) {
      return;
    }
    onPriceRangeChange(minVal, maxVal);
  };

  const handlePriceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleApplyPrice();
    }
  };

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const hasActiveFilters = Boolean(
    searchTerm ||
    categoryId ||
    minPrice !== undefined ||
    maxPrice !== undefined,
  );

  return (
    <div className={`product-filter-bar ${className}`}>
      <div className="product-filter-top">
        <div className="product-filter-search">
          <SearchInput
            value={searchTerm}
            placeholder="Tìm theo tên sản phẩm..."
            onChangeText={onSearchChange}
          />
        </div>
        <Button variant="primary" onClick={onAddNew} icon="+">
          Thêm sản phẩm mới
        </Button>
      </div>

      <div className="product-filter-bottom">
        <div className="product-filter-item">
          <Select
            placeholder="Tất cả danh mục"
            value={categoryId || ""}
            disabled={isLoadingCategories}
            options={categoryOptions}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : undefined;
              onCategoryChange(val);
            }}
          />
        </div>

        <div className="product-filter-price-group">
          <div className="product-filter-price-input">
            <Input
              type="number"
              placeholder="Giá từ..."
              value={localMin}
              onChange={(e) => setLocalMin(e.target.value)}
              onKeyDown={handlePriceKeyDown}
              onBlur={handleApplyPrice}
            />
          </div>
          <span className="product-filter-separator">-</span>
          <div className="product-filter-price-input">
            <Input
              type="number"
              placeholder="Giá đến..."
              value={localMax}
              onChange={(e) => setLocalMax(e.target.value)}
              onKeyDown={handlePriceKeyDown}
              onBlur={handleApplyPrice}
            />
          </div>
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            Đặt lại lọc
          </Button>
        )}
      </div>
    </div>
  );
};
