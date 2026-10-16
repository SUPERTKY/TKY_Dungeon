# TKY Dungeon

問題JSONを読み込むため、ローカルではプロジェクトのディレクトリで `python3 -m http.server 8000` を実行し、`http://localhost:8000/` をブラウザーで開いてください。ロゴは `assets/Icon.png` を使用します。

## タイミング

- 0〜2秒: 黒画面
- 1.5秒: `assets/title.mp3` の再生を開始（自動再生が禁止された場合は最初の操作時）
- 2〜3.5秒: ロゴがフェードイン
- 3.5秒〜: 下と左右から煙が立ち上がる
- 6.2〜7秒: 霧が完全に不透明になり、画面全体を隠す
- 7.1秒: 霧の裏でスタート画面へ切り替え
- 7.5〜10.7秒: 霧が晴れ、スタート背景が現れる
- 10.8秒: 霧の描画を終了

スタート画面には `assets/start_background.png` を使用します。縦画面では右側の入口を中心に表示します。

煙は外部素材やライブラリーを使わず、WebGL の乱流ノイズで描画します。濃度による透過、細かい渦、陰影を重ね、描画解像度の上限は長辺900pxです。WebGL が使えない場合はCSSの霧に切り替わります。動きを減らす設定では煙を表示しません。

霧が晴れるときは画面全体の一括フェードではなく、奥・中・手前の風速と密度を変えて散逸させます。濃淡と変形を抑え、液体のような太い縞や光沢を避けています。

## タイトル背景のアニメーション

`title-background.js` が固定背景の上に透明Canvasを重ねます。元画像は変更しません。CanvasとCSS背景は1672×941の画像座標、`cover`、横位置50%（縦画面72%）を共有します。UIはCanvasより手前にあり、Canvasは入力を受け取りません。

- 滝：水の内側を多角形で指定し、元の色から水を抽出。境界を内側へ2px削り、最大1.8pxの下方向サンプリングを2層で連続クロスフェードします。
- 川：水域を同様に限定し、横0.55px・縦0.18pxまでの微細な流れを加えます。背景全体は動かしません。
- 青い光：元画像の発光位置だけを色で抽出。元のRGB比率を使う局所加算で、静かに明滅します。入口奥も対象です。
- 木漏れ日：既存の日差しに沿った細いマスク内で、元の明るい暖色部分だけを弱く変化させます。
- 光の粒：初期値7個、元画像上の半径1.0〜1.4px。メニューから離れた森の中をゆっくり漂います。

岩・苔・葉を巻き込まないよう、水のマスクは保守的です。細い滝の縁や、色で水と判別できない反射の一部は静止したままです。元画像の構図と色の保持を優先しています。

### 調整

`title-background.js` 冒頭の `settings` を編集します。各項目の `enabled` がON/OFF、`intensity` が強度です。

```js
const settings = {
  enabled: true,
  speed: 1,
  waterfalls: { enabled: true, intensity: 0.9 },
  river: { enabled: true, intensity: 0.75 },
  blueGlow: { enabled: true, intensity: 0.25 },
  sunbeams: { enabled: true, intensity: 0.065 },
  motes: { enabled: true, intensity: 0.55, count: 7 },
  debugMasks: false,
  maxDpr: 1.5,
  maxPixels: 2073600,
  fps: 30
};
```

開発者コンソールからも調整できます。

```js
titleBackground.settings.waterfalls.enabled = false;
titleBackground.settings.river.intensity = 0.2;
titleBackground.settings.speed = 0.7;
titleBackground.settings.debugMasks = true; // 水=水色、発光=青、木漏れ日=黄色
titleBackground.refresh();

titleBackground.pause();  // 透明Canvasを消し、元画像そのものに戻す
titleBackground.resume(); // 続きの時刻から再開
titleBackground.stop();   // 停止して時刻もリセット。ゲームへ移る際に呼ぶ
titleBackground.start();  // タイトルへ戻る際に呼ぶ
titleBackground.getState(); // 動作状態・画像の表示座標・水マスクの画素数
```

`refresh()` は全体の有効/無効や停止中の設定変更を反映するときに使用します。`maxDpr` / `maxPixels` を変更した場合はリサイズまたはページ再読み込みを行ってください。

描画はrequestAnimationFrameで駆動し、初期設定は最大30fps・約207万画素です。経過秒で動かすため表示FPSで速度が変わりません。タブ非表示中と `prefers-reduced-motion: reduce` では停止し、透明Canvasを消します。再表示時は非表示時間を飛ばさず再開します。Canvasや画像読み込みが利用できなくても固定背景を表示します。

### 検証と範囲

原寸1672×941、PC1280×800、縦画面390×844で停止時の画面が固定背景と画素一致することを確認。マスクの拡大確認、リサイズ、個別ON/OFF、停止・再開、動きを減らす設定を検証しています。元の背景画像ファイルのSHA-256は以下のままです。

`eb47472c3b287a5c83b3cfe3805bdbb6f1f1ba104669322c67bc54bccb79f9c0`

