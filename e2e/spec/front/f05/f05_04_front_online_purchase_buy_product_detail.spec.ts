/**
 * フロント ネット買取「買取商品詳細」（F05-04）E2E。
 * integration_test/e2e/f05_04_front_online_purchase_buy_product_detail_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f05-04_front_online_purchase_buy_product_detail.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * 買取商品詳細はGET・非破壊のため、不存在商品ID・不明旧コード・非数値ID・未認証閲覧可否は live で実装する。
 * 特定商品の存在を前提とする表示内容検証・買取カート投入は要シードのため test.fixme（理由付き）で保留し、全量はケース表で管理する。
 */
import { test, expect } from "@playwright/test";
import { FrontPurchaseDetailPage } from "../../../pages/front/f05/f05_04_front_online_purchase_buy_product_detail.page";

// 他レコードと衝突しない十分大きな不存在ID／未使用の旧コード（シード不要の非破壊値）。
const NONEXISTENT_ID = 999999999;
const NON_NUMERIC_ID = "not-a-number";
const UNMAPPED_OLD_CODE = "E2E-F0504-NO-SUCH-CODE";

test.describe("フロント > ネット買取 > 買取商品詳細", { tag: ["@front", "@purchase"] }, () => {
  // --- live: シード/資格情報不要・非破壊で走る（GET参照） ---

  test("E2E-F05-04-002 未ログインでも買取商品詳細URLは会員ログインへ誘導されない", async ({ page }) => {
    const detail = new FrontPurchaseDetailPage(page);
    await detail.gotoDetail(NONEXISTENT_ID);
    // 未ログインで閲覧可・カート追加可（設計書「権限・認可」）。会員ログイン画面へ誘導しない。
    await detail.seeNotRedirectedToLogin();
  });

  test("E2E-F05-04-015 存在しない商品IDはページなし(HTTP404)となる", async ({ page }) => {
    const detail = new FrontPurchaseDetailPage(page);
    const res = await detail.gotoDetail(NONEXISTENT_ID);
    // 商品が取得できない場合はページなし＝HTTP404（設計書「処理フロー#1」「エラー処理」）。
    expect(res?.status()).toBe(404);
  });

  test("E2E-F05-04-032 商品IDが数字以外の場合はページなし(HTTP404)となる", async ({ page }) => {
    const detail = new FrontPurchaseDetailPage(page);
    const res = await detail.gotoDetail(NON_NUMERIC_ID);
    // 商品IDは数字のみ許容（設計書「バリデーション」）。非数値はルーティングされずページなし。
    expect(res?.status()).toBe(404);
  });

  test("E2E-F05-04-018 対応の無い旧商品コードはトップページへリダイレクトされる", async ({ page }) => {
    const detail = new FrontPurchaseDetailPage(page);
    await detail.gotoForward(UNMAPPED_OLD_CODE);
    // 旧コードに対応が無い／商品取得不可はトップへリダイレクト（設計書「転送処理#1」「画面遷移」「エラー処理」）。
    await detail.seeRedirectedToTop();
  });

  // --- 要シード（特定商品の存在前提・買取カート投入）。自動化可能だが本リポ環境では保留（抜け漏れ可視化） ---
  test.fixme("E2E-F05-04-003 商品詳細に表示要素一式が表示される（要: SEED-F05-04-PRODUCT）", async () => {});
  test.fixme("E2E-F05-04-021 URL直接アクセスで買取商品詳細が表示される（要: SEED-F05-04-PRODUCT）", async () => {});
  test.fixme("E2E-F05-04-023 言語タブ切替で対応する価格表が表示される（要: SEED-F05-04-MULTILANG）", async () => {});
  test.fixme("E2E-F05-04-025 無効なlang/classでも先頭言語・先頭クラスにフォールバックして表示する（要: SEED-F05-04-MULTILANG）", async () => {});
  test.fixme("E2E-F05-04-009 買取価格500円以上の状態で数量選択とカート追加ボタンが表示される（要: SEED-F05-04-PRICE-GE500）", async () => {});
  test.fixme("E2E-F05-04-010 同名カードの買取価格一覧が価格昇順で表示される（要: SEED-F05-04-SAMENAME）", async () => {});
  test.fixme("E2E-F05-04-012 基本土地では同名カードの買取価格一覧を表示しない（要: SEED-F05-04-BASICLAND）", async () => {});
  test.fixme("E2E-F05-04-007 使用デッキがフォーマット別に上限3件まで表示される（要: SEED-F05-04-DECK）", async () => {});
  test.fixme("E2E-F05-04-011 登録済みの買取価格が価格表に表示される（要: SEED-F05-04-PRODUCT）", async () => {});
  test.fixme("E2E-F05-04-013 同名カード一覧は状態NM・高額除外の条件に従う（要: SEED-F05-04-SAMENAME）", async () => {});
  test.fixme("E2E-F05-04-017 カートに追加ボタンで画面遷移せず非同期に買取カートへ追加される（要: SEED-F05-04-PRICE-GE500 / F05-05）", async () => {});
  test.fixme("E2E-F05-04-014 対応する旧商品コードは新しい買取商品詳細へリダイレクトされる（要: SEED-F05-04-OLDCODE）", async () => {});
});
