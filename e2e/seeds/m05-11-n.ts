/**
 * M05-11 受注情報編集のシード（価格差異・ポイントキャンセル・店頭販売用整理番号・連携の確認）。型は seeds/m05-11-f.ts と同じ。
 * 解釈:
 * - 連携管理者（RE-ADM）はシード表では商品の登録・入庫も行うが、商品の登録・入庫は共通の部品どおり M0511管理者A が行う（連携管理者のログインはケースで使う）。
 * - スマレジ連携の成功応答（RE-SMAREGI-NORMAL）は試験環境の起動時の設定で、画面から作れない。ケースは会員のポイント履歴の画面だけを確かめる。
 * - 店内注文専用の会員グループは名称に実行の印を付けて毎回登録し、会員の会員グループに選ぶ（正本は「すでにあればそれを使う」）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { M08CustomerGroupPage } from "../pages/admin/m08_customer_group";
import { changeClassPrices } from "../pages/admin/m04_17_seed_ops";
import { ensureMember, MemberInput } from "../pages/admin/member";
import { OrderEditPage, ポイントを付与する, 会員IDを一覧から読む, メールで受注を開く } from "../pages/admin/m05_11_order_edit";
import { 会員の累計, 整理番号の表示 } from "../pages/admin/m05_11_n";
import { 会員を用意する, 販売中の商品 } from "../pages/front/m05_11_order";
import { 管理画面で会員を整える } from "./m08-common";
import { 店舗Aの店名, 試験会員 } from "./m05-11";
import { 商品注文のシード } from "./m05-11-f";

export const M0511_RE_ADMIN: Account = { loginId: "m0511re_admin", password: "Passw0rd-M0511RE" };
const 単品 = (code: string, name: string, 入庫 = 10) => ({ code, name, 入庫: [{ 数量: 入庫, 仕入単価: "100" }] });

defineSeed("S-M05-11-RE-ENV", async () => { /* 店舗・在庫場所・受注ステータス・配送方法・支払方法は手元の環境にあるものを使う（S-M05-11-ENV と同じ確かめ） */ });
defineSeed("S-M05-11-RE-ADM", { needs: ["S-M05-11-ENV"] }, async ({ browser }) => {
  const shop = await 店舗Aの店名(browser);
  const v: MemberInput = {
    名前: "M0511連携管理者", 所属店舗: shop, ログインID: M0511_RE_ADMIN.loginId, メールアドレス: "m0511re_admin@example.test",
    パスワード: M0511_RE_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: shop, 編集可能店舗: [shop],
  };
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMember(page, v));
});
defineSeed("S-M05-11-RE-SMAREGI-NORMAL", async ({ seed }) => {
  console.log(`[${seed.シードID}] スマレジ連携の成功応答は試験環境の起動時の設定（画面から作らない）`);
});

// 010: 価格が購入後に変わった商品と、変わらない商品の受注
商品注文のシード("S-M05-11-PRICE-READ", {
  番号: "共有PRICE", メール前半: "m0511-shared-price",
  商品: [{ ...単品("PRICE-CHG", "価格変更商品"), 価格: "1000" }, { ...単品("PRICE-KEEP", "価格維持商品"), 価格: "800" }],
  注文: [{ code: "PRICE-CHG", 数量: 1 }, { code: "PRICE-KEEP", 数量: 1 }],
  注文後: async (browser, seedId) => {
    await withAdminSession(browser, SETUP_ADMIN, (page) => changeClassPrices(page, { 商品コード: rc("PRICE-CHG"), 商品名: rc("価格変更商品"), 価格: "1200", onIssue: (m) => reportSeedIssue(seedId, m) }));
  },
});

// 023: 使用ポイント100・付与ポイント50（小計1100・還元率5%・ポイント使用100）の受注
商品注文のシード("S-M05-11-CANCEL-023", {
  番号: "023", メール前半: "m0511-023", 商品: [], ポイント: 100,
  既存商品: () => 販売中の商品(1).map((商品ID) => ({ 商品ID, 数量: 2 })),
  // 数量2で小計1100（単価550）・ポイント還元率5・ポイント使用100（付与ポイントは(1100-100)×5÷100=50）
  整える: async (p) => { await p.先頭明細の価格("550"); await p.ポイント設定("5", "100"); },
});

