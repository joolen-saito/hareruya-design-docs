/**
 * M06-12 買取商品一覧CSV出力 のシード。正本: cases/M06-12_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10「既存データか、画面で作ったデータに読み替えてよい。画面で作れない部分は、E2E が作った実行の印つきのデータに限りDBへ書いてよい」）
 * に従う作り。読み替えとDBへの書き込みは、シードの注記（エビデンスの「シード作成時の問題」）に残す。
 * - REF: 店舗「M06-12試験店舗」は店舗登録画面で、略称タグ「M12」は略称タグ登録画面で、決まった名前で1度だけ作り使い回す（あれば使う）。
 *   言語ID 1・2、状態 NM・SP、レアリティ R は登録せず、MTGマスターデータ管理で今の値を読んで使う（共有のマスタは書き換えない）。
 * - ADM: メンバー管理で登録する試験管理者（店頭買取管理を操作できる「システム管理者」。所属店舗・既定の検索店舗・編集可能店舗は M06-12試験店舗）。
 * - 商品: グッズ商品CSV登録（商品コード・商品名に実行の印）→ 商品登録編集の「カード指定 >」でレアリティ R の既存のカード詳細を指定し、
 *   略称タグ M12・単体カードのカテゴリにする → 必要なら商品規格一覧の「新規作成」で規格（SP など）を足す。ここまで画面。
 *   - 同じ商品コードの規格を2つ作る定め（004 の P1 の SP・005 の P2 の SP）は、画面で同じ商品コードが登録できるか分からないため、
 *     足す規格の商品コードを別の値（正本の値に「-SP」を付けた値）にした。ケースは商品コードの重なりを見ない。
 *   - 状態なしの規格・商品コードなしの規格は、画面で作れないので、画面で作った印つきの規格をDBで変える（db/m06_12.ts）。
 *     商品コードなし・状態NM の規格（004C）は、画面で状態 HP の規格を足してから、DBで商品コードを空・状態を NM にした。
 * - 買取: フロントの店頭買取査定申込（会員登録なし）で M06-12試験店舗に申込む（申込者の姓・名に実行の印）。
 *   MTGバイヤー（査定端末のアプリ）での査定・買取成立は行えないので、ステータス買取成立・買取成立日時・申込日時・買取明細・個別入力明細は、
 *   実行の印つきの買取にDBで設定する／足す（db/m06_04_prep.ts・db/m06_05.ts・db/m06_12.ts）。明細ID・個別入力明細IDはDBが振った値。
 */
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { RUN_MARK, rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { Notes } from "../lib/notes";
import { defineSeed } from "./current_seed";
import { 受注ID, 申込日時と更新日時を設定する } from "../db/m06_05";
import { 買取を整える } from "../db/m06_04_prep";
import { 個別入力明細を足す, 商品コードの規格ID, 規格の状態を外す, 規格を商品コードなしにする, 買取明細を足す } from "../db/m06_12";
import { ensureMemberByStoreIdsFix as ensureMemberByStoreIds } from "../pages/admin/m04_24_reuse_k";
import { ensureStore, 使い回す店舗の入力 } from "../pages/admin/m04_24_reuse_k";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { goodsCsvCategoryId } from "../pages/admin/m03_22_product";
import { findProductsByCode } from "../pages/admin/m03_13_product";
import { ShortTagPage } from "../pages/admin/short_tag";
import { カード詳細, カード詳細を探す, マスタを読む, マスタの行, 商品をカードにする, 棚番号を読む, 規格を足す } from "../pages/admin/m07_09_card";
import { 申込を行う, 申込者の, 査定IDを読む } from "./m06-common";

export const M0612_ADMIN: Account = { loginId: "m0612_admin", password: "Passw0rd!M0612" };

const L_SHOP = "〔店舗ID-M0612-共有〕";
/** 店舗は作らない（依頼者 2026-11-15）。「M06-12試験店舗」は、使い回す E2E の店舗 5007 で表す。店名・支店URLは店舗のいまの値 */
const 試験店舗 = 使い回す店舗の入力("5007", "M06-12試験店舗");
const 略称タグ = "M12";
const NEEDS = ["S-M06-12-ADM", "S-M06-12-REF"];

// ---------------------------------------------------------------- 共有のシード

/** 読んだ共有のマスタ（このプロセスの中だけ） */
const 前提 = { 言語1: "", 言語2: "", レアリティR: null as マスタの行 | null, 棚: "" };

defineSeed("S-M06-12-REF", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    notes.set(L_SHOP, await ensureStore(page, 試験店舗, issue));
    await 略称タグを用意する(page, issue);
    const 言語 = await マスタを読む(page, "言語");
    const l1 = 言語.find((r) => r.ID === "1");
    const l2 = 言語.find((r) => r.ID === "2");
    if (!l1 || !l2) throw new Error(`言語ID 1・2 がMTGマスターデータ管理に無い（${言語.map((r) => `${r.ID}:${r.名称}`).join("、")}）`);
    前提.言語1 = l1.名称;
    前提.言語2 = l2.名称;
    const 状態 = await マスタを読む(page, "状態");
    const nm = 状態.find((r) => r.コード === "NM");
    const sp = 状態.find((r) => r.コード === "SP");
    if (!nm || !sp) throw new Error("状態 NM・SP がMTGマスターデータ管理に無い");
    if (!(Number(nm.ID) < Number(sp.ID))) throw new Error(`状態のIDが NM（${nm.ID}）、SP（${sp.ID}）の順でない`);
    const r = (await マスタを読む(page, "レアリティ")).find((x) => x.コード === "R");
    if (!r) throw new Error("レアリティ R がMTGマスターデータ管理に無い");
    前提.レアリティR = r;
    const 棚 = (await 棚番号を読む(page)).sort((a, b) => a.並び順 - b.並び順)[0];
    if (!棚) throw new Error("棚番号の一覧に棚が無い（商品規格の新規作成で選ぶ棚）");
    前提.棚 = 棚.名称;
    issue(`言語ID 1（${l1.名称}）・2（${l2.名称}）、状態 NM（ID ${nm.ID}）・SP（ID ${sp.ID}）、レアリティ R（${r.名称}）は登録せず、MTGマスターデータ管理の今の値を使った`);
  });
  issue(`店舗「${試験店舗.店名}」（店舗ID ${試験店舗.店舗ID}）は使い回す E2E の店舗（店舗は作らない決まり。依頼者 2026-11-15）。略称タグ「${略称タグ}」は、決まった名前で1度だけ作り使い回す（あれば使う）`);
});

