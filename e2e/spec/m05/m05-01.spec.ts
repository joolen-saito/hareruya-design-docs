/**
 * M05-01 受注情報検索 一覧(検索入力)。正本: cases/M05-01_test_cases.tsv
 *
 * 画面だけで準備できるケース（検索パターンの保存・選択・削除・件数表示の16件）を実装した（記録 review/M05-01_progress_2026-10-31.md）。
 * 2026-11-10: 受注を画面（フロントの注文・受注情報編集）で作るケースを足した（記録 review/M05-01_progress_2026-11-10.md）。
 *   決め打ちの注文番号（M0501-…）は、シードが作った受注の注文番号に読み替える（seeds/m05-01.ts の 注文番号の読み替え）。
 * 複数の受注を注文番号の部分一致でまとめる・日付や区分値を画面で指定できない前提のケースと、手順にDBでの登録・削除を含むケースは実装しない。
 *
 * 決め打ちの識別の値（検索パターン名・注文番号・メールの前半・お名前）は rc() で実行ごとの印を付けて読む（依頼者決定 2026-10-28）。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { 条件に値を含む検索パターン, 値を含むか, 店舗の選択を含むか, 受注一覧の検索パターン } from "../../db/m05_01_search_pattern";
import { OrderSearchPage } from "../../pages/admin/m05_01_order_search_k";
import { M0501_ADMIN, 店舗Aの店名, 店舗Bの店名, 注文番号の読み替え } from "../../seeds/m05-01";
import { 受注の状態 } from "../../db/m05_01_orders";
import { adminUrl, withAdminSession } from "../../lib/session";
import { readOrderEditIds } from "../../pages/admin/m04_19_order_shortage";
import type { Dialog, Download } from "@playwright/test";
import { statSync } from "node:fs";
import "../../seeds/m05-01-x"; // 取り込みで抜けた登録を戻す: main 側が作り方を登録している seeds を読み込む（二重定義ではない）

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 事前準備①: M05-01試験管理者で、新しいブラウザのセッションにログインする */
async function signIn(page: Page): Promise<OrderSearchPage> {
  await loginAdmin(page, M0501_ADMIN);
  return new OrderSearchPage(page);
}

/** 詳細検索条件を表示する（表示されていれば何もしない）。押したときは注記に残す */
async function showDetail(p: OrderSearchPage): Promise<void> {
  if (await p.showDetail()) note("詳細検索条件が閉じていたので、開閉ボタンを押して表示した");
}

// 受注が0件
caseTest("IT-M05-01-007", async ({ page, step, expected }) => {
  const p = await signIn(page);
  await p.open();
  await step(1, async () => { await p.orderNumber.fill(rc("M0501-NOT-FOUND")); });
  await step(2, async () => { await p.clickSearch(); });
  await expected(async () => {
    expect.soft((await page.locator("#search_total_count").innerText()).replace(/\s+/g, ""), "検索結果の件数表示").toContain("0件");
    await expect.soft(page.locator("#form_bulk"), "受注一覧（一括操作の表）が表示されない").toHaveCount(0);
  });
});

// 検索パターン名を付けて保存すると1件登録される
caseTest("IT-M05-01-051", async ({ page, step, expected }) => {
  const p = await signIn(page);
  const name = rc("M0501-051-PAT");
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.orderNumber.fill(rc("M0501-051")); });
  await step(3, async () => { await showDetail(p); await p.patternName.fill(name); });
  await step(4, async () => { await p.clickSave(); });
  let rows: Awaited<ReturnType<typeof 受注一覧の検索パターン>> = [];
  await step(5, async () => { rows = 受注一覧の検索パターン(name); });
  await expected(async () => {
    expect(rows.length, `名称「${name}」の受注一覧用の検索パターンの件数`).toBe(1);
  });
});

// お名前も含めて保存される
caseTest("IT-M05-01-052", async ({ page, step, expected }) => {
  const p = await signIn(page);
  const name = rc("M0501-052-PAT");
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.orderNumber.fill(rc("M0501-052")); });
  await step(3, async () => { await showDetail(p); });
  await step(4, async () => { await p.name.fill(rc("M0501-052-NAME")); });
  await step(5, async () => { await p.patternName.fill(name); });
  await step(6, async () => { await p.clickSave(); });
  let rows: Awaited<ReturnType<typeof 受注一覧の検索パターン>> = [];
  await step(7, async () => { rows = 受注一覧の検索パターン(name); });
  await expected(async () => {
    expect.soft(rows.length, `名称「${name}」の受注一覧用の検索パターンの件数`).toBe(1);
    const body = rows[0]?.保存の中身 ?? null;
    expect.soft(値を含むか(body, rc("M0501-052")), "検索条件に注文番号が含まれる").toBe(true);
    expect.soft(値を含むか(body, rc("M0501-052-NAME")), "検索条件にお名前が含まれる").toBe(true);
    expect.soft(rows[0]?.受注一覧用, "画面の種類が受注一覧").toBe("true");
  });
});

