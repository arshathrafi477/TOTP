const { MailtrapClient } = require("mailtrap");
const TOKEN = process.env.MAILTRAP_TOKEN;
const client = new MailtrapClient({
  token: TOKEN,
});
async function sendOTP(email) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  try {
    const response = await client.send({
      from: {
        email: "hello@demomailtrap.co",
        name: "OTP Verification",
      },
      to: [
        {
          email: email,
        },
      ],
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
      category: "OTP Verification",
    });
    console.log("Email sent:", response);
    return otp;
  } catch (error) {
    console.error("Mailtrap Error:", error);
    throw error;
  }
}
// Example
sendOTP("ncoders06@gmail.com");
