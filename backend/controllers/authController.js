const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res) => {
  const { name, email, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  db.query(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    [name, email, hash],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.send('User registered');
    }
  );
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  db.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    async (err, results) => {
      if (results.length === 0) return res.status(404).send('User not found');

      const user = results[0];
      const match = await bcrypt.compare(password, user.password_hash);

      if (!match) return res.status(401).send('Invalid password');

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
      res.json({ token });
    }
  );
};