// Warna ForeCash untuk Tailwind CDN (dimuat setelah cdn.tailwindcss.com).
// Nama lama (hsOrange, hsYellow, ...) dipertahankan supaya class di halaman tetap jalan.
tailwind.config = {
    theme: {
        extend: {
            colors: {
                hsOrange: '#FF8A1F',   // koin, warna utama
                hsYellow: '#FFC83D',
                hsGreen: '#2EBD74',    // status aman
                hsRed: '#FF5B5B',      // status kritis
                hsBlue: '#4A90F7',
                hsPurple: '#8B6CF0',
                hsDark: '#2D2216'      // tinta cokelat tua
            },
            fontFamily: {
                display: ['Satoshi', 'sans-serif'],
                sans: ['Satoshi', 'system-ui', 'sans-serif']
            }
        }
    }
};
