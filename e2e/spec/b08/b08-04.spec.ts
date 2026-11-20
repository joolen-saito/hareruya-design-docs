/**
 * B08-04 必須項目が空欄の会員発生通知バッチ。正本: cases/B08-04_test_cases.tsv
 * 実装したケースと解釈は記録 review/B08-04_progress_2026-11-20_dev.md。
 *
 * - 2回に分けて流す（依頼者決定 2026-11-20）。1回目（準備の回）は会員を作って控え、手順1で止める（未判定・バッチ未実行）。
 *   開発環境のバッチの環境が毎日1回流したあと、2回目（確かめの回）に流す。シードは控えたものを使い回す（seeds/b08-04.ts）。
 * - 手順1「バッチを起動し、終了するまで待つ」は、自動の実行を待つことに読み替える（正本の外の補い）。準備のあとに届いた通知のメールで確かめる。
 * - 手順2「メール試験サーバーの it_common@… の受信メール一覧」は、開発環境のメールの受け口で、いまの通知先あてに準備のあとに届いた最初の1通を開く。
 *   通知先（全員が使う設定）は書き換えない。受信履歴は消さないので、「1通」は、準備のあとの最初の回に届いた通数で見る。
 * - 006（対象0件でメール0通）・019（共有の送信元の書き換え）は、開発環境では成り立たないので書いていない（ほかの方の空欄の会員が常にいる・全員が使う設定）。
 * - 会員のメールアドレスは実行の印つき（正本の b0804-0NN-0N@example.test の代わり）。
 */
import { test } from "@playwright/test";
import { 会員の住所3と姓 } from "../../db/b08_04";
import { CaseBody, caseTest, CaseCtx, expect } from "../../lib/case";
import { 届いたメール, 本文 } from "../../pages/admin/b08_04_mail";
import { 通知を確かめる } from "../../seeds/b08-04";
import "../../seeds/b08-04";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

type 通知 = Awaited<ReturnType<typeof 通知を確かめる>>;

/** 手順1: 自動の実行を待ったことを確かめる */
async function 待つ手順(ctx: CaseCtx, seedId: string): Promise<通知> {
  let r: 通知 | null = null;
  await ctx.step(1, async () => {
    supplement("必須項目が空欄の会員発生通知バッチは E2E から起動する入口が無い。開発環境のバッチの環境が毎日1回自動で流すのを待つ形に読み替えた（依頼者決定 2026-11-20）");
    r = await 通知を確かめる(seedId);
    note(`${r.準備.作った日時} に準備したあと、最初に届いた通知のメール: 番号 ${r.最初.番号}・届いた時刻 ${r.最初.届いた時刻}（宛先 ${r.宛先}）。同じ回に届いた通数 ${r.同じ回の通数}`);
  });
  return r!;
}

/** 手順2: メールの受け口で通知のメールを開き、本文を読む */
async function 本文を読む(ctx: CaseCtx, r: 通知): Promise<string> {
  let t = "";
  await ctx.step(2, async () => {
    supplement("メール試験サーバーの代わりに、開発環境のメールの受け口で、いまの通知先あてに準備のあとに届いた最初の1通を開いた（通知先は全員が使う設定なので書き換えない）");
    t = await 本文(r.最初.番号);
    note(`本文の行数 ${t.split(/\r?\n/).length}（ほかの方の空欄の会員の行も含む）`);
  });
  return t;
}

const 行 = (t: string) => t.split(/\r?\n/).map((x) => x.trim());
/** 会員IDの行の次の行（抜粋行）。会員IDが本文に無ければ null */
const 抜粋行 = (t: string, 会員ID: string): string | null => { const l = 行(t); const i = l.indexOf(会員ID); return i < 0 ? null : (l[i + 1] ?? ""); };

/** 003・007: 通知のメールが1通届き、（003 は）本文に会員IDがある */
function 一通のケース(seedId: string, 呼び名: string | null): CaseBody {
  return async (ctx) => {
    const r = await 待つ手順(ctx, seedId);
    const t = await 本文を読む(ctx, r);
    await ctx.expected(async () => {
      expect(r.同じ回の通数, "準備のあとの最初の回に届いた通知のメールの通数").toBe(1);
      if (呼び名) expect(行(t), `本文に ${呼び名} の会員ID`).toContain(ctx.notes.get(呼び名));
    });
  };
}
caseTest("IT-B08-04-003", 一通のケース("S-B08-04-POSTAL-003", "〔会員ID-B0804-003〕"));
caseTest("IT-B08-04-007", 一通のケース("S-B08-04-DEST-007", null));

