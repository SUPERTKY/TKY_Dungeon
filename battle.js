(() => {
  "use strict";
  const subjectFiles = { math: "./math.json", social: "./social.json", japanese: "./japanese.json", english: "./english.json", science: "./science.json" };
  const subjectNames = { math: "数学", social: "社会", japanese: "国語", english: "英語", science: "理科" };
  let currentSubject = "math";
  let questions = [];
  let questionsLoadError = null;
  async function loadQuestions(subject) {
    const questionsUrl = subjectFiles[subject];
    if (!questionsUrl) throw new Error("教科が見つかりません");
    questionsLoadError = null;
    try {
      const response = await fetch(questionsUrl);
      if (!response.ok) throw new Error(`問題データの読み込みに失敗しました (${response.status})`);
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) throw new Error("問題データが空です");
      questions = data;
      currentSubject = subject;
      return data;
    } catch (error) {
      questionsLoadError = error;
      console.error(error);
      questions = [];
      throw error;
    }
  }
  const frameAssets = {
    horizontal: "./assets/frame_horizontal.png",
    vertical: "./assets/frame_vertical.png",
    square: "./assets/frame.png"
  };
  const defaultFrameType = "horizontal";
  const stageDefaults = { background: "./assets/background.png", music: "./assets/battle1.mp3", playerHp: 100, attackIntervalMs: 20000, damage: 5, answerDamage: 5, wrongAnswerDamage: 5, frameType: "horizontal" };
  const floor2Defaults = { ...stageDefaults, background: "./assets/backgorund2.png", music: "./assets/battle2.mp3", attackIntervalMs: 12000, damage: 12, wrongAnswerDamage: 8 };
  const floor3Defaults = { ...stageDefaults, background: "./assets/background3.png", music: "./assets/battle3.mp3", attackIntervalMs: 9000, damage: 16, wrongAnswerDamage: 10 };
  const stages = [
    { ...stageDefaults, name: "ステージ 1", number: 1, level: 1, monster: "./assets/monster1.png", monsterName: "スライム", monsterHp: 20, questionFilter: { grade: 7, difficulty: 1 } },
    { ...stageDefaults, name: "ステージ 2", number: 2, level: 2, monster: "./assets/kinoko.png", monsterName: "キノコ", monsterHp: 25, questionFilter: { grade: 7, difficulty: 1 } },
    { ...stageDefaults, name: "ステージ 3", number: 3, level: 3, monster: "./assets/ko-mori.png", monsterName: "コウモリ", monsterHp: 30, questionFilter: { grade: 8, difficulty: 1 } },
    { ...stageDefaults, name: "ステージ 4", number: 4, level: 4, monster: "./assets/inosisi.png", monsterName: "イノシシ", monsterHp: 35, damage: 7, questionFilter: { grade: 8, difficulty: 2 } },
    { ...stageDefaults, name: "ステージ 5", number: 5, level: 5, monster: "./assets/goburin.png", monsterName: "ゴブリン", monsterHp: 40, damage: 7, questionFilter: { grade: 9, difficulty: 1 } },
    { ...stageDefaults, name: "ステージ 6", number: 6, level: 6, monster: "./assets/sukeruton.png", monsterName: "スケルトン", monsterHp: 45, attackIntervalMs: 18000, damage: 8, questionFilter: { grade: 9, difficulty: 2 } },
    { ...stageDefaults, name: "ステージ 7", number: 7, level: 7, monster: "./assets/go-suto.png", monsterName: "ゴースト", monsterHp: 50, attackIntervalMs: 16000, damage: 10, questionFilter: { difficulty: 2 } },
    { ...stageDefaults, name: "ステージ 8", number: 8, level: 8, monster: "./assets/monster1.png", monsterName: "スライム", monsterHp: 55, attackIntervalMs: 15000, damage: 10, questionFilter: { difficulty: 2 } },
    { ...stageDefaults, name: "ステージ 9", number: 9, level: 9, monster: "./assets/goburin.png", monsterName: "ゴブリン", monsterHp: 60, attackIntervalMs: 14000, damage: 12, questionFilter: { difficulty: 2 } },
    { ...stageDefaults, name: "ステージ 10", number: 10, level: 10, monster: "./assets/BOSS1.png", monsterName: "ゴブリンキング", monsterHp: 80, attackIntervalMs: 12000, damage: 15, answerDamage: 5, isBoss: true, questionFilter: { difficulty: 2 } },
    { ...floor2Defaults, name: "ステージ 11", number: 11, level: 11, monster: "./assets/faia-go-suto.png", monsterName: "ファイアゴースト", monsterHp: 60, questionFilter: { grade: 7, difficulty: 2 } },
    { ...floor2Defaults, name: "ステージ 12", number: 12, level: 12, monster: "./assets/faiasaramanda-.png", monsterName: "ファイアサラマンダー", monsterHp: 65, questionFilter: { grade: 7, difficulty: 2 } },
    { ...floor2Defaults, name: "ステージ 13", number: 13, level: 13, monster: "./assets/fureimubatto.png", monsterName: "フレイムバット", monsterHp: 70, attackIntervalMs: 11000, questionFilter: { grade: 8, difficulty: 2 } },
    { ...floor2Defaults, name: "ステージ 14", number: 14, level: 14, monster: "./assets/fureimumeizi.png", monsterName: "フレイムメイジ", monsterHp: 75, attackIntervalMs: 11000, damage: 13, questionFilter: { grade: 8, difficulty: 2 } },
    { ...floor2Defaults, name: "ステージ 15", number: 15, level: 15, monster: "./assets/heruhaundo.png", monsterName: "ヘルハウンド", monsterHp: 80, attackIntervalMs: 10000, damage: 14, questionFilter: { grade: 8, difficulty: 2 } },
    { ...floor2Defaults, name: "ステージ 16", number: 16, level: 16, monster: "./assets/magumago-remu.png", monsterName: "マグマゴーレム", monsterHp: 90, attackIntervalMs: 10000, damage: 15, questionFilter: { grade: 9, difficulty: 2 } },
    { ...floor2Defaults, name: "ステージ 17", number: 17, level: 17, monster: "./assets/magumasuraimu.png", monsterName: "マグマスライム", monsterHp: 95, attackIntervalMs: 9000, damage: 15, questionFilter: { grade: 9, difficulty: 2 } },
    { ...floor2Defaults, name: "ステージ 18", number: 18, level: 18, monster: "./assets/BOSS2.png", monsterName: "ヘルボアキング", monsterHp: 130, attackIntervalMs: 8500, damage: 18, answerDamage: 5, wrongAnswerDamage: 10, isBoss: true, questionFilter: { difficulty: 2 } },
    { ...floor3Defaults, name: "ステージ 19", number: 19, level: 19, monster: "./assets/dokukinoko.png", monsterName: "毒キノコ", monsterHp: 100, questionFilter: { grade: 7, difficulty: 2 } },
    { ...floor3Defaults, name: "ステージ 20", number: 20, level: 20, monster: "./assets/foresutobi-.png", monsterName: "フォレストビー", monsterHp: 105, questionFilter: { grade: 7, difficulty: 2 } },
    { ...floor3Defaults, name: "ステージ 21", number: 21, level: 21, monster: "./assets/foresutodeia.png", monsterName: "フォレストディア", monsterHp: 110, attackIntervalMs: 8500, questionFilter: { grade: 8, difficulty: 2 } },
    { ...floor3Defaults, name: "ステージ 22", number: 22, level: 22, monster: "./assets/mani-ta-.png", monsterName: "マンイーター", monsterHp: 115, attackIntervalMs: 8500, damage: 17, questionFilter: { grade: 8, difficulty: 2 } },
    { ...floor3Defaults, name: "ステージ 23", number: 23, level: 23, monster: "./assets/morinogoburin.png", monsterName: "森のゴブリン", monsterHp: 120, attackIntervalMs: 8000, damage: 18, questionFilter: { grade: 8, difficulty: 2 } },
    { ...floor3Defaults, name: "ステージ 24", number: 24, level: 24, monster: "./assets/mosuurufu.png", monsterName: "モスウルフ", monsterHp: 125, attackIntervalMs: 8000, damage: 18, questionFilter: { grade: 9, difficulty: 2 } },
    { ...floor3Defaults, name: "ステージ 25", number: 25, level: 25, monster: "./assets/torento.png", monsterName: "トレント", monsterHp: 135, attackIntervalMs: 7500, damage: 19, questionFilter: { grade: 9, difficulty: 2 } },
    { ...floor3Defaults, name: "ステージ 26", number: 26, level: 26, monster: "./assets/BOSS3.png", monsterName: "ポイズンマッシュキング", monsterHp: 170, attackIntervalMs: 7000, damage: 22, isBoss: true, questionFilter: { difficulty: 2 } }
  ];
  const screen = document.getElementById("battleScreen");
  const title = document.getElementById("mainScreen");
  const form = document.getElementById("answerForm");
  const choices = document.getElementById("answerChoices");
  const enemyArea = document.querySelector(".enemy-area");
  const missEffects = document.getElementById("missEffects");
  const monsterImage = document.getElementById("monsterImage");
  const feedback = document.getElementById("battleFeedback");
  const retry = document.getElementById("battleRetry");
  const gameOverScreen = document.getElementById("gameOverScreen");
  const playerBar = document.getElementById("playerHp");
  const monsterBar = document.getElementById("monsterHp");
  const playerDamageSound = document.getElementById("playerDamageSound");
  const enemyDamageSound = document.getElementById("enemyDamageSound");
  const winSound = document.getElementById("winSound");
  const bossWinSound = document.getElementById("bossWinSound");
  const gameOverSound = document.getElementById("gameOverSound");
  const missSound = document.getElementById("missSound");
  const battleStartSound = document.getElementById("battleStartSound");
  const battleMusic = document.getElementById("battleMusic");
  const countdown = document.getElementById("attackCountdown");
  const startCountdown = document.getElementById("battleStartCountdown");
  const countdownDigit = document.getElementById("battleCountdownDigit");
  const countdownStartImage = document.getElementById("battleCountdownStart");
  const countdownText = document.getElementById("battleCountdownText");
  const framePanel = document.querySelector(".quiz-panel");
  const hitEffectHandlers = new WeakMap();
  const battleAudioSettings = { musicVolume: .42, musicPlaybackRate: 1, startPlaybackRate: 1 };
  let frameRequestId = 0, countdownRunId = 0, gameOverRunId = 0;
  let stage = stages[0], stageIndex = 0, state = null, timer = null, last = null;
  function updateHp() {
    const updateMeter = (meter, value, max) => {
      const percent = Math.max(0, Math.min(100, value / max * 100));
      meter.style.setProperty("--hp-percent", `${percent}%`);
      meter.setAttribute("aria-valuemax", String(max));
      meter.setAttribute("aria-valuenow", String(value));
    };
    updateMeter(playerBar, state.playerHp, stage.playerHp);
    updateMeter(monsterBar, state.monsterHp, stage.monsterHp);
    const playerRatio = state.playerHp / stage.playerHp;
    screen.classList.toggle("low-health", playerRatio > 0 && playerRatio <= .3);
    screen.classList.toggle("critical-health", playerRatio > 0 && playerRatio <= .15);
  }
  function shuffle(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
    }
    return result;
  }
  function questionsForStage(currentStage) {
    const filter = currentStage.questionFilter || {};
    return questions.filter(question =>
      question.type === "choice" &&
      question.subject === currentSubject &&
      (!filter.grade || question.grade === filter.grade) &&
      (!filter.difficulty || question.difficulty === filter.difficulty)
    );
  }
  function preloadImage(source) {
    return new Promise(resolve => {
      const image = new Image();
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", resolve, { once: true });
      image.src = source;
      if (image.complete) resolve();
    });
  }
  function currentQuestion() {
    return state.questionOrder[state.questionIndex];
  }
  function renderStageNumber(number) {
    const stageNumber = String(Math.max(0, Math.trunc(Number(number) || 1)));
    const container = document.querySelector(".stage-display__number");
    container.replaceChildren(...[...stageNumber].map(digit => {
      const image = document.createElement("img");
      image.src = `./assets/${digit}.png`;
      image.alt = "";
      image.draggable = false;
      return image;
    }));
    document.getElementById("stageName").setAttribute("aria-label", `ステージ ${stageNumber}`);
  }
  function showQuestion() {
    const question = currentQuestion();
    document.getElementById("questionText").textContent = question.prompt;
    document.getElementById("questionCategory").textContent = `中${question.grade - 6}・${question.category}`;
    choices.replaceChildren();
    question.choices.forEach(option => {
      const label = document.createElement("label");
      label.className = "answer-choice";
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "answerChoice";
      radio.value = option.id;
      radio.required = true;
      label.append(radio, document.createTextNode(option.text));
      choices.append(label);
    });
  }
  function playHitEffect(element, className) {
    const previousHandler = hitEffectHandlers.get(element);
    if (previousHandler) element.removeEventListener("animationend", previousHandler);
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
    const handler = () => {
      element.classList.remove(className);
      hitEffectHandlers.delete(element);
    };
    hitEffectHandlers.set(element, handler);
    element.addEventListener("animationend", handler, { once: true });
  }
  function playSound(sound) {
    sound.currentTime = 0;
    sound.play().catch(() => {});
  }
  function playBattleStartSound() {
    battleStartSound.playbackRate = battleAudioSettings.startPlaybackRate;
    playSound(battleStartSound);
  }
  function startBattleMusic() {
    battleMusic.volume = battleAudioSettings.musicVolume;
    battleMusic.playbackRate = battleAudioSettings.musicPlaybackRate;
    if (battleMusic.paused) battleMusic.play().catch(() => {});
  }
  function showMissEffects() {
    const count = 3;
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index / count) + (Math.random() - .5) * .8;
      const horizontalRadius = 80 + Math.random() * 65;
      const verticalRadius = 42 + Math.random() * 42;
      const effect = document.createElement("img");
      effect.className = "miss-effect";
      effect.src = "./assets/MISS.png";
      effect.alt = "";
      effect.draggable = false;
      effect.style.setProperty("--x", `${Math.cos(angle) * horizontalRadius}px`);
      effect.style.setProperty("--y", `${Math.sin(angle) * verticalRadius - 10}px`);
      effect.style.setProperty("--rotation", `${(Math.random() - .5) * 24}deg`);
      effect.style.animationDelay = `${index * 45}ms`;
      effect.addEventListener("animationend", () => effect.remove(), { once: true });
      missEffects.append(effect);
    }
  }
  function finish(won) {
    if (!won) {
      void showGameOver();
      return;
    }
    state.running = false; clearInterval(timer); timer = null;
    state.won = won;
    choices.disabled = true; form.querySelector("button").disabled = true;
    const hasNextStage = stageIndex + 1 < stages.length;
    countdown.textContent = won ? (hasNextStage ? "ステージクリア" : "ダンジョンクリア") : "戦闘終了";
    feedback.textContent = won ? (hasNextStage ? "モンスターを倒した！ 次のステージへ進もう！" : "全ステージクリア！ ダンジョンを制覇しました！") : "体力がなくなりました。もう一度挑戦できます。";
    retry.textContent = won ? (hasNextStage ? "次のステージ" : "タイトルへ") : "もう一度";
    retry.hidden = false; retry.focus({ preventScroll: true });
  }
  async function showGameOver() {
    const runId = ++gameOverRunId;
    state.running = false;
    state.won = false;
    clearInterval(timer); timer = null;
    countdownRunId += 1;
    startCountdown.hidden = true;
    choices.disabled = true;
    form.querySelector("button").disabled = true;
    retry.hidden = true;
    missEffects.replaceChildren();
    battleMusic.pause();
    gameOverScreen.hidden = false;
    gameOverSound.currentTime = 0;
    const ended = new Promise(resolve => {
      gameOverSound.addEventListener("ended", resolve, { once: true });
      gameOverSound.addEventListener("error", resolve, { once: true });
    });
    const played = gameOverSound.play();
    if (played) played.catch(() => {});
    await Promise.race([ended, wait(8000)]);
    if (runId !== gameOverRunId || screen.hidden) return;
    returnToTitle();
  }
  async function defeatMonster() {
    const defeatedState = state;
    state.running = false;
    state.won = true;
    clearInterval(timer); timer = null;
    choices.disabled = true;
    form.querySelector("button").disabled = true;
    countdown.textContent = "撃破！";
    feedback.textContent = `${stage.monsterName}を倒した！`;
    playSound(stage.isBoss ? bossWinSound : winSound);
    enemyArea.classList.add("monster-defeated");
    await wait(1350);
    if (state !== defeatedState || screen.hidden) return;
    if (stageIndex + 1 < stages.length) {
      await start(stageIndex + 1, { countdownDelayMs: 500, spawn: true, preservePlayerHp: true });
    } else {
      finish(true);
    }
  }
  function tick(now = performance.now()) {
    if (!state?.running || document.hidden) { last = null; return; }
    if (last !== null) state.remainingMs -= Math.max(0, now - last);
    last = now;
    if (state.remainingMs <= 0) {
      const attacks = Math.floor(-state.remainingMs / stage.attackIntervalMs) + 1;
      state.playerHp = Math.max(0, state.playerHp - attacks * stage.damage);
      state.remainingMs += attacks * stage.attackIntervalMs;
      updateHp(); playHitEffect(screen, "player-hit"); playSound(playerDamageSound);
      feedback.textContent = `${attacks * stage.damage} ダメージを受けた！`;
      if (state.playerHp === 0) { finish(false); return; }
    }
    countdown.textContent = `次の攻撃まで ${Math.ceil(state.remainingMs / 1000)}秒`;
  }
  const wait = duration => new Promise(resolve => setTimeout(resolve, duration));
  async function beginCountdown(delayMs = 0) {
    const runId = ++countdownRunId;
    startCountdown.hidden = false;
    countdownText.textContent = "";
    countdownDigit.hidden = true;
    countdownStartImage.hidden = true;
    startCountdown.setAttribute("aria-label", "戦闘準備中");
    if (delayMs > 0) await wait(delayMs);
    if (runId !== countdownRunId || !state) return;
    playBattleStartSound();
    countdownDigit.hidden = false;
    for (const value of [3, 2, 1]) {
      if (runId !== countdownRunId) return;
      countdownDigit.src = `./assets/${value}.png`;
      startCountdown.setAttribute("aria-label", `${value}`);
      countdownDigit.style.animation = "none";
      void countdownDigit.offsetWidth;
      countdownDigit.style.animation = "";
      await wait(700);
    }
    if (runId !== countdownRunId) return;
    countdownDigit.hidden = true;
    countdownStartImage.hidden = false;
    countdownStartImage.style.animation = "none";
    void countdownStartImage.offsetWidth;
    countdownStartImage.style.animation = "";
    countdownText.textContent = "";
    startCountdown.setAttribute("aria-label", "スタート");
    startBattleMusic();
    await wait(550);
    if (runId !== countdownRunId) return;
    startCountdown.hidden = true;
    countdownStartImage.hidden = true;
    countdownText.textContent = "";
    state.running = true;
    choices.disabled = false;
    form.querySelector("button").disabled = false;
    feedback.textContent = "答えを選んで攻撃しよう。";
    last = performance.now();
    tick(last);
    timer = setInterval(tick, 200);
    choices.querySelector("input")?.focus({ preventScroll: true });
  }
  async function start(index = 0, options = {}) {
    const submitButton = form.querySelector("button");
    submitButton.disabled = true;
    try {
      if (questions.length === 0) await loadQuestions(currentSubject);
      if (questionsLoadError) throw questionsLoadError;
    } catch (error) {
      feedback.textContent = "問題データを読み込めませんでした。ページをWebサーバーから開いてください。";
      submitButton.disabled = false;
      return false;
    }
    clearInterval(timer); timer = null; countdownRunId += 1;
    stageIndex = stages[index] ? index : 0;
    stage = stages[stageIndex];
    const questionOrder = shuffle(questionsForStage(stage));
    if (questionOrder.length === 0) {
      feedback.textContent = "このステージで使用できる問題がありません。";
      submitButton.disabled = false;
      return false;
    }
    await preloadImage(stage.monster);
    useFrame(stage.frameType);
    const playerHp = options.preservePlayerHp && state
      ? Math.max(0, Math.min(stage.playerHp, state.playerHp))
      : stage.playerHp;
    state = { running: false, won: false, playerHp, monsterHp: stage.monsterHp, questionIndex: 0, questionOrder, remainingMs: stage.attackIntervalMs };
    title.hidden = true; title.inert = true; title.style.display = "none";
    window.titleBackground?.stop();
    const titleMusic = document.getElementById("titleMusic");
    titleMusic.pause();
    screen.hidden = false; screen.style.backgroundImage = `url("${stage.background}")`;
    if (battleMusic.dataset.track !== stage.music) {
      battleMusic.pause();
      battleMusic.src = stage.music;
      battleMusic.dataset.track = stage.music;
      battleMusic.load();
    }
    renderStageNumber(stage.number);
    document.getElementById("monsterName").textContent = `${stage.monsterName} Lv.${stage.level}`;
    monsterImage.src = stage.monster; monsterImage.alt = stage.monsterName;
    try { await monsterImage.decode(); } catch {}
    monsterImage.classList.remove("monster-hit", "monster-spawn");
    enemyArea.classList.remove("monster-defeated");
    if (options.spawn) {
      void monsterImage.offsetWidth;
      monsterImage.classList.add("monster-spawn");
      monsterImage.addEventListener("animationend", () => monsterImage.classList.remove("monster-spawn"), { once: true });
    }
    choices.disabled = true; submitButton.disabled = true; retry.hidden = true;
    gameOverScreen.hidden = true;
    countdown.textContent = "戦闘開始まで…";
    feedback.textContent = "準備して…";
    updateHp(); showQuestion();
    beginCountdown(options.countdownDelayMs ?? 150);
    return true;
  }
  async function startDungeon(subject, options = {}) {
    const submitButton = form.querySelector("button");
    submitButton.disabled = true;
    feedback.textContent = `${subjectNames[subject] || "教科"}の問題を読み込んでいます…`;
    try {
      await loadQuestions(subject);
    } catch (error) {
      feedback.textContent = "問題データを読み込めませんでした。ページをWebサーバーから開いてください。";
      submitButton.disabled = false;
      return false;
    }
    return start(0, options);
  }
  function returnToTitle() {
    clearInterval(timer); timer = null; countdownRunId += 1; gameOverRunId += 1; if (state) state.running = false;
    startCountdown.hidden = true;
    countdownDigit.hidden = true;
    countdownStartImage.hidden = true;
    enemyArea.classList.remove("monster-defeated");
    screen.classList.remove("low-health", "critical-health", "player-hit");
    screen.hidden = true; title.hidden = false; title.style.display = ""; title.inert = false;
    document.getElementById("subjectSelect").hidden = true;
    window.titleBackground?.start();
    document.getElementById("titleMusic").play().catch(() => {});
    battleStartSound.pause();
    battleStartSound.currentTime = 0;
    battleMusic.pause();
    battleMusic.currentTime = 0;
    gameOverSound.pause();
    gameOverSound.currentTime = 0;
    gameOverScreen.hidden = true;
    const playButton = document.getElementById("playButton");
    playButton.disabled = false;
    playButton.focus({ preventScroll: true });
  }
  form.addEventListener("submit", event => {
    event.preventDefault(); if (!state?.running) return;
    // Account for the exact answer submission time before resolving combat.
    tick(); if (!state.running) return;
    const question = currentQuestion();
    const selected = choices.querySelector('input[name="answerChoice"]:checked');
    if (!selected) {
      feedback.textContent = "答えを選んでください。";
      choices.querySelector("input")?.focus();
      return;
    }
    const isCorrect = selected.value === question.answer.choiceId;
    if (isCorrect) {
      state.monsterHp = Math.max(0, state.monsterHp - stage.answerDamage);
      updateHp(); playSound(enemyDamageSound);
      if (state.monsterHp === 0) { void defeatMonster(); return; }
      playHitEffect(monsterImage, "monster-hit");
      feedback.textContent = `正解！ モンスターに ${stage.answerDamage} ダメージ！`;
    } else {
      state.playerHp = Math.max(0, state.playerHp - stage.wrongAnswerDamage);
      updateHp();
      playHitEffect(screen, "player-hit");
      showMissEffects();
      playSound(missSound);
      playSound(playerDamageSound);
      feedback.textContent = `不正解！ ${stage.wrongAnswerDamage}ダメージを受けた！`;
      if (state.playerHp === 0) { finish(false); return; }
    }
    state.questionIndex += 1;
    if (state.questionIndex >= state.questionOrder.length) {
      state.questionOrder = shuffle(questionsForStage(stage));
      state.questionIndex = 0;
    }
    showQuestion();
    choices.querySelector("input")?.focus({ preventScroll: true });
  });
  document.addEventListener("game:start", () => start());
  document.getElementById("battleReturn").addEventListener("click", returnToTitle);
  retry.addEventListener("click", () => {
    if (!state?.won) start(stageIndex);
    else if (stageIndex + 1 < stages.length) start(stageIndex + 1, { preservePlayerHp: true });
    else returnToTitle();
  });
  document.addEventListener("visibilitychange", () => { last = document.hidden ? null : performance.now(); });
  window.addEventListener("pagehide", () => { clearInterval(timer); timer = null; battleMusic.pause(); });
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
  window.dungeonBattle = { start, startDungeon, returnToTitle, useFrame, stages, frameAssets, subjectFiles, battleAudioSettings, getState: () => state ? { ...state, subject: currentSubject } : null };
})();
