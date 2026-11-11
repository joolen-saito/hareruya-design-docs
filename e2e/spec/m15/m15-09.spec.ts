/**
 * M15-09 アーキタイプ登録/編集/削除（管理画面）。ケースの正本: integration_test/casegen/cases/M15-09_test_cases.tsv
 *
 * - 決め打ちの名前（ケース専用のアーキタイプ名・カード名・登録する名前・連携試験の名前）は、実行の印を付けて作っている（seeds/m15-09.ts）。
 *   文字数を確かめるケース（020・022）は正本の値のまま。
 * - 画面の表示名は正本と少し違うものがある（アプリの Twig・翻訳ファイルで確かめた）: 代表カード検索の「検索するボタン」→「検索」、
 *   行の「決定ボタン」→「選択」、アーキタイプ管理の「検索する >」→「検索する」。違いは手順の注記に残す。
 * - 「開発者ツールの Network で応答を確認する」は、ブラウザが受け取った応答（転送のときは転送の応答）を読む。
 * - 「開発者ツールで…を変更する」は、画面の隠し項目・属性を書き換える。
 * - 実装しないケース: 063・064（手順に「3601秒以上待つ」があり、1件の実行の制限時間 1800秒を超える）。
 */
import { test, Page, Request } from "@playwright/test";
import { expect, caseTest, CaseBody } from "../../lib/case";
import { loginAdmin, withAdminSession, Account } from "../../lib/session";
import {
  アーキタイプ一覧, アーキタイプ編集画面, アーキタイプ一覧のパス, 新規登録画面のパス, 編集画面のパス, pathOf,
} from "../../pages/admin/m15_09_archetype_edit";
import { アーキタイプの保存内容, アーキタイプ名日のID, 四項目の一致するアーキタイプのID } from "../../db/m15_09_archetype";
import { DeckSearchModal, DeckTopPage } from "../../pages/front/f09_01_deck_top";
import { DeckResultPage } from "../../pages/front/f09_02_deck_result";
import { デッキリスト詳細を開く, 情報欄 } from "../../pages/front/m15_05_deck_show";
import {
  M1509_ADMIN, M1509_QM, フォーマットA, フォーマットB, フォーマットC, タグA, タグB, 代表カード, 代表カードの表示名, ページカード,
  共有A, 編集前, 代表カード015, 代表カード042, 新規の名前, 最大, 削除049の語, QM名,
} from "../../seeds/m15-09";

