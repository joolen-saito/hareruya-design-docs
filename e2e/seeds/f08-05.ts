/**
 * F08-05（店頭買取査定申込確認・申込履歴）の画面シード。正本: cases/F08-05_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10。チームの結合テスト実施手順に合わせる）で、シード表の「DBで準備」は、画面で作れる同じ前提か既存データへ読み替えた。
 * 読み替えたことは、そのシードを使うケースの注記（シード作成時の問題）に残す（reportSeedIssue）。DB へは書き込まない。
 *
 * 作るシード:
 * - 店舗（STORE-NNN・CBSTORE-NNN・PD-STORE-07N）: ケースごとの店舗を作らず、F08-05 で共通の試験店舗「店頭買取PD0805-003」
 *   （支店URL itf0805pd003。074 で作ったもの。無ければ登録）を使う。ケースごとに店舗を作ると共有の開発環境に70を超える店舗が残るため。
 *   「試験実行日の査定申込み=0件」（再実行時はDBで削除）は、申込者の姓に実行の印を付け、この実行の申込みだけを数えることで代えた。
 *   ケースの手順の店舗識別名「itf0805cNNN」は itf0805pd003 として読む。控える店舗IDは、どの呼び名もこの店舗のID。
 * - 申込者の入力値（APPLICANT-NNN など）: 姓とメールアドレスの前半に実行の印を付ける。同じメールアドレスの会員・プレイヤーが
 *   0件であること（再実行時はDBで削除）は、印で新しいアドレスになることで代えた（消さない）。
 * - 会員（MEMBER-NNN）: フロントの会員登録で作り、仮会員なら管理画面の会員登録編集で本会員にする（シード表の作り方のとおり）。
 *   メールアドレスの前半に実行の印を付ける。生年月日は「試験実行日時点で30歳」になる年の1月1日。
 * - ブラックリスト（BLACKLIST-NNN）: シード表の種別「名称」は、ブラックリスト管理の種別「氏名」として登録する。キーワードは印つきの姓＋名。
 *   「一致する行があれば削除」は、印で一致する行が無いので削除しない。
 * - 仮会員設定（ACTIVATE-ON・PD-ACTIVATE・ACTIVATE-OFF-080）: 共有の設定なので、共有の環境では（夜の1本流しの回を除き）書き換えず、いまの値が前提と同じことを
 *   確かめて使う（違えば止める）。手元の環境では前提の値にし、ON は実行の最後、OFF-080 はケースの終わりに元の値へ戻す。
 * - メールテンプレート（TPL-JP）: 037 以外は件名を書き換えず（共有の設定）、名称の確かめだけにする（044 は使用したテンプレートの名称で確かめる）。
 *   037 のときだけ下のとおり書き換えて戻す。
 * - 管理者（PD-ADM）: 権限は正本が定める細かな権限の代わりに、システム管理者にした（074 から）。
 *
 * 受信箱（MAILBOX）: 開発環境のメールの受け口（E2E_MAIL_URL）を読む。消さずに、操作の前に控えた番号より後の、宛先一致のメールだけを数える。
 *
 * 共有のものを書き換えるシード（037〜041・085 が使う。夜に1本だけで流す回 E2E_ALLOW_SHARED=1 でだけ書き換える。そうでなければ書き換えずに止まる）:
 * いずれも、書き換える前に今の値を画面から全部控え（lib/shared_restore.ts の registerRestore）、ケースの終わりに基盤が画面で元の値に戻して確かめる。
 * - 基本情報（BASIC。039〜041）: 店舗基本設定の全項目を控え、送信元メールアドレス・店名・返信先メールアドレス・送信エラー通知メールアドレスを書き換える。
 *   戻すときは控えた全項目を書き戻す。
 * - メールテンプレート（TPL-JP は 037 のとき、TPL-EN は 038）: 自動送信メールの設定画面で、名称が完全に一致するテンプレート（1件でなければ止まる）の
 *   編集欄（名称・件名・ヘッダー・フッター）を全部控え、件名を書き換える。戻すときは控えた欄を全部書き戻す。
 * - 仮会員設定（ACTIVATE-ON・GF-ACTIVATE-OFF）: 共有の環境の夜の1本流しでは、店舗基本設定の全項目を控えて書き換え、基盤が全項目を戻す。
 * - 044 など TPL-JP を使うほかのケースは、従来どおり件名を書き換えない。
 */
