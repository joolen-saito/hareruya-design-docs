/**
 * M07-11 買取商品履歴CSV出力 の画面シード。正本: cases/M07-11_seed_data.tsv
 *
 * 依頼者の方針: テストデータは画面から作り、決め打ちの値には実行の印を付ける。共有のマスタ・設定は書き換えない（いまの値を読んで使う）。
 * グッズ商品CSV登録は使わない（開発環境のカテゴリIDの不具合 ECCUBE_HARERUYA-3966）。商品はカード商品（カード登録 → カード商品CSV登録 → 商品規格）で作る。
 *
 * 作り方（買取ごと）:
 *  1) 査定担当者のメンバーを、メンバー管理の画面で登録する（名前は実行の印つき）。
 *  2) 買取に入れる商品を、カード商品として作る（基準価格＝販売価格。商品設定の買取価格は別に指定できる）。
 *  3) 会員をフロントの会員登録＋管理画面の会員登録編集で作り、会員IDを控える。その会員でフロントから商品を申し込む。
 *  4) 管理画面の買取情報編集で、「査定編集」で査定価格・数量・売却「する」を入れて保存し、買取状況を「査定内容承諾」→「振込完了」→「入庫済み」の順に保存する
 *     （売却する明細の数量で実在庫と実在庫履歴が作られる）。
 *  5) 画面で指定できない部分だけ、実行の印つきの行に限り DB で整える: 査定担当者、振込完了日、実在庫履歴の変更前・変更後の数量、実在庫の数量、
 *     画面で作れない買取状況。
 * 読み替え:
 *  - 買取番号・会員IDは画面が振るので、シード表の固定の値（10711002 など）の代わりに画面が振った値を控えて使う。
 *  - 商品コード・商品名・査定担当者の名称・姓は実行の印つき。
 *  - MASTER（言語・状態・レアリティ）は共有のマスタ。書き換えず、いまの値を画面で読む（無ければ止める）。
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
  F0504カードを登録する, カード商品CSVの見出し, カード商品CSVを登録する, 商品名で商品IDを読む, 商品規格一覧を読む,
  単体カード配下のカテゴリID, 登録済みの割引率ID, 規格IDを選ぶ, 商品規格を登録する,
} from "../pages/admin/f05_04_products";
import { 一覧から編集を開く } from "../pages/admin/m07_03_edit";
import { マスタを読む } from "../pages/admin/m07_09_card";
import { 条件つきで申込む } from "../pages/front/m07_03_apply";
import { ログインする } from "../pages/front/m07_net_buy";
import { 会員のパスワード, 会員を用意する } from "./m07-03-b";
import { 試験管理者を用意する } from "./m07-common";
import { 買取状況をDBで設定する, 状況の履歴をDBで入れ替える } from "./m07-db-prep";
import { 実在庫の数量を設定する, 査定担当者を設定する } from "../db/m07_10";
import { 実在庫履歴の前後を設定する } from "../db/m07_11";

export const M0711_ADMIN: Account = { loginId: "m0711_admin", password: "Passw0rd!M0711" };

defineSeed("S-M07-11-ADM", async ({ browser }) => {
  await 試験管理者を用意する(browser, M0711_ADMIN, "M07-11試験管理者");
});

// ---------------------------------------------------------------------------
// 共有の前提（MASTER）を画面で読んで控える（書き換えない）
// ---------------------------------------------------------------------------

type 前提 = {
  レアリティM: string;
  common: { 見出し: string[]; カテゴリ: string; 割引率: string; 購入グループ: string; カードセット: string; 日本語: string };
};
let 控え: 前提 | null = null;

async function 前提を読む(browser: Browser, seedId: string): Promise<前提> {
  if (控え) return 控え;
  const issue = (m: string) => reportSeedIssue(seedId, m);
  控え = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const byCode = async (種別: string, コード: string) => {
      const r = (await マスタを読む(page, 種別)).find((x) => x.コード === コード);
      if (!r) throw new Error(`MTGマスターデータ管理の${種別}に、コード ${コード} の行が無い（共有のマスタは書き換えない）`);
      return r;
    };
    await byCode("言語", "JP");
    await byCode("状態", "NM");
    const m = await byCode("レアリティ", "M");
    const lang = await readLanguageIds(page);
    const cardset = await ensureCardset(page, rc("M0711試験カードセット"), `M0711 Test Set ${RUN_MARK}`, `M11${RUN_MARK}`, issue);
    return {
      レアリティM: m.ID,
      common: {
        見出し: await カード商品CSVの見出し(page), カテゴリ: (await 単体カード配下のカテゴリID(page)).id, 割引率: (await 登録済みの割引率ID(page)).id,
        購入グループ: await readExistingSellGroupName(page), カードセット: cardset, 日本語: lang.日本語,
      },
    };
  });
  issue("シード作成時の問題: MASTER（言語・状態・レアリティ）は共有のマスタなので書き換えず、いまの値を読んで使った。カードセットは実行の印つきの名前で新しく登録した");
  return 控え;
}

// ---------------------------------------------------------------------------
// 部品
// ---------------------------------------------------------------------------

export const 品コード = (n: string, 枝: string): string => rc(`M0711-${n}-${枝}`);
export const 品名 = (n: string, 末尾: string): string => rc(`M0711-${n}-商品${末尾}`);
export const 担当名 = (n: string): string => rc(`M0711-${n}-担当`);
export const 会員の呼び名 = (n: string): string => `〔会員ID-M0711-${n}〕`;
export const 買取番号の呼び名 = (n: string, 末尾 = ""): string => `〔買取番号-M0711-${n}${末尾}〕`;

type 明細 = { 枝: string; 名末尾: string; 数量: number; 査定価格: number; 基準価格: number; 設定の買取価格: number };
type 買取 = { 末尾: string; 明細: 明細[] };
type 作り方 = {
  買取: 買取[]; 振込完了日: string;
  /** 実在庫履歴の 変更前・変更後 */
  履歴: [number, number];
  /** 実在庫の数量を直接設定する（1商品目） */
  実在庫の数量?: number;
};

