// Envio de avisos por e-mail (abertura, aceite, recusa, comentário).
// Se SMTP_HOST não estiver configurado, o aviso só aparece no log do servidor.
import "server-only";
import nodemailer from "nodemailer";

let transporte: ReturnType<typeof nodemailer.createTransport> | null = null;

function obterTransporte() {
  if (!process.env.SMTP_HOST) return null;
  transporte ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transporte;
}

export async function enviarAviso(para: string | null | undefined, assunto: string, texto: string) {
  const t = obterTransporte();
  if (!t || !para) {
    console.info(`[aviso] ${assunto} -> ${para ?? "(sem destinatário)"}\n${texto}`);
    return;
  }
  try {
    await t.sendMail({ from: process.env.SMTP_FROM ?? process.env.SMTP_USER, to: para, subject: assunto, text: texto });
  } catch (e) {
    console.error("[aviso] falha ao enviar e-mail:", e);
  }
}
