import { verifyToken } from "../utils/jwt.js";

export function pageAuth(req, res, next){
    const token = req.cookies?.token ||
      req.headers.authorization?.split(' ')[1];

    if(!token){
        return res.redirect('/login');
    }

    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch {
        return res.redirect('/login');
    }
}
