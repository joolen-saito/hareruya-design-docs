/**
 * M12-02 日別・月別集計 CSV出力 の印つきの店舗を、店舗登録画面で新しく作る。
 * 依頼者決定 2026-11-11「店舗は新しく作って実行の印をつけてよい」。店名・ショップ名略称は、店名に実行の印を付けた値（rc）。
 * 開発環境の店舗は変えない（足すだけ）。店舗一覧は店名の完全一致で探す。M12-01 の店舗（pages/admin/m12_01_stores.ts）と店名が重ならないよう、
 * 呼び名は「<正本の店名>」または「<正本の店名>-M1202-<番号>」にする（同じ実行で M12-01 の店舗と集計行が混ざらないため）。
 */
import { Page } from "@playwright/test";
import { rc, RUN_MARK } from "../../lib/run_marker";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { findTenantId } from "./tenant";

export type M1202店舗の定め = { 名前: string; 表示順: number; カナ: string; 英語: string };

const 略称候補 = () => {
  const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 3 }, () => c[Math.floor(Math.random() * c.length)]).join("");
};

/** 店名から作る、短い英数字のしるし（URL・メールアドレスが店舗ごとに違う値になるように使う） */
function しるし(名前: string): string {
  let h = 0;
  for (const ch of 名前) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return h.toString(36);
}

async function 登録する(page: Page, d: M1202店舗の定め, 店名: string, 略称: string): Promise<void> {
  await page.goto(adminUrl("/mall/tenant/create"));
  const f = (name: string) => page.locator(`[name="mall_tenant_shop_master[${name}]"]`);
  const url = `m1202${RUN_MARK.toLowerCase()}${しるし(d.名前)}`;
  await f("company_name").fill("試験用会社");
  await f("company_kana").fill("シケンヨウガイシャ");
  await f("shop_name").fill(店名);
  await f("shop_kana").fill(d.カナ);
  await f("shop_name_eng").fill(d.英語);
  await f("html_class_name").fill(url);
  await page.getByLabel("支店", { exact: true }).check();
  await page.getByLabel("公開", { exact: true }).check();
  await page.getByLabel("開店", { exact: true }).check();
  await page.getByLabel("表示する", { exact: true }).check();
  await f("postal_code").fill("1600023");
  await chooseByLabel(page.locator('[name="mall_tenant_shop_master[address][pref]"]'), "東京都");
  await page.locator('[name="mall_tenant_shop_master[address][addr01]"]').fill("新宿区西新宿");
  await page.locator('[name="mall_tenant_shop_master[address][addr02]"]').fill("1-1-1");
  await f("phone_number").fill("0312345678");
  for (const m of ["email01", "email02", "email03", "email04"]) await f(m).fill(`${url}@example.test`);
  await f("shop_digit").fill(略称);
  await f("short_name_jp").fill(店名);
  await f("rank").fill(String(d.表示順));
  await page.getByRole("button", { name: "登録", exact: true }).click();
  await expectSaved(page, `店舗「${店名}」の登録`);
}

/** 印つきの店舗があれば使い、無ければ店舗登録画面で作る（公開・開店・売上集計の検索項目「表示する」）。店舗ID・印つきの店名を返す */
export async function ensureM1202Store(page: Page, d: M1202店舗の定め, onIssue: (m: string) => void): Promise<{ id: string; 店名: string }> {
  const 店名 = rc(d.名前);
  const exist = await findTenantId(page, 店名);
  if (exist) return { id: exist, 店名 };
  let failure = "";
  for (let i = 0; i < 6; i++) {
    try { await 登録する(page, d, 店名, 略称候補()); } catch (e) { failure = (e as Error).message.split("\n")[0]; }
    const id = await findTenantId(page, 店名);
    if (id) {
      if (failure) onIssue(`店舗登録画面で「${店名}」を登録したとき、登録は行われたが画面は成功を表示しなかった（${failure}）`);
      onIssue(`読み替え: 正本の店舗「${d.名前}」は、実行の印つきの店舗「${店名}」（店舗ID ${id}・表示順${d.表示順}・売上集計の検索項目「表示する」）を新しく作って使った`);
      return { id, 店名 };
    }
  }
  throw new Error(`店舗「${店名}」を登録できない: ${failure || "店舗一覧に出ない"}`);
}