async function login(page: Page, a: Account = M1509_ADMIN): Promise<void> {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(120_000);
  await loginAdmin(page, a);
}
const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const パス = (page: Page) => pathOf(page.url());
const 画像の注記 = "代表カード検索の行のボタンは、画面では「選択」（正本の「決定ボタン」）。押した行の画像IDが入力フォームの代表カードに入る";
const 検索の注記 = "代表カード検索の画面の検索ボタンは、画面では「検索」（正本の「検索するボタン」）";
/** 画像の参照先が、画像URL（先頭の / を除いた形）で終わるか */
const 参照先 = (src: string) => src.replace(/^https?:\/\/[^/]+/, "");
const URLの末尾 = (url: string) => url.replace(/^\//, "");

/** 編集画面を開く（手順「ID …のアーキタイプ編集画面を開く」） */
async function 編集を開く(page: Page, id: string): Promise<アーキタイプ編集画面> {
  const e = new アーキタイプ編集画面(page);
  const st = await e.編集を開く(id);
  expect(st, `ID ${id} のアーキタイプ編集画面の応答`).toBe(200);
  return e;
}
async function 新規を開く(page: Page): Promise<アーキタイプ編集画面> {
  const e = new アーキタイプ編集画面(page);
  await e.新規を開く();
  return e;
}

// ---------------------------------------------------------------- 画面の表示

caseTest("IT-M15-09-001", async ({ page, notes, step, expected }) => {
  await login(page);
  let e!: アーキタイプ編集画面;
  await step(1, async () => { e = await 編集を開く(page, notes.get("〔アーキタイプID-M1509-共有A〕")); });
  let ラベル: string[] = [];
  await step(2, async () => {
    ラベル = (await e.フォーム.locator("label").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
    note(`入力項目のラベル: ${ラベル.join(" / ")}`);
  });
  await expected(async () => {
    expect.soft(ラベル.filter((t) => t.includes("旧アーキタイプID")), "「旧アーキタイプID」のラベル").toEqual([]);
    expect.soft(await e.フォーム.locator('[name*="oldArchetype"], [name*="old_archetype"]').count(), "旧アーキタイプIDの入力欄の数").toBe(0);
    await expect.soft(e.名日, "アーキタイプ名(日)の欄（画面が読み込まれている）").toBeVisible();
  });
});

caseTest("IT-M15-09-002", async ({ page, step, expected }) => {
  await login(page);
  let e!: アーキタイプ編集画面;
  await step(1, async () => { e = await 新規を開く(page); });
  let 選択肢: string[] = [];
  await step(2, async () => { 選択肢 = await e.選択肢(e.公開状態); });
  await expected(async () => {
    expect.soft(選択肢, "公開状態の選択肢").toEqual(["公開", "非公開"]);
    expect.soft(選択肢.includes("限定公開"), "公開状態の選択肢に「限定公開」がある").toBe(false);
  });
});

caseTest("IT-M15-09-005", async ({ page, step, expected }) => {
  await login(page);
  let e!: アーキタイプ編集画面;
  await step(1, async () => { e = await 新規を開く(page); });
  let v!: { 名日: string; 名英: string; 解説日: string; 解説英: string; カラー: string[]; タグ: string[]; カード: { 名前: string; 画像: string; 画像ID: string } };
  await step(2, async () => {
    v = {
      名日: await e.名日.inputValue(), 名英: await e.名英.inputValue(), 解説日: await e.解説日.inputValue(), 解説英: await e.解説英.inputValue(),
      カラー: await e.選ばれたカラー(), タグ: await e.選択中(e.タグ), カード: await e.代表カード(),
    };
  });
  await expected(async () => {
    expect.soft(v.名日, "アーキタイプ名(日)").toBe("");
    expect.soft(v.名英, "アーキタイプ名(英)").toBe("");
    expect.soft(v.解説日, "解説(日)").toBe("");
    expect.soft(v.解説英, "解説(英)").toBe("");
    expect.soft(v.カラー, "チェックの付いたカラー").toEqual([]);
    expect.soft(v.タグ, "選ばれたタグ").toEqual([]);
    expect.soft(v.カード.画像, "代表カードの画像（表示されていない）").toBe("");
    expect.soft(v.カード.名前, "代表カードの名称（表示されていない）").toBe("");
  });
});

caseTest("IT-M15-09-006", async ({ page, notes, step, expected }) => {
  await login(page);
  let e!: アーキタイプ編集画面;
  await step(1, async () => { e = await 編集を開く(page, notes.get("〔アーキタイプID-M1509-共有A〕")); });
  await step(2, async () => { await e.代表カード画像.scrollIntoViewIfNeeded(); });
  await expected(async () => {
    await expect.soft(e.名日, "アーキタイプ名(日)").toHaveValue(共有A.名日);
    await expect.soft(e.名英, "アーキタイプ名(英)").toHaveValue(共有A.名英);
    await expect.soft(e.解説日, "解説(日)").toHaveValue(共有A.解説日);
    await expect.soft(e.解説英, "解説(英)").toHaveValue(共有A.解説英);
    expect.soft(await e.選択中(e.公開状態), "公開状態").toEqual(["公開"]);
    expect.soft(await e.選ばれたカラー(), "カラー").toEqual(["白"]);
    expect.soft(await e.選択中(e.フォーマット), "フォーマット").toEqual([フォーマットB]);
    expect.soft(await e.選択中(e.タグ), "タグ").toEqual([タグA]);
    const c = await e.代表カード();
    expect.soft(c.画像ID, "代表カードの画像ID").toBe(notes.get("〔画像ID-M1509-共有〕"));
    expect.soft(参照先(c.画像).endsWith(URLの末尾(代表カード.画像URL)), `代表カードの画像の参照先（${c.画像}）が ${代表カード.画像URL} の画像`).toBe(true);
    expect.soft(c.名前, "代表カードのカード名").toBe(代表カードの表示名);
  });
});

caseTest("IT-M15-09-007", async ({ page, notes, step, expected }) => {
  await login(page);
  await step(1, async () => { await 編集を開く(page, notes.get("〔アーキタイプID-M1509-共有A〕")); });
  let status = 0;
  await step(2, async () => {
    const url = page.url().replace(/\/archetype\/\d+\/edit/, "/archetype/999999/edit");
    status = (await page.goto(url))?.status() ?? 0;
  });
  await step(3, async () => { note(`ID 999999 のアーキタイプ編集画面を開いた応答: ${status}`); });
  await expected(async () => {
    expect.soft(status, "ID 999999 のアーキタイプ編集画面を開いた応答（HTTPステータス）").toBe(404);
    expect.soft(await new アーキタイプ編集画面(page).登録編集画面か(), "アーキタイプ編集画面（入力の欄）が表示されている").toBe(false);
  });
});

caseTest("IT-M15-09-008", async ({ page, step, expected }) => {
  await login(page);
  let e!: アーキタイプ編集画面;
  await step(1, async () => { e = await 新規を開く(page); });
  let 選択肢: string[] = [];
  await step(2, async () => {
    選択肢 = await e.選択肢(e.フォーマット);
    note("手元の環境にはほかのフォーマットもある（シード表の「3件だけ」は DB を書き換えないと成り立たない）。フォーマットA・B・C の3つの並びの順を確かめた。並び順は B・C・A の順を保つ値（9591・9592・9593）で用意した");
  });
  await expected(async () => {
    const 三つ = 選択肢.filter((t) => [フォーマットA, フォーマットB, フォーマットC].includes(t));
    expect.soft(三つ, "フォーマットの選択肢の、フォーマットA・B・C の並び（上から順）").toEqual([フォーマットB, フォーマットC, フォーマットA]);
  });
});

caseTest("IT-M15-09-009", async ({ page, step, expected }) => {
  await login(page);
  let e!: アーキタイプ編集画面;
  await step(1, async () => { e = await 新規を開く(page); });
  let names: string[] = [];
  await step(2, async () => { names = await e.操作ボタンの名前(); note(`画面右の操作ボタン: ${names.join(" / ")}`); });
  await expected(async () => {
    await expect.soft(e.新規登録ボタン, "「新規登録」ボタン").toBeVisible();
    expect.soft(names.filter((n) => n === "更新"), "「更新」ボタン").toEqual([]);
    expect.soft(names.filter((n) => n === "削除"), "「削除」ボタン").toEqual([]);
  });
});

caseTest("IT-M15-09-010", async ({ page, notes, step, expected }) => {
  await login(page);
  let e!: アーキタイプ編集画面;
  await step(1, async () => { e = await 編集を開く(page, notes.get("〔アーキタイプID-M1509-共有A〕")); });
  let names: string[] = [];
  await step(2, async () => { names = await e.操作ボタンの名前(); note(`画面右の操作ボタン: ${names.join(" / ")}`); });
  await expected(async () => {
    await expect.soft(e.更新ボタン, "「更新」ボタン").toBeVisible();
    await expect.soft(e.削除ボタン, "「削除」ボタン").toBeVisible();
    expect.soft(names.filter((n) => n === "新規登録"), "「新規登録」ボタン").toEqual([]);
  });
});

caseTest("IT-M15-09-011", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = notes.get("〔アーキタイプID-M1509-共有A〕");
  const l = new アーキタイプ一覧(page);
  await step(1, async () => {
    await l.開く();
    await l.名前で検索する(共有A.名日);
    note(`検索結果の画面は、アーキタイプ名に「${共有A.名日}」を入れて「検索する」を押して開いた（ID ${id} の行を出すため）`);
    await expect(l.ID列の行(id), `検索結果に ID ${id} の行`).toHaveCount(1);
  });
  let 前の画面 = "";
  await step(2, async () => { 前の画面 = page.url(); await l.編集を押す(id); });
  await step(3, async () => {
    const e = new アーキタイプ編集画面(page);
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), e.戻るボタン.click()]);
    note(`ひとつ前の画面: ${前の画面} → 戻った画面: ${page.url()}`);
  });
  await expected(async () => {
    expect.soft(パス(page), "戻った画面（アーキタイプ管理）").toBe(アーキタイプ一覧のパス());
    await expect.soft(l.結果の表, "アーキタイプ管理の検索結果の表").toBeVisible();
    await expect.soft(l.ID列の行(id), `検索結果の ID ${id} の行`).toHaveCount(1);
  });
});

// ---------------------------------------------------------------- 登録・更新

caseTest("IT-M15-09-012", async ({ page, notes, step, expected }) => {
  await login(page);
  const 名 = 新規の名前["012"]();
  let e!: アーキタイプ編集画面;
  await step(1, async () => { e = await 新規を開く(page); });
  await step(2, async () => { await e.入力する({ 名日: 名.名日, 名英: 名.名英, 解説日: "新規解説", 解説英: "New Description" }); });
  await step(3, async () => {
    await e.入力する({ 代表カード: { 語: 代表カード.名英, 画像ID: notes.get("〔画像ID-M1509-共有〕") }, 公開状態: "公開", カラー: ["白", "青"], フォーマット: フォーマットB, タグ: [タグA, タグB] });
    note(`${検索の注記}。${画像の注記}`);
  });
  await step(4, async () => { await e.送信する(e.新規登録ボタン); note(`登録後の表示: ${[...await e.成功の帯(), ...await e.エラーの帯()].join(" / ")}`); });
  let ids: string[] = [];
  await step(5, async () => { ids = アーキタイプ名日のID(名.名日); });
  await expected(async () => {
    expect(ids.length, `アーキタイプ名(日)「${名.名日}」のアーキタイプの件数`).toBe(1);
    const r = アーキタイプの保存内容(ids[0])!;
    expect.soft(r.名英, "アーキタイプ名(英)").toBe(名.名英);
    expect.soft(r.解説日, "解説(日)").toBe("新規解説");
    expect.soft(r.解説英, "解説(英)").toBe("New Description");
    expect.soft(r.代表カード画像ID, "代表カードの画像ID").toBe(notes.get("〔画像ID-M1509-共有〕"));
    expect.soft(r.公開状態, "公開状態").toBe("公開");
    expect.soft([...r.カラー].sort(), "カラー").toEqual(["白", "青"].sort());
    expect.soft(r.フォーマット, "フォーマット").toBe(フォーマットB);
    expect.soft([...r.タグ].sort(), "タグ").toEqual([タグA, タグB].sort());
    expect.soft(r.削除日時, "削除日時（なし）").toBe("");
  });
});

