// 取り込み注記: 同じ機能の作り方を main 側も実装していたため、栗野側の版を別ファイルにした。main が登録済みのシードは登録しない（seeds/main_defined.ts）。
/**
 * M15-05 デッキ編集（管理画面）のシードの作り方（画面操作）。正本: cases/M15-05_seed_data.tsv
 *
 * - 試験管理者（m1505_admin）: メンバー管理で登録する。権限はデッキ管理を操作できる「システム管理者」（正本は権限の名前を定めない。M15-01 と同じ）。
 * - 編集者記録用の管理者（m1505_u064・u065・u098）: 正本の「このアカウントが最終更新者のデッキは他にない」を、同じDBで流し直しても
 *   成り立たせるため、ログインIDと名前に実行の印を付けて毎回作る（名前＝ログインID。デッキ一覧の「最終更新者」は名前で選ぶ）。
 * - 共有のフォーマット・カード・アーキタイプ・デッキタグは、正本の名前のまま（実行の印を付けない）。あれば記載の値へ戻して使う。
 * - カードの画像: カード編集画面の画像情報には画像を足す欄が無い（登録済みの画像の言語・表裏を変えるだけ）。カードは
 *   カードCSVアップロード（カード名・使用可能/使用禁止フォーマット・画像URL）で作り、画像は既存のカードの画像URLを、カードごとに違うものを使う。
 * - デッキ名（ケース専用）: 検索語に使える前半に実行の印を付ける（「M1505-005-デッキ」→「M1505-005-印-デッキ」）。
 *   ただし、ケースが文字数を確かめる値（047〜053・083・084）は正本の値のまま。
 */
import { Browser, Page, expect } from "@playwright/test";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { rc } from "../lib/run_marker";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";
import { 行を用意する } from "../pages/admin/m14_04_master";
import {
  アーキタイプを用意する, カードを用意する, デッキを登録する, デッキ内容, デッキ名で消す, デッキ名で検索する, デッキ編集画面, フォーマットを用意する,
} from "../pages/admin/m15_05_deck_edit";
import { adminUrl } from "../lib/session";
import { expectSaved } from "../pages/admin/common";
import { registerEvent } from "../pages/admin/event";
import { registerSchedule } from "../pages/admin/schedule";
import { デッキIDで検索する, デッキ一括編集 } from "../pages/admin/m15_04_bulk_edit";
import { 日付, 表示日付, プレイヤー名でデッキを探す } from "../pages/admin/f09_01_setup";
import { カードを登録する } from "../pages/admin/f09_04_setup";
import { その他デッキの対象のフォーマット } from "../pages/admin/f09_05_setup";

export const M1505_ADMIN: Account = { loginId: "m1505_admin", password: "Passw0rd!M1505" };

/** 編集者記録用の管理者（ログインIDに実行の印を付ける。名前＝ログインID） */
export const M1505_U = (n: "064" | "065" | "098"): Account => ({ loginId: rc(`m1505_u${n}`), password: M1505_ADMIN.password });

/** 正本のデッキ名に実行の印を付ける（「M1505-012-甲」→「M1505-012-印-甲」、「M1505-012」→「M1505-012-印」） */
export function 名(正本: string): string {
  const m = /^(M1505-[A-Z]*\d+)(.*)$/.exec(正本);
  if (!m) throw new Error(`デッキ名「${正本}」の形が想定と違う`);
  return `${rc(m[1])}${m[2]}`;
}

/** 共有のマスタの名前（正本の値のまま） */
export const 標準 = "デッキ試験標準", 上限 = "デッキ試験上限", 下限 = "デッキ試験下限", 単一 = "デッキ試験単一", 統率なし = "デッキ試験統率なし";
export const 型甲 = "デッキ試験型甲", 型乙 = "デッキ試験型乙", 型丙 = "デッキ試験型丙";
export const タグ一 = "試験タグ一", タグ二 = "試験タグ二";
export const ALPHA = "DeckTestAlpha", BETA = "DeckTestBeta", BANNED = "DeckTestBanned", OUT = "DeckTestOut";

/** 共有のカードの画像URL（カード名(英)→画像URL）。カードのシードが読む。同じ実行の中だけで持ち回す */
export const カード画像 = new Map<string, string>();

export const 管理画面 = <T>(browser: Browser, fn: (page: Page) => Promise<T>, 管理者: Account = M1505_ADMIN) =>
  withAdminSession(browser, 管理者, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });

export const 共通 = ["S-M15-05-ADM"];
export const マスタ = ["S-M15-05-ADM", "S-M15-05-FMT", "S-M15-05-CARD", "S-M15-05-ARC"];
function defineAdm2Seed(seedId: string, n: "064" | "065" | "098"): void {
  defineSeed(seedId, async ({ browser }) => {
    const a = M1505_U(n);
    await ensureM05Admin(browser, { 名前: a.loginId, account: a, メール: `${a.loginId.toLowerCase()}@example.test` });
  });
}

