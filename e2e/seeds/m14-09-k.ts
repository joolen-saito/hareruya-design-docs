// 取り込み注記: 同じ機能の作り方を main 側も実装していたため、栗野側の版を別ファイルにした。main が登録済みのシードは登録しない（seeds/main_defined.ts）。
/**
 * M14-09 フォーマット一覧 のシードの作り方（画面操作）。正本: cases/M14-09_seed_data.tsv
 *
 * - 試験管理者: メンバー管理で「あれば使い、無ければ登録する」（システム管理者の権限・所属店舗と編集可能店舗は本店。カード管理・イベント管理を操作できる）。
 * - フォーマット・イベント・デッキ・アーキタイプ・カードの名前は、決め打ちの識別の値なので、末尾に実行ごとの印を付けて作る（lib/run_marker.ts）。
 *   フォーマットはほかの機能（M13・M14-05・M15）も使う共有のマスタ。実在の「スタンダード」「レガシー」などに当てて、既にあるフォーマットの中身を
 *   変えたり消したりしないため（一覧表示確認データの「レガシー」は削除済みにする）。一覧の並び順・認定の表示はケースが確かめるので、
 *   並び順・略称・認定はシード表の値のまま。
 * - 認定「公式 / Official」: MTGマスターデータ画面の「認定」で、無いときだけ登録する（並び順1）。
 * - イベント: 試験管理者で登録する（店舗は試験管理者が編集できる店舗の選択肢の先頭、ルール適用度は選択肢の先頭）。
 * - 存在しない識別子（999999019・999999020）は、フォーマット詳細画面のアドレスの番号を書き換えて開き、該当なし（404）であることを確かめる。
 *
 * 作らないシード（ケースを実装しない）:
 * - S-M14-09-ALL-002（12件以外のフォーマットを一覧から外す初期化がDBでの準備）、S-M14-09-ZERO-004（DBスナップショットの復元）。
 * - S-M14-09-DECK-013・014: デッキ編集(登録)画面は、アーキタイプの選択肢を、選んだフォーマットに属するものだけに絞る。シード表の
 *   「フォーマットにデッキ使用中フォーマット、アーキタイプに別のフォーマット（デッキ用補助フォーマット）に属するアーキタイプ」は画面で選べない。
 */
import { Browser, Page } from "@playwright/test";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { rc } from "../lib/run_marker";
import { Account, withAdminSession } from "../lib/session";
import { registerEvent } from "../pages/admin/event";
import { カードを登録する } from "../pages/admin/m14_card";
import {
  FormatListPage, アーキタイプを登録する, イベント登録の選択肢, フォーマットを一覧から削除する, フォーマットを登録する, フォーマット詳細の応答,
  同じ名のフォーマットを消す, 認定を用意する,
} from "../pages/admin/m14_09_format_list";
import { ensureAnalysisAdmin } from "./m12-common";

export const M1409_ADMIN: Account = { loginId: "m1409_admin", password: "Passw0rd!M1409" };

/** 正本の名前に実行の印を付けた値（ケースの手順・期待結果の同じ名前も、この値として読む） */
export const 名 = (正本の名前: string): string => rc(正本の名前);

const 管理画面 = <T>(browser: Browser, fn: (page: Page) => Promise<T>) =>
  withAdminSession(browser, M1409_ADMIN, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });

/** 一覧表示確認データのフォーマット（登録順） */
export const 一覧表示確認データ = [
  { 呼び名: "〔フォーマットID-M1409-共有A〕", 名日: "スタンダード", 名英: "Standard", コード: "STD", 認定: "公式", 並び順: "10" },
  { 呼び名: "〔フォーマットID-M1409-共有B〕", 名日: "モダン", 名英: "Modern", コード: "MO", 認定: undefined, 並び順: "10" },
  { 呼び名: "〔フォーマットID-M1409-共有C〕", 名日: "パイオニア", 名英: "Pioneer", コード: "PI", 認定: "公式", 並び順: "20" },
  { 呼び名: "〔フォーマットID-M1409-共有D〕", 名日: "レガシー", 名英: "Legacy", コード: undefined, 認定: undefined, 並び順: "5" },
] as const;

