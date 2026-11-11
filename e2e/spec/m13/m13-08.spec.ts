/**
 * M13-08 デッキ表示（イベント管理）。正本: cases/M13-08_test_cases.tsv
 *
 * 実装するのは 001〜005・008・010・011・018 の9件。
 * 実装しないケース: 006・007・009（シードに DB への直接の設定が要り、ケースがその値を確かめる: プレイヤー名の前後の空白・会員のカナ姓・DCI番号）、
 * 012・013・019（カードのマスタに41〜43件のカードを毎回登録して残す。共有の環境で流すかは判断待ち）。
 *
 * - 決め打ちの識別の値（イベント名・プレイヤー名）は、シードと同じく実行の印を付けた値として読む（seeds/m13-08.ts）。
 * - イベント申込一覧の開始時間(From)は、画面を開いた日が初期値で入る。シード表の開催日（2026-10 など）がそれより前のときは、
 *   手順のとおりに検索すると検索対象のイベントが外れて0件になる。開始時間(From)を空にしてから検索し、初期値を手順の注記に残す
 *   （手順はイベント名と検索種別だけを指定し、開催日の条件には触れない。開催日がそれより後のケースは初期値のまま）。店舗は初期値のまま。
 * - デッキ表示は、イベント申込一覧の「デッキ表示」ボタンで別の画面（別のウィンドウ）に開く。
 */
import { Page, test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { EntryListPage } from "../../pages/admin/m13_06_entry_list";
import {
  デッキ表示のパス, デッキ表示のページ, デッキ表示を開く, デッキ表示を読む, デッキ表示をアドレスで開く, ページ番号, プレイヤーのページ,
  入力項目, 印刷の命令の回数, 印刷の命令を数える, 印刷ボタン,
} from "../../pages/admin/m13_08_deck_display";
import { M1308_ADMIN, 印, 大会018, 権限003, 表示プレイヤー名, 表示大会名, プレイヤー018 } from "../../seeds/m13-08";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

async function ログインして開く(page: Page): Promise<EntryListPage> {
  await loginAdmin(page, M1308_ADMIN);
  return new EntryListPage(page);
}

/** イベント申込一覧（検索入力）で検索種別「デッキ登録を検索」・イベント名を指定する。開催日が開始時間(From)の初期値より前なら From を空にする */
async function デッキ登録の条件を入れる(list: EntryListPage, イベント名: string, 開催日: string[]): Promise<void> {
  await list.開く();
  await list.検索種別("デッキ登録を検索").check();
  await list.イベント名.fill(イベント名);
  const from = await list.開始時間From.inputValue();
  const 日 = from.slice(0, 10);
  if (日 && 開催日.some((d) => d < 日)) {
    await list.開始時間From.fill("");
    note(`開始時間(From)には初期値「${from}」が入っていた。シード表の開催日（${開催日.join("・")}）がそれより前で、そのままでは検索対象のイベントが外れるので、空にして検索した（手順は開催日の条件に触れない）`);
  } else {
    note(`開始時間(From)は初期値「${from}」のまま検索した（シード表の開催日 ${開催日.join("・")} はそれより後）`);
  }
  note(`店舗は初期値（${(await list.選ばれている店舗()).join("・") || "指定なし"}）のまま検索した`);
}

/** 期待結果: プレイヤーのデッキがデッキ表示に出る・出ない */
function 出る(pages: デッキ表示のページ[], 名: string, 出るはず: boolean, 説明: string): void {
  const n = プレイヤーのページ(pages, 名).length;
  if (出るはず) expect.soft(n, `${説明}「${名}」のデッキのページ数（1以上）`).toBeGreaterThan(0);
  else expect.soft(n, `${説明}「${名}」のデッキのページ数（表示されない）`).toBe(0);
}

/** 全ページの名前欄（エビデンスに残す） */
function 名前欄の注記(pages: デッキ表示のページ[]): void {
  note(`デッキ表示のページ数 ${pages.length}。名前欄: ${pages.slice(0, 30).map((p) => p.名前欄).join("、")}${pages.length > 30 ? " …" : ""}`);
}

/** 001・003・004: 検索して「デッキ表示」を押す（手順1〜3） */
function 検索してデッキ表示(検索語: () => string, 開催日: string[], check: (popup: Page, list: EntryListPage, ctx: CaseCtx) => Promise<void>) {
  return async (ctx: CaseCtx) => {
    const { page, step, expected, capture } = ctx;
    const list = await ログインして開く(page);
    let popup!: Page;
    await step(1, async () => { await デッキ登録の条件を入れる(list, 検索語(), 開催日); });
    await step(2, async () => { await list.検索する(); });
    await step(3, async () => {
      popup = await デッキ表示を開く(page);
      await capture("デッキ表示（別の画面）");
    });
    await expected(async () => {
      expect(popup.isClosed(), "デッキ表示の画面が開いたままである").toBe(false);
      await check(popup, list, ctx);
      await capture("デッキ表示（期待結果）");
    });
  };
}

caseTest("IT-M13-08-001", 検索してデッキ表示(() => 印("M1308-001検索対象大会"), ["2026-10-01", "2026-10-02"], async (popup) => {
  const pages = await デッキ表示を読む(popup);
  名前欄の注記(pages);
  出る(pages, 印("検索対象太郎-001"), true, "検索結果に紐づく");
  出る(pages, 印("比較花子-001"), false, "検索結果に紐づかない");
}));

caseTest("IT-M13-08-002", async ({ page, step, expected, capture }) => {
  // 事前準備②: 新しいブラウザのセッション（ケースごとに Cookie・セッションの無いブラウザで始まる）でログインする。
  // イベント申込一覧を開くと検索条件を持つことになりうるので開かず、新しいセッションであることで「保存されていない」とする
  await loginAdmin(page, M1308_ADMIN);
  note("事前準備の「検索条件が保存されていないこと」は、ケースごとに新しいブラウザのセッション（Cookie なし）でログインし、イベント申込一覧を一度も開いていないことで満たした");
  await step(1, async () => { await デッキ表示をアドレスで開く(page); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname.endsWith(デッキ表示のパス), `開いた画面がデッキ表示（${new URL(page.url()).pathname}）`).toBe(true);
    const pages = await デッキ表示を読む(page);
    名前欄の注記(pages);
    for (const 名 of [印("権限内太郎-002"), 印("検索対象太郎-002"), 印("比較花子-002")]) 出る(pages, 名, true, "空の検索条件の取得結果として");
    const 先頭 = page.locator(".wrapper").filter({ hasText: 印("権限内太郎-002") }).first();
    if (await 先頭.count()) { await 先頭.scrollIntoViewIfNeeded(); await capture("権限内太郎-002 のデッキ"); }
  });
});