// ---- 新しいブラウザセッション（作るものは無い。ケースは新しいブラウザの状態でログインする） ----
function defineSessionSeed(seedId: string): void {
  defineSeed(seedId, async () => { /* ケースごとの新しいブラウザの状態で成り立つ */ });
}
defineSessionSeed("S-M15-05-SESS-001");
defineSessionSeed("S-M15-05-SESS-002");
defineSessionSeed("S-M15-05-SESS-003");
defineSessionSeed("S-M15-05-SESS-004");
defineSessionSeed("S-M15-05-SESS-014");
defineSessionSeed("S-M15-05-SESS-015");
defineSessionSeed("S-M15-05-SESS-016");
defineSessionSeed("S-M15-05-SESS-018");
defineSessionSeed("S-M15-05-SESS-019");
defineSessionSeed("S-M15-05-SESS-020");
defineSessionSeed("S-M15-05-SESS-021");
defineSessionSeed("S-M15-05-SESS-120");
defineSessionSeed("S-M15-05-SESS-121");
defineSessionSeed("S-M15-05-SESS-122");

// ---- デッキ（ケース専用） ----
const 基本: デッキ内容 = { デッキ種別: "event", フォーマット: 標準, アーキタイプ: 型甲, 公開状態: "非公開" };

/** 同じ名前のデッキが残っていないことを確かめて（残っていれば消して）から、デッキを登録して控える */
export async function 一件登録(page: Page, seedId: string, 正本名: string, 内容: デッキ内容, 実際の名 = 名(正本名)): Promise<string> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  await デッキ名で消す(page, 実際の名, issue);
  return デッキを登録する(page, { ...基本, デッキ名: 実際の名, ...内容 }, issue);
}

function defineDeckSeed(seedId: string, key: string, 内容: デッキ内容 = {}, needs: string[] = マスタ): void {
  defineSeed(seedId, { needs }, async ({ browser, notes }) => {
    await 管理画面(browser, async (page) => {
      notes.set(`〔デッキID-M1505-${key}〕`, await 一件登録(page, seedId, `M1505-${key}-デッキ`, 内容));
    });
  });
}

defineDeckSeed("S-M15-05-DECK-005", "005");
defineDeckSeed("S-M15-05-DECK-006", "006");
defineDeckSeed("S-M15-05-DECK-007", "007");
defineDeckSeed("S-M15-05-DECK-022", "022");
defineDeckSeed("S-M15-05-DECK-065", "065");
defineDeckSeed("S-M15-05-DECK-077", "077");
defineDeckSeed("S-M15-05-DECK-080", "080");
defineDeckSeed("S-M15-05-DECK-081", "081");
defineDeckSeed("S-M15-05-DECK-082", "082");
defineDeckSeed("S-M15-05-DECK-083", "083");
defineDeckSeed("S-M15-05-DECK-084", "084");
defineDeckSeed("S-M15-05-DECK-085", "085");
defineDeckSeed("S-M15-05-DECK-087", "087");
defineDeckSeed("S-M15-05-DECK-088", "088");
defineDeckSeed("S-M15-05-DECK-092", "092");
defineDeckSeed("S-M15-05-DECK-093", "093");
defineDeckSeed("S-M15-05-DECK-094", "094");
defineDeckSeed("S-M15-05-DECK-095", "095");
defineDeckSeed("S-M15-05-DECK-096", "096");
defineDeckSeed("S-M15-05-DECK-097", "097");
defineDeckSeed("S-M15-05-DECK-098", "098");
defineDeckSeed("S-M15-05-DECK-100", "100");
defineDeckSeed("S-M15-05-DECK-101", "101");
defineDeckSeed("S-M15-05-DECK-102", "102");
defineDeckSeed("S-M15-05-DECK-106", "106");
defineDeckSeed("S-M15-05-DECK-114", "114");
defineDeckSeed("S-M15-05-DECK-115", "115");
defineDeckSeed("S-M15-05-DECK-118", "118");

function defineDecksSeed(seedId: string, stem: string, 名と控え: [string, string | null][]): void {
  defineSeed(seedId, { needs: マスタ }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await 管理画面(browser, async (page) => {
      await デッキ名で消す(page, 名(stem), issue);
      for (const [正本名, 控え] of 名と控え) {
        const id = await デッキを登録する(page, { ...基本, デッキ名: 名(正本名) }, issue);
        if (控え) notes.set(控え, id);
      }
    });
  });
}
/** 12件。控えるのはシード表に名前で出てくる先頭（A）と末尾（L）だけ（間の B〜K はシード表に範囲でしか書かれない） */
const 十二件 = (stem: string, key: string): [string, string | null][] => Array.from({ length: 12 }, (_, i) => {
  const no = String(i + 1).padStart(2, "0");
  return [`${stem}-${no}`, i === 0 ? `〔デッキID-M1505-${key}A〕` : i === 11 ? `〔デッキID-M1505-${key}L〕` : null];
});

