/**
 * F07-03 大会詳細（フロント）。正本: cases/F07-03_test_cases.tsv
 *
 * 書いていないケースと理由（画面で代えられない DB の準備・中身の決まらない試験画像）:
 * 003・017・046（受付開始・受付終了を DB へ直接設定）、007（バナー画像名を DB へ直接設定・試験画像の中身が決まらない）、
 * 010・011（ファイル管理へ上げる試験画像の中身が決まらない）、037（作成・更新日時を DB へ直接設定・ブラウザ+DB確認）、
 * 042（ルール適用度を固定の番号とアイコン画像で DB へ直接設定）。
 *
 * 専用ブラウザプロファイル（言語・クリップボード・外部サービスのセッション無し）は、ケースごとの新しいブラウザ（Playwright がケースごとに作る）に
 * 設定を足して用意する。画面のキャプチャが残るように、ケースの page をそのまま使う。
 */
import { Page, test } from "@playwright/test";
import { caseTest, CaseBody, expect } from "../../lib/case";
import { BASE_URL } from "../../config/env";
import { frontLogin } from "../../pages/admin/m04_19_order_shortage";
import { EventDetailPage, クエリの値, 検索条件の札 } from "../../pages/front/f07_03_event_detail";
import { 会員一覧, 大会名一覧 } from "../../seeds/f07-03";
import "../../seeds/f07-03";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 詳細ID = (notes: { get(l: string): string }, n: string) => notes.get(`〔イベント詳細ID-F0703-${n}〕`);
const 大会名 = (n: string) => { const v = 大会名一覧.get(n); if (!v) throw new Error(`大会 ${n} が作られていない`); return v; };

/** 専用ブラウザプロファイルの言語設定（ブラウザが送る言語の指定。前例 F03-02） */
async function 言語を設定する(page: Page, 言語: "日本語" | "英語"): Promise<void> {
  const v = 言語 === "英語" ? "en-US,en;q=0.9" : "ja-JP,ja;q=0.9";
  await page.setExtraHTTPHeaders({ "Accept-Language": v });
  note(`ブラウザの言語設定（${言語}）は、ブラウザが送る言語の指定（Accept-Language: ${v}）で設定した`);
}

/** 会員でログインする（ログイン画面でメールアドレスとパスワードを入れる） */
async function 会員でログインする(page: Page, n: string): Promise<void> {
  const m = 会員一覧.get(n);
  if (!m) throw new Error(`会員 ${n} が作られていない`);
  page.setDefaultTimeout(30_000);
  await frontLogin(page, m);
}

/** 大会詳細画面を開いて、本体が出たことを確かめる（読み込み前に数えて0件で合格にしないため） */
async function 詳細を開く(d: EventDetailPage, id: string): Promise<void> {
  const res = await d.開く(id);
  expect(res?.status(), `大会詳細画面（イベント詳細ID ${id}）の応答`).toBe(200);
  await expect(d.ボタン領域, "大会詳細画面の最下段のボタン領域").toBeVisible();
}

// ---- パンくずの遷移（004・005・006） ----

caseTest("IT-F07-03-004", async ({ page, notes, step, expected }) => {
  const d = new EventDetailPage(page);
  const id = 詳細ID(notes, "004");
  await step(1, async () => { await 詳細を開く(d, id); });
  let status = 0;
  await step(2, async () => {
    const link = d.パンくずのリンク("トーナメントセンター東京");
    await expect(link, "パンくずの「トーナメントセンター東京」").toHaveCount(1);
    status = (await d.押して移る(link))?.status() ?? 0;
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "移った画面（大会詳細検索の絞り込み結果）").toMatch(/\/events\/list\/?$/);
    expect.soft(status, "絞り込み結果画面の応答").toBe(200);
    expect.soft(クエリの値(page.url(), "venues"), "絞り込みの条件の店舗（店舗ID 1）").toEqual(["1"]);
    expect.soft(await 検索条件の札(page), "絞り込み結果画面に出た検索条件").toEqual(["トーナメントセンター東京"]);
  });
});

