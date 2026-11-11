/**
 * M05-26 出荷実績インポート登録の画面シード。正本: cases/M05-26_seed_data.tsv
 *
 * 方針（依頼者 2026-11-10）: シード表が「DBで登録」とするものも、まず画面で作る。画面で作れない部分は、E2E が作った「実行の印つき」のデータに限り、
 * db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） を通して DB に書く（db/m05_26.ts・db/m05_01_order_write.ts）。共有のマスタ・設定は書き換えない。
 *
 * - 受注: M05-01 と同じ方法で、画面（フロントの購入）で1件作った「基の受注」の行を DB で写して作る（seeds/m05-01.ts の 受注を作る）。
 *   注文番号は、シード表の「登録時に振られる」ものを、数字11桁（実行の印から作った値）に読み替える（出荷実績CSVの注文番号は数字として読まれる）。
 *   会員は、試験用の会員（M05-01 のもの）を写した「印つきのメールアドレスの会員」を、受注1件につき1人作る
 *   （シード表の member-m0526-NNN@example.test は、末尾に実行の印を付けた member-m0526-NNN-印@example.test に読み替え）。
 * - DB で設定するもの: 受注の対応状況（出荷指示／発送済み）・付与ポイント・出荷日・送り状No.、2件目の配送、会員ポイント残高（500）。
 *   ポイント履歴・メール送信履歴は、写した受注には無い（0件）ので消さない。
 * - 共有の設定（出荷完了メールの定型文・代表アドレス・CSV取込の区切り文字・スマレジ連携の応答）は書き換えない。環境の設定のままで、
 *   使えるかを確かめる（定型文が無ければシードを止める）。代表アドレスは変えない（メールの受信を確かめるケースは実装していない）。
 * - 非会員の受注（シード表の 00052603 など）は、写した受注の会員との関連を DB で外して作る。
 */
import { Browser } from "@playwright/test";
import { getSeed } from "../lib/catalog";
import { query } from "../lib/db";
import { CSV入出力設定 } from "../lib/app_config";
import { Notes } from "../lib/notes";
import { RUN_MARK } from "../lib/run_marker";
import { Account } from "../lib/session";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { 受注を整える, 受注を複製する, 会員を複製する } from "../db/m05_01_order_write";
import {
  会員のスマレジID, 会員のメール送信履歴, 会員のポイントを読む, 付与ポイントを設定, 会員ポイント残高を設定, 注文番号の受注件数, 出荷完了メール定型文の件数,
  配送IDの一覧, 配送の出荷日を設定, 配送先を足す,
} from "../db/m05_26";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";
import { M0501_BUYER, 受注を作る } from "./m05-01";

export const M0526_ADMIN: Account = { loginId: "m0526_admin", password: "Passw0rd!M0526" };
export const M0526_QF_ADMIN: Account = { loginId: "qf-m0526-admin", password: "Passw0rd-QFM0526" };
export const M0526_RE_ADMIN: Account = { loginId: "m0526re_admin", password: "Passw0rd-M0526RE" };

defineSeed("S-M05-26-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M05-26試験管理者", account: M0526_ADMIN, メール: "m0526_admin@example.test" });
  reportSeedIssue("S-M05-26-ADM", "権限は、受注管理を操作できる「システム管理者」にした（正本に権限の名前が無い）。所属店舗は店舗ID 1（無ければ先頭の店舗）");
});
defineSeed("S-M05-26-QF-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M05-26QF管理者", account: M0526_QF_ADMIN, メール: "qf-m0526-admin@example.test" });
  reportSeedIssue("S-M05-26-QF-ADM", "権限は、受注管理を操作できる「システム管理者」にした（正本に権限の名前が無い）。所属店舗は店舗ID 1（無ければ先頭の店舗）");
});
defineSeed("S-M05-26-RE-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M05-26RE管理者", account: M0526_RE_ADMIN, メール: "m0526re_admin@example.test" });
  reportSeedIssue("S-M05-26-RE-ADM", "権限は、出荷実績インポート登録と会員管理を操作できる「システム管理者」にした（正本に権限の名前が無い）。所属店舗は店舗ID 1（無ければ先頭の店舗）");
});

