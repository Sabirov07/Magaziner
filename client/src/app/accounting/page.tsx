"use client";

import { useState, useMemo } from "react";
import {
  useGetDeliveriesQuery,
  useGetDriversQuery,
  useGetDriverDayStatusQuery,
  useGetAllDriverExpensesQuery,
  useGetDriverDayTotalCashQuery,
} from "@/state/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Driver, Delivery } from "@/state/api";
import AddDeliveryModal from "../(componenets)/AddDeliveryModal";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { setSelectedAccountingDate } from "@/state";
import { PlusIcon } from "lucide-react";
import Header from "../(componenets)/Header";

// New component to handle individual driver status
function DriverDayStatusAmount({ driverId, date }: { driverId: string; date: string }) {
  const { data: status } = useGetDriverDayStatusQuery({ driverId, date });
  return status?.cashPaid || 0;
}

// New component to handle total calculation
function TotalCashPaid({ date }: { date: string }) {
  const { data } = useGetDriverDayTotalCashQuery(date);

  return (
    <div className="text-xl font-semibold text-gray-700">
      Jami: {(data?.totalCash || 0).toFixed(2)} zł
    </div>
  );
}

export default function AccountingPage() {
  const dispatch = useDispatch();
  const persistedDate = useSelector(
    (state: any) => state.global.selectedAccountingDate
  );
  const [selectedDate, setSelectedDate] = useState(new Date(persistedDate));

  const handleDateChange = (date: Date | null) => {
    const newDate = date ?? new Date();
    setSelectedDate(newDate);
    dispatch(setSelectedAccountingDate(newDate.toISOString().split("T")[0]));
  };

  const formattedDate = useMemo(
    () => selectedDate.toISOString().split("T")[0],
    [selectedDate]
  );

  const { data: deliveries, isLoading: isLoadingDeliveries } =
    useGetDeliveriesQuery({ date: formattedDate });
  const {
    data: drivers,
    isLoading: isLoadingDrivers,
    error: driversError,
  } = useGetDriversQuery();
  const { data: expenses } = useGetAllDriverExpensesQuery({ date: formattedDate });

  // Group deliveries by driver
  const deliveriesByDriver = deliveries?.reduce((acc, delivery) => {
    if (!acc[delivery.driverId]) {
      acc[delivery.driverId] = {
        driver: delivery.driver!,
        deliveries: [],
        totalAmount: 0,
        totalExtraPayments: 0,
      };
    }
    acc[delivery.driverId].deliveries.push(delivery);
    acc[delivery.driverId].totalAmount += delivery.cashAmount;
    acc[delivery.driverId].totalExtraPayments += delivery.extraPayment || 0;
    return acc;
  }, {} as Record<string, { 
    driver: Driver; 
    deliveries: Delivery[]; 
    totalAmount: number;
    totalExtraPayments: number; 
  }>);


  return (
    <div className="p-4">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <Header name="Kundalik Hisob-Kitob" />
          <TotalCashPaid date={formattedDate} />
        </div>
        <div className="flex justify-between items-center">
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            className="p-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <AddDriverDeliveryButton
            drivers={drivers || []}
            date={selectedDate}
          />
        </div>
      </div>

      {isLoadingDeliveries ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {deliveriesByDriver &&
            Object.values(deliveriesByDriver).map((driverData) => (
              <DriverCard
                key={driverData.driver.id}
                driverData={driverData}
                date={formattedDate}
              />
            ))}
        </div>
      )}
    </div>
  );
}

function DriverCard({
  driverData,
  date,
}: {
  driverData: {
    driver: Driver;
    deliveries: Delivery[];
    totalAmount: number;
    totalExtraPayments: number;
  };
  date: string;
}) {
  const router = useRouter();
  const { data: dayStatus } = useGetDriverDayStatusQuery({
    driverId: driverData.driver.id,
    date,
  });

  // Use the actual cashPaid amount from dayStatus instead of calculating expected amount
  const actualCashPaid = dayStatus?.cashPaid || 0;

  return (
    <div className="border rounded-lg p-4 bg-white shadow">
      <div
        className="flex justify-between mb-4 cursor-pointer hover:text-blue-500 border-b pb-4"
        onClick={() => router.push(`/drivers/${driverData.driver.id}/${date}`)}
      >
        <h2 className="text-xl font-semibold">{driverData.driver.name}</h2>
        <div className="space-x-4">
          <span className="text-gray-600">
            Berilgan naqd: {actualCashPaid.toFixed(2)} zł
          </span>
          <span className={`text-base font-bold ${
            dayStatus?.status === 'PAID_OFF' ? 'text-green-600' : 
            dayStatus?.status === 'PARTIALLY_PAID' ? 'text-orange-500' :
            dayStatus?.status === 'DISPUTED' ? 'text-red-600' :
            'text-gray-800'
          }`}>
            {dayStatus?.status === 'PAID_OFF' ? "To'langan" :
             dayStatus?.status === 'PARTIALLY_PAID' ? "Qisman to'langan" :
             dayStatus?.status === 'DISPUTED' ? "Muammoli" :
             "Kutilmoqda"}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {driverData.deliveries.map((delivery) => (
          <div key={delivery.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span className="text-base text-gray-800">
              {delivery.client?.name}
            </span>
            <div className="space-x-4">
              {delivery.goodsAmount > 0 && (
                <span className="text-gray-600">
                  Tovar: {delivery.goodsAmount.toFixed(2)} zł
                </span>
              )}
              {delivery.cashAmount > 0 && (
                <span className="text-blue-600 font-medium">
                  Gatowka: {delivery.cashAmount.toFixed(2)} zł
                </span>
              )}
              {delivery.cardAmount > 0 && (
                <span className="text-purple-600 font-medium">
                  Privat: {delivery.cardAmount.toFixed(2)} zł
                </span>
              )}
              {delivery.transfer > 0 && (
                <span className="text-indigo-600 font-medium">
                  Przelew: {delivery.transfer.toFixed(2)} zł
                </span>
              )}
              {delivery.debt > 0 && (
                <span className="text-red-600 font-bold">
                  Dług: {delivery.debt.toFixed(2)} zł
                </span>
              )}
              {delivery.extraPayment > 0 && (
                <span className="text-emerald-600 font-bold">
                  Dług spłacony: {delivery.extraPayment.toFixed(2)} zł
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddDriverDeliveryButton({
  drivers,
  date,
}: {
  drivers: Driver[];
  date: Date;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        className="flex items-center bg-blue-500 hover:bg-blue-700 text-gray-200 font-bold py-2 px-4 rounded"
        onClick={() => setIsModalOpen(true)}
      >
        <PlusIcon className="h-5 w-5 mr-2 !text-gray-200" /> Dastava qo'shish
      </button>
      <AddDeliveryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        drivers={drivers}
        date={date}
      />
    </>
  );
}