caseTest("IT-M15-09-013", async ({ page, step, expected }) => {
  await login(page);
  const 名 = 新規の名前["013"]();
  let e!: アーキタイプ編集画面;
  await step(1, async () => { e = await 新規を開く(page); });
  await step(2, async () => { await e.入力する({ 名日: 名.名日, 名英: 名.名英, フォーマット: フォーマットB }); });
  await step(3, async () => { await e.送信する(e.新規登録ボタン); });
  await expected(async () => {
    expect(パス(page), "移った画面（アーキタイプ編集画面）").toMatch(/\/archetype\/\d+\/edit$/);
    await expect.soft(e.名日, "移った編集画面のアーキタイプ名(日)").toHaveValue(名.名日);
    await expect.soft(e.更新ボタン, "移った画面の「更新」ボタン（編集画面）").toBeVisible();
  });
});

caseTest("IT-M15-09-014", async ({ page, step, expected }) => {
  await login(page);
  const 名 = 新規の名前["014"]();
  await step(1, async () => { note("ブラウザが受け取る応答を読む（開発者ツールの Network の代わり）"); });
  let e!: アーキタイプ編集画面;
  await step(2, async () => { e = await 新規を開く(page); });
  await step(3, async () => { await e.入力する({ 名日: 名.名日, 名英: 名.名英, フォーマット: フォーマットB }); });
  let r = { 要求の応答: 0, 最後の応答: 0, 最後の画面: "" };
  await step(4, async () => { r = await e.送信する(e.新規登録ボタン); });
  await step(5, async () => { note(`新規登録の保存要求の応答: ${r.要求の応答}、移った画面: ${r.最後の画面}`); });
  await expected(async () => { expect(r.要求の応答, "新規登録の保存要求の応答（HTTPステータス）").toBe(302); });
});

caseTest("IT-M15-09-015", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = notes.get("〔アーキタイプID-M1509-015〕");
  let e!: アーキタイプ編集画面;
  await step(1, async () => { e = await 編集を開く(page, id); });
  await step(2, async () => { await e.入力する({ 名日: "更新後アーキタイプ", 名英: "Updated Archetype", 解説日: "更新後解説", 解説英: "Updated Description" }); });
  const 新カード = notes.get("〔画像ID-M1509-015〕");
  await step(3, async () => {
    const { 名英 } = 代表カード015();
    await e.入力する({ 代表カード: { 語: 名英, 画像ID: 新カード }, 公開状態: "非公開", カラー: ["赤"], フォーマット: フォーマットC, タグ: [タグB] });
    note(`${検索の注記}。${画像の注記}。カラーは「赤」だけ、タグは「タグB」だけにした（「白」「タグA」は外した）`);
  });
  await step(4, async () => { await e.送信する(e.更新ボタン); note(`更新後の表示: ${[...await e.成功の帯(), ...await e.エラーの帯()].join(" / ")}`); });
  let r: ReturnType<typeof アーキタイプの保存内容> = null;
  await step(5, async () => { r = アーキタイプの保存内容(id); });
  await expected(async () => {
    expect(r, `ID ${id} のアーキタイプ`).not.toBeNull();
    expect.soft(r!.名日, "アーキタイプ名(日)").toBe("更新後アーキタイプ");
    expect.soft(r!.名英, "アーキタイプ名(英)").toBe("Updated Archetype");
    expect.soft(r!.解説日, "解説(日)").toBe("更新後解説");
    expect.soft(r!.解説英, "解説(英)").toBe("Updated Description");
    expect.soft(r!.代表カード画像ID, "代表カードの画像ID").toBe(新カード);
    expect.soft(r!.公開状態, "公開状態").toBe("非公開");
    expect.soft(r!.カラー, "カラー").toEqual(["赤"]);
    expect.soft(r!.フォーマット, "フォーマット").toBe(フォーマットC);
    expect.soft(r!.タグ, "タグ").toEqual([タグB]);
  });
});

caseTest("IT-M15-09-016", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = notes.get("〔アーキタイプID-M1509-016〕");
  let e!: アーキタイプ編集画面;
  await step(1, async () => { e = await 編集を開く(page, id); });
  await step(2, async () => { await e.名日.fill("更新遷移アーキタイプ"); });
  await step(3, async () => { await e.送信する(e.更新ボタン); });
  await expected(async () => {
    expect.soft(パス(page), "移った画面").toBe(編集画面のパス(id));
    await expect.soft(e.名日, "移った編集画面のアーキタイプ名(日)").toHaveValue("更新遷移アーキタイプ");
  });
});

caseTest("IT-M15-09-017", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = notes.get("〔アーキタイプID-M1509-017〕");
  await step(1, async () => { note("ブラウザが受け取る応答を読む（開発者ツールの Network の代わり）"); });
  let e!: アーキタイプ編集画面;
  await step(2, async () => { e = await 編集を開く(page, id); });
  await step(3, async () => { await e.名日.fill("更新応答アーキタイプ"); });
  let r = { 要求の応答: 0, 最後の応答: 0, 最後の画面: "" };
  await step(4, async () => { r = await e.送信する(e.更新ボタン); });
  await step(5, async () => { note(`更新の保存要求の応答: ${r.要求の応答}、移った画面: ${r.最後の画面}`); });
  await expected(async () => { expect(r.要求の応答, "更新の保存要求の応答（HTTPステータス）").toBe(302); });
});

