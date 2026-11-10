/**
 * M04-01 在庫検索/一覧の続き（-x）。実施不可の見直し（not_runnable_seed_recheck2.tsv）で流せる見込みになったケースのうち、画面で作れるもの。
 * 正本: cases/M04-01_test_cases.tsv。記録: review/M04-01_progress_2026-11-11_dev.md。
 * - どのケースも、テストごとの新しいブラウザのセッションでログインする（事前準備の「ブラウザセッションの…を消去」）。
 * - 商品コード・マスタの名前は実行の印つきで作っている。ケースの文の値は seeds/m04-01-x.ts の コード() で実際の値にして読む。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { 在庫一覧の検索パターン } from "../../db/m04_01_search_pattern";
import { StockListX } from "../../pages/admin/m04_01_stock_list_x";
import { M0401_ALL } from "../../seeds/m04-01";
import { M0401_LIMIT, コード, マスタ } from "../../seeds/m04-01-x";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

async function 全店舗で(page: Page): Promise<StockListX> { await loginAdmin(page, M0401_ALL); return new StockListX(page); }
async function 東京本店だけで(page: Page): Promise<StockListX> { await loginAdmin(page, M0401_LIMIT); return new StockListX(page); }
const 在庫検索一覧のまま = (url: string) => /\/product\/stock(\/page\/\d+)?(\?.*)?$/.test(new URL(url).pathname + new URL(url).search) || new URL(url).pathname.endsWith("/product/stock");

/** コードで検索する（検索欄の店舗・在庫区分は事前に選ぶ） */
async function コードで検索(l: StockListX, 正本: string): Promise<void> {
  await l.入れる("product_code", コード(正本));
  await l.検索する();
}

// ---- 店舗の選択肢（004） ----
caseTest("IT-M04-01-004", async ({ page, step, expected }) => {
  const l = await 全店舗で(page);
  let opts: string[] = [];
  await step(1, () => l.open());
  await step(2, async () => {
    await page.locator("#admin_search_stock_list_base_info + .select2 .select2-selection").click();
    await page.waitForTimeout(500);
    opts = (await page.locator(".select2-container--open .select2-results__option").allInnerTexts()).map((t) => t.trim());
    if (opts.length === 0) opts = await l.選択肢("base_info");
    await page.keyboard.press("Escape");
  });
  await expected(async () => {
    expect.soft(opts.includes("東京本店"), "店舗の選択肢に営業中の「東京本店」が出る").toBe(true);
    expect.soft(opts.includes("大阪支店"), "店舗の選択肢に営業中の「大阪支店」が出る").toBe(true);
    expect.soft(opts.includes(マスタ.上野閉店), "閉店済みの「上野閉店」は出ない").toBe(false);
  });
});

// ---- カテゴリ・エキスパンションのサジェスト（006） ----
caseTest("IT-M04-01-006", async ({ page, step, expected }) => {
  const l = await 全店舗で(page);
  await step(1, () => l.open());
  await step(2, async () => {
    await l.詳細検索を開く();
    const seen = await l.打って選ぶ("category_id", "カードゲーム", [マスタ.カードゲームA, マスタ.カードゲームB]);
    note(`カテゴリの候補: ${seen[0].join("、")}`);
  });
  await step(3, async () => {
    const seen = await l.打って選ぶ("cardset", "SET", [マスタ.SET_A, マスタ.SET_B]);
    note(`エキスパンションの候補（先頭20件）: ${seen[0].slice(0, 20).join("、")}`);
  });
  await expected(async () => {
    expect.soft((await l.選ばれている("category_id")).sort(), "カテゴリで選ばれている2件").toEqual([マスタ.カードゲームA, マスタ.カードゲームB].sort());
    expect.soft((await l.選ばれている("cardset")).sort(), "エキスパンションで選ばれている2件").toEqual([マスタ.SET_A, マスタ.SET_B].sort());
  });
});

// ---- 件数（014） ----
caseTest("IT-M04-01-014", async ({ page, step, expected }) => {
  const l = await 全店舗で(page);
  await step(1, () => l.open());
  await step(2, () => コードで検索(l, "COUNT-M0401"));
  await expected(async () => {
    expect.soft(await l.検索結果件数(), "検索結果件数").toBe(3);
  });
});

