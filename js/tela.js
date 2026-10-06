// tela.js — desenha o tabuleiro e trata o arrastar e soltar (drag and drop).
// Aqui NÃO tem regra de xadrez: este arquivo só mostra o tabuleiro e avisa o jogo
// (jogo.js) quando uma peça é solta em uma casa.

const elTabuleiro = document.getElementById("tabuleiro");
const elStatus = document.getElementById("status");
const elAviso = document.getElementById("aviso");
const elPromocao = document.getElementById("promocao");

// casas[linha][coluna] guarda o <div> de cada casa
const casas = [];

// Cria as 64 casas (roda uma vez só, no início)
function criarCasas() {
  const letras = "abcdefgh";

  for (let linha = 0; linha < 8; linha++) {
    casas.push([]);

    for (let coluna = 0; coluna < 8; coluna++) {
      const casa = document.createElement("div");

      // Casas claras e escuras se alternam
      if ((linha + coluna) % 2 === 0) {
        casa.className = "casa clara";
      } else {
        casa.className = "casa escura";
      }

      // Guarda a posição da casa dentro do próprio elemento
      casa.setAttribute("data-linha", linha);
      casa.setAttribute("data-coluna", coluna);

      // Coordenadas: números na primeira coluna e letras na última linha
      if (coluna === 0) {
        const numero = document.createElement("span");
        numero.className = "coordenada numero";
        numero.textContent = 8 - linha;
        casa.appendChild(numero);
      }
      if (linha === 7) {
        const letra = document.createElement("span");
        letra.className = "coordenada letra";
        letra.textContent = letras[coluna];
        casa.appendChild(letra);
      }

      // A casa precisa aceitar que soltem uma peça nela
      casa.addEventListener("dragover", aoPassarPorCima);
      casa.addEventListener("drop", aoSoltar);

      elTabuleiro.appendChild(casa);
      casas[linha].push(casa);
    }
  }
}

// Redesenha as peças a partir do array "tabuleiro".
// Regra de ouro: primeiro muda o array, depois chama esta função.
function desenharTabuleiro() {
  for (let linha = 0; linha < 8; linha++) {
    for (let coluna = 0; coluna < 8; coluna++) {
      const casa = casas[linha][coluna];
      const imagemAntiga = casa.querySelector("img");

      // Tira a imagem que estava na casa
      if (imagemAntiga !== null) {
        casa.removeChild(imagemAntiga);
      }
      casa.classList.remove("selecionada");

      // Se o array tem uma peça nessa casa, cria a imagem dela
      const peca = tabuleiro[linha][coluna];
      if (peca !== null) {
        const imagem = document.createElement("img");
        imagem.src = caminhoDaImagem(peca);
        imagem.alt = peca;
        imagem.draggable = true;
        imagem.setAttribute("data-linha", linha);
        imagem.setAttribute("data-coluna", coluna);
        imagem.addEventListener("dragstart", aoComecarArrastar);
        imagem.addEventListener("dragend", aoTerminarArrastar);
        casa.appendChild(imagem);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Drag and drop
// ---------------------------------------------------------------------------

// 1) Começou a arrastar: guarda de qual casa a peça saiu
function aoComecarArrastar(evento) {
  const linha = Number(evento.target.getAttribute("data-linha"));
  const coluna = Number(evento.target.getAttribute("data-coluna"));

  evento.dataTransfer.setData("text/plain", linha + "," + coluna);
  casas[linha][coluna].classList.add("selecionada"); // destaca a peça movimentada
}

// 2) Passando por cima de uma casa: o navegador NÃO deixa soltar em uma <div>,
//    então o preventDefault() é o que libera.
function aoPassarPorCima(evento) {
  evento.preventDefault();
}

// 3) Soltou: descobre a origem e o destino e entrega para o jogo decidir.
//    Este evento NÃO move a peça. Quem move (ou recusa) é a função tentarJogada.
function aoSoltar(evento) {
  evento.preventDefault();

  const partes = evento.dataTransfer.getData("text/plain").split(",");
  const origem = { linha: Number(partes[0]), coluna: Number(partes[1]) };
  const destino = {
    linha: Number(evento.currentTarget.getAttribute("data-linha")),
    coluna: Number(evento.currentTarget.getAttribute("data-coluna"))
  };

  tirarDestaque();

  if (partes.length === 2 && !isNaN(origem.linha) && !isNaN(origem.coluna)) {
    tentarJogada(origem, destino);
  }
}

// 4) Terminou de arrastar (soltando em qualquer lugar): tira o destaque
function aoTerminarArrastar() {
  tirarDestaque();
}

function tirarDestaque() {
  for (let linha = 0; linha < 8; linha++) {
    for (let coluna = 0; coluna < 8; coluna++) {
      casas[linha][coluna].classList.remove("selecionada");
    }
  }
}

// ---------------------------------------------------------------------------
// Mensagens e menu de promoção
// ---------------------------------------------------------------------------

function mostrarStatus(texto) {
  elStatus.textContent = texto;
}

function mostrarAviso(texto) {
  elAviso.textContent = texto;
}

function limparAviso() {
  elAviso.textContent = "";
}

function mostrarMenuPromocao() {
  elPromocao.hidden = false;
}

function esconderMenuPromocao() {
  elPromocao.hidden = true;
}
