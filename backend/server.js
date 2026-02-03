import app from "./app.js";

const PORT = process.env.PORT || 3000;


app.listen(PORT, () => {
    console.log('=================================');
  console.log('📚 Biblioteca Digital API');
  console.log('=================================');
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Prisma Studio: npx prisma studio`);
  console.log('=================================');
})