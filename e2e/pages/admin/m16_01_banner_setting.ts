/**
 * M16-01 トップバナー管理のバナー設定欄（上半分）の操作と読み取り。セレクタはここだけに書く。
 *
 * 画面の作り（アプリのテンプレート・フォーム・保存の処理で確かめた。期待値はここに書かない）:
 * - 行（バナー）は登録されている全部が ID の昇順に並ぶ（開発環境は ID 1〜15 の15行）。行を足す・消す操作は画面に無い。
 * - 1行の項目: 画像（保存済みの画像URLの img）・画像URL・リンク先URL・言語（「日本語」「英語」のチェックボックス）・
 *   表示タイプ（「非表示」「表示」の選択）・画像alt属性・並び順。並び順の欄は、いつも行の ID が初期値で出る（保存された並び順は出ない）。
 * - 「バナー設定」ボタンは欄の上と下に1つずつある（どちらも同じ送信）。
 * - 保存すると、並び順の小さい順に入力した値を ID 1, 2, … の行へ詰めて書く（並び順を入れ替えると、値が別の ID の行へ移る）。
 *   画像URLが空の行は、表示タイプが「非表示」で保存される。並び順は行の位置（1, 2, …）で保存される。
 */
import { Locator, Page, Response, expect } from "@playwright/test";
import { adminUrl } from "../../lib/session";

/** 1行の値（画面の表示のまま） */
export type バナー行 = {
  ID: number; 画像URL: string; リンク先URL: string; 言語: string[]; 表示タイプ: string; 画像alt属性: string; 並び順: string;
};
/** 入れる値（指定した項目だけ入れる。言語は付けるチェックの表示名の並び。空の配列なら全部外す） */
export type バナー入力 = Partial<Omit<バナー行, "ID">>;

export type 送信の結果 = { 送った: boolean; 応答: number | null; 成功: string[]; エラー: string[]; 行き先: string };

const F = (name: string) => `[name="top_banner[${name}]"]`;
/** 開発環境の画面にいつも出ている帯（保存の結果ではない） */
const 環境の帯 = "デバッグモードが有効になっています。";

export class BannerSettingPage {
  constructor(readonly page: Page) {}

  get フォーム(): Locator { return this.page.locator('form[name="top_banner"]'); }
  get バナー設定ボタン(): Locator { return this.フォーム.getByRole("button", { name: "バナー設定", exact: true }).first(); }

  /** トップバナー管理画面を開く（店舗の店名略称を渡すと、その店舗を指定した画面） */
  async 開く(略称?: string): Promise<void> {
    const res = await this.page.goto(adminUrl(略称 ? `/data/top_banner/${略称}` : "/data/top_banner"), { timeout: 60_000 });
    if (!res || !res.ok()) throw new Error(`トップバナー管理画面を開けない（応答 ${res?.status() ?? "なし"}）`);
    await this.読み込みを待つ();
  }

