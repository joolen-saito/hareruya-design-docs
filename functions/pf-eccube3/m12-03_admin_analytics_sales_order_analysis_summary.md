# M12-03（受注/売上分析 集計一覧表示）

## 業務ロジック

### 初期表示

保持していた検索条件を破棄し、使用日付に注文日、集計単位に商品、並び順に昇順を設定した検索フォームを表示する。集計結果は表示しない。

### 検索条件の保持

検索を実行すると、指定した検索条件をそのまま保持する。初期表示に戻ると保持していた条件は破棄される。

### 集計の対象範囲

| 条件 | 内容 |
| --- | --- |
| 集計日From | 指定した日時ちょうどを含めて、それ以降を集計する |
| 集計日To | 指定した日時ちょうどは含めず、その手前までを集計する |
| キャンセル済みの受注 | 使用日付にキャンセル日以外を選んだときは集計対象から除く。キャンセル日を選んだときは除かない |
| 注文日が入っていない受注 | 使用日付の選択にかかわらず集計対象から除く |
| カテゴリ | 指定したカテゴリだけでなく、その配下のカテゴリに属する商品も集計対象に含める |
| キーワード検索 | 半角スペース・全角スペース・カンマで区切って複数語を指定できる。すべての語を満たすものだけを対象とし、1語は検索対象のいずれかに部分一致すればよい |

### 絞り込みの適用単位

平均単価と数量による絞り込みは、集計後の行の値に対して判定する。明細1件ごとの値では判定しない。平均単価の判定は、表示時に切り捨てる前の値で行う。

### 集計のまとめ方

| 集計単位 | 内容 |
| --- | --- |
| 商品 | 受注明細に記録された商品コードでまとめる。商品名も受注時点で受注明細へ記録された名称を表示するため、その後に商品名を変更しても集計結果には反映されない |
| カテゴリ | カテゴリ名でまとめる。1つの商品が複数のカテゴリに属するときはカテゴリごとに重複して計上し、どのカテゴリにも属さない商品は集計されない |

### 集計値の算出

| 項目 | 内容 |
| --- | --- |
| 平均単価 | 金額合計を数量合計で割る。表示時に小数点以下を切り捨てる |
| 件数 | 同じ受注を重複して数えず、受注の数を数える |
| 並べ替え | 並べ替えに集計単位を選んだ場合は集計単位のキーで、注文数・金額・販売数を選んだ場合はその値で並べる |
| 表示件数 | 一覧は選んだ表示件数までで打ち切る。ページ送りは行わず、打ち切られた残りは表示されない |
| 合計行 | 打ち切ったあとの表示中の行だけを合算する。検索条件に該当する全行の合計ではない |

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 検索フォームで指定した検索条件 |
| 成功時出力 | 集計結果一覧と合計行を含む画面 |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M12-03-MSG-001 | 検索結果領域 | 検索条件に合致するデータが見つかりませんでした | 売上分析で有効な検索条件を指定して検索を実行し、集計結果が0件のとき | 売上分析画面に検索結果0件の表示をしたまま留まる |
| M12-03-MSG-002 | 検索結果領域 | 検索結果：%count%件が該当しました | 売上分析で有効な検索条件を指定して検索を実行したとき | 売上分析画面に検索結果件数を表示したまま留まる |
| M12-03-MSG-003 | 検索結果領域 | 検索条件を変えて、再度検索をお試しください | 売上分析で有効な検索条件を指定して検索を実行し、集計結果が0件のとき | 売上分析画面に検索結果0件の表示をしたまま留まる |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 初期表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/SalesController.php:30-36 |
| 検索条件の保持 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/SalesController.php:27 |
| 検索条件の保持 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/SalesController.php:60-62 |
| 集計の対象範囲 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/OrderDetailRepository.php:110-150 |
| 集計の対象範囲 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Util/SqlUtil.php:98-116 |
| 集計の対象範囲 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/OrderDetailRepository.php:151-157 |
| 絞り込みの適用単位 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/OrderDetailRepository.php:238-260 |
| 集計のまとめ方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/OrderDetailRepository.php:25-34 |
| 集計のまとめ方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/OrderDetailRepository.php:104-107 |
| 集計のまとめ方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/ShoppingService.php:482 |
| 集計値の算出 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/OrderDetailRepository.php:79-92 |
| 集計値の算出 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/OrderDetailRepository.php:262-300 |
| 集計値の算出 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Analysis/sales.twig:217-244 |
