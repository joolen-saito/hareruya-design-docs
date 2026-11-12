/**
 * F06-04 パスワード再発行の画面シード。正本: cases/F06-04_seed_data.tsv
 *
 * - 会員（REG-A-…・REG-B-…）: 仮会員機能（共有の設定）は書き換えず（シード表の「有効にして」は読み替え。今の設定のまま登録し、仮会員になったときは）、フロントの会員登録で登録し、本登録のメールのURLを開いて本会員にする。
 *   管理画面の会員検索一覧で会員IDを控える。パスワード再発行は申し込まない。メールアドレスの前半に実行の印を付ける（依頼者決定 2026-10-28）。
 * - 仮会員（PROVISIONAL-…・RESET-PROVISIONAL）: 同じ登録で、メールのURLを開かない。今の設定が仮会員機能＝有効のときだけ作れる。無効なら、共有の環境（SHARED_ENV）では書き換えずに止め、手元の環境では有効にして終わりに戻す。
 * - メール受信環境（MAILBOX）: 手元の環境のメール受け口を使う（メールアドレスの前半に実行の印を付けるので、開始時に宛先ごとの受信メールは0件）。
 *   受け口に届いているかを読むだけで、書き換えない。
 * - リセットキーを持つ会員（RESET-A-…・RESET-EXPIRED・RESET-WITHDRAWN・CBRESET）（依頼者の方針 2026-11-10。読み替え）:
 *   リセットキーを画面で指定できないので、本会員を画面で作ったあと、フロントのパスワード再発行（メールアドレスを入れて「次のページへ」）で
 *   アプリにリセットキーを発行させ、届いたメールのURLを控える（正本のリセットキー文字列は、アプリが振った値に読み替える）。
 *   有効期限は発行から24時間後（正本は2099-12-31）。ケースが使う「正本のURL」は、控えたメールのURLに読み替える。
 *   画面で作れない部分だけ、実行の印つきの会員に限りDBへ書く（db/f06_04_prep.ts。書いたことはシードの注記に残す）:
 *   期限切れ（有効期限を2000-01-01にする）・退会済み（元のメールアドレスのまま退会済みにする）・リセットキーを持つ仮会員（仮会員には画面で発行されない）。
 * - 保存パスワードがメールアドレスと同じ会員（RESET-EQUAL）: 登録・再設定・管理画面の新規登録はどれも「パスワードとメールアドレスが同じ」を拒むので、
 *   先に別のメールアドレスで登録し（パスワードは最終のメールアドレスと同じ文字列）、管理画面の会員編集でメールアドレスだけをそのパスワードと同じ値に替える（DBは使わない）。
 * - リセットキーを持つ会員が0件のキー（NOKEY）: 作らない。実在しないキーを使う（DBで0件であることを確かめる）。
 */
import { Browser, Page } from "@playwright/test";
import { BASE_URL, MAIL_URL, SETUP_ADMIN, SHARED_ENV } from "../config/env";
import { 仮会員機能が有効か } from "../db/f06_01";
import { available } from "../lib/db";
import { mailIds } from "../lib/mail";
import { rc } from "../lib/run_marker";
import { defineSeed, reportCurrentSeedIssue } from "./current_seed";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { resultCustomerId, searchCustomer } from "../pages/admin/f06_customer";
import { readTempMember, setTempMember } from "../pages/admin/f06_masters";
import { EntryPage } from "../pages/front/f06_01_entry";
import { ForgotPage } from "../pages/front/f06_04_forgot";
import { registerFrontMember } from "../pages/front/member_entry";
import { M08CustomerEditPage } from "../pages/admin/m08_customer_edit";
import { リセットキーの保存値, リセットキーを持つ会員数 } from "../db/f06_04";
import * as prep from "../db/f06_04_prep";
import { RUN_MARK } from "../lib/run_marker";
import { 本会員を作る } from "./f06-member";

export const mailOf = (前半: string): string => `${rc(前半)}@example.test`;

