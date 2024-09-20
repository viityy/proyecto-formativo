import { Router } from 'express';
import { addMovie } from '../controllers/movieController';

const router = Router();

router.post('/add', addMovie);

export default router;