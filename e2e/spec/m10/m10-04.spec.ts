/** M10-04 支払方法設定。正本: integration_test/casegen/cases/M10-04_test_cases.tsv
 * 実装しない: 008（支払方法を1件も無くす準備が要る）・010 011 069（アプリに「手数料設定可否」の持ち方が無く、状態を作れない）・
 * 050（旧・大会専用の支払方法は共有のマスタの名称を書き換える準備が要る）・062（会員の購入画面と複数ブラウザ・商品CSV・在庫CSVの大掛かりな準備）・
 * 063（共有の環境では支払方法がその1件だけの状態を作れない）。 */
import { test, expect as pwExpect, Page } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { hideDebugToolbar } from "../../lib/session";
import { expectSaved } from "../../pages/admin/common";
import { PurchaseGroupPage } from "../../pages/admin/m03_22_purchase_group";
import { PaymentPage, 画像, メール日, メール英 } from "../../pages/admin/m10_04_payment";
import { 支払方法を読む, 最大の表示順 } from "../../db/m10_04_payment";
import { M1004L_ADMIN, 名, 基本, 三件, 壱弐参, 名追加 } from "../../seeds/m10-04";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 条件付き注記 = "メール管理の「M10-04連携試験テンプレート」は作らず、元からある注文確認（銀行振込）のテンプレートを選んだ";
const ログイン = (page: Page) => loginAdmin(page, M1004L_ADMIN);
const 選択肢 = (g: PurchaseGroupPage) => g.支払方法.evaluateAll((ns) => ns.map((n) => (n as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? (n as HTMLInputElement).value));
const 新規入力 = (方法: string, 英: string, 手数料 = "100", 下限?: string, 上限?: string) => ({ 方法, 英, 手数料, 下限, 上限 });

caseTest("IT-M10-04-001", async ({ page, step, expected }) => {
  const p = new PaymentPage(page); const g = new PurchaseGroupPage(page);
  let 一覧: string[] = [];
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); });
  await step(3, async () => { await p.入れる(新規入力(名.p001(), 名.p001() + "-en")); note(条件付き注記); await p.登録を押す(); await expectSaved(page, "支払方法の登録"); });
  await step(4, async () => { await g.openNew(); });
  await step(5, async () => { 一覧 = await 選択肢(g); });
  await expected(async () => {
    expect.soft(一覧, "購入グループ管理の支払方法の選択肢").toContain(名.p001());
    expect.soft(一覧[0], "支払方法の選択肢の先頭（表示順の降順）").toBe(名.p001());
    expect.soft(await g.支払方法.count(), "支払方法のチェックボックスの数").toBeGreaterThan(0);
  });
});

caseTest("IT-M10-04-002", async ({ page, step, expected }) => {
  const p = new PaymentPage(page); const g = new PurchaseGroupPage(page);
  let 一覧: string[] = [];
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await g.openNew(); expect.soft(await 選択肢(g), "削除前の支払方法の選択肢").toContain(名.p002()); });
  await step(3, async () => { await p.openList(); await p.削除を押す(p.行(名.p002())); });
  await step(4, async () => { await p.モーダルで削除する(); await expectSaved(page, "支払方法の削除"); });
  await step(5, async () => { await g.openNew(); });
  await step(6, async () => { 一覧 = await 選択肢(g); });
  await expected(async () => { expect.soft(一覧, "削除後の支払方法の選択肢").not.toContain(名.p002()); });
});

caseTest("IT-M10-04-003", async ({ page, step, expected }) => {
  const p = new PaymentPage(page); const g = new PurchaseGroupPage(page);
  let 前 = "", 後 = "";
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => {
    await g.openNew();
    const 行 = g.rowsByName(名.g003()); await pwExpect(行, "購入グループの行").toHaveCount(1);
    expect.soft((await g.readRow(行)).支払方法, "変更前の支払方法欄").toContain(名.p003前());
  });
  await step(3, async () => { await p.openList(); await p.行(名.p003前()).locator("div.col-2 a").click({ timeout: 30_000 }); await pwExpect(p.支払方法欄).toBeVisible({ timeout: 30_000 }); });
  await step(4, async () => { await p.支払方法欄.fill(名.p003後(), { timeout: 30_000 }); await p.登録を押す(); await expectSaved(page, "支払方法の更新"); });
  await step(5, async () => { await g.openNew(); });
  await step(6, async () => { const 行 = g.rowsByName(名.g003()); await pwExpect(行).toHaveCount(1); const r = await g.readRow(行); 後 = r.支払方法; });
  await expected(async () => {
    expect.soft(後, "購入グループの支払方法欄").toContain(名.p003後());
    expect.soft(後.includes(名.p003前()), "購入グループの支払方法欄に変更前の名称が残っている").toBe(false);
  });
});

caseTest("IT-M10-04-004", async ({ page, step, expected }) => {
  const p = new PaymentPage(page);
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openList(); });
  await step(3, async () => { await p.新規登録ボタンを押す(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "移った画面（支払方法の編集画面・新規）").toMatch(/\/payment\/new$/);
    expect.soft(await p.支払方法欄.inputValue(), "支払方法の入力欄").toBe("");
  });
});

caseTest("IT-M10-04-005", async ({ page, step, expected }) => {
  const p = new PaymentPage(page);
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openList(); });
  await step(3, async () => { await p.行(名.p005()).locator("div.col-2 a").click({ timeout: 30_000 }); await pwExpect(p.支払方法欄).toBeVisible({ timeout: 30_000 }); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "移った画面（支払方法の編集画面）").toMatch(/\/payment\/\d+\/edit$/);
    expect.soft(await p.支払方法欄.inputValue(), "支払方法の入力欄").toBe(名.p005());
  });
});

caseTest("IT-M10-04-006", async ({ page, step, expected, notes }) => {
  const p = new PaymentPage(page);
  let r = { ID: "", 名称: "", 手数料: "", 利用条件: "", 操作: [] as string[] };
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openList(); });
  await step(3, async () => { const 行 = p.行(名.p006()); await pwExpect(行).toHaveCount(1); r = await p.行を読む(行); });
  await expected(async () => {
    expect.soft(r.ID, "一覧のID").toBe(notes.get("〔支払方法ID-M1004-006〕"));
    expect.soft(r.手数料.replace(/[¥￥,\s円]/g, ""), "一覧の手数料（数値）").toBe("250");
    expect.soft(r.利用条件, "一覧の利用条件").toBe("0円〜500円");
  });
});

