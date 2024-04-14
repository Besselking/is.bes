import { footer, ul, li, a } from "./common.js";

//usage: <script src="footer.js" type="module"></script>

const urls = [
    ["index", "Home"],
    ["calc", "Calculator"],
    ["concat", "Concatenator"],
    ["letterflixd", "Netflix to Letterboxd converter"],
];

document.querySelector('script[src="footer.js"]')
        .replaceWith(footer(ul(...urls.map(url => li(a(`/${url[0]}.html`, url[1]))))));