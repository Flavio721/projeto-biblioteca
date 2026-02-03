import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function create(req, res){
    try{
        const { bookId, rating, comment } = req.body;
        const userId = req.user.id;

        const book = await prisma.book.findUnique({
            where: { id: parseInt(bookId) }
        });

        if(!book){
            return res.status(404).json({error: 'Livro não encontrado'});
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
            return res.status(400).json({error: 'Você já avaliou este livro'});
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

        res.status(201).json({
            message: 'Avaliação criada com sucesso',
            review
        });
    }catch (error) {
        console.error('Erro ao criar avaliação: ', error);
        res.status(500).json({error: 'Erro ao criar avaliação'});
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
            return res.status(404).json({error: 'A avaliação não existe'});
        }
        if(review.userId !== req.user.id){
            return res.status(403).json({error: 'Acesso negado'});
        }
        
        const updatedReview = await prisma.review.update({
            where: { id: parseInt(id) },
            data: {
                rating: rating ? parseInt(rating) : undefined,
                comment
            }
        });

        res.json({
            message: 'Avaliação atualizada com sucesso',
            comment
        });
    }catch (error) {
        console.error('Erro ao atualizar avaliação: ', error);
        res.status(500).json({error: 'Erro ao atualizar avaliação'});
    }
}
export async function remove(req, res){
    try{
        const { id } = req.params;

        const review = await prisma.review.findUnique({
            where: { id: parseInt(id) }
        });

        if(!review){
            return res.status(404).json({error: 'Avaliação não encontrada'});
        }

        if(review.userId !== req.user.id){
            return res.status(403).json({error: 'Acesso negado'});
        }

        await prisma.review.delete({
            where: { id: parseInt(id) }
        });
        res.json({message: 'Avaliação deletada com sucesso'});
    }catch (error) {
        console.error('Erro ao deletar avaliação: ', error);
        res.status(500).json({error: 'Erro ao deletar avaliação'});
    }
}