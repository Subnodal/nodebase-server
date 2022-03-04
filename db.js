/*
    Nodebase

    Copyright (C) Subnodal Technologies. All Rights Reserved.

    https://subnodal.com
    Licenced by the Subnodal Open-Source Licence, which can be found at LICENCE.md.
*/

var projects = require("./projects");

exports.PROJECT_SAVE_INTERVAL = 10 * 60 * 1_000; // 10 minutes

exports.openDatabases = {};

exports.init = function() {
    setInterval(function() {
        Object.keys(exports.openDatabases).forEach(function(projectId) {
            exports.save(projectId);
        });
    }, exports.PROJECT_SAVE_INTERVAL);
};

exports.traverse = function(object, path) {
    if (path.length == 0) {
        return object;
    }

    if (object == null || typeof(object) != "object") {
        return null;
    }

    var property = path.pop();

    if (!object.hasOwnProperty(property)) {
        object[property] = {};
    }

    return exports.traverse(object[property], path);
};

exports.open = function(projectId) {
    if (exports.openDatabases.hasOwnProperty(projectId)) {
        return;
    }

    exports.openDatabases[projectId] = projects.readFile(projectId, "database.bson", {});
};

exports.save = function(projectId) {
    projects.writeFile(projectId, "database.bson", exports.openDatabases[projectId]);
};

exports.get = function(projectId, path) {
    exports.open(projectId);

    return exports.traverse(exports.openDatabases[projectId], path);
};

exports.set = function(projectId, path, data) {
    exports.open(projectId);

    if (path.length == 0) {
        exports.openDatabases[projectId] = data;

        return;
    }

    var property = path.pop();

    exports.traverse(exports.openDatabases[projectId], path)[property] = data;
};

exports.delete = function(projectId, path) {
    exports.open(projectId);

    if (path.length == 0) {
        exports.openDatabases[projectId] = {};

        return;
    }

    var property = path.pop();

    delete exports.traverse(exports.openDatabases[projectId], path)[property];
};