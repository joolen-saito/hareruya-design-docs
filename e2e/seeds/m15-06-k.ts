// 取り込み注記: 同じ機能の作り方を main 側も実装していたため、栗野側の版を別ファイルにした。main が登録済みのシードは登録しない（seeds/main_defined.ts）。
/**
 * M15-06 デッキ登録CSV（管理画面）のシードの作り方（画面操作）。正本: cases/M15-06_seed_data.tsv
 *
 * シード表と違えたところ（解釈。判定は条件付き）:
 * - 試験管理者（m1506_admin・m1506qm-adm・m1506rj-adm）: メンバー管理で登録する。権限はデッキ管理を操作できる「システム管理者」
 *   （正本は権限の名前を定めない。M15-05・M15-09 と同じ部品）。
 * - 参照マスタ（MASTER）: 共有可なので、正本の名前のまま「あれば記載の値へ戻して使い、無ければ作る」。
 *   ・フォーマット名(日)は正本が「他と重ならない任意」とするので、フォーマット名(英)と同じ値（TestStandard など）。並び順は全画面の先頭に
 *     出てほかの機能の初期値を変えないよう 9661〜9663、メタゲーム分析日数は 30。
 *   ・カードは、カード詳細の画面に画像を足す欄が無いため、全部をカード登録CSVアップロードで作る（M15-05 と同じ）。カードセット・レアリティ・
 *     レイアウト・画像URLは既存のカードの値（カードごとに違う画像）。Restricted Card は「使用制限フォーマット」に TestStandard を書く。
 *   ・デッキタグ（試験タグA・B）は MTGマスターデータ管理のデッキタグで、あれば使い、無ければ登録する（英語名は Test Tag A・B）。
 *   ・「NoSuchFormat」「Unknown Commander」は、あれば消すのでなく、無いことを画面で確かめる（あれば止める。ほかのデータを消さない）。
 *   ・イベント詳細ID 150601: シード表は DB で入れると定める。DB は書き換えず、イベントと日程を画面で登録し（あれば使う）、その日程ID を
 *     CSV の「イベント詳細ID」に 150601 の代わりに書く。ケースの「イベント詳細ID 150601」もこの日程ID として読む。
 *   ・イベント詳細ID 999999: DB の参照で無いことを確かめる（あれば止める。消さない）。
 * - 既存デッキ（CORE-004 の 1506001004・REIMPORT-054 の 1506054001・MIXED-057 の 1506057001）: シード表は DB で ID を決めて入れると定める。
 *   DB は書き換えず、デッキ編集画面（新規登録）でイベントデッキ（メイン「2 Main Card A」・サイド「1 Side Card」の明細つき）を登録し、
 *   振られたデッキIDを CSV の「デッキID」に書く。ケースの「デッキID 1506001004」などもこのデッキIDとして読む。
 * - 作らないシード（ケースを実装しない）: CSV-CORE-038（旧デッキIDは画面で入れられず DB での準備が要る）、QM-META-052（ケースが
 *   3601秒以上の待ちを含み、1件の実行の制限時間を超える）。
 * - 決め打ちの識別の値は実行の印を付けて作る: プレイヤー名（「IT完全新規-002」→「IT完全新規-002-印」、「M1506-053-P」→「M1506-053-印-P」、
 *   「QM1506-001-選手」→「QM1506-001-印-選手」）、ケース専用のフォーマット名・アーキタイプ名・カード名（M1506-055・QM・RJ・CB059〜064）。
 *   「M1506-047-NoSuchFormat」は登録されていないことが要点なので印を付けない（無いことを確かめる）。
 *   デッキ名・イベント名・成績は正本の値のまま。
 * - 「前回の残りを消す」（同じプレイヤー名のデッキ・同じ名前のアーキタイプ・フォーマットを消す）は、名前に実行の印を付けて前回の残りに
 *   当たらないので行わず、同じプレイヤー名のデッキが0件であることをデッキ一覧で確かめる（あれば止める）。
 * - CB059〜061 の既存デッキは、シード表のとおりデッキ登録CSVで登録し、デッキ一覧のプレイヤー名の検索結果からデッキIDを控える。
 */
import { Browser, Page } from "@playwright/test";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { available } from "../lib/db";
import { rc } from "../lib/run_marker";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";
import { 行を用意する } from "../pages/admin/m14_04_master";
import { フォーマットを英語名で探す, カード一覧で探す } from "../pages/admin/m14_05_card_csv_upload";
import { イベントと日程を用意する } from "../pages/admin/m15_deck";
import { アーキタイプを用意する, デッキを登録する, デッキ編集画面 } from "../pages/admin/m15_05_deck_edit";
import {
  デッキCSV登録画面, デッキCSVを組む, デッキCSVの行, デッキ一覧で探す, フォーマットを揃える, カードを揃える,
} from "../pages/admin/m15_06_deck_csv";
import { 日程がある } from "../db/m15_06_deck_csv";

export const M1506_ADMIN: Account = { loginId: "m1506_admin", password: "Passw0rd!M1506" };
export const M1506_QM: Account = { loginId: "m1506qm-adm", password: "Passw0rd-M1506QM" };
export const M1506_RJ: Account = { loginId: "m1506rj-adm", password: "Passw0rd-M1506RJ" };

/** 共有の参照マスタの名前（正本の値のまま） */
export const 標準 = "TestStandard", 統率 = "TestCommander", 別 = "OtherFormat";
export const 試験型 = { 名日: "試験アーキタイプ", 名英: "Test Archetype" };
export const 統率型 = { 名日: "統率者試験", 名英: "Commander Archetype" };
export const 別型 = { 名日: "別アーキタイプ", 名英: "Other Archetype" };
export const タグA = "試験タグA", タグB = "試験タグB";
export const 統率者カード = { 名日: "統率者札", 名英: "Commander Card" };
export const 代表カード = "Feature Card";
const イベント = { 名日: "M1506 CSV取込イベント", 名英: "M1506 CSV Import Event" };

