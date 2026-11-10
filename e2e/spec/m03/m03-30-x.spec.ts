/**
 * M03-30 基準価格変更CSV登録の続き（-x）。正本: cases/M03-30_test_cases.tsv
 * 実施不可の見直し（仕分け直し recheck2）で流せる見込みになったケースのうち、スマレジを使わないもの（記録 review/M03-30_progress_2026-11-11_dev.md）。
 * シード（seeds/m03-30-x.ts）は画面で商品・商品規格を作り、画面で作れない状態（販売価格・価格履歴の0件・廃止）だけを E2E の行に DB で書き足す。
 * 取込ファイル名には実行の印を付けている（取込履歴をファイル名で数えるため）。
 * 正本の「商品価格CSV取込画面」「商品価格CSVアップロード画面」は、アプリの「セール用価格変更CSVアップロード」画面（訳の見出し「商品価格CSV画面」）と読む。
 */
import { Page, test } from "@playwright/test";
import { expect, CaseCtx, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import * as price from "../../db/m03_30_price";
import * as x from "../../db/m03_30_x";
import { PriceCsvUploadPage, priceCsvUploadPath, 画面上部のメッセージ, 画面の見出し } from "../../pages/admin/m03_30_price_csv";
import { PriceHistoryPage } from "../../pages/admin/m03_23_price_history";
import { searchStockByCode } from "../../pages/admin/m04_02_rc_stock";
import { トークンを書き換える, トークンを消す, 在庫の行の価格, 項目を足す } from "../../pages/admin/m03_30_x";
import { M0330_ADMIN } from "../../seeds/m03-30";
import { RB_ADMIN, RB_ADMIN_NAME, RBの, 作ったものの, 本店の店名 } from "../../seeds/m03-30-x";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

/** 取込ファイルを選んで「CSVファイルのアップロード」を押し、画面上部のメッセージを返す（送信が止まったら落とす） */
async function 取り込む(page: Page, upload: PriceCsvUploadPage, ファイル: string): Promise<{ 成功: string[]; エラー: string[]; 警告: string[] }> {
  await upload.choose(ファイル);
  const r = await upload.submit();
  expect(r.sent, "「CSVファイルをアップロード」で取込の要求が送られた（送られないと手順を実行できない）").toBe(true);
  const m = await 画面上部のメッセージ(page);
  note(`取込の要求の応答: ${r.sent ? r.status : "送られない"}・移った画面: ${new URL(page.url()).pathname}・成功「${m.成功.join("」「") || "なし"}」・エラー「${m.エラー.join("」「") || "なし"}」・警告「${m.警告.join("」「") || "なし"}」`);
  return m;
}
async function 開く(page: Page): Promise<PriceCsvUploadPage> {
  await loginAdmin(page, M0330_ADMIN);
  return new PriceCsvUploadPage(page, "基準価格変更");
}
const 値 = (規格ID: string) => {
  const v = price.商品規格(規格ID);
  if (!v) throw new Error(`商品規格ID ${規格ID} が無い`);
  return { 基準価格: v.基準価格, 販売価格: v.販売価格, 買取価格: v.買取価格 };
};
const 価格 = (基準価格: number, 販売価格: number, 買取価格: number) => ({ 基準価格: String(基準価格), 販売価格: String(販売価格), 買取価格: String(買取価格) });

// ---- 取り込んで、規格の価格を確かめる（多くのケース） ----
function 価格を見る(seedId: string, 期待: { 規格: number; 商品?: number; 価格: ReturnType<typeof 価格>; 説明: string }[]) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const s = 作ったものの(seedId);
    const upload = await 開く(page);
    const got: Record<string, ReturnType<typeof 価格>> = {};
    await step(1, async () => { await upload.open(); });
    await step(2, async () => { await upload.choose(s.ファイル); note(`取込ファイル: ${s.ファイル名}`); });
    await step(3, async () => { await 取り込む(page, upload, s.ファイル); });
    await step(4, async () => {
      for (const e of 期待) { const k = s.商品[e.商品 ?? 0].規格[e.規格]; got[k.商品規格ID] = 値(k.商品規格ID); }
      note(`取込のあとの規格の価格: ${JSON.stringify(got)}`);
    });
    await expected(async () => {
      for (const e of 期待) {
        const k = s.商品[e.商品 ?? 0].規格[e.規格];
        expect.soft(got[k.商品規格ID], `${e.説明}の基準価格・販売価格・買取価格`).toEqual(e.価格);
      }
    });
  };
}
const 更新 = (基: number, 販: number, 買: number, 説明 = "規格") => [{ 規格: 0, 価格: 価格(基, 販, 買), 説明 }];
const そのまま = 更新(1000, 900, 400, "規格（取込前のまま）");

