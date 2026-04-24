const counter = document.getElementById("counter");
const perClick = document.getElementById("perClick");
const perSecond = document.getElementById("perSecond");
const clickerButton = document.getElementById("clickerButton");
const bucketImage = document.getElementById("bucketImage");
const mintUpgrade = document.getElementById("mintUpgrade");
const blueishUpgrade = document.getElementById("blueishUpgrade");
const chocolateBarUpgrade = document.getElementById("chocolateBarUpgrade");
const chocolateBarImage = document.getElementById("chocolateBarImage");
const chocolateBarName = document.getElementById("chocolateBarName");
const candyDudeUpgrade = document.getElementById("candyDudeUpgrade");
const mintPrice = document.getElementById("mintPrice");
const blueishPrice = document.getElementById("blueishPrice");
const chocolateBarPrice = document.getElementById("chocolateBarPrice");
const chocolateBarEffect = document.getElementById("chocolateBarEffect");
const candyDudePrice = document.getElementById("candyDudePrice");
const minerCave = document.getElementById("minerCave");
const minerStatus = document.getElementById("minerStatus");
const minerTarget = document.getElementById("minerTarget");
const minerSpriteMover = document.getElementById("minerSpriteMover");
const minerSprite = document.getElementById("minerSprite");
const minerImpactRing = document.getElementById("minerImpactRing");
const normalShopTab = document.getElementById("normalShopTab");
const superShopTab = document.getElementById("superShopTab");
const normalShopSection = document.getElementById("normalShopSection");
const superShopSection = document.getElementById("superShopSection");
const antiCheat = window.CandyAntiCheat;
const moneyAntiCheat = window.CandyMoneyAntiCheat;
const LOCAL_PLAYERDATA_KEY = "candyClickerLocalPlayerdata";
const PLAYERDATA_SCHEMA_VERSION = 2;

let totalClicks = 0;
let clicksPerTap = 1;
let clicksPerSecond = 0;
let mintCost = 25;
let blueishCost = 45;
let chocolateBarCost = 100;
let candyDudeOwned = false;
let audioContext;
let clickHue = 0;
let minerWalkStarted = false;
let minerWalkFrameIndex = 0;
let minerWalkPosition = 18;
let minerWalkDirection = 1;
let minerWalkLastTime = 0;

const minerWalkFrames = [
  "/images/animations/candy-dude-walk-1.png",
  "/images/animations/candy-dude-walk-2.png",
  "/images/animations/candy-dude-walk-3.png",
  "/images/animations/candy-dude-walk-2.png"
];

if (!antiCheat || !moneyAntiCheat) {
  document.documentElement.classList.add("anti-cheat-locked");
  document.body.innerHTML = [
    '<div class="anti-cheat-overlay">',
    '<div class="anti-cheat-panel">',
    "<h2>Game Files Missing</h2>",
    "<p>Required anti-cheat files did not load.</p>",
    "<p>Restore the game files and reload.</p>",
    "</div>",
    "</div>"
  ].join("");
  throw new Error("Required anti-cheat modules missing");
}

antiCheat.install();
antiCheat.setResetHandler(() => {
  window.localStorage.removeItem(LOCAL_PLAYERDATA_KEY);
  totalClicks = 0;
  clicksPerTap = 1;
  clicksPerSecond = 0;
  mintCost = 25;
  blueishCost = 45;
  chocolateBarCost = 100;
  candyDudeOwned = false;
});

function formatNumber(value) {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(2).replace(/\.?0+$/, "");
}

