/** F09-01 デッキ検索TOP（フロント）。正本: cases/F09-01_test_cases.tsv */
import { Page, Request, test } from "@playwright/test";
import { caseTest, CaseBody, expect } from "../../lib/case";
import { DeckResultView, DeckSearchModal, DeckTopPage, MetagameView } from "../../pages/front/f09_01_deck_top";
import { 日付, 表示日付 } from "../../pages/admin/f09_01_setup";
import { プレイヤー名のデッキの更新日時 } from "../../db/f09_01";
import { N, アーキタイプの番号, タグの番号, フォーマットの番号 } from "../../seeds/f09-01";
import "../../seeds/f09-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const モーダルの注記 = "検索条件の入力欄は、画面上部の「詳細検索」で開くモーダル（デッキ詳細検索）の中にある。モーダルを開いてから操作した";

/** デッキ検索結果への要求（画面の移動の要求）を待つ */
const 結果への要求 = (page: Page) =>
  page.waitForRequest((r) => r.isNavigationRequest() && /\/deck\/result\//.test(new URL(r.url()).pathname), { timeout: 60_000 });

/** デッキ検索結果の画面のアドレスと、並ぶプレイヤー名を読む */
async function 結果を読む(page: Page): Promise<{ パス: string; 名前: string[] }> {
  return { パス: new URL(page.url()).pathname, 名前: await new DeckResultView(page).プレイヤー名() };
}

type 項目 = { 名前: string; デッキ数: string };

// ---------------------------------------------------------------------------
// メタゲームの区画
// ---------------------------------------------------------------------------

caseTest("IT-F09-01-001", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  await step(1, async () => { await top.開く(); });
  await expected(async () => {
    await expect.soft(top.区画(N("001", "F1")), "フォーマットF0901-001-F1のメタゲームの区画").toHaveCount(1);
    expect.soft((await top.アーキタイプ(N("001", "F1"))).map((a) => a.名前), "区画に示されたアーキタイプ").toContain(N("001", "A1"));
  });
});

caseTest("IT-F09-01-002", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  await step(1, async () => { await top.開く(); });
  await expected(async () => {
    // 比べる相手として、ランキング表示の対象の F1 の区画が出ていること（画面の組み立てが済んでいる）も確かめる
    await expect.soft(top.区画(N("002", "F1")), "ランキング表示の対象のフォーマットF0901-002-F1の区画（比べる相手）").toHaveCount(1);
    await expect.soft(top.区画(N("002", "F2")), "ランキング表示の対象でないフォーマットF0901-002-F2の区画").toHaveCount(0);
  });
});

caseTest("IT-F09-01-003", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  let 並び: string[] = [];
  await step(1, async () => { await top.開く(); });
  await step(2, async () => { 並び = await top.区画のフォーマット名(); });
  await expected(async () => {
    const a = 並び.indexOf(N("003", "Fa")), b = 並び.indexOf(N("003", "Fb"));
    expect.soft(a, "フォーマットF0901-003-Faの区画の位置（上から。0始まり）").toBeGreaterThanOrEqual(0);
    expect.soft(b, "フォーマットF0901-003-Fbの区画の位置（上から。0始まり）").toBeGreaterThanOrEqual(0);
    expect.soft(a < b, `Fa（${a + 1}番目）が Fb（${b + 1}番目）より上に並ぶ`).toBe(true);
  });
});

/** フォーマットの区画で、アーキタイプA1のデッキ数を確かめる（004・005・006） */
function デッキ数の確かめ(ケース: string, 期待: number): CaseBody {
  return async ({ page, step, expected }) => {
    const top = new DeckTopPage(page);
    let 項目: 項目[] = [];
    await step(1, async () => { await top.開く(); });
    await step(2, async () => { 項目 = await top.アーキタイプ(N(ケース, "F1")); });
    await expected(async () => {
      const a = 項目.filter((x) => x.名前 === N(ケース, "A1"));
      expect.soft(a.length, `アーキタイプF0901-${ケース}-A1が区画に示される件数`).toBe(1);
      expect.soft(a[0]?.デッキ数, `アーキタイプF0901-${ケース}-A1のデッキ数の表示`).toBe(`デッキ数：${期待}`);
    });
  };
}
caseTest("IT-F09-01-004", デッキ数の確かめ("004", 2));
caseTest("IT-F09-01-005", デッキ数の確かめ("005", 2));
caseTest("IT-F09-01-006", デッキ数の確かめ("006", 3));

caseTest("IT-F09-01-007", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  let 項目: 項目[] = [];
  await step(1, async () => { await top.開く(); });
  await step(2, async () => { 項目 = await top.アーキタイプ(N("007", "F1")); });
  await expected(async () => {
    expect.soft(項目.map((x) => `${x.名前}（${x.デッキ数}）`), "区画に示されたアーキタイプ（上から順）").toEqual([
      `${N("007", "A2")}（デッキ数：3）`, `${N("007", "A3")}（デッキ数：2）`, `${N("007", "A1")}（デッキ数：1）`,
    ]);
  });
});

caseTest("IT-F09-01-008", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  let 項目: 項目[] = [];
  await step(1, async () => { await top.開く(); });
  await step(2, async () => { 項目 = await top.アーキタイプ(N("008", "F1")); });
  await expected(async () => {
    expect.soft(項目.map((x) => x.名前), "区画に示されたアーキタイプ（すべて）").toEqual([N("008", "A1")]);
    expect.soft(項目[0]?.デッキ数, "アーキタイプF0901-008-A1のデッキ数の表示").toBe("デッキ数：4");
  });
});

caseTest("IT-F09-01-009", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  let 名前: string[] = [];
  await step(1, async () => { await top.開く(); });
  await step(2, async () => { 名前 = (await top.アーキタイプ(N("009", "F1"))).map((x) => x.名前); });
  await expected(async () => {
    expect.soft(名前.length, "区画に示されたアーキタイプの件数").toBe(3);
    expect.soft(名前, "区画に示されたアーキタイプ").toEqual([N("009", "A1"), N("009", "A2"), N("009", "A3")]);
  });
});

