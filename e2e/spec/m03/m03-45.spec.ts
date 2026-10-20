/** M03-45 カテゴリ一覧。正本: cases/M03-45_test_cases.tsv */
import { Dialog, expect, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { CaseBody, caseTest } from "../../lib/case";
import { 名称のカテゴリ } from "../../db/category";
import { カテゴリの件数, 表示順 } from "../../db/m03_45_category";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import { CategoryRow } from "../../pages/admin/category";
import {
  CategoryListPage, categoryEditUrl, categoryListUrl, ensureCategoryCsvOutputs, TreeItem,
} from "../../pages/admin/m03_45_category_list";
import { CATEGORY_CSV_ITEMS, M0345_ADMIN } from "../../seeds/m03-45";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 正本の「商品管理権限を持つ管理者としてログイン済み」 */
async function signIn(page: Page): Promise<CategoryListPage> {
  await loginAdmin(page, M0345_ADMIN);
  return new CategoryListPage(page);
}

/** 表示中の画面URLの中のカテゴリIDを置き換えて開き、応答の状態を返す */
async function openReplaced(page: Page, from: string, to: string, url: (id: string) => string): Promise<number> {
  const want = url(from);
  if (page.url() !== want) throw new Error(`表示中の画面URLが ${want} ではない（${page.url()}）`);
  const res = await page.goto(url(to));
  await page.waitForLoadState("load");
  return res?.status() ?? 0;
}

const rowText = (r: CategoryRow) => `ID ${r.id}「${r.nameJp}」・「${r.nameEn}」`;

// ---- 画面の部品 ----

caseTest("IT-M03-45-001", async ({ page, step, expected }) => {
  const list = await signIn(page);
  await step(1, () => list.openTop());
  await step(2, async () => {
    await expect(list.topArea(), "画面上部の操作部").toBeVisible();
    note(`画面上部の操作部のボタン: ${(await list.topButtonTexts()).join("、") || "なし"}`);
  });
  await expected(async () => {
    await expect.soft(list.controlsMatching(/サイドメニュー\s*json\s*出力/i), "「サイドメニューjson出力」ボタン").toHaveCount(0);
    await expect.soft(page.getByText(/サイドメニュー\s*json\s*出力/i), "「サイドメニューjson出力」の表示").toHaveCount(0);
  });
});

caseTest("IT-M03-45-002", async ({ page, notes, step, expected }) => {
  const list = await signIn(page);
  const b = notes.get("〔カテゴリID-M0345-002B〕");
  await step(1, () => list.openChildrenOf(notes.get("〔カテゴリID-M0345-002A〕")));
  await step(2, async () => {
    await expect(list.rowById(b), "ID 002B の一覧行").toHaveCount(1);
    const r = (await list.rowValues()).find((v) => v.id === b)!;
    note(`一覧行: ${rowText(r)}（直下の行がこの1件なので、上移動・下移動は押せない状態で表示される）`);
  });
  await expected(async () => {
    const p = list.rowParts(b);
    // 三点リーダー（画面項目定義 識別ID 4）は、設計書のレイアウト図で番号4が指す、行頭の三本線のアイコン（ドラッグ用のつまみ）
    await expect.soft(p.handle, "三点リーダー（行頭のドラッグ用のつまみ）").toBeVisible();
    await expect.soft(p.up, "表示順入替ボタン（上移動）").toBeVisible();
    await expect.soft(p.down, "表示順入替ボタン（下移動）").toBeVisible();
    await expect.soft(p.edit, "編集ボタン").toBeVisible();
    await expect.soft(p.delete, "削除ボタン").toBeVisible();
  });
});

caseTest("IT-M03-45-003", async ({ page, step, expected }) => {
  const list = await signIn(page);
  await step(1, () => list.openTop());
  await step(2, async () => {
    await expect(list.topArea(), "画面上部の操作部").toBeVisible();
    note(`画面上部の操作部のボタン: ${(await list.topButtonTexts()).join("、") || "なし"}`);
  });
  await expected(async () => {
    await expect.soft(list.topButton("CSVダウンロード"), "CSVダウンロードボタン").toBeVisible();
    await expect.soft(list.topButton("CSV出力項目設定"), "CSV出力項目設定ボタン").toBeVisible();
  });
});

// ---- 一覧とカテゴリツリー ----

caseTest("IT-M03-45-004", async ({ page, notes, step, expected }) => {
  const list = await signIn(page);
  const id = (k: string) => notes.get(`〔カテゴリID-M0345-共有${k}〕`);
  let rows: string[] = [];
  await step(1, () => list.openTop());
  await step(2, async () => {
    rows = await list.listIds();
    // カテゴリツリーは初めは閉じているので、外側の枝から順に開いて第5階層まで見る
    if ((await list.treeLink(id("G")).count()) === 1) await list.revealInTree(id("G"));
    else note("カテゴリツリーに ID 共有G の項目が無い");
  });
  await expected(async () => {
    expect.soft(rows.includes(id("A")), "一覧にルート直下の ID 共有A").toBe(true);
    expect.soft(rows.includes(id("B")), "一覧にルート直下の ID 共有B").toBe(true);
    for (const k of ["A", "C", "E", "F", "G"]) await expect.soft(list.treeLink(id(k)), `カテゴリツリーの ID 共有${k}`).toBeVisible();
    if ((await list.treeLink(id("G")).count()) === 1) {
      expect.soft(await list.treeAncestors(id("G")), "ID 共有G は 共有A＞共有C＞共有E＞共有F の枝の中（第5階層）")
        .toEqual([id("A"), id("C"), id("E"), id("F")]);
    }
  });
});

caseTest("IT-M03-45-005", async ({ page, notes, step, expected }) => {
  const list = await signIn(page);
  const b = notes.get("〔カテゴリID-M0345-005B〕");
  const c = notes.get("〔カテゴリID-M0345-005C〕");
  let rows: CategoryRow[] = [];
  await step(1, () => list.openChildrenOf(notes.get("〔カテゴリID-M0345-005A〕")));
  await step(2, async () => { rows = await list.rowValues(); });
  await expected(async () => {
    note(`一覧行: ${rows.map(rowText).join("、") || "なし"}`);
    expect(rows.map(rowText).sort(), "一覧は ID 005B と ID 005C の2行だけ").toEqual([
      `ID ${b}「子カテゴリA1-005」・「ChildCategoryA1-005」`,
      `ID ${c}「子カテゴリA2-005」・「ChildCategoryA2-005」`,
    ].sort());
  });
});

caseTest("IT-M03-45-006", async ({ page, notes, step, expected }) => {
  const list = await signIn(page);
  const b = notes.get("〔カテゴリID-M0345-006B〕");
  const c = notes.get("〔カテゴリID-M0345-006C〕");
  await step(1, () => list.openChildrenOf(notes.get("〔カテゴリID-M0345-006A〕")));
  await step(2, async () => {
    await expect(list.nameLink(b), "ID 006B のカテゴリ名").toHaveText("子カテゴリA1-006");
    await list.follow(list.nameLink(b), "ID 006B のカテゴリ名「子カテゴリA1-006」");
  });
  await expected(async () => {
    expect(page.url(), "ID 006B を親カテゴリとするカテゴリ一覧画面").toBe(categoryListUrl(b));
    expect.soft(await list.subTitle(), "画面名").toBe("カテゴリ一覧");
    expect.soft(await list.listIds(), "一覧は ID 006B の直下の ID 006C").toEqual([c]);
  });
});

caseTest("IT-M03-45-007", async ({ page, notes, step, expected }) => {
  const list = await signIn(page);
  let rows: string[] = [];
  await step(1, () => list.openChildrenOf(notes.get("〔カテゴリID-M0345-007〕")));
  await step(2, async () => {
    rows = await list.listIds();
    note(`一覧部分の表示: ${(await list.noDataMessage().allInnerTexts()).join(" / ") || "なし"}`);
  });
  await expected(async () => {
    expect.soft(rows, "一覧の行").toEqual([]);
    await expect.soft(list.listContainer(), "一覧の行の枠").toHaveCount(0);
    await expect.soft(list.listFootnote(), "一覧の下の、並べ替えの操作の説明").toHaveCount(0);
    await expect.soft(list.noDataMessage(), "データが無い旨").toBeVisible();
    await expect.soft(list.noDataMessage(), "データが無い旨の文").toHaveText(/データが(ありません|無い|ない)/);
  });
});

caseTest("IT-M03-45-008", async ({ page, notes, step, expected }) => {
  const list = await signIn(page);
  const id = (k: string) => notes.get(`〔カテゴリID-M0345-共有${k}〕`);
  const items: Record<string, TreeItem> = {};
  await step(1, () => list.openTop());
  await step(2, async () => {
    // 閉じた枝の中の件数は見えないので、外側の枝から順に開いて見る
    await list.revealInTree(id("G"));
    for (const k of ["A", "B", "C", "D", "E", "F", "G"]) items[k] = await list.treeItem(id(k));
    note(`カテゴリツリーの表示: ${Object.values(items).map((t) => `ID:${t.id} ${t.name} (${t.count})`).join("、")}`);
  });
  await expected(async () => {
    const want: Record<string, string> = { A: "2", C: "1", E: "1", F: "1", D: "0", G: "0", B: "0" };
    for (const [k, n] of Object.entries(want)) {
      await expect.soft(list.treeLink(id(k)), `カテゴリツリーの ID 共有${k}`).toBeVisible();
      expect.soft(items[k]?.count, `ID 共有${k} の後ろの件数`).toBe(n);
    }
  });
});

caseTest("IT-M03-45-009", async ({ page, notes, step, expected }) => {
  const list = await signIn(page);
  const a = notes.get("〔カテゴリID-M0345-009A〕");
  const b = notes.get("〔カテゴリID-M0345-009B〕");
  let open: string[] = [];
  let toggleA: { collapsedMark: boolean; expanded: string | null } | null = null;
  await step(1, () => list.openTop());
  await step(2, async () => {
    open = await list.openBranchIds();
    toggleA = await list.toggleState(a);
    note(`開いている枝: ${open.join("、") || "なし"}／ID 009A のつまみ: ${toggleA.collapsedMark ? "閉じた印" : "開いた印"}`);
  });
  await expected(async () => {
    expect.soft(open, "カテゴリツリーで開いている枝").toEqual([]);
    expect.soft(toggleA?.collapsedMark, "ID 009A のつまみは閉じた印").toBe(true);
    expect.soft(await list.isBranchOpen(a), "ID 009A の枝").toBe(false);
    await expect.soft(list.treeLink(a), "ID 009A は見える").toBeVisible();
    await expect.soft(list.treeLink(b), "子カテゴリ ID 009B は閉じた枝の中で見えない").toBeHidden();
  });
});

caseTest("IT-M03-45-010", async ({ page, notes, step, expected }) => {
  const list = await signIn(page);
  const id = (k: string) => notes.get(`〔カテゴリID-M0345-共有${k}〕`);
  let open: string[] = [];
  await step(1, () => list.openChildrenOf(id("F")));
  await step(2, async () => {
    open = await list.openBranchIds();
    note(`開いている枝: ${open.join("、") || "なし"}（ID 共有F の枝は ${open.includes(id("F")) ? "開いている" : "閉じている"}）`);
  });
  await expected(async () => {
    // 共有F までの経路の枝（共有A・共有C・共有E）だけが開く。表示中の共有F 自身の枝も、経路の外なので開いていれば違う
    note(`ID 共有G（共有F の子）は、カテゴリツリーで ${(await list.treeLink(id("G")).isVisible()) ? "見える" : "見えない"}`);
    expect.soft(open, "開いている枝").toEqual([id("A"), id("C"), id("E")]);
    await expect.soft(list.treeLink(id("F")), "ID 共有F まで見える").toBeVisible();
    for (const k of ["D", "B"]) {
      expect.soft(await list.isBranchOpen(id(k)), `ID 共有${k} の枝`).toBe(false);
      expect.soft((await list.toggleState(id(k))).expanded, `ID 共有${k} のつまみは開いた状態でない`).not.toBe("true");
    }
  });
});

// ---- 編集画面への遷移 ----

caseTest("IT-M03-45-011", async ({ page, notes, step, expected }) => {
  const list = await signIn(page);
  const b = notes.get("〔カテゴリID-M0345-011B〕");
  await step(1, () => list.openChildrenOf(notes.get("〔カテゴリID-M0345-011A〕")));
  await step(2, () => list.follow(list.rowParts(b).edit, "ID 011B の編集ボタン"));
  await expected(async () => {
    expect(page.url(), "ID 011B のカテゴリ編集画面").toBe(categoryEditUrl(b));
    await expect.soft(list.submit, "カテゴリ編集画面の「カテゴリ更新」").toHaveText(/^\s*カテゴリ更新\s*$/);
    await expect.soft(list.nameJp, "編集対象のカテゴリ名(日)").toHaveValue("子カテゴリA1-011");
  });
});

caseTest("IT-M03-45-012", async ({ page, notes, step, expected }) => {
  const list = await signIn(page);
  const a = notes.get("〔カテゴリID-M0345-012A〕");
  const b = notes.get("〔カテゴリID-M0345-012B〕");
  const c = notes.get("〔カテゴリID-M0345-012C〕");
  let rows: string[] = [];
  let crumbs: { text: string; href: string }[] = [];
  await step(1, () => list.openChildrenOf(a));
  await step(2, () => list.follow(list.rowParts(b).edit, "ID 012B の編集ボタン"));
  await step(3, async () => {
    rows = await list.listIds();
    crumbs = await list.breadcrumbLinks();
    note(`画面URL ${page.url()}／一覧: ${rows.join("、")}／パンくず: ${crumbs.map((x) => x.text).join(" ＞ ")}`);
  });
  await expected(async () => {
    expect.soft([...rows].sort(), "一覧は ID 012B と兄弟の ID 012C").toEqual([b, c].sort());
    const ancestor = crumbs.filter((x) => x.text === "ルートカテゴリA");
    expect.soft(ancestor.map((x) => x.href), "パンくずの祖先「ルートカテゴリA」（ID 012A の一覧へのリンク）").toEqual([categoryListUrl(a)]);
  });
});

// ---- 存在しないカテゴリ ----

caseTest("IT-M03-45-013", async ({ page, notes, step, expected }) => {
  const list = await signIn(page);
  const id = notes.get("〔カテゴリID-M0345-013〕");
  let status = 0;
  await step(1, () => list.openChildrenOf(id));
  await step(2, async () => { status = await openReplaced(page, id, "999999", categoryListUrl); });
  await expected(async () => {
    note(`親カテゴリID 999999 の画面URLの応答: ${status}`);
    expect(await list.categoryScreenParts(), "親カテゴリID 999999 のカテゴリ一覧画面（ツリー・入力欄）").toEqual([]);
    await expect.soft(list.rows, "一覧の行").toHaveCount(0);
  });
});

caseTest("IT-M03-45-014", async ({ page, notes, step, expected }) => {
  const list = await signIn(page);
  const b = notes.get("〔カテゴリID-M0345-014B〕");
  let status = 0;
  await step(1, () => list.openEdit(b));
  await step(2, async () => { status = await openReplaced(page, b, "999999", categoryEditUrl); });
  await expected(async () => {
    note(`カテゴリID 999999 の編集画面URLの応答: ${status}`);
    expect(await list.categoryScreenParts(), "カテゴリID 999999 のカテゴリ編集画面（ツリー・入力欄）").toEqual([]);
    await expect.soft(list.registerButtons(), "「カテゴリ更新」ボタン").toHaveCount(0);
  });
});

caseTest("IT-M03-45-015", async ({ page, step, expected }) => {
  const list = await signIn(page);
  await step(1, () => list.openTop());
  await step(2, async () => {
    note(`登録用の入力欄: ${await list.form.count()} 件／登録のボタン: ${await list.registerButtons().count()} 件`);
  });
  await expected(async () => {
    await expect.soft(list.form, "カテゴリの入力欄").toHaveCount(0);
    await expect.soft(list.nameJp, "カテゴリ名(日)の入力欄").toHaveCount(0);
    await expect.soft(list.registerButtons(), "「子カテゴリ作成」などの登録のボタン").toHaveCount(0);
  });
});

// ---- 並べ替え ----

/**
 * 016〜019: 「並べ替え親カテゴリ-<ケース>」の直下の A・B・C（表示順 30・20・10）を、ドラッグか表示順入替ボタンで並べ替え、
 * 確認のポップアップで OK／キャンセルを押して、再読み込み後の一覧とDBの表示順の並びを見る。
 */
function sortCase(no: string, op: "drag" | "up" | "down", accept: boolean, want: ("A" | "B" | "C")[]): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const list = await signIn(page);
    const id = (s: string) => notes.get(`〔カテゴリID-M0345-${no}${s}〕`);
    const ids = { A: id("B"), B: id("C"), C: id("D") };
    const names = { A: `並べ替えカテゴリA-${no}`, B: `並べ替えカテゴリB-${no}`, C: `並べ替えカテゴリC-${no}` };
    let pending: { dialog: Dialog; done: Promise<void> } | null = null;
    let order: string[] = [];
    let sorts: Record<string, string | null> = {};
    await step(1, async () => {
      await list.openChildrenOf(id("A"));
      const rows = await list.rowValues();
      for (const k of ["A", "B", "C"] as const) {
        expect(rows.find((r) => r.id === ids[k])?.nameJp, `ID ${no}${k === "A" ? "B" : k === "B" ? "C" : "D"} の行`).toBe(names[k]);
      }
    });
    await step(2, async () => {
      if (op === "drag") {
        const r = await list.dragBelow(ids.A, ids.B);
        pending = { dialog: r.dialog, done: r.released };
      } else {
        const r = await list.pressMove(ids.B, op);
        pending = { dialog: r.dialog, done: r.pressed };
      }
      note(`ポップアップの文言: 「${pending.dialog.message()}」`);
    });
    await step(3, async () => {
      const p = pending!;
      if (accept) note(`「OK」を押した。並べ替えの保存の応答: ${await list.acceptMove(p.dialog, p.done)}`);
      else {
        await p.dialog.dismiss();
        await p.done;
        note("「キャンセル」を押した");
      }
    });
    await step(4, async () => {
      await page.reload();
      await page.waitForLoadState("load");
      order = await list.listIds();
    });
    await step(5, async () => {
      sorts = 表示順([ids.A, ids.B, ids.C]);
      note(`DB上の表示順: ${(["A", "B", "C"] as const).map((k) => `${names[k]}=${sorts[ids[k]]}`).join("・")}`);
    });
    await expected(async () => {
      const wantIds = want.map((k) => ids[k]);
      expect.soft(order, `再読み込み後の一覧の並び（${want.map((k) => names[k]).join("→")}）`).toEqual(wantIds);
      const values = wantIds.map((x) => Number(sorts[x]));
      const descending = values.every((v, i) => Number.isFinite(v) && (i === 0 || values[i - 1] > v));
      expect.soft(descending, `DB上の表示順が ${want.map((k) => names[k]).join("→")} の順（大きい順）: ${values.join("・")}`).toBe(true);
    });
  };
}