// ---- デッキが無い状態（ケース専用）: 検索して、残っていれば消して0件にする ----
function defineNoDeckSeed(seedId: string, 語: string, needs: string[] = 共通): void {
  defineSeed(seedId, { needs }, async ({ browser }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await 管理画面(browser, async (page) => {
      const n = await デッキ名で消す(page, 語, issue);
      if (n) issue(`前の実行の残りのデッキ ${n} 件を、デッキ編集画面の「削除」で消した（「${語}」）`);
      const l = await デッキ名で検索する(page, 語);
      if ((await l.表示されたID()).length) throw new Error(`「${語}」のデッキが0件にならない`);
    });
  });
}
defineNoDeckSeed("S-M15-05-NEWALL-039", 名("M1505-039"));
defineNoDeckSeed("S-M15-05-NEWREQ-040", 名("M1505-040"));
defineNoDeckSeed("S-M15-05-NEWREQ-041", 名("M1505-041"));
defineNoDeckSeed("S-M15-05-NEWREQ-042", 名("M1505-042"));
defineNoDeckSeed("S-M15-05-NEWREQ-043", 名("M1505-043"));
defineNoDeckSeed("S-M15-05-NEWREQ-044", 名("M1505-044"));
defineNoDeckSeed("S-M15-05-NEWREQ-045", 名("M1505-045"));
defineNoDeckSeed("S-M15-05-NEWREQ-046", 名("M1505-046"));
defineNoDeckSeed("S-M15-05-NEWREQ-054", 名("M1505-054"));
defineNoDeckSeed("S-M15-05-NEWREQ-055", 名("M1505-055"));
defineNoDeckSeed("S-M15-05-NEWREQ-056", 名("M1505-056"));
defineNoDeckSeed("S-M15-05-NEWREQ-060", 名("M1505-060"));
defineNoDeckSeed("S-M15-05-NEWREQ-061", 名("M1505-061"));
defineNoDeckSeed("S-M15-05-NEWREQ-064", 名("M1505-064"));
defineNoDeckSeed("S-M15-05-NEWREQ-112", 名("M1505-112"));
// 文字数を確かめるケースは、正本の値のまま（実行の印を付けない）
defineNoDeckSeed("S-M15-05-NEWREQ-047", "M1505-047");
defineNoDeckSeed("S-M15-05-NEWMAX-048", "M1505-048");
defineNoDeckSeed("S-M15-05-NEWMAX-049", "M1505-049");
defineNoDeckSeed("S-M15-05-NEWMAX-050", "M1505-050");
defineNoDeckSeed("S-M15-05-NEWMAX-051", "M1505-051");
defineNoDeckSeed("S-M15-05-NEWMAX-052", "M1505-052");
defineNoDeckSeed("S-M15-05-NEWMAX-053", "M1505-053");
defineNoDeckSeed("S-M15-05-CBNEWREQ-156", 名("M1505-CB156"));
defineNoDeckSeed("S-M15-05-CBNEWREQ-157", 名("M1505-CB157"));
defineNoDeckSeed("S-M15-05-CBNEWREQ-158", 名("M1505-CB158"));
defineNoDeckSeed("S-M15-05-CBNEWREQ-159", 名("M1505-CB159"));
defineNoDeckSeed("S-M15-05-CBNEWREQ-160", 名("M1505-CB160"));
defineNoDeckSeed("S-M15-05-CBNEWREQ-161", 名("M1505-CB161"));
defineNoDeckSeed("S-M15-05-CBNEWREQ-162", 名("M1505-CB162"));
defineNoDeckSeed("S-M15-05-CBNEWREQ-166", 名("M1505-CB166"));
defineNoDeckSeed("S-M15-05-CBNEWREQ-167", 名("M1505-CB167"));
defineNoDeckSeed("S-M15-05-CBNEWREQ-168", 名("M1505-CB168"));

defineSeed("S-M15-05-NEWREQ-135", { needs: 共通 }, async ({ browser }) => {
  const seedId = "S-M15-05-NEWREQ-135";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  await 管理画面(browser, async (page) => {
    await デッキ名で消す(page, 名("M1505-135"), issue);
    // カード一覧でカード名に「M1505-135」を入れて検索し、0件であることを確かめる
    await page.goto(adminUrl("/card"));
    await page.locator("#admin_search_card_multi").fill("M1505-135");
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), page.locator("#admin_search_form button[type=\"submit\"]").click()]);
    const zero = page.getByText(/^検索条件に合致するデータが見つかりませんでした$/);
    if (!(await zero.first().isVisible())) throw new Error("カード一覧で「M1505-135」を検索すると、カードがある（シード表は0件と定める）");
  });
});

