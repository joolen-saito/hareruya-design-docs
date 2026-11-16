/**
 * M08-02 メール一括送信の画面シード。正本: cases/M08-02_seed_data.tsv
 * - 会員: フロントの会員登録で作り、管理画面の会員一覧のメールアドレス検索で会員IDを控える。メールアドレスの前半には実行の印を付ける。
 *   3人組（001・012）は、正本どおり会員IDが A＜B＜C の順になるよう、この順に登録する。会員ID 999999は未登録であること（あれば開発用のデータの恐れがあるので消さずに止める）。
 * 作らないシード: メール文字コードを iso-2022-jp にする環境（BASE-ISO。アプリの設定ファイルの値で、管理画面に項目が無い）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { defineSeed, reportCurrentSeedIssue } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { M08CustomerEditPage } from "../pages/admin/m08_customer_edit";
import { ensureM08Admin } from "../pages/admin/m08_common";
import { 会員を登録する, mailOf } from "./m08-common";
import { 会員の値を設定する, 会員を写す } from "../db/m08_01_write";
import { ポイントを付与する, 日付の文字列 } from "../pages/admin/f06_05_setup";
import { ShopBasicPage } from "../pages/admin/m10_01_shop";
import { 受け口を控える } from "../pages/admin/m05_06_mailbox";
import { 共有の書き換えを許す, 基本設定を控えて戻す登録 } from "./f08-05";

export const M0802_ADMIN: Account = { loginId: "m0802_admin", password: "Passw0rd!M0802" };
defineSeed("S-M08-02-ADM", async ({ browser }) => { await ensureM08Admin(browser, "M08-02試験管理者", M0802_ADMIN); });

/** 会員ID 999999が未登録であること */
async function 未登録を確かめる(browser: Browser): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const st = await new M08CustomerEditPage(page).open("999999");
    if (st === 200) throw new Error("会員ID 999999の会員がいる（開発用のデータの恐れがあるので消さずに止める）");
  });
}

/** 検索語（実行の印を含む）。会員検索一覧でこの語を検索すると、この組の会員だけが出る（会員のメールアドレスに含まれる） */
export const 検索語 = (k: string): string => rc(`m0802-${k}`);

const 姓名 = [
  { 姓: "青山", 名: "一郎", セイ: "アオヤマ", メイ: "イチロウ", 銀行: "customer100" },
  { 姓: "井上", 名: "二郎", セイ: "イノウエ", メイ: "ジロウ", 銀行: "customer200" },
  { 姓: "上田", 名: "三郎", セイ: "ウエダ", メイ: "サブロウ", 銀行: "customer300" },
] as const;

/** 3人組を A・B・C の順に登録する */
function 三人組(k: string, 名の後ろ: string) {
  return async ({ browser, notes }: { browser: Browser; notes: { set: (a: string, b: string) => void } }): Promise<void> => {
    for (let i = 0; i < 3; i++) {
      const p = 姓名[i];
      await 会員を登録する(browser, notes, `${p.銀行}-m0802-${k}`, { 姓: p.姓, 名: `${p.名}${名の後ろ}`, セイ: p.セイ, メイ: p.メイ }, `〔会員ID-M0802-${k}${"ABC"[i]}〕`);
    }
    await 未登録を確かめる(browser);
  };
}
defineSeed("S-M08-02-MEMBERS-001", 三人組("001", ""));
defineSeed("S-M08-02-MEMBERS-012", 三人組("012", "-012"));

function 一人(k: string, 名の後ろ: string) {
  defineSeed(`S-M08-02-MEMBERS-${k}`, async ({ browser, notes }) => {
    await 会員を登録する(browser, notes, `customer100-m0802-${k}`, { 姓: "青山", 名: `一郎${名の後ろ}`, セイ: "アオヤマ", メイ: "イチロウ" }, `〔会員ID-M0802-${k}〕`);
  });
}
一人("002", "-002");
一人("003", "-003");
一人("004", "");

// =====================================================================================================
// 読み替え（各シードの注記に残す）:
//  - 店舗基本設定（BASE-DEFAULT）: 共有の設定。夜に1本だけで流す回（E2E_ALLOW_SHARED=1）と手元の環境でだけ書き換える（2026-11-12 から）。
//    書き換える前に店舗基本設定の全項目を画面から控え（seeds/f08-05.ts の 基本設定を控えて戻す登録）、店名・メールアドレス1・3・4 だけを書き換える。
//    ケースの終わりに基盤（lib/shared_restore.ts）が画面で全項目を戻し、開き直して元の値と同じことを確かめる。
//    「メール文字コード設定なし」はアプリの設定ファイルの値で管理画面に項目が無い。書き換えず、変換しない既定のまま使う（026 は受け口のメールのソースで確かめる）。
//  - 受信メール（MAIL-CAPTURE）: 開発環境のメールの受け口（E2E_MAIL_URL）を読む。受信箱は消さない（ほかの方のメールもある）。
//    ケースの手順の前に受け口のメールの番号を控え、そのあとに会員のアドレス（実行の印つき）へ届いたものだけを数える。
//  - 更新日時・登録日時は画面で指定できないので、実行の印つきの会員に限り DB に書く（db/m08_01_write.ts）。
//  - 作らないシード: BASE-ISO（メール文字コード iso-2022-jp はアプリの設定ファイルの値で、管理画面で書き換えられない）。
// =====================================================================================================

