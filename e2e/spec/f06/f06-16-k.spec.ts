// 取り込み注記: 同じ機能を main 側（別の方）も実装していたため、栗野側の版を別ファイルにした。main に無いケースだけを残している（main にあるケースは main を優先して除いた）。
/**
 * F06-16 大会デッキ登録編集（フロント・マイページ）。正本: cases/F06-16_test_cases.tsv
 * 振り分けと解釈は review/F06-16_progress_2026-11-09.md。
 *
 * - フォーマット名（Standard など）とカード名（Island など）は、シードが実行の印を付けて作る（seeds/f06-16.ts）。
 *   手順・期待結果の同じ名前は、印つきの名前として入力し・確かめる（形式()・札()）。大会名も印つき（大会名()）。
 * - 2026-11-10 の依頼者方針で、大会デッキのカード情報・マイデッキの作成日・選手情報の紐づけは、実行の印つきのデータに限りDBで設定して実装した
 *   （001・009・015・018・026・027・030・032・034・035・037・048・049・050・051・065〜068・071。seeds/f06-16.ts 末尾・db/f06_16_write.ts）。
 * - 実装しないケース: 共有のレイアウトのブロック配置を変えるもの（054）、連携試験（063）。
 */
import { test, Page } from "@playwright/test";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { カード情報の控え, デッキのプレイヤー名, 大会デッキ一覧, デッキのカード一覧 } from "../../db/f06_16_k";
import { available } from "../../lib/db";
import { EventHistoryPage } from "../../pages/front/f06_14_event_history_k";
import { DeckEntryEditPage, マイデッキの行, 完了画面の見出し } from "../../pages/front/f06_16_deck_entry_k";
import { 会員, 大会, 大会名, 形式, 札, 店名 } from "../../seeds/f06-16-k";
import "../../seeds/f06-16"; // 取り込みで抜けた登録を戻す: main 側が作り方を登録している seeds を読み込む（二重定義ではない）

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** ケースの会員でフロントにログインする（事前準備の「〜でログインし」） */
async function ログイン(page: Page, key: string): Promise<DeckEntryEditPage> {
  const d = new DeckEntryEditPage(page);
  const m = 会員(key);
  await d.ログインする(m.メール, m.パスワード);
  return d;
}

/** 大会の大会デッキ登録編集画面を開き、表示されたことを確かめる（手順「〜の大会デッキ登録編集画面を開く」） */
async function 編集画面を開く(d: DeckEntryEditPage, key: string): Promise<void> {
  const status = await d.開く(大会(key).イベント詳細ID);
  expect(status, "大会デッキ登録編集画面の応答").toBe(200);
  expect(await d.編集画面である(), "大会デッキ登録編集画面が表示される").toBe(true);
}

/** 手順「Standardを選択する」など。フォーマット選択エリアが無いとき（選べるフォーマットが1つ以下）は選べないので注記に残す */
async function フォーマットを選ぶ(d: DeckEntryEditPage, k: Parameters<typeof 形式>[0]): Promise<void> {
  if (await d.フォーマット選択エリア.isVisible()) { await d.フォーマットを選ぶ(形式(k)); return; }
  note(`フォーマット選択エリアが表示されていないため、「${k}」を選ぶ操作ができなかった（画面はイベントのフォーマットのうち選べるものが1つ以下のとき選択エリアを出さない）`);
}

const 日時をそろえる = (s: string) => s.replace(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/, (_, y, m, d) => `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`).trim();

async function マイデッキをポップアップのフォーマットで取り込む(ctx: CaseCtx, key: string, ポップアップの形式: Parameters<typeof 形式>[0], デッキ名: string): Promise<{ d: DeckEntryEditPage; 選択中: () => Promise<string | null> }> {
  const { page, step } = ctx;
  const d = await ログイン(page, key);
  await step(1, async () => { await 編集画面を開く(d, key); await フォーマットを選ぶ(d, "Standard"); });
  await step(2, async () => { await d.マイデッキ画面を開く(); });
  await step(3, async () => { await d.ポップアップでフォーマットを選ぶ(形式(ポップアップの形式)); await d.マイデッキを選ぶ(デッキ名); });
  return { d, 選択中: () => d.選択中のフォーマット() };
}

