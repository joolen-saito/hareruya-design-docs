/**
 * M08-14 仮会員メール再送。正本: cases/M08-14_test_cases.tsv
 * 実装しないケース: 003（宛先のTo）・004（Bcc）・005（差出人・返信先・返送先）= メールの受信画面が開発環境に無く、宛先・ヘッダを確かめられない。
 *   024 = 件名を「【編集後】…」に書き換えた共有のメールテンプレートが要る（共有の設定を書き換えない）。
 * 実装したケースのうち、メールの受信を確かめる手順（012・014・016・017・021・023）は、メール受信確認画面が無いので、会員の送信履歴（メールを送ると記録される）で確かめた。
 * 件名は店舗基本情報・メールテンプレート（共有の設定。書き換えない）の、いまの値と照らし合わせる（記録の件名は「[店名] テンプレートの件名」）。
 * 手順の「開発者ツールで…を変更する」は、再送リンクの属性（送信先の会員ID・なりすまし対策の値）をブラウザ上で書き換えて表した。
 * 記録の確認は、ブラウザ+DB確認のケース以外でも、メールが送られたことの確認にDBの参照（SELECT）を使う（017）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { DBの現在時刻, 会員の送信履歴, 送信履歴の件数 } from "../../db/m08_02";
import { 会員レコード全体 } from "../../db/m08_04";
import { 仮会員メールのテンプレート, 全会員の送信履歴の件数, 店名, 本登録用シークレット, 履歴のテンプレートと店名 } from "../../db/m08_14";
import { M08CustomerListPage } from "../../pages/admin/m08_customer_list";
import { M08MailHistoryPage } from "../../pages/admin/m08_customer_mail";
import { M0814ResendPage } from "../../pages/admin/m08_14_resend";
import { M0814_ADMIN, M0814_RH_ADMIN, メール022, 検索語020 } from "../../seeds/m08-14";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const isListPath = (p: string) => /^\/admin\/customer(\/page\/\d+)?\/?$/.test(p);
const 日付 = (): string => new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

/** 結果の行のサブメニュー（…）を開き、再送リンクが見えるか */
async function サブメニューを開いて再送リンクを見る(r: M0814ResendPage, id: string): Promise<boolean> {
  await r.サブメニューを開く(id);
  return r.再送リンクが見える(id);
}

/** 会員検索一覧で会員IDを検索して、再送リンクを押し、確認のモーダルの送信を押す（再送の1回分） */
async function 検索して再送する(list: M08CustomerListPage, r: M0814ResendPage, id: string): Promise<number> {
  await list.open();
  await list.searchMulti(id);
  await r.サブメニューを開く(id);
  await r.再送リンクを押す(id);
  return r.送信して応答を読む(id);
}

// ---- 再送リンクの表示 ----
caseTest("IT-M08-14-001", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0814-共有仮会員〕");
  await loginAdmin(page, M0814_ADMIN);
  const list = new M08CustomerListPage(page);
  const r = new M0814ResendPage(page);
  let 見える = false;
  await step(1, async () => { await list.open(); await list.searchMulti(id); });
  await step(2, async () => { 見える = await サブメニューを開いて再送リンクを見る(r, id); });
  await expected(async () => {
    expect.soft(見える, `会員ID ${id} のサブメニューに仮会員メール再送リンクが表示される`).toBe(true);
  });
});

caseTest("IT-M08-14-002", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0814-共有本会員〕");
  await loginAdmin(page, M0814_ADMIN);
  const list = new M08CustomerListPage(page);
  const r = new M0814ResendPage(page);
  let 見える = true;
  await step(1, async () => { await list.open(); await list.searchMulti(id); });
  await step(2, async () => { 見える = await サブメニューを開いて再送リンクを見る(r, id); });
  await expected(async () => {
    expect.soft(見える, `会員ID ${id} のサブメニューに仮会員メール再送リンクが表示されない`).toBe(false);
  });
});

