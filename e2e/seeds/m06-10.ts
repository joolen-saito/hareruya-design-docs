/**
 * M06-10 戻しリストCSV出力（店頭買取）の画面シード。正本: cases/M06-10_seed_data.tsv
 *
 * 部品と考え方は seeds/m06-11.ts（戻しリストPDF）と同じ。印つきのデータは画面で作り、共有の設定・マスタは書き換えない。
 *
 * シード表からの読み替え（各シードの報告にも出る）:
 * - 店舗: 「本店（店舗ID 1）」の閾値 100/500/1000 は共有の設定なので書き換えない。印のある試験用の店舗「M06-10試験店舗（本店相当）」を画面（店舗登録）で作り、
 *   閾値を 100/500/1000 にして代わりに使う。「支店A（店舗ID 13）」は、閾値 200/700/1200 の試験用の店舗「M06-10試験支店A」で代える。
 *   棚番号は本店（店舗ID 1）の買取だけ出る仕様のため、棚番号を確かめるケースは実装していない。
 * - 商品: カード商品CSV登録（カード詳細を指定）で作る（グッズ商品CSV登録は使わない: ECCUBE_HARERUYA-3966）。サプライ品は作らない。
 *   商品名・カード名・略称タグは実行の印つき。
 * - 買取: フロントの店頭買取査定申込 → 管理画面で入庫待ち → 実在庫情報の編集から商品を足す。査定IDは申込完了画面の値を控える
 *   （シード表の「M0610-001-002」などの決め打ちの査定IDは画面が振るので使えない。呼び名〔査定ID-M0610-001-002〕で控える）。
 *   買取申込日時は設定しない。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { reportSeedIssue } from "../lib/seeds";
import { rc } from "../lib/run_marker";
import { Account, withAdminSession } from "../lib/session";
import { defineSeed } from "./current_seed";
import { 申込を行う, 査定IDを読む, 申込者の, storeInput } from "./m06-common";
import { 規格を整える, カードを登録する, 実在庫に商品を追加する, 略称タグを登録する } from "../pages/admin/m06_11_setup";
import { カード商品CSVの見出し, カード商品CSVを登録する, 商品名で商品IDを読む, 商品規格一覧を読む, 単体カード配下のカテゴリID, 登録済みの割引率ID } from "../pages/admin/f05_04_products";
import { readExistingSellGroupName } from "../pages/admin/m03_01_goods_csv";
import { readLanguageIds } from "../pages/admin/m03_23_seed_products";
import { 商品をカードにする, マスタを読む } from "../pages/admin/m07_09_card";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { ensureStoreWithThresholds } from "../pages/admin/m04_25_move_chain";
import { OtcDetailPage, OtcListPage } from "../pages/admin/m06_otc_list";
import { ensureCardset } from "../pages/admin/product_masters";

export const M0610_ADMIN: Account = { loginId: "m0610_admin", password: "Passw0rd!M0610" };

type 店キー = "main" | "branch";
const 店の定義 = {
  main: { 入力: storeInput("M06-10試験店舗（本店相当）", "エムゼロロクイチゼロシケンテンポホンテンソウトウ", "Modoshi Test Main", "m0610main", "K2M"), 閾値: ["100", "500", "1000"] as [string, string, string] },
  branch: { 入力: storeInput("M06-10試験支店A", "エムゼロロクイチゼロシケンシテンエー", "Modoshi Test Branch A", "m0610brancha", "K2N"), 閾値: ["200", "700", "1200"] as [string, string, string] },
};
const 支店URLの = (k: 店キー): string => 店の定義[k].入力.支店URL;

async function 店舗を用意する(browser: Browser, k: 店キー, issue: (m: string) => void): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    return ensureStoreWithThresholds(page, { ...店の定義[k].入力, 高額商品閾値: 店の定義[k].閾値 }, issue);
  });
}

defineSeed("S-M06-10-ADM", async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const main = await 店舗を用意する(browser, "main", issue);
  const branch = await 店舗を用意する(browser, "branch", issue);
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
    名前: "M06-10試験管理者", ログインID: M0610_ADMIN.loginId, メールアドレス: "m0610_admin@example.test", パスワード: M0610_ADMIN.password,
    権限: "システム管理者", 所属店舗ID: main, デフォルト検索表示店舗ID: "", 編集可能店舗ID: [main, branch],
  }));
  issue("管理者ID 610100000 は指定できない（画面が振る）。権限は「システム管理者」。編集できる店舗は、本店・支店Aの代わりに作った試験用の店舗2つ（店舗は画面で登録）");
});

defineSeed("S-M06-10-STORE-MAIN", { needs: ["S-M06-10-ADM"] }, async ({ seed }) => {
  reportSeedIssue(seed.シードID, "本店（店舗ID 1）の高額商品閾値1〜3は共有の設定なので書き換えない（控えて戻す運用もしない）。代わりに、閾値 100/500/1000 の試験用の店舗「M06-10試験店舗（本店相当）」を画面で作って使った");
});

defineSeed("S-M06-10-STORE-BRANCH", { needs: ["S-M06-10-ADM"] }, async ({ seed }) => {
  reportSeedIssue(seed.シードID, "店舗ID 13の支店Aは作れない（店舗IDは画面で指定できない）ので、閾値 200/700/1200 の試験用の店舗「M06-10試験支店A」を画面で作って使った");
});

type 前提 = { 言語JP: string; レア: { C: string }; 割引率: string; カテゴリ: string; 購入グループ: string; カードセット: string };
let 前提の控え: 前提 | null = null;

async function 前提を読む(browser: Browser, issue: (m: string) => void): Promise<前提> {
  if (前提の控え) return 前提の控え;
  const v = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const lang = await readLanguageIds(page);
    const rare = await マスタを読む(page, "レアリティ");
    const C = rare.find((r) => r.コード === "C");
    if (!C) throw new Error("レアリティ C が無い");
    const cat = await 単体カード配下のカテゴリID(page);
    const disc = await 登録済みの割引率ID(page);
    const group = await readExistingSellGroupName(page);
    const set = await ensureCardset(page, "M06-10試験カードセット", "M0610 Test Set", "M0610S", issue);
    return { 言語JP: lang.日本語, レア: { C: C.名称 }, 割引率: disc.id, カテゴリ: cat.id, 購入グループ: group, カードセット: set };
  });
  前提の控え = v;
  return v;
}

defineSeed("S-M06-10-REF", async ({ browser, seed }) => {
  await 前提を読む(browser, (m) => reportSeedIssue(seed.シードID, m));
  reportSeedIssue(seed.シードID, "参照マスタ（店頭買取ステータス・言語JP・状態NM）は書き換えず、既存のものを使った。略称ABCは、印つきの名称の略称タグを画面で登録して使う（013）");
});

type 品 = { 名: string; 価格: number; 販売価格?: number; 数?: number; タグ?: string };
type 買取 = { ラベル: string; 品: 品[] };
type 定義 = { 店: 店キー; 買取: 買取[]; 読み替え?: string[] };

let 連番 = 0;
const 番号の基 = String(Date.now()).slice(-9);
const 次の番号 = (): string => `${番号の基}${String(++連番).padStart(2, "0")}`;
let タグ並び = 9500;

async function 作る(browser: Browser, seedId: string, 申込者の姓: string, d: 定義): Promise<string[]> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const p = await 前提を読む(browser, issue);
  const 全品 = d.買取.flatMap((b) => b.品);
  const タグ = [...new Set(全品.map((x) => x.タグ).filter((t): t is string => !!t))];

  await 店舗を用意する(browser, d.店, issue);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const t of タグ) await 略称タグを登録する(page, { 名称: rc(`${t}-${seedId}`), 並び順: String(++タグ並び), アルファベット順: false }, seedId);
    if (タグ.length) issue(`略称タグ「${タグ.map((t) => rc(`${t}-${seedId}`)).join("」「")}」を、略称タグ登録で登録した（共有の略称タグには足さず、印つきの名称）`);

    const カード = new Map<品, string>();
    for (const x of 全品) {
      const c = await カードを登録する(page, {
        カード名英: rc(x.名), カラー: "白",
        詳細: { カードセットID: p.カードセット, カード番号: 次の番号(), レアリティ名: p.レア.C, Foil: false },
      }, `${seedId}: カード ${x.名}`, issue);
      カード.set(x, c.カード詳細ID);
    }
    const 見出し = await カード商品CSVの見出し(page);
    const row = (x: 品): Record<string, string> => ({
      "商品ID": "", "言語(ID)": p.言語JP, "商品公開ステータス": "2", "支店の商品公開ステータス": "1",
      "商品名(日)": rc(x.名), "商品名(英)": rc(x.名), "サイズ": "1", "重量": "1", "商品カテゴリ(ID)": p.カテゴリ,
      "購入グループ名称": p.購入グループ, "割引率(ID)": p.割引率, "基準価格": String(x.価格), "販売価格": String(x.販売価格 ?? x.価格), "買取価格": String(x.価格),
      "カード詳細(ID)": カード.get(x)!,
    });
    await カード商品CSVを登録する(page, 見出し, 全品.map(row), `${seedId}-card.csv`.toLowerCase(), `${seedId}: カード商品CSV登録`, issue);
    for (const x of 全品) {
      const id = await 商品名で商品IDを読む(page, rc(x.名));
      if (x.タグ) await 商品をカードにする(page, id, { 商品名: rc(x.名), 略称タグ: rc(`${x.タグ}-${seedId}`) }, issue);
      const 規格 = (await 商品規格一覧を読む(page, id)).filter((r) => r.状態 === "NM");
      if (規格.length !== 1) throw new Error(`${seedId}: 商品「${rc(x.名)}」の規格（NM）が ${規格.length} 件ある（1件のはず）`);
      await 規格を整える(page, id, 規格[0].商品規格ID, {}, `${seedId}: 商品「${rc(x.名)}」の規格`, issue);
    }
  });
  issue("商品は、カード商品CSV登録（カード詳細を指定）で作った。商品名・カード名は実行の印つき。商品規格は、スマレジ連携を「連携しない」・公開にして登録した。言語は日本語・状態はNM・非Foil。棚番号は設定しない（本店以外の買取では出ない）");
  for (const m of d.読み替え ?? []) issue(m);

  const ids: string[] = [];
  for (const [i, b] of d.買取.entries()) {
    const 姓 = rc(`${申込者の姓}${d.買取.length > 1 ? String.fromCharCode(65 + i) : ""}`);
    await 申込を行う(browser, 支店URLの(d.店), [申込者の(姓, "一郎", "カイトリシケン", "イチロウ")]);
    const [id] = await 査定IDを読む(browser, 姓, 1);
    ids.push(id);
    await withAdminSession(browser, M0610_ADMIN, async (page) => {
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
      await 実在庫に商品を追加する(page, b.品.map((x) => ({ 商品名: rc(x.名), 状態: "NM", 増減数: String(x.数 ?? 1) })), `${seedId}: 買取 ${id} の実在庫の追加`);
    });
  }
  return ids;
}

function 買取シード(seedId: string, 申込者の姓: string, d: 定義): void {
  defineSeed(seedId, { needs: ["S-M06-10-ADM", "S-M06-10-REF"] }, async ({ browser, notes }) => {
    const ids = await 作る(browser, seedId, 申込者の姓, d);
    d.買取.forEach((b, i) => notes.set(b.ラベル, ids[i]));
  });
}

/** 呼び名（正本の決め打ちの査定ID）。実際の査定IDは画面が振る */
export const 査定の呼び名 = (正本の査定ID: string): string => `〔査定ID-${正本の査定ID}〕`;
const L = 査定の呼び名;
/** 実行の印つきの商品名 */
export const 品名 = (正本: string): string => rc(正本);
/** 略称ABCの略称タグの名称（シードごとに印つきの名称で登録する） */
export const 略称ABC = (シードID: string): string => rc(`ABC-${シードID}`);

