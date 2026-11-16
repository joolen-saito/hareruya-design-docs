/**
 * F05-01 ネット買取トップページ（フロント）。正本: cases/F05-01_test_cases.tsv
 *
 * 実装したのは、次の28件。
 * - 画面だけで準備できる 001・002・003・004・019・020・021・044・045・046。
 * - 既存データへの読み替え（依頼者の方針 2026-11-10）: 013〜018・031〜035・037・040・041・043。
 *   買取特集コーナー・目玉買取商品の商品は外部の検索サービスの索引から描かれ、画面で作った商品がすぐに出ないので、商品を登録せず、
 *   今ネット買取トップページに出ている既存の商品を使う（シードがその商品ID・規格IDを呼び名に控える）。
 * 目玉買取商品・買取特集コーナーに印つきの商品を出すケース（共有の書き換えあり。夜の1本流しで1件ずつ）:
 * 009・010・011・012・022〜024・028・029・030・038・039・042・048・049・052・053・058〜061・063〜068。作り方と戻し方は seeds/f05-01-index.ts。
 * - 除外を確かめるケースは、同じケースの表示対象の商品がその枠に出ていること（除外の確かめが空振りでないこと）も確かめる。
 * - 028・053 の「DBで対象商品の商品名を更新する」は、この実行で作った印つきの商品の行だけを DB で書き換える（db/unisearch_marked_rows.ts）。
 * ほかのケースは実装しない（理由は報告）: 強化買取商品のコーナー（タグID 1000）が画面に無い（005・006・008・047・050・051・054〜056）、
 * 目玉買取商品の枠にページ送りが無い（026）、目玉の0件は共有のタグから既存の商品を外す必要がある（027）。
 */
import { Locator, test } from "@playwright/test";
import { SETUP_ADMIN } from "../../config/env";
import { expect, caseTest, CaseBody } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { withAdminSession } from "../../lib/session";
import { 店名を読む } from "../../pages/admin/f05_01_setup";
import { 追加システム設定の表示値, 追加システム設定を控えて書き換える } from "../../seeds/add-system-restore";
import { BranchTopPage } from "../../pages/front/f01_02_branch";
import { 入口 } from "../../pages/front/f03_04_category_list";
import { NetBuyCartPage } from "../../pages/front/f05_04_net_detail";
import { PurchaseTopPage, ツリーの項目 } from "../../pages/front/f05_01_purchase_top";
import { F0501_まとめて買取商品 } from "../../seeds/f05-01";
import { f0501索引の商品, f0501商品名, F0501U, 目玉, 特集の6タグ, 特集モダン } from "../../seeds/f05-01-index";
import { タグの商品IDを読む } from "../../pages/admin/unisearch_products";
import { 印つきの商品の商品名を書き換える } from "../../db/unisearch_marked_rows";
import type { CaseCtx } from "../../lib/case";
import type { カードの内容 } from "../../pages/front/f05_01_purchase_top";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** ネット買取トップページのアドレス（/ja/purchase。末尾の / は問わない） */
const ネット買取トップ = /^\/ja\/purchase\/?$/;

caseTest("IT-F05-01-001", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  const purchase = new PurchaseTopPage(page);
  note("事前準備の支店は、手元に既にある公開の支店「トーナメントセンター 大阪」（支店URL osaka）を使った（正本は支店を定めない）");
  let 数 = 0;
  await step(1, async () => {
    expect(await top.open("osaka"), "支店ECTOPの応答").toBeLessThan(400);
    await top.開いている();
    await top.link("高額買取はこちら").first().waitFor({ state: "attached", timeout: 15_000 }).catch(() => undefined); // 読み込みの途中で数えて「無い」と誤らない
    数 = await top.link("高額買取はこちら").count();
  });
  await step(2, async () => {
    // リンクが無いときは押せない。押す操作で待ち続けて時間切れ（未判定）にせず、押さずに期待結果の確かめへ進み、ネット買取トップページへ移っていないことで不合格にする
    if (数 === 0) note("支店ECTOPに「高額買取はこちら」のリンクが無い（リンクが無いので押さずに、移った先の確かめへ進んだ）");
    else await purchase.押して移る(top.link("高額買取はこちら").first());
  });
  await expected(async () => {
    const u = new URL(page.url());
    expect.soft(u.pathname, "移った先のアドレス（ネット買取トップページ）").toMatch(ネット買取トップ);
    expect.soft(u.search, "移った先のアドレスに検索条件・絞り込み条件が付いていない").toBe("");
    await expect.soft(purchase.画面の印, "ネット買取トップページの画面").toHaveCount(1);
  });
});

caseTest("IT-F05-01-002", async ({ page, step, expected }) => {
  const purchase = new PurchaseTopPage(page);
  note("設計書の画面項目「買取方法・流れ」は、画面の先頭の買取トップバナー（ネット買取・店頭買取の2枚のリンク）と読んだ");
  await step(1, async () => {
    expect(await purchase.開く(), "ネット買取トップページの応答").toBeLessThan(400);
    await expect(purchase.画面の印, "ネット買取トップページの画面").toHaveCount(1);
  });
  await step(2, async () => { await purchase.押して移る(purchase.買取方法流れのネット買取リンク.first()); });
  await expected(async () => {
    expect(page.url(), "ブラウザのアドレス").toContain("user_data/purchase_net");
  });
});

caseTest("IT-F05-01-003", async ({ page, step, expected }) => {
  const purchase = new PurchaseTopPage(page);
  await step(1, async () => {
    expect(await purchase.開く(), "ネット買取トップページの応答").toBeLessThan(400);
    await expect(purchase.画面の印, "ネット買取トップページの画面").toHaveCount(1);
  });
  await step(2, async () => { await purchase.押して移る(purchase.買取スタイルの店頭買取リンク.first()); });
  await expected(async () => {
    expect(page.url(), "ブラウザのアドレス").toContain("user_data/purchase_store");
  });
});

