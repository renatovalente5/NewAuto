/* AS REGRAS DOS DADOS DO NEWAUTO, NUM SÓ SÍTIO.
 *
 * Quatro leitores, e os quatro têm de ouvir o mesmo:
 *   · o CI do site (.github/guardas.mjs), antes de gerar o site;
 *   · o gerador (scripts/gerar.mjs), que tira daqui o que é um telefone, um
 *     email ou um endereço que se possa pôr num link, e o horário;
 *   · o painel, no browser (o erro aparece por baixo do campo, antes de gravar);
 *   · o Worker do painel, ao gravar (recusa os problemas NOVOS que não sejam
 *     lembretes).
 * O painel usa uma CÓPIA BYTE A BYTE deste ficheiro (estatico/js/regras.js no
 * repositório do painel), com um teste de SHA-256 que falha se divergirem. Por
 * isso é um ES module puro: nenhum import, nada de node:*, fs, process ou
 * require. Corre tal e qual no browser, num Worker e no Node.
 *
 * Veio das regras da LR Motors (o mesmo molde de painel), com os dados do
 * NewAuto: todas as viaturas numa pasta só (uma vendida fica no mesmo ficheiro,
 * com o estado «vendida» e a data), as fotografias carregadas em
 * assets/viaturas/<slug>/, e os dados do stand com o horário já estruturado.
 *
 * CADA PROBLEMA TEM UMA CLASSE:
 *   · bloqueia   — a publicação pára e o site fica como estava. Só a estrutura
 *                  do definicoes.json (de que TODAS as páginas dependem) e os
 *                  telefones (de que sai a nota do custo da chamada).
 *   · neutraliza — uma viatura, só na cópia que o gerador lê (o ficheiro do
 *                  repositório não muda — ver neutralizar()): sem marca, sem
 *                  modelo, sem fotografias ou SEM UM DOS SETE CAMPOS QUE A LEI
 *                  DOS USADOS OBRIGA A MOSTRAR (DL 74/93, art. 2.º n.º 1), fica
 *                  escondida do site; uma fotografia que não existe não aparece.
 *                  Um problema de UMA viatura nunca pára a publicação das outras.
 *   · avisa      — só aviso. No painel, os que não são lembrete são erro de
 *                  campo (valor fora da lista, número fora dos limites, texto
 *                  comprido de mais): o painel não os deixa gravar, mas um valor
 *                  estranho num commit à mão não é razão para parar o site.
 *                  Os LEMBRETES (lembrete: true) não são erro de ninguém: o painel
 *                  grava na mesma e mostra-os no Início.
 *
 * UMA VIATURA ESCONDIDA (oculta: true) É UM RASCUNHO: não vai para o site, e
 * por isso o que lhe falta não é problema de ninguém — só lembretes. É assim
 * que o dono grava uma viatura que ainda não tem tudo.
 *
 * dados = {
 *   viaturas:   { <nome>: texto | objecto | null },   data/viaturas/<nome>.json
 *   definicoes: texto | objecto | null,               data/definicoes.json
 * }
 *   <nome> é o nome do ficheiro sem «.json» — e é o endereço da página (o
 *   gerador tira o slug do nome do ficheiro, não do campo «slug»).
 *   texto = o conteúdo do ficheiro; null = o ficheiro não existe (ignorado).
 *   Uma chave de topo AUSENTE não se confere (o painel pode conferir só uma
 *   viatura); `definicoes: null` (presente, mas null) é «falta o ficheiro».
 *
 * problema = {
 *   classe:   'bloqueia' | 'neutraliza' | 'avisa',
 *   chave:    estável: 'viatura:<slug>:<regra>' ou 'definicoes:<campo>[:<regra>]'.
 *             O Worker compara as chaves do HEAD com as da gravação e recusa só
 *             as novas; por isso UMA CHAVE TEM SEMPRE A MESMA CLASSE.
 *   ficheiro: 'data/viaturas/<nome>.json' ou 'data/definicoes.json';
 *   ecra:     o ecrã do painel onde se corrige («Viaturas › BMW Série 1»);
 *   mensagem: para o dono, em português simples, sem caminhos de JSON;
 *   campo?:   o campo onde o painel mostra o erro ('preco', 'contactos.telefone');
 *   campos?:  quando são vários;
 *   efeito?:  só nos «neutraliza»: 'esconder' | 'sem_fotografia';
 *   slug?:    só nas viaturas;
 *   foto?, indice?: só nos problemas de uma fotografia;
 *   lembrete?: true nos avisos que não são erro de ninguém.
 * }
 *
 * «NÃO FOI DITO» E NULL SÃO O MESMO, e o vazio testa-se ANTES de converter:
 * Number(null) é 0, e 0 é uma escolha (zero donos anteriores).
 */

/* ------------------------------------------------------------------ */
/* Onde estão as coisas                                                */
/* ------------------------------------------------------------------ */

export const FICHEIROS = { definicoes: 'data/definicoes.json' };
export const PASTAS = { viaturas: 'data/viaturas' };
export const ficheiroDaViatura = (nome) => `${PASTAS.viaturas}/${nome}.json`;
/* A BIBLIOTECA: as fotografias carregadas no painel, uma pasta por viatura
   (assets/viaturas/<slug>/<slug>-<8 hex>.jpg). Na mesma pasta vivem as das
   viaturas de exemplo (NN-207.webp…, og.jpg), que o scripts/imagens.py faz e
   que não são da biblioteca. As VARIANTES (480/960/1600 px) são da publicação:
   nunca se escrevem. */
export const BIBLIOTECA = 'assets/viaturas';
export const VARIANTES = 'assets/viaturas/_v';
/* O que o scripts/imagens.py faz para as viaturas de exemplo: não é da biblioteca. */
export const RE_FICHEIRO_DE_EXEMPLO = /^(?:\d{2}-(?:207|414|828)\.(?:webp|jpg)|og\.jpg)$/;

/* ------------------------------------------------------------------ */
/* As listas                                                           */
/* ------------------------------------------------------------------ */

