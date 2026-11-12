/**
 * M07-05 入金CSV出力 の画面シード。正本: cases/M07-05_seed_data.tsv
 *
 * 作り方（部品は seeds/m07-common.ts）:
 *  1) 会員をフロントの会員登録＋管理画面の会員登録編集（本人確認ステータス）で作り、その会員でネット買取の申込みを行う。
 *     買取番号は申込完了の番号を控え、管理画面の買取一覧の先頭行と一致することを確かめる。
 *  2) 注文者名（姓）・メールアドレスは実行の印つき。ケースは同じ印つきの姓で検索する。
 *
 * シード表から読み替えたこと（各シードの報告に出る）:
 * - 銀行口座（銀行コード・支店コード・口座種別・口座番号・名義）の値、送料・受理合計価格・明細金額は、申込みの既定の入力のまま。
 *   これらの値を確かめるケース（002）は実装していない。サプライ品を作るグッズ商品CSV登録は使えない（カテゴリIDの不具合 ECCUBE_HARERUYA-3966）ので、金額は作らない。
 *   実装するケースの期待結果は金額・口座の値を見ない（買取番号・本人確認区分・行の有無と並び・ファイル名・画面の遷移・ダウンロードの有無）。
 * - 申込む商品は、買取価格500円以上で申込みできる既存の商品（共有のマスタは書き換えない）。
 * - 買取状況「注文」・本人確認ステータス・表示件数「10件」・CSV出力設定（UTF-8・カンマ・二重引用符）は共有のマスタ・設定。書き換えず、いまのまま使う。
 * - 存在しない買取番号は、買取一覧の検索で0件であることを確かめる（1件あれば、ほかの人のデータなので消さずに止める）。
 */
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { rc } from "../lib/run_marker";
import { Account, withAdminSession } from "../lib/session";
import { BuyListPage } from "../pages/admin/m07_buy";
import { 会員を作る, 試験管理者を用意する, 申込みを行う, 本人確認を設定する } from "./m07-common";

export const M0705_ADMIN: Account = { loginId: "m0705_admin", password: "Passw0rd!M0705" };
const ADM = ["S-M07-05-ADM"];

/** 注文者名（姓）。実行の印つき（ケースが検索欄へ入れる値） */
export const 注文者名 = (正本: string): string => rc(正本);

const 口座の注記 = "シード作成時の問題: 銀行口座・送料・受理合計価格・明細金額は、申込みの既定のまま（値を確かめるケースは実装していない）。申込む商品は既存の買取できる商品";

defineSeed("S-M07-05-ADM", async ({ browser }) => {
  await 試験管理者を用意する(browser, M0705_ADMIN, "M07-05試験管理者");
});

defineSeed("S-M07-05-MASTER", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "シード作成時の問題: 買取状況・本人確認ステータス・表示件数は共有のマスタ。書き換えず、既存のものを使った");
});

defineSeed("S-M07-05-CONFIG", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "シード作成時の問題: CSV出力設定は共有の設定のため書き換えない。いまの設定のままCSVを読む（読めない設定のときはケースが落ちる）");
});

/** 1人の会員で n 件の買取を作り、呼び名を控える（会員の本人確認ステータスは「オンライン本人確認済み」が既定） */
function 買取を作る(seedId: string, v: { 姓: string; ラベル: string; 本人確認?: string; 件数: number; 呼び名: (i: number) => string; needs?: string[] }): void {
  defineSeed(seedId, { needs: [...ADM, ...(v.needs ?? [])] }, async ({ browser, notes, seed }) => {
    const m = await 会員を作る(browser, v.姓, v.ラベル);
    await 本人確認を設定する(browser, m, v.本人確認 ?? "オンライン本人確認済み");
    const ids = await 申込みを行う(browser, m, v.件数, undefined, v.件数 > 3 ? "最初と最後だけ" : "毎回");
    ids.forEach((id, i) => notes.set(v.呼び名(i), id));
    reportSeedIssue(seed.シードID, 口座の注記);
  });
}

const 英字 = (i: number): string => String.fromCharCode(65 + i);
const 単発 = (n: string, 末 = "") => (seedId: string, 姓: string, needs: string[] = []) =>
  買取を作る(seedId, { 姓: 注文者名(姓), ラベル: `${n}${末}`, 件数: 1, 呼び名: () => `〔買取注文ID-M0705-${n}${末}〕`, needs });

// ---- 003: 本人確認区分（4人の会員。姓は共通の「M0705STATUS003」に実行の印を付けた値。正本の -1〜-4 は付けない: ケースは部分一致の検索を使うため） ----
defineSeed("S-M07-05-STATUS-003", { needs: ADM }, async ({ browser, notes, seed }) => {
  const 状態 = ["未確認", "確認中", "オンライン本人確認済み", "簡易書留確認済み"];
  for (const [i, s] of 状態.entries()) {
    const m = await 会員を作る(browser, 注文者名("M0705STATUS003"), `003${英字(i)}`);
    await 本人確認を設定する(browser, m, s);
    const [id] = await 申込みを行う(browser, m, 1);
    notes.set(`〔買取注文ID-M0705-003${英字(i)}〕`, id);
  }
  reportSeedIssue(seed.シードID, 口座の注記);
  reportSeedIssue(seed.シードID, "シード作成時の問題: 4人の会員の注文者名（姓）は、正本の「M0705STATUS003-1」〜「-4」ではなく、共通の「M0705STATUS003」に実行の印を付けた値にした（作った順は A・B・C・D）");
});

// ---- 005・006・012: 2人の会員 ----
単発("005", "A")("S-M07-05-RICH-005", "M0705SEL005");
単発("005", "B")("S-M07-05-SECOND-005", "M0705SEL005", ["S-M07-05-RICH-005"]);
単発("006", "A")("S-M07-05-RICH-006", "M0705SEL006");
単発("006", "B")("S-M07-05-SECOND-006", "M0705SEL006", ["S-M07-05-RICH-006"]);
単発("012", "A")("S-M07-05-RICH-012", "M0705SEL012");
単発("012", "B")("S-M07-05-SECOND-012", "M0705SEL012", ["S-M07-05-RICH-012"]);

// ---- 007・009・011: 1件 ----
単発("007")("S-M07-05-RICH-007", "M0705SEL007");
単発("009")("S-M07-05-RICH-009", "M0705SEL009");
単発("011")("S-M07-05-RICH-011", "M0705SEL011");

// ---- 008・010: 同じ会員の買取 11 件（表示件数 10 件で 2 ページ目に 1 件） ----
for (const n of ["008", "010"]) {
  買取を作る(`S-M07-05-PAGING-${n}`, { 姓: 注文者名(`入金CSVページ保持-${n}`), ラベル: n, 件数: 11, 呼び名: (i) => `〔買取注文ID-M0705-${n}${英字(i)}〕` });
}

// ---- 存在しない買取番号 ----
for (const [seedId, 番号] of [["S-M07-05-NOTFOUND-006", "970599006"], ["S-M07-05-NOTFOUND-009", "970599009"], ["S-M07-05-NOTFOUND-010", "970599010"]]) {
  defineSeed(seedId, { needs: ADM }, async ({ browser, seed }) => {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const l = new BuyListPage(page);
      await l.open();
      await l.買取番号を入れる(番号);
      await l.検索する();
      const n = (await l.行()).length;
      if (n !== 0) throw new Error(`買取番号 ${番号} の買取が ${n} 件ある（存在しないはず。ほかの人のデータなので消さない）`);
    });
    reportSeedIssue(seed.シードID, `買取番号 ${番号} が存在しない（買取一覧の検索で0件）ことを確かめた`);
  });
}
