# Jogo de Xadrez

Jogo de xadrez para dois jogadores feito com **HTML, CSS e JavaScript**.

## Como executar

Abra o arquivo `index.html` no navegador. Não precisa instalar nada.

## Arquivos

| Arquivo | O que faz |
|---|---|
| `index.html` | Estrutura da página |
| `css/style.css` | Aparência do tabuleiro e do painel |
| `js/pecas.js` | Tabuleiro inicial e funções simples sobre as peças |
| `js/regras.js` | Regras do xadrez (movimentos, xeque, jogadas legais) |
| `js/tela.js` | Desenha o tabuleiro e trata o arrastar e soltar |
| `js/jogo.js` | Estado da partida e o que acontece em cada jogada |
| `assets/chess/` | Imagens das peças (SVG) |

## Como o tabuleiro é guardado

O tabuleiro é um **array de 8 arrays** (8 linhas, cada uma com 8 casas):

```js
tabuleiro[linha][coluna]   // por exemplo: tabuleiro[7][4] é "wK" (rei branco)
```

Cada peça é um texto de 2 letras: a cor (`w` branca, `b` preta) e o tipo (`K` rei, `Q` dama, `R` torre, `B` bispo, `N` cavalo, `P` peão). Casa vazia é `null`. A tela é só um desenho desse array: toda jogada muda o array primeiro e depois o tabuleiro é desenhado de novo.

## Como uma jogada funciona

1. O jogador arrasta uma peça e solta em uma casa.
2. O evento `drop` só descobre a casa de origem e a de destino e chama `tentarJogada`.
3. `tentarJogada` confere, na ordem: existe peça na origem? É a vez dessa cor? O movimento é permitido para essa peça? O próprio rei fica em xeque?
4. Se tudo estiver certo, a peça é movida no array, o turno troca e o tabuleiro é redesenhado. Se não, aparece um aviso e nada muda.

## Como o xeque funciona

- **Rei em xeque:** alguma peça inimiga consegue chegar à casa do rei.
- **Jogada proibida:** o programa simula a jogada em uma cópia do tabuleiro. Se o próprio rei ficar em xeque nessa cópia, a jogada não vale. Isso resolve também peças "cravadas" e a obrigação de sair do xeque.
- **Xeque-mate:** o jogador não tem nenhuma jogada permitida e está em xeque.
- **Afogamento (empate):** o jogador não tem nenhuma jogada permitida, mas não está em xeque.

## O que está implementado

- Tabuleiro 8x8 com coordenadas e peças em SVG
- Arrastar e soltar, com destaque da peça movimentada
- Movimento de todas as peças e captura
- Turnos alternados
- Xeque, xeque-mate e afogamento
- Promoção do peão (dama, torre, bispo ou cavalo)
- Botão Nova partida

## Ainda não implementado

Roque, en passant e histórico de jogadas.

## Créditos

Imagens das peças: conjunto *cburnett* de Colin M. L. Burnett, distribuído pelo Lichess
(licença GPLv2+). Veja https://github.com/lichess-org/lila/tree/master/public/piece/cburnett
