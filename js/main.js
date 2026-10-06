// main.js — ponto de partida: monta o tabuleiro, liga o botão e começa a primeira partida.
// É o último script carregado, então tudo o que ele usa (board.js, game.js...) já existe.

criarCasas();

document.getElementById("btnNovaPartida").addEventListener("click", novaPartida);

novaPartida();
