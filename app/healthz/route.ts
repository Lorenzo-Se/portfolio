// Health check for pve-iac (compose_app role and edge proxy expect "ok").
export const dynamic = "force-dynamic";

export function GET() {
  return new Response("ok", {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
