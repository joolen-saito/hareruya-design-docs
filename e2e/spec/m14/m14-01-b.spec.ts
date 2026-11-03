/** M14-01 カード検索（一覧・条件抽出）の続き（ページ送り・並び順・削除・CSV出力）。正本: cases/M14-01_test_cases.tsv */
import { test, Page } from "@playwright/test";
import { caseTest, CaseBody, expect } from "../../lib/case";
import { csvRecords } from "../../lib/csv";
import { rc } from "../../lib/run_marker";
import { adminUrl, hideDebugToolbar, loginAdmin } from "../../lib/session";
import { CardSearchPage, downloadedText, select2に入れる, 検索欄, 検索条件の入力値, 展開式を選ぶ } from "../../pages/admin/m14_card";
import { M1401_ADMIN } from "../../seeds/m14-01";
import { BASE_URL } from "../../config/env";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 英字 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ID群 = (notes: { get(l: string): string }, prefix: string, 文字: string) => [...文字].map((c) => notes.get(`〔カードID-${prefix}${c}〕`));

/** 一括削除を押す。画面の確認ダイアログ（確認ポップアップ）が出るので、受け入れる操作を返す */
async function 一括削除を押す(page: Page) {
  const dialogP = page.waitForEvent("dialog", { timeout: 30_000 });
  const clickP = page.locator("#form_bulk button.action-submit").filter({ hasText: /^\s*一括削除\s*$/ }).click({ timeout: 30_000 });
  const dialog = await dialogP;
  note("確認ポップアップは画面の確認ダイアログ（「OK」で実行）として表示された");
  return {
    受け入れる: async () => {
      await Promise.all([page.waitForNavigation({ waitUntil: "load" }), dialog.accept()]);
      await clickP.catch(() => undefined);
    },
  };
}

// ---- ページ送り（最終ページ参照カード 11件） ----
const LP = "M1401LPREAD";
caseTest("IT-M14-01-039", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const l = new CardSearchPage(page);
  await step(1, async () => { await l.open(); await l.キーワードで検索する(rc(LP)); });
  await step(2, async () => { await l.表示件数を選ぶ(10); });
  await step(3, async () => { await l.ページ送りを押す("次へ"); });
  await expected(async () => {
    expect.soft((await l.ページ送りの表示()).現在, "表示中のページ番号").toBe("2");
    expect.soft(await l.表示中のカードID(), "2ページ目のカードID").toEqual([notes.get("〔カードID-M1401-共有LPREAD-A〕")]);
  });
});
caseTest("IT-M14-01-040", async ({ page, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const l = new CardSearchPage(page);
  await step(1, async () => { await l.open(); await l.キーワードで検索する(rc(LP)); });
  await step(2, async () => { await l.表示件数を選ぶ(10); });
  await step(3, async () => { await l.ページ送りを押す("2"); });
  await step(4, async () => { await l.ページ送りを押す("前へ"); });
  await expected(async () => {
    expect.soft((await l.ページ送りの表示()).現在, "表示中のページ番号").toBe("1");
    expect.soft(await l.行.count(), "表示されているカードの行数").toBe(10);
  });
});
caseTest("IT-M14-01-041", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const l = new CardSearchPage(page);
  await step(1, async () => { await l.open(); await l.キーワードで検索する(rc(LP)); });
  await step(2, async () => { await l.表示件数を選ぶ(10); });
  await step(3, async () => { await l.ページ送りを押す("2"); });
  await expected(async () => {
    expect.soft((await l.ページ送りの表示()).現在, "表示中のページ番号").toBe("2");
    expect.soft(await l.表示中のカードID(), "2ページ目のカードID").toEqual([notes.get("〔カードID-M1401-共有LPREAD-A〕")]);
  });
});
caseTest("IT-M14-01-042", async ({ page, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const l = new CardSearchPage(page);
  await step(1, async () => { await l.open(); await l.キーワードで検索する(rc(LP)); });
  await step(2, async () => { await l.表示件数を選ぶ(10); });
  await step(3, async () => { await l.ページ送りを押す("2"); });
  let 表示 = { 現在: null as string | null }, リンクか = true;
  await step(4, async () => {
    表示 = await l.ページ送りの表示();
    リンクか = (await l.pager().locator("li.active a").count()) > 0;
  });
  await expected(async () => {
    expect.soft(表示.現在, "現在のページ番号（選択状態の表示）").toBe("2");
    expect.soft(リンクか, "現在のページ番号が押下できる（リンク）").toBe(false);
  });
});

// ---- 削除 ----
caseTest("IT-M14-01-043", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const l = new CardSearchPage(page);
  const A = notes.get("〔カードID-M1401-043A〕");
  await step(1, async () => { await l.open(); await l.キーワードで検索する(rc("M1401LP043")); });
  await step(2, async () => { await l.表示件数を選ぶ(10); });
  await step(3, async () => { await l.ページ送りを押す("2"); });
  await step(4, async () => { await l.三点リーダーを押す(A); });
  await step(5, async () => { await l.削除を押す(A); });
  await step(6, async () => { await l.確認ポップアップで実行する(); });
  await expected(async () => {
    expect.soft((await l.ページ送りの表示()).現在, "削除後に表示された一覧のページ番号").toBe("1");
    expect.soft(await l.行.count(), "削除後の一覧の行数").toBe(10);
  });
});
/** 検索して選び、一括削除を押して確認ポップアップを受け入れる（手順3＝押す、手順4＝受け入れる） */
function 一括削除のケース(token: string, prefix: string, 選ぶ: string, 残る: string, 再検索: boolean, 実行の名: string): CaseBody {
  return async ({ page, notes, step, expected }) => {
    void 実行の名;
    await loginAdmin(page, M1401_ADMIN);
    const l = new CardSearchPage(page);
    const 選択 = ID群(notes, prefix, 選ぶ), 残り = ID群(notes, prefix, 残る);
    let 受 = async () => {};
    await step(1, async () => { await l.open(); await l.キーワードで検索する(rc(token)); });
    await step(2, async () => { await l.カードを選択する(選択); });
    await step(3, async () => { 受 = (await 一括削除を押す(page)).受け入れる; });
    await step(4, async () => { await 受(); });
    if (再検索) await step(5, async () => { await l.キーワードで検索する(rc(token)); });
    await expected(async () => {
      if (再検索) {
        const ids = await l.表示中のカードID();
        expect.soft(選択.some((x) => ids.includes(x)), "削除したカードが検索結果に表示されている").toBe(false);
        expect.soft(残り.every((x) => ids.includes(x)), "選択しなかったカードが表示されている").toBe(true);
      } else {
        expect.soft(new URL(page.url()).pathname, "表示された画面のアドレス（カード検索）").toMatch(/\/card(\/search(\/\d+)?)?$/);
        expect.soft(await l.form.count(), "カード検索の検索欄").toBe(1);
      }
    });
  };
}
caseTest("IT-M14-01-049", 一括削除のケース("M1401DEL049", "M1401-049", "AB", "C", true, "実行"));
caseTest("IT-M14-01-050", 一括削除のケース("M1401DEL050", "M1401-050", "AB", "C", false, "実行"));
caseTest("IT-M14-01-080", 一括削除のケース("M1401DP080", "M1401-080", "B", "AC", true, "削除"));

