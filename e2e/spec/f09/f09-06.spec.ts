/**
 * F09-06 デッキリスト詳細（フロント・デッキ検索）。正本: cases/F09-06_test_cases.tsv
 *
 * 実装しないケース（理由）:
 * - 026・027: 手順の中で、DBの画像の候補の特殊セットを書き換える（DB への書き込み）
 * - 029: デッキのフォーマットを未設定にする準備をDBへ直接行う（デッキ編集画面ではフォーマットが必須）
 * - 051・054・063・064: 旧デッキIDをDBへ直接設定する準備（画面で指定できない）
 *
 * どのケースも、シード表の「敗数『未設定』をDBへ直接設定する」は行わずに作ったデッキで確かめる（seeds/f09-06.ts の冒頭。判定は条件付き）。
 * 決め打ちの名前（デッキ名・カード名など）は実行の印つきの値（seeds/f09-06.ts の N()）で読む。
 */
import fs from "node:fs";
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { DeckShowPage, 一括購入のカードリスト, 検索条件の選択, 結果のデッキID } from "../../pages/front/f09_06_deck_show";
import { 情報欄 } from "../../pages/front/m15_05_deck_show";
import { DeckSearchModal } from "../../pages/front/f09_01_deck_top";
import { 画像のファイル名 } from "../../pages/admin/f09_06_setup";
import { 行数と更新日時 } from "../../db/f09_06";
import { アリーナ対応, N } from "../../seeds/f09-06";
import "../../seeds/f09-06";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const デッキID = (ctx: CaseCtx, 記号: string) => ctx.notes.get(`〔デッキID-F0906-${記号}〕`);

// ---------------------------------------------------------------------------
// 表示の可否（HTTP 404）
// ---------------------------------------------------------------------------

/** 404 で、デッキリスト詳細（情報欄）が出ないこと。控えたデッキのケースは、そのデッキ名も画面に出ないこと */
function 表示されないケース(ケース: "001" | "002" | "003" | "004") {
  return async (ctx: CaseCtx) => {
    const v = new DeckShowPage(ctx.page);
    let s = 0;
    await ctx.step(1, async () => {
      const r = ケース === "001" ? await v.識別子なしで開く() : await v.開く(ケース === "002" ? "590600299" : デッキID(ctx, ケース));
      s = r?.status() ?? 0;
    });
    await ctx.expected(async () => {
      expect.soft(s, "応答のHTTPステータス").toBe(404);
      await expect.soft(v.情報欄の領域, "デッキリスト詳細の情報欄").toHaveCount(0);
      if (ケース === "003" || ケース === "004") await expect.soft(ctx.page.getByText(N(ケース, "デッキ")), `デッキ名「${N(ケース, "デッキ")}」の表示`).toHaveCount(0);
    });
  };
}
caseTest("IT-F09-06-001", 表示されないケース("001"));
caseTest("IT-F09-06-002", 表示されないケース("002"));
caseTest("IT-F09-06-003", 表示されないケース("003"));
caseTest("IT-F09-06-004", 表示されないケース("004"));

caseTest("IT-F09-06-005", async (ctx) => {
  let s = 0;
  await ctx.step(1, async () => { s = (await new DeckShowPage(ctx.page).開く(デッキID(ctx, "005")))?.status() ?? 0; });
  await ctx.expected(async () => {
    expect.soft(s, "応答のHTTPステータス（デッキリスト詳細が表示される）").toBe(200);
    expect.soft((await 情報欄(ctx.page))["デッキ名"], "情報欄のデッキ名").toBe(N("005", "デッキ"));
  });
});

// ---------------------------------------------------------------------------
// デッキリスト非公開
// ---------------------------------------------------------------------------

caseTest("IT-F09-06-006", async (ctx) => {
  await ctx.step(1, async () => { await new DeckShowPage(ctx.page).開く(デッキID(ctx, "006")); });
  await ctx.expected(async () => {
    const i = await 情報欄(ctx.page);
    expect.soft(i["デッキ名"], "情報欄のデッキ名").toBe(N("006", "デッキ"));
    expect.soft(i["プレイヤー"], "情報欄のプレイヤー").toBe(N("006", "選手"));
  });
});

caseTest("IT-F09-06-007", async (ctx) => {
  const v = new DeckShowPage(ctx.page);
  await ctx.step(1, async () => { await v.開く(デッキID(ctx, "007")); });
  await ctx.expected(async () => {
    await expect(v.情報欄の領域, "デッキリスト詳細が表示されている（情報欄）").toBeVisible();
    const c = await v.表示されたカード();
    expect.soft(c.行, "カードリストに並ぶカードの行の数").toBe(0);
    expect.soft(c.画像, "カードの画像の数").toBe(0);
  });
});

