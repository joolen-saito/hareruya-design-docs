/**
 * M04-03 在庫一括編集の続き（-x）の画面シード。正本: cases/M04-03_seed_data.tsv
 * 仕分け直し（e2e/review/not_runnable_seed_recheck2.tsv）で流せる見込みになったケースのうち、所属のマスタ（在庫管理第一部・第二部）を使わないもの。
 *
 * 作り方（シード表の投入方法の順。画面で作れない状態だけ、E2E の行へ DB で書き足す。依頼者決定 2026-11-10）:
 * - 店舗（MASTER）: 「TC東京」は開発環境に無いので、店舗登録画面で一度だけ作り、以後は使い回す（ショップ名略称「TC東京」は期待結果が見る）。
 *   「大阪店」は開発環境に同じ名前の店舗が2つあり（ほかの方のもの）名前で決まらないので、E2E 用に「大阪店（M04-03）」を一度だけ作る
 *   （大阪店の名前を期待結果が見るケースは今回の範囲に無い）。店舗の番号（403070001 など）はシード表の決め打ちだが、画面が振る番号を使う。
 * - 共通の商品（MASTER）: グッズ商品CSV登録で「一括商品A」「一括商品B」「大阪商品」の3行を取り込み、商品登録編集の「カード指定」で
 *   一括商品A に Foil「通常」、一括商品B に Foil「特殊」のカード詳細を紐付け、代表画像（bulk-a.png・bulk-b.png。色の違う小さな画像）を追加する。
 *   カードのマスタは新しく作らず、開発環境に既にある商品の付いていないカード詳細を使う（Foil「特殊」で使えるものは 11/11 時点で2件）。
 *   商品コード・商品名に実行の印を付け、ケースの文の同じ値も印つきで読む。
 * - 在庫変動区分・言語・状態の選択肢（MASTER の DB 設定）は、開発環境のマスタをそのまま使う（書き換えない）。
 * - 試験管理者（ADM）・入庫の承認者: メンバー登録画面で作る。名前・ログインIDに実行の印を付ける（開発環境に手動テスト用の同じものがありうる）。
 *   権限は「システム管理者」（M04-02 と同じ。シード表の「在庫承認権限なし」は、今回の範囲のケースが確かめない）。
 * - ケースの規格（CASE-*）: 商品規格一覧の「新規作成」で共通の商品に規格を足し、在庫IDは DB の参照で読んで控える。
 *   在庫数はシード表のとおり在庫編集で入庫し、別のメンバー（承認者）が在庫編集承認一覧で承認する（画面で作れる）。
 * - ケースの規格（GF-STOCK・DP-STOCK）: 在庫数・総原価はシード表のとおり画面で指定できないので、E2E の規格の在庫へ DB で書き足す。
 * - 期間別販売数量（CASE-009）: 画面に入力の手段が無いので、E2E の規格の期間別販売数量の行を DB で足す（当日1・昨日2・3日間3・1週間4・1ヶ月間5）。
 */
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { getSeed } from "../lib/catalog";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { 在庫IDの, 在庫数と総原価を整える, 在庫の最新の承認ID, 期間別販売数量を足す, 商品の無いカード詳細 } from "../db/m04_03_x";
import { 承認一覧の行の番号 } from "../db/m04_02_x";
import { imageFile } from "../pages/admin/f03_06_products";
import { readExistingGoodsChildCategoryId } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { classRowsFromProductEdit, openProductEditByCode } from "../pages/admin/m03_23_seed_products";
import { addClass, openClassList } from "../pages/admin/m03_30_products";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { ensureStore, M0424StoreInput } from "../pages/admin/m04_24_store";
import { 在庫編集を開く } from "../pages/admin/m04_03_bulk_x";
import { assignCardOnProductEdit } from "../pages/admin/product_card_assign";
import { registerStockEdit, StockApprovalListPage } from "../pages/admin/stock_edit";

// ---- 店舗 ----

