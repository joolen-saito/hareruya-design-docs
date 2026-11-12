/**
 * M06-10 戻しリストCSV出力（店頭買取）。正本: cases/M06-10_test_cases.tsv
 *
 * シードは seeds/m06-10.ts。共有の設定を書き換えない方針に従い、店舗・商品・カード・略称タグは印つきで画面から作る。
 * 読み替え（各シードの報告にも出る）:
 * - 「本店の閾値 100/500/1000」は、共有の設定を書き換えず、同じ閾値の試験用の店舗（本店相当）で確かめる。「支店A」の閾値 200/700/1200 は、同じ閾値の試験用の支店Aで確かめる。
 * - 査定IDは申込完了画面の値（控えた番号）。正本の決め打ちの査定ID（M0610-001-002 など）は画面が振るので、呼び名〔査定ID-M0610-001-002〕で控えた値を使う。
 * - ピッキング区分は桁区切りで出る（「1,000円以上」）。正本の「1000円以上」と、桁区切りを除いて比べる。
 * 実装していないケース（理由は報告）:
 * - 004・006・007: サプライ品を使う。サプライ品の作成はグッズ商品CSV登録しか無く、カテゴリIDの不具合（ECCUBE_HARERUYA-3966）に当たる。
 * - 005・014・015・017: 棚番号「A01」が出ることを確かめる。棚番号は本店（店舗ID 1）の買取だけに出る仕様で、試験用の店舗では確かめられない（本店の共有の閾値・棚番号は書き換えない）。
 */
import { test } from "@playwright/test";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { OtcListPage } from "../../pages/admin/m06_otc_list";
import { CSVを読む } from "../../pages/admin/m07_buy";
import { M0610_ADMIN, 査定の呼び名, 品名, 略称ABC } from "../../seeds/m06-10";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 数字 = (s: string) => s.replace(/[^\d]/g, "");
const 桁区切りなし = (s: string) => s.replace(/,/g, "");

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
  });
  return csv!;
}

const 行 = (csv: CSV, 名: string) => csv.行.find((r) => (r["商品名"] ?? "").includes(品名(名)));

const 閾値の文 = (店: "本店" | "支店A", 値: string) => `「${店}」は、同じ閾値の試験用の店舗で確かめた（${値}）`;

caseTest("IT-M06-10-002", async (ctx) => {
  const csv = await 手順1から5(ctx, ctx.notes.get(査定の呼び名("M0610-001-002")));
  await ctx.expected(async () => {
    note(`${閾値の文("本店", "閾値 100・500・1000円")}。ピッキング区分は桁区切りを除いて比べた。セール価格50円は商品の販売価格、基準価格1200円は基準価格に入れた`);
    const r = 行(csv, "基準価格判定カード-002");
    expect.soft(桁区切りなし(r?.["ピッキング区分"] ?? "（行が無い）"), "「基準価格判定カード-002」のピッキング区分（基準価格1200円で、閾値1000円を参照）").toBe("1000円以上");
  });
});

caseTest("IT-M06-10-003", async (ctx) => {
  const csv = await 手順1から5(ctx, ctx.notes.get(査定の呼び名("M0610-002-003")));
  await ctx.expected(async () => {
    note(`${閾値の文("支店A", "閾値 200・700・1200円")}。ピッキング区分は桁区切りを除いて比べた`);
    const r = 行(csv, "支店閾値判定カード-003");
    expect.soft(桁区切りなし(r?.["ピッキング区分"] ?? "（行が無い）"), "「支店閾値判定カード-003」のピッキング区分（基準価格1900円で、支店Aの閾値1200円を参照）").toBe("1200円以上");
  });
});

caseTest("IT-M06-10-008", async (ctx) => {
  const csv = await 手順1から5(ctx, ctx.notes.get(査定の呼び名("M0610-006-008")));
  await ctx.expected(async () => {
    note("買取の商品は「通常カード-008」だけ（Foilカード・サプライ品はこのケースが確かめないので作っていない）");
    const r = 行(csv, "通常カード-008");
    expect.soft(r?.["数"] ?? "（行が無い）", "「通常カード-008」の数（数量2）").toBe("2");
  });
});

caseTest("IT-M06-10-009", async (ctx) => {
  const csv = await 手順1から5(ctx, ctx.notes.get(査定の呼び名("M0610-006-009")));
  await ctx.expected(async () => {
    note("買取の商品は「通常カード-009」だけ（Foilカード・サプライ品はこのケースが確かめないので作っていない）");
    const r = 行(csv, "通常カード-009");
    expect.soft(r ? 数字(r["基準価格"] ?? "") : "（行が無い）", "「通常カード-009」の基準価格（600円）").toBe("600");
  });
});

caseTest("IT-M06-10-013", async (ctx) => {
  const csv = await 手順1から5(ctx, ctx.notes.get(査定の呼び名("M0610-013-A")));
  await ctx.expected(async () => {
    note("略称ABCは、共有の略称タグに足さず、印つきの名称の略称タグを商品に付けた。CSVの略称は印つきの名称で比べた。サプライ品「略称確認サプライ-013」は作っていない（このケースはサプライ品でない商品の略称だけを確かめる）");
    const r = 行(csv, "略称確認カード-013");
    expect.soft(r?.["略称"] ?? "（行が無い）", "サプライ品でない「略称確認カード-013」の略称（ABC）").toBe(略称ABC("S-M06-10-ABBR-013"));
  });
});

caseTest("IT-M06-10-016", async (ctx) => {
  const csv = await 手順1から5(ctx, ctx.notes.get(査定の呼び名("M0610-016")));
  await ctx.expected(async () => {
    note(`${閾値の文("支店A", "閾値 200・700・1200円")}。棚番号は設定していない（本店以外の買取は棚番号が空で出る）。ピッキング区分は桁区切りを除いて比べた`);
    const r = 行(csv, "支店最低閾値カード-016");
    expect.soft(桁区切りなし(r?.["ピッキング区分"] ?? "（行が無い）"), "「支店最低閾値カード-016」のピッキング区分（基準価格150円で、支店Aの閾値1の200円を参照）").toBe("200円未満");
    expect.soft(r?.["棚番号"] ?? "（行が無い）", "「支店最低閾値カード-016」の棚番号（空）").toBe("");
  });
});
