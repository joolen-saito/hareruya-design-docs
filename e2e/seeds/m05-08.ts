/**
 * M05-08 スタック用紙印刷の画面シード。正本: cases/M05-08_seed_data.tsv
 *
 * 方針（依頼者 2026-11-10）: シード表が「DBで登録」とするものも、まず画面で作る。画面で作れない部分は、E2E が作った「実行の印つき」のデータに限り、
 * db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） を通して DB に書く（db/m05_08.ts・db/m05_01_order_write.ts）。共有のマスタ・設定は書き換えない。
 *
 * - 管理者（S-M05-08-ADM）・更新前担当者（S-M05-08-OLD-MEMBER）: メンバー管理で登録する。正本のメンバーID 5080は画面で指定できない。
 *   権限は受注管理を操作できる「システム管理者」、所属店舗・操作対象店舗は本店（店舗ID 1）にした。
 * - 共有マスタ（S-M05-08-MASTER）・スタック用紙印刷設定（S-M05-08-PRINT-SETTING）: 共有の値なので書き換えずに、シード表の状態であることを読んで確かめる
 *   （違えばシードを止める。ケースの中で書き換えて戻す作りはしない）。
 * - 受注（TARGET など）: M05-26 と同じ方法で、画面（フロントの購入）で1件作った「基の受注」の行を DB で写して作る（seeds/m05-01.ts の 受注を作る）。
 *   注文番号は、画面が振る番号に代えて、実行の印から作った10文字までの値にした。検索で見つけられるよう、注文者名にも実行の印を付けた。
 *   担当者（更新前担当者）・未採番（注文番号NULL）・注文確定日・受注日は、DB で設定した。
 */
import { Browser } from "@playwright/test";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { RUN_MARK } from "../lib/run_marker";
import { Account } from "../lib/session";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { 受注を整える, 受注を複製する, 開店か } from "../db/m05_01_order_write";
import {
  スタック用紙印刷の設定を読む, メンバーID, 受注の配送ID, 受注明細ID, 担当者を設定, 注文確定日を設定, 注文番号を未採番にする, 支払方法があるか, 対応状況があるか,
} from "../db/m05_08";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";
import { 本店ID } from "../pages/admin/m05_01_orders";
import { 受注を作る } from "./m05-01";

export const M0508_ADMIN: Account = { loginId: "m0508_admin", password: "Passw0rd!M0508" };
export const M0508_OLD: Account = { loginId: "m0508_old", password: "Passw0rd!M0508Old" };

defineSeed("S-M05-08-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M05-08試験管理者", account: M0508_ADMIN, メール: "m0508_admin@example.test" });
  reportSeedIssue("S-M05-08-ADM", "正本のメンバーID 5080は画面で指定できないので、画面が振る番号のメンバーを使った（ケースの「ID 5080」はこのメンバー）。権限は「システム管理者」、所属店舗・操作対象店舗は本店（店舗ID 1）");
});

defineSeed("S-M05-08-OLD-MEMBER", async ({ browser, notes, seed }) => {
  await ensureM05Admin(browser, { 名前: "更新前担当者", account: M0508_OLD, メール: "m0508_old@example.test" });
  notes.set("〔メンバーID-M0508-共有〕", メンバーID(M0508_OLD.loginId));
  reportSeedIssue(seed.シードID, "読み替え: 所属は先頭の所属、パスワードは12文字以上（アプリの規則）、権限は「システム管理者」にした（シード表は任意）");
});

// ---- 共有の設定・マスタ（書き換えずに、シード表の状態かを確かめる） ----

defineSeed("S-M05-08-MASTER", async ({ seed }) => {
  for (const n of ["注文受領", "ピック中", "入金待ち"]) {
    if (!対応状況があるか(n)) throw new Error(`${seed.シードID}: 対応状況「${n}」が対応状況マスタに無い。共有のマスタなので試験の値を足さずに止めた`);
  }
  if (!開店か(本店ID)) throw new Error(`${seed.シードID}: 本店（店舗ID ${本店ID}）が開店でない。共有の店舗なので書き換えずに止めた`);
  reportSeedIssue(seed.シードID, "読み替え: 共有マスタは、この環境の初期データで足りることを読んで確かめただけで、書き換えていない（対応状況3件・本店が開店）。日本・東京都・商品の明細種別は、受注を画面で作れることで確かめた");
});

defineSeed("S-M05-08-PRINT-SETTING", async ({ seed }) => {
  const s = スタック用紙印刷の設定を読む();
  if (s.高額判定基準 !== "0" || s.高額判定額 !== "5000") {
    throw new Error(`${seed.シードID}: スタック用紙印刷の設定が 高額判定基準=${s.高額判定基準 ?? "未設定"}（0が販売価格）・高額判定額=${s.高額判定額 ?? "未設定"}（シード表は 販売価格・5000円）。` +
      "共有の設定なので、書き換えて戻す作りはせずに止めた（環境の担当者に値を確かめてもらう）");
  }
  reportSeedIssue(seed.シードID, "読み替え: シード表は各ケースの開始時にDBで指定値へ設定するとするが、共有の設定なので書き換えず、現在の値が 販売価格・5000円 であることを読んで確かめた");
});

// ---- 受注 ----

export type 作った = { キー: string; 注文番号: string | null; 受注ID: string; 配送ID: string; 受注明細ID: string };
const made = new Map<string, 作った[]>();
/** シードが作った受注（spec が注文番号・受注IDを引く）。キーは "" または "A"・"B" */
export function 受注の取得(seedId: string, キー = ""): 作った {
  const o = made.get(seedId)?.find((x) => x.キー === キー);
  if (!o) throw new Error(`${seedId} の受注「${キー}」をまだ作っていない`);
  return o;
}
/** 注文者名の検索語（実行の印つき。この実行の受注だけが一覧に出る）。ケース番号3桁つき */
export function 検索する注文者名(case3: string): string {
  return `E8${RUN_MARK}${case3}`;
}

