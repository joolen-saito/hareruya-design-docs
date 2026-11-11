/**
 * M13-07 イベント申込一括編集のシード（画面操作）。正本: cases/M13-07_seed_data.tsv
 *
 * - 店舗A・店舗B（全ケース共通の参照用店舗）: M13-02・M13-11・M13-12 と同じ店名の店舗。あれば使い、無ければ店舗登録画面で登録する。
 * - 試験管理者 m1307_admin（S-M13-07-ADM）: 店舗Aだけに編集権限。権限は「モールオペレーター」で代える
 *   （「店舗オーナー」「店舗オペレーター」は所属店舗の店舗しか見えない。M13-11 の記録 2026-11-09）。
 * - 店舗Bのイベント（S-M13-07-NOAUTH-002）は、シード表の「店舗Bの編集権限を持つ管理者」で登録する。シード表に行が無いので、
 *   要るときに画面から作る（m1307_admin_b、店舗オーナー・所属店舗B・編集可能店舗B）。
 * - 開催日時: 開始時間を試験実行日の13:00で登録する。終了時刻14:00は画面に項目が無く（シード表も DB で設定するとする）、設定しない。
 *   日程はオンライン受付あり（試験実行日の00:00〜12:00）、受付なし・デッキ登録なし、定員・参加費・公開状態は初期表示（イベントと同じ値）。
 *   イベントはフォーマット「スタンダード」、ルール適用度「初心者歓迎」、公開状態「公開」、定員16、参加費0。
 * - 申込のプレイヤー（シード表の会員「晴屋申込 一郎」〜「三郎」）は、ほかの M13 と同じ会員登録済みの会員で代える
 *   （E2E_MEMBER_NAMES で与えた既存の会員の名前。与えなければ試験用の会員。seeds/members.ts）。ケースはプレイヤーの名前を確かめない。
 *   試験用の会員は2人までしか定めていないので、3人要るシード（001・003・006）は、E2E_MEMBER_NAMES が無いときだけ、
 *   3人目の試験用の会員をこのファイルで用意する（会員一覧で探し、いなければフロントの新規会員登録。local だけ）。
 * - DB での準備（PM 方針で画面で代え、条件付きとする）:
 *   ・申込状況「決済中」「入金待ち」「キャンセル済み」は、登録した申込のイベント申込詳細・編集画面で申込状況を選んで登録する
 *     （M13-06 の部品）。画面で変えると申込履歴が1件増えるので、申込履歴はシード表の「1件」でなく2件になる。
 *     申込履歴の件数を見るケースは、ケースの始めの件数からの増減で確かめる（spec の注記）。
 *   ・「イベント名に『M13-07権限店舗イベント』を含む他のイベントを DB で削除する」は行わない。共有の環境でほかの人のデータを消さないため、
 *     イベント名に実行ごとの印を付け（rc）、ケースはこのケースのイベント名（印つき）で検索して、検索に当たるイベントをこの1件にする。
 *   ・「作成済みのものを使い回すとき DB で戻す」は行わない（ケース専用なので毎回作る）。
 * - S-M13-02-QK-ADM・QK-MASTERS は seeds/m13-02-qk.ts（既存のものをそのまま使う。管理者のパスワードは12文字以上に代えた値）。
 * - S-M13-07-QK-ENTRY-014: 会員はフロントの会員登録で作る（本登録のメールを読むので local だけ）。会員のメールアドレス・お名前（名）・
 *   イベント名(日)には実行の印を付ける（前の実行の残りで「この会員だけの名前」「この1件だけ」が崩れないため）。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, MEMBER_NAMES, SETUP_ADMIN } from "../config/env";
import { RUN_MARK, rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed, reportCurrentSeedIssue } from "./current_seed";
import { 管理画面で本会員にした注記, 管理画面で本会員にする, 本登録のメールを読める } from "../pages/admin/member_activate";
import { Account, hideDebugToolbar, withAdminSession } from "../lib/session";
import { customerStateByEmail } from "../pages/admin/customer";
import { registerEntries } from "../pages/admin/entry";
import { EventInput, registerEvent } from "../pages/admin/event";
import { 申込状況を変える } from "../pages/admin/m13_06_entry_list";
import { ensureMember } from "../pages/admin/member";
import { registerSchedule, ScheduleInput } from "../pages/admin/schedule";
import { ensureTenant } from "../pages/admin/tenant";
import { FrontMember, registerFrontMember } from "../pages/front/member_entry";
import { QK1302_ADMIN, QK連携店舗 } from "./m13-02-qk";
import { entryMemberNames } from "./members";

export const M1307_ADMIN: Account = { loginId: "m1307_admin", password: "Passw0rd!M1307" };
/** 店舗Bに編集権限を持つ別の管理者（シード表の投入方法が「店舗Bの編集権限を持つ管理者」と定める。行は無い） */
const M1307_ADMIN_B: Account = { loginId: "m1307_admin_b", password: "Passw0rd!M1307B" };

