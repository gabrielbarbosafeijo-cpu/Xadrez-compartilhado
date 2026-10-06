// board.js — a parte VISUAL: desenha o tabuleiro, as peças e trata o Drag and Drop.
// Aqui não existem regras de xadrez: este arquivo só mostra o estado e avisa o jogo (game.js)
// quando o jogador solta uma peça.

const LETRAS_DAS_COLUNAS = "abcdefgh";

const elTabuleiro = document.getElementById("tabuleiro");
const elVez = document.getElementById("vez");
const elAviso = document.getElementById("aviso");

// casas[linha][coluna] guarda o <div> de cada casa, para achar rápido na hora de desenhar
const casas = [];

// ---------------------------------------------------------------------------
// 1. Criar as 64 casas (roda uma única vez)
// ---------------------------------------------------------------------------

function criarCasas() {
  elTabuleiro.textContent = "";

  for (let linha = 0; linha < 8; linha++) {
    casas.push([]);

    for (let coluna = 0; coluna < 8; coluna++) {
      const casa = document.createElement("div");
      const ehClara = (linha + coluna) % 2 === 0;

      casa.className = ehClara ? "casa clara" : "casa escura";
      casa.setAttribute("data-linha", linha);
      casa.setAttribute("data-coluna", coluna);

      // Coordenadas: números na coluna "a" e letras na última fileira
      if (coluna === 0) {
        const numero = document.createElement("span");
        numero.className = "coordenada coordenada-linha";
        numero.textContent = 8 - linha;
        casa.appendChild(numero);
      }
      if (linha === 7) {
        const letra = document.createElement("span");
        letra.className = "coordenada coordenada-coluna";
        letra.textContent = LETRAS_DAS_COLUNAS[coluna];
        casa.appendChild(letra);
      }

      // Cada casa pode receber uma peça solta sobre ela
      casa.addEventListener("dragover", aoArrastarSobreCasa);
      casa.addEventListener("drop", aoSoltarNaCasa);

      elTabuleiro.appendChild(casa);
      casas[linha].push(casa);
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Desenhar o estado atual
// ---------------------------------------------------------------------------

function criarImagemDaPeca(peca, linha, coluna) {
  const imagem = document.createElement("img");

  imagem.src = caminhoDaImagem(peca);
  imagem.alt = nomeDaPeca(peca);
  imagem.draggable = true;
  imagem.setAttribute("data-linha", linha);
  imagem.setAttribute("data-coluna", coluna);

  imagem.addEventListener("dragstart", aoComecarArrasto);
  imagem.addEventListener("dragend", aoTerminarArrasto);

  return imagem;
}

// Redesenha tudo a partir da matriz "tabuleiro". Nunca mexemos nas peças direto na tela:
// primeiro muda a matriz, depois chamamos esta função.
function renderizarTabuleiro() {
  for (let linha = 0; linha < 8; linha++) {
    for (let coluna = 0; coluna < 8; coluna++) {
      const casa = casas[linha][coluna];
      const imagemAntiga = casa.querySelector("img");

      if (imagemAntiga !== null) {
        casa.removeChild(imagemAntiga);
      }

      casa.classList.remove("origem-selecionada");

      if (tabuleiro[linha][coluna] !== null) {
        casa.appendChild(criarImagemDaPeca(tabuleiro[linha][coluna], linha, coluna));
      }
    }
  }
}

function renderizarPainel() {
  elVez.textContent = "Vez das " + (jogadorAtual === "white" ? "brancas" : "pretas");
}

// ---------------------------------------------------------------------------
// 3. Drag and Drop
// ---------------------------------------------------------------------------

// dragstart: a peça começou a ser arrastada. Guardamos a ORIGEM dentro do dataTransfer.
function aoComecarArrasto(evento) {
  const linha = Number(evento.target.getAttribute("data-linha"));
  const coluna = Number(evento.target.getAttribute("data-coluna"));

  evento.dataTransfer.setData("text/plain", linha + "," + coluna);
  evento.dataTransfer.effectAllowed = "move";

  casas[linha][coluna].classList.add("origem-selecionada"); // destaque da peça movimentada
}

// dragover: por padrão o navegador NÃO deixa soltar nada em cima de um <div>.
// O preventDefault() é o que libera a casa para receber o drop.
function aoArrastarSobreCasa(evento) {
  evento.preventDefault();
  evento.dataTransfer.dropEffect = "move";
}

// drop: descobre ORIGEM -> DESTINO, mas NÃO executa a jogada.
// Quem decide o que fazer é a lógica do jogo (tentarJogada, em game.js).
function aoSoltarNaCasa(evento) {
  evento.preventDefault();

  const partes = evento.dataTransfer.getData("text/plain").split(",");
  const origem = { linha: Number(partes[0]), coluna: Number(partes[1]) };
  const casaDestino = evento.currentTarget;
  const destino = {
    linha: Number(casaDestino.getAttribute("data-linha")),
    coluna: Number(casaDestino.getAttribute("data-coluna"))
  };

  limparDestaquesDeArrasto();

  // Se o que foi solto não veio de uma peça do tabuleiro, ignora
  if (partes.length !== 2 || isNaN(origem.linha) || isNaN(origem.coluna)) {
    return;
  }

  tentarJogada(origem, destino);
}

// dragend: o arrasto acabou (soltando em qualquer lugar). Limpa o destaque.
function aoTerminarArrasto() {
  limparDestaquesDeArrasto();
}

function limparDestaquesDeArrasto() {
  for (let linha = 0; linha < 8; linha++) {
    for (let coluna = 0; coluna < 8; coluna++) {
      casas[linha][coluna].classList.remove("origem-selecionada");
    }
  }
}

// ---------------------------------------------------------------------------
// 4. Aviso de jogada recusada
// ---------------------------------------------------------------------------

function mostrarAviso(texto) {
  elAviso.textContent = texto;
  elAviso.classList.remove("oculto");
}

function limparAviso() {
  elAviso.textContent = "";
  elAviso.classList.add("oculto");
}
