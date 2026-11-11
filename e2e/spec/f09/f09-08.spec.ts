/**
 * F09-08 デッキ一括購入（フロント・デッキ検索）。正本: cases/F09-08_test_cases.tsv
 *
 * 実装しないケース（理由）:
 * - 008・009: 限定公開用の値をデッキへ DB で直接設定する準備（画面で指定できない）
 * - 028: 商品の削除済みを DB で直接設定する準備
 * - 059: 商品・規格・デッキの更新日時を DB で直接設定する準備
 * - 068・070: 会員からプレイヤーを外すのを DB で直接設定する準備
 *
 * 会員でログインするケース（003・004・005・007）と、所有者の会員を作るシードを使うケース（006・010・069）は、
 * シードがフロントの新規会員登録で会員を作る。手元の環境では会員登録が通らない（PM の判断待ち）ので、シードで止まる。
 *
 * 画面で確かめるときの読み替え（手順の注記にも出す）:
 * - 「ブラウザの開発者ツールのネットワーク表示を開いた状態」は、テストがカードリストの確認の要求・応答と、買い物かごへの追加の
 *   要求を記録する（pages/front/f09_08_deck_bulk.ts。応答の中身は変えずに画面へ渡す）。
 * - 「開発者ツールで選択肢の値を書き換えて選ぶ」は、選ばれている選択肢の値を書き換えてその選択肢を選ぶ。
 * - 決め打ちの名前（カード名など）・ログインIDは実行の印つきの値で読む（seeds/f09-08.ts の 印つき・印つきのメール）。
 *   存在しないデッキID（9080002）は値そのままで読む。
 */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { DeckBulkPage, 確認の応答, 組の一覧, 追加の要求の組 } from "../../pages/front/f09_08_deck_bulk";
import { DeckShowPage } from "../../pages/front/f09_06_deck_show";
import { LoginPage } from "../../pages/front/f06_03_login";
import { F0908の共通パスワード, 印つき, 印つきのメール } from "../../seeds/f09-08";
import "../../seeds/f09-08";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 記録の注記 = "開発者ツールのネットワーク表示の代わりに、テストがカードリストの確認の要求と応答を記録した（応答は中身を変えずに画面へ渡した）";

/** 設計書の誤りの一覧の総括の文言（設計書 L0089・L0091・L0092） */
const 総括 = {
  書式: "デッキリストの書式が正しくありません。",
  商品なし: "商品が存在しないカードが含まれています。",
  在庫不足: "指定された条件で在庫が不足しているカードがあります。",
};
/** 行ごとの誤り「（行番号）行目: （カード名）」（設計書 L0093）。カード名は実行の印つき */
const 行の誤り = (行: number, 名: string) => `${行}行目: ${印つき(名)}`;

const 規格 = (ctx: CaseCtx, 記号: string) => ctx.notes.get(`〔規格ID-F0908-${記号}〕`);
const デッキ = (ctx: CaseCtx, 番号: string) => ctx.notes.get(`〔デッキID-F0908-${番号}〕`);

type 条件 = [言語: string, 状態: string, Foil: string, 優先: string];

async function 条件を選ぶ(p: DeckBulkPage, [言語, 状態, Foil, 優先]: 条件): Promise<void> {
  await p.選ぶ(p.言語, 言語);
  await p.選ぶ(p.状態, 状態);
  await p.選ぶ(p.通常Foil, Foil);
  await p.選ぶ(p.優先条件, 優先);
}

/** 組の並びを問わない規格の組は、その組が占める位置の中で並べ替える（並びを問わない範囲だけをそろえる） */
function 並べ方をそろえる(list: string[], 規格IDs: string[]): string[] {
  if (!規格IDs.length) return list;
  const pos = list.map((x, i) => (規格IDs.includes(x.split(":")[0]) ? i : -1)).filter((i) => i >= 0);
  const sorted = pos.map((i) => list[i]).sort();
  const out = [...list];
  pos.forEach((i, j) => { out[i] = sorted[j]; });
  return out;
}

/** 手順1〜4: 識別子なしで開き、カードリストを入れ、条件を選び、記録を始めて「カートに追加」を押す */
async function 入れて押す(ctx: CaseCtx, p: DeckBulkPage, 行: string[], 条件: 条件 | ((p: DeckBulkPage) => Promise<void>)): Promise<void> {
  await ctx.step(1, async () => { await p.開く(); });
  await ctx.step(2, async () => { await p.カードリストを入れる(行.map(印つき).join("\n")); });
  await ctx.step(3, async () => { if (typeof 条件 === "function") await 条件(p); else await 条件を選ぶ(p, 条件); });
  await ctx.step(4, async () => { await p.ネットワークの記録を始める(); await p.カートに追加を押す(); note(記録の注記); });
}

// ---------------------------------------------------------------------------
// 初期表示に載せるカードリスト
// ---------------------------------------------------------------------------

/** ログインする（会員ログイン画面でログインIDとパスワードを入れてログインする） */
async function ログインする(ctx: CaseCtx, 正本のメール: string): Promise<void> {
  const l = new LoginPage(ctx.page);
  await l.ログイン画面を開く();
  await l.ログインする(印つきのメール(正本のメール), F0908の共通パスワード);
  expect(await l.ログイン画面である(), "ログインのあと会員ログイン画面にとどまっていない").toBe(false);
}

