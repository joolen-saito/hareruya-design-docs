/**
 * F06-08 入荷待ち商品一覧。正本: cases/F06-08_test_cases.tsv
 * 全32ケースを実装する。入荷通知登録上限数（共有の設定）は書き換えない。S-F06-08-LIMIT がいまの値が20であることを画面で読んで確かめる（20でなければシードで止まる）。
 * 記録 review/F06-08_progress_2026-11-04.md（002〜004・009〜011・024・030〜032）、005〜008・012〜023・025〜027・034〜037 は 2026-11-11 に追加。
 *
 * 読み替え: 件数の表示は画面では「商品数: N点」で、正本は「N件」と書く。数字と「件」で比べる（032 と同じ。「点」と「件」の違いは判断待ち）。
 * 入荷待ち商品の1表示は、商品と言語の組（カード商品）。高額商品コードで束ねる作りは画面に無い（013 はその差で不合格になりうる）。
 */
import { Locator, test } from "@playwright/test";
import { 商品単位の依頼件数, 有効な依頼件数 } from "../../db/f03_07";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { FrontRestock } from "../../pages/front/f03_07_restock_notify";
import { NotifyListPage, 言語 } from "../../pages/front/f06_08_notifylist";
import { mailOf, passwordOf } from "../../seeds/f06-08";

const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

caseTest("IT-F06-08-002", async ({ page, step, expected }) => {
  const n = new NotifyListPage(page);
  await n.ログインする(mailOf("f0608_auth-002"), passwordOf("002"));
  await step(1, async () => { await n.ログアウトする(); });
  await step(2, async () => { await n.開く(); });
  await expected(async () => {
    expect.soft(n.path, "遷移した画面（会員ログイン画面）").toBe("/ja/mypage/login");
    expect.soft(await n.ログイン画面である(), "会員ログイン画面が表示される").toBe(true);
  });
});

function 零件(番号: string, 前半: string, 言: 言語) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const n = new NotifyListPage(page, 言);
    await n.ログインする(mailOf(前半), passwordOf(番号));
    await step(1, async () => { await n.開く(); });
    await expected(async () => {
      expect.soft(n.path, "入荷待ち商品一覧画面に留まる").toBe(`/${言}/mypage/notifylist`);
      expect.soft(await n.商品カード.count(), "入荷待ち商品がない").toBe(0);
      expect.soft(await n.見出し.isVisible(), "一覧の見出しが表示される").toBe(true);
      expect.soft(await n.マイページボタン.isVisible(), "マイページへのリンクが表示される").toBe(true);
      expect.soft(await n.案内文.count(), "入荷通知の案内（商品がある場合の説明文）が表示されない").toBe(0);
    });
  };
}
caseTest("IT-F06-08-003", 零件("003", "f0608_empty-003", "ja"));
caseTest("IT-F06-08-004", 零件("004", "f0608_empty-004", "en"));

function 空の案内(番号: string, 前半: string, 言: 言語, 文: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const n = new NotifyListPage(page, 言);
    await n.ログインする(mailOf(前半), passwordOf(番号));
    await step(1, async () => { await n.開く(); });
    await expected(async () => {
      expect.soft(await n.商品なしの案内.innerText().catch(() => ""), "画面上部の案内の文").toContain(文);
    });
  };
}
caseTest("IT-F06-08-030", 空の案内("030", "f0608_gfjp-030", "ja", "入荷待ち商品はありません。"));
caseTest("IT-F06-08-031", 空の案内("031", "f0608_gfen-031", "en", "No items waiting for restock."));

caseTest("IT-F06-08-024", async ({ page, step, expected }) => {
  const n = new NotifyListPage(page);
  await n.ログインする(mailOf("f0608_empty-024"), passwordOf("024"));
  await step(1, async () => { await n.開く(); });
  await step(2, async () => { await n.押して遷移する(n.マイページボタン); });
  await expected(async () => { expect.soft(n.path, "遷移した画面（マイページ）").toMatch(/^\/ja\/mypage\/?$/); });
});

