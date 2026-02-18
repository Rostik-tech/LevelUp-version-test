import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const PAYPAL_BASE =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

// 🔹 Получение access token
const getAccessToken = async () => {
  const response = await axios({
    url: `${PAYPAL_BASE}/v1/oauth2/token`,
    method: "post",
    auth: {
      username: process.env.PAYPAL_CLIENT_ID,
      password: process.env.PAYPAL_SECRET,
    },
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: "grant_type=client_credentials",
  });

  return response.data.access_token;
};

// 🔹 Создание заказа
export const createOrder = async (req, res) => {
  try {
    const accessToken = await getAccessToken();

    const response = await axios.post(
      `${PAYPAL_BASE}/v2/checkout/orders`,
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: "10.00",
            },
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    // ВАЖНО: возвращаем весь ответ, а не только id
    res.json(response.data);

  } catch (error) {
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
};

// 🔹 Подтверждение оплаты
export const captureOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const accessToken = await getAccessToken();

    const response = await axios.post(
      `${PAYPAL_BASE}/v2/checkout/orders/${id}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      status: response.data.status,
      order: response.data,
    });

  } catch (error) {
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
};