caseTest("IT-M10-04-009", async ({ page, step, expected }) => {
  const p = new PaymentPage(page);
  let 編集 = 0, 削除 = 0;
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); });
  await step(3, async () => { await p.入れる(新規入力(名.p009(), 名.p009() + "-en")); note(条件付き注記); await p.登録を押す(); await expectSaved(page, "支払方法の登録"); });
  await step(4, async () => { await p.openList(); });
  await step(5, async () => {
    const 行 = p.行(名.p009()); await pwExpect(行).toHaveCount(1);
    編集 = await 行.locator('a[href$="/edit"]').count();
    削除 = await 行.locator('a[data-bs-target="#DeleteModal"]').count();
  });
  await expected(async () => {
    expect.soft(編集, "行の「編集」へのリンクの数").toBeGreaterThan(0);
    expect.soft(削除, "行の「削除」の操作の数").toBeGreaterThan(0);
  });
});

caseTest("IT-M10-04-012", async ({ page, step, expected }) => {
  const p = new PaymentPage(page);
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openList(); });
  await step(3, async () => { await p.行(名.p012()).locator("div.col-2 a").click({ timeout: 30_000 }); await pwExpect(p.支払方法欄).toBeVisible({ timeout: 30_000 }); });
  await expected(async () => {
    await pwExpect(p.ロゴのプレビュー.first(), "ロゴ画像欄").toBeVisible({ timeout: 30_000 }).catch(() => {});
    expect.soft(await p.ロゴのプレビュー.count(), "ロゴ画像欄のプレビューの数").toBeGreaterThan(0);
    expect.soft(await p.ロゴの値.inputValue(), "登録済みのロゴ画像").not.toBe("");
  });
});

caseTest("IT-M10-04-013", async ({ page, step, expected }) => {
  const p = new PaymentPage(page);
  const 見えた: Record<string, number> = {};
  const 選ぶ = async (n: string) => { await p.ロゴを選ぶ(画像(n)); await pwExpect(p.ロゴのプレビュー.first()).toBeVisible({ timeout: 30_000 }).catch(() => {}); 見えた[n] = await p.ロゴのプレビュー.count(); };
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); });
  await step(3, async () => { await 選ぶ("G013M1004n013-a.gif"); });
  await step(4, async () => { await 選ぶ("G013M1004n013-b.jpg"); });
  await step(5, async () => { await 選ぶ("G013M1004n013-c.png"); });
  await expected(async () => {
    for (const [n, c] of Object.entries(見えた)) expect.soft(c, `${n.split(".").pop()}を選んだ直後のプレビューの数`).toBeGreaterThan(0);
  });
});

caseTest("IT-M10-04-014", async ({ page, step, expected }) => {
  const p = new PaymentPage(page);
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); });
  await step(3, async () => {
    await p.入れる(新規入力(名.p014(), "G014M1004n014-en")); note(条件付き注記);
    await p.ロゴを選ぶ(画像("G014M1004n014-logo.png")); await pwExpect(p.ロゴの値).not.toHaveValue("", { timeout: 60_000 });
    await p.登録を押す(); await expectSaved(page, "支払方法の登録");
  });
  await step(4, async () => { await p.openList(); });
  await step(5, async () => { await p.行(名.p014()).locator("div.col-2 a").click({ timeout: 30_000 }); await pwExpect(p.支払方法欄).toBeVisible({ timeout: 30_000 }); });
  await expected(async () => {
    await pwExpect(p.ロゴのプレビュー.first()).toBeVisible({ timeout: 30_000 }).catch(() => {});
    expect.soft(await p.ロゴのプレビュー.count(), "ロゴ画像欄のプレビューの数").toBeGreaterThan(0);
  });
});

caseTest("IT-M10-04-016", async ({ page, step, expected }) => {
  const p = new PaymentPage(page);
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); });
  await step(3, async () => { await p.ロゴを選ぶ(画像("G016M1004n016-a.png")); await pwExpect(p.ロゴの値).not.toHaveValue("", { timeout: 60_000 }); });
  await step(4, async () => { await p.ロゴを選ぶ(画像("G016M1004n016-b.png")); await page.waitForTimeout(3000); });
  await expected(async () => { expect.soft(await p.ロゴのプレビュー.count(), "ロゴ画像欄のプレビューの数").toBe(1); });
});

caseTest("IT-M10-04-017", async ({ page, step, expected }) => {
  const p = new PaymentPage(page);
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); });
  await step(3, async () => {
    await p.ロゴを選ぶ(画像("G017M1004n017-logo.png")); await pwExpect(p.ロゴの値).not.toHaveValue("", { timeout: 60_000 });
    await pwExpect(p.ロゴのプレビュー.first()).toBeVisible({ timeout: 30_000 });
    await p.ロゴを取り消す();
  });
  await step(4, async () => { await p.入れる(新規入力(名.p017(), "G017M1004n017-en")); note(条件付き注記); await p.登録を押す(); await expectSaved(page, "支払方法の登録"); });
  await step(5, async () => { await p.openList(); });
  await step(6, async () => { await p.行(名.p017()).locator("div.col-2 a").click({ timeout: 30_000 }); await pwExpect(p.支払方法欄).toBeVisible({ timeout: 30_000 }); await page.waitForTimeout(2000); });
  await expected(async () => { expect.soft(await p.ロゴのプレビュー.count(), "ロゴ画像欄のプレビューの数").toBe(0); });
});

