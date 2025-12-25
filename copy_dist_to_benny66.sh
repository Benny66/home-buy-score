#!/bin/bash
# copy_dist_to_benny66.sh

# 源目录和目标目录
SOURCE_DIR="dist"
TARGET_DIR="benny66.github.io"

# 检查源目录是否存在
if [ ! -d "$SOURCE_DIR" ]; then
    echo "错误: 源目录 '$SOURCE_DIR' 不存在"
    sleep 2
    exit 1
fi

# 检查目标目录是否存在
if [ ! -d "$TARGET_DIR" ]; then
    echo "错误: 目标目录 '$TARGET_DIR' 不存在"
    sleep 2
    exit 1
fi

# 删除目标目录中的所有内容（包括README.md）
echo "正在清空目标目录..."

rm -rf "$TARGET_DIR"/*

# 拷贝dist目录下的所有内容到目标目录
echo "正在拷贝文件..."

cp -r "$SOURCE_DIR"/* "$TARGET_DIR/"

# 从当前目录移动README.md到目标目录（如果存在）
if [ -f "README.md" ]; then
    cp "README.md" "$TARGET_DIR/"
    echo "已从当前目录拷贝 README.md 文件到目标目录"
fi

echo "操作完成！dist目录内容已成功拷贝到 $TARGET_DIR，README.md 文件已从当前目录拷贝。"
sleep 3