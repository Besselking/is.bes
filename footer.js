import { footer, ul, li, a } from "./common.js";

//usage: <script src="footer.js" type="module"></script>

const urls = [
    "index",
    "calc",
    "concat",
    "letterflixd",
];

document.querySelector('script[src="footer.js"]').replaceWith(footer(ul(...urls.map(url => li(a(`/${url}.html`))))));