function loadLocalPlayerdata() {
  const raw = window.localStorage.getItem(LOCAL_PLAYERDATA_KEY);

  if (!raw) {
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    const saved =
      parsed && typeof parsed === "object" && "version" in parsed
        ? parsed
        : {
            version: 1,
            playerdata: parsed
          };
    const playerdata = saved.playerdata || {};

    if (typeof playerdata.totalClicks === "number" && Number.isFinite(playerdata.totalClicks) && playerdata.totalClicks >= 0) {
      totalClicks = playerdata.totalClicks;
    }

    if (typeof playerdata.clicksPerTap === "number" && Number.isFinite(playerdata.clicksPerTap) && playerdata.clicksPerTap >= 1) {
      clicksPerTap = playerdata.clicksPerTap;
    }

    if (typeof playerdata.clicksPerSecond === "number" && Number.isFinite(playerdata.clicksPerSecond) && playerdata.clicksPerSecond >= 0) {
      clicksPerSecond = playerdata.clicksPerSecond;
    }

    if (typeof playerdata.mintCost === "number" && Number.isFinite(playerdata.mintCost) && playerdata.mintCost >= 1) {
      mintCost = playerdata.mintCost;
    }

    if (typeof playerdata.blueishCost === "number" && Number.isFinite(playerdata.blueishCost) && playerdata.blueishCost >= 1) {
      blueishCost = playerdata.blueishCost;
    }

    if (typeof playerdata.chocolateBarCost === "number" && Number.isFinite(playerdata.chocolateBarCost) && playerdata.chocolateBarCost >= 1) {
      chocolateBarCost = playerdata.chocolateBarCost;
    }

    candyDudeOwned = Boolean(playerdata.candyDudeOwned);
  } catch {
    window.localStorage.removeItem(LOCAL_PLAYERDATA_KEY);
  }
}

function saveLocalPlayerdata() {
  const saveRecord = {
    version: PLAYERDATA_SCHEMA_VERSION,
    playerdata: {
      totalClicks,
      clicksPerTap,
      clicksPerSecond,
      mintCost,
      blueishCost,
      chocolateBarCost,
      candyDudeOwned
    }
  };

  window.localStorage.setItem(LOCAL_PLAYERDATA_KEY, JSON.stringify(saveRecord));
}

