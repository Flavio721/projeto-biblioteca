import { Router } from "express";
import path from 'path';
import { fileURLToPath } from "url";
import { isAdmin, checkRole } from "../middlewares/roles.js";
import { pageAuth } from "../middlewares/pageAuth.js";

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/pages/index.html'));
})
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/pages/login.html'));
})
router.get('/cadastro', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/pages/cadastro.html'));
})
router.get('/catalogo',  (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/pages/catalogo.html'));
})
router.get('/dashboardUser', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/pages/dashboardUser.html'));
})
router.get('/dashboardAdmin', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/pages/dashboardAdmin.html'));
})
router.get('/dashboardBibliotecario', (req, res) => {   
    res.sendFile(path.join(__dirname, '../../../frontend/pages/dashboardBibliotecario.html'));
})
router.get('/serverError',  (req, res) => {   
    res.sendFile(path.join(__dirname, '../../../frontend/pages/serverError.html'));
})
router.get('/systemConfig', (req, res) => {   
    res.sendFile(path.join(__dirname, '../../../frontend/pages/systemConfigs.html'));
})
router.get('/gerenciar/usuarios', (req, res) => {   
    res.sendFile(path.join(__dirname, '../../../frontend/pages/gerenciarUsuarios.html'));
})
router.get('/gerenciar/emprestimos',  (req, res) => {   
    res.sendFile(path.join(__dirname, '../../../frontend/pages/gerenciarEmprestimos.html'));
})
router.get('/gerenciar/livros', (req, res) => {   
    res.sendFile(path.join(__dirname, '../../../frontend/pages/gerenciarLivros.html'));
})
router.get('/systemConfig', (req, res) => {   
    res.sendFile(path.join(__dirname, '../../../frontend/pages/systemConfigs.html'));
})
router.get('/my-emprestimos', (req, res) => {   
    res.sendFile(path.join(__dirname, '../../../frontend/pages/emprestimos.html'));
})
router.get('/perfil', (req, res) => {   
    res.sendFile(path.join(__dirname, '../../../frontend/pages/perfil.html'));
})
router.get('/favoritos', (req, res) => {   
    res.sendFile(path.join(__dirname, '../../../frontend/pages/favorites.html'));
})
router.get('/relatorios', (req, res) => {   
    res.sendFile(path.join(__dirname, '../../../frontend/pages/relatorios.html'));
})
router.get('/novo-livro', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/pages/newBook.html'));
})
router.get('/livro/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/pages/details.html'));
})
export default router