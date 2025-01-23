import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { equal } from 'assert';

const prisma = new PrismaClient();

export const getProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const search = req.query.search?.toString();
        const products = await prisma.products.findMany({
            where: {
                name: {
                    contains: search
                }
            },
            orderBy: {
                name: 'asc'
            }
        })
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "Tovarlar olishda problema" });
    }
}

export const createProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { productId, name, price, rating, stockQuantity } = req.body;
        const product = await prisma.products.create({
            data: {
                productId,
                name,
                price,
                rating,
                stockQuantity
            }
        })
        res.status(201).json(product)
    } catch (error) {
        res.status(500).json({ message: 'Toza towar qoshishda hatolik' })
    }
}

export const updateProductStock = async (req: Request, res: Response): Promise<void> => {
    try {
        const { productId, type, value } = req.body;

        if (!productId) {
            res.status(400).json({ message: 'productId is required' });
            return;
        }
        if (!type || !['income', 'outcome'].includes(type)) {
            res.status(400).json({ message: 'type must be either "income" or "outcome"' });
            return;
        }
        if (typeof value !== 'number' || value < 0) {
            res.status(400).json({ message: 'value must be a positive number' });
            return;
        }

        const product = await prisma.products.findUnique({ where: { productId } });

        if (!product) {
            res.status(404).json({ message: 'Product not found' });
            return;
        }

        let updatingProductStock = product.stockQuantity;

        if (type === 'income') {
            updatingProductStock += value;
        } else if (type === 'outcome') {
            if (updatingProductStock < value) {
                res.status(400).json({ message: 'Mahsulot soni yetarli emas!' });
                return;
            }
            updatingProductStock -= value;
        }

        // Use a transaction to ensure both operations succeed or fail together
        const [updatedProduct, productLog] = await prisma.$transaction([
            prisma.products.update({
                where: { productId },
                data: { stockQuantity: updatingProductStock }
            }),
            prisma.productLog.create({
                data: {
                    productId,
                    type,
                    value,
                    user: 'Vohidjon' // Static user for now
                }
            })
        ]);
        
        res.status(200).json({
            product: updatedProduct,
            log: productLog
        });
    } catch (error: any) {
        console.error('Error updating product stock:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

export const getProductWithLogs = async (req: Request, res: Response): Promise<void> => {
    try {
        const { productId } = req.params;
        
        const product = await prisma.products.findUnique({
            where: { productId },
            include: {
                logs: {
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });

        if (!product) {
            res.status(404).json({ message: 'Product not found' });
            return;
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ message: "Tovar ma'lumotlarini olishda xatolik" });
    }
};