// ---- 代表カードの検査用アーキタイプ（ケース専用） ----
export function defineArchetypeSeed(seedId: string, no: string, フォーマット: string, 代表カード: string | undefined): void {
  defineSeed(seedId, { needs: ["S-M15-05-ADM", "S-M15-05-FMT", "S-M15-05-CARD"] }, async ({ browser }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await 管理画面(browser, async (page) => {
      await アーキタイプを用意する(page, { 名日: 名(`M1505-CB${no}-型`), 名英: 名(`M1505-CB${no}-Type`), フォーマット, 代表カード, タグ: [] }, issue);
    });
  });
}
defineArchetypeSeed("S-M15-05-CBARC-159", "159", 単一, ALPHA);
defineArchetypeSeed("S-M15-05-CBARC-160", "160", 統率なし, ALPHA);
defineArchetypeSeed("S-M15-05-CBARC-161", "161", 上限, ALPHA);
defineArchetypeSeed("S-M15-05-CBARC-162", "162", 下限, ALPHA);
defineArchetypeSeed("S-M15-05-CBARC-166", "166", 標準, undefined);

// ---- イベント（ケース専用） ----
/**
 * イベントの開催店舗: 正本の「デッキ試験店舗」「登録済みの任意の店舗」のうち「デッキ試験店舗」は新しい店舗の登録（会社名・住所・
 * メールアドレスなど多数の必須項目）が要る。これらのケースは店舗の中身を確かめないので、試験管理者がイベント登録で選べる店舗の先頭で代える。
 * フォーマット・ルール適用度は選択肢の先頭（正本は任意の値と定める）。
 */
async function イベントの選択肢(page: Page): Promise<{ 店舗: string; 店舗の全部: string[]; フォーマット: string; ルール適用度: string }> {
  await page.goto(adminUrl("/event/create"));
  await page.waitForLoadState("load");
  const all = async (n: string) => {
    const labels = (await page.locator(`[name="admin_event[${n}]"] option, [name="admin_event[${n}][]"] option`).allInnerTexts()).map((t) => t.trim()).filter(Boolean);
    if (!labels.length) throw new Error(`イベント登録の選択肢（${n}）が無い`);
    return labels;
  };
  const 店舗の全部 = await all("baseInfo");
  return { 店舗: 店舗の全部[0], 店舗の全部, フォーマット: (await all("formats"))[0], ルール適用度: (await all("rel"))[0] };
}

/** イベントを登録し、日程（開始時間ごと）を足す。イベントIDと日程IDを返す。店舗を指定しなければ選択肢の先頭で代える */
async function イベントを作る(page: Page, seedId: string, v: { 名日: string; 名英: string; 開始時間: string[]; 店舗?: string }): Promise<{ イベントID: string; 日程ID: string[] }> {
  const 選 = await イベントの選択肢(page);
  const 店舗 = v.店舗 ?? 選.店舗;
  if (v.店舗 === undefined) reportSeedIssue(seedId, `イベント「${v.名日}」の開催店舗は「${選.店舗}」で代えた（正本の店舗を用意するには新しい店舗の登録が要り、このケースは店舗の中身を確かめない）。フォーマット「${選.フォーマット}」・ルール適用度「${選.ルール適用度}」は選択肢の先頭`);
  else reportSeedIssue(seedId, `イベント「${v.名日}」の開催店舗は「${店舗}」。フォーマット「${選.フォーマット}」・ルール適用度「${選.ルール適用度}」は選択肢の先頭`);
  const イベントID = await registerEvent(page, { イベント名日: v.名日, イベント名英: v.名英, 店舗, フォーマット: [選.フォーマット], ルール適用度: 選.ルール適用度, 公開状態: "非公開", 定員: "8", 参加費: "0" });
  const 日程ID: string[] = [];
  for (const t of v.開始時間) 日程ID.push(await registerSchedule(page, イベントID, { 開始時間: t, 受付あり: false, デッキ登録あり: false }));
  return { イベントID, 日程ID };
}

function defineEventPairSeed(seedId: string, no: string): void {
  defineSeed(seedId, { needs: 共通 }, async ({ browser }) => {
    await 管理画面(browser, async (page) => {
      await イベントを作る(page, seedId, { 名日: 名(`M1505-${no}-甲大会`), 名英: 名(`M1505-${no}-AlphaCup`), 開始時間: ["2026-03-10 10:00"] });
      await イベントを作る(page, seedId, { 名日: 名(`M1505-${no}-乙大会`), 名英: 名(`M1505-${no}-BetaCup`), 開始時間: ["2026-06-20 10:00"] });
    });
  });
}
defineEventPairSeed("S-M15-05-EVT-027", "027");
defineEventPairSeed("S-M15-05-EVT-028", "028");
defineEventPairSeed("S-M15-05-EVT-030", "030");
defineEventPairSeed("S-M15-05-EVT-031", "031");