caseTest("IT-F09-01-010", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  let 区画: { 文: string; リンク: string[] } = { 文: "", リンク: [] };
  let 名前: string[] = [];
  await step(1, async () => { await top.開く(); });
  await step(2, async () => {
    await expect(top.区画(N("010", "F1")), "フォーマットF0901-010-F1のメタゲームの区画").toHaveCount(1);
    区画 = await top.区画の文とリンク(N("010", "F1"));
    名前 = (await top.アーキタイプ(N("010", "F1"))).map((x) => x.名前);
  });
  await expected(async () => {
    // 区画が読めていること（首位のアーキタイプが出ている）を前提に、4位の名前が無いことを見る
    expect.soft(名前, "区画に示されたアーキタイプ（読み取りの前提）").toContain(N("010", "A1"));
    expect.soft(区画.文.includes(N("010", "A4")), "4位のアーキタイプF0901-010-A4の名称が区画の表示に現れる").toBe(false);
    expect.soft(区画.リンク.filter((h) => h.includes(N("010", "A4"))), "4位のアーキタイプF0901-010-A4の名称を含むリンク").toEqual([]);
  });
});

/** 区画に、A1 がデッキ数1で示され、A2 は示されない（012・013） */
function 期間の境目(ケース: string): CaseBody {
  return async ({ page, step, expected }) => {
    const top = new DeckTopPage(page);
    let 項目: 項目[] = [];
    await step(1, async () => { await top.開く(); });
    await step(2, async () => { 項目 = await top.アーキタイプ(N(ケース, "F1")); });
    await expected(async () => {
      expect.soft(項目.find((x) => x.名前 === N(ケース, "A1"))?.デッキ数, `アーキタイプF0901-${ケース}-A1のデッキ数の表示`).toBe("デッキ数：1");
      expect.soft(項目.map((x) => x.名前), "区画に示されたアーキタイプ").not.toContain(N(ケース, "A2"));
    });
  };
}
caseTest("IT-F09-01-012", 期間の境目("012"));
caseTest("IT-F09-01-013", 期間の境目("013"));

// 015: 登録日（DBで設定）が古くても、開催日が期間内なら数える。期間の境目と同じ確かめ
caseTest("IT-F09-01-015", 期間の境目("015"));

caseTest("IT-F09-01-014", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  let f1: 項目[] = [], f2: 項目[] = [];
  await step(1, async () => { await top.開く(); });
  await step(2, async () => {
    await expect(top.区画(N("014", "F1")), "フォーマットF0901-014-F1のメタゲームの区画").toHaveCount(1);
    await expect(top.区画(N("014", "F2")), "フォーマットF0901-014-F2のメタゲームの区画").toHaveCount(1);
    f1 = await top.アーキタイプ(N("014", "F1"));
    f2 = await top.アーキタイプ(N("014", "F2"));
  });
  await expected(async () => {
    expect.soft(f2.find((x) => x.名前 === N("014", "A2"))?.デッキ数, "F2の区画のアーキタイプF0901-014-A2のデッキ数の表示").toBe("デッキ数：1");
    expect.soft(f1.map((x) => x.名前), "F1の区画に示されたアーキタイプ").not.toContain(N("014", "A1"));
  });
});

caseTest("IT-F09-01-017", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  let 文 = "";
  await step(1, async () => { await top.開く(); });
  await step(2, async () => {
    await expect(top.区画(N("017", "F1")), "フォーマットF0901-017-F1のメタゲームの区画").toHaveCount(1);
    文 = (await top.区画の文とリンク(N("017", "F1"))).文;
  });
  await expected(async () => {
    expect.soft(文, "フォーマットF0901-017-F1の区画の文（読み取りの前提）").toContain(`${N("017", "F1")}メタゲーム`);
    expect.soft(文.includes("デッキ数："), "区画に「デッキ数：」が表示される").toBe(false);
  });
});

caseTest("IT-F09-01-019", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  await step(1, async () => { await top.開く(); });
  await expected(async () => {
    // 開く() は、その他フォーマットの案内の「その他」まで画面が組み立て済みであることを確かめている
    await expect.soft(top.メタゲームの区画, "メタゲームの区画の数").toHaveCount(0);
  });
});

caseTest("IT-F09-01-085", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  let f1: 項目[] = [], f2: 項目[] = [];
  await step(1, async () => { await top.開く(); });
  await step(2, async () => {
    await expect(top.区画(N("085", "F1")), "フォーマットF0901-085-F1のメタゲームの区画").toHaveCount(1);
    await expect(top.区画(N("085", "F2")), "フォーマットF0901-085-F2のメタゲームの区画").toHaveCount(1);
    f1 = await top.アーキタイプ(N("085", "F1"));
    f2 = await top.アーキタイプ(N("085", "F2"));
  });
  await expected(async () => {
    expect.soft(f1.length, "F1の区画に示されたアーキタイプの件数").toBe(0);
    await expect.soft(top.もっと見る(N("085", "F1")), "F1の区画のメタゲーム一覧への入口「もっと見る」").toHaveText(/^\s*もっと見る\s*$/);
    expect.soft(f2.find((x) => x.名前 === N("085", "A1"))?.デッキ数, "F2の区画のアーキタイプF0901-085-A1の「デッキ数：」付きの表示").toBe("デッキ数：1");
  });
});

// ---------------------------------------------------------------------------
// その他フォーマットの案内
// ---------------------------------------------------------------------------

caseTest("IT-F09-01-023", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  let 入口: string[] = [];
  await step(1, async () => { await top.開く(); });
  await step(2, async () => { 入口 = await top.その他フォーマットの入口(); });
  await expected(async () => {
    expect.soft(入口, "その他フォーマットの案内の入口").toContain(N("023", "F1"));
    await expect.soft(top.その他フォーマットのリンク(N("023", "F1")), "フォーマットF0901-023-F1の入口（リンク先）").toHaveAttribute("href", /\/deck\/\d+\/metagame\/$/);
  });
});

caseTest("IT-F09-01-024", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  let 入口: string[] = [];
  await step(1, async () => { await top.開く(); });
  await step(2, async () => { 入口 = await top.その他フォーマットの入口(); });
  await expected(async () => {
    expect.soft(入口, "その他フォーマットの案内の入口").not.toContain(N("024", "F2"));
  });
});

