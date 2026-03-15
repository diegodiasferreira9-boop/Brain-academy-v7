// netlify/functions/gemini.js
// Coloque sua chave no painel do Netlify:
//   Site settings → Environment variables → GEMINI_API_KEY

exports.handler = async function (event) {
  // Só aceita POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Chave vinda da variável de ambiente do Netlify
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GEMINI_API_KEY não configurada no Netlify.' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido.' }) };
  }

  const history = body.history || [];

  // Instrução do sistema como primeira mensagem do modelo
  const systemTurn = {
    role: 'user',
    parts: [{ text: 'Leia e siga estas instruções durante toda a conversa:' +
      ' Você é o Professor IA do Brain Academy, um app educativo divertido para crianças e jovens.' +
      ' Responda SEMPRE em Português do Brasil, de forma didática, clara e animada 🎉.' +
      ' Para matemática, mostre o passo a passo alinhado verticalmente usando espaços.' +
      ' Para outras matérias (história, ciências, português, geografia), use tópicos e exemplos simples.' +
      ' Seja encorajador, use emojis com moderação e respostas objetivas.' }],
  };
  const systemAck = {
    role: 'model',
    parts: [{ text: 'Entendido! Estou pronto para ajudar como Professor IA. 🧑‍🏫' }],
  };

  const contents = [systemTurn, systemAck, ...history];

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data?.error?.message || 'Erro na API Gemini.' }),
      };
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Não consegui gerar uma resposta. Tente novamente!';

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno: ' + err.message }),
    };
  }
};
