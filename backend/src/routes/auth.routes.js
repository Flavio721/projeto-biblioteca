import express from 'express';
import { register, login, me } from '../controllers/authController.js';
import { authValidation } from '../middlewares/validator.js';
import { authMiddleware } from '../middlewares/auth.js';
import { countFavorites } from '../controllers/userController.js';

const router = express.Router();

router.post('/register', authValidation.register, register);
router.post('/login', authValidation.login, login);
router.get('/me', authMiddleware, me);
router.get("/favorites/count", authMiddleware, countFavorites);

export default router;