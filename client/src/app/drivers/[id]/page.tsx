"use client";

import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  useGetDriverQuery,
  useGetDriverDeliveriesQuery,
  useGetDriverExpensesQuery,
  useGetDriverDayStatusesQuery,
} from "@/state/api";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { PlusIcon, ChevronDown, ChevronRight, Eye } from "lucide-react";
import AddExpenseModal from "../AddExpenseModal";
import AddDriverModal from "../AddDriverModal";

interface GroupedDeliveries {
  [date: string]: {
    deliveries: any[];
    totalCash: number;
    totalCard: number;
    totalTransfer: number;
    totalDebt: number;
    totalGoods: number;
  };
}

export default function DriverPage() {
  const router = useRouter();
  const { id } = useParams();
  const driverId = typeof id === "string" ? id : "";
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expandedDates, setExpandedDates] = useState<{
    [key: string]: boolean;
  }>({});

  const { data: driver, isLoading } = useGetDriverQuery(driverId);
  const { data: deliveries } = useGetDriverDeliveriesQuery({ driverId });
  const { data: expenses } = useGetDriverExpensesQuery({ driverId });

  // Get all dates from grouped deliveries with proper sorting
  const dates = useMemo(() => {
    if (!deliveries) return [];
    const allDates = deliveries.map((d) =>
      format(new Date(d.deliveryDate), "yyyy-MM-dd")
    );

    // Sort dates in descending order
    return [...new Set(allDates)].sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );
  }, [deliveries]);

  // Fetch all statuses at once with proper date range
  const { data: dayStatuses } = useGetDriverDayStatusesQuery({ 
    driverId,
    date: dates[dates.length - 1] || '', // earliest date
    endDate: dates[0] || '', // latest date
    source: 'driver-page' // Add this parameter
  }, {
    skip: !dates.length || !driverId
  });

  const groupedDeliveries = useMemo(() => {
    if (!deliveries) return {};

    return deliveries.reduce((acc: GroupedDeliveries, delivery) => {
      const date = format(new Date(delivery.deliveryDate), "yyyy-MM-dd");

      if (!acc[date]) {
        acc[date] = {
          deliveries: [],
          totalCash: 0,
          totalCard: 0,
          totalTransfer: 0,
          totalDebt: 0,
          totalGoods: 0,
        };
      }

      acc[date].deliveries.push(delivery);
      acc[date].totalCash += delivery.cashAmount;
      acc[date].totalCard += delivery.cardAmount;
      acc[date].totalTransfer += delivery.transfer;
      acc[date].totalDebt += delivery.debt;
      acc[date].totalGoods += delivery.goodsAmount;

      return acc;
    }, {});
  }, [deliveries]);

  if (isLoading || !driver) {
    return <div>Loading...</div>;
  }

  const totalExpenses =
    expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  return (
    <div className="w-full p-4 space-y-6">
      {/* Driver Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold">{driver.name}</h1>
          </div>
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Yangi Xarajat
          </button>
        </div>
      </div>

      {/* Daily Deliveries Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Kunlik Dastavkalar</h2>
        <div className="space-y-4">
          {Object.entries(groupedDeliveries)
            .sort(
              ([dateA], [dateB]) =>
                new Date(dateB).getTime() - new Date(dateA).getTime()
            )
            .map(([date, data]) => {
              // Try to find existing status
              const dayStatus = dayStatuses?.find((status) => {
                const statusDate = format(new Date(status.date), "yyyy-MM-dd");
                return statusDate === date;
              }) || {
                // Create default status if none exists
                status: "PENDING",
                cashPaid: 0,
                notes: "",
                date: new Date(date),
                driverId: driverId,
                totalCash: data.totalCash, // Use the calculated total from grouped deliveries
              };

              return (
                <div key={date} className="border rounded-lg">
                  <div
                    className="flex justify-between items-center p-4 cursor-pointer bg-gray-50 hover:bg-gray-100"
                    onClick={() => toggleDate(date)}
                  >
                    <div className="flex items-center space-x-2">
                      {expandedDates[date] ? (
                        <ChevronDown size={20} />
                      ) : (
                        <ChevronRight size={20} />
                      )}
                      <span className="font-semibold">
                        {format(new Date(date), "dd MMM yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      {dayStatus.notes && (
                        <span className="text-gray-600">
                          📝 {dayStatus.notes}
                        </span>
                      )}
                      <span
                        className={`px-3 py-1 rounded-full ${
                          dayStatus.status === "PAID_OFF"
                            ? "bg-green-100 text-green-800"
                            : dayStatus.status === "PARTIALLY_PAID"
                            ? "bg-yellow-100 text-yellow-800"
                            : dayStatus.status === "DISPUTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {dayStatus.status === "PAID_OFF"
                          ? "To'langan"
                          : dayStatus.status === "PARTIALLY_PAID"
                          ? "Qisman to'langan"
                          : dayStatus.status === "DISPUTED"
                          ? "Muammoli"
                          : "Kutilmoqda"}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            `/drivers/${driverId}/${format(
                              new Date(date),
                              "yyyy-MM-dd"
                            )}`
                          );
                        }}
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                      >
                        <Eye size={16} />
                        <span>Ko'rish</span>
                      </button>
                    </div>
                  </div>

                  {expandedDates[date] && (
                    <div className="p-4">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                              Mijoz
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                              Tovar
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                              Naqd
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                              Karta
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                              O'tkazma
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                              Qarz
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {data.deliveries.map((delivery) => (
                            <tr key={delivery.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2">
                                {delivery.client?.name}
                              </td>
                              <td className="px-4 py-2">
                                {delivery.goodsAmount} zł
                              </td>
                              <td className="px-4 py-2">
                                {delivery.cashAmount} zł
                              </td>
                              <td className="px-4 py-2">
                                {delivery.cardAmount} zł
                              </td>
                              <td className="px-4 py-2">
                                {delivery.transfer} zł
                              </td>
                              <td className="px-4 py-2">
                                <span
                                  className={
                                    delivery.debt > 0 ? "text-red-600" : ""
                                  }
                                >
                                  {delivery.debt} zł
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSubmit={async (data) => {
          setIsExpenseModalOpen(false);
        }}
        driverId={driverId}
      />
    </div>
  );
}
