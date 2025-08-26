#!/bin/bash

mkdir -p "www"

header=$(<"templates/header.html")
footer=$(<"templates/footer.html")


for filename in ./pages/*.html; do
    base_name=$(basename ${filename})
    file_content=$(cat "$filename" \
        | sed 's/__nav \(.*\)__/\n<nav>\n    <ul>\n        <li><a href="\/">MB.bes.is<\/a><\/li>\n        <li>\1<\/li>\n    <\/ul>\n<\/nav>/')
    (echo "$header\
    " "$file_content\
    " "$footer" ) > "www/$base_name"
done

for filename in ./js/*.js; do
    base_name=$(basename ${filename})
    # TODO minify?
    cp "$filename" "www/$base_name"
done

for filename in ./css/*.css; do
    base_name=$(basename ${filename})
    cp "$filename" "www/$base_name"
done

#spotify

mkdir -p "www/spotify"

for filename in ./pages/spotify/*.html; do
    base_name=$(basename ${filename})
    cp "$filename" "www/spotify/$basename"
done

for filename in ./js/spotify/*.js; do
    base_name=$(basename ${filename})
    cp "$filename" "www/spotify/$basename"
done