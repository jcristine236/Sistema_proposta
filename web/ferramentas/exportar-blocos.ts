// Exporta o catálogo de blocos do editor (src/lib/blocos.ts) para web/propostas/blocos.json,
// que o Django usa na validação e entrega ao editor em JS. Rodado na raiz do repositório:
//
//   npx tsx web/ferramentas/exportar-blocos.ts

import { writeFileSync } from "node:fs";
import { BLOCOS, EFEITOS, FUNDOS } from "../../src/lib/blocos";
import { TIPOS_CAMPO } from "../../src/lib/campos";
import { NOMES_ICONES } from "../../src/components/proposta/icones";

const blocos = BLOCOS.map(({ padrao, ...b }) => ({ ...b, padrao: padrao() }));
writeFileSync(
  "web/propostas/blocos.json",
  JSON.stringify({ blocos, fundos: FUNDOS, efeitos: EFEITOS, tiposCampo: TIPOS_CAMPO, nomesIcones: NOMES_ICONES }, null, 1) + "\n",
);
console.log(`${blocos.length} blocos exportados`);
