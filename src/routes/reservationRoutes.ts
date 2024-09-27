import { Router } from 'express';
import { addReservation, deleteReservation } from '../controllers/reservationController';

const router = Router();

router.post('/add', addReservation);
router.delete('/:id', deleteReservation);

export default router;