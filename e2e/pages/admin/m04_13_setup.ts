/**
 * M04-13 在庫分割結合登録編集のシードで使う、前提データの画面操作。
 * 店舗（店舗登録）・所属（マスタデータ管理）・メンバー（メンバー管理）・グッズ商品（グッズ商品CSV登録）・
 * 在庫の入庫（在庫編集と在庫編集承認一覧）を、すべて管理画面から行う。
 */
import { expect, Locator, Page } from "@playwright/test";
import { query } from "../../lib/db";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { findMemberId } from "./member";
import { registerGoodsCsv } from "./m03_01_goods_register";
import { goodsRootCategoryLink } from "./product_masters";
import { ProductSearchPage } from "./product_search";
import { StockApprovalListPage, StockEditInput, StockListPage, fillStockEdit } from "./stock_edit";
import { ensureTenant } from "./tenant";

/** 正本の呼び名と、画面に出す名前（店名・所属名は裁定 E09 で機能IDを付けた名前。M04-09・M04-08 の「試験店舗A」「試験所属A」と重ならない） */
export const 試験店舗A = "試験店舗A（M04-13）";
export const 試験所属A = "試験所属A（M04-13）";
export const 作業者名 = "M04-13作業者";
export const 承認者名 = "M04-13承認者";
export const 権限なし名 = "M04-13権限なしユーザー";
export const 連携作業者名 = "M04-13連携作業者";

export type 在庫区分 = "EC-CUBE" | "スマレジ";

/** 店舗登録で試験店舗A（M04-13）（開店）を、あれば使い、無ければ登録する */
export async function ensureStoreA(page: Page, onIssue: (m: string) => void): Promise<string> {
  return ensureTenant(page, {
    店名: 試験店舗A, 店名カナ: "シケンテンポエー", 店名英語: "Test Store A", 支店URL: "m0413a", 店名略称3文字: "試験A", ショップ名略称: 試験店舗A,
  }, onIssue);
}

/** マスタデータ管理で所属のマスタを開く。行は「ID」「名称」の2つの入力欄 */
async function openDepartmentMaster(page: Page): Promise<Locator> {
  await page.goto(adminUrl("/setting/system/masterdata"));
  const select = page.locator("form#form1 select").first();
  await expect(select, "マスタデータ管理のマスタの選択欄").toBeVisible();
  await chooseByLabel(select, "mtb_department");
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("form#form1 button[type=submit]").click()]);
  const rows = page.locator("form#form2 tbody tr");
  await expect(rows.first(), "所属のマスタの行").toBeVisible();
  return rows;
}

/** 所属のマスタの行（ID・名称）を読む */
async function departmentRows(rows: Locator): Promise<{ id: string; name: string; row: Locator }[]> {
  const out: { id: string; name: string; row: Locator }[] = [];
  for (const row of await rows.all()) {
    const inputs = row.locator("input[type=text], input:not([type])");
    if ((await inputs.count()) < 2) continue;
    out.push({ id: (await inputs.nth(0).inputValue()).trim(), name: (await inputs.nth(1).inputValue()).trim(), row });
  }
  return out;
}

/**
 * マスタデータ管理で所属のマスタを選び、名称が無ければ、空の行に「ほかの所属と重ならない番号（いまの最大の番号＋1）」と名称を入れて保存する。
 * 所属のIDを返す。
 */
