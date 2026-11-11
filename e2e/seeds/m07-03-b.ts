/**
 * M07-03 買取情報編集 の画面シード（管理画面の操作を確かめるケースが使うもの）。正本: cases/M07-03_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10）: テストデータは「既存データ または 画面から作ったデータ」に読み替えてよい。DB へは書き込まない。
 * 読み替えたことは、シードの報告（reportSeedIssue）とケースの注記に「シード作成時の問題」として残す。
 *
 * 作り方（シード表の手順を画面で行う。読み替えた点）:
 * - 会員: シード表は「管理画面の会員登録編集（新規）」だが、管理画面に会員の新規登録の画面が無い（会員登録編集は既存の会員の編集だけ）。
 *   フロントの会員登録で作り（本登録のメールは読まない）、管理画面の会員登録編集で会員ステータス「本会員」・職業「会社員」・本人確認ステータスを登録する。
 *   メールアドレスは実行の印つき（正本の前半＋印）。お名前・フリガナ・住所・電話はシード表の値。
 * - 買取に使う商品: シード表は「買取できる商品ならどれでもよい。無ければグッズ商品CSV登録で作る」。毎回グッズ商品CSV登録で作る（商品コード・商品名は印つき）。
 *   買取価格はシード表の100では買取商品詳細に「カートに追加」が出ない（下限500円。M07-09 で確かめた）ので500にする。
 * - 買取番号: 申込完了画面の買取番号を控え、管理画面の買取検索一覧をその番号で検索して、行の買取依頼者氏名がシード表の氏名であることを確かめる
 *   （シード表は一覧の買取依頼者氏名の行から控える。同じ氏名の行がほかの実行で増えるので、番号で引く）。
 * - 管理画面の操作は全権限の管理者（SETUP_ADMIN）で行う。ケースの管理者 m0703_admin とは別の人が最終更新者になる。
 * DBでの準備が残るシード（まとめて買取・個別入力商品・日時の指定・本人確認情報の削除 など）は、ここでは作らない（ケースを実装していない）。
 */
import { Browser, expect } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { rc, RUN_MARK } from "../lib/run_marker";
import { Account, hideDebugToolbar, withAdminSession } from "../lib/session";
import { resultCustomerId, searchCustomer } from "../pages/admin/f06_customer";
import { findProductsByCode } from "../pages/admin/m03_13_product";
import { registerStockChangeCsv } from "../pages/admin/m04_19_stock_change_csv";
import { 本店の店名 } from "../pages/admin/m05_admin_member";
import { BuyListPage } from "../pages/admin/m07_buy";
import { カード商品にする } from "../pages/admin/m07_03_card";
import { 一覧から編集を開く } from "../pages/admin/m07_03_edit";
import { サプライ品を登録する } from "../pages/admin/m07_supply";
import { M08CustomerEditPage } from "../pages/admin/m08_customer_edit";
import { loggedInMemberName, StockApprovalListPage } from "../pages/admin/stock_edit";
import { 会員登録する, 条件つきで申込む } from "../pages/front/m07_03_apply";
import { ログインする } from "../pages/front/m07_net_buy";
import { 試験管理者を用意する } from "./m07-common";

export const M0703B_ADMIN: Account = { loginId: "m0703_admin", password: "Passw0rd!M0703" };
export const M0703B_ADMIN_NAME = "M07-03試験管理者";
export const 会員のパスワード = "Passw0rd-M0703Mem";

/** 正本の商品コード（印なし）から、作った商品の商品コード・商品名（印つき） */
export const 品 = (正本のコード: string): string => rc(正本のコード);

/** 作った買取の会員（ケースが使う。会員IDは控えた番号にもある） */
export const 買取の会員 = new Map<string, { メール: string; 会員ID: string }>();

// ---- 共有のシード ----

defineSeed("S-M07-03-ADM", async ({ browser }) => {
  await 試験管理者を用意する(browser, M0703B_ADMIN, M0703B_ADMIN_NAME);
});

/** 買取検索一覧の「買取状況」の選択肢に、名前が揃っていることを確かめる（既存のマスタを使う） */
async function 買取状況の選択肢を確かめる(browser: Browser, 名前: string[]): Promise<string[]> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const l = new BuyListPage(page);
    await l.open();
    const have = (await page.locator("#admin_purchase_list_buy_order_status option").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
    const miss = 名前.filter((n) => !have.includes(n));
    if (miss.length) throw new Error(`買取状況の選択肢に ${miss.join("・")} が無い（ある選択肢: ${have.join("、")}）`);
    return have;
  });
}

defineSeed("S-M07-03-REF", async ({ browser, seed }) => {
  await 買取状況の選択肢を確かめる(browser, ["商品到着", "査定内容承諾", "振込依頼済み", "振込完了", "振込失敗", "未登録在庫あり", "入庫待ち", "入庫済み"]);
  reportSeedIssue(seed.シードID, "シード作成時の問題: 参照値はシード表では「DBシードで登録する」。DBへは書き込まず、開発環境の既存のマスタを使った（買取状況8件は買取検索一覧の選択肢にあることを画面で確かめた。都道府県・職業・身分証明書・口座種別・商品種別・店舗・在庫場所は、使う画面の選択肢で確かめる）");
});

