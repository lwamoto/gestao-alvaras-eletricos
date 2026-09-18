# Sistema de Controle de Alvará (SCA)

Sistema web full stack para digitalizar o controle de alvarás de obra da COPEL Distribuição: cadastro, acompanhamento de situação, geração da Solicitação/Planilha de Alvará para impressão e integração com as empresas empreiteiras responsáveis por cada obra.

Documentação completa do projeto (TCC): [`docs/tcc/TCC_Gestao_Alvaras_Eletricos.pdf`](docs/tcc/TCC_Gestao_Alvaras_Eletricos.pdf).

## Funcionalidades

- Login por e-mail ou chave de acesso, com dois papéis de usuário: **COPEL** (acesso total) e **EMPREITEIRA** (restrito aos próprios alvarás do tipo PARTICULAR).
- Cadastro de alvará individual ou em lote (2 a 10 de uma vez).
- Pesquisa e filtros por número, tipo, situação e empreiteira.
- Edição de situação, responsável, protocolo, número do alvará e endereços, com cálculo automático de largura/área da Planilha de Alvará.
- Impressão da Solicitação de Alvará e da Planilha de Alvará.
- Notificação automática à empreiteira quando o alvará é marcado como RECEBIDO.
- Dashboard com estatísticas por situação, responsável e empreiteira.
- Trilha de auditoria (histórico de criação/edição/exclusão) por alvará.
- Tema claro/escuro.

## Tecnologias

React + Vite + Tailwind CSS (front-end) · Node.js + Express (back-end) · MongoDB + Mongoose · autenticação por cookie JWT.

## 1. Criar o banco (MongoDB Atlas, gratuito)

1. Crie uma conta em https://www.mongodb.com/cloud/atlas/register
2. Crie um cluster gratuito (M0).
3. Em "Database Access", crie um usuário com senha.
4. Em "Network Access", libere seu IP (ou `0.0.0.0/0` para testar de qualquer lugar).
5. Em "Connect" > "Drivers", copie a connection string (algo como `mongodb+srv://usuario:senha@cluster.mongodb.net/...`).

## 2. Rodar o backend

```bash
cd server
npm install
copy .env.example .env
```

Abra o `.env` e preencha:
- `MONGODB_URI` — connection string do Atlas.
- `JWT_SECRET` — valor aleatório forte (ex: `openssl rand -hex 32`), nunca commitar o valor real.
- `CLIENT_ORIGIN` — normalmente `http://localhost:5173`.

```bash
npm run dev
```

Deve aparecer `Conectado ao MongoDB` e `Servidor rodando em http://localhost:4000`.

### Criar o primeiro usuário

Não existe tela de auto-cadastro — o primeiro usuário é criado via linha de comando:

```bash
node scripts/criarUsuario.js "Nome Completo" email@copel.com C807766 senha123
```

Para um usuário de empreiteira (cadastre a empreiteira antes, pela tela "Empreiteiras", logado como COPEL):

```bash
node scripts/criarUsuario.js "Nome Completo" email@empresa.com "" senha123 EMPREITEIRA NOME_DA_EMPREITEIRA
```

## 3. Rodar o frontend

Em outro terminal:

```bash
cd client
npm install
npm run dev
```

Abra o link que o Vite mostrar (geralmente http://localhost:5173).

## 4. Testar

- Faça login com o usuário criado no passo 2.
- Cadastre um alvará (Cadastrar Alvará) e acompanhe-o em Pesquisar Alvará.
- Troque a situação para ENVIADO e depois RECEBIDO — se o alvará tiver empreiteira, o sistema oferece notificá-la.
- Confira o Dashboard para ver as estatísticas atualizadas.

## Extensões usadas no desenvolvimento (VS Code)

ESLint, Prettier ESLint, Material Icon Theme, Error Lens, GitLens, Thunder Client, MongoDB for VS Code, Dracula Theme Official, Google Antigravity.

## Permitir rodar scripts no terminal (Windows)

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```
