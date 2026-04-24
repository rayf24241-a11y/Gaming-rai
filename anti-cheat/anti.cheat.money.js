(function () {
  const antiCheat = window.CandyAntiCheat;

  if (!antiCheat) {
    return;
  }

  const state = {
    joinedAt: Date.now(),
    lastPassiveTickAt: Date.now(),
    lastPassiveTotal: 0
  };

  function inspectMoney(snapshot) {
    const now = Date.now();
    const elapsedMs = now - state.joinedAt;

    if (elapsedMs < 30000 && snapshot.totalClicks >= 1000000) {
      antiCheat.trigger("money-scan:first-30s-million");
      return;
    }

    const delta = snapshot.totalClicks - state.lastPassiveTotal;
    const elapsedSeconds = Math.max((now - state.lastPassiveTickAt) / 1000, 0.1);
    const expectedPassive = snapshot.clicksPerSecond * elapsedSeconds;
    const burstAllowance = Math.max(snapshot.clicksPerTap * 20, 300);

    if (delta > expectedPassive + burstAllowance) {
      antiCheat.trigger("money-scan:impossible-growth");
      return;
    }

    state.lastPassiveTickAt = now;
    state.lastPassiveTotal = snapshot.totalClicks;
  }

  window.CandyMoneyAntiCheat = {
    inspectMoney
  };
})();
