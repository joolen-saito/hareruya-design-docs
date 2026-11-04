/**
 * M15-01 デッキ検索・一覧 のシードの作り方（画面操作）。正本: cases/M15-01_seed_data.tsv
 *
 * - 試験管理者: メンバー管理で登録する。権限は、デッキ管理を操作できる「システム管理者」（正本は権限の名前を定めない。M05・M12 と同じ）。
 * - ブラウザセッション: ケースごとの新しいブラウザの状態（保存された検索条件なし）で成り立つ。作るものは無い。
 * - 「任意の値」のフォーマット・アーキタイプ・公開状態は、アーキタイプのあるフォーマットの先頭と、アーキタイプの先頭、非公開（公開を選ぶ指定のときだけ公開）。
 * - 共有マスタの店舗（大阪店）: 画面の選択肢に「大阪店」があればそれを、無ければ先頭の店舗を選ぶ（イベントの店舗の中身はこの機能のケースが確かめない）。
 * - 決め打ちの識別の値（デッキ名・イベント名・フォーマット名・アーキタイプ名・タグ名・カラー名・カード名）は、検索語に使える前半に実行の印を付けて作る。
 */
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { rc } from "../lib/run_marker";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";
import { registerFormat } from "../pages/admin/m12_09_used_card";
import { アーキタイプを登録する } from "../pages/admin/m12_deck_seed";
import { 行を用意する } from "../pages/admin/m14_04_master";
import { カードを登録する } from "../pages/admin/m14_card";
import { イベントと日程を用意する, デッキを登録する, デッキ登録内容, 公開用 } from "../pages/admin/m15_deck";

export const M1501_ADMIN_A: Account = { loginId: "m1501_admin_a", password: "Passw0rd!M1501A" };
export const M1501_ADMIN_B: Account = { loginId: "m1501_admin_b", password: "Passw0rd!M1501B" };

defineSeed("S-M15-01-ADM-A", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M15-01試験管理者A", account: M1501_ADMIN_A, メール: "m1501_admin_a@example.test" });
});
defineSeed("S-M15-01-ADM-B", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M15-01試験管理者B", account: M1501_ADMIN_B, メール: "m1501_admin_b@example.test" });
});
defineSeed("S-M15-01-SESSION", async () => { /* ケースごとの新しいブラウザの状態で成り立つ */ });

/** 日本時間の「yyyy-MM-dd HH:mm」（現在から n 日後） */
const 日時 = (日後: number) => {
  const d = new Date(Date.now() + 日後 * 86_400_000);
  const p = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(d);
  return p.replace(",", "");
};

const 管理画面 = <T>(browser: Browser, fn: (page: Page) => Promise<T>, 管理者: Account = SETUP_ADMIN) =>
  withAdminSession(browser, 管理者, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });

/** イベント（過去の日程）を1件用意して、デッキの登録に使う検索語と日程IDを返す */
async function 過去のイベント(page: Page, stem: string, issue: (m: string) => void, 開始時間 = "2025-01-01 10:00") {
  const 検索語 = rc(`${stem}大会`);
  const { 日程ID } = await イベントと日程を用意する(page, { 名日: 検索語, 名英: rc(`${stem} Event`), 開始時間 }, issue);
  return { 検索語, 日程ID };
}

type DeckDef = { key: string; デッキ名?: string; 内容?: Partial<デッキ登録内容>; イベント?: boolean };

/** 「イベントあり（大会開始済み）」のデッキ群を作り、呼び名〔デッキID-M1501-<key>〕を控える */
function イベント付きデッキのシード(seedId: string, stem: string, defs: DeckDef[]): void {
  defineSeed(seedId, { needs: ["S-M15-01-ADM-A"] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await 管理画面(browser, async (page) => {
      const ev = await 過去のイベント(page, stem, issue);
      for (const d of defs) {
        const id = await デッキを登録する(page, { デッキ名: d.デッキ名, ...(d.イベント === false ? {} : { イベント: { 検索語: ev.検索語, 日程ID: ev.日程ID } }), ...d.内容 }, issue);
        notes.set(`〔デッキID-M1501-${d.key}〕`, id);
      }
    });
  });
}

