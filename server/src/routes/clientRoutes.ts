import express from 'express';
import { clientController } from '../controllers/clientController';

const router = express.Router();

// Client routes
router.get('/', clientController.getClients);
router.post('/', clientController.createClient);
router.get('/:id/deliveries', clientController.getClientDeliveries);
router.get('/:id/debts', clientController.getClientDebts);
router.get('/:id', clientController.getClientById);
router.put('/:id', clientController.updateClient);
router.delete('/:id', clientController.deleteClient);
router.post('/:clientId/debts', clientController.createClientDebt);
router.put('/debts/:debtId', clientController.updateClientDebt);
router.delete('/debts/:debtId', clientController.deleteClientDebt);
router.get('/:clientId/total-debts', clientController.getClientTotalDebts);



export default router; 