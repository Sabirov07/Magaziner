"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useGetDriverDayStatusesQuery,
  useGetDailyExpensesQuery,
  useCreateDailyExpenseMutation,
  useUpdateDailyExpenseMutation,
  useDeleteDailyExpenseMutation,
  useGetDailyIncomesQuery,
  useCreateDailyIncomeMutation,
  useUpdateDailyIncomeMutation,
  useDeleteDailyIncomeMutation,
  DriverDayStatus,
} from "../../../state/api";
import { format } from "date-fns";
import TransactionFormModal from "./TransactionFormModal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { SearchX } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  source?: string;
}

const formatDate = (dateString: string, formatStr: string) => {
  try {
    return format(new Date(dateString), formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

// Add this CSS to your component or in your global CSS file
const datePickerStyles = {
  input: "px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
  container: "relative"
};

export default function DailyAccountingPage() {
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Update queries to use correct date filtering
  const { data: driverDayStatuses } = useGetDriverDayStatusesQuery(
    startDate || endDate 
      ? {
          date: startDate ? new Date(startDate.setHours(0, 0, 0, 0)).toISOString() : '',
          endDate: endDate ? new Date(endDate.setHours(23, 59, 59, 999)).toISOString() : undefined,
          driverId: '',
          source: 'transactions'
        }
      : { date: '', driverId: '', source: 'transactions' }
  );
  const { data: expenses, refetch: refetchExpenses } = useGetDailyExpensesQuery(
    startDate || endDate 
      ? {
          date: startDate ? new Date(startDate.setHours(0, 0, 0, 0)).toISOString() : '',
          endDate: endDate ? new Date(endDate.setHours(23, 59, 59, 999)).toISOString() : undefined
        }
      : { date: '' }
  );
  const { data: extraIncomes, refetch: refetchIncomes } = useGetDailyIncomesQuery(
    startDate || endDate 
      ? {
          date: startDate ? new Date(startDate.setHours(0, 0, 0, 0)).toISOString() : '',
          endDate: endDate ? new Date(endDate.setHours(23, 59, 59, 999)).toISOString() : undefined
        }
      : { date: '' }
  );

  const [createExpense] = useCreateDailyExpenseMutation();
  const [updateExpense] = useUpdateDailyExpenseMutation();
  const [deleteExpense] = useDeleteDailyExpenseMutation();
  const [createIncome] = useCreateDailyIncomeMutation();
  const [updateIncome] = useUpdateDailyIncomeMutation();
  const [deleteIncome] = useDeleteDailyIncomeMutation();

  // Calculate totals
  const totalDriverCash = driverDayStatuses?.reduce((sum, status) => sum + (status.cashPaid || 0), 0) || 0;
  const totalExtraIncome = extraIncomes?.reduce((sum, income) => sum + income.amount, 0) || 0;
  const totalExpenses = expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
  const totalBalance = totalDriverCash + totalExtraIncome - totalExpenses;

  // Combine all transactions for display
  const allTransactions: Transaction[] = [
    ...(driverDayStatuses?.map((status: DriverDayStatus, index: number) => ({
      id: `driver_${status.driverId}_${index}`,
      amount: status.cashPaid || 0,
      description: `Gatowka od ${status.driverName}`,
      type: 'INCOME' as const,
      date: status.date,
      source: 'DRIVER'
    })).filter(transaction => transaction.amount !== 0) || []),
    ...(extraIncomes?.map(income => ({
      id: income.id,
      amount: income.amount,
      description: income.description,
      type: 'INCOME' as const,
      date: income.date,
      source: 'EXTRA'
    })).filter(transaction => transaction.amount !== 0) || []),
    ...(expenses?.map(expense => ({
      id: expense.id,
      amount: expense.amount,
      description: expense.description,
      type: 'EXPENSE' as const,
      date: expense.date
    })).filter(transaction => transaction.amount !== 0) || [])
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Add state for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleAddTransaction = async (data: { type: 'INCOME' | 'EXPENSE'; amount: number; description: string; date: string }) => {
    try {
      if (data.type === 'EXPENSE') {
        await createExpense({
          date: data.date,
          amount: data.amount,
          description: data.description
        }).unwrap();
      } else {
        await createIncome({
          date: data.date,
          amount: data.amount,
          description: data.description
        }).unwrap();
      }
      
      // Refresh the data after successful creation
      if (data.type === 'EXPENSE') {
        refetchExpenses();
      } else {
        refetchIncomes();
      }
      
      setIsAddModalOpen(false);
    } catch (error: any) {
      console.error("Failed to create transaction:", error);
      // Add user feedback for the error
      alert("Failed to create transaction. Please try again.");
    }
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        if (transaction.type === 'EXPENSE') {
          await deleteExpense(transaction.id).unwrap();
        } else if (transaction.source === 'EXTRA') {
          await deleteIncome(transaction.id).unwrap();
        }
      } catch (error) {
        console.error("Failed to delete transaction:", error);
      }
    }
  };

  const handleEditTransaction = async (data: { type: 'INCOME' | 'EXPENSE'; amount: number; description: string; date: string }) => {
    try {
      if (!editingTransaction) return;

      if (data.type === 'EXPENSE') {
        await updateExpense({
          id: editingTransaction.id,
          amount: data.amount,
          description: data.description,
          date: data.date
        }).unwrap();
        refetchExpenses();
      } else if (editingTransaction.source === 'EXTRA') {
        await updateIncome({
          id: editingTransaction.id,
          amount: data.amount,
          description: data.description,
          date: data.date
        }).unwrap();
        refetchIncomes();
      }
      setIsEditModalOpen(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error("Failed to update transaction:", error);
      alert("Failed to update transaction. Please try again.");
    }
  };

  return (
    <div className="w-full p-4 space-y-6">
      {/* Summary Card with Date Range Picker */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">
            Kunlik Hisob
            {startDate && ` - ${formatDate(startDate.toISOString(), "dd.MM.yyyy")} dan`}
            {endDate && ` ${formatDate(endDate.toISOString(), "dd.MM.yyyy")} gacha`}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Boshlanish:</span>
              <div className={datePickerStyles.container}>
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date | null) => setStartDate(date)}
                  className={datePickerStyles.input}
                  placeholderText="Boshlanish sanasini tanlang"
                  isClearable
                  dateFormat="dd/MM/yyyy"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Tugash:</span>
              <div className={datePickerStyles.container}>
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date | null) => setEndDate(date)}
                  className={datePickerStyles.input}
                  placeholderText="Tugash sanasini tanlang"
                  isClearable
                  dateFormat="dd/MM/yyyy"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
              </div>
            </div>
            { (startDate || endDate) && <button
              onClick={() => {
                setStartDate(null);
                setEndDate(null);
              }}
              className="text-sm text-blue-500 hover:text-blue-700 font-medium"
            >
              <>{<SearchX className="h-5 w-5 mr-2" />}</>
            </button>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Umumiy balans:</p>
            <p className={`font-bold text-2xl ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalBalance.toFixed(2)} zł
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setTransactionType('EXPENSE');
                setIsAddModalOpen(true);
              }}
              className="px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              Xarajat qo'shish
            </button>
            <button
              onClick={() => {
                setTransactionType('INCOME');
                setIsAddModalOpen(true);
              }}
              className="px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            >
              Daromad qo'shish
            </button>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Tranzaksiyalar tarixi</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sana
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tavsif
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Miqdor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Turi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allTransactions.map((transaction) => (
                <tr 
                  key={transaction.id}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(transaction.date, "dd MMM yyyy")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transaction.amount.toFixed(2)} zł
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      transaction.type === 'INCOME' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type === 'INCOME' ? 'Daromad' : 'Xarajat'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {transaction.source === 'DRIVER' ? (
                      <button
                        onClick={() => {
                          const driverId = transaction.id.split('_')[1];
                          const transactionDate = format(new Date(transaction.date), 'yyyy-MM-dd');
                          router.push(`/drivers/${driverId}/${transactionDate}`);
                        }}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        Dastavalarni ko'rish
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingTransaction(transaction);
                            setIsEditModalOpen(true);
                          }}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          O'zgartirish
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(transaction)}
                          className="text-red-500 hover:text-red-700"
                        >
                          O'chirish
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isAddModalOpen && (
        <TransactionFormModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddTransaction}
          type={transactionType}
        />
      )}

      {/* Add Edit Transaction Modal */}
      {isEditModalOpen && editingTransaction && (
        <TransactionFormModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTransaction(null);
          }}
          onSubmit={handleEditTransaction}
          type={editingTransaction.type}
          initialData={{
            amount: editingTransaction.amount,
            description: editingTransaction.description,
            date: editingTransaction.date
          }}
        />
      )}
    </div>
  );
} 