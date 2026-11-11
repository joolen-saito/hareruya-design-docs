/**
 * M13-08 デッキ表示（イベント申込一覧の「デッキ表示」ボタンで別の画面に開く、印刷向けのデッキリスト）の画面操作。セレクタはここだけに書く。
 * あわせて、M13-08 のシードが使う画面操作（カードの用意・プレイヤーとイベントを選んだ大会デッキの登録）もここに置く。
 * 共通の部品（pages/admin/common.ts・m13_06_entry_list.ts・m14_card.ts など）は変えずに使う。
 */
import { BrowserContext, expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { CardSearchPage, カードを登録する } from "./m14_card";

type Issue = (m: string) => void;

// ---------------------------------------------------------------------------
// デッキ表示（印刷向けのデッキリスト）
// ---------------------------------------------------------------------------

/** デッキの1行（枚数・日本語名・英語名。英語名は画面では「」で囲まれる。囲みは外して返す） */
export type デッキの行 = { 枚数: string; 日本語名: string; 英語名: string; 日本語名が先: boolean };
/** 見出しごとの区分（「土地(20)」「呪文(4)」「サイドボード(3)」など） */
export type デッキの区分 = { 見出し: string; 行: デッキの行[] };
/** デッキ表示の1ページ（1枚の用紙） */
export type デッキ表示のページ = {
  /** 「Name:」の値（プレイヤー名のあとに「現在ページ / 総ページ」が付く） */
  名前欄: string;
  /** 「Table Number:」の欄の値 */
  表番号: string;
  イベント: string;
  日付: string;
  /** 「メインボード(N)」の見出し */
  メインの見出し: string;
  /** 区分（画面の上から。左の列・右の列の順） */
  区分: デッキの区分[];
  /** ページの全文（見出し・欄名の有無を見るため） */
  全文: string;
};

/** イベント申込一覧の「デッキ表示」ボタン */
export function デッキ表示ボタン(page: Page): Locator {
  return page.locator("#decklist");
}

/** 「デッキ表示」ボタンを押し、別の画面（別のウィンドウ）に開いたデッキ表示を返す */
export async function デッキ表示を開く(page: Page): Promise<Page> {
  const [popup] = await Promise.all([page.waitForEvent("popup", { timeout: 60_000 }), デッキ表示ボタン(page).click({ timeout: 30_000 })]);
  await popup.waitForLoadState("load", { timeout: 120_000 });
  return popup;
}

/** デッキ表示のアドレスを直接開く */
export async function デッキ表示をアドレスで開く(page: Page): Promise<void> {
  await page.goto(adminUrl("/event/entry/decklist"), { timeout: 180_000 });
  await page.waitForLoadState("load");
}

export const デッキ表示のパス = "/event/entry/decklist";

export function 印刷ボタン(popup: Page): Locator {
  return popup.locator("#decklistPrintButton");
}
export function 該当なしの文(popup: Page): Locator {
  return popup.locator(".decklist-empty");
}

/** デッキ表示の全ページを読む */
export async function デッキ表示を読む(popup: Page): Promise<デッキ表示のページ[]> {
  return popup.locator(".wrapper").evaluateAll((ws) => ws.map((w) => {
    const t = (el: Element | null) => ((el as HTMLElement | null)?.innerText ?? el?.textContent ?? "").replace(/\s+/g, " ").trim();
    const metas = Array.from(w.querySelectorAll(".decklist-meta__item"));
    const meta = (label: string) => {
      const item = metas.find((m) => t(m.querySelector(".decklist-meta__label")) === label);
      return item ? t(item.querySelector(".decklist-meta__value")) : "";
    };
    return {
      名前欄: t(w.querySelector(".decklist-header__name-value")),
      表番号: t(w.querySelector(".decklist-header__box-table")),
      イベント: meta("Event:"),
      日付: meta("Date:"),
      メインの見出し: t(w.querySelector(".decklist-mainboard__title")),
      区分: Array.from(w.querySelectorAll(".decklist-type")).map((s) => ({
        見出し: t(s.querySelector(".decklist-type__title")),
        行: Array.from(s.querySelectorAll(".decklist-type__row")).map((r) => {
          const jp = r.querySelector(".decklist-type__name-jp");
          const en = r.querySelector(".decklist-type__name-en");
          return {
            枚数: t(r.querySelector(".decklist-type__count")),
            日本語名: t(jp),
            英語名: t(en).replace(/^「/, "").replace(/」$/, ""),
            日本語名が先: !!jp && !!en && (jp.compareDocumentPosition(en) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
          };
        }),
      })),
      全文: t(w),
    };
  }));
}

/** 名前欄がプレイヤー名で始まるページ（名前欄はプレイヤー名のあとに「 現在ページ / 総ページ」が付く） */
export function プレイヤーのページ(pages: デッキ表示のページ[], プレイヤー名: string): デッキ表示のページ[] {
  return pages.filter((p) => p.名前欄 === プレイヤー名 || p.名前欄.startsWith(`${プレイヤー名} `));
}

/** 名前欄の末尾の「現在ページ / 総ページ」 */
export function ページ番号(p: デッキ表示のページ): { 現在: string; 総数: string } | null {
  const m = /(\d+)\s*\/\s*(\d+)$/.exec(p.名前欄);
  return m ? { 現在: m[1], 総数: m[2] } : null;
}

/** 画面の中の、利用者が値を入れられる項目（見えている入力欄・選択欄・文の入力欄・書き換えられる要素）の数と、その説明 */
export async function 入力項目(popup: Page): Promise<string[]> {
  return popup.locator("input:not([type=hidden]), select, textarea, [contenteditable=''], [contenteditable='true']").evaluateAll((els) => els
    .filter((e) => { const r = (e as HTMLElement).getBoundingClientRect(); return r.width > 0 && r.height > 0; })
    .map((e) => `${e.tagName.toLowerCase()}${(e as HTMLInputElement).type ? `(${(e as HTMLInputElement).type})` : ""}`));
}

/**
 * 画面の印刷の命令（ブラウザの印刷画面を開く命令）が呼ばれたことを数えられるようにする。
 * このあと同じブラウザのコンテキストで開く画面（デッキ表示の別の画面を含む）に効く。
 * ヘッドレスのブラウザでは印刷画面そのものは出ないので、命令は数えるだけで印刷画面は開かない。
 */
export async function 印刷の命令を数える(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    const w = window as unknown as { __m1308_print_calls: number; print: () => void };
    w.__m1308_print_calls = 0;
    w.print = () => { w.__m1308_print_calls++; };
  });
}
export async function 印刷の命令の回数(popup: Page): Promise<number> {
  return popup.evaluate(() => (window as unknown as { __m1308_print_calls?: number }).__m1308_print_calls ?? -1);
}

