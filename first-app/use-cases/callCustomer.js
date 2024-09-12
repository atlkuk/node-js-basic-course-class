import { Call } from "../models/Call.js";

export const callCustomer = () => {
    setInterval(() => {
        const call = new Call();
        call.call()
    }, 5000);
}