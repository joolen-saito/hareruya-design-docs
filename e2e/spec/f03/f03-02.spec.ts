/** F03-02 商品詳細（フロント）。正本: cases/F03-02_test_cases.tsv */
import { Dialog, Page, Response, test } from "@playwright/test";
import { SETUP_ADMIN } from "../../config/env";
import { 規格の依頼件数, 有効な依頼件数 } from "../../db/f03_07";
import { CaseBody, caseTest, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { withAdminSession } from "../../lib/session";
import { expectNoProductWithId } from "../../pages/admin/m03_30_products";
import { 閲覧履歴のCookie } from "../../pages/front/f03_06_recent";
import { FrontRestock, 押した結果 } from "../../pages/front/f03_07_restock_notify";
import { FrontCart, FrontDetail, 店 } from "../../pages/front/f03_02_detail";
import { memberOf } from "../../seeds/f03-02";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
/** 正本の外の補い（合否が補いの上に成り立つ。記録で条件付きに分ける） */
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const status = (r: Response | null) => r?.status() ?? 0;

/** 開いた画面の応答と商品名の見出し */
type 開いた結果 = { 応答: number; 商品名: string };
async function 開く(d: FrontDetail, 入口: string, 商品ID: string, query: Record<string, string> = {}): Promise<開いた結果> {
  const res = await d.open(入口, 商品ID, query);
  const got = { 応答: status(res), 商品名: await d.商品名の文() };
  note(`${入口}/products/detail/${商品ID} を開いた: 応答 ${got.応答}・商品名の見出し「${got.商品名}」`);
  return got;
}

// 商品詳細が表示されたこと＝応答が成功・商品名の見出しがその商品名。
// 表示されないこと＝商品名の見出しが出ない。画面の誤り（500番台）で表示されないのは確かめにならないので、応答が500未満であることも見る。

// ---- 表示されること・されないこと（商品IDを指定して開く） ----

function 公開制御(a: { 入口: string; 商品ID: string; 商品名: string; 表示: boolean; what: string }): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const d = new FrontDetail(page);
    let got: 開いた結果 = { 応答: 0, 商品名: "" };
    await step(1, async () => { got = await 開く(d, a.入口, notes.get(a.商品ID)); });
    await expected(async () => {
      const name = rc(a.商品名);
      if (a.表示) {
        expect.soft(got.応答, `${a.what}: 商品詳細画面の応答`).toBe(200);
        expect.soft(got.商品名, `${a.what}: 商品名の見出し`).toBe(name);
      } else {
        expect.soft(got.商品名, `${a.what}: 商品名の見出し（表示されない）`).not.toBe(name);
        expect.soft(got.応答, `${a.what}: 応答が画面の誤り（500番台）でない`).toBeLessThan(500);
        expect.soft(got.応答, `${a.what}: 応答が返った`).toBeGreaterThan(0);
      }
    });
  };
}

caseTest("IT-F03-02-003", 公開制御({ 入口: 店.TC大阪支店, 商品ID: "〔商品ID-F0302-共有-BRANCH-HIDDEN〕", 商品名: "支店非公開カード", 表示: false, what: "TC大阪支店" }));
caseTest("IT-F03-02-132", 公開制御({ 入口: 店.本店, 商品ID: "〔商品ID-F0302-132〕", 商品名: "公開制御サプライ F0302-CB132-A", 表示: true, what: "本店" }));
caseTest("IT-F03-02-133", 公開制御({ 入口: 店.本店, 商品ID: "〔商品ID-F0302-133〕", 商品名: "公開制御サプライ F0302-CB133-A", 表示: false, what: "本店" }));
caseTest("IT-F03-02-134", 公開制御({ 入口: 店.TC大阪支店, 商品ID: "〔商品ID-F0302-134〕", 商品名: "公開制御サプライ F0302-CB134-A", 表示: false, what: "TC大阪支店" }));
caseTest("IT-F03-02-135", 公開制御({ 入口: 店.TC大阪支店, 商品ID: "〔商品ID-F0302-135〕", 商品名: "公開制御サプライ F0302-CB135-A", 表示: true, what: "TC大阪支店" }));
caseTest("IT-F03-02-136", 公開制御({ 入口: 店.本店, 商品ID: "〔商品ID-F0302-136〕", 商品名: "公開制御サプライ F0302-CB136-A", 表示: false, what: "本店" }));

caseTest("IT-F03-02-028", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  let got: 開いた結果 = { 応答: 0, 商品名: "" };
  await step(1, async () => {
    // 販売制限は「日本国内のみ」（表示言語は日本語）。対象地域となる表示言語＝日本語版で開く
    note("販売制限の対象地域となる表示言語は、シードの販売制限（日本国内のみ・表示言語は日本語）から日本語と読み、日本語版（/ja）で開いた");
    got = await 開く(d, 店.本店, notes.get("〔商品ID-F0302-共有-REGION-LIMIT〕"));
  });
  await expected(async () => {
    expect.soft(got.応答, "日本語版の本店: 商品詳細画面の応答").toBe(200);
    expect.soft(got.商品名, "日本語版の本店: 商品名の見出し").toBe(rc("地域制限カード"));
  });
});

