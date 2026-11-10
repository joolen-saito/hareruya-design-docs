/**
 * M03-27 グッズ商品CSV登録の続き（-b）。実施不可の見直し（2026-11-10・11）で流せる見込みになったケース。
 * 正本: cases/M03-27_test_cases.tsv。シードでの解釈は seeds/m03-27-b.ts の冒頭と記録 review/M03-27_progress_2026-11-11_dev.md。
 *
 * - グッズ商品CSVには確認モーダルが無く、「CSVファイルをアップロード」を押すと取り込まれる。手順「確認モーダルでアップロードを確定する」は、
 *   モーダルが無いことを注記に残して進める（前回の記録・依頼者決定 2026-10-22 のモーダル省略の扱い）。
 * - 商品名・規格コード・ファイル名は実行の印つき。取込履歴の件数は、この回のファイル名の件数で読む（ほかの方の取込を数えない）。
 * - 共通の正常値のカテゴリ・対象外カテゴリ・部門は、開発環境にあるものへ読み替えた（seeds/m03-27-b.ts）。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { pathOf, topMessages } from "../../pages/admin/m03_21_shelf_number";
import { CsvUploadPage, SubmitResult } from "../../pages/admin/m03_26_card_csv_upload";
import { M0327_ADMIN } from "../../seeds/m03-27";
import { ファイル名, ファイルの場所, 必須欠落の名前, 読み替え } from "../../seeds/m03-27-b";
import { 商品のカテゴリ, 商品のタグ } from "../../db/m03_26_b";
import { グッズの取込履歴, 商品IDのグッズ, 商品名のグッズ, 英名のグッズ, 規格コードのグッズ, 規格画像 } from "../../db/m03_27_b";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 履歴の補い = "取込履歴の件数は、ほかの方の取込を数えないよう、この回の印つきのファイル名の件数で読んだ（正本は取込履歴を0件にしてから全件を見る）";
const コードの補い = "共通の正常値に商品コードが無いが、アプリは商品コードを必須とするので、意図した誤り以外で止まらないよう印つきの商品コードを入れた";
const カテゴリの補い = "開発環境では対象カテゴリ（正本 2・12・27・177）・対象外カテゴリ（正本 299）が無いか別の場所にあるので、開発環境のカテゴリへ読み替えた";

async function signIn(page: Page): Promise<CsvUploadPage> {
  await loginAdmin(page, M0327_ADMIN);
  return new CsvUploadPage(page, "グッズ商品");
}
type 取込の結果 = { r: SubmitResult | null; 成功: string[]; エラー: string[] };
async function 選んで押す(page: Page, up: CsvUploadPage, 正本のファイル名: string): Promise<取込の結果> {
  await up.choose(ファイルの場所(正本のファイル名));
  const r = await up.pressUpload();
  const m = await topMessages(page);
  note(`${ファイル名(正本のファイル名)} を選んで「CSVファイルをアップロード」を押した: 要求 ${r && r.sent ? `送った（応答 ${r.status}）` : "送っていない"}・画面上部 ${[...m.成功.map((t) => `成功「${t}」`), ...m.エラー.map((t) => `エラー「${t}」`)].join(" / ") || "なし"}`);
  return { r, 成功: m.成功, エラー: m.エラー };
}
async function モーダルを確かめる(page: Page): Promise<void> {
  note(`確認モーダル: ${(await page.locator(".modal.show").isVisible().catch(() => false)) ? "開いている" : "無い（「CSVファイルをアップロード」で取り込まれた。モーダル省略の扱い）"}`);
}

/**
 * 手順4つの形（1 画面を開く・2 選んで押す・3 確認モーダルで確定・4 DB で確かめる）と3つの形（4 が無い）。
 * 期待結果は「確かめる」で書く。
 */