caseTest("IT-M03-30-001", 価格を見る("S-M03-30-DATA-001", 更新(1200, 1200, 500, "セールフラグが無効の規格")));
caseTest("IT-M03-30-002", 価格を見る("S-M03-30-DATA-002", 更新(1200, 800, 500, "セールフラグが有効の規格（販売価格は800のまま）")));
caseTest("IT-M03-30-004", 価格を見る("S-M03-30-DATA-004", [
  { 規格: 0, 価格: 価格(1300, 1300, 600), 説明: "未削除・高額商品コードなしの規格A" },
  { 規格: 1, 価格: 価格(1300, 1300, 600), 説明: "未削除・高額商品コードなしの規格B" },
  { 規格: 2, 価格: 価格(1000, 900, 400), 説明: "削除済みの規格C（更新されない）" },
  { 規格: 3, 価格: 価格(1000, 900, 400), 説明: "高額商品コード設定済みの規格D（更新されない）" },
]));
caseTest("IT-M03-30-007", 価格を見る("S-M03-30-DATA-007", 更新(999999999, 999999999, 999999999)));
caseTest("IT-M03-30-009", 価格を見る("S-M03-30-DATA-009", 更新(0, 0, 0)));
caseTest("IT-M03-30-013", 価格を見る("S-M03-30-DATA-013", そのまま));
caseTest("IT-M03-30-015", 価格を見る("S-M03-30-DATA-015", そのまま));
caseTest("IT-M03-30-020", 価格を見る("S-M03-30-DATA-020", そのまま));
caseTest("IT-M03-30-023", 価格を見る("S-M03-30-DATA-023", 更新(1200, 1200, 500)));
caseTest("IT-M03-30-024", 価格を見る("S-M03-30-DATA-024", そのまま));
caseTest("IT-M03-30-026", 価格を見る("S-M03-30-DATA-026", 更新(1200, 1200, 500)));
caseTest("IT-M03-30-035", async (ctx) => {
  const { page, step, expected } = ctx;
  const s = 作ったものの("S-M03-30-DATA-035");
  const upload = await 開く(page);
  let got!: ReturnType<typeof 価格>;
  await step(1, async () => { await upload.open(); });
  await step(2, async () => { await upload.choose(s.ファイル); });
  await step(3, async () => {
    await 項目を足す(page, "unexpected_field", "1");
    note("開発者ツールの代わりに、画面の取込のフォームへ隠し項目 unexpected_field（値1）をスクリプトで足して送信した");
    const r = await upload.submit();
    note(`送信の結果: ${r.sent ? `応答 ${r.status}・移った画面 ${new URL(page.url()).pathname}` : "送られない"}`);
  });
  await step(4, async () => { got = 値(s.商品[0].規格[0].商品規格ID); });
  await expected(async () => { expect.soft(got, "規格の基準価格・販売価格・買取価格（取込前のまま）").toEqual(価格(1000, 900, 400)); });
});
caseTest("IT-M03-30-077", 価格を見る("S-M03-30-MULTI-077", [
  { 規格: 0, 商品: 0, 価格: 価格(1200, 1200, 500), 説明: "商品Aの規格" },
  { 規格: 0, 商品: 1, 価格: 価格(2200, 2200, 900), 説明: "商品Bの規格" },
]));
caseTest("IT-M03-30-079", 価格を見る("S-M03-30-MIX-079", [
  { 規格: 0, 商品: 0, 価格: 価格(1200, 1200, 500), 説明: "セールフラグが無効の商品Aの規格" },
  { 規格: 0, 商品: 1, 価格: 価格(1200, 800, 500), 説明: "セールフラグが有効の商品Bの規格（販売価格は800のまま）" },
]));
caseTest("IT-M03-30-087", 価格を見る("S-M03-30-EQUAL-087", 更新(1000, 1000, 1000)));
caseTest("IT-M03-30-090", 価格を見る("S-M03-30-DUP-090", 更新(1500, 1500, 700, "規格（2行目の値）")));

