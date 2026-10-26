/**
 * M04-32 在庫編集承認一覧の画面操作（メニュー「在庫管理」→「在庫編集承認一覧」）。セレクタはここにだけ書く。
 *
 * 画面の作り（アプリのテンプレート Stock/approval_list.twig とスクリプトで確かめたこと）:
 * - 検索欄の「承認可能な在庫のみ表示」は初期でチェックが付いている。チェックが付いている間、承認ステータス（未承認・承認済・却下済）の
 *   チェック欄は選べない（画面のスクリプトが無効にしてチェックを外す。設計書 0202 在庫編集承認一覧(検索入力) L0048 のとおり）。
 * - 店舗・登録者（メンバー選択）は select2 の複数選択。登録者（所属選択）は普通の選択欄で、選ぶとメンバーの候補を所属で絞る。
 * - 一覧の行のチェックボックスは、在庫編集・在庫一括編集・在庫変更CSV登録の未承認の行で、登録者がログイン中の管理者でないときだけ出る。
 * - 承認対象のリンク（在庫編集など）を押すと確認モーダルが開く。モーダルは開いたあと承認対象の明細を画面の裏で読み込み、読み込みが終わると
 *   明細のCSVダウンロードのボタンが押せるようになる。一括承認・一括却下でもモーダルが開く。
 * - モーダルの「却下する」「承認する」は、参照専用（チェックボックスが出ない行のリンクから開いたとき）では出ない。
 * - 「承認する」→確認の文と「OK」、「却下する」→却下理由が空でなければ確認の文と「OK」。
 */
import { Download, expect, Locator, Page } from "@playwright/test";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { adminUrl } from "../../lib/session";
import { downloadBytes } from "./m04_21_stock_change_csv";

type Issue = (message: string) => void;
const norm = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const exact = (s: string) => new RegExp(`^\\s*${escapeRe(s)}\\s*$`);

const searchForm = (page: Page) => page.locator("form#form_search_stock_approval_list");
const resultForm = (page: Page) => page.locator("form#form_search_stock_approval_list_update");
export const confirmModal = (page: Page) => page.locator("#stockApprovalListConfirmModal");

/** 画面上部のメッセージ（成功・エラー）。開発用の設定の帯は除く */
export async function topMessages(page: Page): Promise<{ 成功: string[]; エラー: string[] }> {
  const read = async (l: Locator) => (await l.allInnerTexts()).map(norm).filter((t) => t && t !== "デバッグモードが有効になっています。");
  return { 成功: await read(page.locator(".alert-success")), エラー: await read(page.locator(".alert-danger")) };
}

/** select2 の付いた複数選択の欄で、いまの選択を外してから、表示名が一致する候補を順に選ぶ */
async function chooseSelect2(page: Page, select: Locator, labels: string[], what: string): Promise<void> {
  const box = select.locator("xpath=following-sibling::span[contains(@class,'select2')][1]");
  await expect(box, `${what}の選択欄`).toBeVisible();
  for (let i = 0; i < 100 && await box.locator(".select2-selection__choice__remove").count() > 0; i++) {
    await box.locator(".select2-selection__choice__remove").first().click();
    await page.keyboard.press("Escape");
  }
  for (const label of labels) {
    // 2人目以降は、1人目を選んだあとの候補の一覧の開閉の状態に左右されないよう、一覧が開いたことを確かめ、検索欄に名前を入れて絞る（2026-10-22 の105）
    const open = page.locator(".select2-container--open .select2-results");
    for (let i = 0; i < 3 && await open.count() === 0; i++) {
      await box.locator(".select2-selection").click();
      await page.waitForTimeout(300);
    }
    await expect(open, `${what}の候補の一覧が開いた`).toHaveCount(1, { timeout: 5_000 });
    const searchField = box.locator(".select2-search__field");
    if (await searchField.count() > 0) await searchField.fill(label);
    const option = page.locator(".select2-container--open .select2-results__option").filter({ hasText: exact(label) });
    await expect(option, `${what}の候補「${label}」は1件`).toHaveCount(1);
    await option.click();
    await page.keyboard.press("Escape");
  }
  const chosen = await select.evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).map((o) => o.textContent?.trim() ?? ""));
  expect(chosen, `${what}に選んだもの`).toEqual(labels);
  // 複数選択の select2 は選んだあとも候補の一覧が開いたままになり、下の欄の操作を覆う（2026-10-22 の122）。閉じたことを確かめる
  const open = page.locator(".select2-container--open");
  for (let i = 0; i < 3 && await open.count() > 0; i++) {
    await page.keyboard.press("Escape");
    if (await open.count() > 0) await page.locator("h2.c-pageTitle__title").first().click();
  }
  await expect(open, `${what}の候補の一覧が閉じた`).toHaveCount(0, { timeout: 5_000 });
}

