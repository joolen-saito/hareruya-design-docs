/**
 * M15-09 アーキタイプ登録/編集/削除（管理画面）のシードの作り方（画面操作）。正本: cases/M15-09_seed_data.tsv
 *
 * シード表と違えたところ（解釈）:
 * - 試験管理者（m1509_admin・m1509qm-adm）: メンバー管理で登録する。権限は「システム管理者」（デッキ管理を操作できる。M15-05・M15-11 と同じ部品）。
 * - 入力選択肢（MASTER）: シード表は DB で入れると定める。DB は書き換えず、画面で次のとおり用意する（判定は条件付き）。
 *   公開状態（公開・非公開・限定公開）とカラー（白・青・赤）は既にあるマスタなので、画面の選択肢にあることを確かめるだけ（無ければ止める）。
 *   デッキタグ（タグA・タグB）は MTGマスターデータ管理で、フォーマット（フォーマットA・B・C）はフォーマット管理で、あれば使い、無ければ登録する。
 *   フォーマットの並び順は、シード表の 30・10・20 のままだと全画面の先頭に出て、ほかの機能の初期値（新規登録の初期のフォーマットなど）を変えて
 *   しまうため、同じ大小の順の 9593（A）・9591（B）・9592（C）にする（ケースが見るのは B・C・A の順だけ）。名(英)は半角の「M1509 Format A」など、
 *   フォーマットコード・メタゲーム分析日数（必須の欄）は規則に合う値。ほかのフォーマットを消す「…だけ」は行わない（ほかの機能のデータのため）。
 * - 不存在（MISSING）と登録前の0件（CREATE-0xx）: シード表は DB で残りを削除すると定める。削除はせず、DB の参照で0件であることを確かめ、
 *   あれば止める（判断待ち）。登録する名前（012・013・014・024・039）は実行の印を付けるので、前の実行の残りには当たらない。
 *   020 は文字数そのものを確かめるので印を付けない。同じDBで2回目に流すと、前回の登録が残ってシードで止まる（再実行の制約）。
 * - 決め打ちの識別の値（ケース専用のアーキタイプ名・カード名・検索語・連携試験のフォーマット名・アーキタイプ名・プレイヤー名・デッキ名）は、
 *   実行の印を付けて作る（「編集前アーキタイプ-015」→「編集前アーキタイプ-015-印」、「M1509DEL049-00」→「M1509DEL049-印-00」、
 *   「QM1509-001-旧型」→「QM1509-001-印-旧型」）。共有可のもの（編集前アーキタイプ・削除取消アーキタイプ・削除要求起点アーキタイプ・
 *   Blue Dragon Alpha・ページカード001〜101）は正本の値のまま、あれば内容を確かめて使う。
 * - 代表カードの画像（CARD・CARD-PAGING）: シード表の「競合する検索データを DB で除去する」は行わない（ほかの機能のカードのため）。
 *   Blue Dragon Alpha の完全一致が1件であること、「ページカード」が101件であることは画面で確かめ、違えば止める。
 * - 連携試験（QM-ARCH-061・062）: 「前回の残りを消す」は、名前に実行の印を付けて前回の残りに当たらないので行わない（ほかのデータを消さない）。
 *   フォーマットの「統率者を使う」「ハイランダー」などシード表に無い項目は付けない。
 *
 * 作らないシード（ケースを実装しない）: QM-ARCH-063・QM-META-064（ケースが3601秒以上の待ちを含み、1件の実行の制限時間を超える）。
 */
import { Browser, Page } from "@playwright/test";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { available } from "../lib/db";
import { rc } from "../lib/run_marker";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";
import { 行を用意する } from "../pages/admin/m14_04_master";
import { CardSearchPage } from "../pages/admin/m14_card";
import { FormatDetailPage, フォーマットを登録する } from "../pages/admin/m14_09_format_list";
import { findFormatId } from "../pages/admin/m12_09_used_card";
import { フォーマットコード } from "../pages/admin/f09_01_setup";
import { buildCardCsv, downloadCardCsvTemplate, readExistingCardValues, uploadCardCsv } from "../pages/admin/card_csv";
import { デッキを登録する, デッキ編集画面, フォーマットを用意する } from "../pages/admin/m15_05_deck_edit";
import { アーキタイプ入力, アーキタイプを登録する, アーキタイプ一覧, アーキタイプ編集画面, 代表カードを全ページ読む, 名前でIDを読む, 編集画面の値 } from "../pages/admin/m15_09_archetype_edit";
import { 名前の一致するアーキタイプの件数, 四項目の一致するアーキタイプのID, 番号のアーキタイプの件数, 番号のカード画像の件数 } from "../db/m15_09_archetype";

