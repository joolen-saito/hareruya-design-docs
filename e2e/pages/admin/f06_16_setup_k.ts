// 取り込み注記: 同じ部品を main 側も別に実装していたため、栗野側の版を別ファイルにした（栗野側のケース・シードがこちらを使う）。
/**
 * F06-16 大会デッキ登録編集のシードが使う、管理画面の操作（フォーマット・カード・ユーザーデッキ・カードの有無の確かめ）。
 * セレクタはここだけに置く。既にある部品（イベント・日程・店舗・メンバー・カード登録・アーキタイプ・カード名リスト作成）は呼び出して使う。
 *
 * - フォーマット: フォーマット詳細(登録)で、名称(日)(英)・フォーマットコード・並び順・メタゲーム分析日数と、チェック
 *   （ランキング表示・メタ分布簡易化・イベントに表示・デッキビルダーで利用・統率でカードを使用する）を入れて登録する。
 * - ユーザーデッキ（マイデッキ）: デッキ新規登録画面でデッキタイプ「user」を選び、プレイヤー検索で選手を選んで登録する。
 *   プレイヤー検索の結果は10件ずつのページ送りで、選手IDの行が出るページまで送る。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved, setChecked } from "./common";
import { findFormat } from "./m14_card";
import { デッキ編集画面 } from "./m15_05_deck_edit";

type Issue = (m: string) => void;

// ---- フォーマット ----

export type F0616フォーマット = {
  名: string; コード: string; 並び順: string;
  ランキング表示: boolean; メタ分布簡易化: boolean; 統率を使う: boolean;
  /** イベント登録画面の選択肢に出す（イベントに表示） */
  イベントに表示: boolean;
  /** 大会デッキ登録編集のマイデッキ取得ポップアップの「フォーマットで絞り込む」に出す（デッキビルダーで利用） */
  デッキビルダー: boolean;
};

