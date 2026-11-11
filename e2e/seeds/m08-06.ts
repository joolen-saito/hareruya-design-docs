/**
 * M08-06 ポイント履歴確認のシード。仕分け直し（recheck2）で流せる見込みになったもの。正本: cases/M08-06_seed_data.tsv
 *
 * 型: 会員はフロントの新規会員登録（seeds/m08-05-07-common.ts）→ 管理画面の会員一覧で会員IDを控える → 受注が要るものは会員がフロントで注文する →
 * ポイント残高（1000）とポイント履歴は、備考の文言・設定日・種別を画面で指定できないので、E2E の会員の行に DB で書く（正本の作り方どおり。db/m08_05_07.ts）。
 *
 * シードでの解釈（正本の外の補い。記録 review/M08-06_progress_2026-11-11_dev.md にも書く）:
 * - 履歴ID（806001001 など）は DB が振る番号になる（決め打ちの番号は前の実行の行とぶつかる）。正本の履歴IDは、足した順の番号へ読み替える
 *   （この起動の中で 履歴IDの読み替え で引ける）。
 * - 会員のメールアドレス（m08-06-001@example.test など）は、@ の前に実行の印を付けた。
 * - S-M08-06-ADM: 試験管理者のログインID・名前に実行の印を付けた。
 * - S-M08-06-POINT-TYPE: 開発環境のポイント種別のマスタ（1=付与型・2=購入型）を参照するだけ。
 */
import { Browser } from "@playwright/test";
import { ポイント種別, ポイント履歴, ポイント履歴を足す, ポイント残高, ポイント残高を設定する, 会員があるか, 選手情報ID, 足す履歴 } from "../db/m08_05_07";
import { Notes } from "../lib/notes";
import { rc, rcFixed } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account } from "../lib/session";
import { 会員が1点注文する, 会員を作る, 控える, 試験管理者を用意する } from "./m08-05-07-common";

export const M0806_ADMIN: Account = { loginId: rcFixed("m0806_admin").toLowerCase(), password: "Passw0rd!M0806" };

defineSeed("S-M08-06-ADM", async ({ browser }) => { await 試験管理者を用意する(browser, rcFixed("M08-06試験管理者"), M0806_ADMIN); });

defineSeed("S-M08-06-POINT-TYPE", async ({ seed }) => {
  const t = ポイント種別();
  if (t["1"] !== "付与型" || t["2"] !== "購入型") throw new Error(`${seed.シードID}: ポイント種別のマスタが 1=付与型・2=購入型 でない（${JSON.stringify(t)}）`);
});

/** 正本の履歴ID → この起動で DB が振った履歴ID */
const 読み替え = new Map<string, string>();
export function 履歴IDの読み替え(正本の履歴ID: string): string {
  const v = 読み替え.get(正本の履歴ID);
  if (!v) throw new Error(`正本の履歴ID ${正本の履歴ID} の読み替えが無い（シードで足していない）`);
  return v;
}

type 履歴の定め = 足す履歴 & { 正本ID: string; 受注に紐づく?: boolean };
const A = (n: string): 履歴の定め => ({ 正本ID: `806001${n}`, 種別: "付与型", 増減量: 100, 備考: "履歴A", 発行日: "2026-01-04", 設定日: "2026-01-08", 受注に紐づく: true });
const B = (n: string): 履歴の定め => ({ 正本ID: `806002${n}`, 種別: "購入型", 増減量: -50, 備考: "履歴B", 発行日: "2026-01-01", 設定日: "2026-01-06" });
const C = (n: string): 履歴の定め => ({ 正本ID: `806003${n}`, 種別: "付与型", 増減量: 200, 備考: "履歴C", 発行日: "2026-01-03", 設定日: "2026-01-07" });
const D = (n: string): 履歴の定め => ({ 正本ID: `806004${n}`, 種別: "購入型", 増減量: -10, 備考: "履歴D", 発行日: "2026-01-02", 設定日: "2026-01-05" });
const E120 = (n: string): 履歴の定め[] => Array.from({ length: 120 }, (_, i) => ({
  正本ID: `806${n}${String(i + 1).padStart(3, "0")}`, 種別: "付与型" as const, 増減量: 10, 備考: "履歴E", 発行日: "2026-01-04", 設定日: "2026-01-08",
}));