// ---------------------------------------------------------------------------
// シードが使う画面操作
// ---------------------------------------------------------------------------

export type カードの定め = { 日本語名: string; 英語名: string; カードタイプ: string };

const タイプが合う = (labels: string[], t: string) => labels.some((l) => l === t || l.endsWith(` / ${t}`) || l.startsWith(`${t} / `));

/**
 * カード一覧でカード名を検索し、カード名欄が「日本語名 / 英語名」の行があればそれを使い（カードタイプを編集画面で確かめる）、
 * 無ければカード新規登録画面で登録する。カードIDを返す。
 */
export async function カードを用意する(page: Page, v: カードの定め, issue: Issue): Promise<string> {
  const list = new CardSearchPage(page);
  await list.open();
  await list.キーワードで検索する(v.日本語名);
  const 件数 = await list.検索結果件数();
  if (件数 !== null && 件数 > (await list.行.count())) {
    const 最大 = Math.max(...(await page.locator("#page_count_pulldown option").allInnerTexts()).map((t) => Number(t.replace(/\D/g, ""))).filter((n) => n > 0));
    if (Number.isFinite(最大)) await list.表示件数を選ぶ(最大);
  }
  const 名 = `${v.日本語名} / ${v.英語名}`;
  const ids = (await list.表示行()).filter((r) => r.カード名 === 名).map((r) => r.カードID).sort((a, b) => Number(a) - Number(b));
  if (ids.length === 0) {
    const id = await カードを登録する(page, { カード名日: v.日本語名, カード名英: v.英語名, 点数で見たマナ: "1", カードタイプ: [v.カードタイプ] }, `カード「${名}」`, issue);
    issue(`カード「${名}」がカード一覧に無かったので、カード新規登録画面で登録した（カードID ${id}・カードタイプ「${v.カードタイプ}」・点数で見たマナ・コスト 1）`);
    return id;
  }
  for (const id of ids) {
    await page.goto(adminUrl(`/card/${id}/edit`));
    await page.waitForLoadState("load");
    const types = (await page.locator('select[name="admin_card[cardtypes][]"] option:checked').allInnerTexts()).map((s) => s.trim());
    if (!タイプが合う(types, v.カードタイプ)) {
      throw new Error(`カード一覧にあるカード「${名}」（カードID ${id}）のカードタイプが「${types.join("・") || "なし"}」で、シード表の「${v.カードタイプ}」と違う（共有のマスタなので直さない）`);
    }
  }
  if (ids.length > 1) issue(`カード「${名}」がカード一覧に ${ids.length} 件ある（${ids.join("、")}。カードタイプはどれも「${v.カードタイプ}」）。いちばん小さいカードIDを控えた`);
  else issue(`カード「${名}」はカード一覧にあった（カードID ${ids[0]}）ので、それを使った（カードタイプ「${v.カードタイプ}」を編集画面で確かめた）`);
  return ids[0];
}

