import { Router } from 'express';
import { addReservation, deleteReservation, editReservation } from '../controllers/reservationController';

const router = Router();

router.post('/add', addReservation);
router.delete('/:id', deleteReservation);
router.patch('/:id', editReservation);

export default router;