function 販売制限(a: { 商品ID: string; 商品名: string; 入口: string; 言語: string; what: string }): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const d = new FrontDetail(page);
    // 事前準備「ブラウザのロケールを英語／日本語にする」: ブラウザが送る言語の指定を変える
    await page.setExtraHTTPHeaders({ "Accept-Language": a.言語 });
    note(`ブラウザのロケールは、ブラウザが送る言語の指定（Accept-Language: ${a.言語}）で設定した`);
    let got: 開いた結果 = { 応答: 0, 商品名: "" };
    await step(1, async () => { got = await 開く(d, a.入口, notes.get(a.商品ID)); });
    await expected(async () => {
      expect.soft(got.応答, `${a.what}: 商品詳細画面の応答`).toBe(200);
      expect.soft(got.商品名, `${a.what}: 商品名の見出し`).toBe(rc(a.商品名));
    });
  };
}
caseTest("IT-F03-02-081", 販売制限({ 商品ID: "〔商品ID-F0302-081〕", 商品名: "国内限定カード F0302-081-A", 入口: 店.本店英語版, 言語: "en-US,en", what: "英語版の本店" }));
caseTest("IT-F03-02-082", 販売制限({ 商品ID: "〔商品ID-F0302-082〕", 商品名: "海外限定カード F0302-082-A", 入口: 店.本店, 言語: "ja-JP,ja", what: "日本語版の本店" }));

caseTest("IT-F03-02-116", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  const id = notes.get("〔商品ID-F0302-116〕");
  let hq: 開いた結果 = { 応答: 0, 商品名: "" };
  let branch: 開いた結果 = { 応答: 0, 商品名: "" };
  await step(1, async () => { hq = await 開く(d, 店.本店, id); });
  await step(2, async () => { branch = await 開く(d, 店.TC大阪支店, id); });
  await expected(async () => {
    const name = rc("本店非公開支店公開カード F0302-116-A");
    expect.soft(hq.商品名, "本店: 商品名の見出し（表示されない）").not.toBe(name);
    expect.soft(hq.応答, "本店: 応答が画面の誤り（500番台）でない").toBeLessThan(500);
    expect.soft(hq.応答, "本店: 応答が返った").toBeGreaterThan(0);
    expect.soft(branch.応答, "TC大阪支店: 商品詳細画面の応答").toBe(200);
    expect.soft(branch.商品名, "TC大阪支店: 商品名の見出し").toBe(name);
  });
});

caseTest("IT-F03-02-073", async ({ page, browser, step, expected }) => {
  // 事前準備②: 商品ID 999999999 の商品が無いことを管理画面で確かめる（あれば止める。DBは書き換えない）
  await withAdminSession(browser, SETUP_ADMIN, (admin) => expectNoProductWithId(admin, "999999999", "事前準備"));
  note("事前準備の「商品ID 999999999の登録を削除」は、管理画面の商品マスターで商品ID 999999999 の商品が無いことを確かめた（削除するものが無い）");
  const d = new FrontDetail(page);
  let res: Response | null = null;
  let 応答 = 0;
  await step(1, async () => { res = await d.open(店.本店, "999999999"); });
  await step(2, async () => {
    // 開発者ツールのネットワーク欄にあたる、商品詳細画面の要求の応答
    応答 = status(res);
    note(`商品詳細画面の要求の応答: ${応答}`);
  });
  await expected(async () => { expect(応答, "商品ID 999999999 の商品詳細画面の HTTP ステータス").toBe(404); });
});

// ---- 表示される部品・されない部品 ----

/** 商品詳細を開き、商品名の見出しが出たことを確かめる（「表示されない」を数える前に、画面が出ていることを確かめる） */
async function 開いて確かめる(d: FrontDetail, 入口: string, 商品ID: string, 商品名: string, query: Record<string, string> = {}): Promise<void> {
  const got = await 開く(d, 入口, 商品ID, query);
  expect(got.商品名, "商品詳細画面が表示された（商品名の見出し）").toBe(rc(商品名));
}