import { Browser, test } from "@playwright/test";
import { registerRestore } from "../lib/shared_restore";
import { ShopBasicPage } from "../pages/admin/m10_01_shop";
import { テンプレートを開く, テンプレートの欄を保存する, テンプレートの欄を読む } from "../pages/admin/f08_05_member";
import { BASE_URL, SETUP_ADMIN, SHARED_ENV } from "../config/env";
import { mailIds } from "../lib/mail";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, hideDebugToolbar, withAdminSession } from "../lib/session";
import { blacklistRows, ensureBlacklist, readTempMember, setTempMember } from "../pages/admin/f06_masters";
import { 自動送信メールのテンプレート名 } from "../pages/admin/f08_05_member";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_reuse_k";
import { ensureStore, 使い回す店舗の入力 } from "../pages/admin/m04_24_reuse_k";
import { customerIdByEmail } from "../pages/admin/m06_04_member";
import { 管理画面で本会員にする } from "../pages/admin/member_activate";
import { EntryPage } from "../pages/front/f06_01_entry";
import { 申込入力, 申込者 } from "../pages/front/f08_05_confirm";
import { registerFrontMember } from "../pages/front/member_entry";

export const F0805_ADMIN: Account = { loginId: "f0805pdadmin", password: "Passw0rd-PD0805" };
/** 店舗は作らない（依頼者 2026-11-15）。F08-01〜05 共通の店頭買取の店舗は、使い回す E2E の店舗 221（公開・開店の支店）で表す。店名・支店URLは店舗のいまの値 */
export const PD_STORE = 使い回す店舗の入力("221", "店頭買取PD0805-003");
export const PD_MEMBER_PASSWORD = "Pw-F0805-PD-003";
/** 会員のメールアドレス（正本の pd0805-003@example.test の前半に実行の印を付けた値） */
export const pdMemberEmail = () => `${rc("pd0805-003")}@example.test`;

// ---- 画面入力値（シード表の取り決め） ----

/** S-F08-05-PASSWORD: 会員登録フォームのパスワード（ログインする会員のパスワードも同じ） */
export const F0805_PASSWORD = "Pw-F0805-Secret-01";

/** S-F08-05-INPUT-COMMON（S-F08-05-PD-INPUT も同じ値） */
export const 共通入力: 申込入力 = {
  言語: "JP", 国: "日本", 郵便番号: ["100", "8050"], 都道府県: "東京都", 住所1: "千代田区", 住所2: "千代田1-1",
  生年月日: ["1977", "7", "7"], 電話: ["03", "5805", "0805"], 職業: "会社員", サプライ: ["スリーブ"],
  電話連絡: "不必要", 大会参加: "いいえ", 適格請求書発行事業者: "いいえ", 利用規約同意: true,
};
/** S-F08-05-INVOICE-NO を共通入力に重ねた値 */
export const 適格請求書の入力: 申込入力 = { ...共通入力, 適格請求書発行事業者: "はい", 登録番号: "T8050000000009" };
/** S-F08-05-INPUT-US（郵便番号・都道府県は入れない） */
export const 米国の入力: 申込入力 = { ...共通入力, 国: "米国", 郵便番号: undefined, 都道府県: undefined, 住所1: "1 Main Street", 住所2: "Springfield" };
/** S-F08-05-GF-INPUT-US-ZIP（郵便番号は国が日本以外のときの1欄） */
export const 米国の郵便番号つき入力: 申込入力 = { ...米国の入力, 海外郵便番号: "90210" };
/** S-F08-05-INPUT-EN（英語表示。フリガナは入れない） */
export const 英語の入力: 申込入力 = { ...共通入力, 言語: "EN", 住所1: "Chiyoda", 住所2: "1-1" };
/** S-F08-05-INPUT-EN-US */
export const 英語の米国の入力: 申込入力 = { ...英語の入力, 国: "米国", 郵便番号: undefined, 都道府県: undefined, 住所1: "1 Main Street", 住所2: "Springfield" };
/** S-F08-05-DP-INPUT-081（返却希望サプライを2つ選び、その他の欄にも入れる） */
export const サプライ複数の入力: 申込入力 = { ...共通入力, サプライ: ["スリーブ", "ストレージボックス"], サプライその他: "F0805-081サプライ" };

