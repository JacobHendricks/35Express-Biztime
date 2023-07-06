// connect to right DB --- set before loading db.js
process.env.NODE_ENV = "test";

// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");

let testCompany;
beforeEach(async () => {
  const result = await db.query(`INSERT INTO companies (code, name, description) VALUES ('3m', 'MMM', 'Industrial manufacturer') RETURNING  code, name, description`);
  testCompany = result.rows[0]
})

afterEach(async () => {
  await db.query(`DELETE FROM companies`)
})

afterAll(async () => {
  await db.end()
})

describe("GET /companies", () => {
  test("Get a list of companies", async () => {
    const res = await request(app).get('/companies')
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ companies: [
      // {
      // "code": "amd",
      // "name": "AMD",
      // "description": "Semiconductor"
      // },
      {
        "code": "3m",
        "name": "MMM",
        "description": "Industrial manufacturer"
        }
    ] })
  })
})

describe("GET /companies/:code", () => {
  test("Gets a single company", async () => {
    const res = await request(app).get(`/companies/${testCompany.code}`)
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ company: {
      "code": "3m",
      "name": "MMM",
      "description": "Industrial manufacturer",
      "invoices": []
    } })
  })
  test("Responds with 404 for invalid code", async () => {
    const res = await request(app).get(`/companies/0`)
    expect(res.statusCode).toBe(404);
  })
})

describe("POST /companies", () => {
  test("Creates a single company", async () => {
    const res = await request(app).post('/companies').send({ code: 'amd', name: 'AMD', description: 'Semiconductor' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      company: { code: 'amd', name: 'AMD', description: 'Semiconductor' }
    })
  })
})

describe("PUT /companies/:code", () => {
  test("Updates a single company", async () => {
    const res = await request(app).put(`/companies/${testCompany.code}`).send({ name: 'BillyBob', description: 'Redneck cousin' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      company: { code: testCompany.code, name: 'BillyBob', description: 'Redneck cousin' }
    })
  })
  test("Responds with 404 for invalid code", async () => {
    const res = await request(app).put(`/companies/0`).send({ name: 'BillyBob', description: 'Redneck cousin' });
    expect(res.statusCode).toBe(404);
  })
})
describe("DELETE /companies/:code", () => {
  test("Deletes a single company", async () => {
    const res = await request(app).delete(`/companies/${testCompany.code}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'DELETED!' })
  })
})
