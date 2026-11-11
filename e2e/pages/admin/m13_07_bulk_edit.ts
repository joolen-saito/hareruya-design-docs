/**
 * M13-07 イベント申込一括編集（イベント申込一覧の「一括編集」で開くイベント申込一括更新の入力領域）の画面操作。セレクタはここだけに書く。
 * 一覧そのものの操作は M13-06 の部品（pages/admin/m13_06_entry_list.ts の EntryListPage）を使い、変えない。
 *
 * 画面の作り（アプリの Twig: admin/Event/Entry/index.twig で確かめたもの）:
 * - 検索結果の行の先頭のチェックボックスは、編集できる店舗の申込の行にだけ出る（申込IDを data 属性に持つ）。
 * - 「一括編集」のリンクで重ねて表示する入力領域を開く。申込状況の選択欄と「更新」ボタン、画面内のトークンがある。
 * - 「更新」は、チェックした申込が無ければ確認のダイアログ（画面のアラート）を出して要求を送らない。
 *   チェックがあれば非同期の要求を送り、応答のメッセージをアラートで出す。
 */
import { Dialog, Locator, Page, Response, expect } from "@playwright/test";
import { EntryListPage, 結果の行 } from "./m13_06_entry_list";

/** 一括更新の要求への応答 */
export type 一括更新の応答 = { status: number; 本文: string };

/** 「更新」を押してダイアログが出たところ（ダイアログは閉じずに返す） */
export type 更新を押した結果 = {
  /** ダイアログの文 */
  文: string;
  /** 一括更新の要求を送ったときの応答。送らなかったら null */
  応答: 一括更新の応答 | null;
  /** ダイアログを閉じる（OK を押す）。そのあと画面が移った（再読み込みを含む）かを返す */
  閉じる: () => Promise<{ 画面が移った: boolean }>;
};

const 一括更新のパス = /\/event\/entry\/bulk_update$/;

export class BulkEditPage {
  readonly 一覧: EntryListPage;
  constructor(readonly page: Page) { this.一覧 = new EntryListPage(page); }

  get 入力領域() { return this.page.locator("#bulkUpdateModal"); }
  get 申込状況() { return this.page.locator("#admin_entry_bulk_update_entryStatus"); }
  get トークン() { return this.page.locator("#admin_entry_bulk_update__token"); }
  get 更新ボタン() { return this.page.locator("#bulkUpdateModalButton"); }
  行のチェック(申込ID: string): Locator { return this.一覧.結果の表.locator(`input.playerCheck[data-entry_id="${申込ID}"]`); }
  get チェックされた行() { return this.一覧.結果の表.locator("input.playerCheck:checked"); }

  /** イベント申込一覧を開き、イベント名を入れて検索する（店舗・開始時間などは初期表示のまま）。入れたままの店舗・開始時間(From)を返す */
  async イベント名で検索する(語: string): Promise<{ 店舗: string[]; 開始時間From: string }> {
    await this.一覧.開く();
    await this.一覧.イベント名.fill(語);
    const 店舗 = await this.一覧.選ばれている店舗();
    const 開始時間From = await this.一覧.開始時間From.inputValue();
    await this.一覧.検索する();
    return { 店舗, 開始時間From };
  }

  async 行を読む(申込ID: string): Promise<結果の行 | undefined> {
    return (await this.一覧.行を読む()).find((r) => r.申込ID === 申込ID);
  }
  /** 行の「申込日時、支払状況、番号」の欄の2行目（申込状況の名前） */
  async 行の申込状況(申込ID: string): Promise<string> {
    const r = await this.行を読む(申込ID);
    if (!r) throw new Error(`イベント申込一覧の検索結果に申込ID ${申込ID} の行が無い`);
    return (r.申込欄.split("\n")[1] ?? "").trim();
  }

  async チェックする(申込ID: string): Promise<void> {
    const c = this.行のチェック(申込ID);
    await expect(c, `検索結果の申込ID ${申込ID} の行のチェックボックス`).toHaveCount(1);
    await c.check();
  }
  async チェックされているか(申込ID: string): Promise<boolean> {
    const c = this.行のチェック(申込ID);
    if ((await c.count()) === 0) return false;
    return c.isChecked();
  }

  async 一括編集を開く(): Promise<void> {
    await this.一覧.一括編集リンク.click({ timeout: 30_000 });
    await expect(this.入力領域, "イベント申込一括更新の入力領域").toBeVisible({ timeout: 30_000 });
  }
  async 申込状況を選ぶ(名前: string): Promise<void> {
    await this.申込状況.selectOption({ label: 名前 });
  }