/** 申込者（姓に実行の印を付ける）。正本の姓は「査定F0805-NNN」、名「太郎」、フリガナ「ケッテイ タロウ」、住所3「F0805-NNNビル」 */
export const 申込者の = (n: string, o: Partial<申込者> & { 姓の頭?: string } = {}): 申込者 => ({
  姓: rc(`${o.姓の頭 ?? "査定"}F0805-${n}`), 名: o.名 ?? "太郎", セイ: "セイ" in o ? o.セイ : "ケッテイ", メイ: "メイ" in o ? o.メイ : "タロウ",
  住所3: "住所3" in o ? o.住所3 : `F0805-${n}ビル`,
});
/** 英語表示の申込者（フリガナを入れない） */
export const 英語の申込者 = (n: string, o: Partial<申込者> = {}): 申込者 => 申込者の(n, { セイ: undefined, メイ: undefined, ...o });
/** 申込者のメールアドレス（正本の前半に実行の印を付ける） */
export const 申込メール = (前半: string) => `${rc(前半)}@example.test`;
/** ブラックリストに登録する氏名（印つきの姓＋名） */
export const 拒否の氏名 = (n: string) => `${rc(`拒否F0805-${n}`)}対象`;
/** 会員（MEMBER-NNN）のメールアドレス */
export const 会員メール = (n: string) => 申込メール(`member-f0805-${n}`);

const 入力値の取り決め = [
  "S-F08-05-INPUT-COMMON", "S-F08-05-PASSWORD", "S-F08-05-INVOICE-NO", "S-F08-05-INPUT-US", "S-F08-05-INPUT-EN", "S-F08-05-INPUT-EN-US",
  "S-F08-05-GF-INPUT-US-ZIP", "S-F08-05-PD-INPUT", "S-F08-05-DP-INPUT-081", "S-F08-05-CBAPPLICANT-083", "S-F08-05-CBAPPLICANT-085", "S-F08-05-CBAPPLICANT-086", "S-F08-05-CBAPPLICANT-088",
];
/** 申込者の入力値だけのシード（APPLICANT-NNN。メールアドレスを持つものは、印で新しいアドレスになる） */
const 申込者の番号 = [
  "037", "038", "039", "040", "041", "001", "002", "003", "005", "006", "007", "009", "013", "029", "042", "043", "045", "014", "015", "016", "017", "018", "019", "020", "021", "022", "024", "025", "026", "027",
  "028", "031", "032", "035", "036", "044", "046", "047", "048", "049", "050", "051", "053", "054", "055", "057", "058", "060", "061", "062", "063",
  "064", "066", "067", "068", "069", "070", "071", "076", "077", "078", "079", "080",
];
for (const id of 入力値の取り決め) defineSeed(id, async () => { /* 入力値の取り決め。投入は要らない（値は上の定数） */ });
for (const n of 申込者の番号) {
  defineSeed(`S-F08-05-APPLICANT-${n}`, async ({ seed }) => {
    if (/削除/.test(seed.投入方法)) {
      reportSeedIssue(seed.シードID, "メールアドレスの前半と申込者の姓に実行の印を付けた。同じメールアドレスの会員・プレイヤーが0件であることは、印で新しいアドレスになることで代えた（DBで削除しない）");
    }
  });
}

// ---- 店舗 ----

