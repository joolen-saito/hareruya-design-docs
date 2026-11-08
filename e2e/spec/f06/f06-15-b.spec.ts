/**
 * F06-15 買取履歴詳細（-b）。正本: cases/F06-15_test_cases.tsv
 * 実装するのは、画面だけで用意できるシードのネット買取・店頭買取のケース（005〜009・012・015・017・021・031・033・034・037・038・046〜048・050・051・055）。
 * 買取依頼日をDBで直接設定する手順は行わず、依頼日は申込みの日になる。これらのケースは依頼日を確かめない。
 * 記録 review/F06-15_progress_2026-11-07.md
 */
import { test } from "@playwright/test";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { 買取状況ID } from "../../db/f06_15";
import { available } from "../../lib/db";
import { NetDetailPageB } from "../../pages/front/f06_15_net_detail_b";
import { PW, mailOf } from "../../seeds/f06-15";
import { 品名 } from "../../seeds/f06-15-b";

const 補い = () => test.info().annotations.push({ type: "正本の外の補い", description: "シード表が買取依頼日をDBで直接設定する手順は行わなかった（依頼日は申込みの日になる）。商品は画面で登録したサプライ品、会員はフロントの会員登録で作った。このケースは依頼日を確かめない" });

type Ctx = CaseCtx;
const 詳細を開く = async (ctx: Ctx, n: string, 呼び名: string, 手順の前 = 1): Promise<NetDetailPageB> => {
  const d = new NetDetailPageB(ctx.page);
  await ctx.step(手順の前, async () => { await d.ログインする(mailOf(`f0615-${n}`), PW); });
  await ctx.step(手順の前 + 1, async () => { await d.履歴一覧を開く(); await d.一覧から詳細を開く(ctx.notes.get(呼び名)); });
  return d;
};
const 番号の呼び名 = (n: string): string => `〔買取番号-F0615-${n}〕`;
const 処理状態の文 = async (d: NetDetailPageB): Promise<string> => ((await d.page.locator(".c-hareruya-label--status").first().innerText({ timeout: 30_000 })) ?? "").trim();

caseTest("IT-F06-15-005", async (ctx) => {
  補い();
  const { notes, expected } = ctx;
  const d = new NetDetailPageB(ctx.page);
  await ctx.step(1, async () => { await d.ログインする(mailOf("f0615-005"), PW); });
  await ctx.step(2, async () => { await d.履歴一覧を開く(); });
  await ctx.step(3, async () => { await d.一覧から詳細を開く(notes.get("〔買取番号-F0615-005A〕")); });
  await expected(async () => {
    expect.soft(await d.項目("買取番号"), "詳細画面の買取番号").toBe(notes.get("〔買取番号-F0615-005A〕"));
    expect.soft(await d.本文(), "もう1件の買取番号は表示されない").not.toContain(notes.get("〔買取番号-F0615-005B〕"));
  });
});

caseTest("IT-F06-15-006", async (ctx) => {
  補い();
  const d = await 詳細を開く(ctx, "006", 番号の呼び名("006"));
  await ctx.step(3, async () => { await d.押して遷移する(d.マイページボタン); });
  await ctx.expected(async () => { expect.soft(d.path, "遷移した画面（マイページ）").toMatch(/^\/ja\/mypage\/?$/); });
});

caseTest("IT-F06-15-007", async (ctx) => {
  補い();
  const d = await 詳細を開く(ctx, "007", 番号の呼び名("007"));
  await ctx.step(3, async () => { await d.page.locator(".p-hareruya-history-detail__member-name").first().waitFor({ state: "visible" }); });
  await ctx.expected(async () => {
    const 名 = d.page.locator(".p-hareruya-history-detail__member-name").first();
    expect.soft(await 名.isVisible(), "会員名の項目が表示される").toBe(true);
    expect.soft(((await 名.innerText()) ?? "").trim(), "会員名の文").toContain("F0615");
  });
});

caseTest("IT-F06-15-008", async (ctx) => {
  補い();
  const { notes, step, expected } = ctx;
  const d = new NetDetailPageB(ctx.page);
  const 状態: Record<string, string> = {};
  await step(1, async () => { await d.ログインする(mailOf("f0615-008"), PW); });
  let i = 2;
  for (const k of ["A", "B", "C", "D"]) {
    await step(i++, async () => { await d.履歴一覧を開く(); await d.一覧から詳細を開く(notes.get(`〔買取番号-F0615-008${k}〕`)); 状態[k] = await 処理状態の文(d); });
  }
  await expected(async () => {
    expect.soft(状態["A"], "注文の処理状態").toBe("受付完了");
    expect.soft(状態["B"], "査定中の処理状態").toBe("査定中");
    expect.soft(状態["C"], "査定内容連絡済みの処理状態").toBe("査定完了");
    expect.soft(状態["D"], "査定内容承諾の処理状態").toBe("振込待ち");
  });
});

