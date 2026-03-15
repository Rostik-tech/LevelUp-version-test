import { getUsdToEurRate, convertUsdToEur } from "../services/currencyService.js";

export const getRate = async (req, res) => {
  try {

    const rate = await getUsdToEurRate();

    res.json({
      base: "USD",
      target: "EUR",
      rate
    });

  } catch (err) {

    console.error("Currency rate error:", err.message);

    res.status(500).json({
      message: "Currency rate error"
    });

  }
};

export const convertCurrency = async (req, res) => {

  try {

    const { amount } = req.query;

    if (!amount) {
      return res.status(400).json({
        message: "Amount required"
      });
    }

    const eur = await convertUsdToEur(Number(amount));

    res.json({
      USD: Number(amount),
      EUR: eur
    });

  } catch (err) {

    console.error("Currency convert error:", err.message);

    res.status(500).json({
      message: "Currency conversion failed"
    });

  }

};