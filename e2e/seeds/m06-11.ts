/**
 * M06-11 戻しリストPDF出力（店頭買取）の画面シード。正本: cases/M06-11_seed_data.tsv
 *
 * 依頼者の決定（2026-11-10「印つきデータは何でも」）に従い、E2E が新しく作る印つきの行（店舗・マスタ・商品・カード・買取）は画面で作る。
 * 共有の設定・共有のマスタ（本店の高額商品閾値・言語/状態/レアリティの並び・既存の色順・既存の略称タグ・既存の棚番号）は書き換えない。
 *
 * シード表からの読み替え（各シードの報告にも出る）:
 * - 店舗: 「本店（店舗ID 1）」の閾値 1000/5000/10000 は共有の設定なので書き換えない。印のある試験用の店舗「M06-11試験店舗（本店相当）」を
 *   画面（店舗登録）で作り、閾値を 1000/5000/10000 にして、本店の代わりに使う（店舗の種類は支店。棚番号の並びを使うのは本店だけだが、
 *   本店相当を使うケースは棚番号の並びを確かめない）。「支店A」「支店A-M0611-NNN」は、閾値 2000/7000/12000 の試験用の店舗「M06-11試験支店A」1つで代える。
 * - 商品: カード商品CSV登録（カード詳細を指定）で作る（グッズ商品CSV登録のカテゴリIDの不具合 ECCUBE_HARERUYA-3966 に当たらない作り方）。
 *   カード（カラー・色順・レアリティ・Foil・カード名(英)・コレクターNo）は画面で登録する。商品名・カード名・略称タグ・色順の名称は実行の印つき。
 *   サプライ品はグッズ商品CSV登録でしか作れないので、サプライ品を使うシード（THRESHOLD-MAIN-002・THRESHOLD-BRANCH-003・FIELDS-015・ABBR-DISPLAY-023）は作らない。
 * - 略称タグ・色順: 印つきの名称で画面から登録する（並び順は登録順に大小が付くように決めた）。色は既存のカラー「白」「青」を使う。
 * - 言語（その他）: MTGマスターデータ管理の言語は共有のマスタなので足さず、既存の「日本語・英語以外の言語」を使う（KO の代わり）。
 * - 買取: フロントの店頭買取査定申込（会員登録なし）→ 管理画面で入庫待ちにして → 実在庫情報の編集から商品を足す。
 *   申込日時は画面で指定できないので、申込日時を確かめるケース（022・025）だけ、印つきの買取に限りDBで設定する。ほかのケースは申込日時を設定しない。
 * - 棚番号: 棚の並びを使うのは005だけ。棚番号は登録せず、既存の棚番号から並び順の違う2つを使う。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 申込日時と更新日時を設定する } from "../db/m06_05";
import { reportSeedIssue } from "../lib/seeds";
import { rc } from "../lib/run_marker";
import { Account, withAdminSession } from "../lib/session";
import { defineSeed } from "./current_seed";
import { 申込を行う, 査定IDを読む, 申込者の, storeInput } from "./m06-common";
import { 規格を整える, カードを登録する, 実在庫に商品を追加する, 略称タグを登録する } from "../pages/admin/m06_11_setup";
import { カード商品CSVの見出し, カード商品CSVを登録する, 商品名で商品IDを読む, 商品規格一覧を読む, 単体カード配下のカテゴリID, 登録済みの割引率ID } from "../pages/admin/f05_04_products";
import { readExistingSellGroupName } from "../pages/admin/m03_01_goods_csv";
import { readLanguageIds } from "../pages/admin/m03_23_seed_products";
import { 棚番号を読む, マスタを読む, 商品をカードにする } from "../pages/admin/m07_09_card";
import { 行を用意する } from "../pages/admin/m14_04_master";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { ensureStoreWithThresholds } from "../pages/admin/m04_25_move_chain";
import { OtcDetailPage, OtcListPage } from "../pages/admin/m06_otc_list";
import { ensureCardset } from "../pages/admin/product_masters";

export const M0611_ADMIN: Account = { loginId: "m0611_admin", password: "Passw0rd!M0611" };

// ---------------------------------------------------------------------------
// 店舗
// ---------------------------------------------------------------------------

type 店キー = "main" | "branch";
const 店の定義 = {
  main: { 入力: storeInput("M06-11試験店舗（本店相当）", "エムゼロロクイチイチシケンテンポホンテンソウトウ", "Kaitori Test Main", "m0611main", "K1M"), 閾値: ["1000", "5000", "10000"] as [string, string, string] },
  branch: { 入力: storeInput("M06-11試験支店A", "エムゼロロクイチイチシケンシテンエー", "Kaitori Test Branch A", "m0611brancha", "K1N"), 閾値: ["2000", "7000", "12000"] as [string, string, string] },
};
export const 支店URLの = (k: 店キー): string => 店の定義[k].入力.支店URL;
/** 商品仕訳の見出しに使う閾値（円） */
export const 閾値の = (k: 店キー): number[] => 店の定義[k].閾値.map(Number);

