/**
 * F06-14 マイイベント・デッキ登録 の続き（-b）のシード（画面操作）。正本: cases/F06-14_seed_data.tsv
 * 既存の seeds/f06-14.ts（共有の会員）は変えない。
 *
 * - 会員は、フロントの新規会員登録で作る（依頼者決定 2026-10-31）。メールの前半（英数字）と名前に実行の印を付ける。選手IDは会員の選手を DB の参照（SELECT）で控える。
 * - 大会（イベント）と日程は、イベント登録画面と「日程追加」で作る。店舗は編集できる任意の店舗（Hareruya。正本の「本店」）、フォーマットは Standard（無ければ作る）。
 * - 申込は、イベント申込登録画面で選手を検索して登録する（申込状況は初期値）。「決済中」「キャンセル」は申込詳細・編集画面で直す。
 * - 大会デッキは、会員でログインして画面から提出する。
 * - 前日の大会は、シード表のとおり翌日で作ってから日程編集画面で前日に直す。
 * - 001〜023 のパスワード「F0614Pw0NN!」は11文字で、会員登録の最小12文字に満たないため、末尾に1文字（x）足した（正本の外の補い）。
 * - DBで直接設定する項目（支払い会員・デッキ登録締切の秒・申込状態のマスタ）は設定しない（開発用のデータを書き換えない）。
 */
import { SETUP_ADMIN } from "../config/env";
import { 会員の選手ID } from "../db/f06_16";
import { 申込状態の名称, フォーマットの名称と略称, 表示件数がある } from "../db/f06_14";
import { RUN_MARK, rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { Notes } from "../lib/notes";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { BASE_URL } from "../config/env";
import { registerFrontMember } from "../pages/front/member_entry";
import { 参照フォーマット, フォーマットを用意する } from "../pages/admin/f06_16_setup";
import { 日時をずらす, 大会を登録する, 日程を直す, 日程の修正, 申込状況を変える } from "../pages/admin/f06_14_b_setup";
import { 会員IDをメールから, 申込登録で選手を読む } from "../pages/admin/f07_04_setup";
import { 実行日から } from "../pages/admin/f07_01_setup";
import { frontLogin } from "../pages/admin/m04_19_order_shortage";
import { DeckEditPage } from "../pages/front/f06_16_deck_entry";

export type 作った会員 = { メール: string; パスワード: string; 氏名: string; 会員ID: string; 選手ID: string };
export type 作った大会 = { 名: string; 英名: string; イベントID: string; 日程ID: string; 申込ID?: string; デッキID?: string };
/** 会員の番号（ケース番号）→ 会員 */
export const 会員一覧 = new Map<string, 作った会員>();
/** ケース番号 → 呼び名（符号）→ 大会 */
export const 大会一覧 = new Map<string, Map<string, 作った大会>>();

const 標準フォーマット = "Standard";

defineSeed("S-F06-14-REF", async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  // 正本の参照データ（本店・申込状態・表示件数・フォーマット）の存在と値は DB の参照で確かめる。不足は画面で作れない（マスタ）ので、食い違いは注記に残す
  const 状態: [number, string][] = [[1, "決済中"], [4, "申込完了"], [6, "キャンセル"]];
  for (const [id, 正本の名称] of 状態) {
    const 実際 = 申込状態の名称(id);
    if (実際 !== 正本の名称) issue(`申込状態（識別子${id}）の名称は、正本が「${正本の名称}」とするのに対し、手元のDBでは「${実際 ?? "（無い）"}」`);
  }
  if (!表示件数がある(10)) issue("表示件数の選択肢に10件が無い");
  for (const [id, 略称] of [[1, "STD"], [2, "MOD"]] as const) {
    const f = フォーマットの名称と略称(id);
    if (!f || f.略称 !== 略称) issue(`フォーマットID ${id} の略称は、正本が「${略称}」とするのに対し、手元のDBでは「${f?.略称 ?? "（無い）"}」（名称「${f?.名称 ?? "（無い）"}」）`);
  }
  // 大会デッキを提出できるよう、枚数の制限が無い試験用フォーマット（Standard）を、あれば使い、無ければ作る
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(120_000);
    page.setDefaultNavigationTimeout(180_000);
    await フォーマットを用意する(page, 参照フォーマット[0]);
  });
});

