/**
 * M06-10 戻しリストCSV出力（店頭買取）（追加分）。正本: cases/M06-10_test_cases.tsv（004・006・007）
 *
 * シードは seeds/m06-10-e.ts。読み替えは spec/m06/m06-10.spec.ts と同じ（本店の閾値は同じ閾値の試験用の店舗で代える・査定IDは画面が振った値・商品名は実行の印つき）。
 * 実装していないケース（理由は報告）: 005・014・015・017（棚番号 A01 は本店（店舗ID 1）の買取だけに出る。本店の閾値は共有の設定）。
 */
import { test } from "@playwright/test";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { CSVの全行, CSVの内容を画面の枠に出す, CSVの枠のセル } from "../../lib/evidence_other";
import { rc } from "../../lib/run_marker";
import { OtcListPage } from "../../pages/admin/m06_otc_list";
import { CSVを読む } from "../../pages/admin/m07_buy";
import { M0610_ADMIN, 査定の呼び名 } from "../../seeds/m06-10";
import "../../seeds/m06-10-e";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

type CSV = Awaited<ReturnType<typeof CSVを読む>>;

/** 手順1〜5。CSV を返す */
async function 手順1から5(ctx: CaseCtx, 査定ID: string): Promise<CSV> {
  const { page, step } = ctx;
  await loginAdmin(page, M0610_ADMIN);
  const list = new OtcListPage(page);
  let file: Awaited<ReturnType<OtcListPage["ダウンロードを押す"]>> | null = null;
  let csv: CSV | null = null;
  await step(1, async () => { await list.open(); });
  await step(2, async () => {
    await list.査定IDを入れる(査定ID);
    note("手順2の査定IDは、申込完了画面で控えた査定ID（正本の決め打ちの査定IDは画面が振るため使えない）");
    await list.検索する();
  });
  await step(3, async () => { await list.対象にする(査定ID); });
  await step(4, async () => {
    file = await list.ダウンロードを押す("戻しリストCSV");
    if (file.ダイアログ.length) note(`戻しリストCSVを押すと警告が出た: ${file.ダイアログ.join(" / ")}`);
  });
  await step(5, async () => {
    expect(file!.file, `戻しリストCSVのファイル（応答 ${file!.status}）`).not.toBeNull();
    csv = await CSVを読む(file!.file!);
    await list.ダウンロードの選択肢を閉じる();
    await CSVの内容を画面の枠に出す(page, [{ 題: `ファイル名：${file!.file!.suggestedFilename()}`, 行: CSVの全行(csv) }]);
  });
  return csv!;
}

/** CSVの枠の、商品名（印つきの名前を含む）の行の列のセル（行が無ければ、無い行を指して確かめが落ちる） */
const 枠のセル = (ctx: CaseCtx, csv: CSV, 名: string, 列: string) => CSVの枠のセル(ctx.page, 0, csv.行.findIndex((r) => (r["商品名"] ?? "").includes(rc(名))), 列);

caseTest("IT-M06-10-004", async (ctx) => {
  const csv = await 手順1から5(ctx, ctx.notes.get(査定の呼び名("M0610-003-004")));
  await ctx.expected(async () => {
    note("閾値100・500・1000円の「本店」は、同じ閾値の試験用の店舗で確かめた。サプライ品は商品名に実行の印を付けて作った（カード属性との紐づけなし）");
    await expect.soft(枠のセル(ctx, csv, "戻し確認サプライ-004", "ピッキング区分"), "サプライ品「戻し確認サプライ-004」のピッキング区分").toHaveText("サプライ");
  });
});

caseTest("IT-M06-10-006", async (ctx) => {
  const csv = await 手順1から5(ctx, ctx.notes.get(査定の呼び名("M0610-006-006")));
  await ctx.expected(async () => {
    note("カードは既存の日本語・状態NMの規格（非Foilは「通常カード-006」、Foilはカード詳細のFoilを付けた「Foilカード-006」）。サプライ品は商品名に実行の印を付けて作った");
    await expect.soft(枠のセル(ctx, csv, "通常カード-006", "言語/状態"), "非Foil商品「通常カード-006」の言語/状態").toHaveText("JP/NM");
    await expect.soft(枠のセル(ctx, csv, "Foilカード-006", "言語/状態"), "Foil商品「Foilカード-006」の言語/状態").toHaveText("FoilJP/NM");
    await expect.soft(枠のセル(ctx, csv, "項目確認サプライ-006", "言語/状態"), "サプライ品「項目確認サプライ-006」の言語/状態").toHaveText("サプライ品");
  });
});

caseTest("IT-M06-10-007", async (ctx) => {
  const csv = await 手順1から5(ctx, ctx.notes.get(査定の呼び名("M0610-006-007")));
  await ctx.expected(async () => {
    note("略称ABCは、共有の略称タグに足さず、印つきの名称の略称タグを「通常カード-007」に付けた。サプライ品は商品名に実行の印を付けて作った（カード属性との紐づけなし）");
    await expect.soft(枠のセル(ctx, csv, "項目確認サプライ-007", "略称"), "サプライ品「項目確認サプライ-007」の略称（空）").toHaveText("");
  });
});
