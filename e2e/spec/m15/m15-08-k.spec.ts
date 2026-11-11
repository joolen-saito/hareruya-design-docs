// 取り込み注記: 同じ機能を main 側（別の方）も実装していたため、栗野側の版を別ファイルにした。main に無いケースだけを残している（main にあるケースは main を優先して除いた）。
/**
 * M15-08 アーキタイプ検索（管理画面）。正本: cases/M15-08_test_cases.tsv
 *
 * - アーキタイプ名・フォーマット名は実行の印つき（seeds/m15-08.ts の 語・名・フォーマット）。ケースの検索語・期待結果の名前も、同じ印を付けた値として読む。
 * - 正本の「検索する >」は、画面では「検索する」（「 >」は無い）。
 * - 「並べかえ: 項目」「並べ替え: ソート順」は、選ぶとすぐ画面が検索し直す作り。いまの選択と同じ値を選ぶときは、画面は何もしない（注記に残す）。
 * - 「開発者ツールで…変更して送信」は、画面の要素の値をスクリプトで書き換えて送る（017 は件数の選択欄に 25件 を足して選ぶ。027 は検索の要求の並び順の項目を書き換える）。
 *
 * 実装しないケース（理由は seeds/m15-08.ts の冒頭と PM への報告）:
 * - 002・007・011・012・013・016: シードが DB での準備（ほかのアーキタイプ・フォーマットの削除、12001件の投入）
 * - 008・009: シードが、カラー・デッキタグだけの条件で検索した該当を全部消す（ほかの人のアーキタイプも消しうる。判断待ち）
 */
import { Page, test } from "@playwright/test";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { アーキタイプの削除状態 } from "../../db/m15_08_archetype_k";
import {
  ArchetypeSearchPage, CSVアップロードのファイル欄, CSV取り込みのパス, pathOf, アーキタイプ編集の名日欄, アーキタイプ編集の送信ボタン, 新規登録のパス, 検索条件の値,
  画面の題名, 検索結果のパス, 結果の行, 編集のパス,
} from "../../pages/admin/m15_08_archetype_search";
import { M1508_ADMIN, フォーマット, 語 } from "../../seeds/m15-08-k";
import "../../seeds/m15-08-k";
import "../../seeds/m15-08"; // 取り込みで抜けた登録を戻す: main 側が作り方を登録している seeds を読み込む（二重定義ではない）

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

async function ログイン(page: Page): Promise<ArchetypeSearchPage> {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(120_000);
  await loginAdmin(page, M1508_ADMIN);
  return new ArchetypeSearchPage(page);
}

const 空の条件: 検索条件の値 = { アーキタイプ名: "", フォーマット: [], カラー: [], デッキタグ: [] };

/** 並べかえの項目とソート順を選ぶ。どちらも選択済みと同じで画面が検索し直さなかったときは注記に残す */
async function 並べ替える(s: ArchetypeSearchPage, 項目: string, 順: "昇順" | "降順"): Promise<void> {
  const a = await s.項目を選ぶ(項目);
  const b = await s.ソート順を選ぶ(順);
  if (!a) note(`並べかえの項目は、すでに「${項目}」が選ばれていた（同じ値を選んでも画面は検索し直さない）`);
  if (!b) note(`ソート順は、すでに「${順}」が選ばれていた（同じ値を選んでも画面は検索し直さない）`);
}

/** 登録デッキ数を確かめる（A=2・B=0・C=1） */
function デッキ数を確かめる(rows: 結果の行[], id: (k: string) => string, n: string): void {
  for (const [k, want] of [["A", "2"], ["B", "0"], ["C", "1"]] as const) {
    const r = rows.find((x) => x.ID === id(`${n}${k}`));
    expect.soft(r?.登録デッキ数, `ID 〔アーキタイプID-M1508-${n}${k}〕 の登録デッキ数`).toBe(want);
  }
}
const 呼び名 = (n: string, ks: string) => (notes: { get: (l: string) => string }) => [...ks].map((k) => notes.get(`〔アーキタイプID-M1508-${n}${k}〕`));

