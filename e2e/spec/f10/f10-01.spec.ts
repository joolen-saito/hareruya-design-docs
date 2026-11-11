/**
 * F10-01 会員IDの連携（フロント アクセス解析）。正本: cases/F10-01_test_cases.tsv
 *
 * - 「ブラウザの開発者ツールのコンソールで受け渡し領域（dataLayer）の内容を表示する」は、ページの中で受け渡し領域の値を読み出して代える。
 *   読んだ中身は手順の注記に残す。
 * - 会員IDは画面が振る番号なので、シード表の会員ID（92010001 など）にはならない。「値 92010001」は「その会員（S-F10-01-MEM-001）の会員ID」として、
 *   シードが管理画面の会員一覧で読んだ値と比べる（seeds/f10-01.ts）。メールアドレスは前半に実行の印を付けた値で入力する。
 * - 追加ページのページ名には実行の印を付けている。公開URLはシードが控えたもの（ページ登録画面のURL欄の前置き＋URL欄の値）。
 * 実装しないケース（記録 review/F10-01_progress_2026-11-10.md）: 012（共有のページのレイアウトを書き換えて戻さない）、023（撮影の入力画像が決まらない）、
 * 028（管理画面の受注登録の部品が無い）。
 */
import { devices, Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { 削除ボタン, 名前がラベルか, 名前の行, 編集リンク } from "../../pages/admin/f10_01_layout";
import { ブロック管理 } from "../../pages/admin/m09_07_block";
import { FrontCart, FrontDetail, 店 } from "../../pages/front/f03_02_detail";
import { LoginPage } from "../../pages/front/f06_03_login";
import {
  オンライン本人確認を開く, マイページを開く, 受け渡し領域, 受け渡し領域の型, 受け渡し領域を読む, 公開URLを開く, 商品一覧を開く, 本店ECTOPを開く,
  英語のログイン画面を開く, 身分証を選んで撮影画面へ,
} from "../../pages/front/f10_01_datalayer";
import {
  F1001_ADMIN_026, F1001_ADMIN_027, メールの値, パスワードの値, 会員IDの値, 公開URLの値, 商品IDの値, 姓, 会員, 連携ブロック名,
} from "../../seeds/f10-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 会員IDの注記 = (seedId: string) => note(`会員IDは画面が振った番号 ${会員IDの値(seedId)}（${seedId} の会員。シード表の会員IDの値の代わりに、この値で確かめる）`);

/** ログイン画面で、会員のメールアドレス（実行の印つき）・パスワードを入れてログインする。ログインできなかったら注記に残す */
async function ログインする(l: LoginPage, seedId: string): Promise<void> {
  await l.ログインする(メールの値(seedId), パスワードの値(seedId));
  if (await l.ログイン画面である()) note(`ログインのあともログイン画面のまま（${await l.認証エラー()}）`);
}

/** 受け渡し領域を読み、中身を注記に残す（コンソールで表示する代わり） */
async function 表示する(page: Page): Promise<受け渡し領域> {
  const d = await 受け渡し領域を読む(page);
  note(`受け渡し領域（${new URL(page.url()).pathname}）: ${d.配列か ? `配列・${d.要素.length}要素 ${d.要素.map((e) => e.文).join(" , ").slice(0, 1500)}` : `配列でない（型 ${d.型}）`}`);
  return d;
}

const uidの要素 = (d: 受け渡し領域) => d.要素.filter((e) => e.uidあり);
const uidが値の要素 = (d: 受け渡し領域, 会員ID: string) => uidの要素(d).filter((e) => e.uidの値 === 会員ID);
const uidの値の並び = (d: 受け渡し領域) => uidの要素(d).map((e) => `${e.uidの値}（${e.uidの型}）`).join("、") || "なし";

/** ログインして画面を開き、受け渡し領域に会員IDの uid が1件あることを確かめる（001・008・009・010・011・014） */
function ログインして開く(seedId: string, 開く: (page: Page) => Promise<void>, 画面: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const l = new LoginPage(page);
    let d: 受け渡し領域 | undefined;
    await step(1, async () => { await l.ログイン画面を開く(); });
    await step(2, async () => { await ログインする(l, seedId); });
    await step(3, async () => { await 開く(page); });
    await step(4, async () => { d = await 表示する(page); });
    await expected(async () => {
      const id = 会員IDの値(seedId);
      会員IDの注記(seedId);
      expect.soft(uidが値の要素(d!, id).length, `${画面}で、項目名 uid が会員ID ${id} の要素の数（uid の値: ${uidの値の並び(d!)}）`).toBe(1);
    });
  };
}

