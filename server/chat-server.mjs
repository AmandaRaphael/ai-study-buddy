import { createServer } from "node:http";

const PORT = Number(process.env.PORT || 8787);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";
const DEVELOPER_PROMPT =
  "You are AI Study Buddy, a helpful study assistant. Give concise, clear educational answers.";

const allowedOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const sendJson = (response, statusCode, payload, origin) => {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin":
      origin && allowedOriginPattern.test(origin) ? origin : "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
};

const collectRequestBody = async (request) => {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
};

const buildChatCompletionMessages = (messages) => [
  {
    role: "developer",
    content: DEVELOPER_PROMPT,
  },
  ...messages.map((message) => ({
    role: message.role === "user" ? "user" : "assistant",
    content: message.content,
  })),
];

const server = createServer(async (request, response) => {
  const origin = request.headers.origin;

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {}, origin);
    return;
  }

  if (request.method !== "POST" || request.url !== "/api/chat") {
    sendJson(response, 404, { error: "Not found." }, origin);
    return;
  }

  if (!OPENAI_API_KEY) {
    sendJson(
      response,
      500,
      {
        error:
          "Missing OPENAI_API_KEY. Add it to your .env file before starting the server.",
      },
      origin,
    );
    return;
  }

  try {
    const rawBody = await collectRequestBody(request);
    const parsedBody = JSON.parse(rawBody);
    const messages = Array.isArray(parsedBody.messages) ? parsedBody.messages : [];

    if (messages.length === 0) {
      sendJson(
        response,
        400,
        { error: "Request must include a non-empty messages array." },
        origin,
      );
      return;
    }

    const openAIResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: buildChatCompletionMessages(messages),
      }),
      },
    );

    const responseJson = await openAIResponse.json();

    if (!openAIResponse.ok) {
      sendJson(
        response,
        openAIResponse.status,
        {
          error:
            responseJson?.error?.message ||
            "OpenAI request failed. Check your API key and model configuration.",
        },
        origin,
      );
      return;
    }

    const assistantText =
      typeof responseJson?.choices?.[0]?.message?.content === "string" &&
      responseJson.choices[0].message.content.trim()
        ? responseJson.choices[0].message.content.trim()
        : "I’m here, but I didn’t receive a text response from the model.";

    sendJson(response, 200, { reply: assistantText }, origin);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error.";

    sendJson(response, 500, { error: message }, origin);
  }
});

server.listen(PORT, () => {
  console.log(`AI Study Buddy chat server listening on http://localhost:${PORT}`);
});
