/**
 * M13-14 バナー設定（メニュー「イベント管理」の画像設定画面の上半分。識別番号ごとの入力欄と「バナー設定」ボタン）
 *
 * 画面の作り（アプリのテンプレートから）: 識別番号 n の欄は、名前が event_banner[項目_n] の入力欄。
 * 「バナー設定」ボタンは、並び順の空欄・重複を画面側で調べ、アラートを出して送らない。ほかの入力の誤りは送信後に、欄の下へエラーを出して同じ画面にとどまる。
 */
import { Locator, Page, expect } from "@playwright/test";
import { adminUrl } from "../../lib/session";

export type 枠の内容 = {
  識別番号: number; 画像URL: string; リンク先URL: string; 表示店舗: string[]; 言語: string[]; 表示タイプ: string; 画像alt属性: string; 並び順: string;
};

/** 画面の入力欄の「値」そのもの（店舗・言語・表示タイプは選択肢の値）。共有のバナー設定を控えて戻すのに使う */
export type 枠の値 = {
  識別番号: number; 画像URL: string; リンク先URL: string; 表示店舗: string[]; 言語: string[]; 表示タイプ: string; 画像alt属性: string; 並び順: string;
};

export class BannerSettingPage {
  constructor(readonly page: Page) {}

  get バナー設定ボタン(): Locator { return this.page.locator("button.js-event-banner-setting-submit"); }
  get 画像設定へのリンク(): Locator { return this.page.getByRole("link", { name: "▼画像設定", exact: true }).first(); }
  get 入力のエラー(): Locator { return this.page.locator("form[name=event_banner] .invalid-feedback, form[name=event_banner] .form-error-message, form[name=event_banner] .errormsg"); }

  欄(項目: string, n: number): Locator { return this.page.locator(`[name="event_banner[${項目}_${n}]"]`); }

  async 開く(): Promise<void> {
    const res = await this.page.goto(adminUrl("/event/banner"));
    if (!res || !res.ok()) throw new Error(`バナー設定画面を開けない（応答 ${res?.status() ?? "なし"}）`);
    await this.page.waitForLoadState("load");
    await expect(this.バナー設定ボタン, "バナー設定画面の「バナー設定」ボタン").toBeVisible({ timeout: 30_000 });
  }

  async 入力する(項目: "image_url" | "link" | "image_alt" | "sort_no", n: number, 値: string): Promise<void> {
    await this.欄(項目, n).fill(値);
  }

  /** 画面に出ている全枠の内容を読む（画像URL・リンク先URL・表示店舗・言語・表示タイプ・画像alt属性・並び順） */
  async 全枠を読む(): Promise<枠の内容[]> {
    return this.page.evaluate(() => {
      const f = document.querySelector('form[name="event_banner"]') as HTMLFormElement;
      const nums = Array.from(f.querySelectorAll('[name^="event_banner[sort_no_"]'))
        .map((e) => Number((e.getAttribute("name") ?? "").replace(/\D/g, ""))).sort((a, b) => a - b);
      const val = (name: string) => (f.querySelector(`[name="event_banner[${name}]"]`) as HTMLInputElement | null)?.value ?? "";
      const sel = (name: string) => Array.from(f.querySelectorAll(`select[name="event_banner[${name}][]"] option:checked, select[name="event_banner[${name}]"] option:checked`))
        .map((o) => (o.textContent ?? "").replace(/\s+/g, " ").trim());
      const lang = (name: string) => Array.from(f.querySelectorAll(`input[type=checkbox][name="event_banner[${name}][]"]:checked`))
        .map((e) => ((e as HTMLInputElement).labels?.[0]?.innerText ?? "").replace(/\s+/g, " ").trim());
      return nums.map((n) => ({
        識別番号: n, 画像URL: val(`image_url_${n}`), リンク先URL: val(`link_${n}`), 表示店舗: sel(`base_info_${n}`), 言語: lang(`language_${n}`),
        表示タイプ: sel(`disp_type_${n}`).join("/"), 画像alt属性: val(`image_alt_${n}`), 並び順: val(`sort_no_${n}`),
      }));
    });
  }

