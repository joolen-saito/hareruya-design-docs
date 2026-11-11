/**
 * M06-01 買取一覧(検索入力・検索結果) のシードのうち、カード商品が要るもの・既定表示件数の確認用（seeds/m06-01-more.ts の続き）。正本: cases/M06-01_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10 印つきデータは何でも）で、次のように作る。読み替えは、シードの注記（エビデンスの「シード作成時の問題」）に残す。
 * - 商品: カード（印つきの名前）をカード新規登録で登録し、カード商品CSV登録（カード詳細を指定。グッズ商品CSVは使わない）で作る。
 *   言語・状態はCSVの言語と商品規格の状態（NM）。基準価格・買取価格は 300 円（100 円以上 500 円未満）。
 *   棚番号は、共有のマスタに新しい行を足さず、既存の棚番号のうち並び順の違う2つを使う（正本の「棚99」「棚1」の代わり）。
 * - 買取: フロントの店頭買取査定申込で申込み、ステータス変更画面で「入庫待ち」にし、実在庫情報は買取詳細の実在庫の編集で商品を追加する（画面）。
 * - 作らないシード: 理由は spec/m06/m06-01-card.spec.ts の冒頭に書いた。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { defineSeed } from "./current_seed";
import { 申込を行う, 査定IDを読む, 申込者の } from "./m06-common";
import { M0601_ADMIN_ALL, ステータスを変える, 一件ずつ申込む, 支店URL, 試験者 } from "./m06-01";
import { カードを登録する, 規格を整える, 実在庫に商品を追加する } from "../pages/admin/m06_11_setup";
import { カード商品CSVの見出し, カード商品CSVを登録する, 商品名で商品IDを読む, 商品規格一覧を読む, 単体カード配下のカテゴリID, 登録済みの割引率ID } from "../pages/admin/f05_04_products";
import { readExistingSellGroupName } from "../pages/admin/m03_01_goods_csv";
import { readLanguageIds } from "../pages/admin/m03_23_seed_products";
import { 棚番号を読む, マスタを読む } from "../pages/admin/m07_09_card";
import { OtcListPage } from "../pages/admin/m06_otc_list";
import { ensureCardset } from "../pages/admin/product_masters";

const NEEDS = ["S-M06-01-SHOPS", "S-M06-01-ADM-ALL"];

// ---- 002: 既定表示件数の確認用（店舗A・査定前）。既定表示件数の設定は共有の設定なので書き換えない ----
defineSeed("S-M06-01-SEARCH-002", { needs: [...NEEDS, "S-M06-01-CONFIG"] }, async ({ browser, notes, seed }) => {
  const t = 試験者(rc("買取試験002"));
  notes.set("〔査定ID-M0601-002〕", await 一件ずつ申込む(browser, "A", t.姓, t.名, t.セイ, t.メイ));
  reportSeedIssue(seed.シードID, "査定申込日時（2026-09-20）・棚戻し済みのDB設定は、ケースが確かめないので行わず、申込で入った値のままにした。既定表示件数の設定は共有の設定なので書き換えない（アプリの現在の値を確かめる）");
});

// ---- 支店の戻しリスト（言語順の確認） ----

type 前提 = { 言語: { JP: string; EN: string }; 割引率: string; カテゴリ: string; 購入グループ: string; カードセット: string; レア: string; 棚: { 名称: string; 並び順: number }[] };
let 前提の控え: 前提 | undefined;

async function 前提を読む(browser: Browser, issue: (m: string) => void): Promise<前提> {
  if (前提の控え) return 前提の控え;
  const v = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const lang = await readLanguageIds(page);
    const rare = await マスタを読む(page, "レアリティ");
    const C = rare.find((r) => r.コード === "C") ?? rare[0];
    if (!C) throw new Error("レアリティのマスタが空");
    const cat = await 単体カード配下のカテゴリID(page);
    const disc = await 登録済みの割引率ID(page);
    const group = await readExistingSellGroupName(page);
    const set = await ensureCardset(page, "M06-01試験カードセット", "M0601 Test Set", "M0601S", issue);
    const shelves = (await 棚番号を読む(page)).sort((a, b) => a.並び順 - b.並び順);
    return { 言語: { JP: lang.日本語, EN: lang.英語 }, 割引率: disc.id, カテゴリ: cat.id, 購入グループ: group, カードセット: set, レア: C.名称, 棚: shelves.map((s) => ({ 名称: s.名称, 並び順: s.並び順 })) };
  });
  前提の控え = v;
  return v;
}

let 連番 = 0;
const 番号の基 = String(Date.now()).slice(-9);

type 品 = { 名: string; 言語: "JP" | "EN"; 棚: 0 | 1 };

/**
 * 買取店舗Bの買取を申込み、入庫待ちにし、品（カード商品）を実在庫に足す。査定IDを返す。
 * 品は 1 つ目が日本語・棚の並び順が大きい方（正本の棚99）、2 つ目が英語・並び順が小さい方（棚1）。
 */