async function 店舗を用意する(browser: Browser, k: 店キー, issue: (m: string) => void): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    return ensureStoreWithThresholds(page, { ...店の定義[k].入力, 高額商品閾値: 店の定義[k].閾値 }, issue);
  });
}

defineSeed("S-M06-11-ADM", async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const main = await 店舗を用意する(browser, "main", issue);
  const branch = await 店舗を用意する(browser, "branch", issue);
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
    名前: "M06-11試験管理者", ログインID: M0611_ADMIN.loginId, メールアドレス: "m0611_admin@example.test", パスワード: M0611_ADMIN.password,
    権限: "システム管理者", 所属店舗ID: main, デフォルト検索表示店舗ID: "", 編集可能店舗ID: [main, branch],
  }));
  issue("管理者ID 61100001 は指定できない（画面が振る）。権限は「システム管理者」。編集できる店舗は、本店・ケース専用支店の代わりに作った試験用の店舗2つ（店舗は画面で登録）");
});

defineSeed("S-M06-11-STORE-MAIN", { needs: ["S-M06-11-ADM"] }, async ({ seed }) => {
  reportSeedIssue(seed.シードID, "本店（店舗ID 1）の高額商品閾値1〜3は共有の設定なので書き換えない。代わりに、閾値 1000/5000/10000 の試験用の店舗「M06-11試験店舗（本店相当）」を画面で作って使った");
});

// ---------------------------------------------------------------------------
// 参照マスタの確認（読むだけ）
// ---------------------------------------------------------------------------

type 前提 = { 言語: { JP: string; EN: string; 他: string; 他の名: string }; レア: Record<string, string>; 割引率: string; カテゴリ: string; 購入グループ: string; カードセット: string; 棚: { 名称: string; 並び順: number }[] };
let 前提の控え: 前提 | null = null;

async function 前提を読む(browser: Browser, issue: (m: string) => void): Promise<前提> {
  if (前提の控え) return 前提の控え;
  const v = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const lang = await readLanguageIds(page);
    const 言語rows = await マスタを読む(page, "言語");
    const id = (c: string) => Number(言語rows.find((r) => r.コード === c)?.ID);
    if (!(id("JP") < id("EN") && id("EN") < Number(lang.その他言語.id))) throw new Error(`言語の並び（IDの順）が 日本語 < 英語 < その他 になっていない（JP=${id("JP")}・EN=${id("EN")}・その他=${lang.その他言語.id}）`);
    const 状態rows = await マスタを読む(page, "状態");
    const st = (c: string) => Number(状態rows.find((r) => r.コード === c)?.ID);
    if (!(st("NM") < st("HP"))) throw new Error(`状態の並び（IDの順）が NM < HP になっていない（NM=${st("NM")}・HP=${st("HP")}）`);
    const rare = await マスタを読む(page, "レアリティ");
    const M = rare.find((r) => r.コード === "M"), C = rare.find((r) => r.コード === "C"), R = rare.find((r) => r.コード === "R");
    if (!M || !C || M.並び順 === null || C.並び順 === null || !(M.並び順 < C.並び順)) throw new Error("レアリティの並び順が M < C になっていない");
    const cat = await 単体カード配下のカテゴリID(page);
    const disc = await 登録済みの割引率ID(page);
    const group = await readExistingSellGroupName(page);
    const set = await ensureCardset(page, "M06-11試験カードセット", "M0611 Test Set", "M0611S", issue);
    const shelves = (await 棚番号を読む(page)).sort((a, b) => a.並び順 - b.並び順);
    return { 言語: { JP: lang.日本語, EN: lang.英語, 他: lang.その他言語.id, 他の名: lang.その他言語.label }, レア: { M: M.名称, C: C.名称, R: R?.名称 ?? "" }, 割引率: disc.id, カテゴリ: cat.id, 購入グループ: group, カードセット: set, 棚: shelves.map((s) => ({ 名称: s.名称, 並び順: s.並び順 })) };
  });
  前提の控え = v;
  return v;
}