/** 店内注文専用の会員グループを登録し、会員をそのグループにして、その会員で注文する（店頭販売用整理番号が振られる） */
async function 店内注文専用の会員(browser: Browser, seedId: string, 番号: string, notes: import("../lib/notes").Notes): Promise<void> {
  const m = 試験会員(`m0511-${番号}`);
  await 会員を用意する(browser, m);
  const groupName = rc(`M0511店内注文専用-${番号}`);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const g = new M08CustomerGroupPage(page);
    await g.open();
    await g.入れる({ 名称: groupName, 還元率: "0", 店内注文専用: true });
    const r = await g.登録する();
    if (!r.sent) throw new Error(`${seedId}: 会員グループ「${groupName}」の登録をブラウザの入力チェックが止めた`);
  });
  const 会員ID = await withAdminSession(browser, SETUP_ADMIN, (page) => 会員IDを一覧から読む(page, m.メール));
  await 管理画面で会員を整える(browser, 会員ID, async (edit) => {
    await edit.選ぶ("Player][CustomerGroup", groupName);
    await edit.登録する();
    const err = await edit.エラー文();
    if (err.length || (await edit.成功メッセージ()) === null) throw new Error(`${seedId}: 会員の会員グループ指定の保存に失敗: ${err.join(" / ")}`);
  });
  void notes;
}
function 整理番号つき(seedId: string, 番号: string, 手動履歴: boolean): void {
  商品注文のシード(seedId, {
    番号, メール前半: `m0511-${番号}`, 商品: [], 配送: "宅配便", 支払候補: ["*"],
    ...(手動履歴 ? { 整える: async (p: OrderEditPage) => { await p.note.fill("履歴作成用"); } } : {}),
    会員の用意: async (browser, sid, notes) => 店内注文専用の会員(browser, sid, 番号, notes),
    注文後: async (browser, _s, { 注文番号, notes }) => {
      const shop = await 店舗Aの店名(browser);
      const no = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
        const p = new OrderEditPage(page);
        await p.openByOrderNo(注文番号, shop);
        const v = await 整理番号の表示(page);
        if (!v) throw new Error(`${番号}: 受注情報編集画面に店頭販売用整理番号が出ない`);
        return v.文字;
      });
      notes.set(`〔店頭販売用整理番号-M0511-${番号}〕`, no);
    },
  });
}
整理番号つき("S-M05-11-SALESNO-104", "104", false);
整理番号つき("S-M05-11-HISTN-141", "141", true);

// 222〜224: 連携（キャンセルの在庫戻し・ポイント履歴・累計注文金額）
const 連携の控え = async (browser: Browser, 番号: string, notes: import("../lib/notes").Notes, 注文番号: string, m: { メール: string }): Promise<string> => {
  void 注文番号;
  const id = await withAdminSession(browser, SETUP_ADMIN, (page) => 会員IDを一覧から読む(page, m.メール));
  notes.set(`〔会員ID-M0511-${番号}〕`, id);
  return id;
};
商品注文のシード("S-M05-11-RE-STOCK-222", {
  番号: "RE001", 注文番号の呼び名: "〔注文番号-M0511-RE001〕", メール前半: "m0511-re001", 商品: [単品("RE0511-001-A", "連携キャンセル在庫履歴商品001")], 注文: [{ code: "RE0511-001-A", 数量: 3 }],
  注文後: async (browser, _s, { m, 注文番号, notes }) => { await 連携の控え(browser, "RE001", notes, 注文番号, m); },
});
商品注文のシード("S-M05-11-RE-PT-223", {
  番号: "RE002", 注文番号の呼び名: "〔注文番号-M0511-RE002〕", メール前半: "m0511-re002", 商品: [単品("RE0511-002-A", "連携キャンセルポイント商品002")], 注文: [{ code: "RE0511-002-A", 数量: 1 }],
  注文後: async (browser, _s, { m, 注文番号, notes }) => {
    const id = await 連携の控え(browser, "RE002", notes, 注文番号, m);
    await withAdminSession(browser, SETUP_ADMIN, (page) => ポイントを付与する(page, id, 50, 注文番号));
  },
});
商品注文のシード("S-M05-11-RE-AMT-224", {
  番号: "RE003", 注文番号の呼び名: "〔注文番号-M0511-RE003〕", メール前半: "m0511-re003", 商品: [単品("RE0511-003-A", "連携数量変更商品003")], 注文: [{ code: "RE0511-003-A", 数量: 2 }],
  注文後: async (browser, _s, { m, 注文番号, notes }) => { await 連携の控え(browser, "RE003", notes, 注文番号, m); },
  // シード作成の最後に、会員情報編集画面の累計注文金額を控える
  完了後: async (browser, _s, { notes }) => {
    const t = await withAdminSession(browser, SETUP_ADMIN, (page) => 会員の累計(page, notes.get("〔会員ID-M0511-RE003〕")));
    notes.set("〔累計注文金額-M0511-RE003〕", String(t.金額));
  },
});