// ---- 共有の環境設定（書き換えずに、使える状態かを確かめる） ----

function メール定型文を確かめる(seedId: string): void {
  if (出荷完了メール定型文の件数() < 2) {
    throw new Error(`${seedId}: 出荷完了メールの日本語・英語の定型文がこの環境に無い。メールの定型文は共有のマスタなので、試験の値を足さずに止めた（環境の担当者に定型文を入れてもらう）`);
  }
  reportSeedIssue(seedId, "読み替え: 出荷完了メールの定型文（日本語・英語）は、この環境に登録済みであることを確かめただけで、書き換えていない（共有のマスタ）。" +
    "店舗ID 1の代表アドレスは、各ケースの指定のアドレスに変えていない（共有の設定。このシードを使うケースは、メールの受信を確かめない）");
}
for (const id of ["S-M05-26-MAIL-CONFIG", "S-M05-26-QF-MAIL", "S-M05-26-RE-MAIL-CONFIG"]) {
  defineSeed(id, async () => { メール定型文を確かめる(id); });
}
for (const id of ["S-M05-26-SMAREGI-NORMAL", "S-M05-26-QF-SMAREGI", "S-M05-26-RE-SMAREGI-NORMAL"]) {
  defineSeed(id, async () => {
    reportSeedIssue(id, "読み替え: スマレジ連携の応答は環境の設定のままで切り替えていない（環境の設定。画面からも確かめられない）");
  });
}
function 区切り文字を確かめる(seedId: string): void {
  let sep: string | null = null;
  try { sep = CSV入出力設定().取込区切り文字; } catch { /* 設定値を読めない環境 */ }
  if (sep === null) {
    reportSeedIssue(seedId, "読み替え: CSV取込の区切り文字は共有の設定で、この環境からは値を読めない。書き換えていない（カンマのはずとして進めた）");
  } else if (sep !== ",") {
    throw new Error(`${seedId}: CSV取込の区切り文字がカンマでない（「${sep}」）。共有の設定なので書き換えずに止めた`);
  } else {
    reportSeedIssue(seedId, "読み替え: CSV取込の区切り文字は、カンマであることを確かめただけで、書き換えていない（共有の設定）");
  }
}
for (const id of ["S-M05-26-CSV-SETTING", "S-M05-26-QF-CSV", "S-M05-26-RE-CSV-SETTING"]) {
  defineSeed(id, async () => { 区切り文字を確かめる(id); });
}

// ---- 取込用の受注 ----

const TOKEN5 = String(parseInt(RUN_MARK.slice(-6), 36) % 100000).padStart(5, "0");

export type 受注の型 = {
  /** 控える呼び名の末尾の識別（"" ・ "A" ・ "B"）。同じシードの中で一意 */
  キー: string;
  非会員?: boolean;
  状態?: "出荷指示" | "発送済み";
  /** 付与ポイント（既定 100。null で空） */
  付与ポイント?: number | null;
  /** 注文番号を「000＋数字5桁」の8桁にする（ゼロ埋めの確認用） */
  ゼロ埋め?: boolean;
};
export type 作った = { キー: string; 注文番号: string; 受注ID: string; 会員ID: string | null; 配送ID: string[] };
const made = new Map<string, 作った[]>();
/** シードが作った受注（spec が注文番号・受注ID・会員IDを引く） */
export function 受注の取得(seedId: string, キー = ""): 作った {
  const list = made.get(seedId);
  const o = list?.find((x) => x.キー === キー);
  if (!o) throw new Error(`${seedId} の受注「${キー}」をまだ作っていない`);
  return o;
}