defineSeed("S-M06-11-REF", async ({ browser, seed }) => {
  const v = await 前提を読む(browser, (m) => reportSeedIssue(seed.シードID, m));
  reportSeedIssue(seed.シードID, `参照マスタは書き換えず、記載の並びになっていることを画面で確かめた（言語 日本語<英語<その他「${v.言語.他の名}」・状態 NM<HP・レアリティ M<C）`);
});

// ---------------------------------------------------------------------------
// 買取データの作り方
// ---------------------------------------------------------------------------

type 札 = { 色: "白" | "青"; レア: "M" | "C"; Foil?: boolean; 色順?: string };
type 品 = {
  /** 正本の商品名（実行の印を付ける） */
  名: string;
  札: 札;
  言語?: "JP" | "EN" | "他";
  状態?: "NM" | "HP";
  タグ?: string;
  価格: number;
  数?: number;
  /** カード名(英)（省略すると商品名） */
  カード名英?: string;
  /** コレクター番号の大小（小さい方が先）。省略すると連番 */
  番号?: "002" | "010";
  /** 棚番号（005だけ）。既存の棚番号の並び順の小さい方=0・大きい方=1 */
  棚?: 0 | 1;
};
type 買取 = { ラベル: string; 品: 品[]; 申込日時?: string };
type タグ定義 = { 名: string; アルファベット?: boolean };
type 定義 = { 店: 店キー; 買取: 買取[]; タグ?: タグ定義[]; 色順?: string[]; 読み替え?: string[] };

let 連番 = 0;
const 番号の基 = String(Date.now()).slice(-9);
const 次の番号 = (): string => `${番号の基}${String(++連番).padStart(2, "0")}`;
/** コレクター番号の大小を見るカードの番号（同じ桁数で、先頭の8桁が同じなら、末尾3桁の大小が番号の大小になる） */
const 組の基 = String(Date.now()).slice(-8);
const 組の番号 = (大小: "002" | "010"): string => `${組の基}${大小}`;

const 言語名ラベル = (v: 前提, k: "JP" | "EN" | "他"): string => (k === "JP" ? "日本語" : k === "EN" ? "英語" : v.言語.他の名);

