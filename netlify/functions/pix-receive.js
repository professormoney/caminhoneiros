export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { AMPLOPAY_BASE_URL, AMPLOPAY_PUBLIC_KEY, AMPLOPAY_SECRET_KEY, ALLOWED_ORIGIN } = process.env;

  try {
    const incoming = JSON.parse(event.body || "{}");

    const anonClient = {
      name: "Doação Anônima",
      email: "anon@seusite.com",
      phone: "(00) 00000-0000",
      document: "00000000000"
    };

    const payload = { ...incoming, client: incoming.client || anonClient };

    const upstream = await fetch(`${AMPLOPAY_BASE_URL}/gateway/pix/receive`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-public-key": AMPLOPAY_PUBLIC_KEY,
        "x-secret-key": AMPLOPAY_SECRET_KEY
      },
      body: JSON.stringify(payload)
    });

    const text = await upstream.text();
    const contentType = upstream.headers.get("content-type") || "application/json";

    return {
      statusCode: upstream.status,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN || "*",
        "Access-Control-Allow-Headers": "Content-Type"
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