function updateUi() {
  const snapshot = {
    totalClicks,
    clicksPerTap,
    clicksPerSecond,
    mintCost,
    blueishCost,
    chocolateBarCost,
    candyDudeOwned
  };

  antiCheat.validateSnapshot(snapshot);
  moneyAntiCheat.inspectMoney(snapshot);

  const chocolateBarUnlocked = blueishCost > 45;

  counter.textContent = formatNumber(totalClicks);
  perClick.textContent = `+${formatNumber(clicksPerTap)} per click`;
  perSecond.textContent = `+${formatNumber(clicksPerSecond)} per second`;
  mintPrice.textContent = `${formatNumber(mintCost)} clicks`;
  blueishPrice.textContent = `${formatNumber(blueishCost)} clicks`;
  chocolateBarName.textContent = chocolateBarUnlocked ? "Chocolate Bar" : "?";
  chocolateBarPrice.textContent = chocolateBarUnlocked ? `${formatNumber(chocolateBarCost)} clicks` : "?";
  chocolateBarEffect.textContent = chocolateBarUnlocked ? "+3 clicks per click" : "?";
  chocolateBarImage.alt = chocolateBarUnlocked ? "Chocolate bar upgrade item" : "Unknown upgrade item";
  candyDudePrice.textContent = candyDudeOwned ? "Owned" : "1000 clicks";

  mintUpgrade.disabled = totalClicks < mintCost;
  blueishUpgrade.disabled = totalClicks < blueishCost;
  chocolateBarUpgrade.disabled = !chocolateBarUnlocked || totalClicks < chocolateBarCost;
  chocolateBarUpgrade.classList.toggle("is-locked", !chocolateBarUnlocked);
  candyDudeUpgrade.disabled = candyDudeOwned || totalClicks < 1000;
  candyDudeUpgrade.classList.toggle("is-sold", candyDudeOwned);
  saveLocalPlayerdata();
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

function triggerMinerImpact() {
  minerTarget.classList.remove("is-hit");
  minerImpactRing.classList.remove("is-active");

  // Force restart of the CSS animations.
  void minerTarget.offsetWidth;

  minerTarget.classList.add("is-hit");
  minerImpactRing.classList.add("is-active");

  window.setTimeout(() => {
    minerTarget.classList.remove("is-hit");
    minerImpactRing.classList.remove("is-active");
  }, 450);
}

function animateSuperShopArrival(button, onComplete) {
  const sourceImage = button.querySelector(".shop-item-image");

  if (!sourceImage) {
    onComplete();
    return;
  }

  const sourceRect = sourceImage.getBoundingClientRect();
  const targetRect = minerSprite.getBoundingClientRect();
  const flyer = sourceImage.cloneNode(true);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const pathPoints = [
    { left: vw * 0.18, top: vh * 0.24, scale: 1.2, rotate: -18 },
    { left: vw * 0.68, top: vh * 0.16, scale: 1.05, rotate: 22 },
    { left: vw * 0.38, top: vh * 0.72, scale: 1.12, rotate: -12 },
    { left: vw * 0.6, top: vh * 0.44, scale: 0.92, rotate: 14 },
    {
      left: targetRect.left + targetRect.width * 0.18,
      top: targetRect.top + targetRect.height * 0.04,
      scale: 0.78,
      rotate: 0
    }
  ];

  flyer.className = "buy-flyer buy-flyer-super";
  flyer.style.left = `${sourceRect.left}px`;
  flyer.style.top = `${sourceRect.top}px`;
  flyer.style.width = `${sourceRect.width}px`;
  flyer.style.opacity = "1";
  flyer.style.transform = "scale(1) rotate(0deg)";
  document.body.appendChild(flyer);

  sourceImage.classList.add("is-restocking");

  let index = 0;

  function moveNext() {
    const point = pathPoints[index];

    flyer.style.transition =
      index === pathPoints.length - 1
        ? "left 360ms cubic-bezier(0.15, 0.85, 0.2, 1), top 360ms cubic-bezier(0.15, 0.85, 0.2, 1), transform 360ms cubic-bezier(0.15, 0.85, 0.2, 1), opacity 360ms ease"
        : "left 300ms ease-in-out, top 300ms ease-in-out, transform 300ms ease-in-out";
    flyer.style.left = `${point.left}px`;
    flyer.style.top = `${point.top}px`;
    flyer.style.transform = `scale(${point.scale}) rotate(${point.rotate}deg)`;

    if (index === pathPoints.length - 1) {
      flyer.style.opacity = "0";
      window.setTimeout(() => {
        flyer.remove();
        sourceImage.classList.remove("is-restocking");
        triggerMinerImpact();
        onComplete();
      }, 380);
      return;
    }

    index += 1;
    window.setTimeout(moveNext, 320);
  }

  requestAnimationFrame(() => {
    moveNext();
  });
}

function updateMinerSpriteVisual() {
  minerSpriteMover.style.transform = `translateX(${minerWalkPosition}px) scaleX(${minerWalkDirection})`;
  minerSprite.src = minerWalkFrames[minerWalkFrameIndex];
}

function runMinerWalkFrame(now) {
  if (!candyDudeOwned) {
    minerWalkStarted = false;
    minerSprite.src = "/images/animations/candy-dude-idle.png";
    minerSpriteMover.style.transform = `translateX(${minerWalkPosition}px) scaleX(${minerWalkDirection})`;
    return;
  }

  if (!minerWalkLastTime) {
    minerWalkLastTime = now;
  }

  const dt = now - minerWalkLastTime;

  if (dt >= 150) {
    const trackWidth = Math.max(minerTarget.clientWidth - minerSpriteMover.offsetWidth - 10, 20);
    const minX = 8;
    const maxX = trackWidth;

    minerWalkFrameIndex = (minerWalkFrameIndex + 1) % minerWalkFrames.length;
    minerWalkPosition += minerWalkDirection * 6;

    if (minerWalkPosition >= maxX) {
      minerWalkPosition = maxX;
      minerWalkDirection = -1;
    } else if (minerWalkPosition <= minX) {
      minerWalkPosition = minX;
      minerWalkDirection = 1;
    }

    updateMinerSpriteVisual();
    minerWalkLastTime = now;
  }

  window.requestAnimationFrame(runMinerWalkFrame);
}

function startMinerWalk() {
  if (minerWalkStarted) {
    return;
  }

  minerWalkStarted = true;
  minerWalkLastTime = 0;
  minerWalkFrameIndex = 0;
  updateMinerSpriteVisual();
  window.requestAnimationFrame(runMinerWalkFrame);
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
    antiCheat.allowChange({
      maxGain: reward
    });
    totalClicks += reward;
    minerStatus.textContent = `Candy Dude found ${reward} clicks for you.`;
    updateUi();
    runCandyDudeLoop();
  }, waitTime);
}

