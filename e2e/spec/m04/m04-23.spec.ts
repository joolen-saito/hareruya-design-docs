/**
 * M04-23 在庫分割結合CSV登録。正本: cases/M04-23_test_cases.tsv
 *
 * 記録: review/M04-23_progress_2026-10-21.md（001・002）、review/M04-23_progress_2026-11-11_dev.md（開発環境向けの見直し分）。
 * - 001・002: 一覧のボタンでモーダルが開く。
 * - 003・005・009・010・013〜015・017〜019・025・026・028〜030・033・036〜038・041・043・045・046・050・051・060・061・063・069・075〜081・085・086:
 *   所属のマスタを足さずに作れる（所属の名前を手順・期待結果が見ない）。商品コード・メンバーの名前などは実行の印つきで読む（seeds/m04-23.ts）。
 * - 実装しないもの: 004・006・083・084（所属のマスタ「在庫部」「承認部」「他店舗部」「M04-23 RD所属A」を足す前提。依頼者の判断待ち）、
 *   016・082（承認通知先の受信メールを確かめる。メール通知の受信は範囲外）、074（ユニサーチ試験環境）、064 ほか今回の範囲外のもの。
 * 正本の「登録」ボタンは、画面の表示が「CSVから登録」のボタン（モーダルの送信のボタンは1つだけ）。
 */
import { Page } from "@playwright/test";
import { expect, CaseBody, CaseCtx, caseTest } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import {
  在庫分割結合の明細, 在庫分割結合の最大ID, 商品コードが出てくる在庫分割結合の件数, 店舗の在庫分割結合, 店舗の在庫数,
} from "../../db/m04_23";
import { SplitJoinListPage } from "../../pages/admin/m04_13_split_join";
import { 管理画面からログアウトする } from "../../pages/admin/m11_02_member";
import {
  openSplitJoinList, pressSplitJoinCsvButton, SplitJoinCsvKind, splitJoinCsvModal, SplitJoinCsvModal, 一覧のパス, 店舗で検索する,
} from "../../pages/admin/m04_23_split_join_csv";
import {
  m0423Admin, ケースの用意, 一般三郎, 実際のコード, 承認一郎, 承認次郎, 試験管理者, 連携試験管理者,
} from "../../seeds/m04-23";
import { 試験店舗A } from "../../pages/admin/m04_23_setup";

/** 事前準備①のログインのあと、一覧を開いてボタンを押し、押したボタンのモーダルが表示されることを確かめる */
function opensModal(kind: SplitJoinCsvKind): CaseBody {
  return async ({ page, step, expected }) => {
    await loginAdmin(page, m0423Admin());
    await step(1, () => openSplitJoinList(page));
    const { modal, title } = splitJoinCsvModal(page, kind);
    await step(2, async () => {
      await expect(modal, "ボタンを押す前はモーダルが表示されていない").toBeHidden();
      await pressSplitJoinCsvButton(page, kind);
    });
    await expected(async () => {
      await expect(modal, `${kind}モーダルが表示される`).toBeVisible();
      await expect(title, `モーダルの見出しが「${kind}」`).toHaveText(kind);
    });
  };
}

caseTest("IT-M04-23-001", opensModal("在庫分割CSV登録"));
caseTest("IT-M04-23-002", opensModal("在庫結合CSV登録"));

// ---------------------------------------------------------------- 共通の操作

const 分割 = "在庫分割CSV登録" as const;
const 結合 = "在庫結合CSV登録" as const;
const c = 実際のコード;

/** 在庫分割結合検索/一覧を開き、モーダルを開く（正本の「…CSV登録モーダルを開く」） */
async function モーダルを開く(page: Page, kind: SplitJoinCsvKind): Promise<SplitJoinCsvModal> {
  await openSplitJoinList(page);
  const m = new SplitJoinCsvModal(page, kind);
  await m.開く();
  return m;
}

