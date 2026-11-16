/**
 * F01-01 本店ECTOP（スライドバナー欄・デッキ採用枚数ランキング欄・商品の状態・お気に入りへ追加/解除）。正本: cases/F01-01_test_cases.tsv
 * 前提は seeds/f01-01-top.ts（バナー・ランキング）と seeds/f01-01-case.ts（固定タグ・お気に入り）が作る。
 * 共有の設定（トップバナー・固定タグ・フォーマットのランキング表示）を書き換えるケースは、ケースの終わりに必ず元に戻す（lib/shared_restore.ts）。
 * 共有の設定を書き換えるので、これらのケースは1本だけで流す（config/solo_cases.tsv）。
 * 実装しないケースの理由は PM への報告に書く（このファイルには実装したケースだけがある）。
 */
import { Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { 言語別のお気に入り件数 } from "../../db/f03_08";
import { F0101TopPage } from "../../pages/front/f01_01_top";
import { FrontFavorite } from "../../pages/front/f03_08_favorite";
import { 試験商品の名前 } from "../../pages/admin/f01_01_shared";
import { 会員の資格 } from "../../seeds/f01-01";
import "../../seeds/f01-01-case";
import { バナーのalt, バナーのリンク, 割り当てたバナー } from "../../seeds/f01-01-top";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 名 = 試験商品の名前;
const PC = { width: 1280, height: 900 };
const SP = { width: 390, height: 844 };
const 待つ = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function ログインする(page: Page, n: string): Promise<void> {
  const { メール, パスワード } = 会員の資格(n);
  await new FrontFavorite(page).login(メール, パスワード);
}

// ===========================================================================
// スライドバナー欄
// ===========================================================================

caseTest("IT-F01-01-008", async ({ page, step, expected }) => {
  const top = new F0101TopPage(page);
  let alts: string[] = [];
  await step(1, async () => { await top.本店TOPを開く("ja"); });
  await step(2, async () => { await top.スライドバナー欄().scrollIntoViewIfNeeded(); alts = await top.バナーのaltの一覧(); });
  await expected(async () => {
    const 日本語 = 割り当てたバナー.日本語;
    expect.soft(alts, "スライドバナー欄のバナー（並びの順。画像alt属性で見分ける）").toEqual(日本語.slice(0, 10).map(バナーのalt));
    for (const k of [...日本語.slice(10), ...割り当てたバナー.英語, 割り当てたバナー.非表示, 割り当てたバナー.画像なし]) {
      expect.soft(alts.includes(バナーのalt(k)), `バナー ${k}（11件目以降・英語・非表示・画像URLなし）が表示されない`).toBe(false);
    }
  });
});

caseTest("IT-F01-01-009", async ({ page, step, expected }) => {
  const top = new F0101TopPage(page);
  let alts: string[] = [];
  await step(1, async () => { await top.本店TOPを開く("en"); });
  await step(2, async () => { await top.スライドバナー欄().scrollIntoViewIfNeeded(); alts = await top.バナーのaltの一覧(); });
  await expected(async () => {
    expect.soft(alts, "英語版のスライドバナー欄のバナー（並びの順）").toEqual(割り当てたバナー.英語.map(バナーのalt));
    for (const k of [...割り当てたバナー.日本語, 割り当てたバナー.非表示, 割り当てたバナー.画像なし]) {
      expect.soft(alts.includes(バナーのalt(k)), `日本語・非表示・画像URLなしのバナー ${k} が表示されない`).toBe(false);
    }
  });
});

caseTest("IT-F01-01-010", async ({ page, step, expected }) => {
  const top = new F0101TopPage(page);
  const 先 = バナーのリンク("ja", 割り当てたバナー.日本語[0]);
  await step(1, async () => { await top.本店TOPを開く("ja"); await top.スライドの準備を待つ(); });
  await step(2, async () => {
    const link = top.バナーのリンク(バナーのalt(割り当てたバナー.日本語[0]));
    await Promise.all([page.waitForURL((u) => u.search.includes("f0101banner="), { timeout: 120_000}), link.click({ timeout: 30_000, noWaitAfter: true })]);
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    const u = new URL(page.url());
    expect.soft(`${u.origin}${u.pathname}${u.search}`, "押したあとに表示された画面のアドレス（並び順1のバナーのリンク先URL）").toBe(`${BASE_URL}${先}`);
  });
});

/** PC版で、操作の前に表示中だったバナーが、操作のあとどちらへ何枚ぶん動いたか（同じスライドの横の位置の差を、スライドの幅で割る） */
async function 動いた枚数(top: F0101TopPage, 前: { 番号: string; x: number; 幅: number }): Promise<number> {
  const 後 = await top.スライドの位置(前.番号);
  return Math.round(((後.x - 前.x) / 前.幅) * 100) / 100;
}

caseTest("IT-F01-01-011", async ({ page, step, expected }) => {
  const top = new F0101TopPage(page);
  await page.setViewportSize(PC);
  let 左 = "";
  await step(1, async () => { await top.本店TOPを開く("ja"); await top.スライドの準備を待つ(); });
  await step(2, async () => {
    await top.バナー選択画像(2).click();
    await 待つ(1_500); // スライドが動き終わる（0.8秒）まで待つ
    左 = (await top.表示中のバナー()).画像;
  });
  await expected(async () => {
    expect.soft(左, "画面内の左側のバナー（画像alt属性）").toBe(バナーのalt(割り当てたバナー.日本語[2]));
  });
});

function スライドボタン(n: "012" | "013", ボタン: "左" | "右", 期待: number) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const top = new F0101TopPage(page);
    await page.setViewportSize(PC);
    let 枚数 = NaN; let 前の表示 = ""; let 後の表示 = "";
    await step(1, async () => { await top.本店TOPを開く("ja"); await top.スライドの準備を待つ(); });
    if (n === "012") note("事前準備②の「スライド位置を先頭以外の位置にする」: 本店TOPは開くたびにスライドの初期位置から始まる（シード表のブラウザは「画面状態初期」）。手順にない操作は足さず、開いた位置のまま左スライドボタンを押した（スライドは端で反対の端へつながる）");
    await step(2, async () => {
      const 前 = await top.表示中のバナー();
      前の表示 = 前.画像;
      await (ボタン === "左" ? top.左スライドボタン() : top.右スライドボタン()).click();
      await 待つ(1_500);
      枚数 = await 動いた枚数(top, 前);
      後の表示 = (await top.表示中のバナー()).画像;
    });
    note(`押す前に表示中だったバナー ${前の表示} の横の位置が、押したあと ${枚数} 枚ぶん動いた（負は左、正は右）。押したあと表示中のバナーは ${後の表示}`);
    note("「表示中のバナーが左（右）へ1枚移動」は、押す前に表示中だったバナーそのものが、画面の上で左（右）へスライド1枚ぶん動くことと読んだ（自動のスライドの「左へスライドする」と同じ向きの読み方）");
    await expected(async () => {
      expect.soft(枚数, `押す前に表示中だったバナーが${期待 < 0 ? "左" : "右"}へ動いた枚数（負は左・正は右）`).toBeCloseTo(期待, 1);
    });
  };
}
caseTest("IT-F01-01-012", スライドボタン("012", "左", -1));
caseTest("IT-F01-01-013", スライドボタン("013", "右", 1));

