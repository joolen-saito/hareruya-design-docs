/**
 * A15-09 デッキ情報登録（デッキビルダーの API の POST /api/deck）。正本: cases/A15-09_test_cases.tsv
 * 「ブラウザの開発者ツールで要求を送り、Network で応答を見る」の代わりに、試験ブラウザから API へ要求を送り、HTTP ステータスと応答本文（JSON）を読む。
 * アクセストークンは、所有者の会員でログインの API から受け取る（署名鍵は使わない）。保存結果は DB を参照して確かめる。
 * 書いたケース: 001〜009・013・014・018・039〜042。
 * 書かないケース: 010（プレイヤーの無い顧客のトークンは正規の手段で得られない。判断待ち）、016（商品・在庫・ポイントの基準値の準備が重い）、
 *   020〜038・043〜063（レギュレーション系。ケースごとにフォーマットとカードの制限を作る必要があり、別途）。
 */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import {
  カードの採用枚数, デッキの内容を読む, デッキ本体の件数, プレイヤーのデッキ件数, 区分別に読む, 区分別の文字列, 保存されたデッキを読む, 採用カードの件数,
} from "../../db/a15_09";
import { ログインする, 署名を1文字変える } from "../../pages/api/a15_18_deck_update_import";
import { デッキを登録する, 登録要求, 応答 } from "../../pages/api/a15_09_deck_register";
import { 所有者の定め } from "../../seeds/a15-09";
import "../../seeds/a15-09";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 開発者ツールの代わり = "開発者ツールの代わりに、試験ブラウザからデッキ情報登録 API（POST /api/deck）へ要求を送り、応答の HTTP ステータスと本文を読んだ（Network の代わり）";
const トークンの補い = "所有者の有効なトークンは、シード表の「テスト用認証データ作成機構で発行」の代わりに、所有者の会員でログインの API を呼んで受け取った（値は記録しない）";
const 番号の補い = "要求の中の固定の番号（15901 など）は、シードが控えた番号（フォーマット・アーキタイプ・カード・キャンペーンタグ）に読み替えた。カード画像ID 15932は、代表カードの画像を指す要求の項目が無いので使わない（代表カードの番号で指定する）";

const 番号 = (ctx: CaseCtx, 呼び名: string): string => ctx.notes.get(呼び名);
const A = (ctx: CaseCtx, 種: string, 記?: string): string => 番号(ctx, `〔${種}-A1509-共有${記 ?? ""}〕`);
const 数 = (ctx: CaseCtx, 種: string, 記?: string): number => Number(A(ctx, 種, 記));
const 所有者の選手 = (ctx: CaseCtx): string => 番号(ctx, "〔プレイヤーID-A1509-共有〕");

async function トークン(ctx: CaseCtx): Promise<string> {
  const { token, 応答 } = await ログインする(ctx.page, 所有者の定め.メール, 所有者の定め.パスワード);
  supplement(トークンの補い);
  note(`ログイン: POST /api/user/login・応答 HTTP ${応答.ステータス}`);
  if (!token) throw new Error(`ログインの API がトークンを返さない（HTTP ${応答.ステータス} ${応答.本文}）`);
  return token;
}

async function 送る(ctx: CaseCtx, token: string | undefined, 要求: 登録要求, 何 = "登録"): Promise<応答> {
  supplement(番号の補い);
  const r = await デッキを登録する(ctx.page, token, 要求);
  note(`${何}: POST /api/deck${token !== undefined ? "（jwt-token 付き）" : "（jwt-token なし）"}・要求 ${JSON.stringify(要求).slice(0, 400)}・応答 HTTP ${r.ステータス}・本文 ${r.本文.slice(0, 400)}`);
  return r;
}
const 要点 = (r: 応答): string => `応答 HTTP ${r.ステータス}・結果コード ${JSON.stringify(r.json?.code)}・結果メッセージ ${JSON.stringify(r.json?.message)}`;
const デッキ番号 = (r: 応答): string => String(r.json?.deck_id ?? "");

