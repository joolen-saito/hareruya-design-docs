/**
 * M07-01 買取検索一覧 の画面シード（2026-11-10 に足したケースが使うもの）。正本: cases/M07-01_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10）: テストデータは「既存データ または 画面から作ったデータ」に読み替えてよい。DB へは書き込まない。
 * 読み替えたことは、シードの報告（reportSeedIssue）に「シード作成時の問題」として残す（ケースの注記に出る）。
 *
 * 作り方（M07-03 の defineBuySeed と同じ型。部品は seeds/m07-03-b.ts・pages/front/m07_03_apply.ts を使う）:
 * - 会員: フロントの会員登録（本登録のメールは読まない）＋管理画面の会員登録編集（本会員・職業・本人確認ステータス）。
 *   メールアドレスは実行の印つき。注文者名（姓）は、ケースが検索欄へ入れる値に実行の印を付けた値（検索もその値で行う）。
 * - 買取に使う商品: 毎回グッズ商品CSV登録で作る（商品コード・商品名は実行の印つき）。買取価格は 500（下限。これより低いと買取商品詳細に
 *   「カートに追加」が出ない）。既存の共有の商品を申し込むと、査定内容承諾・入庫で共有の商品の在庫が動くため使わない。
 * - 買取番号: 申込完了画面の買取番号を控え、管理画面の買取検索一覧をその番号で検索して、行の買取依頼者氏名が会員の氏名であることを確かめる。
 * - 管理画面の操作（買取状況・査定・実在庫・戻しリスト）は全権限の管理者（SETUP_ADMIN）で行う。
 * - シード表の「上で作った買取以外の行を削除する」「この N 件以外を削除する」は行わない（共有の環境の買取を消さない）。注文者名は実行の印つきなので、
 *   注文者名で絞るケースは作った買取だけになる。買取状況などで絞るケースは、ほかの買取も出る前提でケースの確かめ方を読み替えた（spec の注記）。
 */
import { Browser, expect, Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { rc } from "../lib/run_marker";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { BuyListPage } from "../pages/admin/m07_buy";
import { 一覧から編集を開く } from "../pages/admin/m07_03_edit";
import { カード商品にする } from "../pages/admin/m07_03_card";
import { サプライ品を登録する } from "../pages/admin/m07_supply";
import { 条件つきで申込む } from "../pages/front/m07_03_apply";
import { ログインする } from "../pages/front/m07_net_buy";
import { 会員のパスワード, 会員を用意する, 保存まで行う, 保存の内容, 商品IDを画面で引く, 品 } from "./m07-03-b";
import "./m07-01";

const ADM = ["S-M07-01-ADM"];
export type Issue = (m: string) => void;

/** 正本の注文者名（姓）に実行の印を付けた値。ケースもこの値で検索する */
export const 注文者名 = (正本の姓: string): string => rc(正本の姓);

// ---- 作り方の部品 ----

export type 商品 = { コード: string; 基準価格?: string; 買取価格?: string; カード?: boolean };

/** グッズ商品CSV登録で商品を作り（カードにするものはカード指定）、正本のコード → 商品ID を返す */
export async function 商品を用意する(browser: Browser, items: 商品[], issue: Issue): Promise<Map<string, string>> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await サプライ品を登録する(page, items.map((p) => ({ コード: 品(p.コード), 名前: 品(p.コード), 基準価格: p.基準価格 ?? "1000", 買取価格: p.買取価格 ?? "500" })), issue);
    const out = new Map<string, string>();
    for (const p of items) {
      const id = await 商品IDを画面で引く(page, 品(p.コード));
      if (p.カード) await カード商品にする(page, id, 品(p.コード), issue);
      out.set(p.コード, id);
    }
    return out;
  });
}

