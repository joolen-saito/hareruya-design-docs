/**
 * M08-08 手動メール通知（会員）の画面シード。正本: cases/M08-08_seed_data.tsv
 * 1. 会員: ケースごとに、フロントの新規会員登録で本会員を作る（seeds/f06-member.ts の 本会員を作る。メールの前半に実行の印）。氏名はシード表のとおり。
 *    会員登録ではメールの送信履歴は残らない（開発環境の DB の参照で確かめた）ので、送信履歴は0件のまま。
 * 2. 控える番号: 会員ID（会員一覧で控える）。
 *
 * シードでの解釈（正本の外の補い。記録 review/M08-08_progress_2026-11-11_dev.md にも書く）:
 * - テンプレート（固定ID 8083007 など・「M08-08試験店舗」への紐付け）: メール管理のテンプレートは全員が使うマスタなので DB に足さず、
 *   開発環境に既にある手動送信用のもので読み替える。「A-会員」「RH-会員」＝【通販/日】白紙テンプレ(アカウント用)、「B-会員英語」＝【通販/英】白紙テンプレ(アカウント用)、
 *   「C-ベースなし」＝ベースなしのテンプレート（WAR日本語版PWキャンセルテンプレ）、「D-自動送信」＝自動送信のテンプレート（番号の小さいもの）。
 *   テンプレートの選択肢は店舗で絞られない作り（アプリのソース）なので、店舗への紐付けは見ない。
 * - 管理者の所属「M08-08試験店舗」「M0808RH店舗」: 店舗を新しく作らない決まりなので、本店に所属させた。
 * - 店名・メールアドレス（S-M08-08-SHOP・RH-SHOP）: 全員が使う設定なので書き換えず、本店（店舗ID 1）のいまの値で確かめる（会員の手動メールは本店の基本情報で送られる）。
 * - 受信箱（S-M08-08-MAILBOX）: 開発環境のメールの受け口を使い、全削除はしない。操作の前に受け口のメールの番号を控え、そのあとに届いたものだけを数える。
 */
import { MAIL_URL } from "../config/env";
import { 会員IDがある, 会員の送信履歴, 自動送信のテンプレート, テンプレート, 本店の基本情報 } from "../db/m05_06";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc, rcFixed } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account } from "../lib/session";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";
import { markedMail, 本会員を作る } from "./f06-member";

export const M0808_ADMIN: Account = { loginId: rcFixed("m0808_admin").toLowerCase(), password: "Passw0rd!M0808" };
export const M0808RH_ADMIN: Account = { loginId: rcFixed("m0808rh_admin").toLowerCase(), password: "Passw0rd-M0808RH" };
const PW = "Passw0rd!M0808C";

/** テンプレートの読み替え（開発環境に既にある手動送信用のテンプレートの番号） */
export const テンプレの読み替え = { A会員: "139", B会員英語: "140", Cベースなし: "154", RH会員: "139" } as const;
export const テンプレの正本の名前 = { A会員: "A-会員", B会員英語: "B-会員英語", Cベースなし: "C-ベースなし", RH会員: "RH-会員-001" } as const;
export const 自動送信の読み替え = () => 自動送信のテンプレート();

defineSeed("S-M08-08-ADM", async ({ browser, seed }) => {
  await ensureM05Admin(browser, { 名前: rcFixed("M08-08管理者"), account: M0808_ADMIN, メール: `${M0808_ADMIN.loginId}@example.test` });
  reportSeedIssue(seed.シードID, "権限は会員管理を操作できる「システム管理者」。所属の「M08-08試験店舗」は、店舗を新しく作らないので本店にした。ログインID・名前に実行の印を付けた（開発環境に同じログインIDのメンバーがありうるため）");
});
defineSeed("S-M08-08-RH-ADM", async ({ browser, seed }) => {
  await ensureM05Admin(browser, { 名前: rcFixed("M08-08RH管理者"), account: M0808RH_ADMIN, メール: `${M0808RH_ADMIN.loginId}@example.test` });
  reportSeedIssue(seed.シードID, "権限は会員管理を操作できる「システム管理者」。所属の「M0808RH店舗」は、店舗を新しく作らないので本店にした。ログインID・名前に実行の印を付けた");
});

function 基本情報を確かめる(seedId: string): void {
  const b = 本店の基本情報();
  if (!b.店名 || !b.送信元) throw new Error(`${seedId}: 本店の基本情報に店名か送信元メールアドレスが無い`);
  reportSeedIssue(seedId, `店名・送信元/返信受付/送信エラー受付のメールアドレスは全員が使う店舗基本設定なので書き換えず、本店（店舗ID 1）のいまの値（店名「${b.店名}」）で確かめる（正本の外の補い）`);
}
defineSeed("S-M08-08-SHOP", async ({ seed }) => 基本情報を確かめる(seed.シードID));
defineSeed("S-M08-08-RH-SHOP", async ({ seed }) => 基本情報を確かめる(seed.シードID));
defineSeed("S-M08-08-MAILBOX", async ({ seed }) => {
  if (!MAIL_URL) throw new Error(`${seed.シードID}: メールの受け口（E2E_MAIL_URL）が無い`);
  reportSeedIssue(seed.シードID, "開発環境のメールの受け口を使った。受信箱の全削除はしない（ほかの方のメールもあるため）。操作の前に受け口のメールの番号を控え、そのあとに試験会員の印つきのアドレスへ届いたものだけを数える");
});

