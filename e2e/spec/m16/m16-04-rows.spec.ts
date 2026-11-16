/**
 * M16-04 MTGマスターデータ編集 のうち、共有のマスタに試験の行を足す・書き換えるケース（2026-11-12 追加。夜の1本流しで流す）。
 * 正本: cases/M16-04_test_cases.tsv
 *
 * - シード（seeds/m16-04-rows.ts）が、書き換える種別の全行を画面で控えてから試験の行（印 -E2E）を足し、ケースの終わりに
 *   足した行を消して元の行を控えた値に戻し、開き直して同じことを確かめる（lib/shared_restore.ts）。
 * - 既存の行は消さない。正本の「〜は3件のみ」「1件のみ」は「既存の行＋試験の行」になる（ケースごとに注記に残す）。
 * - 正本の値に印を付けた値で作る（例「編集前カラー-023」→「編集前カラー-023-E2E」）。カラーの名前は20文字までなので、
 *   印を付けて20文字を超える値は「-M1604-」を「-」に縮めた（例「保持確認カラー-M1604-051」→「保持確認カラー-051-E2E」）。
 */
import { Page, test } from "@playwright/test";
import { カラーの件数, カラーの行, 日本語名のカラー, 行の並び順 } from "../../db/m16_04";
import { caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { expectSaved } from "../../pages/admin/common";
import { MtgMasterEditPage, 列の値, 日時の表示にそろえる } from "../../pages/admin/m16_04_master";
import { DeckSearchModal, DeckTopPage } from "../../pages/front/f09_01_deck_top";
import { DeckResultPage } from "../../pages/front/f09_02_deck_result";
import { DeckShowPage } from "../../pages/front/f09_06_deck_show";
import { M1604_ADMIN } from "../../seeds/m16-04";
import { M1604QN_ADMIN, QN, QNタグ, カラーの名, 二十一種別, 印, 境界の行, 種別ごとの番号 } from "../../seeds/m16-04-rows";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 共有の注記 = "共有のマスタなので、シードは既存の行を消さずに試験の行（印 -E2E）を足した。ケースの終わりに、足した行を消し、既存の行を控えた値に戻して確かめる";
const 対応 = (正本: string, 実際: string) => `正本の「${正本}」は「${実際}」`;

async function 開いて選ぶ(page: Page, 種別: string): Promise<MtgMasterEditPage> {
  const m = new MtgMasterEditPage(page);
  await m.open();
  await m.種別を選んで表示する(種別);
  return m;
}

/** 番号の行の値（無ければ undefined） */
async function 行(m: MtgMasterEditPage, 番号: number) {
  return (await m.全行を読む()).find((r) => r.番号 === 番号);
}

/** 行を画面に出して撮る */
async function 行を撮る(m: MtgMasterEditPage, 番号: number, capture: (l: string) => Promise<void>, ラベル: string): Promise<void> {
  const r = m.番号の行(番号);
  if (await r.count()) { await r.first().scrollIntoViewIfNeeded(); await capture(ラベル); }
}

// ---------------------------------------------------------------------------
// 005: カードタイプの3件が欠落なく表示される
// ---------------------------------------------------------------------------
caseTest("IT-M16-04-005", async ({ page, notes, step, expected, capture }) => {
  await loginAdmin(page, M1604_ADMIN);
  const m = new MtgMasterEditPage(page);
  await step(1, async () => { await m.open(); });
  await step(2, async () => { await m.種別を選んで表示する("カードタイプ"); });
  // 日本語名の入力欄の値が、試験の名前と完全に一致する行（その行だけを確かめて赤枠で囲む）
  const 試験の行 = (k: string) => m.一覧の領域.locator("tbody tr").filter({ has: page.locator(`input[value="${印(`試験カードタイプ${k}`)}"]`) });
  await step(3, async () => { await 試験の行("C").first().scrollIntoViewIfNeeded().catch(() => undefined); });
  note(`${共有の注記}。「カードタイプは3件のみ」は「既存のカードタイプ＋試験の3件」になる。${["A", "B", "C"].map((k) => 対応(`試験カードタイプ${k}`, 印(`試験カードタイプ${k}`))).join("・")}`);
  await expected(async () => {
    for (const k of ["A", "B", "C"]) {
      await expect.soft(試験の行(k), `「試験カードタイプ${k}」（${印(`試験カードタイプ${k}`)}）の行が一覧に1行表示される`).toHaveCount(1);
    }
    await 行を撮る(m, Number(notes.get("〔カードタイプID-M1604-共有A〕")), capture, "試験カードタイプAの行");
  });
});

// ---------------------------------------------------------------------------
// 008: キャンペーンタグの表示開始日時・表示終了日時の表示
// ---------------------------------------------------------------------------
caseTest("IT-M16-04-008", async ({ page, notes, step, expected, capture }) => {
  await loginAdmin(page, M1604_ADMIN);
  const id = Number(notes.get("〔キャンペーンタグID-M1604-008〕"));
  const m = new MtgMasterEditPage(page);
  await step(1, async () => { await m.open(); });
  await step(2, async () => { await m.種別を選んで表示する("キャンペーンタグ"); });
  let r: Awaited<ReturnType<typeof 行>>;
  await step(3, async () => { r = await 行(m, id); await 行を撮る(m, id, capture, "日時表示確認タグ-008の行"); });
  note(`${共有の注記}。${対応("日時表示確認タグ-008", 印("日時表示確認タグ-008"))}`);
  note("表示開始日時・表示終了日時の欄は日時の入力欄（秒の欄なし）。入力欄の値（例 2026-09-01T10:00）を「2026-09-01 10:00:00」の形にそろえて比べた");
  await expected(async () => {
    expect(r, `キャンペーンタグ（番号 ${id}）の行が一覧にある`).toBeTruthy();
    expect.soft(列の値(r, 2), "行の2列目（日本語名）").toBe(印("日時表示確認タグ-008"));
    expect.soft(日時の表示にそろえる(列の値(r, 4)), "表示開始日時").toBe("2026-09-01 10:00:00");
    expect.soft(日時の表示にそろえる(列の値(r, 5)), "表示終了日時").toBe("2026-09-30 20:00:00");
  });
});

// ---------------------------------------------------------------------------
// 014: 21種別の「並びA」の並び順を5へ
// ---------------------------------------------------------------------------
caseTest("IT-M16-04-014", async ({ page, notes, step, expected, capture }) => {
  await loginAdmin(page, M1604_ADMIN);
  const A = 種別ごとの番号(notes.get("〔並びA行ID-M1604-014〕"));
  const m = new MtgMasterEditPage(page);
  const 入れた: Record<string, string> = {};
  const 結果: Record<string, string[]> = {};
  const 前の並び: Record<string, string> = {};
  await step(1, async () => { await m.open(); });
  await step(2, async () => {
    for (const k of 二十一種別) { await m.種別を選んで表示する(k); 前の並び[k] = 列の値(await 行(m, A[k]), 1); }
  });
  await step(3, async () => {
    for (const k of 二十一種別) {
      await m.種別を選んで表示する(k);
      let v = "5";
      if (k === "デッキタグ") {
        const 使用 = new Set((await m.全行を読む()).filter((r) => r.番号 !== A[k]).map((r) => 列の値(r, 1)));
        if (使用.has("5")) { let n = 1; while (使用.has(String(n))) n += 1; v = String(n); note(`正本の「5」を、デッキタグだけは確かめられていない。デッキタグは並び順が重なると登録できない作りで、既存の行（印の無い共有の行）に並び順5があるため。その既存の行は書き換えない（共有のマスタの印の無い行は動かさない決まり）ので、並びA を ${v} にして登録した。デッキタグの「並びAの並び順が5で更新される」は未確認（ほかの20種別は5で確かめた）`); }
      }
      await m.列で入れる(A[k], { 1: v });
      入れた[k] = v;
      const r = await m.登録して結果を読む();
      結果[k] = [...r.成功, ...r.エラー];
      // 種別ごとに、登録のあとの画面（「並びA」の行の並び順の入力欄。赤枠）を残す
      await expect.soft(m.番号の行(A[k]).locator("input").first(), `${k}: 「並びA」の行（番号 ${A[k]}）の並び順の入力欄（登録のあとの画面。${v}${v === "5" ? "" : "。正本は5だが重なるため"}）`).toHaveValue(v);
      await 行を撮る(m, A[k], capture, `${k}の「並びA」の行（登録のあと）`);
    }
  });
  const DB: Record<string, string | null> = {};
  await step(4, async () => { for (const k of 二十一種別) DB[k] = 行の並び順(k, A[k]); });
  note(`${共有の注記}。各種別の既存の行は残る（「各種別はこの2件のみ」は「既存の行＋2件」）。登録の画面の表示: ${二十一種別.map((k) => `${k}=${(結果[k] ?? []).join(" / ") || "なし"}`).join("、")}`);
  note(`登録の前の「並びA」の並び順: ${二十一種別.map((k) => `${k}=${前の並び[k] ?? ""}`).join("、")}`);
  await expected(async () => {
    for (const k of 二十一種別) expect.soft(DB[k], `${k}: 「並びA」の行（番号 ${A[k]}）の並び順（DB。正本は5${入れた[k] && 入れた[k] !== "5" ? `。${k}は5にできず ${入れた[k]} で確かめた` : ""}）`).toBe(入れた[k] ?? "5");
  });
});

// ---------------------------------------------------------------------------
// 018: 編集ロックの12行の並び順を5へ
// ---------------------------------------------------------------------------
caseTest("IT-M16-04-018", async ({ page, step, expected, capture }) => {
  await loginAdmin(page, M1604_ADMIN);
  const m = new MtgMasterEditPage(page);
  const 前の並び: Record<string, string> = {};
  const 結果: Record<string, string[]> = {};
  await step(1, async () => { await m.open(); });
  await step(2, async () => {
    for (const [k, id] of 境界の行) { await m.種別を選んで表示する(k); 前の並び[k] = 列の値(await 行(m, id), 1); }
  });
  await step(3, async () => {
    for (const [k, id] of 境界の行) {
      await m.種別を選んで表示する(k);
      await m.列で入れる(id, { 1: "5" });
      const r = await m.登録して結果を読む();
      結果[k] = [...r.成功, ...r.エラー];
      // 並び順が書き換わった行の画面（登録のあとの一覧）を、レアリティの行で撮る
      if (k === "レアリティ") await 行を撮る(m, id, capture, `レアリティ（番号 ${id}）の行（登録のあとの並び順）`);
    }
  });
  const DB: Record<string, string | null> = {};
  await step(4, async () => { for (const [k, id] of 境界の行) DB[k] = 行の並び順(k, id); });
  note("読み替え: シード表の境界の行（DBで並び順20などに設定する）は、既存の境界IDの行を使い、並び順が20でない行はシードが画面で20に合わせた（DBは使わない）。12種別の全行はシードが控え、ケースの終わりに元の並び順へ戻す");
  note(`書き換える前の並び順: ${境界の行.map(([k, id]) => `${k} ID ${id}=${前の並び[k] ?? "（行が無い）"}`).join("、")}。登録の画面の表示: ${境界の行.map(([k]) => `${k}=${(結果[k] ?? []).join(" / ") || "なし"}`).join("、")}`);
  await expected(async () => {
    for (const [k, id] of 境界の行) expect.soft(DB[k], `${k}: 境界の行（ID ${id}）の並び順（DB）`).toBe("5");
  });
});

// ---------------------------------------------------------------------------
// カラーの登録・削除・残す（023〜027・032・050・051）
// ---------------------------------------------------------------------------
const カラーの注記 = (n: string) => `${共有の注記}。「カラーは3件のみ」は「既存のカラー＋試験の3件」になる。${["編集前カラー", "削除対象カラー", "保持確認カラー"].map((x) => 対応(`${x}-${n}`, カラーの名(`${x}-${n}`))).join("・")}`;

caseTest("IT-M16-04-023", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const a = Number(notes.get("〔カラーID-M1604-023A〕"));
  const 新 = カラーの名("更新後カラー");
  let m!: MtgMasterEditPage;
  await step(1, async () => { m = new MtgMasterEditPage(page); await m.open(); });
  await step(2, async () => { await m.種別を選んで表示する("カラー"); });
  await step(3, async () => { await m.列で入れる(a, { 2: 新 }); });
  await step(4, async () => { await m.登録を押す(); await expectSaved(page, "カラーの登録"); });
  let r: ReturnType<typeof カラーの行> = null;
  await step(5, async () => { r = カラーの行(a); });
  note(`${カラーの注記("023")}。${対応("更新後カラー", 新)}`);
  await expected(async () => {
    expect(r, `番号 ${a} のカラーの行がDBに残っている（主キーが保持されている）`).not.toBeNull();
    expect.soft(r?.日本語名, `番号 ${a} の行の2列目（日本語名。DB）`).toBe(新);
  });
});