caseTest("IT-F03-02-010", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  await step(1, async () => { await 開いて確かめる(d, 店.本店, notes.get("〔商品ID-F0302-共有-SUPPLY〕"), "結合試験サプライ"); });
  await expected(async () => {
    expect.soft(d.言語切替, "カード専用の言語切替").toHaveCount(0);
    expect.soft(d.状態の列, "状態の欄").toHaveCount(0);
    expect.soft(d.まとめて入荷通知, "まとめて入荷通知").toHaveCount(0);
    expect.soft(d.使われているデッキのボタン, "使われているデッキのボタン").toHaveCount(0);
    expect.soft(d.デッキの欄, "使われているデッキの欄").toHaveCount(0);
    expect.soft(d.他のバージョンのボタン, "他のバージョンのボタン").toHaveCount(0);
    expect.soft(d.他のバージョンの欄, "他のバージョンの欄").toHaveCount(0);
    expect.soft(d.掲載記事一覧, "掲載記事一覧").toHaveCount(0);
    expect.soft(d.カード情報, "カード情報").toHaveCount(0);
  });
});

caseTest("IT-F03-02-019", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  let 行数 = 0;
  await step(1, async () => {
    await 開いて確かめる(d, 店.本店, notes.get("〔商品ID-F0302-共有-ZERO-STOCK〕"), "在庫なしカード");
    行数 = await d.価格表の行.count();
    note(`価格・在庫の表の行: ${JSON.stringify(await d.行の文())}`);
  });
  await expected(async () => {
    expect.soft(行数, "価格・在庫の表に規格の行が表示されている（表示されたうえで数える）").toBeGreaterThan(0);
    expect.soft(d.数量の操作部, "商品数（数量）の操作部").toHaveCount(0);
    expect.soft(d.カートに追加, "カートに追加のボタン").toHaveCount(0);
  });
});

caseTest("IT-F03-02-021", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  let 行数 = 0;
  await step(1, async () => {
    await 開いて確かめる(d, 店.本店, notes.get("〔商品ID-F0302-共有-HIGH〕"), "高額商品コード付きカード");
    行数 = await d.価格表の行.count();
    note(`価格・在庫の表の行: ${JSON.stringify(await d.行の文())}`);
  });
  await expected(async () => {
    expect.soft(行数, "価格・在庫の表に規格の行が表示されている（表示されたうえで数える）").toBeGreaterThan(0);
    expect.soft(d.入荷通知のボタン, "入荷通知/通知待ちの操作部").toHaveCount(0);
  });
});

function 買取リンク(a: { 商品ID: string; 商品名: string; 表示: boolean; 手順数: 1 | 2 }): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const d = new FrontDetail(page);
    let n = 0;
    await step(1, async () => { await 開いて確かめる(d, 店.本店, notes.get(a.商品ID), a.商品名); n = await d.買取情報を見る.count(); });
    if (a.手順数 === 2) await step(2, async () => { n = await d.買取情報を見る.count(); note(`買取情報を見るリンクの数: ${n}`); });
    await expected(async () => {
      if (a.表示) await expect(d.買取情報を見る, "買取商品詳細画面へのリンク（買取情報を見る）").toBeVisible();
      else expect(n, "買取商品詳細画面へのリンク（買取情報を見る）の数").toBe(0);
    });
  };
}
caseTest("IT-F03-02-031", 買取リンク({ 商品ID: "〔商品ID-F0302-共有-BUY-ZERO〕", 商品名: "買取金額ゼロカード", 表示: false, 手順数: 1 }));
caseTest("IT-F03-02-032", 買取リンク({ 商品ID: "〔商品ID-F0302-共有-HIGH〕", 商品名: "高額商品コード付きカード", 表示: false, 手順数: 1 }));
caseTest("IT-F03-02-117", 買取リンク({ 商品ID: "〔商品ID-F0302-117〕", 商品名: "買取1円カード F0302-117-A", 表示: true, 手順数: 1 }));
caseTest("IT-F03-02-118", 買取リンク({ 商品ID: "〔商品ID-F0302-118〕", 商品名: "高額混在カード F0302-118-A", 表示: true, 手順数: 1 }));
caseTest("IT-F03-02-127", 買取リンク({ 商品ID: "〔商品ID-F0302-共有-SUPPLY〕", 商品名: "結合試験サプライ", 表示: false, 手順数: 2 }));

// ---- カード情報 ----

