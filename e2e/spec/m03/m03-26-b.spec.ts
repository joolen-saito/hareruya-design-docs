/**
 * M03-26 カード商品CSV登録の続き（-b）。実施不可の見直し（2026-11-10）で流せる見込みになった、新規の取込のケース。
 * 正本: cases/M03-26_test_cases.tsv。シードでの解釈は seeds/m03-26-b.ts の冒頭と記録 review/M03-26_progress_2026-11-10_dev.md。
 *
 * - カード詳細は新しく作らず、開発環境の商品の付いていないカード詳細を使う。〔カード詳細ID-M0326-…〕はその番号（正本の外の補い）。
 * - 商品カテゴリは、開発環境では 177 が 1 の4階層目なので、期待結果のカテゴリは「指定したカテゴリとその祖先」で読む（正本の外の補い）。
 * - CSV のファイル名・商品名は実行の印つき。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { pathOf, topMessages } from "../../pages/admin/m03_21_shelf_number";
import { CsvUploadPage, SubmitResult } from "../../pages/admin/m03_26_card_csv_upload";
import { rc } from "../../lib/run_marker";
import { M0326_ADMIN } from "../../seeds/m03-26";
import { ファイル名, ファイルの場所, 誤りの項目 } from "../../seeds/m03-26-b";
import {
  カード商品CSVの取込履歴, カード詳細の商品, カテゴリと祖先, 在庫の店舗と在庫場所の数, 商品のカテゴリ, 商品のタグ, 商品の規格, 商品名の商品数,
  規格の価格履歴, 規格の在庫, 規格画像の件数, 商品が無いか, 商品の行, 規格の行,
} from "../../db/m03_26_b";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const カード詳細の補い = "カード詳細は新しく作らず、開発環境に既にある商品の付いていないカード詳細を使った（〔カード詳細ID-M0326-…〕はその番号）";
const カテゴリの補い = "開発環境では商品カテゴリ177が「1 > 159 > 176 > 177」の4階層目（正本は1の直下）。取込は指定したカテゴリの祖先も付けるので、カテゴリは「指定したカテゴリとその祖先」と比べた";

async function signIn(page: Page): Promise<CsvUploadPage> {
  await loginAdmin(page, M0326_ADMIN);
  return new CsvUploadPage(page, "カード商品");
}
async function 押した結果を残す(up: CsvUploadPage, r: SubmitResult | null): Promise<void> {
  if (r === null) note(`「CSVファイルをアップロード」を押すと確認モーダルが開いた（${await up.modalText()}）`);
  else if (r.sent) note(`「CSVファイルをアップロード」を押したあとの取込の要求の応答: ${r.status}`);
  else note(`ブラウザの入力チェックが送信を止めた: ${r.止めた項目.join(" / ")}`);
}
async function 確定する(page: Page, up: CsvUploadPage, pressed: SubmitResult | null): Promise<SubmitResult | null> {
  if (pressed !== null) { note("確認モーダルが開いていないので、確定ボタンを押せない（手順を実行できない）"); return null; }
  const r = await up.confirm();
  const m = await topMessages(page);
  note(`確定のあと: 取込の要求の応答 ${r.sent ? r.status : "送られていない"}・画面上部のメッセージ ${[...m.成功.map((t) => `成功「${t}」`), ...m.エラー.map((t) => `エラー「${t}」`)].join(" / ") || "なし"}`);
  return r;
}
/** 選んでアップロードを押し、確定まで（「〜を選択してアップロードを確定する」の1手順） */
async function 選んで確定する(page: Page, up: CsvUploadPage, 正本のファイル名: string): Promise<SubmitResult | null> {
  await up.choose(ファイルの場所(正本のファイル名));
  const pressed = await up.pressUpload();
  await 押した結果を残す(up, pressed);
  return 確定する(page, up, pressed);
}
const 送られた = (r: SubmitResult | null) => r !== null && r.sent;
const NM = (cs: 規格の行[]) => cs.find((c) => c.状態 === "NM");

