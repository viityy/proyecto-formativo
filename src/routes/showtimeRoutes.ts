import { Router } from 'express';
import { addShowtime, getAllShowtimes, getOneShowtime, editShowtime, deleteShowtime } from '../controllers/showtimeController';

const router = Router();

router.post('/add', addShowtime);
router.get('', getAllShowtimes);
router.get('/:id', getOneShowtime);
router.patch('/:id', editShowtime);
router.delete('/:id', deleteShowtime);

export default router;