// ---- 通知が1件ある会員（グッズ商品の規格単位の通知。上限は書き換えない） ----
caseTest("IT-F06-08-009", async ({ page, step, expected }) => {
  const n = new NotifyListPage(page);
  await n.ログインする(mailOf("f0608_name-009"), passwordOf("009"));
  await step(1, async () => { await n.開く(); });
  let 上部 = "";
  await step(2, async () => { 上部 = await n.画面上部の文(); });
  await expected(async () => {
    expect.soft(await n.一覧画面である(), "入荷待ち商品一覧画面が表示される").toBe(true);
    expect.soft(上部, "画面上部に会員の氏名「晴屋太郎-009」が表示されない").not.toMatch(/晴屋|太郎-009/);
  });
});
caseTest("IT-F06-08-010", async ({ page, step, expected }) => {
  const n = new NotifyListPage(page);
  await n.ログインする(mailOf("f0608_breadcrumb-010"), passwordOf("010"));
  await step(1, async () => { await n.開く(); });
  await step(2, async () => { await n.現在地を押す(); });
  await expected(async () => {
    expect.soft(await n.現在地がリンクか(), "現在表示中ページが押下可能なリンクになっている").toBe(false);
    expect.soft(n.path, "入荷待ち商品一覧画面に留まる").toBe("/ja/mypage/notifylist");
  });
});
caseTest("IT-F06-08-011", async ({ page, step, expected }) => {
  const n = new NotifyListPage(page);
  await n.ログインする(mailOf("f0608_home-011"), passwordOf("011"));
  await step(1, async () => { await n.開く(); });
  await step(2, async () => { await n.押して遷移する(n.パンくずホーム); });
  await expected(async () => { expect.soft(n.path, "遷移した画面（本店ECTOP）").toMatch(/^\/(ja\/?)?$/); });
});
caseTest("IT-F06-08-032", async ({ page, step, expected }) => {
  const n = new NotifyListPage(page);
  await n.ログインする(mailOf("f0608_single-032"), "Passw0rd-F0608032");
  await step(1, async () => { await n.開く(); });
  let 件数 = "";
  let 名前: string[] = [];
  await step(2, async () => { 件数 = await n.商品件数の表示(); 名前 = await n.商品名一覧(); });
  await expected(async () => {
    expect.soft(件数, "商品件数の表示").toMatch(/1\s*件/);
    expect.soft(名前, "表示された商品名（1商品だけ）").toEqual([rc("テスト単品通知-032")]);
  });
});

// ---- 一覧の件数・表示（カード商品・まとめて入荷通知を含む） ----
const 表示会員 = (番号: string) => ({ mail: mailOf(`f0608_display-${番号}`), pw: passwordOf(番号) });
const 並べる = (a: string[]): string[] => [...a].sort();
const 英字 = (i: number): string => String.fromCharCode(65 + i);

function 一覧の件数(番号: string, 前半: string, 商品コード: string[], 件数: number) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const n = new NotifyListPage(page);
    await n.ログインする(mailOf(前半), passwordOf(番号));
    await step(1, async () => { await n.開く(); });
    let 表示 = "";
    let 名前: string[] = [];
    await step(2, async () => { 表示 = await n.商品件数の表示(); 名前 = await n.商品名一覧(); });
    await expected(async () => {
      expect.soft(並べる(名前), `表示された商品名（${商品コード.length}商品）`).toEqual(並べる(商品コード.map(rc)));
      expect.soft(表示, "商品件数の表示").toMatch(new RegExp(`(^|\\D)${件数}\\s*件`));
      expect.soft(await n.案内文.count(), "入荷通知の案内が表示される").toBe(1);
    });
  };
}

// ---- 034〜037 Foil の有無 × まとめて入荷通知の有無 ----
function 組合せ(番号: string, Foil: boolean, まとめて: boolean) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const n = new NotifyListPage(page);
    await n.ログインする(mailOf(`cbf0608-${番号}`), `Passw0rd-CBF0608${番号}`);
    const コード = `CARD-F0608-CB${番号}`;
    const 表示 = n.商品の表示(rc(コード));
    await step(1, async () => { await n.開く(); });
    let 名前 = "";
    await step(2, async () => { 名前 = await n.商品名の文(表示.first()); });
    let 解除 = -1;
    let 追加ボタン = -1;
    let 枠 = -1;
    await step(3, async () => {
      解除 = await n.まとめての解除ボタン(表示).count();
      追加ボタン = await 表示.locator("button.p-hareruya-product-card__notify-btn:not(.notifyme-cancel):not(.is-selected)").count();
      枠 = await 表示.locator(".p-hareruya-product-card__notify-all").count();
    });
    await expected(async () => {
      supplement("商品名は「【Foil】」と商品名の間の空白・改行を除いて比べた（画面は改行をはさんで並べる）");
      expect.soft(名前, "行の商品名").toBe(`${Foil ? "【Foil】" : ""}${rc(コード)}`);
      if (まとめて) {
        expect.soft(解除, "まとめて入荷通知の解除ボタンの数").toBe(1);
      } else {
        expect.soft(解除, "まとめて入荷通知の解除ボタンの数").toBe(0);
        expect.soft(追加ボタン + 枠, "まとめて入荷通知のボタン・操作部品の数").toBe(0);
      }
    });
  };
}
