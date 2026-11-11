// 取り込み注記: 同じ機能を main 側（別の方）も実装していたため、栗野側の版を別ファイルにした。main に無いケースだけを残している（main にあるケースは main を優先して除いた）。
/**
 * M14-09 フォーマット一覧（管理画面）。正本: cases/M14-09_test_cases.tsv
 *
 * - フォーマット・カードなどの名前は、末尾に実行ごとの印を付けて作り、正本の名前（「スタンダード / Standard」など）も同じ印つきの名前として読む
 *   （seeds/m14-09.ts の冒頭）。行はフォーマットIDで特定する。
 * - 正本の「ポップアップの「実行」」は、確認ポップアップの「削除」ボタン（表示名「削除」）。
 * - 正本の「フォーマット登録」「フォーマット更新」は、フォーマット詳細画面の送信ボタン（登録・更新とも表示名「登録」）。
 * - 正本の「フォーマット一覧」（フォーマット詳細画面の一覧へ戻るリンク）は、表示名「フォーマット管理」のリンク。
 * - 正本の手順「開発者ツールで…を変更する」は、確認ポップアップの「削除」ボタンの送り先・なりすまし対策トークンを画面の上で書き換えて行う。
 * - 正本の手順「DBで…を確認する」は、DBを参照して値を読む手順として行い、期待結果でその値を確かめる。
 *
 * 実装しないケース（記録 review/M14-09_progress_2026-11-09.md の振り分けの表）:
 * 002（12件以外のフォーマットを一覧から外すDBでの準備）、004（DBスナップショットの復元）、
 * 013・014（シード表のデッキの作り方が画面で実行できない。デッキ登録画面は、選んだフォーマットのアーキタイプしか選べない）。
 */
import { test } from "@playwright/test";
import { caseTest, CaseBody, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { カードの指定, フォーマットの記録, フォーマットの指定, 禁止制限の指定 } from "../../db/m14_09_format";
import {
  FormatDetailPage, FormatListPage, カードセット詳細のパスの形, フォーマット一覧のパス, フォーマット登録のパス, フォーマット詳細のパス, 削除の結果, 画面上部のメッセージ, pathOf,
} from "../../pages/admin/m14_09_format_list";
import { M1409_ADMIN, 名 } from "../../seeds/m14-09-k";
import "../../seeds/m14-09"; // 取り込みで抜けた登録を戻す: main 側が作り方を登録している seeds を読み込む（二重定義ではない）

type 記録 = フォーマットの記録;

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

const 実行の注記 = () => note("正本の「ポップアップの「実行」」は、確認ポップアップの「削除」ボタン（画面の表示名は「削除」）として押した");

async function 一覧で(page: Parameters<CaseBody>[0]["page"]): Promise<FormatListPage> {
  await loginAdmin(page, M1409_ADMIN);
  return new FormatListPage(page);
}

const 削除の結果の文 = async (page: Parameters<CaseBody>[0]["page"], r: 削除の結果) => {
  const m = await 画面上部のメッセージ(page);
  return `削除の要求の応答 ${r.要求の応答}、移った画面 ${r.移った画面}（応答 ${r.移った画面の応答 ?? "なし"}）、画面上部のメッセージ: 成功「${m.成功.join(" / ")}」エラー「${m.エラー.join(" / ")}」`;
};

// ---------------------------------------------------------------------------
// 一覧の表示
// ---------------------------------------------------------------------------

caseTest("IT-M14-09-001", async ({ page, notes, step, expected }) => {
  const list = await 一覧で(page);
  const [A, B, C] = ["A", "B", "C"].map((x) => notes.get(`〔フォーマットID-M1409-共有${x}〕`));
  let ids: string[] = [];
  await step(1, async () => { await list.open(); });
  await step(2, async () => { ids = await list.行のフォーマットID(); });
  await expected(async () => {
    const 位置 = [A, B, C].map((id) => ids.indexOf(id));
    expect.soft(位置[0], `ID ${A}（スタンダード）の行が一覧にある`).toBeGreaterThanOrEqual(0);
    expect.soft(位置[1], `ID ${B}（モダン）の行が一覧にある`).toBeGreaterThanOrEqual(0);
    expect.soft(位置[2], `ID ${C}（パイオニア）の行が一覧にある`).toBeGreaterThanOrEqual(0);
    // 一覧にはほかのフォーマットも並ぶので、3件の互いの上下で確かめる
    expect(ids.filter((id) => [A, B, C].includes(id)), `3件の上からの順（一覧の行 ${ids.length} 件のうち）`).toEqual([A, B, C]);
  });
});

caseTest("IT-M14-09-003", async ({ page, notes, step, expected }) => {
  const list = await 一覧で(page);
  const D = notes.get("〔フォーマットID-M1409-共有D〕");
  let names: string[] = [];
  let ids: string[] = [];
  await step(1, async () => { await list.open(); });
  await step(2, async () => {
    const rows = await list.行();
    names = rows.map((r) => r.フォーマット名);
    ids = rows.map((r) => r.フォーマットID);
  });
  await expected(async () => {
    expect.soft(names.length, "一覧の行が読み込まれている（行の数）").toBeGreaterThan(0);
    expect.soft(ids.includes(notes.get("〔フォーマットID-M1409-共有A〕")), "削除されていないスタンダードの行は出ている").toBe(true);
    expect.soft(names, "一覧のフォーマット名に、削除済みの「レガシー / Legacy」が無い").not.toContain(`${名("レガシー")} / ${名("Legacy")}`);
    expect(ids, `一覧に、削除済みのID ${D} の行が無い`).not.toContain(D);
  });
});

/** 「…」の行の値を確かめるケース（005・006） */
function 行の値(呼び名: string, 期待: { 名: string; 略称: string; 認定: string }): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const list = await 一覧で(page);
    const id = notes.get(呼び名);
    let row: Awaited<ReturnType<FormatListPage["行"]>>[number] | undefined;
    await step(1, async () => { await list.open(); });
    await step(2, async () => {
      row = (await list.行()).find((r) => r.フォーマットID === id);
      await list.行のフォーマット(id).scrollIntoViewIfNeeded();
    });
    await expected(async () => {
      expect(row, `ID ${id} の行が一覧にある`).toBeTruthy();
      expect.soft(row?.フォーマット名, "フォーマット名").toBe(期待.名);
      expect.soft(row?.略称, "略称").toBe(期待.略称);
      expect.soft(row?.認定, "認定").toBe(期待.認定);
    });
  };
}