export async function ensureDepartment(page: Page, name: string): Promise<string> {
  let rows = await openDepartmentMaster(page);
  const found = (await departmentRows(rows)).filter((r) => r.name === name);
  if (found.length > 1) throw new Error(`所属のマスタに名称「${name}」の行が複数ある`);
  if (found.length === 1) return found[0].id;
  const all = await departmentRows(rows);
  const empty = all.filter((r) => r.id === "" && r.name === "");
  if (empty.length !== 1) throw new Error(`所属のマスタに、追加用の空の行が1行ではない（${empty.length}行）`);
  const ids = all.map((r) => Number(r.id)).filter((n) => Number.isInteger(n) && n > 0);
  const next = String(Math.max(0, ...ids) + 1);
  const inputs = empty[0].row.locator("input[type=text], input:not([type])");
  await inputs.nth(0).fill(next);
  await inputs.nth(1).fill(name);
  await page.locator("form#form2 button[type=submit]").click();
  await expectSaved(page, `所属「${name}」の保存`);
  rows = await openDepartmentMaster(page);
  const saved = (await departmentRows(rows)).filter((r) => r.name === name);
  if (saved.length !== 1) throw new Error(`所属「${name}」を保存したが、マスタに1行として出ない`);
  return saved[0].id;
}

export type M0413Member = {
  名前: string; 所属店舗: string; 所属: string; ログインID: string; メールアドレス: string; パスワード: string;
  権限: string; デフォルト検索表示店舗: string; 編集可能店舗: string[];
};

async function fillMember(page: Page, v: M0413Member, withPassword: boolean): Promise<void> {
  const f = (name: string) => page.locator(`[name="admin_member[${name}]"]`);
  await f("name").fill(v.名前);
  await chooseByLabel(f("baseInfo"), v.所属店舗);
  await chooseByLabel(f("department"), v.所属);
  await f("login_id").fill(v.ログインID);
  await f("email").fill(v.メールアドレス);
  if (withPassword) {
    await page.locator('[name="admin_member[plain_password][first]"]').fill(v.パスワード);
    await page.locator('[name="admin_member[plain_password][second]"]').fill(v.パスワード);
  }
  await chooseByLabel(f("Authority"), v.権限);
  // デフォルト検索表示店舗の選択肢は、編集可能店舗の選択に連動して変わる
  await chooseByLabel(page.locator('[name="admin_member[editableBaseInfos][]"]'), v.編集可能店舗);
  await chooseByLabel(f("defaultSearchBaseInfo"), v.デフォルト検索表示店舗);
  await page.getByLabel("稼働", { exact: true }).check();
}

/** 登録済みのメンバーの内容を、メンバー編集画面で確かめる。違えば違う項目を挙げて落とす（同じ名前の別人を黙って使わない） */
async function expectMemberValues(page: Page, id: string, v: M0413Member): Promise<void> {
  await page.goto(adminUrl(`/setting/system/member/${id}/edit`));
  const f = (name: string) => page.locator(`[name="admin_member[${name}]"]`);
  const sel = async (name: string) => (await page.locator(`[name="admin_member[${name}]"] option:checked`).allInnerTexts()).map((t) => t.trim()).sort().join("、");
  const got: Record<string, string> = {
    名前: await f("name").inputValue(), ログインID: await f("login_id").inputValue(), メールアドレス: await f("email").inputValue(),
    所属店舗: await sel("baseInfo"), 所属: await sel("department"), 権限: await sel("Authority"),
    デフォルト検索表示店舗: await sel("defaultSearchBaseInfo"), 編集可能店舗: await sel("editableBaseInfos]["),
    稼働: (await page.getByLabel("稼働", { exact: true }).isChecked()) ? "稼働" : "非稼働",
  };
  const want: Record<string, string> = {
    名前: v.名前, ログインID: v.ログインID, メールアドレス: v.メールアドレス, 所属店舗: v.所属店舗, 所属: v.所属, 権限: v.権限,
    デフォルト検索表示店舗: v.デフォルト検索表示店舗, 編集可能店舗: [...v.編集可能店舗].sort().join("、"), 稼働: "稼働",
  };
  const diff = Object.keys(want).filter((k) => got[k] !== want[k]).map((k) => `${k}: 「${got[k]}」（求めるのは「${want[k]}」）`);
  if (diff.length) throw new Error(`メンバー「${v.名前}」（管理者ID ${id}）は登録済みだが、内容が違う: ${diff.join(" / ")}`);
}