caseTest("IT-M10-04-018", async ({ page, step, expected }) => {
  const p = new PaymentPage(page);
  let 送信先 = "", 結果 = { status: 0, body: "" };
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); });
  await step(3, async () => {
    const req = page.waitForRequest((r) => /payment\/image\/process$/.test(r.url()), { timeout: 60_000 });
    await p.ロゴを選ぶ(画像("G018M1004n018-ref.gif"));
    const r = await req; 送信先 = new URL(r.url()).pathname;
    note(`画像追加の通信: 送信先 ${送信先}／項目名 payment_register[payment_image_file]／なりすまし対策トークンはヘッダーで渡る`);
  });
  await step(4, async () => { 結果 = await p.画像追加を送る({ name: "G018M1004n018-memo.txt", mimeType: "text/plain", buffer: Buffer.from("memo") }, { 非同期の見出し: true }); });
  await expected(async () => { expect.soft(結果.status, "画像ではないファイルの追加の応答（HTTPエラー）").toBeGreaterThanOrEqual(400); });
});

caseTest("IT-M10-04-025", async ({ page, step, expected }) => {
  const p = new PaymentPage(page);
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); });
  await step(3, async () => { await p.入れる(新規入力(名.p025(), "G025M1004n025-en")); note(条件付き注記); await p.登録を押す(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "保存後の画面（支払方法の編集画面）").toMatch(/\/payment\/\d+\/edit$/);
    expect.soft(await page.locator("li.sortable-item").count(), "支払方法一覧の行の数（一覧が表示されていない）").toBe(0);
  });
});

caseTest("IT-M10-04-029", async ({ page, step, expected }) => {
  const p = new PaymentPage(page);
  let db = { 手数料: "" as string | null };
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); });
  await step(3, async () => { await p.入れる(新規入力(名.p029(), "G029M1004n029-en", "999999999")); note(条件付き注記); await p.登録を押す(); await expectSaved(page, "支払方法の登録"); });
  await step(4, async () => { db = 支払方法を読む(名.p029()); });
  await expected(async () => { expect.soft(Number(db.手数料), "保存された手数料").toBe(999999999); });
});

caseTest("IT-M10-04-032", async ({ page, step, expected }) => {
  const p = new PaymentPage(page);
  let db = { 下限: "" as string | null, 上限: "" as string | null };
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); });
  await step(3, async () => { await p.入れる(新規入力(名.p032(), "G032M1004n032-en", "100", "100000000", "999999999")); note(条件付き注記); await p.登録を押す(); await expectSaved(page, "支払方法の登録"); });
  await step(4, async () => { db = 支払方法を読む(名.p032()); });
  await expected(async () => {
    expect.soft(Number(db.下限), "保存された利用条件の下限").toBe(100000000);
    expect.soft(Number(db.上限), "保存された利用条件の上限").toBe(999999999);
  });
});

caseTest("IT-M10-04-038", async ({ page, step, expected }) => {
  const p = new PaymentPage(page);
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openList(); });
  await step(3, async () => { await p.削除を押す(p.行(名.p038())); });
  await step(4, async () => { await p.モーダルで削除する(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "削除後の画面（支払方法一覧）").toMatch(/\/setting\/shop\/payment$/);
    await pwExpect(page.locator("li.sortable-item").first()).toBeVisible({ timeout: 30_000 });
    expect.soft(await p.行(名.p038()).count(), "削除した支払方法の行の数").toBe(0);
  });
});

caseTest("IT-M10-04-041", async ({ page, browser, step, expected }) => {
  const a = new PaymentPage(page);
  const ctxB = await browser.newContext({ locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(ctxB);
    const pageB = await ctxB.newPage();
    const b = new PaymentPage(pageB);
    await step(1, async () => { await ログイン(page); await loginAdmin(pageB, M1004L_ADMIN); });
    await step(2, async () => { await a.openList(); });
    await step(3, async () => { await b.openList(); await b.削除を押す(b.行(名.p041())); await b.モーダルで削除する(); await expectSaved(pageB, "ブラウザBでの削除"); });
    let 応答: number | null = null;
    await step(4, async () => { await a.削除を押す(a.行(名.p041())); 応答 = await a.モーダルで削除する(); });
    await expected(async () => {
      expect.soft(new URL(page.url()).pathname, "ブラウザAに表示された画面（支払方法一覧）").toMatch(/\/setting\/shop\/payment$/);
      expect.soft(応答 !== null && 応答 < 500, `ブラウザAの削除の応答（${応答}）がシステムエラーでない`).toBe(true);
    });
  } finally { await ctxB.close(); }
});

caseTest("IT-M10-04-042", async ({ page, step, expected }) => {
  const p = new PaymentPage(page);
  let 応答: number | null = null;
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openList(); });
  await step(3, async () => { await p.削除を押す(p.行(名.p042())); });
  await step(4, async () => { await p.なりすまし対策トークンを書き換える("G042M1004n042-invalid"); 応答 = await p.モーダルで削除する(); });
  await step(5, async () => { await p.openList(); });
  await expected(async () => {
    expect.soft(応答 !== null && 応答 >= 400, `削除の要求が拒否された（応答 ${応答}）`).toBe(true);
    expect.soft(await p.行(名.p042()).count(), "名称が一致する行の数（残っている）").toBe(1);
  });
});

caseTest("IT-M10-04-054", async ({ page, step, expected }) => {
  const p = new PaymentPage(page);
  let 結果 = { status: 0, body: "" };
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); });
  await step(3, async () => {
    const req = page.waitForRequest((r) => /payment\/image\/process$/.test(r.url()), { timeout: 60_000 });
    await p.ロゴを選ぶ(画像("G054M1004n054-ref.gif")); await req;
  });
  await step(4, async () => { 結果 = await p.画像追加を送る(画像("G054M1004n054-a.gif"), { 非同期の見出し: false }); });
  await expected(async () => { expect.soft(結果.status, "非同期でない追加の要求の応答（HTTPエラー）").toBeGreaterThanOrEqual(400); });
});

