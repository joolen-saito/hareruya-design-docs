/**
 * M06-08 買取集計データ(検索入力) の画面シード。正本: cases/M06-08_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10「印つきデータは何でも」）に従い、画面で作れるものは画面で、買取集計データだけ DB で作る（M06-09 と同じ作り方）。
 * - 東京店・大阪店: 正本は「共有A・共有B」の2店舗だが、ケースごとに買取集計データの中身が違い、共有の店舗に入れると他の検索結果と混ざるので、
 *   ケースごとの試験店舗（店名「M06-08試験店舗NNNA」＝東京店の役、「…NNNB」＝大阪店の役。固定名。あれば使う）を店舗登録画面で登録して代える。
 *   店舗IDは画面が振った番号（シードの中だけで使い、控えの呼び名は作らない）。
 * - 買取集計データ: 画面に登録する操作が無いので、試験店舗（店名が固定）に限り、DB で期間内の行を消して入れ直す（db/m06_09_prep.ts。writeTestData 経由）。
 *   内部ID（680800721 など）は指定せず、DB が振る番号。
 * - 部門（MASTER）: 共有のマスタは登録しない。既存の部門「カード」「サプライ」と、「価格検証部門」（無ければ、その2つ以外の先頭の既存の部門）を使う。
 *   部門ID・コードは正本の 680899911〜13・D01〜D03 ではなく既存の値。ケースの期待の D01・D02・D03 は、その部門の実際のコードとして読む。
 *   店頭買取ステータス「買取成立」は、買取集計データを直接用意するのでこのケース群で使わない。
 * - 管理者: 管理者内部IDは画面が振った番号を控える。権限は「システム管理者」で代える（買取集計データ画面を利用できる権限グループの指定は画面で確かめていない）。
 *   パスワードは、正本の「M0608a001!」（10文字）が管理者のパスワードの規則（12文字以上）に合わないので、「Passw0rd-M0608NNN」（027・028 は正本の値）に代える。
 *   デフォルト検索表示店舗は東京店の役の店舗。003 は「全店」＝デフォルト検索表示店舗を未選択にする。
 * - ブラウザ（BROWSER）: サイトデータの消去・独立した2つのセッション・ダウンロードはテストの基盤が行う。
 * - 作らないシード（ケースを実装しない）: SUMMARY-CONFIG・PRICE-SOURCE-006・014（共有の追加システム設定を書き換え、買取集計バッチの実行が要る）。
 *   FILTER-009・010・012 は全店舗・全部門を未選択で数えるので、ほかの実データが混ざる（ケースを実装しない）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 管理者IDを探す, 集計データを入れ替える, 集計行 } from "../db/m06_09_prep";
import { 他の部門, 部門を名前で探す } from "../db/m06_08_prep";
import { reportSeedIssue, SeedBuilder } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { ensureStore } from "../pages/admin/m04_24_store";
import { storeInput } from "./m06-common";

/** ケース番号ごとの試験管理者 */
export const M0608_ADMIN = (no: string): Account => ({ loginId: `m0608_admin_${no}`, password: `Passw0rd-M0608${no}` });

/** 試験店舗の店名（東京店の役 A・大阪店の役 B） */
export const 店名 = (no: string, 役: "A" | "B" = "A") => `M06-08試験店舗${no}${役}`;

const 英語 = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel", "India", "Juliet", "Kilo", "Lima", "Mike", "November", "Oscar", "Papa", "Quebec", "Romeo", "Sierra", "Tango", "Uniform", "Victor", "Whiskey", "Xray", "Yankee", "Zulu", "Amber", "Birch", "Cedar", "Dune", "Ember", "Fjord", "Grove", "Haze"];
const カナ = ["ア", "イ", "ウ", "エ", "オ", "カ", "キ", "ク", "ケ", "コ", "サ", "シ", "ス", "セ", "ソ", "タ", "チ", "ツ", "テ", "ト", "ナ", "ニ", "ヌ", "ネ", "ノ", "ハ", "ヒ", "フ", "ヘ", "ホ", "マ", "ミ", "ム", "メ"];
const 略称字 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
/** 店名の通し番号（全ケースの全店舗で重ならない） */
const 全店舗 = ["001A", "002A", "003A", "004A", "004B", "005A", "005B", "007A", "008A", "008B", "015A", "015B", "017A", "017B", "018A", "023A", "024A", "024B", "026A", "027A", "028A"];

function 店舗の入力(no: string, 役: "A" | "B") {
  const i = 全店舗.indexOf(`${no}${役}`);
  if (i < 0) throw new Error(`試験店舗 ${no}${役} が一覧に無い`);
  const 略 = `K8${略称字[i % 26]}`;
  return storeInput(店名(no, 役), `エムゼロハチシケンテンポ${カナ[i]}`, `Kaitori Eight Store ${英語[i]}`, `m0608sum${no}${役.toLowerCase()}`, 略);
}

