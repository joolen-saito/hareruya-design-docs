/**
 * A14-01 カードIDからカード情報を取得（GET /api/cards/{カードID}）。正本: cases/A14-01_test_cases.tsv
 * ケースの「開発者ツールの Network で確かめる」は、試験ブラウザ（ログインしていない）から認証の見出しを付けずに要求を送り、
 * 要求メソッド・HTTP ステータス・応答本文をそのまま読む（A15-07 と同じ。送り先は API サーバー）。
 * カードは、シードが画面で登録した印つきのカード（seeds/a14-01.ts）。期待結果の「DB値と一致」は、そのカードの DB の値と比べる。
 * 書いていないケース: 004・005・008・012・020（決まった ID のマスタ・関連の行が要る。判断待ち）、006・007・013（ケースのテストが無い。この回の対象外）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { カードの値, カードの関連, カードの件数, カード画像の数, 色順の行, 関連の行 } from "../../db/a14_cards";
import { カード情報を取得, 値, 項目がある, 一覧, 要約, 応答 } from "../../pages/api/a14_cards";
import { マスターのID } from "../../seeds/a14-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const NETWORK = "開発者ツールの Network の代わりに、試験ブラウザから送った要求の、要求メソッド・HTTP ステータス・応答本文をそのまま読む";
const n = (v: string) => Number(v);

async function 送る(page: Parameters<typeof カード情報を取得>[0], カードID: string): Promise<応答> {
  const r = await カード情報を取得(page, カードID);
  note(要約(r));
  return r;
}

/** 応答の一覧（cardtypes など）から、id が 欲しいID の要素 */
const 要素 = (r: 応答, 名前: string, id: string): Record<string, unknown> | undefined => 一覧(r.json, 名前)?.find((e) => String(e.id) === id);
/** 真偽の DB 値（"true"/"false"）を、レスポンスの数値(整数)の 1/0 にそろえる。応答の true/false も 1/0 にそろえる */
const 旗 = (v: unknown): unknown => (v === true || v === "true" ? 1 : v === false || v === "false" ? 0 : v);

// ---- 001: 認証なしの GET で 200・JSON ----
caseTest("IT-A14-01-001", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔カードID-A1401-001〕");
  let r!: 応答;
  await step(1, async () => {
    note(NETWORK);
    expect((await page.context().cookies()).length, "要求の前のブラウザに Cookie が無い（ログインしていない）").toBe(0);
  });
  await step(2, async () => { r = await 送る(page, id); note("認証の見出し（Authorization・jwt-token）は付けずに送った"); });
  await step(3, async () => { note(`要求メソッド ${r.方法}・HTTPステータス ${r.ステータス}・種類 ${r.種類}`); });
  await expected(async () => {
    expect.soft(r.方法, "要求メソッド").toBe("GET");
    expect.soft(r.ステータス, "HTTPステータス").toBe(200);
    expect.soft(r.json, "応答本文が JSON のオブジェクト").not.toBeNull();
    expect.soft(値(r.json, "id"), `カードID ${id} の情報`).toBe(n(id));
  });
});

// ---- 002: カードの基本項目が DB の値と一致 ----
caseTest("IT-A14-01-002", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔カードID-A1401-002〕");
  const 項目 = ["name_jp", "name_en", "arena_format_name_jp", "arena_format_name_en", "text_jp", "text_en", "mana_cost", "power", "toughness", "loyalty"];
  let db!: ReturnType<typeof カードの値>;
  let r!: 応答;
  await step(1, async () => { db = カードの値(id); note(`DB: ${項目.map((k) => `${k}=${JSON.stringify(db[k])}`).join("・")}`); });
  await step(2, async () => { r = await 送る(page, id); });
  await step(3, async () => { note(NETWORK); note(`応答: ${項目.map((k) => `${k}=${JSON.stringify(値(r.json, k))}`).join("・")}`); });
  await expected(async () => {
    expect.soft(r.ステータス, "HTTPステータス").toBe(200);
    expect.soft(値(r.json, "id"), "id（DB のカードID）").toBe(n(db.id ?? ""));
    for (const k of 項目) expect.soft(値(r.json, k), `${k}（DB の値）`).toBe(db[k]);
  });
});