caseTest("IT-M10-04-055", async ({ page, step, expected }) => {
  const p = new PaymentPage(page);
  const 名前: string[] = [];
  const 受ける = () => page.waitForResponse((r) => /payment\/image\/process$/.test(r.url()), { timeout: 60_000 });
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); });
  await step(3, async () => { const r = 受ける(); await p.ロゴを選ぶ(画像("G055M1004n055-a.gif")); 名前.push(((await (await r).text()) ?? "").trim()); });
  await step(4, async () => {
    await p.ロゴを取り消す();
    const r = 受ける(); await p.ロゴを選ぶ(画像("G055M1004n055-a.gif")); 名前.push(((await (await r).text()) ?? "").trim());
  });
  await expected(async () => {
    expect.soft(名前.length, "控えた応答のファイル名の数").toBe(2);
    expect.soft(名前[0] !== 名前[1] && 名前[0] !== "", `2回の応答のファイル名が異なる（${名前.join(" / ")}）`).toBe(true);
  });
});

caseTest("IT-M10-04-059", async ({ page, step, expected }) => {
  const p = new PaymentPage(page);
  let 応答: number | null = null;
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openList(); });
  await step(3, async () => { await p.削除を押す(p.行(名.p059())); });
  await step(4, async () => { await p.なりすまし対策トークンを書き換える("G059M1004n059-invalid"); 応答 = await p.モーダルで削除する(); });
  await expected(async () => { expect.soft(応答 === 403 || (応答 !== null && 応答 >= 400), `アクセス拒否のHTTPエラー（応答 ${応答}）`).toBe(true); });
});

caseTest("IT-M10-04-067", async ({ page, step, expected }) => {
  const p = new PaymentPage(page);
  let db = { 手数料: "" as string | null };
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); });
  await step(3, async () => { await p.入れる(新規入力(名.p067(), "K067M1004n067-en", "0")); note(条件付き注記); await p.登録を押す(); await expectSaved(page, "支払方法の登録"); });
  await step(4, async () => { db = 支払方法を読む(名.p067()); });
  await expected(async () => { expect.soft(Number(db.手数料), "保存された手数料").toBe(0); });
});

caseTest("IT-M10-04-068", async ({ page, step, expected }) => {
  const p = new PaymentPage(page);
  let db = { 手数料: "" as string | null };
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); });
  await step(3, async () => { await p.入れる(新規入力(名.p068(), "K068M1004n068-en", "330")); note(条件付き注記); await p.登録を押す(); await expectSaved(page, "支払方法の登録"); });
  await step(4, async () => { db = 支払方法を読む(名.p068()); });
  await expected(async () => { expect.soft(Number(db.手数料), "保存された手数料").toBe(330); });
});

// ---------------- 追加分（2026-11-10） ----------------
const 共有の注記 = "シード表の「支払方法はこの1件／3件だけ」は、共有の環境に元からある支払方法を取り除かないので成り立たない。画面で作った印つきの支払方法の有無・並び・表示順の差で確かめた";
const 件数注記 = "一覧の件数の「増えていない」は、ほかの回が同時に支払方法を作ることがあるため、入力検証用の名称の行が無いことと既存の行が1件のままであることで確かめた";
const 順の確認注記 = "一覧には共有の支払方法もあるので、印つきの支払方法の並びだけを読む";
const 並び = (全: string[], 対象: string[]) => 全.filter((n) => 対象.includes(n));
const 表示順 = (名称: string) => Number(支払方法を読む(名称).表示順);

