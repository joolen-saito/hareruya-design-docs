/**
 * F01-01 本店ECTOP のデッキ採用枚数ランキング欄の前提を、管理画面で作る操作（フォーマット・カード・カード商品・イベント・デッキ）と、
 * ケースの終わりに戻す操作。セレクタはここと、使っている既存の部品（m14_10_format・m14_card・m12_deck_seed・event・schedule ほか）だけ。
 *
 * 画面の作り（アプリのランキングの組み立て RankingBlockPayloadBuilder・デッキの集計で確かめた。期待値はここに書かない）:
 * - 本店TOPのデッキ採用枚数ランキング欄のタブは、フォーマット登録の「ランキング表示」にチェックのあるフォーマットのうち、集計の結果が1件以上のもの。
 * - 集計の結果は、フォーマットの番号ごとに一定の時間だけ覚えておかれる（結果が0件のときも覚えることがある）。
 *   そのため試験のフォーマットは「ランキング表示」を外して登録し、デッキまで登録し終えてから「ランキング表示」にチェックを入れる
 *   （登録の途中で本店TOPが開かれても、まだ集計の対象にならない。シード表の「途中で開かれたら1時間待つ」を待たずに済む）。
 *
 * 共有のものへの影響と戻し方:
 * - 試験のフォーマット（実行の印つきの名前）は「ランキング表示」ありのあいだ、だれの本店TOPにもタブが出る。
 *   ケースの終わりに、そのフォーマットのデッキを一括削除し、「ランキング表示」のチェックを外す（lib/shared_restore.ts に登録）。
 * - イベント（実行の印つきの名前・非公開）は、ケースの終わりにイベント編集の「削除」で消す。
 * - ほかのフォーマットの「ランキング表示」を外すシード（058）は、外す前に各フォーマットの登録画面の全項目を控え、
 *   ケースの終わりにチェックを入れ直し、開き直して全項目が控えと同じかを確かめる。
 * - カード・カード商品・アーキタイプは、ほかの試験データと同じく残る（名前・商品コードに実行の印がある）。
 */
import { Browser, expect, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../../config/env";
import { FIXED_MARK, rc, RUN_MARK } from "../../lib/run_marker";
import { registerRestore } from "../../lib/shared_restore";
import { Account, withAdminSession } from "../../lib/session";
import { deleteEvent, registerEvent } from "./event";
import { 在庫を増減して承認する } from "./f02_01_setup";
import { 規格のセールを設定する } from "./f01_02_setup";
import { 本店の店名 } from "./f04_setup";
import { フォーマットコード } from "./f09_01_setup";
import { savePublishedClass } from "./f03_07_restock";
import { downloadGoodsCsvTemplate, readExistingGoodsChildCategoryId } from "./m03_01_goods_csv";
import { registerGoodsCsv } from "./m03_01_goods_register";
import { classRowsFromProductEdit, openProductEditByCode, readLanguageIds } from "./m03_23_seed_products";
import { アーキタイプを登録する, デッキを一括削除する, デッキを登録する } from "./m12_deck_seed";
import { FormatListPage } from "./m14_09_format_list";
import { 欄 as フォーマットの欄, 登録を押す, 編集画面を開く, フォーマットを登録する } from "./m14_10_format";
import { カードを登録する, カード詳細IDs } from "./m14_card";
import { ensureMember } from "./member";
import { assignCardOnProductEdit } from "./product_card_assign";
import { registerSchedule } from "./schedule";
import { expectSaved } from "./common";

export type Issue = (m: string) => void;

const 管理画面 = <T>(browser: Browser, fn: (page: Page) => Promise<T>, account: Account = SETUP_ADMIN) =>
  withAdminSession(browser, account, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });

const p2 = (n: number) => String(n).padStart(2, "0");
/** 今日（日本時間）の n 日前の「yyyy-mm-dd」 */
export function 日前の日付(n: number): string {
  const d = new Date(Date.now() + 9 * 3600_000);
  d.setUTCDate(d.getUTCDate() - n);
  return `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 1)}-${p2(d.getUTCDate())}`;
}

