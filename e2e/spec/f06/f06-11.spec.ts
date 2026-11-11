/**
 * F06-11 買取履歴一覧。正本: cases/F06-11_test_cases.tsv
 * 実装するのは、前提を画面で作れるケース（会員・ネット買取の申込みと買取状況・店頭買取の申込みとステータス）。
 * 001・003・004・018・019・022（2026-11-04）、002・007・020・021・024・028〜034・037・038・042・048・049・051〜053・055（2026-11-10）、
 * 010〜015・035・036（2026-11-10。101件を持つ会員を1人にまとめる PM の読み替え）。
 * 依頼日・金額・状態の定義順・まとめて買取・個別入力・売却対象外・数量0・論理削除は、前提を画面で作ったあと DB で整えて実装した
 * （005・008・009・016・017・023・026・027・039〜041・043〜047・050・054。依頼者の承認 2026-11-10「印つきデータは何でも」。seeds/f06-11.ts 末尾）。
 * 実装しないのは 006（処理状態の画像と買取ステータスの対応表が別添で、期待値の元が無い）。シードの読み替え（店舗・商品・状況）は seeds/f06-11.ts の冒頭とシードの報告にある。
 */
import { test } from "@playwright/test";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { PurchaseHistoryListPage, PurchaseHistoryPage, ページ送り, ページ送りの位置, 一覧の行 } from "../../pages/front/f06_11_purchase_history";
import { 買取の保存値 } from "../../db/f06_prep";
import { mailOf, ページング会員, ページング会員の番号, 並び順005, 品, 読み替えた店舗名 } from "../../seeds/f06-11";
import "../../seeds/f06-11-b"; // 取り込みで抜けた登録を戻す: main 側が作り方を登録している seeds を読み込む（二重定義ではない）

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

caseTest("IT-F06-11-001", async ({ page, step, expected }) => {
  const h = new PurchaseHistoryPage(page);
  await step(1, async () => { await h.履歴一覧を開く(); });
  await expected(async () => {
    expect.soft(h.path, "遷移した画面（会員ログイン画面）").toBe("/ja/mypage/login");
    expect.soft(await h.ログイン画面である(), "会員ログイン画面が表示される").toBe(true);
  });
});

caseTest("IT-F06-11-003", async ({ page, step, expected }) => {
  const h = new PurchaseHistoryPage(page);
  await step(1, async () => { await h.ログインする(mailOf("f0611-a-003"), "F0611PwdCase003"); });
  await step(2, async () => { await h.マイページを開く(); });
  await step(3, async () => { await h.押して遷移する(h.買取履歴へのリンク.first()); });
  await expected(async () => {
    expect.soft(h.path, "遷移した画面（買取履歴一覧）").toBe("/ja/mypage/purchase_history");
    expect.soft(await h.履歴一覧画面である(), "買取履歴一覧画面が表示される").toBe(true);
  });
});

caseTest("IT-F06-11-004", async ({ page, step, expected }) => {
  const h = new PurchaseHistoryPage(page, "en");
  await step(1, async () => { await h.ログインする(mailOf("f0611-a-004"), "F0611PwdCase004"); });
  await step(2, async () => { await h.マイページを開く(); });
  await step(3, async () => { await expect(page.locator("main, body").first(), "英語版マイページが表示されている").toBeVisible({ timeout: 30_000 }); });
  await expected(async () => {
    expect.soft(h.path, "英語版のマイページが表示されている").toMatch(/^\/en\/mypage\/?$/);
    expect.soft(await h.買取履歴へのリンク.count(), "買取履歴一覧画面へのリンクの数").toBe(0);
  });
});

caseTest("IT-F06-11-018", async ({ page, step, expected }) => {
  const h = new PurchaseHistoryPage(page);
  await step(1, async () => { await h.ログインする(mailOf("none-f0611-018"), "F0611PwdCase018"); });
  await step(2, async () => { await h.履歴一覧を開く(); });
  await expected(async () => {
    expect.soft(await h.履歴一覧画面である(), "買取履歴一覧画面が表示される").toBe(true);
    expect.soft(await h.履歴の行.count(), "買取履歴の一覧行の数").toBe(0);
    expect.soft(await h.件数の表示(), "件数範囲の開始と総件数が0と表示される").toMatch(/0/);
  });
});