caseTest("IT-F01-01-077", async ({ page, step, expected }) => {
  const top = new F0101TopPage(page);
  await page.setViewportSize(SP);
  let 左 = -1; let 右 = -1; let 枚数 = 0;
  await step(1, async () => { await top.本店TOPを開く("ja"); await top.スライドの準備を待つ(); });
  await step(2, async () => {
    await top.スライドバナー欄().scrollIntoViewIfNeeded();
    枚数 = (await top.バナーのaltの一覧()).length;
    左 = (await top.左スライドボタン().isVisible()) ? 1 : 0;
    右 = (await top.右スライドボタン().isVisible()) ? 1 : 0;
  });
  await expected(async () => {
    expect.soft(枚数, "SP版のスライドバナー欄に出ているバナーの数（欄が出ていること）").toBeGreaterThan(1);
    expect.soft(左, "SP版のスライドバナー欄の左スライドボタンが見えている数").toBe(0);
    expect.soft(右, "SP版のスライドバナー欄の右スライドボタンが見えている数").toBe(0);
  });
});

caseTest("IT-F01-01-078", async ({ page, step, expected }) => {
  const top = new F0101TopPage(page);
  await page.setViewportSize(PC);
  let 開いた時刻 = 0; let 前 = { 番号: "", 画像: "", x: 0, 幅: 1 }; let 枚数 = NaN; let 後の表示 = "";
  await step(1, async () => {
    await top.本店TOPを開く("ja");
    開いた時刻 = Date.now();
    await top.スライドの準備を待つ();
    前 = await top.表示中のバナー();
  });
  note("「TOPを開いた時点」は、本店TOPの画面の読み込みが終わった時点（ブラウザの load）とした");
  await step(2, async () => { await 待つ(Math.max(0, 開いた時刻 + 7_000 - Date.now())); });
  await step(3, async () => {
    枚数 = await 動いた枚数(top, 前);
    後の表示 = (await top.表示中のバナー()).画像;
  });
  note(`手順1で表示中だったバナー ${前.画像} の横の位置が、7秒後に ${枚数} 枚ぶん動いた（負は左）。7秒後に表示中のバナーは ${後の表示}`);
  await expected(async () => {
    expect.soft(枚数, "手順1で表示中だったバナーが、操作しないで7秒経ったあとに左へ動いた枚数（負は左）").toBeCloseTo(-1, 1);
  });
});