type 入力 = { 店名?: string; 在庫区分?: "EC-CUBE" | "スマレジ"; 承認者?: string[]; ファイル?: { 名前: string; 中身: string } };
/** モーダルに、店舗・在庫区分・承認通知先・ファイルの順に入れる（渡したものだけ） */
async function 入れる(m: SplitJoinCsvModal, v: 入力): Promise<void> {
  if (v.店名) await m.店舗を選ぶ(v.店名);
  if (v.在庫区分) await m.在庫区分を選ぶ(v.在庫区分);
  if (v.承認者) await m.メンバーを選ぶ(v.承認者);
  if (v.ファイル) await m.ファイルを指定する(v.ファイル.名前, v.ファイル.中身);
}

/** 「登録」を押した結果。メッセージは記録に出す */
async function 登録する(m: SplitJoinCsvModal, ctx: CaseCtx): Promise<{ path: string; メッセージ: string[] }> {
  const r = await m.登録を押す();
  ctx.notes.set("登録後の画面", `${r.path}（応答 ${r.状態}）${r.メッセージ.length ? "・メッセージ: " + r.メッセージ.join(" / ") : ""}`);
  return r;
}

/** ケース専用シードの用意（店舗・ファイル・承認者） */
const 用意 = (seedId: string) => ケースの用意(seedId);
const ファイル = (seedId: string) => ({ 名前: 用意(seedId).ファイル名, 中身: 用意(seedId).CSV });

/** 在庫分割結合検索/一覧の画面だけにあるボタン（期待結果「在庫分割結合検索/一覧画面が表示される」の確かめに使う） */
const 一覧のボタン = (page: Page) => page.getByRole("button", { name: "在庫分割CSV登録", exact: true });

// ---------------------------------------------------------------- 003・005（選択肢）

caseTest("IT-M04-23-003", async ({ page, step, expected }) => {
  await loginAdmin(page, 試験管理者.account);
  let 分割の区分: Record<string, boolean> = {};
  let 結合の区分: Record<string, boolean> = {};
  await step(1, async () => {
    const m = await モーダルを開く(page, 分割);
    分割の区分 = await m.在庫区分が選べる();
  });
  await step(2, () => new SplitJoinCsvModal(page, 分割).閉じる());
  await step(3, async () => {
    const m = new SplitJoinCsvModal(page, 結合);
    await m.開く();
    結合の区分 = await m.在庫区分が選べる();
  });
  await expected(async () => {
    expect(分割の区分, "在庫分割CSV登録モーダルの在庫区分（選べるか）").toEqual({ "EC-CUBE": true, スマレジ: true });
    expect(結合の区分, "在庫結合CSV登録モーダルの在庫区分（選べるか）").toEqual({ "EC-CUBE": true, スマレジ: true });
  });
});

caseTest("IT-M04-23-005", async ({ page, step, expected, notes }) => {
  await loginAdmin(page, 試験管理者.account);
  let m!: SplitJoinCsvModal;
  let 選択肢: string[] = [];
  await step(1, async () => { m = await モーダルを開く(page, 分割); });
  await step(2, () => m.店舗を選ぶ(試験店舗A.店名));
  await step(3, async () => {
    await m.メンバーの選択肢が出るまで待つ([承認一郎.名前, 承認次郎.名前]);
    選択肢 = await m.メンバーの選択肢();
    notes.set("承認通知先（メンバー選択）の選択肢", 選択肢.join("、"));
  });
  await expected(async () => {
    const 一郎 = 選択肢.indexOf(承認一郎.名前);
    const 次郎 = 選択肢.indexOf(承認次郎.名前);
    expect(一郎, `「${承認一郎.名前}」が表示される`).toBeGreaterThanOrEqual(0);
    expect(次郎, `「${承認次郎.名前}」が表示される`).toBeGreaterThanOrEqual(0);
    expect(一郎 < 次郎, "承認一郎・承認次郎が名前の昇順（承認一郎が先）").toBe(true);
    expect(選択肢.includes(一般三郎.名前), `承認権限の無い「${一般三郎.名前}」は表示されない`).toBe(false);
  });
});

// ---------------------------------------------------------------- 編集できない店舗・存在しない値（009・010・036〜038）

