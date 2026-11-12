/**
 * F03（商品一覧・商品詳細・商品詳細検索）の、検索サービスの索引に載せる商品を画面で作る操作。セレクタはここ（と使う部品）にだけ書く。
 *
 * 作り方（シード表の投入方法の型）:
 * 1. カードの属性が要る商品は、カード詳細(登録)画面でカードを登録する（カード名・点数で見たマナ・コスト・カラー・固有色・カードタイプ・サブタイプ・
 *    リーガリティ、詳細情報のカードセット・レアリティ・Foil・フレーム・イラストレーター）。
 * 2. グッズ商品CSV登録で、まとめて1つのCSVで取り込む（言語・公開・支店公開・カテゴリ・価格・検索ワード・タグを行ごとに）。
 * 3. 商品ごとに、商品マスターで商品コードから商品登録編集画面を開き、カードがあれば「カード指定 >」で紐づけ、
 *    取込で作られた規格（ニアミント）を公開にする（セール・高額商品コードもここで入れる）。
 * 4. 在庫は、店舗ごとに在庫検索一覧から在庫編集で入庫し、登録者と別の管理者が在庫編集承認一覧で承認する
 *    （本店・TC大阪支店の両方を編集できる管理者。F04 の部品と同じ管理者を使う）。
 * 索引への送信と反映の待ちは pages/admin/unisearch_feed.ts。
 */
import { Browser, expect, Locator, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../../config/env";
import { 在庫承認の最大ID } from "../../db/f03_08";
import { 未承認の在庫編集ID } from "../../db/f04_setup";
import { RUN_MARK } from "../../lib/run_marker";
import { adminUrl, withAdminSession } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { F04大阪承認者, F04大阪登録者, 大阪の管理者を用意する, 大阪の店名, 本店の店名 } from "./f04_setup";
import { registerGoodsCsv } from "./m03_01_goods_register";
import { classRowsFromProductEdit, openProductEditByCode, readGoodsRootCategoryId, readLanguageIds } from "./m03_23_seed_products";
import { searchStockByCode } from "./m04_02_rc_stock";
import { assignCardOnProductEdit } from "./product_card_assign";
import { CardsetDetailPage } from "./m14_08_cardset_detail";
import { MtgMasterPage } from "./f03_03_masters";
import { loggedInMemberName, registerStockEdit, StockApprovalListPage } from "./stock_edit";

export type Issue = (m: string) => void;
export type 店 = "本店" | "大阪";

/** カード詳細(登録)画面で入れる属性（省略した必須項目は選択肢の先頭・試験用の値） */
export type カードの属性 = {
  /** カード名(日)・(英)（シード表: 商品コードと同じ文字列） */
  カード名: string;
  点数で見たマナ?: string;
  /** カラー・固有色の選択肢の表示名（白・青・黒・赤・緑 など） */
  カラー?: string[];
  固有色?: string[];
  /** カードタイプの日本語名 */
  カードタイプ?: string[];
  /** サブタイプの日本語名（選択肢は「英語名 / 日本語名」） */
  サブタイプ?: string[];
  /** リーガリティ（フォーマット名と、使用可・禁止などの表示名。フォーマット名が空なら選択肢の先頭） */
  リーガリティ?: { フォーマット: string; 制限: string }[];
  /** 詳細情報（省略すると選択肢の先頭。Foil は「なし」、フレームは「通常」） */
  カードセットID?: string;
  レアリティ?: string;
  Foil?: "なし" | "通常" | "特殊";
  フレーム?: "通常" | "特殊";
  イラストレーター?: string;
  /** 詳細情報の件数（省略は1件。同じカードの別の版の商品を作るとき2件以上） */
  詳細数?: number;
  /** 詳細情報ごとの Foil（詳細数の並び。省略は Foil の値） */
  詳細のFoil?: ("なし" | "通常" | "特殊")[];
};

let cardSeq = 0;
/** 実行ごとに重ならないコレクターNo */
const コレクターNo = () => `${RUN_MARK}${String(++cardSeq).padStart(3, "0")}`.slice(-16);

async function 先頭を選ぶ(select: Locator, what: string): Promise<string> {
  const first = await select.locator("option").evaluateAll((ns) => ns
    .map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })).find((o) => o.value !== ""));
  if (!first) throw new Error(`${what}に選べる値が無い`);
  await select.selectOption(first.value);
  return first.label;
}