export const TC東京: M0424StoreInput = {
  店名: "TC東京", 店名カナ: "ティーシートウキョウ", 店名英語: "TC Tokyo", 支店URL: "m0403tct", 店名略称3文字: "M3T", ショップ名略称: "TC東京",
  会社名: "株式会社晴れる屋", 会社名カナ: "カブシキガイシャハレルヤ", 郵便番号: "160-0022", 都道府県: "東京都", 住所1: "新宿区新宿3-3-3",
  住所2: "晴ビル3F", 電話番号: "03-0403-0001",
};
export const 大阪店: M0424StoreInput = {
  店名: "大阪店（M04-03）", 店名カナ: "オオサカテンエムゼロヨンゼロサン", 店名英語: "Osaka M0403", 支店URL: "m0403osk", 店名略称3文字: "M3O", ショップ名略称: "大阪店",
  会社名: "株式会社晴れる屋", 会社名カナ: "カブシキガイシャハレルヤ", 郵便番号: "530-0001", 都道府県: "大阪府", 住所1: "大阪市北区梅田3-3-3",
  住所2: "晴ビル3F", 電話番号: "06-0403-0002",
};
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
/** S-M04-03-ADM（M04-03試験管理者。TC東京・大阪店の在庫を編集できる） */
export const 試験管理者 = 管理者の("M04-03試験管理者", "m0403_admin", "Passw0rd!M0403");
/** シードの入庫を承認するメンバー（シード表の「店舗の在庫承認権限を持つ別のメンバー」） */
export const 入庫の承認者 = 管理者の("M04-03入庫承認者", "m0403_seed_apr", "Passw0rd!M0403Ap");
/** 054〜061 の登録者・承認者（S-M04-03-GF-REG-<番号>・GF-APR・DP-REG・DP-APR） */
export const 登録者の = (番号: string): 管理者 => 管理者の(`M0403-${番号}-登録者`, `m0403-${番号}-reg`, `Qz${番号}r7Tm!`);
export const 承認者の = (番号: string): 管理者 => 管理者の(`M0403-${番号}-承認者`, `m0403-${番号}-apr`, `Qz${番号}a5Tm!`);

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
    店舗の番号.TC東京 = await ensureStore(page, TC東京, issue);
    店舗の番号.大阪店 = await ensureStore(page, 大阪店, issue);
    issue(`店舗「TC東京」（店舗ID ${店舗の番号.TC東京}）と、E2E 用の「大阪店（M04-03）」（店舗ID ${店舗の番号.大阪店}）を使う（無ければ一度だけ画面で作る。開発環境の「大阪店」は同名が2つあり名前で決まらないため）`);
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
      const card = 商品の無いカード詳細(foil);
      issue(`カードのマスタは新しく作らず、開発環境に既にある商品の付いていない Foil「${foil === 1 ? "通常" : "特殊"}」のカード詳細（ID ${card.カード詳細ID}「${card.カード名}」）を一括商品${k}に紐付けた`);
      await assignCardOnProductEdit(page, {
        productId: 商品の番号[k], cardNameJp: card.カード名, cardDetailId: card.カード詳細ID,
        productNameJp: 一括商品[k].商品名(), productNameEn: 一括商品[k].商品名(), images: [imageFile(img)],
      }, issue);
    }
  });
});

defineSeed("S-M04-03-ADM", { needs: ["S-M04-03-MASTER"] }, async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await メンバーを用意する(page, 試験管理者, [店舗IDの("TC東京"), 店舗IDの("大阪店")]);
    await メンバーを用意する(page, 入庫の承認者, [店舗IDの("TC東京"), 店舗IDの("大阪店")]);
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
    await registerStockEdit(page, { changeType: "入庫/問屋仕入", reason: `${seedId}の入庫`, quantity: String(数量), purchasePrice: String(仕入単価), approverName: 入庫の承認者.名前 },
      `${seedId}: 在庫ID ${在庫ID} の在庫編集（入庫 ${数量}）`, issue);
  });
  const 承認ID = 在庫の最新の承認ID(在庫ID);
  if (!承認ID) throw new Error(`${seedId}: 在庫ID ${在庫ID} の在庫編集の承認が見つからない`);
  const 行 = 承認一覧の行の番号(承認ID);
  await withAdminSession(browser, 入庫の承認者.account, async (page) => {
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
