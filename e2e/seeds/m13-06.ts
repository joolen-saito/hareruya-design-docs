/**
 * M13-06 イベント申込一覧（検索入力）のシード（画面操作）。正本: cases/M13-06_seed_data.tsv
 *
 * - 店舗: 新宿店・池袋店。あればそれを使い、無ければ店舗設定で登録する（S-M13-06-MASTER）。
 * - 支払方法の表示順・申込状況の選択肢は共有の設定なので書き換えず、シード表の値と同じかを画面で確かめるだけにする。
 *   違えば作れなかったことにせず問題として報告する（その値を見るケースは期待結果で落ちる）。表示件数は検索結果が出ないと見えないので確かめない。
 * - 試験管理者 m1306_admin: 新宿店だけに編集権限。権限は「モールオペレーター」で代える（「店舗オーナー」「店舗オペレーター」は
 *   所属店舗の店舗しか見えず、池袋店を見るケースが成り立たない。M13-11 の記録 2026-11-09）。
 * - 池袋店のイベント・申込・デッキは、池袋店だけに編集権限を持つ別の管理者 m1306_admin_ikebukuro で作る（シード表に行が無いので、要るときに画面から作る）。
 * - 決め打ちの識別の値（イベント名・会員の姓など）には実行の印を付ける（rc。依頼者決定 2026-10-28）。
 *   フォーマット「M1306-057-FMT」はシード表が「あればそれを使う」と定めるので印を付けない。
 * - 会員はフロントの会員情報登録画面で登録する（本登録のメールを読むので local だけ。依頼者決定 2026-10-31）。
 * - DB での準備が要るシード（005・006・023・026・030・031・032・056・062・067・074）は作らない（依頼者の指示待ち）。
 */
import { Browser, Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { rc, RUN_MARK } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, hideDebugToolbar, withAdminSession } from "../lib/session";
import { EventInput, registerEvent, searchEventIds } from "../pages/admin/event";
import { ensureMember } from "../pages/admin/member";
import { EntryListPage, フォーマットを用意する, プレイヤーのデッキを登録する, プレイヤーを検索する, プレイヤー検索の行を読む, 新規申込登録画面を開く, 申込を登録する, 申込状況を変える } from "../pages/admin/m13_06_entry_list";
import { registerSchedule, ScheduleInput } from "../pages/admin/schedule";
import { ensureTenant } from "../pages/admin/tenant";
import { registerFrontMember } from "../pages/front/member_entry";

export const M1306_ADMIN: Account = { loginId: "m1306_admin", password: "Passw0rd!M1306" };
/** 池袋店に編集権限を持つ別の管理者（シード表の投入方法が「池袋店に編集権限を持つ別の管理者」と定める。行は無い） */
export const M1306_IKEBUKURO_ADMIN: Account = { loginId: "m1306_admin_ikebukuro", password: "Passw0rd!M1306I" };

/** 試験管理者の権限。「店舗オーナー」は所属店舗の店舗しか見えない（DBの行の制限）ので、全店舗が見える「モールオペレーター」で代える */
const 試験管理者の権限 = "モールオペレーター";

export const 支払方法の並び = ["コンビニ決済", "クレジットカード決済", "管理者追加"];
export const 申込状況の並び = ["決済中", "入金待ち", "申込済み", "入金期限切れ", "キャンセル済み", "支払番号が存在しない"];

