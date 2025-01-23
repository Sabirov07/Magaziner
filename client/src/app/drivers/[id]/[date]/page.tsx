"use client";

import { useState, useEffect, useMemo } from "react";
import {
  useGetDriverDeliveriesQuery,
  useGetDriverExpensesQuery,
  useGetDriverDayStatusQuery,
  useUpdateDriverDayStatusMutation,
  useDeleteDeliveryMutation,
  useGetDriversQuery,
  useUpdateDeliveryMutation,
  Delivery,
  useCreateDriverExpenseMutation,
  DriverExpense,
  useGetDriverDailyReportQuery,
  useUpdateDriverExpenseMutation,
  useDeleteDriverExpenseMutation,
  useGetClientsQuery,
  DriverDailyReportData,
} from "@/state/api";
import { useParams } from "next/navigation";
import AddExpenseModal from "../../AddExpenseModal";
import AddDeliveryModal from "../../../(componenets)/AddDeliveryModal";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { DriverDailyReportPDF } from "../../../(componenets)/Pdf/DriverDailyReportPDF";
import { useRouter } from "next/navigation";
import Header from "@/app/(componenets)/Header";
import { Pencil, Trash2 } from "lucide-react";
import type { BlobProviderProps } from "@react-pdf/renderer";

type StatusType = "PENDING" | "PAID_OFF" | "PARTIALLY_PAID" | "DISPUTED";

const statusOptions = [
  { value: "PENDING", label: "Kutilmoqda" },
  { value: "PAID_OFF", label: "To'langan" },
  { value: "PARTIALLY_PAID", label: "Qisman to'langan" },
  { value: "DISPUTED", label: "Muammoli" },
];

type BanknoteCount = {
  [key: string]: number;
};

const POLISH_DENOMINATIONS = [500, 200, 100, 50, 20, 10, 5, 2, 1];