/** 手順5つの形（開く・選ぶ・押す・確定・DBで確かめる） */
function 五つの手順(番号: string, 正本のファイル名: string, 確かめる: (ctx: CaseCtx, r: SubmitResult | null) => Promise<void>, 補い: string[] = [カード詳細の補い]) {
  return async (ctx: CaseCtx): Promise<void> => {
    for (const m of 補い) supplement(m);
    const up = await signIn(ctx.page);
    let pressed: SubmitResult | null = null; let r: SubmitResult | null = null;
    await ctx.step(1, async () => { await up.open(); });
    await ctx.step(2, async () => { await up.choose(ファイルの場所(正本のファイル名)); note(`選んだファイル: ${ファイル名(正本のファイル名)}`); });
    await ctx.step(3, async () => { pressed = await up.pressUpload(); await 押した結果を残す(up, pressed); });
    await ctx.step(4, async () => { r = await 確定する(ctx.page, up, pressed); });
    await ctx.step(5, async () => { note(`DBで確かめる対象: カード詳細 ${番号}`); });
    await ctx.expected(async () => {
      expect.soft(送られた(r), "確認モーダルの確定で取込の要求が送られた").toBe(true);
      await 確かめる(ctx, r);
    });
  };
}

/** 商品が1件だけ追加されたこと（その商品を返す） */
function 商品が1件(cd: string): 商品の行 | undefined {
  const ps = カード詳細の商品(cd);
  expect.soft(ps.length, `カード詳細 ${cd} の商品の件数（1件追加）`).toBe(1);
  return ps[0];
}

// ---- 007: 1行の値で商品・商品サブ情報・規格・カテゴリ・タグ・売上分析タグ・規格画像が追加される ----
caseTest("IT-M03-26-007", 五つの手順("007", "new-card-007.csv", async ({ notes }) => {
  const cd = notes.get("〔カード詳細ID-M0326-007〕");
  const p = 商品が1件(cd);
  if (!p) return;
  expect.soft([p.商品名日, p.商品名英], "商品名(日)・(英)").toEqual([rc("結合試験カード-007"), rc("Integration Card-007")]);
  expect.soft([p.商品公開ステータス, p.支店の商品公開ステータス], "商品公開ステータス（公開）・支店の商品公開ステータス（公開）").toEqual([1, 1]);
  expect.soft([p.サイズ, p.重量, p.購入グループ, p.割引率, p.買取減額率, p.略称タグ, p.地域別販売制限], "商品サブ情報（サイズ・重量・購入グループ・割引率・買取減額率・略称タグ・地域別販売制限）")
    .toEqual(["1", "3", "通常商品", "5", "1", "2448", "0"]);
  const cs = 商品の規格(p.商品ID);
  expect.soft(cs.length, "規格が追加された").toBeGreaterThan(0);
  expect.soft(cs.every((c) => c.言語 === "1"), "規格の言語（すべて言語1）").toBe(true);
  const nm = NM(cs);
  expect.soft(nm ? [nm.基準価格, nm.販売価格, nm.買取価格, nm.販売制限数] : "（NMの規格が無い）", "NMの規格の基準価格・販売価格・買取価格・販売制限数").toEqual([300, 300, 15, "25"]);
  expect.soft(商品のカテゴリ(p.商品ID), "商品カテゴリ（カテゴリ1・177とその祖先）").toEqual(カテゴリと祖先(["1", "177"]));
  expect.soft(商品のタグ(p.商品ID), "商品タグ（2）・売上分析タグ（28）").toEqual({ タグ: ["2"], 売上分析タグ: ["28"] });
  expect.soft(規格画像の件数(p.商品ID), "規格画像（CSVの規格画像は空なので0件）").toBe(0);
}, [カード詳細の補い, カテゴリの補い]));

// ---- 008: タブ区切り ----
caseTest("IT-M03-26-008", 五つの手順("008", "new-card.tsv", async ({ notes }) => {
  const p = 商品が1件(notes.get("〔カード詳細ID-M0326-008〕"));
  if (!p) return;
  expect.soft([p.商品名日, p.サイズ, p.重量, p.割引率], "商品名・サイズ・重量・割引率（タブ区切りの各値が列見出しに対応）").toEqual([rc("タブ区切りカード"), "1", "3", "5"]);
  const nm = NM(商品の規格(p.商品ID));
  expect.soft(nm ? [nm.基準価格, nm.販売価格, nm.買取価格] : "（NMの規格が無い）", "規格が追加された（NMの基準価格・販売価格・買取価格）").toEqual([300, 300, 15]);
}));

