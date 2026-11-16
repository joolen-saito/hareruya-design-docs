/**
 * M16-06 買取価格対応表（一覧） のシード（画面操作）。正本: cases/M16-06_seed_data.tsv
 *
 * 依頼者の方針（2026-11-11「夜に1本だけで流し、ケースの終わりに必ず元へ戻すなら、共有の設定を書き換えてよい」）に従う作り:
 * - S-M16-06-ADM: メンバー管理で登録する試験管理者（データ管理を操作できる「システム管理者」。あれば確かめて使う）。
 * - S-M16-06-CARD-CONDITIONS: 標準マスターデータの SP・MP・HP。登録しない。一覧の見出しにこの順で出ることを画面で確かめる。
 * - S-M16-06-FULL-001〜010: シード表は「買取価格対応表の既存データを全件除き、DBシードで識別ID 1606xxx01〜12 の12件だけを入れる」。
 *   買取価格対応表には行を足す・消す画面が無く（買取価格の更新だけ）、共有のマスタの行を消せないので、12件だけにはしない。
 *   既存の NM価格1000・2000 の行（各6組）を使い、ケースが確かめる組の買取価格だけを、買取価格対応表（編集）で正本の値に書き換える。
 *   書き換える前に、その組の行の値（買取価格・NM価格・カード状態・Foil or Promotion Card?）を画面で全部控え（lib/shared_restore.ts の registerRestore）、
 *   ケースの終わりに画面で元の買取価格に戻し、開き直して控えと同じかを確かめる。識別ID は画面（一覧のリンク）が示す既存の値に読み替える。
 *   - 001・002（12件の表示を見る）: NM価格1000・2000 の12組を書き換える。
 *   - 004（NM価格の欄にリンクが無いことを見る）: 書き換えない（買取価格の値を見ないため）。
 *   - 005〜010（1つの組のリンクを押す）: 押す組の1つだけを書き換える。
 * - S-M16-06-ZERO-011（0件）: 行を消す画面が無く、共有のマスタを全件消すことになるので作らない（ケース 011 は書かない）。
 */
import { Browser } from "@playwright/test";
import { Account, withAdminSession } from "../lib/session";
import { reportSeedIssue, SeedBuilder } from "../lib/seeds";
import { registerRestore } from "../lib/shared_restore";
import { defineSeed } from "./current_seed";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";
import { BuyPriceEditPage, 行を控える, 行が元と同じか, 行の控え } from "../pages/admin/m16_07_buy_price";
import { BuyPriceListPage, 買取価格を書き換える, 区分, 状態 } from "../pages/admin/m16_06_buy_price_list";

export const M1606_ADMIN: Account = { loginId: "m1606_admin", password: "Passw0rd!M1606" };

defineSeed("S-M16-06-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M16-06試験管理者", account: M1606_ADMIN, メール: "m1606_admin@example.test" });
});

defineSeed("S-M16-06-CARD-CONDITIONS", { needs: ["S-M16-06-ADM"] }, async ({ browser, seed }) => {
  const codes = await withAdminSession(browser, M1606_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const l = new BuyPriceListPage(page);
    await l.開く();
    return l.二段目の見出し();
  });
  const want = ["SP", "MP", "HP", "SP", "MP", "HP"];
  if (JSON.stringify(codes) !== JSON.stringify(want)) {
    throw new Error(`買取価格対応表（一覧）の見出しのカード状態が ${codes.join("・")}（SP・MP・HP がノーマルカード・Foil&プロモ版カードの順に並ぶはず）`);
  }
  reportSeedIssue(seed.シードID, "カード状態 SP・MP・HP は登録せず、標準マスターデータの値を使った（買取価格対応表（一覧）の見出しに SP・MP・HP の順で出ることを画面で確かめた）");
});

/** 正本の12件（NM価格・区分・状態 → 買取価格） */
export type 組 = { NM価格: number; 区分: 区分; 状態: 状態; 買取価格: number };
export const 正本の12件: 組[] = [
  ...([[1000, [900, 800, 700, 600, 500, 400]], [2000, [1900, 1800, 1700, 1600, 1500, 1400]]] as const).flatMap(([nm, ps]) =>
    (["ノーマル", "Foil&プロモ"] as const).flatMap((区, k) => (["SP", "MP", "HP"] as const).map((状, j) => ({ NM価格: nm, 区分: 区, 状態: 状, 買取価格: ps[k * 3 + j] })))),
];
export function 正本の組(nm: number, 区: 区分, 状: 状態): 組 {
  const r = 正本の12件.find((x) => x.NM価格 === nm && x.区分 === 区 && x.状態 === 状);
  if (!r) throw new Error(`正本の12件に NM価格 ${nm}・${区}・${状} が無い`);
  return r;
}

/** 控えた行を、別のブラウザの画面で元の買取価格に戻す・戻ったかを確かめる登録（ケースの終わりに基盤が呼ぶ） */
function 戻す登録(browser: Browser, seedId: string, 控え: 行の控え[]): void {
  registerRestore(
    `買取価格対応表（${seedId}・識別ID ${控え.map((c) => c.id).join("・")}）の買取価格`,
    控え,
    async () => {
      await withAdminSession(browser, M1606_ADMIN, async (page) => {
        page.setDefaultTimeout(60_000);
        // 元の買取価格で更新し、更新の成功の表示まで確かめる（同じ値なら更新しない）。戻ったかは、開き直して verify で確かめる
        for (const c of 控え) await 買取価格を書き換える(page, String(c.id), Number(c.買取価格));
      });
    },
    async () => withAdminSession(browser, M1606_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const p = new BuyPriceEditPage(page);
      for (const c of 控え) if (!(await 行が元と同じか(p, c))) return false;
      return true;
    }),
  );
}