caseTest("IT-F09-06-008", async (ctx) => {
  const v = new DeckShowPage(ctx.page);
  await ctx.step(1, async () => { await v.開く(デッキID(ctx, "008")); });
  await ctx.expected(async () => {
    expect(await v.カードリストの文(), "カードリストの領域の文").toContain("デッキリスト非公開");
  });
});

// ---------------------------------------------------------------------------
// カードリストの区画
// ---------------------------------------------------------------------------

type 区画の確かめ = { ケース: string; 枚数: [string, number | null][]; 含まない?: [string, string][]; 含む?: [string, string][] };

function 区画のケース(t: 区画の確かめ, 手順2 = true) {
  return async (ctx: CaseCtx) => {
    const v = new DeckShowPage(ctx.page);
    await ctx.step(1, async () => { await v.開く(デッキID(ctx, t.ケース)); });
    if (手順2) await ctx.step(2, async () => { await expect(v.カードリスト, "カードリスト").toBeVisible(); });
    await ctx.expected(async () => {
      await expect(v.情報欄の領域, "デッキリスト詳細が表示されている（情報欄）").toBeVisible();
      for (const [区画, n] of t.枚数) {
        if (n === null) expect.soft(await v.区画(区画).count(), `${区画}の区画の数（表示されない）`).toBe(0);
        else expect.soft(await v.区画の枚数(区画), `${区画}の区画の枚数`).toBe(n);
      }
      for (const [区画, 名] of t.含まない ?? []) {
        expect.soft((await v.区画の行(区画)).join(" / "), `${区画}の区画の行（${名}を含まない）`).not.toContain(`《${N(t.ケース, 名)}》`);
      }
      for (const [区画, 文字] of t.含む ?? []) expect.soft((await v.区画の行(区画)).join(" / "), `${区画}の区画の行`).toContain(文字);
    });
  };
}

caseTest("IT-F09-06-009", 区画のケース({ ケース: "009", 枚数: [["サイドボード", 2]], 含まない: [["土地", "山"]] }));
caseTest("IT-F09-06-010", 区画のケース({ ケース: "010", 枚数: [["統率者", 1]], 含まない: [["クリーチャー", "熊"]] }));
caseTest("IT-F09-06-011", 区画のケース({ ケース: "011", 枚数: [["土地", 4]], 含まない: [["クリーチャー", "森熊"]] }));
caseTest("IT-F09-06-012", 区画のケース({ ケース: "012", 枚数: [["クリーチャー", 3]], 含まない: [["呪文", "熊"]] }));
caseTest("IT-F09-06-013", 区画のケース({ ケース: "013", 枚数: [["呪文", 2], ["Unknown", null]] }));
caseTest("IT-F09-06-014", 区画のケース({ ケース: "014", 枚数: [["Unknown", 1]] }));
caseTest("IT-F09-06-015", 区画のケース({ ケース: "015", 枚数: [["統率者", null]] }, false));
caseTest("IT-F09-06-016", 区画のケース({ ケース: "016", 枚数: [["統率者", 1]] }, false));
caseTest("IT-F09-06-017", 区画のケース({ ケース: "017", 枚数: [["Unknown", null]] }, false));

caseTest("IT-F09-06-058", async (ctx) => {
  const v = new DeckShowPage(ctx.page);
  await ctx.step(1, async () => { await v.開く(デッキID(ctx, "058")); });
  await ctx.step(2, async () => { await expect(v.カードリスト, "カードリスト").toBeVisible(); });
  await ctx.expected(async () => {
    await expect.soft(v.区画("メインボード"), "メインボードの区画").toBeVisible();
    expect.soft(await v.区画の枚数("メインボード"), "メインボードの区画の見出しの枚数").not.toBeNull();
  });
});

caseTest("IT-F09-06-059", async (ctx) => {
  const v = new DeckShowPage(ctx.page);
  await ctx.step(1, async () => { await v.開く(デッキID(ctx, "059")); });
  await ctx.step(2, async () => { await expect(v.カードリスト, "カードリスト").toBeVisible(); });
  await ctx.expected(async () => {
    expect((await v.区画の行("Unknown")).join(" / "), "Unknownの区画の行（カードの識別子を持たない採用カード）").toContain("不明なカード");
  });
});

// ---------------------------------------------------------------------------
// カードの画像
// ---------------------------------------------------------------------------

const 画像の名 = (ケース: string, 名 = "術") => [N(ケース, 名), N(ケース, `${名}EN`)];

