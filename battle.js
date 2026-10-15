(() => {
  "use strict";
  // Future stages only need to supply new assets, HP, timing and question IDs here.
  const questions = [
    { text: "x + 5 = 8 のとき、x の値は？", answer: 3, label: "方程式" },
    { text: "三角形ABCの ∠A = 40°、∠B = 30° のとき、∠C は何度？", answer: 110, label: "三角形の内角" }
  ];
  const frameAssets = {
    horizontal: "./assets/frame_horizontal.png",
    vertical: "./assets/frame_vertical.png",
    square: "./assets/frame.png"
  };
  const defaultFrameType = "horizontal";
  const stages = [{ name: "ステージ 1", background: "./assets/background.png", monster: "./assets/monster1.png", monsterName: "スライム", monsterHp: 20, playerHp: 100, attackIntervalMs: 20000, damage: 5, answerDamage: 5, frameType: "horizontal", questionIds: [0, 1] }];
  const screen = document.getElementById("battleScreen");
  const title = document.getElementById("mainScreen");
  const form = document.getElementById("answerForm");
  const input = document.getElementById("answerInput");
  const monsterImage = document.getElementById("monsterImage");
  const feedback = document.getElementById("battleFeedback");
  const retry = document.getElementById("battleRetry");
  const playerBar = document.getElementById("playerHp");
  const monsterBar = document.getElementById("monsterHp");
  const countdown = document.getElementById("attackCountdown");
  const framePanel = document.querySelector(".quiz-panel");
  let frameRequestId = 0;
  let stage = stages[0], state = null, timer = null, last = null;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  function updateHp() {
    playerBar.max = stage.playerHp; playerBar.value = state.playerHp;
    monsterBar.max = stage.monsterHp; monsterBar.value = state.monsterHp;
    document.getElementById("playerHpText").textContent = `${state.playerHp} / ${stage.playerHp}`;
    document.getElementById("monsterHpText").textContent = `${state.monsterHp} / ${stage.monsterHp}`;
  }
  function showQuestion() {
    const question = questions[stage.questionIds[state.questionIndex]];
    document.getElementById("questionText").textContent = question.text;
    document.getElementById("questionCategory").textContent = question.label;
    input.value = "";
  }
  function animateDamage(element) {
    if (reduced()) return;
    element.animate([{ transform: "translateX(0)" }, { transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "translateX(0)" }], { duration: 200 });
  }
  function finish(won) {
    state.running = false; clearInterval(timer); timer = null;
    input.disabled = true; form.querySelector("button").disabled = true;
    countdown.textContent = won ? "クリア" : "戦闘終了";
    feedback.textContent = won ? "正解！ モンスターを倒しました！" : "体力がなくなりました。もう一度挑戦できます。";
    retry.hidden = false; retry.focus({ preventScroll: true });
  }
  function tick(now = performance.now()) {
    if (!state?.running || document.hidden) { last = null; return; }
    if (last !== null) state.remainingMs -= Math.max(0, now - last);
    last = now;
    if (state.remainingMs <= 0) {
      const attacks = Math.floor(-state.remainingMs / stage.attackIntervalMs) + 1;
      state.playerHp = Math.max(0, state.playerHp - attacks * stage.damage);
      state.remainingMs += attacks * stage.attackIntervalMs;
      updateHp(); animateDamage(document.querySelector(".player-status"));
      feedback.textContent = `${attacks * stage.damage} ダメージを受けた！`;
      if (state.playerHp === 0) { finish(false); return; }
    }
    countdown.textContent = `次の攻撃まで ${Math.ceil(state.remainingMs / 1000)}秒`;
  }
  function start(index = 0) {
    clearInterval(timer); stage = stages[index] || stages[0];
    useFrame(stage.frameType);
    state = { running: true, playerHp: stage.playerHp, monsterHp: stage.monsterHp, questionIndex: 0, remainingMs: stage.attackIntervalMs };
    title.hidden = true; title.inert = true; title.style.display = "none";
    window.titleBackground?.stop();
    screen.hidden = false; screen.style.backgroundImage = `url("${stage.background}")`;
    document.getElementById("stageName").textContent = stage.name;
    document.getElementById("monsterName").textContent = stage.monsterName;
    monsterImage.src = stage.monster; monsterImage.alt = stage.monsterName;
    input.disabled = false; form.querySelector("button").disabled = false; retry.hidden = true;
    feedback.textContent = "答えを入力して攻撃しよう。";
    updateHp(); showQuestion(); last = performance.now(); tick(last);
    timer = setInterval(tick, 200); input.focus({ preventScroll: true });
  }
  function returnToTitle() {
    clearInterval(timer); timer = null; if (state) state.running = false;
    screen.hidden = true; title.hidden = false; title.style.display = ""; title.inert = false;
    window.titleBackground?.start(); document.getElementById("playButton").focus({ preventScroll: true });
  }
  form.addEventListener("submit", event => {
    event.preventDefault(); if (!state?.running) return;
    // Account for the exact answer submission time before resolving combat.
    tick(); if (!state.running) return;
    const value = input.value.normalize("NFKC").replace(/[\s°度]/g, "");
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)) {
      feedback.textContent = "答えを数値で入力してください。"; input.focus(); return;
    }
    const question = questions[stage.questionIds[state.questionIndex]];
    if (Number(value) === question.answer) {
      state.monsterHp = Math.max(0, state.monsterHp - stage.answerDamage);
      updateHp(); animateDamage(monsterImage);
      if (state.monsterHp === 0) { finish(true); return; }
      feedback.textContent = `正解！ モンスターに ${stage.answerDamage} ダメージ！`;
    } else {
      feedback.textContent = "不正解。別の問題に挑戦しよう！";
    }
    state.questionIndex = (state.questionIndex + 1) % stage.questionIds.length;
    showQuestion(); input.focus({ preventScroll: true });
  });
  document.addEventListener("game:start", () => start());
  document.getElementById("battleReturn").addEventListener("click", returnToTitle);
  retry.addEventListener("click", () => start());
  document.addEventListener("visibilitychange", () => { last = document.hidden ? null : performance.now(); });
  window.addEventListener("pagehide", () => { clearInterval(timer); timer = null; });
  window.addEventListener("pageshow", () => { if (state?.running && !timer) { last = performance.now(); timer = setInterval(tick, 200); } });
  function useFrame(type = defaultFrameType) {
    const requestedType = Object.hasOwn(frameAssets, type) ? type : defaultFrameType;
    const requestedAsset = frameAssets[requestedType];
    const requestId = ++frameRequestId;
    framePanel.dataset.frameType = requestedType;
    framePanel.classList.remove("has-frame");

    function loadFrame(asset, resolvedType, allowFallback) {
      const image = new Image();
      image.addEventListener("load", () => {
        if (requestId !== frameRequestId) return;
        framePanel.dataset.resolvedFrameType = resolvedType;
        framePanel.style.setProperty("--quiz-frame-image", `url("${asset}")`);
        framePanel.classList.add("has-frame");
      }, { once: true });
      image.addEventListener("error", () => {
        if (requestId !== frameRequestId) return;
        if (allowFallback) loadFrame(frameAssets.square, "square", false);
      }, { once: true });
      image.src = asset;
    }

    loadFrame(requestedAsset, requestedType, requestedType !== "square");
  }
  useFrame();
  window.dungeonBattle = { start, returnToTitle, useFrame, stages, frameAssets, getState: () => state ? { ...state } : null };
})();
