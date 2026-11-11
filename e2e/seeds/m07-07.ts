/**
 * M07-07 買取商品一覧（キャンセル）CSV出力 の画面シード。正本: cases/M07-07_seed_data.tsv
 *
 * 依頼者の方針: テストデータは画面から作り、決め打ちの値には実行の印を付ける。共有のマスタ・設定は書き換えない（いまの値を読んで使う）。
 * グッズ商品CSV登録は使わない（開発環境のカテゴリIDの不具合 ECCUBE_HARERUYA-3966）。商品はカード商品（カード登録 → カード商品CSV登録 → 商品規格）で作る。
 *
 * 作り方（M07-06 と同じ。買取1件ごと）:
 * 1. 明細の商品: カード（レアリティを指定）→ カード商品CSV登録（日本語。英語の商品は続けて英語も）→ 商品規格に商品コード・買取価格 → （英語の商品は日本語の規格を削除）
 *    → 略称タグを指定する商品は、略称タグ登録で「実行の印つきの名前」の略称タグを新しく作って商品登録編集で選ぶ（共有の既存の略称タグは書き換えない）。
 *    基準価格・販売価格・買取価格は同じ値（買取価格が500円未満だとフロントで買取手続きへ進めないため、500円以上で作る）。
 * 2. 会員: フロントの会員登録＋管理画面の会員登録編集（本会員）。お名前の姓＝注文者名は実行の印つき。
 * 3. 申込: 会員でフロントにログインして買取を申込み（数量はシード表の個数）、完了画面の買取番号を控える。
 * 4. 買取情報編集の査定編集で、明細ごとの売却を選んで保存する（空欄＝未定のままにする明細は触らない）。そのあと買取状況を変えて保存する。
 * 5. 画面で指定できない部分（買取明細の買取価格・状態、商品規格の状態）は、実行の印つきの買取・商品にだけ DB へ書く（依頼者の承認 2026-11-10）。
 * 6. 在庫（BUY-012）は、在庫編集で入庫し、登録者とは別の管理者が在庫編集承認一覧で一括承認する。
 *
 * 読み替え（各シードの報告にも残る）:
 * - 買取依頼日「試験実施日」は画面から決められない（申込んだ日になる）。ケースは買取依頼日を確かめない。
 * - フロントの買取カートは状態NMの規格だけを入れられる（アプリの作り）。状態SPの明細（BUY-002）は、NMで申込んだあと、
 *   商品規格の基準価格・買取価格を画面で登録し、商品規格の状態と買取明細の状態・買取価格をDBで SP・100 にして作る。
 *   （アプリのCSVは、買取明細の状態と同じ状態の商品規格の行だけを出すため、規格も SP にそろえる）
 * - 買取番号 7077111 の買取情報が無いこと（BUY-011）は、検索して0件を確かめる（行があれば止める。削除しない）。
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
import { 入庫して承認する, 規格を登録する as 規格の価格を登録する } from "../pages/admin/f03_02_seed_ops";
import { BuyEditPage, BuyListPage } from "../pages/admin/m07_buy";
import { マスタを読む, 商品をカードにする } from "../pages/admin/m07_09_card";
import { ShortTagPage } from "../pages/admin/short_tag";
import { 売却を明細ごとに設定する } from "../pages/admin/m07_06";
import { 条件つきで申込む } from "../pages/front/m07_03_apply";
import { ログインする } from "../pages/front/m07_net_buy";
import { 会員のパスワード, 会員を用意する } from "./m07-03-b";
import { 商品規格の状態をDBで設定する, 選んで買取の価格と状態をDBで設定する, 選んで買取の査定価格をDBで設定する } from "./m07-db-prep";
import { 試験管理者を用意する } from "./m07-common";

export const M0707_ADMIN: Account = { loginId: "m0707_admin", password: "Passw0rd!M0707" };

defineSeed("S-M07-07-ADM", async ({ browser }) => {
  await 試験管理者を用意する(browser, M0707_ADMIN, "M07-07試験管理者");
});

// ---------------------------------------------------------------------------
// 共有の前提（言語・レアリティ・状態）を画面で読んで控える（書き換えない）
// ---------------------------------------------------------------------------

type 共通 = { 見出し: string[]; カテゴリ: string; 割引率: string; 購入グループ: string; カードセット: string; 日本語: string; 英語: string };
type 前提 = {
  言語: Record<"1" | "2", "JP" | "EN">;
  レアリティID: { M: string; C: string };
  common: 共通;
};
let 控え: 前提 | null = null;

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
    await byCode("状態", "SP");
    const m = await byCode("レアリティ", "M"), c = await byCode("レアリティ", "C");
    const lang = await readLanguageIds(page);
    const cardset = await ensureCardset(page, rc("M0707試験カードセット"), `M0707 Test Set ${RUN_MARK}`, `M7${RUN_MARK}`, issue);
    const common: 共通 = {
      見出し: await カード商品CSVの見出し(page), カテゴリ: (await 単体カード配下のカテゴリID(page)).id, 割引率: (await 登録済みの割引率ID(page)).id,
      購入グループ: await readExistingSellGroupName(page), カードセット: cardset, 日本語: lang.日本語, 英語: lang.英語,
    };
    return { jp, en, m, c, common };
  });
  // シード表の「言語ID 1・2」は、マスタの言語ID（日本語・英語）のことと読む。マスタが違うと期待結果の「1」「2」と食い違うので止める
  const 言語 = {} as 前提["言語"];
  for (const id of ["1", "2"] as const) {
    if (v.jp.ID === id) 言語[id] = "JP";
    else if (v.en.ID === id) 言語[id] = "EN";
    else throw new Error(`言語ID ${id} の言語が日本語・英語のどちらでもない（日本語=${v.jp.ID}・英語=${v.en.ID}）`);
  }
  控え = { 言語, レアリティID: { M: v.m.ID, C: v.c.ID }, common: v.common };
  issue(`シード作成時の問題: 言語・レアリティ・状態は共有のマスタなので書き換えず、いまの値を読んで使った（言語のID 日本語=${v.jp.ID}・英語=${v.en.ID}、レアリティのID M=${v.m.ID}・C=${v.c.ID}）`);
  return 控え;
}

// ---------------------------------------------------------------------------
// 部品
// ---------------------------------------------------------------------------

export const 注文者名 = (n: string): string => rc(`M0707-${n}-U`);
export const 品コード = (n: string, 枝 = ""): string => rc(`M0707-${n}-C${枝}`);
export const 品名 = (n: string, 枝 = ""): string => rc(`M0707-${n}-P${枝}`);
export const 略称タグ名 = (n: string): string => rc(`M0707-${n}-T`);

export type 明細 = {
  枝: string;
  数量: number;
  基準価格: number;
  売却: "する" | "しない" | "未定";
  言語ID?: "1" | "2";
  略称?: boolean;
  レア?: "M" | "C";
  /** 買取明細の買取価格（画面で指定できないのでDBで書く） */
  買取価格?: number;
  /** 買取明細・商品規格の状態をDBで SP にする（このとき商品規格の基準価格・買取価格を画面で登録する） */
  SP?: { 基準価格: string; 買取価格: string };
};
export type 買取の定義 = { ラベル: string; 明細: 明細[]; 状況: "入庫待ち" | "キャンセル済み" };

