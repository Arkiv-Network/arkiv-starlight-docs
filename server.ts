type FeedbackSentiment = "positive" | "negative";

type FeedbackPayload = {
  sentiment: FeedbackSentiment;
  comment?: string;
  pageUrl?: string;
  pageTitle?: string;
};

type SlackTextObject = {
  type: "plain_text" | "mrkdwn";
  text: string;
};

type SlackBlock =
  | {
      type: "header";
      text: SlackTextObject;
    }
  | {
      type: "section";
      text?: SlackTextObject;
      fields?: SlackTextObject[];
    }
  | {
      type: "divider";
    };

const DEFAULT_ALLOWED_ORIGINS = [
  "https://docs.arkiv.network",
  "https://stage.docs.arkiv.network",
  "http://localhost:4321",
  "http://127.0.0.1:4321",
];

const DEFAULT_MAX_BODY_BYTES = 16 * 1024;
const DEFAULT_MAX_COMMENT_LENGTH = 4_000;
const MAX_PAGE_TITLE_LENGTH = 200;
const MAX_PAGE_URL_LENGTH = 2_048;
const SLACK_BLOCK_TEXT_LIMIT = 2_800;
const textEncoder = new TextEncoder();

class RequestValidationError extends Error {}

const slackWebhookUrl = Bun.env.SLACK_WEBHOOK_URL;

if (!slackWebhookUrl) {
  throw new Error(
    "SLACK_WEBHOOK_URL must be set before starting the feedback service.",
  );
}

const configuredSlackWebhookUrl: string = slackWebhookUrl;

const port = parsePositiveInteger(Bun.env.PORT, 3_000);
const maxBodyBytes = parsePositiveInteger(
  Bun.env.FEEDBACK_MAX_BODY_BYTES,
  DEFAULT_MAX_BODY_BYTES,
);
const maxCommentLength = parsePositiveInteger(
  Bun.env.FEEDBACK_MAX_COMMENT_LENGTH,
  DEFAULT_MAX_COMMENT_LENGTH,
);
const allowedOrigins = parseAllowedOrigins(Bun.env.ALLOWED_ORIGINS);

function normalizePathname(pathname: string): string {
  if (pathname === "/api") {
    return "/";
  }

  if (pathname.startsWith("/api/")) {
    return pathname.slice(4);
  }

  return pathname;
}

function parsePositiveInteger(
  rawValue: string | undefined,
  fallback: number,
): number {
  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number.parseInt(rawValue, 10);

  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
}

function parseAllowedOrigins(rawValue: string | undefined): Set<string> {
  const originList = (rawValue ? rawValue.split(",") : DEFAULT_ALLOWED_ORIGINS)
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set(originList);
}