export type ApprovalSearch = {
  店舗: string;
  /** 「承認可能な在庫のみ表示」。undefined は初期のまま */
  承認可能のみ?: boolean;
  /** チェックを付ける承認ステータス（未承認・承認済・却下済）。undefined は触らない */
  承認ステータス?: string[];
  /** 登録者（所属選択）。undefined は選ばない */
  登録者所属?: string;
  登録者: string[];
};

/** 承認ステータスのチェック欄 */
export function statusBox(page: Page, label: string): Locator {
  return searchForm(page).locator('input[name="admin_search_stock_approval_list[approval_status][]"]').and(page.getByLabel(label, { exact: true }));
}

/** 「承認可能な在庫のみ表示」のチェック欄 */
export function filterBox(page: Page): Locator {
  return searchForm(page).locator("#admin_search_stock_approval_list_filter_approval_target");
}

/** 在庫編集承認一覧(検索入力)を開く（メニューから開くのと同じ） */
export async function openApprovalList(page: Page): Promise<void> {
  const res = await page.goto(adminUrl("/product/stock/approval_list"));
  expect(res?.status(), "在庫編集承認一覧の応答").toBe(200);
  await expect(searchForm(page), "在庫編集承認一覧の検索欄").toBeVisible();
  await page.waitForLoadState("load");
}

/**
 * 在庫編集承認一覧(検索入力)を開いて検索条件を入れ、「検索」を押す。
 * 承認ステータスのチェック欄が選べない（「承認可能な在庫のみ表示」のチェックが付いている）ときは、チェックを付けずに "選べない" を返す。
 */
export async function searchApprovalList(page: Page, v: ApprovalSearch): Promise<{ 承認ステータス: "付けた" | "選べない" | "触らない" }> {
  await openApprovalList(page);
  const form = searchForm(page);
  await chooseSelect2(page, form.locator("#admin_search_stock_approval_list_base_info"), [v.店舗], "在庫編集承認一覧の店舗");
  if (v.承認可能のみ !== undefined) await filterBox(page).setChecked(v.承認可能のみ);
  let status: "付けた" | "選べない" | "触らない" = "触らない";
  if (v.承認ステータス !== undefined) {
    const wanted = v.承認ステータス;
    const disabled = await statusBox(page, wanted[0] ?? "未承認").isDisabled();
    if (disabled) {
      status = "選べない";
    } else {
      for (const label of ["未承認", "承認済", "却下済"]) await statusBox(page, label).setChecked(wanted.includes(label));
      status = "付けた";
    }
  }
  if (v.登録者所属 !== undefined) {
    const dept = form.locator("#admin_search_stock_approval_list_registered_department");
    const hit = dept.locator("option").filter({ hasText: exact(v.登録者所属) });
    await expect(hit, `登録者（所属選択）の選択肢「${v.登録者所属}」は1つ`).toHaveCount(1);
    await dept.selectOption({ label: v.登録者所属 });
  }
  await chooseSelect2(page, form.locator("#admin_search_stock_approval_list_registered_member"), v.登録者, "登録者（メンバー選択）");
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), form.locator('button[type="submit"]').first().click()]);
  await expect(resultForm(page), "在庫編集承認一覧(検索結果)").toBeVisible();
  return { 承認ステータス: status };
}

export type ListRow = {
  index: number; id: string | null; チェックボックス: boolean; 承認状態: string; 承認対象: string; 店舗在庫区分: string; 対象商品規格数: string;
  合計在庫増減数: string; 合計総原価増減数: string; 在庫変動区分: string; 登録日: string; 登録者: string; 承認日: string; 承認者: string;
};

