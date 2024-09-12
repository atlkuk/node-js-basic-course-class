import { printRandomly } from "../helpers.js";

export class Email {
    send() {
        const customerString = printRandomly();
        console.log(`sent email to customer: ${customerString}`);
    }
}