/**
 * F09-02 デッキ検索結果（フロント）。正本: cases/F09-02_test_cases.tsv
 *
 * 2026-11-11 追加: 既存デッキの全件削除をせず、手順2の「クリア」のあとで検索条件にこのケースのフォーマットを足して、
 * 一覧に並ぶのがこのシードのデッキだけになるようにして確かめるケースを足した（一覧に載るデッキ・ページ送り・行の表示）。
 * 以下は最初の14件の説明:
 *
 * 実装したのは、検索条件がこのケースのフォーマット・アーキタイプ・デッキタグ・プレイヤー名だけに当たるケースと、
 * 期待結果がほかのデッキの有無に関わらないケース（表示件数の選択肢・HTTP ステータス）。シード表の「既存デッキの全件削除」は
 * 行わない（PM 方針）ので、判定は条件付き。条件を入れずに全件を見るケース・総件数やページ数を見るケースは書いていない。
 */
import { Page, Response, test } from "@playwright/test";
import { プレイヤー名のデッキの更新日時 } from "../../db/f09_01";
import { 日付, 表示日付 } from "../../pages/admin/f09_01_setup";
import { caseTest, CaseBody, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { DeckSearchModal, DeckTopPage } from "../../pages/front/f09_01_deck_top";
import { DeckResultPage, 結果の応答 } from "../../pages/front/f09_02_deck_result";
import { expectSaved } from "../../pages/admin/common";
import { デッキの編集画面を開く, プレイヤー名で検索する } from "../../pages/admin/f09_02_setup";
import { デッキ編集画面 } from "../../pages/admin/m15_05_deck_edit";
import { F0902_ADMIN, N } from "../../seeds/f09-02";
import "../../seeds/f09-02";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 削除しない注記 = "シード表の既存デッキの全件削除は行っていない（PM 方針）。ほかのデッキが残る状態で、このケースの名前で絞った結果を見た（判定は条件付き）";
const クリアの注記 = "「クリア」と検索条件の入力欄は、画面上部の「詳細検索」で開くモーダル（デッキ詳細検索）の中にある。モーダルを開いてから押した";

const フォーマット絞りの注記 = "シード表の「既存デッキの全件削除」は行わない（共有のデータは消さない）。代わりに、「クリア」のあとで検索条件に"
  + "このケースのフォーマット（実行の印つき）だけを選び、一覧に並ぶのがこのシードのデッキだけになるようにして、件数・順番・ページの区切りを確かめた（読み替え）";

/** 手順1・2: デッキ検索TOPを開き、詳細検索のモーダルを開いて「クリア」を押す */
async function 開いてクリアする(page: Page, step: (n: number, b: () => Promise<void>) => Promise<void>, 絞るケース?: string): Promise<DeckSearchModal> {
  const top = new DeckTopPage(page);
  const modal = new DeckSearchModal(page);
  await step(1, async () => { await top.開く(); });
  await step(2, async () => {
    await modal.開く();
    note(クリアの注記);
    await modal.クリアする();
    const s = await modal.入力欄の状態();
    expect(s.開催日開始, "「クリア」のあとの開催日時（開始）").toBe("");
    if (絞るケース) {
      await modal.フォーマットを選ぶ(N(絞るケース, "FMT"));
      note(フォーマット絞りの注記);
    }
  });
  return modal;
}

/** 「検索」を押し、デッキ検索結果の応答を待つ */
async function 検索する(page: Page, modal: DeckSearchModal): Promise<Response> {
  const res = 結果の応答(page);
  await modal.検索する();
  const r = await res;
  await new DeckResultPage(page).読み込みを待つ();
  return r;
}

/** 一覧に載るデッキのプレイヤー名（並べ替えて比べる） */
async function 載るデッキ(page: Page): Promise<string[]> { return [...(await new DeckResultPage(page).プレイヤー名())].sort(); }
const 名前 = (ケース: string, ps: string[]) => ps.map((p) => N(ケース, p)).sort();

// ---------------------------------------------------------------------------
// 検索条件
// ---------------------------------------------------------------------------

caseTest("IT-F09-02-005", async ({ page, step, expected }) => {
  note(削除しない注記);
  const modal = await 開いてクリアする(page, step);
  await step(3, async () => { await modal.フォーマットを選ぶ(N("005", "FMT-A")); await modal.フォーマットを選ぶ(N("005", "FMT-B")); });
  await step(4, async () => { await 検索する(page, modal); });
  await expected(async () => {
    const 載る = await 載るデッキ(page);
    expect.soft(載る, "一覧に載るデッキのプレイヤー名（PA・PB だけ）").toEqual(名前("005", ["PA", "PB"]));
    for (const p of ["PC"]) expect.soft(載る, `一覧に F0902-005-${p} が載らない`).not.toContain(N("005", p));
  });
});

caseTest("IT-F09-02-006", async ({ page, step, expected }) => {
  note(削除しない注記);
  const modal = await 開いてクリアする(page, step);
  await step(3, async () => {
    await modal.選択画面を開く();
    let tab = await modal.候補を選ぶ(N("006", "ARC-A"), N("006", "FMT"));
    tab = (await modal.候補を選ぶ(N("006", "ARC-B"), N("006", "FMT"))) || tab;
    if (tab) note("アーキタイプの選択画面で、アーキタイプのフォーマットのタブを押してから選んだ");
    await modal.選択を押す();
  });
  await step(4, async () => { await 検索する(page, modal); });
  await expected(async () => {
    const 載る = await 載るデッキ(page);
    expect.soft(載る, "一覧に載るデッキのプレイヤー名（PA・PB だけ）").toEqual(名前("006", ["PA", "PB"]));
    for (const p of ["PC"]) expect.soft(載る, `一覧に F0902-006-${p} が載らない`).not.toContain(N("006", p));
  });
});

caseTest("IT-F09-02-009", async ({ page, step, expected }) => {
  note(削除しない注記);
  const modal = await 開いてクリアする(page, step);
  await step(3, async () => { await modal.タグを選ぶ(N("009", "TAGX")); await modal.タグを選ぶ(N("009", "TAGY")); });
  await step(4, async () => { await 検索する(page, modal); });
  await expected(async () => {
    const 載る = await 載るデッキ(page);
    expect.soft(載る, "一覧に載るデッキのプレイヤー名（PA・PB だけ）").toEqual(名前("009", ["PA", "PB"]));
    for (const p of ["PC", "PD"]) expect.soft(載る, `一覧に F0902-009-${p} が載らない`).not.toContain(N("009", p));
  });
});

caseTest("IT-F09-02-010", async ({ page, step, expected }) => {
  note(削除しない注記);
  const modal = await 開いてクリアする(page, step);
  await step(3, async () => { await modal.タグを選ぶ(N("010", "TAGX")); await modal.タグを選ぶ(N("010", "TAGY")); });
  await step(4, async () => { await 検索する(page, modal); });
  await expected(async () => {
    const r = new DeckResultPage(page);
    expect.soft(await r.総件数(), "総件数の表示").toBe("2");
    await expect.soft(r.一覧の項目, "一覧の行の数").toHaveCount(2);
  });
});

caseTest("IT-F09-02-021", async ({ page, step, expected }) => {
  note(削除しない注記);
  const modal = await 開いてクリアする(page, step);
  await step(3, async () => { await modal.フォーマットを選ぶ(N("021", "FMT-A")); });
  await step(4, async () => { await modal.入れる("player", N("021", "山田")); });
  await step(5, async () => { await modal.入れる("capacityFrom", "8"); });
  await step(6, async () => { await 検索する(page, modal); });
  await expected(async () => {
    const 載る = await 載るデッキ(page);
    expect.soft(載る, "一覧に載るデッキのプレイヤー名（山田A だけ）").toEqual(名前("021", ["山田A"]));
    for (const p of ["山田B", "鈴木", "山田D"]) expect.soft(載る, `一覧に F0902-021-${p} が載らない`).not.toContain(N("021", p));
  });
});

// ---------------------------------------------------------------------------
// 表示件数
// ---------------------------------------------------------------------------

caseTest("IT-F09-02-030", async ({ page, step, expected }) => {
  note(削除しない注記.replace("このケースの名前で絞った結果を見た", "表示件数の選択肢を見た"));
  const r = new DeckResultPage(page);
  const modal = await 開いてクリアする(page, step);
  await step(3, async () => { await 検索する(page, modal); });
  await step(4, async () => {
    await r.表示件数の選択欄を開く();
    note("ブラウザの選択の一覧は画面の外に開くので、表示件数の選択欄に手を置いて、欄の選択肢を読んだ");
  });
  await expected(async () => {
    expect.soft((await r.表示件数の選択肢()).選択肢, "表示件数の選択肢").toEqual(["20件", "40件", "60件", "80件", "100件"]);
  });
});

caseTest("IT-F09-02-031", async ({ page, step, expected }) => {
  note(削除しない注記.replace("このケースの名前で絞った結果を見た", "表示件数の選択欄を見た"));
  const r = new DeckResultPage(page);
  const modal = await 開いてクリアする(page, step);
  await step(3, async () => { await 検索する(page, modal); });
  await expected(async () => {
    expect.soft((await r.表示件数の選択肢()).選択中, "表示件数の選択欄で選ばれている選択肢").toBe("20件");
  });
});

caseTest("IT-F09-02-033", async ({ page, step, expected }) => {
  note(削除しない注記);
  const r = new DeckResultPage(page);
  const modal = await 開いてクリアする(page, step);
  await step(3, async () => { await modal.フォーマットを選ぶ(N("033", "FMT-A")); });
  await step(4, async () => { await modal.入れる("player", N("033", "山田")); });
  await step(5, async () => { await modal.入れる("eventName", N("033", "TA")); });
  await step(6, async () => { await modal.タグを選ぶ(N("033", "TAGX")); });
  await step(7, async () => { await 検索する(page, modal); });
  await step(8, async () => {
    await r.表示件数を選ぶ("40");
    note(`表示件数を変えたあとのアドレス: ${decodeURIComponent(page.url())}`);
  });
  await expected(async () => {
    const 載る = await 載るデッキ(page);
    expect.soft(載る, "一覧に載るデッキのプレイヤー名（山田A・山田B だけ）").toEqual(名前("033", ["山田A", "山田B"]));
    for (const p of ["山田C", "山田D", "山田E", "鈴木"]) expect.soft(載る, `一覧に F0902-033-${p} が載らない`).not.toContain(N("033", p));
  });
});

// ---------------------------------------------------------------------------
// 該当0件・HTTP ステータス
// ---------------------------------------------------------------------------

caseTest("IT-F09-02-035", async ({ page, step, expected }) => {
  note(削除しない注記);
  let status = 0;
  const modal = await 開いてクリアする(page, step);
  await step(3, async () => { await modal.入れる("player", N("035", "NONE")); });
  await step(4, async () => { status = (await 検索する(page, modal)).status(); });
  await step(5, async () => { note(`開発者ツールのネットワークの表示の代わりに、手順4の検索結果の画面の応答を控えた（HTTP ${status}）`); });
  await expected(async () => { expect.soft(status, "検索結果画面の応答の HTTP ステータス").toBe(404); });
});

caseTest("IT-F09-02-036", async ({ page, step, expected }) => {
  note(削除しない注記);
  const r = new DeckResultPage(page);
  const modal = await 開いてクリアする(page, step);
  await step(3, async () => { await modal.入れる("player", N("036", "NONE")); });
  await step(4, async () => { await 検索する(page, modal); });
  await expected(async () => {
    await expect.soft(r.一覧の項目, "一覧の領域に並ぶデッキの行の数").toHaveCount(0);
    await expect.soft(r.該当なしの案内, "一覧の領域の該当なしの案内").toHaveCount(1);
    await expect.soft(r.該当なしの案内, "該当なしの案内の文").toHaveText(/^\s*ご指定の条件に一致するデッキが見つかりませんでした。\s*$/);
  });
});

caseTest("IT-F09-02-037", async ({ page, step, expected }) => {
  note(削除しない注記);
  const r = new DeckResultPage(page);
  const modal = await 開いてクリアする(page, step);
  await step(3, async () => { await modal.入れる("player", N("037", "NONE")); });
  await step(4, async () => { await 検索する(page, modal); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "表示された画面のアドレス（デッキ検索結果）").toBe("/ja/deck/result/");
    await expect.soft(r.見出し, "画面上部の見出し").toHaveText(/^\s*デッキ検索結果\s*$/);
    // 検索条件の入力欄は、結果の画面にも同じモーダルの形で載る
    await expect.soft(modal.欄("player"), "検索条件の入力欄（プレイヤー名）").toHaveCount(1);
    await expect.soft(modal.欄("player"), "検索条件の入力欄（プレイヤー名）に入れた値が載る").toHaveValue(N("037", "NONE"));
    await expect.soft(modal.検索ボタン, "検索条件の「検索」ボタン").toHaveCount(1);
  });
});

