import { customersList } from "./constants.js"

export const printRandomly = () => {
    const customersListLength = customersList.length;
    
    const randomIndex = Math.floor(Math.random() * customersListLength);
    const customer = customersList[randomIndex];
    return `${customer.nome} ${customer.cognome}`;
}