export const M1509_ADMIN: Account = { loginId: "m1509_admin", password: "Passw0rd!M1509" };
export const M1509_QM: Account = { loginId: "m1509qm-adm", password: "Passw0rd-M1509QM" };

/** 共有の入力選択肢の名前（正本の値のまま） */
export const フォーマットA = "フォーマットA", フォーマットB = "フォーマットB", フォーマットC = "フォーマットC";
export const タグA = "タグA", タグB = "タグB";
/** 共有の代表カード（正本の値のまま） */
export const 代表カード = { 名日: "青竜アルファ", 名英: "Blue Dragon Alpha", 画像URL: "/card/1501.jpg" };
export const 代表カードの表示名 = `${代表カード.名日} / ${代表カード.名英}`;
export const ページカード = "ページカード";
/** 共有のアーキタイプ（正本の値のまま） */
export const 共有A = { 名日: "編集前アーキタイプ", 名英: "Before Archetype", 解説日: "編集前解説", 解説英: "Before Description" };
export const 共有B = { 名日: "削除取消アーキタイプ", 名英: "Delete Cancel Archetype" };
export const 共有C = { 名日: "削除要求起点アーキタイプ", 名英: "Delete Request Base" };

/** ケース専用のアーキタイプ（編集前アーキタイプ-NNN）の名前（実行の印つき） */
export const 編集前 = (n: string) => ({ 名日: rc(`編集前アーキタイプ-${n}`), 名英: rc(`Before Archetype-${n}`) });
/** 更新選択用・再表示用の代表カード（実行の印つき） */
export const 代表カード015 = () => ({ 名日: rc("更新選択カード-015"), 名英: rc("M1509UpdateSelectCard-015"), 画像URL: "/card/1502015.jpg" });
export const 代表カード042 = () => ({ 名日: rc("再表示選択カード-042"), 名英: rc("Redisplay Select Card-042"), 画像URL: "/card/1502042.jpg" });
/** 新規登録のケースが入れる名前（実行の印つき） */
export const 新規の名前 = {
  "012": () => ({ 名日: rc("新規アーキタイプ"), 名英: rc("New Archetype") }),
  "013": () => ({ 名日: rc("新規遷移アーキタイプ"), 名英: rc("Create Transition") }),
  "014": () => ({ 名日: rc("新規応答アーキタイプ"), 名英: rc("Create Response") }),
  "024": () => ({ 名日: rc("任意項目空アーキタイプ"), 名英: rc("Optional Empty Archetype") }),
  "039": () => ({ 名日: rc("不明画像登録"), 名英: rc("Unknown Image Create") }),
};
/** 020・022 の最大文字数の値（正本の値のまま） */
export const 最大 = { 名日: "あ".repeat(255), 名英: "A".repeat(255), 解説日: "い".repeat(1024), 解説英: "B".repeat(1024) };
/** 049 の検索語（実行の印つき）と、その名前 */
export const 削除049の語 = () => rc("M1509DEL049");
export const 削除049の名 = (nn: string) => `${削除049の語()}-${nn}`;
/** 連携試験の名前（「QM1509-001-旧型」→「QM1509-001-印-旧型」） */
export const QM名 = (n: "001" | "002", 後: string) => `${rc(`QM1509-${n}`)}-${後}`;

const 管理画面 = <T>(browser: Browser, fn: (page: Page) => Promise<T>, 管理者: Account = M1509_ADMIN) =>
  withAdminSession(browser, 管理者, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });

const 管理者 = ["S-M15-09-ADM"];
const 選択肢 = ["S-M15-09-ADM", "S-M15-09-MASTER"];
const 選択肢とカード = ["S-M15-09-ADM", "S-M15-09-MASTER", "S-M15-09-CARD"];

// ---- 管理者 ----
defineSeed("S-M15-09-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M15-09試験管理者", account: M1509_ADMIN, メール: "m1509_admin@example.test" });
});
defineSeed("S-M15-09-QM-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "m1509 連携試験の管理者", account: M1509_QM, メール: "m1509qm-adm@example.test" });
});

