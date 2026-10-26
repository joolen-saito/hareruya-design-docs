/**
 * M03-23 買取・販売価格履歴検索。正本: cases/M03-23_test_cases.tsv
 *
 * 画面だけで準備できる12件（003・007・009〜013・031・035・036・041・042）を実装する。
 * 実装しないケースと理由は e2e/review/M03-23_progress_2026-10-20.md に書く
 * （表示件数の既定値50の設定にアプリの設定ファイルの書き換えが要る 001・002・037、シードや手順にDBでの削除・設定が要るもの）。
 */
import { Page, test } from "@playwright/test";
import { 語を持つ価格履歴 } from "../../db/m03_23_price_history";
import { expect, CaseBody, caseTest } from "../../lib/case";
import { available as dbAvailable } from "../../lib/db";
import { adminUrl, loginAdmin, withAdminSession } from "../../lib/session";
import {
  PriceHistoryPage, 価格履歴CSVのパス, 価格履歴検索のパス, 検索条件の識別ID, 欄の表示, 選択肢,
} from "../../pages/admin/m03_23_price_history";
import { KEYWORDの商品コード, M0323_ADMIN } from "../../seeds/m03-23";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 事前準備①: 新しいブラウザセッションで、試験管理者としてログインする */
async function signIn(page: Page): Promise<PriceHistoryPage> {
  await loginAdmin(page, M0323_ADMIN);
  return new PriceHistoryPage(page);
}

const sorted = (xs: string[]) => [...xs].sort();

/** 一覧の行を注記に残し、商品コード（上から順）を返す */
async function listedCodes(h: PriceHistoryPage, when: string): Promise<string[]> {
  const rows = await h.rowValues();
  const total = await h.totalCount();
  note(`${when}の一覧（上から）: ${rows.map((r) => `${r.商品コード}（${r.商品名}・${r.言語}・${r.状態}）`).join(" / ") || "行なし"}` +
    `（該当件数の表示: ${total ?? "なし"}）`);
  return rows.map((r) => r.商品コード);
}

/** 選択肢を注記の文にする */
const choiceText = (cs: 選択肢[]) => cs.map((c) => `${c.label}${c.checked ? "（選択済み）" : ""}${c.visible && c.enabled ? "" : "（操作できない）"}`).join("、");

// ---- 検索条件の欄の表示 ----

caseTest("IT-M03-23-003", async ({ page, step, expected }) => {
  const h = await signIn(page);
  let first: Record<検索条件の識別ID, 欄の表示> | undefined;
  await step(1, async () => {
    await h.open();
    note(`開いた直後の識別ID 1-3〜1-16 の表示: ${JSON.stringify(await h.検索条件の表示())}`);
  });
  await step(2, async () => { await h.pressToggle(); });
  await step(3, async () => {
    first = await h.検索条件の表示();
    note(`1回目の押下のあとの識別ID 1-3〜1-16 の表示: ${JSON.stringify(first)}`);
  });
  await step(4, async () => { await h.pressToggle(); });
  await expected(async () => {
    const second = await h.検索条件の表示();
    note(`2回目の押下のあとの識別ID 1-3〜1-16 の表示: ${JSON.stringify(second)}`);
    expect(first, "1回目の押下のあとの表示を読んだ").toBeDefined();
    for (const [id, state] of Object.entries(first ?? {})) expect.soft(state, `1回目の押下で識別ID ${id} が非表示になる`).toBe("非表示");
    for (const [id, state] of Object.entries(second)) expect.soft(state, `2回目の押下で識別ID ${id} が表示される`).toBe("表示");
  });
});

caseTest("IT-M03-23-007", async ({ page, step, expected }) => {
  const h = await signIn(page);
  let status: 選択肢[] = [];
  let condition: 選択肢[] = [];
  await step(1, async () => { await h.open(); });
  await step(2, async () => {
    status = await h.choices("公開状態");
    condition = await h.choices("状態");
    note(`公開状態の選択肢: ${choiceText(status)}`);
    note(`状態の選択肢: ${choiceText(condition)}`);
  });
  await expected(async () => {
    const labels = (cs: 選択肢[]) => cs.map((c) => c.label);
    const checked = (cs: 選択肢[]) => cs.filter((c) => c.checked).map((c) => c.label);
    const operable = (cs: 選択肢[], l: string) => cs.some((c) => c.label === l && c.visible && c.enabled);
    expect.soft(checked(status), "公開状態は「公開」が初期選択").toEqual(["公開"]);
    for (const l of ["公開", "非公開"]) expect.soft(operable(status, l), `公開状態の「${l}」を選択できる`).toBe(true);
    expect.soft(labels(status), "公開状態の「限定公開」は選択できない").not.toContain("限定公開");
    expect.soft(checked(condition), "状態は「NM」が初期選択").toEqual(["NM"]);
    for (const l of ["NM", "SP", "MP", "HP", "その他"]) expect.soft(operable(condition, l), `状態の「${l}」を選択できる`).toBe(true);
  });
});

// ---- 複合キーワード ----