  /** 画面に出ている全枠の入力値をそのまま読む（店舗・言語・表示タイプは選択肢の値。戻すときに同じ値を入れる） */
  async 全枠の値を読む(): Promise<枠の値[]> {
    return this.page.evaluate(() => {
      const f = document.querySelector('form[name="event_banner"]') as HTMLFormElement;
      const nums = Array.from(f.querySelectorAll('[name^="event_banner[sort_no_"]'))
        .map((e) => Number((e.getAttribute("name") ?? "").replace(/\D/g, ""))).sort((a, b) => a - b);
      const val = (name: string) => (f.querySelector(`[name="event_banner[${name}]"]`) as HTMLInputElement | null)?.value ?? "";
      const multi = (name: string) => Array.from((f.querySelector(`select[name="event_banner[${name}][]"]`) as HTMLSelectElement | null)?.selectedOptions ?? []).map((o) => o.value).sort();
      const checked = (name: string) => Array.from(f.querySelectorAll(`input[type=checkbox][name="event_banner[${name}][]"]:checked`)).map((e) => (e as HTMLInputElement).value).sort();
      return nums.map((n) => ({
        識別番号: n, 画像URL: val(`image_url_${n}`), リンク先URL: val(`link_${n}`), 表示店舗: multi(`base_info_${n}`), 言語: checked(`language_${n}`),
        表示タイプ: val(`disp_type_${n}`), 画像alt属性: val(`image_alt_${n}`), 並び順: val(`sort_no_${n}`),
      }));
    });
  }

  /** 全枠の入力値を画面に入れる（保存はしない）。選択肢に無い値があれば止まる */
  async 全枠の値を入れる(枠: 枠の値[]): Promise<void> {
    const err: string | null = await this.page.evaluate((arr) => {
      const f = document.querySelector('form[name="event_banner"]') as HTMLFormElement;
      const set = (name: string, v: string) => {
        const e = f.querySelector(`[name="event_banner[${name}]"]`) as HTMLInputElement | null;
        if (!e) return false;
        e.value = v;
        return true;
      };
      for (const x of arr) {
        const n = x.識別番号;
        for (const [k, v] of [[`image_url_${n}`, x.画像URL], [`link_${n}`, x.リンク先URL], [`image_alt_${n}`, x.画像alt属性], [`sort_no_${n}`, x.並び順], [`disp_type_${n}`, x.表示タイプ]] as [string, string][]) {
          if (!set(k, v)) return `識別番号${n}の入力欄が無い（${k}）`;
        }
        const disp = f.querySelector(`select[name="event_banner[disp_type_${n}]"]`) as HTMLSelectElement | null;
        if (disp && disp.value !== x.表示タイプ) return `識別番号${n}の表示タイプに選択肢が無い（${x.表示タイプ}）`;
        const shops = f.querySelector(`select[name="event_banner[base_info_${n}][]"]`) as HTMLSelectElement | null;
        if (!shops) return `識別番号${n}の表示店舗の欄が無い`;
        for (const o of Array.from(shops.options)) o.selected = x.表示店舗.includes(o.value);
        for (const v of x.表示店舗) if (!Array.from(shops.options).some((o) => o.value === v)) return `識別番号${n}の表示店舗に選択肢が無い（${v}）`;
        const boxes = Array.from(f.querySelectorAll(`input[type=checkbox][name="event_banner[language_${n}][]"]`)) as HTMLInputElement[];
        for (const b of boxes) b.checked = x.言語.includes(b.value);
        for (const v of x.言語) if (!boxes.some((b) => b.value === v)) return `識別番号${n}の言語に選択肢が無い（${v}）`;
      }
      return null;
    }, 枠);
    if (err) throw new Error(err);
  }

  /** 「バナー設定」ボタンで保存し、保存の完了（保存しました）まで待つ。入力エラーで保存されなかったときは止まる */
  async 保存する(): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
      this.バナー設定ボタン.first().click(),
    ]);
    await this.page.waitForLoadState("load");
    await expect(this.page.locator(".alert-success").filter({ hasText: "保存しました" }).first(), "バナー設定の保存の完了表示").toBeVisible({ timeout: 30_000 });
  }

  /** 画面のエラー表示の文言 */
  async エラーの表示(): Promise<string[]> {
    return (await this.入力のエラー.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
  }
}

/** 全枠の内容を、識別番号ごとの1行の文字列にする（比べて差を見せるため） */
export function 内容の一覧(a: 枠の内容[]): string[] {
  return a.map((x) => JSON.stringify(x));
}