type 口座 = { 銀行名: string; 支店名: string; 口座種別: string; 口座番号: string; 名義: string };
export type 一件 = {
  /** 申し込む商品（正本のコード）と数量 */
  品: { コード: string; 数量: string }[];
  口座?: 口座;
  /** 管理画面の買取情報編集で、順に「保存」まで行う内容 */
  保存?: 保存の内容[];
  /** 保存のあとに管理画面で行う操作（全権限の管理者のページ） */
  後で?: (page: Page, 番号: string) => Promise<void>;
};
export type 会員の作り方 = { 姓: string; 名?: string; メール: string; 本人確認?: string };

let 名の連番 = 0;

/**
 * 会員を1人作り、その会員で 件 の数だけ申し込み、それぞれ管理画面の操作を行う。買取番号（数字）を申込の順に返す。
 * 商品の ID は ids（正本のコード → 商品ID）から引く。
 */
export async function 申し込む(browser: Browser, seedId: string, 会員: 会員の作り方, ids: Map<string, string>, 件: 一件[]): Promise<string[]> {
  const issue: Issue = (m) => reportSeedIssue(seedId, m);
  const 名 = 会員.名 ?? `シード${++名の連番}`;
  const メール = `${rc(会員.メール)}@example.test`.toLowerCase();
  await 会員を用意する(browser, seedId, { 姓: 会員.姓, 名, セイ: "シケン", メイ: "シード", メール, 電話: ["090", "1234", "5678"], 本人確認: 会員.本人確認 });
  const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  const 番号: string[] = [];
  try {
    await hideDebugToolbar(ctx);
    const fp = await ctx.newPage();
    fp.setDefaultTimeout(60_000);
    await ログインする(fp, { メール, パスワード: 会員のパスワード });
    for (const k of 件) {
      const ps = k.品.map((p) => {
        const id = ids.get(p.コード);
        if (!id) throw new Error(`${seedId}: 商品 ${p.コード} を用意していない`);
        return { 商品ID: id, 数量: p.数量 };
      });
      番号.push(await 条件つきで申込む(fp, ps, {
        承諾方法: "査定結果を確認してから承諾する", 登録番号: null,
        口座名義: k.口座?.名義 ?? "シケンシード", 銀行名: k.口座?.銀行名, 支店名: k.口座?.支店名, 口座番号: k.口座?.口座番号, 口座種別: k.口座?.口座種別,
      }));
    }
  } finally { await ctx.close(); }
  issue(`シード作成時の問題: 会員は、フロントの会員登録（本登録のメールは読まない）＋管理画面の会員登録編集（本会員・職業${会員.本人確認 ? `・本人確認ステータス「${会員.本人確認}」` : ""}）で作った。メールアドレスは実行の印つき（${メール}）。注文者名（姓）は「${会員.姓}」`);
  // 買取検索一覧で、番号の行の氏名を確かめる（シード表は一覧の先頭行から控える定め。ほかの実行と並ぶので番号で引いた）
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const n of 番号) {
      const l = new BuyListPage(page);
      await l.open();
      await l.買取番号を入れる(n);
      await l.検索する();
      const rows = (await l.行()).filter((r) => r.番号 === n);
      if (rows.length !== 1) throw new Error(`${seedId}: 買取検索一覧に買取番号 ${n} の行が無い`);
      if (!rows[0].氏名.replace(/\s/g, "").includes(`${会員.姓}${名}`.replace(/\s/g, ""))) throw new Error(`${seedId}: 買取番号 ${n} の行の買取依頼者氏名が「${rows[0].氏名}」（${会員.姓} ${名} のはず）`);
    }
  });
  issue("シード作成時の問題: 買取番号は申込完了画面の番号を控え、買取検索一覧をその番号で検索して、行の買取依頼者氏名が会員の氏名であることを確かめた（シード表は注文者名で検索した先頭行から控える定め）");
  for (let i = 0; i < 件.length; i++) {
    for (const s of 件[i].保存 ?? []) await 保存まで行う(browser, 番号[i], s);
    const after = 件[i].後で;
    if (after) await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await after(page, 番号[i]); });
  }
  return 番号;
}

