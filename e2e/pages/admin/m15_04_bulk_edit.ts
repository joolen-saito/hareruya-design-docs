/**
 * M15-04 一括編集（デッキ・管理画面）の画面部品。セレクタはここだけに置く。
 * デッキ一覧（検索・選択）は M15-01 の部品（pages/admin/m15_deck.ts の デッキ一覧）、デッキ新規登録画面は M15-05 の部品
 * （pages/admin/m15_05_deck_edit.ts の デッキ編集画面）を使う。ここは一括編集の区画と、シード用の小さな組み合わせだけを置く。
 *
 * 画面の表示名（アプリの Twig・翻訳ファイルで確かめたもの）:
 * - 一括編集を開くボタンは「一括編集」、実行ボタンは「一括編集実行」
 * - 変更チェックの名前: フォーマット / アーキタイプ / 公開状態(デッキ全体の公開設定) / デッキリスト公開状態 / イベント名(日) / イベント名(英) /
 *   イベント開催日 / 順位 / 成績 / プレイヤー名 / デッキタグ / 引用元URL
 * - 各項目の入力欄は、その項目の変更チェックを付けている間だけ表示される（外すと隠れる。入れた値は残る）
 * - 公開状態は選択肢のボタン（公開・非公開・限定公開）、アーキタイプは選択欄（全フォーマットのアーキタイプが名前(日)で並ぶ）
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { デッキ一覧 } from "./m15_deck";
import { デッキ内容, デッキ編集画面 } from "./m15_05_deck_edit";
import { buildCardCsv, downloadCardCsvTemplate, readExistingCardValues, uploadCardCsv } from "./card_csv";

type Issue = (m: string) => void;
const 正規 = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const 文 = (t: string | null | undefined) => (t ?? "").replace(/\s+/g, " ").trim();

/** 一括編集で変えられる項目（変更チェックの区別） */
export type 一括編集の項目 = "format" | "archetype" | "disp" | "privateFlg" | "eventNameJp" | "eventNameEn" | "eventDate" | "ranking" | "result" | "playerName" | "deckTags" | "sourceUrl";

/** デッキ一覧で「日付クリア」を押し、デッキIDを入れて「検索する」を押す（結果の表示を待つ） */
export async function デッキIDで検索する(page: Page, デッキID: string): Promise<デッキ一覧> {
  const l = new デッキ一覧(page);
  await l.開く();
  await l.日付クリア.click();
  await l.f("deck_id").fill(デッキID);
  await l.検索する();
  return l;
}

/** デッキ一覧の一括編集の区画 */
export class デッキ一括編集 {
  constructor(readonly page: Page) {}

  get 区画(): Locator { return this.page.locator("#bulk_edit_panel"); }
  get 開くボタン(): Locator { return this.page.locator("#toggle_bulk_edit"); }
  get 実行ボタン(): Locator { return this.区画.locator("#bulk_update_execute"); }
  変更チェック(項目: 一括編集の項目): Locator { return this.区画.locator(`input.toggle_bulk_update_check[name="change_flgs[${項目}]"]`); }
  欄(項目: 一括編集の項目): Locator { return this.区画.locator(`[name="admin_deck_bulk_update[${項目}]"]`); }
  /** 項目の入力欄の囲み（変更チェックを付けている間だけ表示される） */
  入力の囲み(項目: 一括編集の項目): Locator { return this.変更チェック(項目).locator("xpath=ancestor::label[1]/following-sibling::div[contains(@class,'bulk_update_form')][1]"); }

  /** 検索結果の行の選択欄にチェックを付ける */
  async デッキを選ぶ(l: デッキ一覧, デッキID: string): Promise<void> {
    const box = l.選択(デッキID);
    await expect(box, `検索結果にデッキID ${デッキID} の行の選択欄`).toHaveCount(1);
    await box.check();
    await expect(box, `デッキID ${デッキID} が選ばれる`).toBeChecked();
  }

  /** 「一括編集」を押して区画を開く（区画の中の選択欄の仕掛けが動くまで待つ） */
  async 開く(): Promise<void> {
    await expect(this.開くボタン, "「一括編集」ボタン").toHaveText(/^\s*一括編集\s*$/);
    await this.開くボタン.click();
    await expect(this.区画, "一括編集の区画が開く").toBeVisible();
    await expect(this.区画.locator(".select2-container").first(), "一括編集の区画の選択欄（画面の仕掛け）").toBeAttached();
    await expect(this.実行ボタン, "「一括編集実行」ボタン").toHaveText(/^\s*一括編集実行\s*$/);
  }

