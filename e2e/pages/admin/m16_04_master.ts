/** M16-04 MTGマスターデータ編集（メニュー「データ管理」→「MTGマスターデータ」）と、システム設定のマスターデータ管理 */
import { Locator, Page, expect } from "@playwright/test";
import { adminUrl } from "../../lib/session";

export class MtgMasterEditPage {
  constructor(readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto(adminUrl("/data/mtg_master_data"));
    await this.page.waitForLoadState("load");
    await expect(this.選択欄, "MTGマスターデータ選択").toBeVisible();
  }
  get 選択欄(): Locator { return this.page.locator('select[name="entity"]'); }
  get 選択ボタン(): Locator { return this.page.locator('form[method="get"] button[type="submit"]'); }
  /** 一覧と登録ボタンの領域 */
  get 一覧の領域(): Locator { return this.page.locator("form#edit_form"); }
  get 登録ボタン(): Locator { return this.page.locator('button[type="submit"][form="edit_form"]'); }
  async 選択肢の表示名(): Promise<string[]> { return (await this.選択欄.locator("option").allInnerTexts()).map((t) => t.trim()); }
  async 選ばれている表示名(): Promise<string> { return ((await this.選択欄.locator("option:checked").textContent()) ?? "").trim(); }
  /** 開発者ツールで行うのと同じに、選択欄へ選択肢に無い値を足して選ぶ */
  async 送信値を書き換える(値: string): Promise<void> {
    await this.選択欄.evaluate((e, v) => { const s = e as HTMLSelectElement; s.add(new Option(v, v)); s.value = v; }, 値);
  }
  async 選択を押す(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 120_000}), this.選択ボタン.click({ timeout: 20_000, noWaitAfter: true })]);
    await this.page.waitForLoadState("load");
  }
  get カード名リスト作成リンク(): Locator { return this.page.getByRole("link", { name: "カード一覧の「カード名リスト作成」" }); }

  /** マスターデータの種別を表示名で選び、「選択」を押して一覧を出す */
  async 種別を選んで表示する(表示名: string): Promise<void> {
    await this.選択欄.selectOption({ label: 表示名 });
    await this.選択を押す();
    await expect(this.一覧の領域, `「${表示名}」の一覧`).toBeVisible();
    expect(await this.選ばれている表示名(), "選ばれている種別").toBe(表示名);
  }
  async 見出し(): Promise<string[]> { return (await this.一覧の領域.locator("thead th").allInnerTexts()).map((t) => t.trim()); }
  /** 末尾の入力用の空行を除いた、登録済みの行 */
  get 登録済みの行(): Locator { return this.一覧の領域.locator("tbody tr").filter({ hasNot: this.page.locator('[name^="rows[new]"]') }); }
  get 入力用の空行(): Locator { return this.一覧の領域.locator("tbody tr").filter({ has: this.page.locator('[name^="rows[new]"]') }); }
  /** 行を、その行の識別番号（入力欄の送信名に含まれる番号）で探す */
  番号の行(番号: number): Locator {
    return this.一覧の領域.locator("tbody tr").filter({ has: this.page.locator(`[name^="rows[${番号}]["]`) });
  }
  /** 行の各列について、入力できない（読み取り専用または無効）かどうか。列の並びは見出しの並び */
  async 入力できない列(行: Locator): Promise<boolean[]> {
    return 行.locator("td").evaluateAll((tds) => tds.map((td) => {
      const c = td.querySelector("input, select") as HTMLInputElement | HTMLSelectElement | null;
      return !!c && (c.hasAttribute("readonly") || c.disabled);
    }));
  }
  /** 真偽値の選択欄（登録済みの行）に表示されている値 */
  async 真偽値の表示(): Promise<string[]> {
    return this.登録済みの行.locator("select option:checked").evaluateAll((os) => os.map((o) => (o.textContent ?? "").trim()));
  }
  get 登録の文字のボタン(): Locator { return this.page.getByRole("button", { name: "登録", exact: true }); }
  get なりすまし対策トークン(): Locator { return this.一覧の領域.locator('input[name$="[_token]"]'); }
  async トークンを書き換える(値: string): Promise<number> {
    return this.なりすまし対策トークン.evaluateAll((els, v) => { els.forEach((e) => { (e as HTMLInputElement).value = v; }); return els.length; }, 値);
  }
  async 登録を押す(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 120_000}), this.登録ボタン.click({ timeout: 20_000, noWaitAfter: true })]);
  }
  /** 入力エラーとして画面に出ているメッセージ（開発用の帯は除く） */
  async 入力エラーの文(): Promise<string[]> {
    const l = this.page.locator(".alert-danger, .invalid-feedback, .form-error-message").filter({ hasNotText: "デバッグモードが有効になっています" });
    return (await l.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
  }

  // ---- 2026-11-12 追加: 行の値を読む・入れる（共有のマスタを控えて戻す・試験の行を足す） ----

  /** 選択欄の値（送信の値。例 color・campaign_tag） */
  async 選ばれている値(): Promise<string> { return this.選択欄.inputValue(); }
  /** 列の項目（入力欄の送信名の最後の [ ] の中。左から順）。末尾の入力用の空行から読む。1列目は並び順 */
  async 列の項目(): Promise<string[]> {
    return this.入力用の空行.locator("input, select").evaluateAll((es) => es.map((e) => /\[new\]\[([^\]]+)\]$/.exec((e as HTMLInputElement).name)?.[1] ?? ""));
  }
  /** 列の入力欄の種類（text・number・datetime-local・select）。列の項目と同じ並び */
  async 列の種類(): Promise<string[]> {
    return this.入力用の空行.locator("input, select").evaluateAll((es) => es.map((e) => (e.tagName === "SELECT" ? "select" : (e as HTMLInputElement).type)));
  }
  /** 登録済みの行の、識別番号と各項目の画面の値（入力欄の値。日時は入力欄の値のまま） */
  async 全行を読む(): Promise<マスタの行[]> {
    return this.一覧の領域.locator("tbody tr").evaluateAll((trs) => {
      const out: { 番号: number; 値: Record<string, string> }[] = [];
      for (const tr of trs) {
        const cs = Array.from(tr.querySelectorAll("input, select")) as (HTMLInputElement | HTMLSelectElement)[];
        const m = cs.length ? /^rows\[(\d+)\]\[/.exec(cs[0].name) : null;
        if (!m) continue;
        const 値: Record<string, string> = {};
        for (const c of cs) { const k = /\]\[([^\]]+)\]$/.exec(c.name)?.[1]; if (k) 値[k] = c.value; }
        out.push({ 番号: Number(m[1]), 値 });
      }
      return out;
    });
  }
  /** 行（識別番号か、末尾の入力用の空行 "new"）の項目の入力欄 */
  行の欄(番号: number | "new", 項目: string): Locator { return this.一覧の領域.locator(`[name="rows[${番号}][${項目}]"]`); }
  /** 行の項目に値を入れる（選択欄は値で選ぶ） */
  async 行に入れる(番号: number | "new", 値: Record<string, string>): Promise<void> {
    for (const [k, v] of Object.entries(値)) {
      const el = this.行の欄(番号, k);
      await expect(el, `行（${番号}）の項目 ${k} の入力欄`).toHaveCount(1);
      if ((await el.evaluate((e) => e.tagName)) === "SELECT") await el.selectOption(v, { timeout: 20_000 });
      else await el.fill(v, { timeout: 20_000 });
    }
  }
  /** 行の、列の位置（1から。1列目は並び順）ごとに値を入れる */
  async 列で入れる(番号: number | "new", 値: Record<number, string>): Promise<void> {
    const 項目 = await this.列の項目();
    const v: Record<string, string> = {};
    for (const [n, x] of Object.entries(値)) {
      const k = 項目[Number(n) - 1];
      if (!k) throw new Error(`${n} 列目が無い（列は ${項目.length} 列）`);
      v[k] = x;
    }
    await this.行に入れる(番号, v);
  }
  /** 行の入力欄（選択欄を除く）をすべて空にする（画面の作りでは、全項目を空にした行は登録で削除される） */
  async 行を空にする(番号: number): Promise<void> {
    const els = await this.一覧の領域.locator(`input[name^="rows[${番号}]["]`).all();
    for (const e of els) await e.fill("", { timeout: 20_000 });
  }
  /** 「登録」を押し、次の画面の読み込みを待って、成功・エラーの表示を返す（どちらかが出るまで待つ） */
  async 登録して結果を読む(): Promise<{ 成功: string[]; エラー: string[]; 状態: number }> {
    const resP = this.page.waitForResponse((r) => r.request().isNavigationRequest() && r.request().method() === "POST", { timeout: 60_000 }).catch(() => null);
    await this.登録を押す();
    const res = await resP;
    await this.page.waitForLoadState("load");
    const ok = this.page.locator(".alert-success");
    const ng = this.page.locator(".alert-danger").filter({ hasNotText: "デバッグモードが有効になっています" });
    await ok.or(ng).first().waitFor({ state: "visible", timeout: 30_000 }).catch(() => undefined);
    const t = async (l: Locator) => (await l.allInnerTexts()).map((x) => x.replace(/\s+/g, " ").trim()).filter(Boolean);
    return { 成功: await t(ok), エラー: await t(ng), 状態: res?.status() ?? 0 };
  }
}

