/**
 * F06-15 買取履歴詳細。正本: cases/F06-15_test_cases.tsv
 * 実装するのは、前提を画面で作れるケース（ネット買取の選んで買取の明細・買取状況・店頭買取のステータスだけで決まるもの）。
 * まとめて買取・個別入力商品・店頭買取の明細・商品規格が特定できない明細・削除済みの商品・決め打ちの日時や金額を確かめるケースは、
 * 前提を画面で作ったあと、画面で作れない部分を DB で整えて実装した（依頼者の承認 2026-11-10「印つきデータは何でも」。
 * 019・023〜025・039・040・045・049・052・054・056〜068・070 など。seeds/f06-15.ts 末尾・seeds/f06-prep.ts・db/f06_prep.ts）。
 * 内容の確かめが取れないもの（期待値の元が無い）だけ実装しない。
 * シードの読み替え（会員・商品・店舗・日時）は seeds/f06-15.ts の冒頭とシードの報告にある。
 */
import { Page, test } from "@playwright/test";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { 買取状況 } from "../../db/f06_15";
import { 商品コードの実在庫と履歴 } from "../../db/f06_prep";
import { 買取の値を読む, 実在庫を読む, 実在庫履歴を読む, 選んで買取の明細 } from "../../db/m07_03";
import { LoginPage } from "../../pages/front/f06_03_login";
import { NetDetailPage, 数値 } from "../../pages/front/f06_15_net_detail";
import { CBのパスワード, mailOf, PW, 品, 固定の買取番号, 詳細の番号 } from "../../seeds/f06-15";
import { STORE_A } from "../../seeds/m06-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

async function ログイン(page: Page, 前半: string, パスワード = PW): Promise<void> {
  const l = new LoginPage(page);
  await l.ログイン画面を開く();
  await l.ログインする(mailOf(前半), パスワード);
  if (await l.ログイン画面である()) throw new Error(`会員 ${mailOf(前半)} でログインできない`);
}

// ---------------------------------------------------------------- 001〜004（遷移・404）

caseTest("IT-F06-15-001", async ({ page, step, expected }) => {
  const d = new NetDetailPage(page);
  const l = new LoginPage(page);
  await step(1, async () => { await d.開く(詳細の番号.get("〔買取番号-F0615-001〕")); });
  await expected(async () => {
    expect.soft(l.path(), "遷移した画面（会員ログイン画面）").toBe("/ja/mypage/login");
    expect.soft(await d.ログイン画面である(), "会員ログイン画面が表示される（買取履歴詳細は表示されない）").toBe(true);
  });
});

function 開いて404(会員の前半: string, 番号: () => string | undefined) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const d = new NetDetailPage(page);
    let status = 0;
    await step(1, async () => { await ログイン(page, 会員の前半); });
    await step(2, async () => { status = await d.開く(番号()); });
    await expected(async () => {
      expect.soft(status, "応答の状態").toBe(404);
      expect.soft(await d.詳細画面である(), "買取履歴詳細は表示されない").toBe(false);
    });
  };
}
caseTest("IT-F06-15-002", 開いて404("f0615-002-a", () => 詳細の番号.get("〔買取番号-F0615-002〕")));
caseTest("IT-F06-15-003", async ({ page, step, expected }) => {
  note("買取番号6150039の買取が無いことはDBで確かめていない（実行区分がブラウザのみ）。他の会員の買取であっても、この会員から見れば存在しない（404）として扱われる");
  const d = new NetDetailPage(page);
  let status = 0;
  await step(1, async () => { await ログイン(page, "f0615-003"); });
  await step(2, async () => { status = await d.開く("6150039"); });
  await expected(async () => { expect.soft(status, "応答の状態").toBe(404); });
});
caseTest("IT-F06-15-004", 開いて404("f0615-004", () => undefined));

/** 一覧から番号を順に開き、処理状態を読む（手順2から） */
function 処理状態を順に読む(前半: string, 呼び名: string[], 期待: string[]) {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    const d = new NetDetailPage(page);
    const 状態: (string | null)[] = [];
    await step(1, async () => { await ログイン(page, 前半); });
    for (let i = 0; i < 呼び名.length; i++) {
      await step(i + 2, async () => { await d.一覧から開く(notes.get(呼び名[i])); 状態.push(await d.値("処理状態")); });
    }
    await expected(async () => {
      for (let i = 0; i < 呼び名.length; i++) expect.soft(状態[i], `買取番号 ${notes.get(呼び名[i])} の処理状態`).toBe(期待[i]);
    });
  };
}

