/**
 * M08-02 メール一括送信の画面シード。正本: cases/M08-02_seed_data.tsv
 * - 会員: フロントの会員登録で作り、管理画面の会員一覧のメールアドレス検索で会員IDを控える。メールアドレスの前半には実行の印を付ける。
 *   3人組（001・012）は、正本どおり会員IDが A＜B＜C の順になるよう、この順に登録する。会員ID 999999は未登録であること（あれば開発用のデータの恐れがあるので消さずに止める）。
 * 作らないシード: 更新日時をDBで設定するもの（005〜009）、メール文字コード・店舗基本設定を書き換える環境（BASE-DEFAULT・BASE-ISO）、試験用メールサーバの受信設定（MAIL-CAPTURE）。
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
//  - 共有の店舗基本設定（店名・メールアドレス）・メール文字コードの設定は書き換えない。いまの設定のまま使う（BASE-DEFAULT・RH-BASE）。
//    メールの受け口が開発環境に無いので、メールそのものは確かめない（MAIL-CAPTURE は何もしない）。
//  - 更新日時・登録日時は画面で指定できないので、実行の印つきの会員に限り DB に書く（db/m08_01_write.ts）。
//  - 作らないシード: BASE-ISO（メール文字コードを書き換える）、MAIL-CAPTURE を要するメール内容の確認のシード。
// =====================================================================================================
defineSeed("S-M08-02-BASE-DEFAULT", async () => {
  reportCurrentSeedIssue("共有の店舗基本設定（店名・メールアドレス）は書き換えず、いまの設定のまま使った。メール文字コードは設定なし（変換しない）とみなした（この環境ではアプリの設定を読まないので確かめず、結果の本文で判断する）");
});
defineSeed("S-M08-02-MAIL-CAPTURE", async () => {
  reportCurrentSeedIssue("開発環境にはメールの受け口が無いので、受信メールを0通にする操作と受信内容の確認はしない。このシードを使うケースは、画面と送信履歴だけを確かめる");
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

for (const k of ["013", "027"]) 一人(k, `-${k}`);

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