function 画像の選択(ケース: string, 英語: boolean) {
  return async (ctx: CaseCtx) => {
    const v = new DeckShowPage(ctx.page);
    await ctx.step(1, async () => {
      if (英語) {
        await v.英語に切り替えて開く(デッキID(ctx, ケース));
        note("日本語表示でデッキリスト詳細を開き、画面上部の言語切替（EN）で英語表示に切り替えた（同じデッキの英語表示の画面へ移る）");
        expect(await v.表示言語(), "英語表示に切り替わった").toBe("en");
      } else await v.開く(デッキID(ctx, ケース));
    });
    await ctx.step(2, async () => { await expect(v.page.locator(".mo_visualize").first(), "カードの画像の区画").toBeAttached(); });
    await ctx.expected(async () => {
      const 画像 = await v.画像の状態(画像の名(ケース));
      const 名 = 画像のファイル名(画像.取得元);
      expect.soft(画像.数, `カード『${N(ケース, "術")}』の画像の数`).toBeGreaterThan(0);
      expect.soft(名, `カード『${N(ケース, "術")}』の画像の取得元のファイル名（${画像.取得元}）`).toBe(`f0906-${ケース}-w`);
      expect.soft(名, "使われない画像のファイル名").not.toBe(`f0906-${ケース}-x`);
    });
  };
}

caseTest("IT-F09-06-023", 画像の選択("023", false));
caseTest("IT-F09-06-066", 画像の選択("066", false));
caseTest("IT-F09-06-067", 画像の選択("067", true));
caseTest("IT-F09-06-068", 画像の選択("068", false));
caseTest("IT-F09-06-069", 画像の選択("069", true));
caseTest("IT-F09-06-070", 画像の選択("070", false));
caseTest("IT-F09-06-071", 画像の選択("071", true));
caseTest("IT-F09-06-072", 画像の選択("072", false));
caseTest("IT-F09-06-073", 画像の選択("073", true));
caseTest("IT-F09-06-074", 画像の選択("074", false));
caseTest("IT-F09-06-075", 画像の選択("075", true));
caseTest("IT-F09-06-076", 画像の選択("076", false));
caseTest("IT-F09-06-077", 画像の選択("077", true));

caseTest("IT-F09-06-025", async (ctx) => {
  const v = new DeckShowPage(ctx.page);
  let 前 = "", 開いた画面 = 0, 入口 = "";
  await ctx.step(1, async () => { await v.開く(デッキID(ctx, "025")); });
  await ctx.step(2, async () => {
    const img = ctx.page.locator(".mo_visualize .vOuter img").and(ctx.page.locator(画像の名("025").map((n) => `img[alt="${n}"]`).join(", ")));
    await expect(img.first(), "カードの画像にあたる部分").toBeVisible();
    入口 = (await v.画像の状態(画像の名("025"))).入口;
    前 = ctx.page.url();
    const onPage = () => { 開いた画面 += 1; };
    ctx.page.context().on("page", onPage);
    await img.first().click();
    await ctx.page.waitForTimeout(3_000);
    ctx.page.context().off("page", onPage);
  });
  await ctx.expected(async () => {
    expect.soft(ctx.page.url(), "押したあとの画面のアドレス（移らない）").toBe(前);
    expect.soft(開いた画面, "押して開いた別の画面の数").toBe(0);
    expect.soft(入口, "画像に付いた商品への入口（リンク）").toBe("");
  });
});

function 画像なし(ケース: string, 英語: boolean) {
  return async (ctx: CaseCtx) => {
    const v = new DeckShowPage(ctx.page);
    await ctx.step(1, async () => {
      if (英語) {
        await v.英語に切り替えて開く(デッキID(ctx, ケース));
        note("日本語表示でデッキリスト詳細を開き、画面上部の言語切替（EN）で英語表示に切り替えた");
        expect(await v.表示言語(), "英語表示に切り替わった").toBe("en");
      } else await v.開く(デッキID(ctx, ケース));
    });
    let s = { 数: 0, 取得元: "", 入口: "" };
    await ctx.step(2, async () => { s = await v.画像の状態(画像の名(ケース)); });
    await ctx.expected(async () => {
      expect.soft(s.数, `カード『${N(ケース, "術")}』の画像の数`).toBeGreaterThan(0);
      expect.soft(new URL(s.取得元 || "about:blank", ctx.page.url()).pathname, "画像の取得元（画像なし用の画像）").toMatch(/\/noimg\.png$/);
      expect.soft(s.入口, "画像に付いた商品への入口（リンク）").toBe("");
    });
  };
}
caseTest("IT-F09-06-078", 画像なし("078", false));
caseTest("IT-F09-06-079", 画像なし("079", true));