// ---- 共有の設定: 仮会員機能（書き換える前の値を控え、ケースが終わるたびに戻す） ----
let 前の仮会員機能: boolean | null = null;
async function 仮会員機能を有効にする(browser: Browser): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const now = await readTempMember(page);
    if (now) return; // すでに有効。書き換えない
    // 共有の環境では共有の設定を書き換えない。「仮会員のまま」の会員は、いまの設定が有効のときだけ作れる
    if (SHARED_ENV) throw new Error("共有の環境では仮会員機能（共有の設定）を書き換えない。いまは無効で、仮会員のままの会員（このシードの前提は有効）を作れない");
    if (前の仮会員機能 === null) 前の仮会員機能 = now;
    await setTempMember(page, true);
  });
}
export async function 仮会員機能を戻す(browser: Browser): Promise<string> {
  if (前の仮会員機能 === null) return "";
  const 値 = 前の仮会員機能;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await setTempMember(page, 値); });
  if (!available) return "";
  const now = 仮会員機能が有効か();
  return now === 値 ? "" : `仮会員機能を ${値 ? "有効" : "無効"} に戻したが、DBの値は ${now ? "有効" : "無効"}`;
}

defineSeed("S-F06-04-MAILBOX", async () => {
  await mailIds(); // メールの受け口が読めること
});

/** 会員を登録し、管理画面で会員IDを控える。本会員にする（本登録のメールのURLを開く）かは registerFrontMember が仮会員機能の状態で決める */
export async function 会員を作る(browser: Browser, 前半: string, パスワード: string, 仮会員のまま: boolean): Promise<string> {
  const mail = mailOf(前半);
  if (仮会員のまま) await 仮会員機能を有効にする(browser); // 本会員は今の設定のまま登録して作る（仮会員になったときは本登録のメールのURLを開く）
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    if (仮会員のまま) await 仮会員で登録する(page, mail, パスワード);
    else await registerFrontMember(page, { 姓: "試験会員", 名: "再発行", セイ: "シケンカイイン", メイ: "サイハッコウ", メール: mail, パスワード });
  } finally { await context.close(); }
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await searchCustomer(page, mail);
    const id = await resultCustomerId(page, mail);
    if (!id) throw new Error(`会員 ${mail} が管理画面の会員検索一覧で1件に定まらない`);
    return id;
  });
}

async function 仮会員で登録する(page: Page, mail: string, パスワード: string): Promise<void> {
  const e = new EntryPage(page);
  await e.open();
  await e.fill({
    姓: "試験会員", 名: "再発行", セイ: "シケンカイイン", メイ: "サイハッコウ", 生年月日: ["1990", "1", "1"], メール: mail, パスワード,
    国: "Japan", 郵便番号: "1000001", 都道府県: "東京都", 住所1: "千代田区千代田", 住所2: "1-1", 電話番号: "09062040000",
  });
  const r = await e.同意する();
  if (!r.sent) throw new Error(`会員 ${mail} の登録: 「同意する」を押しても確認画面へ進めない`);
  await e.登録する();
  if (!e.完了画面か) throw new Error(`会員 ${mail} の登録が仮会員登録完了画面にならない（${e.path}）`);
}

export const 本会員のパスワード = (番号: string): string => `BeforeMail!604A-${番号}`;

for (const n of ["004", "006", "014", "015", "016", "017", "061", "062"]) {
  defineSeed(`S-F06-04-REG-A-${n}`, async ({ browser, notes }) => {
    notes.set(`〔会員ID-F0604-${n}〕`, await 会員を作る(browser, `f0604-a-${n}`, 本会員のパスワード(n), false));
  });
}
for (const n of ["009", "011"]) {
  defineSeed(`S-F06-04-PROVISIONAL-${n}`, async ({ browser, notes }) => {
    notes.set(`〔会員ID-F0604-${n}〕`, await 会員を作る(browser, `f0604-temp-${n}`, `ProvPass!604-${n}`, true));
  });
}


// ---------------------------------------------------------------------------
// リセットキーを持つ会員（画面でアプリにリセットキーを発行させ、メールのURLを控える）
// ---------------------------------------------------------------------------
const 記す = (m: string) => reportCurrentSeedIssue(`シード作成時の問題: ${m}`);
const 読み替え = "リセットキーを画面で指定できないので、本会員を画面で作ったあとパスワード再発行を申し込み、アプリが発行したリセットキー（有効期限は発行から24時間後）とメールのURLを使う（正本のリセットキー文字列・有効期限2099-12-31からの読み替え）";