caseTest("IT-M13-08-003", 検索してデッキ表示(() => 権限003.検索語(), ["2026-10-07", "2026-10-08"], async (popup) => {
  const pages = await デッキ表示を読む(popup);
  名前欄の注記(pages);
  出る(pages, 印("権限内太郎-003"), true, "編集権限を持つ新宿店の");
  出る(pages, 印("権限外次郎-003"), false, "編集権限を持たない池袋店の");
}));

caseTest("IT-M13-08-004", 検索してデッキ表示(() => 印("M1308-004検索対象大会"), ["2026-10-09", "2026-10-10"], async (popup, list, { page }) => {
  expect.soft(popup === page, "デッキ表示が、イベント申込一覧とは別の画面（別のウィンドウ）に開く").toBe(false);
  expect.soft(new URL(popup.url()).pathname.endsWith(デッキ表示のパス), `別の画面に開いたのがデッキ表示（${new URL(popup.url()).pathname}）`).toBe(true);
  await expect.soft(印刷ボタン(popup), "デッキ表示の印刷ボタン（印刷向けの画面）").toBeVisible();
  expect.soft(await popup.locator(".wrapper").count(), "デッキ表示の印刷用のページ数（1以上）").toBeGreaterThan(0);
  // 元の画面が残っていること
  expect.soft(page.isClosed(), "イベント申込一覧の画面が閉じていない").toBe(false);
  expect.soft(new URL(page.url()).pathname, "元の画面のアドレス（イベント申込一覧）").toMatch(/\/event\/entry(\/page\/\d+)?$/);
  await expect.soft(list.イベント名, "元の画面に、イベント申込一覧（検索入力）の検索条件の欄が残っている").toBeVisible();
  await expect.soft(list.イベント名, "元の画面の検索条件のイベント名").toHaveValue(印("M1308-004検索対象大会"));
}));

