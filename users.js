/*
    Nodebase

    Copyright (C) Subnodal Technologies. All Rights Reserved.

    https://subnodal.com
    Licenced by the Subnodal Open-Source Licence, which can be found at LICENCE.md.
*/

var storage = require("./storage");

exports.USER_FILE = "users.bson";

exports.users = {};

exports.init = function() {
    exports.users = storage.read(exports.USER_FILE);
};

exports.save = function() {
    storage.write(exports.USER_FILE, exports.users);
};

exports.get = function(username) {
    return exports.users[username] || null;
};

exports.authenticate = function(username, authKey) {
    return exports.users[username]?.authKey == authKey;
};

exports.create = function(username, authKey) {
    exports.users[username] = {authKey};

    exports.save();
};