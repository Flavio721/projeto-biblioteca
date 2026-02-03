import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function create(req, res) {
  try {
    console.log('BODY:', req.body);
    console.log('FILE:', req.file);

    const {
      isbn,
      title,
      author,
      category,
      publisher,
      publishYear,
      pages,
      language,
      description,
      quantity,
      location
    } = req.body;

    if (!isbn || !title || !author || !quantity) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    const imageUrl = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    const book = await prisma.book.create({
      data: {
        isbn,
        title,
        author,
        category,
        publisher: publisher || null,
        publishYear: publishYear ? Number(publishYear) : null,
        pages: pages ? Number(pages) : null,
        language,
        description: description || null,
        quantity: Number(quantity),
        location: location || null,
        coverImage: imageUrl
      }
    });

    return res.status(201).json(book);

  } catch (error) {
    console.error('CREATE BOOK ERROR:', error);
    return res.status(500).json({ error: 'Erro ao criar livro' });
  }
}

export async function list(req, res){
    try{
        const{
            search, category, status, page = 1, limit = 10, sortBy = 'title', order = 'asc',
        } = req.query;

        const skip = (page - 1) * limit;
        const where = {};

        if(search){
            where.OR = [
                {title: {contains: search, mode: 'insensitive'} },
                {author: {contains: search, mode: 'insensitive'} },
                {isbn: {contains: search, mode: 'insensitive'} },
            ]
        }
        if (category) where.category = category;
        if (status) where.status = status;

        const [books, total] = await Promise.all([
            prisma.book.findMany({
                where,
                skip: parseInt(skip),
                take: parseInt(limit),
                orderBy: { [sortBy]: order},
                include: {
                    _count: {
                        select: { reviews: true}
                    }
                }
            }),
            prisma.book.count({ where })
        ]);
        const booksWithRatings = await Promise.all(
            books.map(async (book) => {
                const reviews = await prisma.review.findMany({
                    where: { bookId: book.id },
                    select: { rating: true }
                });
                const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
                return {
                    ...book,
                    averageRating: Math.round(avgRating * 10) / 10,
                    reviewCount: reviews.length
                };
            })
        );
        res.json({
            books: booksWithRatings,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch(error) {
        console.error('Erro ao listar os livros', error);
        res.status(500).json({error: 'Erro ao listar os livros'})
    }
};
export async function getById(req, res){
    try{
        const id = Number(req.params.id);
        
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        const book = await prisma.book.findUnique({
            where: { id: id},
            include: {
                reviews: {
                    include: {
                        user: {
                            select: {id: true, name: true}
                        }
                    },
                    orderBy: {createdAt: 'desc'}
                },
                _count: {
                    select: { loans: true }
                }
            }
        });
        if(!book){
            return res.status(404).json({error: 'Livro não encontrado'});
        }

        const avgRating = book.reviews.length > 0 ? book.reviews.reduce((sum, r) => sum + r.rating, 0) / book.reviews.length : 0;

        res.json({
            ...book,
            averageRating: Math.round(avgRating * 10) / 10
        });
     }
     catch(error) {
        console.error('Erro ao buscar o livro: ', error);
        res.status(500).json({error: 'Erro ao buscar livro'});
     }
};
export async function update(req, res){
    try{
        const { id } = req.params;
        const updateData = { ...req.body };

        if(req.file){
            updateData.coverImage = `/uploads/${req.file.filename}`;
        }

        if(updateData.publishYear) updateData.publishYear = parseInt(updateData.publishYear);
        if(updateData.pages) updateData.pages = parseInt(updateData.pages);
        if(updateData.quantity) updateData.quantity = parseInt(updateData.quantity);

        const book = await prisma.book.update({
            where: { id: parseInt(id) },
            data: updateData
        })
        res.json({
            message: 'Livro atualizado com sucesso',
            book
        });
    } catch (error){
        if(error.code === 'P2025'){
            return res.status(404).json({error: 'Livro não encontrado'});
        }
        console.error('Erro ao atualizar o livro: ', error);
        res.status(500).json({error: 'Erro ao atualizar o livro'});
    }
}

export async function remove(req, res){
    try{
        const { id } = req.params;

        const activeLoans = await prisma.loan.count({
            where: {
                bookId: parseInt(id),
                status: { in: ['PENDING', 'ACTIVE']}
            }
        });
        if(activeLoans > 0){
            return res.status(400).json({
                error: 'Não é possível deletar. Existem empréstimos ativos deste livro'
            });
        }
        await prisma.book.delete({
            where: { id: parseInt(id) }
        });

        res.json({message: 'Livro deletado com sucesso'});
    } catch(error) {
        if(error.code === 'P2025'){
            res.status(404).json({error: 'Livro não encontrado'});
        }
        console.error('Não foi possível remover o livro: ', error);
        res.status(500).json({error: 'Erro ao deletar o livro'});
    }
}

export async function getCategories(req, res){
    try{
        const categories = await prisma.book.findMany({
            select: { category: true },
            distinct: ['category'] 
        });

        res.json({
            categories: categories.map(c => c.category).sort()
        });
    } catch (error){
        console.error('Erro ao buscar categorias: ', error);
        res.status(500).json({error: 'Erro ao buscar categorias'});
    }
}
export async function popularBooks(req, res){
    try{
        const books = await prisma.book.findMany({
            include: {
                _count: {
                select: { loans: true }
                },
            },
            orderBy: {
                loans: {
                _count: 'desc'
                }
            }
        });

        return res.json({
            books: books
        });
    }catch(error) {
        console.error("Erro: ", error);
        return res.status(500).json({ error: "Erro na busca dos livros"} );
    }
}
export async function popularCategories(req, res) {
    try {
        // Agrupa empréstimos por bookId e conta
        const loansByBook = await prisma.loan.groupBy({
            by: ['bookId'],
            _count: {
                id: true
            },
            orderBy: {
                _count: {
                    id: 'desc'
                }
            }
        });

        // Busca as informações dos livros
        const bookIds = loansByBook.map(item => item.bookId);
        const books = await prisma.book.findMany({
            where: {
                id: { in: bookIds }
            },
            select: {
                id: true,
                category: true,
                title: true
            }
        });

        // Agrupa por categoria
        const categoryStats = {};
        loansByBook.forEach(loan => {
            const book = books.find(b => b.id === loan.bookId);
            if (book) {
                if (!categoryStats[book.category]) {
                    categoryStats[book.category] = {
                        category: book.category,
                        totalLoans: 0,
                        books: []
                    };
                }
                categoryStats[book.category].totalLoans += loan._count.id;
                categoryStats[book.category].books.push({
                    title: book.title,
                    loans: loan._count.id
                });
            }
        });

        // Converte para array e ordena
        const result = Object.values(categoryStats)
            .sort((a, b) => b.totalLoans - a.totalLoans);

        return res.json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao buscar categorias populares' });
    }
}