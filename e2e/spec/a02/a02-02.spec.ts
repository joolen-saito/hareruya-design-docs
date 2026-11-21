/**
 * A02-02 カードIDからポップアップ用の商品情報を1件取得（/api/popup/card/{lang}/{カードID}）。正本: cases/A02-02_test_cases.tsv
 * ケースの「開発者ツールから HTTP GET で要求を送り、Network で確かめる」は、ページで API を開き、その応答（状態・本文・送った要求の見出し）を読む（A02-01 と同じ）。
 * シード: seeds/a02-02.ts（カードをカードCSV登録で取り込み、カード詳細ごとに商品を作って紐付ける。画像・週間販売数量は DB で書き足す）。
 * 書かないケース: 004・005・016・017・036・037・057〜060（理由は review/A02-02_progress_2026-11-21_dev.md）。
 */
import { Page, test } from "@playwright/test";
import { 規格の価格と在庫 } from "../../db/a02_popup";
import { expect, caseTest, CaseBody } from "../../lib/case";
import { EC_CUBE側で開く, カードIDで開く, 値, 項目の名前, 型, 要約, 応答 } from "../../pages/api/a02_02_popup";
import "../../seeds/a02-02";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const NETWORK = "開発者ツールの Network の代わりに、開いたページの応答（状態・本文・送った要求の見出し）をそのまま読む";
const n = (v: string) => Number(v);
const 規格ラベル = (番号: string, 印: string) => `〔商品規格ID-A0202-${番号}${印}〕`;
const 商品ラベル = (番号: string, 印 = "") => `〔商品ID-A0202-${番号}${印}〕`;
const カードラベル = (番号: string) => `〔カードID-A0202-${番号}〕`;

async function 開く(page: Page, lang: string, カードID: string, 絞り込み = ""): Promise<応答> {
  const r = await カードIDで開く(page, lang, カードID, 絞り込み);
  note(`/api/popup/card/${lang}/${カードID}${絞り込み} の応答: ${要約(r)}`);
  return r;
}

type 追加の確かめ = { code?: string; conditionCode?: string };

/**
 * 1回の要求で返る商品規格を見るケースの処理（手順1: 要求を送る／手順2: 応答の商品規格を読む）。
 * 返る印の商品規格が返り、返らない印の商品規格は返らないことを確かめる。
 */
function 返る規格(番号: string, lang: string, 絞り込み: string, 返る印: string, 返らない印: string[] = [], 追加: 追加の確かめ = {}): CaseBody {
  return async ({ page, notes, step, expected }) => {
    let r!: 応答;
    await step(1, async () => { note(NETWORK); r = await 開く(page, lang, notes.get(カードラベル(番号)), 絞り込み); });
    await step(2, async () => {
      note(`HTTPステータス ${r.状態}・productClassId ${String(値(r, "productClassId"))}・code ${String(値(r, "code"))}・conditionCode ${String(値(r, "conditionCode"))}・subFileName ${String(値(r, "subFileName"))}`);
    });
    await expected(async () => {
      expect.soft(r.状態, "HTTPステータス").toBe(200);
      expect.soft(値(r, "productClassId"), `productClassId（${規格ラベル(番号, 返る印)}の1件だけ）`).toBe(n(notes.get(規格ラベル(番号, 返る印))));
      for (const x of 返らない印) expect.soft(値(r, "productClassId"), `productClassId が ${規格ラベル(番号, x)} でない`).not.toBe(n(notes.get(規格ラベル(番号, x))));
      if (追加.code !== undefined) expect.soft(値(r, "code"), "code").toBe(追加.code);
      if (追加.conditionCode !== undefined) expect.soft(値(r, "conditionCode"), "conditionCode").toBe(追加.conditionCode);
    });
  };
}