// ---------------------------------------------------------------------------
// 初期表示・保持（001・003・041）
// ---------------------------------------------------------------------------

caseTest("IT-M15-08-001", async ({ page, step, expected }) => {
  const s = await ログイン(page);
  let 初期: { 条件: 検索条件の値; 一覧: number; 該当件数の表示: number } | undefined;
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.名前で検索する(語("件数対象")); });
  await step(3, async () => { await s.件数を選ぶ("50"); });
  await step(4, async () => { await s.ページを開く(2); });
  await step(5, async () => { await s.開く(); });
  await step(6, async () => {
    初期 = { 条件: await s.検索条件(), 一覧: await s.一覧.count(), 該当件数の表示: await s.該当件数の表示.count() };
  });
  await step(7, async () => { await s.検索する(); });
  await expected(async () => {
    expect.soft(初期?.条件, "手順5の初期表示の検索条件（空）").toEqual(空の条件);
    expect.soft(初期?.一覧, "手順5の初期表示の一覧（表示されない）").toBe(0);
    expect.soft(初期?.該当件数の表示, "手順5の初期表示の該当件数（表示されない）").toBe(0);
    expect.soft(await s.現在のページ(), "手順7の検索結果のページ").toBe("1");
    expect.soft((await s.結果の行()).length, "手順7の1ページ目の件数").toBe(10);
    expect.soft(await s.選択中の件数(), "手順7の件数の選択").toBe("10件");
  });
});

caseTest("IT-M15-08-041", async ({ page, notes, step, expected }) => {
  const s = await ログイン(page);
  const 検索語 = 語("M1508-041-甲");
  let 見た: { 条件: 検索条件の値; ID: string[] } | undefined;
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.名前で検索する(検索語); });
  await step(3, async () => { await s.結果のページを直接開く(1); });
  await step(4, async () => { 見た = { 条件: await s.検索条件(), ID: await s.結果のID() }; });
  await expected(async () => {
    expect.soft(見た?.条件.アーキタイプ名, "検索条件のアーキタイプ名（保持された値）").toBe(検索語);
    expect.soft(見た?.ID, "一覧のアーキタイプID（〔アーキタイプID-M1508-041A〕の1件だけ）").toEqual([notes.get("〔アーキタイプID-M1508-041A〕")]);
    expect.soft(見た?.ID ?? [], "一覧に〔アーキタイプID-M1508-041B〕が無い").not.toContain(notes.get("〔アーキタイプID-M1508-041B〕"));
  });
});

// ---------------------------------------------------------------------------
// 検索条件（004・010）
// ---------------------------------------------------------------------------

caseTest("IT-M15-08-004", async ({ page, notes, step, expected }) => {
  const s = await ログイン(page);
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.名前で検索する(語("Azure")); });
  await expected(async () => {
    const ids = await s.結果のID();
    expect.soft([...ids].sort(), "一覧のアーキタイプID（004A・004B・004C の3件だけ）").toEqual(呼び名("004", "ABC")(notes).sort());
    expect.soft(await s.該当件数(), "該当件数").toBe(3);
    await expect.soft(s.一覧, "アーキタイプ一覧（検索結果画面）").toBeVisible();
    await expect.soft(s.ページ送り, "ページ送り").toBeVisible();
    await expect.soft(s.アーキタイプ名, "検索条件の入力欄（検索結果画面に留まる）").toHaveValue(語("Azure"));
  });
});

caseTest("IT-M15-08-010", async ({ page, notes, step, expected }) => {
  const s = await ログイン(page);
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.名前を入れる("青 制御"); });
  await step(3, async () => {
    await s.フォーマットを選ぶ([フォーマット.スタンダード]);
    await s.カラーを選ぶ(["青", "白"]);
    await s.デッキタグを選ぶ(["制御"]);
  });
  await step(4, async () => { await s.検索する(); });
  await expected(async () => {
    expect.soft(await s.結果のID(), "一覧のアーキタイプID（〔アーキタイプID-M1508-010A〕だけ）").toEqual([notes.get("〔アーキタイプID-M1508-010A〕")]);
  });
});

