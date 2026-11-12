/**
 * M07-03 買取情報編集（管理画面）の、振込完了メールを確かめるケース（046・047・155〜157）。正本: cases/M07-03_test_cases.tsv
 *
 * 受信箱は、開発環境のメールの受け口（E2E_MAIL_URL）で読む。買取依頼者のメールアドレスは実行の印つきで、そのアドレスに届いたメールだけを数える
 * （ほかの人のメールを拾わない）。シードの作り方は seeds/m07-03-d.ts。管理画面の操作は試験管理者 m0703_admin で行う（事前準備②）。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { M0703EditPage, 一覧から編集を開く } from "../../pages/admin/m07_03_edit";
import { mailIds, 宛先に届いたメール, 待ってから数える } from "../../pages/mail_inbox";
import { M0703B_ADMIN, 買取の会員 } from "../../seeds/m07-03-b";
import "../../seeds/m07-03-d";
import { 買取の値を読む } from "../../db/m07_03";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

const メールの注記 = (宛先: string) =>
  `買取依頼者のメールアドレスは正本の値に実行の印を付けた値（${宛先}）。受信箱は、保存の前に控えたメールの番号より後に、このアドレスへ届いたメールだけを数えた（宛先のメールを0件にする代わり）`;

/** 事前準備のログインと、手順1（買取情報編集画面を開く）。シードIDの会員のメールアドレスを返す */
async function 始める(ctx: CaseCtx, 呼び名: string, シードID: string): Promise<{ 番号: string; 宛先: string; e: M0703EditPage }> {
  await loginAdmin(ctx.page, M0703B_ADMIN);
  const 番号 = ctx.notes.get(呼び名);
  const 宛先 = 買取の会員.get(シードID)?.メール;
  if (!宛先) throw new Error(`${シードID} の買取依頼者がシードで作られていない`);
  let e!: M0703EditPage;
  await ctx.step(1, async () => { e = await 一覧から編集を開く(ctx.page, 番号); });
  return { 番号, 宛先, e };
}

/** 手順2〜3: 買取状況を「振込完了」にして保存する */
async function 振込完了で保存する(ctx: CaseCtx, e: M0703EditPage, 手順: [number, number]): Promise<void> {
  await ctx.step(手順[0], async () => { await e.買取状況を選ぶ("振込完了"); });
  await ctx.step(手順[1], async () => {
    const r = await e.保存を押す();
    note(`保存の結果: 成功「${r.成功.join(" / ")}」 エラー「${r.エラー.join(" / ")}」`);
  });
}

caseTest("IT-M07-03-046", async (ctx) => {
  const { 宛先, e } = await 始める(ctx, "〔買取番号-M0703-046〕", "S-M07-03-CASE-046");
  const 控え = await mailIds();
  await 振込完了で保存する(ctx, e, [2, 3]);
  let 届いた: Awaited<ReturnType<typeof 待ってから数える>> = [];
  await ctx.step(4, async () => {
    // 届くまで待ち、続けて届くものがないか少し待ってから数える
    const t0 = Date.now();
    while (Date.now() - t0 < 90_000 && (await 宛先に届いたメール(宛先, 控え)).length === 0) await new Promise((r) => setTimeout(r, 1000));
    届いた = await 待ってから数える(宛先, 控え, 5_000);
  });
  await ctx.expected(async () => {
    expect(届いた.length, `買取依頼者 ${宛先} 宛ての振込完了メールの件数`).toBe(1);
  });
  note(メールの注記(宛先));
  if (届いた[0]) note(`届いたメールの件名: 「${届いた[0].件名}」`);
});

caseTest("IT-M07-03-047", async (ctx) => {
  const { 番号, 宛先, e } = await 始める(ctx, "〔買取番号-M0703-047〕", "S-M07-03-CASE-047");
  const 控え = await mailIds();
  // 手順2は「買取状況を振込完了にして保存を押す」を1つにまとめた手順
  await ctx.step(2, async () => {
    await e.買取状況を選ぶ("振込完了");
    const r = await e.保存を押す();
    note(`保存の結果: 成功「${r.成功.join(" / ")}」 エラー「${r.エラー.join(" / ")}」`);
  });
  let 追加: Awaited<ReturnType<typeof 待ってから数える>> = [];
  let 全部 = 0;
  await ctx.step(3, async () => {
    追加 = await 待ってから数える(宛先, 控え, 20_000);
    全部 = (await 宛先に届いたメール(宛先, new Set())).length;
  });
  await ctx.expected(async () => {
    expect.soft(追加.length, `保存のあとに追加で届いた、${宛先} 宛ての振込完了メールの件数`).toBe(0);
    expect.soft(全部, `${宛先} 宛てのメールの合計（過去の振込完了履歴に対応する1件のみ）`).toBe(1);
  });
  note(`${メールの注記(宛先)}。買取番号 ${番号}。追加で送信されないことは、保存のあと20秒待ってから数えて確かめた`);
});

/** 155〜157 の手順1〜5（買取状況を「振込完了」にして保存 → 受信箱を確認 → 買取状況を確認）。期待結果は各ケースで確かめる */
async function 個別入力つき(ctx: CaseCtx, n: string): Promise<{ 宛先: string; 全部: number; 状況: string }> {
  const { 番号, 宛先, e } = await 始める(ctx, `〔買取番号-M0703-${n}〕`, `S-M07-03-CBMAIL-${n}`);
  const 控え = await mailIds();
  await 振込完了で保存する(ctx, e, [2, 3]);
  let 全部 = 0;
  await ctx.step(4, async () => {
    // 1件目が届くのを待つ（156・157 は事前準備の1件が受け口にあるので、保存の後に増えないことを15秒待って確かめる）
    const t0 = Date.now();
    while (n === "155" && Date.now() - t0 < 90_000 && (await 宛先に届いたメール(宛先, 控え)).length === 0) await new Promise((r) => setTimeout(r, 1000));
    await new Promise((r) => setTimeout(r, 15_000));
    全部 = (await 宛先に届いたメール(宛先, new Set())).length;
  });
  let 状況 = "";
  await ctx.step(5, async () => { 状況 = 買取の値を読む(番号).買取状況; });
  note(`${メールの注記(宛先)}。買取番号 ${番号}。買取状況は、保存した買取の買取状況の値を読んで確かめた（手順5の「同じ買取情報編集画面で確認する」の代わり）`);
  return { 宛先, 全部, 状況 };
}

caseTest("IT-M07-03-155", async (ctx) => {
  const r = await 個別入力つき(ctx, "155");
  await ctx.expected(async () => {
    expect.soft(r.全部, `${r.宛先} 宛ての振込完了メールの合計（1件届く）`).toBe(1);
    expect.soft(r.状況, "買取状況").toBe("未登録在庫あり");
  });
});
caseTest("IT-M07-03-156", async (ctx) => {
  const r = await 個別入力つき(ctx, "156");
  await ctx.expected(async () => {
    expect.soft(r.全部, `${r.宛先} 宛ての振込完了メールの合計（事前準備の1件のまま増えない）`).toBe(1);
    expect.soft(r.状況, "買取状況").toBe("入庫待ち");
  });
});
caseTest("IT-M07-03-157", async (ctx) => {
  const r = await 個別入力つき(ctx, "157");
  await ctx.expected(async () => {
    expect.soft(r.全部, `${r.宛先} 宛ての振込完了メールの合計（事前準備の1件のまま増えない）`).toBe(1);
    expect.soft(r.状況, "買取状況").toBe("未登録在庫あり");
  });
});