// 検索パターン名が空のとき登録されない
caseTest("IT-M05-01-054", async ({ page, step, expected }) => {
  const p = await signIn(page);
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.orderNumber.fill(rc("M0501-054-NEW")); });
  await step(3, async () => { await showDetail(p); expect(await p.patternName.inputValue(), "検索パターン名は空").toBe(""); });
  await step(4, async () => { await p.clickSave(); });
  let hits: ReturnType<typeof 条件に値を含む検索パターン> = [];
  await step(5, async () => { hits = 条件に値を含む検索パターン(rc("M0501-054-NEW")); });
  await expected(async () => {
    expect(hits.map((h) => h.名前), "検索条件に注文番号を含む受注一覧用の検索パターン（登録されない）").toEqual([]);
  });
});

// 検索パターン名を更新して保存すると、新規追加でなく更新される
caseTest("IT-M05-01-055", async ({ page, step, expected }) => {
  const p = await signIn(page);
  const oldName = rc("M0501-055-OLD");
  const newName = rc("M0501-055-NEW");
  let id = "";
  await step(1, async () => { await p.open(); });
  await step(2, async () => { id = await p.choosePattern(oldName); });
  await step(3, async () => { await showDetail(p); await p.patternName.fill(newName); });
  await step(4, async () => { await p.clickSave(); });
  let oldRows: ReturnType<typeof 受注一覧の検索パターン> = [];
  let newRows: ReturnType<typeof 受注一覧の検索パターン> = [];
  await step(5, async () => { oldRows = 受注一覧の検索パターン(oldName); newRows = 受注一覧の検索パターン(newName); });
  await expected(async () => {
    expect.soft(oldRows.length, `名称「${oldName}」の検索パターンの件数（更新で無くなる）`).toBe(0);
    expect.soft(newRows.length, `名称「${newName}」の検索パターンの件数（追加でなく更新で1件）`).toBe(1);
    expect.soft(newRows[0]?.検索パターンID, "新しい名称の検索パターンは、更新前と同じ検索パターン（選んだ検索パターンのID）").toBe(id);
  });
});

// 店舗の選択は保存されない
caseTest("IT-M05-01-056", async ({ page, step, expected }) => {
  const p = await signIn(page);
  const name = rc("M0501-056-PAT");
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.tenants.selectOption([{ label: 店舗Aの店名() }, { label: 店舗Bの店名 }]); });
  await step(3, async () => { await p.orderNumber.fill(rc("M0501-056")); });
  await step(4, async () => { await showDetail(p); await p.patternName.fill(name); });
  await step(5, async () => { await p.clickSave(); });
  let rows: ReturnType<typeof 受注一覧の検索パターン> = [];
  await step(6, async () => { rows = 受注一覧の検索パターン(name); });
  await expected(async () => {
    expect.soft(rows.length, `名称「${name}」の検索パターンの件数`).toBe(1);
    const body = rows[0]?.保存の中身 ?? null;
    expect.soft(値を含むか(body, rc("M0501-056")), "検索条件に注文番号が含まれる").toBe(true);
    expect.soft(店舗の選択を含むか(body), "検索条件に店舗の選択が含まれる").toBe(false);
  });
});

// 受注一覧用の検索パターンだけが名前の昇順に並ぶ
async function listCase(page: Page, step: (n: number, b: () => Promise<void>) => Promise<void>, no: string, stock: boolean): Promise<{ names: () => string[] }> {
  const p = await signIn(page);
  let names: string[] = [];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { names = await p.patternNames(); });
  void stock; void no;
  return { names: () => names };
}
caseTest("IT-M05-01-058", async ({ page, step, expected }) => {
  const r = await listCase(page, step, "058", true);
  await expected(async () => {
    const want = ["A", "B", "C"].map((k) => rc(`M0501-058-PAT-${k}`));
    expect.soft(r.names(), "受注一覧用の検索パターンのリンク（名前の昇順の3件）").toEqual(want);
    expect.soft(r.names(), "在庫一覧用の検索パターンは並ばない").not.toContain(rc("M0501-058-PAT-STOCK"));
  });
});
caseTest("IT-M05-01-134", async ({ page, step, expected }) => {
  const r = await listCase(page, step, "134", false);
  await expected(async () => {
    const want = ["A", "B", "C"].map((k) => rc(`M0501-134-PAT-${k}`));
    expect(r.names(), "検索パターンのリンクの並び（名前の昇順）").toEqual(want);
  });
});

// 存在しない検索パターンIDの件数取得は件数を返さない
caseTest("IT-M05-01-064", async ({ page, step, expected }) => {
  const p = await signIn(page);
  const name = rc("M0501-064-PAT");
  page.on("dialog", (d) => { note(`件数取得に失敗したときの通知: ${d.message().replace(/\s+/g, " ")}`); void d.accept(); });
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.rewriteReloadTarget(name, "106499999"); });
  await step(3, async () => {
    const res = page.waitForResponse((r) => /\/order\/count\/pattern\/106499999$/.test(r.url()));
    await p.pressReload(name);
    note(`存在しない検索パターンID 106499999 への件数取得の応答: ${(await res).status()}`);
  });
  await expected(async () => {
    await page.waitForTimeout(500);
    expect(await p.countText(name), "検索パターンの該当件数欄").toBe("*");
  });
});

