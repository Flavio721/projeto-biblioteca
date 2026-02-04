import express from 'express';
import { create, getMyLoans, renew, updateStatus, getLoansByDate, getAllFine, createReserve } from '../controllers/loanController.js';
import { loanValidation } from '../middlewares/validator.js';
import { authMiddleware } from '../middlewares/auth.js';
import { checkRole, isAdmin, isLibrarian } from '../middlewares/roles.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient()

// Rotas do usuário
router.post('/create',
    authMiddleware,
    loanValidation.create,
    create
);
router.get('/my-loans', authMiddleware, getMyLoans);
router.get('/my-loans/active', authMiddleware, async (req, res) => {
    const loansActives = await prisma.loan.findMany({
        where: { status: 'ACTIVE'}
    });

    return res.json({ 
        loans: loansActives });
})
router.get('/my-loans/pending', authMiddleware, async (req, res) => {
    const id = req.user.id;
    const loansPending = await prisma.loan.findMany({
        where: { userId: parseInt(id), 
            status: 'PENDING'}
    });

    return res.json({
        loans: loansPending
    });
})
router.get('/my-reserves', authMiddleware, async (req, res) => {
    try{
        const userId = req.user.id;

        const reserves = await prisma.reservation.findMany({
            where: {
                userId: userId
            },
            include: {
                book: true
            }
        });

        return res.json({
            reserves: reserves
        })
    }catch(error){
        console.error("Erro: ", error);
        return res.status(500).json({ error: "Erro na busca das reservas" });
    }
})

router.post('/reserve', authMiddleware, createReserve);

router.post('/:id/renew', authMiddleware, renew);

// Rotas do bibliotecário
router.get('/update',
    authMiddleware,
    isLibrarian,
    loanValidation.updateStatus,
    updateStatus
);
router.patch('/:id/status',
    authMiddleware,
    isLibrarian,
    loanValidation.updateStatus,
    updateStatus
);
router.get('/my-loans/count', authMiddleware, async (req, res) => {
    try{
        const userId = req.user.id;

        const loansCount = await prisma.loan.count({
            where: { userId: parseInt(userId)}
        });
        return res.json({
            loans: loansCount
        })
    }catch(error){
        console.error(error);
        res.status(500).json({error: "Erro na busca"});
    }
})
// Rota do Admin
router.get('/lengthActive', authMiddleware, checkRole("ADMIN", "LIBRARIAN"), async (req, res) => {
    const lengthLoansActive = await prisma.loan.count({
        where: { status: "ACTIVE"}
    });

    return res.json({
        length: lengthLoansActive
    });
})
router.get('/lengthDelayed', authMiddleware, checkRole("ADMIN", "LIBRARIAN"), async (req, res) => {
    const lengthLoansDelayed = await prisma.loan.count({
        where: { status: 'OVERDUE'},
    });

    return res.json({
        length: lengthLoansDelayed
    })
})
router.get('/fines', authMiddleware, checkRole("ADMIN", "LIBRARIAN"), getAllFine);
router.get('/', authMiddleware, checkRole("ADMIN", "LIBRARIAN"), async (req, res) => {
    const loans = await prisma.loan.findMany({
        select: {
            id: true,
            status: true,
            loanDate: true,
            dueDate: true,
            user: {
                select: { name: true }
            },
            book: {
                select: { title: true }
            }
        }
    });


    return res.json({
        loans
    });
})
router.get('/return-rate', authMiddleware, checkRole("ADMIN", "LIBRARIAN"), async (req, res) => {
    try{
        const allLoans = await prisma.loan.count();

        const loansReturned = await prisma.loan.count({
            where: { status: 'RETURNED'}
        });
        
        const returnRate = (loansReturned * 100) /allLoans;

        return res.json({
            rate: returnRate
        });
    }catch(error) {
        console.error("Erro: ", error);
        res.status(500).json({ error: "Erro na busca "});
    }
})
router.get('/overdue', authMiddleware, checkRole("ADMIN", "LIBRARIAN"), async (req, res) => {
    const overdueLoans = await prisma.loan.findMany({
        where: { status: 'OVERDUE'},
        include: {
            user: {
                select: { name: true }
            }
        }
    });

    return res.json({
        overdue: overdueLoans
    })
})
router.get('/pending', authMiddleware, checkRole("ADMIN", "LIBRARIAN"), async (req, res)=> {
    try{
        const pendingLoans = await prisma.loan.findMany({
            where: { status: 'PENDING'}
        });

        return res.json({
            loans: pendingLoans
        })
    } catch(error){
        console.error("Erro: ", error);
        return res.status(500).json({error: "Erro ao buscar" })
    }
})
router.get('/length', async (req, res) => {
    try{
        const loansLength = await prisma.loan.count();

        res.json({
            length: loansLength
        });
    }catch(error) {
        console.error(error);
        res.status(500).json({error: "Erro na busca"})
    }
});
router.get(
  "/by-date",
  authMiddleware,
  checkRole("ADMIN", "LIBRARIAN"),
  getLoansByDate
);
export default router;