defineSeed("S-M13-06-MASTER", async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await ensureTenant(page, { 店名: "新宿店", 店名カナ: "シンジュクテン", 店名英語: "Shinjuku", 支店URL: "m1306shinjuku", 店名略称3文字: "新宿店", ショップ名略称: "新宿店" }, issue);
    await ensureTenant(page, { 店名: "池袋店", 店名カナ: "イケブクロテン", 店名英語: "Ikebukuro", 支店URL: "m1306ikebukuro", 店名略称3文字: "池袋店", ショップ名略称: "池袋店" }, issue);
    // 共有の設定（支払方法の表示順・申込状況）は書き換えず、イベント申込一覧の選択肢の並びで確かめる
    const list = new EntryListPage(page);
    await list.開く();
    const 支払方法 = (await list.支払方法.locator("option").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
    if (JSON.stringify(支払方法) !== JSON.stringify(支払方法の並び)) issue(`支払方法の選択肢の並びがシード表（${支払方法の並び.join("・")}）と違う: ${支払方法.join("・")}（共有の設定なので書き換えていない）`);
    const 申込状況 = (await list.申込状況.locator("option").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
    if (JSON.stringify(申込状況) !== JSON.stringify(申込状況の並び)) issue(`申込状況の選択肢がシード表（${申込状況の並び.join("・")}）と違う: ${申込状況.join("・")}`);
  });
});

defineSeed("S-M13-06-ADM", { needs: ["S-M13-06-MASTER"] }, async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await ensureMember(page, {
      名前: "M13-06試験管理者", 所属店舗: "新宿店", ログインID: M1306_ADMIN.loginId, メールアドレス: "m1306_admin@example.test",
      パスワード: M1306_ADMIN.password, 権限: 試験管理者の権限, デフォルト検索表示店舗: "新宿店", 編集可能店舗: ["新宿店"],
    });
  });
});

export async function 池袋店の管理者を用意する(browser: Browser): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await ensureMember(page, {
      名前: "M13-06池袋店管理者", 所属店舗: "池袋店", ログインID: M1306_IKEBUKURO_ADMIN.loginId, メールアドレス: "m1306_admin_ikebukuro@example.test",
      パスワード: M1306_IKEBUKURO_ADMIN.password, 権限: 試験管理者の権限, デフォルト検索表示店舗: "池袋店", 編集可能店舗: ["池袋店"],
    });
  });
}

// ---- ブラウザセッション（ケースの新しいブラウザで試験管理者がログインする。ログインはケースの側で行う）
function defineSessionSeed(seedId: string): void {
  defineSeed(seedId, { needs: ["S-M13-06-ADM"] }, async () => {});
}
defineSessionSeed("S-M13-06-SESSION-001");
defineSessionSeed("S-M13-06-SESSION-002");
defineSessionSeed("S-M13-06-SESSION-004");
defineSessionSeed("S-M13-06-SESSION-020");
defineSessionSeed("S-M13-06-SESSION-022");
defineSessionSeed("S-M13-06-SESSION-038");
defineSessionSeed("S-M13-06-SESSION-048");
defineSessionSeed("S-M13-06-SESSION-049");
defineSessionSeed("S-M13-06-SESSION-050");
defineSessionSeed("S-M13-06-SESSION-065");

// ---- 部品

type 会員 = { 姓: string; 名: string; セイ: string; メイ: string };

/** フロントの会員情報登録画面で会員を登録する（プレイヤーは会員と同時に作られる）。メールアドレスは実行ごとに別の値 */
export async function 会員を登録する(browser: Browser, m: 会員, 識別: string): Promise<void> {
  // 本登録のメールを読めない環境では、registerFrontMember が仮会員を管理画面で本会員にする（シードの注記に残る）
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    await registerFrontMember(await context.newPage(), {
      ...m, メール: `m1306-${識別.toLowerCase()}-${RUN_MARK.toLowerCase()}@example.test`, パスワード: "Passw0rd!M1306M",
    });
  } finally {
    await context.close();
  }
}
export const 検証会員 = (姓: string, 名 = "一郎"): 会員 => ({ 姓, 名, セイ: "ケンショウ", メイ: "イチロウ" });