caseTest("IT-F05-01-004", async ({ page, browser, notes, step, expected }) => {
  const purchase = new PurchaseTopPage(page);
  const 商品ID = notes.get("〔商品ID-F0501-004〕");
  // 事前準備②: 開始時にまとめて買取商品IDを設定する（S-F05-01-BULK-SETTING）。
  // 共有の設定なので、書き換える前に画面で全項目を控え、ケースの終わりに基盤が画面で元の値へ戻して確かめる（seeds/add-system-restore.ts。F05-06 と同じ部品）
  const 無い = await 追加システム設定を控えて書き換える(browser, "IT-F05-01-004", { まとめて買取商品ID: 商品ID });
  expect(無い, "追加システム設定にまとめて買取商品IDの欄がある").toEqual([]);
  const 表示 = await 追加システム設定の表示値(browser, ["まとめて買取商品ID"]);
  expect(表示["まとめて買取商品ID"], "書き換えたあとの追加システム設定のまとめて買取商品ID").toBe(商品ID);
  note(`事前準備: 共有の追加システム設定は、画面で全項目の元の値を控えて（元の値のまま保存できることも確かめて）から、まとめて買取商品IDだけを ${商品ID} にした。ケースの終わりに基盤が画面で元の値へ戻し、開き直して確かめる`);
  await step(1, async () => {
    expect(await purchase.開く(), "ネット買取トップページの応答").toBeLessThan(400);
    await expect(purchase.画面の印, "ネット買取トップページの画面").toHaveCount(1);
  });
  await step(2, async () => { await purchase.押して移る(purchase.まとめて買取リンク.first()); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "移った先のアドレス（まとめて買取商品の買取商品詳細）").toBe(`/ja/purchase/detail/${商品ID}`);
    await expect.soft(purchase.買取商品詳細の商品名, "買取商品詳細の商品名").toHaveText(rc(F0501_まとめて買取商品.商品名));
  });
});

caseTest("IT-F05-01-019", async ({ page, step, expected, capture }) => {
  const purchase = new PurchaseTopPage(page);
  const 最新セットの下 = rc("タルキール：龍嵐録-019");
  const スタンダードの下 = rc("エルドレインの森-019");
  let 最新セットの枠: string[] = [];
  let スタンダードの子: string[] = [];
  let フォーマットの枠: string[] = [];
  await step(1, async () => {
    expect(await purchase.開く(), "ネット買取トップページの応答").toBeLessThan(400);
    await purchase.カテゴリの描画を待つ();
  });
  await step(2, async () => {
    最新セットの枠 = await purchase.枠の第一階層の名称("latest-set");
    フォーマットの枠 = await purchase.枠の第一階層の名称("formats");
    await purchase.カテゴリ.展開する("スタンダード");
    スタンダードの子 = await purchase.カテゴリ.子の名称("スタンダード");
    await capture("「スタンダード」を展開したカテゴリ一覧");
  });
  await expected(async () => {
    expect.soft(最新セットの枠, "最新セットのツリーに「タルキール：龍嵐録-019」が表示される").toContain(最新セットの下);
    expect.soft(最新セットの枠, "最新セットのツリーに「エルドレインの森-019」が表示されない").not.toContain(スタンダードの下);
    expect.soft(フォーマットの枠, "最新セットと分けたツリー（フォーマット別）に「スタンダード」が表示される").toContain("スタンダード");
    expect.soft(スタンダードの子, "「スタンダード」の下に「エルドレインの森-019」が表示される").toContain(スタンダードの下);
  });
});

caseTest("IT-F05-01-020", async ({ page, notes, step, expected, capture }) => {
  const purchase = new PurchaseTopPage(page);
  const 親 = rc("タルキール：龍嵐録 ブースター・ファン-020");
  const 子 = rc("神話レア＆レア-020");
  const 親のID = notes.get("〔カテゴリID-F0501-020A〕");
  let 子の名称: string[] = [];
  let href = "";
  await step(1, async () => {
    expect(await purchase.開く(), "ネット買取トップページの応答").toBeLessThan(400);
    await purchase.カテゴリの描画を待つ();
  });
  await step(2, async () => {
    await purchase.カテゴリ.展開する(親);
    子の名称 = await purchase.カテゴリ.子の名称(親);
    await capture("「タルキール：龍嵐録 ブースター・ファン-020」を展開したカテゴリ一覧");
  });
  await step(3, async () => {
    const link = purchase.子カテゴリのリンク(親, 子);
    await expect(link, "「神話レア＆レア-020」のリンク").toHaveCount(1);
    href = (await link.getAttribute("href")) ?? "";
    note(`「神話レア＆レア-020」のリンク先: ${decodeURIComponent(href)}`);
  });
  await expected(async () => {
    expect.soft(子の名称, "親カテゴリの下に「神話レア＆レア-020」が表示される").toContain(子);
    const u = new URL(href || "about:blank", page.url());
    expect.soft(decodeURIComponent(u.pathname + u.search), "リンク先に親カテゴリIDが含まれる").toMatch(new RegExp(`[/=]${親のID}(?:[/&?]|$)`));
    expect.soft(u.searchParams.getAll("rarity[0]"), "リンク先の検索パラメータ rarity[0]").toEqual(["4"]);
    expect.soft(u.searchParams.getAll("rarity[1]"), "リンク先の検索パラメータ rarity[1]").toEqual(["3"]);
  });
});

caseTest("IT-F05-01-021", async ({ page, step, expected }) => {
  const purchase = new PurchaseTopPage(page);
  note("ツリーの構成と表示項目は、3つの枠（最新セット・フォーマット別・その他）ごとの第一階層の名称と画像の有無、展開した子の名称と画像の有無で比べた（リンク先は販売側と買取側で違う作りなので比べない）");
  let 販売側: Record<string, ツリーの項目[]> = {};
  let 買取側: Record<string, ツリーの項目[]> = {};
  await step(1, async () => {
    expect(await purchase.カテゴリ.ECTOPを開く(入口.本店), "本店ECTOPの応答").toBeLessThan(400);
    販売側 = await purchase.ツリーの構成();
  });
  await step(2, async () => {
    expect(await purchase.開く(), "ネット買取トップページの応答").toBeLessThan(400);
    await purchase.カテゴリの描画を待つ();
    買取側 = await purchase.ツリーの構成();
  });
  await expected(async () => {
    for (const [枠, 名] of [["latest-set", "最新セット"], ["formats", "フォーマット別"], ["others", "その他"]] as const) {
      expect.soft(販売側[枠]?.length ?? 0, `ECTOPの「${名}」の枠の第一階層の数（比べる対象がある）`).toBeGreaterThan(0);
      expect.soft(買取側[枠], `ネット買取トップページの「${名}」の枠のツリーの構成と表示項目が、ECTOPと同じ`).toEqual(販売側[枠]);
    }
  });
});

