/**
 * M05-06 メール一括送信機能の画面シード。正本: cases/M05-06_seed_data.tsv
 * 1. 会員: 受注ごとに、フロントの新規会員登録で本会員を作る（seeds/f06-member.ts の 本会員を作る。メールの前半に実行の印）。氏名はシード表のとおり。
 * 2. 商品: S-M05-06-MASTERS（共有）の1件を、グッズ商品CSV登録で作って本店・EC-CUBE に入庫し、別のメンバーが承認する（pages/admin/f04_setup.ts）。
 *    商品コード・商品名に実行の印を付ける。プロセスの中で一度だけ作る。
 * 3. 受注: 会員でフロントにログインし、商品をカートに入れて注文する（pages/front/m05_front_order.ts の 会員が商品を注文する）。
 *    DETAIL-017・020 は受注情報編集で送料・手数料・値引きを入れる。
 * 4. 控える番号: 注文番号・受注の番号・配送の番号（受注一覧のチェック欄の値＝配送の番号）・会員の番号。
 * 5. DB での書き足し（E2E の行だけ。db/m05_09.ts・db/m05_06.ts）: シード表の受注日時、購入完了のときに自動で残る送信履歴を消して0件にする。
 *
 * シードでの解釈（正本の外の補い。記録 review/M05-06_progress_2026-11-11_dev.md にも書く）:
 * - テンプレート（S-M05-06-TEMPLATES・RE-TEMPLATE）: メール管理のテンプレートは全員が使うマスタなので足さず、開発環境に既にある手動送信用のものを使う。
 *   「M0506テンプレA」「M0506RE連携テンプレ」＝【通販/日】白紙テンプレ(注文用)、「M0506テンプレB」＝【通販/日】出荷完了（追跡番号付き）、
 *   「M0506注文者名なし」＝ベースなしのテンプレート（WAR日本語版PWキャンセルテンプレ）。件名・本文はそのテンプレートの値で確かめる。
 * - 基本情報（S-M05-06-BASE・RE-BASE）: 店名・メールアドレスは全員が使う設定なので書き換えず、本店（店舗ID 1）のいまの値で確かめる。
 * - メール受信（S-M05-06-MAIL-CAPTURE・RE-MAIL-CAPTURE）: 開発環境のメールの受け口を使う。受信箱の全削除はしない（ほかの方のメールもあるため）。
 *   操作の前に受け口のメールの番号を控え、そのあとに試験会員の印つきのアドレスへ届いたものだけを数える。
 * - 支店受注（006・015・018 の B）: フロントで注文した受注は本店の受注になり、支店の受注を画面で作れない（店舗を新しく作らない決まり）。
 *   B も本店の受注（注文者「支店 花子」の別の会員）として作った。
 * - 配送方法「宅配便」・支払方法「クレジットカード」: 注文の部品が選ぶ既定の配送方法・支払方法のまま（期待結果が見ない）。
 * - DETAIL-017・020 の配送会社「晴屋便」・送り状番号・配送希望日は、配送方法のマスタ（全員が使う）を足さないので入れていない（期待結果が見ない）。
 */
import { Browser } from "@playwright/test";
import { MAIL_URL, SETUP_ADMIN } from "../config/env";
import { 会員IDがある, 受注の送信履歴を消す, 会員の送信履歴を消す, 配送IDがある, 受注IDがある, テンプレート, 本店の基本情報 } from "../db/m05_06";
import { 受注IDの, 受注の配送先ID, 受注日時を書き足す } from "../db/m05_09";
import { 受注の対応状況名 } from "../db/m05_22";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc, rcFixed } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { 商品を作って入庫する } from "../pages/admin/f04_setup";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";
import { OrderEditPage, OrderItemsEdit } from "../pages/admin/m05_11_order_edit";
import { 受注情報編集を開く } from "../pages/admin/m05_09_delivery_slips";
import { 会員が商品を注文する } from "../pages/front/m05_front_order";
import { markedMail, 本会員を作る } from "./f06-member";

/** 開発環境に手動テスト用の同じログインIDのメンバーがあることがあるので、実行の印つきで作る */
export const M0506_ADMIN: Account = { loginId: rcFixed("m0506_admin").toLowerCase(), password: "Passw0rd!M0506" };
export const M0506RE_ADMIN: Account = { loginId: rcFixed("m0506re_admin").toLowerCase(), password: "Passw0rd-M0506RE" };
const PW = "Passw0rd!M0506C";

/** テンプレートの読み替え（開発環境に既にある手動送信用のテンプレートの番号） */
export const テンプレの読み替え = { テンプレA: "101", テンプレB: "102", 注文者名なし: "154", RE連携: "101" } as const;
const テンプレの名前 = { テンプレA: "M0506テンプレA", テンプレB: "M0506テンプレB", 注文者名なし: "M0506注文者名なし", RE連携: "M0506RE連携テンプレ" } as const;