/** 検索→3点リーダー→削除→確認ポップアップ（画面の中のポップアップ）の「実行」 */
async function 個別削除(l: CardSearchPage, id: string) {
  await l.三点リーダーを押す(id);
  await l.削除を押す(id);
}
caseTest("IT-M14-01-053", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const l = new CardSearchPage(page);
  const id = notes.get("〔カードID-M1401-053〕");
  await step(1, async () => { await l.open(); await l.キーワードで検索する(rc("M1401DEL053")); });
  await step(2, async () => { await l.三点リーダーを押す(id); });
  await step(3, async () => { await l.削除を押す(id); });
  await step(4, async () => { await l.確認ポップアップで実行する(); });
  await step(5, async () => { await l.キーワードで検索する(rc("M1401DEL053")); });
  await expected(async () => {
    expect.soft((await l.表示中のカードID()).includes(id), "削除したカードが検索結果に表示されている").toBe(false);
  });
});
caseTest("IT-M14-01-056", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const l = new CardSearchPage(page);
  const id = notes.get("〔カードID-M1401-056〕");
  await step(1, async () => { await l.open(); await l.キーワードで検索する(rc("M1401DEL056")); });
  await step(2, async () => { await l.三点リーダーを押す(id); });
  await step(3, async () => { await l.削除を押す(id); });
  await step(4, async () => { await l.確認ポップアップで実行する(); });
  await expected(async () => {
    expect.soft(await page.locator("#DeleteModal.show").count(), "開いている確認ポップアップの数").toBe(0);
    expect.soft(await l.form.count(), "カード検索の検索欄").toBe(1);
    expect.soft(new URL(page.url()).pathname, "表示された画面のアドレス（カード検索）").toMatch(/\/card(\/search(\/\d+)?)?$/);
  });
});
void 個別削除;