export default function DriverDeliveryPage() {
  const { id: driverId, date } = useParams();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const { data: drivers } = useGetDriversQuery();
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(
    null
  );
  const [isEditingBanknotes, setIsEditingBanknotes] = useState(false);
  const [isDateChangeModalOpen, setIsDateChangeModalOpen] = useState(false);
  const [newDate, setNewDate] = useState(date as string);
  const router = useRouter();
  const { data: clients } = useGetClientsQuery();

  const [formData, setFormData] = useState<{
    status: StatusType;
    cashPaid: string;
    notes: string;
    banknotes: BanknoteCount;
  }>({
    status: "PENDING",
    cashPaid: "",
    notes: "",
    banknotes: {},
  });

  const { data: deliveries } = useGetDriverDeliveriesQuery({
    driverId: driverId as string,
    date: date as string,
  });

  const { data: expenses } = useGetDriverExpensesQuery({
    driverId: driverId as string,
    date: date as string,
  });

  const { data: dayStatus } = useGetDriverDayStatusQuery({
    driverId: driverId as string,
    date: date as string,
  });

  const { data: driver } = useGetDriversQuery();
  const driverName =
    driver?.find((d) => d.id === driverId)?.name || "Haydovchi";

  const [updateStatus] = useUpdateDriverDayStatusMutation();
  const [deleteDelivery] = useDeleteDeliveryMutation();
  const [updateDelivery] = useUpdateDeliveryMutation();
  const [updateDriverExpense] = useUpdateDriverExpenseMutation();

  const totalCash =
    deliveries?.reduce(
      (sum, del) => sum + del.cashAmount + (del.extraPayment || 0),
      0
    ) || 0;
  const totalExpenses =
    expenses?.reduce((sum, exp) => sum + exp.amount, 0) ?? 0;
  const netCashDue = totalCash - totalExpenses;

  // Update form data when dayStatus changes
  useEffect(() => {
    if (dayStatus) {
      setFormData({
        status: dayStatus.status,
        cashPaid: dayStatus.cashPaid?.toString() || "",
        notes: dayStatus.notes || "",
        banknotes: dayStatus.banknotes || {},
      });
    }
  }, [dayStatus]);

  const calculateTotal = (banknotes: BanknoteCount): number => {
    return Object.entries(banknotes).reduce((sum, [denomination, count]) => {
      return sum + parseFloat(denomination) * count;
    }, 0);
  };

  const handleStatusUpdate = async () => {
    try {
      const calculatedTotal = calculateTotal(formData.banknotes);
      await updateStatus({
        driverId: driverId as string,
        date: date as string,
        status: formData.status,
        totalCash: totalCash,
        cashPaid: calculatedTotal,
        notes: formData.notes,
        banknotes: formData.banknotes,
      }).unwrap();

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const formattedDate = new Date(date as string).toLocaleDateString("uz-UZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const { data: reportData, isLoading: isReportLoading } =
    useGetDriverDailyReportQuery({
      driverId: driverId as string,
      date: date as string,
    });

  const handleBulkDelete = async () => {
    if (!deliveries?.length) return;

    if (
      window.confirm(
        `Haqiqatan ham ${formattedDate} sanasidagi barcha ma'lumotlarni o'chirmoqchimisiz? Bu haydovchining shu kundagi barcha ma'lumotlarini o'chirib tashlaydi.`
      )
    ) {
      try {
        // Delete all deliveries one by one
        await Promise.all(
          deliveries.map((delivery) => deleteDelivery(delivery.id).unwrap())
        );

        // Delete driver day status
        await updateStatus({
          driverId: driverId as string,
          date: date as string,
          status: "PENDING",
          totalCash: 0,
          cashPaid: 0,
          notes: "",
          banknotes: {},
        }).unwrap();

        // Refresh the page after deletion
        router.push(`/accounting`);
      } catch (error) {
        console.error("Failed to delete data:", error);
      }
    }
  };

  const handleBulkReassign = async () => {
    if (!selectedDriver || !deliveries?.length) return;

    if (
      window.confirm(
        `Haqiqatan ham ${formattedDate} sanasidagi barcha ma'lumotlarni boshqa haydovchiga o'tkazmoqchimisiz?`
      )
    ) {
      try {
        // First, move all data to the new driver
        await Promise.all([
          // Move deliveries
          ...deliveries.map((delivery) =>
            updateDelivery({
              id: delivery.id,
              driverId: selectedDriver,
            }).unwrap()
          ),
          // Move expenses
          ...(expenses?.map((expense) =>
            updateDriverExpense({
              id: expense.id,
              type: expense.type,
              amount: expense.amount,
              driverId: selectedDriver,
              expenseDate: expense.expenseDate,
            }).unwrap()
          ) || []),
        ]);

        // Then delete the old driver's day status
        await updateStatus({
          driverId: driverId as string,
          date: date as string,
          status: "PENDING",
          totalCash: 0,
          cashPaid: 0,
          notes: "",
          banknotes: {},
        }).unwrap();

        // Create new status for the target driver if there was a previous status
        if (dayStatus) {
          await updateStatus({
            driverId: selectedDriver,
            date: date as string,
            status: dayStatus.status,
            totalCash: dayStatus.totalCash,
            cashPaid: dayStatus.cashPaid,
            notes: dayStatus.notes || "",
            banknotes: dayStatus.banknotes || {},
          }).unwrap();
        }

        // Redirect to the new driver's page
        router.push(`/drivers/${selectedDriver}/${date}`);
        setIsReassignModalOpen(false);
      } catch (error) {
        console.error("Failed to reassign data:", error);
      }
    }
  };

  const handleBulkDateChange = async () => {
    if (!deliveries?.length || !newDate) return;

    if (
      window.confirm(
        `Haqiqatan ham ${formattedDate} sanasidagi barcha dastavalarni ${new Date(
          newDate
        ).toLocaleDateString("uz-UZ")} sanasiga o'tkazmoqchimisiz?`
      )
    ) {
      try {
        // Update all deliveries to the new date
        await Promise.all(
          deliveries.map((delivery) =>
            updateDelivery({
              id: delivery.id,
              deliveryDate: new Date(newDate).toISOString(),
            }).unwrap()
          )
        );

        // After successful update, redirect to the new date page
        router.push(`/drivers/${driverId}/${newDate}`);

        setIsDateChangeModalOpen(false);
      } catch (error) {
        console.error("Failed to update delivery dates:", error);
      }
    }
  };

  // Update the summary calculation
  const summary = useMemo(
    () => ({
      totalCash: deliveries?.reduce((sum, del) => sum + del.cashAmount, 0) || 0,
      totalCard: deliveries?.reduce((sum, del) => sum + del.cardAmount, 0) || 0,
      totalTransfer:
        deliveries?.reduce((sum, del) => sum + del.transfer, 0) || 0,
      totalDebt: deliveries?.reduce((sum, del) => sum + del.debt, 0) || 0,
      totalExtraPayment:
        deliveries?.reduce((sum, del) => sum + (del.extraPayment || 0), 0) || 0,
      totalExpenses: expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0,
    }),
    [deliveries, expenses]
  );

  // Add this useEffect for scrolling and highlighting
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (window.location.hash) {
        const element = document.querySelector(window.location.hash);
        if (element) {
          // First scroll to the element
          element.scrollIntoView({ behavior: "smooth", block: "center" });

          // Add a more noticeable highlight
          element.classList.add("bg-gray-300");

          // Remove the highlight after animation
          setTimeout(() => {
            element.classList.remove("bg-gray-300");
          }, 2000);
        }
      }
    }, 500); // Increased timeout to ensure content is loaded

    return () => clearTimeout(timeoutId);
  }, [deliveries]);

  const emptyReport: DriverDailyReportData = {
    driver: { id: "", name: "" },
    date: "",
    deliveries: [],
    expenses: [],
    summary: { totalCash: 0, totalExpenses: 0 },
  };

  const PDFSection = () => {
    if (!reportData && !isReportLoading) return null;

    return (
      <PDFDownloadLink
        document={<DriverDailyReportPDF data={reportData || emptyReport} />}
        fileName={`${driverName}-${date}.pdf`}
        className="px-4 py-2 rounded bg-green-500 hover:bg-green-600 text-white"
      >
        PDFni yuklash
      </PDFDownloadLink>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{driverName}</h1>
          <p className="text-gray-600 text-base pt-2">{formattedDate}</p>
        </div>
        <div className="space-x-4">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            + Yangi dastava
          </button>
        </div>
      </div>

      {/* Status Section */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        {/* <h2 className="text-lg font-semibold mb-4">Kun holati</h2> */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  status: e.target.value as StatusType,
                }))
              }
              className="w-full p-2 border rounded"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-between items-center space-x-4">
            <div className="w-full">
              <label className="text-sm font-medium mb-1">To'langan pul</label>
              <div
                className={`p-2 border rounded ${
                  calculateTotal(formData.banknotes) === netCashDue
                    ? "bg-green-100 text-green-800"
                    : calculateTotal(formData.banknotes) > 0
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {calculateTotal(formData.banknotes).toFixed(2)} zł
              </div>
            </div>
            <div className="w-full">
              <label className="text-sm font-medium mb-1">Farq</label>
              <div
                className={`p-2 border rounded bg-gray-100 text-gray-800 ${
                  netCashDue > calculateTotal(formData.banknotes)
                    ? "text-red-500"
                    : "text-orange-500"
                }`}
              >
                {(netCashDue - calculateTotal(formData.banknotes)).toFixed(2)}{" "}
                zł
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Izohlar</label>
          <textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, notes: e.target.value }))
            }
            className="w-full p-2 border rounded"
            rows={3}
            placeholder="Qo'shimcha ma'lumotlar..."
          />
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={handleStatusUpdate}
            className={`px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white`}
          >
            Saqlash
          </button>
        </div>
      </div>

      {/* Banknote Counting Section */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Pul hisoblash</h2>
          {!isEditingBanknotes ? (
            <button
              onClick={() => setIsEditingBanknotes(true)}
              className="px-4 py-2 text-blue-500 border border-blue-500 rounded hover:bg-blue-50"
            >
              O'zgartirish
            </button>
          ) : (
            <div className="space-x-2">
              <button
                onClick={() => setIsEditingBanknotes(false)}
                className="px-4 py-2 text-gray-500 border rounded hover:bg-gray-50"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => {
                  const diff = netCashDue - calculateTotal(formData.banknotes);
                  const message =
                    diff !== 0
                      ? `Diqqat! ${Math.abs(diff).toFixed(
                          2
                        )} zł farq bor. Davom etishni xohlaysizmi?`
                      : `Haqiqatan ham ma'lumotlarni saqlamoqchimisiz?`;

                  if (window.confirm(message)) {
                    handleStatusUpdate();
                    setIsEditingBanknotes(false);
                  }
                }}
                className={`px-4 py-2 rounded ${
                  calculateTotal(formData.banknotes) === netCashDue
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-blue-500 hover:bg-blue-600"
                } text-white`}
              >
                Saqlash
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {POLISH_DENOMINATIONS.map((denomination) => (
            <div key={denomination} className="flex items-center space-x-2">
              <label className="text-sm font-medium">{denomination} zł:</label>
              {isEditingBanknotes ? (
                <input
                  type="number"
                  min="0"
                  className="w-20 p-2 border rounded"
                  value={formData.banknotes?.[denomination] || ""}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setFormData((prev) => ({
                      ...prev,
                      banknotes: {
                        ...prev.banknotes,
                        [denomination]: value,
                      },
                    }));
                  }}
                />
              ) : (
                <span className="w-20 p-2 bg-gray-50 rounded">
                  {formData.banknotes?.[denomination] || 0}
                </span>
              )}
              <span className="text-sm text-gray-600">
                ={" "}
                {(
                  denomination * (formData.banknotes?.[denomination] || 0)
                ).toFixed(2)}{" "}
                zł
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 text-right">
          <p className="text-lg font-semibold">
            Jami: {calculateTotal(formData.banknotes || {})} zł
          </p>
          {netCashDue !== calculateTotal(formData.banknotes || {}) && (
            <p
              className={`text-sm ${
                netCashDue > calculateTotal(formData.banknotes || {})
                  ? "text-red-500"
                  : "text-orange-500"
              }`}
            >
              Farq:{" "}
              {(netCashDue - calculateTotal(formData.banknotes || {})).toFixed(
                2
              )}{" "}
              zł
            </p>
          )}
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded shadow-lg">
          Ma'lumotlar muvaffaqiyatli saqlandi!
        </div>
      )}

      {/* Deliveries List */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Dastavalar</h2>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
          >
            <span>+ Yangi dastava</span>
          </button>
        </div>

        <div className="space-y-3">
          {deliveries?.map((delivery) => (
            <div
              key={delivery.id}
              id={`delivery-${delivery.id}`}
              className="group flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all border border-gray-100 cursor-pointer duration-1000 ease-in-out"
              onClick={() =>
                router.push(
                  `/clients/${delivery.clientId}#delivery-${delivery.id}`
                )
              }
            >
              {/* Client Name Section */}
              <div className="w-[200px] shrink-0">
                <h3 className="font-medium text-gray-900">
                  {delivery.client?.name || "Unknown Client"}
                </h3>
              </div>

              {/* Payments Section */}
              <div className="flex-1 flex items-center gap-3">
                {delivery.goodsAmount > 0 && (
                  <div className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm text-gray-600">
                    Tovar: {delivery.goodsAmount.toFixed(2)} zł
                  </div>
                )}
                {delivery.cashAmount > 0 && (
                  <div className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-md text-sm text-blue-700">
                    Gatowka: {delivery.cashAmount.toFixed(2)} zł
                  </div>
                )}
                {delivery.cardAmount > 0 && (
                  <div className="px-3 py-1.5 bg-purple-50 border border-purple-100 rounded-md text-sm text-purple-700">
                    Privat: {delivery.cardAmount.toFixed(2)} zł
                  </div>
                )}
                {delivery.transfer > 0 && (
                  <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-md text-sm text-indigo-700">
                    Przelew: {delivery.transfer.toFixed(2)} zł
                  </div>
                )}
                {delivery.debt > 0 && (
                  <div className="px-3 py-1.5 bg-red-50 border border-red-100 rounded-md text-sm text-red-700">
                    Dług: {delivery.debt.toFixed(2)} zł
                  </div>
                )}
                {delivery.extraPayment > 0 && (
                  <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-md text-sm text-emerald-700">
                    Dług spłacony: {delivery.extraPayment.toFixed(2)} zł
                  </div>
                )}
              </div>

              {/* Actions Section - Stop event propagation for buttons */}
              <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDelivery({
                      ...delivery,
                      client: clients?.find((c) => c.id === delivery.clientId),
                    });
                    setIsAddModalOpen(true);
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="O'zgartirish"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      window.confirm(
                        "Haqiqatan ham bu dastavani o'chirmoqchimisiz?"
                      )
                    ) {
                      deleteDelivery(delivery.id);
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="O'chirish"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expenses List */}
      <div className="mt-6 bg-white px-6 py-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Xarajatlar</h2>
          <AddExpenseButton
            driverId={driverId as string}
            date={date as string}
          />
        </div>
        <div className="space-y-4">
          {expenses?.map((expense) => (
            <ExpenseRow key={expense.id} expense={expense} />
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Umumiy</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-gray-600">Jami naqd:</span>
            <span className="font-bold ml-2">{totalCash.toFixed(2)} zł</span>
          </div>
          <div>
            <span className="text-gray-600">Xarajatlar:</span>
            <span className="font-bold ml-2">
              {totalExpenses.toFixed(2)} zł
            </span>
          </div>
          <div>
            <span className="text-gray-600">Bergan:</span>
            <span className="font-bold ml-2">
              {calculateTotal(formData.banknotes)} zł
            </span>
          </div>
          {calculateTotal(formData.banknotes) !== netCashDue && (
            <div>
              <span className="text-gray-600">Farq:</span>
              <span
                className={`font-bold ml-2 ${
                  netCashDue > calculateTotal(formData.banknotes)
                    ? "text-red-500"
                    : "text-orange-500"
                }`}
              >
                {(netCashDue - calculateTotal(formData.banknotes)).toFixed(2)}{" "}
                zł
              </span>
            </div>
          )}
        </div>
      </div>

      <AddDeliveryModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedDelivery(null);
        }}
        drivers={[
          {
            id: driverId as string,
            name: "",
            createdAt: new Date().toISOString(),
          },
        ]}
        date={new Date(date as string)}
        editDelivery={selectedDelivery}
        hideDriverSelect={true}
      />

      {/* Add Reassign Modal */}
      {isReassignModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">
              Boshqa haydovchiga o'tkazish
            </h2>
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            >
              <option value="">Haydovchini tanlang</option>
              {drivers
                ?.filter((d) => d.id !== driverId)
                .map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
            </select>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsReassignModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleBulkReassign}
                disabled={!selectedDriver}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                O'tkazish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Date Change Modal */}
      {isDateChangeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Sanani o'zgartirish</h2>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsDateChangeModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleBulkDateChange}
                disabled={!newDate}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-400"
              >
                O'zgartirish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Bulk Actions Section at the bottom */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between space-x-4">
          <button
            onClick={handleBulkDelete}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Barcha dastavalarni o'chirish
          </button>
          <button
            onClick={() => setIsReassignModalOpen(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Boshqa haydovchiga o'tkazish
          </button>
          <button
            onClick={() => setIsDateChangeModalOpen(true)}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
          >
            Sanani o'zgartirish
          </button>
          {deliveries && deliveries.length > 0 && <PDFSection />}
        </div>
      </div>
    </div>
  );
}

function AddDeliveryButton({ driverId }: { driverId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: drivers } = useGetDriversQuery();

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="mt-2 p-2 text-sm border rounded bg-gray-100 hover:bg-gray-200"
      >
        Dastava qo'shish
      </button>
      {isModalOpen && (
        <AddDeliveryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          drivers={drivers || []}
        />
      )}
    </>
  );
}

function AddExpenseButton({
  driverId,
  date,
}: {
  driverId: string;
  date: string;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createExpense] = useCreateDriverExpenseMutation();

  const handleSubmit = async (data: { type: string; amount: number }) => {
    try {
      await createExpense({
        driverId,
        ...data,
        expenseDate: date,
      }).unwrap();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to create expense:", error);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="mt-2 p-2 text-sm border rounded bg-gray-100 hover:bg-gray-200"
      >
        + Xarajat qo'shish
      </button>
      {isModalOpen && (
        <AddExpenseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
          driverId={driverId}
        />
      )}
    </>
  );
}

function ExpenseRow({ expense }: { expense: DriverExpense }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedType, setEditedType] = useState(expense.type);
  const [editedAmount, setEditedAmount] = useState(expense.amount);
  const [updateExpense] = useUpdateDriverExpenseMutation();
  const [deleteExpense] = useDeleteDriverExpenseMutation();
  
  enum ExpenseType {
    PALIWO = "PALIWO",
    AVANS = "AVANS",
    SERWIS = "SERWIS",
    HOSTEL = "HOSTEL",
    BOSHQA = "BOSHQA",
  }
  // Get the display name - use the custom name if type is OTHER, otherwise use the type
  const displayName = expense.type === ExpenseType.BOSHQA ? expense.name : expense.type;

  const handleSave = async () => {
    try {
      await updateExpense({
        id: expense.id,
        type: editedType,
        amount: editedAmount,
      }).unwrap();
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update expense:", error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Haqiqatan ham bu xarajatni o'chirmoqchimisiz?")) {
      try {
        await deleteExpense(expense.id).unwrap();
      } catch (error) {
        console.error("Failed to delete expense:", error);
      }
    }
  };

  if (isEditing) {
    return (
      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
        <input
          type="text"
          value={editedType}
          onChange={(e) => setEditedType(e.target.value)}
          className="border rounded px-2 py-1 w-1/3"
        />
        <input
          type="number"
          value={editedAmount}
          onChange={(e) => setEditedAmount(Number(e.target.value))}
          className="border rounded px-2 py-1 w-1/3"
        />
        <div className="space-x-2">
          <button
            onClick={handleSave}
            className="text-green-500 hover:text-green-700"
          >
            Saqlash
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            Bekor qilish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center p-2">
      <span>{displayName}</span>
      <div className="flex items-center space-x-4">
        <span>{expense.amount} zł</span>
        <button
          onClick={() => setIsEditing(true)}
          className="text-blue-500 hover:text-blue-700"
        >
          O'zgartirish
        </button>
        <button
          onClick={handleDelete}
          className="text-red-500 hover:text-red-700"
        >
          O'chirish
        </button>
      </div>
    </div>
  );
}

function DeliveryList({ deliveries }: { deliveries: Delivery[] }) {
  return (
    <div className="space-y-4">
      {deliveries.map((delivery) => (
        <div key={delivery.id} className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">
              {delivery.client?.name}
            </h3>
            <div className="flex space-x-4">
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
        </div>
      ))}
    </div>
  );
}