/** メンバー管理で、あれば内容を確かめて使い、無ければ登録する（所属を選ぶ版。共通の部品は所属を先頭の選択肢に決めている） */
export async function ensureMemberWithDepartment(page: Page, v: M0413Member): Promise<string> {
  const found = await findMemberId(page, v.名前);
  if (found) {
    await expectMemberValues(page, found, v);
    return found;
  }
  await page.goto(adminUrl("/setting/system/member"));
  await page.getByRole("link", { name: "新規登録" }).click();
  await fillMember(page, v, true);
  await page.getByRole("button", { name: "登録", exact: true }).click();
  await expectSaved(page, `メンバー「${v.名前}」の登録`);
  const m = /\/member\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`メンバー「${v.名前}」を登録したが、メンバー編集画面へ遷移しない（${page.url()}）`);
  return m[1];
}

/** メンバー登録画面の「所属店舗」の選択肢（空を除く） */
export async function memberStoreChoices(page: Page): Promise<string[]> {
  await page.goto(adminUrl("/setting/system/member/new"));
  return page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((options) => options
    .map((o) => o as HTMLOptionElement).filter((o) => o.value !== "").map((o) => o.textContent?.trim() ?? "").filter(Boolean));
}

/** カテゴリ登録/編集画面の最上位の一覧で、「サプライ・グッズ」の行のIDを読む */
export async function readGoodsRootCategoryId(page: Page): Promise<string> {
  await page.goto(adminUrl("/product/category"));
  const link = goodsRootCategoryLink(page);
  await expect(link, "カテゴリの最上位に「サプライ・グッズ」が1件").toHaveCount(1);
  const m = /^ID:(\d+)/.exec(((await link.textContent()) ?? "").trim());
  if (!m) throw new Error("「サプライ・グッズ」のカテゴリIDを画面から読めない");
  return m[1];
}

/**
 * 商品マスター(検索入力)で、商品コードが完全に一致する商品の件数を数える。
 * 既定でチェックされている絞り込み（公開状態・状態・高額商品）は外す（非公開の商品を見落とさない）。
 */
export async function countProductsByCode(page: Page, code: string): Promise<number> {
  const search = new ProductSearchPage(page);
  await search.open();
  await search.ensureDetailVisible();
  for (const field of ["status", "card_condition", "expensive"]) {
    for (const option of await search.choiceOptions(field)) {
      if (option.checked) await search.setChecked(field, option.value, false);
    }
  }
  await search.field("product_code").fill(code);
  await search.submitAndWaitForResult();
  const codes = await page.locator('tr[id^="ex-product-"] td:nth-child(4)').allInnerTexts();
  return codes.map((c) => c.trim()).filter((c) => c === code).length;
}

/** 1行のグッズ商品。省いた列は、M03-01 のグッズ商品CSVの共通の値（基準価格100・買取価格10 など） */
export type GoodsSpec = { code: string; name?: string; standardPrice?: number; buyPrice?: number };

/** グッズ商品CSV登録で、商品IDを空にした行をまとめて登録する（確認モーダルは、いまの実装には無い） */
export async function registerGoods(page: Page, what: string, categoryId: string, goods: GoodsSpec[], onWarning: (w: string) => void): Promise<void> {
  await registerGoodsCsv(page, {
    what, fileName: "m04-13-goods.csv", categoryId, onWarning,
    uploadWaitMs: goods.length > 50 ? 600_000 : undefined,
    lines: goods.map((g) => {
      const name = g.name ?? `M04-13 ${g.code}`;
      const values: Record<string, string> = {};
      if (g.standardPrice !== undefined) values["基準価格"] = String(g.standardPrice);
      if (g.buyPrice !== undefined) {
        values["買取価格"] = String(g.buyPrice);
        // 販売価格は正本が「任意の有効な値」とする列。取込は買取価格が販売価格を上回る行を拒む（「販売価格は買取価格より大きい価格を設定してください」）。
        // 共通の値（100）のままだと、買取価格200・300の行が拒まれる（027 のシードで起きた）ので、買取価格・基準価格を下回らない値にする
        values["販売価格"] = String(Math.max(100, g.buyPrice, g.standardPrice ?? 0));
      }
      return { code: g.code, nameJp: name, nameEn: name, values };
    }),
  });
}

