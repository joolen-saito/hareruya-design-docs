/**
 * 選択欄（select）の選択肢を、画面の上で一覧の形に広げたままにして、戻す関数を返す（足した部品。lib/evidence_other.ts の 選択肢を広げて撮る の姉妹）。
 *
 * 選択肢を広げて撮る は、広げて撮ってすぐ戻す（確かめた所の赤い枠の印は付かない）。こちらは広げたまま caseTest の自動のキャプチャ（印つき）に撮らせたいときに使い、
 * 撮り終えたら返された関数で元に戻す。値・選択は変えない。広げられなければ（選択欄が見つからない）何もしない関数を返す。
 *
 *   const 戻す = await 選択肢を広げたままにする(欄);
 *   await expected(async () => { … });   // 期待結果の画像は、広げた状態で撮られる
 *   await 戻す();
 */
import type { Locator } from "@playwright/test";

export async function 選択肢を広げたままにする(sel: Locator, 行数 = 20): Promise<() => Promise<void>> {
  const before = await sel.evaluate((el, n) => {
    const s = el as HTMLSelectElement;
    const old = { size: s.getAttribute("size"), style: s.getAttribute("style") };
    s.setAttribute("size", String(Math.min(n, s.options.length)));
    s.style.height = "auto"; s.style.overflowY = "auto"; s.style.position = "relative"; s.style.zIndex = "10";
    s.scrollIntoView({ block: "center" });
    return old;
  }, 行数).catch(() => undefined);
  return async () => {
    if (!before) return;
    await sel.evaluate((el, old) => {
      const s = el as HTMLSelectElement;
      if (old.size === null) s.removeAttribute("size"); else s.setAttribute("size", old.size);
      if (old.style === null) s.removeAttribute("style"); else s.setAttribute("style", old.style);
    }, before).catch(() => undefined);
  };
}
