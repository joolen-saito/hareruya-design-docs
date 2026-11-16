/**
 * フロントのトップ（/ja/・/en/・/ja/osaka/ など）を、トップそのものを確かめるケースで開く。
 *
 * 開発環境のトップは、アプリの作りで15〜60秒かかり、ときに 504（ゲートウェイの時間切れ）を返す
 * （ProductRepository::findProductClassesByIdsInGivenOrder が全店舗の在庫を結合する。アプリ側の問題として別に伝えてある）。
 * 2026-11-13 20:43 開発環境で、S-F03-03-ENV が「本店の公開側（/ja/）が開けない（504）」、F02-02 のシードがトップの表示の60秒の時間切れで落ちた。
 * トップを確かめるケースは、待ちを120秒にし、504 なら2回まで開き直す。期待結果（応答が400未満・画面の中身）は変えない。
 * 開き直しても 504 なら、その応答を返す（呼び出し側の確かめで落ちる）。
 */
import { Page, Response } from "@playwright/test";

/** 待ち（ミリ秒）と、504 のときに開き直す回数 */
export const トップの待ち = 120_000;
const 開き直す回数 = 2;

/** フロントのトップのパスか（/・/ja・/en・/ja/osaka など、本店と TC大阪支店の入口だけ。引数の付いたものは除く） */
export function トップのパスか(url: string): boolean {
  const u = new URL(url, "https://x");
  return /^\/((ja|en)(\/osaka)?\/?)?$/.test(u.pathname) && !u.search;
}

/** url を開く。待ちは120秒、応答が 504 なら2回まで開き直す。最後の応答を返す */
export async function トップを開く(page: Page, url: string, waitUntil: "load" | "domcontentloaded" = "load"): Promise<Response | null> {
  let res: Response | null = null;
  for (let i = 0; i <= 開き直す回数; i++) {
    res = await page.goto(url, { timeout: トップの待ち, waitUntil });
    if ((res?.status() ?? 0) !== 504) return res;
  }
  return res;
}