/** 在庫編集承認一覧(検索結果)の行（「該当なし」の行は除く） */
export async function listRows(page: Page): Promise<ListRow[]> {
  const raw = await resultForm(page).locator("table tbody tr").evaluateAll((trs) => trs.map((tr, index) => {
    const tds = Array.from(tr.querySelectorAll(":scope > td"));
    const t = (i: number) => ((tds[i] as HTMLElement | undefined)?.innerText ?? "").replace(/\s+/g, " ").trim();
    const box = tr.querySelector('input[name="approval_list_ids[]"]') as HTMLInputElement | null;
    return {
      cols: tds.length,
      row: {
        index, id: box?.value ?? (tr.querySelector("[data-approval-list-id]")?.getAttribute("data-approval-list-id") ?? null), チェックボックス: !!box,
        承認状態: t(1), 承認対象: t(2), 店舗在庫区分: t(3), 対象商品規格数: t(4), 合計在庫増減数: t(5), 合計総原価増減数: t(6), 在庫変動区分: t(7),
        登録日: t(8), 登録者: t(9), 承認日: t(10), 承認者: t(11),
      },
    };
  }));
  return raw.filter((r) => r.cols >= 12).map((r) => r.row);
}

/** 行のチェックボックスにチェックを付ける */
export async function checkRow(page: Page, row: ListRow, what: string): Promise<void> {
  if (!row.チェックボックス || !row.id) throw new Error(`${what}: 行にチェックボックスが無い: ${JSON.stringify(row)}`);
  await resultForm(page).locator(`input[name="approval_list_ids[]"][value="${row.id}"]`).check();
}

/** 確認モーダルが開き、承認対象の明細を読み込み終えるまで待つ（明細のCSVダウンロードが押せるようになる） */
export async function waitModalLoaded(page: Page): Promise<void> {
  const modal = confirmModal(page);
  await expect(modal, "確認モーダル").toBeVisible();
  await expect(modal.locator(".js-approval-line-items-csv-link"), "確認モーダルの承認対象の明細を読み込み終えた（明細のCSVダウンロードが押せる）")
    .toHaveAttribute("aria-disabled", "false", { timeout: 120_000 });
}

/** 行の承認対象のリンクを押して確認モーダルを開く */
export async function openModalFromRow(page: Page, row: ListRow): Promise<void> {
  const tr = resultForm(page).locator("table tbody tr").nth(row.index);
  const link = tr.locator("td").nth(2).locator("a");
  await expect(link, `承認対象「${row.承認対象}」のリンク`).toHaveCount(1);
  await page.waitForLoadState("load");
  await link.click();
  await waitModalLoaded(page);
}

/** 「一括承認」または「一括却下」を押して確認モーダルを開く */
export async function openBulk(page: Page, which: "一括承認" | "一括却下"): Promise<void> {
  const button = page.locator(which === "一括承認" ? "#btn_bulk_approve" : "#btn_bulk_reject");
  await expect(button, `「${which}」`).toBeVisible();
  await button.click();
  await waitModalLoaded(page);
}

/** 確認モーダルの「承認する」「却下する」ボタンが見えているか */
export async function modalButtons(page: Page): Promise<{ 承認する: boolean; 却下する: boolean }> {
  const modal = confirmModal(page);
  return {
    承認する: await modal.locator("#btn_bulk_approve_submit").isVisible(),
    却下する: await modal.locator("#btn_bulk_reject_submit").isVisible(),
  };
}

export type LineItem = Record<string, string>;

/** 確認モーダルの明細の行（見出しの文言で引ける形）。「該当なし」の行は除く */
export async function modalLineItems(page: Page): Promise<LineItem[]> {
  const table = confirmModal(page).locator("#js-approval-line-items-container table").first();
  if ((await table.count()) === 0) return [];
  const heads = (await table.locator("thead th").allInnerTexts()).map(norm);
  const rows = await table.locator("tbody tr").evaluateAll((trs) => trs.map((tr) =>
    Array.from(tr.querySelectorAll(":scope > td")).map((td) => ((td as HTMLElement).innerText ?? "").replace(/\s+/g, " ").trim())));
  return rows.filter((r) => r.length === heads.length).map((r) => Object.fromEntries(heads.map((h, i) => [h, r[i]])));
}

/** 確認モーダルの明細の見出し */
export async function modalLineHeads(page: Page): Promise<string[]> {
  return (await confirmModal(page).locator("#js-approval-line-items-container table thead th").allInnerTexts()).map(norm);
}

/** 確認モーダルの明細に出ている文（「該当なし」など） */
export async function modalLineText(page: Page): Promise<string> {
  return norm(await confirmModal(page).locator("#js-approval-line-items-container").innerText());
}

/** 確認モーダルを閉じる（右上の×） */
export async function closeModal(page: Page): Promise<void> {
  const modal = confirmModal(page);
  await modal.locator(".modal-header .btn-close").click();
  await expect(modal, "確認モーダルが閉じる").toBeHidden();
}