caseTest("IT-M03-45-016", sortCase("016", "drag", true, ["B", "A", "C"]));
caseTest("IT-M03-45-017", sortCase("017", "drag", false, ["A", "B", "C"]));
caseTest("IT-M03-45-018", sortCase("018", "up", true, ["B", "A", "C"]));
caseTest("IT-M03-45-019", sortCase("019", "down", true, ["A", "C", "B"]));

// ---- 削除 ----

caseTest("IT-M03-45-020", async ({ page, notes, step, expected }) => {
  const list = await signIn(page);
  const b = notes.get("〔カテゴリID-M0345-020B〕");
  let left = -1;
  await step(1, () => list.openChildrenOf(notes.get("〔カテゴリID-M0345-020A〕")));
  await step(2, async () => {
    expect((await list.rowValues()).find((r) => r.id === b)?.nameJp, "ID 020B の行").toBe("配下削除対象-020");
    await list.openDeleteModal(b);
    note(`削除確認モーダルの文言: ${await list.deleteModalMessage()}`);
  });
  await step(3, () => list.cancelDelete());
  await step(4, async () => { left = カテゴリの件数(b); });
  await expected(async () => {
    await expect.soft(list.rowById(b), "一覧に ID 020B が表示されたまま").toBeVisible();
    expect.soft(left, "DB の ID 020B の件数").toBe(1);
  });
});

