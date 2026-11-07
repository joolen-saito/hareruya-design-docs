/** M14-08 カードセット詳細(登録・編集・削除)の残り。正本: cases/M14-08_test_cases.tsv */
import { test, Page } from "@playwright/test";
import { caseTest, CaseBody, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { adminUrl, loginAdmin } from "../../lib/session";
import { カードセットの値 } from "../../db/m14_08_cardset";
import { カードセットIDの件数, カードセットの件数 } from "../../db/m14_08_b_cardset";
import { 欄, 入力する, 削除を実行する, 登録を押す, 登録画面を開く, 編集画面を開く } from "../../pages/admin/m14_08_cardset";
import { solidPng } from "../../pages/admin/m14_08_png";
import { M1408_ADMIN } from "../../seeds/m14-08";
import { 編集前, 画像なし } from "../../seeds/m14-08-b";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 長い = (c: string, n: number) => c.repeat(n);
const 本文 = async (page: Page) => (await page.locator("body").innerText()).replace(/\s+/g, " ");
const IDから = (url: string) => /\/cardset\/(\d+)\/edit/.exec(url)?.[1] ?? "";

// ---------------------------------------------------------------------------
// 画面の表示
// ---------------------------------------------------------------------------

caseTest("IT-M14-08-003", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  let 更新: number = -1;
  await step(1, async () => { await 編集画面を開く(page, notes.get("〔カードセットID-M1408-003〕")); });
  await step(2, async () => { 更新 = await page.locator("button:visible, a:visible, input[type=submit]:visible").filter({ hasText: /^\s*更新\s*$/ }).count(); });
  await expected(async () => { expect.soft(更新, "「更新」ボタンの数").toBe(0); });
});

caseTest("IT-M14-08-050", async ({ page, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  let 画面 = "";
  await step(1, async () => { await 登録画面を開く(page); });
  await step(2, async () => { 画面 = (await page.locator("form#form1").innerText()).replace(/\s+/g, " "); });
  await expected(async () => { expect.soft(画面.includes("画像未登録"), "「画像未登録」のラベルが表示される").toBe(false); });
});

caseTest("IT-M14-08-051", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  let 画面 = "";
  await step(1, async () => { await 編集画面を開く(page, notes.get("〔カードセットID-M1408-051〕")); });
  await step(2, async () => { 画面 = (await page.locator("form#form1").innerText()).replace(/\s+/g, " "); });
  await expected(async () => { expect.soft(画面.includes("画像未登録"), "「画像未登録」のラベルが表示される").toBe(true); });
});

caseTest("IT-M14-08-052", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  let 画像: number = -1;
  await step(1, async () => { await 編集画面を開く(page, notes.get("〔カードセットID-M1408-052〕")); });
  await step(2, async () => { 画像 = await page.locator("form#form1 img").count(); });
  await expected(async () => { expect.soft(画像, "シンボル画像として表示されている画像の数").toBe(0); });
});

