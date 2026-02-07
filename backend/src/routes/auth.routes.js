import express from 'express';
import { register, login, me } from '../controllers/authController.js';
import { authValidation } from '../middlewares/validator.js';
import { authMiddleware } from '../middlewares/auth.js';
import { countFavorites } from '../controllers/userController.js';
import { loginLimiter, registerLimiter, apiLimiter } from '../config/rateLimit.js';

const router = express.Router();

router.post('/register', registerLimiter, authValidation.register, register);
router.post('/login', loginLimiter, authValidation.login, login);
router.get('/me', authMiddleware, me);
router.get("/favorites/count", apiLimiter, authMiddleware, countFavorites);

export default router;