// ---------------------------------------------------------------------------
// 提出
// ---------------------------------------------------------------------------

/** 手順「Standardを選択する／メインボードに〜／（サイドボードに〜）／提出する」の型。手順の番号は1から */
async function 提出の手順(ctx: CaseCtx, key: string, v: { メイン: string; サイド?: string }): Promise<DeckEntryEditPage> {
  const d = await ログイン(ctx.page, key);
  let n = 1;
  await ctx.step(n++, async () => { await 編集画面を開く(d, key); });
  await ctx.step(n++, async () => { await フォーマットを選ぶ(d, "Standard"); });
  await ctx.step(n++, async () => { await d.メインボード.fill(v.メイン); });
  if (v.サイド !== undefined) await ctx.step(n++, async () => { await d.サイドボード.fill(v.サイド!); });
  await ctx.step(n++, async () => {
    const r = await d.提出する();
    if (!r.sent) note("「デッキリストを提出する」を押しても送信されなかった");
    note(`提出のあとの画面: ${d.path}`);
  });
  return d;
}

const 選手 = (key: string) => 会員(key).選手ID;
const 詳細 = (key: string) => 大会(key).イベント詳細ID;

function プレイヤー名の確かめ(key: string, 名: string): (ctx: CaseCtx) => Promise<void> {
  return async (ctx) => {
    await 提出の手順(ctx, key, { メイン: `4 ${札("Island")}` });
    let decks: ReturnType<typeof 大会デッキ一覧> = [];
    await ctx.step(5, async () => { void ctx.db; decks = 大会デッキ一覧(詳細(key), 選手(key), ctx.notes.get("〔フォーマットID-F0616-共有A〕")); });
    await ctx.expected(async () => {
      expect.soft(decks.length, "登録されたデッキの件数").toBe(1);
      expect.soft(decks[0]?.プレイヤー名 ?? null, "プレイヤー名").toBe(名);
    });
  };
}

function 表示されない(key: string): (ctx: CaseCtx) => Promise<void> {
  return async ({ page, step, expected }) => {
    const d = await ログイン(page, key);
    await step(1, async () => { const status = await d.開く(大会(key).イベント詳細ID); note(`応答 ${status}・画面のアドレス ${d.path}`); });
    await expected(async () => { expect.soft(await d.編集画面である(), "大会デッキ登録編集画面が表示されるか").toBe(false); });
  };
}

// ---------------------------------------------------------------------------
// 既存の大会デッキがあるケース（カード情報の更新・非更新）・マイデッキの一覧・フォーマットの切替
// ---------------------------------------------------------------------------

caseTest("IT-F06-16-001", async ({ page, step, expected }) => {
  const d = await ログイン(page, "001");
  const h = new EventHistoryPage(page);
  const 名 = 大会("001").名;
  await step(1, async () => { await h.開く(); expect(await h.履歴画面である(), "マイイベント・デッキ登録画面が表示される").toBe(true); });
  await step(2, async () => {
    const b = h.デッキのボタン(名).filter({ hasText: /^\s*デッキ編集\s*$/ });
    await expect(b, `「${名}」の「デッキ編集」ボタン`).toHaveCount(1);
    await h.押して遷移する(b);
  });
  await expected(async () => {
    expect.soft(await d.編集画面である(), "大会デッキ登録編集画面へ遷移する").toBe(true);
    expect.soft(await d.選択中のフォーマット(), "選択中のフォーマット").toBe(形式("Standard"));
    expect.soft(await d.値(d.メインボード), "Standardの登録済みメインボード").toBe("1 Old Standard Main");
    expect.soft(await d.値(d.サイドボード), "Standardの登録済みサイドボード").toBe("1 Old Standard Side");
  });
});