/** 005・008・010・011・018: 手順1＝イベント名を指定してデッキ登録を検索、手順2＝デッキ表示ボタン、手順3＝ケースごとの操作・確認 */
function 表示大会(大会名: () => string, 開催日: string, 手順3: (popup: Page, ctx: CaseCtx) => Promise<void>, check: (popup: Page, ctx: CaseCtx) => Promise<void>, 前準備?: (page: Page) => Promise<void>) {
  return async (ctx: CaseCtx) => {
    const { page, step, expected, capture } = ctx;
    const list = await ログインして開く(page);
    if (前準備) await 前準備(page);
    let popup!: Page;
    await step(1, async () => { await デッキ登録の条件を入れる(list, 大会名(), [開催日]); await list.検索する(); });
    await step(2, async () => { popup = await デッキ表示を開く(page); await capture("デッキ表示（別の画面）"); });
    await step(3, async () => { await 手順3(popup, ctx); });
    await expected(async () => {
      expect(popup.isClosed(), "デッキ表示の画面が開いたままである").toBe(false);
      await check(popup, ctx);
      await capture("デッキ表示（期待結果）");
    });
  };
}

/** プレイヤーのデッキのページ（1ページ目）を読み、手順の確認として画面に出す */
async function プレイヤーのページを見る(popup: Page, 名: string, ctx: CaseCtx): Promise<デッキ表示のページ[]> {
  const ps = プレイヤーのページ(await デッキ表示を読む(popup), 名);
  const w = popup.locator(".wrapper").filter({ hasText: 名 }).first();
  if (await w.count()) { await w.scrollIntoViewIfNeeded(); await ctx.capture(`「${名}」のデッキ`); }
  else note(`デッキ表示に「${名}」のデッキのページが無い（全文: ${(await popup.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 200)}）`);
  return ps;
}

caseTest("IT-M13-08-005", 表示大会(() => 表示大会名("005"), "2026-10-15",
  async (popup) => {
    await expect(印刷ボタン(popup), "デッキ表示の印刷ボタン").toBeVisible();
    await 印刷ボタン(popup).click();
  },
  async (popup) => {
    expect(await 印刷の命令の回数(popup), "印刷ボタンで、ブラウザの印刷画面を開く命令が呼ばれた回数").toBe(1);
  },
  async (page) => {
    await 印刷の命令を数える(page.context());
    note("ヘッドレスのブラウザでは印刷画面そのものは出ないので、画面がブラウザの印刷画面を開く命令（印刷の命令）を呼んだことで確かめた（命令は数えるだけで、印刷画面は開かない）");
  }));

caseTest("IT-M13-08-008", 表示大会(() => 表示大会名("008"), "2026-10-15",
  async (popup, ctx) => { await プレイヤーのページを見る(popup, 表示プレイヤー名("008"), ctx); },
  async (popup) => {
    const ps = プレイヤーのページ(await デッキ表示を読む(popup), 表示プレイヤー名("008"));
    expect(ps.length, "「晴屋 太郎-008」のデッキのページ数（1以上）").toBeGreaterThan(0);
    const p = ps[0];
    const サイド区分 = p.区分.filter((s) => s.見出し.startsWith("サイドボード"));
    const メイン行 = p.区分.filter((s) => !s.見出し.startsWith("サイドボード") && !s.見出し.startsWith("統率者")).flatMap((s) => s.行);
    const サイド行 = サイド区分.flatMap((s) => s.行);
    note(`区分: ${p.区分.map((s) => `${s.見出し}［${s.行.map((r) => `${r.枚数} ${r.日本語名}「${r.英語名}」`).join("・")}］`).join(" / ")}。メインの見出し「${p.メインの見出し}」。英語名は画面では「」で囲まれて出るので、囲みを外して比べた`);
    const 行 = (rows: typeof メイン行, 日: string) => rows.find((r) => r.日本語名 === 日);
    for (const [欄, rows, 枚, 日, 英] of [["メイン", メイン行, "4", "稲妻", "Lightning Bolt"], ["メイン", メイン行, "20", "島", "Island"], ["サイド", サイド行, "3", "否認", "Negate"]] as const) {
      const r = 行(rows, 日);
      expect.soft(r ? `${r.枚数} ${r.日本語名} ${r.英語名}` : "（行が無い）", `${欄}の「${日}」の行（数量・日本語名・英語名）`).toBe(`${枚} ${日} ${英}`);
      expect.soft(r?.日本語名が先 ?? false, `${欄}の「${日}」の行で、日本語名が英語名より前に表示される`).toBe(true);
    }
    expect.soft(メイン行.length, "メインのカードの行数（稲妻・島の2行）").toBe(2);
    expect.soft(サイド行.length, "サイドのカードの行数（否認の1行）").toBe(1);
    expect.soft(p.メインの見出し, "メインの合計枚数（見出し）").toBe("メインボード(24)");
    expect.soft(サイド区分.map((s) => s.見出し).join("・"), "サイドの合計枚数（見出し）").toBe("サイドボード(3)");
  }));

