# 🧶 AmiContador - Contador de Voltas para Amigurumi & Crochê

> Contador inteligente de voltas e pontos projetado para **PC e Celular**, com lembretes visuais e sonoros de mudança de cor, gerenciador de peças (cabeça, corpo, braços, etc.), sincronização instantânea via QR Code / Link e banco de dados para salvar cada projeto individualmente.

Pronto para deploy no **GitHub** e na **Vercel** com zero configuração!

---

## ✨ Funcionalidades Principais

- 📱 **Otimizado para Celular & PC**:
  - **Botões Grandes e Táteis**: Perfeito para avançar voltas e pontos com apenas uma mão enquanto segura a agulha e o fio de crochê.
  - **Atalhos no Teclado (PC)**: `Espaço` ou `↑` para +1 Volta, `↓` para -1 Volta, `→` ou `P` para +1 Ponto, `←` para -1 Ponto, `R` para zerar pontos da volta.
  - **Modo Tela Sempre Ativa (Wake Lock)**: Impede que a tela do celular apague enquanto você crocheta.
- 🎨 **Lembretes de Mudança de Cor (Troca de Fio)**:
  - Configure as voltas onde a cor do fio deve mudar (com paleta de cores para amigurumi e dicas personalizadas).
  - Alerta sonoro (sintetizado via Web Audio API) e vibração háptica no celular ao atingir a volta de troca.
  - Aviso na tela destacando a cor atual e a próxima cor com a dica da última laçada.
- 🧸 **Partes Anatômicas do Amigurumi**:
  - Organize o amigurumi em peças: Cabeça, Corpo, Braços x2, Pernas x2, Orelhas x2, Focinho, Rabinho ou peças livres.
  - Acompanhe a porcentagem de conclusão de cada peça e celebre a finalização com efeitos sonoros e chuva de confetes!
- 💾 **Banco de Dados Individual para Cada Projeto**:
  - Salve múltiplos projetos separadamente (ex.: *Ursinho Caramelo*, *Polvinho Sensorial*, *Chaveiro*).
  - Modelos pré-configurados (Templates) para início rápido.
  - Exportação e importação de backups em formato `.json`.
- 🔄 **Sincronização entre Dispositivos (PC & Celular)**:
  - **QR Code Instantâneo**: No PC, clique em "Sincronizar" e aponte a câmera do celular para clonar e abrir o projeto exatamente na volta atual.
  - **Link de Compartilhamento**: Envie pelo WhatsApp ou Telegram para continuar no outro aparelho.
  - **Integração Opcional com Supabase**: Quer salvar na nuvem? Basta colar a URL e a Anon Key do seu projeto Supabase no painel integrado (com script SQL pronto para copiar e colar).

---

## 🚀 Como Rodar Localmente

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/amicontador.git
cd amicontador
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

Abra no navegador em `http://localhost:3000`.

---

## ⚡ Como Fazer Deploy na Vercel

O projeto já inclui o arquivo `vercel.json` configurado para single-page app (SPA).

### Opção 1: Via GitHub (Recomendado)
1. Crie um repositório no seu [GitHub](https://github.com) e faça o push do código:
   ```bash
   git init
   git add .
   git commit -m "feat: AmiContador completo para amigurumi"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
   git push -u origin main
   ```
2. Acesse o painel da [Vercel](https://vercel.com).
3. Clique em **"Add New Project"** e selecione o repositório do GitHub.
4. A Vercel detectará automaticamente o framework **Vite**. Clique em **Deploy**!

### Opção 2: Via Vercel CLI
```bash
npx vercel
```

---

## 🛠️ Tecnologias Utilizadas

- **React 19 & TypeScript**
- **Vite** para build ultrarrápido
- **Tailwind CSS v4**
- **Lucide Icons** para ícones limpos e expressivos
- **Web Audio API** para efeitos sonoros sem carregar arquivos pesados
- **Screen Wake Lock API** para manter tela acesa
- **QRCode** para transferência rápida entre dispositivos
- **Canvas Confetti** para animação de conclusão de peças
- **Supabase JS Client** (opcional, pronto para integração)

---

## 📄 Licença
Distribuído sob a licença Apache-2.0.
