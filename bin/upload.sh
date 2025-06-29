#!/bin/bash

set -euo pipefail

# 使用方法を表示する関数
show_usage() {
    echo "使用方法: $0 <S3_PATH>"
    echo ""
    echo "例:"
    echo "  $0 s3://my-bucket/source.zip"
    echo "  $0 s3://my-bucket/path/to/source.zip"
    echo ""
    echo "説明:"
    echo "  Git管理されているファイルをsource.zipにまとめて、指定したS3パスにアップロードします。"
    echo "  .gitignoreで除外されているファイルは含まれません。"
    exit 1
}

# 引数チェック
if [ $# -ne 1 ]; then
    echo "エラー: 引数が不正です。"
    show_usage
fi

S3_PATH="$1"

# S3パスの形式チェック
if [[ ! "$S3_PATH" =~ ^s3:// ]]; then
    echo "エラー: S3パスはs3://で始まる必要があります。"
    show_usage
fi

# Gitリポジトリかチェック
if [ ! -d ".git" ]; then
    echo "エラー: このディレクトリはGitリポジトリではありません。"
    exit 1
fi

# 一時ディレクトリを作成
TEMP_DIR=$(mktemp -d)
ZIP_FILE="$TEMP_DIR/source.zip"

# クリーンアップ関数
cleanup() {
    echo "一時ファイルをクリーンアップしています..."
    rm -rf "$TEMP_DIR"
}

# スクリプト終了時にクリーンアップを実行
trap cleanup EXIT

echo "Git管理されているファイルを収集しています..."

# git ls-filesでGit管理されているファイル一覧を取得し、zipに追加
# --exclude-standard で .gitignore の設定を考慮
git ls-files | zip -@ "$ZIP_FILE"

if [ ! -f "$ZIP_FILE" ]; then
    echo "エラー: ZIPファイルの作成に失敗しました。"
    exit 1
fi

# ZIPファイルのサイズを表示
ZIP_SIZE=$(du -h "$ZIP_FILE" | cut -f1)
echo "作成されたZIPファイルのサイズ: $ZIP_SIZE"

# ZIPファイルの内容を表示（オプション）
echo ""
echo "ZIPファイルに含まれるファイル一覧:"
unzip -l "$ZIP_FILE"

echo ""
echo "S3にアップロードしています: $S3_PATH"

# AWS CLIでS3にアップロード
if aws s3 cp "$ZIP_FILE" "$S3_PATH"; then
    echo "✅ アップロードが完了しました: $S3_PATH"
else
    echo "❌ アップロードに失敗しました。"
    echo "AWS CLIの設定とS3バケットへのアクセス権限を確認してください。"
    exit 1
fi

echo ""
echo "🎉 処理が正常に完了しました！"