// ---- 入力選択肢（共有） ----
defineSeed("S-M15-09-MASTER", { needs: 管理者 }, async ({ browser }) => {
  const seedId = "S-M15-09-MASTER";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  await 管理画面(browser, async (page) => {
    // 公開状態: アーキタイプの画面は「限定公開」を出さない作りなので、3つ全部を出すデッキ新規登録画面の選択肢で確かめる
    await page.goto(adminUrl("/deck/new"));
    const deck = new デッキ編集画面(page);
    await deck.読み込みを待つ();
    const 公開状態 = await deck.選択肢(deck.公開状態);
    for (const n of ["公開", "非公開", "限定公開"]) if (!公開状態.includes(n)) throw new Error(`${seedId}: 公開状態「${n}」がデッキ新規登録画面の選択肢に無い（${公開状態.join("、")}）`);
    // カラー: アーキタイプ新規登録画面のカラーの欄で確かめる
    const e = new アーキタイプ編集画面(page);
    await e.新規を開く();
    const カラー = (await e.カラー()).map((c) => c.名);
    for (const n of ["白", "青", "赤"]) if (!カラー.includes(n)) throw new Error(`${seedId}: カラー「${n}」がアーキタイプ新規登録画面に無い（${カラー.join("、")}）`);
    // デッキタグ
    for (const [日, 英] of [[タグA, "Tag A"], [タグB, "Tag B"]]) {
      if (await 行を用意する(page, "デッキタグ", 日, 英, seedId)) issue(`デッキタグ「${日}」が無かったので、MTGマスターデータ管理で登録した（英語名「${英}」）`);
    }
    // フォーマット（並び順は B < C < A の順を保つ）
    for (const [名, 英, 並び順] of [[フォーマットB, "M1509 Format B", "9591"], [フォーマットC, "M1509 Format C", "9592"], [フォーマットA, "M1509 Format A", "9593"]]) {
      const found = await findFormatId(page, 名);
      if (found) {
        const d = new FormatDetailPage(page);
        await d.open(found);
        const now = await d.欄("rank").inputValue();
        if (now !== 並び順) throw new Error(`${seedId}: フォーマット「${名}」（ID ${found}）の並び順が ${now}（このシードの値は ${並び順}）`);
        continue;
      }
      await フォーマットを登録する(page, { 名日: 名, 名英: 英, コード: フォーマットコード(名), 並び順, メタゲーム分析日数: "30" }, seedId, issue);
      issue(`フォーマット「${名}」が無かったので、フォーマット管理で登録した（並び順 ${並び順}・名(英)「${英}」・メタゲーム分析日数 30）`);
    }
  });
  issue("入力選択肢はシード表では DB で入れる。公開状態・カラーは画面の選択肢にあることを確かめ、デッキタグ・フォーマットは画面で用意した。ほかのフォーマット・タグ・カラーは消していない（「…だけ」は成り立たない）。フォーマットの並び順は B・C・A の順を保って 9591・9592・9593 にした");
});

// ---- 代表カード（共有） ----

/** カード登録CSVを、指定の行（カード名・テキスト・画像URL(英語)。レアリティ・レイアウトは登録済みの英語名）で作って取り込む */
async function カードを取り込む(page: Page, rows: { 名日: string; 名英: string; テキスト日?: string; テキスト英?: string; 画像URL: string }[], what: string, issue: (m: string) => void): Promise<void> {
  const base = await readExistingCardValues(page);
  const headers = await downloadCardCsvTemplate(page);
  const csv = buildCardCsv(headers, rows.map((r) => ({
    name_jp: r.名日, name_en: r.名英, text_jp: r.テキスト日 ?? "", text_en: r.テキスト英 ?? "",
    rarity: base.rarity, layout: base.layout, image_en: r.画像URL, image_jp: "", card_detail_id: "",
  })));
  await uploadCardCsv(page, csv, `${what.replace(/[^A-Za-z0-9_-]/g, "_")}.csv`, `${what} のカード登録CSVアップロード`, (w) => issue(`${what}: カード登録CSVの警告「${w}」`));
  issue(`${what}: レアリティ「${base.rarity}」・レイアウト「${base.layout}」（既存のカードにある英語名）でカード登録CSVを作って取り込んだ`);
}