// ---- 検索条件の保存（017） ----
caseTest("IT-M04-01-017", async ({ page, step, expected, db }) => {
  const l = await 全店舗で(page);
  const 名前 = コード("部分一致商品Alpha-017");
  const パターン = コード("保存条件A");
  let ecValue = ""; let saved = "";
  await step(1, () => l.open());
  await step(2, async () => {
    await l.入れる("product_name", 名前);
    await l.選ぶ("base_info", ["東京本店"]);
    const ec = l.在庫区分("EC-CUBE"); await ec.check(); ecValue = (await ec.getAttribute("value")) ?? "";
    await l.詳細検索を開く();
    await l.選ぶ("category_id", [マスタ.カードゲームA]);
  });
  await step(3, async () => {
    await page.locator('[href="#searchPatternArea"]').click().catch(() => {});
    await page.locator("#admin_search_stock_list_pattern_name").fill(パターン);
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }).catch(() => {}), page.locator("#savePatternBtn").click()]);
  });
  await step(4, async () => {
    void db.available;
    const rows = 在庫一覧の検索パターン(M0401_ALL.loginId, パターン);
    expect(rows.length, "「保存条件A」の検索パターンが1件").toBe(1);
    saved = String(rows[0]?.保存の中身 ?? "");
    note(`保存の中身: ${saved.slice(0, 600)}`);
  });
  await expected(async () => {
    expect.soft(saved.includes(`"${名前}"`), "商品名＝部分一致商品Alpha-017 が保存されている").toBe(true);
    const zone = /s:10:"stock_zone";a:\d+:\{([^}]*)\}/.exec(saved)?.[1] ?? "";
    expect.soft([...zone.matchAll(/s:\d+:"([^"]*)";/g)].map((m) => m[1]), "在庫区分＝EC-CUBE が保存されている").toEqual([ecValue]);
    const cat = /s:11:"category_id";a:\d+:\{([^}]*)\}/.exec(saved)?.[1] ?? "";
    expect.soft(cat.includes(`"${マスタ.カードゲームAのID}"`) || new RegExp(`i:\\d+;i:${マスタ.カードゲームAのID};`).test(cat), "カテゴリ＝カードゲームA が保存されている").toBe(true);
    const shop = /s:9:"base_info";a:(\d+):/.exec(saved);
    expect.soft(shop ? shop[1] : "0", "店舗（東京本店）は保存されていない（店舗の条件の件数）").toBe("0");
  });
});

// ---- CSV 出力（024・025・056） ----
function CSVの行(link: "在庫リコメンドCSV出力" | "在庫情報CSV出力", 検索語: string, 含む: string[], 含まない: string[], 行数?: number) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const l = await 全店舗で(page);
    let rows: string[][] = [];
    await step(1, () => l.open());
    await step(2, () => コードで検索(l, 検索語));
    await step(3, async () => {
      const r = await l.CSVを落とす(link === "在庫リコメンドCSV出力" ? l.在庫リコメンドCSV出力 : l.在庫情報CSV出力);
      rows = r.行;
      note(`ダウンロードしたCSV（${r.ファイル名}）: 見出し ${JSON.stringify(rows[0] ?? [])}・データ行 ${rows.length - 1}`);
    });
    if (行数 === undefined) await step(4, async () => { note(`データ行: ${JSON.stringify(rows.slice(1, 6))}`); });
    else await step(4, async () => { note(`データ行: ${JSON.stringify(rows.slice(1, 6))}`); });
    await expected(async () => {
      const data = rows.slice(1).map((r) => r.join(","));
      expect.soft(data.length, "CSVのデータ行がある").toBeGreaterThan(0);
      if (行数 !== undefined) expect.soft(data.length, `CSVのデータ行の数（${行数}行）`).toBe(行数);
      expect.soft(data.every((r) => r.includes(コード(検索語))), `データ行はすべて検索の条件（コード「${検索語}」）に一致する在庫`).toBe(true);
      for (const c of 含む) expect.soft(data.some((r) => r.includes(コード(c))), `「${c}」の在庫が出力される`).toBe(true);
      for (const c of 含まない) expect.soft(data.some((r) => r.includes(コード(c))), `「${c}」の在庫は含まれない`).toBe(false);
    });
  };
}
caseTest("IT-M04-01-024", CSVの行("在庫リコメンドCSV出力", "REC-M0401", ["REC-M0401-01"], ["CSV-COMPARE-024"]));
caseTest("IT-M04-01-025", CSVの行("在庫情報CSV出力", "INFO-M0401", ["INFO-M0401-01"], ["CSV-COMPARE-025"]));
caseTest("IT-M04-01-056", CSVの行("在庫情報CSV出力", "M0401-056", ["M0401-056-01", "M0401-056-02", "M0401-056-03"], ["CMP0401-056"], 3));