let basePromise: Promise<{ 受注ID: string }> | null = null;
function 基の受注(browser: Browser, issue: (m: string) => void): Promise<{ 受注ID: string }> {
  if (!basePromise) {
    basePromise = 受注を作る(browser, "M05-26 の基の受注", "注文受領", issue);
    basePromise.catch(() => { basePromise = null; });
  }
  return basePromise;
}
function 基の会員ID(): string {
  const r = query(`select id from dtb_customer where email = $1 and del_flg = 0 order by id desc limit 1`, [M0501_BUYER.メール]);
  if (r.length === 0) throw new Error(`試験用の会員（${M0501_BUYER.メール}）が見つからない`);
  return String(r[0].id);
}

/** 未使用の注文番号（数字11桁。ケース番号3桁と連番で作る。使用済みなら連番をずらす） */
function 注文番号を決める(case3: string, i: number, ゼロ埋め: boolean): string {
  for (let a = 0; a < 10; a++) {
    const no = ゼロ埋め ? `000${String((Number(TOKEN5) + a) % 100000).padStart(5, "0")}` : `7${TOKEN5}${case3}${String(i + a * 10).padStart(2, "0")}`;
    if (注文番号の受注件数(no) === 0) return no;
  }
  throw new Error(`未使用の注文番号が見つからない（ケース ${case3}）`);
}

const 呼び名 = /^〔(注文番号|受注ID|会員ID|スマレジ会員ID|配送ID)-M0526-([A-Z]*\d+)([A-Z]*)(?:-(\d+))?〕$/;

/** シード表が控えると定める呼び名を、作った受注から控える */
function 控える(seedId: string, notes: Notes, list: 作った[]): void {
  const seed = getSeed(seedId);
  const members = list.filter((o) => o.会員ID !== null);
  const flat = members.flatMap((o) => o.配送ID);
  for (const l of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    if (l.includes("…")) continue;
    const m = 呼び名.exec(l);
    if (!m) throw new Error(`${seedId}: 呼び名 ${l} の形を解釈できない`);
    const [, 種, , key, n] = m;
    const byKey = () => {
      const o = list.find((x) => x.キー === key) ?? (key === "" && members.length === 1 ? members[0] : undefined);
      if (!o) throw new Error(`${seedId}: ${l} の受注（キー「${key}」）を作っていない`);
      return o;
    };
    if (種 === "注文番号") notes.set(l, byKey().注文番号);
    else if (種 === "受注ID") notes.set(l, byKey().受注ID);
    else if (種 === "会員ID") notes.set(l, byKey().会員ID ?? "");
    else if (種 === "スマレジ会員ID") notes.set(l, 会員のスマレジID(byKey().会員ID ?? "") || "（未設定）");
    else if (n) notes.set(l, byKey().配送ID[Number(n) - 1]);
    else notes.set(l, flat[key.charCodeAt(0) - 65] ?? (() => { throw new Error(`${seedId}: ${l} の配送を作っていない`); })());
  }
}

type 取込シードの注記 = { 注記?: string[] };

