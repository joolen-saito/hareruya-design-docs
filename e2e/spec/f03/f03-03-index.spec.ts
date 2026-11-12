/**
 * F03-03 商品詳細検索のうち、検索サービスの索引に載せた商品で検索結果を確かめるケース（006〜010・018〜021・023・024・031・035）。
 * 正本: cases/F03-03_test_cases.tsv。シード: seeds/f03-03-index.ts（索引用の商品をまとめて作り、フィードを1回送って反映を待つ）。
 *
 * 画面に合わせて読んだこと（手順の注記に残す）:
 * - 正本の値（商品名・商品コード）には実行の印が付いている。検索に入れる商品名も印つきの値。
 * - モーダルの Foil の選択肢は「なし・Foil・特殊」。正本の「通常」は、シード表どおり画面の「なし」（Foil でないもの）として選ぶ。
 * - モーダルの言語の選択肢は「JP・EN・Other」。正本の日本語・英語・それ以外を、この順に当てた。マナ・コストの「7以上」は画面の「7+」。
 * - 2回目以降の検索で、前の検索の選択がモーダルに残っているときは、その項目の選択を外してから正本の値を選ぶ（正本の「〜を選択して検索」を、その値だけで検索することとして読んだ）。
 */
import { test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { FrontDetailSearch } from "../../pages/front/f03_03_detail_search";
import { FrontProductList } from "../../pages/front/f03_01_product_list";
import { 共有マスタ } from "../../seeds/f03-03";
import { F0303の商品ID } from "../../seeds/f03-03-index";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 並べる = (ids: string[]) => [...ids].sort();

/** 事前準備: 店の商品一覧を、保存済み検索条件なし・モーダルが閉じた状態で開く */
async function 一覧を開く(search: FrontDetailSearch, shop = "/ja"): Promise<void> {
  await search.openProductList(shop);
  expect(await search.モーダルが開いている(), "開始時に商品詳細検索モーダルが閉じている").toBe(false);
}

/** 商品一覧の「詳細検索」を押して、モーダルが開くのを待つ */
async function 詳細検索を押す(search: FrontDetailSearch): Promise<void> {
  const 押したもの = await search.詳細検索を押す();
  if (押したもの !== "商品一覧の詳細検索ボタン") note("固定のヘッダーが商品一覧の中の「詳細検索」ボタンを覆って押せなかったため、画面上部の「詳細検索」ボタンを押した");
  await expect(search.モーダル, "商品詳細検索モーダル（開いた状態）").toHaveClass(/is-visible/);
}

/** モーダルの検索ボタンを押し、検索結果の商品（本表示のカード）の商品IDを読む */
async function 検索して読む(search: FrontDetailSearch, list: FrontProductList): Promise<string[]> {
  await search.検索する();
  await list.結果を待つ();
  return (await list.カードを読む()).map((c) => c.商品ID);
}

/** 項目の前の選択を外してから、正本の値だけを選ぶ */
async function だけを選ぶ(search: FrontDetailSearch, 見出し: string, 表示名: string): Promise<void> {
  const 外した = (await search.選択を外す(見出し)).filter((x) => x !== 表示名);
  if (外した.length) note(`「${見出し}」に前の検索の選択（${外した.join("・")}）が残っていたので外してから「${表示名}」を選んだ`);
  await search.選択肢を選ぶ(見出し, 表示名);
}

const ID = (seedId: string, ...codes: string[]) => 並べる(codes.map((c) => F0303の商品ID(seedId, c)));

caseTest("IT-F03-03-006", async ({ page, notes, step, expected }) => {
  const search = new FrontDetailSearch(page);
  const list = new FrontProductList(page);
  const 名 = rc("F0303店舗確認-006");
  let 本店: { 商品ID: string; href: string }[] = [];
  let 大阪: { 商品ID: string; href: string }[] = [];
  await 一覧を開く(search, "/ja");
  await step(1, async () => { await 詳細検索を押す(search); });
  await step(2, async () => {
    await search.商品名の入力欄.fill(名);
    await search.検索する();
    await list.結果を待つ();
    本店 = await list.カードのリンク先();
  });
  await step(3, async () => {
    await search.openProductList("/ja/osaka");
    await 詳細検索を押す(search);
  });
  await step(4, async () => {
    await search.商品名の入力欄.fill(名);
    await search.検索する();
    await list.結果を待つ();
    大阪 = await list.カードのリンク先();
  });
  await expected(async () => {
    const host = new URL(BASE_URL).host;
    note(`正本のドメイン www.hareruyamtg.com は、この試験環境の公開側のドメイン（${host}）として確かめた`);
    expect.soft(本店.map((x) => x.商品ID), "本店の検索結果は本店公開の商品HQ-001-006だけ").toEqual([notes.get("〔商品ID-F0303-006A〕")]);
    expect.soft(本店.map((x) => `${new URL(x.href).host}${new URL(x.href).pathname}`).every((h) => h.startsWith(`${host}/ja/products/detail/`)), `本店の商品のリンク先が ${host} の /ja/ 配下（支店の /ja/osaka/ でない）`).toBe(true);
    expect.soft(大阪.map((x) => x.商品ID), "TC大阪支店の検索結果は大阪公開の商品OSA-001-006だけ").toEqual([notes.get("〔商品ID-F0303-006B〕")]);
    expect.soft(大阪.map((x) => `${new URL(x.href).host}${new URL(x.href).pathname}`).every((h) => h.startsWith(`${host}/ja/osaka/products/detail/`)), `TC大阪支店の商品のリンク先が同じドメインの /ja/osaka/ 配下`).toBe(true);
  });
});

caseTest("IT-F03-03-007", async ({ page, notes, step, expected }) => {
  const search = new FrontDetailSearch(page);
  const list = new FrontProductList(page);
  let 結果: string[] = [];
  await 一覧を開く(search);
  await step(1, async () => { await 詳細検索を押す(search); });
  await step(2, async () => {
    await search.商品名の入力欄.fill(rc("F0303-ALL-007"));
    await search.カテゴリを選ぶ(0, 共有マスタ.表示対象親カテゴリ);
    await search.カテゴリを選ぶ(1, 共有マスタ.表示対象カテゴリ);
    await search.選択肢を選ぶ("色", "赤");
    await search.選択肢を選ぶ("マナ・コスト", "3");
    await search.選択肢を選ぶ("カードタイプ", 共有マスタ.クリーチャー);
    await search.選択欄で選ぶ(search.サブタイプの選択欄, 共有マスタ.サブタイプA日, "サブタイプ");
    await search.選択肢を選ぶ("フォーマット", 共有マスタ.フォーマット10);
    await search.選択肢を選ぶ("言語", "JP");
    await search.選択肢を選ぶ("レアリティ", "神話レア");
    await search.選択肢を選ぶ("Foil", "特殊");
    await search.選択肢を選ぶ("フレーム", "特殊");
    await search.選択欄で選ぶ(search.イラストレーターの選択欄, 共有マスタ.イラストレーターA, "イラストレーター");
    await search.選択肢を選ぶ("在庫", "在庫ありのみ");
    const 価格 = search.価格の選択欄();
    await search.選択欄で選ぶ(価格.from, "100", "価格(From)");
    await search.選択欄で選ぶ(価格.to, "200", "価格(To)");
    note("カテゴリは「表示対象親カテゴリ」＞「表示対象カテゴリ」の順に選んだ。カラーはモーダルの「色」、言語の日本語は「JP」");
  });
  await step(3, async () => { 結果 = await 検索して読む(search, list); });
  await expected(async () => {
    expect(結果, "すべての条件を持つ商品DETAIL-ALL-007だけが検索結果に出る（1項目だけ違う14商品は出ない）").toEqual([notes.get("〔商品ID-F0303-007A〕")]);
  });
});

/** 008・009・020: 同じ商品名で、1つの項目の値を替えて順に検索する */
function 値を替えて検索(o: { seedId: string; 商品名: string; 見出し: string; 組: { 表示名: string; 正本: string; 商品コード: string[] }[] }) {
  return async ({ page, step, expected }: CaseCtx) => {
    const search = new FrontDetailSearch(page);
    const list = new FrontProductList(page);
    const 結果: string[][] = [];
    await 一覧を開く(search);
    for (let i = 0; i < o.組.length; i++) {
      await step(i + 1, async () => {
        await 詳細検索を押す(search);
        await search.商品名の入力欄.fill(rc(o.商品名));
        await だけを選ぶ(search, o.見出し, o.組[i].表示名);
        if (o.組[i].表示名 !== o.組[i].正本) note(`${o.見出し}の正本の「${o.組[i].正本}」は、画面の選択肢の「${o.組[i].表示名}」を選んだ`);
        結果.push(並べる(await 検索して読む(search, list)));
      });
    }
    await expected(async () => {
      o.組.forEach((g, i) => {
        expect.soft(結果[i], `${o.見出し}「${g.正本}」の検索結果は ${g.商品コード.join("・")} だけ`).toEqual(ID(o.seedId, ...g.商品コード));
      });
    });
  };
}

caseTest("IT-F03-03-008", 値を替えて検索({
  seedId: "S-F03-03-FOIL-FRAME-008", 商品名: "F0303-FOIL-008", 見出し: "Foil",
  組: [
    { 表示名: "なし", 正本: "通常", 商品コード: ["FOIL-NORMAL-008"] },
    { 表示名: "Foil", 正本: "Foil", 商品コード: ["FOIL-FOIL-008"] },
    { 表示名: "特殊", 正本: "特殊", 商品コード: ["FOIL-SPECIAL-008"] },
  ],
}));

caseTest("IT-F03-03-009", 値を替えて検索({
  seedId: "S-F03-03-FOIL-FRAME-009", 商品名: "F0303-FRAME-009", 見出し: "フレーム",
  組: [
    { 表示名: "通常", 正本: "通常", 商品コード: ["FRAME-NORMAL-009"] },
    { 表示名: "特殊", 正本: "特殊", 商品コード: ["FRAME-SPECIAL-009"] },
  ],
}));

caseTest("IT-F03-03-020", 値を替えて検索({
  seedId: "S-F03-03-MANA-LANG-020", 商品名: "F0303-LANG-020", 見出し: "言語",
  組: [
    { 表示名: "JP", 正本: "日本語", 商品コード: ["LANG-JP-020"] },
    { 表示名: "EN", 正本: "英語", 商品コード: ["LANG-EN-020"] },
    { 表示名: "Other", 正本: "それ以外", 商品コード: ["LANG-FR-020"] },
  ],
}));

/** 010・035: 固有色を選んで検索する */
function 固有色で検索(o: { seedId: string; 商品名: string; 色: string[]; 出る: string[]; 出ない: string[] }) {
  return async ({ page, step, expected }: CaseCtx) => {
    const search = new FrontDetailSearch(page);
    const list = new FrontProductList(page);
    let 結果: string[] = [];
    await 一覧を開く(search);
    await step(1, async () => { await 詳細検索を押す(search); });
    await step(2, async () => {
      await search.商品名の入力欄.fill(rc(o.商品名));
      for (const c of o.色) await search.選択肢を選ぶ("固有色", c);
      結果 = 並べる(await 検索して読む(search, list));
    });
    await expected(async () => {
      expect.soft(結果, `固有色 ${o.色.join("・")} の検索結果は ${o.出る.join("・")}`).toEqual(ID(o.seedId, ...o.出る));
      for (const c of o.出ない) expect.soft(結果, `選ばなかった色を含む ${c} は出ない`).not.toContain(F0303の商品ID(o.seedId, c));
    });
  };
}

caseTest("IT-F03-03-010", 固有色で検索({ seedId: "S-F03-03-COLOR-TYPE-010", 商品名: "F0303-IDENTITY-010", 色: ["白"], 出る: ["IDENTITY-W-010"], 出ない: ["IDENTITY-WU-010", "IDENTITY-U-010"] }));

caseTest("IT-F03-03-035", 固有色で検索({ seedId: "S-F03-03-COLOR-MULTI-035", 商品名: "F0303-035-MULTI", 色: ["白", "青"], 出る: ["F0303-035-W", "F0303-035-WU", "F0303-035-U"], 出ない: ["F0303-035-WR"] }));

caseTest("IT-F03-03-018", async ({ page, step, expected, capture }) => {
  const search = new FrontDetailSearch(page);
  const 名 = rc("F0303-SUGGEST-ALPHA-018");
  let 候補: string[] = [];
  await 一覧を開く(search);
  await step(1, async () => { await 詳細検索を押す(search); });
  await step(2, async () => {
    await search.商品名の入力欄.click();
    await search.商品名の入力欄.pressSequentially("F0303-SUG", { delay: 80 });
    // 候補は入力のあと検索サービスへ問い合わせて出るので、出るまで（最大20秒）待つ
    for (let t = 0; t < 40 && (候補 = await search.候補の文()).length === 0; t++) await page.waitForTimeout(500);
    await capture("入力後の候補");
    note(`入力は正本どおり「F0303-SUG」。この実行の商品名は印つきの「${名}」なので、候補の中にこの名前があるかを見た`);
  });
  await expected(async () => {
    expect(候補.some((t) => t.includes(名)), `ユニサジェストの候補に商品「F0303-SUGGEST-ALPHA-018」（${名}）がある（候補: ${候補.join(" / ") || "なし"}）`).toBe(true);
  });
});

caseTest("IT-F03-03-019", async ({ page, step, expected }) => {
  const search = new FrontDetailSearch(page);
  const list = new FrontProductList(page);
  const seedId = "S-F03-03-MANA-LANG-019";
  const 結果 = new Map<string, string[]>();
  await 一覧を開く(search);
  await step(1, async () => {
    for (let n = 0; n <= 6; n++) {
      await 詳細検索を押す(search);
      await search.商品名の入力欄.fill(rc("F0303-MANA-019"));
      await だけを選ぶ(search, "マナ・コスト", String(n));
      結果.set(String(n), 並べる(await 検索して読む(search, list)));
    }
  });
  await step(2, async () => {
    await 詳細検索を押す(search);
    await search.商品名の入力欄.fill(rc("F0303-MANA-019"));
    await だけを選ぶ(search, "マナ・コスト", "7+");
    note("マナ・コストの「7以上」は、画面の選択肢の「7+」を選んだ");
    結果.set("7+", 並べる(await 検索して読む(search, list)));
  });
  await expected(async () => {
    for (let n = 0; n <= 6; n++) expect.soft(結果.get(String(n)), `マナ・コスト ${n} の検索結果は MANA-${n}-019 の1商品だけ`).toEqual(ID(seedId, `MANA-${n}-019`));
    expect.soft(結果.get("7+"), "マナ・コスト 7以上の検索結果は MANA-7-019 と MANA-8-019").toEqual(ID(seedId, "MANA-7-019", "MANA-8-019"));
  });
});

caseTest("IT-F03-03-021", async ({ page, step, expected }) => {
  const search = new FrontDetailSearch(page);
  const list = new FrontProductList(page);
  const seedId = "S-F03-03-STOCK-RULE-021";
  let 指定なし: string[] = [];
  let 在庫あり: string[] = [];
  await 一覧を開く(search);
  await step(1, async () => {
    await 詳細検索を押す(search);
    await search.商品名の入力欄.fill(rc("F0303-STOCK-021"));
    指定なし = 並べる(await 検索して読む(search, list));
  });
  await step(2, async () => {
    await 詳細検索を押す(search);
    await search.商品名の入力欄.fill(rc("F0303-STOCK-021"));
    await search.選択肢を選ぶ("在庫", "在庫ありのみ");
    在庫あり = 並べる(await 検索して読む(search, list));
  });
  await expected(async () => {
    expect.soft(指定なし, "在庫を指定しない検索結果は STOCK-IN-021 と STOCK-OUT-021").toEqual(ID(seedId, "STOCK-IN-021", "STOCK-OUT-021"));
    expect.soft(在庫あり, "「在庫ありのみ」の検索結果は STOCK-IN-021 だけ").toEqual(ID(seedId, "STOCK-IN-021"));
  });
});

caseTest("IT-F03-03-023", async ({ page, step, expected }) => {
  const search = new FrontDetailSearch(page);
  const list = new FrontProductList(page);
  const seedId = "S-F03-03-STOCK-RULE-023";
  let 未選択: string[] = [];
  let 選択: string[] = [];
  await 一覧を開く(search);
  await step(1, async () => {
    await 詳細検索を押す(search);
    await search.商品名の入力欄.fill(rc("F0303-BAN-023"));
    未選択 = 並べる(await 検索して読む(search, list));
  });
  await step(2, async () => {
    await 詳細検索を押す(search);
    await search.商品名の入力欄.fill(rc("F0303-BAN-023"));
    await search.禁止カードも表示する.scrollIntoViewIfNeeded();
    await search.禁止カードも表示する.click();
    await expect(search.禁止カードも表示する.locator("input"), "「禁止カードも表示する」が選ばれた").toBeChecked();
    選択 = 並べる(await 検索して読む(search, list));
  });
  await expected(async () => {
    expect.soft(未選択, "「禁止カードも表示する」を選ばない検索結果は BAN-REGULAR-023 だけ").toEqual(ID(seedId, "BAN-REGULAR-023"));
    expect.soft(選択, "「禁止カードも表示する」を選んだ検索結果は BAN-REGULAR-023 と BAN-PROHIBITED-023").toEqual(ID(seedId, "BAN-REGULAR-023", "BAN-PROHIBITED-023"));
  });
});

caseTest("IT-F03-03-024", async ({ page, notes, step, expected }) => {
  const search = new FrontDetailSearch(page);
  const list = new FrontProductList(page);
  const seedId = "S-F03-03-CARRY-024";
  let 結果: string[] = [];
  await step(1, async () => {
    const タグID = notes.get("〔タグID-F0303-024〕");
    expect(await search.画面を開く(`/ja/products/search/tags/${タグID}?saleFlg=1`), "タグとセールで絞り込んだ商品一覧の応答").toBeLessThan(400);
    await list.結果を待つ();
    note(`タグ T-F0303-024（タグID ${タグID}）はアドレスのパス、セールは商品一覧のセールの絞り込み（アドレスの引数）で絞り込んで開いた`);
  });
  await step(2, async () => { await 詳細検索を押す(search); });
  await step(3, async () => {
    await search.商品名の入力欄.fill(rc("F0303-PRESERVE-024"));
    結果 = 並べる(await 検索して読む(search, list));
  });
  await expected(async () => {
    expect(結果, "タグとセールの両方を持つ PRESERVE-BOTH-024 だけが出る（タグだけ・セールだけの商品は出ない）").toEqual(ID(seedId, "PRESERVE-BOTH-024"));
  });
});

caseTest("IT-F03-03-031", async ({ page, step, expected }) => {
  const search = new FrontDetailSearch(page);
  const list = new FrontProductList(page);
  const seedId = "S-F03-03-PRICE-031";
  let 結果: string[] = [];
  await 一覧を開く(search);
  await step(1, async () => { await 詳細検索を押す(search); });
  await step(2, async () => {
    await search.商品名の入力欄.fill(rc("F0303-031-PRICE"));
    await search.選択欄で選ぶ(search.価格の選択欄().from, "100", "価格(From)");
    expect(await search.価格の選択欄().to.inputValue(), "価格(To)は未指定のまま（画面の表示は「指定なし」）").toBe("");
  });
  await step(3, async () => { 結果 = 並べる(await 検索して読む(search, list)); });
  await expected(async () => {
    expect.soft(結果, "価格150円の F0303-031-MID と価格300円の F0303-031-HIGH の2件").toEqual(ID(seedId, "F0303-031-MID", "F0303-031-HIGH"));
    expect.soft(結果, "価格50円の F0303-031-LOW は出ない").not.toContain(F0303の商品ID(seedId, "F0303-031-LOW"));
  });
});
