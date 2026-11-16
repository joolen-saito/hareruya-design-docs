/**
 * F06-06 購入履歴一覧（続き）。正本: cases/F06-06_test_cases.tsv
 * 先の spec（f06-06.spec.ts）に無かったケースのうち、注文を画面とDBで整えて確かめるもの。シードは seeds/f06-06-orders.ts。
 * 実装しないケース: 007・008・009（注文を51件・12001件作る大量データ）、020〜022（再購入の要求を開発者ツールで取得して再送する。購入履歴一覧に再購入の要求を出す画面が無い）、
 *   028（受注一覧の一括操作領域に対応状況を変える選択欄が見つからない）。
 * 処理状態は、現行の画面では文字の札（地の色つき）で表示される。正本が照らす別添資料は、設計書 0304 のシート「別添資料_注文ステータスと表示画像の紐付け」
 * （BOステータスごとのフロント表示画像9枚。画像は文言と地の色の札）。期待結果が別添資料の画像を求めるケース（014・027・031〜041・047・048）は、
 * 画面の札の文言と地の色を、別添資料の画像の文言と地の色に照らす（下の 別添資料）。010 は処理状態が表示されることだけを求めるので、表示されたことを確かめる。
 */
import { Locator, test } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../../config/env";
import { CaseBody, CaseCtx, caseTest, expect } from "../../lib/case";
import { 別のブラウザの画面を印つきで撮る, scene } from "../../lib/evidence_other";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import { OrderEditPage } from "../../pages/admin/m05_11_order_edit";
import { expectSaved } from "../../pages/admin/common";
import { 本店の店名 } from "../../pages/admin/m05_admin_member";
import { LoginPage } from "../../pages/front/f06_03_login";
import { HistoryListPage } from "../../pages/front/f06_06_history";
import { mailOf } from "../../seeds/f06-06";
import { 高松店名, 本店名, pw, レシートNo, 注文 } from "../../seeds/f06-06-orders";

const note = (type: string, m: string) => { test.info().annotations.push({ type, description: m }); };
const 画像の注記 = "処理状態は、現行の画面では文字のラベルで表示される。期待結果は処理状態が表示されることを求めるので、表示されたこと（ラベルの文字または画像がある）を確かめ、表示された内容を記録した";

/**
 * 別添資料（設計書 0304「別添資料_注文ステータスと表示画像の紐付け」の C2〜C10 の画像）の、BOステータスごとのフロント表示画像の文言と地の色。
 * 画像の地の色は、橙 rgb(226,112,0)（ピック中〜店頭予約の6枚）・黒 rgb(29,29,29)（出荷完了・購入済み）・灰 rgb(106,106,106)（キャンセル）。
 */
type 地の色 = "橙" | "黒" | "灰";
const 別添資料: Record<string, { 文言: string; 色: 地の色 }> = {
  ピック中: { 文言: "出荷準備", 色: "橙" },
  入金待ち: { 文言: "入金待ち", 色: "橙" },
  入金済み: { 文言: "出荷準備", 色: "橙" },
  ピック完了: { 文言: "ご来店待ち", 色: "橙" },
  出荷指示: { 文言: "出荷準備", 色: "橙" },
  店頭予約: { 文言: "予約済み", 色: "橙" },
  出荷完了: { 文言: "出荷完了", 色: "黒" },
  購入済み: { 文言: "受け取り済み", 色: "黒" },
  キャンセル: { 文言: "キャンセル", 色: "灰" },
};
const 別添資料の地の色: Record<地の色, [number, number, number]> = { 橙: [226, 112, 0], 黒: [29, 29, 29], 灰: [106, 106, 106] };
/**
 * 画面の処理状態の札の地の色（画面の札はこの3色のどれかで出る）。それぞれを、別添資料の画像の地の色のうち最も近い色に当てる。
 * 当て方が崩れていないこと（画面の色が、当てた別添資料の色にいちばん近いこと）は、読み込み時に確かめる。
 */
