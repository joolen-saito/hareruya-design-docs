/**
 * F01-01 本店ECTOP のシードが使う、管理画面の操作（共有のタグの対象を空にして戻す・試験用の商品を作る）。セレクタはここだけに書く。
 *
 * 本店TOPの「最新入荷アイテム」「Trending Now」「SALE開催中」「値下げしました！」「補充しました！」の欄は、固定のタグが付いた商品を出す。
 * 固定のタグは共有なので、ケースの前提（「このタグの対象はこの商品だけ」）を作るには、そのタグが付いている他の商品からタグを外す必要がある。
 * 外す前に今の対象の商品（全件）を控え、戻す処理を lib/shared_restore.ts に登録する。戻すときは次を画面で行う。
 *   - ケースが作った商品など、控えた対象に無い商品からタグを外す
 *   - 控えた対象の商品のうち、いま付いていないものにタグを付け直す
 *   そのあと、タグの対象が控えと同じ商品の集まりに戻ったことを確かめる。
 * 対象の商品が多すぎる（下の上限を超える）ときは、何も書き換えずに止める。
 */
import { Browser, expect, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../../config/env";
import { rc, RUN_MARK } from "../../lib/run_marker";
import { registerRestore } from "../../lib/shared_restore";
import { adminUrl, withAdminSession } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { 在庫を増減して承認する } from "./f02_01_setup";
import { 規格のセールを設定する, 既存のカードを指定する } from "./f01_02_setup";
import { downloadGoodsCsvTemplate, readExistingGoodsChildCategoryId } from "./m03_01_goods_csv";
import { registerGoodsCsv } from "./m03_01_goods_register";
import { allTagRows } from "./m03_28_seed_ops";
import { classRowsFromProductEdit, openProductEditByCode, readLanguageIds } from "./m03_23_seed_products";
import { ProductSearchPage } from "./product_search";

export type Issue = (m: string) => void;

/** 本店TOPの欄に出る固定のタグの名称（タグ登録の一覧の名称） */
export const 固定タグ = { 最新入荷: "最新入荷アイテム", TrendingNow: "Trending Now", セール: "セール", 値下げ: "値下げ", 補充: "補充しました" } as const;
export type 固定タグ名 = typeof 固定タグ[keyof typeof 固定タグ];

/** 1つのタグの対象として控える商品の上限（これを超えたら、書き換える前に止める） */
const 対象の上限 = 60;

/** 商品マスター(検索入力)の、既定でチェックされている絞り込み（公開状態・状態・高額商品）を外す */
async function 既定の絞り込みを外す(search: ProductSearchPage): Promise<void> {
  await search.ensureDetailVisible();
  for (const field of ["status", "card_condition", "expensive"]) {
    for (const option of await search.choiceOptions(field)) {
      if (option.checked) await search.setChecked(field, option.value, false);
    }
    await expect.poll(() => search.checkedValues(field), "商品マスターの既定の絞り込みを外す").toEqual([]);
  }
}

/**
 * 本店TOPの欄が使うタグのID（アプリの決め打ち。src/Eccube/Entity/Tag.php の定数）。
 *   最新入荷アイテム = NEW_ITEMS_ID(1)（Service/Block/NewItemsBlockPayloadBuilder.php。英語の Trending Now だけは追加システム設定の slider_en_only_tag_id）
 *   補充しました = RECOMMEND_ID(2)（RestockedBlockPayloadBuilder.php）・値下げ = PRICE_DOWN_ID(4)（PriceDownBlockPayloadBuilder.php）
 *   SALE開催中 = SALE_ID(8)（SaleBlockPayloadBuilder.php・Controller/Block/SaleTwoRowController.php）
 * 開発環境には同じ名称のタグが2行ずつある（例: ID 1 と 50000001 がどちらも「最新入荷アイテム」）。名称で1件に決めず、欄が使う方のIDを使う。
 * 正本の「セール」タグは、名称が「セール」のタグが無い（SALE開催中の欄は ID 8 のタグを出す）。欄が使う ID 8 を「セール」タグとして読み替える。
 */
const 欄が使うタグID: Partial<Record<string, string>> = { [固定タグ.最新入荷]: "1", [固定タグ.補充]: "2", [固定タグ.値下げ]: "4", [固定タグ.セール]: "8" };

/** 本店TOPの欄が使うタグのID。決め打ちのIDが無いタグ（Trending Now）は、タグ登録/編集画面の一覧で名称（日または英）がちょうど 名称 のタグ（1件のはず） */
export async function タグIDを読む(page: Page, 名称: string): Promise<string> {
  const all = await allTagRows(page);
  const 決め打ち = 欄が使うタグID[名称];
  if (決め打ち) {
    const row = all.find((r) => r.ID === 決め打ち);
    if (!row) throw new Error(`タグ登録の一覧に、本店TOPの欄が使うタグ（ID ${決め打ち}・正本の「${名称}」）が無い`);
    // セール（ID 8）は名称が「セール」でないため、名称は比べない（読み替え）。ほかは名称も合うことを確かめる
    if (名称 !== 固定タグ.セール && row.名称日 !== 名称) throw new Error(`タグ登録の一覧で、本店TOPの欄が使うタグ ID ${決め打ち} の名称が「${row.名称日}」（「${名称}」のはず）`);
    return row.ID;
  }
  const rows = all.filter((r) => r.名称日 === 名称 || r.名称英 === 名称);
  if (rows.length !== 1) throw new Error(`タグ登録の一覧に、名称が「${名称}」のタグが ${rows.length} 件ある（1件のはず）`);
  return rows[0].ID;
}

/** 商品マスターを、タグを指定して公開状態の絞り込みなしで検索し、該当する商品のID（全件）を返す */
export type 対象の商品 = { id: string; code: string };
/** E2E が作った商品（商品コードの末尾が「-」＋実行の印: 英大文字・数字6〜10字）か */
// 実行の印は Date.now() の36進（2026年は M で始まる8字）。形だけで E2E の商品とみなすので、形をできるだけ狭くする
export const 印つきか = (code: string): boolean => /-M[0-9A-Z]{7}$/.test(code) || code.endsWith(`-${RUN_MARK}`);

export async function タグの対象の商品(page: Page, タグID: string): Promise<対象の商品[]> {
  const search = new ProductSearchPage(page);
  await search.open();
  await 既定の絞り込みを外す(search);
  await search.field("tag_id").evaluate((e, v) => {
    const s = e as HTMLSelectElement;
    for (const o of Array.from(s.options)) o.selected = o.value === v;
    s.dispatchEvent(new Event("change", { bubbles: true }));
  }, タグID);
  await search.submitAndWaitForResult();
  const none = await page.getByText(/^検索条件に合致するデータが見つかりませんでした$/).first().isVisible();
  if (none) return [];
  const head = (await page.getByText(/^検索結果：\d+件が該当しました$/).first().innerText()).trim();
  const total = Number(/(\d+)/.exec(head)![1]);
  // 商品マスターの表示件数の初期値は10件。検索の前に「?page_count=500」で開いても、検索前の初期表示が表示件数の指定を消すので効かない
  // （Admin/Product/ProductController.php の index の初期表示の分岐。2026-11-13 の F01-01 の流しで 191件中10件しか出なかった）。
  // 検索のあとに、ページ送りのアドレス（検索条件は画面が覚えている）へ表示件数（選択肢の 500）を付けて開き直す
  if (total > 10) {
    await page.goto(adminUrl("/product/page/1?page_count=500"), { timeout: 120_000 });
    await page.waitForLoadState("load");
    const again = (await page.getByText(/^検索結果：\d+件が該当しました$/).first().innerText()).trim();
    if (again !== head) throw new Error(`タグ ${タグID} の検索結果を表示件数500で開き直したら、件数の表示が「${head}」から「${again}」に変わった`);
  }
  const ids = await page.locator('tr[id^="ex-product-"]').evaluateAll((trs) => trs.map((tr) => ({ id: (tr.querySelector("td:nth-child(2)")?.textContent ?? "").trim(), code: (tr.querySelector("td:nth-child(4)")?.textContent ?? "").trim() })));
  if (ids.length !== total) throw new Error(`タグ ${タグID} の対象の商品が ${total} 件だが、検索結果の1ページには ${ids.length} 件しか出ない（全件を控えられない）`);
  return ids;
}

export type 編集内容 = Record<string, string>;
/** 商品登録編集画面の全項目（入力欄・選択欄・チェックの状態。なりすまし対策のトークンとファイル欄を除く）を読む */
export async function 商品の編集内容(page: Page, 商品ID: string): Promise<編集内容> {
  await page.goto(adminUrl(`/product/product/${商品ID}/edit`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  await expect(form, `商品ID ${商品ID} の商品登録編集`).toBeVisible();
  return form.evaluate((f) => {
    const out: Record<string, string> = {};
    const seen = new Map<string, number>();
    for (const el of Array.from((f as HTMLFormElement).elements) as HTMLInputElement[]) {
      const name = el.name;
      if (!name || /_token/.test(name) || el.type === "file" || el.type === "submit" || el.type === "button") continue;
      const n = seen.get(name) ?? 0;
      seen.set(name, n + 1);
      if (el.type === "checkbox" || el.type === "radio") out[`${name}=${el.value}`] = el.checked ? "1" : "0";
      else if (el.type === "select-multiple") out[`${name}@${n}`] = Array.from((el as unknown as HTMLSelectElement).selectedOptions).map((o) => o.value).join(",");
      else out[`${name}@${n}`] = el.value;
    }
    return out;
  });
}

/** 保存しても値が変わらずに済むか（割引率が未選択・販売制限が未選択だと、保存で先頭の値が入り、画面では元に戻せない）。戻せない理由を返す（戻せるなら空） */
export function 戻せない理由(内容: 編集内容): string {
  const d = Object.entries(内容).find(([k]) => /^admin_product\[Discount\]@/.test(k));
  if (d && d[1] === "") return "割引率が未選択";
  const r = Object.entries(内容).filter(([k]) => /^admin_product\[RegionRestriction\]=/.test(k));
  if (r.length > 0 && !r.some(([, v]) => v === "1")) return "販売制限が未選択";
  return "";
}

/** 商品登録編集で、指定のタグを付ける／外して「商品を登録」する（割引率が未選択なら先頭を選ぶ）。変えたら true */
export async function 商品のタグを設定する(page: Page, 商品ID: string, タグID: string, 付ける: boolean, what: string, onIssue: Issue): Promise<boolean> {
  await page.goto(adminUrl(`/product/product/${商品ID}/edit`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  await expect(form, `${what}: 商品ID ${商品ID} の商品登録編集`).toBeVisible();
  const check = form.locator(`input[name="admin_product[Tag][]"][value="${タグID}"]`);
  if ((await check.isChecked()) === 付ける) return false;
  const btn = form.locator(`#allTags button[data-tag-id="${タグID}"]`);
  if (!(await btn.isVisible())) await form.locator('a[href="#allTags"], [data-bs-toggle="collapse"][href="#allTags"]').first().click({ timeout: 20_000 });
  await btn.click({ timeout: 20_000 });
  await expect(check, `${what}: タグ ${タグID} を${付ける ? "付けた" : "外した"}状態`).toBeChecked({ checked: 付ける });
  const discount = form.locator('select[name="admin_product[Discount]"]');
  if (!(await discount.inputValue())) {
    const first = await discount.locator("option").evaluateAll((ns) => ns.map((n) => (n as HTMLOptionElement).value).find((v) => v !== ""));
    if (first) await discount.selectOption(first);
  }
  await expect(form.locator('input[type="radio"][name="admin_product[RegionRestriction]"]:checked'), `${what}: 販売制限が選ばれている`).toHaveCount(1);
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), form.locator("button[type=submit]").filter({ hasText: /^\s*商品を登録\s*$/ }).click({ timeout: 20_000, noWaitAfter: true })]);
  for (const w of await expectSaved(page, `${what}: 商品ID ${商品ID} の「商品を登録」`)) onIssue(w);
  return true;
}

/** 商品登録編集で、商品の公開状態だけを変えて「商品を登録」する */
export async function 商品の公開状態を設定する(page: Page, 商品ID: string, 状態: "公開" | "非公開", what: string, onIssue: Issue): Promise<void> {
  await page.goto(adminUrl(`/product/product/${商品ID}/edit`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  await expect(form, `${what}: 商品ID ${商品ID} の商品登録編集`).toBeVisible();
  await chooseByLabel(form.locator('select[name="admin_product[Status]"]'), 状態);
  const discount = form.locator('select[name="admin_product[Discount]"]');
  if (!(await discount.inputValue())) {
    const first = await discount.locator("option").evaluateAll((ns) => ns.map((n) => (n as HTMLOptionElement).value).find((v) => v !== ""));
    if (first) await discount.selectOption(first);
  }
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), form.locator("button[type=submit]").filter({ hasText: /^\s*商品を登録\s*$/ }).click({ timeout: 20_000, noWaitAfter: true })]);
  for (const w of await expectSaved(page, `${what}: 商品ID ${商品ID} を${状態}に`)) onIssue(w);
}

/**
 * 共有の固定タグ（名称のリスト）の対象を、控えたうえで空にする。戻す処理は lib/shared_restore.ts に登録する（ケースの終わりに逆順で動く）。
 * 控える前に何も書き換えない。対象が上限を超えるときは止める。
 * 返す値は、タグの名称 → タグID。
 */
export async function 共有タグの対象を空にする(browser: Browser, seedId: string, 名称: 固定タグ名[], issue: Issue): Promise<Record<string, string>> {
  const ids: Record<string, string> = {};
  /** 戻す対象（E2E が作った印つきの商品を除く）と、外す対象（印つきを含む） */
  const orig = new Map<string, string[]>();
  const 外す = new Map<string, string[]>();
  /** 書き換える前の、戻す対象の商品の編集画面の全項目 */
  const 控え = new Map<string, 編集内容>();
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const n of 名称) {
      const id = await タグIDを読む(page, n);
      const holders = await タグの対象の商品(page, id);
      const 共有 = holders.filter((h) => !印つきか(h.code));
      if (共有.length > 対象の上限) throw new Error(`${seedId}: 共有のタグ「${n}」の対象の商品（E2Eが作った印つきを除く）が ${共有.length} 件あり、上限 ${対象の上限} 件を超える（書き換えずに止めた）`);
      ids[n] = id;
      orig.set(n, 共有.map((h) => h.id));
      外す.set(n, holders.map((h) => h.id));
    }
    // 保存すると値が変わってしまい、画面では元に戻せない商品が1件でもあれば、何も書き換えずに止める
    const 戻せない: string[] = [];
    for (const n of 名称) {
      for (const p of orig.get(n)!) {
        if (控え.has(p)) continue;
        const c = await 商品の編集内容(page, p);
        控え.set(p, c);
        const why = 戻せない理由(c);
        if (why) 戻せない.push(`商品ID ${p}（${why}）`);
      }
    }
    if (戻せない.length) throw new Error(`${seedId}: 共有の商品が画面で戻せない状態（書き換えずに止めた。未判定）: ${戻せない.join("、")}`);
  });
  let 最初 = true;
  for (const n of 名称) {
    const id = ids[n];
    const 元 = orig.get(n)!;
    const 全部比べる = 最初; // 最後に確かめる（最初に登録した）対象で、他のタグも含めた全項目を比べる
    最初 = false;
    // 書き換える前に、戻す処理を登録する（途中で落ちても戻る）
    registerRestore(
      `共有のタグ「${n}」(ID ${id})の対象の商品`,
      { 元の対象の商品ID: 元 },
      async () => {
        await withAdminSession(browser, SETUP_ADMIN, async (page) => {
          page.setDefaultTimeout(60_000);
          const now = (await タグの対象の商品(page, id)).map((h) => h.id);
          for (const p of now.filter((x) => !元.includes(x))) await 商品のタグを設定する(page, p, id, false, `${seedId}: 戻す`, issue);
          for (const p of 元.filter((x) => !now.includes(x))) await 商品のタグを設定する(page, p, id, true, `${seedId}: 戻す`, issue);
        });
      },
      async () => withAdminSession(browser, SETUP_ADMIN, async (page) => {
        page.setDefaultTimeout(60_000);
        const now = (await タグの対象の商品(page, id)).map((h) => h.id).sort();
        if (JSON.stringify(now) !== JSON.stringify([...元].sort())) return false;
        // 戻した商品の編集画面の全項目が、書き換える前の控えと同じか（他のタグの戻しが残るときは、タグのチェックを除いて比べる）
        for (const p of 元) {
          const a = 控え.get(p)!;
          const b = await 商品の編集内容(page, p);
          const 比べる = (o: 編集内容) => Object.entries(o).filter(([k]) => 全部比べる || !k.startsWith("admin_product[Tag][]")).sort(([x], [y]) => x.localeCompare(y));
          if (JSON.stringify(比べる(a)) !== JSON.stringify(比べる(b))) return false;
        }
        return true;
      }),
    );
  }
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const n of 名称) for (const p of 外す.get(n)!) await 商品のタグを設定する(page, p, ids[n], false, `${seedId}: 「${n}」の対象を空にする`, issue);
  });
  return ids;
}