caseTest("IT-M04-23-009", async (ctx) => {
  const { page, step, expected } = ctx;
  const u = 用意("S-M04-23-CASE-009");
  await loginAdmin(page, 試験管理者.account);
  let m!: SplitJoinCsvModal;
  let 件数 = -1;
  await step(1, async () => { m = await モーダルを開く(page, 分割); });
  await step(2, () => m.店舗の値を書き換える(u.店舗ID));
  await step(3, async () => {
    await 入れる(m, { 在庫区分: "EC-CUBE", 承認者: [承認一郎.名前], ファイル: ファイル("S-M04-23-CASE-009") });
    await 登録する(m, ctx);
  });
  await step(4, async () => {
    件数 = 商品コードが出てくる在庫分割結合の件数(c("410001"), "在庫分割", u.店舗ID) + 商品コードが出てくる在庫分割結合の件数(c("410002"), "在庫分割", u.店舗ID);
  });
  await expected(async () => { expect(件数, `${u.店名}（店舗ID ${u.店舗ID}）の 410001・410002 に関する在庫分割データの件数`).toBe(0); });
});

caseTest("IT-M04-23-010", async (ctx) => {
  const { page, step, expected } = ctx;
  const u = 用意("S-M04-23-CASE-010");
  await loginAdmin(page, 試験管理者.account);
  let m!: SplitJoinCsvModal;
  let 件数 = -1;
  await step(1, async () => { m = await モーダルを開く(page, 結合); });
  await step(2, () => m.店舗の値を書き換える(u.店舗ID));
  await step(3, async () => {
    await 入れる(m, { 在庫区分: "EC-CUBE", ファイル: ファイル("S-M04-23-CASE-010") });
    await 登録する(m, ctx);
  });
  await step(4, async () => {
    件数 = 商品コードが出てくる在庫分割結合の件数(c("420001"), "在庫結合", u.店舗ID) + 商品コードが出てくる在庫分割結合の件数(c("420002"), "在庫結合", u.店舗ID);
  });
  await expected(async () => { expect(件数, `${u.店名}（店舗ID ${u.店舗ID}）の 420001・420002 に関する在庫結合データの件数`).toBe(0); });
});

/** 036・037: 店舗の値を未登録ID 999999 に書き換えて登録 → 一覧が表示される */
function 未登録の店舗(seedId: string, kind: SplitJoinCsvKind): CaseBody {
  return async (ctx) => {
    const { page, step, expected } = ctx;
    await loginAdmin(page, 試験管理者.account);
    let m!: SplitJoinCsvModal;
    let path = "";
    await step(1, async () => { m = await モーダルを開く(page, kind); });
    await step(2, () => m.店舗の値を書き換える("999999"));
    await step(3, async () => {
      await 入れる(m, { 在庫区分: "EC-CUBE", ...(kind === 分割 ? { 承認者: [承認一郎.名前] } : {}), ファイル: ファイル(seedId) });
      path = (await 登録する(m, ctx)).path;
    });
    await expected(async () => {
      expect(path, "在庫分割結合検索/一覧のパス").toBe(一覧のパス);
      await expect(一覧のボタン(page), "在庫分割結合検索/一覧の画面").toBeVisible();
    });
  };
}
caseTest("IT-M04-23-036", 未登録の店舗("S-M04-23-CASE-036", 分割));
caseTest("IT-M04-23-037", 未登録の店舗("S-M04-23-CASE-037", 結合));

caseTest("IT-M04-23-038", async (ctx) => {
  const { page, step, expected } = ctx;
  const u = 用意("S-M04-23-CASE-038");
  await loginAdmin(page, 試験管理者.account);
  let m!: SplitJoinCsvModal;
  let path = "";
  await step(1, async () => { m = await モーダルを開く(page, 分割); });
  await step(2, () => m.在庫区分の値を書き換える("9"));
  await step(3, async () => {
    await 入れる(m, { 店名: u.店名, 承認者: [承認一郎.名前], ファイル: ファイル("S-M04-23-CASE-038") });
    path = (await 登録する(m, ctx)).path;
  });
  await expected(async () => {
      expect(path, "在庫分割結合検索/一覧のパス").toBe(一覧のパス);
      await expect(一覧のボタン(page), "在庫分割結合検索/一覧の画面").toBeVisible();
    });
});