const 画面の札の地の色: Record<地の色, string> = { 橙: "rgb(230, 123, 0)", 黒: "rgb(31, 31, 31)", 灰: "rgb(118, 118, 117)" };
for (const [名, css] of Object.entries(画面の札の地の色) as [地の色, string][]) {
  const c = (css.match(/\d+/g) ?? []).map(Number);
  const 近い = (Object.entries(別添資料の地の色) as [地の色, number[]][])
    .map(([n, d]) => ({ n, 距離: d.reduce((a, v, i) => a + (v - c[i]) ** 2, 0) }))
    .sort((a, b) => a.距離 - b.距離)[0].n;
  if (近い !== 名) throw new Error(`画面の札の色 ${css} は、別添資料の画像の「${名}」ではなく「${近い}」に近い（当て方を見直す）`);
}
const 色の名前 = (css: string) => (Object.entries(画面の札の地の色).find(([, v]) => v === css)?.[0] ?? css);
const 別添資料の注記 = "期待結果の「別添資料で対応付けられたフロント表示画像」は、設計書 0304 のシート「別添資料_注文ステータスと表示画像の紐付け」の画像（文言と地の色の札）。"
  + "画面は処理状態を文字の札で出すので、札の文言と地の色を、BOステータスに対応付けられた画像の文言と地の色に照らした"
  + "（地の色は、画面の札の色 橙 rgb(230,123,0)・黒 rgb(31,31,31)・灰 rgb(118,118,117) を、別添資料の画像の 橙 rgb(226,112,0)・黒 rgb(29,29,29)・灰 rgb(106,106,106) に当てた）";

/**
 * 行の処理状態を、別添資料のBOステータスの画像（文言と地の色）と照らすための組（BOステータスは正本の名前。購入済み など）。
 * 呼んだ側は、札の文字を 文言 と（toHaveText）、札の地の色を 色を確かめる() で（実行結果に色の名前「橙・黒・灰」が出るよう、色の名前で比べる）確かめ、結果() を注記に残す
 */
function 別添資料の照らし(h: HistoryListPage, 行: Locator, BO: string, 名前: string) {
  const 期待 = 別添資料[BO];
  if (!期待) throw new Error(`BOステータス「${BO}」は別添資料に無い`);
  const 札 = h.処理状態の札(行);
  return {
    札, 文言: 期待.文言, 地の色: 画面の札の地の色[期待.色],
    文言の項目: `${名前}の処理状態が、別添資料でBOステータス「${BO}」に対応付けられた画像の文言「${期待.文言}」で表示されること`,
    色の項目: `${名前}の処理状態の地の色が、別添資料でBOステータス「${BO}」に対応付けられた画像と同じ${期待.色}であること`,
    色を確かめる: async () => {
      const css = (await 札.count()) === 0 ? "" : await 札.first().evaluate((e) => getComputedStyle(e).backgroundColor);
      expect.soft(css === "" ? "（文字の札が無い）" : 色の名前(css), `${名前}の処理状態の地の色が、別添資料でBOステータス「${BO}」に対応付けられた画像と同じ${期待.色}であること`).toBe(期待.色);
    },
    結果: async () => {
      const 実際 = (await 札.count()) === 0 ? "（文字の札が無い）" : `${((await 札.innerText()) ?? "").trim()}・${色の名前(await 札.evaluate((e) => getComputedStyle(e).backgroundColor))}`;
      return `${BO}→別添資料「${期待.文言}・${期待.色}」／画面「${実際}」`;
    },
  };
}
const 商品の注記 = "シード表の商品名（結合商品Aなど）の商品は作らず、注文した既存の販売中の商品の名前で確かめる（共有の商品に試験の値を足さない）";
const 日付の注記 = "シード表の固定の値（注文ID・注文番号・会員ID）は、画面が振った値に読み替えて確かめる";

