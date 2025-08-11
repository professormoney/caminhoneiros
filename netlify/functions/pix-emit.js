// netlify/functions/pix-emit.js
const HUPAY_BASE = 'https://hupay.pro/api/v1';

exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*', // front e function no mesmo domínio, então ok
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ success:false, message:'Method not allowed' }) };
  }

  try {
    const { amount } = JSON.parse(event.body || '{}');
    if (!amount || Number(amount) < 1) {
      return { statusCode: 422, headers: cors, body: JSON.stringify({ success:false, message:'Valor inválido' }) };
    }

    const body = {
      amount: Number(amount),
      currency: 'BRL',
      description: `Produto R$ ${Number(amount).toFixed(2)}`,
      name: 'Doação Anônima',
      email: 'anonimo@example.com',
      document: '00011122299',
      phone: '11999999999'
      // opcional: callback_url: 'https://seu-dominio.com/webhook'
    };

    const hupay = await fetch(`${HUPAY_BASE}/charges/emit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Key': process.env.HUPAY_ACCESS_KEY,
        'X-Secret-Key': process.env.HUPAY_SECRET_KEY
      },
      body: JSON.stringify(body)
    });

    const data = await hupay.json();

    if (!hupay.ok || data.success === false) {
      return { statusCode: hupay.status, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
    }

    return {
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({
        success: true,
        data: {
          qrcode: data?.data?.qrcode,
          txid: data?.data?.txid,
          amount: data?.data?.amount,
          status: data?.data?.status
        }
      })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ success:false, message:'Erro interno' }) };
  }
};