defineSeed("S-M14-09-LIST", { needs: ["S-M14-09-ADM"] }, async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const issue = (m: string) => reportSeedIssue(id, m);
  await 管理画面(browser, async (page) => {
    if (await 認定を用意する(page, { 日: "公式", 英: "Official", 並び順: "1" }, id)) issue("認定「公式 / Official」が無かったので、MTGマスターデータ画面で登録した");
    // 印つきの名前は実行ごとに違うので、同じ名前の行は通常は無い。あれば同じ印で流し直したもので、削除済みの「レガシー」の番号を画面から読めないので止める
    const list = new FormatListPage(page);
    await list.open();
    for (const f of 一覧表示確認データ) {
      if ((await list.名で探す(名(f.名日))).length) throw new Error(`${id}: フォーマット「${名(f.名日)}」が既にある（同じ実行の印で流し直した）。印を変えて流す`);
    }
    for (const f of 一覧表示確認データ) {
      notes.set(f.呼び名, await フォーマットを登録する(page, {
        名日: 名(f.名日), 名英: 名(f.名英), コード: f.コード, 認定: f.認定, 並び順: f.並び順, メタゲーム分析日数: "14",
      }, id, issue));
    }
    await フォーマットを一覧から削除する(page, notes.get("〔フォーマットID-M1409-共有D〕"), id);
  });
});

/** 「フォーマット名(日)・(英)、並び順900、メタゲーム分析日数14」で登録して控える */
async function 専用のフォーマット(page: Page, 名日: string, 名英: string, issue: (m: string) => void, seedId: string): Promise<string> {
  return フォーマットを登録する(page, { 名日: 名(名日), 名英: 名(名英), 並び順: "900", メタゲーム分析日数: "14" }, seedId, issue);
}

// イベント使用中フォーマット（011・012）
function defineEventSeed(seedId: string, n: string): void {
  defineSeed(seedId, { needs: ["S-M14-09-ADM"] }, async ({ browser, notes, seed }) => {
    const id = seed.シードID;
    const issue = (m: string) => reportSeedIssue(id, m);
    await 管理画面(browser, async (page) => {
      notes.set(`〔フォーマットID-M1409-${n}〕`, await 専用のフォーマット(page, `イベント使用中フォーマット-${n}`, `Event Format ${n}`, issue, id));
      const [店舗] = await イベント登録の選択肢(page, "baseInfo");
      if (!店舗) throw new Error(`${id}: イベント登録の店舗の選択肢が無い（試験管理者に編集権限のある店舗が無い）`);
      const [適用度] = await イベント登録の選択肢(page, "rel");
      if (!適用度) throw new Error(`${id}: イベント登録のルール適用度の選択肢が無い`);
      issue(`イベントの店舗は、試験管理者が編集できる店舗の選択肢の先頭「${店舗}」、ルール適用度は選択肢の先頭「${適用度}」を選んだ`);
      await registerEvent(page, {
        イベント名日: 名(`EV-M1409-01-${n}`), イベント名英: 名(`EV-M1409-01-${n}`), 店舗, フォーマット: [名(`イベント使用中フォーマット-${n}`)],
        ルール適用度: 適用度, 公開状態: "非公開", 定員: "8", 参加費: "0",
      });
    });
  });
}
defineEventSeed("S-M14-09-EVENT-011", "011");
defineEventSeed("S-M14-09-EVENT-012", "012");