// ---- 価格と価格履歴（005・021） ----
caseTest("IT-M03-30-005", async ({ page, step, expected }) => {
  const s = 作ったものの("S-M03-30-DATA-005");
  const upload = await 開く(page);
  let got: ReturnType<typeof 価格>[] = []; let 履歴 = -1;
  await step(1, async () => { await upload.open(); });
  await step(2, async () => { await upload.choose(s.ファイル); });
  await step(3, async () => { await 取り込む(page, upload, s.ファイル); });
  await step(4, async () => { got = s.商品[0].規格.map((k) => 値(k.商品規格ID)); 履歴 = x.商品の価格履歴の件数(s.商品[0].商品ID); note(`規格の価格: ${JSON.stringify(got)}・価格履歴 ${履歴} 件`); });
  await expected(async () => {
    expect.soft(got[0], "削除済みの規格Aの価格（更新されない）").toEqual(価格(1000, 900, 400));
    expect.soft(got[1], "高額商品コード設定済みの規格Bの価格（更新されない）").toEqual(価格(1000, 900, 400));
    expect.soft(履歴, "商品の価格履歴の件数（追加されない）").toBe(0);
  });
});
caseTest("IT-M03-30-021", async ({ page, step, expected }) => {
  const s = 作ったものの("S-M03-30-DATA-021");
  const upload = await 開く(page);
  let a!: ReturnType<typeof 価格>; let b!: ReturnType<typeof 価格>; let ha = -1; let hb = -1; let hist = -1;
  await step(1, async () => { await upload.open(); });
  await step(2, async () => { await upload.choose(s.ファイル); });
  await step(3, async () => { await 取り込む(page, upload, s.ファイル); });
  await step(4, async () => {
    a = 値(s.商品[0].規格[0].商品規格ID); b = 値(s.商品[1].規格[0].商品規格ID);
    ha = x.商品の価格履歴の件数(s.商品[0].商品ID); hb = x.商品の価格履歴の件数(s.商品[1].商品ID); hist = x.取込履歴(s.ファイル名).length;
    note(`商品A ${JSON.stringify(a)}・商品B ${JSON.stringify(b)}・価格履歴 A ${ha} 件・B ${hb} 件・取込履歴（${s.ファイル名}）${hist} 件`);
  });
  await expected(async () => {
    expect.soft(a, "商品Aの価格（取込前のまま）").toEqual(価格(1000, 900, 400));
    expect.soft(b, "商品Bの価格（取込前のまま）").toEqual(価格(1000, 1000, 400));
    expect.soft(ha + hb, "商品A・Bの価格履歴の件数（追加されない）").toBe(0);
    expect.soft(hist, "取込ファイルの取込履歴の件数（追加されない）").toBe(0);
  });
});