/** 正本の名前に実行の印を付ける（「M1506-053-P」→「M1506-053-印-P」、「QM1506-001-選手」→「QM1506-001-印-選手」、ほかは末尾に印） */
export function 名(正本: string): string {
  const m = /^((?:M1506-(?:CB)?\d+)|(?:QM1506-\d+)|(?:RJ1506-\d+))(-.*)$/.exec(正本);
  return m ? `${rc(m[1])}${m[2]}` : rc(正本);
}

// ---- シードとケースの間で持ち回す値（同じ実行の中だけ） ----

let 日程ID = "";
/** イベント詳細ID 150601 の代わりに使う日程ID（MASTER が用意する） */
export function 基準の日程ID(): string {
  if (!日程ID) throw new Error("イベント詳細ID 150601 の代わりの日程をまだ用意していない（S-M15-06-MASTER）");
  return 日程ID;
}
let 代表カードのセット: { set: string; rarity: string; layout: string } | null = null;

/** 手元で作った CSV ファイル（ファイル名→中身）。ケースが「ファイルを選択」で選ぶ */
const ファイル = new Map<string, Buffer>();
export function CSVファイル(名前: string): Buffer {
  const b = ファイル.get(名前);
  if (!b) throw new Error(`CSVファイル「${名前}」をシードが作っていない`);
  return b;
}
/** 正本の決め打ちのデッキID → 画面で登録した既存デッキのデッキID */
const 置き換え = new Map<string, string>();
export function 既存デッキのID(正本のID: "1506001004" | "1506054001" | "1506057001"): string {
  const v = 置き換え.get(正本のID);
  if (!v) throw new Error(`デッキID ${正本のID} の代わりのデッキをシードが作っていない`);
  return v;
}

/** 有効基準値（S-M15-06-CSV-BASE）。イベント詳細IDは画面で用意した日程ID */
export function 基準(上書き: デッキCSVの行 = {}): デッキCSVの行 {
  return {
    フォーマット: 標準, アーキタイプ: 試験型.名英, イベント詳細ID: 基準の日程ID(), 順位: "1", 成績: "優勝", タグ: "",
    "イベント名(英)": "IT Event", "イベント名(日)": "ITイベント", イベント開催日: "2025-09-01 10:00:00", 参照元: "http://example.com/deck",
    イベント参加人数: "10", 表示フラグ: "1", デッキリスト非公開フラグ: "0", メインリスト: "2 Main Card A", サイドリスト: "1 Side Card",
    統率者: "", デッキID: "", 代表カード名: 代表カード, ...上書き,
  };
}

const 管理画面 = <T>(browser: Browser, fn: (page: Page) => Promise<T>, 管理者: Account = M1506_ADMIN) =>
  withAdminSession(browser, 管理者, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });

/** 同じプレイヤー名のデッキが0件であることをデッキ一覧で確かめる（あれば止める） */
async function 無いことを確かめる(page: Page, seedId: string, プレイヤー名: string[]): Promise<void> {
  for (const p of プレイヤー名) {
    const ids = await デッキ一覧で探す(page, "player_name", p);
    if (ids.length) throw new Error(`${seedId}: プレイヤー名「${p}」のデッキが既にある（ID ${ids.join("、")}）。前の実行の残りか、ほかのデータ`);
  }
}

/** フォーマット名(英)のフォーマットが無いことを確かめる（あれば止める） */
async function フォーマットが無いことを確かめる(page: Page, seedId: string, 名英: string): Promise<void> {
  const id = await フォーマットを英語名で探す(page, 名英);
  if (id) throw new Error(`${seedId}: フォーマット名(英)「${名英}」のフォーマットがある（ID ${id}）。消さずに止める（判断待ち）`);
}

/** 日程ID 999999 が無いことを DB の参照で確かめる（あれば止める） */
function 日程999999が無いことを確かめる(seedId: string): void {
  if (!available) { reportSeedIssue(seedId, "DB確認の接続先が無いため、イベント詳細ID 999999 が無いことを確かめられなかった"); return; }
  if (日程がある("999999")) throw new Error(`${seedId}: イベント詳細ID 999999 の日程がある。消さずに止める（判断待ち）`);
}

/** CSV を登録画面で取り込む（シード用）。誤りが出たら止める */
async function CSVを取り込む(page: Page, seedId: string, 名前: string, 中身: Buffer): Promise<void> {
  const s = new デッキCSV登録画面(page);
  await s.開く();
  await s.ファイルを選ぶ(名前, 中身);
  const r = await s.アップロードを押す();
  if (!r.送った || r.エラー.length || !r.成功.length) throw new Error(`${seedId}: ${名前} の取り込みが済まない（${[...r.エラー, ...r.成功].join(" / ") || "表示なし"}）`);
}

/** デッキ編集画面（新規登録）で、既存のイベントデッキ（メイン・サイドの明細つき）を登録する */
async function 既存デッキを登録する(page: Page, seedId: string, プレイヤー名: string, デッキ名?: string): Promise<string> {
  return デッキを登録する(page, {
    デッキ種別: "event", フォーマット: 標準, アーキタイプ: 試験型.名日, 公開状態: "公開", デッキリスト非公開: false,
    プレイヤー名, デッキ名, イベント名日: "ITイベント", イベント名英: "IT Event", 開催日: "2025/09/01 10:00",
    メイン: "2 Main Card A", サイド: "1 Side Card",
  }, (m) => reportSeedIssue(seedId, m));
}

