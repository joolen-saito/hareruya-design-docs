// 取り込み注記: 同じ機能を main 側（別の方）も実装していたため、栗野側の版を別ファイルにした。main に無いケースだけを残している（main にあるケースは main を優先して除いた）。
/**
 * M14-10 フォーマット詳細(登録・編集・削除) の続き（管理画面の保存・削除と、開発者ツールでの書き換え）。正本: cases/M14-10_test_cases.tsv
 *
 * - フォーマット・カードの名前は、末尾に実行の印を付けて作り、正本の名前も同じ印つきの名前として読む（seeds/m14-10.ts の冒頭）。
 *   値そのもの（最小値・最大値・全角文字）を確かめる 014・015・018 と、更新後の値を確かめるだけの 009 の入力値には付けない。
 * - 正本の「登録ボタン」は、フォーマット詳細画面の送信ボタン（画面の表示名「登録」）。
 * - 正本の「ポップアップで「実行」」は、削除の確認ポップアップの「削除」ボタン（画面の表示名「削除」）。
 * - 正本の手順「開発者ツールで…を変更する／削除する」は、画面の上でフォームの送信先・なりすまし対策トークン（削除はポップアップのボタンの
 *   送り先・トークン）を書き換えて行う。
 * - 正本の手順「ブラウザのネットワーク応答を確認する」は、押したときに送った要求への応答の HTTP ステータスを控える手順として行う。
 * - 正本の手順「DBで…を確認する」は、DBを参照して値を読む手順として行い、期待結果でその値を確かめる。
 * - 認定「M14-10試験認定」は、既にある認定に読み替えることがある（S-M14-10-CERT。注記「シード作成時の問題」に出る）。
 *
 * 実装しないケース: 047（シード表のデッキを画面で作れない。seeds/m14-10.ts の冒頭）。
 */
import { Page, test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { フォーマットの保存値, 名のフォーマット, 番号のフォーマットの件数, 統率の保存 } from "../../db/m14_10_format_k";
import type { フォーマットの保存値 as 保存値型 } from "../../db/m14_10_format_k";
import { カードの指定, フォーマットの記録, フォーマットの指定 } from "../../db/m14_09_format";
import { FormatListPage, 削除の結果, 画面上部のメッセージ, フォーマット一覧のパス, フォーマット詳細のパス, pathOf } from "../../pages/admin/m14_09_format_list";
import { FormatEditPage, 送信の結果 } from "../../pages/admin/m14_10_format_detail";
import { M1410_ADMIN, 名, 試験認定 } from "../../seeds/m14-10";
import "../../seeds/m14-10-c"; // 取り込みで抜けた登録を戻す: main 側が作り方を登録している seeds を読み込む（二重定義ではない）

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 登録の注記 = () => note("正本の「登録ボタン」は、フォーマット詳細画面の送信ボタン（画面の表示名は「登録」）として押した");
const 実行の注記 = () => note("正本の「ポップアップで「実行」」は、削除の確認ポップアップの「削除」ボタン（画面の表示名は「削除」）として押した");
const 送信の文 = (r: 送信の結果) => `送った要求の応答 ${r.要求の応答 ?? "なし"}、移った画面 ${r.移った画面}（応答 ${r.移った画面の応答 ?? "なし"}）`;

async function 詳細画面(page: Page, id?: string): Promise<FormatEditPage> {
  await loginAdmin(page, M1410_ADMIN);
  const d = new FormatEditPage(page);
  if (id === undefined) await d.openNew();
  else expect(await d.open(id), `フォーマットID ${id} のフォーマット詳細画面の応答`).toBe(200);
  return d;
}

async function 押して控える(d: FormatEditPage): Promise<送信の結果> {
  登録の注記();
  const r = await d.登録を押す();
  if (!r.sent) note("ブラウザの入力チェックが送信を止めた（要求は送られていない）");
  else note(送信の文(r));
  return r;
}

/** 保存値の確かめ（チェックは "true"/"false"） */
function 保存値を確かめる(v: 保存値型 | null, want: Partial<Record<keyof 保存値型, string | null>>, what: string): void {
  expect(v, `${what}の記録がある`).not.toBeNull();
  if (!v) return;
  for (const [k, w] of Object.entries(want)) expect.soft(v[k as keyof 保存値型], `${what}の${k}`).toBe(w);
}

// ---------------------------------------------------------------------------
// 存在しない識別子で開く
// ---------------------------------------------------------------------------

caseTest("IT-M14-10-006", async ({ page, step, expected }) => {
  await loginAdmin(page, M1410_ADMIN);
  let status = 0;
  await step(1, async () => { status = await new FormatEditPage(page).open("999999"); });
  await step(2, async () => { note(`アドレスの番号を 999999 にして開いた画面の応答は ${status}`); });
  await expected(async () => {
    expect(status, "識別子999999のフォーマット詳細画面の応答（該当なし）").toBe(404);
  });
});

caseTest("IT-M14-10-009", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔フォーマットID-M1410-009〕");
  let d!: FormatEditPage;
  let v: 保存値型 | null = null;
  await step(1, async () => { d = await 詳細画面(page, id); });
  await step(2, async () => {
    await d.入れる({ 名日: "更新後フォーマット", 名英: "Updated Format", コード: "UPDATED", 並び順: "200", メタゲーム分析日数: "30", ルール日: "更新後ルール", ルール英: "Updated rule" });
  });
  await step(3, async () => {
    await d.入れる({ 認定: 試験認定, デッキ検索: true, 商品検索: true, ランキング: true, メタ分布簡易化: true, ARENA: true, 基本土地: true, デッキビルダー: true, イベント: true, ハイランダー: true });
    if (試験認定 !== "M14-10試験認定") note(`認定は「M14-10試験認定」の代わりに「${試験認定}」を選んだ（S-M14-10-CERT の読み替え）`);
  });
  await step(4, async () => { await 押して控える(d); });
  await step(5, async () => { v = フォーマットの保存値(id); });
  await expected(async () => {
    expect.soft(v?.フォーマット名日, `ID ${id} のフォーマット名(日)`).toBe("更新後フォーマット");
    保存値を確かめる(v, {
      フォーマット名日: "更新後フォーマット", フォーマット名英: "Updated Format", フォーマットコード: "UPDATED", 並び順: "200", メタゲーム分析日数: "30",
      ルール日: "更新後ルール", ルール英: "Updated rule", 認定: 試験認定,
      デッキ検索: "true", 商品検索: "true", ランキング: "true", メタ分布簡易化: "true", ARENA: "true", 基本土地: "true", デッキビルダー: "true", イベント: "true",
      ハイランダー: "true",
    }, `ID ${id} のフォーマット`);
  });
});