const 成功 = (r: 応答) => {
  expect.soft(r.ステータス, `HTTP ステータス（${要点(r)}）`).toBe(200);
  expect.soft(r.json?.code, "処理結果コード").toBe(200);
  expect.soft(r.json?.message, "処理結果メッセージ").toBe("Deck register success");
  expect.soft(/^\d+$/.test(デッキ番号(r)), `発番したデッキID（${デッキ番号(r)}）`).toBe(true);
};
const 拒否 = (r: 応答, 状態: number) => {
  expect.soft(r.ステータス, `HTTP ステータス（${要点(r)}）`).toBe(状態);
  expect.soft(r.json !== null && "code" in r.json, `応答に処理結果コードが含まれる（本文 ${r.本文.slice(0, 200)}）`).toBe(true);
  expect.soft(typeof r.json?.message === "string" && (r.json?.message as string).length > 0, "応答に処理結果メッセージが含まれる").toBe(true);
};
const 増えない = (前: { 本体: number; カード: number }, 何 = "") => {
  expect.soft(デッキ本体の件数(), `デッキ本体が追加されない${何}`).toBe(前.本体);
  expect.soft(採用カードの件数(), `採用カードが追加されない${何}`).toBe(前.カード);
};
const 件数を控える = () => ({ 本体: デッキ本体の件数(), カード: 採用カードの件数() });
const 全項目 = (ctx: CaseCtx): 登録要求 => ({
  deck_name: "結合試験デッキ", format_id: 数(ctx, "フォーマットID"), archetype_id: 数(ctx, "アーキタイプID"), scope_id: 1, image_card_id: 数(ctx, "カードID", "A"),
  campaign_tag_ids: [数(ctx, "キャンペーンタグID", "A"), 数(ctx, "キャンペーンタグID", "B")], cards: [{ card_id: 数(ctx, "カードID", "B"), board_id: 1, count: 1 }],
});

caseTest("IT-A15-09-001", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => { r = await 送る(ctx, await トークン(ctx), 全項目(ctx)); });
  await ctx.step(3, async () => { note(要点(r)); });
  await ctx.expected(async () => { expect.soft(r.ステータス, "HTTP ステータス200").toBe(200); 成功(r); });
});

caseTest("IT-A15-09-002", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => { r = await 送る(ctx, await トークン(ctx), 全項目(ctx)); });
  await ctx.step(3, async () => { note(`デッキID: ${デッキ番号(r)}`); });
  await ctx.step(4, async () => { note(`DB: ${JSON.stringify(デッキの内容を読む(デッキ番号(r))).slice(0, 700)}`); });
  await ctx.expected(async () => {
    const id = デッキ番号(r); const d = デッキの内容を読む(id); const s = 保存されたデッキを読む(id);
    expect.soft(r.ステータス, `HTTP ステータス（${要点(r)}）`).toBe(200);
    expect.soft(d.名前, "デッキ名").toBe("結合試験デッキ");
    expect.soft(d.フォーマット, "フォーマット").toBe(A(ctx, "フォーマットID"));
    expect.soft(d.アーキタイプ, "アーキタイプ").toBe(A(ctx, "アーキタイプID"));
    expect.soft(d.公開区分, "公開範囲").toBe("1");
    expect.soft(d.画像カード名, "代表カード画像のカード").toBe("結合試験カードA");
    expect.soft(d.タグ, "キャンペーンタグ").toEqual(["結合試験キャンペーンA", "結合試験キャンペーンB"]);
    expect.soft(d.明細.some((x) => x.includes("結合試験カードB") && x.includes("1枚")), `採用カードが追加された（明細 ${d.明細.join(" / ")}）`).toBe(true);
    expect.soft(s.持ち主, "所有者が認証したプレイヤー").toBe(所有者の選手(ctx));
  });
});