let cardSeq = 0;
const CARD_NO_BASE = String(Date.now()).slice(-9);
const 次のカード番号 = () => `${CARD_NO_BASE}${String(++cardSeq).padStart(3, "0")}`;

/** カード商品を1つ作る（基準価格＝販売価格）。商品IDを返す */
async function 商品を作る(page: Page, 前: 前提, seedId: string, n: string, d: 明細): Promise<string> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const c = 前.common;
  const name = 品名(n, d.名末尾);
  const code = 品コード(n, d.枝);
  const reg = await F0504カードを登録する(page, {
    カード名英: rc(`M0711 CARD ${n} ${d.枝}`),
    詳細: [{ カードセットID: c.カードセット, カード番号: 次のカード番号(), レアリティID: 前.レアリティM }],
  }, `${seedId}: カード ${n}-${d.枝}`, issue);
  const row: Record<string, string> = {
    "商品ID": "", "言語(ID)": c.日本語, "商品公開ステータス": "2", "支店の商品公開ステータス": "1",
    "商品名(日)": name, "商品名(英)": name, "サイズ": "1", "重量": "1", "商品カテゴリ(ID)": c.カテゴリ,
    "購入グループ名称": c.購入グループ, "割引率(ID)": c.割引率, "基準価格": String(d.基準価格), "販売価格": String(d.基準価格),
    "買取価格": String(d.設定の買取価格), "カード詳細(ID)": reg.カード詳細IDs[0],
  };
  await カード商品CSVを登録する(page, c.見出し, [row], `m0711-${n}-${d.枝}-${RUN_MARK.toLowerCase()}.csv`, `${seedId}: カード商品CSV登録`, issue);
  const productId = await 商品名で商品IDを読む(page, name);
  const rows = await 商品規格一覧を読む(page, productId);
  const target = 規格IDを選ぶ(rows, "JP", "NM");
  await 商品規格を登録する(page, productId, target, { 商品コード: code, 買取価格: String(d.設定の買取価格) }, `${seedId}: ${n}-${d.枝} の規格`, issue);
  return productId;
}