// ---- 再送の結果 ----
caseTest("IT-M08-14-008", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0814-008〕");
  await loginAdmin(page, M0814_ADMIN);
  const list = new M08CustomerListPage(page);
  const r = new M0814ResendPage(page);
  let 前 = 0, 前の時刻 = 0;
  let 後: ReturnType<typeof 会員の送信履歴> = [];
  await step(1, async () => { 前 = 送信履歴の件数(id); 前の時刻 = DBの現在時刻(); });
  await step(2, async () => { await list.open(); await list.searchMulti(id); });
  await step(3, async () => { await r.サブメニューを開く(id); await r.再送リンクを押す(id); });
  await step(4, async () => { note("確認の「OK」は、画面内の確認モーダルの「送信」を押した"); await r.送信して応答を読む(id); });
  await step(5, async () => { 後 = 会員の送信履歴(id); });
  await expected(async () => {
    expect.soft(後.length, "送信履歴の件数（再送前から1件増える）").toBe(前 + 1);
    const h = 後[後.length - 1];
    const t = h ? 履歴のテンプレートと店名(h.履歴ID) : undefined;
    expect.soft(h?.会員ID, "送信履歴の対象会員").toBe(id);
    expect.soft(t?.テンプレート名, "送信履歴の使用したテンプレート").toBe("【販売/日】仮会員登録");
    expect.soft(h?.件名, "送信履歴の件名（[店名] テンプレートの件名）").toBe(`[${t?.店名}] ${t?.テンプレート件名}`);
    expect.soft((h?.件名 ?? "").length, "送信履歴の件名が空でない").toBeGreaterThan(0);
    expect.soft((h?.本文 ?? "").length, "送信履歴の本文が空でない").toBeGreaterThan(0);
    expect.soft(h?.送信日時 ?? 0, "送信日時が再送の操作の後").toBeGreaterThanOrEqual(前の時刻 - 5);
    expect.soft(h?.送信日時 ?? 0, "送信日時が現在以前").toBeLessThanOrEqual(DBの現在時刻() + 5);
    expect.soft(h?.作成者ID, "操作した管理者が記録されない").toBeNull();
  });
});

caseTest("IT-M08-14-009", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0814-009〕");
  await loginAdmin(page, M0814_ADMIN);
  const list = new M08CustomerListPage(page);
  const r = new M0814ResendPage(page);
  let 前 = "", 後 = "";
  await step(1, async () => { 前 = 会員レコード全体(id); });
  await step(2, async () => { await list.open(); await list.searchMulti(id); });
  await step(3, async () => { await r.サブメニューを開く(id); await r.再送リンクを押す(id); });
  await step(4, async () => { note("確認の「OK」は、画面内の確認モーダルの「送信」を押した"); await r.送信して応答を読む(id); });
  await step(5, async () => { 後 = 会員レコード全体(id); });
  await expected(async () => {
    expect.soft(前.length, "再送前の会員データを読めた").toBeGreaterThan(0);
    expect.soft(後, `会員ID ${id} の会員データが再送前から更新されない`).toBe(前);
  });
});

caseTest("IT-M08-14-010", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0814-010〕");
  await loginAdmin(page, M0814_ADMIN);
  const list = new M08CustomerListPage(page);
  const r = new M0814ResendPage(page);
  await step(1, async () => { await list.open(); await list.searchMulti(id); });
  await step(2, async () => { await r.サブメニューを開く(id); await r.再送リンクを押す(id); });
  await step(3, async () => { note("確認の「OK」は、画面内の確認モーダルの「送信」を押した"); await r.送信して応答を読む(id); });
  await expected(async () => {
    expect.soft(isListPath(new URL(page.url()).pathname), `会員一覧画面へ遷移（${new URL(page.url()).pathname}）`).toBe(true);
    expect.soft(await list.form.isVisible(), "会員検索一覧の検索欄が表示されている").toBe(true);
  });
});