/** 略称タグ M12 を、あれば使い、無ければ登録する（一覧を最大の表示件数で読む） */
async function 略称タグを用意する(page: Page, issue: (m: string) => void): Promise<void> {
  const p = new ShortTagPage(page);
  await p.openNew();
  const counts = await p.件数.locator("option").evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value).filter((v) => /^\d+$/.test(v)));
  const max = counts.sort((a, b) => Number(b) - Number(a))[0];
  if (max) await p.showFirstPageWith(max);
  const rows = (await p.allRows()).filter((r) => r.名称 === 略称タグ);
  if (rows.length > 0) return;
  await p.openNew();
  await p.register({ 名称: 略称タグ, 並び順: "1", アルファベット順: false }, `略称タグ「${略称タグ}」の登録`);
  issue(`略称タグ「${略称タグ}」を登録した（並び順は正本が定めないので 1、ソートはコレクター番号順）`);
}

defineSeed("S-M06-12-ADM", { needs: ["S-M06-12-REF"] }, async ({ browser, notes }) => {
  const s = notes.get(L_SHOP);
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
    名前: "M06-12試験管理者", ログインID: M0612_ADMIN.loginId, メールアドレス: "m0612_admin@example.test", パスワード: M0612_ADMIN.password,
    権限: "システム管理者", 所属店舗ID: s, デフォルト検索表示店舗ID: s, 編集可能店舗ID: [s],
  }));
});

