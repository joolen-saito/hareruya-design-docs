/**
 * M04-21 在庫変更CSV登録の続き（-x）の画面操作。セレクタはここにだけ書く（既存の部品 m04_21_stock_change_csv.ts を使い、足りない操作だけを足した）。
 *
 * 画面の作り（アプリの在庫変更CSV登録のテンプレートで確かめたこと）:
 * - 「一括登録を実行」はファイルを選ぶまで押せない。押すと画面のスクリプトが、ファイルの形（必須・桁・範囲）を確かめ、
 *   在庫の上限・0を下回らないかを問い合わせてから送る。誤りは画面上の一覧（行ごと）に出して送らない。
 *   増減数の絶対値が100以上の行が1件でもあると確認の窓（キャンセル・右上の×・OK）を出し、OK で送る。
 * - 送ったあとは在庫変更CSV登録画面へ戻り、画面上部に成功・誤り・警告の帯を出す。
 * - 下の「在庫変更CSV登録履歴」は、取込の記録1件が1行（100行ごとに分けて記録し、ファイル名の後ろに「 (1/2)」などを付ける）。
 */
import { Download, expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel } from "./common";
import { chooseMembers } from "./m04_19_stock_change_csv";
import { downloadBytes } from "./m04_21_stock_change_csv";
import { confirmBulkApprove } from "./m04_02_rc_stock";

const form = (page: Page) => page.locator("form#upload-form");
const membersSelect = (page: Page) => form(page).locator("#admin_stock_change_csv_list_approval_notification_target_members");
const exact = (t: string) => new RegExp(`^\\s*${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`);
const 印を除く = (label: string) => label.replace(/^[^\p{L}\p{N}]+/u, "").trim();

export type 入力 = {
  /** 店舗の選択肢の値（店舗ID）と表示名。省略すると選ばない */
  店舗?: { ID: string; 店名: string };
  在庫区分?: "EC-CUBE" | "スマレジ";
  /** 在庫変動区分の表示名（先頭の印を除いた「区分/理由」の形。例: 入庫/問屋仕入） */
  在庫変動区分?: string;
  在庫変動理由?: string;
  /** 承認通知先（所属選択） */
  所属?: string;
  /** 承認通知先（メンバー選択）に選ぶメンバーの名前 */
  承認者?: string[];
};

/** 在庫変更CSV登録画面の入力欄のうち、指定したものだけを入れる（省略した欄には触れない） */
export async function 入力する(page: Page, v: 入力): Promise<void> {
  const f = form(page);
  if (v.店舗) {
    const store = f.locator("#admin_stock_change_csv_list_change_base_info");
    const option = store.locator(`option[value="${v.店舗.ID}"]`);
    await expect(option, `店舗の選択肢に店舗ID ${v.店舗.ID} がある`).toHaveCount(1);
    expect(((await option.textContent()) ?? "").trim(), `店舗ID ${v.店舗.ID} の表示名`).toBe(v.店舗.店名);
    await store.selectOption(v.店舗.ID);
    for (const name of v.承認者 ?? []) {
      await expect(membersSelect(page).locator("option").filter({ hasText: exact(name) }),
        `店舗「${v.店舗.店名}」の承認通知先の候補に「${name}」が出る`).toHaveCount(1, { timeout: 60_000 });
    }
  }
  if (v.在庫区分) {
    const zones = f.locator('input[name="admin_stock_change_csv_list[change_stock_location_id]"]');
    const labels = await zones.evaluateAll((nodes) => nodes.map((n) => (n as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? ""));
    const zi = labels.indexOf(v.在庫区分);
    if (zi < 0) throw new Error(`在庫区分「${v.在庫区分}」の選択肢が無い（ある選択肢: ${labels.join("、")}）`);
    await zones.nth(zi).check();
    await expect(zones.nth(zi), `在庫区分「${v.在庫区分}」を選んだ`).toBeChecked();
  }
  if (v.在庫変動区分) {
    const type = f.locator("#admin_stock_change_csv_list_stock_change_type_detail");
    const options = await type.locator("option").evaluateAll((nodes) => nodes
      .map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })).filter((o) => o.value));
    const hit = options.filter((o) => 印を除く(o.label) === v.在庫変動区分);
    if (hit.length !== 1) throw new Error(`在庫変動区分「${v.在庫変動区分}」が1つではない（ある選択肢: ${options.map((o) => 印を除く(o.label)).join("、")}）`);
    await type.selectOption(hit[0].value);
  }
  if (v.在庫変動理由 !== undefined) await f.locator("#admin_stock_change_csv_list_stock_change_reason").fill(v.在庫変動理由);
  if (v.所属) await chooseByLabel(f.locator("#admin_stock_change_csv_list_approval_department"), v.所属);
  if (v.承認者?.length) await chooseMembers(membersSelect(page), v.承認者);
}