/** 選択欄で、表示名がちょうど label（無ければ「… / label」「label / …」の形）の選択肢の値 */
async function 選択肢の値(select: Locator, label: string, what: string): Promise<string> {
  const opts = await select.locator("option").evaluateAll((ns) => ns
    .map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").replace(/\s+/g, " ").trim() })).filter((o) => o.value !== ""));
  const exact = opts.filter((o) => o.label === label);
  const hit = exact.length ? exact : opts.filter((o) => o.label.split(" / ").map((s) => s.trim()).includes(label));
  if (hit.length !== 1) throw new Error(`${what}に「${label}」の選択肢が ${hit.length} 件（1件のはず。選択肢: ${opts.slice(0, 30).map((o) => o.label).join("、")}）`);
  return hit[0].value;
}

/** チェック欄の並び（container の中）で、表示名が labels のものにチェックを付ける */
async function 表示名でチェック(container: Locator, labels: string[], what: string): Promise<void> {
  for (const l of labels) {
    const box = container.locator('input[type="checkbox"]').and(container.getByLabel(l, { exact: true }));
    if ((await box.count()) !== 1) throw new Error(`${what}に「${l}」のチェック欄が ${await box.count()} 件（1件のはず）`);
    await box.check();
  }
}

/**
 * カード詳細(登録)画面でカードを登録し、詳細情報を1件足して「登録」を押す。登録後の画面のカード詳細IDを返す。
 * 正本が定めない必須項目（レアリティ・レイアウト・プロモ種別など）は選択肢の先頭を選び、選んだ値を issue に残す。
 */
export async function 属性つきカードを登録する(page: Page, v: カードの属性, what: string, issue: Issue): Promise<{ カードID: string; カード詳細ID: string; カード詳細IDs: string[] }> {
  await page.goto(adminUrl("/card/new"));
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  await expect(form, `${what}: カード詳細(登録)画面`).toBeVisible();
  await form.locator("#admin_card_nameJp").fill(v.カード名);
  await form.locator("#admin_card_nameEn").fill(v.カード名);
  await form.locator("#admin_card_cmc").fill(v.点数で見たマナ ?? "1");
  if (v.カラー?.length) await 表示名でチェック(form.locator("#admin_card_colors"), v.カラー, `${what}: カラー`);
  if (v.固有色?.length) await 表示名でチェック(form.locator("#admin_card_colorIdentities"), v.固有色, `${what}: 固有色`);
  for (const [sel, labels, 項目] of [["#admin_card_cardtypes", v.カードタイプ, "カードタイプ"], ["#admin_card_subtypes", v.サブタイプ, "サブタイプ"]] as const) {
    if (!labels?.length) continue;
    const select = form.locator(sel);
    const values: string[] = [];
    for (const l of labels) values.push(await 選択肢の値(select, l, `${what}: ${項目}`));
    // 複数選択の欄は画面の部品（select2）が元の選択欄を隠すので、元の選択欄を直接選ぶ
    await select.selectOption(values, { force: true });
  }
  for (const r of v.リーガリティ ?? []) {
    const rows = page.locator("#card-formats-container .removable-item");
    const before = await rows.count();
    await page.locator("#add-format").click();
    await expect(rows, `${what}: 「リーガリティ追加」で行が増える`).toHaveCount(before + 1);
    const row = rows.last();
    const fmt = row.locator('select[name$="[format]"]');
    if (r.フォーマット === "") issue(`${what}: リーガリティのフォーマットは、登録済みの任意のフォーマットとして選択肢の先頭の「${await 先頭を選ぶ(fmt, `${what}: リーガリティのフォーマット`)}」を選んだ`);
    else await fmt.selectOption(await 選択肢の値(fmt, r.フォーマット, `${what}: リーガリティのフォーマット`));
    await row.locator("label").filter({ hasText: new RegExp(`^\\s*${r.制限}\\s*$`) }).click();
  }
  const details = page.locator("#card-details-container .detail-card");
  const chosen: string[] = [];
  for (let k = 0; k < (v.詳細数 ?? 1); k++) {
    const before = await details.count();
    await page.locator("#add-detail").click();
    await expect(details, `${what}: 「詳細情報を追加」で詳細情報の欄が増える`).toHaveCount(before + 1);
    const det = details.last();
    await det.locator('[name$="[cardNo]"]:not(select)').first().fill(コレクターNo());
    const pick = async (f: string, 項目: string, want?: string) => {
      const sel = det.locator(`select[name$="[${f}]"]`);
      if (want !== undefined) { await sel.selectOption(await 選択肢の値(sel, want, `${what}: 詳細情報の${項目}`)); return; }
      chosen.push(`${項目}「${await 先頭を選ぶ(sel, `${what}: 詳細情報の${項目}`)}」`);
    };
    if (v.カードセットID) await det.locator('select[name$="[cardset]"]').selectOption(v.カードセットID);
    await pick("rarity", "レアリティ", v.レアリティ);
    await pick("cardLayout", "レイアウト");
    await pick("promotion", "プロモ種別");
    await det.locator('select[name$="[foilFlg]"]').selectOption({ label: v.詳細のFoil?.[k] ?? v.Foil ?? "なし" });
    await det.locator('select[name$="[frameFlg]"]').selectOption({ label: v.フレーム ?? "通常" });
    if (v.イラストレーター) await pick("illustrator", "イラストレーター", v.イラストレーター);
  }
  if (chosen.length) issue(`${what}: 正本が値を定めない詳細情報の ${[...new Set(chosen)].join("・")} は選択肢の先頭を選んだ`);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    form.locator('button[type="submit"]').filter({ hasText: /^\s*登録\s*$/ }).click(),
  ]);
  for (const w of await expectSaved(page, `${what}: カードの登録`)) issue(`${what}: 警告「${w}」`);
  const m = /\/card\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`${what}: カードを登録したあと、カードの編集画面へ移らない（${page.url()}）`);
  const headers = (await page.locator("#card-details-container .detail-card .detail-header strong").allInnerTexts()).map((t) => t.trim());
  const ids = headers.map((t) => /カード詳細ID:\s*(\d+)/.exec(t)?.[1]).filter((x): x is string => !!x);
  if (ids.length !== (v.詳細数 ?? 1)) throw new Error(`${what}: カード詳細IDを ${v.詳細数 ?? 1} 件に決められない（見出し: ${headers.join(" / ")}）`);
  return { カードID: m[1], カード詳細ID: ids[0], カード詳細IDs: ids };
}

