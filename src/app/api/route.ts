import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest) => {
  const { env } = getCloudflareContext();
  const query = request.nextUrl.searchParams; 
  const response = await env.EMAIL.send({
    to: query?.get("to") || "",
    from: env.EMAIL_FROM,
    subject: "Welcome to our service!",
    html: "<h1>Welcome!</h1><p>Thanks for signing up.</p>",
    text: "Welcome! Thanks for signing up.",
  });

  return new NextResponse(JSON.stringify({ success: true, response }), {
    headers: { "Content-Type": "application/json" },
  });
};
