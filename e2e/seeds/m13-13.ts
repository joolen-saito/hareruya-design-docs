/**
 * M13-13 イベント一括登録のシード（画面操作）。正本: cases/M13-13_seed_data.tsv
 *
 * - S-M13-13-ADM: 「M13-13試験管理者」（ログインID m1313_admin）。所属店舗・デフォルト検索表示店舗・編集可能店舗はトーナメントセンター 東京だけ
 *   （大阪店は編集可能店舗に入れない）。権限は「モールオペレーター」で代える（シード表は「イベント管理を操作できる」とだけ書く）。
 *   「店舗オーナー」は所属店舗の店舗しか見えず（DBの行の制限）、013 の「大阪店は見えるが編集できない」状態を作れないため。
 * - S-M13-13-MASTER: 投入方法はDBシード。依頼者の方針（2026-11-09。既にある店舗・マスタ・支払方法を用意するだけのDBシードは、
 *   画面でその存在を確かめる形で代えてよい）により、店舗・選択肢・支払方法が画面に出ることを確かめる。代えたことはシード作成時の問題として残す。
 *   店舗「トーナメントセンター 東京」が無い環境（共有の開発環境）では、店舗登録画面で同じ名前の店舗を作って読み替える（2026-11-10。注記に残す）。
 *   会場（TC 東京）は設計書（0214 sheet-20 L0047「2026/6/11 会場は不要のため削除」）で項目が無くなり、画面にも無いので確かめない。
 * - S-M13-13-CSV-SETTING・S-M13-13-RI-CSVSET: CSV取込の区切り文字は管理画面に設定項目が無いアプリの設定。書き換えず、カンマであることを確かめる（違えば止める）。
 *   セミコロンに設定する 027 は、設定ファイルの書き換えが要るので実装しない。
 * - S-M13-13-HEADER-ONLY-025: 設計書のイベント一括登録CSVシートの44項目を見出しにした1行だけのファイル。
 * - そのほかの取込ファイル: 1行目は取込画面の「雛形ファイルダウンロード」で得た見出し行（アプリの項目名・並び）。
 *   シード表が会場（TC 東京 など）の値を書いていても、会場の列は設けない（設計書 L0047 で削除。雛形にも無い。アプリは列の数が合わない行をエラーにする）。
 *   落とした値は、シード作成時の問題として残す。フリー入力エリア（002〜005）は、シード表が「識別可能な値」とだけ書くので、
 *   エリアの番号とケースの番号を含む値にし、アコーディオン表示はエリア1・3を1、エリア2を0にした。
 * - S-M13-13-QK-FILE-039・S-M13-13-RI-CSV-043・S-M13-13-RI-ADM・S-M13-13-RI-MASTER: 前回のとおり。
 *   S-M13-13-RI-ADM の店舗の英語表記はシード表が決めない必須項目。店舗登録画面は半角英字とスペースだけを受け付けるので、
 *   数字を含まない、他の店舗と重ならない値「Link Shop RI Thirteen」にした。
 *
 * 取込ファイルは e2e/.state/m13-13/ に毎回書き出す（文字コードは UTF-8、改行は LF。031 だけ CRLF）。
 * イベント名(日)は決め打ちの識別の値なので、実行の印を付けた値で作る（依頼者決定 2026-10-28）。名前の頭で数えるケース（020・030・032）は、
 * 頭の部分に印を付ける（「マスタ欠落確認-020-<印>01」）。ケースの「存在しない状態にする」は、名前ごとにイベント一覧で探し、あれば消す
 * （印つきなのでふつうは無い。頭で数える組は、印つきの頭がほかの実行と重ならないので探さない）。
 */
import fs from "node:fs";
import path from "node:path";
import { SETUP_ADMIN, SHARED_ENV, STATE_DIR } from "../config/env";
import { CSV入出力設定 } from "../lib/app_config";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { ensureNoEvent, openEventCreate, registerEvent, searchEventIds } from "../pages/admin/event";
import { EventBulkCsvPage, ダウンロードした文字, 所属店舗の選択肢, 雛形の見出し } from "../pages/admin/m13_13_event_bulk_csv";
import { changeMemberAuthority, ensureMember, findMemberId } from "../pages/admin/member";
import { ensureTenant } from "../pages/admin/tenant";
import { QK1302_ADMIN, QK連携店舗 } from "./m13-02-qk";

export const M1313_ADMIN: Account = { loginId: "m1313_admin", password: "Passw0rd!M1313" };
export const M1313_RI_ADMIN: Account = { loginId: "m1313_ri_admin", password: "Passw0rd-M1313RI" };
export const TC東京 = "トーナメントセンター 東京";
export const 連携店舗 = "連携店舗M1313";
/** 取込で登録するイベントのイベント名(日)（実行の印つき） */
export const QK大会名 = rc("QK取込大会-1313-001");
export const RI大会名 = rc("RI取込大会-001");

