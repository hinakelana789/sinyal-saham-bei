
export default async (request) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0"
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
          error: "API Key belum diatur di Netlify.",
          rows: []
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

    const allRows = [];
    const seenCursors = new Set();
    let cursor = "";
    let pages = 0;
    let lastResult = null;

    while (pages < 5) {
      const endpoint =
        `https://use.api.co.id/idx/v2/chart/daily/${symbol}` +
        `?cursor=${encodeURIComponent(cursor)}`;

      const apiResponse = await fetch(endpoint, {
        method: "GET",
        cache: "no-store",
        headers: {
          "x-api-co-id": apiKey
        }
      });

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

      lastResult = result;
      pages++;

      const possibleRows = [
        result?.data?.data,
        result?.data?.rows,
        result?.data?.items,
        result?.data,
        result?.rows,
        result?.items
      ];

      const rows = possibleRows.find(
        (item) => Array.isArray(item)
      ) || [];

      allRows.push(...rows);

      const nextCursor = result?.data?.meta?.cursor;
console.log("DEBUG PAGINATION:", JSON.stringify({
  dataType: Array.isArray(result?.data)
    ? "array"
    : typeof result?.data,
  dataKeys: result?.data &&
    typeof result.data === "object"
      ? Object.keys(result.data)
      : [],
  meta: result?.data?.meta || null,
  nextCursorFound: Boolean(nextCursor)
}));
      
      if (
        !nextCursor ||
        typeof nextCursor !== "string" ||
        seenCursors.has(nextCursor) ||
        rows.length === 0
      ) {
        break;
      }

      seenCursors.add(nextCursor);
      cursor = nextCursor;
    }

    const uniqueRows = [];
    const seenRows = new Set();

    for (const row of allRows) {
      const key = JSON.stringify(row);

      if (!seenRows.has(key)) {
        seenRows.add(key);
        uniqueRows.push(row);
      }
    }

    return new Response(
  JSON.stringify({
    ok: uniqueRows.length > 0,
    error: uniqueRows.length > 0
      ? null
      : "API berhasil dihubungi, tetapi format riwayat harga belum dikenali.",
    symbol,
    rows: uniqueRows,
    pages_fetched: pages,
    pagination_cursor_available:
      Boolean(lastResult?.data?.meta?.cursor),
    debug_pagination: {
      data_type: Array.isArray(lastResult?.data)
        ? "array"
        : typeof lastResult?.data,
      data_keys: lastResult?.data &&
        typeof lastResult.data === "object"
          ? Object.keys(lastResult.data)
          : [],
      meta: lastResult?.data?.meta || null,
      next_cursor_found:
        Boolean(lastResult?.data?.meta?.cursor)
    }
  }),
  { status: 200, headers }
);
  } catch (error) {
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