/** 索引に載せる商品1件の定め（値はすべて実際に入れる値。実行の印は呼ぶ側で付ける） */
export type 索引の商品 = {
  商品コード: string;
  商品名: string;
  /** グッズ商品CSVの検索ワード */
  検索ワード?: string;
  言語?: "日本語" | "英語" | "その他";
  /** 商品公開ステータス（省略は公開）・支店の商品公開ステータス（省略は公開） */
  本店?: "公開" | "非公開";
  支店?: "公開" | "非公開";
  /** 基準価格・販売価格（省略は 1000） */
  価格?: string;
  /** 商品カテゴリ(ID)（省略はサプライ・グッズ） */
  カテゴリID?: string;
  タグID?: string;
  カード?: カードの属性;
  /** 既に登録したカードの詳細情報を「カード指定 >」で紐づける（同じカードの商品を何件も作るとき。カード とは同時に使わない） */
  既存のカード?: { カード名: string; カード詳細ID: string; カードID: string };
  /** 商品登録編集画面のカードセット（選択肢の値＝カードセットID） */
  カードセットID?: string;
  セール?: boolean;
  高額商品コード?: string;
  在庫?: Partial<Record<店, number>>;
};
export type 作った索引の商品 = { 商品ID: string; 商品規格ID: string; カードID?: string; カード詳細ID?: string };

