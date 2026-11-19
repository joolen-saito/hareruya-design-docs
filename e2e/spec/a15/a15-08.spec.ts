/**
 * A15-08 カード検索（デッキビルダーの API の GET /api/cards）。正本: cases/A15-08_test_cases.tsv
 * 実装したケースと解釈は記録 review/A15-08_progress_2026-11-20_dev.md。
 *
 * 「ブラウザの開発者ツールで要求を送り、Network で応答を見る」の代わりに、ブラウザでカード検索 API のアドレス（条件はすべてクエリ）を開き、
 * 画面に出た応答本体（JSON）と HTTP ステータスを読む（A15-04 と同じ）。エビデンスには応答本体が写る。
 * 送り先は API サーバー（config/env.ts の API_BASE_URL）。配列を取る項目は「名前[]=値」の形で複数値として渡す。
 * カード名の検索語には、シードと同じ実行の印を付ける（seeds/a15-08.ts）。
 */
import { Page, test } from "@playwright/test";
import { API_BASE_URL } from "../../config/env";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { カードの件数, カードの更新日時 } from "../../db/a15_08";
import { 検索語 } from "../../seeds/a15-08";
import "../../seeds/a15-08";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 開発者ツールの代わり = "開発者ツールの代わりに、ブラウザでカード検索 API（GET /api/cards）のアドレスを開いて要求を送り、画面に出た応答本体（JSON）と HTTP ステータスを読む（エビデンスの画面に応答本体が写る）";

type カード行 = { id?: unknown; name_jp?: unknown; name_en?: unknown; cardtypes?: unknown; colors?: unknown; mana_value?: unknown; is_attraction?: unknown; is_sticker?: unknown; image_jp?: unknown; image_en?: unknown };
type 応答 = { ステータス: number; 本文: string; json: Record<string, unknown> | null; cards: カード行[] };

/** カード検索 API へ、条件をすべてクエリで送る。トークンのヘッダは付けない */
async function 検索する(page: Page, 何: string, q: [string, string][]): Promise<応答> {
  await page.setExtraHTTPHeaders({});
  const qs = q.map(([k, v]) => `${encodeURIComponent(k).replace(/%5B%5D$/, "[]")}=${encodeURIComponent(v)}`).join("&");
  const url = `${API_BASE_URL}/api/cards${qs ? `?${qs}` : ""}`;
  const res = await page.goto(url, { timeout: 60_000 });
  if (!res) throw new Error(`${何}: カード検索 API の応答が無い`);
  const 本文 = await res.text();
  let json: Record<string, unknown> | null = null;
  try { json = JSON.parse(本文) as Record<string, unknown>; } catch { /* JSON でない応答は本文で見る */ }
  const cards = Array.isArray(json?.cards) ? (json!.cards as カード行[]) : [];
  note(`${何}: GET /api/cards?${decodeURIComponent(qs)}（jwt-token なし）・応答 HTTP ${res.status()}・総件数 ${String(json?.total_count)}・カード ${cards.length}件`);
  return { ステータス: res.status(), 本文, json, cards };
}

const 番号 = (ctx: CaseCtx, 呼び名: string): number => Number(ctx.notes.get(呼び名));
const ids = (r: 応答): number[] => r.cards.map((c) => Number(c.id));
const 並べ = (xs: number[]): number[] => [...xs].sort((a, b) => a - b);


const 呼び = (ケース: string, ...記号: string[]) => 記号.map((k) => `〔カードID-A1508-${ケース}${k}〕`);
const 名 = (ケース: string): [string, string] => ["name", 検索語(ケース)];

/** 手順1〜3（開発者ツールを開く・要求を送る・Network で応答を確認する）を行い、応答を返す */
async function 送って見る(ctx: CaseCtx, ケース: string, q: [string, string][], 印を付ける = true): Promise<応答> {
  if (印を付ける) supplement(`カード名の検索語は、シードと同じ実行の印を付けた「${検索語(ケース)}」で送る（正本の「A1508-${ケース}」。2回目の実行で前の回のカードに当たらないように）`);
  let r!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => { r = await 検索する(ctx.page, "カード検索", q); });
  await ctx.step(3, async () => { note(`応答本体: ${r.本文.slice(0, 1500)}`); });
  return r;
}