/** イベントを選ばないデッキ群 */
function 単独デッキのシード(seedId: string, defs: DeckDef[], 管理者?: Account): void {
  defineSeed(seedId, { needs: ["S-M15-01-ADM-A"] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await 管理画面(browser, async (page) => {
      for (const d of defs) {
        notes.set(`〔デッキID-M1501-${d.key}〕`, await デッキを登録する(page, { デッキ名: d.デッキ名, ...d.内容 }, issue));
      }
    }, 管理者);
  });
}

// ---- 並び・日付・順位 ----
単独デッキのシード("S-M15-01-SORT-005", ["A", "B", "C", "D"].map((x) => ({ key: `005${x}`, デッキ名: `${x}-${rc("並び試験-005")}` })));

defineSeed("S-M15-01-DATE-018", { needs: ["S-M15-01-ADM-A"] }, async ({ browser, notes }) => {
  const issue = (m: string) => reportSeedIssue("S-M15-01-DATE-018", m);
  await 管理画面(browser, async (page) => {
    const ev = await 過去のイベント(page, "M1501-018", issue);
    for (const [x, 日] of [["A", "2025-07-31T23:59"], ["B", "2025-08-01T00:00"], ["C", "2025-08-31T23:59"], ["D", "2025-09-01T00:00"]]) {
      notes.set(`〔デッキID-M1501-018${x}〕`, await デッキを登録する(page, { イベント: { 検索語: ev.検索語, 日程ID: ev.日程ID }, 開催日: 日 }, issue));
    }
  });
});

defineSeed("S-M15-01-RANK-019", { needs: ["S-M15-01-ADM-A"] }, async ({ browser, notes }) => {
  const issue = (m: string) => reportSeedIssue("S-M15-01-RANK-019", m);
  await 管理画面(browser, async (page) => {
    const ev = await 過去のイベント(page, "M1501-019", issue);
    for (const [x, 順位] of [["A", "1"], ["B", "5"], ["C", "10"], ["D", "20"]]) {
      notes.set(`〔デッキID-M1501-019${x}〕`, await デッキを登録する(page, { イベント: { 検索語: ev.検索語, 日程ID: ev.日程ID }, 順位 }, issue));
    }
  });
});

// ---- カード名 ----
defineSeed("S-M15-01-CARD-025", { needs: ["S-M15-01-ADM-A"] }, async ({ browser, notes }) => {
  const issue = (m: string) => reportSeedIssue("S-M15-01-CARD-025", m);
  await 管理画面(browser, async (page) => {
    // カード「稲妻／Lightning Bolt」は手元の環境に登録済み。カード一覧で名称を確かめる
    await page.goto(adminUrl("/card"));
    const ev = await 過去のイベント(page, "M1501-025", issue);
    notes.set("〔デッキID-M1501-025〕", await デッキを登録する(page, { イベント: { 検索語: ev.検索語, 日程ID: ev.日程ID }, メイン: "4 Lightning Bolt" }, issue));
  });
});

// ---- 件数・並び替えの保持 ----
イベント付きデッキのシード("S-M15-01-ORDER-036", "M1501-036", ["A", "B", "C", "D"].map((x) => ({ key: `036${x}`, デッキ名: `${x}-${rc("並び試験-036")}` })));

// ---- リンク・メニュー・編集 ----
イベント付きデッキのシード("S-M15-01-LINK-042", "M1501-042", [{ key: "042", デッキ名: `${rc("青空")}-042` }]);
イベント付きデッキのシード("S-M15-01-MENU-043", "M1501-043", [{ key: "043", デッキ名: `${rc("青空")}-043` }]);
イベント付きデッキのシード("S-M15-01-EDIT-044", "M1501-044", [{ key: "044", デッキ名: `${rc("青空")}-044` }]);

