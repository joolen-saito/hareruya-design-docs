/**
 * M13-09 CSVダウンロード（イベント管理）のシード（画面操作）。正本: cases/M13-09_seed_data.tsv
 *
 * 作り方は、シード表の投入方法のとおり。シード表と違えたところ（解釈）:
 * - 店舗（S-M13-09-MASTER）: 「M1309-店舗X」「M1309-店舗Y」。あればそれを使い（店舗一覧のIDを控え直す）、無ければ店舗登録画面で登録する。
 *   店名(英語表記)「Shop X」「Shop Y」・支店URL「m1309shopx」「m1309shopy」・店名略称（3文字）「M9X」「M9Y」（シード表の例）。
 *   申込状況（決済中・入金待ち・申込済み・入金期限切れ）は既存のマスタ値を使う（登録しない）ので、イベント申込一覧の申込状況の選択肢にあることを確かめる。
 * - 管理者（S-M13-09-ADM）: 管理者ID は画面が振る番号のまま。権限は「モールオペレーター」で代える（「店舗オーナー」「店舗オペレーター」は
 *   所属店舗しか見えない。M13-06・M13-11・M13-12 と同じ）。所属店舗・既定表示店舗・編集可能店舗は店舗Xだけ。
 *   別のセッションでログインできることを確かめる（稼働中・ロックなし）。
 * - 会員: フロントの会員情報登録画面で登録する。本登録のメールを読めない環境では、共通の部品が管理画面で本会員にする（シード表は本登録しなくてよいとする）。
 *   メールアドレスの前半と、お名前(姓)（プレイヤー検索に入れる語）に実行の印を付ける。
 * - 決め打ちの識別の値（イベント名(日)・(英)）には実行の印を付ける（依頼者決定 2026-10-28）。ケースの手順のイベント名も印つきの値で読む。
 *   シード表の【再実行時】（あれば作り直さず使う）は、印で毎回新しく作るので当たらない。【確認】の「イベント名に M1309-0xx を含むイベントが1件」は、
 *   印つきのイベント名(日)で検索して確かめる。
 * - イベント: フォーマット「スタンダード」・ルール適用度「初心者歓迎」（任意の選択肢）、公開状態「公開」、定員16、参加費900。
 *   支払方法はシード表に値が無いが、参加費があるので「クレジットカード決済」を選ぶ（M13-12 と同じ）。
 *   日程: 開始時間 2030-04-01 10:00、受付なし・デッキ登録なし・オンライン受付なし。
 * - 日程の終了予定時刻（DB への直接の設定）は行わない（条件付き。022・023 のケースは終了予定時刻の値を確かめない。023 はヘッダ行だけを読む）。
 * - 申込プレイヤーID（画面に出ない番号）は、DB の参照（SELECT）で控える（シード表どおり。F07-04 の前例）。
 * - 023 の「CSV出力項目設定は初期投入のまま」は、共有の設定なので書き換えず、CSV出力項目設定画面でイベント申込CSVの出力する項目を読んでシードの注記に残す。
 *
 * 作らないシード（ケースを実装しない）: S-M13-09-INIT-017（支払番号・席順・DCIナンバー・終了予定時刻を DB へ直接設定し、ケースがその値を確かめる。
 * また CSV出力項目設定（共有の設定）を書き換えて戻す）。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { 申込の申込選手ID } from "../db/f07_04";
import { rc, RUN_MARK } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, hideDebugToolbar, withAdminSession } from "../lib/session";
import { registerEvent, searchEventIds } from "../pages/admin/event";
import { 会員IDをメールから } from "../pages/admin/f07_04_setup";
import { EntryListPage, 申込状況を変える } from "../pages/admin/m13_06_entry_list";
import { 出力する項目を読む } from "../pages/admin/m13_09_entry_csv";
import { EntryNewPage, 金額 } from "../pages/admin/m13_12_entry_new";
import { ensureMember } from "../pages/admin/member";
import { registerSchedule } from "../pages/admin/schedule";
import { ensureTenant } from "../pages/admin/tenant";
import { registerFrontMember } from "../pages/front/member_entry";

export const M1309_ADMIN: Account = { loginId: "m1309_admin", password: "Passw0rd!M1309" };
export const 店舗X = "M1309-店舗X";
export const 店舗Y = "M1309-店舗Y";
const 会員のパスワード = "Passw0rd!M1309M";
const 申込状況の値 = ["決済中", "入金待ち", "申込済み", "入金期限切れ"];

defineSeed("S-M13-09-MASTER", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(120_000);
    notes.set("〔店舗ID-M1309-共有A〕", await ensureTenant(page, { 店名: 店舗X, 店名カナ: "エムイチサンゼロキュウテンポエックス", 店名英語: "Shop X", 支店URL: "m1309shopx", 店名略称3文字: "M9X", ショップ名略称: 店舗X }, issue));
    notes.set("〔店舗ID-M1309-共有B〕", await ensureTenant(page, { 店名: 店舗Y, 店名カナ: "エムイチサンゼロキュウテンポワイ", 店名英語: "Shop Y", 支店URL: "m1309shopy", 店名略称3文字: "M9Y", ショップ名略称: 店舗Y }, issue));
    // 申込状況は既存のマスタ値を使う。イベント申込一覧の申込状況の選択肢にあることを確かめる（書き換えない）
    const list = new EntryListPage(page);
    await list.開く();
    const have = (await list.申込状況.locator("option").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
    const missing = 申込状況の値.filter((v) => !have.includes(v));
    if (missing.length) throw new Error(`${seed.シードID}: イベント申込一覧の申込状況の選択肢に「${missing.join("・")}」が無い（ある選択肢: ${have.join("・")}）`);
  });
});

defineSeed("S-M13-09-ADM", { needs: ["S-M13-09-MASTER"] }, async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await ensureMember(page, {
      名前: "M13-09試験管理者", 所属店舗: 店舗X, ログインID: M1309_ADMIN.loginId, メールアドレス: "m1309_admin@example.test",
      パスワード: M1309_ADMIN.password, 権限: "モールオペレーター", デフォルト検索表示店舗: 店舗X, 編集可能店舗: [店舗X],
    });
  });
  // ログインできる（稼働中・ロックなし）ことを、別のセッションで確かめる
  await withAdminSession(browser, M1309_ADMIN, async () => {});
  reportSeedIssue(seed.シードID, "管理者ID は画面が振る番号のまま使う。権限は「モールオペレーター」で代えた（所属店舗・既定表示店舗・編集可能店舗は M1309-店舗X だけ）");
});

/** 022・023 のイベント名(日)・(英)（実行の印つき）。ケースの手順のイベント名もこの値で読む */
export const イベント名 = (n: string) => rc(`M1309-${n}-EV`);
const イベント名英 = (n: string) => rc(`M1309-${n}-EV-EN`);