function 取込のケース(正本のファイル名: string, 手順の数: 3 | 4, 確かめる: (ctx: CaseCtx, x: 取込の結果, up: CsvUploadPage) => Promise<void>, 補い: string[] = []) {
  return async (ctx: CaseCtx): Promise<void> => {
    for (const m of 補い) supplement(m);
    const up = await signIn(ctx.page);
    let x!: 取込の結果;
    await ctx.step(1, async () => { await up.open(); });
    await ctx.step(2, async () => { x = await 選んで押す(ctx.page, up, 正本のファイル名); });
    await ctx.step(3, async () => { await モーダルを確かめる(ctx.page); });
    if (手順の数 === 4) await ctx.step(4, async () => { note("DB で確かめる（期待結果の確かめを参照）"); });
    await ctx.expected(async () => {
      expect.soft(x.r !== null && x.r.sent, "取込の要求が送られた").toBe(true);
      await 確かめる(ctx, x, up);
    });
  };
}

const 商品の数 = (名前: string) => 商品名のグッズ(rc(名前)).length;
const 履歴 = (f: string) => グッズの取込履歴(ファイル名(f));

// ---- 011: 必須項目だけの行で追加される（任意項目・スマレジ商品コード・部門IDは空） ----
caseTest("IT-M03-27-011", 取込のケース("required-only-011.csv", 4, async () => {
  const rows = 商品名のグッズ(rc("必須項目グッズ-011"));
  expect.soft(rows.length, "「必須項目グッズ-011」の商品の件数（1件追加）").toBe(1);
  const r = rows[0];
  const 空 = (v: string | null | undefined) => (r ? (v ?? "") : "（商品が無い）");
  expect.soft(空(r?.規格コード), "商品コード（空のまま）").toBe("");
  expect.soft(空(r?.スマレジ商品コード), "スマレジ商品コード（空のまま）").toBe("");
  expect.soft(空(r?.部門), "部門ID（空のまま）").toBe("");
}));

// ---- 取り込まれず、取込履歴も増えない ----
/** 取り込まれず、取込履歴も増えないことの確かめ */
const 取り込まれない = (正本のファイル名: string, 名前: string[], 追加の確かめ?: () => void) => async (): Promise<void> => {
  for (const n of 名前) expect.soft(商品の数(n), `「${n}」の商品が追加されない`).toBe(0);
  expect.soft(履歴(正本のファイル名), `${正本のファイル名} の取込履歴が増えない`).toBe(0);
  追加の確かめ?.();
};
caseTest("IT-M03-27-013", 取込のケース("invalid-category-013.csv", 4, 取り込まれない("invalid-category-013.csv", ["対象外カテゴリグッズ"]), [履歴の補い, コードの補い, カテゴリの補い]));
caseTest("IT-M03-27-014", 取込のケース("missing-required-014.csv", 4, async () => {
  // 商品名(日)を空にした行は英語の名前（「…-en」）でも確かめる
  for (const n of 必須欠落の名前) {
    const 件数 = 商品名のグッズ(rc(n)).length + 英名のグッズ(rc(`${n}-en`)).length;
    expect.soft(件数, `「${n}」の行の商品が追加されない`).toBe(0);
  }
  expect.soft(履歴("missing-required-014.csv"), "missing-required-014.csv の取込履歴が増えない").toBe(0);
}, [履歴の補い, コードの補い]));
caseTest("IT-M03-27-048", 取込のケース("mixed-valid-invalid-048.csv", 4, 取り込まれない("mixed-valid-invalid-048.csv", ["混在正常グッズ", "混在不正グッズ"]), [履歴の補い, コードの補い]));
caseTest("IT-M03-27-078", 取込のケース("dup-rows-M0327-078.csv", 4, 取り込まれない("dup-rows-M0327-078.csv", ["重複行甲-M0327-078", "重複行乙-M0327-078"], () => {
  expect.soft(規格コードのグッズ(rc("GOODS-NEW-M0327-078")).length, "規格コード GOODS-NEW-M0327-078 の商品が追加されない").toBe(0);
}), [履歴の補い]));
caseTest("IT-M03-27-037", 取込のケース("nonexistent-id-037.csv", 4, async ({ notes }) => {
  expect.soft(商品IDのグッズ("999999037").length, "存在しない商品ID 999999037 の商品が追加されない").toBe(0);
  const r = 商品IDのグッズ(notes.get("〔商品ID-M0327-037〕"));
  expect.soft(r[0]?.商品名日 ?? "（商品が無い）", "同じCSVの商品の名称(日)（更新されない）").toBe(rc("更新前グッズ-037"));
  expect.soft(履歴("nonexistent-id-037.csv"), "nonexistent-id-037.csv の取込履歴が増えない").toBe(0);
}, [履歴の補い]));
caseTest("IT-M03-27-038", 取込のケース("duplicate-code-038.csv", 4, async () => {
  expect.soft(商品の数("商品コード重複"), "「商品コード重複」の商品が追加されない").toBe(0);
  expect.soft(規格コードのグッズ(rc("GOODS-OLD-001-038")).length, "規格コード GOODS-OLD-001-038 の規格（既存の1件のまま）").toBe(1);
  expect.soft(履歴("duplicate-code-038.csv"), "duplicate-code-038.csv の取込履歴が増えない").toBe(0);
}, [履歴の補い]));

