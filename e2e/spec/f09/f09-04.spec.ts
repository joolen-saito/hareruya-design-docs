/**
 * F09-04 採用枚数ランキング（フロント）。正本: cases/F09-04_test_cases.tsv
 *
 * 採用枚数の集計は、画面が受け取ったフォーマットのデッキだけを数える（設計書 L0009）。各ケースのシードは実行のたびに新しいフォーマットを
 * 作るので、ほかのデッキの有無は期待結果に関わらず、集計結果のキャッシュ（フォーマットの番号ごと）も空から始まる。
 * ランキングの各件のカード名は文字では出ず、カード画像の代替の文に出る（日本語表示は日本語名）。カード名はこの代替の文で読む。
 * 枚数は枚数の欄の文（「4枚」）で比べる。
 *
 * カード画像の選び方（026〜031・047・048・055〜060）のシードは、カード詳細の決め打ちの番号の代わりに、未使用の番号を同じ大小の順で
 * 振る（PM の決定 2026-11-10。判定は条件付き）。画像は件の画像の参照先の最後のファイル名で比べる。
 *
 * 書いていないケースと理由:
 * 040〜044（DBでデッキ・カード詳細・フォーマットの設定を書き換える手順と、3601秒・601秒待つ手順）、045（フォーマット名(英)をDBへ直接設定する準備）。
 */
import { Page, test } from "@playwright/test";
import { caseTest, CaseBody, expect } from "../../lib/case";
import { 日付, 表示日付 } from "../../pages/admin/f09_01_setup";
import { DeckSearchModal } from "../../pages/front/f09_01_deck_top";
import { MetagamePage, 選ばれている選択肢 } from "../../pages/front/f09_03_metagame";
import { UsageRankingPage, メタゲーム一覧を開く, トップを開く, 言語を切り替える, 表示言語, 区分, 言語, ランキングの件 } from "../../pages/front/f09_04_usage_ranking";
import { フォーマットのデッキとカードの全項目 } from "../../db/f09_04";
import { N } from "../../seeds/f09-04";
import "../../seeds/f09-04";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
/** 確かめのメッセージに出す正本の名前（印を付ける前） */
const 前印 = (ケース: string, 名: string) => `F0904-${ケース}-${名}`;

/** 手順1: フォーマットの番号でメタゲーム一覧を開き、「採用枚数ランキング」を押して採用枚数ランキングを開く */
async function 開く(page: Page, 番号: string, lang: 言語 = "ja"): Promise<UsageRankingPage> {
  const status = await メタゲーム一覧を開く(page, 番号, lang);
  if (status !== 200) throw new Error(`メタゲーム一覧を開けない（応答 ${status}）`);
  const r = new UsageRankingPage(page, lang);
  await r.入口を押す();
  return r;
}

type 比べ = [実際: unknown, 文: string, 期待: unknown];

/** 区画の件が、期待の並び（名前・枚数）とちょうど同じであることの比べ（実際・確かめの文・期待の組） */
function 並びの比べ(k: 区分, ケース: string, 期待: [string, number][], 件: ランキングの件[]): 比べ[] {
  const out: 比べ[] = [[件.length, `${k}のランキングの件数（${期待.length === 0 ? "1件も並ばない" : `${期待.length}件`}）`, 期待.length]];
  for (const [i, [名, 枚]] of 期待.entries()) {
    const x = 件[i];
    out.push([x?.名前, `${k}のランキングの${i + 1}位のカード（${前印(ケース, 名)}）`, N(ケース, 名)]);
    out.push([x?.枚数の文, `${k}のランキングの${i + 1}位の枚数（${枚}枚）`, `${枚}枚`]);
    out.push([x?.順位, `${k}のランキングの${i + 1}件目の順位の表示`, String(i + 1)]);
  }
  return out;
}
/** 区画にカードが載っていないことの比べ */
function 載らない比べ(k: 区分, ケース: string, 名: string[], 件: ランキングの件[]): 比べ[] {
  return 名.map((n) => [件.filter((x) => x.名前 === N(ケース, n)).length, `${k}のランキングに ${前印(ケース, n)} が載っていない`, 0] as 比べ);
}

