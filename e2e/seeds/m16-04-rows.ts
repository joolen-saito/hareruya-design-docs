/**
 * M16-04 MTGマスターデータ編集 の、共有のマスタに試験の行を足す・書き換えるシード（2026-11-12 追加。夜の1本流しで流す前提）。
 * 正本: cases/M16-04_seed_data.tsv
 *
 * 共有のマスタ（カードタイプ・カラー・レアリティ・キャンペーンタグ・デッキタグなど）の書き換え方（PM 2026-11-12・依頼者 2026-11-11「ちゃんと元に戻してね」）:
 * - 書き換える前に、その種別の一覧の全行（識別番号と全項目の画面の値）を画面で読んで控え、lib/shared_restore.ts の registerRestore に
 *   「画面で、足した行（印つき・この実行で足した番号）を全項目空にして消し、元の行を控えた値に戻して登録し、開き直して控えと同じかを確かめる」を登録する。
 *   この画面の「登録」は既存の全行を保存し直す作りなので、ケースの手順が既存の行を書き換えても、ケースの終わりに控えた値へ戻す。
 * - 足す行には決まった印（「-E2E」。lib/run_marker.ts の rcFixed）を付ける。カラーの名前は20文字までなので、印を付けると20文字を超える値は
 *   正本の値の「-M1604-」を「-」に縮めてから印を付ける（ケースはその値そのものを確かめない。spec の注記に正本の値との対応を残す）。
 * - 前の実行の残り（このシードが使う印つきの名前の行）は、控える前に消す（E2E が作った行だけ）。
 * - シード表の「既存の行をすべて空にして0件にする」「DBで既存の行を削除する」「DBで境界IDの行を指定値にする」「DBで採番を46に合わせる」は、
 *   共有のデータを消すことになるので行わない。既存の行は残したまま試験の行を足す（件数・境界の行は spec の注記で読み替えを残す）。
 * - 書き換えてよいのは、夜に1本だけで流す回（E2E_ALLOW_SHARED=1）か手元の環境だけ。ほかの共有の環境では書き換えずに止まる。
 */
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN, SHARED_ENV } from "../config/env";
import { Notes } from "../lib/notes";
import { FIXED_MARK, rc, rcFixed, RUN_MARK } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { registerRestore } from "../lib/shared_restore";
import { Account, withAdminSession } from "../lib/session";
import { expectSaved } from "../pages/admin/common";
import { アーキタイプを登録する } from "../pages/admin/f09_01_setup";
import { フォーマットを登録する } from "../pages/admin/f09_02_setup";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";
import { デッキを登録する, デッキ編集画面 } from "../pages/admin/m15_05_deck_edit";
import { MtgMasterEditPage, マスタの行, 列の値, 日時の表示にそろえる } from "../pages/admin/m16_04_master";
import { adminUrl } from "../lib/session";
import { defineSeed } from "./current_seed";
import "./m16-04";

type Issue = (m: string) => void;

/** 足す行の値に付ける決まった印 */
export const 印 = (v: string): string => rcFixed(v);
/** カラーの名前（20文字まで）に印を付けた値。超えるときは「-M1604-」を「-」に縮めてから付ける */
export function カラーの名(v: string): string {
  if (`${v}-${FIXED_MARK}`.length <= 20) return rcFixed(v);
  const s = `${v.replace("-M1604-", "-")}-${FIXED_MARK}`;
  if (s.length > 20) throw new Error(`カラーの名前「${v}」は、縮めても20文字を超える`);
  return s;
}
const 印つき = (v: string): boolean => v.toUpperCase().endsWith(`-${FIXED_MARK}`);

function 共有の書き換えを許す(seedId: string): void {
  if (SHARED_ENV && process.env.E2E_ALLOW_SHARED !== "1") {
    throw new Error(`${seedId}: 共有の環境では共有のMTGマスターデータを書き換えない。夜に1本だけで流す回（E2E_ALLOW_SHARED=1）でだけ書き換える`);
  }
}

async function 開く(page: Page, 種別: string): Promise<MtgMasterEditPage> {
  page.setDefaultTimeout(60_000);
  const m = new MtgMasterEditPage(page);
  await m.open();
  await m.種別を選んで表示する(種別);
  return m;
}