const 管理者 = ["S-M15-06-ADM"];
const マスタ = ["S-M15-06-ADM", "S-M15-06-MASTER", "S-M15-06-CSV-BASE"];
defineSeed("S-M15-06-QM-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M15-06連携試験の管理者", account: M1506_QM, メール: "m1506qm-adm@example.test" });
});
defineSeed("S-M15-06-RJ-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M15-06連鎖試験管理者", account: M1506_RJ, メール: "m1506rj-adm@example.test" });
});

// ---- 参照マスタ（共有） ----
defineSeed("S-M15-06-MASTER", { needs: 管理者 }, async ({ browser }) => {
  const seedId = "S-M15-06-MASTER";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  await 管理画面(browser, async (page) => {
    // ① フォーマット
    await フォーマットを揃える(page, { 名日: 標準, 名英: 標準, 並び順: "9661", メイン下限: "2", メイン上限: "3", サイド下限: "1", サイド上限: "2", 統率を使う: false }, issue);
    await フォーマットを揃える(page, { 名日: 統率, 名英: 統率, 並び順: "9662", メイン下限: "2", メイン上限: "3", サイド下限: "1", サイド上限: "2", 統率を使う: true }, issue);
    await フォーマットを揃える(page, { 名日: 別, 名英: 別, 並び順: "9663", 統率を使う: false }, issue);
    // ② デッキタグ
    for (const [日, 英] of [[タグA, "Test Tag A"], [タグB, "Test Tag B"]]) {
      if (await 行を用意する(page, "デッキタグ", 日, 英, seedId)) issue(`デッキタグ「${日}」が無かったので、MTGマスターデータ管理で登録した（英語名「${英}」）`);
    }
    // ③④ カード（カード登録CSVアップロード）
    const cards = await カードを揃える(page, [
      { 名英: "Main Card A" }, { 名英: "Main Card B" }, { 名英: "Side Card" }, { 名英: "Cross Archetype Card" },
      { 名英: 統率者カード.名英, 名日: 統率者カード.名日 },
      { 名英: "Restricted Card", 制限: [標準] },
      { 名英: 代表カード },
    ], "M15-06 参照カード", issue);
    const fc = cards.get(代表カード)!;
    代表カードのセット = { set: fc.set, rarity: fc.rarity, layout: fc.layout };
    issue("カードはカード登録CSVアップロードで作った（カード詳細の画面には画像を足す欄が無い）。カードセット・レアリティ・レイアウト・画像URLは既存のカードの値。Restricted Card は使用制限フォーマットに TestStandard を書いた");
    // ⑤ アーキタイプ
    await アーキタイプを用意する(page, { ...試験型, フォーマット: 標準, 代表カード }, issue);
    await アーキタイプを用意する(page, { ...統率型, フォーマット: 統率 }, issue);
    await アーキタイプを用意する(page, { ...別型, フォーマット: 別 }, issue);
    // ⑥ 無いことを確かめる
    await フォーマットが無いことを確かめる(page, seedId, "NoSuchFormat");
    const unknown = await カード一覧で探す(page, "Unknown Commander");
    if (unknown.length) throw new Error(`${seedId}: カード「Unknown Commander」がある（ID ${unknown.join("、")}）。消さずに止める（判断待ち）`);
    // ⑦ イベント詳細ID 150601 の代わりの日程（あれば使う）と、999999 が無いこと
    await page.goto(adminUrl("/deck/new"));
    const e = new デッキ編集画面(page);
    await e.読み込みを待つ();
    await e.イベントを検索する({ イベント名: イベント.名日 });
    const hit = (await e.イベント検索の結果()).filter((r) => r.名日 === イベント.名日);
    if (hit.length) 日程ID = hit[0].日程ID;
    else 日程ID = (await イベントと日程を用意する(page, { 名日: イベント.名日, 名英: イベント.名英, 開始時間: "2025-09-01 10:00" }, issue)).日程ID;
    issue(`イベント詳細ID 150601 は DB で入れず、画面で登録したイベント「${イベント.名日}」の日程（ID ${日程ID}）を代わりに使う`);
    日程999999が無いことを確かめる(seedId);
  });
});

defineSeed("S-M15-06-CSV-BASE", async () => { /* 入力値の取り決め（基準()）。作るものは無い */ });

// ---- ケース専用の CSV ----

type CSVの定め = { ファイル: string; プレイヤー: string[]; 行: () => デッキCSVの行[]; 前?: (page: Page, seedId: string) => Promise<void> };

function defineCsvSeed(seedId: string, d: CSVの定め): void {
  defineSeed(seedId, { needs: マスタ }, async ({ browser }) => {
    await 管理画面(browser, async (page) => {
      if (d.前) await d.前(page, seedId);
      await 無いことを確かめる(page, seedId, d.プレイヤー.map(名));
      ファイル.set(d.ファイル, デッキCSVを組む(d.行()));
    });
  });
}
/** プレイヤー名だけを変えた1行（有効基準値） */
const 一行 = (プレイヤー: string, 上書き: デッキCSVの行 = {}) => () => [基準({ プレイヤー名: 名(プレイヤー), ...上書き })];

defineCsvSeed("S-M15-06-CSV-CORE-002", { ファイル: "full_new-002.csv", プレイヤー: ["IT完全新規-002"], 行: 一行("IT完全新規-002", { デッキ名: "IT完全デッキ-002" }) });
defineCsvSeed("S-M15-06-CSV-CORE-003", { ファイル: "full_new-003.csv", プレイヤー: ["IT完全新規-003"], 行: 一行("IT完全新規-003", { デッキ名: "IT完全デッキ-003" }) });
defineCsvSeed("S-M15-06-CSV-CORE-040", { ファイル: "full_new-040.csv", プレイヤー: ["IT完全新規-040"], 行: 一行("IT完全新規-040", { デッキ名: "IT完全デッキ-040" }) });

