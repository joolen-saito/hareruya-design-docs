// 取り込み注記: 同じ機能の作り方を main 側も実装していたため、栗野側の版を別ファイルにした。main が登録済みのシードは登録しない（seeds/main_defined.ts）。
/**
 * M15-08 アーキタイプ検索（管理画面）のシードの作り方（画面操作）。正本: cases/M15-08_seed_data.tsv
 *
 * - 試験管理者（m1508_admin）: メンバー管理で登録する。権限はデッキ管理を操作できる「システム管理者」（正本は権限の名前を定めない。M15-01・M15-05 と同じ）。
 * - ブラウザセッション: ケースごとの新しいブラウザの状態（アーキタイプ検索の保持値なし）で成り立つ。作るものは無い。
 * - 表示件数（≪共有の設定≫。基盤が1本だけで流す）: マスタデータ管理で「25」の行を空にし、9件（10〜12000）を足す。既定値10は画面で
 *   変えられないので、新しいセッションの一覧で10件が選ばれていることを確かめる（M03-01 と同じ部品）。
 * - フォーマット: 投入方法の前半「この3件以外のフォーマットを削除する」は DB での準備なので行わない（依頼者の指示待ち）。後半の画面での登録だけを行う。
 *   ほかの機能も使う実在の「スタンダード」などを書き換えないため、フォーマット名(日)・(英)に実行の印を付けて登録する（M14-09 と同じ）。
 *   並び順は、正本の 1・2・2 のままだと、ほかの画面でこのフォーマットが先頭（既定の選択）になるので 9081・9082・9082 にした（大小の関係は同じ）。
 *   この機能で実装したケースは、選択肢の数・順を確かめない（確かめる 012 は実装しない）。
 * - カラー: 投入方法の前半「既存のカラーを削除する」は DB での準備なので行わない。MTGマスターデータ管理で、同じ名前のカラーが無いときだけ登録する
 *   （カードも使う共有のマスタなので、印を付けた色を足さない）。呼び名のカラーIDは、アーキタイプ管理(検索入力)画面のカラーの欄の値から読む。
 * - デッキタグ: 同じ名前のデッキタグが既にあるときは、名前を変えずにそれを使う（共有のマスタの既存の行を書き換えない）。無ければ登録する。
 * - アーキタイプ名: 決め打ちの識別の値なので、ケースが検索に使う語に実行の印を付けて作る（「件数対象001」→「件数対象-印001」、
 *   「Azure Control」→「Azure-印 Control」）。ケースの検索語・期待結果の名前も、同じ印を付けた値として読む。
 *   ただし 010 の7件は正本の名前のまま（検索条件に印つきのフォーマットが入るので、前の実行の残りに当たらない）。030 の「不存在キーワード」も正本のまま。
 *   英語名のうち検索語を含まないもの（「Strategy」「Integration List」など）は正本の値のまま。
 * - デッキ: デッキ名は正本に記載が無いので入れない（必須でない）。公開状態は非公開。
 *
 * 作らないシード（ケースを実装しない）:
 * - S-M15-08-SORT-002・BASE-007・BASE-011・BASE-013・MAXCOUNT-016（DB での準備）
 * - S-M15-08-BASE-008・BASE-009（カラー・デッキタグだけの条件で検索した該当を全部消す。前の実行の残りでなく、ほかの人のアーキタイプも消しうる）
 */
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { Account, withAdminSession } from "../lib/session";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";
import { PageCountConfigPage } from "../pages/admin/m03_01_page_count";
import { 行を用意する } from "../pages/admin/m14_04_master";
import { フォーマットを登録する } from "../pages/admin/m14_09_format_list";
import { デッキを登録する } from "../pages/admin/m15_05_deck_edit";
import {
  ArchetypeSearchPage, アーキタイプCSVを取り込む, アーキタイプを新規登録する, アーキタイプ内容, 名前でIDを読む, 該当を消す, 表示件数25を外す,
} from "../pages/admin/m15_08_archetype_search";

export const M1508_ADMIN: Account = { loginId: "m1508_admin", password: "Passw0rd!M1508" };