const 種 = (ctx: CaseCtx, k: string) => String(番号(ctx, `〔カード種別ID-A1508-共有${k}〕`));
const 副 = (ctx: CaseCtx, k: string) => String(番号(ctx, `〔サブタイプID-A1508-共有${k}〕`));
const 色 = (ctx: CaseCtx, k: string) => String(番号(ctx, `〔色ID-A1508-共有${k}〕`));
const 稀 = (ctx: CaseCtx, k: string) => String(番号(ctx, `〔レアリティID-A1508-共有${k}〕`));
const 形式 = (ctx: CaseCtx) => String(番号(ctx, "〔フォーマットID-A1508-共有〕"));


const 期待の識別子 = (ctx: CaseCtx, 呼び名: string[]): number[] => 並べ(呼び名.map((n) => 番号(ctx, n)));
const 範囲 = (ケース: string, a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => `〔カードID-A1508-${ケース}-${a + i}〕`);
const 値を持たない = (v: unknown) => v === null || v === undefined || v === "";

// --- 総件数とカード配列の顔ぶれを確かめるケース ---
caseTest("IT-A15-08-001", async (ctx) => {
  const r = await 送って見る(ctx, "001", [名("001")]);
  await ctx.expected(async () => {
    const want = 呼び("001", "A", "B", "C", "D", "E", "F");
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.total_count, "総件数").toBe(6);
    expect.soft(並べ(ids(r)), `カード配列のカードの識別子（${want.join("・")}）`).toEqual(期待の識別子(ctx, want));
  });
});
caseTest("IT-A15-08-018", async (ctx) => {
  const r = await 送って見る(ctx, "018", [名("018"), ["cardtype[]", 種(ctx, "甲")], ["cardtype[]", 種(ctx, "乙")]]);
  await ctx.expected(async () => {
    const want = 呼び("018", "A");
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.total_count, "総件数").toBe(1);
    expect.soft(並べ(ids(r)), `カード配列のカードの識別子（${want.join("・")}）`).toEqual(期待の識別子(ctx, want));
  });
});
caseTest("IT-A15-08-019", async (ctx) => {
  const r = await 送って見る(ctx, "019", [名("019"), ["cardtype[]", 種(ctx, "甲")], ["cardtype[]", 種(ctx, "乙")], ["cardtype_condition", "OR"]]);
  await ctx.expected(async () => {
    const want = 呼び("019", "A", "B");
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.total_count, "総件数").toBe(2);
    expect.soft(並べ(ids(r)), `カード配列のカードの識別子（${want.join("・")}）`).toEqual(期待の識別子(ctx, want));
  });
});
caseTest("IT-A15-08-020", async (ctx) => {
  const r = await 送って見る(ctx, "020", [名("020"), ["subtype[]", 副(ctx, "甲")], ["subtype[]", 副(ctx, "乙")]]);
  await ctx.expected(async () => {
    const want = 呼び("020", "A");
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.total_count, "総件数").toBe(1);
    expect.soft(並べ(ids(r)), `カード配列のカードの識別子（${want.join("・")}）`).toEqual(期待の識別子(ctx, want));
  });
});
caseTest("IT-A15-08-021", async (ctx) => {
  const r = await 送って見る(ctx, "021", [名("021"), ["subtype[]", 副(ctx, "甲")], ["subtype[]", 副(ctx, "乙")], ["subtype_condition", "OR"]]);
  await ctx.expected(async () => {
    const want = 呼び("021", "A", "B");
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.total_count, "総件数").toBe(2);
    expect.soft(並べ(ids(r)), `カード配列のカードの識別子（${want.join("・")}）`).toEqual(期待の識別子(ctx, want));
  });
});
caseTest("IT-A15-08-022", async (ctx) => {
  const r = await 送って見る(ctx, "022", [名("022"), ["rarity[]", 稀(ctx, "甲")]]);
  await ctx.expected(async () => {
    const want = 呼び("022", "A");
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.total_count, "総件数").toBe(1);
    expect.soft(並べ(ids(r)), `カード配列のカードの識別子（${want.join("・")}）`).toEqual(期待の識別子(ctx, want));
  });
});
caseTest("IT-A15-08-023", async (ctx) => {
  const r = await 送って見る(ctx, "023", [名("023"), ["rarity[]", 稀(ctx, "甲")], ["rarity[]", 稀(ctx, "乙")], ["rarity_condition", "OR"]]);
  await ctx.expected(async () => {
    const want = 呼び("023", "A", "B");
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.total_count, "総件数").toBe(2);
    expect.soft(並べ(ids(r)), `カード配列のカードの識別子（${want.join("・")}）`).toEqual(期待の識別子(ctx, want));
  });
});
caseTest("IT-A15-08-024", async (ctx) => {
  const r = await 送って見る(ctx, "024", [名("024"), ["color[]", 色(ctx, "赤")], ["color[]", 色(ctx, "青")], ["color_condition", "AND"]]);
  await ctx.expected(async () => {
    const want = 呼び("024", "A");
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.total_count, "総件数").toBe(1);
    expect.soft(並べ(ids(r)), `カード配列のカードの識別子（${want.join("・")}）`).toEqual(期待の識別子(ctx, want));
  });
});
caseTest("IT-A15-08-025", async (ctx) => {
  const r = await 送って見る(ctx, "025", [名("025"), ["color[]", 色(ctx, "赤")], ["color[]", 色(ctx, "青")], ["color_condition", "OR"]]);
  await ctx.expected(async () => {
    const want = 呼び("025", "A", "B");
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.total_count, "総件数").toBe(2);
    expect.soft(並べ(ids(r)), `カード配列のカードの識別子（${want.join("・")}）`).toEqual(期待の識別子(ctx, want));
  });
});
caseTest("IT-A15-08-026", async (ctx) => {
  const r = await 送って見る(ctx, "026", [名("026"), ["exclude_color[]", 色(ctx, "赤")]]);
  await ctx.expected(async () => {
    const want = 呼び("026", "C", "D");
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.total_count, "総件数").toBe(2);
    expect.soft(並べ(ids(r)), `カード配列のカードの識別子（${want.join("・")}）`).toEqual(期待の識別子(ctx, want));
  });
});
caseTest("IT-A15-08-027", async (ctx) => {
  const r = await 送って見る(ctx, "027", [名("027"), ["format", 形式(ctx)]]);
  await ctx.expected(async () => {
    const want = 呼び("027", "A", "B");
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.total_count, "総件数").toBe(2);
    expect.soft(並べ(ids(r)), `カード配列のカードの識別子（${want.join("・")}）`).toEqual(期待の識別子(ctx, want));
  });
});
caseTest("IT-A15-08-028", async (ctx) => {
  const r = await 送って見る(ctx, "028", [名("028"), ["format", 形式(ctx)], ["illegal_condition", "true"]]);
  await ctx.expected(async () => {
    const want = 呼び("028", "A", "B", "C");
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.total_count, "総件数").toBe(3);
    expect.soft(並べ(ids(r)), `カード配列のカードの識別子（${want.join("・")}）`).toEqual(期待の識別子(ctx, want));
  });
});
caseTest("IT-A15-08-029", async (ctx) => {
  const r = await 送って見る(ctx, "029", [名("029"), ["mana_value_from", "2"], ["mana_value_to", "4"], ["power_from", "2"], ["power_to", "4"], ["toughness_from", "2"], ["toughness_to", "4"], ["loyalty_from", "2"], ["loyalty_to", "4"]]);
  await ctx.expected(async () => {
    const want = 呼び("029", "A");
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.total_count, "総件数").toBe(1);
    expect.soft(並べ(ids(r)), `カード配列のカードの識別子（${want.join("・")}）`).toEqual(期待の識別子(ctx, want));
  });
});
caseTest("IT-A15-08-030", async (ctx) => {
  const r = await 送って見る(ctx, "030", [名("030"), ["mana_value[]", "3"], ["power[]", "2"], ["toughness[]", "2"], ["loyalty[]", "4"]]);
  await ctx.expected(async () => {
    const want = 呼び("030", "A");
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.total_count, "総件数").toBe(1);
    expect.soft(並べ(ids(r)), `カード配列のカードの識別子（${want.join("・")}）`).toEqual(期待の識別子(ctx, want));
  });
});
caseTest("IT-A15-08-031", async (ctx) => {
  const r = await 送って見る(ctx, "031", [名("031"), ["exclude_mana_value[]", "3"], ["exclude_power[]", "2"], ["exclude_toughness[]", "2"], ["exclude_loyalty[]", "4"]]);
  await ctx.expected(async () => {
    const want = 呼び("031", "A");
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.total_count, "総件数").toBe(1);
    expect.soft(並べ(ids(r)), `カード配列のカードの識別子（${want.join("・")}）`).toEqual(期待の識別子(ctx, want));
  });
});
caseTest("IT-A15-08-032", async (ctx) => {
  const r = await 送って見る(ctx, "032", [名("032"), ["illustrator", "A1508-032-Alice"]]);
  await ctx.expected(async () => {
    const want = 呼び("032", "A", "B");
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.total_count, "総件数").toBe(2);
    expect.soft(並べ(ids(r)), `カード配列のカードの識別子（${want.join("・")}）`).toEqual(期待の識別子(ctx, want));
  });
});
caseTest("IT-A15-08-033", async (ctx) => {
  const r = await 送って見る(ctx, "033", [名("033"), ["cardtype[]", 種(ctx, "甲")], ["color[]", 色(ctx, "赤")], ["mana_value_from", "2"], ["mana_value_to", "4"], ["rarity[]", 稀(ctx, "甲")]]);
  await ctx.expected(async () => {
    const want = 呼び("033", "A");
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.total_count, "総件数").toBe(1);
    expect.soft(並べ(ids(r)), `カード配列のカードの識別子（${want.join("・")}）`).toEqual(期待の識別子(ctx, want));
  });
});
caseTest("IT-A15-08-043", async (ctx) => {
  const r = await 送って見る(ctx, "043", [名("043"), ["sort", "mana_value"], ["order", "asc"], ["per_page", "10"], ["page", "3"]]);
  await ctx.expected(async () => {
    const want = 範囲("043", 21, 25);
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.total_count, "総件数").toBe(25);
    expect.soft(並べ(ids(r)), `カード配列のカードの識別子（${want.join("・")}）`).toEqual(期待の識別子(ctx, want));
  });
});
caseTest("IT-A15-08-046", async (ctx) => {
  const r = await 送って見る(ctx, "046", [名("046"), ["sort", "mana_value"], ["order", "asc"]]);
  await ctx.expected(async () => {
    const want = 範囲("046", 1, 20);
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.total_count, "総件数").toBe(25);
    expect.soft(並べ(ids(r)), `カード配列のカードの識別子（${want.join("・")}）`).toEqual(期待の識別子(ctx, want));
  });
});
caseTest("IT-A15-08-050", async (ctx) => {
  const r = await 送って見る(ctx, "050", [名("050")]);
  await ctx.expected(async () => {
    const want = ["〔カードID-A1508-050〕"];
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.total_count, "総件数").toBe(1);
    expect.soft(並べ(ids(r)), `カード配列のカードの識別子（${want.join("・")}）`).toEqual(期待の識別子(ctx, want));
  });
});
caseTest("IT-A15-08-060", async (ctx) => {
  const r = await 送って見る(ctx, "060", [名("060"), ["color[]", 色(ctx, "赤")], ["color[]", 色(ctx, "青")]]);
  await ctx.expected(async () => {
    const want = 呼び("060", "A");
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.total_count, "総件数").toBe(1);
    expect.soft(並べ(ids(r)), `カード配列のカードの識別子（${want.join("・")}）`).toEqual(期待の識別子(ctx, want));
  });
});
caseTest("IT-A15-08-061", async (ctx) => {
  const r = await 送って見る(ctx, "061", [名("061"), ["rarity[]", 稀(ctx, "甲")], ["rarity[]", 稀(ctx, "乙")]]);
  await ctx.expected(async () => {
    const want = 呼び("061", "A");
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.total_count, "総件数").toBe(1);
    expect.soft(並べ(ids(r)), `カード配列のカードの識別子（${want.join("・")}）`).toEqual(期待の識別子(ctx, want));
  });
});
caseTest("IT-A15-08-079", async (ctx) => {
  const r = await 送って見る(ctx, "079", [名("079"), ["cardtype[]", 種(ctx, "甲")], ["cardtype_condition", "NOT"]]);
  await ctx.expected(async () => {
    const want = 呼び("079", "B", "D");
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.total_count, "総件数").toBe(2);
    expect.soft(並べ(ids(r)), `カード配列のカードの識別子（${want.join("・")}）`).toEqual(期待の識別子(ctx, want));
  });
});
caseTest("IT-A15-08-080", async (ctx) => {
  const r = await 送って見る(ctx, "080", [名("080"), ["subtype[]", 副(ctx, "甲")], ["subtype_condition", "NOT"]]);
  await ctx.expected(async () => {
    const want = 呼び("080", "B", "D");
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.total_count, "総件数").toBe(2);
    expect.soft(並べ(ids(r)), `カード配列のカードの識別子（${want.join("・")}）`).toEqual(期待の識別子(ctx, want));
  });
});
caseTest("IT-A15-08-081", async (ctx) => {
  const r = await 送って見る(ctx, "081", [名("081"), ["rarity[]", 稀(ctx, "甲")], ["rarity_condition", "NOT"]]);
  await ctx.expected(async () => {
    const want = 呼び("081", "B", "C");
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.total_count, "総件数").toBe(2);
    expect.soft(並べ(ids(r)), `カード配列のカードの識別子（${want.join("・")}）`).toEqual(期待の識別子(ctx, want));
  });
});
caseTest("IT-A15-08-083", async (ctx) => {
  const r = await 送って見る(ctx, "083", [名("083"), ["power_from", "3"]]);
  await ctx.expected(async () => {
    const want = 呼び("083", "A", "C");
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.total_count, "総件数").toBe(2);
    expect.soft(並べ(ids(r)), `カード配列のカードの識別子（${want.join("・")}）`).toEqual(期待の識別子(ctx, want));
  });
});
caseTest("IT-A15-08-084", async (ctx) => {
  const r = await 送って見る(ctx, "084", [名("084"), ["toughness_from", "3"]]);
  await ctx.expected(async () => {
    const want = 呼び("084", "A", "C");
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.total_count, "総件数").toBe(2);
    expect.soft(並べ(ids(r)), `カード配列のカードの識別子（${want.join("・")}）`).toEqual(期待の識別子(ctx, want));
  });
});
caseTest("IT-A15-08-085", async (ctx) => {
  const r = await 送って見る(ctx, "085", [名("085"), ["loyalty_from", "3"]]);
  await ctx.expected(async () => {
    const want = 呼び("085", "A", "C");
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.total_count, "総件数").toBe(2);
    expect.soft(並べ(ids(r)), `カード配列のカードの識別子（${want.join("・")}）`).toEqual(期待の識別子(ctx, want));
  });
});