/** イベント(英)には、ほかのケースの検索語を含めない */
export const 英名 = (n: string) => `Seed ${n} ${RUN_MARK}`;
export const イベント = (名日: string, 名英: string, 店舗: string, over: EventInput = {}): EventInput => ({
  イベント名日: 名日, イベント名英: 名英, 店舗, フォーマット: ["スタンダード"], ルール適用度: "初心者歓迎", 公開状態: "公開", 定員: "16", 参加費: "0", ...over,
});
/**
 * シード表の開催日（2026-09-10 前後）の読み替え。
 * イベント申込一覧の開始時間(From)の初期値は画面を開いた日なので、実行した日より前の開催日の申込は、
 * 開始時間(From)を初期表示のまま検索するケースで出ない（シード表を作った時点では先の日付だった）。
 * テストデータは自作のデータへ読み替えてよい（チームの手順）ので、実行した日より前なら、月日・時刻はそのままに、
 * 実行した日以後になるまで年を1年ずつ後ろへずらす。ずらした年数は、オンライン受付の期間にも同じだけ足す。
 * 読み替えたことはシードの注記に残す（項目表の備考に書く）。
 */
const 今日の0時 = (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); })();
export function 開催日の年のずれ(開始時間: string): number {
  const [y, mo, d] = 開始時間.slice(0, 10).split("-").map(Number);
  let n = 0;
  while (new Date(y + n, mo - 1, d) < 今日の0時) n++;
  return n;
}
const 年をずらす = (日時: string, n: number) => `${Number(日時.slice(0, 4)) + n}${日時.slice(4)}`;
/** シード表の開催日を、実行した日以後へ読み替えた値（年だけを変える）。読み替えなければそのまま */
export const 読み替えた開催日 = (開始時間: string) => 年をずらす(開始時間, 開催日の年のずれ(開始時間));
export function 開催日の読み替えを残す(seedId: string, 開始時間: string): void {
  const n = 開催日の年のずれ(開始時間);
  if (n > 0) reportSeedIssue(seedId, `シード表の日程の開始時間「${開始時間}」は実行した日より前で、開始時間(From)の初期値（画面を開いた日）で検索すると出ないため、年だけを${n}年後ろへずらした「${年をずらす(開始時間, n)}」で作った（オンライン受付の期間も同じだけずらした）`);
}

/** 受付時間 09:00〜09:30、デッキ登録なし。オンライン受付ありなら 2026-08-01 00:00〜2026-08-31 00:00。年は開始時間の読み替えと同じだけずらす */
export const 日程 = (開始時間: string, オンライン = true): ScheduleInput => {
  const n = 開催日の年のずれ(開始時間);
  return {
    開始時間: 年をずらす(開始時間, n), 受付あり: true, 受付時間: { 開始: "09:00", 終了: "09:30" }, デッキ登録あり: false,
    ...(オンライン ? { オンライン受付: { 開始: 年をずらす("2026-08-01 00:00", n), 終了: 年をずらす("2026-08-31 00:00", n) } } : {}),
  };
};

/** イベント申込一覧でイベント名を入れ、店舗と開始時間の条件を空にして検索し、表示された申込ID・行を返す */
async function 申込一覧で検索する(page: Page, イベント名: string, 種別: "イベント申込を検索" | "デッキ登録を検索") {
  const list = new EntryListPage(page);
  await list.開く();
  await list.検索種別(種別).check();
  await list.イベント名.fill(イベント名);
  await list.店舗を選ぶ([]);
  await list.開始時間を空にする();
  await list.検索する();
  return { ids: await list.表示された申込ID(), rows: await list.行を読む() };
}
export async function 申込だけが出ることを確かめる(page: Page, イベント名: string, ids: string[]): Promise<void> {
  const got = (await 申込一覧で検索する(page, イベント名, "イベント申込を検索")).ids;
  // 結果は1ページに表示件数（初期値10件）までしか出ないので、11件以上は「該当件数」と、出た行が作った申込だけであることで確かめる
  const 件数 = (await new EntryListPage(page).該当件数()) ?? got.length;
  const よその申込 = got.filter((x) => !ids.includes(x));
  if (件数 !== ids.length || よその申込.length > 0 || got.length === 0) {
    throw new Error(`イベント申込一覧で「${イベント名}」を検索すると、${件数}件で申込ID ${got.join("、") || "なし"} が出る（作った申込 ${ids.join("、")} だけのはず）`);
  }
}