caseTest("IT-F07-03-005", async ({ page, notes, step, expected }) => {
  const d = new EventDetailPage(page);
  const id = 詳細ID(notes, "005");
  await step(1, async () => { await 詳細を開く(d, id); });
  let status = 0;
  await step(2, async () => {
    const link = d.パンくずのリンク("スタンダード");
    await expect(link, "パンくずの「スタンダード」").toHaveCount(1);
    status = (await d.押して移る(link))?.status() ?? 0;
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "移った画面（大会詳細検索の絞り込み結果）").toMatch(/\/events\/list\/?$/);
    expect.soft(status, "絞り込み結果画面の応答").toBe(200);
    expect.soft(クエリの値(page.url(), "formats"), "絞り込みの条件のフォーマット（フォーマットID 1）").toEqual(["1"]);
    expect.soft(await 検索条件の札(page), "絞り込み結果画面に出た検索条件").toEqual(["スタンダード"]);
  });
});

/** 「2026/10/10」「2026-10-10」「2026年10月10日」を「2026-10-10」にそろえる */
const 日付 = (s: string): string => {
  const m = /(\d{4})\s*[/\-年]\s*(\d{1,2})\s*[/\-月]\s*(\d{1,2})/.exec(s);
  return m ? `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` : s;
};

caseTest("IT-F07-03-006", async ({ page, notes, step, expected }) => {
  const d = new EventDetailPage(page);
  const id = 詳細ID(notes, "006");
  await step(1, async () => { await 詳細を開く(d, id); });
  let status = 0;
  await step(2, async () => {
    // 開催日時のパンくずは、パンくずの最後の項目。表示の文字は画面の書式なので、位置で押し、表示の文字を注記に残す
    const link = d.開催日時のパンくず;
    await expect(link, "パンくずの開催日時").toHaveCount(1);
    const 表示 = (await link.innerText()).trim();
    if (表示 !== "2026年10月10日 09時00分") note(`パンくずの開催日時の表示は「${表示}」だった（手順の「2026年10月10日 09時00分」と書式が違う）。開催日時のパンくず（最後の項目）を押した`);
    status = (await d.押して移る(link))?.status() ?? 0;
  });
  await expected(async () => {
    note("開催日付による絞り込みは、アドレスの開催日時の条件（from・to）と、画面に出た検索条件の札の日付を、年月日の値として比べた");
    expect.soft(new URL(page.url()).pathname, "移った画面（大会詳細検索の絞り込み結果）").toMatch(/\/events\/list\/?$/);
    expect.soft(status, "絞り込み結果画面の応答").toBe(200);
    expect.soft(クエリの値(page.url(), "from").map(日付), "絞り込みの条件の開催日（から）").toEqual(["2026-10-10"]);
    expect.soft(クエリの値(page.url(), "to").map(日付), "絞り込みの条件の開催日（まで）").toEqual(["2026-10-10"]);
    const 札 = await 検索条件の札(page);
    expect.soft(札.map((t) => t.split(/[〜~]/).map(日付).join("〜")), "絞り込み結果画面に出た検索条件（開催日の範囲）").toEqual(["2026-10-10〜2026-10-10"]);
  });
});

// ---- バナー（008） ----

caseTest("IT-F07-03-008", async ({ page, notes, step, expected }) => {
  const d = new EventDetailPage(page);
  const id = 詳細ID(notes, "008");
  await step(1, async () => { await 詳細を開く(d, id); });
  await step(2, async () => { await expect(d.イベント名, "大会名の見出し").toBeVisible(); await page.evaluate(() => window.scrollTo(0, 0)); });
  await expected(async () => {
    expect.soft(await d.バナーの領域.count(), "画面最上部のバナーの領域の数").toBe(0);
    expect.soft(await d.バナー画像.count(), "バナー画像の数").toBe(0);
  });
});

// ---- フリーエリアの初期状態（012・013） ----

