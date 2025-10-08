const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// Database setup
const db = new sqlite3.Database('./trading.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the trading database.');
});

// Create tables if they don't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS stocks (
      ticker TEXT PRIMARY KEY,
      price REAL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS portfolio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker TEXT,
      quantity INTEGER
    )
  `);

  // Insert some dummy stock data if the table is empty
  db.get(`SELECT COUNT(*) AS count FROM stocks`, (err, row) => {
    if (err) {
      console.error(err.message);
    } else if (row.count === 0) {
      const insert = `INSERT INTO stocks (ticker, price) VALUES (?,?)`;
      db.run(insert, ['AAPL', 170.34]);
      db.run(insert, ['GOOGL', 2700.50]);
      db.run(insert, ['MSFT', 285.60]);
    }
  });
});

// API endpoints
app.get('/api/stocks', (req, res) => {
  db.all('SELECT ticker, price FROM stocks', [], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    } else {
      res.json(rows);
    }
  });
});

app.get('/api/stocks/chart', (req, res) => {
  const { ticker } = req.query;
  // Simulate fetching historical data (replace with real data source)
  const chartData = [
    { name: 'Day 1', price: Math.random() * 100 },
    { name: 'Day 2', price: Math.random() * 100 },
    { name: 'Day 3', price: Math.random() * 100 },
    { name: 'Day 4', price: Math.random() * 100 },
    { name: 'Day 5', price: Math.random() * 100 },
  ];
  res.json(chartData);
});

app.get('/api/portfolio', (req, res) => {
  db.all('SELECT ticker, quantity FROM portfolio', [], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    } else {
      res.json(rows);
    }
  });
});

app.post('/api/trade/buy', (req, res) => {
  const { ticker, quantity } = req.body;

  // In a real application, you would also check if the user has enough funds
  // and update their balance accordingly.

  db.run(
    'INSERT INTO portfolio (ticker, quantity) VALUES (?, ?) ON CONFLICT(ticker) DO UPDATE SET quantity = quantity + excluded.quantity',
    [ticker, quantity],
    (err) => {
      if (err) {
        console.error(err.message);
        res.status(500).send('Server error');
      } else {
        res.send('Trade successful');
      }
    }
  );
});

app.post('/api/trade/sell', (req, res) => {
  const { ticker, quantity } = req.body;

  // In a real application, you would also check if the user has enough of the stock
  // and update their balance accordingly.

  db.run(
    'INSERT INTO portfolio (ticker, quantity) VALUES (?, ?) ON CONFLICT(ticker) DO UPDATE SET quantity = quantity - excluded.quantity',
    [ticker, quantity],
    (err) => {
      if (err) {
        console.error(err.message);
        res.status(500).send('Server error');
      } else {
        res.send('Trade successful');
      }
    }
  );
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