/** 手順1で開き、手順2以降で切替の見出しを順に押して、最後に押した区画の並びを確かめる形 */
function 並び(ケース: string, 控え: string, 切替: 区分[], 期待: Partial<Record<区分, [string, number][]>>, 除く: Partial<Record<区分, string[]>> = {}): CaseBody {
  return async ({ page, notes, step, expected }) => {
    let r!: UsageRankingPage;
    await step(1, async () => { r = await 開く(page, notes.get(控え)); });
    for (const [i, k] of 切替.entries()) await step(i + 2, async () => { await r.切替を押す(k); });
    await expected(async () => {
      if (切替.length > 1) note("スペル・土地のランキングは、どちらの区画も画面に置かれ、選んでいない方が隠れる作り。先に表示した区画の件は、隠れた区画の件として読んだ（切替を押し直さない）");
      for (const k of ["スペル", "土地"] as 区分[]) {
        if (期待[k] === undefined && 除く[k] === undefined) continue;
        const 件 = await r.件を読む(k);
        const 比べ = [...(期待[k] !== undefined ? 並びの比べ(k, ケース, 期待[k]!, 件) : []), ...(除く[k] !== undefined ? 載らない比べ(k, ケース, 除く[k]!, 件) : [])];
        for (const [実際, 文, 値] of 比べ) expect.soft(実際, 文).toEqual(値);
      }
    });
  };
}

// ---------------------------------------------------------------------------
// 採用枚数の集計（001〜008）
// ---------------------------------------------------------------------------

caseTest("IT-F09-04-001", 並び("001", "〔フォーマットID-F0904-001〕", ["スペル"], { スペル: [["カードA", 7], ["カードB", 2]] }));
caseTest("IT-F09-04-002", 並び("002", "〔フォーマットID-F0904-002〕", ["スペル"], { スペル: [["カードA", 2]] }, { スペル: ["カードB"] }));
caseTest("IT-F09-04-003", 並び("003", "〔フォーマットID-F0904-003〕", ["スペル"], { スペル: [["カードA", 2]] }, { スペル: ["カードB"] }));
caseTest("IT-F09-04-004", 並び("004", "〔フォーマットID-F0904-004〕", ["スペル"], { スペル: [["カードA", 6], ["カードB", 3]] }));
caseTest("IT-F09-04-005", 並び("005", "〔フォーマットID-F0904-005A〕", ["スペル"], { スペル: [["カードA", 2]] }, { スペル: ["カードB"] }));
caseTest("IT-F09-04-006", 並び("006", "〔フォーマットID-F0904-006〕", ["スペル"], { スペル: [["カードA", 3]] }, { スペル: ["カードB"] }));
caseTest("IT-F09-04-007", 並び("007", "〔フォーマットID-F0904-007〕", ["スペル"], { スペル: [["カードA", 3]] }, { スペル: ["カードB"] }));
caseTest("IT-F09-04-008", 並び("008", "〔フォーマットID-F0904-008〕", ["スペル", "土地"], { スペル: [], 土地: [] }));

// ---------------------------------------------------------------------------
// 表示件数・並び順（009〜012）
// ---------------------------------------------------------------------------

const 番号の名 = (頭: string, i: number) => `${頭}${String(i).padStart(2, "0")}`;

caseTest("IT-F09-04-009", async ({ page, notes, step, expected }) => {
  let r!: UsageRankingPage;
  let スペル: ランキングの件[] = [];
  let 土地: ランキングの件[] = [];
  await step(1, async () => { r = await 開く(page, notes.get("〔フォーマットID-F0904-009〕")); });
  await step(2, async () => { await r.切替を押す("スペル"); });
  await step(3, async () => { スペル = await r.件を読む("スペル"); });
  await step(4, async () => { await r.切替を押す("土地"); });
  await step(5, async () => { 土地 = await r.件を読む("土地"); });
  await expected(async () => {
    for (const [k, rows, 頭] of [["スペル", スペル, "カードS"], ["土地", 土地, "カードL"]] as const) {
      expect.soft(rows.length, `${k}のランキングの件数（18件）`).toBe(18);
      expect.soft(rows[17]?.名前, `${k}のランキングの18位（${前印("009", 番号の名(頭, 18))}）`).toBe(N("009", 番号の名(頭, 18)));
      expect.soft(rows[17]?.枚数の文, `${k}のランキングの18位の枚数（3枚）`).toBe("3枚");
      for (const [実際, 文, 値] of 載らない比べ(k, "009", [番号の名(頭, 19), 番号の名(頭, 20)], rows)) expect.soft(実際, 文).toEqual(値);
    }
  });
});