defineSeed("S-M07-03-GF-STATUS", async ({ browser, seed }) => {
  await 買取状況の選択肢を確かめる(browser, ["MTGBuyer査定完了", "査定内容連絡済み", "簡易書留送付済み", "キャンセル済み"]);
  reportSeedIssue(seed.シードID, "シード作成時の問題: シード表では「DBシードで登録する」。DBへは書き込まず、既存のマスタに4状況があることを買取検索一覧の選択肢で確かめた");
});

defineSeed("S-M07-03-CONFIG", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "シード作成時の問題: 本人確認必要額は管理画面の基本設定に項目が無く、アプリの設定ファイルの値（既定 10000）を使う。ネット買取の入庫先はモールの本店（店舗ID 1）で、画面の設定は無い。共有の設定は書き換えず、既存の値を使った（画面からは値を確かめられない）");
});

defineSeed("S-M07-03-MAIL", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "シード作成時の問題: 試験環境のメール配送設定は画面に無い。既存の環境の設定を使い、変えていない（このシードを使う実装済みのケースはメールの受信を確かめない）");
});

defineSeed("S-M07-03-PRODUCTS", async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const sup = 品("ADD-SUP-001"), card = 品("ADD-CARD-001");
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await サプライ品を登録する(page, [
      { コード: sup, 名前: sup, 基準価格: "1000", 買取価格: "100" },
      { コード: card, 名前: card, 基準価格: "1000", 買取価格: "100" },
    ], issue);
    const id = await 商品IDを画面で引く(page, card);
    await カード商品にする(page, id, card, issue);
  });
  issue("商品コード・商品名は実行の印つきで作った");
});

defineSeed("S-M07-03-SEARCH-PAGING", async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const items = Array.from({ length: 11 }, (_, i) => 品(`PAGE-SUP-${String(i + 1).padStart(3, "0")}`));
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await サプライ品を登録する(page, items.map((c) => ({ コード: c, 名前: c, 基準価格: "1000", 買取価格: "100" })), issue);
  });
  issue("商品コード・商品名は実行の印つきで作った（検索語「PAGE-SUP」は前の実行の商品にも当たるので、検索結果は11件より多いことがある）");
});

// ---- 作り方の部品 ----

/** 商品マスターで商品コードを検索し、商品IDを返す（1件でなければ止める） */
export async function 商品IDを画面で引く(page: import("@playwright/test").Page, 商品コード: string): Promise<string> {
  const rows = await findProductsByCode(page, 商品コード, ["公開"]);
  if (rows.length !== 1) throw new Error(`商品マスターに商品コード ${商品コード} の公開の商品が ${rows.length} 件（1件のはず）`);
  return rows[0].商品ID;
}

export type 明細の入力 = { コード: string; 査定価格?: string; 数量?: string; 売却?: "する" | "しない" | "未定" };
export type 保存の内容 = {
  査定?: 明細の入力[]; 送料?: string; メモ?: string; 身分証明書?: string; 振込依頼可能?: boolean; 状況?: string;
};
export type 買取の作り方 = {
  /** シード表の番号（買取NNN の NNN） */
  n: string;
  名?: string; メイ?: string; 名義?: string;
  /** メールアドレスの前半（正本の値。印を付ける） */
  メール?: string;
  電話?: [string, string, string]; 住所2?: string; 住所3?: string; 口座番号?: string;
  本人確認?: string;
  承諾方法?: "査定結果を確認してから承諾する" | "自動承諾";
  登録番号?: string;
  /** 申込む商品（正本の商品コード）と数量。省略は M0703-<n>-FB を1点 */
  品?: { コード: string; 数量: string; カード?: boolean }[];
  /** 本店・EC-CUBE に在庫変更CSV登録で入庫する商品（在庫増減数10・仕入単価1000） */
  入庫?: string[]; /** 入庫の仕入単価（既定 1000） */ 仕入単価?: string;
  /** 管理画面の買取情報編集で、順に「保存」まで行う内容 */
  保存?: 保存の内容[];
  /** シード表から一意に決まらず、こう決めたこと（シードの報告に出す） */
  読み替え?: string[];
  /** 申込みには使わないが、シード表が作る商品（正本の商品コード。まとめて買取の明細・実在庫の行に使う。グッズ商品CSV登録で印つきで作る） */
  別の商品?: string[];
  /** 同じ会員で先に行う申込み（前回の買取）。その買取番号は呼び名で控える */
  前の買取?: { 品: { コード: string; 数量: string; カード?: boolean }[]; 呼び名: string };
  /** 買取を作ったあとにシード表が定める、ほかの準備（DBで整える部分など） */
  後で?: (browser: Browser, issue: (m: string) => void, 作った: 作った買取) => Promise<void>;
};

export type 作った買取 = { 番号: string; メール: string; 会員ID: string; 前の番号?: string };
/** シードIDごとの、作った買取（呼び名を控えないシード＝正本が買取IDを決め打ちにしているもの が使う） */
export const 作った買取一覧 = new Map<string, 作った買取>();

let 本店: string | null = null;

