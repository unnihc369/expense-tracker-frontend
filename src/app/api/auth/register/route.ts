import { NextResponse } from "next/server";
import { postToBackend } from "@/lib/post-to-backend";

/**
 * Register BFF (browser never talks to :8080 directly).
 * Browser POST /api/auth/register → this handler → POST {API_BASE_URL}/auth/register → Express /api/auth/register
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { name, email, password } = body as {
    name?: string;
    email?: string;
    password?: string;
  };
  if (!name || !email || !password) {
    return NextResponse.json({ message: "All fields required" }, { status: 400 });
  }

  const { status, data } = await postToBackend("/auth/register", {
    name,
    email,
    password,
  });

  if (status < 200 || status >= 300) {
    return NextResponse.json(
      {
        message: (data.message as string) || "Registration failed",
        ...(typeof data.code === "string" && { code: data.code }),
        ...(data.details !== undefined && { details: data.details }),
      },
      { status }
    );
  }

  return NextResponse.json(data, { status });
}
