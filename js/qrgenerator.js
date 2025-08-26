import { getById } from './common.js';
import {QRCode} from './qrcode.js';

var qrcode = new QRCode("qrcode",
        "https://bes.is/");

const input = getById("input");
input.oninput = () => {
    const value = input.value;
    qrcode.makeCode(value);
}