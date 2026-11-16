/**
 * M04-03 在庫一括編集の続き（-x）の画面シード。正本: cases/M04-03_seed_data.tsv
 * 仕分け直し（e2e/review/not_runnable_seed_recheck2.tsv）で流せる見込みになったケースのうち、所属のマスタ（在庫管理第一部・第二部）を使わないもの。
 *
 * 作り方（シード表の投入方法の順。画面で作れない状態だけ、E2E の行へ DB で書き足す。依頼者決定 2026-11-10）:
 * - 店舗（MASTER）: 試験店舗の使い回し（2026-11-13 依頼者決定。pages/admin/reuse_store.ts）で店舗は作らない。前に作った「TC東京」「大阪店（M04-03）」は
 *   片付ける一覧に入ったので、「TC東京」は「試験支店」、「大阪店」は本店（店舗ID 1）で読み替える（ショップ名略称を見る期待結果は、読み替えた店舗のショップ名略称で見る）。
 *   （大阪店の名前を期待結果が見るケースは今回の範囲に無い）。店舗の番号（403070001 など）はシード表の決め打ちだが、画面が振る番号を使う。
 * - 共通の商品（MASTER）: グッズ商品CSV登録で「一括商品A」「一括商品B」「大阪商品」の3行を取り込み、商品登録編集の「カード指定」で
 *   一括商品A に Foil「通常」、一括商品B に Foil「特殊」のカード詳細を紐付け、代表画像（bulk-a.png・bulk-b.png。色の違う小さな画像）を追加する。
 *   カードのマスタは新しく作らず、開発環境に既にある商品の付いていないカード詳細を使う（Foil「特殊」で使えるものは 11/11 時点で2件）。
 *   商品コード・商品名に実行の印を付け、ケースの文の同じ値も印つきで読む。
 * - 在庫変動区分・言語・状態の選択肢（MASTER の DB 設定）は、開発環境のマスタをそのまま使う（書き換えない）。
 * - 試験管理者（ADM）・入庫の承認者: メンバー登録画面で作る。名前・ログインIDに決まった印（-E2E）を付け、1度だけ作って使い回す（開発環境に手動テスト用の同じものがありうる。2026-11-12）。入庫の承認者は店舗ごとの所属で作る。
 *   権限は「システム管理者」（M04-02 と同じ。シード表の「在庫承認権限なし」は、今回の範囲のケースが確かめない）。
 * - ケースの規格（CASE-*）: 商品規格一覧の「新規作成」で共通の商品に規格を足し、在庫IDは DB の参照で読んで控える。
 *   在庫数はシード表のとおり在庫編集で入庫し、別のメンバー（承認者）が在庫編集承認一覧で承認する（画面で作れる）。
 * - ケースの規格（GF-STOCK・DP-STOCK）: 在庫数・総原価はシード表のとおり画面で指定できないので、E2E の規格の在庫へ DB で書き足す。
 * - 期間別販売数量（CASE-009）: 画面に入力の手段が無いので、E2E の規格の期間別販売数量の行を DB で足す（当日1・昨日2・3日間3・1週間4・1ヶ月間5）。
 */
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { getSeed } from "../lib/catalog";
import { rc, rcFixed } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { 在庫IDの, 在庫数と総原価を整える, 在庫の最新の承認ID, 期間別販売数量を足す, 元からある商品の無いカード詳細 } from "../db/m04_03_x";
import { 承認一覧の行の番号 } from "../db/m04_02_x";
import { imageFile } from "../pages/admin/f03_06_products";
import { readExistingGoodsChildCategoryId } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { classRowsFromProductEdit, openProductEditByCode } from "../pages/admin/m03_23_seed_products";
import { addClass, openClassList } from "../pages/admin/m03_30_products";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { 試験支店, 試験支店の店舗ID, 本店の店舗ID, 本店の店名DB } from "../pages/admin/reuse_store";
import { 在庫編集を開く } from "../pages/admin/m04_03_bulk_x";
import { カードを登録する, カード詳細IDs } from "../pages/admin/m14_card";
import { assignCardOnProductEditInSet } from "../pages/admin/product_card_assign_set";
import { ensureDepartment, ensureMemberWithDepartment } from "../pages/admin/m04_13_setup";
import { ensureNoApprovalAuthority, M0409_NO_APPROVAL_AUTHORITY } from "../pages/admin/m04_09_setup";
import { registerStockEdit, StockApprovalListPage } from "../pages/admin/stock_edit";

// ---- 店舗 ----