// ---- 書き換えた再送要求 ----
caseTest("IT-M08-14-011", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0814-共有仮会員〕");
  await loginAdmin(page, M0814_ADMIN);
  const list = new M08CustomerListPage(page);
  const r = new M0814ResendPage(page);
  let 応答 = 0;
  await step(1, async () => { await list.open(); await list.searchMulti(id); });
  await step(2, async () => { await r.サブメニューを開く(id); });
  await step(3, async () => { await r.なりすまし対策の値を書き換える(id, "invalid-token"); });
  await step(4, async () => { await r.再送リンクを押す(id); });
  await step(5, async () => { note("確認の「OK」は、画面内の確認モーダルの「送信」を押した"); 応答 = await r.送信して応答を読む(id); });
  await step(6, async () => { note(`再送要求の応答のHTTPステータスは、手順5で読んだ（${応答}）`); });
  await expected(async () => { expect.soft(応答, "再送要求のHTTPステータス").toBe(403); });
});

caseTest("IT-M08-14-012", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0814-共有仮会員〕");
  await loginAdmin(page, M0814_ADMIN);
  const list = new M08CustomerListPage(page);
  const r = new M0814ResendPage(page);
  let 前件数 = 0, 前データ = "", 後件数 = 0, 後データ = "";
  await step(1, async () => { 前件数 = 送信履歴の件数(id); 前データ = 会員レコード全体(id); });
  await step(2, async () => { await list.open(); await list.searchMulti(id); });
  await step(3, async () => { await r.サブメニューを開く(id); });
  await step(4, async () => { await r.なりすまし対策の値を書き換える(id, "invalid-token"); });
  await step(5, async () => { await r.再送リンクを押す(id); });
  await step(6, async () => { note("確認の「OK」は、画面内の確認モーダルの「送信」を押した"); await r.送信して応答を読む(id); });
  await step(7, async () => {
    note("開発環境にメール受信確認画面が無いので、再送メールが送られていないことは、会員の送信履歴（メールを送ると記録される）が増えないことで確かめた");
    後件数 = 送信履歴の件数(id); 後データ = 会員レコード全体(id);
  });
  await expected(async () => {
    expect.soft(後件数, `会員ID ${id} への再送メールと送信履歴が追加されない`).toBe(前件数);
    expect.soft(後データ, "会員データが再送前から更新されない").toBe(前データ);
  });
});

caseTest("IT-M08-14-013", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0814-共有仮会員〕");
  const 不存在 = notes.get("〔会員ID-M0814-共有不存在〕");
  await loginAdmin(page, M0814_ADMIN);
  const list = new M08CustomerListPage(page);
  const r = new M0814ResendPage(page);
  let 応答 = 0;
  await step(1, async () => { await list.open(); await list.searchMulti(id); });
  await step(2, async () => { await r.サブメニューを開く(id); });
  await step(3, async () => { await r.送信先の会員IDを書き換える(id, 不存在); });
  await step(4, async () => { await r.再送リンクを押す(id); });
  await step(5, async () => { note("確認の「OK」は、画面内の確認モーダルの「送信」を押した"); 応答 = await r.送信して応答を読む(id); });
  await step(6, async () => { note(`再送要求の応答のHTTPステータスは、手順5で読んだ（${応答}）`); });
  await expected(async () => { expect.soft(応答, "再送要求のHTTPステータス").toBe(404); });
});

caseTest("IT-M08-14-014", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0814-共有仮会員〕");
  const 不存在 = notes.get("〔会員ID-M0814-共有不存在〕");
  await loginAdmin(page, M0814_ADMIN);
  const list = new M08CustomerListPage(page);
  const r = new M0814ResendPage(page);
  let 前 = 0, 後 = 0;
  await step(1, async () => { 前 = 全会員の送信履歴の件数(); });
  await step(2, async () => { await list.open(); await list.searchMulti(id); });
  await step(3, async () => { await r.サブメニューを開く(id); });
  await step(4, async () => { await r.送信先の会員IDを書き換える(id, 不存在); });
  await step(5, async () => { await r.再送リンクを押す(id); });
  await step(6, async () => { note("確認の「OK」は、画面内の確認モーダルの「送信」を押した"); await r.送信して応答を読む(id); });
  await step(7, async () => {
    note("開発環境にメール受信確認画面が無いので、再送メールが送られていないことは、全会員の送信履歴の件数が増えないことで確かめた（共有の開発環境で、ほかの人がメールを送ると増えうる）");
    後 = 全会員の送信履歴の件数();
  });
  await expected(async () => {
    expect.soft(後, `会員ID ${不存在} への再送メールが送信されず、全会員の送信履歴件数が再送前から増えない`).toBe(前);
  });
});

