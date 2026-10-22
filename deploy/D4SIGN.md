# Contrato por assinatura eletrônica (D4Sign)

Quando o cliente **aceita** uma proposta, ele preenche razão social, CNPJ,
sócio, e-mail e WhatsApp. Com o D4Sign configurado, você gera o contrato a
partir desses dados e envia para assinatura (cliente + empresa) com **um botão**
na tela da proposta.

## Como funciona

1. Cliente aceita a proposta e preenche os dados de contratação.
2. No painel, em **Propostas → (a proposta aceita) → Contrato (D4Sign)**, você
   clica em **Gerar contrato no D4Sign**.
3. O sistema cria o documento a partir do seu **modelo (template)** do D4Sign,
   já preenchido com os dados; cadastra os **signatários** (cliente + empresa);
   e **envia para assinatura**. O D4Sign dispara os e-mails de assinatura.
4. Quando todos assinam, o D4Sign chama o **webhook** e a proposta passa a
   mostrar **"Contrato assinado"** (e você recebe um aviso).

## O que configurar

### 1. Credenciais da conta (no servidor, `.env`)
```
D4SIGN_AMBIENTE="sandbox"   # troque para "producao" quando for valer juridicamente
D4SIGN_TOKEN_API="seu-token"
D4SIGN_CRYPT_KEY="sua-chave"   # só se estiver habilitada na sua conta
D4SIGN_WEBHOOK_TOKEN="um-segredo-seu"
```
Pegue o tokenAPI e a cryptKey no painel do D4Sign (Configurações → API).
Comece em **sandbox** (sem valor jurídico) para testar.

### 2. Por empresa (painel → Empresa e marca → Contrato (D4Sign))
- **UUID do cofre**: o cofre (safe) onde os contratos ficam.
- **UUID do modelo (template)**: o contrato padrão que você criou no D4Sign,
  com os campos de preenchimento.
- **Signatário da empresa** (nome e e-mail): quem assina pela CADDI/KOLP/FASE.
- **Campos do modelo** (opcional): liga cada dado do sistema ao nome do campo
  no seu modelo do D4Sign. Um por linha, no formato `nossoCampo: campoNoModelo`.
  Dados disponíveis: `razaoSocial`, `cnpj`, `nomeSocio`, `email`, `whatsapp`,
  `cliente`, `codigo`, `titulo`, `valorMensal`, `valorUnico`, `data`.
  Exemplo:
  ```
  razaoSocial: razao_social
  cnpj: cnpj
  nomeSocio: representante
  valorMensal: mensalidade
  ```
  Sem mapeamento, usamos o próprio nome do dado como nome do campo.

### 3. Webhook (avisar quando assinarem)
No D4Sign, cadastre o endereço de webhook apontando para:
```
https://painel.caddi.com.br/api/d4sign/webhook?token=SEU_D4SIGN_WEBHOOK_TOKEN
```
(use o mesmo valor de `D4SIGN_WEBHOOK_TOKEN`). É ele que marca o contrato como
assinado automaticamente.

## Observações
- Cada empresa pode ter seu próprio cofre, modelo e signatário.
- O botão só aparece em propostas **aceitas**; é um disparo **manual** (você
  confere os dados antes).
- Enquanto o D4Sign não estiver configurado, a proposta mostra um aviso no lugar
  do botão e nada é enviado.