// ---- デッキ連鎖試験（アーキタイプ管理の登録デッキ数）。名前は検索語に使える前半「RJ1505-00n」に実行の印を付ける ----
export const M1505_RJ: Account = { loginId: "m1505rj-adm", password: "Passw0rd-M1505RJ" };
export const RJ名 = (正本: string) => { const m = /^(RJ1505-\d+)(.*)$/.exec(正本); if (!m) throw new Error(`名前「${正本}」の形が想定と違う`); return `${rc(m[1])}${m[2]}`; };

defineSeed("S-M15-05-RJ-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M15-05連鎖試験管理者", account: M1505_RJ, メール: "m1505rj-adm@example.test" });
});

/** フォーマット（ランキング表示あり・メタ分布簡易化なし・メタゲーム分析日数 14）と、代表カードの無い公開のアーキタイプを作る */
async function RJのマスタ(page: Page, seedId: string, no: string, 並び順: string, 型: [string, string][]): Promise<string> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const fmt = RJ名(`RJ1505-${no}-フォーマット`);
  await フォーマットを用意する(page, { 名: fmt, 名英: RJ名(`RJ1505-${no}-Format`), 並び順, メタ日数: "14", ランキング表示: true, メタ分布簡易化: false, 統率を使う: false, ハイランダー: false }, issue);
  for (const [日, 英] of 型) await アーキタイプを用意する(page, { 名日: RJ名(日), 名英: RJ名(英), フォーマット: fmt, タグ: [] }, issue);
  return fmt;
}

defineSeed("S-M15-05-RJ-ARC-152", { needs: ["S-M15-05-RJ-ADM"] }, async ({ browser }) => {
  await 管理画面(browser, async (page) => {
    await RJのマスタ(page, "S-M15-05-RJ-ARC-152", "001", "9751", [["RJ1505-001-型", "RJ1505-001-Type"]]);
  }, M1505_RJ);
});

function defineRjDeckSeed(seedId: string, no: string, 並び順: string, 型: [string, string][], デッキ種別: string, label: string): void {
  defineSeed(seedId, { needs: ["S-M15-05-RJ-ADM"] }, async ({ browser, notes }) => {
    await 管理画面(browser, async (page) => {
      const fmt = await RJのマスタ(page, seedId, no, 並び順, 型);
      notes.set(label, await デッキを登録する(page, {
        デッキ名: RJ名(`RJ1505-${no}-デッキ`), デッキ種別, フォーマット: fmt, アーキタイプ: RJ名(型[0][0]), 公開状態: "非公開",
      }, (m) => reportSeedIssue(seedId, m)));
    }, M1505_RJ);
  });
}
defineRjDeckSeed("S-M15-05-RJ-DECK-153", "002", "9752", [["RJ1505-002-型", "RJ1505-002-Type"]], "user", "〔デッキID-M1505-RJ002〕");
defineRjDeckSeed("S-M15-05-RJ-DECK-154", "003", "9753", [["RJ1505-003-型", "RJ1505-003-Type"]], "event", "〔デッキID-M1505-RJ003〕");
defineRjDeckSeed("S-M15-05-RJ-DECK-155", "004", "9754", [["RJ1505-004-型甲", "RJ1505-004-TypeA"], ["RJ1505-004-型乙", "RJ1505-004-TypeB"]], "event", "〔デッキID-M1505-RJ004〕");

// ---- 連携試験（店頭のデッキリスト詳細）。名前は前半（「M15-05」「QM1505-00n」）に実行の印を付けて毎回作る（「前回の残りを消す」の代わり） ----
export const M1505_QM: Account = { loginId: "m1505qm-adm", password: "Passw0rd-M1505QM" };
export const QM名 = (正本: string) => { const m = /^(QM1505-\d+|M15-05)(.*)$/.exec(正本); if (!m) throw new Error(`名前「${正本}」の形が想定と違う`); return `${rc(m[1])}${m[2]}`; };

defineSeed("S-M15-05-QM-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M15-05連携試験の管理者", account: M1505_QM, メール: "m1505qm-adm@example.test" });
});

defineSeed("S-M15-05-QM-MASTER", { needs: ["S-M15-05-QM-ADM"] }, async ({ browser }) => {
  const issue = (m: string) => reportSeedIssue("S-M15-05-QM-MASTER", m);
  await 管理画面(browser, async (page) => {
    const fmt = QM名("M15-05-フォーマット");
    await フォーマットを用意する(page, { 名: fmt, 名英: rc("QM1505-Format"), 並び順: "9501", メタ日数: "14", ランキング表示: true, メタ分布簡易化: false, 統率を使う: false, ハイランダー: false }, issue);
    await アーキタイプを用意する(page, { 名日: QM名("M15-05-型"), 名英: rc("QM1505-Type"), フォーマット: fmt, タグ: [] }, issue);
  }, M1505_QM);
  issue("前回の残りは消さず、フォーマット・アーキタイプの名前に実行の印を付けて毎回作った（このフォーマットのデッキは1件も無い状態になる）。統率・ハイランダーのチェックは付けない（正本に記載なし・新規登録の初期値）");
});

