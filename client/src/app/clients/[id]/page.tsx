"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  useGetClientDeliveriesQuery,
  useGetClientsQuery,
  useUpdateClientMutation,
  useDeleteClientMutation,
  useGetClientTotalDebtsQuery,
  useGetDriversQuery,
} from "@/state/api";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import EditClientModal from "../EditClientModal";
import DeliverySidebar from './DeliverySidebar';

export default function ClientPage() {
  const router = useRouter();
  const { id } = useParams();
  const clientId = typeof id === "string" ? id : "";
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeliverySidebarOpen, setIsDeliverySidebarOpen] = useState(false);

  const { data: clients } = useGetClientsQuery();
  const { data: deliveries, isLoading: isDeliveriesLoading, error: deliveriesError } = useGetClientDeliveriesQuery(id as string);
  const [updateClient] = useUpdateClientMutation();
  const [deleteClient] = useDeleteClientMutation();
  const { data: totalDebts } = useGetClientTotalDebtsQuery(clientId);
  const { data: drivers } = useGetDriversQuery();

  const client = clients?.find((c) => c.id === clientId);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this client?")) {
      try {
        await deleteClient(clientId).unwrap();
        router.push("/clients");
      } catch (error) {
        console.error("Failed to delete client:", error);
      }
    }
  };

  const handleUpdate = async (id: string, data: { name: string; address?: string; phone?: string }) => {
    try {
      await updateClient({ id, data }).unwrap();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Failed to update client:", error);
    }
  };

  useEffect(() => {
    // Add a small delay to ensure the page has loaded
    const timeoutId = setTimeout(() => {
      if (window.location.hash) {
        const element = document.querySelector(window.location.hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          element.classList.add('bg-gray-200');
          setTimeout(() => {
            element.classList.remove('bg-gray-200');
          }, 2000);
        }
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [deliveries]); // Run when deliveries data is loaded

  useEffect(() => {
    console.log('Deliveries data:', deliveries);
    console.log('Loading:', isDeliveriesLoading);
    console.log('Error:', deliveriesError);
  }, [deliveries, isDeliveriesLoading, deliveriesError]);

  if (!client) {
    return <div>Loading...</div>;
  }

  return (
    <div id="main-content" className="transition-all duration-300">
      {/* Client Info Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <div className="text-sm text-gray-600">
              {client.address && <p>Adres: {client.address}</p>}
              {client.phone && <p>Telefon: {client.phone}</p>}
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <div className="text-right">
              <div className="flex flex-col items-end mb-4">
                <p className="text-gray-600 text-sm">Aktywne długi</p>
                <button
                  onClick={() => router.push(`/clients/${clientId}/debts`)}
                  className="text-xl font-semibold text-red-600 hover:text-red-700"
                >
                  {(totalDebts?.totalDebt || 0).toFixed(2)} zł
                </button>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Edytuj
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Usuń
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Debts Section */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Historia Dostaw</h2>
          <button
            onClick={() => setIsDeliverySidebarOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Dodaj Dostawę
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Kierowca
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tovar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Gotówka
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Privat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Przelew
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Dług spłacony
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Dług
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deliveries?.map((delivery) => {
                console.log('Delivery client:', delivery.client);
                return (
                  <tr
                    key={delivery.id}
                    id={`delivery-${delivery.id}`}
                    className="transition-colors duration-500 ease-in-out"
                  >
                    <td 
                      className="px-6 py-4 whitespace-nowrap cursor-pointer hover:text-blue-600"
                      onClick={() => router.push(`/drivers/${delivery.driverId}/${format(new Date(delivery.deliveryDate), 'yyyy-MM-dd')}#delivery-${delivery.id}`)}
                    >
                      {format(new Date(delivery.deliveryDate), "dd MMM yyyy")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {delivery.driver?.name || "Unknown Driver"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {delivery.goodsAmount} zł
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {delivery.cashAmount} zł
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {delivery.cardAmount} zł
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {delivery.transfer} zł
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={
                          delivery.extraPayment > 0 ? "text-green-600" : ""
                        }
                      >
                        {delivery.extraPayment} zł
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={delivery.debt > 0 ? "text-red-600" : ""}>
                        {delivery.debt} zł
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <EditClientModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        client={client || null}
        onUpdate={handleUpdate}
      />

      <DeliverySidebar
        isOpen={isDeliverySidebarOpen}
        onClose={() => setIsDeliverySidebarOpen(false)}
        drivers={drivers || []}
        client={client}
        date={new Date()}
      />
    </div>
  );
}