const 同じ値 = (a: string | undefined, b: string): boolean => 日時の表示にそろえる(a ?? "") === 日時の表示にそろえる(b);

/** 画面で、足した行を消し、元の行を控えた値に戻して登録する */
async function 元に戻す(browser: Browser, 種別: string, 前: マスタの行[], 足した: Set<number>): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const m = await 開く(page, 種別);
    const 今 = await m.全行を読む();
    const 無い = 前.filter((r) => !今.some((x) => x.番号 === r.番号)).map((r) => r.番号);
    if (無い.length) throw new Error(`MTGマスターデータ「${種別}」の元の行（番号 ${無い.join("・")}）が消えている。画面では同じ番号で作り直せないので戻せない`);
    const 前の = new Map(前.map((r) => [r.番号, r.値]));
    let 変える = 0;
    for (const r of 今) {
      const v = 前の.get(r.番号);
      if (v) {
        const 違う = Object.fromEntries(Object.entries(v).filter(([k, x]) => r.値[k] !== x));
        if (Object.keys(違う).length) { await m.行に入れる(r.番号, 違う); 変える += 1; }
      } else if (足した.has(r.番号) || Object.values(r.値).some(印つき)) {
        await m.行を空にする(r.番号);
        変える += 1;
      }
    }
    if (変える === 0) return;
    await m.登録を押す();
    await expectSaved(page, `MTGマスターデータ「${種別}」を元に戻す`);
  });
}

/** 開き直して、元の行が控えた値と同じで、足した行が残っていないか */
async function 戻ったか(browser: Browser, 種別: string, 前: マスタの行[], 足した: Set<number>): Promise<boolean> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const m = await 開く(page, 種別);
    const 今 = await m.全行を読む();
    const 今の = new Map(今.map((r) => [r.番号, JSON.stringify(r.値)]));
    const 同じ = 前.every((r) => 今の.get(r.番号) === JSON.stringify(r.値));
    const 残り = 今.filter((r) => !前.some((x) => x.番号 === r.番号) && (足した.has(r.番号) || Object.values(r.値).some(印つき)));
    return 同じ && 残り.length === 0;
  });
}

export type 控え = { 種別: string; 前: マスタの行[]; 足した: Set<number> };

/**
 * 種別の全行を画面で控え、ケースの終わりに戻すことを登録する。
 * 控える前に、前の実行の残り（このシードが使う印つきの名前 残りの名前 のどれかを値に持つ行）を消す。
 */
export async function 種別を控える(page: Page, browser: Browser, seedId: string, 種別: string, 残りの名前: string[], issue: Issue): Promise<控え> {
  共有の書き換えを許す(seedId);
  const m = await 開く(page, 種別);
  const left = (await m.全行を読む()).filter((r) => Object.values(r.値).some((v) => 残りの名前.includes(v)));
  if (left.length) {
    for (const r of left) await m.行を空にする(r.番号);
    await m.登録を押す();
    await expectSaved(page, `${seedId}: 前の実行の残りの行を消す`);
    issue(`MTGマスターデータ「${種別}」に前の実行の残りの印つきの行（番号 ${left.map((r) => r.番号).join("・")}）があったので、全項目を空にして消した（E2E が作った行。戻さない）`);
    await m.種別を選んで表示する(種別);
  }
  const 前 = await m.全行を読む();
  const 足した = new Set<number>();
  registerRestore(`MTGマスターデータ「${種別}」（全${前.length}行。${seedId}）`, { 種別, 行: 前 },
    async () => { await 元に戻す(browser, 種別, 前, 足した); },
    async () => 戻ったか(browser, 種別, 前, 足した));
  issue(`MTGマスターデータ「${種別}」の全${前.length}行を画面で控えた（ケースの終わりに、足した行を消し、元の行を控えた値に戻して、開き直して同じことを確かめる）`);
  return { 種別, 前, 足した };
}

/**
 * 一覧末尾の空行に、列の位置ごとの値（undefined は入れない）を入れて「登録」を押し、足された行の番号を返す（控えの 足した にも入れる）。
 * 足された行は、登録の前に無かった番号で、入れた値と同じ値の行（1行だけであること）。
 */
