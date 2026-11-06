-- Jalankan file ini SEKALI jika database forecash_db sudah dibuat sebelum fitur Petualangan ada.
-- phpMyAdmin: pilih forecash_db -> Import -> file ini.
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

INSERT IGNORE INTO user_pets (user_id, pet_id, menetas_pada, dipakai)
SELECT user_id, 'celeng', DATE_SUB(CURDATE(), INTERVAL 10 DAY), 1 FROM users WHERE email = 'demo@forecash.id';
INSERT IGNORE INTO user_pets (user_id, pet_id, menetas_pada, dipakai)
SELECT user_id, 'mochi', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 0 FROM users WHERE email = 'demo@forecash.id';
