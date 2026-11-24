import {
  Utensils, ShoppingCart, Car, Home, Receipt, Tv, HeartPulse, GraduationCap,
  Gamepad2, Plane, ShoppingBag, PawPrint, Landmark, Sparkles, CircleDashed,
  Briefcase, Laptop, Tag, TrendingUp, Undo2, Gift, type LucideIcon,
} from 'lucide-react'

export type CategoryKind = 'expense' | 'extra'

export interface CategoryDef {
  id: string
  label: string
  kind: CategoryKind
  icon: LucideIcon
  color: string
  keywords: string[]
}

/**
 * Categorias padrão. As palavras‑chave são comparadas sem acento e em
 * minúsculas. Quando várias batem, vence a palavra‑chave mais longa
 * (ex.: "amazon prime" → Assinaturas, "amazon" → Compras).
 */
export const CATEGORIES: CategoryDef[] = [
  // ── Saídas ──────────────────────────────────────────────
  { id: 'alimentacao', label: 'Alimentação', kind: 'expense', icon: Utensils, color: '#FF9500',
    keywords: ['ifood', 'i food', 'rappi', 'restaurante', 'lanche', 'lanchonete', 'pizza', 'pizzaria', 'hamburguer', 'burger', 'mcdonald', 'mc donald', 'bk', 'burger king', 'subway', 'habibs', 'outback', 'padaria', 'cafe', 'cafeteria', 'starbucks', 'almoco', 'jantar', 'acai', 'sushi', 'churrascaria', 'delivery', 'ze delivery', 'bar e restaurante', 'marmita', 'sorvete', 'doceria', 'kfc', 'giraffas', 'spoleto'] },
  { id: 'mercado', label: 'Mercado', kind: 'expense', icon: ShoppingCart, color: '#34C759',
    keywords: ['mercado', 'supermercado', 'carrefour', 'atacadao', 'assai', 'pao de acucar', 'hortifruti', 'feira', 'sacolao', 'sams club', 'makro', 'big bompreco', 'guanabara', 'zaffari', 'savegnago', 'tenda', 'mercadinho', 'acougue', 'oba hortifruti', 'compras do mes'] },
  { id: 'transporte', label: 'Transporte', kind: 'expense', icon: Car, color: '#007AFF',
    keywords: ['uber', '99', '99pop', '99 app', 'cabify', 'gasolina', 'combustivel', 'etanol', 'alcool', 'posto', 'shell', 'ipiranga', 'petrobras', 'br distribuidora', 'estacionamento', 'pedagio', 'sem parar', 'conectcar', 'veloe', 'metro', 'onibus', 'bilhete unico', 'trem', 'ipva', 'licenciamento', 'oficina', 'mecanico', 'pneu', 'troca de oleo', 'lava jato', 'lavagem', 'seguro auto', 'seguro do carro', 'financiamento carro', 'parcela carro', 'moto'] },
  { id: 'moradia', label: 'Moradia', kind: 'expense', icon: Home, color: '#AF52DE',
    keywords: ['aluguel', 'condominio', 'iptu', 'luz', 'energia', 'conta de luz', 'enel', 'cemig', 'copel', 'celesc', 'light', 'coelba', 'agua', 'conta de agua', 'sabesp', 'copasa', 'sanepar', 'cedae', 'gas', 'comgas', 'botijao', 'internet', 'fibra', 'net claro', 'vivo fibra', 'moveis', 'reforma', 'material de construcao', 'leroy merlin', 'diarista', 'faxina', 'financiamento casa', 'financiamento imovel'] },
  { id: 'contas', label: 'Contas e serviços', kind: 'expense', icon: Receipt, color: '#5AC8FA',
    keywords: ['celular', 'telefone', 'tim', 'claro', 'vivo', 'oi', 'recarga', 'plano celular', 'seguro', 'seguro de vida', 'tarifa', 'anuidade', 'cesta de servicos', 'cartorio', 'correios', 'lavanderia', 'contador', 'emprestimo', 'consignado', 'juros cartao'] },
  { id: 'assinaturas', label: 'Assinaturas', kind: 'expense', icon: Tv, color: '#FF2D55',
    keywords: ['netflix', 'spotify', 'amazon prime', 'prime video', 'disney', 'disney+', 'hbo', 'hbo max', 'max', 'globoplay', 'youtube premium', 'youtube', 'apple', 'icloud', 'apple music', 'apple tv', 'google one', 'deezer', 'paramount', 'star+', 'crunchyroll', 'chatgpt', 'openai', 'claude', 'game pass', 'xbox game pass', 'ps plus', 'playstation plus', 'microsoft 365', 'office 365', 'canva', 'adobe', 'assinatura', 'mensalidade app', 'kindle unlimited', 'audible', 'tinder', 'duolingo'] },
  { id: 'saude', label: 'Saúde e bem-estar', kind: 'expense', icon: HeartPulse, color: '#FF3B30',
    keywords: ['farmacia', 'drogaria', 'drogasil', 'droga raia', 'raia', 'pague menos', 'panvel', 'remedio', 'medicamento', 'medico', 'consulta', 'exame', 'laboratorio', 'hospital', 'clinica', 'dentista', 'odonto', 'plano de saude', 'unimed', 'amil', 'hapvida', 'sulamerica', 'bradesco saude', 'psicologo', 'terapia', 'fisioterapia', 'academia', 'smart fit', 'smartfit', 'bluefit', 'crossfit', 'pilates', 'nutricionista', 'gympass', 'wellhub', 'suplemento', 'oculos', 'otica'] },
  { id: 'educacao', label: 'Educação', kind: 'expense', icon: GraduationCap, color: '#5856D6',
    keywords: ['faculdade', 'universidade', 'escola', 'colegio', 'curso', 'udemy', 'alura', 'coursera', 'rocketseat', 'livro', 'livraria', 'mensalidade escolar', 'material escolar', 'ingles', 'idiomas', 'pos graduacao', 'mba', 'apostila', 'vestibular', 'enem', 'concurso'] },
  { id: 'lazer', label: 'Lazer', kind: 'expense', icon: Gamepad2, color: '#FFCC00',
    keywords: ['cinema', 'cinemark', 'show', 'ingresso', 'sympla', 'eventim', 'teatro', 'bar', 'balada', 'festa', 'cerveja', 'steam', 'playstation', 'xbox', 'nintendo', 'jogo', 'game', 'parque', 'clube', 'futebol', 'boliche', 'karaoke', 'museu', 'passeio'] },
  { id: 'viagem', label: 'Viagem', kind: 'expense', icon: Plane, color: '#30B0C7',
    keywords: ['passagem', 'aereo', 'hotel', 'pousada', 'airbnb', 'booking', 'hostel', 'latam', 'gol', 'azul', 'decolar', '123milhas', 'maxmilhas', 'hurb', 'viagem', 'aluguel de carro', 'localiza', 'movida', 'unidas', 'rodoviaria', 'buser', 'cruzeiro'] },
  { id: 'compras', label: 'Compras', kind: 'expense', icon: ShoppingBag, color: '#FF6482',
    keywords: ['amazon', 'mercado livre', 'mercadolivre', 'shopee', 'shein', 'aliexpress', 'temu', 'magalu', 'magazine luiza', 'americanas', 'casas bahia', 'ponto frio', 'kabum', 'fast shop', 'roupa', 'roupas', 'renner', 'riachuelo', 'c&a', 'cea', 'zara', 'hering', 'nike', 'adidas', 'centauro', 'netshoes', 'tenis', 'sapato', 'calcado', 'presente', 'eletronico', 'celular novo', 'notebook', 'fone', 'shopping', 'loja', 'decoracao', 'tok stok', 'ikea'] },
  { id: 'pets', label: 'Pets', kind: 'expense', icon: PawPrint, color: '#A2845E',
    keywords: ['pet', 'pet shop', 'petshop', 'racao', 'veterinario', 'vet', 'petz', 'cobasi', 'petlove', 'banho e tosa', 'tosa', 'cachorro', 'gato', 'areia gato'] },
  { id: 'impostos', label: 'Impostos e taxas', kind: 'expense', icon: Landmark, color: '#8E8E93',
    keywords: ['imposto', 'imposto de renda', 'irpf', 'darf', 'das', 'das mei', 'mei', 'inss', 'gps', 'multa', 'taxa', 'iof', 'detran', 'receita federal'] },
  { id: 'beleza', label: 'Beleza e cuidados', kind: 'expense', icon: Sparkles, color: '#FF7EB6',
    keywords: ['salao', 'cabelo', 'cabeleireiro', 'barbeiro', 'barbearia', 'manicure', 'unha', 'depilacao', 'cosmetico', 'cosmeticos', 'boticario', 'o boticario', 'natura', 'sephora', 'avon', 'perfume', 'maquiagem', 'estetica', 'skincare'] },
  { id: 'outros', label: 'Outros', kind: 'expense', icon: CircleDashed, color: '#AEAEB2', keywords: [] },

  // ── Entradas ────────────────────────────────────────────
  { id: 'salario', label: 'Salário', kind: 'extra', icon: Briefcase, color: '#34C759',
    keywords: ['salario', 'pagamento', 'adiantamento', 'vale', '13', '13o', 'decimo terceiro', 'ferias', 'plr', 'participacao nos lucros', 'bonus', 'bonificacao', 'comissao', 'hora extra', 'rescisao', 'fgts'] },
  { id: 'freelance', label: 'Freelance', kind: 'extra', icon: Laptop, color: '#007AFF',
    keywords: ['freela', 'freelance', 'freelancer', 'projeto', 'servico', 'consultoria', 'job', 'bico', 'aula particular', 'trabalho extra', 'nota fiscal', 'cliente'] },
  { id: 'vendas', label: 'Vendas', kind: 'extra', icon: Tag, color: '#FF9500',
    keywords: ['venda', 'vendi', 'vendido', 'olx', 'enjoei', 'mercado livre', 'marketplace', 'brecho'] },
  { id: 'rendimentos', label: 'Rendimentos', kind: 'extra', icon: TrendingUp, color: '#30B0C7',
    keywords: ['rendimento', 'rendimentos', 'dividendo', 'dividendos', 'jcp', 'juros', 'cdb', 'lci', 'lca', 'tesouro', 'resgate', 'cashback', 'aluguel recebido', 'proventos', 'poupanca'] },
  { id: 'reembolso', label: 'Reembolso', kind: 'extra', icon: Undo2, color: '#5856D6',
    keywords: ['reembolso', 'estorno', 'devolucao', 'ressarcimento', 'me pagou', 'pagou de volta', 'restituicao', 'restituicao ir'] },
  { id: 'presentes', label: 'Presentes', kind: 'extra', icon: Gift, color: '#FF2D55',
    keywords: ['presente', 'aniversario', 'mesada', 'doacao', 'premio', 'sorteio', 'natal'] },
  { id: 'outros_in', label: 'Outros', kind: 'extra', icon: CircleDashed, color: '#AEAEB2', keywords: [] },
]