caseTest("IT-F06-16-009", async ({ page, step, expected }) => {
  const d = await ログイン(page, "009");
  let std = ["", ""], mod = ["", ""];
  await step(1, async () => { await 編集画面を開く(d, "009"); });
  await step(2, async () => { await フォーマットを選ぶ(d, "Standard"); });
  await step(3, async () => { std = [await d.値(d.メインボード), await d.値(d.サイドボード)]; note(`Standard: メイン「${std[0]}」・サイド「${std[1]}」`); });
  await step(4, async () => { await フォーマットを選ぶ(d, "Modern"); });
  await step(5, async () => { mod = [await d.値(d.メインボード), await d.値(d.サイドボード)]; note(`Modern: メイン「${mod[0]}」・サイド「${mod[1]}」`); });
  await expected(async () => {
    expect.soft(std, "Standardのメインボード・サイドボード").toEqual(["1 Old Standard Main", "1 Old Standard Side"]);
    expect.soft(mod, "Modernのメインボード・サイドボード（切り替わる）").toEqual(["2 Old Modern Main", "1 Old Modern Side"]);
  });
});

caseTest("IT-F06-16-015", async ({ page, step, expected, notes }) => {
  const d = await ログイン(page, "015A");
  let 行: マイデッキの行[] = [];
  await step(1, async () => { await 編集画面を開く(d, "015"); });
  await step(2, async () => { await d.マイデッキ画面を開く(); });
  await step(3, async () => {
    行 = await d.見えているマイデッキ();
    note(`見えているマイデッキ: ${行.map((r) => `${r.デッキ名}（${r.フォーマット}・${r.プレイヤー}・作成日 ${r.作成日}・更新日 ${r.更新日}）`).join(" / ") || "（なし）"}`);
  });
  await expected(async () => {
    const ids = ["A", "B", "C"].map((x) => notes.get(`〔マイデッキID-F0616-015${x}〕`));
    expect.soft(行.map((r) => r.デッキ名), "本人の3件だけが作成日の降順で表示される").toEqual(["Own New", "Own Modern", "Own Old"]);
    expect.soft(行.map((r) => r.デッキID), "表示されたデッキのID（本人所有の3件。他会員の Other Deck は出ない）").toEqual(ids);
    expect.soft(行.map((r) => r.フォーマット), "フォーマット").toEqual([形式("Standard"), 形式("Modern"), 形式("Standard")]);
    expect.soft(行.map((r) => r.作成日), "作成日（日本時間）").toEqual(["2026/8/3", "2026/8/2", "2026/8/1"]);
    expect.soft(行.map((r) => r.更新日), "最終更新日（日本時間）").toEqual(["2026/8/3", "2026/8/2", "2026/8/1"]);
    // ユーザー名: シード表に値が無い（登録したデッキに保存されるプレイヤー名）。3件とも同じ持ち主の名前で、空でないこと。DBが読めるときは保存されている値と一致すること
    const 名 = 行.map((r) => r.プレイヤー);
    expect.soft(new Set(名).size, "ユーザー名は3件とも同じ（同じ持ち主）").toBe(1);
    expect.soft(名[0] ?? "", "ユーザー名が空でない").not.toBe("");
    if (available) expect.soft(名, "ユーザー名（デッキに保存されているプレイヤー名）").toEqual(ids.map((id) => デッキのプレイヤー名(id) ?? ""));
  });
});

caseTest("IT-F06-16-018", async ({ page, step, expected }) => {
  const d = await ログイン(page, "018");
  let 選: string | null = null, main: string[] = [], side = "", stdMain = "", stdSide = "";
  await step(1, async () => { await 編集画面を開く(d, "018"); await フォーマットを選ぶ(d, "Standard"); });
  await step(2, async () => { await d.マイデッキ画面を開く(); });
  await step(3, async () => { await d.マイデッキを選ぶ("Own Modern"); });
  await step(4, async () => { 選 = await d.選択中のフォーマット(); main = await d.行(d.メインボード); side = await d.値(d.サイドボード); note(`Modern: メイン「${main.join(" / ")}」・サイド「${side}」`); });
  await step(5, async () => { await フォーマットを選ぶ(d, "Standard"); stdMain = await d.値(d.メインボード); stdSide = await d.値(d.サイドボード); note(`Standard: メイン「${stdMain}」・サイド「${stdSide}」`); });
  await expected(async () => {
    expect.soft(選, "選択フォーマット").toBe(形式("Modern"));
    expect.soft(main, "Modernのメインボード（Own Modern の内容に上書き）").toEqual([`3 ${札("Alpha Strike")}`]);
    expect.soft(side, "Modernのサイドボード（Own Modern の内容に上書き）").toBe(`2 ${札("Negate")}`);
    expect.soft(stdMain, "Standardのメインボード（登録済みの値のまま）").toBe("1 Old Standard Main");
    expect.soft(stdSide, "Standardのサイドボード（登録済みの値のまま）").toBe("1 Old Standard Side");
  });
});

