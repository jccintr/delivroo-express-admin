# Delivroo Express — Admin

Painel administrativo da plataforma Delivroo Express: monitora entregas,
aprova cadastros de entregadores e ativa/desativa contas de lojistas e
entregadores.

Mesma stack e identidade visual do
[delivroo-express-store-web](https://github.com/jccintr/delivroo-express-store-web)
(React + Tailwind CSS v4 + flowbite-react).

## Características

- **Sem tela de cadastro** — só login. Contas de admin são criadas via
  `POST /admin/create` (autenticado) direto na API, não tem UI própria
  pra isso ainda.
- **Sessão persistente** — o token fica salvo no `localStorage`, então
  não precisa logar de novo a cada vez que abre o painel (mesmo padrão
  do store-web).
- **Totalmente responsivo** — sidebar vira menu gaveta (drawer) no
  mobile, listas em cards (não tabelas largas) para nunca estourar a
  tela.

## Telas

- **Dashboard** — indicadores gerais da plataforma, com destaque especial
  para entregadores com conta pendente de aprovação (card acima do grid
  normal, clicável, só aparece quando há pendências)
- **Entregadores** — lista com abas (Pendentes/Ativos/Inativos/Todos),
  busca, filtro por cidade; tela de detalhe com revisão do documento
  enviado, aprovação e ativação/desativação de conta
- **Lojas** — mesma estrutura de lista/detalhe, com ativação/desativação
- **Entregas** — monitor de todas as entregas da plataforma (qualquer
  loja/cidade), com filtro por status e cidade

## Rodando localmente

```bash
npm install
cp .env.example .env   # ajuste VITE_API_BASE_URL se a API não estiver em localhost:3000
npm run dev
```

## Build de produção

```bash
npm run build
```

## Backend necessário

Precisa da API (`api-delivroo-express-node`) já atualizada com os
endpoints `/admin/dashboard`, `/admin/riders`, `/admin/riders/:id`,
`/admin/stores`, `/admin/stores/:id`, `/admin/deliveries` e
`/admin/cities` — todos protegidos por `AuthAdmin`.

Para criar o primeiro admin (não tem UI de cadastro), use
`POST /api/admin/register` direto na API uma única vez, ou insira o
documento manualmente no banco.