/** 正本の項目名 → 画面の見出し（翻訳ファイルで確かめた表示名） */
const 見出しの対応: Record<string, string> = { 買取番号: "買取番号", 買取店舗: "店舗", 買取依頼日: "依頼日", 査定日: "査定日", 承諾日: "承諾日", 振込日: "振込日", 買取の承諾方法: "買取の承諾方法", 処理状態: "処理状態", 査定金額合計: "査定金額合計", 査定承諾金額合計: "査定承諾金額合計", 成立日: "成立日" };

caseTest("IT-F06-15-010", async ({ page, notes, step, expected }) => {
  note("正本の項目名と画面の見出しの対応: 買取店舗＝「店舗」、買取依頼日＝「依頼日」（ほかは同じ名前）");
  const d = new NetDetailPage(page);
  const 番号 = notes.get("〔買取番号-F0615-010〕");
  let 見出し: string[] = [];
  let 買取番号 = "";
  await step(1, async () => { await ログイン(page, "f0615-010"); });
  await step(2, async () => { await d.一覧から開く(番号); });
  await step(3, async () => { 見出し = await d.見出し(); 買取番号 = (await d.値("買取番号")) ?? ""; });
  await expected(async () => {
    for (const k of ["買取番号", "買取店舗", "買取依頼日", "査定日", "承諾日", "振込日", "買取の承諾方法", "処理状態", "査定金額合計", "査定承諾金額合計"]) {
      expect.soft(見出し, `基本情報に「${k}」の項目（見出し「${見出しの対応[k]}」）`).toContain(見出しの対応[k]);
    }
    expect.soft(買取番号, "買取番号の値").toBe(番号);
    expect.soft(見出し, "「オーダーID」の項目は表示されない").not.toContain("オーダーID");
  });
});

caseTest("IT-F06-15-016", async ({ page, notes, step, expected }) => {
  const d = new NetDetailPage(page);
  let 見出し: string[] = [];
  await step(1, async () => { await ログイン(page, "f0615-016"); });
  await step(2, async () => { await d.一覧から開く(notes.get("〔買取番号-F0615-016〕")); });
  await step(3, async () => { 見出し = await d.見出し(); });
  await expected(async () => {
    expect.soft(見出し, "基本情報が表示されている（買取番号の項目がある）").toContain("買取番号");
    expect.soft(見出し, "成立日の項目は表示されない").not.toContain("成立日");
  });
});

caseTest("IT-F06-15-020", async ({ page, notes, step, expected }) => {
  const d = new NetDetailPage(page);
  let 見出し: string[] = [];
  let ボタン = -1;
  await step(1, async () => { await ログイン(page, "f0615-020"); });
  await step(2, async () => { await d.一覧から開く(notes.get("〔買取番号-F0615-020〕")); });
  await step(3, async () => { 見出し = await d.見出し(); ボタン = await d.承諾ボタンの数(); });
  await expected(async () => {
    expect.soft(見出し, "基本情報が表示されている（買取番号の項目がある）").toContain("買取番号");
    for (const k of ["査定日", "承諾日", "振込日", "買取の承諾方法", "査定承諾金額合計"]) expect.soft(見出し, `「${k}」の項目は表示されない`).not.toContain(k);
    expect.soft(ボタン, "承諾確定ボタン（「承諾する」）の数").toBe(0);
  });
});

caseTest("IT-F06-15-041", async ({ page, notes, step, expected }) => {
  const d = new NetDetailPage(page);
  const 番号 = notes.get("〔買取番号-F0615-041〕");
  let v = { 状況: "", 合計: "", 売却: [] as string[] };
  await step(1, async () => { await ログイン(page, "f0615-041"); });
  await step(2, async () => { await d.一覧から開く(番号); });
  await step(3, async () => { await d.再読み込みする(); });
  await step(4, async () => {
    const b = 買取の値を読む(番号);
    v = { 状況: b.買取状況, 合計: b.査定金額合計, 売却: 選んで買取の明細(番号).map((m) => m.売却) };
  });
  await expected(async () => {
    expect.soft(v.状況, "処理状態（買取状況）").toBe("査定内容連絡済み");
    expect.soft(v.合計, "査定金額合計（円）").toBe("1000");
    expect.soft(v.売却, "明細の売却する/しない").toEqual(["する"]);
  });
});