// 検索パターンを選ぶと検索条件が復元される
caseTest("IT-M05-01-065", async ({ page, step, expected }) => {
  const p = await signIn(page);
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.choosePattern(rc("M0501-065-PAT")); });
  await step(3, async () => { await showDetail(p); });
  const got = { 注文番号: "", メール: "", お名前: "" };
  await step(4, async () => {
    got.注文番号 = await p.orderNumber.inputValue();
    got.メール = await p.email.inputValue();
    got.お名前 = await p.name.inputValue();
  });
  await expected(async () => {
    expect.soft(got.注文番号, "検索フォームの注文番号").toBe(rc("M0501-065"));
    expect.soft(got.メール, "検索フォームのメールアドレス").toBe(`${rc("m0501-065")}@example.test`);
    expect.soft(got.お名前, "検索フォームのお名前").toBe(rc("M0501-065-NAME"));
  });
});

// フリガナがカタカナでなくても検索パターンは保存される
caseTest("IT-M05-01-069", async ({ page, step, expected }) => {
  const p = await signIn(page);
  const name = rc("M0501-069-PAT");
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await showDetail(p); });
  await step(3, async () => { await p.kana.fill(rc("M0501-069-BAD")); });
  await step(4, async () => { await p.patternName.fill(name); });
  await step(5, async () => { await p.clickSave(); });
  let rows: ReturnType<typeof 受注一覧の検索パターン> = [];
  await step(6, async () => { rows = 受注一覧の検索パターン(name); });
  await expected(async () => {
    expect(rows.length, `名称「${name}」の受注一覧用の検索パターンの件数（フリガナの入力チェックに関わらず1件）`).toBe(1);
  });
});

// カタカナでないフリガナの検索パターンを呼び出すと復元される
caseTest("IT-M05-01-071", async ({ page, step, expected }) => {
  const p = await signIn(page);
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.choosePattern(rc("M0501-071-PAT")); });
  await step(3, async () => { await showDetail(p); });
  await expected(async () => {
    expect(await p.kana.inputValue(), "お名前（フリガナ）の欄").toBe(rc("M0501-071-BAD"));
  });
});

// 検索パターン名が空のときは検索画面へ戻る
caseTest("IT-M05-01-133", async ({ page, step, expected }) => {
  const p = await signIn(page);
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.orderNumber.fill(rc("M0501-133-NEW")); });
  await step(3, async () => { await showDetail(p); expect(await p.patternName.inputValue(), "検索パターン名は空").toBe(""); });
  await step(4, async () => { await p.clickSave(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "戻った画面（受注情報検索 一覧(検索入力)）").toMatch(/\/order$/);
    await expect.soft(p.form, "検索欄が表示されている").toBeVisible();
  });
});

// 検索パターン名が空のときのメッセージ
caseTest("IT-M05-01-138", async ({ page, step, expected }) => {
  const p = await signIn(page);
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.orderNumber.fill(rc("M0501-138-NEW")); });
  await step(3, async () => { await showDetail(p); expect(await p.patternName.inputValue(), "検索パターン名は空").toBe(""); });
  await step(4, async () => { await p.clickSave(); });
  await expected(async () => {
    const m = await p.messages();
    expect(m.error.join(" / "), "画面上部のエラーメッセージ").toContain("検索パターン名を入力して下さい");
  });
});

// 検索パターンを削除するとDBから無くなる
caseTest("IT-M05-01-161", async ({ page, step, expected }) => {
  const p = await signIn(page);
  const name = rc("M0501-161-PAT");
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.choosePattern(name); });
  await step(3, async () => { await showDetail(p); await p.clickDelete(); });
  let rows: ReturnType<typeof 受注一覧の検索パターン> = [];
  await step(4, async () => { rows = 受注一覧の検索パターン(name); });
  await expected(async () => {
    expect(rows.length, `名称「${name}」の検索パターンの件数`).toBe(0);
  });
});

// 削除後は検索画面の初期表示
caseTest("IT-M05-01-163", async ({ page, step, expected }) => {
  const p = await signIn(page);
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.choosePattern(rc("M0501-163-PAT")); });
  await step(3, async () => { await showDetail(p); await p.clickDelete(); });
  await step(4, async () => { await expect(p.form, "削除後の検索欄").toBeVisible(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移後の画面（受注情報検索 一覧(検索入力)）").toMatch(/\/order$/);
    expect.soft(await p.orderNumber.inputValue(), "注文番号の欄は空（初期表示）").toBe("");
    await expect.soft(p.deleteButton, "検索パターンを選んでいない（削除ボタンが無い）").toHaveCount(0);
  });
});

// ============================================================================
// 受注を画面で作るケース（2026-11-10）
// 受注はシードが本店の画面で注文して作る。決め打ちの注文番号（M0501-…）は、その受注に振られた注文番号に読み替える。
// ============================================================================

type Ctx = Parameters<Parameters<typeof caseTest>[1]>[0];

/** 正本の決め打ちの注文番号を、シードが作った受注の注文番号に読み替える（注記に残す） */
function 番号(正本の値: string): string {
  const v = 注文番号の読み替え(正本の値);
  note(`注文番号「${正本の値}」は、シードが作った受注の注文番号 ${v} に読み替えた`);
  return v;
}

/** 受注情報検索 一覧(検索入力)画面を開いて注文番号を入れる */
async function 注文番号を入れる(p: OrderSearchPage, no: string): Promise<void> {
  await p.open();
  await p.orderNumber.fill(no);
}

/** 押すと画面のスクリプトが出す通知（alert）を待って受け入れる。出た文を返す（出なければ null） */
async function 通知を待つ(page: Page, push: () => Promise<void>, ms = 10_000): Promise<string | null> {
  const shown = page.waitForEvent("dialog", { timeout: ms }).then(async (d) => { const m = d.message(); await d.accept(); return m; }, () => null);
  await push();
  return shown;
}