caseTest("IT-M14-10-014", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔フォーマットID-M1410-014〕");
  let d!: FormatEditPage;
  let r!: 送信の結果;
  await step(1, async () => { d = await 詳細画面(page, id); });
  await step(2, async () => { await d.入れる({ 名日: "入力保持確認", 名英: "ＦＯＲＭＡＴ" }); });
  await step(3, async () => {
    r = await 押して控える(d);
    note(`再表示された画面の入力エラー: ${(await d.入力エラー()).join(" / ") || "なし"}`);
  });
  await expected(async () => {
    expect.soft(r.sent, "登録の要求が送られた").toBe(true);
    expect.soft(pathOf(page.url()), `再表示された画面（ID ${id} のフォーマット詳細画面のアドレス）`).toBe(フォーマット詳細のパス(id));
    await expect.soft(d.文字の欄("名日"), "フォーマット名(日)に保持された値").toHaveValue("入力保持確認");
    await expect.soft(d.文字の欄("名英"), "フォーマット名(英)に保持された値").toHaveValue("ＦＯＲＭＡＴ");
  });
});

caseTest("IT-M14-10-015", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔フォーマットID-M1410-015〕");
  let d!: FormatEditPage;
  let v: 保存値型 | null = null;
  await step(1, async () => { d = await 詳細画面(page, id); });
  await step(2, async () => { await d.入れる({ 名日: "あ", 名英: "A", コード: "B", 並び順: "1", メタゲーム分析日数: "1" }); });
  await step(3, async () => { await 押して控える(d); });
  await step(4, async () => { v = フォーマットの保存値(id); });
  await expected(async () => {
    expect.soft(v?.フォーマット名日, `ID ${id} のフォーマット名(日)（最小の1文字）`).toBe("あ");
    保存値を確かめる(v, { フォーマット名日: "あ", フォーマット名英: "A", フォーマットコード: "B", 並び順: "1", メタゲーム分析日数: "1" }, `ID ${id} のフォーマット`);
  });
});