/** カードリスト欄が空か、空でないかを見るケース */
function 初期表示(o: { ログイン?: string; デッキ?: string | "なし"; 空: boolean }) {
  return async (ctx: CaseCtx) => {
    const p = new DeckBulkPage(ctx.page);
    let n = 0;
    if (o.ログイン) await ctx.step(++n, async () => { await ログインする(ctx, o.ログイン!); });
    await ctx.step(++n, async () => {
      if (o.デッキ === "なし") await p.開く();
      else await p.開く(/^\d+$/.test(o.デッキ!) ? o.デッキ : デッキ(ctx, o.デッキ!));
    });
    let 欄 = "";
    await ctx.step(++n, async () => { 欄 = await p.カードリスト(); });
    await ctx.expected(async () => {
      if (o.空) expect(欄, "カードリスト欄の内容（空）").toBe("");
      else expect(欄.trim(), "カードリスト欄の内容（空ではない）").not.toBe("");
    });
  };
}

caseTest("IT-F09-08-001", 初期表示({ デッキ: "なし", 空: true }));
caseTest("IT-F09-08-002", 初期表示({ デッキ: "9080002", 空: true }));
caseTest("IT-F09-08-003", 初期表示({ ログイン: "f0908-003@example.test", デッキ: "003", 空: false }));
caseTest("IT-F09-08-004", 初期表示({ ログイン: "f0908-004@example.test", デッキ: "004", 空: false }));
caseTest("IT-F09-08-005", 初期表示({ ログイン: "f0908-005-b@example.test", デッキ: "005", 空: true }));
caseTest("IT-F09-08-006", 初期表示({ デッキ: "006", 空: true }));
caseTest("IT-F09-08-007", 初期表示({ ログイン: "f0908-007-b@example.test", デッキ: "007", 空: true }));
caseTest("IT-F09-08-069", 初期表示({ デッキ: "069", 空: true }));

/** カードリスト欄の行のうち、名前（実行の印つき）を含む行 */
const 載った行 = (欄: string, 名: string[]) => 名.map((n) => ({ 名: 印つき(n), 載った: 欄.includes(印つき(n)) }));

caseTest("IT-F09-08-010", async (ctx) => {
  const v = new DeckShowPage(ctx.page);
  const p = new DeckBulkPage(ctx.page);
  await ctx.step(1, async () => { await v.開く(デッキ(ctx, "010")); });
  await ctx.step(2, async () => { await v.押して移る(v.一括購入, "このデッキを一括購入する"); });
  let 欄 = "";
  let 画面 = false;
  await ctx.step(3, async () => { 画面 = await p.デッキ一括購入画面である(); 欄 = 画面 ? await p.カードリスト() : ""; });
  await ctx.expected(async () => {
    expect.soft(画面, `デッキ一括購入画面に遷移した（${new URL(ctx.page.url()).pathname}）`).toBe(true);
    expect.soft(載った行(欄, ["F0908-010-EN"]), "カードリスト欄に英語カード名が載る").toEqual([{ 名: 印つき("F0908-010-EN"), 載った: true }]);
    expect.soft(載った行(欄, ["F0908-010-日本名"]), "カードリスト欄に日本語カード名が載っていない").toEqual([{ 名: 印つき("F0908-010-日本名"), 載った: false }]);
  });
});

caseTest("IT-F09-08-071", async (ctx) => {
  const p = new DeckBulkPage(ctx.page);
  await ctx.step(1, async () => { await p.開く(デッキ(ctx, "071")); });
  let 欄 = "";
  await ctx.step(2, async () => { 欄 = await p.カードリスト(); });
  await ctx.expected(async () => {
    const 英 = ["F0908-071-EN-A", "F0908-071-EN-B", "F0908-071-EN-C"], 日 = ["F0908-071-JP-A", "F0908-071-JP-B", "F0908-071-JP-C"];
    expect.soft(載った行(欄, 英), "カードリスト欄に英語カード名の3種類がすべて載る").toEqual(英.map((n) => ({ 名: 印つき(n), 載った: true })));
    expect.soft(載った行(欄, 日), "カードリスト欄に日本語カード名が載っていない").toEqual(日.map((n) => ({ 名: 印つき(n), 載った: false })));
  });
});

// ---------------------------------------------------------------------------
// 購入条件の指定（初期値・優先条件の選択肢）
// ---------------------------------------------------------------------------

caseTest("IT-F09-08-011", async (ctx) => {
  const p = new DeckBulkPage(ctx.page);
  await ctx.step(1, async () => { await p.開く(デッキ(ctx, "011")); });
  const v: Record<string, string> = {};
  await ctx.step(2, async () => {
    v.言語 = await p.選択中(p.言語); v.状態 = await p.選択中(p.状態); v.Foil = await p.選択中(p.通常Foil); v.優先 = await p.選択中(p.優先条件);
  });
  await ctx.expected(async () => {
    expect.soft(v.言語, "言語の選択値").toBe("日本語のみ");
    expect.soft(v.状態, "状態の選択値").toBe("NM");
    expect.soft(v.Foil, "通常/Foilの選択値").toBe("通常カードのみ");
    expect.soft(v.優先, "優先条件の選択値").toBe("安いカード優先");
  });
});

