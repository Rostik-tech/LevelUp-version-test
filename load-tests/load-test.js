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
    http_req_failed: ['rate<0.1'], // ужесточили до 10%
  },
};

const BASE_URL = 'https://www.levelup-gaming.store/api';

// =========================
// 🔑 ТОКЕНЫ
// =========================
const TOKENS = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IlVTRVIiLCJpYXQiOjE3NzU5MjI4NzEsImV4cCI6MTc3NjAwOTI3MX0.GkX2Xlw4hwCAZr3oaTrglri3rGOxyZbbgOib7pg649k',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Mywicm9sZSI6IkFETUlOIiwiaWF0IjoxNzc1OTIyODI1LCJleHAiOjE3NzYwMDkyMjV9.0e-hbTwZHlzdV7uTQcDzJctrfcdU1dXMkQkIVzgyjtI',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6IlVTRVIiLCJpYXQiOjE3NzU5MjI2NzUsImV4cCI6MTc3NjAwOTA3NX0.FD4HLW9PPh24ohoLQdMi_Nvd_uDYM6Qwihea4qGI4jI',
];

// =========================
// 📦 PAYLOAD
// =========================
function getPayload() {
  return JSON.stringify({
    items: [
      {
        productId: 16,
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
}

// =========================
// 🚀 ТЕСТ
// =========================
export default function () {
  const token = TOKENS[__VU % TOKENS.length];

  group('Create Order', () => {
    const res = http.post(
      `${BASE_URL}/orders`,
      getPayload(),
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        timeout: '30s',
      }
    );

    // ✅ правильные проверки
    check(res, {
      'status is 201': (r) => r.status === 201,
    });

    // ❗ логируем только реальные проблемы
    if (res.status !== 201) {
      console.error(`❌ ORDER FAILED: ${res.status} | ${res.body}`);
    }
  });

  sleep(Math.random() * 1.5);
}