const 店舗の注記 = (店舗: string) =>
  `店舗「${店舗}」を新しく作らず、F08-05 で共通の試験店舗「${PD_STORE.店名}」（店舗ID ${PD_STORE.店舗ID}・支店URL ${PD_STORE.支店URL}。店舗は作らない決まり。依頼者 2026-11-15）に読み替えた。` +
  "手順の店舗識別名もこの店舗の支店URLとして読む。査定申込み0件の前提（再実行時はDBで削除）は、申込者の姓に実行の印を付けてこの実行の申込みだけを数えることで代えた";

async function 共通の店舗(browser: Browser, seedId: string): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    return ensureStore(page, PD_STORE, (m) => reportSeedIssue(seedId, m));
  });
}

const 店舗の番号 = [
  "037", "038", "039", "040", "041", "001", "002", "003", "005", "006", "007", "008", "009", "013", "029", "042", "043", "045", "014", "015", "016", "017", "018", "019", "020", "021", "022", "024", "025", "026",
  "027", "028", "031", "032", "035", "036", "044", "046", "047", "048", "049", "050", "051", "052", "053", "054", "055", "057", "058", "060", "061",
  "062", "063", "064", "065", "066", "067", "068", "069", "070", "071", "076", "077", "078", "079", "080", "081", "082",
];
for (const n of 店舗の番号) {
  defineSeed(`S-F08-05-STORE-${n}`, async ({ browser, notes, seed }) => {
    notes.set(`〔店舗ID-F0805-${n}〕`, await 共通の店舗(browser, seed.シードID));
    reportSeedIssue(seed.シードID, 店舗の注記(`店頭買取F0805-${n}`));
  });
}
for (const n of ["083", "085", "086", "088"]) {
  defineSeed(`S-F08-05-CBSTORE-${n}`, async ({ browser, notes, seed }) => {
    notes.set(`〔店舗ID-F0805-CB${n}〕`, await 共通の店舗(browser, seed.シードID));
    reportSeedIssue(seed.シードID, 店舗の注記(`店頭買取F0805-CB${n}`));
  });
}
for (const [caseNo, 呼び名] of [["072", "001"], ["073", "002"], ["075", "004"]] as const) {
  defineSeed(`S-F08-05-PD-STORE-${caseNo}`, async ({ browser, notes, seed }) => {
    notes.set(`〔店舗ID-F0805-${呼び名}〕`, await 共通の店舗(browser, seed.シードID));
    reportSeedIssue(seed.シードID, 店舗の注記(`店頭買取PD0805-${呼び名}`));
  });
}

defineSeed("S-F08-05-PD-STORE-074", async ({ browser, notes, seed }) => {
  notes.set("〔店舗ID-F0805-003〕", await 共通の店舗(browser, seed.シードID));
});

// ---- 会員 ----

defineSeed("S-F08-05-PD-MEMBER-074", async ({ browser, notes }) => {
  const email = pdMemberEmail();
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await registerFrontMember(page, {
      姓: "履歴丙", 名: "三郎", セイ: "レキシヘイ", メイ: "サブロウ", メール: email, パスワード: PD_MEMBER_PASSWORD,
      詳細: { 郵便番号1: "160", 郵便番号2: "0023", 都道府県: "東京都", 住所1: "新宿区西新宿1-1-1", 住所2: "履歴ビル003", 電話: ["03", "1234", "5678"] },
    });
  } finally {
    await context.close();
  }
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const id = await customerIdByEmail(page, email);
    if (!id) throw new Error(`会員 ${email} が会員一覧に出ない`);
    notes.set("〔会員ID-F0805-003〕", id);
  });
});

/**
 * 会員（MEMBER-NNN）: フロントの会員情報登録画面で登録し、仮会員になったら管理画面の会員登録編集で本会員にする。会員IDを返す。
 * 住所3の欄が日本の住所の画面に無いときは入れない（注記に残す）。
 */