caseTest("IT-A15-09-003", async (ctx) => {
  let r!: 応答;
  const 配置: [string, string, string][] = [["B", "デッキカード", "メインボード"], ["C", "デッキカード", "サイドボード"], ["D", "デッキカード", "統率領域"], ["E", "メイビー", "メイビー"], ["F", "アトラクション", "アトラクション"], ["G", "ステッカー", "ステッカー"]];
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => { r = await 送る(ctx, await トークン(ctx), { deck_name: "配置ボード確認デッキ", cards: 配置.map(([k], i) => ({ card_id: 数(ctx, "カードID", k), board_id: i + 1, count: 1 })) }); });
  await ctx.step(3, async () => { note(`デッキID: ${デッキ番号(r)}`); });
  await ctx.step(4, async () => { note(`DB: ${区分別の文字列(区分別に読む(デッキ番号(r))).join(" / ")}`); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, `HTTP ステータス（${要点(r)}）`).toBe(200);
    const x = 区分別に読む(デッキ番号(r));
    const 名 = (k: string) => ({ A: "結合試験カードA", B: "結合試験カードB", C: "更新前デッキカード用", D: "更新前メイビー用", E: "更新前アトラクション用", F: "更新前ステッカー用", G: "結合試験カードA" }[k] as string);
    for (const [k, 区分, 領域] of 配置) {
      const 行 = (x as Record<string, { カード名: string; 領域: string; 枚数: number }[]>)[区分].filter((c) => c.カード名 === 名(k) && (区分 !== "デッキカード" || c.領域 === 領域));
      expect.soft(行.length, `カード「${名(k)}」が${領域}として保存された（${区分別の文字列(x).join(" / ")}）`).toBe(1);
    }
  });
});

caseTest("IT-A15-09-004", async (ctx) => {
  const rs: 応答[] = [];
  const 甲 = 数(ctx, "キャンペーンタグID", "A"), 乙 = 数(ctx, "キャンペーンタグID", "B");
  await ctx.step(1, async () => { rs.push(await 送る(ctx, await トークン(ctx), { scope_id: 1, campaign_tag_ids: 甲 }, "整数")); });
  await ctx.step(2, async () => { rs.push(await 送る(ctx, await トークン(ctx), { scope_id: 1, campaign_tag_ids: [甲, 乙] }, "配列")); });
  await ctx.step(3, async () => { note(`DB: ${rs.map((r) => JSON.stringify(デッキの内容を読む(デッキ番号(r)).タグ)).join(" ／ ")}`); });
  await ctx.expected(async () => {
    expect.soft(rs.map((r) => r.ステータス), "2回の HTTP ステータス").toEqual([200, 200]);
    expect.soft(デッキの内容を読む(デッキ番号(rs[0])).タグ, "整数を指定したデッキのキャンペーンタグ").toEqual(["結合試験キャンペーンA"]);
    expect.soft(デッキの内容を読む(デッキ番号(rs[1])).タグ, "配列を指定したデッキのキャンペーンタグ").toEqual(["結合試験キャンペーンA", "結合試験キャンペーンB"]);
  });
});

caseTest("IT-A15-09-005", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => { r = await 送る(ctx, await トークン(ctx), {}); });
  await ctx.step(3, async () => { note(`デッキID: ${デッキ番号(r)}`); });
  await ctx.step(4, async () => { note(`DB: ${JSON.stringify(保存されたデッキを読む(デッキ番号(r)))}`); });
  await ctx.expected(async () => {
    const id = デッキ番号(r); const s = 保存されたデッキを読む(id);
    expect.soft(r.ステータス, `HTTP ステータス（${要点(r)}）`).toBe(200);
    expect.soft(s.存在, "デッキ本体が追加された").toBe(true);
    expect.soft(s.名前なし, "デッキ名が値なしで保存された").toBe(true);
    expect.soft(区分別の文字列(区分別に読む(id)).length, "採用カードが追加されない").toBe(0);
  });
});

