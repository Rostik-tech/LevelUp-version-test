import express from "express";
import {
  getRate,
  convertCurrency
} from "../controllers/currencyController.js";

const router = express.Router();

router.get("/rate", getRate);

router.get("/convert", convertCurrency);

export default router;