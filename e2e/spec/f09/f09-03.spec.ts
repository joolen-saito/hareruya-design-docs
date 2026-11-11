/**
 * F09-03 メタゲーム一覧（フロント）。正本: cases/F09-03_test_cases.tsv
 *
 * メタゲーム一覧の集計は、画面が受け取ったフォーマットのデッキだけを数える（設計書 L0010）。各ケースのシードは新しいフォーマットを
 * 作るので、ほかのデッキの有無は期待結果に関わらない。
 * 書いていないケースと理由:
 * 009・010・015（アーキタイプ未設定のデッキをDBへ直接入れる準備）、017・018（DB投入）、019（中身を定めない画像ファイルを置く準備）、
 * 034・035・036（キャッシュ保存先の中身を見る・消す）。
 */
import { Page, test } from "@playwright/test";
import { caseTest, CaseBody, expect } from "../../lib/case";
import { 日付, 表示日付 } from "../../pages/admin/f09_01_setup";
import { DeckSearchModal } from "../../pages/front/f09_01_deck_top";
import { DeckResultPage } from "../../pages/front/f09_02_deck_result";
import { MetagamePage, 採用枚数ランキングの見出し, 見出しの文, 選ばれている選択肢 } from "../../pages/front/f09_03_metagame";
import { フォーマットのデッキの更新日時 } from "../../db/f09_03";
import { N, アーキタイプの番号 } from "../../seeds/f09-03";
import "../../seeds/f09-03";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 前印 = (ケース: string, 名: string) => `F0903-${ケース}-${名}`;
const 入力欄の注記 = "画面下部の検索条件の入力欄は、この画面では画面上部の「詳細検索」で開くモーダル（デッキ詳細検索）として置かれている（メタゲーム一覧の画面の中に入力欄は無い）。モーダルを開いて操作した";

