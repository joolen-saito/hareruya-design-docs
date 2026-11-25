/**
 * A15-18 デッキ更新インポートの続き（030・034・045・048・049）のシード。正本: cases/A15-18_seed_data.tsv
 * 既存の seeds/a15-18.ts は変えず、共通のシード（会員・フォーマット・カード・公開区分）はそこで登録されたものを needs で使う。
 *
 * シードでの解釈（正本の外の補い）:
 * - 更新の対象デッキは、DB へ書かずに、デッキビルダーの登録の API で作る（識別子は API が振った番号を控える。a15-18.ts と同じ）。
 * - アーキタイプ（画像つき）は、管理画面のアーキタイプ登録で「代表カードを選ぶ」で作る（あれば使う）。代表カードは「結合試験カードA」を探して選ぶ。
 *   アーキタイプの画像は、登録後に DB で読んで控える。更新前のデッキ画像（更新前デッキカード用）・統率者のカードの画像と同じにならないことを確かめる。
 * - 034: 同じカードに登録日時の違うカード画像2件は、カード登録CSVで作った E2E のカードの画像の行だけ DB で書き足す（lib/db_write.ts）。
 */
import { SETUP_ADMIN, BASE_URL } from "../config/env";
import {
  アーキタイプの番号, アーキタイプの画像の番号, カード画像の数, カードの番号, カードの最新の画像の番号, 登録日時の違う画像を2件にする,
} from "../db/a15_18_c";
import { 名前のカードの数, 公開区分の番号 } from "../db/a15_18";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { 下書きを作る, 取得したデッキ名, 対象デッキを作る, ログインする } from "../pages/api/a15_18_deck_update_import";
import { カードをCSVで登録する } from "../pages/admin/a15_17_setup";
import { 代表カード付きでアーキタイプを新規登録する } from "../pages/admin/a15_18_c_archetype";
import { 会員の定め, 対象デッキの番号 } from "./a15-18";
import "./a15-18";

export { 対象デッキの番号 };
/** 呼び名ごとの、アーキタイプの番号・アーキタイプの画像の番号・統率者のカードの番号・登録日時の違う画像（古い・新しい） */
export const 準備の控え = new Map<string, { アーキタイプ?: string; アーキタイプの画像?: string; 統率者のカード?: string; 古い画像?: string; 新しい画像?: string }>();

async function 会員のトークン(ctx: SeedCtx, 会員: string): Promise<string> {
  const 定め = 会員の定め[会員];
  const c = await ctx.browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(c);
    const page = await c.newPage();
    const { token, 応答 } = await ログインする(page, 定め.メール, 定め.パスワード);
    if (!token) throw new Error(`${ctx.seed.シードID}: 会員 ${会員} のログインでアクセストークンを受け取れない（HTTP ${応答.ステータス} ${応答.本文}）`);
    return token;
  } finally { await c.close(); }
}

async function カードを作る({ browser, seed }: SeedCtx, 日: string, 英: string, ファイル名: string): Promise<string> {
  if (カードの番号(日) === null) {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      await カードをCSVで登録する(page, [{ 日, 英 }], ファイル名, `${seed.シードID}: カード登録CSV`, (m) => reportSeedIssue(seed.シードID, m));
    });
  } else reportSeedIssue(seed.シードID, `カード「${日}」は登録済みなので、そのまま使った`);
  const id = カードの番号(日);
  if (id === null) throw new Error(`${seed.シードID}: カード「${日}」をカード登録CSVで登録したが、見つからない`);
  if (カード画像の数(id) === 0) throw new Error(`${seed.シードID}: カード「${日}」のカード画像が無い（カード登録CSVの画像URL(英語)で付くはず）`);
  return id;
}

type 定め = {
  /** 対象デッキを作るときのフォーマット（更新前フォーマット）。アーキタイプは更新で使うフォーマット側に作る */
  アーキタイプのフォーマット?: { 名: string; 番号の呼び名: string };
  アーキタイプ名?: string;
  統率者のカード?: { 日: string; 英: string };
  二枚の画像?: boolean;
  下書き?: boolean;
  未登録のカード?: string[];
  needs: string[];
};