caseTest("IT-F09-04-010", async ({ page, notes, step, expected }) => {
  let r!: UsageRankingPage;
  let rows: ランキングの件[] = [];
  await step(1, async () => { r = await 開く(page, notes.get("〔フォーマットID-F0904-010〕")); });
  await step(2, async () => { await r.切替を押す("スペル"); });
  await step(3, async () => { rows = await r.件を読む("スペル"); });
  await expected(async () => {
    expect.soft(rows.length, "スペルのランキングの件数（18件）").toBe(18);
    expect.soft(rows[17]?.名前, "スペルのランキングの18位（F0904-010-カードF0904-010-T18）").toBe(N("010", "カードF0904-010-T18"));
    expect.soft(rows[17]?.枚数の文, "スペルのランキングの18位の枚数（5枚）").toBe("5枚");
    for (const [実際, 文, 値] of 載らない比べ("スペル", "010", ["カードF0904-010-T19"], rows)) expect.soft(実際, 文).toEqual(値);
  });
});

caseTest("IT-F09-04-011", 並び("011", "〔フォーマットID-F0904-011〕", ["スペル"], { スペル: [["カードB", 4], ["カードC", 4], ["カードA", 4]] }));
caseTest("IT-F09-04-012", 並び("012", "〔フォーマットID-F0904-012〕", ["スペル"], { スペル: [["カードY", 4], ["カードZ", 4], ["カードX", 4]] }));

// ---------------------------------------------------------------------------
// スペルと土地の振り分け・基本土地・複数の種別（013〜020）
// ---------------------------------------------------------------------------

caseTest("IT-F09-04-013", 並び("013", "〔フォーマットID-F0904-013〕", ["スペル", "土地"],
  { スペル: [["カードS", 3]], 土地: [["カードL", 4], ["カードAL", 2]] }, { スペル: ["カードL", "カードAL"], 土地: ["カードS"] }));
caseTest("IT-F09-04-014", 並び("014", "〔フォーマットID-F0904-014〕", ["土地"], { 土地: [["カードOL", 3]] }, { 土地: ["カードBL"] }));
caseTest("IT-F09-04-015", 並び("015", "〔フォーマットID-F0904-015〕", ["土地"], { 土地: [["カードNL", 5]] }));
caseTest("IT-F09-04-016", 並び("016", "〔フォーマットID-F0904-016〕", ["土地"], { 土地: [["カードBL", 8], ["カードNL", 5]] }));
caseTest("IT-F09-04-017", 並び("017", "〔フォーマットID-F0904-017〕", ["スペル"], { スペル: [["カードM", 7]] }));
caseTest("IT-F09-04-018", 並び("018", "〔フォーマットID-F0904-018〕", ["スペル"], { スペル: [["カードM", 7]] }));
caseTest("IT-F09-04-019", 並び("019", "〔フォーマットID-F0904-019〕", ["スペル"], { スペル: [["カードM", 7]] }));
caseTest("IT-F09-04-020", 並び("020", "〔フォーマットID-F0904-020〕", ["土地"], { 土地: [] }));

// ---------------------------------------------------------------------------
// 見出し・集計期間の表示・切替（021〜025）
// ---------------------------------------------------------------------------

caseTest("IT-F09-04-021", async ({ page, notes, step, expected }) => {
  let r!: UsageRankingPage;
  let 見出し = "";
  await step(1, async () => { r = await 開く(page, notes.get("〔フォーマットID-F0904-021〕")); });
  await step(2, async () => { 見出し = await r.見出しの文(); });
  await expected(async () => {
    expect.soft(見出し, "画面上部の見出しに、フォーマットの日本語名（F0904-021-フォーマット）").toContain(N("021", "フォーマット"));
  });
});

caseTest("IT-F09-04-022", async ({ page, notes, step, expected }) => {
  let r!: UsageRankingPage;
  let 見出し = "";
  await step(1, async () => {
    note("表示言語は、公開側のトップを日本語表示で開き、画面上部の言語切替（EN）を押して英語に切り替えた");
    await トップを開く(page);
    await 言語を切り替える(page);
    expect(表示言語(page), "英語表示に切り替わった（アドレスの言語）").toBe("en");
  });
  await step(2, async () => {
    note("英語表示のメタゲーム一覧では、採用枚数ランキングへの入口は「Top Cards Ranking」と出る。これを押した");
    r = await 開く(page, notes.get("〔フォーマットID-F0904-022〕"), "en");
  });
  await step(3, async () => { 見出し = await r.見出しの文_空白つき(); });
  await expected(async () => {
    expect.soft(見出し, "画面上部の見出しに、フォーマットの英語名（F0904-022-FORMAT）").toContain(N("022", "FORMAT"));
  });
});

caseTest("IT-F09-04-023", async ({ page, notes, step, expected }) => {
  let r!: UsageRankingPage;
  let 開始日 = "";
  await step(1, async () => { r = await 開く(page, notes.get("〔フォーマットID-F0904-023〕")); });
  await step(2, async () => { 開始日 = await r.開始日(); });
  await expected(async () => {
    note("「当日の30日前の日付」は、日本時間の実行日から30日を引いた日として、画面の表記（yyyy/mm/dd）で比べた");
    expect.soft(開始日, "集計期間の表示の開始日（当日の30日前）").toBe(表示日付(日付(-30)));
  });
});