export type マスタの行 = { 番号: number; 値: Record<string, string> };
/** 行の、列の位置（1から。1列目は並び順）の値 */
export const 列の値 = (r: マスタの行 | undefined, n: number): string => (r ? Object.values(r.値)[n - 1] ?? "" : "");

/** 日時の入力欄の値（例 2026-09-01T10:00）を、設計書の表示の形（2026-09-01 10:00:00）にそろえる */
export function 日時の表示にそろえる(v: string): string {
  const s = v.replace("T", " ");
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(s) ? `${s}:00` : s;
}

/** カードセット管理・デッキ管理の、MTGマスターデータ編集への入口 */
export class MasterEntryLinks {
  constructor(readonly page: Page) {}
  async カードセット管理を開く(): Promise<void> { await this.page.goto(adminUrl("/cardset")); await this.page.waitForLoadState("load"); }
  async デッキ管理を開く(): Promise<void> { await this.page.goto(adminUrl("/deck")); await this.page.waitForLoadState("load"); }
  get ブロックの追加(): Locator { return this.page.getByRole("link", { name: "ブロックの追加", exact: true }); }
  get デッキタグ一覧(): Locator { return this.page.getByRole("link", { name: "デッキタグ一覧", exact: true }).or(this.page.getByRole("button", { name: "デッキタグ一覧", exact: true })); }
}

/** システム設定のマスターデータ管理の選択欄の選択肢の表示名 */
export async function マスターデータ管理の選択肢(page: Page): Promise<string[]> {
  await page.goto(adminUrl("/setting/system/masterdata"));
  await page.waitForLoadState("load");
  const sel = page.locator("form select").first();
  await expect(sel, "マスターデータ管理の選択欄").toBeVisible();
  return (await sel.locator("option").allInnerTexts()).map((t) => t.trim());
}