defineSeed("S-M05-06-ADM", async ({ browser, seed }) => {
  await ensureM05Admin(browser, { 名前: rcFixed("M05-06管理者"), account: M0506_ADMIN, メール: `${M0506_ADMIN.loginId}@example.test` });
  reportSeedIssue(seed.シードID, "権限は受注管理・メール管理を操作できる「システム管理者」、所属店舗・既定の検索店舗は本店。ログインID・名前に実行の印を付けた（開発環境に同じログインIDのメンバーがありうるため）。支店・スマレジ受注の参照は、支店・スマレジの受注を作らないので確かめていない");
});
defineSeed("S-M05-06-RE-ADM", async ({ browser, seed }) => {
  await ensureM05Admin(browser, { 名前: rcFixed("M05-06RE管理者"), account: M0506RE_ADMIN, メール: `${M0506RE_ADMIN.loginId}@example.test` });
  reportSeedIssue(seed.シードID, "権限は受注管理・メール管理・会員管理を操作できる「システム管理者」、所属店舗は本店。ログインID・名前に実行の印を付けた");
});

/** 共有の商品（プロセスの中で一度だけ作る） */
const 共有の商品 = new Map<string, string>();
async function 商品を用意する(browser: Browser, seedId: string, コード: string, 名前: string): Promise<string> {
  const have = 共有の商品.get(コード);
  if (have) return have;
  const made = await 商品を作って入庫する(browser, seedId, [{ 商品コード: rc(コード), 商品名: rc(名前), 価格: "1000", 入庫数: 200 }], (m) => reportSeedIssue(seedId, m));
  共有の商品.set(コード, made[0].productId);
  reportSeedIssue(seedId, `商品 ${rc(コード)}（商品ID ${made[0].productId}）をグッズ商品CSV登録で作り、本店・EC-CUBE に200入庫して承認した。配送方法・支払方法・受注ステータスのマスタは書き換えず、開発環境のものを使う`);
  return made[0].productId;
}
defineSeed("S-M05-06-MASTERS", async ({ browser, seed, notes }) => {
  notes.set("〔商品ID-M0506-共有〕", await 商品を用意する(browser, seed.シードID, "M0506-MAIL-ITEM", "M05-06メール試験商品"));
});
defineSeed("S-M05-06-RE-MASTERS", async ({ browser, seed }) => {
  await 商品を用意する(browser, seed.シードID, "M0506RE-ITEM", "M05-06連携試験商品");
});

function テンプレを確かめる(seedId: string, keys: (keyof typeof テンプレの読み替え)[]): void {
  const lines: string[] = [];
  for (const k of keys) {
    const t = テンプレート(テンプレの読み替え[k]);
    if (!t) throw new Error(`${seedId}: 読み替えに使うテンプレート（番号 ${テンプレの読み替え[k]}）が開発環境に無い`);
    if (t.自動送信 || !["Mail/sell_order.twig", "Mail/no_base.twig"].includes(t.ベース)) throw new Error(`${seedId}: テンプレート「${t.名前}」は受注の手動メールで選べない（自動送信か、ベースが違う）`);
    lines.push(`「${テンプレの名前[k]}」＝「${t.名前}」（件名「${t.件名}」）`);
  }
  reportSeedIssue(seedId, `メール管理のテンプレートは全員が使うマスタなので足さず、開発環境に既にある手動送信用のものを使った（正本の外の補い）: ${lines.join("・")}。件名・本文はそのテンプレートの値で確かめる`);
}
defineSeed("S-M05-06-TEMPLATES", async ({ seed }) => { テンプレを確かめる(seed.シードID, ["テンプレA", "テンプレB", "注文者名なし"]); });
defineSeed("S-M05-06-RE-TEMPLATE", async ({ seed }) => { テンプレを確かめる(seed.シードID, ["RE連携"]); });

function 基本情報を確かめる(seedId: string): void {
  const b = 本店の基本情報();
  if (!b.店名 || !b.送信元) throw new Error(`${seedId}: 本店の基本情報に店名か送信元メールアドレスが無い`);
  reportSeedIssue(seedId, `店名・送信元/返信先/送信エラー通知メールアドレスは全員が使う店舗基本設定なので書き換えず、本店（店舗ID 1）のいまの値（店名「${b.店名}」）で確かめる（正本の外の補い）`);
}
defineSeed("S-M05-06-BASE", async ({ seed }) => 基本情報を確かめる(seed.シードID));
defineSeed("S-M05-06-RE-BASE", async ({ seed }) => 基本情報を確かめる(seed.シードID));