/** 検索結果の行が1件表示されていること */
async function 行が出ている(p: OrderSearchPage, no: string, what: string): Promise<void> {
  await expect.soft(p.row(no), what).toHaveCount(1);
}

// 件数の初期値
caseTest("IT-M05-01-001", async ({ page, step, expected }) => {
  const p = await signIn(page);
  let selected = "";
  await step(1, async () => { await 注文番号を入れる(p, 番号("M0501-SOURCE-001")); });
  await step(2, async () => { await p.clickSearch(); });
  await step(3, async () => {
    await expect(p.pageCountSelect, "件数の選択欄").toBeVisible();
    selected = ((await p.pageCountSelect.locator("option:checked").innerText()) ?? "").trim();
  });
  await expected(async () => {
    expect(selected, "件数の選択欄で選ばれている件数（初期値）").toBe("300件");
  });
});

// 注文番号で検索すると1件
caseTest("IT-M05-01-008", async ({ page, notes, step, expected }) => {
  const p = await signIn(page);
  const no = notes.get("〔注文番号-M0501-008〕");
  await step(1, async () => { await 注文番号を入れる(p, no); });
  await step(2, async () => { await p.clickSearch(); });
  await expected(async () => {
    expect.soft(await p.totalCountNumber(), "該当件数").toBe(1);
    await 行が出ている(p, no, `注文番号「${no}」の受注一覧の行`);
  });
});

// CSVダウンロード
function csvDownload(n: string, 項目: "受注一覧CSVダウンロード" | "受注詳細CSVダウンロード") {
  return async ({ page, notes, step, expected }: Ctx) => {
    const p = await signIn(page);
    const no = notes.get(`〔注文番号-M0501-${n}〕`);
    let dl: Download | null = null;
    await step(1, async () => { await 注文番号を入れる(p, no); });
    await step(2, async () => { await p.clickSearch(); });
    await step(3, async () => { await p.checkRow(no); });
    await step(4, async () => {
      const item = await p.openToolMenu("CSVダウンロード", 項目);
      dl = await Promise.all([page.waitForEvent("download", { timeout: 120_000 }), item.click()]).then(([d]) => d, () => null);
    });
    await expected(async () => {
      const d = dl as Download | null;
      expect(d !== null, `${項目}でファイルがダウンロードされた`).toBe(true);
      if (!d) return;
      expect.soft(d.suggestedFilename(), "ダウンロードしたファイルの名前").toMatch(/\.csv$/i);
      const path = await d.path();
      expect.soft(path ? statSync(path).size : 0, "ダウンロードしたファイルの大きさ（バイト）").toBeGreaterThan(0);
    });
  };
}
caseTest("IT-M05-01-017", csvDownload("017", "受注一覧CSVダウンロード"));
caseTest("IT-M05-01-018", csvDownload("018", "受注詳細CSVダウンロード"));

// CSV出力項目設定・カスタムCSVの出力項目設定への遷移
function toSetting(n: string, menu: "CSVダウンロード" | "受注一覧カスタムCSV" | "受注詳細カスタムCSV", 項目: string, path: RegExp, csvType: string | null, 読み替え?: string) {
  return async ({ page, notes, step, expected }: Ctx) => {
    const p = await signIn(page);
    const no = notes.get(`〔注文番号-M0501-${n}〕`);
    await step(1, async () => { await 注文番号を入れる(p, no); });
    await step(2, async () => { await p.clickSearch(); });
    await step(3, async () => {
      if (読み替え) note(読み替え);
      const item = await p.openToolMenu(menu, 項目);
      await Promise.all([page.waitForNavigation({ waitUntil: "load" }), item.click()]);
    });
    await expected(async () => {
      expect.soft(new URL(page.url()).pathname, "遷移した画面のアドレス").toMatch(path);
      if (csvType) expect.soft(await p.csvTypeValue(), "CSV出力項目設定画面で選ばれているCSVの種類（受注=3・配送=4）").toBe(csvType);
    });
  };
}
caseTest("IT-M05-01-020", toSetting("020", "CSVダウンロード", "受注一覧CSV出力項目設定", /\/setting\/shop\/csv\/3$/, "3",
  "手順の「受注CSV出力項目設定」は、画面のメニューの表示名「受注一覧CSV出力項目設定」の項目とした"));
caseTest("IT-M05-01-021", toSetting("021", "CSVダウンロード", "受注詳細CSV出力項目設定", /\/setting\/shop\/csv\/4$/, "4",
  "手順の「配送CSV出力項目設定」は、画面のメニューの表示名「受注詳細CSV出力項目設定」の項目とした"));
caseTest("IT-M05-01-024", toSetting("024", "受注一覧カスタムCSV", "出力項目設定", /\/setting\/shop\/custom_csv\/3$/, null));
caseTest("IT-M05-01-025", toSetting("025", "受注詳細カスタムCSV", "出力項目設定", /\/setting\/shop\/custom_csv\/4$/, null));