caseTest("IT-F01-01-130", async ({ page, step, expected }) => {
  const top = new F0101TopPage(page);
  let 画像: string[] = [];
  await step(1, async () => { await top.本店TOPを開く("en"); });
  await step(2, async () => { await top.スライドバナー欄().scrollIntoViewIfNeeded(); 画像 = await top.バナーの画像の一覧(); });
  await expected(async () => {
    expect.soft(画像, "英語版のスライドバナー欄のバナーの画像URL").toEqual(["F0101-CB130-EN.png"]);
    expect.soft(画像.includes("F0101-CB130-JA.png"), "日本語のバナー（F0101-CB130-JA.png）が表示されない").toBe(false);
  });
});

// ===========================================================================
// デッキ採用枚数ランキング欄
// ===========================================================================

caseTest("IT-F01-01-058", async ({ page, step, expected }) => {
  const top = new F0101TopPage(page);
  await step(1, async () => { await top.本店TOPを開く("ja"); await top.ランキング欄().scrollIntoViewIfNeeded().catch(() => undefined); });
  await expected(async () => {
    expect.soft(await top.デッキ採用枚数ランキング欄().count(), "デッキ採用枚数ランキング欄の数").toBe(0);
  });
});

/** フォーマットを選んで、表示中のランキングの商品を読む（手順1: 開く・手順2: 選ぶ・手順3: 確かめる） */
type 順位の商品 = { 順位: string; 商品名: string; SALE: boolean; 言語: string };
/** 期待結果で確かめる組（確かめる値・確かめる項目・期待） */
type 確かめ = { 値: unknown; 項目: string; 期待: unknown };
function ランキング(フォーマット: string, 確かめを作る: (商品: 順位の商品[]) => 確かめ[]) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const top = new F0101TopPage(page);
    let 商品: 順位の商品[] = [];
    await step(1, async () => { await top.本店TOPを開く("ja"); await top.ランキング欄().scrollIntoViewIfNeeded(); });
    await step(2, async () => { await top.フォーマットを選ぶ(rc(フォーマット)); });
    await step(3, async () => {
      await top.表示中のランキング().scrollIntoViewIfNeeded();
      商品 = await top.表示中のランキングの商品();
    });
    note(`フォーマット「${フォーマット}」は実行の印を付けた「${rc(フォーマット)}」で作った。表示中のランキング: ${商品.map((x) => `${x.順位}位 ${x.商品名}${x.SALE ? "（SALE）" : ""}`).join(" / ") || "なし"}`);
    await expected(async () => {
      for (const c of 確かめを作る(商品)) expect.soft(c.値, c.項目).toEqual(c.期待);
    });
  };
}