caseTest("IT-F05-01-044", async ({ page, step, expected }) => {
  const purchase = new PurchaseTopPage(page);
  const 親 = rc("セットF0501-044-A");
  const 子 = rc("レアリティF0501-044-B");
  await step(1, async () => {
    expect(await purchase.開く(), "ネット買取トップページの応答").toBeLessThan(400);
    await purchase.カテゴリの描画を待つ();
  });
  await step(2, async () => {
    await purchase.カテゴリ.展開する(親);
    await expect(purchase.子カテゴリのリンク(親, 子), "「セットF0501-044-A」の下の「レアリティF0501-044-B」").toHaveCount(1);
  });
  await step(3, async () => { await purchase.押して移る(purchase.子カテゴリのリンク(親, 子)); });
  await expected(async () => {
    const path = new URL(page.url()).pathname;
    await expect.soft(purchase.ネット買取商品一覧の印, "ネット買取商品一覧の画面").toHaveCount(1);
    expect.soft(path, "移った先のアドレスがネット買取商品一覧").toContain("/purchase/search");
    await expect.soft(purchase.販売側の商品一覧の印, "販売側の商品一覧の画面ではない").toHaveCount(0);
    expect.soft(path, "移った先のアドレスが販売側の商品一覧でない").not.toContain("/products/search");
  });
});

caseTest("IT-F05-01-045", async ({ page, step, expected }) => {
  const purchase = new PurchaseTopPage(page);
  const 親 = rc("セットF0501-045-A");
  const 子 = rc("レアリティF0501-045-B");
  let href = "";
  await step(1, async () => {
    expect(await purchase.開く(), "ネット買取トップページの応答").toBeLessThan(400);
    await purchase.カテゴリの描画を待つ();
  });
  await step(2, async () => {
    await purchase.カテゴリ.展開する(親);
    await expect(purchase.子カテゴリのリンク(親, 子), "「セットF0501-045-A」の下の「レアリティF0501-045-B」").toHaveCount(1);
  });
  await step(3, async () => {
    href = (await purchase.子カテゴリのリンク(親, 子).getAttribute("href")) ?? "";
    note(`「レアリティF0501-045-B」のリンク先: ${decodeURIComponent(href)}`);
  });
  await expected(async () => {
    const u = new URL(href || "about:blank", page.url());
    note("並び順の指定は、アドレスの中の並び順を指定する項目と読んだ");
    expect.soft([...u.searchParams.keys()].filter((k) => /orderby|sort/i.test(k)), "リンク先のアドレスにある並び順の指定").toEqual([]);
    expect.soft(u.searchParams.getAll("rarity[0]"), "リンク先の検索パラメータ rarity[0]").toEqual(["4"]);
  });
});

caseTest("IT-F05-01-046", async ({ page, step, expected, capture }) => {
  const purchase = new PurchaseTopPage(page);
  const セット = rc("セットF0501-046-A");
  let 最新セットの枠: string[] = [];
  let 販促: string[] = [];
  await step(1, async () => {
    expect(await purchase.開く(), "ネット買取トップページの応答").toBeLessThan(400);
    await purchase.カテゴリの描画を待つ();
  });
  await step(2, async () => {
    最新セットの枠 = await purchase.枠の第一階層の名称("latest-set");
    await purchase.カテゴリ一覧の区画.first().scrollIntoViewIfNeeded();
    販促 = await purchase.販促バナーらしき表示();
    await capture("カテゴリ一覧とその周辺");
  });
  await expected(async () => {
    note("販促バナーは、カテゴリ一覧の区画とその前後の区画にある、決済・受取・発送・ポイントを表す文字（文と画像の代替の文）で数えた");
    expect.soft(最新セットの枠, "カテゴリ一覧が描かれている（最新セットのツリーに「セットF0501-046-A」）").toContain(セット);
    expect.soft(販促, "カテゴリ一覧とその周辺の、決済・受取・発送・ポイントの販促バナー").toEqual([]);
  });
});

// ==== 既存データへの読み替えで実装したケース（買取特集コーナー・目玉買取商品。方針 2026-11-10） ====
// 商品は外部の検索サービスの索引から描かれ、画面で作った商品がすぐには出ないので、商品を登録せず、今出ている既存の商品を使う。
// 各ケースのシード（S-F05-01-…）が、使う既存の商品の商品ID・規格IDを呼び名に控える。

const 特集のタグ順 = ["633", "634", "635", "637", "636", "638"];

async function トップを開く(purchase: PurchaseTopPage): Promise<void> {
  expect(await purchase.開く(), "ネット買取トップページの応答").toBeLessThan(400);
  await expect(purchase.画面の印, "ネット買取トップページの画面").toHaveCount(1);
}

caseTest("IT-F05-01-009", async ({ page, step, expected }) => {
  const purchase = new PurchaseTopPage(page);
  note("各カテゴリは、枠の「もっと見る」のリンク先のタグIDで見分けた（画面の見出しの文言は設計書・正本の呼び名と違うことがあるため、見出しは注記に残す）。商品は、タグごとにそのタグだけを付けた印つきの商品（カード商品・各1件。商品名は「特集分類-009-タグID」）を作り、その枠に出ていること・ほかのタグの枠に出ていないことで、枠の商品がそのタグの対象であることを確かめた（正本は4件ずつ・カード以外も含む。カード以外は索引の発売日が空で先頭に並ぶとは限らないので作っていない）");
  let 枠: { タグID: string; 見出し: string }[] = [];
  const 枠の商品: Record<string, string[]> = {};
  await step(1, async () => { await トップを開く(purchase); });
  await step(2, async () => {
    await purchase.特集の描画を待つ();
    枠 = await purchase.特集の枠の一覧();
    for (const { タグID } of 枠) 枠の商品[タグID] = (await purchase.カードを読む(purchase.カード(purchase.特集の枠(タグID)))).map((c) => c.商品ID);
    note(`買取特集コーナーの枠（上から順）: ${枠.map((w) => `${w.見出し}（タグID ${w.タグID}・商品 ${枠の商品[w.タグID].length}件）`).join("、")}`);
  });
  await expected(async () => {
    expect.soft(枠.map((w) => w.タグID), "買取特集コーナーの枠のタグID（画面の並び）").toEqual(expect.arrayContaining(特集のタグ順));
    for (const id of 特集のタグ順) {
      const 印 = f0501索引の商品("009", id);
      expect.soft(枠の商品[id]?.length ?? 0, `タグID ${id} のカテゴリに表示された商品の数（1件以上）`).toBeGreaterThan(0);
      expect.soft(枠の商品[id]?.includes(印.商品ID) ?? false, `タグID ${id} のカテゴリに、そのタグの対象商品「${印.商品名}」（商品ID ${印.商品ID}）が表示される`).toBe(true);
      for (const 他 of 特集のタグ順.filter((x) => x !== id)) {
        expect.soft(枠の商品[他]?.includes(印.商品ID) ?? false, `タグID ${他} のカテゴリに、タグID ${id} の対象商品「${印.商品名}」が表示されない`).toBe(false);
      }
    }
  });
});