/** 規格の公開（部門が未選択なら先頭）・セール・高額商品コードを入れて「商品規格を登録」する */
async function 規格を公開する(page: Page, productId: string, classId: string, v: { セール?: boolean; 高額商品コード?: string }, what: string, issue: Issue): Promise<void> {
  await page.goto(adminUrl(`/product/product/class/${productId}/edit/${classId}`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form");
  await expect(form, `${what}: 商品規格登録編集画面`).toBeVisible();
  const smaregi = form.locator('input[name="admin_product_class[smaregi_alignment_flg]"]:checked');
  if ((await smaregi.count()) === 1 && (await smaregi.getAttribute("value")) !== "0") {
    throw new Error(`${what}: スマレジ連携フラグが「連携する」になっている。保存すると外部のスマレジへ送られるので止める`);
  }
  const section = form.locator("#admin_product_class_Section");
  if (!(await section.inputValue())) issue(`${what}: 部門は選択肢の先頭の「${await 先頭を選ぶ(section, `${what}: 部門`)}」を選んだ`);
  if (v.高額商品コード !== undefined) await form.locator("#admin_product_class_high_price_code").fill(v.高額商品コード);
  if (v.セール !== undefined) await form.locator("#admin_product_class_sale_flg").setChecked(v.セール);
  await chooseByLabel(form.locator("#admin_product_class_Status"), "公開");
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.getByRole("button", { name: "商品規格を登録", exact: true }).click()]);
  for (const w of await expectSaved(page, `${what}: 商品規格の登録`)) issue(`${what}: 警告「${w}」`);
  await expect(form.locator("#admin_product_class_Status option:checked"), `${what}: 登録後の公開ステータス`).toHaveText(/^\s*公開\s*$/);
  if (v.セール !== undefined) await expect(form.locator("#admin_product_class_sale_flg"), `${what}: 登録後のセールフラグ`).toBeChecked({ checked: v.セール });
}

/**
 * 商品をまとめて作る（カードの登録 → グッズ商品CSV登録1回 → 商品ごとのカード指定と規格の公開 → 店舗ごとの入庫と承認）。
 * 商品コード → 作った商品 を返す。
 */