export async function 在庫を入れる(browser: Browser, seedId: string, コード: string[], 仕入単価 = "1000"): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  if (!本店) 本店 = await 本店の店名(browser);
  const shop = 本店;
  const 登録者 = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await registerStockChangeCsv(page, {
      店舗: shop, 在庫区分: "EC-CUBE", 在庫変動区分: "入庫/その他", 在庫変動理由: "M07-03試験準備", 承認者: M0703B_ADMIN_NAME,
      行: コード.map((c) => ({ 商品コード: c, 在庫増減数: "10", 仕入単価 })),
      ファイル名: `${seedId.toLowerCase()}-${RUN_MARK.toLowerCase()}-${Date.now()}.csv`,
    }, `${seedId} の在庫変更CSV登録`, issue);
    return loggedInMemberName(page);
  });
  const total = String(10 * コード.length);
  await withAdminSession(browser, M0703B_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const list = new StockApprovalListPage(page);
    await list.open(shop);
    const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === 登録者 && r.quantity === total && r.changeType.endsWith("入庫/その他"));
    if (rows.length === 0) throw new Error(`${seedId}: 在庫編集承認一覧に、${登録者} の在庫変更CSV登録（合計 ${total}）の未承認の行が無い`);
    const newest = rows.sort((a, b) => Number(b.id) - Number(a.id))[0];
    if (rows.length > 1) issue(`在庫編集承認一覧に同じ条件の未承認の行が ${rows.length} 件あり、いちばん新しい行を承認した`);
    await list.approve([newest.id], `${seedId} の在庫変更CSV登録の承認`, issue);
  });
}

/** 会員を作る（フロントの会員登録 → 管理画面の会員登録編集で本会員・職業・本人確認ステータス）。会員IDを返す */
export async function 会員を用意する(browser: Browser, seedId: string, v: { 姓: string; 名: string; セイ: string; メイ: string; メール: string; 電話: [string, string, string]; 住所2?: string; 住所3?: string; 本人確認?: string }): Promise<string> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  let 状態: "仮会員" | "本会員";
  try {
    await hideDebugToolbar(ctx);
    const page = await ctx.newPage();
    page.setDefaultTimeout(60_000);
    状態 = await 会員登録する(page, {
      姓: v.姓, 名: v.名, セイ: v.セイ, メイ: v.メイ, メール: v.メール, パスワード: 会員のパスワード,
      郵便番号: ["101", "0001"], 都道府県: "東京都", 住所1: "千代田区", 住所2: v.住所2 ?? "神田", 電話: v.電話, 生年月日: ["1990", "1", "1"], 住所3: v.住所3,
    });
  } finally { await ctx.close(); }
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await searchCustomer(page, v.メール);
    const id = await resultCustomerId(page, v.メール);
    if (!id) throw new Error(`会員 ${v.メール} が会員一覧に1件で出ない`);
    const edit = new M08CustomerEditPage(page);
    expect(await edit.open(id), `会員ID ${id} の会員登録編集画面の応答`).toBe(200);
    if (状態 === "仮会員") issue(`会員 ${v.メール} はフロントの登録で仮会員になった。本登録のメールは読まず、管理画面の会員登録編集で「本会員」にした`);
    await edit.選ぶ("status", "本会員");
    await edit.選ぶ("job", "会社員");
    if (v.本人確認) await edit.ラジオを選ぶ("Player][IdentityConfirmStatus", v.本人確認);
    await edit.登録する("続行");
    const ng = await edit.エラー文();
    if (ng.length) throw new Error(`会員 ${v.メール} の会員登録編集で登録できない: ${ng.join(" / ")}`);
    if (!(await edit.成功メッセージ())) throw new Error(`会員 ${v.メール} の会員登録編集で成功のメッセージが出ない`);
    return id;
  });
}

/** 買取情報編集で、査定・依頼者情報・振込状況・買取状況を入れて「保存」する */
export async function 保存まで行う(browser: Browser, 番号: string, 内容: 保存の内容): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const e = await 一覧から編集を開く(page, 番号);
    if (内容.査定 || 内容.送料 !== undefined || 内容.メモ !== undefined) {
      await e.査定編集を始める();
      for (const m of 内容.査定 ?? []) await e.明細を名前で入れる(品(m.コード), { 査定価格: m.査定価格, 数量: m.数量, 売却: m.売却 });
      await e.送料とメモを入れる({ 送料: 内容.送料, メモ: 内容.メモ });
      await e.査定確定する();
    }
    if (内容.身分証明書) {
      await e.依頼者情報の編集を押す();
      await e.依頼者の選択欄を選ぶ("Identification", 内容.身分証明書);
      await e.依頼者情報の編集を押す();
    }
    if (内容.振込依頼可能 !== undefined) await e.振込状況を設定する({ 振込依頼可能: 内容.振込依頼可能 });
    if (内容.状況) await e.買取状況を選ぶ(内容.状況);
    await e.保存する(`買取番号 ${番号} の保存（${JSON.stringify(内容)}）`);
  });
}