caseTest("IT-F06-11-019", async ({ page, step, expected }) => {
  const h = new PurchaseHistoryPage(page);
  await step(1, async () => { await h.ログインする(mailOf("none-f0611-019"), "F0611PwdCase019"); });
  await step(2, async () => { await h.履歴一覧を開く(); });
  await expected(async () => {
    expect.soft(h.path, "買取履歴一覧画面に留まる").toBe("/ja/mypage/purchase_history");
    expect.soft(await h.履歴なしの案内.count(), "買取履歴がない旨の案内が画面上部に表示される").toBe(1);
  });
});

caseTest("IT-F06-11-022", async ({ page, step, expected }) => {
  const h = new PurchaseHistoryPage(page);
  await step(1, async () => { await h.ログインする(mailOf("f0611-a-022"), "F0611PwdCase022"); });
  await step(2, async () => { await h.履歴一覧を開く(); });
  await step(3, async () => { await h.押して遷移する(h.マイページへ戻る); });
  await expected(async () => { expect.soft(h.path, "遷移した画面（マイページ）").toMatch(/^\/ja\/mypage\/?$/); });
});

// ---------------------------------------------------------------- 2026-11-10 追加

const 会員A = { 前半: "f0611-a", パスワード: "F0611PwdOwnersA" };
const CB = (n: string) => ({ 前半: `cbf0611-${n}`, パスワード: `Passw0rd-CBF0611${n}` });
const 数字 = (s: string) => s.replace(/[^\d]/g, "");
const 無し: ページ送り = { ある: false, 現在: "", 番号リンク: [], 最初: false, 最後: false };

/** 手順1 ログイン・手順2 一覧を開く（ページ番号・表示件数の指定なし） */
async function ログインして開く(h: PurchaseHistoryListPage, step: CaseCtx["step"], m: { 前半: string; パスワード: string }): Promise<void> {
  await step(1, async () => { await h.ログインする(mailOf(m.前半), m.パスワード); });
  await step(2, async () => { await h.履歴一覧を開く(); });
}

// ---- 028〜031・037（ページ送りの最初・最後）

function 先頭ページの最初(n: string, 位置: ページ送りの位置) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const h = new PurchaseHistoryListPage(page);
    await ログインして開く(h, step, { 前半: `f0611-${n}`, パスワード: `F0611PwdCase${n}` });
    let p: ページ送り = 無し;
    await step(3, async () => { p = await h.ページ送りを読む(位置); });
    await expected(async () => {
      expect.soft(p.ある, `画面${位置}のページ送りが表示されている`).toBe(true);
      expect.soft(p.現在, "いまのページ").toBe("1");
      expect.soft(await h.ページ送りのリンク(位置, "最初").count(), `画面${位置}のページ送りの「最初」のリンクの数`).toBe(0);
    });
  };
}
function 最終ページの最後(n: string, 位置: ページ送りの位置) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const h = new PurchaseHistoryListPage(page);
    await ログインして開く(h, step, { 前半: `f0611-${n}`, パスワード: `F0611PwdCase${n}` });
    await step(3, async () => { await h.ページ番号を押す(位置, 2); });
    let p: ページ送り = 無し;
    await step(4, async () => { p = await h.ページ送りを読む(位置); });
    await expected(async () => {
      expect.soft(p.ある, `画面${位置}のページ送りが表示されている`).toBe(true);
      expect.soft(p.現在, "いまのページ（最終ページの2ページ目）").toBe("2");
      expect.soft(await h.ページ送りのリンク(位置, "最後").count(), `画面${位置}のページ送りの「最後」のリンクの数`).toBe(0);
    });
  };
}