export async function 索引の商品を作る(browser: Browser, what: string, items: 索引の商品[], issue: Issue): Promise<Map<string, 作った索引の商品>> {
  const made = new Map<string, 作った索引の商品>();
  if (items.length === 0) return made;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const cards = new Map<string, { カードID: string; カード詳細ID: string; カード詳細IDs: string[] }>();
    for (const it of items) {
      if (it.カード) cards.set(it.商品コード, await 属性つきカードを登録する(page, it.カード, `${what}: ${it.商品コード} のカード`, issue));
    }
    const goodsRoot = await readGoodsRootCategoryId(page);
    const needOther = items.some((i) => i.言語 && i.言語 !== "日本語");
    const langs = needOther ? await readLanguageIds(page) : null;
    if (langs && items.some((i) => i.言語 === "その他")) issue(`${what}: 言語「その他」（日本語・英語以外）は、商品規格の言語の選択肢の「${langs.その他言語.label}」（ID ${langs.その他言語.id}）にした`);
    const langId = (l?: 索引の商品["言語"]) => (!l || l === "日本語" ? undefined : l === "英語" ? langs!.英語 : langs!.その他言語.id);
    await registerGoodsCsv(page, {
      what: `${what}: グッズ商品CSV登録（${items.length}件）`, fileName: `${what.replace(/[^0-9A-Za-z-]/g, "").toLowerCase() || "f03"}-${RUN_MARK}-${Date.now()}.csv`,
      categoryId: goodsRoot,
      common: { "基準価格": "1000", "販売価格": "1000", "買取価格": "100", "原価単価": "10", "地域別販売制限": "0", "スマレジ連携フラグ": "0" },
      lines: items.map((it) => ({
        code: it.商品コード, nameJp: it.商品名, nameEn: it.商品名,
        productStatus: it.本店 ?? "公開", branchStatus: it.支店 ?? "公開",
        values: {
          ...(it.価格 ? { "基準価格": it.価格, "販売価格": it.価格 } : {}),
          ...(it.カテゴリID ? { "商品カテゴリ(ID)": it.カテゴリID } : {}),
          ...(langId(it.言語) ? { "言語(ID)": langId(it.言語)! } : {}),
          ...(it.検索ワード !== undefined ? { "検索ワード": it.検索ワード } : {}),
          ...(it.タグID ? { "タグ(ID)": it.タグID } : {}),
        },
      })),
      onWarning: (w) => issue(`${what}: グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 180_000,
    });
    issue(`${what}: グッズ商品CSVの購入グループ名称は既存の購入グループ、そのほか正本が定めない列（買取価格100・原価単価10・サイズ1・重量1）は試験用の値を入れた`);
    for (const it of items) {
      const productId = await openProductEditByCode(page, it.商品コード);
      const card = cards.get(it.商品コード) ?? it.既存のカード;
      if (card) {
        await assignCardOnProductEdit(page, {
          productId, cardNameJp: it.カード?.カード名 ?? it.既存のカード!.カード名, cardDetailId: card.カード詳細ID, productNameJp: it.商品名, productNameEn: it.商品名,
        }, (m) => issue(`${what}: ${it.商品コード}: ${m}`));
      }
      if (it.カードセットID) await 商品のカードセットを選ぶ(page, productId, it.カードセットID, `${what}: ${it.商品コード}`, issue);
      // 取込で作られた規格（状態ニアミント）を選ぶ（シード表: 「状態ニアミント・日本語の規格（取り込みで作られた規格）の行を開き」）
      const rows = await classRowsFromProductEdit(page, productId);
      const nm = rows.filter((r) => r.状態 === "NM" || r.状態.includes("ニアミント"));
      if (nm.length !== 1) throw new Error(`${what}: ${it.商品コード} の取込で作られたニアミントの商品規格が1件に決まらない: ${JSON.stringify(rows)}`);
      // 取込で公開になっていて、セール・高額商品コードも入れないなら、保存し直さない（時間を減らす）
      if (nm[0].公開状態 !== "公開" || it.セール !== undefined || it.高額商品コード !== undefined) await 規格を公開する(page, productId, nm[0].商品規格ID, { セール: it.セール, 高額商品コード: it.高額商品コード }, `${what}: ${it.商品コード}`, issue);
      made.set(it.商品コード, { 商品ID: productId, 商品規格ID: nm[0].商品規格ID, ...(card ? { カードID: card.カードID, カード詳細ID: card.カード詳細ID } : {}) });
    }
  });
  const stock = items.flatMap((it) => (Object.entries(it.在庫 ?? {}) as [店, number][]).filter(([, n]) => n > 0).map(([s, n]) => ({ 商品コード: it.商品コード, 店舗: s, 数: n })));
  await 店舗に入庫する(browser, stock, what, issue);
  return made;
}

/**
 * 店舗ごとに、在庫検索一覧から EC-CUBE の在庫の在庫編集を開いて「入庫/その他」で入庫を申請し、登録者と別の管理者が在庫編集承認一覧で承認する。
 * 承認一覧は前の実行の未承認の行が溜まって今回の行が後ろのページに回るので、今回の在庫編集の番号で絞り込んで開く（F04 と同じ）。
 */
export async function 店舗に入庫する(browser: Browser, items: { 商品コード: string; 店舗: 店; 数: number }[], what: string, issue: Issue): Promise<void> {
  if (items.length === 0) return;
  await 大阪の管理者を用意する(browser);
  const 本店 = await 本店の店名(browser);
  const shopName = (s: 店) => (s === "本店" ? 本店 : 大阪の店名);
  const baseline = 在庫承認の最大ID();
  const registrant = await withAdminSession(browser, F04大阪登録者.account, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const it of items) {
      const stock = await searchStockByCode(page, { 商品コード: it.商品コード, 店舗: shopName(it.店舗), 在庫区分: "EC-CUBE" });
      await stock.openEdit(stock.row(it.商品コード, shopName(it.店舗), "EC-CUBE"));
      await registerStockEdit(page, {
        changeType: "入庫/その他", reason: "結合試験", quantity: String(it.数), purchasePrice: "0", approverName: F04大阪承認者.名前,
      }, `${what}: ${it.商品コード}（${it.店舗}）の在庫編集`, issue);
    }
    return loggedInMemberName(page);
  });
  await withAdminSession(browser, F04大阪承認者.account, async (ap) => {
    ap.setDefaultTimeout(60_000);
    const list = new StockApprovalListPage(ap);
    const srcs = 未承認の在庫編集ID(baseline, items.map((i) => i.商品コード));
    if (srcs.length !== items.length) throw new Error(`${what}: 今回の在庫編集の未承認の行が ${srcs.length} 件（${items.length} 件のはず）`);
    for (const src of srcs) {
      await ap.goto(adminUrl(`/product/stock/approval_list?id=${src}`), { timeout: 60_000 });
      await ap.waitForLoadState("load");
      const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === registrant && Number(r.id) > baseline);
      if (rows.length !== 1) throw new Error(`${what}: 在庫編集ID ${src} で絞り込んだ在庫編集承認一覧に、未承認の行が ${rows.length} 件（1件のはず）`);
      try {
        await list.approve([rows[0].id], `${what}: 在庫編集の承認`, issue);
      } catch (e) {
        if (!String(e).includes("成功メッセージ")) throw e;
        await ap.goto(adminUrl(`/product/stock/approval_list?id=${src}`), { timeout: 60_000 });
        const remain = (await list.rowValues()).filter((r) => r.id === rows[0].id && r.status === "未承認");
        if (remain.length) throw e;
        issue(`${what}: 承認の成功の表示は出なかったが、承認一覧の該当の行は未承認でなくなった`);
      }
    }
  });
  issue(`${what}: 在庫は ${items.map((i) => `${i.商品コード}（${i.店舗}）${i.数}`).join("、")} を入庫し、別の管理者が承認した（在庫変動理由「結合試験」・仕入単価0）`);
}

/** 商品登録編集画面でカードセットを選び（割引率が未選択なら先頭）、「商品を登録」を押す */
export async function 商品のカードセットを選ぶ(page: Page, productId: string, cardsetId: string, what: string, issue: Issue): Promise<void> {
  await page.goto(adminUrl(`/product/product/${productId}/edit`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  await expect(form, `${what}: 商品登録編集画面`).toBeVisible();
  const discount = form.locator('select[name="admin_product[Discount]"]');
  if ((await discount.count()) && !(await discount.inputValue())) issue(`${what}: 割引率は選択肢の先頭の「${await 先頭を選ぶ(discount, `${what}: 割引率`)}」を選んだ`);
  const sel = form.locator('select[name="admin_product[Cardset]"]');
  await expect(sel, `${what}: カードセットの欄`).toHaveCount(1);
  // 画面の部品（select2）が元の選択欄を隠すことがあるので、元の選択欄を直接選ぶ
  await sel.selectOption(cardsetId, { force: true });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    form.locator('button[type="submit"]').filter({ hasText: /^\s*商品を登録\s*$/ }).click(),
  ]);
  for (const w of await expectSaved(page, `${what}: カードセットの登録`)) issue(`${what}: 警告「${w}」`);
  await expect(page.locator('form#form1 select[name="admin_product[Cardset]"]'), `${what}: 保存後のカードセット`).toHaveValue(cardsetId);
}

/** カードセット詳細(登録)画面でカードセットを登録し、カードセットIDを返す（名前・略称・リリース日は呼ぶ側が決める） */
export async function カードセットを登録する(page: Page, v: { 名: string; 略称: string; リリース日: string }, what: string): Promise<string> {
  const p = new CardsetDetailPage(page);
  await p.登録画面を開く();
  await p.入力する({ 名日: v.名, 名英: v.名, 略称: v.略称, リリース日: v.リリース日 });
  return p.登録して控える(what);
}

/** MTGマスターデータ管理のイラストレーターに、英語名の行があれば使い、無ければ足す（日本語名も同じ名前）。IDを返す */
export async function イラストレーターを用意する(page: Page, 名: string, what: string, issue: Issue): Promise<string> {
  const m = new MtgMasterPage(page);
  await m.open("illustrator");
  const hit = (await m.rows()).filter((r) => r.英語名 === 名);
  if (hit.length > 1) throw new Error(`${what}: イラストレーター「${名}」が ${hit.length} 行ある（1行のはず）`);
  if (hit.length === 1) return hit[0].id;
  await m.fillNewRow({ 英語名: 名, 日本語名: 名, 並び順: await m.nextSortNo() });
  for (const w of await m.save(`${what}: イラストレーター「${名}」の登録`)) issue(w);
  await m.open("illustrator");
  const added = (await m.rows()).filter((r) => r.英語名 === 名);
  if (added.length !== 1) throw new Error(`${what}: イラストレーター「${名}」を登録して ${added.length} 行になった`);
  issue(`${what}: 共通のマスタにイラストレーター「${名}」が無かったので1行足した（次からはこれを使う）`);
  return added[0].id;
}