function フリーエリアの初期状態(n: string, 開いている: boolean): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const d = new EventDetailPage(page);
    const id = 詳細ID(notes, n);
    await step(1, async () => { await 詳細を開く(d, id); });
    await step(2, async () => {
      for (const i of [1, 2, 3] as const) await expect(d.フリー入力エリアの見出し(i), `フリーエリア${i}の見出し`).toBeVisible();
    });
    await expected(async () => {
      for (const i of [1, 2, 3] as const) {
        expect.soft(await d.フリー入力エリアの見出し(i).getAttribute("aria-expanded"), `フリーエリア${i}の開閉の状態（true＝開いている）`).toBe(開いている ? "true" : "false");
        if (開いている) await expect.soft(d.フリー入力エリアの内容(i), `フリーエリア${i}の内容`).toBeVisible();
        else await expect.soft(d.フリー入力エリアの内容(i), `フリーエリア${i}の内容`).toBeHidden();
      }
    });
  };
}
caseTest("IT-F07-03-012", フリーエリアの初期状態("012", true));
caseTest("IT-F07-03-013", フリーエリアの初期状態("013", false));

// ---- 共有の操作ボタン（018・033・034） ----

caseTest("IT-F07-03-018", async ({ page, notes, step, expected }) => {
  const d = new EventDetailPage(page);
  const id = 詳細ID(notes, "018");
  await step(1, async () => { await 詳細を開く(d, id); });
  await step(2, async () => { await d.ボタン領域.scrollIntoViewIfNeeded(); });
  await expected(async () => {
    await expect.soft(d.Googleカレンダーボタン, "Googleカレンダー登録のボタン").toBeVisible();
    await expect.soft(d.Xボタン, "Xポストのボタン").toBeVisible();
    await expect.soft(d.LINEボタン, "LINEシェアのボタン").toBeVisible();
    await expect.soft(d.リンクシェアボタン, "リンクシェアのボタン").toBeVisible();
  });
});

