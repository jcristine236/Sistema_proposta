# Refrimaia, 3 opções de site institucional

Cada pasta é um **projeto independente** (HTML + CSS + JS puros, sem build). Pode editar, copiar ou publicar uma sem afetar as outras.

| Pasta | Estilo | Destaques |
|---|---|---|
| `opcao-1-tradicional/` | Tradicional, claro, corporativo | Barra superior com contatos, topo com foto de fundo, cards de serviços, faixa de números, PMOC em destaque, setores, marcas. Animação discreta de entrada. |
| `opcao-2-efeitos/` | Escuro, tecnológico, com mais efeitos | Partículas de "ar frio" que reagem ao mouse, palavra rotativa no título, títulos revelados palavra a palavra, contadores animados, cards com inclinação 3D e brilho, botões magnéticos, parallax, marquee de clientes/marcas, linha do tempo que se desenha ao rolar, barra de progresso de leitura. |
| `opcao-3-moderno/` | Claro, minimalista, moderno | Menu flutuante em pílula, topo com foto larga e números, carrossel horizontal arrastável de serviços, serviços em abas, formulário com seleção de tipo de cliente, rodapé arredondado, revelação com desfoque. |

Todas têm: **Home, Sobre, Serviços, Contato**, botão flutuante de WhatsApp, formulário de orçamento (abre o WhatsApp com a mensagem pronta), bloco "Como chegar" com botões para Google Maps e Waze, FAQ, SEO básico (títulos, descrições e schema `HVACBusiness`) e layout responsivo. Também respeitam a configuração do sistema que reduz animações.

**Detalhes exclusivos:** etiquetas de seção em fonte técnica (mono), lista de serviços numerada em largura total, com linha de destaque no item sob o mouse (opções 1 e 2), fotos reveladas por uma cortina na cor da marca, legenda técnica "água gelada 7 °C" no topo, mostrador de temperatura no cabeçalho que "resfria" de 32 °C até o setpoint de 7 °C conforme a rolagem (opção 2) e cards que revelam a foto do serviço ao passar o mouse (opção 3).

## Como visualizar
Abra o `index.html` de qualquer pasta no navegador.

## Como editar
- **Cores:** variáveis no topo de `css/style.css` (`:root`).
- **Textos:** direto nos arquivos `.html` de cada pasta.
- **Fotos:** as imagens em `img/fotos/` são **ilustrativas, geradas por IA** (Canva). Para trocar por fotos reais, basta substituir o arquivo mantendo o mesmo nome (ex.: `img/fotos/chiller.jpg`). Cada opção tem sua própria cópia.
- **Formulário:** hoje envia pelo WhatsApp (sem servidor). Para receber por e-mail, troque a função no fim de `js/main.js` por um envio para PHP/Formspree etc.

## Mapa
A visualização online bloqueia mapas incorporados, então usamos o bloco "Como chegar". No domínio final (refrimaia.com.br) dá para voltar a incorporar o mapa do Google.

## Pontos para confirmar com a cliente
1. **Nomes de clientes** (Cargill, Ball, Rossetti, Italbronze, Bauducco, Arteb): o formulário não deixa claro se há autorização para citá-los. Se não houver, remova ou troque por segmentos.
2. **Endereço:** a ficha pede para exibir "SP". Usamos "Rua Francisco Aires, 299, Macedo · Grande São Paulo, SP". O mapa aponta para o endereço real em Guarulhos.
3. **Responsável técnico:** a pedido da cliente, o nome do engenheiro foi removido. O site cita apenas "responsável técnico registrado no CREA". O número "26 anos" saiu e deu lugar a "12 veículos na frota própria".
4. **Fotos reais:** as atuais são ilustrativas (IA). A da seção de segurança mostra um engenheiro de costas, sem rosto identificável.
5. Logo em **PNG/SVG em alta resolução**. O atual (`img/logo.png`) foi ampliado de um arquivo pequeno e teve o fundo removido.

## Referências de mercado (pesquisa)
Concorrentes e referências do setor em SP (Refrisat em Guarulhos, Tempoar, Homefrio, Instal Air, além das páginas de serviço de fabricantes como LG e Daikin) seguem um padrão parecido:
serviços técnicos em destaque (chiller, PMOC, retrofit), prova de responsabilidade técnica (CREA/ART), atendimento emergencial e contato rápido por WhatsApp.
A maioria tem sites simples ou aparece só em diretórios. Por isso, um site com posicionamento técnico, PMOC em destaque e foco em indústria é um diferencial claro para a Refrimaia.
O site de referência indicado pela cliente (afriotherm.com.br) não abriu durante a pesquisa.
