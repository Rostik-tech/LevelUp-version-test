import axios from "axios";

let cachedRate = null;
let lastFetch = null;

const CACHE_TIME = 60 * 60 * 1000; // 1 час

export const getUsdToEurRate = async () => {

  if (cachedRate && lastFetch && Date.now() - lastFetch < CACHE_TIME) {
    return cachedRate;
  }

  const response = await axios.get(
    "https://open.er-api.com/v6/latest/USD"
  );

  const rate = response.data.rates.EUR;

  if (!rate) {
    throw new Error("EUR rate not found");
  }

  cachedRate = rate;
  lastFetch = Date.now();

  return cachedRate;
};

export const convertUsdToEur = async (amount) => {

  const rate = await getUsdToEurRate();

  const converted = amount * rate;

  return Number(converted.toFixed(2));
};