const 基本の優先 = ["安いカード優先", "高いカード優先"];
const 並べる = (xs: string[]) => [...xs].sort();

caseTest("IT-F09-08-025", async (ctx) => {
  const p = new DeckBulkPage(ctx.page);
  const 見た: Record<string, string[]> = {};
  await ctx.step(1, async () => { await p.開く(デッキ(ctx, "025")); });
  await ctx.step(2, async () => { 見た.初め = await p.選択肢(p.優先条件); });
  await ctx.step(3, async () => { await p.選ぶ(p.言語, "日・英のみ"); 見た.日英 = await p.選択肢(p.優先条件); });
  await ctx.step(4, async () => { await p.選ぶ(p.言語, "指定しない（他言語を含む）"); 見た.指定しない = await p.選択肢(p.優先条件); });
  await ctx.expected(async () => {
    const want = 並べる([...基本の優先, "日本語優先", "英語優先"]);
    expect.soft(並べる(見た.日英), "言語「日・英のみ」のときの優先条件の選択肢").toEqual(want);
    expect.soft(並べる(見た.指定しない), "言語「指定しない（他言語を含む）」のときの優先条件の選択肢").toEqual(want);
  });
});

caseTest("IT-F09-08-026", async (ctx) => {
  const p = new DeckBulkPage(ctx.page);
  let 日英: string[] = [];
  let 戻した: string[] = [];
  await ctx.step(1, async () => { await p.開く(デッキ(ctx, "026")); });
  await ctx.step(2, async () => {
    await p.選ぶ(p.言語, "日・英のみ");
    日英 = await p.選択肢(p.優先条件);
    expect(日英, "言語「日・英のみ」で優先条件に「日本語優先」「英語優先」が並ぶ").toEqual(expect.arrayContaining(["日本語優先", "英語優先"]));
  });
  await ctx.step(3, async () => { await p.選ぶ(p.言語, "日本語のみ"); 戻した = await p.選択肢(p.優先条件); });
  await ctx.expected(async () => {
    expect(並べる(戻した), "言語を「日本語のみ」に戻したあとの優先条件の選択肢").toEqual(並べる(基本の優先));
  });
});

caseTest("IT-F09-08-027", async (ctx) => {
  const p = new DeckBulkPage(ctx.page);
  let 指定しない: string[] = [];
  await ctx.step(1, async () => { await p.開く(デッキ(ctx, "027")); });
  await ctx.step(2, async () => { await p.選択肢(p.優先条件); });
  await ctx.step(3, async () => { await p.選ぶ(p.通常Foil, "指定しない"); 指定しない = await p.選択肢(p.優先条件); });
  await ctx.expected(async () => {
    expect(並べる(指定しない), "通常/Foil「指定しない」のときの優先条件の選択肢").toEqual(並べる([...基本の優先, "通常カード優先", "Foilカード優先"]));
  });
});

// ---------------------------------------------------------------------------
// 商品規格と数量の組（カードリストの確認の応答）
// ---------------------------------------------------------------------------

type 組の確かめ = { 並びを問わない?: string[]; 含まない?: string[] };

/** 応答の組と期待の組を、並びを問わない範囲をそろえて並べる。含まないはずの規格の組も拾う */
function 組の比べ(ctx: CaseCtx, r: 確認の応答 | undefined, 期待: [string, number][], o: 組の確かめ = {}) {
  const ids = (o.並びを問わない ?? []).map((k) => 規格(ctx, k));
  const 実際 = 並べ方をそろえる(組の一覧(r), ids);
  const want = 並べ方をそろえる(期待.map(([k, q]) => `${規格(ctx, k)}:${q}`), ids);
  const 含まないはず = (o.含まない ?? []).map((k) => 規格(ctx, k));
  return {
    実際, 期待: want, 名: `商品規格の識別子と数量の組（${期待.map(([k, q]) => `${k}=${q}`).join("・")}${o.並びを問わない ? `。${o.並びを問わない.join("・")} の並びは問わない` : ""}）`,
    含まれた: 組の一覧(r).map((x) => x.split(":")[0]).filter((id) => 含まないはず.includes(id)),
    含まない: (o.含まない ?? []).join("・"),
  };
}

function 組を確かめる(行: string[], 条件: 条件, 期待: [string, number][], o: 組の確かめ = {}) {
  return async (ctx: CaseCtx) => {
    const p = new DeckBulkPage(ctx.page);
    await 入れて押す(ctx, p, 行, 条件);
    let r: 確認の応答 | undefined;
    await ctx.step(5, async () => { r = p.確認の応答[p.確認の応答.length - 1]; });
    await ctx.expected(async () => {
      const v = 組の比べ(ctx, r, 期待, o);
      expect.soft(r?.本文?.success, "応答の処理結果（成功）").toBe(true);
      expect.soft(v.実際, v.名).toEqual(v.期待);
      if (v.含まない) expect.soft(v.含まれた, `規格 ${v.含まない} の組を含まない`).toEqual([]);
      expect.soft(r?.本文?.errors ?? [], "応答の誤りの一覧（無い）").toEqual([]);
    });
  };
}

