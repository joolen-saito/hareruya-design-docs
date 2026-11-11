/**
 * M10-15 店舗登録（メニュー「設定」→「店舗設定」→「店舗登録」）の画面操作。セレクタはここだけに書く。
 *
 * 画面の作り（アプリの実ソース admin/mall/tenant/detail.twig・MallTenantShopType で確かめた）:
 * - 新規は /mall/tenant/create、登録済みの店舗は /mall/tenant/detail/<店舗ID>。保存すると、その店舗の登録画面へ移り「保存しました」が出る。
 * - 画面の先頭に「店舗選択」の欄は無い。登録済みの店舗は、店舗一覧で店舗IDを検索し、店名のリンクを押して開く（＝選ぶ）。
 * - 管理者情報（ログインID・パスワード・パスワード（確認））とショップカラーの入力欄は無い。
 * - 住所は郵便番号・都道府県・市区町村名（住所1）・番地（住所2）の欄に分かれる。
 * - ショップアイコン・ご当地晴れる屋くんは画像の部品（ファイルの選択・ドラッグ）で選び、選んだ時点で一時保存され、登録で確定する。
 *
 * 試験用の店舗（共通の試験データ）:
 *   依頼者の方針（2026-11-10）で、共有の開発環境に店舗を増やし続けないよう、ケースごとに店舗を新しく登録せず、
 *   M10-15 専用の試験用店舗（2店）を使い回す。店名の末尾に試験用店舗の印（「-M1015P1」「-M1015P2」）を付け、
 *   店舗一覧の検索（店名の部分一致）で見つける。無ければ新規登録で作る。シードは、その店舗の全項目をシード表の更新前の値へ
 *   画面で入れ直す（シード表の「店舗を選択せずに店舗登録画面を開く…登録」を「試験用店舗を開いて…登録」に読み替える）。
 */
import { Browser, BrowserContext, Locator, Page, expect } from "@playwright/test";
import { adminUrl, hideDebugToolbar } from "../../lib/session";
import { BASE_URL } from "../../config/env";
import { chooseByLabel, expectSaved } from "./common";
import type { 画像 } from "../../fixtures/m10-15/images";

const T = 30_000;
const F = (n: string) => `mall_tenant_shop_master[${n}]`;

/** 正本の項目名 → 画面の入力欄（name の [] の中） */
export const 欄名 = {
  会社名: "company_name", "会社名(カナ)": "company_kana", 店名: "shop_name", "店名(カナ)": "shop_kana", "店名(英語表記)": "shop_name_eng",
  支店URL: "html_class_name", 郵便番号: "postal_code", 都道府県: "address][pref", 住所: "address][addr01", 番地: "address][addr02",
  "住所(英語表記)": "address_en", "Google map埋め込みURL": "google_map_url", 電話番号: "phone_number",
  店舗営業時間: "business_hour", "店舗営業時間(英語表記)": "business_hour_en",
  送信元メールアドレス: "email01", 問い合わせ専用メールアドレス: "email02", 返信先メールアドレス: "email03", 送信エラー通知メールアドレス: "email04",
  高額商品閾値1: "expensive_threshold1", 高額商品閾値2: "expensive_threshold2", 高額商品閾値3: "expensive_threshold3",
  スマレジ店舗ID: "smaregi_shop_id", スマレジ店舗コード: "smaregi_shop_code",
  取り扱い商品説明文: "good_traded", 店舗からのメッセージ: "message",
  "店名略称（3文字）": "shop_digit", ショップ名略称: "short_name_jp", "ショップ名略称（英語表記）": "short_name_en", 表示順: "rank", 席数: "max_capacity",
  ピッキングリスト分割しきい値価格: "picking_list_threshold", スタック用紙高額商品しきい値価格: "stack_paper_threshold",
  X公式アカウントURL: "x_account_url", 店頭用アカウントIPアドレス: "global_ip_address",
  "送料無料条件（金額）": "delivery_free_amount", "送料無料条件（数量）": "delivery_free_quantity", 適格請求書発行事業者登録番号: "invoice_registration_number",
  ショップカラー: "shop_color",
} as const;
export type 項目 = keyof typeof 欄名;
/** ラジオボタンの項目（見出し → 選べる表示名） */
export const ラジオ = { 店舗種別: ["本店", "支店"], 公開: ["公開", "非公開"], 開店: ["開店", "閉店"], 売上集計の検索項目: ["表示する", "表示しない"] } as const;
export type ラジオ項目 = keyof typeof ラジオ;
export type 店舗の値 = Partial<Record<項目 | ラジオ項目, string>>;