// ---- 取込ファイル ----

const RUNTIME_DIR = path.join(STATE_DIR, "m13-13");
/** シードが用意したファイルの名前（ケースが選んでよいもの） */
const PREPARED = new Set<string>();

/** ケースが選ぶ取込ファイルの場所（シードが用意したもの） */
export function m1313File(name: string): string {
  if (!PREPARED.has(name)) throw new Error(`${name} は M13-13 のシードが用意した取込ファイルでない（シードを作っていないか、名前の誤り）`);
  return path.join(RUNTIME_DIR, name);
}

/** 見出しの並びと、各行の「見出し→値」から、区切り文字で区切った文字にする（書いていない見出しの欄は空） */
function 組み立てる(headers: string[], rows: Record<string, string>[], sep: string, eol = "\n"): string {
  const cell = (v: string) => (v.includes(sep) || v.includes('"') || /[\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  for (const r of rows) {
    const unknown = Object.keys(r).filter((k) => !headers.includes(k));
    if (unknown.length) throw new Error(`見出しに無い項目の値がある: ${unknown.join("、")}（見出し: ${headers.join("、")}）`);
  }
  const lines = [headers, ...rows.map((r) => headers.map((h) => r[h] ?? ""))].map((cols) => cols.map(cell).join(sep));
  return lines.join(eol) + eol;
}

function 書き出す(name: string, text: string): void {
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  fs.writeFileSync(path.join(RUNTIME_DIR, name), Buffer.from(text, "utf-8"));
  PREPARED.add(name);
}

/** 取込画面の「雛形ファイルダウンロード」で雛形を受け取り、1行目の見出しの並びを返す */
async function 雛形の見出しを得る(page: import("@playwright/test").Page): Promise<string[]> {
  const bulk = new EventBulkCsvPage(page);
  await bulk.開く();
  return 雛形の見出し(await ダウンロードした文字(await bulk.雛形をダウンロードする()));
}

/**
 * 設計書のイベント一括登録CSVシート（0214 sheet-20）の44項目（識別ID 1〜44 の順）。
 * 設計書の表で2行に分かれて書かれた項目名（「フリー入力エリア1」と「項目名(日)」など）は、間に何も挟まずにつないだ。
 * 括弧の全角・半角は設計書の書き方のまま（「賞品（日）」は全角、「イベント名(日)」は半角）。
 */
const 設計書の44項目 = [
  "イベント名(日)", "イベント名(英)", "店舗", "会場", "フォーマット", "ルール適用度", "公開状態", "バナーURL(日)", "バナーURL(英)", "定員",
  "チーム戦", "クレジットカード支払い", "参加費", "賞品（日）", "賞品（英）",
  ...[1, 2, 3].flatMap((n) => ["項目名(日)", "項目名(英)", "内容(日)", "内容(英)", "アコーディオン表示"].map((x) => `フリー入力エリア${n}${x}`)),
  "開始時間", "受付", "受付時間From", "受付時間To", "デッキ登録", "デッキ登録締切", "オンライン受付", "オンライン受付時間From", "オンライン受付時間To",
  "定員_日程", "参加費_日程", "公開状態_日程", "賞品_日程（日）", "賞品_日程（英）",
];

// ---- 管理者・設定 ----

const M1313_ADMIN_権限 = "モールオペレーター";

/**
 * 店舗「トーナメントセンター 東京」が無い環境（共有の開発環境）では、店舗登録画面で同じ名前の店舗を作って読み替える
 * （テストデータは自作のデータへ読み替えてよい。チームの手順）。手元の環境のように、すでにあればそれを使う。
 * 作ったことはシードの注記に残す（項目表の備考に書く）。
 */
async function TC東京を用意する(page: import("@playwright/test").Page, issue: (m: string) => void): Promise<void> {
  if ((await 所属店舗の選択肢(page)).includes(TC東京)) return;
  const id = await ensureTenant(page, {
    店名: TC東京, 店名カナ: "トーナメントセンタートウキョウ", 店名英語: "Tournament Center Tokyo", 支店URL: "m1313tctokyo", 店名略称3文字: "TC東", ショップ名略称: TC東京,
  }, issue);
  issue(`店舗「${TC東京}」が無い環境なので（シード表の投入方法はDBシード）、店舗登録画面で同じ名前の店舗を登録して読み替えた（店舗ID ${id}）`);
}

defineSeed("S-M13-13-ADM", async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await TC東京を用意する(page, (m) => reportSeedIssue(seed.シードID, m));
    try {
      const 名前 = "M13-13試験管理者";
      // 前に「店舗オーナー」で登録したメンバーが残っていれば、権限だけ画面で変える
      const found = await findMemberId(page, 名前);
      if (found) await changeMemberAuthority(page, found, M1313_ADMIN_権限);
      await ensureMember(page, {
        名前, 所属店舗: TC東京, ログインID: M1313_ADMIN.loginId, メールアドレス: "m1313_admin@example.test",
        パスワード: M1313_ADMIN.password, 権限: M1313_ADMIN_権限, デフォルト検索表示店舗: TC東京, 編集可能店舗: [TC東京],
      });
    } catch (e) {
      const m = (e as Error).message.split("\n")[0];
      if (m.includes(`「${TC東京}」が無い`)) {
        throw new Error(`${seed.シードID}: 店舗「${TC東京}」がメンバー登録画面の選択肢に無い。この店舗は S-M13-13-MASTER（DBシード）が用意する店舗で、E2E では作らない（${m}）`);
      }
      throw e;
    }
  });
  // ログインでき（稼働中）、イベント一括登録画面を開けることを、別のセッションで確かめる
  await withAdminSession(browser, M1313_ADMIN, async (page) => { await new EventBulkCsvPage(page).開く(); });
});