// ---------------------------------------------------------------------------
// フォーマット
// ---------------------------------------------------------------------------

/** フォーマット登録画面の全項目（なりすまし対策のトークンを除く） */
async function フォーマットの全項目(page: Page, id: string): Promise<Record<string, string>> {
  const status = await 編集画面を開く(page, id);
  if (status !== 200) throw new Error(`フォーマット ${id} の登録画面を開けない（応答 ${status}）`);
  return page.locator("form").filter({ has: フォーマットの欄(page, "nameJp") }).first().evaluate((f) => {
    const out: Record<string, string> = {};
    const seen = new Map<string, number>();
    for (const el of Array.from((f as HTMLFormElement).elements) as HTMLInputElement[]) {
      const name = el.name;
      if (!name || /_token/.test(name) || el.type === "submit" || el.type === "button" || el.type === "file") continue;
      const n = seen.get(name) ?? 0;
      seen.set(name, n + 1);
      if (el.type === "checkbox" || el.type === "radio") out[`${name}=${el.value}`] = el.checked ? "1" : "0";
      else if (el.type === "select-multiple") out[`${name}@${n}`] = Array.from((el as unknown as HTMLSelectElement).selectedOptions).map((o) => o.value).join(",");
      else out[`${name}@${n}`] = el.value;
    }
    return out;
  });
}

/** フォーマット登録画面で「ランキング表示」のチェックを on にして登録する（すでにそうなら何もしない） */
export async function ランキング表示を設定する(page: Page, id: string, on: boolean, what: string, issue: Issue): Promise<void> {
  const status = await 編集画面を開く(page, id);
  if (status !== 200) throw new Error(`${what}: フォーマット ${id} の登録画面を開けない（応答 ${status}）`);
  const box = フォーマットの欄(page, "rankingFlg");
  if ((await box.isChecked()) === on) return;
  await box.setChecked(on);
  const r = await 登録を押す(page);
  if (!r.sent) throw new Error(`${what}: フォーマット ${id} の登録が送れない（ブラウザの入力チェックが止めた）`);
  for (const w of await expectSaved(page, `${what}: フォーマット ${id} の「ランキング表示」を${on ? "入れる" : "外す"}`)) issue(w);
  await expect(フォーマットの欄(page, "rankingFlg"), `${what}: 登録後のフォーマット ${id} の「ランキング表示」`).toBeChecked({ checked: on });
}

export async function ランキング表示か(page: Page, id: string): Promise<boolean> {
  const status = await 編集画面を開く(page, id);
  if (status !== 200) throw new Error(`フォーマット ${id} の登録画面を開けない（応答 ${status}）`);
  return フォーマットの欄(page, "rankingFlg").isChecked();
}

export type 試験フォーマット = { 名: string; メタ日数: string };

/**
 * 試験のフォーマットを「ランキング表示」なしで登録し、番号を返す。登録したらすぐ、ケースの終わりにそのフォーマットのデッキを消して
 * 「ランキング表示」を外すことを登録する（デッキを登録し終えてから ランキング表示を設定する で入れる）。
 */
export async function 試験フォーマットを登録する(browser: Browser, seedId: string, v: 試験フォーマット, issue: Issue): Promise<string> {
  const 名 = rc(v.名);
  const id = await 管理画面(browser, (page) => フォーマットを登録する(page, {
    名日: 名, 名英: 名, 並び順: "9000", コード: フォーマットコード(名), メタ日数: v.メタ日数, チェック: { rankingFlg: false },
  }, seedId));
  registerRestore(
    `試験のフォーマット「${名}」(ID ${id})の「ランキング表示」とデッキ`,
    { 作ったフォーマット: 名, 番号: id, 元: "登録した直後は「ランキング表示」なし" },
    async () => {
      await 管理画面(browser, async (page) => {
        await デッキを一括削除する(page, [名], null, () => undefined);
        await ランキング表示を設定する(page, id, false, `${seedId}: 戻す`, () => undefined);
      });
    },
    async () => 管理画面(browser, async (page) => !(await ランキング表示か(page, id))),
  );
  return id;
}