// ---------------------------------------------------------------------------
// 表示件数・ページ（014・015・017・018・019・020）
// ---------------------------------------------------------------------------

caseTest("IT-M15-08-014", async ({ page, step, expected }) => {
  const s = await ログイン(page);
  let 件数 = -1;
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.名前で検索する(語("件数対象")); });
  await step(3, async () => { 件数 = (await s.結果の行()).length; });
  await expected(async () => {
    expect.soft(件数, "1ページ目の件数").toBe(10);
    expect.soft(await s.該当件数(), "該当件数").toBe(51);
    expect.soft(await s.選択中の件数(), "件数の選択").toBe("10件");
  });
});

caseTest("IT-M15-08-015", async ({ page, step, expected }) => {
  const s = await ログイン(page);
  let 件数 = -1;
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.名前で検索する(語("件数対象")); });
  await step(3, async () => { await s.件数を選ぶ("50"); });
  await step(4, async () => { 件数 = (await s.結果の行()).length; });
  await expected(async () => {
    expect.soft(件数, "1ページ目の件数").toBe(50);
    expect.soft(await s.該当件数(), "該当件数").toBe(51);
    expect.soft(await s.選択中の件数(), "件数の選択").toBe("50件");
    expect.soft(await s.現在のページ(), "表示しているページ").toBe("1");
  });
});

caseTest("IT-M15-08-017", async ({ page, step, expected }) => {
  const s = await ログイン(page);
  let 件数 = -1;
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.名前で検索する(語("件数対象")); });
  await step(3, async () => { await s.件数を選ぶ("50"); });
  await step(4, async () => {
    const url = await s.件数25の要求を送る();
    note(`件数の選択欄に「25件」の選択肢を足して選び、表示件数25の要求を送った（${pathOf(url)}${new URL(url).search}）`);
  });
  await step(5, async () => { 件数 = (await s.結果の行()).length; });
  await expected(async () => {
    expect.soft(件数, "一覧の件数（保持済みの50件）").toBe(50);
    expect.soft(await s.選択中の件数(), "件数の選択（50件）").toBe("50件");
  });
});

caseTest("IT-M15-08-018", async ({ page, notes, step, expected }) => {
  const s = await ログイン(page);
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.検索する(); });
  await step(3, async () => { await s.ページを開く(2); });
  await step(4, async () => { await s.名前で検索する(語("ページ対象")); });
  await expected(async () => {
    expect.soft(await s.現在のページ(), "表示しているページ").toBe("1");
    expect.soft(await s.結果のID(), "一覧（1ページ目＝アーキタイプIDの降順の先頭10件）").toEqual(呼び名("018", "KJIHGFEDCB")(notes));
  });
});

caseTest("IT-M15-08-019", async ({ page, notes, step, expected }) => {
  const s = await ログイン(page);
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.名前で検索する(語("ページ対象")); });
  await step(3, async () => { await s.ページを開く(2); });
  await step(4, async () => { await s.件数を選ぶ("50"); });
  await expected(async () => {
    expect.soft(pathOf(page.url()), "表示した画面のアドレス（1ページ目）").toBe(検索結果のパス(1));
    expect.soft(await s.結果のID(), "一覧（1ページ目＝アーキタイプIDの降順の11件）").toEqual(呼び名("019", "KJIHGFEDCBA")(notes));
  });
});