caseTest("IT-M15-09-020", async ({ page, step, expected }) => {
  await login(page);
  let e!: アーキタイプ編集画面;
  await step(1, async () => { e = await 新規を開く(page); });
  await step(2, async () => { await e.入力する(最大); });
  await step(3, async () => {
    await e.入力する({ フォーマット: フォーマットB });
    await e.送信する(e.新規登録ボタン);
    note(`登録後の表示: ${[...await e.成功の帯(), ...await e.エラーの帯(), ...await e.入力エラー()].join(" / ")}`);
  });
  let ids: string[] = [];
  await step(4, async () => { ids = 四項目の一致するアーキタイプのID(最大.名日, 最大.名英, 最大.解説日, 最大.解説英); });
  await expected(async () => {
    expect(ids.length, "名称255文字・解説1024文字の値のアーキタイプの件数").toBe(1);
    const r = アーキタイプの保存内容(ids[0])!;
    expect.soft(r.名日.length, "アーキタイプ名(日)の文字数").toBe(255);
    expect.soft(r.名英.length, "アーキタイプ名(英)の文字数").toBe(255);
    expect.soft(r.解説日.length, "解説(日)の文字数").toBe(1024);
    expect.soft(r.解説英.length, "解説(英)の文字数").toBe(1024);
  });
});

caseTest("IT-M15-09-022", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = notes.get("〔アーキタイプID-M1509-022〕");
  let e!: アーキタイプ編集画面;
  await step(1, async () => { e = await 編集を開く(page, id); });
  await step(2, async () => { await e.入力する(最大); });
  await step(3, async () => { await e.送信する(e.更新ボタン); note(`更新後の表示: ${[...await e.成功の帯(), ...await e.エラーの帯(), ...await e.入力エラー()].join(" / ")}`); });
  let r: ReturnType<typeof アーキタイプの保存内容> = null;
  await step(4, async () => { r = アーキタイプの保存内容(id); });
  await expected(async () => {
    expect(r, `ID ${id} のアーキタイプ`).not.toBeNull();
    expect.soft(r!.名日, "アーキタイプ名(日)（「あ」255文字）").toBe(最大.名日);
    expect.soft(r!.名英, "アーキタイプ名(英)（「A」255文字）").toBe(最大.名英);
    expect.soft(r!.解説日, "解説(日)（「い」1024文字）").toBe(最大.解説日);
    expect.soft(r!.解説英, "解説(英)（「B」1024文字）").toBe(最大.解説英);
  });
});

/** 024・025: 解説・代表カード・公開状態・カラー・タグを空にする */
async function 任意項目を空にする(e: アーキタイプ編集画面): Promise<void> {
  await e.入力する({ 解説日: "", 解説英: "", カラー: [], タグ: [] });
  await e.代表カードを空にする();
  if (await e.空の選択肢があるか(e.公開状態)) await e.公開状態.selectOption("");
  else note(`公開状態の選択欄に空の選択肢が無く、空にできない（選択肢: ${(await e.選択肢(e.公開状態)).join("、")}。選ばれている値「${(await e.選択中(e.公開状態)).join("、")}」のまま送った）`);
}

caseTest("IT-M15-09-024", async ({ page, step, expected }) => {
  await login(page);
  const 名 = 新規の名前["024"]();
  let e!: アーキタイプ編集画面;
  await step(1, async () => { e = await 新規を開く(page); });
  await step(2, async () => { await e.入力する({ 名日: 名.名日, 名英: 名.名英, フォーマット: フォーマットB }); });
  await step(3, async () => { await 任意項目を空にする(e); });
  await step(4, async () => { await e.送信する(e.新規登録ボタン); note(`登録後の表示: ${[...await e.成功の帯(), ...await e.エラーの帯(), ...await e.入力エラー()].join(" / ")}`); });
  let ids: string[] = [];
  await step(5, async () => { ids = アーキタイプ名日のID(名.名日); });
  await expected(async () => {
    expect(ids.length, `アーキタイプ名(日)「${名.名日}」のアーキタイプの件数`).toBe(1);
    const r = アーキタイプの保存内容(ids[0])!;
    expect.soft(r.名英, "アーキタイプ名(英)").toBe(名.名英);
    expect.soft(r.フォーマット, "フォーマット").toBe(フォーマットB);
    expect.soft(r.解説日, "解説(日)（空）").toBe("");
    expect.soft(r.解説英, "解説(英)（空）").toBe("");
    expect.soft(r.代表カード画像ID, "代表カード（空）").toBe("");
    expect.soft(r.公開状態, "公開状態（空）").toBe("");
    expect.soft(r.カラー, "カラー（空）").toEqual([]);
    expect.soft(r.タグ, "タグ（空）").toEqual([]);
  });
});

caseTest("IT-M15-09-025", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = notes.get("〔アーキタイプID-M1509-025〕");
  let e!: アーキタイプ編集画面;
  await step(1, async () => { e = await 編集を開く(page, id); });
  await step(2, async () => { await 任意項目を空にする(e); });
  await step(3, async () => { await e.送信する(e.更新ボタン); note(`更新後の表示: ${[...await e.成功の帯(), ...await e.エラーの帯(), ...await e.入力エラー()].join(" / ")}`); });
  let r: ReturnType<typeof アーキタイプの保存内容> = null;
  await step(4, async () => { r = アーキタイプの保存内容(id); });
  await expected(async () => {
    expect(r, `ID ${id} のアーキタイプ`).not.toBeNull();
    expect.soft(r!.解説日, "解説(日)（空）").toBe("");
    expect.soft(r!.解説英, "解説(英)（空）").toBe("");
    expect.soft(r!.代表カード画像ID, "代表カード（空）").toBe("");
    expect.soft(r!.公開状態, "公開状態（空）").toBe("");
    expect.soft(r!.カラー, "カラー（空）").toEqual([]);
    expect.soft(r!.タグ, "タグ（空）").toEqual([]);
  });
});

// ---------------------------------------------------------------- 代表カード検索

caseTest("IT-M15-09-026", async ({ page, step, expected }) => {
  await login(page);
  let e!: アーキタイプ編集画面;
  await step(1, async () => { e = await 新規を開く(page); });
  await step(2, async () => { await e.代表カード選択ボタン.click(); });
  await expected(async () => {
    await expect.soft(e.代表カード検索画面, "代表カード検索の画面").toBeVisible();
    await expect.soft(e.代表カード検索の題名, "画面の題名").toHaveText(/^\s*代表カード検索\s*$/);
    await expect.soft(e.検索語の欄, "カード名の欄").toBeVisible();
    await expect.soft(e.代表カード検索ボタン, "「検索」ボタン").toBeVisible();
  });
});

/** 開始時に新規登録画面を開き、代表カード検索の画面を開いた状態にする（事前準備） */
async function 検索の画面を開いておく(page: Page): Promise<アーキタイプ編集画面> {
  const e = await 新規を開く(page);
  await e.代表カード検索を開く();
  return e;
}
const ページ用ID = (notes: { get(l: string): string }) => notes.get("〔ページ用画像ID-M1509-共有〕").split("、");

