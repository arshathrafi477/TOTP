const express = require("express");
const router  = express.Router();
const twilio  = require("twilio");

const VERIFY_SERVICE_SID = process.env.VERIFY_SERVICE_SID;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toE164(phone) {
  const digits = phone.replace(/\D/g, "");
  if (phone.startsWith("+"))                          return `+${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length === 10)                           return `+91${digits}`;
  return `+${digits}`;
}

function getClient() {
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

function missingEnv() {
  return (
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN  ||
    !process.env.VERIFY_SERVICE_SID
  );
}

// ─── POST /api/send-otp ───────────────────────────────────────────────────────

router.post("/send-otp", async (req, res) => {
  if (missingEnv()) {
    console.error("❌ Missing Twilio env vars");
    return res.status(500).json({
      success: false,
      message: "Twilio environment variables are not configured.",
    });
  }

  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ success: false, message: "Phone number is required." });
  }

  const e164Phone = toE164(phone.trim());

  if (!/^\+\d{7,15}$/.test(e164Phone)) {
    return res.status(400).json({ success: false, message: "Invalid phone number format." });
  }

  try {
    const client       = getClient();
    const verification = await client.verify.v2
      .services(process.env.VERIFY_SERVICE_SID)
      .verifications.create({ to: e164Phone, channel: "sms" });

    console.log(`✅ OTP sent → ${e164Phone} | status: ${verification.status}`);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully.",
      phone:   e164Phone,
      status:  verification.status,
    });

  } catch (err) {
    // Log the FULL Twilio error so you can see it in Render logs
    console.error("❌ Send OTP error:");
    console.error("   Code    :", err.code);
    console.error("   Status  :", err.status);
    console.error("   Message :", err.message);

    const userMessage = err.status === 400
      ? err.message
      : "Failed to send OTP. Please try again.";

    return res.status(err.status || 500).json({
      success: false,
      message: userMessage,
      twilioCode: err.code || null,
    });
  }
});

// ─── POST /api/verify-otp ─────────────────────────────────────────────────────

router.post("/verify-otp", async (req, res) => {
  if (missingEnv()) {
    console.error("❌ Missing Twilio env vars");
    return res.status(500).json({
      success: false,
      message: "Twilio environment variables are not configured.",
    });
  }

  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ success: false, message: "Phone number and OTP are required." });
  }

  if (!/^\d{4,8}$/.test(otp.trim())) {
    return res.status(400).json({ success: false, message: "OTP must be 4–8 digits." });
  }

  const e164Phone = toE164(phone.trim());

  try {
    const client = getClient();
    const result = await client.verify.v2
      .services(process.env.VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: e164Phone, code: otp.trim() });

    console.log(`✅ OTP check → ${e164Phone} | status: ${result.status}`);

    if (result.status === "approved") {
      return res.status(200).json({
        success: true,
        message: "OTP verified successfully.",
        phone:   e164Phone,
        status:  result.status,
      });
    }

    return res.status(400).json({
      success: false,
      message: "Incorrect OTP. Please try again.",
      status:  result.status,
    });

  } catch (err) {
    console.error("❌ Verify OTP error:");
    console.error("   Code    :", err.code);
    console.error("   Status  :", err.status);
    console.error("   Message :", err.message);

    if (err.status === 404) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or not found. Please request a new one.",
      });
    }

    const userMessage = err.status === 400
      ? err.message
      : "OTP verification failed. Please try again.";

    return res.status(err.status || 500).json({
      success: false,
      message: userMessage,
      twilioCode: err.code || null,
    });
  }
});

module.exports = router;