/** 代表カード検索で、カード名の完全一致の行を読み、1行に決まることを確かめて画像IDを返す */
async function 代表カードの画像ID(page: Page, 名英: string, 表示名: string, 画像URL: string, seedId: string): Promise<string> {
  const rows = (await 代表カードを全ページ読む(page, 名英, { 完全一致: true })).filter((r) => r.名前 === 表示名);
  if (rows.length !== 1) throw new Error(`${seedId}: 代表カード検索で「${名英}」の完全一致が1件に決まらない（${rows.length}件: ${rows.map((r) => r.ID).join("、")}）`);
  if (!rows[0].画像.endsWith(画像URL.replace(/^\//, ""))) throw new Error(`${seedId}: 「${名英}」の画像の参照先が ${rows[0].画像}（シード表の値は ${画像URL}）`);
  return rows[0].ID;
}

defineSeed("S-M15-09-CARD", { needs: 管理者 }, async ({ browser, notes }) => {
  const seedId = "S-M15-09-CARD";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  await 管理画面(browser, async (page) => {
    const have = (await 代表カードを全ページ読む(page, 代表カード.名英, { 完全一致: true })).filter((r) => r.名前 === 代表カードの表示名);
    if (have.length === 0) {
      await カードを取り込む(page, [{ ...代表カード, テキスト日: "飛行 急襲", テキスト英: "Flying Haste" }], "M15-09 代表カード", issue);
    } else issue(`前の実行で登録した「${代表カード.名英}」を使った`);
    notes.set("〔画像ID-M1509-共有〕", await 代表カードの画像ID(page, 代表カード.名英, 代表カードの表示名, 代表カード.画像URL, seedId));
  });
  issue("「Blue」と「Alpha」の両方、または「Flying」と「Haste」の両方に一致するほかの代表カード画像を DB で除去することはしていない（ほかの機能のカードのため）");
});

defineSeed("S-M15-09-CARD-PAGING", { needs: 管理者 }, async ({ browser, notes }) => {
  const seedId = "S-M15-09-CARD-PAGING";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const 名 = (i: number) => String(i).padStart(3, "0");
  await 管理画面(browser, async (page) => {
    const list = new CardSearchPage(page);
    await list.open();
    await list.キーワードで検索する(ページカード);
    const n = (await list.検索結果件数()) ?? 0;
    if (n === 0) {
      await カードを取り込む(page, Array.from({ length: 101 }, (_, i) => ({ 名日: `ページカード${名(i + 1)}`, 名英: `Page Card ${名(i + 1)}`, 画像URL: `/card/page-${名(i + 1)}.jpg` })), "M15-09 ページ用カード", issue);
    } else issue(`カード一覧で「${ページカード}」に一致するカードが ${n} 件あった（前の実行で登録したもの）。登録せずに使った`);
    const rows = await 代表カードを全ページ読む(page, ページカード);
    if (rows.length !== 101) throw new Error(`${seedId}: 代表カード検索で「${ページカード}」に一致する画像が ${rows.length} 件（シード表は101件）`);
    notes.set("〔ページ用画像ID-M1509-共有〕", rows.map((r) => r.ID).join("、"));
  });
});

// ---- アーキタイプ ----

/** 共有のアーキタイプ: 名前（日）で探し、あれば内容を確かめて使い、無ければ登録する。IDを返す */
async function 共有のアーキタイプ(page: Page, v: アーキタイプ入力 & { 名日: string; 名英: string }, seedId: string, issue: (m: string) => void): Promise<string> {
  const ids = await 名前でIDを読む(page, v.名日);
  if (ids.length > 1) throw new Error(`${seedId}: アーキタイプ「${v.名日}」が複数ある（${ids.join("、")}）`);
  if (ids.length === 0) return アーキタイプを登録する(page, v, issue);
  const now = await 編集画面の値(page, ids[0]);
  const want: [string, string, string][] = [
    ["アーキタイプ名(日)", now.名日, v.名日], ["アーキタイプ名(英)", now.名英, v.名英],
    ["解説(日)", now.解説日, v.解説日 ?? ""], ["解説(英)", now.解説英, v.解説英 ?? ""],
    ["代表カード", now.代表カードID, v.代表カード?.画像ID ?? ""], ["公開状態", now.公開状態.join("、"), v.公開状態 ?? "公開"],
    ["カラー", now.カラー.join("、"), (v.カラー ?? []).join("、")], ["フォーマット", now.フォーマット.join("、"), v.フォーマット ?? ""],
    ["タグ", now.タグ.join("、"), (v.タグ ?? []).join("、")],
  ];
  const diff = want.filter(([, a, b]) => a !== b);
  if (diff.length) throw new Error(`${seedId}: 前の実行のアーキタイプ「${v.名日}」（ID ${ids[0]}）がシード表と違う: ${diff.map(([k, a, b]) => `${k}「${a}」（シード表「${b}」）`).join(" / ")}`);
  issue(`前の実行で登録したアーキタイプ「${v.名日}」（ID ${ids[0]}）を、内容がシード表と同じことを確かめて使った`);
  return ids[0];
}

/** 全項目（解説・代表カード・公開・白・フォーマットB・タグA）のアーキタイプ */
const 全項目 = (名: { 名日: string; 名英: string }, 画像ID: string): アーキタイプ入力 & { 名日: string; 名英: string } => ({
  ...名, 解説日: "編集前解説", 解説英: "Before Description",
  代表カード: { 語: 代表カード.名英, 画像ID }, 公開状態: "公開", カラー: ["白"], フォーマット: フォーマットB, タグ: [タグA],
});

defineSeed("S-M15-09-BASE-RO", { needs: 選択肢とカード }, async ({ browser, notes }) => {
  const seedId = "S-M15-09-BASE-RO";
  await 管理画面(browser, async (page) => {
    notes.set("〔アーキタイプID-M1509-共有A〕", await 共有のアーキタイプ(page, { ...全項目(共有A, notes.get("〔画像ID-M1509-共有〕")), 解説日: 共有A.解説日, 解説英: 共有A.解説英 }, seedId, (m) => reportSeedIssue(seedId, m)));
  });
});

function defineSharedArchetypeSeed(seedId: string, 名: { 名日: string; 名英: string }, 控え: string): void {
  defineSeed(seedId, { needs: 選択肢 }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await 管理画面(browser, async (page) => {
      notes.set(控え, await 共有のアーキタイプ(page, { ...名, フォーマット: フォーマットB, 公開状態: "公開" }, seedId, issue));
    });
  });
}
defineSharedArchetypeSeed("S-M15-09-DEL-CANCEL-RO", 共有B, "〔アーキタイプID-M1509-共有B〕");
defineSharedArchetypeSeed("S-M15-09-DELETE-RO", 共有C, "〔アーキタイプID-M1509-共有C〕");

/** ケース専用: 全項目のアーキタイプ（編集前アーキタイプ-NNN） */
function defineFullArchetypeSeed(seedId: string, n: string, needs: string[] = 選択肢とカード): void {
  defineSeed(seedId, { needs }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await 管理画面(browser, async (page) => {
      notes.set(`〔アーキタイプID-M1509-${n}〕`, await アーキタイプを登録する(page, 全項目(編集前(n), notes.get("〔画像ID-M1509-共有〕")), issue));
    });
  });
}

/** ケース専用の代表カード（015・042） */
function defineCardSeed(seedId: string, n: string, card: () => { 名日: string; 名英: string; 画像URL: string }): void {
  defineSeed(seedId, { needs: 管理者 }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const c = card();
    await 管理画面(browser, async (page) => {
      await カードを取り込む(page, [c], `M15-09 代表カード ${n}`, issue);
      notes.set(`〔画像ID-M1509-${n}〕`, await 代表カードの画像ID(page, c.名英, `${c.名日} / ${c.名英}`, c.画像URL, seedId));
    });
  });
}
defineCardSeed("S-M15-09-ALT-CARD-015", "015", 代表カード015);
defineCardSeed("S-M15-09-ALT-CARD-042", "042", 代表カード042);