function カード情報(a: { 商品ID: string; 商品名: string; 確かめ: (項目: Record<string, string>) => void }): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const d = new FrontDetail(page);
    let 項目: Record<string, string> = {};
    await step(1, async () => {
      await 開いて確かめる(d, 店.本店, notes.get(a.商品ID), a.商品名);
      項目 = await d.カード情報の項目();
      note(`カード情報の項目: ${JSON.stringify(項目)}`);
    });
    await expected(async () => {
      expect.soft(Object.keys(項目).length, "カード情報の欄が表示されている（項目の数）").toBeGreaterThan(0);
      a.確かめ(項目);
    });
  };
}
caseTest("IT-F03-02-053", カード情報({
  商品ID: "〔商品ID-F0302-共有-OPTIONAL-EMPTY〕", 商品名: "任意カード情報なしカード",
  確かめ: (k) => {
    expect.soft(k["パワー・タフネス"], "パワー・タフネスの項目（表示されない）").toBeUndefined();
    expect.soft(k["忠誠度"], "忠誠度の項目（表示されない）").toBeUndefined();
  },
}));
caseTest("IT-F03-02-122", カード情報({
  商品ID: "〔商品ID-F0302-122〕", 商品名: "任意情報ありカード F0302-122-A",
  確かめ: (k) => {
    // 画面はパワー・タフネスを1つの項目に「4 / 5」の形で出す
    expect.soft(k["パワー・タフネス"], "パワー・タフネスの項目（パワー4・タフネス5）").toMatch(/^4\s*\/\s*5$/);
    expect.soft(k["忠誠度"], "忠誠度の項目").toBe("6");
  },
}));
caseTest("IT-F03-02-123", カード情報({
  商品ID: "〔商品ID-F0302-123〕", 商品名: "忠誠度なしカード F0302-123-A",
  確かめ: (k) => {
    expect.soft(k["パワー・タフネス"], "パワー・タフネスの項目（パワー3・タフネス1）").toMatch(/^3\s*\/\s*1$/);
    expect.soft(k["忠誠度"], "忠誠度の項目（表示されない）").toBeUndefined();
  },
}));

caseTest("IT-F03-02-121", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  await step(1, async () => { await 開いて確かめる(d, 店.本店, notes.get("〔商品ID-F0302-121〕"), "裏面なしカード F0302-121-A"); });
  await expected(async () => {
    expect.soft(d.カード情報, "カード情報の欄が表示されている（表示されたうえで数える）").toHaveCount(1);
    expect.soft(d.裏面のカード画像, "裏面カード画像の表示").toHaveCount(0);
    expect.soft(d.裏面へ切り替える操作, "カード説明を裏面に切り替える操作").toHaveCount(0);
    expect.soft(d.裏面のカード説明, "裏面のカード説明").toHaveCount(0);
  });
});

caseTest("IT-F03-02-086", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  let 言語 = "";
  await step(1, async () => { await 開いて確かめる(d, 店.本店, notes.get("〔商品ID-F0302-086〕"), "言語表示カード F0302-086-A"); });
  await step(2, async () => {
    言語 = (await d.カード言語.count()) ? ((await d.カード言語.first().textContent()) ?? "").trim() : "";
    note(`カード言語の欄: 「${言語}」`);
  });
  await expected(async () => { expect(言語, "カード言語の欄の言語コード").toBe("FR"); });
});

caseTest("IT-F03-02-111", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  let n = { 言語: -1, 切替: -1 };
  await step(1, async () => { await 開いて確かめる(d, 店.本店, notes.get("〔商品ID-F0302-111〕"), "言語非表示サプライ F0302-111-A"); });
  await step(2, async () => { n = { 言語: await d.カード言語.count(), 切替: await d.言語切替.count() }; });
  await expected(async () => {
    expect.soft(n.言語, "カード言語の欄（商品名の前の言語の表示）").toBe(0);
    expect.soft(n.切替, "カード言語の切替").toBe(0);
  });
});

caseTest("IT-F03-02-087", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  let 状態: string[] = [];
  await step(1, async () => { await 開いて確かめる(d, 店.本店, notes.get("〔商品ID-F0302-087〕"), "高額表示カード F0302-087-A", { lang: "JP" }); });
  await step(2, async () => { 状態 = await d.状態の欄の文(); note(`状態の欄: ${JSON.stringify(状態)}`); });
  await expected(async () => {
    expect(状態.some((s) => s.includes("F0302-087-HC")), `状態の欄に高額商品コード F0302-087-HC がある（${JSON.stringify(状態)}）`).toBe(true);
  });
});

// ---- パンくず ----

function パンくず(a: { 商品ID: string; 商品名: string; n: string }): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const d = new FrontDetail(page);
    let items: string[] = [];
    let 区切り: boolean[] = [];
    await step(1, async () => { await 開いて確かめる(d, 店.本店, notes.get(a.商品ID), a.商品名); });
    await step(2, async () => {
      items = await d.パンくず();
      区切り = await d.パンくずの区切り();
      note(`パンくずの項目: ${JSON.stringify(items)}（「>」は2つ目以降の項目の前に付く飾りで、画面に文字としては無い）`);
    });
    await expected(async () => {
      const want = ["ホームアイコン", rc(`階層1 F0302-${a.n}-B`), rc(`階層2 F0302-${a.n}-C`), rc(`階層3 F0302-${a.n}-D`)];
      expect.soft(items.slice(0, 4), "パンくずの先頭からの並び（ホームアイコン・階層1・階層2・階層3）").toEqual(want);
      expect.soft(区切り.slice(0, 3), "階層1・階層2・階層3の前の「>」の区切り").toEqual([true, true, true]);
    });
  };
}
caseTest("IT-F03-02-078", パンくず({ 商品ID: "〔商品ID-F0302-078〕", 商品名: "パンくずカード F0302-078-A", n: "078" }));
caseTest("IT-F03-02-079", パンくず({ 商品ID: "〔商品ID-F0302-079〕", 商品名: "パンくずサプライ F0302-079-A", n: "079" }));

