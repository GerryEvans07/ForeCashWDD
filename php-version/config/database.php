<?php
// Koneksi database — sesuaikan dengan XAMPP / hosting
$DB_HOST = 'localhost';
$DB_USER = 'root';
$DB_PASS = '';
$DB_NAME = 'forecash_db';

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
$mysqli = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
$mysqli->set_charset('utf8mb4');
date_default_timezone_set('Asia/Jakarta');

if (session_status() === PHP_SESSION_NONE) session_start();