export type 申込の定め = { label?: string; 姓: string; 名?: string; 状況?: string; デッキ?: { label?: string } };
export type 申込シード = { 名日: string; 名英?: string; 店舗?: "新宿店" | "池袋店"; 開始?: string; 申込: 申込の定め[]; 後処理?: (申込ID: string[]) => Promise<void> | void };

/**
 * イベントと日程（オンライン受付あり）を登録し、会員を登録して申込を登録し（必要なら申込状況を変え）、デッキを登録して、申込IDとデッキIDを控える。
 * 最後にイベント申込一覧で、作った申込だけが出ることを確かめる。
 */
export function defineEntrySeed(seedId: string, n: string, v: 申込シード): void {
  defineSeed(seedId, { needs: ["S-M13-06-ADM"] }, async ({ browser, notes }) => {
    const 店舗 = v.店舗 ?? "新宿店";
    const 開始 = v.開始 ?? "2026-09-10 10:00";
    開催日の読み替えを残す(seedId, 開始);
    for (const [i, a] of v.申込.entries()) await 会員を登録する(browser, 検証会員(a.姓, a.名), `${n}-${i}`);
    if (店舗 === "池袋店") await 池袋店の管理者を用意する(browser);
    await withAdminSession(browser, 店舗 === "池袋店" ? M1306_IKEBUKURO_ADMIN : M1306_ADMIN, async (page) => {
      const id = await registerEvent(page, イベント(v.名日, v.名英 ?? 英名(n), 店舗));
      const d = await registerSchedule(page, id, 日程(開始));
      const ids: string[] = [];
      for (const a of v.申込) {
        const e = await 申込を登録する(page, v.名日, d, a.姓);
        ids.push(e);
        if (a.label) notes.set(a.label, e);
        if (a.状況) await 申込状況を変える(page, e, a.状況);
      }
      for (const a of v.申込) {
        if (!a.デッキ) continue;
        const deck = await プレイヤーのデッキを登録する(page, { デッキ名: `M1306-${n}-DECK`, プレイヤー名: a.姓, イベント名: v.名日, 店舗, 日程ID: d, 開催日: 読み替えた開催日(開始).slice(0, 10).replace(/-/g, "/") });
        if (a.デッキ.label) notes.set(a.デッキ.label, deck);
      }
      await v.後処理?.(ids);
      await 申込だけが出ることを確かめる(page, v.名日, ids);
    });
  });
}

export const 申込 = (n: string, x: string, over: Partial<申込の定め> = {}): 申込の定め => ({ label: `〔申込ID-M1306-${n}${x}〕`, 姓: rc(`検証M1306-${n}${x}`), ...over });

// 029: イベント名 M1306CSVAPP-029・M1306CSVDECK-029 の2イベントに申込各1件（デッキあり）
defineSeed("S-M13-06-CSV-029", { needs: ["S-M13-06-ADM"] }, async ({ browser, notes, seed }) => {
  const 姓 = [rc("検証M1306-029A"), rc("検証M1306-029B")];
  for (const [i, s] of 姓.entries()) await 会員を登録する(browser, 検証会員(s), `029-${i}`);
  await withAdminSession(browser, M1306_ADMIN, async (page) => {
    const items: [string, string, string, string][] = [[rc("M1306CSVAPP-029"), "2026-09-10 10:00", 姓[0], "〔申込ID-M1306-029A〕"], [rc("M1306CSVDECK-029"), "2026-09-11 10:00", 姓[1], "〔申込ID-M1306-029B〕"]];
    for (const [名日, 開始, s, label] of items) {
      開催日の読み替えを残す(seed.シードID, 開始);
      const id = await registerEvent(page, イベント(名日, 英名(`029${label.slice(-2, -1)}`), "新宿店"));
      const d = await registerSchedule(page, id, 日程(開始));
      const e = await 申込を登録する(page, 名日, d, s);
      notes.set(label, e);
      await プレイヤーのデッキを登録する(page, { デッキ名: "M1306-029-DECK", プレイヤー名: s, イベント名: 名日, 店舗: "新宿店", 日程ID: d, 開催日: 読み替えた開催日(開始).slice(0, 10).replace(/-/g, "/") });
    }
  });
});

