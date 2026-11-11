/**
 * M08-01 会員検索一覧の画面シード。正本: cases/M08-01_seed_data.tsv
 *
 * - 管理者（ADM）: メンバー管理で登録する（権限は会員管理を操作できる「システム管理者」）。
 * - 検索パターン: 会員検索一覧(検索入力)画面で検索条件保存・検索パターン削除で作る・消す。検索パターンは店舗に1組で共有されるので、
 *   「全件削除」「同じ名称を0件」のシードは、消してよい名前（このシードたちが作る名前）だけを消す。ほかの名前のパターン（開発用のデータ）が見つかったら、消さずに止める。
 *   名前で選ぶ034・036・037のパターン名には、実行の印を付ける（前の実行の残りと取り違えない）。
 * - 会員（DELETE・CBALREADY）: フロントの会員登録で作り、会員一覧のメールアドレス検索で会員IDを控える。メールアドレスの前半には実行の印を付ける。
 */
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { query } from "../lib/db";
import { rc } from "../lib/run_marker";
import { defineSeed, reportCurrentSeedIssue } from "./current_seed";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { M08CustomerListPage } from "../pages/admin/m08_customer_list";
import { ensureM08Admin } from "../pages/admin/m08_common";
import { M08CustomerEditPage } from "../pages/admin/m08_customer_edit";
import { M08登録値 } from "../pages/front/m08_member";
import { 会員の値を設定する, 会員を写す, 買取を足す, 購入を足す, 登録日時を1分間隔にする, 商品一覧用の検索パターンを足す } from "../db/m08_01_write";
import { 会員を登録する, 管理画面で会員を整える, mailOf } from "./m08-common";

export const M0801_ADMIN: Account = { loginId: "m0801_admin", password: "Passw0rd!M0801" };

defineSeed("S-M08-01-ADM", async ({ browser }) => { await ensureM08Admin(browser, "M08-01試験管理者", M0801_ADMIN); });

/** このシードたちが作る名前（消してよい） */
const 消してよい名前 = /^(条件なしパターン|退会理由検索|あ+|退会理由パターン-\d{3}[AB]?(-[0-9A-Z]+)?|退会理由更新(-\d{3})?|会員A検索(-[0-9A-Z]+)?)$/;

async function 管理者の画面(browser: Browser, fn: (page: Page, list: M08CustomerListPage) => Promise<void>): Promise<void> {
  await withAdminSession(browser, M0801_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await fn(page, new M08CustomerListPage(page));
  });
}

/** 検索パターン欄にあるパターンのうち、条件に合うものを1つずつ選んで削除する（合わないものがあれば条件の外として返す） */
async function パターンを消す(list: M08CustomerListPage, 消す: (名前: string) => boolean): Promise<void> {
  for (let i = 0; i < 100; i++) {
    await list.open();
    const names = await list.patternLinkNames();
    const target = names.find(消す);
    if (target === undefined) return;
    await list.selectPattern(target);
    await list.deletePattern();
  }
  throw new Error("検索パターンを消しきれない");
}
async function 条件の外が無いこと(list: M08CustomerListPage, 消す: (名前: string) => boolean): Promise<void> {
  await list.open();
  const rest = (await list.patternLinkNames()).filter((n) => !消す(n));
  const ng = rest.filter((n) => !消してよい名前.test(n));
  if (ng.length) throw new Error(`会員一覧用の検索パターンに、このシードが作った名前でないもの（開発用のデータ）がある: ${ng.join("、")}。消さずに止める`);
}

async function 全件を消す(browser: Browser): Promise<void> {
  await 管理者の画面(browser, async (_page, list) => {
    await list.open();
    const names = await list.patternLinkNames();
    const ng = names.filter((n) => !消してよい名前.test(n));
    if (ng.length) throw new Error(`会員一覧用の検索パターンに、このシードが作った名前でないもの（開発用のデータ）がある: ${ng.join("、")}。消さずに止める`);
    await パターンを消す(list, () => true);
  });
}

async function 名前を0件にする(browser: Browser, 一致: (名前: string) => boolean): Promise<void> {
  await 管理者の画面(browser, async (_page, list) => {
    await パターンを消す(list, 一致);
    // 同じ名前が表示されなくなったことを確かめる
    await list.open();
    const left = (await list.patternLinkNames()).filter(一致);
    if (left.length) throw new Error(`同じ名称の検索パターンが消えない: ${left.join("、")}`);
  });
}