caseTest("IT-A15-09-006", async (ctx) => {
  const rs: 応答[] = [];
  await ctx.step(1, async () => { rs.push(await 送る(ctx, await トークン(ctx), { scope_id: 1 }, "公開1")); });
  await ctx.step(2, async () => { rs.push(await 送る(ctx, await トークン(ctx), { scope_id: 2 }, "非公開2")); });
  await ctx.step(3, async () => { note(`2回の応答: ${rs.map(要点).join(" ／ ")}`); });
  await ctx.step(4, async () => { note(`DB: 閲覧用トークンの有無 ${rs.map((r) => 保存されたデッキを読む(デッキ番号(r)).閲覧用トークン !== "").join(" / ")}`); });
  await ctx.expected(async () => {
    rs.forEach((r, i) => {
      expect.soft(r.ステータス, `${i + 1}回目の HTTP ステータス`).toBe(200);
      expect.soft(Object.keys(r.json ?? {}).includes("display_token"), `${i + 1}回目の応答に閲覧用トークンが含まれない（本文 ${r.本文.slice(0, 200)}）`).toBe(false);
      expect.soft(保存されたデッキを読む(デッキ番号(r)).閲覧用トークン, `${i + 1}回目のデッキの閲覧用トークンが DB に保存された`).not.toBe("");
    });
    const [甲, 乙] = rs.map((r) => 保存されたデッキを読む(デッキ番号(r)).閲覧用トークン);
    expect.soft(甲 !== 乙, "各デッキIDから作られた閲覧用トークンが互いに異なる").toBe(true);
  });
});

caseTest("IT-A15-09-007", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { r = await 送る(ctx, await トークン(ctx), { scope_id: 3 }); });
  await ctx.step(2, async () => { note(`デッキID ${デッキ番号(r)}・閲覧用トークンの有無 ${"display_token" in (r.json ?? {})}`); });
  await ctx.step(3, async () => { note(`DB: 閲覧用トークンの有無 ${保存されたデッキを読む(デッキ番号(r)).閲覧用トークン !== ""}`); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, `HTTP ステータス（${要点(r)}）`).toBe(200);
    const t = r.json?.display_token;
    expect.soft(typeof t === "string" && t.length > 0, "応答に閲覧用トークンが含まれる").toBe(true);
    expect.soft(保存されたデッキを読む(デッキ番号(r)).閲覧用トークン, "応答の閲覧用トークンが DB に保存された値と一致する").toBe(String(t));
  });
});

caseTest("IT-A15-09-008", async (ctx) => {
  let 前!: { 本体: number; カード: number }; let r!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); 前 = 件数を控える(); });
  await ctx.step(2, async () => { r = await 送る(ctx, undefined, 全項目(ctx)); });
  await ctx.step(3, async () => { note(要点(r)); });
  await ctx.step(4, async () => { note(`DB: デッキ本体 ${前.本体} → ${デッキ本体の件数()}`); });
  await ctx.expected(async () => { expect.soft(r.ステータス, "HTTP ステータス401").toBe(401); 拒否(r, 401); 増えない(前); });
});

caseTest("IT-A15-09-009", async (ctx) => {
  let 前!: { 本体: number; カード: number }; let r!: 応答;
  await ctx.step(1, async () => { note("所有者の有効なトークンの末尾1文字を変える"); });
  await ctx.step(2, async () => { const t = 署名を1文字変える(await トークン(ctx)); 前 = 件数を控える(); r = await 送る(ctx, t, 全項目(ctx), "末尾1文字を変えたトークン"); });
  await ctx.step(3, async () => { note(要点(r)); });
  await ctx.step(4, async () => { note(`DB: デッキ本体 ${前.本体} → ${デッキ本体の件数()}`); });
  await ctx.expected(async () => { expect.soft(r.ステータス, "HTTP ステータス401").toBe(401); 拒否(r, 401); 増えない(前); });
});

