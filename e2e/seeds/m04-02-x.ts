/**
 * M04-02 在庫編集の続き（-x）の画面シード。正本: cases/M04-02_seed_data.tsv
 * 仕分け直し（e2e/review/not_runnable_seed_recheck2.tsv）で流せる見込みになったケースのうち、在庫編集画面の登録・表示を見るもの。
 *
 * 作り方（シード表の投入方法の順。画面で作れない状態だけ、E2E の行へ DB で書き足す。依頼者決定 2026-11-10）:
 * - 店舗「TC東京2F」（S-M04-02-MASTER の①）: 店舗登録画面で登録する。開発環境に無ければ一度だけ作り、あれば内容を確かめて使う
 *   （店名・ショップ名略称は期待結果が値そのものを見るので、実行の印を付けない）。
 * - 共通の商品「在庫試験商品A」（MASTER の②③）: グッズ商品CSV登録で1行を取り込み、商品登録編集の「カード指定」でカードを紐付ける。
 *   カードのマスタは新しく作らず、開発環境に既にある、商品の付いていない Foil「通常」のカード詳細を使う（M03-26 と同じ扱い）。
 *   商品コードに実行の印を付ける。商品名も印を付けた値で作る（ケースの文の「在庫試験商品A」も印つきで読む）。
 * - 試験管理者（ADM-EDIT・ADM-NOEDIT）・承認者（ORG の青木承認者、ケースごとの青木承認者-<番号>）: メンバー登録画面で登録する。
 *   開発環境に手動テスト用の同じ名前・ログインIDのメンバーがあるので、名前・ログインID・メールアドレスに実行の印を付ける。
 * - ケースの規格（CASE-*）: 商品規格一覧の「新規作成」で共通の商品に規格（日本語・ニアミント）を足し、規格IDを控える。在庫IDは DB の参照で読んで控える。
 *   在庫数・総原価はシード表のとおり画面で指定できないので、その在庫（E2E の規格の在庫）へ DB で書き足す。
 *
 * シードでの解釈（記録 review/M04-02_progress_2026-11-11_dev.md にも書く）:
 * - MASTER ③の「取込が作ったニアミント・日本語の規格と、その店舗別在庫・価格履歴を DB で削除して規格を0件にする」は行わない。
 *   各ケースは自分が足した規格（商品コードで特定する）だけを見て、商品の規格の数を確かめないため。
 * - MASTER ③の商品画像のアップロードは行わない（使う 050 は今回の範囲外）。
 * - ORG の所属「在庫管理部」「東京販売部」（マスタデータ管理で足し、並び順を DB で設定）は作らない。共有の開発環境の所属のマスタに行を足すことになり、
 *   今回の範囲のケースは承認者の所属を確かめない（所属を確かめる 007・008 は判断待ち）。承認者の所属は、メンバー登録画面の所属の選択肢の先頭。
 *   ORG の伊藤承認者・宇野一般担当・大阪承認者も、今回の範囲のケースが使わないので作らない。
 * - 承認権限を持つ権限は「システム管理者」（M04-02 の既存のシードと同じ）。
 */
import { Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { getSeed } from "../lib/catalog";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { 在庫IDの, 在庫数と総原価を整える, 商品の無いFoil通常のカード詳細 } from "../db/m04_02_x";
import { readExistingGoodsChildCategoryId } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { openProductEditByCode } from "../pages/admin/m03_23_seed_products";
import { addClass, openClassList } from "../pages/admin/m03_30_products";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { ensureStore, M0424StoreInput } from "../pages/admin/m04_24_store";
import { assignCardOnProductEdit } from "../pages/admin/product_card_assign";

// ---- 店舗・管理者 ----

/** 店舗「TC東京2F」。店名・ショップ名略称（在庫編集画面の店舗の表示）はシード表の値。ほかの必須項目は「任意の値」 */
export const TC東京2F: M0424StoreInput = {
  店名: "TC東京2F", 店名カナ: "ティーシートウキョウニエフ", 店名英語: "TC Tokyo 2F", 支店URL: "m0402tc2f", 店名略称3文字: "T2F", ショップ名略称: "TC東京2F",
  会社名: "株式会社晴れる屋", 会社名カナ: "カブシキガイシャハレルヤ", 郵便番号: "160-0022", 都道府県: "東京都", 住所1: "新宿区新宿2-2-2",
  住所2: "晴ビル2F", 電話番号: "03-0402-2002",
};

export type 管理者 = { 名前: string; account: Account; email: string };
const 管理者の = (名前: string, loginId: string, password: string): 管理者 => {
  const id = rc(loginId).toLowerCase();
  return { 名前: rc(名前), account: { loginId: id, password }, email: `${id}@example.test` };
};
/** S-M04-02-ADM-EDIT（M04-02担当者。TC東京2F の在庫を編集できる） */
export const 担当者 = 管理者の("M04-02担当者", "m0402_admin", "Passw0rd!M0402");
/** S-M04-02-ADM-NOEDIT（M04-02権限外担当者。TC東京2F の在庫を編集できない） */
export const 権限外担当者 = 管理者の("M04-02権限外担当者", "m0402_noedit", "Passw0rd!NoEdit");
/** S-M04-02-ORG の青木承認者 */
export const 青木承認者 = 管理者の("青木承認者", "m0402_approver", "Passw0rd!M0402Ap");
/** ケースごとの承認者（青木承認者-<番号>） */
export const 承認者の = (番号: string): 管理者 => 管理者の(`青木承認者-${番号}`, `m0402_approver_${番号}`, "Passw0rd!M0402Ap");

let 店舗ID = "";
/** TC東京2F の店舗ID（MASTER で控える） */
export function TC東京2FのID(): string {
  if (!店舗ID) throw new Error("店舗「TC東京2F」をまだ用意していない（S-M04-02-MASTER）");
  return 店舗ID;
}

async function メンバーを用意する(page: Page, m: 管理者, 所属店舗ID: string, 編集可能店舗ID: string[]): Promise<string> {
  return ensureMemberByStoreIds(page, {
    名前: m.名前, ログインID: m.account.loginId, メールアドレス: m.email, パスワード: m.account.password, 権限: "システム管理者",
    所属店舗ID, デフォルト検索表示店舗ID: 所属店舗ID, 編集可能店舗ID,
  });
}

// ---- 共通の商品（MASTER） ----

export const 共通の商品 = { 商品コード: () => rc("M0402-MASTER-A"), 商品名: () => rc("在庫試験商品A") };
let 商品ID = "";
export function 共通の商品ID(): string {
  if (!商品ID) throw new Error("共通の商品をまだ作っていない（S-M04-02-MASTER）");
  return 商品ID;
}

defineSeed("S-M04-02-MASTER", async ({ browser, notes, seed }) => {
  if (商品ID) return;
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    店舗ID = await ensureStore(page, TC東京2F, issue);
    notes.set("〔店舗ID-M0402-共有〕", 店舗ID);
    const categoryId = await readExistingGoodsChildCategoryId(page);
    await registerGoodsCsv(page, {
      what: `${seed.シードID} のグッズ商品CSV登録`, fileName: `${seed.シードID.toLowerCase()}-${Date.now()}.csv`, categoryId,
      lines: [{ code: 共通の商品.商品コード(), nameJp: 共通の商品.商品名(), nameEn: 共通の商品.商品名() }],
      common: { "基準価格": "1000", "販売価格": "1000", "買取価格": "1", "原価単価": "1" },
      onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`),
    });
    商品ID = await openProductEditByCode(page, 共通の商品.商品コード());
    notes.set("〔商品ID-M0402-共有〕", 商品ID);
    const card = 商品の無いFoil通常のカード詳細();
    issue(`カードのマスタは新しく作らず、開発環境に既にある商品の付いていない Foil「通常」のカード詳細（ID ${card.カード詳細ID}「${card.カード名}」）を紐付けた`);
    await assignCardOnProductEdit(page, { productId: 商品ID, cardNameJp: card.カード名, cardDetailId: card.カード詳細ID, productNameJp: 共通の商品.商品名(), productNameEn: 共通の商品.商品名() }, issue);
  });
});

defineSeed("S-M04-02-ADM-EDIT", { needs: ["S-M04-02-MASTER"] }, async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await メンバーを用意する(page, 担当者, TC東京2FのID(), [TC東京2FのID()]); });
});
defineSeed("S-M04-02-ADM-NOEDIT", { needs: ["S-M04-02-MASTER"] }, async ({ browser }) => {
  // TC東京2F の在庫を編集できない管理者: 所属店舗・編集可能店舗を本店（店舗ID 1）だけにする
  await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await メンバーを用意する(page, 権限外担当者, "1", ["1"]); });
});
defineSeed("S-M04-02-ORG", { needs: ["S-M04-02-MASTER"] }, async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await メンバーを用意する(page, 青木承認者, TC東京2FのID(), [TC東京2FのID()]); });
});

// ---- ケースの規格と在庫 ----

type 規格の定め = { シードID: string; 番号: string; 商品コード: string; 在庫数: number; 総原価: number; 承認者?: boolean; 基準価格?: string };
const 定め: 規格の定め[] = [
  { シードID: "S-M04-02-CASE-001", 番号: "001", 商品コード: "M0402-A-001", 在庫数: 10, 総原価: 10000 },
  ...["009", "010", "011", "012", "013", "018", "021", "025", "026", "030"].map((n) => ({ シードID: `S-M04-02-CASE-${n}`, 番号: n, 商品コード: `M0402-A-${n}`, 在庫数: 10, 総原価: 10000, 承認者: true })),
  { シードID: "S-M04-02-CASE-015", 番号: "015", 商品コード: "M0402-A-015", 在庫数: 10, 総原価: 10000 },
  { シードID: "S-M04-02-CASE-023", 番号: "023", 商品コード: "M0402-ZERO-023", 在庫数: 0, 総原価: 0, 承認者: true },
  { シードID: "S-M04-02-CASE-029", 番号: "029", 商品コード: "M0402-A-029", 在庫数: 10, 総原価: 10000 },
  { シードID: "S-M04-02-CASE-031", 番号: "031", 商品コード: "M0402-MAX-031", 在庫数: 99999999, 総原価: 99999999, 承認者: true },
  { シードID: "S-M04-02-CASE-032", 番号: "032", 商品コード: "M0402-A-032", 在庫数: 10, 総原価: 10000 },
  { シードID: "S-M04-02-CASE-033", 番号: "033", 商品コード: "M0402-MAX-033", 在庫数: 99999999, 総原価: 99999999 },
  { シードID: "S-M04-02-CASE-039", 番号: "039", 商品コード: "M0402-A-039", 在庫数: 10, 総原価: 10000 },
  { シードID: "S-M04-02-DISPOSEHIST-048", 番号: "048", 商品コード: "M0402-048-A", 在庫数: 20, 総原価: 30000, 承認者: true },
  { シードID: "S-M04-02-DISPOSEAUDIT-049", 番号: "049", 商品コード: "M0402-049-A", 在庫数: 10, 総原価: 10000, 承認者: true },
  { シードID: "S-M04-02-FOILNORMAL-051", 番号: "051", 商品コード: "M0402-051-A", 在庫数: 10, 総原価: 10000 },
  { シードID: "S-M04-02-REASONMAX-054", 番号: "054", 商品コード: "M0402-054-A", 在庫数: 10, 総原価: 10000, 承認者: true },
  { シードID: "S-M04-02-SUMOVER-056", 番号: "056", 商品コード: "M0402-056-A", 在庫数: 10, 総原価: 10000, 承認者: true },
  { シードID: "S-M04-02-HISTSOURCE-060", 番号: "060", 商品コード: "M0402-060-A", 在庫数: 10, 総原価: 10000, 承認者: true },
  { シードID: "S-M04-02-SALEPRICE-061", 番号: "061", 商品コード: "M0402-061-A", 在庫数: 10, 総原価: 10000, 承認者: true, 基準価格: "1800" },
  { シードID: "S-M04-02-REPEAT-071", 番号: "071", 商品コード: "M0402-A-071", 在庫数: 10, 総原価: 10000, 承認者: true },
  { シードID: "S-M04-02-DISCARD-072", 番号: "072", 商品コード: "M0402-A-072", 在庫数: 5, 総原価: 5000, 承認者: true },
];

/** ケースが使う規格の商品コード（実行の印つき）。ケースは正本の商品コードで引く */
export const 商品コードの = (正本の商品コード: string): string => rc(正本の商品コード);

for (const d of 定め) {
  defineSeed(d.シードID, { needs: ["S-M04-02-MASTER"] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(d.シードID, m);
    const 呼び名あり = (l: string) => getSeed(d.シードID).状態・属性.includes(l);
    const code = 商品コードの(d.商品コード);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      await openClassList(page, 共通の商品ID());
      const 価格 = d.基準価格 ?? "1000";
      const 規格ID = await addClass(page, 共通の商品ID(), { 言語: "日本語", 状態: "ニアミント", 商品コード: code, 基準価格: 価格, 販売価格: 価格, 買取価格: "1" }, `${d.シードID}: ${code}`, issue);
      if (呼び名あり(`〔商品規格ID-M0402-${d.番号}〕`)) notes.set(`〔商品規格ID-M0402-${d.番号}〕`, 規格ID);
      const 在庫ID = 在庫IDの(code, TC東京2FのID());
      if (呼び名あり(`〔在庫ID-M0402-${d.番号}〕`)) notes.set(`〔在庫ID-M0402-${d.番号}〕`, 在庫ID);
      if (d.在庫数 !== 0 || d.総原価 !== 0) {
        在庫数と総原価を整える(d.シードID, 在庫ID, d.在庫数, d.総原価);
        issue(`在庫数${d.在庫数}・総原価${d.総原価}は画面で指定できないので、E2E の規格の在庫（在庫ID ${在庫ID}）へ DB で書き足した（シード表の投入方法のとおり）`);
      }
      if (d.承認者) {
        const id = await メンバーを用意する(page, 承認者の(d.番号), TC東京2FのID(), [TC東京2FのID()]);
        if (呼び名あり(`〔メンバーID-M0402-${d.番号}〕`)) notes.set(`〔メンバーID-M0402-${d.番号}〕`, id);
      }
    });
  });
}
