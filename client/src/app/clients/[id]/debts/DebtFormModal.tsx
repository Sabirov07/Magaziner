import { useState, useEffect } from "react";
import { ClientDebt } from "@/state/api";
import { format } from "date-fns";

interface DebtFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<ClientDebt>) => Promise<void>;
  initialData?: ClientDebt;
  transactionType?: 'DEBT' | 'PAYMENT';
}

interface DebtFormData {
  amount: number;
  date: Date;
  dueDate?: Date;
  type: 'DEBT' | 'PAYMENT';
  description?: string;
}

export default function DebtFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  transactionType = 'DEBT',
}: DebtFormModalProps) {
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    debtDate: format(new Date(), "yyyy-MM-dd"),
    type: transactionType
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        amount: initialData.amount.toString(),
        description: initialData.description || "",
        debtDate: format(new Date(initialData.debtDate), "yyyy-MM-dd"),
        type: initialData.type
      });
    } else {
      setFormData(prev => ({
        ...prev,
        type: transactionType
      }));
    }
  }, [initialData, transactionType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      amount: Number(formData.amount),
      description: formData.description,
      debtDate: new Date(formData.debtDate).toISOString(),
      type: formData.type
    });
    setFormData({
      amount: "",
      description: "",
      debtDate: format(new Date(), "yyyy-MM-dd"),
      type: transactionType
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {initialData ? "Edytuj" : formData.type === 'DEBT' ? "Dodaj nowy dług" : "Dodaj wpłatę"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Kwota
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Opis
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Data długu
            </label>
            <input
              type="date"
              required
              value={formData.debtDate}
              onChange={(e) =>
                setFormData({ ...formData, debtDate: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {initialData ? "Zapisz zmiany" : "Dodaj"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 