defineFullArchetypeSeed("S-M15-09-BASE-015", "015");
defineFullArchetypeSeed("S-M15-09-BASE-016", "016");
defineFullArchetypeSeed("S-M15-09-BASE-017", "017");
defineFullArchetypeSeed("S-M15-09-BASE-022", "022");
defineFullArchetypeSeed("S-M15-09-BASE-025", "025");
defineFullArchetypeSeed("S-M15-09-BASE-040", "040");
defineFullArchetypeSeed("S-M15-09-BASE-041", "041");
defineFullArchetypeSeed("S-M15-09-BASE-042", "042");

/** ケース専用: 名前とフォーマットB（公開状態は必須の欄のため「公開」）だけのアーキタイプ */
function defineNamedArchetypeSeed(seedId: string, n: string, 名: () => { 名日: string; 名英: string }): void {
  defineSeed(seedId, { needs: 選択肢 }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await 管理画面(browser, async (page) => {
      notes.set(`〔アーキタイプID-M1509-${n}〕`, await アーキタイプを登録する(page, { ...名(), フォーマット: フォーマットB, 公開状態: "公開" }, issue));
    });
  });
}
defineNamedArchetypeSeed("S-M15-09-DELETE-048", "048", () => ({ 名日: rc("削除可能アーキタイプ-048"), 名英: rc("Deletable Archetype-048") }));
defineNamedArchetypeSeed("S-M15-09-DELETE-050", "050", () => ({ 名日: rc("削除可能アーキタイプ-050"), 名英: rc("Deletable Archetype-050") }));
defineNamedArchetypeSeed("S-M15-09-RACE-053", "053", () => ({ 名日: rc("競合前アーキタイプ-053"), 名英: rc("Before Race Archetype-053") }));