caseTest("IT-F03-02-069", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  let n = -1;
  await step(1, async () => { await 開いて確かめる(d, 店.本店, notes.get("〔商品ID-F0302-共有-REGION-LIMIT〕"), "地域制限カード"); });
  await step(2, async () => {
    // 開発者ツールで見る検索エンジン向け情報にあたる、ページの head の対応付け（alternate）
    n = await d.英語版の対応付け.count();
    const all = await d.言語の対応付け();
    note(`ページの言語の対応付け: ${JSON.stringify(all)}`);
  });
  await expected(async () => { expect(n, "英語版ページとの対応付けの数").toBe(0); });
});

// ---- 使われているデッキ ----

caseTest("IT-F03-02-064", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  let formats: string[] = [];
  await step(1, async () => {
    await 開いて確かめる(d, 店.本店, notes.get("〔商品ID-F0302-共有-DECK-ZERO〕"), "デッキなしカード");
    formats = await d.デッキのフォーマット名();
    note(`使われているデッキの欄のフォーマット: ${JSON.stringify(formats)}`);
  });
  await expected(async () => {
    expect.soft(d.カード情報, "カード情報の欄が表示されている（表示されたうえで数える）").toHaveCount(1);
    expect.soft(formats, "使われているデッキの欄のフォーマット（デッキの無いスタンダードが無い）").not.toContain("スタンダード");
  });
});

function デッキ欄なし(a: { 入口: string; 商品ID: string; 商品名: string }): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const d = new FrontDetail(page);
    let n = -1;
    await step(1, async () => { await 開いて確かめる(d, a.入口, notes.get(a.商品ID), a.商品名); });
    await step(2, async () => { n = await d.デッキの欄.count(); });
    await expected(async () => { expect(n, "「このカードはこんなデッキに使われています」の欄の数").toBe(0); });
  };
}
caseTest("IT-F03-02-106", デッキ欄なし({ 入口: 店.TC大阪支店, 商品ID: "〔商品ID-F0302-106〕", 商品名: "支店デッキカード F0302-106-A" }));
caseTest("IT-F03-02-130", デッキ欄なし({ 入口: 店.本店, 商品ID: "〔商品ID-F0302-共有-SUPPLY〕", 商品名: "結合試験サプライ" }));

function もっと見る(a: { 商品ID: string; 商品名: string; 幅: { width: number; height: number }; 幅の名: string }): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await page.setViewportSize(a.幅);
    note(`${a.幅の名}で開いた（画面の幅 ${a.幅.width}px）`);
    const d = new FrontDetail(page);
    let got = { ブロック: -1, もっと見る: -1, デッキ: -1 };
    await step(1, async () => { await 開いて確かめる(d, 店.本店, notes.get(a.商品ID), a.商品名); });
    await step(2, async () => {
      const block = d.フォーマットのブロック("スタンダード");
      got = { ブロック: await block.count(), もっと見る: await d.もっと見る("スタンダード").count(), デッキ: await d.デッキ("スタンダード").count() };
      note(`スタンダード欄: ${JSON.stringify(got)}`);
    });
    await expected(async () => {
      expect.soft(got.ブロック, "スタンダード欄が表示されている（表示されたうえで数える）").toBe(1);
      expect.soft(got.もっと見る, "スタンダード欄のもっと見るリンクの数").toBe(0);
    });
  };
}
caseTest("IT-F03-02-107", もっと見る({ 商品ID: "〔商品ID-F0302-107〕", 商品名: "デッキ4件カード F0302-107-A", 幅: { width: 1280, height: 900 }, 幅の名: "PC幅" }));
caseTest("IT-F03-02-108", もっと見る({ 商品ID: "〔商品ID-F0302-108〕", 商品名: "デッキ3件カード F0302-108-A", 幅: { width: 375, height: 812 }, 幅の名: "SP幅" }));

caseTest("IT-F03-02-115", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  let formats: string[] = [];
  let 文 = "";
  await step(1, async () => { await 開いて確かめる(d, 店.本店, notes.get("〔商品ID-F0302-115〕"), "デッキ混在カード F0302-115-A"); });
  await step(2, async () => {
    formats = await d.デッキのフォーマット名();
    const block = d.フォーマットのブロック("スタンダード");
    文 = (await block.count()) ? ((await block.first().innerText()) ?? "").replace(/\s+/g, " ").trim() : "";
    note(`使われているデッキの欄のフォーマット: ${JSON.stringify(formats)}／スタンダード欄の文: 「${文}」`);
  });
  await expected(async () => {
    expect.soft(formats, "使われているデッキの欄のフォーマット（スタンダード）").toContain("スタンダード");
    expect.soft(文, "スタンダード欄にデッキ「デッキ F0302-115-1」").toContain(rc("デッキ F0302-115-1"));
    expect.soft(formats, "使われているデッキの欄のフォーマット（デッキの無いモダンが無い）").not.toContain("モダン");
  });
});

