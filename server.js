require("dotenv").config();
const express = require("express");
const cors = require("cors");
const otpRoutes = require("./otpRoute");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "OTP Verification API is running",
    version: "1.0.0",
    env: {
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? "SET ✅" : "MISSING ❌",
      TWILIO_AUTH_TOKEN:  process.env.TWILIO_AUTH_TOKEN  ? "SET ✅" : "MISSING ❌",
      VERIFY_SERVICE_SID: process.env.VERIFY_SERVICE_SID ? "SET ✅" : "MISSING ❌",
    },
    endpoints: {
      sendOtp:   "POST /api/send-otp",
      verifyOtp: "POST /api/verify-otp",
    },
  });
});

app.use("/api", otpRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ success: false, message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`✅  Server running on port ${PORT}`);
  console.log(`TWILIO_ACCOUNT_SID : ${process.env.TWILIO_ACCOUNT_SID ? "SET ✅" : "MISSING ❌"}`);
  console.log(`TWILIO_AUTH_TOKEN  : ${process.env.TWILIO_AUTH_TOKEN  ? "SET ✅" : "MISSING ❌"}`);
  console.log(`VERIFY_SERVICE_SID : ${process.env.VERIFY_SERVICE_SID ? "SET ✅" : "MISSING ❌"}`);
});