caseTest("IT-M16-04-024", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const b = Number(notes.get("〔カラーID-M1604-024B〕"));
  let m!: MtgMasterEditPage;
  await step(1, async () => { m = new MtgMasterEditPage(page); await m.open(); });
  await step(2, async () => { await m.種別を選んで表示する("カラー"); });
  await step(3, async () => { await m.行を空にする(b); });
  await step(4, async () => { await m.登録を押す(); await expectSaved(page, "カラーの登録"); });
  let r: ReturnType<typeof カラーの行> = null;
  await step(5, async () => { r = カラーの行(b); });
  note(カラーの注記("024"));
  await expected(async () => {
    expect(r, `番号 ${b} のカラーの行がDBから削除されている`).toBeNull();
  });
});

caseTest("IT-M16-04-025", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const c = Number(notes.get("〔カラーID-M1604-025C〕"));
  let m!: MtgMasterEditPage;
  await step(1, async () => { m = new MtgMasterEditPage(page); await m.open(); });
  await step(2, async () => { await m.種別を選んで表示する("カラー"); });
  await step(3, async () => { await m.列で入れる(c, { 2: "", 3: "" }); });
  await step(4, async () => { await m.登録を押す(); await expectSaved(page, "カラーの登録"); });
  let r: ReturnType<typeof カラーの行> = null;
  await step(5, async () => { r = カラーの行(c); });
  note(カラーの注記("025"));
  await expected(async () => {
    expect(r, `番号 ${c} のカラーの行がDBに残っている（削除されていない）`).not.toBeNull();
    expect.soft(r?.並び順, `番号 ${c} の行の並び順（DB）`).toBe("40");
  });
});