タイトルは `assets/title.png`、Playボタンは `assets/Play.png` を元画像のまま表示します。Playはクリック・タッチ・Enter/Spaceで押せ、ホバー・フォーカス・押下の反応があります。Playを押すと `game:start` イベントを介して学習バトル画面へ進みます。イントロの霧が晴れるまでは `inert` でメニュー操作を抑止します。検証はChromiumで実施しており、Safari等の実機検証は未実施です。

水の元画像がほぼ均一な箇所でも流れが判別できるよう、同じ水マスク内に下向きの細かな濃淡を追加しています。RGB比率を保つ弱い減光で、滝は最大28.8%、川は最大14.25%の局所変化です。スクリプトURLには更新識別子を付け、古いJSのキャッシュが残ることを避けています。

通常の表示でも動きが認識できるよう、滝の濃淡の流れる速度と水面の反射変化を強めています。変形幅とマスク範囲は維持しています。

青い発光は約8秒周期、木漏れ日は約16秒周期で、箇所ごとに位相を変えて明滅します。粒は7個を維持し、小さな淡い光のにじみを加えて見やすくしています。水・背景画像・既存UIは今回の光の調整では変更していません。

## タイトルUI

タイトル画像は上部、Play画像ボタンは下部中央に配置し、縦横画面に対応します。画像自体は加工していません。動きを減らす設定では押下の拡縮演出を省略します。Playを押すと `assets/frame.png` の教科選択画面が開き、数学・社会・国語・英語・理科から挑戦するダンジョンを選べます。

## 学習バトル（仮ステージ）

- Playを押すと `assets/play.mp3` を再生し、暗転後に `assets/background.png` の戦闘画面へフェードします。3・2・1・STARTのカウントダウン後に入力と敵の攻撃タイマーが始まります。
- HPは数値ではなく画像ゲージで表示します。`assets/HPbar.png` を土台に、プレイヤーは `assets/HPgage.png`、モンスターは `assets/HPgage-enemy.png` を前面へ重ね、残量に合わせて縮めます。
- 問題は選択した教科の `math.json`、`social.json`、`japanese.json`、`english.json`、`science.json` から読み込みます。各ステージの学年・難易度に合う4択問題をランダムに出題し、テキスト入力なしで回答できます。
- モンスターは画面中央、プレイヤーHPは左下、問題フレームは中央下に配置します。問題欄は `assets/frame_horizontal.png`、各選択肢は `assets/frame2.png`、回答ボタンは `assets/Answer.png` を使用します。選択肢を選び、画像ボタンまたはEnterで回答できます。
- ステージ1〜7は、スライム、キノコ、コウモリ、イノシシ、ゴブリン、スケルトン、ゴーストの順です。勝利すると「次のステージ」ボタンで進み、後半ほど体力・攻撃力・出題難易度が上がります。
- ステージ11からは炎の第2階層です。背景を `assets/backgorund2.png`、BGMを `assets/battle2.mp3` に切り替え、ファイアゴースト、ファイアサラマンダー、フレイムバット、フレイムメイジ、ヘルハウンド、マグマゴーレム、マグマスライムが登場します。ステージ18のボスは `assets/BOSS2.png` です。
- ステージ19からは森の第3階層です。背景を `assets/background3.png`、BGMを `assets/battle3.mp3` に切り替えます。毒キノコ、フォレストビー、フォレストディア、マンイーター、森のゴブリン、モスウルフ、トレントが登場し、ステージ26のボスは `assets/BOSS3.png` のポイズンマッシュキングです。
- プレイヤー体力は各ステージ100。正解すると敵へ5ダメージ、不正解では即時ダメージを与えず別問題へ切り替えます。全角文字と度記号にも対応します。
- 被弾時は `assets/Damage.mp3` と軽い画面揺れ・赤い縁取りを再生します。HP30%以下では画面端とHPゲージが脈動し、15%以下で速くなります。
- 不正解時は `assets/MISS.png` を敵の周囲へランダムな位置・角度で3枚表示し、`assets/MISS.mp3` を再生します。音声が未配置でも進行は継続します。
- 敵を倒すと `assets/win.mp3` を再生し、敵が震えながらフェードアウトしてから次ステージの敵が自動出現します。`win.mp3` が未配置でも進行は継続します。
- 問題が切り替わっても攻撃までの残り時間はリセットしません。タブ非表示中は戦闘タイマーを一時停止します。
- 勝利・敗北でタイマーと入力を停止します。敗北時は同じステージへ再挑戦でき、最終ステージ26勝利後はタイトルへ戻れます。

ステージごとの変更は `battle.js` の `stages` 配列で行います。背景、モンスター、レベル、体力、攻撃間隔、ダメージ、フレーム種別、問題フィルターをまとめて設定できます。フレーム種別は `horizontal`、`vertical`、`square` のいずれかです。画面の表示は `battle.css` で調整します。

```js
{
  name: "ステージ 1",
  number: 1,
  level: 1,
  background: "./assets/background.png",
  monster: "./assets/monster1.png",
  monsterName: "スライム",
  monsterHp: 20,
  playerHp: 100,
  attackIntervalMs: 20000,
  damage: 5,
  answerDamage: 5,
  questionFilter: { subject: "math", grade: 7, difficulty: 1 }
}
```