async function 会員を用意する(browser: Browser, n: string, issue: (m: string) => void): Promise<string> {
  const メール = 会員メール(n);
  const 年 = String(new Date().getFullYear() - 30);
  let 仮会員 = false;
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const e = new EntryPage(await context.newPage());
    e.page.setDefaultTimeout(60_000);
    await e.open();
    await e.fill({
      姓: `会員F0805-${n}`, 名: "太郎", セイ: "カイイン", メイ: "タロウ", 生年月日: [年, "1", "1"], メール, パスワード: F0805_PASSWORD,
      国: "Japan", 郵便番号: `100-8${n}`, 都道府県: "東京都", 住所1: "千代田区", 住所2: "千代田1-1", 電話番号: `0358050${n}`,
      // 店頭買取査定申込の入力画面は職業が必須で、会員の職業が空だと「会員情報が反映された状態」のまま「次のページへ進む」を押しても進めない。シード表は職業を定めないので会社員にした
      職業: "会社員",
    });
    issue(`会員情報登録で職業を「会社員」にした（シード表は職業を定めない。店頭買取査定申込の入力画面は職業が必須で、空のままだと会員情報が反映された状態で「次のページへ進む」を押しても進めない）`);
    if (await e.f("address][addr03").isVisible()) await e.f("address][addr03").fill(`F0805-${n}ビル`);
    else issue(`会員情報登録画面に住所3の欄が無いので、住所3「F0805-${n}ビル」は入れていない`);
    if (!(await e.同意する()).sent) throw new Error(`会員 ${メール} の登録: 「同意して確認画面へ」を押しても確認画面へ進めない`);
    await e.登録する();
    if (e.登録エラー画面か) throw new Error(`会員 ${メール} の登録が登録エラーの画面になった（${e.path}）`);
    仮会員 = e.完了画面か;
  } finally {
    await context.close();
  }
  issue(`メールアドレスの前半に実行の印を付けた（${メール}）。生年月日は ${年}年1月1日（試験実行日時点で30歳）にした`);
  if (仮会員) {
    const r = await 管理画面で本会員にする(browser, メール);
    issue(`登録直後の会員ステータス「${r.前の状態}」を、管理画面の会員登録編集で本会員にした`);
    return r.会員ID;
  }
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const id = await customerIdByEmail(page, メール);
    if (!id) throw new Error(`会員 ${メール} が会員一覧に出ない`);
    return id;
  });
}

for (const n of ["008", "052", "065", "082"]) {
  defineSeed(`S-F08-05-MEMBER-${n}`, async ({ browser, notes, seed }) => {
    notes.set(`〔会員ID-F0805-${n}〕`, await 会員を用意する(browser, n, (m) => reportSeedIssue(seed.シードID, m)));
  });
}

// ---- ブラックリスト ----

for (const n of ["013", "028", "029", "031"]) {
  defineSeed(`S-F08-05-BLACKLIST-${n}`, async ({ browser, seed }) => {
    const 氏名 = 拒否の氏名(n);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      await ensureBlacklist(page, "氏名", 氏名);
    });
    reportSeedIssue(seed.シードID, `シード表の種別「名称」は、ブラックリスト管理の種別「氏名」として、キーワード「${氏名}」（姓に実行の印）で登録した。` +
      "一致する行を削除する作り方は、印で一致する行が無いので行っていない（共有のブラックリストを消さない）");
  });
}

