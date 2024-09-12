import { Email } from "../models/Email.js";

export const sendEmail = () => {
    setInterval(() => {
        const email = new Email();
        email.send()
    }, 10000);
}