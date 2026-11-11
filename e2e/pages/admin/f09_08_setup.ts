/**
 * F09-08 デッキ一括購入のシードで使う、管理画面の操作。セレクタはここだけに置く。
 *
 * ほかの機能の部品をそのまま使うもの（ここには書かない）:
 * - カードセットの登録（f09_06_setup の カードセットを登録する）・カードの登録（m14_card の カードを登録する）
 * - グッズ商品CSV登録（m03_01_goods_register）・商品コードで商品IDを読む（m03_23_seed_products の productIdsByCode）
 * - 商品規格一覧を読む（f05_04_products）・商品規格の削除（f01_02_setup の 規格を削除する）
 * - 在庫検索一覧・在庫編集・在庫編集承認一覧（m04_02_rc_stock・stock_edit）
 * - デッキの入力と登録（m15_05_deck_edit の デッキ編集画面）・デッキIDで探す／消す（f09_06_setup）
 *
 * ここに足したもの（既存の部品に無い操作）:
 * - 商品登録編集で、カード指定・商品名の入れ直し・商品カテゴリの付け替え（サプライ・グッズ → 単体カード）・割引率・公開状態を
 *   まとめて入れて「商品を登録」する（既存の assignCardOnProductEdit はカテゴリと公開状態を扱わない）。
 * - 商品規格登録編集で、言語（その他言語を含む）・状態・商品コード・価格・公開ステータスを入れて登録する。
 *   スマレジ連携フラグが「連携する」の規格は、保存すると外部のスマレジへ送られるので、保存せずに止める（F05-04 と同じ扱い）。
 * - デッキ編集で、既存のフォーマットとアーキタイプの組（アーキタイプのあるフォーマットの先頭）を読む。
 * - デッキ編集のプレイヤー検索で、お名前の行のIDを読み、（求められれば）その行の「決定」を押す。
 * - MTGマスターデータの「言語」の一覧の名前を読む（行の追加・編集・保存はしない）。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { readLanguageChoicesFromClassForm } from "./m03_01_product_class";
import { CardSearchPage } from "./m14_card";
import { デッキ編集画面 } from "./m15_05_deck_edit";

type Issue = (m: string) => void;

const 正規 = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** 選択欄の、値が空でない選択肢（値と表示名） */
async function 選択肢(select: Locator): Promise<{ value: string; label: string }[]> {
  return select.locator("option").evaluateAll((ns) => ns
    .map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })).filter((o) => o.value !== ""));
}

// ---------------------------------------------------------------------------
// 前提の確かめ（参照だけ）
// ---------------------------------------------------------------------------

/** データ管理＞MTGマスターデータで「言語」を選び、一覧の行の日本語名を読む（保存しない） */
export async function 言語マスタの名前(page: Page): Promise<string[]> {
  await page.goto(adminUrl("/data/mtg_master_data"));
  await page.waitForLoadState("load");
  await page.locator('select[name="entity"]').selectOption({ label: "言語" });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.locator('form[method="get"] button[type="submit"]').click(),
  ]);
  await page.waitForLoadState("load");
  await expect(page.locator("form#edit_form table.mtg-master-table"), "言語の一覧").toBeVisible();
  return page.locator("form#edit_form table.mtg-master-table tbody tr").evaluateAll((trs) => {
    const out: string[] = [];
    for (const tr of trs) {
      const first = tr.querySelector("input[name], select[name]") as HTMLInputElement | null;
      const m = /^rows\[(.+?)\]\[/.exec(first?.getAttribute("name") ?? "");
      if (!m || m[1] === "new") continue;
      const v = (f: string) => ((tr.querySelector(`[name="rows[${m[1]}][${f}]"]`) as HTMLInputElement | null)?.value ?? "");
      out.push((v("name_jp") || v("nameJp") || v("name")).trim());
    }
    return out;
  });
}

/** 既存の商品の商品規格登録画面（新規）を開き、言語と状態の選択肢の表示名を読む（登録ボタンは押さない） */
export async function 商品規格登録画面の選択肢(page: Page): Promise<{ 言語: string[]; 状態: string[]; 状態のコード: string[] }> {
  const 言語 = (await readLanguageChoicesFromClassForm(page)).map((o) => o.label);
  const cond = page.locator("form#form #admin_product_class_CardCondition");
  await expect(cond, "商品規格登録画面の状態の欄").toBeVisible();
  const 状態 = (await 選択肢(cond)).map((o) => o.label);
  const 状態のコード = await cond.locator("option[data-code]").evaluateAll((ns) => ns.map((n) => n.getAttribute("data-code") ?? ""));
  return { 言語, 状態, 状態のコード };
}