/** 定義どおりに、カード・商品・買取を画面で作る。買取の査定IDを順に返す */
async function 作る(browser: Browser, seedId: string, 申込者の姓: string, d: 定義): Promise<string[]> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const p = await 前提を読む(browser, issue);
  const 色順の名 = new Map((d.色順 ?? []).map((n) => [n, rc(n)] as [string, string]));
  const タグの名 = new Map((d.タグ ?? []).map((t) => [t.名, rc(t.名)] as [string, string]));
  const 全品 = d.買取.flatMap((b) => b.品);

  await 店舗を用意する(browser, d.店, issue);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    // マスタ（印つきの色順・略称タグ）
    for (const n of d.色順 ?? []) await 行を用意する(page, "色順", 色順の名.get(n)!, "", `${seedId}: 色順`);
    if (d.色順?.length) issue(`色順「${d.色順.map((n) => 色順の名.get(n)).join("」「")}」を、MTGマスターデータ管理で、この順に登録した（並び順は登録順に大きくなる）`);
    let rank = 9000;
    for (const t of d.タグ ?? []) {
      await 略称タグを登録する(page, { 名称: タグの名.get(t.名)!, 並び順: String(++rank), アルファベット順: !!t.アルファベット }, seedId);
    }
    if (d.タグ?.length) issue(`略称タグ「${d.タグ.map((t) => `${タグの名.get(t.名)}（${t.アルファベット ? "アルファベット" : "コレクター番号"}）`).join("」「")}」を、略称タグ登録で、この順に並び順が大きくなるように登録した`);

    // カード → カード商品CSV
    const カード = new Map<品, { 詳細ID: string }>();
    for (const x of 全品) {
      const 番号 = x.番号 ? 組の番号(x.番号) : 次の番号();
      const c = await カードを登録する(page, {
        カード名英: rc(x.カード名英 ?? x.名), カラー: x.札.色, 色順: x.札.色順 ? 色順の名.get(x.札.色順) : undefined,
        詳細: { カードセットID: p.カードセット, カード番号: 番号, レアリティ名: p.レア[x.札.レア], Foil: !!x.札.Foil },
      }, `${seedId}: カード ${x.名}`, issue);
      カード.set(x, { 詳細ID: c.カード詳細ID });
    }
    const 見出し = await カード商品CSVの見出し(page);
    const row = (x: 品): Record<string, string> => ({
      "商品ID": "", "言語(ID)": p.言語[x.言語 ?? "JP"], "商品公開ステータス": "2", "支店の商品公開ステータス": "1",
      "商品名(日)": rc(x.名), "商品名(英)": rc(x.名), "サイズ": "1", "重量": "1", "商品カテゴリ(ID)": p.カテゴリ,
      "購入グループ名称": p.購入グループ, "割引率(ID)": p.割引率, "基準価格": String(x.価格), "販売価格": String(x.価格), "買取価格": String(x.価格),
      "カード詳細(ID)": カード.get(x)!.詳細ID,
    });
    await カード商品CSVを登録する(page, 見出し, 全品.map(row), `${seedId}-card.csv`.toLowerCase(), `${seedId}: カード商品CSV登録`, issue);
    const 棚 = [p.棚[0], p.棚.find((s) => s.並び順 > p.棚[0].並び順)];
    for (const x of 全品) {
      const id = await 商品名で商品IDを読む(page, rc(x.名));
      if (x.タグ) await 商品をカードにする(page, id, { 商品名: rc(x.名), 略称タグ: タグの名.get(x.タグ)! }, issue);
      const 規格 = (await 商品規格一覧を読む(page, id)).filter((r) => r.言語 === 言語名ラベル(p, x.言語 ?? "JP") && r.状態 === (x.状態 ?? "NM"));
      if (規格.length !== 1) throw new Error(`${seedId}: 商品「${rc(x.名)}」の規格（${言語名ラベル(p, x.言語 ?? "JP")}・${x.状態 ?? "NM"}）が ${規格.length} 件ある（1件のはず）`);
      const 棚番号 = x.棚 === undefined ? undefined : 棚[x.棚]?.名称;
      if (x.棚 !== undefined && !棚番号) throw new Error(`${seedId}: 並び順の違う既存の棚番号が2つ無い`);
      await 規格を整える(page, id, 規格[0].商品規格ID, { 棚番号 }, `${seedId}: 商品「${rc(x.名)}」の規格`, issue);
    }
  });
  issue("商品は、カード商品CSV登録（カード詳細を指定）で作った。商品名・カード名は実行の印つき。商品規格は、スマレジ連携を「連携しない」・公開にして登録した。カードのカラーは既存の「白」「青」。コレクターNo（カード番号）は、大小が正本どおりになる番号にした");
  for (const m of d.読み替え ?? []) issue(m);

  // 申込 → 入庫待ち → 実在庫
  const ids: string[] = [];
  for (const [i, b] of d.買取.entries()) {
    const 姓 = rc(`${申込者の姓}${d.買取.length > 1 ? String.fromCharCode(65 + i) : ""}`);
    await 申込を行う(browser, 支店URLの(d.店), [申込者の(姓, "一郎", "カイトリシケン", "イチロウ")]);
    const [id] = await 査定IDを読む(browser, 姓, 1);
    ids.push(id);
    if (b.申込日時) {
      申込日時と更新日時を設定する(id, { 申込: b.申込日時 });
      issue(`買取 ${id} の査定申込日時を ${b.申込日時} にDBで設定した（画面で指定できない。印つきの買取に限る）`);
    }
    await withAdminSession(browser, M0611_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const open = async () => {
        const list = new OtcListPage(page);
        await list.open();
        await list.日時を空にする();
        await list.買取店舗を選ぶ("");
        await list.査定IDを入れる(id);
        await list.検索する();
        await list.詳細を開く(id);
      };
      await open();
      await new OtcDetailPage(page).ステータスを変える("入庫待ち");
      await open();
      await 実在庫に商品を追加する(page, b.品.map((x) => ({ 商品名: rc(x.名), 状態: x.状態 ?? "NM", 増減数: String(x.数 ?? 1) })), `${seedId}: 買取 ${id} の実在庫の追加`);
    });
  }
  return ids;
}