// ---------------------------------------------------------------- 正常な登録・業務の誤り（4手順。4番目は DB の確認）

type 標準 = {
  seedId: string; kind: SplitJoinCsvKind; 在庫区分?: "EC-CUBE" | "スマレジ";
  /** 承認通知先（正本の名前。ケース専用の承認者は用意した名前に読み替える。MASTER の承認一郎は "承認一郎"） */
  承認者?: string[];
  /** 手順4の DB の確認（登録の前の最大IDを渡す）。読んだ値と、正本の期待結果の値の組を返し、期待結果で確かめる */
  確かめる: (u: ReturnType<typeof 用意>, 前の最大ID: number) => 確かめ[];
};
/** 期待結果の確かめ1つ（何を・実際の値・正本の期待の値） */
type 確かめ = { 何: string; 実際: unknown; 期待: unknown };

function 承認者の名前(u: ReturnType<typeof 用意>, 正本: string[]): string[] {
  return 正本.map((n) => (n === "承認一郎" ? 承認一郎.名前 : u.承認者[n] ?? (() => { throw new Error(`承認者「${n}」をシードで用意していない`); })()));
}

/** 手順1 モーダルを開く／2 店舗・在庫区分・（承認通知先）・ファイル／3 登録／4 DB の確認 */
function 標準のケース(v: 標準): CaseBody {
  return async (ctx) => {
    const { page, step, expected } = ctx;
    const u = 用意(v.seedId);
    await loginAdmin(page, 試験管理者.account);
    let m!: SplitJoinCsvModal;
    let 前 = 0;
    let checks: 確かめ[] = [];
    await step(1, async () => { m = await モーダルを開く(page, v.kind); });
    await step(2, () => 入れる(m, {
      店名: u.店名, 在庫区分: v.在庫区分 ?? "EC-CUBE", ...(v.承認者 ? { 承認者: 承認者の名前(u, v.承認者) } : {}), ファイル: ファイル(v.seedId),
    }));
    await step(3, async () => { 前 = 在庫分割結合の最大ID(); await 登録する(m, ctx); });
    await step(4, async () => { checks = v.確かめる(u, 前); });
    await expected(async () => {
      expect(checks.length, "手順4で読んだ値がある").toBeGreaterThan(0);
      for (const ch of checks) expect(ch.実際, ch.何).toEqual(ch.期待);
    });
  };
}

/** 手順1〜3 のあと、一覧が表示されることを見るケース（015・019） */
function 一覧へ戻るケース(seedId: string, kind: SplitJoinCsvKind, 承認者?: string[]): CaseBody {
  return async (ctx) => {
    const { page, step, expected } = ctx;
    const u = 用意(seedId);
    await loginAdmin(page, 試験管理者.account);
    let m!: SplitJoinCsvModal;
    let path = "";
    await step(1, async () => { m = await モーダルを開く(page, kind); });
    await step(2, () => 入れる(m, { 店名: u.店名, 在庫区分: "EC-CUBE", ...(承認者 ? { 承認者: 承認者の名前(u, 承認者) } : {}), ファイル: ファイル(seedId) }));
    await step(3, async () => { path = (await 登録する(m, ctx)).path; });
    await expected(async () => {
      expect(path, "在庫分割結合検索/一覧のパス").toBe(一覧のパス);
      await expect(一覧のボタン(page), "在庫分割結合検索/一覧の画面").toBeVisible();
    });
  };
}

/** 店舗の、分割元・結合先が商品コードの在庫分割結合のうち、登録の前の最大IDより後のもの */
const 増えた = (code: string, u: ReturnType<typeof 用意>, kind: "在庫分割" | "在庫結合", 前: number) =>
  店舗の在庫分割結合(code, u.店舗ID, kind).filter((r) => Number(r.ID) > 前);
const 明細の要約 = (id: string) => 在庫分割結合の明細(id).map((d) => ({ 商品コード: d.商品コード, 在庫区分番号: d.在庫区分番号, 数量: d.数量 }));