/** フォーマットを、あれば編集画面で記載の値へそろえて保存し、無ければ新規登録する。フォーマットID（編集画面のアドレスの番号）を返す */
export async function フォーマットを用意する(page: Page, v: F0616フォーマット, issue: Issue): Promise<string> {
  const found = await findFormat(page, v.名);
  await page.goto(adminUrl(found ? `/format/${found}/edit` : "/format/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_format[${n}]"]`);
  await expect(f("nameJp"), "フォーマット詳細のフォーマット名(日)").toBeVisible();
  await f("nameJp").fill(v.名);
  await f("nameEn").fill(v.名);
  await f("code").fill(v.コード);
  if (!found) await f("rank").fill(v.並び順);
  if ((await f("MetaRange").inputValue()) === "") await f("MetaRange").fill("30");
  await setChecked(f("rankingFlg"), v.ランキング表示);
  await setChecked(f("OtherMetaFlg"), v.メタ分布簡易化);
  await setChecked(f("isShownInEvent"), v.イベントに表示);
  await setChecked(f("DeckbuilderFlg"), v.デッキビルダー);
  await setChecked(f("useCommandFlg"), v.統率を使う);
  await page.locator('button[type="submit"]').filter({ hasText: /^\s*(登録|新規登録|更新)\s*$/ }).first().click();
  for (const w of await expectSaved(page, `フォーマット「${v.名}」の${found ? "保存" : "登録"}`)) issue(`フォーマット「${v.名}」の警告「${w}」`);
  const m = /\/format\/(\d+)\/edit/.exec(page.url());
  const id = m?.[1] ?? found;
  if (!id) throw new Error(`フォーマット「${v.名}」を登録したが、編集画面へ移らない（${page.url()}）`);
  return id;
}

/** フォーマットの編集画面で、チェックの状態を読む（シードの確かめ） */
export async function フォーマットのチェック(page: Page, フォーマットID: string): Promise<{ ランキング表示: boolean; メタ分布簡易化: boolean }> {
  await page.goto(adminUrl(`/format/${フォーマットID}/edit`));
  await page.waitForLoadState("load");
  return {
    ランキング表示: await page.locator('[name="admin_format[rankingFlg]"]').isChecked(),
    メタ分布簡易化: await page.locator('[name="admin_format[OtherMetaFlg]"]').isChecked(),
  };
}

// ---- カード一覧 ----

/** カード一覧でキーワード検索し、カード名の欄に語がちょうど出る行のカードIDを返す（検索結果の表示を待ってから数える） */
export async function カードを名前で探す(page: Page, カード名: string): Promise<string[]> {
  await page.goto(adminUrl("/card"));
  await page.waitForLoadState("load");
  await page.locator("#admin_search_card_multi").fill(カード名);
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), page.locator('#admin_search_form button[type="submit"]').first().click()]);
  await page.waitForLoadState("load");
  await expect(page.getByText(/^(検索結果：\d+件が該当しました|検索条件に合致するデータが見つかりませんでした)$/).first(), `カード一覧で「${カード名}」を検索した結果`).toBeVisible({ timeout: 60_000 });
  return page.locator("#form_bulk tbody tr").filter({ has: page.locator('input[name="cardIds[]"]') }).evaluateAll((trs, name) => trs
    .filter((tr) => ((tr.querySelector("td:nth-child(3)") as HTMLElement | null)?.innerText ?? "").split(/\n|\s\/\s/).map((s) => s.trim()).includes(name))
    .map((tr) => (tr.querySelector("td:nth-child(2)")?.textContent ?? "").trim()), カード名);
}

// ---- ユーザーデッキ（マイデッキ） ----

export type ユーザーデッキ = {
  デッキ名: string; フォーマット: string; アーキタイプ: string;
  /** プレイヤー検索に入れる語と、選ぶ選手ID */
  検索語: string; 選手ID: string;
  メイン?: string; サイド?: string; 統率?: string;
};

/**
 * デッキ一覧の新規登録画面で、デッキタイプ「user」のデッキを登録し、デッキID（登録後のデッキ編集画面のアドレスの番号）を返す。
 * 公開状態(デッキ全体の公開設定)は「非公開」（正本は任意の値）。
 */
export async function ユーザーデッキを登録する(page: Page, v: ユーザーデッキ, issue: Issue): Promise<string> {
  await page.goto(adminUrl("/deck/new"));
  const e = new デッキ編集画面(page);
  await e.読み込みを待つ();
  await e.入力する({ デッキ名: v.デッキ名, デッキ種別: "user", フォーマット: v.フォーマット, アーキタイプ: v.アーキタイプ, 公開状態: "非公開", 統率: v.統率, メイン: v.メイン, サイド: v.サイド });
  await プレイヤーを選ぶ(page, v.検索語, v.選手ID);
  await e.送信する(e.新規登録ボタン);
  for (const w of await expectSaved(page, `ユーザーデッキ「${v.デッキ名}」の登録`)) issue(`ユーザーデッキ「${v.デッキ名}」の登録時の警告「${w}」`);
  return e.デッキID();
}

/** デッキ新規登録画面のプレイヤー検索で語を検索し、選手IDの行が出るページまで送って「決定」を押す */
async function プレイヤーを選ぶ(page: Page, 語: string, 選手ID: string): Promise<void> {
  await page.locator('[data-bs-target="#searchPlayerModal"]').click();
  const m = page.locator("#searchPlayerModal");
  await expect(m, "プレイヤー検索の画面").toBeVisible();
  await m.locator("#player_search_word").fill(語);
  const first = page.waitForResponse((r) => r.url().includes("/deck/search_player"));
  await m.locator("#btn_search_player").click();
  await first;
  for (let i = 0; i < 200; i++) {
    await expect(m.locator("#player_search_results table, #player_search_results p").first(), `プレイヤー検索「${語}」の結果`).toBeVisible({ timeout: 30_000 });
    const 行 = m.locator(`button.select-player[data-id="${選手ID}"]`);
    if (await 行.count()) {
      await 行.first().click();
      await expect(m, "「決定」を押すとプレイヤー検索の画面が閉じる").toBeHidden();
      await expect(page.locator('[name="admin_deck[playerId]"]'), "選んだプレイヤーがデッキに設定される").toHaveValue(選手ID);
      return;
    }
    const 次へ = m.locator("li.page-item:not(.disabled) a.player-page").filter({ hasText: /^\s*次へ\s*$/ });
    if (!(await 次へ.count())) break;
    const いま = ((await m.locator("li.page-item.active").first().innerText()) ?? "").trim();
    const res = page.waitForResponse((r) => r.url().includes("/deck/search_player"));
    await 次へ.click();
    await res;
    await expect(m.locator("li.page-item.active").first(), "プレイヤー検索の結果が次のページに替わる").toHaveText(String(Number(いま) + 1));
  }
  throw new Error(`プレイヤー検索「${語}」の結果に、選手ID ${選手ID} の行が無い`);
}