caseTest("IT-F09-08-012", 組を確かめる(["3 F0908-012-A"], ["日本語のみ", "NM", "通常カードのみ", "安いカード優先"], [["012A", 3]]));
caseTest("IT-F09-08-013", 組を確かめる(["3 F0908-013-A"], ["英語のみ", "NM", "通常カードのみ", "安いカード優先"], [["013B", 3]]));
caseTest("IT-F09-08-014", 組を確かめる(["6 F0908-014-A"], ["日・英のみ", "NM", "通常カードのみ", "安いカード優先"], [["014B", 3], ["014A", 3]]));
caseTest("IT-F09-08-015", 組を確かめる(["9 F0908-015-A"], ["指定しない（他言語を含む）", "NM", "通常カードのみ", "安いカード優先"], [["015C", 3], ["015B", 3], ["015A", 3]]));
caseTest("IT-F09-08-016", 組を確かめる(["3 F0908-016-A"], ["日本語のみ", "NM", "通常カードのみ", "安いカード優先"], [["016A", 3]]));
caseTest("IT-F09-08-017", 組を確かめる(["5 F0908-017-A"], ["日本語のみ", "NM・SP", "通常カードのみ", "安いカード優先"], [["017B", 2], ["017A", 3]]));
caseTest("IT-F09-08-018", 組を確かめる(["9 F0908-018-A"], ["日本語のみ", "NM・SP・MP", "通常カードのみ", "安いカード優先"], [["018C", 4], ["018B", 2], ["018A", 3]]));
caseTest("IT-F09-08-019", 組を確かめる(["10 F0908-019-A"], ["日本語のみ", "NM・SP・MP・HP", "通常カードのみ", "安いカード優先"], [["019D", 1], ["019C", 4], ["019B", 2], ["019A", 3]]));
caseTest("IT-F09-08-020", 組を確かめる(["3 F0908-020-A"], ["日本語のみ", "NM", "通常カードのみ", "安いカード優先"], [["020A", 3]]));
caseTest("IT-F09-08-021", 組を確かめる(["2 F0908-021-A"], ["日本語のみ", "NM", "Foilカードのみ", "安いカード優先"], [["021B", 2]]));
caseTest("IT-F09-08-022", 組を確かめる(["5 F0908-022-A"], ["日本語のみ", "NM", "指定しない", "安いカード優先"], [["022A", 3], ["022B", 2]]));
caseTest("IT-F09-08-023", 組を確かめる(["2 F0908-023-A"], ["日本語のみ", "NM・SP", "通常カードのみ", "安いカード優先"], [["023B", 2]]));
caseTest("IT-F09-08-024", 組を確かめる(["2 F0908-024-A"], ["日本語のみ", "NM・SP", "通常カードのみ", "高いカード優先"], [["024A", 2]]));
caseTest("IT-F09-08-029", 組を確かめる(["3 F0908-029-A"], ["日本語のみ", "NM・SP・MP", "通常カードのみ", "安いカード優先"], [["029A", 3]]));
caseTest("IT-F09-08-030", 組を確かめる(["2 F0908-030-日本名"], ["日本語のみ", "NM", "通常カードのみ", "安いカード優先"], [["030", 2]]));
caseTest("IT-F09-08-031", 組を確かめる(["2 F0908-031-EN"], ["日本語のみ", "NM", "通常カードのみ", "安いカード優先"], [["031", 2]]));
caseTest("IT-F09-08-032", 組を確かめる(["9 F0908-032-A"], ["指定しない（他言語を含む）", "NM・SP", "通常カードのみ", "安いカード優先"], [["032A", 3], ["032C", 3], ["032D", 3]], { 含まない: ["032B"] }));
caseTest("IT-F09-08-033", 組を確かめる(["9 F0908-033-A"], ["指定しない（他言語を含む）", "NM・SP・MP", "通常カードのみ", "安いカード優先"], [["033D", 3], ["033B", 3], ["033A", 3]], { 含まない: ["033C"] }));
caseTest("IT-F09-08-034", 組を確かめる(["2 F0908-034-A"], ["日本語のみ", "NM・SP", "通常カードのみ", "安いカード優先"], [["034B", 2]]));
caseTest("IT-F09-08-035", 組を確かめる(["3 F0908-035-A"], ["日本語のみ", "NM", "通常カードのみ", "安いカード優先"], [["035B", 3]]));
caseTest("IT-F09-08-036", 組を確かめる(["4 F0908-036-A"], ["日本語のみ", "NM・SP", "通常カードのみ", "安いカード優先"], [["036B", 4]]));
caseTest("IT-F09-08-037", 組を確かめる(["5 F0908-037-A"], ["日本語のみ", "NM・SP・MP", "通常カードのみ", "安いカード優先"], [["037A", 2], ["037C", 3]], { 含まない: ["037B"] }));
caseTest("IT-F09-08-038", 組を確かめる(["3 F0908-038-A"], ["日本語のみ", "NM・SP", "通常カードのみ", "安いカード優先"], [["038A", 3]], { 含まない: ["038B"] }));
caseTest("IT-F09-08-039", 組を確かめる(["10 F0908-039-A"], ["日本語のみ", "NM・SP", "通常カードのみ", "安いカード優先"], [["039A", 3], ["039B", 7]]));
caseTest("IT-F09-08-040", 組を確かめる(["2 F0908-040-A", "3 F0908-040-A"], ["日本語のみ", "NM", "通常カードのみ", "安いカード優先"], [["040", 5]]));
caseTest("IT-F09-08-041", 組を確かめる(["2 F0908-041-A", "3 F0908-041-B (ELD) 254"], ["日本語のみ", "NM", "通常カードのみ", "安いカード優先"], [["041A", 2], ["041B", 3]]));
caseTest("IT-F09-08-042", 組を確かめる(["Deck", "2 F0908-042-A", "", "サイドボード", "3 F0908-042-B", "Sideboard", "デッキ"], ["日本語のみ", "NM", "通常カードのみ", "安いカード優先"], [["042A", 2], ["042B", 3]]));
caseTest("IT-F09-08-043", 組を確かめる(["相棒", "1 F0908-043-X1", "2 F0908-043-A", "Companion", "1 F0908-043-X2", "3 F0908-043-B"], ["日本語のみ", "NM", "通常カードのみ", "安いカード優先"], [["043A", 2], ["043B", 3]]));
caseTest("IT-F09-08-044", 組を確かめる(["2 F0908-044-L // F0908-044-R"], ["日本語のみ", "NM", "通常カードのみ", "安いカード優先"], [["044", 2]]));
caseTest("IT-F09-08-045", 組を確かめる(["2 F0908-045-L /// F0908-045-R"], ["日本語のみ", "NM", "通常カードのみ", "安いカード優先"], [["045", 2]]));
caseTest("IT-F09-08-072", 組を確かめる(["3 F0908-CB072-A"], ["日本語のみ", "NM", "指定しない", "通常カード優先"], [["072A", 3]]));
caseTest("IT-F09-08-073", 組を確かめる(["2 F0908-CB073-L // F0908-CB073-R", "3 F0908-CB073-L // F0908-CB073-R"], ["日本語のみ", "NM", "指定しない", "Foilカード優先"], [["073A", 2], ["073B", 1]]));
caseTest("IT-F09-08-074", 組を確かめる(["2 F0908-CB074-A", "1 F0908-CB074-A"], ["英語のみ", "NM・SP", "Foilカードのみ", "高いカード優先"], [["074A", 3]]));
caseTest("IT-F09-08-075", 組を確かめる(["7 F0908-CB075-A"], ["英語のみ", "NM・SP・MP", "指定しない", "高いカード優先"], [["075F", 1], ["075A", 2], ["075C", 1], ["075D", 3]]));
caseTest("IT-F09-08-076", 組を確かめる(["2 F0908-CB076-L // F0908-CB076-R", "5 F0908-CB076-L // F0908-CB076-R"], ["英語のみ", "NM・SP・MP・HP", "Foilカードのみ", "高いカード優先"], [["076A", 3], ["076C", 2]]));
caseTest("IT-F09-08-077", 組を確かめる(["3 F0908-CB077-A", "4 F0908-CB077-A"], ["英語のみ", "NM・SP", "指定しない", "通常カード優先"], [["077A", 3], ["077D", 2], ["077E", 2]], { 並びを問わない: ["077D", "077E"] }));
caseTest("IT-F09-08-078", 組を確かめる(["2 F0908-CB078-L // F0908-CB078-R", "4 F0908-CB078-L // F0908-CB078-R"], ["英語のみ", "NM・SP", "指定しない", "Foilカード優先"], [["078A", 4]]));
caseTest("IT-F09-08-079", 組を確かめる(["5 F0908-CB079-A"], ["日・英のみ", "NM・SP", "Foilカードのみ", "日本語優先"], [["079A", 2], ["079B", 3]]));
caseTest("IT-F09-08-080", 組を確かめる(["2 F0908-CB080-A", "3 F0908-CB080-A"], ["日・英のみ", "NM・SP・MP", "Foilカードのみ", "英語優先"], [["080A", 5]]));
caseTest("IT-F09-08-081", 組を確かめる(["2 F0908-CB081-A", "3 F0908-CB081-A"], ["日・英のみ", "NM・SP・MP・HP", "指定しない", "日本語優先"], [["081A", 5]]));
caseTest("IT-F09-08-082", 組を確かめる(["3 F0908-CB082-A"], ["日・英のみ", "NM", "通常カードのみ", "高いカード優先"], [["082A", 2], ["082B", 1]]));
caseTest("IT-F09-08-083", 組を確かめる(["2 F0908-CB083-L // F0908-CB083-R", "6 F0908-CB083-L // F0908-CB083-R"], ["日・英のみ", "NM・SP・MP", "指定しない", "通常カード優先"], [["083A", 2], ["083D", 4]]));
caseTest("IT-F09-08-084", 組を確かめる(["3 F0908-CB084-A", "5 F0908-CB084-A"], ["日・英のみ", "NM・SP・MP", "指定しない", "Foilカード優先"], [["084A", 2], ["084B", 1], ["084C", 1], ["084E", 4]], { 並びを問わない: ["084A", "084B", "084C"] }));
caseTest("IT-F09-08-085", 組を確かめる(["6 F0908-CB085-A"], ["指定しない（他言語を含む）", "NM・SP・MP・HP", "Foilカードのみ", "英語優先"], [["085A", 2], ["085B", 2], ["085F", 2]]));
caseTest("IT-F09-08-086", 組を確かめる(["1 F0908-CB086-L // F0908-CB086-R", "5 F0908-CB086-L // F0908-CB086-R"], ["指定しない（他言語を含む）", "NM", "指定しない", "日本語優先"], [["086A", 2], ["086D", 2], ["086B", 1]]));
caseTest("IT-F09-08-087", 組を確かめる(["2 F0908-CB087-A", "3 F0908-CB087-A"], ["指定しない（他言語を含む）", "NM", "通常カードのみ", "高いカード優先"], [["087B", 5]]));
caseTest("IT-F09-08-088", 組を確かめる(["4 F0908-CB088-A"], ["指定しない（他言語を含む）", "NM・SP・MP・HP", "指定しない", "通常カード優先"], [["088A", 4]]));
caseTest("IT-F09-08-089", 組を確かめる(["4 F0908-CB089-A"], ["指定しない（他言語を含む）", "NM・SP・MP・HP", "指定しない", "Foilカード優先"], [["089A", 4]]));
caseTest("IT-F09-08-090", 組を確かめる(["1 F0908-CB090-L // F0908-CB090-R", "4 F0908-CB090-L // F0908-CB090-R"], ["日・英のみ", "NM", "通常カードのみ", "英語優先"], [["090A", 2], ["090B", 2]]));
caseTest("IT-F09-08-091", 組を確かめる(["5 F0908-CB091-A"], ["日本語のみ", "NM", "通常カードのみ", "安いカード優先"], [["091D", 1], ["091A", 4]]));
caseTest("IT-F09-08-092", 組を確かめる(["4 F0908-CB092-A"], ["日・英のみ", "NM・SP", "指定しない", "英語優先"], [["092A", 4]]));
caseTest("IT-F09-08-093", 組を確かめる(["3 F0908-CB093-A"], ["日・英のみ", "NM・SP・MP", "通常カードのみ", "日本語優先"], [["093A", 3]]));
caseTest("IT-F09-08-094", 組を確かめる(["2 F0908-CB094-L // F0908-CB094-R", "3 F0908-CB094-L // F0908-CB094-R"], ["日本語のみ", "NM", "通常カードのみ", "安いカード優先"], [["094D", 3]]));

