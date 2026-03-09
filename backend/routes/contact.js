import express from "express";
import { sendContactMessage } from "../controllers/contactController.js";
import { contactLimiter } from "../middleware/contactLimiter.js";

const router = express.Router();

router.post("/", contactLimiter, sendContactMessage);

export default router;