/** ログインして画面を開き、受け渡し領域に uid の要素が無いことを確かめる */
function ログインして無いことを見る(seedId: string, 開く: (page: Page) => Promise<void>) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const l = new LoginPage(page);
    let d: 受け渡し領域 | undefined;
    await step(1, async () => { await l.ログイン画面を開く(); });
    await step(2, async () => { await ログインする(l, seedId); });
    await step(3, async () => { await 開く(page); });
    await step(4, async () => { d = await 表示する(page); });
    await expected(async () => {
      expect.soft(uidの要素(d!).length, `項目名 uid を持つ要素の数（uid の値: ${uidの値の並び(d!)}）`).toBe(0);
    });
  };
}

// ---- ログインしている会員の会員IDを積む ----
caseTest("IT-F10-01-001", ログインして開く("S-F10-01-MEM-001", (p) => 本店ECTOPを開く(p), "本店ECTOP画面"));
caseTest("IT-F10-01-008", ログインして開く("S-F10-01-MEM-008", (p) => 商品一覧を開く(p), "商品一覧画面"));
caseTest("IT-F10-01-009", ログインして開く("S-F10-01-MEM-009", async (p) => {
  note("商品コード「F1001-009-A」は実行の印つきの値で作った商品。シードが商品コードで読んだ商品IDで商品詳細画面を開く");
  await new FrontDetail(p).open(店.本店, 商品IDの値("F1001-009-A"));
}, "商品詳細画面"));
caseTest("IT-F10-01-010", ログインして開く("S-F10-01-MEM-010", async (p) => { await new FrontCart(p).open(店.本店); }, "買い物かご画面"));
caseTest("IT-F10-01-011", ログインして開く("S-F10-01-MEM-011", (p) => マイページを開く(p), "マイページ画面"));
caseTest("IT-F10-01-014", ログインして開く("S-F10-01-MEM-014", async (p) => { await 公開URLを開く(p, 公開URLの値("追加ページF1001-014")); }, "追加ページF1001-014"));

caseTest("IT-F10-01-002", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  let d: 受け渡し領域 | undefined;
  await step(1, async () => { await l.ログイン画面を開く(); });
  await step(2, async () => { await ログインする(l, "S-F10-01-MEM-002"); });
  await step(3, async () => { await 本店ECTOPを開く(page); });
  await step(4, async () => {
    if (!(await l.マイページのログアウトを押す())) throw new Error("マイページ画面にログアウトが見当たらず押せない");
  });
  await step(5, async () => { await l.ログイン画面を開く(); });
  await step(6, async () => { await ログインする(l, "S-F10-01-MEMB-002"); });
  await step(7, async () => { await 本店ECTOPを開く(page); });
  await step(8, async () => { d = await 表示する(page); });
  await expected(async () => {
    const b = 会員IDの値("S-F10-01-MEMB-002");
    const a = 会員IDの値("S-F10-01-MEM-002");
    note(`会員IDは画面が振った番号。あとからログインした会員（S-F10-01-MEMB-002）は ${b}、先にログインした会員（S-F10-01-MEM-002）は ${a}`);
    expect.soft(uidが値の要素(d!, b).length, `項目名 uid が、あとからログインした会員の会員ID ${b} の要素の数（uid の値: ${uidの値の並び(d!)}）`).toBe(1);
    expect.soft(uidが値の要素(d!, a).length, `項目名 uid が、先にログインした会員の会員ID ${a} の要素の数`).toBe(0);
  });
});

caseTest("IT-F10-01-003", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  let d: 受け渡し領域 | undefined;
  await step(1, async () => { await l.ログイン画面を開く(); });
  await step(2, async () => { await ログインする(l, "S-F10-01-MEM-003"); });
  await step(3, async () => { await 本店ECTOPを開く(page); });
  await step(4, async () => { d = await 表示する(page); });
  await expected(async () => {
    const id = 会員IDの値("S-F10-01-MEM-003");
    会員IDの注記("S-F10-01-MEM-003");
    const hit = uidが値の要素(d!, id);
    expect(hit.length, `項目名 uid が会員ID ${id} の要素の数（uid の値: ${uidの値の並び(d!)}）`).toBe(1);
    expect.soft(hit[0].uidの型, "uid の値の型（文字列でなく数値）").toBe("number");
  });
});

