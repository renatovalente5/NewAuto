#!/usr/bin/env node
/* A GUARDA DOS DADOS, NO CI (antes de gerar o site; não precisa de segredos).
 *
 * Lê os JSON de data/ e corre as regras de .github/regras.mjs — as MESMAS que o
 * painel mostra por baixo dos campos e que o Worker do painel confere ao gravar.
 *
 * O PRINCÍPIO: um problema de UMA viatura nunca pára a publicação das outras.
 * Só pára o que não se pode publicar sem partir o site inteiro (classe
 * «bloqueia»: a estrutura dos dados do stand e os telefones). O resto vai para
 * o resumo da corrida.
 *
 *   node .github/guardas.mjs [--raiz <pasta>]
 *       Confere. Sai com 1 só se houver um «bloqueia». No máximo 9 ::error, 9
 *       ::warning e 9 ::notice — o GitHub guarda 10 de cada por passo, e uma
 *       lista cortada não pode passar por completa («e mais N»). A lista
 *       INTEIRA vai para o resumo da corrida ($GITHUB_STEP_SUMMARY).
 *
 *   node .github/guardas.mjs --neutralizar <pasta>
 *       Confere outra vez e escreve, em <pasta>/data/viaturas/, A CÓPIA QUE O
 *       GERADOR LÊ: as viaturas com um «neutraliza» de esconder saem com
 *       oculta: true, as fotografias que não existem saem da galeria, e um
 *       ficheiro ilegível apaga-se. SÓ os ficheiros que mudam. O publicar.yml
 *       não faz commit de nada, por isso a cópia neutralizada nunca chega ao
 *       repositório; fora do CI (sem GITHUB_ACTIONS=true) recusa-se a escrever
 *       no próprio repositório: só numa cópia.
 */
import { readFileSync, writeFileSync, appendFileSync, readdirSync, lstatSync, rmSync, realpathSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FICHEIROS, PASTAS, problemas, neutralizar, descreverEfeitos, serializar, terminacaoDe } from './regras.mjs';

const RAIZ_DO_REPOSITORIO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const MAX_ANOTACOES = 9;

/* Os dados como o gerador os lê: o definicoes.json e cada *.json do primeiro
   nível de data/viaturas/. Um «.json» que não é um ficheiro normal pára aqui. */
export function lerDados(raiz) {
  const estrutura = [];
  const dados = { viaturas: Object.create(null), definicoes: null };
  const pDef = join(raiz, FICHEIROS.definicoes);
  let st = null;
  try { st = lstatSync(pDef); } catch { st = null; }
  if (st && !st.isFile()) estrutura.push({ classe: 'bloqueia', chave: `estrutura:${FICHEIROS.definicoes}`, ficheiro: FICHEIROS.definicoes, ecra: 'Dados do stand', mensagem: `${FICHEIROS.definicoes} não é um ficheiro normal.` });
  else if (st) dados.definicoes = readFileSync(pDef, 'utf8');
  let entradas = [];
  try { entradas = readdirSync(join(raiz, PASTAS.viaturas), { withFileTypes: true }); } catch { entradas = []; }
  for (const e of entradas) {
    if (!e.name.endsWith('.json')) continue;
    if (!e.isFile()) { estrutura.push({ classe: 'bloqueia', chave: `estrutura:${PASTAS.viaturas}/${e.name}`, ficheiro: `${PASTAS.viaturas}/${e.name}`, ecra: 'Viaturas', mensagem: `${PASTAS.viaturas}/${e.name} não é um ficheiro normal.` }); continue; }
    dados.viaturas[e.name.slice(0, -'.json'.length)] = readFileSync(join(raiz, PASTAS.viaturas, e.name), 'utf8');
  }
  return { dados, estrutura };
}

/* O que está numa pasta (ficheiros e pastas), como o gerador o vê. */
export const listarPastaEm = (raiz) => (pasta) => { try { return readdirSync(join(raiz, pasta)); } catch { return []; } };