/** 実行日（日本時間）の nか月前の「yyyy/mm/dd」。月末を越える日は、翌月へ繰り越す（画面の日付の計算と同じ） */
function 月前(n: number): string {
  const base = 日付(0);
  const d = new Date(`${base}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - n);
  return 表示日付(d.toISOString().slice(0, 10));
}

/** 手順1: 控えたフォーマットの識別子でメタゲーム一覧を開き、組み立てが済むのを待つ */
async function 開く(page: Page, 識別子: string): Promise<MetagamePage> {
  const mg = new MetagamePage(page);
  const status = await mg.開く(識別子);
  if (status !== 200) throw new Error(`メタゲーム一覧を開けない（応答 ${status}）`);
  await mg.読み込みを待つ();
  return mg;
}

/** 一覧の、アーキタイプ名が一致する行 */
async function 行(mg: MetagamePage, 名: string) { return (await mg.行()).filter((r) => r.名前 === 名); }

/** デッキ数を見るケース: 「載る」の行がそれぞれ1行でデッキ数が一致し、「載らない」の行が無いこと */
function デッキ数(ケース: string, 控え: string, 載る: [string, string][], 載らない: string[] = [], 行数?: number): CaseBody {
  return async ({ page, notes, step, expected }) => {
    let mg!: MetagamePage;
    await step(1, async () => { mg = await 開く(page, notes.get(控え)); });
    await expected(async () => {
      const rows = await mg.行();
      if (行数 !== undefined) expect.soft(rows.length, `一覧の行の数（${行数}行）`).toBe(行数);
      for (const [a, 数] of 載る) {
        const r = rows.filter((x) => x.名前 === N(ケース, a));
        expect.soft(r.length, `一覧の ${前印(ケース, a)} の行の数`).toBe(1);
        expect.soft(r[0]?.デッキ数, `${前印(ケース, a)} の行のデッキ数`).toBe(数);
      }
      for (const a of 載らない) {
        expect.soft(rows.filter((x) => x.名前 === N(ケース, a)).length, `一覧に ${前印(ケース, a)} の行が無い`).toBe(0);
      }
    });
  };
}

// ---------------------------------------------------------------------------
// 対象フォーマットの特定
// ---------------------------------------------------------------------------

caseTest("IT-F09-03-001", async ({ page, step, expected }) => {
  let status = 0;
  await step(1, async () => { status = await new MetagamePage(page).開く("903001"); });
  await expected(async () => {
    expect(status, "メタゲーム一覧の応答（HTTP ステータス）").toBe(404);
  });
});

caseTest("IT-F09-03-002", async ({ page, notes, step, expected }) => {
  const mg = new MetagamePage(page);
  let status = 0;
  await step(1, async () => {
    status = await mg.開く(`x${notes.get("〔フォーマット識別子-F0903-002〕")}`);
    note(`数字以外の識別子で開いたときの応答は ${status}`);
  });
  await expected(async () => {
    await expect.soft(mg.見出し.filter({ hasText: "メタゲーム" }), "メタゲーム一覧の見出しが表示されない").toHaveCount(0);
    await expect.soft(mg.一覧の項目, "メタゲーム一覧の一覧の行が表示されない").toHaveCount(0);
    await expect.soft(page.locator(".deckSearch-metaList__list__item__name", { hasText: N("002", "A") }), `${前印("002", "A")} の行が表示されない`).toHaveCount(0);
  });
});

caseTest("IT-F09-03-003", デッキ数("003", "〔フォーマット識別子-F0903-003〕", [["A", "2"]]));

caseTest("IT-F09-03-033", async ({ page, step, expected }) => {
  const mg = new MetagamePage(page);
  let status = 0;
  await step(1, async () => {
    status = await mg.開く("903033");
    note(`識別子 903033 で開いたときの応答は ${status}`);
  });
  await expected(async () => {
    await expect.soft(page.locator("ul.deckSearch-metaList__list"), "アーキタイプの一覧が表示されない").toHaveCount(0);
    await expect.soft(mg.一覧の項目, "アーキタイプの行が表示されない").toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// 集計の対象と単位
// ---------------------------------------------------------------------------

caseTest("IT-F09-03-004", デッキ数("004", "〔フォーマット識別子-F0903-004〕", [["A", "3"], ["B", "1"]], [], 2));
caseTest("IT-F09-03-005", デッキ数("005", "〔フォーマット識別子-F0903-005〕", [["A", "2"]]));
caseTest("IT-F09-03-006", デッキ数("006", "〔フォーマット識別子-F0903-006〕", [["A", "2"]]));
caseTest("IT-F09-03-007", デッキ数("007", "〔フォーマット識別子-F0903-007A〕", [["A", "2"]], ["Z"]));
caseTest("IT-F09-03-008", デッキ数("008", "〔フォーマット識別子-F0903-008〕", [["A", "3"]]));
caseTest("IT-F09-03-011", デッキ数("011", "〔フォーマット識別子-F0903-011〕", [["A", "2"]], ["B"]));
caseTest("IT-F09-03-012", デッキ数("012", "〔フォーマット識別子-F0903-012〕", [["A", "2"]], ["B"]));
caseTest("IT-F09-03-013", デッキ数("013", "〔フォーマット識別子-F0903-013〕", [["A", "2"]], ["B"]));

/** 該当なしの案内だけが出て、アーキタイプの行が無いこと（014・037） */
function 該当なし(控え: string): CaseBody {
  return async ({ page, notes, step, expected }) => {
    let mg!: MetagamePage;
    await step(1, async () => { mg = await 開く(page, notes.get(控え)); });
    await expected(async () => {
      await expect.soft(mg.該当なしの案内, "「ご指定の条件に一致するデッキが見つかりませんでした。」が表示される").toBeVisible();
      await expect.soft(mg.一覧の項目, "アーキタイプの行が1行も表示されない").toHaveCount(0);
    });
  };
}
caseTest("IT-F09-03-014", 該当なし("〔フォーマット識別子-F0903-014〕"));
caseTest("IT-F09-03-037", 該当なし("〔フォーマット識別子-F0903-CB037〕"));

caseTest("IT-F09-03-038", async ({ page, notes, step, expected }) => {
  let mg!: MetagamePage;
  await step(1, async () => { mg = await 開く(page, notes.get("〔フォーマット識別子-F0903-CB038〕")); });
  await expected(async () => {
    const rows = await mg.行();
    expect.soft(rows.map((r) => r.名前), `一覧の行（${前印("CB038", "A")}、${前印("CB038", "B")} の順の2行）`).toEqual([N("CB038", "A"), N("CB038", "B")]);
    expect.soft(rows[0]?.デッキ数, `${前印("CB038", "A")} の行のデッキ数`).toBe("2");
    expect.soft(rows[0]?.使用率, `${前印("CB038", "A")} の行の使用率`).toBe("66.67%");
    expect.soft(rows[1]?.デッキ数, `${前印("CB038", "B")} の行のデッキ数`).toBe("1");
    expect.soft(rows[1]?.使用率, `${前印("CB038", "B")} の行の使用率`).toBe("33.33%");
  });
});

// ---------------------------------------------------------------------------
// 一覧の各件・見出し
// ---------------------------------------------------------------------------

caseTest("IT-F09-03-020", async ({ page, notes, step, expected }) => {
  let mg!: MetagamePage;
  await step(1, async () => { mg = await 開く(page, notes.get("〔フォーマット識別子-F0903-020〕")); });
  await expected(async () => {
    const r = await 行(mg, N("020", "A"));
    expect.soft(r.length, `一覧の ${前印("020", "A")} の行の数`).toBe(1);
    note("画像なし用の既定画像は、画面の作りの既定の画像（アーキタイプの画像なし用のファイル noimagearche.jpg）として確かめた");
    expect.soft(r[0]?.画像 ?? "", `${前印("020", "A")} の行の画像（画像なし用の既定画像）`).toMatch(/\/noimagearche\.jpg$/);
  });
});

caseTest("IT-F09-03-021", async ({ page, notes, step, expected }) => {
  let mg!: MetagamePage;
  await step(1, async () => { mg = await 開く(page, notes.get("〔フォーマット識別子-F0903-021〕")); });
  await expected(async () => {
    expect(await mg.見出しの名前(), `画面上部の見出し（「${前印("021", "F")}メタゲーム」）`).toBe(`${N("021", "F")}メタゲーム`);
  });
});

caseTest("IT-F09-03-022", async ({ page, notes, step, expected }) => {
  let mg!: MetagamePage;
  await step(1, async () => { mg = await 開く(page, notes.get("〔フォーマット識別子-F0903-022〕")); });
  await expected(async () => {
    expect(await mg.開始日(), "見出しの集計期間の開始日（実行日の14日前、Y/m/d）").toBe(表示日付(日付(-14)));
  });
});

// ---------------------------------------------------------------------------
// 永続化（デッキ情報を更新しない）
// ---------------------------------------------------------------------------

caseTest("IT-F09-03-023", async ({ page, notes, step, expected, db }) => {
  const id = notes.get("〔フォーマット識別子-F0903-023〕");
  let 前: { デッキ: string; 更新日時: string }[] = [];
  let 後: { デッキ: string; 更新日時: string }[] = [];
  await step(1, async () => { void db; 前 = フォーマットのデッキの更新日時(id); });
  await step(2, async () => { await 開く(page, id); });
  await step(3, async () => { 後 = フォーマットのデッキの更新日時(id); });
  await expected(async () => {
    expect.soft(前.length, "表示の前のデッキの件数（シードの2件）").toBe(2);
    expect.soft(後.length, "表示の後のデッキの件数（前と同じ）").toBe(前.length);
    expect.soft(後, "表示の後の各デッキの更新日時（前と同じ）").toEqual(前);
  });
});

// ---------------------------------------------------------------------------
// 画面から引き継ぐ検索条件
// ---------------------------------------------------------------------------

caseTest("IT-F09-03-024", async ({ page, notes, step, expected, capture }) => {
  let mg!: MetagamePage;
  await step(1, async () => { mg = await 開く(page, notes.get("〔フォーマット識別子-F0903-024〕")); });
  await step(2, async () => { await mg.行を押す(N("024", "A")); await new DeckResultPage(page).読み込みを待つ(); });
  await expected(async () => {
    note("デッキ検索結果の検索条件は、画面上部の「詳細検索」で開くモーダル（デッキ詳細検索）にある。モーダルを開いて見た");
    const modal = new DeckSearchModal(page);
    await modal.開く();
    await capture("デッキ検索結果の検索条件（詳細検索）");
    expect.soft(new URL(page.url()).pathname, "開いた画面（デッキ検索結果）").toBe("/ja/deck/result/");
    await expect.soft(modal.選んだアーキタイプ, `検索条件のアーキタイプ（${前印("024", "A")} の番号）`).toHaveValue(アーキタイプの番号("024", "A"));
    await expect.soft(modal.フォーム.locator(".js-archetype-text"), `検索条件のアーキタイプの表示（${前印("024", "A")}）`).toHaveText(N("024", "A"));
    await expect.soft(modal.欄("dateFrom"), "検索条件の開催日時（開始）（実行日の14日前、Y/m/d）").toHaveValue(表示日付(日付(-14)));
  });
});

caseTest("IT-F09-03-025", async ({ page, notes, step, expected }) => {
  let mg!: MetagamePage;
  await step(1, async () => { mg = await 開く(page, notes.get("〔フォーマット識別子-F0903-025〕")); });
  await step(2, async () => { await mg.行を押す(N("025", "A")); });
  await expected(async () => {
    const 名前 = await new DeckResultPage(page).プレイヤー名();
    expect.soft([...名前].sort(), `デッキ検索結果のデッキ（${前印("025", "P1")} と ${前印("025", "P2")} の2件だけ）`).toEqual([N("025", "P1"), N("025", "P2")].sort());
  });
});

caseTest("IT-F09-03-027", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔フォーマット識別子-F0903-027〕");
  let mg!: MetagamePage;
  await step(1, async () => { mg = await 開く(page, id); });
  await step(2, async () => { await mg.採用枚数ランキングを押す(); });
  await expected(async () => {
    expect.soft(await 採用枚数ランキングの見出し(page), `採用枚数ランキングの見出し（「${前印("027", "F")}採用枚数ランキング」）`).toBe(`${N("027", "F")}採用枚数ランキング`);
    expect.soft(new URL(page.url()).pathname, "採用枚数ランキングのフォーマット（遷移元のフォーマットの識別子）").toBe(`/ja/deck/${id}/usage_ranking/`);
  });
});

caseTest("IT-F09-03-028", async ({ page, notes, step, expected }) => {
  let mg!: MetagamePage;
  await step(1, async () => { mg = await 開く(page, notes.get("〔フォーマット識別子-F0903-028〕")); });
  await step(2, async () => { await mg.戻るを押す(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "開いた画面（デッキ検索TOP）").toBe("/ja/deck/");
    await expect.soft(page.locator(".deckSearch-top__flexwrapper--rankingView"), "デッキ検索TOPの、メタゲームの区画の領域").toBeAttached();
    note("デッキ検索TOPには本文の見出しが無く、画面の見出し（h1）は画面上部のロゴの見出しで、その中に「デッキ検索」が出る。この見出しで確かめた");
    expect.soft(await 見出しの文(page), "画面の見出しに「デッキ検索」").toContain("デッキ検索");
  });
});

caseTest("IT-F09-03-029", async ({ page, notes, step, expected, capture }) => {
  let mg!: MetagamePage;
  const modal = new DeckSearchModal(page);
  await step(1, async () => { mg = await 開く(page, notes.get("〔フォーマット識別子-F0903-029〕")); });
  await step(2, async () => {
    note(入力欄の注記);
    await modal.開く();
    await modal.入れる("player", "F0903-029-P");
    await capture("プレイヤー名を入れた検索条件");
    note("「戻る」を押すため、入力したあとモーダルを閉じた（入力した値は送らない）");
    await modal.閉じる();
  });
  await step(3, async () => { await mg.戻るを押す(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "開いた画面（デッキ検索TOP）").toBe("/ja/deck/");
    await modal.開く();
    await expect.soft(modal.欄("player"), "デッキ検索TOPの検索条件のプレイヤー名（空）").toHaveValue("");
  });
});

caseTest("IT-F09-03-030", async ({ page, notes, step, expected }) => {
  const modal = new DeckSearchModal(page);
  await step(1, async () => { await 開く(page, notes.get("〔フォーマット識別子-F0903-030〕")); });
  await step(2, async () => { note(入力欄の注記); await modal.開く(); });
  await expected(async () => {
    note("「実行日の6か月前」は、日本時間の実行日から月を6つ戻した日（月末を越える日は翌月へ繰り越す）として比べた");
    await expect.soft(modal.欄("dateFrom"), "開催日時（開始）の初期値（実行日の6か月前、Y/m/d）").toHaveValue(月前(6));
    expect.soft(await 選ばれている選択肢(modal.フォーム, "grades"), "成績の初期値").toBe("掲載デッキすべて");
    expect.soft(await 選ばれている選択肢(modal.フォーム, "public_status"), "公開/非公開の初期値").toBe("非公開リストを含む");
  });
});

caseTest("IT-F09-03-031", async ({ page, notes, step, expected }) => {
  const modal = new DeckSearchModal(page);
  await step(1, async () => { await 開く(page, notes.get("〔フォーマット識別子-F0903-031〕")); });
  await step(2, async () => {
    note(入力欄の注記);
    await modal.開く();
    await modal.入れる("player", "F0903-031-P");
    await modal.検索する();
    await new DeckResultPage(page).読み込みを待つ();
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "開いた画面（デッキ検索結果）").toBe("/ja/deck/result/");
    note("デッキ検索結果の検索条件も、画面上部の「詳細検索」で開くモーダルにある。モーダルを開いて見た");
    await modal.開く();
    await expect.soft(modal.欄("player"), "デッキ検索結果の検索条件のプレイヤー名").toHaveValue("F0903-031-P");
  });
});

caseTest("IT-F09-03-032", async ({ page, notes, step, expected }) => {
  const modal = new DeckSearchModal(page);
  let 選択肢: string[] = [];
  await step(1, async () => { await 開く(page, notes.get("〔フォーマット識別子-F0903-032A〕")); });
  await step(2, async () => {
    note(入力欄の注記);
    await modal.開く();
    await modal.フォーマットの選択肢のラベル(N("032", "F")).scrollIntoViewIfNeeded().catch(() => undefined);
    選択肢 = await modal.フォーマットの選択肢();
  });
  await expected(async () => {
    expect.soft(選択肢, `フォーマットの選択肢に ${前印("032", "F")} がある`).toContain(N("032", "F"));
    expect.soft(選択肢, `フォーマットの選択肢に ${前印("032", "X")} が無い`).not.toContain(N("032", "X"));
  });
});
