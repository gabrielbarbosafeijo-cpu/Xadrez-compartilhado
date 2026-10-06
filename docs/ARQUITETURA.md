# Arquitetura do projeto

Este documento explica **o que cada arquivo faz** e **como uma jogada percorre o código**.

## Ideia central

A matriz `tabuleiro` é a **única fonte da verdade**. A tela é só um desenho dela. Por isso:

1. Toda jogada altera a matriz primeiro.
2. Depois `renderizarTabuleiro()` apaga e redesenha as peças.
3. Nunca movemos imagens diretamente no HTML.

Além disso, o código é separado em camadas, para que cada parte possa ser entendida (e testada) sozinha:

| Camada | Arquivo | Conhece a tela? |
|---|---|---|
| Dados das peças | `pieces.js` | Não |
| Regras do xadrez | `rules.js` | **Não** (por isso dá para testar no terminal) |
| Interface e arrastar | `board.js` | Sim |
| Estado e fluxo da jogada | `game.js` | Só chama funções de `board.js` |
| Início | `main.js` | Sim |

## Convenções de dados

**Código da peça** = cor + tipo: `"wK"` é o rei branco e `"bP"` é o peão preto. Tipos: `K` rei, `Q` dama, `R` torre, `B` bispo, `N` cavalo e `P` peão.

**Matriz:** `tabuleiro[linha][coluna]`, com a linha 0 sendo a fileira 8 (pretas) e a linha 7 sendo a fileira 1 (brancas). Casa vazia é `null`.

**Posição:** `{ linha, coluna }`. Para o histórico, `posicaoParaNotacao()` converte para texto (`{linha: 6, coluna: 4}` vira `"e2"`).

**Movimento:** `{ linha, coluna, especial }`, onde `especial` é `null`, `"roquePequeno"`, `"roqueGrande"` ou `"enPassant"`.

**Contexto:** informações que a matriz sozinha não mostra: `direitosRoque` (quem ainda pode rocar, de cada lado) e `alvoEnPassant` (a casa "pulada" por um peão que acabou de andar duas casas).

## Arquivo por arquivo

### `js/pieces.js`
Constantes e funções simples sobre peças: `criarTabuleiroInicial()`, `corDaPeca()`, `tipoDaPeca()`, `caminhoDaImagem()` e `nomeDaPeca()`.

### `js/rules.js`
As regras. Principais funções:

- `movimentosPseudoLegais(tabuleiro, linha, coluna, contexto)`: os movimentos que a peça faz **pelas regras dela**, ignorando o xeque. Cada tipo de peça tem sua função (`movimentosDoPeao`, `movimentosDeslizantes` para torre, bispo e dama, `movimentosDeSalto` para o cavalo, `movimentosDoRei` com o roque).
- `casaAtacada(tabuleiro, linha, coluna, corAtacante)`: olha "para fora" da casa e verifica se algum peão, cavalo, rei ou peça deslizante inimiga a enxerga.
- `reiEmXeque(tabuleiro, cor)`: acha o rei e pergunta se a casa dele está atacada.
- `movimentosLegais(...)`: filtra os pseudo-legais, **simulando cada um numa cópia** do tabuleiro (`copiarTabuleiro` + `aplicarMovimento`) e descartando os que deixam o próprio rei em xeque.
- `existeJogadaLegal(tabuleiro, cor, contexto)`: serve para detectar xeque-mate e afogamento.
- `jogadaEhValida(...)`: a função usada pelo `drop`. Devolve `{ valido, motivo, movimento }`.
- `atualizarContexto(...)`: depois de cada jogada, atualiza os direitos de roque e o alvo de en passant.

### `js/board.js`
Tudo que mexe no HTML:

- `criarCasas()` cria as 64 `div` uma única vez (com as coordenadas e os eventos `dragover` e `drop`).
- `renderizarTabuleiro()` e `renderizarPainel()` desenham o estado atual.
- Os 4 eventos do arrastar: `dragstart` (guarda a origem no `dataTransfer`), `dragover` (o `preventDefault()` libera o drop), `drop` (descobre origem e destino e chama `tentarJogada`) e `dragend` (limpa os destaques).
- Painel de aviso, histórico e menu de promoção.

### `js/game.js`
O estado (`tabuleiro`, `jogadorAtual`, `contexto`, `historico`, `situacaoPartida`) e o fluxo:

- `novaPartida()` reinicia tudo.
- `tentarJogada(origem, destino)` é por onde **toda** jogada passa.
- `executarJogada(...)` aplica uma jogada já validada, confere xeque, xeque-mate e afogamento, registra no histórico e só então troca o turno.
- `gerarNotacaoBase()` e `descobrirDesambiguacao()` produzem a notação (`Nbd2`, `exd5`, `O-O`...).

### `js/main.js`
Monta o tabuleiro, liga o botão "Nova partida" e inicia a primeira partida.

## O caminho de uma jogada (e2 → e4)

```text
dragstart ──► guarda "6,4" no dataTransfer e destaca a casa de origem
dragover  ──► preventDefault(): a casa aceita receber a peça
drop      ──► lê origem {6,4} e destino {4,4}  ──► tentarJogada()
                                                      │
                          jogadaEhValida() (rules.js) ◄┘
                            peça na origem? é do jogador da vez? destino ok?
                            movimento permitido? rei não fica em xeque?
                                  │
                    inválida ─────┴───── válida
                       │                    │
              mostrarAviso(motivo)    executarJogada()
              (nada muda)              ├─ altera a matriz
                                       ├─ atualiza o contexto
                                       ├─ confere xeque / mate / afogamento
                                       ├─ registra no histórico
                                       └─ troca o turno e redesenha
```

## Decisões de projeto

- **Scripts comuns em vez de módulos (`import`/`export`)**: o jogo abre direto pelo `index.html`, sem servidor, e o código fica no estilo usado nas aulas.
- **Simular em uma cópia** para validar o xeque: é mais simples e menos sujeito a erros do que tratar peças cravadas e casos especiais um a um.
- **`rules.js` sem acesso ao `document`**: permite testar as regras no terminal com o perft.
- **Redesenhar tudo a cada jogada**: são só 64 casas, e evita a classe de erros em que a tela e a matriz ficam diferentes.
- **Notação algébrica no histórico**: permite conferir as jogadas com qualquer livro ou site de xadrez.
