import nodeMailer from "nodemailer";

const transporter = nodeMailer.createTransport({
  host: process.env.hostMail,
  auth: {
    user: process.env.userMail,
    pass: process.env.passMail
  }
});

export default transporter;