// ---- トークン・CSV ----
単独デッキのシード("S-M15-01-TOKEN-049", [{ key: "049" }]);
イベント付きデッキのシード("S-M15-01-CSV-051", "M1501-051", ["A", "B", "C"].map((x) => ({ key: `051${x}` })));
イベント付きデッキのシード("S-M15-01-CSV-052", "M1501-052", [{ key: "052" }]);

// ---- 一括編集 ----
単独デッキのシード("S-M15-01-BULK-054", [{ key: "054" }]);
単独デッキのシード("S-M15-01-BULK-056", [{ key: "056", 内容: { 成績: "更新前成績" } }], M1501_ADMIN_A);
単独デッキのシード("S-M15-01-BULK-058", [{ key: "058", 内容: { イベント名日: "更新前大会", イベント名英: "Before Event", 成績: "更新前成績", プレイヤー名: "更新前選手", 引用元URL: "https://example.com/before", 開催日: "2026-01-15T10:00" } }]);
単独デッキのシード("S-M15-01-BULK-060", [{ key: "060", 内容: { 成績: "更新前成績" } }]);
単独デッキのシード("S-M15-01-BULK-062", [{ key: "062", 内容: { 成績: "更新前成績" } }]);

// ---- カードリスト ----
defineSeed("S-M15-01-CARDLIST-063", { needs: ["S-M15-01-ADM-A"] }, async ({ browser, notes }) => {
  const issue = (m: string) => reportSeedIssue("S-M15-01-CARDLIST-063", m);
  await 管理画面(browser, async (page) => {
    // カード「Lightning Bolt」は手元の環境に登録済み（そのカードを使う）
    const fmt = rc("Standard-063"), arc = rc("Blue Control-063");
    await registerFormat(page, { 名日: fmt, 名英: fmt, 並び順: "9063", メタ日数: "30" }, issue);
    await アーキタイプを登録する(page, { 名日: "Blue Control-063", 名英: "Blue Control-063", フォーマット: fmt }, issue);
    notes.set("〔デッキID-M1501-063〕", await デッキを登録する(page, { デッキ名: rc("カードリスト検証デッキ-063"), フォーマット: fmt, アーキタイプ: arc, ...公開用("M1501-063"), メイン: "4 Lightning Bolt" }, issue));
  });
});

defineSeed("S-M15-01-BLANKLINE-099", { needs: ["S-M15-01-ADM-A"] }, async ({ browser, notes }) => {
  const issue = (m: string) => reportSeedIssue("S-M15-01-BLANKLINE-099", m);
  await 管理画面(browser, async (page) => {
    const fmt = rc("M1501-099-Fmt"), arc = rc("M1501-099-Arc");
    await registerFormat(page, { 名日: fmt, 名英: fmt, 並び順: "9099", メタ日数: "30" }, issue);
    await アーキタイプを登録する(page, { 名日: "M1501-099-Arc", 名英: "M1501-099-Arc", フォーマット: fmt }, issue);
    for (const x of ["A", "B"]) await カードを登録する(page, { カード名英: rc(`M1501-099-Card${x}`), 点数で見たマナ: "0" }, `M1501-099-Card${x}`, issue);
    notes.set("〔デッキID-M1501-099〕", await デッキを登録する(page, { デッキ名: rc("M1501-099-デッキ"), フォーマット: fmt, アーキタイプ: arc, ...公開用("M1501-099"), メイン: `4 ${rc("M1501-099-CardA")}` }, issue));
  });
});