/** 大会デッキ（日程・選手・フォーマット）の控え: 内容テキストとカード情報（番号つき） */
type 控え = { id: string; メイン: string; サイド: string; カード: string[] };
function 控えを取る(key: string, デッキID: string, フォーマットの呼び名: string, notes: CaseCtx["notes"]): 控え {
  const x = 大会デッキ一覧(詳細(key), 選手(key), notes.get(フォーマットの呼び名)).find((r) => r.デッキID === デッキID);
  if (!x) throw new Error(`大会デッキ ${デッキID} が、日程 ${詳細(key)}・選手 ${選手(key)} のデッキに無い`);
  return { id: デッキID, メイン: x.内容メイン, サイド: x.内容サイド, カード: カード情報の控え(デッキID) };
}
/** カード情報の控えから、番号を除いた「ボード:カード名:枚数」（並べ替え済み） */
const 番号を除く = (a: string[]) => a.map((x) => x.split(":").slice(1).join(":")).sort();
const 標準の呼び名 = "〔フォーマットID-F0616-共有A〕", 現代の呼び名 = "〔フォーマットID-F0616-共有B〕";

caseTest("IT-F06-16-026", async (ctx) => {
  const { step, expected, notes } = ctx;
  const d = await ログイン(ctx.page, "026");
  void ctx.db;
  const 旧A = 控えを取る("026", notes.get("〔大会デッキID-F0616-026A〕"), 標準の呼び名, notes);
  const 旧B = 控えを取る("026", notes.get("〔大会デッキID-F0616-026B〕"), 現代の呼び名, notes);
  expect(旧A.カード.length, "シードが足した Standard の旧カード情報の件数").toBeGreaterThan(0);
  let 全: ReturnType<typeof 大会デッキ一覧> = [], 新A: 控え | null = null, 新B: 控え | null = null;
  await step(1, async () => { await 編集画面を開く(d, "026"); });
  await step(2, async () => { await フォーマットを選ぶ(d, "Standard"); });
  await step(3, async () => { await d.メインボード.fill(`4 ${札("Island")}`); await d.サイドボード.fill(`2 ${札("Negate")}`); });
  await step(4, async () => { const r = await d.提出する(); if (!r.sent) note("「デッキリストを提出する」を押しても送信されなかった"); note(`提出のあとの画面: ${d.path}`); });
  await step(5, async () => {
    全 = 大会デッキ一覧(詳細("026"), 選手("026"));
    新A = 控えを取る("026", 旧A.id, 標準の呼び名, notes);
    新B = 控えを取る("026", 旧B.id, 現代の呼び名, notes);
  });
  await expected(async () => {
    expect.soft(全.map((x) => x.デッキID).sort(), "同じイベント・選手情報のデッキ（Standard と Modern の2件のまま。新しいデッキは増えない）").toEqual([旧A.id, 旧B.id].sort());
    expect.soft(新A?.メイン ?? null, "Standardの内容テキスト（メイン）が更新される").toBe(`4 ${札("Island")}`);
    expect.soft(新A?.サイド ?? null, "Standardの内容テキスト（サイド）が更新される").toBe(`2 ${札("Negate")}`);
    expect.soft(番号を除く(新A?.カード ?? []), "Standardのカード情報（IslandとNegateが再登録される）").toEqual([`1:${札("Island")}:4`, `2:${札("Negate")}:2`].sort());
    expect.soft((新A?.カード ?? []).filter((c) => 旧A.カード.includes(c)), "Standardの旧カード情報（削除される）").toEqual([]);
    expect.soft(新B, "Modernのデッキ（内容テキスト・カード情報とも更新されない）").toEqual(旧B);
  });
});