// ---- 画面のメッセージ（003・022） ----
caseTest("IT-M03-30-003", async ({ page, step, expected }) => {
  const s = 作ったものの("S-M03-30-DATA-003");
  const upload = await 開く(page);
  const dialogs: string[] = [];
  page.on("dialog", (d) => { dialogs.push(d.message()); d.accept().catch(() => {}); });
  let m!: Awaited<ReturnType<typeof 取り込む>>;
  await step(1, async () => { await upload.open(); });
  await step(2, async () => { await upload.choose(s.ファイル); });
  await step(3, async () => { m = await 取り込む(page, upload, s.ファイル); if (dialogs.length) note(`ブラウザの警告ダイアログ: ${dialogs.join(" / ")}`); });
  await expected(async () => {
    const all = [...m.警告, ...m.エラー, ...dialogs];
    expect.soft(all.filter((t) => /セール/.test(t) && /販売価格/.test(t)).length, "セール中商品の販売価格を変更できない旨のアラートの数").toBeGreaterThan(0);
  });
});
caseTest("IT-M03-30-022", async ({ page, step, expected }) => {
  const s = 作ったものの("S-M03-30-DATA-022");
  const upload = await 開く(page);
  let m!: Awaited<ReturnType<typeof 取り込む>>;
  await step(1, async () => { await upload.open(); });
  await step(2, async () => { await upload.choose(s.ファイル); });
  await step(3, async () => { m = await 取り込む(page, upload, s.ファイル); });
  await step(4, async () => { note(`表示されたエラー: ${m.エラー.join(" / ") || "なし"}`); });
  await expected(async () => {
    expect.soft(m.エラー.filter((t) => /商品/.test(t) && !/買取価格/.test(t)).length, "1行目の商品不存在に対応するエラーの数").toBeGreaterThan(0);
    expect.soft(m.エラー.filter((t) => /買取価格/.test(t)).length, "2行目の買取価格に対応するエラーの数（表示されない）").toBe(0);
  });
});

// ---- 価格履歴（027・028・029・086・089） ----
function 履歴を見る(seedId: string, 期待: Partial<x.価格履歴> | null) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const s = 作ったものの(seedId);
    const k = s.商品[0].規格[0];
    const upload = await 開く(page);
    let rows: x.価格履歴[] = [];
    await step(1, async () => { await upload.open(); });
    await step(2, async () => { await upload.choose(s.ファイル); });
    await step(3, async () => { await 取り込む(page, upload, s.ファイル); });
    await step(4, async () => { rows = x.価格履歴の行(k.商品規格ID); note(`取込のあとの価格履歴: ${JSON.stringify(rows)}`); });
    await expected(async () => {
      if (期待 === null) { expect.soft(rows.length, "規格の価格履歴の件数（追加されない）").toBe(0); return; }
      expect.soft(rows.length, "規格の価格履歴の件数（1件追加）").toBe(1);
      const r = rows[rows.length - 1] ?? ({} as x.価格履歴);
      const 担当者 = x.メンバーID(M0330_ADMIN.loginId);
      const want = { ...期待, 登録者ID: 担当者 };
      const gotPick = Object.fromEntries(Object.keys(want).map((key) => [key, (r as Record<string, string>)[key]]));
      expect.soft(gotPick, "価格履歴の値と操作した担当者").toEqual(want);
    });
  };
}
caseTest("IT-M03-30-027", 履歴を見る("S-M03-30-DATA-027", { 変更前買取価格: "400", 買取価格: "500", 基準価格: "1000" }));
caseTest("IT-M03-30-028", 履歴を見る("S-M03-30-DATA-028", { 変更前販売価格: "900", 販売価格: "1000", 基準価格: "1000" }));
caseTest("IT-M03-30-029", 履歴を見る("S-M03-30-DATA-029", null));
caseTest("IT-M03-30-086", 履歴を見る("S-M03-30-BOTH-086", { 変更前販売価格: "900", 販売価格: "1300", 変更前買取価格: "400", 買取価格: "600", 基準価格: "1300" }));
caseTest("IT-M03-30-089", async ({ page, step, expected }) => {
  const s = 作ったものの("S-M03-30-AGAIN-089");
  const upload = await 開く(page);
  let n1 = -1; let n2 = -1;
  await step(1, async () => { await upload.open(); });
  await step(2, async () => { await upload.choose(s.ファイル); });
  await step(3, async () => { await 取り込む(page, upload, s.ファイル); });
  await step(4, async () => { n1 = x.商品の価格履歴の件数(s.商品[0].商品ID); note(`1回目の取込のあとの価格履歴 ${n1} 件`); });
  await step(5, async () => { await upload.open(); await 取り込む(page, upload, s.ファイル); });
  await step(6, async () => { n2 = x.商品の価格履歴の件数(s.商品[0].商品ID); note(`2回目の取込のあとの価格履歴 ${n2} 件`); });
  await expected(async () => {
    expect.soft(n1, "1回目の取込のあとの価格履歴の件数").toBe(1);
    expect.soft(n2, "2回目の取込のあとの価格履歴の件数（増えない）").toBe(1);
  });
});

