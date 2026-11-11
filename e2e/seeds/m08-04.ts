/**
 * M08-04 会員登録/編集の画面シード。正本: cases/M08-04_seed_data.tsv
 *
 * - 会員: フロントの新規会員登録で作り（本登録のメールは手元の受け口で読む）、管理画面の会員編集で項目を足し、会員ステータス「本会員」を選んで登録する。
 *   メールアドレスの前半には実行の印を付ける（e2e/lib/run_marker.ts。依頼者決定 2026-10-28）。値そのものを確かめる010・062（最大文字数のメールアドレス）には付けず、
 *   シード表が定める「同じメールアドレスの会員があれば削除する」をその値だけに行う。
 * - 本人確認情報ID・会員住所ID: どの画面にも出ない（正本もそう書く）。正本は「デッキ新規登録画面のプレイヤー検索」で本人確認情報IDを控えるが、
 *   会員の本人確認情報の番号と同じなので、DBの参照（SELECT）で控える（デッキ登録画面を開かない）。会員住所IDも同様にDBの参照で控える。
 * - 職業「会社員」・顧客グループ「標準顧客」（007）: 手元の環境のマスターに無いので、マスタデータ管理・顧客グループ管理の画面で足す（あれば使う）。
 * 作らないシード: 累計注文回数・受注・買取などをDBで設定するもの（002、購入履歴・買取履歴、スマレジID、お届け先 など）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportCurrentSeedIssue } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { ensureJob } from "../pages/admin/f06_masters";
import { ensureM08Admin } from "../pages/admin/m08_common";
import { M08CustomerGroupPage } from "../pages/admin/m08_customer_group";
import { M08CustomerEditPage } from "../pages/admin/m08_customer_edit";
import { M08CustomerListPage } from "../pages/admin/m08_customer_list";
import { 会員を用意する, 会員の用意, mailOf } from "./m08-common";
import { お届け先を足す } from "../pages/admin/f06_18_setup";
import { 受注を足す, 受注を101件足す, 買取を足す, 買取を101件足す, スマレジIDを設定する } from "../db/m08_04_write";
import { 会員の値を設定する } from "../db/m08_01_write";

export const M0804_ADMIN: Account = { loginId: "m0804_admin", password: "Passw0rd!M0804" };
defineSeed("S-M08-04-ADM", async ({ browser }) => { await ensureM08Admin(browser, "M08-04試験管理者", M0804_ADMIN); });

/** 長いメールアドレス（値そのものを確かめるので、印を付けない） */
export const 長いメール010 = "a".repeat(73) + "@example.com";
export const 長いメール062 = "m0804-062-" + "a".repeat(233) + "@example.com";
export const 更新後メール004 = (): string => mailOf("updated8004");
export const 重複前メール018 = (): string => mailOf("before8004-018");
export const 重複先メール018 = (): string => mailOf("duplicate8004-018");

const 旧: Pick<会員の用意, "姓" | "名" | "セイ" | "メイ"> = { 姓: "旧姓", 名: "旧名", セイ: "キュウ", メイ: "カイイン" };
const 旧会社 = { 会社名: "旧会社" };
const 住所3 = { "address][addr03": "旧海外住所" };
const FAX = { "fax][fax01": "03", "fax][fax02": "9876", "fax][fax03": "5432" };
const 退会NONE = { close_reason: "NONE" };