caseTest("IT-M14-08-024", async ({ page, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  const 日付 = 欄(page, "releaseDate");
  await step(1, async () => { await 登録画面を開く(page); });
  await step(2, async () => {
    await 日付.click({ position: { x: 6, y: 10 } }); // 欄の左端（先頭の入力部分）を押す
    note("リリース日の入力欄はブラウザ標準の日付入力で、カレンダーの部品は画面に無い（開く操作はできない）");
  });
  await step(3, async () => {
    // カレンダーの部品が画面に無く、ブラウザ標準の日付入力へキーボードで入れても年の欄に続けて入ってしまう（別の値になる）ため、欄へ日付そのものを入れる
    await 日付.fill("2026-09-02");
    note("日付の選択は、欄へ日付（2026年9月2日）を直接入れる操作で代えた（カレンダーの部品が画面に無いため。条件付き）");
  });
  await expected(async () => { expect.soft(await 日付.inputValue(), "リリース日の入力値").toBe("2026-09-02"); });
});

// ---------------------------------------------------------------------------
// 登録
// ---------------------------------------------------------------------------

caseTest("IT-M14-08-006", async ({ page, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  const 名日 = rc("新規カードセットA");
  let r = { sent: false, url: "" };
  let id = "";
  let 値: ReturnType<typeof カードセットの値> = null;
  let 件数 = -1;
  await step(1, async () => { await 登録画面を開く(page); });
  await step(2, async () => { await 入力する(page, { 名日, 名英: rc("New Card Set A"), 略称: rc("NCSA"), ブロック: "試験ブロック", リリース日: "2026-09-02", 特殊: true }); });
  await step(3, async () => { r = await 登録を押す(page); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); id = IDから(r.url); });
  await step(4, async () => { 値 = id ? カードセットの値(id) : null; 件数 = カードセットの件数(名日); });
  await expected(async () => {
    expect.soft(id, "新しく採番されたカードセットID（登録後の編集画面のアドレス）").toMatch(/^\d+$/);
    expect.soft(件数, "「新規カードセットA」のレコード数").toBe(1);
    expect.soft([値?.名日, 値?.名英, 値?.略称], "名称・英語名・略称").toEqual([名日, rc("New Card Set A"), rc("NCSA")]);
    expect.soft([値?.ブロック, 値?.リリース日, 値?.特殊セット], "ブロック・リリース日・特殊セットフラグ").toEqual(["試験ブロック", "2026-09-02", true]);
  });
});

caseTest("IT-M14-08-030", async ({ page, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  const 名日 = rc("画像登録セット");
  let r = { sent: false, url: "" };
  let id = "";
  let 値: ReturnType<typeof カードセットの値> = null;
  await step(1, async () => { await 登録画面を開く(page); });
  await step(2, async () => { await 入力する(page, { 名日, 名英: rc("Image Set"), 略称: rc("IMAGE"), リリース日: "2026-09-02" }); });
  await step(3, async () => { await 欄(page, "symbol_image_file").setInputFiles({ name: "new-symbol.png", mimeType: "image/png", buffer: solidPng(0, 160, 0) }); });
  await step(4, async () => { r = await 登録を押す(page); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); id = IDから(r.url); });
  await step(5, async () => { 値 = id ? カードセットの値(id) : null; });
  await expected(async () => {
    expect.soft(id, "登録後のカードセットID").toMatch(/^\d+$/);
    expect.soft(値?.シンボル画像 ?? null, "シンボル画像の値").toBe("new-symbol.png");
  });
});

caseTest("IT-M14-08-057", async ({ page, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  let r = { sent: false, url: "" };
  let 画面 = "";
  let 画像: number = -1;
  await step(1, async () => { await 登録画面を開く(page); });
  await step(2, async () => { await 入力する(page, { 名日: rc("新規画像なし-M1408CB057"), 名英: rc("New NoImage M1408CB057"), 略称: rc("M1408-CB057"), リリース日: "2026-09-03" }); });
  await step(3, async () => { r = await 登録を押す(page); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await step(4, async () => {
    画面 = (await page.locator("form#form1").innerText()).replace(/\s+/g, " ");
    画像 = await page.locator("form#form1 img").count();
  });
  await expected(async () => {
    expect.soft(IDから(r.url), "登録後の編集画面のカードセットID").toMatch(/^\d+$/);
    expect.soft(画像, "シンボル画像として表示されている画像の数").toBe(0);
    expect.soft(画面.includes("画像未登録"), "「画像未登録」のラベルが表示される").toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 更新
// ---------------------------------------------------------------------------

caseTest("IT-M14-08-013", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  const id = notes.get("〔カードセットID-M1408-013〕");
  const 新 = { 名日: rc("更新後カードセット"), 名英: rc("Updated Card Set"), 略称: rc("UPDATED") };
  let r = { sent: false, url: "" };
  let 値: ReturnType<typeof カードセットの値> = null;
  await step(1, async () => { await 編集画面を開く(page, id); });
  await step(2, async () => { await 入力する(page, { ...新, ブロック: "試験ブロック", リリース日: "2026-10-01", 特殊: true }); });
  await step(3, async () => { r = await 登録を押す(page); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await step(4, async () => { 値 = カードセットの値(id); });
  await expected(async () => {
    expect.soft([値?.名日, 値?.名英, 値?.略称], "名称・英語名・略称（更新後の値）").toEqual([新.名日, 新.名英, 新.略称]);
    expect.soft([値?.ブロック, 値?.リリース日, 値?.特殊セット], "ブロック・リリース日・特殊セットフラグ（更新後の値）").toEqual(["試験ブロック", "2026-10-01", true]);
    expect.soft(値?.シンボル画像 ?? null, "シンボル画像（変わらない）").toBeNull();
  });
});

caseTest("IT-M14-08-014", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  const id = notes.get("〔カードセットID-M1408-014〕");
  const 新 = { 名日: rc("任意項目空更新"), 名英: rc("Optional Empty Update"), 略称: rc("OEU") };
  let r = { sent: false, url: "" };
  let 前: ReturnType<typeof カードセットの値> = null;
  let 値: ReturnType<typeof カードセットの値> = null;
  await step(1, async () => { await 編集画面を開く(page, id); 前 = カードセットの値(id); });
  await step(2, async () => { await 入力する(page, { ...新, リリース日: "2026-10-02", ブロック: "未指定", 特殊: false }); });
  await step(3, async () => { r = await 登録を押す(page); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await step(4, async () => { 値 = カードセットの値(id); });
  await expected(async () => {
    expect.soft([前?.ブロック, 前?.特殊セット], "更新前: ブロック・特殊セットフラグ").toEqual(["試験ブロック", true]);
    expect.soft([値?.名日, 値?.名英, 値?.略称, 値?.リリース日], "名称・英語名・略称・リリース日（更新後の値）").toEqual([新.名日, 新.名英, 新.略称, "2026-10-02"]);
    expect.soft([値?.ブロック ?? null, 値?.特殊セット], "ブロック（未指定）・特殊セットフラグ（未選択）").toEqual([null, false]);
  });
});

caseTest("IT-M14-08-016", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  const id = notes.get("〔カードセットID-M1408-016A〕");
  let r = { sent: false, url: "" };
  let 画面 = "";
  await step(1, async () => { await 編集画面を開く(page, id); });
  await step(2, async () => { await 入力する(page, { 名日: "" }); });
  await step(3, async () => { r = await 登録を押す(page); if (!r.sent) note("ブラウザの入力チェック（必須の欄）が送信を止めた"); });
  await step(4, async () => { 画面 = await 本文(page); });
  await expected(async () => {
    expect.soft(r.sent, "登録要求が送信された").toBe(true);
    expect.soft(画面.includes(rc("収録カードA")), "収録カードリストに「収録カードA」が表示される").toBe(true);
  });
});

caseTest("IT-M14-08-017", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  const id = notes.get("〔カードセットID-M1408-017〕");
  let r = { sent: false, url: "" };
  let 値: ReturnType<typeof カードセットの値> = null;
  await step(1, async () => { await 編集画面を開く(page, id); });
  await step(2, async () => { await 入力する(page, { 名日: 長い("あ", 64), 名英: 長い("A", 64), 略称: 長い("B", 50) }); });
  await step(3, async () => { r = await 登録を押す(page); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await step(4, async () => { 値 = カードセットの値(id); });
  await expected(async () => {
    expect.soft([値?.名日.length, 値?.名英.length, 値?.略称.length], "名称・英語名・略称の文字数").toEqual([64, 64, 50]);
  });
});

caseTest("IT-M14-08-019", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  const id = notes.get("〔カードセットID-M1408-019〕");
  let r = { sent: false, url: "" };
  let 値: ReturnType<typeof カードセットの値> = null;
  await step(1, async () => { await 編集画面を開く(page, id); });
  await step(2, async () => { await 入力する(page, { 名日: "カードSet１", 名英: "Cardセット1" }); });
  await step(3, async () => { r = await 登録を押す(page); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await step(4, async () => { 値 = カードセットの値(id); });
  await expected(async () => {
    expect.soft([値?.名日, 値?.名英], "名称・英語名（半角・全角を含む入力値）").toEqual(["カードSet１", "Cardセット1"]);
  });
});

caseTest("IT-M14-08-020", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  const id = notes.get("〔カードセットID-M1408-020〕");
  let r = { sent: false, url: "" };
  let 値: ReturnType<typeof カードセットの値> = null;
  await step(1, async () => { await 編集画面を開く(page, id); });
  await step(2, async () => { await 入力する(page, { 略称: "SET-01_#" }); });
  await step(3, async () => { r = await 登録を押す(page); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await step(4, async () => { 値 = カードセットの値(id); });
  await expected(async () => { expect.soft(値?.略称, "略称").toBe("SET-01_#"); });
});

caseTest("IT-M14-08-026", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  const id = notes.get("〔カードセットID-M1408-026〕");
  let r = { sent: false, url: "" };
  await step(1, async () => { await 編集画面を開く(page, id); });
  await step(2, async () => { await 入力する(page, { 名日: rc("編集遷移確認セット") }); });
  await step(3, async () => { r = await 登録を押す(page); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await expected(async () => {
    expect.soft(IDから(page.url()), "遷移先のカードセットID（保存したカードセット）").toBe(id);
    expect.soft(await 欄(page, "nameJp").inputValue(), "表示されたカードセット名日本語").toBe(rc("編集遷移確認セット"));
  });
});

caseTest("IT-M14-08-055", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  const id = notes.get("〔カードセットID-M1408-055〕");
  let 前: ReturnType<typeof カードセットの値> = null;
  let 後: ReturnType<typeof カードセットの値> = null;
  let r = { sent: false, url: "" };
  await step(1, async () => { await 編集画面を開く(page, id); 前 = カードセットの値(id); });
  await step(2, async () => { await 欄(page, "symbol_image_file").setInputFiles({ name: "m1408-055-symbol.png", mimeType: "image/png", buffer: solidPng(0, 160, 0) }); });
  await step(3, async () => { r = await 登録を押す(page); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await step(4, async () => { 後 = カードセットの値(id); });
  await expected(async () => {
    expect.soft(前?.シンボル画像 ?? null, "取込前: シンボル画像の値（画像なし）").toBeNull();
    expect.soft(後?.シンボル画像 ?? null, "登録後: シンボル画像の値（設定された状態）").not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 不正なアクセス（ID・トークン）
// ---------------------------------------------------------------------------

/** 一覧を最後のページまで順に開き、IDの編集リンクを押す。見つからなければ null */
async function 一覧から編集リンクを開く(page: Page, id: string): Promise<boolean> {
  await page.goto(adminUrl("/cardset?page_count=100"));
  await page.waitForLoadState("load");
  for (let p = 1; p <= 12; p++) {
    const link = page.locator(`a[href$="/cardset/${id}/edit"]`).first();
    if (await link.count()) {
      // 編集リンクは行の3点リーダー（操作メニュー）の中にある
      const row = page.locator("tr").filter({ has: link });
      await row.locator("button.dropdown-menu-toggle").click({ timeout: 20_000 });
      await Promise.all([page.waitForNavigation({ waitUntil: "load" }), link.click({ timeout: 20_000 })]);
      return true;
    }
    const next = page.locator("#product_pagination a, .pagination a").filter({ hasText: /次|›|»|Next/ }).first();
    if (!(await next.count())) break;
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), next.click({ timeout: 20_000 })]);
  }
  return false;
}

caseTest("IT-M14-08-027", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  const id = notes.get("〔カードセットID-M1408-027〕");
  let 見つけた = false;
  let 応答 = 0;
  await step(1, async () => { await page.goto(adminUrl("/cardset")); await page.waitForLoadState("load"); });
  await step(2, async () => {
    見つけた = await 一覧から編集リンクを開く(page, id);
    if (!見つけた) { await 編集画面を開く(page, id); note("一覧で登録したカードセットの編集リンクを見つけられなかったので、編集画面のアドレスを直接開いた"); }
  });
  await step(3, async () => {
    const res = await page.goto(page.url().replace(/\/cardset\/\d+\/edit/, "/cardset/999999/edit"));
    応答 = res?.status() ?? 0;
  });
  await expected(async () => {
    expect.soft(応答, "カードセットID 999999 の編集画面の応答").toBe(404);
    expect.soft(await page.locator("form#form1").count(), "カードセット詳細（編集・削除）画面の表示").toBe(0);
  });
});

/** 開発者ツールで、画面の入力要素を取り除く・変える操作 */
async function トークンを操作する(page: Page, 操作: "削除" | "改ざん"): Promise<void> {
  await page.evaluate((op) => {
    const t = document.querySelector('input[name="admin_cardset[_token]"]') as HTMLInputElement | null;
    if (!t) throw new Error("なりすまし対策トークンの入力要素が無い");
    if (op === "削除") t.remove(); else t.value = "invalid-token";
  }, 操作);
}

async function 送って応答を見る(page: Page): Promise<{ status: number; sent: boolean }> {
  const resP = page.waitForResponse((r) => r.request().method() === "POST" && /\/cardset\/\d+\/edit/.test(r.url()), { timeout: 15_000 }).catch(() => null);
  await page.locator("form#form1 button[type=submit]").filter({ hasText: /^\s*登録\s*$/ }).click({ timeout: 20_000, noWaitAfter: true });
  const res = await resP;
  await page.waitForLoadState("load").catch(() => undefined);
  return { status: res?.status() ?? 0, sent: res !== null };
}

function トークンのケース(n: string, 操作: "削除" | "改ざん", 新名: string): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await loginAdmin(page, M1408_ADMIN);
    const sid = notes.get(`〔カードセットID-M1408-${n}〕`);
    let r = { status: 0, sent: false };
    let 値: ReturnType<typeof カードセットの値> = null;
    await step(1, async () => { await 編集画面を開く(page, sid); });
    await step(2, async () => { await 入力する(page, { 名日: rc(新名) }); });
    await step(3, async () => { await トークンを操作する(page, 操作); });
    await step(4, async () => { r = await 送って応答を見る(page); });
    await step(5, async () => { 値 = カードセットの値(sid); });
    await expected(async () => {
      expect.soft(r.sent, "登録要求が送信された").toBe(true);
      expect.soft(値?.名日, `カードセット名日本語（「編集前カードセット-${n}」のまま）`).toBe(編集前(n).日);
    });
  };
}
caseTest("IT-M14-08-028", トークンのケース("028", "削除", "トークン欠落更新"));
caseTest("IT-M14-08-029", トークンのケース("029", "改ざん", "トークン改ざん更新"));

caseTest("IT-M14-08-056", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  const sid = notes.get("〔カードセットID-M1408-056〕");
  let r = { status: 0, sent: false };
  let 画面 = "";
  await step(1, async () => { await 編集画面を開く(page, sid); });
  await step(2, async () => { await 入力する(page, { 名日: "" }); });
  await step(3, async () => { await トークンを操作する(page, "削除"); });
  await step(4, async () => { r = await 送って応答を見る(page); if (!r.sent) note("ブラウザの入力チェック（必須の欄）が送信を止めた"); 画面 = await 本文(page); });
  let 名日 = "";
  await step(5, async () => { 名日 = カードセットの値(sid)?.名日 ?? ""; });
  await expected(async () => {
    expect.soft(r.sent, "登録要求が送信された").toBe(true);
    expect.soft(r.status, "登録要求への応答（アクセス拒否）").toBe(403);
    expect.soft(画面.includes("保存に失敗"), "保存に失敗した旨のメッセージを伴う入力画面の再表示").toBe(false);
    expect.soft(名日, "カードセット名日本語（変わらない）").toBe(画像なし("056").日);
  });
});

// ---------------------------------------------------------------------------
// 収録カード
// ---------------------------------------------------------------------------

caseTest("IT-M14-08-033", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  let 画面 = "";
  await step(1, async () => { await 編集画面を開く(page, notes.get("〔カードセットID-M1408-033A〕")); });
  await step(2, async () => { 画面 = await 本文(page); });
  await expected(async () => {
    expect.soft(画面.includes(rc("収録カードA-033")), "「収録カードA-033」が表示される").toBe(true);
    expect.soft(画面.includes(rc("他セットカードB-033")), "他カードセットの「他セットカードB-033」が表示される").toBe(false);
  });
});

caseTest("IT-M14-08-034", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  const cardA = notes.get("〔カードID-M1408-034A〕");
  await step(1, async () => { await 編集画面を開く(page, notes.get("〔カードセットID-M1408-034A〕")); });
  await step(2, async () => {
    const link = page.locator("form#form1 table a").filter({ hasText: rc("収録カードA") }).first();
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), link.click({ timeout: 20_000 })]);
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移先（カード詳細(編集・削除)画面）").toMatch(new RegExp(`/card/${cardA}/edit$`));
  });
});

// ---------------------------------------------------------------------------
// 削除
// ---------------------------------------------------------------------------

caseTest("IT-M14-08-035", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  const id = notes.get("〔カードセットID-M1408-035〕");
  let 件数 = -1;
  await step(1, async () => { await 編集画面を開く(page, id); });
  await step(2, async () => { await page.locator('a.btn-ec-delete[data-bs-target="#DeleteModal"]').click({ timeout: 20_000 }); });
  await step(3, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 30_000 }), page.locator('#DeleteModal [data-method="delete"]').click({ timeout: 20_000 })]);
  });
  await step(4, async () => { 件数 = カードセットIDの件数(id); });
  await expected(async () => { expect.soft(件数, "カードセットIDのレコード数").toBe(0); });
});