// ---- 取込履歴（006・030・078・088） ----
function 取込履歴を見る(seedId: string, 回数: 1 | 2, 件数: number) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const s = 作ったものの(seedId);
    const upload = await 開く(page);
    let rows: { 登録者ID: string }[] = [];
    let n = 1;
    await step(n++, async () => { await upload.open(); });
    await step(n++, async () => { await upload.choose(s.ファイル); note(`取込ファイル: ${s.ファイル名}`); });
    await step(n++, async () => { await 取り込む(page, upload, s.ファイル); });
    if (回数 === 2) await step(n++, async () => { await upload.open(); await 取り込む(page, upload, s.ファイル); });
    await step(n++, async () => { rows = x.取込履歴(s.ファイル名); note(`取込履歴（${s.ファイル名}）: ${JSON.stringify(rows)}`); });
    await expected(async () => {
      const 担当者 = x.メンバーID(M0330_ADMIN.loginId);
      expect.soft(rows.length, `取込ファイルの取込履歴の件数（${件数}件）`).toBe(件数);
      expect.soft(rows.every((r) => r.登録者ID === 担当者) && rows.length > 0, "取込履歴の担当者が操作した担当者").toBe(true);
    });
  };
}
caseTest("IT-M03-30-006", 取込履歴を見る("S-M03-30-DATA-006", 1, 1));
caseTest("IT-M03-30-030", 取込履歴を見る("S-M03-30-DATA-030", 1, 1));
caseTest("IT-M03-30-078", 取込履歴を見る("S-M03-30-MULTIH-078", 1, 1));
caseTest("IT-M03-30-088", 取込履歴を見る("S-M03-30-AGAIN-088", 2, 2));

// ---- 送信のあとの画面（031・033・034・036） ----
const セール用の画面 = priceCsvUploadPath("セール用価格変更");
function 遷移を見る(seedId: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const s = 作ったものの(seedId);
    const upload = await 開く(page);
    supplement("正本の「商品価格CSV取込画面」「セール用価格変更CSVアップロード画面」は、アプリのセール用価格変更CSVアップロード画面（訳の見出し「商品価格CSV画面」）と読んだ");
    await step(1, async () => { await upload.open(); });
    await step(2, async () => { await upload.choose(s.ファイル); });
    await step(3, async () => { await 取り込む(page, upload, s.ファイル); });
    await expected(async () => {
      expect.soft(new URL(page.url()).pathname, "送信のあとの画面（セール用価格変更CSVアップロード画面）").toBe(セール用の画面);
      await expect.soft(upload.見出し, "送信のあとの画面の見出し").toHaveText(new RegExp(`^\\s*${画面の見出し("セール用価格変更")}\\s*$`));
    });
  };
}
caseTest("IT-M03-30-031", 遷移を見る("S-M03-30-DATA-031"));
caseTest("IT-M03-30-033", 遷移を見る("S-M03-30-DATA-033"));