caseTest("IT-M16-04-026", async ({ page, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const 初め = カラーの件数();
  note(`${カラーの注記("026")}。事前準備の「DBで件数が3件であることを確認済み」は、ケースの初めにDBで読んだ件数 ${初め} 件（既存＋試験の3件）として控えた`);
  let m!: MtgMasterEditPage;
  await step(1, async () => { m = await 開いて選ぶ(page, "カラー"); });
  let 空行の値: string[] = [];
  await step(2, async () => {
    空行の値 = await m.入力用の空行.locator("input").evaluateAll((es) => es.map((e) => (e as HTMLInputElement).value));
    await m.登録を押す();
    await expectSaved(page, "カラーの登録");
    // 保存のあとの画面は、スタイル（CSS）が当たってから撮る（崩れた画面で撮らない）
    await page.waitForLoadState("load");
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
  });
  let 後 = -1;
  await step(3, async () => { 後 = カラーの件数(); });
  await expected(async () => {
    expect.soft(空行の値.every((v) => v === ""), "登録を押す前の末尾の空行の入力値がすべて空").toBe(true);
    expect.soft(後, `カラーの件数（DB）がケースの初めの ${初め} 件のまま`).toBe(初め);
  });
});

caseTest("IT-M16-04-027", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const a = Number(notes.get("〔カラーID-M1604-027A〕"));
  let m!: MtgMasterEditPage;
  await step(1, async () => { m = new MtgMasterEditPage(page); await m.open(); });
  await step(2, async () => { await m.種別を選んで表示する("カラー"); });
  await step(3, async () => { await m.列で入れる(a, { 1: "25" }); });
  let r = { 成功: [] as string[], エラー: [] as string[], 状態: 0 };
  await step(4, async () => { r = await m.登録して結果を読む(); });
  note(`${カラーの注記("027")}。登録のあとの画面の表示: 成功=${r.成功.join(" / ") || "なし"}・エラー=${r.エラー.join(" / ") || "なし"}`);
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移先の画面（MTGマスターデータ編集）").toMatch(/\/data\/mtg_master_data\/?$/);
    expect.soft(await m.選ばれている表示名(), "遷移先で選ばれている種別").toBe("カラー");
    await expect.soft(m.一覧の領域, "カラーの一覧の領域").toBeVisible();
    const 並び順の項目 = (await m.列の項目())[0];
    await m.番号の行(a).scrollIntoViewIfNeeded();
    await expect.soft(m.行の欄(a, 並び順の項目), `番号 ${a} の行の並び順（遷移先の一覧）`).toHaveValue("25");
  });
});

