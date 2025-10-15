CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  role TEXT,
  etab TEXT
);

CREATE TABLE vaccination (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  etab TEXT,
  date TEXT,
  centres INTEGER,
  equipes INTEGER,
  data TEXT,
  quantiteAdministree INTEGER
);