export class TenantEditPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }

  get form(): Locator { return this.page.locator("form#point_form"); }
  欄(k: 項目): Locator { return this.page.locator(`[name="${F(欄名[k])}"]`); }
  get 登録ボタン(): Locator { return this.form.locator("button[type=submit]", { hasText: /^\s*登録\s*$/ }); }

  async 待つ(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.欄("店名"), "店舗登録画面の店名の欄").toBeVisible({ timeout: 60_000 });
  }
  /** 店舗を選ばずに店舗登録画面（新規）を開く */
  async 新規を開く(): Promise<void> {
    await this.page.goto(adminUrl("/mall/tenant/create"), { timeout: 60_000 });
    await this.待つ();
  }
  /** 店舗IDの店舗登録画面を直接開く（URL で開く。応答の状態を返す） */
  async 直接開く(店舗ID: string): Promise<number> {
    const res = await this.page.goto(adminUrl(`/mall/tenant/detail/${店舗ID}`), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
  /**
   * 店舗を選ぶ: 画面に店舗選択の欄は無いので、店舗一覧で店舗IDを検索し、店名のリンクを押して、その店舗の登録画面を開く。
   * 登録直後のデータが一覧に出るまで遅れることがあるので、数回検索し直す。
   */
  async 選ぶ(店舗ID: string): Promise<void> {
    let link: Locator | null = null;
    for (let i = 0; i < 4 && !link; i++) {
      const rows = await 店舗一覧を検索する(this.page, 店舗ID);
      const row = rows.filter({ has: this.page.locator("td:nth-child(2)", { hasText: new RegExp(`^\\s*${店舗ID}\\s*$`) }) });
      if ((await row.count()) === 1) link = row.locator(`a[href$="/mall/tenant/detail/${店舗ID}"]`).first();
      else await this.page.waitForTimeout(2_000);
    }
    if (!link) throw new Error(`店舗一覧に店舗ID ${店舗ID} の店舗が出ない`);
    await Promise.all([this.page.waitForURL(new RegExp(`/mall/tenant/detail/${店舗ID}$`), { timeout: 60_000 }), link.click()]);
    await this.待つ();
  }
  /** 開いている店舗登録画面の店舗ID（URL の末尾）。新規なら null */
  店舗ID(): string | null {
    const m = /\/mall\/tenant\/detail\/(\d+)/.exec(new URL(this.page.url()).pathname);
    return m ? m[1] : null;
  }

  async 欄がある(k: 項目): Promise<boolean> { return (await this.欄(k).count()) > 0; }
  async 値(k: 項目): Promise<string> {
    const l = this.欄(k);
    if (k === "都道府県") return ((await l.locator("option:checked").textContent()) ?? "").trim();
    return l.inputValue();
  }
  /** ラジオボタンの選ばれている表示名（無ければ「（選ばれていない）」） */
  async 選択(k: ラジオ項目): Promise<string> {
    const checked = this.page.locator(`input[type=radio][name="${F(ラジオ名[k])}"]:checked`);
    if ((await checked.count()) === 0) return "（選ばれていない）";
    return ((await checked.first().evaluate((n) => (n as HTMLInputElement).labels?.item(0)?.textContent ?? "")) ?? "").trim();
  }
  async 選ぶラジオ(k: ラジオ項目, 表示名: string): Promise<void> {
    const radios = this.page.locator(`input[type=radio][name="${F(ラジオ名[k])}"]`);
    const target = radios.and(this.page.getByLabel(表示名, { exact: true }));
    await expect(target, `${k}の「${表示名}」のラジオボタン`).toHaveCount(1);
    await target.check();
  }
  /** 項目へ入れる。入れられなかった（欄が無い・数値の欄に文字）ときは理由を返す */
  async 入れる(k: 項目 | ラジオ項目, v: string): Promise<string | null> {
    if (k in ラジオ) { await this.選ぶラジオ(k as ラジオ項目, v); return null; }
    const l = this.欄(k as 項目);
    if ((await l.count()) === 0) return `「${k}」の入力欄が画面に無い`;
    if (k === "都道府県") { await chooseByLabel(l, v); return null; }
    try {
      await l.fill(v, { timeout: T });
    } catch (e) {
      return `「${k}」に「${v.length > 20 ? v.slice(0, 20) + "…" : v}」を入れられない（${String(e).split("\n")[0].slice(0, 100)}）`;
    }
    const got = await l.inputValue();
    if (got !== v) return `「${k}」に ${v.length} 文字を入れたが、入力欄の値は ${got.length} 文字（「${got.slice(0, 20)}${got.length > 20 ? "…" : ""}」）になった（入力欄の最大文字数・書式で切り詰められた）`;
    return null;
  }
  /** 複数の項目へ入れ、入れられなかった理由を返す */
  async 入れる全部(v: 店舗の値): Promise<string[]> {
    const out: string[] = [];
    for (const [k, val] of Object.entries(v)) {
      if (val === undefined) continue;
      const r = await this.入れる(k as 項目, val);
      if (r) out.push(r);
    }
    return out;
  }

  /**
   * 登録ボタンを押す。ブラウザの入力チェック（必須・メールの書式）で送信が止まるときは、押しても送られないことを確かめて返す。
   * 送られたときは、移った画面の応答の状態を返す。
   */
  async 登録を押す(): Promise<{ sent: boolean; status?: number; 止めた項目: string[] }> {
    const blocked = await this.form.evaluate((f) => Array.from((f as HTMLFormElement).elements)
      .filter((e) => "checkValidity" in e && !(e as HTMLInputElement).checkValidity())
      .map((e) => {
        const row = e.closest(".row");
        const label = row?.querySelector(".col-3")?.textContent?.replace(/\s+/g, " ").trim() ?? "（項目名なし）";
        return `${label}: ${(e as HTMLInputElement).validationMessage}`;
      }));
    if (blocked.length) {
      const sent = this.page.waitForRequest((r) => r.method() === "POST" && /\/mall\/tenant\/(create|detail)/.test(r.url()), { timeout: 3_000 }).then(() => true, () => false);
      await this.登録ボタン.click();
      if (await sent) {
        await this.page.waitForLoadState("load");
        return { sent: true, 止めた項目: blocked };
      }
      return { sent: false, 止めた項目: blocked };
    }
    // 送信の応答（保存できたら転送先の店舗登録画面、入力エラーなら同じ画面）へ移り終わるまで待つ
    const [res] = await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), this.登録ボタン.click()]);
    return { sent: true, status: res?.status() ?? 0, 止めた項目: [] };
  }
  /** 画面のエラーの文（入力エラー・上部のエラー。開発用の設定の帯は除く） */
  async エラーの文(): Promise<string[]> {
    const out: string[] = [];
    for (const e of await this.page.locator(".alert-danger, .invalid-feedback, .form-error-message").all()) {
      if (!(await e.isVisible())) continue;
      const t = (await e.innerText()).replace(/\s+/g, " ").trim();
      if (t && !t.includes("デバッグモードが有効になっています")) out.push(t);
    }
    return [...new Set(out)];
  }
  get 成功の表示(): Locator { return this.page.locator(".alert-success", { hasText: "保存しました" }); }

  // ---- 画像（ショップアイコン・ご当地晴れる屋くん） ----
  private 画像の欄(種類: "アイコン" | "晴れる屋くん"): Locator {
    return this.page.locator(`div.col:has(#${種類 === "アイコン" ? "shop-icon-upload-zone" : "hareruyakun-upload-zone"})`);
  }
  画像の値(種類: "アイコン" | "晴れる屋くん"): Locator {
    return this.page.locator(`[name="${F(種類 === "アイコン" ? "shop_icon" : "local_hareruyakun_image")}"]`);
  }
  private 追加の値(種類: "アイコン" | "晴れる屋くん"): Locator {
    return this.page.locator(`[name="${F(種類 === "アイコン" ? "add_shop_icon_image" : "add_local_hareruyakun_image")}"]`);
  }
  /** 画像を選ぶ（ファイルの選択欄へ渡し、一時保存が済むまで待つ）。いま画像があれば先に外す */
  async 画像を選ぶ(種類: "アイコン" | "晴れる屋くん", f: 画像): Promise<void> {
    await this.画像を外す(種類);
    const input = this.画像の欄(種類).locator("input.filepond--browser[type=file]");
    await expect(input, `${種類}のファイル選択欄`).toHaveCount(1, { timeout: T });
    await input.setInputFiles(f, { timeout: T });
    await expect.poll(async () => this.追加の値(種類).inputValue(), { message: `${種類}の一時保存（${f.name}）が済まない`, timeout: 90_000 }).not.toBe("");
  }
  /** 選ばれている（保存済みの）画像を部品から外す。無ければ何もしない */
  async 画像を外す(種類: "アイコン" | "晴れる屋くん"): Promise<void> {
    const zone = this.画像の欄(種類);
    const items = zone.locator(".filepond--item");
    // 保存済みの画像は、画面を開いたあとで部品が読み込んで並べる。保存値があれば、並ぶのを待ってから外す
    if ((await this.画像の値(種類).inputValue()) !== "") await expect(items, `${種類}の保存済みの画像が部品に並ぶ`).toHaveCount(1, { timeout: 60_000 });
    else await this.page.waitForTimeout(1_000);
    if ((await items.count()) === 0) return;
    const btn = zone.locator(".filepond--action-revert-item-processing, .filepond--action-remove-item").first();
    await btn.click({ timeout: T });
    await expect(items, `${種類}を外したあとの画像の数`).toHaveCount(0, { timeout: T });
  }
}