caseTest("IT-M15-09-030", async ({ page, step, expected }) => {
  await login(page);
  const e = await 検索の画面を開いておく(page);
  await step(1, async () => { await e.代表カードを検索する(ページカード); note(検索の注記); });
  await step(2, async () => { await e.代表カード検索のページを押す(2); });
  let body = { page: 0, totalPages: 0, totalCount: 0, items: [] as unknown[] };
  await step(3, async () => { body = await e.代表カードを検索する("Blue"); note(`「Blue」の検索の応答: ${body.totalCount}件・${body.totalPages}ページ中 ${body.page}ページ目`); });
  await expected(async () => {
    await expect.soft(e.検索語の欄, "カード名の欄（変更後の検索語）").toHaveValue("Blue");
    expect.soft(body.page, "表示しているページ（応答）").toBe(1);
    const p = await e.代表カード検索のページ();
    if (p.番号.length) expect.soft(p.現在, "ページ送りのいまのページ").toBe("1");
    const rows = await e.代表カード検索の結果();
    expect.soft(rows.length > 0 && rows.every((r) => /blue/i.test(r.名前)), `検索結果の行が「Blue」の結果である（${rows.map((r) => r.名前).join(" / ")}）`).toBe(true);
  });
});

caseTest("IT-M15-09-031", async ({ page, notes, step, expected }) => {
  await login(page);
  const e = await 検索の画面を開いておく(page);
  await step(1, async () => { await e.代表カードを検索する(ページカード); note(検索の注記); });
  await step(2, async () => { await e.代表カード検索のページを押す(2); });
  await expected(async () => {
    await expect.soft(e.検索語の欄, "カード名の欄（検索語）").toHaveValue(ページカード);
    expect.soft((await e.代表カード検索のページ()).現在, "ページ送りのいまのページ").toBe("2");
    expect.soft((await e.代表カード検索の結果()).map((r) => r.ID), "表示された行（2ページ目の画像ID）").toEqual(ページ用ID(notes).slice(10, 20));
  });
});

caseTest("IT-M15-09-032", async ({ page, notes, step, expected }) => {
  await login(page);
  const e = await 検索の画面を開いておく(page);
  await step(1, async () => { await e.代表カードを検索する(代表カード.名英); note(検索の注記); });
  let rows: { ID: string; 名前: string; 画像: string }[] = [];
  await step(2, async () => { rows = await e.代表カード検索の結果(); });
  await expected(async () => {
    const id = notes.get("〔画像ID-M1509-共有〕");
    const hit = rows.filter((r) => r.ID === id);
    expect(hit.length, `検索結果の画像ID ${id} の行`).toBe(1);
    expect.soft(hit[0].名前, "カード名").toBe(代表カードの表示名);
    expect.soft(参照先(hit[0].画像).endsWith(URLの末尾(代表カード.画像URL)), `画像の参照先（${hit[0].画像}）が ${代表カード.画像URL} の画像`).toBe(true);
  });
});

/** 033・034: 代表カード検索を開き、検索して、行の「選択」を押す */
function 選んで確かめる(何を: "反映" | "閉じる"): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await login(page);
    const id = notes.get("〔画像ID-M1509-共有〕");
    const e = await 新規を開く(page);
    await step(1, async () => { await e.代表カード検索を開く(); });
    await step(2, async () => { await e.代表カードを検索する(代表カード.名英); note(検索の注記); });
    await step(3, async () => {
      await expect(e.選択ボタン(id), `検索結果の画像ID ${id} の「選択」`).toHaveCount(1);
      await e.選択ボタン(id).click();
      note(画像の注記);
    });
    await expected(async () => {
      if (何を === "閉じる") {
        await expect(e.代表カード検索画面, "代表カード検索の画面").toBeHidden();
        return;
      }
      const c = await e.代表カード();
      expect.soft(c.画像ID, "入力フォームの代表カードの画像ID").toBe(id);
      expect.soft(参照先(c.画像).endsWith(URLの末尾(代表カード.画像URL)), `入力フォームの代表カードの画像（${c.画像}）が画像ID ${id} の画像`).toBe(true);
      expect.soft(c.名前, "入力フォームの代表カードの名称").toBe(代表カードの表示名);
    });
  };
}
caseTest("IT-M15-09-033", 選んで確かめる("反映"));
caseTest("IT-M15-09-034", 選んで確かめる("閉じる"));

/** 押してから一定の時間に、画面が送った要求（画面の読み込み以外）を集める */
function 要求を集める(page: Page): { 止める: () => Request[] } {
  const reqs: Request[] = [];
  const on = (r: Request) => { if (!["image", "stylesheet", "font", "script"].includes(r.resourceType())) reqs.push(r); };
  page.on("request", on);
  return { 止める: () => { page.off("request", on); return reqs; } };
}

caseTest("IT-M15-09-035", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = notes.get("〔画像ID-M1509-共有〕");
  const e = await 検索の画面を開いておく(page);
  await e.代表カードを検索する(代表カード.名英);
  let 集め!: { 止める: () => Request[] };
  await step(1, async () => { 集め = 要求を集める(page); note("ブラウザが送る要求と応答を読む（開発者ツールの Network の代わり）"); });
  await step(2, async () => { await e.選択ボタン(id).click(); note(画像の注記); await page.waitForTimeout(3_000); });
  let 本文 = "";
  await step(3, async () => {
    const reqs = 集め.止める();
    note(`「選択」を押したあとに送られた要求: ${reqs.length ? reqs.map((r) => `${r.method()} ${pathOf(r.url())}`).join(" / ") : "なし（代表カード確定の要求は送られなかった）"}`);
    for (const r of reqs) { const res = await r.response(); if (res) 本文 += await res.text().catch(() => ""); }
  });
  await expected(async () => {
    expect.soft(本文, "代表カード確定要求の応答に和英混合名").toContain(代表カードの表示名);
    expect.soft(本文, "代表カード確定要求の応答に画像URL").toContain(代表カード.画像URL);
  });
});

caseTest("IT-M15-09-036", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = notes.get("〔画像ID-M1509-共有〕");
  const e = await 検索の画面を開いておく(page);
  await e.代表カードを検索する(代表カード.名英);
  let 集め!: { 止める: () => Request[] };
  await step(1, async () => { 集め = 要求を集める(page); note("ブラウザが送る要求と応答を読む（開発者ツールの Network の代わり）"); });
  await step(2, async () => {
    const b = await e.選択ボタンの画像IDを書き換える(id, "999999");
    note(`検索結果の画像ID ${id} の行の「選択」ボタンが持つ画像IDを 999999 に書き換えて押した。${画像の注記}`);
    await b.click();
    await page.waitForTimeout(3_000);
  });
  let 応答: number | null = null;
  let 本文: string | null = null;
  await step(3, async () => {
    const reqs = 集め.止める();
    note(`「選択」を押したあとに送られた要求: ${reqs.length ? reqs.map((r) => `${r.method()} ${pathOf(r.url())}`).join(" / ") : "なし（代表カード確定の要求は送られなかった）"}。入力フォームの代表カードの画像ID: ${await e.代表カードID.inputValue()}`);
    for (const r of reqs) { const res = await r.response(); if (res) { 応答 = res.status(); 本文 = await res.text().catch(() => ""); } }
  });
  await expected(async () => {
    expect.soft(応答, "代表カード確定要求の応答（HTTPステータス）").toBe(404);
    expect.soft(本文, "代表カード確定要求の応答本文（空）").toBe("");
  });
});