// ---- 003: カードタイプ・サブタイプ・特殊タイプ・カラー ----
caseTest("IT-A14-01-003", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔カードID-A1401-003〕");
  const m = マスターのID();
  const 欲しい: [string, string, string][] = [["cardtypes", m.カードタイプ, "カードタイプ"], ["subtypes", m.サブタイプ, "サブタイプ"], ["specialtypes", m.特殊タイプ, "特殊タイプ"], ["colors", m.カラー, "カラー"]];
  let db!: ReturnType<typeof カードの関連>;
  let r!: 応答;
  await step(1, async () => {
    db = カードの関連(id);
    note(`DB: ${欲しい.map(([k]) => `${k}=${JSON.stringify((db as Record<string, 関連の行[]>)[k])}`).join("・")}`);
    note(`シード表の ID（カードタイプ4・サブタイプ1・特殊タイプ3・カラー3）は、開発環境の名前で引いた ID（${欲しい.map(([, v, l]) => `${l} ${v}`).join("・")}）で読み替えた`);
  });
  await step(2, async () => { r = await 送る(page, id); });
  await step(3, async () => { note(NETWORK); note(`応答: ${欲しい.map(([k]) => `${k}=${JSON.stringify(値(r.json, k))}`).join("・")}`); });
  await expected(async () => {
    expect.soft(r.ステータス, "HTTPステータス").toBe(200);
    for (const [k, mid, label] of 欲しい) {
      const d = (db as Record<string, 関連の行[]>)[k].find((x) => x.id === mid);
      expect.soft(d, `DB でカードに${label} ID ${mid} が紐づいている`).toBeTruthy();
      const e = 要素(r, k, mid);
      expect.soft(e, `${k} に ID ${mid} の情報が含まれる`).toBeTruthy();
      expect.soft(値(e, "id"), `${k} の id（DB の値）`).toBe(n(mid));
      expect.soft(値(e, "name_jp"), `${k} の name_jp（DB の値）`).toBe(d?.name_jp);
      expect.soft(値(e, "name_en"), `${k} の name_en（DB の値）`).toBe(d?.name_en);
      if (k === "cardtypes") expect.soft(旗(値(e, "product_search_flg")), "cardtypes の product_search_flg（DB の値。1=有効）").toBe(旗(d?.product_search_flg));
    }
  });
});

// ---- 009: 値の無い項目も項目名を残して返る ----
const カードの値なし項目 = ["name_en", "arena_format_name_jp", "arena_format_name_en", "text_jp", "text_en", "mana_cost", "power", "toughness", "loyalty", "old_product_id", "old_en_product_id", "color_sequence"];
const 詳細の値なし項目 = ["back_card_detail_id", "cardset_id", "rarity_id", "illustrator_id", "flavor_jp", "flavor_en", "text_jp", "text_en", "power", "toughness", "card_no", "card_layout", "rarity", "cardset", "illustrator", "promotion"];
const 値なし = (v: unknown) => v === null || v === "";
caseTest("IT-A14-01-009", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔カードID-A1401-009〕");
  const did = notes.get("〔カード詳細ID-A1401-009〕");
  let r!: 応答;
  await step(1, async () => { r = await 送る(page, id); });
  await step(2, async () => {
    note(NETWORK);
    const d = 要素(r, "card_details", did);
    note(`カード: ${カードの値なし項目.map((k) => `${k}=${項目がある(r.json, k) ? JSON.stringify(値(r.json, k)) : "（項目なし）"}`).join("・")}`);
    note(`カード詳細 ${did}: ${d ? 詳細の値なし項目.map((k) => `${k}=${項目がある(d, k) ? JSON.stringify(値(d, k)) : "（項目なし）"}`).join("・") : "（card_details にこの ID の要素が無い）"}`);
  });
  await expected(async () => {
    expect.soft(r.ステータス, "HTTPステータス").toBe(200);
    for (const k of カードの値なし項目) {
      expect.soft(項目がある(r.json, k), `カードの ${k} が省略されない（項目名がある）`).toBe(true);
      expect.soft(値なし(値(r.json, k)), `カードの ${k} が値なし（null か空。実際 ${JSON.stringify(値(r.json, k))}）`).toBe(true);
    }
    const d = 要素(r, "card_details", did);
    expect.soft(d, `card_details にカード詳細ID ${did} の要素がある`).toBeTruthy();
    for (const k of 詳細の値なし項目) {
      expect.soft(項目がある(d, k), `カード詳細の ${k} が省略されない（項目名がある）`).toBe(true);
      expect.soft(値なし(値(d, k)), `カード詳細の ${k} が値なし（null か空。実際 ${JSON.stringify(値(d, k))}）`).toBe(true);
    }
  });
});