export async function 行を足す(page: Page, seedId: string, c: 控え, 値の並び: (string | undefined)[]): Promise<number> {
  const m = await 開く(page, c.種別);
  const 項目 = await m.列の項目();
  const 値: Record<string, string> = {};
  値の並び.forEach((v, i) => { if (v !== undefined) { if (!項目[i]) throw new Error(`${seedId}: 「${c.種別}」に ${i + 1} 列目が無い`); 値[項目[i]] = v; } });
  const 前の番号 = new Set((await m.全行を読む()).map((r) => r.番号));
  await m.行に入れる("new", 値);
  await m.登録を押す();
  await expectSaved(page, `${seedId}: 「${c.種別}」に行を足す（${Object.values(値).join("・")}）`);
  const 新 = (await m.全行を読む()).filter((r) => !前の番号.has(r.番号) && Object.entries(値).every(([k, v]) => 同じ値(r.値[k], v)));
  if (新.length !== 1) throw new Error(`${seedId}: 「${c.種別}」に足した行が見つからない（入れた値と同じ新しい行が ${新.length} 行）`);
  c.足した.add(新[0].番号);
  return 新[0].番号;
}

/** 列の種類から、値を組み立てる（14 の並びA・並びB 用） */
async function 並びの行の値(page: Page, 種別: string, 行: "A" | "B", 並び順: string): Promise<(string | undefined)[]> {
  const m = await 開く(page, 種別);
  const 項目 = await m.列の項目();
  const 種類 = await m.列の種類();
  const 文字 = 行 === "A" ? ["並びA", "SortA", "SORTA"] : ["並びB", "SortB", "SORTB"];
  let 何番目の文字 = 0;
  return 項目.map((k, i) => {
    if (i === 0) return 並び順;
    const t = 種類[i];
    if (t === "select") return "0";
    if (t === "number") return 行 === "A" ? "1" : "2";
    if (t === "datetime-local") return /start/i.test(k) ? "2026-09-01T10:00" : "2026-09-30T20:00";
    const n = 何番目の文字++;
    if (n >= 3) return undefined;
    // コードの項目（2〜3文字まで）は、印を付けられない。短い値にする
    if (/^(code|manaCode)$/.test(k)) return 種別 === "状態" ? `ZZ${行}` : `Z${行}`;
    return 印(文字[n]);
  });
}

// ---------------------------------------------------------------------------
// カードタイプ（005。006・009・016 も使う）
// ---------------------------------------------------------------------------
defineSeed("S-M16-04-CARDTYPE", { needs: ["S-M16-04-ADM"] }, async ({ browser, seed, notes }) => {
  const id = seed.シードID;
  const issue = (m: string) => reportSeedIssue(id, m);
  const 行: [string, string, string, string, string][] = [
    ["A", "10", "試験カードタイプA", "TestCardTypeA", "0"], ["B", "20", "試験カードタイプB", "TestCardTypeB", "1"], ["C", "30", "試験カードタイプC", "TestCardTypeC", "1"],
  ];
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const c = await 種別を控える(page, browser, id, "カードタイプ", 行.flatMap(([, , j, e]) => [印(j), 印(e)]), issue);
    for (const [k, sort, j, e, flg] of 行) notes.set(`〔カードタイプID-M1604-共有${k}〕`, await 行を足す(page, id, c, [sort, 印(j), 印(e), flg]));
  });
  issue("読み替え: 既存のカードタイプは、共有のマスタでほかの機能・ほかの人が使うので削除せず（DBでの削除はしない）、試験の3行（名前に印 -E2E）を足した。一覧には既存の行も並ぶ");
});