function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    Vary: "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };

  if (origin && allowedOrigins.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

function jsonResponse(
  status: number,
  payload: Record<string, unknown>,
  origin: string | null,
): Response {
  return Response.json(payload, {
    status,
    headers: corsHeaders(origin),
  });
}

function emptyResponse(status: number, origin: string | null): Response {
  return new Response(null, {
    status,
    headers: corsHeaders(origin),
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeOptionalString(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string | undefined {
  if (value == null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new RequestValidationError(`${fieldName} must be a string.`);
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return undefined;
  }

  if (normalizedValue.length > maxLength) {
    throw new RequestValidationError(
      `${fieldName} must be ${maxLength} characters or fewer.`,
    );
  }

  return normalizedValue;
}

function validatePayload(payload: unknown): FeedbackPayload {
  if (!isRecord(payload)) {
    throw new RequestValidationError("Request body must be a JSON object.");
  }

  if (payload.sentiment !== "positive" && payload.sentiment !== "negative") {
    throw new RequestValidationError(
      "sentiment must be either 'positive' or 'negative'.",
    );
  }

  return {
    sentiment: payload.sentiment,
    comment: normalizeOptionalString(
      payload.comment,
      "comment",
      maxCommentLength,
    ),
    pageUrl: normalizeOptionalString(
      payload.pageUrl,
      "pageUrl",
      MAX_PAGE_URL_LENGTH,
    ),
    pageTitle: normalizeOptionalString(
      payload.pageTitle,
      "pageTitle",
      MAX_PAGE_TITLE_LENGTH,
    ),
  };
}

function escapeSlackText(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function chunkText(text: string, chunkSize: number): string[] {
  if (text.length <= chunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    chunks.push(text.slice(currentIndex, currentIndex + chunkSize));
    currentIndex += chunkSize;
  }

  return chunks;
}

function commentBlocks(comment: string): SlackBlock[] {
  const chunks = chunkText(comment, SLACK_BLOCK_TEXT_LIMIT);

  return chunks.map((chunk, index) => ({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*Comment${chunks.length > 1 ? ` (${index + 1}/${chunks.length})` : ""}*\n${escapeSlackText(chunk)}`,
    },
  }));
}

function buildSlackMessage(feedback: FeedbackPayload) {
  const sentimentLabel =
    feedback.sentiment === "positive" ? "Positive" : "Negative";
  const fallbackTarget =
    feedback.pageUrl ?? feedback.pageTitle ?? "unknown page";

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `Docs feedback: ${sentimentLabel}`,
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Sentiment*\n${sentimentLabel}`,
        },
        {
          type: "mrkdwn",
          text: `*Received*\n${new Date().toISOString()}`,
        },
      ],
    },
  ];

  if (feedback.pageTitle || feedback.pageUrl) {
    const pageFields: SlackTextObject[] = [];

    if (feedback.pageTitle) {
      pageFields.push({
        type: "mrkdwn",
        text: `*Page title*\n${escapeSlackText(feedback.pageTitle)}`,
      });
    }

    if (feedback.pageUrl) {
      pageFields.push({
        type: "mrkdwn",
        text: `*Page URL*\n${escapeSlackText(feedback.pageUrl)}`,
      });
    }

    blocks.push({
      type: "section",
      fields: pageFields,
    });
  }

  if (feedback.comment) {
    blocks.push({ type: "divider" });
    blocks.push(...commentBlocks(feedback.comment));
  }

  return {
    text: `Docs feedback: ${sentimentLabel} (${fallbackTarget})`,
    blocks,
  };
}

async function sendToSlack(feedback: FeedbackPayload): Promise<void> {
  const response = await fetch(configuredSlackWebhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildSlackMessage(feedback)),
  });

  if (response.ok) {
    return;
  }

  const responseText = (await response.text()).slice(0, 500);
  throw new Error(
    `Slack webhook returned ${response.status}${responseText ? `: ${responseText}` : ""}`,
  );
}

async function handleFeedbackRequest(request: Request): Promise<Response> {
  const origin = request.headers.get("origin");

  if (origin && !allowedOrigins.has(origin)) {
    return jsonResponse(403, { error: "Origin not allowed." }, origin);
  }

  const declaredLength = request.headers.get("content-length");

  if (declaredLength) {
    const parsedLength = Number.parseInt(declaredLength, 10);

    if (Number.isFinite(parsedLength) && parsedLength > maxBodyBytes) {
      return jsonResponse(
        413,
        { error: `Payload exceeds ${maxBodyBytes} bytes.` },
        origin,
      );
    }
  }

  const rawBody = await request.text();
  const bodySize = textEncoder.encode(rawBody).byteLength;

  if (bodySize > maxBodyBytes) {
    return jsonResponse(
      413,
      { error: `Payload exceeds ${maxBodyBytes} bytes.` },
      origin,
    );
  }

  let parsedBody: unknown;

  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return jsonResponse(
      400,
      { error: "Request body must be valid JSON." },
      origin,
    );
  }

  let feedback: FeedbackPayload;

  try {
    feedback = validatePayload(parsedBody);
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return jsonResponse(400, { error: error.message }, origin);
    }

    throw error;
  }

  try {
    await sendToSlack(feedback);
  } catch (error) {
    console.error("Failed to deliver feedback to Slack:", error);
    return jsonResponse(502, { error: "Failed to forward feedback." }, origin);
  }

  return jsonResponse(200, { ok: true }, origin);
}

const server = Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = normalizePathname(url.pathname);
    const origin = request.headers.get("origin");

    if (pathname === "/health") {
      return jsonResponse(200, { ok: true }, origin);
    }

    if (pathname !== "/feedback") {
      return jsonResponse(404, { error: "Not found." }, origin);
    }

    if (request.method === "OPTIONS") {
      return emptyResponse(204, origin);
    }

    if (request.method !== "POST") {
      return jsonResponse(405, { error: "Method not allowed." }, origin);
    }

    return handleFeedbackRequest(request);
  },
});

console.info(
  `Feedback server listening on port ${server.port} with ${allowedOrigins.size} allowed origin${allowedOrigins.size === 1 ? "" : "s"}.`,
);