caseTest("IT-F09-06-057", async (ctx) => {
  const v = new DeckShowPage(ctx.page);
  let A = "";
  await ctx.step(1, async () => {
    await v.開く(デッキID(ctx, "057A"));
    A = 画像のファイル名((await v.画像の状態([N("057", "術A"), N("057", "術AEN")])).取得元);
    note(`デッキAのカードの画像のファイル名: ${A}`);
  });
  const t0 = Date.now();
  await ctx.step(2, async () => {
    await v.開く(デッキID(ctx, "057B"));
    note(`手順1から ${Math.round((Date.now() - t0) / 1000)} 秒以内に開いた（600秒以内）`);
  });
  let B = "";
  await ctx.step(3, async () => { B = 画像のファイル名((await v.画像の状態([N("057", "術B"), N("057", "術BEN")])).取得元); });
  await ctx.expected(async () => {
    expect.soft(B, `デッキBのカード『${N("057", "術B")}』の画像のファイル名`).toBe("f0906-057-b");
    expect.soft(B, "デッキAの画像は使われない").not.toBe("f0906-057-a");
  });
});

caseTest("IT-F09-06-065", async (ctx) => {
  const v = new DeckShowPage(ctx.page);
  const id = () => デッキID(ctx, "065");
  await ctx.step(1, async () => {
    await v.開く(id());
    note(`日本語表示のときの画像のファイル名: ${画像のファイル名((await v.画像の状態(画像の名("065"))).取得元)}`);
  });
  await ctx.step(2, async () => {
    await v.言語を切り替える();
    expect(await v.表示言語(), "英語表示に切り替わった").toBe("en");
  });
  await ctx.step(3, async () => { await v.英語版を開く(id()); });
  await ctx.expected(async () => {
    const 画像 = await v.画像の状態(画像の名("065"));
    const 名 = 画像のファイル名(画像.取得元);
    expect.soft(画像.数, `カード『${N("065", "術")}』の画像の数`).toBeGreaterThan(0);
    expect.soft(名, `英語表示の画面のカード『${N("065", "術")}』の画像の取得元のファイル名（${画像.取得元}）`).toBe("f0906-065-w");
    expect.soft(名, "言語が英語の候補の画像（使われない）").not.toBe("f0906-065-x");
  });
});

// ---------------------------------------------------------------------------
// 情報欄
// ---------------------------------------------------------------------------

caseTest("IT-F09-06-028", async (ctx) => {
  await ctx.step(1, async () => { await new DeckShowPage(ctx.page).開く(デッキID(ctx, "028")); });
  let i: Record<string, string> = {};
  await ctx.step(2, async () => { i = await 情報欄(ctx.page); });
  await ctx.expected(async () => {
    expect.soft(i["デッキ名"], "情報欄のデッキ名").toBe(N("028", "デッキ"));
    expect.soft(i["大会名"], "情報欄の大会").toBe(N("028", "大会"));
    expect.soft(i["フォーマット"], "情報欄のフォーマット").toBe(アリーナ対応);
    expect.soft(i["アーキタイプ"], "情報欄のアーキタイプ").toBe(N("028", "アーキ"));
    expect.soft(i["プレイヤー"], "情報欄のプレイヤー").toBe(N("028", "選手"));
    expect.soft(i["引用元URL"], "情報欄の引用元URL").toBe("https://replace-dev.hareruyamtg.com:8443/f0906-028");
  });
});

function 空欄のケース(k: "030" | "031", 欄: "タグ" | "引用元URL") {
  return async (ctx: CaseCtx) => {
    await ctx.step(1, async () => { await new DeckShowPage(ctx.page).開く(デッキID(ctx, k)); });
    let i: Record<string, string> = {};
    await ctx.step(2, async () => { i = await 情報欄(ctx.page); });
    await ctx.expected(async () => {
      expect.soft(Object.keys(i), "情報欄の見出し").toContain(欄);
      expect.soft(i[欄], `情報欄の${欄}の欄（空）`).toBe("");
    });
  };
}
caseTest("IT-F09-06-030", 空欄のケース("030", "タグ"));
caseTest("IT-F09-06-031", 空欄のケース("031", "引用元URL"));

caseTest("IT-F09-06-060", async (ctx) => {
  await ctx.step(1, async () => { await new DeckShowPage(ctx.page).開く(デッキID(ctx, "060")); });
  let i: Record<string, string> = {};
  await ctx.step(2, async () => { i = await 情報欄(ctx.page); });
  await ctx.expected(async () => {
    const t = i["タグ"] ?? "";
    expect.soft([`${N("060", "タグA")}, ${N("060", "タグB")}`, `${N("060", "タグB")}, ${N("060", "タグA")}`], `情報欄のタグの欄（${t}）`).toContain(t);
  });
});

