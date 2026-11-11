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
 * - 仮会員設定（ACTIVATE-ON・PD-ACTIVATE・ACTIVATE-OFF-080）: 共有の設定なので、共有の環境では書き換えず、いまの値が前提と同じことを
 *   確かめて使う（違えば止める）。手元の環境では前提の値にし、ON は実行の最後、OFF-080 はケースの終わりに元の値へ戻す。
 * - メールテンプレート（TPL-JP）: 件名を書き換えず（共有の設定）、名称の確かめだけにする（044 は使用したテンプレートの名称で確かめる）。
 * - 管理者（PD-ADM）: 権限は正本が定める細かな権限の代わりに、システム管理者にした（074 から）。
 *
 * 作らないシード（ケースを実装しない）: 受信箱（MAILBOX）・基本情報（BASIC）・英語のテンプレート（TPL-EN）・仮会員設定の無効（GF-ACTIVATE-OFF）と、
 * それだけを使う申込者・店舗（029・037〜043・045・083・085）。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN, SHARED_ENV } from "../config/env";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, hideDebugToolbar, withAdminSession } from "../lib/session";
import { blacklistRows, ensureBlacklist, readTempMember, setTempMember } from "../pages/admin/f06_masters";
import { 自動送信メールのテンプレート名 } from "../pages/admin/f08_05_member";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { ensureStore } from "../pages/admin/m04_24_store";
import { customerIdByEmail } from "../pages/admin/m06_04_member";
import { 管理画面で本会員にする } from "../pages/admin/member_activate";
import { EntryPage } from "../pages/front/f06_01_entry";
import { 申込入力, 申込者 } from "../pages/front/f08_05_confirm";
import { registerFrontMember } from "../pages/front/member_entry";
import { storeInput } from "./m06-common";

export const F0805_ADMIN: Account = { loginId: "f0805pdadmin", password: "Passw0rd-PD0805" };
export const PD_STORE = storeInput("店頭買取PD0805-003", "テントウカイトリピーディー", "Otc Buy PD Store", "itf0805pd003", "F5P");
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
  "S-F08-05-GF-INPUT-US-ZIP", "S-F08-05-PD-INPUT", "S-F08-05-DP-INPUT-081", "S-F08-05-CBAPPLICANT-086", "S-F08-05-CBAPPLICANT-088",
];
/** 申込者の入力値だけのシード（APPLICANT-NNN。メールアドレスを持つものは、印で新しいアドレスになる） */
const 申込者の番号 = [
  "001", "002", "003", "005", "006", "007", "009", "013", "014", "015", "016", "017", "018", "019", "020", "021", "022", "024", "025", "026", "027",
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
  `店舗「${店舗}」を新しく作らず、F08-05 で共通の試験店舗「${PD_STORE.店名}」（支店URL ${PD_STORE.支店URL}。無ければ登録）に読み替えた。` +
  "手順の店舗識別名もこの店舗の支店URLとして読む。査定申込み0件の前提（再実行時はDBで削除）は、申込者の姓に実行の印を付けてこの実行の申込みだけを数えることで代えた";

async function 共通の店舗(browser: Browser, seedId: string): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    return ensureStore(page, PD_STORE, (m) => reportSeedIssue(seedId, m));
  });
}

const 店舗の番号 = [
  "001", "002", "003", "005", "006", "007", "008", "009", "013", "014", "015", "016", "017", "018", "019", "020", "021", "022", "024", "025", "026",
  "027", "028", "031", "032", "035", "036", "044", "046", "047", "048", "049", "050", "051", "052", "053", "054", "055", "057", "058", "060", "061",
  "062", "063", "064", "065", "066", "067", "068", "069", "070", "071", "076", "077", "078", "079", "080", "081", "082",
];
for (const n of 店舗の番号) {
  defineSeed(`S-F08-05-STORE-${n}`, async ({ browser, notes, seed }) => {
    notes.set(`〔店舗ID-F0805-${n}〕`, await 共通の店舗(browser, seed.シードID));
    reportSeedIssue(seed.シードID, 店舗の注記(`店頭買取F0805-${n}`));
  });
}
for (const n of ["086", "088"]) {
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
    });
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

for (const n of ["013", "028", "031"]) {
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
    if (SHARED_ENV) throw new Error(`共有の環境では仮会員設定（共有の設定）を書き換えない。いまは${名(now)}で、このケースの前提（${名(有効)}）と違う`);
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

// ---- メールテンプレート（共有の設定。書き換えない） ----

defineSeed("S-F08-05-TPL-JP", async ({ browser, seed }) => {
  const 名称 = "【販売/日】仮会員登録";
  const names = await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); return 自動送信メールのテンプレート名(page); });
  reportSeedIssue(seed.シードID, `メールテンプレート「${名称}」の件名を「F0805-JP 確認メール」に書き換えなかった（共有の設定のため）。` +
    `044 の期待結果は使用したテンプレートの名称で確かめるので、件名に依らない。自動送信メールの設定画面の選択肢に「${名称}」が${names.includes(名称) ? "ある" : "見当たらない（ほかの画面のテンプレートの可能性）"}`);
});

// ---- 管理者 ----

defineSeed("S-F08-05-PD-ADM", { needs: ["S-F08-05-PD-STORE-074"] }, async ({ browser, notes }) => {
  const id = notes.get("〔店舗ID-F0805-003〕");
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
    名前: "F0805 PD確認用管理者", ログインID: F0805_ADMIN.loginId, メールアドレス: "f0805pdadmin@example.test", パスワード: F0805_ADMIN.password,
    権限: "システム管理者", 所属店舗ID: id, デフォルト検索表示店舗ID: "", 編集可能店舗ID: [id],
  }));
});
