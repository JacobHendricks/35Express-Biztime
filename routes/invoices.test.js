// connect to right DB --- set before loading db.js
process.env.NODE_ENV = "test";

// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");

let testCompany2;
// beforeAll(async () => {
//   const result = await db.query(`INSERT INTO companies (code, name, description) VALUES ('amd', 'AMD', 'Semiconductor') RETURNING  code, name, description`);
//   testCompany2 = result.rows[0]
// })

let testInvoice;
beforeEach(async () => {
  const compResult = await db.query(`INSERT INTO companies (code, name, description) VALUES ('amd', 'AMD', 'Semiconductor') RETURNING  code, name, description`);
  testCompany2 = compResult.rows[0];
  const result = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ('amd', '1234') RETURNING id, comp_code, amt, paid, add_date, paid_date`);
  testInvoice = result.rows[0];
})

afterEach(async () => {
  await db.query(`DELETE FROM invoices`)
  await db.query(`DELETE FROM companies`)
})

afterAll(async () => {
  await db.end()
})

describe("GET /invoices", () => {
  test("Get a list with one invoice", async () => {
    const res = await request(app).get('/invoices')
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ invoices: [testInvoice] })
  })
})

describe("GET /invoices/:id", () => {
  test("Gets a single invoice", async () => {
    const res = await request(app).get(`/invoices/${testInvoice.id}`)
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ invoice: testInvoice })
  })
  test("Responds with 404 for invalid id", async () => {
    const res = await request(app).get(`/invoices/0`)
    expect(res.statusCode).toBe(404);
  })
})

describe("POST /invoices", () => {
  test("Creates a single invoice", async () => {
    const res = await request(app).post('/invoices').send({ comp_code: 'amd', amt: '999' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      invoice: { id: expect.any(Number), comp_code: 'amd', amt: '999', paid: false, add_date: '2023-07-04', paid_date: null }
    })
  })
})

describe("PUT /invoices/:id", () => {
  test("Updates a single invoice", async () => {
    const res = await request(app).put(`/invoices/${testInvoice.id}`).send({ amt: '1000', paid: true });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoice: { id: testInvoice.id, amt: '1000', paid: true }
    })
  })
  test("Responds with 404 for invalid id", async () => {
    const res = await request(app).put(`/invoices/0`).send({ amt: '1000', paid: true });
    expect(res.statusCode).toBe(404);
  })
})

describe("DELETE /invoices/:id", () => {
  test("Deletes a single invoice", async () => {
    const res = await request(app).delete(`/invoices/${testInvoice.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'DELETED!' })
  })
})
