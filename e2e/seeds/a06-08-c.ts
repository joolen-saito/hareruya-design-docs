/**
 * A06-08 カード名検索の続き（021）のシード。既存の seeds/a06-08.ts は変えず、そこで登録された共通のシード（認証・店舗・マスタ・管理者）を needs で使う。
 * 作り方は seeds/a06-buying.ts（読み替えはそこに書いた）と同じ。1カードにカード詳細2件を作り、詳細Aに商品2件（言語JP・EN。それぞれ状態NM・SP）、
 * 詳細Bに商品1件（言語JP・状態NM）を、グッズ商品CSV登録＋カード指定で作る。状態SPの規格は商品規格一覧の「新規作成」で足す（買取価格つき）。
 * 正本の外の補い:
 * - 商品名の前置きは、002 と同じく検索語の直後に実行の印を入れた値（ケースの検索語「A0608-021-商品」も同じ印つきの値にする）。
 * - 部門は「A06-08部門」（決まった印つき）を使い回す。販売価格は基準価格と同じ値にした。
 * - 状態SPの規格を足すときの部門は、商品規格の登録画面の選択肢の先頭（ケースは部門を確かめない）。
 * - 作り方の「削除・高額商品コードなし」は状態の説明で、削除はしない。
 */
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { SETUP_ADMIN } from "../config/env";
import { withAdminSession } from "../lib/session";
import { カード商品を作る, 試験部門を用意する, 試験用のカードを用意する } from "./a06-buying";
import { addClass, openClassList } from "../pages/admin/m03_30_products";
import { 決まった入庫の管理者, 入庫して承認する } from "../pages/admin/a17_05_setup";
import "./a06-08";

/** 商品名の前置き（検索語。spec と同じ値になる） */
export const 前置き021 = (): string => `${rc("A0608-021")}-商品`;

defineSeed("S-A06-08-NESTED-021", { needs: ["S-A06-08-ADM-A"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const 部門ID = await 試験部門を用意する(browser, seed.シードID, "A06-08部門");
  issue("シード表は部門名「A0608部門021」とするが、ケースは部門IDを確かめないので「A06-08部門」（決まった印つき）を使い回した");
  const card = await 試験用のカードを用意する(browser, seed.シードID, { カード名日: "A0608-021-カード", カード名英: "A0608-021-Card", 詳細数: 2 });
  notes.set("〔カードID-A0608-021〕", card.カードID);
  notes.set("〔カード詳細ID-A0608-021A〕", card.カード詳細IDs[0]);
  notes.set("〔カード詳細ID-A0608-021B〕", card.カード詳細IDs[1]);
  notes.set("〔部門ID-A0608-021〕", 部門ID);
  const 前 = 前置き021();
  const 状態SP = "スライトリープレイド";
  type 規格 = { 印: string; 言語: "日本語" | "英語"; 状態: "NM" | "SP"; 基準: string; 買取: string; 在庫: number };
  const 商品 = [
    { 印: "AJP", 詳細: 0, 言語: "日本語" as const, 規格: [{ 印: "A-JP-NM", 言語: "日本語", 状態: "NM", 基準: "1000", 買取: "100", 在庫: 1 }, { 印: "A-JP-SP", 言語: "日本語", 状態: "SP", 基準: "2000", 買取: "200", 在庫: 2 }] as 規格[] },
    { 印: "AEN", 詳細: 0, 言語: "英語" as const, 規格: [{ 印: "A-EN-NM", 言語: "英語", 状態: "NM", 基準: "3000", 買取: "300", 在庫: 3 }, { 印: "A-EN-SP", 言語: "英語", 状態: "SP", 基準: "4000", 買取: "400", 在庫: 4 }] as 規格[] },
    { 印: "BJP", 詳細: 1, 言語: "日本語" as const, 規格: [{ 印: "B-JP-NM", 言語: "日本語", 状態: "NM", 基準: "5000", 買取: "500", 在庫: 5 }] as 規格[] },
  ];
  for (const p of 商品) {
    const 先頭 = p.規格[0];
    const made = await カード商品を作る(browser, seed.シードID, {
      商品コード: `A0608-021-${先頭.印}`, 商品名日: `${前}${p.印}`, 商品名英: `${前}${p.印} EN`, 名前はそのまま: true,
      カード: { カードID: card.カードID, カード詳細ID: card.カード詳細IDs[p.詳細], カード名: card.カード名 },
      基準価格: 先頭.基準, 販売価格: 先頭.基準, 買取価格: 先頭.買取, 在庫: 先頭.在庫, 画像: `a0608-021-${p.印}.jpg`, 部門ID, 言語: p.言語,
    });
    notes.set(`〔商品ID-A0608-021${p.印.replace(/^(A|B)(JP|EN)$/, "$1-$2")}〕`, made.商品ID);
    notes.set(`〔商品規格ID-A0608-021${先頭.印}〕`, made.規格ID);
    for (const k of p.規格.slice(1)) {
      const コード = rc(`A0608-021-${k.印}`);
      let id = "";
      await withAdminSession(browser, SETUP_ADMIN, async (page) => {
        page.setDefaultTimeout(60_000);
        await openClassList(page, made.商品ID);
        id = await addClass(page, made.商品ID, { 言語: k.言語, 状態: k.状態 === "SP" ? 状態SP : k.状態, 商品コード: コード, 基準価格: k.基準, 販売価格: k.基準, 買取価格: k.買取 }, `${seed.シードID}: ${コード}`, issue);
      });
      notes.set(`〔商品規格ID-A0608-021${k.印}〕`, id);
      await 入庫して承認する(browser, seed.シードID, [{ 商品コード: コード, 数量: k.在庫 }], issue, 決まった入庫の管理者);
    }
  }
  issue("カード1枚（カード詳細2件）に、商品3件・商品規格5件（詳細A: JP商品のNM・SP、EN商品のNM・SP／詳細B: JP商品のNM）を、グッズ商品CSV登録＋カード指定で作り、状態SPの規格は商品規格一覧の「新規作成」で足し、本店・EC-CUBE へ入庫して承認した");
});