async function 店舗を用意する(browser: Browser, no: string, 役: "A" | "B", issue: (m: string) => void): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    return ensureStore(page, 店舗の入力(no, 役), issue);
  });
}

/** 既存の部門 */
export function 既存の部門(名前: "カード" | "サプライ") {
  const r = 部門を名前で探す(名前);
  if (r.length !== 1) throw new Error(`部門「${名前}」が ${r.length} 件ある（共有のマスタなので作らない。1件のはず）`);
  return r[0];
}
/** 3つ目の部門（「価格検証部門」。無ければ、カード・サプライ以外の先頭の既存の部門） */
export function 三つ目の部門() {
  const r = 部門を名前で探す("価格検証部門");
  if (r.length === 1) return r[0];
  if (r.length > 1) throw new Error(`部門「価格検証部門」が ${r.length} 件ある（1件のはず）`);
  const o = 他の部門(["カード", "サプライ"]);
  if (!o) throw new Error("カード・サプライ以外の既存の部門が無い");
  return o;
}

export const 部門の注記 = "部門は共有のマスタなので登録せず、既存の部門「カード」「サプライ」と3つ目の部門（「価格検証部門」。無ければ、その2つ以外の先頭の既存の部門）を使った。"
  + "正本の部門コード D01・D02・D03 は、その部門の実際のコードとして確かめた";
export const 店舗の注記 = "東京店・大阪店は、ケースごとの試験店舗（店名「M06-08試験店舗NNNA」＝東京店の役、「…NNNB」＝大阪店の役）に代えた（ほかのケースの買取集計データと混ざらないため）";

defineSeed("S-M06-08-BROWSER", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "サイトデータの消去・独立した2つのセッション・ダウンロードの許可は、テストの基盤が行う（ケースごとに新しいセッションで始まる）");
});
defineSeed("S-M06-08-MASTER", async ({ seed }) => {
  既存の部門("カード"); 既存の部門("サプライ"); 三つ目の部門();
  reportSeedIssue(seed.シードID, `${部門の注記}。${店舗の注記}。店頭買取ステータス「買取成立」はこのケース群で使わない`);
});

const 集 = (日時: string, 部門ID: string | null, 買取金額: number, 販売金額: number): 集計行 => ({ 日時, 部門ID, 買取金額, 販売金額 });
type 行の定め = { 役: "A" | "B"; 行: 集計行 };

/** 管理者（と試験店舗・買取集計データ）のシード。デフォルト検索表示店舗は A（全店なら未選択） */
function adminSeed(no: string, o: { 役?: ("A" | "B")[]; 全店?: boolean; 期間?: [string, string]; 行?: (s: { カード: string; サプライ: string; 三つ目: string }) => 行の定め[] } = {}): SeedBuilder {
  return async ({ browser, notes, seed }) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    const 役一覧 = o.役 ?? ["A"];
    const ids: Record<string, string> = {};
    for (const 役 of 役一覧) ids[役] = await 店舗を用意する(browser, no, 役, issue);
    if (o.行 || o.期間) {
      const s = { カード: 既存の部門("カード").部門ID, サプライ: 既存の部門("サプライ").部門ID, 三つ目: 三つ目の部門().部門ID };
      const rows = o.行 ? o.行(s) : [];
      for (const 役 of 役一覧) {
        集計データを入れ替える(ids[役], 店名(no, 役), o.期間![0], o.期間![1], rows.filter((r) => r.役 === 役).map((r) => r.行));
      }
      issue(`買取集計データ（${o.期間![0]}〜${o.期間![1]}）は、画面に登録する操作が無いので、DBで試験店舗の期間内の行を消して入れ直した（内部IDは DB が振る番号）`);
    }
    const account = M0608_ADMIN(no);
    await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
      名前: `M06-08試験管理者${no}`, ログインID: account.loginId, メールアドレス: `${account.loginId}@example.test`, パスワード: account.password,
      権限: "システム管理者", 所属店舗ID: ids.A, デフォルト検索表示店舗ID: o.全店 ? "" : ids.A, 編集可能店舗ID: 役一覧.map((r) => ids[r]),
    }));
    const mid = 管理者IDを探す(account.loginId);
    if (!mid) throw new Error(`管理者 ${account.loginId} が見つからない`);
    notes.set(`〔管理者内部ID-M0608-${no}〕`, mid);
    issue(`${店舗の注記}。管理者内部ID は画面が振った番号（${mid}）。権限は「システム管理者」で代えた。パスワードは規則（12文字以上）に合う「${account.password}」`);
  };
}

