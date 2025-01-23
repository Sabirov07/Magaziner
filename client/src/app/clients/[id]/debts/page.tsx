"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useGetClientDebtsQuery,
  useCreateClientDebtMutation,
  useUpdateClientDebtMutation,
  useDeleteClientDebtMutation,
  useGetClientsQuery,
  useGetClientDeliveriesQuery,
  ClientDebt,
} from "@/state/api";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import DebtFormModal from "./DebtFormModal";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

interface DeliveryDebt extends ClientDebt {
  isFromDelivery?: boolean;
  deliveryId?: string;
}

export default function ClientDebtsPage() {
  const router = useRouter();
  const { id } = useParams();
  const clientId = typeof id === "string" ? id : "";
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<any>(null);
  const [transactionType, setTransactionType] = useState<'DEBT' | 'PAYMENT'>('DEBT');

  const { data: clients } = useGetClientsQuery();
  const { data: debts } = useGetClientDebtsQuery(clientId);
  const [createDebt] = useCreateClientDebtMutation();
  const [updateDebt] = useUpdateClientDebtMutation();
  const [deleteDebt] = useDeleteClientDebtMutation();
  const { data: deliveries } = useGetClientDeliveriesQuery(clientId);

  const client = clients?.find((c) => c.id === clientId);
  const totalDebt = (
    (debts?.reduce((sum, debt) => {
      return sum + (debt.type === 'DEBT' ? debt.amount : -debt.amount);
    }, 0) || 0) +
    (deliveries?.reduce((sum, delivery) => {
      return sum + (delivery.debt || 0) - (delivery.extraPayment || 0);
    }, 0) || 0)
  );

  const handleAddDebt = async (data: any) => {
    try {
      await createDebt({ 
        clientId, 
        data: {
          ...data,
          type: transactionType
        } 
      }).unwrap();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Failed to create debt:", error);
    }
  };

  const handleUpdateDebt = async (debtId: string, data: any) => {
    try {
      await updateDebt({ debtId, data }).unwrap();
      setEditingDebt(null);
    } catch (error) {
      console.error("Failed to update debt:", error);
    }
  };

  const handleDeleteDebt = async (debtId: string) => {
    if (window.confirm("Are you sure you want to delete this debt?")) {
      try {
        await deleteDebt(debtId).unwrap();
      } catch (error) {
        console.error("Failed to delete debt:", error);
      }
    }
  };

  const allTransactions = [
    ...(debts || []),
    ...(deliveries?.filter(d => {
      // Only include deliveries that have debt or extraPayment
      return d.debt > 0 || d.extraPayment > 0;
    }).map(delivery => {
      const transactions = [];
      
      // Add debt transaction if exists
      if (delivery.debt > 0) {
        transactions.push({
          id: `delivery-debt-${delivery.id}`,
          amount: delivery.debt,
          debtDate: delivery.deliveryDate,
          type: 'DEBT' as const,
          description: `Debt from delivery`,
          isFromDelivery: true
        });
      }
      
      // Add payment transaction if exists
      if (delivery.extraPayment > 0) {
        transactions.push({
          id: `delivery-payment-${delivery.id}`,
          amount: delivery.extraPayment,
          debtDate: delivery.deliveryDate,
          type: 'PAYMENT' as const,
          description: `Payment from delivery`,
          isFromDelivery: true
        });
      }
      
      return transactions;
    }).flat() || [])
  ].sort((a, b) => new Date(b.debtDate).getTime() - new Date(a.debtDate).getTime());

  return (
    <div className="w-full mx-auto p-4 space-y-6">
      <Link 
        href={`/clients/${clientId}`}
        className="flex items-center text-blue-500 hover:text-blue-700 mb-6"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-2" />
        Powrót do klienta
      </Link>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">{client?.name || 'Loading...'}</h1>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600 text-base">Aktywne długi:</p>
            <p className="font-bold text-red-600 text-2xl">{totalDebt.toFixed(2)} zł</p>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setEditingDebt(null);
                setIsAddModalOpen(true);
                setTransactionType('DEBT');
              }}
              className="px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              Dodaj dług
            </button>
            <button
              onClick={() => {
                setEditingDebt(null);
                setIsAddModalOpen(true);
                setTransactionType('PAYMENT');
              }}
              className="px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            >
              Dodaj wpłatę
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Historia transakcji</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kwota
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {format(new Date(transaction.debtDate), "dd MMM yyyy")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transaction.amount} zł
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      transaction.type === 'PAYMENT' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type === 'PAYMENT' 
                        ? transaction.isFromDelivery 
                          ? 'Wpłata z dostawy' 
                          : 'Wpłata'
                        : 'Dług'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {!transaction.isFromDelivery ? (
                      <>
                        <button
                          onClick={() => setEditingDebt(transaction)}
                          className="text-blue-500 hover:text-blue-700 mr-4"
                        >
                          Edytuj
                        </button>
                        <button
                          onClick={() => handleDeleteDebt(transaction.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Usuń
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          if (transaction.isFromDelivery) {
                            const deliveryId = transaction.id.split('-').slice(2).join('-');
                            console.log('Delivery ID:', deliveryId);
                            if (deliveryId) {
                              router.push(`/clients/${clientId}#delivery-${deliveryId}`);
                            }
                          }
                        }}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        Zobacz dostawę
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DebtFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddDebt}
        transactionType={transactionType}
      />

      <DebtFormModal
        isOpen={!!editingDebt}
        onClose={() => setEditingDebt(null)}
        onSubmit={(data) => handleUpdateDebt(editingDebt?.id, data)}
        initialData={editingDebt}
      />
    </div>
  );
}
