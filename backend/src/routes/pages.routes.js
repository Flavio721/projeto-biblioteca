import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { pageAuth } from "../middlewares/pageAuth.js";

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get("/", pageAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../../frontend/pages/index.html"));
});
router.get("/login", pageAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../../frontend/pages/login.html"));
});
router.get("/cadastro", pageAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../../frontend/pages/cadastro.html"));
});
router.get("/catalogo", pageAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../../frontend/pages/catalogo.html"));
});
router.get("/dashboardUser", pageAuth, (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../frontend/pages/dashboardUser.html"),
  );
});
router.get("/dashboardAdmin", pageAuth, (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../frontend/pages/dashboardAdmin.html"),
  );
});
router.get("/dashboardBibliotecario", pageAuth, (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../frontend/pages/dashboardBibliotecario.html"),
  );
});
router.get("/serverError", pageAuth, (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../frontend/pages/serverError.html"),
  );
});
router.get("/systemConfig", pageAuth, (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../frontend/pages/systemConfigs.html"),
  );
});
router.get("/gerenciar/usuarios", pageAuth, (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../frontend/pages/gerenciarUsuarios.html"),
  );
});
router.get("/gerenciar/emprestimos", pageAuth, (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../frontend/pages/gerenciarEmprestimos.html"),
  );
});
router.get("/gerenciar/livros", pageAuth, (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../frontend/pages/gerenciarLivros.html"),
  );
});
router.get("/systemConfig", pageAuth, (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../frontend/pages/systemConfigs.html"),
  );
});
router.get("/my-emprestimos", pageAuth, (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../frontend/pages/emprestimos.html"),
  );
});
router.get("/perfil", pageAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../../frontend/pages/perfil.html"));
});
router.get("/favoritos", pageAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../../frontend/pages/favorites.html"));
});
router.get("/relatorios", pageAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../../frontend/pages/relatorios.html"));
});
router.get("/novo-livro", pageAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../../frontend/pages/newBook.html"));
});
router.get("/wishlist", pageAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../../frontend/pages/wishlist.html"));
});
router.get("/reservas", pageAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../../frontend/pages/reserva.html"));
});
router.get("/livro/:id", pageAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../../frontend/pages/details.html"));
});
export default router;