/** 正本の店舗「TC東京」の読み替え（試験支店）。店名・ショップ名略称は試験支店のもの */
export const TC東京 = { 正本の店名: "TC東京", 店名: 試験支店.店名, ショップ名略称: 試験支店.店名 } as const;
/** 正本の店舗「大阪店」の読み替え（本店＝店舗ID 1）。店名は本店の店名 */
export const 大阪店 = { 正本の店名: "大阪店", 店名: (() => { try { return 本店の店名DB(); } catch (e) { return `（本店の店名を読めない: ${(e as Error).message}）`; } })() } as const;
export const 店の読み替え = (): string => `正本の店舗「TC東京」「大阪店」は、試験店舗の使い回し（2026-11-13 依頼者決定）で「${TC東京.店名}」と本店「${大阪店.店名}」（店舗ID 1）に読み替えた`;
const 店舗の番号 = { TC東京: "", 大阪店: "" };
export function 店舗IDの(店: "TC東京" | "大阪店"): string {
  const id = 店舗の番号[店];
  if (!id) throw new Error(`店舗「${店}」をまだ用意していない（S-M04-03-MASTER）`);
  return id;
}

// ---- 管理者 ----

export type 管理者 = { 名前: string; account: Account; email: string };
const 管理者の = (名前: string, loginId: string, password: string): 管理者 => {
  const id = rc(loginId).toLowerCase();
  return { 名前: rc(名前), account: { loginId: id, password }, email: `${id}@example.test` };
};
/** 実行をまたいで使い回す試験管理者（決まった印。1度だけ作る。2026-11-12 シードの使い回し） */
const 使い回す管理者 = (名前: string, loginId: string, password: string): 管理者 => {
  const id = rcFixed(loginId).toLowerCase();
  return { 名前: rcFixed(名前), account: { loginId: id, password }, email: `${id}@example.test` };
};
/** S-M04-03-ADM（M04-03試験管理者。TC東京・大阪店の在庫を編集できる） */
// 2026-11-13 試験店舗の使い回しで店舗が試験支店・本店に変わったので、前の試験管理者とは別の決まった名前で作る
export const 試験管理者 = 使い回す管理者("M04-03試験管理者（試験支店・本店）", "m0403_admin2", "Passw0rd!M0403");
/**
 * シードの入庫を承認するメンバー（シード表の「店舗の在庫承認権限を持つ別のメンバー」）。
 * 承認通知先の部署の選択肢は「その店舗に所属するメンバーの部署」だけ（新アプリの StockApprovalType）なので、入庫する店舗ごとにその店舗の所属で作る
 * （2026-11-12、TC東京所属の承認者1人では大阪店の入庫で「承認通知先のメンバーに…がいる部署が無い」になる。F04-01・M04-01 と同じ）
 */
export const 入庫の承認者: Record<"TC東京" | "大阪店", 管理者> = {
  TC東京: 使い回す管理者("M04-03試験支店入庫承認者", "m0403_seed_apr_shi", "Passw0rd!M0403Ap"),
  大阪店: 使い回す管理者("M04-03本店入庫承認者", "m0403_seed_apr_hon", "Passw0rd!M0403Ap"),
};
/** 054〜061 の登録者・承認者（S-M04-03-GF-REG-<番号>・GF-APR・DP-REG・DP-APR）。パスワードは開発環境の決まり（12文字以上）に合わせる（2026-11-14、10文字で「値が短すぎます」になった） */
export const 登録者の = (番号: string): 管理者 => 管理者の(`M0403-${番号}-登録者`, `m0403-${番号}-reg`, `Qz${番号}r7Tm!Reg2`);
export const 承認者の = (番号: string): 管理者 => 管理者の(`M0403-${番号}-承認者`, `m0403-${番号}-apr`, `Qz${番号}a5Tm!Apr2`);

async function メンバーを用意する(page: Page, m: 管理者, 店舗IDs: string[]): Promise<string> {
  return ensureMemberByStoreIds(page, {
    名前: m.名前, ログインID: m.account.loginId, メールアドレス: m.email, パスワード: m.account.password, 権限: "システム管理者",
    所属店舗ID: 店舗IDs[0], デフォルト検索表示店舗ID: 店舗IDs[0], 編集可能店舗ID: 店舗IDs,
  });
}

// ---- 共通の商品（MASTER） ----

export const 一括商品 = {
  A: { 商品コード: () => rc("M0403-MASTER-A"), 商品名: () => rc("一括商品A") },
  B: { 商品コード: () => rc("M0403-MASTER-B"), 商品名: () => rc("一括商品B") },
  C: { 商品コード: () => rc("M0403-MASTER-C"), 商品名: () => rc("大阪商品") },
};
const 商品の番号 = { A: "", B: "", C: "" };
export function 共通の商品ID(k: "A" | "B" | "C"): string {
  if (!商品の番号[k]) throw new Error("共通の商品をまだ作っていない（S-M04-03-MASTER）");
  return 商品の番号[k];
}

