// 取り込み注記: 同じ機能を main 側（別の方）も実装していたため、栗野側の版を別ファイルにした。main に無いケースだけを残している（main にあるケースは main を優先して除いた）。
/**
 * M15-03 一括削除（デッキ・管理画面）。ケースの正本: integration_test/casegen/cases/M15-03_test_cases.tsv
 *
 * - 決め打ちの名前（フォーマット・アーキタイプ・プレイヤー・イベント）は、実行の印を付けて作っている（seeds/m15-03.ts）。
 *   手順・期待結果の同じ名前と検索の語も、同じ印を付けた値として読む。一括削除で選ぶのは、この実行で作った印つきのデッキだけ。
 * - 店頭のデッキ検索の「クリア」とプレイヤー名の欄は、デッキ検索TOPの画面上部の「詳細検索」で開く画面の中にある。開いてから押す（M15-04 と同じ）。
 * - 管理画面のデッキ一覧の件数・並べかえ項目・ソート順の選択欄は、検索結果の上にあり、選ぶと画面が移る。004 の手順2は、
 *   日付クリア・プレイヤー名を入れて「検索する」を押したあと、件数・並べかえ項目・ソート順の順に選んだ。
 * - 実装しないケース: 002（手順に「3601秒以上待つ」があり、1件の実行の制限時間 1800秒を超える。M15-04 の 004 と同じ扱い）、
 *   006・008（デッキと試験記事の関連付けをシードで DB へ直接設定する。依頼者の指示待ち）。
 */
import { test, Page } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { デッキ一覧 } from "../../pages/admin/m15_deck";
import { デッキ一括削除 } from "../../pages/admin/m15_03_bulk_delete";
import { DeckSearchModal, DeckTopPage } from "../../pages/front/f09_01_deck_top";
import { DeckResultPage, 結果の行 } from "../../pages/front/f09_02_deck_result";
import { M1503_QM, QM名, CB名 } from "../../seeds/m15-03-k";
import "../../seeds/m15-03"; // 取り込みで抜けた登録を戻す: main 側が作り方を登録している seeds を読み込む（二重定義ではない）

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 待ちを延ばす = (page: Page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); };
const クリアの注記 = "「クリア」とプレイヤー名の欄は、デッキ検索TOPの画面上部の「詳細検索」で開く画面の中にある。開いてから押した";
const 該当なしの文 = /^\s*ご指定の条件に一致するデッキが見つかりませんでした。\s*$/;

/** デッキ検索TOP→「詳細検索」→「クリア」→プレイヤー名→「検索」。デッキ検索結果の画面の行を返す */
async function 店頭でプレイヤーを検索する(page: Page, 語: string): Promise<結果の行[]> {
  await new DeckTopPage(page).開く();
  const m = new DeckSearchModal(page);
  await m.開く();
  await m.クリアする();
  await m.入れる("player", 語);
  await m.検索する();
  return new DeckResultPage(page).行();
}

/** 管理画面のデッキ一覧で「日付クリア」を押し、デッキID（カンマ区切り）を入れて「検索する」を押す */
async function デッキIDで検索する(page: Page, ids: string[]): Promise<デッキ一覧> {
  const l = new デッキ一覧(page);
  await l.開く();
  await l.日付クリア.click();
  await l.f("deck_id").fill(ids.join(","));
  await l.検索する();
  return l;
}

// ---------------------------------------------------------------- 001 2件を一括削除すると店頭の検索結果から消える

