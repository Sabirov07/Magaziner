import { useEffect } from "react";

import { useState } from "react";
import { createPortal } from "react-dom";

// Add this enum before the interface
enum ExpenseType {
  PALIWO = "PALIWO",
  AVANS = "AVANS",
  SERWIS = "SERWIS",
  HOSTEL = "HOSTEL",
  BOSHQA = "BOSHQA",
}

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  driverId: string;
}

export default function AddExpenseModal({
  isOpen,
  onClose,
  onSubmit,
  driverId,
}: AddExpenseModalProps) {
  const [formData, setFormData] = useState({
    type: ExpenseType.PALIWO,
    name: "",
    amount: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(formData);
    onSubmit({
      type: formData.type,
      name: formData.type === ExpenseType.BOSHQA ? formData.name : formData.type,
      amount: Number(formData.amount),
    });
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen || typeof window === "undefined") return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/50 transition-opacity duration-1000 ease-in-out"
        onClick={onClose}
        style={{ backdropFilter: "blur(2px)" }}
      />
      <div
        className="fixed inset-0 flex items-center justify-center"
        onClick={onClose}
      >
        <div
          className="bg-white p-6 rounded-lg w-96 relative transform transition-all duration-1000` ease-in-out scale-100 opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold mb-4">Yangi Xarajat</h2>
          <form onSubmit={handleSubmit}>
            <select
              className="w-full mb-4 p-2 border rounded"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as ExpenseType })
              }
              required
            >
              {Object.values(ExpenseType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {formData.type === ExpenseType.BOSHQA && (
              <input
                type="text"
                placeholder="Xarajat nomi"
                className="w-full mb-4 p-2 border rounded"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            )}
            <input
              type="number"
              placeholder="Miqdori"
              className="w-full mb-4 p-2 border rounded"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                Saqlash
              </button>
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body
  );
}