// ---------------------------------------------------------------- 作るための部品

/** レアリティ R の既存のカード詳細（このプロセスの中で1度だけ探す） */
let カードの候補: カード詳細[] | null = null;
let 次のカード = 0;
async function カードを選ぶ(page: Page): Promise<カード詳細> {
  if (!カードの候補) {
    const r = 前提.レアリティR;
    if (!r) throw new Error("レアリティ R を読めていない（S-M06-12-REF）");
    カードの候補 = await カード詳細を探す(page, { 色: "赤", レアリティ名: r.名称, レアリティID: r.ID, Foil: "なし", max: 8, open: 40 });
    if (カードの候補.length < 2) throw new Error(`既存のカードに、レアリティ R・Foilなしのカード詳細が2件見つからない（${カードの候補.length}件）`);
  }
  return カードの候補[次のカード++ % カードの候補.length];
}

type 品 = { 正本コード: string; 正本名: string; 言語: 1 | 2; 基準価格: number; 買取価格: number };
type 作った品 = { コード: string; 商品ID: string; 規格ID: string };

const 言語ID = (n: 1 | 2): string => String(n);

/** グッズ商品CSV登録で作り、カード指定・略称タグ M12・単体カードにする。商品ID・取込で作られた規格の規格IDを返す（品の順） */
async function 商品を作る(browser: Browser, 品たち: 品[], issue: (m: string) => void): Promise<作った品[]> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const categoryId = await goodsCsvCategoryId(page, issue);
    await registerGoodsCsv(page, {
      what: `M06-12 の商品 ${品たち.map((p) => rc(p.正本コード)).join("・")} のグッズ商品CSV登録`,
      fileName: `m0612-${Date.now()}.csv`, categoryId,
      lines: 品たち.map((p) => ({
        code: rc(p.正本コード), nameJp: rc(p.正本名), nameEn: rc(p.正本名),
        values: { "言語(ID)": 言語ID(p.言語), "基準価格": String(p.基準価格), "販売価格": String(p.基準価格), "買取価格": String(p.買取価格) },
      })),
      common: { "原価単価": "10" }, onWarning: issue,
    });
    const out: 作った品[] = [];
    for (const p of 品たち) {
      const コード = rc(p.正本コード);
      const found = await findProductsByCode(page, コード, ["公開"]);
      if (found.length !== 1) throw new Error(`商品マスターに商品コード ${コード} の公開の商品が ${found.length} 件（1件のはず）`);
      const 商品ID = found[0].商品ID;
      await 商品をカードにする(page, 商品ID, { カード: await カードを選ぶ(page), 商品名: rc(p.正本名), 略称タグ }, issue);
      out.push({ コード, 商品ID, 規格ID: 商品コードの規格ID(コード) });
    }
    return out;
  });
}

/** 商品規格一覧の「新規作成」で規格を足し、その規格IDを返す */
async function 規格を作る(browser: Browser, 商品ID: string, v: { コード: string; 言語: 1 | 2; 状態: string; 基準価格: number; 買取価格: number }, issue: (m: string) => void): Promise<string> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await 規格を足す(page, 商品ID, {
      言語名: v.言語 === 1 ? 前提.言語1 : 前提.言語2, 状態コード: v.状態, 商品コード: v.コード,
      基準価格: String(v.基準価格), 販売価格: String(v.基準価格), 買取価格: String(v.買取価格), 棚番号: 前提.棚,
    }, issue);
  });
  return 商品コードの規格ID(v.コード);
}