async function ログイン(c: CaseCtx, 前半: string, パスワード: string): Promise<void> {
  const l = new LoginPage(c.page);
  await l.ログイン画面を開く();
  await l.ログインする(mailOf(前半), パスワード);
}
function 履歴(c: CaseCtx) { return new HistoryListPage(c.page); }
function 状態の文(s: { 文: string; 画像: string[] }): string { return [s.文, ...s.画像].filter(Boolean).join(" / "); }
const 詳細のパス = (id: string) => `/ja/mypage/shopping_history_detail/${id}`;

// ---------------------------------------------------------------- 010 EC注文の表示項目
caseTest("IT-F06-06-010", async (c) => {
  note("手順の注記", 商品の注記);
  const { step, expected, notes } = c;
  const h = 履歴(c);
  let 行!: Locator;
  const 番号 = () => notes.get("〔注文番号-F0606-010〕");
  await step(1, async () => { await ログイン(c, "display-f0606-010", pw("010")); });
  await step(2, async () => { await h.開く(); });
  await step(3, async () => { 行 = h.行(番号()); await expect(行).toHaveCount(1); });
  await expected(async () => {
    expect.soft((await h.項目(行, "注文日")).文, "注文日").toBe("2026/1/10");
    expect.soft((await h.項目(行, "店舗")).文, "店舗").toBe("オンラインショップ");
    const 内容 = (await h.項目(行, "注文内容")).文;
    for (const 名 of 注文("010").商品名) expect.soft(内容, `注文内容に商品名「${名}」`).toContain(名);
    expect.soft((await h.項目(行, "注文金額合計")).文, "注文が保持する注文金額合計（9999円）").toContain("9,999");
    // 支払方法「クレジットカード」は手元の支払方法マスタに無く、シードは「クレジットカード決済」を設定した（S-F06-06-MASTER・DISPLAY-010 の注記）。注文が持つ値で確かめる
    const 支払 = 注文("010").支払方法;
    note("手順の注記", `支払方法は、正本の「クレジットカード」が手元の支払方法マスタに無いので、シードが注文に設定した「${支払}」が表示されることで確かめた`);
    expect.soft(支払, "シードが注文に設定した支払方法がクレジットカードの支払方法である").toContain("クレジットカード");
    expect.soft((await h.項目(行, "支払方法")).文, `支払方法（注文が持つ「${支払}」）`).toBe(支払);
    const s = await h.処理状態(行);
    note("手順の注記", `${画像の注記}。表示: ${状態の文(s)}`);
    expect.soft(s.表示, "処理状態が表示される").toBe(true);
  });
});

// ---------------------------------------------------------------- 011・039〜041 店頭受取注文の行（店頭受取受注）
function 店頭受取の行(前半: string, パスワード: string, n: string, 日: string | null, BO: string): CaseBody {
  return async (c) => {
    note("手順の注記", 日付の注記);
    note("手順の注記", 別添資料の注記);
    const { step, expected, notes } = c;
    const h = 履歴(c);
    let 行!: Locator;
    await step(1, async () => { await ログイン(c, 前半, パスワード); });
    await step(2, async () => { await h.開く(); });
    await step(3, async () => { 行 = h.行(notes.get(`〔注文番号-F0606-${n}〕`)); await expect(行).toHaveCount(1); });
    await expected(async () => {
      const o = 注文(n);
      expect.soft((await h.項目(行, "注文日")).文, "注文日").toBe(日 ?? notes.get(`〔注文日-F0606-${n}〕`));
      expect.soft((await h.項目(行, "店舗")).文, "受取店舗名").toBe(o.店名);
      expect.soft(await h.注文番号のリンク(行).innerText(), "リンクとして表示された注文番号").toBe(o.番号);
      const x = 別添資料の照らし(h, 行, BO, "注文の行");
      await expect.soft(x.札, x.文言の項目).toHaveText(x.文言);
      await x.色を確かめる();
      note("手順の注記", `処理状態: ${await x.結果()}`);
      note("手順の注記", `注文の種類の裏づけ（照会）: この注文の配送方法は「${注文(n).配送方法}」`);
    });
  };
}
// BOステータスは正本の事前準備のとおり（シード seeds/f06-06-orders.ts の 組合せ と同じ）
caseTest("IT-F06-06-039", 店頭受取の行("cbf0606-039", "Passw0rd-CBF0606039", "039", null, "ピック中"));
caseTest("IT-F06-06-040", 店頭受取の行("cbf0606-040", "Passw0rd-CBF0606040", "040", null, "ピック完了"));
caseTest("IT-F06-06-041", 店頭受取の行("cbf0606-041", "Passw0rd-CBF0606041", "041", null, "購入済み"));