/** 承諾確定のあと、商品コードごとに実在庫と実在庫履歴の件数をDBで読む */
function 承諾して実在庫を見る(前半: string, 呼び名: string, コード: string[], 作られる: boolean[]) {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    const d = new NetDetailPage(page);
    const 番号 = notes.get(呼び名);
    const n: Record<string, { 実在庫: number; 履歴: number }> = {};
    await step(1, async () => { await ログイン(page, 前半); });
    await step(2, async () => { await d.一覧から開く(番号); });
    await step(3, async () => { await d.承諾する(); });
    await step(4, async () => {
      const s = 実在庫を読む(番号), h = 実在庫履歴を読む(番号);
      for (const c of コード) n[c] = { 実在庫: s.filter((x) => x.商品コード === 品(c)).length, 履歴: h.filter((x) => x.商品コード === 品(c)).length };
    });
    await expected(async () => {
      for (let i = 0; i < コード.length; i++) {
        const c = コード[i];
        if (作られる[i]) {
          expect.soft(n[c].実在庫, `${c} の実在庫が作成される（件数）`).toBeGreaterThan(0);
          expect.soft(n[c].履歴, `${c} の実在庫履歴が作成される（件数）`).toBeGreaterThan(0);
        } else {
          expect.soft(n[c].実在庫, `${c} の実在庫は作成されない（件数）`).toBe(0);
          expect.soft(n[c].履歴, `${c} の実在庫履歴は作成されない（件数）`).toBe(0);
        }
      }
    });
  };
}
caseTest("IT-F06-15-042", 承諾して実在庫を見る("f0615-042", "〔買取番号-F0615-042〕", ["F0615-042-A", "F0615-042-B"], [true, false]));
caseTest("IT-F06-15-053", 承諾して実在庫を見る("f0615-053", "〔買取番号-F0615-053〕", ["F0615-053-A", "F0615-053-B"], [true, true]));

/** 売却しない件数を読み、明細の売却を切り替えて、もう一度読む */
function 売却を切り替える(前半: string, 呼び名: string, 商品名: string, 表示: "売却する" | "売却しない", 前の期待: string, 後の期待: string) {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    const d = new NetDetailPage(page);
    let 前: string | null = null, 後: string | null = null;
    let 切り替えた = false;
    await step(1, async () => { await ログイン(page, 前半); });
    await step(2, async () => { await d.一覧から開く(notes.get(呼び名)); });
    await step(3, async () => { 前 = await d.売却しない件数(); });
    await step(4, async () => { 切り替えた = (await d.売却を切り替える(品(商品名), 表示)).切り替えた; });
    await step(5, async () => { 後 = await d.売却しない件数(); });
    await expected(async () => {
      expect.soft(切り替えた, `${商品名} の売却する/しないを「${表示}」に切り替えられた`).toBe(true);
      expect.soft(前, "手順3の売却しない件数").toBe(前の期待);
      expect.soft(後, "手順5の売却しない件数").toBe(後の期待);
    });
  };
}

// ---------------------------------------------------------------- CB（決め打ちの番号は画面が振った番号に読み替える）

caseTest("IT-F06-15-069", async ({ page, step, expected }) => {
  note("決め打ちの買取番号6150691は、シードが画面で作った買取の買取番号に読み替えた");
  const d = new NetDetailPage(page);
  const 名 = 品("F0615-CB069-E");
  let m: Awaited<ReturnType<NetDetailPage["明細"]>> | null = null;
  let リンク = false;
  let 申込時 = "", 売却 = "", 変更できる = true;
  await step(1, async () => { await ログイン(page, "cbf0615-069", CBのパスワード("069")); });
  await step(2, async () => { await d.一覧から開く(固定の買取番号.get("6150691") ?? "（シードが作っていない）"); });
  await step(3, async () => { m = await d.明細(名); });
  await step(4, async () => { リンク = (await d.明細(名)).リンク; });
  await step(5, async () => { const r = await d.明細(名); 申込時 = 数値(r.申込時買取価格); 売却 = r.売却; 変更できる = r.売却を変更できる; });
  await expected(async () => {
    expect.soft(m!.査定価格, `${名} の査定価格欄`).toBe("査定中");
    expect.soft(リンク, "商品名が押せるリンクとして表示される").toBe(true);
    expect.soft(申込時, "申込時買取価格の数値").toBe("1000");
    expect.soft(売却, "売却する/しないの選択").toBe("売却する");
    expect.soft(変更できる, "売却する/しないの選択は変更できない").toBe(false);
  });
});

