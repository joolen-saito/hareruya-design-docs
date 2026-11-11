/**
 * M08-14 仮会員メール再送の画面シード。正本: cases/M08-14_seed_data.tsv
 * - 会員: フロントの会員登録で作る。仮会員は本登録のメールのURLを開かずに残す。メールアドレスの前半には実行の印を付ける。
 *   本登録用シークレットは、DBで設定せず、仮会員の登録時にアプリが振った値を使う（再送の動きは値によらない。読み替え）。
 * - 本会員（ACTIVE-READ）: 登録後に本登録し、管理画面の会員編集で会員ステータス「本会員」を選んで登録する（正本の手順）。
 * - 退会済み（WITHDRAWN-READ）: 本会員を登録し、フロントの退会の操作で退会する。完了しないときは、DBで会員ステータス「退会」・削除フラグ有効に設定する（実行の印つきの会員だけ）。
 * - 不存在（ABSENT）: 会員を登録し、管理画面の削除で消す（会員IDは8199でなく、この実行で振られた会員ID。消すのはこの実行の印つきの会員だけ）。
 * - 店舗基本情報・メールテンプレート（SHOP・TEMPLATE・RH-SHOP・RH-TEMPLATE-022）は共有の設定なので書き換えない。いまの値を読み、
 *   ケースはその値と照らし合わせる（読み替え）。メール受信環境（MAILBOX）は開発環境に無いので、メールが送られたことは送信履歴で確かめる。
 * 作らないシード: TARGET-003・004・005・CBTARGET-024（宛先・ヘッダ・編集後の件名を確かめるケース専用）。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { 会員の保存内容 } from "../db/m08_04";
import { 仮会員メールのテンプレート, 店名 } from "../db/m08_14";
import { 会員を退会済みにする } from "../db/m08_14_write";
import { defineSeed, reportCurrentSeedIssue } from "./current_seed";
import { rc } from "../lib/run_marker";
import { Account, hideDebugToolbar, withAdminSession } from "../lib/session";
import { ensureM08Admin } from "../pages/admin/m08_common";
import { M08CustomerListPage } from "../pages/admin/m08_customer_list";
import { WithdrawPage } from "../pages/front/f06_21_withdraw_k";
import { フロントで会員登録する } from "../pages/front/m08_member";
import { 管理画面で会員を整える, 会員IDを探す, 会員を登録する, mailOf } from "./m08-common";

export const M0814_ADMIN: Account = { loginId: "m0814_admin", password: "Passw0rd!M0814" };
export const M0814_RH_ADMIN: Account = { loginId: "m0814rh_admin", password: "Passw0rd-M0814RH" };
defineSeed("S-M08-14-ENV", async () => { /* 環境。仮会員の登録が画面で通ることで確かめる */ });
defineSeed("S-M08-14-ADM", async ({ browser }) => { await ensureM08Admin(browser, "M08-14試験管理者", M0814_ADMIN); });
defineSeed("S-M08-14-RH-ADM", async ({ browser }) => { await ensureM08Admin(browser, "M08-14連鎖試験管理者", M0814_RH_ADMIN); });

// ---- 共有の設定（読むだけ。書き換えない） ----
function 共有の設定を読む(): void {
  const t = 仮会員メールのテンプレート();
  if (!t) throw new Error("仮会員登録メールのテンプレートが見つからない");
  if (!t.名前.includes("仮会員登録")) throw new Error(`仮会員登録メールのテンプレートの名前が想定（【販売/日】仮会員登録）と違う: ${t.名前}`);
  if (!店名()) throw new Error("店舗基本情報の店名を読めない");
  reportCurrentSeedIssue(`店舗基本情報・メールテンプレートは共有の設定なので書き換えず、いまの値（店名「${店名()}」、テンプレート「${t.名前}」の件名「${t.件名}」）を読み替えて使う`);
}
defineSeed("S-M08-14-SHOP", async () => { 共有の設定を読む(); });
defineSeed("S-M08-14-TEMPLATE", async () => { 共有の設定を読む(); });
defineSeed("S-M08-14-RH-SHOP", async () => { 共有の設定を読む(); });
defineSeed("S-M08-14-RH-TEMPLATE-022", async () => { 共有の設定を読む(); });
defineSeed("S-M08-14-MAILBOX", async () => {
  reportCurrentSeedIssue("開発環境にはメールの受け口が無いので、メールを送ったことは会員の送信履歴で確かめる（宛先・ヘッダは確かめない）");
});