/** 024・025: 切替の見出しを順に押したあと、最後に押した区画だけが表示されること */
function 切替(ケース: string, 控え: string, 順: [区分, 区分]): CaseBody {
  return async ({ page, notes, step, expected }) => {
    let r!: UsageRankingPage;
    await step(1, async () => { r = await 開く(page, notes.get(控え)); });
    await step(2, async () => { await r.切替を押す(順[0]); });
    await step(3, async () => { await r.切替を押す(順[1]); });
    await expected(async () => {
      const [隠れる, 出る] = 順;
      const 名 = (k: 区分) => (k === "スペル" ? "カードA" : "カードL");
      expect.soft(await r.表示されている(出る), `${出る}のランキングが表示されている`).toBe(true);
      const rows = await r.件を読む(出る);
      expect.soft(rows[0]?.名前, `${出る}のランキングの1位（${前印(ケース, 名(出る))}）`).toBe(N(ケース, 名(出る)));
      await expect.soft(r.件のリンク(出る, N(ケース, 名(出る))), `${出る}のランキングの ${前印(ケース, 名(出る))} が見えている`).toBeVisible();
      expect.soft(await r.表示されている(隠れる), `${隠れる}のランキングは表示されていない`).toBe(false);
      await expect.soft(r.件のリンク(隠れる, N(ケース, 名(隠れる))), `${隠れる}のランキングの ${前印(ケース, 名(隠れる))} は見えていない`).toBeHidden();
    });
  };
}
caseTest("IT-F09-04-024", 切替("024", "〔フォーマットID-F0904-024〕", ["スペル", "土地"]));
caseTest("IT-F09-04-025", 切替("025", "〔フォーマットID-F0904-025〕", ["土地", "スペル"]));

// ---------------------------------------------------------------------------
// カードの画像を選べないとき（032）・対象フォーマットが無いとき（033）
// ---------------------------------------------------------------------------

caseTest("IT-F09-04-032", async ({ page, notes, step, expected }) => {
  let r!: UsageRankingPage;
  let rows: ランキングの件[] = [];
  await step(1, async () => { r = await 開く(page, notes.get("〔フォーマットID-F0904-032〕")); });
  await step(2, async () => { await r.切替を押す("スペル"); });
  await step(3, async () => { rows = await r.件を読む("スペル"); });
  await expected(async () => {
    const x = rows.filter((v) => v.名前 === N("032", "カードX"));
    expect.soft(x.length, "スペルのランキングに F0904-032-カードX の件が1件").toBe(1);
    expect.soft(rows[0]?.名前, "スペルのランキングの1位（F0904-032-カードX）").toBe(N("032", "カードX"));
    expect.soft(rows[0]?.枚数の文, "スペルのランキングの1位の枚数（4枚）").toBe("4枚");
    note("「読み込み中の画像」は、この画面が読み込み中の表示に使う画像（ajax-loader.gif）として、件の画像の参照先のファイル名で比べた");
    expect.soft(x[0]?.画像のファイル名, `F0904-032-カードX の件の画像が読み込み中の画像のまま（参照先: ${x[0]?.画像 ?? "なし"}）`).toBe("ajax-loader.gif");
  });
});

