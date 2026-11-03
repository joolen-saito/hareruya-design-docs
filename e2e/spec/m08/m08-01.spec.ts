/**
 * M08-01 会員検索一覧。正本: cases/M08-01_test_cases.tsv
 * 実装しないケース（記録 review/M08-01_progress_*.md）: シードがDBで会員を0件にする・購入履歴などをDBで設定するもの、CSV出力の共有の設定を書き換えるもの、
 * メールの受信を確かめるもの、手順にDBでの書き換えを含むもの（056）。
 */
import { Dialog, test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { adminUrl } from "../../lib/session";
import { M08CustomerListPage } from "../../pages/admin/m08_customer_list";
import { 会員一覧の検索パターンの名前の長さ, 会員一覧の検索パターン, 会員一覧用の検索パターンの件数, 会員の削除フラグ, 検索パターンID, 保存の中身の値 } from "../../db/m08_01";
import { M0801_ADMIN, 名前034, 名前036, 名前037 } from "../../seeds/m08-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const isListPath = (p: string) => /^\/admin\/customer(\/page\/\d+)?\/?$/.test(p);

// ---- 検索入力画面の表示 ----
caseTest("IT-M08-01-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M0801_ADMIN);
  const list = new M08CustomerListPage(page);
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.showDetail(); });
  await expected(async () => {
    const text = await list.form.innerText();
    for (const w of ["誕生月", "DCIナンバー", "DCI確認フラグ", "移行インポート"]) {
      expect.soft(text.includes(w), `検索条件欄に「${w}」が表示されていない`).toBe(false);
    }
  });
});

caseTest("IT-M08-01-003", async ({ page, step, expected }) => {
  await loginAdmin(page, M0801_ADMIN);
  const list = new M08CustomerListPage(page);
  let 開いた後 = false, 閉じた後 = true;
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.toggleDetail(); 開いた後 = await list.詳細検索が開いているか(); });
  await step(3, async () => { await list.toggleDetail(); 閉じた後 = await list.詳細検索が開いているか(); });
  await expected(async () => {
    // 正本の期待結果は「非表示になった後、再度表示される」。1回目の後と2回目の後の表示を、その順に確かめる
    expect.soft(開いた後, "開閉ボタンを1回押した後は検索条件欄が非表示").toBe(false);
    expect.soft(閉じた後, "開閉ボタンをもう1回押した後は検索条件欄が再度表示").toBe(true);
  });
});

// ---- 検索パターンの保存 ----
caseTest("IT-M08-01-024", async ({ page, step, expected }) => {
  await loginAdmin(page, M0801_ADMIN);
  const list = new M08CustomerListPage(page);
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.showDetail(); await list.patternName.fill("条件なしパターン", { timeout: 30_000 }); });
  await step(3, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), list.saveButton.click({ timeout: 30_000 })]);
    await page.waitForLoadState("load");
  });
  let rows: ReturnType<typeof 会員一覧の検索パターン> = [];
  await step(4, async () => { rows = 会員一覧の検索パターン("条件なしパターン"); });
  await expected(async () => { expect.soft(rows.length, "会員一覧用の「条件なしパターン」の件数（開始時は0件）").toBe(1); });
});

caseTest("IT-M08-01-025", async ({ page, step, expected }) => {
  await loginAdmin(page, M0801_ADMIN);
  const list = new M08CustomerListPage(page);
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.showDetail(); await list.closeReason.fill("不正利用", { timeout: 30_000 }); await list.patternName.fill("退会理由検索", { timeout: 30_000 }); });
  await step(3, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), list.saveButton.click({ timeout: 30_000 })]);
    await page.waitForLoadState("load");
  });
  let rows: ReturnType<typeof 会員一覧の検索パターン> = [];
  await step(4, async () => { rows = 会員一覧の検索パターン("退会理由検索"); });
  await expected(async () => {
    expect.soft(rows.length, "会員一覧用の「退会理由検索」の件数").toBe(1);
    expect.soft(rows[0]?.名前 ?? null, "保存された名称").toBe("退会理由検索");
    expect.soft(保存の中身の値(rows[0]?.保存の中身 ?? null, "close_reason"), "保存された退会区分").toBe("不正利用");
  });
});

caseTest("IT-M08-01-029", async ({ page, step, expected }) => {
  await loginAdmin(page, M0801_ADMIN);
  const list = new M08CustomerListPage(page);
  const 名前 = "あ".repeat(30865);
  let 保存後の応答: string[] = [];
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.showDetail(); await list.patternName.fill(名前, { timeout: 60_000 }); });
  await step(3, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 120_000 }), list.saveButton.click({ timeout: 30_000 })]);
    await page.waitForLoadState("load");
    保存後の応答 = (await page.locator(".alert").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter((t) => t && !/デバッグモード/.test(t));
  });
  let 保存された名前の長さ: number[] = [];
  await step(4, async () => {
    保存された名前の長さ = 会員一覧の検索パターンの名前の長さ("あ");
  });
  await expected(async () => {
    if (保存後の応答.length) note(`保存後の画面のメッセージ: ${保存後の応答.join(" / ")}`);
    expect.soft(保存された名前の長さ.includes(30865), "「あ」30865文字の検索パターン名が保存されている（保存された名前の文字数）").toBe(true);
  });
});

