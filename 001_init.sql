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

-- Initial users
INSERT INTO users (username, password, role, etab) VALUES
('admin', 'G9v@3RtZ', 'admin', 'ADMIN'),
('ehs_ghardaia', 'm8#Qp6Lw', 'coordinateur', 'EHS Ghardaia'),
('epsp_ghardaia', '7Xr%2bNk', 'coordinateur', 'EPSP Ghardaia'),
('epsp_metlili', 'hP4&z9Yq', 'coordinateur', 'EPSP Metlili'),
('epsp_guerrara', '!T6sV2mB', 'coordinateur', 'EPSP Guerrara'),
('epsp_berriane', 'R3#kH8uS', 'coordinateur', 'EPSP Berriane'),
('eph_ghardaia', 'n5$Gq7Zj', 'coordinateur', 'EPH Ghardaia'),
('eph_metlili', 'Yt9^4pLm', 'coordinateur', 'EPH Metlili'),
('eph_guerrara', '2b@Vw6Qx', 'coordinateur', 'EPH Guerrara'),
('eph_berriane', 'cK7*R2hZ', 'coordinateur', 'EPH Berriane');
