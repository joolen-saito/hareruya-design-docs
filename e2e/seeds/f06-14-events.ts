/**
 * F06-14 マイイベント・デッキ登録の、イベント一覧のケース用のシード（画面操作）。正本: cases/F06-14_seed_data.tsv
 * 依頼者方針 2026-11-10: シード表が「DBで登録」でも、まず画面で作る。画面で作れない部分は、実行の印つきのデータに限り DB へ書く（db/f06_14.ts）。
 *
 * 読み替え・解釈:
 * - 開催店舗「本店」は、F07-03 の参照マスタ（S-F07-03-REF）と同じ、店舗ID 1 の店舗「トーナメントセンター東京」で代える。イベントは、その店舗を編集できる
 *   F07-03 の試験管理者（f0703admin）で登録する。フォーマットは「スタンダード」（複数フォーマットの020は「スタンダード」と「モダン」）、ルール適用度は初心者歓迎。
 *   参照データ（申込状態・表示件数・フォーマットの略称）は共有のマスタをそのまま使い、書き換えない。申込状態「申込完了」はこの環境の「申込済み」、
 *   「キャンセル」は「キャンセル済み」（番号6）、決済中は番号1。フォーマットの略称（STD・MOD）を持つ欄はこの環境のフォーマットには無い。
 * - 会員は、フロントの新規会員登録で作る。メールアドレスの前半に実行の印を付ける。お名前は「試験 F0614-…」に実行の印を付けた値（プレイヤー検索で取り違えない）。
 *   会員IDは管理画面の会員一覧から、プレイヤーIDはDBの参照（読むだけ）で控える（F06-14・F06-16 と同じ）。デッキIDは、デッキ登録完了画面のアドレスから控える。
 * - イベント名（日・英）にも実行の印を付ける。ケースの手順・期待結果の同じ名前は、印つきの名前として読む。
 * - 開催日時は、シード表が日を決めるもの（2027年）はその日、「試験開始日の翌日」などは実行日から。デッキ登録締切は、指定が無ければ開催日の23:59（秒は画面で指定できないので :00）。
 *   「デッキ登録あり」は、指定が無い大会ではチェックを入れ、締切を開催日の23:59にした。オンライン受付は使わない（申込は管理画面で登録する）。
 * - 前日の開催日・締切・「デッキ登録を終了する」は、いったん翌日で登録してから日程編集画面で直す（シード表の手順どおり）。画面が受け付けない日時のときは、
 *   DBで日程の日時を直す。支払い会員は画面で指定できない（参加者の会員になる）ので、001 は DBで申込の支払い会員を設定する。
 *
 * 作らないシード（ケースを実装しない）: S-F06-14-PAGING-018（イベント130件を残す。大量データ）、S-F06-14-ENGLISH-027（申込状況のマスタに試験の行を足す。共有のマスタ）。
 */
import { Browser, Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { 申込の支払い会員を設定する, 申込状況を設定する, 日程の日時をずらす } from "../db/f06_14_k";
import { プレイヤーID } from "../db/f03_07";
import { 大会デッキ一覧 } from "../db/f06_16_k";
import { available } from "../lib/db";
import { Notes } from "../lib/notes";
import { rc, RUN_MARK } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { 申込を登録する, 申込状況を画面で直す, 日程を画面で直す, 大会と日程を登録する } from "../pages/admin/f06_14_setup";
import { 実行日から } from "../pages/admin/f07_01_setup";
import { F0703_ADMIN, 開催フォーマット } from "../pages/admin/f07_03_setup";
import { 会員IDをメールから, 会員を作る as 試験会員を作る } from "../pages/admin/f07_04_setup";
import { DeckEntryEditPage } from "../pages/front/f06_16_deck_entry_k";
import "./f07-03";

const REF = "S-F06-14-REF";

export type 作った試験会員 = { メール: string; パスワード: string; 氏名: string; 会員ID: string; 選手ID: string };
export type 作った試験大会 = { 名: string; 英名: string; イベントID: string; 日程ID: string };
/** この実行で作った会員（キーは呼び名の末尾。例: 001A・004）と大会 */
export const 試験会員一覧 = new Map<string, 作った試験会員>();
export const 試験大会一覧 = new Map<string, 作った試験大会>();
export function 試験会員(key: string): 作った試験会員 {
  const m = 試験会員一覧.get(key);
  if (!m) throw new Error(`${key} の会員を、この実行のシードが作っていない`);
  return m;
}
export function 試験大会(key: string): 作った試験大会 {
  const e = 試験大会一覧.get(key);
  if (!e) throw new Error(`${key} の大会を、この実行のシードが作っていない`);
  return e;
}

type 会員指定 = { 符号: string; ベース: string; パスワード: string; 名: string };
type 大会指定 = {
  符号: string; 名: string; 英: string;
  /** 日程登録画面の開始時間 */
  開始: string;
  /** 省略＝開催日の23:59。null＝「デッキ登録あり」なし */
  締切?: string | null;
  形式?: string[];
};
type 申込指定 = { 大会: string; 会員: string; 状況?: "決済中" | "キャンセル済み"; 支払い会員?: string };
type 日程直し = {
  大会: string;
  画面: { 開始?: string; 締切?: string; 登録を終了する?: boolean };
  /** 画面が受け付けないときに DB で書く代わり（書かなければ、受け付けないときは止める） */
  DB?: { 開始を日の始まりにする?: boolean; 開始を日ずらす?: number; 締切を日ずらす?: number };
  文: string;
};
type プラン = { 会員: 会員指定[]; 大会: 大会指定[]; 申込: 申込指定[]; デッキ: { 大会: string; 会員: string }[]; 日程直し?: 日程直し[] };

const 管理 = <T>(browser: Browser, fn: (page: Page) => Promise<T>, account = F0703_ADMIN) =>
  withAdminSession(browser, account, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });

/** 会員でログインし、大会デッキ登録編集画面でメインボードを入れて提出して、デッキIDを返す */
async function 大会デッキを提出する(browser: Browser, seedId: string, m: 作った試験会員, 日程ID: string, メイン: string): Promise<string> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    const d = new DeckEntryEditPage(page);
    await d.ログインする(m.メール, m.パスワード);
    const status = await d.開く(日程ID);
    if (status !== 200 || !(await d.編集画面である())) throw new Error(`${seedId}: 大会デッキ登録編集画面を開けない（応答 ${status}・${d.path}）`);
    if (await d.フォーマット選択エリア.isVisible()) await d.フォーマットを選ぶ(開催フォーマット);
    await d.メインボード.fill(メイン);
    const r = await d.提出する();
    const id = d.完了画面のデッキID();
    if (!r.sent || !id) throw new Error(`${seedId}: デッキを提出してもデッキ登録完了画面へ移らない（${d.path}・${(await d.入力形式の誤りの表示()).join(" / ")}）`);
    return id;
  } finally { await context.close(); }
}

async function 作る(ctx: { browser: Browser; notes: Notes; seed: { シードID: string } }, p: プラン): Promise<void> {
  const { browser, notes } = ctx;
  const seedId = ctx.seed.シードID;
  // 会員（フロントの新規会員登録）
  for (const m of p.会員) {
    const a = await 試験会員を作る(browser, m.ベース, "", { 姓: "試験", 名: rc(m.名) }, m.パスワード);
    試験会員一覧.set(m.符号, { メール: a.メール, パスワード: a.パスワード, 氏名: a.氏名, 会員ID: "", 選手ID: "" });
  }
  // 会員ID（管理画面の会員一覧）と選手ID（DBの参照）
  if (!available) throw new Error(`${seedId}: プレイヤーIDはDBの参照で読む。この環境はDBの参照ができない`);
  await 管理(browser, async (page) => {
    for (const m of p.会員) {
      const x = 試験会員(m.符号);
      x.会員ID = await 会員IDをメールから(page, x.メール);
      const pid = プレイヤーID(x.会員ID);
      if (!pid) throw new Error(`${seedId}: 会員 ${x.メール}（会員ID ${x.会員ID}）にプレイヤーが無い`);
      x.選手ID = pid;
      notes.set(`〔会員ID-F0614-${m.符号}〕`, x.会員ID);
      notes.set(`〔プレイヤーID-F0614-${m.符号}〕`, x.選手ID);
    }
  }, SETUP_ADMIN);
  // 大会と日程（開催店舗を編集できる試験管理者）
  await 管理(browser, async (page) => {
    for (const e of p.大会) {
      const 名 = rc(e.名), 英名 = rc(e.英);
      const 日付 = e.開始.slice(0, 10);
      const r = await 大会と日程を登録する(page, {
        名日: 名, 名英: 英名, フォーマット: e.形式 ?? [開催フォーマット],
        日程: { 開始: e.開始, デッキ登録: e.締切 === null ? null : { 締切: e.締切 ?? `${日付} 23:59` } },
      });
      試験大会一覧.set(e.符号, { 名, 英名, イベントID: r.イベントID, 日程ID: r.日程ID });
      notes.set(`〔イベントID-F0614-${e.符号}〕`, r.イベントID);
    }
  });
  // 申込（管理画面のイベント申込登録。参加者を選んで登録すると、支払い会員は参加者の会員になる）
  const 申込ID = new Map<string, string>();
  await 管理(browser, async (page) => {
    for (const a of p.申込) {
      const 大 = 試験大会(a.大会), 参加者 = 試験会員(a.会員);
      const id = await 申込を登録する(page, 大.日程ID, 参加者.氏名, 参加者.選手ID, `申込（${大.名}・${参加者.氏名}）の登録`);
      申込ID.set(a.大会, id);
      notes.set(`〔申込ID-F0614-${a.大会}〕`, id);
    }
  });
  // デッキ（会員でログインして提出する）
  for (const d of p.デッキ) {
    const 大 = 試験大会(d.大会), m = 試験会員(d.会員);
    const id = await 大会デッキを提出する(browser, seedId, m, 大.日程ID, `4 F0614-${d.大会}-Card`);
    const 控え = 大会デッキ一覧(大.日程ID, m.選手ID).map((x) => x.デッキID);
    if (!控え.includes(id)) throw new Error(`${seedId}: 提出したデッキ ${id} が、日程 ${大.日程ID}・選手 ${m.選手ID} のデッキに無い（${控え.join("、")}）`);
    notes.set(`〔デッキID-F0614-${d.大会}〕`, id);
  }
  // 日程の直し（開催日を前日へ・締切を過去へ・登録を終了する）。まず画面。画面が受け付けないときだけ DB
  for (const j of p.日程直し ?? []) {
    const 大 = 試験大会(j.大会);
    const err = await 管理(browser, (page) => 日程を画面で直す(page, 大.イベントID, 大.日程ID, j.画面));
    if (err === null) { reportSeedIssue(seedId, `${j.文}（日程編集画面で直した）`); continue; }
    if (!j.DB) throw new Error(`${seedId}: ${j.文}を日程編集画面で保存できない（${err}）`);
    日程の日時をずらす(大.日程ID, RUN_MARK, j.DB);
    reportSeedIssue(seedId, `${j.文}。日程編集画面が受け付けなかった（${err}）ので、DBで日程 ${大.日程ID} の日時を直した`);
  }
  // 申込状況（決済中・キャンセル済み）は申込詳細・編集画面で。選択肢に無いときだけ DB
  for (const a of p.申込) {
    if (!a.状況) continue;
    const id = 申込ID.get(a.大会)!;
    const 状況 = a.状況;
    if (await 管理(browser, (page) => 申込状況を画面で直す(page, id, 状況))) continue;
    申込状況を設定する(id, 状況, RUN_MARK);
    reportSeedIssue(seedId, `申込 ${id} の申込状況の選択肢に「${状況}」が無かったので、DBで申込状況を「${状況}」に設定した`);
  }
  // 支払い会員（画面で指定できない）
  for (const a of p.申込) {
    if (!a.支払い会員) continue;
    const 会員ID = 試験会員(a.支払い会員).会員ID;
    申込の支払い会員を設定する(申込ID.get(a.大会)!, 会員ID, RUN_MARK);
    reportSeedIssue(seedId, `支払い会員は画面で指定できないので、DBで申込 ${申込ID.get(a.大会)} の支払い会員を会員 ${会員ID} に設定した`);
  }
}

