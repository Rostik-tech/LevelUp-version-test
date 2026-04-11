//backend/controllers/authController.js
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 20,
  duration: '1m',
};

const BASE_URL = 'https://www.levelup-gaming.store/api';

export default function () {
  // =========================
  // 1. REGISTER
  // =========================
  const email = `user_${__VU}_${__ITER}@test.com`;

  const registerPayload = JSON.stringify({
    username: `user_${__VU}_${__ITER}`,
    email: email,
    password: '123456',
    fullName: 'Test User'
  });

  const registerRes = http.post(
    `${BASE_URL}/auth/register`,
    registerPayload,
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  check(registerRes, {
    'register status 201': (r) => r.status === 201,
  });

  // =========================
  // 2. LOGIN
  // =========================
  const loginPayload = JSON.stringify({
    email: email,
    password: '123456',
  });

  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    loginPayload,
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const loginCheck = check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'login has token': (r) => r.json('token') !== undefined,
  });

  if (!loginCheck) {
    console.error('LOGIN FAILED:', loginRes.body);
    return;
  }

  const token = loginRes.json('token');

  // =========================
  // 3. GET PRODUCTS
  // =========================
  const productsRes = http.get(`${BASE_URL}/products`);

  check(productsRes, {
    'products status 200': (r) => r.status === 200,
  });

  // =========================
  // 4. CREATE ORDER
  // =========================
  const orderPayload = JSON.stringify({
    items: [
      { productId: 1, quantity: 1 }
    ],
    shippingFullName: "Test User",
    shippingPhone: "+123456789",
    shippingCountry: "USA",
    shippingCity: "NY",
    shippingAddress: "Test street",
    shippingPostalCode: "10001",
    shippingApartment: "1A"
  });

  const orderRes = http.post(
    `${BASE_URL}/orders`,
    orderPayload,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  check(orderRes, {
    'order created 201': (r) => r.status === 201,
  });

  sleep(1);
}