// 036・039: 1イベントに申込11件（036 は各申込にデッキあり）。申込IDはシード表に名前で出てくる A と K だけを控える（B〜J は「〜」の範囲でしか書かれていない）
function definePagingSeed(seedId: string, n: string, イベント語: string, デッキ: boolean): void {
  const xs = "ABCDEFGHIJK".split("");
  defineEntrySeed(seedId, n, {
    名日: rc(イベント語),
    申込: xs.map((x) => ({ label: x === "A" || x === "K" ? `〔申込ID-M1306-${n}${x}〕` : undefined, 姓: rc(`検証M1306-${n}${x}`), ...(デッキ ? { デッキ: {} } : {}) })),
  });
}
definePagingSeed("S-M13-06-PAGING-036", "036", "M1306PAGE-036", true);
definePagingSeed("S-M13-06-PAGING-039", "039", "M1306PAGE-039", false);

// 044: イベントID・日程ID・申込IDを控える
defineSeed("S-M13-06-FILTER-044", { needs: ["S-M13-06-ADM"] }, async ({ browser, notes, seed }) => {
  const 姓 = rc("検証M1306-044");
  開催日の読み替えを残す(seed.シードID, "2026-09-10 10:00");
  await 会員を登録する(browser, 検証会員(姓), "044");
  await withAdminSession(browser, M1306_ADMIN, async (page) => {
    const 名日 = rc("M1306FILTER-044");
    const id = await registerEvent(page, イベント(名日, 英名("044"), "新宿店"));
    const d = await registerSchedule(page, id, 日程("2026-09-10 10:00"));
    notes.set("〔イベントID-M1306-044〕", id);
    notes.set("〔日程ID-M1306-044〕", d);
    notes.set("〔申込ID-M1306-044〕", await 申込を登録する(page, 名日, d, 姓));
  });
});

// 046: 参加費あり・オンライン受付ありの日程と、まだ申込の無い会員「新規 参加者」。プレイヤーIDはプレイヤー検索の行から読む（決定も登録も押さない）
export const 新規参加者 = { 姓: "新規", 名: rc("参加者") };
defineSeed("S-M13-06-INBOUND-046", { needs: ["S-M13-06-ADM"] }, async ({ browser, notes }) => {
  await 会員を登録する(browser, { 姓: 新規参加者.姓, 名: 新規参加者.名, セイ: "シンキ", メイ: "サンカシャ" }, "046");
  await withAdminSession(browser, M1306_ADMIN, async (page) => {
    const 名日 = rc("M1306INBOUND-046");
    const id = await registerEvent(page, イベント(名日, 英名("046"), "新宿店", { 参加費: "1000", 支払方法: ["クレジットカード決済"] }));
    const d = await registerSchedule(page, id, { 開始時間: "2027-09-10 10:00", 受付あり: true, 受付時間: { 開始: "09:00", 終了: "09:30" }, デッキ登録あり: false, オンライン受付: { 開始: "2027-08-01 00:00", 終了: "2027-08-31 00:00" } });
    notes.set("〔イベントID-M1306-046〕", id);
    notes.set("〔日程ID-M1306-046〕", d);
    await 新規申込登録画面を開く(page, 名日, d);
    const 氏名 = `${新規参加者.姓} ${新規参加者.名}`;
    // シード表はプレイヤー名に「新規」を入れる。結果はID の昇順で複数ページに分かれ、いま作った行が1ページ目に出ないことがあるので、氏名で検索する
    const rows = (await プレイヤー検索の行を読む(await プレイヤーを検索する(page, 氏名))).filter(([, name]) => name === 氏名);
    if (rows.length === 0) throw new Error(`プレイヤー検索「${氏名}」の結果に、氏名「${氏名}」の行が無い`);
    // 同じ氏名の行が複数あるときは、いちばん大きいIDの行（シード表）
    notes.set("〔プレイヤーID-M1306-046〕", String(Math.max(...rows.map(([pid]) => Number(pid)))));
  });
});

