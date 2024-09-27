import { Router } from 'express';
import { getShowtimeSeats } from '../controllers/seatController';

const router = Router();

router.get('/showtime/:showtime_id', getShowtimeSeats);

export default router;