/**
 * F05-02 ネット買取商品検索（フロント）のうち、検索結果にその商品が出ること（検索サービスの索引）を確かめるケース。正本: cases/F05-02_test_cases.tsv
 * （ほかのケースは f05-02.spec.ts・f05-02-more.spec.ts）
 *
 * 商品は seeds/f05-02-index.ts が画面で作り、ユニサーチフィード作成で1回だけ送って、公開側の検索に出るまで待つ。
 * 商品名・検索語には実行の印を付けた（rc）。印つきの語で検索するので、出るのは自分の作った商品だけになる。
 * 表示された商品は、商品名のリンクの商品IDで、シードが作った商品と照らし合わせる。
 * 実装しないケース: 029（色の赤だけで検索するので、共有の索引にある赤の商品が全部出て、自分の商品だけに絞れない）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { PurchaseSearchPage } from "../../pages/front/f05_02_purchase_search";
import { ネット買取の検索結果, 論理演算子を選ぶ, 選択を外す } from "../../pages/front/f05_purchase_results";
import { F0502マスタ } from "../../seeds/f05-02";
import { F0502カードAの名, f0502の商品 } from "../../seeds/f05-02-index";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 買取詳細検索の注記 = "手順の「ネット買取商品検索モーダルを開く」は、ネット買取商品一覧の「詳細検索」ボタンを押してモーダルを開いた";
const 照らし方の注記 = "表示された商品は、一覧の行の商品名のリンクの商品IDで、シードが作った商品（商品コードごとに控えた商品ID）と照らし合わせた。商品名・検索語の末尾の「-印」は実行ごとの印";

async function 一覧を開く(s: PurchaseSearchPage, path?: string): Promise<void> {
  expect(await s.開く(path), "ネット買取商品一覧の応答").toBeLessThan(400);
  await expect(s.一覧の印, "ネット買取商品一覧の画面").toHaveCount(1);
}
async function モーダルを開く(s: PurchaseSearchPage): Promise<void> {
  const 押したもの = await s.詳細検索を押す();
  if (押したもの !== "一覧左の欄の詳細検索ボタン") note(`一覧左の欄の「詳細検索」ボタンを押せなかったため、${押したもの}を押した`);
  await expect(s.モーダル, "ネット買取商品検索モーダル（開いた状態）").toHaveClass(/is-visible/);
}
async function 検索して読む(s: PurchaseSearchPage, r: ネット買取の検索結果): Promise<string[]> {
  const res = await s.検索する();
  expect(res.応答, "検索の応答").toBeLessThan(400);
  await r.結果を待つ();
  const rows = await r.行を読む();
  note(`検索結果（${page名(r)}）: ${rows.map((x) => `${x.商品名}（商品ID ${x.商品ID}）`).join("、") || "なし"}`);
  return rows.map((x) => x.商品ID);
}
const page名 = (r: ネット買取の検索結果) => decodeURIComponent(new URL(r.page.url()).search);
const ids = (seedId: string, codes: string[]) => codes.map((c) => f0502の商品(seedId, c).商品ID);
const 並べる = (a: string[]) => [...a].sort();

// ---- 006 ----
caseTest("IT-F05-02-006", async ({ page, step, expected }) => {
  const s = new PurchaseSearchPage(page);
  const r = new ネット買取の検索結果(page);
  const M = F0502マスタ;
  let 出た: string[] = [];
  note(買取詳細検索の注記);
  note(照らし方の注記);
  await step(1, async () => { await 一覧を開く(s); await モーダルを開く(s); });
  await step(2, async () => {
    const 失敗 = await s.入れる({
      商品名: rc("F0502-ALL-006"), カテゴリ: M.カテゴリB, 色: "赤", 固有色: "白", マナコスト: "3", カードタイプ: M.カードタイプA, サブタイプ: M.サブタイプA,
      フォーマット: M.フォーマットA, 禁止カードも表示する: false, 言語: "日本語", レアリティ: "神話レア", Foil: "特殊", フレーム: "特殊", イラストレーター: M.イラストレーターA,
    });
    if (失敗.length) note(`入れられなかった項目: ${失敗.join(" / ")}`);
    const カードセット欄 = await s.カードセット欄.count();
    if (カードセット欄 === 0) note(`カードセット（「${M.カードセットA}」）は、ネット買取商品検索モーダルに入力欄が無いので入れられなかった`);
    else await s.カードセット欄.first().selectOption({ label: M.カードセットA });
  });
  await step(3, async () => { 出た = await 検索して読む(s, r); });
  await expected(async () => {
    expect.soft(出た, "ユニサーチの検索結果としてネット買取商品一覧に表示された商品（DETAIL-ALL-006 だけ）").toEqual(ids("S-F05-02-DETAIL-006", ["DETAIL-ALL-006"]));
  });
});

// ---- 007・028（固有色） ----
caseTest("IT-F05-02-007", async ({ page, step, expected }) => {
  const s = new PurchaseSearchPage(page);
  const r = new ネット買取の検索結果(page);
  let 出た: string[] = [];
  note(買取詳細検索の注記);
  note(照らし方の注記);
  await step(1, async () => { await 一覧を開く(s); await モーダルを開く(s); });
  await step(2, async () => {
    await s.商品名欄.fill(rc("F0502-IDENTITY-007"));
    await s.色の入力("固有色", "白").locator("xpath=ancestor::label[1]").click();
    expect(await s.色の入力("固有色", "白").isChecked(), "固有色の白を選んだ").toBe(true);
    出た = await 検索して読む(s, r);
  });
  await expected(async () => {
    expect.soft(並べる(出た), "ネット買取商品一覧に表示された商品（IDENTITY-W-007 だけ）").toEqual(ids("S-F05-02-IDENTITY-007", ["IDENTITY-W-007"]));
  });
});

caseTest("IT-F05-02-028", async ({ page, step, expected }) => {
  const s = new PurchaseSearchPage(page);
  const r = new ネット買取の検索結果(page);
  let 出た: string[] = [];
  note(買取詳細検索の注記);
  note(照らし方の注記);
  await step(1, async () => { await 一覧を開く(s); await モーダルを開く(s); });
  await step(2, async () => {
    await s.商品名欄.fill(rc("F0502-IDENTITY-028"));
    for (const c of ["白", "青"]) {
      await s.色の入力("固有色", c).locator("xpath=ancestor::label[1]").click();
      expect(await s.色の入力("固有色", c).isChecked(), `固有色の${c}を選んだ`).toBe(true);
    }
    出た = await 検索して読む(s, r);
  });
  await expected(async () => {
    const S = "S-F05-02-IDENTITY-028";
    expect.soft(並べる(出た), "表示された商品（白だけ・青だけ・白と青の3件）").toEqual(並べる(ids(S, ["F0502-IDW-028", "F0502-IDU-028", "F0502-IDWU-028"])));
    expect.soft(出た, "黒を含む F0502-IDWK-028 は表示されない").not.toContain(f0502の商品(S, "F0502-IDWK-028").商品ID);
  });
});

// ---- 008（Foil）・009（フレーム） ----
caseTest("IT-F05-02-008", async ({ page, step, expected }) => {
  const s = new PurchaseSearchPage(page);
  const r = new ネット買取の検索結果(page);
  let 出た: string[] = [];
  note(買取詳細検索の注記);
  note(照らし方の注記);
  await step(1, async () => { await 一覧を開く(s); await モーダルを開く(s); });
  await step(2, async () => {
    await s.商品名欄.fill(rc("F0502-FOIL-008"));
    await s.チェックを選ぶ("foil", "特殊");
    出た = await 検索して読む(s, r);
  });
  await expected(async () => {
    expect.soft(出た, "表示された商品（Foil が特殊の FOIL-SPECIAL だけ）").toEqual(ids("S-F05-02-FOIL-FRAME-008", ["F0502-FOIL-SPECIAL-008"]));
  });
});

caseTest("IT-F05-02-009", async ({ page, step, expected }) => {
  const s = new PurchaseSearchPage(page);
  const r = new ネット買取の検索結果(page);
  const 出た: Record<string, string[]> = {};
  note("手順1の入力は、ネット買取商品一覧の「詳細検索」ボタンでネット買取商品検索モーダルを開いて行った（入力欄はモーダルにある）");
  note("手順2の「フレームで特殊を選択」は、手順1で選んだ通常を外して特殊だけを選ぶことと読んだ（条件をフレーム特殊にする）");
  note(照らし方の注記);
  await step(1, async () => {
    await 一覧を開く(s); await モーダルを開く(s);
    await s.商品名欄.fill(rc("F0502-FRAME-009"));
    await s.チェックを選ぶ("frame", "通常");
    出た["通常"] = await 検索して読む(s, r);
  });
  await step(2, async () => {
    await モーダルを開く(s);
    await s.商品名欄.fill(rc("F0502-FRAME-009"));
    await 選択を外す(s.フォーム, "frame");
    await s.チェックを選ぶ("frame", "特殊");
    出た["特殊"] = await 検索して読む(s, r);
  });
  await expected(async () => {
    const S = "S-F05-02-FOIL-FRAME-009";
    expect.soft(出た["通常"], "フレーム通常のとき表示された商品（FRAME-NORMAL だけ）").toEqual(ids(S, ["F0502-FRAME-NORMAL-009"]));
    expect.soft(出た["特殊"], "フレーム特殊のとき表示された商品（FRAME-SPECIAL だけ）").toEqual(ids(S, ["F0502-FRAME-SPECIAL-009"]));
  });
});

// ---- 011（禁止カード） ----
caseTest("IT-F05-02-011", async ({ page, step, expected }) => {
  const s = new PurchaseSearchPage(page);
  const r = new ネット買取の検索結果(page);
  const 出た: Record<string, string[]> = {};
  note("手順1の入力は、ネット買取商品一覧の「詳細検索」ボタンでネット買取商品検索モーダルを開いて行った（入力欄はモーダルにある）");
  note(照らし方の注記);
  await step(1, async () => {
    await 一覧を開く(s); await モーダルを開く(s);
    await s.商品名欄.fill(rc("F0502-BAN-011"));
    expect(await s.チェックの入力("format", "禁止カードも表示する").isChecked(), "「禁止カードも表示する」は選ばれていない").toBe(false);
    出た["未選択"] = await 検索して読む(s, r);
  });
  await step(2, async () => {
    await モーダルを開く(s);
    await s.商品名欄.fill(rc("F0502-BAN-011"));
    await s.チェックを選ぶ("format", "禁止カードも表示する");
    出た["選択"] = await 検索して読む(s, r);
  });
  await expected(async () => {
    const S = "S-F05-02-BANNED-011";
    expect.soft(出た["未選択"], "「禁止カードも表示する」未選択のとき表示された商品（BAN-REGULAR-011 だけ）").toEqual(ids(S, ["BAN-REGULAR-011"]));
    expect.soft(並べる(出た["選択"]), "「禁止カードも表示する」選択のとき表示された商品（BAN-REGULAR-011 と BAN-PROHIBITED-011）").toEqual(並べる(ids(S, ["BAN-REGULAR-011", "BAN-PROHIBITED-011"])));
  });
});

// ---- 013（タグと商品名） ----
caseTest("IT-F05-02-013", async ({ page, notes, step, expected }) => {
  const s = new PurchaseSearchPage(page);
  const r = new ネット買取の検索結果(page);
  let 出た: string[] = [];
  note("手順1の「タグを指定したネット買取商品一覧画面」は、タグのIDで指定する一覧のアドレス（/ja/purchase/search/tag/タグID）で開いた。手順2の「買取詳細検索」は「詳細検索」ボタン");
  note(照らし方の注記);
  await step(1, async () => { await 一覧を開く(s, `/ja/purchase/search/tag/${notes.get("〔タグID-F0502-013〕")}`); });
  await step(2, async () => { await モーダルを開く(s); });
  await step(3, async () => { await s.商品名欄.fill(rc("F0502-PRESERVE-013")); 出た = await 検索して読む(s, r); });
  await expected(async () => {
    expect.soft(出た, "タグと商品名の両方に一致する PRESERVE-BOTH-013 だけが表示された").toEqual(ids("S-F05-02-TAG-013", ["PRESERVE-BOTH-013"]));
  });
});

// ---- 014・015（同名商品検索のあとの検索の引継ぎ） ----
async function 同名商品検索まで(s: PurchaseSearchPage, r: ネット買取の検索結果, no: "014" | "015"): Promise<void> {
  const src = f0502の商品(`S-F05-02-CARRY-${no}`, `SOURCE-CARD-${no}`);
  await 一覧を開く(s, `/ja/purchase/search?product=${encodeURIComponent(src.名)}`);
  await r.結果を待つ();
  const row = r.行の要素(src.商品ID);
  await expect(row, `一覧に SOURCE-CARD-${no} の行がある`).toHaveCount(1);
  await r.同名商品検索を押す(row);
  await r.結果を待つ();
}

caseTest("IT-F05-02-014", async ({ page, step, expected }) => {
  const s = new PurchaseSearchPage(page);
  const r = new ネット買取の検索結果(page);
  let url = new URL("about:blank");
  note(`手順1の「ネット買取商品一覧画面」は、SOURCE-CARD-014 の商品名で検索した一覧（/ja/purchase/search?product=商品名）で開き、その行の「同名商品検索」を押した`);
  note("期待結果の「遷移元の表示順・並び順」は、遷移元で選んだ並べ替え（価格（高い順）＝並び順の引数 orderby=3）と読み、検索後のアドレスに並び順の引数とカードIDの引数（cardId）が無いことを確かめた");
  await step(1, async () => { await 同名商品検索まで(s, r, "014"); note(`同名商品検索のあとのアドレス: ${page.url()}`); });
  await step(2, async () => { note(`押した並べ替え: ${await r.並べ替える("3")}`); note(`並べ替えのあとのアドレス: ${page.url()}`); });
  await step(3, async () => { await モーダルを開く(s); });
  await step(4, async () => { await s.商品名欄.fill(rc("F0502-CARRY-014")); await 検索して読む(s, r); });
  await step(5, async () => { url = new URL(page.url()); note(`検索後のアドレス: ${page.url()}`); });
  await expected(async () => {
    expect.soft(url.searchParams.has("cardId"), "検索後のアドレスにカードID（cardId）が含まれない").toBe(false);
    expect.soft(url.searchParams.getAll("orderby").filter((v) => v === "3"), "検索後のアドレスに遷移元の並び順（価格（高い順）＝3）が含まれない").toEqual([]);
  });
});

caseTest("IT-F05-02-015", async ({ page, step, expected }) => {
  const s = new PurchaseSearchPage(page);
  const r = new ネット買取の検索結果(page);
  let 出た: string[] = [];
  note(`手順1の「ネット買取商品一覧画面」は、SOURCE-CARD-015 の商品名で検索した一覧（/ja/purchase/search?product=商品名）で開き、その行の「同名商品検索」を押した`);
  note("手順3の「一覧の絞り込みでFoilの特殊」は、一覧の上の絞り込みの「特殊Foil」のボタンと読んだ");
  note(照らし方の注記);
  await step(1, async () => { await 同名商品検索まで(s, r, "015"); });
  await step(2, async () => { await r.並べ替える("3"); });
  await step(3, async () => {
    const opts = await r.絞り込みの選択肢("foilFlg");
    const 特殊 = opts.find((o) => /特殊/.test(o.名));
    if (!特殊) throw new Error(`一覧の絞り込みに Foil の特殊が無い（${opts.map((o) => o.名).join("、")}）`);
    await r.絞り込みを押す(r.絞り込みのボタン("foilFlg", 特殊.値));
    出た = (await r.行を読む()).map((x) => x.商品ID);
    note(`絞り込みのあとのアドレス: ${page.url()}`);
  });
  await expected(async () => {
    expect.soft(出た, "同じカードIDかつ Foil が特殊の商品だけが、CARRY-HIGH-015・CARRY-LOW-015 の価格の高い順で表示された").toEqual(ids("S-F05-02-CARRY-015", ["CARRY-HIGH-015", "CARRY-LOW-015"]));
  });
});

// ---- 017（既定表示件数） ----
caseTest("IT-F05-02-017", async ({ page, step, expected }) => {
  const s = new PurchaseSearchPage(page);
  const r = new ネット買取の検索結果(page);
  let 表示 = 0;
  let 件数: string | null = null;
  let 現在 = "";
  note(買取詳細検索の注記);
  note("表示件数は一覧の行の数、検索結果の件数は一覧上部の「商品数: N点」、表示中のページはページ送りの現在の番号で読んだ");
  await step(1, async () => { await 一覧を開く(s); await モーダルを開く(s); });
  await step(2, async () => { await s.商品名欄.fill(rc("F0502-PAGING-017")); await s.検索する(); await r.結果を待つ(); });
  await step(3, async () => { 表示 = await r.行.count(); 件数 = await r.商品数の値(); 現在 = await r.現在のページ(); note(`行 ${表示}件・商品数「${件数}」・表示中のページ「${現在}」`); });
  await expected(async () => {
    expect.soft(件数, "検索結果の件数（商品数の表示）").toBe("61");
    expect.soft(表示, "表示された商品の数").toBe(60);
    expect.soft(現在, "表示中のページ").toBe("1");
  });
});

// ---- 018（ネット買取の検索対象） ----
caseTest("IT-F05-02-018", async ({ page, step, expected }) => {
  const s = new PurchaseSearchPage(page);
  const r = new ネット買取の検索結果(page);
  let 出た: string[] = [];
  note(買取詳細検索の注記);
  note(照らし方の注記);
  await step(1, async () => { await 一覧を開く(s); await モーダルを開く(s); });
  await step(2, async () => { await s.商品名欄.fill(rc("F0502-ELIGIBILITY-018")); 出た = await 検索して読む(s, r); });
  await expected(async () => {
    expect.soft(並べる(出た), "表示された商品（ELIGIBLE-NOSTOCK-018 と ELIGIBLE-STOCK-018 だけ）").toEqual(並べる(ids("S-F05-02-ELIGIBILITY-018", ["ELIGIBLE-NOSTOCK-018", "ELIGIBLE-STOCK-018"])));
  });
});

// ---- 021（カードIDで開く） ----
caseTest("IT-F05-02-021", async ({ page, notes, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  const s = new PurchaseSearchPage(page);
  let タイトル = "";
  let パンくず = "";
  let 出た: string[] = [];
  const 名 = F0502カードAの名("021");
  note(`SOURCE-CARD-021 のカードの日本語名は「${名}」（シードが付けたカード名。印つき）`);
  await step(1, async () => { await 一覧を開く(s, `/ja/purchase/search?cardId=${notes.get("〔カードID-F0502-021A〕")}`); });
  await step(2, async () => {
    await r.結果を待つ();
    タイトル = await page.title();
    パンくず = ((await page.locator(".ec-searchnavRole__topicpath").textContent()) ?? "").replace(/\s+/g, " ").trim();
    出た = (await r.行を読む()).map((x) => x.商品ID);
    note(`ページタイトル「${タイトル}」・パンくず「${パンくず}」・一覧の商品ID ${出た.join("、") || "なし"}`);
  });
  await expected(async () => {
    expect.soft(タイトル, "ページタイトルに SOURCE-CARD-021 のカードの日本語名がある").toContain(名);
    expect.soft(パンくず, "パンくずの検索条件に SOURCE-CARD-021 のカードの日本語名がある").toContain(名);
    expect.soft(出た.length, "商品一覧が表示された（同じカードの商品が出る）").toBeGreaterThan(0);
    expect.soft(出た, "商品一覧に別のカードIDの CARRY-OTHER-021 が表示されない").not.toContain(f0502の商品("S-F05-02-CARRY-021", "CARRY-OTHER-021").商品ID);
  });
});

// ---- 023・026・027（論理演算子） ----
type 条件 = { 名: string; 色?: string[]; タイプ?: string[]; 色の演算子?: "or" | "and"; タイプの演算子?: "or" | "and" };
async function 条件で検索する(s: PurchaseSearchPage, r: ネット買取の検索結果, c: 条件): Promise<string[]> {
  await 一覧を開く(s);
  await モーダルを開く(s);
  await s.商品名欄.fill(rc(c.名));
  for (const x of c.色 ?? []) await s.色の入力("色", x).locator("xpath=ancestor::label[1]").click();
  for (const x of c.タイプ ?? []) await s.チェックを選ぶ("card-type", x);
  if (c.色の演算子) await 論理演算子を選ぶ(s.フォーム, "色", c.色の演算子);
  if (c.タイプの演算子) await 論理演算子を選ぶ(s.フォーム, "カードタイプ", c.タイプの演算子);
  return 検索して読む(s, r);
}

caseTest("IT-F05-02-023", async ({ page, step, expected }) => {
  const s = new PurchaseSearchPage(page);
  const r = new ネット買取の検索結果(page);
  const M = F0502マスタ;
  const 出た: string[][] = [];
  note("手順ごとに、ネット買取商品一覧を開き直してモーダルを開き、その手順の条件だけを入れて検索した（前の手順の条件を残さない）。演算子は、モーダルの色・カードタイプの「or」「and」のラジオ");
  note(照らし方の注記);
  await step(1, async () => { 出た[1] = await 条件で検索する(s, r, { 名: "F0502-LOGIC-COLOR-023", 色: ["赤", "青"], 色の演算子: "or" }); });
  await step(2, async () => { 出た[2] = await 条件で検索する(s, r, { 名: "F0502-LOGIC-COLOR-023", 色: ["赤", "青"], 色の演算子: "and" }); });
  await step(3, async () => { 出た[3] = await 条件で検索する(s, r, { 名: "F0502-LOGIC-COLOR-023", 色の演算子: "and" }); });
  await step(4, async () => { 出た[4] = await 条件で検索する(s, r, { 名: "F0502-LOGIC-TYPE-023", タイプ: [M.カードタイプA, M.カードタイプB], タイプの演算子: "or" }); });
  await step(5, async () => { 出た[5] = await 条件で検索する(s, r, { 名: "F0502-LOGIC-TYPE-023", タイプ: [M.カードタイプA, M.カードタイプB], タイプの演算子: "and" }); });
  await expected(async () => {
    const S = "S-F05-02-LOGIC-023";
    expect.soft(並べる(出た[1]), "色の「or」: LOGIC-R・LOGIC-U・LOGIC-RU").toEqual(並べる(ids(S, ["LOGIC-R-023", "LOGIC-U-023", "LOGIC-RU-023"])));
    expect.soft(出た[2], "色の「and」: LOGIC-RU だけ").toEqual(ids(S, ["LOGIC-RU-023"]));
    expect.soft(並べる(出た[3]), "色の未選択: LOGIC-R・LOGIC-U・LOGIC-RU").toEqual(並べる(ids(S, ["LOGIC-R-023", "LOGIC-U-023", "LOGIC-RU-023"])));
    expect.soft(並べる(出た[4]), "カードタイプの「or」: LOGIC-C・LOGIC-A・LOGIC-CA").toEqual(並べる(ids(S, ["LOGIC-C-023", "LOGIC-A-023", "LOGIC-CA-023"])));
    expect.soft(出た[5], "カードタイプの「and」: LOGIC-CA だけ").toEqual(ids(S, ["LOGIC-CA-023"]));
  });
});

caseTest("IT-F05-02-026", async ({ page, step, expected }) => {
  const s = new PurchaseSearchPage(page);
  const r = new ネット買取の検索結果(page);
  const M = F0502マスタ;
  const 出た: string[][] = [];
  note("手順2のあと、手順3はネット買取商品一覧を開き直してからモーダルを開いた（手順2の条件を残さない）。演算子には触れていない");
  note(照らし方の注記);
  await step(1, async () => { await 一覧を開く(s); await モーダルを開く(s); });
  await step(2, async () => {
    await s.商品名欄.fill(rc("F0502-DEFOP-COLOR-026"));
    for (const x of ["赤", "青"]) await s.色の入力("色", x).locator("xpath=ancestor::label[1]").click();
    出た[2] = await 検索して読む(s, r);
  });
  await step(3, async () => {
    await 一覧を開く(s); await モーダルを開く(s);
    await s.商品名欄.fill(rc("F0502-DEFOP-TYPE-026"));
    for (const x of [M.カードタイプA, M.カードタイプB]) await s.チェックを選ぶ("card-type", x);
    出た[3] = await 検索して読む(s, r);
  });
  await expected(async () => {
    const S = "S-F05-02-DEFOP-026";
    expect.soft(並べる(出た[2]), "色の検索: DEFOP-R・DEFOP-U・DEFOP-RU").toEqual(並べる(ids(S, ["DEFOP-R-026", "DEFOP-U-026", "DEFOP-RU-026"])));
    expect.soft(並べる(出た[3]), "カードタイプの検索: DEFOP-C・DEFOP-A・DEFOP-CA").toEqual(並べる(ids(S, ["DEFOP-C-026", "DEFOP-A-026", "DEFOP-CA-026"])));
  });
});

caseTest("IT-F05-02-027", async ({ page, step, expected }) => {
  const s = new PurchaseSearchPage(page);
  const r = new ネット買取の検索結果(page);
  let 出た: string[] = [];
  note(買取詳細検索の注記);
  note(照らし方の注記);
  await step(1, async () => { await 一覧を開く(s); await モーダルを開く(s); });
  await step(2, async () => {
    await s.商品名欄.fill(rc("F0502-TYPEAND-027"));
    await 論理演算子を選ぶ(s.フォーム, "カードタイプ", "and");
    出た = await 検索して読む(s, r);
  });
  await expected(async () => {
    expect.soft(並べる(出た), "カードタイプで絞り込まれず、TYPEAND-C・TYPEAND-A・TYPEAND-CA の3件が表示された").toEqual(並べる(ids("S-F05-02-TYPEAND-027", ["TYPEAND-C-027", "TYPEAND-A-027", "TYPEAND-CA-027"])));
  });
});
