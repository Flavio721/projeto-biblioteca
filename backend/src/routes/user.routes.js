import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth.js';
import { checkRole, isAdmin } from '../middlewares/roles.js';
import { favorite, update, viewAllFavorites, uploadProfileImage, newPassword, popularUsers, addWishList, getWishList } from '../controllers/userController.js';
import { uploadImage } from '../middlewares/upload.js';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authMiddleware, checkRole("ADMIN", "LIBRARIAN"), async (req, res) => {
        try{
            const { role, isActive, search } = req.query;
            const where = {};

            if(role) where.role = role;
            if(isActive !== undefined ) where.isActive = isActive;
            if(search){
                where.OR = [
                    { name: { contains: search, mode: 'insensitive'} },
                    { email: { contains: search, mode: 'insensitive'}}
                ];
            }

            const users = await prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                    avatarUrl: true,
                    _count: {
                        select: { loans: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            
            res.json({ users });
        }catch (error) {
            res.status(500).json({error: 'Erro ao listar usuários'});
        }
});
router.get('/my-review/count', authMiddleware, async (req, res) => {
    try{
        const userId = req.user.id;

        const reviews = await prisma.review.count({
            where: { userId: parseInt(userId)}
        });
        return res.json({
            reviews: reviews
        });
    }catch(error) {
        console.error("Erro: ", error);
        res.status(500).json({error: "Erro na busca"});
    }
})
router.post('/update', authMiddleware, update);
router.post('/favoritar'    , authMiddleware, favorite)
router.get('/length', authMiddleware, isAdmin, async (req, res) => {
    const lengthUsers = await prisma.user.count();

    return res.json({
        length: lengthUsers
    });
})
router.get('/favorites', authMiddleware, viewAllFavorites);
router.get('/wishlist', authMiddleware, getWishList);

router.post('/add-item', authMiddleware, addWishList);

router.post(
    '/users/avatar',
    authMiddleware,
    uploadImage.single('image'),
    uploadProfileImage
);

router.post('/change-password', authMiddleware, newPassword);
router.get('/users-active', async (req, res) => {
    try{
        const usersActives = await prisma.user.count({
            where: {isActive: true }
        });
        
        return res.json({
            length: usersActives
        });
    } catch(error) {
        console.error(error);
        res.status(500).json({ error: "Erro na busca" });
    }
})
router.get("/popular-users", authMiddleware, checkRole("ADMIN", "LIBRARIAN"), popularUsers);

router.patch('/:id/role', authMiddleware, isAdmin, async (req, res) => {
    try{
        const { id } = req.params;
        const { role } = req.body;
        
        if(!['USER', 'LIBRARIAN', 'ADMIN'].includes(role)){
            return res.status(400).json({error: 'Role inválido'});
        }
        
        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: { role },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });
        res.json({
            message: 'Role atualizado com sucesso',
            user
        });
    }catch (error) {
        res.status(500).json({error: 'Erro ao atualizar role'});
    }
})

router.patch('/:id/status', authMiddleware, isAdmin, async (req, res) => {
    try{
        const { id } = req.params;
        const { isActive } = req.body;
        
        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: { isActive },
            select: {
                id: true,
                name: true,
                email: true,
                isActive: true
            }
        });
        res.json({
            message: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso`,
            user
        });
    }catch (error) {
        res.status(500).json({error: 'Erro ao atualizar status'});
    }
})

export default router;