caseTest("IT-M16-04-032", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const a = Number(notes.get("〔カラーID-M1604-032A〕"));
  const 改 = カラーの名("トークン改ざん更新");
  let m!: MtgMasterEditPage;
  await step(1, async () => { m = await 開いて選ぶ(page, "カラー"); });
  await step(2, async () => { await m.列で入れる(a, { 2: 改 }); });
  let 書き換えた = 0;
  await step(3, async () => { 書き換えた = await m.トークンを書き換える("invalid-token"); });
  await step(4, async () => { await m.登録を押す(); });
  let r: ReturnType<typeof カラーの行> = null;
  await step(5, async () => { r = カラーの行(a); });
  note(`${カラーの注記("032")}。${対応("トークン改ざん更新", 改)}`);
  await expected(async () => {
    expect.soft(書き換えた, "書き換えたなりすまし対策トークンの数").toBeGreaterThan(0);
    expect(r, `番号 ${a} のカラーの行がDBにある`).not.toBeNull();
    expect.soft(r?.日本語名, `番号 ${a} の行の2列目（日本語名。DB）が更新されていない`).toBe(カラーの名("編集前カラー-032"));
  });
});

caseTest("IT-M16-04-050", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const ids = (["A", "B", "C"] as const).map((k) => Number(notes.get(`〔カラーID-M1604-050${k}〕`)));
  let m!: MtgMasterEditPage;
  await step(1, async () => { m = new MtgMasterEditPage(page); await m.open(); });
  await step(2, async () => { await m.種別を選んで表示する("カラー"); });
  await step(3, async () => {
    await m.列で入れる(ids[0], { 1: "21" });
    await m.列で入れる(ids[1], { 1: "31" });
    await m.列で入れる(ids[2], { 1: "41" });
  });
  await step(4, async () => { await m.登録を押す(); await expectSaved(page, "カラーの登録"); });
  let r: ReturnType<typeof カラーの行>[] = [];
  await step(5, async () => { r = ids.map((x) => カラーの行(x)); });
  note(`${共有の注記}。「カラーは3件だけ」は「既存のカラー＋試験の3件」になる。${["A", "B", "C"].map((k) => 対応(`並びカラー${k}-M1604-050`, カラーの名(`並びカラー${k}-M1604-050`))).join("・")}`);
  await expected(async () => {
    // 行ごとに、確かめる直前にDBを読む（帯の照会の条件が、確かめる行の番号になる）
    ["21", "31", "41"].forEach((v, i) => expect.soft(カラーの行(ids[i])?.並び順, `番号 ${ids[i]} の行の並び順（DB）`).toBe(v));
  });
});

