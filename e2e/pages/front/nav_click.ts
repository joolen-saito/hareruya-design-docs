/**
 * 押して画面が移るのを待つ（フロントの画面の部品が共通に使う）。
 *
 * 開発環境の ECTOP など重い画面へ移るとき、Playwright の click は「押したあとの画面の移り始め」を待ち、
 * その待ちが click の時間切れ（10〜30秒）を超えると、押せているのに click が失敗する。
 * 以前の部品は、この失敗を「固定ヘッダーで押せなかった」とみなして、移った先の画面で同じ部品をもう一度押そうとして止まっていた
 * （IT-F06-14-022・F06-21-014/015・F06-22-014/016・F06-23-003・F06-01-011/029・F06-04-003 など）。
 * ここでは click は押す操作だけを行い（noWaitAfter）、移るのは waitForNavigation で待つ。
 * 押す操作そのものができなかったとき（要素に固定ヘッダーが重なる など）だけ、画面がまだ移っておらず要素が残っていれば、操作を要素へ直接送る。
 */
import { Locator, Page, test } from "@playwright/test";

export type 押し方 = {
  /** 押す前に要素を画面の中ほどへ動かす（固定ヘッダーが重ならない位置。既定は動かす） */
  中ほどへ?: boolean;
  /** 普通のクリックができなかったとき、操作を要素へ直接送って続ける。そのときに残す注記の種類（省略すると直接送らずに止める） */
  直接送るときの注記?: string;
  /** 移り先を待つ段階（既定 domcontentloaded のあと load まで待つ） */
  waitUntil?: "domcontentloaded" | "load";
  /** 押す操作の時間切れ（既定 10秒） */
  押す時間?: number;
  /** 移るのを待つ時間切れ（既定 60秒） */
  移る時間?: number;
};

/** l を押して、画面が移り終わるまで待つ。移った先の応答を返す */
export async function 押して移るのを待つ(page: Page, l: Locator, o: 押し方 = {}) {
  if (o.中ほどへ !== false) await l.evaluate((el) => el.scrollIntoView({ block: "center" }));
  const before = page.url();
  const nav = page.waitForNavigation({ waitUntil: o.waitUntil ?? "domcontentloaded", timeout: o.移る時間 ?? 60_000 });
  nav.catch(() => undefined); // 押す前に止まったときに、待ちの失敗が別に出ないようにする（下で await する）
  try {
    await l.click({ timeout: o.押す時間 ?? 10_000, noWaitAfter: true });
  } catch (e) {
    if (o.直接送るときの注記 === undefined) throw e;
    // 画面が移り始めている・要素が無くなっているときは押せている。もう一度押さない
    if (page.url() === before && (await l.count().catch(() => 0)) > 0) {
      test.info().annotations.push({ type: o.直接送るときの注記, description: `この要素は固定ヘッダーが上に重なり、普通のクリックでは押せなかった。クリックの操作を要素へ直接送って続けた（${String(e).split("\n")[0].slice(0, 80)}）` });
      await l.dispatchEvent("click", undefined, { timeout: 10_000 });
    }
  }
  const res = await nav;
  if ((o.waitUntil ?? "domcontentloaded") === "domcontentloaded") await page.waitForLoadState("load");
  return res;
}
