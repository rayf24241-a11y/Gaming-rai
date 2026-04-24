const counter = document.getElementById("counter");
const clickerButton = document.getElementById("clickerButton");
const perClick = document.getElementById("perClick");
const mintUpgrade = document.getElementById("mintUpgrade");
const mintPrice = document.getElementById("mintPrice");

let totalClicks = 0;
let clicksPerTap = 1;
let mintCost = 25;

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function updateUi() {
  counter.textContent = formatNumber(totalClicks);
  perClick.textContent = `+${formatNumber(clicksPerTap)} per click`;
  mintPrice.textContent = `${formatNumber(mintCost)} clicks`;
  mintUpgrade.disabled = totalClicks < mintCost;
}

clickerButton.addEventListener("click", () => {
  totalClicks += clicksPerTap;
  updateUi();
});

mintUpgrade.addEventListener("click", () => {
  if (totalClicks < mintCost) {
    return;
  }

  totalClicks -= mintCost;
  clicksPerTap += 1;
  mintCost = Math.round(mintCost * 1.75);
  updateUi();
});

updateUi();
