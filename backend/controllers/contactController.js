import { sendContactEmail } from "../services/emailService.js";

export const sendContactMessage = async (req, res) => {
  try {

    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    await sendContactEmail({
      name,
      email,
      subject,
      message
    });

    res.json({ message: "Message sent successfully" });

  } catch (err) {
    console.error("Contact form error:", err);
    res.status(500).json({ message: "Failed to send message" });
  }
};