caseTest("IT-F10-01-004", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  let d: 受け渡し領域 | undefined;
  await step(1, async () => { await l.ログイン画面を開く(); });
  await step(2, async () => { await ログインする(l, "S-F10-01-MEM-004"); });
  await step(3, async () => { await 本店ECTOPを開く(page); });
  await step(4, async () => { d = await 表示する(page); });
  await expected(async () => {
    const uids = uidの要素(d!);
    expect(uids.length, `項目名 uid を持つ要素の数（uid の値: ${uidの値の並び(d!)}）`).toBe(1);
    expect.soft(uids[0].項目名, "uid の要素の項目名（uid の1つだけ）").toEqual(["uid"]);
    const 氏名 = `${姓} ${会員["S-F10-01-MEM-004"].名}`;
    const メール = メールの値("S-F10-01-MEM-004");
    const 全文 = d!.要素.map((e) => e.文).join("\n");
    expect.soft(全文.includes(氏名), `受け渡し領域のどの要素にも、氏名「${氏名}」が含まれない`).toBe(false);
    expect.soft(全文.includes(会員["S-F10-01-MEM-004"].名), `受け渡し領域のどの要素にも、名「${会員["S-F10-01-MEM-004"].名}」が含まれない`).toBe(false);
    expect.soft(全文.includes(メール), `受け渡し領域のどの要素にも、メールアドレス「${メール}」が含まれない`).toBe(false);
  });
});

/** 先に値を積むブロックのあとに会員IDを足す（005）／積まない（031） */
caseTest("IT-F10-01-005", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  let d: 受け渡し領域 | undefined;
  await step(1, async () => { await l.ログイン画面を開く(); });
  await step(2, async () => { await ログインする(l, "S-F10-01-MEM-005"); });
  await step(3, async () => { await 公開URLを開く(page, 公開URLの値("追加ページF1001-005")); });
  await step(4, async () => { d = await 表示する(page); });
  await expected(async () => {
    const id = 会員IDの値("S-F10-01-MEM-005");
    会員IDの注記("S-F10-01-MEM-005");
    const 印 = d!.要素.map((e, i) => ({ e, i })).filter(({ e }) => e.文 === JSON.stringify({ "marker-F1001-005": "F1001-005" }));
    const uid側 = d!.要素.map((e, i) => ({ e, i })).filter(({ e }) => e.uidあり && e.uidの値 === id);
    expect.soft(印.length, "項目名 marker-F1001-005 が値 \"F1001-005\" の要素の数").toBe(1);
    expect.soft(uid側.length, `項目名 uid が会員ID ${id} の要素の数（uid の値: ${uidの値の並び(d!)}）`).toBe(1);
    expect.soft(印.length === 1 && uid側.length === 1 && uid側[0].i > 印[0].i, `uid の要素（${uid側.map((x) => x.i).join("、") || "なし"}番目）が marker の要素（${印.map((x) => x.i).join("、") || "なし"}番目）より後ろにある`).toBe(true);
  });
});

caseTest("IT-F10-01-031", async ({ page, step, expected }) => {
  let d: 受け渡し領域 | undefined;
  await step(1, async () => { await 公開URLを開く(page, 公開URLの値("追加ページF1001-CB031")); });
  await step(2, async () => { d = await 表示する(page); });
  await expected(async () => {
    expect.soft(d!.配列か, `受け渡し領域が配列として存在する（型 ${d!.型}）`).toBe(true);
    expect.soft(d!.要素.filter((e) => e.文 === JSON.stringify({ "marker-F1001-CB031": "F1001-CB031" })).length, "項目名 marker-F1001-CB031 が値 F1001-CB031 の要素の数").toBe(1);
    expect.soft(uidの要素(d!).length, `項目名 uid を持つ要素の数（uid の値: ${uidの値の並び(d!)}）`).toBe(0);
  });
});

caseTest("IT-F10-01-006", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  let d: 受け渡し領域 | undefined;
  await step(1, async () => { await l.ログイン画面を開く(); });
  await step(2, async () => { await ログインする(l, "S-F10-01-MEM-006"); });
  await step(3, async () => { await 公開URLを開く(page, 公開URLの値("追加ページF1001-006")); });
  await step(4, async () => { d = await 表示する(page); });
  await expected(async () => {
    const id = 会員IDの値("S-F10-01-MEM-006");
    会員IDの注記("S-F10-01-MEM-006");
    expect.soft(d!.配列か, `受け渡し領域が配列として存在する（型 ${d!.型}）`).toBe(true);
    expect.soft(uidが値の要素(d!, id).length, `項目名 uid が会員ID ${id} の要素の数（uid の値: ${uidの値の並び(d!)}）`).toBe(1);
  });
});

