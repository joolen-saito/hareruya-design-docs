/**
 * A06-06・A06-07 の「カードセット・プロモーション・保管コード（略称タグ）の値そのものを確かめる」ケース（A06-07 003、A06-06 002）が使う部品。
 * 作り方は seeds/a06-buying.ts（読み替えはそこに書いた）と同じ。正本の外の補い:
 * - カードセット・プロモーション・略称タグは全員が使うマスタなので、シード表の名前に決まった印（-E2E）を付けて1度だけ作り、使い回す
 *   （依頼者決定 2026-11-14「マスタは作ってよい」）。ケースの期待結果の同じ値も、同じ印を付けた値として読む。
 * - 保管コード名は、商品登録編集の略称タグ欄で選んだ略称タグの名称（商品に紐付く）。
 * - レアリティ「R」は、レアリティのマスタのコードが R の行（DB は読むだけ）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { query } from "../lib/db";
import { rc, rcFixed } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { カードを登録する, カード詳細IDs, ensureMaster } from "../pages/admin/m14_card";
import { カードセットを登録する } from "../pages/admin/m14_08_cardset";
import { 商品をカードにする } from "../pages/admin/m07_09_card";
import { ShortTagPage } from "../pages/admin/short_tag";
import { カード商品を作る, 試験部門を用意する, type カード商品の定め } from "./a06-buying";

export type 表示の関連の定め = {
  セット名日: string; セット名英: string; セット略称: string;
  プロモ名日: string; プロモ名英: string; プロモコード: string;
  棚名: string;
};
export type 表示の関連 = { セットID: string; プロモID: string; セット名: string; セット略称: string; プロモ名: string; 棚名: string };

const 先頭 = (sql: string, params: string[]): string | undefined => query(sql, params)[0]?.id ?? undefined;

/** カードセット・プロモーション・略称タグを、決まった印を付けて無ければ作る（あれば使い回す） */
export async function 表示の関連を用意する(browser: Browser, seedId: string, v: 表示の関連の定め): Promise<表示の関連> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const セット名 = rcFixed(v.セット名日);
  const セット略称 = rcFixed(v.セット略称);
  const プロモ名 = rcFixed(v.プロモ名日);
  const 棚名 = rcFixed(v.棚名);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    if (!先頭("select id::text as id from mtb_cardset where name_jp = $1 order by id limit 1", [セット名])) {
      await カードセットを登録する(page, { 名日: セット名, 名英: rcFixed(v.セット名英), 略称: セット略称 }, `${seedId}: カードセット「${セット名}」`);
      issue(`カードセット「${セット名}」（略称 ${セット略称}・リリース日 2025-09-18）をカードセット登録画面で1度だけ登録した（決まった印つき）`);
    } else issue(`カードセット「${セット名}」を使い回した（決まった印で1度だけ作ったもの）`);
    const 作った = await ensureMaster(page, "プロモーション", プロモ名, rcFixed(v.プロモ名英), `${seedId}`, `${v.プロモコード}E2E`);
    issue(作った ? `プロモーション「${プロモ名}」をMTGマスターデータ管理画面で1度だけ登録した（決まった印つき）` : `プロモーション「${プロモ名}」を使い回した`);
    if (!先頭("select id::text as id from mtb_storage_code where name = $1 order by id limit 1", [棚名])) {
      const t = new ShortTagPage(page);
      await t.openNew();
      await t.register({ 名称: 棚名, 並び順: "9000", アルファベット順: false }, `${seedId}: 略称タグ「${棚名}」の登録`);
      issue(`略称タグ「${棚名}」（並び順 9000）を略称タグ登録画面で1度だけ登録した（決まった印つき）`);
    } else issue(`略称タグ「${棚名}」を使い回した`);
  });
  const セットID = 先頭("select id::text as id from mtb_cardset where name_jp = $1 order by id limit 1", [セット名]);
  const プロモID = 先頭("select id::text as id from mtb_promotion where name_jp = $1 order by id limit 1", [プロモ名]);
  if (!セットID || !プロモID) throw new Error(`${seedId}: 登録したカードセット（${セット名}）かプロモーション（${プロモ名}）が DB に見つからない`);
  return { セットID, プロモID, セット名, セット略称, プロモ名, 棚名 };
}

/** レアリティのマスタでコードが R の行の番号（読むだけ） */
export function レアリティRのID(seedId: string): string {
  const id = 先頭("select id::text as id from mtb_rarity where code = 'R' order by id limit 1", []);
  if (!id) throw new Error(`${seedId}: レアリティのマスタにコード R が無い`);
  return id;
}

/** カードを1枚（カード詳細1件。カードセット・プロモ・レアリティR・カード番号を指定）登録する */
export async function 指定つきのカードを作る(browser: Browser, seedId: string, v: { カード名日: string; カード名英: string; 関連: 表示の関連; カード番号: string }): Promise<{ カードID: string; カード詳細ID: string; カード名: string }> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const カード名 = rc(v.カード名日);
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const カードID = await カードを登録する(page, {
      カード名日: カード名, カード名英: rc(v.カード名英), 点数で見たマナ: "0",
      詳細: { ID: { カードセット: v.関連.セットID, レアリティ: レアリティRのID(seedId), プロモ種別: v.関連.プロモID }, カード番号: v.カード番号 },
    }, `${seedId}: カード`, issue);
    const ids = await カード詳細IDs(page);
    if (ids.length !== 1) throw new Error(`${seedId}: 登録したカード（カードID ${カードID}）のカード詳細が ${ids.length} 件（1件のはず）`);
    issue(`カード「${カード名}」を、カードセット「${v.関連.セット名}」・レアリティR・プロモ「${v.関連.プロモ名}」・カード番号 ${v.カード番号}・Foil なしで登録した（レイアウト・フレームは選択肢の先頭／通常）`);
    return { カードID, カード詳細ID: ids[0], カード名 };
  });
}

/** 指定つきのカードの商品を、グッズ商品CSV登録＋カード指定で作り、略称タグ（保管コード）を付ける */
export async function 保管コードつきの商品を作る(browser: Browser, seedId: string, d: カード商品の定め & { カード: { カードID: string; カード詳細ID: string; カード名: string } }, 棚名: string) {
  const p = await カード商品を作る(browser, seedId, d);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await 商品をカードにする(page, p.商品ID, { 商品名: rc(d.商品名日), 商品名英: rc(d.商品名英), 略称タグ: 棚名 }, (m) => reportSeedIssue(seedId, m));
  });
  reportSeedIssue(seedId, `商品 ${p.商品コード} に、商品登録編集画面の略称タグ欄で「${棚名}」を選んで保存した（保管コード名）`);
  return p;
}

export { 試験部門を用意する };