/** 登録で1件増えたこと・そのステータス・明細（分割先・結合元）の商品コードと数量 */
function 増えた1件(u: ReturnType<typeof 用意>, 前: number, v: {
  元: string; kind: "在庫分割" | "在庫結合"; 何: string; ステータス?: string; 数?: number; 区分?: 1 | 2; 明細: [string, number][]; 明細の区分?: number[];
}): 確かめ[] {
  const rows = 増えた(v.元, u, v.kind, 前);
  const head = rows[0];
  const 明細 = rows.length === 1 ? 明細の要約(head.ID) : [];
  return [
    { 何: `${v.何}の${v.kind}データの件数（この登録で増えたもの）`, 実際: rows.length, 期待: 1 },
    ...(v.ステータス ? [{ 何: "ステータス", 実際: head?.ステータス, 期待: v.ステータス }] : []),
    ...(v.数 !== undefined ? [{ 何: v.kind === "在庫分割" ? "分割数" : "結合数", 実際: head?.分割結合数, 期待: v.数 }] : []),
    ...(v.区分 !== undefined ? [{ 何: "在庫分割結合データの在庫区分（1=EC-CUBE・2=スマレジ）", 実際: head?.在庫区分番号, 期待: v.区分 }] : []),
    { 何: v.kind === "在庫分割" ? "分割先の商品コードと分割先在庫数" : "結合元の商品コードと結合元在庫数", 実際: 明細.map((d) => [d.商品コード, d.数量]), 期待: v.明細 },
    ...(v.明細の区分 ? [{ 何: "結合元在庫区分", 実際: 明細.map((d) => d.在庫区分番号), 期待: v.明細の区分 }] : []),
  ];
}

caseTest("IT-M04-23-013", 標準のケース({
  seedId: "S-M04-23-CASE-013", kind: 分割, 承認者: ["承認一郎-013"],
  確かめる: (u, 前) => 増えた1件(u, 前, { 元: c("410001"), kind: "在庫分割", 何: "分割元410001", ステータス: "分割承認待ち", 明細: [[c("410002"), 10]] }),
}));
caseTest("IT-M04-23-014", 標準のケース({
  seedId: "S-M04-23-CASE-014", kind: 分割, 承認者: ["承認一郎-014"],
  確かめる: (u) => [{ 何: "分割元410001のEC-CUBE在庫数（登録の前は100）", 実際: 店舗の在庫数(c("410001"), u.店舗ID, 1), 期待: 90 }],
}));
caseTest("IT-M04-23-015", 一覧へ戻るケース("S-M04-23-CASE-015", 分割, ["承認一郎-015"]));
caseTest("IT-M04-23-017", 標準のケース({
  seedId: "S-M04-23-CASE-017", kind: 結合,
  確かめる: (u, 前) => 増えた1件(u, 前, { 元: c("420001"), kind: "在庫結合", 何: "結合先420001", ステータス: "結合元登録", 明細: [[c("420002"), 10]] }),
}));
caseTest("IT-M04-23-018", 標準のケース({
  seedId: "S-M04-23-CASE-018", kind: 結合,
  確かめる: (u) => [{ 何: "結合元420002のスマレジ在庫数（登録の前は100）", 実際: 店舗の在庫数(c("420002"), u.店舗ID, 2), 期待: 90 }],
}));
caseTest("IT-M04-23-019", 一覧へ戻るケース("S-M04-23-CASE-019", 結合));

/** 存在しない商品コード（印を付けない 999991〜999994）が出てくる在庫分割結合が、どの店舗にも無いこと */
const 無いコード = (code: string, kind: "在庫分割" | "在庫結合") => (): 確かめ[] =>
  [{ 何: `商品コード${code}を持つ${kind}データの件数`, 実際: 商品コードが出てくる在庫分割結合の件数(code, kind), 期待: 0 }];
caseTest("IT-M04-23-025", 標準のケース({ seedId: "S-M04-23-CASE-025", kind: 分割, 承認者: ["承認一郎"], 確かめる: 無いコード("999991", "在庫分割") }));
caseTest("IT-M04-23-026", 標準のケース({ seedId: "S-M04-23-CASE-026", kind: 分割, 承認者: ["承認一郎"], 確かめる: 無いコード("999992", "在庫分割") }));
caseTest("IT-M04-23-029", 標準のケース({ seedId: "S-M04-23-CASE-029", kind: 結合, 確かめる: 無いコード("999993", "在庫結合") }));
caseTest("IT-M04-23-030", 標準のケース({ seedId: "S-M04-23-CASE-030", kind: 結合, 確かめる: 無いコード("999994", "在庫結合") }));

