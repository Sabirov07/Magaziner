import express from 'express';

import { driverController} from '../controllers/driverController';


const router = express.Router();

router.get('/', driverController.getDrivers);

router.get('/:id', driverController.getDriverById);

router.post('/', driverController.createDriver)


export default router;