// ---- ログインしていない・ブロックを置いていない ----
/** ログインせずに画面を開き、uid の要素が無いことを確かめる（007・018・019） */
function 未ログインで開く(開く: (page: Page) => Promise<void>) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    let d: 受け渡し領域 | undefined;
    await step(1, async () => { await 開く(page); });
    await step(2, async () => { d = await 表示する(page); });
    await expected(async () => {
      expect.soft(uidの要素(d!).length, `項目名 uid を持つ要素の数（受け渡し領域: ${d!.配列か ? `${d!.要素.length}要素` : `型 ${d!.型}`}）`).toBe(0);
    });
  };
}
caseTest("IT-F10-01-007", 未ログインで開く((p) => 本店ECTOPを開く(p)));
caseTest("IT-F10-01-018", 未ログインで開く((p) => 本店ECTOPを開く(p, "en")));
caseTest("IT-F10-01-019", 未ログインで開く(async (p) => { await 公開URLを開く(p, 公開URLの値("追加ページF1001-019")); }));

caseTest("IT-F10-01-013", ログインして無いことを見る("S-F10-01-MEM-013", async (p) => { await 公開URLを開く(p, 公開URLの値("追加ページF1001-013")); }));

caseTest("IT-F10-01-024", async ({ page, step, expected }) => {
  let 型 = "";
  await step(1, async () => { await 公開URLを開く(page, 公開URLの値("追加ページF1001-024")); });
  await step(2, async () => { 型 = await 受け渡し領域の型(page); note(`typeof dataLayer の結果: ${型}`); });
  await expected(async () => {
    expect(型, "typeof dataLayer の実行結果（受け渡し領域が用意されていない）").toBe("undefined");
  });
});

// ---- 仮会員・退会済みはログインできない ----
function ログインできない(seedId: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const l = new LoginPage(page);
    let d: 受け渡し領域 | undefined;
    await step(1, async () => { await l.ログイン画面を開く(); });
    await step(2, async () => { await l.ログインする(メールの値(seedId), パスワードの値(seedId)); });
    await step(3, async () => {
      const err = await l.認証エラー();
      if (err) note(`ログイン画面の表示: ${err}`);
      expect.soft(await l.ログイン画面である(), "ログインできずログイン画面にとどまっている").toBe(true);
    });
    await step(4, async () => { d = await 表示する(page); });
    await expected(async () => {
      expect.soft(uidの要素(d!).length, `項目名 uid を持つ要素の数（uid の値: ${uidの値の並び(d!)}）`).toBe(0);
    });
  };
}
caseTest("IT-F10-01-015", ログインできない("S-F10-01-MEM-015"));
caseTest("IT-F10-01-016", ログインできない("S-F10-01-MEM-016"));

// ---- 英語サイト ----
caseTest("IT-F10-01-017", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  let d: 受け渡し領域 | undefined;
  await step(1, async () => { await 英語のログイン画面を開く(page); });
  await step(2, async () => { await ログインする(l, "S-F10-01-MEM-017"); });
  await step(3, async () => { await 本店ECTOPを開く(page, "en"); });
  await step(4, async () => { d = await 表示する(page); });
  await expected(async () => {
    const id = 会員IDの値("S-F10-01-MEM-017");
    note(`「日本語サイトと同じ値」は、日本語サイトで積む値＝ログインしている会員の会員ID ${id}（画面が振った番号）として確かめた`);
    expect.soft(new URL(page.url()).pathname.startsWith("/en"), `英語サイトの画面を開いている（${new URL(page.url()).pathname}）`).toBe(true);
    expect.soft(uidが値の要素(d!, id).length, `項目名 uid が会員ID ${id} の要素の数（uid の値: ${uidの値の並び(d!)}）`).toBe(1);
  });
});