/** 検索語に実行の印を付けた値（ケースの検索語も、この値として読む） */
export const 語 = (正本の語: string): string => rc(正本の語);
/** 正本の名前の中の検索語に実行の印を付けた値（「件数対象001」→「件数対象-印001」） */
export const 名 = (正本の名前: string, 正本の語: string): string => {
  if (!正本の名前.includes(正本の語)) throw new Error(`名前「${正本の名前}」に検索語「${正本の語}」が無い`);
  return 正本の名前.replace(正本の語, rc(正本の語));
};

/** フォーマット（正本の名前 → 実際の名前）。S-M15-08-FORMATS が登録する */
export const フォーマット = { スタンダード: rc("スタンダード"), レガシー: rc("レガシー"), モダン: rc("モダン") } as const;
const フォーマット英 = { スタンダード: rc("Standard"), レガシー: rc("Legacy"), モダン: rc("Modern") } as const;
const 標準 = フォーマット.スタンダード;

const 管理画面 = <T>(browser: Browser, fn: (page: Page) => Promise<T>, 管理者: Account = M1508_ADMIN) =>
  withAdminSession(browser, 管理者, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });

const 共通 = ["S-M15-08-ADM", "S-M15-08-FORMATS"];

// ---- 表示件数（≪共有の設定≫） ----
defineSeed("S-M15-08-PAGE-CONFIG", async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    if (await 表示件数25を外す(page, issue)) issue("表示件数のマスタに「25」の行があったので、ID と Name を空にして保存した");
    const config = new PageCountConfigPage(page);
    await config.ensureExactOptions(["10", "50", "100", "300", "500", "1000", "2000", "10000", "12000"], issue);
    await config.expectDefaultTen();
  });
});

// ---- 共有のマスタ ----
defineSeed("S-M15-08-FORMATS", { needs: ["S-M15-08-ADM"] }, async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const issue = (m: string) => reportSeedIssue(id, m);
  issue("投入方法の「この3件以外のフォーマットを削除する」は DB での準備なので行っていない。フォーマット名(日)・(英)に実行の印を付け、並び順を 9081・9082・9082 にして画面で登録した");
  await 管理画面(browser, async (page) => {
    const defs = [
      ["〔フォーマットID-M1508-共有A〕", "スタンダード", "9081"],
      ["〔フォーマットID-M1508-共有B〕", "レガシー", "9082"],
      ["〔フォーマットID-M1508-共有C〕", "モダン", "9082"],
    ] as const;
    for (const [呼び名, 正本名, 並び順] of defs) {
      notes.set(呼び名, await フォーマットを登録する(page, {
        名日: フォーマット[正本名], 名英: フォーマット英[正本名], 並び順, メタゲーム分析日数: "30",
      }, id, issue));
    }
  });
});

const 色 = [["青", "Blue"], ["白", "White"], ["赤", "Red"], ["緑", "Green"], ["無色", "Colorless"]] as const;
defineSeed("S-M15-08-COLORS", { needs: ["S-M15-08-ADM"] }, async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const issue = (m: string) => reportSeedIssue(id, m);
  issue("投入方法の「既存のカラーを削除する」は DB での準備なので行っていない。同じ名前のカラーが無いときだけ MTGマスターデータ管理で登録した");
  await 管理画面(browser, async (page) => {
    for (const [日, 英] of 色) {
      if (await 行を用意する(page, "カラー", 日, 英, id)) issue(`カラー「${日}」が無かったので登録した（並び順は既存の行の最大＋1）`);
    }
    const s = new ArchetypeSearchPage(page);
    await s.開く();
    const have = await s.カラーの選択肢();
    for (const [i, [日]] of 色.entries()) {
      const hit = have.filter((c) => c.名 === 日);
      if (hit.length === 0) throw new Error(`${id}: アーキタイプ管理(検索入力)画面のカラーに「${日}」が出ない`);
      if (hit.length > 1) issue(`カラー「${日}」が ${hit.length} 件ある。先頭（値 ${hit[0].値}）を使う`);
      notes.set(`〔カラーID-M1508-共有${"ABCDE"[i]}〕`, hit[0].値);
    }
  });
});