/** 区切り文字がカンマであることを確かめるシード */
function defineCommaSettingSeed(seedId: string): void {
  defineSeed(seedId, async () => {
    // 管理画面に設定項目が無い。設定を書き換えず、取込の区切り文字がカンマであることだけを確かめる（違えば止める）
    if (SHARED_ENV) {
      // 共有の環境ではアプリの設定値を読む手段が無い。止めずに、確かめられなかったことを注記に残す（取込はカンマ区切りのファイルで行うので、
      // 区切り文字が違えば取込そのものが失敗し、ケースは期待結果で落ちる）
      reportSeedIssue(seedId, "共有の環境ではアプリの設定値を読めないため、CSV取込の区切り文字が既定（カンマ）であることは確かめていない。取込はカンマ区切りのファイルで行った");
      return;
    }
    const got = CSV入出力設定().取込区切り文字;
    if (got !== ",") throw new Error(`${seedId}: CSV取込の区切り文字が「${got}」（シード表はカンマ）。設定ファイルは書き換えない決まりなので止める`);
  });
}
defineCommaSettingSeed("S-M13-13-CSV-SETTING");
defineCommaSettingSeed("S-M13-13-RI-CSVSET");

// ---- 取込ファイル（M13-13-ADM を使うケース） ----

defineSeed("S-M13-13-HEADER-ONLY-025", async ({ seed }) => {
  if (設計書の44項目.length !== 44) throw new Error(`${seed.シードID}: 見出しの項目数が ${設計書の44項目.length}（44のはず）`);
  書き出す("M13-13-HEADER-ONLY-025.csv", 組み立てる(設計書の44項目, [], ","));
});

// ---- QK連携（039） ----

defineSeed("S-M13-13-QK-FILE-039", { needs: ["S-M13-02-QK-ADM"] }, async ({ browser }) => {
  await withAdminSession(browser, QK1302_ADMIN, async (page) => {
    // 同じイベント名のイベントがあれば消す（実行の印つきの名前なので、ふつうは無い）
    await ensureNoEvent(page, QK大会名);
    const headers = await 雛形の見出しを得る(page);
    書き出す("QK-1313-001.tsv", 組み立てる(headers, [{
      "イベント名(日)": QK大会名, "イベント名(英)": "QK Import Event 1313-001", 店舗: QK連携店舗, フォーマット: "スタンダード", ルール適用度: "初心者歓迎",
      公開状態: "公開", 定員: "16", チーム戦: "0", 参加費: "500", 開始時間: "2030-10-21 10:00", 受付: "なし", デッキ登録: "なし", オンライン受付: "なし",
      公開状態_日程: "公開",
    }], "\t"));
  });
});

// ---- 連携（043） ----

defineSeed("S-M13-13-RI-ADM", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    notes.set("〔店舗ID-M1313-RI共有〕", await ensureTenant(page, {
      店名: 連携店舗, 店名カナ: "レンケイテンポエムイチサンイチサン", 店名英語: "Link Shop RI Thirteen", 支店URL: "m1313ri", 店名略称3文字: "R13", ショップ名略称: 連携店舗,
    }, (m) => reportSeedIssue(seed.シードID, m)));
    await ensureMember(page, {
      名前: "M13-13連携試験管理者", 所属店舗: 連携店舗, ログインID: M1313_RI_ADMIN.loginId, メールアドレス: "m1313_ri_admin@example.test",
      パスワード: M1313_RI_ADMIN.password, 権限: "店舗オーナー", デフォルト検索表示店舗: 連携店舗, 編集可能店舗: [連携店舗],
    });
  });
  // ログインでき（有効・ロックなし）、イベント一括登録画面を開けることを、別のセッションで確かめる
  await withAdminSession(browser, M1313_RI_ADMIN, async (page) => { await new EventBulkCsvPage(page).開く(); });
});

