/**
 * M14-10 フォーマット詳細(登録・編集・削除) のシードの作り方（画面操作）。正本: cases/M14-10_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10）: テストデータは「既存データ または 画面から作ったデータ」に読み替えてよい。DB へは書き込まない。
 * 読み替えたことは、シードの報告（reportSeedIssue。ケースの注記「シード作成時の問題」に出る）に「読み替え: …」として残す。
 *
 * 作り方の決まり（シード表と違えたところ）:
 * - フォーマット・カード・アーキタイプ・デッキ・イベント・会員の名前は、決め打ちの識別の値なので末尾に実行の印を付けて作る（lib/run_marker.ts）。
 *   ケースの手順・期待結果の同じ名前も、印つきの名前として読む。値そのもの（文字数・最小値・最大値）を確かめる 015・018 の入力値には付けない。
 *   フォーマットコードは10文字までなので印を付けない（重複を確かめるケースは無い）。
 * - 「あれば削除して0件にする」（NEW-007・017・021、CBREGPASS-073）: 印つきの名前は実行ごとに新しいので、一覧に同じ名前の行が無いことを
 *   確かめるだけにする（あれば止める）。画面から何も消さない。
 * - 「識別子999999のフォーマットが0件」（ABSENT）: DBシードの代わりに、フォーマット詳細画面のアドレスの番号を 999999 にして開き、
 *   該当なし（404）になることを画面で確かめる。
 * - フォーマットコード「BEFORE_1-009」などの「画面で指定できないためDBへ直接設定する」は行わず、空のままにする（ケースはその値を確かめない）。
 * - 認定「M14-10試験認定」（CERT）: MTGマスターデータに値を足すと、ほかの機能の選択肢の数の確かめを壊すので足さない。
 *   認定の選択肢に「M14-10試験認定」があればそれを、無ければ既にある認定の先頭を使う（試験認定）。
 * - 既存フォーマットの退避（L-FMT-052・053）はDBでの準備なので行わない。ケースの期待結果は2件の名前の有無だけを見るので、
 *   ほかのフォーマットが残ったまま確かめる。
 * - 店舗「リンク試験店」（L-STORE）: 共有のマスタ（店舗）を足さないため、本店（店舗ID 1）に読み替える。
 * - 会員のログインID（m1410l_003 など）はDBでしか決められないので、ログインはメールアドレスで行う。
 * - 共有の環境の値を前提にする試験環境構築（QL-ENV）は、本店の日本語ページが開けることを確かめて使う。
 * - イベント・日程は、本店を編集できる試験管理者（システム管理者）で登録する。ルール適用度は、指定が無ければ選択肢の先頭。
 * - デッキの開催日の「試験基準日のn日前」は、実行日のn日前の 10:00。
 *
 * 作らないシード（ケースを実装しない）:
 * - DOWNSTREAM-030（カードセットをARENA対応にするのはDBでしか設定できず、ARENA対応のカードセットを画面で見分けられない）。
 * - DELETE-DECK-047（デッキ登録画面はアーキタイプが必須で、選んだフォーマットのアーキタイプしか選べない。
 *   「アーキタイプの紐づき0件でデッキ1件」を画面で作れない。M14-09 の 013・014 と同じ）。
 */
import { Browser, Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { rc, RUN_MARK } from "../lib/run_marker";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { expectSaved } from "../pages/admin/common";
import { registerEvent } from "../pages/admin/event";
import { 会員IDをメールから } from "../pages/admin/f07_04_setup";
import { 実行日から } from "../pages/admin/f07_01_setup";
import { 本店の店名 } from "../pages/admin/f04_setup";
import { ユーザーデッキを登録する } from "../pages/admin/f06_16_setup_k";
import { findFormat, カードを登録する, カード詳細IDs } from "../pages/admin/m14_card";
import { FormatListPage, アーキタイプを登録する, イベント登録の選択肢, フォーマット詳細の応答 } from "../pages/admin/m14_09_format_list";
import {
  フォーマットを作る, フォーマット項目, カードにリーガリティを足す, カード登録の選択肢, プレイヤー検索の結果, 別のセッションで, 認定の選択肢を読む,
} from "../pages/admin/m14_10_format_detail";
import { カードと商品を作る } from "../pages/admin/m12_deck_seed";
import { デッキを登録する } from "../pages/admin/m15_05_deck_edit";
import { registerSchedule } from "../pages/admin/schedule";
import { DeckEntryEditPage } from "../pages/front/f06_16_deck_entry_k";
import { registerFrontMember } from "../pages/front/member_entry";
import { ensureAnalysisAdmin } from "./m12-common";

export const M1410_ADMIN: Account = { loginId: "m1410_admin", password: "Passw0rd!M1410" };
export const M1410L_ADMIN: Account = { loginId: "m1410l_admin", password: "Passw0rd!M1410L" };
export const M1410QL_ADMIN: Account = { loginId: "m1410ql_admin", password: "Passw0rd-M1410QL" };

/** 正本の名前に実行の印を付けた値（ケースの手順・期待結果の同じ名前も、この値として読む） */
export const 名 = (正本の名前: string): string => rc(正本の名前);

/** 認定の選択肢から使う認定（CERT が決める。正本は「M14-10試験認定」） */
export let 試験認定 = "M14-10試験認定";

/** 本店の店舗ID（店舗一覧の番号。開発用・共有の環境とも 1） */
export const 本店の店舗ID = "1";

type Issue = (m: string) => void;
const 管理画面 = <T>(browser: Browser, fn: (page: Page) => Promise<T>, account: Account = M1410_ADMIN) =>
  withAdminSession(browser, account, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });

const 管理者 = ["S-M14-10-ADM"];

// ---------------------------------------------------------------------------
// 管理者・共有のもの
// ---------------------------------------------------------------------------

defineSeed("S-M14-10-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M14-10試験管理者", account: M1410_ADMIN, メール: "m1410_admin@example.test" });
});

defineSeed("S-M14-10-L-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M14-10リンク試験管理者", account: M1410L_ADMIN, メール: "m1410l_admin@example.test" });
});

defineSeed("S-M14-10-QL-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M14-10QL試験管理者", account: M1410QL_ADMIN, メール: "m1410ql_admin@example.test" });
});

