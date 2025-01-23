import { Request, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const accountingController = {
  getDriverDeliveries: async (req: Request, res: Response): Promise<void> => {
    try {
      const { driverId } = req.params;
      const { date } = req.query;
      
      const deliveries = await prisma.delivery.findMany({
        where: {
          driverId,
          ...(date && {
            deliveryDate: {
              gte: new Date(date as string),
              lt: new Date(new Date(date as string).setDate(new Date(date as string).getDate() + 1))
            }
          })
        },
        include: {
          client: true
        }
      });
      
      res.json(deliveries);
    } catch (error) {
      const errorParams = {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      };
      console.error('Error fetching driver deliveries:', errorParams);
      res.status(500).json({ error: 'Failed to fetch driver deliveries' });
    }
  },

  getDriverExpenses: async (req: Request, res: Response): Promise<void> => {
    try {
      const { driverId } = req.params;
      const { date } = req.query;
      
      const expenses = await prisma.driverExpense.findMany({
        where: {
          driverId,
          ...(date && {
            expenseDate: {
              gte: new Date(date as string),
              lt: new Date(new Date(date as string).setDate(new Date(date as string).getDate() + 1))
            }
          })
        }
      });
      
      res.json(expenses);
    } catch (error) {
      const errorParams = {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      };
      console.error('Error fetching driver expenses:', errorParams);
      res.status(500).json({ error: 'Failed to fetch driver expenses' });
    }
  },

  // Delivery endpoints
  getDeliveries: async (req: Request, res: Response): Promise<void> => {
    const { date } = req.query;

    try {
      const deliveries = await prisma.delivery.findMany({
        where: date ? {
          deliveryDate: {
            gte: new Date(date as string),
            lt: new Date(new Date(date as string).getTime() + 24 * 60 * 60 * 1000)
          }
        } : undefined,
        include: {
          driver: true,
          client: true
        }
      });

      res.json(deliveries);
    } catch (error) {
      const errorParams = {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      };
      console.error('Error getting deliveries:', errorParams);
      res.status(500).json({ error: 'Failed to get deliveries' });
    }
  },

  createDelivery: async (req: Request, res: Response): Promise<void> => {
    try {
      const deliveryData = req.body;
      
      // Create the delivery first
      const delivery = await prisma.delivery.create({
        data: {
          driverId: deliveryData.driverId,
          clientId: deliveryData.clientId,
          amount: deliveryData.amount,
          cashAmount: deliveryData.cashAmount,
          cardAmount: deliveryData.cardAmount,
          transfer: deliveryData.transfer,
          debt: deliveryData.debt,
          goodsAmount: deliveryData.goodsAmount,
          extraPayment: deliveryData.extraPayment,
          deliveryDate: deliveryData.deliveryDate ? new Date(deliveryData.deliveryDate) : new Date(),
        }
      });

      // We should NOT create separate debt records here since the delivery already tracks the debt
      // Remove the ClientDebt creation code as the debt is already tracked in the delivery

      res.status(201).json(delivery);
    } catch (error) {
      console.error('Error creating delivery:', error);
      res.status(500).json({ error: 'Failed to create delivery' });
    }
  },

  // Driver Expense endpoints
  createDriverExpense: async (req: Request, res: Response): Promise<void> => {
    try {
      const { driverId, type, name, amount, expenseDate } = req.body;
      
      const expense = await prisma.driverExpense.create({
        data: {
          driverId,
          type,
          name,
          amount,
          expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        },
        include: {
          driver: true
        }
      });
      
      res.json(expense);
    } catch (error) {
      const errorParams = {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      };
      console.error('Error creating driver expense:', errorParams);
      res.status(500).json({ error: 'Failed to create driver expense' });
    }
  },


  getDeliveryById: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const delivery = await prisma.delivery.findUnique({
        where: { id },
        include: {
          driver: true,
          client: true
        }
      });
      
      if (!delivery) {
        res.status(404).json({ error: 'Delivery not found' });
        return;
      }
      
      res.json(delivery);
    } catch (error) {
      const errorParams = {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      };
      console.error('Error fetching delivery:', errorParams);
      res.status(500).json({ error: 'Failed to fetch delivery' });
    }
  },

  // Get driver's total cash amount for a specific date
  getDriverCashTotal: async (req: Request, res: Response): Promise<void> => {
    const { driverId } = req.params;
    const { date } = req.query;

    try {
      const totalCash = await prisma.delivery.aggregate({
        where: {
          driverId,
          deliveryDate: {
            gte: new Date(date as string),
            lt: new Date(new Date(date as string).getTime() + 24 * 60 * 60 * 1000)
          }
        },
        _sum: {
          cashAmount: true
        }
      });

      res.json({ totalCash: totalCash._sum.cashAmount || 0 });
    } catch (error) {
      const errorParams = {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      };
      console.error('Error getting driver cash total:', errorParams);
      res.status(500).json({ error: 'Failed to get total cash amount' });
    }
  },

  deleteDelivery: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Get the delivery details before deletion
      const delivery = await prisma.delivery.findUnique({
        where: { id },
        select: {
          driverId: true,
          deliveryDate: true,
        }
      });

      if (!delivery) {
        res.status(404).json({ error: 'Delivery not found' });
        return;
      }

      // Start a transaction to ensure all operations succeed or fail together
      await prisma.$transaction(async (prisma) => {
        // Delete the delivery
        await prisma.delivery.delete({
          where: { id }
        });

        // Check if this was the last delivery for this driver on this date
        const remainingDeliveries = await prisma.delivery.count({
          where: {
            driverId: delivery.driverId,
            deliveryDate: {
              gte: new Date(delivery.deliveryDate.setHours(0, 0, 0, 0)),
              lt: new Date(delivery.deliveryDate.setHours(23, 59, 59, 999))
            }
          }
        });

        // If no more deliveries exist for this date, clean up related data
        if (remainingDeliveries === 0) {
          // Delete driver day status
          await prisma.driverDayStatus.deleteMany({
            where: {
              driverId: delivery.driverId,
              date: {
                gte: new Date(delivery.deliveryDate.setHours(0, 0, 0, 0)),
                lt: new Date(delivery.deliveryDate.setHours(23, 59, 59, 999))
              }
            }
          });

          // Delete driver expenses for that day
          await prisma.driverExpense.deleteMany({
            where: {
              driverId: delivery.driverId,
              expenseDate: {
                gte: new Date(delivery.deliveryDate.setHours(0, 0, 0, 0)),
                lt: new Date(delivery.deliveryDate.setHours(23, 59, 59, 999))
              }
            }
          });
        }
      });
      
      res.json({ message: 'Delivery and related data deleted successfully' });
    } catch (error) {
      const errorParams = {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      };
      console.error('Error deleting delivery:', errorParams);
      res.status(500).json({ error: 'Failed to delete delivery and related data' });
    }
  },

  getDriverDayStatus: async (req: Request, res: Response): Promise<void> => {
    try {
      const { driverId, date } = req.query;
      
      const status = await prisma.driverDayStatus.findFirst({
        where: {
          driverId: driverId as string,
          date: {
            gte: new Date(date as string),
            lt: new Date(new Date(date as string).getTime() + 24 * 60 * 60 * 1000)
          }
        }
      });
      
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch driver day status' });
    }
  },

  updateDriverDayStatus: async (req: Request, res: Response): Promise<void> => {
    try {
      const { driverId, date, status, totalCash, cashPaid, notes, banknotes } = req.body;
      
      const updatedStatus = await prisma.driverDayStatus.upsert({
        where: {
          driverId_date: {
            driverId,
            date: new Date(date)
          }
        },
        update: {
          status,
          totalCash,
          cashPaid,
          notes,
          banknotes: banknotes ? banknotes : null,
          updatedAt: new Date(),
        },
        create: {
          driverId,
          date: new Date(date),
          status,
          totalCash,
          cashPaid,
          notes,
          banknotes: banknotes ? banknotes : null,
          updatedAt: new Date(),
        }
      });
      
      res.json(updatedStatus);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update driver day status' });
    }
  },

  updateDelivery: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const deliveryData = req.body;

      const delivery = await prisma.delivery.update({
        where: { id },
        data: {
          driverId: deliveryData.driverId,
          clientId: deliveryData.clientId,
          amount: deliveryData.amount,
          cashAmount: deliveryData.cashAmount,
          cardAmount: deliveryData.cardAmount,
          transfer: deliveryData.transfer,
          debt: deliveryData.debt,
          goodsAmount: deliveryData.goodsAmount,
          extraPayment: deliveryData.extraPayment,
          deliveryDate: deliveryData.deliveryDate ? new Date(deliveryData.deliveryDate) : undefined,
        }
      });

      // We should NOT update separate debt records here since the delivery already tracks the debt
      // Remove the ClientDebt update code as the debt is already tracked in the delivery

      res.json(delivery);
    } catch (error) {
      console.error('Error updating delivery:', error);
      res.status(500).json({ error: 'Failed to update delivery' });
    }
  },

  getDriverDailyReport: async (req: Request, res: Response): Promise<void> => {
    try {
      const { driverId, date } = req.params;
      
      // Fetch all required data in parallel
      const [deliveries, expenses, dayStatus, driver] = await Promise.all([
        prisma.delivery.findMany({
          where: {
            driverId,
            deliveryDate: {
              gte: new Date(date),
              lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
            }
          },
          include: {
            client: true
          },
          orderBy: {
            deliveryDate: 'asc'
          }
        }),
        prisma.driverExpense.findMany({
          where: {
            driverId,
            expenseDate: {
              gte: new Date(date),
              lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
            }
          }
        }),
        prisma.driverDayStatus.findFirst({
          where: {
            driverId,
            date: {
              gte: new Date(date),
              lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
            },
            status: {
              not: ''
            }
          },
          orderBy: {
            updatedAt: 'desc'
          }
        }),
        prisma.driver.findUnique({
          where: { id: driverId }
        })
      ]);

      const report = {
        driver,
        date,
        deliveries,
        expenses,
        dayStatus: dayStatus ? {
          ...dayStatus,
          date: dayStatus.date.toISOString(),
          updatedAt: dayStatus.updatedAt ? dayStatus.updatedAt.toISOString() : null
        } : null,
        summary: {
          totalCash: deliveries.reduce((sum, del) => sum + del.cashAmount, 0),
          totalExpenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
          totalCard: deliveries.reduce((sum, del) => sum + del.cardAmount, 0),
          totalTransfer: deliveries.reduce((sum, del) => sum + del.transfer, 0),
          totalDebt: deliveries.reduce((sum, del) => sum + del.debt, 0),
          totalGoods: deliveries.reduce((sum, del) => sum + del.goodsAmount, 0),
        }
      };

      res.json(report);
    } catch (error) {
      console.error('Error generating daily report:', error);
      res.status(500).json({ error: 'Failed to generate daily report' });
    }
  },

  updateDriverExpense: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { type, amount, driverId, expenseDate } = req.body;
      
      const updatedExpense = await prisma.driverExpense.update({
        where: { id },
        data: { 
          type,
          amount,
          driverId,
          expenseDate: expenseDate ? new Date(expenseDate) : undefined
        }
      });
      
      res.json(updatedExpense);
    } catch (error) {
      console.error('Error updating driver expense:', error);
      res.status(500).json({ error: 'Failed to update driver expense' });
    }
  },

  deleteDriverExpense: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const deletedExpense = await prisma.driverExpense.delete({
        where: { id }
      });
      
      res.json(deletedExpense);
    } catch (error) {
      console.error('Error deleting driver expense:', error);
      res.status(500).json({ error: 'Failed to delete driver expense' });
    }
  },

  getAllDriverExpenses: async (req: Request, res: Response): Promise<void> => {
    try {
      const { date } = req.query;
      
      const expenses = await prisma.driverExpense.findMany({
        where: date ? {
          expenseDate: {
            lte: new Date(new Date(date as string).getTime() + 24 * 60 * 60 * 1000)
          }
        } : undefined,
        orderBy: {
          expenseDate: 'desc'
        }
      });
      
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch all driver expenses' });
    }
  },

  getDriverDayStatuses: async (req: Request, res: Response): Promise<void> => {
    try {
      const { date, endDate, driverId, source } = req.query;
      
      let whereClause: any = {};
      let dateRange = {};
      
      if (date || endDate) {
        dateRange = {
          ...(date && { 
            gte: new Date(new Date(date as string).setHours(0, 0, 0, 0)) 
          }),
          ...(endDate && { 
            lte: new Date(new Date(endDate as string).setHours(23, 59, 59, 999))
          })
        };
      }

      // Get driver day statuses
      const statusesQuery = {
        where: {
          ...(driverId && { driverId: driverId as string }),
          ...(Object.keys(dateRange).length > 0 && { date: dateRange })
        },
        include: {
          driver: true
        },
        orderBy: {
          date: 'desc' as const
        }
      };

      // Get deliveries for the same period
      const deliveriesQuery = {
        where: {
          ...(Object.keys(dateRange).length > 0 && { deliveryDate: dateRange })
        },
        include: {
          driver: true
        },
        orderBy: {
          deliveryDate: 'desc' as const
        }
      };

      const [statuses, deliveries] = await Promise.all([
        prisma.driverDayStatus.findMany(statusesQuery),
        prisma.delivery.findMany(deliveriesQuery)
      ]);

      // Group deliveries by driver and date
      const deliveryStatuses = deliveries.reduce((acc: any[], delivery) => {
        const date = new Date(delivery.deliveryDate);
        date.setHours(0, 0, 0, 0);
        
        const existingStatus = acc.find(s => 
          s.driverId === delivery.driverId && 
          new Date(s.date).getTime() === date.getTime()
        );

        if (existingStatus) {
          existingStatus.totalCash += delivery.cashAmount || 0;
        } else {
          acc.push({
            id: `delivery_${delivery.driverId}_${date.toISOString()}`,
            driverId: delivery.driverId,
            driverName: delivery.driver.name,
            date: date,
            status: 'PENDING',
            cashPaid: 0,
            totalCash: delivery.cashAmount || 0,
            notes: '',
            source: 'DELIVERY'
          });
        }
        return acc;
      }, []);

      // Combine and filter results based on source
      let combinedStatuses = [...statuses.map(s => ({
        ...s,
        driverName: s.driver.name,
        source: 'MANUAL'
      }))];

      if (source !== 'driver-page') {
        // For transactions page, include both manual statuses and delivery-based ones
        combinedStatuses = [
          ...combinedStatuses,
          ...deliveryStatuses.filter(ds => 
            !combinedStatuses.some(cs => 
              cs.driverId === ds.driverId && 
              new Date(cs.date).getTime() === new Date(ds.date).getTime()
            )
          )
        ];
      }

      // Sort by date
      combinedStatuses.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      res.json(combinedStatuses);
    } catch (error) {
      console.error('Error fetching driver day statuses:', error);
      res.status(500).json({ error: 'Failed to fetch driver day statuses' });
    }
  },

  getDriverDayTotalCash: async (req: Request, res: Response): Promise<void> => {
    try {
      const { date } = req.query;
      
      const statuses = await prisma.driverDayStatus.findMany({
        where: {
          date: {
            gte: new Date(date as string),
            lt: new Date(new Date(date as string).getTime() + 24 * 60 * 60 * 1000)
          }
        }
      });

      const totalCash = statuses.reduce((sum, status) => sum + (status.cashPaid || 0), 0);
      
      res.json({ totalCash });
    } catch (error) {
      console.error('Error calculating total cash paid:', error);
      res.status(500).json({ error: 'Failed to calculate total cash paid' });
    }
  },

  getDailyExpenses: async (req: Request, res: Response): Promise<void> => {
    try {
      const { date, endDate } = req.query;
      
      const expenses = await prisma.dailyExpense.findMany({
        where: {
          date: {
            ...(date && { gte: new Date(date as string) }),
            ...(endDate && { lt: new Date(endDate as string) })
          }
        },
        orderBy: { date: 'desc' }
      });
      
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch daily expenses' });
    }
  },

  getDailyIncomes: async (req: Request, res: Response): Promise<void> => {
    try {
      const { date, endDate } = req.query;
      
      const incomes = await prisma.dailyIncome.findMany({
        where: {
          date: {
            ...(date && { gte: new Date(date as string) }),
            ...(endDate && { lt: new Date(endDate as string) })
          }
        },
        orderBy: { date: 'desc' }
      });
      
      res.json(incomes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch daily incomes' });
    }
  },

  createDailyIncome: async (req: Request, res: Response): Promise<void> => {
    try {
      const { amount, description, date } = req.body;
      
      const income = await prisma.dailyIncome.create({
        data: {
          amount: parseFloat(amount),
          description,
          date: new Date(date) // Convert string date to Date object
        }
      });
      
      res.status(201).json(income);
    } catch (error) {
      console.error('Error creating daily income:', error);
      res.status(500).json({ error: 'Failed to create daily income' });
    }
  },

  createDailyExpense: async (req: Request, res: Response): Promise<void> => {
    try {
      const { amount, description, date } = req.body;
      
      const expense = await prisma.dailyExpense.create({
        data: {
          amount: parseFloat(amount),
          description,
          date: new Date(date) // Convert string date to Date object
        }
      });
      
      res.status(201).json(expense);
    } catch (error) {
      console.error('Error creating daily expense:', error);
      res.status(500).json({ error: 'Failed to create daily expense' });
    }
  },

  updateDailyIncome: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { amount, description, date } = req.body;
      
      const income = await prisma.dailyIncome.update({
        where: { id },
        data: {
          amount: parseFloat(amount),
          description,
          date: new Date(date)
        }
      });
      
      res.json(income);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update daily income' });
    }
  },

  deleteDailyIncome: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      await prisma.dailyIncome.delete({
        where: { id }
      });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete daily income' });
    }
  },

  updateDailyExpense: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { amount, description, date } = req.body;
      
      const expense = await prisma.dailyExpense.update({
        where: { id },
        data: {
          amount: parseFloat(amount),
          description,
          date: new Date(date)
        }
      });
      
      res.json(expense);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update daily expense' });
    }
  },

  deleteDailyExpense: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      await prisma.dailyExpense.delete({
        where: { id }
      });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete daily expense' });
    }
  },

} as { [key: string]: RequestHandler };