/**
 * 在庫検索一覧を開き、店舗・在庫区分・商品コードを指定して検索する。
 * 店舗は複数選択の欄で、初期値はログイン中のメンバーの既定の検索店舗。指定の店舗だけにする。
 */
export async function searchStockList(page: Page, v: { store: string; zone: 在庫区分 | null; code: string }): Promise<void> {
  await page.goto(adminUrl("/product/stock"));
  const form = page.locator("form#searchStockListForm");
  await expect(form, "在庫検索一覧の検索欄").toBeVisible();
  await page.waitForLoadState("load");
  const box = form.locator("#admin_search_stock_list_base_info + span.select2");
  for (let i = 0; i < 50 && await box.locator(".select2-selection__choice__remove").count() > 0; i++) {
    await box.locator(".select2-selection__choice__remove").first().click();
    await page.keyboard.press("Escape");
  }
  await box.locator(".select2-selection").click();
  const option = page.locator(".select2-container--open .select2-results__option").filter({ hasText: new RegExp(`^\\s*${v.store}\\s*$`) });
  await expect(option, `店舗の候補「${v.store}」`).toHaveCount(1);
  await option.click();
  await page.keyboard.press("Escape");
  const chosen = await form.locator("#admin_search_stock_list_base_info").evaluate((n) =>
    Array.from((n as HTMLSelectElement).selectedOptions).map((o) => o.textContent?.trim() ?? ""));
  expect(chosen, "在庫検索一覧の店舗の指定").toEqual([v.store]);
  for (const zone of ["EC-CUBE", "スマレジ"] as const) {
    const zoneBox = form.locator(".form-check")
      .filter({ has: page.locator('input[name="admin_search_stock_list[stock_zone][]"]') })
      .filter({ has: page.locator("label", { hasText: new RegExp(`^\\s*${zone}\\s*$`) }) })
      .locator('input[name="admin_search_stock_list[stock_zone][]"]');
    await expect(zoneBox, `在庫区分「${zone}」のチェック欄`).toHaveCount(1);
    await zoneBox.setChecked(v.zone === zone);
  }
  await form.locator("#admin_search_stock_list_product_code").fill(v.code);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    form.locator('button[type="submit"]').filter({ hasText: "検索" }).click(),
  ]);
}

/** 在庫検索一覧の、商品コード・店舗・在庫区分が一致する行 */
export function stockRow(page: Page, code: string, store: string, zone: 在庫区分): Locator {
  return new StockListPage(page).row(code, store, zone);
}

/** 在庫検索一覧の行の在庫と総原価（表示のまま） */
export async function stockRowValues(row: Locator): Promise<{ 在庫: string; 総原価: string; 店舗: string; 在庫区分: string }> {
  await expect(row, "在庫検索一覧の対象の行は1件").toHaveCount(1);
  const stock = row.locator("td.col-stock > div");
  const shop = row.locator("td.col-shop > div");
  return {
    在庫: (await stock.nth(0).innerText()).trim(), 総原価: (await stock.nth(1).innerText()).trim(),
    店舗: (await shop.nth(0).innerText()).trim(), 在庫区分: (await shop.nth(1).innerText()).trim(),
  };
}

export type StockIn = { code: string; zone: 在庫区分; quantity: number; unitPrice: number };

/**
 * 在庫検索一覧で店舗を試験店舗A（M04-13）・在庫区分を指定して商品コードで検索し、商品名のリンクから在庫編集画面を開き、
 * 在庫変動区分「入庫/その他」・在庫変動理由「試験データ準備」・在庫増減数と仕入単価・承認通知先に承認するメンバーを入れて登録する。
 */
