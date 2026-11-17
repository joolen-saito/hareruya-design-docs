/**
 * A06-07・A06-10・A06-18（買取用カード一覧取得の API）のシードの組み立て（シードの登録はしない。各機能の seeds/a06-NN.ts が使う）。
 *
 * 1商品ずつ: 試験用のカードをカード詳細(登録)画面で登録する → グッズ商品CSV登録で1商品・1商品規格（言語 JP・状態 NM）を取り込む →
 * 商品登録編集の「カード指定」で試験用のカードのカード詳細を紐付ける → 本店・EC-CUBE へ入庫して別の管理者が承認する →
 * 画面で置けない商品画像の行だけ、E2E の商品に DB で足す（A02-01 と同じ部品。seeds/a02-builder.ts の作り）。
 *
 * 正本の外の補い（記録にも書く）:
 * - シード表の「カード商品CSV登録」は、グッズ商品CSV登録＋カード指定で代えた（A02 と同じ。カード商品CSV登録は基準価格からスマレジ連携を決め、
 *   外部のスマレジへ送ることがある）。グッズ商品CSV登録の取込は言語(ID)の列を持つが、課題 4023（セール価格CSVの言語ID）とは別の取込。
 * - 店舗A は、試験店舗の使い回し（2026-11-13 依頼者決定）で本店（店舗ID 1）に読み替えた。入庫の部品が本店・EC-CUBE へ入庫するため。
 *   管理者の所属店舗も本店にする（API はログインした管理者の所属店舗の EC 在庫を返す）。
 * - カードのマスタは、依頼者決定 2026-11-14「マスタは作ってよい」で試験用のカードを登録する（カード名に実行の印）。レアリティ・レイアウト・
 *   プロモ種別は選択肢の先頭、カードセットは A02 の試験用カードセットを使い回す。
 * - 商品コード・商品名には実行の印を付ける（流し直しで前の実行の商品とぶつからないように）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 商品画像を足す } from "../db/a02_popup";
import { rc, rcFixed } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { カードを紐付ける, 試験用のカードを作る } from "../pages/admin/a02_setup";
import { 入庫して承認する, 取込の商品と規格を読む } from "../pages/admin/a17_05_setup";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { readGoodsRootCategoryId } from "../pages/admin/m03_23_seed_products";
import { ensureMemberFixed } from "../pages/admin/member";
import { 規格の価格を読む, 販売価格を入れ直す } from "../pages/admin/a06_product_read";
import { 店舗読み替えの注記, 本店ID, 試験店舗の名前を読む } from "../pages/admin/test_store";

export type 買取の管理者 = Account & { 名前: string };
export const 買取の管理者の = (ログインID: string, パスワード: string, 名前: string): 買取の管理者 => ({
  loginId: rcFixed(ログインID).toLowerCase(), password: パスワード, 名前: rcFixed(名前),
});

/** 本店に所属する管理者を（無ければ）登録し、管理者IDを返す */
export async function 本店の管理者を用意する(browser: Browser, seedId: string, a: 買取の管理者, シード表の店名: string): Promise<{ 管理者ID: string; 店舗ID: string; 店名: string }> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const 店名 = (await 試験店舗の名前を読む(page)).本店;
    issue(店舗読み替えの注記(シード表の店名, 店名, 本店ID));
    const id = await ensureMemberFixed(page, {
      名前: a.名前, 所属店舗: 店名, ログインID: a.loginId, メールアドレス: `${a.loginId}@example.test`, パスワード: a.password,
      権限: "システム管理者", デフォルト検索表示店舗: 店名, 編集可能店舗: [店名],
    }, issue);
    issue("管理者は決まった印（-E2E。ログインIDは小文字）を付けて1度だけ作る。所属は選択肢の先頭、権限はシステム管理者（シード表の「登録済みの値」）");
    return { 管理者ID: id, 店舗ID: 本店ID, 店名 };
  });
}