// ---- 店舗が支店のときに出ない部品 ----

function 支店で出ない(a: { 商品ID: string; 商品名: string; 高額商品コード?: string }): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const d = new FrontDetail(page);
    let 本文 = "";
    await step(1, async () => {
      await 開いて確かめる(d, 店.TC大阪支店, notes.get(a.商品ID), a.商品名);
      本文 = await d.本文();
    });
    await expected(async () => {
      expect.soft(d.入荷通知のボタン, "入荷通知/通知待ち").toHaveCount(0);
      expect.soft(d.お気に入り, "お気に入り").toHaveCount(0);
      expect.soft(d.まとめて入荷通知, "まとめて入荷通知").toHaveCount(0);
      expect.soft(d.SNSでシェア, "SNSでシェアする").toHaveCount(0);
      expect.soft(d.言語切替, "言語切替").toHaveCount(0);
      expect.soft(d.状態の列, "状態").toHaveCount(0);
      expect.soft(d.使われているデッキのボタン, "使われているデッキのボタン").toHaveCount(0);
      expect.soft(d.デッキの欄, "使われているデッキの欄").toHaveCount(0);
      expect.soft(d.他のバージョンのボタン, "他のバージョンのボタン").toHaveCount(0);
      expect.soft(d.他のバージョンの欄, "他のバージョンの欄").toHaveCount(0);
      expect.soft(d.掲載記事一覧, "掲載記事一覧").toHaveCount(0);
      if (a.高額商品コード) expect.soft(本文.includes(a.高額商品コード), `画面の文に高額商品コード ${a.高額商品コード} がある（表示されない）`).toBe(false);
    });
  };
}
caseTest("IT-F03-02-124", 支店で出ない({ 商品ID: "〔商品ID-F0302-124〕", 商品名: "高額サプライ F0302-CB124-A", 高額商品コード: "F0302-CB124-HC" }));
caseTest("IT-F03-02-125", 支店で出ない({ 商品ID: "〔商品ID-F0302-共有-SUPPLY〕", 商品名: "結合試験サプライ" }));

// ---- 最近チェックした商品（閲覧履歴） ----

const 履歴名 = (n: number) => rc(`履歴商品${String(n).padStart(2, "0")}`);
const 履歴ID = (notes: { get: (l: string) => string }, n: number) => notes.get(`〔商品ID-F0302-共有-HISTORY-${String(n).padStart(2, "0")}〕`);

async function 順に開く(d: FrontDetail, notes: { get: (l: string) => string }, ns: number[]): Promise<void> {
  for (const n of ns) {
    const res = await d.open(店.本店, 履歴ID(notes, n));
    expect(status(res), `履歴商品${String(n).padStart(2, "0")} の商品詳細画面の応答`).toBe(200);
    await d.閲覧履歴の書き込みを待つ();
  }
}

caseTest("IT-F03-02-075", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  let shown: string[] = [];
  await step(1, async () => { await 順に開く(d, notes, [1, 2, 3]); });
  await step(2, async () => { await 順に開く(d, notes, [2]); });
  await step(3, async () => { shown = await d.最近チェックした商品(); note(`最近チェックした商品の欄: ${JSON.stringify(shown)}`); });
  await expected(async () => {
    expect.soft(shown, "最近チェックした商品の欄の並び").toEqual([履歴名(2), 履歴名(3), 履歴名(1)]);
    expect.soft(shown.filter((s) => s === 履歴名(2)).length, "「履歴商品02」の数").toBe(1);
  });
});

caseTest("IT-F03-02-076", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  const all = Array.from({ length: 19 }, (_, i) => i + 1);
  let shown: string[] = [];
  let kept: string[] = [];
  await step(1, async () => { await 順に開く(d, notes, all); });
  await step(2, async () => {
    shown = await d.最近チェックした商品();
    kept = ((await 閲覧履歴のCookie(page.context()))?.value ?? "").split(",").filter(Boolean);
    note(`最近チェックした商品の欄: ${JSON.stringify(shown)}／閲覧履歴のCookieの商品ID: ${JSON.stringify(kept)}`);
  });
  await expected(async () => {
    // 「保持」は閲覧履歴（Cookie）の商品ID、「表示」は欄の商品名で確かめる
    const want = all.slice(1).reverse().map((n) => 履歴ID(notes, n));
    expect.soft(kept, "閲覧履歴に保持された商品ID（新しい順に履歴商品19〜02の18件）").toEqual(want);
    expect.soft(shown.length, "最近チェックした商品の欄に商品が表示されている（表示されたうえで数える）").toBeGreaterThan(0);
    expect.soft(shown, "最近チェックした商品の欄（履歴商品01が無い）").not.toContain(履歴名(1));
  });
});

