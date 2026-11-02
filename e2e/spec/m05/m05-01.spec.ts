/**
 * M05-01 受注情報検索 一覧(検索入力)。正本: cases/M05-01_test_cases.tsv
 *
 * 画面だけで準備できるケース（検索パターンの保存・選択・削除・件数表示の16件）を実装した（記録 review/M05-01_progress_2026-10-31.md）。
 * 受注を作る（注文番号・日付などをDBへ直接設定する）シードを使うケースと、手順にDBでの削除を含むケース（162・164）は実装しない。
 *
 * 決め打ちの識別の値（検索パターン名・注文番号・メールの前半・お名前）は rc() で実行ごとの印を付けて読む（依頼者決定 2026-10-28）。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { 条件に値を含む検索パターン, 値を含むか, 店舗の選択を含むか, 受注一覧の検索パターン } from "../../db/m05_01_search_pattern";
import { OrderSearchPage } from "../../pages/admin/m05_01_order_search";
import { M0501_ADMIN, 店舗Aの店名, 店舗Bの店名 } from "../../seeds/m05-01";

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
  await step(2, async () => { await p.tenants.selectOption([{ label: 店舗Aの店名 }, { label: 店舗Bの店名 }]); });
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