/** PD-APPLICANT: 申込者の氏名・電話番号・住所に一致するブラックリストが無いことを確かめる（共有のデータなので、あっても消さずに止める） */
for (const [caseNo, 氏名, 住所3] of [["072", "査定一太郎", "PD0805-001ビル"], ["073", "査定二次郎", "PD0805-002ビル"], ["075", "査定四四郎", "PD0805-004ビル"]] as const) {
  defineSeed(`S-F08-05-PD-APPLICANT-${caseNo}`, async ({ browser, seed }) => {
    const want = [
      { 種別: "氏名", キーワード: 氏名 }, { 種別: "電話番号", キーワード: "0358050805" },
      { 種別: "住所", キーワード: "東京都千代田区千代田1-1" }, { 種別: "住所", キーワード: `東京都千代田区千代田1-1${住所3}` },
    ];
    const rows = await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); return blacklistRows(page); });
    const hit = rows.filter((r) => want.some((w) => w.種別 === r.種別 && w.キーワード === r.キーワード));
    if (hit.length) throw new Error(`申込者に一致するブラックリストの行がある（${hit.map((h) => `${h.種別}「${h.キーワード}」`).join("、")}）。共有のデータなので消さずに止めた`);
    reportSeedIssue(seed.シードID, "メールアドレスの前半に実行の印を付けた。同じメールアドレスの会員・プレイヤーが0件であることは、印で新しいアドレスになることで代えた（DBで削除しない）。" +
      "ブラックリストは、一致する行が無いことを画面で確かめた（あれば消さずに止める）");
  });
}

// ---- 仮会員設定（共有の設定） ----

/** 共有の設定を書き換えてよいのは、夜に1本だけで流す回（tools/run_shared_solo.sh が E2E_ALLOW_SHARED=1 を付ける）だけ。ほかの共有の環境では止める */
export function 共有の書き換えを許す(対象: string): void {
  if (SHARED_ENV && process.env.E2E_ALLOW_SHARED !== "1") {
    throw new Error(`共有の環境では${対象}（共有の設定）を書き換えない。夜に1本だけで流す回でだけ書き換える`);
  }
}

/** 店舗基本設定の全項目を画面から控え、ケースの終わりに画面で全項目を戻して、同じ値になったことを確かめる登録をする（書き換える前に呼ぶ） */
export async function 基本設定を控えて戻す登録(browser: Browser, 対象: string): Promise<void> {
  const 控え = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const p = new ShopBasicPage(page);
    await p.open();
    return await p.全部読む();
  });
  registerRestore(
    対象,
    控え,
    async () => {
      await withAdminSession(browser, SETUP_ADMIN, async (page) => {
        page.setDefaultTimeout(60_000);
        await new ShopBasicPage(page).控えへ戻して保存する(控え, `${対象}を元の値へ戻す`);
      });
    },
    async () => withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const p = new ShopBasicPage(page);
      await p.open();
      const 今 = await p.全部読む();
      return Object.keys(控え).every((k) => 今[k] === 控え[k]) && Object.keys(今).every((k) => k in 控え);
    }),
  );
}

type 戻し = { 範囲: "ケース" | "実行"; 値: boolean };
const 仮会員設定の戻し: 戻し[] = [];

/**
 * 仮会員設定を前提の値にする。いまの値が同じなら書き換えない。共有の環境では書き換えずに止める。
 * 書き換えたら、範囲（ケースの終わり／実行の最後）で元の値へ戻す（仮会員設定を戻す）。
 */
export async function 仮会員設定を(browser: Browser, 有効: boolean, 範囲: 戻し["範囲"], issue: (m: string) => void): Promise<void> {
  const 名 = (v: boolean) => (v ? "有効" : "無効");
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const now = await readTempMember(page);
    if (now === 有効) { issue(`仮会員設定はすでに${名(有効)}だったので、書き換えずに使った`); return; }
    if (SHARED_ENV) {
      共有の書き換えを許す(`仮会員設定（いまは${名(now)}で、このケースの前提は${名(有効)}）`);
      // 夜の1本流しの回: 店舗基本設定の全項目を控え、ケースの終わりに基盤が画面で全項目を戻す
      await 基本設定を控えて戻す登録(browser, "店舗基本設定（全項目。仮会員設定を書き換える前）");
      await setTempMember(page, 有効);
      if ((await readTempMember(page)) !== 有効) throw new Error(`仮会員設定を${名(有効)}にして保存したが、開き直すと${名(!有効)}のまま`);
      issue(`仮会員設定を${名(有効)}にした（共有の設定。元の値「${名(now)}」を含む店舗基本設定の全項目を控え、ケースの終わりに画面で戻して確かめる）`);
      return;
    }
    await setTempMember(page, 有効);
    if ((await readTempMember(page)) !== 有効) throw new Error(`仮会員設定を${名(有効)}にして保存したが、開き直すと${名(!有効)}のまま`);
    仮会員設定の戻し.push({ 範囲, 値: now });
    issue(`仮会員設定を${名(有効)}にした（${範囲 === "ケース" ? "ケースが終わったら" : "この実行の最後に"}元の値「${名(now)}」へ戻す）`);
  });
}