caseTest("IT-F06-16-027", async (ctx) => {
  const { step, expected, notes } = ctx;
  const d = await ログイン(ctx.page, "027");
  void ctx.db;
  const 旧A = 控えを取る("027", notes.get("〔大会デッキID-F0616-027〕"), 標準の呼び名, notes);
  expect(大会デッキ一覧(詳細("027"), 選手("027"), notes.get(現代の呼び名)).length, "事前: このイベント・選手の Modern の大会デッキ").toBe(0);
  let 全: ReturnType<typeof 大会デッキ一覧> = [], 新A: 控え | null = null, modern: ReturnType<typeof 大会デッキ一覧> = [], mc: string[] = [];
  await step(1, async () => { await 編集画面を開く(d, "027"); });
  await step(2, async () => { await フォーマットを選ぶ(d, "Modern"); });
  await step(3, async () => { await d.メインボード.fill(`3 ${札("Alpha Strike")}`); });
  await step(4, async () => { const r = await d.提出する(); if (!r.sent) note("「デッキリストを提出する」を押しても送信されなかった"); note(`提出のあとの画面: ${d.path}`); });
  await step(5, async () => {
    全 = 大会デッキ一覧(詳細("027"), 選手("027"));
    新A = 控えを取る("027", 旧A.id, 標準の呼び名, notes);
    modern = 大会デッキ一覧(詳細("027"), 選手("027"), notes.get(現代の呼び名));
    mc = modern[0] ? カード情報の控え(modern[0].デッキID) : [];
  });
  await expected(async () => {
    expect.soft(全.length, "同じイベント・選手情報のデッキの件数（フォーマット別に2件）").toBe(2);
    expect.soft(新A, "Standardの既存デッキ（そのまま残る）").toEqual(旧A);
    expect.soft(modern.length, "Modernのデッキの件数（新規登録）").toBe(1);
    expect.soft(modern[0]?.デッキID ?? null, "Modernのデッキは Standard とは別のデッキ").not.toBe(旧A.id);
    expect.soft(modern[0]?.内容メイン ?? null, "Modernの内容テキスト（メイン）").toBe(`3 ${札("Alpha Strike")}`);
    expect.soft(番号を除く(mc), "Modernのカード情報").toEqual([`1:${札("Alpha Strike")}:3`]);
  });
});

/** 入力の差し戻し: 送信後も入力画面に留まり、入力した値が保持される */
function 差し戻される(key: string, メイン: string, サイド: string): (ctx: CaseCtx) => Promise<void> {
  return async ({ page, step, expected }) => {
    const d = await ログイン(page, key);
    await step(1, async () => { await 編集画面を開く(d, key); await フォーマットを選ぶ(d, "Standard"); });
    await step(2, async () => { await d.メインボード.fill(メイン); });
    await step(3, async () => { await d.サイドボード.fill(サイド); });
    await step(4, async () => { const r = await d.提出する(); note(`提出のあとの画面: ${d.path}${r.sent ? "" : "（送信されなかった）"}`); });
    await expected(async () => {
      expect.soft(d.完了画面のデッキID(), "デッキ登録完了画面へ移っていない（デッキID）").toBeNull();
      expect.soft((await d.入力フォーム.count()) > 0 && (await d.提出ボタン.count()) > 0, "大会デッキ登録編集画面に留まる（入力フォームと提出ボタンがある）").toBe(true);
      expect.soft(await d.値(d.メインボード), "メインボードの入力が保持される").toBe(メイン);
      expect.soft(await d.値(d.サイドボード), "サイドボードの入力が保持される").toBe(サイド);
    });
  };
}
caseTest("IT-F06-16-030", 差し戻される("030", `４ ${札("Island")}`, `1 ${札("Negate")}`));
caseTest("IT-F06-16-032", 差し戻される("032", `4 ${札("Island")}`, `1　${札("Negate")}`));