// ---- 画面へ戻る（3つの手順） ----
/** 取込のあと、グッズ商品CSV登録画面へ戻ることの確かめ */
const 画面へ戻る = async ({ page }: CaseCtx, x: 取込の結果, up: CsvUploadPage): Promise<void> => {
  if (x.r && x.r.sent) expect.soft(x.r.status, "取込の要求の応答（この画面へ戻す転送）").toBe(302);
  expect.soft(pathOf(page.url()), "取込のあとの画面（グッズ商品CSV登録画面）").toBe(up.path());
};
caseTest("IT-M03-27-041", 取込のケース("limit-5010-041.csv", 3, 画面へ戻る));
caseTest("IT-M03-27-049", 取込のケース("mixed-valid-invalid-049.csv", 3, 画面へ戻る, [コードの補い]));

// ---- 050: エラーが2件以上 ----
caseTest("IT-M03-27-050", async (ctx) => {
  supplement(コードの補い); supplement(カテゴリの補い);
  const up = await signIn(ctx.page);
  let x!: 取込の結果; let 件数 = 0;
  await ctx.step(1, async () => { await up.open(); });
  await ctx.step(2, async () => { x = await 選んで押す(ctx.page, up, "multiple-errors-050.csv"); });
  await ctx.step(3, async () => { await モーダルを確かめる(ctx.page); });
  await ctx.step(4, async () => {
    const lines = x.エラー.flatMap((t) => t.split(/\s*(?=\d+\s*行目)/)).filter((t) => /\S/.test(t));
    件数 = lines.length;
    note(`画面上部のエラー: ${x.エラー.join(" / ") || "なし"}（行に分けた件数 ${件数}）`);
  });
  await ctx.expected(async () => {
    expect.soft(x.r !== null && x.r.sent, "取込の要求が送られた").toBe(true);
    expect.soft(件数, "画面上部のエラーメッセージの件数（2件以上）").toBeGreaterThanOrEqual(2);
    expect.soft(x.エラー.join(" "), "商品名(日)の必須の誤りのメッセージ").toMatch(/商品名\(日\)/);
    expect.soft(x.エラー.join(" "), "商品カテゴリ(ID)の誤りのメッセージ").toMatch(/商品カテゴリ/);
  });
});