// ---- 検索パターンの更新 ----
caseTest("IT-M08-01-031", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0801_ADMIN);
  const list = new M08CustomerListPage(page);
  const id = notes.get("〔検索パターンID-M0801-031〕");
  await step(1, async () => { await list.open(); await list.selectPattern("退会理由パターン-031"); });
  await step(2, async () => { await list.showDetail(); await list.patternName.fill("退会理由更新", { timeout: 30_000 }); await list.closeReason.fill("BAN", { timeout: 30_000 }); });
  await step(3, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), list.saveButton.click({ timeout: 30_000 })]);
    await page.waitForLoadState("load");
  });
  let rows: ReturnType<typeof 検索パターンID> = [];
  let 件数 = -1;
  await step(4, async () => { rows = 検索パターンID(id); 件数 = 会員一覧用の検索パターンの件数(); });
  await expected(async () => {
    expect.soft(rows[0]?.名前 ?? null, `検索パターンID ${id} の名称`).toBe("退会理由更新");
    expect.soft(保存の中身の値(rows[0]?.保存の中身 ?? null, "close_reason"), `検索パターンID ${id} の退会区分`).toBe("BAN");
    expect.soft(件数, "会員一覧用検索パターンの件数（追加されない）").toBe(1);
  });
});

caseTest("IT-M08-01-060", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0801_ADMIN);
  const list = new M08CustomerListPage(page);
  const a = notes.get("〔検索パターンID-M0801-060A〕"), b = notes.get("〔検索パターンID-M0801-060B〕");
  await step(1, async () => { await list.open(); await list.selectPattern("退会理由パターン-060A"); });
  await step(2, async () => { await list.showDetail(); await list.patternName.fill("退会理由更新-060", { timeout: 30_000 }); await list.closeReason.fill("BAN", { timeout: 30_000 }); });
  await step(3, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), list.saveButton.click({ timeout: 30_000 })]);
    await page.waitForLoadState("load");
  });
  let ra: ReturnType<typeof 検索パターンID> = [], rb: ReturnType<typeof 検索パターンID> = [];
  let 件数 = -1;
  await step(4, async () => { ra = 検索パターンID(a); rb = 検索パターンID(b); 件数 = 会員一覧用の検索パターンの件数(); });
  await expected(async () => {
    expect.soft(ra[0]?.名前 ?? null, `検索パターンID ${a} の名称`).toBe("退会理由更新-060");
    expect.soft(保存の中身の値(ra[0]?.保存の中身 ?? null, "close_reason"), `検索パターンID ${a} の退会区分`).toBe("BAN");
    expect.soft(rb[0]?.名前 ?? null, `検索パターンID ${b} の名称（変わらない）`).toBe("退会理由パターン-060B");
    expect.soft(保存の中身の値(rb[0]?.保存の中身 ?? null, "close_reason"), `検索パターンID ${b} の退会区分（変わらない）`).toBe("不正利用");
    expect.soft(件数, "会員一覧用検索パターンの件数（2件のまま）").toBe(2);
  });
});

// ---- 検索パターンの削除 ----
caseTest("IT-M08-01-034", async ({ page, step, expected }) => {
  await loginAdmin(page, M0801_ADMIN);
  const list = new M08CustomerListPage(page);
  let 通常 = -1, 検索時 = -1;
  await step(1, async () => { await list.open(); 通常 = await list.deleteButton.count(); });
  await step(2, async () => { await list.selectPattern(名前034()); });
  await step(3, async () => { await list.showDetail(); 検索時 = await list.deleteButton.filter({ visible: true }).count(); });
  await expected(async () => {
    expect.soft(通常, "通常表示での検索パターン削除ボタンの数（表示されない）").toBe(0);
    expect.soft(検索時, "検索パターンでの検索時の検索パターン削除ボタンの数（表示される）").toBe(1);
  });
});

caseTest("IT-M08-01-036", async ({ page, step, expected }) => {
  await loginAdmin(page, M0801_ADMIN);
  const list = new M08CustomerListPage(page);
  let pending: Awaited<ReturnType<M08CustomerListPage["削除ボタンを押す"]>> | undefined;
  await step(1, async () => { await list.open(); await list.selectPattern(名前036()); });
  await step(2, async () => { pending = await list.削除ボタンを押す(); });
  await step(3, async () => { await pending!.OKを押す(); });
  await expected(async () => {
    expect.soft(pending?.文 ?? "", "出た確認ダイアログの文").not.toBe("");
    expect.soft(isListPath(new URL(page.url()).pathname), `会員一覧画面へ遷移（${new URL(page.url()).pathname}）`).toBe(true);
    expect.soft(await list.form.isVisible(), "会員検索一覧の検索欄が表示されている").toBe(true);
  });
});

