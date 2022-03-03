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
    response.json({projects: users.get(request.username).projects || []});
});

app.listen(8000, function() {
    console.log("Listening");
});