/** 手順「1. 画面を開く／2. 商品名等に語を入力する／3. 「検索する >」を押す」で、期待結果の識別子の行だけが出ることを見る */
function keywordCase(word: string, want: string[]): CaseBody {
  return async ({ page, step, expected }) => {
    const h = await signIn(page);
    const codes = want.map((k) => KEYWORDの商品コード[k]);
    await step(1, async () => { await h.open(); });
    await step(2, async () => { await h.商品名等.fill(word); });
    await step(3, async () => { await h.search(); });
    await expected(async () => {
      const got = await listedCodes(h, `「${word}」で検索した結果`);
      if (want.includes("OR-CODE-001")) note("OR-CODE-001 の商品コードは、シード表のとおり「ORKEY-OR-CODE-001」として一覧の商品コード列で見た");
      expect.soft(sorted(got), `${want.join("・")} の${want.length}件だけが表示される`).toEqual(sorted(codes));
    });
  };
}

caseTest("IT-M03-23-009", keywordCase("ORKEY", ["OR-JP-001", "OR-EN-001", "OR-CARD-001", "OR-CODE-001", "OR-MEMO-001"]));
caseTest("IT-M03-23-010", keywordCase("ALPHA BETA", ["AND-BOTH-001"]));
caseTest("IT-M03-23-011", keywordCase("ALPHA　BETA", ["AND-BOTH-001"]));
caseTest("IT-M03-23-012", keywordCase("ALPHA,BETA", ["AND-BOTH-001"]));

caseTest("IT-M03-23-013", async ({ page, step, expected }) => {
  const h = await signIn(page);
  let percent: string[] = [];
  let underscore: string[] = [];
  await step(1, async () => {
    await h.open();
    await h.searchWord("%");
    percent = await listedCodes(h, "「%」で検索した結果");
  });
  await step(2, async () => {
    await h.searchWord("_");
    underscore = await listedCodes(h, "「_」で検索した結果");
  });
  await expected(async () => {
    expect.soft(percent, "「%」では PERCENT-001 だけが表示される").toEqual([KEYWORDの商品コード["PERCENT-001"]]);
    expect.soft(underscore, "「_」では UNDERSCORE-001 だけが表示される").toEqual([KEYWORDの商品コード["UNDERSCORE-001"]]);
  });
});

// ---- 検索条件の引き継ぎ ----

caseTest("IT-M03-23-031", async ({ page, step, expected }) => {
  const h = await signIn(page);
  await step(1, async () => { await h.open(); });
  await step(2, async () => {
    await h.searchWord("RETAIN");
    note(`検索したあとの件数の欄: ${await h.selectedCount() ?? "なし"}、該当件数の表示: ${await h.totalCount() ?? "なし"}`);
  });
  await step(3, async () => { await h.chooseCount("10"); });
  await step(4, async () => {
    await h.goToPage("2");
    note(`2ページ目を選んだあとのアドレス: ${h.path()}${new URL(page.url()).search}`);
  });
  await step(5, async () => {
    const status = await h.openAddress("/product/buy_sale_price_history/search/2");
    note(`アドレスを開いたときの応答: ${status}`);
  });
  await expected(async () => {
    await expect.soft(h.商品名等, "商品名等の「RETAIN」が保持される").toHaveValue("RETAIN");
    expect.soft(await h.selectedCount(), "件数10件が保持される").toBe("10件");
    expect.soft(await h.currentPage(), "ページ番号2が保持される").toBe("2");
    expect.soft(await listedCodes(h, "アドレスで開いた2ページ目"), "2ページ目に RETAIN-001 が表示される").toContain("RETAIN-001");
  });
});

// ---- CSV出力の導線 ----