/** ケース専用: デッキが紐づくアーキタイプ（名(英)は名(日)と同じ）。デッキ種別の並びのデッキを登録して、控えの呼び名に入れる */
function defineDeckArchetypeSeed(seedId: string, n: string, 名日: () => string, デッキ: [string, "event" | "user"][]): void {
  defineSeed(seedId, { needs: 選択肢 }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const 名 = 名日();
    await 管理画面(browser, async (page) => {
      notes.set(`〔アーキタイプID-M1509-${n}〕`, await アーキタイプを登録する(page, { 名日: 名, 名英: 名, フォーマット: フォーマットB, 公開状態: "公開" }, issue));
      for (const [控え, 種別] of デッキ) {
        notes.set(控え, await デッキを登録する(page, { デッキ種別: 種別, フォーマット: フォーマットB, アーキタイプ: 名, 公開状態: "非公開" }, issue));
      }
    });
  });
}
defineDeckArchetypeSeed("S-M15-09-EVENT-DECK-045", "045", () => rc("イベント使用中アーキタイプ-045"), [["〔デッキID-M1509-045〕", "event"]]);
defineDeckArchetypeSeed("S-M15-09-EVENT-DECK-046", "046", () => rc("イベント使用中アーキタイプ-046"), [["〔デッキID-M1509-046〕", "event"]]);
defineDeckArchetypeSeed("S-M15-09-USER-DECK-047", "047", () => rc("ユーザーデッキ使用中アーキタイプ-047"), [["〔デッキID-M1509-047〕", "user"]]);
defineDeckArchetypeSeed("S-M15-09-COUNT-054", "054", () => rc("登録デッキ数確認-054"), [
  ["〔デッキID-M1509-054A〕", "event"], ["〔デッキID-M1509-054B〕", "user"], ["〔デッキID-M1509-054C〕", "user"],
]);

defineSeed("S-M15-09-DELETE-PAGING-049", { needs: 選択肢 }, async ({ browser, notes }) => {
  const seedId = "S-M15-09-DELETE-PAGING-049";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  await 管理画面(browser, async (page) => {
    const l = new アーキタイプ一覧(page);
    await l.開く();
    await l.名前で検索する(削除049の語());
    if ((await l.行()).length) throw new Error(`${seedId}: 「${削除049の語()}」に一致するアーキタイプが既にある`);
    // 対象（-00）を先に登録して、IDをいちばん小さくする
    for (let i = 0; i <= 10; i++) {
      const 名 = 削除049の名(String(i).padStart(2, "0"));
      const id = await アーキタイプを登録する(page, { 名日: 名, 名英: 名, フォーマット: フォーマットB, 公開状態: "公開" }, issue);
      if (i === 0) notes.set("〔アーキタイプID-M1509-049〕", id);
    }
  });
});

// ---- 不存在・登録前の0件（DB の参照で確かめる。削除はしない） ----

function DBで確かめる(seedId: string): void {
  if (!available) throw new Error(`${seedId}: シード表は DB で残りを削除すると定める。この環境は DB の参照ができないため、0件であることを確かめられない`);
}