/** 実在庫情報の「編集」→「商品追加」で、商品（正本のコード）を増減数つきで足し、「追加品確定」を押す（1品ずつ） */
function 実在庫に足す(行: { コード: string; 増減数: string }[]): (page: Page, 番号: string) => Promise<void> {
  return async (page, 番号) => {
    for (const r of 行) {
      const e = await 一覧から編集を開く(page, 番号);
      await e.実在庫の編集を開く();
      await e.実在庫に商品を追加する(品(r.コード), r.増減数, `買取番号 ${番号} の実在庫に ${品(r.コード)} を ${r.増減数} 足す`);
    }
  };
}

/** 買取検索一覧で買取番号を検索し、行にチェックを付けて「戻しリストCSV」を押す（シード表の手順。棚戻し済みになる） */
async function 戻しリストCSVを出す(page: Page, 番号: string): Promise<void> {
  const l = new BuyListPage(page);
  await l.open();
  await l.買取番号を入れる(番号);
  await l.検索する();
  await l.対象にする(番号);
  const r = await l.ダウンロードを押す("戻しリストCSV");
  if (!r.file) throw new Error(`買取番号 ${番号} の戻しリストCSVが出力されない（応答 ${r.応答}、警告 ${r.ダイアログ.join(" / ")}）`);
}

export const 状況 = (s: string): 保存の内容 => ({ 状況: s });
export const 身分証 = "自動車運転免許証";
const 削除しない = "シード作成時の問題: シード表の「上で作った買取以外の行を削除する」（DBでの削除を含む）は、共有の環境の買取を消すので行っていない。ケースはほかの買取も一覧に出る前提で確かめる（ケースの注記）";
export const 印つきの姓 = (姓: string, 正本: string) => `シード作成時の問題: 注文者名（姓）は正本の「${正本}」に実行の印を付けた「${姓}」にした（前の実行の残りと混ざらないため。ケースもこの値で検索する）`;

/** 申込みだけの共通の商品（買取明細にする商品）。シード表は「買取価格500円以上の公開中の商品」。既存の商品は使わず、毎回作る */
export const 申込品 = (n: string) => `M0701-${n}-FB`;

/** 同じ会員で n 件申し込み、各件に買取状況などを保存する（ラベルは件の順） */
function 状況の組(seedId: string, n: string, 姓の正本: string, ラベル: string[], 保存: 保存の内容[][], 読み替え: string[] = []): void {
  defineSeed(seedId, { needs: ADM }, async ({ browser, notes }) => {
    const issue: Issue = (m) => reportSeedIssue(seedId, m);
    const ids = await 商品を用意する(browser, [{ コード: 申込品(n) }], issue);
    const 姓 = 注文者名(姓の正本);
    const nums = await 申し込む(browser, seedId, { 姓, メール: `m0701-${n}` }, ids, ラベル.map((_, i) => ({ 品: [{ コード: 申込品(n), 数量: "1" }], 保存: 保存[i] })));
    ラベル.forEach((l, i) => notes.set(l, nums[i]));
    issue("シード作成時の問題: 買取に使う商品はグッズ商品CSV登録で毎回作った（商品コード・商品名は実行の印つき、買取価格500）");
    issue(印つきの姓(姓, 姓の正本));
    for (const m of 読み替え) issue(`シード作成時の問題: ${m}`);
  });
}

// ---- 共有のシード ----

/** 買取状況マスタ（表示順の順）。シード表 S-M07-01-MASTER の状態・属性に並ぶ順 */
export const 買取状況マスタの順 = ["注文", "商品到着", "査定中", "査定中断", "査定再開", "MTGBuyer査定完了", "査定内容連絡済み", "査定内容承諾", "簡易書留送付済み", "振込依頼済み", "振込完了", "振込失敗", "未登録在庫あり", "入庫待ち", "入庫済み", "キャンセル済み"];