defineSeed("S-M13-13-RI-MASTER", async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const form = await openEventCreate(page);
    const missing: string[] = [];
    for (const [名, sel, n] of [["フォーマット", form.フォーマット, "スタンダード"], ["ルール適用度", form.ルール適用度, "初心者歓迎"], ["公開状態", form.公開状態, "公開"]] as const) {
      const have = await form.options(sel);
      if (!have.includes(n)) missing.push(`${名}「${n}」（ある選択肢: ${have.join("、")}）`);
    }
    // 「スタンダード」が無いときのフォーマット登録は、手元の環境では要らない（初期データにある）ので作り方を書いていない。無ければ止める
    if (missing.length) throw new Error(`${seed.シードID}: イベント登録画面の選択肢に無い: ${missing.join(" / ")}`);
  });
});

defineSeed("S-M13-13-RI-CSV-043", { needs: ["S-M13-13-RI-ADM"] }, async ({ browser, seed }) => {
  await withAdminSession(browser, M1313_RI_ADMIN, async (page) => {
    const left = await searchEventIds(page, RI大会名);
    if (left.length) throw new Error(`${seed.シードID}: イベント名「${RI大会名}」のイベントがすでにある（イベントID ${left.join("、")}）`);
    const headers = await 雛形の見出しを得る(page);
    書き出す("M13-13-RI-001.csv", 組み立てる(headers, [{
      "イベント名(日)": RI大会名, "イベント名(英)": "RI Import Cup 001", 店舗: 連携店舗, フォーマット: "スタンダード", ルール適用度: "初心者歓迎", 公開状態: "公開",
      定員: "16", チーム戦: "0", クレジットカード支払い: "なし", 参加費: "0", 開始時間: "2026-12-18 10:00", 受付: "なし", デッキ登録: "なし",
      オンライン受付: "あり", オンライン受付時間From: "2026-10-20 12:00", オンライン受付時間To: "2026-12-17 12:00", 公開状態_日程: "公開",
    }], ","));
  });
});

// ---- 取込用マスタ（S-M13-13-MASTER） ----

export const クレジットカード支払 = "クレジットカード決済";

defineSeed("S-M13-13-MASTER", async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await TC東京を用意する(page, issue);
    const missing: string[] = [];
    const 店舗 = await 所属店舗の選択肢(page);
    for (const n of [TC東京, "大阪店"]) {
      const k = 店舗.filter((x) => x === n).length;
      if (k === 0) missing.push(`店舗「${n}」（メンバー登録画面の所属店舗の選択肢）`);
      if (k > 1) issue(`店舗「${n}」がメンバー登録画面の所属店舗の選択肢に ${k} 件ある（同名の店舗が複数）。取込は店舗を名前で引くので、どれが使われるかは画面から決められない`);
    }
    const form = await openEventCreate(page);
    const 欄: [string, import("@playwright/test").Locator, string[]][] = [
      ["フォーマット", form.フォーマット, ["パウパー", "モダン"]], ["ルール適用度", form.ルール適用度, ["カジュアル"]], ["公開状態", form.公開状態, ["公開", "非公開"]],
    ];
    for (const [名, sel, names] of 欄) {
      const have = await form.options(sel);
      for (const n of names) if (!have.includes(n)) missing.push(`${名}「${n}」（ある選択肢: ${have.join("、")}）`);
    }
    const 支払 = await form.支払方法の選択肢();
    if (!支払.includes(クレジットカード支払)) missing.push(`支払方法「${クレジットカード支払}」（ある選択肢: ${支払.join("、")}）`);
    if (missing.length) throw new Error(`${seed.シードID}: 画面に無い: ${missing.join(" / ")}`);
  });
  issue(`投入方法の「DBシードで各マスタとクレジットカード支払方法を登録する」は行わず（DBへ書かない決まり。依頼者の方針 2026-11-09）、店舗「${TC東京}」「大阪店」がメンバー登録画面の所属店舗の選択肢に、フォーマット「パウパー」「モダン」・ルール適用度「カジュアル」・公開状態「公開」「非公開」・支払方法「${クレジットカード支払}」がイベント登録画面の選択肢にあることを確かめた。会場「TC 東京」は設計書（L0047）で項目が削除され画面にも無いので確かめていない`);
});

// ---- 取込ファイル（S-M13-13-ADM を使うケース） ----

type 行 = Record<string, string>;
type ファイル = {
  名前: string; 行: 行[];
  /** シード表が書いた会場の値（列を設けないので落とす。落としたことを残す） */
  会場?: string;
  区切り?: "," | "\t"; 改行?: "\n" | "\r\n";
  /** 「存在しない状態にする」イベント名(日)。あればイベント一覧から消す */
  無くす?: string[];
};

let 雛形の見出しの控え: string[] | null = null;
async function 見出しを控える(browser: import("@playwright/test").Browser): Promise<string[]> {
  if (!雛形の見出しの控え) 雛形の見出しの控え = await withAdminSession(browser, M1313_ADMIN, (page) => 雛形の見出しを得る(page));
  return 雛形の見出しの控え;
}