// --- 応答の形・値を確かめるケース ---
caseTest("IT-A15-08-002", async (ctx) => {
  const r = await 送って見る(ctx, "002", [名("002")]);
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.code, "処理結果コード（整数の200）").toBe(200);
    expect.soft(/"code"\s*:\s*200(?![.\d])/.test(r.本文), "処理結果コードが整数で書かれている（応答本体の文字）").toBe(true);
    expect.soft(Number.isInteger(r.json?.total_count) && r.json?.total_count === 1, "総件数が整数の1").toBe(true);
    expect.soft(Array.isArray(r.json?.cards) && r.cards.length === 1, "カード配列が配列で1件").toBe(true);
    const c = r.cards[0] ?? {};
    const 数の配列 = (v: unknown) => Array.isArray(v) && v.every((x) => typeof x === "number");
    expect.soft(Number.isInteger(c.id), "カードの識別子（整数）").toBe(true);
    expect.soft(typeof c.name_jp, "カードの日本語名（文字列）").toBe("string");
    expect.soft(typeof c.name_en, "カードの英語名（文字列）").toBe("string");
    expect.soft(数の配列(c.cardtypes), "カード種別（数値の配列）").toBe(true);
    expect.soft(数の配列(c.colors), "色（数値の配列）").toBe(true);
    expect.soft(/"mana_value"\s*:\s*-?\d+(?![.\d])/.test(r.本文), `マナ総量（整数）: 応答本体では ${/"mana_value"\s*:\s*[^,}]*/.exec(r.本文)?.[0] ?? "（項目なし）"}`).toBe(true);
    expect.soft(Number.isInteger(c.is_attraction), "アトラクション区分（整数）").toBe(true);
    expect.soft(Number.isInteger(c.is_sticker), "ステッカー区分（整数）").toBe(true);
    expect.soft(typeof c.image_jp, "日本語のカード画像URL（文字列）").toBe("string");
    expect.soft(typeof c.image_en, "英語のカード画像URL（文字列）").toBe("string");
  });
});
caseTest("IT-A15-08-003", async (ctx) => {
  const r = await 送って見る(ctx, "003", [名("003")]);
  await ctx.expected(async () => {
    const c = r.cards[0] ?? {};
    expect.soft(r.cards.length, "カード配列の件数").toBe(1);
    expect.soft(c.id, "カードの識別子").toBe(番号(ctx, "〔カードID-A1508-003〕"));
    expect.soft(c.name_jp, "カードの日本語名").toBe(`${検索語("003")}-炎の竜`);
    expect.soft(c.name_en, "カードの英語名").toBe(`${検索語("003")}-Fire Dragon`);
    expect.soft(c.mana_value, "マナ総量").toBe(4);
  });
});
caseTest("IT-A15-08-004", async (ctx) => {
  const r = await 送って見る(ctx, "004", [名("004")]);
  await ctx.expected(async () => {
    const c = r.cards[0] ?? {};
    expect.soft(r.cards.length, "カード配列の件数").toBe(1);
    expect.soft(Array.isArray(c.cardtypes) ? 並べ(c.cardtypes as number[]) : c.cardtypes, "カード種別（甲・乙の識別子を過不足なく含む数値の配列）").toEqual(並べ([Number(種(ctx, "甲")), Number(種(ctx, "乙"))]));
    expect.soft(Array.isArray(c.colors) ? 並べ(c.colors as number[]) : c.colors, "色（赤・青の識別子を過不足なく含む数値の配列）").toEqual(並べ([Number(色(ctx, "赤")), Number(色(ctx, "青"))]));
  });
});
caseTest("IT-A15-08-005", async (ctx) => {
  const r = await 送って見る(ctx, "005", [名("005")]);
  await ctx.expected(async () => {
    const of = (k: string) => r.cards.find((c) => c.id === 番号(ctx, `〔カードID-A1508-005${k}〕`)) ?? {};
    expect.soft([of("A").is_attraction, of("A").is_sticker], "〔カードID-A1508-005A〕のアトラクション区分・ステッカー区分").toEqual([1, 0]);
    expect.soft([of("B").is_attraction, of("B").is_sticker], "〔カードID-A1508-005B〕のアトラクション区分・ステッカー区分").toEqual([0, 1]);
    expect.soft([of("C").is_attraction, of("C").is_sticker], "〔カードID-A1508-005C〕のアトラクション区分・ステッカー区分").toEqual([0, 0]);
  });
});
caseTest("IT-A15-08-006", async (ctx) => {
  const r = await 送って見る(ctx, "006", [名("006")]);
  await ctx.expected(async () => {
    const c = r.cards[0] ?? {};
    expect.soft(c.image_jp, "日本語のカード画像URL").toBe("https://example.invalid/a1508-006/ja.jpg");
    expect.soft(c.image_en, "英語のカード画像URL").toBe("https://example.invalid/a1508-006/en.jpg");
  });
});
caseTest("IT-A15-08-007", async (ctx) => {
  const r = await 送って見る(ctx, "007", [名("007")]);
  await ctx.expected(async () => {
    const of = (k: string) => r.cards.find((c) => c.id === 番号(ctx, `〔カードID-A1508-007${k}〕`)) ?? {};
    expect.soft(値を持たない(of("A").image_en), `〔カードID-A1508-007A〕の英語のカード画像URLが値を持たない（実際 ${JSON.stringify(of("A").image_en)}）`).toBe(true);
    expect.soft(of("A").image_jp, "〔カードID-A1508-007A〕の日本語のカード画像URL").toBe("https://example.invalid/a1508-007/ja.jpg");
    expect.soft(値を持たない(of("B").image_jp) && 値を持たない(of("B").image_en), `〔カードID-A1508-007B〕の日本語・英語のカード画像URLがいずれも値を持たない（実際 ${JSON.stringify([of("B").image_jp, of("B").image_en])}）`).toBe(true);
  });
});
caseTest("IT-A15-08-045", async (ctx) => {
  const r = await 送って見る(ctx, "045", [名("045"), ["subtype[]", 副(ctx, "甲")], ["subtype[]", 副(ctx, "乙")], ["subtype_condition", "OR"]]);
  await ctx.expected(async () => {
    expect.soft(r.json?.total_count, "総件数").toBe(2);
    expect.soft(並べ(ids(r)), "カード配列のカードの識別子（045A・045B）").toEqual(期待の識別子(ctx, 呼び("045", "A", "B")));
    expect.soft(ids(r).filter((i) => i === 番号(ctx, "〔カードID-A1508-045A〕")).length, "〔カードID-A1508-045A〕がカード配列に1件だけ").toBe(1);
  });
});
caseTest("IT-A15-08-047", async (ctx) => {
  const r = await 送って見る(ctx, "047", [名("047"), ["per_page", "150"]]);
  await ctx.expected(async () => {
    expect.soft(r.json?.total_count, "総件数").toBe(101);
    expect.soft(r.cards.length, "カード配列の件数（100に丸められる）").toBe(100);
  });
});
caseTest("IT-A15-08-086", async (ctx) => {
  const r = await 送って見る(ctx, "086", [名("086"), ["sort", "mana_value"], ["order", "asc"], ["per_page", "10"], ["page", "4"]]);
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.total_count, "総件数").toBe(25);
    expect.soft(Array.isArray(r.json?.cards) ? (r.json!.cards as unknown[]).length : "配列でない", "カード配列が空の配列").toBe(0);
  });
});
caseTest("IT-A15-08-076", async (ctx) => {
  const r = await 送って見る(ctx, "076", [名("076")]);
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(Object.keys(r.json ?? {}).sort(), "応答本文の最上位の項目が処理結果コード・総件数・カード配列の3つだけ").toEqual(["cards", "code", "total_count"]);
  });
});