const ラジオ名: Record<ラジオ項目, string> = { 店舗種別: "is_main_shop", 公開: "is_public_shop", 開店: "is_open_shop", 売上集計の検索項目: "is_summary_target" };

/** 店舗一覧で、店舗ID または店名の一部で検索し、結果の行を返す（検索の欄は店舗IDと店名の部分一致の両方を見る） */
export async function 店舗一覧を検索する(page: Page, 語: string): Promise<Locator> {
  await page.goto(adminUrl("/mall/tenant"), { timeout: 60_000 });
  await page.waitForLoadState("load");
  await page.locator('[name="enterprise_admin_search_tenant[id]"]').fill(語);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }),
    page.locator("form").filter({ has: page.locator('[name="enterprise_admin_search_tenant[id]"]') }).getByRole("button", { name: "検索", exact: true }).click(),
  ]);
  return page.locator("table.table tbody tr");
}

/** 店舗一覧の検索で、店名に語を含む行の店舗IDと店名 */
export async function 店名で探す(page: Page, 語: string): Promise<{ 店舗ID: string; 店名: string }[]> {
  const rows = await 店舗一覧を検索する(page, 語);
  const out: { 店舗ID: string; 店名: string }[] = [];
  for (const r of await rows.all()) {
    const link = r.locator('a[href*="/mall/tenant/detail/"]').first();
    if ((await link.count()) === 0) continue;
    const 店名 = ((await link.textContent()) ?? "").trim();
    if (!店名.includes(語)) continue;
    out.push({ 店舗ID: ((await r.locator("td").nth(1).textContent()) ?? "").trim(), 店名 });
  }
  return out;
}

