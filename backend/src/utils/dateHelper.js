export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
export function getDaysDifference(date1, date2) {
  const diffTime = Math.abs(date2 - date1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
export function calculateDueDate(today) {
  const daysToAdd = 14;

  const dueDate = new Date(today.getTime() + daysToAdd * 86400000);

  return dueDate;
}
export function isOverdue(dueDate) {
  return new Date() > new Date(dueDate);
}
export function calculateFine(dueDate, returnDate, finePerDay) {
  if (!isOverdue(dueDate)) return 0;

  const actualReturnDate = returnDate || new Date();
  const daysOverdue = getDaysDifference(new Date(dueDate), actualReturnDate);
  return daysOverdue * finePerDay;
}
export function maskIsbn(isbn) {
  if (!isbn || typeof isbn !== 'string') {
    return null;
  }

  const numbers = isbn.replace(/\D/g, "");
  
  if (numbers.length !== 13) {
    return null; // ← Retorna null em vez de false
  }

  return numbers.replace(/(\d{3})(\d)(\d{3})(\d{5})(\d)/, "$1-$2-$3-$4-$5");
}