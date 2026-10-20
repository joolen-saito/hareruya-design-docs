/**
 * M04-19 のシードで使う、在庫変更CSV登録（メニュー「在庫管理」の在庫変更CSV登録の画面）。
 * 画面の作り（アプリの在庫変更CSV登録のテンプレートとフォームの型で確かめた）:
 * - 店舗を選ぶと、承認通知先のメンバーの選択肢が、その店舗に承認の権限を持つメンバーに入れ替わる（画面のスクリプトが問い合わせる）。
 * - 「ファイルを選択」を押してファイルを選ぶと「一括登録を実行」が押せるようになる。
 * - 「一括登録を実行」を押すと、画面のスクリプトがファイルの形と在庫の上限を確かめてから送る。誤りがあれば画面上に一覧で出して送らない。
 *   増減数が100点以上の行があるときは確認の窓が出る。
 * - 同じファイル名を1か月以内に登録していると、警告を出して登録しない。ファイル名は呼ぶ側で毎回変える。
 */
import { expect, Locator, Page } from "@playwright/test";
import { csvLine } from "../../lib/csv";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";

export type 在庫変更CSVの行 = { 商品コード: string; 在庫増減数: string; 仕入単価: string };

export type 在庫変更CSVの入力 = {
  店舗: string;
  在庫区分: "EC-CUBE" | "スマレジ";
  /** 在庫変動区分の表示名から先頭の印を除いたもの（例: 入庫/その他） */
  在庫変動区分: string;
  在庫変動理由: string;
  /** 承認通知先に選ぶメンバーの名前 */
  承認者: string;
  行: 在庫変更CSVの行[];
  ファイル名: string;
};

/** 選択肢の表示名の先頭の印（入庫・廃棄を表す絵文字）を除く */
const withoutMark = (label: string) => label.replace(/^[^\p{L}\p{N}]+/u, "").trim();

/** 画面の「ファイル形式」の表の列名（バッジの文字を除く） */
async function formatColumns(page: Page): Promise<string[]> {
  const ths = page.locator("#ex-stock_change_csv-format table th");
  await expect(ths.first(), "在庫変更CSV登録画面のファイル形式の表").toBeVisible();
  return ths.evaluateAll((nodes) => nodes.map((n) => [...n.childNodes]
    .filter((c) => c.nodeType === Node.TEXT_NODE).map((c) => c.textContent ?? "").join("").trim()));
}