caseTest("IT-F06-11-042", async ({ page, notes, step, expected }) => {
  const h = new PurchaseHistoryListPage(page);
  await ログインして開く(h, step, CB("042"));
  let r: 一覧の行 | null = null;
  await step(3, async () => { r = await h.行を読む(notes.get("〔買取番号-F0611-042〕")); });
  await expected(async () => {
    note(`依頼内容: 「${r?.依頼内容の文 ?? ""}」（区分の表示: ${r?.依頼内容.map((l) => l.区分).join("、")}）。区分の表示は「えらんで買取」の後ろの「：」の有無を問わずに区分として読んだ`);
    const sel = r?.依頼内容.filter((l) => /^えらんで買取：?$/.test(l.区分)) ?? [];
    expect.soft(sel.length, "えらんで買取の行の数").toBe(1);
    expect.soft(sel[0]?.商品名 ?? "", "えらんで買取の代表商品").toBe(品("F0611-CB042-ProdC"));
    expect.soft(sel[0]?.ほか ?? "", "えらんで買取のほかの件数").toBe("ほか2件");
    expect.soft(r?.依頼内容の文 ?? "", "依頼内容に「まとめて買取：」の文言").not.toContain("まとめて買取");
  });
});

// ---- 038（買取店舗と買取金額合計）

caseTest("IT-F06-11-038", async ({ page, notes, step, expected }) => {
  const h = new PurchaseHistoryListPage(page);
  await ログインして開く(h, step, CB("038"));
  let r: 一覧の行 | null = null;
  await step(3, async () => { r = await h.行を読む(notes.get("〔買取番号-F0611-038〕")); });
  await expected(async () => {
    note(`買取金額合計の表示は「${r?.買取金額合計 ?? ""}」。金額は桁区切り・通貨記号を除いた数字で比べた`);
    expect.soft(r?.店舗 ?? "", "買取店舗").toBe("オンラインショップ");
    expect.soft(数字(r?.買取金額合計 ?? ""), "買取金額合計（円）").toBe("51038");
  });
});

// ---- 048〜055（並び順）

function 並び順(会員: { 前半: string; パスワード: string }, 上から: string[]) {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    const h = new PurchaseHistoryListPage(page);
    await ログインして開く(h, step, 会員);
    let 並び: string[] = [];
    await step(3, async () => { 並び = await h.番号の並び(); });
    await expected(async () => {
      expect.soft(並び, "一覧の買取番号の並び（上から）").toEqual(上から.map((l) => notes.get(l)));
    });
  };
}
caseTest("IT-F06-11-051", 並び順(CB("051"), ["〔買取番号-F0611-051B〕", "〔買取番号-F0611-051A〕"]));
caseTest("IT-F06-11-055", 並び順(CB("055"), ["〔買取番号-F0611-055B〕", "〔買取番号-F0611-055A〕"]));

// ---- 010〜015・035・036（101件のページ送り。101件を持つ会員を1人にまとめた読み替え。seeds/f06-11.ts）

const 読み替えの注記 = () => note(`ページング確認会員は、101件のネット買取を持つ1人の会員（${ページング会員.メール}）に読み替えた。`
  + "正本の決め打ちの買取番号は、この会員の買取番号（一覧の新しい順。注文のまま同じ状態なので買取番号の大きい順）に読み替えて確かめた");

async function ページング会員で開く(h: PurchaseHistoryListPage, step: CaseCtx["step"]): Promise<void> {
  await step(1, async () => { await h.ログインする(ページング会員.メール, ページング会員.パスワード); });
  await step(2, async () => { await h.履歴一覧を開く(); });
}

caseTest("IT-F06-11-010", async ({ page, step, expected }) => {
  const h = new PurchaseHistoryListPage(page);
  await ページング会員で開く(h, step);
  let 行数 = 0;
  await step(3, async () => { 行数 = await h.履歴の行.count(); });
  await expected(async () => {
    読み替えの注記();
    const 件数 = await h.件数の表示();
    note(`画面上部の件数の表示: 「${件数}」`);
    expect.soft(行数, "先頭ページの買取履歴の行の数").toBe(10);
    expect.soft(件数, "表示範囲（1件目から10件目）").toMatch(/(^|[^\d])1\s*[~〜～]\s*10\s*件/);
    expect.soft(件数, "総件数（101件）").toMatch(/(^|[^\d])101\s*件/);
  });
});