const タグ = [["制御", "Control"], ["テンポ", "Tempo"], ["飛行", "Flying"], ["リテラル", "Literal"], ["戦略", "Strategy"]] as const;
defineSeed("S-M15-08-TAGS", { needs: ["S-M15-08-ADM"] }, async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const issue = (m: string) => reportSeedIssue(id, m);
  await 管理画面(browser, async (page) => {
    for (const [日, 英] of タグ) {
      if (!(await 行を用意する(page, "デッキタグ", 日, 英, id))) issue(`デッキタグ「${日}」が既にあったので、名前を変えずにそれを使った（共有のマスタの既存の行を書き換えない）`);
    }
    const s = new ArchetypeSearchPage(page);
    await s.開く();
    const have = await s.デッキタグの選択肢();
    for (const [i, [日]] of タグ.entries()) {
      const hit = have.filter((c) => c.名 === 日);
      if (hit.length === 0) throw new Error(`${id}: アーキタイプ管理(検索入力)画面のデッキタグの選択肢に「${日}」が出ない`);
      if (hit.length > 1) issue(`デッキタグ「${日}」が ${hit.length} 件ある。先頭（値 ${hit[0].値}）を使う`);
      notes.set(`〔デッキタグID-M1508-共有${"ABCDE"[i]}〕`, hit[0].値);
    }
  });
});

// ---- アーキタイプ（ケース専用） ----

type 一件 = アーキタイプ内容 & { 呼び名: string };

/** 該当を消してから、書いた順に1件ずつ新規登録し、登録のつどアーキタイプ名で検索してIDを控える */
async function 消して登録する(page: Page, seedId: string, notes: Notes, 消す条件: Parameters<typeof 該当を消す>[1], 件: 一件[]): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const n = await 該当を消す(page, 消す条件, seedId);
  if (n) issue(`前の残りのアーキタイプ ${n} 件を、行のメニューの「削除」で消した`);
  for (const a of 件) {
    await アーキタイプを新規登録する(page, a, seedId, issue);
    notes.set(a.呼び名, await 名前でIDを読む(page, a, seedId));
  }
}

function defineArchetypeSeed(seedId: string, 消す条件: () => Parameters<typeof 該当を消す>[1], 件: () => 一件[], needs: string[] = 共通): void {
  defineSeed(seedId, { needs }, async ({ browser, notes }) => {
    await 管理画面(browser, (page) => 消して登録する(page, seedId, notes, 消す条件(), 件()));
  });
}

// 004: 「Azure」の日英OR
defineArchetypeSeed("S-M15-08-BASE-004", () => ({ 名: 語("Azure") }), () => [
  { 呼び名: "〔アーキタイプID-M1508-004A〕", 名日: "青白制御", 名英: 名("Azure Control", "Azure"), フォーマット: 標準 },
  { 呼び名: "〔アーキタイプID-M1508-004B〕", 名日: "青白飛行", 名英: 名("Azure Flyers", "Azure"), フォーマット: 標準 },
  { 呼び名: "〔アーキタイプID-M1508-004C〕", 名日: 名("Azure戦略", "Azure"), 名英: "Strategy", フォーマット: 標準 },
]);

