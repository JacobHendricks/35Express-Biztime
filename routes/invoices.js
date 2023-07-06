const express = require("express");
const ExpressError = require("../expressError")
const router = express.Router();
const db = require("../db");

router.get('/', async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM invoices`);
    return res.json({ invoices: results.rows })
  } catch (e) {
    return next(e);
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const results = await db.query(
      `SELECT i.id, 
              i.comp_code, 
              i.amt, 
              i.paid, 
              i.add_date, 
              i.paid_date, 
              c.name, 
              c.description 
       FROM invoices AS i
         INNER JOIN companies AS c ON (i.comp_code = c.code)  
       WHERE id = $1`,
    [id]);
    // const results = await db.query('SELECT * FROM invoices WHERE id = $1', [id])
    // const compResults = await db.query('SELECT * FROM companies ')
    if (results.rows.length === 0) {
      throw new ExpressError(`Can't find invoice with id ${id}`, 404)
    }
    const data = results.rows[0];
    const invoice = {
      id: data.id,
      amt: data.amt,
      paid: data.paid,
      add_date: data.add_date,
      paid_date: data.paid_date,
      company: {
        code: data.comp_code,
        name: data.name,
        description: data.description,
      },
    };

    return res.send({ invoice: invoice })
  } catch (e) {
    return next(e)
  }
})

// Returns {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}}

router.post('/', async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;
    const results = await db.query('INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date', [comp_code, amt]);
    return res.status(201).json({ invoice: results.rows[0] })
  } catch (e) {
    return next(e)
  }
})


router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amt, paid } = req.body;
    const results = await db.query('UPDATE invoices SET amt=$1, paid=$2 WHERE id=$3 RETURNING id, comp_code, amt, paid, add_date, paid_date', [amt, paid, id])
    if (results.rows.length === 0) {
      throw new ExpressError(`Can't update invoice with id ${id}`, 404)
    }
    return res.send({ invoice: results.rows[0] })
  } catch (e) {
    return next(e)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const results = db.query('DELETE FROM invoices WHERE id = $1', [req.params.id])
    return res.send({ status: "DELETED!" })
  } catch (e) {
    return next(e)
  }
})

module.exports = router;