caseTest("IT-F07-03-033", async ({ page, notes, step, expected }) => {
  // 専用ブラウザプロファイル f0703-logout-033: Playwright がケースごとに作る新しいブラウザ（Google・X・LINE のセッションも保存情報も無い）
  note("Google・X・LINE のセッションが無い専用ブラウザは、ケースごとに作られる新しいブラウザ（保存情報なし）で代えた。遷移先は外部のサービスの画面");
  const d = new EventDetailPage(page);
  const id = 詳細ID(notes, "033");
  const 開いた先: Record<string, string> = {};
  /** ボタンを押して開いた別のタブ（外部のサービス）の、読み込み後のアドレスを控えて閉じる */
  const 押して遷移先を見る = async (名: string, ボタン: import("@playwright/test").Locator) => {
    await ボタン.scrollIntoViewIfNeeded();
    const [popup] = await Promise.all([page.context().waitForEvent("page", { timeout: 30_000 }), ボタン.click()]);
    await popup.waitForLoadState("load", { timeout: 60_000 }).catch(() => {});
    await popup.waitForTimeout(3_000);
    開いた先[名] = popup.url();
    note(`${名}のボタンで開いた画面: ${popup.url()}（題名「${await popup.title().catch(() => "")}」）`);
    await popup.close();
    await page.bringToFront();
  };
  await step(1, async () => { await 詳細を開く(d, id); await 押して遷移先を見る("Googleカレンダー", d.Googleカレンダーボタン); });
  await step(2, async () => { await expect(d.ボタン領域, "大会詳細画面へ戻った").toBeVisible(); await 押して遷移先を見る("Xポスト", d.Xボタン); });
  await step(3, async () => { await expect(d.ボタン領域, "大会詳細画面へ戻った").toBeVisible(); await 押して遷移先を見る("LINEシェア", d.LINEボタン); });
  await expected(async () => {
    note("ログイン画面かどうかは、開いた画面のアドレス（Google はアカウントのログイン、X・LINE はログインの画面のアドレス）で見た");
    expect.soft(開いた先["Googleカレンダー"] ?? "", "Googleカレンダーのボタンで開いた画面（Google のログイン画面）").toMatch(/^https:\/\/accounts\.google\.com\//);
    expect.soft(開いた先["Xポスト"] ?? "", "Xポストのボタンで開いた画面（X のログイン画面）").toMatch(/^https:\/\/(x|twitter)\.com\/(i\/flow\/login|login)/);
    expect.soft(開いた先["LINEシェア"] ?? "", "LINEシェアのボタンで開いた画面（LINE のログイン画面）").toMatch(/^https:\/\/access\.line\.me\/.*login/);
  });
});

caseTest("IT-F07-03-034", async ({ page, notes, step, expected }) => {
  // 専用ブラウザプロファイル f0703-clipboard-034: クリップボードの読み書きを許可する
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(BASE_URL).origin });
  note("クリップボードの読み取りを許可した専用ブラウザは、ケースのブラウザにクリップボードの読み書きの許可を与えて代えた");
  const d = new EventDetailPage(page);
  const id = 詳細ID(notes, "034");
  const 知らせ: string[] = [];
  page.on("dialog", (dlg) => { 知らせ.push(dlg.message()); void dlg.accept(); });
  await step(1, async () => { await 詳細を開く(d, id); });
  await step(2, async () => {
    if (await d.共有の機能がある()) note("このブラウザには共有の機能（navigator.share）があり、画面はクリップボードでなく共有の機能を使う作り");
    await d.リンクシェアボタン.scrollIntoViewIfNeeded();
    await d.リンクシェアボタン.click();
    for (let t = 0; t < 20 && 知らせ.length === 0; t++) await page.waitForTimeout(500);
    note(`リンクシェアを押したあとの知らせ: ${知らせ.length ? 知らせ.map((t) => `「${t}」`).join("・") : "なし"}`);
  });
  let 内容 = "";
  let 開いた = 0;
  await step(3, async () => {
    内容 = (await d.クリップボードを読む()).trim();
    note(`クリップボードの内容: 「${内容}」。アドレスバーへ貼り付けて開くのは、その内容のアドレスを開いて代えた`);
    if (/^https?:\/\//.test(内容)) 開いた = (await page.goto(内容, { timeout: 60_000 }))?.status() ?? 0;
  });
  await expected(async () => {
    expect.soft(/^https?:\/\//.test(内容) ? new URL(内容).pathname : 内容, "クリップボードの内容（大会詳細のリンク）").toBe(`/ja/events/${id}/detail`);
    expect.soft(/^https?:\/\//.test(内容) ? new URL(内容).host : "", "クリップボードのリンクの接続先").toBe(new URL(BASE_URL).host);
    expect.soft(開いた, "貼り付けたリンクで開いた大会詳細画面の応答").toBe(200);
  });
});

// ---- 存在しないイベント詳細（036） ----

caseTest("IT-F07-03-036", async ({ page, step, expected }) => {
  const d = new EventDetailPage(page);
  let status = 0;
  await step(1, async () => { status = (await d.開く("99999999"))?.status() ?? 0; });
  await step(2, async () => { note(`ブラウザのネットワーク応答（大会詳細画面のドキュメント要求）の状態: ${status}`); });
  await expected(async () => {
    expect.soft(status, "大会詳細画面の要求の HTTP の状態").toBe(404);
    expect.soft(await d.ボタン領域.count(), "大会詳細画面（最下段のボタン領域）の数").toBe(0);
    expect.soft(await d.本体.count(), "大会詳細画面の本体の数").toBe(0);
  });
});

// ---- 言語別のイベント名（041） ----

caseTest("IT-F07-03-041", async ({ page, notes, step, expected }) => {
  const d = new EventDetailPage(page);
  const id = 詳細ID(notes, "041");
  const 名 = 大会名("041");
  await 言語を設定する(page, "英語");
  await step(1, async () => {
    note("大会詳細画面は、設計書のアドレス（/ja/events/<イベント詳細ID>/detail）で開いた。アプリは表示言語をアドレスの先頭（/ja・/en）で決める作り");
    await 詳細を開く(d, id);
    note(`開いた画面の表示言語（html の lang）: ${await d.表示言語()}`);
  });
  let 見出し = "";
  await step(2, async () => { 見出し = (await d.イベント名.innerText()).trim(); });
  await expected(async () => {
    expect.soft(見出し, "イベント名（英語で登録した名）").toBe(名.英);
    expect.soft((await d.本文()).includes(名.日), "日本語で登録したイベント名が画面に表示されない").toBe(false);
  });
});

// ---- 申込・キャンセル申込のボタン（050〜054） ----

type 申込ボタンの期待 = { 申込: boolean; キャンセル: boolean };
function 申込ボタン(n: string, ログイン: boolean, 期待: 申込ボタンの期待): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const d = new EventDetailPage(page);
    const id = 詳細ID(notes, n);
    let i = 1;
    if (ログイン) await step(i++, async () => { await 会員でログインする(page, n); });
    await step(i++, async () => { await 詳細を開く(d, id); });
    await step(i++, async () => {
      await d.ボタン領域.scrollIntoViewIfNeeded();
      for (const [名, l] of [["申込", d.申込ボタン(id)], ["キャンセル申込", d.キャンセル申込ボタン]] as const) {
        if (await l.count()) note(`${名}のボタンの文言は「${await d.ボタンの文言(l)}」（ボタンは行き先のページで見分けた）`);
      }
    });
    await expected(async () => {
      expect.soft(await d.申込ボタン(id).count(), "「イベント申込み」ボタン（大会申込ページへのボタン）の数").toBe(期待.申込 ? 1 : 0);
      expect.soft(await d.キャンセル申込ボタン.count(), "「キャンセル申込み」ボタン（お問い合わせページへのボタン）の数").toBe(期待.キャンセル ? 1 : 0);
      if (期待.申込) await expect.soft(d.申込ボタン(id), "「イベント申込み」ボタン").toBeVisible();
      if (期待.キャンセル) await expect.soft(d.キャンセル申込ボタン, "「キャンセル申込み」ボタン").toBeVisible();
    });
  };
}
caseTest("IT-F07-03-050", 申込ボタン("050", true, { 申込: true, キャンセル: false }));
caseTest("IT-F07-03-051", 申込ボタン("051", true, { 申込: false, キャンセル: true }));
caseTest("IT-F07-03-052", 申込ボタン("052", false, { 申込: false, キャンセル: false }));
caseTest("IT-F07-03-053", 申込ボタン("053", false, { 申込: false, キャンセル: false }));
caseTest("IT-F07-03-054", 申込ボタン("054", true, { 申込: false, キャンセル: false }));