caseTest("IT-M14-10-018", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔フォーマットID-M1410-018〕");
  let d!: FormatEditPage;
  let v: 保存値型 | null = null;
  let 統率: ReturnType<typeof 統率の保存> = [];
  const 日64 = "あ".repeat(64), 英64 = "A".repeat(64), コード10 = "C".repeat(10), 規 = "規".repeat(65535), R = "R".repeat(65535);
  await step(1, async () => { d = await 詳細画面(page, id); });
  await step(2, async () => {
    await d.入れる({ 名日: 日64, 名英: 英64, コード: コード10, 並び順: "10000", メイン上限: "4096", メイン下限: "4096", サイド上限: "4096", サイド下限: "4096", メタゲーム分析日数: "10000", ルール日: 規, ルール英: R });
  });
  await step(3, async () => { await d.入れる({ 統率使用: true, 統率上限: "4096", 統率下限: "4096" }); });
  await step(4, async () => {
    const r = await 押して控える(d);
    if (r.sent) note(`保存後の画面の入力エラー: ${(await d.入力エラー()).join(" / ") || "なし"}`);
  });
  await step(5, async () => { v = フォーマットの保存値(id); 統率 = 統率の保存(id); });
  await expected(async () => {
    保存値を確かめる(v, {
      フォーマット名日: 日64, フォーマット名英: 英64, フォーマットコード: コード10, 並び順: "10000", メイン上限: "4096", メイン下限: "4096", サイド上限: "4096", サイド下限: "4096",
      メタゲーム分析日数: "10000", 統率使用: "true",
    }, `ID ${id} のフォーマット`);
    expect.soft(v?.ルール日?.length ?? 0, "ルール説明(日)の文字数").toBe(65535);
    expect.soft(v?.ルール英?.length ?? 0, "ルール説明(英)の文字数").toBe(65535);
    expect.soft(統率.map((x) => [x.上限, x.下限]), "統率上限枚数・統率下限枚数").toEqual([["4096", "4096"]]);
  });
});

caseTest("IT-M14-10-022", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔フォーマットID-M1410-022〕");
  let d!: FormatEditPage;
  let r!: 送信の結果;
  let v: 保存値型 | null = null;
  await step(1, async () => { d = await 詳細画面(page, id); });
  await step(2, async () => { await d.入れる({ 名日: "トークン改ざん更新" }); });
  await step(3, async () => { await d.トークンを書き換える("invalid-token"); });
  await step(4, async () => { r = await 押して控える(d); });
  await step(5, async () => { v = フォーマットの保存値(id); });
  await expected(async () => {
    expect.soft(r.要求の応答, "更新の要求への応答（アクセス拒否）").toBe(403);
    expect.soft(v?.フォーマット名日, `ID ${id} のフォーマット名(日)（更新されない）`).toBe(名("編集前フォーマット-022"));
  });
});

caseTest("IT-M14-10-023", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔フォーマットID-M1410-023〕");
  let d!: FormatEditPage;
  let r!: 送信の結果;
  let n = -1;
  await step(1, async () => { d = await 詳細画面(page, id); });
  await step(2, async () => { await d.入れる({ 名日: "存在なし更新" }); });
  await step(3, async () => { await d.送信先の識別子を書き換える("999999"); await d.トークンを書き換える("invalid-token"); });
  await step(4, async () => { r = await 押して控える(d); });
  await step(5, async () => { n = 番号のフォーマットの件数("999999"); });
  await expected(async () => {
    expect.soft(r.要求の応答, "保存の要求への応答（該当なし）").toBe(404);
    expect.soft(n, "識別子999999のフォーマットの件数").toBe(0);
  });
});