caseTest("IT-M14-08-036", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  await step(1, async () => { await 編集画面を開く(page, notes.get("〔カードセットID-M1408-036〕")); });
  await step(2, async () => { await page.locator('a.btn-ec-delete[data-bs-target="#DeleteModal"]').click({ timeout: 20_000 }); });
  await step(3, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 30_000 }), page.locator('#DeleteModal [data-method="delete"]').click({ timeout: 20_000 })]);
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移先（カードセット一覧）").toMatch(/\/cardset(\/page\/\d+)?$/);
    expect.soft(await page.locator("#page_count_pulldown").count(), "カードセット一覧の表示件数の選択欄").toBe(1);
  });
});

caseTest("IT-M14-08-038", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  const id = notes.get("〔カードセットID-M1408-038〕");
  let 件数 = -1;
  await step(1, async () => { await 編集画面を開く(page, id); });
  await step(2, async () => { await page.locator('a.btn-ec-delete[data-bs-target="#DeleteModal"]').click({ timeout: 20_000 }); });
  await step(3, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 30_000 }), page.locator('#DeleteModal [data-method="delete"]').click({ timeout: 20_000 })]);
  });
  await step(4, async () => { 件数 = カードセットIDの件数(id); });
  await expected(async () => { expect.soft(件数, "収録カードがあるカードセットのレコード数（削除されない）").toBe(1); });
});