// ---- 追加されてタグ・カテゴリが付く ----
/** 商品が1件追加され、その商品について確かめる */
const 一つ追加 = (名前: string, 確かめる: (商品ID: string) => void) => async (): Promise<void> => {
  const rows = 商品名のグッズ(rc(名前));
  const ids = [...new Set(rows.map((r) => r.商品ID))];
  expect.soft(ids.length, `「${名前}」の商品の件数（1件追加）`).toBe(1);
  if (ids[0]) 確かめる(ids[0]);
};
caseTest("IT-M03-27-064", 取込のケース("m0327-064-salestag.csv", 4, 一つ追加("売上分析複数-M0327-064", (id) => {
  expect.soft(商品のタグ(id).売上分析タグ, "関連付く売上分析タグ（8・9 だけ）").toEqual(["8", "9"]);
})));
caseTest("IT-M03-27-065", 取込のケース("m0327-065-tag.csv", 4, 一つ追加("タグ複数-M0327-065", (id) => {
  expect.soft(商品のタグ(id).タグ, "関連付く商品タグ（8・18 だけ）").toEqual(["8", "18"]);
})));
caseTest("IT-M03-27-073", 取込のケース("cat-one-M0327-073.csv", 4, 一つ追加("カテゴリ単一-M0327-073", (id) => {
  supplement("開発環境ではカテゴリID 2 が最上位で、祖先のカテゴリは無い。関連付くカテゴリは 2 だけと読んだ");
  expect.soft(商品のカテゴリ(id), "関連付く商品カテゴリ（カテゴリID 2 と祖先だけ）").toEqual(["2"]);
})));
caseTest("IT-M03-27-074", 取込のケース("m0327-074-salestag.csv", 4, 一つ追加("売上分析単一-M0327-074", (id) => {
  expect.soft(商品のタグ(id).売上分析タグ, "関連付く売上分析タグ（8 だけ）").toEqual(["8"]);
})));
caseTest("IT-M03-27-075", 取込のケース("m0327-075-tag.csv", 4, 一つ追加("タグ単一-M0327-075", (id) => {
  expect.soft(商品のタグ(id).タグ, "関連付く商品タグ（8 だけ）").toEqual(["8"]);
})));

// ---- 077: 同じファイルを2回取り込む（5つの手順） ----
caseTest("IT-M03-27-077", async (ctx) => {
  supplement(履歴の補い);
  const up = await signIn(ctx.page);
  let x1!: 取込の結果; let x2!: 取込の結果;
  await ctx.step(1, async () => { await up.open(); });
  await ctx.step(2, async () => { x1 = await 選んで押す(ctx.page, up, "reimport-M0327-077.csv"); });
  await ctx.step(3, async () => { await モーダルを確かめる(ctx.page); });
  await ctx.step(4, async () => { await up.open(); x2 = await 選んで押す(ctx.page, up, "reimport-M0327-077.csv"); await モーダルを確かめる(ctx.page); });
  await ctx.step(5, async () => { note("DB で確かめる（期待結果の確かめを参照）"); });
  await ctx.expected(async () => {
    expect.soft(x1.r !== null && x1.r.sent && x2.r !== null && x2.r.sent, "1回目・2回目とも取込の要求が送られた").toBe(true);
    expect.soft(規格コードのグッズ(rc("GOODS-NEW-M0327-077")).length, "規格コード GOODS-NEW-M0327-077 の商品（1件のまま）").toBe(1);
    expect.soft(履歴("reimport-M0327-077.csv"), "reimport-M0327-077.csv の取込履歴（1件のまま）").toBe(1);
  });
});