// 010: 複合条件（名前は正本のまま。検索条件に印つきのフォーマットが入る）
defineArchetypeSeed("S-M15-08-BASE-010", () => ({ 名: "青 制御", フォーマット: [標準], カラー: ["青", "白"], デッキタグ: ["制御"] }), () => [
  { 呼び名: "〔アーキタイプID-M1508-010A〕", 名日: "青白制御", 名英: "Azure Control", フォーマット: 標準, カラー: ["青", "白"], タグ: ["制御", "テンポ"] },
  { 呼び名: "〔アーキタイプID-M1508-010B〕", 名日: "赤単速攻", 名英: "Red Rush", フォーマット: フォーマット.モダン, カラー: ["赤"], タグ: ["テンポ"] },
  { 呼び名: "〔アーキタイプID-M1508-010C〕", 名日: "青白飛行", 名英: "Azure Flyers", フォーマット: 標準, カラー: ["青", "白"], タグ: ["飛行"] },
  { 呼び名: "〔アーキタイプID-M1508-010D〕", 名日: "割合%試験", 名英: "Percent Literal", フォーマット: フォーマット.レガシー, カラー: ["無色"], タグ: ["リテラル"] },
  { 呼び名: "〔アーキタイプID-M1508-010E〕", 名日: "下線_試験", 名英: "Underscore Literal", フォーマット: フォーマット.モダン, カラー: ["無色"], タグ: ["リテラル"] },
  { 呼び名: "〔アーキタイプID-M1508-010F〕", 名日: "制御単色", 名英: "Mono Control", フォーマット: フォーマット.レガシー, カラー: ["青"], タグ: ["制御"] },
  { 呼び名: "〔アーキタイプID-M1508-010G〕", 名日: "Azure戦略", 名英: "Strategy", フォーマット: 標準, カラー: ["緑"], タグ: ["戦略"] },
], [...共通, "S-M15-08-COLORS", "S-M15-08-TAGS"]);

// 018〜020: 「ページ対象」11件
function definePagingSeed(seedId: string, n: string): void {
  defineArchetypeSeed(seedId, () => ({ 名: 語("ページ対象") }), () => Array.from({ length: 11 }, (_, i) => {
    const k = String(i + 1).padStart(2, "0");
    return { 呼び名: `〔アーキタイプID-M1508-${n}${"ABCDEFGHIJK"[i]}〕`, 名日: 名(`ページ対象${k}`, "ページ対象"), 名英: `PageTarget${k}-${n}`, フォーマット: 標準 };
  }));
}
definePagingSeed("S-M15-08-PAGING-018", "018");
definePagingSeed("S-M15-08-PAGING-019", "019");
definePagingSeed("S-M15-08-PAGING-020", "020");

// 029・034〜039・041〜043: 1件（または2件）
defineArchetypeSeed("S-M15-08-NOIMAGE-029", () => ({ 名: 語("画像未設定型") }), () => [
  { 呼び名: "〔アーキタイプID-M1508-029〕", 名日: 語("画像未設定型"), 名英: "No Image Archetype", フォーマット: 標準 },
]);
for (const n of ["034", "035"]) {
  defineArchetypeSeed(`S-M15-08-BASE-${n}`, () => ({ 名: 語("Azure") }), () => [
    { 呼び名: `〔アーキタイプID-M1508-${n}〕`, 名日: 名("Azure遷移対象", "Azure"), 名英: 名("Azure Transition", "Azure"), フォーマット: 標準 },
  ]);
}
defineArchetypeSeed("S-M15-08-BASE-036", () => ({ 名: 語("青白制御") }), () => [
  { 呼び名: "〔アーキタイプID-M1508-036〕", 名日: 語("青白制御"), 名英: "Azure Control", フォーマット: 標準 },
]);
for (const n of ["037", "038"]) {
  defineArchetypeSeed(`S-M15-08-DELETE-${n}`, () => ({ 名: 語("削除対象型") }), () => [
    { 呼び名: `〔アーキタイプID-M1508-${n}〕`, 名日: 語("削除対象型"), 名英: "Delete Target", フォーマット: 標準 },
  ]);
}
defineArchetypeSeed("S-M15-08-BASE-039", () => ({ 名: 語("Azure") }), () => [
  { 呼び名: "〔アーキタイプID-M1508-039〕", 名日: 名("Azure項目確認", "Azure"), 名英: 名("Azure Field Check", "Azure"), フォーマット: 標準 },
]);
defineArchetypeSeed("S-M15-08-HOLD-041", () => ({ 名: 語("M1508-041-甲") }), () => [
  { 呼び名: "〔アーキタイプID-M1508-041A〕", 名日: 名("保持対象M1508-041-甲", "M1508-041-甲"), 名英: "M1508-041-KeepA", フォーマット: 標準 },
  { 呼び名: "〔アーキタイプID-M1508-041B〕", 名日: 名("保持対象M1508-041-乙", "M1508-041-乙"), 名英: "M1508-041-KeepB", フォーマット: 標準 },
]);
defineArchetypeSeed("S-M15-08-ONECOLOR-042", () => ({ 名: 語("M1508-042-甲") }), () => [
  { 呼び名: "〔アーキタイプID-M1508-042〕", 名日: 名("単色M1508-042-甲", "M1508-042-甲"), 名英: "M1508-042-OneColor", フォーマット: 標準, カラー: ["青"] },
], [...共通, "S-M15-08-COLORS"]);
defineArchetypeSeed("S-M15-08-NOCOLOR-043", () => ({ 名: 語("M1508-043-甲") }), () => [
  { 呼び名: "〔アーキタイプID-M1508-043〕", 名日: 名("色なしM1508-043-甲", "M1508-043-甲"), 名英: "M1508-043-NoColor", フォーマット: 標準 },
], [...共通, "S-M15-08-COLORS"]);