function 買取シード(seedId: string, 申込者の姓: string, d: 定義): void {
  defineSeed(seedId, { needs: ["S-M06-11-ADM", "S-M06-11-REF"] }, async ({ browser, notes, seed }) => {
    const ids = await 作る(browser, seedId, 申込者の姓, d);
    d.買取.forEach((b, i) => notes.set(b.ラベル, ids[i]));
    void seed;
  });
}

const 白M: 札 = { 色: "白", レア: "M" };
const 白C: 札 = { 色: "白", レア: "C" };
const L = (n: string) => `〔買取番号-M0611-${n}〕`;
const ラベルの名 = (n: string, 名: string) => `M0611-${n}-${名}`;

// ---- 001: 選択した買取の実在庫だけ ----
買取シード("S-M06-11-LINKED-001", "戻し001", {
  店: "main",
  買取: [
    { ラベル: L("001A"), 品: [{ 名: "選択対象A", 札: 白C, 価格: 2000 }, { 名: "選択対象B", 札: 白C, 価格: 2000 }] },
    { ラベル: L("001B"), 品: [{ 名: "非対象C", 札: 白C, 価格: 2000 }] },
  ],
});

// ---- 005: 支店Aは棚番号ではなく言語 ----
買取シード("S-M06-11-SORT-BRANCH-LANG-005", "戻し005", {
  店: "branch",
  買取: [{ ラベル: L("005"), 品: [{ 名: "BRANCH-JP", 札: 白C, 価格: 7000, 言語: "JP", 棚: 1 }, { 名: "BRANCH-EN", 札: 白C, 価格: 7000, 言語: "EN", 棚: 0 }] }],
  読み替え: ["棚番号Z99・A01は、登録せず、既存の棚番号から並び順の違う2つを使った（BRANCH-JP=並び順の大きい方〔Z99の代わり〕、BRANCH-EN=並び順の小さい方〔A01の代わり〕）"],
});

// ---- 並び順（本店相当・同じ金額閾値内。基準価格6000円） ----

買取シード("S-M06-11-SORT-CONDITION-006", "戻し006", { 店: "main", タグ: [{ 名: "M0611-COND-006" }], 買取: [{ ラベル: L("006"), 品: [
  { 名: "COND-NM", 札: 白C, 状態: "NM", 価格: 6000, タグ: "M0611-COND-006" }, { 名: "COND-HP", 札: 白C, 状態: "HP", 価格: 6000, タグ: "M0611-COND-006" }] }] });
買取シード("S-M06-11-SORT-FOIL-007", "戻し007", { 店: "main", 買取: [{ ラベル: L("007"), 品: [
  { 名: "NON-FOIL", 札: 白C, 価格: 6000 }, { 名: "FOIL", 札: { ...白C, Foil: true }, 価格: 6000 }] }] });
買取シード("S-M06-11-SORT-ABBREVIATION-008", "戻し008", { 店: "main", タグ: [{ 名: "M0611-ABBR-AAA" }, { 名: "M0611-ABBR-BBB" }], 買取: [{ ラベル: L("008"), 品: [
  { 名: "ABBR-A", 札: 白C, 価格: 6000, タグ: "M0611-ABBR-AAA" }, { 名: "ABBR-B", 札: 白C, 価格: 6000, タグ: "M0611-ABBR-BBB" }] }],
  読み替え: ["略称タグ AAA・BBB は、印つきの名称「M0611-ABBR-AAA」「M0611-ABBR-BBB」（並び順は AAA の方が小さい）で登録した"] });
