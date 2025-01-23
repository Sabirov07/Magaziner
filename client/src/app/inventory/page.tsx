"use client";

import { useGetProductsQuery } from "@/state/api";
import Header from '@/app/(componenets)/Header'
import { DataGrid, GridColDef, GridEventListener } from "@mui/x-data-grid";
import { useState } from "react";
import CreateProductModel from '../products/logModel';

const columns: GridColDef[] = [
  { field: "productId", headerName: "ID", width: 90 },
  { field: "name", headerName: "Towarni Nomi", width: 200 },
  {
    field: "price",
    headerName: "Bahosi",
    width: 110,
    type: "number",
    valueGetter: (value, row) => `$${row.price}`,
  },
//   {
//     field: "rating",
//     headerName: "Rating",
//     width: 110,
//     type: "number",
//     valueGetter: (value, row) => (row.rating ? row.rating : "N/A"),
//   },
  {
    field: "stockQuantity",
    headerName: "Miqtor",
    width: 150,
    type: "number",
  },
];

const Inventory = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productName, setProductName] = useState('')
  const { data: products, isError, isLoading } = useGetProductsQuery();

  const handleEvent: GridEventListener<'cellDoubleClick'> = (
    params, // GridRowParams
  ) => {
    // alert(`Tovar "${params.row.name}" clicked`)
    setProductName(params.row.name)
    setIsModalOpen(true)
  };

  const handleProductCreate = async () => {
    alert('hello')
 }


  if (isLoading) {
    return <div className="py-4">Loading...</div>;
  }

  if (isError || !products) {
    return (
      <div className="text-center text-red-500 py-4">
        Tovarlarni olomadi
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Header name="Magazyn" />
      <DataGrid
        rows={products}
        columns={columns}
        getRowId={(row) => row.productId}
        checkboxSelection
        className="bg-white shadow rounded-lg border border-gray-200 mt-5 !text-gray-700"
        onCellDoubleClick={handleEvent}
      />
      {/* <CreateProductModel productName={productName} isOpen={isModalOpen} onClose={() => {setIsModalOpen(false)}} onCreate={handleProductCreate} /> */}
    </div>
    
  );
};

export default Inventory;