function 二ページ目の先頭(位置: ページ送りの位置) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const h = new PurchaseHistoryListPage(page);
    await ページング会員で開く(h, step);
    await step(3, async () => { await h.ページ番号を押す(位置, 2); });
    await expected(async () => {
      読み替えの注記();
      const p = await h.ページ送りを読む(位置);
      const 並び = await h.番号の並び();
      expect.soft(p.現在, "いまのページ").toBe("2");
      expect.soft(並び[0] ?? "", "2ページ目の先頭の買取番号（新しい順で11件目）").toBe(ページング会員の番号[10]);
    });
  };
}
caseTest("IT-F06-11-011", 二ページ目の先頭("上部"));
caseTest("IT-F06-11-012", 二ページ目の先頭("下部"));

caseTest("IT-F06-11-013", async ({ page, step, expected }) => {
  const h = new PurchaseHistoryListPage(page);
  await ページング会員で開く(h, step);
  await step(3, async () => { await h.表示件数を選ぶ(50); });
  let 行数 = 0;
  await step(4, async () => { 行数 = await h.履歴の行.count(); });
  await expected(async () => {
    読み替えの注記();
    expect.soft((await h.ページ送りを読む("上部")).現在, "いまのページ（先頭ページ）").toBe("1");
    expect.soft(行数, "先頭ページの買取履歴の行の数").toBe(50);
  });
});

caseTest("IT-F06-11-014", async ({ page, step, expected }) => {
  const h = new PurchaseHistoryListPage(page);
  await ページング会員で開く(h, step);
  await step(3, async () => {
    // 6ページ目の番号のリンクが見えるまで、見えている一番大きい番号のリンクで進む（先頭ページのページ送りに6が無いとき）
    for (let i = 0; i < 5; i++) {
      const p = await h.ページ送りを読む("上部");
      if (p.番号リンク.includes("6")) break;
      const 最大 = Math.max(...p.番号リンク.map(Number).filter((v) => v < 6));
      if (!Number.isFinite(最大)) break;
      note(`画面上部のページ送りに6ページ目のリンクが無かったので、${最大}ページ目のリンクを押して進んだ`);
      await h.ページ番号を押す("上部", 最大);
    }
    await h.ページ番号を押す("上部", 6);
  });
  let p: ページ送り = 無し;
  await step(4, async () => { p = await h.ページ送りを読む("上部"); });
  await expected(async () => {
    読み替えの注記();
    expect.soft(p.現在, "いまのページ").toBe("6");
    expect.soft(p.番号リンク, "ページ番号のリンク（6の前後4ページ分）").toEqual(["2", "3", "4", "5", "7", "8", "9", "10"]);
    expect.soft(p.最初, "「最初」のリンクがある").toBe(true);
    expect.soft(p.最後, "「最後」のリンクがある").toBe(true);
  });
});

caseTest("IT-F06-11-015", async ({ page, step, expected }) => {
  const h = new PurchaseHistoryListPage(page);
  await ページング会員で開く(h, step);
  const 記録: string[] = [];
  const 開いたページ: string[] = [];
  await step(3, async () => {
    for (let i = 0; i < 20; i++) {
      const p = await h.ページ送りを読む("上部");
      開いたページ.push(p.現在);
      記録.push(...(await h.番号の並び()));
      const 次 = Number(p.現在) + 1;
      if (!p.番号リンク.includes(String(次))) break;
      await h.ページ番号を押す("上部", 次);
    }
  });
  await expected(async () => {
    読み替えの注記();
    note(`開いたページ: ${開いたページ.join("、")}。記録した買取番号は ${記録.length} 件`);
    const 件数 = await h.件数の表示();
    expect.soft(記録.length, "全ページで記録した買取番号の数").toBe(101);
    expect.soft(new Set(記録).size, "重複を除いた買取番号の数").toBe(101);
    expect.soft([...記録].sort(), "記録した買取番号（ページング会員の101件と過不足なく一致）").toEqual([...ページング会員の番号].sort());
    expect.soft(件数, "画面の総件数（101件）").toMatch(/(^|[^\d])101\s*件/);
  });
});

