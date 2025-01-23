import React, { ChangeEvent, FormEvent, useState } from "react";
import { v4 } from "uuid";
import Header from "../(componenets)/Header";

type ProductFormData = {
  name: string;
  price: number;
  stockQuantity: number;
};

type CreateProductModelProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (formData: ProductFormData) => void;
};

function createProductModel({
  isOpen,
  onClose,
  onCreate,
}: CreateProductModelProps) {
  const [formData, setFromData] = useState({
    productId: v4(),
    name: "",
    price: 0,
    stockQuantity: 0,
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFromData({
      ...formData,
      [name]:
        name === "price" || name === "stockQuantity"
          ? parseFloat(value)
          : value,
    });
  };
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onCreate(formData);
    onClose();
  };

  if (!isOpen) return null;

  const lableCssStyles = "block text-sm font-medium text-gray-700";
  const InputCssStyles =
    "block w-full mb-2 p-2 border-gray-500 border-2 rounded-md";

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-20">
      <div className="relative top-10 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <Header name="Tovar Qoshish" />
        <form onSubmit={handleSubmit} className="mt-5">
          {/* Product Name */}
          <label htmlFor="productName" className={lableCssStyles}>
            Towar Nomi
          </label>
          <input
            type="text"
            name="name"
            placeholder="Nomi"
            onChange={handleChange}
            value={formData.name}
            className={InputCssStyles}
            required
          />
          {/* Price */}
          <label htmlFor="productPrice" className={lableCssStyles}>
            Narxi
          </label>
          <input
            type="number"
            name="price"
            placeholder="Narxi"
            onChange={handleChange}
            value={formData.price}
            className={InputCssStyles}
            required
          />
          {/* Stock Quantity */}
          <label htmlFor="stockQuantity" className={lableCssStyles}>
            Miqtori
          </label>
          <input
            type="number"
            name="stockQuantity"
            placeholder="Miqtor"
            onChange={handleChange}
            value={formData.stockQuantity}
            className={InputCssStyles}
            required
          />
          <button
            type="submit"
            className="mt-2 px-4 py-2 text-white rounded bg-blue-500 hover:bg-blue-700"
          >
            Yaratish
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-white rounded bg-gray-500 hover:bg-gray-700 ml-2"
          >
            Bekor qilish
          </button>
        </form>
      </div>
    </div>
  );
}

export default createProductModel;
