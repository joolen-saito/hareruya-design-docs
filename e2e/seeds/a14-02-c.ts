/**
 * A14-02 カード詳細情報取得の 005 のシード（S-A14-02-NOTFOUND）。既存の seeds/a14-02.ts は変えず、そこのマスター・カードセットの用意（マスターを用意する）を使う。
 * シード表: カードを1枚登録し、登録後のカード詳細IDを控えたあと、そのカードを削除して、カード詳細が存在しない状態にする。
 * 正本の外の補い: 削除は、シード表の「カード編集画面の『削除』」でなく、カード一覧（カード名で検索）の行の三点リーダー→削除→確認の実行で行う（同じ削除。E2E の印つきのカードだけ）。
 * 削除したあと、そのカード詳細IDが DB から無くなったことを確かめる。
 */
import { SETUP_ADMIN } from "../config/env";
import { query } from "../lib/db";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { CardSearchPage, カードを登録する, カード詳細IDs } from "../pages/admin/m14_card";
import { マスターを用意する } from "./a14-02";
import "./a14-02";

defineSeed("S-A14-02-NOTFOUND", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const m = await マスターを用意する(browser, seed.シードID);
  const 名 = rc("A14-02 Notfound Card");
  let カードID = "";
  let 詳細ID = "";
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    カードID = await カードを登録する(page, { カード名英: 名, 点数で見たマナ: "0", 詳細: { ID: { カードセット: m.カードセット, レアリティ: m.レアリティ, レイアウト: m.レイアウト, イラストレーター: m.イラストレーター, プロモ種別: m.プロモ種別 }, Foil: "なし", フレーム: "通常" } }, `${seed.シードID}: カードの登録`, issue);
    const ids = await カード詳細IDs(page);
    if (ids.length !== 1) throw new Error(`${seed.シードID}: 登録したカード（カードID ${カードID}）のカード詳細が ${ids.length} 件（1件のはず）`);
    詳細ID = ids[0];
    const l = new CardSearchPage(page);
    await l.open();
    await l.キーワードで検索する(名);
    if (!(await l.表示中のカードID()).includes(カードID)) throw new Error(`${seed.シードID}: カード名「${名}」の検索結果にカードID ${カードID} が無い`);
    await l.三点リーダーを押す(カードID);
    await l.削除を押す(カードID);
    await l.確認ポップアップで実行する();
  });
  const 残り = Number(query("select count(*) as n from mtb_card_detail where id = $1::int", [詳細ID])[0]?.n ?? "0");
  if (残り !== 0) throw new Error(`${seed.シードID}: 削除したカードのカード詳細ID ${詳細ID} が DB に残っている`);
  notes.set("〔未登録カード詳細ID-A1402-共有〕", 詳細ID);
  issue(`カード（カードID ${カードID}・カード名(英)「${名}」・カード詳細ID ${詳細ID}）を登録し、カード一覧の行の削除で消した（E2E の印つきのカードだけ）。DB からカード詳細ID ${詳細ID} が無くなったことを確かめた`);
});