caseTest("IT-F06-15-071", async ({ page, step, expected }) => {
  note("決め打ちの買取番号6150711は、シードが画面で作った買取の買取番号に読み替えた");
  const d = new NetDetailPage(page);
  const 名 = 品("F0615-CB071-E");
  const c = { ボタン: -1, 一覧: -1, 欄: -1, チェック: -1, 明細: -1 };
  let r = { 切り替えた: true, 選択: "" };
  let 変更できる = true;
  await step(1, async () => { await ログイン(page, "cbf0615-071", CBのパスワード("071")); });
  await step(2, async () => { await d.一覧から開く(固定の買取番号.get("6150711") ?? "（シードが作っていない）"); });
  await step(3, async () => { c.ボタン = await d.承諾ボタンの数(); });
  await step(4, async () => {
    c.明細 = await d.明細の数(名);
    c.一覧 = await d.まとめて買取の一覧.count(); c.欄 = await d.少額カードの欄.count(); c.チェック = await d.少額カードをすべて売却するチェック.count();
  });
  await step(5, async () => { r = await d.売却を切り替える(名, "売却しない"); 変更できる = (await d.明細(名)).売却を変更できる; });
  await expected(async () => {
    expect.soft(c.明細, "えらんで買取の明細が表示されている").toBe(1);
    expect.soft(c.ボタン, "承諾確定ボタン（「承諾する」）の数").toBe(0);
    expect.soft(c.一覧, "まとめて買取の一覧").toBe(0);
    expect.soft(c.欄, "500円未満カードの欄").toBe(0);
    expect.soft(c.チェック, "500円未満のカードをすべて売却するチェック").toBe(0);
    expect.soft(変更できる, `${名} の売却する/しないの選択は操作できない`).toBe(false);
    expect.soft(r.選択, "選択は「売却する」のまま").toBe("売却する");
  });
});

// ---------------------------------------------------------------- DBで整えたシードを使うケース（店頭買取の明細・まとめて買取・個別入力商品・日時・金額）

/** 日付の表示（「2026/6/9」「2026年06月09日」など）を「2026-06-09」にそろえる。日付が読めなければ表示のまま */
const 日付 = (s: string | null): string => {
  const m = /(\d{4})\D+(\d{1,2})\D+(\d{1,2})/.exec(s ?? "");
  return m ? `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` : (s ?? "");
};

caseTest("IT-F06-15-019", async ({ page, notes, step, expected }) => {
  note("日付は表示の書式を問わず年月日で比べる（画面は「2026/6/9」の形）。買取店舗は、シード表の店舗（F0615-019-店舗）を買取店舗Aに読み替えたので、その店名で比べる。依頼日・成立日・査定金額合計はシードがDBで設定した値");
  const d = new NetDetailPage(page);
  const 番号 = notes.get("〔買取番号-F0615-019〕");
  const v: Record<string, string | null> = {};
  await step(1, async () => { await ログイン(page, "f0615-019"); });
  await step(2, async () => { await d.一覧から開く(番号); });
  await step(3, async () => { for (const k of ["買取番号", "店舗", "依頼日", "成立日", "査定金額合計", "処理状態"]) v[k] = await d.値(k); });
  await expected(async () => {
    expect.soft(v["買取番号"], "買取番号").toBe(番号);
    expect.soft(v["店舗"], "買取店舗").toBe(STORE_A.店名);
    expect.soft(日付(v["依頼日"]), "買取依頼日（年月日）").toBe("2026-06-09");
    expect.soft(日付(v["成立日"]), "成立日（年月日）").toBe("2026-06-20");
    expect.soft(数値(v["査定金額合計"] ?? ""), "査定金額合計の数値").toBe("45678");
    expect.soft(v["処理状態"], "処理状態の項目が表示される（項目がある）").not.toBeNull();
  });
});

caseTest("IT-F06-15-023", async ({ page, notes, step, expected }) => {
  note("言語は明細の言語の欄の表示を、正本の「日本語」とそのまま比べる。金額は桁区切りと通貨記号を除いた数値で比べる。買取番号6150232は、シードが画面で作った店頭買取の買取番号に読み替えた");
  const d = new NetDetailPage(page);
  const 名 = 品("F0615-023-商品A");
  let 件数 = "";
  let m: Awaited<ReturnType<NetDetailPage["明細"]>> | null = null;
  await step(1, async () => { await ログイン(page, "f0615-023"); });
  await step(2, async () => { await d.一覧から開く(notes.get("〔買取番号-F0615-023〕")); });
  await step(3, async () => { 件数 = await d.件数の表示(); m = await d.明細(名); });
  await expected(async () => {
    const r = m!;
    expect.soft(件数, "表示件数の項目").toMatch(/件数\s*\d+\s*件/);
    expect.soft(r.商品名, "明細の商品名").toBe(名);
    expect.soft(r.言語, "明細の言語").toBe("日本語");
    expect.soft(r.状態, "明細の状態").toBe("NM");
    expect.soft(数値(r.査定価格), "査定価格の数値").toBe("1200");
    expect.soft(r.数量, "数量").toBe("3");
    expect.soft(r.小計, "小計の項目（値がある）").not.toBe("");
  });
});

