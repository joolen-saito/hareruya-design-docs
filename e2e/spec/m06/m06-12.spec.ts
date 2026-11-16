/** M06-12 買取商品一覧CSV出力項目。正本: cases/M06-12_test_cases.tsv */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { CSVの全行, CSVの内容を画面の枠に出す, CSVの枠のセル, CSVの枠の列 } from "../../lib/evidence_other";
import { OtcListPage } from "../../pages/admin/m06_otc_list";
import { 商品一覧CSV, 商品一覧CSVを読む, 査定IDで検索する } from "../../pages/admin/m06_12_product_csv";
import { M0612_ADMIN, 査定IDの } from "../../seeds/m06-12";

// 買取・明細は、シード（seeds/m06-12.ts）が画面で申込んだ実行の印つきの買取に、DBで足したもの。商品コードは正本の値の末尾に実行の印を付けた値。
const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 検索の注記 = "買取一覧(検索入力)の査定申込日時（初期値は先月1日）と買取日時は空にしてから、査定IDで検索した（シードの申込日時 2026-09-28 が初期値の範囲の外になるため）";
const 見出し = ["商品コード", "在庫増減数", "商品名", "基準価格", "買取価格", "言語ID", "略称タグ", "レアリティ", "状態"];

/** 手順1〜4（査定IDで検索 → 対象にチェック → 買取商品一覧CSV → 開く）。読んだCSVを返す */
async function CSVまで(ctx: CaseCtx, n: string): Promise<商品一覧CSV | null> {
  const { page, step } = ctx;
  await loginAdmin(page, M0612_ADMIN);
  const id = 査定IDの(n);
  const list = new OtcListPage(page);
  let file: import("@playwright/test").Download | null = null;
  let ダウンロードしたCSV: 商品一覧CSV | null = null;
  await step(1, async () => { await 査定IDで検索する(list, id); });
  await step(2, async () => { await list.対象にする(id); });
  await step(3, async () => {
    const r = await list.ダウンロードを押す("買取商品一覧CSV");
    file = r.file;
    expect(file, `買取商品一覧CSVのファイル（応答 ${r.status}${r.ダイアログ.length ? `・画面の確認 ${r.ダイアログ.join(" / ")}` : ""}）`).not.toBeNull();
  });
  await step(4, async () => {
    ダウンロードしたCSV = await 商品一覧CSVを読む(file!);
    await list.ダウンロードの選択肢を閉じる();
    await CSVの内容を画面の枠に出す(page, [{ 題: `ファイル名：${file!.suggestedFilename()}`, 行: CSVの全行(ダウンロードしたCSV) }]);
    expect(ダウンロードしたCSV.見出し, "CSVの見出し").toEqual(見出し);
  });
  note(検索の注記);
  return ダウンロードしたCSV;
}

/** 在庫増減数が一致するデータ行（1行のはず） */
function 行(ダウンロードしたCSV: 商品一覧CSV | null, 数: number): Record<string, string>[] {
  return (ダウンロードしたCSV?.行 ?? []).filter((r) => r["在庫増減数"] === String(数));
}

/** CSVの枠の、在庫増減数が一致する行の列のセル（行が無ければ、無い行を指して確かめが落ちる） */
function 枠のセル(page: CaseCtx["page"], ダウンロードしたCSV: 商品一覧CSV | null, 数: number, 列: string) {
  return CSVの枠のセル(page, 0, (ダウンロードしたCSV?.行 ?? []).findIndex((r) => r["在庫増減数"] === String(数)), 列);
}
/** CSVの枠の、在庫増減数がその数の行（行の数を確かめる） */
function 枠の行(page: CaseCtx["page"], 数: number) {
  return CSVの枠の列(page, 0, "在庫増減数").filter({ hasText: new RegExp(`^${数}$`) });
}

/** 個別入力商品・状態なしの行の確かめ（商品コード・基準価格・略称タグ・レアリティ・状態が空、言語IDが1）。行の数はケースで確かめる */
async function 空の項目を確かめる(page: CaseCtx["page"], ダウンロードしたCSV: 商品一覧CSV | null, 数: number, what: string): Promise<void> {
  for (const k of ["商品コード", "基準価格", "略称タグ", "レアリティ", "状態"]) {
    await expect.soft(枠のセル(page, ダウンロードしたCSV, 数, k), `在庫増減数${数}の行（${what}）の${k}が空`).toHaveText("");
  }
  await expect.soft(枠のセル(page, ダウンロードしたCSV, 数, "言語ID"), `在庫増減数${数}の行（${what}）の言語ID`).toHaveText("1");
}

caseTest("IT-M06-12-004", async (ctx) => {
  const ダウンロードしたCSV = await CSVまで(ctx, "004");
  note("〔商品規格ID-M0612-004B〕（状態SP）の商品コードは、シードが画面で足した規格の別の値（正本は〔商品規格ID-M0612-004A〕と同じ商品コード）。並びは在庫増減数で確かめる");
  await ctx.expected(async () => {
    await expect.soft(CSVの枠の列(ctx.page, 0, "在庫増減数"), "CSVのデータ行の在庫増減数（出力の順）").toHaveText(["11", "12", "13", "14", "15"]);
  });
});

