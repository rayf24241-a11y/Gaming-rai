const counter = document.getElementById("counter");
const clickerButton = document.getElementById("clickerButton");

let totalClicks = 0;

clickerButton.addEventListener("click", () => {
  totalClicks += 1;
  counter.textContent = totalClicks;
});
