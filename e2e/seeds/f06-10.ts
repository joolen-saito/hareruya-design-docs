/**
 * F06-10 ポイント履歴の画面シード。正本: cases/F06-10_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10）: テストデータは「既存データ または 画面から作ったデータ」に読み替えてよい。画面で作れない部分は、
 * E2E が作った実行の印つきのデータに限り DB へ書き込んでよい（db/f06_10.ts・db/f06_07.ts。db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを通す）。
 *
 * 作り方（シード表の「DBシードで登録」「管理画面のポイント履歴追加を25回くり返す」を、次のように読み替える）:
 * - 会員: フロントの会員情報登録で登録し、本会員にする（seeds/f06-member.ts の 本会員を作る）。メールアドレスの前半に実行の印を付ける。
 *   会員ID・プレイヤーIDは控える（プレイヤーIDはDBの参照で読む。書き込みはしない。F03-07 と同じ扱い）。
 * - ポイント履歴: 発行日・内容（備考の自由な文字）・スマレジ取引の関連は管理画面のポイント履歴追加では指定できないので、
 *   画面で作った印つきの会員に、DBでポイント履歴を足す（db/f06_10.ts）。ポイント残高（プレイヤーの保有ポイント）は書き換えない（ケースは残高を確かめない）。
 * - 注文（006・008・009）: 販売中の共有の商品を注文せず、グッズ商品CSVで印つきの商品を作り、入庫・承認して、会員がフロントで注文する
 *   （M05-11 の部品。商品名はシード表と関係のない試験用の名前）。注文IDは画面が振った値。
 *   008 はさらにDBで注文にレシートNo.とスマレジ取引IDを設定し、ポイント履歴にスマレジ取引IDを付ける（スマレジ連携でしか入らない値）。
 * - 注文を作らないシード（003・005・007・022〜024）: ケースが注文との関連を確かめないので、注文は作らない。
 *   シード表が控えると定める 〔注文ID-…〕〔注文番号-…〕 は「（注文を作らない）」と控える。
 * - ポイント失効日数の183日（S-F06-10-ENV）: 共有の設定なので書き換えない。アプリの設定の既定値が183日であることを（読める環境で）確かめるだけ。
 * - シード表が固定の値（会員ID 461000008 など）で書くもの（008・020・021・030・034）は、画面が振った値に読み替える。
 *   008 の注文番号 WEB-SM-0610-008 は画面が振った注文番号に読み替える。
 * - 英語表示のケース（035・036）のパスワードはシード表のとおり（Passw0rd-CBF0610035 など）。
 */
import { Browser } from "@playwright/test";
import { プレイヤーID } from "../db/f03_07";
import { 注文の受注ID, 注文を整える } from "../db/f06_07_k";
import { ポイント履歴を足す, ポイント履歴を連番で足す, 履歴IDを順に } from "../db/f06_10";
import type { 履歴 } from "../db/f06_10";
import { getSeed } from "../lib/catalog";
import { available } from "../lib/db";
import { Notes } from "../lib/notes";
import { RUN_MARK } from "../lib/run_marker";
import { defineSeed, reportCurrentSeedIssue } from "./current_seed";
import { 会員が注文する } from "../pages/front/m05_11_order";
import type { FrontMember } from "../pages/front/member_entry";
import { 商品を用意する, 商品IDの控え } from "./m05-11-f";
import { 本会員を作る, markedMail } from "./f06-member";

export const mailOf = (前半: string): string => markedMail(前半);
/** パスワード（シード表: F0610PwdCase<番号>。英語表示のケースだけ別） */
export const passwordOf = (n: string): string => (n === "035" ? "Passw0rd-CBF0610035" : n === "036" ? "Passw0rd-CBF0610036" : `F0610PwdCase${n}`);

const 記す = (m: string) => reportCurrentSeedIssue(m);

// ---- 作った注文（ケースが引く） ----
export type 作った注文 = { 番号: string; ID: string };
const 注文の控え = new Map<string, 作った注文>();
export function 注文(n: string): 作った注文 {
  const r = 注文の控え.get(n);
  if (!r) throw new Error(`番号 ${n} の注文をまだ作っていない（そのシードを作っていない）`);
  return r;
}

// ---- ポイント失効日数 ----
defineSeed("S-F06-10-ENV", async () => {
  記す("ポイント失効日数は共有の設定なので書き換えない。この環境ではアプリの設定を読まないため、アプリの既定の値（183日）のままとみなした");
});

// ---- 会員だけ（ポイント履歴0件）。011・012 ----
for (const [n, 名] of [["011", "カイインゼロイチイチ"], ["012", "カイインゼロイチニ"]] as const) {
  defineSeed(`S-F06-10-CASE-${n}`, async ({ browser, notes }) => {
    const id = await 本会員を作る(browser, { 姓: "F06試験", 名: "会員", セイ: "シケン", メイ: 名, 前半: `f0610_empty-${n}`, パスワード: passwordOf(n) });
    notes.set(`〔会員ID-F0610-${n}〕`, id);
    notes.set(`〔プレイヤーID-F0610-${n}〕`, available ? (プレイヤーID(id) ?? "") : "（DB確認なし）");
  });
}