export const MARCAS = ['Alfa Romeo', 'Audi', 'BMW', 'Citroën', 'Cupra', 'Dacia', 'DS', 'Fiat', 'Ford', 'Honda', 'Hyundai',
  'Jaguar', 'Jeep', 'Kia', 'Land Rover', 'Lexus', 'Mazda', 'Mercedes-Benz', 'MINI', 'Mitsubishi', 'Nissan', 'Opel',
  'Peugeot', 'Porsche', 'Renault', 'Seat', 'Škoda', 'Smart', 'Suzuki', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo'];
export const ESTADOS = ['disponivel', 'reservada', 'vendida'];
export const NOMES_ESTADOS = { disponivel: 'À venda', reservada: 'Reservada', vendida: 'Vendida' };
/* O mês guarda-se com dois algarismos («03»); o painel mostra o nome. */
export const MESES = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
export const NOMES_MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
export const COMBUSTIVEIS = ['Gasolina', 'Gasóleo', 'Híbrido', 'Híbrido Plug-in', 'Elétrico', 'GPL'];
export const CAIXAS = ['Manual', 'Automática'];
export const SEGMENTOS = ['Citadino', 'Utilitário', 'Berlina', 'Carrinha', 'SUV/TT', 'Monovolume', 'Coupé', 'Cabrio', 'Comercial'];
export const ORIGENS = ['Nacional', 'Importado'];
/* A GARANTIA DE UM USADO é uma escolha entre duas frases, nunca texto livre: o
   que o site diz vincula o stand (DL 84/2021, art. 43.º), e a de 12 meses foi
   revogada em 2022. A redução a 18 meses só vale com acordo escrito. */
export const GARANTIAS_USADO = [
  'Garantia legal de conformidade de 3 anos (DL 84/2021)',
  'Garantia legal de conformidade, reduzida a 18 meses por acordo escrito',
];
export const GARANTIAS_FABRICA = ['Não aplicável', 'Sim, ainda em vigor'];
export const EXTENSOES_FOTO = ['jpg', 'jpeg', 'png', 'webp'];

/* Os campos de uma viatura, pela ordem em que estão nos ficheiros. Uma chave
   nova entra por esta ordem (ordenarComo()); as que já estão ficam onde estão. */
export const CAMPOS_VIATURA = [
  'slug', 'referencia', 'titulo', 'marca', 'modelo', 'versao', 'matricula', 'estado', 'data_venda',
  'destaque', 'oculta', 'demonstracao', 'preco', 'negociavel', 'aceita_retoma', 'ano_construcao',
  'mes_matricula', 'ano_matricula', 'registos_anteriores', 'quilometros', 'origem', 'livro_revisoes',
  'garantia_usado', 'garantia_fabrica', 'combustivel', 'caixa', 'potencia_cv', 'cilindrada_cc',
  'segmento', 'portas', 'lugares', 'cor', 'equipamento', 'descricao', 'ordem', 'fotos_origem', 'galeria',
];
/* Sempre escritos pelo painel, com o valor explícito. */
export const BOOLEANOS_VIATURA = ['destaque', 'oculta', 'demonstracao', 'negociavel', 'aceita_retoma', 'livro_revisoes'];
export const POR_OMISSAO = {
  estado: 'disponivel', destaque: false, oculta: false, demonstracao: false, negociavel: false,
  aceita_retoma: true, livro_revisoes: false, origem: 'Nacional', garantia_usado: GARANTIAS_USADO[0],
  garantia_fabrica: GARANTIAS_FABRICA[0], portas: 5, lugares: 5, ordem: 50,
};
/* OS SETE ELEMENTOS DO DL 74/93, art. 2.º n.º 1 (com a data da matrícula em
   dois campos): sem um deles, a viatura não vai para o site. */
export const OBRIGATORIOS_LEI = ['matricula', 'preco', 'ano_construcao', 'mes_matricula', 'ano_matricula', 'registos_anteriores', 'garantia_usado', 'garantia_fabrica'];
/* E os que o site precisa para desenhar o cartão. */
export const OBRIGATORIOS_SITE = ['marca', 'modelo', 'quilometros', 'combustivel', 'caixa'];

export const NOMES_CAMPOS = {
  slug: 'Endereço da página', referencia: 'Referência', titulo: 'Título', marca: 'Marca', modelo: 'Modelo',
  versao: 'Versão', matricula: 'Matrícula', estado: 'Estado', data_venda: 'Data da venda',
  destaque: 'Destaque na página inicial', oculta: 'Escondida do site', demonstracao: 'Dados de exemplo',
  preco: 'Preço', negociavel: 'Preço negociável', aceita_retoma: 'Aceita retoma',
  ano_construcao: 'Ano de construção', mes_matricula: 'Mês da matrícula', ano_matricula: 'Ano da matrícula',
  registos_anteriores: 'Donos anteriores', quilometros: 'Quilómetros', origem: 'Origem',
  livro_revisoes: 'Livro de revisões completo', garantia_usado: 'Garantia', garantia_fabrica: 'Garantia de fábrica',
  combustivel: 'Combustível', caixa: 'Caixa', potencia_cv: 'Potência (cv)', cilindrada_cc: 'Cilindrada (cm³)',
  segmento: 'Tipo', portas: 'Portas', lugares: 'Lugares', cor: 'Cor', equipamento: 'Equipamento',
  descricao: 'Descrição', ordem: 'Ordem', fotos_origem: 'Fotografias de exemplo', galeria: 'Fotografias',
};

/* As secções do data/definicoes.json, com o nome do ecrã do painel. SÃO TODAS
   OBRIGATÓRIAS: o gerador lê-as sem perguntar (def.local.morada,
   def.horario.linhas.map…) e, faltando uma, rebenta a meio. */
export const SECCOES_DEFINICOES = {
  contactos: 'Contactos', local: 'Morada', horario: 'Horário', redes: 'Redes sociais',
  textos: 'Textos do site', empresa: 'Dados da empresa',
};

/* ------------------------------------------------------------------ */
/* Limites                                                             */
/* ------------------------------------------------------------------ */

/* Os números: [mínimo, máximo]. Inteiros, menos o preço (até 2 casas). O ano
   vai de 1950 ao ano seguinte ao de hoje (opcoes.hoje). */
export const LIMITES = {
  preco: [1, 1000000], quilometros: [0, 2000000], potencia_cv: [1, 2000], cilindrada_cc: [1, 10000],
  lugares: [1, 9], portas: [1, 7], ordem: [0, 9999], registos_anteriores: [0, 30],
  anoMinimo: 1950, desdeMinimo: 1900,
};
export const TAMANHOS = {
  marca: 40, modelo: 60, versao: 80, cor: 40, matricula: 8, referencia: 20, titulo: 160,
  equipamento: 80, equipamentoItens: 40, descricao: 1500, fotos: 40, caminhoFoto: 200,
  telefoneTexto: 20, email: 120, url: 500,
  morada: 120, localidade: 60, concelho: 60, distrito: 40, pais: 40,
  horarioLinhas: 7, dias: 40, horas: 40, horarioTexto: 200,
  reclamo: 80, heroTitulo: 80, heroTexto: 200, assinatura: 60, sobreTitulo: 120, sobreTexto: 900,
  nome: 60, nomeCompleto: 160, actividade: 120, formaJuridica: 80, capitalSocial: 40, conservatoria: 120, matriculaComercial: 40,
};
/* O que o Worker do painel aceita gravar (recusa acima). */
export const TECTOS = { viaturaBytes: 64 * 1024, definicoesBytes: 64 * 1024 };

/* ------------------------------------------------------------------ */
/* Ajudantes que o painel, o Worker e o gerador também usam            */
/* ------------------------------------------------------------------ */

export const terminacaoDe = (texto) => (typeof texto === 'string' && texto.endsWith('\n') ? '\n' : '');
/* Como os ficheiros estão escritos: 2 espaços e a terminação de cada um (todos
   os de hoje COM \n no fim). Abrir e gravar sem mexer deixa o ficheiro igual. */
export function serializar(obj, terminacao = '') { return JSON.stringify(obj, null, 2) + (terminacao || ''); }

/* O endereço da página, a partir do nome do ficheiro (o gerador faz o mesmo). */
export const slugDoFicheiro = (nome) => String(nome).replace(/\.json$/, '');
const RE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const slugValido = (s) => typeof s === 'string' && s.length <= 100 && RE_SLUG.test(s);

/* A ORDEM DAS CHAVES de `depois`: as que já estavam em `antes` ficam onde
   estavam; as novas entram pela ordem de `ordem`, antes da primeira que lhes
   venha depois; as que não estão em `ordem` vão para o fim. Abrir e gravar não
   baralha o ficheiro (uma linha mudada é uma linha no histórico). */
export function ordenarComo(antes, depois, ordem = CAMPOS_VIATURA) {
  if (!eObjecto(depois)) return depois;
  const a = eObjecto(antes) ? antes : {};
  const chaves = Object.keys(a).filter((k) => tem(depois, k));
  const novas = Object.keys(depois).filter((k) => !chaves.includes(k));
  for (const k of novas.filter((x) => ordem.includes(x))) {
    const i = ordem.indexOf(k);
    const j = chaves.findIndex((x) => ordem.includes(x) && ordem.indexOf(x) > i);
    if (j < 0) chaves.push(k); else chaves.splice(j, 0, k);
  }
  chaves.push(...novas.filter((x) => !ordem.includes(x)));
  const out = {};
  for (const k of chaves) out[k] = depois[k];
  return out;
}

/* O título do anúncio sai da marca, do modelo e da versão — nunca se escreve à
   parte (dois títulos diferentes do mesmo carro era o que acontecia). */
export const tituloDe = (v) => [v?.marca, v?.modelo, v?.versao]
  .filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()).join(' ');

/* NIF português: 9 algarismos, o primeiro nunca é 0, e o de controlo (módulo 11). */
export function nifValido(nif) {
  const s = typeof nif === 'number' ? String(nif) : nif;
  if (typeof s !== 'string' || !/^[1-9][0-9]{8}$/.test(s)) return false;
  let soma = 0;
  for (let i = 0; i < 8; i++) soma += Number(s[i]) * (9 - i);
  const resto = soma % 11;
  return (resto < 2 ? 0 : 11 - resto) === Number(s[8]);
}