caseTest("IT-M04-23-028", 標準のケース({
  seedId: "S-M04-23-CASE-028", kind: 分割, 承認者: ["承認一郎"],
  確かめる: (u) => [{ 何: "在庫数9に対して分割数10を指定した分割元410005の在庫分割データの件数", 実際: 商品コードが出てくる在庫分割結合の件数(c("410005"), "在庫分割", u.店舗ID), 期待: 0 }],
}));
caseTest("IT-M04-23-033", 標準のケース({
  seedId: "S-M04-23-CASE-033", kind: 結合,
  確かめる: (u) => [{ 何: "在庫数9に対して結合元在庫数10を指定した結合元420005の在庫結合データの件数", 実際: 商品コードが出てくる在庫分割結合の件数(c("420005"), "在庫結合", u.店舗ID), 期待: 0 }],
}));

const 長041 = { 元: `423041${"1".repeat(249)}`, 先: `423041${"2".repeat(249)}` };
const 長043 = { 先: `423043${"2".repeat(249)}`, 元: `423043${"4".repeat(249)}` };
caseTest("IT-M04-23-041", 標準のケース({
  seedId: "S-M04-23-CASE-041", kind: 分割, 承認者: ["承認一郎-041"],
  確かめる: (u, 前) => [
    { 何: "分割元・分割先の商品コードの文字数", 実際: [長041.元.length, 長041.先.length], 期待: [255, 255] },
    ...増えた1件(u, 前, { 元: 長041.元, kind: "在庫分割", 何: "255文字の分割元", 明細: [[長041.先, 1]] }),
  ],
}));
caseTest("IT-M04-23-043", 標準のケース({
  seedId: "S-M04-23-CASE-043", kind: 結合,
  確かめる: (u, 前) => [
    { 何: "結合先・結合元の商品コードの文字数", 実際: [長043.先.length, 長043.元.length], 期待: [255, 255] },
    ...増えた1件(u, 前, { 元: 長043.先, kind: "在庫結合", 何: "255文字の結合先", 明細: [[長043.元, 1]] }),
  ],
}));

caseTest("IT-M04-23-045", 標準のケース({
  seedId: "S-M04-23-CASE-045", kind: 分割, 承認者: ["承認一郎-045"],
  確かめる: (u, 前) => 増えた1件(u, 前, { 元: c("410001"), kind: "在庫分割", 何: "分割元410001", 数: 0, 明細: [[c("410002"), 0]] }),
}));
caseTest("IT-M04-23-046", 標準のケース({
  seedId: "S-M04-23-CASE-046", kind: 分割, 承認者: ["承認一郎-046"],
  確かめる: (u, 前) => 増えた1件(u, 前, { 元: c("410010"), kind: "在庫分割", 何: "分割元410010", 数: 999999999, 明細: [[c("410011"), 999999999]] }),
}));
caseTest("IT-M04-23-050", 標準のケース({
  seedId: "S-M04-23-CASE-050", kind: 結合,
  確かめる: (u, 前) => 増えた1件(u, 前, { 元: c("420001"), kind: "在庫結合", 何: "結合先420001", 数: 1, 明細: [[c("420002"), 1]] }),
}));
caseTest("IT-M04-23-051", 標準のケース({
  seedId: "S-M04-23-CASE-051", kind: 結合,
  確かめる: (u, 前) => 増えた1件(u, 前, { 元: c("420010"), kind: "在庫結合", 何: "結合先420010", 数: 999999999, 明細: [[c("420011"), 999999999]] }),
}));

// ---------------------------------------------------------------- 別のブラウザでログアウト（060・061）