/** 取込ファイルのシード（雛形の見出しで作る） */
function defineFileSeed(seedId: string, f: () => ファイル): void {
  defineSeed(seedId, { needs: ["S-M13-13-ADM"] }, async ({ browser, seed }) => {
    const v = f();
    if (v.無くす?.length) {
      await withAdminSession(browser, M1313_ADMIN, async (page) => { for (const n of v.無くす ?? []) await ensureNoEvent(page, n); });
    }
    const headers = await 見出しを控える(browser);
    if (v.会場 !== undefined) {
      reportSeedIssue(seed.シードID, `シード表の会場「${v.会場}」は、設計書（L0047「2026/6/11 会場は不要のため削除」）で項目が削除され、取込画面の雛形にも列が無いので、会場の列を設けずに作った`);
    }
    書き出す(v.名前, 組み立てる(headers, v.行, v.区切り ?? ",", v.改行 ?? "\n"));
  });
}

const 親 = (名日: string, 名英: string, over: 行 = {}): 行 => ({
  "イベント名(日)": 名日, "イベント名(英)": 名英, 店舗: TC東京, フォーマット: "パウパー", ルール適用度: "カジュアル", 公開状態: "公開",
  定員: "32", チーム戦: "0", クレジットカード支払い: "なし", 参加費: "1000", ...over,
});
/** 受付・デッキ登録・オンライン受付なし、公開状態_日程=公開の日程 */
const 日程 = (開始時間: string, over: 行 = {}): 行 => ({ 開始時間, 受付: "なし", デッキ登録: "なし", オンライン受付: "なし", 公開状態_日程: "公開", ...over });

/** 002〜005 の全項目のイベント名(日)（実行の印つき） */
export const 全項目イベント名 = (n: string) => rc(`結合イベント完全-${n}`);
/** 002〜005 のフリー入力エリアの値（シード表は「識別可能な値」とだけ書く） */
export const フリー入力エリアの値 = (n: string) => [1, 2, 3].map((i) => ({
  "項目名(日)": `フリー${i}項目名-${n}`, "項目名(英)": `Free${i} Label-${n}`, "内容(日)": `フリー${i}内容-${n}`, "内容(英)": `Free${i} Content-${n}`, アコーディオン表示: i === 2 ? "0" : "1",
}));
function 全項目ファイル(n: string): () => ファイル {
  return () => {
    const free: 行 = {};
    フリー入力エリアの値(n).forEach((a, k) => { for (const [x, val] of Object.entries(a)) free[`フリー入力エリア${k + 1}${x}`] = val; });
    return {
      名前: `M13-13-ALL-${n}.csv`, 会場: "TC 東京", 無くす: [全項目イベント名(n)],
      行: [{
        ...親(全項目イベント名(n), `Integration Event Full-${n}`, {
          "バナーURL(日)": "https://files.hareruyamtg.com/banner/jp.jpeg", "バナーURL(英)": "https://files.hareruyamtg.com/banner/en.jpeg",
          定員: "100", チーム戦: "1", クレジットカード支払い: "あり", 参加費: "2000", "賞品 (日)": "参加賞", "賞品 (英)": "Entry Prize",
        }),
        ...free,
        ...日程("2026-10-10 15:00", {
          受付: "あり", 受付時間From: "13:00", 受付時間To: "14:30", デッキ登録: "あり", デッキ登録締切: "2026-10-10 14:00",
          オンライン受付: "あり", オンライン受付時間From: "2026-10-01 12:00", オンライン受付時間To: "2026-10-10 12:00",
          定員_日程: "32", 参加費_日程: "1500", 公開状態_日程: "非公開", "賞品_日程(日)": "日程参加賞", "賞品_日程(英)": "Schedule Prize",
        }),
      }],
    };
  };
}
defineFileSeed("S-M13-13-ALL-002", 全項目ファイル("002"));
defineFileSeed("S-M13-13-ALL-003", 全項目ファイル("003"));
defineFileSeed("S-M13-13-ALL-004", 全項目ファイル("004"));
defineFileSeed("S-M13-13-ALL-005", 全項目ファイル("005"));

export const 名006 = { A: rc("一括イベントA-006"), B: rc("一括イベントB-006") };
defineFileSeed("S-M13-13-MULTI-006", () => ({
  名前: "M13-13-MULTI-006.csv", 会場: "TC 東京", 無くす: [名006.A, 名006.B],
  行: [{ ...親(名006.A, "Bulk-A-006"), ...日程("2026-10-20 15:00") }, { ...親(名006.B, "Bulk-B-006"), ...日程("2026-10-21 15:00") }],
}));

export const 名007 = rc("日程なしイベント-007");
defineFileSeed("S-M13-13-PARENT-ONLY-007", () => ({ 名前: "M13-13-PARENT-ONLY-007.csv", 会場: "TC 東京", 無くす: [名007], 行: [親(名007, "Parent-Only-M1313-007")] }));