/** 控えた再発行のメールのURL（シードの番号→URL） */
const 控えたURL = new Map<string, string>();
export function 再発行URL(番号: string): string {
  const u = 控えたURL.get(番号);
  if (!u) throw new Error(`再発行のメールのURL（${番号}）をまだ控えていない（そのシードを作っていない）`);
  return u;
}
/** URLの最後（リセットキー）を別の文字列に替える。空にすると「リセットキー文字列だけを削除した」URLになる */
export const キーを替えたURL = (url: string, 新しいキー: string): string => url.replace(/\/forgot\/reset\/[^/?#]*/, `/forgot/reset/${新しいキー}`);

async function 再発行を申し込んでURLを控える(browser: Browser, 番号: string, メール: string): Promise<void> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const f = new ForgotPage(await context.newPage());
    await f.再発行画面を開く();
    if (MAIL_URL) {
      控えたURL.set(番号, await f.申し込んでメールのURLを読む(メール));
    } else {
      // メールの受け口が無い環境: 申し込んだあと、印つきの会員のリセットキーをDBで読み（参照だけ）、アプリと同じ形のURLを組み立てる
      await f.申し込む(メール);
      const キー = リセットキーの保存値(メール);
      if (!キー) throw new Error(`会員 ${メール} にリセットキーが発行されていない`);
      控えたURL.set(番号, `${BASE_URL}/ja/forgot/reset/${キー}`);
      記す("メールの受け口が無い環境なので、再発行のメールのURLの代わりに、DBで会員のリセットキーを読んで再発行のURL（アプリと同じ形）を組み立てた");
    }
  } finally { await context.close(); }
}

type リセット会員 = { 前半: string; パスワード: string; 氏名: string };
/** 本会員を画面で作り、会員IDを返し、再発行のメールのURLを控える */
async function リセット会員を作る(browser: Browser, 番号: string, m: リセット会員): Promise<string> {
  const id = await 本会員を作る(browser, { 姓: m.氏名, 名: "試験", セイ: "サイセッテイ", メイ: "シケン", 前半: m.前半, パスワード: m.パスワード });
  await 再発行を申し込んでURLを控える(browser, 番号, mailOf(m.前半));
  記す(読み替え);
  return id;
}

for (const n of ["018", "019", "023", "024", "025", "027", "030", "031", "034", "035", "037", "039", "042", "043", "044", "045", "046", "047"]) {
  defineSeed(`S-F06-04-RESET-A-${n}`, async ({ browser, notes }) => {
    notes.set(`〔会員ID-F0604-${n}〕`, await リセット会員を作る(browser, n, { 前半: `f0604-reset-a-${n}`, パスワード: "BeforeReset!604", 氏名: "再設定本会員A" }));
  });
}
defineSeed("S-F06-04-RESET-A-033", async ({ browser, notes }) => {
  notes.set("〔会員ID-F0604-033A〕", await リセット会員を作る(browser, "033", { 前半: "f0604-reset-a-033", パスワード: "BeforeReset!604", 氏名: "再設定本会員A" }));
});
defineSeed("S-F06-04-REG-B-033", async ({ browser, notes }) => {
  notes.set("〔会員ID-F0604-033B〕", await 本会員を作る(browser, { 姓: "本会員B", 名: "試験", セイ: "ホンカイイン", メイ: "シケン", 前半: "f0604-b-033", パスワード: "BeforeReset!604B-033" }));
});
for (const n of ["064", "065"]) {
  defineSeed(`S-F06-04-RESET-A-${n}`, async ({ browser, notes }) => {
    notes.set(`〔会員ID-F0604-${n}〕`, await リセット会員を作る(browser, n, { 前半: `f0604-reset-${n}`, パスワード: `Before-F0604${n}`, 氏名: "再設定本会員A" }));
  });
}
defineSeed("S-F06-04-CBRESET-066", async ({ browser, notes }) => {
  notes.set("〔会員ID-F0604-066〕", await リセット会員を作る(browser, "066", { 前半: "cbf0604-066", パスワード: "Passw0rd-CBF0604066", 氏名: "再設定本会員CB" }));
});

