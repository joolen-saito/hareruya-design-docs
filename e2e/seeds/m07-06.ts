/**
 * M07-06 買取商品一覧CSV出力 の画面シード。正本: cases/M07-06_seed_data.tsv
 *
 * 依頼者の方針: テストデータは画面から作り、決め打ちの値には実行の印を付ける。共有のマスタ・設定は書き換えない（いまの値を読んで使う）。
 * グッズ商品CSV登録は使わない（開発環境のカテゴリIDの不具合 ECCUBE_HARERUYA-3966）。商品はカード商品（カード登録 → カード商品CSV登録 → 商品規格）で作る。
 *
 * 作り方（買取1件ごと）:
 * 1. 明細の商品: カード（レアリティを指定）→ カード商品CSV登録（日本語。英語の商品は続けて英語も）→ 商品規格に商品コード・買取価格 → （英語の商品は日本語の規格を削除）
 *    → 略称タグを指定する商品は商品登録編集で略称タグを選ぶ。基準価格・販売価格・買取価格は同じ値（買取価格が500円未満だとフロントで買取手続きへ進めないため、
 *    シード表の基準価格がすべて500円以上であることを使う）。
 * 2. 会員: フロントの会員登録＋管理画面の会員登録編集（本会員）。お名前の姓＝注文者名は実行の印つき。
 * 3. 申込: 会員でフロントにログインして買取を申込み（数量はシード表の個数）、完了画面の買取番号を控える。
 * 4. 買取情報編集の査定編集で、明細ごとの売却を選んで保存する（申込直後の売却は未設定のため、「売却する」の明細も選んで保存する）。
 * 5. 買取状況を変えるシード（入庫待ち・キャンセル済み）は、売却を保存したあとに買取状況を変えて保存する。
 *
 * 読み替え（各シードの報告にも残る）:
 * - MASTER: 状態・レアリティ・略称タグ・言語は共有のマスタ。書き換えず、いまの値を画面で読む。レアリティ「M」「C」・状態「NM」・言語「日本語」「英語」は
 *   コードで探す（無ければ止める）。略称タグ「TAGA」は、略称タグの一覧の先頭にある既存の略称タグで代える。
 * - 買取依頼日は「実行日の前日」だが、画面から日付は決められない（申込んだ日になる）。ケースは買取依頼日を確かめない。
 * - フロントの買取カートは状態NMの規格だけを入れられる（アプリの作り）ので、状態SPの買取明細は画面から作れない（STATE-002 は作らない）。
 */
