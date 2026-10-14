import { Locator, Page, expect } from "@playwright/test";

const texts = async (l: Locator): Promise<string[]> => {
  const out: string[] = [];
  for (const e of await l.all()) if (await e.isVisible()) out.push((await e.innerText()).replace(/\s+/g, " ").trim());
  return [...new Set(out.filter(Boolean))];
};

/** 開発用の設定のときに、どの画面にも常に出る帯。保存の結果ではないので、入力エラーとして数えない */
const ENV_BANNERS = ["デバッグモードが有効になっています。"];

/**
 * 登録・更新の送信後、画面上部の成功メッセージが表示されたことを確かめる。
 * 入力エラー・エラーメッセージが見えていたら、成功メッセージが出ていても落とす。
 * 成功メッセージと一緒に警告（黄色の帯）が出ていたら、その文を返す（呼び出し側が報告に載せる）。
 * 送信の前に画面を開き直している（前の送信の成功メッセージが残っていない）ことが前提。
 */
export async function expectSaved(page: Page, what: string): Promise<string[]> {
  const ok = page.locator(".alert-success");
  const ng = page.locator(".alert-danger, .invalid-feedback, .form-error-message");
  const sys = page.getByText("システムエラーが発生しました");
  await expect(ok.or(ng).or(sys).first(), `${what}: 保存の結果が表示されない`).toBeVisible();
  if (await sys.first().isVisible()) throw new Error(`${what}: システムエラーの画面になった`);
  const errors = (await texts(ng)).filter((t) => !ENV_BANNERS.includes(t));
  if (errors.length) throw new Error(`${what}: 保存できなかった: ${errors.join(" / ")}`);
  if ((await texts(ok)).length === 0) throw new Error(`${what}: 成功メッセージが表示されない`);
  return texts(page.locator(".alert-warning"));
}

/** 利用者が操作できる状態（表示されていて、無効でない）であること。操作できない項目を、試験だけが動かしてしまわないようにする */
async function expectOperable(l: Locator, what: string): Promise<void> {
  await expect(l, `${what}: 表示されていない`).toBeVisible();
  await expect(l, `${what}: 無効になっていて操作できない`).toBeEnabled();
}

export async function chooseByLabel(select: Locator, labels: string | string[]): Promise<void> {
  const want = Array.isArray(labels) ? labels : [labels];
  const have = (await select.locator("option").allInnerTexts()).map((t) => t.trim());
  for (const w of want) {
    if (!have.includes(w)) throw new Error(`選択肢「${w}」が無い（ある選択肢: ${have.filter(Boolean).join("、")}）`);
  }
  await expectOperable(select, `選択欄（${want.join("、")}）`);
  await select.selectOption(want.map((label) => ({ label })));
}

export async function setChecked(box: Locator, on: boolean): Promise<void> {
  await expectOperable(box, "チェック欄");
  await box.setChecked(on);
}