/** 買取を1件作るシード（会員 → 商品 → 申込 → 番号を控える → 管理画面の保存）。〔会員番号-…〕〔買取番号-…〕をシード表の呼び名で控える */
export function defineBuySeed(seedId: string, v: 買取の作り方, needs: string[] = []): void {
  defineSeed(seedId, { needs: ["S-M07-03-ADM", ...needs] }, async ({ browser, notes, seed }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const 姓 = "晴屋", 名 = v.名 ?? `買取${v.n}`, セイ = "ハレヤ", メイ = v.メイ ?? "カイトリ";
    const メール = `${rc(v.メール ?? `buyer-m0703-${v.n}`)}@example.test`.toLowerCase();
    const items = v.品 ?? [{ コード: `M0703-${v.n}-FB`, 数量: "1" }];
    const 前 = v.前の買取?.品 ?? [];
    const 申込む品 = [...items, ...前.filter((p) => !items.some((i) => i.コード === p.コード))];
    // 商品（グッズ商品CSV登録）→ カードにするものはカード指定
    const ids = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      await サプライ品を登録する(page, [...申込む品.map((p) => p.コード), ...(v.別の商品 ?? [])].map((c) => ({ コード: 品(c), 名前: 品(c), 基準価格: "1000", 買取価格: "500" })), issue);
      const out: string[] = [];
      for (const p of 申込む品) {
        const id = await 商品IDを画面で引く(page, 品(p.コード));
        if (p.カード) await カード商品にする(page, id, 品(p.コード), issue);
        out.push(id);
      }
      return out;
    });
    issue("シード作成時の問題: 買取に使う商品は毎回グッズ商品CSV登録で作った（商品コード・商品名は実行の印つき）。買取価格はシード表の100では買取商品詳細に「カートに追加」が出ない（下限500円）ので500にした");
    if (v.入庫?.length) await 在庫を入れる(browser, seedId, v.入庫.map(品), v.仕入単価);
    const 会員ID = await 会員を用意する(browser, seedId, { 姓, 名, セイ, メイ, メール, 電話: v.電話 ?? ["090", "1234", "5678"], 住所2: v.住所2, 住所3: v.住所3, 本人確認: v.本人確認 });
    issue(`シード作成時の問題: 会員は管理画面に新規登録の画面が無いので、フロントの会員登録＋管理画面の会員登録編集（本会員・職業・本人確認ステータス）で作った。メールアドレスは実行の印つき（${メール}）`);
    買取の会員.set(seedId, { メール, 会員ID });
    // 申込
    const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    let 番号 = "";
    let 前の番号: string | undefined;
    const 申込みの条件 = {
      承諾方法: v.承諾方法 ?? "査定結果を確認してから承諾する" as const, 登録番号: v.登録番号 ?? null,
      口座名義: v.名義 ?? `ハレヤ${メイ}`, 口座番号: v.口座番号,
    };
    const idOf = (コード: string) => ids[申込む品.findIndex((p) => p.コード === コード)];
    try {
      await hideDebugToolbar(ctx);
      const fp = await ctx.newPage();
      fp.setDefaultTimeout(60_000);
      await ログインする(fp, { メール, パスワード: 会員のパスワード });
      if (前.length) 前の番号 = await 条件つきで申込む(fp, 前.map((p) => ({ 商品ID: idOf(p.コード), 数量: p.数量 })), 申込みの条件);
      番号 = await 条件つきで申込む(fp, items.map((p) => ({ 商品ID: idOf(p.コード), 数量: p.数量 })), {
        承諾方法: v.承諾方法 ?? "査定結果を確認してから承諾する", 登録番号: v.登録番号 ?? null,
        口座名義: v.名義 ?? `ハレヤ${メイ}`, 口座番号: v.口座番号,
      });
    } finally { await ctx.close(); }
    // 買取検索一覧で番号の行の氏名を確かめる
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const l = new BuyListPage(page);
      await l.open();
      await l.買取番号を入れる(番号);
      await l.検索する();
      const rows = (await l.行()).filter((r) => r.番号 === 番号);
      if (rows.length !== 1) throw new Error(`買取検索一覧に買取番号 ${番号} の行が無い`);
      if (!rows[0].氏名.replace(/\s/g, "").includes(`${姓}${名}`)) throw new Error(`買取番号 ${番号} の行の買取依頼者氏名が「${rows[0].氏名}」（${姓} ${名} のはず）`);
    });
    for (const s of v.保存 ?? []) await 保存まで行う(browser, 番号, s);
    const 作った: 作った買取 = { 番号, メール, 会員ID, 前の番号 };
    作った買取一覧.set(seedId, 作った);
    if (v.後で) await v.後で(browser, issue, 作った);
    for (const m of v.読み替え ?? []) issue(`シード作成時の問題: ${m}`);
    const text = seed["状態・属性"] + seed.投入方法;
    for (const l of new Set(text.match(/〔買取番号-M0703-[^〕]+〕/g) ?? [])) notes.set(l, l === v.前の買取?.呼び名 && 前の番号 ? 前の番号 : 番号);
    for (const l of new Set(text.match(/〔会員番号-M0703-[^〕]+〕/g) ?? [])) notes.set(l, 会員ID);
  });
}

// ---- ケース専用のシード ----

const 承諾 = { 状況: "査定内容承諾" } as const;
const 身分証 = "自動車運転免許証";
const 査定 = (コード: string, 査定価格: string, 数量: string, 売却?: "する" | "しない"): 明細の入力 => ({ コード, 査定価格, 数量, 売却 });

