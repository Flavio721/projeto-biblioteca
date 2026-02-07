import rateLimit from 'express-rate-limit';


export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Muitas requisições. Tente novamente em 15 minutos"},
})
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: "Muitas tentativas de login. Tente novamente em 15 minutos"},
})
export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { error: "Muitas tentativas de cadastro. Tente novamente em 1 hora"},
})
export const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 20,
    message: { error: "Muitas requisições à API. Tente novamente em 1 minuto"},
})
export const searchLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 30,
    message: { error: "Muitas buscas. Tente novamente em 1 minuto"},
})