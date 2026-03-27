# Tutorial Completo de Deploy — Hosting Gratuito

## Arquitetura do Deploy

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   VERCEL        │────▶│   RENDER        │────▶│ MONGODB ATLAS   │
│   (Frontend)    │     │   (Backend)     │     │   (Banco)       │
│   GRÁTIS        │     │   GRÁTIS        │     │   GRÁTIS        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

| Serviço | Uso | Limite Gratuito |
|---------|-----|-----------------|
| **MongoDB Atlas** | Banco de dados | 512 MB, compartilhado |
| **Render** | Backend Node.js | 750h/mês, dorme após 15min idle |
| **Vercel** | Frontend Next.js | Ilimitado para projetos pessoais |
| **GitHub** | Código-fonte | Repositórios privados ilimitados |

> ⚠️ **Importante sobre o Render Free:** O servidor "dorme" após 15 minutos sem uso.
> A primeira requisição pode demorar ~30 segundos para "acordar". Para uso sério,
> considere o plano pago do Render ($7/mês) ou use o Railway (tem $5 de crédito/mês grátis).

---

## PASSO 1 — Preparar o GitHub

### 1.1 Criar conta no GitHub
Acesse https://github.com e crie uma conta (gratuita).

### 1.2 Criar repositório
1. Clique em **New repository**
2. Nome: `saas-platform` (ou qualquer nome)
3. Visibilidade: **Private** (recomendado)
4. Clique em **Create repository**

### 1.3 Enviar o código
Abra o terminal na pasta do projeto e execute:

```bash
# Dentro da pasta saas-platform/
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/saas-platform.git
git push -u origin main
```

> Substitua `SEU_USUARIO` pelo seu usuário do GitHub.

---

## PASSO 2 — Banco de Dados (MongoDB Atlas)

### 2.1 Criar conta
Acesse https://www.mongodb.com/cloud/atlas e crie uma conta gratuita.

### 2.2 Criar cluster gratuito
1. Clique em **Build a Database**
2. Escolha **FREE** (M0 Sandbox)
3. Provider: **AWS**
4. Region: **São Paulo (sa-east-1)** ou o mais próximo
5. Clique em **Create**

### 2.3 Configurar usuário do banco
1. Em **Database Access**, clique em **Add New Database User**
2. Authentication Method: **Password**
3. Username: `saas_user` (ou qualquer nome)
4. Password: clique em **Autogenerate Secure Password** e **copie a senha**
5. Role: **Atlas Admin**
6. Clique em **Add User**

### 2.4 Liberar acesso de rede
1. Em **Network Access**, clique em **Add IP Address**
2. Clique em **Allow Access from Anywhere** (`0.0.0.0/0`)
   > Necessário para que o Render possa conectar
3. Clique em **Confirm**

### 2.5 Obter a Connection String
1. Em **Database**, clique em **Connect**
2. Escolha **Drivers**
3. Driver: **Node.js**
4. Copie a string. Ela tem este formato:
   ```
   mongodb+srv://saas_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Substitua `<password>` pela senha que você copiou
6. Adicione o nome do banco antes de `?`:
   ```
   mongodb+srv://saas_user:SENHA@cluster0.xxxxx.mongodb.net/saas_platform?retryWrites=true&w=majority
   ```
7. **Guarde essa string** — você vai precisar no próximo passo.

---

## PASSO 3 — Backend no Render

### 3.1 Criar conta
Acesse https://render.com e crie uma conta (pode entrar com GitHub).

### 3.2 Criar Web Service
1. No Dashboard, clique em **New +** → **Web Service**
2. Conecte seu repositório GitHub
3. Selecione o repositório `saas-platform`
4. Configure:
   - **Name:** `saas-platform-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Region:** `Oregon (US West)` ou outro
   - **Branch:** `main`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** `Free`

### 3.3 Configurar variáveis de ambiente
Clique em **Environment** e adicione estas variáveis:

| Chave | Valor |
|-------|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | `mongodb+srv://saas_user:SENHA@cluster0...` |
| `JWT_SECRET` | `uma_chave_aleatoria_muito_longa_aqui_ex_xK9$mP2#` |
| `JWT_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | `https://seu-projeto.vercel.app` *(preencha depois)* |

> Para gerar um JWT_SECRET seguro, use: https://generate-secret.vercel.app/32

### 3.4 Deploy
Clique em **Create Web Service**. O Render vai:
1. Clonar o repositório
2. Instalar dependências
3. Iniciar o servidor

Aguarde o build terminar. Você verá o log ao vivo.

### 3.5 Anotar a URL do backend
Após o deploy, você terá uma URL como:
```
https://saas-platform-backend.onrender.com
```
**Anote essa URL** — você vai precisar para o frontend.

---

## PASSO 4 — Frontend no Vercel

### 4.1 Criar conta
Acesse https://vercel.com e crie uma conta (pode entrar com GitHub).

