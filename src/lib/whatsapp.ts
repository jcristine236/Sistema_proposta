// Envio de avisos por WhatsApp. Escolha o provedor em WHATSAPP_PROVIDER:
//  - "evolution": Evolution API (auto-hospedada): EVOLUTION_URL, EVOLUTION_INSTANCE, EVOLUTION_APIKEY
//  - "meta":      WhatsApp Cloud API oficial: META_TOKEN, META_PHONE_ID, META_TEMPLATE (modelo aprovado com 1 variável)
//  - "webhook":   envia JSON para WHATSAPP_WEBHOOK_URL (n8n, Make, Zapier...) com o cabeçalho X-Webhook-Secret
// Sem provedor configurado, o aviso só aparece no log do servidor.
import "server-only";
import { whatsappInternacional } from "./documentos";

async function postar(url: string, corpo: unknown, headers: Record<string, string>) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(corpo), signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
}

export async function enviarWhatsapp(numero: string | null | undefined, texto: string, contexto: Record<string, unknown> = {}) {
  if (!numero) return;
  const para = whatsappInternacional(numero);
  const prov = process.env.WHATSAPP_PROVIDER ?? "";
  try {
    if (prov === "evolution") {
      const base = process.env.EVOLUTION_URL!.replace(/\/$/, "");
      await postar(`${base}/message/sendText/${encodeURIComponent(process.env.EVOLUTION_INSTANCE!)}`, { number: para, text: texto }, { apikey: process.env.EVOLUTION_APIKEY! });
    } else if (prov === "meta") {
      // Mensagens iniciadas pela empresa exigem modelo aprovado; o texto vai como parâmetro {{1}}
      await postar(`https://graph.facebook.com/v20.0/${process.env.META_PHONE_ID}/messages`, {
        messaging_product: "whatsapp", to: para, type: "template",
        template: { name: process.env.META_TEMPLATE, language: { code: process.env.META_TEMPLATE_LANG ?? "pt_BR" },
          components: [{ type: "body", parameters: [{ type: "text", text: texto.replace(/\s*\n+\s*/g, " | ").slice(0, 1000) }] }] },
      }, { Authorization: `Bearer ${process.env.META_TOKEN}` });
    } else if (prov === "webhook") {
      await postar(process.env.WHATSAPP_WEBHOOK_URL!, { para, texto, ...contexto }, { "X-Webhook-Secret": process.env.WHATSAPP_WEBHOOK_SECRET ?? "" });
    } else {
      console.info(`[whatsapp] (sem provedor) -> ${para}\n${texto}`);
    }
  } catch (e) {
    console.error("[whatsapp] falha ao enviar:", e);
  }
}