caseTest("IT-M03-45-021", async ({ page, notes, step, expected }) => {
  const list = await signIn(page);
  const b = notes.get("〔カテゴリID-M0345-021B〕");
  let left = -1;
  await step(1, () => list.openChildrenOf(notes.get("〔カテゴリID-M0345-021A〕")));
  await step(2, async () => {
    expect((await list.rowValues()).find((r) => r.id === b)?.nameJp, "ID 021B の行").toBe("配下削除対象-021");
    await list.openDeleteModal(b);
  });
  await step(3, async () => {
    note(`削除の応答: ${await list.confirmDeleteOf(b)}（URL ${page.url()}）・案内: ${(await list.alertTexts()).join(" / ") || "なし"}`);
  });
  await step(4, async () => { left = カテゴリの件数(b); });
  await expected(async () => {
    expect(left, "DB の ID 021B の件数").toBe(0);
  });
});

caseTest("IT-M03-45-022", async ({ page, notes, step, expected }) => {
  const list = await signIn(page);
  const a = notes.get("〔カテゴリID-M0345-022A〕");
  const b = notes.get("〔カテゴリID-M0345-022B〕");
  await step(1, () => list.openChildrenOf(a));
  await step(2, async () => {
    expect((await list.rowValues()).find((r) => r.id === b)?.nameJp, "ID 022B の行").toBe("配下削除対象-022");
    await list.openDeleteModal(b);
  });
  await step(3, async () => {
    note(`削除の応答: ${await list.confirmDeleteOf(b)}・案内: ${(await list.alertTexts()).join(" / ") || "なし"}`);
  });
  await expected(async () => {
    expect(page.url(), "ID 022A を親カテゴリとするカテゴリ一覧画面").toBe(categoryListUrl(a));
    expect.soft(await list.subTitle(), "画面名").toBe("カテゴリ一覧");
  });
});