caseTest("IT-M03-23-035", async ({ page, browser, step, expected }) => {
  // 事前準備②「NO-HISTORY-999 を持つ価格履歴が無い状態にし、存在する場合は削除して0件を確認している」:
  // 価格履歴は画面から削除できないので、0件であることだけを確かめる（あれば止める）。
  // 試験の対象の検索そのものに頼らないよう、DB確認の接続先があるときは、先に検索とは別の方法（DBの参照）で確かめる。
  // 画面での確かめ（別のセッションで、公開状態・状態の初期選択を外して検索する）は補いとして残す。
  if (dbAvailable) {
    const found = 語を持つ価格履歴("NO-HISTORY-999");
    if (found.length > 0) {
      throw new Error(`事前準備: DBの参照で、NO-HISTORY-999 を商品名(日)・商品名(英)・商品コード・カード名(日)・カード名(英)・備考のどれかに持つ価格履歴が ${found.length} 件ある` +
        `（商品コード ${found.map((r) => r.商品コード).join("・")}）。価格履歴は画面から削除できないので、ケースの前提を満たせない`);
    }
    note("事前準備②: DBの参照で、NO-HISTORY-999 を商品名(日)・商品名(英)・商品コード・カード名(日)・カード名(英)・備考のどれかに持つ価格履歴が0件であることを確かめた（公開状態・状態では絞らない。削除はしていない）");
  } else {
    note("事前準備②: DB確認の接続先が無いので、DBの参照での確かめはしていない（画面での確かめだけ）");
  }
  await withAdminSession(browser, M0323_ADMIN, async (p) => {
    const pre = new PriceHistoryPage(p);
    await pre.open();
    await pre.checkOnly("公開状態", []);
    await pre.checkOnly("状態", []);
    await pre.searchWord("NO-HISTORY-999");
    const n = (await pre.rowValues()).length;
    if (n > 0) throw new Error(`事前準備: NO-HISTORY-999 を持つ価格履歴が ${n} 件ある。価格履歴は画面から削除できないので、ケースの前提を満たせない`);
    note("事前準備②（画面での補い）: 別のセッションで、公開状態・状態の選択を外して NO-HISTORY-999 を検索し、0件であることを確かめた（削除はしていない）");
  });
  const h = await signIn(page);
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await h.商品名等.fill("NO-HISTORY-999"); });
  await step(3, async () => { await h.search(); });
  await expected(async () => {
    note(`検索したあとのアドレス: ${h.path()}、該当なしの表示: ${(await h.該当なし.count()) > 0 ? "あり" : "なし"}`);
    // 検索のアドレスは、ページ番号の付かない「…/search」（ページ番号は既定で1）と、付いた「…/search/2」の両方が同じ検索画面
    expect.soft(h.path(), "買取・販売価格履歴検索画面に留まる").toMatch(/\/product\/buy_sale_price_history(\/search(\/\d+)?)?$/);
    await expect.soft(h.結果, "検索した結果の領域が表示される").toBeVisible();
    await expect.soft(h.行, "検索結果は0件").toHaveCount(0);
    await expect.soft(page.getByRole("link", { name: "CSVダウンロード" }), "CSVダウンロードを選択できない").toHaveCount(0);
    await expect.soft(page.locator(`a[href$="${価格履歴CSVのパス}"]`), "CSVダウンロードの導線が無い").toHaveCount(0);
  });
});

caseTest("IT-M03-23-036", async ({ page, step, expected }) => {
  const h = await signIn(page);
  const downloads: string[] = [];
  page.on("download", (d) => { downloads.push(d.suggestedFilename()); });
  await step(1, async () => {
    let status = 0;
    try {
      status = await h.openAddress(価格履歴CSVのパス);
    } catch (e) {
      // ファイルのダウンロードになると、画面は移らずに開く操作がエラーで終わる
      note(`アドレスを開く操作がエラーで終わった: ${(e as Error).message.split("\n")[0]}`);
    }
    note(`アドレスを開いたときの応答: ${status}、移った先: ${h.path()}`);
  });
  await expected(async () => {
    note(`画面上部のメッセージ: ${(await h.topMessages()).join(" / ") || "なし"}`);
    expect.soft(downloads, "CSVファイルはダウンロードされない").toEqual([]);
    expect.soft(h.path(), "買取・販売価格履歴検索画面へ遷移する").toBe(new URL(adminUrl(価格履歴検索のパス)).pathname);
    await expect.soft(h.form, "買取・販売価格履歴検索画面の検索条件の欄").toBeVisible();
  });
});

// ---- 一部の選択肢だけを選んだ検索 ----

caseTest("IT-M03-23-041", async ({ page, notes, step, expected }) => {
  const h = await signIn(page);
  const alpha = notes.get("〔カードセットID-M0323-共有A〕");
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await h.商品名等.fill("M0323-041-EXP"); });
  await step(3, async () => {
    const candidates = await h.chooseFromSuggest(h.エキスパンション, "履歴セット", "履歴セットAlpha");
    note(`エキスパンションに「履歴セット」と入力したときのサジェストの候補: ${candidates.join("、")}`);
    expect(await h.selectedValues(h.エキスパンション), "エキスパンションで選んだのは履歴セットAlphaだけ").toEqual([alpha]);
  });
  await step(4, async () => { await h.search(); });
  await expected(async () => {
    const got = await listedCodes(h, "検索した結果");
    expect.soft(sorted(got), "M0323-041-A1・M0323-041-A2 の2件だけが表示される").toEqual(["M0323-041-A1", "M0323-041-A2"]);
    expect.soft(got, "M0323-041-B1 は表示されない").not.toContain("M0323-041-B1");
  });
});

caseTest("IT-M03-23-042", async ({ page, step, expected }) => {
  const h = await signIn(page);
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await h.商品名等.fill("M0323-042-LANG"); });
  await step(3, async () => {
    note(`言語の選択肢: ${choiceText(await h.choices("言語"))}`);
    await h.checkOnly("言語", ["日本語"]);
  });
  await step(4, async () => { await h.search(); });
  await expected(async () => {
    const got = await listedCodes(h, "検索した結果");
    expect.soft(got, "M0323-042-JP の1件だけが表示される").toEqual(["M0323-042-JP"]);
    expect.soft(got, "M0323-042-EN は表示されない").not.toContain("M0323-042-EN");
    expect.soft(got, "M0323-042-OT は表示されない").not.toContain("M0323-042-OT");
  });
});