export const 名008 = rc("日程既定値イベント-008");
defineFileSeed("S-M13-13-DEFAULTS-008", () => ({
  名前: "M13-13-DEFAULTS-008.csv", 会場: "TC 東京", 無くす: [名008],
  行: [{ ...親(名008, "Schedule-Defaults-M1313-008", { 定員: "80", 参加費: "1200" }), ...日程("2026-11-01 15:00") }],
}));

export const 名009 = rc("新規登録確認イベント-009");
defineSeed("S-M13-13-EXISTING-009", { needs: ["S-M13-13-ADM"] }, async ({ browser, notes }) => {
  await withAdminSession(browser, M1313_ADMIN, async (page) => {
    // 同じイベント名のイベントがあれば消してから（実行の印つきなので、ふつうは無い）、日程なしで登録する
    await ensureNoEvent(page, 名009);
    // 残りの必須項目（フォーマット・ルール適用度・公開状態・定員）は「選べる任意の値」。取込のファイルと同じ値にした
    notes.set("〔イベントID-M1313-009〕", await registerEvent(page, {
      イベント名日: 名009, イベント名英: "Existing-M1313-009", 店舗: TC東京, 参加費: "500",
      フォーマット: ["パウパー"], ルール適用度: "カジュアル", 公開状態: "公開", 定員: "32",
    }));
  });
});
// 既存イベントと同じ名前で取り込むので、このシードでは同名のイベントを消さない
defineFileSeed("S-M13-13-NEW-ONLY-009", () => ({ 名前: "M13-13-NEW-ONLY-009.csv", 会場: "TC 東京", 行: [親(名009, "New-M1313-009", { 参加費: "900" })] }));

export const 名010 = rc("複数フォーマットイベント-010");
defineFileSeed("S-M13-13-FORMATS-010", () => ({
  名前: "M13-13-FORMATS-010.csv", 会場: "TC 東京", 無くす: [名010], 行: [親(名010, "Multi-Format-M1313-010", { フォーマット: "パウパー,モダン" })],
}));

export const 名011 = { あり: rc("カードありイベント-011"), なし: rc("カードなしイベント-011"), 空: rc("カード空イベント-011") };
defineFileSeed("S-M13-13-PAYMENTS-011", () => ({
  名前: "M13-13-PAYMENTS-011.csv", 会場: "TC 東京", 無くす: Object.values(名011),
  行: [
    親(名011.あり, "Card-Yes-M1313-011", { 参加費: "0", クレジットカード支払い: "あり" }),
    親(名011.なし, "Card-No-M1313-011", { 参加費: "0", クレジットカード支払い: "なし" }),
    親(名011.空, "Card-Empty-M1313-011", { 参加費: "0", クレジットカード支払い: "" }),
  ],
}));

export const 名013 = rc("編集不可店舗イベント-013");
defineFileSeed("S-M13-13-UNEDITABLE-013", () => ({
  名前: "M13-13-UNEDITABLE-013.csv", 会場: "TC 東京", 無くす: [名013], 行: [親(名013, "Uneditable-Shop-M1313-013", { 店舗: "大阪店" })],
}));

export const 頭020 = rc("マスタ欠落確認-020");
const 不存在 = { 店舗: "不存在店舗-020", フォーマット: "不存在フォーマット-020", ルール適用度: "不存在ルール-020", 公開状態: "不存在公開状態-020" };
defineSeed("S-M13-13-MASTER-MISSING-020", { needs: ["S-M13-13-ADM"] }, async ({ browser, seed }) => {
  // 「各マスタから削除し、存在しない状態にする」: マスタは消さず、画面の選択肢に無いことを確かめる（あれば止める）
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const found: string[] = [];
    if ((await 所属店舗の選択肢(page)).includes(不存在.店舗)) found.push(`店舗「${不存在.店舗}」`);
    const form = await openEventCreate(page);
    const 欄: ["フォーマット" | "ルール適用度" | "公開状態", import("@playwright/test").Locator][] = [
      ["フォーマット", form.フォーマット], ["ルール適用度", form.ルール適用度], ["公開状態", form.公開状態],
    ];
    for (const [名, sel] of 欄) if ((await form.options(sel)).includes(不存在[名])) found.push(`${名}「${不存在[名]}」`);
    if (found.length) throw new Error(`${seed.シードID}: 存在しないはずのマスタが画面の選択肢にある: ${found.join(" / ")}。マスタは消さないので止める`);
  });
  reportSeedIssue(seed.シードID, "「各マスタから削除し、存在しない状態にする」はマスタを消さず、画面の選択肢（店舗はメンバー登録画面、ほかはイベント登録画面）に無いことを確かめた");
  const 行: 行[] = ["01", "02", "03", "04", "05"].map((k) => 親(`${頭020}${k}`, `Master-Missing-M1313-020-${k}`));
  行[0].店舗 = 不存在.店舗;
  // 2行目の「会場=不存在会場-020」は、会場の列が無いので入れられない（2行目はほかの値が正常な行になる）
  行[2].フォーマット = 不存在.フォーマット;
  行[3].ルール適用度 = 不存在.ルール適用度;
  行[4].公開状態 = 不存在.公開状態;
  reportSeedIssue(seed.シードID, "2行目の会場「不存在会場-020」は、会場の列が無い（設計書 L0047 で削除）ので入れられず、2行目はほかの値が正常な行になった");
  書き出す("M13-13-MASTER-MISSING-020.csv", 組み立てる(await 見出しを控える(browser), 行, ","));
});

