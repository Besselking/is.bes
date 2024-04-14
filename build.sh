#!/bin/bash
header=$(cat "templates/header.html" \
    | sed '/__style__/ {
        s/__style__/<style>/g
        r css/reset.css
        r css/style.css
        a\
        </style>
    }')
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