// ---------------------------------------------------------------------------
// キャンペーンタグ（008・029・031・043・045）
// ---------------------------------------------------------------------------
function キャンペーンタグのシード(seedId: string, label: string, 日本語名: string, 英語名: string, ほかの名前: string[]): void {
  defineSeed(seedId, { needs: ["S-M16-04-ADM"] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      const c = await 種別を控える(page, browser, seedId, "キャンペーンタグ", [印(日本語名), ...ほかの名前.map(印)], issue);
      notes.set(label, await 行を足す(page, seedId, c, ["20", 印(日本語名), 印(英語名), "2026-09-01T10:00", "2026-09-30T20:00"]));
    });
    issue(`キャンペーンタグ「${印(日本語名)}」（正本「${日本語名}」に印 -E2E）を足した。表示開始日時・表示終了日時は日時の入力欄に 2026-09-01 10:00・2026-09-30 20:00 を入れた（秒の欄は無く、0秒で保存される）`);
  });
}
キャンペーンタグのシード("S-M16-04-CAMPAIGN-008", "〔キャンペーンタグID-M1604-008〕", "日時表示確認タグ-008", "DateDisplayTag-008", []);
キャンペーンタグのシード("S-M16-04-CAMPAIGN-029", "〔キャンペーンタグID-M1604-029〕", "日時表示確認タグ-029", "DateDisplayTag-029", []);
キャンペーンタグのシード("S-M16-04-CAMPAIGN-031", "〔キャンペーンタグID-M1604-031〕", "日時表示確認タグ-031", "DateDisplayTag-031", ["日時欠落新規タグ"]);
キャンペーンタグのシード("S-M16-04-CAMPAIGN-043", "〔キャンペーンタグID-M1604-043〕", "M1604-043-更新前タグ", "M1604-043-BeforeTag", []);
キャンペーンタグのシード("S-M16-04-CAMPAIGN-045", "〔キャンペーンタグID-M1604-045〕", "M1604-045-既存タグ", "M1604-045-ExistTag", ["M1604-045-新規タグ"]);

// ---------------------------------------------------------------------------
// カラー（023〜027・032・050・051）
// ---------------------------------------------------------------------------
type 色 = { 記号: "A" | "B" | "C"; 並び順: string; 日: string; 英: string };
function カラーのシード(seedId: string, 番号: string, 色たち: 色[], ほかの名前: string[], 注記: string[] = []): void {
  defineSeed(seedId, { needs: ["S-M16-04-ADM"] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      const c = await 種別を控える(page, browser, seedId, "カラー", [...色たち.flatMap((x) => [カラーの名(x.日), カラーの名(x.英)]), ...ほかの名前.map(カラーの名)], issue);
      for (const x of 色たち) notes.set(`〔カラーID-M1604-${番号}${x.記号}〕`, await 行を足す(page, seedId, c, [x.並び順, カラーの名(x.日), カラーの名(x.英)]));
    });
    issue("読み替え: 既存のカラーは、共有のマスタで、カード・アーキタイプが参照しているので削除せず（DBでの削除もしない）、試験の3行を足した。「カラーは3件のみ」は「既存の行＋試験の3行」になる");
    issue(`足した行: ${色たち.map((x) => `${カラーの名(x.日)}（${x.日}）・${カラーの名(x.英)}（${x.英}）・並び順${x.並び順}`).join("／")}。カラーの名前は20文字までのため、印を付けて20文字を超える値は「-M1604-」を「-」に縮めた`);
    for (const n of 注記) issue(n);
  });
}
const 三色 = (n: string): 色[] => [
  { 記号: "A", 並び順: "20", 日: `編集前カラー-${n}`, 英: `BeforeColor-${n}` },
  { 記号: "B", 並び順: "30", 日: `削除対象カラー-${n}`, 英: `DeleteColor-${n}` },
  { 記号: "C", 並び順: "40", 日: `保持確認カラー-${n}`, 英: `KeepColor-${n}` },
];
カラーのシード("S-M16-04-CRUD-023", "023", 三色("023"), ["更新後カラー"]);
カラーのシード("S-M16-04-CRUD-024", "024", 三色("024"), []);
カラーのシード("S-M16-04-CRUD-025", "025", 三色("025"), []);
カラーのシード("S-M16-04-CRUD-026", "026", 三色("026"), [], ["読み替え: シード表の「DBでカラーの件数が3件であることを確かめる」は、ケースの初めにDBで件数（既存の行＋試験の3行）を読んで控える形にした"]);
カラーのシード("S-M16-04-CRUD-027", "027", 三色("027"), []);
カラーのシード("S-M16-04-CRUD-032", "032", 三色("032"), ["トークン改ざん更新"]);
カラーのシード("S-M16-04-DPMULTI-050", "050", [
  { 記号: "A", 並び順: "20", 日: "並びカラーA-M1604-050", 英: "SortColorA-M1604-050" },
  { 記号: "B", 並び順: "30", 日: "並びカラーB-M1604-050", 英: "SortColorB-M1604-050" },
  { 記号: "C", 並び順: "40", 日: "並びカラーC-M1604-050", 英: "SortColorC-M1604-050" },
], []);
カラーのシード("S-M16-04-DPMIX-051", "051", [
  { 記号: "A", 並び順: "20", 日: "更新前カラー-M1604-051", 英: "BeforeColor-M1604-051" },
  { 記号: "B", 並び順: "30", 日: "削除対象カラー-M1604-051", 英: "DeleteColor-M1604-051" },
  { 記号: "C", 並び順: "40", 日: "保持確認カラー-M1604-051", 英: "KeepColor-M1604-051" },
], ["新規カラー-M1604-051", "更新後カラー-M1604-051", "NewColor-M1604-051"]);