type 申込案 = { 参加者: "本人" | "他会員"; 状況?: "決済中" | "キャンセル済み" };
type 大会案 = {
  符号: string; 名: string; 英名?: string; フォーマット?: string[];
  /** 日程の開始時間（作るとき） */
  開始: string; デッキ登録: boolean; 締切?: string;
  申込?: 申込案; デッキ提出?: boolean;
  /** 申込・デッキ提出のあとで、日程編集画面で直す */
  あとで?: 日程の修正;
};
type 作り方 = {
  n: string; 会員の符号?: string; メールの型: "f0614m" | "dpf0614m" | "cbf0614m"; パスワード: string;
  /** 申込の参加者になる他会員の符号（001のB） */
  他会員?: boolean;
  大会: 大会案[];
};

const label = (項目: string, 符号: string): string => `〔${項目}-F0614-${符号}〕`;
const 翌日 = (時刻: string): string => 実行日から(1, 時刻);
const 前日 = (時刻: string): string => 実行日から(-1, 時刻);

async function 会員を登録する(ctx: SeedCtx, 符号: string, メールの型: string, パスワード: string): Promise<作った会員> {
  const ベース = `${メールの型}${符号}`.toLowerCase();
  const 名 = `F0614${符号}${RUN_MARK}`.replace(/[^0-9A-Za-z]/g, "");
  const メール = `${rc(ベース)}@example.test`.toLowerCase();
  // 画面の読み込みが遅い環境なので、待ちを長くする
  const context = await ctx.browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const fp = await context.newPage();
    fp.setDefaultTimeout(120_000);
    fp.setDefaultNavigationTimeout(180_000);
    await registerFrontMember(fp, { 姓: "試験", 名, セイ: "シケン", メイ: "カイイン", メール, パスワード });
  } finally {
    await context.close();
  }
  const m = { メール, 氏名: `試験 ${名}` };
  const 会員ID = await withAdminSession(ctx.browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(120_000);
    page.setDefaultNavigationTimeout(180_000);
    return 会員IDをメールから(page, m.メール);
  });
  const 選手ID = 会員の選手ID(会員ID);
  if (!選手ID) throw new Error(`会員 ${m.メール} の選手が見つからない`);
  return { メール: m.メール, パスワード, 氏名: m.氏名, 会員ID, 選手ID };
}

