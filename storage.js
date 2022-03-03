/*
    Nodebase

    Copyright (C) Subnodal Technologies. All Rights Reserved.

    https://subnodal.com
    Licenced by the Subnodal Open-Source Licence, which can be found at LICENCE.md.
*/

const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");
const BSON = require("bson");

exports.read = function(file, fallback = {}) {
    if (fs.existsSync(file)) {
        try {
            return BSON.deserialize(fs.readFileSync(file));
        } catch (e) {
            console.warn(`Unable to parse stored file at path \`${file}\`:`, e);
        }
    }

    return fallback;
};

exports.write = function(file, data) {
    mkdirp.sync(path.dirname(file), {parent: true});

    fs.writeFileSync(file, BSON.serialize(data));
};