買取シード("S-M06-11-SORT-RARITY-009", "戻し009", { 店: "main", タグ: [{ 名: "M0611-RARITY-009" }], 買取: [{ ラベル: L("009"), 品: [
  { 名: "RARITY-M", 札: 白M, 価格: 6000, タグ: "M0611-RARITY-009" }, { 名: "RARITY-C", 札: 白C, 価格: 6000, タグ: "M0611-RARITY-009" }] }] });
買取シード("S-M06-11-SORT-COLOR-010", "戻し010", { 店: "main", 色順: ["M0611-COLOR-010-白", "M0611-COLOR-010-青"], タグ: [{ 名: "M0611-COLOR-010" }], 買取: [{ ラベル: L("010"), 品: [
  { 名: "COLOR-WHITE", 札: { ...白C, 色順: "M0611-COLOR-010-白" }, 価格: 6000, タグ: "M0611-COLOR-010" },
  { 名: "COLOR-BLUE", 札: { 色: "青", レア: "C", 色順: "M0611-COLOR-010-青" }, 価格: 6000, タグ: "M0611-COLOR-010" }] }],
  読み替え: ["色順「白」「青」は、MTGマスターデータ管理に印つきの名称で白→青の順に足した色順（並び順が大小になる）。カードのカラーは既存の「白」「青」"] });
買取シード("S-M06-11-SORT-COLLECTOR-011", "戻し011", { 店: "main", タグ: [{ 名: "M0611-COLLECTOR-011" }], 買取: [{ ラベル: L("011"), 品: [
  { 名: "COL-002", 札: 白C, 価格: 6000, タグ: "M0611-COLLECTOR-011", 番号: "002", カード名英: "M0611-011-NAME" },
  { 名: "COL-010", 札: 白C, 価格: 6000, タグ: "M0611-COLLECTOR-011", 番号: "010", カード名英: "M0611-011-NAME" }] }] });
買取シード("S-M06-11-SORT-ALPHABET-012", "戻し012", { 店: "main", タグ: [{ 名: "M0611-ALPHABET-012", アルファベット: true }], 買取: [{ ラベル: L("012"), 品: [
  { 名: "ALPHA", 札: 白C, 価格: 6000, タグ: "M0611-ALPHABET-012", カード名英: "M0611-012-Alpha" },
  { 名: "ZEBRA", 札: 白C, 価格: 6000, タグ: "M0611-ALPHABET-012", カード名英: "M0611-012-Zebra" }] }] });

// ---- 021: 言語 日→英→他 ----
買取シード("S-M06-11-LANG-OTHER-021", "戻し021", { 店: "main", タグ: [{ 名: "M0611-021-TAG" }], 買取: [{ ラベル: L("021"), 品: [
  { 名: "M0611-021-KO", 札: 白C, 価格: 6000, 言語: "他", タグ: "M0611-021-TAG" },
  { 名: "M0611-021-EN", 札: 白C, 価格: 6000, 言語: "EN", タグ: "M0611-021-TAG" },
  { 名: "M0611-021-JP", 札: 白C, 価格: 6000, 言語: "JP", タグ: "M0611-021-TAG" }] }],
  読み替え: ["言語「M0611-021-KO」は、共有のマスタなので足さず、既存の日本語・英語以外の言語を使った（商品名は M0611-021-KO のまま）"] });

// ---- 022: 作成日時 ----
買取シード("S-M06-11-CREATED-AT-022", "戻し022", { 店: "main", 買取: [{ ラベル: L("022"), 申込日時: "2026-09-30 09:31:00", 品: [{ 名: "M0611-022-CARD", 札: 白C, 価格: 6000 }] }] });

// ---- 024: 数量 ----
買取シード("S-M06-11-QUANTITY-024", "戻し024", { 店: "main", 買取: [{ ラベル: L("024"), 品: [
  { 名: "M0611-024-Q3", 札: 白C, 価格: 6000, 数: 3 }, { 名: "M0611-024-Q5", 札: 白C, 価格: 6000, 数: 5 }] }] });

// ---- 025: 複数選択 ----
買取シード("S-M06-11-MULTI-025", "戻し025", { 店: "main", 買取: [
  { ラベル: L("025A"), 申込日時: "2026-09-30 09:25:00", 品: [{ 名: "M0611-025-A", 札: 白C, 価格: 2000 }] },
  { ラベル: L("025B"), 申込日時: "2026-09-30 09:26:00", 品: [{ 名: "M0611-025-B", 札: 白C, 価格: 2000 }] }] });