caseTest("IT-F06-11-035", async ({ page, step, expected }) => {
  const h = new PurchaseHistoryListPage(page);
  await ページング会員で開く(h, step);
  await step(3, async () => { await h.ページ送りのリンクを押す("上部", "最後"); });
  let 件数 = "";
  await step(4, async () => { 件数 = await h.件数の表示(); });
  await expected(async () => {
    読み替えの注記();
    expect.soft((await h.ページ送りを読む("上部")).現在, "いまのページ").toBe("11");
    expect.soft(件数, "11ページ目の画面上部の件数表示").toBe("101~101件 ／ 101件あります");
  });
});

caseTest("IT-F06-11-036", async ({ page, step, expected }) => {
  const h = new PurchaseHistoryListPage(page);
  await ページング会員で開く(h, step);
  await step(3, async () => { await h.ページ番号を押す("上部", 2); });
  let p: ページ送り = 無し;
  await step(4, async () => { p = await h.ページ送りを読む("上部"); });
  await expected(async () => {
    読み替えの注記();
    expect.soft(p.現在, "いまのページ").toBe("2");
    expect.soft(p.番号リンク, "ページ番号のリンク（前に1、後に3〜6）").toEqual(["1", "3", "4", "5", "6"]);
    expect.soft(p.最初, "「最初」のリンクがある").toBe(true);
    expect.soft(p.最後, "「最後」のリンクがある").toBe(true);
  });
});

// ---------------------------------------------------------------- DBで整えたシードを使うケース（依頼日・金額・並び順・依頼内容の代表商品）
// 前提の画面で作れない部分は、シードが DB で整えた（依頼者の承認 2026-11-10「印つきデータは何でも」。seeds/f06-11.ts 末尾・seeds/f06-prep.ts・db/f06_prep.ts）。

/** 日付の表示（「2026/6/10」「2026年6月10日」など）を「2026-06-10」にそろえる。日付が読めなければ表示のまま */
const 日付 = (s: string): string => {
  const m = /(\d{4})\D+(\d{1,2})\D+(\d{1,2})/.exec(s);
  return m ? `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` : s;
};
const 一覧の範囲の注記 = () => note("買取番号は、シードが画面で作った買取の買取番号（ネット買取は7桁の表示、店頭買取は査定番号）に読み替えた。決め打ちの番号は使わない");

caseTest("IT-F06-11-005", async ({ page, notes, step, expected }) => {
  一覧の範囲の注記();
  note("終端4件のうち同じ依頼日（2026-06-03）の2件は、店頭買取成立を時刻の新しい側（12:00）にして、期待の順にした。履歴は21件だけの会員");
  const h = new PurchaseHistoryListPage(page);
  let 並び: string[] = [];
  await step(1, async () => { await h.ログインする(mailOf("sort-f0611-005"), "F0611PwdCase005"); });
  await step(2, async () => { await h.指定して開く({ pageSize: 50 }); });
  await step(3, async () => { 並び = await h.番号の並び(); });
  await expected(async () => {
    note(`一覧の買取番号（上から）: ${並び.join("、")}`);
    expect.soft(notes.get("〔買取番号-F0611-005〕").split(",").length, "シードが作った買取の数").toBe(21);
    expect.soft(並び, "一覧の買取番号の並び（上から）").toEqual(並び順005);
  });
});

