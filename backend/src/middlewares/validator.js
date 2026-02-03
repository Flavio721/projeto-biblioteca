import { body, param, query, validationResult } from 'express-validator';

const validate = (req, res, next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }
    next();
}

export const authValidation = {
    register: [
        body('name').trim().notEmpty().withMessage('Nome é obrigatório!'),
        body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
        body('password').isLength({min: 6}).withMessage('Senha deve ter no mínimo 6 caracteres'),
        body('cpf').optional().matches(/^\d{11}$/).withMessage('CPF inválido'),
        validate
    ],
    login: [
        body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
        body('password').notEmpty().withMessage('Senha é obrigatória'),
        validate
    ]
};

export const bookValidation = {
    create: [
        body('isbn').notEmpty().withMessage('ISBN é obrigatório'),
        body('title').trim().notEmpty().withMessage('Título é obrigatório'),
        body('author').trim().notEmpty().withMessage('Autor é obrigatório'),
        body('category').trim().notEmpty().withMessage('Categoria é obrigatória'),
        body('quantity').isInt({min: 1}).withMessage('Quantidade deve ser no mínimo 1'),
        validate
    ],
    update: [
        param('id').isInt().withMessage('ID inválido'),
        validate
    ]
};

export const loanValidation = {
    create: [
        body('bookId').isInt().withMessage('ID do livro inválido'),
        validate
    ],
    updateStatus: [
        param('id').isInt().withMessage('ID inválido'),
        body('status').isIn(['ACTIVE', 'RETURNED', 'CANCELLED']).withMessage('Status inválido'),
        validate
    ]
};

export const reviewValidation = {
    create: [
        body('bookId').isInt().withMessage('ID do livro inválido'),
        body('rating').isInt({min: 1, max: 5}).withMessage('Nota deve ser entre 1 e 5'),
        body('comment').optional().trim(),
        validate
    ]
}   