/** 店舗基本設定の前提の値（シード表 S-M08-02-BASE-DEFAULT） */
export const M0802_店舗設定 = { 店名: "晴屋M0802店", 送信元: "shop-m0802@example.test", 返信先: "reply-m0802@example.test", 戻り先: "return-m0802@example.test" };

defineSeed("S-M08-02-BASE-DEFAULT", async ({ browser }) => {
  共有の書き換えを許す("店舗基本設定（店名・メールアドレス）");
  await 基本設定を控えて戻す登録(browser, "店舗基本設定（全項目。M08-02 の店名・メールアドレスを書き換える前）");
  const v = M0802_店舗設定;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const p = new ShopBasicPage(page);
    await p.入れて保存する("店舗基本設定（M08-02 の店名・メールアドレス）の書き換え", async () => {
      await p.入れる("店名", v.店名);
      await p.入れる("送信元メールアドレス", v.送信元);
      await p.入れる("返信先メールアドレス", v.返信先);
      await p.入れる("送信エラー通知メールアドレス", v.戻り先);
    });
    await p.open();
    const 今 = [await p.値("店名"), await p.値("送信元メールアドレス"), await p.値("返信先メールアドレス"), await p.値("送信エラー通知メールアドレス")];
    if (今.join("|") !== [v.店名, v.送信元, v.返信先, v.戻り先].join("|")) throw new Error(`店舗基本設定を書き換えたが、開き直した画面の値が違う（${今.join(" / ")}）`);
  });
  reportCurrentSeedIssue(`店舗基本設定の店名を「${v.店名}」、送信元メールアドレス（メールアドレス1）を ${v.送信元}、返信先メールアドレス（メールアドレス3）を ${v.返信先}、` +
    `送信エラー通知メールアドレス（メールアドレス4）を ${v.戻り先} にした（共有の設定。全項目を画面で控え、ケースの終わりに画面で戻して確かめる）`);
  reportCurrentSeedIssue("メール文字コードの設定はアプリの設定ファイルの値で、管理画面に項目が無いので書き換えていない（変換しない既定のまま）");
});
defineSeed("S-M08-02-MAIL-CAPTURE", async () => {
  const n = (await 受け口を控える()).size;
  reportCurrentSeedIssue(`メールの受け口（開発環境が送るメールを全部受けるもの）を読めることを確かめた（いまの通数 ${n}）。受信メールは消さず、` +
    "ケースの手順の前に受け口のメールの番号を控え、そのあとに会員のアドレス（実行の印つき）へ届いたものだけを数える（0通にする代わり）");
});

/** 12人の組（A〜L）。1人目は画面で登録し、残りは1人目を DB で写す。更新日時: L=基準日 00:00、K=00:01、A〜J=翌日 00:01〜00:10 */
function 検索組(k: string, 基準日: string, 翌日: string) {
  defineSeed(`S-M08-02-SEARCH-${k}`, async ({ browser, notes }) => {
    const 呼び名 = (i: number): string => `〔会員ID-M0802-${k}${"ABCDEFGHIJKL"[i]}〕`;
    const 前半 = (i: number): string => `${String(i + 1).padStart(3, "0")}-paging-m0802-${k}`;
    const 一人目 = await 会員を登録する(browser, notes, 前半(0), { 姓: "検索", 名: `確認-${k}`, セイ: "ケンサク", メイ: "カクニン" }, 呼び名(0));
    const ids = [一人目.会員ID];
    for (let i = 1; i < 12; i++) { const id = 会員を写す(一人目.会員ID, mailOf(前半(i))); ids.push(id); notes.set(呼び名(i), id); }
    ids.forEach((id, i) => {
      const 更新日 = i === 11 ? `${基準日} 00:00` : i === 10 ? `${基準日} 00:01` : `${翌日} 00:${String(i + 1).padStart(2, "0")}`;
      会員の値を設定する(id, { 更新日 });
    });
    reportCurrentSeedIssue(`会員2〜12人目は、1人目の会員（会員ID ${一人目.会員ID}）を DB で写して足した。DBで12人の更新日時を設定した（L=${基準日} 00:00、K=00:01、A〜J=${翌日} 00:01〜00:10。画面で指定できない値）`);
  });
}
検索組("005", "2026-08-01", "2026-08-02");
検索組("006", "2026-08-03", "2026-08-04");
検索組("007", "2026-08-05", "2026-08-06");