/** 書き換えた仮会員設定を元の値へ戻す（範囲がケースのものは各ケースの後、実行のものは最後に） */
export async function 仮会員設定を戻す(browser: Browser, 範囲: 戻し["範囲"]): Promise<string[]> {
  const out: string[] = [];
  for (let i = 仮会員設定の戻し.length - 1; i >= 0; i--) {
    const r = 仮会員設定の戻し[i];
    if (r.範囲 !== 範囲) continue;
    await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await setTempMember(page, r.値); });
    仮会員設定の戻し.splice(i, 1);
    out.push(`仮会員設定を元の値「${r.値 ? "有効" : "無効"}」へ戻した`);
  }
  return out;
}

defineSeed("S-F08-05-ACTIVATE-ON", async ({ browser, seed }) => {
  await 仮会員設定を(browser, true, "実行", (m) => reportSeedIssue(seed.シードID, m));
});
defineSeed("S-F08-05-PD-ACTIVATE", async ({ browser, seed }) => {
  await 仮会員設定を(browser, true, "実行", (m) => reportSeedIssue(seed.シードID, m));
});
defineSeed("S-F08-05-ACTIVATE-OFF-080", async ({ browser, seed }) => {
  await 仮会員設定を(browser, false, "ケース", (m) => reportSeedIssue(seed.シードID, m));
});

defineSeed("S-F08-05-GF-ACTIVATE-OFF", async ({ browser, seed }) => {
  await 仮会員設定を(browser, false, "ケース", (m) => reportSeedIssue(seed.シードID, m));
});

// ---- 基本情報（共有の設定。書き換えて、基盤が戻す） ----

export const 基本情報の値 = {
  送信元: "f0805-from@example.test", 店名: "F0805テスト店", 返信先: "f0805-reply@example.test", 送信エラー受付: "f0805-bounce@example.test",
};

defineSeed("S-F08-05-BASIC", async ({ browser, seed }) => {
  共有の書き換えを許す("基本情報");
  await 基本設定を控えて戻す登録(browser, "店舗基本設定（全項目。基本情報を書き換える前）");
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const p = new ShopBasicPage(page);
    await p.入れて保存する("店舗基本設定（基本情報）の書き換え", async () => {
      await p.入れる("送信元メールアドレス", 基本情報の値.送信元);
      await p.入れる("店名", 基本情報の値.店名);
      await p.入れる("返信先メールアドレス", 基本情報の値.返信先);
      await p.入れる("送信エラー通知メールアドレス", 基本情報の値.送信エラー受付);
    });
    await p.open();
    const 今 = [await p.値("送信元メールアドレス"), await p.値("店名"), await p.値("返信先メールアドレス"), await p.値("送信エラー通知メールアドレス")];
    if (今.join("|") !== [基本情報の値.送信元, 基本情報の値.店名, 基本情報の値.返信先, 基本情報の値.送信エラー受付].join("|")) {
      throw new Error(`基本情報を書き換えたが、開き直した画面の値が違う（${今.join(" / ")}）`);
    }
  });
  reportSeedIssue(seed.シードID, "基本情報のメールアドレスは店舗基本設定の「送信元メールアドレス」、店舗名は「店名」として書き換えた（共有の設定。全項目を控え、ケースの終わりに画面で全項目を戻して確かめる）");
});

// ---- メールテンプレート（共有の設定。037・038 は件名を書き換えて、基盤が戻す） ----