// ---- 試験用店舗（共通の試験データ） ----

export type 試験店舗 = "P1" | "P2";
/** 店名の末尾に付ける試験用店舗の印 */
export const 店舗の印 = (s: 試験店舗): string => `-M1015${s}`;
/** 正本の店名に、試験用店舗の印を付けた値 */
export const 試験店名 = (s: 試験店舗, 正本の店名: string): string => `${正本の店名}${店舗の印(s)}`;
/** ほかの試験用店舗と店名略称が重なったとき、どかす先の略称 */
const 控えの略称: Record<試験店舗, string> = { P1: "ZQ1", P2: "ZQ2" };

/** 試験用店舗の、シードが値を定めない項目の値（入力チェックを通る値。任意の項目は空） */
export function 既定の値(s: 試験店舗): Required<Omit<店舗の値, "ショップカラー">> {
  return {
    会社名: "更新前会社", "会社名(カナ)": "コウシンマエガイシャ", 店名: "更新前店舗", "店名(カナ)": "コウシンマエテンポ", "店名(英語表記)": "Before Shop",
    支店URL: `m1015pool${s === "P1" ? "a" : "b"}`, 店舗種別: "支店", 公開: "非公開", 開店: "開店", 売上集計の検索項目: "表示しない",
    郵便番号: "1000001", 都道府県: "東京都", 住所: "千代田区一丁目", 番地: "1-1", "住所(英語表記)": "1 Chiyoda Tokyo", "Google map埋め込みURL": "",
    電話番号: "0312345678", 店舗営業時間: "", "店舗営業時間(英語表記)": "",
    送信元メールアドレス: "before-from@example.com", 返信先メールアドレス: "before-reply@example.com",
    送信エラー通知メールアドレス: "before-error@example.com", 問い合わせ専用メールアドレス: "before-contact@example.com",
    高額商品閾値1: "", 高額商品閾値2: "", 高額商品閾値3: "", スマレジ店舗ID: "", スマレジ店舗コード: "", 取り扱い商品説明文: "", 店舗からのメッセージ: "",
    "店名略称（3文字）": 控えの略称[s], ショップ名略称: "更新前略称", "ショップ名略称（英語表記）": "BeforeShop", 表示順: "20", 席数: "",
    ピッキングリスト分割しきい値価格: "", スタック用紙高額商品しきい値価格: "", X公式アカウントURL: "", 店頭用アカウントIPアドレス: "",
    "送料無料条件（金額）": "", "送料無料条件（数量）": "", 適格請求書発行事業者登録番号: "",
  };
}