caseTest("IT-M15-03-001", async ({ page, notes, step, expected }) => {
  待ちを延ばす(page);
  const A = notes.get("〔デッキID-M1503-001A〕"), B = notes.get("〔デッキID-M1503-001B〕");
  const 語 = QM名("001", "選手"), 甲 = QM名("001", "選手甲"), 乙 = QM名("001", "選手乙");
  let 行: 結果の行[] = [];
  await step(1, async () => { 行 = await 店頭でプレイヤーを検索する(page, 語); note(クリアの注記); });
  await step(2, async () => {
    expect(行.map((r) => r.プレイヤー).sort(), "一覧のプレイヤーの行").toEqual([甲, 乙].sort());
  });
  await step(3, async () => { await loginAdmin(page, M1503_QM); });
  let l!: デッキ一覧;
  await step(4, async () => {
    l = await デッキIDで検索する(page, [A, B]);
    expect((await l.表示されたID()).sort(), "デッキIDの検索結果").toEqual([A, B].sort());
  });
  const d = new デッキ一括削除(page);
  await step(5, async () => { await d.デッキを選ぶ(A); await d.デッキを選ぶ(B); });
  await step(6, async () => {
    const r = await d.削除する();
    note(`確認の文「${r.確認}」で「OK」を押した。削除のあとの表示: ${[...r.成功, ...r.エラー].join(" / ") || "（帯なし）"}`);
  });
  let 後: 結果の行[] = [];
  await step(7, async () => { 後 = await 店頭でプレイヤーを検索する(page, 語); note(クリアの注記); });
  await expected(async () => {
    await expect.soft(new DeckResultPage(page).該当なしの案内, "一覧の領域の、該当なしの案内").toHaveText(該当なしの文);
    expect.soft(後.filter((r) => r.プレイヤー === 甲).length, `一覧のプレイヤー「${甲}」の行の数`).toBe(0);
    expect.soft(後.filter((r) => r.プレイヤー === 乙).length, `一覧のプレイヤー「${乙}」の行の数`).toBe(0);
  });
});

// ---------------------------------------------------------------- 003 1件だけ選んで一括削除する

caseTest("IT-M15-03-003", async ({ page, notes, step, expected }) => {
  待ちを延ばす(page);
  const id = notes.get("〔デッキID-M1503-003〕");
  const 語 = QM名("003", "選手"), 甲 = QM名("003", "選手甲");
  let 行: 結果の行[] = [];
  await step(1, async () => { 行 = await 店頭でプレイヤーを検索する(page, 語); note(クリアの注記); });
  await step(2, async () => {
    expect(行.map((r) => r.プレイヤー), "一覧のプレイヤーの行").toEqual([甲]);
  });
  await step(3, async () => { await loginAdmin(page, M1503_QM); });
  let l!: デッキ一覧;
  await step(4, async () => {
    l = await デッキIDで検索する(page, [id]);
    expect(await l.表示されたID(), "デッキIDの検索結果").toEqual([id]);
  });
  const d = new デッキ一括削除(page);
  await step(5, async () => { await d.デッキを選ぶ(id); });
  let 削除後のID: string[] = [];
  await step(6, async () => {
    const r = await d.削除する();
    await l.結果を待つ();
    削除後のID = await l.表示されたID();
    note(`確認の文「${r.確認}」で「OK」を押した。削除のあとの表示: ${[...r.成功, ...r.エラー].join(" / ") || "（帯なし）"}`);
  });
  let 再検索のID: string[] = [];
  await step(7, async () => { l = await デッキIDで検索する(page, [id]); 再検索のID = await l.表示されたID(); });
  let 後: 結果の行[] = [];
  await step(8, async () => { 後 = await 店頭でプレイヤーを検索する(page, 語); note(クリアの注記); });
  await expected(async () => {
    expect.soft(削除後のID.includes(id), `一括削除のあとに戻ったデッキ検索・一覧画面に、デッキID ${id} が表示されている`).toBe(false);
    expect.soft(再検索のID.includes(id), `検索し直したデッキ検索・一覧画面に、デッキID ${id} が表示されている`).toBe(false);
    await expect.soft(new DeckResultPage(page).該当なしの案内, "一覧の領域の、該当なしの案内").toHaveText(該当なしの文);
    expect.soft(後.filter((r) => r.プレイヤー === 甲).length, `一覧のプレイヤー「${甲}」の行の数`).toBe(0);
  });
});