import { Browser, Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { rc, RUN_MARK } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { Account, hideDebugToolbar, withAdminSession } from "../lib/session";
import { defineSeed } from "./current_seed";
import { readExistingSellGroupName } from "../pages/admin/m03_01_goods_csv";
import { readLanguageIds } from "../pages/admin/m03_23_seed_products";
import { ensureCardset } from "../pages/admin/product_masters";
import {
  F0504カードを登録する, カード商品CSVの見出し, カード商品CSVを登録する, 商品名で商品IDを読む, 商品規格一覧を読む, 商品規格を削除する, 商品規格を登録する,
  単体カード配下のカテゴリID, 登録済みの割引率ID, 規格IDを選ぶ,
} from "../pages/admin/f05_04_products";
import { BuyEditPage, BuyListPage } from "../pages/admin/m07_buy";
import { マスタを読む, 商品をカードにする, 略称タグを読む } from "../pages/admin/m07_09_card";
import { 売却を明細ごとに設定する } from "../pages/admin/m07_06";
import { 条件つきで申込む } from "../pages/front/m07_03_apply";
import { ログインする } from "../pages/front/m07_net_buy";
import { 会員のパスワード, 会員を用意する } from "./m07-03-b";
import { 試験管理者を用意する } from "./m07-common";

export const M0706_ADMIN: Account = { loginId: "m0706_admin", password: "Passw0rd!M0706" };

defineSeed("S-M07-06-ADM", async ({ browser }) => {
  await 試験管理者を用意する(browser, M0706_ADMIN, "M07-06試験管理者");
});

// ---------------------------------------------------------------------------
// 共有の前提（MASTER）を画面で読んで控える（書き換えない）
// ---------------------------------------------------------------------------

type 前提 = {
  言語ID: { JP: string; EN: string };
  レアリティID: { M: string; C: string };
  略称タグ: string;
  common: { 見出し: string[]; カテゴリ: string; 割引率: string; 購入グループ: string; カードセット: string; 日本語: string; 英語: string };
};
let 控え: 前提 | null = null;

/** ケース（期待結果）が使う、読んだ言語ID・略称タグの名前 */
export function 読んだ前提(): { 言語ID: { JP: string; EN: string }; 略称タグ: string } {
  if (!控え) throw new Error("共有の前提（S-M07-06-MASTER）を読んでいない");
  return { 言語ID: 控え.言語ID, 略称タグ: 控え.略称タグ };
}

async function 前提を読む(browser: Browser, seedId: string): Promise<前提> {
  if (控え) return 控え;
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const v = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const byCode = async (種別: string, コード: string) => {
      const r = (await マスタを読む(page, 種別)).find((x) => x.コード === コード);
      if (!r) throw new Error(`MTGマスターデータ管理の${種別}に、コード ${コード} の行が無い（共有のマスタは書き換えない）`);
      return r;
    };
    const jp = await byCode("言語", "JP"), en = await byCode("言語", "EN");
    await byCode("状態", "NM");
    const m = await byCode("レアリティ", "M"), c = await byCode("レアリティ", "C");
    const tags = await 略称タグを読む(page);
    if (tags.length === 0) throw new Error("略称タグの一覧が空（共有のマスタは書き換えない）");
    const lang = await readLanguageIds(page);
    const cardset = await ensureCardset(page, rc("M0706試験カードセット"), `M0706 Test Set ${RUN_MARK}`, `M6${RUN_MARK}`, issue);
    return {
      jp, en, m, c, tag: tags[0].名称,
      common: {
        見出し: await カード商品CSVの見出し(page), カテゴリ: (await 単体カード配下のカテゴリID(page)).id, 割引率: (await 登録済みの割引率ID(page)).id,
        購入グループ: await readExistingSellGroupName(page), カードセット: cardset, 日本語: lang.日本語, 英語: lang.英語,
      },
    };
  });
  控え = { 言語ID: { JP: v.jp.ID, EN: v.en.ID }, レアリティID: { M: v.m.ID, C: v.c.ID }, 略称タグ: v.tag, common: v.common };
  issue(`シード作成時の問題: MASTER は共有のマスタなので書き換えず、いまの値を読んで使った（言語のID 日本語=${v.jp.ID}・英語=${v.en.ID}、レアリティのID M=${v.m.ID}・C=${v.c.ID}）。`
    + `略称タグ「TAGA」「TAGB」は新しく作らず、略称タグの一覧の先頭にある既存の「${v.tag}」で代えた`);
  return 控え;
}

defineSeed("S-M07-06-MASTER", async ({ browser, seed }) => {
  await 前提を読む(browser, seed.シードID);
});

// ---------------------------------------------------------------------------
// 部品
// ---------------------------------------------------------------------------

export const 注文者名 = (n: string): string => rc(`M0706-${n}-顧客`);
export const 品コード = (n: string, 枝: string): string => rc(`M0706-${n}-${枝}`);
export const 品名 = (n: string, 枝: string): string => rc(`M0706-${n}-カード${枝}`);

export type 明細 = {
  枝: string;
  数量: number;
  基準価格: number;
  売却: "売却する" | "売却しない";
  言語?: "JP" | "EN";
  /** 略称タグを付ける（既存の略称タグの先頭） */
  略称?: boolean;
  レア?: "M" | "C";
};
export type 買取の定義 = { ラベル: string; 明細: 明細[]; 状況?: "入庫待ち" | "キャンセル済み" };

let cardSeq = 0;
const CARD_NO_BASE = String(Date.now()).slice(-9);
const 次のカード番号 = () => `${CARD_NO_BASE}${String(++cardSeq).padStart(2, "0")}`;

