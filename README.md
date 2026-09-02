# Exetenções utilizadas
ESLint | 
Prettier ESLint | 
Material Icon Theme | 
Error Lens | 
GitLens — Git supercharged |
Thunder Client |
MongoDB for VS Code |
Dracula Theme Official|
Google Antigravity| 

# Permitir usar o terminal nos PCs
Set-ExecutionPolicy -Scope |
CurrentUser RemoteSigned

# Controle de Alvará (demo)

Mini sistema para digitalizar a planilha CONTROLE DE ALVARÁ: responsável, número do projeto, tipo (CONSUMIDOR/PARTICULAR) e situação (A FAZER/ENVIADO/RECEBIDO), salvando tudo no MongoDB.

Esta é uma demo para validar a ideia com o supervisor antes de decidir a ferramenta definitiva (ex: Power Apps). Não substitui ainda as etapas de impressão em A3/A4 e geração da Solicitação de Alvará.

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

Abra o `.env` e cole sua connection string em `MONGODB_URI`.

```bash
npm run dev
```

Deve aparecer `Conectado ao MongoDB` e `Servidor rodando em http://localhost:4000`.

## 3. Rodar o frontend

Em outro terminal:

```bash
cd client
npm install
npm run dev
```

Abra o link que o Vite mostrar (geralmente http://localhost:5173).

## 4. Testar

- Cadastre um alvará (ex: número de projeto `1734567`, tipo `CONSUMIDOR`).
- Troque a situação pelo seletor da tabela.
- Feche a aba e abra de novo — o registro deve continuar lá (está salvo no MongoDB, não só na memória do navegador).
- Use os filtros de Tipo e Situação para checar a lista.
