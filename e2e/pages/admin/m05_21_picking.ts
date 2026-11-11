/**
 * M05-21 ピッキングリスト印刷の画面部品。出荷指示リスト詳細（出荷指示リスト編集）画面で受注を選び「ピッキングリスト印刷」を押すと、
 * 新しいウィンドウにピッキングリスト印刷画面が開く（画面の作りは admin/ShippingStandby/edit.twig・picking_list.twig）。
 * セレクタはここだけに書く。正本: cases/M05-21_test_cases.tsv
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { StandbyDetailPage } from "./m05_20_standby";

export type ピッキングの行 = { No: string; 棚番号: string; 言語状態: string; 略称: string; 色R: string; 数: string; 商品名: string; 価格: string;
  /** 商品名の欄の文字（空白を詰めない。前後の空白だけ除く） */
  商品名の元: string };
export type ピッキングのページ = {
  /** 見出し（例「ピッキングリスト（商品単位_980円未満） 1/1」） */
  見出し: string;
  /** 見出しのうちグループの名前の部分（例「商品単位_980円未満」「サプライ」） */
  グループ: string;
  /** 見出しの末尾のページ表示（例「1/1」） */
  ページ: string;
  出荷指示リスト番号: string;
  作成日: string;
  行: ピッキングの行[];
  /** 合計の行の文（例「全2 点」。そのページに無ければ空） */
  合計: string;
};

export class PickingPrintPage {
  readonly detail: StandbyDetailPage;
  constructor(readonly page: Page) { this.detail = new StandbyDetailPage(page); page.setDefaultTimeout(60_000); }

  /** 出荷指示リスト詳細画面を開く（応答の状態を返す） */
  async 詳細を開く(出荷指示リストID: string): Promise<number> {
    const s = await this.detail.open(出荷指示リストID);
    await expect(this.page.locator("#form_bulk"), "出荷指示リスト詳細画面の受注の一覧").toBeAttached();
    return s;
  }

  /** 一覧に出ている受注ID（上から） */
  async 一覧の受注ID(): Promise<string[]> {
    return this.page.locator('#form_bulk input[type="checkbox"][name^="order_ids"]').evaluateAll((els) => els.map((e) => (e as HTMLInputElement).dataset.id ?? ""));
  }

  /** 受注の選択を、指定の受注IDだけ選んだ状態にする（画面は全件が選ばれた状態で開く）。ほかは選ばない */
  async 受注を選ぶ(受注IDs: string[]): Promise<void> {
    const boxes = this.page.locator('#form_bulk input[type="checkbox"][name^="order_ids"]');
    const n = await boxes.count();
    for (let i = 0; i < n; i++) {
      const b = boxes.nth(i);
      const id = (await b.getAttribute("data-id")) ?? "";
      await b.setChecked(受注IDs.includes(id));
    }
    for (const id of 受注IDs) await expect(this.page.locator(`#check-${id}`), `受注ID ${id} の選択`).toBeChecked();
  }

  /** 開発者ツールの代わりに、印刷の要求へ受注IDを選択済みとして足す（画面の送信用のフォームに隠し項目を足す） */
  async 印刷の要求へ受注を足す(受注ID: string): Promise<void> {
    await this.page.evaluate((id) => {
      const f = document.querySelector("#form_bulk");
      if (!f) throw new Error("出荷指示リスト詳細画面の送信用のフォームが無い");
      const i = document.createElement("input");
      i.type = "hidden"; i.name = `order_ids[${id}]`; i.value = "on";
      f.appendChild(i);
    }, 受注ID);
  }

  /** 「ピッキングリスト印刷」を押し、開いた新しいウィンドウ（ピッキングリスト印刷画面）を返す */
  async 印刷を押す(): Promise<Page> {
    await this.page.waitForLoadState("load");
    const button = this.page.locator("#printPickingList");
    await expect(button, "ピッキングリスト印刷ボタン").toBeVisible();
    const [popup] = await Promise.all([this.page.waitForEvent("popup"), button.click()]);
    await popup.waitForLoadState("load");
    // 空のウィンドウを開いてからフォームを送る作りなので、ピッキングリスト印刷画面へ移るまで待つ
    await popup.waitForURL(/\/standby\/\d+\/print\/picking/, { timeout: 60_000 }).catch(() => undefined);
    await popup.waitForLoadState("load");
    return popup;
  }
}

