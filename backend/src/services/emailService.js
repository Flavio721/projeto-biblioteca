import { transporter } from "../config/email.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Envia email genérico
 */
export async function sendEmail({ to, subject, html, text }) {
  try {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      text, // Versão texto plano
      html, // Versão HTML
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email enviado:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Erro ao enviar email:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Email de confirmação de empréstimo
 */
export async function sendLoanConfirmationEmail(user, book, loan) {
  const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #6366f1; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9fafb; }
                .book-info { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #6366f1; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                .button { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📚 Empréstimo Confirmado!</h1>
                </div>
                <div class="content">
                    <p>Olá, <strong>${user.name}</strong>!</p>
                    <p>Seu empréstimo foi aprovado com sucesso.</p>
                    
                    <div class="book-info">
                        <h3>📖 Detalhes do Livro:</h3>
                        <p><strong>Título:</strong> ${book.title}</p>
                        <p><strong>Autor:</strong> ${book.author}</p>
                        <p><strong>ISBN:</strong> ${book.isbn}</p>
                    </div>
                    
                    <div class="book-info">
                        <h3>📅 Prazos:</h3>
                        <p><strong>Data de Empréstimo:</strong> ${new Date(loan.loanDate).toLocaleDateString("pt-BR")}</p>
                        <p><strong>Data de Devolução:</strong> ${new Date(loan.dueDate).toLocaleDateString("pt-BR")}</p>
                        <p><strong>Renovações Disponíveis:</strong> ${process.env.MAX_RENEWALS || 2}</p>
                    </div>
                    
                    <p>⚠️ <strong>Importante:</strong> Lembre-se de devolver o livro até a data indicada para evitar multas.</p>
                    
                    <center>
                        <a href="http://localhost:3000/meus-emprestimos" class="button">Ver Meus Empréstimos</a>
                    </center>
                </div>
                <div class="footer">
                    <p>Biblioteca Digital - Sistema de Gerenciamento</p>
                    <p>Este é um email automático, por favor não responda.</p>
                </div>
            </div>
        </body>
        </html>
    `;

  const text = `
Olá, ${user.name}!

Seu empréstimo foi aprovado com sucesso.

Detalhes do Livro:
- Título: ${book.title}
- Autor: ${book.author}
- ISBN: ${book.isbn}

Prazos:
- Data de Empréstimo: ${new Date(loan.loanDate).toLocaleDateString("pt-BR")}
- Data de Devolução: ${new Date(loan.dueDate).toLocaleDateString("pt-BR")}

Lembre-se de devolver o livro até a data indicada para evitar multas.

Biblioteca Digital
    `;

  return await sendEmail({
    to: user.email,
    subject: "📚 Empréstimo Confirmado - Biblioteca Digital",
    html,
    text,
  });
}

/**
 * Email de lembrete de devolução
 */
export async function sendReturnReminderEmail(user, book, loan, daysRemaining) {
  const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #fffbeb; }
                .warning { background: #fef3c7; padding: 15px; margin: 15px 0; border-left: 4px solid #f59e0b; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⏰ Lembrete de Devolução</h1>
                </div>
                <div class="content">
                    <p>Olá, <strong>${user.name}</strong>!</p>
                    
                    <div class="warning">
                        <h3>📖 Livro para Devolução:</h3>
                        <p><strong>${book.title}</strong></p>
                        <p>Prazo: ${new Date(loan.dueDate).toLocaleDateString("pt-BR")}</p>
                        <p><strong>Faltam ${daysRemaining} dia(s) para a devolução!</strong></p>
                    </div>
                    
                    <p>Por favor, providencie a devolução para evitar multas.</p>
                </div>
            </div>
        </body>
        </html>
    `;

  return await sendEmail({
    to: user.email,
    subject: `⏰ Lembrete: Devolução em ${daysRemaining} dia(s)`,
    html,
    text: `Olá, ${user.name}! Lembre-se de devolver "${book.title}" em ${daysRemaining} dia(s).`,
  });
}

/**
 * Email de empréstimo atrasado
 */
export async function sendOverdueNotificationEmail(
  user,
  book,
  loan,
  daysOverdue,
) {
  const fine = daysOverdue * parseFloat(process.env.FINE_PER_DAY || 2.5);

  const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #fef2f2; }
                .alert { background: #fee2e2; padding: 15px; margin: 15px 0; border-left: 4px solid #ef4444; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⚠️ Empréstimo Atrasado</h1>
                </div>
                <div class="content">
                    <p>Olá, <strong>${user.name}</strong>,</p>
                    
                    <div class="alert">
                        <h3>📖 Livro Atrasado:</h3>
                        <p><strong>${book.title}</strong></p>
                        <p>Prazo de devolução: ${new Date(loan.dueDate).toLocaleDateString("pt-BR")}</p>
                        <p><strong>Atrasado há ${daysOverdue} dia(s)</strong></p>
                        <p><strong>Multa acumulada: R$ ${fine.toFixed(2)}</strong></p>
                    </div>
                    
                    <p>Por favor, providencie a devolução o quanto antes para evitar o acúmulo de multas.</p>
                </div>
            </div>
        </body>
        </html>
    `;

  return await sendEmail({
    to: user.email,
    subject: "⚠️ URGENTE: Empréstimo Atrasado",
    html,
    text: `ATENÇÃO: O livro "${book.title}" está atrasado há ${daysOverdue} dia(s). Multa: R$ ${fine.toFixed(2)}`,
  });
}

/**
 * Verifica empréstimos atrasados e envia emails
 */
export async function verificarEmprestimosAtrasados() {
  try {
    console.log("🔍 Verificando empréstimos atrasados...");

    const hoje = new Date();

    // Buscar apenas empréstimos com status OVERDUE ou que já passaram da data
    const overdueLoans = await prisma.loan.findMany({
      where: {
        OR: [
          { status: "OVERDUE" },
          {
            AND: [
              { status: "ACTIVE" },
              { dueDate: { lt: hoje } }, // Vencimento passou
              { returnDate: null },
            ],
          },
        ],
      },
      include: {
        user: true,
        book: true,
      },
    });

    console.log(`📊 Encontrados ${overdueLoans.length} empréstimos atrasados`);

    // Processar cada empréstimo atrasado
    for (const loan of overdueLoans) {
      const diasAtrasados = Math.floor(
        (hoje - new Date(loan.dueDate)) / (1000 * 60 * 60 * 24),
      );

      console.log(
        `⚠️  ${loan.user.name} - ${loan.book.title}: ${diasAtrasados} dias`,
      );

      // Atualizar status se necessário
      if (loan.status !== "OVERDUE") {
        await prisma.loan.update({
          where: { id: loan.id },
          data: {
            status: "OVERDUE",
            fineAmount:
              diasAtrasados * parseFloat(process.env.FINE_PER_DAY || 2.5),
          },
        });
      }

      // Enviar email
      await sendOverdueNotificationEmail(
        loan.user,
        loan.book,
        loan,
        diasAtrasados,
      );
    }

    console.log("✅ Empréstimos atrasados processados\n");
  } catch (error) {
    console.error("❌ Erro ao verificar empréstimos atrasados:", error);
  }
}

/**
 * Envia lembretes para empréstimos próximos do vencimento
 */
export async function enviarLembretesVencimento(diasAntes = 2) {
  try {
    console.log(
      `🔍 Verificando empréstimos próximos do vencimento (${diasAntes} dias)...`,
    );

    const hoje = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + diasAntes);

    // Buscar empréstimos que vencem nos próximos X dias
    const upcomingLoans = await prisma.loan.findMany({
      where: {
        status: "ACTIVE",
        dueDate: {
          gte: hoje, // Maior ou igual a hoje
          lte: dataLimite, // Menor ou igual a data limite
        },
        returnDate: null,
      },
      include: {
        user: true,
        book: true,
      },
    });

    console.log(
      `📊 Encontrados ${upcomingLoans.length} empréstimos próximos do vencimento`,
    );

    // Enviar lembrete para cada um
    for (const loan of upcomingLoans) {
      const diasRestantes = Math.ceil(
        (new Date(loan.dueDate) - hoje) / (1000 * 60 * 60 * 24),
      );

      console.log(
        `📧 Lembrete para ${loan.user.name} - ${diasRestantes} dias restantes`,
      );

      await sendReturnReminderEmail(loan.user, loan.book, loan, diasRestantes);
    }

    console.log("✅ Lembretes enviados\n");
  } catch (error) {
    console.error("❌ Erro ao enviar lembretes:", error);
  }
}

/**
 * Executa todas as verificações
 */
export async function executarVerificacoes() {
  console.log("\n⏰ ===== VERIFICAÇÃO AUTOMÁTICA DE EMPRÉSTIMOS =====\n");

  await verificarEmprestimosAtrasados();
  await enviarLembretesVencimento(2); // 2 dias antes

  console.log("⏰ ===== VERIFICAÇÃO CONCLUÍDA =====\n");
}
