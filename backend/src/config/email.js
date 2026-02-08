import nodemailer from "nodemailer";

// Criar transporter (configuração SMTP)
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true", // true para porta 465, false para outras
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verificar conexão (opcional, útil para debug)
export async function verifyEmailConnection() {
  try {
    await transporter.verify();
    console.log("✅ Servidor de email conectado");
    return true;
  } catch (error) {
    console.error("❌ Erro ao conectar servidor de email:", error);
    return false;
  }
}