/** 承認通知先（メンバー選択）の候補の名前（店舗を選んだあとの画面の問い合わせの結果） */
export async function 承認通知先の候補(page: Page): Promise<string[]> {
  return (await membersSelect(page).locator("option").allTextContents()).map((t) => t.trim()).filter(Boolean);
}

/** 承認通知先（所属選択）の候補（表示名。空の選択肢を除く） */
export async function 所属の候補(page: Page): Promise<string[]> {
  return (await form(page).locator("#admin_stock_change_csv_list_approval_department option").allTextContents()).map((t) => t.trim()).filter(Boolean);
}

/** 画面上部の帯（成功・誤り・警告）。見えているものだけ */
export async function 画面の帯(page: Page): Promise<{ 成功: string[]; 誤り: string[]; 警告: string[] }> {
  const read = async (l: Locator) => {
    const out: string[] = [];
    for (const e of await l.all()) if (await e.isVisible()) out.push((await e.innerText()).replace(/\s+/g, " ").trim());
    return [...new Set(out.filter((t) => t && t !== "デバッグモードが有効になっています。"))];
  };
  return {
    成功: await read(page.locator(".alert-success")),
    誤り: await read(page.locator(".alert-danger:not(#csv-validate-errors), .invalid-feedback, .form-error-message")),
    警告: await read(page.locator(".alert-warning")),
  };
}

/** 画面のスクリプトが出した、ファイルの誤りの一覧（行ごと） */
export async function ファイルの誤りの一覧(page: Page): Promise<string[]> {
  if (!(await page.locator("#csv-validate-errors").isVisible())) return [];
  return (await page.locator("#csv-validate-error-list li").allTextContents()).map((t) => t.trim()).filter(Boolean);
}

export type 押した結果 =
  | { 結果: "送信"; パス: string; 成功: string[]; 誤り: string[]; 警告: string[] }
  | { 結果: "画面の誤り"; 誤り: string[] }
  | { 結果: "確認の窓" }
  | { 結果: "押せない" };

/** ファイルを選ぶ（「ファイルを選択」を押してファイルを渡す） */
export async function ファイルを選ぶ(page: Page, filePath: string): Promise<void> {
  const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.locator("#file-select").click()]);
  await chooser.setFiles(filePath);
  await expect(page.locator("#admin_stock_change_csv_list_import_file_name"), "選んだファイル名が出る")
    .toHaveText(exact(filePath.split("/").pop() ?? filePath));
}

/**
 * 「一括登録を実行」を押し、画面の結果を返す（落とさない。結果を確かめるのは呼ぶ側）。
 * 送って画面が移ったら上部の帯を読む。画面のスクリプトが誤りの一覧を出したら、その文を返す。確認の窓が出たら、押さずに返す。
 * 「一括登録を実行」が押せない（ファイルを選んでいない）ときは押さずに返す。
 */