/** カード商品を1つ作る。商品IDを返す */
async function 商品を作る(page: Page, 前: 前提, seedId: string, n: string, d: 明細): Promise<string> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const c = 前.common;
  const 言語 = d.言語 ?? "JP";
  const name = 品名(n, d.枝);
  const code = 品コード(n, d.枝);
  const price = String(d.基準価格);
  const reg = await F0504カードを登録する(page, {
    カード名英: rc(`M0706 CARD ${n} ${d.枝}`),
    詳細: [{ カードセットID: c.カードセット, カード番号: 次のカード番号(), レアリティID: 前.レアリティID[d.レア ?? "M"] }],
  }, `${seedId}: カード ${n}-${d.枝}`, issue);
  const row = (言語ID: string, 商品ID: string): Record<string, string> => ({
    "商品ID": 商品ID, "言語(ID)": 言語ID, "商品公開ステータス": "2", "支店の商品公開ステータス": "1",
    "商品名(日)": name, "商品名(英)": name, "サイズ": "1", "重量": "1", "商品カテゴリ(ID)": c.カテゴリ,
    "購入グループ名称": c.購入グループ, "割引率(ID)": c.割引率, "基準価格": price, "販売価格": price, "買取価格": price,
    "カード詳細(ID)": reg.カード詳細IDs[0],
  });
  await カード商品CSVを登録する(page, c.見出し, [row(c.日本語, "")], `m0706-${n}-${d.枝}-jp-${RUN_MARK.toLowerCase()}.csv`, `${seedId}: カード商品CSV登録（日本語）`, issue);
  const productId = await 商品名で商品IDを読む(page, name);
  if (言語 === "EN") {
    await カード商品CSVを登録する(page, c.見出し, [row(c.英語, productId)], `m0706-${n}-${d.枝}-en-${RUN_MARK.toLowerCase()}.csv`, `${seedId}: カード商品CSV登録（英語）`, issue);
  }
  if (d.略称) {
    await 商品をカードにする(page, productId, { 商品名: name, 略称タグ: 前.略称タグ }, issue);
  }
  const rows = await 商品規格一覧を読む(page, productId);
  const target = 規格IDを選ぶ(rows, 言語, "NM");
  await 商品規格を登録する(page, productId, target, { 商品コード: code, 買取価格: price }, `${seedId}: ${n}-${d.枝} の規格`, issue);
  if (言語 === "EN") {
    // 買取商品詳細で英語の規格が入れられるよう、日本語の規格は削除する
    for (const r of rows.filter((x) => x.言語 === "日本語")) await 商品規格を削除する(page, productId, r.商品規格ID, `${seedId}: ${n}-${d.枝} の日本語の規格`, issue);
  }
  return productId;
}

/** 買取を作る: 商品 → 会員 → 申込 → 売却 → 買取状況。買取番号を ラベル → 番号 で返す */
async function 買取を作る(browser: Browser, seedId: string, n: string, 買取: 買取の定義[], notes: Map<string, string> | { set(k: string, v: string): void }): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const 前 = await 前提を読む(browser, seedId);
  const ids = new Map<string, string>();
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const b of 買取) for (const d of b.明細) if (!ids.has(d.枝)) ids.set(d.枝, await 商品を作る(page, 前, seedId, n, d));
  });
  issue("シード作成時の問題: 買取依頼日は「実行日の前日」だが、画面からは決められない（申込んだ日になる）。ケースは買取依頼日を確かめない。商品は基準価格＝販売価格＝買取価格のカード商品（フロントの買取に公開される）で作った");

  const 姓 = 注文者名(n);
  const メール = `${rc(`m0706-${n}`)}@example.test`.toLowerCase();
  await 会員を用意する(browser, seedId, { 姓, 名: "シード", セイ: "シケン", メイ: "シード", メール, 電話: ["090", "1234", "5678"] });
  issue(`シード作成時の問題: 会員はフロントの会員登録＋管理画面の会員登録編集（本会員）で作った。お名前の姓（注文者名）は実行の印つき（${姓}）`);

  const 番号 = new Map<string, string>();
  const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(ctx);
    const fp = await ctx.newPage();
    fp.setDefaultTimeout(60_000);
    await ログインする(fp, { メール, パスワード: 会員のパスワード });
    for (const b of 買取) {
      番号.set(b.ラベル, await 条件つきで申込む(fp, b.明細.map((d) => ({ 商品ID: ids.get(d.枝)!, 数量: String(d.数量) })), { 承諾方法: "査定結果を確認してから承諾する", 登録番号: null, 口座名義: "シケンシード" }));
    }
  } finally { await ctx.close(); }

  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const b of 買取) {
      const num = 番号.get(b.ラベル)!;
      await 売却を明細ごとに設定する(page, num, b.明細.map((d) => ({ 名前: 品名(n, d.枝), 売却: d.売却 })));
      if (b.状況) {
        const l = new BuyListPage(page);
        await l.open();
        await l.買取番号を入れる(String(Number(num)));
        await l.検索する();
        await l.編集画面を開く(num);
        await new BuyEditPage(page).買取状況を変えて保存する(b.状況);
      }
    }
  });
  for (const [k, v] of 番号) notes.set(k, v);
}