// ---- フィルター・クリア・保持 ----
caseTest("IT-M14-01-059", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const l = new CardSearchPage(page);
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.キーワード.fill(rc("M1401-059")); });
  await step(3, async () => { await l.検索条件を展開する(); });
  await step(4, async () => { await 展開式を選ぶ(page, "foil", "特殊"); });
  await step(5, async () => { await l.検索する(); });
  await expected(async () => {
    const ids = await l.表示中のカードID();
    const [A, B, C, D] = ID群(notes, "M1401-059", "ABCD");
    expect.soft([...ids].sort(), "表示されたカードID").toEqual([C, D].sort());
    expect.soft(ids.includes(A) || ids.includes(B), "Foilがなし・通常のカードが表示されている").toBe(false);
  });
});
caseTest("IT-M14-01-060", async ({ page, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const l = new CardSearchPage(page);
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.検索条件を展開する(); });
  await step(3, async () => {
    await page.locator("#admin_search_card_cmc").fill("3");
    await 展開式を選ぶ(page, "layout", "通常");
    await select2に入れる(page, 検索欄.カードタイプ, rc("M1401-060-TYPE"), true);
    await select2に入れる(page, 検索欄.サブタイプ, rc("M1401-060-SUB"), true);
    await select2に入れる(page, 検索欄.特殊タイプ, rc("M1401-060-SPC"), true);
    await select2に入れる(page, 検索欄.カードセット, rc("M1401-060-SET"), true);
    await select2に入れる(page, 検索欄.イラストレーター, rc("M1401-060-ART"), true);
    await select2に入れる(page, 検索欄.プロモ種別, rc("M1401-060-PROMO"), true);
    expect((await 検索条件の入力値(page)).length, "入力した検索条件の数").toBeGreaterThanOrEqual(8);
  });
  await step(4, async () => { await page.getByText("検索条件をクリア", { exact: true }).click(); await page.waitForTimeout(800); });
  await expected(async () => {
    expect.soft(await 検索条件の入力値(page), "クリア後に入力・選択が残っている検索条件").toEqual([]);
  });
});

/** 検索して10件表示・2ページ目を開き、メニューから開き直す */
function 保持の破棄(token: string, 期待: "条件が空" | "一覧なし"): CaseBody {
  return async ({ page, step, expected }) => {
    await loginAdmin(page, M1401_ADMIN);
    const l = new CardSearchPage(page);
    await step(1, async () => { await l.open(); });
    await step(2, async () => { await l.キーワードで検索する(rc(token)); });
    await step(3, async () => { await l.表示件数を選ぶ(10); });
    await step(4, async () => { await l.ページ送りを押す("2"); });
    await step(5, async () => { await l.openFromMenu(); });
    await expected(async () => {
      if (期待 === "条件が空") {
        expect.soft(await l.キーワード.inputValue(), "カード名・テキストの検索条件").toBe("");
        expect.soft(await 検索条件の入力値(page), "入力・選択されている検索条件").toEqual([]);
      } else {
        expect.soft(await l.行.count(), "表示されているカードの行数").toBe(0);
        expect.soft(await page.getByText(/検索結果：\d+件/).count(), "検索結果の件数表示").toBe(0);
      }
    });
  };
}
caseTest("IT-M14-01-061", 保持の破棄("M1401-061", "条件が空"));
caseTest("IT-M14-01-077", 保持の破棄("M1401-077", "一覧なし"));

/** 別のブラウザ（新しいセッション）で、控えた2ページ目のURLを開く */
function 別ブラウザで開く(token: string, 期待: "条件が空" | "一覧なし"): CaseBody {
  return async ({ page, browser, step, expected }) => {
    await loginAdmin(page, M1401_ADMIN);
    const l = new CardSearchPage(page);
    let url = "";
    await step(1, async () => { await l.open(); });
    await step(2, async () => { await l.キーワードで検索する(rc(token)); });
    await step(3, async () => { await l.表示件数を選ぶ(10); });
    await step(4, async () => { url = new URL((await l.pager().getByRole("link", { name: "2", exact: true }).getAttribute("href")) ?? "", page.url()).toString(); });
    const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    try {
      await hideDebugToolbar(ctx);
      const p2 = await ctx.newPage();
      const l2 = new CardSearchPage(p2);
      await step(5, async () => { await loginAdmin(p2, M1401_ADMIN); });
      await step(6, async () => { await p2.goto(url); await p2.waitForLoadState("load"); });
      await expected(async () => {
        if (期待 === "条件が空") {
          expect.soft(await l2.キーワード.inputValue(), "カード名・テキストの検索条件").toBe("");
          expect.soft(await 検索条件の入力値(p2), "入力・選択されている検索条件").toEqual([]);
        } else {
          expect.soft(await l2.行.count(), "表示されているカードの行数").toBe(0);
        }
      });
    } finally { await ctx.close(); }
  };
}
caseTest("IT-M14-01-063", 別ブラウザで開く("M1401-063", "条件が空"));
caseTest("IT-M14-01-078", 別ブラウザで開く("M1401-078", "一覧なし"));