// 受注を選ばずに一括の操作を押すとエラー
type 一括の操作 = "メール一括通知" | "スタック用紙印刷" | "送り状CSV" | "納品書印刷（日本語）" | "納品書印刷（英語）";
function noSelection(正本: string, op: 一括の操作) {
  return async ({ page, step, expected }: Ctx) => {
    const p = await signIn(page);
    const no = 番号(正本);
    let before = "";
    let message: string | null = null;
    let popups = 0;
    let downloads = 0;
    page.on("popup", () => { popups += 1; });
    page.on("download", () => { downloads += 1; });
    await step(1, async () => { await 注文番号を入れる(p, no); });
    await step(2, async () => { await p.clickSearch(); before = page.url(); });
    await step(3, async () => {
      expect(await p.checkedCount(), "選んでいる受注の数").toBe(0);
      if (op === "メール一括通知") {
        message = await 通知を待つ(page, async () => { const item = await p.openToolMenu("その他", "メール一括通知"); await item.click({ noWaitAfter: true }); });
      } else {
        message = await 通知を待つ(page, async () => { await p.bulkButton(op).click({ noWaitAfter: true }); });
      }
      await page.waitForTimeout(2000);
    });
    await expected(async () => {
      expect.soft(message ?? "", "表示されたエラー（画面のスクリプトの通知の文）").not.toBe("");
      expect.soft(page.url(), "受注一覧に留まる（アドレスが変わらない）").toBe(before);
      await 行が出ている(p, no, "受注一覧の行が表示されたまま");
      if (op === "スタック用紙印刷") {
        expect.soft(popups, "印刷の窓が開かない").toBe(0);
        expect.soft(await p.rowStatus(no), "印刷対象が更新されない（対応状況が注文受領のまま）").toBe("注文受領");
      }
      if (op === "送り状CSV") expect.soft(downloads, "CSVファイルがダウンロードされない").toBe(0);
      if (op === "納品書印刷（日本語）" || op === "納品書印刷（英語）") expect.soft(popups, "PDF画面（別の窓）が開かない").toBe(0);
    });
  };
}
caseTest("IT-M05-01-036", noSelection("M0501-INVOICE-036", "納品書印刷（日本語）"));
caseTest("IT-M05-01-037", noSelection("M0501-INVOICE-037", "納品書印刷（英語）"));

// スタック用紙印刷で対応状況・ブラウザ印刷フラグ・注文確定日・担当者が更新される
caseTest("IT-M05-01-030", async ({ page, notes, step, expected }) => {
  const p = await signIn(page);
  const no = notes.get("〔注文番号-M0501-030〕");
  let popup: Page | null = null;
  let closed: Promise<unknown> = Promise.resolve();
  let state: ReturnType<typeof 受注の状態> | null = null;
  await step(1, async () => { await 注文番号を入れる(p, no); });
  await step(2, async () => { await p.clickSearch(); });
  await step(3, async () => {
    await p.checkRow(no);
    page.once("popup", (w) => {
      w.on("dialog", (d) => { note(`スタック用紙印刷の窓の通知: ${d.message().replace(/\s+/g, " ")}`); void d.accept(); });
    });
    const opened = page.waitForEvent("popup", { timeout: 30_000 });
    await p.bulkButton("スタック用紙印刷").click();
    popup = await opened;
    closed = popup.waitForEvent("close", { timeout: 120_000 }).catch(() => undefined);
  });
  await step(4, async () => {
    await closed;
    if (popup && !(popup as Page).isClosed()) note("スタック用紙印刷の窓が120秒で閉じなかった");
    state = 受注の状態(await p.rowOrderId(no));
  });
  await expected(async () => {
    const s = state as ReturnType<typeof 受注の状態> | null;
    expect.soft(s?.対応状況, "対応状況").toBe("ピック中");
    expect.soft(s?.ブラウザ印刷フラグ, "ブラウザ印刷フラグ（ON）").toBe("true");
    expect.soft(s?.注文確定日 ?? null, "注文確定日が設定済み").not.toBeNull();
    expect.soft(s?.担当者, "担当者").toBe("M05-01試験管理者");
  });
});

// 注文番号のリンク・操作のメニューから遷移する
caseTest("IT-M05-01-038", async ({ page, notes, step, expected }) => {
  const p = await signIn(page);
  const no = notes.get("〔注文番号-M0501-038〕");
  const id = notes.get("〔受注ID-M0501-038〕");
  let opened: Page | null = null;
  await step(1, async () => { await 注文番号を入れる(p, no); });
  await step(2, async () => { await p.clickSearch(); });
  await step(3, async () => {
    const w = page.waitForEvent("popup", { timeout: 30_000 });
    await p.numberLink(no).click();
    opened = await w;
    await opened.waitForLoadState("load");
    note("注文番号のリンクは別のタブで開く作り。開いたタブの画面を確かめる");
  });
  await expected(async () => {
    const w = opened as Page | null;
    expect(w !== null, "注文番号を押して画面が開いた").toBe(true);
    if (!w) return;
    expect.soft(new URL(w.url()).pathname, "開いた画面のアドレス（受注情報編集）").toMatch(new RegExp(`/order/${id}/edit$`));
    const ids = await readOrderEditIds(w, "開いた受注情報編集画面").catch(() => null);
    expect.soft(ids?.注文番号 ?? "", "受注情報編集画面の注文番号").toBe(no);
  });
});