// ---------------------------------------------------------------------------
// 並び（014）: 21種別に「並びA」（並び順20）・「並びB」（並び順10）を足す
// ---------------------------------------------------------------------------
export const 二十一種別 = ["レアリティ", "デッキタグ", "色順", "カードタイプ", "サブタイプ", "特殊タイプ", "カラー", "カードレイアウト", "プロモーション", "イラストレーター", "リーガリティ", "ボード", "カードセットブロック", "認定", "言語", "マナシンボル", "ルール適用度", "キャンペーンタグ", "状態", "特殊サジェスト", "特殊制限"];

/** 控えた「種別=番号、…」の文から、種別ごとの番号を引く */
export function 種別ごとの番号(控えた文: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of 控えた文.split("、")) { const [k, v] = p.split("="); if (k && v) out[k] = Number(v); }
  return out;
}

defineSeed("S-M16-04-SORT-014", { needs: ["S-M16-04-ADM"] }, async ({ browser, seed, notes }) => {
  const id = seed.シードID;
  const issue = (m: string) => reportSeedIssue(id, m);
  const A: string[] = [], B: string[] = [];
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    for (const k of 二十一種別) {
      const 残り = ["並びA", "SortA", "SORTA", "並びB", "SortB", "SORTB"].map(印);
      const c = await 種別を控える(page, browser, id, k, 残り, issue);
      // 特殊制限は文字の列が無く印を付けられないので、前の実行の残りは消さない（ケースの終わりに番号で消す）
      // デッキタグは並び順が重なると登録できない作り（既存の行と重ならない値にする）
      let [a, b] = ["20", "10"];
      if (k === "デッキタグ") {
        const 使用 = new Set(c.前.map((r) => 列の値(r, 1)));
        const 空き = (from: number, ng: string[] = []) => { let n = from; while (使用.has(String(n)) || ng.includes(String(n))) n += 1; return String(n); };
        a = 空き(20); b = 空き(10, [a]);
        if (a !== "20" || b !== "10") issue(`読み替え: デッキタグは並び順が既存の行と重なると登録できない作りのため、並びA の並び順を ${a}、並びB を ${b} にした（並びA が並びB より大きいことは同じ）`);
      }
      A.push(`${k}=${await 行を足す(page, id, c, await 並びの行の値(page, k, "A", a))}`);
      B.push(`${k}=${await 行を足す(page, id, c, await 並びの行の値(page, k, "B", b))}`);
    }
  });
  notes.set("〔並びA行ID-M1604-014〕", A.join("、"));
  notes.set("〔並びB行ID-M1604-014〕", B.join("、"));
  issue("読み替え: 21種別の既存の行は、共有のマスタで、編集ロックの行・参照されている行があるので削除せず（DBでの削除もしない）、各種別に「並びA」（並び順20）・「並びB」（並び順10）の2行を足した。「各種別はこの2件のみ」は「既存の行＋2行」になる");
  issue("読み替え: 文字の値は印 -E2E を付けた（並びA-E2E・SortA-E2E・SORTA-E2E など）。コードの項目（レアリティ・言語は2文字、状態は3文字、マナシンボルのマナコードは2文字まで）は正本の「SORTA」が入らないので、ZA・ZB（状態は ZZA・ZZB）にした。特殊制限のカードIDは数値の列なので A行=1・B行=2");
});

