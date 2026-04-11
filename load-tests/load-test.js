import http from 'k6/http';
import { sleep, check, group } from 'k6';

// =========================
// ⚙️ СТРЕСС-ТЕСТ НАСТРОЙКИ
// =========================
export const options = {
  scenarios: {
    stress: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '30s', target: 30 },
        { duration: '30s', target: 50 },
        { duration: '30s', target: 70 },
        { duration: '30s', target: 90 },
        { duration: '30s', target: 120 },
        { duration: '30s', target: 150 },
      ],
      gracefulRampDown: '10s',
    },
  },

  thresholds: {
    http_req_duration: ['p(95)<1500'],
    http_req_failed: ['rate<0.1'],
  },
};

const BASE_URL = 'https://www.levelup-gaming.store/api';

// =========================
// 🔑 ТОКЕНЫ (твои)
// =========================
const TOKENS = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IlVTRVIiLCJpYXQiOjE3NzU5MjI4NzEsImV4cCI6MTc3NjAwOTI3MX0.GkX2Xlw4hwCAZr3oaTrglri3rGOxyZbbgOib7pg649k',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Mywicm9sZSI6IkFETUlOIiwiaWF0IjoxNzc1OTIyODI1LCJleHAiOjE3NzYwMDkyMjV9.0e-hbTwZHlzdV7uTQcDzJctrfcdU1dXMkQkIVzgyjtI',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6IlVTRVIiLCJpYXQiOjE3NzU5MjI2NzUsImV4cCI6MTc3NjAwOTA3NX0.FD4HLW9PPh24ohoLQdMi_Nvd_uDYM6Qwihea4qGI4jI',
];

// =========================
// 🧠 ТВОИ ПРОДУКТЫ
// =========================
const PRODUCT_IDS = [11, 13, 14, 15, 16];

// =========================
// 🚀 ТЕСТ
// =========================
export default function () {
  const token = TOKENS[__VU % TOKENS.length];

  // 🔥 случайный товар
  const productId =
    PRODUCT_IDS[Math.floor(Math.random() * PRODUCT_IDS.length)];

  const payload = JSON.stringify({
    items: [
      {
        productId: productId,
        quantity: 1,
      },
    ],
    shippingFullName: 'Stress User',
    shippingPhone: '+123456789',
    shippingCountry: 'USA',
    shippingCity: 'New York',
    shippingAddress: 'Stress street',
    shippingPostalCode: '10001',
    shippingApartment: '1A',
  });

  group('Create Order', () => {
    const res = http.post(`${BASE_URL}/orders`, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      timeout: '30s',
    });

    // ✅ ПРАВИЛЬНАЯ логика проверки
    check(res, {
      'order success or valid reject': (r) =>
        r.status === 201 || r.status === 400,
    });

    // ❗ логируем только реальные ошибки
    if (res.status !== 201 && res.status !== 400) {
  console.error(`❌ STATUS: ${res.status} | BODY: ${res.body}`);
}

// 🔥 считаем статистику
if (res.status === 429) {
  console.warn("⚠️ RATE LIMIT");
}

if (res.status === 401) {
  console.warn("🔐 AUTH ERROR");
}

if (res.status === 500) {
  console.error("💥 SERVER ERROR");
}
  });

  sleep(Math.random() * 1.5);
}