/** M06-12試験店舗に申込み、DBで買取成立・申込日時・買取成立日時にする。査定ID・注文内部IDを返す */
async function 買取を作る(browser: Browser, 姓: string, 番号: string): Promise<{ 査定ID: string; 注文内部ID: string }> {
  const 印つきの姓 = rc(姓);
  await 申込を行う(browser, 試験店舗.支店URL, [申込者の(印つきの姓, rc("M0612太郎"), "カイトリシケン", "イチロウ")]);
  const [査定ID] = await 査定IDを読む(browser, 印つきの姓, 1);
  const 注文内部ID = 受注ID(査定ID);
  買取を整える(注文内部ID, RUN_MARK, { 状態: "買取成立", 成立日: `2026-09-28 10:${番号}:00`, 合計金額: null });
  申込日時と更新日時を設定する(査定ID, { 申込: `2026-09-28 09:${番号}:00` });
  return { 査定ID, 注文内部ID };
}

/** 作った買取の査定IDを、呼び名と、このファイルの中の持ち回し（ケースが読む）に残す */
const 査定IDs = new Map<string, string>();
export function 査定IDの(n: string): string {
  const v = 査定IDs.get(n);
  if (!v) throw new Error(`M06-12-${n} の買取がまだ作られていない`);
  return v;
}

function 買取を控える(notes: Notes, n: string, r: { 査定ID: string; 注文内部ID: string }): void {
  notes.set(`〔査定ID-M0612-${n}〕`, r.査定ID);
  notes.set(`〔注文内部ID-M0612-${n}〕`, r.注文内部ID);
  査定IDs.set(n, r.査定ID);
}

const 共通の注記 = [
  "買取はフロントの店頭買取査定申込（会員登録なし）で M06-12試験店舗に申込み、申込者の姓・名に実行の印を付けた",
  "MTGバイヤー（査定端末のアプリ）での査定・買取成立は行えないので、ステータス買取成立・申込日時・買取成立日時・買取明細・個別入力明細は、実行の印つきの買取にDBで設定した／足した（明細ID・個別入力明細IDはDBが振った値）",
  "商品はグッズ商品CSV登録で作り（商品コード・商品名に実行の印）、商品登録編集の「カード指定 >」でレアリティ R の既存のカード詳細を指定し、略称タグ M12・単体カードのカテゴリにした",
];
function 注記する(seedId: string, ...追加: string[]): void {
  for (const m of [...共通の注記, ...追加]) reportSeedIssue(seedId, m);
}

// ---------------------------------------------------------------- ケース専用のシード