caseTest("IT-M16-04-051", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const [a, b, c] = (["A", "B", "C"] as const).map((k) => Number(notes.get(`〔カラーID-M1604-051${k}〕`)));
  const 更新後 = カラーの名("更新後カラー-M1604-051");
  const 新規 = カラーの名("新規カラー-M1604-051");
  let m!: MtgMasterEditPage;
  await step(1, async () => { m = new MtgMasterEditPage(page); await m.open(); });
  await step(2, async () => { await m.種別を選んで表示する("カラー"); });
  await step(3, async () => { await m.列で入れる(a, { 2: 更新後 }); });
  await step(4, async () => { await m.行を空にする(b); });
  await step(5, async () => { await m.列で入れる("new", { 1: "50", 2: 新規, 3: カラーの名("NewColor-M1604-051") }); });
  await step(6, async () => { await m.登録を押す(); await expectSaved(page, "カラーの登録"); });
  let ra: ReturnType<typeof カラーの行> = null, rb: ReturnType<typeof カラーの行> = null, rc: ReturnType<typeof カラーの行> = null;
  let 新しい行: ReturnType<typeof 日本語名のカラー> = [];
  await step(7, async () => { ra = カラーの行(a); rb = カラーの行(b); rc = カラーの行(c); 新しい行 = 日本語名のカラー(新規); });
  note(`${共有の注記}。「カラーは3件だけ」は「既存のカラー＋試験の3件」になる。${[["更新前カラー-M1604-051"], ["削除対象カラー-M1604-051"], ["保持確認カラー-M1604-051"], ["更新後カラー-M1604-051"], ["新規カラー-M1604-051"], ["NewColor-M1604-051"]].map(([x]) => 対応(x, カラーの名(x))).join("・")}（カラーの名前は20文字まで）`);
  await expected(async () => {
    // 行ごとに、確かめる直前にDBを読む（帯の照会の条件が、確かめる行の番号・名前になる）
    expect(カラーの行(a), `番号 ${a} のカラーの行がDBに残っている（主キーが保たれている）`).not.toBeNull();
    expect.soft(カラーの行(a)?.日本語名, `番号 ${a} の行の2列目（DB）`).toBe(更新後);
    expect.soft(カラーの行(b), `番号 ${b} のカラーの行がDBから削除されている`).toBeNull();
    expect.soft(カラーの行(c)?.日本語名, `番号 ${c} の行の2列目（DB）`).toBe(カラーの名("保持確認カラー-M1604-051"));
    expect.soft(カラーの行(c)?.並び順, `番号 ${c} の行の並び順（DB）`).toBe("40");
    expect.soft(日本語名のカラー(新規).length, `2列目が「${新規}」の行の数（DB）`).toBe(1);
    expect.soft(日本語名のカラー(新規)[0]?.並び順, `2列目が「${新規}」の行の並び順（DB）`).toBe("50");
  });
});

// ---------------------------------------------------------------------------
// キャンペーンタグの日時の入力漏れ（029・031・043・045）: 一覧を表示した画面へ戻る
// ---------------------------------------------------------------------------
async function 戻った画面(m: MtgMasterEditPage, r: { 成功: string[]; エラー: string[] }) {
  note(`登録のあとの画面の表示: 成功=${r.成功.join(" / ") || "なし"}・エラー=${r.エラー.join(" / ") || "なし"}`);
  return {
    画面: new URL(m.page.url()).pathname, 種別: await m.選ばれている表示名(),
    一覧: await m.一覧の領域.isVisible(), 行の数: await m.登録済みの行.count(),
  };
}

caseTest("IT-M16-04-029", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const id = Number(notes.get("〔キャンペーンタグID-M1604-029〕"));
  let m!: MtgMasterEditPage;
  await step(1, async () => { m = await 開いて選ぶ(page, "キャンペーンタグ"); });
  await step(2, async () => { await m.列で入れる(id, { 4: "" }); });
  let r = { 成功: [] as string[], エラー: [] as string[], 状態: 0 };
  await step(3, async () => { r = await m.登録して結果を読む(); });
  note(`${共有の注記}。${対応("日時表示確認タグ-029", 印("日時表示確認タグ-029"))}`);
  await expected(async () => {
    const g = await 戻った画面(m, r);
    expect.soft(g.画面, "戻った画面（MTGマスターデータ編集）").toMatch(/\/data\/mtg_master_data\/?$/);
    expect.soft(g.種別, "戻った画面で選ばれている種別").toBe("キャンペーンタグ");
    expect.soft(g.一覧, "キャンペーンタグの一覧の領域が表示されている").toBe(true);
    expect.soft(g.行の数, "キャンペーンタグの一覧の行の数（一覧が表示されている）").toBeGreaterThan(0);
  });
});