/** 055: 1行目にカード、2行目から500行目まで空行の計500行（最終行の後ろに改行は付けない） */
caseTest("IT-F09-08-055", async (ctx) => {
  const p = new DeckBulkPage(ctx.page);
  await ctx.step(1, async () => { await p.開く(); });
  await ctx.step(2, async () => {
    const 文 = [印つき("2 F0908-055-A"), ...Array<string>(499).fill("")].join("\n");
    await p.カードリストを入れる(文);
    note("貼り付けの代わりに、500行の文をカードリスト欄へ入れた");
    expect((await p.カードリスト()).split("\n").length, "カードリスト欄の行数（空行を含めて500行）").toBe(500);
  });
  await ctx.step(3, async () => { await 条件を選ぶ(p, ["日本語のみ", "NM", "通常カードのみ", "安いカード優先"]); });
  await ctx.step(4, async () => { await p.ネットワークの記録を始める(); await p.カートに追加を押す(); note(記録の注記); });
  let r: 確認の応答 | undefined;
  await ctx.step(5, async () => { r = p.確認の応答[p.確認の応答.length - 1]; });
  await ctx.expected(async () => {
    const v = 組の比べ(ctx, r, [["055", 2]]);
    expect.soft(r?.本文?.success, "応答の処理結果（成功）").toBe(true);
    expect.soft(v.実際, v.名).toEqual(v.期待);
    expect.soft((r?.本文?.errors ?? []).filter((e) => e.includes("最大行数")), "行数の誤り（出ない）").toEqual([]);
  });
});