// ---- 候補（検索欄・一括編集欄） ----
async function フォーマットを2件(page: Page, stem: string, issue: (m: string) => void, 名s: string[]) {
  for (const n of 名s) await registerFormat(page, { 名日: rc(`${stem}-${n}`), 名英: rc(`${stem}-${n}`), 並び順: "9067", メタ日数: "30" }, issue);
}
async function マスタ2件(page: Page, 種別: "カラー" | "デッキタグ", stem: string, 名s: string[]) {
  // カラー名は20文字までで、実行の印を付けると収まらない。印を付けず、あれば使う（共有）
  for (const n of 名s) {
    const 名 = 種別 === "カラー" ? `${stem}-${n}` : rc(`${stem}-${n}`);
    await 行を用意する(page, 種別, 名, 名, stem);
  }
}
async function アーキタイプ2件(page: Page, stem: string, issue: (m: string) => void) {
  const fmt = rc(`${stem}-Fmt`);
  await registerFormat(page, { 名日: fmt, 名英: fmt, 並び順: "9069", メタ日数: "30" }, issue);
  for (const n of ["Arc1", "Zulu"]) await アーキタイプを登録する(page, { 名日: `${stem}-${n}`, 名英: `${stem}-${n}`, フォーマット: fmt }, issue);
}

defineSeed("S-M15-01-SUGFMT-067", async ({ browser }) => { await 管理画面(browser, (p) => フォーマットを2件(p, "M1501-067", (m) => reportSeedIssue("S-M15-01-SUGFMT-067", m), ["Alpha", "Zulu"])); });
defineSeed("S-M15-01-SUGCLR-068", async ({ browser }) => { await 管理画面(browser, (p) => マスタ2件(p, "カラー", "M1501-068", ["Aka", "Zulu"])); });
defineSeed("S-M15-01-SUGARC-069", async ({ browser }) => { await 管理画面(browser, (p) => アーキタイプ2件(p, "M1501-069", (m) => reportSeedIssue("S-M15-01-SUGARC-069", m))); });
defineSeed("S-M15-01-SUGTAG-070", async ({ browser }) => { await 管理画面(browser, (p) => マスタ2件(p, "デッキタグ", "M1501-070", ["TagA", "Zulu"])); });

defineSeed("S-M15-01-SUGFMT-077", { needs: ["S-M15-01-ADM-A"] }, async ({ browser, notes }) => {
  const issue = (m: string) => reportSeedIssue("S-M15-01-SUGFMT-077", m);
  await 管理画面(browser, async (p) => { await フォーマットを2件(p, "M1501-077", issue, ["Alpha", "Zulu"]); notes.set("〔デッキID-M1501-077〕", await デッキを登録する(p, {}, issue)); });
});
defineSeed("S-M15-01-SUGARC-078", { needs: ["S-M15-01-ADM-A"] }, async ({ browser, notes }) => {
  const issue = (m: string) => reportSeedIssue("S-M15-01-SUGARC-078", m);
  await 管理画面(browser, async (p) => { await アーキタイプ2件(p, "M1501-078", issue); notes.set("〔デッキID-M1501-078〕", await デッキを登録する(p, {}, issue)); });
});
defineSeed("S-M15-01-SUGTAG-079", { needs: ["S-M15-01-ADM-A"] }, async ({ browser, notes }) => {
  const issue = (m: string) => reportSeedIssue("S-M15-01-SUGTAG-079", m);
  await 管理画面(browser, async (p) => { await マスタ2件(p, "デッキタグ", "M1501-079", ["TagA", "Zulu"]); notes.set("〔デッキID-M1501-079〕", await デッキを登録する(p, {}, issue)); });
});
defineSeed("S-M15-01-SELFMT-091", { needs: ["S-M15-01-ADM-A"] }, async ({ browser, notes }) => {
  const issue = (m: string) => reportSeedIssue("S-M15-01-SELFMT-091", m);
  await 管理画面(browser, async (p) => { await フォーマットを2件(p, "M1501-091", issue, ["Alpha"]); notes.set("〔デッキID-M1501-091〕", await デッキを登録する(p, {}, issue)); });
});
defineSeed("S-M15-01-SELARC-092", { needs: ["S-M15-01-ADM-A"] }, async ({ browser, notes }) => {
  const issue = (m: string) => reportSeedIssue("S-M15-01-SELARC-092", m);
  await 管理画面(browser, async (p) => {
    const fmt = rc("M1501-092-Fmt");
    await registerFormat(p, { 名日: fmt, 名英: fmt, 並び順: "9092", メタ日数: "30" }, issue);
    await アーキタイプを登録する(p, { 名日: "M1501-092-Arc1", 名英: "M1501-092-Arc1", フォーマット: fmt }, issue);
    notes.set("〔デッキID-M1501-092〕", await デッキを登録する(p, {}, issue));
  });
});
defineSeed("S-M15-01-SELTAG-093", { needs: ["S-M15-01-ADM-A"] }, async ({ browser, notes }) => {
  const issue = (m: string) => reportSeedIssue("S-M15-01-SELTAG-093", m);
  await 管理画面(browser, async (p) => { await マスタ2件(p, "デッキタグ", "M1501-093", ["TagA"]); notes.set("〔デッキID-M1501-093〕", await デッキを登録する(p, {}, issue)); });
});

