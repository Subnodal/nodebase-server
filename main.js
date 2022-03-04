#!/usr/bin/env node

/*
    Nodebase

    Copyright (C) Subnodal Technologies. All Rights Reserved.

    https://subnodal.com
    Licenced by the Subnodal Open-Source Licence, which can be found at LICENCE.md.
*/

const yargs = require("yargs");
const express = require("express");
const bodyParser = require("body-parser");

var package = require("./package.json");
var users = require("./users");
var projects = require("./projects");

var app = express();

function authenticate(request, response, next) {
    var authHeader = request.header("authorization")?.split(" ") || [];

    if (authHeader[0] != "NameKey" || authHeader.length != 3) {
        response.json({status: "error", code: "invalidAuth", message: "The authentication header \`Authorization\` is missing or incorrectly formatted"});
        response.status(400);

        return;
    }

    if (!users.authenticate(authHeader[1], authHeader[2])) {
        response.json({status: "error", code: "failedAuth", message: "Failed to authenticate with the given username and auth key"});
        response.status(401);

        return;
    }

    request.username = authHeader[1];

    next();
}

function checkProjectExists(request, response, next) {
    if (projects.get(request.params.projectId) == null) {
        response.json({status: "error", code: "nonexistentProject", message: "The requested project does not exist"});
        response.status(404);

        return;
    }

    next();
}

function checkProjectAccess(level = "read") {
    const levels = [
        "read",
        "write",
        "admin"
    ];

    return function(request, response, next) {
        var users = projects.get(request.params.projectId).users || {};
        var userRole = users[request.username]?.role || null;

        if (userRole == null) {
            response.json({status: "error", code: "permissionDenied", message: "The user does not have access to the requested project"});
            response.status(403);

            return;
        }

        if (levels.indexOf(userRole) < levels.indexOf(level)) {
            response.json({status: "error", code: "permissionDenied", message: "The user does not have sufficient permissions to perform the requested action"});
            response.status(403);

            return;
        }

        next();
    };
}

users.init();
projects.init();

app.get("/", function(request, response) {
    response.json({nodebase: package.version});
});

app.post("/createUser", bodyParser.json(), function(request, response) {
    if (typeof(request.body.username) != "string" || typeof(request.body.authKey) != "string") {
        response.json({status: "error", code: "invalidCreateUser", message: "Both a username and auth key must be provided"});
        response.status(400);

        return;
    }

    if (!request.body.username.match(/^[a-zA-Z0-9-_]{3,30}$/)) {
        response.json({status: "error", code: "invalidCreateUser", message: "The given username does not match the username registration requirements"});
        response.status(400);

        return;
    }

    if (!request.body.authKey.match(/^[a-zA-Z0-9-_]{16,64}$/)) {
        response.json({status: "error", code: "invalidCreateUser", message: "The given authentication key does not match the authentication key requirements"});
        response.status(400);

        return;
    }

    if (users.get(request.body.username) != null) {
        response.json({status: "error", code: "usernameAlreadyExists", message: "The given username already belongs to a registered user"});
        response.status(400);

        return;
    }

    users.create(request.body.username, request.body.authKey);

    response.json({status: "success"});
});

app.get("/projects", authenticate, function(request, response) {
    response.json({projects: projects.getUserProjects(request.username) || []});
});

app.get("/projects/:projectId", authenticate, checkProjectExists, checkProjectAccess("read"), function(request, response) {
    response.json(projects.get(request.params.projectId));
});

app.post("/createProject", authenticate, bodyParser.json(), function(request, response) {
    if (typeof(request.body.projectId) != "string" || typeof(request.body.projectName) != "string") {
        response.json({status: "error", code: "invalidCreateProject", message: "Both a project ID and project name must be provided"});
        response.status(400);

        return;
    }

    if (!request.body.projectId.match(/^[a-zA-Z0-9-_]{3,30}$/)) {
        response.json({status: "error", code: "invalidCreateProject", message: "The given project ID does not match the project ID registration requirements"});
        response.status(400);

        return;
    }

    if (request.body.projectName.length > 100) {
        response.json({status: "error", code: "invalidCreateProject", message: "The given project name does not match the project name requirements"});
        response.status(400);

        return;
    }

    if (projects.get(request.body.projectId) != null) {
        response.json({status: "error", code: "projectAlreadyExists", message: "The given project ID already belongs to a registered project"});
        response.status(400);

        return;
    }

    projects.create(request.username, request.body.projectId, request.body.projectName);

    response.json({status: "success"});
});

app.listen(8000, function() {
    console.log("Listening");
});