// ---- 009: 任意項目が空 ----
caseTest("IT-M03-26-009", 五つの手順("009", "optional-empty.csv", async ({ notes }) => {
  note("期待結果の「商品と規格が1件追加」は、商品が1件追加されることと読む（取込は言語ごと・状態ごとに規格を作るので、規格の件数は1件と限らない）");
  const p = 商品が1件(notes.get("〔カード詳細ID-M0326-009〕"));
  if (!p) return;
  expect.soft([p.商品説明日, p.商品説明英, p.買取商品説明日, p.買取商品説明英, p.検索ワード, p.フリーエリア, p.買取減額率, p.略称タグ].map((v) => v ?? ""), "任意項目（商品説明4項目・検索ワード・フリーエリア・買取減額率・略称タグ）が空")
    .toEqual(["", "", "", "", "", "", "", ""]);
  expect.soft(商品のタグ(p.商品ID), "タグ・売上分析タグが空").toEqual({ タグ: [], 売上分析タグ: [] });
  expect.soft(商品の規格(p.商品ID).length, "規格が追加された").toBeGreaterThan(0);
}));

// ---- 010: 取込履歴が1件追加 ----
caseTest("IT-M03-26-010", async ({ page, step, expected }) => {
  supplement(カード詳細の補い);
  const up = await signIn(page);
  let 前 = 0; let 後 = 0; let r: SubmitResult | null = null;
  await step(1, async () => { 前 = カード商品CSVの取込履歴(); note(`取込の前のカード商品CSV取込履歴: ${前} 件`); });
  await step(2, async () => { await up.open(); });
  await step(3, async () => { r = await 選んで確定する(page, up, "new-card-010.csv"); });
  await step(4, async () => { 後 = カード商品CSVの取込履歴(); note(`取込の後: ${後} 件`); });
  await expected(async () => {
    expect.soft(送られた(r), "確認モーダルの確定で取込の要求が送られた").toBe(true);
    expect.soft(後 - 前, "カード商品CSV取込履歴の増え方（1件）").toBe(1);
    expect.soft(カード商品CSVの取込履歴(ファイル名("new-card-010.csv")), "この取込のファイル名の取込履歴（1件）").toBe(1);
  });
});

// ---- 011: 確定のあとカード商品CSV登録画面へ ----
caseTest("IT-M03-26-011", async ({ page, step, expected }) => {
  supplement(カード詳細の補い);
  const up = await signIn(page);
  let r: SubmitResult | null = null;
  await step(1, async () => { await up.open(); });
  await step(2, async () => { r = await 選んで確定する(page, up, "new-card-011.csv"); });
  await expected(async () => {
    expect.soft(送られた(r), "確認モーダルの確定で取込の要求が送られた").toBe(true);
    expect.soft(pathOf(page.url()), "確定のあとの画面（カード商品CSV登録画面）").toBe(up.path());
  });
});

/** 手順3つの形（開く・選んで確定する・DBで確かめる） */
function 三つの手順(正本のファイル名: string, 確かめる: (ctx: CaseCtx) => Promise<void>, 補い: string[] = [カード詳細の補い]) {
  return async (ctx: CaseCtx): Promise<void> => {
    for (const m of 補い) supplement(m);
    const up = await signIn(ctx.page);
    let r: SubmitResult | null = null;
    await ctx.step(1, async () => { await up.open(); });
    await ctx.step(2, async () => { r = await 選んで確定する(ctx.page, up, 正本のファイル名); });
    await ctx.step(3, async () => { note("DBで確かめる"); });
    await ctx.expected(async () => {
      expect.soft(送られた(r), "確認モーダルの確定で取込の要求が送られた").toBe(true);
      await 確かめる(ctx);
    });
  };
}

// ---- 014: 新規商品のセールフラグは無効 ----
caseTest("IT-M03-26-014", 三つの手順("new-card-014.csv", async ({ notes }) => {
  const p = 商品が1件(notes.get("〔カード詳細ID-M0326-014〕"));
  if (!p) return;
  const cs = 商品の規格(p.商品ID);
  expect.soft(cs.length, "新規商品の規格がある").toBeGreaterThan(0);
  expect.soft(cs.filter((c) => c.セール).length, "セールフラグが有効の規格の数（0）").toBe(0);
}));

