import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { RequestHandler } from 'express';

const prisma = new PrismaClient();

export const clientController = {
  
  // Get all clients
  getClients: async (req: Request, res: Response): Promise<void> => {
    try {
      const clients = await prisma.client.findMany({
        orderBy: {
          name: 'asc'
        }
      });
      res.json(clients);
    } catch (error) {
      const errorParams = {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      };
      console.error('Error fetching clients:', errorParams);
      res.status(500).json({ error: 'Failed to fetch clients' });
    }
  },

  // Create new client
  createClient: async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, address, phone } = req.body;

      const existingClient = await prisma.client.findUnique({
        where: { name }
      });

      if (existingClient) {
        res.status(400).json({ error: 'Client with this name already exists' });
      } else {
        const client = await prisma.client.create({
          data: {
            name,
            address,
            phone
          }
        });
        res.status(201).json(client);
      }
    } catch (error) {
      const errorParams = {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      };
      console.error('Error creating client:', errorParams);
      res.status(500).json({ error: 'Failed to create client' });
    }
  },

  // Update client
  updateClient: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, address, phone } = req.body;

      const existingClient = await prisma.client.findUnique({
        where: { id }
      });

      if (!existingClient) {
        res.status(404).json({ error: 'Client not found' });
      } else if (name && name !== existingClient.name) {
        const nameExists = await prisma.client.findUnique({
          where: { name }
        });

        if (nameExists) {
          res.status(400).json({ error: 'Client with this name already exists' });
        } else {
          const updatedClient = await prisma.client.update({
            where: { id },
            data: { name, address, phone }
          });
          res.json(updatedClient);
        }
      } else {
        const updatedClient = await prisma.client.update({
          where: { id },
          data: { name, address, phone }
        });
        res.json(updatedClient);
      }
    } catch (error) {
      const errorParams = {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      };
      console.error('Error updating client:', errorParams);
      res.status(500).json({ error: 'Failed to update client' });
    }
  },

  // Delete client
  deleteClient: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const existingClient = await prisma.client.findUnique({
        where: { id },
        include: {
          deliveries: true,
          debts: true
        }
      });

      if (!existingClient) {
        res.status(404).json({ error: 'Client not found' });
      } else if (existingClient.deliveries.length > 0 || existingClient.debts.length > 0) {
        res.status(400).json({ 
          error: 'Cannot delete client with existing deliveries or debts' 
        });
      } else {
        await prisma.client.delete({
          where: { id }
        });
        res.json({ message: 'Client deleted successfully' });
      }
    } catch (error) {
      const errorParams = {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      };
      console.error('Error deleting client:', errorParams);
      res.status(500).json({ error: 'Failed to delete client' });
    }
  },

  // Get single client by ID
  getClientById: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const client = await prisma.client.findUnique({
        where: { id },
        include: {
          deliveries: true,
          debts: {
            include: {
              payments: true
            }
          }
        }
      });

      if (!client) {
        res.status(404).json({ error: 'Client not found' });
      } else {
        res.json(client);
      }
    } catch (error) {
      const errorParams = {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      };
      console.error('Error fetching client:', errorParams);
      res.status(500).json({ error: 'Failed to fetch client' });
    }
  },

  getClientDeliveries: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      console.log('Fetching deliveries for client:', id);
      
      const deliveries = await prisma.delivery.findMany({
        where: { 
          clientId: id 
        },
        include: {
          driver: {
            select: {
              id: true,
              name: true
            }
          },
          client: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          deliveryDate: 'desc'
        }
      });
      
      console.log('Found deliveries:', JSON.stringify(deliveries, null, 2));
      
      res.json(deliveries);
    } catch (error) {
      const errorParams = {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      };
      console.error('Error fetching client deliveries:', errorParams);
      res.status(500).json({ error: 'Failed to fetch client deliveries' });
    }
  },

  getClientDebts: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const debts = await prisma.clientDebt.findMany({
        where: { clientId: id },
        orderBy: { debtDate: 'desc' }
      });
      
      res.json(debts);
    } catch (error) {
      console.error('Error fetching client debts:', error);
      res.status(500).json({ error: 'Failed to fetch client debts' });
    }
  },

  // Create new debt or payment
  createClientDebt: async (req: Request, res: Response): Promise<void> => {
    try {
      const { clientId } = req.params;
      const { amount, description, debtDate, type } = req.body;

      const client = await prisma.client.findUnique({
        where: { id: clientId }
      });

      if (!client) {
        res.status(404).json({ error: 'Client not found' });
        return;
      }

      // Get current total debt for validation
      const [debts, deliveries] = await Promise.all([
        prisma.clientDebt.findMany({
          where: { clientId }
        }),
        prisma.delivery.findMany({
          where: { 
            clientId,
            debt: { gt: 0 }
          }
        })
      ]);
      
      const totalDebt = debts.reduce((sum, debt) => {
        if (debt.type === 'DEBT') {
          return sum + debt.amount;
        } else {
          return sum - debt.amount;
        }
      }, 0) + deliveries.reduce((sum, delivery) => sum + delivery.debt, 0);

      // For payments, validate that there's enough debt to pay
      if (type === 'PAYMENT' && amount > totalDebt) {
        res.status(400).json({ 
          error: 'Payment amount cannot exceed total debt',
          currentDebt: totalDebt 
        });
        return;
      }

      const debt = await prisma.clientDebt.create({
        data: {
          clientId,
          amount: Number(amount),
          description,
          debtDate: debtDate ? new Date(debtDate) : new Date(),
          type: type as 'DEBT' | 'PAYMENT'
        }
      });

      res.status(201).json(debt);
    } catch (error) {
      console.error('Error creating client debt/payment:', error);
      res.status(500).json({ error: 'Failed to create client debt/payment' });
    }
  },

  // Update debt
  updateClientDebt: async (req: Request, res: Response): Promise<void> => {
    try {
      const { debtId } = req.params;
      const { amount, description, debtDate } = req.body;

      const debt = await prisma.clientDebt.update({
        where: { id: debtId },
        data: {
          amount,
          description,
          debtDate: debtDate ? new Date(debtDate) : undefined,
        }
      });

      res.json(debt);
    } catch (error) {
      console.error('Error updating client debt:', error);
      res.status(500).json({ error: 'Failed to update client debt' });
    }
  },

  // Delete debt
  deleteClientDebt: async (req: Request, res: Response): Promise<void> => {
    try {
      const { debtId } = req.params;

      await prisma.clientDebt.delete({
        where: { id: debtId }
      });

      res.json({ message: 'Debt deleted successfully' });
    } catch (error) {
      console.error('Error deleting client debt:', error);
      res.status(500).json({ error: 'Failed to delete client debt' });
    }
  },

  getClientTotalDebts: async (req: Request, res: Response): Promise<void> => {
    try {
      const { clientId } = req.params;

      const [debts, deliveries] = await Promise.all([
        prisma.clientDebt.findMany({
          where: { clientId }
        }),
        prisma.delivery.findMany({
          where: { 
            clientId,
            OR: [
              { debt: { gt: 0 } },
              { extraPayment: { gt: 0 } }
            ]
          },
          select: {
            id: true,
            debt: true,
            extraPayment: true,
            deliveryDate: true,
            client: true,
            driver: true,
          }
        })
      ]);

      // Calculate totals
      const regularDebtBalance = debts.reduce((sum, debt) => {
        return sum + (debt.type === 'DEBT' ? debt.amount : -debt.amount);
      }, 0);
      
      const deliveryBalance = deliveries.reduce((sum, delivery) => {
        return sum + (delivery.debt || 0) - (delivery.extraPayment || 0);
      }, 0);

      const totalDebt = regularDebtBalance + deliveryBalance;

      res.json({
        totalDebt,
        transactions: debts,
        deliveryDebts: deliveries.map(delivery => ({
          id: delivery.id,
          amount: delivery.debt || delivery.extraPayment,
          debtDate: delivery.deliveryDate,
          type: delivery.debt > 0 ? 'DEBT' : 'PAYMENT',
          description: `${delivery.debt > 0 ? 'Debt' : 'Payment'} from delivery`,
          isFromDelivery: true,
          deliveryId: delivery.id
        })),
        breakdown: {
          fromRegularDebts: regularDebtBalance,
          fromDeliveries: deliveryBalance
        }
      });
    } catch (error) {
      console.error('Error fetching client total debts:', error);
      res.status(500).json({ error: 'Failed to fetch client total debts' });
    }
  },
} as { [key: string]: RequestHandler }; 