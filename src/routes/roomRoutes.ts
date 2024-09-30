import { Router } from 'express';
import { addRoom } from '../controllers/roomController';

const router = Router();

router.post('/add', addRoom);

export default router;