defineSeed("S-M15-06-CSV-CORE-004", { needs: マスタ }, async ({ browser }) => {
  const seedId = "S-M15-06-CSV-CORE-004";
  await 管理画面(browser, async (page) => {
    await 無いことを確かめる(page, seedId, [名("IT更新後-004"), 名("更新前プレイヤー-004")]);
    const id = await 既存デッキを登録する(page, seedId, 名("更新前プレイヤー-004"), "更新前デッキ-004");
    置き換え.set("1506001004", id);
    reportSeedIssue(seedId, `デッキID 1506001004 は DB で入れず、デッキ編集画面で登録したデッキ（ID ${id}）を代わりに使う`);
    ファイル.set("update_existing-004.csv", デッキCSVを組む([基準({ プレイヤー名: 名("IT更新後-004"), デッキ名: "IT更新後デッキ-004", デッキID: id })]));
  });
});

defineCsvSeed("S-M15-06-CSV-CORE-005", {
  ファイル: "nonexistent_id-005.csv", プレイヤー: ["IT未一致ID-005"], 行: 一行("IT未一致ID-005", { デッキID: "999999" }),
  前: async (page, seedId) => {
    const ids = await デッキ一覧で探す(page, "deck_id", "999999");
    if (ids.includes("999999")) throw new Error(`${seedId}: デッキID 999999 のデッキがある。消さずに止める（判断待ち）`);
  },
});
defineCsvSeed("S-M15-06-CSV-CORE-006", {
  ファイル: "minimal_new-006.csv", プレイヤー: ["IT任意空欄-006"],
  行: () => [{
    プレイヤー名: 名("IT任意空欄-006"), フォーマット: 標準, アーキタイプ: 試験型.名英, "イベント名(英)": "IT Event", "イベント名(日)": "ITイベント",
    イベント開催日: "2025-09-01 10:00:00", 表示フラグ: "0", デッキリスト非公開フラグ: "1",
  }],
});
defineCsvSeed("S-M15-06-CSV-REFERENCE-009", {
  ファイル: "unknown_format-009.csv", プレイヤー: ["IT未登録フォーマット-009"], 行: 一行("IT未登録フォーマット-009", { フォーマット: "NoSuchFormat" }),
  前: (page, seedId) => フォーマットが無いことを確かめる(page, seedId, "NoSuchFormat"),
});
defineCsvSeed("S-M15-06-CSV-REFERENCE-010", {
  ファイル: "archetype_names-010.csv", プレイヤー: ["ITアーキタイプ日名-010", "ITアーキタイプ英名-010"],
  行: () => [基準({ プレイヤー名: 名("ITアーキタイプ日名-010"), アーキタイプ: 試験型.名日 }), 基準({ プレイヤー名: 名("ITアーキタイプ英名-010"), アーキタイプ: 試験型.名英 })],
});
defineCsvSeed("S-M15-06-CSV-REFERENCE-011", { ファイル: "mismatched_archetype-011.csv", プレイヤー: ["IT不一致アーキタイプ-011"], 行: 一行("IT不一致アーキタイプ-011", { フォーマット: 標準, アーキタイプ: 別型.名英 }) });
defineCsvSeed("S-M15-06-CSV-REFERENCE-012", {
  ファイル: "missing_event-012.csv", プレイヤー: ["IT未登録イベント-012"], 行: 一行("IT未登録イベント-012", { イベント詳細ID: "999999" }),
  前: async (_page, seedId) => 日程999999が無いことを確かめる(seedId),
});
defineCsvSeed("S-M15-06-CSV-FLAG-014", {
  ファイル: "display_values-014.csv", プレイヤー: ["IT表示0-014", "IT表示1-014"],
  行: () => [基準({ プレイヤー名: 名("IT表示0-014"), 表示フラグ: "0" }), 基準({ プレイヤー名: 名("IT表示1-014"), 表示フラグ: "1" })],
});
defineCsvSeed("S-M15-06-CSV-FLAG-016", {
  ファイル: "private_values-016.csv", プレイヤー: ["IT非公開0-016", "IT非公開1-016"],
  行: () => [基準({ プレイヤー名: 名("IT非公開0-016"), デッキリスト非公開フラグ: "0" }), 基準({ プレイヤー名: 名("IT非公開1-016"), デッキリスト非公開フラグ: "1", メインリスト: "" })],
});