defineSeed("S-M04-03-MASTER", async ({ browser, notes, seed }) => {
  if (商品の番号.A) return;
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    店舗の番号.TC東京 = 試験支店の店舗ID();
    店舗の番号.大阪店 = 本店の店舗ID;
    issue(店の読み替え());
    const categoryId = await readExistingGoodsChildCategoryId(page);
    await registerGoodsCsv(page, {
      what: `${seed.シードID} のグッズ商品CSV登録`, fileName: `${seed.シードID.toLowerCase()}-${Date.now()}.csv`, categoryId,
      lines: (["A", "B", "C"] as const).map((k) => ({ code: 一括商品[k].商品コード(), nameJp: 一括商品[k].商品名(), nameEn: 一括商品[k].商品名() })),
      common: { "基準価格": "100", "販売価格": "100", "買取価格": "10", "原価単価": "10" },
      onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`),
    });
    for (const k of ["A", "B", "C"] as const) {
      商品の番号[k] = await openProductEditByCode(page, 一括商品[k].商品コード());
      notes.set(`〔商品ID-M0403-共有${k}〕`, 商品の番号[k]);
    }
    for (const [k, foil, img] of [["A", 1, "bulk-a"], ["B", 2, "bulk-b"]] as const) {
      const foilName = foil === 1 ? "通常" : "特殊";
      // 元から開発環境にある、商品の付いていないカード詳細があればそれを使う（ほかの方の試験用カードは使わない。2026-11-16 依頼者指示）。
      // 無いとき（Foil「特殊」など）は、実行の印つきの試験用カードを画面で作って使う（マスタは作ってよい: 2026-11-14 依頼者決定。M04-33・M05-09 と同じ）
      let card = 元からある商品の無いカード詳細(foil);
      if (card) {
        issue(`開発環境に元からある商品の付いていない Foil「${foilName}」のカード詳細（ID ${card.カード詳細ID}「${card.カード名}」）を一括商品${k}に紐付けた`);
      } else {
        const 名 = rc(`M0403-CARD-${k}`);
        await カードを登録する(page, { カード名日: 名, カード名英: 名, 点数で見たマナ: "0", 詳細: { Foil: foilName } }, `${seed.シードID}: ${名} のカードの登録`, issue);
        const ids = await カード詳細IDs(page);
        if (ids.length !== 1) throw new Error(`${seed.シードID}: ${名} のカードのカード詳細が ${ids.length} 件（1件のはず）`);
        card = { カード詳細ID: ids[0], カード名: 名, カードセットID: null };
        issue(`Foil「${foilName}」の元からあるカード詳細が使えないので、実行の印つきの試験用カード「${名}」（カード詳細ID ${ids[0]}）を画面で作り、一括商品${k}に紐付けた`);
      }
      await assignCardOnProductEditInSet(page, {
        productId: 商品の番号[k], cardNameJp: card.カード名, cardDetailId: card.カード詳細ID, cardsetId: card.カードセットID,
        productNameJp: 一括商品[k].商品名(), productNameEn: 一括商品[k].商品名(), images: [imageFile(img)],
      }, issue);
    }
  });
});

defineSeed("S-M04-03-ADM", { needs: ["S-M04-03-MASTER"] }, async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await メンバーを用意する(page, 試験管理者, [店舗IDの("TC東京"), 店舗IDの("大阪店")]);
    await メンバーを用意する(page, 入庫の承認者.TC東京, [店舗IDの("TC東京"), 店舗IDの("大阪店")]);
    await メンバーを用意する(page, 入庫の承認者.大阪店, [店舗IDの("大阪店"), 店舗IDの("TC東京")]);
  });
});

for (const n of ["054", "055", "056", "061"]) {
  const 種 = n === "061" ? "DP" : "GF";
  defineSeed(`S-M04-03-${種}-REG-${n}`, { needs: ["S-M04-03-MASTER"] }, async ({ browser }) => {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await メンバーを用意する(page, 登録者の(n), [店舗IDの("TC東京")]); });
  });
  defineSeed(`S-M04-03-${種}-APR-${n}`, { needs: ["S-M04-03-MASTER"] }, async ({ browser }) => {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await メンバーを用意する(page, 承認者の(n), [店舗IDの("TC東京")]); });
  });
}

// ---- ケースの規格と在庫 ----

/** 正本の商品コードに実行の印を付けたもの（ケースは正本の商品コードで引く） */
export const 商品コードの = (正本の商品コード: string): string => rc(正本の商品コード);

type 規格の定め = {
  控え: string; 商品: "A" | "B" | "C" | { 名前: string; 取込の商品コード: string }; 商品コード: string; 言語: "日本語" | "英語"; 状態: "ニアミント" | "スライトリープレイド";
  店: "TC東京" | "大阪店";
  /** 在庫の作り方: 入庫（在庫編集＋承認。仕入単価つき）か、DB（在庫数・総原価の書き足し） */
  在庫: { 入庫: number; 仕入単価: number } | { DB: [number, number] };
  /** 取込で作られた規格をそのまま使う（006・007・013 の A） */
  取込の規格?: boolean;
};

/** 入庫（在庫編集）を試験管理者で登録し、入庫の承認者が在庫編集承認一覧で承認する */
async function 入庫して承認する(browser: Browser, seedId: string, 在庫ID: string, 店: "TC東京" | "大阪店", 数量: number, 仕入単価: number, issue: (m: string) => void): Promise<void> {
  const 店名 = 店 === "TC東京" ? TC東京.店名 : 大阪店.店名;
  await withAdminSession(browser, 試験管理者.account, async (page) => {
    page.setDefaultTimeout(60_000);
    await 在庫編集を開く(page, 在庫ID);
    await registerStockEdit(page, { changeType: "入庫/問屋仕入", reason: `${seedId}の入庫`, quantity: String(数量), purchasePrice: String(仕入単価), approverName: 入庫の承認者[店].名前 },
      `${seedId}: 在庫ID ${在庫ID} の在庫編集（入庫 ${数量}）`, issue);
  });
  const 承認ID = 在庫の最新の承認ID(在庫ID);
  if (!承認ID) throw new Error(`${seedId}: 在庫ID ${在庫ID} の在庫編集の承認が見つからない`);
  const 行 = 承認一覧の行の番号(承認ID);
  await withAdminSession(browser, 入庫の承認者[店].account, async (page) => {
    page.setDefaultTimeout(60_000);
    const list = new StockApprovalListPage(page);
    await list.open(店名);
    await list.approve([行], `${seedId}: 在庫ID ${在庫ID} の入庫の承認`, issue);
  });
}

const 定め: Record<string, 規格の定め[]> = {
  "S-M04-03-CASE-001": [
    { 控え: "001A", 商品: "A", 商品コード: "BULK-A-001", 言語: "日本語", 状態: "ニアミント", 店: "TC東京", 在庫: { 入庫: 10, 仕入単価: 1000 } },
    { 控え: "001B", 商品: "B", 商品コード: "BULK-B-001", 言語: "英語", 状態: "スライトリープレイド", 店: "TC東京", 在庫: { 入庫: 20, 仕入単価: 800 } },
  ],
  "S-M04-03-CASE-002": [{ 控え: "002", 商品: "A", 商品コード: "BULK-A-002", 言語: "日本語", 状態: "ニアミント", 店: "TC東京", 在庫: { 入庫: 10, 仕入単価: 1000 } }],
  "S-M04-03-CASE-004": [
    { 控え: "004A", 商品: "A", 商品コード: "BULK-A-004", 言語: "日本語", 状態: "ニアミント", 店: "TC東京", 在庫: { 入庫: 10, 仕入単価: 0 } },
    { 控え: "004B", 商品: "C", 商品コード: "OSAKA-A-004", 言語: "日本語", 状態: "ニアミント", 店: "大阪店", 在庫: { 入庫: 5, 仕入単価: 1000 } },
  ],
  "S-M04-03-CASE-005": [
    { 控え: "005A", 商品: "A", 商品コード: "BULK-A-005", 言語: "日本語", 状態: "ニアミント", 店: "TC東京", 在庫: { 入庫: 10, 仕入単価: 1000 } },
    { 控え: "005B", 商品: "B", 商品コード: "BULK-B-005", 言語: "英語", 状態: "スライトリープレイド", 店: "TC東京", 在庫: { 入庫: 20, 仕入単価: 800 } },
  ],
  "S-M04-03-CASE-009": [{ 控え: "009", 商品: "A", 商品コード: "M0403-SALES-009", 言語: "日本語", 状態: "ニアミント", 店: "TC東京", 在庫: { 入庫: 10, 仕入単価: 0 } }],
  "S-M04-03-CASE-010": [{ 控え: "010", 商品: "A", 商品コード: "BULK-A-010", 言語: "日本語", 状態: "ニアミント", 店: "TC東京", 在庫: { 入庫: 10, 仕入単価: 1000 } }],
  "S-M04-03-CASE-014": [{ 控え: "014", 商品: "A", 商品コード: "BULK-A-014", 言語: "日本語", 状態: "ニアミント", 店: "TC東京", 在庫: { 入庫: 10, 仕入単価: 1000 } }],
  ...Object.fromEntries(["006", "007", "013"].map((n) => {
    const 商品 = { 名前: `絞込確認商品-${n}`, 取込の商品コード: `M0403-${n}-A` };
    return [`S-M04-03-CASE-${n}`, [
      { 控え: `${n}A`, 商品, 商品コード: `M0403-${n}-A`, 言語: "日本語", 状態: "ニアミント", 店: "TC東京", 在庫: { 入庫: 10, 仕入単価: 0 }, 取込の規格: true },
      { 控え: `${n}B`, 商品, 商品コード: `M0403-${n}-B`, 言語: "英語", 状態: "ニアミント", 店: "TC東京", 在庫: { 入庫: 10, 仕入単価: 0 } },
      { 控え: `${n}C`, 商品, 商品コード: `M0403-${n}-C`, 言語: "日本語", 状態: "スライトリープレイド", 店: "TC東京", 在庫: { 入庫: 10, 仕入単価: 0 } },
    ] as 規格の定め[]];
  })),
  ...Object.fromEntries(["054", "055", "056"].map((n) => [`S-M04-03-GF-STOCK-${n}`, [
    { 控え: n, 商品: "A", 商品コード: `BULK-A-${n}`, 言語: "日本語", 状態: "ニアミント", 店: "TC東京", 在庫: { DB: [10, 10000] } },
  ] as 規格の定め[]])),
  "S-M04-03-DP-STOCK-061": [{ 控え: "061", 商品: "A", 商品コード: "M0403-061-BULK", 言語: "日本語", 状態: "ニアミント", 店: "TC東京", 在庫: { DB: [10, 10000] } }],
};


// ---- 所属のマスタを使うケース（2026-11-14 依頼者決定: 所属のマスタに行を足してよい）。在庫数・総原価はシード表のとおり DB で書き足す ----
const 一括A = (番号: string, 在庫: [number, number] = [10, 10000]): 規格の定め => ({ 控え: 番号, 商品: "A", 商品コード: `BULK-A-${番号}`, 言語: "日本語", 状態: "ニアミント", 店: "TC東京", 在庫: { DB: 在庫 } });
const AとB = (番号: string): 規格の定め[] => [
  { 控え: `${番号}A`, 商品: "A", 商品コード: `BULK-A-${番号}`, 言語: "日本語", 状態: "ニアミント", 店: "TC東京", 在庫: { DB: [10, 10000] } },
  { 控え: `${番号}B`, 商品: "B", 商品コード: `BULK-B-${番号}`, 言語: "英語", 状態: "スライトリープレイド", 店: "TC東京", 在庫: { DB: [20, 16000] } },
];
Object.assign(定め, {
  ...Object.fromEntries(["011", "012", "018", "019", "021", "029", "038", "039", "040"].map((n) => [`S-M04-03-CASE-${n}`, [一括A(n)]])),
  ...Object.fromEntries(["015", "016", "017", "025", "027", "028", "035", "041"].map((n) => [`S-M04-03-CASE-${n}`, AとB(n)])),
  "S-M04-03-CASE-031": [{ 控え: "031", 商品: { 名前: "境界商品-031", 取込の商品コード: "M0403-ZERO-031" }, 商品コード: "M0403-ZERO-031", 言語: "日本語", 状態: "ニアミント", 店: "TC東京", 在庫: { DB: [0, 0] }, 取込の規格: true }],
  "S-M04-03-CASE-033": [{ 控え: "033", 商品: { 名前: "境界商品-033", 取込の商品コード: "M0403-MAX-033" }, 商品コード: "M0403-MAX-033", 言語: "日本語", 状態: "ニアミント", 店: "TC東京", 在庫: { DB: [99999999, 99999999] }, 取込の規格: true }],
  "S-M04-03-CASE-043": [一括A("043")],
  "S-M04-03-GF-STOCK-051": [一括A("051")],
  "S-M04-03-CASE-044": [{ 控え: "044", 商品: { 名前: "削除確認商品-044", 取込の商品コード: "M0403-044-BASE" }, 商品コード: "DELETE-A-044", 言語: "日本語", 状態: "スライトリープレイド", 店: "TC東京", 在庫: { DB: [8, 8000] } }],
  "S-M04-03-CASE-045": [
    { ...一括A("045"), 控え: "045A" },
    { 控え: "045B", 商品: { 名前: "削除確認商品-045", 取込の商品コード: "M0403-045-BASE" }, 商品コード: "DELETE-A-045", 言語: "日本語", 状態: "スライトリープレイド", 店: "TC東京", 在庫: { DB: [8, 8000] } },
  ],
  "S-M04-03-L-STOCK-049": [
    { 控え: "049A", 商品: "A", 商品コード: "BULK-A-L001", 言語: "日本語", 状態: "ニアミント", 店: "TC東京", 在庫: { DB: [10, 10000] } },
    { 控え: "049B", 商品: "B", 商品コード: "BULK-B-L001", 言語: "英語", 状態: "スライトリープレイド", 店: "TC東京", 在庫: { DB: [20, 16000] } },
  ],
  "S-M04-03-L-STOCK-050": [
    { 控え: "050A", 商品: "A", 商品コード: "BULK-A-L002", 言語: "日本語", 状態: "ニアミント", 店: "TC東京", 在庫: { DB: [10, 10000] } },
    { 控え: "050B", 商品: "B", 商品コード: "BULK-B-L002", 言語: "英語", 状態: "スライトリープレイド", 店: "TC東京", 在庫: { DB: [20, 16000] } },
  ],
  "S-M04-03-CASE-042": [
    { ...一括A("042"), 控え: "042A" },
    { 控え: "042B", 商品: "C", 商品コード: "OSAKA-A-042", 言語: "日本語", 状態: "ニアミント", 店: "大阪店", 在庫: { DB: [10, 10000] } },
  ],
});

/** 絞込確認商品（006・007・013）の商品ID（シード表が控えると定める） */
const 絞込の商品ID = new Map<string, string>();

for (const [seedId, list] of Object.entries(定め)) {
  const needs = ["S-M04-03-MASTER", ...(seedId.includes("CASE") ? ["S-M04-03-ADM"] : [])];
  defineSeed(seedId, { needs }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const 呼び名あり = (l: string) => getSeed(seedId).状態・属性.includes(l);
    const made: { d: 規格の定め; 在庫ID: string }[] = [];
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      for (const d of list) {
        const code = 商品コードの(d.商品コード);
        let 商品ID: string;
        if (typeof d.商品 === "string") 商品ID = 共通の商品ID(d.商品);
        else {
          const key = d.商品.名前;
          if (!絞込の商品ID.has(key)) {
            const categoryId = await readExistingGoodsChildCategoryId(page);
            await registerGoodsCsv(page, {
              what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId.toLowerCase()}-${Date.now()}.csv`, categoryId,
              lines: [{ code: 商品コードの(d.商品.取込の商品コード), nameJp: rc(key), nameEn: rc(key) }],
              common: { "基準価格": "100", "販売価格": "100", "買取価格": "10", "原価単価": "10" },
              onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`),
            });
            絞込の商品ID.set(key, await openProductEditByCode(page, 商品コードの(d.商品.取込の商品コード)));
            const n = seedId.slice(-3);
            if (呼び名あり(`〔商品ID-M0403-${n}〕`)) notes.set(`〔商品ID-M0403-${n}〕`, 絞込の商品ID.get(key)!);
          }
          商品ID = 絞込の商品ID.get(key)!;
        }
        let 規格ID: string;
        if (d.取込の規格) {
          規格ID = await 取込の規格ID(page, 商品ID, code);
        } else {
          await openClassList(page, 商品ID);
          規格ID = await addClass(page, 商品ID, { 言語: d.言語, 状態: d.状態, 商品コード: code, 基準価格: "1000", 販売価格: "1000", 買取価格: "1" }, `${seedId}: ${code}`, issue);
        }
        if (呼び名あり(`〔商品規格ID-M0403-${d.控え}〕`)) notes.set(`〔商品規格ID-M0403-${d.控え}〕`, 規格ID);
        const 在庫ID = 在庫IDの(code, 店舗IDの(d.店));
        if (呼び名あり(`〔在庫ID-M0403-${d.控え}〕`)) notes.set(`〔在庫ID-M0403-${d.控え}〕`, 在庫ID);
        if ("DB" in d.在庫) {
          在庫数と総原価を整える(seedId, 在庫ID, d.在庫.DB[0], d.在庫.DB[1]);
          issue(`在庫数${d.在庫.DB[0]}・総原価${d.在庫.DB[1]}は画面で指定できないので、E2E の規格の在庫（在庫ID ${在庫ID}）へ DB で書き足した（シード表の投入方法のとおり）`);
        }
        if (seedId === "S-M04-03-CASE-009") {
          期間別販売数量を足す(seedId, 規格ID, 店舗IDの("TC東京"), [1, 2, 3, 4, 5]);
          issue("期間別販売数量（当日1・昨日2・3日間3・1週間4・1ヶ月間5）は画面で指定できないので、E2E の規格に DB で行を足した（シード表の投入方法のとおり）");
        }
        made.push({ d, 在庫ID });
      }
    });
    for (const { d, 在庫ID } of made) {
      if ("入庫" in d.在庫) await 入庫して承認する(browser, seedId, 在庫ID, d.店, d.在庫.入庫, d.在庫.仕入単価, issue);
    }
  });
}

/** 取込で作られた規格（商品コードで探す）の商品規格ID */
async function 取込の規格ID(page: Page, 商品ID: string, 商品コード: string): Promise<string> {
  const rows = await classRowsFromProductEdit(page, 商品ID);
  const hit = rows.filter((r) => r.商品コード === 商品コード);
  if (hit.length !== 1) throw new Error(`取込で作られた規格 ${商品コード} が ${hit.length} 件（1件のはず）`);
  return hit[0].商品規格ID;
}

// ---- 所属・メンバー（S-M04-03-ORG-MEMBERS）。2026-11-14 依頼者決定: 所属のマスタに足す行は、機能IDを付けた決まった名前で1度だけ作る ----

/** 正本の所属「在庫管理第一部」「在庫管理第二部」の、所属のマスタの実際の名称（機能ID付き） */
export const 承認通知先所属 = { 第一部: "在庫管理第一部（M04-03）", 第二部: "在庫管理第二部（M04-03）" } as const;
/** 正本の所属名から、実際の名称へ（ケースの手順で選ぶ所属） */
export const 所属の実名 = (正本の名前: string): string => {
  if (正本の名前 === "在庫管理第一部") return 承認通知先所属.第一部;
  if (正本の名前 === "在庫管理第二部") return 承認通知先所属.第二部;
  throw new Error(`正本の所属「${正本の名前}」の読み替えが無い`);
};
const 通知先メンバー = (名前: string, loginId: string): 管理者 => ({ 名前, account: { loginId, password: "Passw0rd!M0403Ap" }, email: `${loginId}@example.test` });
/** シード表の承認者A・承認者B・一般担当者（TC東京＝試験支店所属）・承認者C（大阪店＝本店所属）。実際の名前は機能ID付き（決まった名前・使い回す） */
export const 承認通知先 = {
  A: 通知先メンバー("承認者A（M04-03）", "m0403_apr_a"),
  B: 通知先メンバー("承認者B（M04-03）", "m0403_apr_b"),
  一般担当者: 通知先メンバー("一般担当者（M04-03）", "m0403_general"),
  C: 通知先メンバー("承認者C（M04-03）", "m0403_apr_c"),
} as const;
export const 承認通知先の注記 = (): string =>
  `正本の所属「在庫管理第一部」「在庫管理第二部」は、所属のマスタに「${承認通知先所属.第一部}」「${承認通知先所属.第二部}」として足した（依頼者決定 2026-11-14。決まった名前で1度だけ）。メンバー「承認者A」「承認者B」「一般担当者」「承認者C」は「承認者A（M04-03）」などの名前で作った（所属店舗は、TC東京＝試験支店・大阪店＝本店）`;

defineSeed("S-M04-03-ORG-MEMBERS", { needs: ["S-M04-03-MASTER"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    issue(承認通知先の注記());
    issue("所属の並び順（10・20）は、所属のマスタの画面が保存順に振る値のまま（DB では書き換えない。ほかの方の行の並び順を動かさないため）");
    await ensureDepartment(page, 承認通知先所属.第一部);
    await ensureDepartment(page, 承認通知先所属.第二部);
    await ensureNoApprovalAuthority(page);
    const tc = TC東京.店名, osaka = 大阪店.店名;
    const 登録 = async (m: 管理者, 店名: string, 所属: string, 権限: string): Promise<string> => ensureMemberWithDepartment(page, {
      名前: m.名前, 所属店舗: 店名, 所属, ログインID: m.account.loginId, メールアドレス: m.email, パスワード: m.account.password,
      権限, デフォルト検索表示店舗: 店名, 編集可能店舗: [店名],
    });
    notes.set("〔メンバーID-M0403-共有A〕", await 登録(承認通知先.A, tc, 承認通知先所属.第一部, "システム管理者"));
    notes.set("〔メンバーID-M0403-共有B〕", await 登録(承認通知先.B, tc, 承認通知先所属.第二部, "システム管理者"));
    notes.set("〔メンバーID-M0403-共有C〕", await 登録(承認通知先.一般担当者, tc, 承認通知先所属.第一部, M0409_NO_APPROVAL_AUTHORITY));
    notes.set("〔メンバーID-M0403-共有D〕", await 登録(承認通知先.C, osaka, 承認通知先所属.第一部, "システム管理者"));
    issue("「在庫承認権限なし」の一般担当者の権限は、E2E が作った承認権限なしの権限（M04-09 と同じ）を使った。承認権限あり（承認者A・B・C）はシステム管理者");
  });
});

/** S-M04-03-INPUT（入力値の取り決め。投入は不要） */
defineSeed("S-M04-03-INPUT", async () => undefined);

// ---- 043・051: 別のブラウザで在庫編集の権限（編集可能店舗）を外される管理者と、外すメンバー管理者 ----
/** S-M04-03-ADM-MANAGER（M04-03メンバー管理者）。実行をまたいで使い回す（決まった印）。メンバーの編集ができる権限はシステム管理者 */
export const メンバー管理者 = 使い回す管理者("M04-03メンバー管理者（試験支店）", "m0403_manager_t", "Passw0rd!M0403Mgr");
/** 権限を外される管理者（M04-03試験管理者-043・M04-03補完試験管理者-051）。外すと戻らないので、実行ごとの印を付けて毎回作る */
export const 権限変更対象 = (番号: "043" | "051"): 管理者 => 管理者の(番号 === "043" ? "M04-03試験管理者-043" : "M04-03補完試験管理者-051", 番号 === "043" ? "m0403_admin-043" : "m0403-051-adm", `Qz${番号}k9Tm!Pw1`);
const 権限変更対象のID = new Map<string, string>();
export const 権限変更対象の管理者ID = (番号: "043" | "051"): string => {
  const id = 権限変更対象のID.get(番号);
  if (!id) throw new Error(`権限を外される管理者（${番号}）をまだ作っていない`);
  return id;
};
defineSeed("S-M04-03-ADM-MANAGER", { needs: ["S-M04-03-MASTER"] }, async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await メンバーを用意する(page, メンバー管理者, [店舗IDの("TC東京")]);
    reportSeedIssue(seed.シードID, "メンバーの権限編集ができる権限は、システム管理者（在庫承認権限は確かめない）。所属店舗・編集可能店舗は試験支店");
  });
  await withAdminSession(browser, メンバー管理者.account, async () => undefined);
});
for (const [seedId, 番号] of [["S-M04-03-ADM-TARGET-043", "043"], ["S-M04-03-GF-ADM-051", "051"]] as const) {
  defineSeed(seedId, { needs: ["S-M04-03-MASTER"] }, async ({ browser }) => {
    const m = 権限変更対象(番号);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      // 所属店舗は本店、編集可能店舗は本店と試験支店（開始時は試験支店＝TC東京の在庫編集権限あり。あとで試験支店だけを外す）
      const id = await ensureMemberByStoreIds(page, {
        名前: m.名前, ログインID: m.account.loginId, メールアドレス: m.email, パスワード: m.account.password, 権限: "システム管理者",
        所属店舗ID: 本店の店舗ID, デフォルト検索表示店舗ID: 本店の店舗ID, 編集可能店舗ID: [本店の店舗ID, 店舗IDの("TC東京")],
      });
      権限変更対象のID.set(番号, id);
      reportSeedIssue(seedId, `「${m.名前}」は所属店舗・デフォルト検索表示店舗を本店、編集可能店舗を本店と試験支店（正本の TC東京）にして作った（試験支店だけを外せるように）。権限はシステム管理者`);
    });
  });
}

// ---- 連携のケース（049・050）。L-MASTER・L-ORG・L-ADM-SHARED は、同じ内容の MASTER・ORG-MEMBERS・ADM を使う ----
defineSeed("S-M04-03-L-MASTER", { needs: ["S-M04-03-MASTER"] }, async ({ seed }) => {
  reportSeedIssue(seed.シードID, "連携用の商品「一括商品A」「一括商品B」は、同じ内容の共通の商品（S-M04-03-MASTER）を使った（商品コード M0403-LM-A・LM-B の別の取込はしない）。店舗は試験支店（正本の TC東京）");
});
defineSeed("S-M04-03-L-ORG", { needs: ["S-M04-03-ORG-MEMBERS"] }, async ({ seed }) => {
  reportSeedIssue(seed.シードID, `連携用の承認通知先は、同じ内容の S-M04-03-ORG-MEMBERS（所属「${承認通知先所属.第一部}」・メンバー「${承認通知先.A.名前}」）を使った`);
});
defineSeed("S-M04-03-L-ADM-SHARED", { needs: ["S-M04-03-ADM"] }, async ({ seed }) => {
  reportSeedIssue(seed.シードID, `共有の試験管理者は、S-M04-03-ADM の「${試験管理者.名前}」を使った（TC東京・大阪店＝試験支店・本店の在庫編集権限あり）`);
});
/** S-M04-03-L-ADM-049（M04-03連携管理者-001）。実行ごとの印つきで毎回作る */
export const 連携管理者 = 管理者の("M04-03連携管理者-001", "m0403l001", "Passw0rd!M0403L1");
defineSeed("S-M04-03-L-ADM-049", { needs: ["S-M04-03-MASTER"] }, async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    // シード表にこの控えの呼び名が無いので、番号は控えない（ケースも使わない）
    await メンバーを用意する(page, 連携管理者, [店舗IDの("TC東京")]);
  });
  reportSeedIssue("S-M04-03-L-ADM-049", "権限はシステム管理者（在庫編集権限・在庫承認権限あり）。所属店舗・編集可能店舗は試験支店");
});
