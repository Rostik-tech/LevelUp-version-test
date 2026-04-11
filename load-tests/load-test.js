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
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IlVTRVIiLCJpYXQiOjE3NzU4MzU4ODksImV4cCI6MTc3NTkyMjI4OX0.gYHhbDHvNQQ5uuHaydWSFis8Md05Yvke8DttQ2aXoj4',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwicm9sZSI6IlVTRVIiLCJpYXQiOjE3NzU4NDk2NDYsImV4cCI6MTc3NTkzNjA0Nn0.irl_Krubh9JTrUEhkx9MmJDhnB2XnsTkCcBv4OB9IYI',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6IlVTRVIiLCJpYXQiOjE3NzU4NDk2ODIsImV4cCI6MTc3NTkzNjA4Mn0.bsUj-iabqn-Kuy1MWpQwsSAJ8w9xWzrIepU7d0Fxj9Q',
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