export async function registerStockIns(page: Page, ins: StockIn[], approverName: string, onWarning: (w: string) => void): Promise<void> {
  for (const s of ins) {
    await searchStockList(page, { store: 試験店舗A, zone: s.zone, code: s.code });
    await new StockListPage(page).openEdit(stockRow(page, s.code, 試験店舗A, s.zone));
    await registerStockEditAndWait(page, {
      changeType: "入庫/その他", reason: "試験データ準備", quantity: String(s.quantity), purchasePrice: String(s.unitPrice), approverName,
    }, `${s.code}（${s.zone}）の在庫編集（${s.quantity}・仕入単価${s.unitPrice}）`, onWarning);
  }
}

/**
 * 在庫編集の入力（共通の部品の fillStockEdit）と「登録する」。登録の要求のあと画面が読み込み直されるのを待ってから、成功メッセージを確かめる。
 * 共通の部品（stock_edit.ts の registerStockEdit）は、押したあと画面の移り変わりを待たずに確かめるので、
 * 移る前の画面（どの画面にも出る開発用の帯）を見て確かめを終えることがある。共通の部品は変えられないので、この機能の局所の部品にした。
 */
async function registerStockEditAndWait(page: Page, v: StockEditInput, what: string, onWarning: (w: string) => void): Promise<void> {
  await fillStockEdit(page, v);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }),
    page.locator('button[type="submit"][form="stock_approval_form"]').click(),
  ]);
  for (const warning of await expectSaved(page, what)) onWarning(warning);
}

/**
 * 登録者とは別の、試験店舗A（M04-13）を承認できるメンバーで、在庫編集承認一覧(検索結果)の未承認の行を承認する。
 * 一覧には商品コードが出ず、並びは「未承認が上・登録日の古い順」なので、前の実行で残った未承認の行が1ページ目を埋めると、
 * いま登録した行は後ろのページに回る。以前は1ページ目から登録者・店舗/在庫区分・増減数だけで行を選んでいて、別の商品の古い行を
 * 承認し、自分の商品の在庫が0のままになった（2026-10-27 夜からの M04-13 の在庫分割のシードの止まり）。
 * いまは、商品コードの未承認の入庫の在庫編集IDをDBの参照で読み、在庫編集承認一覧をそのID（画面のほかの画面からのリンクと
 * 同じ ?id= の入口）で絞り込んで開き、出た1行が登録者・店舗/在庫区分・在庫変動区分・増減数と合うことを画面で確かめてから承認する。
 */
export async function approveStockIns(page: Page, ins: StockIn[], registrantName: string, onIssue: (m: string) => void): Promise<void> {
  const list = new StockApprovalListPage(page);
  for (const s of ins) {
    const what = `${s.code}（${s.zone}）の在庫編集（${s.quantity}）`;
    const found = query(
      `select a.history_source_id::text as src
         from dtb_stock_approval_list a
         join dtb_stock_history sh on sh.history_source_id = a.history_source_id and sh.history_source_type = a.history_source_type_id
         join dtb_product_stock ps on ps.id = sh.product_stock_id
         join dtb_product_class pc on pc.id = ps.product_class_id
         join dtb_base_info bi on bi.id = a.base_info_id
        where pc.product_code = $1 and bi.shop_name = $2 and sh.stock_change_quantity = $3::int and a.approval_status = 1
        order by a.id desc`,
      [s.code, 試験店舗A, s.quantity]);
    if (found.length === 0) throw new Error(`${what}の未承認の行がDBに無い`);
    if (found.length > 1) onIssue(`${what}の未承認の行が${found.length}件あり、いちばん新しいものを承認した`);
    await page.goto(adminUrl(`/product/stock/approval_list?id=${found[0].src}`));
    await expect(page.locator("#form_search_stock_approval_list_update"), "在庫編集承認一覧の結果").toBeVisible();
    await page.waitForLoadState("load");
    const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === registrantName
      && r.shop.startsWith(試験店舗A) && r.shop.endsWith(s.zone) && r.changeType.endsWith("入庫/その他")
      && r.quantity.replace(/,/g, "") === String(s.quantity));
    if (rows.length !== 1) throw new Error(`${what}: 在庫編集ID ${found[0].src} で絞り込んだ在庫編集承認一覧に、合う未承認の行が ${rows.length} 件（1件のはず）`);
    await approveRowsAndWait(page, [rows[0].id], `${what}の承認`, onIssue);
  }
}