/** 確認モーダルの明細のCSVダウンロードを押し、ダウンロードしたCSVを行（見出し→値）にして返す */
export async function downloadModalCsv(page: Page): Promise<{ download: Download; header: string[]; rows: Record<string, string>[] }> {
  const link = confirmModal(page).locator(".js-approval-line-items-csv-link");
  await expect(link, "確認モーダルのCSVダウンロード").toHaveAttribute("aria-disabled", "false");
  const [download] = await Promise.all([page.waitForEvent("download", { timeout: 120_000 }), link.click()]);
  const text = decodeCsvBytes(await downloadBytes(download));
  const all = parseCsv(text).filter((r) => r.some((c) => c !== ""));
  const header = all[0] ?? [];
  return { download, header, rows: all.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""]))) };
}

/** 確認モーダルの「承認する」→確認の文を読み→「OK」。移った先の画面の上部のメッセージと確認の文を返す */
export async function confirmApprove(page: Page): Promise<{ 確認の文: string; メッセージ: { 成功: string[]; エラー: string[] } }> {
  const modal = confirmModal(page);
  await modal.locator("#btn_bulk_approve_submit").click();
  const body = modal.locator(".modal-body-confirm");
  await expect(body, "承認の確認の文").toBeVisible();
  const text = norm(await body.innerText());
  const ok = modal.locator('.modal-footer-confirm button[type="submit"]');
  await expect(ok, "確認の「OK」").toBeVisible();
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), ok.click()]);
  return { 確認の文: text, メッセージ: await topMessages(page) };
}

/** 確認モーダルの却下理由を入れて「却下する」→確認の文を読み→「OK」 */
export async function confirmReject(page: Page, 理由: string): Promise<{ 確認の文: string; メッセージ: { 成功: string[]; エラー: string[] } }> {
  const modal = confirmModal(page);
  await modal.locator("#rejection_reason").fill(理由);
  await modal.locator("#btn_bulk_reject_submit").click();
  const body = modal.locator(".modal-body-confirm-reject");
  await expect(body, "却下の確認の文").toBeVisible();
  const text = norm(await body.innerText());
  const ok = modal.locator('.modal-footer-confirm button[type="submit"]');
  await expect(ok, "確認の「OK」").toBeVisible();
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), ok.click()]);
  return { 確認の文: text, メッセージ: await topMessages(page) };
}

/** 数の表示（¥・カンマ・空白を除く）を数にする。「-」などは null */
export function num(text: string | undefined): number | null {
  const t = (text ?? "").replace(/[¥,\s円]/g, "");
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : null;
}

/** 承認・却下の結果を確かめる（シード用） */
export function expectDone(what: string, r: { メッセージ: { 成功: string[]; エラー: string[] } }, onIssue: Issue): void {
  if (r.メッセージ.エラー.length) throw new Error(`${what}: エラー: ${r.メッセージ.エラー.join(" / ")}`);
  if (!r.メッセージ.成功.length) throw new Error(`${what}: 成功のメッセージが出ない`);
  onIssue(`${what}: 「${r.メッセージ.成功.join(" / ")}」`);
}

// ---- 試験用メール受信環境（手元の mailcatcher） ----

export type Mail = { id: number; recipients: string[]; subject: string; created_at: string };

/** 受信メールの一覧 */
export async function mails(mailUrl: string): Promise<Mail[]> {
  const res = await fetch(`${mailUrl}/messages`);
  if (!res.ok) throw new Error(`試験用メール受信環境の一覧を読めない（応答 ${res.status}）`);
  return (await res.json()) as Mail[];
}

/** 宛先が address の受信メール */
export async function mailsTo(mailUrl: string, address: string): Promise<Mail[]> {
  return (await mails(mailUrl)).filter((m) => m.recipients.some((r) => r.replace(/[<>]/g, "").trim() === address));
}

/** 宛先が address の受信メールを1通ずつ削除する（ほかの宛先のメールは消さない） */
export async function deleteMailsTo(mailUrl: string, address: string): Promise<number> {
  const list = await mailsTo(mailUrl, address);
  for (const m of list) {
    const res = await fetch(`${mailUrl}/messages/${m.id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) throw new Error(`試験用メール受信環境のメール ${m.id} を削除できない（応答 ${res.status}）`);
  }
  return list.length;
}