defineBuySeed("S-M07-03-CASE-001", { n: "001", 名: "太郎", メイ: "タロウ", 名義: "ハレヤタロウ", 本人確認: "オンライン本人確認済み", 登録番号: "T0000000000001", 保存: [{ 振込依頼可能: true, ...承諾 }] });
defineBuySeed("S-M07-03-CASE-002", { n: "002", 保存: [承諾] });
defineBuySeed("S-M07-03-CASE-004", { n: "004", 保存: [{ 状況: "査定中断" }], 読み替え: ["査定中断の履歴（変更日時2026-08-04 10:00）はDBで登録する定めだが、管理画面の買取状況を「査定中断」にして保存して作った（変更日時は保存した日時。ケースは日時の値を確かめない）"] });
defineBuySeed("S-M07-03-CASE-006", { n: "006", 保存: [{ 状況: "商品到着" }, 承諾] });
defineBuySeed("S-M07-03-CASE-007", { n: "007", 保存: [承諾] });
defineBuySeed("S-M07-03-CASE-008", { n: "008" });
defineBuySeed("S-M07-03-CASE-009", { n: "009", 保存: [承諾] });
defineBuySeed("S-M07-03-CASE-010", { n: "010", メール: "buyer-010" });
defineBuySeed("S-M07-03-CASE-011", {
  n: "011",
  // シード表: 買取検索一覧で買取番号999999を検索し、行があれば「削除」する（データを消す作り方。共有の環境では基盤がこのケースを流さない）
  後で: async (browser, issue) => {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const l = new BuyListPage(page);
      await l.open();
      await l.買取番号を入れる("999999");
      await l.検索する();
      if ((await l.行()).some((r) => r.番号 === "999999")) {
        await l.削除する("999999", "OK");
        issue("買取番号999999の買取があったので、買取検索一覧の「削除」で削除した");
      }
    });
  },
});
defineBuySeed("S-M07-03-CASE-014", { n: "014", 保存: [{ ...承諾, 送料: "300", メモ: "編集前メモ" }], 読み替え: ["まとめて買取の明細と個別入力商品はDBで登録する定めで、画面で作れないので作っていない（選んで買取だけの買取）"] });
defineBuySeed("S-M07-03-CASE-016", { n: "016", 保存: [{ ...承諾, 送料: "300", メモ: "編集前メモ" }], 読み替え: ["まとめて買取の明細と個別入力商品はDBで登録する定めで、画面で作れないので作っていない（選んで買取だけの買取）"] });
defineBuySeed("S-M07-03-CASE-019", { n: "019" });
defineBuySeed("S-M07-03-CASE-020", { n: "020" });
defineBuySeed("S-M07-03-CASE-021", { n: "021" });
defineBuySeed("S-M07-03-CASE-024", { n: "024", 住所3: "神田0-0-0", 保存: [{ ...承諾, 送料: "300", メモ: "編集前メモ" }], 読み替え: ["まとめて買取の明細と個別入力商品（売却未定）はDBで登録する定めで、画面で作れないので作っていない（選んで買取の売却未定の明細だけ）"] });
defineBuySeed("S-M07-03-CASE-025", { n: "025", 保存: [{ 状況: "商品到着" }, 承諾, { 身分証明書: 身分証, 状況: "振込依頼済み" }], 読み替え: ["申込み時の注文の履歴をDBで消す定めだが消していない（履歴は注文を含む4件）。ケースが確かめるのは振込失敗の履歴の件数"] });
defineBuySeed("S-M07-03-CASE-026", { n: "026", 保存: [承諾] });
defineBuySeed("S-M07-03-CASE-029", { n: "029", 住所3: "1-1-1", 登録番号: "T0000000000029", 保存: [{ 身分証明書: 身分証 }] });
defineBuySeed("S-M07-03-CASE-031", { n: "031", メール: "buyer7010-031", 電話: ["03", "1123", "4567"], 口座番号: "7654321" });
defineBuySeed("S-M07-03-CASE-033", { n: "033", 保存: [{ 身分証明書: 身分証 }] });
defineBuySeed("S-M07-03-CASE-034", { n: "034" });
defineBuySeed("S-M07-03-CASE-036", { n: "036", 登録番号: "T0000000000036" });
defineBuySeed("S-M07-03-CASE-039", { n: "039", 登録番号: "T0000000000039" });
defineBuySeed("S-M07-03-CASE-041", { n: "041", 保存: [承諾] });
defineBuySeed("S-M07-03-CASE-042", { n: "042", 保存: [承諾] });
defineBuySeed("S-M07-03-CASE-043", { n: "043", 保存: [{ ...承諾, 査定: [査定("M0703-043-FB", "8000", "1")] }] });
defineBuySeed("S-M07-03-CASE-044", { n: "044", 保存: [{ ...承諾, 査定: [査定("M0703-044-FB", "10000", "1")], 身分証明書: 身分証 }] });
defineBuySeed("S-M07-03-CASE-045", { n: "045", 保存: [{ ...承諾, 査定: [査定("M0703-045-FB", "9999", "1")], 身分証明書: 身分証 }] });
for (const n of ["051", "052", "053", "055"]) {
  const code = `SKU-STK-001-${n}`;
  defineBuySeed(`S-M07-03-CASE-${n}`, {
    n, 品: [{ コード: code, 数量: "2" }], 入庫: [code],
    保存: [{ 査定: [査定(code, "500", "2", "する")], ...承諾 }, { 状況: "入庫待ち" }],
    読み替え: [n === "055" ? "査定IDと最終更新者はDBで設定する定め。査定IDは設定していない（ケースは確かめない）。最終更新者は、シードの保存を全権限の管理者で行ったので試験管理者以外になっている" : "査定IDはDBで設定する定めで、設定していない（ケースは確かめない）"],
  });
}
defineBuySeed("S-M07-03-CASE-056", { n: "056", 保存: [{ 状況: "入庫済み" }] });
defineBuySeed("S-M07-03-CASE-058", { n: "058", 品: [{ コード: "M0703-058-FB", 数量: "2" }], 保存: [{ 査定: [査定("M0703-058-FB", "500", "2", "する")], ...承諾 }, { 状況: "入庫待ち" }] });
defineBuySeed("S-M07-03-CASE-061", { n: "061", 読み替え: ["まとめて買取と個別入力商品情報の売却未定の行はDBで登録する定めで、画面で作れないので作っていない（選んで買取の売却未定の明細だけ）"] });
defineBuySeed("S-M07-03-CASE-071", { n: "071" });
defineBuySeed("S-M07-03-CASE-072", { n: "072" });
for (const n of ["074", "075"]) {
  const code = `STOCK-EDIT-001-${n}`;
  defineBuySeed(`S-M07-03-CASE-${n}`, { n, 品: [{ コード: code, 数量: "2" }], 保存: [{ 査定: [査定(code, "500", "2", "する")], ...承諾 }, { 身分証明書: 身分証, 状況: "振込依頼済み" }] });
}
defineBuySeed("S-M07-03-CASE-076", {
  n: "076", 品: [{ コード: "STOCK-EDIT-001-076", 数量: "2" }, { コード: "M0703-076-FB", 数量: "1" }],
  保存: [{ 査定: [査定("STOCK-EDIT-001-076", "500", "2", "する"), 査定("M0703-076-FB", "300", "1", "する")], ...承諾 }, { 身分証明書: 身分証, 状況: "振込依頼済み" }],
});
defineBuySeed("S-M07-03-STOCKHIST-077", {
  n: "077", 品: [{ コード: "M0703-077-SKU", 数量: "2" }], 入庫: ["M0703-077-SKU"],
  保存: [{ 査定: [査定("M0703-077-SKU", "500", "2", "する")], ...承諾 }, { 状況: "入庫待ち" }],
  読み替え: ["査定ID（909507701）はDBで設定する定めで、設定していない（ケースは確かめない）"],
});
for (const n of ["081", "083"]) {
  const code = `M0703-${n}-SUP`;
  defineBuySeed(`S-M07-03-APPROVE${n === "081" ? "SEL" : "HIST"}-${n}`, { n, 承諾方法: "自動承諾", 品: [{ コード: code, 数量: "2" }], 保存: [{ 査定: [査定(code, "1000", "2", "する")], 状況: "MTGBuyer査定完了" }] });
}
defineBuySeed("S-M07-03-AUTOAPPROVE-084", { n: "084", 承諾方法: "自動承諾", 保存: [{ 状況: "MTGBuyer査定完了" }] });
defineBuySeed("S-M07-03-SUPPRICE-087", { n: "087", 品: [{ コード: "M0703-087-SUP", 数量: "1" }], 保存: [{ ...承諾, 査定: [査定("M0703-087-SUP", "1000", "1")] }] });
defineBuySeed("S-M07-03-SUPQTY-088", { n: "088", 品: [{ コード: "M0703-088-SUP", 数量: "1" }], 保存: [{ ...承諾, 査定: [査定("M0703-088-SUP", "1000", "1")] }] });
defineBuySeed("S-M07-03-INVOICERADIO-090", { n: "090", 登録番号: "T0950770000009", 保存: [承諾] });
const 実在庫の読み替え = (code: string) => `${code} の商品規格に紐づく実在庫情報（数量2・買取単価500・買取小計1000）はDBで登録する定め。画面では、${code} の査定価格500・数量2・売却「する」で査定内容承諾にして保存し、その保存で作られた実在庫情報（数量2・買取小計1000）にした。そのあとでシード表の査定価格・数量を入れて保存した`;
defineBuySeed("S-M07-03-NOSTOCKSYNC-091", { n: "091", 品: [{ コード: "M0703-091-SUP", 数量: "1" }], 保存: [{ 査定: [査定("M0703-091-SUP", "500", "2", "する")], ...承諾 }, { 査定: [査定("M0703-091-SUP", "1000", "1")] }], 読み替え: [実在庫の読み替え("M0703-091-SUP")] });
defineBuySeed("S-M07-03-MEMBERBTN-092", { n: "092" });
defineBuySeed("S-M07-03-ASSESSLOCK-093", { n: "093", 保存: [{ ...承諾, 送料: "300", メモ: "M0703-093-メモ" }] });
defineBuySeed("S-M07-03-REQUESTERLOCK-094", { n: "094", 住所3: "M0703-094-住所", 登録番号: "T0000000000094", 保存: [承諾] });
for (const n of ["095", "096"]) {
  defineBuySeed(`S-M07-03-${n === "095" ? "DELLINK" : "DELOK"}-${n}`, { n, 品: [{ コード: `M0703-${n}-SUP`, 数量: "1" }, { コード: `M0703-${n}-CARD`, 数量: "1", カード: true }], 保存: [承諾] });
}
for (const n of ["097", "098"]) {
  defineBuySeed(`S-M07-03-${n === "097" ? "DELCANCEL" : "DELMSG"}-${n}`, { n, 品: [{ コード: `M0703-${n}-SUP`, 数量: "1" }], 保存: [承諾] });
}
for (const [id, n] of [["STOCKEDITOK", "101"], ["STOCKEDITCANCEL", "102"], ["STOCKEDITDISCARD", "124"]] as const) {
  const code = `M0703-${n}-STK`;
  defineBuySeed(`S-M07-03-${id}-${n}`, { n, 品: [{ コード: code, 数量: "2" }], 保存: [{ 査定: [査定(code, "500", "2", "する")], ...承諾 }, { 身分証明書: 身分証, 状況: "振込依頼済み" }] });
}
defineBuySeed("S-M07-03-TOCONTACTED-110", { n: "110", メール: "buyer7095-110", 保存: [{ 状況: "MTGBuyer査定完了" }] });
defineBuySeed("S-M07-03-TOREGISTERED-111", { n: "111", 品: [{ コード: "M0703-111-SUP", 数量: "2" }], 保存: [{ ...承諾, 査定: [査定("M0703-111-SUP", "5000", "2")] }] });
defineBuySeed("S-M07-03-TOCANCEL-112", { n: "112", 保存: [承諾] });
defineBuySeed("S-M07-03-IDCONFIRMED-113", { n: "113", 本人確認: "オンライン本人確認済み", 品: [{ コード: "M0703-113-SUP", 数量: "2" }], 保存: [{ ...承諾, 査定: [査定("M0703-113-SUP", "5000", "2")], 身分証明書: 身分証 }] });
defineBuySeed("S-M07-03-REGTOTRANSFER-114", { n: "114", 本人確認: "簡易書留確認済み", 品: [{ コード: "M0703-114-SUP", 数量: "2" }], 保存: [{ 状況: "簡易書留送付済み", 査定: [査定("M0703-114-SUP", "5000", "2")], 身分証明書: 身分証 }] });
defineBuySeed("S-M07-03-LOCKSEL-115", { n: "115", 品: [{ コード: "M0703-115-SUP", 数量: "2" }], 保存: [承諾, { 査定: [査定("M0703-115-SUP", "1000", "2", "する")] }] });
defineBuySeed("S-M07-03-APPROVENOSELSEL-125", {
  n: "125", 承諾方法: "自動承諾", 品: [{ コード: "M0703-125-SUP", 数量: "2" }, { コード: "M0703-125-NOSELL", 数量: "1" }],
  保存: [{ 査定: [査定("M0703-125-SUP", "1000", "2", "する"), 査定("M0703-125-NOSELL", "800", "1", "しない")], 状況: "MTGBuyer査定完了" }],
});
defineBuySeed("S-M07-03-NOSTOCKQTY-127", { n: "127", 品: [{ コード: "M0703-127-SUP", 数量: "1" }], 保存: [{ 査定: [査定("M0703-127-SUP", "500", "2", "する")], ...承諾 }, { 査定: [査定("M0703-127-SUP", "1000", "1")] }], 読み替え: [実在庫の読み替え("M0703-127-SUP")] });
defineBuySeed("S-M07-03-NOSTOCKSELL-128", { n: "128", 品: [{ コード: "M0703-128-SUP", 数量: "2" }], 保存: [{ 査定: [査定("M0703-128-SUP", "500", "2", "する")], ...承諾 }, { 査定: [査定("M0703-128-SUP", "1000", "2", "する")] }], 読み替え: [実在庫の読み替え("M0703-128-SUP")] });
defineBuySeed("S-M07-03-APPROVEUNDEC-144", { n: "144", メール: "dpm0703-144", 承諾方法: "自動承諾", 品: [{ コード: "M0703-144-SUP", 数量: "2" }], 保存: [{ 査定: [査定("M0703-144-SUP", "1000", "2")], 状況: "MTGBuyer査定完了" }] });
defineBuySeed("S-M07-03-STOCKMULTI-146", {
  n: "146", メール: "dpm0703-146", 品: [{ コード: "M0703-146-A", 数量: "2" }, { コード: "M0703-146-B", 数量: "3" }], 入庫: ["M0703-146-A", "M0703-146-B"],
  保存: [{ 査定: [査定("M0703-146-A", "500", "2", "する"), 査定("M0703-146-B", "300", "3", "する")], ...承諾 }, { 状況: "入庫待ち" }],
});
defineBuySeed("S-M07-03-STOCKNONE-147", { n: "147", メール: "dpm0703-147", 品: [{ コード: "M0703-147-SKU", 数量: "2" }], 保存: [{ 査定: [査定("M0703-147-SKU", "500", "2", "する")], ...承諾 }, { 状況: "入庫待ち" }] });
defineBuySeed("S-M07-03-EDITMIX-149", {
  n: "149", メール: "dpm0703-149", 品: [{ コード: "M0703-149-E1", 数量: "2" }, { コード: "M0703-149-E2", 数量: "3" }],
  保存: [{ 査定: [査定("M0703-149-E1", "500", "2", "する"), 査定("M0703-149-E2", "300", "3", "する")], ...承諾 }, { 身分証明書: 身分証, 状況: "振込依頼済み" }],
});
defineBuySeed("S-M07-03-CBIDOK-154", { n: "154", メール: "cbm0703-154", 本人確認: "簡易書留確認済み", 品: [{ コード: "M0703-CB154-SUP", 数量: "1" }], 保存: [{ ...承諾, 査定: [査定("M0703-CB154-SUP", "9999", "1")], 身分証明書: 身分証 }] });
defineBuySeed("S-M07-03-CBNOSALE-158", { n: "158", メール: "cbm0703-158", 承諾方法: "自動承諾", 品: [{ コード: "M0703-CB158-SUP", 数量: "2" }], 保存: [{ 査定: [査定("M0703-CB158-SUP", "1000", "2", "しない")], 状況: "MTGBuyer査定完了" }] });

