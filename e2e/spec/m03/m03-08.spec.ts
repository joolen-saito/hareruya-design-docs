/**
 * M03-08 商品規格一覧。正本: cases/M03-08_test_cases.tsv
 * 仕分け直し（review/not_runnable_recheck_cases2.tsv）で流せる見込みになったケースのうち、画面で作れるもの（記録 review/M03-08_progress_2026-11-11_dev.md）。
 * 作れなかったもの（スマレジ連携有効・スマレジ在庫）は review/recheck_not_buildable_M03-08.tsv。
 * 商品コード・商品名には実行の印を付けて作った（seeds/m03-08.ts）。ケースの文の同じ値も、同じ印を付けた値として読む。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { 規格の状態, 商品がある } from "../../db/m03_08";
import { chooseByLabel } from "../../pages/admin/common";
import { M0308ClassListPage } from "../../pages/admin/m03_08_class_list";
import { ClassEditPage } from "../../pages/admin/m03_09_class_edit";
import { openClassListFromProductEdit } from "../../pages/admin/m03_01_product_class";
import { ProductSearchPage } from "../../pages/admin/product_search";
import { M0308_ADMIN } from "../../seeds/m03-08";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 商品 = (ctx: CaseCtx, n: string) => ctx.notes.get(`〔商品ID-M0308-${n}〕`);
const 規格 = (ctx: CaseCtx, k: string) => ctx.notes.get(`〔規格ID-M0308-${k}〕`);
const 一覧のパス = (id: string) => new RegExp(`/product/product/class/${id}/?$`);

async function 始める(ctx: CaseCtx): Promise<M0308ClassListPage> {
  await loginAdmin(ctx.page, M0308_ADMIN);
  return new M0308ClassListPage(ctx.page);
}
const コードの = (rows: { 商品コード: string }[]) => rows.map((r) => r.商品コード);

// ---- 表示 ----
caseTest("IT-M03-08-001", async (ctx) => {
  const l = await 始める(ctx);
  await ctx.step(1, async () => { await l.開く(商品(ctx, "001")); });
  await ctx.expected(async () => {
    expect.soft(await l.商品名(), "商品名").toBe(rc("M03-08表示商品-001"));
  });
});

/** 稼働中の規格一覧の商品コード（002）・廃止規格一覧の商品コード（005） */
function 振分け(n: string, 見る: "稼働中" | "廃止") {
  return async (ctx: CaseCtx): Promise<void> => {
    const l = await 始める(ctx);
    let codes: string[] = [];
    await ctx.step(1, async () => { await l.開く(商品(ctx, n)); });
    if (見る === "稼働中") {
      await ctx.step(2, async () => { codes = コードの(await l.稼働中の行()); note(`稼働中の規格一覧の商品コード: ${codes.join("、") || "なし"}`); });
    } else {
      await ctx.step(2, async () => { await l.廃止規格の開閉を押す(); });
      await ctx.step(3, async () => { codes = コードの(await l.廃止の行()); note(`廃止規格一覧の商品コード: ${codes.join("、") || "なし"}`); });
    }
    const act = ["01", "02", "03", "04"].map((x) => rc(`M0308-ACT-${x}-${n}`));
    const ret = ["01", "02", "03"].map((x) => rc(`M0308-RET-${x}-${n}`));
    await ctx.expected(async () => {
      const 出る = 見る === "稼働中" ? act : ret, 出ない = 見る === "稼働中" ? ret : act;
      for (const c of 出る) expect.soft(codes, `${見る === "稼働中" ? "稼働中の規格一覧" : "廃止規格一覧"}に ${c} が表示される`).toContain(c);
      for (const c of 出ない) expect.soft(codes, `${見る === "稼働中" ? "稼働中の規格一覧" : "廃止規格一覧"}に ${c} が表示されない`).not.toContain(c);
    });
  };
}
caseTest("IT-M03-08-002", 振分け("002", "稼働中"));
caseTest("IT-M03-08-005", 振分け("005", "廃止"));