function テンプレの注記(seedId: string, keys: (keyof typeof テンプレの読み替え)[], 自動送信 = false): void {
  const lines: string[] = [];
  for (const k of keys) {
    const t = テンプレート(テンプレの読み替え[k]);
    if (!t) throw new Error(`${seedId}: 読み替えに使うテンプレート（番号 ${テンプレの読み替え[k]}）が開発環境に無い`);
    if (t.自動送信) throw new Error(`${seedId}: テンプレート「${t.名前}」が自動送信になっている`);
    lines.push(`「${テンプレの正本の名前[k]}」＝「${t.名前}」（番号 ${t.ID}・件名「${t.件名}」）`);
  }
  if (自動送信) { const d = 自動送信の読み替え(); lines.push(`「D-自動送信」＝「${d.名前}」（番号 ${d.ID}）`); }
  reportSeedIssue(seedId, `テンプレートは DB に足さず、開発環境に既にあるもので読み替えた（正本の外の補い）: ${lines.join("・")}`);
}

/** シードID → 会員の定め（テンプレートの読み替えの注記） */
type 定め = { 前半: string; 姓: string; 名: string; セイ: string; メイ: string; テンプレ: (keyof typeof テンプレの読み替え)[]; 自動送信?: boolean };
const 山田 = (前半: string, テンプレ: 定め["テンプレ"] = ["A会員"], 自動送信 = false): 定め => ({ 前半, 姓: "山田", 名: "太郎", セイ: "ヤマダ", メイ: "タロウ", テンプレ, 自動送信 });
const 定めの表: Record<string, 定め> = {
  "DATA-001": 山田("manual808-001", []), "DATA-002": 山田("manual808-002", []), "DATA-003": 山田("manual808-003", []),
  "DATA-004": 山田("manual808-004", ["A会員", "B会員英語", "Cベースなし"], true), "DATA-006": 山田("manual808-006"),
  "DATA-007": 山田("manual808-007"), "DATA-009": 山田("manual808-009", ["Cベースなし"]), "DATA-010": 山田("manual808-010"),
  "DATA-011": 山田("manual808-011"), "DATA-012": 山田("manual808-012"), "DATA-013": 山田("manual808-013", []),
  "DATA-014": 山田("manual808-014"), "DATA-015": 山田("manual808-015"), "DATA-016": 山田("manual808-016"),
  "DATA-017": 山田("manual808-017"), "DATA-018": 山田("manual808-018"), "DATA-019": 山田("manual808-019"), "DATA-020": 山田("manual808-020"),
  "DPM-023": 山田("dpm0808-023"), "DPM-024": 山田("dpm0808-024"),
  "RH-DATA-025": { 前半: "m0808rh-001", 姓: "手動", 名: "太郎", セイ: "シュドウ", メイ: "タロウ", テンプレ: ["RH会員"] },
};

export type 作った会員 = { 会員ID: string; メール: string; 氏名: string };
const 作った = new Map<string, 作った会員>();
export function 作った会員の(seedId: string): 作った会員 {
  const v = 作った.get(seedId);
  if (!v) throw new Error(`${seedId} はまだ作っていない`);
  return v;
}

for (const [k, d] of Object.entries(定めの表)) {
  const seedId = `S-M08-08-${k}`;
  const 番号 = k === "RH-DATA-025" ? "001" : /-(\d{3})$/.exec(k)![1];
  const needs = k.startsWith("RH-") ? ["S-M08-08-RH-ADM"] : ["S-M08-08-ADM"];
  defineSeed(seedId, { needs }, async ({ browser, notes }) => {
    if (k === "DATA-003" && 会員IDがある("999999")) throw new Error(`${seedId}: 会員ID 999999 の会員が開発環境にある（正本は未登録）。ほかの方の会員なので消さない`);
    const 会員ID = await 本会員を作る(browser, { 姓: d.姓, 名: d.名, セイ: d.セイ, メイ: d.メイ, 前半: d.前半, パスワード: PW });
    const 履歴 = 会員の送信履歴(会員ID).length;
    if (履歴 !== 0) throw new Error(`${seedId}: 作った会員 ${会員ID} の送信履歴が ${履歴} 件（0件のはず）`);
    if (d.テンプレ.length || d.自動送信) テンプレの注記(seedId, d.テンプレ, d.自動送信);
    作った.set(seedId, { 会員ID, メール: markedMail(d.前半), 氏名: `${d.姓} ${d.名}` });
    const s = getSeed(seedId);
    for (const label of Notes.labelsIn(s["状態・属性"] + s.投入方法)) {
      if (label !== `〔会員ID-M0808-${番号}〕`) throw new Error(`${seedId}: 呼び名 ${label} に当たる値が無い`);
      notes.set(label, 会員ID);
    }
  });
}