caseTest("IT-M15-08-020", async ({ page, notes, step, expected }) => {
  const s = await ログイン(page);
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.名前で検索する(語("ページ対象")); });
  await step(3, async () => { await s.ページを開く(2); });
  await step(4, async () => { await 並べ替える(s, "アーキタイプID", "昇順"); });
  await expected(async () => {
    expect.soft(await s.現在のページ(), "表示しているページ").toBe("1");
    expect.soft(await s.結果のID(), "一覧（1ページ目＝アーキタイプIDの昇順の先頭10件）").toEqual(呼び名("020", "ABCDEFGHIJ")(notes));
  });
});

// ---------------------------------------------------------------------------
// 並べ替え（026・027）
// ---------------------------------------------------------------------------

caseTest("IT-M15-08-026", async ({ page, step, expected }) => {
  const s = await ログイン(page);
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.名前で検索する(語("並べ替え")); });
  await step(3, async () => {
    const sent = await s.項目を選ぶ("アーキタイプ名");
    if (sent) note("並べかえの項目を選ぶと、画面がすぐ検索し直した（画面が開き直った）");
  });
  await expected(async () => {
    await expect.soft(s.ソート順, "操作の対象（ソート順の選択欄にフォーカスがある）").toBeFocused();
  });
});

// ---------------------------------------------------------------------------
// 一覧の表示（028・029・030・042・043）
// ---------------------------------------------------------------------------

caseTest("IT-M15-08-028", async ({ page, notes, step, expected }) => {
  const s = await ログイン(page);
  const id = () => notes.get("〔アーキタイプID-M1508-028〕");
  let 行: 結果の行 | undefined;
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.名前で検索する(語("統合一覧型")); });
  await step(3, async () => { 行 = (await s.結果の行()).find((r) => r.ID === id()); });
  await expected(async () => {
    expect.soft(行?.画像あり, "代表カード画像").toBe(true);
    expect.soft(行?.ID, "アーキタイプID").toBe(id());
    expect.soft(行?.名日, "日本語名").toBe(語("統合一覧型"));
    expect.soft(行?.名英, "英語名").toBe("Integration List");
    expect.soft(行?.カラー, "カラー").toBe("青/白");
    expect.soft(行?.フォーマット, "フォーマット名").toBe(フォーマット.スタンダード);
    expect.soft(行?.登録デッキ数, "登録デッキ数").toBe("2");
    expect.soft(行?.説明, "アーキタイプ説明").toBe("統合試験説明");
    expect.soft(await s.該当件数(), "該当件数").toBe(1);
  });
});

caseTest("IT-M15-08-029", async ({ page, notes, step, expected }) => {
  const s = await ログイン(page);
  const id = () => notes.get("〔アーキタイプID-M1508-029〕");
  let 行: 結果の行 | undefined;
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.名前で検索する(語("画像未設定型")); });
  await step(3, async () => { 行 = (await s.結果の行()).find((r) => r.ID === id()); });
  await expected(async () => {
    expect.soft(行?.ID, "ID 〔アーキタイプID-M1508-029〕 の一覧行").toBe(id());
    expect.soft(行?.画像あり, "代表カード画像（表示されない）").toBe(false);
  });
});

/** 042・043: 名前で検索して、その行のカラーの欄を読む */
function カラーの欄(n: "042" | "043", 正本名: string, 期待: string) {
  return async ({ page, notes, step, expected }: CaseCtx) => {
    const s = await ログイン(page);
    const id = () => notes.get(`〔アーキタイプID-M1508-${n}〕`);
    let 行: 結果の行 | undefined;
    await step(1, async () => { await s.開く(); });
    await step(2, async () => { await s.名前で検索する(語(正本名)); });
    await step(3, async () => { 行 = (await s.結果の行()).find((r) => r.ID === id()); });
    await expected(async () => {
      expect.soft(行?.ID, `ID 〔アーキタイプID-M1508-${n}〕 の一覧行`).toBe(id());
      expect.soft(行?.カラー, n === "042" ? "カラー（青だけ）" : "カラー欄（空）").toBe(期待);
      expect.soft(行?.カラー ?? "", "カラーに「/」が無い").not.toContain("/");
    });
  };
}
caseTest("IT-M15-08-042", カラーの欄("042", "M1508-042-甲", "青"));
caseTest("IT-M15-08-043", カラーの欄("043", "M1508-043-甲", ""));

