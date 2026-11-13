/**
 * 試験店舗の使い回し（依頼者決定 2026-11-13）。
 * 齋藤さんの E2E が使う試験店舗は「試験支店」（店舗ID 1574・会社名 試験用会社・支店URL m0419branch）1件だけにし、
 * 2つの店舗が要るケースは「試験支店」＋本店（店舗ID 1）で読み替える。店舗は登録しない（店舗の登録は重く、開発環境が詰まるため）。
 */
import { Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

/** 使い回す試験用の支店（店名「試験支店」） */
export const 試験支店ID = "1574";
/** 本店（親店舗） */
export const 本店ID = "1";

/** 読み替えの注記（手順の注記・シードの注記に出す） */
export const 店舗読み替えの注記 = (シード表の店名: string, 使った店舗: string, 店舗ID: string): string =>
  `依頼者決定 2026-11-13: 試験店舗は試験支店（1574）と本店で読み替えた（シード表の店名「${シード表の店名}」の代わりに、店舗ID ${店舗ID}「${使った店舗}」を使った）`;

/** メンバー登録画面の所属店舗の選択肢から、店舗IDの表示名（店名）を読む。無ければ止める */
export async function 店舗の表示名(page: Page, 店舗ID: string): Promise<string> {
  const res = await page.goto(adminUrl("/setting/system/member/new"));
  if (!res || !res.ok()) throw new Error(`メンバー登録画面を開けない（応答 ${res?.status() ?? "なし"}）`);
  await page.waitForLoadState("load");
  const text = await page.locator(`[name="admin_member[baseInfo]"] option[value="${店舗ID}"]`).first().textContent({ timeout: 30_000 }).catch(() => null);
  if (text === null) throw new Error(`店舗ID ${店舗ID} の店舗が所属店舗の選択肢に無い（店舗が消えた可能性）`);
  return text.replace(/\s+/g, " ").trim();
}

/** 試験支店・本店の店名を読み、期待の店舗（試験支店は店名「試験支店」）であることを確かめる */
export async function 試験店舗の名前を読む(page: Page): Promise<{ 試験支店: string; 本店: string }> {
  const 試験支店 = await 店舗の表示名(page, 試験支店ID);
  if (!試験支店.startsWith("試験支店")) throw new Error(`店舗ID ${試験支店ID} の店名が「試験支店」でない: 「${試験支店}」`);
  const 本店 = await 店舗の表示名(page, 本店ID);
  return { 試験支店, 本店 };
}