caseTest("IT-F01-01-094", ランキング("F0101-094-FMT-A", (商品) => {
  const names = 商品.map((x) => x.商品名);
  return [
    { 値: names, 項目: "デッキ採用枚数ランキング欄の商品", 期待: [名("F0101-094-A")] },
    ...[["B", "別フォーマット"], ["C", "メタゲーム分析日数外のイベント"], ["D", "非公開デッキ"], ["E", "土地カード"]]
      .map(([s, why]) => ({ 値: names.includes(名(`F0101-094-${s}`)), 項目: `${why}の商品 F0101-094-${s} が表示されない`, 期待: false })),
  ];
}));

caseTest("IT-F01-01-096", async ({ page, step, expected }) => {
  const top = new F0101TopPage(page);
  let タブ: string[] = [];
  await step(1, async () => { await top.本店TOPを開く("ja"); await top.ランキング欄().scrollIntoViewIfNeeded(); });
  await step(2, async () => { タブ = await top.フォーマットのタブの一覧(); });
  note(`フォーマットは実行の印を付けた名前（${rc("F0101-096-FMT-ON")}・${rc("F0101-096-FMT-OFF")}）で作った。フォーマットの選択肢: ${タブ.join(" / ") || "なし"}`);
  await expected(async () => {
    expect.soft(タブ.includes(rc("F0101-096-FMT-ON")), "フォーマットの選択肢に F0101-096-FMT-ON（ランキング表示あり）が表示される").toBe(true);
    expect.soft(タブ.includes(rc("F0101-096-FMT-OFF")), "フォーマットの選択肢に F0101-096-FMT-OFF（ランキング表示なし）が表示されない").toBe(false);
  });
});

caseTest("IT-F01-01-097", ランキング("F0101-097-FMT", (商品) => {
  const a = 商品.find((x) => x.商品名 === 名("F0101-097-A"));
  const b = 商品.find((x) => x.商品名 === 名("F0101-097-B"));
  return [
    { 値: a?.順位 ?? "（表示されない）", 項目: "商品 F0101-097-A の順位", 期待: "1" },
    { 値: b?.順位 ?? "（表示されない）", 項目: "商品 F0101-097-B の順位", 期待: "2" },
    { 値: a?.SALE ?? null, 項目: "商品 F0101-097-A（セールフラグ1）にSALEラベルが表示される", 期待: true },
    { 値: b?.SALE ?? null, 項目: "商品 F0101-097-B（セールフラグ0）にSALEラベルが表示されない", 期待: false },
  ];
}));

caseTest("IT-F01-01-102", ランキング("F0101-102-FMT", (商品) => {
  return [{ 値: 商品.some((x) => x.商品名 === 名("F0101-102-A")), 項目: "デッキ採用枚数ランキング欄に商品 F0101-102-A が表示される", 期待: true }];
}));