/** 提出しても既存のデッキが更新されないこと（開発者ツールでの書き換え）。手順は 1 開く＋Standard／2 入力／3 書き換え／4 提出／5 DB確認 */
function 更新されない(key: string, 書き換え: (d: DeckEntryEditPage) => Promise<void>): (ctx: CaseCtx) => Promise<void> {
  return async (ctx) => {
    const { step, expected, notes } = ctx;
    const d = await ログイン(ctx.page, key);
    void ctx.db;
    const 旧 = 控えを取る(key, notes.get(`〔大会デッキID-F0616-${key}〕`), 標準の呼び名, notes);
    expect(旧.カード.length, "シードが足した旧カード情報の件数").toBeGreaterThan(0);
    let 新: 控え | null = null, 件数 = 0;
    await step(1, async () => { await 編集画面を開く(d, key); await フォーマットを選ぶ(d, "Standard"); });
    await step(2, async () => { await d.メインボード.fill(`4 ${札("Island")}`); });
    await step(3, async () => { await 書き換え(d); });
    await step(4, async () => { const r = await d.提出する(); note(`提出のあとの画面: ${d.path}${r.sent ? "" : "（送信されなかった）"}`); });
    await step(5, async () => {
      件数 = 大会デッキ一覧(詳細(key), 選手(key), notes.get(標準の呼び名)).length;
      新 = 控えを取る(key, 旧.id, 標準の呼び名, notes);
    });
    await expected(async () => {
      expect.soft(件数, "Standardのデッキの件数").toBe(1);
      expect.soft(新?.メイン ?? null, "Standardの内容テキスト（メイン）が保存前の値のまま").toBe(旧.メイン);
      expect.soft(新?.サイド ?? null, "Standardの内容テキスト（サイド）が保存前の値のまま").toBe(旧.サイド);
      expect.soft(新?.カード ?? null, "Standardのカード情報（番号・枚数とも保存前のまま）").toEqual(旧.カード);
    });
  };
}
caseTest("IT-F06-16-034", 更新されない("034", async (d) => { const n = await d.トークンを削除する(); note(`なりすまし対策トークンの入力要素を ${n} 個取り除いた`); expect(n, "取り除いた入力要素の数").toBeGreaterThan(0); }));
caseTest("IT-F06-16-035", 更新されない("035", async (d) => { await d.トークンを書き換える("invalid-token"); }));

caseTest("IT-F06-16-050", async ({ page, step, expected }) => {
  const d = await ログイン(page, "050");
  await step(1, async () => { await 編集画面を開く(d, "050"); await フォーマットを選ぶ(d, "Standard"); });
  await step(2, async () => { await d.メインボード.fill(`4 ${札("Island")}`); });
  await step(3, async () => { await d.押して遷移する(d.キャンセル); });
  await expected(async () => { expect.soft(d.path, "遷移した画面（マイイベント・デッキ登録のイベント一覧）").toMatch(/\/mypage\/event_history$/); });
});

caseTest("IT-F06-16-051", async (ctx) => {
  const { step, expected, notes } = ctx;
  const d = await ログイン(ctx.page, "051");
  void ctx.db;
  const 旧 = 控えを取る("051", notes.get("〔大会デッキID-F0616-051〕"), 標準の呼び名, notes);
  expect(旧.カード.length, "シードが足した旧カード情報の件数").toBeGreaterThan(0);
  let 新: 控え | null = null, 件数 = 0;
  await step(1, async () => { await 編集画面を開く(d, "051"); await フォーマットを選ぶ(d, "Standard"); });
  await step(2, async () => { await d.メインボード.fill(`4 ${札("Island")}`); });
  await step(3, async () => { await d.押して遷移する(d.キャンセル); note(`キャンセルのあとの画面: ${d.path}`); });
  await step(4, async () => {
    件数 = 大会デッキ一覧(詳細("051"), 選手("051"), notes.get(標準の呼び名)).length;
    新 = 控えを取る("051", 旧.id, 標準の呼び名, notes);
  });
  await expected(async () => {
    expect.soft(件数, "Standardのデッキの件数").toBe(1);
    expect.soft(新?.メイン ?? null, "Standardの内容テキスト（メイン）が保存前の値のまま").toBe(旧.メイン);
    expect.soft(新?.サイド ?? null, "Standardの内容テキスト（サイド）が保存前の値のまま").toBe(旧.サイド);
    expect.soft(新?.カード ?? null, "Standardのカード情報が保存前のまま").toEqual(旧.カード);
  });
});