caseTest("IT-A15-08-039", async (ctx) => {
  supplement(`カード名の検索語は、シードと同じ実行の印を付けた「${検索語("039")}」で送る（正本の「A1508-039」）`);
  let a!: 応答; let b!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => {
    a = await 検索する(ctx.page, "要求A（並び替えキー・並び順なし）", [名("039")]);
    await ctx.capture("要求Aの応答");
    b = await 検索する(ctx.page, "要求B（並び替えキーに色順・並び順に昇順）", [名("039"), ["sort", "color"], ["order", "asc"]]);
  });
  await ctx.step(3, async () => { note(`要求Aのカード配列の並び: ${ids(a).join("・")}／要求Bのカード配列の並び: ${ids(b).join("・")}`); });
  await ctx.expected(async () => {
    const want = 並べ(呼び("039", "A", "B", "C", "D").map((n) => 番号(ctx, n)));
    expect.soft(並べ(ids(a)), "要求Aのカード配列が 039A〜039D の4件").toEqual(want);
    expect.soft(ids(a), "要求Aと要求Bのカード配列が同じ並び").toEqual(ids(b));
  });
});

caseTest("IT-A15-08-044", async (ctx) => {
  supplement(`カード名の検索語は、シードと同じ実行の印を付けた「${検索語("044")}」で送る（正本の「A1508-044」）`);
  const p: 応答[] = [];
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => {
    for (const n of [1, 2, 3]) {
      p.push(await 検索する(ctx.page, `ページ${n}`, [名("044"), ["sort", "mana_value"], ["order", "asc"], ["per_page", "5"], ["page", String(n)]]));
      if (n < 3) await ctx.capture(`ページ${n}の応答`);
    }
  });
  await ctx.step(3, async () => { note(p.map((r, i) => `ページ${i + 1}: 総件数 ${String(r.json?.total_count)}・${ids(r).join("・")}`).join("／")); });
  await ctx.expected(async () => {
    const id = (k: number) => 番号(ctx, `〔カードID-A1508-044-${k}〕`);
    p.forEach((r, i) => expect.soft(r.json?.total_count, `ページ${i + 1}の総件数`).toBe(12));
    expect.soft(p.map((r) => r.cards.length), "ページ1〜3の件数").toEqual([5, 5, 2]);
    expect.soft(並べ(ids(p[2])), "ページ3が 044-11・044-12").toEqual(並べ([id(11), id(12)]));
    expect.soft([id(1), id(2)].every((x) => ids(p[0]).includes(x)), "ページ1にマナ総量1・2のカード（044-1・044-2）").toBe(true);
    expect.soft([id(8), id(9), id(10)].every((x) => ids(p[1]).includes(x)), "ページ2にマナ総量4・5・6のカード（044-8〜044-10）").toBe(true);
    const all = p.flatMap(ids);
    expect.soft(並べ(all), "3ページの和集合が 044-1〜044-12 の12件ちょうど（重複・欠落なし）").toEqual(並べ(Array.from({ length: 12 }, (_, i) => id(i + 1))));
  });
});