/**
 * 既存の NM価格の行から、書き換える組の識別IDを一覧のリンクで引き、編集画面で行の値を全部控えてから（registerRestore）、
 * 正本の買取価格に書き換える。書き換えたあと、一覧で値が出ていることを確かめる。
 */
async function 組を書き換える(browser: Browser, seedId: string, 組たち: 組[]): Promise<void> {
  await withAdminSession(browser, M1606_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const l = new BuyPriceListPage(page);
    await l.開く();
    const ids: { 組: 組; id: string }[] = [];
    for (const k of 組たち) {
      const c = await l.欄を読む(k.NM価格, k.区分, k.状態);
      if (!c.リンク || !c.識別ID) throw new Error(`NM価格 ${k.NM価格} の${k.区分}・${k.状態}の組が登録されていない（一覧の欄が「${c.文}」）。既存の行が無いので、共有のマスタに行を足さずには作れない`);
      ids.push({ 組: k, id: c.識別ID });
    }
    const e = new BuyPriceEditPage(page);
    const 控え: 行の控え[] = [];
    for (const { id } of ids) {
      const st = await e.開く(id);
      if (st !== 200) throw new Error(`買取価格対応表（編集）（識別ID ${id}）を開けない（応答 ${st}）`);
      控え.push(await 行を控える(e, Number(id)));
    }
    戻す登録(browser, seedId, 控え); // 書き換える「前に」登録する
    for (const { 組: k, id } of ids) await 買取価格を書き換える(page, id, k.買取価格);
    await l.開く();
    for (const k of 組たち) {
      const c = await l.欄を読む(k.NM価格, k.区分, k.状態);
      if (c.金額 !== k.買取価格) throw new Error(`書き換えたあとの一覧で、NM価格 ${k.NM価格} の${k.区分}・${k.状態}が ${c.文}（${k.買取価格} のはず）`);
    }
  });
}

const 共通の注記 = (seedId: string) =>
  `${seedId}: 買取価格対応表には行を足す・消す画面が無いので、既存データを全件除いて12件だけにすることはしなかった（共有のマスタの行を消さない）。` +
  "既存の NM価格1000・2000 の行を使い、識別ID は一覧のリンクが示す既存の値に読み替えた。一覧には NM価格1000・2000 のほかの行もある";

/** 001・002: NM価格1000・2000 の12組を書き換える */
function 十二組のシード(seedId: string): SeedBuilder {
  return async ({ browser }) => {
    await 組を書き換える(browser, seedId, 正本の12件);
    reportSeedIssue(seedId, 共通の注記(seedId));
    reportSeedIssue(seedId, "NM価格1000・2000 の12組の買取価格を、書き換える前に画面で控え、買取価格対応表（編集）で正本の値に書き換えた。ケースの終わりに画面で元の値に戻し、開き直して控えと同じかを確かめる");
  };
}
const NEEDS = { needs: ["S-M16-06-ADM", "S-M16-06-CARD-CONDITIONS"] };
defineSeed("S-M16-06-FULL-001", NEEDS, 十二組のシード("S-M16-06-FULL-001"));
defineSeed("S-M16-06-FULL-002", NEEDS, 十二組のシード("S-M16-06-FULL-002"));

defineSeed("S-M16-06-FULL-004", NEEDS, async ({ browser }) => {
  const seedId = "S-M16-06-FULL-004";
  await withAdminSession(browser, M1606_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const l = new BuyPriceListPage(page);
    await l.開く();
    const rows = await l.NM価格の行(1000);
    if (rows.length !== 1) throw new Error(`一覧に NM価格1000 の行が ${rows.length} 行（1行のはず）。既存の行が無いので、共有のマスタに行を足さずには作れない`);
  });
  reportSeedIssue(seedId, 共通の注記(seedId));
  reportSeedIssue(seedId, "ケースは NM価格の欄のリンクの有無だけを見るので、買取価格は書き換えなかった（既存の NM価格1000 の行があることを一覧で確かめた）");
});

/** 005〜010: ケースが押す NM価格1000 の1つの組だけを書き換える */
function 一組のシード(seedId: string, 区: 区分, 状: 状態): SeedBuilder {
  return async ({ browser }) => {
    const k = 正本の組(1000, 区, 状);
    await 組を書き換える(browser, seedId, [k]);
    reportSeedIssue(seedId, 共通の注記(seedId));
    reportSeedIssue(seedId, `ケースが押す NM価格1000 の${区}カード・${状}の組だけを、書き換える前に画面で控え、買取価格対応表（編集）で正本の ${k.買取価格} に書き換えた（ほかの11組は書き換えない）。ケースの終わりに画面で元の値に戻し、開き直して控えと同じかを確かめる`);
  };
}
defineSeed("S-M16-06-FULL-005", NEEDS, 一組のシード("S-M16-06-FULL-005", "ノーマル", "SP"));
defineSeed("S-M16-06-FULL-006", NEEDS, 一組のシード("S-M16-06-FULL-006", "ノーマル", "MP"));
defineSeed("S-M16-06-FULL-007", NEEDS, 一組のシード("S-M16-06-FULL-007", "ノーマル", "HP"));
defineSeed("S-M16-06-FULL-008", NEEDS, 一組のシード("S-M16-06-FULL-008", "Foil&プロモ", "SP"));
defineSeed("S-M16-06-FULL-009", NEEDS, 一組のシード("S-M16-06-FULL-009", "Foil&プロモ", "MP"));
defineSeed("S-M16-06-FULL-010", NEEDS, 一組のシード("S-M16-06-FULL-010", "Foil&プロモ", "HP"));