clickerButton.addEventListener("click", () => {
  if (antiCheat.isLocked()) {
    return;
  }

  antiCheat.allowChange({
    maxGain: clicksPerTap,
    maxTapGain: 0,
    maxSecondGain: 0
  });
  totalClicks += clicksPerTap;
  playClickSound();
  updateUi();
});

mintUpgrade.addEventListener("click", () => {
  if (antiCheat.isLocked()) {
    return;
  }

  antiCheat.allowChange({
    maxSpend: mintCost,
    maxTapGain: 1,
    allowCostChange: true
  });

  buyUpgrade(mintUpgrade, mintCost, () => {
    clicksPerTap += 1;
    mintCost = Math.round(mintCost * 1.75);
  });
});

blueishUpgrade.addEventListener("click", () => {
  if (antiCheat.isLocked()) {
    return;
  }

  antiCheat.allowChange({
    maxSpend: blueishCost,
    maxSecondGain: 1,
    allowCostChange: true
  });

  buyUpgrade(blueishUpgrade, blueishCost, () => {
    clicksPerSecond += 1;
    blueishCost = Math.round(blueishCost * 1.75);
  });
});

chocolateBarUpgrade.addEventListener("click", () => {
  if (antiCheat.isLocked()) {
    return;
  }

  antiCheat.allowChange({
    maxSpend: chocolateBarCost,
    maxTapGain: 3,
    allowCostChange: true
  });

  buyUpgrade(chocolateBarUpgrade, chocolateBarCost, () => {
    clicksPerTap += 3;
    chocolateBarCost = Math.round(chocolateBarCost * 1.75);
  });
});

candyDudeUpgrade.addEventListener("click", () => {
  if (antiCheat.isLocked() || candyDudeOwned) {
    return;
  }

  if (totalClicks < 1000) {
    return;
  }

  antiCheat.allowChange({
    maxSpend: 1000,
    allowCandyDudeUnlock: true
  });

  totalClicks -= 1000;
  candyDudeOwned = true;
  minerCave.classList.remove("hidden");
  minerStatus.textContent = "Candy Dude is flying into his base...";
  updateUi();

  animateSuperShopArrival(candyDudeUpgrade, () => {
    minerStatus.textContent = "Candy Dude landed in the base.";
    startMinerWalk();
    updateUi();
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
  if (antiCheat.isLocked() || clicksPerSecond <= 0) {
    return;
  }

  antiCheat.allowChange({
    maxGain: clicksPerSecond
  });

  totalClicks += clicksPerSecond;
  updateUi();
}, 1000);

loadLocalPlayerdata();

if (candyDudeOwned) {
  minerCave.classList.remove("hidden");
  minerStatus.textContent = "Candy Dude is back at work.";
  startMinerWalk();
  runCandyDudeLoop();
}

switchShop(false);
updateUi();