let cardSeq = 0;
const CARD_NO_BASE = String(Date.now()).slice(-9);
const 次のカード番号 = () => `${CARD_NO_BASE}${String(++cardSeq).padStart(2, "0")}`;

/** カード商品を1つ作る。商品IDを返す */
async function 商品を作る(page: Page, 前: 前提, seedId: string, n: string, d: 明細): Promise<string> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const c = 前.common;
  const 言語 = 前.言語[d.言語ID ?? "1"];
  const name = 品名(n, d.枝);
  const code = 品コード(n, d.枝);
  const price = String(d.基準価格);
  const reg = await F0504カードを登録する(page, {
    カード名英: rc(`M0707 CARD ${n} ${d.枝 || "X"}`),
    詳細: [{ カードセットID: c.カードセット, カード番号: 次のカード番号(), レアリティID: 前.レアリティID[d.レア ?? "M"] }],
  }, `${seedId}: カード ${n}-${d.枝}`, issue);
  const row = (言語ID: string, 商品ID: string): Record<string, string> => ({
    "商品ID": 商品ID, "言語(ID)": 言語ID, "商品公開ステータス": "2", "支店の商品公開ステータス": "1",
    "商品名(日)": name, "商品名(英)": name, "サイズ": "1", "重量": "1", "商品カテゴリ(ID)": c.カテゴリ,
    "購入グループ名称": c.購入グループ, "割引率(ID)": c.割引率, "基準価格": price, "販売価格": price, "買取価格": price,
    "カード詳細(ID)": reg.カード詳細IDs[0],
  });
  await カード商品CSVを登録する(page, c.見出し, [row(c.日本語, "")], `m0707-${n}-${d.枝 || "x"}-jp-${RUN_MARK.toLowerCase()}.csv`, `${seedId}: カード商品CSV登録（日本語）`, issue);
  const productId = await 商品名で商品IDを読む(page, name);
  if (言語 === "EN") {
    await カード商品CSVを登録する(page, c.見出し, [row(c.英語, productId)], `m0707-${n}-${d.枝 || "x"}-en-${RUN_MARK.toLowerCase()}.csv`, `${seedId}: カード商品CSV登録（英語）`, issue);
  }
  if (d.略称) {
    const tag = 略称タグ名(n);
    const tp = new ShortTagPage(page);
    await tp.openNew();
    await tp.register({ 名称: tag, 並び順: "99999", アルファベット順: false }, `${seedId}: 略称タグ ${tag} の登録`);
    await 商品をカードにする(page, productId, { 商品名: name, 略称タグ: tag }, issue);
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

/** 買取を作る: 商品 → 会員 → 申込 → 売却 → 買取状況 → DBで整える → 在庫。買取番号を ラベル → 番号 で notes に残す */
async function 買取を作る(
  browser: Browser, seedId: string, n: string, 買取: 買取の定義[], notes: { set(k: string, v: string): void }, 在庫?: { 枝: string; 数: number },
): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const 前 = await 前提を読む(browser, seedId);
  const ids = new Map<string, string>();
  const 全明細 = new Map<string, 明細>();
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const b of 買取) for (const d of b.明細) if (!ids.has(d.枝)) { ids.set(d.枝, await 商品を作る(page, 前, seedId, n, d)); 全明細.set(d.枝, d); }
  });
  issue("シード作成時の問題: 買取依頼日は「試験実施日」だが、画面からは決められない（申込んだ日になる）。ケースは買取依頼日を確かめない。商品は基準価格＝販売価格＝買取価格のカード商品（フロントの買取に公開される）で作った");

  const 姓 = 注文者名(n);
  const メール = `${rc(`m0707-${n}`)}@example.test`.toLowerCase();
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
      const 設定 = b.明細.filter((d) => d.売却 !== "未定").map((d) => ({ 名前: 品名(n, d.枝), 売却: d.売却 === "する" ? "売却する" as const : "売却しない" as const }));
      if (設定.length) await 売却を明細ごとに設定する(page, num, 設定);
      const l = new BuyListPage(page);
      await l.open();
      await l.買取番号を入れる(String(Number(num)));
      await l.検索する();
      await l.編集画面を開く(num);
      await new BuyEditPage(page).買取状況を変えて保存する(b.状況);
    }
    // 画面で指定できない状態（SPの明細）に合わせ、商品規格の基準価格・買取価格を画面で登録する
    for (const d of 全明細.values()) {
      if (!d.SP) continue;
      const productId = ids.get(d.枝)!;
      const rows = await 商品規格一覧を読む(page, productId);
      const target = rows.find((r) => r.商品コード === 品コード(n, d.枝));
      if (!target) throw new Error(`商品コード ${品コード(n, d.枝)} の商品規格が商品規格一覧に無い`);
      await 規格の価格を登録する(page, productId, target.商品規格ID, { 基準価格: d.SP.基準価格, 買取価格: d.SP.買取価格 }, `${seedId}: ${n}-${d.枝} の規格の価格`, issue);
    }
  });
  // 画面で指定できない部分は、実行の印つきの買取・商品にだけ DB へ書く
  for (const b of 買取) {
    const num = 番号.get(b.ラベル)!;
    for (const d of b.明細) {
      if (d.SP) {
        商品規格の状態をDBで設定する(品コード(n, d.枝), "SP");
        選んで買取の価格と状態をDBで設定する(num, メール, 品コード(n, d.枝), d.買取価格 ?? d.基準価格, "SP");
      } else if (d.買取価格 !== undefined) {
        選んで買取の査定価格をDBで設定する(num, メール, 品コード(n, d.枝), d.買取価格);
      }
    }
  }
  if (在庫) await 入庫して承認する(browser, [{ 商品コード: 品コード(n, 在庫.枝), 数: 在庫.数 }], `${seedId}: 在庫`, issue);
  for (const [k, v] of 番号) notes.set(k, v);
}

