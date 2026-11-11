/** F06-25 店頭モニター（番号札表示）の操作。アドレス・セレクタはここだけに書く。正本: cases/F06-25_test_cases.tsv */
import { Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export class WaitingPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(30_000); }
  /** 店頭モニターを開く。応答の状態を返す */
  async 開く(path: string): Promise<number> {
    const res = await this.page.goto(`${BASE_URL}${path}`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
  get 番号札の枠(): Locator { return this.page.locator("#numberOuter"); }
  get WiFi欄(): Locator { return this.page.locator("#wifi"); }
  async モニター画面である(): Promise<boolean> { return (await this.番号札の枠.count()) > 0; }

  // ---- 定期取得と音声（F06-25） ----
  /** 画面の音声（番号札が増えたときに鳴らす音）の再生回数を数える仕掛けを、画面を開く前に入れる（音は実際には聞けないので、再生の呼び出しを数える） */
  async 音声を数える(): Promise<void> {
    await this.page.addInitScript(() => {
      const w = window as unknown as { __sePlays: number };
      w.__sePlays = 0;
      const original = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
        if (this.id === "se") w.__sePlays += 1;
        const r = original.call(this);
        if (r && typeof r.catch === "function") r.catch(() => undefined);
        return r;
      };
    });
  }
  async 音声の再生回数(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as { __sePlays?: number }).__sePlays ?? 0);
  }
  /** 店頭モニターを開き、最初の番号札の取得が済むまで待つ。取得結果（番号札の並び）を返す */
  async 開いて初回取得を待つ(path: string): Promise<(string | number)[]> {
    const got = this.page.waitForResponse((r) => /\/waiting_api\/get_waiting_number\//.test(r.url()), { timeout: 60_000 });
    const res = await this.page.goto(`${BASE_URL}${path}`, { timeout: 60_000 });
    if ((res?.status() ?? 0) !== 200) throw new Error(`店頭モニター ${path} が開かない（${res?.status() ?? 0}）`);
    const list = (await (await got).json()) as (string | number)[];
    await this.page.waitForTimeout(500); // 取得結果で音を鳴らす処理が済むのを待つ
    return list;
  }
  /** 次の定期取得（10秒ごと）を待ち、その取得結果を返す。条件が与えられたら、条件を満たす取得結果まで待つ（最大 maxMs） */
  async 次の取得を待つ(条件: (list: (string | number)[]) => boolean = () => true, maxMs = 45_000): Promise<(string | number)[]> {
    const deadline = Date.now() + maxMs;
    for (;;) {
      const left = deadline - Date.now();
      if (left <= 0) throw new Error("条件を満たす番号札の取得が、待っても来ない");
      const res = await this.page.waitForResponse((r) => /\/waiting_api\/get_waiting_number\//.test(r.url()), { timeout: left });
      const list = (await res.json()) as (string | number)[];
      if (条件(list)) {
        await this.page.waitForTimeout(500);
        return list;
      }
    }
  }
  /** 画面に表示されている番号札（空の枠を除く） */
  async 表示中の番号札(): Promise<string[]> {
    return (await this.page.locator("#numberOuter .p-hareruya-waiting-number__value").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
  }
}
