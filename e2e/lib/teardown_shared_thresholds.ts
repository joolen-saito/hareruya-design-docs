/**
 * Playwright の起動の終わり（globalTeardown）。≪共有の設定≫ 店舗ID 1・13 の高額商品閾値を、M04-33・M04-34 が書き換えたまま残していれば、決まった値へ戻す。
 * - 印（lib/shared_threshold_marker.ts）が無ければ、DB にもブラウザにも触らずにすぐ終わる（手元・DB の無い環境でも落ちない）。
 * - 戻すのは、印を置いた起動が自分のとき、または印を置いた起動がもう生きていないときだけ（昼に並べて流す、ほかの起動の最中に戻さない）。
 * - 戻したら DB で確かめ、.runs/shared_restore.log に、どの起動の終わりで戻したか・戻す前と後の値を書く。戻らなければ失敗にする。
 * - 2026-11-17: 追加システム設定（A06-12 の固定価格商品部門ID）の印（lib/shared_option_marker.ts）も、同じ決まりで見て戻す。
 *   閾値と設定は別々に戻し、片方が戻らなくても、もう片方は戻してから失敗にする。
 */
import { 印を読む, 印を消す, プロセスが生きている, 戻しを記録する } from "./shared_threshold_marker";

export default async function teardown(): Promise<void> {
  const 失敗: string[] = [];
  for (const 戻す of [閾値を戻す, 設定を戻す]) {
    try { await 戻す(); } catch (e) { 失敗.push(String((e as Error)?.message ?? e)); }
  }
  if (失敗.length) throw new Error(失敗.join(" / "));
}

async function 閾値を戻す(): Promise<void> {
  const 印 = 印を読む();
  if (!印) return;
  if (印.起動のPID !== process.pid && プロセスが生きている(印.起動のPID)) {
    戻しを記録する(`見送り: 印を置いた起動 pid=${印.起動のPID} がまだ動いている（その起動の終わりで戻す）`);
    return;
  }
  // 印があるときだけ DB・ブラウザを使う
  const { available } = await import("./db");
  if (!available) { 戻しを記録する(`失敗: DB に届かず、店舗ID ${印.店舗ID.join("・")} の閾値を確かめられない（印は残す）`); throw new Error("共有の設定（高額商品閾値）を確かめられない: DB に届かない"); }
  const { 店舗の高額商品閾値 } = await import("../db/m04_33");
  const 整える = (v: readonly string[]) => v.map((x) => (x ?? "").replace(/,/g, "").trim()).join("/");
  const 求める = 整える(印.戻す先);
  const 前 = Object.fromEntries(印.店舗ID.map((id) => [id, 整える(店舗の高額商品閾値(id))]));
  const ずれ = 印.店舗ID.filter((id) => 前[id] !== 求める);
  if (ずれ.length === 0) { 戻しを記録する(`戻す必要なし: 店舗ID ${印.店舗ID.join("・")} は ${求める}（印は起動 pid=${印.起動のPID}・${印.開始}）`); 印を消す(); return; }
  const { chromium } = await import("@playwright/test");
  const { withAdminSession } = await import("./session");
  const { SETUP_ADMIN } = await import("../config/env");
  const { setStoreThresholds } = await import("../pages/admin/m04_33_return_list");
  const browser = await chromium.launch();
  let 失敗 = "";
  try {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      for (const id of ずれ) await setStoreThresholds(page, id, 印.戻す先, `起動の終わり: 店舗ID ${id} の高額商品閾値を決まった値 ${求める} へ戻す（≪共有の設定≫）`, { 印を置かない: true });
    });
  } catch (e) { 失敗 = String(e).slice(0, 300); } finally { await browser.close().catch(() => undefined); }
  const 後 = Object.fromEntries(印.店舗ID.map((id) => [id, 整える(店舗の高額商品閾値(id))]));
  const 戻らない = 印.店舗ID.filter((id) => 後[id] !== 求める);
  const 値 = 印.店舗ID.map((id) => `店舗${id}: ${前[id]} → ${後[id]}`).join("・");
  if (戻らない.length > 0) {
    戻しを記録する(`失敗: ${値}（求める ${求める}）${失敗 ? `・${失敗}` : ""}（印は残す。印は起動 pid=${印.起動のPID}・${印.開始}）`);
    throw new Error(`共有の設定（高額商品閾値）を決まった値 ${求める} へ戻せない: ${値}`);
  }
  戻しを記録する(`戻した: ${値}（印は起動 pid=${印.起動のPID}・${印.開始}）`);
  印を消す();
}

