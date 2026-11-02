/** M05-11 受注情報編集のシード（共有・履歴・ポイントの紐づけ）。型は seeds/m05-11-f.ts と同じ */
import { rc } from "../lib/run_marker";
import { withAdminSession } from "../lib/session";
import { OrderEditPage, OrderItemsEdit, ポイントを付与する, 会員IDを一覧から読む } from "../pages/admin/m05_11_order_edit";
import { M0511_ADMIN_A, 店舗Aの店名 } from "./m05-11";
import { 商品注文のシード } from "./m05-11-f";

const 単品 = (code: string, name: string, 入庫 = 10) => ({ code, name, 入庫: [{ 数量: 入庫, 仕入単価: "100" }] });

// 通常の会員の注文（店頭販売用整理番号は振られない）
商品注文のシード("S-M05-11-SALESNO-105", { 番号: "105", メール前半: "m0511-105", 商品: [] });
// 在庫が足りない商品（在庫3→注文1で2）
商品注文のシード("S-M05-11-LOW-READ", { 番号: "共有LOW", メール前半: "m0511-shared-low", 商品: [単品("LOW-001", "在庫不足確認商品", 3)], 注文: [{ code: "LOW-001", 数量: 1 }] });
// ポイント履歴が注文に紐づく
商品注文のシード("S-M05-11-PTBACK-129", {
  番号: "129", メール前半: "m0511-129", 商品: [],
  整える: async (p) => { await p.ポイント設定("0", "0"); },
  状態: ["入金済み"],
  注文後: async (browser, _seedId, { m, 注文番号 }) => {
    await withAdminSession(browser, M0511_ADMIN_A, async (page) => {
      const id = await 会員IDを一覧から読む(page, m.メール);
      await ポイントを付与する(page, id, 920);
      await ポイントを付与する(page, id, 50, 注文番号);
      await ポイントを付与する(page, id, 30, 注文番号);
    });
  },
});
// 受注データ更新履歴
商品注文のシード("S-M05-11-HISTI-139", {
  番号: "139", メール前半: "m0511-139", 商品: [単品("M0511-139-ITM-OLD", "履歴商品（変更前）"), 単品("M0511-139-ITM-CUR", "履歴商品（現在）")], 注文: [{ code: "M0511-139-ITM-OLD", 数量: 3 }],
  注文後: async (browser, _s, { 注文番号 }) => {
    await withAdminSession(browser, M0511_ADMIN_A, async (page) => {
      const p = new OrderEditPage(page);
      await p.openByOrderNo(注文番号, await 店舗Aの店名(browser));
      const items = new OrderItemsEdit(page);
      // 正本は「追加→削除」の順。追加のあとに削除すると削除の確認が反映されないため、削除→追加の順にした（シードでの解釈）
      await items.削除を押す(rc("M0511-139-ITM-OLD"));
      await items.削除を確定する(rc("M0511-139-ITM-OLD"));
      await items.商品を追加する(rc("履歴商品（現在）"), rc("M0511-139-ITM-CUR"));
      await items.明細に入れる(rc("M0511-139-ITM-CUR"), { 数量: "1" });
      await p.受注情報を登録する(() => undefined);
    });
  },
});
商品注文のシード("S-M05-11-HISTE-144", {
  番号: "144", メール前半: "m0511-144", 商品: [単品("M0511-144-ITM", "履歴編集不可確認商品")], 注文: [{ code: "M0511-144-ITM", 数量: 3 }],
  整える: async (p, items) => { await items.明細に入れる(rc("M0511-144-ITM"), { 価格: "1000", 数量: "3" }); await p.note.fill("履歴作成用"); },
});
商品注文のシード("S-M05-11-HISTM-145", {
  番号: "145", メール前半: "m0511-145", 商品: [単品("M0511-145-ITM", "履歴欠品ボタン確認商品")], 注文: [{ code: "M0511-145-ITM", 数量: 2 }],
  整える: async (p) => { await p.note.fill("履歴作成用"); },
});