caseTest("IT-F05-01-012", async ({ page, browser, step, expected }) => {
  const purchase = new PurchaseTopPage(page);
  note("各タグに、印つきの商品（カード商品）を発売日の新しい順に 01〜04 の4件ずつ付けた（商品名は「特集上限-012-タグID-番号」）。タグに4件以上あることを管理画面のタグの対象商品で確かめてから、枠に3件だけ出る（4件目が出ない）ことを見た");
  const 商品数: Record<string, number> = {};
  const 枠の商品: Record<string, string[]> = {};
  const タグの印つき: Record<string, string[]> = {};
  await step(1, async () => { await トップを開く(purchase); });
  await step(2, async () => {
    // 前提: 元のタグに4件以上ある（印つきの4件がそのタグの対象になっている）
    await withAdminSession(browser, SETUP_ADMIN, async (admin) => {
      admin.setDefaultTimeout(60_000);
      for (const id of 特集のタグ順) タグの印つき[id] = await タグの商品IDを読む(admin, id, F0501U);
    });
    note(`管理画面のタグの対象商品（印つき）: ${特集のタグ順.map((id) => `タグID ${id} ${タグの印つき[id].length}件`).join("、")}`);
    await purchase.特集の描画を待つ();
    for (const id of 特集のタグ順) {
      枠の商品[id] = (await purchase.カードを読む(purchase.カード(purchase.特集の枠(id)))).map((c) => c.商品ID);
      商品数[id] = 枠の商品[id].length;
    }
  });
  await expected(async () => {
    for (const id of 特集のタグ順) {
      const 四件 = ["01", "02", "03", "04"].map((j) => f0501索引の商品("012", `${id}-${j}`).商品ID);
      expect.soft(四件.every((x) => タグの印つき[id]?.includes(x)), `タグID ${id} の対象商品に、印つきの4件（商品ID ${四件.join("・")}）がすべて入っている（4件以上ある前提）`).toBe(true);
      expect.soft(商品数[id], `タグID ${id} のカテゴリに表示された商品の数`).toBe(3);
      expect.soft(枠の商品[id].includes(四件[3]), `タグID ${id} の4件目（商品ID ${四件[3]}）が表示されない`).toBe(false);
    }
  });
});

/** 013〜018: 買取特集コーナーのタグごとの「もっと見る」 */
function 特集のもっと見るのケース(no: string, tagId: string): CaseBody {
  return async ({ page, notes, step, expected }) => {
  const purchase = new PurchaseTopPage(page);
  const 商品ID = notes.get(`〔商品ID-F0501-${no}〕`);
  note(`商品は、登録せず買取特集コーナーのタグID ${tagId} の枠に今出ている既存の商品（商品ID ${商品ID}）で見た。遷移先の一覧に、その商品が表示されることを確かめた`);
  let 一覧の商品: string[] = [];
  await step(1, async () => { await トップを開く(purchase); await purchase.特集の描画を待つ(); });
  await step(2, async () => {
    await purchase.押して移る(purchase.特集のもっと見る(tagId).first());
    一覧の商品 = await purchase.一覧の商品IDs();
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "移った先のアドレス（ネット買取商品一覧）").toMatch(new RegExp(`/purchase/search/tag/${tagId}/?$`));
    await expect.soft(purchase.ネット買取商品一覧の印, "ネット買取商品一覧の画面").toHaveCount(1);
    expect.soft(一覧の商品.length, `タグID ${tagId} の商品として一覧に表示された商品の数（1件以上）`).toBeGreaterThan(0);
    expect.soft(一覧の商品, `一覧に商品ID ${商品ID} の商品が表示される`).toContain(商品ID);
  });
  };
}

caseTest("IT-F05-01-013", 特集のもっと見るのケース("013", "633"));
caseTest("IT-F05-01-014", 特集のもっと見るのケース("014", "634"));
caseTest("IT-F05-01-015", 特集のもっと見るのケース("015", "635"));
caseTest("IT-F05-01-016", 特集のもっと見るのケース("016", "637"));
caseTest("IT-F05-01-017", 特集のもっと見るのケース("017", "636"));
caseTest("IT-F05-01-018", 特集のもっと見るのケース("018", "638"));

caseTest("IT-F05-01-030", async ({ page, notes, step, expected }) => {
  const purchase = new PurchaseTopPage(page);
  const A = notes.get("〔商品ID-F0501-030A〕");
  const B = notes.get("〔商品ID-F0501-030B〕");
  note(`買取価格499円（商品ID ${A}）・500円（商品ID ${B}）の印つきの商品を作って、目玉買取商品で見た（正本は「カード以外」。カード以外は索引の発売日が空で目玉の先頭に並ぶとは限らないので、カードを指定した商品で作った）`);
  let 内容A: Awaited<ReturnType<PurchaseTopPage["カードを読む"]>> = [];
  let 内容B: Awaited<ReturnType<PurchaseTopPage["カードを読む"]>> = [];
  await step(1, async () => { await トップを開く(purchase); });
  await step(2, async () => {
    await purchase.区画の描画を待つ(purchase.目玉の区画);
    const a = purchase.商品のカード(purchase.目玉の区画, A);
    const b = purchase.商品のカード(purchase.目玉の区画, B);
    await expect(a, `目玉買取商品に商品ID ${A} の商品がある`).toHaveCount(1);
    await expect(b, `目玉買取商品に商品ID ${B} の商品がある`).toHaveCount(1);
    内容A = await purchase.カードを読む(a);
    内容B = await purchase.カードを読む(b);
  });
  await expected(async () => {
    const x = 内容A[0]?.数量の操作;
    const y = 内容B[0]?.数量の操作;
    expect.soft(内容A[0]?.買取価格, "境界値の商品（499円）の買取価格").toBe(499);
    expect.soft(内容B[0]?.買取価格, "境界値の商品（500円）の買取価格").toBe(500);
    expect.soft(x, "500円未満の商品では商品数入力・マイナス・プラス・カートに入れるが表示されない").toEqual({ 入力: false, マイナス: false, プラス: false, カートに入れる: false });
    expect.soft(y, "500円以上の商品では商品数入力・マイナス・プラス・カートに入れるが表示される").toEqual({ 入力: true, マイナス: true, プラス: true, カートに入れる: true });
  });
});