caseTest("IT-M14-09-005", 行の値("〔フォーマットID-M1409-共有A〕", { 名: `${名("スタンダード")} / ${名("Standard")}`, 略称: "STD", 認定: "公式 / Official" }));
caseTest("IT-M14-09-006", 行の値("〔フォーマットID-M1409-共有B〕", { 名: `${名("モダン")} / ${名("Modern")}`, 略称: "MO", 認定: "" }));

caseTest("IT-M14-09-008", async ({ page, notes, step, expected }) => {
  const list = await 一覧で(page);
  const A = notes.get("〔フォーマットID-M1409-共有A〕");
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.三点リーダーを押す(A); });
  await expected(async () => {
    await expect.soft(list.メニューの項目(A, "編集"), "3点リーダーのメニューの「編集」").toBeVisible();
    await expect.soft(list.メニューの項目(A, "削除"), "3点リーダーのメニューの「削除」").toBeVisible();
  });
});

caseTest("IT-M14-09-009", async ({ page, notes, step, expected }) => {
  const list = await 一覧で(page);
  const A = notes.get("〔フォーマットID-M1409-共有A〕");
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.三点リーダーを押す(A); });
  await step(3, async () => { await list.編集を押す(A); });
  await expected(async () => {
    expect(pathOf(page.url()), "移った画面（カードセット詳細(編集・削除)画面のアドレス）").toMatch(カードセット詳細のパスの形());
  });
});

