import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../utils/jwt.js';

const prisma = new PrismaClient();

export async function register(req, res){
    try{
        const { name, email, cpf, phone, address, password } = req.body;

        const userExists = await prisma.user.findUnique({
            where: { email }
        });
        if(userExists){
            return res.status(400).json({error: 'Email já cadastrado'});
        }

        const cpfExists = await prisma.user.findUnique({
            where: { cpf }
        });
        if(cpfExists){
            return res.status(400).json({error: 'CPF já cadastrado'})
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                cpf: cpf,
                phone,
                address
            }
        });

        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role
        });

        delete user.password;

        res.status(201).json({
            message: 'Usuário criado com sucesso',
            user,
            token
        });
    }
    catch(error) {
        console.error('Erro ao registrar: ', error);
        res.status(500).json({error: 'Erro ao criar usuário'});
    }
}

export async function login(req, res){
    try{
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if(!user){
            return res.status(401).json({error: 'Email ou senha inválidos'});
        }
        if(!user.isActive){
            return res.status(403).json({error: 'Usuário desativado'});
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if(!validPassword){
            return res.status(401).json({error: 'Email ou senha inválido'});
        }

        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role
        });
        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 60 * 24 // 1 dia
        });
        delete user.password;

        res.json({
            message: 'Login realizado com sucesso',
            user,
            token
        })
    }
    catch(error){
        console.error('Erro ao fazer login: ', error);
        res.status(500).json({error: 'Erro ao fazer login'})
    }
}
export async function me(req, res){
    try{
        const user = await prisma.user.findUnique({
            where: {id: req.user.id},
            select: {
                id: true,
                name: true,
                email: true,
                cpf: true,
                phone: true,
                address: true,
                role: true,
                isActive: true,
                avatarUrl: true,
                createdAt: true
            }
        });
        res.json({ user });
    }
    catch(error){
        res.status(500).json({error: 'Erro ao buscar dados do usuário'})
    }
}