caseTest("IT-A15-09-013", async (ctx) => {
  let 前!: { 本体: number; カード: number }; let r!: 応答;
  await ctx.step(1, async () => { 前 = 件数を控える(); r = await 送る(ctx, await トークン(ctx), { scope_id: 4 }); });
  await ctx.step(2, async () => { note(要点(r)); });
  await ctx.step(3, async () => { note(`DB: デッキ本体 ${前.本体} → ${デッキ本体の件数()}`); });
  await ctx.expected(async () => { expect.soft(r.ステータス, "HTTP ステータス400").toBe(400); 拒否(r, 400); 増えない(前); });
});

caseTest("IT-A15-09-014", async (ctx) => {
  let 前!: { 本体: number; カード: number }; let r!: 応答;
  await ctx.step(1, async () => { note(`cards に card_id ${A(ctx, "カードID", "B")}・board_id 7・count 1 を指定する`); });
  await ctx.step(2, async () => { 前 = 件数を控える(); r = await 送る(ctx, await トークン(ctx), { scope_id: 1, cards: [{ card_id: 数(ctx, "カードID", "B"), board_id: 7, count: 1 }] }); });
  await ctx.step(3, async () => { note(要点(r)); });
  await ctx.step(4, async () => { note(`DB: デッキ本体 ${前.本体} → ${デッキ本体の件数()}`); });
  await ctx.expected(async () => { expect.soft(r.ステータス, "HTTP ステータス400").toBe(400); 拒否(r, 400); 増えない(前); });
});

caseTest("IT-A15-09-018", async (ctx) => {
  let 前!: { 本体: number; カード: number }; const rs: 応答[] = []; let t = "";
  const 型 = 数(ctx, "フォーマットID"); const B = 数(ctx, "カードID", "B");
  await ctx.step(1, async () => { 前 = 件数を控える(); });
  await ctx.step(2, async () => { t = await トークン(ctx); rs.push(await 送る(ctx, t, { format_id: 型, scope_id: 1, cards: [{ card_id: 15999018, board_id: 1, count: 1 }] }, "未登録カード")); });
  await ctx.step(3, async () => { rs.push(await 送る(ctx, t, { format_id: 型, scope_id: 1, cards: [{ card_id: 15999018, board_id: 4, count: 1 }] }, "未登録カード・メイビー")); });
  await ctx.step(4, async () => { rs.push(await 送る(ctx, t, { format_id: 型, scope_id: 1, cards: [{ card_id: B, board_id: 1, count: 0 }] }, "採用枚数0")); });
  await ctx.step(5, async () => { rs.push(await 送る(ctx, t, { format_id: 型, scope_id: 1, cards: [{ card_id: B, board_id: 1, count: 2147483648 }] }, "採用枚数2147483648")); });
  await ctx.step(6, async () => { note(`4回の応答: ${rs.map(要点).join(" ／ ")}`); });
  await ctx.step(7, async () => { note(`DB: デッキ本体 ${前.本体} → ${デッキ本体の件数()}`); });
  await ctx.expected(async () => {
    rs.forEach((r, i) => expect.soft(r.ステータス, `${i + 1}回目の HTTP ステータス（${要点(r)}）`).toBe(400));
    expect.soft(デッキ本体の件数(), "デッキの件数が増えない").toBe(前.本体);
  });
});

caseTest("IT-A15-09-039", async (ctx) => {
  let 前!: { 本体: number; カード: number }; let r!: 応答; const B = 数(ctx, "カードID", "B");
  await ctx.step(1, async () => { 前 = 件数を控える(); });
  await ctx.step(2, async () => { r = await 送る(ctx, await トークン(ctx), { format_id: 数(ctx, "フォーマットID"), scope_id: 1, cards: [{ card_id: B, board_id: 1, count: 1 }, { card_id: 15999039, board_id: 1, count: 1 }] }); });
  await ctx.step(3, async () => { note(要点(r)); });
  await ctx.step(4, async () => { note(`DB: デッキ本体 ${前.本体} → ${デッキ本体の件数()}・採用カード ${前.カード} → ${採用カードの件数()}`); });
  await ctx.expected(async () => { expect.soft(r.ステータス, `HTTP ステータス（${要点(r)}）`).toBe(400); 増えない(前, "（カードBの採用カードも保存されない）"); });
});