// ---- 実在しないリセットキー ----
export const 存在しないキー = "NoSuchResetKey999";
defineSeed("S-F06-04-NOKEY-020", async () => {
  if (available && リセットキーを持つ会員数(存在しないキー) !== 0) throw new Error(`リセットキー ${存在しないキー} を持つ会員が既にいる（消さずに止める）`);
  記す(`リセットキーを持つ会員を0件にする作業は不要（消さない）。実在しないキー ${存在しないキー} を持つ会員が0件であることをDBの参照で確かめた`);
});

// ---- 期限切れ ----
for (const n of ["021", "048"]) {
  defineSeed(`S-F06-04-RESET-EXPIRED-${n}`, async ({ browser }) => {
    const 前半 = `f0604-expired-${n}`;
    await リセット会員を作る(browser, n, { 前半, パスワード: "BeforeReset!Expired", 氏名: "期限切れ本会員" });
    prep.有効期限を設定する(mailOf(前半), "2000-01-01 00:00:00");
    記す("DBで会員のリセットキーの有効期限を2000-01-01 00:00:00に設定した（画面では、発行時刻の24時間後より前にできない）。会員IDは画面が振った番号（正本の決め打ちの会員IDからの読み替え）");
  });
}

// ---- 仮会員にリセットキーがある ----
defineSeed("S-F06-04-RESET-PROVISIONAL-022", async ({ browser }) => {
  const 前半 = "f0604-temp-key-022";
  await 会員を作る(browser, 前半, "BeforeReset!Temp", true);
  prep.リセットキーを設定する(mailOf(前半), `ProvisionalKey604022${RUN_MARK}`, "2099-12-31 23:59:59");
  記す(`DBで仮会員のリセットキーを ProvisionalKey604022${RUN_MARK}（実行の印つき）、有効期限を2099-12-31 23:59:59に設定した（仮会員には画面で再発行できない）。会員IDは画面が振った番号`);
});
export const 仮会員のキー = `ProvisionalKey604022${RUN_MARK}`;

// ---- パスワードがメールアドレスと同じ ----
defineSeed("S-F06-04-RESET-EQUAL-026", async ({ browser }) => {
  const 最終 = mailOf("equal604-026");
  const 仮 = "equal604-026-pre";
  const id = await 本会員を作る(browser, { 姓: "同一パスワード会員", 名: "試験", セイ: "ドウイツ", メイ: "シケン", 前半: 仮, パスワード: 最終 });
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const ed = new M08CustomerEditPage(page);
    if ((await ed.open(id)) !== 200) throw new Error(`会員 ${id} の会員編集画面を開けない`);
    await ed.set("email", 最終);
    await ed.登録する();
    if (!(await ed.成功メッセージ())) throw new Error(`会員 ${id} のメールアドレス変更が成功の表示にならない（${(await ed.エラー文()).join(" / ")}）`);
  });
  await 再発行を申し込んでURLを控える(browser, "026", 最終);
  記す(`${読み替え}。保存パスワードがメールアドレスと同じ会員は、パスワードを最終のメールアドレスと同じ文字列にして登録し、管理画面の会員編集でメールアドレスだけをその文字列に変更して作った（DBは使わない）`);
});

// ---- 退会済み ----
defineSeed("S-F06-04-WITHDRAWN-059", async ({ browser, notes }) => {
  notes.set("〔会員ID-F0604-059〕", await 本会員を作る(browser, { 姓: "退会済み会員", 名: "試験", セイ: "タイカイズミ", メイ: "シケン", 前半: "f0604-w-059", パスワード: "Before-F0604059" }));
  prep.退会済みにする(mailOf("f0604-w-059"));
  記す("DBで会員を退会済み（ステータスを退会、削除フラグを有効）に設定した。画面の退会はメールアドレスをダミーに替えるので、元のメールアドレスのまま退会済みの会員は画面で作れない");
});
defineSeed("S-F06-04-RESET-WITHDRAWN-063", async ({ browser, notes }) => {
  notes.set("〔会員ID-F0604-063〕", await リセット会員を作る(browser, "063", { 前半: "f0604-w-063", パスワード: "Before-F0604063", 氏名: "退会済み再設定会員" }));
  prep.退会済みにする(mailOf("f0604-w-063"));
  記す("DBで会員を退会済み（ステータスを退会、削除フラグを有効）に設定した（リセットキーを発行したあと）。画面の退会はメールアドレスをダミーに替えるので、元のメールアドレスのまま退会済みの会員は画面で作れない");
});
