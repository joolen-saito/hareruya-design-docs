/**
 * F01-01 本店ECTOP（固定タグの欄: 最新入荷アイテム・Trending Now・SALE開催中・値下げしました！・補充しました！）。正本: cases/F01-01_test_cases.tsv
 * 前提は seeds/f01-01-tag.ts（S-F01-01-TAG-PRODUCTS）が作る。共有の固定タグの対象・優先表示商品を書き換え、ケースの終わりに必ず元に戻す（lib/shared_restore.ts）。
 * 共有の設定を書き換えるので、これらのケースは1本だけで流す（config/solo_cases.tsv）。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { F0101TopPage } from "../../pages/front/f01_01_top";
import { 固定タグ } from "../../pages/admin/f01_01_shared";
import "../../seeds/f01-01";
import { 作った商品ID, 群のコード, 固定タグのID, 除外の記号 } from "../../seeds/f01-01-tag";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 待つ = (ms: number) => new Promise((r) => setTimeout(r, ms));
const 名 = (コード: string) => rc(コード);
const 見出し = {
  最新入荷: "最新入荷アイテム", Trending: "Trending Now", セール: "SALE開催中", 値下げ: "値下げしました！", 補充: "補充しました！",
} as const;
const 先頭30 = (群名: string) => Array.from({ length: 30 }, (_, i) => 名(群のコード(群名, i + 1)));

// ---- 欄の商品（タグ・公開・在庫・言語の条件を満たす商品が、優先表示商品の並びで最大30件） ----
type 欄の指定 = { 見出し: string; 群: string };
function 欄の並び(言語: "ja" | "en", 欄: 欄の指定[]) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const top = new F0101TopPage(page);
    const 読んだ: string[][] = [];
    await step(1, async () => { await top.本店TOPを開く(言語); });
    await step(2, async () => {
      for (const x of 欄) {
        const l = top.欄(x.見出し);
        await l.scrollIntoViewIfNeeded();
        読んだ.push(await top.欄の商品名の並び(l));
      }
    });
    await expected(async () => {
      for (const [i, x] of 欄.entries()) {
        const names = 読んだ[i];
        expect.soft(names, `${x.見出し}欄に表示されている商品（並びの順）`).toEqual(先頭30(x.群));
        expect.soft(names.includes(名(群のコード(x.群, 31))), `${x.見出し}欄に31件目の ${群のコード(x.群, 31)} が表示されない`).toBe(false);
        for (const k of 除外の記号) expect.soft(names.includes(名(`${x.群}-${k}`)), `${x.見出し}欄に除外商品 ${x.群}-${k}（非公開・在庫0・言語不一致）が表示されない`).toBe(false);
      }
    });
  };
}
caseTest("IT-F01-01-014", 欄の並び("ja", [{ 見出し: 見出し.最新入荷, 群: "NEW-JA" }]));
caseTest("IT-F01-01-015", 欄の並び("en", [{ 見出し: 見出し.Trending, 群: "NEW-EN" }]));
caseTest("IT-F01-01-034", 欄の並び("ja", [{ 見出し: 見出し.セール, 群: "SALE" }]));
caseTest("IT-F01-01-050", 欄の並び("ja", [{ 見出し: 見出し.値下げ, 群: "DOWN" }, { 見出し: 見出し.補充, 群: "RESTOCK" }]));

// ---- 「もっと見る」（タグで絞り込まれた商品一覧へ） ----
/** タグで絞り込んだ商品一覧の、言語つきのアドレスの道（/ja/products/search/tags/<タグID>） */
const タグの一覧 = (言語: "ja" | "en", タグ名: string) => `/${言語}/products/search/tags/${固定タグのID[タグ名]}`;