caseTest("IT-M03-45-023", async ({ page, notes, step, expected }) => {
  const list = await signIn(page);
  const id = notes.get("〔カテゴリID-M0345-023〕");
  await step(1, () => list.openTop());
  await step(2, async () => {
    expect((await list.rowValues()).find((r) => r.id === id)?.nameJp, "ID 023 の行").toBe("ルート削除対象-023");
    await list.openDeleteModal(id);
  });
  await step(3, async () => {
    note(`削除の応答: ${await list.confirmDeleteOf(id)}・案内: ${(await list.alertTexts()).join(" / ") || "なし"}`);
  });
  await expected(async () => {
    expect(page.url(), "親カテゴリを指定しないカテゴリ一覧画面").toBe(categoryListUrl(null));
    expect.soft(await list.subTitle(), "画面名").toBe("カテゴリ一覧");
  });
});

caseTest("IT-M03-45-024", async ({ page, notes, step, expected }) => {
  const list = await signIn(page);
  const id = (s: string) => notes.get(`〔カテゴリID-M0345-024${s}〕`);
  const keys = ["A", "B", "C", "D", "E", "F"];
  const before = 表示順(keys.map(id));
  note(`削除前の表示順: ${keys.map((k) => `ID 024${k}=${before[id(k)]}`).join("・")}`);
  let after: Record<string, string | null> = {};
  await step(1, () => list.openChildrenOf(id("B")));
  await step(2, async () => {
    const r = (await list.rowValues()).find((v) => v.id === id("A"));
    expect(r?.nameJp, "ID 024A の行").toBe("表示順削除対象-024");
    note(`一覧の ID 024A の行の表示順: ${r?.sortNo}`);
    await list.openDeleteModal(id("A"));
  });
  await step(3, async () => { note(`削除の応答: ${await list.confirmDeleteOf(id("A"))}`); });
  await step(4, async () => {
    after = 表示順(["B", "C", "D", "E", "F"].map(id));
    note(`削除後の表示順: ${["B", "C", "D", "E", "F"].map((k) => `ID 024${k}=${after[id(k)]}`).join("・")}`);
  });
  await expected(async () => {
    expect.soft(["C", "D", "E", "A", "B", "F"].map((k) => before[id(k)]), "削除前の表示順（C・D・E・A・B・F）").toEqual(["50", "40", "30", "20", "15", "10"]);
    expect.soft(after[id("C")], "ID 024C（50）").toBe("49");
    expect.soft(after[id("D")], "ID 024D（40）").toBe("39");
    expect.soft(after[id("E")], "ID 024E（30）").toBe("29");
    expect.soft(after[id("B")], "ID 024B（15）は変わらない").toBe("15");
    expect.soft(after[id("F")], "ID 024F（10）は変わらない").toBe("10");
  });
});

