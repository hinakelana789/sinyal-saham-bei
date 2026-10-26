# Sinyal Saham BEI
Netlify site dengan fungsi server untuk mengambil riwayat harga harian dari Api.co.id.
Atur `SAHAM_API_KEY` di Environment variables Netlify. Jangan pernah simpan API key di GitHub.
Fungsi memakai GET https://use.api.co.id/idx/v2/chart/daily/{symbol} dengan header x-api-co-id.
Paket gratis memberi akses riwayat harian; quote/intraday bisa memerlukan paket Starter atau lebih tinggi.
Sinyal teknikal bersifat informatif, bukan jaminan keuntungan.