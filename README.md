# App Barbearia - Gestão e Agendamento

Este é um sistema moderno de gestão para barbearias, desenvolvido com **React**, **Vite**, **Tailwind CSS** e **Supabase**. O foco é agilidade no agendamento, controle financeiro e facilidade de uso tanto para o barbeiro quanto para o cliente.

## 🚀 Tecnologias Utilizadas

- **Frontend:** React 18, TypeScript, Vite
- **Estilização:** Tailwind CSS, Lucide React (Ícones)
- **Backend/Banco de Dados:** Supabase
- **PWA:** Vite Plugin PWA (Suporte para instalação no celular)
- **Testes:** Vitest, Playwright (E2E)

## 🛠️ Instalação e Configuração

### Pré-requisitos
- [Node.js](https://nodejs.org/) (recomendado v18+)
- Conta no [Supabase](https://supabase.com/)

### Passo 1: Clonar e Instalar Dependências
```bash
# Clone o repositório ou baixe os arquivos
cd "APP Barbearia"

# Instale as dependências
npm install
```

### Passo 2: Configurar Supabase
1. Crie um novo projeto no Supabase.
2. Vá em **SQL Editor** e execute o conteúdo do arquivo `supabase_schema.sql` que está na raiz deste projeto. Isso criará as tabelas e políticas de segurança necessárias.
3. Obtenha suas credenciais:
   - Vá em **Project Settings** > **API**.
   - Copie a `Project URL` e a `anon public key`.

### Passo 3: Variáveis de Ambiente
Crie ou edite o arquivo `.env.local` na raiz do projeto com as suas credenciais:
```env
VITE_SUPABASE_URL=Sua_URL_do_Supabase
VITE_SUPABASE_ANON_KEY=Sua_Chave_Anon_do_Supabase
```

### Passo 4: Executar o Projeto
```bash
# Iniciar em modo de desenvolvimento
npm run dev
```
O projeto estará disponível em `http://localhost:5173`.

## 📦 Build para Produção
```bash
npm run build
```
Os arquivos otimizados serão gerados na pasta `dist`.

## 🧪 Testes
- **Unitários:** `npm run test`
- **E2E (Interface):** `npm run test:e2e`

---
Desenvolvido para proporcionar a melhor experiência em gestão de barbearias.