// ---- デッキつき（026・028） ----

/** デッキを登録して、デッキIDを返す（デッキ名は入れない。公開状態は非公開） */
async function デッキ(page: Page, seedId: string, アーキタイプ: string, 種別: "event" | "user"): Promise<string> {
  return デッキを登録する(page, { デッキ種別: 種別, フォーマット: 標準, アーキタイプ, 公開状態: "非公開" }, (m) => reportSeedIssue(seedId, m));
}

defineSeed("S-M15-08-SORT-026", { needs: 共通 }, async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  await 管理画面(browser, async (page) => {
    const n = (x: string) => 名(`並べ替え${x}`, "並べ替え");
    await 消して登録する(page, id, notes, { 名: 語("並べ替え") }, ["A", "B", "C"].map((x) => (
      { 呼び名: `〔アーキタイプID-M1508-026${x}〕`, 名日: n(x), 名英: `Sort${x}`, フォーマット: 標準 })));
    notes.set("〔デッキID-M1508-026A〕", await デッキ(page, id, n("A"), "event"));
    notes.set("〔デッキID-M1508-026B〕", await デッキ(page, id, n("A"), "event"));
    notes.set("〔デッキID-M1508-026C〕", await デッキ(page, id, n("C"), "event"));
  });
});

defineSeed("S-M15-08-LIST-028", { needs: [...共通, "S-M15-08-COLORS"] }, async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const issue = (m: string) => reportSeedIssue(id, m);
  await 管理画面(browser, async (page) => {
    const 名日 = 語("統合一覧型");
    const n = await 該当を消す(page, { 名: 名日 }, id);
    if (n) issue(`前の残りのアーキタイプ ${n} 件を、行のメニューの「削除」で消した`);
    const 画像 = await アーキタイプを新規登録する(page, {
      名日, 名英: "Integration List", 解説日: "統合試験説明", 代表カードを選ぶ: true, カラー: ["青", "白"], フォーマット: 標準,
    }, id, issue);
    notes.set("〔代表カード画像ID-M1508-028〕", 画像);
    issue("代表カードは、代表カード検索で語を入れずに検索した結果の先頭のカード名で検索し直し、その結果の先頭の行を選んだ（正本はカード名を定めない）");
    notes.set("〔アーキタイプID-M1508-028〕", await 名前でIDを読む(page, { 名日, 名英: "Integration List", フォーマット: 標準 }, id));
    notes.set("〔デッキID-M1508-028A〕", await デッキ(page, id, 名日, "event"));
    notes.set("〔デッキID-M1508-028B〕", await デッキ(page, id, 名日, "event"));
    notes.set("〔デッキID-M1508-028C〕", await デッキ(page, id, 名日, "user"));
  });
});

// ---- CSV取り込み（001・014・015・017・044〜052） ----