// ---- 行を選んで操作のボタンを押す（移る） ----
type 操作 = "在庫一括編集" | "在庫移動登録" | "在庫振替登録" | "在庫分割登録" | "在庫結合登録";
function 移る(検索語: string, 選ぶ: string[], ボタン: 操作, 行き先: RegExp, 店舗?: string[], 区分?: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const l = await 全店舗で(page);
    let r!: Awaited<ReturnType<StockListX["押す"]>>; let body = "";
    await step(1, () => l.open());
    await step(2, async () => {
      if (店舗) await l.選ぶ("base_info", 店舗);
      if (区分) await l.在庫区分(区分).check();
      await コードで検索(l, 検索語);
    });
    await step(3, async () => { for (const c of 選ぶ) await l.チェックする(l.行の(コード(c), "東京本店", "EC-CUBE"), c); });
    await step(4, async () => {
      r = await l.押す(l.ボタン(ボタン));
      body = (await page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ");
      note(`押したあと: ${r.移った先}・アラート ${r.アラート.join(" / ") || "なし"}`);
    });
    await expected(async () => {
      expect.soft(r.移った, `${ボタン}の画面へ移った`).toBe(true);
      expect.soft(new URL(r.移った先).pathname, "移った先の画面").toMatch(行き先);
      expect.soft(r.アラート, "アラートは出ない").toEqual([]);
      for (const c of 選ぶ) expect.soft(body.includes(コード(c)), `選んだ「${c}」の在庫を引き継いでいる（画面に商品コードがある）`).toBe(true);
    });
  };
}
caseTest("IT-M04-01-029", 移る("M0401-AUTH-029", ["M0401-AUTH-029-01", "M0401-AUTH-029-02"], "在庫一括編集", /\/product\/stock\/stock-bulk-approval\/new$/));
caseTest("IT-M04-01-032", 移る("M0401-AUTH-032-01", ["M0401-AUTH-032-01"], "在庫分割登録", /\/split\/new$/));
caseTest("IT-M04-01-036", 移る("M0401-AUTH-036-01", ["M0401-AUTH-036-01"], "在庫結合登録", /\/join\/new$/));
caseTest("IT-M04-01-057", 移る("M0401-CB057", ["M0401-CB057-A", "M0401-CB057-B"], "在庫移動登録", /\/product\/stock\/move\/new$/, ["東京本店"], "EC-CUBE"));

