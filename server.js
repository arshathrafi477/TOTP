require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MailtrapClient } = require("mailtrap");

const app = express();
app.use(cors());
app.use(express.json());

const client = new MailtrapClient({
  token: process.env.MAILTRAP_TOKEN,
});

const otpStore = {}; // temporary in-memory store

async function sendOTP(email) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  try {
    await client.send({
      from: { email: "hello@demomailtrap.co", name: "OTP Verification" },
      to: [{ email }],
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
      category: "OTP Verification",
    });
    otpStore[email] = { otp, expiresAt: Date.now() + 10 * 60 * 1000 };
    return otp;
  } catch (error) {
    console.error("Mailtrap Error:", error);
    throw error;
  }
}

// Route: Send OTP
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });
  try {
    await sendOTP(email);
    res.json({ success: true, message: "OTP sent!" });
  } catch {
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// Route: Verify OTP
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore[email];
  if (!record) return res.status(400).json({ error: "No OTP found" });
  if (Date.now() > record.expiresAt) return res.status(400).json({ error: "OTP expired" });
  if (record.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });
  delete otpStore[email];
  res.json({ success: true, message: "OTP verified!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