買取シード("S-M06-10-PICK-MAIN-002", "戻しCSV002", { 店: "main", 買取: [{ ラベル: L("M0610-001-002"), 品: [{ 名: "基準価格判定カード-002", 価格: 1200, 販売価格: 50 }] }] });
買取シード("S-M06-10-PICK-BRANCH-003", "戻しCSV003", { 店: "branch", 買取: [{ ラベル: L("M0610-002-003"), 品: [{ 名: "支店閾値判定カード-003", 価格: 1900 }] }] });
for (const n of ["008", "009"]) {
  買取シード(`S-M06-10-FIELDS-${n}`, `戻しCSV${n}`, {
    店: "main", 買取: [{ ラベル: L(`M0610-006-${n}`), 品: [{ 名: `通常カード-${n}`, 価格: 600, 数: n === "008" ? 2 : 1 }] }],
    読み替え: ["シード表のFoilカード・サプライ品・略称ABCは、この番号のケースが確かめないので作らない（サプライ品はグッズ商品CSV登録が要るため作れない）"],
  });
}
買取シード("S-M06-10-ABBR-013", "戻しCSV013", {
  店: "main", 買取: [{ ラベル: L("M0610-013-A"), 品: [{ 名: "略称確認カード-013", 価格: 600, タグ: "ABC" }] }],
  読み替え: ["シード表のサプライ品「略称確認サプライ-013」は作らない（ケースが確かめるのは、サプライ品でない商品の略称だけ。サプライ品はグッズ商品CSV登録が要るため作れない）。略称ABCは印つきの名称の略称タグ（CSVの略称も印つきの名称で出る）"],
});
買取シード("S-M06-10-CBLOWBR-016", "戻しCSV016", { 店: "branch", 買取: [{ ラベル: L("M0610-016"), 品: [{ 名: "支店最低閾値カード-016", 価格: 150 }] }] });