// ---- 行を選んで操作のボタンを押す（留まる） ----
type 選ぶ行 = { コード: string; 店舗: string; 区分?: string };
function 留まる(who: "全店舗" | "東京本店だけ", 検索語: string, 選ぶ: 選ぶ行[], ボタン: 操作, opt: { 店舗?: string[]; 区分?: string[]; アラート?: string | true } = {}) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const l = who === "全店舗" ? await 全店舗で(page) : await 東京本店だけで(page);
    let r!: Awaited<ReturnType<StockListX["押す"]>>;
    await step(1, () => l.open());
    await step(2, async () => {
      if (opt.店舗) await l.選ぶ("base_info", opt.店舗);
      for (const z of opt.区分 ?? []) await l.在庫区分(z).check();
      await コードで検索(l, 検索語);
    });
    await step(3, async () => { for (const c of 選ぶ) await l.チェックする(l.行の(コード(c.コード), c.店舗, c.区分 ?? "EC-CUBE"), `${c.店舗}の${c.コード}`); });
    await step(4, async () => {
      r = await l.押す(l.ボタン(ボタン));
      note(`押したあと: ${r.移った先}・アラート ${r.アラート.join(" / ") || "なし"}`);
    });
    await expected(async () => {
      expect.soft(r.移った, `${ボタン}の画面へ移らない`).toBe(false);
      expect.soft(在庫検索一覧のまま(page.url()), "在庫検索一覧画面に留まる").toBe(true);
      if (opt.アラート === true) expect.soft(r.アラート.length, "アラートが表示される").toBeGreaterThan(0);
      else if (opt.アラート) expect.soft(r.アラート.map((a) => a.replace(/\s+/g, "")), "アラートの文").toContain(opt.アラート.replace(/\s+/g, ""));
    });
  };
}
const 大阪 = (c: string): 選ぶ行 => ({ コード: c, 店舗: "大阪支店" });
const 東京 = (c: string, 区分?: string): 選ぶ行 => ({ コード: c, 店舗: "東京本店", 区分 });
caseTest("IT-M04-01-030", 留まる("東京本店だけ", "NOAUTH-M0401-01-030", [大阪("NOAUTH-M0401-01-030")], "在庫一括編集", { 店舗: ["大阪支店"] }));
caseTest("IT-M04-01-033", 留まる("東京本店だけ", "NOAUTH-M0401-01-033", [大阪("NOAUTH-M0401-01-033")], "在庫分割登録", { 店舗: ["大阪支店"] }));
caseTest("IT-M04-01-037", 留まる("東京本店だけ", "NOAUTH-M0401-01-037", [大阪("NOAUTH-M0401-01-037")], "在庫結合登録", { 店舗: ["大阪支店"] }));
caseTest("IT-M04-01-031", 留まる("全店舗", "M0401-MULTI-031", [東京("M0401-MULTI-031-TOKYO"), 大阪("M0401-MULTI-031-OSAKA")], "在庫一括編集", { 店舗: ["東京本店", "大阪支店"] }));
caseTest("IT-M04-01-034", 留まる("全店舗", "M0401-MULTI-034", [東京("M0401-MULTI-034-TOKYO"), 大阪("M0401-MULTI-034-OSAKA")], "在庫分割登録", { 店舗: ["東京本店", "大阪支店"] }));
caseTest("IT-M04-01-038", 留まる("全店舗", "M0401-MULTI-038", [東京("M0401-MULTI-038-TOKYO"), 大阪("M0401-MULTI-038-OSAKA")], "在庫結合登録", { 店舗: ["東京本店", "大阪支店"] }));
caseTest("IT-M04-01-035", 留まる("全店舗", "ZERO-M0401-01", [東京("ZERO-M0401-01")], "在庫分割登録"));
caseTest("IT-M04-01-045", 留まる("全店舗", "M0401-045", [東京("M0401-045-A"), 東京("M0401-045-B")], "在庫分割登録", { アラート: true }));
caseTest("IT-M04-01-046", 留まる("全店舗", "M0401-046", [東京("M0401-046-A"), 東京("M0401-046-B")], "在庫結合登録", { アラート: true }));
caseTest("IT-M04-01-058", 留まる("全店舗", "M0401-CB058-A", [東京("M0401-CB058-A"), 大阪("M0401-CB058-A")], "在庫振替登録",
  { 店舗: ["東京本店", "大阪支店"], 区分: ["EC-CUBE"], アラート: "複数の店舗の商品規格が選択されています。同一の店舗の在庫のみ選択してください。" }));
caseTest("IT-M04-01-060", 留まる("全店舗", "M0401-CB060", [東京("M0401-CB060-A"), 東京("M0401-CB060-B")], "在庫振替登録",
  { 店舗: ["東京本店"], 区分: ["EC-CUBE"], アラート: "在庫数が0の在庫が選択されています。在庫数が1以上の在庫のみ選択してください。" }));

// ---- ボタンの非活性（050） ----
caseTest("IT-M04-01-050", async ({ page, step, expected }) => {
  const l = await 全店舗で(page);
  const ボタン: 操作[] = ["在庫一括編集", "在庫移動登録", "在庫振替登録", "在庫分割登録", "在庫結合登録"];
  await step(1, () => l.open());
  await step(2, () => コードで検索(l, "M0401-050"));
  await step(3, async () => { expect(await l.rows.count(), "一覧の行（2件）").toBe(2); });
  await expected(async () => {
    for (const b of ボタン) await expect.soft(l.ボタン(b), `${b}のボタンが非活性`).toBeDisabled();
  });
});