/** メールテンプレートの件名を書き換える。書き換える前に編集欄を全部控え、ケースの終わりに画面で全部戻して確かめる登録をする */
async function テンプレートの件名を書き換える(browser: Browser, seedId: string, 名称: string, 件名: string): Promise<void> {
  共有の書き換えを許す(`メールテンプレート「${名称}」`);
  const 読む = () => withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await テンプレートを開く(page, 名称);
    return await テンプレートの欄を読む(page);
  });
  const 控え = await 読む();
  registerRestore(
    `メールテンプレート「${名称}」の編集欄`,
    控え,
    async () => {
      await withAdminSession(browser, SETUP_ADMIN, async (page) => {
        page.setDefaultTimeout(60_000);
        await テンプレートを開く(page, 名称);
        await テンプレートの欄を保存する(page, 控え, `メールテンプレート「${名称}」を元の値へ戻す`);
      });
    },
    async () => {
      const 今 = await 読む();
      return Object.keys(控え).every((k) => 今[k] === 控え[k]) && Object.keys(今).every((k) => k in 控え);
    },
  );
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await テンプレートを開く(page, 名称);
    await テンプレートの欄を保存する(page, { ...控え, "mail[mail_subject]": 件名 }, `メールテンプレート「${名称}」の件名の書き換え`);
  });
  if ((await 読む())["mail[mail_subject]"] !== 件名) throw new Error(`メールテンプレート「${名称}」の件名を書き換えたが、開き直すと違う`);
  reportSeedIssue(seedId, `メールテンプレート「${名称}」の件名を「${件名}」にした（共有の設定。編集欄を全部控え、ケースの終わりに画面で戻して確かめる）`);
}

defineSeed("S-F08-05-TPL-EN", async ({ browser, seed }) => {
  await テンプレートの件名を書き換える(browser, seed.シードID, "【販売/英】仮会員登録", "F0805-EN Confirmation");
});

defineSeed("S-F08-05-TPL-JP", async ({ browser, seed }) => {
  const 名称 = "【販売/日】仮会員登録";
  // 件名を書き換えるのは 037 だけ。044 など、ほかのケースは従来どおり書き換えない
  if (test.info().title.startsWith("IT-F08-05-037 ")) {
    await テンプレートの件名を書き換える(browser, seed.シードID, 名称, "F0805-JP 確認メール");
    return;
  }
  const names = await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); return 自動送信メールのテンプレート名(page); });
  reportSeedIssue(seed.シードID, `メールテンプレート「${名称}」の件名を「F0805-JP 確認メール」に書き換えなかった（共有の設定のため）。` +
    `044 の期待結果は使用したテンプレートの名称で確かめるので、件名に依らない。自動送信メールの設定画面の選択肢に「${名称}」が${names.includes(名称) ? "ある" : "見当たらない（ほかの画面のテンプレートの可能性）"}`);
});

// ---- メールの受け口（開発環境の mailcatcher。E2E_MAIL_URL） ----

defineSeed("S-F08-05-MAILBOX", async ({ seed }) => {
  await mailIds(); // メールの受け口が読めること（読めなければここで止まる）
  reportSeedIssue(seed.シードID, "メールの受け口（開発環境の mailcatcher）が読めることを確かめた。受信メールを消さず（共有の受け口）、ケースの操作の前に控えたメールの番号より後に、そのケースの宛先（実行の印つきの申込者のメールアドレス）に届いたメールだけを数えて「受信履歴0件」に代えた");
});

// ---- 管理者 ----

defineSeed("S-F08-05-PD-ADM", { needs: ["S-F08-05-PD-STORE-074"] }, async ({ browser, notes }) => {
  const id = notes.get("〔店舗ID-F0805-003〕");
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
    名前: "F0805 PD確認用管理者", ログインID: F0805_ADMIN.loginId, メールアドレス: "f0805pdadmin@example.test", パスワード: F0805_ADMIN.password,
    権限: "システム管理者", 所属店舗ID: id, デフォルト検索表示店舗ID: "", 編集可能店舗ID: [id], 店舗は付け替える: true,
  }));
});