caseTest("IT-M05-01-039", async ({ page, notes, step, expected }) => {
  const p = await signIn(page);
  const no = notes.get("〔注文番号-M0501-039〕");
  const id = notes.get("〔受注ID-M0501-039〕");
  await step(1, async () => { await 注文番号を入れる(p, no); });
  await step(2, async () => { await p.clickSearch(); });
  await step(3, async () => {
    const item = await p.openRowMenu(no, "編集");
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), item.click()]);
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移した画面のアドレス（受注情報編集）").toMatch(new RegExp(`/order/${id}/edit$`));
    const ids = await readOrderEditIds(page, "受注情報編集画面").catch(() => null);
    expect.soft(ids?.注文番号 ?? "", "受注情報編集画面の注文番号").toBe(no);
  });
});

caseTest("IT-M05-01-040", async ({ page, notes, step, expected }) => {
  const p = await signIn(page);
  const no = notes.get("〔注文番号-M0501-040〕");
  const id = notes.get("〔受注ID-M0501-040〕");
  await step(1, async () => { await 注文番号を入れる(p, no); });
  await step(2, async () => { await p.clickSearch(); });
  await step(3, async () => {
    const item = await p.openRowMenu(no, "メール通知");
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), item.click()]);
  });
  await expected(async () => {
    const u = new URL(page.url());
    expect.soft(u.pathname, "遷移した画面のアドレス（手動メール通知）").toMatch(/\/order\/manual_mail$/);
    expect.soft(u.searchParams.get("orderId"), "手動メール通知の対象の受注ID").toBe(id);
    const info = await p.manualMailOrderInfo().catch(() => null);
    expect.soft(info?.文字 ?? "", "手動メール通知画面の注文番号").toContain(no);
  });
});

// 削除
type 押した削除 = { dialog: Dialog; clicked: Promise<unknown> };
/** 操作のメニューの「削除」を押し、確認ダイアログが出るのを待つ（押す操作は、ダイアログに答えるまで終わらない） */
async function 削除を押す(page: Page, p: OrderSearchPage, no: string): Promise<押した削除> {
  const item = await p.openRowMenu(no, "削除");
  const shown = page.waitForEvent("dialog", { timeout: 20_000 });
  const clicked = item.click({ noWaitAfter: true }).catch(() => undefined);
  const dialog = await shown;
  note(`確認ダイアログの文: 「${dialog.message()}」`);
  return { dialog, clicked };
}
/** 確認ダイアログの「OK」を押して、移った先の画面を待つ */
async function OKを押す(page: Page, d: 押した削除): Promise<void> {
  const nav = page.waitForNavigation({ waitUntil: "load", timeout: 60_000 });
  await d.dialog.accept();
  await d.clicked;
  const res = await nav;
  note(`削除の要求のあと: 応答 ${res?.status() ?? "なし"}・移った画面 ${new URL(page.url()).pathname}`);
}

caseTest("IT-M05-01-041", async ({ page, notes, step, expected }) => {
  const p = await signIn(page);
  const no = notes.get("〔注文番号-M0501-041〕");
  const id = notes.get("〔受注ID-M0501-041〕");
  let d: 押した削除 | null = null;
  let s: ReturnType<typeof 受注の状態> | null = null;
  await step(1, async () => { await 注文番号を入れる(p, no); });
  await step(2, async () => { await p.clickSearch(); });
  await step(3, async () => { d = await 削除を押す(page, p, no); });
  await step(4, async () => { await OKを押す(page, d!); });
  await step(5, async () => { s = 受注の状態(id); });
  await expected(async () => {
    const r = s as ReturnType<typeof 受注の状態> | null;
    expect.soft(r?.件数, `受注ID ${id} のレコードが残る`).toBe(1);
    expect.soft(r?.削除日時 ?? null, "削除済み区分が有効（削除日時が入る）").not.toBeNull();
  });
});

caseTest("IT-M05-01-042", async ({ page, notes, step, expected }) => {
  const p = await signIn(page);
  const no = notes.get("〔注文番号-M0501-042〕");
  let d: 押した削除 | null = null;
  await step(1, async () => { await 注文番号を入れる(p, no); });
  await step(2, async () => { await p.clickSearch(); });
  await step(3, async () => { d = await 削除を押す(page, p, no); });
  await step(4, async () => { await OKを押す(page, d!); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "戻った画面のアドレス（受注一覧）").toMatch(/\/order(\/page\/\d+)?$/);
    await expect.soft(p.form, "受注一覧の検索欄").toBeVisible();
  });
});

// 偽造防止トークンが無い・正しくない削除の要求は受け付けない
function badToken(n: string, token: string | null) {
  return async ({ page, notes, step, expected }: Ctx) => {
    const p = await signIn(page);
    const no = notes.get(`〔注文番号-M0501-${n}〕`);
    const id = notes.get(`〔受注ID-M0501-${n}〕`);
    let s: ReturnType<typeof 受注の状態> | null = null;
    await step(1, async () => { await 注文番号を入れる(p, no); });
    await step(2, async () => { await p.clickSearch(); });
    await step(3, async () => { await p.rewriteDeleteToken(no, token); });
    await step(4, async () => {
      const d = await 削除を押す(page, p, no);
      note("削除の要求を送るため、確認ダイアログは「OK」で答えた（手順は「削除を選択する」まで）");
      await OKを押す(page, d);
    });
    await step(5, async () => { s = 受注の状態(id); });
    await expected(async () => {
      const r = s as ReturnType<typeof 受注の状態> | null;
      expect.soft(r?.件数, `受注ID ${id} の受注`).toBe(1);
      expect(r?.削除日時 ?? null, "削除済み区分が無効のまま（削除日時が入らない）").toBeNull();
    });
  };
}
caseTest("IT-M05-01-046", badToken("046", null));
caseTest("IT-M05-01-047", badToken("047", "invalid-token"));