caseTest("IT-F06-15-024", async ({ page, notes, step, expected }) => {
  const d = new NetDetailPage(page);
  const 名 = 品("F0615-024-個別");
  let m: Awaited<ReturnType<NetDetailPage["明細"]>> | null = null;
  await step(1, async () => { await ログイン(page, "f0615-024"); });
  await step(2, async () => { await d.一覧から開く(notes.get("〔買取番号-F0615-024〕")); });
  await step(3, async () => { m = await d.明細(名); });
  await expected(async () => {
    expect.soft(m!.商品名, "個別入力商品の明細が表示されている").toBe(名);
    expect.soft(m!.言語, "個別入力商品の言語（表示されない＝空）").toBe("");
    expect.soft(m!.状態, "個別入力商品の状態（表示されない＝空）").toBe("");
  });
});

caseTest("IT-F06-15-025", async ({ page, notes, step, expected }) => {
  const d = new NetDetailPage(page);
  const c = { 明細: -1, 売却しない件数: -1, 申込時: -1, 選択: -1, 一覧: -1, こちら: -1, 欄: -1, チェック: -1, ボタン: -1 };
  await step(1, async () => { await ログイン(page, "f0615-025"); });
  await step(2, async () => { await d.一覧から開く(notes.get("〔買取番号-F0615-025〕")); });
  await step(3, async () => {
    c.明細 = await d.明細の数(品("F0615-025-商品A"));
    c.売却しない件数 = await d.売却しない件数の欄.count(); c.申込時 = await d.申込時買取価格の欄.count(); c.選択 = await d.売却の選択すべて.count();
    c.一覧 = await d.まとめて買取の一覧.count(); c.こちら = await d.少額カードのこちらのリンク.count(); c.欄 = await d.少額カードの欄.count();
    c.チェック = await d.少額カードをすべて売却するチェック.count(); c.ボタン = await d.承諾ボタンの数();
  });
  await expected(async () => {
    expect.soft(c.明細, "商品情報が表示されている（店頭買取の明細）").toBe(1);
    expect.soft(c.売却しない件数, "売却しない件数の数").toBe(0);
    expect.soft(c.申込時, "申込時買取価格の欄の数").toBe(0);
    expect.soft(c.選択, "売却する/しないの選択の数").toBe(0);
    expect.soft(c.一覧, "まとめて買取の一覧").toBe(0);
    expect.soft(c.こちら, "こちらへのリンクの数").toBe(0);
    expect.soft(c.欄, "500円未満カードの一覧").toBe(0);
    expect.soft(c.チェック, "500円未満のカードをすべて売却するチェックの数").toBe(0);
    expect.soft(c.ボタン, "承諾確定ボタン（「承諾する」）の数").toBe(0);
  });
});

caseTest("IT-F06-15-039", async ({ page, notes, step, expected }) => {
  const d = new NetDetailPage(page);
  const 名A = 品("F0615-039-規格なし"), 名B = 品("F0615-039-個別");
  let A: Page | null = null, B: Page | null = null;
  let リンクA = true, リンクB = true;
  await step(1, async () => { await ログイン(page, "f0615-039"); });
  await step(2, async () => { await d.一覧から開く(notes.get("〔買取番号-F0615-039〕")); });
  await step(3, async () => {
    リンクA = (await d.明細(名A)).リンク; リンクB = (await d.明細(名B)).リンク;
    A = await d.商品名を押す(名A); B = await d.商品名を押す(名B);
  });
  await expected(async () => {
    expect.soft(リンクA, `${名A} は文字のまま（リンクでない）`).toBe(false);
    expect.soft(リンクB, `${名B} は文字のまま（リンクでない）`).toBe(false);
    expect.soft(A === null, `${名A} を押してもウィンドウが開かない`).toBe(true);
    expect.soft(B === null, `${名B} を押してもウィンドウが開かない`).toBe(true);
  });
});