function 件数(n: string, 件: number) {
  return async (ctx: CaseCtx): Promise<void> => {
    const l = await 始める(ctx);
    let 表示: { 件数: number | null; 文: string } = { 件数: null, 文: "" };
    await ctx.step(1, async () => { await l.開く(商品(ctx, n)); });
    await ctx.step(2, async () => { 表示 = await l.該当件数(); note(`該当件数の表示: 「${表示.文}」`); });
    await ctx.expected(async () => { expect.soft(表示.件数, "稼働中の規格の件数").toBe(件); });
  };
}
caseTest("IT-M03-08-004", 件数("004", 4));
caseTest("IT-M03-08-027", 件数("027", 3));

caseTest("IT-M03-08-006", async (ctx) => {
  const l = await 始める(ctx);
  let row: Awaited<ReturnType<M0308ClassListPage["廃止の行"]>>[number] | undefined;
  await ctx.step(1, async () => { await l.開く(商品(ctx, "006")); });
  await ctx.step(2, async () => { await l.廃止規格の開閉を押す(); });
  await ctx.step(3, async () => { row = (await l.廃止の行()).find((r) => r.商品コード === rc("M0308-RET-01-006")); });
  await ctx.expected(async () => {
    expect.soft(row, `廃止規格一覧に商品コード ${rc("M0308-RET-01-006")} の行がある`).toBeTruthy();
    expect.soft(row?.言語, "言語").toBe("日本語");
    expect.soft(row?.状態, "状態").toBe("HP");
    expect.soft(row?.商品コード, "商品コード").toBe(rc("M0308-RET-01-006"));
    expect.soft(row?.販売制限数, "販売制限数").toBe("5");
    expect.soft(row?.基準価格, "基準価格").toBe("700");
    expect.soft(row?.販売価格, "販売価格").toBe("600");
    expect.soft(row?.買取価格, "買取価格").toBe("200");
    note(`在庫数の表示: ${row?.在庫数 ?? "（行が無い）"}（期待結果は在庫数を確かめない）`);
  });
});

caseTest("IT-M03-08-007", async (ctx) => {
  const l = await 始める(ctx);
  let 開いている = true, 見える行 = -1;
  await ctx.step(1, async () => { await l.開く(商品(ctx, "007")); });
  await ctx.step(2, async () => { 開いている = await l.廃止規格が開いているか(); 見える行 = await l.見えている廃止の行の数(); });
  await ctx.expected(async () => {
    expect.soft(開いている, "廃止規格一覧が折りたたまれている").toBe(false);
    expect.soft(見える行, "見えている廃止規格一覧の行の数").toBe(0);
  });
});

caseTest("IT-M03-08-008", async (ctx) => {
  const l = await 始める(ctx);
  let 見える行 = -1;
  await ctx.step(1, async () => { await l.開く(商品(ctx, "008")); });
  await ctx.step(2, async () => { await l.廃止規格の開閉を押す(); 見える行 = await l.見えている廃止の行の数(); });
  await ctx.expected(async () => {
    expect.soft(見える行, "見えている廃止規格一覧の行の数").toBeGreaterThan(0);
    await expect.soft(ctx.page.locator(`#abolishedProductClass #ex-product_class-${規格(ctx, "008")}`), `廃止の規格（規格ID ${規格(ctx, "008")}）の行が表示される`).toBeVisible();
  });
});

caseTest("IT-M03-08-011", async (ctx) => {
  const l = await 始める(ctx);
  const id = 商品(ctx, "011");
  await ctx.step(1, async () => { await l.開く(id); });
  await ctx.step(2, async () => { await l.押して移る(l.新規作成); });
  await ctx.expected(async () => {
    expect.soft(l.path, "移った画面（商品規格登録画面）のアドレス").toMatch(new RegExp(`/product/product/class/${id}/new$`));
    await expect.soft(new ClassEditPage(ctx.page).form, "商品規格登録画面の入力欄").toBeVisible();
  });
});