// ---------------------------------------------------------------------------
// 遷移（032〜036）
// ---------------------------------------------------------------------------

/** 移った画面（アーキタイプ編集の登録フォーム・アーキタイプ登録CSVアップロード画面）の様子 */
async function 移った画面(page: Page): Promise<{ パス: string; 名日の欄: number; 名日の値: string; 送信ボタン: string; 題名: string; ファイル欄: number }> {
  const 名日 = アーキタイプ編集の名日欄(page);
  const ボタン = アーキタイプ編集の送信ボタン(page);
  return {
    パス: pathOf(page.url()),
    名日の欄: await 名日.count(),
    名日の値: (await 名日.count()) ? await 名日.inputValue() : "",
    送信ボタン: (await ボタン.count()) ? (await ボタン.first().innerText()).trim() : "",
    題名: await 画面の題名(page),
    ファイル欄: await CSVアップロードのファイル欄(page).count(),
  };
}

caseTest("IT-M15-08-034", async ({ page, step, expected }) => {
  const s = await ログイン(page);
  await step(1, async () => { await s.開く(); });
  await step(2, async () => {
    await s.名前で検索する(語("Azure"));
    await expect(s.一覧, "検索結果画面の一覧").toBeVisible();
  });
  await step(3, async () => { await s.新規登録を押す(); });
  await expected(async () => {
    const v = await 移った画面(page);
    expect.soft(v.パス, "移った画面のアドレス（アーキタイプ編集の登録）").toBe(新規登録のパス());
    expect.soft(v.名日の欄, "アーキタイプ名(日)の欄").toBe(1);
    expect.soft(v.名日の値, "アーキタイプ名(日)の欄（空の登録フォーム）").toBe("");
    expect.soft(v.送信ボタン, "登録のボタン").toBe("新規登録");
  });
});

caseTest("IT-M15-08-035", async ({ page, step, expected }) => {
  const s = await ログイン(page);
  await step(1, async () => { await s.開く(); });
  await step(2, async () => {
    await s.名前で検索する(語("Azure"));
    await expect(s.一覧, "検索結果画面の一覧").toBeVisible();
  });
  await step(3, async () => { await s.CSV取り込みを押す(); });
  await expected(async () => {
    const v = await 移った画面(page);
    expect.soft(v.パス, "移った画面のアドレス").toBe(CSV取り込みのパス());
    expect.soft(v.題名, "画面の題名").toBe("アーキタイプ登録CSVアップロード");
    expect.soft(v.ファイル欄, "ファイルを選ぶ欄").toBe(1);
  });
});

caseTest("IT-M15-08-036", async ({ page, notes, step, expected }) => {
  const s = await ログイン(page);
  const id = () => notes.get("〔アーキタイプID-M1508-036〕");
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.名前で検索する(語("青白制御")); });
  await step(3, async () => { await s.名前を押す(id()); });
  await expected(async () => {
    expect.soft(pathOf(page.url()), "移った画面のアドレス（ID 〔アーキタイプID-M1508-036〕 のアーキタイプ編集）").toBe(編集のパス(id()));
    await expect.soft(アーキタイプ編集の名日欄(page), "アーキタイプ名(日)").toHaveValue(語("青白制御"));
    await expect.soft(アーキタイプ編集の送信ボタン(page).first(), "更新のボタン（編集画面）").toHaveText(/^\s*更新\s*$/);
  });
});

// ---------------------------------------------------------------------------
// 行のメニュー・削除（037・038）
// ---------------------------------------------------------------------------

