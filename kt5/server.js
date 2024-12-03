const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

const db = new sqlite3.Database(':memory:');

app.use(bodyParser.json());

db.serialize(() => {
  db.run(`
    CREATE TABLE notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT UNIQUE NOT NULL,
      content TEXT NOT NULL,
      created DATETIME DEFAULT CURRENT_TIMESTAMP,
      changed DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// 1. GET /notes
app.get('/notes', (req, res) => {
  db.all('SELECT * FROM notes', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No notes found' });
    }
    res.status(200).json(rows);
  });
});

// 2. GET /note/:id
app.get('/note/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM notes WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.status(200).json(row);
  });
});

// 3. GET /note/read/:title
app.get('/note/read/:title', (req, res) => {
  const { title } = req.params;
  db.get('SELECT * FROM notes WHERE title = ?', [title], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.status(200).json(row);
  });
});

// 4. POST /note/
app.post('/note', (req, res) => {
  const { title, content } = req.body;
  const sql = 'INSERT INTO notes (title, content) VALUES (?, ?)';
  db.run(sql, [title, content], function (err) {
    if (err) {
      return res.status(409).json({ error: 'Note with this title already exists' });
    }
    db.get('SELECT * FROM notes WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json(row);
    });
  });
});

// 5. DELETE /note/:id
app.delete('/note/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM notes WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(409).json({ error: 'Note not found' });
    }
    res.status(204).send();
  });
});

// 6. PUT /note/:id
app.put('/note/:id', (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const sql = `
    UPDATE notes
    SET title = ?, content = ?, changed = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  db.run(sql, [title, content, id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(409).json({ error: 'Note not found or no changes made' });
    }
    db.get('SELECT * FROM notes WHERE id = ?', [id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(204).json(row);
    });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