// ---- ポイント履歴を持つ会員 ----

/** 4件の履歴（足す順。表示は新しい順＝ID降順で HIST-105・104・103・102）。受注ID を渡すと HIST-104 を注文に関連付ける */
function 標準の履歴(n: string, 受注ID?: string): 履歴[] {
  return [
    { ポイント: 100, 発行日: "2026-07-01", 備考: `HIST-102-${n}` },
    { ポイント: -50, 発行日: "2026-07-15", 備考: `HIST-103-${n}` },
    { ポイント: 300, 発行日: "2026-08-01", 備考: `HIST-104-${n}`, 受注ID },
    { ポイント: 100, 発行日: "2026-07-01", 備考: `HIST-105-${n}` },
  ];
}

type 定義 = {
  seedId: string; n: string; 前半: string;
  /** 足す履歴（足す順）。連番と同時には使わない */
  履歴?: (受注ID?: string) => 履歴[];
  連番?: { 件数: number; 接頭: string };
  他会員?: { 前半: string; 履歴: 履歴[] };
  /** 注文を作る（履歴の HIST-104 に関連付ける）。"スマレジ" は 008 の注文（レシートNo.・スマレジ取引ID を設定） */
  注文?: "履歴に関連付け" | "スマレジ";
};

const 注文用の商品コード = (n: string) => `F0610-P-${n}`;

async function 注文を作る(browser: Browser, seedId: string, n: string, 前半: string): Promise<作った注文> {
  await 商品を用意する(browser, seedId, [{ code: 注文用の商品コード(n), name: `F0610試験商品${n}`, 入庫: [{ 数量: 5, 仕入単価: "100" }] }]);
  const m: FrontMember = { 姓: "F06試験", 名: "会員", セイ: "シケン", メイ: "カイイン", メール: mailOf(前半), パスワード: passwordOf(n) };
  const r = await 会員が注文する(browser, m, [{ 商品ID: 商品IDの控え(注文用の商品コード(n)), 数量: 1 }], `${seedId} の注文`);
  const o = { 番号: r.注文番号, ID: 注文の受注ID(r.注文番号) };
  注文の控え.set(n, o);
  記す(`シード表の注文は、販売中の共有の商品を使わず、グッズ商品CSVで作った印つきの商品（${注文用の商品コード(n)}・数量1）を会員がフロントで注文して作った。注文番号 ${o.番号} は画面が振った値`);
  return o;
}

function 定義する(d: 定義): void {
  const needs = d.注文 ? ["S-M05-11-ADM-A"] : [];
  defineSeed(d.seedId, { needs }, async ({ browser, notes }) => {
    const id = await 本会員を作る(browser, { 姓: "F06試験", 名: "会員", セイ: "シケン", メイ: "カイイン", 前半: d.前半, パスワード: passwordOf(d.n) });
    let 受注: 作った注文 | undefined;
    if (d.注文) 受注 = await 注文を作る(browser, d.seedId, d.n, d.前半);
    const done: string[] = [];
    if (d.注文 === "スマレジ" && 受注) {
      注文を整える(受注.ID, { スマレジ取引ID: `261000008-${RUN_MARK}`, レシートNo: "SR06100000801" });
      done.push("注文にレシートNo.（SR06100000801）とスマレジ取引IDを設定し");
      ポイント履歴を足す(id, [{ ポイント: 100, 発行日: "2026-08-01", 備考: "SMAREGI-HIST-008", 受注ID: 受注.ID, スマレジ取引ID: 261000008 }]);
      done.push("注文に関連するポイント履歴（スマレジ取引ID 261000008）を足し");
    } else if (d.連番) {
      ポイント履歴を連番で足す(id, { 件数: d.連番.件数, ポイント: 1, 発行日: "2026-08-01", 接頭: d.連番.接頭, 接尾: `-${d.n}` });
      done.push(`ポイント履歴を ${d.連番.件数} 件（内容 ${d.連番.接頭}001-${d.n} から連番）足し`);
    } else if (d.履歴) {
      const hs = d.履歴(d.注文 === "履歴に関連付け" ? 受注?.ID : undefined);
      ポイント履歴を足す(id, hs);
      done.push(`ポイント履歴を ${hs.length} 件（発行日・ポイント・内容を指定）足し`);
    }
    let 他会員ID: string | undefined;
    if (d.他会員) {
      他会員ID = await 本会員を作る(browser, { 姓: "F06試験", 名: "他会員", セイ: "シケン", メイ: "タカイイン", 前半: d.他会員.前半, パスワード: `F0610PwdOther${d.n}` });
      ポイント履歴を足す(他会員ID, d.他会員.履歴);
      done.push("他会員にポイント履歴を1件足し");
    }
    記す(`画面で作った会員にDBで、${done.join("、")}た（ポイント履歴追加の画面では発行日・内容を指定できない）。ポイント残高は書き換えていない`);

    // シード表が控えると定める呼び名
    const ids = [...履歴IDを順に(id), ...(他会員ID ? 履歴IDを順に(他会員ID) : [])];
    const 呼び名 = Notes.labelsIn(getSeed(d.seedId)["状態・属性"] + getSeed(d.seedId).投入方法).filter((l) => !l.includes("…"));
    for (const l of 呼び名) {
      const m = /^〔(.+?)-F0610-(\d{3})([A-Z]?)〕$/.exec(l);
      if (!m) throw new Error(`${d.seedId}: 呼び名 ${l} の形が読めない`);
      const [, 種類, , 枝] = m;
      const 会員 = 枝 === "B" && 他会員ID ? 他会員ID : id;
      if (種類 === "会員ID") notes.set(l, 会員);
      else if (種類 === "プレイヤーID") notes.set(l, available ? (プレイヤーID(会員) ?? "") : "（DB確認なし）");
      else if (種類 === "ポイント履歴ID") {
        const v = ids[枝.charCodeAt(0) - 65];
        if (!v) throw new Error(`${d.seedId}: ${l} にあたるポイント履歴が無い（${ids.length} 件）`);
        notes.set(l, v);
      } else if (種類 === "注文ID") notes.set(l, 受注 ? 受注.ID : "（注文を作らない）");
      else if (種類 === "注文番号") notes.set(l, 受注 ? 受注.番号 : "（注文を作らない）");
      else throw new Error(`${d.seedId}: 呼び名 ${l} の種類が読めない`);
    }
  });
}