// ---- 表示件数・ページング（043・051・052） ----
caseTest("IT-M04-01-043", async ({ page, notes, step, expected }) => {
  const l = await 全店舗で(page);
  let ids: string[] = [];
  await step(1, () => l.open());
  await step(2, () => コードで検索(l, "PAGE11-M0401"));
  await step(3, async () => { const r = await l.行(); note(`1ページ目の行 ${r.length}・商品ID ${r.map((x) => x.商品ID).join(",")}`); expect(r.length, "初期表示の10件").toBe(10); });
  await step(4, async () => { await l.ページへ(2); ids = (await l.行()).map((x) => x.商品ID); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "2ページ目へ移った").toMatch(/\/page\/2$/);
    expect.soft(ids, "2ページ目の行（商品ID〔商品ID-M0401-043A〕の1件）").toEqual([notes.get("〔商品ID-M0401-043A〕")]);
  });
});
caseTest("IT-M04-01-051", async ({ page, step, expected }) => {
  const l = await 全店舗で(page);
  let n = 0; let sel = "";
  await step(1, () => l.open());
  await step(2, () => コードで検索(l, "M0401-051"));
  await step(3, async () => { sel = (await l.表示件数の選択肢()).選ばれている; n = await l.rows.count(); note(`検索結果件数 ${await l.検索結果件数()}`); });
  await expected(async () => {
    expect.soft(sel, "表示件数の選択").toBe("10件");
    expect.soft(n, "1ページ目に表示された件数").toBe(10);
    expect.soft(await l.検索結果件数(), "検索結果の件数（11件）").toBe(11);
  });
});
caseTest("IT-M04-01-052", async ({ page, step, expected }) => {
  const l = await 全店舗で(page);
  let opts: string[] = [];
  await step(1, () => l.open());
  await step(2, () => コードで検索(l, "M0401-052-A"));
  await step(3, async () => { opts = (await l.表示件数の選択肢()).表示; });
  await expected(async () => {
    expect.soft(opts, "表示件数の選択肢（9件）").toEqual(["10件", "50件", "100件", "300件", "500件", "1000件", "2000件", "10000件", "12000件"]);
  });
});

// ---- 行の表示（053・055） ----
caseTest("IT-M04-01-053", async ({ page, notes, step, expected }) => {
  const l = await 全店舗で(page);
  let rows: Awaited<ReturnType<StockListX["行"]>> = [];
  await step(1, () => l.open());
  await step(2, () => コードで検索(l, "M0401-053"));
  await step(3, async () => { rows = await l.行(); note(`行: ${JSON.stringify(rows.map((r) => [r.商品ID, r.商品コード, r.在庫]))}`); });
  await expected(async () => {
    const id = notes.get("〔商品ID-M0401-053〕");
    expect.soft(rows.length, "表示された行の数（2行）").toBe(2);
    expect.soft(rows.map((r) => r.商品ID), "どちらの行も商品ID〔商品ID-M0401-053〕").toEqual([id, id]);
    const a1 = rows.find((r) => r.商品コード === コード("M0401-053-A1")); const a2 = rows.find((r) => r.商品コード === コード("M0401-053-A2"));
    expect.soft(a1?.在庫 ?? "（行が無い）", "商品コード M0401-053-A1 の行の在庫").toBe("5");
    expect.soft(a2?.在庫 ?? "（行が無い）", "商品コード M0401-053-A2 の行の在庫").toBe("3");
  });
});
caseTest("IT-M04-01-055", async ({ page, step, expected }) => {
  const l = await 全店舗で(page);
  let rows: Awaited<ReturnType<StockListX["行"]>> = [];
  await step(1, () => l.open());
  await step(2, async () => { await l.選ぶ("base_info", ["東京本店", "大阪支店"]); await コードで検索(l, "M0401-055-A"); });
  await step(3, async () => { rows = await l.行(); note(`行: ${JSON.stringify(rows.map((r) => [r.店舗, r.在庫区分, r.在庫]))}`); });
  await expected(async () => {
    expect.soft(rows.length, "表示された行の数（2行）").toBe(2);
    expect.soft(rows.find((r) => r.店舗 === "東京本店")?.在庫 ?? "（行が無い）", "東京本店の行の在庫").toBe("3");
    expect.soft(rows.find((r) => r.店舗 === "大阪支店")?.在庫 ?? "（行が無い）", "大阪支店の行の在庫").toBe("5");
  });
});

// ---- 商品名から在庫編集へ（042） ----
caseTest("IT-M04-01-042", async ({ page, step, expected }) => {
  const l = await 全店舗で(page);
  await step(1, () => l.open());
  await step(2, () => コードで検索(l, "STK-PART-001-042"));
  await step(3, async () => {
    const link = l.行の(コード("STK-PART-001-042")).locator("td.col-name a").first();
    await expect(link, "商品名「部分一致商品Alpha-042」のリンク").toHaveText(new RegExp(コード("部分一致商品Alpha-042").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), link.click()]);
  });
  await expected(async () => {
    await expect.soft(page.locator("form#stock_approval_form"), "在庫編集画面").toBeVisible();
    expect.soft((await page.locator("body").innerText()).includes(コード("STK-PART-001-042")), "商品規格コード STK-PART-001-042 の在庫編集画面").toBe(true);
  });
});

