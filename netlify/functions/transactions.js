export async function handler(event) {
  if (event.httpMethod !== "GET" && event.httpMethod !== "OPTIONS") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { AMPLOPAY_BASE_URL, AMPLOPAY_PUBLIC_KEY, AMPLOPAY_SECRET_KEY, ALLOWED_ORIGIN } = process.env;

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN || "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, OPTIONS"
      },
      body: ""
    };
  }

  try {
    const params = new URLSearchParams(event.queryStringParameters || {});
    const url = new URL(`${AMPLOPAY_BASE_URL}/gateway/transactions`);
    if (params.get("id")) url.searchParams.set("id", params.get("id"));
    if (params.get("clientIdentifier")) url.searchParams.set("clientIdentifier", params.get("clientIdentifier"));

    const upstream = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-public-key": AMPLOPAY_PUBLIC_KEY,
        "x-secret-key": AMPLOPAY_SECRET_KEY
      }
    });

    const text = await upstream.text();
    const contentType = upstream.headers.get("content-type") || "application/json";

    return {
      statusCode: upstream.status,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN || "*"
      },
      body: text
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": ALLOWED_ORIGIN || "*" },
      body: JSON.stringify({ message: "Erro no proxy" })
    };
  }
}
