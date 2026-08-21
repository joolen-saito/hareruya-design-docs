# 同一機能内の重複指摘 候補

対象: `drift_findings_list_effort.tsv` 1034件 / 258機能

同一 `機能No` 内の全ペアについて、`設計期待値`＋`実装実態`＋`差分内容` を正規化し
文字2-gram の Jaccard／包含率で類似度を出した。**機械検出であり重複と断定していない。**

| 判定 | しきい値 | ペア数 |
|---|---|---:|
| 完全一致 | 正規化後の本文が同一 | 0 |
| ほぼ同一 | 0.85以上 | 24 |
| 高類似 | 0.65以上 | 38 |
| 要確認 | 0.50以上 | 78 |
| 同一箇所 | 類似度は低いが同じ file:line を同じ観点で指す | 4 |
| **計** | | **144** |

0.65以上で連結したクラスタ: 51件 / 関与行 111件

明細: `DUPLICATE_CANDIDATES.tsv`

## 重複の出どころ（0.65以上のペア）

| 設計書参照の関係 | ペア数 |
|---|---:|
| 同一HTML別シート | 39 |
| 同一シート | 19 |
| 別HTML | 4 |

うち `設計期待値` が完全一致: 7ペア / 同一 `file:line` を指す: 33ペア

## 0.65以上のペア

