'use client'

import { useState, useEffect } from 'react';
import { useCreateDeliveryMutation, useUpdateDeliveryMutation, Driver, Delivery } from '@/state/api';
import { useRouter } from 'next/navigation';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface DeliverySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  drivers: Driver[];
  client: any; // Replace with proper client type
  date?: Date;
  editDelivery?: Delivery | null;
}

export default function DeliverySidebar(props: DeliverySidebarProps) {
  const { isOpen, onClose, drivers, client, date, editDelivery } = props;
  const [selectedDriver, setSelectedDriver] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [transfer, setTransfer] = useState('');
  const [debt, setDebt] = useState('');
  const [goodsAmount, setGoodsAmount] = useState('');
  const [extraPayment, setExtraPayment] = useState('');
  const [createDelivery] = useCreateDeliveryMutation();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const deliveryData = {
      driverId: selectedDriver,
      clientId: client.id,
      clientName: client.name,
      amount: parseFloat(cashAmount || '0') + parseFloat(cardAmount || '0') + parseFloat(transfer || '0') + parseFloat(debt || '0'),
      cashAmount: parseFloat(cashAmount || '0'),
      cardAmount: parseFloat(cardAmount || '0'),
      transfer: parseFloat(transfer || '0'),
      debt: parseFloat(debt || '0'),
      goodsAmount: parseFloat(goodsAmount || '0'),
      extraPayment: parseFloat(extraPayment || '0'),
      deliveryDate: date ? new Date(date).toISOString() : new Date().toISOString(),
    };

    try {
      await createDelivery(deliveryData).unwrap();
      onClose();
    } catch (error) {
      console.error('Failed to save delivery:', error);
      alert('Failed to save delivery');
    }
  };

  // Match main sidebar width and transition
  const sidebarClasses = `fixed right-0 top-0 h-full w-96 md:w-96 bg-white shadow-lg transform transition-all duration-300 ${
    isOpen ? 'translate-x-0' : 'translate-x-full'
  }`;

  // Add margin to main content when sidebar is open
  useEffect(() => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.style.marginRight = isOpen ? '23rem' : '0';
      mainContent.style.transition = 'margin-right 300ms';
    }
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={sidebarClasses}>
        <div className="h-full flex flex-col p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Yangi Dastava</h2>
            <button onClick={onClose}>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Xaydovchi</label>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Xaydovchini tanlang</option>
                {drivers?.map((driver) => (
                  <option key={driver.id} value={driver.id}>{driver.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tovar summasi</label>
              <input
                type="number"
                value={goodsAmount}
                onChange={(e) => setGoodsAmount(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Naqd pul</label>
                <input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Privat</label>
                <input
                  type="number"
                  value={cardAmount}
                  onChange={(e) => setCardAmount(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Przelew</label>
                <input
                  type="number"
                  value={transfer}
                  onChange={(e) => setTransfer(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Qarz</label>
                <input
                  type="number"
                  value={debt}
                  onChange={(e) => setDebt(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Qarz to'lovi</label>
              <input
                type="number"
                value={extraPayment}
                onChange={(e) => setExtraPayment(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Qo'shish
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}