caseTest("IT-A15-08-048", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => { r = await 検索する(ctx.page, "カード検索（どのカードにも含まれない名前）", [["name", "A1508-048-該当なし"]]); });
  await ctx.step(3, async () => { note(`応答本体: ${r.本文.slice(0, 500)}`); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.code, "処理結果コード（失敗として扱われない）").toBe(200);
  });
});

caseTest("IT-A15-08-049", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => { r = await 検索する(ctx.page, "カード検索（どのカードにも含まれない名前）", [["name", "A1508-049-該当なし"]]); });
  await ctx.step(3, async () => { note(`応答本体: ${r.本文.slice(0, 500)}`); });
  await ctx.expected(async () => {
    expect.soft(r.json?.total_count, "総件数").toBe(0);
    expect.soft(Array.isArray(r.json?.cards) ? (r.json!.cards as unknown[]).length : "配列でない", "カード配列が空の配列").toBe(0);
  });
});

caseTest("IT-A15-08-052", async (ctx) => {
  supplement(`カード名の検索語は、シードと同じ実行の印を付けた「${検索語("052")}」で送る（正本の「A1508-052」）`);
  const a = ctx.notes.get("〔カードID-A1508-052A〕"), b = ctx.notes.get("〔カードID-A1508-052B〕");
  let r!: 応答;
  let 前 = { 件数: 0, A: "", B: "" }, 後 = { 件数: 0, A: "", B: "" };
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => {
    前 = { 件数: カードの件数(), A: カードの更新日時(a), B: カードの更新日時(b) };
    r = await 検索する(ctx.page, "カード検索", [名("052")]);
    後 = { 件数: カードの件数(), A: カードの更新日時(a), B: カードの更新日時(b) };
  });
  await ctx.step(3, async () => {
    note(`DB（読むだけ）: 検索の前 カード全体 ${前.件数}件・052A ${前.A}・052B ${前.B}／検索の後 カード全体 ${後.件数}件・052A ${後.A}・052B ${後.B}・応答 HTTP ${r.ステータス}`);
    note("カード全体の登録件数は、共有の開発環境でほかの方がカードを登録すると変わる。検索の直前と直後に読んで比べた");
  });
  await ctx.expected(async () => {
    expect.soft(後.件数, "カード全体の登録件数が検索の前後で変わらない").toBe(前.件数);
    expect.soft(後.A, "〔カードID-A1508-052A〕の更新日時（2026-01-01 00:00:00 のまま）").toBe("2026-01-01 00:00:00");
    expect.soft(後.B, "〔カードID-A1508-052B〕の更新日時（2026-01-01 00:00:00 のまま）").toBe("2026-01-01 00:00:00");
  });
});