defineSeed("S-M07-01-MASTER", { needs: ADM }, async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const l = new BuyListPage(page);
    await l.open();
    const have = (await page.locator("#admin_purchase_list_buy_order_status option").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
    const miss = 買取状況マスタの順.filter((n) => !have.includes(n));
    if (miss.length) throw new Error(`買取状況の選択肢に ${miss.join("・")} が無い（ある選択肢: ${have.join("、")}）`);
    const ids = await page.locator('input[name*="identityConfirmStatus"]').count();
    if (ids !== 4) throw new Error(`本人確認の選択肢が ${ids} 件（4状態のはず）`);
  });
  reportSeedIssue(seed.シードID, "シード作成時の問題: 買取状況・本人確認状態・表示順はシード表では「DBシードで登録する」。DBへは書き込まず、開発環境の既存のマスタを使った（買取状況16件と本人確認4状態が買取検索一覧の選択肢にあることを画面で確かめた）");
});

defineSeed("S-M07-01-DISPLAY-ID123", { needs: ADM }, async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const l = new BuyListPage(page);
    await l.open();
    await l.買取番号を入れる("123");
    await l.検索する();
    const rows = (await l.行()).filter((r) => r.買取番号 === "0000123");
    if (rows.length !== 1) throw new Error("買取番号 0000123（ID 123）の買取が、この環境に無い（シード表は DB で ID 指定で登録する定め。画面では作れない）");
    reportSeedIssue(seed.シードID, `シード作成時の問題: シード表は「DBシードで会員と買取情報をID指定で登録する」。DBへは書き込まず、この環境に既にある買取番号 0000123（ID 123。注文者名「${rows[0].氏名}」・買取状況「${rows[0].買取状況}」）を使った（注文者名・依頼日時はシード表の値と違う。ケースは確かめない）`);
  });
});

// ---- ケース専用のシード ----

状況の組("S-M07-01-STATUS-DATE-002", "002", "M0701-002-X", ["〔買取番号-M0701-002〕"], [[状況("商品到着")]],
  ["商品到着履歴の日時（2026/08/01 00:00:00）はDBで設定する定めだが設定していない（保存した日時のまま。ケースは日時を確かめない）"]);
状況の組("S-M07-01-STATUS-DATE-005", "005", "M0701-005-X", ["〔買取番号-M0701-005A〕", "〔買取番号-M0701-005B〕"], [[状況("未登録在庫あり")], [状況("入庫待ち")]], [削除しない]);
状況の組("S-M07-01-STATUS-DATE-008", "008", "M0701-008-X", ["〔買取番号-M0701-008A〕", "〔買取番号-M0701-008B〕"], [[], [状況("商品到着")]], [削除しない]);
状況の組("S-M07-01-STATUS-DATE-011", "011", "M0701-011-X", ["〔買取番号-M0701-011A〕", "〔買取番号-M0701-011B〕", "〔買取番号-M0701-011C〕", "〔買取番号-M0701-011D〕"],
  [[状況("商品到着")], [状況("商品到着")], [状況("商品到着")], [状況("商品到着")]],
  ["「この4件以外の買取情報を削除する」はDBで行う定めだが、共有の環境の買取を消すので行っていない。商品到着履歴の日時は保存した日時（シード表は日時を定めない）"]);
状況の組("S-M07-01-INIT-BLANK-070", "070", "M0701-070-X", ["〔買取番号-M0701-070〕"], [[状況("査定中"), { 身分証明書: 身分証, 状況: "振込依頼済み" }, 状況("キャンセル済み")]],
  ["履歴の日時（査定中 2026/08/10 12:00:00・振込依頼済み 2026/08/11 12:00:00・キャンセル済み 2026/08/12 12:00:00）はDBで設定する定めだが設定していない（保存した日時のまま。ケースは検索欄の初期値だけを確かめる）",
    "「買取番号〔買取番号-M0701-070〕の1件だけが存在する」は共有の環境では成り立たない（ほかの買取を消さない）"]);
状況の組("S-M07-01-STATUS-LABEL-080", "080", "M0701-080-X", ["〔買取番号-M0701-080A〕", "〔買取番号-M0701-080B〕", "〔買取番号-M0701-080C〕"],
  [[{ 身分証明書: 身分証, 状況: "振込依頼済み" }], [状況("査定内容連絡済み")], [状況("キャンセル済み")]],
  ["シード表の「注文者名で検索し、上で作った買取以外の行を削除する」は行っていない。注文者名が実行の印つきなので、検索結果は作った3件だけになる"]);