// ---- デッキ登録のボタン（055〜065） ----

/** 言語を設定したブラウザで会員でログインし、大会詳細画面のデッキ登録のボタンの文言（null＝ボタンが無いことを期待）を確かめる */
function デッキボタン(n: string, 言語: "日本語" | "英語" | null, 文言: string | null): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const d = new EventDetailPage(page);
    const id = 詳細ID(notes, n);
    await step(1, async () => {
      if (言語) await 言語を設定する(page, 言語);
      await 会員でログインする(page, n);
    });
    await step(2, async () => {
      if (言語 === "英語") note("大会詳細画面は、設計書のアドレス（/ja/events/<イベント詳細ID>/detail）で開いた。アプリは表示言語をアドレスの先頭（/ja・/en）で決める作り");
      await 詳細を開く(d, id);
      if (言語) note(`開いた画面の表示言語（html の lang）: ${await d.表示言語()}`);
    });
    await step(3, async () => { await d.ボタン領域.scrollIntoViewIfNeeded(); });
    await expected(async () => {
      const b = d.デッキ登録ボタン(id);
      if (文言 === null) {
        expect.soft(await b.count(), "デッキ登録のボタン（大会デッキ登録ページへのボタン）の数").toBe(0);
        return;
      }
      expect.soft(await b.count(), "デッキ登録のボタン（大会デッキ登録ページへのボタン）の数").toBe(1);
      if (await b.count()) {
        await expect.soft(b.first(), "デッキ登録のボタン").toBeVisible();
        expect.soft(await d.ボタンの文言(b), "デッキ登録のボタンの文言").toBe(文言);
      }
    });
  };
}
caseTest("IT-F07-03-055", デッキボタン("055", "日本語", "デッキ登録"));
caseTest("IT-F07-03-056", デッキボタン("056", "英語", "Decklist"));
caseTest("IT-F07-03-057", デッキボタン("057", "日本語", "デッキ編集"));
caseTest("IT-F07-03-058", デッキボタン("058", "英語", "Decklist"));
caseTest("IT-F07-03-059", デッキボタン("059", "日本語", "デッキ登録"));
caseTest("IT-F07-03-060", デッキボタン("060", "英語", "Decklist"));
caseTest("IT-F07-03-061", デッキボタン("061", "日本語", "デッキ登録"));
caseTest("IT-F07-03-062", デッキボタン("062", "英語", "Decklist"));
caseTest("IT-F07-03-063", デッキボタン("063", null, null));
caseTest("IT-F07-03-064", デッキボタン("064", null, null));
caseTest("IT-F07-03-065", デッキボタン("065", null, null));

