import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Route, Delivery, Expense } from './types';


export const accountingApi = createApi({
    baseQuery: fetchBaseQuery({ baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL }),
    reducerPath: 'accountingApi',
    tagTypes: ['Routes', 'Deliveries', 'Expenses'],
    endpoints: (build) => ({
      // Get all routes for a specific date
      getRoutes: build.query<Route[], string>({
        query: (date) => ({
          url: '/routes',
          params: date ? { date } : {},
        }),
        providesTags: ['Routes']
      }),
      // Create new route
      createRoute: build.mutation<Route, Partial<Route>>({
        query: (route) => ({
          url: '/routes',
          method: 'POST',
          body: route
        }),
        invalidatesTags: ['Routes']
      }),
      
      // Add delivery to route
      addDelivery: build.mutation<Delivery, Partial<Delivery>>({
        query: (delivery) => ({
          url: '/deliveries',
          method: 'POST',
          body: delivery
        }),
        invalidatesTags: ['Routes', 'Deliveries']
      }),
      
      // Add expense to route
      addExpense: build.mutation<Expense, Partial<Expense>>({
        query: (expense) => ({
          url: '/expenses',
          method: 'POST',
          body: expense
        }),
        invalidatesTags: ['Routes', 'Expenses']
      })
    })
  });

export const {
  useGetRoutesQuery,
  useCreateRouteMutation,
  useAddDeliveryMutation,
  useAddExpenseMutation
} = accountingApi;