caseTest("IT-M03-08-012", async (ctx) => {
  const l = await 始める(ctx);
  const id = 商品(ctx, "012"), cid = 規格(ctx, "012");
  await ctx.step(1, async () => { await l.開く(id); });
  await ctx.step(2, async () => { await l.押して移る(l.編集ボタン(cid)); });
  await ctx.expected(async () => {
    expect.soft(l.path, "移った画面（商品規格編集画面）のアドレス").toMatch(new RegExp(`/product/product/class/${id}/edit/${cid}$`));
    await expect.soft(new ClassEditPage(ctx.page).商品コード, "商品規格編集画面の商品コード").toHaveValue(rc("M0308-ACT-01-012"));
  });
});

caseTest("IT-M03-08-013", async (ctx) => {
  const l = await 始める(ctx);
  const id = 商品(ctx, "013");
  const s = new ProductSearchPage(ctx.page);
  await ctx.step(1, async () => { await s.open(); });
  await ctx.step(2, async () => { await s.ensureDetailVisible(); await s.field("product_id").fill(id); await s.submitAndWaitForResult(); });
  await ctx.step(3, async () => {
    const link = ctx.page.locator(`tr#ex-product-${id} td:nth-child(3) a`);
    await expect(link, `検索結果の商品ID ${id} の商品名のリンク`).toHaveCount(1);
    await l.押して移る(link);
    expect(l.path, "商品編集画面").toMatch(new RegExp(`/product/product/${id}/edit$`));
  });
  await ctx.step(4, async () => {
    await openClassListFromProductEdit(ctx.page, id);
    await ctx.page.waitForLoadState("load");
    note("規格設定を押すと「保存せずに移動」の確認が出るので、保存せずに移動した");
  });
  await ctx.step(5, async () => { await l.押して移る(l.商品登録に戻る); });
  await ctx.expected(async () => {
    expect.soft(l.path, "移った画面（商品編集画面）のアドレス").toMatch(new RegExp(`/product/product/${id}/edit$`));
    await expect.soft(ctx.page.locator("form#form1"), "商品編集画面").toBeVisible();
  });
});

caseTest("IT-M03-08-014", async (ctx) => {
  const l = await 始める(ctx);
  let 状態 = 0;
  await ctx.step(1, async () => { await l.開く(商品(ctx, "014")); expect(await l.一覧の画面か(), "商品規格一覧画面").toBe(true); });
  await ctx.step(2, async () => {
    const url = ctx.page.url().replace(new RegExp(`/product/product/class/${商品(ctx, "014")}`), "/product/product/class/999999014");
    note(`開いたアドレス: ${new URL(url).pathname}（商品ID 999999014 の商品は DB に${商品がある("999999014") ? "ある" : "無い"}）`);
    const res = await ctx.page.goto(url, { timeout: 60_000 });
    await ctx.page.waitForLoadState("load");
    状態 = res?.status() ?? 0;
  });
  await ctx.expected(async () => {
    expect.soft(await l.一覧の画面か(), "商品規格一覧画面が表示されない").toBe(false);
    expect.soft(状態, "ページが見つからないことを示す画面（応答の状態）").toBe(404);
  });
});

// ---- 登録・更新・削除 ----
caseTest("IT-M03-08-017", async (ctx) => {
  const l = await 始める(ctx);
  const id = 商品(ctx, "017");
  const e = new ClassEditPage(ctx.page);
  await ctx.step(1, async () => { await e.新規で開く(id); });
  await ctx.step(2, async () => {
    await chooseByLabel(e.言語, "日本語");
    await e.状態を選ぶ("ニアミント");
    await e.商品コード.fill(rc("M0308-NEW-01"));
    await e.販売制限数.fill("10");
    await e.販売価格.fill("500");
    await e.基準価格.fill("500");
    await e.買取価格.fill("200");
    await e.部門を選ぶ("10");
    await e.スマレジ連携を選ぶ(false);
    await e.公開ステータスを選ぶ("公開");
  });
  await ctx.step(3, async () => { ctx.page.once("dialog", (d) => { note(`確認の表示「${d.message()}」で OK を押した`); d.accept().catch(() => {}); }); await e.登録を押す(); });
  await ctx.expected(async () => {
    expect.soft(l.path, "移った画面（商品規格一覧画面）のアドレス").toMatch(一覧のパス(id));
  });
});

