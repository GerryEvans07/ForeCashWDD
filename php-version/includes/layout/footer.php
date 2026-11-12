</main>
<footer class="fc-foot">ForeCash © 2026 · Kelompok 4 IS556</footer>
</div>

<!-- ===== Tab bar bawah (HP) ===== -->
<nav class="fc-tabbar" aria-label="Menu utama">
    <?php foreach ($menus as $key => [$href, $icon, $label, $warna]): ?>
        <a href="<?= $href ?>" class="<?= $active === $key ? 'is-active' : '' ?>">
            <span class="fc-tile fc-tile-<?= $warna ?>"><i class="fa-solid <?= $icon ?>"></i></span>
            <span><?= ['Utang & Patungan' => 'Utang', 'Petualangan' => 'Peta', 'Pencapaian' => 'Badge', 'Pantau Anak' => 'Pantau'][$label] ?? $label ?></span>
        </a>
    <?php endforeach; ?>
</nav>

<script src="../assets/js/app.js?v=<?= filemtime(__DIR__ . '/../../assets/js/app.js') ?>"></script>
<?php if ($user['role'] === 'mahasiswa'): ?>
<!-- ForeCash Assistant: tampilan di JS, jawaban dari api/chatbot.php -->
<script>window.FC_USER = <?= json_encode(['nama' => explode(' ', $user['nama'])[0], 'csrf' => csrf_token()]) ?>;</script>
<script src="../assets/js/chatbot.js?v=<?= filemtime(__DIR__ . '/../../assets/js/chatbot.js') ?>"></script>
<?php endif; ?>
</body>
</html>
