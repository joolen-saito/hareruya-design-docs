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
import { rc } from "../lib/run_marker";
import { defineSeed } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { ensureJob } from "../pages/admin/f06_masters";
import { ensureM08Admin } from "../pages/admin/m08_common";
import { M08CustomerGroupPage } from "../pages/admin/m08_customer_group";
import { M08CustomerEditPage } from "../pages/admin/m08_customer_edit";
import { M08CustomerListPage } from "../pages/admin/m08_customer_list";
import { 会員を用意する, 会員の用意, mailOf } from "./m08-common";

/** 開発環境に同じログインIDの手動テスト用のメンバーがありうるので、ログインID・名前に実行の印を付けて作る（M03-26 などと同じ） */
export const M0804_ADMIN: Account = { loginId: rc("m0804_admin").toLowerCase(), password: "Passw0rd!M0804" };
defineSeed("S-M08-04-ADM", async ({ browser }) => { await ensureM08Admin(browser, rc("M08-04試験管理者"), M0804_ADMIN); });

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