const 店 = (n: string, kana: string, eng: string, url: string, ryaku: string) => ({ 店名: `店舗${n}`, 店名カナ: kana, 店名英語: eng, 支店URL: url, 店名略称3文字: ryaku, ショップ名略称: `店舗${n}` });

defineSeed("S-M13-07-ADM", async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    await ensureTenant(page, 店("A", "テンポエー", "Shop A", "m1302a", "テA"), issue);
    await ensureTenant(page, 店("B", "テンポビー", "Shop B", "m1302b", "テB"), issue);
    await ensureMember(page, {
      名前: "M13-07試験管理者", 所属店舗: "店舗A", ログインID: M1307_ADMIN.loginId, メールアドレス: "m1307_admin@example.test",
      パスワード: M1307_ADMIN.password, 権限: "モールオペレーター", デフォルト検索表示店舗: "店舗A", 編集可能店舗: ["店舗A"],
    });
  });
});

async function 店舗Bの管理者を用意する(browser: Browser): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await ensureMember(page, {
      名前: "M13-07店舗B管理者", 所属店舗: "店舗B", ログインID: M1307_ADMIN_B.loginId, メールアドレス: "m1307_admin_b@example.test",
      パスワード: M1307_ADMIN_B.password, 権限: "店舗オーナー", デフォルト検索表示店舗: "店舗B", 編集可能店舗: ["店舗B"],
    });
  });
}

// ---- 申込のプレイヤーにする会員 ----

/** 3人目の試験用の会員（E2E_MEMBER_NAMES が無いときだけ使う） */
const 三人目: FrontMember = { 姓: "試験会員", 名: "申込三", セイ: "シケンカイイン", メイ: "モウシコミサン", メール: "e2e-m1307-entry-3@example.test", パスワード: "Passw0rd!E2EEntry3" };

/** 申込に使う会員の名前を n 人ぶん返す（seeds/members.ts。3人目は上の会員を用意する） */
async function 申込の会員(browser: Browser, n: number): Promise<string[]> {
  if (MEMBER_NAMES.length || n <= 2) return entryMemberNames(browser, n);
  if (n > 3) throw new Error(`申込を登録するのに会員が ${n} 人要る（このファイルで用意するのは3人まで）`);
  const names = await entryMemberNames(browser, 2);
  const state = await withAdminSession(browser, SETUP_ADMIN, (page) => customerStateByEmail(page, 三人目.メール));
  if (state === "仮会員") {
    if (本登録のメールを読める()) throw new Error(`試験用の会員 ${三人目.メール} が仮会員のまま。本登録のメールのURLを開いて本会員にしてから流す`);
    // 本登録のメールを読めない環境。管理画面で本会員にする
    await 管理画面で本会員にする(browser, 三人目.メール);
    reportCurrentSeedIssue(`${管理画面で本会員にした注記}。会員 ${三人目.メール}（仮会員のまま残っていた）`);
  }
  if (state === null) {
    // 本登録のメールを読めない環境では、registerFrontMember が仮会員を管理画面で本会員にする（シードの注記に残る）
    await フロントで会員を登録する(browser, 三人目);
    const after = await withAdminSession(browser, SETUP_ADMIN, (page) => customerStateByEmail(page, 三人目.メール));
    if (after !== "本会員") throw new Error(`試験用の会員 ${三人目.メール} を登録したが、会員一覧で本会員にならない（${after ?? "見つからない"}）`);
  }
  return [...names, `${三人目.姓} ${三人目.名}`];
}