caseTest("IT-M03-30-034", async ({ page, step, expected }) => {
  const s = 作ったものの("S-M03-30-DATA-034");
  const upload = await 開く(page);
  let got!: ReturnType<typeof 価格>;
  await step(1, async () => { await upload.open(); });
  await step(2, async () => { await upload.choose(s.ファイル); });
  await step(3, async () => {
    const n = await トークンを消す(page);
    note(`開発者ツールの代わりに、画面の取込のフォームからなりすまし対策トークンをスクリプトで消した（${n} 個）`);
    const r = await upload.submit();
    note(`1回目の送信: ${r.sent ? `応答 ${r.status}・移った画面 ${new URL(page.url()).pathname}` : "送られない"}`);
  });
  await step(4, async () => {
    await upload.open(); await upload.choose(s.ファイル);
    const n = await トークンを書き換える(page, "invalid-token");
    note(`同じ初期状態から、なりすまし対策トークンを「invalid-token」に書き換えた（${n} 個）`);
    const r = await upload.submit();
    note(`2回目の送信: ${r.sent ? `応答 ${r.status}・移った画面 ${new URL(page.url()).pathname}` : "送られない"}`);
  });
  await step(5, async () => { got = 値(s.商品[0].規格[0].商品規格ID); });
  await expected(async () => { expect.soft(got, "2回の送信のあとの規格の基準価格・販売価格・買取価格（取込前のまま）").toEqual(価格(1000, 900, 400)); });
});

caseTest("IT-M03-30-036", async ({ page, step, expected }) => {
  const s = 作ったものの("S-M03-30-DATA-036");
  const upload = await 開く(page);
  supplement("正本の「商品価格CSVアップロード画面」は、アプリのセール用価格変更CSVアップロード画面（訳の見出し「商品価格CSV画面」）と読んだ");
  const 行き先: string[] = [];
  await step(1, async () => { await upload.open(); });
  await step(2, async () => { await upload.choose(s.ファイル); });
  await step(3, async () => {
    await トークンを消す(page);
    const r = await upload.submit();
    行き先.push(new URL(page.url()).pathname);
    note(`なりすまし対策トークンを消して送信: ${r.sent ? `応答 ${r.status}` : "送られない"}・移った画面 ${行き先[0]}`);
  });
  await step(4, async () => {
    await upload.open(); await upload.choose(s.ファイル);
    await 項目を足す(page, "unexpected_field", "1");
    const r = await upload.submit();
    行き先.push(new URL(page.url()).pathname);
    note(`未対応の項目 unexpected_field（値1）を足して送信: ${r.sent ? `応答 ${r.status}` : "送られない"}・移った画面 ${行き先[1]}`);
  });
  await expected(async () => {
    expect.soft(行き先[0], "1回目の送信のあとの画面（商品価格CSVアップロード画面）").toBe(セール用の画面);
    expect.soft(行き先[1], "2回目の送信のあとの画面（商品価格CSVアップロード画面）").toBe(セール用の画面);
  });
});