async function パターンを作る(browser: Browser, 名前: string, 退会区分: string | undefined): Promise<string> {
  let id = "";
  await 管理者の画面(browser, async (_page, list) => {
    await list.open();
    await list.savePattern(名前, 退会区分);
    await list.open();
    id = await list.selectPattern(名前);
    if (!id) throw new Error(`検索パターン「${名前}」を押しても検索パターンIDがアドレスに出ない`);
  });
  return id;
}

defineSeed("S-M08-01-PATTERN-024", async ({ browser }) => { await 名前を0件にする(browser, (n) => n === "条件なしパターン"); });
defineSeed("S-M08-01-PATTERN-025", async ({ browser }) => { await 名前を0件にする(browser, (n) => n === "退会理由検索"); });
defineSeed("S-M08-01-PATTERN-029", async ({ browser }) => { await 名前を0件にする(browser, (n) => /^あ+$/.test(n)); });

defineSeed("S-M08-01-PATTERN-031", async ({ browser, notes }) => {
  await 全件を消す(browser);
  notes.set("〔検索パターンID-M0801-031〕", await パターンを作る(browser, "退会理由パターン-031", "不正利用"));
});
defineSeed("S-M08-01-PATTERN-060", async ({ browser, notes }) => {
  await 全件を消す(browser);
  notes.set("〔検索パターンID-M0801-060A〕", await パターンを作る(browser, "退会理由パターン-060A", "不正利用"));
  notes.set("〔検索パターンID-M0801-060B〕", await パターンを作る(browser, "退会理由パターン-060B", "不正利用"));
});
defineSeed("S-M08-01-PATTERN-061", async ({ browser, notes }) => {
  await 全件を消す(browser);
  notes.set("〔検索パターンID-M0801-061A〕", await パターンを作る(browser, "退会理由パターン-061A", "不正利用"));
  notes.set("〔検索パターンID-M0801-061B〕", await パターンを作る(browser, "退会理由パターン-061B", "不正利用"));
});

/** 名前で選ぶパターン（実行の印つきの名前）。シード表の「検索パターンID=83400001」は画面で指定できないので、画面が振るIDを控える */
export const 名前034 = (): string => rc("退会理由パターン-034");
export const 名前036 = (): string => rc("退会理由パターン-036");
export const 名前037 = (): string => rc("退会理由パターン-037");
defineSeed("S-M08-01-PATTERN-034", async ({ browser, notes }) => {
  notes.set("〔検索パターンID-M0801-034〕", await パターンを作る(browser, 名前034(), "不正利用"));
});
defineSeed("S-M08-01-PATTERN-036", async ({ browser, notes }) => {
  notes.set("〔検索パターンID-M0801-036〕", await パターンを作る(browser, 名前036(), "不正利用"));
});
defineSeed("S-M08-01-PATTERN-037", async ({ browser, notes }) => {
  notes.set("〔検索パターンID-M0801-037〕", await パターンを作る(browser, 名前037(), undefined));
  // 検索パターンID 999999は未登録であること（あれば削除、とシード表は定めるが、開発用のデータかもしれないので消さずに止める）
  await 管理者の画面(browser, async (page) => {
    const res = await page.goto(adminUrl("/customer/pattern/999999"), { timeout: 60_000 });
    if (res?.status() === 200) throw new Error("検索パターンID 999999が登録済み（開発用のデータの恐れがあるので消さずに止める）");
  });
});

for (const k of ["054", "055"]) {
  defineSeed(`S-M08-01-DELETE-${k}`, async ({ browser, notes }) => {
    await 会員を登録する(browser, notes, `m0801-del-${k}`, { 姓: "削除対象", 名: `会員-${k}`, セイ: "サクジョ", メイ: "タイショウ" }, `〔会員ID-M0801-${k}〕`);
  });
}
defineSeed("S-M08-01-CBALREADY-062", async ({ browser, notes }) => {
  await 会員を登録する(browser, notes, "cbm0801-062", { 姓: "削除済み確認", 名: "M0801-062", セイ: "サクジョズミ", メイ: "カクニン" }, "〔会員ID-M0801-062〕");
});

