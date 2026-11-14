/**
 * Playwright の起動の終わり（globalTeardown）。≪共有の設定≫ 店舗ID 1・13 の高額商品閾値を、M04-33・M04-34 が書き換えたまま残していれば、決まった値へ戻す。
 * - 印（lib/shared_threshold_marker.ts）が無ければ、DB にもブラウザにも触らずにすぐ終わる（手元・DB の無い環境でも落ちない）。
 * - 戻すのは、印を置いた起動が自分のとき、または印を置いた起動がもう生きていないときだけ（昼に並べて流す、ほかの起動の最中に戻さない）。
 * - 戻したら DB で確かめ、.runs/shared_restore.log に、どの起動の終わりで戻したか・戻す前と後の値を書く。戻らなければ失敗にする。
 */
import { 印を読む, 印を消す, プロセスが生きている, 戻しを記録する } from "./shared_threshold_marker";

export default async function teardown(): Promise<void> {
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
