import { Router } from 'express';
import { addMovie, deleteMovie, editMovie, getAllMovies, getGenreMovies, getOneMovie } from '../controllers/movieController';

const router = Router();

router.post('/add', addMovie);
router.get('', getAllMovies);
router.get('/:id', getOneMovie);
router.patch('/:id', editMovie);
router.delete('/:id', deleteMovie);
router.get('/genre/:genre', getGenreMovies);

export default router;