/** 情報欄のリンクを押してデッキ検索結果へ移る */
function 情報欄から検索(ケース: string, 見出し: string, 名: string, 見る: (ctx: CaseCtx) => Promise<void>) {
  return async (ctx: CaseCtx) => {
    const v = new DeckShowPage(ctx.page);
    await ctx.step(1, async () => { await v.開く(デッキID(ctx, ケース)); });
    await ctx.step(2, async () => { await v.押して移る(v.情報欄のリンク(見出し, N(ケース, 名)), `情報欄の${見出し}『${N(ケース, 名)}』`); });
    await ctx.expected(async () => {
      expect.soft(new URL(ctx.page.url()).pathname, "移った先（デッキ検索結果）").toMatch(/\/deck\/result\/$/);
      await 見る(ctx);
    });
  };
}
const 入力欄 = (ctx: CaseCtx) => new DeckSearchModal(ctx.page).入力欄の状態();

caseTest("IT-F09-06-032", 情報欄から検索("032", "大会名", "大会", async (ctx) => {
  expect.soft((await 入力欄(ctx)).大会名, "大会名の検索条件").toBe(N("032", "大会"));
}));
caseTest("IT-F09-06-033", 情報欄から検索("033", "アーキタイプ", "アーキ", async (ctx) => {
  expect.soft((await 検索条件の選択(ctx.page)).アーキタイプ, "アーキタイプの検索条件で選ばれているアーキタイプ").toEqual([N("033", "アーキ")]);
}));
caseTest("IT-F09-06-034", 情報欄から検索("034", "プレイヤー", "選手", async (ctx) => {
  expect.soft((await 入力欄(ctx)).プレイヤー名, "プレイヤー名の検索条件").toBe(N("034", "選手"));
}));
caseTest("IT-F09-06-035", 情報欄から検索("035", "タグ", "タグA", async (ctx) => {
  expect.soft((await 検索条件の選択(ctx.page)).タグ, "タグの検索条件で選ばれているタグ").toEqual([N("035", "タグA")]);
}));
caseTest("IT-F09-06-061", 情報欄から検索("061", "タグ", "タグB", async (ctx) => {
  expect.soft((await 検索条件の選択(ctx.page)).タグ, "タグの検索条件で選ばれているタグ").toEqual([N("061", "タグB")]);
}));

// ---------------------------------------------------------------------------
// 画面下部の導線
// ---------------------------------------------------------------------------

function 同じ〇〇の一覧(ケース: string, 導線: "大会" | "アーキタイプ") {
  return async (ctx: CaseCtx) => {
    const v = new DeckShowPage(ctx.page);
    await ctx.step(1, async () => { await v.開く(デッキID(ctx, `${ケース}A`)); });
    await ctx.step(2, async () => {
      if (導線 === "大会") await v.押して移る(v.同じ大会のデッキを見る, "同じ大会のデッキを見る");
      else await v.押して移る(v.同じアーキタイプのデッキを見る, "同じアーキタイプのデッキを見る");
    });
    let ids: string[] = [];
    await ctx.step(3, async () => { ids = await 結果のデッキID(ctx.page); });
    await ctx.expected(async () => {
      const A = デッキID(ctx, `${ケース}A`), B = デッキID(ctx, `${ケース}B`), C = デッキID(ctx, `${ケース}C`);
      expect.soft([...ids].sort(), "検索結果の一覧のデッキID（2件）").toEqual([A, B].sort());
      expect.soft(ids, "別のデッキ（表示されない）").not.toContain(C);
    });
  };
}
caseTest("IT-F09-06-036", 同じ〇〇の一覧("036", "大会"));
caseTest("IT-F09-06-039", 同じ〇〇の一覧("039", "アーキタイプ"));
caseTest("IT-F09-06-062", 同じ〇〇の一覧("062", "大会"));

caseTest("IT-F09-06-037", async (ctx) => {
  const v = new DeckShowPage(ctx.page);
  await ctx.step(1, async () => { await v.開く(デッキID(ctx, "037")); });
  await ctx.step(2, async () => { await v.押して移る(v.同じ大会のデッキを見る, "同じ大会のデッキを見る"); });
  let 大会名 = "";
  await ctx.step(3, async () => { 大会名 = (await 入力欄(ctx)).大会名; });
  await ctx.expected(async () => { expect(大会名, "大会名の検索条件").toBe(N("037", "EVENT")); });
});