caseTest("IT-F06-15-040", async ({ page, notes, step, expected }) => {
  const d = new NetDetailPage(page);
  const 名 = 品("F0615-040-削除済み商品");
  let 数 = -1;
  await step(1, async () => { await ログイン(page, "f0615-040"); });
  await step(2, async () => { await d.一覧から開く(notes.get("〔買取番号-F0615-040〕")); });
  await step(3, async () => { 数 = await d.明細の数(名); });
  await expected(async () => {
    expect.soft(await d.詳細画面である(), "買取履歴詳細画面が表示される").toBe(true);
    expect.soft(数, `商品名 ${名} の明細の数`).toBe(1);
  });
});

caseTest("IT-F06-15-045", async ({ page, notes, step, expected }) => {
  note("個別入力商品の実在庫の確かめは、シードが紐づけた商品規格の商品コード（F0615-045-I）で、この買取の実在庫と履歴の件数を数える");
  const d = new NetDetailPage(page);
  const 番号 = notes.get("〔買取番号-F0615-045〕");
  let n = { 実在庫: -1, 履歴: -1 };
  await step(1, async () => { await ログイン(page, "f0615-045"); });
  await step(2, async () => { await d.一覧から開く(番号); });
  await step(3, async () => { await d.承諾する(); });
  await step(4, async () => { n = 商品コードの実在庫と履歴(番号, 品("F0615-045-I")); });
  await expected(async () => {
    expect.soft(n.実在庫, "F0615-045-個別の実在庫は作成されない（件数）").toBe(0);
    expect.soft(n.履歴, "F0615-045-個別の実在庫履歴は作成されない（件数）").toBe(0);
  });
});

caseTest("IT-F06-15-049", async ({ page, notes, step, expected, capture }) => {
  const d = new NetDetailPage(page);
  let r = { 選択肢: [] as string[], 操作できる: false };
  await step(1, async () => { await ログイン(page, "f0615-049"); });
  await step(2, async () => { await d.一覧から開く(notes.get("〔買取番号-F0615-049〕")); });
  await step(3, async () => { r = await d.売却の選択を開く(品("F0615-049-まとめ600")); await capture("まとめて買取の売却する/しないの選択を開いたところ"); });
  await expected(async () => {
    expect.soft(r.操作できる, "売却する/しないの選択が操作できる").toBe(true);
    expect.soft(r.選択肢, "選択肢").toEqual(["売却する", "売却しない"]);
  });
});
caseTest("IT-F06-15-052", 売却を切り替える("f0615-052", "〔買取番号-F0615-052〕", "F0615-052-まとめ600", "売却しない", "0", "1"));

caseTest("IT-F06-15-054", 承諾して実在庫を見る("f0615-054", "〔買取番号-F0615-054〕", ["F0615-054-N", "F0615-054-I"], [true, false]));

/** CB の買取に、500円未満のカードをすべて売却するチェックを入れる／入れずに承諾し、商品コードごとに実在庫と実在庫履歴の件数をDBで読む */
function 少額の売却を選んで承諾する(n: string, 入れる: boolean, コード: string[], 作られる: boolean[]) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const d = new NetDetailPage(page);
    const 固定の番号 = `6150${n.slice(1)}1`;
    const 番号 = 固定の買取番号.get(固定の番号) ?? "（シードが作っていない）";
    const c: Record<string, { 実在庫: number; 履歴: number }> = {};
    let 初期 = { ある: false, チェック済み: true, 有効: false };
    let 入った = false;
    note(`決め打ちの買取番号 ${固定の番号} は、シードが画面で作った買取の買取番号に読み替えた`);
    await step(1, async () => { await ログイン(page, `cbf0615-${n}`, CBのパスワード(n)); });
    await step(2, async () => { await d.一覧から開く(番号); 初期 = await d.少額チェックの状態(); });
    await step(3, async () => { if (入れる) 入った = await d.少額チェックを入れる(); else 入った = (await d.少額チェックの状態()).チェック済み; });
    await step(4, async () => { await d.承諾する(); });
    await step(5, async () => { for (const x of コード) c[x] = 商品コードの実在庫と履歴(番号, 品(x)); });
    await expected(async () => {
      expect.soft(初期.ある && !初期.チェック済み, "500円未満のカードをすべて売却するチェックは初期状態でチェックなし").toBe(true);
      expect.soft(入った, 入れる ? "チェックありの状態にできた" : "チェックなしのままである").toBe(入れる);
      for (let i = 0; i < コード.length; i++) {
        const x = コード[i];
        if (作られる[i]) {
          expect.soft(c[x].実在庫, `${x} の実在庫が作成される（件数）`).toBeGreaterThan(0);
          expect.soft(c[x].履歴, `${x} の実在庫履歴が作成される（件数）`).toBeGreaterThan(0);
        } else {
          expect.soft(c[x].実在庫, `${x} の実在庫は作成されない（件数）`).toBe(0);
          expect.soft(c[x].履歴, `${x} の実在庫履歴は作成されない（件数）`).toBe(0);
        }
      }
    });
  };
}
caseTest("IT-F06-15-056", 少額の売却を選んで承諾する("056", true, ["F0615-CB056-A", "F0615-CB056-L"], [true, true]));
caseTest("IT-F06-15-057", 少額の売却を選んで承諾する("057", false, ["F0615-CB057-A", "F0615-CB057-L"], [true, false]));
caseTest("IT-F06-15-058", 少額の売却を選んで承諾する("058", true, ["F0615-CB058-A", "F0615-CB058-L"], [false, true]));
caseTest("IT-F06-15-059", 少額の売却を選んで承諾する("059", false, ["F0615-CB059-A", "F0615-CB059-L"], [false, false]));
caseTest("IT-F06-15-060", 少額の売却を選んで承諾する("060", true, ["F0615-CB060-A", "F0615-CB060-L"], [false, true]));