function ログアウトのケース(seedId: string, kind: SplitJoinCsvKind): CaseBody {
  return async (ctx) => {
    const { page, browser, step, expected } = ctx;
    const u = 用意(seedId);
    const account = u.管理者!.account;
    await loginAdmin(page, account);
    let m!: SplitJoinCsvModal;
    let path = "";
    await step(1, async () => { m = await モーダルを開く(page, kind); });
    await step(2, () => 入れる(m, { 店名: u.店名, 在庫区分: "EC-CUBE", ...(kind === 分割 ? { 承認者: [承認一郎.名前] } : {}), ファイル: ファイル(seedId) }));
    await step(3, async () => {
      // ブラウザB（別のブラウザのセッション）で同じ管理者でログインし、管理画面からログアウトする
      const b = await browser.newContext({ locale: "ja-JP", ignoreHTTPSErrors: true });
      try {
        await hideDebugToolbar(b);
        const pb = await b.newPage();
        await loginAdmin(pb, account);
        await 管理画面からログアウトする(pb);
        await expect(pb, "ブラウザBはログイン画面へ移った").toHaveURL(/\/login/);
      } finally { await b.close(); }
    });
    await step(4, async () => { path = (await 登録する(m, ctx)).path; });
    await expected(async () => {
      expect(path, "在庫分割結合検索/一覧のパス").toBe(一覧のパス);
      await expect(一覧のボタン(page), "在庫分割結合検索/一覧の画面").toBeVisible();
    });
  };
}
caseTest("IT-M04-23-060", ログアウトのケース("S-M04-23-CASE-060", 分割));
caseTest("IT-M04-23-061", ログアウトのケース("S-M04-23-CASE-061", 結合));

// ---------------------------------------------------------------- 一覧の検索で確かめる（063）

caseTest("IT-M04-23-063", async (ctx) => {
  const { page, step, expected } = ctx;
  const u = 用意("S-M04-23-L-CASE-063");
  let m!: SplitJoinCsvModal;
  let path = "";
  let rows: Awaited<ReturnType<SplitJoinListPage["rows"]>> = [];
  await step(1, async () => { await loginAdmin(page, 連携試験管理者.account); await openSplitJoinList(page); });
  await step(2, async () => { m = new SplitJoinCsvModal(page, 分割); await m.開く(); });
  await step(3, async () => {
    await 入れる(m, { 店名: u.店名, 在庫区分: "EC-CUBE", 承認者: 承認者の名前(u, ["承認連携001"]), ファイル: ファイル("S-M04-23-L-CASE-063") });
    path = (await 登録する(m, ctx)).path;
  });
  await step(4, async () => {
    expect(path, "在庫分割結合検索/一覧へ戻った").toBe(一覧のパス);
    await 店舗で検索する(page, u.店名);
  });
  await step(5, async () => { rows = await new SplitJoinListPage(page).rows(); });
  await expected(async () => {
    const hit = rows.filter((r) => r.商品名.includes(rc("分割元連携カードA")));
    expect(hit.length, `検索結果に分割元商品名「${rc("分割元連携カードA")}」の行が1件`).toBe(1);
    expect({ タイプ: hit[0].種別, 店舗: hit[0].店舗, 在庫区分: hit[0].在庫区分, 分割数: hit[0].元点数, ステータス: hit[0].ステータス }, "検索結果の行")
      .toEqual({ タイプ: "在庫分割", 店舗: u.店名, 在庫区分: "EC-CUBE", 分割数: "10", ステータス: "分割承認待ち" });
  });
});

// ---------------------------------------------------------------- 複数行・在庫数の確かめ（069・075〜081・085・086）

caseTest("IT-M04-23-069", 標準のケース({
  seedId: "S-M04-23-GF-069", kind: 結合,
  確かめる: (u, 前) => 増えた1件(u, 前, { 元: c("M0423-069-A"), kind: "在庫結合", 何: "M0423-069-Aを結合先商品とする", 数: 10, 明細: [[c("M0423-069-B"), 10]], 明細の区分: [1] }),
}));
caseTest("IT-M04-23-075", 標準のケース({
  seedId: "S-M04-23-DPS-075", kind: 分割, 承認者: ["承認通知先M0423-075"],
  確かめる: (u, 前) => 増えた1件(u, 前, { 元: c("M0423-075-A"), kind: "在庫分割", 何: "M0423-075-Aを分割元とする", 明細: [[c("M0423-075-B"), 10], [c("M0423-075-C"), 10]] }),
}));
caseTest("IT-M04-23-077", 標準のケース({
  seedId: "S-M04-23-DPS-077", kind: 結合,
  確かめる: (u, 前) => 増えた1件(u, 前, { 元: c("M0423-077-A"), kind: "在庫結合", 何: "M0423-077-Aを結合先とする", 明細: [[c("M0423-077-B"), 10], [c("M0423-077-C"), 20]] }),
}));

