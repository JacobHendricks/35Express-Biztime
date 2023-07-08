const express = require("express");
const ExpressError = require("../expressError")
const router = express.Router();
const db = require("../db");
const slugify = require("slugify");

router.get('/', async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM companies`);
    return res.json({ companies: results.rows })
  } catch (e) {
    return next(e);
  }
})

router.get('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const compResult = await db.query(`
      SELECT c.code, c.name, c.description, i.industry
      FROM companies AS c
      LEFT JOIN comp_industries as ci
      ON c.code = ci.comp_code
      LEFT JOIN industries as i
      ON ci.industry_code = i.code
      WHERE c.code = $1`, [code])
    const invResult = await db.query(
      `SELECT id, amt, paid, add_date, paid_date
       FROM invoices
       WHERE comp_code = $1`,
    [code]);
    if (compResult.rows.length === 0) {
      throw new ExpressError(`Can't find company with code ${code}`, 404)
    }
    const { name, description } = compResult.rows[0];
    const industries = compResult.rows.map(r => r.industry);
    const invoices = invResult.rows;
   
    return res.send({ code, name, description, industries, invoices })
  } catch (e) {
    return next(e)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    let code = slugify(name, {lower: true});
    const results = await db.query('INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description', [code, name, description]);
    return res.status(201).json({ company: results.rows[0] })
  } catch (e) {
    return next(e)
  }
})

router.put('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const { name, description } = req.body;
    const results = await db.query('UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description', [name, description, code])
    if (results.rows.length === 0) {
      throw new ExpressError(`Can't update company with code ${code}`, 404)
    }
    return res.send({ company: results.rows[0] })
  } catch (e) {
    return next(e)
  }
})

router.delete('/:code', async (req, res, next) => {
  try {
    const results = db.query('DELETE FROM companies WHERE code = $1', [req.params.code])
    if (result.rows.length == 0) {
      throw new ExpressError(`No such company: ${code}`, 404)
    } else {  
    return res.send({ status: "deleted" })
    }
  } catch (e) {
    return next(e)
  }
})

router.post('/:code', async (req, res, next) => {
  try {
    const comp_code = req.params.code;
    const { industry_code } = req.body;
    const results = await db.query('INSERT INTO comp_industries (comp_code, industry_code) VALUES ($1, $2) RETURNING comp_code, industry_code', [comp_code, industry_code]);
    return res.status(201).json(results.rows[0])
  } catch (e) {
    return next(e)
  }
})

module.exports = router;