caseTest("IT-F09-02-038", async ({ page, step, expected }) => {
  note(削除しない注記.replace("このケースの名前で絞った結果を見た", "応答の HTTP ステータスを見た"));
  let status = 0;
  const modal = await 開いてクリアする(page, step);
  await step(3, async () => { status = (await 検索する(page, modal)).status(); });
  await step(4, async () => { note(`開発者ツールのネットワークの表示の代わりに、手順3の検索結果の画面の応答を控えた（HTTP ${status}）`); });
  await expected(async () => { expect.soft(status, "検索結果画面の応答の HTTP ステータス").toBe(200); });
});

// ---------------------------------------------------------------------------
// 管理画面での更新のあとの検索
// ---------------------------------------------------------------------------

caseTest("IT-F09-02-047", async ({ page, step, expected }) => {
  note(削除しない注記);
  const r = new DeckResultPage(page);
  const 自分の行 = async () => (await r.行()).filter((x) => x.プレイヤー === N("047", "P"));
  const top = new DeckTopPage(page);
  const modal = new DeckSearchModal(page);
  await step(1, async () => { await top.開く(); });
  await step(2, async () => { await modal.開く(); note(クリアの注記); await modal.クリアする(); });
  await step(3, async () => { await modal.入れる("player", N("047", "P")); });
  await step(4, async () => { await 検索する(page, modal); });
  await step(5, async () => {
    const rows = await 自分の行();
    expect(rows.length, "一覧の F0902-047-P のデッキの行の数").toBe(1);
    expect(rows[0].成績, "一覧の行の成績の表示（更新前）").toBe("F0902-047-OLD");
  });
  await step(6, async () => {
    await loginAdmin(page, F0902_ADMIN);
    const ids = await プレイヤー名で検索する(page, N("047", "P"));
    expect(ids.length, "管理画面のデッキ一覧で、プレイヤー名 F0902-047-P のデッキの数").toBe(1);
    const e = await デッキの編集画面を開く(page, ids[0]);
    await expect(e.成績, "開いた編集画面のデッキの成績").toHaveValue("F0902-047-OLD");
    note("デッキ一覧は成績で絞れないので、プレイヤー名で検索した1件の編集画面を開き、成績が F0902-047-OLD であることを確かめた");
  });
  await step(7, async () => {
    const e = new デッキ編集画面(page);
    await e.成績.fill("F0902-047-NEW");
    await e.送信する(e.更新ボタン);
    for (const w of await expectSaved(page, "デッキの成績の更新")) note(`更新の警告: ${w}`);
  });
  await step(8, async () => { await top.開く(); });
  await step(9, async () => { await modal.開く(); note(クリアの注記); await modal.クリアする(); });
  await step(10, async () => { await modal.入れる("player", N("047", "P")); });
  await step(11, async () => { await 検索する(page, modal); });
  await expected(async () => {
    const rows = await 自分の行();
    expect.soft(rows.length, "一覧の F0902-047-P のデッキの行の数").toBe(1);
    expect.soft(rows[0]?.成績, "一覧の行の成績の表示").toBe("F0902-047-NEW");
  });
});