const 全 = (方法: string, 英: string) => 新規入力(方法, 英, "100");
/** 入力に誤りがあって登録されないケースの共通の動き（画面の操作と読み取りだけ。手順と期待結果の流れは各ケースに書く） */
async function 登録を試す(p: PaymentPage, v: ReturnType<typeof 新規入力>, メール?: { 日: string | null; 英: string | null }): Promise<void> {
  await p.入れる(v, メール); note(条件付き注記); note(共有の注記); await p.登録を押して応答を待つ();
}
async function 編集画面に留まって一覧へ戻る(p: PaymentPage): Promise<void> {
  expect.soft(new URL(p.page.url()).pathname, "登録を押したあとの画面（支払方法の編集画面・新規に留まる）").toMatch(/\/payment\/new$/);
  await p.一覧に戻る();
}
caseTest("IT-M10-04-019", async ({ page, step, expected }) => {
  const p = new PaymentPage(page); const 基 = 基本("019");
  let 名称: string[] = [];
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); });
  await step(3, async () => { await 登録を試す(p, 全("", "G019M1004n019-en")); });
  await step(4, async () => { await 編集画面に留まって一覧へ戻る(p); });
  await step(5, async () => { 名称 = await p.一覧の名称(); note(件数注記); });
  await expected(async () => {
    expect.soft(名称.filter((x) => x === 基.検証).length, "入力検証用の名称の行の数（登録されていない）").toBe(0);
    expect.soft(名称.filter((x) => x === 基.既存).length, "既存の支払方法の行の数").toBe(1);
  });
});
caseTest("IT-M10-04-020", async ({ page, step, expected }) => {
  const p = new PaymentPage(page); const 基 = 基本("020");
  let 名称: string[] = [];
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); });
  await step(3, async () => { await 登録を試す(p, 全(基.検証, "")); });
  await step(4, async () => { await 編集画面に留まって一覧へ戻る(p); });
  await step(5, async () => { 名称 = await p.一覧の名称(); note(件数注記); });
  await expected(async () => {
    expect.soft(名称.filter((x) => x === 基.検証).length, "入力検証用の名称の行の数（登録されていない）").toBe(0);
    expect.soft(名称.filter((x) => x === 基.既存).length, "既存の支払方法の行の数").toBe(1);
  });
});
caseTest("IT-M10-04-021", async ({ page, step, expected }) => {
  const p = new PaymentPage(page); const 基 = 基本("021");
  let 名称: string[] = [];
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); });
  await step(3, async () => { await 登録を試す(p, { ...全(基.検証, "G021M1004n021-en"), 手数料: "" }); });
  await step(4, async () => { await 編集画面に留まって一覧へ戻る(p); });
  await step(5, async () => { 名称 = await p.一覧の名称(); note(件数注記); });
  await expected(async () => {
    expect.soft(名称.filter((x) => x === 基.検証).length, "入力検証用の名称の行の数（登録されていない）").toBe(0);
    expect.soft(名称.filter((x) => x === 基.既存).length, "既存の支払方法の行の数").toBe(1);
  });
});
caseTest("IT-M10-04-022", async ({ page, step, expected }) => {
  const p = new PaymentPage(page); const 基 = 基本("022");
  let 名称: string[] = [];
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); });
  await step(3, async () => { await 登録を試す(p, 全(基.検証, "G022M1004n022-en"), { 日: null, 英: メール英 }); });
  await step(4, async () => { await 編集画面に留まって一覧へ戻る(p); });
  await step(5, async () => { 名称 = await p.一覧の名称(); note(件数注記); });
  await expected(async () => {
    expect.soft(名称.filter((x) => x === 基.検証).length, "入力検証用の名称の行の数（登録されていない）").toBe(0);
    expect.soft(名称.filter((x) => x === 基.既存).length, "既存の支払方法の行の数").toBe(1);
  });
});
caseTest("IT-M10-04-023", async ({ page, step, expected }) => {
  const p = new PaymentPage(page); const 基 = 基本("023");
  let 名称: string[] = [];
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); });
  await step(3, async () => { await 登録を試す(p, 全(基.検証, "G023M1004n023-en"), { 日: メール日, 英: null }); });
  await step(4, async () => { await 編集画面に留まって一覧へ戻る(p); });
  await step(5, async () => { 名称 = await p.一覧の名称(); note(件数注記); });
  await expected(async () => {
    expect.soft(名称.filter((x) => x === 基.検証).length, "入力検証用の名称の行の数（登録されていない）").toBe(0);
    expect.soft(名称.filter((x) => x === 基.既存).length, "既存の支払方法の行の数").toBe(1);
  });
});
caseTest("IT-M10-04-027", async ({ page, step, expected }) => {
  const p = new PaymentPage(page); const 基 = 基本("027");
  let 名称: string[] = [];
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); });
  await step(3, async () => { await 登録を試す(p, { ...全(基.検証, "G027M1004n027-en"), 下限: "abc" }); });
  await step(4, async () => { await 編集画面に留まって一覧へ戻る(p); });
  await step(5, async () => { 名称 = await p.一覧の名称(); note(件数注記); });
  await expected(async () => {
    expect.soft(名称.filter((x) => x === 基.検証).length, "入力検証用の名称の行の数（登録されていない）").toBe(0);
    expect.soft(名称.filter((x) => x === 基.既存).length, "既存の支払方法の行の数").toBe(1);
  });
});
caseTest("IT-M10-04-028", async ({ page, step, expected }) => {
  const p = new PaymentPage(page); const 基 = 基本("028");
  let 名称: string[] = [];
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); });
  await step(3, async () => { await 登録を試す(p, { ...全(基.検証, "G028M1004n028-en"), 手数料: "12.5" }); });
  await step(4, async () => { await 編集画面に留まって一覧へ戻る(p); });
  await step(5, async () => { 名称 = await p.一覧の名称(); note(件数注記); });
  await expected(async () => {
    expect.soft(名称.filter((x) => x === 基.検証).length, "入力検証用の名称の行の数（登録されていない）").toBe(0);
    expect.soft(名称.filter((x) => x === 基.既存).length, "既存の支払方法の行の数").toBe(1);
  });
});
caseTest("IT-M10-04-030", async ({ page, step, expected }) => {
  const p = new PaymentPage(page); const 基 = 基本("030");
  let 名称: string[] = [];
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); });
  await step(3, async () => { await 登録を試す(p, { ...全(基.検証, "G030M1004n030-en"), 手数料: "1000000000" }); });
  await step(4, async () => { await 編集画面に留まって一覧へ戻る(p); });
  await step(5, async () => { 名称 = await p.一覧の名称(); note(件数注記); });
  await expected(async () => {
    expect.soft(名称.filter((x) => x === 基.検証).length, "入力検証用の名称の行の数（登録されていない）").toBe(0);
    expect.soft(名称.filter((x) => x === 基.既存).length, "既存の支払方法の行の数").toBe(1);
  });
});
caseTest("IT-M10-04-031", async ({ page, step, expected }) => {
  const p = new PaymentPage(page); const 基 = 基本("031");
  let 名称: string[] = [];
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); });
  await step(3, async () => { await 登録を試す(p, { ...全(基.検証, "G031M1004n031-en"), 手数料: "-1" }); });
  await step(4, async () => { await 編集画面に留まって一覧へ戻る(p); });
  await step(5, async () => { 名称 = await p.一覧の名称(); note(件数注記); });
  await expected(async () => {
    expect.soft(名称.filter((x) => x === 基.検証).length, "入力検証用の名称の行の数（登録されていない）").toBe(0);
    expect.soft(名称.filter((x) => x === 基.既存).length, "既存の支払方法の行の数").toBe(1);
  });
});
caseTest("IT-M10-04-033", async ({ page, step, expected }) => {
  const p = new PaymentPage(page); const 基 = 基本("033");
  let 名称: string[] = [];
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); });
  await step(3, async () => { await 登録を試す(p, { ...全(基.検証, "G033M1004n033-en"), 下限: "1000000000" }); });
  await step(4, async () => { await 編集画面に留まって一覧へ戻る(p); });
  await step(5, async () => { 名称 = await p.一覧の名称(); note(件数注記); });
  await expected(async () => {
    expect.soft(名称.filter((x) => x === 基.検証).length, "入力検証用の名称の行の数（登録されていない）").toBe(0);
    expect.soft(名称.filter((x) => x === 基.既存).length, "既存の支払方法の行の数").toBe(1);
  });
});
caseTest("IT-M10-04-034", async ({ page, step, expected }) => {
  const p = new PaymentPage(page); const 基 = 基本("034");
  let 名称: string[] = [];
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); });
  await step(3, async () => { await 登録を試す(p, { ...全(基.検証, "G034M1004n034-en"), 上限: "1000000000" }); });
  await step(4, async () => { await 編集画面に留まって一覧へ戻る(p); });
  await step(5, async () => { 名称 = await p.一覧の名称(); note(件数注記); });
  await expected(async () => {
    expect.soft(名称.filter((x) => x === 基.検証).length, "入力検証用の名称の行の数（登録されていない）").toBe(0);
    expect.soft(名称.filter((x) => x === 基.既存).length, "既存の支払方法の行の数").toBe(1);
  });
});
caseTest("IT-M10-04-035", async ({ page, step, expected }) => {
  const p = new PaymentPage(page); const 基 = 基本("035");
  let 名称: string[] = [];
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); });
  await step(3, async () => { await 登録を試す(p, { ...全(基.検証, "G035M1004n035-en"), 下限: "-1" }); });
  await step(4, async () => { await 編集画面に留まって一覧へ戻る(p); });
  await step(5, async () => { 名称 = await p.一覧の名称(); note(件数注記); });
  await expected(async () => {
    expect.soft(名称.filter((x) => x === 基.検証).length, "入力検証用の名称の行の数（登録されていない）").toBe(0);
    expect.soft(名称.filter((x) => x === 基.既存).length, "既存の支払方法の行の数").toBe(1);
  });
});
caseTest("IT-M10-04-036", async ({ page, step, expected }) => {
  const p = new PaymentPage(page); const 基 = 基本("036");
  let 名称: string[] = [];
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); });
  await step(3, async () => { await 登録を試す(p, { ...全(基.検証, "G036M1004n036-en"), 上限: "-1" }); });
  await step(4, async () => { await 編集画面に留まって一覧へ戻る(p); });
  await step(5, async () => { 名称 = await p.一覧の名称(); note(件数注記); });
  await expected(async () => {
    expect.soft(名称.filter((x) => x === 基.検証).length, "入力検証用の名称の行の数（登録されていない）").toBe(0);
    expect.soft(名称.filter((x) => x === 基.既存).length, "既存の支払方法の行の数").toBe(1);
  });
});
caseTest("IT-M10-04-037", async ({ page, step, expected }) => {
  const p = new PaymentPage(page); const 基 = 基本("037");
  let 名称: string[] = [];
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); });
  await step(3, async () => { await 登録を試す(p, { ...全(基.検証, "G037M1004n037-en"), 下限: "500", 上限: "100" }); });
  await step(4, async () => { await 編集画面に留まって一覧へ戻る(p); });
  await step(5, async () => { 名称 = await p.一覧の名称(); note(件数注記); });
  await expected(async () => {
    expect.soft(名称.filter((x) => x === 基.検証).length, "入力検証用の名称の行の数（登録されていない）").toBe(0);
    expect.soft(名称.filter((x) => x === 基.既存).length, "既存の支払方法の行の数").toBe(1);
  });
});
caseTest("IT-M10-04-061", async ({ page, step, expected }) => {
  const p = new PaymentPage(page); const 基 = 基本("061");
  let 名称: string[] = [];
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); });
  await step(3, async () => { await 登録を試す(p, { ...全(基.検証, "G061M1004n061-en"), 下限: "100", 上限: "abc" }); });
  await step(4, async () => { await 編集画面に留まって一覧へ戻る(p); });
  await step(5, async () => { 名称 = await p.一覧の名称(); note(件数注記); });
  await expected(async () => {
    expect.soft(名称.filter((x) => x === 基.検証).length, "入力検証用の名称の行の数（登録されていない）").toBe(0);
    expect.soft(名称.filter((x) => x === 基.既存).length, "既存の支払方法の行の数").toBe(1);
  });
});