caseTest("IT-M03-45-025", async ({ page, notes, step, expected }) => {
  const list = await signIn(page);
  const b = notes.get("〔カテゴリID-M0345-025B〕");
  let disabled: boolean | null = null;
  let hint: string | null = null;
  let opened: boolean | null = null;
  await step(1, () => list.openChildrenOf(notes.get("〔カテゴリID-M0345-025A〕")));
  await step(2, async () => {
    const r = (await list.rowValues()).find((v) => v.id === b);
    expect(r?.nameJp, "ID 025B の行").toBe("子ありカテゴリ-025");
    expect((await list.treeItem(b)).count, "ID 025B の直下の子カテゴリ（ID 025C）の件数").toBe("1");
    disabled = r!.deleteDisabled;
    hint = await list.deleteHintText(b);
    // 削除ボタンの位置を利用者と同じに押して、削除確認モーダルが開くかを見る
    opened = await list.tryOpenDelete(b);
    note(`削除ボタン: ${disabled ? "押せない状態" : "押せる状態"}／補足: ${hint ?? "出ない"}／位置を押したときの削除確認モーダル: ${opened ? "開いた" : "開かない"}`);
  });
  await expected(async () => {
    expect.soft(disabled, "ID 025B の削除ボタンは押せない状態").toBe(true);
    expect.soft(opened, "ID 025B の削除ボタンの位置を押しても、削除確認モーダルは開かない").toBe(false);
    expect.soft(hint ?? "（補足が出ない）", "子カテゴリが存在するため削除できない旨の補足").toMatch(/子カテゴリが存在するため削除でき(ない|ません)/);
  });
});