caseTest("IT-M08-01-037", async ({ page, step, expected }) => {
  await loginAdmin(page, M0801_ADMIN);
  const list = new M08CustomerListPage(page);
  const 応答: { url: string; status: number }[] = [];
  page.on("response", (r) => { if (r.request().resourceType() === "document") 応答.push({ url: r.url(), status: r.status() }); });
  await step(1, async () => { await list.open(); await list.selectPattern(名前037()); });
  await step(2, async () => {
    await page.goto(adminUrl("/customer/pattern/999999"), { timeout: 60_000 });
    await page.waitForLoadState("load");
  });
  await step(3, async () => { note("開発者ツールのネットワーク情報の代わりに、ページの読み込みの応答（HTTPステータス）を記録して確かめた"); });
  await expected(async () => {
    const r = 応答.filter((x) => /\/customer\/pattern\/999999$/.test(new URL(x.url).pathname));
    expect.soft(r.length, "検索パターンID 999999の要求の数").toBeGreaterThan(0);
    expect.soft(r[r.length - 1]?.status ?? 0, "検索パターンID 999999の要求のHTTPステータス").toBe(404);
  });
});

caseTest("IT-M08-01-061", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0801_ADMIN);
  const list = new M08CustomerListPage(page);
  const a = notes.get("〔検索パターンID-M0801-061A〕"), b = notes.get("〔検索パターンID-M0801-061B〕");
  let pending: Awaited<ReturnType<M08CustomerListPage["削除ボタンを押す"]>> | undefined;
  await step(1, async () => { await list.open(); await list.selectPattern("退会理由パターン-061A"); });
  await step(2, async () => { pending = await list.削除ボタンを押す(); });
  await step(3, async () => { await pending!.OKを押す(); });
  let ra: ReturnType<typeof 検索パターンID> = [], rb: ReturnType<typeof 検索パターンID> = [];
  await step(4, async () => { ra = 検索パターンID(a); rb = 検索パターンID(b); });
  await expected(async () => {
    expect.soft(ra.length, `検索パターンID ${a} の残り（DBから削除される）`).toBe(0);
    expect.soft(rb[0]?.名前 ?? null, `検索パターンID ${b} の名称（残る）`).toBe("退会理由パターン-061B");
    await list.open();
    expect.soft(await list.patternLinkNames(), "会員検索一覧(検索入力)画面の検索パターン欄").toEqual(["退会理由パターン-061B"]);
  });
});

// ---- 会員の削除 ----
function 会員削除(k: "054" | "055") {
  return async ({ page, notes, step, expected }: import("../../lib/case").CaseCtx): Promise<void> => {
    await loginAdmin(page, M0801_ADMIN);
    const list = new M08CustomerListPage(page);
    const id = notes.get(`〔会員ID-M0801-${k}〕`);
    await step(1, async () => { await list.open(); await list.searchMulti(id); });
    await step(2, async () => { await list.削除リンクを押す(id); });
    await step(3, async () => {
      note("削除の確認は、ブラウザの確認ダイアログではなく画面内のモーダルが出る。そのモーダルの「削除」ボタンを「OK」として押した");
      await list.確認モーダルで削除する(id);
    });
    if (k === "054") {
      let flg: string | null = null;
      await step(4, async () => { flg = 会員の削除フラグ(id); });
      await expected(async () => { expect.soft(flg, `会員ID ${id} の削除フラグ（1＝削除済み）`).toBe("1"); });
    } else {
      await expected(async () => {
        expect.soft(isListPath(new URL(page.url()).pathname), `会員一覧画面へ遷移（${new URL(page.url()).pathname}）`).toBe(true);
        expect.soft(await list.form.isVisible(), "会員検索一覧の検索欄が表示されている").toBe(true);
      });
    }
  };
}
caseTest("IT-M08-01-054", 会員削除("054"));
caseTest("IT-M08-01-055", 会員削除("055"));

caseTest("IT-M08-01-062", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0801_ADMIN);
  const id = notes.get("〔会員ID-M0801-062〕");
  const tab1 = new M08CustomerListPage(page);
  const tab2page = await page.context().newPage();
  const tab2 = new M08CustomerListPage(tab2page);
  try {
    await step(1, async () => { await tab1.open(); await tab1.searchMulti(id); await expect(tab1.row(id), "タブ1に会員の行が表示されている").toHaveCount(1); });
    await step(2, async () => {
      await tab2.open(); await tab2.searchMulti(id);
      await tab2.削除リンクを押す(id); await tab2.確認モーダルで削除する(id);
    });
    await step(3, async () => { await page.bringToFront(); await tab1.削除リンクを押す(id); });
    await step(4, async () => { await tab1.確認モーダルで削除する(id); });
    let 文: string[] = [];
    await step(5, async () => { 文 = (await tab1.flashes.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter((t) => t && !/デバッグモード/.test(t)); });
    await expected(async () => {
      expect.soft(文.some((t) => t.includes("既に削除されています")), `会員一覧画面のフラッシュメッセージ（${文.join(" / ")}）`).toBe(true);
    });
  } finally {
    await tab2page.close();
  }
});