caseTest("IT-M15-08-037", async ({ page, notes, step, expected }) => {
  const s = await ログイン(page);
  const id = () => notes.get("〔アーキタイプID-M1508-037〕");
  let menu: ReturnType<ArchetypeSearchPage["行"]> | undefined;
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.名前で検索する(語("削除対象型")); });
  await step(3, async () => { menu = await s.メニューを開く(id()); });
  await expected(async () => {
    await expect.soft(menu!, "ID 〔アーキタイプID-M1508-037〕 の行のポップアップメニュー").toBeVisible();
    expect.soft(await s.メニューの項目(menu!), "メニューの項目").toEqual(["編集", "削除"]);
    expect.soft(await s.メニューの編集のパス(menu!), "メニューの「編集」の行き先（ID 〔アーキタイプID-M1508-037〕）").toBe(編集のパス(id()));
    expect.soft(await page.locator(".dropdown-menu.show").count(), "開いているメニューの数").toBe(1);
  });
});

caseTest("IT-M15-08-038", async ({ page, notes, step, expected }) => {
  const s = await ログイン(page);
  const id = () => notes.get("〔アーキタイプID-M1508-038〕");
  let menu: ReturnType<ArchetypeSearchPage["行"]> | undefined;
  let 確認: Awaited<ReturnType<ArchetypeSearchPage["削除を押す"]>> | undefined;
  let 状態: ReturnType<typeof アーキタイプの削除状態> = null;
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.名前で検索する(語("削除対象型")); });
  await step(3, async () => { menu = await s.メニューを開く(id()); });
  await step(4, async () => {
    確認 = await s.削除を押す(menu!);
    note(`確認ダイアログの文: ${確認.文}`);
  });
  await step(5, async () => { await 確認!.OK(); });
  await step(6, async () => { 状態 = アーキタイプの削除状態(id()); });
  await expected(async () => {
    expect.soft(状態?.行がある, "DB の ID 〔アーキタイプID-M1508-038〕 のアーキタイプ").toBe(true);
    expect.soft(状態?.削除日時 ?? "", "DB の ID 〔アーキタイプID-M1508-038〕 の削除日時（削除済み）").not.toBe("");
  });
});

// ---------------------------------------------------------------------------
// 旧アーキタイプIDの入力欄（039）
// ---------------------------------------------------------------------------

