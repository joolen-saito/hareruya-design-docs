/**
 * M14-04 カード詳細(登録・編集・削除)画面の操作。
 * 登録（/card/new）と編集（/card/{id}/edit）は同じ作りの画面。セレクタはここだけに書く。
 */
import { expect, Locator, Page, Response } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { withoutEnvBanners } from "./common";

export type 詳細の入力 = {
  コレクターNo?: string; 裏面カード詳細ID?: string; ルールテキスト日?: string; ルールテキスト英?: string; フレーバー日?: string; フレーバー英?: string;
  パワー?: string; タフネス?: string; カードセット?: string; レアリティ?: string; レイアウト?: string; イラストレーター?: string; プロモ種別?: string;
  Foil?: string; フレーム?: string;
};
export type 必須の値 = { レアリティ: string; レイアウト: string; プロモ種別: string; Foil?: string; フレーム?: string };

export class CardEditPage {
  readonly form: Locator;
  readonly 詳細一覧: Locator;
  readonly リーガリティ行: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator("form#form1");
    this.詳細一覧 = page.locator("#card-details-container .detail-card");
    this.リーガリティ行 = page.locator("#card-formats-container .removable-item");
  }

  async openNew(): Promise<Response | null> {
    const res = await this.page.goto(adminUrl("/card/new"));
    await this.page.waitForLoadState("load");
    await expect(this.form, "カード詳細(登録)画面").toBeVisible();
    return res;
  }

  /** カード詳細(編集・削除)画面を開く。応答を返す（404などのときは画面が無い） */
  async open(カードID: string): Promise<Response | null> {
    const res = await this.page.goto(adminUrl(`/card/${カードID}/edit`));
    await this.page.waitForLoadState("load");
    if (res && res.ok()) await expect(this.form, "カード詳細(編集・削除)画面").toBeVisible();
    return res;
  }

  field(名: string): Locator { return this.form.locator(`#admin_card_${名}`); }

  async 基本情報を入れる(v: {
    カード名日?: string; カード名英?: string; アリーナ名日?: string; アリーナ名英?: string; ルールテキスト日?: string; ルールテキスト英?: string;
    マナ・コスト?: string; 点数で見たマナ?: string; パワー?: string; タフネス?: string; 忠誠度?: string;
  }): Promise<void> {
    const map: [string, string | undefined][] = [
      ["nameJp", v.カード名日], ["nameEn", v.カード名英], ["arenaFormatNameJp", v.アリーナ名日], ["arenaFormatNameEn", v.アリーナ名英],
      ["textJp", v.ルールテキスト日], ["textEn", v.ルールテキスト英], ["manaCost", v.マナ・コスト], ["cmc", v.点数で見たマナ],
      ["power", v.パワー], ["toughness", v.タフネス], ["loyalty", v.忠誠度],
    ];
    for (const [id, value] of map) if (value !== undefined) await this.field(id).fill(value);
  }

  /** カラー・固有色のチェック群で、ラベルが一致する選択肢を選ぶ */
  async 色を選ぶ(欄: "カラー" | "固有色", ラベル: string): Promise<void> {
    const prefix = 欄 === "カラー" ? "admin_card_colors_" : "admin_card_colorIdentities_";
    const labels = this.page.locator(`label[for^="${prefix}"]`);
    const n = await labels.count();
    for (let i = 0; i < n; i++) {
      if (((await labels.nth(i).innerText()) ?? "").trim() !== ラベル) continue;
      await this.page.locator(`#${await labels.nth(i).getAttribute("for")}`).check();
      return;
    }
    throw new Error(`${欄}に「${ラベル}」の選択肢が無い`);
  }

  async 色の選択肢(欄: "カラー" | "固有色"): Promise<string[]> {
    const prefix = 欄 === "カラー" ? "admin_card_colors_" : "admin_card_colorIdentities_";
    return (await this.page.locator(`label[for^="${prefix}"]`).allInnerTexts()).map((t) => t.trim());
  }

  /** 詳細情報のブロックの見出しにあるカード詳細ID（上から順） */
  async 詳細IDs(): Promise<string[]> {
    const t = (await this.詳細一覧.locator(".detail-header strong").allInnerTexts()).map((s) => s.trim());
    return t.map((s) => /カード詳細ID:\s*(\d+)/.exec(s)?.[1]).filter((x): x is string => !!x);
  }

  詳細(詳細ID: string): Locator {
    return this.詳細一覧.filter({ has: this.page.locator(".detail-header strong", { hasText: new RegExp(`カード詳細ID:\\s*${詳細ID}\\s*$`) }) });
  }

  /** 「詳細情報を追加」を押し、追加されたブロックを返す */
  async 詳細情報を追加する(): Promise<Locator> {
    const before = await this.詳細一覧.count();
    await this.page.locator("#add-detail").click({ timeout: 20_000 });
    await expect(this.詳細一覧, "「詳細情報を追加」で詳細情報が増える").toHaveCount(before + 1);
    return this.詳細一覧.last();
  }

  private sel(det: Locator, f: string): Locator { return det.locator(`select[name$="[${f}]"]`); }

  /** ブロックに入力する。必須のレアリティ・レイアウト・プロモ種別は、与えられなければ触らない */
  async 詳細を入れる(det: Locator, v: 詳細の入力): Promise<void> {
    const text: [string, string | undefined][] = [
      ["cardNo", v.コレクターNo], ["backCardDetailId", v.裏面カード詳細ID], ["textJp", v.ルールテキスト日], ["textEn", v.ルールテキスト英],
      ["flavorJp", v.フレーバー日], ["flavorEn", v.フレーバー英], ["power", v.パワー], ["toughness", v.タフネス],
    ];
    for (const [f, value] of text) if (value !== undefined) await det.locator(`[name$="[${f}]"]:not(select)`).first().fill(value);
    const pick: [string, string | undefined][] = [
      ["cardset", v.カードセット], ["rarity", v.レアリティ], ["cardLayout", v.レイアウト], ["illustrator", v.イラストレーター], ["promotion", v.プロモ種別],
      ["foilFlg", v.Foil], ["frameFlg", v.フレーム],
    ];
    for (const [f, label] of pick) if (label !== undefined) await this.sel(det, f).selectOption({ label });
  }

  /** 新しいブロックに必須の選択値を入れる（Foil=なし・フレーム=通常が既定） */
  async 必須を入れる(det: Locator, m: 必須の値): Promise<void> {
    await this.詳細を入れる(det, { レアリティ: m.レアリティ, レイアウト: m.レイアウト, プロモ種別: m.プロモ種別, Foil: m.Foil ?? "なし", フレーム: m.フレーム ?? "通常" });
  }

  async 詳細の値(det: Locator): Promise<Record<string, string>> {
    return det.evaluate((el) => {
      const out: Record<string, string> = {};
      for (const e of Array.from(el.querySelectorAll("input, select, textarea")) as (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[]) {
        const m = /\[cardDetails\]\[\d+\]\[(\w+)\]$/.exec(e.name);
        if (!m) continue;
        out[m[1]] = e instanceof HTMLSelectElement ? (e.selectedOptions[0]?.textContent ?? "").trim() : e.value;
      }
      return out;
    });
  }

  /** 詳細のカード画像（言語・表裏・画像URL）の入力欄 */
  画像言語(det: Locator): Locator { return det.locator('select[name$="[language]"]'); }
  画像表裏(det: Locator): Locator { return det.locator('select[name$="[backFlg]"]'); }

  /** 「リーガリティ追加」を押し、追加された行を返す */
  async リーガリティを追加する(): Promise<Locator> {
    const before = await this.リーガリティ行.count();
    await this.page.locator("#add-format").click({ timeout: 20_000 });
    await expect(this.リーガリティ行, "「リーガリティ追加」で行が増える").toHaveCount(before + 1);
    return this.リーガリティ行.last();
  }

  async リーガリティを選ぶ(row: Locator, フォーマット: string, リーガリティ: string): Promise<void> {
    await row.locator('select[name$="[format]"]').selectOption({ label: フォーマット });
    await row.locator("label").filter({ hasText: new RegExp(`^\\s*${リーガリティ}\\s*$`) }).click();
  }

  async リーガリティ行の値(row: Locator): Promise<{ フォーマット: string; リーガリティ: string }> {
    return row.evaluate((el) => ({
      フォーマット: ((el.querySelector('select[name$="[format]"]') as HTMLSelectElement | null)?.selectedOptions[0]?.textContent ?? "").trim(),
      リーガリティ: ((el.querySelector('input[name$="[restriction]"]:checked') as HTMLInputElement | null)?.labels?.[0]?.textContent ?? "").trim(),
    }));
  }

  /** 「登録」を押す。送信が止められた（ブラウザの入力チェック）ときは sent=false */
  async 登録を押す(): Promise<{ sent: boolean; 応答: number | null; url: string }> {
    const button = this.form.locator('button[type="submit"]').filter({ hasText: /^\s*登録\s*$/ });
    let status: number | null = null;
    const onResponse = (r: Response) => { if (r.request().method() === "POST" && r.request().isNavigationRequest()) status = r.status(); };
    this.page.on("response", onResponse);
    try {
      const nav = this.page.waitForNavigation({ waitUntil: "load", timeout: 30_000 }).then(() => true, () => false);
      await button.click({ timeout: 20_000, noWaitAfter: true });
      const sent = await nav;
      return { sent, 応答: status, url: this.page.url() };
    } finally { this.page.off("response", onResponse); }
  }

  /** 画面の削除ボタンを押し、確認ポップアップが出るまで */
  async 削除を押す(): Promise<void> {
    const b = this.page.locator('a.btn-ec-delete[data-bs-target="#DeleteModal"]');
    await expect(b, "カード詳細画面の削除ボタン").toBeVisible();
    await b.click();
    await expect(this.page.locator("#DeleteModal"), "削除の確認ポップアップ").toBeVisible();
  }

  async 確認で実行する(): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 120_000 }),
      this.page.locator('#DeleteModal a[data-method="delete"]').click({ noWaitAfter: true }),
    ]);
    await this.page.waitForLoadState("load");
  }

  /** 保存後の画面の通知（成功・失敗のメッセージ） */
  async 通知(): Promise<string[]> {
    return withoutEnvBanners((await this.page.locator(".alert, .c-contentsArea .alert").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean)); // 開発用の設定のときに常に出る帯は除く
  }

  // ---- 商品・デッキに紐づくカードの削除（M14-04 の 010・036〜039・063 で足した） ----
  /** 詳細情報のブロックの「この詳細情報を削除」ボタン（admin/Card/detail_row.twig の delete-item） */
  詳細の削除ボタン(詳細ID: string): Locator { return this.詳細(詳細ID).locator("button.delete-item"); }
  /** 詳細情報のブロックの「詳細情報削除不可」の表示（同じ twig の text-danger の文） */
  詳細の削除不可の表示(詳細ID: string): Locator { return this.詳細(詳細ID).locator(".text-end span.text-danger"); }
  /** 画面の「詳細情報を追加」ボタン */
  get 詳細情報を追加ボタン(): Locator { return this.page.locator("#add-detail"); }
  /**
   * 確認ポップアップの実行ボタンを押し、削除の要求が送られたことを確かめて、移った先の画面のアドレスを返す。
   * 削除できないとき画面は同じ編集画面へ戻る作りなので、要求が送られたこと（送り先と応答）を返して、操作をせずに合格にならないようにする。
   */
  async 確認で実行して要求を見る(カードID: string): Promise<{ 送った: boolean; 送り先: string; 応答: number | null; 移った先: string; 通知: string[] }> {
    const req = this.page.waitForRequest((r) => new RegExp(`/card/${カードID}/delete`).test(r.url()), { timeout: 30_000 }).catch(() => null);
    const res = this.page.waitForResponse((r) => new RegExp(`/card/${カードID}/delete`).test(r.url()), { timeout: 30_000 }).catch(() => null);
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30_000 }).catch(() => null),
      this.page.locator('#DeleteModal a[data-method="delete"]').click({ noWaitAfter: true }),
    ]);
    await this.page.waitForLoadState("load");
    const [q, r] = await Promise.all([req, res]);
    return { 送った: !!q, 送り先: q ? new URL(q.url()).pathname : "", 応答: r ? r.status() : null, 移った先: this.page.url(), 通知: await this.通知() };
  }
}