/** 名前（ラベル）が一致するラジオボタン */
async function radioByLabel(group: Locator, label: string): Promise<Locator> {
  const labels = await group.evaluateAll((nodes) => nodes.map((n) => (n as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? ""));
  const i = labels.indexOf(label);
  if (i < 0) throw new Error(`選択肢「${label}」が無い（ある選択肢: ${labels.join("、")}）`);
  return group.nth(i);
}

/** 複数選択の欄で、表示名の一致する選択肢だけを選び、画面のスクリプトに知らせる（select2 で飾られた欄も中身は同じ選択欄） */
export async function chooseMembers(select: Locator, names: string[]): Promise<void> {
  for (const name of names) {
    await expect(select.locator("option").filter({ hasText: new RegExp(`^\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) }),
      `選択肢「${name}」`).toHaveCount(1);
  }
  await select.evaluate((node, want) => {
    const s = node as HTMLSelectElement;
    for (const o of Array.from(s.options)) o.selected = want.includes((o.textContent ?? "").trim());
    const w = window as unknown as { jQuery?: (e: Element) => { trigger: (ev: string) => void } };
    if (w.jQuery) w.jQuery(s).trigger("change");
    else s.dispatchEvent(new Event("change", { bubbles: true }));
  }, names);
  const chosen = await select.evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).map((o) => (o.textContent ?? "").trim()));
  expect(chosen, "選んだメンバー").toEqual(names);
}

/** 在庫変更CSV登録画面で、正本の値でCSVを作って登録する。画面の警告は onWarning に渡す */
export async function registerStockChangeCsv(page: Page, v: 在庫変更CSVの入力, what: string, onWarning: (w: string) => void): Promise<void> {
  await page.goto(adminUrl("/product/stock/change/new"));
  const form = page.locator("form#upload-form");
  await expect(form, "在庫変更CSV登録画面").toBeVisible();
  await page.waitForLoadState("load");

  // CSVの列は画面の「ファイル形式」の表の順（商品コード・在庫増減数・仕入単価）
  const columns = await formatColumns(page);
  expect(columns, "在庫変更CSVの列").toEqual(["商品コード", "在庫増減数", "仕入単価"]);
  const csv = Buffer.from([csvLine(columns), ...v.行.map((r) => csvLine([r.商品コード, r.在庫増減数, r.仕入単価]))].join("\n") + "\n", "utf8");

  // 店舗（選ぶと承認通知先の選択肢が入れ替わる）
  const members = form.locator("#admin_stock_change_csv_list_approval_notification_target_members");
  await chooseByLabel(form.locator("#admin_stock_change_csv_list_change_base_info"), v.店舗);
  await expect(members.locator("option").filter({ hasText: new RegExp(`^\\s*${v.承認者}\\s*$`) }),
    `店舗「${v.店舗}」の承認通知先に「${v.承認者}」が出る`).toHaveCount(1, { timeout: 30_000 });

  await (await radioByLabel(form.locator('input[name="admin_stock_change_csv_list[change_stock_location_id]"]'), v.在庫区分)).check();

  const type = form.locator("#admin_stock_change_csv_list_stock_change_type_detail");
  const options = await type.locator("option").evaluateAll((nodes) => nodes
    .map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })).filter((o) => o.value));
  const hit = options.filter((o) => withoutMark(o.label) === v.在庫変動区分);
  if (hit.length !== 1) throw new Error(`在庫変動区分「${v.在庫変動区分}」が1つではない（ある選択肢: ${options.map((o) => withoutMark(o.label)).join("、")}）`);
  await type.selectOption(hit[0].value);
  await form.locator("#admin_stock_change_csv_list_stock_change_reason").fill(v.在庫変動理由);

  // 承認通知先: 所属は、メンバー登録で選ぶ所属（選択肢の先頭）にそろえる。メンバーは名前で選ぶ
  const department = form.locator("#admin_stock_change_csv_list_approval_department");
  if ((await department.count()) > 0) await department.selectOption({ index: 1 });
  await chooseMembers(members, [v.承認者]);

  // 「ファイルを選択」を押してファイルを選ぶ（押したときに、選んだファイルを受け取る処理が付く）
  const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.locator("#file-select").click()]);
  await chooser.setFiles({ name: v.ファイル名, mimeType: "text/csv", buffer: csv });
  const upload = page.locator("#upload-button");
  await expect(upload, "ファイルを選ぶと「一括登録を実行」が押せる").toBeEnabled();
  await expect(upload).toHaveText(/^\s*一括登録を実行\s*$/);

  // 押すと画面のスクリプトが確かめてから送る。誤りの一覧・確認の窓・送信のどれかになる
  const navigated = page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 180_000 }).then(() => "送信" as const, () => "時間切れ" as const);
  const errors = page.locator("#csv-validate-errors");
  const shownErrors = errors.waitFor({ state: "visible", timeout: 180_000 }).then(() => "誤り" as const, () => "時間切れ" as const);
  const ok = page.locator("#largeChangeConfirmModal #large-change-confirm-ok");
  const shownModal = ok.waitFor({ state: "visible", timeout: 180_000 }).then(() => "確認" as const, () => "時間切れ" as const);
  await upload.click();
  let outcome = await Promise.race([navigated, shownErrors, shownModal]);
  if (outcome === "確認") {
    onWarning("100点以上の在庫変動の確認の窓が出たので「OK」を押した");
    await ok.click();
    outcome = await navigated;
  }
  if (outcome === "誤り") {
    const list = (await page.locator("#csv-validate-error-list li").allTextContents()).map((t) => t.trim());
    throw new Error(`${what}: 画面がCSVの誤りを出して送らなかった: ${list.join(" / ")}`);
  }
  if (outcome === "時間切れ") throw new Error(`${what}: 「一括登録を実行」を押しても画面が移らない`);
  await page.waitForLoadState("load");
  for (const w of await expectSaved(page, what)) onWarning(w);

  // 登録履歴の一覧に、このファイルの行がある
  const row = page.locator('tr[id^="ex-stock-"]').filter({ hasText: v.ファイル名 });
  await expect(row, `${what}: 在庫変更CSV登録履歴にファイル「${v.ファイル名}」の行`).toHaveCount(1);
}
