/**
 * F05-02〜F05-04（ネット買取の検索・一覧・商品詳細）で、検索サービス（ユニサーチ）の索引に載せる商品を画面で作る操作。セレクタはここだけに書く。
 *
 * 作り方（各シード表の投入方法の型）:
 * 1. カード詳細(登録)でカードを登録する（カラー・固有色・点数で見たマナ・コスト・カードタイプ・サブタイプ・リーガリティ・詳細情報の
 *    カードセット・レアリティ・イラストレーター・Foil・フレーム）。詳細情報は複数にできる（同じカードIDの商品を作るとき）。
 * 2. グッズ商品CSV登録で商品をまとめて取り込む（言語・価格・買取価格・商品カテゴリ(ID)・タグ(ID)・検索ワード・購入グループ名称）。
 * 3. カードを指定する商品は、商品登録編集の「カード指定」でカード詳細を選んで「商品を登録」する。
 * 4. 規格: 高額商品コードは商品規格登録編集で入れる。状態をNM以外にする商品は、商品規格一覧の「新規作成」で
 *    スライトリープレイドの規格を足してから、取り込みが作ったニアミントの規格を削除する。公開でない規格は公開にする。
 * 5. 在庫は、在庫を入れる管理者が入庫し、別の管理者が承認する（pages/admin/f02_02_setup.ts）。
 *
 * 画面の作り（アプリの実ソースで確かめた）: グッズ商品CSVの「商品カテゴリ(ID)」「タグ(ID)」はカンマ区切りで複数指定できる。
 * カードの カラー・固有色 はチェックの並び、カードタイプ・サブタイプは複数選択の欄。リーガリティは行ごとにフォーマットと「使用可」「禁止」などの選択。
 */
import { Browser, expect, Locator, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../../config/env";
import { RUN_MARK } from "../../lib/run_marker";
import { adminUrl, withAdminSession } from "../../lib/session";
import { expectSaved } from "./common";
import { savePublishedClass } from "./f03_07_restock";
import { 規格を削除する, 規格を足す } from "./f03_02_seed_ops";
import { 本店の在庫を入れる } from "./f02_02_setup";
import { registerGoodsCsv } from "./m03_01_goods_register";
import { PurchaseGroupPage } from "./m03_22_purchase_group";
import { classRowsFromProductEdit, openProductEditByCode, readGoodsRootCategoryId, readLanguageIds } from "./m03_23_seed_products";
import { assignCardOnProductEdit } from "./product_card_assign";

export type Issue = (m: string) => void;

// ---------------------------------------------------------------------------
// カード
// ---------------------------------------------------------------------------

export type 索引用カードの詳細 = {
  /** カードセットの選択肢の値（カードセットID） */
  カードセットID?: string;
  /** レアリティの選択肢の表示名（省略すると基本土地以外の先頭） */
  レアリティ?: string;
  /** イラストレーターの選択肢の値（MTGマスターデータ管理の行の番号） */
  イラストレーターID?: string;
  /** Foil・フレームの選択肢の表示名（省略すると「なし」「通常」） */
  Foil?: string; フレーム?: string;
  /** カード番号（省略すると実行の印つきの重ならない番号）。カード商品CSVは商品コードをカードセットのコードとカード番号から振るので、数字だけの番号を渡す */
  カード番号?: string;
};

export type 索引用カード = {
  /** カード名(日)・(英)（実行の印つき） */
  名: string;
  点数で見たマナ?: string;
  色?: string[]; 固有色?: string[];
  /** カードタイプ: 選択肢の値（ID）か表示名 */
  カードタイプ?: { ID?: string; 名?: string }[];
  /** サブタイプの選択肢の値（ID） */
  サブタイプID?: string[];
  /** リーガリティ（フォーマットの選択肢の値・表示名のどちらか、と「使用可」「禁止」など） */
  リーガリティ?: { フォーマットID?: string; フォーマット名?: string; 種別: string }[];
  パワー?: string; タフネス?: string; 忠誠度?: string; ルールテキスト日?: string;
  詳細: 索引用カードの詳細[];
};

let cardNoSeq = 0;
const 重ならないカード番号 = () => `${RUN_MARK}${String(++cardNoSeq).padStart(3, "0")}`.slice(-16);

async function 値の空でない選択肢(select: Locator): Promise<{ value: string; label: string }[]> {
  return select.locator("option").evaluateAll((ns) => ns
    .map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })).filter((o) => o.value !== ""));
}

