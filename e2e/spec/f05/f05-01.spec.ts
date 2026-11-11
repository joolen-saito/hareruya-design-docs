/**
 * F05-01 ネット買取トップページ（フロント）。正本: cases/F05-01_test_cases.tsv
 *
 * 実装したのは、次の28件。
 * - 画面だけで準備できる 001・002・003・004・019・020・021・044・045・046。
 * - 既存データへの読み替え（依頼者の方針 2026-11-10）: 009・012・013〜018・030・031〜035・037・040・041・043。
 *   買取特集コーナー・目玉買取商品の商品は外部の検索サービスの索引から描かれ、画面で作った商品がすぐに出ないので、商品を登録せず、
 *   今ネット買取トップページに出ている既存の商品を使う（シードがその商品ID・規格IDを呼び名に控える）。
 * ほかのケースは実装しない（理由は報告）: 強化買取商品のコーナーが画面に無い、対象商品・優先表示商品が共有のタグの書き換えになる、
 * 商品を1件だけ・特定の状態で出す前提が索引の制約で作れない、DBで商品名を書き換えて索引の保持期間を見るケース など。
 */
import { Locator, test } from "@playwright/test";
import { SETUP_ADMIN } from "../../config/env";
import { expect, caseTest, CaseBody } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { withAdminSession } from "../../lib/session";
import { まとめて買取商品IDを設定する, 店名を読む } from "../../pages/admin/f05_01_setup";
import { BranchTopPage } from "../../pages/front/f01_02_branch";
import { 入口 } from "../../pages/front/f03_04_category_list";
import { NetBuyCartPage } from "../../pages/front/f05_04_net_detail";
import { PurchaseTopPage, ツリーの項目 } from "../../pages/front/f05_01_purchase_top";
import { F0501_まとめて買取商品 } from "../../seeds/f05-01";

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
    数 = await top.link("高額買取はこちら").count();
  });
  await step(2, async () => {
    if (数 === 0) note("支店ECTOPに「高額買取はこちら」のリンクが無い");
    await purchase.押して移る(top.link("高額買取はこちら").first());
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
  // 事前準備②: 開始時にまとめて買取商品IDを設定する（S-F05-01-BULK-SETTING）
  await withAdminSession(browser, SETUP_ADMIN, async (admin) => {
    for (const w of await まとめて買取商品IDを設定する(admin, 商品ID)) note(`まとめて買取商品IDの登録の警告「${w}」`);
  });
  note(`事前準備: 追加システム設定のまとめて買取商品IDを ${商品ID} にした（元に戻さない。シード表に戻す操作が無い）`);
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
  note("商品は、登録せず買取特集コーナーに今出ている既存の商品で見た。各カテゴリは、枠の「もっと見る」のリンク先のタグIDで見分けた（画面の見出しの文言は設計書・正本の呼び名と違うことがあるため、見出しは注記に残す）");
  let 枠: { タグID: string; 見出し: string }[] = [];
  const 商品数: Record<string, number> = {};
  await step(1, async () => { await トップを開く(purchase); });
  await step(2, async () => {
    await purchase.特集の描画を待つ();
    枠 = await purchase.特集の枠の一覧();
    for (const { タグID } of 枠) 商品数[タグID] = (await purchase.カードを読む(purchase.カード(purchase.特集の枠(タグID)))).length;
    note(`買取特集コーナーの枠（上から順）: ${枠.map((w) => `${w.見出し}（タグID ${w.タグID}・商品 ${商品数[w.タグID]}件）`).join("、")}`);
  });
  await expected(async () => {
    expect.soft(枠.map((w) => w.タグID), "買取特集コーナーの枠のタグID（画面の並び）").toEqual(expect.arrayContaining(特集のタグ順));
    for (const id of 特集のタグ順) expect.soft(商品数[id] ?? 0, `タグID ${id} のカテゴリに表示された商品の数（1件以上）`).toBeGreaterThan(0);
  });
});

caseTest("IT-F05-01-012", async ({ page, step, expected }) => {
  const purchase = new PurchaseTopPage(page);
  note("商品は、登録せず買取特集コーナーに今出ている既存の商品で見た（各タグに4件以上ある既存データが前提）");
  const 商品数: Record<string, number> = {};
  await step(1, async () => { await トップを開く(purchase); });
  await step(2, async () => {
    await purchase.特集の描画を待つ();
    for (const id of 特集のタグ順) 商品数[id] = (await purchase.カードを読む(purchase.カード(purchase.特集の枠(id)))).length;
  });
  await expected(async () => {
    for (const id of 特集のタグ順) expect.soft(商品数[id], `タグID ${id} のカテゴリに表示された商品の数`).toBe(3);
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
  note(`買取価格499円・500円の商品は登録せず、目玉買取商品に今出ている既存の商品で見た（500円未満の商品ID ${A}・500円以上の商品ID ${B}）`);
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
    expect.soft(内容A[0]?.買取価格, "500円未満の商品の買取価格").toBeLessThan(500);
    expect.soft(内容B[0]?.買取価格, "500円以上の商品の買取価格").toBeGreaterThanOrEqual(500);
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
    カートの数量 = await cart.数量(商品ID);
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
