import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface AddDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; phoneNumber?: string }) => void;
}

export default function AddDriverModal({
  isOpen,
  onClose,
  onSubmit,
}: AddDriverModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
  });

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
          className="bg-white p-6 rounded-lg w-96 relative transform transition-all duration-1000 ease-in-out scale-100 opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold mb-4">Yangi Haydovchi</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit({
                name: formData.name,
                phoneNumber: formData.phoneNumber || undefined,
              });
              setFormData({ name: "", phoneNumber: "" }); // Reset form
            }}
          >
            <input
              type="text"
              placeholder="Haydovchi ismi"
              className="w-full mb-4 p-2 border rounded"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
            <input
              type="tel"
              placeholder="Telefon raqami"
              className="w-full mb-4 p-2 border rounded"
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
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
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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