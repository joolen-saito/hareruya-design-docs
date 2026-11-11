/**
 * M06-04 買取ステータス変更の画面操作（店頭買取の買取詳細・ステータス変更、権限管理の読み取り、申込の検索）。セレクタはここにだけ書く。
 *
 * 画面の作り（アプリのテンプレートで確かめた）:
 * - 買取詳細はアドレス末尾が店頭買取受注ID。一覧の「査定ID」の列は査定番号を出し、そのリンクが買取詳細を開く。
 * - 買取詳細の下の操作の帯に「経理払い出し済」「入庫済みにする」「ステータス変更」「保存」がある（正本の「経理払い出し済み」「入庫済み」ボタン）。
 *   「経理払い出し済」は確認のダイアログ（OK／キャンセル）を出してから送る。
 * - ステータス変更画面は「査定番号」「現在のステータス」と、変更後のステータスの選択欄（初めは「ステータスを選択」）・「保存」ボタン。
 *   正本の「戻る」ボタンは、画面左下のリンク「店頭買取詳細」（アイコンつき）。
 * - 買取詳細の「ステータス変更履歴」は 変更日時（年/月/日 時:分:秒）・ステータス・変更者 の表で、新しい順に並ぶ。
 * - 権限管理は、権限（行）ごとに、アクセスURLの権限（列）のチェック欄を持つ表。チェックが付いている＝許可、外れている＝拒否。
 */
import { Dialog, expect, Page, Response } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { OtcListPage } from "./m06_otc_list";

const OPEN = 30_000;

/** 権限管理の表の、アクセスURL（列）。アプリの権限URLの登録値 */
export const 権限URL = {
  買取一覧: "/otcbuyorder(/page/\\d+)?$",
  買取詳細: "/otcbuyorder/\\d+$",
  ステータス変更画面: "/otcbuyorder/status/\\d+$",
  経理払い出し済と入庫済み: "/otcbuyorder/\\d+/(restocked|account_team_paid)$",
} as const;

/** 権限管理を開き、権限の名前ごとに「アクセスURL → 許可（チェックあり）か」を読む */
export async function 権限の許可を読む(page: Page): Promise<Map<string, Map<string, boolean>>> {
  const res = await page.goto(adminUrl("/setting/system/authority"), { timeout: 60_000 });
  if (!res || !res.ok()) throw new Error(`権限管理を開けない（応答 ${res?.status() ?? "なし"}）`);
  await expect(page.locator("#table-authority"), "権限管理の表").toBeVisible({ timeout: OPEN });
  const rows = await page.locator("#table-authority tbody tr").evaluateAll((trs) => trs.map((tr) => ({
    name: (tr.querySelector("th")?.textContent ?? "").replace(/\s+/g, " ").trim(),
    boxes: Array.from(tr.querySelectorAll("input.permission-checkbox")).map((b) => ({ url: (b as HTMLInputElement).dataset.url ?? "", on: (b as HTMLInputElement).checked })),
  })));
  const out = new Map<string, Map<string, boolean>>();
  for (const r of rows) {
    const m = new Map<string, boolean>();
    for (const b of r.boxes) m.set(b.url, (m.get(b.url) ?? true) && b.on);
    out.set(r.name, m);
  }
  return out;
}

/** 権限が、指定のアクセスURLをすべて許可しているか（列が無いURLは拒否の設定が無い＝許可とみなす） */
export function 許可している(perm: Map<string, boolean> | undefined, urls: string[]): boolean {
  return !!perm && urls.every((u) => perm.get(u) !== false);
}

/** 権限が、指定のアクセスURLをすべて拒否しているか（列が無ければ拒否していない） */
export function 拒否している(perm: Map<string, boolean> | undefined, urls: string[]): boolean {
  return !!perm && urls.every((u) => perm.get(u) === false);
}

/** 買取一覧で申込者名を検索し（登録直後は検索に出るまで遅れることがあるので、数回検索し直す）、1件の行の査定IDを返す */
export async function 申込者名で査定IDを探す(page: Page, 申込者名: string, 店名: string): Promise<string> {
  const list = new OtcListPage(page);
  let last = "";
  for (let i = 0; i < 6; i++) {
    if (i > 0) await page.waitForTimeout(5_000);
    await list.open();
    await list.日時を空にする();
    await list.買取店舗を選ぶ(店名);
    await list.申込者名を入れる(申込者名);
    await list.検索する();
    const rows = (await list.結果の表().count()) === 0 ? [] : await list.行();
    if (rows.length === 1) return rows[0].査定ID;
    last = JSON.stringify(rows);
    if (rows.length > 1) break;
  }
  throw new Error(`買取一覧で申込者名「${申込者名}」（買取店舗「${店名}」）の買取が1件にならない（${last}）`);
}