async function 会員を登録する(browser: Browser, 姓: string, メール: string): Promise<void> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await registerFrontMember(page, { 姓, 名: "一郎", セイ: "エムイチサンゼロキュウ", メイ: "イチロウ", メール, パスワード: 会員のパスワード });
  } finally {
    await context.close();
  }
}

/** 会員・イベント・日程・申込（入金待ち）を作り、呼び名を控える */
function defineEntryCsvSeed(seedId: string, n: string, 設定を読む: boolean): void {
  defineSeed(seedId, { needs: ["S-M13-09-ADM"] }, async ({ browser, notes, seed }) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    const 姓 = rc(`M1309検証${n}`);
    const メール = `m1309-${n}-01-${RUN_MARK}@example.test`.toLowerCase();
    await 会員を登録する(browser, 姓, メール);
    notes.set(`〔会員ID-M1309-${n}〕`, await withAdminSession(browser, SETUP_ADMIN, (page) => 会員IDをメールから(page, メール)));
    await withAdminSession(browser, M1309_ADMIN, async (page) => {
      page.setDefaultTimeout(120_000);
      const 名日 = イベント名(n);
      const id = await registerEvent(page, {
        イベント名日: 名日, イベント名英: イベント名英(n), 店舗: 店舗X, フォーマット: ["スタンダード"], ルール適用度: "初心者歓迎", 公開状態: "公開",
        定員: "16", 参加費: "900", 支払方法: ["クレジットカード決済"],
      });
      notes.set(`〔イベントID-M1309-${n}〕`, id);
      const 日程ID = await registerSchedule(page, id, { 開始時間: "2030-04-01 10:00", 受付あり: false, デッキ登録あり: false });
      issue("日程の終了予定時刻（2030-04-01 12:00）は DB への直接の設定なので行わなかった（条件付き。このシードを使うケースは終了予定時刻の値を確かめない）");
      // 申込
      const f = new EntryNewPage(page);
      await f.検索結果から開く(名日, 日程ID);
      await f.ポップアップを開く();
      await f.プレイヤーを検索する(姓);
      const rows = (await f.結果の行の中身()).filter((r) => r.名前.startsWith(姓));
      if (rows.length !== 1) throw new Error(`申込のプレイヤー検索「${姓}」で、お名前がその語で始まる行が ${rows.length} 行ある（1行のはず）`);
      await f.決定する(rows[0].ID);
      const 申込ID = await f.登録して申込IDを読む(`イベント申込（${名日}・${姓}）の登録`);
      notes.set(`〔イベント申込ID-M1309-${n}〕`, 申込ID);
      // 支払金額が900、支払会員が登録した会員であること
      const 金欄 = (await f.支払金額.count()) ? 金額(await f.支払金額.first().inputValue({ timeout: 10_000 }).catch(() => "")) : "";
      if (金欄 === "") issue("イベント申込詳細・編集画面に支払金額の入力欄が無く、支払金額を欄から読めなかった");
      else if (金欄 !== "900") throw new Error(`イベント申込詳細・編集画面の支払金額が「${金欄}」（900 のはず）`);
      const 本文 = await f.本文();
      if (!本文.includes(姓)) issue(`イベント申込詳細・編集画面の本文に、支払会員のお名前「${姓}」が見当たらない（支払会員の表示を確かめられなかった）`);
      notes.set(`〔申込プレイヤーID-M1309-${n}〕`, 申込の申込選手ID(申込ID));
      await 申込状況を変える(page, 申込ID, "入金待ち");
      // 確認: 印つきのイベント名(日)で検索して、このイベント1件だけ
      const ids = await searchEventIds(page, 名日);
      if (JSON.stringify(ids) !== JSON.stringify([id])) throw new Error(`イベント一覧で「${名日}」のイベントが ${ids.join("、") || "なし"}（${id} の1件だけのはず）`);
    });
    if (設定を読む) {
      const items = await withAdminSession(browser, SETUP_ADMIN, (page) => 出力する項目を読む(page, "イベント申込CSV")).catch((e: Error) => { issue(`CSV出力項目設定のイベント申込CSVを読めなかった（${e.message.split("\n")[0]}）`); return null; });
      if (items) issue(`CSV出力項目設定は共有の設定なので書き換えていない。いまのイベント申込CSVの出力する項目（${items.length}項目）: ${items.join("・")}`);
    }
  });
}
defineEntryCsvSeed("S-M13-09-FGCSV-022", "022", false);
defineEntryCsvSeed("S-M13-09-FGCSV-023", "023", true);