async function 表示名で選ぶ(select: Locator, label: string, what: string): Promise<void> {
  const hit = (await 値の空でない選択肢(select)).filter((o) => o.label === label);
  if (hit.length !== 1) throw new Error(`${what}: 選択肢に「${label}」が ${hit.length} 件（1件のはず）`);
  await select.selectOption(hit[0].value);
}

/** カード詳細(登録)でカードを登録する。カードIDと、詳細情報のカード詳細ID（入れた順）を返す */
export async function 索引用カードを登録する(page: Page, v: 索引用カード, what: string, issue: Issue): Promise<{ カードID: string; 詳細IDs: string[] }> {
  await page.goto(adminUrl("/card/new"));
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  await expect(form, `${what}: カード詳細(登録)画面`).toBeVisible();
  const f = (id: string) => form.locator(`#admin_card_${id}`);
  await f("nameJp").fill(v.名);
  await f("nameEn").fill(v.名);
  await f("cmc").fill(v.点数で見たマナ ?? "0");
  if (v.パワー !== undefined) await f("power").fill(v.パワー);
  if (v.タフネス !== undefined) await f("toughness").fill(v.タフネス);
  if (v.忠誠度 !== undefined) await f("loyalty").fill(v.忠誠度);
  if (v.ルールテキスト日 !== undefined) await f("textJp").fill(v.ルールテキスト日);
  for (const [欄, prefix, 値] of [["カラー", "admin_card_colors_", v.色], ["固有色", "admin_card_colorIdentities_", v.固有色]] as const) {
    for (const c of 値 ?? []) {
      const label = page.locator(`label[for^="${prefix}"]`).filter({ hasText: new RegExp(`^\\s*${c}\\s*$`) });
      if ((await label.count()) !== 1) throw new Error(`${what}: ${欄}に「${c}」の選択肢が ${await label.count()} 件（1件のはず）`);
      await page.locator(`#${await label.getAttribute("for")}`).check();
    }
  }
  if (v.カードタイプ?.length) {
    const sel = form.locator('select[name="admin_card[cardtypes][]"]');
    const opts = await 値の空でない選択肢(sel);
    const values = v.カードタイプ.map((t) => {
      const hit = opts.filter((o) => (t.ID ? o.value === t.ID : o.label === t.名));
      if (hit.length !== 1) throw new Error(`${what}: カードタイプの選択肢に「${t.ID ?? t.名}」が ${hit.length} 件（1件のはず）`);
      return hit[0].value;
    });
    await sel.selectOption(values);
  }
  if (v.サブタイプID?.length) await form.locator('select[name="admin_card[subtypes][]"]').selectOption(v.サブタイプID);
  for (const l of v.リーガリティ ?? []) {
    const rows = page.locator("#card-formats-container .removable-item");
    const before = await rows.count();
    await page.locator("#add-format").click();
    await expect(rows, `${what}: 「リーガリティ追加」で行が増える`).toHaveCount(before + 1);
    const row = rows.last();
    const fmt = row.locator('select[name$="[format]"]');
    if (l.フォーマットID) await fmt.selectOption(l.フォーマットID);
    else await 表示名で選ぶ(fmt, l.フォーマット名 ?? "", `${what}: リーガリティのフォーマット`);
    await row.locator("label").filter({ hasText: new RegExp(`^\\s*${l.種別}\\s*$`) }).click();
  }
  const details = page.locator("#card-details-container .detail-card");
  const chosen: string[] = [];
  for (const [i, d] of v.詳細.entries()) {
    const before = await details.count();
    await page.locator("#add-detail").click();
    await expect(details, `${what}: 「詳細情報を追加」で詳細情報の欄が増える`).toHaveCount(before + 1);
    const det = details.last();
    const sel = (name: string) => det.locator(`select[name$="[${name}]"]`);
    await det.locator('[name$="[cardNo]"]:not(select)').first().fill(d.カード番号 ?? 重ならないカード番号());
    if (v.パワー !== undefined) await det.locator('[name$="[power]"]:not(select)').first().fill(v.パワー);
    if (v.タフネス !== undefined) await det.locator('[name$="[toughness]"]:not(select)').first().fill(v.タフネス);
    if (d.カードセットID) await sel("cardset").selectOption(d.カードセットID);
    if (d.レアリティ) await 表示名で選ぶ(sel("rarity"), d.レアリティ, `${what}: 詳細情報${i + 1}のレアリティ`);
    else {
      const r = (await 値の空でない選択肢(sel("rarity"))).find((o) => o.label !== "基本土地");
      if (!r) throw new Error(`${what}: レアリティに選べる値が無い`);
      await sel("rarity").selectOption(r.value);
      chosen.push(`詳細情報${i + 1}のレアリティ「${r.label}」`);
    }
    for (const [name, 項目] of [["cardLayout", "レイアウト"], ["promotion", "プロモ種別"]] as const) {
      const first = (await 値の空でない選択肢(sel(name)))[0];
      if (!first) throw new Error(`${what}: ${項目}に選べる値が無い`);
      await sel(name).selectOption(first.value);
      if (i === 0) chosen.push(`${項目}「${first.label}」`);
    }
    if (d.イラストレーターID) await sel("illustrator").selectOption(d.イラストレーターID);
    await sel("foilFlg").selectOption({ label: d.Foil ?? "なし" });
    await sel("frameFlg").selectOption({ label: d.フレーム ?? "通常" });
  }
  if (chosen.length) issue(`${what}: シード表が値を定めない必須の項目は選択肢の先頭を選んだ（${chosen.join("・")}）`);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    form.locator('button[type="submit"]').filter({ hasText: /^\s*登録\s*$/ }).click(),
  ]);
  for (const w of await expectSaved(page, `${what}: カードの登録`)) issue(`${what}: 警告「${w}」`);
  const m = /\/card\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`${what}: カードを登録したあと、カードの編集画面へ移らない（${page.url()}）`);
  const headers = (await page.locator("#card-details-container .detail-card .detail-header strong").allInnerTexts()).map((t) => t.trim());
  const ids = headers.map((t) => /カード詳細ID:\s*(\d+)/.exec(t)?.[1]).filter((x): x is string => !!x);
  if (ids.length !== v.詳細.length) throw new Error(`${what}: カード詳細IDを ${v.詳細.length} 件に決められない（見出し: ${headers.join(" / ")}）`);
  return { カードID: m[1], 詳細IDs: ids };
}

