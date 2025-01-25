'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGetClientsQuery, useUpdateClientMutation } from '@/state/api';
import AddClientModal from './AddClientModal';
import Header from '../(componenets)/Header';
import { UserRoundPlus } from 'lucide-react';

export default function ClientsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: clients, isLoading } = useGetClientsQuery();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [updateClient] = useUpdateClientMutation();

  const filteredClients = clients?.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClientClick = (clientId: string) => {
    router.push(`/clients/${clientId}`);
  };

  if (isLoading) {
    return <div>Yuklanmoqda...</div>;
  }

  return (
    <div className="w-full p-4 space-y-6">
      <div className="flex justify-between items-center">
        <Header name="Kliyentlar" />
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <UserRoundPlus className="h-5 w-5 mr-2" /> Dodaj klienta
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Szukaj klienta..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients?.map((client) => (
          <div
            key={client.id}
            onClick={() => handleClientClick(client.id)}
            className="border rounded-lg p-4 bg-white shadow hover:shadow-md transition-shadow cursor-pointer relative"
          >
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-blue-500">
                  {client.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{client.name}</h2>
                {client.address && (
                  <p className="text-gray-600 text-sm">{client.address}</p>
                )}
                {client.phone && (
                  <p className="text-gray-600 text-sm">{client.phone}</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredClients?.length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-8">
            Nie znaleziono klientów
          </div>
        )}
      </div>
      <AddClientModal 
        isOpen={isModalOpen && !selectedClient}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