/** 登録のあとの在庫数（店舗・在庫区分・商品コードごと） */
const 在庫数 = (want: { 正本: string; 区分: 1 | 2; 前: number; 後: number }[]) => (u: ReturnType<typeof 用意>): 確かめ[] =>
  want.map((w) => ({ 何: `${w.正本}の${w.区分 === 1 ? "EC-CUBE" : "スマレジ"}在庫数（登録の前は${w.前}）`, 実際: 店舗の在庫数(c(w.正本), u.店舗ID, w.区分), 期待: w.後 }));
caseTest("IT-M04-23-076", 標準のケース({
  seedId: "S-M04-23-DPS-076", kind: 結合,
  確かめる: 在庫数([{ 正本: "M0423-076-B", 区分: 2, 前: 100, 後: 90 }, { 正本: "M0423-076-C", 区分: 2, 前: 50, 後: 30 }]),
}));
caseTest("IT-M04-23-078", 標準のケース({
  seedId: "S-M04-23-DPS-078", kind: 分割, 承認者: ["承認通知先M0423-078"], 確かめる: 在庫数([{ 正本: "M0423-078-A", 区分: 1, 前: 10, 後: 0 }]),
}));
caseTest("IT-M04-23-079", 標準のケース({ seedId: "S-M04-23-DPS-079", kind: 結合, 確かめる: 在庫数([{ 正本: "M0423-079-B", 区分: 2, 前: 10, 後: 0 }]) }));
caseTest("IT-M04-23-080", 標準のケース({ seedId: "S-M04-23-DPS-080", kind: 結合, 確かめる: 在庫数([{ 正本: "M0423-080-B", 区分: 1, 前: 100, 後: 90 }]) }));
caseTest("IT-M04-23-081", 標準のケース({
  seedId: "S-M04-23-DPS-081", kind: 分割, 在庫区分: "スマレジ", 承認者: ["承認通知先M0423-081"],
  確かめる: 在庫数([{ 正本: "M0423-081-A", 区分: 2, 前: 100, 後: 90 }]),
}));

/** 085・086: 試験店舗A の在庫区分スマレジで結合し、結合先の在庫結合データと、結合元の EC-CUBE・スマレジ在庫数を見る */
const スマレジで結合 = (先: string, 元: string, 元の在庫: { EC: number; SM: number }) => (u: ReturnType<typeof 用意>, 前: number): 確かめ[] => [
  ...増えた1件(u, 前, { 元: c(先), kind: "在庫結合", 何: `${先}を結合先とする`, ステータス: "結合元登録", 区分: 2, 明細: [[c(元), 10]] }),
  { 何: `${元}の試験店舗A（M04-23）の EC-CUBE在庫数・スマレジ在庫数`, 実際: { EC: 店舗の在庫数(c(元), u.店舗ID, 1), SM: 店舗の在庫数(c(元), u.店舗ID, 2) }, 期待: 元の在庫 },
];
caseTest("IT-M04-23-085", 標準のケース({ seedId: "S-M04-23-CBJEC-085", kind: 結合, 在庫区分: "スマレジ", 確かめる: スマレジで結合("M0423-CB085-A", "M0423-CB085-B", { EC: 90, SM: 50 }) }));
caseTest("IT-M04-23-086", 標準のケース({ seedId: "S-M04-23-CBJSM-086", kind: 結合, 在庫区分: "スマレジ", 確かめる: スマレジで結合("M0423-CB086-A", "M0423-CB086-B", { EC: 50, SM: 90 }) }));