// ---------------------------------------------------------------------------
// 商品
// ---------------------------------------------------------------------------

export type 索引用商品 = {
  /** 商品コード・商品名（実行の印つき）。商品名を省略すると商品コードと同じ */
  コード: string; 名?: string;
  言語?: "日本語" | "英語" | "その他";
  /** 基準価格・販売価格（省略すると 1000 と買取価格の大きいほう） */
  価格?: number;
  買取: number;
  /** 商品カテゴリ(ID)（省略するとサプライ・グッズ） */
  カテゴリID?: string[];
  タグID?: string[];
  検索ワード?: string;
  /** 予約商品フラグの付いた購入グループにする */
  予約?: boolean;
  /** 指定するカード（カード名(日)と、選ぶカード詳細ID） */
  カード?: { 名: string; 詳細ID: string };
  /** NM以外（スライトリープレイド）の規格にする */
  NM以外?: boolean;
  高額商品コード?: string;
  在庫?: number;
  /** 商品ID・商品規格IDを読まない（大量に作る商品。索引の件数で確かめる） */
  番号を読まない?: boolean;
  /** 英語・ニアミントの規格を足す（その規格の商品コード。基準価格・買取価格は日本語の規格と同じ） */
  英語の規格?: string;
};
export type 作った索引用商品 = { 商品ID: string; 規格ID: string; コード: string; 名: string };

type 購入グループ = { 予約でない: string; 予約: string | null };

/** 購入グループ管理の一覧の名前を、予約商品フラグの有無で分けて読む（読むだけ） */
export async function 購入グループを読む(page: Page, 予約が要る: boolean): Promise<購入グループ> {
  const g = new PurchaseGroupPage(page);
  await page.goto(adminUrl("/product/sell_group"));
  await page.waitForLoadState("load");
  const ids = await page.locator(".sell-group-master-list tbody tr td:first-child a").evaluateAll((as) => as
    .map((a) => /\/product\/sell_group\/(\d+)/.exec((a as HTMLAnchorElement).getAttribute("href") ?? "")?.[1] ?? "").filter(Boolean));
  let 予約でない = "";
  let 予約: string | null = null;
  for (const id of ids) {
    await g.openEdit(id);
    const v = await g.inputValues();
    if (v.予約商品フラグ) { if (!予約) 予約 = v.名称日; } else if (!予約でない) 予約でない = v.名称日;
    if (予約でない && (予約 || !予約が要る)) break;
  }
  if (!予約でない) throw new Error("予約商品フラグの付いていない購入グループが無い");
  return { 予約でない, 予約 };
}