export async function 一括登録を押す(page: Page, waitMs = 180_000): Promise<押した結果> {
  const upload = page.locator("#upload-button");
  await expect(upload, "「一括登録を実行」のボタン").toBeVisible();
  if (!(await upload.isEnabled())) return { 結果: "押せない" };
  const before = page.url();
  const navigated = page.waitForNavigation({ waitUntil: "load", timeout: waitMs }).then(() => "送信" as const, () => "時間切れ" as const);
  const shownErrors = page.locator("#csv-validate-errors").waitFor({ state: "visible", timeout: waitMs }).then(() => "画面の誤り" as const, () => "時間切れ" as const);
  const shownModal = page.locator("#largeChangeConfirmModal #large-change-confirm-ok").waitFor({ state: "visible", timeout: waitMs })
    .then(() => "確認の窓" as const, () => "時間切れ" as const);
  await upload.click();
  const outcome = await Promise.race([navigated, shownErrors, shownModal]);
  if (outcome === "時間切れ") throw new Error(`「一括登録を実行」を押しても画面が移らない（${before}）`);
  if (outcome === "確認の窓") return { 結果: "確認の窓" };
  if (outcome === "画面の誤り") return { 結果: "画面の誤り", 誤り: await ファイルの誤りの一覧(page) };
  return 送ったあと(page);
}

async function 送ったあと(page: Page): Promise<押した結果> {
  await page.waitForLoadState("load");
  return { 結果: "送信", パス: new URL(page.url()).pathname, ...(await 画面の帯(page)) };
}

/** 確認の窓（増減数100以上）で、OK・キャンセル・右上の×のどれかを押す。OK は送ったあとの結果を返す */
export async function 確認の窓で押す(page: Page, ボタン: "OK" | "キャンセル" | "×", waitMs = 180_000): Promise<押した結果 | { 結果: "閉じた"; 窓が見える: boolean }> {
  const modal = page.locator("#largeChangeConfirmModal");
  await expect(modal, "確認の窓").toBeVisible();
  if (ボタン === "OK") {
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: waitMs }), modal.locator("#large-change-confirm-ok").click()]);
    return 送ったあと(page);
  }
  const button = ボタン === "×" ? modal.locator(".modal-header .btn-close") : modal.locator(".modal-footer button", { hasText: /^\s*キャンセル\s*$/ });
  await expect(button, `確認の窓の「${ボタン}」`).toHaveCount(1);
  await button.click();
  await expect(modal, "確認の窓が閉じる").toBeHidden({ timeout: 30_000 });
  await page.waitForTimeout(1500); // 閉じたあとに送られないことを見るための待ち
  return { 結果: "閉じた", 窓が見える: await modal.isVisible() };
}

