import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/unsubscribe?token=<userId>
 *
 * Unsubscribe endpoint for email links.
 * Returns an HTML page confirming the unsubscription.
 *
 * Note: Using userId as token is simple but not secure for high-stakes unsubscribe.
 * For production with sensitive data, consider signed tokens (JWT or HMAC).
 * For a waitlist with low risk, this is acceptable.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse(renderErrorPage("Token inválido"), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    // Find user by ID (token)
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        unsubscribed: users.unsubscribed,
      })
      .from(users)
      .where(eq(users.id, token))
      .limit(1);

    if (!user) {
      return new NextResponse(renderErrorPage("Usuario no encontrado"), {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Already unsubscribed
    if (user.unsubscribed) {
      return new NextResponse(renderSuccessPage(user.email, true), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Mark as unsubscribed
    await db
      .update(users)
      .set({
        unsubscribed: true,
        unsubscribedAt: new Date(),
      })
      .where(eq(users.id, token));

    console.log(`[Unsubscribe] User ${user.email} unsubscribed`);

    return new NextResponse(renderSuccessPage(user.email, false), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("[Unsubscribe] Error:", error);
    return new NextResponse(renderErrorPage("Error al procesar la solicitud"), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

/**
 * Render success page HTML.
 */
function renderSuccessPage(
  email: string,
  alreadyUnsubscribed: boolean
): string {
  const maskedEmail = maskEmail(email);
  const message = alreadyUnsubscribed
    ? "Ya te habías dado de baja anteriormente."
    : "Has sido dado de baja exitosamente.";

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Baja confirmada - Arbor</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #f8f7f5 0%, #ffffff 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 48px 32px;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .icon {
      width: 64px;
      height: 64px;
      background: #ecfdf5;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    .icon svg { width: 32px; height: 32px; color: #10b981; }
    h1 { color: #1e293b; font-size: 24px; margin-bottom: 12px; }
    p { color: #64748b; font-size: 16px; line-height: 1.6; }
    .email { font-weight: 600; color: #1e293b; }
    .home-link {
      display: inline-block;
      margin-top: 32px;
      padding: 12px 24px;
      background: #0f172a;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      transition: background 0.2s;
    }
    .home-link:hover { background: #1e293b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
          d="M5 13l4 4L19 7"></path>
      </svg>
    </div>
    <h1>Baja confirmada</h1>
    <p>${message}</p>
    <p style="margin-top: 12px;">
      No recibirás más correos en <span class="email">${maskedEmail}</span>
    </p>
    <a href="/" class="home-link">Volver al inicio</a>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Render error page HTML.
 */
function renderErrorPage(message: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - Arbor</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #f8f7f5 0%, #ffffff 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 48px 32px;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .icon {
      width: 64px;
      height: 64px;
      background: #fef2f2;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    .icon svg { width: 32px; height: 32px; color: #ef4444; }
    h1 { color: #1e293b; font-size: 24px; margin-bottom: 12px; }
    p { color: #64748b; font-size: 16px; line-height: 1.6; }
    .home-link {
      display: inline-block;
      margin-top: 32px;
      padding: 12px 24px;
      background: #0f172a;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      transition: background 0.2s;
    }
    .home-link:hover { background: #1e293b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
          d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </div>
    <h1>Error</h1>
    <p>${message}</p>
    <a href="/" class="home-link">Volver al inicio</a>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Mask email for display (privacy).
 * "john.doe@example.com" -> "j***e@example.com"
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}