const 統率の行 = (上書き: デッキCSVの行 = {}): デッキCSVの行 => 基準({ フォーマット: 統率, アーキタイプ: 統率型.名英, 統率者: 統率者カード.名英, 表示フラグ: "1", デッキリスト非公開フラグ: "0", ...上書き });
defineCsvSeed("S-M15-06-CSV-COMMANDER-018", { ファイル: "commander_blank-018.csv", プレイヤー: ["IT統率者空欄-018"], 行: () => [統率の行({ プレイヤー名: 名("IT統率者空欄-018"), 統率者: "" })] });
defineCsvSeed("S-M15-06-CSV-COMMANDER-019", {
  ファイル: "commander_names-019.csv", プレイヤー: ["IT統率者日名-019", "IT統率者英名-019"],
  行: () => [統率の行({ プレイヤー名: 名("IT統率者日名-019"), 統率者: 統率者カード.名日 }), 統率の行({ プレイヤー名: 名("IT統率者英名-019"), 統率者: 統率者カード.名英 })],
});
defineCsvSeed("S-M15-06-CSV-COMMANDER-020", {
  ファイル: "commander_unknown-020.csv", プレイヤー: ["IT未登録統率者-020"], 行: () => [統率の行({ プレイヤー名: 名("IT未登録統率者-020"), 統率者: "Unknown Commander" })],
  前: async (page, seedId) => {
    const ids = await カード一覧で探す(page, "Unknown Commander");
    if (ids.length) throw new Error(`${seedId}: カード「Unknown Commander」がある（ID ${ids.join("、")}）。消さずに止める（判断待ち）`);
  },
});
defineCsvSeed("S-M15-06-CSV-COUNT-021", {
  ファイル: "boundary_counts-021.csv", プレイヤー: ["IT枚数境界下限-021", "IT枚数境界上限-021"],
  行: () => [
    基準({ プレイヤー名: 名("IT枚数境界下限-021"), メインリスト: "2 Main Card A", サイドリスト: "1 Side Card" }),
    基準({ プレイヤー名: 名("IT枚数境界上限-021"), メインリスト: "2 Main Card A\n1 Main Card B", サイドリスト: "2 Side Card" }),
  ],
});
/** 022 の4ファイル（ファイル名・プレイヤー名・有効基準値から変えるところ） */
export const 枚数範囲外: { ファイル: string; プレイヤー: string; 上書き: デッキCSVの行 }[] = [
  { ファイル: "main_under-022.csv", プレイヤー: "ITメイン下限外-022", 上書き: { メインリスト: "1 Main Card A" } },
  { ファイル: "main_over-022.csv", プレイヤー: "ITメイン上限外-022", 上書き: { メインリスト: "2 Main Card A\n2 Main Card B" } },
  { ファイル: "side_under-022.csv", プレイヤー: "ITサイド下限外-022", 上書き: { サイドリスト: "" } },
  { ファイル: "side_over-022.csv", プレイヤー: "ITサイド上限外-022", 上書き: { サイドリスト: "3 Side Card" } },
];
defineSeed("S-M15-06-CSV-COUNT-022", { needs: マスタ }, async ({ browser }) => {
  const seedId = "S-M15-06-CSV-COUNT-022";
  await 管理画面(browser, async (page) => {
    await 無いことを確かめる(page, seedId, 枚数範囲外.map((d) => 名(d.プレイヤー)));
    for (const d of 枚数範囲外) ファイル.set(d.ファイル, デッキCSVを組む([基準({ プレイヤー名: 名(d.プレイヤー), ...d.上書き })]));
  });
});

const 統率重複 = (p: string) => () => [統率の行({ プレイヤー名: 名(p), メインリスト: "1 Commander Card\n2 Main Card A", サイドリスト: "1 Side Card" })];
defineCsvSeed("S-M15-06-CSV-EFFECT-023", { ファイル: "commander_duplicate-023.csv", プレイヤー: ["IT統率者重複-023"], 行: 統率重複("IT統率者重複-023") });
defineCsvSeed("S-M15-06-CSV-EFFECT-024", { ファイル: "commander_duplicate-024.csv", プレイヤー: ["IT統率者明細-024"], 行: 統率重複("IT統率者明細-024") });
defineCsvSeed("S-M15-06-CSV-EFFECT-025", { ファイル: "image_explicit-025.csv", プレイヤー: ["IT代表カード指定-025"], 行: 一行("IT代表カード指定-025", { 代表カード名: 代表カード }) });
defineCsvSeed("S-M15-06-CSV-EFFECT-026", { ファイル: "image_default-026.csv", プレイヤー: ["IT代表画像既定-026"], 行: 一行("IT代表画像既定-026", { 代表カード名: "" }) });
defineCsvSeed("S-M15-06-CSV-EFFECT-027", { ファイル: "tags-027.csv", プレイヤー: ["ITタグ関連-027"], 行: 一行("ITタグ関連-027", { タグ: `${タグA},${タグB}` }) });
defineCsvSeed("S-M15-06-CSV-EFFECT-028", { ファイル: "public_details-028.csv", プレイヤー: ["IT公開明細-028"], 行: 一行("IT公開明細-028", { 表示フラグ: "1", デッキリスト非公開フラグ: "0" }) });
defineCsvSeed("S-M15-06-CSV-EFFECT-029", {
  ファイル: "nonpublic_combinations-029.csv", プレイヤー: ["ITフラグ00-029", "ITフラグ11-029", "ITフラグ01-029"],
  行: () => [
    基準({ プレイヤー名: 名("ITフラグ00-029"), 表示フラグ: "0", デッキリスト非公開フラグ: "0", メインリスト: "2 Main Card A", サイドリスト: "1 Side Card" }),
    基準({ プレイヤー名: 名("ITフラグ11-029"), 表示フラグ: "1", デッキリスト非公開フラグ: "1", メインリスト: "2 Main Card B", サイドリスト: "1 Side Card" }),
    基準({ プレイヤー名: 名("ITフラグ01-029"), 表示フラグ: "0", デッキリスト非公開フラグ: "1", メインリスト: "3 Main Card A", サイドリスト: "2 Side Card" }),
  ],
});
defineCsvSeed("S-M15-06-CSV-EFFECT-030", {
  ファイル: "strict_removed-030.csv", プレイヤー: ["IT厳密処理除去-030"],
  行: 一行("IT厳密処理除去-030", { メインリスト: "1 Restricted Card\n1 Cross Archetype Card", サイドリスト: "1 Side Card", 表示フラグ: "1", デッキリスト非公開フラグ: "0" }),
});
defineCsvSeed("S-M15-06-CSV-EFFECT-031", {
  ファイル: "multi_success-031.csv", プレイヤー: ["IT一括正常A", "IT一括正常B"],
  行: () => [基準({ プレイヤー名: 名("IT一括正常A") }), 基準({ プレイヤー名: 名("IT一括正常B") })],
});
defineCsvSeed("S-M15-06-CSV-EFFECT-032", {
  ファイル: "rollback-032.csv", プレイヤー: ["IT取消対象A", "IT取消対象B"],
  行: () => [基準({ プレイヤー名: 名("IT取消対象A") }), 基準({ プレイヤー名: 名("IT取消対象B"), フォーマット: "NoSuchFormat" })],
  前: (page, seedId) => フォーマットが無いことを確かめる(page, seedId, "NoSuchFormat"),
});
defineSeed("S-M15-06-CSV-FORMAT-035", { needs: マスタ }, async () => { ファイル.set("header_only-035.csv", デッキCSVを組む([])); });
defineCsvSeed("S-M15-06-CSV-REFERENCE-047", {
  ファイル: "M1506-047-unknown_format.csv", プレイヤー: ["M1506-047-A"], 行: 一行("M1506-047-A", { フォーマット: "M1506-047-NoSuchFormat" }),
  前: (page, seedId) => フォーマットが無いことを確かめる(page, seedId, "M1506-047-NoSuchFormat"),
});