caseTest("IT-M14-09-010", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1409_ADMIN);
  const d = new FormatDetailPage(page);
  const A = notes.get("〔フォーマットID-M1409-共有A〕");
  await step(1, async () => { await d.open(A); });
  await step(2, async () => {
    note("正本の「フォーマット一覧」は、フォーマット詳細画面の一覧へ戻るリンク（画面の表示名は「フォーマット管理」）として押した");
    await d.一覧へ戻るを押す();
  });
  await expected(async () => {
    expect.soft(pathOf(page.url()), "移った画面（フォーマット一覧画面のアドレス）").toBe(フォーマット一覧のパス());
    await expect.soft(new FormatListPage(page).見出し行, "フォーマット一覧の表の見出し行").toBeVisible();
  });
});

caseTest("IT-M14-09-023", async ({ page, notes, step, expected }) => {
  const list = await 一覧で(page);
  const A = notes.get("〔フォーマットID-M1409-共有A〕");
  await step(1, async () => { await list.open(); });
  await step(2, async () => {
    await expect(list.フォーマット名リンク(A), "押すリンクの文").toHaveText(`${名("スタンダード")} / ${名("Standard")}`);
    await list.フォーマット名を押す(A);
  });
  await expected(async () => {
    const d = new FormatDetailPage(page);
    expect.soft(pathOf(page.url()), `移った画面（ID ${A} のフォーマット詳細画面のアドレス）`).toBe(フォーマット詳細のパス(A));
    await expect.soft(d.名日, "フォーマット名(日)").toHaveValue(名("スタンダード"));
    await expect.soft(d.名英, "フォーマット名(英)").toHaveValue(名("Standard"));
  });
});

// ---------------------------------------------------------------------------
// 削除
// ---------------------------------------------------------------------------

/** 手順1〜3: 一覧を開き、行の3点リーダーから「削除」を押し、ポップアップの「削除」を押す */
async function 一覧から削除する(page: Parameters<CaseBody>[0]["page"], step: Parameters<CaseBody>[0]["step"], id: string, 実行と書く = true): Promise<削除の結果> {
  const list = await 一覧で(page);
  let r!: 削除の結果;
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.三点リーダーを押す(id); await list.削除を押す(id); });
  await step(3, async () => {
    if (実行と書く) 実行の注記();
    r = await list.ポップアップで削除を実行する();
    note(await 削除の結果の文(page, r));
  });
  return r;
}

/** 紐付きがあって削除できないフォーマットが、削除済みに変わらないこと（011・015） */
function 削除済みにならない(呼び名: string): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const id = notes.get(呼び名);
    await 一覧から削除する(page, step, id);
    let v!: 記録;
    await step(4, async () => { v = フォーマットの記録(id); });
    await expected(async () => {
      expect.soft(v.ある, `ID ${id} のフォーマットの記録がある`).toBe(true);
      expect(v.削除済み, `ID ${id} のフォーマットが削除済みに変わっていない`).toBe(false);
    });
  };
}

/** 削除の要求のあと、フォーマット一覧画面へ移ること（012・016・018） */
function 一覧へ戻る(呼び名: string): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const id = notes.get(呼び名);
    await 一覧から削除する(page, step, id);
    await expected(async () => {
      expect.soft(pathOf(page.url()), "移った画面（フォーマット一覧画面のアドレス）").toBe(フォーマット一覧のパス());
      await expect.soft(new FormatListPage(page).見出し行, "フォーマット一覧の表の見出し行").toBeVisible();
    });
  };
}

// ---------------------------------------------------------------------------
// 削除の要求を受け付けない場合（開発者ツールで書き換える）
// ---------------------------------------------------------------------------

/** 手順1〜4: 一覧を開き、削除ポップアップを開き、書き換えて「実行」を押す */
async function 書き換えて削除する(
  page: Parameters<CaseBody>[0]["page"], step: Parameters<CaseBody>[0]["step"], id: string, 書き換え: (list: FormatListPage) => Promise<void>,
): Promise<削除の結果> {
  const list = await 一覧で(page);
  let r!: 削除の結果;
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.三点リーダーを押す(id); await list.削除を押す(id); });
  await step(3, async () => { await 書き換え(list); });
  await step(4, async () => {
    実行の注記();
    r = await list.ポップアップで削除を実行する();
    note(`削除の要求の応答 ${r.要求の応答}、移った画面 ${r.移った画面}（応答 ${r.移った画面の応答 ?? "なし"}）`);
  });
  return r;
}