defineSeed("S-M07-01-STATUS-DATE-006", { needs: ADM }, async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const issue: Issue = (m) => reportSeedIssue(id, m);
  const ids = await 商品を用意する(browser, [{ コード: 申込品("006") }], issue);
  const 姓 = 注文者名("M0701-006-X");
  const 件 = (s: string, 後で?: 一件["後で"]): 一件 => ({ 品: [{ コード: 申込品("006"), 数量: "1" }], 保存: [状況(s)], 後で });
  const nums = await 申し込む(browser, id, { 姓, メール: "m0701-006" }, ids, [件("未登録在庫あり"), 件("入庫待ち"), 件("入庫済み", 戻しリストCSVを出す)]);
  notes.set("〔買取番号-M0701-006A〕", nums[0]);
  notes.set("〔買取番号-M0701-006B〕", nums[1]);
  notes.set("〔買取番号-M0701-006C〕", nums[2]);
  issue(印つきの姓(姓, "M0701-006-X"));
  issue(削除しない);
  issue("シード作成時の問題: 査定内容承諾を経ずに買取状況を変えたので、3件とも実在庫は無い（〔買取番号-M0701-006C〕の入庫済みで在庫は動かない）。〔買取番号-M0701-006C〕は戻しリストCSVを出力して棚戻し済みにした");
});

defineSeed("S-M07-01-NAME-PRODUCT-042", { needs: ADM }, async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const issue: Issue = (m) => reportSeedIssue(id, m);
  const ids = await 商品を用意する(browser, [{ コード: 申込品("042") }], issue);
  const [n] = await 申し込む(browser, id, { 姓: "山田", 名: "太郎", メール: "m0701-042" }, ids, [{ 品: [{ コード: 申込品("042"), 数量: "1" }], 保存: [状況("商品到着")] }]);
  notes.set("〔買取番号-M0701-042〕", n);
  issue("シード作成時の問題: 買取依頼日（2026/08/01）はDBで設定する定めだが設定していない。依頼日は申し込んだ日（2026/08/01 より後）で、ケースの検索条件（買取依頼日(From) 2026/08/01）に当たる");
  issue("シード作成時の問題: 注文者名は正本の「山田 太郎」のまま（ケースがリンクの文で再検索するため）。前の実行の「山田 太郎」の買取も残る");
});

defineSeed("S-M07-01-PAYMENT-055", { needs: ADM }, async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const issue: Issue = (m) => reportSeedIssue(id, m);
  const ids = await 商品を用意する(browser, [{ コード: "M0701-055-A-SUP" }, { コード: "M0701-055-B-SUP" }], issue);
  const 姓 = 注文者名("入金出力試験");
  const 査定 = (コード: string, 価格: string, 送料: string): 保存の内容 => ({ 査定: [{ コード, 査定価格: 価格, 数量: "1", 売却: "する" }], 送料 });
  const [a] = await 申し込む(browser, id, { 姓, メール: "m0701-055a", 本人確認: "オンライン本人確認済み" }, ids, [{
    品: [{ コード: "M0701-055-A-SUP", 数量: "1" }], 口座: { 銀行名: "晴銀行", 支店名: "本店", 口座種別: "普通", 口座番号: "0012345", 名義: "ヤマダタロウ" }, 保存: [査定("M0701-055-A-SUP", "9500", "500")],
  }]);
  const [b] = await 申し込む(browser, id, { 姓, メール: "m0701-055b", 本人確認: "簡易書留確認済み" }, ids, [{
    品: [{ コード: "M0701-055-B-SUP", 数量: "1" }], 口座: { 銀行名: "曇銀行", 支店名: "中央支店", 口座種別: "当座", 口座番号: "0000777", 名義: "サトウハナコ" }, 保存: [査定("M0701-055-B-SUP", "8000", "0")],
  }]);
  notes.set("〔買取番号-M0701-055A〕", a);
  notes.set("〔買取番号-M0701-055B〕", b);
  issue(印つきの姓(姓, "入金出力試験"));
  issue("シード作成時の問題: シード表は申込のあと「商品追加」でサプライ品を1点足して査定する定め。申込みに使った商品（毎回作るサプライ品1点）の明細をそのまま査定した（査定価格・数量1・売却する・送料はシード表の値）。足すと申込みの明細が残り、査定額がシード表の値にならないため");
});