// ---- 価格履歴の検索・在庫検索で見る（092・093） ----
caseTest("IT-M03-30-092", async ({ page, step, expected }) => {
  const s = RBの("S-M03-30-RB-DATA-092");
  await loginAdmin(page, RB_ADMIN);
  const hist = new PriceHistoryPage(page);
  const upload = new PriceCsvUploadPage(page, "基準価格変更");
  let 前 = -1; let rows: Awaited<ReturnType<PriceHistoryPage["rowValues"]>> = [];
  await step(1, async () => { await hist.open(); await hist.searchWord(s.商品コード); 前 = (await hist.rowValues()).length; note(`検索の前の行の数: ${前}`); });
  await step(2, async () => { await upload.open(); });
  await step(3, async () => { await upload.choose(s.ファイル); const r = await upload.submit(); expect(r.sent, "取込の要求が送られた").toBe(true); });
  await step(4, async () => {
    const m = await 画面上部のメッセージ(page);
    note(`画面上部のメッセージ: 成功「${m.成功.join("」「") || "なし"}」・エラー「${m.エラー.join("」「") || "なし"}」`);
    expect.soft(m.成功.some((t) => t.includes("登録が完了しました")), "「登録が完了しました。」が表示される").toBe(true);
  });
  await step(5, async () => { await hist.open(); await hist.searchWord(s.商品コード); rows = await hist.rowValues(); note(`検索のあとの行: ${JSON.stringify(rows)}`); });
  await expected(async () => {
    expect.soft(rows.length, "行の数（手順1で控えた数より1件多い）").toBe(前 + 1);
    const hit = rows.filter((r) => r.商品コード === s.商品コード && r.変更後基準価格.replace(/[,円\s]/g, "") === "1200");
    expect.soft(hit.length, "商品コードの、変更後基準価格1200の行").toBe(1);
    const r = hit[0];
    const n = (v: string | undefined) => (v ?? "").replace(/[,円\s]/g, "");
    expect.soft(r ? [n(r.変更前基準価格), n(r.変更後基準価格), n(r.変更前販売価格), n(r.変更後販売価格), n(r.変更前買取価格), n(r.変更後買取価格)] : [],
      "変更前・変更後の基準価格・販売価格・買取価格").toEqual(["1000", "1200", "1000", "1200", "400", "500"]);
    expect.soft(r?.登録者 ?? "", "登録者").toBe(RB_ADMIN_NAME);
  });
});

caseTest("IT-M03-30-093", async ({ page, step, expected }) => {
  const s = RBの("S-M03-30-RB-DATA-093");
  supplement(`正本の店舗「東京本店」は、開発環境の本店（店舗ID 1「${本店の店名()}」）と読んだ`);
  await loginAdmin(page, RB_ADMIN);
  const upload = new PriceCsvUploadPage(page, "基準価格変更");
  let 前!: Awaited<ReturnType<typeof 在庫の行の価格>>; let 後!: Awaited<ReturnType<typeof 在庫の行の価格>>;
  const 行を読む = async () => {
    const list = await searchStockByCode(page, { 商品コード: s.商品コード, 店舗: 本店の店名(), 在庫区分: "EC-CUBE" });
    const row = list.row(s.商品コード, 本店の店名(), "EC-CUBE");
    await expect(row, "在庫検索一覧の対象の行は1件").toHaveCount(1);
    return 在庫の行の価格(row);
  };
  await step(1, async () => { 前 = await 行を読む(); note(`取込の前の行の価格: ${JSON.stringify(前)}`); });
  await step(2, async () => { await upload.open(); });
  await step(3, async () => { await upload.choose(s.ファイル); const r = await upload.submit(); expect(r.sent, "取込の要求が送られた").toBe(true); });
  await step(4, async () => {
    const m = await 画面上部のメッセージ(page);
    note(`画面上部のメッセージ: 成功「${m.成功.join("」「") || "なし"}」・エラー「${m.エラー.join("」「") || "なし"}」`);
    expect.soft(m.成功.some((t) => t.includes("登録が完了しました")), "「登録が完了しました。」が表示される").toBe(true);
  });
  await step(5, async () => { 後 = await 行を読む(); note(`取込のあとの行の価格: ${JSON.stringify(後)}`); });
  await expected(async () => {
    expect.soft(前, "手順1の表示（基準価格1000・販売価格1000・買取価格400）").toEqual(価格(1000, 1000, 400));
    expect.soft(後, "取込のあとの表示（基準価格1200・販売価格1200・買取価格500）").toEqual(価格(1200, 1200, 500));
  });
});