caseTest("IT-F06-15-009", async (ctx) => {
  補い();
  const { notes, step, expected } = ctx;
  const d = new NetDetailPageB(ctx.page);
  const 状態: Record<string, string> = {};
  await step(1, async () => { await d.ログインする(mailOf("f0615-009"), PW); });
  let i = 2;
  for (const k of ["A", "B", "C"]) {
    await step(i++, async () => { await d.履歴一覧を開く(); await d.一覧から詳細を開く(notes.get(`〔買取番号-F0615-009${k}〕`)); 状態[k] = await 処理状態の文(d); });
  }
  await expected(async () => {
    expect.soft(状態["A"], "査定前の処理状態").toBe("受付完了");
    expect.soft(状態["B"], "査定中の処理状態").toBe("査定中");
    expect.soft(状態["C"], "経理払い出し待ちの処理状態").toBe("振込待ち");
  });
});

caseTest("IT-F06-15-012", async (ctx) => {
  補い();
  const d = await 詳細を開く(ctx, "012", 番号の呼び名("012"));
  const 値: Record<string, string | null> = {};
  await ctx.step(3, async () => { for (const k of ["査定日", "承諾日", "振込日"]) 値[k] = await d.項目(k); });
  await ctx.expected(async () => {
    for (const k of ["査定日", "承諾日", "振込日"]) expect.soft(値[k], `${k}の表示（項目はあり、値は空欄）`).toBe("");
  });
});

caseTest("IT-F06-15-015", async (ctx) => {
  補い();
  const d = await 詳細を開く(ctx, "015", 番号の呼び名("015"));
  const 値: Record<string, number | null> = {};
  await ctx.step(3, async () => { for (const k of ["査定金額合計", "査定承諾金額合計"]) 値[k] = await d.金額(k); });
  await ctx.expected(async () => {
    expect.soft(値["査定金額合計"], "査定金額合計の数値").toBe(25000);
    expect.soft(値["査定承諾金額合計"], "査定承諾金額合計の数値").toBe(18000);
  });
});

caseTest("IT-F06-15-017", async (ctx) => {
  補い();
  const d = await 詳細を開く(ctx, "017", 番号の呼び名("017"));
  await ctx.expected(async () => {
    expect.soft(await d.承諾確定ボタン.count(), "承諾確定ボタンの数（画面の上と下に1つずつ）").toBeGreaterThan(0);
    expect.soft(await d.承諾確定ボタン.first().isVisible(), "承諾確定ボタンが表示される").toBe(true);
  });
});

caseTest("IT-F06-15-021", async (ctx) => {
  補い();
  const d = await 詳細を開く(ctx, "021", 番号の呼び名("021"));
  const 商品 = 品名("021", "商品A");
  const 値: Record<string, string> = {};
  let 件数 = "", しない = "", 選択 = "", 見出し = "";
  await ctx.step(3, async () => {
    for (const k of ["言語", "状態", "申込時買取価格", "査定価格", "数量", "小計"] as const) 値[k] = await d.明細の値(商品, k);
    見出し = await d.明細の見出し();
    件数 = ((await d.表示件数の表示.innerText()) ?? "").trim();
    しない = ((await d.売却しない件数の表示.innerText()) ?? "").trim();
    選択 = (await d.売却の選択(商品).evaluate((s) => (s as HTMLSelectElement).selectedOptions[0]?.textContent ?? "")).trim();
  });
  await ctx.expected(async () => {
    expect.soft(件数, "表示件数の項目").toMatch(/件数/);
    expect.soft(しない, "売却しない件数の項目").toMatch(/売却しない/);
    expect.soft(await d.明細の文(商品), "明細の商品名").toContain(商品);
    expect.soft(値["言語"], "明細の言語（日本語）").toBe("日本語");
    expect.soft(値["状態"], "明細の状態").toBe("NM");
    expect.soft(Number(値["申込時買取価格"].replace(/[^\d]/g, "")), "申込時買取価格").toBe(1000);
    expect.soft(Number(値["査定価格"].replace(/[^\d]/g, "")), "査定価格").toBe(1200);
    expect.soft(Number(値["数量"].replace(/[^\d]/g, "")), "数量").toBe(3);
    expect.soft(見出し, "明細の表に小計の項目がある").toContain("小計");
    expect.soft(値["小計"], "小計の値").not.toBe("");
    expect.soft(選択, "売却する/しないの選択").toBe("売却する");
  });
});