type 明細の確かめ = {
  査定価格: string; 数量?: string; 小計?: string; リンク: boolean; 申込時?: string; 売却?: string; 変更できる?: boolean; 売却の選択なし?: boolean; 言語状態なし?: boolean;
};

/** CB の明細1件を、金額（桁区切り・通貨記号を除いた数値）・数量・小計・リンクの有無・申込時買取価格・売却の選択で確かめる（手順3〜5で同じ明細を読む）。番号は決め打ちの番号（ネット買取）か呼び名（店頭買取） */
function 明細を確かめる(n: string, 番号: { 固定: string } | { 呼び名: string }, 商品: string, 期待: 明細の確かめ) {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    const d = new NetDetailPage(page);
    const 名 = 品(商品);
    const 開く番号 = "固定" in 番号 ? (固定の買取番号.get(番号.固定) ?? "（シードが作っていない）") : notes.get(番号.呼び名);
    if ("固定" in 番号) note(`決め打ちの買取番号 ${番号.固定} は、シードが画面で作った買取の買取番号に読み替えた`);
    let m: Awaited<ReturnType<NetDetailPage["明細"]>> | null = null;
    await step(1, async () => { await ログイン(page, `cbf0615-${n}`, CBのパスワード(n)); });
    await step(2, async () => { await d.一覧から開く(開く番号); });
    await step(3, async () => { m = await d.明細(名); });
    await step(4, async () => { m = await d.明細(名); });
    await step(5, async () => { m = await d.明細(名); });
    await expected(async () => {
      const r = m!;
      expect.soft(r.商品名, "明細の商品名").toBe(名);
      expect.soft(r.査定価格 === "査定中" ? r.査定価格 : 数値(r.査定価格), "査定価格の欄").toBe(期待.査定価格);
      if (期待.数量 !== undefined) expect.soft(r.数量, "数量").toBe(期待.数量);
      if (期待.小計 !== undefined) expect.soft(数値(r.小計), "小計の数値").toBe(期待.小計);
      expect.soft(r.リンク, 期待.リンク ? "商品名は押せるリンクとして表示される" : "商品名は文字のまま（リンクでない）表示される").toBe(期待.リンク);
      if (期待.申込時 !== undefined) expect.soft(数値(r.申込時買取価格), "申込時買取価格の数値").toBe(期待.申込時);
      if (期待.売却の選択なし) expect.soft(r.売却の選択がある, "売却する/しないの選択は表示されない").toBe(false);
      if (期待.売却 !== undefined) {
        expect.soft(r.売却の選択がある, "売却する/しないの選択が表示される").toBe(true);
        expect.soft(r.売却, "売却する/しないの選択").toBe(期待.売却);
      }
      if (期待.変更できる !== undefined) expect.soft(r.売却を変更できる, "売却する/しないの選択を変更できる").toBe(期待.変更できる);
      if (期待.言語状態なし) { expect.soft(r.言語, "言語は表示されない").toBe(""); expect.soft(r.状態, "状態は表示されない").toBe(""); }
    });
  };
}

