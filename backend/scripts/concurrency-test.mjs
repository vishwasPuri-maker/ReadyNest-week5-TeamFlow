// Concurrency stress test: prove the atomic stock decrement never oversells.
const BASE = 'http://localhost:4000/api';

const login = async (email) => {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123' }),
  });
  return (await r.json()).data.accessToken;
};

const STOCK = 5;
const CONCURRENT = 20;

const admin = await login('admin@acme.com');
const H = (t) => ({ Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' });

// Find a product and force its stock to exactly STOCK.
const list = await (await fetch(`${BASE}/products?search=Cable`, { headers: H(admin) })).json();
const product = list.data[0];
await fetch(`${BASE}/products/${product.id}`, {
  method: 'PATCH', headers: H(admin), body: JSON.stringify({ stock: STOCK }),
});
console.log(`Product "${product.name}" set to stock = ${STOCK}`);
console.log(`Firing ${CONCURRENT} simultaneous orders, each buying 1 unit...\n`);

// Two cashiers hammering at once.
const staff = await login('member@acme.com');
const tokens = [admin, staff];

const results = await Promise.all(
  Array.from({ length: CONCURRENT }, (_, i) =>
    fetch(`${BASE}/orders`, {
      method: 'POST',
      headers: H(tokens[i % 2]),
      body: JSON.stringify({ items: [{ productId: product.id, quantity: 1 }] }),
    }).then(async (r) => ({ status: r.status, body: await r.json() })),
  ),
);

const ok = results.filter((r) => r.status === 201).length;
const conflict = results.filter((r) => r.status === 409).length;
const other = results.filter((r) => r.status !== 201 && r.status !== 409);

const after = await (await fetch(`${BASE}/products/${product.id}`, { headers: H(admin) })).json();
const finalStock = after.data.stock;

console.log(`✅ Succeeded (sold):     ${ok}`);
console.log(`🛑 Rejected (409 stock): ${conflict}`);
if (other.length) console.log(`⚠️  Other:                ${other.length}`, other.map((o) => o.status));
console.log(`📦 Final stock:          ${finalStock}`);
console.log('');

const pass = ok === STOCK && conflict === CONCURRENT - STOCK && finalStock === 0;
console.log(pass
  ? `PASS ✅  Exactly ${STOCK} sold, ${CONCURRENT - STOCK} correctly rejected, stock hit 0 — NO OVERSELL, NO NEGATIVE STOCK.`
  : `FAIL ❌  ok=${ok} conflict=${conflict} finalStock=${finalStock}`);