// 2つのブラウザで同じ受注を削除する
caseTest("IT-M05-01-048", async ({ page, browser, notes, step, expected }) => {
  const pa = await signIn(page);
  const no = notes.get("〔注文番号-M0501-048〕");
  const id = notes.get("〔受注ID-M0501-048〕");
  let afterB: string | null = null;
  let s: ReturnType<typeof 受注の状態> | null = null;
  await withAdminSession(browser, M0501_ADMIN, async (pageB) => {
    const pb = new OrderSearchPage(pageB);
    note("ブラウザBは、別のブラウザのセッションで M05-01試験管理者 としてログインした");
    await step(1, async () => { await 注文番号を入れる(pa, no); await pa.clickSearch(); await expect(pa.row(no), "ブラウザAの検索結果の行").toHaveCount(1); });
    await step(2, async () => {
      await 注文番号を入れる(pb, no);
      await pb.clickSearch();
      const d = await 削除を押す(pageB, pb, no);
      await OKを押す(pageB, d);
      afterB = 受注の状態(id).削除日時;
      note(`ブラウザBの削除のあとの削除日時: ${afterB ?? "未設定"}`);
    });
  });
  await step(3, async () => {
    const d = await 削除を押す(page, pa, no);
    await OKを押す(page, d);
  });
  await step(4, async () => { s = 受注の状態(id); });
  await expected(async () => {
    const r = s as ReturnType<typeof 受注の状態> | null;
    expect.soft(new URL(page.url()).pathname, "ブラウザAが戻った画面のアドレス（受注一覧）").toMatch(/\/order(\/page\/\d+)?$/);
    expect.soft(afterB, "ブラウザBの削除で削除済み区分が有効になった（削除日時）").not.toBeNull();
    expect.soft(r?.削除日時 ?? null, "削除済み区分（削除日時）がブラウザBの削除のあとの値から変わらない").toBe(afterB);
  });
});

// 検索パターンを保存すると、保存した条件の一覧が出る
caseTest("IT-M05-01-053", async ({ page, notes, step, expected }) => {
  const p = await signIn(page);
  const a = notes.get("〔注文番号-M0501-053A〕");
  const b = notes.get("〔注文番号-M0501-053B〕");
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.orderNumber.fill(a); });
  await step(3, async () => { await showDetail(p); await p.patternName.fill(rc("M0501-053-PAT")); });
  await step(4, async () => { await p.clickSave(); });
  await expected(async () => {
    await 行が出ている(p, a, `注文番号「${a}」の行が表示される`);
    await expect.soft(p.row(b), `注文番号「${b}」の行は表示されない`).toHaveCount(0);
  });
});

// 検索パターンのリンクで、その条件の一覧が出る
caseTest("IT-M05-01-057", async ({ page, notes, step, expected }) => {
  const p = await signIn(page);
  const a = notes.get("〔注文番号-M0501-057A〕");
  const b = notes.get("〔注文番号-M0501-057B〕");
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.choosePattern(rc("M0501-057-PAT-A")); });
  await expected(async () => {
    await 行が出ている(p, a, `注文番号「${a}」の行が表示される`);
    await expect.soft(p.row(b), `注文番号「${b}」の行は表示されない`).toHaveCount(0);
  });
});

// 検索をせずに一覧の2ページ目を開いても検索されない
caseTest("IT-M05-01-072", async ({ page, notes, step, expected }) => {
  const p = new OrderSearchPage(page);
  const no = notes.get("〔注文番号-M0501-072〕");
  await step(1, async () => { await loginAdmin(page, M0501_ADMIN); });
  await step(2, async () => {
    const res = await page.goto(adminUrl("/order/page/2"));
    await page.waitForLoadState("load");
    note(`2ページ目のアドレスを直接開いた: 応答 ${res?.status() ?? "なし"}・画面 ${new URL(page.url()).pathname}`);
  });
  await expected(async () => {
    await expect.soft(p.resultTable, "検索結果の表が表示されない（検索が実行されない）").toHaveCount(0);
    await expect.soft(p.row(no), `注文番号「${no}」の行が表示されない`).toHaveCount(0);
  });
});

// 検索条件の開閉ボタン
const 表示か = (b: boolean | undefined) => (b ? "表示" : "非表示");
caseTest("IT-M05-01-085", async ({ page, step, expected }) => {
  const p = await signIn(page);
  const s: boolean[] = [];
  await step(1, async () => { await p.open(); s.push(await p.settledVisible(p.detail)); });
  await step(2, async () => { await p.toggle1.click(); s.push(await p.settledVisible(p.detail)); });
  await step(3, async () => { await p.toggle1.click(); s.push(await p.settledVisible(p.detail)); });
  await expected(async () => {
    expect.soft(表示か(s[1]), "1回押したあとの詳細検索条件（押す前と逆）").toBe(表示か(!s[0]));
    expect.soft(表示か(s[2]), "2回押したあとの詳細検索条件（押す前と同じ）").toBe(表示か(s[0]));
  });
});
caseTest("IT-M05-01-086", async ({ page, step, expected }) => {
  const p = await signIn(page);
  const s: boolean[] = [];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await showDetail(p); s.push(await p.settledVisible(p.deliveryDetail)); });
  await step(3, async () => { await p.toggle2.click(); s.push(await p.settledVisible(p.deliveryDetail)); });
  await step(4, async () => { await p.toggle2.click(); s.push(await p.settledVisible(p.deliveryDetail)); });
  await expected(async () => {
    expect.soft(表示か(s[1]), "1回押したあとの配送先の検索条件（押す前と逆）").toBe(表示か(!s[0]));
    expect.soft(表示か(s[2]), "2回押したあとの配送先の検索条件（押す前と同じ）").toBe(表示か(s[0]));
  });
});

