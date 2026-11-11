/**
 * M05-19 出荷指示リスト検索の画面シード。正本: cases/M05-19_seed_data.tsv
 *
 * 方針（依頼者 2026-11-10）: シード表が「DBで登録」とするものも、まず画面で作る。画面で作れない部分（リストの登録日時・更新日時、受注の出荷指示日、
 * 注文区分「予約」「大量」）だけ、E2E が作った「実行の印つき」のデータに限り、db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） を通して DB に書く。
 * 共有のマスタ・設定・ほかの人のデータは書き換えない。
 *
 * 作り方は M05-20 と同じ（seeds/m05-20.ts の リストを作る）: 印つきの試験商品を M05-01 と同じ方法で作り、M05-01 の試験用会員がフロントで注文し、
 * 管理画面の出荷指示リスト検索の生成欄で注文番号の範囲（その注文だけ）を指定して生成する。生成の前に、範囲にほかの人の受注が入らないことを
 * DB の参照で確かめ、入っていれば止める。
 *
 * 読み替え:
 *  - 出荷指示番号・受注ID・注文番号は、画面が振った値（控える）。
 *  - 商品は、シード表の「販売中の商品1点」でなく、実行の印つきの試験商品（共有の商品を注文して在庫を減らさない）。会員は M05-01 の試験用会員。
 *  - 注文区分「予約」「大量」は、リストの注文区分だけを DB で設定した（アプリは受注の商品名・合計種別から区分を決めるが、試験商品を流用するため）。
 *  - 受注の商品名が定められている 032 は、DB で受注の明細の商品名を「予約商品-M0519-032」に設定した。
 *  - 表示件数の設定（S-M05-19-PAGE-CONFIG）・11件／12件のシード（S-M05-19-PAGING-11-READ・PAGING-12-READ）は作らない（共有の設定を書き換えて戻す作りと、
 *    大量のデータを残す作りになるため。判断待ち）。
 */
import { 出荷指示リストの注文区分を設定する } from "../db/m05_19";
import { 明細を整える, 出荷指示リストを整える } from "../db/m05_20";
import { 受注を整える } from "../db/m05_01_order_write";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account } from "../lib/session";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";
import { リストを作る, 作ったリスト } from "./m05-20";

export const M0519_ADMIN: Account = { loginId: "m0519_admin", password: "Passw0rd!M0519" };

defineSeed("S-M05-19-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M05-19試験管理者", account: M0519_ADMIN, メール: "m0519_admin@example.test" });
});

const needs = ["S-M05-19-ADM", "S-M05-01-ADM"];

/** 日付だけの値の受注の出荷指示日は、昼の12時にする（画面の日付表示が時差でずれないため） */
const 昼 = (ymd: string) => `${ymd} 12:00:00`;

function 共通の注記(issue: (m: string) => void): void {
  issue("読み替え: 出荷指示番号・受注ID・注文番号は、画面が振った値（控えた値）を使う。会員は M05-01 の試験用の会員がフロントで注文した。" +
    "商品は、実行の印つきの試験商品（グッズ商品CSV登録・在庫変更CSV登録・承認で作る）。配送方法は出荷指示リストから除外されないもの、支払方法は外部決済を使わない代金引換");
}

/** リストの日時と、その受注の出荷指示日を設定する（画面で指定できない） */
function 日時を整える(r: 作ったリスト, 登録: string, 更新: string, 出荷指示日: string, issue: (m: string) => void, 区分?: string): void {
  出荷指示リストを整える(r.リストID, { 登録日: 登録, 更新日: 更新 });
  for (const o of r.受注) 受注を整える(o.受注ID, { 出荷指示日: 昼(出荷指示日), 対応状況: ["出荷指示"] });
  let m = `DBで、出荷指示番号 ${r.リストID} の登録日時を ${登録}・更新日時を ${更新} に、受注の出荷指示日を ${出荷指示日} に設定した（画面で指定できない）`;
  if (区分) {
    出荷指示リストの注文区分を設定する(r.リストID, 区分);
    m += `。注文区分を「${区分}」に設定した（画面で指定できない。注文区分のマスタは読むだけ）`;
  }
  issue(m);
}

function 控える(seedId: string, notes: Notes, map: Record<string, string>): void {
  const seed = getSeed(seedId);
  for (const label of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    const v = map[label.slice(1, -1)];
    if (!v) throw new Error(`${seedId}: 呼び名 ${label} に当たる値が無い`);
    notes.set(label, v);
  }
}

// 基本検索データ（共有可。どのケースも状態を変更しない）
defineSeed("S-M05-19-BASE-READ", { needs }, async ({ browser, notes }) => {
  const seedId = "S-M05-19-BASE-READ";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  共通の注記(issue);
  const opt = { 管理者: M0519_ADMIN };
  const A = await リストを作る(browser, seedId, issue, { ...opt, 件数: 2 });
  const B = await リストを作る(browser, seedId, issue, { ...opt, 件数: 1 });
  const C = await リストを作る(browser, seedId, issue, { ...opt, 件数: 1 });
  日時を整える(A, "2026-08-20 10:00:00", "2026-08-21 11:00:00", "2026-08-20", issue);
  日時を整える(B, "2026-08-19 10:00:00", "2026-08-20 11:00:00", "2026-08-19", issue, "予約");
  日時を整える(C, "2026-08-18 10:00:00", "2026-08-19 11:00:00", "2026-08-18", issue, "大量");
  控える(seedId, notes, {
    "出荷指示番号-M0519-共有-基本A": A.リストID, "出荷指示番号-M0519-共有-基本B": B.リストID, "出荷指示番号-M0519-共有-基本C": C.リストID,
    "注文番号-M0519-共有-基本A1": A.受注[0].注文番号, "注文番号-M0519-共有-基本A2": A.受注[1].注文番号,
    "注文番号-M0519-共有-基本B": B.受注[0].注文番号, "注文番号-M0519-共有-基本C": C.受注[0].注文番号,
    "受注ID-M0519-共有-基本A1": A.受注[0].受注ID, "受注ID-M0519-共有-基本A2": A.受注[1].受注ID,
    "受注ID-M0519-共有-基本B": B.受注[0].受注ID, "受注ID-M0519-共有-基本C": C.受注[0].受注ID,
  });
});

/** 1件の受注だけを持つ出荷指示リスト（ケース専用） */
function defineSingle(seedId: string, no: string, d: { 区分?: string; 商品名?: string } = {}): void {
  defineSeed(seedId, { needs }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    共通の注記(issue);
    const r = await リストを作る(browser, seedId, issue, { 管理者: M0519_ADMIN, 件数: 1 });
    日時を整える(r, "2026-08-01 10:00:00", "2026-08-01 10:00:00", "2026-08-01", issue, d.区分);
    if (d.商品名) {
      明細を整える(r.受注[0].受注ID, { 商品名: d.商品名 });
      issue(`DBで、受注の明細の商品名を「${d.商品名}」に設定した（画面で指定できない）`);
    }
    控える(seedId, notes, {
      [`出荷指示番号-M0519-${no}`]: r.リストID, [`注文番号-M0519-${no}`]: r.受注[0].注文番号, [`受注ID-M0519-${no}`]: r.受注[0].受注ID,
    });
  });
}
defineSingle("S-M05-19-DELETE-028", "028");
defineSingle("S-M05-19-DELETE-029", "029");
defineSingle("S-M05-19-DP-ORDER1-031", "031");
defineSingle("S-M05-19-DP-RESERVE-032", "032", { 区分: "予約", 商品名: "予約商品-M0519-032" });
defineSingle("S-M05-19-DP-BULK-033", "033", { 区分: "大量" });