const NEEDS = ["S-M07-07-ADM"];

function 作り方(n: string, 買取: 買取の定義[], 在庫?: { 枝: string; 数: number }): (ctx: { browser: Browser; seed: { シードID: string }; notes: { set(k: string, v: string): void } }) => Promise<void> {
  return async ({ browser, seed, notes }) => { await 買取を作る(browser, seed.シードID, n, 買取, notes, 在庫); };
}

const m = (枝: string, 数量: number, 基準価格: number, o: Partial<明細> = {}): 明細 => ({ 枝, 数量, 基準価格, 売却: "しない", ...o });
const 入庫待ち = "入庫待ち" as const;

defineSeed("S-M07-07-BUY-001", { needs: NEEDS }, 作り方("001", [{ ラベル: "〔買取番号-M0707-001〕", 状況: 入庫待ち, 明細: [m("", 2, 1200, { 言語ID: "2", 略称: true, レア: "M", 買取価格: 450 })] }]));
defineSeed("S-M07-07-BUY-002", { needs: NEEDS }, 作り方("002", [{ ラベル: "〔買取番号-M0707-002〕", 状況: 入庫待ち, 明細: [m("", 2, 500, { 言語ID: "1", 略称: true, レア: "C", 買取価格: 100, SP: { 基準価格: "300", 買取価格: "100" } })] }]));
defineSeed("S-M07-07-BUY-005", { needs: NEEDS }, 作り方("005", [
  { ラベル: "〔買取番号-M0707-005A〕", 状況: 入庫待ち, 明細: [m("1", 1, 1000)] },
  { ラベル: "〔買取番号-M0707-005B〕", 状況: 入庫待ち, 明細: [m("2", 1, 1000)] },
]));
defineSeed("S-M07-07-BUY-006", { needs: NEEDS }, 作り方("006", [
  { ラベル: "〔買取番号-M0707-006A〕", 状況: 入庫待ち, 明細: [m("1", 1, 1000)] },
  { ラベル: "〔買取番号-M0707-006B〕", 状況: "キャンセル済み", 明細: [m("2", 1, 1000)] },
]));
defineSeed("S-M07-07-BUY-007", { needs: NEEDS }, 作り方("007", [{
  ラベル: "〔買取番号-M0707-007〕", 状況: 入庫待ち,
  明細: [m("1", 1, 1000, { 売却: "しない" }), m("2", 1, 1000, { 売却: "する" }), m("3", 1, 1000, { 売却: "未定" })],
}]));
defineSeed("S-M07-07-BUY-009", { needs: NEEDS }, 作り方("009", [
  { ラベル: "〔買取番号-M0707-009A〕", 状況: 入庫待ち, 明細: [m("1", 1, 1000)] },
  { ラベル: "〔買取番号-M0707-009B〕", 状況: 入庫待ち, 明細: [m("2", 1, 1000)] },
]));
defineSeed("S-M07-07-BUY-010", { needs: NEEDS }, 作り方("010", [{ ラベル: "〔買取番号-M0707-010〕", 状況: 入庫待ち, 明細: [m("", 1, 1000)] }]));
defineSeed("S-M07-07-BUY-012", { needs: NEEDS }, 作り方("012", [{ ラベル: "〔買取番号-M0707-012〕", 状況: 入庫待ち, 明細: [m("", 2, 1200, { 言語ID: "2", 略称: true, レア: "M", 買取価格: 450 })] }], { 枝: "", 数: 10 }));
defineSeed("S-M07-07-BUY-014", { needs: NEEDS }, 作り方("014", [{ ラベル: "〔買取番号-M0707-014〕", 状況: 入庫待ち, 明細: [m("", 1, 1400, { 言語ID: "1", 略称: true, レア: "M", 買取価格: 420 })] }]));

// 011: 買取番号 7077111 の買取情報が無いこと（検索して0件を確かめる。あれば止める）
defineSeed("S-M07-07-BUY-011", { needs: NEEDS }, async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const l = new BuyListPage(page);
    await l.open();
    await l.買取番号を入れる("7077111");
    await l.検索する();
    const rows = await l.行();
    if (rows.length) throw new Error(`買取番号 7077111 の行が ${rows.length} 件ある。共有のデータは消さずに止める`);
  });
});
