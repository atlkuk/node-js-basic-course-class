import { printRandomly } from "../helpers.js";

export class Call {
    call() {
        const customerString = printRandomly();
        console.log(`called customer: ${customerString}`);
    }
}