caseTest("IT-F09-06-038", async (ctx) => {
  const v = new DeckShowPage(ctx.page);
  await ctx.step(1, async () => { await v.開く(デッキID(ctx, "038")); });
  await ctx.step(2, async () => { await v.押して移る(v.同じアーキタイプのデッキを見る, "同じアーキタイプのデッキを見る"); });
  let 選択: string[] = [];
  await ctx.step(3, async () => { 選択 = (await 検索条件の選択(ctx.page)).アーキタイプ; });
  await ctx.expected(async () => { expect(選択, "アーキタイプの検索条件で選ばれているアーキタイプ").toEqual([N("038", "アーキ")]); });
});

caseTest("IT-F09-06-040", async (ctx) => {
  const v = new DeckShowPage(ctx.page);
  await ctx.step(1, async () => { await v.開く(デッキID(ctx, "040")); });
  await ctx.step(2, async () => { await v.押して移る(v.一括購入, "このデッキを一括購入する"); });
  let 行: string[] = [];
  await ctx.step(3, async () => { 行 = await 一括購入のカードリスト(ctx.page); });
  await ctx.expected(async () => { expect(行, "デッキ一括購入画面のカードリスト欄の行").toContain(`4 ${N("040", "MOUNTAIN")}`); });
});

/** 日本時間の今日の6か月前の日付「yyyy/mm/dd」（画面の開催日時の初期値の書式） */
function 六か月前(): string {
  const [y, m, d] = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date()).split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1 - 6, d));
  if (t.getUTCDate() !== d) t.setUTCDate(0); // 月末の繰り上がりは前の月の末日
  return t.toISOString().slice(0, 10).replace(/-/g, "/");
}

caseTest("IT-F09-06-041", async (ctx) => {
  const v = new DeckShowPage(ctx.page);
  await ctx.step(1, async () => { await v.開く(デッキID(ctx, "041")); });
  await ctx.step(2, async () => { await v.押して移る(v.戻る, "戻る"); });
  let s: Awaited<ReturnType<DeckSearchModal["入力欄の状態"]>> | null = null;
  let 選択: Awaited<ReturnType<typeof 検索条件の選択>> | null = null;
  await ctx.step(3, async () => {
    note("検索条件の入力欄は、画面上部の「詳細検索」で開くデッキ詳細検索の欄にある。欄の値を読んだ");
    s = await 入力欄(ctx);
    選択 = await 検索条件の選択(ctx.page);
  });
  await ctx.expected(async () => {
    expect.soft(new URL(ctx.page.url()).pathname, "移った先（デッキ検索TOP）").toMatch(/^\/(ja\/)?deck\/$/);
    note(`開催日時の開始の初期値は、画面の日付の書式（yyyy/mm/dd）で今日の6か月前（${六か月前()}）として比べた`);
    expect.soft(s!.開催日開始, "開催日時の開始（今日の6か月前）").toBe(六か月前());
    expect.soft(選択!.成績, "成績").toBe("掲載デッキすべて");
    expect.soft(選択!.公開, "公開/非公開").toBe("非公開リストを含む");
    expect.soft(s!.選ばれたフォーマット, "フォーマット（選ばれた数）").toBe(0);
    expect.soft(s!.アーキタイプ, "アーキタイプ").toBe("");
    expect.soft(s!.開催日終了, "開催日時の終了").toBe("");
    expect.soft(s!.参加人数下限, "参加人数の下限").toBe("");
    expect.soft(s!.参加人数上限, "参加人数の上限").toBe("");
    expect.soft(s!.選ばれたタグ, "タグ（選ばれた数）").toBe(0);
    expect.soft(s!.カード名, "カード名").toBe("");
    expect.soft(s!.プレイヤー名, "プレイヤー名").toBe("");
    expect.soft(s!.大会名, "大会名").toBe("");
  });
});

// ---------------------------------------------------------------------------
// 書き出し
// ---------------------------------------------------------------------------

const MO = "Magic Online用テキスト", ARENA = "アリーナ用インポートテキスト", JP = "日本語テキスト";

/** 書き出しの入口: 表示されるもの・表示されないもの */
function 入口のケース(ケース: string, 出る: string[], 出ない: string[]) {
  return async (ctx: CaseCtx) => {
    const v = new DeckShowPage(ctx.page);
    await ctx.step(1, async () => { await v.開く(デッキID(ctx, ケース)); });
    await ctx.step(2, async () => { await expect(v.情報欄の領域, "デッキリスト詳細が表示されている（情報欄）").toBeVisible(); });
    await ctx.expected(async () => {
      for (const n of 出る) expect.soft(await v.見えている入口の数(n), `「${n}」の入口の数（表示される）`).toBeGreaterThan(0);
      for (const n of 出ない) expect.soft(await v.見えている入口の数(n), `「${n}」の入口の数（表示されない）`).toBe(0);
    });
  };
}
caseTest("IT-F09-06-042", 入口のケース("042", [MO], []));
caseTest("IT-F09-06-043", 入口のケース("043", [], [MO, ARENA, JP]));
caseTest("IT-F09-06-044", 入口のケース("044", [ARENA, JP], []));
caseTest("IT-F09-06-045", 入口のケース("045", [MO], [ARENA, JP]));