caseTest("IT-M10-04-024", async ({ page, step, expected }) => {
  const p = new PaymentPage(page);
  let 値 = { 方法: "", 英: "", 手数料: "", 日: "", 英メール: "", 下限: "", 上限: "" };
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); });
  await step(3, async () => {
    await p.入れる(新規入力(名追加.p024(), "G024M1004n024-en", "150", "100", "900"));
    note("メール管理の専用の日本語・英語のテンプレート2件は作らず（ほかのテンプレートを削除済みにするのは共有の設定の書き換えになる）、元からある注文確認（銀行振込）の日本語・英語のテンプレートを選んだ");
    await p.登録を押す(); await expectSaved(page, "支払方法の登録");
  });
  await step(4, async () => { await p.openList(); });
  await step(5, async () => {
    await p.行(名追加.p024()).locator("div.col-2 a").click({ timeout: 30_000 });
    await pwExpect(p.支払方法欄).toBeVisible({ timeout: 30_000 });
    値 = {
      方法: await p.支払方法欄.inputValue(), 英: await page.locator('[name="payment_register[payment_method_en]"]').inputValue(),
      手数料: await p.手数料欄.inputValue(), 日: await p.選ばれたメール("日"), 英メール: await p.選ばれたメール("英"),
      下限: await page.locator('[name="payment_register[rule_min]"]').inputValue(), 上限: await page.locator('[name="payment_register[rule_max]"]').inputValue(),
    };
  });
  await expected(async () => {
    expect.soft(値.方法, "支払方法").toBe(名追加.p024());
    expect.soft(値.英, "支払方法(英)").toBe("G024M1004n024-en");
    expect.soft(Number(値.手数料), "手数料").toBe(150);
    expect.soft(値.日, "メールテンプレート(日)").toBe(メール日);
    expect.soft(値.英メール, "メールテンプレート(英)").toBe(メール英);
    expect.soft(Number(値.下限), "利用条件の下限").toBe(100);
    expect.soft(Number(値.上限), "利用条件の上限").toBe(900);
  });
});

caseTest("IT-M10-04-026", async ({ page, step, expected }) => {
  const p = new PaymentPage(page);
  let 一覧: string[] = [], 日: string[] = [], 英: string[] = [];
  const 同じ = (a: string[], b: string[]) => JSON.stringify([...new Set(a)].sort()) === JSON.stringify([...new Set(b)].sort());
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { 一覧 = await p.メール管理の一覧(); note("シード表は未削除のテンプレートが2件だけと定めるが、ほかのテンプレートを削除済みにするのは共有の設定の書き換えになるので、メール管理の一覧に表示されたテンプレートと選択肢が一致するかで確かめた"); });
  await step(3, async () => { await p.openNew(); });
  await step(4, async () => { 日 = await p.メールの選択肢("日"); });
  await step(5, async () => { 英 = await p.メールの選択肢("英"); });
  await expected(async () => {
    expect.soft(一覧.length, "メール管理の一覧のテンプレート数").toBeGreaterThan(0);
    expect.soft(同じ(日, 一覧), `メールテンプレート(日)の選択肢（${日.length}件）がメール管理の一覧（${一覧.length}件）と一致する`).toBe(true);
    expect.soft(同じ(英, 一覧), `メールテンプレート(英)の選択肢（${英.length}件）がメール管理の一覧（${一覧.length}件）と一致する`).toBe(true);
  });
});