function 受け口を確かめる(seedId: string): void {
  if (!MAIL_URL) throw new Error(`${seedId}: メールの受け口（E2E_MAIL_URL）が無い`);
  reportSeedIssue(seedId, "開発環境のメールの受け口を使った。受信箱の全削除はしない（ほかの方のメールもあるため）。操作の前に受け口のメールの番号を控え、そのあとに試験会員の印つきのアドレスへ届いたものだけを数える");
}
defineSeed("S-M05-06-MAIL-CAPTURE", async ({ seed }) => 受け口を確かめる(seed.シードID));
defineSeed("S-M05-06-RE-MAIL-CAPTURE", async ({ seed }) => 受け口を確かめる(seed.シードID));

// ---- ケース専用のシード（受注） ----

type 受注の定め = { 前半: string; 姓: string; 名: string; セイ: string; メイ: string; 数量?: number; 金額?: { 送料: string; 手数料: string; 値引き: string } };
const 本店太郎 = (前半: string): 受注の定め => ({ 前半, 姓: "本店", 名: "太郎", セイ: "ホンテン", メイ: "タロウ" });
const 支店花子 = (前半: string): 受注の定め => ({ 前半, 姓: "支店", 名: "花子", セイ: "シテン", メイ: "ハナコ" });
const 差込確認 = (前半: string): 受注の定め => ({ 前半, 姓: "差込", 名: "確認", セイ: "サシコミ", メイ: "カクニン", 数量: 10, 金額: { 送料: "800", 手数料: "200", 値引き: "1000" } });

/** シードID → 受注（1件目が A、2件目が B） */
const 定めの表: Record<string, 受注の定め[]> = {
  "ORDERS-001": [本店太郎("main-m0506-001")], "ORDERS-002": [本店太郎("main-m0506-002")], "ORDERS-003": [本店太郎("main-m0506-003")],
  "ORDERS-005": [本店太郎("main-m0506-005")], "ORDERS-006": [本店太郎("main-m0506-006"), 支店花子("branch-m0506-006")],
  "ORDERS-007": [本店太郎("main-m0506-007")], "ORDERS-008": [本店太郎("main-m0506-008")], "ORDERS-010": [本店太郎("main-m0506-010")],
  "ORDERS-011": [本店太郎("main-m0506-011")], "ORDERS-012": [本店太郎("main-m0506-012")], "ORDERS-013": [本店太郎("main-m0506-013")],
  "ORDERS-015": [本店太郎("main-m0506-015"), 支店花子("branch-m0506-015")],
  "DETAIL-017": [差込確認("detail-m0506-017")], "ORDERS-018": [本店太郎("main-m0506-018"), 支店花子("branch-m0506-018")],
  "DETAIL-020": [差込確認("detail-m0506-020")], "ORDERS-022": [本店太郎("main-m0506-022")], "ORDERS-024": [本店太郎("main-m0506-024")],
  "SINGLE-025": [{ 前半: "single-m0506-025", 姓: "一件", 名: "送信", セイ: "イッケン", メイ: "ソウシン" }],
  "ORDERS-028": [本店太郎("main-m0506-028")], "ORDERS-029": [本店太郎("main-m0506-029")],
  "ORDERS-030": [本店太郎("main-m0506-030a"), { 前半: "main-m0506-030b", 姓: "本店", 名: "次郎", セイ: "ホンテン", メイ: "ジロウ" }],
  "ORDERS-031": [本店太郎("main-m0506-031")],
};

export type 作った受注 = { 会員ID: string; メール: string; 注文番号: string; 受注ID: string; 配送ID: string; 氏名: string };
const 作った = new Map<string, 作った受注[]>();
export function 作った受注の(seedId: string): 作った受注[] {
  const v = 作った.get(seedId);
  if (!v) throw new Error(`${seedId} はまだ作っていない`);
  return v;
}
/** 試験会員のメールアドレス（前半に実行の印） */
export const 会員のメール = (前半: string): string => markedMail(前半);

