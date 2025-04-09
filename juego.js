const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let rocketX = Math.random() * 260;
let rocketY = -60;
let score = 0;

const rocketImg = new Image();
rocketImg.src = "cohete.png"; // Asegúrate de que exista en la carpeta

rocketImg.onload = () => {
  requestAnimationFrame(gameLoop);
};

function drawRocket() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(rocketImg, rocketX, rocketY, 40, 60); // ancho x alto del cohete
  rocketY += 2;

  if (rocketY > canvas.height) {
    resetRocket();
  }
}

function resetRocket() {
  rocketX = Math.random() * (canvas.width - 40);
  rocketY = -60;
}

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  if (
    clickX >= rocketX &&
    clickX <= rocketX + 40 &&
    clickY >= rocketY &&
    clickY <= rocketY + 60
  ) {
    score++;
    document.getElementById("score").innerText = "Puntuación: " + score;
    resetRocket();
  }
});

function gameLoop() {
  drawRocket();
  requestAnimationFrame(gameLoop);
}