caseTest("IT-F06-11-008", async ({ page, notes, step, expected }) => {
  const h = new PurchaseHistoryListPage(page);
  await ログインして開く(h, step, { 前半: "amount-f0611-008", パスワード: "F0611PwdCase008" });
  const 行: Record<string, 一覧の行> = {};
  const 呼び名 = ["A", "B", "C", "D"];
  await step(3, async () => { for (const x of 呼び名) 行[x] = await h.行を読む(notes.get(`〔買取番号-F0611-008${x}〕`)); });
  await expected(async () => {
    note(`買取金額合計の表示: ${呼び名.map((x) => `${x}「${行[x]?.買取金額合計 ?? ""}」`).join("、")}。金額は桁区切り・通貨記号を除いた数字で比べた`);
    expect.soft(数字(行["A"]?.買取金額合計 ?? ""), "振込待ちのネット買取の査定承諾金額合計（円）").toBe("12345");
    expect.soft(数字(行["B"]?.買取金額合計 ?? ""), "振込待ちの店頭買取の査定金額合計（円）").toBe("23456");
    expect.soft(数字(行["C"]?.買取金額合計 ?? ""), "買取完了のネット買取の査定承諾金額合計（円）").toBe("34567");
    expect.soft(数字(行["D"]?.買取金額合計 ?? ""), "買取完了の店頭買取の査定金額合計（円）").toBe("45678");
  });
});

caseTest("IT-F06-11-009", async ({ page, notes, step, expected }) => {
  const h = new PurchaseHistoryListPage(page);
  await ログインして開く(h, step, { 前半: "amount-f0611-009", パスワード: "F0611PwdCase009" });
  const 行: Record<string, 一覧の行> = {};
  const 文: Record<string, string> = {};
  await step(3, async () => {
    for (const x of ["A", "B"]) { const 番号 = notes.get(`〔買取番号-F0611-009${x}〕`); 行[x] = await h.行を読む(番号); 文[x] = await h.行(番号).innerText(); }
  });
  await expected(async () => {
    expect.soft(行["A"]?.買取金額合計, "受付完了のネット買取の買取金額合計欄（表示されない＝空）").toBe("");
    expect.soft(行["B"]?.買取金額合計, "査定中の店頭買取の買取金額合計欄（表示されない＝空）").toBe("");
    expect.soft(数字(文["A"] ?? ""), "ネット買取の行に99999円が表示されない").not.toContain("99999");
    expect.soft(数字(文["B"] ?? ""), "店頭買取の行に88888円が表示されない").not.toContain("88888");
  });
});

// ---- 016・023（依頼内容。S-F06-11-CONTENT）

caseTest("IT-F06-11-016", async ({ page, notes, step, expected }) => {
  一覧の範囲の注記();
  const h = new PurchaseHistoryListPage(page);
  await ログインして開く(h, step, { 前半: "content-f0611", パスワード: "F0611PwdContent" });
  let r: 一覧の行 | null = null;
  await step(3, async () => { r = await h.行を読む(notes.get("〔買取番号-F0611-CONTENT〕")); });
  await expected(async () => {
    note(`依頼内容: 「${r?.依頼内容の文 ?? ""}」（区分の表示: ${r?.依頼内容.map((l) => l.区分).join("、")}）。区分の表示は後ろの「：」の有無を問わずに区分として読んだ`);
    const sel = r?.依頼内容.filter((l) => /^えらんで買取：?$/.test(l.区分)) ?? [];
    const bulk = r?.依頼内容.filter((l) => /^まとめて買取：?$/.test(l.区分)) ?? [];
    expect.soft(sel[0]?.商品名 ?? "", "えらんで買取の代表商品").toBe(品("F0611-CT-商品C"));
    expect.soft(sel[0]?.ほか ?? "", "えらんで買取のほかの件数").toBe("ほか2件");
    expect.soft(bulk[0]?.商品名 ?? "", "まとめて買取の代表商品").toBe(品("F0611-CT-個別M2"));
    expect.soft(bulk[0]?.ほか ?? "", "まとめて買取のほかの件数").toBe("ほか1件");
    expect.soft(r?.依頼内容の文 ?? "", "売却対象外の商品Dは表示対象に含まれない").not.toContain(品("F0611-CT-商品D"));
    expect.soft(r?.依頼内容の文 ?? "", "数量0の商品Eは表示対象に含まれない").not.toContain(品("F0611-CT-商品E"));
  });
});