function 取込用シード(seedId: string, defs: 受注の型[], opt: 取込シードの注記 = {}, needs = ["S-M05-26-ADM", "S-M05-01-ADM"]): void {
  const case3 = /(\d{3})$/.exec(seedId)?.[1];
  if (!case3) throw new Error(`${seedId} の末尾にケース番号3桁が無い`);
  defineSeed(seedId, { needs }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const base = await 基の受注(browser, issue);
    const list: 作った[] = [];
    const lines: string[] = [];
    for (const [i, d] of defs.entries()) {
      const 番号 = 注文番号を決める(case3, i + 1, d.ゼロ埋め === true);
      const id = 受注を複製する(base.受注ID, 番号);
      let mid: string | null = null;
      if (!d.非会員) {
        const tail = defs.length > 1 ? `-${d.キー.toLowerCase() || i + 1}` : "";
        mid = 会員を複製する(基の会員ID(), `member-m0526-${case3}${tail}-${RUN_MARK}@example.test`);
      }
      const 状態 = d.状態 ?? "出荷指示";
      const 済み = 状態 === "発送済み";
      受注を整える(id, {
        会員ID: mid, 対応状況: [状態],
        出荷日: 済み ? "2026-08-01 09:00:00" : null, 送り状No: 済み ? "11111" : null,
      });
      if (mid) {
        付与ポイントを設定(id, d.付与ポイント === undefined ? 100 : d.付与ポイント);
        会員ポイント残高を設定(mid, 500);
      }
      配送先を足す(id);
      if (済み) 配送の出荷日を設定(id, "2026-08-01 09:00:00");
      const 配送ID = 配送IDの一覧(id);
      if (配送ID.length !== 2) throw new Error(`${seedId}: 受注 ${番号} の配送が ${配送ID.length} 件（2件のはず）`);
      if (mid) {
        const p = 会員のポイントを読む(mid);
        if (p.残高 !== 500 || p.履歴件数 !== 0) issue(`会員ポイント残高が ${p.残高}・ポイント履歴が ${p.履歴件数} 件（シード表は 500・0件）`);
        if (会員のメール送信履歴(mid).length !== 0) issue("メール送信履歴が0件でない");
      }
      list.push({ キー: d.キー, 注文番号: 番号, 受注ID: id, 会員ID: mid, 配送ID });
      lines.push(`${d.非会員 ? "非会員の受注" : `受注${d.キー}`}（注文番号 ${番号}）: ${[
        `対応状況を${状態}に`, 済み ? "出荷日を2026/08/01 09:00・送り状No.を11111に（配送情報の出荷日も同じ）" : "出荷日・送り状No.を空に",
        d.非会員 ? "会員との関連を外した" : `付与ポイントを${d.付与ポイント === undefined ? 100 : d.付与ポイント ?? "空"}に・会員ポイント残高を500に`, "配送を2件に",
      ].join("、")}`);
    }
    made.set(seedId, list);
    控える(seedId, notes, list);
    issue("読み替え: 受注は、画面（フロントの購入）で1件作った受注の行をDBで写して作った。注文番号は、画面が振る番号（登録時に振られる）に代えて数字11桁の値（実行の印から作った）にした");
    issue("読み替え: 会員は、試験用の会員（M05-01 のもの）を写した、実行の印つきのメールアドレスの会員にした（シード表の member-m0526-… は末尾に印を付けた値）。" +
      "スマレジ会員IDは、写した会員の値（画面では振らない）");
    for (const l of lines) issue(`DBで設定した: ${l}`);
    for (const n of opt.注記 ?? []) issue(n);
  });
}

const 会員受注 = (キー = "", 追加: Partial<受注の型> = {}): 受注の型 => ({ キー, ...追加 });
const 非会員受注 = (キー = "NM"): 受注の型 => ({ キー, 非会員: true });
const 非会員の注記 = "読み替え: 非会員の受注（シード表の注文番号 00052603 など・配送ID 5260…）は、写した受注の会員との関連をDBで外して作った。注文番号・配送IDは実行ごとの値";