const 明日 = (時刻 = "10:00") => 実行日から(1, 時刻);
const 前日 = () => 実行日から(-1, "10:00");
/** 呼び名の符号 n の会員（ログインID・パスワードはケースの値。お名前は「試験 F0614-n」） */
const 会員f = (n: string): 会員指定 => ({ 符号: n, ベース: `f0614_member-${n}`, パスワード: `F0614Pw${n}!`, 名: `F0614-${n}` });
const 会員dp = (n: string): 会員指定 => ({ 符号: n, ベース: `dpf0614-${n}`, パスワード: `Passw0rd-F0614${n}`, 名: `F0614-${n}` });
const 会員cb = (n: string): 会員指定 => ({ 符号: n, ベース: `cbf0614-${n}`, パスワード: `Passw0rd-CBF0614${n}`, 名: `F0614-CB${n}` });
const defineCaseSeed = (seedId: string, plan: () => プラン): void => {
  defineSeed(seedId, { needs: [REF] }, (ctx) => 作る(ctx, plan()));
};
const 前日にする = (大会: string): 日程直し => ({
  大会, 画面: { 開始: 前日() }, DB: { 開始を日ずらす: -2 }, 文: "開催日時を試験開始日の前日10:00に直した",
});

defineCaseSeed("S-F06-14-FILTER-001", () => ({
  会員: [会員f("001A"), { 符号: "001B", ベース: "f0614_other-001", パスワード: "F0614Pw001B!", 名: "F0614-001B" }],
  大会: [
    { 符号: "001A", 名: "本人申込大会-001", 英: "Own Apply Event 001", 開始: 明日("10:00") },
    { 符号: "001B", 名: "他会員申込大会-001", 英: "Other Apply Event 001", 開始: 明日("11:00") },
    { 符号: "001C", 名: "キャンセル大会-001", 英: "Cancel Event 001", 開始: 明日("12:00") },
  ],
  申込: [
    { 大会: "001A", 会員: "001B", 支払い会員: "001A" },
    { 大会: "001B", 会員: "001A", 支払い会員: "001B" },
    { 大会: "001C", 会員: "001A", 状況: "キャンセル済み" },
  ],
  デッキ: [],
}));
defineCaseSeed("S-F06-14-DECK-ONLY-002", () => ({
  会員: [会員f("002")], 大会: [{ 符号: "002", 名: "デッキのみ大会-002", 英: "Deck Only Event 002", 開始: 明日() }], 申込: [], デッキ: [{ 大会: "002", 会員: "002" }],
}));
defineCaseSeed("S-F06-14-SORT-003", () => ({
  会員: [会員f("003")],
  大会: [
    { 符号: "003A", 名: "開催日10日大会-003", 英: "Day 10 Event 003", 開始: "2027-06-10 10:00" },
    { 符号: "003B", 名: "開催日12日大会-003", 英: "Day 12 Event 003", 開始: "2027-06-12 10:00" },
    { 符号: "003C", 名: "開催日11日大会-003", 英: "Day 11 Event 003", 開始: "2027-06-11 10:00" },
  ],
  申込: [{ 大会: "003A", 会員: "003" }, { 大会: "003B", 会員: "003" }, { 大会: "003C", 会員: "003" }], デッキ: [],
}));
defineCaseSeed("S-F06-14-TODAY-004", () => ({
  会員: [会員f("004")], 大会: [{ 符号: "004", 名: "当日開催大会-004", 英: "Today Event 004", 開始: 明日() }], 申込: [{ 大会: "004", 会員: "004" }], デッキ: [],
  日程直し: [{ 大会: "004", 画面: { 開始: 実行日から(0, "00:00") }, DB: { 開始を日の始まりにする: true, 開始を日ずらす: -1 }, 文: "開催日時を試験開始日の00:00に直した" }],
}));
defineCaseSeed("S-F06-14-PAST-PAYING-005", () => ({
    会員: [会員f("005")], 大会: [{ 符号: "005", 名: "前日決済中大会-005", 英: "Past Paying Event 005", 開始: 明日() }], 申込: [{ 大会: "005", 会員: "005", 状況: "決済中" }], デッキ: [{ 大会: "005", 会員: "005" }],
    日程直し: [前日にする("005")],
  }));