const チャンク = 150;

/** 商品をまとめて作る（グッズ商品CSV→カード指定→規格→在庫）。商品コード → 作った商品 */
export async function 索引用の商品を作る(browser: Browser, what: string, defs: 索引用商品[], issue: Issue): Promise<Map<string, 作った索引用商品>> {
  const made = new Map<string, 作った索引用商品>();
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const goods = await readGoodsRootCategoryId(page);
    const lang = await readLanguageIds(page);
    const groups = await 購入グループを読む(page, defs.some((d) => d.予約));
    if (defs.some((d) => d.予約) && !groups.予約) throw new Error(`${what}: 予約商品フラグの付いた購入グループが無い（共有のマスタなので作らずに止めた）`);
    issue(`${what}: 購入グループは、予約商品でない商品に「${groups.予約でない}」${groups.予約 ? `、予約商品に「${groups.予約}」` : ""}を使った（既存の購入グループ）`);
    const 言語ID = (l?: string) => l === "英語" ? lang.英語 : l === "その他" ? lang.その他言語.id : lang.日本語;
    for (let i = 0; i < defs.length; i += チャンク) {
      const chunk = defs.slice(i, i + チャンク);
      await registerGoodsCsv(page, {
        what: `${what}: グッズ商品CSV登録（${i + 1}〜${i + chunk.length}行目）`,
        fileName: `f05-index-${Date.now()}-${i}.csv`, categoryId: goods,
        common: { "スマレジ連携フラグ": "0", "原価単価": "10", "購入グループ名称": groups.予約でない },
        lines: chunk.map((d) => {
          const 価格 = String(d.価格 ?? Math.max(1000, d.買取));
          return {
            code: d.コード, nameJp: d.名 ?? d.コード, nameEn: d.名 ?? d.コード,
            values: {
              "言語(ID)": 言語ID(d.言語), "基準価格": 価格, "販売価格": 価格, "買取価格": String(d.買取),
              ...(d.カテゴリID ? { "商品カテゴリ(ID)": d.カテゴリID.join(",") } : {}),
              ...(d.タグID ? { "タグ(ID)": d.タグID.join(",") } : {}),
              ...(d.検索ワード ? { "検索ワード": d.検索ワード } : {}),
              ...(d.予約 && groups.予約 ? { "購入グループ名称": groups.予約 } : {}),
            },
          };
        }),
        onWarning: (w) => issue(`${what}: グッズ商品CSV登録の警告「${w}」`),
        uploadWaitMs: 300_000,
      });
    }
    for (const d of defs) {
      if (d.番号を読まない) continue;
      const w = `${what}: ${d.コード}`;
      const 商品ID = await openProductEditByCode(page, d.コード);
      if (d.カード) {
        await assignCardOnProductEdit(page, { productId: 商品ID, cardNameJp: d.カード.名, cardDetailId: d.カード.詳細ID, productNameJp: d.名 ?? d.コード, productNameEn: d.名 ?? d.コード }, (m) => issue(`${w}: ${m}`));
      }
      let rows = await classRowsFromProductEdit(page, 商品ID);
      if (rows.length !== 1) throw new Error(`${w}: 取り込み直後の商品規格が1件でない（${rows.length}件）`);
      let 規格ID = rows[0].商品規格ID;
      if (d.NM以外) {
        const 言語 = d.言語 === "英語" ? "EN" : "JP";
        規格ID = await 規格を足す(page, 商品ID, { 言語, 状態: "SP", 商品コード: `${d.コード}-SP`, 基準価格: String(d.価格 ?? Math.max(1000, d.買取)), 買取価格: String(d.買取) }, `${w}: スライトリープレイドの規格`, issue);
        await 規格を削除する(page, 商品ID, rows[0].商品規格ID, `${w}: 取り込みが作ったニアミントの規格`, issue);
        issue(`${w}: 状態をNM以外にするため、スライトリープレイドの規格（商品コード ${d.コード}-SP）を足し、ニアミントの規格を削除した`);
        rows = await classRowsFromProductEdit(page, 商品ID);
      }
      const row = rows.find((r) => r.商品規格ID === 規格ID);
      if (d.高額商品コード !== undefined || (row && row.公開状態 !== "公開")) {
        await savePublishedClass(page, { productId: 商品ID, classId: 規格ID, highPriceCode: d.高額商品コード }, w, issue);
      }
      if (d.英語の規格) {
        await 規格を足す(page, 商品ID, { 言語: "EN", 状態: "NM", 商品コード: d.英語の規格, 基準価格: String(d.価格 ?? Math.max(1000, d.買取)), 買取価格: String(d.買取) }, `${w}: 英語の規格`, issue);
        issue(`${w}: 英語・ニアミントの規格（商品コード ${d.英語の規格}）を足した`);
      }
      made.set(d.コード, { 商品ID, 規格ID, コード: d.コード, 名: d.名 ?? d.コード });
    }
  });
  for (const n of [...new Set(defs.map((d) => d.在庫 ?? 0).filter((x) => x > 0))]) {
    await 本店の在庫を入れる(browser, what, defs.filter((d) => d.在庫 === n).map((d) => d.コード), n, issue);
  }
  return made;
}