export type 整える指定 = {
  /** シード表の値（店名は正本の値。印はここで付ける） */
  値: 店舗の値;
  /** ショップアイコン: 画像を選び直す／外す／触らない（既定） */
  アイコン?: 画像 | "なし";
  /** ご当地晴れる屋くん: 画像を選び直す／外す／触らない（既定） */
  晴れる屋くん?: 画像 | "なし";
};

/**
 * 試験用店舗を用意し、全項目をシードの値（指定の無い項目は既定の値）へ入れ直して登録する。店舗IDを返す。
 * - 店舗一覧で店名に印を含む店舗を探し、無ければ新規登録で作る（1店だけのはず。2店以上は止める）。
 * - 店名略称（3文字）がほかの試験用店舗と重なるときは、ほかの試験用店舗の略称を控えの略称へどかしてから登録する。
 *   試験用でない店舗が使っているときは、共有の店舗を書き換えないので止める。
 * - 画面に入力欄の無い項目（ショップカラーなど）は入れられないので、onIssue で知らせる。
 */
export async function 試験店舗を整える(page: Page, s: 試験店舗, 指定: 整える指定, onIssue: (m: string) => void): Promise<string> {
  const v: 店舗の値 = { ...既定の値(s), ...指定.値 };
  v.店名 = 試験店名(s, v.店名 ?? "更新前店舗");
  const p = new TenantEditPage(page);
  let id = await 試験店舗のID(page, s);
  // 店名略称がほかの試験用店舗と重なるなら、そちらをどかす
  const 他 = (["P1", "P2"] as 試験店舗[]).filter((x) => x !== s);
  for (const o of 他) {
    const oid = await 試験店舗のID(page, o);
    if (!oid) continue;
    await p.直接開く(oid);
    await p.待つ();
    if ((await p.値("店名略称（3文字）")) === v["店名略称（3文字）"]) {
      await p.入れる("店名略称（3文字）", 控えの略称[o]);
      await 押して保存(p, `試験用店舗${o}の店名略称を控えの値へどかす`);
    }
  }
  if (id) await p.直接開く(id); else await p.新規を開く();
  await p.待つ();
  const 入らない = await p.入れる全部(v);
  for (const m of 入らない) onIssue(`${m}。この項目は入れずに登録した`);
  if (指定.アイコン === "なし") await p.画像を外す("アイコン");
  else if (指定.アイコン) await p.画像を選ぶ("アイコン", 指定.アイコン);
  if (指定.晴れる屋くん === "なし") await p.画像を外す("晴れる屋くん");
  else if (指定.晴れる屋くん) await p.画像を選ぶ("晴れる屋くん", 指定.晴れる屋くん);
  await 押して保存(p, `試験用店舗${s}（${v.店名}）の登録`);
  const got = p.店舗ID();
  if (!got) throw new Error(`試験用店舗${s}を登録したが、店舗登録画面のURLに店舗IDが無い（${page.url()}）`);
  if (id && got !== id) throw new Error(`試験用店舗${s}（店舗ID ${id}）を登録したら、別の店舗ID ${got} の画面へ移った`);
  id = got;
  if (指定.アイコン && 指定.アイコン !== "なし") {
    await p.直接開く(id); await p.待つ();
    if ((await p.画像の値("アイコン").inputValue()) === "") throw new Error(`試験用店舗${s}のショップアイコンに「${指定.アイコン.name}」を設定できなかった`);
  }
  return id;
}