// =====================================================================================================
// ここから: 残りのケース（002〜053・056・059）のシード（2026-11-11 追加。依頼者方針 2026-11-10）
//
// 読み替え（各シードの注記に残す）:
//  - 「既存の会員を0件にする」は行わない（共有の会員は消さない）。会員のメールアドレスに「実行の印つきの語」を含め、
//    ケースの検索語もその語にして、対象の会員だけに絞る。語は `検索語(ケース番号)`（例: m0801-010-<印>）。
//    「m0801@example.test」を検索語とする002・017は、`<語>@example.test` に当たる。
//  - 画面で作れない値（登録日・更新日・最終購入日・購入金額・回数・購入商品・買取）は、実行の印つきの会員に限り DB に書く（db/m08_01_write.ts）。
//  - 10〜50人の同じ形の会員は、1人目をフロントの会員登録で作り、残りは1人目を DB で写す（会員IDは小さい順）。
//  - 作らないシード: 021（12001件・大量）、043（顧客CSV出力項目の設定=共有の設定を書き換える）、052（メールの受信を確かめる）。
// =====================================================================================================
type 値 = Omit<M08登録値, "メール" | "パスワード"> & { パスワード?: string };
const 控えない = { set: (_k: string, _v: string): void => undefined };
const 標準 = (名: string, 姓 = "検索確認"): 値 => ({ 姓, 名, セイ: "ケンサク", メイ: "カクニン" });

/** メールアドレスに含める検索語（実行の印つき）。この語で検索すると、そのシードの会員だけが出る */
export const 検索語 = (k: string): string => rc(`m0801-${k}`);
/** 「m0801@example.test」に当たる検索語（002・017） */
export const 検索語メール = (k: string): string => `${検索語(k)}@example.test`;
/** 名前で選ぶ検索パターン（実行の印つき） */
export const 名前032 = (): string => rc("退会理由パターン-032");
export const 名前033 = (): string => rc("退会理由パターン-033");
export const 退会区分033 = (): string => rc("不正利用-033");
export const 名前026 = (): string => rc("会員A検索");
export const 商品パターン名032 = (): string => rc("商品検索パターン-032");
/** 009 の検索語（「deleted803」に当たる。削除済みの会員のメールアドレスだけが含む） */
export const 検索語009 = (): string => rc("deleted803-m0801-009");
/** 組の検索語（paging-m0801・maxpage-m0801・csv-m0801 などに当たる） */
export const 組の語 = (語頭: string, k: string): string => rc(`${語頭}-m0801-${k}`);
/** 026・028 の検索語（「alpha801」に当たる） */
export const 検索語alpha = (k: string): string => rc(`alpha801-${k}`);

const 読み替え = (): void => reportCurrentSeedIssue("会員を0件にする初期化は行わない（共有の会員は消さない）。会員のメールアドレスに実行の印つきの語を含め、ケースの検索語もその語にして、対象の会員だけに絞った");
const DB設定 = (内容: string[], 会員: string): void => { if (内容.length) reportCurrentSeedIssue(`DBで会員ID ${会員} の${内容.join("・")}を設定した（画面で入力できない値）`); };

/** 管理画面の会員登録/編集で整えて保存する（保存の成功を確かめる） */
async function 管理画面で整える(browser: Browser, 会員ID: string, 何: string, fn: (edit: M08CustomerEditPage) => Promise<void>): Promise<void> {
  await 管理画面で会員を整える(browser, 会員ID, async (edit) => {
    await fn(edit);
    await edit.登録する();
    const err = await edit.エラー文();
    if (err.length) throw new Error(`${何}: 保存できなかった: ${err.join(" / ")}`);
    if ((await edit.成功メッセージ()) === null) throw new Error(`${何}: 成功メッセージが表示されない`);
  });
}
async function 本人確認済みにする(browser: Browser, 会員ID: string): Promise<void> {
  await 管理画面で会員を整える(browser, 会員ID, async (edit) => { await edit.オンライン本人確認済みにする(); });
}
/** MTG Companion登録本名（名・姓の欄）を入れる。検索側が空白を除いて比べるので、名・姓の欄に分けて入れる */
async function MTG本名を入れる(browser: Browser, 会員ID: string, 名: string, 姓: string): Promise<void> {
  await 管理画面で整える(browser, 会員ID, "MTG Companion登録本名", async (edit) => { await edit.set("Player][firstNameEn", 名); await edit.set("Player][lastNameEn", 姓); });
}
/** 画面（会員一覧の削除）で会員を削除済みにする */
async function 画面で削除する(browser: Browser, 会員ID: string, メール: string): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const list = new M08CustomerListPage(page);
    await list.open();
    await list.searchMulti(メール);
    await list.削除リンクを押す(会員ID);
    await list.確認モーダルで削除する(会員ID);
  });
}
/** 同じ形の会員を前半の数だけ作る（1人目はフロントの会員登録、残りは1人目を DB で写す）。会員IDを小さい順に返す */
async function 同じ形の会員たち(browser: Browser, 前半: string[], v: 値): Promise<string[]> {
  const first = await 会員を登録する(browser, 控えない, 前半[0], v);
  const ids = [first.会員ID];
  for (let i = 1; i < 前半.length; i++) ids.push(会員を写す(first.会員ID, mailOf(前半[i])));
  if (前半.length > 1) reportCurrentSeedIssue(`DBで会員を${前半.length - 1}人、1人目の会員（会員ID ${first.会員ID}）を写して足した（同じ形の会員を画面で何十人も登録すると時間がかかるため）`);
  return ids;
}
const 文字 = (i: number): string => "abcdefghijklmnopqrstuvwxyz"[i];
const 大文字 = (i: number): string => "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[i];