/** 確認の窓の本文 */
export async function 確認の窓の文(page: Page): Promise<string> {
  return ((await page.locator("#largeChangeConfirmModal .modal-body").innerText().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
}

export type 履歴の行 = {
  記録ID: string; 承認状態: string; ファイル名: string; 店舗と在庫区分: string; 対象商品規格数: string; 合計在庫増減数: string; 合計総原価増減数: string;
  在庫変動区分: string; 登録日: string; 登録者: string; 承認日: string; 承認者: string; 行の文: string;
};

/** 在庫変更CSV登録履歴（いま表示しているページ）の、ファイル名（分けた記録の「 (1/2)」などを除いたもの）が一致する行 */
export async function 履歴の行(page: Page, ファイル名: string): Promise<履歴の行[]> {
  const rows = await page.locator('tr[id^="ex-stock-"]').evaluateAll((trs) => trs.map((tr) => {
    const td = (i: number) => (tr.querySelectorAll("td")[i]?.textContent ?? "").replace(/\s+/g, " ").trim();
    return {
      記録ID: tr.id.replace("ex-stock-", ""), 承認状態: td(0), ファイル名: td(1), 店舗と在庫区分: td(2), 対象商品規格数: td(3), 合計在庫増減数: td(4),
      合計総原価増減数: td(5), 在庫変動区分: td(6), 登録日: td(7), 登録者: td(8), 承認日: td(9), 承認者: td(10),
      行の文: (tr.textContent ?? "").replace(/\s+/g, " ").trim(),
    };
  }));
  return rows.filter((r) => r.ファイル名.replace(/\s*\(\d+\/\d+\)$/, "") === ファイル名);
}

/** 在庫変更CSV登録履歴の見出し */
export async function 履歴の見出し(page: Page): Promise<string[]> {
  return (await page.locator("#statusChangeHistory thead th").allTextContents()).map((t) => t.replace(/\s+/g, " ").trim());
}

/** 在庫変更CSV登録履歴の行（記録ID）のファイル名のリンクから、保存されたファイルをダウンロードする */
export async function 履歴のファイルを取り出す(page: Page, 記録ID: string): Promise<Buffer> {
  const link = page.locator(`tr#ex-stock-${記録ID} a`).first();
  await expect(link, `在庫変更CSV登録履歴の行（記録 ${記録ID}）のファイル名のリンク`).toBeVisible();
  const [download]: [Download, void] = await Promise.all([page.waitForEvent("download"), link.click()]);
  return downloadBytes(download);
}

// ---- 在庫編集承認一覧 ----

/** 在庫編集承認一覧画面を開く（メニューから開くのと同じ画面） */
export async function 承認一覧を開く(page: Page): Promise<void> {
  const res = await page.goto(adminUrl("/product/stock/approval_list"));
  expect(res?.status(), "在庫編集承認一覧の応答").toBe(200);
  await expect(page.locator("form#form_search_stock_approval_list"), "在庫編集承認一覧の検索欄").toBeVisible();
  await page.waitForLoadState("load");
}

/** 開いている在庫編集承認一覧画面で「検索条件をクリア」を押して、店舗（1店）を選んで「検索」を押す（開いていなければ開く） */
export async function 承認一覧を店舗で検索する(page: Page, 店名: string): Promise<void> {
  if (!new URL(page.url()).pathname.endsWith("/product/stock/approval_list")) await 承認一覧を開く(page);
  const f = page.locator("form#form_search_stock_approval_list");
  await expect(f, "在庫編集承認一覧の検索欄").toBeVisible();
  await page.waitForLoadState("load");
  await page.locator("#btn_search_clear").click();
  const select = f.locator("#admin_search_stock_approval_list_base_info");
  await expect.poll(async () => (await select.evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).length)), "検索条件をクリアで店舗の選択が外れる").toBe(0);
  const box = select.locator("xpath=following-sibling::span[contains(@class,'select2')][1]");
  await box.locator(".select2-selection").click();
  const option = page.locator(".select2-container--open .select2-results__option").filter({ hasText: exact(店名) });
  await expect(option, `店舗の候補「${店名}」は1件`).toHaveCount(1);
  await option.click();
  await page.keyboard.press("Escape");
  const chosen = await select.evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).map((o) => o.textContent?.trim() ?? ""));
  expect(chosen, "店舗の絞り込み").toEqual([店名]);
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), f.locator('button[type="submit"]').first().click()]);
  await expect(page.locator("#form_search_stock_approval_list_update"), "在庫編集承認一覧(検索結果)").toBeVisible();
}

export type 承認一覧の行 = {
  一覧ID: string; 承認状態: string; 承認対象: string; 店舗と在庫区分: string; 対象商品規格数: string; 合計在庫増減数: string; 合計総原価増減数: string;
  在庫変動区分: string; 登録日: string; 登録者: string; 承認日: string; 承認者: string; 行の文: string;
};