caseTest("IT-M13-08-010", 表示大会(() => 表示大会名("010"), "2026-10-15",
  async (popup, ctx) => { await プレイヤーのページを見る(popup, 表示プレイヤー名("010"), ctx); },
  async (popup) => {
    const ps = プレイヤーのページ(await デッキ表示を読む(popup), 表示プレイヤー名("010"));
    expect(ps.length, "「晴屋 太郎-010」のデッキのページ数（1以上）").toBeGreaterThan(0);
    const w = popup.locator(".wrapper").filter({ hasText: 表示プレイヤー名("010") }).first();
    await expect.soft(w.getByText("Table Number:", { exact: true }), "Table Number 欄").toBeVisible();
    for (const [i, p] of ps.entries()) expect.soft(p.表番号, `${i + 1}ページ目の Table Number 欄の値（空欄）`).toBe("");
  }));

caseTest("IT-M13-08-011", 表示大会(() => 表示大会名("011"), "2026-10-15",
  async (popup, ctx) => {
    await プレイヤーのページを見る(popup, 表示プレイヤー名("011"), ctx);
    await popup.evaluate(() => window.scrollTo(0, 0));
    await ctx.capture("デッキ表示の操作部（画面の上端）");
  },
  async (popup) => {
    expect.soft(プレイヤーのページ(await デッキ表示を読む(popup), 表示プレイヤー名("011")).length, "「晴屋 太郎-011」のデッキのページ数（1以上。画面が表示されている）").toBeGreaterThan(0);
    expect.soft((await 入力項目(popup)).join("、"), "デッキ表示の画面にある、利用者が値を入力する項目（入力欄・選択欄・文の入力欄）").toBe("");
  }));

caseTest("IT-M13-08-018", 表示大会(() => 大会018(), "2026-12-01",
  async (popup, ctx) => { await プレイヤーのページを見る(popup, プレイヤー018(), ctx); },
  async (popup) => {
    const ps = プレイヤーのページ(await デッキ表示を読む(popup), プレイヤー018());
    note(`「${プレイヤー018()}」のページ: ${ps.map((p) => `名前欄「${p.名前欄}」・メインの見出し「${p.メインの見出し}」・区分 ${p.区分.map((s) => s.見出し).join("・")}`).join(" / ") || "なし"}`);
    expect.soft(ps.length, "メイン24枚のデッキのページ数（1ページ）").toBe(1);
    const p = ps[0];
    const n = p ? ページ番号(p) : null;
    expect.soft(n?.現在 ?? "（無い）", "現在ページ番号").toBe("1");
    expect.soft(n?.総数 ?? "（無い）", "総ページ数").toBe("1");
    expect.soft(p?.メインの見出し ?? "（無い）", "メイン枚数（見出し）").toBe("メインボード(24)");
    const サイド = (p?.区分 ?? []).filter((s) => s.見出し.startsWith("サイドボード"));
    expect.soft(サイド.map((s) => s.見出し).join("・") || "（サイドボードの見出しが無い）", "サイド枚数（サイドボードの見出しの枚数が0）").toBe("サイドボード(0)");
    expect.soft(サイド.flatMap((s) => s.行).length, "サイドボードに表示されるカードの行数").toBe(0);
  }));