const NEEDS = { needs: ["S-M07-11-ADM"] };

function 作る(n: string, o: 作り方): (ctx: { browser: Browser; seed: { シードID: string }; notes: { set(k: string, v: string): void } }) => Promise<void> {
  return async ({ browser, seed, notes }) => {
    const seedId = seed.シードID;
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const 前 = await 前提を読む(browser, seedId);
    const 全明細 = o.買取.flatMap((b) => b.明細);
    // 1) 査定担当者
    const 担当ログインID = `m0711_t${n}_${RUN_MARK.toLowerCase()}`;
    await 試験管理者を用意する(browser, { loginId: 担当ログインID, password: "Passw0rd!M0711T" }, 担当名(n));
    // 2) 商品
    const ids = new Map<string, string>();
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      for (const m of 全明細) ids.set(m.枝, await 商品を作る(page, 前, seedId, n, m));
    });
    issue(`シード作成時の問題: 商品は基準価格＝販売価格のカード商品（フロントの買取に公開される）で作った。商品コード・商品名は実行の印つき（${全明細.map((m) => `${品コード(n, m.枝)}（基準${m.基準価格}・商品設定の買取価格${m.設定の買取価格}）`).join(" / ")}）`);
    // 3) 会員と申込
    const メール = `${rc(`m0711-${n}`)}@example.test`.toLowerCase();
    const 会員ID = await 会員を用意する(browser, seedId, { 姓: rc(`M0711-${n}姓`), 名: `M0711-${n}名`, セイ: "テストセイ", メイ: "テストメイ", メール, 電話: ["090", "1234", "5678"] });
    notes.set(会員の呼び名(n), 会員ID);
    const 番号: string[] = [];
    const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    try {
      await hideDebugToolbar(ctx);
      const fp = await ctx.newPage();
      fp.setDefaultTimeout(60_000);
      await ログインする(fp, { メール, パスワード: 会員のパスワード });
      for (const b of o.買取) {
        番号.push(await 条件つきで申込む(fp, b.明細.map((m) => ({ 商品ID: ids.get(m.枝)!, 数量: String(m.数量) })), { 承諾方法: "査定結果を確認してから承諾する", 登録番号: null, 口座名義: "シケンシード" }));
      }
    } finally { await ctx.close(); }
    // 4) 管理画面の操作
    for (let i = 0; i < o.買取.length; i++) {
      const b = o.買取[i];
      const 画面で出来なかった: string[] = [];
      await withAdminSession(browser, SETUP_ADMIN, async (page) => {
        page.setDefaultTimeout(60_000);
        let e = await 一覧から編集を開く(page, 番号[i]);
        await e.査定編集を始める();
        for (const m of b.明細) await e.明細を名前で入れる(品名(n, m.名末尾), { 査定価格: String(m.査定価格), 数量: String(m.数量), 売却: "する" });
        await e.査定確定する();
        await e.保存する(`買取番号 ${番号[i]} の査定（${b.明細.map((m) => 品コード(n, m.枝)).join("・")}）`);
        for (const st of ["査定内容承諾", "振込完了", "入庫済み"]) {
          e = await 一覧から編集を開く(page, 番号[i]);
          try { await e.買取状況を変えて保存する(st); } catch (err) {
            if (!/買取状況に「.*」が無い/.test((err as Error).message)) throw err;
            画面で出来なかった.push(st);
            break;
          }
        }
      });
      if (画面で出来なかった.length) issue(`買取番号 ${番号[i]}: 買取状況の選択肢に ${画面で出来なかった.join("・")} が無く、画面の保存で進められなかったので、DBで買取状況を「入庫済み」にした`);
      // 5) DB: 画面で指定できない部分（印はメールアドレス）
      if (画面で出来なかった.length) 買取状況をDBで設定する(番号[i], メール, "入庫済み");
      査定担当者を設定する(番号[i], メール, 担当ログインID);
      状況の履歴をDBで入れ替える(番号[i], メール, "振込完了", [`${o.振込完了日} 00:00:00+09`]);
      for (const m of b.明細) 実在庫履歴の前後を設定する(番号[i], メール, 品コード(n, m.枝), o.履歴[0], o.履歴[1]);
      if (o.実在庫の数量 !== undefined) 実在庫の数量を設定する(番号[i], メール, 品コード(n, b.明細[0].枝), o.実在庫の数量);
      notes.set(買取番号の呼び名(n, o.買取.length > 1 ? b.末尾 : ""), 番号[i]);
    }
    issue(`シード作成時の問題: 買取番号・会員IDは画面が振るので、シード表の固定の値の代わりに画面が振った値を控えて使った。会員はフロントの会員登録＋管理画面の会員登録編集（本会員）で作った（メールアドレスと姓は実行の印つき）。`
      + `査定担当者（メンバーを画面で登録。名称は実行の印つき）・振込完了日（${o.振込完了日}）・実在庫履歴の変更前${o.履歴[0]}・変更後${o.履歴[1]}${o.実在庫の数量 !== undefined ? `・実在庫の数量${o.実在庫の数量}` : ""}は画面で指定できないので、実行の印つきの行に限りDBで設定した`);
  };
}