caseTest("IT-M03-08-020", async (ctx) => {
  const l = await 始める(ctx);
  const id = 商品(ctx, "020");
  const e = new ClassEditPage(ctx.page);
  await ctx.step(1, async () => { await e.編集で開く(id, 規格(ctx, "020")); });
  await ctx.step(2, async () => { await e.商品コード.fill(rc("M0308-UPD-01")); });
  await ctx.step(3, async () => { ctx.page.once("dialog", (d) => { note(`確認の表示「${d.message()}」で OK を押した`); d.accept().catch(() => {}); }); await e.登録を押す(); });
  await ctx.expected(async () => {
    expect.soft(l.path, "移った画面（商品規格一覧画面）のアドレス").toMatch(一覧のパス(id));
  });
});

caseTest("IT-M03-08-021", async (ctx) => {
  const l = await 始める(ctx);
  const id = 商品(ctx, "021");
  const e = new ClassEditPage(ctx.page);
  await ctx.step(1, async () => { await e.編集で開く(id, 規格(ctx, "021B")); });
  await ctx.step(2, async () => { await ctx.page.waitForLoadState("load"); await e.削除ボタン.click(); await expect(e.削除の確定, "削除の確認").toBeVisible(); });
  await ctx.step(3, async () => { await Promise.all([ctx.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), e.削除の確定.click()]); });
  await ctx.expected(async () => {
    expect.soft(l.path, "移った画面（商品規格一覧画面）のアドレス").toMatch(一覧のパス(id));
  });
});

/** 「商品規格を初期化」を押す（確認が出れば OK を押す） */
async function 初期化を押す(ctx: CaseCtx, l: M0308ClassListPage): Promise<void> {
  await expect(l.商品規格を初期化, "「商品規格を初期化」のボタン").toHaveCount(1, { timeout: 10_000 });
  ctx.page.once("dialog", (d) => { note(`確認の表示「${d.message()}」で OK を押した`); d.accept().catch(() => {}); });
  await l.押して移る(l.商品規格を初期化);
}

caseTest("IT-M03-08-023", async (ctx) => {
  const l = await 始める(ctx);
  const ks = ["A", "B", "C", "D", "E", "F", "G"];
  const st: Record<string, Awaited<ReturnType<typeof 規格の状態>>> = {};
  await ctx.step(1, async () => { await l.開く(商品(ctx, "023")); });
  await ctx.step(2, async () => { await 初期化を押す(ctx, l); });
  await ctx.step(3, async () => { for (const k of ks) st[k] = 規格の状態(規格(ctx, `023${k}`)); });
  await ctx.expected(async () => {
    for (const k of ["A", "B", "E"]) expect.soft(st[k]?.削除済み, `言語と状態がともに設定された規格ID ${規格(ctx, `023${k}`)}（${k}）が削除済み`).toBe(true);
    for (const k of ["C", "D", "F", "G"]) expect.soft(st[k]?.削除済み, `言語か状態が未設定の規格ID ${規格(ctx, `023${k}`)}（${k}）が削除済みにならない`).toBe(false);
  });
});

caseTest("IT-M03-08-028", async (ctx) => {
  const l = await 始める(ctx);
  const st: Record<string, Awaited<ReturnType<typeof 規格の状態>>> = {};
  await ctx.step(1, async () => { await l.開く(商品(ctx, "028")); });
  await ctx.step(2, async () => { await 初期化を押す(ctx, l); });
  await ctx.step(3, async () => { for (const k of ["A", "B", "C"]) st[k] = 規格の状態(規格(ctx, `028${k}`)); });
  await ctx.expected(async () => {
    for (const k of ["A", "B", "C"]) expect.soft(st[k]?.削除済み, `規格ID ${規格(ctx, `028${k}`)}（${k}）が削除済みにならない`).toBe(false);
  });
});