// ---------------------------------------------------------------------------
// 編集ロック（018）: 12種別の境界の行の並び順を、ケースで書き換える（既存の行を使う）
// ---------------------------------------------------------------------------
export const 境界の行: [string, number][] = [["カードレイアウト", 5], ["カードタイプ", 14], ["カードセットブロック", 27], ["ボード", 3], ["認定", 3], ["言語", 2], ["プロモーション", 32], ["レアリティ", 7], ["リーガリティ", 3], ["ルール適用度", 5], ["特殊タイプ", 7], ["サブタイプ", 378]];

defineSeed("S-M16-04-LOCK-018", { needs: ["S-M16-04-ADM"] }, async ({ browser, seed }) => {
  const id = seed.シードID;
  const issue = (m: string) => reportSeedIssue(id, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    for (const [k, 番号] of 境界の行) {
      const c = await 種別を控える(page, browser, id, k, [], issue);
      // 書き換える前の並び順が5のままだと「5へ書き換えた」ことを区別できないので、シード表の指定（並び順20）に画面で合わせる（控えがあるので、ケースの終わりに元へ戻る）
      const 今 = c.前.find((r) => r.番号 === 番号);
      if (!今) continue;
      const 並び = 列の値(今, 1);
      if (並び === "20") continue;
      const m = await 開く(page, k);
      await m.列で入れる(番号, { 1: "20" });
      await m.登録を押す();
      await expectSaved(page, `${id}: 「${k}」の境界の行（番号 ${番号}）の並び順を20にする`);
      issue(`読み替え: 「${k}」の境界の行（番号 ${番号}）の並び順は ${並び || "空"} だったので、画面で20に合わせた（ケースの終わりに ${並び || "空"} へ戻す）`);
    }
  });
  issue("読み替え: シード表の「DBで12種別の境界IDの行を指定値（境界行・Boundary・並び順20 など）に設定する」は、DBでは行わない。既存の境界IDの行（IT-M16-04-017 と同じ）を使い、並び順が20でない行は画面で20に合わせてから、ケースで並び順を5に書き換える。12種別の全行を控え、ケースの終わりに元の並び順へ戻す");
});

// ---------------------------------------------------------------------------
// お問い合わせ件名（040・046）
// ---------------------------------------------------------------------------
defineSeed("S-M16-04-INQ-040", { needs: ["S-M16-04-ADM"] }, async ({ browser, seed, notes }) => {
  const id = seed.シードID;
  const issue = (m: string) => reportSeedIssue(id, m);
  const 件名 = 印("M1604-040-件名");
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const c = await 種別を控える(page, browser, id, "お問い合わせ件名", [件名], issue);
    // 列: 並び順・件名・件名(英)・送り先メールアドレス・店舗別問い合わせフラグ・付加情報名・付加情報名(英)
    notes.set("〔お問い合わせ件名ID-M1604-040〕", await 行を足す(page, id, c, [undefined, 件名, 件名, undefined, "0"]));
  });
  issue(`読み替え: 既存のお問い合わせ件名は、お問い合わせ履歴が参照しているので削除せず（DBでの削除もしない）、「${件名}」（正本「M1604-040-件名」に印 -E2E。件名(英)も同じ値）の1行を足した。一覧には既存の行も並ぶ`);
});

defineSeed("S-M16-04-INQ-046", { needs: ["S-M16-04-ADM"] }, async ({ seed }) => {
  reportSeedIssue(seed.シードID, "シード作成時の問題: 既存のお問い合わせ件名の削除と、DBで採番の次の値を46に合わせる作り方は、共有のデータを消す・DBを書き換えるので行わなかった。画面に既にある行のうち識別番号が最も小さい行（主キーの値が小さい行）への読み替えで確かめる（行の値は書き換えない）");
});

// ---------------------------------------------------------------------------
// 連携試験（048・049）: デッキタグの名前を変えると、公開側のデッキ検索結果・デッキリスト詳細の表示が変わる
// ---------------------------------------------------------------------------
export const M1604QN_ADMIN: Account = { loginId: "m1604qnadmin", password: "Passw0rd-M1604QN" };