const NEEDS = ["S-M07-06-ADM", "S-M07-06-MASTER"];

function 作り方(n: string, 買取: 買取の定義[]): (ctx: { browser: Browser; seed: { シードID: string }; notes: { set(k: string, v: string): void } }) => Promise<void> {
  return async ({ browser, seed, notes }) => { await 買取を作る(browser, seed.シードID, n, 買取, notes); };
}

const m = (枝: string, 数量: number, 基準価格: number, o: Partial<明細> = {}): 明細 => ({ 枝, 数量, 基準価格, 売却: "売却する", ...o });

defineSeed("S-M07-06-NORMAL-001", { needs: NEEDS }, 作り方("001", [{ ラベル: "〔買取番号-M0706-001〕", 明細: [m("A", 1, 1500, { 略称: true, レア: "M" })] }]));
defineSeed("S-M07-06-QTY-003", { needs: NEEDS }, 作り方("003", [{ ラベル: "〔買取番号-M0706-003〕", 明細: [m("A", 3, 1000), m("B", 5, 1000)] }]));
defineSeed("S-M07-06-PRICE-004", { needs: NEEDS }, 作り方("004", [{ ラベル: "〔買取番号-M0706-004〕", 明細: [m("A", 1, 2000), m("B", 1, 800)] }]));
defineSeed("S-M07-06-LANG-007", { needs: NEEDS }, 作り方("007", [{ ラベル: "〔買取番号-M0706-007〕", 明細: [m("A", 1, 1000, { 言語: "EN", 略称: true, レア: "M" })] }]));
defineSeed("S-M07-06-PICK-008", { needs: NEEDS }, 作り方("008", [
  { ラベル: "〔買取番号-M0706-008A〕", 明細: [m("A", 1, 1000)] },
  { ラベル: "〔買取番号-M0706-008B〕", 明細: [m("B", 1, 1000)] },
]));
defineSeed("S-M07-06-SELL-009", { needs: NEEDS }, 作り方("009", [{ ラベル: "〔買取番号-M0706-009〕", 明細: [m("A", 1, 1000), m("B", 1, 1000, { 売却: "売却しない" })] }]));
defineSeed("S-M07-06-NOPICK-012", { needs: NEEDS }, 作り方("012", [{ ラベル: "〔買取番号-M0706-012〕", 明細: [m("A", 1, 1000)] }]));
defineSeed("S-M07-06-EDIT-014", { needs: NEEDS }, 作り方("014", [
  { ラベル: "〔買取番号-M0706-014A〕", 明細: [m("A", 1, 1000)] },
  { ラベル: "〔買取番号-M0706-014B〕", 明細: [m("B", 1, 1000)] },
]));
defineSeed("S-M07-06-CBSELLNO-015", { needs: NEEDS }, 作り方("CB015", [{ ラベル: "〔買取番号-M0706-CB015〕", 明細: [m("A", 1, 1000, { 売却: "売却しない" })] }]));
defineSeed("S-M07-06-CBSELLCANCEL-016", { needs: NEEDS }, 作り方("CB016", [{ ラベル: "〔買取番号-M0706-CB016〕", 明細: [m("A", 2, 1000)], 状況: "キャンセル済み" }]));
defineSeed("S-M07-06-CBSELLACTIVE-017", { needs: NEEDS }, 作り方("CB017", [{ ラベル: "〔買取番号-M0706-CB017〕", 明細: [m("A", 3, 1000)], 状況: "入庫待ち" }]));
defineSeed("S-M07-06-CBCANCELSELL-018", { needs: NEEDS }, 作り方("CB018", [{ ラベル: "〔買取番号-M0706-CB018〕", 明細: [m("A", 1, 1000)] }]));
defineSeed("S-M07-06-CBCANCELCSV-019", { needs: NEEDS }, 作り方("CB019", [{ ラベル: "〔買取番号-M0706-CB019〕", 明細: [m("A", 1, 1000, { 売却: "売却しない" })], 状況: "キャンセル済み" }]));

// 013: 買取番号 706013001 の買取情報が存在しない状態（作らない。画面から作れない番号で、前の実行の残りも作られない）
defineSeed("S-M07-06-ZERO-013", { needs: NEEDS }, async () => { /* 買取情報を作らない */ });