caseTest("IT-F06-15-031", async (ctx) => {
  補い();
  const d = await 詳細を開く(ctx, "031", 番号の呼び名("031"));
  let 文 = "";
  await ctx.step(3, async () => { await d.表示件数の表示.waitFor({ state: "visible" }); 文 = await d.本文(); });
  await ctx.expected(async () => {
    expect.soft(await d.まとめて買取の一覧.count(), "まとめて買取の一覧の数").toBe(0);
    expect.soft(文, "500円未満カードの一覧は表示されない").not.toContain("円未満のカード");
    expect.soft(await d.全部売却するチェック.count(), "500円未満のカードをすべて売却するかどうかの選択の数").toBe(0);
  });
});

caseTest("IT-F06-15-033", async (ctx) => {
  補い();
  const d = await 詳細を開く(ctx, "033", 番号の呼び名("033"));
  const 商品 = 品名("033", "商品A");
  let 操作できる = false, 選択肢: string[] = [];
  await ctx.step(3, async () => {
    const s = d.売却の選択(商品);
    操作できる = await s.isEnabled();
    選択肢 = (await s.locator("option").allInnerTexts()).map((t) => t.trim());
  });
  await ctx.expected(async () => {
    expect.soft(操作できる, "売却する/しないの選択が操作できる").toBe(true);
    expect.soft(選択肢, "選択肢").toEqual(["売却する", "売却しない"]);
  });
});

caseTest("IT-F06-15-034", async (ctx) => {
  補い();
  const d = await 詳細を開く(ctx, "034", 番号の呼び名("034"));
  const 商品 = 品名("034", "商品A");
  let 現在 = "", 変えられた = false;
  await ctx.step(3, async () => {
    const s = d.売却の選択(商品);
    await s.selectOption({ label: "売却する" }, { timeout: 5_000 }).then(() => { 変えられた = true; }, () => { 変えられた = false; });
    現在 = (await s.evaluate((e) => (e as HTMLSelectElement).selectedOptions[0]?.textContent ?? "")).trim();
  });
  await ctx.expected(async () => {
    expect.soft(変えられた, "「売却する」に変更できてしまった").toBe(false);
    expect.soft(現在, "現在の選択内容").toBe("売却しない");
  });
});

caseTest("IT-F06-15-037", async (ctx) => {
  補い();
  const d = await 詳細を開く(ctx, "037", 番号の呼び名("037"));
  const 欄: Record<string, string> = {};
  await ctx.step(3, async () => { for (const k of ["A", "B"]) 欄[k] = await d.明細の査定価格欄(品名("037", k)); });
  await ctx.expected(async () => {
    expect.soft(欄["A"], "商品Aの査定価格欄").toContain("査定中");
    expect.soft(欄["B"], "商品Bの査定価格欄は「査定中」でない").not.toContain("査定中");
    expect.soft(欄["B"], "商品Bの査定価格欄").toMatch(/800/);
  });
});