function defineQmDeckSeed(seedId: string, no: string, label: string, 内容: デッキ内容): void {
  defineSeed(seedId, { needs: ["S-M15-05-QM-ADM", "S-M15-05-QM-MASTER"] }, async ({ browser, notes }) => {
    await 管理画面(browser, async (page) => {
      notes.set(label, await デッキを登録する(page, {
        デッキ種別: "event", フォーマット: QM名("M15-05-フォーマット"), アーキタイプ: QM名("M15-05-型"), 公開状態: "公開", デッキリスト非公開: false,
        プレイヤー名: QM名(`QM1505-${no}-選手`), 開催日: "2025/03/10 10:00", 順位: "1", ...内容,
      }, (m) => reportSeedIssue(seedId, m)));
    }, M1505_QM);
  });
}
defineQmDeckSeed("S-M15-05-QM-DECK-137", "002", "〔デッキID-M1505-002〕", {
  イベント名日: QM名("QM1505-002-大会旧"), イベント名英: QM名("QM1505-002-EventOld"), 成績: QM名("QM1505-002-成績旧"), 参加人数: "24",
  デッキ名: QM名("QM1505-002-デッキ旧"), 引用元URL: "https://example.com/qm1505-002-old",
});
defineQmDeckSeed("S-M15-05-QM-DECK-139", "004", "〔デッキID-M1505-004〕", {
  イベント名日: QM名("QM1505-004-大会"), イベント名英: QM名("QM1505-004-Event"), 成績: QM名("QM1505-004-成績"), 参加人数: "20", デッキ名: QM名("QM1505-004-デッキ"),
});

// ---- 代表カード検索用のカード（ケース専用） ----
defineSeed("S-M15-05-CARDS-037", { needs: 共通 }, async ({ browser }) => {
  const seedId = "S-M15-05-CARDS-037";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  await 管理画面(browser, async (page) => {
    const imgs = await カードを用意する(page, [
      { 名英: 名("M1505-037-Bolt"), 名日: 名("M1505-037-稲妻"), テキスト日: "M1505-037-赤い光", テキスト英: "M1505-037-RedLight" },
      { 名英: 名("M1505-037-Storm"), 名日: 名("M1505-037-稲妻の嵐"), テキスト日: "M1505-037-青い光", テキスト英: "M1505-037-BlueLight" },
    ], "M15-05 カードX・Y", issue);
    for (const [k, v] of imgs) カード画像.set(k, v);
  });
  issue("カード詳細の画面には画像を足す欄が無いため、カードX・YはカードCSVアップロードで作った（画像URL・カードセット・レアリティ・レイアウトは既存のカードの値）");
});

// ---- 2026-11-10 に足したもの（シード表の DB での準備・店舗の登録を、画面の操作か既存のデータに読み替えたもの） ----

/** 既存の店舗で代えたときの店舗名（シードID→店舗名の並び）。ケース専用のシードがケースの直前に入れ、ケースが読む（同じ実行の中だけ） */
export const 代えた店舗 = new Map<string, string[]>();

/** デッキ新規登録画面のイベント検索の画面を開き、「店舗」の選択肢を読む */
async function イベント検索の店舗の選択肢(page: Page): Promise<string[]> {
  await page.goto(adminUrl("/deck/new"));
  const e = new デッキ編集画面(page);
  await e.読み込みを待つ();
  await e.イベント検索ボタン.click();
  await expect(e.イベント検索画面, "イベント検索の画面").toBeVisible();
  return e.店舗の選択肢();
}

defineSeed("S-M15-05-DECKV-113", { needs: ["S-M15-05-ADM", "S-M15-05-FMT", "S-M15-05-ARC"] }, async ({ browser, notes }) => {
  const seedId = "S-M15-05-DECKV-113";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  await 管理画面(browser, async (page) => {
    const id = await 一件登録(page, seedId, "M1505-113-デッキ", { イベント名日: "", イベント名英: "", 開催日: "" });
    notes.set("〔デッキID-M1505-113〕", id);
    // 公開状態=公開は、デッキ編集画面ではイベント名・開催日が要る。デッキ一覧の一括編集で公開状態だけを変える
    const l = await デッキIDで検索する(page, id);
    const b = new デッキ一括編集(page);
    await b.デッキを選ぶ(l, id);
    await b.開く();
    await b.チェック("disp", true);
    await b.公開状態を選ぶ("公開");
    const r = await b.実行する();
    if (!r.成功.length) throw new Error(`一括編集で公開状態を公開にできない（${[...r.エラー, ...r.入力の不足].join(" / ")}）`);
    await page.goto(adminUrl(`/deck/${id}/edit`));
    const e = new デッキ編集画面(page);
    await e.読み込みを待つ();
    const disp = await e.選択中(e.公開状態);
    if (disp.join() !== "公開") throw new Error(`一括編集のあとの公開状態が公開でない（${disp.join("、")}）`);
    if ((await e.イベント名日.inputValue()) || (await e.イベント名英.inputValue()) || (await e.開催日.inputValue())) throw new Error("イベント名(日)・(英)・開催日が空でない");
  });
  issue("シード作成時の問題: 公開状態=公開を「DBへ直接設定」から、デッキ一覧の一括編集（公開状態(デッキ全体の公開設定)だけを「公開」に変える）に読み替えた。イベント名(日)・(英)・開催日は空のまま");
});