caseTest("IT-M15-09-037", async ({ page, step, expected }) => {
  await login(page);
  const e = await 検索の画面を開いておく(page);
  let 検索要求!: Request;
  await step(1, async () => {
    const req = page.waitForRequest((r) => r.url().includes("/archetype/search_card_image") && r.method() === "POST");
    await e.代表カードを検索する(代表カード.名英);
    検索要求 = await req;
    note(検索の注記);
  });
  let 送る: { url: string; body: string; headers: Record<string, string> } = { url: "", body: "", headers: {} };
  await step(2, async () => {
    const h = await 検索要求.allHeaders();
    送る = { url: 検索要求.url(), body: 検索要求.postData() ?? "", headers: { "content-type": h["content-type"] ?? "application/x-www-form-urlencoded; charset=UTF-8" } };
    note(`検索要求: POST ${pathOf(送る.url)}、非同期要求を示すヘッダ: ${h["x-requested-with"] ?? "（なし）"}、送った中身: ${送る.body}`);
  });
  let 応答 = 0;
  let 中身: { items?: unknown[]; totalPages?: number; page?: number } | string = "";
  await step(3, async () => {
    const res = await page.request.post(送る.url, { headers: 送る.headers, data: 送る.body });
    応答 = res.status();
    const t = await res.text();
    try { 中身 = JSON.parse(t); } catch { 中身 = t; }
    note("非同期要求を示すヘッダ（X-Requested-With）を付けずに、同じ中身の要求を同じログインの状態で送り直した");
  });
  await step(4, async () => { note(`送り直した要求の応答: ${応答}、中身: ${typeof 中身 === "string" ? 中身.slice(0, 300) : JSON.stringify(中身).slice(0, 300)}`); });
  await expected(async () => {
    const j = typeof 中身 === "string" ? {} : 中身;
    expect.soft((j.items ?? null) as unknown, "非同期でない要求の応答の検索結果（空）").toEqual([]);
    expect.soft(j.totalPages ?? null, "非同期でない要求の応答のページ送り（空）").toBe(0);
  });
});

// ---------------------------------------------------------------- 不明な代表カード画像

caseTest("IT-M15-09-039", async ({ page, step, expected }) => {
  await login(page);
  const 名 = 新規の名前["039"]();
  let e!: アーキタイプ編集画面;
  await step(1, async () => { e = await 新規を開く(page); });
  await step(2, async () => { await e.入力する({ 名日: 名.名日, 名英: 名.名英, フォーマット: フォーマットB }); });
  await step(3, async () => { await e.代表カードIDを書き換える("999999"); });
  await step(4, async () => { await e.送信する(e.新規登録ボタン); });
  let 帯: string[] = [];
  await step(5, async () => { 帯 = await e.エラーの帯(); note(`画面上部のメッセージ: ${[...帯, ...await e.成功の帯()].join(" / ") || "なし"}、表示中の画面: ${page.url()}`); });
  await expected(async () => {
    expect.soft(帯.some((t) => t.includes("指定された代表カード画像が見つかりません。")), `画面上部のメッセージ（${帯.join(" / ")}）に「指定された代表カード画像が見つかりません。」`).toBe(true);
    expect.soft(パス(page), "表示中の画面（アーキタイプ新規登録画面）").toBe(新規登録画面のパス());
    await expect.soft(e.新規登録ボタン, "アーキタイプ登録画面の「新規登録」ボタン").toBeVisible();
  });
});

caseTest("IT-M15-09-040", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = notes.get("〔アーキタイプID-M1509-040〕");
  let e!: アーキタイプ編集画面;
  await step(1, async () => { e = await 編集を開く(page, id); });
  await step(2, async () => { await e.名日.fill("不明画像更新"); });
  await step(3, async () => { await e.代表カードIDを書き換える("999999"); });
  await step(4, async () => { await e.送信する(e.更新ボタン); note(`更新後の表示: ${[...await e.成功の帯(), ...await e.エラーの帯()].join(" / ")}`); });
  await expected(async () => {
    expect.soft(パス(page), "表示中の画面").toBe(編集画面のパス(id));
    await expect.soft(e.更新ボタン, "アーキタイプ編集画面の「更新」ボタン").toBeVisible();
  });
});

caseTest("IT-M15-09-041", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = notes.get("〔アーキタイプID-M1509-041〕");
  let e!: アーキタイプ編集画面;
  await step(1, async () => { e = await 編集を開く(page, id); });
  await step(2, async () => { await e.名日.fill("不明画像更新"); });
  await step(3, async () => { await e.代表カードIDを書き換える("999999"); });
  await step(4, async () => { await e.送信する(e.更新ボタン); note(`更新後の表示: ${[...await e.成功の帯(), ...await e.エラーの帯()].join(" / ")}`); });
  let r: ReturnType<typeof アーキタイプの保存内容> = null;
  await step(5, async () => { r = アーキタイプの保存内容(id); });
  await expected(async () => {
    expect(r, `ID ${id} のアーキタイプ`).not.toBeNull();
    expect.soft(r!.名日, "アーキタイプ名(日)（更新されない）").toBe(編集前("041").名日);
    expect.soft(r!.代表カード画像ID, "代表カードの画像ID（更新されない）").toBe(notes.get("〔画像ID-M1509-共有〕"));
  });
});

caseTest("IT-M15-09-042", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = notes.get("〔アーキタイプID-M1509-042〕");
  const 新 = notes.get("〔画像ID-M1509-042〕");
  const c = 代表カード042();
  let e!: アーキタイプ編集画面;
  await step(1, async () => { e = await 編集を開く(page, id); });
  await step(2, async () => { await e.代表カードを選ぶ(c.名英, 新, { 完全一致: true }); note(`代表カード検索で「${c.名英}」を完全一致で検索し、画像ID ${新} の行の「選択」を押した。${画像の注記}`); });
  await step(3, async () => { await e.名日.fill(""); });
  await step(4, async () => { await e.送信する(e.更新ボタン); note(`更新後の表示: ${[...await e.エラーの帯(), ...await e.入力エラー()].join(" / ")}`); });
  await expected(async () => {
    expect.soft((await e.入力エラー()).length + (await e.エラーの帯()).length > 0, "入力エラーで再表示された画面（エラーの表示がある）").toBe(true);
    const k = await e.代表カード();
    expect.soft(k.画像ID, "代表カードの画像ID").toBe(新);
    expect.soft(参照先(k.画像).endsWith(URLの末尾(c.画像URL)), `代表カードの画像（${k.画像}）が画像ID ${新} の画像`).toBe(true);
    expect.soft(k.名前, "代表カードの名称").toBe(`${c.名日} / ${c.名英}`);
  });
});

// ---------------------------------------------------------------- 削除