export type 大会デッキの入力 = {
  /** プレイヤー検索に入れる語と、選ぶ行のプレイヤーID */
  プレイヤー検索語: string; プレイヤーID: string;
  /** 選んだときに自動で入った値を消して入れる、デッキのプレイヤー名 */
  プレイヤー名: string;
  /** イベント検索に入れるイベント名と店舗。その日程IDの行の「選択」を押す（開催日は「2026/10/01」の形で確かめる） */
  イベント名: string; 店舗: string; 日程ID: string; 開催日: string;
  メイン: string; サイド?: string;
};

let 基線: { フォーマット: string; アーキタイプ: string } | null = null;

/** デッキ新規登録画面で、アーキタイプの選択肢があるフォーマットの先頭を探す（シード表は「登録済みの任意のもの」） */
async function 基線を決める(page: Page): Promise<{ フォーマット: string; アーキタイプ: string }> {
  if (基線) return 基線;
  await page.goto(adminUrl("/deck/new"));
  await page.waitForLoadState("load");
  const fmt = page.locator('[name="admin_deck[Format]"]');
  const labels = (await fmt.locator("option").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  for (const l of labels) {
    await fmt.selectOption({ label: l });
    const opts = (await page.locator('[name="admin_deck[Archetype]"] option').evaluateAll((os) => os.map((o) => ({ v: (o as HTMLOptionElement).value, t: (o.textContent ?? "").trim() })))).filter((o) => o.v);
    if (opts.length) return (基線 = { フォーマット: l, アーキタイプ: opts[0].t });
  }
  throw new Error("デッキ新規登録画面に、アーキタイプのあるフォーマットが1件も無い（デッキを登録できない）");
}

/**
 * デッキ一覧の「新規登録」からデッキタイプ「event」の大会デッキを登録し、デッキID（登録後のデッキ編集画面のアドレスの番号）を返す。
 * フォーマット・アーキタイプは登録済みの任意のもの（アーキタイプのあるフォーマットの先頭）、公開状態は「非公開」（任意の値）。
 */
export async function 大会デッキを登録する(page: Page, v: 大会デッキの入力, issue: Issue): Promise<string> {
  const base = await 基線を決める(page);
  await page.goto(adminUrl("/deck"));
  await page.waitForLoadState("load");
  await Promise.all([page.waitForURL(/\/deck\/new$/, { waitUntil: "load" }), page.getByRole("link", { name: "新規登録", exact: true }).click()]);
  const f = (n: string) => page.locator(`[name="admin_deck[${n}]"]`);
  await chooseByLabel(f("DeckType"), "event");
  await chooseByLabel(f("Format"), base.フォーマット);
  await chooseByLabel(f("Archetype"), base.アーキタイプ);
  await chooseByLabel(f("Disp"), "非公開");
  // プレイヤー
  await page.locator('[data-bs-target="#searchPlayerModal"]').click();
  const pm = page.locator("#searchPlayerModal");
  await expect(pm, "デッキのプレイヤー検索").toBeVisible();
  await pm.locator("#player_search_word").fill(v.プレイヤー検索語);
  await pm.locator("#btn_search_player").click();
  await expect(pm.locator("#player_search_results table, #player_search_results p").first(), "デッキのプレイヤー検索の結果").toBeVisible({ timeout: 30_000 });
  const 選ぶ = pm.locator(`button.select-player[data-id="${v.プレイヤーID}"]`);
  await expect(選ぶ, `デッキのプレイヤー検索「${v.プレイヤー検索語}」の結果に、プレイヤーID ${v.プレイヤーID} の行`).toHaveCount(1, { timeout: 30_000 });
  await 選ぶ.click();
  await expect(pm).toBeHidden();
  await expect(f("playerId"), "選んだプレイヤーがデッキに設定される").toHaveValue(v.プレイヤーID);
  const 自動 = await f("playerName").inputValue();
  await f("playerName").fill("");
  await f("playerName").fill(v.プレイヤー名);
  if (自動) issue(`デッキのプレイヤー名に選択時に自動で入った「${自動}」を消して「${v.プレイヤー名}」を入れた`);
  // イベント
  await page.locator('[data-bs-target="#searchEventModal"]').click();
  const em = page.locator("#searchEventModal");
  await expect(em, "デッキのイベント検索").toBeVisible();
  await em.locator("#event_search_word").fill(v.イベント名);
  if (await em.locator("#event_search_shop").count()) await chooseByLabel(em.locator("#event_search_shop"), v.店舗);
  await em.locator("#btn_search_event").click();
  const 選択 = em.locator(`button.select-event[data-id="${v.日程ID}"]`);
  await expect(選択, `デッキのイベント検索の結果に「${v.イベント名}」の日程 ${v.日程ID} の行`).toBeVisible({ timeout: 30_000 });
  const 日 = (await 選択.getAttribute("data-date")) ?? "";
  if (!日.includes(v.開催日) && !日.includes(v.開催日.replace(/\//g, "-"))) throw new Error(`デッキのイベント検索で選ぶ日程 ${v.日程ID} の開催日が「${日}」（${v.開催日} のはず）`);
  await 選択.click();
  await expect(f("eventDetailId"), "イベントを選ぶと、デッキに日程が設定される").toHaveValue(v.日程ID);
  await expect(em).toBeHidden();
  await f("textMain").fill(v.メイン);
  await f("textSide").fill(v.サイド ?? "");
  await page.locator('button[type="submit"][form="admin_deck"]').first().click();
  for (const w of await expectSaved(page, `大会デッキ（${v.イベント名}・${v.プレイヤー名}）の登録`)) issue(w);
  const m = /\/deck\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`大会デッキ（${v.イベント名}・${v.プレイヤー名}）を登録したが、デッキ編集画面へ移らない（${page.url()}）`);
  return m[1];
}