/** 買取一覧の査定IDのリンクから買取詳細を開き、アドレス末尾の店頭買取受注IDを返す（一覧に検索結果が出ている状態で呼ぶ） */
export async function 一覧から詳細を開く(page: Page, 査定ID: string): Promise<string> {
  await new OtcListPage(page).詳細を開く(査定ID);
  const m = /\/otcbuyorder\/(\d+)(\?|$)/.exec(page.url());
  if (!m) throw new Error(`査定ID ${査定ID} のリンクから買取詳細が開かない（${page.url()}）`);
  return m[1];
}

/** 「経理払い出し済」を押したあとの確認のダイアログ（OK／キャンセルに答えると、送信の応答を返す。送られなければ null） */
export type 経理払い出し済の確認 = { ダイアログ: Dialog | null; 確認に答える: (ok: boolean) => Promise<Response | null> };

/** 買取詳細 */
export class OtcOrderDetailPage {
  constructor(readonly page: Page) {}

  /** アドレスで買取詳細を開く（店頭買取受注ID）。応答の状態を返す */
  async open(受注ID: string): Promise<number> {
    const res = await this.page.goto(adminUrl(`/otcbuyorder/${受注ID}`), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }

  /** いま買取詳細を開いているか（店頭買取受注IDの指定があれば、その買取か） */
  開いている(受注ID?: string): boolean {
    const m = /\/otcbuyorder\/(\d+)$/.exec(new URL(this.page.url()).pathname);
    return !!m && (受注ID === undefined || m[1] === 受注ID);
  }

  /** 操作履歴の欄の項目の値（「査定番号」「ステータス」「買取キャンセル日時」など） */
  async 項目(見出し: string): Promise<string> {
    const v = this.page.locator(`xpath=//div[contains(@class,"row")][div[contains(@class,"col-3")]/strong[normalize-space()="${見出し}"]]/div[contains(@class,"col-9")]`).first();
    await expect(v, `買取詳細の「${見出し}」`).toBeAttached({ timeout: OPEN });
    return ((await v.textContent({ timeout: OPEN })) ?? "").replace(/\s+/g, " ").trim();
  }

  /** ステータス変更履歴（画面の並び＝新しい順） */
  async 履歴(): Promise<{ 変更日時: string; ステータス: string; 変更者: string }[]> {
    const card = this.page.locator(".card").filter({ has: this.page.locator(".card-header", { hasText: "ステータス変更履歴" }) });
    await expect(card, "買取詳細のステータス変更履歴の欄").toBeVisible({ timeout: OPEN });
    return card.locator("table tbody tr").evaluateAll((trs) => trs.map((tr) => {
      const td = (i: number) => (tr.querySelectorAll("td")[i]?.textContent ?? "").replace(/\s+/g, " ").trim();
      return { 変更日時: td(0), ステータス: td(1), 変更者: td(2) };
    }));
  }

  /** 画面上部の成功・エラーのメッセージ（開発用の設定の帯は除く） */
  async 上部のメッセージ(): Promise<string[]> {
    const t = await this.page.locator(".alert").allInnerTexts();
    return t.map((s) => s.replace(/\s+/g, " ").trim()).filter((s) => s && !s.includes("デバッグモードが有効になっています"));
  }

  /** 「ステータス変更」を押してステータス変更画面を開く */
  async ステータス変更を押す(): Promise<void> {
    await Promise.all([this.page.waitForURL(/\/otcbuyorder\/status\/\d+/, { timeout: 60_000 }), this.page.getByRole("link", { name: "ステータス変更", exact: true }).click({ timeout: OPEN })]);
    await this.page.waitForLoadState("load");
  }

  /**
   * 「経理払い出し済」を押し、確認のダイアログが出るのを待つ（ダイアログには答えない。答えるのは 確認に答える）。
   * ダイアログが出なければ ダイアログ は null（そのまま送信される）。
   */
  async 経理払い出し済を押す(): Promise<経理払い出し済の確認> {
    const btn = this.page.locator('button[form="update_status_account_team_paid"]');
    await expect(btn, "買取詳細の「経理払い出し済」ボタン").toBeVisible({ timeout: OPEN });
    const res = this.page.waitForResponse((r) => r.request().method() === "POST" && /\/otcbuyorder\/\d+\/account_team_paid$/.test(new URL(r.url()).pathname), { timeout: 60_000 }).catch(() => null);
    const dlg = this.page.waitForEvent("dialog", { timeout: 10_000 }).catch(() => null);
    // 送信のあとの画面（転送先の買取詳細）の読み込みを待つ。同じアドレスへ戻るので、アドレスの変化では待てない
    const loaded = this.page.waitForEvent("load", { timeout: 60_000 }).catch(() => null);
    const click = btn.click({ timeout: OPEN, noWaitAfter: true }).catch(() => undefined);
    const ダイアログ = await dlg;
    if (!ダイアログ) await click;
    const page = this.page;
    return {
      ダイアログ,
      async 確認に答える(ok: boolean) {
        if (ダイアログ) await (ok ? ダイアログ.accept() : ダイアログ.dismiss());
        await click;
        if (!ok && ダイアログ) return null;
        const r = await res;
        if (r) await loaded;
        await page.waitForLoadState("load");
        return r;
      },
    };
  }

  /** 「入庫済みにする」を押す。送信の応答（送られなかったら null）を返す */
  async 入庫済みにするを押す(): Promise<Response | null> {
    const btn = this.page.locator('button[form="update_status_restocked"]');
    await expect(btn, "買取詳細の「入庫済みにする」ボタン").toBeVisible({ timeout: OPEN });
    const res = this.page.waitForResponse((r) => r.request().method() === "POST" && /\/otcbuyorder\/\d+\/restocked$/.test(new URL(r.url()).pathname), { timeout: 30_000 }).catch(() => null);
    const loaded = this.page.waitForEvent("load", { timeout: 60_000 }).catch(() => null);
    await btn.click({ timeout: OPEN });
    const r = await res;
    if (r) await loaded;
    await this.page.waitForLoadState("load");
    return r;
  }
}

/** ステータス変更画面 */
export class OtcStatusChangePage {
  constructor(readonly page: Page) {}