// ---- 既存の商品を更新する ----
/** 既存の商品の更新の確かめ（同期の関数を、取込のケースの確かめに合わせる） */
const 更新 = (確かめる: (ctx: CaseCtx) => void) => async (ctx: CaseCtx): Promise<void> => { 確かめる(ctx); };
caseTest("IT-M03-27-018", 取込のケース("region-empty-018.csv", 4, 更新(({ notes }) => {
  const r = 商品IDのグッズ(notes.get("〔商品ID-M0327-018〕"));
  expect.soft(r[0]?.地域別販売制限 ?? "（商品が無い）", "地域別販売制限（既定値0）").toBe("0");
})));
caseTest("IT-M03-27-032", 取込のケース("sale-update-032.csv", 4, 更新(({ notes }) => {
  const r = 商品IDのグッズ(notes.get("〔商品ID-M0327-032〕"))[0];
  expect.soft(r?.セール ?? false, "セールフラグ（有効のまま）").toBe(true);
  expect.soft(r?.基準価格 ?? null, "基準価格（350 に更新）").toBe(350);
  expect.soft(r?.販売価格 ?? null, "販売価格（更新前の150のまま）").toBe(150);
})));
caseTest("IT-M03-27-035", 取込のケース("image-empty-035.csv", 4, 更新(({ notes }) => {
  expect.soft(規格画像(notes.get("〔商品ID-M0327-035〕")), "規格画像（更新前の画像が保持される）").toEqual(["img/goods/L/OLD/27001035.jpg"]);
})));
caseTest("IT-M03-27-036", 取込のケース("shipping-only-036.csv", 4, 更新(({ notes }) => {
  const r = 商品IDのグッズ(notes.get("〔商品ID-M0327-036〕"))[0];
  expect.soft(r?.発送日目安 ?? "（商品が無い）", `規格の発送日目安（変更されない。正本の 736 は ${読み替え.発送日目安} に読み替えた）`).toBe(読み替え.発送日目安);
}), ["規格の発送日目安（正本 736）は、開発環境に 736 が無いので開発環境の発送日目安の番号に読み替え、DB で書き足した"]));
caseTest("IT-M03-27-071", 取込のケース("update-multi-M0327-071.csv", 4, 更新(({ notes }) => {
  const a = 商品IDのグッズ(notes.get("〔商品ID-M0327-071A〕"))[0], b = 商品IDのグッズ(notes.get("〔商品ID-M0327-071B〕"))[0];
  expect.soft(a?.商品名日 ?? "（商品が無い）", "商品A の名称(日)").toBe(rc("更新後グッズ-M0327-071A"));
  expect.soft(a?.重量 ?? null, "商品A の重量").toBe("200");
  expect.soft([a?.販売価格 ?? null, a?.基準価格 ?? null], "商品A の販売価格・基準価格（ともに250）").toEqual([250, 250]);
  expect.soft(b?.商品名日 ?? "（商品が無い）", "商品B の名称(日)").toBe(rc("更新後グッズ-M0327-071B"));
  expect.soft(b?.重量 ?? null, "商品B の重量").toBe("210");
  expect.soft([b?.販売価格 ?? null, b?.基準価格 ?? null], "商品B の販売価格・基準価格（ともに350）").toEqual([350, 350]);
  expect.soft(規格コードのグッズ(rc("GOODS-OLD-M0327-071-A")).length + 規格コードのグッズ(rc("GOODS-OLD-M0327-071-B")).length, "2商品の規格の件数（増えない）").toBe(2);
})));
caseTest("IT-M03-27-072", 取込のケース("mix-M0327-072.csv", 4, 更新(({ notes }) => {
  const n = 規格コードのグッズ(rc("GOODS-NEW-M0327-072"));
  expect.soft(n.length, "規格コード GOODS-NEW-M0327-072 の商品（1件追加）").toBe(1);
  expect.soft(n[0]?.商品名日 ?? "（商品が無い）", "追加された商品の名称(日)").toBe(rc("新規グッズ-M0327-072"));
  const o = 商品IDのグッズ(notes.get("〔商品ID-M0327-072〕"))[0];
  expect.soft(o?.商品名日 ?? "（商品が無い）", "既存の商品の名称(日)（更新後）").toBe(rc("更新後グッズ-M0327-072"));
  expect.soft(履歴("mix-M0327-072.csv"), "mix-M0327-072.csv の取込履歴（1件増える）").toBe(1);
}), [履歴の補い]));