/**
 * 在庫編集承認一覧で行を選び「一括承認」→（確認のモーダルの明細の読み込みを待つ）→「承認する」→「OK」を押し、
 * 承認の要求のあと一覧の画面が読み込み直されるのを待ってから、成功メッセージを確かめる。
 * 共通の部品（stock_edit.ts の StockApprovalListPage.approve）は、明細の読み込みを待たずに「OK」を押し、画面の移り変わりも待たずに確かめる。
 * M04-13 の016・017 のシードで、承認そのものは済んだのに、一覧に成功メッセージが出ずに落ちた（下の説明）。
 * 共通の部品は変えられないので、この機能の局所の部品にした。
 */
async function approveRowsAndWait(page: Page, ids: string[], what: string, onWarning: (w: string) => void): Promise<void> {
  for (const id of ids) await page.locator(`#form_search_stock_approval_list_update input[name="approval_list_ids[]"][value="${id}"]`).check();
  const bulk = page.locator("#btn_bulk_approve");
  await expect(bulk, "「一括承認」").toBeVisible();
  // 確認のモーダルは開くときに明細の読み込みの要求を送る。読み込みが終わる前に「OK」で承認を送ると、明細の読み込みの要求が
  // 終わるときにログイン中のセッションを書き戻し、承認の要求が置いた成功メッセージが消える（016・017 のシードで、承認は済んだのに
  // 一覧に成功メッセージが出なかった。どちらも明細の読み込みが承認の要求より後に終わっていた）。人の操作と同じく、明細が読み込まれてから押す
  const lineItems = page.waitForResponse((r) => r.request().method() === "POST" && /\/approval_list\/line_items$/.test(new URL(r.url()).pathname), { timeout: 180_000 });
  await bulk.click();
  const modal = page.locator("#stockApprovalListConfirmModal");
  await expect(modal, "承認の確認").toBeVisible();
  const items = await lineItems;
  if (items.status() !== 200) throw new Error(`${what}: 確認のモーダルの明細の読み込みの応答が ${items.status()}`);
  await page.waitForTimeout(500);
  await modal.locator("#btn_bulk_approve_submit").click();
  const ok = modal.locator('.modal-footer-confirm button[type="submit"]');
  await expect(ok, "最終確認の「OK」").toBeVisible();
  const updated = page.waitForResponse((r) => r.request().method() === "POST" && /\/approval_list\/updated$/.test(new URL(r.url()).pathname), { timeout: 180_000 });
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), ok.click()]);
  const res = await updated;
  if (res.status() !== 302) throw new Error(`${what}: 承認の要求の応答が ${res.status()}（一覧へ戻る302ではない）`);
  for (const warning of await expectSaved(page, what)) onWarning(warning);
}

/** 在庫検索一覧で、店舗・在庫区分・商品コードの行の在庫・総原価が求める値であること（シードの出来上がりの確かめ） */
export async function expectStock(page: Page, code: string, zone: 在庫区分, stock: number, totalCost: number, what: string): Promise<void> {
  await searchStockList(page, { store: 試験店舗A, zone, code });
  const v = await stockRowValues(stockRow(page, code, 試験店舗A, zone));
  expect({ 在庫: v.在庫, 総原価: v.総原価 }, `${what}: ${code}（${zone}）の在庫と総原価`).toEqual({ 在庫: stock.toLocaleString("en-US"), 総原価: totalCost.toLocaleString("en-US") });
}

/** メンバーの名前を、メンバー管理の一覧で確かめる（いなければ落とす） */
export async function expectMemberExists(page: Page, name: string): Promise<string> {
  const id = await findMemberId(page, name);
  if (!id) throw new Error(`メンバー「${name}」がメンバー管理の一覧にいない`);
  return id;
}
