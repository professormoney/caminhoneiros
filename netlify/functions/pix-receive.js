export async function handler(event) {
  const { ALLOWED_ORIGIN } = process.env;
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: {
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS"
    }};
  }
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  const { AMPLOPAY_BASE_URL, AMPLOPAY_PUBLIC_KEY, AMPLOPAY_SECRET_KEY } = process.env;
  try {
    const incoming = JSON.parse(event.body || "{}");
    const anonClient = { name:"Doação Anônima", email:"anon@seusite.com", phone:"(00) 00000-0000", document:"00000000000" };
    const payload = { ...incoming, client: incoming.client || anonClient };

    console.log("[pix-receive] hasPublic:", !!AMPLOPAY_PUBLIC_KEY, "hasSecret:", !!AMPLOPAY_SECRET_KEY, "base:", AMPLOPAY_BASE_URL);

    const upstream = await fetch(`${AMPLOPAY_BASE_URL}/gateway/pix/receive`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-public-key": AMPLOPAY_PUBLIC_KEY,
        "x-secret-key": AMPLOPAY_SECRET_KEY
      },
      body: JSON.stringify(payload)
    });

    const text = await upstream.text();
    console.log("[pix-receive] upstream status:", upstream.status, "body:", text.slice(0, 400)); // log só os primeiros 400 chars

    return {
      statusCode: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/json",
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN || "*"
      },
      body: text
    };
  } catch (err) {
    console.error("[pix-receive] error:", err);
    return { statusCode: 500, headers: { "Access-Control-Allow-Origin": ALLOWED_ORIGIN || "*" }, body: JSON.stringify({ message: "Erro no proxy" }) };
  }
}