| 機能No | 類似度 | 判定 | 行A | 行B | 指摘区分 | 期待値一致 | 設計書関係 | 共通ファイル | 工数A | 工数B |
|---|---:|---|---:|---:|---|---|---|---|---:|---:|
| B02-03 | 1.000 | ほぼ同一 | 144 | 150 | 実装違い/実装違い | Y | 別HTML | BatchAggregateStockUpAction.php | 0.5 | 0.5 |
| M04-01 | 1.000 | ほぼ同一 | 433 | 444 | 実装違い/実装違い | Y | 同一HTML別シート | StockListController.php |  |  |
| M04-01 | 1.000 | ほぼ同一 | 436 | 443 | 実装違い/実装違い | Y | 同一HTML別シート | stock_list_index.twig |  |  |
| M04-22 | 1.000 | ほぼ同一 | 520 | 523 | 未実装/未実装 | Y | 同一HTML別シート | StockMoveTransferController.php,index.tw | 0.5 | 0.5 |
| M08-05 | 1.000 | ほぼ同一 | 644 | 648 | 実装違い/未実装 | Y | 同一HTML別シート | CustomerPointController.php,point_update | 0.25 | 0.25 |
| M12-01 | 1.000 | ほぼ同一 | 767 | 771 | 未実装/実装違い | Y | 同一HTML別シート | DtbDailySummaryRepository.php | 0.5 | 0.5 |
| M12-03 | 1.000 | ほぼ同一 | 784 | 789 | 実装違い/実装違い | Y | 同一HTML別シート | OrderItemRepository.php | 0 | 0 |
| A05-01 | 0.950 | ほぼ同一 | 23 | 33 | 未実装/未実装 |  | 同一シート |  | 0.75 |  |
| M04-01 | 0.950 | ほぼ同一 | 433 | 437 | 実装違い/実装違い |  | 同一シート | StockListController.php |  |  |
| M05-26 | 0.950 | ほぼ同一 | 581 | 584 | 実装違い/未実装 |  | 同一HTML別シート | OrderCsvController.php | 0.25 | 0.0 |
| M08-05 | 0.945 | ほぼ同一 | 641 | 644 | 未実装/実装違い |  | 同一HTML別シート | CustomerPointController.php,point_update | 0.25 | 0.25 |
| M08-05 | 0.945 | ほぼ同一 | 641 | 648 | 未実装/未実装 |  | 同一HTML別シート | CustomerPointController.php,point_update | 0.25 | 0.25 |
| M12-05 | 0.932 | ほぼ同一 | 795 | 796 | 未実装/未実装 |  | 同一HTML別シート | ProductRequestController.php | 0.1 | 0.1 |
| M08-02 | 0.931 | ほぼ同一 | 632 | 634 | 実装違い/実装違い |  | 同一HTML別シート | CustomerMailController.php,DtbUserMailHi | 0.3 | 0.3 |
| A05-01 | 0.928 | ほぼ同一 | 27 | 33 | 実装違い/未実装 |  | 同一シート |  | 1.0 |  |
| M04-23 | 0.923 | ほぼ同一 | 530 | 534 | 実装違い/未実装 |  | 同一HTML別シート | CsvImporter.php,StockSplitJoinController | 0.5 | 0.5 |
| M05-19 | 0.919 | ほぼ同一 | 575 | 577 | 実装違い/実装違い |  | 同一シート | index.twig | 0.25 | 0.0 |
| M14-07 | 0.888 | ほぼ同一 | 928 | 933 | 未実装/未実装 |  | 同一HTML別シート |  | 1.5 | 1.0 |
| A05-01 | 0.882 | ほぼ同一 | 26 | 34 | 実装違い/実装違い |  | 同一シート | OrderController.php | 0.25 | 0 |
| M08-02 | 0.878 | ほぼ同一 | 630 | 634 | 実装違い/実装違い |  | 同一HTML別シート | CustomerMailController.php,DtbUserMailHi | 0.4 | 0.3 |
| M04-22 | 0.875 | ほぼ同一 | 521 | 524 | 実装違い/実装違い |  | 同一HTML別シート | AbstractController.php,StockMoveTransfer | 0.25 | 0.5 |
| M15-08 | 0.870 | ほぼ同一 | 986 | 992 | 実装違い/実装違い |  | 同一HTML別シート | SearchDeckType.php |  |  |
| B02-07 | 0.867 | ほぼ同一 | 166 | 173 | 未実装/実装違い |  | 別HTML | BatchUpdateWeeklyStockHistoryAction.php | 0 | 0 |
| M12-03 | 0.864 | ほぼ同一 | 783 | 787 | 未実装/実装違い |  | 同一HTML別シート | SalesAnalysisController.php,sales.twig | 0.5 | 0.5 |
| M06-01 | 0.846 | 高類似 | 592 | 593 | 実装違い/実装違い |  | 同一シート | DtbOtcBuyOrderRepository.php,OtcBuyOrder | 0.5 | 0.5 |
| A05-01 | 0.840 | 高類似 | 22 | 29 | 実装違い/未実装 |  | 同一シート | OrderController.php | 0 | 0 |
| M15-06 | 0.838 | 高類似 | 976 | 983 | 未実装/未実装 |  | 同一HTML別シート | csv_import.twig | 0.0 | 0.0 |
| M12-07 | 0.833 | 高類似 | 800 | 803 | 実装違い/実装違い |  | 同一HTML別シート | FormatSalesController.php | 0.1 | 0.1 |
| M07-05 | 0.828 | 高類似 | 622 | 623 | 実装違い/実装違い |  | 同一シート | DtbBuyOrderRepository.php | 0.15 | 0.15 |
| A05-01 | 0.825 | 高類似 | 25 | 31 | 未実装/未実装 |  | 同一シート | OrderController.php | 0.5 | 0.5 |
| M08-02 | 0.821 | 高類似 | 630 | 632 | 実装違い/実装違い |  | 同一HTML別シート | CustomerMailController.php,DtbUserMailHi | 0.4 | 0.3 |
| M08-05 | 0.816 | 高類似 | 647 | 650 | 実装違い/実装違い |  | 同一HTML別シート | CustomerPointController.php,messages.ja. | 0 | 0 |
| M12-02 | 0.814 | 高類似 | 779 | 780 | 実装違い/実装違い |  | 同一シート | DtbDailySummaryRepository.php | 2.0 | 2.0 |
| M03-16 | 0.805 | 高類似 | 386 | 387 | 未実装/実装違い |  | 同一HTML別シート | StorageCodeController.php,storage_code.t | 0.15 | 0.15 |
| M04-01 | 0.799 | 高類似 | 434 | 439 | 実装違い/実装違い |  | 同一HTML別シート | StockListController.php | 0 | 0 |
| M05-19 | 0.777 | 高類似 | 574 | 577 | 実装違い/実装違い |  | 同一シート | index.twig | 0.1 | 0.0 |
| M12-04 | 0.763 | 高類似 | 792 | 794 | 実装違い/実装違い |  | 同一HTML別シート | OrderItemRepository.php | 0.25 | 0.25 |
| M08-08 | 0.750 | 高類似 | 659 | 666 | 未実装/実装違い |  | 同一HTML別シート | mail_manual.twig |  |  |
| M15-06 | 0.750 | 高類似 | 973 | 976 | 未実装/未実装 |  | 同一HTML別シート | csv_import.twig | 0.25 | 0.0 |
| M12-01 | 0.740 | 高類似 | 768 | 772 | 実装違い/実装違い |  | 同一HTML別シート | DtbDailySummaryRepository.php | 1.5 | 1.0 |
| F06-01 | 0.737 | 高類似 | 279 | 280 | 実装違い/実装違い |  | 同一シート | index.twig,messages.ja.yaml | 0.1 | 0.1 |
| A06-16 | 0.732 | 高類似 | 92 | 94 | 実装違い/実装違い |  | 同一シート | OtcBuyOrderController.php | 0.5 | 0.25 |
| B02-03 | 0.732 | 高類似 | 141 | 148 | 実装違い/未実装 |  | 別HTML | AggregateStockUpCommand.php | 0.25 | 0.25 |
| M03-33 | 0.728 | 高類似 | 415 | 418 | 未実装/未実装 |  | 同一HTML別シート | ProductClassRepository.php,ProductSaleHi |  |  |
| M03-13 | 0.717 | 高類似 | 383 | 384 | 実装違い/実装違い |  | 同一シート |  | 0.5 | 0.5 |
| M12-01 | 0.717 | 高類似 | 764 | 766 | 実装違い/未実装 |  | 同一HTML別シート | AnalysisSummaryBuilder.php,DtbDailySumma | 1.5 | 1.5 |
| M07-05 | 0.712 | 高類似 | 619 | 620 | 実装違い/実装違い |  | 同一HTML別シート | BuyOrderProductListCsvExportService.php | 0.15 | 0.1 |
| M13-13 | 0.712 | 高類似 | 871 | 881 | 未実装/未実装 |  | 同一HTML別シート | EventEntryBulkCsvController.php | 0.75 | 0.75 |
| M14-01 | 0.712 | 高類似 | 895 | 902 | 実装違い/実装違い |  | 同一HTML別シート | SearchCardType.php | 0.1 | 0.1 |
| M08-05 | 0.711 | 高類似 | 643 | 649 | 実装違い/実装違い |  | 同一HTML別シート | Customer.php,CustomerPointController.php | 0.5 | 0.5 |
| B02-07 | 0.708 | 高類似 | 164 | 172 | 未実装/実装違い |  | 別HTML | UpdateWeeklyStockHistoryCommand.php | 0.75 | 0.75 |
| M13-01 | 0.702 | 高類似 | 816 | 822 | 実装違い/未実装 |  | 同一HTML別シート | DtbEventRepository.php,index.twig | 1.0 | 1.0 |
| A05-04 | 0.700 | 高類似 | 41 | 53 | 未実装/実装違い |  | 同一シート | WebhookController.php | 0 | 0 |
| M03-31 | 0.691 | 高類似 | 406 | 408 | 未実装/未実装 |  | 同一HTML別シート | ProductPriceCsvController.php | 0.1 | 0.1 |
| M03-28 | 0.690 | 高類似 | 400 | 401 | 実装違い/実装違い |  | 同一HTML別シート | ProductRepository.php | 1.5 | 1.5 |
| A06-16 | 0.676 | 高類似 | 93 | 96 | 実装違い/実装違い |  | 同一シート |  | 4.0 |  |
| M05-26 | 0.672 | 高類似 | 584 | 590 | 未実装/実装違い |  | 同一シート |  | 0.0 | 0.25 |
| M08-08 | 0.667 | 高類似 | 661 | 671 | 実装違い/実装違い |  | 同一HTML別シート | MailHistoryEntityManager.php | 2.0 | 2.0 |
| M03-11 | 0.666 | 高類似 | 378 | 379 | 実装違い/実装違い |  | 同一シート | CategoryType.php,category.twig,messages. | 0.1 | 0.1 |
| M03-33 | 0.665 | 高類似 | 413 | 416 | 実装違い/未実装 |  | 同一HTML別シート | ProductSaleHighPriceCsvController.php,Sa |  |  |
| A05-01 | 0.663 | 高類似 | 22 | 34 | 実装違い/実装違い |  | 同一シート | OrderController.php | 0 | 0 |
| M12-03 | 0.656 | 高類似 | 785 | 788 | 未実装/未実装 |  | 同一HTML別シート | SalesAnalysisController.php | 0.5 | 0.5 |
