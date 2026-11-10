const { Resend } = require("resend");

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_API_KEY) {
    throw new Error("Email service is not configured");
  }

  const resend = new Resend(process.env.EMAIL_API_KEY);

  if (!process.env.EMAIL_FROM) {
    throw new Error("Email sender is not configured");
  }

  if (!to || !subject || !html) {
    throw new Error("Missing required email fields");
  }

  try {
    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    });

    if (response?.error) {
      const errorMessage = response.error.message || "Failed to send email";
      throw new Error(errorMessage);
    }

    return response;
  } catch (error) {
    throw new Error(error.message || "Email delivery failed");
  }
};

module.exports = sendEmail;