// ---- RG（買取情報編集の変更がほかの画面へ反映される）のシード ----

export const M0703RG_ADMIN: Account = { loginId: "m0703rg_admin", password: "Passw0rd-M0703RG" };

defineSeed("S-M07-03-RG-ADM", async ({ browser, seed }) => {
  await 試験管理者を用意する(browser, M0703RG_ADMIN, "M07-03RG試験管理者");
  reportSeedIssue(seed.シードID, "シード作成時の問題: 権限は、ネット買取管理・在庫管理・会員管理を操作できる「システム管理者」（M07 の試験管理者と同じ作り方）。所属店舗・デフォルト検索表示店舗・編集可能店舗は本店");
});
defineSeed("S-M07-03-RG-REF", async ({ browser, seed }) => {
  await 買取状況の選択肢を確かめる(browser, ["商品到着", "査定内容承諾", "振込依頼済み", "振込完了", "未登録在庫あり", "入庫待ち", "入庫済み"]);
  reportSeedIssue(seed.シードID, "シード作成時の問題: 参照値はシード表では「DBシードで登録する」。DBへは書き込まず、開発環境の既存のマスタを使った（買取状況は買取検索一覧の選択肢にあることを画面で確かめた）");
});
defineSeed("S-M07-03-RG-CONFIG", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "シード作成時の問題: 本人確認必要額は管理画面の基本設定に項目が無く、アプリの設定ファイルの値（既定 10000）を使う。ネット買取の入庫先はモールの本店（店舗ID 1）で、画面の設定は無い。共有の設定は書き換えず、既存の値を使った");
});
defineSeed("S-M07-03-RG-MAIL", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "シード作成時の問題: 試験環境のメール配送設定は画面に無い。既存の環境の設定を使い、変えていない（このシードを使うケースはメールの受信を確かめない）");
});
defineSeed("S-M07-03-RG-BATCHWINDOW", async ({ seed }) => {
  // 買取自動入庫バッチは毎日15:00（日本時間）。入庫待ちにしてからケースを終えるまでに15:00をまたがないこと
  const jst = new Date(Date.now() + 9 * 3600_000);
  const m = jst.getUTCHours() * 60 + jst.getUTCMinutes();
  if (m >= 14 * 60 + 15 && m < 15 * 60 + 5) throw new Error(`いまは日本時間 ${jst.getUTCHours()}:${String(jst.getUTCMinutes()).padStart(2, "0")}。毎日15:00の買取自動入庫バッチをまたぐおそれがあるので、15:05より後に流す`);
  reportSeedIssue(seed.シードID, "シード作成時の問題: 入庫待ちにしてからケースを終えるまでに毎日15:00の買取自動入庫バッチをまたがないよう、日本時間14:15〜15:05はシードを作らず止める作りにした（15:00より後に作ったときは、翌日の15:00までに終える）");
});