caseTest("IT-F09-06-046", async (ctx) => {
  const v = new DeckShowPage(ctx.page);
  let 文 = "";
  await ctx.step(1, async () => { await v.開く(デッキID(ctx, "046")); });
  let path = "";
  await ctx.step(2, async () => {
    const e = await v.入口(MO);
    await e.scrollIntoViewIfNeeded();
    const [dl] = await Promise.all([ctx.page.waitForEvent("download", { timeout: 60_000 }), e.click()]);
    path = (await dl.path()) ?? "";
    note(`ダウンロードされたファイル名: ${dl.suggestedFilename()}`);
  });
  await ctx.step(3, async () => { 文 = fs.readFileSync(path, "utf-8"); });
  await ctx.expected(async () => {
    expect(文.split(/\r?\n/).map((l) => l.trim()), "ダウンロードされたテキストファイルの行").toContain(`4 ${N("046", "MOUNTAIN")}`);
  });
});

/** クリップボードの読み書きを許して、書き出しの入口を押す（貼り付けの代わりにクリップボードの文を読む） */
async function クリップボードへ書き出す(ctx: CaseCtx, v: DeckShowPage, 入口: string): Promise<void> {
  await ctx.page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(ctx.page.url()).origin });
  await v.入口を押して要求を待つ(入口);
  await expect(v.通知.first(), "書き出しの通知").toBeVisible({ timeout: 30_000 });
}
const クリップボード = (ctx: CaseCtx) => ctx.page.evaluate(() => navigator.clipboard.readText());

caseTest("IT-F09-06-047", async (ctx) => {
  const v = new DeckShowPage(ctx.page);
  let 文 = "";
  await ctx.step(1, async () => { await v.開く(デッキID(ctx, "047")); });
  await ctx.step(2, async () => { await クリップボードへ書き出す(ctx, v, ARENA); });
  await ctx.step(3, async () => { 文 = await クリップボード(ctx); note("テキストエディタへの貼り付けの代わりに、クリップボードの文を読んだ"); });
  await ctx.expected(async () => {
    const 行 = 文.split(/\r?\n/).map((l) => l.trim());
    expect.soft(行, "クリップボードのテキストの行（Deck）").toContain("Deck");
    expect.soft(行, "クリップボードのテキストの行（カード）").toContain(`4 ${N("047", "MOUNTAIN")}`);
    expect.soft(文, "日本語のカード名を含まない").not.toContain(N("047", "山"));
  });
});

caseTest("IT-F09-06-048", async (ctx) => {
  const v = new DeckShowPage(ctx.page);
  let 文 = "";
  await ctx.step(1, async () => { await v.開く(デッキID(ctx, "048")); });
  await ctx.step(2, async () => { await クリップボードへ書き出す(ctx, v, JP); });
  await ctx.step(3, async () => { 文 = await クリップボード(ctx); note("テキストエディタへの貼り付けの代わりに、クリップボードの文を読んだ"); });
  await ctx.expected(async () => {
    const 行 = 文.split(/\r?\n/).map((l) => l.trim());
    expect.soft(行, "クリップボードのテキストの行（デッキ）").toContain("デッキ");
    expect.soft(行, "クリップボードのテキストの行（カード）").toContain(`4 ${N("048", "山")}`);
    expect.soft(文, "英語のカード名を含まない").not.toContain(N("048", "MOUNTAIN"));
  });
});

function 通知のケース(k: "049" | "056", 入口: string) {
  return async (ctx: CaseCtx) => {
    const v = new DeckShowPage(ctx.page);
    await ctx.step(1, async () => { await v.開く(デッキID(ctx, k)); });
    await ctx.step(2, async () => {
      await ctx.page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(ctx.page.url()).origin });
      await v.入口を押して要求を待つ(入口);
    });
    let 文 = "";
    await ctx.step(3, async () => {
      await v.通知.first().waitFor({ state: "visible", timeout: 30_000 }).catch(() => undefined);
      文 = (await v.通知.count()) ? (await v.通知.first().innerText()).trim() : "";
    });
    await ctx.expected(async () => {
      await expect.soft(v.通知.first(), "書き出し完了の通知").toBeVisible();
      expect.soft(文, "通知の文").toMatch(/^クリップボードにコピーしました。/);
    });
  };
}
caseTest("IT-F09-06-049", 通知のケース("049", ARENA));
caseTest("IT-F09-06-056", 通知のケース("056", JP));