export const 名021 = { 正常: rc("取消確認正常行-021"), 不正: rc("取消確認不正行-021") };
defineFileSeed("S-M13-13-ROLLBACK-021", () => ({
  名前: "M13-13-ROLLBACK-021.csv", 会場: "TC 東京", 無くす: [名021.正常, 名021.不正],
  行: [
    { ...親(名021.正常, "Rollback-Valid-M1313-021"), ...日程("2026-12-26 15:00") },
    { ...親(名021.不正, "Rollback-Invalid-M1313-021", { 店舗: "" }), ...日程("2026-12-26 15:00") },
  ],
}));

export const 名022 = rc("複数エラー確認-022");
defineFileSeed("S-M13-13-MULTI-ERROR-022", () => ({
  名前: "M13-13-MULTI-ERROR-022.csv", 会場: "TC 東京", 無くす: [名022],
  行: [親("", "Multi-Error-Row2-M1313-022"), 親(名022, "Multi-Error-Row3-M1313-022", { 店舗: "" })],
}));

export const 名026 = rc("TSV取込イベント-026");
defineFileSeed("S-M13-13-TSV-026", () => ({
  名前: "M13-13-TSV-026.tsv", 会場: "TC 東京", 区切り: "\t", 無くす: [名026], 行: [{ ...親(名026, "TSV-Import-M1313-026"), ...日程("2026-12-20 15:00") }],
}));

export const 名028 = rc("複数日程指定イベント-028");
defineFileSeed("S-M13-13-SAME-NAME-028", () => ({
  名前: "M13-13-SAME-NAME-028.csv", 会場: "TC 東京", 無くす: [名028],
  行: [{ ...親(名028, "Multiple-Schedule-M1313-028"), ...日程("2027-01-10 15:00") }, { ...親(名028, "Multiple-Schedule-M1313-028"), ...日程("2027-01-17 15:00") }],
}));

export const 頭030 = { 確認: rc("行上限確認-030"), 超過: rc("行上限超過-030") };
const 連番 = (k: number) => String(k).padStart(4, "0");
defineFileSeed("S-M13-13-LINES-4999-030", () => ({
  名前: "M13-13-LINES-4999-030.csv", 会場: "TC 東京",
  行: Array.from({ length: 4998 }, (_, i) => 親(`${頭030.確認}${連番(i + 1)}`, `Line-Limit-Valid-M1313-030-${連番(i + 1)}`)),
}));
defineFileSeed("S-M13-13-LINES-5000-030", () => ({
  名前: "M13-13-LINES-5000-030.csv", 会場: "TC 東京",
  行: Array.from({ length: 4999 }, (_, i) => 親(`${頭030.超過}${連番(i + 1)}`, `Line-Limit-Exceeded-M1313-030-${連番(i + 1)}`)),
}));

/** 031: 期待する名前（ゼロ幅スペースなし）。ファイルには「正規化確認」と「イベント」の間にゼロ幅スペースを1文字挟む */
export const 名031 = rc("正規化確認イベント");
defineFileSeed("S-M13-13-NORMALIZE-031", () => ({
  名前: "M13-13-NORMALIZE-031.csv", 会場: "TC 東京", 改行: "\r\n", 無くす: [名031],
  行: [親(名031.replace("正規化確認", "正規化確認​"), "Normalize-M1313-031", { "フリー入力エリア1内容(日)": "一行目\r\n二行目" })],
}));

export const 頭032 = rc("中断確認-032");
defineFileSeed("S-M13-13-BREAK-032", () => ({
  名前: "M13-13-BREAK-032.csv", 会場: "TC 東京",
  行: [
    親(`${頭032}前行`, "Break-Before-M1313-032"), 親(`${頭032}不正行`, "Break-Invalid-M1313-032", { 店舗: "" }), 親(`${頭032}後行`, "Break-After-M1313-032"),
  ],
}));

export const 名036 = rc("カード無し無料オンライン受付イベント-M1313-036");
defineFileSeed("S-M13-13-FREE-ONLINE-036", () => ({
  名前: "M13-13-FREE-ONLINE-036.csv", 会場: "TC 東京", 無くす: [名036],
  行: [{ ...親(名036, "Credit-None-Free-M1313-036", { 参加費: "0" }), ...日程("2026-12-15 15:00", { オンライン受付: "あり", オンライン受付時間From: "2026-12-01 10:00", オンライン受付時間To: "2026-12-10 15:00" }) }],
}));