defineSeed("S-M15-09-MISSING", async () => {
  const seedId = "S-M15-09-MISSING";
  DBで確かめる(seedId);
  const a = 番号のアーキタイプの件数(999999), c = 番号のカード画像の件数(999999);
  if (a !== 0 || c !== 0) throw new Error(`${seedId}: アーキタイプID 999999 が ${a} 件、画像ID 999999 が ${c} 件ある。シード表は削除すると定めるが、DB を書き換えないため止めた（判断待ち）`);
  reportSeedIssue(seedId, "アーキタイプID 999999・画像ID 999999 が無いことを DB の参照で確かめた（削除はしていない）");
});

function defineNoArchetypeSeed(seedId: string, 名: () => { 名日: string; 名英: string }): void {
  defineSeed(seedId, async () => {
    DBで確かめる(seedId);
    const v = 名();
    const k = 名前の一致するアーキタイプの件数(v.名日, v.名英);
    if (k !== 0) throw new Error(`${seedId}: 「${v.名日}」または「${v.名英}」のアーキタイプが ${k} 件ある`);
    reportSeedIssue(seedId, `名前に実行の印を付けた「${v.名日}」「${v.名英}」のアーキタイプが0件であることを DB の参照で確かめた（DB での削除はしていない）`);
  });
}
defineNoArchetypeSeed("S-M15-09-CREATE-012", 新規の名前["012"]);
defineNoArchetypeSeed("S-M15-09-CREATE-013", 新規の名前["013"]);
defineNoArchetypeSeed("S-M15-09-CREATE-014", 新規の名前["014"]);
defineNoArchetypeSeed("S-M15-09-CREATE-024", 新規の名前["024"]);
defineNoArchetypeSeed("S-M15-09-CREATE-039", 新規の名前["039"]);

defineSeed("S-M15-09-CREATE-020", async () => {
  const seedId = "S-M15-09-CREATE-020";
  DBで確かめる(seedId);
  const ids = 四項目の一致するアーキタイプのID(最大.名日, 最大.名英, 最大.解説日, 最大.解説英);
  if (ids.length) throw new Error(`${seedId}: 4項目の組合せのアーキタイプが残っている（ID ${ids.join("、")}）。シード表は DB で削除すると定めるが、DB を書き換えないため止めた（判断待ち・再実行の制約）`);
  reportSeedIssue(seedId, "4項目（「あ」255文字・「A」255文字・「い」1024文字・「B」1024文字）の組合せのアーキタイプが0件であることを DB の参照で確かめた（削除はしていない）");
});

// ---- 連携試験（061・062） ----

function defineQmSeed(seedId: string, n: "001" | "002", 並び順: string, 控え?: string): void {
  defineSeed(seedId, { needs: ["S-M15-09-QM-ADM"] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await 管理画面(browser, async (page) => {
      const fmt = QM名(n, "フォーマット");
      await フォーマットを用意する(page, { 名: fmt, 名英: QM名(n, "Format"), 並び順, メタ日数: "14", ランキング表示: true, メタ分布簡易化: false, 統率を使う: false, ハイランダー: false }, issue);
      const 旧型 = QM名(n, "旧型");
      await アーキタイプを登録する(page, { 名日: 旧型, 名英: QM名(n, "OldType"), 公開状態: "公開", フォーマット: fmt }, issue);
      const id = await デッキを登録する(page, {
        デッキ種別: "event", フォーマット: fmt, アーキタイプ: 旧型, 公開状態: "公開", デッキリスト非公開: false,
        プレイヤー名: QM名(n, "選手"), イベント名日: QM名(n, "大会"), イベント名英: QM名(n, "Event"), 開催日: "2025/03/10 10:00",
        順位: "1", 成績: QM名(n, "成績"), 参加人数: "18", デッキ名: QM名(n, "デッキ"),
      }, issue);
      if (控え) notes.set(控え, id);
    }, M1509_QM);
    issue("「前回の残りを消す」は、名前に実行の印を付けて前回の残りに当たらないため行わなかった（ほかのデータを消さない）");
  });
}
defineQmSeed("S-M15-09-QM-ARCH-061", "001", "9901");
defineQmSeed("S-M15-09-QM-ARCH-062", "002", "9902", "〔デッキID-M1509-002〕");