const RG = ["S-M07-03-RG-ADM"];
for (const [seedId, n] of [["S-M07-03-RG-STOCKORDER-150", "RG001"], ["S-M07-03-RG-STOCKORDER-151", "RG002"]] as const) {
  const code = `M0703-${n}-SKU`;
  defineBuySeed(seedId, {
    n, 名: `買取${n}`, メール: `buyer-m0703-${n.toLowerCase()}`, 品: [{ コード: code, 数量: "2" }], 入庫: [code], 仕入単価: "800",
    保存: [{ 査定: [査定(code, "1100", "2", "する")], ...承諾 }, { 状況: "入庫待ち" }],
  }, RG);
}
defineBuySeed("S-M07-03-RG-NEWORDER-152", { n: "RG003", 名: "買取RG003", メール: "buyer-m0703-rg003", 品: [{ コード: "M0703-RG003-SKU", 数量: "2" }] }, RG);
defineBuySeed("S-M07-03-RG-ACCEPTED-153", {
  n: "RG004", 名: "買取RG004", メール: "buyer-m0703-rg004", 品: [{ コード: "M0703-RG004-SKU", 数量: "1" }],
  保存: [{ 査定: [査定("M0703-RG004-SKU", "1100", "1", "する")], ...承諾, 身分証明書: 身分証 }],
}, RG);