// ---- 001: 認証情報なしの GET で 200・JSON ----
caseTest("IT-A02-02-001", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  const 送った認証: string[] = [];
  await step(1, async () => {
    note(NETWORK);
    expect((await page.context().cookies()).length, "要求の前のブラウザに Cookie が無い（未認証の専用セッション）").toBe(0);
  });
  await step(2, async () => {
    r = await 開く(page, "ja", notes.get(カードラベル("001")));
    for (const k of Object.keys(r.送った見出し)) if (k === "cookie" || k === "authorization") 送った認証.push(k);
  });
  await step(3, async () => { note(`要求メソッド ${r.方法}・HTTPステータス ${r.状態}・種類 ${r.種類}`); });
  await expected(async () => {
    expect.soft(r.方法, "要求メソッド").toBe("GET");
    expect.soft(送った認証, "送った要求に認証情報（Cookie・認可の見出し）が無い").toEqual([]);
    expect.soft(r.状態, "HTTPステータス").toBe(200);
    expect.soft(r.JSONか, "応答本文が JSON（オブジェクト）").toBe(true);
    expect.soft(r.種類, "応答の種類（JSON）").toMatch(/application\/json/);
  });
});

// ---- 002: EC-CUBE側 URL に lang=jp を付けても商品情報が返る ----
caseTest("IT-A02-02-002", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => {
    note(NETWORK);
    expect((await page.context().cookies()).length, "要求の前のブラウザに Cookie が無い（未認証の専用セッション）").toBe(0);
  });
  await step(2, async () => {
    r = await EC_CUBE側で開く(page, "ja", `card_id=${notes.get(カードラベル("002"))}&lang=jp`);
    note(`/ja/goods_api/get_goods の応答: ${要約(r)}`);
  });
  await step(3, async () => { note(`productId ${String(値(r, "productId"))}・code ${String(値(r, "code"))}`); });
  await expected(async () => {
    expect.soft(r.JSONか, "応答本文が JSON").toBe(true);
    expect.soft(値(r, "productId"), "productId").toBe(n(notes.get(商品ラベル("002"))));
    expect.soft(値(r, "code"), "言語コード code").toBe("JP");
  });
});

// ---- 003: 応答の構造・項目名・値 ----
caseTest("IT-A02-02-003", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  const id = notes.get(商品ラベル("003"));
  await step(1, async () => { note(NETWORK); r = await 開く(page, "ja", notes.get(カードラベル("003"))); });
  await step(2, async () => { note(`項目: ${項目の名前(r).join("、")}`); });
  await expected(async () => {
    expect.soft(値(r, "productId"), "productId").toBe(n(id));
    expect.soft(型(値(r, "productId")), "productId の型").toBe("整数");
    expect.soft(値(r, "name"), "name").toBe("A02-02商品-003");
    expect.soft(値(r, "productClassId"), "productClassId").toBe(n(notes.get(規格ラベル("003", ""))));
    expect.soft(型(値(r, "productClassId")), "productClassId の型").toBe("整数");
    expect.soft(値(r, "nameEn"), "nameEn").toBe("A02-02 Product-A0202-003");
    expect.soft(値(r, "subFileName"), "subFileName").toBe("img/goods/L/A02/jp/202001003.jpg");
    expect.soft(値(r, "fileName"), "fileName").toBe("img/goods/L/A02/jp/202001003.jpg");
    expect.soft(値(r, "code"), "code").toBe("JP");
    expect.soft(値(r, "conditionCode"), "conditionCode").toBe("NM");
    expect.soft(String(値(r, "productUrl")), "productUrl が商品ID の商品詳細URL").toMatch(new RegExp(`/products/detail/${id}$`));
  });
});

// ---- 006: foil_flg の値ごとの優先（1・false・1+price=high はフォイル先、0・空は非フォイル先） ----
caseTest("IT-A02-02-006", async ({ page, notes, step, expected }) => {
  const 絞り込み = ["?foil_flg=1", "?foil_flg=false", "?foil_flg=1&price=high", "?foil_flg=0", "?foil_flg="];
  const 結果: 応答[] = [];
  await step(1, async () => {
    note(NETWORK);
    for (const q of 絞り込み) 結果.push(await 開く(page, "ja", notes.get(カードラベル("006")), q));
  });
  await step(2, async () => { note(結果.map((r, i) => `${絞り込み[i]} → productClassId ${String(値(r, "productClassId"))}`).join(" / ")); });
  await expected(async () => {
    const A = n(notes.get(規格ラベル("006", "A")));
    const B = n(notes.get(規格ラベル("006", "B")));
    絞り込み.forEach((q, i) => {
      expect.soft(結果[i].状態, `${q} のHTTPステータス`).toBe(200);
      expect.soft(値(結果[i], "productClassId"), `${q} の productClassId（${i < 3 ? "フォイルを先にした A" : "非フォイルを先にした B"}）`).toBe(i < 3 ? A : B);
    });
  });
});