caseTest("IT-M08-14-015", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0814-共有仮会員〕");
  const 退会 = notes.get("〔会員ID-M0814-共有退会〕");
  await loginAdmin(page, M0814_ADMIN);
  const list = new M08CustomerListPage(page);
  const r = new M0814ResendPage(page);
  let 応答 = 0;
  await step(1, async () => { await list.open(); await list.searchMulti(id); });
  await step(2, async () => { await r.サブメニューを開く(id); });
  await step(3, async () => { await r.送信先の会員IDを書き換える(id, 退会); });
  await step(4, async () => { await r.再送リンクを押す(id); });
  await step(5, async () => { note("確認の「OK」は、画面内の確認モーダルの「送信」を押した"); 応答 = await r.送信して応答を読む(id); });
  await step(6, async () => { note(`再送要求の応答のHTTPステータスは、手順5で読んだ（${応答}）`); });
  await expected(async () => { expect.soft(応答, "再送要求のHTTPステータス").toBe(404); });
});

caseTest("IT-M08-14-016", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0814-共有仮会員〕");
  const 退会 = notes.get("〔会員ID-M0814-共有退会〕");
  await loginAdmin(page, M0814_ADMIN);
  const list = new M08CustomerListPage(page);
  const r = new M0814ResendPage(page);
  let 前件数 = 0, 前データ = "", 後件数 = 0, 後データ = "";
  await step(1, async () => { 前件数 = 送信履歴の件数(退会); 前データ = 会員レコード全体(退会); });
  await step(2, async () => { await list.open(); await list.searchMulti(id); });
  await step(3, async () => { await r.サブメニューを開く(id); });
  await step(4, async () => { await r.送信先の会員IDを書き換える(id, 退会); });
  await step(5, async () => { await r.再送リンクを押す(id); });
  await step(6, async () => { note("確認の「OK」は、画面内の確認モーダルの「送信」を押した"); await r.送信して応答を読む(id); });
  await step(7, async () => {
    note("開発環境にメール受信確認画面が無いので、再送メールが送られていないことは、会員の送信履歴が増えないことで確かめた");
    後件数 = 送信履歴の件数(退会); 後データ = 会員レコード全体(退会);
  });
  await expected(async () => {
    expect.soft(前データ.length, "再送前の会員データを読めた").toBeGreaterThan(0);
    expect.soft(後件数, `会員ID ${退会} への再送メールと送信履歴が追加されない`).toBe(前件数);
    expect.soft(後データ, "会員データが再送前から更新されない").toBe(前データ);
  });
});

caseTest("IT-M08-14-017", async ({ page, notes, step, expected }) => {
  const a = notes.get("〔会員ID-M0814-017A〕");
  const b = notes.get("〔会員ID-M0814-017B〕");
  await loginAdmin(page, M0814_ADMIN);
  const list = new M08CustomerListPage(page);
  const r = new M0814ResendPage(page);
  let 前 = 0, 後 = 0;
  await step(1, async () => { 前 = 送信履歴の件数(b); await list.open(); await list.searchMulti(a); });
  await step(2, async () => { await r.サブメニューを開く(a); });
  await step(3, async () => { await r.送信先の会員IDを書き換える(a, b); });
  await step(4, async () => { await r.再送リンクを押す(a); });
  await step(5, async () => { note("確認の「OK」は、画面内の確認モーダルの「送信」を押した"); await r.送信して応答を読む(a); });
  await step(6, async () => {
    note("開発環境にメール受信確認画面が無いので、再送メールが送られたことは、会員ID " + b + " の送信履歴（メールを送ると記録される）が1件増えることで確かめた");
    後 = 送信履歴の件数(b);
  });
  await expected(async () => {
    expect.soft(後, `仮会員でない会員ID ${b} へ再送メールが送信される（送信履歴が1件増える）`).toBe(前 + 1);
  });
});

