'use client'

import { useState, useEffect } from 'react';
import { useCreateDeliveryMutation, useUpdateDeliveryMutation, useGetClientsQuery, Driver, Delivery } from '@/state/api';
import Modal from '@/app/(componenets)/Modal';
import { useRouter } from 'next/navigation';

interface AddDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  drivers: Driver[];
  date?: Date;
  editDelivery?: Delivery | null;
  hideDriverSelect?: boolean;
}

export default function AddDeliveryModal(props: AddDeliveryModalProps) {
  const { isOpen, onClose, date, editDelivery, hideDriverSelect } = props;
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [transfer, setTransfer] = useState('');
  const [debt, setDebt] = useState('');
  const [goodsAmount, setGoodsAmount] = useState('');
  const [extraPayment, setExtraPayment] = useState('');

  const [createDelivery] = useCreateDeliveryMutation();
  const [updateDelivery] = useUpdateDeliveryMutation();
  const { data: clients } = useGetClientsQuery();
  const router = useRouter();

  // Populate form when editing
  useEffect(() => {
    if (editDelivery) {
      setSelectedDriver(editDelivery.driverId);
      setSelectedClient(editDelivery.clientId);
      setCashAmount(editDelivery.cashAmount?.toString() || '');
      setCardAmount(editDelivery.cardAmount?.toString() || '');
      setTransfer(editDelivery.transfer?.toString() || '');
      setDebt(editDelivery.debt?.toString() || '');
      setGoodsAmount(editDelivery.goodsAmount?.toString() || '');
      setExtraPayment(editDelivery.extraPayment?.toString() || '');
    } else {
      // Reset form when not editing
      setSelectedDriver(props.drivers[0]?.id || '');
      setSelectedClient('');
      setCashAmount('');
      setCardAmount('');
      setTransfer('');
      setDebt('');
      setGoodsAmount('');
      setExtraPayment('');
    }
  }, [editDelivery, props.drivers, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient) {
      alert('Please select a client');
      return;
    }

    if (!selectedDriver && !hideDriverSelect) {
      alert('Please select a driver');
      return;
    }

    // Find the selected client to get their name
    const selectedClientData = clients?.find(client => client.id === selectedClient);
    if (!selectedClientData) {
      alert('Selected client not found');
      return;
    }

    const deliveryData = {
      driverId: selectedDriver,
      clientId: selectedClient,
      clientName: selectedClientData.name,
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
      // Add validation logging
      console.log('Validation check:', {
        hasDriverId: Boolean(deliveryData.driverId),
        hasClientId: Boolean(deliveryData.clientId),
        hasClientName: Boolean(deliveryData.clientName),
        hasDeliveryDate: Boolean(deliveryData.deliveryDate),
      });

      if (editDelivery) {
        await updateDelivery({
          id: editDelivery.id,
          ...deliveryData,
        }).unwrap();
      } else {
        console.log('Sending delivery data:', deliveryData);
        const result = await createDelivery(deliveryData).unwrap();
        console.log('Create delivery response:', result);
        
        if (date) {
          router.push(`/drivers/${selectedDriver}/${date.toISOString().split('T')[0]}`);
        }
      }
      
      onClose();
    } catch (error: any) {
      console.error('Failed to save delivery:', error);
      const errorMessage = error.data?.error || 'Failed to save delivery. Please check all required fields.';
      alert(errorMessage);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-bold mb-4">
          {editDelivery ? 'Dastavani tahrirlash' : 'Yangi Dastava qo\'shish'}
        </h2>
        
        {!hideDriverSelect && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Xaydovchi</label>
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Xaydovchini tanlang</option>
              {props.drivers?.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Mijoz</label>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Mijozni tanlang</option>
            {clients?.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Qarz to'lovi</label>
            <input
              type="number"
              value={extraPayment}
              onChange={(e) => setExtraPayment(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
          >
            {editDelivery ? 'Saqlash' : 'Qo\'shish'}
          </button>
        </div>
      </form>
    </Modal>
  );
}