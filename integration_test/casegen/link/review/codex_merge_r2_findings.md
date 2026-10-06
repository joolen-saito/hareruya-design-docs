### 指摘1（重大度: Minor）対象: IT-F05-06-052〜058
主張: テストIDの振り直しに合わせ、ケース専用シードの参照も新テストIDへ整合した。
実際: 旧L001〜L007は新052〜058へ割り当てられ、ケースも対応する末尾052〜058のシードを使用している（integration_test/casegen/link/merged_map.tsv:36〜42、integration_test/casegen/cases/F05-06_test_cases.tsv:50〜56）。しかし、各シードの用途欄は旧番号のまま「ケース001専用」〜「ケース007専用」となっている（integration_test/casegen/cases/F05-06_seed_data.tsv:63〜69）。
判定: 参照の不一致
修正案: 用途欄をそれぞれ「IT-F05-06-052専用」〜「IT-F05-06-058専用」に直す。
