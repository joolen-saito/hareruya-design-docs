/**
 * F06-22 お問い合わせ の画面シード（-b）。正本: cases/F06-22_seed_data.tsv
 *
 * - 会員A・B: フロントの会員登録 → 本登録のメールのURL → 管理画面の会員一覧で会員IDを控える（依頼者決定 2026-10-31）。
 *   メールアドレスの前半に実行の印を付ける（依頼者決定 2026-10-28）。パスワードには付けない。
 * - 件名のマスタ（共有の設定）: 管理画面の「MTGマスターデータ」で、シード表の値に書き換える。書き換える前の値は実行のあいだ
 *   控えて（クラッシュしても戻せるようファイルにも残して）、spec の終わりに控えた値へ戻し、DBの参照で戻ったことを確かめる。
 * - 開始時に一致するお問い合わせが0件のシード（DBで消す作り方）: DBへは書き込まない決まりのため、入力用メールアドレスに実行の印を付けて
 *   0件を成り立たせ、DBの参照で確かめる（正本の外の補い。判定の区分「条件付き」）。
 * - 店舗（STORES）: 4店舗を店舗登録画面で、あれば使い無ければ作る。ただし「公開営業店20の受付アドレスを空にする」と「登録済み店舗をこの4件だけにする」は
 *   DBでの設定のため行わない（公開営業店20の受付アドレスは仮の値のまま、手元の環境にはほかの店舗がある）。実装するケースは、この2つを確かめないものだけ。
 * - イベント（EVENT）・申込（ENTRY）・メール試験設備の接続（MAIL）は、DBでの設定を含むため作らない（実装するケースは、これらを確かめないものだけ。個別に注記する）。
 */
import fs from "node:fs";
import path from "node:path";
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { イベント詳細の件数, 件名の全行, お問い合わせ } from "../db/f06_22";
import { available } from "../lib/db";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { resultCustomerId, searchCustomer } from "../pages/admin/f06_customer";
import { 件名の値, 件名の表, 件名の表を読む, 件名を書き換える } from "../pages/admin/f06_22_subjects";
import { registerFrontMember } from "../pages/front/member_entry";
import { findTenantId } from "../pages/admin/tenant_k";
import { E2Eの店舗, 元からある店舗 } from "../lib/store_create_ban";
import { 表示の値の一覧 } from "../db/store_pick";
import { 店舗を選んだ, 使う店舗 } from "./f06-22";
import { 店舗の設定をケースの間だけ書き換える } from "../pages/admin/store_setting_restore";

export const PW_A = "Passw0rd!F0622A";
export const PW_B = "Passw0rd!F0622B";
/** メールアドレス（前半に実行の印を付ける） */
export const mailOf = (前半: string): string => `${rc(前半)}@example.test`;

// ---- 会員A・B ----
type 会員の定め = { 前半: string; 姓: string; 名: string; 電話: [string, string, string]; パスワード: string; 呼び名: string };
const 会員A: 会員の定め = { 前半: "member-a", 姓: "晴屋", 名: "太郎", 電話: ["03", "1234", "5678"], パスワード: PW_A, 呼び名: "共有A" };
const 会員B: 会員の定め = { 前半: "member-b", 姓: "別会員", 名: "次郎", 電話: ["03", "9876", "5432"], パスワード: PW_B, 呼び名: "共有B" };

async function 会員を作る(browser: Browser, m: 会員の定め): Promise<string> {
  const メール = mailOf(m.前半);
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    page.setDefaultNavigationTimeout(120_000);
    await registerFrontMember(page, {
      姓: m.姓, 名: m.名, セイ: "ハレヤ", メイ: "タロウ", メール, パスワード: m.パスワード,
      詳細: { 郵便番号1: "100", 郵便番号2: "0005", 都道府県: "東京都", 住所1: "千代田区丸の内", 住所2: "1-1", 電話: m.電話 },
    });
  } finally { await context.close(); }
  const id = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await searchCustomer(page, メール);
    return resultCustomerId(page, メール);
  });
  if (!id) throw new Error(`登録した会員 ${メール} を管理画面の会員一覧で1件に定められない`);
  return id;
}
for (const [seedId, m] of [["S-F06-22-MEMBER-A", 会員A], ["S-F06-22-MEMBER-B", 会員B]] as const) {
  defineSeed(seedId, async ({ browser, notes }) => {
    notes.set(`〔会員ID-F0622-${m.呼び名}〕`, await 会員を作る(browser, m));
  });
}