caseTest("IT-F06-15-061", 明細を確かめる("061", { 固定: "6150611" }, "F0615-CB061-M", { 査定価格: "600", 数量: "2", 小計: "1200", リンク: false, 申込時: "700", 売却: "売却する" }));
caseTest("IT-F06-15-062", 明細を確かめる("062", { 呼び名: "〔買取番号-F0615-062〕" }, "F0615-CB062-S", { 査定価格: "300", 数量: "2", 小計: "600", リンク: true, 売却の選択なし: true }));
caseTest("IT-F06-15-063", 明細を確かめる("063", { 固定: "6150631" }, "F0615-CB063-E", { 査定価格: "査定中", リンク: false, 申込時: "1000", 売却: "売却する", 変更できる: false }));
caseTest("IT-F06-15-064", 明細を確かめる("064", { 固定: "6150641" }, "F0615-CB064-I", { 査定価格: "800", 数量: "1", 小計: "800", リンク: false, 売却: "売却する", 言語状態なし: true }));
caseTest("IT-F06-15-065", 明細を確かめる("065", { 呼び名: "〔買取番号-F0615-065〕" }, "F0615-CB065-I", { 査定価格: "査定中", リンク: false, 売却の選択なし: true, 言語状態なし: true }));
caseTest("IT-F06-15-067", 明細を確かめる("067", { 呼び名: "〔買取番号-F0615-067〕" }, "F0615-CB067-S", { 査定価格: "600", 数量: "1", 小計: "600", リンク: true, 売却の選択なし: true }));
caseTest("IT-F06-15-068", 明細を確かめる("068", { 固定: "6150681" }, "F0615-CB068-E", { 査定価格: "300", 数量: "2", 小計: "600", リンク: false, 申込時: "1000", 売却: "売却する" }));

caseTest("IT-F06-15-066", async ({ page, step, expected }) => {
  note("決め打ちの買取番号6150661は、シードが画面で作った買取の買取番号に読み替えた。500円未満カードの欄の行は、価格帯の表示から数字だけを取り出して比べる");
  const d = new NetDetailPage(page);
  const 名 = 品("F0615-CB066-I");
  let 一覧 = -1;
  let 行: { 価格帯: string; 数量: string; 小計: string }[] = [];
  let チェック = { ある: false, チェック済み: false, 有効: false };
  await step(1, async () => { await ログイン(page, "cbf0615-066", CBのパスワード("066")); });
  await step(2, async () => { await d.一覧から開く(固定の買取番号.get("6150661") ?? "（シードが作っていない）"); });
  await step(3, async () => { 一覧 = await d.明細の数(名); 行 = await d.少額カードの行(); });
  await step(4, async () => { チェック = await d.少額チェックの状態(); });
  await expected(async () => {
    expect.soft(一覧, `まとめて買取の一覧に商品名 ${名} の行は表示されない（件数）`).toBe(0);
    const r = 行.find((x) => 数値(x.価格帯) === "300");
    expect.soft(r !== undefined, "500円未満カードの欄に査定別価格300の行がある").toBe(true);
    expect.soft(数値(r?.数量 ?? ""), "500円未満カードの欄の数量").toBe("2");
    expect.soft(数値(r?.小計 ?? ""), "500円未満カードの欄の小計").toBe("600");
    expect.soft(チェック.ある, "500円未満のカードをすべて売却するチェックが表示される").toBe(true);
  });
});

caseTest("IT-F06-15-070", async ({ page, step, expected }) => {
  note("決め打ちの買取番号6150701は、シードが画面で作った買取の買取番号に読み替えた");
  const d = new NetDetailPage(page);
  const 名 = 品("F0615-CB070-M");
  let ボタン = -1;
  let r = { 切り替えた: true, 選択: "" };
  let 変更できる = true;
  let チェック = { ある: false, チェック済み: false, 有効: true };
  let 入った = true;
  await step(1, async () => { await ログイン(page, "cbf0615-070", CBのパスワード("070")); });
  await step(2, async () => { await d.一覧から開く(固定の買取番号.get("6150701") ?? "（シードが作っていない）"); });
  await step(3, async () => { ボタン = await d.承諾ボタンの数(); });
  await step(4, async () => {
    r = await d.売却を切り替える(名, "売却しない"); 変更できる = (await d.明細(名)).売却を変更できる;
    入った = await d.少額チェックを入れる(); チェック = await d.少額チェックの状態();
  });
  await expected(async () => {
    expect.soft(ボタン, "承諾確定ボタン（「承諾する」）の数").toBe(0);
    expect.soft(変更できる, `${名} の売却する/しないの選択は操作できる`).toBe(false);
    expect.soft(r.選択, "選択は「売却する」のまま").toBe("売却する");
    expect.soft(チェック.ある, "500円未満のカードをすべて売却するチェックが表示される").toBe(true);
    expect.soft(入った, "500円未満のカードをすべて売却するチェックを入れられた").toBe(false);
    expect.soft(チェック.有効, "500円未満のカードをすべて売却するチェックは操作できる").toBe(false);
  });
});