// ---- 画面だけで足りるもの ----
defineSeed("S-M08-01-FREEWORD-002", async ({ browser, notes }) => {
  読み替え();
  await 会員を登録する(browser, notes, "alpha801-m0801-002", { 姓: "晴屋", 名: "太郎-002", セイ: "ハレヤ", メイ: "タロウ" }, "〔会員ID-M0801-002A〕");
  await 会員を登録する(browser, notes, "beta802-m0801-002", { 姓: "晴屋", 名: "花子-002", セイ: "ハレヤ", メイ: "ハナコ" }, "〔会員ID-M0801-002B〕");
  const c = await 会員を登録する(browser, notes, "deleted803-m0801-002", 標準("会員-002C"), "〔会員ID-M0801-002C〕");
  await 画面で削除する(browser, c.会員ID, c.メール);
});

defineSeed("S-M08-01-FREEWORD-009", async ({ browser, notes }) => {
  読み替え();
  await 会員を登録する(browser, notes, "plain-a-m0801-009", 標準("会員-009A"), "〔会員ID-M0801-009A〕");
  await 会員を登録する(browser, notes, "plain-b-m0801-009", 標準("会員-009B"), "〔会員ID-M0801-009B〕");
  const c = await 会員を登録する(browser, notes, "deleted803-m0801-009", 標準("会員-009C"), "〔会員ID-M0801-009C〕");
  await 画面で削除する(browser, c.会員ID, c.メール);
});

defineSeed("S-M08-01-LIST-017", async ({ browser, notes }) => {
  読み替え();
  await 会員を登録する(browser, notes, "alpha801-m0801-017", { 姓: "晴屋", 名: "太郎-017", セイ: "ハレヤ", メイ: "タロウ" }, "〔会員ID-M0801-017A〕");
  await 会員を登録する(browser, notes, "beta802-m0801-017", { 姓: "晴屋", 名: "花子-017", セイ: "ハレヤ", メイ: "ハナコ" }, "〔会員ID-M0801-017B〕");
  const c = await 会員を登録する(browser, notes, "deleted803-m0801-017", 標準("会員-017C"), "〔会員ID-M0801-017C〕");
  await 画面で削除する(browser, c.会員ID, c.メール);
});

defineSeed("S-M08-01-VALIDATE-015", async ({ browser, notes }) => {
  読み替え();
  await 会員を登録する(browser, notes, "m0801-015", 標準("会員-015"), "〔会員ID-M0801-015〕");
});
defineSeed("S-M08-01-NOTFOUND-016", async ({ browser, notes }) => {
  読み替え();
  await 会員を登録する(browser, notes, "present-m0801-016", { 姓: "存在", 名: "会員-016", セイ: "ソンザイ", メイ: "カイイン" }, "〔会員ID-M0801-016〕");
});
defineSeed("S-M08-01-PATTERN-026", async ({ browser, notes }) => {
  読み替え();
  reportCurrentSeedIssue("検索パターン名「会員A検索」は、前の実行の残りと取り違えないよう実行の印を付けた名前にした（名前を0件にする削除は行わない）。検索語alpha801も実行の印つき");
  await 会員を登録する(browser, notes, "alpha801-026", 標準("会員-026"), "〔会員ID-M0801-026〕");
});
defineSeed("S-M08-01-SEARCH-028", async ({ browser, notes }) => {
  読み替え();
  await 会員を登録する(browser, notes, "alpha801-028", 標準("会員-028"), "〔会員ID-M0801-028〕");
});