caseTest("IT-M14-01-062", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const l = new CardSearchPage(page);
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.キーワードで検索する(rc("M1401-062")); });
  await step(3, async () => { await l.並び順を選ぶ("マナ・コスト", "昇順"); note("設計書の「並び順ボタン」は、画面では並び順の選択欄として実装されている。選択欄で選んだ"); });
  await step(4, async () => { await l.表示件数を選ぶ(50); });
  await expected(async () => {
    expect.soft(await l.表示中のカードID(), "表示されたカードIDの順").toEqual(ID群(notes, "M1401-062", "BDCA"));
  });
});

// ---- 並び順の表示 ----
caseTest("IT-M14-01-067", async ({ page, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const l = new CardSearchPage(page);
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.キーワードで検索する(rc("M1401-067")); });
  let 表示 = "";
  await step(3, async () => { 表示 = await l.並び順の選択値(); });
  await expected(async () => {
    expect.soft(表示, "並び順の現在の表示").toBe("カードID（降順）");
  });
});
caseTest("IT-M14-01-068", async ({ page, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const l = new CardSearchPage(page);
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.キーワードで検索する(rc("M1401-068")); });
  await step(3, async () => { await l.並び順を選ぶ("マナ・コスト", "昇順"); note("設計書の「並び順ボタン」は、画面では並び順の選択欄として実装されている。選択欄で選んだ"); });
  let 表示 = "";
  await step(4, async () => { 表示 = await l.並び順の選択値(); });
  await expected(async () => {
    expect.soft(表示, "並び順の現在の表示").toBe("マナ・コスト（昇順）");
  });
});
caseTest("IT-M14-01-069", async ({ page, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const l = new CardSearchPage(page);
  const ボタン = page.getByRole("button", { name: /並び順/ });
  let 前 = true;
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.キーワードで検索する(rc("M1401-069")); });
  await step(3, async () => { 前 = await page.locator("#sort_key_pulldown").isVisible(); });
  await step(4, async () => { await ボタン.click({ timeout: 15_000 }); });
  await expected(async () => {
    expect.soft(前, "押下前に並び順のキーが表示されている").toBe(false);
    expect.soft(await l.並び順の選択肢(), "並び順のキー").toHaveLength(4);
  });
});
caseTest("IT-M14-01-070", async ({ page, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const l = new CardSearchPage(page);
  const ボタン = page.getByRole("button", { name: /並び順/ });
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.キーワードで検索する(rc("M1401-070")); });
  await step(3, async () => { await ボタン.click({ timeout: 15_000 }); });
  await step(4, async () => { note(`昇順・降順の表示の有無: ${await page.getByText("昇順", { exact: true }).count()}`); });
  await step(5, async () => { await page.getByText("マナ・コスト", { exact: true }).click({ timeout: 15_000 }); });
  await expected(async () => {
    expect.soft(await page.getByText("昇順", { exact: true }).isVisible(), "昇順の表示").toBe(true);
    expect.soft(await page.getByText("降順", { exact: true }).isVisible(), "降順の表示").toBe(true);
  });
});
caseTest("IT-M14-01-071", async ({ page, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const l = new CardSearchPage(page);
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.キーワードで検索する(rc("M1401-071")); });
  await step(3, async () => { await l.表示件数を選ぶ(10); });
  let 表示 = { 前へ: true, 次へ: false, 番号: [] as string[], 現在: null as string | null };
  await step(4, async () => { 表示 = await l.ページ送りの表示(); });
  await expected(async () => {
    expect.soft(表示.前へ, "1ページ目に「前へ」が表示されている").toBe(false);
  });
});
caseTest("IT-M14-01-072", async ({ page, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const l = new CardSearchPage(page);
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.キーワードで検索する(rc("M1401-072")); });
  await step(3, async () => { await l.表示件数を選ぶ(10); });
  await step(4, async () => { await l.ページ送りを押す("2"); });
  let 表示 = { 前へ: false, 次へ: true, 番号: [] as string[], 現在: null as string | null };
  await step(5, async () => { 表示 = await l.ページ送りの表示(); });
  await expected(async () => {
    expect.soft(表示.次へ, "最終ページに「次へ」が表示されている").toBe(false);
  });
});