caseTest("IT-M15-08-039", async ({ page, step, expected }) => {
  const s = await ログイン(page);
  type 見た = { 見出し: string[]; 旧: { 見出し: string[]; 項目: string[] } };
  let 入力: 見た | undefined;
  let 結果: 見た | undefined;
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { 入力 = { 見出し: await s.検索条件の見出し(), 旧: await s.旧アーキタイプIDの欄() }; });
  await step(3, async () => { await s.名前で検索する(語("Azure")); });
  await step(4, async () => {
    await expect(s.一覧, "検索結果画面の一覧").toBeVisible();
    結果 = { 見出し: await s.検索条件の見出し(), 旧: await s.旧アーキタイプIDの欄() };
    note(`検索条件欄の見出し（検索入力）: ${入力?.見出し.join("・")}／（検索結果）: ${結果.見出し.join("・")}`);
  });
  await expected(async () => {
    expect.soft(入力?.見出し.length ?? 0, "検索入力画面の検索条件欄の見出しが読めた").toBeGreaterThan(0);
    expect.soft(入力?.旧.見出し, "検索入力画面の、旧アーキタイプIDの見出し（無い）").toEqual([]);
    expect.soft(入力?.旧.項目, "検索入力画面の、旧アーキタイプIDの入力項目（無い）").toEqual([]);
    expect.soft(結果?.見出し.length ?? 0, "検索結果画面の検索条件欄の見出しが読めた").toBeGreaterThan(0);
    expect.soft(結果?.旧.見出し, "検索結果画面の、旧アーキタイプIDの見出し（無い）").toEqual([]);
    expect.soft(結果?.旧.項目, "検索結果画面の、旧アーキタイプIDの入力項目（無い）").toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 並べ替えと表示件数の組合せ（044〜052）
// ---------------------------------------------------------------------------

type 並べ = { 項目: string; 順: "昇順" | "降順" };

/** 044・047・050 型: 検索 → 並べ替え → 50件 → 1ページ目を確かめる */
function 並べて50件(n: string, 並: 並べ, 期待: (ids: (k: string) => string, rows: 結果の行[]) => void) {
  return async ({ page, notes, step, expected }: CaseCtx) => {
    const s = await ログイン(page);
    const id = (k: string) => notes.get(`〔アーキタイプID-M1508-${k}〕`);
    let rows: 結果の行[] = [];
    await step(1, async () => { await s.開く(); });
    await step(2, async () => { await s.名前で検索する(語(`M1508-CB${n}-N`)); });
    await step(3, async () => { await 並べ替える(s, 並.項目, 並.順); });
    await step(4, async () => { await s.件数を選ぶ("50"); });
    await step(5, async () => { rows = await s.結果の行(); });
    await expected(async () => {
      expect.soft(rows.length, "1ページ目の件数").toBe(12);
      期待(id, rows);
      デッキ数を確かめる(rows, id, n);
    });
  };
}

/** 045・048・051 型: 検索 → 50件 → 検索入力を開き直す → 件数を指定せず検索 → 並べ替え → 1ページ目を確かめる */
function 保持して並べる(n: string, 並: 並べ, 期待: (ids: (k: string) => string, rows: 結果の行[]) => void) {
  return async ({ page, notes, step, expected }: CaseCtx) => {
    const s = await ログイン(page);
    const id = (k: string) => notes.get(`〔アーキタイプID-M1508-${k}〕`);
    const 検索語 = 語(`M1508-CB${n}-N`);
    let rows: 結果の行[] = [];
    await step(1, async () => { await s.開く(); });
    await step(2, async () => { await s.名前で検索する(検索語); });
    await step(3, async () => { await s.件数を選ぶ("50"); });
    await step(4, async () => { await s.開く(); });
    await step(5, async () => { await s.名前で検索する(検索語); });
    await step(6, async () => { await 並べ替える(s, 並.項目, 並.順); });
    await step(7, async () => { rows = await s.結果の行(); });
    await expected(async () => {
      expect.soft(await s.選択中の件数(), "件数の選択（保持された50件）").toBe("50件");
      expect.soft(rows.length, "1ページ目の件数").toBe(12);
      期待(id, rows);
      デッキ数を確かめる(rows, id, n);
    });
  };
}

/** 046・049・052 型: 検索 → 並べ替え → 1ページ目 → 2ページ目を確かめる */
function 並べて2ページ(n: string, 並: 並べ, 期待: (ids: (k: string) => string, p1: 結果の行[], p2: 結果の行[]) => void) {
  return async ({ page, notes, step, expected }: CaseCtx) => {
    const s = await ログイン(page);
    const id = (k: string) => notes.get(`〔アーキタイプID-M1508-${k}〕`);
    let p1: 結果の行[] = [];
    let p2: 結果の行[] = [];
    await step(1, async () => { await s.開く(); });
    await step(2, async () => { await s.名前で検索する(語(`M1508-CB${n}-N`)); });
    await step(3, async () => { await 並べ替える(s, 並.項目, 並.順); });
    await step(4, async () => { p1 = await s.結果の行(); });
    await step(5, async () => { await s.ページを開く(2); p2 = await s.結果の行(); });
    await expected(async () => {
      expect.soft(p1.length, "1ページ目の件数").toBe(10);
      expect.soft(p2.length, "2ページ目の件数").toBe(2);
      期待(id, p1, p2);
      デッキ数を確かめる([...p1, ...p2], id, n);
    });
  };
}

const 順に = (n: string, ks: string) => (id: (k: string) => string) => [...ks].map((k) => id(`${n}${k}`));
const 並びを確かめる = (n: string, ks: string, 何: string) => (id: (k: string) => string, rows: 結果の行[]) => {
  expect.soft(rows.map((r) => r.ID), `1ページ目の並び（${何}）`).toEqual(順に(n, ks)(id));
};
const 二ページの並び = (n: string, k1: string, k2: string, 何: string) => (id: (k: string) => string, p1: 結果の行[], p2: 結果の行[]) => {
  expect.soft(p1.map((r) => r.ID), `1ページ目の並び（${何}）`).toEqual(順に(n, k1)(id));
  expect.soft(p2.map((r) => r.ID), `2ページ目の並び（${何}）`).toEqual(順に(n, k2)(id));
};

caseTest("IT-M15-08-044", 並べて50件("044", { 項目: "アーキタイプID", 順: "降順" }, 並びを確かめる("044", "LKJIHGFEDCBA", "アーキタイプIDの降順")));
caseTest("IT-M15-08-045", 保持して並べる("045", { 項目: "アーキタイプID", 順: "昇順" }, 並びを確かめる("045", "ABCDEFGHIJKL", "アーキタイプIDの昇順")));
caseTest("IT-M15-08-046", 並べて2ページ("046", { 項目: "アーキタイプID", 順: "昇順" }, 二ページの並び("046", "ABCDEFGHIJ", "KL", "アーキタイプIDの昇順")));
caseTest("IT-M15-08-047", 並べて50件("047", { 項目: "アーキタイプ名", 順: "昇順" }, 並びを確かめる("047", "LKJIHGFEDCBA", "アーキタイプ名の昇順")));
caseTest("IT-M15-08-048", 保持して並べる("048", { 項目: "アーキタイプ名", 順: "降順" }, 並びを確かめる("048", "ABCDEFGHIJKL", "アーキタイプ名の降順")));
caseTest("IT-M15-08-049", 並べて2ページ("049", { 項目: "アーキタイプ名", 順: "降順" }, 二ページの並び("049", "ABCDEFGHIJ", "KL", "アーキタイプ名の降順")));

/** 登録アーキタイプ数の並び: 指定の行番号（1始まり）の行が指定のIDで、残りの行の登録デッキ数が0 */
const 数の並び = (n: string, 決まった行: [number, string][], 何: string) => (id: (k: string) => string, rows: 結果の行[]) => {
  for (const [行番号, k] of 決まった行) {
    expect.soft(rows[行番号 - 1]?.ID, `${行番号}行目（${何}）は ID 〔アーキタイプID-M1508-${n}${k}〕`).toBe(id(`${n}${k}`));
  }
  const 残り = rows.filter((_, i) => !決まった行.some(([r]) => r - 1 === i));
  expect.soft(残り.map((r) => r.登録デッキ数), `ほかの${残り.length}行の登録デッキ数（すべて0）`).toEqual(残り.map(() => "0"));
};

caseTest("IT-M15-08-050", 並べて50件("050", { 項目: "登録アーキタイプ数", 順: "降順" }, 数の並び("050", [[1, "A"], [2, "C"]], "登録アーキタイプ数の降順")));
caseTest("IT-M15-08-051", 保持して並べる("051", { 項目: "登録アーキタイプ数", 順: "昇順" }, 数の並び("051", [[11, "C"], [12, "A"]], "登録アーキタイプ数の昇順")));
caseTest("IT-M15-08-052", 並べて2ページ("052", { 項目: "登録アーキタイプ数", 順: "昇順" }, (id, p1, p2) => {
  expect.soft(p1.map((r) => r.登録デッキ数), "1ページ目の登録デッキ数（すべて0）").toEqual(p1.map(() => "0"));
  expect.soft(p2[0]?.ID, "2ページ目の1行目は ID 〔アーキタイプID-M1508-052C〕").toBe(id("052C"));
  expect.soft(p2[1]?.ID, "2ページ目の2行目は ID 〔アーキタイプID-M1508-052A〕").toBe(id("052A"));
}));
