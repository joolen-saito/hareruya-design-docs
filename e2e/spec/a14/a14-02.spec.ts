/**
 * A14-02 カード詳細IDからカード詳細情報を取得（GET /api/cardDetails/{カード詳細ID}）。正本: cases/A14-02_test_cases.tsv
 * ケースの「開発者ツールの Network で確かめる」は、試験ブラウザ（ログインしていない）から認証の見出しを付けずに要求を送り、
 * 要求メソッド・HTTP ステータス・応答本文をそのまま読む（A14-01 と同じ。送り先は API サーバー）。
 * マスター・カードセット・カードは、シードが画面で登録した印つきのもの（seeds/a14-02.ts）。名前に印の付くもの（プロモ種別・イラストレーター・
 * カードセット・カードセットブロック）は、期待結果の名前に印の付いた DB の値と比べる。
 * 書いていないケース: 005・006（ケースのテストが無い。この回の対象外）。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseBody } from "../../lib/case";
import { MTGマスターの値, カードセットの値, カード詳細の値 } from "../../db/a14_cards";
import { カード詳細情報を取得, 値, 項目がある, 項目, 型, 要約, 応答 } from "../../pages/api/a14_cards";
import { 名前 } from "../../seeds/a14-02";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const NETWORK = "開発者ツールの Network の代わりに、試験ブラウザから送った要求の、要求メソッド・HTTP ステータス・応答本文をそのまま読む";
const n = (v: string) => Number(v);

async function 送る(page: Parameters<typeof カード詳細情報を取得>[0], id: string): Promise<応答> {
  const r = await カード詳細情報を取得(page, id);
  note(要約(r));
  return r;
}

// ---- 001: 認証なしの GET で 200・JSON ----
caseTest("IT-A14-02-001", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔カード詳細ID-A1402-共有〕");
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
  });
});

// ---- 002: カード詳細の各項目の値・型 ----
caseTest("IT-A14-02-002", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔カード詳細ID-A1402-共有〕");
  let db!: ReturnType<typeof カード詳細の値>;
  let r!: 応答;
  const 項目名 = ["id", "card_id", "back_card_detail_id", "cardset_id", "rarity_id", "illustrator_id", "flavor_jp", "flavor_en", "text_jp", "text_en", "power", "toughness", "card_no"];
  await step(1, async () => { db = カード詳細の値(id); note(`DB: ${項目名.map((k) => `${k}=${JSON.stringify(db[k])}`).join("・")}`); });
  await step(2, async () => { r = await 送る(page, id); });
  await step(3, async () => { note(NETWORK); note(`応答: ${項目名.map((k) => `${k}=${JSON.stringify(値(r.json, k))}`).join("・")}`); });
  await expected(async () => {
    const 整数: [string, number][] = [
      ["id", n(id)], ["card_id", n(notes.get("〔カードID-A1402-共有〕"))], ["back_card_detail_id", 140202], ["cardset_id", n(notes.get("〔カードセットID-A1402-共有〕"))],
      ["rarity_id", n(notes.get("〔レアリティID-A1402-共有〕"))], ["illustrator_id", n(notes.get("〔イラストレーターID-A1402-共有〕"))], ["power", 3], ["toughness", 4],
    ];
    const 文字: [string, string][] = [
      ["flavor_jp", "結合試験フレーバー日本語"], ["flavor_en", "Integration flavor text"], ["text_jp", "結合試験効果テキスト"], ["text_en", "Integration effect text"], ["card_no", "A14-02-001"],
    ];
    expect.soft(r.ステータス, "HTTPステータス").toBe(200);
    for (const [k, v] of 整数) {
      expect.soft(値(r.json, k), `${k} の値`).toBe(v);
      expect.soft(型(値(r.json, k)), `${k} の型（整数）`).toBe("整数");
      expect.soft(String(値(r.json, k)), `${k} が DB の値と一致`).toBe(db[k]);
    }
    for (const [k, v] of 文字) {
      expect.soft(値(r.json, k), `${k} の値（文字列）`).toBe(v);
      expect.soft(値(r.json, k), `${k} が DB の値と一致`).toBe(db[k]);
    }
  });
});

// ---- 003: 関連のオブジェクト ----
caseTest("IT-A14-02-003", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔カード詳細ID-A1402-共有〕");
  const ids = {
    レイアウト: notes.get("〔レイアウトID-A1402-共有〕"), レアリティ: notes.get("〔レアリティID-A1402-共有〕"), カードセット: notes.get("〔カードセットID-A1402-共有〕"),
    イラストレーター: notes.get("〔イラストレーターID-A1402-共有〕"), プロモ種別: notes.get("〔プロモ種別ID-A1402-共有〕"), ブロック: notes.get("〔カードセットブロックID-A1402-共有〕"),
  };
  let db!: { レイアウト: ReturnType<typeof MTGマスターの値>; レアリティ: ReturnType<typeof MTGマスターの値>; イラストレーター: ReturnType<typeof MTGマスターの値>; プロモ種別: ReturnType<typeof MTGマスターの値>; カードセット: ReturnType<typeof カードセットの値> };
  let r!: 応答;
  await step(1, async () => {
    db = { レイアウト: MTGマスターの値("レイアウト", ids.レイアウト), レアリティ: MTGマスターの値("レアリティ", ids.レアリティ), イラストレーター: MTGマスターの値("イラストレーター", ids.イラストレーター),
      プロモ種別: MTGマスターの値("プロモ種別", ids.プロモ種別), カードセット: カードセットの値(ids.カードセット) };
    note(`DB: ${JSON.stringify(db)}`);
    note("プロモ種別・イラストレーター・カードセット・カードセットブロックの名前は、シード表の値に決まった印の付いた値（全員が使うマスタに作るため）。期待結果の名前は、その DB の値と比べる");
  });
  await step(2, async () => { r = await 送る(page, id); });
  await step(3, async () => { note(NETWORK); note(`応答: ${["card_layout", "rarity", "cardset", "illustrator", "promotion"].map((k) => `${k}=${JSON.stringify(値(r.json, k))}`).join("・")}`); });
  await expected(async () => {
    const o = (k: string) => 項目(r.json, k);
    const want: [string, Record<string, unknown>][] = [
      ["card_layout", { id: n(ids.レイアウト), name_jp: 名前.レイアウト.日, name_en: 名前.レイアウト.英 }],
      ["rarity", { id: n(ids.レアリティ), name_jp: 名前.レアリティ.日, name_en: 名前.レアリティ.英, code: 名前.レアリティ.コード }],
      ["cardset", { id: n(ids.カードセット), name_jp: 名前.カードセット.日, name_en: 名前.カードセット.英, code: 名前.カードセット.略称, symbol_image: 名前.カードセット.シンボル画像, cardsetblock_id: n(ids.ブロック) }],
      ["illustrator", { id: n(ids.イラストレーター), name_jp: 名前.イラストレーター.日, name_en: 名前.イラストレーター.英 }],
      ["promotion", { id: n(ids.プロモ種別), name_jp: 名前.プロモ種別.日, name_en: 名前.プロモ種別.英, code: 名前.プロモ種別.コード }],
    ];
    expect.soft(r.ステータス, "HTTPステータス").toBe(200);
    for (const [k, w] of want) {
      expect.soft(o(k), `${k} のオブジェクトがある`).toBeTruthy();
      for (const [f, v] of Object.entries(w)) expect.soft(値(o(k), f), `${k}.${f}`).toBe(v);
    }
    const rd = String(値(o("cardset"), "release_date") ?? "");
    expect.soft(rd.slice(0, 10), `cardset.release_date が 2026-09-01（実際 ${JSON.stringify(値(o("cardset"), "release_date"))}）`).toBe("2026-09-01");
    // 名前が DB の値と一致すること（DB の値の確かめ）
    expect.soft(db.プロモ種別?.name_jp, "DB のプロモ種別の日本語名").toBe(名前.プロモ種別.日);
    expect.soft(db.カードセット?.release_date, "DB のカードセットのリリース日").toBe("2026-09-01");
  });
});

// ---- 004: foil・frame・promotion、foil_flg・promotion_flg は含まれない ----
caseTest("IT-A14-02-004", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔カード詳細ID-A1402-共有〕");
  const pid = notes.get("〔プロモ種別ID-A1402-共有〕");
  let db!: ReturnType<typeof カード詳細の値>;
  let r!: 応答;
  await step(1, async () => { db = カード詳細の値(id); note(`DB: Foil=${db.foil}・フレーム=${db.frame}・プロモ種別ID=${db.promotion_id}`); });
  await step(2, async () => { r = await 送る(page, id); });
  await step(3, async () => {
    note(NETWORK);
    note(`応答: foil=${JSON.stringify(値(r.json, "foil"))}・frame=${JSON.stringify(値(r.json, "frame"))}・promotion=${JSON.stringify(値(r.json, "promotion"))}・項目 ${Object.keys(r.json ?? {}).join(",")}`);
  });
  await expected(async () => {
    expect.soft(r.ステータス, "HTTPステータス").toBe(200);
    expect.soft(db.foil, "DB の Foil").toBe("2");
    expect.soft(db.promotion_id, "DB のプロモ種別ID").toBe(pid);
    expect.soft(値(r.json, "foil"), "foil（整数 2）").toBe(2);
    expect.soft(値(r.json, "frame"), "frame（文字列 Usually）").toBe("Usually");
    expect.soft(値(項目(r.json, "promotion"), "id"), `promotion がプロモ種別ID ${pid} のオブジェクト`).toBe(n(pid));
    expect.soft(項目がある(r.json, "foil_flg"), "foil_flg が含まれない").toBe(false);
    expect.soft(項目がある(r.json, "promotion_flg"), "promotion_flg が含まれない").toBe(false);
  });
});

// ---- 007: 関連の1つが紐づかないカード詳細は404 ----
caseTest("IT-A14-02-007", async ({ page, notes, step, expected }) => {
  const 件 = (["A", "B", "C", "D", "E"] as const).map((k, i) => ({ k, id: notes.get(`〔カード詳細ID-A1402-共有${k}〕`), 欠け: ["レイアウト", "レアリティ", "カードセット", "イラストレーター", "プロモ種別"][i] }));
  const rs: 応答[] = [];
  await step(1, async () => { for (const c of 件) rs.push(await 送る(page, c.id)); });
  await step(2, async () => { note(NETWORK); note(件.map((c, i) => `${c.欠け}なし（${c.id}）: 状態 ${rs[i].ステータス}・本文 ${rs[i].本文}`).join(" ／ ")); });
  await expected(async () => {
    件.forEach((c, i) => {
      const r = rs[i];
      expect.soft(r.ステータス, `${c.欠け}が紐づかないカード詳細 ${c.id}: HTTPステータス`).toBe(404);
      expect.soft(Object.keys(r.json ?? {}).sort(), `${c.欠け}なし: 応答JSONの項目（コードとメッセージの2項目）`).toEqual(["code", "message"]);
      expect.soft(値(r.json, "code"), `${c.欠け}なし: コード`).toBe(404);
      expect.soft(値(r.json, "message"), `${c.欠け}なし: メッセージ`).toBe("Not Found");
    });
  });
});

// ---- 013・014: foil が 0・1 で返り、foil_flg は含まれない ----
function Foilを見る(番号: "013" | "014", foil: number): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const id = notes.get(`〔カード詳細ID-A1402-${番号}〕`);
    let db!: ReturnType<typeof カード詳細の値>;
    let r!: 応答;
    await step(1, async () => { db = カード詳細の値(id); note(`DB: Foil=${db.foil}`); });
    await step(2, async () => { r = await 送る(page, id); });
    await step(3, async () => { note(NETWORK); note(`応答: foil=${JSON.stringify(値(r.json, "foil"))}・項目 ${Object.keys(r.json ?? {}).join(",")}`); });
    await expected(async () => {
      expect.soft(db.foil, "DB の Foil").toBe(String(foil));
      expect.soft(r.ステータス, "HTTPステータス").toBe(200);
      expect.soft(値(r.json, "foil"), `foil（整数 ${foil}）`).toBe(foil);
      expect.soft(項目がある(r.json, "foil_flg"), "foil_flg が含まれない").toBe(false);
    });
  };
}
caseTest("IT-A14-02-013", Foilを見る("013", 0));
caseTest("IT-A14-02-014", Foilを見る("014", 1));
