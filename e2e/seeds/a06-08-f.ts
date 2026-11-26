/**
 * A06-08 カード名検索の続き（006・023）のシード。既存の seeds/a06-08*.ts は変えず、そこの共通のシード（認証・店舗・マスタ・管理者）を needs で使う。
 * 作り方は seeds/a06-08-c.ts（021）と同じ: グッズ商品CSV登録＋カード指定で1商品を作り、同じカード詳細・言語 JP・状態 NM の2件目の規格を
 * 商品規格一覧の「新規作成」で足し、それぞれ本店・EC-CUBE へ1入庫して承認する。
 * 正本の外の補い:
 * - 商品名・商品コードは実行の印つき。023 は「A0608-CB023-A」の直後に印を入れた値（ケースの検索語も同じ値）。
 * - 部門は「A06-08部門」（決まった印つき）を使い回す。販売価格は基準価格と同じ値にした。
 * - 作り方の「削除・高額商品コードなし」は状態の説明で、削除はしない。
 */
import { SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { addClass, openClassList } from "../pages/admin/m03_30_products";
import { 決まった入庫の管理者, 入庫して承認する } from "../pages/admin/a17_05_setup";
import { カード商品を作る, 試験部門を用意する, 試験用のカードを用意する } from "./a06-buying";
import "./a06-08";

/** 023 の商品名の前置き（検索語は「<前置き>_」。spec と同じ値になる） */
export const 前置き023 = (): string => `${rc("A0608-CB023")}-A`;

type Browser = Parameters<typeof カード商品を作る>[0];

/** 1商品＋同じ組の2件目の規格（在庫は各1）を作り、控える */
async function 二規格の商品(browser: Browser, notes: { set(k: string, v: string): void }, seedId: string, o: {
  部門ID: string; コード: string; 商品名日: string; 商品名英: string; カード名日: string; カード名英: string; 画像: string; 呼び: string; 二件目: string; 一件目: string;
}): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const card = await 試験用のカードを用意する(browser, seedId, { カード名日: o.カード名日, カード名英: o.カード名英, 詳細数: 1 });
  const made = await カード商品を作る(browser, seedId, {
    商品コード: o.コード, 商品名日: o.商品名日, 商品名英: o.商品名英, 名前はそのまま: true,
    カード: { カードID: card.カードID, カード詳細ID: card.カード詳細IDs[0], カード名: card.カード名 },
    基準価格: "1000", 販売価格: "1000", 買取価格: "100", 在庫: 1, 画像: o.画像, 部門ID: o.部門ID,
  });
  const コード2 = rc(`${o.コード}-2`);
  let id2 = "";
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await openClassList(page, made.商品ID);
    id2 = await addClass(page, made.商品ID, { 言語: "日本語", 状態: "ニアミント", 商品コード: コード2, 基準価格: "1000", 販売価格: "1000", 買取価格: "100" }, `${seedId}: ${コード2}`, issue);
  });
  await 入庫して承認する(browser, seedId, [{ 商品コード: コード2, 数量: 1 }], issue, 決まった入庫の管理者);
  notes.set(`〔商品ID-A0608-${o.呼び}〕`, made.商品ID);
  notes.set(`〔商品規格ID-A0608-${o.一件目}〕`, made.規格ID);
  notes.set(`〔商品規格ID-A0608-${o.二件目}〕`, id2);
  notes.set(`〔カードID-A0608-${o.呼び}〕`, card.カードID);
  notes.set(`〔カード詳細ID-A0608-${o.呼び}〕`, card.カード詳細IDs[0]);
  issue(`${o.商品名日}: 同じカード詳細・言語 JP・状態 NM の規格2件（商品規格ID ${made.規格ID}・${id2}）を、グッズ商品CSV登録＋カード指定と商品規格一覧の「新規作成」で作り、各1を本店・EC-CUBE へ入庫して承認した`);
}

defineSeed("S-A06-08-DUPLICATE-006", { needs: ["S-A06-08-ADM-A"] }, async ({ browser, notes, seed }) => {
  const 部門ID = await 試験部門を用意する(browser, seed.シードID, "A06-08部門");
  notes.set("〔部門ID-A0608-006〕", 部門ID);
  reportSeedIssue(seed.シードID, "部門は「A06-08部門」（決まった印つき）を使い回した");
  await 二規格の商品(browser, notes, seed.シードID, {
    部門ID, コード: "A0608-006", 商品名日: rc("A06-08重複商品"), 商品名英: rc("A06-08 Duplicate Product"), カード名日: "A06-08重複カード", カード名英: "A06-08 Duplicate Card",
    画像: "a0608-006.jpg", 呼び: "006", 一件目: "006A", 二件目: "006B",
  });
});

defineSeed("S-A06-08-CBMULTI-023", { needs: ["S-A06-08-ADM-A"] }, async ({ browser, notes, seed }) => {
  const 部門ID = await 試験部門を用意する(browser, seed.シードID, "A06-08部門");
  // 商品A・B とも同じ試験部門に置く（シード表は商品ごとに部門IDを控えると定める）
  notes.set("〔部門ID-A0608-023A〕", 部門ID);
  notes.set("〔部門ID-A0608-023B〕", 部門ID);
  reportSeedIssue(seed.シードID, `部門は商品A・Bとも同じ試験部門（部門ID ${部門ID}）に置き、〔部門ID-A0608-023A〕〔部門ID-A0608-023B〕の両方にその番号を控えた（部門を分けることはケースの確かめに関わらない）`);
  reportSeedIssue(seed.シードID, "部門は「A06-08部門」（決まった印つき）を使い回した");
  const 前 = 前置き023();
  await 二規格の商品(browser, notes, seed.シードID, {
    部門ID, コード: "A0608-CB023-A", 商品名日: `${前}_記号商品`, 商品名英: `${前}_ Symbol Product`, カード名日: "A0608-CB023-Aカード", カード名英: "A0608-CB023-A Card",
    画像: "a0608-cb023-a.jpg", 呼び: "023A", 一件目: "023A1", 二件目: "023A2",
  });
  // 商品B: 規格1件（商品名は「A」の次が「_」でなく「Y」）
  const card = await 試験用のカードを用意する(browser, seed.シードID, { カード名日: "A0608-CB023-Bカード", カード名英: "A0608-CB023-B Card", 詳細数: 1 });
  const b = await カード商品を作る(browser, seed.シードID, {
    商品コード: "A0608-CB023-B", 商品名日: `${前}Y記号商品`, 商品名英: `${前}Y Symbol Product`, 名前はそのまま: true,
    カード: { カードID: card.カードID, カード詳細ID: card.カード詳細IDs[0], カード名: card.カード名 },
    基準価格: "1000", 販売価格: "1000", 買取価格: "100", 在庫: 1, 画像: "a0608-cb023-b.jpg", 部門ID,
  });
  notes.set("〔商品ID-A0608-023B〕", b.商品ID);
  notes.set("〔商品規格ID-A0608-023B〕", b.規格ID);
  notes.set("〔カードID-A0608-023B〕", card.カードID);
  notes.set("〔カード詳細ID-A0608-023B〕", card.カード詳細IDs[0]);
  reportSeedIssue(seed.シードID, "商品B（規格1件）を、グッズ商品CSV登録＋カード指定で作り、本店・EC-CUBE へ1入庫して承認した");
});
