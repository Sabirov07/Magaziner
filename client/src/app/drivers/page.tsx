"use client";

import React, { useState } from 'react'
import Header from '../(componenets)/Header'
import { PlusIcon } from 'lucide-react'
import { useGetDriversQuery, useAddDriverMutation } from '@/state/api'
import { useRouter } from 'next/navigation'
import AddDriverModal from './AddDriverModal'

function DriversPage() {
  const { data: drivers, isLoading } = useGetDriversQuery()
  const [addDriver] = useAddDriverMutation()
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleAddDriver = async (driverData: { name: string; phoneNumber?: string }) => {
    try {
      await addDriver(driverData).unwrap()
      setIsModalOpen(false)
    } catch (error) {
      console.error('Failed to add driver:', error)
    }
  }

  return (
    <div className='mx-auto pb-5 w-full p-4'>
      <div className='flex justify-between items-center mb-6'>
        <Header name='Haydovchilar' />
        <button 
          onClick={() => setIsModalOpen(true)}
          className='flex items-center bg-blue-500 hover:bg-blue-700 text-gray-200 font-bold py-2 px-4 rounded'
        >
          <PlusIcon className='h-5 w-5 mr-2 !text-gray-200' />
          Haydovchi Qoshish
        </button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {drivers?.map((driver) => (
            <div
              key={driver.id}
              onClick={() => router.push(`/drivers/${driver.id}`)}
              className='border rounded-lg p-4 bg-white shadow hover:shadow-md transition-shadow cursor-pointer'
            >
              <div className='flex items-center space-x-4'>
                <div className='h-12 w-12 bg-red-100 rounded-full flex items-center justify-center'>
                  <span className='text-xl font-bold text-red-500'>
                    {driver.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className='text-xl font-semibold'>{driver.name}</h2>
                  <p className='text-gray-600'>+48 99 999 99 99</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddDriverModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddDriver}
      />
    </div>
  )
}

export default DriversPage