defineSeed("S-M06-12-SORT-004", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const [P1, P2] = await 商品を作る(browser, [
    { 正本コード: "M0612-SORT-P1-004", 正本名: "M0612-SORT-NAME-P1-004", 言語: 1, 基準価格: 1000, 買取価格: 500 },
    { 正本コード: "M0612-SORT-P2-004", 正本名: "M0612-SORT-NAME-P2-004", 言語: 1, 基準価格: 1000, 買取価格: 500 },
  ], issue);
  const 規格B = await 規格を作る(browser, P1.商品ID, { コード: rc("M0612-SORT-P1-004-SP"), 言語: 1, 状態: "SP", 基準価格: 1000, 買取価格: 500 }, issue);
  const Cのコード = rc("M0612-SORT-P1-004-C");
  const 規格C = await 規格を作る(browser, P1.商品ID, { コード: Cのコード, 言語: 1, 状態: "HP", 基準価格: 1000, 買取価格: 500 }, issue);
  規格を商品コードなしにする(規格C, "NM");
  const r = await 買取を作る(browser, "M0612-004", "04");
  notes.set("〔商品ID-M0612-004A〕", P1.商品ID);
  notes.set("〔商品ID-M0612-004B〕", P2.商品ID);
  notes.set("〔商品規格ID-M0612-004A〕", P1.規格ID);
  notes.set("〔商品規格ID-M0612-004B〕", 規格B);
  notes.set("〔商品規格ID-M0612-004C〕", 規格C);
  notes.set("〔商品規格ID-M0612-004D〕", P2.規格ID);
  notes.set("〔明細ID-M0612-004A〕", 買取明細を足す(r.注文内部ID, P1.規格ID, 11, 500));
  notes.set("〔明細ID-M0612-004B〕", 買取明細を足す(r.注文内部ID, 規格B, 12, 500));
  notes.set("〔明細ID-M0612-004C〕", 買取明細を足す(r.注文内部ID, 規格C, 13, 500));
  notes.set("〔明細ID-M0612-004D〕", 買取明細を足す(r.注文内部ID, P2.規格ID, 14, 500));
  notes.set("〔個別入力明細ID-M0612-004〕", 個別入力明細を足す(r.注文内部ID, "個別入力商品", 15, 500));
  買取を控える(notes, "004", r);
  if (!(Number(P1.商品ID) < Number(P2.商品ID))) throw new Error(`商品ID が〔商品ID-M0612-004A〕${P1.商品ID} < 〔商品ID-M0612-004B〕${P2.商品ID} の順でない`);
  注記する(seed.シードID,
    `〔商品規格ID-M0612-004B〕（状態SP）は商品規格の新規作成で足し、商品コードは ${rc("M0612-SORT-P1-004-SP")} にした（正本は〔商品規格ID-M0612-004A〕と同じ商品コード）`,
    `〔商品規格ID-M0612-004C〕（商品コードなし・状態NM）は、商品規格の新規作成で状態HP・商品コード ${Cのコード} の規格を足してから、DBで商品コードを空・状態をNMにした`);
});

defineSeed("S-M06-12-NORMAL-005", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const [P1, P2] = await 商品を作る(browser, [
    { 正本コード: "M0612-P1-005", 正本名: "M0612-NAME-P1-005", 言語: 1, 基準価格: 1500, 買取価格: 1000 },
    { 正本コード: "M0612-P2-005", 正本名: "M0612-NAME-P2-005", 言語: 2, 基準価格: 2500, 買取価格: 1500 },
  ], issue);
  const 規格B = await 規格を作る(browser, P2.商品ID, { コード: rc("M0612-P2-005-SP"), 言語: 2, 状態: "SP", 基準価格: 2500, 買取価格: 1500 }, issue);
  const r = await 買取を作る(browser, "M0612-005", "05");
  notes.set("〔商品ID-M0612-005A〕", P1.商品ID);
  notes.set("〔商品ID-M0612-005B〕", P2.商品ID);
  notes.set("〔商品規格ID-M0612-005A〕", P1.規格ID);
  notes.set("〔商品規格ID-M0612-005B〕", 規格B);
  notes.set("〔明細ID-M0612-005A〕", 買取明細を足す(r.注文内部ID, P1.規格ID, 2, 1000));
  notes.set("〔明細ID-M0612-005B〕", 買取明細を足す(r.注文内部ID, 規格B, 3, 1500));
  買取を控える(notes, "005", r);
  注記する(seed.シードID, `〔商品規格ID-M0612-005B〕（言語ID 2・状態SP）は商品規格の新規作成で足し、商品コードは ${rc("M0612-P2-005-SP")} にした（正本はグッズ商品CSV登録の規格と同じ商品コード）`);
});

defineSeed("S-M06-12-INDIVIDUAL-006", { needs: NEEDS }, async ({ notes, seed, browser }) => {
  const r = await 買取を作る(browser, "M0612-006", "06");
  notes.set("〔個別入力明細ID-M0612-006〕", 個別入力明細を足す(r.注文内部ID, "個別入力商品A", 4, 700));
  買取を控える(notes, "006", r);
  for (const m of 共通の注記.slice(0, 2)) reportSeedIssue(seed.シードID, m);
});