defineSeed("S-M14-10-QL-ENV", async ({ browser, seed }) => {
  const status = await 別のセッションで(browser, BASE_URL, async (page) => (await page.goto(`${BASE_URL}/ja/`))?.status() ?? 0);
  if (status !== 200) throw new Error(`${seed.シードID}: 本店の日本語ページを開けない（応答 ${status}）`);
  reportSeedIssue(seed.シードID, "読み替え: 管理画面から登録できないマスタ値のDBシードは入れず、共有の環境にあるマスタ値をそのまま使った（本店の日本語ページが開けることを確かめた）");
});

defineSeed("S-M14-10-BASE-READ", async ({ browser, notes }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    let id = await findFormat(page, "編集前フォーマット");
    if (!id) {
      await page.goto(adminUrl("/format/new"));
      await page.waitForLoadState("load");
      const f = (n: string) => page.locator(`[name="admin_format[${n}]"]`);
      await f("nameJp").fill("編集前フォーマット");
      await f("nameEn").fill("Before Format");
      await f("code").fill("BEFORE_1");
      await f("rank").fill("50");
      await f("mainMaxCardCount").fill("60");
      await f("mainMinCardCount").fill("40");
      await f("sideMaxCardCount").fill("15");
      await f("sideMinCardCount").fill("0");
      await f("MetaRange").fill("14");
      await f("RuleJp").fill("編集前ルール");
      await f("RuleEn").fill("Before rule");
      await page.locator('button[type="submit"]').filter({ hasText: /^\s*(登録|新規登録)\s*$/ }).first().click();
      await expectSaved(page, "参照用基本フォーマットの登録");
      id = /\/format\/(\d+)\/edit/.exec(page.url())?.[1] ?? null;
      if (!id) throw new Error("参照用基本フォーマットの登録後のアドレスから番号を読めない");
    }
    notes.set("〔フォーマットID-M1410-共有A〕", id);
  });
});

