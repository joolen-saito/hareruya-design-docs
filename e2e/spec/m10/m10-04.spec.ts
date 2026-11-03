/** M10-04 支払方法設定。正本: integration_test/casegen/cases/M10-04_test_cases.tsv
 * 実装しない: 008（支払方法を1件も無くす準備が要る）・062（会員の購入画面と複数ブラウザの大掛かりな準備。未着手）・DB での準備が要るシードのケース。 */
import { test, expect as pwExpect, Page } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { hideDebugToolbar } from "../../lib/session";
import { expectSaved } from "../../pages/admin/common";
import { PurchaseGroupPage } from "../../pages/admin/m03_22_purchase_group";
import { PaymentPage, 画像 } from "../../pages/admin/m10_04_payment";
import { 支払方法を読む } from "../../db/m10_04_payment";
import { M1004L_ADMIN, 名 } from "../../seeds/m10-04";

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