async function デッキを提出する(ctx: SeedCtx, 会員: 作った会員, 日程ID: string): Promise<string> {
  const context = await ctx.browser.newContext({ locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    page.setDefaultNavigationTimeout(120_000);
    await frontLogin(page, 会員);
    const e = new DeckEditPage(page);
    await e.開く(日程ID);
    if ((await e.フォーマット選択肢()).length > 1) await e.フォーマットを選ぶ(標準フォーマット);
    await e.入力する("メイン", "1 Island");
    const r = await e.提出する();
    if (!r.送信) throw new Error(`会員 ${会員.メール} の大会デッキの提出が送信されない`);
    const id = /\/deckentry\/(\d+)\/check/.exec(page.url())?.[1];
    if (!id) throw new Error(`大会デッキを提出したが完了画面へ移らない（${page.url()}）`);
    return id;
  } finally {
    await context.close();
  }
}

async function 作る(ctx: SeedCtx, p: 作り方): Promise<void> {
  const 本人 = await 会員を登録する(ctx, p.会員の符号 ?? p.n, p.メールの型, p.パスワード);
  会員一覧.set(p.n, 本人);
  const 他 = p.他会員 ? await 会員を登録する(ctx, `${p.n}b`, p.メールの型, p.パスワード) : undefined;
  if (他) 会員一覧.set(`${p.n}B`, 他);
  const 大会たち = new Map<string, 作った大会>();
  大会一覧.set(p.n, 大会たち);
  for (const d of p.大会) {
    const 名 = rc(d.名);
    const 英名 = rc(d.英名 ?? `F0614 Event ${d.符号}`);
    const 大 = await withAdminSession(ctx.browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(120_000);
      page.setDefaultNavigationTimeout(180_000);
      const e = await 大会を登録する(page, {
        名, 英名, フォーマット: d.フォーマット ?? [標準フォーマット], 開始: d.開始, デッキ登録: d.デッキ登録,
        締切: d.締切 ?? `${d.開始.slice(0, 10)} 23:59`, オンライン受付あり: !!d.申込,
      });
      let 申込ID: string | undefined;
      if (d.申込) {
        const 参加者 = d.申込.参加者 === "本人" ? 本人 : 他!;
        申込ID = (await 申込登録で選手を読む(page, e, 0, 参加者.氏名, true)).申込ID;
      }
      return { e, 申込ID };
    });
    const 日程ID = 大.e.日程ID[0];
    const 作った: 作った大会 = { 名, 英名, イベントID: 大.e.イベントID, 日程ID, 申込ID: 大.申込ID };
    if (d.デッキ提出) 作った.デッキID = await デッキを提出する(ctx, 本人, 日程ID);
    if (d.あとで || d.申込?.状況) {
      await withAdminSession(ctx.browser, SETUP_ADMIN, async (page) => {
        page.setDefaultTimeout(120_000);
        page.setDefaultNavigationTimeout(180_000);
        if (d.あとで) await 日程を直す(page, 作った.イベントID, 日程ID, d.あとで);
        if (d.申込?.状況) await 申込状況を変える(page, 作った.申込ID!, d.申込.状況);
      });
    }
    大会たち.set(d.符号, 作った);
  }
  // シード表が控えると定めた呼び名を控える
  const { seed, notes } = ctx;
  const 値 = (l: string): string | undefined => {
    const m = /^〔(.+?)-F0614-(.+)〕$/.exec(l);
    if (!m) return undefined;
    const [, 項目, 符号] = m;
    const 番号 = 符号.replace(/[AB]$/, "");
    if (項目 === "会員ID" || 項目 === "プレイヤーID") {
      const 会員 = p.他会員 && /B$/.test(符号) ? 他 : 本人;
      return 項目 === "会員ID" ? 会員?.会員ID : 会員?.選手ID;
    }
    const 大 = 大会たち.get(符号) ?? (大会たち.size === 1 && 番号 === p.n ? [...大会たち.values()][0] : undefined);
    if (!大) return undefined;
    return 項目 === "イベントID" ? 大.イベントID : 項目 === "申込ID" ? 大.申込ID : 項目 === "デッキID" ? 大.デッキID : undefined;
  };
  for (const l of Notes.labelsIn(seed["状態・属性"] + seed.投入方法).filter((x) => !x.includes("…"))) {
    const v = 値(l);
    if (v === undefined) throw new Error(`${seed.シードID}: 呼び名 ${l} の値を作り方が持っていない`);
    notes.set(l, v);
  }
}

const REF = { needs: ["S-F06-14-REF"] };
const 申込済み: 申込案 = { 参加者: "本人" };
const 決済中: 申込案 = { 参加者: "本人", 状況: "決済中" };
const 通常 = (n: string, 名: string, 追加: Partial<大会案> = {}): 大会案 => ({ 符号: n, 名, 開始: 翌日("10:00"), デッキ登録: true, ...追加 });
const F = (n: string): Pick<作り方, "メールの型" | "パスワード"> => ({ メールの型: "f0614m", パスワード: `F0614Pw${n}!x` });
const D = (n: string): Pick<作り方, "メールの型" | "パスワード"> => ({ メールの型: "dpf0614m", パスワード: `Passw0rd-F0614${n}` });
const C = (n: string): Pick<作り方, "メールの型" | "パスワード"> => ({ メールの型: "cbf0614m", パスワード: `Passw0rd-CBF0614${n}` });