caseTest("IT-M03-45-026", async ({ page, notes, step, expected }) => {
  const list = await signIn(page);
  const b = notes.get("〔カテゴリID-M0345-026B〕");
  let disabled: boolean | null = null;
  let opened: boolean | null = null;
  await step(1, () => list.openChildrenOf(notes.get("〔カテゴリID-M0345-026A〕")));
  await step(2, async () => {
    const r = (await list.rowValues()).find((v) => v.id === b);
    expect(r?.nameJp, "ID 026B の行").toBe("商品関連カテゴリ-026");
    disabled = r!.deleteDisabled;
    const hint = await list.deleteHintText(b);
    opened = await list.tryOpenDelete(b);
    note(`削除ボタン: ${disabled ? "押せない状態" : "押せる状態"}／補足: ${hint ?? "出ない"}／位置を押したときの削除確認モーダル: ${opened ? "開いた" : "開かない"}`);
  });
  await expected(async () => {
    expect.soft(disabled, "ID 026B の削除ボタンは押せない状態").toBe(true);
    expect.soft(opened, "ID 026B の削除ボタンの位置を押しても、削除確認モーダルは開かない").toBe(false);
  });
});

caseTest("IT-M03-45-027", async ({ page, browser, notes, step, expected }) => {
  const a = notes.get("〔カテゴリID-M0345-027A〕");
  const b = notes.get("〔カテゴリID-M0345-027B〕");
  const listA = await signIn(page);
  const contextB = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(contextB);
    const pageB = await contextB.newPage();
    const listB = await signIn(pageB);
    let left = -1;
    await step(1, async () => {
      await listA.openChildrenOf(a);
      await listB.openChildrenOf(a);
    });
    await step(2, async () => {
      await listA.openDeleteModal(b);
      note(`ブラウザAの削除の応答: ${await listA.confirmDeleteOf(b)}`);
    });
    await step(3, async () => {
      await expect(listB.rowById(b), "ブラウザBに残っている ID 027B の行").toHaveCount(1);
      await listB.openDeleteModal(b);
      const status = await listB.confirmDeleteOf(b);
      note(`ブラウザBの削除の応答: ${status}（URL ${pageB.url()}）・案内: ${(await listB.alertTexts()).join(" / ") || "なし"}`);
    });
    await step(4, async () => { left = カテゴリの件数(b); });
    await expected(async () => {
      expect.soft(await listB.subTitle(), "ブラウザBの画面名").toBe("カテゴリ一覧");
      expect.soft(/\/product\/category(\/\d+)?$/.test(new URL(pageB.url()).pathname), `ブラウザBはカテゴリ一覧画面へ戻る（${pageB.url()}）`).toBe(true);
      expect.soft(left, "DB の ID 027B の件数").toBe(0);
    });
  } finally {
    await contextB.close();
  }
});