function 対象のシード(seedId: string, 呼び名: string, o: 定め) {
  defineSeed(seedId, { needs: ["S-A15-18-FORMATS", "S-A15-18-CARDS", "S-A15-18-SCOPES", "S-A15-18-AUTH-A", ...o.needs] }, async (ctx) => {
    const { browser, notes, seed } = ctx;
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    for (const n of o.未登録のカード ?? []) {
      const c = 名前のカードの数(n);
      if (c !== 0) throw new Error(`${seed.シードID}: 「${n}」というカードが ${c} 件ある（シード表は未登録のカード。ほかの方のカードかもしれないので消さずに止める）`);
    }
    if (o.未登録のカード?.length) issue(`「${o.未登録のカード.join("」「")}」というカードが 0 件であることを DB で読んで確かめた（シード表の「あれば削除」は行わない）`);
    const 控え: { アーキタイプ?: string; アーキタイプの画像?: string; 統率者のカード?: string; 古い画像?: string; 新しい画像?: string } = {};
    if (o.統率者のカード) {
      控え.統率者のカード = await カードを作る(ctx, o.統率者のカード.日, o.統率者のカード.英, `a1518_${呼び名}_cmd.csv`);
      if (o.二枚の画像) {
        const r = 登録日時の違う画像を2件にする(控え.統率者のカード);
        控え.古い画像 = r.古い; 控え.新しい画像 = r.新しい;
        issue(`カード「${o.統率者のカード.日}」に登録日時の違うカード画像2件（古い ${r.古い}・新しい ${r.新しい}）を、E2E のカードの画像の行だけ DB で書き足した`);
      }
    }
    const k = (x: string) => notes.get(`〔カードID-A1518-共有${x}〕`);
    if (o.アーキタイプ名 && o.アーキタイプのフォーマット) {
      const 型 = notes.get(o.アーキタイプのフォーマット.番号の呼び名);
      if (アーキタイプの番号(o.アーキタイプ名, 型) === null) {
        await withAdminSession(browser, SETUP_ADMIN, async (page) => {
          const 画像 = await 代表カード付きでアーキタイプを新規登録する(page, {
            名日: o.アーキタイプ名!, 名英: `IT A1518 Archetype ${呼び名}`, フォーマット: o.アーキタイプのフォーマット!.名, 代表カードの名前: "結合試験カードA",
          }, `${seed.シードID}: アーキタイプ`, issue);
          issue(`アーキタイプ「${o.アーキタイプ名}」を管理画面で登録し、代表カードを選んだ（選んだ代表カード画像の番号 ${画像}）`);
        });
      } else issue(`アーキタイプ「${o.アーキタイプ名}」は登録済みなので、そのまま使った`);
      控え.アーキタイプ = アーキタイプの番号(o.アーキタイプ名, 型) ?? "";
      if (!控え.アーキタイプ) throw new Error(`${seed.シードID}: アーキタイプ「${o.アーキタイプ名}」が登録後に見つからない`);
      控え.アーキタイプの画像 = アーキタイプの画像の番号(控え.アーキタイプ);
      if (!控え.アーキタイプの画像) throw new Error(`${seed.シードID}: アーキタイプ「${o.アーキタイプ名}」に画像が無い（代表カードを選んだはず）`);
      const 更新前の画像 = カードの最新の画像の番号(k("C"));
      if (控え.アーキタイプの画像 === 更新前の画像) throw new Error(`${seed.シードID}: アーキタイプの画像が更新前のデッキ画像と同じで、画像が変わったことを確かめられない`);
      if (控え.統率者のカード && 控え.アーキタイプの画像 === カードの最新の画像の番号(控え.統率者のカード)) throw new Error(`${seed.シードID}: アーキタイプの画像が統率者のカードの画像と同じで、区別できない`);
    }
    準備の控え.set(呼び名, 控え);
    const token = await 会員のトークン(ctx, "共有A");
    const c = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    try {
      await hideDebugToolbar(c);
      const page = await c.newPage();
      const 型A = notes.get("〔フォーマットID-A1518-共有A〕");
      const id = await 対象デッキを作る(page, token, {
        デッキ名: `A1518-${呼び名}-更新前`, フォーマット: 型A, 公開区分: 公開区分の番号("非公開"), 画像カード: k("C"),
        デッキカード: [[k("C"), 1]], メイビー: [[k("D"), 1]], アトラクション: [[k("E"), 1]], ステッカー: [[k("F"), 1]],
      });
      対象デッキの番号.set(呼び名, id);
      if (o.下書き !== undefined) {
        if (o.下書き) await 下書きを作る(page, token, id, { フォーマット: 型A, 公開区分: 公開区分の番号("非公開"), デッキ名: "下書き" });
        const 取得 = await 取得したデッキ名(page, token, id);
        if ((取得.デッキ名 === "下書き") !== o.下書き) throw new Error(`${seed.シードID}: デッキ ${id} の一時保存（下書き）が${o.下書き ? "あるはずが、無い" : "無いはずが、ある"}`);
      }
    } finally { await c.close(); }
    issue(`更新の対象デッキ（デッキ名「A1518-${呼び名}-更新前」・非公開・デッキ画像は更新前デッキカード用のカードの画像・4区分の明細各1件）は、DB への書き込みの代わりに、デッキビルダーの登録の API で作り、振られた番号を控えた`
      + (o.下書き === undefined ? "" : o.下書き ? "。一時保存（下書き）は更新の API を即時保存なしで呼んで作り、取得の API で下書きの名前が返ることを確かめた（Redis の代わり）" : "。一時保存が無いことは取得の API が保存済みのデッキの名前を返すことで確かめた（Redis の代わり）"));
  });
}

const 統率 = { 名: "統率者試験フォーマット", 番号の呼び名: "〔フォーマットID-A1518-共有C〕" };
const 結合 = { 名: "結合試験フォーマット", 番号の呼び名: "〔フォーマットID-A1518-共有B〕" };
対象のシード("S-A15-18-TARGET-A-030", "030", {
  needs: ["S-A15-18-COMMANDER"], アーキタイプのフォーマット: 統率, アーキタイプ名: "A1518-030-アーキタイプ", 統率者のカード: { 日: "A1518-030-統率者", 英: "IT A1518 Commander 030" },
});
対象のシード("S-A15-18-TARGET-A-034", "034", { needs: ["S-A15-18-COMMANDER"], 統率者のカード: { 日: "A1518-034-統率者", 英: "IT A1518 Commander 034" }, 二枚の画像: true });
対象のシード("S-A15-18-CBTARGET-045", "CB045", {
  needs: [], アーキタイプのフォーマット: 結合, アーキタイプ名: "A1518-CB045-アーキタイプ", 下書き: true, 未登録のカード: ["A1518-CB045-未登録カード"],
});
対象のシード("S-A15-18-CBTARGET-048", "CB048", {
  needs: ["S-A15-18-COMMANDER"], アーキタイプのフォーマット: 統率, アーキタイプ名: "A1518-CB048-アーキタイプ", 下書き: false, 未登録のカード: ["A1518-CB048-未登録カード"],
});
対象のシード("S-A15-18-CBTARGET-049", "CB049", {
  needs: ["S-A15-18-COMMANDER"], アーキタイプのフォーマット: 統率, アーキタイプ名: "A1518-CB049-アーキタイプ", 下書き: true,
});