// ---- 検索条件（004・010〜013） ----
defineSeed("S-M08-01-FILTER-004", async ({ browser, notes }) => {
  読み替え();
  const m = await 会員を登録する(browser, notes, "m0801-004", { ...標準("会員-004"), 性別: "男性", 生年月日: ["1990", "6", "15"], 電話番号: "0312345678" }, "〔会員ID-M0801-004〕");
  await 管理画面で整える(browser, m.会員ID, "退会区分・MTG Companion登録本名", async (edit) => {
    await edit.set("close_reason", "BAN不正利用-004");
    await edit.set("Player][firstNameEn", "MtgTest");
    await edit.set("Player][lastNameEn", "Player-004");
  });
  await 本人確認済みにする(browser, m.会員ID);
  購入を足す(m.会員ID, "検索用商品M0801A004", "M0801-P001-004");
  買取を足す(m.会員ID, 2500);
  買取を足す(m.会員ID, 2500);
  DB設定(["購入商品・買取2件（買取総額5000・買取件数2）"], m.会員ID);
  DB設定(会員の値を設定する(m.会員ID, { 登録日: "2026-01-15 10:00", 更新日: "2026-02-15 10:00", 最終購入日: "2026-02-01 00:00", EC購入金額: 12000, EC購入回数: 3, スマレジ購入金額: 8000, スマレジ購入回数: 4 }), m.会員ID);
});

defineSeed("S-M08-01-FILTER-010", async ({ browser, notes }) => {
  読み替え();
  const a = await 会員を登録する(browser, notes, "a-m0801-010", { ...標準("会員-010A"), 性別: "男性" }, "〔会員ID-M0801-010A〕");
  await 本人確認済みにする(browser, a.会員ID);
  // 米国・大阪府: 米国の住所で登録し、管理画面の会員編集で都道府県を足す。仮会員のまま（本登録しない）
  const b = await 会員を登録する(browser, notes, "b-m0801-010", { ...標準("会員-010B"), 性別: "女性", 国: "United States", 郵便番号: "10001" }, "〔会員ID-M0801-010B〕", true);
  await 管理画面で整える(browser, b.会員ID, "都道府県", async (edit) => { await edit.選ぶ("address][pref", "大阪府"); });
});

defineSeed("S-M08-01-FILTER-011", async ({ browser, notes }) => {
  読み替え();
  const a = await 会員を登録する(browser, notes, "a-m0801-011", 標準("会員-011A"), "〔会員ID-M0801-011A〕");
  const b = await 会員を登録する(browser, notes, "b-m0801-011", 標準("会員-011B"), "〔会員ID-M0801-011B〕");
  DB設定(会員の値を設定する(a.会員ID, { 生年月日: "1990-06-15", 登録日: "2026-01-15 10:00", 更新日: "2026-02-15 10:00", 最終購入日: "2026-02-01 00:00" }), a.会員ID);
  DB設定(会員の値を設定する(b.会員ID, { 生年月日: "1980-01-01", 登録日: "2025-01-01 10:00", 更新日: "2025-02-01 10:00", 最終購入日: "2025-03-01 00:00" }), b.会員ID);
});

defineSeed("S-M08-01-FILTER-012", async ({ browser, notes }) => {
  読み替え();
  const a = await 会員を登録する(browser, notes, "a-m0801-012", 標準("会員-012A"), "〔会員ID-M0801-012A〕");
  await 会員を登録する(browser, notes, "b-m0801-012", 標準("会員-012B"), "〔会員ID-M0801-012B〕");
  // 買取総額5000・買取件数2: 査定金額2500の買取を2件。会員 B は買取なし・各金額と回数0（登録したまま）
  買取を足す(a.会員ID, 2500);
  買取を足す(a.会員ID, 2500);
  DB設定(["買取2件（買取総額5000・買取件数2）"], a.会員ID);
  DB設定(会員の値を設定する(a.会員ID, { EC購入金額: 12000, EC購入回数: 3, スマレジ購入金額: 8000, スマレジ購入回数: 4 }), a.会員ID);
});