caseTest("IT-F01-01-110", ランキング("F0101-110-FMT", (商品) => {
  const a = 商品.find((x) => x.商品名.endsWith(名("F0101-110-A")))?.商品名 ?? "（表示されない）";
  const b = 商品.find((x) => x.商品名.endsWith(名("F0101-110-B")))?.商品名 ?? "（表示されない）";
  return [
    { 値: a, 項目: "商品 F0101-110-A（Foilあり）の商品名（【Foil】で始まる）", 期待: `【Foil】${名("F0101-110-A")}` },
    { 値: b, 項目: "商品 F0101-110-B（Foilなし）の商品名", 期待: 名("F0101-110-B") },
    { 値: b.includes("【Foil】"), 項目: "商品 F0101-110-B の商品名に【Foil】が付かない", 期待: false },
  ];
}));

caseTest("IT-F01-01-151", ランキング("F0101-CB151-FMT", (商品) => {
  return [{ 値: 商品.map((x) => `${x.順位}位 ${x.商品名}`), 項目: "デッキ採用枚数ランキング欄の順位と商品", 期待: ["P1", "P2", "P3"].map((p, i) => `${i + 1}位 ${名(`F0101-CB151-${p}`)}`) }];
}));

caseTest("IT-F01-01-153", ランキング("F0101-CB153-FMT", (商品) => {
  return [{ 値: 商品.map((x) => `${x.順位}位 ${x.商品名}`), 項目: "デッキ採用枚数ランキング欄の順位と商品", 期待: ["P3", "P1", "P2"].map((p, i) => `${i + 1}位 ${名(`F0101-CB153-${p}`)}`) }];
}));

// ===========================================================================
// 商品の状態・お気に入りへ追加/解除・商品詳細への遷移
// ===========================================================================

caseTest("IT-F01-01-083", async ({ page, step, expected }) => {
  const top = new F0101TopPage(page);
  let a = ""; let b = -1; let bのカード = 0;
  await step(1, async () => { await top.本店TOPを開く("ja"); });
  await step(2, async () => {
    const 欄 = top.欄("最新入荷アイテム");
    await 欄.scrollIntoViewIfNeeded();
    a = ((await top.カードの状態(top.商品のカード(欄, 名("F0101-083-A"))).allInnerTexts()).join("")).trim();
    bのカード = await top.商品のカード(欄, 名("F0101-083-B")).count();
    b = await top.カードの状態(top.商品のカード(欄, 名("F0101-083-B"))).count();
  });
  await expected(async () => {
    expect.soft(a, "カード商品 F0101-083-A の状態の表示").toBe("NM");
    // 商品 B が欄に出ていないと「状態の表示が無い」は確かめにならないため、B の商品のカードがあることも確かめる
    expect.soft(bのカード, "カード以外の商品 F0101-083-B が最新入荷アイテム欄に表示されている（商品のカードの数）").toBe(1);
    expect.soft(b, "カード以外の商品 F0101-083-B の状態の表示の数").toBe(0);
  });
});

/** 欄の商品のお気に入りボタンを押し、選択状態（♡）が変わるのを待つ */
async function お気に入りを押す(top: F0101TopPage, 欄名: string, 商品名: string, 押した後: boolean): Promise<void> {
  const 欄 = top.欄(欄名);
  await 欄.scrollIntoViewIfNeeded();
  const btn = top.カードのお気に入りボタン(top.商品のカード(欄, 商品名));
  await btn.click();
  await expect.poll(async () => (await btn.getAttribute("aria-pressed")) ?? "", { message: "お気に入りボタンの選択状態が変わる", timeout: 20_000 }).toBe(String(押した後));
}
const お気に入りの件数 = (会員ID: string, 商品ID: string): number => { const n = 言語別のお気に入り件数(会員ID, 商品ID); return n.JP + n.EN + n.そのほか; };