/** 戻しリストの基本（059〜064）: 申込品 M → 承諾 → 実在庫に別の商品を足す → 買取状況 */
function 戻し基本(seedId: string, n: string, ラベル: string, 最後の状況: "入庫待ち" | "入庫済み" | "注文", 足す: { コード: string; 増減数: string; カード?: boolean }[], 明細を売却しない: boolean, 読み替え: string[]): void {
  defineSeed(seedId, { needs: ADM }, async ({ browser, notes }) => {
    const issue: Issue = (m) => reportSeedIssue(seedId, m);
    const ids = await 商品を用意する(browser, [{ コード: 申込品(n) }, ...足す.map((x) => ({ コード: x.コード, 買取価格: "0", カード: x.カード }))], issue);
    const 姓 = 注文者名("戻し基本試験");
    const 承諾: 保存の内容 = 明細を売却しない
      ? { 査定: [{ コード: 申込品(n), 売却: "しない" }], 状況: "査定内容承諾" }
      : { 状況: "査定内容承諾" };
    const [num] = await 申し込む(browser, seedId, { 姓, メール: `m0701-${n}` }, ids, [{
      品: [{ コード: 申込品(n), 数量: "1" }], 保存: [承諾],
      後で: async (page, 番号) => {
        await 実在庫に足す(足す)(page, 番号);
        const e = await 一覧から編集を開く(page, 番号);
        await e.買取状況を変えて保存する(最後の状況);
      },
    }]);
    notes.set(ラベル, num);
    issue(印つきの姓(姓, "戻し基本試験"));
    for (const m of 読み替え) issue(`シード作成時の問題: ${m}`);
  });
}
const 商品の読み替え = "実在庫にする商品は、カード登録・カード詳細・棚番号・略称タグを新しく登録する定めだが、共有のマスタに値を足すので登録していない。グッズ商品CSV登録で作った2品（1品は商品登録編集の「カード指定」で既存のカードを指定した通常商品、もう1品はサプライ）を使い、棚番号・略称タグは設定していない（言語は日本語・状態はニアミント・基準価格1000・商品名はCSVの商品名）";
const 明細を外す = "買取明細（申込みの商品）は、実在庫と内容が分かれるよう、査定内容承諾の保存で売却を「しない」にした（承諾の保存で明細から実在庫が作られないように）";
戻し基本("S-M07-01-RETURN-BASIC-059", "059", "〔買取番号-M0701-059〕", "入庫待ち", [{ コード: "M0701-R059-C", 増減数: "2", カード: true }, { コード: "M0701-R059-S", 増減数: "3" }], true, [商品の読み替え, 明細を外す, "増減数はシード表が決めていないので、通常商品2・サプライ3にした"]);
戻し基本("S-M07-01-RETURN-BASIC-061", "061", "〔買取番号-M0701-061〕", "入庫済み", [{ コード: "M0701-R061-C", 増減数: "2", カード: true }, { コード: "M0701-R061-S", 増減数: "3" }], true, [商品の読み替え, 明細を外す, "増減数はシード表が決めていないので、通常商品2・サプライ3にした。入庫済みの保存で、この2品の在庫が本店に入る（実行の印つきの商品）"]);
const 公開中の商品 = "実在庫に足す「公開中の商品」は、既存の共有の商品の在庫を動かさないよう、毎回グッズ商品CSV登録で作るサプライ品にした（増減数1）";
戻し基本("S-M07-01-RETURN-BASIC-060", "060", "〔買取番号-M0701-060〕", "入庫待ち", [{ コード: "M0701-R060-S", 増減数: "1" }], false, [公開中の商品]);
戻し基本("S-M07-01-RETURN-BASIC-062", "062", "〔買取番号-M0701-062〕", "入庫済み", [{ コード: "M0701-R062-S", 増減数: "1" }], false, [公開中の商品, "入庫済みの保存で、足したサプライ品（と売却する明細）の在庫が本店に入る（実行の印つきの商品）"]);
戻し基本("S-M07-01-RETURN-BASIC-063", "063", "〔買取番号-M0701-063〕", "注文", [{ コード: "M0701-R063-S", 増減数: "1" }], false, [公開中の商品]);
戻し基本("S-M07-01-RETURN-BASIC-064", "064", "〔買取番号-M0701-064〕", "注文", [{ コード: "M0701-R064-S", 増減数: "1" }], false, [公開中の商品]);

