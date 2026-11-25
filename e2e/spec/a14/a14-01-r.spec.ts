/**
 * A14-01 カードIDからカード情報を取得（GET /api/cards/{カードID}）の 004・005・008・012・020（-r。2026-11-25）。正本: cases/A14-01_test_cases.tsv
 * 「開発者ツールの Network」の代わりの読み方は a14-01.spec.ts と同じ（試験ブラウザから認証の見出しなしで要求し、要求メソッド・状態・本文を読む）。
 * 期待結果の「DB値と一致」は、シードが作った E2E のカード・カード詳細・カード画像の DB の値と比べる。
 * 固定の番号（カード詳細ID・カード画像ID・裏面カード詳細ID・マスターのID）は、実際に振られた番号・用意したマスターの番号に読み替えた（注記に書く）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { カード画像の行 } from "../../db/a14_01_r";
import { カード詳細の値 } from "../../db/a14_cards";
import { カード情報を取得, 値, 項目がある, 一覧, 要約, 応答 } from "../../pages/api/a14_cards";
import "../../seeds/a14-01";
import "../../seeds/a14-01-r";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const NETWORK = "開発者ツールの Network の代わりに、試験ブラウザから送った要求の、要求メソッド・HTTP ステータス・応答本文をそのまま読む";
const n = (v: string | null | undefined) => (v === null || v === undefined ? null : Number(v));

async function 送る(page: Parameters<typeof カード情報を取得>[0], カードID: string): Promise<応答> {
  const r = await カード情報を取得(page, カードID);
  note(要約(r));
  return r;
}
const 要素 = (r: 応答, 名前: string, id: string): Record<string, unknown> | undefined => 一覧(r.json, 名前)?.find((e) => String(e.id) === id);
const オブジェクト = (v: unknown): Record<string, unknown> | null => (v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);

// ---- 004: card_details の外部キー・テキスト・カード番号が DB の値と一致 ----
caseTest("IT-A14-01-004", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔カードID-A1401-004〕");
  const did = notes.get("〔カード詳細ID-A1401-004〕");
  const 項目 = ["id", "card_id", "back_card_detail_id", "cardset_id", "rarity_id", "illustrator_id", "flavor_jp", "flavor_en", "text_jp", "text_en", "card_no"] as const;
  let db!: ReturnType<typeof カード詳細の値>;
  let r!: 応答;
  await step(1, async () => {
    db = カード詳細の値(did);
    note(`DB: ${["cardset_id", "rarity_id", "illustrator_id", "back_card_detail_id", "flavor_jp", "flavor_en", "text_jp", "text_en", "card_no"].map((k) => `${k}=${JSON.stringify(db[k])}`).join("・")}`);
    supplement("裏面カード詳細ID 140109004・カードセットID 167・レアリティID 1・イラストレーターID 26 は、実際に振られた番号・用意したマスターの番号（DB の値）に読み替えた");
  });
  await step(2, async () => { r = await 送る(page, id); });
  await step(3, async () => {
    note(NETWORK);
    const d = 要素(r, "card_details", did);
    note(`card_details の ${did}: ${d ? 項目.map((k) => `${k}=${項目がある(d, k) ? JSON.stringify(値(d, k)) : "（項目なし）"}`).join("・") : "（この ID の要素が無い）"}`);
  });
  await expected(async () => {
    expect.soft(r.ステータス, "HTTPステータス").toBe(200);
    expect.soft(db.flavor_jp, "DB のフレーバーテキスト(日)").toBe("結合試験フレーバー-004");
    expect.soft(db.text_en, "DB の効果テキスト(英)").toBe("Integration effect-004");
    expect.soft(db.card_no, "DB のカード番号").toBe("A14-01-004");
    expect.soft(db.back_card_detail_id, "DB に裏面カード詳細IDがある").toBeTruthy();
    const d = 要素(r, "card_details", did);
    expect.soft(d, `card_details にカード詳細ID ${did} が含まれる`).toBeTruthy();
    for (const k of 項目) expect.soft(値(d, k), `card_details の ${k}（DB の値）`).toBe(k.endsWith("_id") || k === "id" ? n(db[k] ?? null) : db[k]);
  });
});

// ---- 005: card_layout・rarity・cardset・illustrator・promotion・card_images が DB の値と一致 ----
caseTest("IT-A14-01-005", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔カードID-A1401-005〕");
  const did = notes.get("〔カード詳細ID-A1401-005〕");
  const 関連 = ["card_layout", "rarity", "cardset", "illustrator", "promotion"] as const;
  let db!: ReturnType<typeof カード詳細の値>;
  let 画像!: ReturnType<typeof カード画像の行>;
  let r!: 応答;
  await step(1, async () => {
    db = カード詳細の値(did);
    画像 = カード画像の行(did);
    note(`DB: レイアウトID=${db.card_layout_id}・レアリティID=${db.rarity_id}・カードセットID=${db.cardset_id}・イラストレーターID=${db.illustrator_id}・プロモ種別ID=${db.promotion_id}・カード画像 ${JSON.stringify(画像)}`);
    supplement("カードセット167・レアリティ1 などは、用意したマスターの番号に、カード画像ID 140150005 は振られた番号に読み替えた");
  });
  await step(2, async () => { r = await 送る(page, id); });
  await step(3, async () => {
    note(NETWORK);
    const d = 要素(r, "card_details", did);
    note(`card_details の ${did}: ${d ? [...関連, "card_images"].map((k) => `${k}=${JSON.stringify(値(d, k))}`).join("・") : "（この ID の要素が無い）"}`);
  });
  await expected(async () => {
    expect.soft(r.ステータス, "HTTPステータス").toBe(200);
    const d = 要素(r, "card_details", did);
    expect.soft(d, `card_details にカード詳細ID ${did} が含まれる`).toBeTruthy();
    const 期待: Record<string, string | null> = { card_layout: db.card_layout_id, rarity: db.rarity_id, cardset: db.cardset_id, illustrator: db.illustrator_id, promotion: db.promotion_id };
    for (const k of 関連) {
      const o = オブジェクト(値(d, k));
      expect.soft(o, `${k} のオブジェクトが含まれる`).toBeTruthy();
      expect.soft(値(o, "id"), `${k}.id（DB のカード詳細の関連の番号）`).toBe(n(期待[k]));
    }
    expect.soft(画像.length, "DB のカード画像が1件").toBe(1);
    const gs = 一覧(d ?? null, "card_images") ?? [];
    expect.soft(gs.length, "card_images が1要素").toBe(1);
    const g = gs[0]; const dbg = 画像[0];
    expect.soft(値(g, "id"), "card_images の id（DB の値）").toBe(n(dbg?.id));
    expect.soft(値(g, "back_flg"), "card_images の back_flg（DB の値。無効）").toBe(dbg?.back_flg === "true");
    expect.soft(値(g, "url"), "card_images の url（DB の値）").toBe(dbg?.url);
    expect.soft(String(値(g, "create_date") ?? "").slice(0, 10), "card_images の create_date（DB の値の日付）").toBe("2026-09-01");
    expect.soft(値(オブジェクト(値(g, "language")), "id"), "card_images の language.id（DB の値）").toBe(n(dbg?.language_id));
  });
});

// ---- 008: カードタグ・キーワード能力・記事・デッキ収録カードは応答に含まれない ----
caseTest("IT-A14-01-008", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔カードID-A1401-008〕");
  const 目印 = ["〔除外確認タグ名-A1401-008〕", "〔除外確認能力名-A1401-008〕", "〔除外確認記事URL-A1401-008〕", "〔除外確認デッキ名-A1401-008〕"].map((k) => notes.get(k));
  let r!: 応答;
  await step(1, async () => { r = await 送る(page, id); });
  await step(2, async () => { note(NETWORK); note(`応答の項目: ${Object.keys(r.json ?? {}).join("・")}`); });
  await expected(async () => {
    expect.soft(r.ステータス, "HTTPステータス").toBe(200);
    expect.soft(r.json, "応答が JSON のオブジェクト").not.toBeNull();
    for (const w of 目印) expect.soft(r.本文.includes(w), `応答JSON全体に関連の目印「${w}」が含まれない`).toBe(false);
    const 名 = Object.keys(r.json ?? {}).filter((k) => /tag|ability|article|deck/i.test(k));
    expect.soft(名, "応答の項目名に、タグ・能力・記事・デッキを表すものが無い").toEqual([]);
  });
});

// ---- 012: 存在しないカードID → 404・{code, message} だけ ----
caseTest("IT-A14-01-012", async ({ page, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { r = await 送る(page, "149999012"); });
  await step(2, async () => { note(NETWORK); });
  await expected(async () => {
    expect.soft(r.ステータス, "HTTPステータス").toBe(404);
    expect.soft(r.json?.code, "応答の code").toBe(404);
    expect.soft(r.json?.message, "応答の message").toBe("Not Found");
    expect.soft(Object.keys(r.json ?? {}).sort(), "応答は code と message の2項目だけ（カード情報の項目を含まない）").toEqual(["code", "message"]);
  });
});

// ---- 020: カード画像2件が全件返る ----
caseTest("IT-A14-01-020", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔カードID-A1401-020〕");
  const did = notes.get("〔カード詳細ID-A1401-020〕");
  let 画像!: ReturnType<typeof カード画像の行>;
  let r!: 応答;
  await step(1, async () => {
    画像 = カード画像の行(did);
    note(`DB: カード詳細 ${did} のカード画像 ${JSON.stringify(画像)}`);
    supplement("カード画像ID 140170020・140170021 は、振られた番号に読み替えた（表=back_flg 無効・裏=有効）");
  });
  await step(2, async () => { r = await 送る(page, id); });
  await step(3, async () => {
    note(NETWORK);
    const d = 要素(r, "card_details", did);
    note(`card_images: ${d ? JSON.stringify(値(d, "card_images")) : "（card_details にこの ID の要素が無い）"}`);
  });
  await expected(async () => {
    expect.soft(r.ステータス, "HTTPステータス").toBe(200);
    expect.soft(画像.length, "DB のカード画像が2件").toBe(2);
    const d = 要素(r, "card_details", did);
    expect.soft(d, `card_details にカード詳細ID ${did} が含まれる`).toBeTruthy();
    const gs = 一覧(d ?? null, "card_images") ?? [];
    expect.soft(gs.length, "card_images が2要素の配列").toBe(2);
    for (const dbg of 画像) {
      const g = gs.find((x) => String(x.id) === dbg.id);
      expect.soft(g, `card_images にカード画像ID ${dbg.id}（${dbg.back_flg === "true" ? "裏" : "表"}）が含まれる`).toBeTruthy();
      expect.soft(値(g, "back_flg"), `ID ${dbg.id} の back_flg（DB の値）`).toBe(dbg.back_flg === "true");
      expect.soft(値(g, "url"), `ID ${dbg.id} の url（DB の値）`).toBe(dbg.url);
      expect.soft(String(値(g, "create_date") ?? "").slice(0, 10), `ID ${dbg.id} の create_date（DB の値の日付）`).toBe(dbg.create_date.slice(0, 10));
      expect.soft(値(オブジェクト(値(g, "language")), "id"), `ID ${dbg.id} の language.id（DB の値）`).toBe(n(dbg.language_id));
    }
    expect.soft(画像.filter((x) => x.back_flg === "true").length, "DB に裏面有効の画像が1件").toBe(1);
  });
});
