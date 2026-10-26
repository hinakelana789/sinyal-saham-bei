
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
          error: "Kode saham tidak valid."
        }),
        { status: 400, headers }
      );
    }

    const response = await fetch(
      `https://use.api.co.id/idx/v2/chart/daily/${symbol}`,
      {
        headers: {
          "x-api-co-id": apiKey
        }
      }
    );

    const body = await response.text();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "API saham mengembalikan status " + response.status
        }),
        { status: 502, headers }
      );
    }

    let data;

    try {
      data = JSON.parse(body);
    } catch {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Respons API bukan JSON yang valid."
        }),
        { status: 502, headers }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        rows: Array.isArray(data)
          ? data
          : Array.isArray(data.rows)
            ? data.rows
            : Array.isArray(data.data)
              ? data.data
              : []
      }),
      { status: 200, headers }
    );
  } catch {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Gagal mengambil data saham."
      }),
      { status: 500, headers }
    );
  }
};