// セッションの有効期限切れの試験（127〜130）のデッキ。期限切れは、ケースの手順で待つ
const 型だけ = ["S-M15-05-ADM", "S-M15-05-FMT", "S-M15-05-ARC"];
defineDeckSeed("S-M15-05-DECK-127", "127", {}, 型だけ);
defineDeckSeed("S-M15-05-DECK-128", "128", {}, 型だけ);
defineDeckSeed("S-M15-05-DECK-129", "129", {}, 型だけ);
defineDeckSeed("S-M15-05-DECK-130", "130", {}, 型だけ);

// ---- 連携試験（店頭のデッキ検索）136・138・140〜143 ----

/** 開催日に入れる「実行日の5日前の10:00」（日本時間。「2026/05/10 13:30」の形） */
export const 五日前の10時 = () => `${表示日付(日付(-5))} 10:00`;

defineSeed("S-M15-05-QM-NODECK-136", { needs: ["S-M15-05-QM-ADM"] }, async ({ browser }) => {
  const seedId = "S-M15-05-QM-NODECK-136";
  await 管理画面(browser, async (page) => {
    const ids = await プレイヤー名でデッキを探す(page, QM名("QM1505-001-選手"));
    if (ids.length) throw new Error(`プレイヤー名「${QM名("QM1505-001-選手")}」のデッキがある（${ids.join("、")}）`);
  }, M1505_QM);
  reportSeedIssue(seedId, "プレイヤー名に実行の印を付けたので、前回の残りは消さずに、デッキ一覧のプレイヤー名の検索で0件であることを確かめた");
});

defineQmDeckSeed("S-M15-05-QM-DECK-138", "003", "〔デッキID-M1505-003〕", {
  イベント名日: QM名("QM1505-003-大会"), イベント名英: QM名("QM1505-003-Event"), 成績: QM名("QM1505-003-成績"), 参加人数: "20",
});

/** プレイヤー名が語を含むデッキを、デッキ編集画面の「削除」で1件ずつ消す。消した件数を返す */
async function プレイヤー名で消す(page: Page, 語: string): Promise<number> {
  let n = 0;
  for (let i = 0; i < 50; i++) {
    const ids = await プレイヤー名でデッキを探す(page, 語);
    if (!ids.length) return n;
    await page.goto(adminUrl(`/deck/${ids[0]}/edit`));
    const e = new デッキ編集画面(page);
    await e.読み込みを待つ();
    await e.削除する(true);
    const 帯 = await e.エラーの帯();
    if (帯.length) throw new Error(`デッキ（ID ${ids[0]}）を削除できない: ${帯.join(" / ")}`);
    n++;
  }
  throw new Error(`プレイヤー名「${語}」のデッキを50件消しても0件にならない`);
}

defineSeed("S-M15-05-QM-FMT-140", { needs: ["S-M15-05-QM-ADM"] }, async ({ browser }) => {
  const seedId = "S-M15-05-QM-FMT-140";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  await 管理画面(browser, async (page) => {
    // 前提（ほかに対象のフォーマットが無い）は、名前に実行の印を付けると流すたびに崩れる。正本の名前のまま作り、前回のデッキを消す
    const n = await プレイヤー名で消す(page, "QM1505-005-");
    if (n) issue(`前回の実行の残りのデッキ ${n} 件（プレイヤー名「QM1505-005-」）を、デッキ編集画面の「削除」で消した`);
    const fmt = "QM1505-005-フォーマット";
    await フォーマットを用意する(page, { 名: fmt, 名英: "QM1505-005-Format", 並び順: "9505", メタ日数: "14", ランキング表示: false, メタ分布簡易化: false, 統率を使う: false, ハイランダー: false }, issue);
    await アーキタイプを用意する(page, { 名日: "QM1505-005-型", 名英: "QM1505-005-Type", フォーマット: fmt, タグ: [] }, issue);
    const ほか = (await その他デッキの対象のフォーマット(page)).filter((f) => f !== fmt);
    if (ほか.length) {
      throw new Error(`ランキング表示もメタ分布簡易化もオフのフォーマットが、ほかに ${ほか.length} 件ある（${ほか.slice(0, 10).join("、")}${ほか.length > 10 ? "、…" : ""}）。`
        + "共有のフォーマットの設定は書き換えない・消さないので止めた（シード表は、ほかのフォーマットのデッキを消して、フォーマットを消すか「ランキング表示」をオンにすると定める）");
    }
  }, M1505_QM);
  issue("フォーマット・アーキタイプ・プレイヤー名は正本の名前のまま（実行の印を付けない）。統率・ハイランダーのチェックは付けない（正本に記載なし・新規登録の初期値）");
});