caseTest("IT-F06-15-038", async (ctx) => {
  補い();
  const d = await 詳細を開く(ctx, "038", 番号の呼び名("038"));
  const 商品 = 品名("038", "商品A");
  let 新しい: import("@playwright/test").Page | null = null;
  await ctx.step(3, async () => {
    const link = d.商品名のリンク(商品);
    await link.evaluate((el) => el.scrollIntoView({ block: "center" }));
    const [p] = await Promise.all([d.page.context().waitForEvent("page", { timeout: 30_000 }), link.dispatchEvent("click")]);
    await p.waitForLoadState("load");
    新しい = p;
  });
  await ctx.expected(async () => {
    expect.soft(新しい !== null, "別ウィンドウが開く").toBe(true);
    expect.soft(新しい ? new URL((新しい as import("@playwright/test").Page).url()).pathname : "", "別ウィンドウの画面（ネット買取商品詳細）").toMatch(/^\/ja\/purchase\/detail\/\d+/);
    expect.soft(d.path, "元のウィンドウは買取履歴詳細に残る").toMatch(/purchase_history\/net\//);
  });
});

caseTest("IT-F06-15-046", async (ctx) => {
  補い();
  const d = await 詳細を開く(ctx, "046", 番号の呼び名("046"));
  const 番号 = ctx.notes.get(番号の呼び名("046"));
  await ctx.step(3, async () => { await d.押して遷移する(d.承諾確定ボタン.first()); });
  await ctx.expected(async () => {
    expect.soft(d.path, "遷移した画面（同じ買取番号の買取履歴詳細）").toBe(`/ja/mypage/purchase_history/net/${Number(番号)}`);
    expect.soft(await d.項目("買取番号"), "詳細画面の買取番号").toBe(番号);
  });
});

caseTest("IT-F06-15-047", async (ctx) => {
  補い();
  const d = await 詳細を開く(ctx, "047", 番号の呼び名("047"));
  let 前 = "", 後 = "";
  await ctx.step(3, async () => { 前 = await 処理状態の文(d); });
  await ctx.step(4, async () => { await d.押して遷移する(d.承諾確定ボタン.first()); });
  await ctx.step(5, async () => { 後 = await 処理状態の文(d); });
  await ctx.expected(async () => {
    expect.soft(前, "承諾前の処理状態の表示").toBe("査定が完了しました。");
    expect.soft(後, "承諾後の処理状態の表示").toBe("買取査定を承諾しました。");
  });
});

function 切り替え(n: string, 商品の枝: string, 切替後: "売却しない" | "売却する", 前の件数: number, 後の件数: number) {
  return async (ctx: Ctx): Promise<void> => {
    補い();
    const d = await 詳細を開く(ctx, n, 番号の呼び名(n));
    const 件数 = async (): Promise<number> => Number(/(\d+)/.exec(((await d.売却しない件数の表示.innerText()) ?? ""))?.[1] ?? "-1");
    let a = -1, b = -1;
    await ctx.step(3, async () => { await d.売却しない件数の表示.waitFor({ state: "visible" }); a = await 件数(); });
    await ctx.step(4, async () => { await d.売却の選択(品名(n, 商品の枝)).selectOption({ label: 切替後 }, { timeout: 30_000 }); });
    await ctx.step(5, async () => { b = await 件数(); });
    await ctx.expected(async () => {
      expect.soft(a, "切り替え前の売却しない件数").toBe(前の件数);
      expect.soft(b, "切り替え後の売却しない件数").toBe(後の件数);
    });
  };
}
caseTest("IT-F06-15-048", 切り替え("048", "B", "売却しない", 0, 1));
caseTest("IT-F06-15-050", 切り替え("050", "B", "売却する", 1, 0));

caseTest("IT-F06-15-051", async (ctx) => {
  補い();
  const d = await 詳細を開く(ctx, "051", 番号の呼び名("051"));
  const 番号 = ctx.notes.get(番号の呼び名("051"));
  let 前: number | null = null, 後: number | null = null;
  await ctx.step(3, async () => { 前 = available ? 買取状況ID(番号) : null; });
  await ctx.step(4, async () => { await d.押して遷移する(d.承諾確定ボタン.first()); });
  await ctx.step(5, async () => { 後 = available ? 買取状況ID(番号) : null; });
  await ctx.expected(async () => {
    expect.soft(前, "承諾前の買取状況ID（査定内容連絡済み）").not.toBe(4);
    expect.soft(後, "承諾後の買取状況ID（査定内容承諾＝4）").toBe(4);
  });
});

caseTest("IT-F06-15-055", async (ctx) => {
  補い();
  const d = await 詳細を開く(ctx, "055", 番号の呼び名("055"));
  const 番号 = ctx.notes.get(番号の呼び名("055"));
  await ctx.step(3, async () => { await d.押して遷移する(d.承諾確定ボタン.first()); });
  await ctx.step(4, async () => { await d.履歴一覧を開く(); await d.一覧から詳細を開く(番号); });
  await ctx.step(5, async () => { await d.page.waitForLoadState("load"); });
  await ctx.expected(async () => {
    expect.soft(d.path, "開き直した画面は同じ買取番号の詳細").toBe(`/ja/mypage/purchase_history/net/${Number(番号)}`);
    expect.soft(await d.承諾確定ボタン.count(), "承諾確定ボタンの数").toBe(0);
  });
});
