const sendMail = async (options) => {
  const mailType = options.mailType
  let text;
  let subject;
  if (mailType === "verifyEmail" || mailType === "forgotPassword" || mailType === "changeEmail" || mailType === "welcomeEmail") {
    if (mailType === "verifyEmail") {
      subject = "Verify your email address";
      text = `Hello ${options.fullName},\n\n` + "Thanks for signing up for CodeWeb! Please verify your email address by clicking the link below:" + "\n\n" + options.url + "\n\n" + "If you didn't create an account with this email address, please ignore this email." + "\n\n" + "Thanks,\nCodeWeb Team";

    } else if (mailType === "forgotPassword") {
      subject = "Reset your password";
      text = `Hello ${options.fullName},\n\n` + "We received a request to reset your password for your CodeWeb account. Please click the link below to reset your password:" + "\n\n" + options.url + "\n\n" + "If you did not request a password reset, please ignore this email." + "\n\n" + "Thanks,\nCodeWeb Team";
    } else if (mailType === "changeEmail") {
      subject = "Verify your new email address";
      text = `Hello ${options.fullName},\n\n` + "We received a request to change your email address on CodeWeb. Please verify your new email address by clicking the link below:" + "\n\n" + options.url + "\n\n" + "If you did not request to change your email address, please ignore this email." + "\n\n" + "Thanks,\nCodeWeb Team";
    } else if (mailType === "welcomeEmail") {
      subject = "welcome to CodeWeb";
      text = `Hello ${options.fullName},\n\n` + "Welcome to CodeWeb! We're excited to have you as an early user." + "\n\n" + "For better experience, please verify your email address by clicking the link below:" + "\n\n" + options.url + "\n\n" + "If you have any questions or feedback, please don't hesitate to reach out to us at" + "\n\n" + "Thanks,\nCodeWeb Team";
    }
  }

  try {
    const response = await fetch("https://kuntalmaity.in/api/send-custom-mail", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `"CodeWeb" <support@kuntalmaity.in>`,
        to: options?.email,
        subject: subject,
        text: text,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to send mail");
    }

    console.log("Mail sent successfully:", data);
    return data;
  } catch (error) {
    console.error("Error sending mail:", error.message);
    throw error;
  }
}

//options= {email,fullName,url,mailType}
export { sendMail }