caseTest("IT-M10-04-039", async ({ page, step, expected }) => {
  const p = new PaymentPage(page); const x = 三件("039");
  let 前 = 0, 後 = 0;
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openList(); 前 = 表示順(x.甲) - 表示順(x.丙); });
  await step(3, async () => { await p.削除を押す(p.行(x.乙)); });
  await step(4, async () => { await p.モーダルで削除する(); await expectSaved(page, "支払方法の削除"); });
  await step(5, async () => { 後 = 表示順(x.甲) - 表示順(x.丙); note(共有の注記); });
  await expected(async () => {
    expect.soft(前, "削除前の、甲と丙の表示順の差（乙をはさんで2）").toBe(2);
    expect.soft(後, "削除後の、甲と丙の表示順の差（甲が1つ詰まって1）").toBe(1);
    expect.soft(await p.行(x.乙).count(), "削除した乙の行の数").toBe(0);
  });
});

caseTest("IT-M10-04-040", async ({ page, step, expected }) => {
  const p = new PaymentPage(page);
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openList(); });
  await step(3, async () => { await p.削除を押す(p.行(名追加.p040())); });
  await step(4, async () => { await p.モーダルで削除する(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "削除を押したあとの画面（支払方法一覧）").toMatch(/\/setting\/shop\/payment$/);
    await pwExpect(page.locator("li.sortable-item").first()).toBeVisible({ timeout: 30_000 });
    expect.soft(await p.行(名追加.p040()).count(), "関連データのある支払方法の行の数（削除されず残る）").toBe(1);
  });
});

caseTest("IT-M10-04-043", async ({ page, step, expected }) => {
  const p = new PaymentPage(page); const x = 三件("043");
  let 応答: number | null = null, 並び後: string[] = [];
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openList(); });
  await step(3, async () => { await p.非同期要求のトークンを書き換える("G043M1004n043-invalid"); });
  await step(4, async () => { 応答 = await p.動かす(p.行(x.乙), "上へ"); });
  await step(5, async () => { await p.openList(); 並び後 = 並び(await p.一覧の名称(), [x.甲, x.乙, x.丙]); note(順の確認注記); });
  await expected(async () => {
    expect.soft(応答 !== null && 応答 >= 400, `表示順の入れ替えの要求が拒否された（応答 ${応答}）`).toBe(true);
    expect.soft(並び後, "印つきの3件の並び（上から）").toEqual([x.甲, x.乙, x.丙]);
  });
});

type 表示順の組 = { 甲: number; 乙: number; 丙: number };
const 三件の表示順 = (x: { 甲: string; 乙: string; 丙: string }): 表示順の組 => ({ 甲: 表示順(x.甲), 乙: 表示順(x.乙), 丙: 表示順(x.丙) });
caseTest("IT-M10-04-044", async ({ page, step, expected }) => {
  const p = new PaymentPage(page); const x = 三件("044");
  let 前: 表示順の組 = { 甲: 0, 乙: 0, 丙: 0 }, 後: 表示順の組 = { 甲: 0, 乙: 0, 丙: 0 }, 並び後: string[] = [], 応答: number | null = null;
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openList(); 前 = 三件の表示順(x); });
  await step(3, async () => {
    応答 = await p.動かす(p.行(x.乙), "上へ");
    await p.openList(); 並び後 = 並び(await p.一覧の名称(), [x.甲, x.乙, x.丙]);
  });
  await step(4, async () => { 後 = 三件の表示順(x); note(共有の注記); note(順の確認注記); });
  await expected(async () => {
    expect.soft(応答 !== null && 応答 < 400, `表示順の入れ替えの要求が通った（応答 ${応答}）`).toBe(true);
    expect.soft(並び後, "印つきの3件の並び（上から）").toEqual([x.乙, x.甲, x.丙]);
    expect.soft(後.乙 - 後.丙, "乙の表示順（丙との差が、元の甲の差になる）").toBe(前.甲 - 前.丙);
    expect.soft(後.甲 - 後.丙, "甲の表示順（丙との差が、元の乙の差になる）").toBe(前.乙 - 前.丙);
  });
});
caseTest("IT-M10-04-045", async ({ page, step, expected }) => {
  const p = new PaymentPage(page); const x = 三件("045");
  let 前: 表示順の組 = { 甲: 0, 乙: 0, 丙: 0 }, 後: 表示順の組 = { 甲: 0, 乙: 0, 丙: 0 }, 並び後: string[] = [], 応答: number | null = null;
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openList(); 前 = 三件の表示順(x); });
  await step(3, async () => {
    応答 = await p.動かす(p.行(x.乙), "下へ");
    await p.openList(); 並び後 = 並び(await p.一覧の名称(), [x.甲, x.乙, x.丙]);
  });
  await step(4, async () => { 後 = 三件の表示順(x); note(共有の注記); note(順の確認注記); });
  await expected(async () => {
    expect.soft(応答 !== null && 応答 < 400, `表示順の入れ替えの要求が通った（応答 ${応答}）`).toBe(true);
    expect.soft(並び後, "印つきの3件の並び（上から）").toEqual([x.甲, x.丙, x.乙]);
    expect.soft(後.甲 - 後.乙, "乙の表示順（甲との差が、元の丙の差になる）").toBe(前.甲 - 前.丙);
    expect.soft(後.甲 - 後.丙, "丙の表示順（甲との差が、元の乙の差になる）").toBe(前.甲 - 前.乙);
  });
});