function 初期化のあとの画面(n: string) {
  return async (ctx: CaseCtx): Promise<void> => {
    const l = await 始める(ctx);
    const id = 商品(ctx, n);
    await ctx.step(1, async () => { await l.開く(id); });
    await ctx.step(2, async () => { await 初期化を押す(ctx, l); });
    await ctx.expected(async () => {
      expect.soft(l.path, "移った画面（商品規格一覧画面）のアドレス").toMatch(一覧のパス(id));
      expect.soft(await l.一覧の画面か(), "商品規格一覧画面").toBe(true);
    });
  };
}
caseTest("IT-M03-08-029", 初期化のあとの画面("029"));
caseTest("IT-M03-08-030", 初期化のあとの画面("030"));

// ---- 0件・在庫・廃止なし ----
caseTest("IT-M03-08-031", async (ctx) => {
  const l = await 始める(ctx);
  let 表示: { 件数: number | null; 文: string } = { 件数: null, 文: "" };
  let 稼働 = -1, 廃止 = -1;
  await ctx.step(1, async () => { await l.開く(商品(ctx, "031")); });
  await ctx.step(2, async () => { 表示 = await l.該当件数(); note(`該当件数の表示: 「${表示.文}」`); });
  await ctx.step(3, async () => { 稼働 = (await l.稼働中の行()).length; 廃止 = (await l.廃止の行()).length; });
  await ctx.expected(async () => {
    expect.soft(表示.件数, "該当件数").toBe(0);
    expect.soft(稼働, "稼働中の規格一覧の行の数").toBe(0);
    expect.soft(廃止, "廃止規格一覧の行の数").toBe(0);
  });
});

caseTest("IT-M03-08-033", async (ctx) => {
  const l = await 始める(ctx);
  let 在庫 = "";
  await ctx.step(1, async () => { await l.開く(商品(ctx, "033")); });
  await ctx.step(2, async () => { 在庫 = (await l.稼働中の行()).find((r) => r.商品コード === rc("M0308-ACT-01-033"))?.在庫数 ?? "（行が無い）"; });
  await ctx.expected(async () => { expect.soft(在庫, `${rc("M0308-ACT-01-033")} の在庫数`).toBe("5"); });
});

caseTest("IT-M03-08-034", async (ctx) => {
  const l = await 始める(ctx);
  let 廃止 = -1;
  await ctx.step(1, async () => { await l.開く(商品(ctx, "034")); });
  await ctx.step(2, async () => { 廃止 = (await l.廃止の行()).length; });
  await ctx.expected(async () => { expect.soft(廃止, "廃止規格一覧の行の数").toBe(0); });
});

/** 035・036: 言語か状態が未設定の規格は、稼働中の規格一覧にも廃止規格一覧にも出ない */
function 未設定の規格(n: string) {
  return async (ctx: CaseCtx): Promise<void> => {
    const l = await 始める(ctx);
    let 稼働: string[] = [], 廃止: string[] = [];
    await ctx.step(1, async () => { await l.開く(商品(ctx, n)); });
    await ctx.step(2, async () => { 稼働 = コードの(await l.稼働中の行()); note(`稼働中の規格一覧の商品コード: ${稼働.join("、") || "なし"}`); });
    await ctx.step(3, async () => { await l.廃止規格の開閉を押す(); });
    await ctx.step(4, async () => { 廃止 = コードの(await l.廃止の行()); note(`廃止規格一覧の商品コード: ${廃止.join("、") || "なし"}`); });
    await ctx.expected(async () => {
      expect.soft(稼働, "稼働中の規格一覧の商品コード").toEqual([rc(`M0308-CB${n}-A`)]);
      expect.soft(稼働, `${rc(`M0308-CB${n}-B`)} は表示されない`).not.toContain(rc(`M0308-CB${n}-B`));
      expect.soft(廃止.length, "廃止規格一覧の行の数").toBe(0);
    });
  };
}
caseTest("IT-M03-08-035", 未設定の規格("035"));
caseTest("IT-M03-08-036", 未設定の規格("036"));

