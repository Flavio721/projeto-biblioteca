import { PrismaClient } from "@prisma/client";
import { addDays, calculateFine } from "../utils/dateHelper.js";

const prisma = new PrismaClient();

export async function create(req, res){
    try{
        const { bookId } = req.body;
        const userId = req.user.id;

        const book = await prisma.book.findUnique({
            where: { id: parseInt(bookId) }
        });

        if(!book){
            return res.status(404).json({error: 'Livro não encontrado'});
        }
        if(book.availableQty < 1){
            return res.status(400).json({error: 'Livro indisponível no momento'});
        }

        const existingLoan = await prisma.loan.findFirst({
            where: {
                userId,
                bookId: parseInt(bookId),
                status: { in: ['PENDING', 'ACTIVE']}
            }
        });

        if(existingLoan){
            return res.status(400).json({error: 'Você já possui um empréstimo ativo deste livro'});
        }

        const overdueLoans = await prisma.loan.count({
            where: {
                userId,
                status: 'OVERDUE'
            }
        });

        if(overdueLoans > 0){
            return res.status(403).json({error: 'Você já possui empréstimos em atraso. Regularize sua situação primeiro'});
        }

        const config = await prisma.systemConfig.findUnique({
            where: { key: 'DEFAULT_LOAN_DAYS'}
        });
        const loanDays = config ? parseInt(config.value) : 14;

        const loan = await prisma.loan.create({
            data: {
                userId,
                bookId: parseInt(bookId),
                dueDate: addDays(new Date(), loanDays),
                status: 'PENDING'
            },
            include: {
                book: {
                    select: { title: true, author: true}
                }
            }
        });

        await prisma.book.update({
            where: { id: parseInt(bookId)},
            data: {
                availableQty: { decrement: 1},
                status: book.availableQty - 1 === 0 ? 'BORROWED' : book.status
            }
        });
        sendLoanConfirmationEmail(loan.user, loan.book, loan)
            .catch(err => console.error('Erro ao enviar email:', err));
        return res.status(201).json({
            message: 'Solicitação de empréstimo criada com sucesso',
            loan
        });
    } catch (error) {
        console.error('Erro ao criar empréstimo: ', error);
        res.status(500).json({error: 'Erro ao criar emprést1imo'})
    }
}
export async function updateStatus(req, res){
    try{
        const { id } = req.params;
        const { status, notes } = req.body;

        const loan = await prisma.loan.findUnique({
            where: { id: parseInt(id) },
            include: { book: true }
        });
        if(!loan){
            return res.status(404).json({error: 'Empréstimo não encontrado'});
        }

        const updateData = { status };
        if(notes) updateData.notes = notes;

        if(status === 'RETURNED'){
            updateData.returnDate = new Date();

            const config = await prisma.systemConfig.findUnique({
                where: { key: 'FINE_PER_DAY'}
            });
            const finePerDay = config ? parseFloat(config.value) : 2.50;
            updateData.fineAmount = calculateFine(loan.dueDate, new Date(), finePerDay);

            await prisma.book.update({
                where: { id: loan.bookId },
                data: {
                    availableQty: { increment: 1 },
                    status: 'AVAILABLE'
                }
            });
        }
        const updatedLoan = await prisma.loan.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                book: true,
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        });
        res.json({
            message: 'Status atualizado com sucesso',
            loan: updatedLoan
        });
    } catch (error) {
        console.error('Erro ao atualizar status: ', error);
        res.status(500).json({error: 'Erro ao atualizar status'});
    }
}

export async function renew(req, res){
    try{
        const { id } = req.params;

        const loan = await prisma.loan.findUnique({
            where: { id: parseInt(id) }
        });

        if(!loan){
            return res.status(404).json({error: 'Empréstimo não encontrado'});
        }

        if(loan.userId !== req.user.id){
            return res.status(400).json({error: 'Acesso negado'});
        }
        if(new Date() > new Date(loan.dueDate)){
            return res.status(400).json({
                error: 'Não é possível renovar um empréstimo atrasado'
            });
        }

        const maxRenewals = await prisma.systemConfig.findUnique({
            where: { key: 'MAX_RENEALS' }
        });
        const maxRenewalsCount = maxRenewals ? parseInt(maxRenewals.value) : 2;

        if(loan.renewalCount >= maxRenewalsCount){
            return res.status(400).json({
                error: `Limite de renovações atingido (${maxRenewalsCount})`
            });
        }

        const loanDays = 14;
        const updatedLoan = await prisma.loan.update({
            where: { id: parseInt(id) },
            data: {
                dueDate: addDays(new Date(loan.dueDate), loanDays),
                renewalCount: { increment: 1 }
            }
        });
        res.json({
            message: 'Empréstimo renovado com sucesso',
            loan: updatedLoan
        });
    } catch (error) {
        console.error('Erro ao renovar empréstimo: ', error);
        res.status(500).json({error: 'Erro ao renovar empréstimo'});
    }
};

export async function getMyLoans(req, res){
    try{
        const { id } = req.user.id;

        const loans = await prisma.loan.findMany({
            where: { userId: id },
            include: {
                book: {
                    select: {
                        id: true,
                        title: true,
                        author: true,
                        coverImage: true,
                        isbn: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({loans})
    } catch (error) {
        console.error('Erro ao buscar meus empréstimos: ', error);
        res.status(500).json({error: 'Erro ao buscar meus empréstimos'});
    }
}


export async function getLoansByDate(req, res) {
    const startDate = req.query.startDate || req.query.start;
    const endDate = req.query.endDate || req.query.end;


    if (!startDate || !endDate) {
        return res.status(400).json({
            error: "Informe a data inicial e final"
        });
    }

    // início do dia
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);

    // início do dia seguinte
    const end = new Date(endDate);
    end.setUTCHours(0, 0, 0, 0);
    end.setUTCDate(end.getUTCDate() + 1);

    const loans = await prisma.loan.findMany({
        where: {
            createdAt: {
                gte: start,
                lt: end
            }
        },
        include: {
            user: {
                select: { name: true }
            },
            book: {
                select: { title: true }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });


    return res.json(loans);
}
export async function getAllFine(req, res){
    try{
        const allFines = await prisma.loan.findMany({
            where: {
                fineAmount: {
                    gt: 0
                }
            },
            include: {
                user: {
                    select: { name: true }
                }
            }
        });

        return res.json({
            allFines: allFines
        });
    }catch(error){
        console.error("Erro: ", error);
        return res.status(500).json({ error: "Erro na busca" });
    }
}