// ---------------------------------------------------------------------------
// 画面の題名
// ---------------------------------------------------------------------------

caseTest("IT-F09-02-049", async ({ page, step, expected }) => {
  note(削除しない注記);
  const r = new DeckResultPage(page);
  let 題名 = "";
  const modal = await 開いてクリアする(page, step);
  await step(3, async () => { await modal.フォーマットを選ぶ(N("049", "FMT")); });
  await step(4, async () => {
    await modal.選択画面を開く();
    if (await modal.候補を選ぶ(N("049", "ARC"), N("049", "FMT"))) note("アーキタイプの選択画面で、アーキタイプのフォーマットのタブを押してから選んだ");
    await modal.選択を押す();
  });
  await step(5, async () => { await modal.入れる("card", N("049", "カードX")); });
  await step(6, async () => { await modal.入れる("player", N("049", "P")); });
  await step(7, async () => { await modal.入れる("eventName", N("049", "T")); });
  await step(8, async () => { await modal.タグを選ぶ(N("049", "TAG")); });
  await step(9, async () => {
    await 検索する(page, modal);
    題名 = await r.題名();
    note(`画面の題名は、ブラウザのタブに出る題名（文書の題名）を読んだ: 「${題名}」`);
  });
  await expected(async () => {
    // 大会名「…-T」はタグ名「…-TAG」の前半と同じ文字なので、文字の有無ではなく、題名の「/」で区切った語として確かめる
    const 語の並び = 題名.split("のデッキ検索一覧")[0].split("/").map((x) => x.trim());
    for (const [語, 名] of [["フォーマット名", "FMT"], ["アーキタイプ名", "ARC"], ["カード名", "カードX"], ["プレイヤー名", "P"], ["大会名", "T"], ["タグ名", "TAG"]] as const) {
      expect.soft(語の並び, `画面の題名に${語} F0902-049-${名} が語として含まれる`).toContain(N("049", 名));
    }
    expect.soft(題名.endsWith("のデッキ検索一覧"), `画面の題名が「のデッキ検索一覧」で終わる（題名: ${題名}）`).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2026-11-11 追加: 一覧に載るデッキ・ページ送り・行の表示
// 手順2の「クリア」のあと、このケースのフォーマットを検索条件に足して、一覧に並ぶのがこのシードのデッキだけになるようにする
// ---------------------------------------------------------------------------

const 範囲 = (ケース: string, 桁: number, 始: number, 終: number) =>
  Array.from({ length: 終 - 始 + 1 }, (_, i) => N(ケース, `P${String(始 + i).padStart(桁, "0")}`));

/** 手順1 TOP・2 クリア、条件の入力（手順3〜）、最後の手順 検索 の形で、一覧に載る・載らないデッキを確かめる */
function 一覧に載るデッキ(ケース: string, 条件: ((m: DeckSearchModal) => Promise<void>)[], 載る: string[], 載らない: string[], 注記?: string): CaseBody {
  return async ({ page, step, expected }) => {
    if (注記) note(注記);
    const modal = await 開いてクリアする(page, step, ケース);
    for (const [i, 入れる] of 条件.entries()) await step(3 + i, async () => { await 入れる(modal); });
    await step(3 + 条件.length, async () => { await 検索する(page, modal); });
    await expected(async () => {
      const 並ぶ = await 載るデッキ(page);
      expect.soft(並ぶ, `一覧に載るデッキのプレイヤー名（${載る.join("・")} だけ）`).toEqual(名前(ケース, 載る));
      for (const p of 載らない) expect.soft(並ぶ, `一覧に ${N(ケース, p)} が載らない`).not.toContain(N(ケース, p));
    });
  };
}

caseTest("IT-F09-02-001", 一覧に載るデッキ("001", [], ["PA"], ["PB"]));
caseTest("IT-F09-02-002", 一覧に載るデッキ("002", [], ["PA"], ["PB"]));
caseTest("IT-F09-02-003", 一覧に載るデッキ("003", [], ["PA"], ["PB"], "シード表の「アーキタイプ未設定」のデッキは、画面ではアーキタイプが必須で作れないので、DBで印つきのデッキのアーキタイプを未設定にして作った"));
caseTest("IT-F09-02-004", 一覧に載るデッキ("004", [], ["PA"], ["PB"], "開催日は日本時間の実行日から数えた（大会Aは当日 23:59:59、大会Bは翌日 00:00:00。秒まで入るので、デッキ登録CSVアップロードで登録した）。実行日の当日中に実行する前提"));
caseTest("IT-F09-02-007", 一覧に載るデッキ("007",
  [(m) => m.入れる("dateFrom", "2025/05/10"), (m) => m.入れる("dateTo", "2025/05/20")], ["PB", "PC"], ["PA", "PD"],
  "開催日の秒まで（23:59:59・00:00:00）は、デッキ登録CSVアップロードで登録した。開催日時の入力欄には日付（Y/m/d）を入れた"));
caseTest("IT-F09-02-008", 一覧に載るデッキ("008",
  [(m) => m.入れる("capacityFrom", "8"), (m) => m.入れる("capacityTo", "16")], ["PB", "PC"], ["PA", "PD"]));
caseTest("IT-F09-02-017", 一覧に載るデッキ("017", [(m) => m.選ぶ("優勝デッキのみ")], ["P1"], ["P2", "P8", "P9"]));
caseTest("IT-F09-02-018", 一覧に載るデッキ("018", [(m) => m.選ぶ("TOP8以上のみ")], ["P1", "P8"], ["P9"]));
caseTest("IT-F09-02-019", 一覧に載るデッキ("019", [(m) => m.選ぶ("公開リストのみ")], ["PA"], ["PB"]));
caseTest("IT-F09-02-020", 一覧に載るデッキ("020", [(m) => m.選ぶ("非公開リストを含む")], ["PA", "PB"], []));

// ---- ページ送り ----

const 結果 = (page: Page) => new DeckResultPage(page);
const 並びの名前 = async (page: Page) => [...(await 結果(page).プレイヤー名())];
const ページ3のアドレス = (page: Page) => { const u = new URL(page.url()); u.searchParams.set("page", "3"); return u.toString(); };
const 応答の注記 = (n: number, status: number) => note(`開発者ツールのネットワークの表示の代わりに、手順${n}の検索結果の画面の応答を控えた（HTTP ${status}）`);

caseTest("IT-F09-02-025", async ({ page, step, expected }) => {
  let 一ページ目: string[] = [];
  let 二ページ目: string[] = [];
  const modal = await 開いてクリアする(page, step, "025");
  await step(3, async () => { await 検索する(page, modal); });
  await step(4, async () => { 一ページ目 = await 並びの名前(page); });
  await step(5, async () => { await 結果(page).ページ番号を押す(2); });
  await step(6, async () => { 二ページ目 = await 並びの名前(page); });
  await expected(async () => {
    expect.soft(一ページ目.length, "1ページ目に並ぶ件数").toBe(20);
    expect.soft(二ページ目.length, "2ページ目に並ぶ件数").toBe(5);
    expect.soft([...一ページ目, ...二ページ目].sort(), "控えた25件のプレイヤー名（重複も欠落も無い）").toEqual(範囲("025", 2, 1, 25).sort());
  });
});

caseTest("IT-F09-02-026", async ({ page, step, expected }) => {
  const modal = await 開いてクリアする(page, step, "026");
  await step(3, async () => { await 検索する(page, modal); });
  await expected(async () => {
    const 並ぶ = await 並びの名前(page);
    expect.soft([...並ぶ].sort(), "一覧に載るデッキ（順位1位〜20位の20件）").toEqual(範囲("026", 2, 1, 20).sort());
    expect.soft(並ぶ, `一覧に ${N("026", "P21")} が載らない`).not.toContain(N("026", "P21"));
  });
});

caseTest("IT-F09-02-027", async ({ page, step, expected }) => {
  const modal = await 開いてクリアする(page, step, "027");
  await step(3, async () => { await 検索する(page, modal); });
  await step(4, async () => { await 結果(page).ページ番号を押す(2); });
  await expected(async () => {
    expect.soft(await 並びの名前(page), "2ページ目に載るデッキ（順位21位の1件だけ）").toEqual([N("027", "P21")]);
  });
});

caseTest("IT-F09-02-028", async ({ page, step, expected }) => {
  const modal = await 開いてクリアする(page, step, "028");
  await step(3, async () => { await 検索する(page, modal); });
  await expected(async () => {
    const 表示 = await 結果(page).ページ送りの表示();
    expect.soft(表示.並び, "ページ送りに並ぶページ番号（1と2だけ）").toEqual(["1", "2"]);
  });
});

caseTest("IT-F09-02-032", async ({ page, step, expected }) => {
  const modal = await 開いてクリアする(page, step, "032");
  await step(3, async () => { await 検索する(page, modal); });
  await step(4, async () => { await 結果(page).ページ番号を押す(2); });
  await step(5, async () => { await 結果(page).表示件数を選ぶ("40"); note(`表示件数を変えたあとのアドレス: ${decodeURIComponent(page.url())}`); });
  await expected(async () => {
    const 並ぶ = await 並びの名前(page);
    expect.soft([...並ぶ].sort(), "1ページ目に載るデッキ（順位1位〜40位の40件）").toEqual(範囲("032", 2, 1, 40).sort());
    expect.soft(並ぶ, `一覧に ${N("032", "P41")} が載らない`).not.toContain(N("032", "P41"));
  });
});

caseTest("IT-F09-02-034", async ({ page, step, expected }) => {
  const modal = await 開いてクリアする(page, step, "034");
  await step(3, async () => { await 検索する(page, modal); });
  await step(4, async () => { await 結果(page).表示件数を選ぶ("40"); note(`表示件数を変えたあとのアドレス: ${decodeURIComponent(page.url())}`); });
  await expected(async () => {
    const 並ぶ = await 載るデッキ(page);
    expect.soft(並ぶ, "表示件数を変えた後の一覧に載るデッキ（PA の1件だけ）").toEqual(名前("034", ["PA"]));
    expect.soft(並ぶ, `6か月より前の大会Bの ${N("034", "PB")} が載らない`).not.toContain(N("034", "PB"));
  });
});

caseTest("IT-F09-02-060", async ({ page, step, expected }) => {
  const 開始 = 表示日付(日付(-500));
  const modal = await 開いてクリアする(page, step, "060");
  await step(3, async () => { await modal.入れる("dateFrom", 開始); note(`開催日時の開始に、日本時間の実行日の500日前（${開始}）を入れた`); });
  await step(4, async () => { await 検索する(page, modal); });
  await step(5, async () => { await 結果(page).表示件数を選ぶ("40"); note(`表示件数を変えたあとのアドレス: ${decodeURIComponent(page.url())}`); });
  await expected(async () => {
    const 並ぶ = await 載るデッキ(page);
    expect.soft(並ぶ, "表示件数を変えた後の一覧に載るデッキ（PA と PB の2件だけ）").toEqual(名前("060", ["PA", "PB"]));
    expect.soft(並ぶ, `指定した開始日より前の大会Cの ${N("060", "PC")} が載らない`).not.toContain(N("060", "PC"));
  });
});

caseTest("IT-F09-02-058", async ({ page, step, expected }) => {
  let status = 0;
  const modal = await 開いてクリアする(page, step, "058");
  await step(3, async () => { await 検索する(page, modal); });
  await step(4, async () => { status = (await page.goto(ページ3のアドレス(page), { waitUntil: "load" }))?.status() ?? 0; });
  await step(5, async () => { 応答の注記(4, status); });
  await expected(async () => { expect.soft(status, "手順4の応答の HTTP ステータス").toBe(200); });
});

caseTest("IT-F09-02-059", async ({ page, step, expected }) => {
  const modal = await 開いてクリアする(page, step, "059");
  await step(3, async () => { await 検索する(page, modal); });
  await step(4, async () => { await page.goto(ページ3のアドレス(page), { waitUntil: "load" }); await 結果(page).読み込みを待つ(); });
  await expected(async () => {
    const r = 結果(page);
    await expect.soft(r.一覧の項目, "一覧の領域に並ぶデッキの行の数").toHaveCount(0);
    await expect.soft(r.該当なしの案内, "一覧の領域の該当なしの案内").toHaveText(/^\s*ご指定の条件に一致するデッキが見つかりませんでした。\s*$/);
  });
});

caseTest("IT-F09-02-061", async ({ page, step, expected }) => {
  let status = 0;
  const modal = await 開いてクリアする(page, step, "CB061");
  await step(3, async () => { await 検索する(page, modal); });
  await step(4, async () => { status = (await 結果(page).ページ番号を押す(2)).status(); });
  await step(5, async () => { 応答の注記(4, status); });
  await expected(async () => {
    expect.soft(status, "手順4の応答の HTTP ステータス").toBe(200);
    const 並ぶ = await 並びの名前(page);
    expect.soft([...並ぶ].sort(), "一覧に載るデッキ（順位21位〜40位の20件）").toEqual(範囲("CB061", 2, 21, 40).sort());
    for (const p of ["P20", "P41"]) expect.soft(並ぶ, `一覧に ${N("CB061", p)} が載らない`).not.toContain(N("CB061", p));
  });
});

caseTest("IT-F09-02-062", async ({ page, step, expected }) => {
  let status = 0;
  const modal = await 開いてクリアする(page, step, "CB062");
  await step(3, async () => { await 検索する(page, modal); });
  await step(4, async () => { await 結果(page).表示件数を選ぶ("40"); });
  await step(5, async () => { status = (await 結果(page).ページ番号を押す(2)).status(); });
  await step(6, async () => { 応答の注記(5, status); });
  await expected(async () => {
    expect.soft(status, "手順5の応答の HTTP ステータス").toBe(200);
    const 並ぶ = await 並びの名前(page);
    expect.soft([...並ぶ].sort(), "一覧に載るデッキ（順位41位〜45位の5件）").toEqual(範囲("CB062", 2, 41, 45).sort());
    expect.soft(並ぶ, `一覧に ${N("CB062", "P40")} が載らない`).not.toContain(N("CB062", "P40"));
  });
});

caseTest("IT-F09-02-063", async ({ page, step, expected }) => {
  let status = 0;
  const modal = await 開いてクリアする(page, step, "CB063");
  await step(3, async () => { await 検索する(page, modal); });
  await step(4, async () => { await 結果(page).表示件数を選ぶ("40"); });
  await step(5, async () => { status = (await page.goto(ページ3のアドレス(page), { waitUntil: "load" }))?.status() ?? 0; await 結果(page).読み込みを待つ(); });
  await step(6, async () => { 応答の注記(5, status); });
  await expected(async () => {
    const r = 結果(page);
    expect.soft(status, "手順5の応答の HTTP ステータス").toBe(200);
    await expect.soft(r.一覧の項目, "一覧の領域に並ぶデッキの行の数").toHaveCount(0);
    await expect.soft(r.該当なしの案内, "一覧の領域の該当なしの案内").toHaveText(/^\s*ご指定の条件に一致するデッキが見つかりませんでした。\s*$/);
  });
});

// ---- 一覧の行の表示 ----

/** 手順1〜3 を踏んで、このケースのプレイヤー名の1行を返す */
async function 行を見る(page: Page, step: (n: number, b: () => Promise<void>) => Promise<void>, ケース: string, プレイヤー: string) {
  const modal = await 開いてクリアする(page, step, ケース);
  await step(3, async () => { await 検索する(page, modal); });
  const rows = (await 結果(page).行()).filter((x) => x.プレイヤー === N(ケース, プレイヤー));
  return rows;
}

caseTest("IT-F09-02-040", async ({ page, step, expected }) => {
  const rows = await 行を見る(page, step, "040", "P");
  await expected(async () => {
    expect.soft(rows.length, "一覧の行の数").toBe(1);
    expect.soft(rows[0]?.画像 ?? "", "一覧の行の画像の参照先（画像なし用の既定画像）").toContain("/noimagearche.jpg");
  });
});

caseTest("IT-F09-02-041", async ({ page, step, expected }) => {
  const rows = await 行を見る(page, step, "041", "P");
  await expected(async () => {
    expect.soft(rows.length, "一覧の行の数").toBe(1);
    expect.soft(rows[0]?.非公開の印, "一覧の行にデッキリストが非公開であることを示す印が付く").toBe(true);
  });
});

caseTest("IT-F09-02-042", async ({ page, step, expected }) => {
  const rows = await 行を見る(page, step, "042", "P");
  await expected(async () => {
    expect.soft(rows.length, "一覧の行の数").toBe(1);
    expect.soft(rows[0]?.非公開の印, "一覧の行にデッキリストが非公開であることを示す印が付かない").toBe(false);
  });
});

caseTest("IT-F09-02-043", async ({ page, step, expected }) => {
  const rows = await 行を見る(page, step, "043", "P");
  await expected(async () => {
    expect.soft(rows.length, "一覧の行の数").toBe(1);
    expect.soft([...(rows[0]?.タグ ?? [])].sort(), "一覧の行のデッキタグ").toEqual(名前("043", ["TAGX", "TAGY", "TAGZ"]));
  });
});

caseTest("IT-F09-02-044", async ({ page, step, expected }) => {
  const rows = await 行を見る(page, step, "044", "P");
  await expected(async () => {
    expect.soft(rows.length, "一覧の行の数").toBe(1);
    const r = rows[0];
    expect.soft(r?.プレイヤー, "一覧の行のプレイヤー").toBe(N("044", "P"));
    expect.soft(r?.大会名, "一覧の行の大会名（日本語名）").toBe(N("044", "TJ"));
    expect.soft(r?.成績, "一覧の行の成績").toBe(N("044", "R"));
    expect.soft(r?.参加人数, "一覧の行の参加人数").toBe("32");
  });
});

caseTest("IT-F09-02-046", async ({ page, step, expected }) => {
  const 名 = ["P1", "P2", "P3"].map((p) => N("046", p));
  let 前 = { 件数: [] as number[], 更新日時: [] as string[] };
  let 後 = { 件数: [] as number[], 更新日時: [] as string[] };
  await step(1, async () => {
    前 = プレイヤー名のデッキの更新日時(名);
    note("DBの確認は参照だけ。更新日時は日本時間の「yyyy/mm/dd hh:mm:ss」で読んだ。シードでDBに設定した更新日時（2025/01/05 10:00:00）と比べる");
  });
  const top = new DeckTopPage(page);
  const modal = new DeckSearchModal(page);
  await step(2, async () => { await top.開く(); });
  await step(3, async () => { await modal.開く(); note(クリアの注記); await modal.クリアする(); });
  await step(4, async () => { await 検索する(page, modal); });
  await step(5, async () => { 後 = プレイヤー名のデッキの更新日時(名); });
  await expected(async () => {
    expect.soft(前.更新日時, "検索の前の3件の更新日時（準備の確認）").toEqual(Array(3).fill("2025/01/05 10:00:00"));
    expect.soft(後.件数, "プレイヤー名P1・P2・P3のデッキの件数（それぞれ1件で計3件）").toEqual([1, 1, 1]);
    expect.soft(後.更新日時, "検索のあとの3件の更新日時").toEqual(Array(3).fill("2025/01/05 10:00:00"));
  });
});
