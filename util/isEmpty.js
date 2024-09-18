"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const fs_1 = require("fs");
function default_1(directory) {
    if (!(0, fs_1.existsSync)(directory))
        return true;
    let files = (0, fs_1.readdirSync)(directory);
    if (files.length <= 0) {
        return true;
    }
    return false;
}