/**
 * 031〜035: 目玉買取商品のカートへの追加（数量の操作）。買取カートは、ケースごとの新しいブラウザセッションの空の状態から始まる。
 * 手順は「ネット買取トップページを開く」「数量の操作（0回以上）」「カートに入れる」「買取カートを開く」の順（正本の手順の番号に合わせる）。
 */
type 数量の操作 = (p: PurchaseTopPage, card: Locator) => Promise<void>;
const カートのケース: { no: string; 操作: 数量の操作[]; 数量: string }[] = [
  { no: "031", 操作: [], 数量: "1" },
  { no: "032", 操作: [async (p, c) => { await p.数量のボタンを押す(p.プラス(c), 2); }], 数量: "3" },
  { no: "033", 操作: [async (p, c) => { await p.数量のボタンを押す(p.プラス(c), 2); }, async (p, c) => { await p.数量のボタンを押す(p.マイナス(c), 1); }], 数量: "2" },
  { no: "034", 操作: [async (p, c) => {
    const 無効 = await p.数量のボタンを押す(p.マイナス(c), 1);
    note(`初期値1でマイナスを押したとき、画面はマイナスを${無効 === 1 ? "無効にしていた（無効の位置を押した）" : "無効にしていなかった"}`);
  }], 数量: "1" },
  { no: "035", 操作: [async (p, c) => {
    const 無効 = await p.数量のボタンを押す(p.プラス(c), 20);
    note(`プラスを20回押した（上限に達してから、画面がプラスを無効にしていたのは ${無効} 回）`);
  }], 数量: "20" },
];
function カートのケース実行(k: { no: string; 操作: 数量の操作[]; 数量: string }): CaseBody {
  return async ({ page, notes, step, expected }) => {
  const purchase = new PurchaseTopPage(page);
  const cart = new NetBuyCartPage(page);
  const 商品ID = notes.get(`〔商品ID-F0501-${k.no}〕`);
  note(`「目玉500円商品」は登録せず、目玉買取商品に今出ている買取価格500円以上の既存の商品（商品ID ${商品ID}）で代えた。カートに入れて買取カートを見るだけで、買取の申込みはしない（在庫は減らない）`);
  const card = () => purchase.商品のカード(purchase.目玉の区画, 商品ID);
  let 追加の応答 = 0;
  let カートの数量: string[] = [];
  await step(1, async () => {
    await トップを開く(purchase);
    await purchase.区画の描画を待つ(purchase.目玉の区画);
    await expect(card(), `目玉買取商品に商品ID ${商品ID} の商品がある`).toHaveCount(1);
  });
  let n = 2;
  for (const 操作 of k.操作) await step(n++, async () => { await 操作(purchase, card()); });
  await step(n++, async () => {
    if (k.操作.length === 0) await expect(purchase.数量の欄(card()), "初期状態の商品数").toHaveValue("1");
    else await expect(purchase.数量の欄(card()), "カートに入れる前の商品数").toHaveValue(k.数量);
    追加の応答 = (await purchase.カートに入れる(card())).応答;
  });
  await step(n++, async () => {
    await cart.開く();
    // 「ご案内」のモーダル（まとめて買取の案内）が明細の行を覆い、商品名・数量が読めない（エビデンスに写らない）ので、閉じてから読む
    if (await cart.ご案内を閉じる()) note("ネット買取カートを開いたときに出た「ご案内」のモーダル（まとめて買取の案内）は、明細の行を覆うので「閉じる」で閉じてから確かめた（正本の外の補い）");
    カートの数量 = await cart.数量(商品ID);
    note(`ネット買取カートの商品ID ${商品ID} の商品の数量: ${カートの数量.join("・") || "行なし"}（期待 ${k.数量}）`);
  });
  await expected(async () => {
    expect.soft(追加の応答, "カートに入れる要求の応答").toBeLessThan(400);
    expect.soft(カートの数量, `ネット買取カートの商品ID ${商品ID} の商品の数量`).toEqual([k.数量]);
  });
  };
}

caseTest("IT-F05-01-031", カートのケース実行(カートのケース.find((k) => k.no === "031")!));
caseTest("IT-F05-01-032", カートのケース実行(カートのケース.find((k) => k.no === "032")!));
caseTest("IT-F05-01-033", カートのケース実行(カートのケース.find((k) => k.no === "033")!));
caseTest("IT-F05-01-034", カートのケース実行(カートのケース.find((k) => k.no === "034")!));
caseTest("IT-F05-01-035", カートのケース実行(カートのケース.find((k) => k.no === "035")!));

caseTest("IT-F05-01-037", async ({ page, step, expected }) => {
  const purchase = new PurchaseTopPage(page);
  note("商品は、登録せず目玉買取商品・買取特集コーナーに今出ている既存の商品で見た。目玉買取商品はカードに「同名商品検索」が出る商品をカード商品、出ない商品をカード以外と読んだ（カードの詳細IDが付いているかを画面から見分けられるのはこの印だけ）。買取特集コーナーは同名商品検索が出ない作りなので、出ている言語コードの形だけを見た");
  let 目玉: Awaited<ReturnType<PurchaseTopPage["カードを読む"]>> = [];
  let 特集: Awaited<ReturnType<PurchaseTopPage["カードを読む"]>> = [];
  let 強化の見出し = 0;
  await step(1, async () => { await トップを開く(purchase); });
  await step(2, async () => {
    await purchase.区画の描画を待つ(purchase.目玉の区画);
    await purchase.特集の描画を待つ();
    目玉 = await purchase.カードを読む(purchase.カード(purchase.目玉の区画));
    特集 = await purchase.カードを読む(purchase.カード(purchase.特集の枠すべて));
    強化の見出し = (await purchase.見出しの文()).filter((t) => t.includes("強化買取")).length;
    if (強化の見出し === 0) note("ネット買取トップページに、強化買取商品のコーナー（見出し）が無い");
  });
  await expected(async () => {
    const カード商品 = 目玉.filter((c) => c.同名商品検索あり);
    const カード以外 = 目玉.filter((c) => !c.同名商品検索あり);
    expect.soft(カード商品.length, "目玉買取商品に出ているカード商品の数（1件以上）").toBeGreaterThan(0);
    expect.soft(カード以外.length, "目玉買取商品に出ているカード以外の商品の数（1件以上）").toBeGreaterThan(0);
    expect.soft(カード商品.filter((c) => !c.言語ラベル).map((c) => c.商品名), "目玉買取商品で、言語コードが表示されていないカード商品").toEqual([]);
    expect.soft(カード以外.filter((c) => c.言語ラベル).map((c) => c.商品名), "目玉買取商品で、カード言語が表示されているカード以外の商品").toEqual([]);
    expect.soft(特集.filter((c) => c.言語ラベル && !/^[A-Z]{2}$/.test(c.言語ラベル)).map((c) => `${c.商品名}:${c.言語ラベル}`), "買取特集コーナーで、言語コードの形でない表示").toEqual([]);
    expect.soft(強化の見出し, "強化買取商品のコーナー（見出し）の数").toBeGreaterThan(0);
  });
});