caseTest("IT-M16-04-031", async ({ page, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  let m!: MtgMasterEditPage;
  await step(1, async () => { m = await 開いて選ぶ(page, "キャンペーンタグ"); });
  await step(2, async () => { await m.列で入れる("new", { 2: 印("日時欠落新規タグ"), 5: "2026-10-31T20:00", 1: "30" }); });
  let r = { 成功: [] as string[], エラー: [] as string[], 状態: 0 };
  await step(3, async () => { r = await m.登録して結果を読む(); });
  note(`${共有の注記}。${対応("日時欠落新規タグ", 印("日時欠落新規タグ"))}。3列目（英語名）は正本に値が無いので空のまま。表示終了日時は日時の入力欄に 2026-10-31 20:00 を入れた（秒の欄は無い）`);
  await expected(async () => {
    const g = await 戻った画面(m, r);
    expect.soft(g.画面, "戻った画面（MTGマスターデータ編集）").toMatch(/\/data\/mtg_master_data\/?$/);
    expect.soft(g.種別, "戻った画面で選ばれている種別").toBe("キャンペーンタグ");
    expect.soft(g.一覧, "キャンペーンタグの一覧の領域が表示されている").toBe(true);
    expect.soft(g.行の数, "キャンペーンタグの一覧の行の数（一覧が表示されている）").toBeGreaterThan(0);
  });
});

caseTest("IT-M16-04-043", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const id = Number(notes.get("〔キャンペーンタグID-M1604-043〕"));
  let m!: MtgMasterEditPage;
  await step(1, async () => { m = await 開いて選ぶ(page, "キャンペーンタグ"); });
  await step(2, async () => { await m.列で入れる(id, { 5: "" }); });
  let r = { 成功: [] as string[], エラー: [] as string[], 状態: 0 };
  await step(3, async () => { r = await m.登録して結果を読む(); });
  note(`${共有の注記}。${対応("M1604-043-更新前タグ", 印("M1604-043-更新前タグ"))}`);
  await expected(async () => {
    const g = await 戻った画面(m, r);
    expect.soft(g.画面, "戻った画面（MTGマスターデータ編集）").toMatch(/\/data\/mtg_master_data\/?$/);
    expect.soft(g.種別, "戻った画面で選ばれている種別").toBe("キャンペーンタグ");
    expect.soft(g.一覧, "キャンペーンタグの一覧の領域が表示されている").toBe(true);
    expect.soft(g.行の数, "キャンペーンタグの一覧の行の数（一覧が表示されている）").toBeGreaterThan(0);
  });
});

