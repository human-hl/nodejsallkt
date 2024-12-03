const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS urls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_url TEXT NOT NULL,
      short_url TEXT NOT NULL UNIQUE
    )
  `);
});

function generateShortUrl(id) {
  const baseChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let shortUrl = '';
  while (id > 0) {
    shortUrl = baseChars[id % baseChars.length] + shortUrl;
    id = Math.floor(id / baseChars.length);
  }
  return shortUrl || 'a';
}

app.get('/create', (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  db.get('SELECT short_url FROM urls WHERE original_url = ?', [url], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (row) {
      return res.status(200).json({ shortUrl: `http://localhost:${port}/${row.short_url}` });
    }

    db.run('INSERT INTO urls (original_url, short_url) VALUES (?, ?)', [url, ''], function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const shortUrl = generateShortUrl(this.lastID);

      db.run('UPDATE urls SET short_url = ? WHERE id = ?', [shortUrl, this.lastID], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ shortUrl: `http://localhost:${port}/${shortUrl}` });
      });
    });
  });
});

app.get('/:shortUrl', (req, res) => {
  const { shortUrl } = req.params;

  db.get('SELECT original_url FROM urls WHERE short_url = ?', [shortUrl], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    res.redirect(row.original_url);
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