  /** 変更チェックを付ける・外す（付けると入力欄が表示され、外すと隠れる） */
  async チェック(項目: 一括編集の項目, on: boolean): Promise<void> {
    const box = this.変更チェック(項目);
    await expect(box, `変更チェック（${項目}）`).toBeVisible();
    await box.setChecked(on);
    if (on) await expect(this.入力の囲み(項目), `変更チェックを付けると入力欄が表示される（${項目}）`).toBeVisible();
    else await expect(this.入力の囲み(項目), `変更チェックを外すと入力欄が隠れる（${項目}）`).toBeHidden();
  }

  /** アーキタイプの選択欄で名前(日)の選択肢を選ぶ（入力欄が表示されている前提） */
  async アーキタイプを選ぶ(名: string): Promise<void> {
    await chooseByLabel(this.欄("archetype"), 名);
    await expect(this.欄("archetype").locator("option:checked"), "アーキタイプの選択").toHaveText(new RegExp(`^\\s*${正規(名)}\\s*$`));
  }

  /** 公開状態の選択肢のボタンを、表示名で選ぶ（入力欄が表示されている前提） */
  async 公開状態を選ぶ(名: "公開" | "非公開" | "限定公開"): Promise<void> {
    const label = this.区画.locator('label[for^="admin_deck_bulk_update_disp_"]').filter({ hasText: new RegExp(`^\\s*${正規(名)}\\s*$`) });
    await expect(label, `公開状態の選択肢「${名}」`).toHaveCount(1);
    const id = (await label.getAttribute("for")) ?? "";
    const radio = this.区画.locator(`input[type="radio"][id="${id}"]`);
    await radio.check();
    await expect(radio, `公開状態「${名}」が選ばれる`).toBeChecked();
  }

  /** フォーマットの選択欄で名前(日)の選択肢を選ぶ（入力欄が表示されている前提） */
  async フォーマットを選ぶ(名: string): Promise<void> {
    await chooseByLabel(this.欄("format"), 名);
    await expect(this.欄("format").locator("option:checked"), "フォーマットの選択").toHaveText(new RegExp(`^\\s*${正規(名)}\\s*$`));
  }

  /** デッキタグの選択欄で、タグを選ぶ（入力欄が表示されている前提。複数なら全部を選ぶ） */
  async タグを選ぶ(名s: string[]): Promise<void> {
    const sel = this.区画.locator('[name="admin_deck_bulk_update[deckTags][]"]');
    await chooseByLabel(sel, 名s);
    const have = (await sel.locator("option:checked").allInnerTexts()).map((t) => t.trim());
    expect(have.sort(), "デッキタグの選択").toEqual([...名s].sort());
  }

  /** デッキリスト公開状態の選択肢のボタンを選ぶ。公開=リストを公開（値は偽）、非公開=リストを公開しない（値は真） */
  async デッキリスト公開状態を選ぶ(名: "公開" | "非公開"): Promise<void> {
    const label = this.区画.locator('label[for^="admin_deck_bulk_update_privateFlg_"]').filter({ hasText: new RegExp(`^\\s*${正規(名)}\\s*$`) });
    await expect(label, `デッキリスト公開状態の選択肢「${名}」`).toHaveCount(1);
    const id = (await label.getAttribute("for")) ?? "";
    const radio = this.区画.locator(`input[type="radio"][id="${id}"]`);
    await radio.check();
    await expect(radio, `デッキリスト公開状態「${名}」が選ばれる`).toBeChecked();
  }

  /** 文字・数・日時の入力欄に値を入れる（入力欄が表示されている前提。日時は「2025-12-01T09:30」の形） */
  async 入れる(項目: "eventNameJp" | "eventNameEn" | "result" | "playerName" | "sourceUrl" | "ranking" | "eventDate", 値: string): Promise<void> {
    const f = this.欄(項目);
    await f.fill(値);
    await expect(f, `入力欄（${項目}）の値`).toHaveValue(値);
  }

  /** 付いている変更チェック（項目の区別） */
  async 付いている変更チェック(): Promise<string[]> {
    return this.区画.locator("input.toggle_bulk_update_check:checked").evaluateAll((es) => es.map((e) => ((e as HTMLInputElement).name.match(/^change_flgs\[(.+)\]$/) ?? [])[1] ?? ""));
  }