// ---------------------------------------------------------------------------
// カード
// ---------------------------------------------------------------------------

/** カード一覧でカード名を検索し、カード名の欄がその名前の行の数（同じ名前のカードが無いことの確かめに使う） */
export async function 同じ名前のカードの数(page: Page, 名: string): Promise<number> {
  const list = new CardSearchPage(page);
  await list.open();
  await list.キーワードで検索する(名);
  return (await list.表示行()).filter((r) => r.カード名 === 名 || r.カード名.startsWith(`${名} `) || r.カード名.endsWith(` ${名}`) || r.カード名.includes(` / ${名}`)).length;
}

/** カード編集画面（登録直後）の詳細情報ごとの、カード詳細IDと選ばれているカードセットID（上から順） */
export async function 詳細情報のカードセット(page: Page): Promise<{ 詳細ID: string; カードセットID: string }[]> {
  return page.locator("#card-details-container .detail-card").evaluateAll((cards) => cards.map((c) => ({
    詳細ID: /カード詳細ID:\s*(\d+)/.exec(c.querySelector(".detail-header strong")?.textContent ?? "")?.[1] ?? "",
    カードセットID: (c.querySelector('select[name$="[cardset]"]') as HTMLSelectElement | null)?.value ?? "",
  })));
}

// ---------------------------------------------------------------------------
// 商品
// ---------------------------------------------------------------------------

export type カード指定の入力 = {
  商品ID: string;
  /** カード検索ポップアップに入れるカード名 */
  カード名: string;
  /** 選ぶ詳細情報（カードセット）のカード詳細ID */
  カード詳細ID: string;
  商品名: string;
  /** 外すカテゴリ（サプライ・グッズ）と付けるカテゴリ（単体カード） */
  外すカテゴリID: string; 付けるカテゴリID: string;
  割引率ID: string;
  公開状態: "公開" | "非公開";
};

/**
 * 商品登録編集画面（既存の商品の編集）で「カード指定 >」を押し、カード検索ポップアップでカード名を検索して、
 * 指定のカード詳細の行の「決定」を押す。続けて商品名(日)・(英)を入れ直し、商品カテゴリを付け替え、割引率と公開状態を選んで
 * 「商品を登録」を押す。
 */
export async function カードを指定して商品を登録する(page: Page, v: カード指定の入力, what: string, issue: Issue): Promise<void> {
  await page.goto(adminUrl(`/product/product/${v.商品ID}/edit`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  await expect(form, `${what}: 商品登録編集画面`).toBeVisible();
  const open = page.locator('button[data-bs-target="#searchCardDetailModal"]');
  await expect(open, `${what}: 「カード指定 >」ボタン`).toHaveCount(1);
  await expect(open, `${what}: 「カード指定 >」を押せる（カード未指定の商品）`).toBeEnabled();
  await open.click();
  const modal = page.locator("#searchCardDetailModal");
  await expect(modal, `${what}: カード検索ポップアップ`).toBeVisible();
  await modal.locator("#admin_search_card_detail_card_name").fill(v.カード名);
  await modal.locator("#searchCardDetailModalButton").click();
  const row = modal.locator("#searchCardDetailModalList tbody tr")
    .filter({ has: page.locator("td:first-child", { hasText: new RegExp(`^\\s*${v.カード詳細ID}\\s*$`) }) });
  await expect(row, `${what}: カード検索の結果に、カード詳細ID ${v.カード詳細ID} の行がある`).toHaveCount(1, { timeout: 30_000 });
  await row.getByRole("button", { name: "決定", exact: true }).click();
  await expect(modal, `${what}: カードを決定するとカード検索が閉じる`).toBeHidden();
  await expect(form.locator("#admin_product_CardDetail"), `${what}: 選んだカード詳細が商品に入る`).toHaveValue(v.カード詳細ID);

  for (const [name, label] of [["name", "商品名(日)"], ["name_en", "商品名(英)"]] as const) {
    const field = form.locator(`input[name="admin_product[${name}]"]`);
    const now = await field.inputValue();
    if (now !== v.商品名) issue(`${what}: カード指定で${label}が「${now}」になったので「${v.商品名}」に入れ直した`);
    await field.fill(v.商品名);
  }
  const 外す = form.locator(`#admin_product_category_${v.外すカテゴリID}`);
  const 付ける = form.locator(`#admin_product_category_${v.付けるカテゴリID}`);
  await expect(付ける, `${what}: 単体カードのカテゴリのチェック欄`).toHaveCount(1);
  if (await 外す.count()) await 外す.setChecked(false, { force: true });
  await 付ける.setChecked(true, { force: true });
  await form.locator('select[name="admin_product[Discount]"]').selectOption(v.割引率ID);
  await chooseByLabel(form.locator('select[name="admin_product[Status]"]'), v.公開状態);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }),
    form.locator('button[type="submit"]').filter({ hasText: /^\s*商品を登録\s*$/ }).click(),
  ]);
  const errors = await page.locator(".invalid-feedback, .form-error-message, .alert-danger").evaluateAll((nodes) => nodes
    .filter((n) => (n as HTMLElement).offsetParent !== null && (n.textContent ?? "").trim() !== "")
    .map((n) => (n.textContent ?? "").replace(/\s+/g, " ").trim())
    .filter((t) => !t.includes("デバッグモードが有効")));
  if (errors.length) throw new Error(`${what}: 「商品を登録」で入力エラー: ${errors.join(" / ")}`);
  for (const w of await expectSaved(page, `${what}: 商品を登録`)) issue(`${what}: 警告「${w}」`);
  await expect(page.locator("#admin_product_cardDetailId_name"), `${what}: 保存後、指定したカードが表示される`).toContainText(v.カード名);
}

