-- Data contoh untuk demo (opsional). Import SETELAH schema.sql.
-- Login mahasiswa : demo@forecash.id   / demo12345
-- Login orang tua : ortu@forecash.id   / demo12345
INSERT INTO users (user_id, nama, email, password_hash, role, kode_hubung, batas_harian, avatar) VALUES
 (1, 'Momo Mahasiswa', 'demo@forecash.id', '$2y$10$fWRNhUFg5nZiRUK0ndgW/uLox6KOz3zDu3EMWTOXUBqwgoWbtdxCy', 'mahasiswa', 'DEMO2026', 45000, 'a2'),
 (2, 'Ibu Momo', 'ortu@forecash.id', '$2y$10$fWRNhUFg5nZiRUK0ndgW/uLox6KOz3zDu3EMWTOXUBqwgoWbtdxCy', 'orangtua', NULL, 0, 'a4');
INSERT INTO parent_links (parent_id, student_id) VALUES (2, 1);
INSERT INTO wallets (wallet_id, user_id, nama, tipe, saldo_awal) VALUES
 (1, 1, 'Utama', 'tunai', 250000), (2, 1, 'BCA', 'bank', 0), (3, 1, 'GoPay', 'ewallet', 0);
INSERT INTO transactions (user_id, wallet_id, wallet_tujuan_id, category_id, jenis, nominal, keterangan, tanggal) VALUES
 (1, 2, NULL, 7, 'pemasukan', 1000000, 'Uang saku bulanan', DATE_SUB(CURDATE(), INTERVAL 13 DAY)),
 (1, 2, 3, NULL, 'transfer', 300000, 'Isi GoPay', DATE_SUB(CURDATE(), INTERVAL 12 DAY)),
 (1, 3, NULL, 1, 'pengeluaran', 85000, 'Makan bareng teman', DATE_SUB(CURDATE(), INTERVAL 12 DAY)),
 (1, 2, NULL, 3, 'pengeluaran', 250000, 'Bayar kos (cicilan)', DATE_SUB(CURDATE(), INTERVAL 13 DAY)),
 (1, 3, NULL, 2, 'pengeluaran', 40000, 'Ojek online', DATE_SUB(CURDATE(), INTERVAL 9 DAY)),
 (1, 1, NULL, 1, 'pengeluaran', 60000, 'Makan kantin', DATE_SUB(CURDATE(), INTERVAL 8 DAY)),
 (1, 3, NULL, 5, 'pengeluaran', 75000, 'Nonton bioskop', DATE_SUB(CURDATE(), INTERVAL 6 DAY)),
 (1, 1, NULL, 4, 'pengeluaran', 35000, 'Print tugas', DATE_SUB(CURDATE(), INTERVAL 5 DAY)),
 (1, 3, NULL, 1, 'pengeluaran', 55000, 'Kopi & camilan', DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
 (1, 1, NULL, 2, 'pengeluaran', 30000, 'Bensin', DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
 (1, 1, NULL, 1, 'pengeluaran', 45000, 'Makan siang', DATE_SUB(CURDATE(), INTERVAL 1 DAY));
INSERT INTO income_schedules (user_id, sumber, nominal, tanggal_perkiraan) VALUES
 (1, 'Uang saku dari orang tua', 1000000, DATE_ADD(CURDATE(), INTERVAL 13 DAY));
INSERT INTO debts (user_id, nama_teman, keterangan, nominal, arah, jatuh_tempo) VALUES
 (1, 'Andi', 'Patungan makan', 28000, 'piutang', DATE_ADD(CURDATE(), INTERVAL 3 DAY)),
 (1, 'Sasa', 'Pinjam ongkos', 20000, 'utang', NULL);