// ---- 検索前は CSV 出力のボタンが無い（061・062） ----
function CSVボタンが無い(link: "在庫リコメンドCSV出力" | "在庫情報CSV出力") {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const l = await 全店舗で(page);
    await step(1, () => l.open());
    await step(2, async () => { note(`検索結果件数の表示: ${await l.検索結果件数() ?? "無い（未検索）"}`); });
    await expected(async () => {
      expect.soft(await l.検索結果件数(), "検索結果は表示されていない").toBe(null);
      await expect.soft(link === "在庫リコメンドCSV出力" ? l.在庫リコメンドCSV出力 : l.在庫情報CSV出力, `${link}のボタンが表示されない`).toHaveCount(0);
    });
  };
}
caseTest("IT-M04-01-061", CSVボタンが無い("在庫リコメンドCSV出力"));
caseTest("IT-M04-01-062", CSVボタンが無い("在庫情報CSV出力"));

// ---- 3点メニューの価格履歴（064） ----
caseTest("IT-M04-01-064", async ({ page, step, expected }) => {
  const l = await 全店舗で(page);
  let text = "";
  await step(1, () => l.open());
  await step(2, async () => { await l.選ぶ("base_info", ["大阪支店"]); await l.在庫区分("EC-CUBE").check(); await コードで検索(l, "M0401-CB064-A"); });
  await step(3, async () => { await l.行のメニューを開く(l.行の(コード("M0401-CB064-A"), "大阪支店", "EC-CUBE")); });
  await step(4, async () => {
    await l.開いたメニューの項目を押す("価格履歴");
    text = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    note(`移った先: ${page.url()}`);
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "買取/販売価格履歴検索/一覧").toMatch(/price_history/);
    expect.soft(new URL(page.url()).searchParams.get("code") ?? "", "商品コードで絞り込まれている").toBe(コード("M0401-CB064-A"));
    expect.soft(text.includes(コード("M0401-CB064-A")), "M0401-CB064-A の価格履歴が表示される").toBe(true);
    expect.soft(text.includes(コード("M0401-CB064-B")), "別コード M0401-CB064-B の価格履歴は含まれない").toBe(false);
  });
});

// ---- サジェスト（047・049） ----
caseTest("IT-M04-01-047", async ({ page, step, expected }) => {
  const l = await 全店舗で(page);
  let seen: string[][] = [];
  const A = コード("在庫タグM0401-047-A"), B = コード("在庫タグM0401-047-B");
  await step(1, () => l.open());
  await step(2, async () => { await l.詳細検索を開く(); seen = await l.打って選ぶ("tag_id", コード("M0401-047"), [A, B]); });
  await expected(async () => {
    expect.soft(seen[0]?.slice().sort(), "入力文字を含む候補（2件）").toEqual([A, B].sort());
    expect.soft((await l.選ばれている("tag_id")).sort(), "2件とも選択された").toEqual([A, B].sort());
  });
});
caseTest("IT-M04-01-049", async ({ page, step, expected }) => {
  const l = await 全店舗で(page);
  let s1: string[][] = []; let s2: string[][] = [];
  const 略 = [コード("略称M0401-049-A"), コード("略称M0401-049-B")]; const 分 = [コード("分析M0401-049-A"), コード("分析M0401-049-B")];
  await step(1, () => l.open());
  await step(2, async () => { await l.詳細検索を開く(); s1 = await l.打って選ぶ("storage_code_id", コード("M0401-049"), 略); });
  await step(3, async () => { s2 = await l.打って選ぶ("tag_sales_analysis", コード("M0401-049"), 分); });
  await expected(async () => {
    expect.soft(s1[0]?.slice().sort(), "略称タグの候補（2件）").toEqual(略.slice().sort());
    expect.soft((await l.選ばれている("storage_code_id")).sort(), "略称タグで2件とも選択された").toEqual(略.slice().sort());
    expect.soft(s2[0]?.slice().sort(), "売り上げ分析タグの候補（2件）").toEqual(分.slice().sort());
    expect.soft((await l.選ばれている("tag_sales_analysis")).sort(), "売り上げ分析タグで2件とも選択された").toEqual(分.slice().sort());
  });
});
void supplement;