caseTest("IT-F03-02-131", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  let shown: string[] = [];
  await step(1, async () => { await 順に開く(d, notes, Array.from({ length: 18 }, (_, i) => i + 1)); });
  await step(2, async () => { await 順に開く(d, notes, [5]); });
  await step(3, async () => { shown = await d.最近チェックした商品(); note(`最近チェックした商品の欄: ${JSON.stringify(shown)}`); });
  await expected(async () => {
    const want = [5, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 4].map(履歴名);
    expect.soft(shown, "最近チェックした商品の欄の並び（履歴商品05・18〜06・04の15件）").toEqual(want);
    expect.soft(shown.filter((s) => s === 履歴名(5)).length, "「履歴商品05」の数").toBe(1);
  });
});

// ---- カート ----

caseTest("IT-F03-02-143", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  const id = notes.get("〔商品ID-F0302-共有-SUPPLY〕");
  let rows: { 商品名: string; 数量: string }[] = [];
  await step(1, async () => { await 開いて確かめる(d, 店.本店, id, "結合試験サプライ"); });
  await step(2, async () => {
    const qty = d.数量の欄;
    await expect(qty, "商品数の欄は1つ").toHaveCount(1);
    expect(await qty.inputValue(), "商品数の表示").toBe("1");
  });
  await step(3, async () => {
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes(`/products/add_cart/${id}`) && r.request().method() === "POST", { timeout: 60_000 }),
      d.カートに追加.click(),
    ]);
    note(`カートに追加の応答: ${res.status()}`);
  });
  await step(4, async () => {
    const cart = new FrontCart(page);
    await cart.open(店.本店);
    rows = await cart.行();
    note(`ショッピングカートの行: ${JSON.stringify(rows)}`);
  });
  await expected(async () => {
    expect.soft(rows.length, "ショッピングカートの行の数").toBe(1);
    expect.soft(rows[0]?.商品名 ?? "", "カートの行の商品名").toContain(rc("結合試験サプライ"));
    expect.soft(rows[0]?.数量 ?? "", "カートの行の数量").toBe("1");
  });
});

// ---- 入荷通知（会員でログインして押す） ----

/** 確認のポップアップ（ブラウザの確認ダイアログ）を、了承する／しないで受ける。出た文を控える */
function 確認を受ける(page: Page, accept: boolean): string[] {
  const seen: string[] = [];
  page.on("dialog", (dlg: Dialog) => { seen.push(dlg.message()); void (accept ? dlg.accept() : dlg.dismiss()); });
  return seen;
}
const 押した注記 = (what: string, r: 押した結果) => note(`${what}: 完了の通知=${r.通知が出た ? `出た「${r.通知の文}」` : "出ない"}／ログインモーダル=${r.ログインモーダルが開いた ? "開いた" : "開かない"}／確認のモーダル=${r.確認のモーダルが開いた ? "開いた" : "開かない"}`);