defineSeed("S-M16-04-QN-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M16-04 連携試験", account: M1604QN_ADMIN, メール: "m1604qnadmin@example.test" });
});

/** 連携試験の名前（プレイヤー名・大会名など。実行の印つき） */
export const QN = (v: string): string => rc(v);
/** 連携試験のデッキタグの名前（日本語名・英語名。32文字まで。印 -E2E） */
export const QNタグ = (v: string): string => 印(v);

function 連携のシード(seedId: string, 記号: "001" | "002", label?: string): void {
  defineSeed(seedId, { needs: ["S-M16-04-QN-ADM"] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const n = (s: string) => `M1604QN${記号}-${s}`;
    const タグ前 = QNタグ(n("タグ前"));
    let デッキID = "";
    await withAdminSession(browser, M1604QN_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const fmt = QN(`QN${記号}-FMT`);
      await フォーマットを登録する(page, { 名: fmt, コード: `Q${記号.slice(-1)}${RUN_MARK.slice(-6).toUpperCase()}`, 表示順: "900", 検索対象: true }, issue);
      const arc = QN(`QN${記号}-ARC`);
      await アーキタイプを登録する(page, { 名: arc, フォーマット: fmt }, issue);
      const c = await 種別を控える(page, browser, seedId, "デッキタグ", [タグ前, QNタグ(n("タグ後"))], issue);
      const 並び = Math.max(0, ...c.前.map((r) => Number(列の値(r, 1))).filter(Number.isFinite)) + 1;
      await 行を足す(page, seedId, c, [String(並び), タグ前, タグ前]);
      デッキID = await デッキを登録する(page, {
        デッキ名: QN(n("デッキ")), デッキ種別: "event", フォーマット: fmt, アーキタイプ: arc, タグ: [タグ前], 公開状態: "公開",
        プレイヤー名: QN(n("選手")), イベント名日: QN(n("大会")), イベント名英: QN(n("大会")), 開催日: "2026/03/10 00:00", 順位: "1",
      }, issue);
    });
    // デッキがタグを参照していると、タグの行を消せない。ケースの終わりに、まずデッキからタグを外して非公開にする（登録の逆順で、タグの行を戻す前に動く）
    const デッキを開く = async (page: Page): Promise<デッキ編集画面> => {
      page.setDefaultTimeout(60_000);
      const res = await page.goto(adminUrl(`/deck/${デッキID}/edit`));
      if (!res || !res.ok()) throw new Error(`連携試験のデッキ（ID ${デッキID}）の編集画面が開けない（${res?.status() ?? "応答なし"}）`);
      const e = new デッキ編集画面(page);
      await e.読み込みを待つ();
      return e;
    };
    registerRestore(`連携試験のデッキ（ID ${デッキID}）からデッキタグを外して非公開にする（${seedId}）`, { デッキID }, async () => {
      await withAdminSession(browser, SETUP_ADMIN, async (page) => {
        const e = await デッキを開く(page);
        await e.タグ.selectOption([]);
        await e.公開状態.selectOption({ label: "非公開" });
        await e.送信する(e.更新ボタン);
        await expectSaved(page, `連携試験のデッキ（ID ${デッキID}）からデッキタグを外す`);
      });
    }, async () => withAdminSession(browser, SETUP_ADMIN, async (page) => {
      const e = await デッキを開く(page);
      return (await e.タグ.locator("option:checked").count()) === 0;
    }));
    if (label) notes.set(label, デッキID);
    issue(`フォーマット・アーキタイプ・デッキは実行の印つきの名前で作った（プレイヤー名「${QN(n("選手"))}」）。デッキタグは「${タグ前}」（正本「${n("タグ前")}」に印 -E2E）。開催日は 2026/03/10 00:00`);
    issue("ケースの終わりに、デッキからデッキタグを外して非公開にし、足したデッキタグの行を消す（デッキタグの一覧を控えた値に戻す）。フォーマット・アーキタイプ・デッキ（印つき）は残る（F09-02 のシードと同じ）");
  });
}
連携のシード("S-M16-04-QN-DECK-048", "001");
連携のシード("S-M16-04-QN-DECK-049", "002", "〔デッキID-M16-04-002〕");

export type { Notes };