const seedOf = (id: string, p: 作り方): void => defineSeed(`S-F06-14-${id}`, REF, (ctx) => 作る(ctx, p));

seedOf("FILTER-001", {
  n: "001", ...F("001"), 他会員: true,
  大会: [
    // 本人申込大会は支払い会員が試験会員・参加者が他会員、他会員申込大会はその逆（支払い会員はDBでしか設定できないので設定しない）
    通常("001A", "本人申込大会-001", { 申込: { 参加者: "他会員" } }),
    通常("001B", "他会員申込大会-001", { 開始: 翌日("11:00"), 申込: 申込済み }),
    通常("001C", "キャンセル大会-001", { 開始: 翌日("12:00"), 申込: { 参加者: "本人", 状況: "キャンセル済み" } }),
  ],
});
seedOf("DECK-ONLY-002", { n: "002", ...F("002"), 大会: [通常("002", "デッキのみ大会-002", { デッキ提出: true })] });
seedOf("SORT-003", {
  n: "003", ...F("003"),
  大会: [
    通常("003A", "開催日10日大会-003", { 開始: "2027-06-10 10:00", 申込: 申込済み }),
    通常("003B", "開催日12日大会-003", { 開始: "2027-06-12 10:00", 申込: 申込済み }),
    通常("003C", "開催日11日大会-003", { 開始: "2027-06-11 10:00", 申込: 申込済み }),
  ],
});
seedOf("TODAY-004", { n: "004", ...F("004"), 大会: [通常("004", "当日開催大会-004", { 開始: 実行日から(0, "00:00"), 申込: 申込済み })] });
seedOf("PAST-PAYING-005", { n: "005", ...F("005"), 大会: [通常("005", "前日決済中大会-005", { 申込: 決済中, デッキ提出: true, あとで: { 開始: 前日("10:00") } })] });
seedOf("FUTURE-PAYING-006", { n: "006", ...F("006"), 大会: [通常("006", "翌日決済中大会-006", { 申込: 決済中 })] });
seedOf("FUTURE-PAYING-007", { n: "007", ...F("007"), 大会: [通常("007", "翌日決済中大会-007", { 申込: 決済中 })] });
seedOf("FUTURE-NODECK-008", { n: "008", ...F("008"), 大会: [通常("008", "翌日申込完了大会-008", { 申込: 申込済み })] });
seedOf("DECK-ONLY-009", { n: "009", ...F("009"), 大会: [通常("009", "デッキのみ大会-009", { デッキ提出: true })] });
seedOf("DECK-ONLY-010", { n: "010", ...F("010"), 大会: [通常("010", "デッキのみ大会-010", { デッキ提出: true })] });
seedOf("DECK-ONLY-012", { n: "012", ...F("012"), 大会: [通常("012", "デッキのみ大会-012", { デッキ提出: true })] });
seedOf("FUTURE-NODECK-013", { n: "013", ...F("013"), 大会: [通常("013", "翌日申込完了大会-013", { 申込: 申込済み })] });
seedOf("PAST-PAYING-014", { n: "014", ...F("014"), 大会: [通常("014", "前日決済中大会-014", { 申込: 決済中, デッキ提出: true, あとで: { 開始: 前日("10:00") } })] });
seedOf("DEADLINE-015", { n: "015", ...F("015"), 大会: [通常("015", "締切超過大会-015", { 申込: 申込済み, デッキ提出: true, あとで: { 締切: 前日("23:59") } })] });
seedOf("CLOSED-016", { n: "016", ...F("016"), 大会: [通常("016", "登録終了大会-016", { 申込: 申込済み, デッキ提出: true, あとで: { デッキ登録を終了する: true } })] });
seedOf("DISABLED-017", { n: "017", ...F("017"), 大会: [通常("017", "デッキ対象外大会-017", { デッキ登録: false, 申込: 申込済み })] });
seedOf("EMPTY-019", { n: "019", ...F("019"), 大会: [] });
seedOf("FORMAT-020", { n: "020", ...F("020"), 大会: [通常("020", "複数フォーマット大会-020", { フォーマット: ["スタンダード", "モダン"], 申込: 申込済み })] });
seedOf("DECK-ONLY-023", { n: "023", ...F("023"), 大会: [通常("023", "デッキのみ大会-023", { デッキ提出: true })] });
seedOf("MIXED-031", {
  n: "031", ...D("031"),
  大会: [
    通常("031A", "申込大会F0614-031A", { 英名: "Apply Event F0614-031A", 開始: "2027-07-01 10:00", 申込: 申込済み }),
    通常("031B", "デッキのみ大会F0614-031B", { 英名: "Deck Only Event F0614-031B", 開始: "2027-07-02 10:00", デッキ提出: true }),
    通常("031C", "申込大会F0614-031C", { 英名: "Apply Event F0614-031C", 開始: "2027-07-03 10:00", 申込: 申込済み }),
  ],
});
seedOf("COUNT-032", {
  n: "032", ...D("032"),
  大会: [
    通常("032A", "件数確認大会F0614-032A", { 開始: "2027-07-10 10:00", 申込: 申込済み }),
    通常("032B", "件数確認大会F0614-032B", { 開始: "2027-07-11 10:00", 申込: 申込済み }),
    通常("032C", "件数確認キャンセル大会-032", { 開始: "2027-07-12 10:00", 申込: { 参加者: "本人", 状況: "キャンセル済み" } }),
  ],
});
seedOf("PAST-APPLIED-033", { n: "033", ...D("033"), 大会: [通常("033", "前日申込完了大会-033", { 申込: 申込済み, あとで: { 開始: 前日("10:00") } })] });
seedOf("ENGLISH-034", { n: "034", ...D("034"), 大会: [通常("034", "英語決済中大会-034", { 英名: "English Paying Event-F0614-034", 申込: 決済中 })] });
seedOf("ENGLISH-035", { n: "035", ...D("035"), 大会: [通常("035", "英語決済中大会-035", { 英名: "English Paying Event-F0614-035", 申込: 決済中 })] });
seedOf("ENGLISH-036", { n: "036", ...D("036"), 大会: [通常("036", "英語終了済み大会-036", { 英名: "English Finished Event-F0614-036", 申込: 申込済み, あとで: { 開始: 前日("10:00") } })] });
seedOf("CBAPPDECK-037", { n: "037", ...C("037"), 大会: [通常("037", "申込デッキ大会F0614-CB037", { 申込: 申込済み, デッキ提出: true })] });
seedOf("CBAPPONLY-038", { n: "038", ...C("038"), 大会: [通常("038", "申込のみ大会F0614-CB038", { 申込: 申込済み })] });
seedOf("CBNOAPPPAST-039", { n: "039", ...C("039"), 大会: [通常("039", "デッキのみ前日大会F0614-CB039", { デッキ提出: true, あとで: { 開始: 前日("10:00") } })] });
seedOf("CBSHOWDECK-041", { n: "041", ...C("041"), 大会: [通常("041", "デッキ項目表示大会F0614-CB041", { 申込: 申込済み })] });
seedOf("CBENDDECK-042", { n: "042", ...C("042"), 大会: [通常("042", "デッキ項目非表示終了大会F0614-CB042", { 申込: 申込済み, デッキ提出: true, あとで: { 開始: 前日("10:00") } })] });