caseTest("IT-M10-04-046", async ({ page, step, expected }) => {
  const p = new PaymentPage(page); const x = 三件("046");
  let 甲 = { 編集: 0, 削除: 0, 上へ: "", 下へ: "" }, 丙 = { 編集: 0, 削除: 0, 上へ: "", 下へ: "" };
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openList(); });
  await step(3, async () => {
    甲 = await p.操作を読む(p.行(x.甲)); 丙 = await p.操作を読む(p.行(x.丙));
    note(`先頭の行の「上へ」は${甲.上へ}、末尾の行の「下へ」は${丙.下へ}（なし＝リンクが出ない／無効＝灰色で出るが押せない／有効＝押せる）。共有の支払方法が一覧にあるため、DBで甲を先頭、丙を末尾に置いた`);
  });
  await expected(async () => {
    expect.soft(甲.上へ, "先頭の甲の行の「上へ」").toBe("なし");
    expect.soft(丙.下へ, "末尾の丙の行の「下へ」").toBe("なし");
  });
});

caseTest("IT-M10-04-047", async ({ page, browser, step, expected }) => {
  const a = new PaymentPage(page); const x = 三件("047");
  const ctxB = await browser.newContext({ locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(ctxB);
    const pageB = await ctxB.newPage();
    const b = new PaymentPage(pageB);
    let 応答: number | null = null, 画面: string[] = [];
    await step(1, async () => { await ログイン(page); await loginAdmin(pageB, M1004L_ADMIN); });
    await step(2, async () => { await a.openList(); });
    await step(3, async () => { await b.openList(); await b.削除を押す(b.行(x.丙)); await b.モーダルで削除する(); await expectSaved(pageB, "ブラウザBでの削除"); });
    await step(4, async () => {
      応答 = await a.動かす(a.行(x.乙), "下へ");
      画面 = 並び(await a.一覧の名称(), [x.甲, x.乙, x.丙]);
      note(`ブラウザAの表示順の入れ替えの要求の応答は ${応答}。入れ替えのあとのブラウザAの画面の並びを読んだ（読み込み直さない）`); note(順の確認注記);
    });
    await expected(async () => { expect.soft(画面, "ブラウザAに表示された印つきの支払方法の並び（上から）").toEqual([x.甲, x.乙]); });
  } finally { await ctxB.close(); }
});

caseTest("IT-M10-04-048", async ({ page, step, expected }) => {
  const p = new PaymentPage(page); const 基 = 基本("048");
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); });
  await step(3, async () => { await p.支払方法欄.fill(基.途中, { timeout: 30_000 }); await p.一覧に戻る(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "移った画面（支払方法一覧）").toMatch(/\/setting\/shop\/payment$/);
    expect.soft(await p.行(基.途中).count(), "入力途中の名称の行の数").toBe(0);
  });
});

caseTest("IT-M10-04-049", async ({ page, step, expected }) => {
  const p = new PaymentPage(page); const x = 壱弐参();
  let 名称: string[] = [];
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openList(); 名称 = await p.一覧の名称(); note(共有の注記); note(順の確認注記); });
  await expected(async () => {
    expect.soft(並び(名称, [x.壱, x.弐, x.参]), "印つきの3件の並び（上から）").toEqual([x.参, x.弐, x.壱]);
    expect.soft(名称.includes(x.削除済み), "削除した支払方法が一覧にある").toBe(false);
  });
});

caseTest("IT-M10-04-051", async ({ page, step, expected }) => {
  const p = new PaymentPage(page);
  let 操作 = { 編集: 0, 削除: 0, 上へ: "", 下へ: "" };
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openList(); });
  await step(3, async () => { 操作 = await p.操作を読む(p.行(名追加.p051())); note("画面で作った支払方法は、固定扱いの値が既定で「固定扱い」になる（DBで設定し直す必要はない）。行の「編集」は名称のリンクと数えた"); });
  await expected(async () => {
    expect.soft(操作.編集, "行の「編集」へのリンクの数").toBe(0);
    expect.soft(操作.削除, "行の「削除」の操作の数").toBe(0);
  });
});

caseTest("IT-M10-04-052", async ({ page, step, expected }) => {
  const p = new PaymentPage(page); const x = 三件("052");
  let 操作 = { 編集: 0, 削除: 0, 上へ: "", 下へ: "" };
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openList(); });
  await step(3, async () => { 操作 = await p.操作を読む(p.行(x.乙)); note("行の「編集」は名称のリンクと数えた"); });
  await expected(async () => {
    expect.soft(操作.編集, "行の「編集」へのリンクの数").toBeGreaterThan(0);
    expect.soft(操作.削除, "行の「削除」の操作の数").toBeGreaterThan(0);
    expect.soft(操作.上へ, "行の「上へ」").toBe("有効");
    expect.soft(操作.下へ, "行の「下へ」").toBe("有効");
  });
});

caseTest("IT-M10-04-060", async ({ page, step, expected }) => {
  const p = new PaymentPage(page); const x = 三件("060");
  let 応答: number | null = null;
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openList(); });
  await step(3, async () => { await p.非同期要求のトークンを書き換える("G060M1004n060-invalid"); });
  await step(4, async () => { 応答 = await p.動かす(p.行(x.乙), "上へ"); });
  await expected(async () => { expect.soft(応答 !== null && 応答 >= 400, `アクセス拒否のHTTPエラー（応答 ${応答}）`).toBe(true); });
});

caseTest("IT-M10-04-066", async ({ page, step, expected }) => {
  const p = new PaymentPage(page); const 新 = 名追加.p066新規();
  let 最大 = 0, 先頭 = "", 表 = 0;
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await p.openNew(); 最大 = 最大の表示順(); });
  await step(3, async () => {
    await p.入れる(新規入力(新, "G066M1004n066-new-en")); note(条件付き注記); note(共有の注記);
    await p.登録を押す(); await expectSaved(page, "支払方法の登録");
  });
  await step(4, async () => { await p.openList(); 先頭 = (await p.一覧の名称())[0]; });
  await step(5, async () => { 表 = 表示順(新); });
  await expected(async () => {
    expect.soft(表, `新規支払方法の表示順（登録前の最大 ${最大} に1を加えた値）`).toBe(最大 + 1);
    expect.soft(先頭, "支払方法一覧の先頭の行の名称").toBe(新);
  });
});