defineSeed("S-M06-08-ADM-001", adminSeed("001"));
defineSeed("S-M06-08-ADM-TOKYO-002", adminSeed("002"));
defineSeed("S-M06-08-ADM-ALL-003", adminSeed("003", { 全店: true }));
defineSeed("S-M06-08-NAV-004", adminSeed("004", { 役: ["A", "B"] }));
defineSeed("S-M06-08-OPTIONS-005", adminSeed("005", { 役: ["A", "B"] }));
defineSeed("S-M06-08-VALIDATION-017", adminSeed("017", { 役: ["A", "B"] }));

defineSeed("S-M06-08-FILTER-007", adminSeed("007", { 期間: ["2026-08-31", "2026-09-02"], 行: (s) => [
  { 役: "A", 行: 集("2026-08-31 23:59:59", s.カード, 111, 222) }, { 役: "A", 行: 集("2026-09-01", s.カード, 1000, 3000) },
  { 役: "A", 行: 集("2026-09-01 23:59:59", s.カード, 2000, 4000) }, { 役: "A", 行: 集("2026-09-02", s.カード, 800, 900) }] }));
defineSeed("S-M06-08-FILTER-008", adminSeed("008", { 役: ["A", "B"], 期間: ["2026-09-01", "2026-09-01"], 行: (s) => [
  { 役: "A", 行: 集("2026-09-01", s.サプライ, 400, 500) }, { 役: "A", 行: 集("2026-09-01", s.カード, 1000, 3000) },
  { 役: "B", 行: 集("2026-09-01", s.サプライ, 600, 700) }] }));
defineSeed("S-M06-08-FILTER-015", adminSeed("015", { 役: ["A", "B"], 期間: ["2026-08-31", "2026-09-02"], 行: (s) => [
  { 役: "A", 行: 集("2026-08-31 23:59:59", s.カード, 111, 222) }, { 役: "A", 行: 集("2026-09-01", s.カード, 1000, 3000) },
  { 役: "A", 行: 集("2026-09-01 23:59:59", s.カード, 2000, 4000) }, { 役: "A", 行: 集("2026-09-02", s.カード, 800, 900) },
  { 役: "A", 行: 集("2026-09-01", s.サプライ, 400, 500) }, { 役: "B", 行: 集("2026-09-01", s.カード, 600, 700) }] }));
defineSeed("S-M06-08-EMPTY-018", adminSeed("018", { 期間: ["2099-01-01", "2099-01-01"], 行: () => [] }));
// 023: 正本のシード表は管理者だけ。CSVダウンロードボタンが出るよう、手順2の条件（2026/09/01・カード・東京店）に当たる買取集計データを1行足す
defineSeed("S-M06-08-SESSION-023", adminSeed("023", { 期間: ["2026-09-01", "2026-09-01"], 行: (s) => [{ 役: "A", 行: 集("2026-09-01", s.カード, 1000, 3000) }] }));
defineSeed("S-M06-08-FILTER-024", adminSeed("024", { 役: ["A", "B"], 期間: ["2026-08-31", "2026-09-02"], 行: (s) => [
  { 役: "A", 行: 集("2026-08-31 23:59:59", s.カード, 111, 222) }, { 役: "A", 行: 集("2026-09-01", s.カード, 1000, 3000) },
  { 役: "A", 行: 集("2026-09-01 23:59:59", s.カード, 2000, 4000) }, { 役: "A", 行: 集("2026-09-02", s.カード, 800, 900) },
  { 役: "A", 行: 集("2026-09-01", s.サプライ, 400, 500) }, { 役: "B", 行: 集("2026-09-01", s.カード, 600, 700) }] }));
defineSeed("S-M06-08-FILTER-026", adminSeed("026", { 期間: ["2026-09-01", "2026-09-01"], 行: (s) => [
  { 役: "A", 行: 集("2026-09-01", s.カード, 1000, 3000) }, { 役: "A", 行: 集("2026-09-01", s.サプライ, 400, 500) },
  { 役: "A", 行: 集("2026-09-01", s.三つ目, 70, 80) }] }));
defineSeed("S-M06-08-MIXED-027", adminSeed("027", { 期間: ["2026-09-05", "2026-09-05"], 行: (s) => [
  { 役: "A", 行: 集("2026-09-05", s.カード, 1000, 3000) }, { 役: "A", 行: 集("2026-09-05", null, 1200, 3400) }] }));
defineSeed("S-M06-08-CSVMULTI-028", adminSeed("028", { 期間: ["2026-09-06", "2026-09-07"], 行: (s) => [
  { 役: "A", 行: 集("2026-09-06", s.カード, 1000, 3000) }, { 役: "A", 行: 集("2026-09-06", s.サプライ, 400, 500) },
  { 役: "A", 行: 集("2026-09-07", s.カード, 800, 900) }, { 役: "A", 行: 集("2026-09-07", s.サプライ, 200, 300) }] }));