/**
 * ほかのフォーマット（除く に無いもの）で「ランキング表示」にチェックのあるものを全部外す。外す前に、対象の登録画面の全項目を控え、
 * ケースの終わりにチェックを入れ直して、全項目が控えと同じかを確かめることを登録する。外したフォーマットの番号を返す。
 */
export async function ほかのフォーマットのランキング表示を外す(browser: Browser, seedId: string, 除く: string[], issue: Issue): Promise<string[]> {
  const 控え = new Map<string, Record<string, string>>();
  await 管理画面(browser, async (page) => {
    const list = new FormatListPage(page);
    await list.open();
    const ids = (await list.行のフォーマットID()).filter((x) => !除く.includes(x));
    for (const id of ids) {
      const all = await フォーマットの全項目(page, id);
      if (all["admin_format[rankingFlg]=1"] === "1") 控え.set(id, all);
    }
  });
  const 対象 = [...控え.keys()];
  registerRestore(
    "ほかのフォーマットの「ランキング表示」",
    { 元はランキング表示ありのフォーマットの番号: 対象 },
    async () => {
      await 管理画面(browser, async (page) => {
        for (const id of 対象) await ランキング表示を設定する(page, id, true, `${seedId}: 戻す`, () => undefined);
      });
    },
    async () => 管理画面(browser, async (page) => {
      for (const id of 対象) {
        const now = await フォーマットの全項目(page, id);
        if (JSON.stringify(Object.entries(now).sort()) !== JSON.stringify(Object.entries(控え.get(id)!).sort())) return false;
      }
      return true;
    }),
  );
  await 管理画面(browser, async (page) => {
    for (const id of 対象) await ランキング表示を設定する(page, id, false, `${seedId}: ほかのフォーマットのランキング表示を外す`, issue);
  });
  return 対象;
}

// ---------------------------------------------------------------------------
// カード・カード商品
// ---------------------------------------------------------------------------

export type 試験カード = {
  /** カード名（日・英とも。実行の印を付けて登録する）。デッキのメインボードもこの名前で書く */
  名: string;
  土地?: boolean;
  Foil?: boolean;
  /** カードの代表の商品（無ければ商品を作らない） */
  商品?: { コード: string; 名?: string; セール?: boolean; 在庫?: number };
};
export type 作ったカード = { カードID: string; 詳細ID: string; 商品ID?: string; 規格ID?: string; 商品名?: string };

/**
 * カード詳細（登録）でカードを1枚ずつ登録し（点数で見たマナ・コスト 0、カードタイプは土地かクリーチャー、詳細情報1件: Foil の有無だけ指定し、
 * レアリティ・レイアウト・プロモ種別は選択肢の先頭）、代表の商品をグッズ商品CSV登録で作って「カード指定」でそのカード詳細を指定し、
 * 商品規格を公開にする。セールの商品は商品規格のセールフラグを入れ、在庫の指定がある商品は入庫して承認する。
 */