/** 買取商品一覧CSV（089・090）: 会員1人で2件。各件に売却する明細・しない明細 */
for (const n of ["089", "090"]) {
  const seedId = `S-M07-01-CSVMULTI-${n}`;
  defineSeed(seedId, { needs: ADM }, async ({ browser, notes }) => {
    const issue: Issue = (m) => reportSeedIssue(seedId, m);
    const c = (x: string) => `M0701-${n}-${x}`;
    const ids = await 商品を用意する(browser, ["A-OK", "A-NG", "B-OK", "B-NG"].map((x) => ({ コード: c(x) })), issue);
    const 姓 = 注文者名(`M0701-${n}-X`);
    const 件 = (ok: string, ng: string, okN: string): 一件 => ({
      品: [{ コード: c(ok), 数量: okN }, { コード: c(ng), 数量: "1" }],
      保存: [{ 査定: [{ コード: c(ok), 数量: okN, 売却: "する" }, { コード: c(ng), 数量: "1", 売却: "しない" }] }],
    });
    const [a, b] = await 申し込む(browser, seedId, { 姓, メール: `m0701-${n}` }, ids, [件("A-OK", "A-NG", "2"), 件("B-OK", "B-NG", "3")]);
    notes.set(`〔買取番号-M0701-${n}A〕`, a);
    notes.set(`〔買取番号-M0701-${n}B〕`, b);
    issue(印つきの姓(姓, `M0701-${n}-X`));
    issue("シード作成時の問題: 各買取の明細はDBで登録する定めだが、画面で作った: 商品（商品コードはシード表の値に実行の印つき）をグッズ商品CSV登録で作り、その2品を数量つきで申し込み、買取情報編集の「査定編集」で売却を「する」「しない」に選んで保存した");
  });
}

defineSeed("S-M07-01-CSVUNDECIDED-091", { needs: ADM }, async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const issue: Issue = (m) => reportSeedIssue(id, m);
  const ids = await 商品を用意する(browser, [{ コード: "M0701-091-OK" }, { コード: "M0701-091-UNDECIDED" }], issue);
  const 姓 = 注文者名("M0701-091-X");
  const [n] = await 申し込む(browser, id, { 姓, メール: "m0701-091" }, ids, [{
    品: [{ コード: "M0701-091-OK", 数量: "2" }, { コード: "M0701-091-UNDECIDED", 数量: "1" }],
    保存: [{ 査定: [{ コード: "M0701-091-OK", 数量: "2", 売却: "する" }, { コード: "M0701-091-UNDECIDED", 数量: "1", 売却: "未定" }] }],
  }]);
  notes.set("〔買取番号-M0701-091〕", n);
  issue(印つきの姓(姓, "M0701-091-X"));
  issue("シード作成時の問題: 明細はDBで登録する定めだが、画面で作った（2品を数量つきで申し込み、「査定編集」で売却を「する」「未定」に選んで保存）。商品コードはシード表の値に実行の印つき");
});

