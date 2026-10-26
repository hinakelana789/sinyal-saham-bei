
export default async (request) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...headers,
        "Access-Control-Allow-Methods": "GET, OPTIONS"
      }
    });
  }

  try {
    const apiKey = process.env.SAHAM_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "API Key belum diatur di Netlify."
        }),
        { status: 500, headers }
      );
    }

    const url = new URL(request.url);
    const symbol = (
      url.searchParams.get("symbol") || "BBCA"
    ).toUpperCase();

    if (!/^[A-Z0-9]{3,5}$/.test(symbol)) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Kode saham tidak valid.",
          rows: []
        }),
        { status: 400, headers }
      );
    }

    const apiResponse = await fetch(
      `https://use.api.co.id/idx/v2/chart/daily/${symbol}`,
      {
        method: "GET",
        headers: {
          "x-api-co-id": apiKey
        }
      }
    );

    const body = await apiResponse.text();

    let result;

    try {
      result = JSON.parse(body);
    } catch {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Respons API bukan JSON yang valid.",
          rows: []
        }),
        { status: 502, headers }
      );
    }

    if (!apiResponse.ok || result.is_success !== true) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: result.message ||
            `API saham mengembalikan status ${apiResponse.status}.`,
          rows: []
        }),
        { status: 502, headers }
      );
    }

    const possibleRows = [
      result?.data?.data,
      result?.data?.rows,
      result?.data?.items,
      result?.data,
      result?.rows,
      result?.items,
      result
    ];

    const rows = possibleRows.find(
      (item) => Array.isArray(item)
    ) || [];

    return new Response(
      JSON.stringify({
        ok: rows.length > 0,
        error: rows.length > 0
          ? null
          : "API berhasil dihubungi, tetapi format atau isi riwayat harga belum dikenali.",
        symbol,
        rows
      }),
      { status: 200, headers }
    );
  } catch {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Koneksi ke API saham gagal. Periksa koneksi dan konfigurasi Netlify.",
        rows: []
      }),
      { status: 500, headers }
    );
  }
};