// ---- 一覧の中の行ごとの表示 ----
caseTest("IT-M08-14-020", async ({ page, notes, step, expected }) => {
  const a = notes.get("〔会員ID-M0814-020A〕");
  const b = notes.get("〔会員ID-M0814-020B〕");
  await loginAdmin(page, M0814_ADMIN);
  const list = new M08CustomerListPage(page);
  const r = new M0814ResendPage(page);
  let 行A = 0, 行B = 0, Aに = false, Bに = true;
  await step(1, async () => { note("検索語は、2人のメールアドレスに共通で含まれる、実行の印つきの dpm0814-020"); await list.open(); await list.searchMulti(検索語020()); });
  await step(2, async () => { 行A = await r.行の数(a); 行B = await r.行の数(b); });
  await step(3, async () => { Aに = await サブメニューを開いて再送リンクを見る(r, a); });
  await step(4, async () => { Bに = await サブメニューを開いて再送リンクを見る(r, b); });
  await expected(async () => {
    expect.soft([行A, 行B], "検索結果に会員ID 020A と 020B の2行が並ぶ").toEqual([1, 1]);
    expect.soft(Aに, `仮会員 ${a} のサブメニューに仮会員メール再送リンクが表示される`).toBe(true);
    expect.soft(Bに, `本会員 ${b} のサブメニューに仮会員メール再送リンクが表示されない`).toBe(false);
  });
});

caseTest("IT-M08-14-021", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0814-021〕");
  await loginAdmin(page, M0814_ADMIN);
  const list = new M08CustomerListPage(page);
  const r = new M0814ResendPage(page);
  let 前 = 0, 途中: string[] = [], 後: ReturnType<typeof 会員の送信履歴> = [];
  await step(1, async () => { 前 = 送信履歴の件数(id); });
  await step(2, async () => { await list.open(); await list.searchMulti(id); });
  await step(3, async () => { await r.サブメニューを開く(id); await r.再送リンクを押す(id); });
  await step(4, async () => {
    note("確認の「OK」は、画面内の確認モーダルの「送信」を押した");
    await r.送信して応答を読む(id);
    途中 = 会員の送信履歴(id).map((h) => h.履歴ID);
  });
  await step(5, async () => { await list.open(); await list.searchMulti(id); });
  await step(6, async () => { await r.サブメニューを開く(id); await r.再送リンクを押す(id); });
  await step(7, async () => { await r.送信して応答を読む(id); });
  await step(8, async () => { note("開発環境にメール受信確認画面が無いので、再送メールが2通送られたことは、送信履歴が2件になることで確かめた"); });
  await step(9, async () => { 後 = 会員の送信履歴(id); });
  await expected(async () => {
    expect.soft(後.length, `会員ID ${id} の送信履歴が2件（再送メール2通分）`).toBe(前 + 2);
    expect.soft(途中.length, "1回目の再送で送信履歴が1件になった").toBe(前 + 1);
    expect.soft(後.slice(0, 途中.length).map((h) => h.履歴ID), "1回目の再送の履歴を残したまま1件追加").toEqual(途中);
  });
});

