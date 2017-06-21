var express = require('express');
var router = express.Router();
var models = require('../../models');
var validator = require('validator');
var algorithm = require('ape-algorithm');
var utils = require('../../utils/page');
var str = require('../../utils/str');
var token = require('../../utils/token');
var response = require('../../utils/response');
var config = require('../../config/config');
var co = require('co');

var Devicetoken = {
    add_devicetoken: function (req, res) {
        var memberphone = req.body.memberphone;
        var devicetoken = req.body.devicetoken;
        var device = req.body.device;
        var memberid = req.body.memberid;
        if (!memberphone) {
            return response.ApiError(res, {message: "member phone empty"});
        }
        if (!devicetoken) {
            return response.ApiError(res, {message: "device token empty"});
        }
        if (!device) {
            return response.ApiError(res, {message: "device model empty"});
        }
        if(!memberid){
            return response.ApiError(res, {message: "member id empty"});
        }
        models.Devicetoken.create({
            mdt_memberphone: memberphone,
            mdt_devicetoken: devicetoken,
            mdt_devicemodel: device,
            mdt_member:memberid

        }).then(function () {
            return response.ApiSuccess(res, {})
        }, function (err) {
            return response.ApiError(res, {message: err.message});
        })
    }
};
module.exports = Devicetoken;