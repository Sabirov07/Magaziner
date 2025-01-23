"use client";

import React, { useState } from "react";
import Header from "../(componenets)/Header";
import { useCreateProductMutation, useGetProductsQuery, useLogProductMutation } from "@/state/api";
import { PlusIcon, SearchIcon } from "lucide-react";
import CreateProductModel from "./createProductModel";
import LogModel from "./logModel";
import Toast from "../(componenets)/Toast";
import Link from 'next/link';

type ProductFormData = {
  name: string;
  price: number;
  stockQuantity: number;
};

type logData = {
  productId: string;
  type: string;
  value: number;
};

function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [productName, setProductName] = useState("");
  const [productId, setProductId] = useState('')
  const [lable, setLable] = useState('')
  const [type, setType] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [recentlyModifiedId, setRecentlyModifiedId] = useState<string | null>(null);

  const {
    data: products,
    isLoading,
    isError,
  } = useGetProductsQuery(searchTerm);

  const [createProduct] = useCreateProductMutation();
  const handleProductCreate = async (formData: ProductFormData) => {
    await createProduct(formData);
  };

  const [logProduct] = useLogProductMutation();
  const handleProductLog = async (logData: logData) => {
    try {
      await logProduct({
        productId: logData.productId,
        type: logData.type,
        value: logData.value,
      }).unwrap();
      
      setToast({ message: 'Ozgarish muvaffaqiyatli saqlandi!', type: 'success' });
      
      setRecentlyModifiedId(logData.productId);
      
      setTimeout(() => {
        setRecentlyModifiedId(null);
      }, 1000);
      
    } catch (error: any) {
      const errorMessage = error.data?.message || 'An error occurred';
      setToast({ message: errorMessage, type: 'error' });
      throw new Error(errorMessage);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>, productName: string, productId: string, type: string) => {
    const target = e.target as HTMLElement;
    setLable(`${target.textContent}`);
    setType(type);
    setProductName(`${productName}`);
    setProductId(productId);
    console.log('Clicked Product:', { productName, productId, type });
    setIsLogModalOpen(true);
  };

  if (isLoading) {
    return <div className="py-4">Loading...</div>;
  }

  if (isError || !products) {
    return (
      <div className="text-center text-red-500 py-4">
        Towarlarni olip bolmadi!
      </div>
    );
  }

  return (
    <div className="mx-auto pb-5 w-full">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {/* SEARCH BAR */}
      <div className="mb-6 mt-4">
        <div className="flex items-center border-2 border-gray-200 rounded">
          <SearchIcon className="h-4 w-4 text-gray-900 m-4" />
          <input
            className="w-full py-2 px-4 rounded bg-white"
            placeholder="Towarni Izlang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* HEADER BAR */}
      <div className="flex justify-between items-center mb-6">
        <Header name="Tovarlar" />
        <button
          className="flex items-center bg-blue-500 hover:bg-blue-700 text-gray-200 font-bold py-2 px-4 rounded"
          onClick={() => setIsModalOpen(true)}
        >
          <PlusIcon className="h-5 w-5 mr-2 !text-gray-200" /> Towar Qoshish
        </button>
      </div>

      {/* BODY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 justify-between gap-10">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          products.map((product) => (
            <div
              key={product.productId}
              className={`border shadow rounded-md p-4 max-w-full w-full mx-auto transition-all duration-500 ease-in-out
                ${recentlyModifiedId === product.productId 
                  ? 'border-green-500 transform scale-105 animate-pulse shadow-lg ring-2 ring-green-500' 
                  : 'hover:shadow-lg'
                }`}
            >
              <div className="flex flex-col items-center">
                LOGO
                <Link href={`/products/${product.productId}`}>
                  <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-gray-800">{product.price.toFixed(2)}zł</p>
                <div className="text-sm text-gray-600 mt-1">
                  Soni: {product.stockQuantity}
                </div>
              </div>
              <div className="flex justify-around">
              <button
                type="button"
                onClick={(e) => handleClick(e, product.name, product.productId, 'income')}
                className="mt-2 px-4 py-2 text-white rounded bg-green-600 hover:bg-blue-700"
              >
                Keldi
              </button>
              <button
                type="button"
                onClick={(e) => handleClick(e, product.name, product.productId, 'outcome')}
                className="mt-2 px-4 py-2 text-white rounded bg-red-500 hover:bg-gray-700 ml-2"
              >
                Sotildi
              </button>
              </div>
            </div>
          ))
        )}
        <CreateProductModel
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
          }}
          onCreate={handleProductCreate}
        />
        <LogModel
          productName={productName}
          productId={productId}
          lable={lable}
          type={type}
          isOpen={isLogModalOpen}
          onClose={() => {
            setIsLogModalOpen(false);
          }}
          onLog={handleProductLog}
        />
      </div>
    </div>
  );
}

export default Products;
