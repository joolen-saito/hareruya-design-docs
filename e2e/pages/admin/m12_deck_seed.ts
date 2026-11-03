/**
 * M12-09・M12-10 のシードで共通の、カード・商品・アーキタイプ・デッキを画面で作る部品。
 * 流れ（シード表の投入方法の順）: カードセット登録 → カード登録（カードタイプID 1・特殊タイプ） → グッズ商品CSV登録 →
 * 商品登録編集で「カード指定」 → 商品規格を公開 → アーキタイプ登録 → デッキ登録（メインボードにカード名の行）。
 */
import { expect, Page } from "@playwright/test";
import { rc } from "../../lib/run_marker";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { readExistingGoodsChildCategoryId } from "./m03_01_goods_csv";
import { registerGoodsCsv } from "./m03_01_goods_register";
import { openProductEditByCode } from "./m03_23_seed_products";
import { publishClass } from "./f03_06_products";
import { assignCardOnProductEdit } from "./product_card_assign";

type Issue = (m: string) => void;

export type カード定義 = {
  /** 正本のカード名(英)（実行の印を付けて作る） */
  カード名: string;
  /** 正本のカードセット名（日）・（英）・略称（実行の印を付けて作る。略称は半角） */
  セット名日: string; セット名英: string; セット略称: string;
  /** 特殊タイプの表示名（空なら選ばない） */
  特殊タイプ: string[];
  /** 詳細情報（カードセットの紐づけ）を足さずに登録する（代表の商品が無いカード） */
  詳細なし?: boolean;
  /** 代表の商品。null は商品を作らない */
  商品: { 商品コード: string; 商品名日: string; 商品名英: string } | null;
};

export type 作ったカード = { カードID: string; カード詳細ID?: string; カードセットID: string; 商品ID?: string; 商品規格ID?: string; 商品コード?: string };

/** 日付の「yyyy/mm/dd」の今日（日本時間） */
const todayIso = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date());

/** カードセットを新規に登録して、カードセットIDを返す */
async function registerCardset(page: Page, d: カード定義, issue: Issue): Promise<string> {
  await page.goto(adminUrl("/cardset/new"));
  await page.locator("#admin_cardset_nameJp").fill(rc(d.セット名日));
  await page.locator("#admin_cardset_nameEn").fill(rc(d.セット名英));
  await page.locator("#admin_cardset_code").fill(rc(d.セット略称));
  const date = page.locator('input[name="admin_cardset[releaseDate]"]');
  if (await date.count()) await date.fill("2026-01-01");
  else {
    await page.locator('[name="admin_cardset[releaseDate][year]"]').selectOption("2026");
    await page.locator('[name="admin_cardset[releaseDate][month]"]').selectOption("1");
    await page.locator('[name="admin_cardset[releaseDate][day]"]').selectOption("1");
  }
  await page.getByRole("button", { name: "登録", exact: true }).click();
  for (const w of await expectSaved(page, `カードセット「${d.セット名日}」の登録`)) issue(w);
  const m = /\/cardset\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`カードセット「${d.セット名日}」の登録後のアドレスから番号を読めない`);
  return m[1];
}