caseTest("IT-F06-11-017", async ({ page, notes, step, expected }) => {
  一覧の範囲の注記();
  const h = new PurchaseHistoryListPage(page);
  await ログインして開く(h, step, { 前半: "deleted-f0611-017", パスワード: "F0611PwdCase017" });
  let r: 一覧の行 | null = null;
  await step(3, async () => { r = await h.行を読む(notes.get("〔買取番号-F0611-017〕")); });
  await expected(async () => {
    note(`依頼内容: 「${r?.依頼内容の文 ?? ""}」`);
    expect.soft(r?.依頼内容の文 ?? "", "論理削除済みの商品の商品名が依頼内容に表示される").toContain(品("論理削除済み商品-017"));
  });
});

caseTest("IT-F06-11-023", async ({ page, notes, step, expected }) => {
  一覧の範囲の注記();
  const h = new PurchaseHistoryListPage(page);
  const 番号 = notes.get("〔買取ID-F0611-CONTENT〕");
  let 前: ReturnType<typeof 買取の保存値> | null = null, 後: ReturnType<typeof 買取の保存値> | null = null;
  await step(1, async () => { 前 = 買取の保存値(番号); });
  await step(2, async () => { await h.ログインする(mailOf("content-f0611"), "F0611PwdContent"); });
  await step(3, async () => { await h.履歴一覧を開く(); });
  await step(4, async () => { 後 = 買取の保存値(番号); });
  await expected(async () => {
    expect.soft(前?.買取件数, "表示前の買取のレコード件数").toBe(1);
    expect.soft(前?.明細.length, "表示前の通常明細の件数").toBe(6);
    expect.soft(前?.個別入力.length, "表示前の個別入力明細の件数").toBe(1);
    expect.soft(後, "買取番号・商品・数量の保存値とレコード件数が表示の前後で変わらない").toEqual(前);
  });
});

// ---- 026（依頼日）

caseTest("IT-F06-11-026", async ({ page, notes, step, expected }) => {
  note("依頼日の表示は「2026/6/10」の形。年月日を取り出して「2026年6月10日」と比べた");
  const h = new PurchaseHistoryListPage(page);
  await ログインして開く(h, step, { 前半: "f0611-026", パスワード: "F0611PwdCase026" });
  const 行: Record<string, 一覧の行> = {};
  await step(3, async () => { for (const x of ["A", "B"]) 行[x] = await h.行を読む(notes.get(`〔買取番号-F0611-026${x}〕`)); });
  await expected(async () => {
    note(`依頼日の表示: A「${行["A"]?.依頼日 ?? ""}」、B「${行["B"]?.依頼日 ?? ""}」`);
    expect.soft(日付(行["A"]?.依頼日 ?? ""), "買取番号Aの買取依頼日（年月日）").toBe("2026-06-10");
    expect.soft(日付(行["B"]?.依頼日 ?? ""), "買取番号Bの買取依頼日（年月日）").toBe("2026-05-03");
  });
});

// ---- 027・039〜041（買取店舗と買取金額合計）

caseTest("IT-F06-11-027", async ({ page, notes, step, expected }) => {
  const h = new PurchaseHistoryListPage(page);
  await ログインして開く(h, step, { 前半: "f0611-027", パスワード: "F0611PwdCase027" });
  const 行: Record<string, 一覧の行> = {};
  const 文: Record<string, string> = {};
  await step(3, async () => {
    for (const x of ["A", "B", "C"]) { const 番号 = notes.get(`〔買取番号-F0611-027${x}〕`); 行[x] = await h.行を読む(番号); 文[x] = await h.行(番号).innerText(); }
  });
  await expected(async () => {
    const 金額 = { A: "71111", B: "72222", C: "73333" };
    for (const x of ["A", "B", "C"] as const) {
      expect.soft(行[x]?.買取金額合計, `買取番号${x}の買取金額合計欄（表示されない＝空）`).toBe("");
      expect.soft(数字(文[x] ?? ""), `買取番号${x}の行に${金額[x]}円が表示されない`).not.toContain(金額[x]);
    }
  });
});

