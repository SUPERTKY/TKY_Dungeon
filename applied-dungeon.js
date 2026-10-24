(() => {
  "use strict";
  let dialog, graphHost, mentorHost, activeOptions;
  function normalize(payload) {
    if (payload?.schemaVersion !== 1 || !Array.isArray(payload.questions)) throw new Error("応用問題の形式が不正です");
    return payload.questions.map(q => {
      if (!q.id || !q.question || q.choices?.length !== 4 ||
          !Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex > 3) {
        throw new Error("応用問題の選択肢が不正です");
      }
      return { ...q, type: "choice", subject: "applied", category: q.topic, prompt: q.question,
        choices: q.choices.map((text, index) => ({ id: String(index), text })),
        answer: { choiceId: String(q.answerIndex) }, explanation: q.mentor?.explanation || "" };
    });
  }
  function element(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  }
  function ensureUI() {
    if (graphHost) return;
    graphHost = element("div", undefined, "applied-graph");
    graphHost.id = "appliedGraph";
    mentorHost = element("div", undefined, "applied-mentor");
    mentorHost.id = "appliedMentor";
    document.getElementById("questionText").after(graphHost, mentorHost);
    dialog = element("dialog", undefined, "mentor-dialog");
    dialog.id = "mentorDialog";
    dialog.setAttribute("aria-labelledby", "mentorDialogTitle");
    document.body.append(dialog);
    dialog.addEventListener("close", () => activeOptions?.resume());
  }
  function reset() {
    if (dialog?.open) dialog.close();
    if (graphHost) graphHost.replaceChildren();
    if (mentorHost) mentorHost.replaceChildren();
    activeOptions = null;
  }
  function renderGraph(graph) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 600 340");
    svg.setAttribute("role", "img");
    const make = (tag, attrs, text) => {
      const node = document.createElementNS(ns, tag);
      Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
      if (text !== undefined) node.textContent = text;
      svg.append(node);
      return node;
    };
    make("title", {}, "問題のグラフ");
    make("desc", {}, graph.accessibleDescription);
    const x = graph.xAxis, y = graph.yAxis;
    const px = v => 65 + (v - x.min) / (x.max - x.min) * 505;
    const py = v => 275 - (v - y.min) / (y.max - y.min) * 225;
    make("rect", { x: 0, y: 0, width: 600, height: 340, fill: "#fff" });
    // Keep accessible name and description first; the background has no semantic role.
    for (let v = x.min; v <= x.max + 1e-8; v += x.tickStep) {
      make("line", { x1: px(v), y1: 50, x2: px(v), y2: 275, stroke: "#d9dfeb" });
      make("text", { x: px(v), y: 296, "text-anchor": "middle", "font-size": 14, fill: "#172238" }, String(v));
    }
    for (let v = y.min; v <= y.max + 1e-8; v += y.tickStep) {
      make("line", { x1: 65, y1: py(v), x2: 570, y2: py(v), stroke: "#d9dfeb" });
      make("text", { x: 54, y: py(v) + 5, "text-anchor": "end", "font-size": 14, fill: "#172238" }, String(v));
    }
    const zeroX = px(Math.max(x.min, Math.min(x.max, 0)));
    const zeroY = py(Math.max(y.min, Math.min(y.max, 0)));
    make("line", { x1: 65, y1: zeroY, x2: 570, y2: zeroY, stroke: "#172238", "stroke-width": 2 });
    make("line", { x1: zeroX, y1: 50, x2: zeroX, y2: 275, stroke: "#172238", "stroke-width": 2 });
    make("text", { x: 65, y: 22, "font-size": 15, fill: "#172238" }, y.label + (y.unit ? "（" + y.unit + "）" : ""));
    make("text", { x: 570, y: 326, "text-anchor": "end", "font-size": 15, fill: "#172238" }, x.label + (x.unit ? "（" + x.unit + "）" : ""));
    graph.series.forEach((series, index) => {
      const color = ["#6941ba", "#b84412"][index % 2];
      let points = series.points;
      if (series.type === "quadratic") {
        const {a, b, c} = series.coefficients;
        const [lo, hi] = series.domain;
        points = Array.from({length: 201}, (_, i) => {
          const value = lo + (hi - lo) * i / 200;
          return [value, a * value * value + b * value + c];
        });
      }
      make("polyline", { points: points.map(([a,b]) => px(a) + "," + py(b)).join(" "),
        fill: "none", stroke: color, "stroke-width": 3, "stroke-dasharray": index ? "8 4" : "none" });
      make("text", { x: 320 + index * 130, y: 22, fill: color, "font-size": 15 }, (index ? "破線：" : "実線：") + series.label);
    });
    (graph.annotations || []).forEach(point => {
      make("circle", { cx: px(point.x), cy: py(point.y), r: 5, fill: "#b84412" });
      make("text", { x: px(point.x) + 9, y: py(point.y) - 9, fill: "#172238", "font-size": 15 }, point.label);
    });
    return svg;
  }
  function render(question, options) {
    ensureUI();
    reset();
    activeOptions = options;
    graphHost.hidden = !options.enabled || !question.graph;
    mentorHost.hidden = !options.enabled;
    if (!options.enabled) return;
    if (question.graph) graphHost.append(renderGraph(question.graph));
    const portrait = element("img");
    portrait.src = "./assets/sisyo-.png";
    portrait.alt = "師匠";
    const button = element("button", options.mentorEnabled ? "師匠に聞く" : "師匠を呼ぶ");
    button.type = "button";
    button.id = "mentorHelp";
    button.addEventListener("click", () => {
      if (!options.canHelp() || !options.pause()) return;
      options.mentorEnabled = true;
      button.textContent = "師匠に聞く";
      portrait.hidden = false;
      showLesson(question);
    });
    portrait.hidden = !options.mentorEnabled;
    mentorHost.append(portrait, button);
  }
  function showLesson(question) {
    dialog.replaceChildren();
    const title = element("h2", "師匠の解説");
    title.id = "mentorDialogTitle";
    const portrait = element("img", undefined, "mentor-dialog__portrait");
    portrait.src = "./assets/sisyo-.png";
    portrait.alt = "師匠";
    const content = element("p", "必要な助けを選ぼう。解説の後は、自分で答えを選んで回答してね。");
    content.id = "mentorLesson";
    content.setAttribute("aria-live", "polite");
    let hintIndex = 0;
    const hint = element("button", "ヒントをもらう");
    hint.type = "button";
    hint.addEventListener("click", () => {
      const hints = question.mentor?.hints || [];
      content.textContent = hints[hintIndex++] || "解説を確認して、もう一度考えてみよう。";
      hint.disabled = hintIndex >= hints.length;
    });
    const explain = element("button", "解説を読む");
    explain.type = "button";
    explain.addEventListener("click", () => {
      content.textContent = question.explanation;
      close.textContent = "自分で答えを選ぶ";
    });
    const close = element("button", "問題に戻る");
    close.type = "button";
    close.addEventListener("click", () => dialog.close());
    const actions = element("div", undefined, "mentor-dialog__actions");
    actions.append(hint, explain, close);
    dialog.append(title, portrait, content, actions);
    dialog.showModal();
  }
  window.appliedDungeon = { normalize, render, reset, renderGraph };
})();