async function 押して保存(p: TenantEditPage, what: string): Promise<void> {
  const r = await p.登録を押す();
  if (!r.sent) throw new Error(`${what}: ブラウザの入力チェックで送信が止まった（${r.止めた項目.join(" / ")}）`);
  const errs = await p.エラーの文();
  const 略称 = errs.find((e) => e.includes("登録済の略称"));
  if (略称) throw new Error(`${what}: 店名略称（3文字）を試験用でない店舗が使っている（${略称}）。共有の店舗は書き換えないので止める`);
  await expectSaved(p.page, what);
}

/** 試験用店舗の店舗ID（店名に印を含む店舗）。無ければ null */
export async function 試験店舗のID(page: Page, s: 試験店舗): Promise<string | null> {
  const found = await 店名で探す(page, 店舗の印(s));
  const mine = found.filter((f) => f.店名.endsWith(店舗の印(s)));
  if (mine.length > 1) throw new Error(`試験用店舗${s}の印「${店舗の印(s)}」の店舗が複数ある（${mine.map((m) => `${m.店舗ID}:${m.店名}`).join("、")}）。どれを使うか決められない`);
  return mine[0]?.店舗ID ?? null;
}

// ---- フロント・ほかの画面（下流の確かめ） ----

/** ログアウト状態の新しいブラウザセッション（フロント用）。閉じるのは呼び出し側 */
export async function 新しいセッション(browser: Browser, viewport: { width: number; height: number }): Promise<BrowserContext> {
  const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true, viewport });
  await hideDebugToolbar(ctx);
  return ctx;
}

/** お問い合わせ画面（フロント・ログアウト状態）。件名・お問い合わせ詳細を選び、お問い合わせ店舗選択の選択肢を読む */
export class 問い合わせ画面 {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }
  async 開く(): Promise<void> {
    await this.page.goto(`${BASE_URL}/ja/contact`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    await expect(this.page.locator('[name="contact[subject]"]'), "お問い合わせ画面の件名の欄").toBeAttached({ timeout: 60_000 });
  }
  async 件名を選ぶ(件名: string): Promise<void> { await this.page.locator('[name="contact[subject]"]').selectOption({ label: 件名 }); }
  async 詳細を選ぶ(詳細: string): Promise<void> {
    const sel = this.page.locator('[name="contact[subSubject]"]');
    if ((await sel.evaluate((e) => e.tagName)) === "SELECT") await sel.selectOption({ label: 詳細 });
    else await this.page.locator('[name="contact[subSubject]"]').and(this.page.getByLabel(詳細, { exact: true })).check();
  }
  get 店舗の欄(): Locator { return this.page.locator('select[name="contact[shop]"]'); }
  async 店舗の選択肢を開く(): Promise<void> {
    await expect(this.店舗の欄, "お問い合わせ店舗選択の欄").toBeVisible({ timeout: T });
    await this.店舗の欄.click();
  }
  async 店舗の選択肢(): Promise<{ 値: string; 表示: string }[]> {
    return this.店舗の欄.locator("option").evaluateAll((os) => os.map((o) => ({ 値: (o as HTMLOptionElement).value, 表示: (o.textContent ?? "").trim() })));
  }
}