// ---------------------------------------------------------------- 031〜038・047・048 EC・スムーズ店頭受取の行
function オンライン店舗の行(n: string, BO: string): CaseBody {
  return async (c) => {
    note("手順の注記", 日付の注記);
    note("手順の注記", 別添資料の注記);
    const { step, expected, notes } = c;
    const h = 履歴(c);
    let 行!: Locator;
    await step(1, async () => { await ログイン(c, `cbf0606-${n}`, `Passw0rd-CBF0606${n}`); });
    await step(2, async () => { await h.開く(); });
    await step(3, async () => { 行 = h.行(notes.get(`〔注文番号-F0606-${n}〕`)); await expect(行).toHaveCount(1); });
    await expected(async () => {
      const 番号 = notes.get(`〔注文番号-F0606-${n}〕`);
      expect.soft((await h.項目(行, "注文日")).文, "注文日").toBe(notes.get(`〔注文日-F0606-${n}〕`));
      expect.soft((await h.項目(行, "店舗")).文, "店舗").toBe("オンラインショップ");
      const link = h.注文番号のリンク(行);
      expect.soft(await link.innerText(), "リンクとして表示された注文番号").toBe(番号);
      expect.soft(await link.getAttribute("href"), "注文番号のリンク先").toContain(詳細のパス(注文(n).ID));
      const x = 別添資料の照らし(h, 行, BO, "注文の行");
      await expect.soft(x.札, x.文言の項目).toHaveText(x.文言);
      await x.色を確かめる();
      note("手順の注記", `処理状態: ${await x.結果()}`);
      note("手順の注記", `注文の種類の裏づけ（照会）: この注文の配送方法は「${注文(n).配送方法}」`);
    });
  };
}
// BOステータスは正本の事前準備のとおり（シード seeds/f06-06-orders.ts の 組合せ と同じ）
caseTest("IT-F06-06-031", オンライン店舗の行("031", "出荷指示"));
caseTest("IT-F06-06-032", オンライン店舗の行("032", "出荷完了"));
caseTest("IT-F06-06-033", オンライン店舗の行("033", "キャンセル"));
caseTest("IT-F06-06-034", オンライン店舗の行("034", "ピック完了"));
caseTest("IT-F06-06-035", オンライン店舗の行("035", "出荷指示"));
caseTest("IT-F06-06-036", オンライン店舗の行("036", "店頭予約"));
caseTest("IT-F06-06-037", オンライン店舗の行("037", "購入済み"));
caseTest("IT-F06-06-038", オンライン店舗の行("038", "キャンセル"));
caseTest("IT-F06-06-047", オンライン店舗の行("047", "入金待ち"));
caseTest("IT-F06-06-048", オンライン店舗の行("048", "入金済み"));