caseTest("IT-F06-16-037", 表示されない("037"));

// ---- メールが送れない状態（開発環境にはメールの受け口が無い） ----

caseTest("IT-F06-16-048", async (ctx) => {
  await 提出の手順(ctx, "048", { メイン: `4 ${札("Island")}` });
  let decks: ReturnType<typeof 大会デッキ一覧> = [];
  await ctx.step(5, async () => { void ctx.db; decks = 大会デッキ一覧(詳細("048"), 選手("048"), ctx.notes.get(標準の呼び名)); });
  await ctx.expected(async () => {
    expect.soft(decks.length, "メールを送信できない状態でも登録されたStandardのデッキの件数").toBe(1);
  });
});

caseTest("IT-F06-16-049", async (ctx) => {
  const d = await 提出の手順(ctx, "049", { メイン: `4 ${札("Island")}` });
  await ctx.expected(async () => {
    expect.soft(d.path, "遷移した画面のアドレス（デッキ登録完了画面）").toMatch(/^\/ja\/deckentry\/\d+\/check$/);
    expect.soft(await 完了画面の見出し(ctx.page), "画面の見出し").toBe("デッキ登録完了");
  });
});

// ---- 組合せ: 既存の大会デッキの更新 ----

function 既存デッキを更新する(key: string, メイン: string, サイド: string): (ctx: CaseCtx) => Promise<void> {
  return async (ctx) => {
    const { notes } = ctx;
    void ctx.db;
    const id = notes.get(`〔大会デッキID-F0616-${key}〕`);
    const 旧 = 控えを取る(key, id, 標準の呼び名, notes);
    expect(旧.カード.length, "シードが足した旧カード情報の件数").toBeGreaterThan(0);
    await 提出の手順(ctx, key, { メイン, サイド });
    let decks: ReturnType<typeof 大会デッキ一覧> = [], cards: string[] = [];
    await ctx.step(6, async () => { decks = 大会デッキ一覧(詳細(key), 選手(key), notes.get(標準の呼び名)); cards = カード情報の控え(id); });
    await ctx.expected(async () => {
      expect.soft(decks.map((x) => x.デッキID), "同じイベント・選手情報・Standardの既存デッキが1件のまま").toEqual([id]);
      expect.soft(decks[0]?.内容メイン ?? null, "内容テキスト（メイン）が更新される").toBe(メイン);
      expect.soft(番号を除く(cards), "デッキを構成するカード情報（IslandとNegateだけ）").toEqual([`1:${札("Island")}:4`, `2:${札("Negate")}:2`].sort());
      expect.soft(cards.filter((c) => 旧.カード.includes(c)), "旧カード情報（削除される）").toEqual([]);
    });
  };
}
const 不明あり = `4 ${札("Island")}\n2 Unknown Card`;
caseTest("IT-F06-16-065", 既存デッキを更新する("065", 不明あり, `2 ${札("Negate")}`));
caseTest("IT-F06-16-066", 既存デッキを更新する("066", 不明あり, `2 ${札("Negate")}`));
caseTest("IT-F06-16-067", 既存デッキを更新する("067", `4 ${札("Island")}`, `2 ${札("Negate")}`));
caseTest("IT-F06-16-068", 既存デッキを更新する("068", 不明あり, `2 ${札("Negate")}`));
caseTest("IT-F06-16-071", 既存デッキを更新する("071", `4 ${札("Island")}`, `2 ${札("Negate")}`));
