/**
 * M07 の「入庫待ち／入庫済みの買取に実在庫を付ける」シードの共通の作り方（戻しリストの試験が使う）。
 * 正本のシード表の手順のとおり、画面で次を行う:
 *   前の実行の残りの削除 → 棚番号の登録 → グッズ商品CSV登録（サプライ品）→ 商品規格に棚番号と公開 →
 *   会員の登録 → 会員でフロントにログインして、サプライ品で買取を申込 → 管理画面で買取番号を控える →
 *   買取状況を「入庫待ち」にして保存 → 実在庫情報の編集で「商品追加」から実在庫を足す → 必要なら買取状況を変える。
 * 決め打ちの商品コード・商品名には実行ごとの印を付ける（run_marker）。注文者名は、ケースが検索欄へそのまま入れる正本の値のまま使う。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { 商品IDをコードから } from "../db/m07";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { reportSeedIssue } from "../lib/seeds";
import { BuyEditPage, BuyListPage } from "../pages/admin/m07_buy";
import { サプライ, サプライ品を登録する, 規格に棚番号を付けて公開する, 棚番号を登録する } from "../pages/admin/m07_supply";
import { 申込む, ログインする } from "../pages/front/m07_net_buy";
import { 会員を作る, 先頭の買取番号, 注文者名の残りを削除する } from "./m07-common";

export type 実在庫 = { 品: サプライ; 数: string };

/** サプライ品の用意（棚番号・商品・規格）。品の商品名・コードは呼び出し側が印を付けて渡す */
export async function サプライ品を用意する(browser: Browser, seedId: string, 棚: string, 品: サプライ[]): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const sh of new Set(品.map((p) => p.棚 ?? 棚))) await 棚番号を登録する(page, sh, issue);
    await サプライ品を登録する(page, 品, issue);
    for (const p of 品) await 規格に棚番号を付けて公開する(page, p.名前, p.コード, p.棚 ?? 棚, issue);
  });
}

export type 戻し買取 = {
  ラベル: string | null;
  /** 申込に使う商品（買取明細に残る）と数量 */
  申込: { コード: string; 数量?: string };
  /** 買取状況を順に設定する（最初の設定のあとで実在庫を足す） */
  状況: string[];
  実在庫: { コード: string; 数: string }[];
};

/**
 * 戻しリストの試験データを正本の手順のとおりに作る: 前の実行の残りの削除 → 棚番号・サプライ品 → 会員 → 買取ごとに
 * （申込 → 買取番号を控える → 買取状況の設定 → 実在庫の追加）。買取番号（数字）を買取の順に返す。
 */
export async function 戻しの試験データを作る(browser: Browser, seedId: string, v: {
  注文者名: string; 棚: string; 品: サプライ[]; 買取: 戻し買取[];
}): Promise<string[]> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const removed = await 注文者名の残りを削除する(browser, v.注文者名, []);
  if (removed) issue(`前の実行の残り（注文者名「${v.注文者名}」の買取 ${removed} 件）を一覧から削除してから始めた`);
  if (v.品.length) await サプライ品を用意する(browser, seedId, v.棚, v.品);
  const out: string[] = [];
  if (v.買取.length === 0) return out;
  const 会員 = await 会員を作る(browser, v.注文者名, "stock");
  for (const o of v.買取) {
    const 商品ID = 商品IDをコードから(o.申込.コード);
    if (!商品ID) throw new Error(`申込に使う商品 ${o.申込.コード} が見つからない`);
    const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    let 番号 = "";
    try {
      await hideDebugToolbar(context);
      const fp = await context.newPage();
      fp.setDefaultTimeout(60_000);
      await ログインする(fp, 会員);
      const done = await 申込む(fp, 商品ID, { 数量: o.申込.数量 });
      番号 = await withAdminSession(browser, SETUP_ADMIN, async (a) => {
        a.setDefaultTimeout(60_000);
        const first = await 先頭の買取番号(a, v.注文者名);
        if (first !== done) throw new Error(`申込完了の買取番号 ${done} と、一覧の先頭行 ${first} が違う`);
        return first;
      });
    } finally {
      await context.close();
    }
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const open = async () => {
        const l = new BuyListPage(page);
        await l.open();
        await l.買取番号を入れる(String(Number(番号)));
        await l.検索する();
        await l.編集画面を開く(番号);
        return new BuyEditPage(page);
      };
      let edit = await open();
      await edit.買取状況を変えて保存する(o.状況[0]);
      if (o.実在庫.length) {
        await edit.実在庫の編集を開く();
        for (let i = 0; i < o.実在庫.length; i++) {
          await edit.実在庫に商品を追加する(o.実在庫[i].コード, o.実在庫[i].数, `買取番号 ${番号} への実在庫 ${o.実在庫[i].コード} の追加`);
          if (i < o.実在庫.length - 1) await edit.実在庫の編集を開く();
        }
      }
      for (const st of o.状況.slice(1)) {
        edit = await open();
        await edit.買取状況を変えて保存する(st);
      }
    });
    out.push(番号);
  }
  return out;
}