// ---- オンライン本人確認（スマートフォン版ブラウザ） ----
test.describe("スマートフォン版ブラウザ", () => {
  const { userAgent, viewport, deviceScaleFactor, isMobile, hasTouch } = devices["iPhone 13"];
  test.use({ userAgent, viewport, deviceScaleFactor, isMobile, hasTouch });

  caseTest("IT-F10-01-021", async ({ page, step, expected }) => {
    const l = new LoginPage(page);
    let d: 受け渡し領域 | undefined;
    note("スマートフォン版ブラウザは、iPhone の利用者エージェント・画面の大きさ・タッチの設定のブラウザで代えた");
    await step(1, async () => { await l.ログイン画面を開く(); });
    await step(2, async () => { await ログインする(l, "S-F10-01-MEM-021"); });
    await step(3, async () => { await オンライン本人確認を開く(page); });
    await step(4, async () => { d = await 表示する(page); });
    await expected(async () => {
      const id = 会員IDの値("S-F10-01-MEM-021");
      会員IDの注記("S-F10-01-MEM-021");
      expect.soft(new URL(page.url()).pathname, "オンライン本人確認画面を開いている").toBe("/ja/mypage/identification");
      expect.soft(uidが値の要素(d!, id).length, `オンライン本人確認画面で、項目名 uid が会員ID ${id} の要素の数（uid の値: ${uidの値の並び(d!)}）`).toBe(1);
    });
  });

  caseTest("IT-F10-01-022", async ({ page, step, expected }) => {
    const l = new LoginPage(page);
    let d: 受け渡し領域 | undefined;
    note("スマートフォン版ブラウザは、iPhone の利用者エージェント・画面の大きさ・タッチの設定のブラウザで代えた");
    await step(1, async () => { await l.ログイン画面を開く(); });
    await step(2, async () => { await ログインする(l, "S-F10-01-MEM-022"); });
    await step(3, async () => { await オンライン本人確認を開く(page); });
    await step(4, async () => { await 身分証を選んで撮影画面へ(page, "自動車運転免許証"); });
    await step(5, async () => { d = await 表示する(page); });
    await expected(async () => {
      const id = 会員IDの値("S-F10-01-MEM-022");
      会員IDの注記("S-F10-01-MEM-022");
      expect.soft(new URL(page.url()).pathname, "撮影画面を開いている").toBe("/ja/mypage/identification/photograph");
      expect.soft(uidが値の要素(d!, id).length, `撮影画面で、項目名 uid が会員ID ${id} の要素の数（uid の値: ${uidの値の並び(d!)}）`).toBe(1);
    });
  });
});

// ---- ブロック管理（管理画面） ----
caseTest("IT-F10-01-026", async ({ page, step, expected }) => {
  const b = new ブロック管理(page);
  await step(1, async () => { await loginAdmin(page, F1001_ADMIN_026); });
  await step(2, async () => { await b.一覧を開く(); });
  await step(3, async () => {
    expect(await b.全行.count(), "ブロック管理(一覧)にブロックの行が読み込まれている").toBeGreaterThan(0);
    await b.検索する(連携ブロック名);
  });
  await step(4, async () => { await expect(名前の行(page, 連携ブロック名), `ブロック「${連携ブロック名}」の行`).toHaveCount(1, { timeout: 30_000 }); });
  await expected(async () => {
    const row = 名前の行(page, 連携ブロック名);
    expect(await row.count(), `ブロック「${連携ブロック名}」の行の数`).toBe(1);
    expect.soft(await 名前がラベルか(row), "ブロック名がラベル（編集画面へのリンクでない）で表示される").toBe(true);
    expect.soft(await 編集リンク(row).count(), "行の編集リンクの数").toBe(0);
    expect.soft(await 削除ボタン(row).count(), "行の削除ボタンの数").toBe(0);
  });
});

caseTest("IT-F10-01-027", async ({ page, step, expected }) => {
  const b = new ブロック管理(page);
  let 名前の一致 = -1;
  let 見えている行 = -1;
  await step(1, async () => { await loginAdmin(page, F1001_ADMIN_027); });
  await step(2, async () => { await b.一覧を開く(); });
  await step(3, async () => {
    expect(await b.全行.count(), "ブロック管理(一覧)にブロックの行が読み込まれている").toBeGreaterThan(0);
    await b.検索する(連携ブロック名);
  });
  await step(4, async () => {
    見えている行 = await b.見えている行.count();
    名前の一致 = await 名前の行(page, 連携ブロック名).count();
    note(`検索のあとに表示された行は ${見えている行} 件。そのうちブロック名が「${連携ブロック名}」の行は ${名前の一致} 件`);
  });
  await expected(async () => {
    expect.soft(名前の一致, `ブロック名「${連携ブロック名}」の行の数`).toBe(1);
  });
});