async function フロントで会員を登録する(browser: Browser, m: FrontMember): Promise<void> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await registerFrontMember(page, m);
  } finally {
    await context.close();
  }
}

// ---- 権限店舗・権限外店舗のイベントと申込（AUTH・NOAUTH） ----

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
/** 試験実行日（シードを作った日）の時刻 */
const 実行日の = (hhmm: string) => `${ymd(new Date())} ${hhmm}`;

/** 店舗Aのケースのイベント名(日)（印つき）。ケースはこの名前で検索する。n は "001"・"002"・… */
export const 権限店舗のイベント名 = (n: string) => rc(`M13-07権限店舗イベント-${n}`);
const 権限外店舗のイベント名 = (n: string) => rc(`M13-07権限外店舗イベント-${n}`);

type 申込状況 = "決済中" | "入金待ち" | "キャンセル済み";

const 代えの注記 = (状況: 申込状況[]) =>
  `申込状況「${[...new Set(状況)].join("」「")}」は DB へ直接設定せず、登録した申込のイベント申込詳細・編集画面で申込状況を選んで登録した` +
  "（このとき申込履歴が1件増えるので、申込履歴はシード表の「1件」でなく2件になる）。開催日時の終了時刻14:00は画面に項目が無く、設定していない。" +
  "同じ語を含むほかのイベントの DB での削除は行わず、イベント名(日)に実行ごとの印を付けて、検索に当たるイベントをこの1件にした（条件付き）";

/**
 * イベントと日程（試験実行日の13:00開始、オンライン受付あり）を登録し、会員を人数ぶん申込として登録して、
 * イベント申込詳細・編集画面で申込状況を変える。イベントID・日程ID・申込IDを控える。
 * 呼び名は〔イベントID-M1307-<id>〕〔日程ID-M1307-<id>〕〔申込ID-M1307-<id><申込の末尾>〕。
 */
function defineEventSeed(seedId: string, v: { id: string; 名日: string; 名英: string; 店舗: "店舗A" | "店舗B"; 申込: [string, 申込状況][] }): void {
  defineSeed(seedId, { needs: ["S-M13-07-ADM"] }, async ({ browser, notes, seed }) => {
    const 会員 = await 申込の会員(browser, v.申込.length);
    if (v.店舗 === "店舗B") await 店舗Bの管理者を用意する(browser);
    await withAdminSession(browser, v.店舗 === "店舗B" ? M1307_ADMIN_B : M1307_ADMIN, async (page) => {
      const イベント: EventInput = {
        イベント名日: v.名日, イベント名英: v.名英, 店舗: v.店舗, フォーマット: ["スタンダード"], ルール適用度: "初心者歓迎", 公開状態: "公開", 定員: "16", 参加費: "0",
      };
      const id = await registerEvent(page, イベント);
      notes.set(`〔イベントID-M1307-${v.id}〕`, id);
      const 日程: ScheduleInput = { 開始時間: 実行日の("13:00"), 受付あり: false, デッキ登録あり: false, オンライン受付: { 開始: 実行日の("00:00"), 終了: 実行日の("12:00") } };
      const d = await registerSchedule(page, id, 日程);
      notes.set(`〔日程ID-M1307-${v.id}〕`, d);
      const ids = await registerEntries(page, v.名日, d, 日程.開始時間, 会員);
      for (const [i, [末尾, 状況]] of v.申込.entries()) {
        notes.set(`〔申込ID-M1307-${v.id}${末尾}〕`, ids[i]);
        await 申込状況を変える(page, ids[i], 状況);
      }
    });
    reportSeedIssue(seed.シードID, 代えの注記(v.申込.map(([, s]) => s)));
  });
}