// ---- 010: 関連が0件の一覧は空の一覧で返る ----
caseTest("IT-A14-01-010", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔カードID-A1401-010〕");
  const 一覧の項目 = ["cardtypes", "subtypes", "specialtypes", "colors", "color_identities", "card_details", "card_formats"];
  let r!: 応答;
  await step(1, async () => {
    const 件数 = カードの件数(id);
    note(`DB: カード詳細 ${件数.カード詳細} 件・カードフォーマット ${件数.カードフォーマット} 件`);
    r = await 送る(page, id);
  });
  await step(2, async () => { note(NETWORK); note(`応答: ${一覧の項目.map((k) => `${k}=${項目がある(r.json, k) ? JSON.stringify(値(r.json, k)) : "（項目なし）"}`).join("・")}`); });
  await expected(async () => {
    expect.soft(r.ステータス, "HTTPステータス").toBe(200);
    for (const k of 一覧の項目) {
      expect.soft(項目がある(r.json, k), `${k} が省略されない（項目名がある）`).toBe(true);
      expect.soft(値(r.json, k), `${k} が空の一覧`).toEqual([]);
    }
  });
});

// ---- 011: カード画像が0件のカード詳細の card_images は空の一覧 ----
caseTest("IT-A14-01-011", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔カードID-A1401-011〕");
  const did = notes.get("〔カード詳細ID-A1401-011〕");
  let r!: 応答;
  await step(1, async () => { note(`DB: カード詳細 ${did} のカード画像 ${カード画像の数(did)} 件`); r = await 送る(page, id); });
  await step(2, async () => {
    note(NETWORK);
    const d = 要素(r, "card_details", did);
    note(`カード詳細 ${did} の card_images: ${d ? (項目がある(d, "card_images") ? JSON.stringify(値(d, "card_images")) : "（項目なし）") : "（card_details にこの ID の要素が無い）"}`);
  });
  await expected(async () => {
    expect.soft(r.ステータス, "HTTPステータス").toBe(200);
    const d = 要素(r, "card_details", did);
    expect.soft(d, `card_details にカード詳細ID ${did} の要素がある`).toBeTruthy();
    expect.soft(項目がある(d, "card_images"), "card_images が省略されない（項目名がある）").toBe(true);
    expect.soft(値(d, "card_images"), "card_images が空の一覧").toEqual([]);
  });
});

// ---- 018: color_sequence の id・name・sort_no ----
caseTest("IT-A14-01-018", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔カードID-A1401-018〕");
  const sid = notes.get("〔色順ID-A1401-018〕");
  let db!: ReturnType<typeof 色順の行>;
  let r!: 応答;
  await step(1, async () => { db = 色順の行(sid); note(`DB: カード ${id} に紐づく色順 ${JSON.stringify(db)}`); });
  await step(2, async () => { r = await 送る(page, id); });
  await step(3, async () => { note(NETWORK); note(`応答の color_sequence: ${JSON.stringify(値(r.json, "color_sequence"))}`); });
  await expected(async () => {
    const c = 値(r.json, "color_sequence") as Record<string, unknown> | null | undefined;
    expect.soft(r.ステータス, "HTTPステータス").toBe(200);
    expect.soft(値(c, "id"), "color_sequence.id（〔色順ID-A1401-018〕）").toBe(n(sid));
    expect.soft(値(c, "name"), "color_sequence.name（DB の値）").toBe(db?.name);
    expect.soft(String(db?.name ?? "").startsWith("色順確認-A1401-018-A"), "DB の色順の名称が「色順確認-A1401-018-A」（決まった印つき）").toBe(true);
    expect.soft(値(c, "sort_no"), "color_sequence.sort_no").toBe(7);
  });
});
