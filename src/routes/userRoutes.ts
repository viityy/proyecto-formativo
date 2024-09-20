import { Router } from 'express';
import { addUser, changePassword, loginUser } from '../controllers/userController';

const router = Router();

router.post('/add', addUser);
router.post('/login', loginUser);
router.patch('/changepassword', changePassword);

export default router;