/** 057: 言語・状態・通常/Foilの選択肢の値を「9」に書き換えて選ぶ。優先条件は「安いカード優先」 */
caseTest("IT-F09-08-057", async (ctx) => {
  const p = new DeckBulkPage(ctx.page);
  const 送った: Record<string, string> = {};
  await 入れて押す(ctx, p, ["5 F0908-057-A"], async (q) => {
    for (const [名, sel] of [["言語", q.言語], ["状態", q.状態], ["通常/Foil", q.通常Foil]] as const) {
      const 表示 = await q.選択肢の値を書き換えて選ぶ(sel, "9");
      送った[名] = `${表示}→${await q.送られる値(sel)}`;
    }
    await q.選ぶ(q.優先条件, "安いカード優先");
    note(`開発者ツールの代わりに、選ばれている選択肢の値を「9」に書き換えて選んだ（${Object.entries(送った).map(([k, v]) => `${k}: ${v}`).join("・")}）`);
  });
  let r: 確認の応答 | undefined;
  await ctx.step(5, async () => { r = p.確認の応答[p.確認の応答.length - 1]; });
  await ctx.expected(async () => {
    const v = 組の比べ(ctx, r, [["057B", 1], ["057D", 1], ["057C", 1], ["057A", 1], ["057E", 1]]);
    expect.soft(r?.本文?.success, "応答の処理結果（成功）").toBe(true);
    expect.soft(v.実際, `${v.名}。言語・状態・通常/Foilのどれでも絞り込まれていない`).toEqual(v.期待);
  });
});