/** 在庫検索一覧（管理画面）を開く */
export async function 在庫検索一覧を開く(page: Page): Promise<void> {
  const res = await page.goto(adminUrl("/product/stock"), { timeout: 60_000 });
  expect(res?.status() ?? 0, "在庫検索一覧の応答").toBeLessThan(400);
  await page.waitForLoadState("load");
  await expect(page.locator("#admin_search_stock_list_base_info"), "在庫検索一覧の店舗の欄").toBeAttached({ timeout: 60_000 });
}
/** 在庫検索一覧の店舗の欄（select2 の部品）を開き、選択肢（値＝店舗ID・表示名）を読む */
export async function 在庫検索一覧の店舗の選択肢を開く(page: Page): Promise<{ 値: string; 表示: string }[]> {
  const sel = page.locator("#admin_search_stock_list_base_info");
  const box = sel.locator("xpath=following-sibling::span[contains(@class,'select2')][1]");
  if ((await box.count()) > 0) {
    await box.locator(".select2-selection").click();
    await expect(page.locator(".select2-container--open .select2-results__option").first(), "店舗の選択肢の一覧").toBeVisible({ timeout: T });
  } else await sel.click();
  return sel.locator("option").evaluateAll((os) => os.map((o) => ({ 値: (o as HTMLOptionElement).value, 表示: (o.textContent ?? "").trim() })));
}

/** 日別・月別集計 集計一覧表示（管理画面）。集計対象(各店舗)のチェック欄 */
export class 集計一覧画面 {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }
  async 日別を開く(): Promise<void> {
    const res = await this.page.goto(adminUrl("/analysis/summary/daily"), { timeout: 60_000 });
    expect(res?.status() ?? 0, "日別・月別集計の画面の応答").toBeLessThan(400);
    await this.page.waitForLoadState("load");
    await expect(this.page.locator('input[name="admin_summary[summary_type]"]').first(), "集計タイプの欄").toBeAttached({ timeout: 60_000 });
  }
  /** 集計タイプの「月次」（値 monthly）を選ぶ。画面のスクリプトが月別の画面へ移す */
  async 月別を選ぶ(): Promise<string> {
    const r = this.page.locator('input[name="admin_summary[summary_type]"][value="monthly"]');
    const label = ((await r.evaluate((n) => (n as HTMLInputElement).labels?.item(0)?.textContent ?? "")) ?? "").trim();
    await Promise.all([this.page.waitForURL(/\/analysis\/summary\/monthly/, { timeout: 60_000 }), r.check()]);
    await this.page.waitForLoadState("load");
    return label;
  }
  async 検索枠を開く(): Promise<void> {
    const box = this.page.locator("#summarySearchDetail");
    if ((await box.count()) > 0 && !(await box.isVisible())) {
      const toggle = this.page.locator('[data-bs-target="#summarySearchDetail"], [href="#summarySearchDetail"]').first();
      if ((await toggle.count()) > 0) await toggle.click();
      await expect(box, "集計対象の検索枠").toBeVisible({ timeout: T });
    }
  }
  /** 集計対象(各店舗)のチェック欄（値＝店舗ID）と表示名 */
  async 集計対象の店舗(): Promise<{ 値: string; 表示: string }[]> {
    await expect(this.page.locator('input[name="admin_summary[store_sales_targets][]"]').first(), "集計対象(各店舗)のチェック欄").toBeAttached({ timeout: T });
    return this.page.locator('input[name="admin_summary[store_sales_targets][]"]').evaluateAll((es) => es.map((e) => ({
      値: (e as HTMLInputElement).value, 表示: ((e as HTMLInputElement).labels?.item(0)?.textContent ?? "").trim(),
    })));
  }
}