/** 新規の規格の在庫（全店舗×在庫場所・数量0）と価格履歴 */
function 在庫と価格履歴(cs: 規格の行[]): void {
  const ref = 在庫の店舗と在庫場所の数(cs.map((c) => c.規格ID));
  note(`比べる相手（直近のほかの規格の在庫）: 店舗 ${ref.店舗}・在庫場所 ${ref.在庫場所}`);
  for (const c of cs) {
    const s = 規格の在庫(c.規格ID);
    expect.soft([s.店舗, s.在庫場所, s.行, s.数量0でない], `規格 ${c.規格ID}（${c.状態}）の在庫（全店舗×在庫場所の組・数量0）`).toEqual([ref.店舗, ref.在庫場所, ref.店舗 * ref.在庫場所, 0]);
    expect.soft(規格の価格履歴(c.規格ID).length, `規格 ${c.規格ID}（${c.状態}）の価格履歴が登録された`).toBeGreaterThan(0);
  }
}

// ---- 015: 在庫と価格履歴 ----
caseTest("IT-M03-26-015", 三つの手順("new-card-015.csv", async ({ notes }) => {
  note("「全店舗と在庫場所の組み合わせ」は、直近に作られたほかの規格の在庫が持つ店舗・在庫場所の数と比べ、その数の積の行があることで確かめた");
  const p = 商品が1件(notes.get("〔カード詳細ID-M0326-015〕"));
  if (!p) return;
  const cs = 商品の規格(p.商品ID);
  expect.soft(cs.length, "新規の規格がある").toBeGreaterThan(0);
  在庫と価格履歴(cs);
}));

// ---- 029: 既存商品と同じカード詳細の行は取り込まれない ----
caseTest("IT-M03-26-029", 三つの手順("duplicate-and-valid.csv", async ({ notes }) => {
  const a = カード詳細の商品(notes.get("〔カード詳細ID-M0326-029A〕"));
  const b = カード詳細の商品(notes.get("〔カード詳細ID-M0326-029B〕"));
  expect.soft(a.map((x) => x.商品ID), "カード詳細Aの商品（既存の1件だけ。取り込まれない）").toEqual([notes.get("〔商品ID-M0326-029〕")]);
  expect.soft(b.length, "カード詳細Bの商品（新規に1件）").toBe(1);
}, [カード詳細の補い, "カード詳細Aを持つ既存の商品は、カード商品CSVの取込1行で作った（正本はグッズ商品CSV＋カード指定）"]));

// ---- 042: マスタに無い値の8ファイル ----
caseTest("IT-M03-26-042", async ({ page, notes, step, expected }) => {
  supplement(カード詳細の補い);
  const up = await signIn(page);
  const 結果: string[] = [];
  await step(1, async () => { await up.open(); });
  await step(2, async () => {
    for (const [i, k] of 誤りの項目.entries()) {
      await up.open();
      const r = await 選んで確定する(page, up, `master-error-0${i + 1}.csv`);
      結果.push(`${k}: ${送られた(r) ? "送られた" : "送られていない"}`);
    }
    note(`8ファイルの取込の要求: ${結果.join(" / ")}`);
  });
  await step(3, async () => { note("DBで確かめる"); });
  await expected(async () => {
    for (const [i, k] of 誤りの項目.entries()) {
      const cd = notes.get(`〔カード詳細ID-M0326-042${"ABCDEFGH"[i]}〕`);
      const ps = カード詳細の商品(cd);
      expect.soft(ps.length, `${k}に未登録値のファイル: 商品が追加されない`).toBe(0);
      expect.soft(カード商品CSVの取込履歴(ファイル名(`master-error-0${i + 1}.csv`)), `${k}に未登録値のファイル: 取込履歴が追加されない`).toBe(0);
    }
    note("商品が追加されなければ、その商品の規格も無い（規格は商品に付く）");
  });
});

// ---- 043: 未登録のカード詳細 ----
caseTest("IT-M03-26-043", 三つの手順("card-detail-not-found.csv", async () => {
  expect.soft(商品名の商品数(rc("カード詳細未登録-043")), "試験用の商品が追加されない").toBe(0);
  expect.soft(カード詳細の商品("999999043").length, "カード詳細 999999043 の商品・規格が追加されない").toBe(0);
  expect.soft(カード商品CSVの取込履歴(ファイル名("card-detail-not-found.csv")), "取込履歴が追加されない").toBe(0);
}, []));