// ---------------------------------------------------------------- 013・026・042 スマレジ取引だけの行
function スマレジ取引の行(n: string, 前半: string, パスワード: string, レシート: string, 購入日: string, 状態を見る: boolean): CaseBody {
  return async (c) => {
    note("手順の注記", `${日付の注記}。${商品の注記}`);
    const { step, expected } = c;
    const h = 履歴(c);
    let 行!: Locator;
    await step(1, async () => { await ログイン(c, 前半, パスワード); });
    await step(2, async () => { await h.開く(); });
    await step(3, async () => { 行 = h.行(レシート); await expect(行).toHaveCount(1); });
    await expected(async () => {
      const o = 注文(n);
      if (!状態を見る) {
        const s = await h.処理状態(行);
        expect.soft(s.表示, "BOステータスに対応する処理状態の表示（画像）が表示されない").toBe(false);
        return;
      }
      expect.soft((await h.項目(行, "購入日")).文, "購入日").toBe(購入日);
      expect.soft((await h.項目(行, "店舗")).文, "受取店舗名").toBe(o.店名);
      expect.soft((await h.項目(行, "レシートNo")).文, "レシート番号").toBe(レシート);
      const 内容 = (await h.項目(行, "購入内容")).文;
      for (const 名 of o.商品名) expect.soft(内容, `購入内容に商品名「${名}」`).toContain(名);
      expect.soft((await h.項目(行, "支払方法")).文, "支払方法").toBe("店頭支払");
      expect.soft((await h.項目(行, "注文番号")).有, "注文番号が表示されない").toBe(false);
      expect.soft((await h.処理状態(行)).表示, "処理状態が表示されない").toBe(false);
    });
  };
}
caseTest("IT-F06-06-013", スマレジ取引の行("013", "display-f0606-013", pw("013"), "R060600000013", "2026/4/1", true));
caseTest("IT-F06-06-026", スマレジ取引の行("026", "smcancel-f0606-026", pw("026"), "R060600000026", "2026/6/1", false));
caseTest("IT-F06-06-042", スマレジ取引の行("042", "cbf0606-042", "Passw0rd-CBF0606042", "R0606CB0420", "2026/7/1", true));

// ---------------------------------------------------------------- 043〜046 店頭受取受注→スマレジ取引の行
function 統合の行(n: string, 元の数: number, 購入日: string): CaseBody {
  return async (c) => {
    note("手順の注記", `${日付の注記}。店頭受取注文の注文番号（OTC-F0606-CB… の固定の値）は、画面が振った注文番号で読み替える`);
    const { step, expected } = c;
    const h = 履歴(c);
    const レシート = レシートNo(n);
    let 行!: Locator;
    await step(1, async () => { await ログイン(c, `cbf0606-${n}`, `Passw0rd-CBF0606${n}`); });
    await step(2, async () => { await h.開く(); });
    await step(3, async () => { 行 = h.行(レシート); await expect(行).toHaveCount(1); });
    await expected(async () => {
      const 元 = Array.from({ length: 元の数 }, (_, i) => 注文(`${n}元${i + 1}`).番号);
      expect.soft(await h.注文の枠.count(), "表示される行は統合先1件だけ").toBe(1);
      expect.soft((await h.項目(行, "店舗")).文, "受取店舗名").toBe(注文(`${n}元1`).店名);
      expect.soft((await h.項目(行, "購入日")).文, "購入日（店頭受取データの最も若い注文日）").toBe(購入日);
      const 元番号 = await h.項目(行, "取引番号");
      expect.soft(元番号.有, "注文元番号の欄がある").toBe(true);
      expect.soft(元番号.文.split(/\s*,\s*/).sort(), "注文元番号（カンマ区切り）").toEqual([...元].sort());
      expect.soft(元番号.文.includes(",") || 元.length === 1, "複数の注文元番号はカンマ区切り").toBe(true);
      expect.soft(元番号.リンクあり, "注文元番号にリンクが設定されない").toBe(false);
      expect.soft((await h.項目(行, "支払方法")).文, "支払方法").toBe("店頭支払");
      expect.soft((await h.処理状態(行)).表示, "処理状態が表示されない").toBe(false);
    });
  };
}
caseTest("IT-F06-06-043", 統合の行("043", 1, "2026/8/5"));
caseTest("IT-F06-06-044", 統合の行("044", 1, "2026/8/5"));
caseTest("IT-F06-06-045", 統合の行("045", 2, "2026/8/2"));
caseTest("IT-F06-06-046", 統合の行("046", 2, "2026/8/2"));