caseTest("IT-M14-08-039", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  await step(1, async () => { await 編集画面を開く(page, notes.get("〔カードセットID-M1408-039〕")); });
  await step(2, async () => { await page.locator('a.btn-ec-delete[data-bs-target="#DeleteModal"]').click({ timeout: 20_000 }); });
  await step(3, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 30_000 }), page.locator('#DeleteModal [data-method="delete"]').click({ timeout: 20_000 })]);
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移先（カードセット一覧）").toMatch(/\/cardset(\/page\/\d+)?$/);
  });
});

function 削除アドレス変更のケース(n: string, 変換: (href: string) => string, 何: string): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await loginAdmin(page, M1408_ADMIN);
    let 応答 = 0;
    await step(1, async () => { await 編集画面を開く(page, notes.get(`〔カードセットID-M1408-${n}〕`)); });
    await step(2, async () => { await page.locator('a.btn-ec-delete[data-bs-target="#DeleteModal"]').click({ timeout: 20_000 }); await expect(page.locator("#DeleteModal"), "削除の確認ポップアップ").toBeVisible(); });
    await step(3, async () => {
      await page.locator("#DeleteModal [data-method=delete]").evaluate((a, f) => { const fn = new Function("href", `return (${f})(href)`); a.setAttribute("href", fn(a.getAttribute("href") ?? "") as string); }, 変換.toString());
      note(`開発者ツールの代わりに、画面の仕組みの上で確認ポップアップの「実行」のリンク先から${何}した`);
    });
    await step(4, async () => {
      const [res] = await Promise.all([
        page.waitForResponse((r) => r.request().isNavigationRequest() && r.request().method() !== "GET", { timeout: 30_000 }).catch(() => null),
        page.locator("#DeleteModal [data-method=delete]").click({ timeout: 20_000 }),
      ]);
      応答 = res?.status() ?? 0;
    });
    await expected(async () => { expect.soft(応答, "削除要求への応答").toBe(404); });
  };
}
caseTest("IT-M14-08-040", 削除アドレス変更のケース("040", (h) => h.replace(/\/cardset\/\d+\/delete/, "/cardset//delete"), "カードセットIDを除去"));
caseTest("IT-M14-08-041", 削除アドレス変更のケース("041", (h) => h.replace(/\/cardset\/\d+\/delete/, "/cardset/999999/delete"), "カードセットIDを999999へ変更"));