function 依頼のDB確認(a: { 会員ID: string; 了承: boolean }): CaseBody {
  return async ({ page, notes, step, expected, db }) => {
    void db;
    const front = new FrontRestock(page);
    const d = new FrontDetail(page);
    const memberId = notes.get(a.会員ID);
    const local = a.了承 ? "f0302-member-022" : "cbf0302-126";
    const m = memberOf(local);
    const productId = notes.get("〔商品ID-F0302-共有-ZERO-STOCK〕");
    const dialogs = 確認を受ける(page, a.了承);
    let classId = "";
    let r: 押した結果 | null = null;
    let 件数 = { 有効: -1, 削除済み: -1 };
    let 全体 = -1;
    // 022 は手順1でログインと画面を開く。126 は手順1でログイン・手順2で画面を開く
    const login = async () => { await front.login(m.mail, m.password); };
    const open = async () => {
      await 開いて確かめる(d, 店.本店, productId, "在庫なしカード");
      const first = d.入荷通知のボタン.first();
      await expect(first, "先頭の商品規格の入荷通知のボタン").toBeVisible();
      classId = (await first.getAttribute("data-productclass")) ?? "";
      note(`先頭の商品規格の入荷通知のボタン: 商品規格ID ${classId}・文言「${await d.見えている文言(first)}」`);
    };
    const press = async () => { r = await front.press(front.classButton(classId)); 押した注記("入荷時に通知ボタンを押した", r); };
    const confirm = async () => {
      if (dialogs.length) note(`確認のポップアップ「${dialogs.join(" / ")}」で${a.了承 ? "「OK」を押した" : "「キャンセル」を押した"}`);
      else if (r?.確認のモーダルが開いた) note("確認のモーダルが開いたが、押すボタンを決められない");
      else note(`確認のポップアップは出なかった（通知ボタンを押した時点で依頼が送られた）。${a.了承 ? "「OK」" : "「キャンセル」"}を押す操作はできない`);
    };
    const check = async () => {
      件数 = 規格の依頼件数(memberId, classId);
      全体 = 有効な依頼件数(memberId);
      note(`会員 ${memberId} の入荷通知依頼: 商品規格 ${classId} の有効 ${件数.有効}・削除済み ${件数.削除済み}／有効な依頼の合計 ${全体}`);
    };
    if (a.了承) {
      await step(1, async () => { await login(); await open(); });
      await step(2, async () => { await press(); });
      await step(3, async () => { await confirm(); });
      await step(4, async () => { await check(); });
    } else {
      await step(1, async () => { await login(); });
      await step(2, async () => { await open(); });
      await step(3, async () => { await press(); });
      await step(4, async () => { await confirm(); });
      await step(5, async () => { await check(); });
    }
    await expected(async () => {
      if (a.了承) expect(件数.有効, "在庫なしカードの先頭の商品規格の、有効な入荷通知依頼の件数").toBe(1);
      else {
        expect.soft(件数.有効, "在庫なしカードの先頭の商品規格の、有効な入荷通知依頼の件数").toBe(0);
        expect.soft(全体, "会員の有効な入荷通知依頼の合計").toBe(0);
      }
    });
  };
}
caseTest("IT-F03-02-022", 依頼のDB確認({ 会員ID: "〔会員ID-F0302-022〕", 了承: true }));
caseTest("IT-F03-02-126", 依頼のDB確認({ 会員ID: "〔会員ID-F0302-126〕", 了承: false }));

/** 完了の通知（モーダル）の「OK」、無ければ閉じるボタンで閉じる */
async function 完了を閉じる(front: FrontRestock, d: FrontDetail, what: string): Promise<void> {
  const ok = d.完了の通知のOK(front.通知);
  if ((await ok.count()) > 0) { await ok.click(); return; }
  if (!(await front.通知が出ているか())) { note(`${what}: 完了の通知が出ていない`); return; }
  supplement(`${what}: 完了の通知に「OK」ボタンが無い。通知の閉じるボタンで閉じて続けた`);
  await front.通知の閉じるボタン.click();
}

function ボタンの切替(a: { 会員: string; 商品ID: string; 商品名: string; 前: string; 後: string }): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const front = new FrontRestock(page);
    const d = new FrontDetail(page);
    const m = memberOf(a.会員);
    const dialogs = 確認を受ける(page, true);
    let classId = "";
    let r: 押した結果 | null = null;
    const 文言 = { 前: "", 後: "" };
    await step(1, async () => { await front.login(m.mail, m.password); });
    await step(2, async () => {
      await 開いて確かめる(d, 店.本店, notes.get(a.商品ID), a.商品名);
      const first = d.入荷通知のボタン.first();
      await expect(first, "先頭の商品規格の入荷通知のボタン").toBeVisible();
      classId = (await first.getAttribute("data-productclass")) ?? "";
      文言.前 = await d.見えている文言(first);
      note(`先頭の商品規格の入荷通知のボタン: 商品規格ID ${classId}・文言「${文言.前}」`);
    });
    await step(3, async () => { r = await front.press(front.classButton(classId)); 押した注記("先頭の商品規格のボタンを押した", r); });
    await step(4, async () => {
      if (dialogs.length) note(`確認のポップアップ「${dialogs.join(" / ")}」で了承した`);
      else note("確認のポップアップは出なかった（ボタンを押した時点で送られた）。了承する操作はできない");
    });
    await step(5, async () => {
      await 完了を閉じる(front, d, "完了のモーダルを閉じる");
      await page.waitForTimeout(500);
      文言.後 = await d.見えている文言(d.入荷通知のボタン_規格(classId));
      note(`押したあとのボタンの文言「${文言.後}」`);
    });
    await expected(async () => {
      expect.soft(文言.前, `押す前のボタンの表示（${a.前}）`).toBe(a.前);
      expect.soft(文言.後, `押したあとのボタンの表示（${a.後}）`).toBe(a.後);
    });
  };
}
caseTest("IT-F03-02-109", ボタンの切替({ 会員: "f0302-member-109", 商品ID: "〔商品ID-F0302-109〕", 商品名: "通知待ちカード F0302-109-A", 前: "入荷時に通知", 後: "通知待ち" }));
caseTest("IT-F03-02-110", ボタンの切替({ 会員: "f0302-member-110", 商品ID: "〔商品ID-F0302-110〕", 商品名: "通知取消カード F0302-110-A", 前: "通知待ち", 後: "入荷時に通知" }));