export type カード商品の定め = {
  /** 正本の商品コード（実行の印を付けて使う） */
  商品コード: string;
  商品名日: string;
  商品名英: string;
  /** 試験用のカードの名前（無ければカードを紐付けない＝カード商品でない商品） */
  カード名日?: string;
  カード名英?: string;
  基準価格: string;
  販売価格: string;
  買取価格: string;
  /** 本店・EC-CUBE の在庫（0なら入庫しない） */
  在庫: number;
  /** 商品画像のファイル名（無ければ画像を付けない） */
  画像?: string;
};
export type 作ったカード商品 = { 商品ID: string; 規格ID: string; カードID: string | null; カード詳細ID: string | null; 商品コード: string };

/** 1商品を作る（カード・取込・カード指定・入庫・商品画像） */
export async function カード商品を作る(browser: Browser, seedId: string, d: カード商品の定め): Promise<作ったカード商品> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const 商品コード = rc(d.商品コード);
  const 商品名日 = rc(d.商品名日);
  const 商品名英 = rc(d.商品名英);
  const out = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const card = d.カード名日 && d.カード名英
      ? await 試験用のカードを作る(page, { カード名日: rc(d.カード名日), カード名英: rc(d.カード名英), 詳細数: 1 }, `${seedId}: 試験用のカード`, issue) : null;
    const categoryId = await readGoodsRootCategoryId(page);
    await registerGoodsCsv(page, {
      what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId.toLowerCase()}-${Date.now()}.csv`, categoryId,
      common: { "購入グループ名称": "通常商品", "原価単価": "0" },
      lines: [{ code: 商品コード, nameJp: 商品名日, nameEn: 商品名英, values: { "基準価格": d.基準価格, "販売価格": d.販売価格, "買取価格": d.買取価格 } }],
      onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 300_000,
    });
    const r = await 取込の商品と規格を読む(page, 商品コード, issue);
    if (card) await カードを紐付ける(page, r.商品ID, { 商品名日, 商品名英 }, { カード詳細ID: card.カード詳細IDs[0], カード名: card.カード名 }, issue);
    // 取込とカード指定のあと、販売価格が基準価格と同じ値になっていた（2026-11-17 A06-18: 取込の販売価格 3456 が 2345）。違う値のときは画面で入れ直す
    const 今 = await 規格の価格を読む(page, r.商品ID, r.規格ID);
    if (今.販売価格 !== d.販売価格) {
      await 販売価格を入れ直す(page, r.商品ID, r.規格ID, d.販売価格, `${seedId}: ${商品コード} の販売価格`, issue);
      issue(`取込とカード指定のあと販売価格が ${今.販売価格}（基準価格 ${今.基準価格}）になったので、商品規格登録編集画面でセールフラグを付けて ${d.販売価格} に入れ直した（販売価格はセールフラグが無いと基準価格と同じ値で保存される。シード表はセールフラグを定めていない）`);
    }
    return { 商品ID: r.商品ID, 規格ID: r.規格ID, カードID: card?.カードID ?? null, カード詳細ID: card?.カード詳細IDs[0] ?? null, 商品コード };
  });
  if (d.在庫 > 0) await 入庫して承認する(browser, seedId, [{ 商品コード, 数量: d.在庫 }], issue);
  if (d.画像) 商品画像を足す(`${seedId}: 商品画像 ${d.画像}`, out.商品ID, d.画像, 1);
  issue(`商品コード ${商品コード}・商品名「${商品名日}」（実行の印つき）。${d.カード名日 ? "カード商品CSV登録の代わりにグッズ商品CSV登録＋カード指定で作り" : "グッズ商品CSV登録で作り（カードは紐付けない）"}（言語 JP・状態 NM）、本店・EC-CUBE へ ${d.在庫} 入庫して承認した。${d.画像 ? `商品画像「${d.画像}」の行だけを DB に足した（実体は置かない）。` : ""}カードのレアリティ等は選択肢の先頭`);
  return out;
}