caseTest("IT-A15-09-040", async (ctx) => {
  let r!: 応答; const B = 数(ctx, "カードID", "B");
  await ctx.step(1, async () => { r = await 送る(ctx, await トークン(ctx), { format_id: 数(ctx, "フォーマットID"), scope_id: 1, cards: [{ card_id: B, board_id: 1, count: 2147483647 }] }); });
  await ctx.step(2, async () => { note(要点(r)); });
  await ctx.step(3, async () => { note(`DB: 採用枚数 ${JSON.stringify(カードの採用枚数(デッキ番号(r), String(B)))}・違反フラグ ${保存されたデッキを読む(デッキ番号(r)).レギュレーション違反}`); });
  await ctx.expected(async () => {
    const id = デッキ番号(r);
    expect.soft(r.ステータス, `HTTP ステータス（${要点(r)}）`).toBe(200);
    expect.soft(保存されたデッキを読む(id).存在, "デッキが保存された").toBe(true);
    expect.soft(カードの採用枚数(id, String(B)), "カードBの採用枚数が2147483647で保存された").toEqual([2147483647]);
    expect.soft(保存されたデッキを読む(id).レギュレーション違反, "レギュレーション違反フラグが有り").toBe(true);
  });
});

caseTest("IT-A15-09-041", async (ctx) => {
  let 前!: { 本体: number; カード: number }; let r!: 応答;
  await ctx.step(1, async () => { 前 = 件数を控える(); });
  await ctx.step(2, async () => { r = await 送る(ctx, undefined, { format_id: 数(ctx, "フォーマットID"), scope_id: 1, cards: [{ card_id: 15999041, board_id: 1, count: 1 }] }); });
  await ctx.step(3, async () => { note(要点(r)); });
  await ctx.step(4, async () => { note(`DB: デッキ本体 ${前.本体} → ${デッキ本体の件数()}・採用カード ${前.カード} → ${採用カードの件数()}`); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, `HTTP ステータス（${要点(r)}）`).toBe(401);
    expect.soft(r.ステータス !== 400, "400 にはならない").toBe(true);
    増えない(前);
  });
});

caseTest("IT-A15-09-042", async (ctx) => {
  let 前 = 0; const rs: 応答[] = []; let t = ""; const 選手 = 所有者の選手(ctx);
  const 要求: 登録要求 = { format_id: 数(ctx, "フォーマットID"), scope_id: 3, cards: [{ card_id: 数(ctx, "カードID", "B"), board_id: 1, count: 1 }] };
  await ctx.step(1, async () => { 前 = プレイヤーのデッキ件数(選手); note(`所有者のデッキの件数: ${前}`); });
  await ctx.step(2, async () => { t = await トークン(ctx); rs.push(await 送る(ctx, t, 要求, "1回目")); });
  await ctx.step(3, async () => { rs.push(await 送る(ctx, t, 要求, "2回目")); });
  await ctx.step(4, async () => { note(`2回の応答のデッキIDと閲覧用トークンの有無: ${rs.map((r) => `${デッキ番号(r)}/${"display_token" in (r.json ?? {})}`).join(" ／ ")}`); });
  await ctx.step(5, async () => { note(`DB: 所有者のデッキの件数 ${前} → ${プレイヤーのデッキ件数(選手)}`); });
  await ctx.expected(async () => {
    expect.soft(rs.map((r) => r.ステータス), "2回の HTTP ステータス").toEqual([200, 200]);
    expect.soft(デッキ番号(rs[0]) !== デッキ番号(rs[1]), "デッキIDが互いに異なる").toBe(true);
    expect.soft(rs[0].json?.display_token !== rs[1].json?.display_token, "閲覧用トークンが互いに異なる").toBe(true);
    expect.soft(プレイヤーのデッキ件数(選手), "デッキが2件増えた").toBe(前 + 2);
  });
});