// ---- 会員 ----
const PW = "Passw0rd!M0814";
const 仮会員の名 = { 姓: "仮登録", 名: "花子", セイ: "カリトウロク", メイ: "ハナコ", パスワード: PW };

async function 仮会員であることを確かめる(会員ID: string): Promise<void> {
  const s = 会員の保存内容(会員ID)?.会員ステータス ?? "";
  if (!s.includes("仮")) throw new Error(`会員ID ${会員ID} が仮会員でない（会員ステータス「${s}」）`);
}

async function 仮会員を作る(browser: Browser, notes: { set: (k: string, v: string) => void }, 前半: string, 呼び名: string, 名: Parameters<typeof 会員を登録する>[3] = 仮会員の名): Promise<string> {
  const { 会員ID } = await 会員を登録する(browser, notes, 前半, 名, 呼び名, true);
  await 仮会員であることを確かめる(会員ID);
  return 会員ID;
}

defineSeed("S-M08-14-PROVISIONAL-READ", async ({ browser, notes }) => { await 仮会員を作る(browser, notes, "provisional-m0814", "〔会員ID-M0814-共有仮会員〕"); });

const 共通 = { セイ: "ホントウロク", メイ: "タロウ", パスワード: PW };
defineSeed("S-M08-14-ACTIVE-READ", async ({ browser, notes }) => {
  const { 会員ID } = await 会員を登録する(browser, notes, "active-m0814", { 姓: "本登録", 名: "太郎", ...共通 }, "〔会員ID-M0814-共有本会員〕");
  await 管理画面で会員を整える(browser, 会員ID, async (edit) => {
    await edit.選ぶ("status", "本会員");
    await edit.登録する();
  });
});

async function フロントで退会する(browser: Browser, メール: string): Promise<void> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const w = new WithdrawPage(await context.newPage());
    await w.ログインする(メール, PW);
    await w.退会前を開く();
    await w.押して遷移する(w.退会手続きへ);
    await w.パスワード欄.fill(PW);
    await w.押して遷移する(w.退会する);
  } finally {
    await context.close();
  }
}

defineSeed("S-M08-14-WITHDRAWN-READ", async ({ browser, notes }) => {
  const { 会員ID, メール } = await 会員を登録する(browser, notes, "withdrawn-m0814", { 姓: "退会", 名: "三郎", セイ: "タイカイ", メイ: "サブロウ", パスワード: PW }, "〔会員ID-M0814-共有退会〕");
  let 退会済み = false;
  try {
    await フロントで退会する(browser, メール);
    退会済み = 会員の保存内容(会員ID)?.削除フラグ === "1";
  } catch { /* 画面の退会が完了しなかったとき（下でDBに設定する） */ }
  if (!退会済み) {
    会員を退会済みにする(会員ID);
    reportCurrentSeedIssue(`フロントの退会が完了しなかったので、DBで会員ID ${会員ID} の会員ステータスを「退会」、削除フラグを有効に設定した（実行の印つきの会員だけ）`);
  }
});

defineSeed("S-M08-14-ABSENT", async ({ browser, notes }) => {
  const { 会員ID, メール } = await 会員を登録する(browser, notes, "absent-m0814", { 姓: "不存在", 名: "四郎", セイ: "フソンザイ", メイ: "シロウ", パスワード: PW }, "〔会員ID-M0814-共有不存在〕", true);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const list = new M08CustomerListPage(page);
    await list.open();
    await list.searchMulti(メール);
    await list.削除リンクを押す(会員ID);
    await list.確認モーダルで削除する(会員ID);
  });
  if (会員の保存内容(会員ID)?.削除フラグ !== "1") throw new Error(`会員ID ${会員ID} を管理画面で削除できていない`);
  reportCurrentSeedIssue(`会員ID 8199 でなく、この実行で振られた会員ID ${会員ID} の会員を管理画面で削除して、存在しない会員IDにした（読み替え）`);
});