// ---------------------------------------------------------------- 014 9状態の処理状態
// 注文 01〜09 のBOステータス（正本の事前準備の順。シード seeds/f06-06-orders.ts の S-F06-06-STATUS-014 と同じ）
const 九状態 = ["ピック中", "入金待ち", "入金済み", "ピック完了", "出荷指示", "店頭予約", "出荷完了", "購入済み", "キャンセル"];
caseTest("IT-F06-06-014", async (c) => {
  note("手順の注記", `${別添資料の注記}。${日付の注記}`);
  const { step, expected, notes } = c;
  const h = 履歴(c);
  const 行の一覧: { k: string; BO: string; 行: Locator }[] = [];
  await step(1, async () => { await ログイン(c, "status-f0606-014", pw("014")); });
  await step(2, async () => { await h.開く(); });
  await step(3, async () => {
    // 9件は1ページ（10件）に収まる
    for (const [i, BO] of 九状態.entries()) {
      const k = String(i + 1).padStart(2, "0");
      const 行 = h.行(notes.get(`〔注文番号-F0606-014-${k}〕`));
      await expect(行, `注文 ${k} の行`).toHaveCount(1);
      行の一覧.push({ k, BO, 行 });
    }
  });
  await expected(async () => {
    const 記録: string[] = [];
    for (const r of 行の一覧) {
      const x = 別添資料の照らし(h, r.行, r.BO, `注文 ${r.k}`);
      await expect.soft(x.札, x.文言の項目).toHaveText(x.文言);
      await x.色を確かめる();
      記録.push(`${r.k}=${await x.結果()}`);
    }
    note("手順の注記", `処理状態: ${記録.join(" / ")}`);
  });
});

// ---------------------------------------------------------------- 015・016・030 注文番号・処理状態を押して詳細へ
function 押して詳細へ(n: string, 前半: string, パスワード: string, 押す: "注文番号" | "処理状態"): CaseBody {
  return async (c) => {
    note("手順の注記", 日付の注記);
    const { step, expected, notes } = c;
    const h = 履歴(c);
    await step(1, async () => { await ログイン(c, 前半, パスワード); });
    await step(2, async () => { await h.開く(); });
    await step(3, async () => {
      const 行 = h.行(notes.get(`〔注文番号-F0606-${n}〕`));
      await expect(行).toHaveCount(1);
      await h.押して遷移する(押す === "注文番号" ? h.注文番号のリンク(行) : h.処理状態のリンク(行));
    });
    await expected(async () => {
      expect.soft(h.path, "遷移した画面（注文購入履歴詳細）").toBe(詳細のパス(notes.get(`〔注文ID-F0606-${n}〕`)));
    });
  };
}