// アーキタイプ使用中フォーマット（015・016）
function defineArchetypeSeed(seedId: string, n: string): void {
  defineSeed(seedId, { needs: ["S-M14-09-ADM"] }, async ({ browser, notes, seed }) => {
    const id = seed.シードID;
    const issue = (m: string) => reportSeedIssue(id, m);
    await 管理画面(browser, async (page) => {
      notes.set(`〔フォーマットID-M1409-${n}〕`, await 専用のフォーマット(page, `アーキタイプ使用中フォーマット-${n}`, `Archetype Format ${n}`, issue, id));
      await アーキタイプを登録する(page, {
        名日: 名(`ARCH-M1409-01-${n}`), 名英: 名(`ARCH-M1409-01-${n}`), 公開状態: "非公開", フォーマット: 名(`アーキタイプ使用中フォーマット-${n}`),
      }, id, issue);
    });
  });
}
defineArchetypeSeed("S-M14-09-ARCHETYPE-015", "015");
defineArchetypeSeed("S-M14-09-ARCHETYPE-016", "016");

// 削除可能フォーマット（017・018）: 禁止の指定1件と制限の指定1件
function defineDeletableSeed(seedId: string, n: string): void {
  defineSeed(seedId, { needs: ["S-M14-09-ADM"] }, async ({ browser, notes, seed }) => {
    const id = seed.シードID;
    const issue = (m: string) => reportSeedIssue(id, m);
    await 管理画面(browser, async (page) => {
      const fmt = 名(`削除可能フォーマット-${n}`);
      notes.set(`〔フォーマットID-M1409-${n}〕`, await 専用のフォーマット(page, `削除可能フォーマット-${n}`, `Deletable Format ${n}`, issue, id));
      for (const [card, legal] of [[`CARD-BAN-001-${n}`, "禁止"], [`CARD-LIMIT-001-${n}`, "制限"]] as const) {
        await カードを登録する(page, { カード名英: 名(card), 点数で見たマナ: "0", リーガリティ: [{ フォーマット: fmt, リーガリティ: legal }], 詳細: false }, id, issue);
      }
    });
  });
}
defineDeletableSeed("S-M14-09-DELETABLE-017", "017");
defineDeletableSeed("S-M14-09-DELETABLE-018", "018");

// 存在しない識別子確認データ（019・020）
function defineNotFoundSeed(seedId: string, n: string): void {
  defineSeed(seedId, { needs: ["S-M14-09-ADM"] }, async ({ browser, notes, seed }) => {
    const id = seed.シードID;
    const issue = (m: string) => reportSeedIssue(id, m);
    await 管理画面(browser, async (page) => {
      notes.set(`〔フォーマットID-M1409-${n}〕`, await 専用のフォーマット(page, `識別子確認フォーマット-${n}`, `Identifier Format ${n}`, issue, id));
      const status = await フォーマット詳細の応答(page, `999999${n}`);
      if (status !== 404) throw new Error(`${id}: フォーマット詳細画面のアドレスの番号を 999999${n} にして開いた応答が ${status}（該当なしの 404 にならない）`);
    });
  });
}
defineNotFoundSeed("S-M14-09-NOTFOUND-019", "019");
defineNotFoundSeed("S-M14-09-NOTFOUND-020", "020");

// トークン不一致確認データ（021・022）
function defineTokenSeed(seedId: string, n: string): void {
  defineSeed(seedId, { needs: ["S-M14-09-ADM"] }, async ({ browser, notes, seed }) => {
    const id = seed.シードID;
    await 管理画面(browser, async (page) => {
      notes.set(`〔フォーマットID-M1409-${n}〕`, await 専用のフォーマット(page, `トークン確認フォーマット-${n}`, `Token Format ${n}`, (m) => reportSeedIssue(id, m), id));
    });
  });
}
defineTokenSeed("S-M14-09-TOKEN-021", "021");
defineTokenSeed("S-M14-09-TOKEN-022", "022");

defineSeed("S-M14-09-DP-NOLEGAL-027", { needs: ["S-M14-09-ADM"] }, async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const issue = (m: string) => reportSeedIssue(id, m);
  await 管理画面(browser, async (page) => {
    const n = await 同じ名のフォーマットを消す(page, 名("M1409-027-A"), id);
    if (n) issue(`「${名("M1409-027-A")}」の行が ${n} 件あったので、一覧の3点リーダーから削除した`);
    notes.set("〔フォーマットID-M1409-027〕", await 専用のフォーマット(page, "M1409-027-A", "M1409-027-A", issue, id));
  });
});