/* O SLUG DE UMA VIATURA NOVA: gerado UMA vez, ao criar, e nunca mais muda — é o
   endereço da página que o stand partilha no WhatsApp. Minúsculas, sem
   acentos, o resto passa a hífen, com o ano no fim (como as de hoje).
   existentes: os slugs das viaturas E os nomes das pastas da biblioteca: uma
   viatura nova que caísse na pasta de fotografias de outra herdava-lhe as
   fotografias. Repetido: -2, -3… */
export function gerarSlug(marca, modelo, versao, existentes = [], ano = '') {
  const ja = existentes instanceof Set ? existentes : new Set(existentes);
  let base = [marca, modelo, versao, ano].map((x) => (x === null || x === undefined ? '' : String(x))).join(' ')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/š/g, 's').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+/, '').slice(0, 80).replace(/-+$/, '');
  if (!base) base = 'viatura';
  let slug = base;
  for (let n = 2; ja.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}

/* A REFERÊNCIA DE UMA VIATURA NOVA: NA e três algarismos, a seguinte à maior
   que já existe (NA013 → NA014). */
export function proximaReferencia(existentes = []) {
  let max = 0;
  for (const r of existentes) { const m = /^NA(\d{1,6})$/.exec(String(r ?? '').trim()); if (m) max = Math.max(max, Number(m[1])); }
  return `NA${String(max + 1).padStart(3, '0')}`;
}

/* ------------------------------------------------------------------ */
/* Telefones, emails e endereços                                       */
/* ------------------------------------------------------------------ */

/* Telefones portugueses, 9 algarismos: telemóvel (91, 92, 93, 96) e fixo (2…;
   o 20 não existe no plano de numeração). O WhatsApp é sempre um telemóvel, e
   guarda-se com o 351 à frente (é assim que o wa.me o quer). */
const RE_TELEMOVEL = /^9[1236][0-9]{7}$/;
const RE_FIXO = /^2[1-9][0-9]{7}$/;
const RE_WHATSAPP = /^3519[1236][0-9]{7}$/;
const RE_CP = /^[0-9]{4}-[0-9]{3}$/;
export const RE_EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
export const emailValido = (v) => typeof v === 'string' && v.length <= TAMANHOS.email && RE_EMAIL.test(v.trim());
/* A rede de um telefone, para a nota do custo da chamada (DL 59/2021). */
export const redeDoTelefone = (n) => (typeof n !== 'string' ? null : RE_TELEMOVEL.test(n) ? 'movel' : RE_FIXO.test(n) ? 'fixa' : null);
export const NOTAS_DA_CHAMADA = { movel: '(Chamada para a rede móvel nacional)', fixa: '(Chamada para a rede fixa nacional)' };
export const notaDaChamada = (n) => { const r = redeDoTelefone(n); return r ? NOTAS_DA_CHAMADA[r] : null; };
/* «917849998» → «917 849 998»: como o número se lê no site. */
export const telefoneLegivel = (n) => (typeof n === 'string' && /^[0-9]{9}$/.test(n) ? `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}` : '');
/* O que o dono escreve («+351 913 319 419», «913319419») → os 9 algarismos, ou null. */
export function soNove(s) {
  if (typeof s !== 'string' && typeof s !== 'number') return null;
  const d = String(s).replace(/[^0-9]/g, '').replace(/^00351(?=[0-9]{9}$)|^351(?=[0-9]{9}$)/, '');
  return /^[0-9]{9}$/.test(d) ? d : null;
}

/* Um endereço https:// inteiro, sem espaços, aspas nem «<>». O gerador só põe
   num link das redes ou do mapa o que passar aqui. */