/** 一人の会員を画面で登録し、更新日時などを DB で設定する */
function 更新日つき一人(k: string, 更新日: string) {
  defineSeed(`S-M08-02-MEMBERS-${k}`, async ({ browser, notes }) => {
    const m = await 会員を登録する(browser, notes, `customer100-m0802-${k}`, { 姓: "青山", 名: `一郎-${k}`, セイ: "アオヤマ", メイ: "イチロウ" }, `〔会員ID-M0802-${k}〕`);
    会員の値を設定する(m.会員ID, { 更新日 });
    reportCurrentSeedIssue(`DBで会員ID ${m.会員ID} の更新日時を ${更新日} に設定した（画面で指定できない値）`);
  });
}
更新日つき一人("008", "2099-12-08 00:00");
更新日つき一人("009", "2099-12-09 00:00");

for (const k of ["013", "027", "011", "016", "026"]) 一人(k, `-${k}`);
// 031: 呼び名は〔会員ID-M0802-031A〕（1人）
defineSeed("S-M08-02-MEMBERS-031", async ({ browser, notes }) => {
  await 会員を登録する(browser, notes, "customer100-m0802-031", { 姓: "青山", 名: "一郎-031", セイ: "アオヤマ", メイ: "イチロウ" }, "〔会員ID-M0802-031A〕");
});

/** 2人組（A=青山 一郎、B=井上 二郎 または 上田 三郎）。A・B の順に登録する */
function 二人組(k: string, B: 0 | 1, 未登録確認 = false) {
  defineSeed(`S-M08-02-MEMBERS-${k}`, async ({ browser, notes }) => {
    const 人 = [姓名[0], 姓名[B === 0 ? 1 : 2]];
    for (let i = 0; i < 2; i++) {
      const p = 人[i];
      await 会員を登録する(browser, notes, `${p.銀行}-m0802-${k}`, { 姓: p.姓, 名: `${p.名}-${k}`, セイ: p.セイ, メイ: p.メイ }, `〔会員ID-M0802-${k}${"AB"[i]}〕`);
    }
    if (未登録確認) await 未登録を確かめる(browser);
  });
}
二人組("014", 0);
二人組("017", 0);
二人組("020", 1);
二人組("022", 0, true);
二人組("015", 0);
二人組("019", 1);
二人組("021", 0, true);
二人組("030", 0, true);

// 018: 保有ポイント=180（ポイント付与の画面で）、登録日時・更新日時=2026-09-01 10:18（DB）
defineSeed("S-M08-02-MEMBERS-018", async ({ browser, notes }) => {
  const m = await 会員を登録する(browser, notes, "customer100-m0802-018", { 姓: "青山", 名: "一郎-018", セイ: "アオヤマ", メイ: "イチロウ" }, "〔会員ID-M0802-018〕");
  await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await ポイントを付与する(page, m.会員ID, 180, 日付の文字列(new Date())); });
  会員の値を設定する(m.会員ID, { 登録日: "2026-09-01 10:18", 更新日: "2026-09-01 10:18" });
  reportCurrentSeedIssue(`DBで会員ID ${m.会員ID} の登録日時・更新日時を 2026-09-01 10:18 に設定した（画面で指定できない値。ポイントの付与より後）`);
});

// ---- 032 結合（RH）----
export const M0802_RH_ADMIN: Account = { loginId: "m0802rh_admin", password: "Passw0rd-M0802RH" };
defineSeed("S-M08-02-RH-ADM", async ({ browser }) => { await ensureM08Admin(browser, "M08-02RH試験管理者", M0802_RH_ADMIN); });
defineSeed("S-M08-02-RH-BASE", async () => {
  reportCurrentSeedIssue("共有の店舗基本設定（店名「晴屋RH0802店」・メールアドレス）とメール設定は書き換えず、いまの設定のまま使った。このケースは配信履歴の画面だけを確かめ、メールの受信は確かめない");
});
/** RH のケースの検索語（メールアドレスに含む）。会員 A・B だけが出る */
export const RH検索語 = (): string => rc("m0802rh-001");
defineSeed("S-M08-02-RH-MEMBERS-032", async ({ browser, notes }) => {
  const 人 = [{ 前半: "a-m0802rh-001", 名: "一郎", メイ: "イチロウ" }, { 前半: "b-m0802rh-001", 名: "二郎", メイ: "ジロウ" }];
  for (let i = 0; i < 2; i++) {
    await 会員を登録する(browser, notes, 人[i].前半, { 姓: "一括", 名: 人[i].名, セイ: "イッカツ", メイ: 人[i].メイ, パスワード: "Passw0rd-M0802RH" }, `〔会員ID-M0802-001${"AB"[i]}〕`);
  }
  reportCurrentSeedIssue("会員のメールアドレスは、前の実行の残りと取り違えないよう前半に実行の印を付けた（m0802rh-001a → a-m0802rh-001-<印>）。検索語「m0802rh-001」も印つき");
});
/** ページングの組の検索語（印つき）。この語を会員検索一覧で検索すると、組の12人だけが出る */
export const ページング語 = (k: string): string => rc(`paging-m0802-${k}`);
