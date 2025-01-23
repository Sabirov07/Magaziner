import { Request, Response} from 'express';
import { PrismaClient } from "@prisma/client";


const prisma = new PrismaClient();

export const driverController = {
    getDrivers: async (req: Request, res: Response) => {
        try {
          const drivers = await prisma.driver.findMany();
          res.json(drivers);
        } catch (error) {
          const errorParams = {
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined
          };
          console.error('Error fetching drivers:', errorParams);
          res.status(500).json({ error: 'Failed to fetch drivers' });
        }
      },

    getDriverById: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            
            const driver = await prisma.driver.findUnique({
                where: { id}
            })
            if (!driver) {
                res.status(404).json({error: 'Driver not found'})
            }
            res.json(driver)
        } catch (error) {
            
        }
    },

    createDriver: async (req: Request, res: Response) => {
        try {
            const driver = await prisma.driver.create({
                data: req.body
            })
            res.json(driver)
        } catch (error) {
            res.status(500).json({error: 'Failed to create driver', stack: error instanceof Error ? error.stack : undefined})};
    },

    deleteDriver: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const existingClient = await prisma.driver.findUnique({
                where: { id }
            })

            if (!existingClient) {
                res.status(404).json({error: 'Driver not found'})
            }

            await prisma.driver.delete({
                where: { id }
            })

            res.json({message: 'Driver deleted successfully'})
        } catch (error) {
            res.status(500).json({error: 'Failed to delete Driver', stack: error instanceof Error ? error.stack : undefined})
        }
    },

    
}