/** 名英には、ほかのシードの検索語（イベント名(日)の語）を含めない */
const 名英 = (n: string) => `Seed M1307 ${n} ${RUN_MARK}`;
function defineAuthSeed(seedId: string, n: string, 申込: [string, 申込状況][]): void {
  defineEventSeed(seedId, { id: n, 名日: 権限店舗のイベント名(n), 名英: 名英(n), 店舗: "店舗A", 申込 });
}

const 三件 = (): [string, 申込状況][] => [["A", "決済中"], ["B", "入金待ち"], ["C", "キャンセル済み"]];
const 一件 = (): [string, 申込状況][] => [["", "決済中"]];
defineAuthSeed("S-M13-07-AUTH-001", "001", 三件());
defineEventSeed("S-M13-07-AUTH-002", { id: "002A", 名日: 権限店舗のイベント名("002"), 名英: 名英("002A"), 店舗: "店舗A", 申込: 一件() });
defineEventSeed("S-M13-07-NOAUTH-002", { id: "002B", 名日: 権限外店舗のイベント名("002"), 名英: 名英("002B"), 店舗: "店舗B", 申込: 一件() });
defineAuthSeed("S-M13-07-AUTH-003", "003", 三件());
defineAuthSeed("S-M13-07-AUTH-004", "004", 一件());
defineAuthSeed("S-M13-07-AUTH-005", "005", 一件());
defineAuthSeed("S-M13-07-AUTH-006", "006", 三件());
defineAuthSeed("S-M13-07-AUTH-007", "007", 一件());
defineAuthSeed("S-M13-07-AUTH-008", "008", 一件());
defineAuthSeed("S-M13-07-AUTH-009", "009", 一件());
defineAuthSeed("S-M13-07-AUTH-010", "010", 一件());
defineAuthSeed("S-M13-07-AUTH-015", "015", 一件());

// ---- 014（QK連携: マイイベント・デッキ登録の前後） ----

export const QK会員 = () => ({ 姓: "試験", 名: rc("QK1307-001"), メール: `${rc("qk1307-001")}@example.test`.toLowerCase(), パスワード: "QkPw1307001!" });
export const QKイベント名 = () => rc("QK一括編集大会-1307-001");

defineSeed("S-M13-07-QK-ENTRY-014", { needs: ["S-M13-02-QK-ADM"] }, async ({ browser, notes }) => {
  const m = QK会員();
  await フロントで会員を登録する(browser, { 姓: m.姓, 名: m.名, セイ: "シケン", メイ: "キューケー", メール: m.メール, パスワード: m.パスワード });
  await withAdminSession(browser, QK1302_ADMIN, async (page) => {
    const id = await registerEvent(page, {
      イベント名日: QKイベント名(), イベント名英: "QK Bulk 1307-001", 店舗: QK連携店舗, フォーマット: ["スタンダード"], ルール適用度: "初心者歓迎",
      公開状態: "公開", 定員: "16", 参加費: "500",
    });
    notes.set("〔イベントID-M1307-QK001〕", id);
    // 受付あり・デッキ登録ありは外し、オンライン受付ありはチェックを入れない。定員・参加費・公開状態は初期表示のまま
    const 開始 = "2030-10-23 10:00";
    const d = await registerSchedule(page, id, { 開始時間: 開始, 受付あり: false, デッキ登録あり: false });
    // 申込状況は初期値のまま登録する
    const [e] = await registerEntries(page, QKイベント名(), d, 開始, [`${m.姓} ${m.名}`]);
    notes.set("〔申込ID-M1307-QK001〕", e);
  });
});