async function 受注を作る(browser: Browser, seedId: string, 商品ID: string, o: 受注の定め): Promise<作った受注> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const メール = 会員のメール(o.前半);
  const 会員ID = await 本会員を作る(browser, { 姓: o.姓, 名: o.名, セイ: o.セイ, メイ: o.メイ, 前半: o.前半, パスワード: PW });
  const 注文番号 = await 会員が商品を注文する(browser, { メール, パスワード: PW }, [{ 商品ID, 数量: o.数量 ?? 1 }], `${seedId}: ${o.前半} の受注`);
  const 受注ID = 受注IDの(注文番号, メール);
  const 配送 = 受注の配送先ID(受注ID);
  if (配送.length !== 1) throw new Error(`${seedId}: 受注 ${注文番号} の配送が ${配送.length} 件（1件のはず）`);
  if (o.金額) {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      await 受注情報編集を開く(page, 受注ID);
      await new OrderItemsEdit(page).金額欄(o.金額!);
      const warnings = await new OrderEditPage(page).受注情報を登録する((m) => issue(`${注文番号}: 受注情報の登録の確認「${m}」`));
      for (const w of warnings) issue(`${注文番号}: 受注情報の登録の警告「${w}」`);
    });
    issue(`${注文番号}: 受注情報編集で送料 ${o.金額.送料}・手数料 ${o.金額.手数料}・値引き ${o.金額.値引き} を入れた（配送会社・送り状番号・配送希望日は入れていない）`);
  }
  const st = 受注の対応状況名(受注ID);
  if (st !== "新規受付") issue(`${注文番号}: 注文のあとの対応状況は「${st}」（シード表は「新規受付」。注文の部品の既定の支払方法による）`);
  return { 会員ID, メール, 注文番号, 受注ID, 配送ID: 配送[0], 氏名: `${o.姓} ${o.名}` };
}

for (const [k, orders] of Object.entries(定めの表)) {
  const seedId = `S-M05-06-${k}`;
  const 番号 = /-(\d{3})$/.exec(seedId)![1];
  defineSeed(seedId, { needs: ["S-M05-06-ADM", "S-M05-06-MASTERS"] }, async ({ browser, notes }) => {
    const 商品ID = notes.get("〔商品ID-M0506-共有〕");
    const made: 作った受注[] = [];
    for (const o of orders) made.push(await 受注を作る(browser, seedId, 商品ID, o));
    const 日時 = /受注日時=(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/.exec(getSeed(seedId)["状態・属性"])?.[1];
    for (const m of made) {
      if (日時) 受注日時を書き足す(seedId, [m.受注ID], m.メール, 日時);
      const n = 受注の送信履歴を消す(seedId, m.受注ID, m.メール);
      reportSeedIssue(seedId, `${m.注文番号}: DB で書き足した（E2E の行だけ）: ${日時 ? `受注日時を ${日時}・` : ""}購入完了のときに残った送信履歴 ${n} 件を消して0件にした`);
    }
    if (seedId.endsWith("-002")) {
      if (配送IDがある("999999") || 受注IDがある("999999")) throw new Error(`${seedId}: 受注または配送の番号 999999 が開発環境にある（正本は未登録）。ほかの方の行なので消さない`);
    }
    作った.set(seedId, made);
    const 文字 = (i: number) => (made.length > 1 ? "AB"[i] : "");
    const v: Record<string, string> = {};
    made.forEach((m, i) => {
      v[`〔注文番号-M0506-${番号}${文字(i)}〕`] = m.注文番号;
      v[`〔受注レコードID-M0506-${番号}${文字(i)}〕`] = m.受注ID;
      v[`〔配送レコードID-M0506-${番号}${文字(i)}〕`] = m.配送ID;
      v[`〔会員レコードID-M0506-${番号}${文字(i)}〕`] = m.会員ID;
    });
    控える(seedId, notes, v);
  });
}

defineSeed("S-M05-06-RE-ORD-032", { needs: ["S-M05-06-RE-ADM", "S-M05-06-RE-MASTERS"] }, async ({ browser, notes, seed }) => {
  const 商品ID = 共有の商品.get("M0506RE-ITEM");
  if (!商品ID) throw new Error(`${seed.シードID}: S-M05-06-RE-MASTERS の商品がまだ無い`);
  const m = await 受注を作る(browser, seed.シードID, 商品ID, 本店太郎("main-m0506re-001"));
  const n = 会員の送信履歴を消す(seed.シードID, m.会員ID, m.メール);
  if (!会員IDがある(m.会員ID)) throw new Error(`${seed.シードID}: 会員 ${m.会員ID} が無い`);
  reportSeedIssue(seed.シードID, `${m.注文番号}: 購入完了のときなどに残ったこの会員の送信履歴 ${n} 件を DB で消して0件にした（E2E の行だけ）`);
  作った.set(seed.シードID, [m]);
  控える(seed.シードID, notes, { "〔注文番号-M0506-RE001〕": m.注文番号, "〔会員ID-M0506-RE001〕": m.会員ID });
});

function 控える(seedId: string, notes: Notes, v: Record<string, string>): void {
  const s = getSeed(seedId);
  for (const label of Notes.labelsIn(s["状態・属性"] + s.投入方法)) {
    if (!(label in v)) throw new Error(`${seedId}: 呼び名 ${label} に当たる値が無い`);
    notes.set(label, v[label]);
  }
}