defineSeed("S-M08-01-FILTER-013", async ({ browser, notes }) => {
  読み替え();
  reportCurrentSeedIssue("MTG Companion登録本名は、検索側が空白を除いて比べるため、名の欄に「MtgTest」・姓の欄に「Player-013」と分けて入れた（つなげると「MtgTestPlayer-013」）");
  const a = await 会員を登録する(browser, notes, "a-m0801-013", { ...標準("会員-013A"), 電話番号: "0312345678" }, "〔会員ID-M0801-013A〕");
  const b = await 会員を登録する(browser, notes, "b-m0801-013", { ...標準("会員-013B"), 電話番号: "0699999999" }, "〔会員ID-M0801-013B〕");
  await MTG本名を入れる(browser, a.会員ID, "MtgTest", "Player-013");
  await MTG本名を入れる(browser, b.会員ID, "Other", "Player-013");
  購入を足す(a.会員ID, "検索用商品A-M0801013", "M0801-P001-013");
  購入を足す(b.会員ID, "対象外商品-013", "M0801-X013");
  DB設定(["購入商品・商品コード"], `${a.会員ID}・${b.会員ID}`);
});

// ---- ページング（018〜023）。同じ形の会員を DB で写して増やす ----
type 組 = { k: string; 語頭: string; 人数: number };
function 組を作る(seedId: string, 組: 組, 呼び名: (i: number) => string | null, 後始末?: () => void): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    読み替え();
    const 前半 = Array.from({ length: 組.人数 }, (_, i) => `${組.人数 > 26 ? String(i + 1).padStart(2, "0") : 文字(i)}-${組.語頭}-m0801-${組.k}`);
    const ids = await 同じ形の会員たち(browser, 前半, 標準(`会員-${組.k}`));
    ids.forEach((id, i) => { const l = 呼び名(i); if (l) notes.set(l, id); });
    後始末?.();
  });
}
組を作る("S-M08-01-PAGING-018", { k: "018", 語頭: "maxpage", 人数: 51 }, (i) => (i === 0 ? "〔会員ID-M0801-018-01〕" : i === 50 ? "〔会員ID-M0801-018-51〕" : null));
for (const k of ["019", "020", "022"]) {
  組を作る(`S-M08-01-PAGING-${k}`, { k, 語頭: "paging", 人数: 11 }, (i) => (i === 0 ? `〔会員ID-M0801-${k}A〕` : i === 10 ? `〔会員ID-M0801-${k}K〕` : null));
}
for (const k of ["023", "041"]) {
  組を作る(`S-M08-01-PAGING-${k}`, { k, 語頭: "paging", 人数: 11 }, (i) => (i === 0 ? `〔会員ID-M0801-${k}A〕` : i === 10 ? `〔会員ID-M0801-${k}K〕` : null), () => {
    const n = 登録日時を1分間隔にする(組の語("paging", k), "2026-01-01 09:00");
    reportCurrentSeedIssue(`DBで会員${n}人の登録日時を会員ID順に1分間隔にした（2026-01-01 09:01から）`);
  });
}

// ---- 検索パターン（032・033） ----
defineSeed("S-M08-01-PATTERN-032", async ({ browser, notes }) => {
  reportCurrentSeedIssue("検索パターン名は前の実行の残りと取り違えないよう実行の印を付けた名前にした。検索パターンID 83200002は画面で指定できないので、商品一覧用の検索パターン（名前に印つき）を DB で足した（商品一覧の画面に検索パターンの保存が無い）");
  notes.set("〔検索パターンID-M0801-032〕", await パターンを作る(browser, 名前032(), rc("不正利用-032")));
  商品一覧用の検索パターンを足す(名前032(), 商品パターン名032());
});

defineSeed("S-M08-01-PATTERN-033", async ({ browser, notes }) => {
  読み替え();
  reportCurrentSeedIssue("退会区分「不正利用」は、ほかの会員と取り違えないよう実行の印を付けた「不正利用-033-<印>」にした（検索パターンの退会区分も同じ値）");
  const a = await 会員を登録する(browser, notes, "a-fraud-m0801-033", 標準("会員-033A"), "〔会員ID-M0801-033A〕");
  await 管理画面で整える(browser, a.会員ID, "退会区分", async (edit) => { await edit.set("close_reason", 退会区分033()); });
  const 前半 = Array.from({ length: 11 }, (_, i) => `${文字(i)}-paging-m0801-033`);
  const ids = await 同じ形の会員たち(browser, 前半, 標準("会員-033B"));
  notes.set("〔会員ID-M0801-033B〕", ids[0]);
  notes.set("〔会員ID-M0801-033L〕", ids[10]);
  notes.set("〔検索パターンID-M0801-033〕", await パターンを作る(browser, 名前033(), 退会区分033()));
});