export const 名037 = rc("カード無し有料受付なしイベント-M1313-037");
defineFileSeed("S-M13-13-NOONLINE-PAID-037", () => ({
  名前: "M13-13-NOONLINE-PAID-037.csv", 会場: "TC 東京", 無くす: [名037], 行: [{ ...親(名037, "Credit-None-Paid-M1313-037"), ...日程("2026-12-16 15:00") }],
}));

export const 名038 = rc("会場列なしイベント-M1313-038");
defineFileSeed("S-M13-13-NOVENUE-038", () => ({
  名前: "M13-13-NOVENUE-038.csv", 無くす: [名038], 行: [{ ...親(名038, "No-Venue-Column-M1313-038", { 参加費: "0" }), ...日程("2026-12-17 15:00") }],
}));

export const 名040 = { A: rc("混在日程ありイベント-M1313-040A"), B: rc("混在日程なしイベント-M1313-040B") };
defineFileSeed("S-M13-13-MIXED-040", () => ({
  名前: "M13-13-MIXED-040.csv", 無くす: [名040.A, 名040.B],
  行: [{ ...親(名040.A, "Mixed-With-M1313-040A"), ...日程("2026-10-20 15:00") }, 親(名040.B, "Mixed-Without-M1313-040B")],
}));

export const 名042 = rc("日程無料カード無しイベント-M1313-042");
defineFileSeed("S-M13-13-FEE-ZERO-042", () => ({
  名前: "M13-13-FEE-ZERO-042.csv", 無くす: [名042],
  行: [{ ...親(名042, "Credit-None-Free-Slot-M1313-042"), ...日程("2027-01-10 15:00", { オンライン受付: "あり", オンライン受付時間From: "2026-12-20 10:00", オンライン受付時間To: "2027-01-05 15:00", 参加費_日程: "0" }) }],
}));

const オンライン0120_0130 = { オンライン受付: "あり", オンライン受付時間From: "2027-01-20 10:00", オンライン受付時間To: "2027-01-30 15:00" };
export const 名044 = rc("M1313-CB044-カード有オンライン親無料");
defineFileSeed("S-M13-13-CBF-044", () => ({
  名前: "M13-13-CB044.csv", 無くす: [名044],
  行: [{ ...親(名044, "M1313-CB044-Card-Yes-Online-Free", { クレジットカード支払い: "あり", 参加費: "0" }), ...日程("2027-02-01 15:00", オンライン0120_0130) }],
}));
export const 名045 = rc("M1313-CB045-カード有日程無料指定");
defineFileSeed("S-M13-13-CBS-045", () => ({
  名前: "M13-13-CB045.csv", 無くす: [名045],
  行: [{ ...親(名045, "M1313-CB045-Card-Yes-SlotFree", { クレジットカード支払い: "あり", 参加費: "1500" }), ...日程("2027-02-02 15:00", { 参加費_日程: "0" }) }],
}));
export const 名046 = rc("M1313-CB046-カード有オンライン親有料");
defineFileSeed("S-M13-13-CBP-046", () => ({
  名前: "M13-13-CB046.csv", 無くす: [名046],
  行: [{ ...親(名046, "M1313-CB046-Card-Yes-Online-Paid", { クレジットカード支払い: "あり", 参加費: "1200" }), ...日程("2027-02-03 15:00", オンライン0120_0130) }],
}));
export const 名047 = rc("M1313-CB047-カード有日程有料指定");
defineFileSeed("S-M13-13-CBS-047", () => ({
  名前: "M13-13-CB047.csv", 無くす: [名047],
  行: [{ ...親(名047, "M1313-CB047-Card-Yes-SlotPaid", { クレジットカード支払い: "あり", 参加費: "0" }), ...日程("2027-02-04 15:00", { 参加費_日程: "800" }) }],
}));
/** 048・049: 開始時間は空、受付・デッキ登録・オンライン受付は「なし」、そのほかの日程項目は空（シード表のとおり） */
const 日程なしの受付なし = { 受付: "なし", デッキ登録: "なし", オンライン受付: "なし" };
export const 名048 = rc("M1313-CB048-カード有開始時間なし");
defineFileSeed("S-M13-13-CBN-048", () => ({
  名前: "M13-13-CB048.csv", 無くす: [名048], 行: [親(名048, "M1313-CB048-Card-Yes-NoStart", { クレジットカード支払い: "あり", 参加費: "0", ...日程なしの受付なし })],
}));
export const 名049 = rc("M1313-CB049-カード無開始時間なし");
defineFileSeed("S-M13-13-CBN-049", () => ({
  名前: "M13-13-CB049.csv", 無くす: [名049], 行: [親(名049, "M1313-CB049-Card-No-NoStart", { クレジットカード支払い: "なし", 参加費: "1000", ...日程なしの受付なし })],
}));