/** 指定のメールアドレス（そのままの値）の会員が一覧にいれば削除する（シード表が定める「あれば削除する」。その値だけ） */
async function メールの会員を消す(browser: Browser, メール: string, 検索語: string): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const list = new M08CustomerListPage(page);
    for (let i = 0; i < 5; i++) {
      await list.open();
      await list.searchMulti(検索語);
      const rows = page.locator('tr[id^="ex-customer-"]').filter({ has: page.locator("td", { hasText: new RegExp(`^\\s*${メール.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) }) });
      if ((await rows.count()) === 0) return;
      const id = ((await rows.first().getAttribute("id")) ?? "").replace("ex-customer-", "");
      await list.削除リンクを押す(id);
      await list.確認モーダルで削除する(id);
    }
    throw new Error(`メールアドレス ${メール.slice(0, 20)}… の会員が消えない`);
  });
}

function 基本(k: string, o: Partial<会員の用意> = {}, 前半 = `m0804-${k}`) {
  defineSeed(`S-M08-04-BASE-${k}`, async (ctx) => { await 会員を用意する(ctx, { 前半, ...旧, ...o }); });
}
基本("004", { ...旧会社, 文字: { ...住所3, ...FAX } });
基本("005", { ...旧会社 });
基本("006", { ...旧会社 });
defineSeed("S-M08-04-BASE-007", async (ctx) => {
  // 職業「会社員」・顧客グループ「標準顧客」は手元の環境に無いので、画面で足す
  await withAdminSession(ctx.browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await ensureJob(page, "会社員");
    const g = new M08CustomerGroupPage(page);
    await g.open();
    if ((await g.rowByName("標準顧客").count()) === 0) {
      await g.入れる({ 名称: "標準顧客", 還元率: "0", 店内注文専用: false, 支店店内注文専用: false });
      const r = await g.登録する();
      if (!r.sent) throw new Error("顧客グループ「標準顧客」の登録: ブラウザの入力チェックが送信を止めた");
    }
  });
  await 会員を用意する(ctx, {
    前半: "m0804-007", ...旧, ...旧会社,
    文字: { ...住所3, abroadPostalCode: "1000001", ...FAX, ...退会NONE },
    選択: { job: "会社員", "Player][CustomerGroup": "標準顧客" },
    ラジオ: { sex: "男性" },
  });
});
基本("009", { 文字: { ...退会NONE } });
defineSeed("S-M08-04-BASE-010", async (ctx) => {
  await メールの会員を消す(ctx.browser, 長いメール010, "a".repeat(73));
  await 会員を用意する(ctx, { 前半: "m0804-010", ...旧, ...旧会社, 文字: { ...住所3, ...FAX, "Player][lastNameEn": "Old", "Player][firstNameEn": "Member", ...退会NONE } });
});
基本("012", { ...旧会社, 文字: { ...住所3, "Player][lastNameEn": "Old", "Player][firstNameEn": "Member", ...退会NONE } });
基本("016");
defineSeed("S-M08-04-BASE-018", async (ctx) => { await 会員を用意する(ctx, { メール: 重複前メール018(), ...旧 }); });
defineSeed("S-M08-04-DUPMAIL-018", async (ctx) => {
  await 会員を用意する(ctx, { メール: 重複先メール018(), 姓: "重複", 名: "会員", セイ: "チョウフク", メイ: "カイイン", 控える呼び名: (l) => l.endsWith("018B〕") });
});
基本("021", { 文字: { ...FAX } });
基本("024", { ...旧会社 });
基本("025");

const 確認住所 = { 住所1: "確認住所1", 住所2: "確認住所2" };
defineSeed("S-M08-04-VERIFY-026", async (ctx) => {
  await 会員を用意する(ctx, { 前半: "m0804-026", 姓: "書留", 名: "会員", セイ: "カキトメ", メイ: "カイイン", ...確認住所, 本人確認: { オンライン: true, 期限: "2027-12-31", 簡易書留: true } });
});
defineSeed("S-M08-04-VERIFY-028", async (ctx) => {
  await 会員を用意する(ctx, { 前半: "m0804-028", 姓: "書留", 名: "会員", セイ: "カキトメ", メイ: "カイイン", ...確認住所, 本人確認: { オンライン: true, 期限: "2027-12-31", 簡易書留: true } });
});
defineSeed("S-M08-04-VERIFY-ONLINE-030", async (ctx) => {
  await 会員を用意する(ctx, { 前半: "m0804-030", 姓: "確認", 名: "会員", セイ: "カクニン", メイ: "カイイン", ...確認住所, 本人確認: { オンライン: true } });
});
defineSeed("S-M08-04-BASE-032", async (ctx) => {
  // 会員ID 999999の会員は0件であること（あれば削除、と正本は定めるが、開発用のデータかもしれないので消さずに止める）
  await withAdminSession(ctx.browser, SETUP_ADMIN, async (page) => {
    const edit = new M08CustomerEditPage(page);
    if ((await edit.open("999999")) === 200) throw new Error("会員ID 999999の会員がいる（開発用のデータの恐れがあるので消さずに止める）");
  });
  await 会員を用意する(ctx, { 前半: "m0804-032", 姓: "URL", 名: "確認", セイ: "ユーアールエル", メイ: "カクニン", ...確認住所 });
});
defineSeed("S-M08-04-PURCHASE-EMPTY-044", async (ctx) => {
  await 会員を用意する(ctx, { 前半: "m0804-044", 姓: "購入", 名: "会員", セイ: "シケン", メイ: "カイイン" });
});
for (const k of ["050", "051", "052", "053"]) {
  defineSeed(`S-M08-04-BASE-${k}`, async (ctx) => { await 会員を用意する(ctx, { 前半: `m0804-${k}`, 姓: "遷移", 名: "確認", セイ: "センイ", メイ: "カクニン", ...確認住所 }); });
}
defineSeed("S-M08-04-PWINIT-060", async (ctx) => { await 会員を用意する(ctx, { 前半: "m0804-060", ...旧, ...旧会社 }); });
defineSeed("S-M08-04-MEMID-061", async (ctx) => { await 会員を用意する(ctx, { 前半: "m0804-061", ...旧, ...旧会社 }); });
defineSeed("S-M08-04-MAXLEN-062", async (ctx) => {
  await メールの会員を消す(ctx.browser, 長いメール062, "m0804-062-");
  await 会員を用意する(ctx, { 前半: "m0804-062", ...旧, ...旧会社, 文字: { ...住所3, ...退会NONE } });
});
defineSeed("S-M08-04-MTGNAME-069", async (ctx) => {
  await 会員を用意する(ctx, { 前半: "m0804-069", ...旧, 文字: { "Player][lastNameEn": "M0804-069-Sei", "Player][firstNameEn": "M0804-069-Mei" } });
});
defineSeed("S-M08-04-MAILMAGA-ON-071", async (ctx) => { await 会員を用意する(ctx, { 前半: "m0804-071", ...旧, ラジオ: { "Player][mailMagazineFlg": "配信不可" } }); });
defineSeed("S-M08-04-MAILMAGA-OFF-072", async (ctx) => { await 会員を用意する(ctx, { 前半: "m0804-072", ...旧, ラジオ: { "Player][mailMagazineFlg": "配信可" } }); });

const 降格 = { 住所1: "降格住所1", 住所2: "降格住所2" };
defineSeed("S-M08-04-ONLINE-083", async (ctx) => {
  await 会員を用意する(ctx, { 前半: "dpm0804-083", 姓: "降名", 名: "会員", セイ: "コウメイ", メイ: "カイイン", ...降格, パスワード: "Passw0rd-M0804083", 本人確認: { オンライン: true } });
});
defineSeed("S-M08-04-ONLINE-084", async (ctx) => {
  await 会員を用意する(ctx, { 前半: "dpm0804-084", 姓: "降カナ", 名: "会員", セイ: "コウカナ", メイ: "カイイン", ...降格, パスワード: "Passw0rd-M0804084", 本人確認: { オンライン: true } });
});
defineSeed("S-M08-04-ONLINE-085", async (ctx) => {
  await 会員を用意する(ctx, { 前半: "dpm0804-085", 姓: "降生日", 名: "会員", セイ: "コウセイ", メイ: "カイイン", ...降格, パスワード: "Passw0rd-M0804085", 本人確認: { オンライン: true } });
});
defineSeed("S-M08-04-CHECKING-086", async (ctx) => {
  await 会員を用意する(ctx, { 前半: "dpm0804-086", 姓: "確認中", 名: "会員", セイ: "カクニンチュウ", メイ: "カイイン", 住所1: "旧確認中住所1", 住所2: "確認中住所2", パスワード: "Passw0rd-M0804086", 本人確認: { 確認中: true } });
});
defineSeed("S-M08-04-VERIFY-087", async (ctx) => {
  await 会員を用意する(ctx, { 前半: "dpm0804-087", 姓: "書留期限", 名: "会員", セイ: "カキトメキゲン", メイ: "カイイン", 住所1: "期限住所1", 住所2: "期限住所2", パスワード: "Passw0rd-M0804087", 本人確認: { オンライン: true, 期限: "2027-12-31", 簡易書留: true } });
});
defineSeed("S-M08-04-CBCANCEL-093", async (ctx) => {
  await 会員を用意する(ctx, { 前半: "cbm0804-093", 姓: "保留撤回", 名: "会員", セイ: "ホリュウ", メイ: "カイイン", 住所1: "保留住所1", 住所2: "保留住所2", パスワード: "Passw0rd-CBM0804093", 本人確認: { オンライン: true } });
});
defineSeed("S-M08-04-CBCOMPANY-094", async (ctx) => {
  await 会員を用意する(ctx, { 前半: "cbm0804-094", 姓: "社名のみ", 名: "会員", セイ: "シャメイ", メイ: "カイイン", 住所1: "社名住所1", 住所2: "社名住所2", ...旧会社, パスワード: "Passw0rd-CBM0804094", 本人確認: { オンライン: true } });
});
defineSeed("S-M08-04-CBNOEXP-095", async (ctx) => {
  await 会員を用意する(ctx, { 前半: "cbm0804-095", 姓: "期限空欄", 名: "会員", セイ: "キゲン", メイ: "カイイン", 住所1: "期限住所1", 住所2: "期限住所2", パスワード: "Passw0rd-CBM0804095", 本人確認: { オンライン: true } });
});

// =====================================================================================================
// ここから: 残りのケース（2026-11-11 追加。依頼者方針 2026-11-10）
//
// 読み替え（各シードの注記に残す）:
//  - 選択項目の試験マスター（試験国A・試験都道府県A・試験性別A・試験職業A・試験顧客グループA）は、共有のマスタに足さない。ケースの手順では、既存の別の選択肢を選ぶ。
//  - 画面で作れない値（累計注文回数・金額、受注、買取、スマレジID）は、実行の印つきの会員に限り DB に書く（db/m08_01_write.ts・db/m08_04_write.ts）。
//  - 受注ID・買取ID・お届け先IDは、画面・DBが振る番号を使う（正本の固定の番号にしない）。受注番号は正本の値を使う。支払方法の表示名は受注の文字としてだけ入れる（支払方法マスタには足さない）。
//  - 作らないシード: 101件の購入履歴・買取履歴（PURCHASE-101-READ・BUY-101-READ。大量データ）、RH-EVENT-092（イベント申込）。
// =====================================================================================================
const DB設定 = (内容: string[], 会員: string): void => { if (内容.length) reportCurrentSeedIssue(`DBで会員ID ${会員} の${内容.join("・")}を設定した（画面で入力できない値）`); };

defineSeed("S-M08-04-MASTERS", async () => {
  reportCurrentSeedIssue("国・都道府県・性別・職業・顧客グループの「試験…A」は、共有のマスタに足さず、既存の別の選択肢で読み替えた（国と職業と顧客グループは、いまの選択と違う最初の選択肢。都道府県は大阪府。性別は女性）");
});

defineSeed("S-M08-04-BASE-002", async (ctx) => {
  const m = await 会員を用意する(ctx, { 前半: "m0804-002", ...旧 });
  DB設定(会員の値を設定する(m.会員ID, { EC購入回数: 12, EC購入金額: 345600 }), m.会員ID);
});
基本("008");

const 簡易書留 = { オンライン: true as const, 期限: "2027-12-31", 簡易書留: true };
const 郵便の文字 = { abroadPostalCode: "1000001" };
defineSeed("S-M08-04-VERIFY-027", async (ctx) => {
  await 会員を用意する(ctx, { 前半: "m0804-027", 姓: "書留", 名: "会員", セイ: "カキトメ", メイ: "カイイン", ...確認住所, 文字: 郵便の文字, 本人確認: 簡易書留 });
});
defineSeed("S-M08-04-VERIFY-029", async (ctx) => {
  await 会員を用意する(ctx, { 前半: "m0804-029", 姓: "書留", 名: "会員", セイ: "カキトメ", メイ: "カイイン", ...確認住所, 本人確認: 簡易書留 });
});
for (const [id, k] of [["COUNTRY-074", "074"], ["ZIP-075", "075"], ["OVERSEAS-076", "076"], ["PREF-077", "077"], ["ADDR1-078", "078"], ["ADDR2-079", "079"]]) {
  defineSeed(`S-M08-04-VERIFY-ONLINE-${id}`, async (ctx) => {
    await 会員を用意する(ctx, { 前半: `m0804-${k}`, 姓: "確認", 名: "会員", セイ: "カクニン", メイ: "カイイン", ...確認住所, 文字: 郵便の文字, 本人確認: { オンライン: true, 期限: "2027-12-31" } });
  });
}

// ---- お届け先 ----
type お届け = { 配送先名称: string; 姓: string; 名: string; セイ: string; メイ: string; 郵便番号: string; 都道府県: string; 住所1: string; 住所2: string; 会社名: string; 電話: string };
const 太郎 = (電話: string): お届け => ({ 配送先名称: "配送太郎", 姓: "配送", 名: "太郎", セイ: "ハイソウ", メイ: "タロウ", 郵便番号: "100-0001", 都道府県: "東京都", 住所1: "千代田区", 住所2: "1-1", 会社名: "", 電話 });
const 花子 = (電話: string): お届け => ({ 配送先名称: "配送花子", 姓: "配送", 名: "花子", セイ: "ハイソウ", メイ: "ハナコ", 郵便番号: "105-0001", 都道府県: "東京都", 住所1: "港区", 住所2: "2-2", 会社名: "", 電話 });
async function お届け先を作る(ctx: { browser: Browser; notes: { set: (k: string, v: string) => void } }, 会員ID: string, 一覧: [string, お届け][]): Promise<void> {
  await withAdminSession(ctx.browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const [呼び名, v] of 一覧) {
      await お届け先を足す(page, 会員ID, v, `会員ID ${会員ID} のお届け先「${v.姓} ${v.名}」`);
      const did = /\/delivery\/(\d+)\/edit/.exec(page.url())?.[1];
      if (!did) throw new Error(`お届け先を登録した後の画面のアドレスからお届け先IDを控えられない（${page.url()}）`);
      ctx.notes.set(呼び名, did);
    }
  });
}
for (const k of ["033", "034", "035", "036"]) {
  defineSeed(`S-M08-04-DELIVERY-${k}`, async (ctx) => {
    const m = await 会員を用意する(ctx, { 前半: `m0804-${k}`, 姓: "配送", 名: "会員", セイ: "ハイソウ", メイ: "カイイン", 住所1: "会員住所1", 住所2: "会員住所2" });
    await お届け先を作る(ctx, m.会員ID, [[`〔お届け先ID-M0804-${k}〕`, 太郎("03-1111-2222")]]);
  });
}
for (const k of ["088", "089"]) {
  defineSeed(`S-M08-04-DELIVERY-${k}`, async (ctx) => {
    const m = await 会員を用意する(ctx, { 前半: `dpm0804-${k}`, 姓: "配送", 名: "会員", セイ: "ハイソウ", メイ: "カイイン", 住所1: "会員住所1", 住所2: "会員住所2" });
    await お届け先を作る(ctx, m.会員ID, [[`〔お届け先ID-M0804-${k}-A〕`, 太郎("03-0884-1111")], [`〔お届け先ID-M0804-${k}-B〕`, 花子("03-0884-2222")]]);
  });
}

// ---- 購入履歴・買取履歴 ----
const 購入会員 = { 姓: "購入", 名: "会員", セイ: "コウニュウ", メイ: "カイイン" };
const 受注の読み替え = (): void => reportCurrentSeedIssue("受注は画面で作れないため、DBで会員に受注を足した（受注IDは振られた番号。受注番号と注文日時・購入金額・発送日・支払方法の表示名・対応状況は正本の値）。支払方法の表示名「試験支払A」は受注の文字としてだけ入れ、支払方法マスタには足していない");
defineSeed("S-M08-04-PURCHASE-READ", async (ctx) => {
  const m = await 会員を用意する(ctx, { 前半: "m0804-purchase-read", ...購入会員 });
  受注の読み替え();
  受注を足す(m.会員ID, { 注文番号: "920001", 注文日時: "2026-08-01 10:00", 購入金額: 1200, 発送日: "2026-08-02 00:00", 支払方法: "試験支払A", 対応状況: "入金済み" });
});
defineSeed("S-M08-04-PURCHASE-STATUS-039", async (ctx) => {
  const m = await 会員を用意する(ctx, { 前半: "m0804-039", ...購入会員 });
  受注の読み替え();
  受注を足す(m.会員ID, { 注文番号: "930001", 注文日時: "2026-08-01 10:00", 購入金額: 1200, 支払方法: "試験支払A", 対応状況: "決済処理中" });
  受注を足す(m.会員ID, { 注文番号: "930002", 注文日時: "2026-08-02 10:00", 購入金額: 3400, 支払方法: "試験支払A", 対応状況: "購入処理中" });
});
defineSeed("S-M08-04-PURCHASE-042", async (ctx) => {
  const m = await 会員を用意する(ctx, { 前半: "m0804-042", ...購入会員 });
  受注の読み替え();
  受注を足す(m.会員ID, { 注文日時: "2026-08-01 11:00", 購入金額: 1200, 支払方法: "試験支払A", 対応状況: "入金済み" });
});
defineSeed("S-M08-04-MIXED-082", async (ctx) => {
  const m = await 会員を用意する(ctx, { 前半: "dpm0804-082", 姓: "混在", 名: "会員", セイ: "コンザイ", メイ: "カイイン" });
  受注の読み替え();
  受注を足す(m.会員ID, { 注文番号: "940821", 注文日時: "2026-08-01 10:00", 購入金額: 1200, 支払方法: "試験支払A", 対応状況: "入金済み" });
  受注を足す(m.会員ID, { 注文番号: "940822", 注文日時: "2026-08-02 10:00", 購入金額: 3400, 支払方法: "試験支払A", 対応状況: "決済処理中" });
});
const 買取の読み替え = (): void => reportCurrentSeedIssue("買取は画面で作れないため、DBで会員に買取を足した（買取IDは振られた番号。買取依頼日・申込時金額・査定金額・買取ステータスは正本の値）");
for (const [id, 前半] of [["BUY-045", "m0804-045"], ["BUY-READ", "m0804-buy-read"]]) {
  defineSeed(`S-M08-04-${id}`, async (ctx) => {
    const m = await 会員を用意する(ctx, { 前半, 姓: "買取", 名: "会員", セイ: "カイトリ", メイ: "カイイン" });
    買取の読み替え();
    const 買取ID = 買取を足す(m.会員ID, { 依頼日時: "2026-08-03 12:00", 申込時金額: 5000, 査定金額: 4500, 買取状況: "査定済み" });
    ctx.notes.set(id === "BUY-045" ? "〔買取ID-M0804-045〕" : "〔買取ID-M0804-共有買取〕", 買取ID);
  });
}

defineSeed("S-M08-04-SMAREGI-070", async (ctx) => {
  const m = await 会員を用意する(ctx, { 前半: "m0804-070", ...旧 });
  スマレジIDを設定する(m.会員ID, "7080070");
  reportCurrentSeedIssue(`DBで会員ID ${m.会員ID} のスマレジIDを7080070に設定した（画面で入力できない）`);
});

// ---- 更新の反映（QH）・連携（RH） ----
export const M0804_QH_ADMIN: Account = { loginId: "m0804qh_admin", password: "Passw0rd-M0804QH" };
defineSeed("S-M08-04-QH-ADM", async ({ browser }) => { await ensureM08Admin(browser, "M08-04QH試験管理者", M0804_QH_ADMIN); });
export const QH会員のメール = (k: "001" | "002"): string => mailOf(`qh0804-${k}`);
export const QH会員のパスワード = (k: "001" | "002"): string => `Passw0rd-QH0804-${k}`;
for (const k of ["001", "002"] as const) {
  defineSeed(`S-M08-04-QH-MEMBER-${k === "001" ? "080" : "081"}`, async (ctx) => {
    reportCurrentSeedIssue("メールアドレスの前半に実行の印を付けた（qh0804-" + k + " の前に印）。電話番号は画面の既定（03-1234-5678）のまま（ケースは電話番号を確かめない）");
    await 会員を用意する(ctx, { 前半: `qh0804-${k}`, 姓: `旧姓${k}`, 名: `旧名${k}`, セイ: "キュウセイ", メイ: "キュウメイ", 会社名: `旧会社M0804QH${k}`, 住所1: `千代田区旧町${k}`, 住所2: `旧ビル${k}`, パスワード: QH会員のパスワード(k) });
  });
}

export const M0804_RH_ADMIN: Account = { loginId: "m0804rh_admin", password: "Passw0rd-M0804RH" };
defineSeed("S-M08-04-RH-ADM", async ({ browser }) => { await ensureM08Admin(browser, "M08-04RH試験管理者", M0804_RH_ADMIN); });
defineSeed("S-M08-04-RH-MASTER", async () => {
  reportCurrentSeedIssue("本人確認ステータス4状態と買取状況「注文」は既存のマスタにあるものを使う（足さない）");
});
defineSeed("S-M08-04-RH-CUST-090", async (ctx) => {
  const m = await 会員を用意する(ctx, { 前半: "m0804rh-001", 姓: "更新前", 名: "太郎", セイ: "コウシンマエ", メイ: "タロウ" });
  買取の読み替え();
  ctx.notes.set("〔買取番号-M0804-001〕", 買取を足す(m.会員ID, { 依頼日時: "2026-08-03 12:00", 申込時金額: 1000, 査定金額: 1000, 買取状況: "注文" }));
});
defineSeed("S-M08-04-RH-CUST-091", async (ctx) => {
  const m = await 会員を用意する(ctx, { 前半: "m0804rh-002", 姓: "降格", 名: "花子", セイ: "コウカク", メイ: "ハナコ", 住所2: "結合ビル804B", 本人確認: { オンライン: true, 期限: "2028-05-31" } });
  買取の読み替え();
  ctx.notes.set("〔買取番号-M0804-002〕", 買取を足す(m.会員ID, { 依頼日時: "2026-08-03 12:00", 申込時金額: 1000, 査定金額: 1000, 買取状況: "注文" }));
});

// ---- 101件（購入履歴・買取履歴の100件上限） ----
defineSeed("S-M08-04-PURCHASE-101-READ", async (ctx) => {
  const m = await 会員を用意する(ctx, { 前半: "m0804-purchase-101-read", ...購入会員 });
  reportCurrentSeedIssue("受注101件は画面で作れないため、DBで会員に足した（受注番号910001〜910101・入金済み・注文日時は1分間隔。受注IDは振られた番号）");
  受注を101件足す(m.会員ID);
});
defineSeed("S-M08-04-BUY-101-READ", async (ctx) => {
  const m = await 会員を用意する(ctx, { 前半: "m0804-buy-101-read", 姓: "買取", 名: "会員", セイ: "カイトリ", メイ: "カイイン" });
  reportCurrentSeedIssue("買取101件は画面で作れないため、DBで会員に足した（依頼日時は1分間隔。買取IDは振られた番号で、最古・最新を控えた）");
  const r = 買取を101件足す(m.会員ID);
  ctx.notes.set("〔買取ID-M0804-共有買取101-最古〕", r.最古);
  ctx.notes.set("〔買取ID-M0804-共有買取101-最新〕", r.最新);
});