for (const n of ["002", "003", "004"]) 取込用シード(`S-M05-26-${n === "002" ? "FULL" : "HEADER"}-${n}`, [会員受注()]);
取込用シード("S-M05-26-HEADER-005", [会員受注("", { ゼロ埋め: true })], {
  注記: ["読み替え: 注文番号 00052601・CSVの入力値 52601 は、先頭に0を3つ付けた8桁の注文番号（000＋実行の印から作った数字5桁）と、その先頭の0を除いた値に読み替えた（8桁への0埋めの確認が目的）"],
});
取込用シード("S-M05-26-SKIP-006", [会員受注()]);
取込用シード("S-M05-26-SKIP-007", [非会員受注("")], { 注記: [非会員の注記] });
取込用シード("S-M05-26-SKIP-008", [非会員受注("")], { 注記: [非会員の注記] });
取込用シード("S-M05-26-ERRORS-009", [会員受注()]);
取込用シード("S-M05-26-ERRORS-010", [会員受注()]);
取込用シード("S-M05-26-ERRORS-014", [会員受注("A"), 会員受注("B")]);
取込用シード("S-M05-26-ERRORS-015", [会員受注("A"), 会員受注("B")]);
取込用シード("S-M05-26-ERRORS-016", [会員受注(), 非会員受注()], { 注記: [非会員の注記] });
取込用シード("S-M05-26-ERRORS-017", [会員受注("A"), 会員受注("B")]);
for (const n of ["018", "019"]) 取込用シード(`S-M05-26-ENCODING-${n}`, [会員受注()]);
取込用シード("S-M05-26-TSV-020", [会員受注()]);
for (const n of ["022", "023", "024"]) 取込用シード(`S-M05-26-EXISTING-${n}`, [会員受注("", { 状態: "発送済み" })]);
取込用シード("S-M05-26-POINTS-025", [会員受注()]);
取込用シード("S-M05-26-POINTS-026", [会員受注("A", { 付与ポイント: 0 }), 会員受注("B", { 付与ポイント: null })]);
取込用シード("S-M05-26-HEADER-034", [会員受注()]);
取込用シード("S-M05-26-ERRORS-035", [会員受注("A"), 会員受注("B"), 非会員受注()], { 注記: [非会員の注記] });
取込用シード("S-M05-26-INVOICE-ALNUM-037", [会員受注()]);
取込用シード("S-M05-26-INVOICE-NONINT-040", [会員受注()]);
for (const id of ["S-M05-26-MULTIROW-042", "S-M05-26-MULTIPOINT-043", "S-M05-26-MULTIPOINT-044", "S-M05-26-MIXED-045"]) 取込用シード(id, [会員受注("A"), 会員受注("B")]);
for (const n of ["046", "047", "048"]) 取込用シード(`S-M05-26-REIMPORT-${n}`, [会員受注()]);
取込用シード("S-M05-26-CBZEROPT-051", [会員受注("", { 付与ポイント: 0 })]);

const RE注記 = "読み替え: 商品コード RE0526-… の商品（在庫10）は共有の商品として作らず、基の受注の商品（実行の印つき）にした。ケースは商品を確かめない";
取込用シード("S-M05-26-RE-POINTS-049", [会員受注()], { 注記: [RE注記] }, ["S-M05-26-RE-ADM", "S-M05-01-ADM"]);
取込用シード("S-M05-26-RE-EDIT-050", [会員受注()], { 注記: [RE注記] }, ["S-M05-26-RE-ADM", "S-M05-01-ADM"]);
取込用シード("S-M05-26-QF-ORDER-041", [会員受注()], {
  注記: ["読み替え: 会員 qf-m0526-001@example.test（パスワード Passw0rd-QF001）は、試験用の会員を写した印つきのメールアドレスの会員（パスワードは試験用の会員のもの）にした。" +
    "商品 QF-M0526-001 は、基の受注の商品（実行の印つき）にした。ケースはどちらの値も確かめない（購入履歴の出荷日の表示だけ）"],
}, ["S-M05-26-QF-ADM", "S-M05-01-ADM"]);

/** 写した会員（受注1件につき1人）のログイン用のメールアドレス（041 が使う）。パスワードは試験用の会員のもの */
export function 会員のメール(会員ID: string): string {
  const r = query(`select email from dtb_customer where id = $1::int`, [会員ID]);
  if (r.length === 0) throw new Error(`会員ID ${会員ID} が無い`);
  return String(r[0].email);
}
export const 会員のパスワード = M0501_BUYER.パスワード;
