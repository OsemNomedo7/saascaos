# SaaS Platform — Hub Privado de Conteúdos + Comunidade

Plataforma SaaS completa com sistema de membros, conteúdos exclusivos, comunidade e chat em tempo real.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Backend | Node.js + Express |
| Banco de Dados | MongoDB + Mongoose |
| Autenticação | JWT |
| Chat em Tempo Real | Socket.io |
| Armazenamento | Preparado para AWS S3 |
| Pagamentos | Preparado para Stripe / Mercado Pago |

---

## Estrutura do Projeto

```
saas-platform/
├── backend/
│   ├── src/
│   │   ├── config/       → Conexão com MongoDB
│   │   ├── models/       → Schemas Mongoose (User, Content, Category, Subscription, Post, Message, Log)
│   │   ├── middlewares/  → auth, admin, subscription
│   │   ├── routes/       → auth, users, content, categories, subscriptions, community, drops, admin, search
│   │   └── socket/       → Handler do chat em tempo real
│   └── server.js         → Servidor Express + Socket.io + Cron jobs
└── frontend/
    └── src/
        ├── app/
        │   ├── (auth)/          → /login, /register
        │   ├── (dashboard)/     → /dashboard, /content, /community, /drops, /profile, /planos
        │   │   └── category/[slug]/  → Páginas dinâmicas por categoria
        │   └── admin/           → Painel administrativo completo
        ├── components/          → UI, layout, content, admin
        ├── contexts/            → AuthContext, SocketContext
        ├── lib/                 → api.ts (axios), utils.ts
        └── types/               → TypeScript types
```

---

## Pré-requisitos

- Node.js 18+
- MongoDB rodando localmente (ou MongoDB Atlas)
- npm ou yarn

---

## Como Rodar Localmente

### 1. Backend

```bash
cd saas-platform/backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar o .env com suas configurações

# Rodar em desenvolvimento
npm run dev
```

O backend sobe em `http://localhost:5000`

### 2. Frontend

```bash
cd saas-platform/frontend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.local.example .env.local

# Rodar em desenvolvimento
npm run dev
```

O frontend sobe em `http://localhost:3000`

---

## Variáveis de Ambiente

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/saas_platform
JWT_SECRET=sua_chave_secreta_jwt_aqui
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000

# AWS S3 (opcional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=
AWS_REGION=us-east-1

# Pagamentos (opcional)
STRIPE_SECRET_KEY=sk_test_...
MERCADOPAGO_ACCESS_TOKEN=
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## Criar Primeiro Admin

Após registrar o primeiro usuário, atualize manualmente no MongoDB:

```javascript
db.users.updateOne(
  { email: "seu@email.com" },
  { $set: { role: "admin" } }
)
```

---

## API — Principais Endpoints

### Autenticação
```
POST /api/auth/register     → Cadastro
POST /api/auth/login        → Login (retorna JWT)
GET  /api/auth/me           → Usuário autenticado
POST /api/auth/logout       → Logout
```

### Conteúdos
```
GET    /api/content         → Listar (com filtros: ?category=&type=&level=&sort=)
GET    /api/content/:id     → Detalhes
POST   /api/content         → Criar (admin)
PUT    /api/content/:id     → Editar (admin)
DELETE /api/content/:id     → Excluir (admin)
POST   /api/content/:id/download  → Incrementar downloads
POST   /api/content/upload        → Upload de arquivo
```

### Categorias
```
GET    /api/categories       → Listar (público)
GET    /api/categories/:slug → Categoria com conteúdos
POST   /api/categories       → Criar (admin) — gera página automática no frontend
PUT    /api/categories/:id   → Editar (admin)
DELETE /api/categories/:id   → Excluir (admin)
```

### Assinaturas
```
GET  /api/subscriptions/plans    → Planos disponíveis (público)
GET  /api/subscriptions/my       → Assinatura do usuário
POST /api/subscriptions/checkout → Iniciar pagamento
POST /api/subscriptions/webhook  → Webhook de pagamento
POST /api/subscriptions/activate-manual  → Ativar manualmente (admin)
```

### Comunidade
```
GET  /api/community/posts              → Listar posts
POST /api/community/posts              → Criar post
POST /api/community/posts/:id/like     → Curtir post
POST /api/community/posts/:id/pin      → Fixar post (admin)
GET  /api/community/posts/:id/comments → Comentários
POST /api/community/posts/:id/comments → Comentar
```

### Admin
```
GET /api/admin/dashboard      → Stats gerais
GET /api/admin/users          → Lista de usuários
GET /api/admin/subscriptions  → Assinaturas
GET /api/admin/logs           → Logs de atividade
```

### Busca
```
GET /api/search?q=termo&category=&type=&level=&sort=recent|popular
```

---

## Funcionalidades Implementadas

- [x] Sistema de autenticação JWT
- [x] Cadastro e login seguros (bcrypt)
- [x] Planos: semanal, mensal, vitalício
- [x] Bloqueio automático por expiração (cron job a cada hora)
- [x] Sistema de níveis: iniciante, intermediário, avançado, elite
- [x] Controle de acesso por nível mínimo do conteúdo
- [x] Gestão completa de conteúdos (CRUD + upload)
- [x] Categorias dinâmicas (página criada automaticamente ao adicionar)
- [x] Drops com tempo limitado e countdown
- [x] Fórum: posts, comentários, curtidas, pins
- [x] Chat em tempo real (Socket.io) com histórico
- [x] Indicador de usuários online
- [x] Indicador "digitando..."
- [x] Busca global com filtros
- [x] Painel admin completo
- [x] Logs de acesso/login/download
- [x] Preparado para S3 (upload de arquivos)
- [x] Preparado para Stripe/Mercado Pago
- [x] Dark mode (tema hacker premium)
- [x] Layout responsivo

---

## Integrar Pagamentos

### Stripe
No arquivo `backend/src/routes/subscriptions.js`, descomente e configure o bloco Stripe. Use a webhook secret para verificar eventos `checkout.session.completed`.

### Mercado Pago
Substitua pelo SDK `mercadopago` e configure o webhook para `payment.approved`.

---

## Deploy Sugerido

| Serviço | Uso |
|---------|-----|
| Railway / Render | Backend Node.js |
| Vercel | Frontend Next.js |
| MongoDB Atlas | Banco de dados |
| AWS S3 / Cloudflare R2 | Arquivos |
| Upstash | Redis (opcional, para sessões/cache) |