export function conferir(raiz, { hoje = new Date().toISOString().slice(0, 10) } = {}) {
  const { dados, estrutura } = lerDados(raiz);
  const lista = [...estrutura, ...problemas(dados, { listarPasta: listarPastaEm(raiz), hoje })];
  return { dados, problemas: lista };
}

const umaLinha = (s) => String(s ?? '').replace(/\s+/g, ' ').replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A').slice(0, 900);

function anotar(lista) {
  const grupos = { bloqueia: [], neutraliza: [], avisa: [] };
  for (const p of lista) grupos[p.classe]?.push(p);
  const comando = { bloqueia: 'error', neutraliza: 'warning', avisa: 'notice' };
  for (const [classe, l] of Object.entries(grupos)) {
    l.slice(0, MAX_ANOTACOES).forEach((p) => console.log(`::${comando[classe]} title=${umaLinha(p.ecra)}::${umaLinha(p.mensagem)}`));
    if (l.length > MAX_ANOTACOES) console.log(`::${comando[classe]}::e mais ${l.length - MAX_ANOTACOES}`);
  }
}

function resumo(lista, neutralizados = []) {
  const f = process.env.GITHUB_STEP_SUMMARY;
  if (!f) return;
  const linhas = ['## A guarda dos dados', ''];
  const nomes = { bloqueia: 'Param a publicação', neutraliza: 'Escondido do site', avisa: 'Avisos e lembretes' };
  for (const classe of ['bloqueia', 'neutraliza', 'avisa']) {
    const l = lista.filter((p) => p.classe === classe);
    if (!l.length) continue;
    linhas.push(`### ${nomes[classe]} (${l.length})`, '');
    for (const p of l) linhas.push(`- **${p.ecra}** — ${p.mensagem}`);
    linhas.push('');
  }
  if (neutralizados.length) {
    linhas.push('### No site', '');
    for (const n of descreverEfeitos(neutralizados)) linhas.push(`- ${n.titulo ?? n.slug}: ${n.descricao}`);
  }
  if (!lista.length) linhas.push('Sem nada a dizer.');
  appendFileSync(f, `${linhas.join('\n')}\n`);
}

function main(argv) {
  const i = argv.indexOf('--neutralizar');
  const j = argv.indexOf('--raiz');
  const raiz = resolve(i >= 0 ? argv[i + 1] ?? '.' : j >= 0 ? argv[j + 1] ?? '.' : RAIZ_DO_REPOSITORIO);
  const { dados, problemas: lista } = conferir(raiz);
  const bloqueia = lista.filter((p) => p.classe === 'bloqueia');

  if (i < 0) {
    anotar(lista);
    resumo(lista);
    const n = (c) => lista.filter((p) => p.classe === c).length;
    console.log(`guarda: ${n('bloqueia')} param, ${n('neutraliza')} escondem, ${n('avisa')} avisos`);
    return bloqueia.length ? 1 : 0;
  }

  if (bloqueia.length) { anotar(bloqueia); console.log('guarda: há o que pare a publicação — não se neutraliza nada'); return 1; }
  if (realpathSync(raiz) === realpathSync(RAIZ_DO_REPOSITORIO) && process.env.GITHUB_ACTIONS !== 'true') {
    console.error('guarda: --neutralizar escreve nos ficheiros de dados; fora do CI, só numa cópia do repositório.');
    return 2;
  }
  const { viaturas, neutralizados } = neutralizar(dados, lista);
  for (const [nome, v] of Object.entries(viaturas)) {
    const caminho = join(raiz, PASTAS.viaturas, `${nome}.json`);
    if (v === null) rmSync(caminho, { force: true });
    else writeFileSync(caminho, serializar(v, terminacaoDe(dados.viaturas[nome])));
  }
  resumo([], neutralizados);
  console.log(neutralizados.length ? `guarda: ${neutralizados.length} viatura(s) com mudanças na cópia publicada` : 'guarda: nada a neutralizar');
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(main(process.argv.slice(2)));
