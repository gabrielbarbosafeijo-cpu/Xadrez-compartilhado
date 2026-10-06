# Jogo de Xadrez (em desenvolvimento)

Jogo de xadrez para dois jogadores no navegador, feito apenas com **HTML, CSS e JavaScript**.

## Como executar

Abra o arquivo `index.html` no navegador (duplo clique). Não precisa de servidor.

## Andamento

**Feito**
- [x] Estrutura de pastas (`css/`, `js/`, `assets/chess/`)
- [x] Tabuleiro 8×8 com CSS Grid, responsivo, com coordenadas (a–h e 1–8)
- [x] Estado do jogo em uma matriz 8×8 (`tabuleiro`) e redesenho da tela a partir dela
- [x] Peças em SVG (conjunto cburnett do Lichess) na posição inicial
- [x] Drag and Drop: arrastar uma peça e soltar em outra casa
- [x] Função central `tentarJogada(origem, destino)`: o evento `drop` não move nada sozinho
- [x] Alternância de turnos com indicação de quem joga
- [x] Bloqueios básicos: peça do adversário, casa de origem vazia e captura de peça da mesma cor
- [x] Destaque da peça arrastada e aviso de jogada recusada
- [x] Botão Nova partida

**A fazer**
- [ ] Movimento de cada peça (cavalo, rei, torre, bispo, dama e peão)
- [ ] Impedir que peças atravessem outras peças
- [ ] Xeque e proibição de deixar o próprio rei em xeque
- [ ] Xeque-mate e afogamento
- [ ] Promoção do peão
- [ ] Extras (roque, en passant e histórico de jogadas)

## Estrutura

```text
chess/
├── index.html
├── css/style.css        # layout, tabuleiro, destaque e responsividade
├── js/
│   ├── pieces.js        # códigos das peças, cores, imagens e posição inicial
│   ├── board.js         # desenho do tabuleiro e Drag and Drop
│   ├── game.js          # estado da partida e a função tentarJogada
│   └── main.js          # ponto de partida
└── assets/chess/        # 12 SVGs das peças
```

## Limitação atual

Ainda **não há validação do movimento de cada peça**: qualquer peça vai para qualquer casa livre ou ocupada por uma peça adversária.