// ---- 結合（022。専用の管理者） ----
caseTest("IT-M08-14-022", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0814-001〕");
  const メール = メール022();
  const t = 仮会員メールのテンプレート();
  const 件名 = t?.件名 ?? "";
  const list = new M08CustomerListPage(page);
  const r = new M0814ResendPage(page);
  const h = new M08MailHistoryPage(page);
  const 検索して履歴を開く = async (): Promise<void> => { await list.open(); await list.searchMulti(メール); await list.メール履歴を押す(id); };
  const 前日付 = 日付();
  let 前 = -1, 後 = -1, 完了 = false;
  let 行 = { 処理日: "", 通知メール: "" };
  let 窓 = { 件名: "", 本文: "" };
  await step(1, async () => { await loginAdmin(page, M0814_RH_ADMIN); });
  await step(2, async () => { await list.open(); await list.searchMulti(メール); });
  await step(3, async () => {
    note("件名は共有のメールテンプレートのいまの件名（正本の「【RH試験】仮会員登録完了001」は、共有の設定を書き換えないので使えない）。送信履歴の件名は先頭に店名が付くので、件名リンクは含む一致で探す");
    await list.メール履歴を押す(id); 前 = await h.件名の行の数(件名);
  });
  await step(4, async () => { await list.open(); await list.searchMulti(メール); await r.サブメニューを開く(id); await r.再送リンクを押す(id); });
  await step(5, async () => { note("確認の「OK」は、画面内の確認モーダルの「送信」を押した"); await r.送信して応答を読む(id); });
  await step(6, async () => { 完了 = isListPath(new URL(page.url()).pathname) && (await list.form.isVisible()); });
  await step(7, async () => {
    await 検索して履歴を開く();
    後 = await h.件名の行の数(件名);
    行 = await h.行の内容(件名);
    窓 = await h.件名を押してポップアップを読む(件名);
  });
  const 後日付 = 日付();
  await expected(async () => {
    expect.soft(件名.length, "メールテンプレートの件名を読めた").toBeGreaterThan(0);
    expect.soft(前, "再送前の、件名の行の数").toBe(0);
    expect.soft(完了, "メール再送の完了後に会員一覧へ遷移する").toBe(true);
    expect.soft(後, "再送後のメール配信履歴画面の、件名の行の数").toBe(1);
    expect.soft([前日付, 後日付].includes(行.処理日), `処理日が再送の当日（${前日付}）`).toBe(true);
    expect.soft(行.通知メール, "通知メールにテンプレート「【販売/日】仮会員登録」の件名").toBe(件名);
    expect.soft(窓.件名, "ポップアップの件名（先頭に店名が付く）").toContain(件名);
    expect.soft(窓.本文, "ポップアップの本文に会員の氏名（姓「再送」・名「花子」）").toMatch(/再送\s*花子/);
    expect.soft(窓.本文, "ポップアップの本文に本登録用URL").toContain(本登録用シークレット(id));
  });
});

// ---- 件名・本文（023。標準の件名） ----
caseTest("IT-M08-14-023", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0814-023〕");
  await loginAdmin(page, M0814_ADMIN);
  const list = new M08CustomerListPage(page);
  const r = new M0814ResendPage(page);
  let 前 = 0, 後: ReturnType<typeof 会員の送信履歴> = [];
  await step(1, async () => { 前 = 送信履歴の件数(id); await list.open(); await list.searchMulti(id); });
  await step(2, async () => { await r.サブメニューを開く(id); await r.再送リンクを押す(id); });
  await step(3, async () => { note("確認の「OK」は、画面内の確認モーダルの「送信」を押した。変更しない（送信先の会員ID・なりすまし対策の値はそのまま）"); await r.送信して応答を読む(id); });
  await step(4, async () => { note("開発環境にメール受信確認画面が無いので、再送メールの件名・本文は、会員の送信履歴に記録された送信内容で確かめた。件名は共有のメールテンプレートのいまの件名（書き換えない）"); 後 = 会員の送信履歴(id); });
  await step(5, async () => { 後 = 会員の送信履歴(id); });
  await expected(async () => {
    const h = 後[後.length - 1];
    const t = h ? 履歴のテンプレートと店名(h.履歴ID) : undefined;
    expect.soft(h?.件名, "再送メールの件名（[店名] テンプレートの件名）").toBe(`[${t?.店名 ?? 店名()}] ${t?.テンプレート件名}`);
    expect.soft(h?.本文, "本文に「仮登録 花子」").toMatch(/仮登録\s*花子/);
    expect.soft(h?.本文, `本文に会員ID ${id} の本登録用URL`).toContain(本登録用シークレット(id));
    expect.soft([前, 後.length], "会員の送信履歴が0件から1件になる").toEqual([0, 1]);
  });
});