  /** 「更新」を押し、ダイアログが出るまで待つ。ダイアログは閉じずに返す（閉じるのは返した 閉じる()） */
  async 更新を押す(): Promise<更新を押した結果> {
    const 応答: Response[] = [];
    const onResponse = (r: Response) => {
      if (r.request().method() === "POST" && 一括更新のパス.test(new URL(r.url()).pathname)) 応答.push(r);
    };
    this.page.on("response", onResponse);
    let dialog!: Dialog;
    let clickP!: Promise<void>;
    try {
      const dialogP = this.page.waitForEvent("dialog", { timeout: 60_000 });
      clickP = this.更新ボタン.click({ timeout: 30_000 });
      dialog = await dialogP;
    } finally {
      this.page.off("response", onResponse);
    }
    const r = 応答[0];
    const 中身 = r ? { status: r.status(), 本文: await r.text().catch(() => "") } : null;
    return {
      文: dialog.message(),
      応答: 中身,
      閉じる: async () => {
        const main = this.page.mainFrame();
        const nav = this.page.waitForEvent("framenavigated", { predicate: (f) => f === main, timeout: 10_000 }).then(() => true, () => false);
        await dialog.accept();
        await clickP.catch(() => undefined);
        const moved = await nav;
        if (moved) await this.page.waitForLoadState("load");
        return { 画面が移った: moved };
      },
    };
  }

  /** 画面に印を付ける（再読み込み・画面の移動があると消える） */
  async 印を付ける(印: string): Promise<void> {
    await this.page.evaluate((v) => { (window as unknown as Record<string, string>).__e2eM1307 = v; }, 印);
  }
  async 印が残っているか(印: string): Promise<boolean> {
    return this.page.evaluate((v) => (window as unknown as Record<string, string>).__e2eM1307 === v, 印);
  }

  /** 「更新」ボタンの送信先と、入力領域の申込状況・トークンの項目名と値（入力領域で選んだ値） */
  private async 送る中身(): Promise<{ url: string; 状況名: string; 状況値: string; トークン名: string; トークン値: string }> {
    const url = (await this.更新ボタン.getAttribute("data-url")) ?? "";
    if (!url) throw new Error("「更新」ボタンに送信先が無い");
    return {
      url,
      状況名: (await this.申込状況.getAttribute("name")) ?? "",
      状況値: await this.申込状況.inputValue(),
      トークン名: (await this.トークン.getAttribute("name")) ?? "",
      トークン値: await this.トークン.inputValue(),
    };
  }

  /** 開発者ツールから送るのと同じに、「更新」の送信先へ非同期の要求を送る（申込IDは渡したもの、申込状況とトークンは画面の値） */
  async 非同期で送る(申込ID: string[]): Promise<一括更新の応答> {
    const v = await this.送る中身();
    return this.page.evaluate(async ({ v, ids }) => {
      const body = new URLSearchParams();
      for (const id of ids) body.append("entries[]", id);
      body.append(v.状況名, v.状況値);
      body.append(v.トークン名, v.トークン値);
      const res = await fetch(v.url, { method: "POST", body, credentials: "same-origin", headers: { "X-Requested-With": "XMLHttpRequest", Accept: "application/json" } });
      return { status: res.status, 本文: await res.text() };
    }, { v, ids: 申込ID });
  }

  /** 開発者ツールで通常のHTMLフォームを作って、「更新」の送信先へ送る（非同期でない）。移った画面の応答を返す */
  async 通常のフォームで送る(申込ID: string[]): Promise<一括更新の応答> {
    const v = await this.送る中身();
    const [res] = await Promise.all([
      this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }),
      this.page.evaluate(({ v, ids }) => {
        const form = document.createElement("form");
        form.method = "post";
        form.action = v.url;
        const add = (name: string, value: string) => {
          const i = document.createElement("input");
          i.type = "hidden"; i.name = name; i.value = value;
          form.appendChild(i);
        };
        for (const id of ids) add("entries[]", id);
        add(v.状況名, v.状況値);
        add(v.トークン名, v.トークン値);
        document.body.appendChild(form);
        form.submit();
      }, { v, ids: 申込ID }),
    ]);
    return { status: res?.status() ?? 0, 本文: (await this.page.locator("body").innerText().catch(() => "")).trim() };
  }
}