/** 追加システム設定の印を見て、決まった値へ画面で戻す（印が無ければすぐ終わる） */
async function 設定を戻す(): Promise<void> {
  const { 設定の印を読む, 設定の印を消す, 決まった設定値 } = await import("./shared_option_marker");
  const 印 = 設定の印を読む();
  if (!印) return;
  if (印.起動のPID !== process.pid && プロセスが生きている(印.起動のPID)) {
    戻しを記録する(`見送り: 追加システム設定の印を置いた起動 pid=${印.起動のPID} がまだ動いている（その起動の終わりで戻す）`);
    return;
  }
  const { available } = await import("./db");
  if (!available) { 戻しを記録する(`失敗: DB に届かず、追加システム設定 ${印.設定.join("・")} を確かめられない（印は残す）`); throw new Error("共有の設定（追加システム設定）を確かめられない: DB に届かない"); }
  const { 固定価格商品部門IDの設定 } = await import("../db/a06");
  const 読む: Record<string, () => string> = { 固定価格商品部門ID: () => (固定価格商品部門IDの設定() ?? "").trim() };
  const 前 = Object.fromEntries(印.設定.map((k) => [k, 読む[k]()]));
  const ずれ = 印.設定.filter((k) => 前[k] !== 決まった設定値[k]);
  const 値 = (v: Record<string, string>) => 印.設定.map((k) => `${k}: ${v[k]}`).join("・");
  if (ずれ.length === 0) { 戻しを記録する(`戻す必要なし: 追加システム設定 ${値(前)}（印は起動 pid=${印.起動のPID}・${印.開始}）`); 設定の印を消す(); return; }
  const { chromium } = await import("@playwright/test");
  const { withAdminSession } = await import("./session");
  const { SETUP_ADMIN } = await import("../config/env");
  const { AddSystemPage } = await import("../pages/admin/m10_16_add_system");
  const browser = await chromium.launch();
  let 失敗 = "";
  try {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      const a = new AddSystemPage(page);
      await a.開く();
      for (const k of ずれ) await a.入れる(k, 決まった設定値[k]);
      const r = await a.登録する();
      if (!r.送った) throw new Error(`追加システム設定の登録が送られない（${r.止めた項目.join(" / ")}）`);
    });
  } catch (e) { 失敗 = String(e).slice(0, 300); } finally { await browser.close().catch(() => undefined); }
  const 後 = Object.fromEntries(印.設定.map((k) => [k, 読む[k]()]));
  const 戻らない = 印.設定.filter((k) => 後[k] !== 決まった設定値[k]);
  const 前後 = 印.設定.map((k) => `${k}: ${前[k]} → ${後[k]}`).join("・");
  if (戻らない.length > 0) {
    戻しを記録する(`失敗: 追加システム設定 ${前後}（決まった値 ${印.設定.map((k) => 決まった設定値[k]).join("・")}）${失敗 ? `・${失敗}` : ""}（印は残す。印は起動 pid=${印.起動のPID}・${印.開始}）`);
    throw new Error(`共有の設定（追加システム設定）を決まった値へ戻せない: ${前後}`);
  }
  戻しを記録する(`戻した: 追加システム設定 ${前後}（印は起動 pid=${印.起動のPID}・${印.開始}）`);
  設定の印を消す();
}