export type 規格の入力 = {
  /** 言語の選択肢の表示名（日本語・英語・中国語簡体字 など） */
  言語: string;
  /** 状態の選択肢のコード（NM・SP・MP・HP） */
  状態: string;
  商品コード: string;
  販売価格: string; 基準価格: string; 買取価格: string;
};

/** スマレジ連携フラグが「連携しない」であることを確かめる（「連携する」なら保存すると外部へ送られるので止める） */
async function スマレジ連携しないことを確かめる(form: Locator, what: string): Promise<void> {
  const on = form.locator('input[name="admin_product_class[smaregi_alignment_flg]"][value="1"]');
  const off = form.locator('input[name="admin_product_class[smaregi_alignment_flg]"][value="0"]');
  if ((await on.count()) && (await on.isChecked())) {
    throw new Error(`${what}: スマレジ連携フラグが「連携する」になっている。保存すると外部のスマレジへ送られるので止める`);
  }
  if ((await off.count()) && !(await off.isChecked())) await off.check();
}

async function 規格の欄を入れる(page: Page, form: Locator, v: Partial<規格の入力> & { 商品コード: string; 販売価格: string; 基準価格: string; 買取価格: string }, what: string, issue: Issue): Promise<void> {
  if (v.言語 !== undefined) await chooseByLabel(form.locator("#admin_product_class_Language"), v.言語);
  if (v.状態 !== undefined) {
    const cond = form.locator("#admin_product_class_CardCondition");
    const value = await cond.locator(`option[data-code="${v.状態}"]`).getAttribute("value");
    if (!value) throw new Error(`${what}: 状態「${v.状態}」の選択肢が無い`);
    await cond.selectOption(value);
  }
  await form.locator("#admin_product_class_code").fill(v.商品コード);
  await form.locator("#admin_product_class_standard_price").fill(v.基準価格);
  await form.locator("#admin_product_class_price02").fill(v.販売価格);
  await form.locator("#admin_product_class_buy_price").fill(v.買取価格);
  const section = form.locator("#admin_product_class_Section");
  const first = (await 選択肢(section))[0];
  if (!first) throw new Error(`${what}: 部門に選べる値が無い`);
  await section.selectOption(first.value);
  if (!(await form.locator("#admin_product_class_sale_type").inputValue())) throw new Error(`${what}: 販売種別が未選択（シード表に指定が無く補えない）`);
  await chooseByLabel(form.locator("#admin_product_class_Status"), "公開");
  await スマレジ連携しないことを確かめる(form, what);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }),
    form.getByRole("button", { name: "商品規格を登録", exact: true }).click(),
  ]);
  for (const w of await expectSaved(page, `${what}: 商品規格を登録`)) issue(`${what}: 警告「${w}」`);
}

const 登録後の規格ID = (page: Page, what: string): string => {
  const m = new URL(page.url()).pathname.match(/\/class\/\d+\/edit\/(\d+)$/);
  if (!m) throw new Error(`${what}: 登録後に商品規格編集画面へ移らない（${page.url()}）`);
  return m[1];
};