caseTest("IT-F05-01-040", async ({ page, notes, step, expected }) => {
  const purchase = new PurchaseTopPage(page);
  const 商品ID = notes.get("〔商品ID-F0501-040〕");
  note(`商品は、登録せず目玉買取商品に今出ている既存の商品（商品ID ${商品ID}）で見た`);
  let 一覧の商品: string[] = [];
  await step(1, async () => { await トップを開く(purchase); await purchase.区画の描画を待つ(purchase.目玉の区画); });
  await step(2, async () => {
    await purchase.押して移る(purchase.目玉のもっと見る.first());
    一覧の商品 = await purchase.一覧の商品IDs();
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "移った先のアドレス（目玉買取商品のタグID 5 の商品一覧）").toMatch(/\/purchase\/search\/tag\/5\/?$/);
    await expect.soft(purchase.ネット買取商品一覧の印, "ネット買取商品一覧の画面").toHaveCount(1);
    expect.soft(一覧の商品.length, "一覧に表示された商品の数（1件以上）").toBeGreaterThan(0);
  });
});

caseTest("IT-F05-01-041", async ({ page, step, expected }) => {
  const purchase = new PurchaseTopPage(page);
  note("「拡大確認商品F0501-041-A」は登録せず、目玉買取商品に今出ている商品画像のある既存の商品の先頭で見た");
  let 名 = "";
  await step(1, async () => { await トップを開く(purchase); await purchase.区画の描画を待つ(purchase.目玉の区画); });
  await step(2, async () => {
    const 一覧 = await purchase.カードを読む(purchase.カード(purchase.目玉の区画));
    const i = 一覧.findIndex((c) => !c.画像なし);
    expect(i, "目玉買取商品に商品画像のある商品がある").toBeGreaterThanOrEqual(0);
    名 = 一覧[i].商品名;
    note(`商品画像を押した商品: 「${名}」`);
    await purchase.画像ボタン(purchase.カード(purchase.目玉の区画).nth(i)).click();
  });
  await expected(async () => {
    await expect.soft(purchase.拡大表示, "画像の拡大表示").toBeVisible();
    await expect.soft(purchase.拡大画像, "拡大画像").toBeVisible();
    expect.soft(await purchase.拡大画像.getAttribute("src"), "拡大画像のアドレス").toBeTruthy();
  });
});

caseTest("IT-F05-01-043", async ({ page, browser, step, expected }) => {
  const purchase = new PurchaseTopPage(page);
  const 店名 = await withAdminSession(browser, SETUP_ADMIN, async (admin) => 店名を読む(admin));
  note(`店名を「ショップF0501-043-A」へ書き換えることは共有の設定の書き換えになるため行わず、いまの店名「${店名}」の見出しが出ないことを見た`);
  let 見出し: string[] = [];
  await step(1, async () => { await トップを開く(purchase); await purchase.区画の描画を待つ(purchase.目玉の区画); });
  await step(2, async () => {
    見出し = await purchase.見出しの文();
    note(`画面の見出し（上から順）: ${見出し.join(" / ")}`);
  });
  await expected(async () => {
    expect.soft(店名, "いまの店名（空でない）").not.toBe("");
    expect.soft(見出し.filter((t) => t === 店名), `店名「${店名}」の見出し`).toEqual([]);
  });
});

// ================================================================ 目玉買取商品・買取特集コーナーに印つきの商品を出すケース

const 枠の名 = (枠: string) => (枠 === 目玉 ? "目玉買取商品枠" : `買取特集コーナーのタグID ${枠} の枠`);

/** 枠の描画を待って商品カードを読む */
async function 枠を読む(ctx: CaseCtx, 枠: string): Promise<カードの内容[]> {
  const purchase = new PurchaseTopPage(ctx.page);
  const 区画 = 枠 === 目玉 ? purchase.目玉の区画 : purchase.特集の枠(枠);
  expect(await purchase.区画の描画を待つ(区画), `${枠の名(枠)}が画面にある`).toBe(true);
  // 枠の見出しが上の固定ヘッダーに隠れないよう、枠の先頭を少し下げて画面に入れる（画像で見出しと商品が読めるように）
  await 区画.first().evaluate((el) => { el.scrollIntoView({ block: "start" }); window.scrollBy(0, -140); });
  const cards = await purchase.カードを読む(purchase.カード(区画));
  note(`${枠の名(枠)}の商品（上から）: ${cards.map((c) => `${c.商品名}（${c.商品ID}・買取${c.買取価格 ?? "—"}）`).join("、") || "なし"}`);
  return cards;
}

/** 出る商品・出ない商品（記号）を、枠の商品カードで確かめる。前提は、除外の確かめが空振りでないための表示対象 */
function 出る出ない(caseNo: string, 枠: string, v: { 出る?: string[]; 出ない?: string[]; 前提?: string[] }) {
  return async (ctx: CaseCtx): Promise<void> => {
    const purchase = new PurchaseTopPage(ctx.page);
    const 品 = (x: string) => f0501索引の商品(caseNo, x);
    let cards: カードの内容[] = [];
    await ctx.step(1, async () => {
      expect(await purchase.開く(), "ネット買取トップページの応答").toBeLessThan(400);
      await expect(purchase.画面の印, "ネット買取トップページの画面").toHaveCount(1);
    });
    await ctx.step(2, async () => { cards = await 枠を読む(ctx, 枠); });
    await ctx.expected(async () => {
      const ids = cards.map((c) => c.商品ID);
      for (const x of v.前提 ?? []) expect.soft(ids.includes(品(x).商品ID), `同じケースの表示対象「${品(x).商品名}」（商品ID ${品(x).商品ID}）が${枠の名(枠)}に表示されている（除外の確かめの前提）`).toBe(true);
      for (const x of v.出る ?? []) expect.soft(ids.includes(品(x).商品ID), `「${品(x).商品名}」（商品ID ${品(x).商品ID}）が${枠の名(枠)}に表示される`).toBe(true);
      for (const x of v.出ない ?? []) expect.soft(ids.includes(品(x).商品ID), `「${品(x).商品名}」（商品ID ${品(x).商品ID}）が${枠の名(枠)}に表示されない`).toBe(false);
    });
  };
}

