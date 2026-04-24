const counter = document.getElementById("counter");
const perClick = document.getElementById("perClick");
const perSecond = document.getElementById("perSecond");
const clickerButton = document.getElementById("clickerButton");
const bucketImage = document.getElementById("bucketImage");
const mintUpgrade = document.getElementById("mintUpgrade");
const blueishUpgrade = document.getElementById("blueishUpgrade");
const candyDudeUpgrade = document.getElementById("candyDudeUpgrade");
const mintPrice = document.getElementById("mintPrice");
const blueishPrice = document.getElementById("blueishPrice");
const candyDudePrice = document.getElementById("candyDudePrice");
const minerCave = document.getElementById("minerCave");
const minerStatus = document.getElementById("minerStatus");
const normalShopTab = document.getElementById("normalShopTab");
const superShopTab = document.getElementById("superShopTab");
const normalShopSection = document.getElementById("normalShopSection");
const superShopSection = document.getElementById("superShopSection");

let totalClicks = 0;
let clicksPerTap = 1;
let clicksPerSecond = 0;
let mintCost = 25;
let blueishCost = 45;
let candyDudeOwned = false;
let audioContext;
let clickHue = 0;

function formatNumber(value) {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(2).replace(/\.?0+$/, "");
}

function updateUi() {
  counter.textContent = formatNumber(totalClicks);
  perClick.textContent = `+${formatNumber(clicksPerTap)} per click`;
  perSecond.textContent = `+${formatNumber(clicksPerSecond)} per second`;
  mintPrice.textContent = `${formatNumber(mintCost)} clicks`;
  blueishPrice.textContent = `${formatNumber(blueishCost)} clicks`;
  candyDudePrice.textContent = candyDudeOwned ? "Owned" : "1000 clicks";

  mintUpgrade.disabled = totalClicks < mintCost;
  blueishUpgrade.disabled = totalClicks < blueishCost;
  candyDudeUpgrade.disabled = candyDudeOwned || totalClicks < 1000;
  candyDudeUpgrade.classList.toggle("is-sold", candyDudeOwned);
}

function switchShop(showSuperShop) {
  normalShopTab.classList.toggle("is-active", !showSuperShop);
  superShopTab.classList.toggle("is-active", showSuperShop);
  normalShopSection.classList.toggle("is-active", !showSuperShop);
  superShopSection.classList.toggle("is-active", showSuperShop);
}

function playClickSound() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;

  if (!AudioCtor) {
    return;
  }

  if (!audioContext) {
    audioContext = new AudioCtor();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();

  oscillator.type = clickHue % 2 === 0 ? "triangle" : "sine";
  oscillator.frequency.setValueAtTime(320 + (clickHue % 6) * 35, now);
  oscillator.frequency.exponentialRampToValueAtTime(520 + (clickHue % 5) * 28, now + 0.08);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1800, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.085, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start(now);
  oscillator.stop(now + 0.18);
  clickHue += 1;
}

function animateShopItemToBucket(button) {
  const sourceImage = button.querySelector(".shop-item-image");

  if (!sourceImage) {
    return;
  }

  const sourceRect = sourceImage.getBoundingClientRect();
  const bucketRect = bucketImage.getBoundingClientRect();
  const flyer = sourceImage.cloneNode(true);

  flyer.className = "buy-flyer";
  flyer.style.left = `${sourceRect.left}px`;
  flyer.style.top = `${sourceRect.top}px`;
  flyer.style.width = `${sourceRect.width}px`;
  flyer.style.opacity = "1";
  flyer.style.transform = "scale(1)";
  document.body.appendChild(flyer);

  sourceImage.classList.add("is-restocking");

  requestAnimationFrame(() => {
    flyer.style.left = `${bucketRect.left + bucketRect.width * 0.35}px`;
    flyer.style.top = `${bucketRect.top + bucketRect.height * 0.2}px`;
    flyer.style.width = `${Math.max(36, sourceRect.width * 0.45)}px`;
    flyer.style.opacity = "0";
    flyer.style.transform = "scale(0.35)";
  });

  window.setTimeout(() => {
    flyer.remove();
    sourceImage.classList.remove("is-restocking");
  }, 700);
}

function buyUpgrade(button, cost, onBuy) {
  if (totalClicks < cost) {
    return false;
  }

  totalClicks -= cost;
  animateShopItemToBucket(button);
  onBuy();
  updateUi();
  return true;
}

function runCandyDudeLoop() {
  if (!candyDudeOwned) {
    return;
  }

  const waitTime = (Math.random() * 4 + 1) * 1000;

  window.setTimeout(() => {
    if (!candyDudeOwned) {
      return;
    }

    const reward = Math.floor(Math.random() * 100) + 1;
    totalClicks += reward;
    minerStatus.textContent = `Candy Dude found ${reward} clicks for you.`;
    updateUi();
    runCandyDudeLoop();
  }, waitTime);
}

clickerButton.addEventListener("click", () => {
  totalClicks += clicksPerTap;
  playClickSound();
  updateUi();
});

mintUpgrade.addEventListener("click", () => {
  buyUpgrade(mintUpgrade, mintCost, () => {
    clicksPerTap += 1;
    mintCost = Math.round(mintCost * 1.75);
  });
});

blueishUpgrade.addEventListener("click", () => {
  buyUpgrade(blueishUpgrade, blueishCost, () => {
    clicksPerSecond += 1;
    blueishCost = Math.round(blueishCost * 1.75);
  });
});

candyDudeUpgrade.addEventListener("click", () => {
  if (candyDudeOwned) {
    return;
  }

  buyUpgrade(candyDudeUpgrade, 1000, () => {
    candyDudeOwned = true;
    minerCave.classList.remove("hidden");
    minerStatus.textContent = "Candy Dude is heading into the cave...";
    runCandyDudeLoop();
  });
});

normalShopTab.addEventListener("click", () => {
  switchShop(false);
});

superShopTab.addEventListener("click", () => {
  switchShop(true);
});

window.setInterval(() => {
  if (clicksPerSecond <= 0) {
    return;
  }

  totalClicks += clicksPerSecond;
  updateUi();
}, 1000);

switchShop(false);
updateUi();
