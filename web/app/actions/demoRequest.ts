"use server";

/**
 * Server action for the B2B demo request form.
 * Sends a notification email to the team via Resend.
 */

import { emailService, EMAIL_CONFIG } from "@/lib/email/service";

interface DemoRequestResult {
  success: boolean;
  error?: string;
}

export async function submitDemoRequest(
  formData: FormData
): Promise<DemoRequestResult> {
  const name = formData.get("name")?.toString().trim();
  const school = formData.get("school")?.toString().trim();
  const role = formData.get("role")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim() || "—";
  const message = formData.get("message")?.toString().trim() || "—";

  if (!name || !school || !role || !email) {
    return { success: false, error: "Faltan campos obligatorios." };
  }

  const subject = `[Demo Request] ${school} — ${name}`;
  const html = `
    <h2>Nueva solicitud de demo</h2>
    <table style="border-collapse:collapse;font-family:sans-serif;">
      <tr><td style="padding:6px 12px;font-weight:600;">Nombre</td>
          <td style="padding:6px 12px;">${esc(name)}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:600;">Colegio</td>
          <td style="padding:6px 12px;">${esc(school)}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:600;">Rol</td>
          <td style="padding:6px 12px;">${esc(role)}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:600;">Email</td>
          <td style="padding:6px 12px;">
            <a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
      <tr><td style="padding:6px 12px;font-weight:600;">Teléfono</td>
          <td style="padding:6px 12px;">${esc(phone)}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:600;">Mensaje</td>
          <td style="padding:6px 12px;">${esc(message)}</td></tr>
    </table>
  `.trim();

  const text = [
    `Nueva solicitud de demo`,
    `Nombre: ${name}`,
    `Colegio: ${school}`,
    `Rol: ${role}`,
    `Email: ${email}`,
    `Teléfono: ${phone}`,
    `Mensaje: ${message}`,
  ].join("\n");

  const result = await emailService.send({
    to: EMAIL_CONFIG.replyTo,
    subject,
    html,
    text,
  });

  if (!result.success) {
    console.error("[DemoRequest] Email send failed:", result.error);
    return {
      success: false,
      error: "No pudimos enviar tu solicitud. Intenta de nuevo.",
    };
  }

  console.log(
    `[DemoRequest] Lead captured: ${school} / ${name} / ${email}`
  );
  return { success: true };
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