defineCaseSeed("S-F06-14-PAST-PAYING-014", () => ({
    会員: [会員f("014")], 大会: [{ 符号: "014", 名: "前日決済中大会-014", 英: "Past Paying Event 014", 開始: 明日() }], 申込: [{ 大会: "014", 会員: "014", 状況: "決済中" }], デッキ: [{ 大会: "014", 会員: "014" }],
    日程直し: [前日にする("014")],
  }));
defineCaseSeed("S-F06-14-FUTURE-PAYING-006", () => ({ 会員: [会員f("006")], 大会: [{ 符号: "006", 名: "翌日決済中大会-006", 英: "Future Paying Event 006", 開始: 明日() }], 申込: [{ 大会: "006", 会員: "006", 状況: "決済中" }], デッキ: [] }));
defineCaseSeed("S-F06-14-FUTURE-PAYING-007", () => ({ 会員: [会員f("007")], 大会: [{ 符号: "007", 名: "翌日決済中大会-007", 英: "Future Paying Event 007", 開始: 明日() }], 申込: [{ 大会: "007", 会員: "007", 状況: "決済中" }], デッキ: [] }));
defineCaseSeed("S-F06-14-FUTURE-NODECK-008", () => ({ 会員: [会員f("008")], 大会: [{ 符号: "008", 名: "翌日申込完了大会-008", 英: "Future Applied Event 008", 開始: 明日() }], 申込: [{ 大会: "008", 会員: "008" }], デッキ: [] }));
defineCaseSeed("S-F06-14-FUTURE-NODECK-013", () => ({ 会員: [会員f("013")], 大会: [{ 符号: "013", 名: "翌日申込完了大会-013", 英: "Future Applied Event 013", 開始: 明日() }], 申込: [{ 大会: "013", 会員: "013" }], デッキ: [] }));
defineCaseSeed("S-F06-14-DECK-ONLY-009", () => ({ 会員: [会員f("009")], 大会: [{ 符号: "009", 名: "デッキのみ大会-009", 英: "Deck Only Event 009", 開始: 明日() }], 申込: [], デッキ: [{ 大会: "009", 会員: "009" }] }));
defineCaseSeed("S-F06-14-DECK-ONLY-010", () => ({ 会員: [会員f("010")], 大会: [{ 符号: "010", 名: "デッキのみ大会-010", 英: "Deck Only Event 010", 開始: 明日() }], 申込: [], デッキ: [{ 大会: "010", 会員: "010" }] }));
defineCaseSeed("S-F06-14-DECK-ONLY-012", () => ({ 会員: [会員f("012")], 大会: [{ 符号: "012", 名: "デッキのみ大会-012", 英: "Deck Only Event 012", 開始: 明日() }], 申込: [], デッキ: [{ 大会: "012", 会員: "012" }] }));
defineCaseSeed("S-F06-14-DECK-ONLY-023", () => ({ 会員: [会員f("023")], 大会: [{ 符号: "023", 名: "デッキのみ大会-023", 英: "Deck Only Event 023", 開始: 明日() }], 申込: [], デッキ: [{ 大会: "023", 会員: "023" }] }));
defineCaseSeed("S-F06-14-DEADLINE-015", () => ({
  会員: [会員f("015")], 大会: [{ 符号: "015", 名: "締切超過大会-015", 英: "Past Deadline Event 015", 開始: 明日() }], 申込: [{ 大会: "015", 会員: "015" }], デッキ: [{ 大会: "015", 会員: "015" }],
  日程直し: [{ 大会: "015", 画面: { 締切: 実行日から(-1, "23:59") }, DB: { 締切を日ずらす: -2 }, 文: "デッキ登録締切を試験開始日の前日23:59に直した" }],
}));
defineCaseSeed("S-F06-14-CLOSED-016", () => ({
  会員: [会員f("016")], 大会: [{ 符号: "016", 名: "登録終了大会-016", 英: "Closed Event 016", 開始: 明日() }], 申込: [{ 大会: "016", 会員: "016" }], デッキ: [{ 大会: "016", 会員: "016" }],
  日程直し: [{ 大会: "016", 画面: { 登録を終了する: true }, 文: "「デッキ登録を終了する」にチェックを入れた" }],
}));
defineCaseSeed("S-F06-14-DISABLED-017", () => ({
  会員: [会員f("017")], 大会: [{ 符号: "017", 名: "デッキ対象外大会-017", 英: "No Deck Event 017", 開始: 明日(), 締切: null }], 申込: [{ 大会: "017", 会員: "017" }], デッキ: [],
}));
defineCaseSeed("S-F06-14-EMPTY-019", () => ({ 会員: [会員f("019")], 大会: [], 申込: [], デッキ: [] }));
defineCaseSeed("S-F06-14-FORMAT-020", () => ({
  会員: [会員f("020")], 大会: [{ 符号: "020", 名: "複数フォーマット大会-020", 英: "Multi Format Event 020", 開始: 明日(), 形式: [開催フォーマット, "モダン"] }], 申込: [{ 大会: "020", 会員: "020" }], デッキ: [],
}));
defineCaseSeed("S-F06-14-MIXED-031", () => ({
  会員: [会員dp("031")],
  大会: [
    { 符号: "031A", 名: "申込大会F0614-031A", 英: "Apply Event F0614-031A", 開始: "2027-07-01 10:00" },
    { 符号: "031B", 名: "デッキのみ大会F0614-031B", 英: "Deck Only Event F0614-031B", 開始: "2027-07-02 10:00", 締切: "2027-07-02 23:59" },
    { 符号: "031C", 名: "申込大会F0614-031C", 英: "Apply Event F0614-031C", 開始: "2027-07-03 10:00" },
  ],
  申込: [{ 大会: "031A", 会員: "031" }, { 大会: "031C", 会員: "031" }], デッキ: [{ 大会: "031B", 会員: "031" }],
}));
defineCaseSeed("S-F06-14-COUNT-032", () => ({
  会員: [会員dp("032")],
  大会: [
    { 符号: "032A", 名: "件数確認大会F0614-032A", 英: "Count Event F0614-032A", 開始: "2027-07-10 10:00" },
    { 符号: "032B", 名: "件数確認大会F0614-032B", 英: "Count Event F0614-032B", 開始: "2027-07-11 10:00" },
    { 符号: "032C", 名: "件数確認キャンセル大会-032", 英: "Count Cancel Event-F0614-032", 開始: "2027-07-12 10:00" },
  ],
  申込: [{ 大会: "032A", 会員: "032" }, { 大会: "032B", 会員: "032" }, { 大会: "032C", 会員: "032", 状況: "キャンセル済み" }], デッキ: [],
}));
defineCaseSeed("S-F06-14-PAST-APPLIED-033", () => ({
  会員: [会員dp("033")], 大会: [{ 符号: "033", 名: "前日申込完了大会-033", 英: "Past Applied Event-F0614-033", 開始: 明日() }], 申込: [{ 大会: "033", 会員: "033" }], デッキ: [],
  日程直し: [前日にする("033")],
}));
defineCaseSeed("S-F06-14-ENGLISH-034", () => ({ 会員: [会員dp("034")], 大会: [{ 符号: "034", 名: "英語決済中大会-034", 英: "English Paying Event-F0614-034", 開始: 明日() }], 申込: [{ 大会: "034", 会員: "034", 状況: "決済中" }], デッキ: [] }));
defineCaseSeed("S-F06-14-ENGLISH-035", () => ({ 会員: [会員dp("035")], 大会: [{ 符号: "035", 名: "英語決済中大会-035", 英: "English Paying Event-F0614-035", 開始: 明日() }], 申込: [{ 大会: "035", 会員: "035", 状況: "決済中" }], デッキ: [] }));
defineCaseSeed("S-F06-14-ENGLISH-036", () => ({
  会員: [会員dp("036")], 大会: [{ 符号: "036", 名: "英語終了済み大会-036", 英: "English Finished Event-F0614-036", 開始: 明日() }], 申込: [{ 大会: "036", 会員: "036" }], デッキ: [],
  日程直し: [前日にする("036")],
}));
defineCaseSeed("S-F06-14-CBAPPDECK-037", () => ({
  会員: [会員cb("037")], 大会: [{ 符号: "037", 名: "申込デッキ大会F0614-CB037", 英: "Apply Deck Event F0614-CB037", 開始: 明日() }], 申込: [{ 大会: "037", 会員: "037" }], デッキ: [{ 大会: "037", 会員: "037" }],
}));
defineCaseSeed("S-F06-14-CBAPPONLY-038", () => ({
  会員: [会員cb("038")], 大会: [{ 符号: "038", 名: "申込のみ大会F0614-CB038", 英: "Apply Only Event F0614-CB038", 開始: 明日() }], 申込: [{ 大会: "038", 会員: "038" }], デッキ: [],
}));
defineCaseSeed("S-F06-14-CBNOAPPPAST-039", () => ({
  会員: [会員cb("039")], 大会: [{ 符号: "039", 名: "デッキのみ前日大会F0614-CB039", 英: "Deck Only Past Event F0614-CB039", 開始: 明日() }], 申込: [], デッキ: [{ 大会: "039", 会員: "039" }],
  日程直し: [前日にする("039")],
}));
defineCaseSeed("S-F06-14-CBSHOWDECK-041", () => ({
  会員: [会員cb("041")], 大会: [{ 符号: "041", 名: "デッキ項目表示大会F0614-CB041", 英: "Show Deck Event F0614-CB041", 開始: 明日() }], 申込: [{ 大会: "041", 会員: "041" }], デッキ: [],
}));
defineCaseSeed("S-F06-14-CBENDDECK-042", () => ({
  会員: [会員cb("042")], 大会: [{ 符号: "042", 名: "デッキ項目非表示終了大会F0614-CB042", 英: "Hide Deck Event F0614-CB042", 開始: 明日() }], 申込: [{ 大会: "042", 会員: "042" }], デッキ: [{ 大会: "042", 会員: "042" }],
  日程直し: [前日にする("042")],
}));
