</main>
<footer class="py-4 px-4 text-center text-xs font-bold text-slate-400 border-t">
    ForeCash © 2026 — Calm & Transparent Student Financial Planning
</footer>
</div>
<script src="../assets/js/app.js"></script>
<?php if ($user['role'] === 'mahasiswa'): ?>
<!-- ForeCash Assistant: tampilan di JS, jawaban dari api/chatbot.php -->
<script>window.FC_USER = <?= json_encode(['nama' => explode(' ', $user['nama'])[0], 'csrf' => csrf_token()]) ?>;</script>
<script src="../assets/js/chatbot.js"></script>
<?php endif; ?>
</body>
</html>