/** ピッキングリスト印刷画面の、グループごと・ページごとの内容を読む */
export async function ピッキングリストを読む(popup: Page): Promise<ピッキングのページ[]> {
  await expect(popup.locator(".ContentsAll"), "ピッキングリスト印刷画面").toBeAttached();
  return popup.locator(".ContentsAll .multipage").evaluateAll((pages) => pages.map((p) => {
    const t = (e: Element | null) => (e?.textContent ?? "").replace(/\s+/g, " ").trim();
    const head = t(p.querySelector(":scope > div"));
    const m = /ピッキングリスト（(.+?)）\s*(\d+\/\d+)?/.exec(head);
    const meta = t(p.querySelector(":scope > div:nth-of-type(2)"));
    const rows = Array.from(p.querySelectorAll("tr.data")).map((tr) => {
      const c = (cls: string) => t(tr.querySelector(`td.${cls}`));
      const raw = (tr.querySelector("td.name_ div.name_")?.textContent ?? "").trim();
      return { No: c("no_"), 棚番号: c("shelf_number_"), 言語状態: c("language_condition_"), 略称: c("expansion_sname_"), 色R: c("color_rarity_"), 数: c("qty_"), 商品名: c("name_"), 価格: c("price_"), 商品名の元: raw };
    });
    const total = rows.find((r) => r.No === "" && /^全/.test(r.商品名));
    return {
      見出し: head, グループ: m?.[1] ?? "", ページ: m?.[2] ?? "",
      出荷指示リスト番号: /出荷指示リスト番号：\s*(\S+)/.exec(meta)?.[1] ?? "",
      作成日: /作成日：\s*([\d/]+ [\d:]+)/.exec(meta)?.[1] ?? "",
      行: rows.filter((r) => r.No !== ""),
      合計: total?.商品名 ?? "",
    };
  }));
}

/** 読んだ内容を、グループの名前ごとに行を並べてまとめる（ページをまたいだ行もつなぐ） */
export function グループごとの行(pages: ピッキングのページ[]): Map<string, ピッキングの行[]> {
  const out = new Map<string, ピッキングの行[]>();
  for (const p of pages) out.set(p.グループ, [...(out.get(p.グループ) ?? []), ...p.行]);
  return out;
}

/**
 * 出荷指示リスト検索画面の「出荷指示リスト生成」欄で、注文番号（from）・（to）を入れて生成する（M05-20 の 出荷指示リストを生成する の範囲つき）。
 * 生成した出荷指示リストの番号は、呼ぶ側が DB の参照（受注の入った出荷指示リスト）で読む。
 * 範囲に入るほかの方の受注も集める作りなので、呼ぶ前に範囲に入るのが自分の受注だけかを必ず確かめること。
 */
export async function 範囲で出荷指示リストを生成する(page: Page, from: string, to: string, what: string): Promise<void> {
  page.setDefaultTimeout(60_000);
  await page.goto(adminUrl("/standby/search"));
  await page.waitForLoadState("load");
  if (!(await page.locator("#generateList").isVisible())) await page.locator('a[href="#generateList"]').click();
  await expect(page.locator("#generateList"), `${what}: 出荷指示リスト生成欄`).toBeVisible();
  await page.locator('[name="admin_generate_shipping_standby[order_id_from]"]').fill(from);
  await page.locator('[name="admin_generate_shipping_standby[order_id_to]"]').fill(to);
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), page.locator('#generate_form button[type="submit"]').click()]);
  await page.waitForLoadState("load");
  // 開発環境では画面の上に「デバッグモードが有効になっています。」の帯（.alert-danger）がいつも出るので、エラーから外す
  // （2026-11-11 夜の M05-09 の 010 は、この帯だけで「生成が失敗した」と取り違えて止まった）
  const err = (await page.locator(".alert-danger").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter((t) => t && !/デバッグモード/.test(t));
  if (err.length) throw new Error(`${what}: 出荷指示リストの生成が失敗した: ${err.join(" / ")}`);
}