caseTest("IT-M14-10-070", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔フォーマットID-M1410-070〕");
  let d!: FormatEditPage;
  let r!: 送信の結果;
  let n = -1;
  await step(1, async () => { d = await 詳細画面(page, id); });
  await step(2, async () => { await d.入れる({ 名日: "存在なし更新-070" }); });
  await step(3, async () => { await d.送信先の識別子を書き換える("999999"); note("なりすまし対策トークンは画面が出した値のまま変えていない"); });
  await step(4, async () => { r = await 押して控える(d); });
  await step(5, async () => { n = 番号のフォーマットの件数("999999"); });
  await expected(async () => {
    expect.soft(r.要求の応答, "保存の要求への応答（該当なし）").toBe(404);
    expect.soft(n, "識別子999999のフォーマットの件数").toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 画面の項目
// ---------------------------------------------------------------------------

caseTest("IT-M14-10-056", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔フォーマットID-M1410-056〕");
  let labels: string[] = [];
  await step(1, async () => { await 詳細画面(page, id); });
  await step(2, async () => { labels = await new FormatEditPage(page).項目のラベル(); note(`入力欄のラベル（上から）: ${labels.join("、")}`); });
  await expected(async () => {
    expect(labels.length, "読めた入力欄のラベルの数").toBeGreaterThan(0);
    for (const w of ["カードセット", "禁止カード", "制限カード"]) {
      expect.soft(labels.filter((l) => l.includes(w)), `「${w}」の入力欄のラベル`).toEqual([]);
    }
  });
});

// ---------------------------------------------------------------------------
// 削除（編集画面の削除ボタン）
// ---------------------------------------------------------------------------

/** 削除ボタンを押し、（書き換えて）ポップアップの「削除」を押す。手順の番号は呼ぶ側の正本に合わせる */
async function 削除する(ctx: Pick<CaseCtx, "page" | "step">, id: string, 手順: { 開く: number; 押す: number; 書き換え?: number; 実行: number }, 書き換え?: (list: FormatListPage) => Promise<void>, 実行と書く = true): Promise<削除の結果> {
  const { page, step } = ctx;
  let list!: FormatListPage;
  let r!: 削除の結果;
  await step(手順.開く, async () => { await 詳細画面(page, id); });
  await step(手順.押す, async () => { list = await new FormatEditPage(page).削除を押す(id); });
  if (手順.書き換え !== undefined) await step(手順.書き換え, async () => { await 書き換え!(list); });
  await step(手順.実行, async () => {
    if (実行と書く) 実行の注記();
    r = await list.ポップアップで削除を実行する();
    const m = await 画面上部のメッセージ(page);
    note(`削除の要求の応答 ${r.要求の応答}、移った画面 ${r.移った画面}（応答 ${r.移った画面の応答 ?? "なし"}）、画面上部のメッセージ: 成功「${m.成功.join(" / ")}」エラー「${m.エラー.join(" / ")}」`);
  });
  return r;
}

caseTest("IT-M14-10-044", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔フォーマットID-M1410-044〕");
  const r = await 削除する({ page, step }, id, { 開く: 1, 押す: 2, 書き換え: 3, 実行: 4 }, (list) => list.削除の対象を書き換える("999999"));
  await step(5, async () => { note(`削除の要求への応答は ${r.要求の応答}`); });
  await expected(async () => {
    expect(r.要求の応答, "削除の要求への応答（該当なし）").toBe(404);
  });
});

caseTest("IT-M14-10-045", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔フォーマットID-M1410-045〕");
  const r = await 削除する({ page, step }, id, { 開く: 1, 押す: 2, 書き換え: 3, 実行: 4 }, async (list) => {
    await list.削除の対象を書き換える("999999");
    await list.削除のトークンを書き換える("invalid-token");
  });
  await step(5, async () => { note(`削除の要求への応答は ${r.要求の応答}`); });
  await expected(async () => {
    expect(r.要求の応答, "削除の要求への応答（なりすまし対策トークンの判定が先でアクセス拒否）").toBe(403);
  });
});

/** 紐づきがあって削除できないフォーマットが残ること（046・048） */
function 削除されずに残る(呼び名: string) {
  return async ({ page, notes, step, expected }: CaseCtx) => {
    const id = notes.get(呼び名);
    await 削除する({ page, step }, id, { 開く: 1, 押す: 2, 実行: 3 });
    let v!: ReturnType<typeof フォーマットの記録>;
    await step(4, async () => { v = フォーマットの記録(id); });
    await expected(async () => {
      expect.soft(v.ある, `ID ${id} のフォーマットの記録がある`).toBe(true);
      expect(v.削除済み, `ID ${id} のフォーマットが削除済みに変わっていない`).toBe(false);
    });
  };
}