export async function 試験カードを作る(browser: Browser, seedId: string, defs: 試験カード[], issue: Issue): Promise<Map<string, 作ったカード>> {
  const out = new Map<string, 作ったカード>();
  if (defs.length === 0) return out;
  await 管理画面(browser, async (page) => {
    for (const d of defs) {
      const カードID = await カードを登録する(page, {
        カード名日: rc(d.名), カード名英: rc(d.名), 点数で見たマナ: "0", カードタイプ: [d.土地 ? "土地" : "クリーチャー"], 詳細: { Foil: d.Foil ? "あり" : "なし" },
      }, `${seedId}: カード ${d.名}`, issue);
      const 詳細 = await カード詳細IDs(page);
      if (詳細.length !== 1) throw new Error(`${seedId}: カード ${d.名} の詳細情報が ${詳細.length} 件（1件のはず）`);
      out.set(d.名, { カードID, 詳細ID: 詳細[0] });
    }
    issue("カードの詳細情報のレアリティ・レイアウト・プロモ種別は選択肢の先頭、フレームは通常、点数で見たマナ・コストは0にした（シード表は値を定めない）");
    const 商品 = defs.filter((d) => d.商品);
    if (商品.length === 0) return;
    const lang = await readLanguageIds(page);
    const categoryId = await readExistingGoodsChildCategoryId(page);
    const headers = (await downloadGoodsCsvTemplate(page)).headers;
    const 付随 = Object.fromEntries(headers.filter((h) => h.includes("地域") || h.includes("スマレジ連携")).map((h) => [h, "0"]));
    await registerGoodsCsv(page, {
      what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId.toLowerCase()}-${Date.now()}.csv`, categoryId,
      common: { "購入グループ名称": "通常商品", ...付随 },
      lines: 商品.map((d) => ({ code: rc(d.商品!.コード), nameJp: rc(d.商品!.名 ?? d.商品!.コード), nameEn: rc(d.商品!.名 ?? d.商品!.コード), values: { "言語(ID)": lang.日本語 } })),
      onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 180_000,
    });
    for (const d of 商品) {
      const p = d.商品!;
      const 名 = rc(p.名 ?? p.コード);
      const 商品ID = await openProductEditByCode(page, rc(p.コード));
      const c = out.get(d.名)!;
      await assignCardOnProductEdit(page, { productId: 商品ID, cardNameJp: rc(d.名), cardDetailId: c.詳細ID, productNameJp: 名, productNameEn: 名 }, (m) => issue(`${seedId}: ${m}`));
      const rows = await classRowsFromProductEdit(page, 商品ID);
      if (rows.length !== 1) throw new Error(`${seedId}: ${rc(p.コード)} の取込直後の商品規格が ${rows.length} 件（1件のはず）`);
      await savePublishedClass(page, { productId: 商品ID, classId: rows[0].商品規格ID }, `${seedId}: ${rc(p.コード)} の規格`, issue);
      if (p.セール) await 規格のセールを設定する(page, 商品ID, rows[0].商品規格ID, { フラグ: true, 販売価格: "100" }, `${seedId}: ${rc(p.コード)} のセール`, issue);
      Object.assign(c, { 商品ID, 規格ID: rows[0].商品規格ID, 商品名: 名 });
    }
  });
  const 入庫 = defs.filter((d) => d.商品?.在庫).map((d) => ({ 商品コード: rc(d.商品!.コード), 数: d.商品!.在庫!, 区分: "入庫/その他" as const, 承認後の在庫: d.商品!.在庫! }));
  await 在庫を増減して承認する(browser, seedId, 入庫, issue);
  return out;
}

// ---------------------------------------------------------------------------
// イベント（店舗を選べる管理者で登録する）
// ---------------------------------------------------------------------------

/**
 * イベントの登録・在庫変更CSV登録に使う試験の管理者（本店を編集できるシステム管理者。決まった印で1度だけ作り、実行をまたいで使い回す。
 * 依頼者の指示 2026-11-12「毎回作らずに1個でいけるやつは使い回す」）。
 * 全権限の管理者は編集可能店舗を持たず、イベントの店舗・在庫の店舗を選べない。
 */
export const イベント登録者 = { 名前: `F0101イベント登録者-${FIXED_MARK}`, account: { loginId: `f0101evt${FIXED_MARK}`.toLowerCase(), password: "Passw0rd!F0101Event" } as Account };
let 登録者を用意した = false;

/** 試験の管理者（イベント登録者）を一度だけ用意し、本店の店名を返す */
export async function イベント登録者を用意する(browser: Browser): Promise<string> {
  const shop = await 本店の店名(browser);
  if (登録者を用意した) return shop;
  await 管理画面(browser, (page) => ensureMember(page, {
    名前: イベント登録者.名前, 所属店舗: shop, ログインID: イベント登録者.account.loginId, メールアドレス: `${イベント登録者.account.loginId}@example.test`,
    パスワード: イベント登録者.account.password, 権限: "システム管理者", デフォルト検索表示店舗: shop, 編集可能店舗: [shop],
  }));
  登録者を用意した = true;
  return shop;
}

/**
 * イベントの新規登録で、イベント名(日)・(英)に実行の印つきの名前、店舗に本店、フォーマット、ルール適用度・公開状態・定員・参加費を入れて登録し、
 * 「日程追加」で開始時間を入れて登録する。公開状態はシード表が値を定めないので「非公開」（だれのイベント一覧にも出さない）。
 * ケースの終わりにイベントを削除することを登録する。イベントIDを返す。
 */
export async function 試験イベントを登録する(browser: Browser, seedId: string, v: { 名: string; 開始日: string; フォーマット: string[] }, issue: Issue): Promise<string> {
  const shop = await イベント登録者を用意する(browser);
  const 名 = rc(v.名);
  const id = await 管理画面(browser, async (page) => {
    const id = await registerEvent(page, { イベント名日: 名, イベント名英: 名, 店舗: shop, フォーマット: v.フォーマット, ルール適用度: "初心者歓迎", 公開状態: "非公開", 定員: "10", 参加費: "0" });
    await registerSchedule(page, id, { 開始時間: `${v.開始日} 12:00`, 受付あり: false, デッキ登録あり: false });
    return id;
  }, イベント登録者.account);
  issue(`イベント「${名}」: 店舗は本店（${shop}）、ルール適用度「初心者歓迎」、公開状態「非公開」、定員10、参加費0、日程の開始時間は ${v.開始日} 12:00 にした（シード表は値を定めない）`);
  registerRestore(
    `試験のイベント「${名}」(ID ${id})`,
    { 作ったイベント: 名, 番号: id },
    async () => { await 管理画面(browser, (page) => deleteEvent(page, id), イベント登録者.account); },
  );
  return id;
}

// ---------------------------------------------------------------------------
// デッキ
// ---------------------------------------------------------------------------

/** フォーマットごとに1件、デッキ登録に要るアーキタイプ（公開）を登録して名前を返す（新しいフォーマットにはアーキタイプが無い） */
export async function 試験アーキタイプを登録する(browser: Browser, フォーマット名: string, issue: Issue): Promise<string> {
  return 管理画面(browser, (page) => アーキタイプを登録する(page, { 名日: `${フォーマット名}-ARCHETYPE`, 名英: `${フォーマット名}-ARCHETYPE`, フォーマット: rc(フォーマット名) }, issue));
}

export type 試験デッキ = {
  フォーマット名: string; アーキタイプ: string; 公開: boolean; イベント名: string; 開催日: string;
  メイン: [number, string][];
};

/** デッキ編集（新規登録）でイベントデッキを登録し、デッキIDを返す（イベント名・カード名は実行の印つきで入る） */
export async function 試験デッキを登録する(browser: Browser, v: 試験デッキ, issue: Issue): Promise<string> {
  return 管理画面(browser, (page) => デッキを登録する(page, {
    デッキタイプ: "イベントデッキ", フォーマット: rc(v.フォーマット名), アーキタイプ名: v.アーキタイプ, 公開: v.公開 ? "公開" : "非公開",
    イベント名日: v.イベント名, イベント名英: v.イベント名, 開催日: `${v.開催日.replace(/-/g, "/")} 12:00`,
    メイン: v.メイン.map(([枚数, カード名]) => ({ 枚数, カード名 })),
  }, issue));
}

/** デッキを登録し終えたフォーマットに「ランキング表示」を入れる */
export async function ランキング表示を入れる(browser: Browser, seedId: string, ids: string[], issue: Issue): Promise<void> {
  await 管理画面(browser, async (page) => { for (const id of ids) await ランキング表示を設定する(page, id, true, seedId, issue); });
}