defineSeed("S-M07-01-CBSORT-093", { needs: ADM }, async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const issue: Issue = (m) => reportSeedIssue(id, m);
  // 2回に分けて登録する（1回目 Y、2回目 X2）。2回目の商品IDが大きいことを確かめる
  const y = await 商品を用意する(browser, [{ コード: "M0701-CB093-Y" }], issue);
  const x2 = await 商品を用意する(browser, [{ コード: "M0701-CB093-X2" }], issue);
  const yId = y.get("M0701-CB093-Y")!, x2Id = x2.get("M0701-CB093-X2")!;
  if (!(Number(x2Id) > Number(yId))) throw new Error(`2回目に登録した商品の商品ID ${x2Id} が、1回目の ${yId} より大きくない`);
  notes.set("〔商品ID-M0701-093-Y〕", yId);
  notes.set("〔商品ID-M0701-093-X2〕", x2Id);
  const ids = new Map([...y, ...x2]);
  const 姓 = 注文者名("M0701-CB093-X");
  const [n] = await 申し込む(browser, id, { 姓, メール: "cbm0701-093" }, ids, [{
    // 商品IDの大きい方（X2）を先にカートへ入れる
    品: [{ コード: "M0701-CB093-X2", 数量: "3" }, { コード: "M0701-CB093-Y", 数量: "2" }],
    保存: [{ 査定: [{ コード: "M0701-CB093-X2", 数量: "3", 売却: "する" }, { コード: "M0701-CB093-Y", 数量: "2", 売却: "する" }] }],
  }]);
  notes.set("〔買取番号-M0701-093〕", n);
  issue(印つきの姓(姓, "M0701-CB093-X"));
  issue("シード作成時の問題: 明細はDBで登録する定めだが、画面で作った: 商品IDの大きい X2 を先に、Y をあとに買取カートへ入れて申し込み（明細はカートの順に作られる想定）、「査定編集」で2行とも売却「する」にして保存した。商品はグッズ商品CSV登録（基準価格1000・買取価格500。シード表の100・10では買取商品詳細に「カートに追加」が出ない）。商品コードとメールアドレスは実行の印つき");
});

defineSeed("S-M07-01-CBSORT-095", { needs: ADM }, async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const issue: Issue = (m) => reportSeedIssue(id, m);
  const P = "M0701-CB095-P";
  const ids = await 商品を用意する(browser, [{ コード: P }], issue);
  notes.set("〔商品ID-M0701-095-P〕", ids.get(P)!);
  const 姓 = 注文者名("M0701-CB095-X");
  const [n] = await 申し込む(browser, id, { 姓, メール: "cbm0701-095" }, ids, [{
    品: [{ コード: P, 数量: "2" }],
    後で: async (page, 番号) => {
      // 買取情報編集の「商品追加」で同じ商品の明細をもう1行足し、「査定編集」で数量2・3、売却「する」にして保存する
      const e = await 一覧から編集を開く(page, 番号);
      await e.明細に商品を追加する(品(P));
      await e.査定編集を始める();
      const 行 = await e.選んで買取の明細();
      if (行.length !== 2) throw new Error(`商品追加のあとの選んで買取の明細が ${行.length} 行（2行のはず）`);
      await e.明細を入れる(0, { 数量: "2", 売却: "する" });
      await e.明細を入れる(1, { 数量: "3", 売却: "する" });
      await e.査定確定する();
      await e.保存する(`買取番号 ${番号} に同じ商品の明細を足して数量2・3にする`);
      const 後 = await (await 一覧から編集を開く(page, 番号)).選んで買取の明細();
      const qs = 後.filter((r) => r.商品名.includes(品(P))).map((r) => r.数量).sort();
      expect(qs, "保存のあとの、同じ商品の明細の数量").toEqual(["2", "3"]);
    },
  }]);
  notes.set("〔買取番号-M0701-095〕", n);
  issue(印つきの姓(姓, "M0701-CB095-X"));
  issue("シード作成時の問題: 明細はDBで登録する定めだが、画面で作った: 商品を数量2で申し込み、買取情報編集の「商品追加」で同じ商品（同じ規格）の明細を1行足し、「査定編集」で数量3・売却「する」にして保存した。商品はグッズ商品CSV登録（買取価格500）。商品コードとメールアドレスは実行の印つき");
});