// ---- ケース専用の会員 ----
for (const k of ["008", "009", "010"]) {
  defineSeed(`S-M08-14-TARGET-${k}`, async ({ browser, notes }) => { await 仮会員を作る(browser, notes, `provisional-m0814-${k}`, `〔会員ID-M0814-${k}〕`); });
}
defineSeed("S-M08-14-TARGETS-017", async ({ browser, notes }) => {
  await 仮会員を作る(browser, notes, "provisional-m0814-017", "〔会員ID-M0814-017A〕");
  const { 会員ID } = await 会員を登録する(browser, notes, "active-m0814-017", { 姓: "本登録", 名: "太郎", ...共通 }, "〔会員ID-M0814-017B〕");
  await 管理画面で会員を整える(browser, 会員ID, async (edit) => {
    await edit.選ぶ("status", "本会員");
    await edit.登録する();
  });
});

/** 020 の検索語（2人のメールアドレスに共通で含まれる、実行の印つきの語） */
export const 検索語020 = (): string => rc("dpm0814-020");
defineSeed("S-M08-14-DPMIX-020", async ({ browser, notes }) => {
  // 2人のメールアドレスの前半に印つきの共通の語を含めて、検索で2人だけが出るようにする（印は語の直後。読み替え）
  const 語 = 検索語020();
  const メールA = `${語}-prov@example.test`;
  const メールB = `${語}-act@example.test`;
  await フロントで会員登録する(browser, { ...仮会員の名, メール: メールA, パスワード: "Passw0rd-M0814020" }, true);
  const a = await 会員IDを探す(browser, メールA);
  notes.set("〔会員ID-M0814-020A〕", a);
  await 仮会員であることを確かめる(a);
  await フロントで会員登録する(browser, { 姓: "本登録", 名: "太郎", セイ: "ホントウロク", メイ: "タロウ", メール: メールB, パスワード: "Passw0rd-M0814020" });
  const b = await 会員IDを探す(browser, メールB);
  notes.set("〔会員ID-M0814-020B〕", b);
  await 管理画面で会員を整える(browser, b, async (edit) => {
    await edit.選ぶ("status", "本会員");
    await edit.登録する();
  });
  reportCurrentSeedIssue("2人のメールアドレスは、正本の値（dpm0814-020-prov・dpm0814-020-act）でなく、共通の語 dpm0814-020 のあとに実行の印を付けた値にした（前の実行の会員が検索結果に混ざらないように）");
});

defineSeed("S-M08-14-DPTWICE-021", async ({ browser, notes }) => { await 仮会員を作る(browser, notes, "dpm0814-021", "〔会員ID-M0814-021〕", { ...仮会員の名, パスワード: "Passw0rd-M0814021" }); });
defineSeed("S-M08-14-CBTARGET-023", async ({ browser, notes }) => { await 仮会員を作る(browser, notes, "cbm0814-023", "〔会員ID-M0814-023〕", { ...仮会員の名, パスワード: "Passw0rd-CBM0814023" }); });

/** 022 の会員（姓「再送」・名「花子」）。検索はこのメールアドレスで行う */
export const メール022 = (): string => mailOf("provisional-rh0814-001");
defineSeed("S-M08-14-RH-TARGET-022", async ({ browser, notes }) => {
  await 仮会員を作る(browser, notes, "provisional-rh0814-001", "〔会員ID-M0814-001〕", { 姓: "再送", 名: "花子", セイ: "サイソウ", メイ: "ハナコ", 生年月日: ["1990", "5", "6"], パスワード: "Passw0rd-M0814RH" });
});
