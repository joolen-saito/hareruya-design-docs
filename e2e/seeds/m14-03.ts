/**
 * M14-03 カード検索（一括削除）のシードの作り方（画面操作）。正本: cases/M14-03_seed_data.tsv（IT-M14-03-002 の分だけ）
 *
 * 読み替え（シードの注記に残す）:
 *  - カード名(日)・(英)・デッキ名・アーキタイプ名は、実行ごとの印を付けた値にした（前の実行の残りと取り違えないため）。
 *  - フォーマット「M1403-FG-FMT」は、正本どおり名前で探し、無ければ画面で登録する（既存の行は書き換えない）。
 *  - アーキタイプは、デッキ登録で必須のため、この実行用に印つきの名前で画面から登録した。
 *  - シード表の「管理画面から登録できないマスタ値をDBシードで用意する」は行わない。カードの必須の選択値は、
 *    カード詳細(登録・編集・削除)のシード（S-M14-04-MASTER）が画面で用意した値を使った。
 */
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { rc } from "../lib/run_marker";
import { Account, withAdminSession } from "../lib/session";
import { ensureFormatByName } from "../pages/admin/m14_card";
import { アーキタイプを登録する, デッキを登録する } from "../pages/admin/m12_deck_seed";
import { カードに紐づく商品の数, デッキの明細 } from "../db/m14_04_card";
import { 画面でカードを作る } from "./m14-04";
import { ensureAnalysisAdmin } from "./m12-common";

export const M1403FG_ADMIN: Account = { loginId: "m1403fg_admin", password: "Passw0rd-FGM1403" };
const FMT = "M1403-FG-FMT";

defineSeed("S-M14-03-FGADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M14-03試験管理者", account: M1403FG_ADMIN, メール: "m1403fg_admin@example.test" });
});

defineSeed("S-M14-03-FGENV", { needs: ["S-M14-04-MASTER"] }, async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await ensureFormatByName(page, { 名日: FMT, 名英: FMT, コード: "", 並び順: "9031" }, seed.シードID, (m) => reportSeedIssue(seed.シードID, m));
  });
  reportSeedIssue(seed.シードID, "本店の日本語ページは試験環境の標準設定をそのまま使った。アーキタイプは、デッキ登録のシードで実行の印つきの名前で登録した。");
});

/** カード名(日)・(英)の検索語（実行の印つき） */
export const FG002語 = () => rc("M1403-FG002-Card");

defineSeed("S-M14-03-FGDECK-002", { needs: ["S-M14-04-MASTER", "S-M14-03-FGENV"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const 英の正本 = "M1403-FG002-Card";
    const 日 = rc(英の正本), 英 = rc(英の正本);
    const c = await 画面でカードを作る(page, { 日, 英, マナ: "0", 詳細数: 1 }, seed.シードID);
    const アーキタイプ = await アーキタイプを登録する(page, { 名日: "M1403-FG-ARC", 名英: "M1403-FG-ARC", フォーマット: FMT }, issue);
    const デッキID = await デッキを登録する(page, {
      デッキタイプ: "ユーザーデッキ", フォーマット: FMT, アーキタイプ名: アーキタイプ, 公開: "非公開",
      イベント名日: "M1403-FG002-Deck", イベント名英: "M1403-FG002-Deck", 開催日: "2026/01/01 00:00", メイン: [{ 枚数: 1, カード名: 英の正本 }],
    }, issue);
    const 明細 = デッキの明細(デッキID).filter((r) => r.カードID === c.カードID);
    if (明細.length !== 1) throw new Error(`${seed.シードID}: デッキID ${デッキID} に、カードID ${c.カードID} のデッキ明細が1件でない（${明細.length}件）`);
    if (カードに紐づく商品の数(c.カードID) !== 0) throw new Error(`${seed.シードID}: カードID ${c.カードID} に商品が紐づいている`);
    notes.set("〔カードID-M1403-002〕", c.カードID);
    notes.set("〔デッキID-M1403-002〕", デッキID);
    issue(`カード名(日)・(英)は実行の印つき（${日}・${英}）。デッキ名は画面のイベント名の欄に印つきで入れた（${rc("M1403-FG002-Deck")}）。開催日はシード表に無いので 2026/01/01 00:00 にした`);
    issue("デッキ名「M1403-FG002-Deck」の欄は、デッキ登録画面の名前の欄（イベント名）に入れた。デッキ一覧でのデッキIDの確認は、登録後の編集画面のアドレスの番号で代えた");
  });
});