// ---- 本店相当・支店Aのシングルカード（A・B の2点） ----
function CB(seedId: string, n: string, 店: 店キー, 価格: number, A: Partial<品>, B: Partial<品>, 定: Partial<定義> = {}): void {
  買取シード(seedId, `戻し${n}`, { 店, 買取: [{ ラベル: L(n), 品: [
    { 名: ラベルの名(n, "A"), 札: 白C, 価格, ...A }, { 名: ラベルの名(n, "B"), 札: 白C, 価格, ...B }] }], ...定 });
}

CB("S-M06-11-CBSTATE-030", "030", "branch", 1500, { 状態: "NM" }, { 状態: "HP" });
CB("S-M06-11-CBRARITY-033", "033", "branch", 1500, { 札: 白M }, { 札: 白C });
CB("S-M06-11-CBCOLOR-034", "034", "branch", 1500,
  { 札: { ...白C, 色順: "M0611-034-CW" } }, { 札: { 色: "青", レア: "C", 色順: "M0611-034-CB" } }, { 色順: ["M0611-034-CW", "M0611-034-CB"] });
CB("S-M06-11-CBCOLLECTOR-035", "035", "branch", 1500,
  { タグ: "M0611-035-TAG", 番号: "002", カード名英: "M0611-035-NAME" }, { タグ: "M0611-035-TAG", 番号: "010", カード名英: "M0611-035-NAME" }, { タグ: [{ 名: "M0611-035-TAG" }] });
CB("S-M06-11-CBENGLISH-036", "036", "branch", 1500,
  { タグ: "M0611-036-TAG", カード名英: "M0611-036-ALPHA" }, { タグ: "M0611-036-TAG", カード名英: "M0611-036-ZEBRA" }, { タグ: [{ 名: "M0611-036-TAG", アルファベット: true }] });
CB("S-M06-11-CBLANG-037", "037", "main", 500, { 言語: "JP" }, { 言語: "EN" });
CB("S-M06-11-CBFOIL-038", "038", "main", 500, {}, { 札: { ...白C, Foil: true } });
CB("S-M06-11-CBTAG-039", "039", "main", 500, { タグ: "M0611-039-T1" }, { タグ: "M0611-039-T2" }, { タグ: [{ 名: "M0611-039-T1" }, { 名: "M0611-039-T2" }] });
CB("S-M06-11-CBLANG-047", "047", "main", 12000, { 言語: "JP" }, { 言語: "EN" });
CB("S-M06-11-CBSTATE-048", "048", "main", 12000, { 状態: "NM" }, { 状態: "HP" });
CB("S-M06-11-CBTAG-049", "049", "main", 12000, { タグ: "M0611-049-T1" }, { タグ: "M0611-049-T2" }, { タグ: [{ 名: "M0611-049-T1" }, { 名: "M0611-049-T2" }] });
CB("S-M06-11-CBRARITY-050", "050", "main", 12000, { 札: 白M }, { 札: 白C });
CB("S-M06-11-CBCOLOR-051", "051", "main", 12000,
  { 札: { ...白C, 色順: "M0611-051-CW" } }, { 札: { 色: "青", レア: "C", 色順: "M0611-051-CB" } }, { 色順: ["M0611-051-CW", "M0611-051-CB"] });
CB("S-M06-11-CBCOLLECTOR-052", "052", "main", 12000,
  { タグ: "M0611-052-TAG", 番号: "002", カード名英: "M0611-052-NAME" }, { タグ: "M0611-052-TAG", 番号: "010", カード名英: "M0611-052-NAME" }, { タグ: [{ 名: "M0611-052-TAG" }] });
CB("S-M06-11-CBENGLISH-053", "053", "main", 12000,
  { タグ: "M0611-053-TAG", カード名英: "M0611-053-ALPHA" }, { タグ: "M0611-053-TAG", カード名英: "M0611-053-ZEBRA" }, { タグ: [{ 名: "M0611-053-TAG", アルファベット: true }] });

/** 実行の印つきの商品名（ケースが戻しリストの行を探す） */
export const 品名 = (正本: string): string => rc(正本);