caseTest("IT-F09-06-055", async (ctx) => {
  const v = new DeckShowPage(ctx.page);
  let 要求 = "";
  await ctx.step(1, async () => { await v.開く(デッキID(ctx, "055")); });
  await ctx.step(2, async () => { note("ネットワークの表示の代わりに、押したときに送られる取得要求をブラウザで受け取って見る"); });
  await ctx.step(3, async () => {
    await ctx.page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(ctx.page.url()).origin });
    要求 = (await v.入口を押して要求を待つ(JP)).url();
  });
  await ctx.step(4, async () => { note(`送られた取得要求: ${要求}`); });
  await ctx.expected(async () => {
    expect.soft(new URL(要求).pathname, "取得要求の経路（表示言語が英語の経路）").toMatch(/^\/en\/deck\/arena\/\d+$/);
    expect.soft(await v.表示言語(), "画面の表示言語（日本語のまま）").toBe("ja");
    expect.soft(new URL(ctx.page.url()).pathname, "画面のアドレス（日本語のまま）").toMatch(/^\/ja\/deck\/\d+\/show\/$/);
  });
});

// ---------------------------------------------------------------------------
// 参照だけで変わらないこと（DB確認）
// ---------------------------------------------------------------------------

caseTest("IT-F09-06-050", async (ctx) => {
  const id = デッキID(ctx, "050");
  const 開始時 = 行数と更新日時(id);
  note(`開始時の値（シード表の「登録を終えたあとに控える」をケースの最初に読んだ）: ${JSON.stringify(開始時)}`);
  const v = new DeckShowPage(ctx.page);
  await ctx.step(1, async () => { await v.開く(id); });
  await ctx.step(2, async () => { await ctx.page.reload({ waitUntil: "load" }); });
  let 後 = 開始時;
  await ctx.step(3, async () => { 後 = 行数と更新日時(id); });
  await ctx.expected(async () => {
    expect.soft(後.デッキ, "デッキの行数").toBe(開始時.デッキ);
    expect.soft(後.大会, "大会の行数").toBe(開始時.大会);
    expect.soft(後.アーキタイプ, "アーキタイプの行数").toBe(開始時.アーキタイプ);
    expect.soft(後.採用カード, "採用カードの行数").toBe(開始時.採用カード);
    expect.soft(後.このデッキの更新日時, "このデッキの更新日時").toBe(開始時.このデッキの更新日時);
  });
});

// ---------------------------------------------------------------------------
// 旧URLからの入口
// ---------------------------------------------------------------------------

caseTest("IT-F09-06-052", async (ctx) => {
  const v = new DeckShowPage(ctx.page);
  const id = デッキID(ctx, "052");
  let r: Awaited<ReturnType<DeckShowPage["旧URLで開く"]>> | null = null;
  note("シード表の「旧デッキIDが同じ値のデッキが無いことを確かめ、あればDBで空にする」は行っていない（DB への書き込みはしない。判定は条件付き）");
  await ctx.step(1, async () => { r = await v.旧URLで開く(id); });
  await ctx.step(2, async () => { note(`最初の応答: ${r!.最初.状態}・転送先 ${r!.最初.転送先}`); });
  await ctx.expected(async () => {
    expect.soft(r!.最初.状態, "最初の応答のHTTPステータス").toBe(301);
    expect.soft(new URL(r!.最初.転送先, ctx.page.url()).pathname, "転送先（このデッキのデッキリスト詳細）").toMatch(new RegExp(`/deck/${id}/show/$`));
  });
});

caseTest("IT-F09-06-053", async (ctx) => {
  const v = new DeckShowPage(ctx.page);
  let r: Awaited<ReturnType<DeckShowPage["旧URLで開く"]>> | null = null;
  note("シード表の「旧デッキIDが同じ値のデッキが無いことを確かめ、あればDBで空にする」は行っていない（DB への書き込みはしない。判定は条件付き）");
  await ctx.step(1, async () => { r = await v.旧URLで開く("F0906053NONE"); });
  await ctx.step(2, async () => { note(`最初の応答: ${r!.最初.状態}・転送先 ${r!.最初.転送先}`); });
  await ctx.expected(async () => {
    expect.soft(r!.最初.状態, "最初の応答のHTTPステータス").toBe(302);
    expect.soft(new URL(r!.最初.転送先, ctx.page.url()).pathname, "転送先（デッキ検索TOP）").toMatch(/^\/(ja\/)?deck\/$/);
  });
});