defineCsvSeed("S-M15-06-TAG1-053", { ファイル: "tag1-M1506-053.csv", プレイヤー: ["M1506-053-P"], 行: 一行("M1506-053-P", { タグ: タグA }) });

defineSeed("S-M15-06-REIMPORT-054", { needs: マスタ }, async ({ browser }) => {
  const seedId = "S-M15-06-REIMPORT-054";
  await 管理画面(browser, async (page) => {
    await 無いことを確かめる(page, seedId, [名("M1506-054-P"), 名("M1506-054-前")]);
    const id = await 既存デッキを登録する(page, seedId, 名("M1506-054-前"));
    置き換え.set("1506054001", id);
    reportSeedIssue(seedId, `デッキID 1506054001 は DB で入れず、デッキ編集画面で登録したデッキ（ID ${id}）を代わりに使う`);
    ファイル.set("update-M1506-054.csv", デッキCSVを組む([基準({ プレイヤー名: 名("M1506-054-P"), デッキID: id })]));
  });
});

/** 055 のフォーマット・アーキタイプの名前（実行の印つき） */
export const 形式055 = () => ({ 名日: 名("M1506-055-フォーマット"), 名英: 名("M1506-055-Format"), 型日: 名("M1506-055-型"), 型英: 名("M1506-055-Type") });
defineSeed("S-M15-06-FORMAT-055", { needs: マスタ }, async ({ browser }) => {
  const seedId = "S-M15-06-FORMAT-055";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const n = 形式055();
  await 管理画面(browser, async (page) => {
    await フォーマットを揃える(page, { 名日: n.名日, 名英: n.名英, 並び順: "9664", メイン下限: "2", メイン上限: "5", サイド下限: "1", サイド上限: "2", 統率を使う: false }, issue);
    await アーキタイプを用意する(page, { 名日: n.型日, 名英: n.型英, フォーマット: n.名日 }, issue);
    await 無いことを確かめる(page, seedId, [名("M1506-055-P")]);
    ファイル.set("fmt-M1506-055.csv", デッキCSVを組む([基準({
      プレイヤー名: 名("M1506-055-P"), フォーマット: n.名英, アーキタイプ: n.型英, メインリスト: "2 Main Card A\n2 Main Card B", サイドリスト: "1 Side Card", 表示フラグ: "1", デッキリスト非公開フラグ: "0",
    })]));
  });
  issue("並び順は 9664、メタゲーム分析日数は 30（正本は入力範囲内の任意の値とする）");
});

defineCsvSeed("S-M15-06-COMMANDER-056", { ファイル: "no-dup-M1506-056.csv", プレイヤー: ["M1506-056-P"], 行: () => [統率の行({ プレイヤー名: 名("M1506-056-P"), メインリスト: "2 Main Card A", サイドリスト: "1 Side Card" })] });

defineSeed("S-M15-06-MIXED-057", { needs: マスタ }, async ({ browser }) => {
  const seedId = "S-M15-06-MIXED-057";
  await 管理画面(browser, async (page) => {
    await 無いことを確かめる(page, seedId, [名("M1506-057-A"), 名("M1506-057-B"), 名("M1506-057-前")]);
    const id = await 既存デッキを登録する(page, seedId, 名("M1506-057-前"));
    置き換え.set("1506057001", id);
    reportSeedIssue(seedId, `デッキID 1506057001 は DB で入れず、デッキ編集画面で登録したデッキ（ID ${id}）を代わりに使う`);
    ファイル.set("mixed-M1506-057.csv", デッキCSVを組む([
      基準({ プレイヤー名: 名("M1506-057-A"), デッキID: "" }),
      基準({ プレイヤー名: 名("M1506-057-B"), デッキID: id }),
    ]));
  });
});

// ---- 組合せ試験（CB059〜064） ----

/** CBnnn のアーキタイプ・カードの名前（実行の印つき） */
export const CB = (n: string) => ({ 型日: 名(`M1506-CB${n}-型`), 型英: 名(`M1506-CB${n}-Type`), P: 名(`M1506-CB${n}-P`), 旧P: 名(`M1506-CB${n}-旧P`), Pic: 名(`M1506-CB${n}-Pic`) });

type CBの定め = {
  n: "059" | "060" | "061" | "062" | "063" | "064";
  /** 専用のアーキタイプ（フォーマットと代表カード）。無ければ共有の試験アーキタイプを使う */
  型?: { フォーマット: string; 代表カード?: string };
  /** 既存デッキの行（デッキ登録CSVで登録してデッキIDを控える） */
  既存?: () => デッキCSVの行;
  本番: (id: string) => デッキCSVの行;
  前?: (page: Page, seedId: string) => Promise<void>;
};
function defineCbSeed(seedId: string, d: CBの定め): void {
  if (seedId !== `S-M15-06-CBCSV-${d.n}`) throw new Error(`${seedId} と番号 ${d.n} が合わない`);
  defineSeed(seedId, { needs: マスタ }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const c = CB(d.n);
    await 管理画面(browser, async (page) => {
      await 無いことを確かめる(page, seedId, [c.P, c.旧P]);
      if (d.型) await アーキタイプを用意する(page, { 名日: c.型日, 名英: c.型英, フォーマット: d.型.フォーマット, 代表カード: d.型.代表カード }, issue);
      if (d.前) await d.前(page, seedId);
      let id = "";
      if (d.既存) {
        await CSVを取り込む(page, seedId, `m1506-cb${d.n}-setup.csv`, デッキCSVを組む([d.既存()]));
        const ids = await デッキ一覧で探す(page, "player_name", c.旧P);
        if (ids.length !== 1) throw new Error(`${seedId}: プレイヤー名「${c.旧P}」のデッキが1件に決まらない（${ids.length}件）`);
        id = ids[0];
        notes.set(`〔デッキID-M1506-CB${d.n}〕`, id);
        issue(`既存デッキのデッキIDは、デッキ一覧でプレイヤー名「${c.旧P}」を検索した結果の行のデッキID（行から開く編集画面のアドレスの番号と同じ）を控えた`);
      }
      ファイル.set(`m1506-cb${d.n}-main.csv`, デッキCSVを組む([d.本番(id)]));
    });
  });
}

