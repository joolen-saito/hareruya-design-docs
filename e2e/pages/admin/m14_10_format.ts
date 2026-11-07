/** M14-10 フォーマット新規登録・編集画面の操作（セレクタはここだけ）。既存の m14-10 の局所関数と同じ作り */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

export const 欄 = (page: Page, n: string) => page.locator(`[name="admin_format[${n}]"]`);

export async function 新規画面を開く(page: Page): Promise<void> {
  await page.goto(adminUrl("/format/new"));
  await page.waitForLoadState("load");
  await expect(欄(page, "nameJp"), "フォーマット新規登録・編集画面").toBeVisible();
}

export async function 編集画面を開く(page: Page, id: string): Promise<number> {
  const res = await page.goto(adminUrl(`/format/${id}/edit`));
  await page.waitForLoadState("load");
  if (res && res.ok()) await expect(欄(page, "nameJp"), "フォーマット新規登録・編集画面").toBeVisible();
  return res?.status() ?? 0;
}

/** 「登録」ボタンを押す。ブラウザの入力チェックが送信を止めたら sent=false。応答の状態も返す */
export async function 登録を押す(page: Page): Promise<{ sent: boolean; url: string; status: number }> {
  const resP = page.waitForResponse((r) => r.request().method() === "POST" && /\/format\/(new|\d+\/edit)/.test(r.url()), { timeout: 20_000 }).catch(() => null);
  await page.locator('button[type="submit"]').filter({ hasText: /^\s*(登録|新規登録)\s*$/ }).first().click({ timeout: 20_000, noWaitAfter: true });
  const res = await resP;
  await page.waitForLoadState("load").catch(() => undefined);
  // 保存後は画面が読み直される。成功メッセージ（または入力の誤り）が出るまで待ってから結果を見る（読み直し前の画面を見て取り違えない）
  if (res !== null) await page.locator(".alert-success, .invalid-feedback, .form-error-message").first().waitFor({ state: "visible", timeout: 15_000 }).catch(() => undefined);
  return { sent: res !== null, url: page.url(), status: res?.status() ?? 0 };
}

export type フォーマット入力 = {
  名日: string; 名英: string; 並び順: string; コード?: string; メイン上限?: string; メイン下限?: string; サイド上限?: string; サイド下限?: string;
  メタ日数?: string; ルール日?: string; ルール英?: string; 認定?: string;
  チェック?: Partial<Record<"searchFlg" | "productSearchFlg" | "rankingFlg" | "OtherMetaFlg" | "ArenaLegalFlg" | "IncludeBasicFlg" | "DeckbuilderFlg" | "isShownInEvent" | "useCommandFlg" | "commanderInMain" | "HighlanderFlg", boolean>>;
  統率上限?: string; 統率下限?: string;
};

export async function 入力する(page: Page, v: Partial<フォーマット入力>): Promise<void> {
  const set = async (n: string, x?: string) => { if (x !== undefined) await 欄(page, n).fill(x); };
  await set("nameJp", v.名日); await set("nameEn", v.名英); await set("rank", v.並び順); await set("code", v.コード);
  await set("mainMaxCardCount", v.メイン上限); await set("mainMinCardCount", v.メイン下限); await set("sideMaxCardCount", v.サイド上限); await set("sideMinCardCount", v.サイド下限);
  await set("MetaRange", v.メタ日数); await set("RuleJp", v.ルール日); await set("RuleEn", v.ルール英);
  if (v.認定 !== undefined) await 欄(page, "Certification").selectOption(v.認定 === "" ? { value: "" } : { label: v.認定 });
  for (const [k, on] of Object.entries(v.チェック ?? {})) await 欄(page, k).setChecked(on);
  await set("commandMaxCardCount", v.統率上限); await set("commandMinCardCount", v.統率下限);
}

/** 画面でフォーマットを登録し、フォーマットID（登録後の編集画面のアドレス）を返す */
export async function フォーマットを登録する(page: Page, v: フォーマット入力, what: string): Promise<string> {
  await 新規画面を開く(page);
  await 入力する(page, { メタ日数: "14", ...v });
  const r = await 登録を押す(page);
  if (!r.sent) throw new Error(`${what}: フォーマット「${v.名日}」を登録できない（ブラウザの入力チェックが送信を止めた）`);
  const warnings = await expectSaved(page, `${what}: フォーマット「${v.名日}」の登録`);
  void warnings;
  const id = /\/format\/(\d+)\/edit/.exec(page.url())?.[1];
  if (!id) throw new Error(`${what}: フォーマット「${v.名日}」を登録したが、編集画面へ移らない（${page.url()}）`);
  return id;
}

/** 削除ボタン → ポップアップの削除（実行）。応答の状態と、移った先を返す */
export async function 削除を実行する(page: Page, opt: { トークン?: string; 先を変える?: (href: string) => string } = {}): Promise<{ status: number; url: string }> {
  await page.locator('a.btn-ec-delete[data-bs-target="#DeleteModal"]').click({ timeout: 20_000 });
  const modal = page.locator("#DeleteModal");
  await expect(modal, "削除の確認ポップアップ").toBeVisible();
  const link = modal.locator('[data-method="delete"]');
  if (opt.トークン !== undefined) await link.evaluate((a, t) => a.setAttribute("token-for-anchor", t), opt.トークン);
  if (opt.先を変える) await link.evaluate((a, f) => { const fn = new Function("href", `return (${f})(href)`); a.setAttribute("href", fn(a.getAttribute("href") ?? "") as string); }, opt.先を変える.toString());
  const [res] = await Promise.all([
    page.waitForResponse((r) => r.request().isNavigationRequest() && r.request().method() !== "GET", { timeout: 30_000 }).catch(() => null),
    link.click({ timeout: 20_000 }),
  ]);
  await page.waitForLoadState("load").catch(() => undefined);
  return { status: res?.status() ?? 0, url: page.url() };
}