  /** 「一括編集実行」を押し、移った先（デッキ一覧）の読み込みを待つ。画面上部の成功・エラーの帯の文を返す */
  async 実行する(): Promise<{ 成功: string[]; エラー: string[]; 入力の不足: string[] }> {
    await this.実行ボタン.click();
    // 入力が足りないと、画面の仕掛けが送信を止めて「入力されていません。」を出す（移らない）
    const 不足 = this.区画.locator(".bulk_update_error");
    await expect(this.page.locator(".alert-success, .alert-danger").or(不足).first(), "一括編集実行の結果の表示").toBeVisible({ timeout: 60_000 });
    await this.page.waitForLoadState("load");
    const read = async (sel: string) => { const out: string[] = []; for (const e of await this.page.locator(sel).all()) if (await e.isVisible()) out.push(文(await e.innerText())); return out; };
    return { 成功: await read(".alert-success"), エラー: await read(".alert-danger"), 入力の不足: await read("#bulk_edit_panel .bulk_update_error") };
  }
}

// ---- シード用 ----

/** カード登録CSVを、指定の行（カード名(日)・(英)・画像URL(英語)。レアリティとレイアウトは登録済みの英語名）で作って取り込む */
export async function カードを取り込む(page: Page, rows: { 名日: string; 名英: string; 画像URL: string }[], what: string, issue: Issue): Promise<void> {
  const base = await readExistingCardValues(page);
  const headers = await downloadCardCsvTemplate(page);
  const csv = buildCardCsv(headers, rows.map((r) => ({
    name_jp: r.名日, name_en: r.名英, rarity: base.rarity, layout: base.layout, image_en: r.画像URL, image_jp: "", card_detail_id: "",
  })));
  await uploadCardCsv(page, csv, `${what.replace(/[^A-Za-z0-9_-]/g, "_")}.csv`, `${what} のカード登録CSVアップロード`, (w) => issue(`${what}: カード登録CSVの警告「${w}」`));
  issue(`${what}: レアリティ「${base.rarity}」・レイアウト「${base.layout}」（既存のカードにある英語名）でカード登録CSVを作って取り込んだ`);
}

/**
 * シード用: デッキ新規登録画面で入力し、代表カードを（指定があれば）英語名の完全一致で検索して選び、「新規登録」を押す。振られたデッキIDを返す。
 * 代表カードの検索の結果は、カード名(日)のある行の「決定」が名前(日)を持つので、名前(日)で行を決める。
 */
export async function デッキを登録する(page: Page, v: デッキ内容, 代表カード: { 名英: string; 名日: string } | null, issue: Issue): Promise<string> {
  await page.goto(adminUrl("/deck/new"));
  const e = new デッキ編集画面(page);
  await e.読み込みを待つ();
  const { プレイヤー名, イベント名日, イベント名英, 開催日, 順位, 成績, 参加人数, デッキ名, ...先 } = v;
  await e.入力する(先, issue);
  if (代表カード) {
    await e.代表カード選択ボタン.click();
    const m = e.代表カード検索画面;
    await expect(m, "代表カード検索の画面").toBeVisible();
    await m.locator("#card_image_search_word").fill(代表カード.名英);
    await m.locator("#card_image_exact_match").check();
    await m.locator("#btn_search_card_image").click();
    const b = m.locator(`button.select-card-image[data-name="${代表カード.名日}"]`);
    await expect(b.first(), `代表カード検索の結果に「${代表カード.名英}」の行`).toBeVisible({ timeout: 30_000 });
    await expect(b, `代表カード検索の結果の「${代表カード.名英}」の行が1件`).toHaveCount(1);
    await b.click();
    await expect(m, "「決定」を押すと代表カード検索の画面が閉じる").toBeHidden();
    await expect(e.代表カード名, "選んだ代表カードの名前").toHaveText(new RegExp(正規(代表カード.名日)));
  }
  await e.入力する({ デッキ名, プレイヤー名, イベント名日, イベント名英, 開催日, 順位, 成績, 参加人数 }, issue);
  await e.送信する(e.新規登録ボタン);
  for (const w of await expectSaved(page, `デッキ（プレイヤー名「${v.プレイヤー名 ?? ""}」・デッキ名「${v.デッキ名 ?? ""}」）の登録`)) issue(`デッキの登録時の警告「${w}」`);
  return e.デッキID();
}