/** カード登録。カードタイプはID 1を1件だけ、特殊タイプは指定のもの。詳細情報（カードセットほか）は選択肢の先頭 */
async function registerCardWithTypes(page: Page, d: カード定義, cardsetId: string, issue: Issue): Promise<{ カードID: string; カード詳細ID?: string }> {
  const what = `カード「${d.カード名}」`;
  await page.goto(adminUrl("/card/new"));
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  await expect(form, `${what}: カード詳細(登録・編集・削除)画面`).toBeVisible();
  await form.locator("#admin_card_nameJp").fill(rc(d.カード名));
  await form.locator("#admin_card_nameEn").fill(rc(d.カード名));
  await form.locator("#admin_card_cmc").fill("0");
  await form.locator("#admin_card_manaCost").fill("");
  await form.locator('select[name="admin_card[cardtypes][]"]').selectOption([{ value: "1" }]);
  if (d.特殊タイプ.length) await chooseByLabel(form.locator('select[name="admin_card[specialtypes][]"]'), d.特殊タイプ);
  if (!d.詳細なし) {
    const details = page.locator("#card-details-container .detail-card");
    const before = await details.count();
    await page.locator("#add-detail").click();
    await expect(details, `${what}: 「詳細情報を追加」で詳細情報の欄が増える`).toHaveCount(before + 1);
    const det = details.last();
    await det.locator('select[name$="[cardset]"]').selectOption(cardsetId);
    const chosen: string[] = [];
    for (const [field, 項目] of [["rarity", "レアリティ"], ["cardLayout", "レイアウト"], ["promotion", "プロモ種別"], ["foilFlg", "Foil"], ["frameFlg", "フレーム"]] as const) {
      const sel = det.locator(`select[name$="[${field}]"]`);
      const first = await sel.locator("option").evaluateAll((ns) => ns.map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })).find((o) => o.value !== ""));
      if (!first) throw new Error(`${what}: ${項目}に選べる値が無い`);
      await sel.selectOption(first.value);
      chosen.push(`${項目}「${first.label}」`);
    }
    issue(`${what}: 詳細情報の ${chosen.join("・")} は選択肢の先頭を選んだ（正本は任意の選択肢と定める）`);
  }
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), form.locator('button[type="submit"]').filter({ hasText: /^\s*登録\s*$/ }).click()]);
  for (const w of await expectSaved(page, `${what}の登録`)) issue(w);
  const m = /\/card\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`${what}: 登録後にカードの編集画面へ移らない（${page.url()}）`);
  if (d.詳細なし) return { カードID: m[1] };
  const headers = (await page.locator("#card-details-container .detail-card .detail-header strong").allInnerTexts()).map((t) => t.trim());
  const ids = headers.map((t) => /カード詳細ID:\s*(\d+)/.exec(t)?.[1]).filter((x): x is string => !!x);
  if (ids.length !== 1) throw new Error(`${what}: カード詳細IDを1つに決められない（見出し: ${headers.join(" / ")}）`);
  return { カードID: m[1], カード詳細ID: ids[0] };
}

/**
 * カード（と代表の商品）を、シード表の順に作る。商品はグッズ商品CSV登録で1回に取り込み、1件ずつ「カード指定」と商品規格の公開を行う。
 * 商品名はカード指定で書き換わるので入れ直す（assignCardOnProductEdit）。商品公開ステータス・支店の商品公開ステータスは公開。
 */