// 051〜054: 申込2件。A は申込状況を変え、B は申込済みのまま
defineEntrySeed("S-M13-06-STATUS-051", "051", { 名日: rc("M1306-051"), 申込: [申込("051", "A", { 状況: "決済中" }), 申込("051", "B")] });
defineEntrySeed("S-M13-06-STATUS-052", "052", { 名日: rc("M1306-052"), 申込: [申込("052", "A", { 状況: "入金期限切れ" }), 申込("052", "B")] });
defineEntrySeed("S-M13-06-STATUS-053", "053", { 名日: rc("M1306-053"), 申込: [申込("053", "A", { 状況: "キャンセル済み" }), 申込("053", "B")] });
defineEntrySeed("S-M13-06-STATUS-054", "054", { 名日: rc("M1306-054"), 申込: [申込("054", "A", { 状況: "支払番号が存在しない" }), 申込("054", "B")] });
// 055・071: A はデッキあり、B はデッキなし
defineEntrySeed("S-M13-06-DECK-055", "055", { 名日: rc("M1306-055"), 申込: [申込("055", "A", { デッキ: {} }), 申込("055", "B")] });
defineEntrySeed("S-M13-06-DECKHAVE-071", "071", { 名日: rc("M1306-071"), 申込: [申込("071", "A", { デッキ: {} }), 申込("071", "B")] });
// 059: 申込済みの申込とそのデッキ／061: 入金待ちの申込とそのデッキ
defineEntrySeed("S-M13-06-DECKCHK-059", "059", { 名日: rc("M1306-059"), 申込: [{ label: "〔申込ID-M1306-059〕", 姓: rc("検証M1306-059"), デッキ: { label: "〔デッキID-M1306-059〕" } }] });
defineEntrySeed("S-M13-06-DECKBULK-061", "061", { 名日: rc("M1306-061"), 申込: [{ label: "〔申込ID-M1306-061〕", 姓: rc("検証M1306-061"), 状況: "入金待ち", デッキ: { label: "〔デッキID-M1306-061〕" } }] });
// 068: 池袋店（池袋店の管理者で作る）
defineEntrySeed("S-M13-06-DECKSHOP-068", "068", { 名日: rc("M1306-068"), 店舗: "池袋店", 申込: [{ label: "〔申込ID-M1306-068〕", 姓: rc("検証M1306-068"), デッキ: {} }] });
// 069・070: 申込3件の申込状況
defineEntrySeed("S-M13-06-FILTSTAT-069", "069", { 名日: rc("M1306-069"), 申込: [申込("069", "A", { 状況: "入金待ち" }), 申込("069", "B"), 申込("069", "C", { 状況: "キャンセル済み" })] });
defineEntrySeed("S-M13-06-FILTSTAT-070", "070", { 名日: rc("M1306-070"), 申込: [申込("070", "A"), 申込("070", "B", { 状況: "入金待ち" }), 申込("070", "C", { 状況: "決済中" })] });

