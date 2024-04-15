#!/bin/bash

mkdir "www"

prefetching=$(find "./pages" "./js" -type f -print0 \
    | xargs -0 -I {} basename "{}" \
    | xargs -I {} echo "<link rel=\"prefetch\" href=\"{}\">\n\t")

header=$(cat "templates/header.html" \
    | sed '/__style__/ {
        s/__style__/<style>/g
        r css/reset.css
        r css/style.css
        a\
        </style>
    }' | sed "s,__prefetch__,$(echo $prefetching),g;s/\t/   /g")
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