import { PrismaClient } from "@prisma/client";
import { AppError } from '../middlewares/errorHandle.js';


const prisma = new PrismaClient();

export async function create(req, res){
    try{
        const { bookId, rating, comment } = req.body;
        const userId = req.user.id;

        const book = await prisma.book.findUnique({
            where: { id: parseInt(bookId) }
        });

        if(!book){
            return next(new AppError('Livro não encontrado', 404));
        }

        const existingReview = await prisma.review.findUnique({
            where: {
                userId_bookId: {
                    userId,
                    bookId: parseInt(bookId)
                }
            }
        });

        if(existingReview){
            return next(new AppError('Você já avaliou este livro', 400));
        }

        const review = await prisma.review.create({
            data: {
                userId,
                bookId: parseInt(bookId),
                rating: parseInt(rating),
                comment
            },
            include: {
                user: {
                    select: { id: true, name: true}
                }
            }
        });

        return res.status(201).json({
            message: 'Avaliação criada com sucesso',
            review
        });
    }catch (error) {
        console.error('Erro ao criar avaliação: ', error);
        return next(new AppError('Erro ao criar avaliação', 500));
    }
}
export async function update(req, res){
    try{
        const { id } = req.params;
        const { rating, comment } = req.body;

        const review = await prisma.review.findUnique({
            where: { id: parseInt(id) } 
        });
        if(!review){
            return next(new AppError('Avaliação não encontrada', 404));
        }
        if(review.userId !== req.user.id){
            return next(new AppError('Acesso negado', 403));
        }
        
        const updatedReview = await prisma.review.update({
            where: { id: parseInt(id) },
            data: {
                rating: rating ? parseInt(rating) : undefined,
                comment
            }
        });

        return res.status(200).json({
            message: 'Avaliação atualizada com sucesso',
            review: updatedReview
        });
    }catch (error) {
        console.error('Erro ao atualizar avaliação: ', error);
        return next(new AppError('Erro ao atualizar avaliação', 500));
    }
}
export async function remove(req, res){
    try{
        const { id } = req.params;

        const review = await prisma.review.findUnique({
            where: { id: parseInt(id) }
        });

        if(!review){
            return next(new AppError('Avaliação não encontrada', 404));
        }

        if(review.userId !== req.user.id){
            return next(new AppError('Acesso negado', 403));
        }

        await prisma.review.delete({
            where: { id: parseInt(id) }
        });
        return res.status(200).json({message: 'Avaliação deletada com sucesso'});
    }catch (error) {
        console.error('Erro ao deletar avaliação: ', error);
        return next(new AppError('Erro ao deletar avaliação', 500));
    }
}