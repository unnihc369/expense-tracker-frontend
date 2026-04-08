import { NextResponse } from "next/server";
import { postToBackend } from "@/lib/post-to-backend";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from "@/lib/auth-cookies";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { email, password } = body as { email?: string; password?: string };
  if (!email || !password) {
    return NextResponse.json({ message: "Email and password required" }, { status: 400 });
  }

  const { status, data } = await postToBackend("/auth/login", { email, password });

  if (status < 200 || status >= 300) {
    return NextResponse.json(
      {
        message: (data.message as string) || "Login failed",
        ...(typeof data.code === "string" && { code: data.code }),
        ...(data.details !== undefined && { details: data.details }),
      },
      { status }
    );
  }

  const token = data.token as string | undefined;
  if (!token) {
    return NextResponse.json(
      {
        message: "No token from server",
        code: "NO_TOKEN",
      },
      { status: 502 }
    );
  }

  const response = NextResponse.json({
    user: data.user,
    ok: true,
  });
  response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
  return response;
}