export function urlHttps(v) {
  if (typeof v !== 'string' || !/^https:\/\/[^\s"'<>\\]+$/.test(v.trim())) return false;
  try { return new URL(v.trim()).protocol === 'https:'; } catch { return false; }
}

/* Um caminho de fotografia como o painel o escreve: dentro de
   assets/viaturas/<pasta>/ (com ou sem a barra à frente, ou com o prefixo
   antigo /NewAuto/ do Pages CMS). Nada de «..», barras para trás, aspas, nem os
   sinais que partem um endereço (# ? %). */
const EXT = EXTENSOES_FOTO.join('|');
const RE_FOTO_CAMINHO = new RegExp(`^${BIBLIOTECA}/(?:[^/]+/){0,2}[^/]+\\.(?:${EXT})$`, 'i');
export const semPrefixo = (c) => String(c ?? '').trim().replace(/^\/+/, '').replace(/^NewAuto\//, '');
export function caminhoDeFotoValido(c) {
  if (typeof c !== 'string') return false;
  const s = semPrefixo(c);
  if (!s || s.length > TAMANHOS.caminhoFoto) return false;
  if (/[\u0000-\u001F\u007F"<>\\#?%]/.test(s)) return false;
  if (!RE_FOTO_CAMINHO.test(s)) return false;
  if (s.startsWith(`${VARIANTES}/`)) return false;
  return s.split('/').every((p) => p !== '' && p !== '.' && p !== '..' && p.trim() === p);
}

/* UMA FOTOGRAFIA EXISTE quando o ficheiro está na pasta. listarPasta(pasta) →
   os nomes lá dentro (como o readdirSync), ou [] se não existir. */
export function fotografiaExiste(caminho, _slug, listarPasta) {
  const s = semPrefixo(caminho);
  const i = s.lastIndexOf('/');
  if (i < 0) return false;
  const l = listarPasta(s.slice(0, i));
  return Array.isArray(l) && l.includes(s.slice(i + 1));
}

/* As fotografias que o site mostra de uma viatura: a galeria (as carregadas),
   ou, sem ela, as de exemplo (fotos_origem). Igual ao gerador. */
export const usaGaleria = (v) => Array.isArray(v?.galeria) && v.galeria.some((x) => typeof x === 'string' && x.trim());
export const temFotografias = (v) => usaGaleria(v) || (Array.isArray(v?.fotos_origem) && v.fotos_origem.length > 0);

/* ------------------------------------------------------------------ */
/* O horário                                                            */
/* ------------------------------------------------------------------ */

/* O HORÁRIO GUARDA-SE DE TRÊS MANEIRAS no definicoes.json, e o painel escreve
   as três a partir da mesma tabela da semana:
     estruturado  [{ dias: ['Monday', …], abre: '09:00', fecha: '19:00' }]
                  — o que o site usa para dizer «Aberto agora»;
     linhas       [{ dias: 'Segunda a Sexta', horas: '09:00 – 19:00' }]
                  — o que o site mostra;
     texto        uma linha só.
   lerSemana() faz a tabela a partir do estruturado (e das linhas «Por
   marcação»), e horarioDaSemana() faz as três a partir da tabela. */
export const DIAS_DA_SEMANA = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const NOMES_DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const RE_HORA = /^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/;
export const horaValida = (h) => typeof h === 'string' && RE_HORA.test(h);

/* A tabela: 7 dias, cada um { modo: 'aberto' | 'fechado' | 'marcacao', abre, fecha }. */
export function lerSemana(horario) {
  const semana = DIAS_DA_SEMANA.map(() => ({ modo: 'fechado', abre: '', fecha: '' }));
  const est = Array.isArray(horario?.estruturado) ? horario.estruturado : [];
  for (const r of est) {
    if (!eObjecto(r) || !Array.isArray(r.dias)) continue;
    for (const d of r.dias) {
      const i = DIAS_DA_SEMANA.indexOf(d);
      if (i >= 0) semana[i] = { modo: 'aberto', abre: String(r.abre ?? ''), fecha: String(r.fecha ?? '') };
    }
  }
  /* «Por marcação» não cabe no estruturado: lê-se das linhas. */
  for (const l of Array.isArray(horario?.linhas) ? horario.linhas : []) {
    if (!eObjecto(l) || typeof l.horas !== 'string' || !/marca/i.test(l.horas)) continue;
    for (const i of diasDeUmaLinha(l.dias)) if (semana[i].modo === 'fechado') semana[i] = { modo: 'marcacao', abre: '', fecha: '' };
  }
  return semana;
}
/* Os dias de uma linha escrita («Segunda a Sexta», «Sábado», «Domingo»). */
function diasDeUmaLinha(t) {
  if (typeof t !== 'string') return [];
  const s = t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const nomes = NOMES_DIAS.map((n) => n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase());
  const achados = nomes.map((n, i) => [s.indexOf(n), i]).filter(([p]) => p >= 0).sort((a, b) => a[0] - b[0]).map(([, i]) => i);
  if (/ a /.test(s) && achados.length === 2) {
    const [a, b] = achados; const out = [];
    for (let i = a; ; i = (i + 1) % 7) { out.push(i); if (i === b || out.length > 7) break; }
    return out;
  }
  return achados;
}

/* A tabela → { texto, linhas, estruturado }. Dias seguidos com o mesmo horário
   juntam-se numa linha («Segunda a Sexta»). */
export function horarioDaSemana(semana) {
  const igualDia = (a, b) => a.modo === b.modo && (a.modo !== 'aberto' || (a.abre === b.abre && a.fecha === b.fecha));
  const grupos = [];
  semana.forEach((d, i) => {
    const g = grupos.at(-1);
    if (g && igualDia(g.d, d) && g.fim === i - 1) g.fim = i; else grupos.push({ ini: i, fim: i, d });
  });
  const nomeGrupo = (g) => (g.ini === g.fim ? NOMES_DIAS[g.ini] : g.fim === g.ini + 1 ? `${NOMES_DIAS[g.ini]} e ${NOMES_DIAS[g.fim]}` : `${NOMES_DIAS[g.ini]} a ${NOMES_DIAS[g.fim]}`);
  const horasDe = (d) => (d.modo === 'aberto' ? `${d.abre} – ${d.fecha}` : d.modo === 'marcacao' ? 'Por marcação' : 'Fechado');
  const visiveis = grupos.filter((g) => g.d.modo !== 'fechado' || grupos.length <= 3);
  const linhas = visiveis.map((g) => ({ dias: nomeGrupo(g), horas: horasDe(g.d) }));
  const estruturado = grupos.filter((g) => g.d.modo === 'aberto')
    .map((g) => ({ dias: DIAS_DA_SEMANA.slice(g.ini, g.fim + 1), abre: g.d.abre, fecha: g.d.fecha }));
  const texto = linhas.map((l) => `${l.dias} ${l.horas.replace(' – ', '–')}`).join(' · ');
  return { texto, linhas, estruturado };
}

/* ------------------------------------------------------------------ */
/* Pequenos ajustes internos                                          */
/* ------------------------------------------------------------------ */

function eObjecto(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
const tem = (o, k) => eObjecto(o) && Object.prototype.hasOwnProperty.call(o, k);
const ausente = (v) => v === undefined || v === null;
const vazio = (v) => ausente(v) || (typeof v === 'string' && v.trim() === '');
const temTexto = (v) => typeof v === 'string' && v.trim() !== '';
const inteiroEntre = (v, a, b) => typeof v === 'number' && Number.isInteger(v) && v >= a && v <= b;
const duasCasas = (x) => typeof x === 'number' && Number.isFinite(x) && Math.abs(x * 100 - Math.round(x * 100)) < 1e-6;
const milhares = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
/* Caracteres de controlo, por escape e nunca literais no código. */
const RE_CONTROLO_LINHA = /[\u0000-\u001F\u007F]/;
const RE_CONTROLO_TEXTO = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
/* «</script» e «<!--»: dentro do JSON-LD, um fecha o elemento a meio. O
   gerador escapa o «<» lá dentro; mas não há texto honesto que os precise, e
   ficam fora — uma segunda rede, para um commit à mão. */
const RE_PARTE_A_PAGINA = /<\/script|<!--/i;
const RE_MATRICULA = /^[A-Z0-9]{2}-[A-Z0-9]{2}-[A-Z0-9]{2}$/;
const RE_DATA = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

function mesmoValor(a, b) {
  if (ausente(a) && ausente(b)) return true;
  if (Array.isArray(a) || Array.isArray(b)) return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x, i) => mesmoValor(x, b[i]));
  if (eObjecto(a) || eObjecto(b)) {
    if (!eObjecto(a) || !eObjecto(b)) return false;
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if (!mesmoValor(a[k], b[k])) return false;
    return true;
  }
  return a === b;
}

function textosDe(v, caminho = '') {
  if (typeof v === 'string') return [[caminho, v]];
  const filhos = Array.isArray(v) ? Array.from(v, (x, i) => [i, x]) : eObjecto(v) ? Object.entries(v) : [];
  return filhos.flatMap(([k, x]) => textosDe(x, caminho ? `${caminho}.${k}` : String(k)));
}

function lerJson(valor) {
  if (ausente(valor)) return { ausente: true };
  if (typeof valor !== 'string') return { obj: valor, texto: null };
  try { return { obj: JSON.parse(valor), texto: valor }; } catch (e) { return { ilegivel: String((e && e.message) || e).slice(0, 120), texto: valor }; }
}

const dataValida = (s) => {
  if (typeof s !== 'string' || !RE_DATA.test(s)) return false;
  const d = new Date(`${s}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};

/* ------------------------------------------------------------------ */
/* Uma viatura                                                          */
/* ------------------------------------------------------------------ */

/** Os problemas de UMA viatura (já lida). `nome`: o do ficheiro (o endereço);
 *  `existe(caminho, slug)`: se uma fotografia existe; `hoje`: 'AAAA-MM-DD'. */
export function problemasDaViatura(v, { nome, existe = null, hoje = null } = {}) {
  const slug = slugDoFicheiro(nome);
  const ficheiro = ficheiroDaViatura(nome);
  const nomeLegivel = eObjecto(v) ? (tituloDe({ marca: v.marca, modelo: v.modelo }) || slug) : slug;
  const ecra = `Viaturas › ${nomeLegivel}`;
  const out = [];
  const base = { ficheiro, ecra, slug };
  const neutraliza = (regra, efeito, campo, mensagem, extra = {}) => out.push({ classe: 'neutraliza', chave: `viatura:${slug}:${regra}`, efeito, campo, mensagem, ...base, ...extra });
  const avisa = (regra, campo, mensagem, extra = {}) => out.push({ classe: 'avisa', chave: `viatura:${slug}:${regra}`, campo, mensagem, ...base, ...extra });
  const lembra = (regra, campo, mensagem) => avisa(regra, campo, mensagem, { lembrete: true });
  if (!eObjecto(v)) return out;

  const anoSeguinte = Number(String(hoje || new Date().toISOString()).slice(0, 4)) + 1;
  const escondida = v.oculta === true;
  const vendida = v.estado === 'vendida';
  /* Numa escondida, o que falta para ir para o site é só um lembrete. */
  const falta = (regra, campo, mensagem) => (escondida ? lembra(regra, campo, mensagem) : neutraliza(regra, 'esconder', campo, mensagem));

  // --- o que o site precisa ----------------------------------------------
  for (const [campo, artigo] of [['marca', 'a'], ['modelo', 'o']]) {
    const x = v[campo];
    if (vazio(x)) falta(`sem-${campo}`, campo, `Falta ${artigo} ${NOMES_CAMPOS[campo].toLowerCase()}: a viatura fica escondida do site até ${artigo === 'a' ? 'estar preenchida' : 'estar preenchido'}.`);
    else if (typeof x !== 'string') neutraliza(`${campo}:texto`, 'esconder', campo, `${artigo === 'a' ? 'A' : 'O'} ${NOMES_CAMPOS[campo].toLowerCase()} tem de ser texto.`);
  }
  if (!temFotografias(v)) falta('sem-fotos', 'galeria', 'A viatura não tem fotografias: fica escondida do site até ter pelo menos uma.');

  /* Os números que o cartão mostra: um valor que não é número escrevia «NaN». */
  const numeroDoSite = (campo, [min, max], mensagem) => {
    const x = v[campo];
    if (vazio(x)) return true;
    if (!(typeof x === 'number' && Number.isInteger(x) && x >= min && x <= max)) { neutraliza(`${campo}:numero`, 'esconder', campo, mensagem); return false; }
    return true;
  };
  if (vazio(v.quilometros)) falta('sem-quilometros', 'quilometros', 'Faltam os quilómetros: aparecem no cartão e na ficha da viatura.');
  numeroDoSite('quilometros', LIMITES.quilometros, 'Os quilómetros são só o número, sem pontos (ex.: 94000).');
  for (const campo of ['combustivel', 'caixa']) {
    if (vazio(v[campo])) falta(`sem-${campo}`, campo, `Falta ${campo === 'caixa' ? 'a caixa' : 'o combustível'}: aparece no cartão da viatura.`);
  }

  // --- os sete campos da lei dos usados -----------------------------------
  /* DL 74/93, art. 2.º n.º 1: matrícula, preço, ano de construção, data da
     matrícula, donos anteriores, garantia de fábrica e garantia de usado. Uma
     viatura no site sem um deles é um anúncio fora da lei: fica escondida. */
  const LEI = 'a lei dos usados (DL 74/93) obriga a mostrá-l';
  if (vazio(v.matricula)) falta('sem-matricula', 'matricula', `Falta a matrícula: ${LEI}a no anúncio. Até lá a viatura fica escondida do site.`);
  else if (typeof v.matricula !== 'string' || !RE_MATRICULA.test(v.matricula.trim())) avisa('matricula:formato', 'matricula', 'A matrícula escreve-se como no livrete, com hífens: AA-00-AA (ou 00-AA-00).');
  if (vazio(v.preco)) falta('sem-preco', 'preco', 'Falta o preço: a lei pede o preço final, com impostos, em tudo o que está à venda. Até lá a viatura fica escondida do site.');
  else if (!(typeof v.preco === 'number' && v.preco >= LIMITES.preco[0] && v.preco <= LIMITES.preco[1] && duasCasas(v.preco))) {
    neutraliza('preco:numero', 'esconder', 'preco', `O preço é só o número, sem € nem pontos (ex.: 14900), até ${milhares(LIMITES.preco[1])} €.`);
  }
  const anoOk = (campo) => {
    const x = v[campo];
    if (vazio(x)) return false;
    if (!inteiroEntre(x, LIMITES.anoMinimo, anoSeguinte)) { neutraliza(`${campo}:numero`, 'esconder', campo, `O ${NOMES_CAMPOS[campo].toLowerCase()} tem 4 algarismos, de ${LIMITES.anoMinimo} a ${anoSeguinte}.`); return false; }
    return true;
  };
  if (vazio(v.ano_construcao)) falta('sem-ano-construcao', 'ano_construcao', `Falta o ano de construção (vem no livrete): ${LEI}o.`);
  if (vazio(v.ano_matricula)) falta('sem-ano-matricula', 'ano_matricula', `Falta o ano da matrícula: ${LEI}o.`);
  if (vazio(v.mes_matricula)) falta('sem-mes-matricula', 'mes_matricula', `Falta o mês da matrícula: ${LEI}o.`);
  else if (!MESES.includes(String(v.mes_matricula))) avisa('mes_matricula:lista', 'mes_matricula', 'O mês da matrícula tem de ser um dos doze.');
  const aConstrucao = anoOk('ano_construcao');
  const aMatricula = anoOk('ano_matricula');
  if (aConstrucao && aMatricula && v.ano_construcao > v.ano_matricula) {
    avisa('ano-construcao-depois', 'ano_construcao', `O ano de construção (${v.ano_construcao}) não pode ser depois do da matrícula (${v.ano_matricula}).`);
  }
  if (vazio(v.registos_anteriores)) falta('sem-donos', 'registos_anteriores', `Faltam os donos anteriores (0 se não teve nenhum): ${LEI}os.`);
  else if (!inteiroEntre(v.registos_anteriores, ...LIMITES.registos_anteriores)) neutraliza('registos_anteriores:numero', 'esconder', 'registos_anteriores', `Os donos anteriores são um número inteiro, de 0 a ${LIMITES.registos_anteriores[1]}.`);
  if (vazio(v.garantia_usado)) falta('sem-garantia', 'garantia_usado', `Falta a garantia: ${LEI}a.`);
  else if (!GARANTIAS_USADO.includes(v.garantia_usado)) neutraliza('garantia_usado:lista', 'esconder', 'garantia_usado', 'A garantia tem de ser uma das duas da lista: o que o site diz vincula o stand, e a «garantia de 12 meses» foi revogada em 2022.');
  if (vazio(v.garantia_fabrica)) falta('sem-garantia-fabrica', 'garantia_fabrica', `Falta dizer se tem garantia de fábrica: ${LEI}o.`);
  else if (!GARANTIAS_FABRICA.includes(v.garantia_fabrica)) avisa('garantia_fabrica:lista', 'garantia_fabrica', 'A garantia de fábrica é «Não aplicável» ou «Sim, ainda em vigor».');

  // --- estado ----------------------------------------------------------------
  if (!vazio(v.estado) && !ESTADOS.includes(v.estado)) avisa('estado:lista', 'estado', 'O estado tem de ser À venda, Reservada ou Vendida.');
  /* Uma vendida mostra «Vendida em julho de 2026»: sem a data, a página dizia
     «Invalid Date». O painel escreve-a ao vender. */
  if (vendida && !dataValida(v.data_venda)) {
    neutraliza('vendida-sem-data', 'esconder', 'data_venda', 'Uma viatura vendida precisa da data da venda: fica escondida do site até ter uma.');
  }
  if (!vazio(v.data_venda) && !dataValida(v.data_venda)) avisa('data_venda:formato', 'data_venda', 'A data da venda escreve-se AAAA-MM-DD.');

  // --- o que partia a página ------------------------------------------------
  const partem = textosDe(v).filter(([, t]) => RE_PARTE_A_PAGINA.test(t)).map(([c]) => c.split('.')[0]);
  if (partem.length) {
    const campos = [...new Set(partem)];
    neutraliza('partia-a-pagina', 'esconder', campos[0], `${campos.map((c) => `«${NOMES_CAMPOS[c] || c}»`).join(', ')}: tem «</script» ou «<!--», que não podem ir para o site.`, { campos });
  }

  // --- fotografias -----------------------------------------------------------
  const g = v.galeria;
  if (!ausente(g) && !Array.isArray(g)) avisa('galeria:lista', 'galeria', 'As fotografias não estão gravadas como uma lista. Escolha-as outra vez.');
  const vistos = new Set();
  (Array.isArray(g) ? g : []).forEach((c, indice) => {
    if (typeof c === 'string' && c.trim() === '') return;
    const nomeFoto = typeof c === 'string' ? c.split('/').pop() : String(c);
    const extra = { foto: c, indice };
    if (!caminhoDeFotoValido(c)) {
      if (!vistos.has(`x:${String(c)}`)) { vistos.add(`x:${String(c)}`); neutraliza(`foto-invalida:${String(c)}`, 'sem_fotografia', 'galeria', `A fotografia «${nomeFoto.slice(0, 60)}» não é um ficheiro da biblioteca: não aparece no site.`, extra); }
      return;
    }
    const chaveFoto = semPrefixo(c);
    if (vistos.has(chaveFoto)) { avisa(`foto-repetida:${chaveFoto}`, 'galeria', `A fotografia «${nomeFoto}» está duas vezes no anúncio.`, extra); return; }
    vistos.add(chaveFoto);
    if (existe && !existe(c, slug)) neutraliza(`foto-em-falta:${chaveFoto}`, 'sem_fotografia', 'galeria', `A fotografia «${nomeFoto}» já não está no site: não aparece. Tire-a do anúncio, ou carregue-a outra vez.`, extra);
  });
  if (Array.isArray(g) && g.length > TAMANHOS.fotos) avisa('galeria:a-mais', 'galeria', `O anúncio tem ${g.length} fotografias; o máximo é ${TAMANHOS.fotos}.`);

  // --- valores fora da lista (erro de campo no painel) -------------------------
  const deLista = (campo, valores, mensagem) => {
    const x = v[campo];
    if (vazio(x)) return;
    if (!valores.includes(typeof x === 'string' ? x.trim() : x)) avisa(`${campo}:lista`, campo, mensagem);
  };
  deLista('combustivel', COMBUSTIVEIS, `O combustível tem de ser um destes: ${COMBUSTIVEIS.join(', ')}.`);
  deLista('caixa', CAIXAS, 'A caixa tem de ser Manual ou Automática.');
  deLista('segmento', SEGMENTOS, `O tipo tem de ser um destes: ${SEGMENTOS.join(', ')}.`);
  deLista('origem', ORIGENS, 'A origem tem de ser Nacional ou Importado.');
  for (const b of BOOLEANOS_VIATURA) if (!ausente(v[b]) && typeof v[b] !== 'boolean') avisa(`${b}:sim-nao`, b, `«${NOMES_CAMPOS[b]}» tem de ser sim ou não.`);

  // --- números (erro de campo no painel) --------------------------------------
  const numero = (campo, [min, max], mensagem) => {
    const x = v[campo];
    if (ausente(x) || x === '') return;
    if (!(typeof x === 'number' && Number.isInteger(x) && x >= min && x <= max)) avisa(`${campo}:numero`, campo, mensagem);
  };
  numero('potencia_cv', LIMITES.potencia_cv, `A potência é um número inteiro de cavalos, de 1 a ${LIMITES.potencia_cv[1]}.`);
  numero('cilindrada_cc', LIMITES.cilindrada_cc, `A cilindrada é um número inteiro de cm³ (vazia nos eléctricos).`);
  numero('lugares', LIMITES.lugares, `Os lugares são um número de 1 a ${LIMITES.lugares[1]}.`);
  numero('portas', LIMITES.portas, `As portas são um número de 1 a ${LIMITES.portas[1]}.`);
  numero('ordem', LIMITES.ordem, `A ordem é um número inteiro de 0 a ${LIMITES.ordem[1]}.`);

  // --- textos -----------------------------------------------------------------
  const texto = (campo, max, { linha = true } = {}) => {
    const x = v[campo];
    if (ausente(x)) return;
    if (typeof x !== 'string') { avisa(`${campo}:texto`, campo, `«${NOMES_CAMPOS[campo]}» tem de ser texto.`); return; }
    if (x.length > max) avisa(`${campo}:tamanho`, campo, `«${NOMES_CAMPOS[campo]}» tem mais de ${max} caracteres (tem ${x.length}).`);
    if ((linha ? RE_CONTROLO_LINHA : RE_CONTROLO_TEXTO).test(x)) avisa(`${campo}:controlo`, campo, `«${NOMES_CAMPOS[campo]}» tem caracteres invisíveis. Escreva-o outra vez.`);
  };
  texto('marca', TAMANHOS.marca);
  texto('modelo', TAMANHOS.modelo);
  texto('versao', TAMANHOS.versao);
  texto('cor', TAMANHOS.cor);
  texto('referencia', TAMANHOS.referencia);
  texto('descricao', TAMANHOS.descricao, { linha: false });
  const eq = v.equipamento;
  if (!ausente(eq)) {
    if (!Array.isArray(eq)) avisa('equipamento', 'equipamento', 'O equipamento tem de ser uma lista, um por linha.');
    else {
      if (eq.length > TAMANHOS.equipamentoItens) avisa('equipamento:quantos', 'equipamento', `O equipamento tem ${eq.length} itens; o máximo é ${TAMANHOS.equipamentoItens}.`);
      if (eq.some((x) => typeof x !== 'string')) avisa('equipamento:texto', 'equipamento', 'Cada item do equipamento tem de ser texto.');
      if (eq.some((x) => typeof x === 'string' && x.length > TAMANHOS.equipamento)) avisa('equipamento:tamanho', 'equipamento', `Há um item do equipamento com mais de ${TAMANHOS.equipamento} caracteres: escreva-o curto (ex.: Câmara de marcha-atrás).`);
      if (eq.some((x) => typeof x === 'string' && RE_CONTROLO_LINHA.test(x))) avisa('equipamento:controlo', 'equipamento', 'Há um item do equipamento com caracteres invisíveis. Escreva-o outra vez.');
    }
  }

  // --- lembretes ---------------------------------------------------------------
  if (v.demonstracao === true && !escondida) lembra('demonstracao', 'demonstracao', 'Esta viatura tem dados de exemplo (preço, quilómetros, matrícula). Confira-os e desligue «Dados de exemplo».');
  if (!escondida && !vendida && usaGaleria(v) && Array.isArray(g) && g.length < 4) lembra('poucas-fotos', 'galeria', `O anúncio tem ${g.length} fotografia${g.length === 1 ? '' : 's'}. Com 10 a 20 (exterior, interior, bagageira) vende-se melhor.`);
  return out;
}

/* ------------------------------------------------------------------ */
/* data/definicoes.json                                                */
/* ------------------------------------------------------------------ */

export function problemasDasDefinicoes(d, { hoje = null } = {}) {
  const ficheiro = FICHEIROS.definicoes;
  const out = [];
  const ecraDe = (seccao) => `Dados do stand › ${SECCOES_DEFINICOES[seccao]}`;
  const bloqueia = (chave, seccao, campo, mensagem) => out.push({ classe: 'bloqueia', chave: `definicoes:${chave}`, ficheiro, ecra: seccao ? ecraDe(seccao) : 'Dados do stand', campo, mensagem });
  const avisa = (chave, seccao, campo, mensagem, extra = {}) => out.push({ classe: 'avisa', chave: `definicoes:${chave}`, ficheiro, ecra: seccao ? ecraDe(seccao) : 'Dados do stand', campo, mensagem, ...extra });
  const lembra = (chave, seccao, campo, mensagem) => avisa(chave, seccao, campo, mensagem, { lembrete: true });
  if (!eObjecto(d)) { bloqueia('forma', null, undefined, 'Os dados do stand não têm a forma certa. Só o Renato os pode corrigir.'); return out; }

  for (const s of Object.keys(SECCOES_DEFINICOES)) {
    if (!eObjecto(d[s])) bloqueia(`${s}:forma`, s, s, `A secção «${SECCOES_DEFINICOES[s]}» não está gravada, e sem ela o site não se consegue gerar.`);
  }
  const partidos = textosDe(d).filter(([, t]) => RE_PARTE_A_PAGINA.test(t));
  if (partidos.length) {
    const seccao = partidos[0][0].split('.')[0];
    bloqueia('partia-a-pagina', tem(SECCOES_DEFINICOES, seccao) ? seccao : null, partidos[0][0], 'Um texto tem «</script» ou «<!--», que não podem ir para o site. Apague-o e escreva-o outra vez.');
  }

  const textoSimples = (valor, chave, seccao, campo, rotulo, max, { classeVazio = null, porque = '', linha = true } = {}) => {
    if (vazio(valor)) {
      if (classeVazio === 'bloqueia') bloqueia(chave, seccao, campo, `Preencha «${rotulo}»: ${porque || 'sem isso o site não é publicado.'}`);
      else if (classeVazio === 'lembra') lembra(chave, seccao, campo, `Preencha «${rotulo}»: ${porque}`);
      else if (classeVazio) avisa(chave, seccao, campo, `Preencha «${rotulo}»: ${porque || 'sem isso fica um espaço em branco no site.'}`);
      return false;
    }
    if (typeof valor !== 'string') { (classeVazio === 'bloqueia' ? bloqueia : avisa)(chave, seccao, campo, `«${rotulo}» tem de ser texto.`); return false; }
    if (valor.length > max) avisa(`${chave}:tamanho`, seccao, campo, `«${rotulo}» tem mais de ${max} caracteres (tem ${valor.length}).`);
    if ((linha ? RE_CONTROLO_LINHA : RE_CONTROLO_TEXTO).test(valor)) avisa(`${chave}:controlo`, seccao, campo, `«${rotulo}» tem caracteres invisíveis. Escreva-o outra vez.`);
    return true;
  };

  // --- contactos ---------------------------------------------------------------
  /* O gerador escreve o telefone e o WhatsApp nos endereços (tel:+351…,
     wa.me/…) e o «como aparece» no texto, em todas as páginas, com a nota do
     custo da chamada ao lado. O painel escreve o «como aparece» a partir do
     número; aqui confere-se que batem certo (um commit à mão). */
  const c = d.contactos;
  if (eObjecto(c)) {
    if (vazio(c.telefone)) bloqueia('contactos.telefone', 'contactos', 'contactos.telefone', 'Preencha o telefone: é o número dos botões «Ligar» de todas as páginas.');
    else if (!redeDoTelefone(c.telefone)) bloqueia('contactos.telefone', 'contactos', 'contactos.telefone', 'O telefone tem de ser um número português de 9 algarismos: um telemóvel (91, 92, 93 ou 96) ou um fixo (2…).');
    else if (soNove(c.telefone_texto) !== c.telefone) bloqueia('contactos.telefone_texto', 'contactos', 'contactos.telefone', 'O telefone que se lê no site não é o mesmo para onde se liga. Escreva o telefone outra vez.');
    const whats = (sufixo, obrigatorio) => {
      const n = c[`whatsapp${sufixo}`]; const t = c[`whatsapp${sufixo}_texto`];
      const campo = `contactos.whatsapp${sufixo}`;
      const rot = sufixo ? 'o segundo WhatsApp' : 'o WhatsApp';
      if (vazio(n)) { if (obrigatorio) bloqueia(campo, 'contactos', campo, `Preencha ${rot}: é para onde vão os botões «WhatsApp» de todas as páginas.`); else if (!vazio(t)) avisa(`${campo}_texto`, 'contactos', campo, `Apague ${rot} por inteiro, ou escreva o número.`); return; }
      if (!(typeof n === 'string' && RE_WHATSAPP.test(n))) bloqueia(campo, 'contactos', campo, `${rot === 'o WhatsApp' ? 'O WhatsApp' : 'O segundo WhatsApp'} tem de ser um telemóvel português (91, 92, 93 ou 96).`);
      else if (soNove(t) !== n.slice(3)) bloqueia(`${campo}_texto`, 'contactos', campo, `O número de ${rot} que se lê no site não é o mesmo do link. Escreva-o outra vez.`);
    };
    whats('', true);
    whats('_2', false);
    if (vazio(c.email)) lembra('contactos.email:vazio', 'contactos', 'contactos.email', 'Falta o email do stand: a lei obriga a mostrá-lo no site (DL 7/2004, art. 10.º) antes de o pôr num domínio próprio.');
    else if (!emailValido(c.email)) avisa('contactos.email', 'contactos', 'contactos.email', 'O email não está bem escrito (ex.: geral@newauto.pt, sem acentos nem espaços).');
  }

  // --- morada ----------------------------------------------------------------
  const l = d.local;
  if (eObjecto(l)) {
    textoSimples(l.morada, 'local.morada', 'local', 'local.morada', 'Rua e número', TAMANHOS.morada, { classeVazio: 'bloqueia', porque: 'é obrigatória por lei, e aparece em todas as páginas.' });
    if (vazio(l.codigo_postal)) bloqueia('local.codigo_postal', 'local', 'local.codigo_postal', 'Preencha o código postal: é obrigatório por lei.');
    else if (!(typeof l.codigo_postal === 'string' && RE_CP.test(l.codigo_postal.trim()))) bloqueia('local.codigo_postal', 'local', 'local.codigo_postal', 'O código postal escreve-se 0000-000.');
    textoSimples(l.localidade, 'local.localidade', 'local', 'local.localidade', 'Localidade', TAMANHOS.localidade, { classeVazio: 'bloqueia', porque: 'é obrigatória por lei, e aparece em todas as páginas.' });
    textoSimples(l.concelho, 'local.concelho', 'local', 'local.concelho', 'Concelho', TAMANHOS.concelho, { classeVazio: 'avisa', porque: 'aparece na capa e nos contactos.' });
    textoSimples(l.distrito, 'local.distrito', 'local', 'local.distrito', 'Distrito', TAMANHOS.distrito);
    if (!vazio(l.mapa) && !(urlHttps(l.mapa) && l.mapa.length <= TAMANHOS.url)) avisa('local.mapa', 'local', 'local.mapa', 'O link do Google Maps tem de começar por https:// (copie-o do botão «Partilhar» do Google Maps).');
    for (const [k, [a, b]] of [['latitude', [-90, 90]], ['longitude', [-180, 180]]]) {
      if (!ausente(l[k]) && !(typeof l[k] === 'number' && l[k] >= a && l[k] <= b)) avisa(`local.${k}`, 'local', `local.${k}`, `A ${k} é um número (ex.: ${k === 'latitude' ? '40.97390' : '-8.56280'}).`);
    }
  }

  // --- horário ---------------------------------------------------------------
  const h = d.horario;
  if (eObjecto(h)) {
    if (!Array.isArray(h.linhas) || !h.linhas.length) bloqueia('horario.linhas', 'horario', 'horario', 'O horário não está gravado. Marque pelo menos um dia e grave outra vez.');
    else if (h.linhas.some((x) => !eObjecto(x) || typeof x.dias !== 'string' || typeof x.horas !== 'string')) bloqueia('horario.linhas:forma', 'horario', 'horario', 'O horário não tem a forma certa. Grave-o outra vez no painel.');
    if (!ausente(h.estruturado)) {
      const ok = Array.isArray(h.estruturado) && h.estruturado.every((r) => eObjecto(r) && Array.isArray(r.dias) && r.dias.every((x) => DIAS_DA_SEMANA.includes(x)) && horaValida(r.abre) && horaValida(r.fecha) && r.abre < r.fecha);
      if (!ok) avisa('horario.estruturado', 'horario', 'horario', 'Há um dia com as horas mal escritas (ou a hora de fechar antes da de abrir).');
    }
  }

  // --- redes -----------------------------------------------------------------
  const r = d.redes;
  if (eObjecto(r)) {
    for (const k of ['instagram', 'facebook']) {
      if (!vazio(r[k]) && !(urlHttps(r[k]) && r[k].length <= TAMANHOS.url)) avisa(`redes.${k}`, 'redes', `redes.${k}`, `O link do ${k === 'instagram' ? 'Instagram' : 'Facebook'} tem de começar por https://.`);
    }
  }

  // --- textos do site ------------------------------------------------------------
  const t = d.textos;
  if (eObjecto(t)) {
    textoSimples(t.hero_titulo, 'textos.hero_titulo', 'textos', 'textos.hero_titulo', 'Título da página inicial', TAMANHOS.heroTitulo, { classeVazio: 'avisa', porque: 'é o título grande da página inicial.' });
    textoSimples(t.hero_texto, 'textos.hero_texto', 'textos', 'textos.hero_texto', 'Texto da página inicial', TAMANHOS.heroTexto);
    textoSimples(t.reclamo, 'textos.reclamo', 'textos', 'textos.reclamo', 'Linha por cima do título', TAMANHOS.reclamo);
    textoSimples(t.assinatura, 'textos.assinatura', 'textos', 'textos.assinatura', 'Assinatura', TAMANHOS.assinatura);
    textoSimples(t.sobre_titulo, 'textos.sobre_titulo', 'textos', 'textos.sobre_titulo', 'Título do «Sobre nós»', TAMANHOS.sobreTitulo, { classeVazio: 'avisa', porque: 'é o título da página «Sobre nós».' });
    textoSimples(t.sobre_texto, 'textos.sobre_texto', 'textos', 'textos.sobre_texto', 'Texto do «Sobre nós»', TAMANHOS.sobreTexto, { linha: false });
  }

  // --- empresa (DL 7/2004, art. 10.º; CSC, art. 171.º) ----------------------------
  const e = d.empresa;
  if (eObjecto(e)) {
    textoSimples(e.nome, 'empresa.nome', 'empresa', 'empresa.nome', 'Nome comercial', TAMANHOS.nome, { classeVazio: 'bloqueia', porque: 'é o nome do stand em todas as páginas.' });
    textoSimples(e.nome_completo, 'empresa.nome_completo', 'empresa', 'empresa.nome_completo', 'Firma (denominação completa)', TAMANHOS.nomeCompleto, { classeVazio: 'bloqueia', porque: 'é obrigatória por lei.' });
    if (vazio(e.nif) || /PLACEHOLDER/i.test(String(e.nif))) lembra('empresa.nif:vazio', 'empresa', 'empresa.nif', 'Falta o NIF da empresa: a lei obriga a mostrá-lo no site (DL 7/2004, art. 10.º) antes de o pôr num domínio próprio.');
    else if (!nifValido(String(e.nif).trim())) avisa('empresa.nif', 'empresa', 'empresa.nif', 'O NIF tem 9 algarismos e o último confere com os outros: este não confere. Copie-o da certidão.');
    if (!ausente(e.desde) && !inteiroEntre(e.desde, LIMITES.desdeMinimo, Number(String(hoje || new Date().toISOString()).slice(0, 4)))) avisa('empresa.desde', 'empresa', 'empresa.desde', 'O ano de início é um ano com 4 algarismos (ex.: 2018).');
    for (const [k, max, rot] of [['actividade', TAMANHOS.actividade, 'Actividade'], ['forma_juridica', TAMANHOS.formaJuridica, 'Forma jurídica'], ['capital_social', TAMANHOS.capitalSocial, 'Capital social'], ['conservatoria', TAMANHOS.conservatoria, 'Conservatória'], ['matricula', TAMANHOS.matriculaComercial, 'Matrícula comercial']]) {
      textoSimples(e[k], `empresa.${k}`, 'empresa', `empresa.${k}`, rot, max);
    }
    /* CSC art. 171.º: uma sociedade por quotas ou anónima tem de mostrar o
       capital social no site. Um empresário em nome individual não tem. */
    if (temTexto(e.forma_juridica) && /quotas|an[oó]nima|unipessoal/i.test(e.forma_juridica) && vazio(e.capital_social)) {
      lembra('empresa.capital_social:sociedade', 'empresa', 'empresa.capital_social', 'Uma sociedade tem de mostrar o capital social no site (Código das Sociedades Comerciais, art. 171.º). Preencha-o.');
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Tudo                                                                */
/* ------------------------------------------------------------------ */

/** Os problemas de todos os ficheiros de `dados` (ver o topo). */
export function problemas(dados, { listarPasta = null, hoje = null } = {}) {
  const out = [];
  if (tem(dados, 'definicoes')) {
    const ficheiro = FICHEIROS.definicoes;
    const r = lerJson(dados.definicoes);
    if (r.ausente) out.push({ classe: 'bloqueia', chave: 'definicoes:ficheiro', ficheiro, ecra: 'Dados do stand', mensagem: 'Faltam os dados do stand (o ficheiro não existe). Só o Renato o pode repor.' });
    else if (r.ilegivel) out.push({ classe: 'bloqueia', chave: 'definicoes:ilegivel', ficheiro, ecra: 'Dados do stand', mensagem: `Os dados do stand não se conseguem ler (${r.ilegivel}). Só o Renato os pode corrigir.` });
    else out.push(...problemasDasDefinicoes(r.obj, { hoje }));
  }
  const existe = listarPasta ? (c, s) => fotografiaExiste(c, s, listarPasta) : null;
  for (const [nome, valor] of Object.entries(dados.viaturas ?? {})) {
    if (valor === null || valor === undefined) continue;
    const slug = slugDoFicheiro(nome);
    const ficheiro = ficheiroDaViatura(nome);
    const r = lerJson(valor);
    if (r.ilegivel || !eObjecto(r.obj)) {
      out.push({ classe: 'neutraliza', chave: `viatura:${slug}:ilegivel`, efeito: 'esconder', ficheiro, slug, ecra: `Viaturas › ${slug}`, mensagem: 'Este ficheiro não se consegue ler: a viatura fica escondida do site. Só o Renato o pode corrigir.' });
      continue;
    }
    if (!slugValido(slug)) {
      out.push({ classe: 'neutraliza', chave: `viatura:${slug}:nome`, efeito: 'esconder', ficheiro, slug, ecra: `Viaturas › ${slug}`, mensagem: 'O nome do ficheiro não serve de endereço (só minúsculas, algarismos e hífens): a viatura fica escondida do site.' });
      continue;
    }
    out.push(...problemasDaViatura(r.obj, { nome, existe, hoje }));
  }
  return out;
}

/**
 * A CÓPIA QUE O GERADOR LÊ. Devolve { viaturas: { <nome>: objecto | null }, neutralizados }:
 * cada viatura com um «neutraliza» de efeito 'esconder' sai com oculta: true
 * (a ilegível sai como null — o ficheiro apaga-se na cópia); com
 * 'sem_fotografia', a fotografia sai da galeria. O resto fica igual.
 */
export function neutralizar(dados, probs) {
  const viaturas = {};
  const neutralizados = [];
  for (const [nome, valor] of Object.entries(dados.viaturas ?? {})) {
    if (valor === null || valor === undefined) continue;
    const slug = slugDoFicheiro(nome);
    const meus = probs.filter((p) => p.classe === 'neutraliza' && p.slug === slug && p.ficheiro === ficheiroDaViatura(nome));
    if (!meus.length) continue;
    const r = lerJson(valor);
    if (r.ilegivel || !eObjecto(r.obj) || !slugValido(slug)) { viaturas[nome] = null; neutralizados.push({ nome, slug, efeito: 'apagar', motivos: meus.map((p) => p.mensagem) }); continue; }
    const v = structuredClone(r.obj);
    const esconder = meus.filter((p) => p.efeito === 'esconder');
    const semFoto = new Set(meus.filter((p) => p.efeito === 'sem_fotografia').map((p) => p.foto));
    if (semFoto.size && Array.isArray(v.galeria)) v.galeria = v.galeria.filter((f) => !semFoto.has(f));
    if (esconder.length) v.oculta = true;
    viaturas[nome] = v;
    neutralizados.push({ nome, slug, efeito: esconder.length ? 'esconder' : 'sem_fotografia', titulo: tituloDe(r.obj) || slug, motivos: meus.map((p) => p.mensagem) });
  }
  return { viaturas, neutralizados };
}

/**
 * O QUE O PAINEL NÃO EDITA NÃO MUDA (o Worker recusa a gravação: 422
 * campo_bloqueado). Devolve [{ caminho }].
 *   viatura:    o slug e a referência não mudam depois de existirem; as
 *               fotografias de exemplo só podem sair (nunca entrar); uma chave
 *               que não é das viaturas não muda.
 *   definicoes: uma secção que não é das do stand não muda.
 */
export function mudancasBloqueadas(antes, depois, tipo) {
  const out = [];
  const a = eObjecto(antes) ? antes : {};
  const d = eObjecto(depois) ? depois : {};
  if (tipo === 'viatura') {
    for (const k of ['slug', 'referencia']) if (!ausente(a[k]) && !mesmoValor(a[k], d[k])) out.push({ caminho: k });
    if (!ausente(d.fotos_origem)) {
      const antesF = Array.isArray(a.fotos_origem) ? a.fotos_origem : [];
      const depoisF = Array.isArray(d.fotos_origem) ? d.fotos_origem : null;
      if (!depoisF || depoisF.some((f) => !antesF.includes(f))) out.push({ caminho: 'fotos_origem' });
    }
    for (const k of new Set([...Object.keys(a), ...Object.keys(d)])) {
      if (!CAMPOS_VIATURA.includes(k) && !mesmoValor(a[k], d[k])) out.push({ caminho: k });
    }
  } else if (tipo === 'definicoes') {
    for (const k of new Set([...Object.keys(a), ...Object.keys(d)])) {
      if (!tem(SECCOES_DEFINICOES, k) && !mesmoValor(a[k], d[k])) out.push({ caminho: k });
    }
  }
  return out;
}

/** Uma frase por neutralizado, para o resumo da corrida e a issue. */
export function descreverEfeitos(neutralizados) {
  return neutralizados.map((n) => ({
    ...n,
    descricao: n.efeito === 'esconder' ? 'escondida do site' : n.efeito === 'apagar' ? 'fora do site (ficheiro ilegível)' : 'fotografias em falta tiradas da galeria',
  }));
}