export async function カードと商品を作る(page: Page, defs: カード定義[], what: string, issue: Issue): Promise<作ったカード[]> {
  const out: 作ったカード[] = [];
  for (const d of defs) {
    const cardsetId = await registerCardset(page, d, issue);
    const c = await registerCardWithTypes(page, d, cardsetId, issue);
    out.push({ ...c, カードセットID: cardsetId });
  }
  const withProduct = defs.map((d, i) => ({ d, i })).filter((x) => x.d.商品);
  if (withProduct.length) {
    const categoryId = await readExistingGoodsChildCategoryId(page);
    await registerGoodsCsv(page, {
      what: `${what} のグッズ商品CSV登録`, fileName: `${what.replace(/[^A-Za-z0-9_-]/g, "_")}.csv`, categoryId,
      lines: withProduct.map(({ d }) => ({
        code: rc(d.商品!.商品コード), nameJp: rc(d.商品!.商品名日), nameEn: rc(d.商品!.商品名英),
        values: { "基準価格": "1000", "販売価格": "1000", "買取価格": "100", "原価単価": "10", "地域別販売制限": "0", "スマレジ連携フラグ": "0" },
      })),
      onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`),
      uploadWaitMs: 120_000,
    });
    for (const { d, i } of withProduct) {
      const p = d.商品!;
      const productId = await openProductEditByCode(page, rc(p.商品コード));
      await assignCardOnProductEdit(page, {
        productId, cardNameJp: rc(d.カード名), cardDetailId: out[i].カード詳細ID!, productNameJp: rc(p.商品名日), productNameEn: rc(p.商品名英),
      }, (m) => issue(`${what}: ${m}`));
      const cls = await publishClass(page, productId, {}, `${what}: ${p.商品コード}`, issue);
      out[i].商品ID = productId; out[i].商品規格ID = cls.classId; out[i].商品コード = rc(p.商品コード);
    }
  }
  return out;
}

/** アーキタイプ登録（アーキタイプ名(日)・(英)・公開・フォーマット）。デッキ登録で必須のアーキタイプを用意する。名称を返す */
export async function アーキタイプを登録する(page: Page, v: { 名日: string; 名英: string; フォーマット: string }, issue: Issue): Promise<string> {
  await page.goto(adminUrl("/archetype/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_archetype[${n}]"]`);
  await f("nameJp").fill(rc(v.名日));
  await f("nameEn").fill(rc(v.名英));
  await chooseByLabel(f("Disp"), "公開");
  await chooseByLabel(f("Format"), v.フォーマット);
  await page.locator('button[type="submit"][form="admin_archetype"]').first().click();
  for (const w of await expectSaved(page, `アーキタイプ「${v.名日}」の登録`)) issue(w);
  return rc(v.名日);
}

export type デッキ定義 = {
  デッキタイプ: "イベントデッキ" | "ユーザーデッキ";
  フォーマット: string; アーキタイプ名: string;
  公開: "公開" | "非公開";
  イベント名日: string; イベント名英: string;
  /** 「2026/06/15 00:00」の形。ユーザーデッキの「開催日」も同じ欄 */
  開催日: string;
  /** メインボードの行（枚数とカード名） */
  メイン: { 枚数: number; カード名: string }[];
};

/** デッキ登録。登録後のデッキ編集画面のアドレスの番号（デッキID）を返す */
export async function デッキを登録する(page: Page, v: デッキ定義, issue: Issue): Promise<string> {
  await page.goto(adminUrl("/deck/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_deck[${n}]"]`);
  // デッキタイプの選択肢は、画面ではマスターの名前のまま「event」「user」と表示される（イベントデッキ・ユーザーデッキ）
  const タイプ表示 = { イベントデッキ: "event", ユーザーデッキ: "user" }[v.デッキタイプ];
  issue(`デッキタイプの選択肢の表示は「${タイプ表示}」（正本の「${v.デッキタイプ}」）`);
  await chooseByLabel(f("DeckType"), タイプ表示);
  await chooseByLabel(f("Format"), v.フォーマット);
  await chooseByLabel(f("Archetype"), v.アーキタイプ名);
  await chooseByLabel(f("Disp"), v.公開);
  await f("eventNameJp").fill(rc(v.イベント名日));
  await f("eventNameEn").fill(rc(v.イベント名英));
  await f("eventDate").fill(v.開催日.replace(/\//g, "-").replace(" ", "T"));
  await f("textMain").fill(v.メイン.map((l) => `${l.枚数} ${rc(l.カード名)}`).join("\n"));
  await page.locator('button[type="submit"][form="admin_deck"]').first().click();
  for (const w of await expectSaved(page, `デッキ「${v.イベント名日}」の登録`)) issue(w);
  const m = /\/deck\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`デッキ「${v.イベント名日}」を登録したが、デッキ編集画面へ移らない（${page.url()}）`);
  return m[1];
}

/**
 * デッキ一覧でフォーマット（と、あればイベント開催日の範囲）を指定して検索し、表示されたデッキをすべて選んで一括削除する。
 * 検索結果が0件になるまで繰り返す。消した件数を返す。
 */
export async function デッキを一括削除する(page: Page, フォーマット: string[], 開催日: { from: string; to: string } | null, issue: Issue): Promise<number> {
  let 消した = 0;
  for (let round = 0; round < 30; round++) {
    await page.goto(adminUrl("/deck"));
    await page.waitForLoadState("load");
    await chooseByLabel(page.locator('[name="admin_search_deck[formats][]"]'), フォーマット);
    // 検索欄の開催日(From)は、初期表示で3か月前の日付が入っている。範囲の指定が無いときは、古いデッキも消すために空にする
    await page.locator('[name="admin_search_deck[event_date_from]"]').fill(開催日 ? 開催日.from.replace(/\//g, "-") : "");
    await page.locator('[name="admin_search_deck[event_date_to]"]').fill(開催日 ? 開催日.to.replace(/\//g, "-") : "");
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator('form[name="admin_search_deck"] button[type="submit"], #search_form button[type="submit"]').first().click()]);
    const result = page.getByText(/検索結果：\d+件が該当しました|検索条件に合致するデータが見つかりませんでした/).first();
    await expect(result, "デッキ一覧の検索結果").toBeVisible();
    const rows = page.locator('input.searched_deck_id');
    const n = await rows.count();
    if (n === 0) return 消した;
    await page.locator("#allCheck").check();
    page.once("dialog", (d) => { void d.accept(); });
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("#bulk_delete").click()]);
    await expectSaved(page, "デッキの一括削除");
    消した += n;
  }
  issue("デッキの一括削除を30回繰り返しても検索結果が0件にならなかった");
  throw new Error("デッキの一括削除が終わらない");
}
