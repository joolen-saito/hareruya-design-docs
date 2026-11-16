/**
 * M16-06 買取価格対応表（一覧）（メニュー「データ管理」→「買取価格対応表」）。
 *
 * 画面の作り（アプリのテンプレート・コントローラーで確かめた。Admin/Data/buy_price_list.twig・BuyPriceListController）:
 * - 表の見出しは2段。1段目は「NM価格」（2段ぶん）・「ノーマルカード」・「Foil&プロモ版カード」、2段目はカード状態のコード（SP・MP・HP）を
 *   ノーマルカード・Foil&プロモ版カードの順に2回並べる。
 * - 本文は NM価格ごとに1行。1列目が「¥ 1,000」の形の NM価格（リンクなし）、続いてノーマルカードの状態ごと、Foil&プロモ版カードの状態ごとの
 *   買取価格。登録のある組は買取価格対応表（編集）へのリンク（「¥ 900」の形）、無い組は「-」。
 * - 入力欄・絞り込み・ページ送りは作られていない。行を足す・消す画面は無い（買取価格の更新だけ）。
 */
import { Locator, Page, expect } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { BuyPriceEditPage } from "./m16_07_buy_price";
import { expectSaved } from "./common";

const OPEN = 60_000;

export type 区分 = "ノーマル" | "Foil&プロモ";
export type 状態 = "SP" | "MP" | "HP";

/** 1つの組（NM価格・区分・状態）の欄の中身 */
export type 欄 = { 区分: 区分; 状態: string; 文: string; 金額: number | null; リンク: boolean; 識別ID: string | null };
export type 一覧の行 = { NM価格の文: string; NM価格: number | null; NM価格のリンク数: number; 欄: 欄[] };

/** 「¥ 1,000」「￥1,000」などから数を読む（数字が無ければ null） */
export function 金額を読む(文: string): number | null {
  const d = 文.replace(/[^\d]/g, "");
  return d ? Number(d) : null;
}

export class BuyPriceListPage {
  constructor(readonly page: Page) {}

  readonly 表 = (): Locator => this.page.locator("table.buy-price-list-table");
  readonly 本文の行 = (): Locator => this.表().locator("tbody tr");
  /** 本文の領域（ヘッダーのメニュー・検索窓を除いた、画面の中身） */
  readonly 本文の領域 = (): Locator => this.page.locator(".c-contentsArea__primaryCol");

  async 開く(): Promise<number> {
    const res = await this.page.goto(adminUrl("/data/buy_price_list"), { timeout: OPEN });
    await this.page.waitForLoadState("load");
    await expect(this.表(), "買取価格対応表（一覧）の表").toBeVisible({ timeout: OPEN });
    return res?.status() ?? 0;
  }