caseTest("IT-M06-12-005", async (ctx) => {
  const ダウンロードしたCSV = await CSVまで(ctx, "005");
  await ctx.expected(async () => {
    const p = ctx.page, c = ダウンロードしたCSV;
    await expect.soft(枠の行(p, 2), "在庫増減数2の行の数").toHaveCount(1);
    await expect.soft(枠のセル(p, c, 2, "基準価格"), "在庫増減数2の行の基準価格（現在の基準価格）").toHaveText("1500");
    await expect.soft(枠のセル(p, c, 2, "状態"), "在庫増減数2の行の状態").toHaveText("NM");
    await expect.soft(枠の行(p, 3), "在庫増減数3の行の数").toHaveCount(1);
    await expect.soft(枠のセル(p, c, 3, "基準価格"), "在庫増減数3の行の基準価格（現在の基準価格）").toHaveText("2500");
    await expect.soft(枠のセル(p, c, 3, "状態"), "在庫増減数3の行の状態").toHaveText("SP");
  });
});

caseTest("IT-M06-12-006", async (ctx) => {
  const ダウンロードしたCSV = await CSVまで(ctx, "006");
  await ctx.expected(async () => {
    await expect.soft(枠の行(ctx.page, 4), "在庫増減数4の行（個別入力商品）の数").toHaveCount(1);
    await 空の項目を確かめる(ctx.page, ダウンロードしたCSV, 4, "個別入力商品");
  });
});

caseTest("IT-M06-12-007", async (ctx) => {
  const ダウンロードしたCSV = await CSVまで(ctx, "007");
  await ctx.expected(async () => {
    await expect.soft(枠の行(ctx.page, 5), "在庫増減数5の行（状態がない商品）の数").toHaveCount(1);
    await 空の項目を確かめる(ctx.page, ダウンロードしたCSV, 5, "状態がない商品");
  });
});

caseTest("IT-M06-12-009", async ({ page, step, expected }) => {
  await loginAdmin(page, M0612_ADMIN);
  const id = 査定IDの("009");
  const list = new OtcListPage(page);
  let r: Awaited<ReturnType<OtcListPage["ダウンロードを押す"]>> | null = null;
  await step(1, async () => {
    await 査定IDで検索する(list, id);
    // チェックを付けずに押すことの確かめになるよう、対象の買取が検索結果に出ている（チェックを付けられた）ことを見る
    expect((await list.行()).map((x) => x.査定ID), `検索結果に査定ID ${id} の買取がある`).toContain(id);
  });
  await step(2, async () => {
    await expect(page.locator('#result_list_main input[type="checkbox"]:checked'), "チェックの付いた買取情報").toHaveCount(0);
    r = await list.ダウンロードを押す("買取商品一覧CSV");
  });
  note(検索の注記);
  await expected(async () => {
    expect.soft(r?.file ?? null, "ダウンロードされたCSV（されない）").toBeNull();
    expect.soft(new URL(page.url()).pathname, "表示された画面（買取検索/一覧）のアドレス").toMatch(/\/otcbuyorder(\/page\/\d+)?$/);
    await expect.soft(list.検索フォーム(), "買取検索/一覧画面の検索欄").toBeVisible();
  });
});

caseTest("IT-M06-12-011", async (ctx) => {
  const ダウンロードしたCSV = await CSVまで(ctx, "011");
  await ctx.expected(async () => {
    await expect.soft(CSVの枠の列(ctx.page, 0, "在庫増減数"), "CSVのデータ行の数（明細3件）").toHaveCount(3);
    await expect.soft(枠の行(ctx.page, 2), "在庫増減数2の行の数").toHaveCount(1);
    const want: Record<string, string> = { 商品コード: rc("M0612-011-A"), 基準価格: "1500", 言語ID: "1", 略称タグ: "M12", レアリティ: "R", 状態: "NM" };
    for (const [k, v] of Object.entries(want)) await expect.soft(枠のセル(ctx.page, ダウンロードしたCSV, 2, k), `在庫増減数2の行の${k}`).toHaveText(v);
    await expect.soft(枠の行(ctx.page, 3), "在庫増減数3の行（状態なしの通常明細）の数").toHaveCount(1);
    await 空の項目を確かめる(ctx.page, ダウンロードしたCSV, 3, "状態なしの通常明細");
    await expect.soft(枠の行(ctx.page, 4), "在庫増減数4の行（個別入力明細）の数").toHaveCount(1);
    await 空の項目を確かめる(ctx.page, ダウンロードしたCSV, 4, "個別入力明細");
  });
});

caseTest("IT-M06-12-012", async (ctx) => {
  const ダウンロードしたCSV = await CSVまで(ctx, "012");
  await ctx.expected(async () => {
    await expect.soft(枠の行(ctx.page, 2), "在庫増減数2の行の数").toHaveCount(1);
    const want: Record<string, string> = { 商品コード: rc("M0612-CB012-P"), 基準価格: "2500", 言語ID: "2", 略称タグ: "M12", レアリティ: "R", 状態: "NM" };
    for (const [k, v] of Object.entries(want)) await expect.soft(枠のセル(ctx.page, ダウンロードしたCSV, 2, k), `在庫増減数2の行の${k}`).toHaveText(v);
  });
});

caseTest("IT-M06-12-013", async (ctx) => {
  const ダウンロードしたCSV = await CSVまで(ctx, "013");
  await ctx.expected(async () => {
    await expect.soft(枠の行(ctx.page, 3), "在庫増減数3の行（状態なしの通常明細）の数").toHaveCount(1);
    await 空の項目を確かめる(ctx.page, ダウンロードしたCSV, 3, "状態なしの通常明細");
  });
});
