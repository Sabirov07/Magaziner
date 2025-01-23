"use client";

import { useGetProductByIdQuery } from "@/state/api";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ProductPage() {
  const params = useParams();
  const productId = params.productId as string;
  
  const { data: product, isLoading, isError } = useGetProductByIdQuery(productId);

  if (isLoading) return <div>Yuklanmoqda...</div>;
  if (isError) return <div>Mahsulot ma'lumotlarini yuklashda xatolik</div>;
  if (!product) return <div>Mahsulot topilmadi</div>;

  return (
    <div className="container mx-auto p-4">
      {/* Back Button */}
      <Link 
        href="/products" 
        className="flex items-center text-blue-500 hover:text-blue-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Mahsulotlarga qaytish
      </Link>

      {/* Product Details */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">{product.name}</h1>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Narxi:</p>
            <p className="font-semibold">{product.price.toFixed(2)}zł</p>
          </div>
          <div>
            <p className="text-gray-600">Ombordagi soni:</p>
            <p className="font-semibold">{product.stockQuantity}</p>
          </div>
        </div>
      </div>

      {/* Product Logs Table */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">O'zgarishlar tarixi</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sana
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Turi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Miqdori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Foydalanuvchi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {product.logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      log.type === 'income' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {log.type === 'income' ? 'Keldi' : 'Sotildi'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.value}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.user}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}