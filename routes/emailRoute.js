import express from "express";
import sendMail from "../utils/sendEmail.js";

const router = express.Router();

router.get("/test-email", async (req, res) => {
  try {
    await sendMail(
      "syedrasheedindia@gmail.com",
      "TrackMe Email Test",
      "Hello! This is a test email from TrackMe."
    );

    res.status(200).json({
      message: "Email sent successfully"
    });

  } catch (error) {
    console.error("EMAIL ERROR:", error);

    res.status(500).json({
      message: "Failed to send email"
    });
  }
});

export default router;