// ---------------------------------------------------------------- 017 「詳細を見る」で4種類の行から詳細へ
caseTest("IT-F06-06-017", async (c) => {
  note("手順の注記", `${日付の注記}。統合先の元の注文2件は、店頭受取注文として関連付けた画面が振った注文番号の注文`);
  const { step, expected, notes } = c;
  const h = 履歴(c);
  const 到着: { 行: string; 期待: string; 実際: string }[] = [];
  const 押す = async (名前: string, キー: string, 期待ID: string) => {
    const 行 = h.行(キー);
    await expect(行, `${名前}の行`).toHaveCount(1);
    await h.押して遷移する(h.詳細を見るボタン(行));
    到着.push({ 行: 名前, 期待: 詳細のパス(期待ID), 実際: h.path });
    await h.開く();
  };
  await step(1, async () => { await ログイン(c, "display-f0606-017", pw("017")); });
  await step(2, async () => { await h.開く(); });
  await step(3, async () => { await 押す("EC", notes.get("〔注文番号-F0606-017A〕"), notes.get("〔注文ID-F0606-017A〕")); });
  await step(4, async () => {
    await 押す("店頭受取受注", notes.get("〔注文番号-F0606-017B〕"), notes.get("〔注文ID-F0606-017B〕"));
    await 押す("店頭受取受注からスマレジ取引", "R060600000117", 注文("017統合先").ID);
    await 押す("スマレジ取引", "R060600000217", 注文("017単独").ID);
  });
  await expected(async () => {
    expect.soft(await h.注文の枠.count(), "表示される行は4件（統合の元の注文は個別に表示されない）").toBe(4);
    for (const r of 到着) expect.soft(r.実際, `${r.行}の行から遷移した画面`).toBe(r.期待);
  });
});

// ---------------------------------------------------------------- 027 管理画面の対応状況の変更が処理状態に反映される
caseTest("IT-F06-06-027", async (c) => {
  note("手順の注記", `${別添資料の注記}。ブラウザBの管理者は、試験の準備に使う既存の全権限の管理者で代える。${日付の注記}`);
  const { step, expected, browser, notes } = c;
  const h = 履歴(c);
  const adminCtx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(adminCtx);
    const ap = await adminCtx.newPage();
    ap.setDefaultTimeout(60_000);
    const edit = new OrderEditPage(ap);
    const 番号 = notes.get("〔注文番号-F0606-QF001〕");
    let 前 = "", 後 = "";
    await step(1, async () => { await ログイン(c, "qf-f0606-001", "Passw0rd-QF0606"); await h.開く(); });
    // 期待結果の前半（手順2の処理状態が「入金待ち」の画像）は、手順2の画面で照らす（手順6のあとの画面では表示が変わっている）
    await step(2, async () => {
      const x = 別添資料の照らし(h, h.行(番号), "入金待ち", "手順2の注文の行");
      await expect.soft(x.札, x.文言の項目).toHaveText(x.文言);
      await x.色を確かめる();
      前 = await x.結果();
    });
    await step(3, async () => {
      await loginAdmin(ap, SETUP_ADMIN);
      await edit.openByOrderNo(番号, await 本店の店名(browser));
      await 別のブラウザの画面を印つきで撮る(ap, scene.stepLabel(3, "ブラウザB（管理者）の受注情報編集"));
    });
    await step(4, async () => {
      await edit.ステータスを選ぶ("入金済み");
      await 別のブラウザの画面を印つきで撮る(ap, scene.stepLabel(4, "ブラウザB（管理者）で入金済みを選んだところ"));
      await edit.ステータスを変更する(() => undefined);
    });
    await step(5, async () => {
      await expect.soft(edit.保存の知らせ, "ブラウザBの管理画面に「保存しました」が表示されること").toContainText("保存しました");
      await expect.soft(edit.現在のステータスの欄, "ブラウザBの管理画面の現在のステータスが「入金済み」であること").toHaveText("入金済み");
      await 別のブラウザの画面を印つきで撮る(ap, scene.stepLabel(5, "ブラウザB（管理者）の保存の知らせと現在のステータス"));
      await expectSaved(ap, "受注ステータスの変更");
    });
    await step(6, async () => { await h.開く(); });
    await expected(async () => {
      const x = 別添資料の照らし(h, h.行(番号), "入金済み", "手順6の注文の行");
      await expect.soft(x.札, x.文言の項目).toHaveText(x.文言);
      await x.色を確かめる();
      後 = await x.結果();
      note("手順の注記", `処理状態: 手順2 ${前} ／ 手順6 ${後}`);
    });
  } finally {
    await adminCtx.close();
  }
});

void 本店名; void 高松店名;