/** 043・044: 削除を押してキャンセル */
function 削除をキャンセル(DBで: boolean): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await login(page);
    const id = notes.get("〔アーキタイプID-M1509-共有B〕");
    let e!: アーキタイプ編集画面;
    await step(1, async () => { e = await 編集を開く(page, id); });
    let d!: Awaited<ReturnType<アーキタイプ編集画面["削除を押す"]>>;
    await step(2, async () => { d = await e.削除を押す(); note(`確認ダイアログ「${d.文}」が出た`); });
    await step(3, async () => { const r = await d.キャンセルを押す(); note(`確認ダイアログでキャンセルを押した。削除の要求: ${r.送った ? "送られた" : "送られなかった"}`); });
    let r: ReturnType<typeof アーキタイプの保存内容> = null;
    if (DBで) await step(4, async () => { r = アーキタイプの保存内容(id); });
    await expected(async () => {
      if (DBで) {
        expect(r, `ID ${id} のアーキタイプ（削除されていない）`).not.toBeNull();
        expect.soft(r!.削除日時, "削除日時（設定されていない）").toBe("");
        return;
      }
      expect.soft(パス(page), "表示中の画面").toBe(編集画面のパス(id));
      await expect.soft(e.更新ボタン, "アーキタイプ編集画面の「更新」ボタン").toBeVisible();
    });
  };
}
caseTest("IT-M15-09-043", 削除をキャンセル(false));
caseTest("IT-M15-09-044", 削除をキャンセル(true));

/** 045・047・048: 削除して OK を押し、DB で確かめる */
function 削除してDBで(key: string, 削除される: boolean): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await login(page);
    const id = notes.get(`〔アーキタイプID-M1509-${key}〕`);
    let e!: アーキタイプ編集画面;
    await step(1, async () => { e = await 編集を開く(page, id); });
    let d!: Awaited<ReturnType<アーキタイプ編集画面["削除を押す"]>>;
    await step(2, async () => { d = await e.削除を押す(); note(`確認ダイアログ「${d.文}」が出た`); });
    await step(3, async () => {
      const r = await d.OKを押す();
      note(`確認ダイアログで OK を押した。削除の要求の応答 ${r.要求の応答}、移った画面 ${r.最後の画面}、メッセージ: ${[...await e.成功の帯(), ...await e.エラーの帯()].join(" / ")}`);
    });
    let r: ReturnType<typeof アーキタイプの保存内容> = null;
    await step(4, async () => { r = アーキタイプの保存内容(id); });
    await expected(async () => {
      expect(r, `ID ${id} のアーキタイプの行（物理削除されずに残る）`).not.toBeNull();
      if (削除される) expect.soft(r!.削除日時, "削除日時（設定される）").not.toBe("");
      else expect.soft(r!.削除日時, "削除日時（設定されない）").toBe("");
    });
  };
}
caseTest("IT-M15-09-045", 削除してDBで("045", false));
caseTest("IT-M15-09-047", 削除してDBで("047", false));
caseTest("IT-M15-09-048", 削除してDBで("048", true));

caseTest("IT-M15-09-046", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = notes.get("〔アーキタイプID-M1509-046〕");
  let e!: アーキタイプ編集画面;
  await step(1, async () => { e = await 編集を開く(page, id); });
  let d!: Awaited<ReturnType<アーキタイプ編集画面["削除を押す"]>>;
  await step(2, async () => { d = await e.削除を押す(); note(`確認ダイアログ「${d.文}」が出た`); });
  await step(3, async () => {
    const r = await d.OKを押す();
    note(`確認ダイアログで OK を押した。移った画面 ${r.最後の画面}、メッセージ: ${[...await e.成功の帯(), ...await e.エラーの帯()].join(" / ")}`);
  });
  await expected(async () => {
    expect.soft(パス(page), "移った画面").toBe(編集画面のパス(id));
    await expect.soft(e.更新ボタン, "アーキタイプ編集画面の「更新」ボタン").toBeVisible();
  });
});

caseTest("IT-M15-09-049", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = notes.get("〔アーキタイプID-M1509-049〕");
  const l = new アーキタイプ一覧(page);
  await step(1, async () => {
    await l.開く();
    await l.名前で検索する(削除049の語());
    await l.表示件数を選ぶ(10);
    await l.ページを押す(2);
    note(`アーキタイプ名に「${削除049の語()}」を入れて「検索する」を押し、表示件数「10件」を選んで、ページ送りの「2」を押した`);
  });
  let e!: アーキタイプ編集画面;
  await step(2, async () => { e = await l.編集を押す(id); });
  let d!: Awaited<ReturnType<アーキタイプ編集画面["削除を押す"]>>;
  await step(3, async () => { d = await e.削除を押す(); note(`確認ダイアログ「${d.文}」が出た`); });
  await step(4, async () => { const r = await d.OKを押す(); note(`確認ダイアログで OK を押した。移った画面 ${r.最後の画面}`); });
  await expected(async () => {
    expect.soft(パス(page), "移った画面（アーキタイプ一覧）").toBe(アーキタイプ一覧のパス());
    await expect.soft(l.名前の欄, "アーキタイプ一覧のアーキタイプ名の欄").toBeVisible();
  });
});

caseTest("IT-M15-09-050", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = notes.get("〔アーキタイプID-M1509-050〕");
  await step(1, async () => { note("ブラウザが受け取る応答を読む（開発者ツールの Network の代わり）"); });
  let e!: アーキタイプ編集画面;
  await step(2, async () => { e = await 編集を開く(page, id); });
  let d!: Awaited<ReturnType<アーキタイプ編集画面["削除を押す"]>>;
  await step(3, async () => { d = await e.削除を押す(); note(`確認ダイアログ「${d.文}」が出た`); });
  let r = { 要求の応答: 0, 最後の応答: 0, 最後の画面: "" };
  await step(4, async () => { r = await d.OKを押す(); });
  await step(5, async () => { note(`削除要求の応答 ${r.要求の応答}、移った画面 ${r.最後の画面}`); });
  await expected(async () => { expect(r.要求の応答, "削除要求の応答（HTTPステータス）").toBe(302); });
});

/** 051・052: 削除フォームの送信先のIDを書き換えて削除する */
function 送信先を書き換えて削除(値: string): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await login(page);
    const id = notes.get("〔アーキタイプID-M1509-共有C〕");
    let e!: アーキタイプ編集画面;
    await step(1, async () => { e = await 編集を開く(page, id); });
    await step(2, async () => { const a = await e.削除の送信先のIDを書き換える(値); note(`削除フォームの送信先: ${a}`); });
    let r = { 文: "", 要求の応答: 0, 最後の応答: 0, 最後の画面: "" };
    await step(3, async () => { r = await e.削除してOKを押す(); });
    await step(4, async () => { note(`確認ダイアログ「${r.文}」で OK を押した。削除要求の応答 ${r.要求の応答}、表示された画面 ${r.最後の画面}`); });
    await expected(async () => { expect(r.要求の応答, `ID「${値}」の削除要求の応答（HTTPステータス）`).toBe(404); });
  };
}
caseTest("IT-M15-09-051", 送信先を書き換えて削除("invalid-id"));
caseTest("IT-M15-09-052", 送信先を書き換えて削除("999999"));