async function 支店Bの戻しリストの買取(browser: Browser, seedId: string, 申込者の姓: string, 品々: 品[]): Promise<string> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const p = await 前提を読む(browser, issue);
  const 棚 = [p.棚[0], p.棚.find((s) => s.並び順 > p.棚[0].並び順)];
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const 詳細 = new Map<品, string>();
    for (const x of 品々) {
      const c = await カードを登録する(page, {
        カード名英: rc(x.名), カラー: "白",
        詳細: { カードセットID: p.カードセット, カード番号: `${番号の基}${String(++連番).padStart(2, "0")}`, レアリティ名: p.レア, Foil: false },
      }, `${seedId}: カード ${x.名}`, issue);
      詳細.set(x, c.カード詳細ID);
    }
    const 見出し = await カード商品CSVの見出し(page);
    const row = (x: 品): Record<string, string> => ({
      "商品ID": "", "言語(ID)": p.言語[x.言語], "商品公開ステータス": "2", "支店の商品公開ステータス": "1",
      "商品名(日)": rc(x.名), "商品名(英)": rc(x.名), "サイズ": "1", "重量": "1", "商品カテゴリ(ID)": p.カテゴリ,
      "購入グループ名称": p.購入グループ, "割引率(ID)": p.割引率, "基準価格": "300", "販売価格": "300", "買取価格": "300",
      "カード詳細(ID)": 詳細.get(x)!,
    });
    await カード商品CSVを登録する(page, 見出し, 品々.map(row), `${seedId}-card.csv`.toLowerCase(), `${seedId}: カード商品CSV登録`, issue);
    for (const x of 品々) {
      const id = await 商品名で商品IDを読む(page, rc(x.名));
      const ラベル = x.言語 === "JP" ? "日本語" : "英語";
      const 規格 = (await 商品規格一覧を読む(page, id)).filter((r) => r.言語 === ラベル && r.状態 === "NM");
      if (規格.length !== 1) throw new Error(`${seedId}: 商品「${rc(x.名)}」の規格（${ラベル}・NM）が ${規格.length} 件ある（1件のはず）`);
      const 棚番号 = 棚[x.棚]?.名称;
      if (!棚番号) throw new Error(`${seedId}: 並び順の違う既存の棚番号が2つ無い`);
      await 規格を整える(page, id, 規格[0].商品規格ID, { 棚番号 }, `${seedId}: 商品「${rc(x.名)}」の規格`, issue);
    }
  });
  issue("商品は、カード商品CSV登録（カード詳細を指定）で作った。商品名・カード名は実行の印つき。基準価格・買取価格は300円（100円以上500円未満）、状態はNM。棚番号は、共有のマスタに行を足さず、既存の棚番号のうち並び順の違う2つ（日本語=並び順の大きい方〔棚99の代わり〕、英語=小さい方〔棚1の代わり〕）を使った");
  const 姓 = rc(申込者の姓);
  await 申込を行う(browser, 支店URL("B"), [申込者の(姓, "一郎", "カイトリシケン", "イチロウ")]);
  const [id] = await 査定IDを読む(browser, 姓, 1);
  await ステータスを変える(browser, [id], "入庫待ち");
  await withAdminSession(browser, M0601_ADMIN_ALL, async (page) => {
    page.setDefaultTimeout(60_000);
    const list = new OtcListPage(page);
    await list.open();
    await list.日時を空にする();
    await list.買取店舗を選ぶ("");
    await list.査定IDを入れる(id);
    await list.検索する();
    await list.詳細を開く(id);
    await 実在庫に商品を追加する(page, 品々.map((x) => ({ 商品名: rc(x.名), 状態: "NM", 増減数: "1" })), `${seedId}: 買取 ${id} の実在庫の追加`);
  });
  issue(`ステータスはステータス変更画面で「入庫待ち」にし、実在庫情報は買取詳細の実在庫の編集で商品を追加した（査定ID ${id}）`);
  return id;
}

const 二品 = (a: string, b: string): 品[] => [{ 名: a, 言語: "JP", 棚: 1 }, { 名: b, 言語: "EN", 棚: 0 }];

defineSeed("S-M06-01-RESTOCK-SORT-BRANCH-054", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  notes.set("〔査定ID-M0601-054〕", await 支店Bの戻しリストの買取(browser, seed.シードID, "買取試験054", 二品("RS-B01-054", "RS-B02-054")));
});

defineSeed("S-M06-01-CBPDFBRANCH-081", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  notes.set("〔査定ID-M0601-081〕", await 支店Bの戻しリストの買取(browser, seed.シードID, "買取試験M0601-CB081", 二品("M0601-CB081-A", "M0601-CB081-B")));
});