  async 読み込みを待つ(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.バナー設定ボタン, "トップバナー管理画面のバナー設定ボタン").toBeVisible({ timeout: 30_000 });
  }

  /** 画面に並ぶ行の ID（上から順） */
  async 行のID(): Promise<number[]> {
    const names = await this.フォーム.locator('input[name^="top_banner[sort_no_"]').evaluateAll((els) => els.map((e) => (e as HTMLInputElement).name));
    return names.map((n) => Number(/sort_no_(\d+)/.exec(n)?.[1] ?? "NaN"));
  }

  画像URL欄(id: number): Locator { return this.page.locator(F(`image_url_${id}`)); }
  リンク先URL欄(id: number): Locator { return this.page.locator(F(`link_${id}`)); }
  表示タイプ欄(id: number): Locator { return this.page.locator(F(`disp_type_${id}`)); }
  画像alt属性欄(id: number): Locator { return this.page.locator(F(`image_alt_${id}`)); }
  並び順欄(id: number): Locator { return this.page.locator(F(`sort_no_${id}`)); }
  言語欄(id: number): Locator { return this.page.locator(`input[type=checkbox][name="top_banner[language_${id}][]"]`); }
  /** 行の表（画像・各項目の欄を含む）。並び順の欄を持つ表 */
  行の表(id: number): Locator { return this.フォーム.locator("table.top-banner-table").filter({ has: this.並び順欄(id) }); }
  /** 行の左の画像（保存済みの画像URLを表示する img） */
  行の画像(id: number): Locator { return this.行の表(id).locator("img").first(); }

  /** ID が id のバナー行の、言語の選択肢の表示名（上から順） */
  async 言語の選択肢(id: number): Promise<string[]> {
    const boxes = this.言語欄(id);
    await boxes.first().waitFor({ state: "attached", timeout: 30_000 });
    return boxes.evaluateAll((els) =>
      els.map((e) => ((e as HTMLInputElement).labels?.[0]?.innerText ?? "").replace(/\s+/g, " ").trim()));
  }

  /** 1行の値を読む */
  async 行を読む(id: number): Promise<バナー行> {
    const 言語 = await this.言語欄(id).evaluateAll((els) => els.filter((e) => (e as HTMLInputElement).checked)
      .map((e) => ((e as HTMLInputElement).labels?.[0]?.innerText ?? "").replace(/\s+/g, " ").trim()));
    return {
      ID: id,
      画像URL: await this.画像URL欄(id).inputValue(),
      リンク先URL: await this.リンク先URL欄(id).inputValue(),
      言語,
      表示タイプ: (await this.表示タイプ欄(id).locator("option:checked").allInnerTexts()).join("").trim(),
      画像alt属性: await this.画像alt属性欄(id).inputValue(),
      並び順: await this.並び順欄(id).inputValue(),
    };
  }

  /** 全行の値を読む（上から順） */
  async 全行を読む(): Promise<バナー行[]> {
    const out: バナー行[] = [];
    for (const id of await this.行のID()) out.push(await this.行を読む(id));
    return out;
  }

  /** 1行に値を入れる（指定した項目だけ） */
  async 行に入れる(id: number, v: バナー入力): Promise<void> {
    if (v.画像URL !== undefined) await this.画像URL欄(id).fill(v.画像URL);
    if (v.リンク先URL !== undefined) await this.リンク先URL欄(id).fill(v.リンク先URL);
    if (v.言語 !== undefined) {
      const have = await this.言語の選択肢(id);
      const 無い = v.言語.filter((l) => !have.includes(l));
      if (無い.length) throw new Error(`ID ${id} の言語の選択肢に「${無い.join("、")}」が無い（ある選択肢: ${have.join("、")}）`);
      const boxes = this.言語欄(id);
      for (let i = 0; i < have.length; i++) await boxes.nth(i).setChecked(v.言語.includes(have[i]));
    }
    if (v.表示タイプ !== undefined) await this.表示タイプ欄(id).selectOption({ label: v.表示タイプ });
    if (v.画像alt属性 !== undefined) await this.画像alt属性欄(id).fill(v.画像alt属性);
    if (v.並び順 !== undefined) await this.並び順欄(id).fill(v.並び順);
  }

  /** 「バナー設定」を押し、送った要求の応答と、移った先の画面の成功・エラーの表示を読む */
  async 設定を押す(): Promise<送信の結果> {
    let 送った = false;
    let 応答: number | null = null;
    const 送り先 = /\/data\/top_banner(\/[a-z0-9]+)?\/?(\?.*)?$/;
    const onReq = (r: import("@playwright/test").Request) => { if (r.method() === "POST" && 送り先.test(r.url())) 送った = true; };
    const onRes = (r: Response) => { if (r.request().method() === "POST" && 送り先.test(r.url()) && 応答 === null) 応答 = r.status(); };
    this.page.on("request", onReq);
    this.page.on("response", onRes);
    try {
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }).catch(() => undefined),
        this.バナー設定ボタン.click({ noWaitAfter: true }),
      ]);
    } finally {
      this.page.off("request", onReq);
      this.page.off("response", onRes);
    }
    const ok = this.page.locator(".alert-success");
    const ng = this.page.locator(".alert-danger, .invalid-feedback, .form-error-message, p.errormsg").filter({ hasNotText: 環境の帯 });
    const 画面 = await this.バナー設定ボタン.isVisible().catch(() => false);
    // 保存の結果（成功の表示か、エラーの表示）が出るのを待つ。どちらも出なければ、そのまま読む
    if (画面) await ok.or(ng).first().waitFor({ state: "visible", timeout: 60_000 }).catch(() => undefined);
    const 文 = async (l: Locator) => (await l.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    return { 送った, 応答, 成功: 画面 ? await 文(ok) : [], エラー: 画面 ? await 文(ng) : [], 行き先: this.page.url() };
  }
}