// ---- 045: 未登録の商品ID ----
caseTest("IT-M03-26-045", 三つの手順("product-not-found.csv", async ({ notes }) => {
  expect.soft(カード詳細の商品(notes.get("〔カード詳細ID-M0326-045〕")).length, "カード詳細の商品が追加されない").toBe(0);
  expect.soft(商品が無いか("999999045"), "商品ID 999999045 の商品が作られない").toBe(true);
  expect.soft(商品名の商品数(rc("商品未登録確認-045")), "CSVの商品名の商品が追加・更新されない").toBe(0);
  expect.soft(カード商品CSVの取込履歴(ファイル名("product-not-found.csv")), "取込履歴が追加されない").toBe(0);
}));

// ---- 047: 1行の誤りで全体が戻る ----
caseTest("IT-M03-26-047", 三つの手順("rollback.csv", async ({ notes }) => {
  for (const s of ["A", "B"]) expect.soft(カード詳細の商品(notes.get(`〔カード詳細ID-M0326-047${s}〕`)).length, `カード詳細${s}の商品・規格が追加されない`).toBe(0);
  expect.soft(カード商品CSVの取込履歴(ファイル名("rollback.csv")), "取込履歴が追加されない").toBe(0);
}));

// ---- 056: 商品公開ステータス廃止・支店公開 ----
caseTest("IT-M03-26-056", 五つの手順("056", "M0326-056-split.csv", async ({ notes }) => {
  const p = 商品が1件(notes.get("〔カード詳細ID-M0326-056〕"));
  if (!p) return;
  expect.soft(p.商品公開ステータス, "商品公開ステータス（3=廃止）").toBe(3);
  expect.soft(p.支店の商品公開ステータス, "支店の商品公開ステータス（1=公開）").toBe(1);
}));

// ---- 058: 地域別販売制限が空 → 既定値0 ----
caseTest("IT-M03-26-058", 五つの手順("058", "M0326-058-empty.csv", async ({ notes }) => {
  const p = 商品が1件(notes.get("〔カード詳細ID-M0326-058〕"));
  if (!p) return;
  expect.soft(p.地域別販売制限, "地域別販売制限（既定値0＝日本語英語両サイト）").toBe("0");
}));

// ---- 059: 地域別販売制限1・2（手順4つ） ----
caseTest("IT-M03-26-059", async ({ page, notes, step, expected }) => {
  supplement(カード詳細の補い);
  const up = await signIn(page);
  let ra: SubmitResult | null = null; let rb: SubmitResult | null = null;
  await step(1, async () => { await up.open(); });
  await step(2, async () => { ra = await 選んで確定する(page, up, "M0326-059-A.csv"); });
  await step(3, async () => { await up.open(); rb = await 選んで確定する(page, up, "M0326-059-B.csv"); });
  await step(4, async () => { note("DBで確かめる"); });
  await expected(async () => {
    expect.soft([送られた(ra), 送られた(rb)], "2ファイルとも確定で取込の要求が送られた").toEqual([true, true]);
    const a = 商品が1件(notes.get("〔カード詳細ID-M0326-059A〕"));
    const b = 商品が1件(notes.get("〔カード詳細ID-M0326-059B〕"));
    expect.soft(a?.地域別販売制限 ?? "（商品が無い）", "カード詳細Aの商品の地域別販売制限（1＝日本語サイト）").toBe("1");
    expect.soft(b?.地域別販売制限 ?? "（商品が無い）", "カード詳細Bの商品の地域別販売制限（2＝英語サイト）").toBe("2");
  });
});

// ---- 069: 商品公開ステータス1・2 ----
caseTest("IT-M03-26-069", 五つの手順("069", "M0326-069-status12.csv", async ({ notes }) => {
  note("商品公開ステータスの値の意味はアプリの定め（1=公開・2=非公開・3=廃止）で読む");
  const a = 商品が1件(notes.get("〔カード詳細ID-M0326-069A〕"));
  const b = 商品が1件(notes.get("〔カード詳細ID-M0326-069B〕"));
  expect.soft(a?.商品公開ステータス ?? "（商品が無い）", "カード詳細Aの商品の商品公開ステータス（非公開＝2）").toBe(2);
  expect.soft(b?.商品公開ステータス ?? "（商品が無い）", "カード詳細Bの商品の商品公開ステータス（公開＝1）").toBe(1);
}));

