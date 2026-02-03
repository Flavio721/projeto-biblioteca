import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function favorite(req, res){
    try{
        const { bookId } = req.body;
        const userId = req.user.id;

        if(!bookId){
            return res.status(400).json({error: 'BookID é obrigatório'});
        }

        const favoriteExists = await prisma.favorite.findFirst({
            where: {
                userId: userId,
                bookId: bookId
            }
        });
        if(favoriteExists){
            return res.status(400).json({error: 'Você já favoritou este livro!'});
        }

        const favorite = await prisma.favorite.create({
            data: {
                userId: userId,
                bookId: bookId,
            },
            include: {
                user: {
                    select: { id: true, name: true}
                }
            }
        })
        res.status(201).json({
            message: 'Favoritado com sucesso',
            favorite
        });
    } catch(error){
        console.error('Erro ao favoritar: ', error);
        return res.status(500).json({error: 'Erro ao favoritar'});
    }
}
export async function countFavorites(req, res){
    try{
        const userId = req.user.id;

        const total = await prisma.favorite.count({
            where: {
                userId
            }
        });
        return res.json({total})
    }catch (error){
        console.error("Erro ao contar favoritos: ", error);
        res.status(500).json({error: 'Erro ao contar favoritos'});
    }
}
export async function viewAllFavorites(req, res){
    try{
        const userId = req.user.id;

        const favorites = await prisma.favorite.findMany({
            where: { userId: userId},
            select: { bookId: true }
        });

        const bookIds = favorites.map(f => f.bookId);

        res.json({bookIds});
    } catch (error){
        console.error("Erro ao buscar favoritos: ", error);
        res.status(500).json({error: 'Erro ao buscar favoritos'})
    }
}
export async function desfavorite(req, res){
    try{
        const bookId = Number(req.query.bookId);
        const userId = Number(req.user.id);

        if (!Number.isInteger(userId) || !Number.isInteger(bookId)) {
            return res.status(400).json({ error: 'ID inválido' });
        }
        
        const favoriteExists = await prisma.favorite.findUnique({
            where: { 
                userId_bookId: {
                    userId,
                    bookId
                }
            }
        });
        if(!favoriteExists){
            return res.status(404).json({error: 'Este livro não está marcado como favorito'});
        }
        const favoriteRemove = await prisma.favorite.delete({
            where: { 
                userId_bookId: {
                    userId,
                    bookId
                }
            }
        });
        return res.status(200).json({
            message: "Livro removido dos favoritos"
        })
    }catch(error) {
        console.error("Erro ao remover dos favoritos: ", error);
        res.status(500).json({ error: "Erro ao remover dos favoritos"});
    }
}
export async function update(req, res){
    try{
        const { name, cpf, email, phone, address} = req.body;
        const userId = req.user.id;

        const userExists = await prisma.user.findUnique({
            where: { id: parseInt(userId) }
        });
        if(!userExists){
            return res.status(404).json({ error: "Usuário não encontrado"});
        }
        const updateUser = await prisma.user.update({
            where: { id: parseInt(userId) },
            data: {
                name: name,
                cpf: cpf,
                email: email,
                phone: phone,
                address: address
            }
        });
        return res.status(200).json({
            message: "Usuário atualizado",
            updateUser
        });
    }catch(error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao atualizar usuário"});
    }
}
export async function uploadProfileImage(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'Imagem não enviada'
            });
        }

        const userId = Number(req.user.id);
        const imagePath = `/uploads/${req.file.filename}`;

        await prisma.user.update({
            where: { id: userId },
            data: {
                avatarUrl: imagePath
            }
        });

        return res.status(200).json({
            message: 'Imagem atualizada com sucesso',
            imageUrl: imagePath
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'Erro ao salvar imagem'
        });
    }
}
export async function newPassword(req, res) {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = Number(req.user.id);

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: 'Senha atual e nova senha são obrigatórias'
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({
                error: 'Usuário não encontrado'
            });
        }

        const passwordMatch = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                error: 'Senha atual incorreta'
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword
            }
        });

        return res.status(200).json({
            message: 'Senha atualizada com sucesso'
        });

    } catch (error) {
        console.error('Erro ao atualizar senha:', error);
        return res.status(500).json({
            error: 'Erro na atualização da senha'
        });
    }
}
export async function popularUsers(req, res){
    try{
        const users = await prisma.user.findMany({
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

        const formattedUsers = users.map(user => ({
            id: user.id,
            name: user.name,
            role: user.role,
            totalLoans: user._count.loans
        }));
        return res.json({
            users: formattedUsers
        });
    }catch(error) {
        console.error("Erro: ", error);
        return res.status(500).json({ error: "Erro na busca"} );
    }
}

export async function addWishList(req, res){
    try{
        const { bookId } = req.body;
        const userId = req.user.id;

        const wishlist = await prisma.wishlist.findFirst({
            where: { userId: userId,
                    isDefault: true
                }
        });
        if(!wishlist){
            return res.status(404).json({ error: "Lista de desejos não encontrada" })
        }

        const alreadyExists = await prisma.wishlistItem.findUnique({
            where: {
                wishlistId_bookId: {
                    wishlistId: wishlist.id,
                    bookId
                }
            }
        });
        
        if(alreadyExists){
            return res.status(409).json({ error: "Livro já está na lista de desejos"})
        };

        const registerItem = await prisma.wishlistItem.create({
            data: {
                wishlistId: wishlist.id,
                bookId
            }
        });

        return res.status(201).json({
            message: "Livro adicionado na lista de desejos",
            item: registerItem
        });
    }catch(error){
        console.error("Erro: ", error);
        return res.status(500).json({ error: "Erro para adicionar livro na lista de desejos"});
    }

}