const 既定 = { 数量: 1, 査定価格: 1500, 基準価格: 4200, 設定の買取価格: 1000 };
const 一件 = (o: Partial<明細> = {}): 買取[] => [{ 末尾: "", 明細: [{ 枝: "P", 名末尾: "", ...既定, ...o }] }];
const 日 = "2026-08-03";

defineSeed("S-M07-11-HIST-002", NEEDS, 作る("002", { 買取: 一件(), 振込完了日: 日, 履歴: [10, 15] }));
defineSeed("S-M07-11-HIST-003", NEEDS, 作る("003", { 買取: 一件({ 基準価格: 4300 }), 振込完了日: 日, 履歴: [10, 15] }));
defineSeed("S-M07-11-HIST-004", NEEDS, 作る("004", { 買取: 一件({ 査定価格: 1650 }), 振込完了日: 日, 履歴: [10, 15] }));
defineSeed("S-M07-11-HIST-005", NEEDS, 作る("005", {
  買取: [{ 末尾: "", 明細: [
    { 枝: "P", 名末尾: "", ...既定, 数量: 2 }, { 枝: "Q", 名末尾: "Q", ...既定, 数量: 4 }, { 枝: "R", 名末尾: "R", ...既定, 数量: 1 },
  ] }],
  振込完了日: 日, 履歴: [10, 15],
}));
defineSeed("S-M07-11-HIST-008", NEEDS, 作る("008", { 買取: 一件(), 振込完了日: "2026-08-04", 履歴: [10, 15] }));
// 009: 同じ会員の買取11件（商品ごとに1件）
defineSeed("S-M07-11-HIST-009", NEEDS, 作る("009", {
  買取: Array.from({ length: 11 }, (_, i) => { const x = String(i + 1).padStart(2, "0"); return { 末尾: x, 明細: [{ 枝: `P${x}`, 名末尾: x, ...既定 }] }; }),
  振込完了日: 日, 履歴: [10, 15],
}));
// 010: 同じ会員の買取5件（商品ごとに1件）
defineSeed("S-M07-11-HIST-010", NEEDS, 作る("010", {
  買取: Array.from({ length: 5 }, (_, i) => ({ 末尾: String(i + 1), 明細: [{ 枝: `P${i + 1}`, 名末尾: String(i + 1), ...既定 }] })),
  振込完了日: 日, 履歴: [10, 15],
}));
// 013: 実在庫履歴1件・買取明細1件・商品の在庫数量（実在庫の数量）15
defineSeed("S-M07-11-HIST-013", NEEDS, 作る("013", { 買取: 一件(), 振込完了日: 日, 履歴: [10, 15], 実在庫の数量: 15 }));
// 014: 商品設定の買取価格1800・実際の買取単価1500
defineSeed("S-M07-11-HIST-014", NEEDS, 作る("014", { 買取: 一件({ 設定の買取価格: 1800, 査定価格: 1500 }), 振込完了日: 日, 履歴: [10, 15] }));