// ---- 件名のマスタ（共有の設定） ----
const 控えの置き場 = path.resolve(__dirname, "..", ".runs", "f06-22-subjects-original.json");
let 書き換え済み = false;
/**
 * シード表の値（変えるのは、いまの値と違う項目だけ）。
 * 件名ID 2・4・5 の英語名称は、シード表が「ID 1〜7は英語名称あり」とだけ定めて値を示さないので、手元の環境で空だった3件に
 * 英語名称（About Online Buying など）を入れた。ケースは英語名称の文字そのものを確かめない（選択肢が出るかだけ）。
 */
const 求める件名: Record<string, Partial<件名の値>> = {
  "1": { email: "subject-commerce@example.test", attached_info_name: "注文番号", sort_no: "1" },
  "2": { subject_en: "About Online Buying", email: "", attached_info_name: "買取番号", sort_no: "2" },
  "3": { email: "subject-event@example.test", shop_flg: "1", sort_no: "3" },
  "4": { subject_en: "About Consignment Sales", sort_no: "4" }, "5": { subject_en: "About Deck Building Feature", sort_no: "5" }, "6": { sort_no: "6" },
  "7": { attached_info_name: "注文番号または買取番号", sort_no: "7" },
  "8": { subject_en: "", sort_no: "8" },
};
const 求める名称: Record<string, string> = {
  "1": "通販に関するお問い合わせ", "2": "ネット買取に関するお問い合わせ", "3": "店舗でのお買い物・イベントに関するお問い合わせ", "4": "委託販売に関するお問い合わせ",
  "5": "デッキ構築機能に関するお問い合わせ", "6": "記事・動画に関するお問い合わせ", "7": "その他のお問い合わせ", "8": "協賛関連",
};

defineSeed("S-F06-22-SUBJECTS", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const いま = await 件名の表を読む(page);
    const ids = Object.keys(求める名称).sort();
    if (Object.keys(いま).sort().join() !== ids.join()) throw new Error(`お問い合わせ件名が ID ${ids.join("・")} の8行でない（いまの行: ${Object.keys(いま).join("・")}）。行の追加・削除はしない`);
    for (const id of ids) if (いま[id].subject !== 求める名称[id]) throw new Error(`件名ID ${id} の日本語名称が「${いま[id].subject}」（シード表は「${求める名称[id]}」。名称の書き換えはしない）`);
    // 前の実行が途中で止まり、控えが残っているときは、その控え（本当の元の値）を使う。書き換える前の値を控える
    if (!fs.existsSync(控えの置き場)) {
      fs.mkdirSync(path.dirname(控えの置き場), { recursive: true });
      fs.writeFileSync(控えの置き場, JSON.stringify(いま));
    }
    const 変更: Record<string, Partial<件名の値>> = {};
    for (const id of ids) {
      for (const [k, v] of Object.entries(求める件名[id] ?? {})) {
        if (いま[id][k as keyof 件名の値] !== v) (変更[id] ??= {})[k as keyof 件名の値] = v;
      }
    }
    if (Object.keys(変更).length) await 件名を書き換える(page, 変更);
    書き換え済み = true;
  });
  if (available) {
    const 行 = Object.fromEntries(件名の全行().map((r) => [r.件名ID, r]));
    const 違い: string[] = [];
    if (行["1"].受付アドレス !== "subject-commerce@example.test" || 行["1"].付帯情報名 !== "注文番号") 違い.push("件名1");
    if (行["2"].受付アドレス !== "" || 行["2"].付帯情報名 !== "買取番号") 違い.push("件名2");
    if (行["3"].受付アドレス !== "subject-event@example.test" || !行["3"].店舗選択あり) 違い.push("件名3");
    if (行["7"].付帯情報名 !== "注文番号または買取番号") 違い.push("件名7");
    if (行["8"].件名英語 !== "") 違い.push("件名8");
    if (違い.length) throw new Error(`件名のマスタをシード表の値にしたが、DBの値が違う: ${違い.join("・")}`);
  }
});