/** 既存デッキ（表示0・非公開1・メインとサイドは空・デッキIDと代表カード名は空） */
const 既存の行 = (n: string, フォーマット: string, アーキタイプ: string, 統率者: string) => (): デッキCSVの行 => 基準({
  プレイヤー名: CB(n).旧P, フォーマット, アーキタイプ, デッキ名: `M1506-CB${n}-旧デッキ`, 表示フラグ: "0", デッキリスト非公開フラグ: "1",
  メインリスト: "", サイドリスト: "", 統率者, デッキID: "", 代表カード名: "",
});
const 本番の行 = (n: string, 上書き: デッキCSVの行): デッキCSVの行 => 基準({ プレイヤー名: CB(n).P, デッキ名: `M1506-CB${n}-デッキ`, ...上書き });

defineCbSeed("S-M15-06-CBCSV-059", {
  n: "059", 型: { フォーマット: 統率, 代表カード },
  前: async (page, seedId) => {
    if (!代表カードのセット) throw new Error(`${seedId}: Feature Card のカードセット・レアリティ・レイアウトを読めていない`);
    await カードを揃える(page, [{ 名英: CB("059").Pic, 画像: "img/goods/cards/m1506-cb059-pic.jpg", セット: 代表カードのセット }], "M1506-CB059 代表画像カード", (m) => reportSeedIssue(seedId, m));
  },
  既存: 既存の行("059", 統率, CB("059").型英, 統率者カード.名英),
  本番: (id) => 本番の行("059", {
    フォーマット: 統率, アーキタイプ: CB("059").型英, 表示フラグ: "1", デッキリスト非公開フラグ: "0",
    メインリスト: "1 Commander Card\n2 Main Card A", サイドリスト: "1 Side Card", 統率者: 統率者カード.名英, デッキID: id, 代表カード名: CB("059").Pic,
  }),
});
defineCbSeed("S-M15-06-CBCSV-060", {
  n: "060",
  既存: 既存の行("060", 標準, 試験型.名英, ""),
  本番: (id) => 本番の行("060", {
    フォーマット: 標準, アーキタイプ: 試験型.名英, 表示フラグ: "1", デッキリスト非公開フラグ: "0",
    メインリスト: "2 Main Card A", サイドリスト: "1 Side Card", 統率者: "", デッキID: id, 代表カード名: "",
  }),
});
defineCbSeed("S-M15-06-CBCSV-061", {
  n: "061", 型: { フォーマット: 統率 },
  既存: 既存の行("061", 統率, CB("061").型英, 統率者カード.名英),
  本番: (id) => 本番の行("061", {
    フォーマット: 統率, アーキタイプ: CB("061").型英, 表示フラグ: "1", デッキリスト非公開フラグ: "0",
    メインリスト: "2 Main Card A", サイドリスト: "1 Side Card", 統率者: 統率者カード.名英, デッキID: id, 代表カード名: 代表カード,
  }),
});
defineCbSeed("S-M15-06-CBCSV-062", {
  n: "062", 型: { フォーマット: 統率, 代表カード },
  本番: () => 本番の行("062", {
    フォーマット: 統率, アーキタイプ: CB("062").型英, 表示フラグ: "0", デッキリスト非公開フラグ: "0",
    メインリスト: "2 Main Card A", サイドリスト: "1 Side Card", 統率者: 統率者カード.名英, デッキID: "", 代表カード名: "",
  }),
});
defineCbSeed("S-M15-06-CBCSV-063", {
  n: "063", 型: { フォーマット: 標準 },
  本番: () => 本番の行("063", {
    フォーマット: 標準, アーキタイプ: CB("063").型英, 表示フラグ: "0", デッキリスト非公開フラグ: "1",
    メインリスト: "2 Main Card A", サイドリスト: "1 Side Card", 統率者: "", デッキID: "", 代表カード名: 代表カード,
  }),
});
defineCbSeed("S-M15-06-CBCSV-064", {
  n: "064", 型: { フォーマット: 統率, 代表カード },
  本番: () => 本番の行("064", {
    フォーマット: 統率, アーキタイプ: CB("064").型英, 表示フラグ: "1", デッキリスト非公開フラグ: "1",
    メインリスト: "2 Main Card A", サイドリスト: "1 Side Card", 統率者: 統率者カード.名英, デッキID: "", 代表カード名: "",
  }),
});

// ---- 連携試験（QM049〜051・RJ058） ----

/** QM・RJ の名前（「QM1506-001-選手」→「QM1506-001-印-選手」） */
export const QM = (n: "001" | "002" | "003", 後: string) => 名(`QM1506-${n}-${後}`);
export const RJ = (後: string) => 名(`RJ1506-001-${後}`);

