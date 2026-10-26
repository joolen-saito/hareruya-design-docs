/** M04-19 欠品履歴検索一覧。正本: cases/M04-19_test_cases.tsv */
import fs from "node:fs";
import { Download, Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { adminUrl, loginAdmin } from "../../lib/session";
import { stockEditValue } from "../../pages/admin/m04_19_masters";
import { readOrderEditIds } from "../../pages/admin/m04_19_order_shortage";
import { adminPageTitle, ShortageHistoryPage, 数字だけ, 欠品履歴の行 } from "../../pages/admin/m04_19_shortage_history";
import { idsInAddress, moveIdFieldIfShown } from "../../pages/admin/m04_19_stock_move";
import { M0419_ADMIN } from "../../seeds/m04-19";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 事前準備①: M04-19試験管理者でログインする（テストごとの新しいブラウザセッション。本機能の保持値は無い） */
async function signIn(page: Page): Promise<ShortageHistoryPage> {
  await loginAdmin(page, M0419_ADMIN);
  return new ShortageHistoryPage(page);
}

/** 一覧の、商品コードの行（1行のはず）を読む */
async function rowOf(h: ShortageHistoryPage, code: string): Promise<欠品履歴の行> {
  await expect(h.rowByCode(code), `欠品履歴一覧の「${code}」の行`).toHaveCount(1);
  const hit = (await h.readRows()).filter((r) => r.商品コード === code);
  return hit[0];
}

/**
 * 「1. 在庫履歴検索一覧(検索入力)画面を開く／2. 検索条件をクリアを押す／3. 欠品検索の「欠品履歴一覧を表示」にチェックを付ける／
 *  4. 商品名(日/英）・カード名・商品コードに「語」を入力する／5. 検索ボタンを押す」の手順
 */
async function clearAndSearch(h: ShortageHistoryPage, step: CaseCtx["step"], 語: string): Promise<void> {
  await step(1, () => h.openFromMenu());
  await step(2, () => h.clearConditions());
  await step(3, () => h.checkShortageList());
  await step(4, () => h.fillKeyword(語));
  await step(5, () => h.search());
}

/** 「欠品履歴検索一覧(検索結果)で〈商品コード〉を表示する」: 在庫履歴検索一覧で条件をクリアし、欠品検索で商品コードを検索する */
async function showShortage(h: ShortageHistoryPage, code: string): Promise<void> {
  await h.searchShortage(code);
  await expect(h.rowByCode(code), `欠品履歴検索一覧(検索結果)の「${code}」の行`).toHaveCount(1);
}

/** 「〈語〉を検索する」: 在庫履歴検索一覧(検索入力)画面で欠品検索にチェックを付け、語を入れて検索する（条件はクリアしない） */
async function searchWord(h: ShortageHistoryPage, 語: string): Promise<void> {
  await h.openFromMenu();
  await h.checkShortageList();
  await h.fillKeyword(語);
  await h.search();
}

/** 在庫変動履歴CSVの列（設計書 0202「在庫変動履歴CSV出力」CSV出力項目 識別ID 1〜27） */
const 在庫変動履歴CSVの列 = [
  "商品コード", "商品名", "言語", "状態", "Foil", "店舗", "在庫区分", "登録元", "登録元ID", "変更前在庫", "変更後在庫", "在庫増減数",
  "在庫変動理由区分", "在庫変動理由", "変更時販売価格", "仕入単価", "変更前原価単価", "変更後原価単価", "総原価増減数", "変更前総原価", "変更後総原価",
  "登録日", "登録者", "承認日", "承認者", "最終更新日", "最終更新者",
];

const pageCodes = (語: string) => Array.from({ length: 51 }, (_, i) => `${語}-${String(i + 1).padStart(3, "0")}`);

// ---- 初期表示・表示条件 ----

caseTest("IT-M04-19-001", async ({ page, step, expected }) => {
  const h = await signIn(page);
  await step(1, () => h.openFromMenu());
  await expected(async () => {
    expect.soft(await h.見出し(), "在庫履歴検索一覧(検索入力)画面").toBe("在庫履歴一覧");
    await expect.soft(h.件数の表示, "検索結果の件数の表示（検索が実行されていない）").toHaveCount(0);
    await expect.soft(h.該当なしの表示, "該当なしの表示（検索が実行されていない）").toHaveCount(0);
    await expect.soft(h.rows, "欠品履歴一覧の行（空）").toHaveCount(0);
  });
});

caseTest("IT-M04-19-002", async ({ page, step, expected }) => {
  const h = await signIn(page);
  await step(1, () => h.openFromMenu());
  await step(2, () => h.clearConditions());
  await step(3, () => h.checkShortageList());
  await step(4, () => h.search());
  await expected(async () => {
    await expect.soft(h.件数の表示, "検索結果の件数の表示").toBeVisible();
    await expect.soft(h.list, "検索結果の一覧").toBeVisible();
    const heads = await h.見出しの列();
    note(`一覧の見出し: ${heads.join("・")}`);
    for (const k of ["欠品点数", "欠品時販売価格", "欠品理由"]) expect.soft(heads, `欠品履歴検索一覧(検索結果)の列「${k}」`).toContain(k);
    // FILTER-HQ-002 の行があるかどうかは期待結果の外。一覧は商品コードの降順で、表示件数は既定50件なので、
    // コードが後ろに並ぶ欠品履歴（M419-PAGE-… など）が50件以上あれば1ページ目に出ない。確かめずに注記に残す
    note(`FILTER-HQ-002 の行: このページに ${await h.rowByCode("FILTER-HQ-002").count()} 件（件数の表示 ${await h.件数() ?? "なし"} 件・今のページ ${await h.今のページ() ?? "ページ送りなし"}）`);
  });
});

// ---- 欠品時販売価格 ----

caseTest("IT-M04-19-007", async ({ page, notes, step, expected }) => {
  const h = await signIn(page);
  await clearAndSearch(h, step, "M419-DISPLAY-007");
  await expected(async () => {
    const r = await rowOf(h, "M419-DISPLAY-007");
    note(`行: ${JSON.stringify(r)}`);
    expect.soft(r.登録元, "受注の欠品履歴（登録元）").toContain("受注");
    expect.soft(r.登録元ID, "受注の欠品履歴（登録元IDが受注ID）").toBe(notes.get("〔受注ID-M0419-007〕"));
    expect.soft(数字だけ(r.欠品時販売価格), `欠品時販売価格（表示「${r.欠品時販売価格}」）`).toBe("1980");
  });
});

caseTest("IT-M04-19-008", async ({ page, notes, step, expected }) => {
  const h = await signIn(page);
  await clearAndSearch(h, step, "M419-MOVE-008");
  await expected(async () => {
    const r = await rowOf(h, "M419-MOVE-008");
    note(`行: ${JSON.stringify(r)}`);
    expect.soft(r.登録元, "移動の欠品履歴（登録元）").toContain("在庫移動");
    expect.soft(r.登録元ID, "移動の欠品履歴（登録元IDが在庫移動振替ID）").toBe(notes.get("〔在庫移動振替ID-M0419-008〕"));
    expect.soft(数字だけ(r.欠品時販売価格), `欠品時販売価格（表示「${r.欠品時販売価格}」）`).toBe("2500");
  });
});

caseTest("IT-M04-19-036", async ({ page, notes, step, expected }) => {
  const h = await signIn(page);
  await clearAndSearch(h, step, "M0419-MIX-036");
  await expected(async () => {
    const rows = await h.readRows();
    note(`行: ${JSON.stringify(rows)}`);
    expect.soft(rows.length, "欠品履歴検索一覧(検索結果)の行の数").toBe(2);
    const ord = rows.filter((r) => r.商品コード === "M0419-MIX-036-ORD");
    const mov = rows.filter((r) => r.商品コード === "M0419-MIX-036-MOV");
    expect.soft(ord.length, "M0419-MIX-036-ORD の行").toBe(1);
    expect.soft(mov.length, "M0419-MIX-036-MOV の行").toBe(1);
    if (ord[0]) {
      expect.soft(ord[0].登録元ID, "受注由来の行の登録元ID（受注ID）").toBe(notes.get("〔受注ID-M0419-036〕"));
      expect.soft(数字だけ(ord[0].欠品時販売価格), `M0419-MIX-036-ORD の欠品時販売価格（表示「${ord[0].欠品時販売価格}」）`).toBe("1980");
    }
    if (mov[0]) {
      expect.soft(mov[0].登録元ID, "移動由来の行の登録元ID（在庫移動振替ID）").toBe(notes.get("〔在庫移動振替ID-M0419-036M〕"));
      expect.soft(数字だけ(mov[0].欠品時販売価格), `M0419-MIX-036-MOV の欠品時販売価格（表示「${mov[0].欠品時販売価格}」）`).toBe("2500");
    }
  });
});

// ---- リンク ----

caseTest("IT-M04-19-009", async ({ page, notes, step, expected }) => {
  const h = await signIn(page);
  const code = "M419-DISPLAY-009";
  let popup: Page | null = null;
  await step(1, () => showShortage(h, code));
  await step(2, async () => {
    const r = await rowOf(h, code);
    expect(r.商品名, "商品名のリンクの文字").toBe("欠品表示商品");
    popup = await h.openProductNameLink(h.rowByCode(code));
    note(`別タブで開いた画面: ${popup.url()}`);
  });
  await expected(async () => {
    expect(popup, "商品名のリンクで別タブが開いた").not.toBeNull();
    const p = popup!;
    expect.soft(await adminPageTitle(p), "在庫編集画面").toBe("在庫編集");
    expect.soft(await stockEditValue(p, "商品ID"), "在庫編集画面の商品ID").toBe(notes.get("〔商品ID-M0419-009〕"));
    expect.soft(await stockEditValue(p, "商品規格ID"), "在庫編集画面の商品規格ID").toBe(notes.get("〔商品規格ID-M0419-009〕"));
    expect.soft(await stockEditValue(p, "在庫ID"), "在庫編集画面の在庫ID（対象の商品在庫）").toBe(notes.get("〔在庫ID-M0419-009〕"));
    expect.soft(await stockEditValue(p, "商品コード"), "在庫編集画面の商品コード").toBe(code);
  });
});

caseTest("IT-M04-19-010", async ({ page, notes, step, expected }) => {
  const h = await signIn(page);
  const code = "M419-DISPLAY-010";
  const 受注ID = notes.get("〔受注ID-M0419-010〕");
  let popup: Page | null = null;
  await step(1, () => showShortage(h, code));
  await step(2, async () => {
    const r = await rowOf(h, code);
    expect(r.登録元ID, "登録元IDのリンクの文字").toBe(受注ID);
    expect(r.履歴ID, "行の履歴ID").toBe(notes.get("〔履歴ID-M0419-010〕"));
    popup = await h.openSourceIdLink(h.rowByCode(code));
    note(`別タブで開いた画面: ${popup.url()}`);
  });
  await expected(async () => {
    expect(popup, "登録元IDのリンクで別タブが開いた").not.toBeNull();
    const p = popup!;
    expect.soft(new URL(p.url()).pathname, "受注編集画面（受注IDの受注情報編集）").toMatch(new RegExp(`/order/${受注ID}/edit$`));
    const ids = await readOrderEditIds(p, "別タブの受注編集画面");
    expect.soft(ids.注文番号, "受注編集画面の注文番号").toBe(notes.get("〔注文番号-M0419-010〕"));
  });
});

caseTest("IT-M04-19-011", async ({ page, notes, step, expected }) => {
  const h = await signIn(page);
  const code = "M419-MOVE-011";
  const moveId = notes.get("〔在庫移動振替ID-M0419-011〕");
  let popup: Page | null = null;
  await step(1, () => showShortage(h, code));
  await step(2, async () => {
    const r = await rowOf(h, code);
    expect(r.登録元ID, "登録元IDのリンクの文字").toBe(moveId);
    expect(r.履歴ID, "行の履歴ID").toBe(notes.get("〔履歴ID-M0419-011〕"));
    popup = await h.openSourceIdLink(h.rowByCode(code));
    note(`別タブで開いた画面: ${popup.url()}（見出し「${await adminPageTitle(popup)}」）`);
  });
  await expected(async () => {
    expect(popup, "登録元IDのリンクで別タブが開いた").not.toBeNull();
    const p = popup!;
    expect.soft(await adminPageTitle(p), "在庫分割結合画面").toMatch(/在庫分割|在庫結合/);
    // どの在庫移動振替IDの画面かは、別タブのアドレスの番号の部分を完全一致で比べる（本文のどこかに同じ数字の並びがあるだけでは合格にしない）
    expect.soft(idsInAddress(p), `在庫移動振替ID ${moveId} の画面（アドレス ${new URL(p.url()).pathname} の番号）`).toEqual([moveId]);
    const shown = await moveIdFieldIfShown(p);
    note(`別タブの画面の「在庫移動・振替ID」の欄: ${shown ?? "なし"}`);
  });
});

// ---- 状態の表示 ----

caseTest("IT-M04-19-014", async ({ page, step, expected }) => {
  const h = await signIn(page);
  const code = "M419-STATE-MEMO-014";
  let 状態 = "";
  await step(1, () => showShortage(h, code));
  await step(2, async () => { 状態 = (await rowOf(h, code)).状態; note(`状態欄: 「${状態}」`); });
  await expected(async () => {
    expect(状態, "状態欄（規格拡張のメモ）").toBe("サイン入り");
  });
});

caseTest("IT-M04-19-015", async ({ page, step, expected }) => {
  const h = await signIn(page);
  const code = "M419-STATE-NOMEMO-015";
  let 状態 = "";
  await step(1, () => showShortage(h, code));
  await step(2, async () => { 状態 = (await rowOf(h, code)).状態; note(`状態欄: 「${状態}」`); });
  await expected(async () => {
    expect(状態, "状態欄（状態名）").toBe("NM");
  });
});

// ---- 0件 ----

caseTest("IT-M04-19-018", async ({ page, step, expected }) => {
  const h = await signIn(page);
  await clearAndSearch(h, step, "NO-HISTORY-M419");
  await expected(async () => {
    note(`一覧の場所の案内: ${(await h.一覧の場所の案内()).join(" / ") || "なし"}`);
    expect.soft(await h.件数(), "検索結果の件数").toBe(0);
    await expect.soft(h.list, "欠品履歴一覧").toHaveCount(0);
    await expect.soft(h.rows, "欠品履歴一覧の行").toHaveCount(0);
  });
});

// ---- 表示件数・ページ送り ----

caseTest("IT-M04-19-019", async ({ page, step, expected }) => {
  const h = await signIn(page);
  let 選択肢: { 表示: string; 選択中: boolean }[] = [];
  await step(1, async () => { await h.openFromMenu(); await h.checkShortageList(); });
  await step(2, () => h.fillKeyword("M419-PAGE-019"));
  await step(3, () => h.search());
  await step(4, async () => {
    選択肢 = await h.表示件数の選択肢();
    note(`表示件数の選択肢: ${選択肢.map((o) => `${o.表示}${o.選択中 ? "（選択中）" : ""}`).join("・")}`);
  });
  await expected(async () => {
    const labels = 選択肢.map((o) => o.表示);
    expect.soft(labels, "表示件数の選択肢に10件").toContain("10件");
    expect.soft(labels, "表示件数の選択肢に50件").toContain("50件");
    expect.soft(選択肢.filter((o) => o.選択中).map((o) => o.表示), "初期値として選ばれている表示件数").toEqual(["50件"]);
  });
});

caseTest("IT-M04-19-020", async ({ page, step, expected }) => {
  const h = await signIn(page);
  await step(1, async () => { await h.openFromMenu(); await h.checkShortageList(); });
  await step(2, async () => { await h.fillKeyword("M419-PAGE-020"); await h.search(); });
  await step(3, () => h.choosePageCount("10件"));
  await step(4, () => h.gotoPage(2));
  await expected(async () => {
    await expect.soft(h.商品名などの欄, "商品コードの条件「M419-PAGE-020」が保持される").toHaveValue("M419-PAGE-020");
    expect.soft(await h.選択中の表示件数(), "表示件数10件が保持される").toBe("10件");
    expect.soft(await h.今のページ(), "2ページ目").toBe("2");
    const codes = await h.codes();
    note(`2ページ目の商品コード: ${codes.join("・")}`);
    expect.soft(codes.length, "2ページ目の欠品履歴の数").toBe(10);
    expect.soft(codes.every((c) => c.startsWith("M419-PAGE-020-")), "2ページ目の欠品履歴は M419-PAGE-020 のもの").toBe(true);
  });
});

caseTest("IT-M04-19-021", async ({ page, step, expected }) => {
  const h = await signIn(page);
  await step(1, () => searchWord(h, "M419-PAGE-021"));
  await step(2, () => h.choosePageCount("10件"));
  await step(3, async () => { await h.sendPageCountRequest("999"); note("表示件数の変更の要求の件数を999に変えて送った"); });
  await expected(async () => {
    expect.soft(await h.選択中の表示件数(), "保持済みの10件が選ばれている（999件は採用されない）").toBe("10件");
    const codes = await h.codes();
    expect.soft(codes.length, "一覧の行の数（10件で表示）").toBe(10);
    expect.soft(codes.every((c) => c.startsWith("M419-PAGE-021-")), "欠品履歴一覧は M419-PAGE-021 のもの").toBe(true);
  });
});

caseTest("IT-M04-19-022", async ({ page, step, expected }) => {
  const h = await signIn(page);
  await step(1, () => h.openFromMenu());
  await step(2, async () => { await h.checkShortageList(); await h.fillKeyword("M419-PAGE-022"); await h.search(); });
  await step(3, async () => { await h.sendPageCountRequest("999"); note("表示件数の変更の要求の件数を999に変えて送った"); });
  await expected(async () => {
    expect.soft(await h.選択中の表示件数(), "既定の50件が選ばれている（999件は採用されない）").toBe("50件");
    const codes = await h.codes();
    expect.soft(codes.length, "一覧の行の数（50件で表示）").toBe(50);
    expect.soft(codes.every((c) => c.startsWith("M419-PAGE-022-")), "欠品履歴一覧は M419-PAGE-022 のもの").toBe(true);
  });
});

caseTest("IT-M04-19-023", async ({ page, step, expected }) => {
  const h = await signIn(page);
  await step(1, () => searchWord(h, "M419-PAGE-023"));
  await step(2, async () => {
    const chosen = await h.選択中の表示件数();
    note(`表示件数: ${chosen}`);
    expect(chosen, "表示件数が50件").toBe("50件");
  });
  await step(3, () => h.gotoPage(2));
  await expected(async () => {
    expect.soft(await h.件数(), "再検索の結果の件数").toBe(51);
    expect.soft(await h.今のページ(), "2ページ目").toBe("2");
    const codes = await h.codes();
    note(`2ページ目の商品コード: ${codes.join("・")}`);
    expect.soft(codes, "2ページ目に移動先範囲の M419-PAGE-023-001").toContain("M419-PAGE-023-001");
  });
});

caseTest("IT-M04-19-024", async ({ page, step, expected }) => {
  const h = await signIn(page);
  let first: string[] = [];
  let second: string[] = [];
  await step(1, () => searchWord(h, "M419-PAGE-024"));
  await step(2, async () => {
    const chosen = await h.選択中の表示件数();
    note(`表示件数: ${chosen}`);
    expect(chosen, "表示件数が50件").toBe("50件");
  });
  await step(3, async () => { first = await h.codes(); note(`1ページ目（${first.length}件）: ${first.join("・")}`); });
  await step(4, async () => { await h.gotoPage(2); second = await h.codes(); note(`2ページ目（${second.length}件）: ${second.join("・")}`); });
  await expected(async () => {
    const all = [...first, ...second];
    expect.soft(all.length, "2ページを通した欠品履歴の数").toBe(51);
    expect.soft(new Set(all).size, "重複なく1回ずつ").toBe(all.length);
    expect.soft([...all].sort(), "欠落なく M419-PAGE-024-001〜051").toEqual(pageCodes("M419-PAGE-024"));
  });
});

caseTest("IT-M04-19-026", async ({ page, step, expected }) => {
  const h = await signIn(page);
  await step(1, () => searchWord(h, "M419-PAGE-026"));
  await step(2, () => h.choosePageCount("10件"));
  await step(3, () => h.gotoPage(2));
  await step(4, () => h.openFromMenu());
  await expected(async () => {
    expect.soft(await h.見出し(), "在庫履歴検索一覧(検索入力)画面").toBe("在庫履歴一覧");
    await expect.soft(h.商品名などの欄, "検索欄に M419-PAGE-026 が出ていない").toHaveValue("");
    await expect.soft(h.件数の表示, "検索結果の件数の表示が無い（一覧が空）").toHaveCount(0);
    await expect.soft(h.rows, "一覧が空で表示される（行が無い）").toHaveCount(0);
    // メニューからの初期表示は、保持値に関係なく、いつも一覧を出さず、検索欄も空で出す。この画面だけでは、保持値が消えたかどうかを区別できない。
    // そこで、他の画面から戻ったときの表示（保持している検索条件とページ番号を元に戻して出す表示）を開き、
    // M419-PAGE-026 の検索条件と2ページ目が戻ってこないことを見る。検索し直す前に開く（検索し直すと検索条件が保持されるため）
    const back = await h.戻りの表示を開く();
    note(`他の画面から戻ったときの表示（欠品理由を保存したあとの戻り先と同じアドレス）を開いた: ${back.応答}・${back.秒}秒`);
    expect.soft(back.開けた, `他の画面から戻ったときの表示が開けた（開けないと、M419-PAGE-026 の検索条件と2ページ目の指定が残らないことを画面で確かめられない。${back.応答}）`).toBe(true);
    if (back.開けた) {
      await expect.soft(h.商品名などの欄, "戻ったときの検索欄に M419-PAGE-026 が残っていない").toHaveValue("");
      expect.soft(await h.欠品検索にチェックがある(), "戻ったときの欠品検索のチェックが残っていない").toBe(false);
      const ページ = await h.今のページ();
      note(`戻ったときのページ送りの今のページ: ${ページ ?? "ページ送りなし"}・件数の表示: ${(await h.件数()) ?? "なし"}`);
      expect.soft(ページ === null || ページ === "1", `戻ったときのページは1（2ページ目の指定が残っていない。今のページ: ${ページ ?? "ページ送りなし"}）`).toBe(true);
      const 残った行 = (await h.codes()).filter((c) => c.startsWith("M419-PAGE-026-"));
      expect.soft(残った行, "戻ったときの一覧に M419-PAGE-026 の2ページ目（M419-PAGE-026 の行）が出ない").toEqual([]);
    }
    // 初期表示の画面には一覧が無く、表示件数の欄も出ない。もう一度メニューから開き、同じ語で検索し直して、選ばれる表示件数を見る
    note("表示件数は初期表示の画面に出ないので、メニューから在庫履歴一覧を開き直し、欠品検索にチェックを付けて M419-PAGE-026 で検索し直し、選ばれた表示件数を見た");
    await page.goto(adminUrl("/"));
    await h.openFromMenu();
    await h.checkShortageList();
    await h.fillKeyword("M419-PAGE-026");
    await h.search();
    expect.soft(await h.選択中の表示件数(), "表示件数が50件").toBe("50件");
    expect.soft((await h.codes()).length, "検索し直した一覧の行の数（50件で表示）").toBe(50);
  });
});

// ---- 計算・CSV ----

caseTest("IT-M04-19-027", async ({ page, notes, step, expected }) => {
  const h = await signIn(page);
  await step(1, async () => { await h.openFromMenu(); await h.checkShortageList(); });
  await step(2, () => h.fillKeyword("M419-CALC-027"));
  await step(3, () => h.search());
  await expected(async () => {
    const r = await rowOf(h, "M419-CALC-027");
    note(`行: ${JSON.stringify(r)}`);
    expect.soft(r.履歴ID, "履歴ID").toBe(notes.get("〔履歴ID-M0419-027〕"));
    expect.soft(数字だけ(r.欠品点数), "記録済みの欠品点数（現在の在庫数10から再計算されない）").toBe("2");
    expect.soft(数字だけ(r.欠品時販売価格), `記録済みの欠品時販売価格（現在の販売価格2000から再計算されない。表示「${r.欠品時販売価格}」）`).toBe("1300");
  });
});

caseTest("IT-M04-19-028", async ({ page, notes, step, expected }) => {
  const h = await signIn(page);
  // 事前準備①の「ダウンロード履歴から本ケースより前のCSVを消去する」: テストごとの新しいブラウザセッションで、ダウンロードは0件から数える
  const downloads: Download[] = [];
  page.on("download", (d) => { downloads.push(d); });
  await step(1, async () => { await h.openFromMenu(); await h.checkShortageList(); });
  await step(2, () => h.fillKeyword("M419-DISPLAY-028"));
  await step(3, async () => {
    await h.search();
    expect(await h.historyIdOf(h.rowByCode("M419-DISPLAY-028")), "一覧の欠品履歴の履歴ID").toBe(notes.get("〔履歴ID-M0419-028〕"));
  });
  await step(4, async () => { await h.downloadCsv(); });
  await step(5, async () => {
    await page.waitForTimeout(3_000);
    note(`ダウンロードされたファイル: ${downloads.map((d) => d.suggestedFilename()).join("・") || "なし"}`);
  });
  await expected(async () => {
    expect.soft(downloads.length, "出力されたCSVの数").toBe(1);
    if (downloads[0]) {
      const file = await downloads[0].path();
      const rows = parseCsv(decodeCsvBytes(fs.readFileSync(file)));
      note(`CSVの見出し: ${(rows[0] ?? []).join(",")}／明細 ${rows.length - 1} 行`);
      expect.soft(rows[0], "在庫変動履歴CSVの列（設計書 0202「在庫変動履歴CSV出力」の識別ID 1〜27）").toEqual(在庫変動履歴CSVの列);
    }
  });
});

// ---- 検索条件なし・並び順 ----

caseTest("IT-M04-19-033", async ({ page, step, expected }) => {
  const h = await signIn(page);
  await step(1, async () => {
    // ログイン直後に、検索条件を含めずページ番号2だけを指定した要求（欠品履歴検索一覧(検索結果)のページ送りの送り先）を送る
    const res = await page.goto(adminUrl("/product/stock/history/page/2"));
    await h.ready();
    note(`要求の応答: ${res?.status()}（${page.url()}）`);
  });
  await expected(async () => {
    expect.soft(await h.見出し(), "在庫履歴検索一覧の画面").toBe("在庫履歴一覧");
    await expect.soft(h.件数の表示, "検索結果の件数の表示（検索が実行されない）").toHaveCount(0);
    await expect.soft(h.rows, "欠品履歴一覧の行（空）").toHaveCount(0);
    await expect.soft(h.rowByCode("M0419-033-A"), "M0419-033-A の行").toHaveCount(0);
  });
});

/** 034・035: 並び順の送信値を「invalid」に変えて検索ボタンを押す（手順5）。並び順を送る欄が無ければ変えられない */
async function badSortSteps(h: ShortageHistoryPage, step: CaseCtx["step"], 語: string): Promise<() => boolean> {
  let sent = false;
  await step(1, () => h.openFromMenu());
  await step(2, () => h.clearConditions());
  await step(3, () => h.checkShortageList());
  await step(4, () => h.fillKeyword(語));
  await step(5, async () => {
    if ((await h.sortFields().count()) === 0) {
      note("検索欄に並び順を送る欄が無い（検索のフォームは並び順を送らない）。並び順の送信値を「invalid」に変えられないので、検索ボタンは押していない");
      return;
    }
    await h.setSortValue("invalid");
    note("並び順を送る欄の値を「invalid」に変えた");
    await h.search();
    sent = true;
  });
  return () => sent;
}

caseTest("IT-M04-19-034", async ({ page, step, expected }) => {
  const h = await signIn(page);
  const sent = await badSortSteps(h, step, "M0419-034");
  await expected(async () => {
    // 並び順を変えて送れないまま、元の画面を見て合格にしない（期待結果は送った結果を見るもの）
    expect.soft(sent(), "並び順の送信値を「invalid」に変えて検索ボタンを押した").toBe(true);
    await expect.soft(h.件数の表示, "検索結果件数の表示（初期表示に戻る）").toHaveCount(0);
    await expect.soft(h.rows, "欠品履歴一覧の行（初期表示に戻る）").toHaveCount(0);
    await expect.soft(h.rowByCode("M0419-034-A"), "M0419-034-A の行").toHaveCount(0);
  });
});

caseTest("IT-M04-19-035", async ({ page, step, expected }) => {
  const h = await signIn(page);
  const sent = await badSortSteps(h, step, "M0419-035");
  await expected(async () => {
    expect.soft(sent(), "並び順の送信値を「invalid」に変えて検索ボタンを押した").toBe(true);
    const m = await h.上部のメッセージ();
    note(`画面上部のメッセージ: エラー「${m.エラー.join(" / ") || "なし"}」警告「${m.警告.join(" / ") || "なし"}」`);
    expect.soft(m.エラー.some((t) => t.includes("並び順")), "管理画面上部に並び順に関するエラー").toBe(true);
  });
});
