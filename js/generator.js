import { getById, writeInfo } from "./common.js"

function generateBsn() {
    const nr9 = Math.floor(Math.random() * 7);
    const nr8 = Math.floor(Math.random() * 10);
    const nr7 = Math.floor(Math.random() * 10);
    const nr6 = Math.floor(Math.random() * 10);
    const nr5 = Math.floor(Math.random() * 10);
    const nr4 = Math.floor(Math.random() * 10);
    const nr3 = Math.floor(Math.random() * 10);
    let nr2 = Math.floor(Math.random() * 10);
    const bsnNumber = 9 * nr9 + 8 * nr8 + 7 * nr7 + 6 * nr6 + 5 * nr5 + 4 * nr4 + 3 * nr3 + 2 * nr2;
    let nr1 = Math.floor(bsnNumber - (Math.floor(bsnNumber / 11)) * 11);
    if (nr1 > 9) {
        if (nr2 > 0) {
            nr2 -= 1;
            nr1 = 8;
        }
        else {
            nr2 += 1;
            nr1 = 1;
        }
    }

    const BSNString = '' + nr9 + nr8 + nr7 + nr6 + nr5 + nr4 + nr3 + nr2 + nr1;
    writeInfo("BSN: " + BSNString);
}

const gen_bsn = getById("bsn");
gen_bsn.addEventListener("click", generateBsn);

// function generateIban() {

// }

// const gen_iban = getById("iban");
// gen_iban.addEventListener("click", generateIban);