### 4.2 Importar projeto
1. No Dashboard, clique em **Add New** → **Project**
2. Conecte o repositório `saas-platform`
3. Configure:
   - **Framework Preset:** `Next.js` (detectado automaticamente)
   - **Root Directory:** `frontend`

### 4.3 Configurar variáveis de ambiente
Antes de clicar em Deploy, em **Environment Variables** adicione:

| Chave | Valor |
|-------|-------|
| `NEXT_PUBLIC_API_URL` | `https://saas-platform-backend.onrender.com/api` |
| `NEXT_PUBLIC_SOCKET_URL` | `https://saas-platform-backend.onrender.com` |

> Use a URL do Render do passo anterior.

### 4.4 Deploy
Clique em **Deploy**. O Vercel vai:
1. Instalar dependências
2. Fazer o build do Next.js
3. Publicar

Após terminar, você terá uma URL como:
```
https://saas-platform.vercel.app
```

---

## PASSO 5 — Atualizar CORS no Backend

Agora que você tem a URL do Vercel, volte ao Render e atualize a variável:

1. No Render, vá em **Environment** do seu serviço
2. Edite `FRONTEND_URL` com a URL do Vercel:
   ```
   https://saas-platform.vercel.app
   ```
3. O Render vai redeployar automaticamente.

---

## PASSO 6 — Rodar o Seed (Criar Admin)

O seed cria o usuário admin, categorias e conteúdos iniciais.

### Opção A — Rodar localmente apontando para o Atlas (recomendado)

1. Edite `backend/.env`:
   ```env
   MONGODB_URI=mongodb+srv://saas_user:SENHA@cluster0.xxxxx.mongodb.net/saas_platform?retryWrites=true&w=majority
   ```
2. Execute:
   ```bash
   cd backend
   npm install
   npm run seed
   ```

### Opção B — Rodar via Render (Shell)

1. No Render, clique no seu serviço
2. Clique na aba **Shell**
3. Execute:
   ```bash
   node scripts/seed.js
   ```

### Resultado esperado

```
🌱  Iniciando seed da plataforma...

✅  MongoDB conectado: cluster0.xxxxx.mongodb.net
✅  Admin criado: admin@plataforma.com
✅  5 categorias criadas/atualizadas
✅  4 conteúdos de exemplo criados

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉  SEED CONCLUÍDO COM SUCESSO!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  📧  Email:  admin@plataforma.com
  🔑  Senha:  Admin@123456
  👑  Role:   admin / elite

  ⚠️   Altere a senha após o primeiro login!
```

---

## PASSO 7 — Acessar a Plataforma

1. Acesse `https://seu-projeto.vercel.app`
2. Clique em **Login**
3. Use as credenciais:
   - **Email:** `admin@plataforma.com`
   - **Senha:** `Admin@123456`
4. Você terá acesso total ao painel admin em `/admin`

---

## Atualizar o Código (Deploy Automático)

Após configurar uma vez, toda vez que você fizer `git push`, o deploy atualiza automaticamente:

```bash
git add .
git commit -m "minha atualização"
git push
```

- **Render** detecta o push e redeployo o backend
- **Vercel** detecta o push e redeployar o frontend

---

## Solução de Problemas

### Backend não inicia no Render
- Verifique os logs em **Logs** no painel do Render
- Confirme que `MONGODB_URI` está correto
- Certifique-se de que o IP `0.0.0.0/0` está liberado no Atlas

### Frontend dá erro de CORS
- Verifique se `FRONTEND_URL` no Render tem exatamente a URL do Vercel (sem `/` no final)
- Aguarde o redeploy do Render após mudar a variável

### Chat (WebSocket) não conecta
- O Render Free tem suporte limitado a WebSockets
- Se o chat não funcionar no free tier, considere o Render Starter ($7/mês)
- Alternativa: use o Railway que tem melhor suporte a WebSockets

### Servidor "dorme" (Render Free)
- Normal no plano gratuito: dorme após 15min sem requisições
- A primeira requisição pode demorar 30-60 segundos
- Para evitar: crie um cron job externo que "acorda" o servidor a cada 14 minutos:
  - Use https://cron-job.org (gratuito)
  - URL: `https://saas-platform-backend.onrender.com/api/health`
  - Intervalo: a cada 14 minutos

---

## Alternativa: Railway (melhor para WebSocket)

Se preferir usar Railway ao invés do Render:

1. Acesse https://railway.app
2. Faça login com GitHub
3. **New Project** → **Deploy from GitHub repo**
4. Selecione `saas-platform`, Root: `backend`
5. Adicione as mesmas variáveis de ambiente
6. Railway gera automaticamente uma URL

Railway tem $5 de crédito gratuito/mês, melhor uptime e suporte nativo a WebSockets.

---

## Resumo das URLs Finais

Após o deploy completo, você terá:

| O quê | URL |
|-------|-----|
| Frontend | `https://seu-projeto.vercel.app` |
| Backend API | `https://saas-platform-backend.onrender.com/api` |
| Health Check | `https://saas-platform-backend.onrender.com/api/health` |
| Admin Panel | `https://seu-projeto.vercel.app/admin` |
