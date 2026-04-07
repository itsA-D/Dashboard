import { NextRequest } from "next/server";

const DEFAULT_BACKEND_ORIGIN = "http://127.0.0.1:8000";

function getBackendOrigin() {
  return process.env.BACKEND_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_BACKEND_ORIGIN;
}

async function proxyToBackend(request: NextRequest, path: string[]) {
  const backendOrigin = getBackendOrigin().replace(/\/$/, "");
  const hasTrailingSlash = request.nextUrl.pathname.endsWith("/");
  const normalizedPath = path.join("/");
  const trailingSlash = hasTrailingSlash ? "/" : "";
  const targetUrl = `${backendOrigin}/api/v1/${normalizedPath}${trailingSlash}${request.nextUrl.search}`;

  const upstreamHeaders = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "host" || lower === "content-length") {
      return;
    }
    upstreamHeaders.set(key, value);
  });

  const requestBody = request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();

  const upstream = await fetch(targetUrl, {
    method: request.method,
    headers: upstreamHeaders,
    body: requestBody,
    cache: "no-store",
  });

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (key.toLowerCase() === "content-encoding") {
      return;
    }
    responseHeaders.set(key, value);
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxyToBackend(request, params.path);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxyToBackend(request, params.path);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxyToBackend(request, params.path);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxyToBackend(request, params.path);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxyToBackend(request, params.path);
}

export async function OPTIONS(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxyToBackend(request, params.path);
}