let basePromise: Promise<{ 受注ID: string }> | null = null;
function 基の受注(browser: Browser, issue: (m: string) => void): Promise<{ 受注ID: string }> {
  if (!basePromise) {
    basePromise = 受注を作る(browser, "M05-08 の基の受注", "注文受領", issue);
    basePromise.catch(() => { basePromise = null; });
  }
  return basePromise;
}

type 受注の定め = {
  キー: string;
  /** 注文番号を未採番（NULL）にする */
  未採番?: boolean;
  /** 対応状況（既定 注文受領） */
  状態?: string;
  /** 注文確定日（日本時間 YYYY-MM-DD HH:MM:SS）。既定は未設定 */
  確定日?: string;
  /** 支払方法の表示名 */
  支払方法?: string;
  /** 担当者を更新前担当者にする（既定 true。更新前担当者を使わないシードは false） */
  担当者あり?: boolean;
};

const 呼び名 = /^〔(受注ID|注文番号|配送ID|受注明細ID)-M0508-(\d{3})([AB]?)〕$/;

function 受注のシード(seedId: string, defs: 受注の定め[], needsOld = true): void {
  const case3 = /(\d{3})$/.exec(seedId)?.[1];
  if (!case3) throw new Error(`${seedId} の末尾にケース番号3桁が無い`);
  const needs = ["S-M05-08-ADM", "S-M05-01-ADM", ...(needsOld ? ["S-M05-08-OLD-MEMBER"] : [])];
  defineSeed(seedId, { needs }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const base = await 基の受注(browser, issue);
    const list: 作った[] = [];
    const lines: string[] = [];
    for (const d of defs) {
      const 番号 = `${RUN_MARK.slice(-6)}${case3}${d.キー}`;
      const id = 受注を複製する(base.受注ID, 番号);
      const done = 受注を整える(id, {
        氏名: [`E8${RUN_MARK}`, case3], 受注日: "2026-09-01 09:00:00",
        ...(d.状態 && d.状態 !== "注文受領" ? { 対応状況: [d.状態] } : {}),
        ...(d.支払方法 ? (支払方法があるか(d.支払方法) ? { 支払方法: d.支払方法 } : { 支払方法の表示名: d.支払方法 }) : {}),
      });
      if (d.確定日) { 注文確定日を設定(id, d.確定日); done.push(`注文確定日を ${d.確定日} に`); }
      if (needsOld && d.担当者あり !== false) {
        担当者を設定(id, notes.get("〔メンバーID-M0508-共有〕"));
        done.push("担当者を更新前担当者に");
      }
      if (d.未採番) { 注文番号を未採番にする(id); done.push("注文番号を未採番（NULL）に"); }
      list.push({ キー: d.キー, 注文番号: d.未採番 ? null : 番号, 受注ID: id, 配送ID: 受注の配送ID(id), 受注明細ID: 受注明細ID(id) });
      lines.push(`受注${d.キー || "（1件）"}（受注ID ${id}・注文番号 ${d.未採番 ? "未採番" : 番号}）: ${done.join("、")}`);
    }
    made.set(seedId, list);
    const seed = getSeed(seedId);
    for (const l of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
      const m = 呼び名.exec(l);
      if (!m) {
        if (l.startsWith("〔メンバーID-")) continue;
        throw new Error(`${seedId}: 呼び名 ${l} の形を解釈できない`);
      }
      const o = list.find((x) => x.キー === m[3]);
      if (!o) throw new Error(`${seedId}: ${l} の受注（キー「${m[3]}」）を作っていない`);
      notes.set(l, m[1] === "受注ID" ? o.受注ID : m[1] === "注文番号" ? (o.注文番号 ?? "") : m[1] === "配送ID" ? o.配送ID : o.受注明細ID);
    }
    issue("読み替え: 受注は、画面（フロントの購入）で1件作った受注の行をDBで写して作った。注文番号は、画面が振る番号（登録時に振られる）に代えて、実行の印から作った値にした。" +
      `商品は、この実行で1件だけ作った印つきの試験商品（商品名「M05-08印刷商品-…」「M0508-…印刷商品」の代わり。共有の商品を使っていない）。購入者は M05-01 の試験用の会員（購入者のメールアドレスは読み替え）。注文者名は、検索で見つけるため「${検索する注文者名(case3)}」にした`);
    for (const l of lines) issue(`DBで設定した: ${l}（受注日を 2026-09-01 09:00:00 に）`);
  });
}

for (const n of ["001", "002", "004", "008", "009", "011", "012", "013", "014", "015", "018", "020"]) {
  受注のシード(`S-M05-08-TARGET-${n}`, [{ キー: "" }]);
}
受注のシード("S-M05-08-SELECTION-003", [{ キー: "A" }, { キー: "B" }]);
for (const n of ["005", "006", "007"]) {
  受注のシード(`S-M05-08-UNNUMBERED-${n}`, [{ キー: "A" }, { キー: "B", 未採番: true }]);
}
受注のシード("S-M05-08-NON-NEW-019", [{ キー: "", 状態: "入金待ち", 確定日: "2026-09-01 10:00:00" }]);
受注のシード("S-M05-08-MIXED-021", [
  { キー: "A", 支払方法: "代金引換", 担当者あり: false },
  { キー: "B", 状態: "入金待ち", 確定日: "2026-09-01 10:00:00", 支払方法: "銀行振込", 担当者あり: false },
], false);
受注のシード("S-M05-08-MULTI-022", [{ キー: "A", 担当者あり: false }, { キー: "B", 担当者あり: false }], false);