// ---- 073: タグ2件・売上分析タグ2件 ----
caseTest("IT-M03-26-073", 五つの手順("073", "M0326-073-tags.csv", async ({ notes }) => {
  const p = 商品が1件(notes.get("〔カード詳細ID-M0326-073〕"));
  if (!p) return;
  expect.soft(商品のタグ(p.商品ID), "売上分析タグ（28・29）・商品タグ（2・3）").toEqual({ タグ: ["2", "3"], 売上分析タグ: ["28", "29"] });
}));

// ---- 075: 買取価格と販売価格が同じでも取り込まれる ----
caseTest("IT-M03-26-075", 五つの手順("075", "M0326-075-equal.csv", async ({ notes }) => {
  note("このファイル名の取込履歴が取込の前に0件であることはシードが確かめた（取込のあとの件数＝増えた件数）");
  expect.soft(カード詳細の商品(notes.get("〔カード詳細ID-M0326-075〕")).length, "カード詳細の商品が1件追加された").toBe(1);
  expect.soft(カード商品CSVの取込履歴(ファイル名("M0326-075-equal.csv")), "このファイルの取込履歴が1件加わった").toBe(1);
}));

// ---- 077: 同じファイルを2回取り込んでも商品は1件 ----
caseTest("IT-M03-26-077", async ({ page, notes, step, expected }) => {
  supplement(カード詳細の補い);
  const up = await signIn(page);
  const cd = () => notes.get("〔カード詳細ID-M0326-077〕");
  let pressed: SubmitResult | null = null; let r1: SubmitResult | null = null; let r2: SubmitResult | null = null;
  let n1 = -1; let n2 = -1;
  await step(1, async () => { await up.open(); });
  await step(2, async () => { await up.choose(ファイルの場所("M0326-077-again.csv")); });
  await step(3, async () => { pressed = await up.pressUpload(); await 押した結果を残す(up, pressed); });
  await step(4, async () => { r1 = await 確定する(page, up, pressed); });
  await step(5, async () => { n1 = カード詳細の商品(cd()).length; note(`1回目の取込のあとの商品: ${n1} 件`); });
  await step(6, async () => { await up.open(); r2 = await 選んで確定する(page, up, "M0326-077-again.csv"); });
  await step(7, async () => { n2 = カード詳細の商品(cd()).length; note(`2回目の取込のあとの商品: ${n2} 件`); });
  await expected(async () => {
    expect.soft([送られた(r1), 送られた(r2)], "2回とも確定で取込の要求が送られた").toEqual([true, true]);
    expect.soft(n1, "手順5の商品の件数（1件）").toBe(1);
    expect.soft(n2, "手順6の再取込のあとの商品の件数（手順5と同じ1件のまま）").toBe(n1);
  });
});

// ---- 079: 新規商品の規格の価格・価格履歴・在庫 ----
caseTest("IT-M03-26-079", 五つの手順("079", "M0326-CB079-new.csv", async ({ notes }) => {
  const p = 商品が1件(notes.get("〔カード詳細ID-M0326-079〕"));
  if (!p) return;
  const cs = 商品の規格(p.商品ID);
  const nm = NM(cs);
  expect.soft(nm ? [nm.基準価格, nm.販売価格, nm.買取価格] : "（NMの規格が無い）", "NMの規格の基準価格・販売価格・買取価格（400・400・120）").toEqual([400, 400, 120]);
  if (nm) expect.soft(規格の価格履歴(nm.規格ID).length, "NMの規格の価格履歴（1件）").toBe(1);
  在庫と価格履歴(cs);
}));

// ---- 087: 新規2行 ----
caseTest("IT-M03-26-087", 五つの手順("087", "M0326-CB087-two.csv", async ({ notes }) => {
  note("このファイル名の取込履歴が取込の前に0件であることはシードが確かめた（取込のあとの件数＝増えた件数）");
  for (const s of ["A", "B"]) {
    const p = 商品が1件(notes.get(`〔カード詳細ID-M0326-087${s}〕`));
    expect.soft(p ? 商品の規格(p.商品ID).length : 0, `カード詳細${s}の商品に商品規格が登録された`).toBeGreaterThan(0);
  }
  expect.soft(カード商品CSVの取込履歴(ファイル名("M0326-CB087-two.csv")), "このファイルの取込履歴が1件加わった").toBe(1);
}));
