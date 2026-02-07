export function addDays(date, days){
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
 export function getDaysDifference(date1, date2){
    const diffTime = Math.abs(date2 - date1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}
 export function isOverdue(dueDate){
    return new Date() > new Date(dueDate);
}
 export function calculateFine(dueDate, returnDate, finePerDay){
    if(!isOverdue(dueDate)) return 0;

    const actualReturnDate = returnDate || new Date();
    const daysOverdue = getDaysDifference(new Date(dueDate), actualReturnDate);
    return daysOverdue * finePerDay;
}
export function maskIsbn(isbn) {
    if (!isbn) return false;

    const numbers = isbn.replace(/\D/g, '');
    if (numbers.length !== 13) return false;

    const limited = numbers.slice(0, 13);

    return limited.replace(/(\d{3})(\d)(\d{3})(\d{5})(\d)/, '$1-$2-$3-$4-$5');
}