caseTest("IT-F05-01-010", 出る出ない("010", 特集モダン, { 前提: ["A"], 出ない: ["B", "C", "D", "E"] }));
caseTest("IT-F05-01-022", 出る出ない("022", 目玉, { 出る: ["A", "B", "C"] }));
caseTest("IT-F05-01-023", 出る出ない("023", 目玉, { 前提: ["A", "B", "C"], 出ない: ["D", "E", "F", "G"] }));
caseTest("IT-F05-01-024", 出る出ない("024", 目玉, { 前提: ["A"], 出ない: ["B", "C", "D"] }));
caseTest("IT-F05-01-048", 出る出ない("048", 特集モダン, { 出る: ["A"] }));
caseTest("IT-F05-01-049", 出る出ない("049", 目玉, { 出る: ["A"] }));
caseTest("IT-F05-01-058", 出る出ない("058", 特集モダン, { 出る: ["A"], 出ない: ["B"] }));
caseTest("IT-F05-01-059", 出る出ない("059", 特集モダン, { 出る: ["A"], 出ない: ["B"] }));
caseTest("IT-F05-01-060", 出る出ない("060", 特集モダン, { 出る: ["A"], 出ない: ["B"] }));
caseTest("IT-F05-01-061", 出る出ない("061", 特集モダン, { 出る: ["A"], 出ない: ["B"] }));
caseTest("IT-F05-01-063", 出る出ない("063", 目玉, { 出る: ["A"], 出ない: ["B"] }));
caseTest("IT-F05-01-064", 出る出ない("064", 目玉, { 出る: ["A"], 出ない: ["B"] }));
caseTest("IT-F05-01-065", 出る出ない("065", 目玉, { 出る: ["A"], 出ない: ["B"] }));
caseTest("IT-F05-01-066", 出る出ない("066", 目玉, { 出る: ["A"], 出ない: ["B"] }));
caseTest("IT-F05-01-067", 出る出ない("067", 目玉, { 出る: ["A"], 出ない: ["B"] }));
caseTest("IT-F05-01-068", 出る出ない("068", 目玉, { 出る: ["A"], 出ない: ["B"] }));

caseTest("IT-F05-01-011", async (ctx) => {
  const purchase = new PurchaseTopPage(ctx.page);
  const 並び: Record<string, string[]> = {};
  note(`各カテゴリ（買取特集コーナーのタグID ${特集の6タグ.join("・")} の枠）のコード末尾03・01・04 の商品は、発売日の新しい順が 03・01・04 になるカードセットで作り、優先表示商品の先頭に 03・01・04・02 を置いた`);
  await ctx.step(1, async () => {
    expect(await purchase.開く(), "ネット買取トップページの応答").toBeLessThan(400);
    await expect(purchase.画面の印, "ネット買取トップページの画面").toHaveCount(1);
  });
  await ctx.step(2, async () => { for (const t of 特集の6タグ) 並び[t] = (await 枠を読む(ctx, t)).map((c) => c.商品ID); });
  await ctx.expected(async () => {
    for (const t of 特集の6タグ) {
      const want = ["03", "01", "04"].map((j) => f0501索引の商品("011", `${t}-${j}`).商品ID);
      expect.soft(並び[t].slice(0, 3), `タグID ${t} の枠の商品の並び（先頭から 03・01・04 の商品ID）`).toEqual(want);
    }
  });
});

/** ネット買取トップを開き（手順1）、目玉買取商品枠の商品を読む（手順2） */
function 目玉の一枚(caseNo: string, check: (c: カードの内容 | undefined, 名: string) => void) {
  return async (ctx: CaseCtx): Promise<void> => {
    const purchase = new PurchaseTopPage(ctx.page);
    const A = f0501索引の商品(caseNo, "A");
    let cards: カードの内容[] = [];
    await ctx.step(1, async () => { expect(await purchase.開く(), "ネット買取トップページの応答").toBeLessThan(400); });
    await ctx.step(2, async () => { cards = await 枠を読む(ctx, 目玉); });
    await ctx.expected(async () => {
      const c = cards.find((x) => x.商品ID === A.商品ID);
      expect.soft(c !== undefined, `「${A.商品名}」が目玉買取商品枠に表示される`).toBe(true);
      check(c, A.商品名);
    });
  };
}
caseTest("IT-F05-01-029", 目玉の一枚("029", (c, 名) => { expect.soft(c?.買取価格 ?? null, `「${名}」の買取価格（円）`).toBe(777); }));
caseTest("IT-F05-01-052", 目玉の一枚("052", (c, 名) => { expect.soft(c?.言語ラベル ?? null, `「${名}」のカード言語`).toBe("EN"); }));

caseTest("IT-F05-01-038", async (ctx) => {
  const purchase = new PurchaseTopPage(ctx.page);
  let cards: カードの内容[] = [];
  const A = f0501索引の商品("038", "A");
  const B = f0501索引の商品("038", "B");
  await ctx.step(1, async () => { expect(await purchase.開く(), "ネット買取トップページの応答").toBeLessThan(400); });
  await ctx.step(2, async () => { cards = await 枠を読む(ctx, 目玉); });
  await ctx.expected(async () => {
    const a = cards.find((x) => x.商品ID === A.商品ID);
    const b = cards.find((x) => x.商品ID === B.商品ID);
    expect.soft(a?.同名商品検索あり ?? null, `カード商品「${A.商品名}」に「同名商品検索」が表示される`).toBe(true);
    expect.soft(b !== undefined, `カード以外の「${B.商品名}」が目玉買取商品枠に表示されている（操作部を確かめる前提）`).toBe(true);
    expect.soft(b?.同名商品検索あり ?? null, `カード以外の「${B.商品名}」に「同名商品検索」が表示されない`).toBe(false);
  });
});