// 060・063・064: 申込の無いデッキ（日程はオンライン受付なし）
export const デッキだけの会員 = {
  "060": { 姓: rc("晴屋M1306-060"), 名: "次郎", セイ: "ハレヤ", メイ: "ジロウ" },
  "063": { 姓: rc("晴屋M1306-063"), 名: "三郎", セイ: "ハレヤ", メイ: "サブロウ" },
  "064": { 姓: rc("晴屋M1306-064"), 名: "太郎", セイ: "ハレヤ", メイ: "タロウ" },
} as const;
/** 064 のイベント名（日）。検索語「M1306-064」に印を付けた値のあとに「-晴大会」を付ける（検索語が部分一致する関係を保つ） */
export const イベント名064 = `${rc("M1306-064")}-晴大会`;
function defineDeckOnlySeed(seedId: string, n: "060" | "063" | "064", 名日: string, 検索語: string, 日程label?: string): void {
  defineSeed(seedId, { needs: ["S-M13-06-ADM"] }, async ({ browser, notes }) => {
    const m = デッキだけの会員[n];
    開催日の読み替えを残す(seedId, "2026-09-10 10:00");
    await 会員を登録する(browser, { ...m }, n);
    await withAdminSession(browser, M1306_ADMIN, async (page) => {
      const id = await registerEvent(page, イベント(名日, 英名(n), "新宿店"));
      const d = await registerSchedule(page, id, 日程("2026-09-10 10:00", false));
      if (日程label) notes.set(日程label, d);
      notes.set(`〔デッキID-M1306-${n}〕`, await プレイヤーのデッキを登録する(page, { デッキ名: `M1306-${n}-DECK`, プレイヤー名: m.姓, イベント名: 検索語, 店舗: "新宿店", 日程ID: d, 開催日: 読み替えた開催日("2026-09-10 10:00").slice(0, 10).replace(/-/g, "/") }));
      // 確認: イベント申込を検索は0件、デッキ登録を検索は上のデッキ1行だけ
      const e = await 申込一覧で検索する(page, 検索語, "イベント申込を検索");
      if (e.rows.length !== 0) throw new Error(`イベント申込一覧で「${検索語}」のイベント申込を検索すると ${e.rows.length} 行出る（0件のはず）`);
      const k = await 申込一覧で検索する(page, 検索語, "デッキ登録を検索");
      if (k.rows.length !== 1 || !k.rows[0].プレイヤー欄.includes(m.姓)) throw new Error(`イベント申込一覧で「${検索語}」のデッキ登録を検索すると ${k.rows.length} 行出る（「${m.姓}」のデッキ1行だけのはず）`);
    });
  });
}
defineDeckOnlySeed("S-M13-06-DECKCHK-060", "060", rc("M1306-060"), rc("M1306-060"));
defineDeckOnlySeed("S-M13-06-DECKNONE-063", "063", rc("M1306-063"), rc("M1306-063"));
defineDeckOnlySeed("S-M13-06-DECKROW-064", "064", イベント名064, rc("M1306-064"), "〔日程ID-M1306-064〕");

// 057: フォーマット M1306-057-FMT（あれば使う）だけを選んだ新宿店のイベントと、オンライン受付ありの日程
export const イベント057 = { 名日: `${rc("M1306-057")}-晴大会`, 名英: `${rc("M1306-057")}-Sunny-Cup`, フォーマット: "M1306-057-FMT" };
defineSeed("S-M13-06-MODAL-057", { needs: ["S-M13-06-ADM"] }, async ({ browser, notes }) => {
  await withAdminSession(browser, M1306_ADMIN, async (page) => {
    await フォーマットを用意する(page, { 名前日: イベント057.フォーマット, 名前英: "M1306-057-FMT", コード: "M1306057", 並び順: "9000" });
    const id = await registerEvent(page, イベント(イベント057.名日, イベント057.名英, "新宿店", { フォーマット: [イベント057.フォーマット] }));
    notes.set("〔イベントID-M1306-057〕", id);
    // 057 はモーダルの開催日 2026/09/01〜2026/09/30 で探すので、開催日は読み替えない（シード表のまま）
    notes.set("〔日程ID-M1306-057〕", await registerSchedule(page, id, { 開始時間: "2026-09-10 10:00", 受付あり: true, 受付時間: { 開始: "09:00", 終了: "09:30" }, デッキ登録あり: false, オンライン受付: { 開始: "2026-08-01 00:00", 終了: "2026-08-31 00:00" } }));
    // 確認: イベント一覧で検索語のイベントは上の1件だけ
    const ids = await searchEventIds(page, イベント057.名日);
    if (JSON.stringify(ids) !== JSON.stringify([id])) throw new Error(`イベント一覧で「${イベント057.名日}」のイベントが ${ids.join("、") || "なし"}（${id} の1件だけのはず）`);
  });
});