// ---- 021: 同じ商品・同じ言語の1週間販売数の合計 ----
caseTest("IT-A02-02-021", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { note(NETWORK); r = await 開く(page, "ja", notes.get(カードラベル("021"))); });
  await step(2, async () => { note(`productClassId ${String(値(r, "productClassId"))}・weeklySold ${String(値(r, "weeklySold"))}`); });
  await expected(async () => {
    expect.soft(値(r, "productClassId"), "取得された商品規格").toBe(n(notes.get(規格ラベル("021", "A"))));
    expect.soft(値(r, "weeklySold"), "weeklySold（同じ商品・同じ言語の 2 と 3 の合計）").toBe(5);
  });
});

// ---- 022: DB の値がそのまま返る ----
caseTest("IT-A02-02-022", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  let d!: ReturnType<typeof 規格の価格と在庫>;
  await step(1, async () => {
    d = 規格の価格と在庫(notes.get(規格ラベル("022", "")));
    note(`販売価格 ${d.販売価格}・在庫数 ${d.在庫数}`);
    expect.soft([d.販売価格, d.在庫数], "DB の販売価格・在庫数").toEqual([1234, 7]);
  });
  await step(2, async () => { note(NETWORK); r = await 開く(page, "ja", notes.get(カードラベル("022"))); });
  await step(3, async () => { note(`price02 ${String(値(r, "price02"))}・stock ${String(値(r, "stock"))}`); });
  await expected(async () => {
    expect.soft([値(r, "price02"), 値(r, "stock")], "応答の price02・stock（DB の 1234・7 から再計算・丸めされない）").toEqual([1234, 7]);
    expect.soft([型(値(r, "price02")), 型(値(r, "stock"))], "price02・stock の型").toEqual(["整数", "整数"]);
  });
});

// ---- 023: 画像が無ければ null（帯リンクURLの項目は含まれて null） ----
caseTest("IT-A02-02-023", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { note(NETWORK); r = await 開く(page, "ja", notes.get(カードラベル("023"))); });
  await step(2, async () => { note(`subFileName ${String(値(r, "subFileName"))}・fileName ${String(値(r, "fileName"))}・項目: ${項目の名前(r).join("、")}`); });
  await expected(async () => {
    expect.soft(値(r, "subFileName"), "subFileName").toBe(null);
    expect.soft(値(r, "fileName"), "fileName").toBe(null);
    expect.soft(項目の名前(r), "beltUrl の項目を含む").toContain("beltUrl");
    expect.soft(値(r, "beltUrl"), "beltUrl").toBe(null);
  });
});

// ---- 029: EC-CUBE側 URL の lang=jp は ja として扱われる ----
caseTest("IT-A02-02-029", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => {
    note(NETWORK);
    expect((await page.context().cookies()).length, "要求の前のブラウザに Cookie が無い（未認証の専用セッション）").toBe(0);
  });
  await step(2, async () => {
    r = await EC_CUBE側で開く(page, "ja", `card_id=${notes.get(カードラベル("029"))}&lang=jp`);
    note(`/ja/goods_api/get_goods の応答: ${要約(r)}`);
  });
  await step(3, async () => { note(`productClassId ${String(値(r, "productClassId"))}・code ${String(値(r, "code"))}`); });
  await expected(async () => {
    expect.soft(値(r, "productClassId"), "productClassId（言語JPの商品規格）").toBe(n(notes.get(規格ラベル("029", "B"))));
    expect.soft(値(r, "code"), "code").toBe("JP");
  });
});