caseTest("IT-F09-04-033", async ({ page, notes, step, expected }) => {
  let status = 0;
  await step(1, async () => { await 開く(page, notes.get("〔フォーマットID-F0904-033〕")); });
  await step(2, async () => {
    const u = new URL(page.url());
    u.pathname = u.pathname.replace(/\/deck\/\d+\/usage_ranking\//, "/deck/89040339/usage_ranking/");
    const res = await page.goto(u.toString(), { waitUntil: "load", timeout: 90_000 });
    status = res?.status() ?? 0;
  });
  await expected(async () => {
    expect.soft(status, "書き換えたアドレスの応答の状態（404）").toBe(404);
    expect.soft(await page.locator("#js-card-ranking-spell, #js-card-ranking-land, .deckSearch-cardAmount__rk__li").count(), "ランキングの区画と件が無い").toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 画面から引き継ぐ条件（035〜037）
// ---------------------------------------------------------------------------

caseTest("IT-F09-04-035", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔フォーマットID-F0904-035〕");
  let r!: UsageRankingPage;
  await step(1, async () => { r = await 開く(page, id); });
  await step(2, async () => { await r.戻るを押す(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "開いた画面（このフォーマットのメタゲーム一覧）").toBe(`/ja/deck/${id}/metagame/`);
    const mg = new MetagamePage(page);
    await expect.soft(mg.見出し, "メタゲーム一覧の見出し").toBeVisible();
    expect.soft(await mg.見出しの名前(), "メタゲーム一覧の見出し（F0904-035-フォーマットのメタゲーム）").toBe(`${N("035", "フォーマット")}メタゲーム`);
  });
});

/** 実行日（日本時間）の nか月前の「yyyy/mm/dd」。月末を越える日は、翌月へ繰り越す（F09-03 と同じ） */
function 月前(n: number): string {
  const d = new Date(`${日付(0)}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - n);
  return 表示日付(d.toISOString().slice(0, 10));
}

caseTest("IT-F09-04-036", async ({ page, notes, step, expected }) => {
  let r!: UsageRankingPage;
  await step(1, async () => { r = await 開く(page, notes.get("〔フォーマットID-F0904-036〕")); });
  await step(2, async () => { await r.デッキ検索ページを押す(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "開いた画面（デッキ検索TOP）").toBe("/ja/deck/");
    note("デッキ検索TOPの検索条件の入力欄は、画面上部の「詳細検索」で開くモーダル（デッキ詳細検索）にある。モーダルを開いて見た");
    note("「当日の6か月前」は、日本時間の実行日から月を6つ戻した日（月末を越える日は翌月へ繰り越す）として比べた");
    const modal = new DeckSearchModal(page);
    await modal.開く();
    await expect.soft(modal.欄("dateFrom"), "開催日時の開始の初期値（当日の6か月前）").toHaveValue(月前(6));
    expect.soft(await 選ばれている選択肢(modal.フォーム, "grades"), "成績の初期値（掲載デッキすべて）").toBe("掲載デッキすべて");
    expect.soft(await 選ばれている選択肢(modal.フォーム, "public_status"), "公開/非公開の初期値（非公開リストを含む）").toBe("非公開リストを含む");
    for (const [name, 名] of [["dateTo", "開催日時の終了"], ["capacityFrom", "参加人数の下限"], ["capacityTo", "参加人数の上限"], ["card", "カード名"], ["player", "プレイヤー名"], ["eventName", "イベント名"]] as const) {
      await expect.soft(modal.欄(name), `${名}の入力欄は空`).toHaveValue("");
    }
    expect.soft(await modal.フォーム.locator('input[type="checkbox"]:checked').count(), "フォーマット・タグなどのチェックの選択肢は、どれも選ばれていない").toBe(0);
  });
});

caseTest("IT-F09-04-037", async ({ page, notes, step, expected }) => {
  const カードID = notes.get("〔カードID-F0904-037〕");
  let r!: UsageRankingPage;
  let 先: Page | null = null;
  let 先のアドレス = "";
  await step(1, async () => { r = await 開く(page, notes.get("〔フォーマットID-F0904-037〕")); });
  await step(2, async () => { await r.切替を押す("スペル"); });
  await step(3, async () => {
    note("件のカード画像は、押すと別のタブで開くリンク。開いたタブの画面を遷移先として見た");
    先 = await r.件を押す("スペル", N("037", "カードA"));
  });
  await step(4, async () => { 先のアドレス = 先 ? (先 as Page).url() : ""; });
  await expected(async () => {
    expect.soft(先 !== null, "件を押すと遷移先の画面が開く").toBe(true);
    const u = 先のアドレス ? new URL(先のアドレス) : null;
    expect.soft(u?.pathname ?? "", `遷移先が商品検索（アドレス: ${先のアドレス}）`).toMatch(/\/products\/search\/?$/);
    const 値 = u ? [...u.searchParams.values()] : [];
    expect.soft(値, `遷移先の検索条件にカードID ${カードID}（アドレスの条件）`).toContain(カードID);
  });
});

// ---------------------------------------------------------------------------
// 永続化（039）・キャッシュの鍵（046）
// ---------------------------------------------------------------------------

caseTest("IT-F09-04-039", async ({ page, notes, step, expected, db }) => {
  const id = notes.get("〔フォーマットID-F0904-039〕");
  let r!: UsageRankingPage;
  let 前 = { デッキ: [] as string[], 採用カード: [] as string[], カード: [] as string[] };
  let 後 = 前;
  note("「デッキ、大会、採用カード、カードの範囲」は、このフォーマットのデッキ（大会の名前・開催日はデッキの項目に持つ）、そのデッキの採用カード、採用されたカードとして読んだ");
  await step(1, async () => { void db; 前 = フォーマットのデッキとカードの全項目(id); });
  await step(2, async () => { r = await 開く(page, id); });
  await step(3, async () => { await r.切替を押す("スペル"); await r.切替を押す("土地"); });
  await step(4, async () => { 後 = フォーマットのデッキとカードの全項目(id); });
  await expected(async () => {
    expect.soft(前.デッキ.length, "表示する前のデッキの件数（シードの1件）").toBe(1);
    expect.soft(前.採用カード.length, "表示する前の採用カードの件数（シードの1件）").toBe(1);
    expect.soft(前.カード.length, "表示する前のカードの件数（シードの1件）").toBe(1);
    for (const k of ["デッキ", "採用カード", "カード"] as const) {
      expect.soft(後[k].length, `表示した後の${k}の件数（前と同じ）`).toBe(前[k].length);
      expect.soft(後[k], `表示した後の${k}の全項目の値（前と同じ）`).toEqual(前[k]);
    }
  });
});

caseTest("IT-F09-04-046", async ({ page, notes, step, expected }) => {
  let r!: UsageRankingPage;
  let P: ランキングの件[] = [];
  let Q: ランキングの件[] = [];
  await step(1, async () => { r = await 開く(page, notes.get("〔フォーマットID-F0904-046A〕")); });
  await step(2, async () => { await r.切替を押す("スペル"); P = await r.件を読む("スペル"); });
  await step(3, async () => { r = await 開く(page, notes.get("〔フォーマットID-F0904-046B〕")); });
  await step(4, async () => { await r.切替を押す("スペル"); Q = await r.件を読む("スペル"); });
  await expected(async () => {
    note("手順2のスペルのランキングは、手順2で表示したときに読んだ件で確かめた");
    const 比べ = [
      ...並びの比べ("スペル", "046", [["カードP", 4]], P).map(([a, m, b]) => [a, `手順2の${m}`, b] as 比べ),
      ...並びの比べ("スペル", "046", [["カードQ", 6]], Q).map(([a, m, b]) => [a, `手順4の${m}`, b] as 比べ),
      ...載らない比べ("スペル", "046", ["カードP"], Q).map(([a, m, b]) => [a, `手順4の${m}`, b] as 比べ),
    ];
    for (const [実際, 文, 値] of 比べ) expect.soft(実際, 文).toEqual(値);
  });
});

// ---------------------------------------------------------------------------
// 組み合わせ（049〜054）
// ---------------------------------------------------------------------------

caseTest("IT-F09-04-049", 並び("CB049", "〔フォーマットID-F0904-049〕", ["土地"], { 土地: [["カードBL", 6]] }));
caseTest("IT-F09-04-050", 並び("CB050", "〔フォーマットID-F0904-050〕", ["スペル"], { スペル: [] }));
caseTest("IT-F09-04-051", 並び("CB051", "〔フォーマットID-F0904-051〕", ["スペル"], { スペル: [["カードLG", 4]] }));
caseTest("IT-F09-04-052", 並び("CB052", "〔フォーマットID-F0904-052〕", ["土地"], { 土地: [["カードNL", 5]] }));
caseTest("IT-F09-04-053", 並び("CB053", "〔フォーマットID-F0904-053〕", ["土地"], { 土地: [["カードOL", 3]] }));
caseTest("IT-F09-04-054", 並び("CB054", "〔フォーマットID-F0904-054〕", ["スペル"], { スペル: [["カードBC", 4]] }));

// ---------------------------------------------------------------------------
// カード画像の選び方（026〜031・047・048・055〜060）
// ---------------------------------------------------------------------------

const 番号の置き換えの注記 = "シードのカード詳細IDは、シード表の決め打ちの番号の代わりに、未使用の番号を同じ大小の順で振ったもの（判定は条件付き）";

/** 026〜031: 日本語表示で開き、スペルのランキングのカードXの件の画像のファイル名を確かめる */
function 画像(ケース: string, 控え: string, 期待: string): CaseBody {
  return async ({ page, notes, step, expected }) => {
    let r!: UsageRankingPage;
    let rows: ランキングの件[] = [];
    await step(1, async () => { r = await 開く(page, notes.get(控え)); });
    await step(2, async () => { await r.切替を押す("スペル"); });
    await step(3, async () => { rows = await r.件を読む("スペル"); });
    await expected(async () => {
      note(番号の置き換えの注記);
      const x = rows.filter((v) => v.名前 === N(ケース, "カードX"));
      expect.soft(x.length, `スペルのランキングに ${前印(ケース, "カードX")} の件が1件`).toBe(1);
      expect.soft(x[0]?.画像のファイル名, `${前印(ケース, "カードX")} の件の画像のファイル名（参照先: ${x[0]?.画像 ?? "なし"}）`).toBe(期待);
    });
  };
}
caseTest("IT-F09-04-026", 画像("026", "〔フォーマットID-F0904-026〕", "F0904-026-IMG-2.jpg"));
caseTest("IT-F09-04-027", 画像("027", "〔フォーマットID-F0904-027〕", "F0904-027-IMG-2.jpg"));
caseTest("IT-F09-04-028", 画像("028", "〔フォーマットID-F0904-028〕", "F0904-028-IMG-2.jpg"));
caseTest("IT-F09-04-029", 画像("029", "〔フォーマットID-F0904-029〕", "F0904-029-IMG-2.jpg"));
caseTest("IT-F09-04-030", 画像("030", "〔フォーマットID-F0904-030〕", "F0904-030-IMG-2.jpg"));
caseTest("IT-F09-04-031", 画像("031", "〔フォーマットID-F0904-031〕", "F0904-031-IMG-2.jpg"));

/** 055〜060: 英語表示に切り替えて開き、スペルのランキングのカードXの件の画像のファイル名を確かめる */
function 英語の画像(ケース: string, 控え: string, 期待: string): CaseBody {
  return async ({ page, notes, step, expected }) => {
    let r!: UsageRankingPage;
    let rows: ランキングの件[] = [];
    let 切替の名前 = "";
    await step(1, async () => {
      note("表示言語は、公開側のトップを日本語表示で開き、画面上部の言語切替（EN）を押して英語に切り替えた");
      await トップを開く(page);
      await 言語を切り替える(page);
      expect(表示言語(page), "英語表示に切り替わった（アドレスの言語）").toBe("en");
    });
    await step(2, async () => {
      note("英語表示のメタゲーム一覧では、採用枚数ランキングへの入口は「Top Cards Ranking」と出る。これを押した");
      r = await 開く(page, notes.get(控え), "en");
    });
    await step(3, async () => {
      切替の名前 = await r.切替を押す("スペル");
      expect(切替の名前, "押した切替の見出し（Spell Top Cards Ranking）").toBe("Spell Top Cards Ranking");
    });
    await step(4, async () => { rows = await r.件を読む("スペル"); });
    await expected(async () => {
      note(番号の置き換えの注記);
      note("英語表示では、件の画像の代替の文はカードの英語名（このカードは日本語名と同じ値）");
      const x = rows.filter((v) => v.名前 === N(ケース, "カードX"));
      expect.soft(x.length, `スペルのランキングに ${前印(ケース, "カードX")} の件が1件`).toBe(1);
      expect.soft(x[0]?.画像のファイル名, `英語表示での ${前印(ケース, "カードX")} の件の画像のファイル名（参照先: ${x[0]?.画像 ?? "なし"}）`).toBe(期待);
    });
  };
}
caseTest("IT-F09-04-055", 英語の画像("CB055", "〔フォーマットID-F0904-055〕", "F0904-CB055-IMG-1.jpg"));
caseTest("IT-F09-04-056", 英語の画像("CB056", "〔フォーマットID-F0904-056〕", "F0904-CB056-IMG-1.jpg"));
caseTest("IT-F09-04-057", 英語の画像("CB057", "〔フォーマットID-F0904-057〕", "F0904-CB057-IMG-1.jpg"));
caseTest("IT-F09-04-058", 英語の画像("CB058", "〔フォーマットID-F0904-058〕", "F0904-CB058-IMG-1.jpg"));
caseTest("IT-F09-04-059", 英語の画像("CB059", "〔フォーマットID-F0904-059〕", "F0904-CB059-IMG-1.jpg"));
caseTest("IT-F09-04-060", 英語の画像("CB060", "〔フォーマットID-F0904-060〕", "F0904-CB060-IMG-2.jpg"));

const 画像の名 = (rows: ランキングの件[], ケース: string, 名: string) => rows.find((v) => v.名前 === N(ケース, 名))?.画像のファイル名;

caseTest("IT-F09-04-047", async ({ page, notes, step, expected }) => {
  let r!: UsageRankingPage;
  let A: ランキングの件[] = [];
  let B: ランキングの件[] = [];
  await step(1, async () => { r = await 開く(page, notes.get("〔フォーマットID-F0904-047A〕")); });
  await step(2, async () => { await r.切替を押す("スペル"); });
  await step(3, async () => { A = await r.件を読む("スペル"); });
  await step(4, async () => { r = await 開く(page, notes.get("〔フォーマットID-F0904-047B〕")); });
  await step(5, async () => { await r.切替を押す("スペル"); });
  await step(6, async () => { B = await r.件を読む("スペル"); });
  await expected(async () => {
    note(番号の置き換えの注記);
    expect.soft(画像の名(A, "047", "カードX"), "手順3の F0904-047-カードX の件の画像（F0904-047-IMG-X.jpg）").toBe("F0904-047-IMG-X.jpg");
    expect.soft(画像の名(A, "047", "カードY"), "手順3の F0904-047-カードY の件の画像（F0904-047-IMG-Y.jpg）").toBe("F0904-047-IMG-Y.jpg");
    expect.soft(画像の名(B, "047", "カードZ"), "手順6の F0904-047-カードZ の件の画像（F0904-047-IMG-Z.jpg）").toBe("F0904-047-IMG-Z.jpg");
    expect.soft(画像の名(B, "047", "カードW"), "手順6の F0904-047-カードW の件の画像（F0904-047-IMG-W.jpg）").toBe("F0904-047-IMG-W.jpg");
    const 手順6の画像 = B.map((v) => v.画像のファイル名);
    expect.soft(手順6の画像, "手順6にカードXの画像（F0904-047-IMG-X.jpg）が出ていない").not.toContain("F0904-047-IMG-X.jpg");
    expect.soft(手順6の画像, "手順6にカードYの画像（F0904-047-IMG-Y.jpg）が出ていない").not.toContain("F0904-047-IMG-Y.jpg");
  });
});

caseTest("IT-F09-04-048", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔フォーマットID-F0904-048〕");
  let r!: UsageRankingPage;
  let 控え = "";
  let 表示した時刻 = 0;
  let 英語の画像 = "";
  await step(1, async () => { r = await 開く(page, id); });
  await step(2, async () => { await r.切替を押す("スペル"); 表示した時刻 = Date.now(); });
  await step(3, async () => { 控え = 画像の名(await r.件を読む("スペル"), "048", "カードX") ?? ""; });
  await step(4, async () => {
    note("表示言語は、いまの画面の上部の言語切替（EN）を押して英語に切り替えた");
    await 言語を切り替える(page);
    expect(表示言語(page), "英語表示に切り替わった（アドレスの言語）").toBe("en");
    expect(Date.now() - 表示した時刻, "手順2の表示から5分以内に切り替えた").toBeLessThan(5 * 60_000);
  });
  await step(5, async () => { r = await 開く(page, id, "en"); });
  await step(6, async () => { expect(await r.切替を押す("スペル"), "押した切替の見出し（Spell Top Cards Ranking）").toBe("Spell Top Cards Ranking"); });
  await step(7, async () => { 英語の画像 = 画像の名(await r.件を読む("スペル"), "048", "カードX") ?? ""; });
  await expected(async () => {
    note(番号の置き換えの注記);
    expect.soft(控え, "手順3で控えた画像（F0904-048-IMG-JA.jpg）").toBe("F0904-048-IMG-JA.jpg");
    expect.soft(英語の画像, "手順7の F0904-048-カードX の件の画像（手順3と同じ F0904-048-IMG-JA.jpg のまま）").toBe("F0904-048-IMG-JA.jpg");
    expect.soft(英語の画像, "手順7の画像が F0904-048-IMG-EN.jpg になっていない").not.toBe("F0904-048-IMG-EN.jpg");
  });
});

// ---------------------------------------------------------------------------
// 商品ポップアップからカートへ（038）
// ---------------------------------------------------------------------------

caseTest("IT-F09-04-038", async ({ page, notes, step, expected }) => {
  let r!: UsageRankingPage;
  let かご: Page | null = null;
  await step(1, async () => { r = await 開く(page, notes.get("〔フォーマットID-F0904-038〕")); });
  await step(2, async () => { await r.切替を押す("スペル"); });
  await step(3, async () => {
    note("「件に操作して」は、画面幅の広い表示で件のカード画像にマウスを乗せること（乗せると商品ポップアップが出る作り）として行った");
    await r.ポップアップを開く("スペル", N("038", "カードA"));
  });
  await step(4, async () => { await r.カートに追加を押す(); });
  await step(5, async () => {
    note("「買い物かごを見る」は画像のリンクで、押すと別のタブで開く。開いたタブを買い物かごの画面として見た");
    かご = await r.買い物かごを見るを押す();
  });
  await expected(async () => {
    const p = かご as Page | null;
    expect.soft(p ? new URL(p.url()).pathname : "", "開いた画面（買い物かご）").toMatch(/\/cart\/?$/);
    if (p) await expect.soft(p.getByText(N("038", "商品"), { exact: false }).first(), "買い物かごに商品 F0904-038-商品 が入っている").toBeVisible();
  });
});