const CASE = (n: string) => `S-F06-10-CASE-${n}`;
// 標準の4件
定義する({ seedId: CASE("003"), n: "003", 前半: "f0610-003", 履歴: () => 標準の履歴("003") });
定義する({ seedId: CASE("005"), n: "005", 前半: "f0610-005", 履歴: () => 標準の履歴("005"), 他会員: { 前半: "f0610_other-005", 履歴: [{ ポイント: 900, 発行日: "2026-08-15", 備考: "OTHER-201-005" }] } });
定義する({ seedId: CASE("006"), n: "006", 前半: "f0610-006", 注文: "履歴に関連付け", 履歴: (o) => 標準の履歴("006", o) });
定義する({ seedId: CASE("007"), n: "007", 前半: "f0610-007", 履歴: () => 標準の履歴("007") });
定義する({ seedId: CASE("008"), n: "008", 前半: "f0610_smaregi-008", 注文: "スマレジ" });
定義する({ seedId: CASE("009"), n: "009", 前半: "f0610-009", 注文: "履歴に関連付け", 履歴: (o) => 標準の履歴("009", o) });
for (const n of ["022", "023", "024"]) 定義する({ seedId: CASE(n), n, 前半: `f0610-${n}`, 履歴: () => 標準の履歴(n) });
// 25件
for (const [n, 前半] of [
  ["013", "f0610_page25-013"], ["014", "f0610_page25-014"], ["015", "f0610_page25-015"], ["016", "f0610_page25-016"], ["017", "f0610_page25-017"],
  ["018", "f0610_page25-018"], ["019", "f0610_page25-019"], ["025", "f0610_page25-025"], ["028", "f0610_prev-028"], ["029", "f0610_next-029"],
  ["031", "f0610_page25-031"], ["032", "f0610_page25-032"],
] as const) 定義する({ seedId: CASE(n), n, 前半, 連番: { 件数: 25, 接頭: "P25-" } });
// 101件
for (const [n, 前半] of [["020", "f0610_page101-020"], ["021", "f0610_page101-021"], ["030", "f0610_pagenum-030"], ["034", "f0610_page101-034"]] as const) {
  定義する({ seedId: CASE(n), n, 前半, 連番: { 件数: 101, 接頭: "P101-" } });
}
// 4件（1ページに収まる）
定義する({ seedId: CASE("033"), n: "033", 前半: "f0610_page4-033", 連番: { 件数: 4, 接頭: "P04-" } });
// 英語表示
定義する({ seedId: "S-F06-10-CBENPLUS-035", n: "035", 前半: "cbf0610-035", 履歴: () => [{ ポイント: 300, 発行日: "2026-08-01", 備考: "キャンペーン" }] });
定義する({ seedId: "S-F06-10-CBENMINUS-036", n: "036", 前半: "cbf0610-036", 履歴: () => [{ ポイント: 100, 発行日: "2026-07-01", 備考: "キャンペーン" }, { ポイント: -50, 発行日: "2026-07-15", 備考: "キャンペーン" }] });