/** 058: 優先条件の選択肢の値を「9」に書き換えて選ぶ */
caseTest("IT-F09-08-058", async (ctx) => {
  const p = new DeckBulkPage(ctx.page);
  await 入れて押す(ctx, p, ["2 F0908-058-A"], async (q) => {
    await q.選ぶ(q.言語, "日本語のみ");
    await q.選ぶ(q.状態, "NM・SP");
    await q.選ぶ(q.通常Foil, "通常カードのみ");
    const 表示 = await q.選択肢の値を書き換えて選ぶ(q.優先条件, "9");
    note(`開発者ツールの代わりに、優先条件の選ばれている選択肢「${表示}」の値を「9」に書き換えて選んだ（送られる値 ${await q.送られる値(q.優先条件)}）`);
  });
  let r: 確認の応答 | undefined;
  await ctx.step(5, async () => { r = p.確認の応答[p.確認の応答.length - 1]; });
  await ctx.expected(async () => {
    const v = 組の比べ(ctx, r, [["058B", 2]]);
    expect.soft(r?.本文?.success, "応答の処理結果（成功）").toBe(true);
    expect.soft(v.実際, `${v.名}。販売価格の安い規格が選ばれている`).toEqual(v.期待);
  });
});

// ---------------------------------------------------------------------------
// 誤りの一覧
// ---------------------------------------------------------------------------

const 既定の条件: 条件 = ["日本語のみ", "NM", "通常カードのみ", "安いカード優先"];

function 誤りを確かめる(行: string[], 条件: 条件, 期待: string[], o: { 含まない題?: string[]; 移らない?: boolean; 組なし?: boolean; 失敗?: boolean } = {}) {
  return async (ctx: CaseCtx) => {
    const p = new DeckBulkPage(ctx.page);
    await 入れて押す(ctx, p, 行, 条件);
    let 一覧: string[] = [];
    let r: 確認の応答 | undefined;
    let 買い物かご = false;
    await ctx.step(5, async () => { 一覧 = await p.誤りの一覧(); r = p.確認の応答[p.確認の応答.length - 1]; 買い物かご = p.買い物かご画面である(); });
    await ctx.expected(async () => {
      expect.soft(一覧, "画面の誤りの一覧").toEqual(期待);
      for (const t of o.含まない題 ?? []) expect.soft(一覧, `誤りの一覧に「${t}」を含まない`).not.toContain(t);
      if (o.移らない) expect.soft(買い物かご, `買い物かご画面へ移っていない（${new URL(ctx.page.url()).pathname}）`).toBe(false);
      if (o.失敗) expect.soft(r?.本文?.success, "応答の処理結果（失敗）").toBe(false);
      if (o.組なし) expect.soft(組の一覧(r), "応答の商品規格と数量の組（含まれない）").toEqual([]);
    });
  };
}

caseTest("IT-F09-08-048", 誤りを確かめる(["2 F0908-048-X", "F0908-048-BAD"], 既定の条件, [総括.書式, 行の誤り(2, "F0908-048-BAD")], { 含まない題: [総括.商品なし] }));
caseTest("IT-F09-08-049", 誤りを確かめる(["2 F0908-049-A", "1 F0908-049-X1", "1 F0908-049-X2"], 既定の条件, [総括.商品なし, 行の誤り(2, "F0908-049-X1"), 行の誤り(3, "F0908-049-X2")]));
caseTest("IT-F09-08-050", 誤りを確かめる(["2 F0908-050-A"], 既定の条件, [総括.在庫不足, 行の誤り(1, "F0908-050-A")], { 移らない: true, 組なし: true }));
caseTest("IT-F09-08-051", 誤りを確かめる(["2 F0908-051-A", "1 F0908-051-X"], 既定の条件, [総括.商品なし, 行の誤り(2, "F0908-051-X")], { 含まない題: [総括.在庫不足] }));
caseTest("IT-F09-08-095", 誤りを確かめる(["2 F0908-CB095-A"], 既定の条件, [総括.商品なし, 行の誤り(1, "F0908-CB095-A")], { 移らない: true, 失敗: true, 組なし: true }));

caseTest("IT-F09-08-061", async (ctx) => {
  const p = new DeckBulkPage(ctx.page);
  const 行 = ["2 F0908-061-A", "1 F0908-061-X"];
  await 入れて押す(ctx, p, 行, ["英語のみ", "NM・SP", "通常カードのみ", "安いカード優先"]);
  const v: { 画面: boolean; 欄: string; 言語: string; 状態: string; 一覧: string[] } = { 画面: false, 欄: "", 言語: "", 状態: "", 一覧: [] };
  await ctx.step(5, async () => {
    v.画面 = await p.デッキ一括購入画面である();
    if (v.画面) { v.欄 = await p.カードリスト(); v.言語 = await p.選択中(p.言語); v.状態 = await p.選択中(p.状態); v.一覧 = await p.誤りの一覧(); }
  });
  await ctx.expected(async () => {
    expect.soft(v.画面, `デッキ一括購入画面にとどまる（${new URL(ctx.page.url()).pathname}）`).toBe(true);
    expect.soft(v.欄, "カードリスト欄の入力（入力したまま）").toBe(行.map(印つき).join("\n"));
    expect.soft(v.言語, "言語の選択（入力したまま）").toBe("英語のみ");
    expect.soft(v.状態, "状態の選択（入力したまま）").toBe("NM・SP");
    expect.soft(v.一覧[0], "誤りの一覧の先頭（商品なしの総括）").toBe(総括.商品なし);
    expect.soft(v.一覧, "誤りの一覧に行の誤りがある").toContain(行の誤り(2, "F0908-061-X"));
  });
});

