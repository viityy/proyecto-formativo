import { Router } from 'express';
import { addReservation } from '../controllers/reservationController';
//import { addShowtime, getAllShowtimes, getOneShowtime, editShowtime, deleteShowtime } from '../controllers/reservationController';

const router = Router();

router.post('/add', addReservation);
//router.get('', getAllShowtimes);
//router.get('/:id', getOneShowtime);
//router.patch('/:id', editShowtime);
//router.delete('/:id', deleteShowtime);

export default router;