caseTest("IT-F05-01-039", async (ctx) => {
  const purchase = new PurchaseTopPage(ctx.page);
  const [A, B, C] = ["A", "B", "C"].map((x) => f0501索引の商品("039", x));
  let ids: string[] = [];
  await ctx.step(1, async () => {
    expect(await purchase.開く(), "ネット買取トップページの応答").toBeLessThan(400);
    await 枠を読む(ctx, 目玉);
  });
  await ctx.step(2, async () => {
    const link = purchase.商品のカード(purchase.目玉の区画, A.商品ID).locator('a[href*="cardId="]').first();
    await expect(link, `「${A.商品名}」の「同名商品検索」`).toBeVisible();
    await purchase.押して移る(link);
    ids = await purchase.一覧の商品IDs();
    const u = new URL(ctx.page.url());
    note(`移った先（${u.pathname}${u.search}）の商品ID: ${ids.join("、") || "なし"}`);
  });
  await ctx.expected(async () => {
    await expect.soft(purchase.ネット買取商品一覧の印, "ネット買取商品一覧画面").toHaveCount(1);
    expect.soft(ids.includes(A.商品ID), `同じカードの「${A.商品名}」が表示される`).toBe(true);
    expect.soft(ids.includes(B.商品ID), `同じカードの「${B.商品名}」が表示される`).toBe(true);
    expect.soft(ids.includes(C.商品ID), `別のカードの「${C.商品名}」が表示されない`).toBe(false);
    // 1ページ目だけを見て「表示されない」と言わないよう、一覧が同じカードの商品だけに絞られていることも見る（同じカードの商品はシードが作った2件だけ）
    expect.soft(ids.filter((id) => id !== A.商品ID && id !== B.商品ID), "一覧に同じカード以外の商品が表示されない（同名商品検索で絞り込まれている）").toEqual([]);
  });
});

caseTest("IT-F05-01-042", async (ctx) => {
  const purchase = new PurchaseTopPage(ctx.page);
  const A = f0501索引の商品("042", "A");
  let c: カードの内容 | undefined;
  await ctx.step(1, async () => { expect(await purchase.開く(), "ネット買取トップページの応答").toBeLessThan(400); });
  await ctx.step(2, async () => { await purchase.目玉の区画.scrollIntoViewIfNeeded(); await 枠を読む(ctx, 目玉); });
  await ctx.step(3, async () => {
    const card = purchase.商品のカード(purchase.目玉の区画, A.商品ID);
    await card.scrollIntoViewIfNeeded().catch(() => undefined);
    c = (await purchase.カードを読む(card))[0];
  });
  await ctx.expected(async () => {
    expect.soft(c !== undefined, `「${A.商品名}」が目玉買取商品枠に表示されている`).toBe(true);
    expect.soft(c?.画像なし ?? null, `「${A.商品名}」の商品画像の位置が、画像なしを表す代替画像`).toBe(true);
  });
});

/** 028・053: 表示を確かめ → DBで商品名を書き換え → 再読み込み */
function 保持(caseNo: string, 前の名: string, 後の名: string, 再読み込みまで: "30秒未満" | "30秒以上") {
  return async (ctx: CaseCtx): Promise<void> => {
    const purchase = new PurchaseTopPage(ctx.page);
    const A = f0501索引の商品(caseNo, "A");
    const 前 = f0501商品名(前の名);
    let t0 = 0;
    let 後: カードの内容[] = [];
    await ctx.step(1, async () => {
      expect(await purchase.開く(), "ネット買取トップページの応答").toBeLessThan(400);
      t0 = Date.now();
      const cards = await 枠を読む(ctx, 目玉);
      expect(cards.find((c) => c.商品ID === A.商品ID)?.商品名, `「${前}」が表示される`).toBe(前);
    });
    await ctx.step(2, async () => {
      const n = 印つきの商品の商品名を書き換える(A.商品ID, 後の名, `IT-F05-01-${caseNo}: 対象商品の商品名を「${後の名}」にする`);
      expect(n, "DBで書き換えた商品の行の数").toBe(1);
      note(`DBで、この実行で作った商品（商品ID ${A.商品ID}・商品コード ${A.商品コード}）の商品名を「${後の名}」に書き換えた`);
    });
    await ctx.step(3, async () => {
      if (再読み込みまで === "30秒以上") {
        const rest = 31_000 - (Date.now() - t0);
        if (rest > 0) await ctx.page.waitForTimeout(rest);
      }
      await ctx.page.reload({ waitUntil: "load" });
      note(`最初の表示から ${Math.round((Date.now() - t0) / 1000)} 秒で再読み込みした`);
      後 = await 枠を読む(ctx, 目玉);
    });
    await ctx.expected(async () => {
      const names = 後.map((c) => c.商品名);
      if (再読み込みまで === "30秒未満") {
        expect.soft(names.includes(前), `再読み込み後も「${前}」が表示される`).toBe(true);
        expect.soft(names.includes(後の名), `「${後の名}」が表示されない`).toBe(false);
      } else {
        expect.soft(names.includes(後の名), `再読み込み後に「${後の名}」が表示される`).toBe(true);
        expect.soft(names.includes(前), `「${前}」が表示されない`).toBe(false);
      }
    });
  };
}
caseTest("IT-F05-01-028", async (ctx) => {
  const { expected } = ctx;
  // 目玉買取商品の枠は外部の検索サービスの索引から描かれる。DB の商品名を書き換えても、検索サービスへフィードを送るまで索引は変わらない。
  // そのため、書き換えたあと30秒未満で再読み込みして旧名が出ても、「30秒の保持（抽出結果のキャッシュ）」のせいなのか、索引が変わっていないだけなのか区別できない
  // （30秒を過ぎても旧名のままになりうる）。フィードを送って索引を更新する方法は、反映待ちに30秒以上かかり、30秒未満の再読み込みと両立しない。
  // 正本の意図（30秒保持）を正しく確かめられる方法が決まるまで、合否を出さずに止める（合格にしない）。対になる 053 と一緒に決め直す。
  note("未判定で止めた: 目玉の枠は検索サービスの索引から描かれ、DB の商品名の書き換えでは30秒保持（キャッシュ）の確かめにならない（旧名が出ても保持のためとは言えない）。確かめ方が決まるまで実施しない");
  const 確かめ方が決まっている = false as boolean;
  if (!確かめ方が決まっている) throw new Error("IT-F05-01-028 は確かめ方が決まるまで未判定で止める（目玉の枠は検索サービスの索引から描かれ、DB の書き換えでは30秒保持を確かめられない）");
  await 保持("028", "キャッシュ更新前商品-028", "キャッシュ更新後商品", "30秒未満")(ctx); // 旧: DB の書き換えで確かめていた形（合否の根拠にならない）
  await expected(async () => { expect(確かめ方が決まっている, "30秒保持の確かめ方が決まっている").toBe(true); });
});
caseTest("IT-F05-01-053", 保持("053", "保持中商品-053", "保持終了後商品-053", "30秒以上"));
