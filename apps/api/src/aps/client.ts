const APS_AUTH_URL =
  "https://developer.api.autodesk.com/authentication/v2/token";
const APS_BASE_URL = "https://developer.api.autodesk.com";

const SERVER_SCOPE =
  "data:read data:write data:create bucket:create bucket:read";
const VIEWER_SCOPE = "viewables:read";

export type ApsTranslationStatus =
  | "pending"
  | "inprogress"
  | "success"
  | "failed"
  | "timeout";

type CachedToken = { accessToken: string; expiresAt: number };

let serverTokenCache: CachedToken | undefined;

export function isApsConfigured(): boolean {
  return Boolean(
    process.env.APS_CLIENT_ID?.trim() && process.env.APS_CLIENT_SECRET?.trim(),
  );
}

function requireApsCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.APS_CLIENT_ID?.trim();
  const clientSecret = process.env.APS_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error(
      "Autodesk Platform Services is not configured. Set APS_CLIENT_ID and APS_CLIENT_SECRET to enable DWG viewing.",
    );
  }

  return { clientId, clientSecret };
}

async function fetchApsToken(scope: string): Promise<CachedToken> {
  const { clientId, clientSecret } = requireApsCredentials();

  const response = await fetch(APS_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to obtain Autodesk Platform Services token (${response.status})`,
    );
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  return {
    accessToken: data.access_token,
    // Refresh a little early so a token never expires mid-request.
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
}

async function getServerAccessToken(): Promise<string> {
  if (serverTokenCache && serverTokenCache.expiresAt > Date.now()) {
    return serverTokenCache.accessToken;
  }
  serverTokenCache = await fetchApsToken(SERVER_SCOPE);
  return serverTokenCache.accessToken;
}

/**
 * Short-lived, narrowly-scoped token safe to hand to the browser-side
 * Autodesk Viewer SDK. Never cached server-side: minted fresh per request so
 * a leaked token has the shortest possible useful life.
 */
export async function getViewerAccessToken(): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const token = await fetchApsToken(VIEWER_SCOPE);
  return {
    accessToken: token.accessToken,
    expiresIn: Math.max(0, Math.floor((token.expiresAt - Date.now()) / 1000)),
  };
}

async function apsFetch(
  path: string,
  init: RequestInit & { accessToken?: string } = {},
): Promise<Response> {
  const accessToken = init.accessToken || (await getServerAccessToken());
  const { accessToken: _unused, ...rest } = init;

  return fetch(`${APS_BASE_URL}${path}`, {
    ...rest,
    headers: {
      ...rest.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

/** Sanitizes a value into a valid, globally-scoped OSS bucket key segment. */
export function sanitizeBucketKeySegment(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9._-]/g, "-");
}

export function resolveBucketKey(workspaceId: string): string {
  const prefix = process.env.APS_BUCKET_KEY?.trim() || "kaneo";
  return `${sanitizeBucketKeySegment(prefix)}-ws-${sanitizeBucketKeySegment(workspaceId)}`.slice(
    0,
    128,
  );
}

export async function ensureBucket(bucketKey: string): Promise<void> {
  const response = await apsFetch("/oss/v2/buckets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bucketKey, policyKey: "persistent" }),
  });

  // 409 = bucket already exists, which is the expected steady state.
  if (!response.ok && response.status !== 409) {
    throw new Error(
      `Failed to create Autodesk OSS bucket "${bucketKey}" (${response.status})`,
    );
  }
}

/**
 * Uploads a buffer to Autodesk OSS via the signed-S3-upload flow and returns
 * the base64url object URN needed by the Model Derivative API and Viewer SDK.
 */
export async function uploadObjectToOss(
  bucketKey: string,
  objectKey: string,
  body: Buffer,
): Promise<string> {
  const startResponse = await apsFetch(
    `/oss/v2/buckets/${encodeURIComponent(bucketKey)}/objects/${encodeURIComponent(objectKey)}/signeds3upload?minutesExpiration=10`,
    { method: "GET" },
  );

  if (!startResponse.ok) {
    throw new Error(
      `Failed to start Autodesk OSS upload (${startResponse.status})`,
    );
  }

  const startData = (await startResponse.json()) as {
    uploadKey: string;
    urls: string[];
  };

  const uploadUrl = startData.urls[0];
  if (!uploadUrl) {
    throw new Error("Autodesk OSS did not return an upload URL");
  }

  const putResponse = await fetch(uploadUrl, {
    method: "PUT",
    body: new Uint8Array(body),
  });
  if (!putResponse.ok) {
    throw new Error(
      `Failed to upload object to Autodesk OSS (${putResponse.status})`,
    );
  }

  const completeResponse = await apsFetch(
    `/oss/v2/buckets/${encodeURIComponent(bucketKey)}/objects/${encodeURIComponent(objectKey)}/signeds3upload`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadKey: startData.uploadKey }),
    },
  );

  if (!completeResponse.ok) {
    throw new Error(
      `Failed to complete Autodesk OSS upload (${completeResponse.status})`,
    );
  }

  const completeData = (await completeResponse.json()) as { objectId: string };
  return Buffer.from(completeData.objectId).toString("base64url");
}

export async function submitTranslationJob(urn: string): Promise<void> {
  const response = await apsFetch("/modelderivative/v2/designdata/job", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { urn },
      output: { formats: [{ type: "svf2", views: ["2d", "3d"] }] },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to submit Autodesk Model Derivative translation job (${response.status})`,
    );
  }
}

export async function getTranslationStatus(
  urn: string,
): Promise<{ status: ApsTranslationStatus; progress: string | null }> {
  const response = await apsFetch(
    `/modelderivative/v2/designdata/${encodeURIComponent(urn)}/manifest`,
  );

  if (response.status === 404) {
    return { status: "pending", progress: null };
  }

  if (!response.ok) {
    throw new Error(
      `Failed to read Autodesk Model Derivative manifest (${response.status})`,
    );
  }

  const data = (await response.json()) as {
    status: ApsTranslationStatus;
    progress?: string;
  };

  return { status: data.status, progress: data.progress ?? null };
}