  /** 1段目の見出し（NM価格・ノーマルカード・Foil&プロモ版カード） */
  async 一段目の見出し(): Promise<string[]> {
    return (await this.表().locator("thead tr").nth(0).locator("th").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  }

  /** 2段目の見出し（カード状態のコード。ノーマルカードの分・Foil&プロモ版カードの分の順） */
  async 二段目の見出し(): Promise<string[]> {
    return (await this.表().locator("thead tr").nth(1).locator("th").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  }

  /** 本文の行を全部読む（表示順） */
  async 行を読む(絞り込んだ行?: Locator): Promise<一覧の行[]> {
    const codes = await this.二段目の見出し();
    const n = codes.length / 2;
    const raw = await (絞り込んだ行 ?? this.本文の行()).evaluateAll((trs) => trs.map((tr) => Array.from(tr.querySelectorAll("td")).map((td) => {
      const a = td.querySelector("a");
      return { 文: (td.textContent ?? "").replace(/\s+/g, " ").trim(), href: a ? a.getAttribute("href") ?? "" : null, リンク数: td.querySelectorAll("a").length };
    })));
    return raw.map((tds) => ({
      NM価格の文: tds[0]?.文 ?? "",
      NM価格: 金額を読む(tds[0]?.文 ?? ""),
      NM価格のリンク数: tds[0]?.リンク数 ?? 0,
      欄: tds.slice(1).map((td, i) => ({
        区分: (i < n ? "ノーマル" : "Foil&プロモ") as 区分,
        状態: codes[i] ?? "",
        文: td.文,
        金額: td.href === null ? null : 金額を読む(td.文),
        リンク: td.href !== null,
        識別ID: td.href === null ? null : (/buy_price_list\/(\d+)\/edit/.exec(td.href)?.[1] ?? null),
      })),
    }));
  }

  /** NM価格の行（NM価格の数が一致する行） */
  async NM価格の行(nm: number): Promise<一覧の行[]> {
    return (await this.行を読む()).filter((r) => r.NM価格 === nm);
  }

  /** NM価格の行だけを読む（読むのはその行の要素だけなので、画像の赤枠もその行だけに付く） */
  async NM価格の行だけを読む(nm: number): Promise<一覧の行[]> {
    return this.行を読む(this.NM価格の行の要素(nm));
  }

  /** NM価格の行の、区分・状態の欄（行が1つでなければ、欄が無ければ投げる） */
  async 欄を読む(nm: number, 区: 区分, 状: 状態): Promise<欄> {
    const rows = await this.NM価格の行(nm);
    if (rows.length !== 1) throw new Error(`NM価格 ${nm} の行が ${rows.length} 行（1行のはず）`);
    const c = rows[0].欄.find((x) => x.区分 === 区 && x.状態 === 状);
    if (!c) throw new Error(`NM価格 ${nm} の行に、${区}・${状}の欄が無い`);
    return c;
  }

  /** NM価格の行の Locator（1列目の文で絞る） */
  NM価格の行の要素(nm: number): Locator {
    const 文 = `¥ ${nm.toLocaleString("en-US")}`;
    return this.本文の行().filter({ has: this.page.locator("td:first-child", { hasText: new RegExp(`^\\s*${文.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) }) });
  }

  /** NM価格の行の、区分・状態の欄の中の価格のリンク */
  async 価格のリンク(nm: number, 区: 区分, 状: 状態): Promise<Locator> {
    const codes = await this.二段目の見出し();
    const n = codes.length / 2;
    const i = codes.slice(0, n).indexOf(状);
    if (i < 0) throw new Error(`見出しに状態「${状}」が無い（${codes.join("・")}）`);
    const col = 1 + (区 === "ノーマル" ? 0 : n) + i; // 0 始まりの td の位置
    return this.NM価格の行の要素(nm).locator("td").nth(col).locator("a");
  }

  /** 本文の領域で見える入力部品（隠し項目を除く input・select・textarea・ボタン）の数 */
  async 本文の入力部品の数(): Promise<number> {
    return this.本文の領域().locator('input:not([type="hidden"]), select, textarea, button').count();
  }

  /** 本文の領域の絞り込みの部品（検索のフォーム・絞り込みの選ぶ欄）の数 */
  async 本文の絞り込みの数(): Promise<number> {
    return this.本文の領域().locator('form, [id*="search"], [class*="search"]').count();
  }

  /** ページ送りの部品の数 */
  async ページ送りの数(): Promise<number> {
    return this.page.locator("ul.pagination, .pagination, #page_count_pulldown").count();
  }
}

/** 買取価格対応表（編集）で、識別IDの行の買取価格を書き換えて更新する（成功の表示まで確かめる） */
export async function 買取価格を書き換える(page: Page, 識別ID: string, 価格: number): Promise<void> {
  const p = new BuyPriceEditPage(page);
  const status = await p.開く(識別ID);
  if (status !== 200) throw new Error(`買取価格対応表（編集）（識別ID ${識別ID}）を開けない（応答 ${status}）`);
  if ((await p.買取価格()) === String(価格)) return;
  await p.入力する(String(価格));
  await p.更新を押す();
  await expectSaved(page, `買取価格対応表（識別ID ${識別ID}）の買取価格を ${価格} にする`);
}