// ---- 公開状態・4種の混在・ページ送り ----
単独デッキのシード("S-M15-01-STATUS-071", [
  { key: "071A", デッキ名: `${rc("M1501-071")}-A`, 内容: 公開用("M1501-071") },
  { key: "071B", デッキ名: `${rc("M1501-071")}-B`, 内容: { 公開状態: "非公開" } },
  { key: "071C", デッキ名: `${rc("M1501-071")}-C`, 内容: { 公開状態: "限定公開" } },
]);
単独デッキのシード("S-M15-01-STATUS1-095", [
  { key: "095A", デッキ名: `${rc("M1501-095")}-A`, 内容: 公開用("M1501-095") },
  { key: "095B", デッキ名: `${rc("M1501-095")}-B`, 内容: { 公開状態: "非公開" } },
  { key: "095C", デッキ名: `${rc("M1501-095")}-C`, 内容: { 公開状態: "限定公開" } },
]);

defineSeed("S-M15-01-MIX4-096", { needs: ["S-M15-01-ADM-A"] }, async ({ browser, notes }) => {
  const issue = (m: string) => reportSeedIssue("S-M15-01-MIX4-096", m);
  await 管理画面(browser, async (page) => {
    const past = await イベントと日程を用意する(page, { 名日: rc("M1501-096-過去大会"), 名英: rc("M1501-096 Past Event"), 開始時間: 日時(-1) }, issue);
    const future = await イベントと日程を用意する(page, { 名日: rc("M1501-096-未来大会"), 名英: rc("M1501-096 Future Event"), 開始時間: 日時(1) }, issue);
    const stem = rc("M1501-096");
    notes.set("〔デッキID-M1501-096S〕", await デッキを登録する(page, { デッキ名: `${stem}-S`, イベント: { 検索語: rc("M1501-096-過去大会"), 日程ID: past.日程ID } }, issue));
    notes.set("〔デッキID-M1501-096F〕", await デッキを登録する(page, { デッキ名: `${stem}-F`, イベント: { 検索語: rc("M1501-096-未来大会"), 日程ID: future.日程ID } }, issue));
    notes.set("〔デッキID-M1501-096U〕", await デッキを登録する(page, { デッキ名: `${stem}-U`, デッキタイプ: "user" }, issue));
    notes.set("〔デッキID-M1501-096N〕", await デッキを登録する(page, { デッキ名: `${stem}-N` }, issue));
  });
});

単独デッキのシード("S-M15-01-PAGING-097", Array.from({ length: 11 }, (_, i) => ({
  key: `097${"ABCDEFGHIJK"[i]}`, デッキ名: `${rc("M1501-097")}-${String(i + 1).padStart(2, "0")}`,
})));