/** 商品規格登録編集で買取価格だけを入れ直す（索引へ載せたあとで、表示が DB の値かを確かめるため） */
export async function 買取価格を入れ直す(browser: Browser, 商品ID: string, 規格ID: string, 買取: number, what: string, issue: Issue): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await page.goto(adminUrl(`/product/product/class/${商品ID}/edit/${規格ID}`));
    await page.waitForLoadState("load");
    const form = page.locator("form#form");
    await expect(form, `${what}: 商品規格登録編集画面`).toBeVisible();
    await form.locator("#admin_product_class_buy_price").fill(String(買取));
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.getByRole("button", { name: "商品規格を登録", exact: true }).click()]);
    for (const w of await expectSaved(page, `${what}: 買取価格の登録`)) issue(`${what}: 警告「${w}」`);
    expect((await form.locator("#admin_product_class_buy_price").inputValue()).replace(/,/g, ""), `${what}: 登録後の買取価格`).toBe(String(買取));
  });
}

/** カードセット詳細の登録で、リリース日つきのカードセットを作る（名前は実行の印つき）。カードセットIDを返す */
export async function リリース日つきのカードセットを作る(page: Page, v: { 名: string; 英名: string; 略称: string; リリース日: string }, what: string, issue: Issue): Promise<string> {
  await page.goto(adminUrl("/cardset/new"));
  await page.waitForLoadState("load");
  await page.locator("#admin_cardset_nameJp").fill(v.名);
  await page.locator("#admin_cardset_nameEn").fill(v.英名);
  await page.locator("#admin_cardset_code").fill(v.略称);
  const [y, m, d] = v.リリース日.split("-");
  const single = page.locator('input[name="admin_cardset[releaseDate]"]');
  if (await single.count()) await single.fill(v.リリース日);
  else {
    await page.locator('[name="admin_cardset[releaseDate][year]"]').selectOption(y);
    await page.locator('[name="admin_cardset[releaseDate][month]"]').selectOption(String(Number(m)));
    await page.locator('[name="admin_cardset[releaseDate][day]"]').selectOption(String(Number(d)));
  }
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.getByRole("button", { name: "登録", exact: true }).click()]);
  for (const w of await expectSaved(page, `${what}: カードセットの登録`)) issue(`${what}: 警告「${w}」`);
  const id = /\/cardset\/(\d+)\/edit/.exec(page.url())?.[1];
  if (!id) throw new Error(`${what}: カードセットを登録したあと、編集画面へ移らない（${page.url()}）`);
  return id;
}

/** マスタデータ管理で商品一覧の表示件数のマスタを開き、行（ID・名称）を読む（読むだけ。共有のマスタなので書き換えない） */
export async function 商品一覧の表示件数のマスタを読む(page: Page): Promise<{ ID: string; 名称: string }[]> {
  await page.goto(adminUrl("/setting/system/masterdata"), { timeout: 60_000 });
  const master = page.locator("#admin_system_masterdata_masterdata");
  await expect(master.locator("option", { hasText: "mtb_product_list_max" }), "マスタデータ管理に商品一覧の表示件数のマスタがある").toHaveCount(1, { timeout: 30_000 });
  await master.selectOption({ label: "mtb_product_list_max" });
  await page.locator("form#form1 button[type=submit]").click();
  await expect(page.locator("form#form2"), "商品一覧の表示件数のマスタの行の表").toBeVisible({ timeout: 30_000 });
  const out: { ID: string; 名称: string }[] = [];
  for (const tr of await page.locator("form#form2 tbody tr").all()) {
    const ID = (await tr.locator('input[name$="[id]"]').inputValue()).trim();
    const 名称 = (await tr.locator('input[name$="[name]"]').inputValue()).trim();
    if (ID || 名称) out.push({ ID, 名称 });
  }
  return out;
}