caseTest("IT-F01-01-025", async ({ page, notes, step, expected }) => {
  const top = new F0101TopPage(page);
  const 会員ID = notes.get("〔会員ID-F0101-025〕"); const 商品ID = notes.get("〔商品ID-F0101-025〕");
  let 前 = -1; let 件数 = -1;
  await step(1, async () => { await ログインする(page, "025"); });
  await step(2, async () => { await top.本店TOPを開く("ja"); 前 = お気に入りの件数(会員ID, 商品ID); });
  await step(3, async () => { await お気に入りを押す(top, "最新入荷アイテム", 名("NEW-JA-01-025"), true); });
  await step(4, async () => { 件数 = お気に入りの件数(会員ID, 商品ID); });
  note(`DBで、会員 ${会員ID} と商品 ${商品ID} のお気に入りの件数を、お気に入りの言語を問わず数えた（押す前 ${前} 件、押したあと ${件数} 件）`);
  await expected(async () => {
    expect.soft(件数, `DB: 会員 ${会員ID}（F01-01試験会員）と商品 ${商品ID}（NEW-JA-01-025）のお気に入りの件数`).toBe(1);
  });
});

caseTest("IT-F01-01-026", async ({ page, notes, step, expected }) => {
  const top = new F0101TopPage(page);
  const 会員ID = notes.get("〔会員ID-F0101-026〕"); const 商品ID = notes.get("〔商品ID-F0101-026〕");
  let 前 = -1; let 件数 = -1;
  await step(1, async () => { await ログインする(page, "026"); });
  await step(2, async () => { await top.本店TOPを開く("ja"); 前 = お気に入りの件数(会員ID, 商品ID); });
  await step(3, async () => { await お気に入りを押す(top, "あなたのお気に入り", 名("FAV-01-026"), false); });
  await step(4, async () => { 件数 = お気に入りの件数(会員ID, 商品ID); });
  note(`登録済みの商品のボタンは、本店TOPのあなたのお気に入り欄の商品 FAV-01-026 のものを押した。DBで、会員 ${会員ID} と商品 ${商品ID} のお気に入りの件数を数えた（押す前 ${前} 件、押したあと ${件数} 件）`);
  await expected(async () => {
    expect.soft(前, `DB: 押す前の、会員 ${会員ID} と商品 ${商品ID} のお気に入りの件数（登録済みであること）`).toBe(1);
    expect.soft(件数, `DB: 押したあとの、会員 ${会員ID}（F01-01試験会員）と商品 ${商品ID}（FAV-01-026）のお気に入りの件数`).toBe(0);
  });
});

caseTest("IT-F01-01-033", async ({ page, notes, step, expected }) => {
  const top = new F0101TopPage(page);
  const 商品ID = notes.get("〔商品ID-F0101-033〕");
  const 行き先: string[] = [];
  const 押す = async (どこ: "カード言語" | "商品名") => {
    const 欄 = top.欄("あなたのお気に入り");
    await 欄.scrollIntoViewIfNeeded();
    const card = top.商品のカード(欄, 名("FAV-01-033"));
    const target = どこ === "カード言語" ? top.カードのカード言語(card).first() : top.カードの商品名(card);
    await Promise.all([page.waitForURL(/\/products\/detail\//, { timeout: 120_000}), target.click({ noWaitAfter: true })]);
    await page.waitForLoadState("load");
    行き先.push(new URL(page.url()).pathname);
  };
  await step(1, async () => { await ログインする(page, "033"); });
  await step(2, async () => { await top.本店TOPを開く("ja"); await 押す("カード言語"); });
  await step(3, async () => { await top.本店TOPを開く("ja"); await 押す("商品名"); });
  note("「日本語版本店TOPへ戻り」は、日本語版本店TOPを開き直すことで行った");
  await expected(async () => {
    expect.soft(行き先[0] ?? "", "カード言語を押したあとの画面（商品 FAV-01-033 の商品詳細）").toMatch(new RegExp(`/products/detail/${商品ID}$`));
    expect.soft(行き先[1] ?? "", "商品名を押したあとの画面（商品 FAV-01-033 の商品詳細）").toMatch(new RegExp(`/products/detail/${商品ID}$`));
  });
});