/** 在庫編集承認一覧(検索結果)のいまのページの行（選択欄の無い行も含む） */
export async function 承認一覧の行(page: Page): Promise<承認一覧の行[]> {
  return page.locator("#form_search_stock_approval_list_update tbody tr").filter({ has: page.locator("td:nth-child(12)") }).evaluateAll((trs) => trs.map((tr) => {
    const td = (i: number) => (tr.querySelectorAll("td")[i]?.textContent ?? "").replace(/\s+/g, " ").trim();
    const id = (tr.querySelector('input[name="approval_list_ids[]"]') as HTMLInputElement | null)?.value
      ?? (tr.querySelector("a[data-approval-list-id]") as HTMLElement | null)?.dataset.approvalListId ?? "";
    return {
      一覧ID: id, 承認状態: td(1), 承認対象: td(2), 店舗と在庫区分: td(3), 対象商品規格数: td(4), 合計在庫増減数: td(5), 合計総原価増減数: td(6),
      在庫変動区分: td(7), 登録日: td(8), 登録者: td(9), 承認日: td(10), 承認者: td(11), 行の文: (tr.textContent ?? "").replace(/\s+/g, " ").trim(),
    };
  }));
}

/** 在庫編集承認一覧(検索結果)の見出し */
export async function 承認一覧の見出し(page: Page): Promise<string[]> {
  return (await page.locator("#form_search_stock_approval_list_update thead th").allTextContents()).map((t) => t.replace(/\s+/g, " ").trim());
}

/**
 * 行（一覧ID）の承認対象のリンクを押して確認の窓を開き、明細の読み込みを待ってから「承認する」→「本当に承認してもよろしいですか？」の OK を押す。
 * 確認の文を返す。
 */
export async function 承認対象のリンクから承認する(page: Page, 一覧ID: string, what: string, onIssue: (m: string) => void): Promise<string> {
  const link = page.locator(`a.js-open-single-approval-modal[data-approval-list-id="${一覧ID}"]`);
  await expect(link, `${what}: 行（一覧 ${一覧ID}）の承認対象のリンク（確認の窓を開くもの）`).toHaveCount(1);
  await link.click();
  const modal = page.locator("#stockApprovalListConfirmModal");
  await expect(modal, `${what}: 承認の確認の窓`).toBeVisible();
  await expect(modal.locator(".js-approval-line-items-csv-link"), `${what}: 確認の窓の承認対象の明細を読み込み終えた`)
    .toHaveAttribute("aria-disabled", "false", { timeout: 120_000 });
  return confirmBulkApprove(page, what, onIssue);
}

// ---- 商品規格登録編集（シード） ----

/**
 * 商品規格登録編集画面（商品ID・商品規格ID）を開き、商品コードを書き換え、部門を選択肢の先頭にして「商品規格を登録」を押す。
 * 保存の結果の帯を返す（誤りは落とす）。
 */
export async function 規格の商品コードを変える(page: Page, 商品ID: string, 商品規格ID: string, 商品コード: string, what: string, onIssue: (m: string) => void): Promise<void> {
  const res = await page.goto(adminUrl(`/product/product/class/${商品ID}/edit/${商品規格ID}`));
  expect(res?.status(), `${what}: 商品規格登録編集画面の応答`).toBe(200);
  await page.waitForLoadState("load");
  const f = page.locator("form#form");
  await f.locator("#admin_product_class_code").fill(商品コード);
  const section = f.locator("#admin_product_class_Section");
  const first = await section.locator("option").evaluateAll((nodes) => nodes
    .map((n) => ({ value: (n as HTMLOptionElement).value, label: n.textContent?.trim() ?? "" })).find((o) => o.value));
  if (!first) throw new Error(`${what}: 部門の選択肢が無い`);
  await section.selectOption(first.value);
  onIssue(`${what}: 部門は選択肢の先頭「${first.label}」を選んだ`);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }),
    page.getByRole("button", { name: "商品規格を登録" }).click(),
  ]);
  const b = await 画面の帯(page);
  if (b.誤り.length || b.成功.length === 0) throw new Error(`${what}: 商品規格を登録できなかった（${[...b.誤り, ...b.警告].join(" / ") || "成功の表示が無い"}）`);
  for (const w of b.警告) onIssue(`${what}: ${w}`);
}
