import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import routes from './src/routes/index.js';
import pageRoutes from './src/routes/pages.routes.js';
import errorHandle from './src/middlewares/errorHandle.js';
import { generalLimiter } from './src/config/rateLimit.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    '/uploads',
    express.static(path.join(__dirname, '/uploads'))
);

if(process.env.NODE_ENV === 'development'){
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    })
}

app.get('/api-service', (req, res) => {
    res.json({
        message: '📚 API Biblioteca Digital',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            books: '/api/books',
            loans: '/api/loans',
            reviews: '/api/reviews',
            users: '/api/users',
            dashboard: '/api/dashboard'
        }
    });
});

app.use('/api', generalLimiter, routes);
app.use('/', pageRoutes);


app.post('/api/users/favoritar', (req, res) => {
  res.json({ ok: true });
});


app.use(errorHandle);

export default app;