// 対応状況・支払方法の選択肢
caseTest("IT-M05-01-087", async ({ page, step, expected }) => {
  const p = await signIn(page);
  let labels: string[] = [];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await showDetail(p); });
  await step(3, async () => { labels = await p.checkLabels("対応状況"); });
  await expected(async () => {
    const want = ["決済処理中", "注文受領", "入金待ち", "入金済み", "キャンセル", "出荷指示", "出荷完了", "購入処理中", "ピック中", "ピック完了", "店頭予約"];
    expect.soft([...labels].sort(), "対応状況の選択肢（11種）").toEqual([...want].sort());
    expect.soft(labels.length, "対応状況の選択肢の数").toBe(11);
  });
});
caseTest("IT-M05-01-091", async ({ page, step, expected }) => {
  const p = await signIn(page);
  let labels: string[] = [];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await showDetail(p); });
  await step(3, async () => { labels = await p.checkLabels("支払方法"); });
  await expected(async () => {
    for (const i of [1, 2, 3]) expect.soft(labels, `支払方法の選択肢に M0501-091-PAY${i}`).toContain(rc(`M0501-091-PAY${i}`));
    expect.soft(labels, "削除済みの M0501-091-PAY4 は選択肢に無い").not.toContain(rc("M0501-091-PAY4"));
  });
});
caseTest("IT-M05-01-135", async ({ page, step, expected }) => {
  const p = await signIn(page);
  let order: string[] = [];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await showDetail(p); });
  await step(3, async () => {
    const want = [1, 2, 3].map((i) => rc(`M0501-135-PAY${i}`));
    order = (await p.checkLabels("支払方法")).filter((l) => want.includes(l));
  });
  await expected(async () => {
    expect(order, "支払方法の選択肢の並び（M0501-135-PAY1〜3 だけを抜き出した順）").toEqual([3, 2, 1].map((i) => rc(`M0501-135-PAY${i}`)));
  });
});

// 存在しない検索パターンの件数を取っても一覧の検索状態は変わらない
caseTest("IT-M05-01-136", async ({ page, notes, step, expected }) => {
  const p = await signIn(page);
  const no = notes.get("〔注文番号-M0501-136〕");
  const name = rc("M0501-136-PAT");
  let before = "";
  page.on("dialog", (d) => { note(`件数取得に失敗したときの通知: ${d.message().replace(/\s+/g, " ")}`); void d.accept(); });
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.orderNumber.fill(no); await p.clickSearch(); before = page.url(); });
  await step(3, async () => { await p.rewriteReloadTarget(name, "113699999"); });
  await step(4, async () => {
    const res = page.waitForResponse((r) => /\/order\/count\/pattern\/113699999$/.test(r.url()), { timeout: 30_000 });
    await p.pressReload(name);
    note(`存在しない検索パターンID 113699999 への件数取得の応答: ${(await res.catch(() => null))?.status() ?? "なし"}`);
    await page.waitForTimeout(1000);
  });
  await expected(async () => {
    await 行が出ている(p, no, `手順2の検索結果（注文番号「${no}」の行）が表示されたまま`);
    expect.soft(page.url(), "画面のアドレスが変わらない").toBe(before);
    expect.soft(await p.orderNumber.inputValue(), "注文番号の検索条件").toBe(no);
  });
});

// 検索パターンを保存したときのメッセージ
caseTest("IT-M05-01-139", async ({ page, notes, step, expected }) => {
  const p = await signIn(page);
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.orderNumber.fill(notes.get("〔注文番号-M0501-139A〕")); });
  await step(3, async () => { await showDetail(p); await p.patternName.fill(rc("M0501-139-PAT")); });
  await step(4, async () => { await p.clickSave(); });
  await expected(async () => {
    const m = await p.messages();
    expect(m.success.join(" / "), "画面上部のメッセージ").toContain("検索条件を保存しました");
  });
});

// 店舗と対応状況の組み合わせ
function storeStatus(正本: string, status: string) {
  return async ({ page, step, expected }: Ctx) => {
    const p = await signIn(page);
    const no = 番号(正本);
    note(`店舗Aは本店（${店舗Aの店名()}）`);
    await step(1, async () => { await p.open(); });
    await step(2, async () => { await p.selectTenants(["全店", 店舗Aの店名()]); });
    await step(3, async () => { await showDetail(p); });
    await step(4, async () => { await p.orderNumber.fill(no); });
    await step(5, async () => { await p.checkStatusOnly([status]); });
    await step(6, async () => { await p.clickSearch(); });
    await expected(async () => {
      await expect(p.row(no), `店舗Aの${status}の受注（注文番号「${no}」）の行`).toHaveCount(1);
    });
  };
}
