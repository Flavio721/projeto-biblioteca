export class AppError extends Error{
    constructor(message, statusCode){
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

const errorHandle = (err, req, res, next) =>{
    let { statusCode, message} = err;

    if(!statusCode) statusCode = 500;
    if(!message) message = 'Erro interno do servidor';

    console.error('Erro: ', {
        message: err.message,
        statusCode,
        stack: process.env.NODE_ENV === 'development' ? err.stack: undefined
    });

    // Erros do prisma
    if(err.code === 'P2002'){
        statusCode = 400;
        message = 'Esse registro já existe';
    };
    if(err.code === 'P2025'){
        statusCode = 404;
        message = 'Registro não encontrado';
    }

    // Erro do multer
    if(err.name === 'MulterError'){
        statusCode = 400;
        message = 'Erro no upload do arquivo';
    }

    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    })
}


export default errorHandle