// ---------------------------------------------------------------------------
// 応答の状態・処理結果・遷移・買い物かごへの引き渡し
// ---------------------------------------------------------------------------

function 応答の状態(行: string[]) {
  return async (ctx: CaseCtx) => {
    const p = new DeckBulkPage(ctx.page);
    await 入れて押す(ctx, p, 行, 既定の条件);
    let r: 確認の応答 | undefined;
    await ctx.step(5, async () => { r = p.確認の応答[p.確認の応答.length - 1]; });
    await ctx.expected(async () => { expect(r?.状態, "カードリストの確認の応答のHTTPステータス").toBe(200); });
  };
}
caseTest("IT-F09-08-052", 応答の状態(["2 F0908-052-A"]));
caseTest("IT-F09-08-053", 応答の状態(["2 F0908-053-A", "1 F0908-053-X"]));

function 処理結果(行: string[], 成功: boolean) {
  return async (ctx: CaseCtx) => {
    const p = new DeckBulkPage(ctx.page);
    await 入れて押す(ctx, p, 行, 既定の条件);
    let r: 確認の応答 | undefined;
    await ctx.step(5, async () => { r = p.確認の応答[p.確認の応答.length - 1]; });
    await ctx.expected(async () => { expect(r?.本文?.success, `応答の処理結果（${成功 ? "成功" : "失敗"}）`).toBe(成功); });
  };
}
caseTest("IT-F09-08-065", 処理結果(["2 F0908-065-A"], true));
caseTest("IT-F09-08-066", 処理結果(["2 F0908-066-A", "1 F0908-066-X"], false));

caseTest("IT-F09-08-060", async (ctx) => {
  const p = new DeckBulkPage(ctx.page);
  await 入れて押す(ctx, p, ["2 F0908-060-A", "1 F0908-060-B"], 既定の条件);
  let r: 確認の応答 | undefined;
  let 買い物かご = false;
  await ctx.step(5, async () => { r = p.確認の応答[p.確認の応答.length - 1]; 買い物かご = p.買い物かご画面である(); });
  await ctx.expected(async () => {
    expect.soft(組の一覧(r), "応答の商品規格の識別子と数量の組").toEqual([`${規格(ctx, "060A")}:2`, `${規格(ctx, "060B")}:1`]);
    expect.soft(買い物かご, `画面が買い物かご画面へ移る（${new URL(ctx.page.url()).pathname}）`).toBe(true);
  });
});

caseTest("IT-F09-08-067", async (ctx) => {
  const p = new DeckBulkPage(ctx.page);
  await 入れて押す(ctx, p, ["2 F0908-067-A", "1 F0908-067-B"], 既定の条件);
  let 要求: string[] = [];
  await ctx.step(5, async () => {
    要求 = p.追加の要求;
    note(`買い物かごへの追加の要求の内容をテストが記録した（送り方は画面のフォームの送り方。${要求.length} 件）`);
  });
  await ctx.expected(async () => {
    expect.soft(要求.length, "「カートに追加」の直後に送られた買い物かごへの追加の要求の数").toBe(1);
    expect.soft(要求.length ? 追加の要求の組(要求[0]) : [], "買い物かごへの要求が引き渡す商品規格の識別子と数量の組")
      .toEqual([`${規格(ctx, "067A")}:2`, `${規格(ctx, "067B")}:1`]);
  });
});

caseTest("IT-F09-08-056", async (ctx) => {
  const p = new DeckBulkPage(ctx.page);
  await 入れて押す(ctx, p, ["1 F0908-056-X"], 既定の条件);
  let 一回目 = 0;
  await ctx.step(5, async () => {
    const 一覧 = await p.誤りの一覧();
    expect(一覧.length, "1回目の押下で誤りの一覧が出た").toBeGreaterThan(0);
    一回目 = p.確認の要求.length;
    await p.もう一度カートに追加を押す();
  });
  let 件数 = 0;
  let 文 = "";
  await ctx.step(6, async () => { 件数 = p.確認の要求.length; 文 = [...(await p.誤りの一覧()), await p.見えている文()].join(" "); });
  await ctx.expected(async () => {
    expect.soft(一回目, "1回目の押下のあとのカードリストの確認の要求の件数").toBe(1);
    expect.soft(件数, "2回目の押下のあとのカードリストの確認の要求の件数（1件のまま）").toBe(1);
    note("設計書は知らせの文言を定めないので、画面に「変わっていない」「変更されていない」旨の文があるかで見た");
    expect.soft(/変わっていません|変更されていません|変更がありません|変わっていない/.test(文), "画面に購入条件とカードリストの内容が変わっていないことを知らせる表示").toBe(true);
  });
});
