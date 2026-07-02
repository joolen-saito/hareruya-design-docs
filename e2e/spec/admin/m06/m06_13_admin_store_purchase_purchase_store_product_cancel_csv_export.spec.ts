/**
 * 管理画面 店頭買取管理「買取商品一覧（キャンセル）CSV出力」E2E（M06-13）。
 * 納品ケース表 integration_test/e2e/m06_13_admin_store_purchase_purchase_store_product_cancel_csv_export_e2e_cases.md に対応。
 *
 * 【重要】screenExists=false（刷新先未実装・Ph2）:
 *  本機能は基本設計仕様書で Ph2 対応・Ph1 未実装と明記された新規機能で、刷新先 ec-cube-enterprise に
 *  「キャンセル数CSV」の route／Twig／Form が存在しない（OTCのCSV出力は old_goods_account /
 *  otc_buy_order_product_list[在庫増減数] / otc_buy_order_restock_list_csv の3種のみ＝
 *  OtcBuyOrderCsvExportService.php:33-78）。実行可能な自動E2Eは0件である。
 *
 *  規約「手動/対象外はケース表で全量管理し spec に大量 fixme を残さない」に従い、本 spec には
 *  ケース別 fixme を列挙しない。テストID（E2E-M06-13-001〜022）・自動/手動/対象外の区分・仕様根拠・
 *  Ph2再分類方針は、すべてケース表（付帯表1/2/2b/5）で全量管理する。
 *  spec には未実装の事実を示す単一の test.fixme（将来対応の入口）のみを残す。
 *
 * 期待結果は仕様（基本設計仕様書／観点表）由来（オラクル独立性）。実装の現挙動・Form制約・Cookie名・
 *  Content-Type値などはオラクル化しない。Ph2実装後に確定 route／Twig file:line 根拠セレクタで
 *  付帯表1の各テストIDを csv_export パターン（ダウンロード発火・応答ヘッダ・ファイル名・未選択エラー・
 *  未認証ガード）でE2E自動化／CSV中身は手動、へ再分類して実装する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 */
import { test } from "@playwright/test";

test.describe(
  "管理画面 店頭買取管理 > 買取商品一覧（キャンセル）CSV出力",
  { tag: ["@admin", "@store_purchase", "@csv"] },
  () => {
    // 刷新先 ec-cube-enterprise 未実装（Ph2）のため自動E2Eは存在しない。
    // 全テストID（Ph2出力ケース 001-013/020-022・現挙動手動 030/031）の区分・根拠・Ph2再分類方針は
    // ケース表（付帯表1/2/2b/5）で全量管理する。現挙動確認 030/031 は既存OTC画面で観測可能な手動ケース。
    test.fixme(
      "E2E-M06-13 買取商品（キャンセル）CSVは刷新先未実装（Ph2）。実装後にケース表 001-013/020-022 をE2E自動化／手動へ再分類する（現挙動 030/031 は手動）",
      async () => {
        // 未実装のため本文なし。Ph2実装後に付帯表1のテストIDを csv_export パターンで実装する。
      }
    );
  }
);