/** メタゲームの試験のフォーマット（メタゲーム分析日数30・メタ分布簡易化なし）と、アーキタイプを作る。フォーマットIDを返す */
async function QMのメタのマスタ(page: Page, issue: (m: string) => void, no: string, 並び順: string, ランキング表示: boolean, 型: [string, string][]): Promise<string> {
  const fmt = QM名(`QM1505-${no}-フォーマット`);
  const id = await フォーマットを用意する(page, { 名: fmt, 名英: QM名(`QM1505-${no}-Format`), 並び順, メタ日数: "30", ランキング表示, メタ分布簡易化: false, 統率を使う: false, ハイランダー: false }, issue);
  if (!id) throw new Error(`フォーマット「${fmt}」のフォーマットIDを読めない`);
  for (const [日, 英] of 型) await アーキタイプを用意する(page, { 名日: QM名(日), 名英: QM名(英), フォーマット: fmt, タグ: [] }, issue);
  return id;
}

/** メタゲームの試験のデッキ（大会デッキ・公開・デッキリスト公開・開催日は実行日の5日前の10:00・参加人数20） */
async function QMのメタのデッキ(page: Page, issue: (m: string) => void, no: string, 型: string, 選手: string, 順位: string, 成績: string, メイン?: string): Promise<string> {
  return デッキを登録する(page, {
    デッキ種別: "event", フォーマット: QM名(`QM1505-${no}-フォーマット`), アーキタイプ: QM名(型), 公開状態: "公開", デッキリスト非公開: false,
    プレイヤー名: QM名(選手), イベント名日: QM名(`QM1505-${no}-大会`), イベント名英: QM名(`QM1505-${no}-Event`), 開催日: 五日前の10時(),
    順位, 成績: QM名(成績), 参加人数: "20", ...(メイン !== undefined ? { メイン } : {}),
  }, issue);
}

function defineQmMetaSeed(seedId: string, no: string, 並び順: string, label: string): void {
  defineSeed(seedId, { needs: ["S-M15-05-QM-ADM"] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await 管理画面(browser, async (page) => {
      notes.set(label, await QMのメタのマスタ(page, issue, no, 並び順, true, [[`QM1505-${no}-型甲`, `QM1505-${no}-TypeA`], [`QM1505-${no}-型乙`, `QM1505-${no}-TypeB`]]));
      await QMのメタのデッキ(page, issue, no, `QM1505-${no}-型甲`, `QM1505-${no}-選手甲`, "1", `QM1505-${no}-成績甲`);
      await QMのメタのデッキ(page, issue, no, `QM1505-${no}-型乙`, `QM1505-${no}-選手乙`, "2", `QM1505-${no}-成績乙`);
    }, M1505_QM);
    issue("前回の残りは消さず、フォーマット・アーキタイプ・プレイヤー名などの名前に実行の印を付けて毎回作った（このフォーマットのデッキはこの2件だけになり、このフォーマットの店頭の画面は開いていない）");
  });
}
defineQmMetaSeed("S-M15-05-QM-META-141", "006", "9506", "〔フォーマットID-M1505-006〕");
defineQmMetaSeed("S-M15-05-QM-META-143", "008", "9508", "〔フォーマットID-M1505-008〕");

defineSeed("S-M15-05-QM-RANK-142", { needs: ["S-M15-05-QM-ADM"] }, async ({ browser, notes }) => {
  const seedId = "S-M15-05-QM-RANK-142";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  await 管理画面(browser, async (page) => {
    notes.set("〔フォーマットID-M1505-007〕", await QMのメタのマスタ(page, issue, "007", "9507", false, [["QM1505-007-型", "QM1505-007-Type"]]));
    // カードタイプ「クリーチャー」が無いときは共有のマスタへの追加になるので、足さずに止める（カードの登録が選択肢の無さで止まる）
    const カード = QM名("QM1505-007-カード");
    await カードを登録する(page, { 名日: カード, 名英: カード, カードタイプ: ["クリーチャー"] }, "M15-05 採用枚数ランキングのカード", issue);
    await QMのメタのデッキ(page, issue, "007", "QM1505-007-型", "QM1505-007-選手甲", "1", "QM1505-007-成績甲", `4 ${カード}`);
  }, M1505_QM);
  issue("前回の残りは消さず、フォーマット・アーキタイプ・カード・プレイヤー名などの名前に実行の印を付けて毎回作った。カードタイプ「クリーチャー」は既存のものを使った（無ければ止まる）");
});