/** 取り込みで作られた商品規格の商品規格登録編集画面で、商品コード・価格・部門（先頭）・公開ステータス（公開）を入れて登録する */
export async function 取り込みの規格を登録する(page: Page, 商品ID: string, 規格ID: string, v: Omit<規格の入力, "言語" | "状態">, what: string, issue: Issue): Promise<string> {
  await page.goto(adminUrl(`/product/product/class/${商品ID}/edit/${規格ID}`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form");
  await expect(form, `${what}: 商品規格登録編集画面`).toBeVisible();
  await 規格の欄を入れる(page, form, v, what, issue);
  return 登録後の規格ID(page, what);
}

/** 商品規格一覧の「新規作成」から開く商品規格登録画面で、言語・状態・商品コード・価格・部門（先頭）・公開ステータス（公開）を入れて登録する */
export async function 規格を新しく登録する(page: Page, 商品ID: string, v: 規格の入力, what: string, issue: Issue): Promise<string> {
  await page.goto(adminUrl(`/product/product/class/${商品ID}/new`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form");
  await expect(form, `${what}: 商品規格登録画面`).toBeVisible();
  await 規格の欄を入れる(page, form, v, what, issue);
  return 登録後の規格ID(page, what);
}

// ---------------------------------------------------------------------------
// デッキ
// ---------------------------------------------------------------------------

/** デッキ新規登録画面で、アーキタイプの選択肢があるフォーマットの先頭と、そのアーキタイプの先頭の表示名を読む（保存しない） */
export async function 既存のフォーマットとアーキタイプ(page: Page): Promise<{ フォーマット: string; アーキタイプ: string }> {
  await page.goto(adminUrl("/deck/new"));
  const e = new デッキ編集画面(page);
  await e.読み込みを待つ();
  for (const f of await 選択肢(e.フォーマット)) {
    await e.フォーマット.selectOption(f.value);
    const a = (await 選択肢(e.アーキタイプ))[0];
    if (a) return { フォーマット: f.label, アーキタイプ: a.label };
  }
  throw new Error("デッキ新規登録画面に、アーキタイプの選択肢があるフォーマットが無い");
}

/**
 * デッキ編集画面のプレイヤーの「検索」を押し、プレイヤー検索ポップアップで語を検索して、お名前がちょうど 名前 の行の
 * IDを読む（ページ送りがあれば送る）。選ぶなら、その行の「決定」を押す。選ばないなら、ポップアップを閉じる。
 */
export async function プレイヤーを検索する(page: Page, 語: string, 名前: string, 選ぶ: boolean): Promise<string> {
  const e = new デッキ編集画面(page);
  await e.プレイヤー検索ボタン.click();
  const m = e.プレイヤー検索画面;
  await expect(m, "プレイヤー検索ポップアップ").toBeVisible();
  await m.locator("#player_search_word").fill(語);
  const first = page.waitForResponse((r) => r.url().includes("/deck/search_player"));
  await m.locator("#btn_search_player").click();
  await first;
  for (let i = 0; i < 50; i++) {
    await expect(m.locator("#player_search_results table, #player_search_results p").first(), `プレイヤー検索「${語}」の結果`).toBeVisible({ timeout: 30_000 });
    const 行 = m.locator("#player_search_results tbody tr").filter({ has: page.locator("td:nth-child(2)", { hasText: new RegExp(`^\\s*${正規(名前)}(\\s|$)`) }) });
    const n = await 行.count();
    if (n > 1) throw new Error(`プレイヤー検索「${語}」の結果に、お名前「${名前}」の行が ${n} 件ある`);
    if (n === 1) {
      const id = ((await 行.locator("td:first-child").innerText()) ?? "").trim();
      if (!/^\d+$/.test(id)) throw new Error(`プレイヤー検索の行のIDを読めない: ${id}`);
      if (選ぶ) {
        await 行.locator("button.select-player").click();
        await expect(m, "「決定」を押すとプレイヤー検索ポップアップが閉じる").toBeHidden();
        await expect(page.locator('[name="admin_deck[playerId]"]'), "選んだプレイヤーがデッキに設定される").toHaveValue(id);
      } else {
        await m.locator('[data-bs-dismiss="modal"]').first().click();
        await expect(m, "プレイヤー検索ポップアップを閉じる").toBeHidden();
      }
      return id;
    }
    const 次へ = m.locator("li.page-item:not(.disabled) a.player-page").filter({ hasText: /^\s*次へ\s*$/ });
    if (!(await 次へ.count())) break;
    const res = page.waitForResponse((r) => r.url().includes("/deck/search_player"));
    await 次へ.click();
    await res;
  }
  throw new Error(`プレイヤー検索「${語}」の結果に、お名前「${名前}」の行が無い`);
}
