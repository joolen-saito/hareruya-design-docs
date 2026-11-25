/**
 * A02-02 ポップアップ用カード情報取得（カードID）の続き: 取得対象の判定（004・005）と画像の順位（016・017・036・037・057・058）。
 * 正本: cases/A02-02_test_cases.tsv。ケースの「開発者ツールから GET で要求を送り、Network で確かめる」は、ページで API を開き、その応答を読む（a02-02.spec.ts と同じ）。
 * 書かないケース: 059・060（サブ画像の有無が決め手になる組。理由は review/A02-02_progress_2026-11-26_b.md）。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { カードIDで開く, 値, 項目の名前, 要約, 応答 } from "../../pages/api/a02_02_popup";
import "../../seeds/a02-02";
import "../../seeds/a02-02-b";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const NETWORK = "開発者ツールの Network の代わりに、開いたページの応答（状態・本文・送った要求の見出し）をそのまま読む";
const n = (v: string) => Number(v);
const 規格ラベル = (番号: string, 印: string) => `〔商品規格ID-A0202-${番号}${印}〕`;
const カードラベル = (番号: string) => `〔カードID-A0202-${番号}〕`;

async function 開く(page: Page, lang: string, カードID: string, 絞り込み = ""): Promise<応答> {
  const r = await カードIDで開く(page, lang, カードID, 絞り込み);
  note(`/api/popup/card/${lang}/${カードID}${絞り込み} の応答: ${要約(r)}`);
  return r;
}

// ---- 004: 公開・未削除の1件だけが返る（商品削除済み・規格削除済み・商品非公開は返らない） ----
caseTest("IT-A02-02-004", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { note(NETWORK); r = await 開く(page, "ja", notes.get(カードラベル("004"))); });
  await step(2, async () => { note(`HTTPステータス ${r.状態}・productClassId ${String(値(r, "productClassId"))}`); });
  await expected(async () => {
    expect.soft(r.状態, "HTTPステータス").toBe(200);
    expect.soft(値(r, "productClassId"), `productClassId（${規格ラベル("004", "A")}の1件だけ）`).toBe(n(notes.get(規格ラベル("004", "A"))));
    for (const x of ["B", "C", "D"]) expect.soft(値(r, "productClassId"), `productClassId が ${規格ラベル("004", x)} でない`).not.toBe(n(notes.get(規格ラベル("004", x))));
  });
});

// ---- 005: 取得対象が0件なら 404（code と message だけ） ----
caseTest("IT-A02-02-005", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { note(NETWORK); r = await 開く(page, "ja", notes.get(カードラベル("005"))); });
  await step(2, async () => { note(`HTTPステータス ${r.状態}・項目: ${項目の名前(r).join("、")}・code ${String(値(r, "code"))}・message ${String(値(r, "message"))}`); });
  await expected(async () => {
    expect.soft(r.状態, "HTTPステータス").toBe(404);
    expect.soft(r.JSONか, "応答本文が JSON").toBe(true);
    expect.soft([...項目の名前(r)].sort(), "応答の項目は code と message だけ（商品情報の項目を含まない）").toEqual(["code", "message"]);
    expect.soft(値(r, "code"), "code").toBe(404);
    expect.soft(値(r, "message"), "message").toBe("Not Found");
  });
});

// ---- 016: 商品規格に結び付いた画像の順序が先の規格が返る ----
caseTest("IT-A02-02-016", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { note(NETWORK); r = await 開く(page, "ja", notes.get(カードラベル("016"))); });
  await step(2, async () => { note(`productClassId ${String(値(r, "productClassId"))}`); });
  await expected(async () => {
    expect.soft(値(r, "productClassId"), `productClassId（画像順序1の${規格ラベル("016", "A")}）`).toBe(n(notes.get(規格ラベル("016", "A"))));
    expect.soft(値(r, "productClassId"), `productClassId が ${規格ラベル("016", "B")} でない`).not.toBe(n(notes.get(規格ラベル("016", "B"))));
  });
});

// ---- 017: サブ画像のファイル名を持つ規格が返る ----
caseTest("IT-A02-02-017", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { note(NETWORK); r = await 開く(page, "ja", notes.get(カードラベル("017"))); });
  await step(2, async () => { note(`productClassId ${String(値(r, "productClassId"))}・subFileName ${String(値(r, "subFileName"))}`); });
  await expected(async () => {
    expect.soft(値(r, "productClassId"), `productClassId（サブ画像ありの${規格ラベル("017", "A")}）`).toBe(n(notes.get(規格ラベル("017", "A"))));
    expect.soft(値(r, "subFileName"), "subFileName").toBe("A02-02-017-A.jpg");
    expect.soft(値(r, "productClassId"), `productClassId が ${規格ラベル("017", "B")} でない`).not.toBe(n(notes.get(規格ラベル("017", "B"))));
  });
});

// ---- 036: カードの状態の昇順が画像の順序より優先される ----
caseTest("IT-A02-02-036", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { note(NETWORK); r = await 開く(page, "ja", notes.get(カードラベル("036"))); });
  await step(2, async () => { note(`productClassId ${String(値(r, "productClassId"))}・conditionCode ${String(値(r, "conditionCode"))}`); });
  await expected(async () => {
    expect.soft(値(r, "productClassId"), `productClassId（状態NMの${規格ラベル("036", "B")}）`).toBe(n(notes.get(規格ラベル("036", "B"))));
    expect.soft(値(r, "conditionCode"), "conditionCode").toBe("NM");
    expect.soft(値(r, "productClassId"), `productClassId が ${規格ラベル("036", "A")} でない`).not.toBe(n(notes.get(規格ラベル("036", "A"))));
  });
});

// ---- 037: 画像の順序がサブ画像のファイル名の有無より優先される ----
caseTest("IT-A02-02-037", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { note(NETWORK); r = await 開く(page, "ja", notes.get(カードラベル("037"))); });
  await step(2, async () => { note(`productClassId ${String(値(r, "productClassId"))}`); });
  await expected(async () => {
    expect.soft(値(r, "productClassId"), `productClassId（画像順序1の${規格ラベル("037", "A")}）`).toBe(n(notes.get(規格ラベル("037", "A"))));
    expect.soft(値(r, "productClassId"), `productClassId が ${規格ラベル("037", "B")} でない`).not.toBe(n(notes.get(規格ラベル("037", "B"))));
  });
});

// ---- 057: フォイル区分から状態までが同じなら画像の順序が先の規格（EN・フォイル先・価格の高い順） ----
caseTest("IT-A02-02-057", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { note(NETWORK); r = await 開く(page, "en", notes.get(カードラベル("057")), "?foil_flg=1&price=high"); });
  await step(2, async () => { note(`productClassId ${String(値(r, "productClassId"))}・code ${String(値(r, "code"))}`); });
  await expected(async () => {
    expect.soft(値(r, "productClassId"), `productClassId（画像順序1の${規格ラベル("057", "B")}）`).toBe(n(notes.get(規格ラベル("057", "B"))));
    expect.soft(値(r, "productClassId"), `productClassId が ${規格ラベル("057", "A")} でない`).not.toBe(n(notes.get(規格ラベル("057", "A"))));
    expect.soft(値(r, "code"), "code").toBe("EN");
  });
});

// ---- 058: 同（JP・非フォイル先・価格の低い順） ----
caseTest("IT-A02-02-058", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { note(NETWORK); r = await 開く(page, "ja", notes.get(カードラベル("058")), "?foil_flg=0&price=low"); });
  await step(2, async () => { note(`productClassId ${String(値(r, "productClassId"))}・code ${String(値(r, "code"))}`); });
  await expected(async () => {
    expect.soft(値(r, "productClassId"), `productClassId（画像順序1の${規格ラベル("058", "B")}）`).toBe(n(notes.get(規格ラベル("058", "B"))));
    expect.soft(値(r, "productClassId"), `productClassId が ${規格ラベル("058", "A")} でない`).not.toBe(n(notes.get(規格ラベル("058", "A"))));
    expect.soft(値(r, "code"), "code").toBe("JP");
  });
});