// ---- CSV・遷移（040〜050・059） ----
function 三人組(seedId: string, k: string, 語頭: string, 氏名?: [string, string][]): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    読み替え();
    for (let i = 0; i < 3; i++) {
      const v: 値 = 氏名 ? { 姓: 氏名[i][0], 名: 氏名[i][1], セイ: "ハレヤ", メイ: ["イチロウ", "ジロウ", "サブロウ"][i] } : 標準(`会員-${k}${大文字(i)}`);
      await 会員を登録する(browser, notes, `${文字(i)}-${語頭}-m0801-${k}`, v, `〔会員ID-M0801-${k}${大文字(i)}〕`);
    }
  });
}
for (const k of ["040", "042", "044", "045", "046"]) 三人組(`S-M08-01-CSV-${k}`, k, "csv");
三人組("S-M08-01-CSV-059", "059", "csv", [["晴屋", "一郎-059"], ["晴屋", "二郎-059"], ["晴屋", "三郎-059"]]);

for (const [k, 姓, 名] of [["047", "遷移確認", "会員-047"], ["048", "編集確認", "会員-048"], ["049", "履歴確認", "会員-049"], ["050", "通知確認", "会員-050"]] as const) {
  defineSeed(`S-M08-01-CSV-${k}`, async ({ browser, notes }) => {
    読み替え();
    await 会員を登録する(browser, notes, `csv-m0801-${k}`, { 姓, 名, セイ: "カクニン", メイ: "カイイン" }, `〔会員ID-M0801-${k}〕`);
  });
}

// ---- 仮会員（051・053）・削除（056） ----
defineSeed("S-M08-01-STATUS-051", async ({ browser, notes }) => {
  読み替え();
  await 会員を登録する(browser, notes, "a-m0801-051", 標準("会員-051", "仮登録"), "〔会員ID-M0801-051A〕", true);
  await 会員を登録する(browser, notes, "b-m0801-051", 標準("会員-051", "本登録"), "〔会員ID-M0801-051B〕");
});
defineSeed("S-M08-01-PROVISIONAL-MAIL-053", async ({ browser, notes }) => {
  reportCurrentSeedIssue("メールアドレス provisional-m0801-053@example.test には、前の実行の残りと取り違えないよう実行の印を付けた。同宛先の受信メール0件の準備は行わない（メールの受信を確かめないため）");
  await 会員を登録する(browser, notes, "provisional-m0801-053", { 姓: "仮登録", 名: "花子-053", セイ: "カリトウロク", メイ: "ハナコ" }, "〔会員ID-M0801-053〕", true);
});
defineSeed("S-M08-01-DELETE-056", async ({ browser, notes }) => {
  await 会員を登録する(browser, notes, "m0801-del-056", { 姓: "表示後削除", 名: "会員-056", セイ: "ヒョウジゴサクジョ", メイ: "カイイン" }, "〔会員ID-M0801-056〕");
});

// ---- 共有の設定（読むだけ。共有のマスタ・設定は書き換えない） ----
defineSeed("S-M08-01-DISPLAY", async () => {
  const 件数 = query("select name from mtb_page_max").map((r) => String(r.name));
  const 無い = ["10", "50"].filter((n) => !件数.includes(n));
  if (無い.length) throw new Error(`表示件数のマスタに ${無い.join("・")} が無い（共有のマスタに試験の値を足さないので、ここで止める。マスタ: ${件数.join("、")}）`);
  if (件数.includes("11")) throw new Error("表示件数のマスタに11がある（共有のマスタを書き換えないので、ここで止める）");
  reportCurrentSeedIssue("表示件数のマスタ（共有）は書き換えず、10・50があり11が無いことを確かめた。12000は使うケース（021）を実装していないので確かめていない");
});
defineSeed("S-M08-01-CSV-CONFIG", async () => {
  reportCurrentSeedIssue("顧客CSV出力項目の設定（共有の設定）は書き換えず、いまの設定のまま使った。会員IDの列が出力される設定であることを前提にする");
});