/** 統率の設定を持つフォーマットを登録する（統率使用・統率メイン算入を選び、上限2・下限1）。登録後のフォーマットIDを返す */
async function 統率フォーマットを登録する(page: Page, 名日: string, 名英: string): Promise<string> {
  await page.goto(adminUrl("/format/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_format[${n}]"]`);
  await f("nameJp").fill(名日);
  await f("nameEn").fill(名英);
  await f("rank").fill("60");
  await f("MetaRange").fill("14");
  await f("useCommandFlg").check();
  await f("commanderInMain").check();
  await f("commandMaxCardCount").fill("2");
  await f("commandMinCardCount").fill("1");
  await page.locator('button[type="submit"]').filter({ hasText: /^\s*(登録|新規登録)\s*$/ }).first().click();
  await expectSaved(page, `統率フォーマット「${名日}」の登録`);
  const id = /\/format\/(\d+)\/edit/.exec(page.url())?.[1];
  if (!id) throw new Error("統率フォーマットの登録後のアドレスから番号を読めない");
  return id;
}

defineSeed("S-M14-10-COMMANDER-READ", async ({ browser, notes }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const found = await findFormat(page, "統率設定形式");
    notes.set("〔フォーマットID-M1410-共有B〕", found ?? await 統率フォーマットを登録する(page, "統率設定形式", "Commander Format"));
  });
});

defineSeed("S-M14-10-COMMANDER-042", async ({ browser, notes }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    notes.set("〔フォーマットID-M1410-042〕", await 統率フォーマットを登録する(page, rc("統率設定形式-042"), "Commander Format 042"));
  });
});

defineSeed("S-M14-10-ABSENT", { needs: 管理者 }, async ({ browser, seed }) => {
  const status = await 管理画面(browser, (page) => フォーマット詳細の応答(page, "999999"));
  if (status !== 404) throw new Error(`${seed.シードID}: フォーマット詳細画面のアドレスの番号を 999999 にして開いた応答が ${status}（該当なしの 404 にならない。識別子999999のフォーマットがある）`);
  reportSeedIssue(seed.シードID, "読み替え: DBシードの投入とDBでの件数の確認の代わりに、フォーマット詳細画面のアドレスの番号を 999999 にして開き、該当なし（404）になることを画面で確かめた");
});

// ---------------------------------------------------------------------------
// フォーマットだけのシード
// ---------------------------------------------------------------------------

/** フォーマットを1件作って控える */
function defineFormatSeed(seedId: string, 呼び名: string, v: () => フォーマット項目, 読み替え?: string): void {
  defineSeed(seedId, { needs: 管理者 }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    notes.set(呼び名, await 管理画面(browser, (page) => フォーマットを作る(page, { メタゲーム分析日数: "14", ...v() }, seedId, issue)));
    if (読み替え) issue(`読み替え: ${読み替え}`);
  });
}

const コード空 = (code: string) => `フォーマットコード「${code}」はDBへ直接設定せず、空のままにした（ケースはこの値を確かめない）`;

defineFormatSeed("S-M14-10-BASE-009", "〔フォーマットID-M1410-009〕", () => ({
  名日: 名("編集前フォーマット-009"), 名英: 名("Before Format-009"), 並び順: "50", メイン上限: "60", メイン下限: "40", サイド上限: "15", サイド下限: "0",
  ルール日: "編集前ルール-009", ルール英: "Before rule-009",
}), コード空("BEFORE_1-009"));
for (const n of ["014", "015", "022", "023"]) {
  defineFormatSeed(`S-M14-10-BASE-${n}`, `〔フォーマットID-M1410-${n}〕`, () => ({ 名日: 名(`編集前フォーマット-${n}`), 名英: 名(`Before Format-${n}`), 並び順: "50" }),
    n === "015" ? コード空("BEFORE_1-015") : undefined);
}
defineFormatSeed("S-M14-10-BASE-018", "〔フォーマットID-M1410-018〕", () => ({
  名日: 名("編集前フォーマット-018"), 名英: 名("Before Format-018"), 並び順: "50", メイン上限: "60", メイン下限: "40", サイド上限: "15", サイド下限: "0",
  ルール日: "編集前ルール-018", ルール英: "Before rule-018", 統率使用: false,
}), コード空("BEFORE_1-018"));
defineFormatSeed("S-M14-10-DOWNSTREAM-025", "〔フォーマットID-M1410-025〕", () => ({ 名日: 名("連携確認フォーマット-025"), 名英: 名("Integration Link Format-025"), コード: "LINK-025", 並び順: "70" }));
defineFormatSeed("S-M14-10-DOWNSTREAM-026", "〔フォーマットID-M1410-026〕", () => ({ 名日: 名("連携確認フォーマット-026"), 名英: 名("Integration Link Format-026"), コード: "LINK-026", 並び順: "70" }));
const 統率2と1 = { 統率使用: true, 統率メイン算入: true, 統率上限: "2", 統率下限: "1" };
defineFormatSeed("S-M14-10-COMMANDER-041", "〔フォーマットID-M1410-041〕", () => ({ 名日: 名("統率設定形式-041"), 名英: 名("Commander Format-041"), 並び順: "60", ...統率2と1 }));
defineFormatSeed("S-M14-10-NOFIELD-056", "〔フォーマットID-M1410-056〕", () => ({ 名日: 名("項目除去確認M1410-056"), 名英: 名("Removal Check M1410-056"), 並び順: "60" }));
defineFormatSeed("S-M14-10-DPUPD-070", "〔フォーマットID-M1410-070〕", () => ({ 名日: 名("編集前フォーマット-070"), 名英: 名("M1410-070-Fmt"), 並び順: "50" }));
defineFormatSeed("S-M14-10-CBCMDKEEP-071", "〔フォーマットID-M1410-071〕", () => ({ 名日: 名("統率維持形式-M1410CB071"), 名英: 名("Cmd Keep M1410CB071"), 並び順: "60", ...統率2と1 }));
defineSeed("S-M14-10-QL-RANK-061", { needs: ["S-M14-10-QL-ADM"] }, async ({ browser, notes, seed }) => {
  const fmt = 名("MetaHeadBefore-M1410QL004");
  notes.set("〔フォーマットID-M1410-004〕", await 管理画面(browser, (page) => フォーマットを作る(page, { 名日: fmt, 名英: fmt, 並び順: "5307", メタゲーム分析日数: "14", ランキング: true }, seed.シードID, (m) => reportSeedIssue(seed.シードID, m)), M1410QL_ADMIN));
});

/** 「あれば削除して0件にする」: 印つきの名前の行が一覧に無いことを確かめる（消さない） */
function defineAbsentNameSeed(seedId: string, 名前: string[]): void {
  defineSeed(seedId, { needs: 管理者 }, async ({ browser }) => {
    await 管理画面(browser, async (page) => {
      const list = new FormatListPage(page);
      await list.open();
      const rows = await list.行();
      for (const n of 名前) {
        const hit = rows.filter((r) => r.フォーマット名.includes(n) || r.略称 === n);
        if (hit.length) throw new Error(`${seedId}: フォーマット一覧に「${n}」の行がある（${hit.map((r) => r.フォーマットID).join("、")}）。同じ実行の印で流し直したので、印を変えて流す`);
      }
    });
    reportSeedIssue(seedId, `読み替え: 「あれば削除する」は、実行の印つきの名前（${名前.join("・")}）の行がフォーマット一覧に無いことを確かめるだけにした（何も削除していない）`);
  });
}
defineAbsentNameSeed("S-M14-10-NEW-007", [名("結合形式A"), 名("Integration Format A")]);
defineAbsentNameSeed("S-M14-10-NEW-017", [名("任意空フォーマット"), 名("Optional Empty Format")]);
defineAbsentNameSeed("S-M14-10-NEW-021", [名("トークン欠落形式"), 名("Missing Token Format")]);
defineAbsentNameSeed("S-M14-10-CBREGPASS-073", [名("登録通過形式-M1410CB073"), 名("Reg Pass M1410CB073")]);

defineSeed("S-M14-10-SORT-024", { needs: 管理者 }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 管理画面(browser, async (page) => {
    for (const [x, 名日, 名英, 並び順] of [["A", "並び順10形式-024", "Sort 10 Format-024", "10"], ["B", "編集前フォーマット-024", "Before Format-024", "50"], ["C", "並び順30形式-024", "Sort 30 Format-024", "30"]]) {
      notes.set(`〔フォーマットID-M1410-024${x}〕`, await フォーマットを作る(page, { 名日: 名(名日), 名英: 名(名英), 並び順, メタゲーム分析日数: "14", デッキ検索: true }, seed.シードID, issue));
    }
    const ids = await new FormatListPage(page).行のフォーマットID();
    for (const x of ["A", "B", "C"]) if (!ids.includes(notes.get(`〔フォーマットID-M1410-024${x}〕`))) throw new Error(`${seed.シードID}: 登録したフォーマット ${x} が管理画面のフォーマット一覧に無い`);
  });
  issue(`読み替え: ${コード空("BEFORE_1-024")}`);
});

// ---------------------------------------------------------------------------
// カード・アーキタイプ・デッキ（シード用の小さな手続き）
// ---------------------------------------------------------------------------

/** この実行で作ったデッキ（キーはケース番号。シード表が控えると定めないデッキIDを、ケースが開くのに使う） */
export const デッキ一覧 = new Map<string, string>();
export function デッキ(n: string): string {
  const d = デッキ一覧.get(n);
  if (!d) throw new Error(`ケース ${n} のデッキを、この実行のシードが作っていない`);
  return d;
}

/** 実行日の n 日前（負なら後）の 10:00（デッキの開催日の欄に入れる形） */
const 日前 = (n: number) => 実行日から(-n, "10:00");

/** カード詳細(登録)のカードタイプの選択肢から、土地でないものの先頭と「土地」、特殊タイプの「基本」の表示名を読む */
let 型: { 土地以外: string; 土地: string; 基本: string } | null = null;
async function カードの型(page: Page): Promise<{ 土地以外: string; 土地: string; 基本: string }> {
  if (型) return 型;
  const types = await カード登録の選択肢(page, "cardtypes");
  const specials = await カード登録の選択肢(page, "specialtypes");
  const 土地 = types.find((t) => /(^|\/\s*)土地(\s*\/|$)/.test(t));
  const 土地以外 = types.find((t) => !/土地|Land/i.test(t));
  const 基本 = specials.find((t) => /(^|\/\s*)基本(\s*\/|$)/.test(t));
  if (!土地 || !土地以外 || !基本) throw new Error(`カードタイプ・特殊タイプの選択肢から「土地」「土地以外」「基本」を見つけられない（${types.join("、")} / ${specials.join("、")}）`);
  return (型 = { 土地以外, 土地, 基本 });
}

/** カードを1件登録する（詳細情報なし）。カードIDを返す */
async function カードを作る(page: Page, v: { 日: string; 英: string; 型?: "土地以外" | "基本土地"; リーガリティ?: { フォーマット: string; リーガリティ: string }[] }, what: string, issue: Issue): Promise<string> {
  const t = v.型 ? await カードの型(page) : null;
  return カードを登録する(page, {
    カード名日: v.日, カード名英: v.英, 点数で見たマナ: "0",
    カードタイプ: t ? [v.型 === "基本土地" ? t.土地 : t.土地以外] : undefined, 特殊タイプ: t && v.型 === "基本土地" ? [t.基本] : undefined,
    リーガリティ: v.リーガリティ, 詳細: false,
  }, `${what} のカード「${v.日}」`, issue);
}

/** イベント用（event）・公開のデッキを登録する。デッキIDを返す */
async function 公開デッキを作る(page: Page, v: { デッキ名: string; フォーマット: string; アーキタイプ: string; 開催日: string; メイン?: string; イベント名?: string }, issue: Issue): Promise<string> {
  return デッキを登録する(page, {
    デッキ名: v.デッキ名, デッキ種別: "event", フォーマット: v.フォーマット, アーキタイプ: v.アーキタイプ, 公開状態: "公開",
    イベント名日: v.イベント名 ?? `${v.デッキ名}大会`, イベント名英: `${RUN_MARK} Event`, 開催日: v.開催日, メイン: v.メイン,
  }, issue);
}

/** フォーマット・公開のアーキタイプ・3日前の公開デッキ1件（ランキング表示・メタ分布の確かめ） */
function defineRankingSeed(seedId: string, n: string, 名英: string, アーキ名: string, アーキ英: string, デッキ名: string, イベント名?: string): void {
  defineSeed(seedId, { needs: 管理者 }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await 管理画面(browser, async (page) => {
      const fmt = 名(`連携確認フォーマット-${n}`);
      notes.set(`〔フォーマットID-M1410-${n.replace("CB", "")}〕`, await フォーマットを作る(page, { 名日: fmt, 名英: 名(名英), 並び順: "70", メタゲーム分析日数: "14" }, seedId, issue));
      await アーキタイプを登録する(page, { 名日: 名(アーキ名), 名英: 名(アーキ英), 公開状態: "公開", フォーマット: fmt }, seedId, issue);
      await 公開デッキを作る(page, { デッキ名: 名(デッキ名), フォーマット: fmt, アーキタイプ: 名(アーキ名), 開催日: 日前(3), イベント名: イベント名 && 名(イベント名) }, issue);
    });
  });
}
defineRankingSeed("S-M14-10-DOWNSTREAM-027", "027", "Integration Link Format-027", "連携確認アーキタイプ-027", "Integration Link Archetype 027", "連携確認デッキ-027");
defineRankingSeed("S-M14-10-DOWNSTREAM-028", "028", "Integration Link Format-028", "連携確認アーキタイプ-028", "Integration Link Archetype 028", "連携確認デッキ-028");
defineRankingSeed("S-M14-10-DOWNSTREAM-029", "029", "Integration Link Format-029", "連携確認アーキタイプ-029", "Integration Link Archetype 029", "連携確認デッキ-029");
defineRankingSeed("S-M14-10-DPRANK-063", "063", "M1410-063-Fmt", "連携確認アーキタイプ-063", "M1410-063-Arch", "連携確認デッキ-063", "連携イベント-063");
defineRankingSeed("S-M14-10-CBRANKMETA-075", "CB075", "M1410-CB075-Fmt", "連携確認アーキタイプ-CB075", "M1410-CB075-Arch", "連携確認デッキ-CB075", "連携イベント-CB075");

/** 分析日数の確かめ（036・037）: 3日前のデッキに分析内カード4枚、30日前のデッキに分析外カード40枚 */
function defineAnalyticsCardSeed(seedId: string, n: string): void {
  defineSeed(seedId, { needs: 管理者 }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await 管理画面(browser, async (page) => {
      const fmt = 名(`連携確認フォーマット-${n}`);
      notes.set(`〔フォーマットID-M1410-${n}〕`, await フォーマットを作る(page, { 名日: fmt, 名英: 名(`Integration Link Format-${n}`), 並び順: "70", メタゲーム分析日数: "14" }, seedId, issue));
      await カードを作る(page, { 日: 名(`分析内カード-${n}`), 英: 名(`Analysis In Card ${n}`), 型: "土地以外" }, seedId, issue);
      await カードを作る(page, { 日: 名(`分析外カード-${n}`), 英: 名(`Analysis Out Card ${n}`), 型: "土地以外" }, seedId, issue);
      const arch = 名(`連携確認アーキタイプ-${n}`);
      await アーキタイプを登録する(page, { 名日: arch, 名英: 名(`Integration Link Archetype ${n}`), 公開状態: "公開", フォーマット: fmt }, seedId, issue);
      await 公開デッキを作る(page, { デッキ名: 名(`分析内デッキ-${n}`), フォーマット: fmt, アーキタイプ: arch, 開催日: 日前(3), メイン: `4 ${名(`分析内カード-${n}`)}` }, issue);
      await 公開デッキを作る(page, { デッキ名: 名(`分析外デッキ-${n}`), フォーマット: fmt, アーキタイプ: arch, 開催日: 日前(30), メイン: `40 ${名(`分析外カード-${n}`)}` }, issue);
    });
  });
}
defineAnalyticsCardSeed("S-M14-10-ANALYTICS-036", "036");
defineAnalyticsCardSeed("S-M14-10-ANALYTICS-037", "037");

/** ハイランダーの確かめ（039・065〜067）: フォーマット・カード（このフォーマットで使用可）・公開のアーキタイプ */
function defineHighlanderSeed(seedId: string, n: string, 名英: string, カード: { 日: string; 英: string; 基本土地?: boolean }[], アーキ: { 日: string; 英: string }, 読み替え?: string): void {
  defineSeed(seedId, { needs: 管理者 }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await 管理画面(browser, async (page) => {
      const fmt = 名(`連携確認フォーマット-${n}`);
      notes.set(`〔フォーマットID-M1410-${n}〕`, await フォーマットを作る(page, { 名日: fmt, 名英: 名(名英), 並び順: "70", メタゲーム分析日数: "14", ハイランダー: false }, seedId, issue));
      for (const c of カード) {
        if (c.基本土地) {
          await カードを登録する(page, { カード名日: 名(c.日), カード名英: 名(c.英), 点数で見たマナ: "0", リーガリティ: [{ フォーマット: fmt, リーガリティ: "使用可" }], 詳細: { レアリティ: "基本土地" } }, `${seedId} のカード「${c.日}」`, issue);
        } else {
          await カードを作る(page, { 日: 名(c.日), 英: 名(c.英), 型: "土地以外", リーガリティ: [{ フォーマット: fmt, リーガリティ: "使用可" }] }, seedId, issue);
        }
      }
      await アーキタイプを登録する(page, { 名日: 名(アーキ.日), 名英: 名(アーキ.英), 公開状態: "公開", フォーマット: fmt }, seedId, issue);
    });
    if (読み替え) issue(`読み替え: ${読み替え}`);
  });
}
defineHighlanderSeed("S-M14-10-DOWNSTREAM-039", "039", "Integration Link Format-039", [{ 日: "重複試験カード-039", 英: "Duplicate Test Card 039" }],
  { 日: "連携確認アーキタイプ-039", 英: "Integration Link Archetype 039" },
  "デッキ登録画面はアーキタイプが必須なので、シード表に無いアーキタイプ「連携確認アーキタイプ-039」（公開・このフォーマット）を登録した");
defineHighlanderSeed("S-M14-10-DPHL-065", "065", "M1410-065-Fmt", [{ 日: "単独試験カードA-065", 英: "M1410-065-CardA" }, { 日: "単独試験カードB-065", 英: "M1410-065-CardB" }],
  { 日: "連携確認アーキタイプ-065", 英: "M1410-065-Arch" });
defineHighlanderSeed("S-M14-10-DPHL-066", "066", "M1410-066-Fmt", [{ 日: "重複試験カード-066", 英: "M1410-066-CardX" }], { 日: "連携確認アーキタイプ-066", 英: "M1410-066-Arch" });
defineHighlanderSeed("S-M14-10-DPHL-067", "067", "M1410-067-Fmt", [{ 日: "重複基本土地-067", 英: "M1410-067-CardX", 基本土地: true }], { 日: "連携確認アーキタイプ-067", 英: "M1410-067-Arch" });

// ---------------------------------------------------------------------------
// 削除（禁止・制限の指定・大会・アーキタイプの紐づき）
// ---------------------------------------------------------------------------

/** 削除可能形式: フォーマットと、禁止カード1件・制限カード1件（043〜045・050・051） */
function defineDeletableSeed(seedId: string, n: string): void {
  defineSeed(seedId, { needs: 管理者 }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await 管理画面(browser, async (page) => {
      const fmt = 名(`削除可能形式-${n}`);
      notes.set(`〔フォーマットID-M1410-${n}〕`, await フォーマットを作る(page, { 名日: fmt, 名英: 名(`Deletable Format-${n}`), 並び順: "80", メタゲーム分析日数: "14" }, seedId, issue));
      await カードを作る(page, { 日: 名(`禁止カード-${n}`), 英: 名(`Banned Card ${n}`), リーガリティ: [{ フォーマット: fmt, リーガリティ: "禁止" }] }, seedId, issue);
      await カードを作る(page, { 日: 名(`制限カード-${n}`), 英: 名(`Restricted Card ${n}`), リーガリティ: [{ フォーマット: fmt, リーガリティ: "制限" }] }, seedId, issue);
    });
  });
}
for (const n of ["043", "044", "045", "050", "051"]) defineDeletableSeed(`S-M14-10-DELETE-FREE-${n}`, n);

/** 大会使用中形式（046・049）: フォーマットと、そのフォーマットだけを選んだ公開のイベント */
function defineTournamentSeed(seedId: string, n: string): void {
  defineSeed(seedId, { needs: 管理者 }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await 管理画面(browser, async (page) => {
      const fmt = 名(`大会使用中形式-${n}`);
      notes.set(`〔フォーマットID-M1410-${n}〕`, await フォーマットを作る(page, { 名日: fmt, 名英: 名(`Tournament Format-${n}`), 並び順: "81", メタゲーム分析日数: "14" }, seedId, issue));
      await イベントを作る(page, { 名日: 名(`削除制約大会-${n}`), 名英: 名(`Delete Restricted Event ${n}`), フォーマット: [fmt] }, issue);
    });
  });
}
defineTournamentSeed("S-M14-10-DELETE-TOURNAMENT-046", "046");
defineTournamentSeed("S-M14-10-DELETE-TOURNAMENT-049", "049");

// ---------------------------------------------------------------------------
// イベント（フロントのイベント一覧・大会デッキ登録）
// ---------------------------------------------------------------------------

let 適用度: string | null = null;
/** 本店の公開のイベントを登録する（定員16・参加費500。ルール適用度は指定が無ければ選択肢の先頭）。イベントIDを返す */
async function イベントを作る(page: Page, v: { 名日: string; 名英: string; フォーマット: string[]; ルール適用度?: string }, issue: Issue): Promise<string> {
  const 店舗 = await 本店の店名(page.context().browser()!);
  if (!v.ルール適用度 && !適用度) {
    [適用度] = await イベント登録の選択肢(page, "rel");
    if (!適用度) throw new Error("イベント登録のルール適用度の選択肢が無い");
  }
  const id = await registerEvent(page, {
    イベント名日: v.名日, イベント名英: v.名英, 店舗, フォーマット: v.フォーマット, ルール適用度: v.ルール適用度 ?? 適用度!, 公開状態: "公開", 定員: "16", 参加費: "500",
  });
  issue(`イベント「${v.名日}」は本店（${店舗}）・ルール適用度「${v.ルール適用度 ?? 適用度}」・定員16・参加費500で登録した（指定の無い値は任意）`);
  return id;
}

/** 公開のイベントと、30日後10:00開始の公開の日程（イベント一覧で開催期間内に出る） */
async function イベントと日程を作る(page: Page, v: { 名日: string; 名英: string; フォーマット: string[] }, issue: Issue): Promise<{ イベントID: string; 日程ID: string }> {
  const イベントID = await イベントを作る(page, v, issue);
  const 日程ID = await registerSchedule(page, イベントID, { 開始時間: 実行日から(30, "10:00"), 受付あり: false, デッキ登録あり: false, 公開状態: "公開" });
  return { イベントID, 日程ID };
}

/** 2つのフォーマット（イベントに表示の指定つき）と、それぞれだけを選んだイベント（034・035・057） */
function defineEventsSeed(seedId: string, n: string, f1: { 名日: string; 名英: string; 並び順: string; 表示: boolean }, f2: { 名日: string; 名英: string; 並び順: string }, e1: string, e2: string): void {
  defineSeed(seedId, { needs: 管理者 }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await 管理画面(browser, async (page) => {
      notes.set(`〔フォーマットID-M1410-${n}A〕`, await フォーマットを作る(page, { 名日: 名(f1.名日), 名英: 名(f1.名英), 並び順: f1.並び順, メタゲーム分析日数: "14", イベント: f1.表示 }, seedId, issue));
      notes.set(`〔フォーマットID-M1410-${n}B〕`, await フォーマットを作る(page, { 名日: 名(f2.名日), 名英: 名(f2.名英), 並び順: f2.並び順, メタゲーム分析日数: "14", イベント: false }, seedId, issue));
      await イベントと日程を作る(page, { 名日: 名(e1), 名英: 名(`${n} Event A`), フォーマット: [名(f1.名日)] }, issue);
      await イベントと日程を作る(page, { 名日: 名(e2), 名英: 名(`${n} Event B`), フォーマット: [名(f2.名日)] }, issue);
    });
    issue("日程の開始時間は、実行日の30日後の10:00（開催期間内として、イベント一覧の既定の検索に出る日時）");
  });
}
defineEventsSeed("S-M14-10-EVENTS-034", "034", { 名日: "連携確認フォーマット-034", 名英: "Integration Link Format-034", 並び順: "70", 表示: false },
  { 名日: "イベント非表示フォーマット-034", 名英: "Hidden Event Format-034", 並び順: "71" }, "連携イベントA-034", "連携イベントB-034");
defineEventsSeed("S-M14-10-EVENTS-035", "035", { 名日: "連携確認フォーマット-035", 名英: "Integration Link Format-035", 並び順: "70", 表示: false },
  { 名日: "イベント非表示フォーマット-035", 名英: "Hidden Event Format-035", 並び順: "71" }, "連携イベントA-035", "連携イベントB-035");

defineSeed("S-M14-10-QL-EVENT-060", { needs: ["S-M14-10-QL-ADM"] }, async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const issue = (m: string) => reportSeedIssue(id, m);
  await 管理画面(browser, async (page) => {
    const fmt = 名("BeforeEvtFmt-M1410QL003");
    notes.set("〔フォーマットID-M1410-003〕", await フォーマットを作る(page, { 名日: fmt, 名英: fmt, 並び順: "5306", メタゲーム分析日数: "14", イベント: true }, id, issue));
    const イベントID = await イベントを作る(page, { 名日: 名("連携イベント-M1410QL003"), 名英: 名("M1410QL003-Event"), フォーマット: [fmt], ルール適用度: "カジュアル対戦" }, issue);
    await registerSchedule(page, イベントID, { 開始時間: 実行日から(30, "10:00"), 受付あり: false, デッキ登録あり: false, 公開状態: "公開", 定員: "16", 参加費: "500" });
  }, M1410QL_ADMIN);
  issue("「同じ日に開催する他のイベントなし」は共有の環境では決められない（ケースは名前で自分のイベントを探す）");
});

// ---------------------------------------------------------------------------
// 会員（フロント）と大会デッキ登録
// ---------------------------------------------------------------------------

type 作った会員 = { メール: string; パスワード: string; 会員ID: string; 選手ID: string; 検索語: string };
/** この実行で作った会員（キーはケース番号） */
export const 会員一覧 = new Map<string, 作った会員>();
export function 会員(n: string): 作った会員 {
  const m = 会員一覧.get(n);
  if (!m) throw new Error(`ケース ${n} の会員を、この実行のシードが作っていない`);
  return m;
}
/** この実行で作った大会の日程（キーはケース番号） */
export const 日程一覧 = new Map<string, string>();
export function 日程(n: string): string {
  const d = 日程一覧.get(n);
  if (!d) throw new Error(`ケース ${n} の日程を、この実行のシードが作っていない`);
  return d;
}

/**
 * フロントの新規会員登録で会員を作り（本登録のメールを読めない環境では管理画面で本会員にする）、会員IDと選手IDを読む。
 * 選手IDは、管理画面のデッキ登録のプレイヤー検索で、お名前(名)の末尾に付けた語で1人に絞って読む（DBは読まない）。
 */
async function 会員を作る(browser: Browser, seedId: string, n: string, v: { 前半: string; パスワード: string; 英姓?: string; 英名?: string }, account: Account): Promise<作った会員> {
  const メール = `${rc(v.前半)}@example.test`.toLowerCase();
  const 検索語 = `M1410${n}${RUN_MARK}`.replace(/[^0-9A-Za-z]/g, "");
  await 別のセッションで(browser, BASE_URL, (page) => registerFrontMember(page, {
    姓: "試験", 名: `太郎${検索語}`, セイ: "シケン", メイ: "タロウ", メール, パスワード: v.パスワード, MTG姓: v.英姓, MTG名: v.英名,
  }));
  const r = await 管理画面(browser, async (page) => {
    const 会員ID = await 会員IDをメールから(page, メール);
    const rows = (await プレイヤー検索の結果(page, 検索語)).filter((x) => x.行の文.includes(検索語));
    if (rows.length !== 1) throw new Error(`${seedId}: プレイヤー検索「${検索語}」で選手が1人に絞れない（${rows.length}件）`);
    return { 会員ID, 選手ID: rows[0].選手ID };
  }, account);
  reportSeedIssue(seedId, `会員 ${メール} はフロントの新規会員登録で作り、選手IDは管理画面のデッキ登録のプレイヤー検索で「${検索語}」（お名前(名)の末尾に付けた語）を検索して読んだ`);
  const made = { メール, パスワード: v.パスワード, ...r, 検索語 };
  会員一覧.set(n, made);
  return made;
}

/** 会員としてフロントにログインし、日程の大会デッキ登録編集画面を開けることを確かめる */
async function デッキ登録編集を開ける(browser: Browser, seedId: string, m: 作った会員, 日程ID: string): Promise<void> {
  await 別のセッションで(browser, BASE_URL, async (page) => {
    const d = new DeckEntryEditPage(page);
    await d.ログインする(m.メール, m.パスワード);
    const status = await d.開く(日程ID);
    if (status !== 200 || !(await d.編集画面である())) throw new Error(`${seedId}: 会員 ${m.メール} で大会デッキ登録編集画面（日程 ${日程ID}）を開けない（応答 ${status}・${d.path}）`);
  });
}

/** 受付期間内・デッキ登録締切前の日程（30日後開催・オンライン受付は昨日から20日後まで・デッキ登録締切は20日後） */
const 受付中の日程 = () => ({
  開始時間: 実行日から(30, "10:00"), 受付あり: false, デッキ登録あり: true, デッキ登録締切: 実行日から(20, "23:59"),
  オンライン受付: { 開始: 実行日から(-1, "00:00"), 終了: 実行日から(20, "23:59") }, 公開状態: "公開",
});

// ---- リンク試験（052〜055） ----

defineSeed("S-M14-10-L-STORE", { needs: ["S-M14-10-L-ADM"] }, async ({ browser, notes, seed }) => {
  const 店名 = await 本店の店名(browser);
  const opts = await 管理画面(browser, (page) => イベント登録の選択肢(page, "baseInfo"), M1410L_ADMIN);
  if (!opts.includes(店名)) throw new Error(`${seed.シードID}: イベント登録画面の店舗の選択肢に本店「${店名}」が無い（${opts.join("、")}）`);
  notes.set("〔店舗ID-M1410-共有〕", 本店の店舗ID);
  reportSeedIssue(seed.シードID, `読み替え: 店舗「リンク試験店」を登録する代わりに、本店「${店名}」（店舗ID ${本店の店舗ID}）を使った（共有のマスタ（店舗）を足さないため）`);
});

defineSeed("S-M14-10-L-CARD", { needs: ["S-M14-10-L-ADM"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 管理画面(browser, async (page) => {
    for (const x of ["A", "B", "C"]) {
      notes.set(`〔カードID-M1410-共有${x}〕`, await カードを作る(page, { 日: 名(`リンク大会カード${x}`), 英: 名(`Link Event Card ${x}`) }, seed.シードID, issue));
    }
  }, M1410L_ADMIN);
});

function defineLinkFormatSeed(seedId: string, n: string, rows: { x: string; 名日: string; 名英: string; 並び順: string; 商品検索: boolean }[]): void {
  defineSeed(seedId, { needs: ["S-M14-10-L-ADM"] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await 管理画面(browser, async (page) => {
      for (const r of rows) {
        notes.set(`〔フォーマットID-M1410-${n}${r.x}〕`, await フォーマットを作る(page, { 名日: 名(r.名日), 名英: 名(r.名英), 並び順: r.並び順, メタゲーム分析日数: "14", 商品検索: r.商品検索 }, seedId, issue));
      }
    }, M1410L_ADMIN);
    issue("読み替え: 既存フォーマットの退避（DBへ直接設定）は行わず、ほかのフォーマットが残ったまま2件を登録した（ケースは2件の名前の有無だけを確かめる）");
  });
}
defineLinkFormatSeed("S-M14-10-L-FMT-052", "052", [
  { x: "A", 名日: "リンク基準001", 名英: "LinkBase001", 並び順: "100", 商品検索: true }, { x: "B", 名日: "リンク表示001", 名英: "LinkShown001", 並び順: "200", 商品検索: true },
]);
defineLinkFormatSeed("S-M14-10-L-FMT-053", "053", [
  { x: "A", 名日: "リンク削除002", 名英: "LinkDel002", 並び順: "100", 商品検索: false }, { x: "B", 名日: "リンク残存002", 名英: "LinkRemain002", 並び順: "200", 商品検索: false },
]);

/** 054・055: 枚数の上限・下限を確かめるフォーマット・大会・会員 */
function defineLinkDeckSeed(seedId: string, n: string, 番: string, 形式日: string, 形式英: string, 大会名: string): void {
  defineSeed(seedId, { needs: ["S-M14-10-L-ADM", "S-M14-10-L-STORE", "S-M14-10-L-CARD"] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const fmt = 名(形式日);
    const 日程ID = await 管理画面(browser, async (page) => {
      notes.set(`〔フォーマットID-M1410-${n}〕`, await フォーマットを作る(page, {
        名日: fmt, 名英: 名(形式英), 並び順: "100", メイン上限: "60", メイン下限: "1", サイド上限: "15", サイド下限: "0", メタゲーム分析日数: "14",
        ランキング: true, イベント: true, 商品検索: false, 統率使用: false,
      }, seedId, issue));
      for (const x of ["A", "B", "C"]) await カードにリーガリティを足す(page, notes.get(`〔カードID-M1410-共有${x}〕`), fmt, "使用可", seedId, issue);
      const イベントID = await イベントを作る(page, { 名日: 名(大会名), 名英: 名(`Link Event ${番}`), フォーマット: [fmt] }, issue);
      const d = await registerSchedule(page, イベントID, { 開始時間: "2099-12-20 10:00", 受付あり: false, デッキ登録あり: true, デッキ登録締切: "2099-12-31 23:59", 公開状態: "公開" });
      notes.set(`〔イベントID-M1410-${n}〕`, イベントID);
      notes.set(`〔イベント詳細ID-M1410-${n}〕`, d);
      return d;
    }, M1410L_ADMIN);
    日程一覧.set(n, 日程ID);
    const m = await 会員を作る(browser, seedId, n, { 前半: `m1410l-${番}`, パスワード: `M1410L-Passw0rd-${番}`, 英姓: "TEST", 英名: "TARO" }, M1410L_ADMIN);
    notes.set(`〔会員ID-M1410-${n}〕`, m.会員ID);
    notes.set(`〔選手ID-M1410-${n}〕`, m.選手ID);
    issue(`読み替え: 会員のログインID「m1410l_${番}」はDBでしか設定できないので設定せず、フロントへはメールアドレス（${m.メール}）でログインする。大会の開催店舗は本店（S-M14-10-L-STORE の読み替え）`);
  });
}
defineLinkDeckSeed("S-M14-10-L-DECK-054", "054", "003", "リンク上限003", "LinkMax003", "リンク上限大会003");
defineLinkDeckSeed("S-M14-10-L-DECK-055", "055", "004", "リンク下限004", "LinkMin004", "リンク下限大会004");

// ---- QL（改名の連携。059・062） ----

/** カードセットの選択肢の先頭（詳細情報の「試験環境にある値」） */
let 先頭のカードセット: string | null = null;

/** QL: フォーマット・公開のアーキタイプ・カード（詳細情報つき）・大会デッキ。カードID・カード詳細ID・デッキIDを返す */
async function QLのデッキを作る(page: Page, seedId: string, v: { 番: string; 形式: string; 形式英: string; 並び順: string; デッキ検索?: boolean; 開催日: string }, issue: Issue): Promise<{ フォーマットID: string; カードID: string; カード詳細ID: string; デッキID: string }> {
  const q = `M1410QL${v.番}`;
  const fmt = 名(v.形式);
  const フォーマットID = await フォーマットを作る(page, { 名日: fmt, 名英: 名(v.形式英), 並び順: v.並び順, メタゲーム分析日数: "14", デッキ検索: v.デッキ検索 }, seedId, issue);
  const arch = 名(`${q}-アーキ`);
  await アーキタイプを登録する(page, { 名日: arch, 名英: 名(`${q}-ARCH`), 公開状態: "公開", フォーマット: fmt }, seedId, issue);
  if (!先頭のカードセット) [先頭のカードセット] = await カード登録の選択肢(page, "cardset");
  if (!先頭のカードセット) throw new Error(`${seedId}: カードの詳細情報のカードセットの選択肢が無い`);
  const card = 名(`${q}-カード`);
  const カードID = await カードを登録する(page, {
    カード名日: card, カード名英: 名(`${q}-CardEN`), 点数で見たマナ: "2", リーガリティ: [{ フォーマット: fmt, リーガリティ: "使用可" }], 詳細: { カードセット: 先頭のカードセット },
  }, `${seedId} のカード「${card}」`, issue);
  const [カード詳細ID] = await カード詳細IDs(page);
  if (!カード詳細ID) throw new Error(`${seedId}: カード「${card}」の詳細情報のカード詳細IDを読めない`);
  const デッキID = await デッキを登録する(page, {
    デッキ名: 名(`${q}-デッキ`), デッキリスト非公開: false, デッキ種別: "event", フォーマット: fmt, アーキタイプ: arch, 公開状態: "公開",
    プレイヤー名: 名(`${q}-選手`), イベント名日: 名(`${q}-大会`), イベント名英: 名(`${q}-EVENT`), 開催日: v.開催日, 参加人数: "64", メイン: `4 ${card}`,
  }, issue);
  issue(`カードの詳細情報は、カードセットに選択肢の先頭「${先頭のカードセット}」、レアリティ・レイアウト・プロモ種別に選択肢の先頭を選んだ（試験環境にある値）。カードの言語は画面の初期値のまま`);
  return { フォーマットID, カードID, カード詳細ID, デッキID };
}

defineSeed("S-M14-10-QL-DECK-059", { needs: ["S-M14-10-QL-ADM"] }, async ({ browser, notes, seed }) => {
  const r = await 管理画面(browser, (page) => QLのデッキを作る(page, seed.シードID, { 番: "002", 形式: "デッキ連携改名前-M1410QL002", 形式英: "DeckRenameBefore-M1410QL002", 並び順: "5305", 開催日: "2026-03-05 10:00" }, (m) => reportSeedIssue(seed.シードID, m)), M1410QL_ADMIN);
  notes.set("〔フォーマットID-M1410-002〕", r.フォーマットID);
  notes.set("〔カードID-M1410-002〕", r.カードID);
  notes.set("〔カード詳細ID-M1410-002〕", r.カード詳細ID);
  notes.set("〔デッキID-M1410-002〕", r.デッキID);
  reportSeedIssue(seed.シードID, "フォーマット名(英)はシード表の「DeckRenameBefore-M1410QL002」に実行の印を付けた値");
});

defineSeed("S-M14-10-QL-NAMEORDER-058", { needs: ["S-M14-10-QL-ADM"] }, async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const issue = (m: string) => reportSeedIssue(id, m);
  await 管理画面(browser, async (page) => {
    const A = 名("改名前フォーマットA-M1410QL001"), B = 名("順序確認フォーマットB-M1410QL001");
    notes.set("〔フォーマットID-M1410-001A〕", await フォーマットを作る(page, { 名日: A, 名英: 名("RenameBeforeFmtA-M1410QL001"), 並び順: "5301", メタゲーム分析日数: "14" }, id, issue));
    notes.set("〔フォーマットID-M1410-001B〕", await フォーマットを作る(page, { 名日: B, 名英: 名("OrderFmtB-M1410QL001"), 並び順: "5302", メタゲーム分析日数: "14" }, id, issue));
    const [c] = await カードと商品を作る(page, [{
      カード名: "連携カード-M1410QL001", セット名日: "連携セット-M1410QL001", セット名英: "LinkSet-M1410QL001", セット略称: "M1410QL", 特殊タイプ: [],
      商品: { 商品コード: "M1410QL001", 商品名日: "連携カード商品-M1410QL001", 商品名英: "LinkCardProduct-M1410QL001" },
    }], id, issue);
    for (const f of [A, B]) await カードにリーガリティを足す(page, c.カードID, f, "使用可", id, issue);
    notes.set("〔カードID-M1410-001〕", c.カードID);
    notes.set("〔カード詳細ID-M1410-001〕", c.カード詳細ID ?? "");
    notes.set("〔商品ID-M1410-001〕", c.商品ID ?? "");
    if (!c.カード詳細ID || !c.商品ID) throw new Error(`${id}: カード詳細ID・商品IDを読めない`);
  }, M1410QL_ADMIN);
  issue("読み替え: カード商品CSV登録の代わりに、M12 と同じ作り方（カードセットを登録→カードを登録→グッズ商品CSV登録→商品登録編集の「カード指定」→商品規格の公開）で、カード「連携カード-M1410QL001」（名(日)・名(英)とも同じ値）と商品「連携カード商品-M1410QL001」を作り、カードにA・Bのリーガリティ「使用可」を足した。販売価格は1,000（シード表の1,500・在庫0・NMの規格1件はケースが確かめない）。カードセットは実行の印つきで新しく登録した");
});

defineSeed("S-M14-10-QL-RESULT-062", { needs: ["S-M14-10-QL-ADM"] }, async ({ browser, notes, seed }) => {
  const r = await 管理画面(browser, (page) => QLのデッキを作る(page, seed.シードID, { 番: "005", 形式: "ResultTitleBefore-M1410QL005", 形式英: "ResultTitleBefore-M1410QL005", 並び順: "5308", デッキ検索: true, 開催日: 日前(7) }, (m) => reportSeedIssue(seed.シードID, m)), M1410QL_ADMIN);
  notes.set("〔フォーマットID-M1410-005〕", r.フォーマットID);
  notes.set("〔カードID-M1410-005〕", r.カードID);
  notes.set("〔カード詳細ID-M1410-005〕", r.カード詳細ID);
});