/** CSVで取り込み、検索して件数100件で該当を読む（アーキタイプ名(日) → ID） */
async function 取り込んで読む(page: Page, seedId: string, 検索語: string, rows: string[][], fileName: string): Promise<Map<string, string>> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const n = await 該当を消す(page, { 名: 検索語 }, seedId);
  if (n) issue(`前の残りのアーキタイプ ${n} 件を、行のメニューの「削除」で消した`);
  await アーキタイプCSVを取り込む(page, rows, fileName, seedId, issue);
  const s = new ArchetypeSearchPage(page);
  await s.開く();
  await s.名前で検索する(検索語);
  await s.件数を選ぶ("100");
  const 件数 = await s.該当件数();
  if (件数 !== rows.length) throw new Error(`${seedId}: 取り込んだあと「${検索語}」で検索した該当件数が ${件数}（${rows.length} 件のはず）`);
  const got = await s.結果の行();
  return new Map(got.map((r) => [r.名日, r.ID]));
}

function defineCount51Seed(seedId: string, n: string): void {
  defineSeed(seedId, { needs: 共通 }, async ({ browser, notes }) => {
    await 管理画面(browser, async (page) => {
      const rows = Array.from({ length: 51 }, (_, i) => {
        const k = String(i + 1).padStart(3, "0");
        return [名(`件数対象${k}`, "件数対象"), `CountTarget${k}`, "", "", フォーマット英.スタンダード];
      });
      const ids = await 取り込んで読む(page, seedId, 語("件数対象"), rows, `m1508-count51-${n}.csv`);
      notes.set(`〔アーキタイプID-M1508-${n}〕`, rows.map((r) => ids.get(r[0])).join(","));
    });
  });
}
defineCount51Seed("S-M15-08-COUNT51-001", "001");
defineCount51Seed("S-M15-08-COUNT51-014", "014");
defineCount51Seed("S-M15-08-COUNT51-015", "015");
defineCount51Seed("S-M15-08-COUNT51-017", "017");

/** 044 型（A にイベント2件、C にイベント1件）と 045 型（A にイベント2件と user 1件、B に user 1件、C にイベント1件と user 1件） */
const デッキの組: Record<"044" | "045", [number, "event" | "user"][]> = {
  "044": [[0, "event"], [0, "event"], [2, "event"]],
  "045": [[0, "event"], [0, "event"], [0, "user"], [1, "user"], [2, "event"], [2, "user"]],
};
function defineCbSeed(n: string, 型: "044" | "045"): void {
  const seedId = `S-M15-08-CBARCH-${n}`;
  defineSeed(seedId, { needs: 共通 }, async ({ browser, notes }) => {
    await 管理画面(browser, async (page) => {
      const 検索語 = `M1508-CB${n}-N`;
      // 取込みの行の順（1行目＝N12 … 12行目＝N01）。呼び名 A〜L はこの順
      const rows = Array.from({ length: 12 }, (_, i) => {
        const k = String(12 - i).padStart(2, "0");
        return [名(`${検索語}${k}`, 検索語), `M1508-CB${n}-E${k}`, "", "", フォーマット英.スタンダード];
      });
      const ids = await 取り込んで読む(page, seedId, 語(検索語), rows, `m1508-cb${n}.csv`);
      const 順 = rows.map((r) => ids.get(r[0]) ?? "");
      for (let i = 1; i < 順.length; i++) {
        if (!(Number(順[i]) > Number(順[i - 1]))) throw new Error(`${seedId}: アーキタイプIDが取込みの行の順に大きくなっていない（${順.join(",")}）`);
      }
      for (const [i, id] of 順.entries()) notes.set(`〔アーキタイプID-M1508-${n}${"ABCDEFGHIJKL"[i]}〕`, id);
      // 状態・属性の「〔A〕がN12、〔B〕がN11と進み、〔L〕がN01」の略記（呼び名として控えることを基盤が求める）
      notes.set("〔A〕", 順[0]); notes.set("〔B〕", 順[1]); notes.set("〔L〕", 順[11]);
      for (const [i, 種別] of デッキの組[型]) await デッキ(page, seedId, rows[i][0], 種別);
    });
  });
}
for (const n of ["044", "046", "048", "050", "051", "052"]) defineCbSeed(n, "044");
for (const n of ["045", "047", "049"]) defineCbSeed(n, "045");
