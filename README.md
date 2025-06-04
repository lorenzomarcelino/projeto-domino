# Dominó Online

Um jogo de dominó online que permite que 4 jogadores formem 2 duplas e joguem seguindo as regras tradicionais do dominó clássico.

## Funcionalidades

- Partidas em duplas (4 jogadores)
- Sistema de pontuação completo conforme regras tradicionais
- Interface intuitiva com arrastar e soltar
- Temporizador para jogadas
- Notificações de eventos do jogo
- Regras completas disponíveis na tela inicial

## Requisitos

- Node.js 14+
- npm ou yarn

## Estrutura do Projeto

O projeto está dividido em duas partes:

- **Frontend**: Aplicação React usando TypeScript
- **Backend**: Servidor Node.js com Express e Socket.IO

## Instalação e Execução

### Método Rápido (Recomendado)

1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/domino-online.git
cd domino-online
```

2. Instale todas as dependências
```bash
npm run install:all
```

3. Execute o jogo (inicia backend e frontend automaticamente)
```bash
npm start
```

4. Acesse a aplicação em seu navegador: http://localhost:3000

### Método Manual

1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/domino-online.git
cd domino-online
```

2. Instale as dependências do backend
```bash
cd backend
npm install
```

3. Instale as dependências do frontend
```bash
cd ../frontend
npm install
```

4. Inicie o backend
```bash
cd backend
npm run dev
```

5. Em outro terminal, inicie o frontend
```bash
cd frontend
npm start
```

6. Acesse a aplicação em seu navegador: http://localhost:3000

## Scripts Disponíveis

- `npm start` - Inicia backend e frontend automaticamente
- `npm run install:all` - Instala dependências de todo o projeto
- `npm run build` - Compila backend e frontend para produção

## Como Jogar

1. Acesse a página inicial e digite seu nome
2. Clique em "JOGAR" para entrar na sala
3. Aguarde até que 4 jogadores entrem na sala
4. O jogo iniciará automaticamente quando a sala estiver cheia
5. Para jogar uma peça:
   - Arraste a peça para o lado esquerdo ou direito do tabuleiro
   - Ou dê um duplo clique na peça (se só houver uma posição possível)
6. Siga as regras do dominó clássico para vencer!

## Regras do Jogo

As regras completas estão disponíveis na tela inicial do jogo, mas aqui está um resumo:

- Cada jogador recebe 6 peças
- Na primeira rodada (ou após empate), começa quem tem a maior carroça
- Vence quem colocar todas as peças primeiro
- Em caso de jogo fechado, ganha quem tiver menos pontos na mão
- Diferentes tipos de batida valem pontuações diferentes (de 1 a 4 pontos)
- Vence a dupla que atingir 6 pontos primeiro

## Solução de Problemas

### Problemas de Conexão
- Verifique se o backend está rodando na porta 3001
- O frontend detecta automaticamente portas disponíveis (3001-3005)
- Use o arquivo `test-connection.html` para testar a conexão

### Vulnerabilidades de Segurança
- As vulnerabilidades reportadas pelo `npm audit` são de dependências de desenvolvimento
- Para corrigir (pode quebrar compatibilidade): `npm audit fix --force`
- O projeto funciona normalmente com as vulnerabilidades atuais

### Problemas de TypeScript
- Os comentários `@ts-ignore` são necessários para compatibilidade com react-dnd
- Certifique-se de que todas as dependências estão instaladas corretamente 