/** 004・005: 本文に片方の会員IDがあり、もう片方は無い */
function 片方のケース(seedId: string, ある: string, ない: string): CaseBody {
  return async (ctx) => {
    const r = await 待つ手順(ctx, seedId);
    const t = await 本文を読む(ctx, r);
    await ctx.expected(async () => {
      expect(行(t), `本文に ${ある} の会員ID`).toContain(ctx.notes.get(ある));
      expect(行(t), `本文に ${ない} の会員IDは無い`).not.toContain(ctx.notes.get(ない));
    });
  };
}
caseTest("IT-B08-04-004", 片方のケース("S-B08-04-FULL-004", "〔会員ID-B0804-004B〕", "〔会員ID-B0804-004A〕"));
caseTest("IT-B08-04-005", 片方のケース("S-B08-04-WITHDRAW-005", "〔会員ID-B0804-005A〕", "〔会員ID-B0804-005B〕"));

caseTest("IT-B08-04-008", async (ctx) => {
  const r = await 待つ手順(ctx, "S-B08-04-SUBJECT-008");
  let 件名 = "";
  await ctx.step(2, async () => {
    supplement("メール試験サーバーの代わりに、開発環境のメールの受け口で、いまの通知先あてに準備のあとに届いた最初の1通を開いた（件名では絞らずに選ぶ）");
    const m = (await 届いたメール(new Date(r.準備.作った日時), r.宛先))[0];
    件名 = m?.件名 ?? "";
    note(`開いたメール: 番号 ${m?.番号}・届いた時刻 ${m?.届いた時刻}・件名「${件名}」`);
  });
  await ctx.expected(async () => { expect(件名, "受信したメールの件名").toBe("必須項目が空欄である会員の存在を通知するメール"); });
});

caseTest("IT-B08-04-009", async (ctx) => {
  const r = await 待つ手順(ctx, "S-B08-04-LINE-009");
  const t = await 本文を読む(ctx, r);
  await ctx.expected(async () => {
    const id = ctx.notes.get("〔会員ID-B0804-009〕");
    const x = 抜粋行(t, id) ?? "";
    note(`会員ID ${id} の抜粋行: ${x}`);
    expect(x.startsWith("contory:日本:pref:東京都:name01:B0804-009-S1:"), `抜粋行が「contory:日本:pref:東京都:name01:B0804-009-S1:」で始まる（実際: ${x.slice(0, 60)}）`).toBe(true);
    const メール = (/:email:([^:]+):/.exec(x) ?? [])[1] ?? "";
    expect(x, "抜粋行の電話番号・メールアドレス・住所1・住所2").toContain(`tel01:080:tel02:4009:tel03:0001:email:${メール}:addr01:B0804-009-A11:addr02:B0804-009-A12`);
    expect(x, "抜粋行の住所3").toContain("addr03:null");
  });
});

caseTest("IT-B08-04-010", async (ctx) => {
  const r = await 待つ手順(ctx, "S-B08-04-LAYOUT-010");
  const t = await 本文を読む(ctx, r);
  await ctx.expected(async () => {
    const id = ctx.notes.get("〔会員ID-B0804-010〕");
    const l = 行(t).filter((x) => x !== "");
    expect(l[0], "本文の最初の行").toBe("会員ID");
    const i = l.indexOf(id);
    expect(i, `本文に会員ID ${id} の行`).toBeGreaterThan(0);
    const キー = Array.from((l[i + 1] ?? "").matchAll(/(?:^|:)([a-z_0-9]+):/g), (m) => m[1]).filter((k) => ["contory", "pref", "name01", "name02", "tel01", "tel02", "tel03", "email", "addr01", "addr02", "addr03"].includes(k));
    expect(キー, "抜粋行のキーの並び").toEqual(["contory", "pref", "name01", "name02", "tel01", "tel02", "tel03", "email", "addr01", "addr02", "addr03"]);
  });
});

caseTest("IT-B08-04-014", async (ctx) => {
  await 待つ手順(ctx, "S-B08-04-NOUPDATE-014");
  const id = ctx.notes.get("〔会員ID-B0804-014〕");
  let v: ReturnType<typeof 会員の住所3と姓> = null;
  await ctx.step(2, async () => { v = 会員の住所3と姓(id); note(`会員ID ${id} の住所3・名前(姓): ${JSON.stringify(v)}`); });
  await ctx.expected(async () => {
    expect(v, `会員ID ${id} の会員がいる`).not.toBeNull();
    expect(v!.住所3, "住所3（未設定のまま）").toBeNull();
    expect(v!.姓, "名前(姓)").toBe("B0804-014-S1");
  });
});
