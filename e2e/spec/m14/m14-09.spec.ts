/** M14-09 フォーマット一覧。正本: cases/M14-09_test_cases.tsv */
import { Page } from "@playwright/test";
import { caseTest, CaseBody, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { adminUrl, loginAdmin } from "../../lib/session";
import { カード名日のリーガリティ, フォーマットの指定数, フォーマットの値 } from "../../db/m14_10_format";
import { M1409_ADMIN } from "../../seeds/m14-09";

const 一覧を開く = async (page: Page): Promise<void> => {
  await page.goto(adminUrl("/format"));
  await page.waitForLoadState("load");
  await expect(page.locator('a[href$="/format/new"]').first(), "フォーマット一覧の「新規登録」").toBeVisible();
};
const 行 = (page: Page, 日: string, 英: string) => page.locator("tr").filter({ has: page.locator("a").filter({ hasText: new RegExp(`^\\s*${日.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} / ${英.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) }) });
/** 行の3点リーダーを押して「削除」を押し、確認ポップアップを出す */
const 削除ポップアップを開く = async (page: Page, 日: string, 英: string): Promise<void> => {
  const r = 行(page, 日, 英);
  await expect(r, `フォーマット一覧の「${日} / ${英}」の行`).toHaveCount(1);
  await r.locator("button.dropdown-menu-toggle").click({ timeout: 20_000 });
  await r.locator('a[data-bs-target="#DeleteModal"]').click({ timeout: 20_000 });
  await expect(page.locator("#DeleteModal"), "削除の確認ポップアップ").toBeVisible();
};
const 実行を押す = async (page: Page): Promise<{ status: number; url: string }> => {
  const [res] = await Promise.all([
    page.waitForResponse((r) => r.request().isNavigationRequest() && r.request().method() !== "GET", { timeout: 30_000 }).catch(() => null),
    page.locator("#DeleteModal [data-method=delete]").click({ timeout: 20_000 }),
  ]);
  await page.waitForLoadState("load").catch(() => undefined);
  return { status: res?.status() ?? 0, url: page.url() };
};

caseTest("IT-M14-09-007", async ({ page, step, expected }) => {
  await loginAdmin(page, M1409_ADMIN);
  await step(1, async () => { await 一覧を開く(page); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator('a[href$="/format/new"]').first().click({ timeout: 20_000 })]); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移先（フォーマット詳細(登録)画面）").toMatch(/\/format\/new$/);
    expect.soft(await page.locator('[name="admin_format[nameJp]"]').count(), "フォーマット名(日)の入力欄").toBe(1);
  });
});

type 対象 = { n: string; 日: string; 英: string };
const 対象 = (n: string, 日: string, 英: string): 対象 => ({ n, 日: rc(日), 英: rc(英) });
const 消す対象: Record<string, 対象> = {
  "011": 対象("011", "イベント使用中フォーマット-011", "Event Format 011"), "012": 対象("012", "イベント使用中フォーマット-012", "Event Format 012"),
  "015": 対象("015", "アーキタイプ使用中フォーマット-015", "Archetype Format 015"), "016": 対象("016", "アーキタイプ使用中フォーマット-016", "Archetype Format 016"),
  "017": 対象("017", "削除可能フォーマット-017", "Deletable Format 017"), "018": 対象("018", "削除可能フォーマット-018", "Deletable Format 018"),
  "027": 対象("027", "M1409-027-A", "M1409-027-A"),
};
const 識別子 = (n: string) => ({ n, 日: rc(`識別子確認フォーマット-${n}`), 英: rc(`Identifier Format ${n}`) });
const トークン = (n: string) => ({ n, 日: rc(`トークン確認フォーマット-${n}`), 英: rc(`Token Format ${n}`) });

/** 一覧 → 行の3点リーダーから削除 → ポップアップの「実行」（→ DBで確かめる）。確かめは 結果 を受け取る */
function 一覧で削除(o: { 対象: 対象; 確かめ: (c: { 結果: { status: number; url: string }; v: ReturnType<typeof フォーマットの値>; 指定数: number; id: string }) => void; DB: boolean }): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await loginAdmin(page, M1409_ADMIN);
    const id = notes.get(`〔フォーマットID-M1409-${o.対象.n}〕`);
    let 結果 = { status: 0, url: "" };
    let v: ReturnType<typeof フォーマットの値> = null;
    let 指定数 = -1;
    await step(1, async () => { await 一覧を開く(page); });
    await step(2, async () => { await 削除ポップアップを開く(page, o.対象.日, o.対象.英); });
    await step(3, async () => { 結果 = await 実行を押す(page); });
    if (o.DB) await step(4, async () => { v = フォーマットの値(id); 指定数 = フォーマットの指定数(id); });
    await expected(async () => {
      expect.soft(結果.status, "削除要求への応答があった（要求が送られた）").not.toBe(0);
      o.確かめ({ 結果, v, 指定数, id });
    });
  };
}
const 一覧へ戻る = ({ 結果 }: { 結果: { url: string } }) => { expect.soft(new URL(結果.url).pathname, "遷移先（フォーマット一覧画面）").toMatch(/\/format(\/page\/\d+)?$/); };

caseTest("IT-M14-09-011", 一覧で削除({ 対象: 消す対象["011"], DB: true, 確かめ: ({ v }) => { expect.soft(v !== null && !v.削除済み, "イベントが紐づくフォーマットが削除済みに変わっていない").toBe(true); } }));
caseTest("IT-M14-09-012", 一覧で削除({ 対象: 消す対象["012"], DB: false, 確かめ: 一覧へ戻る }));
caseTest("IT-M14-09-015", 一覧で削除({ 対象: 消す対象["015"], DB: true, 確かめ: ({ v }) => { expect.soft(v !== null && !v.削除済み, "アーキタイプが紐づくフォーマットが削除済みに変わっていない").toBe(true); } }));
caseTest("IT-M14-09-016", 一覧で削除({ 対象: 消す対象["016"], DB: false, 確かめ: 一覧へ戻る }));
caseTest("IT-M14-09-017", 一覧で削除({ 対象: 消す対象["017"], DB: true, 確かめ: ({ v, 指定数 }) => {
  expect.soft(指定数, "カードごとの禁止・制限の指定の数").toBe(0);
  expect.soft(v !== null && v.削除済み, "フォーマット本体が残ったまま削除済みとして記録されている").toBe(true);
} }));
caseTest("IT-M14-09-018", 一覧で削除({ 対象: 消す対象["018"], DB: false, 確かめ: 一覧へ戻る }));
caseTest("IT-M14-09-027", 一覧で削除({ 対象: 消す対象["027"], DB: true, 確かめ: ({ v }) => { expect.soft(v !== null && v.削除済み, "フォーマット本体が残ったまま削除済みとして記録されている").toBe(true); } }));

/** 削除ポップアップを開いたあと、要求の宛先やトークンを書き換えて「実行」を押す型 */
function 改ざん削除(o: { 対象: 対象; 宛先を変える?: string; トークン?: string; DB: boolean; 確かめ: (c: { status: number; v: ReturnType<typeof フォーマットの値> }) => void }): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await loginAdmin(page, M1409_ADMIN);
    const id = notes.get(`〔フォーマットID-M1409-${o.対象.n}〕`);
    let 結果 = { status: 0, url: "" };
    let v: ReturnType<typeof フォーマットの値> = null;
    await step(1, async () => { await 一覧を開く(page); });
    await step(2, async () => { await 削除ポップアップを開く(page, o.対象.日, o.対象.英); });
    await step(3, async () => {
      const link = page.locator("#DeleteModal [data-method=delete]");
      if (o.宛先を変える) await link.evaluate((a, x) => a.setAttribute("href", (a.getAttribute("href") ?? "").replace(/\/format\/\d+\/delete/, `/format/${x}/delete`)), o.宛先を変える);
      if (o.トークン !== undefined) await link.evaluate((a, t) => a.setAttribute("token-for-anchor", t), o.トークン);
    });
    await step(4, async () => { 結果 = await 実行を押す(page); });
    if (o.DB) await step(5, async () => { v = フォーマットの値(id); });
    await expected(async () => {
      expect.soft(結果.status, "削除要求への応答があった（要求が送られた）").not.toBe(0);
      o.確かめ({ status: 結果.status, v });
    });
  };
}
caseTest("IT-M14-09-019", 改ざん削除({ 対象: 識別子("019"), 宛先を変える: "999999019", DB: false, 確かめ: ({ status }) => { expect.soft(status, "削除要求への応答（該当なし）").toBe(404); } }));
caseTest("IT-M14-09-020", 改ざん削除({ 対象: 識別子("020"), 宛先を変える: "999999020", DB: true, 確かめ: ({ v }) => { expect.soft(v !== null && !v.削除済み, "フォーマットが削除済みに変わっていない").toBe(true); } }));
caseTest("IT-M14-09-021", 改ざん削除({ 対象: トークン("021"), トークン: "invalid-token", DB: false, 確かめ: ({ status }) => { expect.soft(status, "削除要求への応答（アクセス拒否）").toBe(403); } }));
caseTest("IT-M14-09-022", 改ざん削除({ 対象: トークン("022"), トークン: "invalid-token", DB: true, 確かめ: ({ v }) => { expect.soft(v !== null && !v.削除済み, "フォーマットが削除済みに変わっていない").toBe(true); } }));

caseTest("IT-M14-09-028", async ({ page, step, expected }) => {
  await loginAdmin(page, M1409_ADMIN);
  const A = { 日: rc("M1409-028-A"), 英: rc("M1409-028-A") }, B = rc("M1409-028-B");
  let 指定: string[] = [];
  await step(1, async () => { await 一覧を開く(page); });
  await step(2, async () => { await 削除ポップアップを開く(page, A.日, A.英); });
  await step(3, async () => { await 実行を押す(page); });
  await step(4, async () => { 指定 = カード名日のリーガリティ(rc("CARD-M1409-028-X")); });
  await expected(async () => {
    expect.soft(指定.filter((x) => x.startsWith(`${A.日}:`)), "「M1409-028-A」に対する禁止の指定（無くなる）").toEqual([]);
    expect.soft(指定.filter((x) => x.startsWith(`${B}:`)), "「M1409-028-B」に対する制限の指定（残る）").toEqual([`${B}:Restriction`]);
  });
});
