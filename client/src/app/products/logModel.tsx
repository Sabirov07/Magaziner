import React, { ChangeEvent, FormEvent, useState } from "react";
import Header from "../(componenets)/Header";

type logData = {
  productId: string;
  type: string;
  value: number;
};

type logProductModelProps = {
  productName: string;
  productId: string;
  lable: string;
  type: string;
  isOpen: boolean;
  onClose: () => void;
  onLog: (formData: logData) => void;
};

function logProductModel({
  productName,
  productId,
  lable,
  type,
  isOpen,
  onClose,
  onLog,
}: logProductModelProps) {
  const [formData, setFromData] = useState<logData>({
    productId,
    type,
    value: 0,
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const { name, value } = e.target;
    setFromData((prev) => ({
      ...prev,
      [name]: name === "value" ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      productId: productId,
      type: type,
    };
    
    try {
      await onLog(submitData);
      setFromData({
        productId: productId,
        type: type,
        value: 0,
      });
      onClose();
    } catch (error: any) {
      setError(error.message || 'Xatolik!');
    }
  };

  if (!isOpen) return null;

  const lableCssStyles = "block text-sm font-medium text-gray-700 mb-2";
  const InputCssStyles =
    "block w-full mb-2 p-2 border-gray-500 border-2 rounded-md";

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-20">
      <div className="relative top-10 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <Header name={productName} />
        {error && (
          <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="mt-5">
          {/* Product Name */}
          {/* <label htmlFor="productName" className={lableCssStyles}>
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
          /> */}
          {/* Price */}
          <label htmlFor="value" className={lableCssStyles}>
            {lable}
          </label>
          <input
            type="number"
            name="value"
            placeholder="Miqtor"
            onChange={handleChange}
            value={formData.value}
            className={InputCssStyles}
            required
          />
          {/* Stock Quantity */}
          {/* <label htmlFor="stockQuantity" className={lableCssStyles}>
            Sotildi
          </label>
          <input
            type="number"
            name="outcome"
            placeholder="Miqtor"
            onChange={handleChange}
            value={formData.outcome}
            className={InputCssStyles}
            required
          /> */}
          <button
            type="submit"
            className="mt-2 px-4 py-2 text-white rounded bg-blue-500 hover:bg-blue-700"
          >
            Ozgartirish
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

export default logProductModel;