type 会員の定め = { n: string; 受注: boolean; 履歴: 履歴の定め[] };
const 定め: 会員の定め[] = [
  { n: "001", 受注: true, 履歴: [A("001"), B("001"), C("001"), D("001")] },
  { n: "003", 受注: false, 履歴: [{ ...C("003"), 正本ID: "806003003" }] },
  { n: "004", 受注: true, 履歴: [A("004"), B("004"), C("004"), D("004")] },
  { n: "005", 受注: false, 履歴: [D("005")] },
  { n: "006", 受注: true, 履歴: [A("006")] },
  { n: "007", 受注: true, 履歴: [A("007")] },
  { n: "008", 受注: false, 履歴: [B("008")] },
  { n: "010", 受注: false, 履歴: [] },
  { n: "011", 受注: false, 履歴: [] },
  { n: "012", 受注: false, 履歴: E120("012") },
  { n: "013", 受注: false, 履歴: E120("013") },
];
const シードID = (n: string) => (n === "012" ? "S-M08-06-GF-ALLROWS-012" : n === "013" ? "S-M08-06-GF-NOPAGER-013" : `S-M08-06-DISPLAY-${n}`);

async function 作る(browser: Browser, notes: Notes, seedId: string, d: 会員の定め): Promise<void> {
  const m = await 会員を作る(browser, { 前半: `m08-06-${d.n}`, 姓: "ポイント", 名: "太郎", セイ: "ポイント", メイ: "タロウ", パスワード: `Passw0rd!M0806-${d.n}` });
  控える(notes, seedId, `〔会員ID-M0806-${d.n}〕`, m.会員ID);
  const pid = 選手情報ID(m.会員ID);
  if (!pid) throw new Error(`${seedId}: 会員ID ${m.会員ID} の選手情報が DB に無い`);
  控える(notes, seedId, `〔選手情報ID-M0806-${d.n}〕`, pid);
  let 受注ID = "";
  if (d.受注) {
    const o = await 会員が1点注文する(browser, seedId, m);
    受注ID = o.受注ID;
    控える(notes, seedId, `〔注文番号-M0806-${d.n}〕`, o.注文番号);
    控える(notes, seedId, `〔受注ID-M0806-${d.n}〕`, o.受注ID);
  }
  if (ポイント履歴(m.会員ID).length) throw new Error(`${seedId}: 会員登録の直後にポイント履歴がある（0件から足すはず）`);
  if (d.履歴.length) {
    ポイント履歴を足す(`${seedId}: ポイント履歴 ${d.履歴.length} 件を足す`, m.会員ID, d.履歴.map((h) => ({ ...h, 受注ID: h.受注に紐づく ? 受注ID : undefined })));
    const got = ポイント履歴(m.会員ID);
    if (got.length !== d.履歴.length) throw new Error(`${seedId}: 足したポイント履歴が ${got.length} 件（${d.履歴.length} 件のはず）`);
    // 足した順（履歴IDの昇順）に正本の履歴IDを当てる。備考で並びがずれていないことも確かめる
    got.forEach((g, i) => {
      if (g.備考 !== d.履歴[i].備考 || g.増減量 !== d.履歴[i].増減量) throw new Error(`${seedId}: ${i + 1}件目の履歴が定めと違う（${JSON.stringify(g)}）`);
      読み替え.set(d.履歴[i].正本ID, g.履歴ID);
    });
  }
  if (ポイント残高(m.会員ID) !== 1000) ポイント残高を設定する(`${seedId}: 会員ID ${m.会員ID} のポイント残高を1000にする`, m.会員ID, 1000);
  if (d.n === "010" && 会員があるか("999999")) throw new Error(`${seedId}: 会員ID 999999 の会員がある（ほかの方のデータなので消さずに止める）`);
  reportSeedIssue(seedId, `ポイント残高1000とポイント履歴（備考・設定日・種別）は画面で指定できないので、E2E の会員の行に DB で書いた（正本の作り方どおり）。` +
    (d.履歴.length ? `履歴IDは DB が振る番号（${d.履歴.slice(0, 4).map((h) => `${h.正本ID}→${読み替え.get(h.正本ID)}`).join("、")}${d.履歴.length > 4 ? " ほか" : ""}）に読み替えた` : ""));
}

for (const d of 定め) {
  defineSeed(シードID(d.n), { needs: ["S-M08-06-POINT-TYPE"] }, async ({ browser, notes, seed }) => { await 作る(browser, notes, seed.シードID, d); });
}
