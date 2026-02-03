import express from 'express';
import { create, update, remove } from '../controllers/reviewController.js';
import { reviewValidation } from '../middlewares/validator.js';
import { authMiddleware } from '../middlewares/auth.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/',
    authMiddleware,
    reviewValidation.create,
    create
);

router.put('/:id', authMiddleware, update);

router.delete('/:id', authMiddleware, remove);

router.get('/book-reviews/:bookId', authMiddleware, async (req, res) => {
    try {
        const bookId = parseInt(req.params.bookId);

        if (!bookId || isNaN(bookId)) {
            return res.status(400).json({ error: "BookId inválido" });
        }

        // Buscar todas as reviews do livro
        const allReviews = await prisma.review.findMany({
            where: { bookId: bookId },
            include: {
                user: {
                    select: { name: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Calcular média
        let totalRating = 0;
        allReviews.forEach(review => {
            totalRating += review.rating;
        });

        const avgRating = allReviews.length > 0 
            ? totalRating / allReviews.length 
            : 0;

        return res.json({
            reviews: allReviews,
            avgRating: parseFloat(avgRating.toFixed(1))
        });

    } catch(error) {
        console.error("Erro ao buscar reviews:", error);
        return res.status(500).json({ error: "Erro na busca das avaliações" });
    }
});

export default router;