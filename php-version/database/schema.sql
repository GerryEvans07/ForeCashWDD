-- ForeCash — skema basis data (MySQL / MariaDB)
-- Import lewat phpMyAdmin: buat database "forecash_db", lalu Import file ini,
-- kemudian (opsional) demo_data.sql untuk akun contoh.

SET NAMES utf8mb4;

CREATE TABLE users (
  user_id       INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nama          VARCHAR(100) NOT NULL,
  email         VARCHAR(100) NOT NULL UNIQUE,          -- boleh diganti, jadi BUKAN primary key
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('mahasiswa','orangtua') NOT NULL DEFAULT 'mahasiswa',
  kode_hubung   CHAR(8) NULL UNIQUE,                   -- kode yang dibagikan mahasiswa ke orang tua
  batas_harian  DECIMAL(12,2) NOT NULL DEFAULT 0,
  avatar        VARCHAR(4) NOT NULL DEFAULT 'a1',          -- karakter a1–a6
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Relasi orang tua <-> mahasiswa (many-to-many)
CREATE TABLE parent_links (
  link_id    INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  parent_id  INT NOT NULL,
  student_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_link (parent_id, student_id),
  FOREIGN KEY (parent_id)  REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Setiap mahasiswa otomatis punya 1 wallet "Utama" saat registrasi (relasi 1 : 1..N)
CREATE TABLE wallets (
  wallet_id  INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  nama       VARCHAR(50) NOT NULL,
  tipe       ENUM('tunai','bank','ewallet') NOT NULL DEFAULT 'tunai',
  saldo_awal DECIMAL(12,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- user_id NULL = kategori bawaan untuk semua pengguna
CREATE TABLE categories (
  category_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NULL,
  nama        VARCHAR(50) NOT NULL,
  jenis       ENUM('pemasukan','pengeluaran') NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- jenis 'transfer' = pindah saldo antar wallet, TIDAK dihitung sebagai pemasukan/pengeluaran
CREATE TABLE transactions (
  transaction_id   INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  wallet_id        INT NOT NULL,
  wallet_tujuan_id INT NULL,
  category_id      INT NULL,
  jenis            ENUM('pemasukan','pengeluaran','transfer') NOT NULL,
  nominal          DECIMAL(12,2) NOT NULL,
  keterangan       VARCHAR(150) NOT NULL,
  tanggal          DATE NOT NULL,
  bukti            VARCHAR(64) NULL,                    -- nama file foto struk di uploads/struk
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)          REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (wallet_id)        REFERENCES wallets(wallet_id) ON DELETE CASCADE,
  FOREIGN KEY (wallet_tujuan_id) REFERENCES wallets(wallet_id) ON DELETE CASCADE,
  FOREIGN KEY (category_id)      REFERENCES categories(category_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Jadwal pemasukan (uang saku, honor, beasiswa) untuk prediksi & deteksi keterlambatan
CREATE TABLE income_schedules (
  schedule_id       INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id           INT NOT NULL,
  sumber            VARCHAR(50) NOT NULL,
  nominal           DECIMAL(12,2) NOT NULL,
  tanggal_perkiraan DATE NOT NULL,
  status            ENUM('menunggu','diterima') NOT NULL DEFAULT 'menunggu',
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE debts (
  debt_id     INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  nama_teman  VARCHAR(100) NOT NULL,
  keterangan  VARCHAR(150) NOT NULL,
  nominal     DECIMAL(12,2) NOT NULL,
  arah        ENUM('piutang','utang') NOT NULL,   -- piutang = teman utang ke saya
  status      ENUM('belum','lunas') NOT NULL DEFAULT 'belum',
  jatuh_tempo DATE NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Teman Hemat: hewan yang menetas dari telur setelah 7 hari baik (fitur Petualangan)
CREATE TABLE user_pets (
  id           INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  pet_id       VARCHAR(20) NOT NULL,                 -- kunci katalog di includes/pets.php
  menetas_pada DATE NOT NULL,
  dipakai      TINYINT(1) NOT NULL DEFAULT 0,        -- 1 = sedang menemani di peta & dashboard
  UNIQUE KEY uq_pet (user_id, pet_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Lupa kata sandi: token reset sekali pakai (yang disimpan hanya hash SHA-256), berlaku 30 menit
CREATE TABLE password_resets (
  id         INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used       TINYINT(1) NOT NULL DEFAULT 0,
  UNIQUE KEY uq_token (token_hash),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO categories (user_id, nama, jenis) VALUES
 (NULL,'Makan & Minum','pengeluaran'),(NULL,'Transportasi','pengeluaran'),(NULL,'Kos / Sewa','pengeluaran'),
 (NULL,'Kebutuhan Kuliah','pengeluaran'),(NULL,'Hiburan','pengeluaran'),(NULL,'Lainnya','pengeluaran'),
 (NULL,'Uang Saku','pemasukan'),(NULL,'Kerja Sampingan','pemasukan'),(NULL,'Beasiswa','pemasukan'),
 (NULL,'Pelunasan Utang/Piutang','pemasukan'),(NULL,'Pelunasan Utang/Piutang','pengeluaran');