function 店舗と金額(n: string, 店舗: string, 金額: string | null, 表示しない金額?: string) {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    const h = new PurchaseHistoryListPage(page);
    await ログインして開く(h, step, CB(n));
    const 番号 = notes.get(`〔買取番号-F0611-${n}〕`);
    let r: 一覧の行 | null = null;
    let 文 = "";
    await step(3, async () => { r = await h.行を読む(番号); 文 = await h.行(番号).innerText(); });
    await expected(async () => {
      note(`買取店舗の表示は「${r?.店舗 ?? ""}」、買取金額合計の表示は「${r?.買取金額合計 ?? ""}」。金額は桁区切り・通貨記号を除いた数字で比べた`
        + (店舗 === 読み替えた店舗名 ? `。店舗「晴れる屋テスト店」は買取店舗Aに読み替えた` : ""));
      expect.soft(r?.店舗 ?? "", "買取店舗").toBe(店舗);
      if (金額 !== null) expect.soft(数字(r?.買取金額合計 ?? ""), "買取金額合計（円）").toBe(金額);
      else expect.soft(r?.買取金額合計, "買取金額合計欄（表示されない＝空）").toBe("");
      if (表示しない金額) expect.soft(数字(文), `行に${表示しない金額}円が表示されない`).not.toContain(表示しない金額);
    });
  };
}
caseTest("IT-F06-11-039", 店舗と金額("039", "オンラインショップ", null, "52039"));
caseTest("IT-F06-11-040", 店舗と金額("040", 読み替えた店舗名, "53040"));
caseTest("IT-F06-11-041", 店舗と金額("041", 読み替えた店舗名, null, "54041"));

// ---- 043〜047（依頼内容の代表商品）

function 代表商品(n: string, 期待: { 区分: "えらんで買取" | "まとめて買取"; 商品: string; ほか: string }[]) {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    一覧の範囲の注記();
    const h = new PurchaseHistoryListPage(page);
    await ログインして開く(h, step, CB(n));
    let r: 一覧の行 | null = null;
    await step(3, async () => { r = await h.行を読む(notes.get(`〔買取番号-F0611-${n}〕`)); });
    await expected(async () => {
      note(`依頼内容: 「${r?.依頼内容の文 ?? ""}」（区分の表示: ${r?.依頼内容.map((l) => l.区分).join("、")}）。区分の表示は後ろの「：」の有無を問わずに区分として読んだ`);
      const 行 = r?.依頼内容 ?? [];
      expect.soft(行.map((l) => l.区分.replace(/：$/, "")), "依頼内容の区分（上から）").toEqual(期待.map((e) => e.区分));
      期待.forEach((e, i) => {
        expect.soft(行[i]?.商品名 ?? "", `${e.区分}の代表商品`).toBe(品(e.商品));
        expect.soft(行[i]?.ほか ?? "", `${e.区分}のほかの件数`).toBe(e.ほか);
      });
    });
  };
}
caseTest("IT-F06-11-043", 代表商品("043", [{ 区分: "えらんで買取", 商品: "F0611-CB043-ProdB", ほか: "ほか2件" }]));
caseTest("IT-F06-11-044", 代表商品("044", [{ 区分: "まとめて買取", 商品: "F0611-CB044-ProdM2", ほか: "ほか1件" }]));
caseTest("IT-F06-11-045", 代表商品("045", [{ 区分: "まとめて買取", 商品: "F0611-CB045-ProdM2", ほか: "ほか1件" }]));
caseTest("IT-F06-11-046", 代表商品("046", [{ 区分: "えらんで買取", 商品: "F0611-CB046-ProdB", ほか: "ほか1件" }, { 区分: "まとめて買取", 商品: "F0611-CB046-ProdM2", ほか: "ほか1件" }]));
caseTest("IT-F06-11-047", 代表商品("047", [{ 区分: "えらんで買取", 商品: "F0611-CB047-ProdB", ほか: "ほか1件" }, { 区分: "まとめて買取", 商品: "F0611-CB047-ProdM2", ほか: "ほか1件" }]));

// ---- 050・054（依頼日が新しい順）

caseTest("IT-F06-11-050", 並び順(CB("050"), ["〔買取番号-F0611-050A〕", "〔買取番号-F0611-050B〕"]));
caseTest("IT-F06-11-054", 並び順(CB("054"), ["〔買取番号-F0611-054A〕", "〔買取番号-F0611-054B〕"]));