caseTest("IT-M16-04-045", async ({ page, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  let m!: MtgMasterEditPage;
  await step(1, async () => { m = await 開いて選ぶ(page, "キャンペーンタグ"); });
  await step(2, async () => { await m.列で入れる("new", { 2: 印("M1604-045-新規タグ"), 3: 印("M1604-045-NewTag"), 4: "2026-10-01T10:00", 1: "30" }); });
  let r = { 成功: [] as string[], エラー: [] as string[], 状態: 0 };
  await step(3, async () => { r = await m.登録して結果を読む(); });
  note(`${共有の注記}。${対応("M1604-045-新規タグ", 印("M1604-045-新規タグ"))}・${対応("M1604-045-NewTag", 印("M1604-045-NewTag"))}。表示開始日時は日時の入力欄に 2026-10-01 10:00 を入れた（秒の欄は無い）`);
  await expected(async () => {
    const g = await 戻った画面(m, r);
    expect.soft(g.画面, "戻った画面（MTGマスターデータ編集）").toMatch(/\/data\/mtg_master_data\/?$/);
    expect.soft(g.種別, "戻った画面で選ばれている種別").toBe("キャンペーンタグ");
    expect.soft(g.一覧, "キャンペーンタグの一覧の領域が表示されている").toBe(true);
    expect.soft(g.行の数, "キャンペーンタグの一覧の行の数（一覧が表示されている）").toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// お問い合わせ件名（040・046）
// ---------------------------------------------------------------------------
caseTest("IT-M16-04-040", async ({ page, notes, step, expected, capture }) => {
  await loginAdmin(page, M1604_ADMIN);
  const id = Number(notes.get("〔お問い合わせ件名ID-M1604-040〕"));
  const 件名 = 印("M1604-040-件名");
  const m = new MtgMasterEditPage(page);
  await step(1, async () => { await m.open(); });
  await step(2, async () => { await m.選択欄.selectOption({ label: "お問い合わせ件名" }); });
  await step(3, async () => { await m.選択を押す(); });
  note(`読み替え: 既存のお問い合わせ件名は、お問い合わせ履歴が参照していて消せないので残したまま、試験の1件（${件名}。正本「M1604-040-件名」に印）を足した。「1件のみ」は「既存の件名＋試験の1件」になる。期待結果の「1行だけ」は、試験の1件（番号 ${id}）の行が一覧に1行だけ（重ならずに）出ることとして確かめた`);
  await expected(async () => {
    await expect.soft(m.一覧の領域, "お問い合わせ件名の一覧の領域").toBeVisible();
    expect.soft(await m.選ばれている表示名(), "選ばれている種別").toBe("お問い合わせ件名");
    await expect.soft(m.番号の行(id), `番号 ${id} の行の数`).toHaveCount(1);
    await expect.soft(m.一覧の領域.locator(`input[value="${件名}"]`), `件名「${件名}」の入力欄の数（この件名の行が1行）`).toHaveCount(1);
    await 行を撮る(m, id, capture, "試験の件名の行");
  });
});

caseTest("IT-M16-04-046", async ({ page, step, expected, capture }) => {
  await loginAdmin(page, M1604_ADMIN);
  const m = new MtgMasterEditPage(page);
  await step(1, async () => { await m.open(); });
  await step(2, async () => { await m.選択欄.selectOption({ label: "お問い合わせ件名" }); });
  await step(3, async () => { await m.選択を押す(); });
  let 行の数 = 0, 見出し: string[] = [], 入力できない: boolean[] = [], 対象の番号 = 0;
  await step(4, async () => {
    見出し = await m.見出し();
    const 番号たち = (await m.全行を読む()).map((x) => x.番号);
    対象の番号 = 番号たち.length ? Math.min(...番号たち) : 0;
    const r = m.番号の行(対象の番号);
    行の数 = 対象の番号 ? await r.count() : 0;
    if (行の数 === 1) { 入力できない = await m.入力できない列(r); await r.scrollIntoViewIfNeeded(); await capture(`ID ${対象の番号} の行`); }
  });
  note(`読み替え: シード表の「既存の件名を消し、DBで採番を46に合わせて M1604-046-件名 を登録する」は、共有のデータを消す・DBを書き換えるので行わない。ID 46 の行は環境に無いので、画面に既にある行のうち識別番号が最も小さい行（ID ${対象の番号}）の2列目が入力できるかで確かめた（行の値は書き換えない）。確かめたいのは「主キーの値が小さい行でもロックされない」こと`);
  await expected(async () => {
    expect(行の数, `主キーが最も小さい既存の行（ID ${対象の番号}）がある`).toBe(1);
    expect.soft(対象の番号, "確かめた行のID（46以下＝主キーの値が小さい行）").toBeLessThanOrEqual(46);
    expect.soft(見出し[1], "2列目の見出し").toBe("subject");
    expect.soft(入力できない[1] === false, `ID ${対象の番号} の行の2列目が読み取り専用にならず入力できる`).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 連携試験（048・049）
// ---------------------------------------------------------------------------
async function デッキタグの名前を変える(page: Page, 前: string, 後: string): Promise<string[]> {
  const m = new MtgMasterEditPage(page);
  const r = (await m.全行を読む()).filter((x) => 列の値(x, 2) === 前);
  // 赤枠は、その名前の入力欄のある行だけに付ける
  await expect(m.一覧の領域.locator("tbody tr").filter({ has: page.locator(`input[value="${前}"]`) }), `デッキタグの一覧に日本語名「${前}」の行が1行ある`).toHaveCount(1);
  await m.列で入れる(r[0].番号, { 2: 後, 3: 後 });
  const res = await m.登録して結果を読む();
  return [...res.成功, ...res.エラー];
}

caseTest("IT-M16-04-048", async ({ page, step, expected }) => {
  const 選手 = QN("M1604QN001-選手");
  const 前 = QNタグ("M1604QN001-タグ前");
  const 後 = QNタグ("M1604QN001-タグ後");
  const top = new DeckTopPage(page);
  const modal = new DeckSearchModal(page);
  const 結果 = new DeckResultPage(page);
  const 検索する = async (): Promise<void> => { await modal.入れる("player", 選手); await modal.検索する(); await 結果.読み込みを待つ(); };
  // 選手の行のデッキタグだけを読む（赤枠はその行のタグに付く）
  const 行のタグ = async (): Promise<string[][]> => {
    await 結果.読み込みを待つ();
    const 行たち = 結果.一覧の項目.filter({ has: page.locator(".deckSearch-searchResult__item__playerName__td", { hasText: 選手 }) });
    const n = await 行たち.count();
    const out: string[][] = [];
    for (let i = 0; i < n; i++) out.push((await 行たち.nth(i).locator(".deckSearch-searchResult__item__deckTag__link").allInnerTexts()).map((t) => t.trim()));
    return out;
  };
  const 検索して行のタグ = async (): Promise<string[][]> => { await 検索する(); return 行のタグ(); };
  await step(1, async () => { await top.開く(); });
  await step(2, async () => { await modal.開く(); await modal.クリアする(); });
  let 手順3: string[][] = [];
  await step(3, async () => { 手順3 = await 検索して行のタグ(); });
  const m = new MtgMasterEditPage(page);
  await step(4, async () => { await loginAdmin(page, M1604QN_ADMIN); await m.open(); });
  await step(5, async () => { await m.種別を選んで表示する("デッキタグ"); });
  let 登録の表示: string[] = [];
  await step(6, async () => { 登録の表示 = await デッキタグの名前を変える(page, 前, 後); });
  let 手順8: string[][] = [];
  await step(7, async () => { await top.開く(); await modal.開く(); await modal.クリアする(); await 検索する(); });
  await step(8, async () => { 手順8 = await 行のタグ(); });
  note(`${対応("M1604QN001-選手", 選手)}・${対応("M1604QN001-タグ前", 前)}・${対応("M1604QN001-タグ後", 後)}。「クリア」と検索条件の入力欄は、画面上部の「詳細検索」で開くモーダルの中にある。モーダルを開いてから押した`);
  note(`デッキタグの登録のあとの画面の表示: ${登録の表示.join(" / ") || "なし"}。デッキタグは共有のマスタなので、シードが一覧を控え、ケースの終わりに足した行を消す`);
  await expected(async () => {
    expect.soft(手順3.length, `手順3: 一覧にプレイヤー名「${選手}」の行が1行ある`).toBe(1);
    expect.soft(手順3[0] ?? [], `手順3: プレイヤー名「${選手}」の行のデッキタグ`).toEqual([前]);
    expect.soft(手順8.length, `手順8: 一覧にプレイヤー名「${選手}」の行が1行ある`).toBe(1);
    expect.soft(手順8[0] ?? [], `手順8: プレイヤー名「${選手}」の行のデッキタグに「${後}」が並ぶ`).toContain(後);
    expect.soft(手順8[0] ?? [], `手順8: プレイヤー名「${選手}」の行のデッキタグに「${前}」が並ばない`).not.toContain(前);
  });
});

caseTest("IT-M16-04-049", async ({ page, notes, step, expected }) => {
  const デッキID = notes.get("〔デッキID-M16-04-002〕");
  const 前 = QNタグ("M1604QN002-タグ前");
  const 後 = QNタグ("M1604QN002-タグ後");
  const show = new DeckShowPage(page);
  // 情報欄のタグの欄だけを読む（赤枠はそのタグの欄に付く）
  const タグの欄の本文 = show.情報欄の領域.locator(".deckSearch-deckList__information__flex__list")
    .filter({ has: page.locator(".deckSearch-deckList__information__list__header", { hasText: /^\s*タグ\s*$/ }) })
    .locator(".deckSearch-deckList__information__list__body");
  const タグの欄 = async (): Promise<string[]> => ((await タグの欄の本文.innerText()) ?? "").replace(/\s+/g, " ").split(",").map((t) => t.trim()).filter(Boolean);
  await step(1, async () => { await show.開く(デッキID); });
  let 手順2: string[] = [];
  await step(2, async () => { await show.情報欄の領域.scrollIntoViewIfNeeded(); 手順2 = await タグの欄(); });
  const m = new MtgMasterEditPage(page);
  await step(3, async () => { await loginAdmin(page, M1604QN_ADMIN); await m.open(); });
  await step(4, async () => { await m.種別を選んで表示する("デッキタグ"); });
  let 登録の表示: string[] = [];
  await step(5, async () => { 登録の表示 = await デッキタグの名前を変える(page, 前, 後); });
  await step(6, async () => { await show.開く(デッキID); });
  let 手順7: string[] = [];
  await step(7, async () => { await show.情報欄の領域.scrollIntoViewIfNeeded(); 手順7 = await タグの欄(); });
  note(`${対応("M1604QN002-タグ前", 前)}・${対応("M1604QN002-タグ後", 後)}。デッキタグの登録のあとの画面の表示: ${登録の表示.join(" / ") || "なし"}`);
  await expected(async () => {
    expect.soft(手順2, "手順2: 情報欄のタグの欄").toEqual([前]);
    expect.soft(手順7, `手順7: 情報欄のタグの欄に「${後}」が表示される`).toContain(後);
    expect.soft(手順7, `手順7: 情報欄のタグの欄に「${前}」が表示されない`).not.toContain(前);
  });
});