caseTest("IT-F09-01-025", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  let 入口: string[] = [];
  await step(1, async () => { await top.開く(); });
  await step(2, async () => { 入口 = await top.その他フォーマットの入口(); });
  await expected(async () => {
    const a = 入口.indexOf(N("025", "Fa")), b = 入口.indexOf(N("025", "Fb"));
    expect.soft(a, "フォーマットF0901-025-Faの入口の位置（0始まり）").toBeGreaterThanOrEqual(0);
    expect.soft(b, "フォーマットF0901-025-Fbの入口の位置（0始まり）").toBeGreaterThanOrEqual(0);
    expect.soft(a < b, `Fa（${a + 1}番目）が Fb（${b + 1}番目）より上に並ぶ`).toBe(true);
  });
});

caseTest("IT-F09-01-026", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  let 入口: string[] = [];
  await step(1, async () => { await top.開く(); });
  await step(2, async () => { 入口 = await top.その他フォーマットの入口(); });
  await expected(async () => {
    expect.soft(入口, "その他フォーマットの案内のフォーマットの入口").toEqual([]);
    await expect.soft(top.その他の入口, "その他デッキ一覧への入口「その他」").toHaveText(/^\s*その他\s*$/);
  });
});

caseTest("IT-F09-01-027", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const meta = new MetagameView(page);
  await step(1, async () => { await top.開く(); });
  await step(2, async () => {
    const link = top.その他フォーマットのリンク(N("027", "F1"));
    await expect(link, "その他フォーマットの案内の、フォーマットF0901-027-F1の入口").toHaveCount(1);
    await Promise.all([page.waitForURL(/\/deck\/\d+\/metagame\//, { waitUntil: "load" }), link.click()]);
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "開いた画面のアドレス").toBe(`/ja/deck/${フォーマットの番号("027", "F1")}/metagame/`);
    expect.soft(await meta.見出し(), "メタゲーム一覧の見出し").toContain(`${N("027", "F1")}メタゲーム`);
    const 名前 = await meta.アーキタイプ名();
    expect.soft(名前, "メタゲーム一覧に並ぶアーキタイプ（A1が並ぶ）").toContain(N("027", "A1"));
    expect.soft(名前, "メタゲーム一覧に並ぶアーキタイプ（A2は並ばない）").not.toContain(N("027", "A2"));
  });
});

// ---------------------------------------------------------------------------
// 直近の大会
// ---------------------------------------------------------------------------

caseTest("IT-F09-01-028", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  let 大会名: string[] = [];
  await step(1, async () => { await top.開く(); });
  await step(2, async () => { 大会名 = (await top.直近の大会の行()).map((r) => r.大会名); });
  await expected(async () => {
    await expect.soft(top.直近の大会の区画, "直近の大会の区画").toBeVisible();
    await expect.soft(top.直近の大会の見出し, "直近の大会の区画の見出し").toHaveText(/^\s*直近の大会でデッキ検索\s*$/);
    expect.soft(大会名, "直近の大会の行の大会名").toContain(N("028", "E1"));
  });
});

caseTest("IT-F09-01-029", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  let 行: Awaited<ReturnType<DeckTopPage["直近の大会の行"]>> = [];
  await step(1, async () => { await top.開く(); });
  await step(2, async () => { 行 = await top.直近の大会の行(); });
  await expected(async () => {
    const r = 行.find((x) => x.大会名 === N("029", "E1"));
    expect.soft(r?.大会名, "大会F0901-029-E1の行").toBe(N("029", "E1"));
    expect.soft(r?.開催日, "行の開催日（当日の3日前）").toBe(表示日付(日付(-3)));
    expect.soft(r?.フォーマット, "行のフォーマット名").toBe(N("029", "F1"));
    // 参加人数は「64名」の形で出る（画面の文言「%count%名」）。数として64であることを見る
    expect.soft(r?.参加人数, "行の参加人数").toMatch(/^64\D*$/);
  });
});

caseTest("IT-F09-01-032", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  let 大会名: string[] = [];
  await step(1, async () => { await top.開く(); });
  await step(2, async () => { 大会名 = (await top.直近の大会の行()).map((r) => r.大会名); });
  await expected(async () => {
    const a = 大会名.indexOf(N("032", "E1")), b = 大会名.indexOf(N("032", "E2"));
    expect.soft(a, "大会F0901-032-E1の行の位置（0始まり）").toBeGreaterThanOrEqual(0);
    expect.soft(b, "大会F0901-032-E2の行の位置（0始まり）").toBeGreaterThanOrEqual(0);
    expect.soft(a < b, `E1（${a + 1}行目）が E2（${b + 1}行目）より上に並ぶ`).toBe(true);
  });
});