async function もっと見るを押す(top: F0101TopPage, 欄名: string, どちら: "上部" | "下部"): Promise<string> {
  const l = top.欄(欄名);
  await l.scrollIntoViewIfNeeded();
  const link = (どちら === "上部" ? top.欄の上部のもっと見る(l) : top.欄の下部のもっと見る(l)).first();
  await Promise.all([top.page.waitForURL(/\/products\/search\/tags\//, { timeout: 120_000}), link.click({ timeout: 30_000, noWaitAfter: true })]);
  await top.page.waitForLoadState("load");
  return new URL(top.page.url()).pathname;
}

function もっと見る(言語: "ja" | "en", 欄名: string, タグ名: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const top = new F0101TopPage(page);
    const 行き先: string[] = [];
    await step(1, async () => { await top.本店TOPを開く(言語); });
    await step(2, async () => { 行き先.push(await もっと見るを押す(top, 欄名, "上部")); });
    await step(3, async () => { await top.本店TOPを開く(言語); });
    await step(4, async () => { 行き先.push(await もっと見るを押す(top, 欄名, "下部")); });
    note("欄の上部の「もっと見る」は見出しの横のリンク、下部の「もっと見る」は商品の並びの最後にある画像のリンク（Block の作り）として押した。「本店TOPへ戻る」は本店TOPを開き直して行った");
    await expected(async () => {
      expect.soft(行き先[0] ?? "", `上部の「もっと見る」から移った画面（「${タグ名}」タグで絞り込んだ商品一覧）`).toBe(タグの一覧(言語, タグ名));
      expect.soft(行き先[1] ?? "", `下部の「もっと見る」から移った画面（「${タグ名}」タグで絞り込んだ商品一覧）`).toBe(タグの一覧(言語, タグ名));
    });
  };
}
caseTest("IT-F01-01-017", もっと見る("ja", 見出し.最新入荷, 固定タグ.最新入荷));
caseTest("IT-F01-01-018", もっと見る("en", 見出し.Trending, 固定タグ.TrendingNow));
caseTest("IT-F01-01-036", もっと見る("ja", 見出し.セール, 固定タグ.セール));

caseTest("IT-F01-01-052", async ({ page, step, expected }) => {
  const top = new F0101TopPage(page);
  const 行き先: string[] = [];
  await step(1, async () => { await top.本店TOPを開く("ja"); 行き先.push(await もっと見るを押す(top, 見出し.値下げ, "上部")); });
  await step(2, async () => { await top.本店TOPを開く("ja"); });
  await step(3, async () => { 行き先.push(await もっと見るを押す(top, 見出し.補充, "上部")); });
  note("欄の「もっと見る」は見出しの横のリンクを押した。「本店TOPへ戻る」は本店TOPを開き直して行った");
  await expected(async () => {
    expect.soft(行き先[0] ?? "", "値下げしました！欄の「もっと見る」から移った画面（「値下げ」タグで絞り込んだ商品一覧）").toBe(タグの一覧("ja", 固定タグ.値下げ));
    expect.soft(行き先[1] ?? "", "補充しました！欄の「もっと見る」から移った画面（「補充しました」タグで絞り込んだ商品一覧）").toBe(タグの一覧("ja", 固定タグ.補充));
  });
});

// ---- 英語版・日本語版で、別の言語の「もっと見る」が出ない ----
function 別の言語のもっと見る(言語: "ja" | "en", 欄名: string, 出ない語: RegExp, 出ない表示: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const top = new F0101TopPage(page);
    let 欄の数 = -1; let 上: string[] = []; let 下: string[] = [];
    await step(1, async () => { await top.本店TOPを開く(言語); });
    await step(2, async () => {
      const l = top.欄(欄名);
      欄の数 = await l.count();
      if (欄の数 > 0) await l.scrollIntoViewIfNeeded();
      上 = await top.リンクの表示名(top.欄の上部のもっと見る(l));
      下 = await top.リンクの表示名(top.欄の下部のもっと見る(l));
    });
    note(`${欄名}欄の上部のリンクの表示名: ${上.join(" / ") || "なし"}、下部のリンクの表示名（画像の代わりの文字）: ${下.join(" / ") || "なし"}`);
    await expected(async () => {
      expect.soft(欄の数, `${欄名}欄が表示されている（確かめる対象があること）`).toBeGreaterThan(0);
      expect.soft(上.filter((t) => 出ない語.test(t)), `${欄名}欄の上部に「${出ない表示}」リンクが表示されない`).toEqual([]);
      expect.soft(下.filter((t) => 出ない語.test(t)), `${欄名}欄の下部に「${出ない表示}」リンクが表示されない`).toEqual([]);
    });
  };
}
caseTest("IT-F01-01-081", 別の言語のもっと見る("en", 見出し.Trending, /もっと見る/, "もっと見る"));
caseTest("IT-F01-01-082", 別の言語のもっと見る("ja", 見出し.最新入荷, /\bmore\b/i, "more"));

// ---- カード言語・商品名から商品詳細へ ----
async function 押して詳細へ(top: F0101TopPage, 欄名: string, コード: string, どこ: "カード言語" | "商品名"): Promise<string> {
  const l = top.欄(欄名);
  await l.scrollIntoViewIfNeeded();
  const card = top.本物の商品のカード(l, 名(コード));
  const target = どこ === "カード言語" ? top.カードのカード言語(card).first() : top.カードの商品名(card);
  await Promise.all([top.page.waitForURL(/\/products\/detail\//, { timeout: 120_000}), target.click({ timeout: 30_000, noWaitAfter: true })]);
  await top.page.waitForLoadState("load");
  return new URL(top.page.url()).pathname;
}
const 詳細 = (言語: "ja" | "en", コード: string) => new RegExp(`^/${言語}/products/detail/${作った商品ID.get(コード)}$`);

caseTest("IT-F01-01-019", async ({ page, step, expected }) => {
  const top = new F0101TopPage(page);
  const 先: string[] = [];
  await top.本店TOPを開く("ja");
  note("事前準備②「日本語版本店TOPを開き」は、手順の前に日本語版本店TOPを開いて行った。「本店TOPへ戻り」は本店TOPを開き直して行った");
  await step(1, async () => { 先.push(await 押して詳細へ(top, 見出し.最新入荷, "NEW-JA-01", "カード言語")); });
  await step(2, async () => { await top.本店TOPを開く("ja"); 先.push(await 押して詳細へ(top, 見出し.最新入荷, "NEW-JA-01", "商品名")); });
  await step(3, async () => { await top.本店TOPを開く("en"); 先.push(await 押して詳細へ(top, 見出し.Trending, "NEW-EN-01", "カード言語")); });
  await step(4, async () => { await top.本店TOPを開く("en"); 先.push(await 押して詳細へ(top, 見出し.Trending, "NEW-EN-01", "商品名")); });
  await expected(async () => {
    expect.soft(先[0] ?? "", "NEW-JA-01 のカード言語を押したあとの画面（NEW-JA-01 の商品詳細）").toMatch(詳細("ja", "NEW-JA-01"));
    expect.soft(先[1] ?? "", "NEW-JA-01 の商品名を押したあとの画面（NEW-JA-01 の商品詳細）").toMatch(詳細("ja", "NEW-JA-01"));
    expect.soft(先[2] ?? "", "NEW-EN-01 のカード言語を押したあとの画面（NEW-EN-01 の商品詳細）").toMatch(詳細("en", "NEW-EN-01"));
    expect.soft(先[3] ?? "", "NEW-EN-01 の商品名を押したあとの画面（NEW-EN-01 の商品詳細）").toMatch(詳細("en", "NEW-EN-01"));
  });
});

caseTest("IT-F01-01-037", async ({ page, step, expected }) => {
  const top = new F0101TopPage(page);
  const 先: string[] = [];
  await top.本店TOPを開く("ja");
  note("事前準備②「日本語版本店TOPを開く」は、手順の前に日本語版本店TOPを開いて行った。「本店TOPへ戻り」は本店TOPを開き直して行った");
  await step(1, async () => { 先.push(await 押して詳細へ(top, 見出し.セール, "SALE-01", "カード言語")); });
  await step(2, async () => { await top.本店TOPを開く("ja"); 先.push(await 押して詳細へ(top, 見出し.セール, "SALE-01", "商品名")); });
  await expected(async () => {
    expect.soft(先[0] ?? "", "SALE-01 のカード言語を押したあとの画面（SALE-01 の商品詳細）").toMatch(詳細("ja", "SALE-01"));
    expect.soft(先[1] ?? "", "SALE-01 の商品名を押したあとの画面（SALE-01 の商品詳細）").toMatch(詳細("ja", "SALE-01"));
  });
});

caseTest("IT-F01-01-053", async ({ page, step, expected }) => {
  const top = new F0101TopPage(page);
  const 先: string[] = [];
  await top.本店TOPを開く("ja");
  note("事前準備②「日本語版本店TOPを開く」は、手順の前に日本語版本店TOPを開いて行った。カード言語を押したあと、商品名を押す前に本店TOPを開き直した");
  await step(1, async () => {
    先.push(await 押して詳細へ(top, 見出し.値下げ, "DOWN-01", "カード言語"));
    await top.本店TOPを開く("ja");
    先.push(await 押して詳細へ(top, 見出し.値下げ, "DOWN-01", "商品名"));
  });
  await step(2, async () => {
    await top.本店TOPを開く("ja");
    先.push(await 押して詳細へ(top, 見出し.補充, "RESTOCK-01", "カード言語"));
    await top.本店TOPを開く("ja");
    先.push(await 押して詳細へ(top, 見出し.補充, "RESTOCK-01", "商品名"));
  });
  await expected(async () => {
    expect.soft(先[0] ?? "", "DOWN-01 のカード言語を押したあとの画面（DOWN-01 の商品詳細）").toMatch(詳細("ja", "DOWN-01"));
    expect.soft(先[1] ?? "", "DOWN-01 の商品名を押したあとの画面（DOWN-01 の商品詳細）").toMatch(詳細("ja", "DOWN-01"));
    expect.soft(先[2] ?? "", "RESTOCK-01 のカード言語を押したあとの画面（RESTOCK-01 の商品詳細）").toMatch(詳細("ja", "RESTOCK-01"));
    expect.soft(先[3] ?? "", "RESTOCK-01 の商品名を押したあとの画面（RESTOCK-01 の商品詳細）").toMatch(詳細("ja", "RESTOCK-01"));
  });
});

// ---- 商品数のマイナス・プラス（在庫3の NEW-JA-01） ----
caseTest("IT-F01-01-021", async ({ page, step, expected }) => {
  const top = new F0101TopPage(page);
  const card = () => top.本物の商品のカード(top.欄(見出し.最新入荷), 名("NEW-JA-01"));
  let 初め = ""; let 後 = "";
  await step(1, async () => { await top.本店TOPを開く("ja"); await top.欄(見出し.最新入荷).scrollIntoViewIfNeeded(); });
  await step(2, async () => { 初め = await top.カードの数量欄(card()).inputValue(); expect(初め, "商品 NEW-JA-01 の商品数の表示").toBe("1"); });
  await step(3, async () => {
    const minus = top.カードの数量ボタン(card(), "マイナス");
    if (await minus.isDisabled()) note("マイナスボタンは押せない状態（無効）だった。押す操作は行えなかった");
    else await minus.click();
    await 待つ(500);
    後 = await top.カードの数量欄(card()).inputValue();
  });
  await expected(async () => {
    expect.soft(後, "マイナスボタンを押したあとの商品 NEW-JA-01 の商品数（在庫数の3）").toBe("3");
  });
});

caseTest("IT-F01-01-023", async ({ page, step, expected }) => {
  const top = new F0101TopPage(page);
  const card = () => top.本物の商品のカード(top.欄(見出し.最新入荷), 名("NEW-JA-01"));
  let 後 = "";
  await step(1, async () => { await top.本店TOPを開く("ja"); await top.欄(見出し.最新入荷).scrollIntoViewIfNeeded(); });
  await step(2, async () => {
    const q = top.カードの数量欄(card());
    for (let i = 0; i < 5 && (await q.inputValue()) !== "3"; i++) await top.カードの数量ボタン(card(), "プラス").click();
    expect(await q.inputValue(), "商品 NEW-JA-01 の商品数の表示").toBe("3");
  });
  await step(3, async () => {
    await top.カードの数量ボタン(card(), "プラス").click();
    await 待つ(500);
    後 = await top.カードの数量欄(card()).inputValue();
  });
  await expected(async () => {
    expect.soft(後, "プラスボタンを押したあとの商品 NEW-JA-01 の商品数").toBe("1");
  });
});

caseTest("IT-F01-01-027", async ({ page, step, expected }) => {
  const top = new F0101TopPage(page);
  let ボタン = -1; let カード = -1;
  await step(1, async () => { await top.本店TOPを開く("ja"); });
  await step(2, async () => {
    const l = top.欄(見出し.最新入荷);
    await l.scrollIntoViewIfNeeded();
    const card = top.本物の商品のカード(l, 名("NEW-JA-01"));
    カード = await card.count();
    ボタン = await card.locator(".btn-favorite").count();
  });
  await expected(async () => {
    expect.soft(カード, "最新入荷アイテム欄の商品 NEW-JA-01 のカードの数（確かめる対象があること）").toBe(1);
    expect.soft(ボタン, "未ログインのときの、商品 NEW-JA-01 のお気に入りへ追加/解除ボタンの数").toBe(0);
  });
});