export type 試験商品 = {
  /** 正本の商品コード（実行の印を付けて作る） */
  コード: string;
  言語: "日本語" | "英語";
  公開?: boolean;
  在庫: number;
  /** 付ける固定タグの名称 */
  タグ?: 固定タグ名[];
  /** 既存のカードを商品に指定する（カード商品。カード以外の商品は省略） */
  カード?: "通常" | "Foil";
  セールフラグ?: boolean;
  /** シード表が控えると定めた呼び名（〔商品ID-…〕） */
  呼び名?: string;
};
export type 作った商品 = { 商品ID: string; 規格ID: string; 名前: string; コード: string };

/** 商品コード・商品名（日英とも）に付ける、実行の印つきの値 */
export const 試験商品の名前 = (コード: string): string => rc(コード);

/**
 * グッズ商品CSV登録で商品を作り（言語・公開ステータス・固定タグを行ごとに指定）、カードの指定・セールフラグを設定し、在庫を入庫して承認する。
 * タグのIDは tagIds（名称→ID）から引く。画像は付けない（この環境のアプリは商品画像の追加欄にファイルを渡しても取り込まない）。
 */
export async function 試験商品を作る(browser: Browser, seedId: string, defs: 試験商品[], tagIds: Record<string, string>, issue: Issue): Promise<作った商品[]> {
  const made: 作った商品[] = [];
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const lang = await readLanguageIds(page);
    const categoryId = await readExistingGoodsChildCategoryId(page);
    const headers = (await downloadGoodsCsvTemplate(page)).headers;
    const 付随 = Object.fromEntries(headers.filter((h) => h.includes("地域") || h.includes("スマレジ連携")).map((h) => [h, "0"]));
    await registerGoodsCsv(page, {
      what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId.toLowerCase()}-${Date.now()}.csv`, categoryId,
      common: { "購入グループ名称": "通常商品", ...付随 },
      lines: defs.map((d) => ({
        code: rc(d.コード), nameJp: rc(d.コード), nameEn: rc(d.コード),
        productStatus: d.公開 === false ? "非公開" as const : undefined,
        values: {
          "言語(ID)": d.言語 === "英語" ? lang.英語 : lang.日本語,
          "タグ(ID)": (d.タグ ?? []).map((t) => tagIds[t]).join(","),
        },
      })),
      onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 180_000,
    });
    for (const d of defs) {
      const code = rc(d.コード);
      const 商品ID = await openProductEditByCode(page, code);
      const rows = await classRowsFromProductEdit(page, 商品ID);
      if (rows.length !== 1) throw new Error(`${seedId}: ${code} の取込直後の商品規格が ${rows.length} 件（1件のはず）`);
      if (d.カード) await 既存のカードを指定する(page, 商品ID, { Foil: d.カード === "Foil", 商品名: code }, `${seedId}: ${code}`, issue);
      if (d.セールフラグ) await 規格のセールを設定する(page, 商品ID, rows[0].商品規格ID, { フラグ: true, 販売価格: "100" }, `${seedId}: ${code} のセール`, issue);
      made.push({ 商品ID, 規格ID: rows[0].商品規格ID, 名前: code, コード: d.コード });
    }
  });
  const 入庫 = defs.filter((d) => d.在庫 > 0).map((d) => ({ 商品コード: rc(d.コード), 数: d.在庫, 区分: "入庫/その他" as const, 承認後の在庫: d.在庫 }));
  await 在庫を増減して承認する(browser, seedId, 入庫, issue);
  return made;
}

/** 本店TOPの商品の欄は30秒のキャッシュを持つ。最後の変更から31秒待つ（シードの最後に呼ぶ） */
export async function キャッシュの期限切れを待つ(): Promise<void> {
  await new Promise((r) => setTimeout(r, 31_000));
}

/** 作った商品のうち、呼び名の決まったものの商品IDを、シード表が控えると定めた呼び名だけ控える */
export function 呼び名を控える(made: 作った商品[], defs: 試験商品[], 定め: Set<string>, set: (label: string, v: string) => void): void {
  for (const d of defs) {
    if (!d.呼び名 || !定め.has(d.呼び名)) continue;
    const m = made.find((x) => x.コード === d.コード);
    if (m) set(d.呼び名, m.商品ID);
  }
}

/** 商品規格登録編集で、状態（カードの状態）を記号（「NM」など。選択肢の data-code）で選んで「商品規格を登録」する */
export async function 規格の状態を設定する(page: Page, 商品ID: string, 規格ID: string, 記号: string, what: string, onIssue: Issue): Promise<void> {
  await page.goto(adminUrl(`/product/product/class/${商品ID}/edit/${規格ID}`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form");
  await expect(form, `${what}: 商品規格登録編集`).toBeVisible();
  const sel = form.locator('select[name="admin_product_class[CardCondition]"]');
  const value = await sel.locator(`option[data-code="${記号}"]`).first().getAttribute("value");
  if (!value) throw new Error(`${what}: 状態の選択肢に記号「${記号}」のものが無い`);
  await sel.selectOption(value);
  const section = form.locator("#admin_product_class_Section");
  if (!(await section.inputValue())) {
    const first = await section.locator("option").evaluateAll((ns) => ns.map((n) => (n as HTMLOptionElement).value).find((x) => x !== ""));
    if (first) await section.selectOption(first);
  }
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), form.getByRole("button", { name: "商品規格を登録", exact: true }).click({ timeout: 20_000, noWaitAfter: true })]);
  for (const w of await expectSaved(page, `${what}: 状態「${記号}」で商品規格を登録`)) onIssue(w);
  await expect(sel.locator("option:checked"), `${what}: 登録後の状態`).toHaveAttribute("data-code", 記号);
}