// ---- 事前予約欄（066〜068） ----

caseTest("IT-F07-03-066", async ({ page, notes, step, expected }) => {
  const d = new EventDetailPage(page);
  const id = 詳細ID(notes, "066");
  await step(1, async () => { await 詳細を開く(d, id); });
  await step(2, async () => { await d.事前予約欄.scrollIntoViewIfNeeded().catch(() => {}); });
  await expected(async () => {
    note("残り予約数は、期待結果が単位を書いていないので、値の数（10）として比べた（単位「人」は付いていてもよい）");
    expect.soft((await d.事前予約欄の見出し.allInnerTexts()).map((t) => t.trim()), "事前予約欄の見出し").toEqual(["事前予約情報"]);
    const 期間 = await d.事前予約欄の値("事前予約期間");
    expect.soft(期間, "事前予約期間（開始）").toContain("2020年1月1日 00時00分");
    expect.soft(期間, "事前予約期間（終了）").toContain("2099年12月20日 09時00分");
    expect.soft(await d.事前予約欄の値("残り予約数"), "残り予約数").toMatch(/^10\s*人?$/);
    expect.soft(await d.事前予約欄の値("参加費(事前予約)"), "参加費(事前予約)").toBe("1,000円");
  });
});

caseTest("IT-F07-03-067", async ({ page, notes, step, expected }) => {
  const d = new EventDetailPage(page);
  const id = 詳細ID(notes, "067");
  await step(1, async () => { await 詳細を開く(d, id); });
  await step(2, async () => { await d.事前予約欄.scrollIntoViewIfNeeded().catch(() => {}); });
  await expected(async () => {
    expect.soft((await d.事前予約欄の見出し.allInnerTexts()).map((t) => t.trim()), "事前予約欄の見出し").toEqual(["事前予約情報"]);
    const 期間 = await d.事前予約欄の値("事前予約期間");
    expect.soft(期間, "事前予約期間（開始）").toContain("2020年1月1日 00時00分");
    expect.soft(期間, "事前予約期間（終了）").toContain("2020年12月31日 23時59分");
    expect.soft(await d.事前予約欄の値("参加費(事前予約)"), "参加費(事前予約)").toBe("1,000円");
    expect.soft(await d.事前予約欄の行("残り予約数").count(), "「残り予約数」の行の数").toBe(0);
  });
});

caseTest("IT-F07-03-068", async ({ page, notes, step, expected }) => {
  const d = new EventDetailPage(page);
  const id = 詳細ID(notes, "068");
  await step(1, async () => { await 詳細を開く(d, id); });
  await step(2, async () => { await expect(d.イベント名, "大会名の見出し").toBeVisible(); });
  await expected(async () => {
    const 本文 = await d.本文();
    expect.soft(await d.事前予約欄.count(), "事前予約欄の数").toBe(0);
    for (const 語 of ["事前予約情報", "事前予約期間", "残り予約数", "参加費(事前予約)"]) expect.soft(本文.includes(語), `「${語}」が画面に表示されない`).toBe(false);
  });
});