/** 控えた値へ戻し、戻った値をDBで確かめた結果を返す（戻せなかったときは文を返す。書き換えていなければ空） */
export async function 件名を戻す(browser: Browser): Promise<string> {
  if (!書き換え済み && !fs.existsSync(控えの置き場)) return "";
  if (!fs.existsSync(控えの置き場)) return "";
  const 元: 件名の表 = JSON.parse(fs.readFileSync(控えの置き場, "utf-8"));
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const いま = await 件名の表を読む(page);
    const 変更: Record<string, Partial<件名の値>> = {};
    for (const [id, v] of Object.entries(元)) {
      for (const [k, val] of Object.entries(v)) {
        if (いま[id]?.[k as keyof 件名の値] !== val) (変更[id] ??= {})[k as keyof 件名の値] = val;
      }
    }
    if (Object.keys(変更).length) await 件名を書き換える(page, 変更);
  });
  書き換え済み = false;
  if (!available) { fs.rmSync(控えの置き場); return ""; }
  const 行 = Object.fromEntries(件名の全行().map((r) => [r.件名ID, r]));
  const 違い: string[] = [];
  for (const [id, v] of Object.entries(元)) {
    const r = 行[id];
    if (!r || r.受付アドレス !== v.email || r.付帯情報名 !== v.attached_info_name || r.件名英語 !== v.subject_en || r.件名 !== v.subject || r.店舗選択あり !== (v.shop_flg === "1") || r.並び順 !== v.sort_no) 違い.push(`件名${id}`);
  }
  if (違い.length) return `件名のマスタを元の値へ戻したが、DBの値が元と違う: ${違い.join("・")}`;
  fs.rmSync(控えの置き場);
  return "";
}

// ---- 店舗（作らない。使い回す店舗の表から選ぶ。依頼者 2026-11-15「店舗は作るのもう禁止」） ----
/**
 * 公開営業店10 = お問い合わせ画面の店舗選択の先頭の店舗、公開営業店20 = その次の店舗（どちらも公開・開店。使い回す店舗の表の中で、表示順の小さい順）。
 * 閉店店舗30・非公開店舗40 は、010・011 が閉店と非公開の店舗を用意する で E2E の店舗の性質をケースの間だけ書き換えて表す。
 * 店舗の設定（表示順・受付アドレス）は書き換えない。
 */
/** 閉店店舗30の役（公開のまま、ケースの間だけ閉店にする E2E の店舗）と、非公開店舗40の役（もとから非公開。ケースの間だけ開店にする E2E の店舗） */
const C店 = "5007";
const D店 = "4974";

function 公開営業店を選ぶ(): { A: 使う店舗; B: 使う店舗 } {
  // 5007（閉店店舗30の役）と 4974（非公開店舗40の役）は、010・011 がケースの間だけ性質を書き換えるので、公開営業店には選ばない
  const 候補 = [...E2Eの店舗, ...元からある店舗].filter((s) => s.公開 && s.開店 && s.id !== C店 && s.id !== D店).map((s) => s.id);
  const v = 表示の値の一覧(候補).sort((a, b) => a.表示順 - b.表示順 || Number(a.id) - Number(b.id));
  if (v.length < 2) throw new Error("店舗を作らない（依頼者 2026-11-15）: 公開・開店の店舗が使い回す店舗の表に2店ない");
  const 使う = (x: (typeof v)[number]): 使う店舗 => ({ 店舗ID: x.id, 表示: x.略称, 店名: x.店名, 表示順: x.表示順 });
  return { A: 使う(v[0]), B: 使う(v[1]) };
}
/** 公開営業店10（お問い合わせ店舗選択の先頭の店舗）の、画面での表示名。DB が読めないときは正本の店名 */
export const 店10の表示 = (() => { try { return 公開営業店を選ぶ().A.表示; } catch { return "公開営業店10"; } })();
defineSeed("S-F06-22-STORES", async ({ browser, notes }) => {
  const { A, B } = 公開営業店を選ぶ();
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const [呼び名, s] of [["共有A", A], ["共有B", B]] as const) {
      const id = await findTenantId(page, s.店名);
      if (id !== s.店舗ID) throw new Error(`使い回す店舗「${s.店名}」（店舗ID ${s.店舗ID}）が店舗一覧に無い（${id ?? "なし"}）`);
      notes.set(`〔店舗ID-F0622-${呼び名}〕`, id);
    }
  });
  店舗を選んだ("A", A); 店舗を選んだ("B", B); 店舗を選んだ("C", null); 店舗を選んだ("D", null);
  reportSeedIssue("S-F06-22-STORES", `読み替え: 正本の「公開営業店10」は店舗「${A.店名}」（店舗ID ${A.店舗ID}・表示順 ${A.表示順}）、「公開営業店20」は店舗「${B.店名}」（店舗ID ${B.店舗ID}・表示順 ${B.表示順}）で表した（店舗は作らない決まり）。閉店店舗30・非公開店舗40 は、010・011 がケースの間だけ E2E の店舗（5007 を閉店・4974 を開店）で表す。公開営業店20の受付アドレスを空にすること・登録済み店舗を4件だけにすることは行っていない`);
});