caseTest("IT-F09-01-033", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  await step(1, async () => { await top.開く(); });
  await step(2, async () => { await top.その他の入口.scrollIntoViewIfNeeded(); });
  await expected(async () => {
    await expect.soft(top.直近の大会の区画, "直近の大会の区画").toHaveCount(0);
    await expect.soft(page.getByText("直近の大会でデッキ検索"), "見出し「直近の大会でデッキ検索」").toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// 遷移
// ---------------------------------------------------------------------------

caseTest("IT-F09-01-034", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  await step(1, async () => { await top.開く(); });
  await step(2, async () => {
    const link = top.アーキタイプのリンク(N("034", "F1"), N("034", "A1"));
    await expect(link, "フォーマットF0901-034-F1の区画の、アーキタイプF0901-034-A1").toHaveCount(1);
    await Promise.all([page.waitForURL(/\/deck\/result\//, { waitUntil: "load" }), link.click()]);
  });
  await expected(async () => {
    const r = await 結果を読む(page);
    expect.soft(r.パス, "開いた画面のアドレス（デッキ検索結果）").toBe("/ja/deck/result/");
    expect.soft(r.名前, "デッキ検索結果に並ぶプレイヤー名（P1が並ぶ）").toContain(N("034", "P1"));
    expect.soft(r.名前, "デッキ検索結果に並ぶプレイヤー名（集計期間の開始日より前のP2は並ばない）").not.toContain(N("034", "P2"));
    expect.soft(r.名前, "デッキ検索結果に並ぶプレイヤー名（別のアーキタイプのP3は並ばない）").not.toContain(N("034", "P3"));
  });
});

caseTest("IT-F09-01-036", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const meta = new MetagameView(page);
  await step(1, async () => { await top.開く(); });
  await step(2, async () => {
    const more = top.もっと見る(N("036", "Fa"));
    await expect(more, "フォーマットF0901-036-Faの区画の「もっと見る」").toHaveText(/^\s*もっと見る\s*$/);
    await more.scrollIntoViewIfNeeded();
    await Promise.all([page.waitForURL(/\/deck\/\d+\/metagame\//, { waitUntil: "load" }), more.click()]);
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "開いた画面のアドレス").toBe(`/ja/deck/${フォーマットの番号("036", "Fa")}/metagame/`);
    expect.soft(await meta.見出し(), "メタゲーム一覧の見出し").toContain(`${N("036", "Fa")}メタゲーム`);
    const 名前 = await meta.アーキタイプ名();
    expect.soft(名前, "メタゲーム一覧に並ぶアーキタイプ（4位のA4が並ぶ）").toContain(N("036", "A4"));
    expect.soft(名前, "メタゲーム一覧に並ぶアーキタイプ（5位のA5が並ぶ）").toContain(N("036", "A5"));
    expect.soft(名前, "メタゲーム一覧に並ぶアーキタイプ（別のフォーマットのA9は並ばない）").not.toContain(N("036", "A9"));
  });
});

caseTest("IT-F09-01-037", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const meta = new MetagameView(page);
  await step(1, async () => { await top.開く(); });
  await step(2, async () => {
    const head = top.見出しのリンク(N("037", "Fa"));
    await expect(head, "フォーマットF0901-037-Faの区画の見出しのリンク").toHaveCount(1);
    await head.scrollIntoViewIfNeeded();
    await Promise.all([page.waitForURL(/\/deck\/\d+\/metagame\//, { waitUntil: "load" }), head.click()]);
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "開いた画面のアドレス").toBe(`/ja/deck/${フォーマットの番号("037", "Fa")}/metagame/`);
    expect.soft(await meta.見出し(), "メタゲーム一覧の見出し").toContain(`${N("037", "Fa")}メタゲーム`);
    const 名前 = await meta.アーキタイプ名();
    expect.soft(名前, "メタゲーム一覧に並ぶアーキタイプ（A1が並ぶ）").toContain(N("037", "A1"));
    expect.soft(名前, "メタゲーム一覧に並ぶアーキタイプ（A9は並ばない）").not.toContain(N("037", "A9"));
  });
});

caseTest("IT-F09-01-038", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const modal = new DeckSearchModal(page);
  let 要求 = "";
  await step(1, async () => { await top.開く(); });
  await step(2, async () => {
    await modal.開く();
    note(モーダルの注記);
    await modal.入れる("player", N("038", "Zzz"));
  });
  await step(3, async () => {
    // モーダルが画面の下の案内の区画を覆うので、閉じるボタンで閉じてから「その他」を押す
    await modal.閉じる();
    note("プレイヤー名を入れたモーダルは、開いたままでは「その他」を覆う。モーダルの閉じるボタンで閉じてから「その他」を押した");
    const nav = page.waitForRequest((r) => r.isNavigationRequest() && /\/deck\/others\//.test(r.url()), { timeout: 60_000 });
    await top.その他の入口.scrollIntoViewIfNeeded();
    await Promise.all([page.waitForURL(/\/deck\/others\//, { waitUntil: "load" }), top.その他の入口.click()]);
    要求 = decodeURIComponent((await nav).url());
  });
  await expected(async () => {
    const r = await 結果を読む(page);
    expect.soft(r.パス, "開いた画面のアドレス（その他デッキ一覧）").toBe("/ja/deck/others/");
    expect.soft(要求.includes(N("038", "Zzz")), "その他デッキ一覧への要求に、入力したプレイヤー名が条件として入る").toBe(false);
    expect.soft(r.名前, "その他デッキ一覧に並ぶプレイヤー名（P1が並ぶ）").toContain(N("038", "P1"));
  });
});

/** 直近の大会の区画で、大会の行を押す（039・082） */
function 直近の大会から(ケース: string, 並ばない: string[], 手順3あり: boolean): CaseBody {
  return async ({ page, step, expected }) => {
    const top = new DeckTopPage(page);
    let 手順3の名前: string[] = [];
    await step(1, async () => { await top.開く(); });
    await step(2, async () => {
      const link = top.直近の大会のリンク(N(ケース, "E1"));
      await expect(link, `直近の大会の区画の、大会F0901-${ケース}-E1の行`).toHaveCount(1);
      await link.scrollIntoViewIfNeeded();
      await Promise.all([page.waitForURL(/\/deck\/result\//, { waitUntil: "load" }), link.click()]);
    });
    if (手順3あり) await step(3, async () => { 手順3の名前 = (await 結果を読む(page)).名前; });
    await expected(async () => {
      const r = await 結果を読む(page);
      expect.soft(r.パス, "開いた画面のアドレス（デッキ検索結果）").toBe("/ja/deck/result/");
      expect.soft(r.名前, `デッキ検索結果に並ぶプレイヤー名（F0901-${ケース}-P1が並ぶ）`).toContain(N(ケース, "P1"));
      for (const p of 並ばない) expect.soft(r.名前, `デッキ検索結果に並ぶプレイヤー名（F0901-${ケース}-${p}は並ばない）`).not.toContain(N(ケース, p));
      if (手順3あり) expect.soft(手順3の名前, "手順3で確認したプレイヤー名（P1が並ぶ）").toContain(N(ケース, "P1"));
    });
  };
}
caseTest("IT-F09-01-039", 直近の大会から("039", ["P2", "P3"], false));
caseTest("IT-F09-01-082", 直近の大会から("082", ["P2"], true));

// ---------------------------------------------------------------------------
// 検索条件（デッキ詳細検索のモーダル）
// ---------------------------------------------------------------------------

caseTest("IT-F09-01-043", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const modal = new DeckSearchModal(page);
  await step(1, async () => { await top.開く(); await modal.開く(); note(モーダルの注記); });
  await step(2, async () => { await modal.フォーマットを選ぶ(N("043", "F1")); });
  await step(3, async () => {
    await modal.選択画面を開く();
    if (await modal.候補を選ぶ(N("043", "A1"), N("043", "F1"))) note("選択画面で、アーキタイプのフォーマットのタブを押してから選んだ");
    await modal.選択を押す();
  });
  await step(4, async () => { await modal.入れる("dateFrom", "2026/03/01"); await modal.入れる("dateTo", "2026/03/31"); });
  await step(5, async () => { await modal.入れる("capacityFrom", "10"); await modal.入れる("capacityTo", "64"); });
  await step(6, async () => { await modal.タグを選ぶ(N("043", "T1")); });
  await step(7, async () => { await modal.入れる("card", N("043", "Card")); });
  await step(8, async () => { await modal.入れる("player", N("043", "Player")); });
  await step(9, async () => { await modal.入れる("eventName", N("043", "Event")); });
  await step(10, async () => {
    const before = await modal.入力欄の状態();
    expect(before.アーキタイプ, "クリアの前に、アーキタイプが選ばれている").not.toBe("");
    await modal.クリアする();
  });
  await expected(async () => {
    const s = await modal.入力欄の状態();
    expect.soft(s.選ばれたフォーマット, "フォーマットの選ばれた数").toBe(0);
    expect.soft(s.アーキタイプ, "アーキタイプ（選んだ値）").toBe("");
    expect.soft(s.選ばれたアーキタイプの表示, "アーキタイプ（選んだものの表示）").toBe("");
    expect.soft(s.開催日開始, "開催日時（開始）").toBe("");
    expect.soft(s.開催日終了, "開催日時（終了）").toBe("");
    expect.soft(s.参加人数下限, "参加人数（下限）").toBe("");
    expect.soft(s.参加人数上限, "参加人数（上限）").toBe("");
    expect.soft(s.選ばれたタグ, "タグの選ばれた数").toBe(0);
    expect.soft(s.カード名, "カード名").toBe("");
    expect.soft(s.プレイヤー名, "プレイヤー名").toBe("");
    expect.soft(s.大会名, "大会名").toBe("");
  });
});

caseTest("IT-F09-01-044", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const modal = new DeckSearchModal(page);
  await step(1, async () => { await top.開く(); await modal.開く(); note(モーダルの注記); });
  await step(2, async () => { await modal.選択画面を開く(); });
  await step(3, async () => {
    if (await modal.候補を選ぶ(N("044", "A1"), N("044", "F1"))) note("選択画面で、アーキタイプのフォーマットのタブを押してから選んだ");
    await modal.選択を押す();
    await expect(modal.選んだアーキタイプ, "「選択」のあと、アーキタイプが選ばれている").toHaveValue(アーキタイプの番号("044", "A1", "F1"));
  });
  await step(4, async () => {
    await modal.選択画面を開く();
    await expect(modal.リセット, "「リセット」").toHaveText(/リセット/);
    try {
      await modal.リセット.click({ timeout: 15_000 });
    } catch (e) {
      note("「リセット」は選択画面の外（検索条件のアーキタイプの欄）にあり、選択画面を開いたままでは押せなかった");
      throw e;
    }
  });
  await expected(async () => {
    const s = await modal.入力欄の状態();
    expect.soft(s.アーキタイプ, "選択済みのアーキタイプ（選んだ値）").toBe("");
    expect.soft(s.選ばれたアーキタイプの表示, "選択済みのアーキタイプ（表示）").toBe("");
  });
});

caseTest("IT-F09-01-045", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const modal = new DeckSearchModal(page);
  await step(1, async () => { await top.開く(); });
  await step(2, async () => {
    await modal.開く();
    note(モーダルの注記);
    await modal.フォーマットを選ぶ(N("045", "F1"));
    await modal.フォーマットを選ぶ(N("045", "F2"));
  });
  await step(3, async () => { await modal.検索する(); });
  await expected(async () => {
    const r = await 結果を読む(page);
    expect.soft(r.パス, "開いた画面のアドレス（デッキ検索結果）").toBe("/ja/deck/result/");
    expect.soft(r.名前, "デッキ検索結果に並ぶプレイヤー名（P1が並ぶ）").toContain(N("045", "P1"));
    expect.soft(r.名前, "デッキ検索結果に並ぶプレイヤー名（P2が並ぶ）").toContain(N("045", "P2"));
    expect.soft(r.名前, "デッキ検索結果に並ぶプレイヤー名（P3は並ばない）").not.toContain(N("045", "P3"));
  });
});

caseTest("IT-F09-01-046", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const modal = new DeckSearchModal(page);
  await step(1, async () => { await top.開く(); });
  await step(2, async () => {
    await modal.開く();
    note(モーダルの注記);
    await modal.選択画面を開く();
    let tab = await modal.候補を選ぶ(N("046", "A1"), N("046", "F1"));
    tab = (await modal.候補を選ぶ(N("046", "A2"), N("046", "F1"))) || tab;
    if (tab) note("選択画面で、アーキタイプのフォーマットのタブを押してから選んだ");
    await modal.選択を押す();
  });
  await step(3, async () => { await modal.検索する(); });
  await expected(async () => {
    const r = await 結果を読む(page);
    expect.soft(r.パス, "開いた画面のアドレス（デッキ検索結果）").toBe("/ja/deck/result/");
    expect.soft(r.名前, "デッキ検索結果に並ぶプレイヤー名（P1が並ぶ）").toContain(N("046", "P1"));
    expect.soft(r.名前, "デッキ検索結果に並ぶプレイヤー名（P2が並ぶ）").toContain(N("046", "P2"));
    expect.soft(r.名前, "デッキ検索結果に並ぶプレイヤー名（P3は並ばない）").not.toContain(N("046", "P3"));
  });
});

caseTest("IT-F09-01-047", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const modal = new DeckSearchModal(page);
  let 候補: string[] = [];
  await step(1, async () => { await top.開く(); });
  await step(2, async () => { await modal.開く(); note(モーダルの注記); await modal.選択画面を開く(); });
  await step(3, async () => { await modal.選択画面のフォーマットを選ぶ(N("047", "F1")); });
  await step(4, async () => { 候補 = await modal.見えている候補(); });
  await expected(async () => {
    expect.soft(候補, "選択画面に並ぶアーキタイプの候補（A1が並ぶ）").toContain(N("047", "A1"));
    expect.soft(候補, "選択画面に並ぶアーキタイプの候補（A2は並ばない）").not.toContain(N("047", "A2"));
  });
});

caseTest("IT-F09-01-048", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const modal = new DeckSearchModal(page);
  let 候補: string[] = [];
  await step(1, async () => { await top.開く(); });
  await step(2, async () => { await modal.開く(); note(モーダルの注記); await modal.選択画面を開く(); });
  await step(3, async () => { await modal.色を選ぶ("赤"); });
  await step(4, async () => {
    // 選択画面は、フォーマットのタブごとに候補を見せる。両方のアーキタイプが属するフォーマット F1 のタブで候補を見る
    if (!(await modal.タブが選ばれている(N("048", "F1")))) {
      await modal.タブを押す(N("048", "F1"));
      note("選択画面はフォーマットのタブごとに候補を見せるので、アーキタイプのフォーマットF0901-048-F1のタブを押してから候補を見た");
    }
    候補 = await modal.見えている候補();
  });
  await expected(async () => {
    expect.soft(候補, "選択画面に並ぶアーキタイプの候補（赤のA1が並ぶ）").toContain(N("048", "A1"));
    expect.soft(候補, "選択画面に並ぶアーキタイプの候補（青のA2は並ばない）").not.toContain(N("048", "A2"));
  });
});

caseTest("IT-F09-01-053", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const modal = new DeckSearchModal(page);
  await step(1, async () => { await top.開く(); });
  await step(2, async () => {
    await modal.開く();
    note(モーダルの注記);
    await modal.タグを選ぶ(N("053", "T1"));
    await modal.タグを選ぶ(N("053", "T2"));
  });
  await step(3, async () => { await modal.検索する(); });
  await expected(async () => {
    const r = await 結果を読む(page);
    expect.soft(r.パス, "開いた画面のアドレス（デッキ検索結果）").toBe("/ja/deck/result/");
    expect.soft(r.名前, "デッキ検索結果に並ぶプレイヤー名（P1が並ぶ）").toContain(N("053", "P1"));
    expect.soft(r.名前, "デッキ検索結果に並ぶプレイヤー名（P2が並ぶ）").toContain(N("053", "P2"));
    expect.soft(r.名前, "デッキ検索結果に並ぶプレイヤー名（P3は並ばない）").not.toContain(N("053", "P3"));
  });
});

caseTest("IT-F09-01-075", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const modal = new DeckSearchModal(page);
  await step(1, async () => { await top.開く(); await modal.開く(); note(モーダルの注記); });
  await step(2, async () => { await modal.入れる("player", N("075", "Taro")); });
  await step(3, async () => { await modal.選ぶ("TOP8以上のみ"); });
  await step(4, async () => { await modal.検索する(); });
  await expected(async () => {
    const r = await 結果を読む(page);
    expect.soft(r.パス, "開いた画面のアドレス（デッキ検索結果）").toBe("/ja/deck/result/");
    expect.soft(r.名前, "デッキ検索結果に並ぶプレイヤー名（Taro-A だけ）").toEqual([N("075", "Taro-A")]);
    expect.soft(r.名前, "デッキ検索結果に並ぶプレイヤー名（Taro-B は並ばない）").not.toContain(N("075", "Taro-B"));
    expect.soft(r.名前, "デッキ検索結果に並ぶプレイヤー名（Hanako-C は並ばない）").not.toContain(N("075", "Hanako-C"));
  });
});

caseTest("IT-F09-01-077", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const modal = new DeckSearchModal(page);
  const res = new DeckResultView(page);
  let 入力欄 = 0;
  await step(1, async () => { await top.開く(); });
  await step(2, async () => { await modal.開く(); note(モーダルの注記); await modal.入れる("player", N("077", "Nobody")); });
  await step(3, async () => { await modal.検索する(); });
  await step(4, async () => {
    await res.読み込みを待つ();
    入力欄 = await modal.欄("player").count(); // デッキ検索結果の画面にも、同じ検索条件のフォームが載る
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "開いた画面のアドレス（デッキ検索結果）").toBe("/ja/deck/result/");
    expect.soft(入力欄, "デッキ検索結果の画面に載る、検索条件の入力欄（プレイヤー名）の数").toBe(1);
    await expect.soft(res.一覧の項目, "一覧の領域に並ぶデッキの数").toHaveCount(0);
    await expect.soft(res.該当なしの案内, "一覧の領域の該当なしの案内").toHaveText(/ご指定の条件に一致するデッキが見つかりませんでした。/);
  });
});

caseTest("IT-F09-01-079", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const modal = new DeckSearchModal(page);
  let 選択肢: string[] = [];
  await step(1, async () => { await top.開く(); });
  await step(2, async () => { await modal.開く(); note(モーダルの注記); 選択肢 = await modal.フォーマットの選択肢(); });
  await expected(async () => {
    expect.soft(選択肢, "フォーマットの選択肢（検索対象のF1が並ぶ）").toContain(N("079", "F1"));
    expect.soft(選択肢, "フォーマットの選択肢（検索対象が無効のF2は並ばない）").not.toContain(N("079", "F2"));
  });
});

caseTest("IT-F09-01-080", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const modal = new DeckSearchModal(page);
  let 控えたURL = "";
  await step(1, async () => { await top.開く(); note("開発者ツールのネットワークの表示の代わりに、ブラウザが送るデッキ検索結果への要求を控えた"); });
  await step(2, async () => { await modal.開く(); note(モーダルの注記); await modal.フォーマットを選ぶ(N("080", "F1")); });
  await step(3, async () => { const r = 結果への要求(page); await modal.検索する(); 控えたURL = (await r).url(); });
  await step(4, async () => {
    const f1 = フォーマットの番号("080", "F1"), f2 = フォーマットの番号("080", "F2");
    const u = new URL(控えたURL);
    const 書き換え = new URLSearchParams();
    let 書き換えた = 0;
    for (const [k, v] of u.searchParams.entries()) {
      if (k === `formats[${f1}]`) { 書き換え.append(`formats[${f2}]`, v === f1 ? f2 : v); 書き換えた += 1; } else 書き換え.append(k, v);
    }
    expect(書き換えた, "控えたURLに、フォーマットF0901-080-F1の識別子がある").toBe(1);
    u.search = 書き換え.toString();
    note(`控えたURLのフォーマットの識別子 ${f1} を ${f2} に書き換えて開いた: ${decodeURIComponent(u.toString())}`);
    await page.goto(u.toString(), { waitUntil: "load" });
  });
  await expected(async () => {
    const r = await 結果を読む(page);
    expect.soft(r.パス, "開いた画面のアドレス（デッキ検索結果）").toBe("/ja/deck/result/");
    expect.soft(r.名前, "デッキ検索結果に並ぶプレイヤー名（F2のP2が並ぶ）").toContain(N("080", "P2"));
    expect.soft(r.名前, "デッキ検索結果に並ぶプレイヤー名（F1のP1は並ばない）").not.toContain(N("080", "P1"));
  });
});

// ---------------------------------------------------------------------------
// 要求の中身（開発者ツールのネットワークの代わりに、ブラウザが送る要求を控える）
// ---------------------------------------------------------------------------

type 確かめ = { 項目: string; 実際: unknown; 期待: unknown };
const 条件 = (r: Request) => new URL(r.url()).searchParams;

/** 手順1 TOPを開く／2 入れる／3 「検索」／4 要求を確かめる、の形のケース（054〜058・076・078・081） */
function 要求の確かめ(入れる: (modal: DeckSearchModal) => Promise<void>, 見る: (r: Request, status: number) => 確かめ[]): CaseBody {
  return async ({ page, step, expected }) => {
    const top = new DeckTopPage(page);
    const modal = new DeckSearchModal(page);
    let req: Request | null = null;
    let status = 0;
    await step(1, async () => { await top.開く(); note("開発者ツールのネットワークの表示の代わりに、ブラウザが送るデッキ検索結果への要求と応答を控えた"); });
    await step(2, async () => { await modal.開く(); note(モーダルの注記); await 入れる(modal); });
    await step(3, async () => {
      const r = 結果への要求(page);
      const resp = page.waitForResponse((x) => x.request().isNavigationRequest() && /\/deck\/result\//.test(new URL(x.url()).pathname), { timeout: 60_000 });
      await modal.検索する();
      req = await r;
      status = (await resp).status();
    });
    await step(4, async () => {
      expect(req, "デッキ検索結果への要求を控えた").not.toBeNull();
      note(`デッキ検索結果への要求: ${req!.method()} ${decodeURIComponent(req!.url())}（応答 ${status}）`);
    });
    await expected(async () => {
      for (const c of 見る(req!, status)) expect.soft(c.実際, c.項目).toEqual(c.期待);
    });
  };
}

caseTest("IT-F09-01-054", 要求の確かめ((m) => m.入れる("player", N("054", "P")), (r) => [
  { 項目: "要求のURLの検索条件のプレイヤー名", 実際: 条件(r).getAll("player"), 期待: [N("054", "P")] },
]));

caseTest("IT-F09-01-055", 要求の確かめ(async (m) => { await m.フォーマットを選ぶ(N("055", "F1")); await m.フォーマットを選ぶ(N("055", "F2")); }, (r) => {
  const f1 = フォーマットの番号("055", "F1"), f2 = フォーマットの番号("055", "F2");
  const fmt = [...条件(r).entries()].filter(([k]) => k.startsWith("formats")).map(([k, v]) => `${k}=${v}`).sort();
  return [{ 項目: "要求のフォーマットの渡し方（識別子を鍵にした配列の要素。名前=値）", 実際: fmt, 期待: [`formats[${f1}]=${f1}`, `formats[${f2}]=${f2}`].sort() }];
}));

caseTest("IT-F09-01-056", 要求の確かめ(async (m) => {
  await m.選択画面を開く();
  let tab = await m.候補を選ぶ(N("056", "A1"), N("056", "F1"));
  tab = (await m.候補を選ぶ(N("056", "A2"), N("056", "F1"))) || tab;
  if (tab) note("選択画面で、アーキタイプのフォーマットのタブを押してから選んだ");
  await m.選択を押す();
}, (r) => {
  const vals = 条件(r).getAll("archetypeIds");
  const a1 = アーキタイプの番号("056", "A1", "F1"), a2 = アーキタイプの番号("056", "A2", "F1");
  return [
    { 項目: "アーキタイプの値の数（1つの値として送られる）", 実際: vals.length, 期待: 1 },
    { 項目: "アーキタイプの値の形（識別子をカンマで連ねたもの）", 実際: /^\d+,\d+$/.test(vals[0] ?? ""), 期待: true },
    { 項目: "アーキタイプの値に入っている識別子（A1・A2）", 実際: (vals[0] ?? "").split(",").sort(), 期待: [a1, a2].sort() },
  ];
}));

caseTest("IT-F09-01-057", 要求の確かめ(async (m) => { await m.タグを選ぶ(N("057", "T1")); await m.タグを選ぶ(N("057", "T2")); }, (r) => {
  const t1 = タグの番号("057", "T1"), t2 = タグの番号("057", "T2");
  return [{ 項目: "要求のタグ（識別子の配列）の値", 実際: 条件(r).getAll("tagId[]").sort(), 期待: [t1, t2].sort() }];
}));

caseTest("IT-F09-01-058", 要求の確かめ((m) => m.入れる("eventName", N("058", "Cup")), (r) => {
  const vals = 条件(r).getAll("eventName");
  return [
    { 項目: "要求で送られた大会名の数", 実際: vals.length, 期待: 2 },
    { 項目: "要求で送られた大会名に、入力欄の値が入っている", 実際: vals.includes(N("058", "Cup")), 期待: true },
  ];
}));

caseTest("IT-F09-01-076", 要求の確かめ((m) => m.入れる("player", N("076", "Nobody")), (_r, status) => [
  { 項目: "デッキ検索結果の画面の HTTP ステータス", 実際: status, 期待: 404 },
]));

caseTest("IT-F09-01-078", 要求の確かめ((m) => m.入れる("player", N("078", "P")), (r) => [
  { 項目: "要求の表示件数に入っている件数の値（数字を含む値）", 実際: 条件(r).getAll("pageSize").filter((x) => /\d/.test(x)), 期待: [] },
]));

caseTest("IT-F09-01-081", 要求の確かめ((m) => m.入れる("player", N("081", "P")), (r) => [
  { 項目: "デッキ検索結果への要求のメソッド", 実際: r.method(), 期待: "GET" },
]));

// ---------------------------------------------------------------------------
// 入力補助
// ---------------------------------------------------------------------------

caseTest("IT-F09-01-083", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const modal = new DeckSearchModal(page);
  let 補助: string[] = [];
  await step(1, async () => { await top.開く(); });
  await step(2, async () => { await modal.開く(); note(モーダルの注記); await modal.選択画面を開く(); });
  await step(3, async () => { await modal.アーキタイプ名を打つ(N("083", "A1")); });
  await step(4, async () => {
    await page.waitForTimeout(500);
    補助 = await modal.アーキタイプ名の入力補助();
    note("アーキタイプ名の入力補助は、入力欄に結び付いた候補の一覧（ブラウザが入力欄の下に出す）。その一覧の中身を読んだ");
  });
  await expected(async () => {
    expect.soft(補助, "アーキタイプ名の入力補助の候補").toContain(N("083", "A1"));
  });
});

caseTest("IT-F09-01-084", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const modal = new DeckSearchModal(page);
  await step(1, async () => { await top.開く(); });
  await step(2, async () => {
    await modal.開く();
    note(モーダルの注記);
    await expect(modal.欄("card"), "カード名の入力欄").toHaveAttribute("placeholder", "カード名を入力してください");
    await modal.カード名を打つ(N("084", "カードA"));
  });
  await step(3, async () => { await page.waitForTimeout(1_500); });
  await expected(async () => {
    await expect.soft(modal.カード名の入力補助, "カード名の入力補助").toContainText(N("084", "カードA"), { timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// DBで日時を設定したデッキ・検索条件の既定値・日時と人数の境目・成績と公開/非公開（2026-11-11 追加）
// ---------------------------------------------------------------------------

caseTest("IT-F09-01-020", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const 名前 = ["P1", "P2", "P3"].map((p) => N("020", p));
  let 状態 = { 件数: [] as number[], 更新日時: [] as string[] };
  await step(1, async () => { await top.開く(); });
  await step(2, async () => {
    状態 = プレイヤー名のデッキの更新日時(名前);
    note("DBの確認は参照だけ。更新日時は日本時間の「yyyy/mm/dd hh:mm:ss」で読んだ。シードでDBに設定した更新日時（2026/01/01 10:00:00）と比べる");
  });
  await expected(async () => {
    expect.soft(状態.件数, "プレイヤー名P1・P2・P3のデッキの件数（それぞれ1件）").toEqual([1, 1, 1]);
    expect.soft(状態.更新日時, "3件のデッキの更新日時").toEqual(["2026/01/01 10:00:00", "2026/01/01 10:00:00", "2026/01/01 10:00:00"]);
  });
});

/** 検索結果の全ページ（100件ずつ）に並ぶプレイヤー名を読む。共有のデータ（ほかのデッキ）を消さないので、全ページを読んで印つきの名前の有無で確かめる */
async function 全ページを読む(page: Page, capture: (l: string) => Promise<void>): Promise<string[]> {
  await capture("デッキ検索結果（1ページ目）");
  const r = await new DeckResultView(page).全ページのプレイヤー名();
  note(`検索結果は ${r.件数} 件（100件ずつ ${r.ページ数} ページ）。共有のデータを消さないので、全ページを読んで、実行の印つきのプレイヤー名のデッキの有無で確かめた`);
  return r.名前;
}

/** 手順1 TOPを開く／2 検索条件を入れる／3 「検索」を押す、の形で、結果に並ぶ・並ばないデッキを確かめる */
function 条件の検索(入れる: ((m: DeckSearchModal) => Promise<void>) | null, 並ぶ: [string, string[]], 並ばない: [string, string[]]): CaseBody {
  return async ({ page, step, expected, capture }) => {
    const top = new DeckTopPage(page);
    const modal = new DeckSearchModal(page);
    await step(1, async () => { await top.開く(); });
    if (入れる) await step(2, async () => { await modal.開く(); note(モーダルの注記); await 入れる(modal); });
    await step(入れる ? 3 : 2, async () => {
      if (!入れる) { await modal.開く(); note(モーダルの注記); }
      await modal.検索する();
    });
    await expected(async () => {
      expect.soft(new URL(page.url()).pathname, "開いた画面のアドレス（デッキ検索結果）").toBe("/ja/deck/result/");
      const 名前 = await 全ページを読む(page, capture);
      for (const p of 並ぶ[1]) expect.soft(名前, `デッキ検索結果にプレイヤー名「${N(並ぶ[0], p)}」のデッキが並ぶ`).toContain(N(並ぶ[0], p));
      for (const p of 並ばない[1]) expect.soft(名前, `デッキ検索結果にプレイヤー名「${N(並ばない[0], p)}」のデッキが並ばない`).not.toContain(N(並ばない[0], p));
    });
  };
}

caseTest("IT-F09-01-041", 条件の検索(null, ["041", ["P1"]], ["041", ["P2"]]));
caseTest("IT-F09-01-042", 条件の検索(null, ["042", ["P1", "P2"]], ["042", []]));

caseTest("IT-F09-01-049", 条件の検索(async (m) => { await m.入れる("dateFrom", "2026/03/10"); await m.入れる("dateTo", "2026/03/31"); }, ["049", ["P1"]], ["049", ["P2"]]));
caseTest("IT-F09-01-050", 条件の検索(async (m) => { await m.入れる("dateFrom", "2026/03/01"); await m.入れる("dateTo", "2026/03/10"); }, ["050", ["P1"]], ["050", ["P2"]]));
caseTest("IT-F09-01-051", 条件の検索((m) => m.入れる("capacityFrom", "32"), ["051", ["P1"]], ["051", ["P2"]]));
caseTest("IT-F09-01-052", 条件の検索((m) => m.入れる("capacityTo", "32"), ["052", ["P1"]], ["052", ["P2"]]));
caseTest("IT-F09-01-070", 条件の検索((m) => m.選ぶ("優勝デッキのみ"), ["070", ["P1"]], ["070", ["P2", "P3"]]));
caseTest("IT-F09-01-071", 条件の検索((m) => m.選ぶ("TOP8以上のみ"), ["071", ["P1", "P2"]], ["071", ["P3"]]));
caseTest("IT-F09-01-072", 条件の検索((m) => m.選ぶ("掲載デッキすべて"), ["072", ["P1", "P2"]], ["072", []]));
caseTest("IT-F09-01-073", 条件の検索((m) => m.選ぶ("公開リストのみ"), ["073", ["P1"]], ["073", ["P2"]]));
caseTest("IT-F09-01-074", 条件の検索((m) => m.選ぶ("非公開リストを含む"), ["074", ["P1", "P2"]], ["074", []]));
