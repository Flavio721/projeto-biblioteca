// import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';


const prisma = new PrismaClient();

// const createUser = async (data = {}) => {
//   const defaultData = {
//     name: 'Test User',
//     email: 'test@test.com',
//     password: await bcrypt.hash('password1234', 10),
//     role: 'USER',
//     ...data
//   };

//   return await prisma.user.create({
//     data: defaultData
//   });
// };

// const createAdmin = async () => {
//   return await createUser({
//     name: 'Librarian User 2',
//     email: 'librarian2@test.com',
//     role: 'LIBRARIAN'
//   });
// };
// createAdmin();
async function deleteUser(){
  const deleteUser = await prisma.user.delete({
    where: { id: 9 }
  });
  

  const findUserDelete = await prisma.user.findUnique({
    where: { id: 9}
  });
  if(findUserDelete){
    console.log("Não deletou o usuário");
    return;
  }
  console.log("Deletou o usuário");
  return;
}

async function overdueLoan(){
  const overdueLoan = await prisma.loan.create({
    data: {
      userId: 6,
      bookId: 2,
      loanDate: "2026-01-13T15:05:59.974Z",
      dueDate: "2026-01-21T15:05:59.974Z",
      returnDate: null,
      renewalCount: 0,
      status: 'OVERDUE',
      createdAt: "2026-01-13T15:05:59.974Z",
      updatedAt: "2026-01-13T15:05:59.974Z"
    }
  });

  const findOverdueLoan = await prisma.loan.findUnique({
    where: { id: 3 }
  });

  if(!findOverdueLoan){
    console.log("Não criou");
    return;
  }
  console.log("Criou o empréstimo");
  return;
}

async function putFineAmount(){
  const loan = await prisma.loan.update({
    where: { id: 3 },
    data: {
      fineAmount: 14
    }
  });

  const loanFine = await prisma.loan.findMany({
    where: {
      fineAmount: {
        gt: 0
      }
    }
  });

  if(!loanFine){
    console.log("Não aplicou a multa");
    return;
  }
  console.log("Aplicou a multa")
}
async function deleteLoan(){
  const deleteLoan1 = await prisma.loan.delete({
    where: { id: 4 }
  });
  const deleteLoan2 = await prisma.loan.delete({
    where: { id: 5 }
  });

  const find1 = await prisma.loan.findUnique({
    where: { id: 4 }
  });
  const find2 = await prisma.loan.findUnique({
    where: { id: 5 }
  });

  if(find1 || find2){
    console.log("Não apagou o empréstimo");
    return;
  }
  console.log("Apagou o empréstimo");
  return;
}
deleteLoan();