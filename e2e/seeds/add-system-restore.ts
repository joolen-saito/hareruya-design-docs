/**
 * 追加システム設定（全店共通の設定。共有の開発環境で全員が使う）を書き換える共通の手続き（M10-16・F05-06 のシードが使う。シードの登録は含まない）。
 *
 * 1. 書き換える前に、画面の全項目の値を控える（決め打ちの値にしない）。
 * 2. 控えた値のまま「登録」を押し、「保存しました」が出ることを確かめる（値が同じ項目は保存されないので、何も変わらない）。
 *    元の値が入力規則に合わず画面から保存し直せないときは、ここで止まり、書き換えない（あとで元へ戻せないため）。
 * 3. lib/shared_restore.ts の registerRestore に「画面から全項目を控えの値へ戻す」手続きと「開き直して全項目が控えと同じか」の確かめを登録する。
 *    戻すのはケースの終わり（成否によらず。基盤が行う）。
 * 4. 指定された項目だけを書き換えて「登録」し、「保存しました」を確かめる。
 * 画面に入力欄が無い項目（ピッキングリスト分割しきい値価格など）は書き換えずに、呼んだ側へ返す（シードの注記に残す）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { registerRestore } from "../lib/shared_restore";
import { withAdminSession } from "../lib/session";
import { AddSystemPage, 追加システム設定の控え } from "../pages/admin/m10_16_add_system";

async function 読む(browser: Browser): Promise<追加システム設定の控え> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const p = new AddSystemPage(page);
    await p.開く();
    return p.全部読む();
  });
}

async function 控えへ戻す(browser: Browser, 元: 追加システム設定の控え, what: string): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const p = new AddSystemPage(page);
    await p.開く();
    await p.全部書く(元);
    await p.登録して保存を確かめる(what);
  });
}

async function 控えと同じか(browser: Browser, 元: 追加システム設定の控え): Promise<boolean> {
  const 今 = await 読む(browser);
  return Object.keys(元).every((k) => 元[k] === 今[k]) && Object.keys(今).every((k) => k in 元);
}

/**
 * 追加システム設定の項目（正本の項目名 → 値）を、元へ戻すことを登録してから書き換える。
 * 戻り値は、画面に入力欄が無く書き換えられなかった項目の名前。
 */
export async function 追加システム設定を控えて書き換える(browser: Browser, seedId: string, 値: Record<string, string>): Promise<string[]> {
  const 元 = await 読む(browser);
  const label = `追加システム設定（全項目。${seedId}）`;
  // 元の値のまま保存できるか（あとで画面から戻せるか）を、書き換える前に確かめる。値が同じ項目は保存されない
  await 控えへ戻す(browser, 元, `${label}: 書き換える前に、元の値のまま保存できるかを確かめる`);
  registerRestore(label, 元, () => 控えへ戻す(browser, 元, `${label}を元の値へ戻す`), () => 控えと同じか(browser, 元));
  const 無い: string[] = [];
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const p = new AddSystemPage(page);
    await p.開く();
    for (const [k, v] of Object.entries(値)) {
      if (!(await p.欄がある(k))) { 無い.push(k); continue; }
      await p.入れる(k, v);
    }
    await p.登録して保存を確かめる(`${seedId}: 追加システム設定の保存`);
  });
  return 無い;
}

/** 追加システム設定画面の今の表示値（正本の項目名で引く。入力欄の無い項目は null） */
export async function 追加システム設定の表示値(browser: Browser, 項目: string[]): Promise<Record<string, string | null>> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const p = new AddSystemPage(page);
    await p.開く();
    const out: Record<string, string | null> = {};
    for (const k of 項目) out[k] = await p.値(k);
    return out;
  });
}