const BY_ID = new Map(CATEGORIES.map(c => [c.id, c]))

export const FALLBACK: Record<CategoryKind, string> = { expense: 'outros', extra: 'outros_in' }

export function categoriesFor(kind: CategoryKind) {
  return CATEGORIES.filter(c => c.kind === kind)
}

export function getCategory(id: string | null | undefined, kind: CategoryKind = 'expense'): CategoryDef {
  return (id && BY_ID.get(id)) || BY_ID.get(FALLBACK[kind])!
}

/** minúsculas, sem acentos, sem pontuação redundante */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9&+ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Remove sufixos de parcela/números soltos para aprender pelo "nome" da compra */
export function descriptionKey(s: string): string {
  return normalize(s).replace(/\b\d+\s*\/\s*\d+\b/g, '').replace(/\s+/g, ' ').trim()
}

function escapeRe(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

// Pré‑compila os padrões (bordas de palavra para evitar "oi" em "biscoito")
const PATTERNS = CATEGORIES.flatMap(c =>
  c.keywords.map(k => {
    const kw = normalize(k)
    return { cat: c, len: kw.length, re: new RegExp(`(^| )${escapeRe(kw)}( |$)`) }
  }),
)

/** Histórico aprendido: chave da descrição → categoria escolhida pelo usuário */
export type CategoryHistory = Map<string, string>

/**
 * Sugere a categoria de um lançamento.
 * 1) Se o usuário já categorizou algo com a mesma descrição, repete a escolha.
 * 2) Senão, usa as palavras‑chave (vence a mais específica).
 * 3) Senão, "Outros".
 */
export function autoCategorize(description: string, kind: CategoryKind, history?: CategoryHistory): string {
  const key = descriptionKey(description)
  if (!key) return FALLBACK[kind]

  const learned = history?.get(`${kind}|${key}`)
  if (learned && BY_ID.get(learned)?.kind === kind) return learned

  // Aprendizado parcial: primeira palavra significativa (ex.: "uber viagem centro" ~ "uber")
  if (history) {
    const first = key.split(' ')[0]
    if (first.length >= 4) {
      const byFirst = history.get(`${kind}|~${first}`)
      if (byFirst && BY_ID.get(byFirst)?.kind === kind) return byFirst
    }
  }

  // Pontuação: palavra-chave mais longa vence; quem aparece no início da
  // descrição ganha bônus (ex.: "Uber viagem" → Transporte, não Viagem)
  let best: { id: string; score: number } | null = null
  for (const p of PATTERNS) {
    if (p.cat.kind !== kind) continue
    const m = p.re.exec(key)
    if (!m) continue
    const score = p.len + (m.index === 0 ? 10 : 0)
    if (score > (best?.score ?? 0)) best = { id: p.cat.id, score }
  }
  return best?.id ?? FALLBACK[kind]
}

/** Constrói o histórico a partir de lançamentos já categorizados (mais recentes primeiro). */
export function buildHistory(rows: { description: string; category: string | null; type: CategoryKind }[]): CategoryHistory {
  const h: CategoryHistory = new Map()
  for (const r of rows) {
    if (!r.category || r.category === FALLBACK[r.type]) continue
    const key = descriptionKey(r.description)
    if (!key) continue
    if (!h.has(`${r.type}|${key}`)) h.set(`${r.type}|${key}`, r.category)
    const first = key.split(' ')[0]
    if (first.length >= 4 && !h.has(`${r.type}|~${first}`)) h.set(`${r.type}|~${first}`, r.category)
  }
  return h
}