/** フォーマット（ランキング表示あり・メタ分布簡易化なし）とアーキタイプ（公開・代表カードなし）を用意する */
async function 連携のマスタ(page: Page, seedId: string, v: { 名日: string; 名英: string; 並び順: string; メタ日数: string; 型日: string; 型英: string }): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  await フォーマットを揃える(page, { 名日: v.名日, 名英: v.名英, 並び順: v.並び順, メタ日数: v.メタ日数, ランキング表示: true, メタ分布簡易化: false, 統率を使う: false }, issue);
  await アーキタイプを用意する(page, { 名日: v.型日, 名英: v.型英, フォーマット: v.名日 }, issue);
}

/** 連携試験の取込ファイルの2行目（見出しは20項目） */
function 連携の行(v: { 選手: string; 形式英: string; 型: string; デッキ名: string; 順位: string; 成績: string; 英: string; 日: string; 開催日: string; 参照元: string; 人数: string; デッキID: string }): デッキCSVの行 {
  return {
    プレイヤー名: v.選手, フォーマット: v.形式英, アーキタイプ: v.型, イベント詳細ID: "", デッキ名: v.デッキ名, 順位: v.順位, 成績: v.成績, タグ: "",
    "イベント名(英)": v.英, "イベント名(日)": v.日, イベント開催日: v.開催日, 参照元: v.参照元, イベント参加人数: v.人数, 表示フラグ: "1", デッキリスト非公開フラグ: "1",
    メインリスト: "", サイドリスト: "", 統率者: "", デッキID: v.デッキID, 代表カード名: "",
  };
}

defineSeed("S-M15-06-QM-CSV-049", { needs: ["S-M15-06-QM-ADM"] }, async ({ browser }) => {
  const seedId = "S-M15-06-QM-CSV-049";
  await 管理画面(browser, async (page) => {
    await 連携のマスタ(page, seedId, { 名日: QM("001", "フォーマット"), 名英: QM("001", "Format"), 並び順: "9601", メタ日数: "14", 型日: QM("001", "型"), 型英: QM("001", "Type") });
    await 無いことを確かめる(page, seedId, [QM("001", "選手")]);
    ファイル.set("new-qm001.csv", デッキCSVを組む([連携の行({
      選手: QM("001", "選手"), 形式英: QM("001", "Format"), 型: QM("001", "型"), デッキ名: "QM1506-001-デッキ", 順位: "2", 成績: "QM1506-001-成績",
      英: "QM1506-001-Event", 日: "QM1506-001-大会", 開催日: "2025-03-10 10:00:00", 参照元: "http://example.com/qm1506-001", 人数: "16", デッキID: "",
    })]));
  }, M1506_QM);
});

function defineQmUpdateSeed(seedId: string, n: "002" | "003", 並び順: string, 旧: { 成績: string; デッキ名?: string }, 新: { 成績: string; デッキ名: string }): void {
  defineSeed(seedId, { needs: ["S-M15-06-QM-ADM"] }, async ({ browser, notes }) => {
    await 管理画面(browser, async (page) => {
      await 連携のマスタ(page, seedId, { 名日: QM(n, "フォーマット"), 名英: QM(n, "Format"), 並び順, メタ日数: "14", 型日: QM(n, "型"), 型英: QM(n, "Type") });
      await 無いことを確かめる(page, seedId, [QM(n, "選手")]);
      const id = await デッキを登録する(page, {
        デッキ種別: "event", フォーマット: QM(n, "フォーマット"), アーキタイプ: QM(n, "型"), 公開状態: "公開", デッキリスト非公開: false,
        プレイヤー名: QM(n, "選手"), デッキ名: 旧.デッキ名, イベント名日: `QM1506-${n}-大会旧`, イベント名英: `QM1506-${n}-EventOld`,
        開催日: "2025/03/10 10:00", 順位: "1", 成績: 旧.成績, 参加人数: "16",
      }, (m) => reportSeedIssue(seedId, m));
      notes.set(`〔デッキID-M1506-${n}〕`, id);
      ファイル.set(`update-qm${n}.csv`, デッキCSVを組む([連携の行({
        選手: QM(n, "選手"), 形式英: QM(n, "Format"), 型: QM(n, "型"), デッキ名: 新.デッキ名, 順位: "1", 成績: 新.成績,
        英: `QM1506-${n}-EventNew`, 日: `QM1506-${n}-大会新`, 開催日: "2025-03-10 10:00:00", 参照元: `http://example.com/qm1506-${n}`, 人数: "16", デッキID: id,
      })]));
    }, M1506_QM);
  });
}
defineQmUpdateSeed("S-M15-06-QM-CSV-050", "002", "9602", { 成績: "QM1506-002-成績旧" }, { 成績: "QM1506-002-成績新", デッキ名: "QM1506-002-デッキ" });
defineQmUpdateSeed("S-M15-06-QM-CSV-051", "003", "9603", { 成績: "QM1506-003-成績", デッキ名: "QM1506-003-デッキ旧" }, { 成績: "QM1506-003-成績", デッキ名: "QM1506-003-デッキ新" });

defineSeed("S-M15-06-RJ-CSV-058", { needs: ["S-M15-06-RJ-ADM"] }, async ({ browser }) => {
  const seedId = "S-M15-06-RJ-CSV-058";
  await 管理画面(browser, async (page) => {
    await 連携のマスタ(page, seedId, { 名日: RJ("フォーマット"), 名英: RJ("Format"), 並び順: "9761", メタ日数: "14", 型日: RJ("型"), 型英: RJ("Type") });
    await 無いことを確かめる(page, seedId, [RJ("選手")]);
    ファイル.set("new-rj1506-001.csv", デッキCSVを組む([連携の行({
      選手: RJ("選手"), 形式英: RJ("Format"), 型: RJ("型"), デッキ名: "RJ1506-001-デッキ", 順位: "2", 成績: "RJ1506-001-成績",
      英: "RJ1506-001-Event", 日: "RJ1506-001-大会", 開催日: "2025-03-10 10:00:00", 参照元: "http://example.com/rj1506-001", 人数: "16", デッキID: "",
    })]));
  }, M1506_RJ);
});
