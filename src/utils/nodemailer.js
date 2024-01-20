import nodemailer from "nodemailer";

// const transporter = nodemailer.createTransport({
//   host: "sandbox.smtp.mailtrap.io",
//   port: 2525,
//   auth: {
//     user: "a535a12e46c36d",
//     pass: "7d8757ca1b4daf"
//   }
// });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: process.env.GMAIL_APP_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

  const sendMail = async (options) => {
    const mailType = options.mailType
    let html;
    let subject;
    if (mailType === "verifyEmail" || mailType === "forgotPassword" || mailType === "changeEmail" || mailType === "welcomeEmail") {
        let text1,text2,text3;
        if (mailType === "verifyEmail") {
            text1 = "Thanks for signing up with CodeWeb! We're excited to have you as an early user.";
            text2 = "To get started, please verify your email address below.";
            text3 = "Verify Email";
            subject = "Verify your email address";
        } else if (mailType === "forgotPassword") {
            text1 = "You are receiving this email because you requested a password reset for your CodeWeb account.";
            text2 = "Please click the button below to create a new password.";
            text3 = "Reset Password";
            subject = "Reset your password";
        } else if (mailType === "changeEmail") {
            text1 = "You are receiving this email because you requested to change your email address for your CodeWeb account.";
            text2 = "Please click the button below to verify your new email address.";
            text3 = "Verify Email";
            subject = "Verify your new email address";
        } else if (mailType === "welcomeEmail") {
            text1 = "Thanks for signing up with CodeWeb! We're excited to have you as an early user.";
            text2 = "To get started, please click the button below to verify your email address.";
            text3 = "Verify Email";
            subject = "welcome to CodeWeb";
        }
        html = `<!DOCTYPE html>
        <html>
        <head>
            <style>
                #logo{
                    width: 60px;
                    height: 50px;
                }
                .header{
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background-color: #ededed;
                    color: #fff;
                    padding: 15px;
                    border-radius: 10px;
                }
                .Cname{
                    font-size: 25px;
                    color: black;
                    font-weight: 800;
                    margin-left: 10px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                .footer{
                    margin-top: 80px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background-color: #f9f9f9;
                    color: #fff;
                    padding: 16px;
                    border-radius: 10px;
                }
                .cname{
                    font-size: 15px;
                    color: black;
                    font-weight: 800;
                    margin-left: 10px;
                    font-family: 'Times New Roman', Times, serif;
                }
                .button {
          border-radius: 10px;
          background-color: #f4511e;
          border: none;
          display: block;
          margin-left: auto;
          margin-right: auto;
          color: #FFFFFF;
          text-decoration: none;
          text-align: center;
          font-size: 20px;
          font-weight: 500;
          padding: 20px;
          width: 230px;
          transition: all 0.5s;
          cursor: pointer;
          margin: 5px;
        }
        @media screen and (max-width: 600px) {
            .reg{
                font-size: 18px;
                margin-left: 20px;
            }
        }
        .reg{
            font-size: 18px;
            font-weight: 600;
            margin-left: 10px;
        }
            </style>
        </head>
        <body>
            <div class="header">
                <img id="logo" src="https://res.cloudinary.com/dvrpvl53d/image/upload/v1705401176/inp6vcp335ucfhcvxt09.png" alt="LOGO">
                <span class="Cname">CODEWEB</span>
            </div>
                <h1>Welcome, ${options.fullName}!</h1>
                <p style="font-size: 16px;">${text1}</p>
                <p style="font-size: 16px;">${text2}</p>
                <a href="${options.url}" class="button" target="_blank">${text3}</a>
                <p class="reg" style="font-weight: 500;">Thanks,</p>
                <p class="reg">Team Codeweb</p>
        
                <div class="footer">
                        <img id="logo" src="https://res.cloudinary.com/dvrpvl53d/image/upload/v1705401176/inp6vcp335ucfhcvxt09.png" alt="LOGO">
                    <span class="cname">Copyright © 2024 | kuntalmaity.tech</span>
                    
                </div>
        
        </body>
        </html>`
    }
    const mailOptions = {
      from: {
        name: "CodeWeb",
        address: process.env.GMAIL_APP_USER
      },
      to: options?.email,
      subject: subject,
      html: html
    };

    transporter.sendMail(mailOptions,(err,info)=>{
      if (err) {
        console.log(false);
        return false;
      } else {
        console.log(true)
        return true;
      }
    })
  }

  //options= {email,fullName,url,mailType}
  export { sendMail }