// ---- CSV出力 ----

caseTest("IT-M03-45-028", async ({ page, notes, step, expected }) => {
  const list = await signIn(page);
  const id = (s: string) => notes.get(`〔カテゴリID-M0345-028${s}〕`);
  // 事前準備②: 開始時にカテゴリCSVの出力項目を設定する（このケースの管理者で。入っていれば変えない）
  const moved = await ensureCategoryCsvOutputs(page, CATEGORY_CSV_ITEMS, "開始時のカテゴリCSVの出力項目", note);
  if (moved.length === 0) note(`カテゴリCSVの出力項目に「${CATEGORY_CSV_ITEMS.join("」「")}」が入っていた`);
  let rows: string[] = [];
  let csv: Record<string, string>[] = [];
  await step(1, async () => {
    await list.openChildrenOf(id("A"));
    rows = await list.listIds();
  });
  await step(2, async () => { csv = await list.downloadCsv(); });
  await step(3, async () => {
    note(`ダウンロードしたCSV: 見出し「${Object.keys(csv[0] ?? {}).join(",")}」・明細 ${csv.length} 行`);
  });
  await expected(async () => {
    expect.soft(rows, "表示中の一覧は ID 028B だけ").toEqual([id("B")]);
    const ids = csv.map((r) => r["カテゴリID"]);
    for (const k of ["A", "B", "C", "D", "E"]) expect.soft(ids.includes(id(k)), `CSVに ID 028${k}`).toBe(true);
  });
});

// ---- 子カテゴリの登録と表示順 ----

caseTest("IT-M03-45-035", async ({ page, notes, step, expected }) => {
  const list = await signIn(page);
  const id = (s: string) => notes.get(`〔カテゴリID-M0345-035${s}〕`);
  const keys = ["A", "B", "C", "D"];
  const before = 表示順(keys.map(id));
  note(`登録前の表示順: ${keys.map((k) => `ID 035${k}=${before[id(k)]}`).join("・")}`);
  let added: ReturnType<typeof 名称のカテゴリ> = [];
  let after: Record<string, string | null> = {};
  await step(1, () => list.openChildrenOf(id("A")));
  await step(2, async () => {
    await list.fill({ nameJp: "新規子カテゴリ", nameEn: "NewChildCategory" });
    await list.submitAndWait();
    note(`「子カテゴリ作成」のあと: URL ${page.url()}・案内: ${(await list.alertTexts()).join(" / ") || "なし"}`);
  });
  await step(3, async () => {
    added = 名称のカテゴリ("新規子カテゴリ");
    after = 表示順(keys.map(id));
    note(`登録後: 新規子カテゴリ=${added.map((r) => `ID ${r.カテゴリID}・親 ${r.親カテゴリID}・表示順 ${r.表示順}`).join("、") || "なし"}／${keys.map((k) => `ID 035${k}=${after[id(k)]}`).join("・")}`);
  });
  await expected(async () => {
    expect(added.length, "「新規子カテゴリ」は1件").toBe(1);
    expect.soft(added[0].親カテゴリID, "「新規子カテゴリ」の親は ID 035A").toBe(id("A"));
    expect.soft(added[0].表示順, "「新規子カテゴリ」の表示順").toBe("40");
    expect.soft(["A", "C", "B", "D"].map((k) => before[id(k)]), "登録前の表示順（A・C・B・D）").toEqual(["40", "50", "39", "30"]);
    expect.soft(after[id("A")], "ID 035A（40）").toBe("41");
    expect.soft(after[id("C")], "ID 035C（50）").toBe("51");
    expect.soft(after[id("B")], "ID 035B（39）は変わらない").toBe("39");
    expect.soft(after[id("D")], "ID 035D（30）は変わらない").toBe("30");
  });
});