// ---- 優先順位・絞り込み・言語指定 ----
caseTest("IT-A02-02-007", 返る規格("007", "ja", "?price=high", "B"));
caseTest("IT-A02-02-008", 返る規格("008", "ja", "?price=low", "A"));
caseTest("IT-A02-02-009", 返る規格("009", "ja", "", "A"));
caseTest("IT-A02-02-010", 返る規格("010", "ja", "", "A"));
caseTest("IT-A02-02-011", 返る規格("011", "ja", "", "B"));
caseTest("IT-A02-02-012", 返る規格("012", "ja", "", "A"));
caseTest("IT-A02-02-013", 返る規格("013", "ja", "", "A"));
caseTest("IT-A02-02-014", 返る規格("014", "ja", "", "A", [], { code: "JP" }));
caseTest("IT-A02-02-015", 返る規格("015", "ja", "", "A"));
caseTest("IT-A02-02-018", 返る規格("018", "ja", "", "A"));
caseTest("IT-A02-02-019", 返る規格("019", "ja", "", "A"));
caseTest("IT-A02-02-020", 返る規格("020", "ja", "", "A"));
caseTest("IT-A02-02-030", 返る規格("030", "en", "", "B", [], { code: "EN" }));
caseTest("IT-A02-02-031", 返る規格("031", "ja", "", "B"));
caseTest("IT-A02-02-032", 返る規格("032", "ja", "", "B"));
caseTest("IT-A02-02-033", 返る規格("033", "ja", "", "B"));
caseTest("IT-A02-02-034", 返る規格("034", "ja", "", "B"));
caseTest("IT-A02-02-035", 返る規格("035", "ja", "", "B"));
caseTest("IT-A02-02-038", 返る規格("038", "ja", "?foil_flg=0", "A", ["B"]));
caseTest("IT-A02-02-039", 返る規格("039", "ja", "?foil_flg=0&price=high", "A", ["B"]));
caseTest("IT-A02-02-040", 返る規格("040", "en", "?foil_flg=1&price=low", "B", ["A"], { code: "EN" }));
caseTest("IT-A02-02-041", 返る規格("041", "en", "?foil_flg=1&price=high", "B", ["A"], { code: "EN" }));
caseTest("IT-A02-02-042", 返る規格("042", "en", "?foil_flg=0&price=low", "B", ["A"], { code: "EN" }));
caseTest("IT-A02-02-043", 返る規格("043", "en", "?foil_flg=1&price=high", "B", ["A"], { code: "EN" }));
caseTest("IT-A02-02-044", 返る規格("044", "ja", "?foil_flg=0&price=low", "B", ["A"], { code: "JP" }));
caseTest("IT-A02-02-045", 返る規格("045", "en", "?foil_flg=1&price=high", "B", ["A"], { code: "EN" }));
caseTest("IT-A02-02-046", 返る規格("046", "ja", "?foil_flg=0&price=low", "B", ["A"], { code: "JP" }));
caseTest("IT-A02-02-047", 返る規格("047", "en", "?foil_flg=1&price=high", "B", ["A"], { code: "EN" }));
caseTest("IT-A02-02-048", 返る規格("048", "ja", "?foil_flg=0&price=low", "B", ["A"], { code: "JP" }));
caseTest("IT-A02-02-049", 返る規格("049", "en", "?price=high", "B", ["A"], { code: "EN" }));
caseTest("IT-A02-02-050", 返る規格("050", "ja", "?price=low", "B", ["A"], { code: "JP" }));
caseTest("IT-A02-02-051", 返る規格("051", "en", "?foil_flg=1&price=high", "B", ["A"], { code: "EN" }));
caseTest("IT-A02-02-052", 返る規格("052", "ja", "?foil_flg=0&price=low", "B", ["A"], { code: "JP" }));
caseTest("IT-A02-02-053", 返る規格("053", "ja", "?foil_flg=1&price=high", "B", ["A"], { code: "JP" }));
caseTest("IT-A02-02-054", 返る規格("054", "ja", "?foil_flg=0&price=low", "B", ["A"], { code: "JP" }));
caseTest("IT-A02-02-055", 返る規格("055", "en", "?foil_flg=1&price=high", "B", ["A"], { conditionCode: "NM" }));
caseTest("IT-A02-02-056", 返る規格("056", "ja", "?foil_flg=0&price=low", "B", ["A"], { conditionCode: "NM" }));