// ---- 環境のシード（作り方は無い） ----
defineSeed("S-F06-22-MAIL", async () => {
  reportSeedIssue("S-F06-22-MAIL", "ショップ基本情報の受付アドレスの設定と、メール試験設備の接続は行っていない（このケースは受付側のメールの宛先を確かめないため）");
});

// ---- 開始時に一致するお問い合わせが0件のシード（実行の印を付けた入力用メールアドレスで成り立たせ、DBの参照で確かめる） ----
export const お問い合わせの入力メール: Record<string, string> = {
  "026": "name-max16", "031": "optional-empty", "035": "save-f0622", "036": "shop-save", "037": "cancel-copy", "038": "event-clear", "039": "member-b", "041": "no-customer-f0622",
};
for (const [k, 前半] of Object.entries(お問い合わせの入力メール)) {
  if (k === "039") continue; // 会員Bのメールアドレス（会員の登録で0件を確かめる）
  defineSeed(`S-F06-22-CONTACT-${k}`, async () => {
    if (!available) { reportSeedIssue(`S-F06-22-CONTACT-${k}`, "この環境はDB確認ができないため、開始時の一致するお問い合わせが0件であることを確かめていない"); return; }
    const n = お問い合わせ(mailOf(前半)).length;
    if (n !== 0) throw new Error(`メールアドレス ${mailOf(前半)} のお問い合わせが開始時に ${n} 件ある`);
  });
}
defineSeed("S-F06-22-CONTACT-039", async () => {
  if (!available) return;
  const n = お問い合わせ(mailOf("member-b")).length;
  if (n !== 0) throw new Error(`メールアドレス ${mailOf("member-b")} のお問い合わせが開始時に ${n} 件ある`);
});
for (const k of ["046", "047"]) {
  const 前半 = k === "046" ? "complete-f0622" : "top-f0622";
  defineSeed(`S-F06-22-CONTACT-${k}`, async () => {
    if (available && お問い合わせ(mailOf(前半)).length !== 0) throw new Error(`メールアドレス ${mailOf(前半)} のお問い合わせが開始時に残っている`);
  });
}
for (const k of ["049", "050", "051", "052", "053", "054", "058"]) {
  defineSeed(`S-F06-22-FORM-${k}`, async () => { /* 入力値はテストが入力する。058 は未ログインのブラウザで開く */ });
}
defineSeed("S-F06-22-NOEVENT-057", async () => {
  if (available) {
    const n = イベント詳細の件数(6220570);
    if (n !== 0) throw new Error(`イベント詳細ID 6220570 のレコードが ${n} 件ある（シード表は存在しない）`);
  }
});

/**
 * 010・011 が使う。閉店店舗30＝E2E の店舗 5007 をケースの間だけ閉店にし、非公開店舗40＝E2E の店舗 4974（非公開）をケースの間だけ開店にして、
 * ケースの終わりに元へ戻す（registerRestore。依頼者 2026-11-15）。書き換えるので 010・011 は solo_cases.tsv の一人で流す回で流す。
 */
export async function 閉店と非公開の店舗を用意する(browser: Browser): Promise<void> {
  const { A, B } = 公開営業店を選ぶ();
  const 表示 = 表示の値の一覧([C店, D店]);
  const 使う = (id: string): 使う店舗 => { const x = 表示.find((v) => v.id === id)!; return { 店舗ID: x.id, 表示: x.略称, 店名: x.店名, 表示順: x.表示順 }; };
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const issue = (m: string) => reportSeedIssue("S-F06-22-STORES", m);
    await 店舗の設定をケースの間だけ書き換える(page, C店, { 開店: "閉店" }, "閉店店舗30の役の店舗を閉店にする", issue);
    await 店舗の設定をケースの間だけ書き換える(page, D店, { 開店: "開店" }, "非公開店舗40の役の店舗を開店にする", issue);
  });
  店舗を選んだ("A", A); 店舗を選んだ("B", B); 店舗を選んだ("C", 使う(C店)); 店舗を選んだ("D", 使う(D店));
}
