(function () {
  const state = {
    installed: false,
    lastSnapshot: null,
    currentAllowance: null,
    overlay: null,
    tripped: false
  };

  function ensureOverlay() {
    if (state.overlay) {
      return state.overlay;
    }

    const overlay = document.createElement("div");
    overlay.className = "anti-cheat-overlay hidden";
    overlay.innerHTML = [
      '<div class="anti-cheat-panel">',
      "<h2>Anti-Cheat Triggered</h2>",
      "<p>Developer tools or invalid game edits were detected.</p>",
      "<p>Reload the page to continue.</p>",
      "</div>"
    ].join("");
    document.body.appendChild(overlay);
    state.overlay = overlay;
    return overlay;
  }

  function trigger(reason) {
    if (state.tripped) {
      return;
    }

    state.tripped = true;
    console.clear();
    console.warn("Anti-cheat triggered:", reason);
    ensureOverlay().classList.remove("hidden");
    document.documentElement.classList.add("anti-cheat-locked");
  }

  function installEventLocks() {
    document.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });

    document.addEventListener("dragstart", (event) => {
      event.preventDefault();
    });

    document.addEventListener("selectstart", (event) => {
      if (!(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) {
        event.preventDefault();
      }
    });

    window.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      const blockedCombo =
        event.key === "F12" ||
        (event.ctrlKey && event.shiftKey && ["i", "j", "c", "k"].includes(key)) ||
        (event.ctrlKey && ["u", "s"].includes(key));

      if (blockedCombo) {
        event.preventDefault();
        trigger(`blocked-key:${event.key}`);
      }
    });
  }

  function installDevtoolsDetection() {
    window.setInterval(() => {
      if (state.tripped) {
        return;
      }

      const widthGap = window.outerWidth - window.innerWidth;
      const heightGap = window.outerHeight - window.innerHeight;

      if (widthGap > 160 || heightGap > 160) {
        trigger("devtools-window-gap");
      }

      const start = performance.now();
      // A small debugger timing check. When devtools are open, this often pauses.
      // eslint-disable-next-line no-debugger
      debugger;
      const diff = performance.now() - start;

      if (diff > 120) {
        trigger("debugger-delay");
      }
    }, 1200);
  }

  function sanitizeNumber(value) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return null;
    }

    return value;
  }

  function validateSnapshot(snapshot) {
    const clean = {
      totalClicks: sanitizeNumber(snapshot.totalClicks),
      clicksPerTap: sanitizeNumber(snapshot.clicksPerTap),
      clicksPerSecond: sanitizeNumber(snapshot.clicksPerSecond),
      mintCost: sanitizeNumber(snapshot.mintCost),
      blueishCost: sanitizeNumber(snapshot.blueishCost),
      candyDudeOwned: Boolean(snapshot.candyDudeOwned)
    };

    if (Object.values(clean).includes(null)) {
      trigger("invalid-state-shape");
      return;
    }

    if (
      clean.totalClicks < 0 ||
      clean.clicksPerTap < 1 ||
      clean.clicksPerSecond < 0 ||
      clean.mintCost < 1 ||
      clean.blueishCost < 1
    ) {
      trigger("invalid-state-range");
    }

    const previous = state.lastSnapshot;
    const allowance = state.currentAllowance;

    if (previous && allowance) {
      const clickGain = clean.totalClicks - previous.totalClicks;
      const tapGain = clean.clicksPerTap - previous.clicksPerTap;
      const secondGain = clean.clicksPerSecond - previous.clicksPerSecond;
      const mintCostDelta = clean.mintCost - previous.mintCost;
      const blueishCostDelta = clean.blueishCost - previous.blueishCost;

      if (clickGain > allowance.maxGain + 0.001) {
        trigger("too-many-clicks");
      }

      if (clickGain < -allowance.maxSpend - 0.001) {
        trigger("too-much-spend");
      }

      if (tapGain > allowance.maxTapGain + 0.001 || secondGain > allowance.maxSecondGain + 0.001) {
        trigger("illegal-upgrade-gain");
      }

      if (!allowance.allowCostChange && (mintCostDelta !== 0 || blueishCostDelta !== 0)) {
        trigger("illegal-cost-change");
      }

      if (!allowance.allowCandyDudeUnlock && clean.candyDudeOwned !== previous.candyDudeOwned) {
        trigger("illegal-super-unlock");
      }
    } else if (previous && !allowance) {
      const changed =
        clean.totalClicks !== previous.totalClicks ||
        clean.clicksPerTap !== previous.clicksPerTap ||
        clean.clicksPerSecond !== previous.clicksPerSecond ||
        clean.mintCost !== previous.mintCost ||
        clean.blueishCost !== previous.blueishCost ||
        clean.candyDudeOwned !== previous.candyDudeOwned;

      if (changed) {
        trigger("untrusted-state-change");
      }
    }

    state.lastSnapshot = clean;
    state.currentAllowance = null;
  }

  function allowChange(allowance) {
    state.currentAllowance = {
      maxGain: allowance.maxGain || 0,
      maxSpend: allowance.maxSpend || 0,
      maxTapGain: allowance.maxTapGain || 0,
      maxSecondGain: allowance.maxSecondGain || 0,
      allowCostChange: Boolean(allowance.allowCostChange),
      allowCandyDudeUnlock: Boolean(allowance.allowCandyDudeUnlock)
    };
  }

  function install() {
    if (state.installed) {
      return;
    }

    state.installed = true;
    installEventLocks();
    installDevtoolsDetection();

    window.addEventListener("resize", () => {
      if (state.tripped) {
        return;
      }

      const widthGap = window.outerWidth - window.innerWidth;
      const heightGap = window.outerHeight - window.innerHeight;

      if (widthGap > 200 || heightGap > 200) {
        trigger("resize-devtools");
      }
    });

    window.addEventListener("load", () => {
      ensureOverlay();
    });
  }

  window.CandyAntiCheat = {
    install,
    allowChange,
    validateSnapshot,
    isLocked() {
      return state.tripped;
    },
    trigger
  };
})();