defineSeed("S-M06-12-NOSTATE-007", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const [P] = await 商品を作る(browser, [{ 正本コード: "M0612-NOSTATE-P-007", 正本名: "M06-12状態なし商品-007", 言語: 2, 基準価格: 3500, 買取価格: 2000 }], issue);
  規格の状態を外す(P.規格ID);
  const r = await 買取を作る(browser, "M0612-007", "07");
  notes.set("〔商品ID-M0612-007〕", P.商品ID);
  notes.set("〔商品規格ID-M0612-007〕", P.規格ID);
  notes.set("〔明細ID-M0612-007〕", 買取明細を足す(r.注文内部ID, P.規格ID, 5, 2000));
  買取を控える(notes, "007", r);
  注記する(seed.シードID, "商品規格の状態の紐づきは画面で外せないので、DBで外した（状態なし）");
});

defineSeed("S-M06-12-NORMAL-009", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const [P] = await 商品を作る(browser, [{ 正本コード: "M0612-P1-009", 正本名: "M0612-NAME-P1-009", 言語: 1, 基準価格: 1500, 買取価格: 1000 }], issue);
  const r = await 買取を作る(browser, "M0612-009", "09");
  notes.set("〔商品ID-M0612-009〕", P.商品ID);
  notes.set("〔商品規格ID-M0612-009〕", P.規格ID);
  notes.set("〔明細ID-M0612-009〕", 買取明細を足す(r.注文内部ID, P.規格ID, 2, 1000));
  買取を控える(notes, "009", r);
  注記する(seed.シードID);
});

defineSeed("S-M06-12-MIXED-011", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const [A, B] = await 商品を作る(browser, [
    { 正本コード: "M0612-011-A", 正本名: "M0612-011-NAME-A", 言語: 1, 基準価格: 1500, 買取価格: 1000 },
    { 正本コード: "M0612-011-B", 正本名: "M0612-011-NAME-B", 言語: 2, 基準価格: 2500, 買取価格: 1500 },
  ], issue);
  規格の状態を外す(B.規格ID);
  const r = await 買取を作る(browser, "M0612-011", "11");
  買取明細を足す(r.注文内部ID, A.規格ID, 2, 1000);
  買取明細を足す(r.注文内部ID, B.規格ID, 3, 1500);
  個別入力明細を足す(r.注文内部ID, "M0612-011-IND", 4, 700);
  買取を控える(notes, "011", r);
  注記する(seed.シードID, "商品名 M0612-011-NAME-B（実行の印つき）の商品規格の状態の紐づきは画面で外せないので、DBで外した（状態なし）");
});

defineSeed("S-M06-12-CBSTATEFUL-012", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const [P] = await 商品を作る(browser, [{ 正本コード: "M0612-CB012-P", 正本名: "M0612-CB012-NAME", 言語: 2, 基準価格: 2500, 買取価格: 1500 }], issue);
  const r = await 買取を作る(browser, "M0612-012", "12");
  notes.set("〔商品ID-M0612-012〕", P.商品ID);
  notes.set("〔商品規格ID-M0612-012〕", P.規格ID);
  買取明細を足す(r.注文内部ID, P.規格ID, 2, 1500);
  買取を控える(notes, "012", r);
  注記する(seed.シードID);
});

defineSeed("S-M06-12-CBNOSTATE-013", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const [P] = await 商品を作る(browser, [{ 正本コード: "M0612-CB013-P", 正本名: "M0612-CB013-NAME", 言語: 1, 基準価格: 3500, 買取価格: 2000 }], issue);
  規格の状態を外す(P.規格ID);
  const r = await 買取を作る(browser, "M0612-013", "13");
  notes.set("〔商品ID-M0612-013〕", P.商品ID);
  notes.set("〔商品規格ID-M0612-013〕", P.規格ID);
  買取明細を足す(r.注文内部ID, P.規格ID, 3, 2000);
  買取を控える(notes, "013", r);
  注記する(seed.シードID, "商品規格の状態の紐づきは画面で外せないので、DBで外した（状態なし）");
});