caseTest("IT-M03-45-041", async ({ page, notes, step, expected }) => {
  const list = await signIn(page);
  const a = notes.get("〔カテゴリID-M0345-041A〕");
  const b = notes.get("〔カテゴリID-M0345-041B〕");
  const before = 表示順([a, b]);
  note(`登録前の表示順: ID 041A=${before[a]}・ID 041B=${before[b]}`);
  let one: ReturnType<typeof 名称のカテゴリ> = [];
  let two: ReturnType<typeof 名称のカテゴリ> = [];
  let after: Record<string, string | null> = {};
  await step(1, () => list.openChildrenOf(a));
  await step(2, async () => {
    await list.fill({ nameJp: "重ね新規子1-M0345-041", nameEn: "NewChildOne-M0345-041" });
    await list.submitAndWait();
    note(`1件目の「子カテゴリ作成」のあと: URL ${page.url()}・案内: ${(await list.alertTexts()).join(" / ") || "なし"}`);
  });
  await step(3, async () => {
    expect(page.url(), "続けて同じ一覧（ID 041A の直下の一覧）").toBe(categoryListUrl(a));
    await list.fill({ nameJp: "重ね新規子2-M0345-041", nameEn: "NewChildTwo-M0345-041" });
    await list.submitAndWait();
    note(`2件目の「子カテゴリ作成」のあと: URL ${page.url()}・案内: ${(await list.alertTexts()).join(" / ") || "なし"}`);
  });
  await step(4, async () => {
    one = 名称のカテゴリ("重ね新規子1-M0345-041");
    two = 名称のカテゴリ("重ね新規子2-M0345-041");
    after = 表示順([a, b]);
    note(`登録後: 重ね新規子1=${one.map((r) => r.表示順).join("、") || "なし"}・重ね新規子2=${two.map((r) => r.表示順).join("、") || "なし"}・ID 041A=${after[a]}・ID 041B=${after[b]}`);
  });
  await expected(async () => {
    expect.soft(one.map((r) => r.表示順), "「重ね新規子1-M0345-041」の表示順").toEqual(["40"]);
    expect.soft(two.map((r) => r.表示順), "「重ね新規子2-M0345-041」の表示順").toEqual(["41"]);
    expect.soft(after[a], "ID 041A の表示順").toBe("42");
    expect.soft(after[b], "ID 041B の表示順").toBe("39");
  });
});

caseTest("IT-M03-45-042", async ({ page, notes, step, expected }) => {
  const list = await signIn(page);
  const d = notes.get("〔カテゴリID-M0345-042D〕");
  let shown: CategoryRow[] = [];
  let saved: ReturnType<typeof 名称のカテゴリ> = [];
  await step(1, () => list.openChildrenOf(d));
  await step(2, async () => {
    await list.fill({ nameJp: "深さ5-M0345-042", nameEn: "Depth-Five-M0345-042" });
    await list.submitAndWait();
    note(`「子カテゴリ作成」のあと: URL ${page.url()}・案内: ${(await list.alertTexts()).join(" / ") || "なし"}`);
  });
  await step(3, async () => {
    shown = (await list.rowValues()).filter((r) => r.nameJp === "深さ5-M0345-042");
    note(`一覧の「深さ5-M0345-042」の行: ${shown.map(rowText).join("、") || "なし"}（URL ${page.url()}）`);
  });
  await step(4, async () => { saved = 名称のカテゴリ("深さ5-M0345-042"); });
  await expected(async () => {
    expect(saved.length, "「深さ5-M0345-042」は1件").toBe(1);
    expect.soft(saved[0].親カテゴリID, "親は ID 042D").toBe(d);
    expect.soft(saved[0].階層, "第5階層").toBe("5");
    expect.soft(page.url(), "一覧は ID 042D の直下の一覧").toBe(categoryListUrl(d));
    expect.soft(shown.map((r) => r.id), "一覧に「深さ5-M0345-042」の行が表示される").toEqual([saved[0].カテゴリID]);
  });
});