  readonly 選択欄 = () => this.page.locator('form#form select[name$="[otc_buy_order_status]"]');
  readonly トークン = () => this.page.locator('form#form input[name$="[_token]"]');

  /** アドレスでステータス変更画面を開く（店頭買取受注ID）。応答の状態を返す */
  async open(受注ID: string | number): Promise<number> {
    const res = await this.page.goto(adminUrl(`/otcbuyorder/status/${受注ID}`), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }

  /** いまステータス変更画面（入力の画面）を開いているか */
  async 開いている(受注ID?: string): Promise<boolean> {
    const p = new URL(this.page.url()).pathname;
    const m = /\/otcbuyorder\/status\/(\d+)(\/update)?$/.exec(p);
    if (!m || (受注ID !== undefined && m[1] !== 受注ID)) return false;
    return (await this.選択欄().count()) === 1;
  }

  /** 画面の項目（「査定番号」「現在のステータス」）の値 */
  async 項目(見出し: "査定番号" | "現在のステータス"): Promise<string> {
    const v = this.page.locator(`xpath=//div[contains(@class,"row")][div[contains(@class,"col-3")]/strong[normalize-space()="${見出し}"]]/div[contains(@class,"col-9")]`).first();
    await expect(v, `ステータス変更画面の「${見出し}」`).toBeAttached({ timeout: OPEN });
    return ((await v.textContent({ timeout: OPEN })) ?? "").replace(/\s+/g, " ").trim();
  }

  /** 変更後のステータスの、選択されている選択肢（値と表示） */
  async 選択中(): Promise<{ 値: string; 表示: string }> {
    const sel = this.選択欄();
    await expect(sel, "変更後のステータスの選択欄").toBeVisible({ timeout: OPEN });
    return sel.evaluate((s) => { const e = s as HTMLSelectElement; const o = e.selectedOptions[0]; return { 値: e.value, 表示: (o?.textContent ?? "").trim() }; });
  }

  /** 変更後のステータスの選択肢（値が空の「ステータスを選択」は除く） */
  async 選択肢(): Promise<string[]> {
    const sel = this.選択欄();
    await expect(sel, "変更後のステータスの選択欄").toBeVisible({ timeout: OPEN });
    return sel.locator("option").evaluateAll((os) => os.filter((o) => (o as HTMLOptionElement).value !== "").map((o) => (o.textContent ?? "").trim()));
  }

  /** 変更後のステータスを選ぶ */
  async 選ぶ(表示: string): Promise<void> {
    const have = await this.選択肢();
    if (!have.includes(表示)) throw new Error(`変更後のステータスに「${表示}」が無い（ある選択肢: ${have.join("、")}）`);
    await this.選択欄().selectOption({ label: 表示 }, { timeout: OPEN });
  }

  /** 開発者ツールの操作の代わり: 変更後のステータスに選択肢を足して選ぶ */
  async 選択肢を足して選ぶ(値: string, 表示: string): Promise<void> {
    await this.選択欄().evaluate((s, a) => {
      const e = s as HTMLSelectElement;
      const o = document.createElement("option");
      o.value = a.値; o.textContent = a.表示;
      e.appendChild(o);
      e.value = a.値;
      e.dispatchEvent(new Event("change", { bubbles: true }));
    }, { 値, 表示 });
  }

  /** 開発者ツールの操作の代わり: なりすまし対策トークンの入力要素を消す */
  async トークンを消す(): Promise<number> {
    const n = await this.トークン().count();
    await this.トークン().evaluateAll((es) => es.forEach((e) => e.remove()));
    return n;
  }

  /** 開発者ツールの操作の代わり: なりすまし対策トークンの値を変える */
  async トークンを変える(値: string): Promise<void> {
    await expect(this.トークン(), "なりすまし対策トークンの入力要素").toHaveCount(1, { timeout: OPEN });
    await this.トークン().evaluate((e, v) => { (e as HTMLInputElement).value = v; }, 値);
  }

  /**
   * 「保存」を押す。送信されたら、その応答（最初の応答。転送の前のもの）を返す。
   * ブラウザの入力チェックが送信を止めたら sent=false（止めた項目の検証メッセージを返す）。
   */
  async 保存を押す(): Promise<{ sent: boolean; 応答の状態: number | null; 止めた理由: string }> {
    const req = this.page.waitForRequest((r) => r.method() === "POST" && /\/otcbuyorder\/status\/\d+\/update$/.test(new URL(r.url()).pathname), { timeout: 10_000 }).catch(() => null);
    // 送信のあとの画面の読み込みを待つ（開き直しは同じアドレスへ戻ることがあるので、アドレスの変化では待てない）
    const loaded = this.page.waitForEvent("load", { timeout: 60_000 }).catch(() => null);
    await this.page.getByRole("button", { name: "保存", exact: true }).click({ timeout: OPEN });
    const r = await req;
    if (!r) {
      const why = await this.選択欄().evaluate((s) => (s as HTMLSelectElement).validationMessage).catch(() => "");
      return { sent: false, 応答の状態: null, 止めた理由: why };
    }
    const res = await r.response();
    await loaded;
    await this.page.waitForLoadState("load");
    return { sent: true, 応答の状態: res?.status() ?? null, 止めた理由: "" };
  }

  /** 画面左下の「店頭買取詳細」（正本の「戻る」ボタン）を押す */
  async 戻るを押す(): Promise<void> {
    const link = this.page.getByRole("link", { name: "店頭買取詳細" });
    await expect(link, "ステータス変更画面の「店頭買取詳細」（戻る）").toBeVisible({ timeout: OPEN });
    await Promise.all([this.page.waitForURL(/\/otcbuyorder\/\d+(\?|$)/, { timeout: 60_000 }), link.click({ timeout: OPEN })]);
    await this.page.waitForLoadState("load");
  }

  /** 不正な項目を示す表示（入力欄の赤枠・項目のエラー文）の数 */
  async 不正項目の表示の数(): Promise<number> {
    return this.page.locator("form#form .is-invalid, form#form .invalid-feedback, form#form .form-error-message").evaluateAll((es) =>
      es.filter((e) => (e as HTMLElement).offsetParent !== null || e.classList.contains("is-invalid")).length);
  }
}
