
export default async (request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Methods": "GET, OPTIONS"
      }
    });
  }

  try {
    const apiKey = process.env.SAHAM_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "API key belum diatur di Netlify."
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    const url = new URL(request.url);
    const symbol = (
      url.searchParams.get("symbol") || "BBCA"
    ).toUpperCase();

    if (!/^[A-Z0-9]{3,5}$/.test(symbol)) {
      return new Response(
        JSON.stringify({ error: "Kode saham tidak valid." }),
        { status: 400, headers: corsHeaders }
      );
    }

    const response = await fetch(
      `https://use.api.co.id/idx/v2/chart/daily/${symbol}`,
      {
        method: "GET",
        headers: { "x-api-co-id": apiKey }
      }
    );

    const body = await response.text();

    return new Response(body, {
      status: response.status,
      headers: corsHeaders
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Gagal mengambil data saham." }),
      { status: 500, headers: corsHeaders }
    );
  }
};
