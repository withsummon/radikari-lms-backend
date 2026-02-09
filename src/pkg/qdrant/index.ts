import { QdrantClient } from "@qdrant/js-client-rest";

function buildQdrantClient() {
  const rawUrl = process.env.QDRANT_URL;
  const apiKey = process.env.QDRANT_API_KEY;

  // Optional override if you want to force a specific port regardless of URL parsing.
  const envPort = process.env.QDRANT_PORT;

  if (!rawUrl) {
    // Keep behavior consistent if QDRANT_URL isn't set.
    return new QdrantClient({
      url: rawUrl,
      apiKey,
    });
  }

  const u = new URL(rawUrl);

  const https = u.protocol === "https:";

  /**
   * IMPORTANT:
   * The WHATWG URL parser normalizes default ports away:
   * - http://host:80  => u.port === ""
   * - https://host:443 => u.port === ""
   *
   * @qdrant/js-client-rest uses:
   *   parsedUrl.port ? Number(parsedUrl.port) : port
   * with default port=6333, so if u.port is "", it falls back to 6333.
   *
   * Workaround: pass host+port explicitly.
   */
  let port: number;
  if (envPort) {
    port = Number(envPort);
  } else if (u.port) {
    port = Number(u.port);
  } else {
    port = https ? 443 : 80;
  }

  // If you ever need to support a path prefix (e.g. https://example.com/qdrant),
  // set it as prefix OR in the URL, but not both (library restriction).
  const prefix = u.pathname && u.pathname !== "/" ? u.pathname : undefined;

  return new QdrantClient({
    host: u.hostname,
    port,
    https,
    apiKey,
    ...(prefix ? { prefix } : {}),
    // If you’re behind Traefik/self-signed/odd setup, this avoids failing on version probing.
    checkCompatibility: false,
  });
}

export const qdrantClient = buildQdrantClient();