caseTest("IT-M15-09-053", async ({ page, browser, notes, step, expected }) => {
  await login(page);
  const id = notes.get("〔アーキタイプID-M1509-053〕");
  let a!: アーキタイプ編集画面;
  await step(1, async () => { a = await 編集を開く(page, id); await a.名日.fill("競合更新"); note("ブラウザA＝このケースの画面"); });
  await step(2, async () => {
    await withAdminSession(browser, M1509_ADMIN, async (pb) => {
      const b = new アーキタイプ編集画面(pb);
      const st = await b.編集を開く(id);
      if (st !== 200) throw new Error(`ブラウザBで ID ${id} の編集画面を開けない（応答 ${st}）`);
      const r = await b.削除してOKを押す();
      note(`ブラウザB（別のブラウザの状態で同じ管理者がログイン）で削除し、確認ダイアログ「${r.文}」で OK を押した。応答 ${r.要求の応答}、メッセージ: ${(await b.成功の帯()).join(" / ")}`);
    });
  });
  let r = { 要求の応答: 0, 最後の応答: 0, 最後の画面: "" };
  await step(3, async () => { r = await a.送信する(a.更新ボタン); });
  await step(4, async () => { note(`ブラウザAの更新要求の応答 ${r.要求の応答}、表示された画面 ${r.最後の画面}`); });
  await expected(async () => { expect(r.要求の応答, "削除済みのアーキタイプへの更新要求の応答（HTTPステータス）").toBe(404); });
});

caseTest("IT-M15-09-054", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = notes.get("〔アーキタイプID-M1509-054〕");
  const l = new アーキタイプ一覧(page);
  await step(1, async () => {
    await l.開く();
    await l.名前で検索する(id);
    note(`アーキタイプ管理の検索の欄は「アーキタイプ名」だけ（IDの欄は無い）。その欄に ID ${id} を入れて「検索する」を押した`);
  });
  let 行: { ID: string; 登録デッキ数: string }[] = [];
  await step(2, async () => { 行 = await l.行(); note(`検索結果の行: ${行.length ? 行.map((x) => `ID ${x.ID}（登録デッキ数 ${x.登録デッキ数}）`).join(" / ") : "なし"}`); });
  await expected(async () => {
    const hit = 行.filter((x) => x.ID === id);
    expect(hit.length, `検索結果の ID ${id} の行`).toBe(1);
    expect.soft(hit[0].登録デッキ数, "登録デッキ数").toBe("1");
  });
});

// ---------------------------------------------------------------- 連携試験（店頭のデッキ検索・デッキリスト詳細）

caseTest("IT-M15-09-061", async ({ page, step, expected }) => {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(120_000);
  const 選手 = QM名("001", "選手");
  const 旧 = { 日: QM名("001", "旧型"), 英: QM名("001", "OldType") };
  const 新 = { 日: QM名("001", "新型"), 英: QM名("001", "NewType") };
  /** デッキ検索TOP→詳細検索の「クリア」→プレイヤー名→「検索」。プレイヤーの行のアーキタイプの表示を返す */
  const 店頭で検索 = async (): Promise<string[]> => {
    await new DeckTopPage(page).開く();
    const m = new DeckSearchModal(page);
    await m.開く();
    await m.クリアする();
    await m.入れる("player", 選手);
    await m.検索する();
    return (await new DeckResultPage(page).行()).filter((r) => r.プレイヤー === 選手).map((r) => r.アーキタイプ);
  };
  const クリアの注記 = "「クリア」とプレイヤー名の欄は、デッキ検索TOPの画面上部の「詳細検索」で開く画面の中にある。開いてから押した";
  await step(1, async () => { await 店頭で検索(); note(クリアの注記); });
  await step(2, async () => {
    const a = (await new DeckResultPage(page).行()).filter((r) => r.プレイヤー === 選手).map((r) => r.アーキタイプ);
    expect(a, `プレイヤー「${選手}」の行のアーキタイプ`).toEqual([`${旧.日}/${旧.英}`]);
  });
  await step(3, async () => { await loginAdmin(page, M1509_QM); });
  const l = new アーキタイプ一覧(page);
  let id = "";
  await step(4, async () => {
    await l.開く();
    await l.名前で検索する(旧.日);
    const hit = (await l.行()).filter((r) => r.名日 === 旧.日);
    expect(hit.length, `検索結果の「${旧.日}」の行`).toBe(1);
    id = hit[0].ID;
  });
  let e!: アーキタイプ編集画面;
  await step(5, async () => { e = await l.編集を押す(id); });
  await step(6, async () => { await e.入力する({ 名日: 新.日, 名英: 新.英 }); await e.送信する(e.更新ボタン); note(`更新後の表示: ${[...await e.成功の帯(), ...await e.エラーの帯()].join(" / ")}`); });
  let 表示: string[] = [];
  await step(7, async () => { 表示 = await 店頭で検索(); note(クリアの注記); });
  await expected(async () => {
    expect(表示, `プレイヤー「${選手}」の行のアーキタイプ`).toEqual([`${新.日}/${新.英}`]);
  });
});

caseTest("IT-M15-09-062", async ({ page, notes, step, expected }) => {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(120_000);
  const deckId = notes.get("〔デッキID-M1509-002〕");
  const 旧 = { 日: QM名("002", "旧型"), 英: QM名("002", "OldType") };
  const 新 = { 日: QM名("002", "新型"), 英: QM名("002", "NewType") };
  await step(1, async () => {
    const st = await デッキリスト詳細を開く(page, deckId);
    expect(st, "デッキリスト詳細の応答").toBe(200);
    expect((await 情報欄(page))["アーキタイプ"] ?? "", "情報欄のアーキタイプ").toBe(旧.日);
  });
  await step(2, async () => { await loginAdmin(page, M1509_QM); });
  const l = new アーキタイプ一覧(page);
  let id = "";
  await step(3, async () => {
    await l.開く();
    await l.名前で検索する(旧.日);
    const hit = (await l.行()).filter((r) => r.名日 === 旧.日);
    expect(hit.length, `検索結果の「${旧.日}」の行`).toBe(1);
    id = hit[0].ID;
  });
  let e!: アーキタイプ編集画面;
  await step(4, async () => { e = await l.編集を押す(id); });
  await step(5, async () => { await e.入力する({ 名日: 新.日, 名英: 新.英 }); await e.送信する(e.更新ボタン); note(`更新後の表示: ${[...await e.成功の帯(), ...await e.エラーの帯()].join(" / ")}`); });
  let 欄: Record<string, string> = {};
  await step(6, async () => { await デッキリスト詳細を開く(page, deckId); 欄 = await 情報欄(page); });
  await expected(async () => {
    expect(欄["アーキタイプ"] ?? "", "開き直したデッキリスト詳細の情報欄のアーキタイプ").toBe(新.日);
  });
});
