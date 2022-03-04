/*
    Nodebase

    Copyright (C) Subnodal Technologies. All Rights Reserved.

    https://subnodal.com
    Licenced by the Subnodal Open-Source Licence, which can be found at LICENCE.md.
*/

var storage = require("./storage");

exports.PROJECTS_LIST_FILE = "projects.bson";
exports.PROJECTS_DIR = "projects";

exports.projectsList = {};

exports.init = function() {
    exports.projectsList = storage.read(exports.PROJECTS_LIST_FILE);
};

exports.save = function() {
    storage.write(exports.PROJECTS_LIST_FILE, exports.projectsList);
};

exports.get = function(projectId) {
    return exports.projectsList[projectId] || null;
};

exports.getUserProjects = function(username) {
    return Object.keys(exports.projectsList).filter(function(projectId) {
        return exports.projectsList[projectId].users?.hasOwnProperty(username);
    });
};

exports.create = function(owner, projectId, projectName) {
    exports.projectsList[projectId] = {
        users: {},
        projectName
    };

    exports.projectsList[projectId].users[owner] = {
        role: "admin"
    };

    exports.save();
};