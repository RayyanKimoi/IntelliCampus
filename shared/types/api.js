"use strict";
// ========================
// API Types
// ========================
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseType = exports.MessageSender = exports.AIMode = void 0;
// AI Chat types
var AIMode;
(function (AIMode) {
    AIMode["LEARNING"] = "learning";
    AIMode["ASSESSMENT"] = "assessment";
    AIMode["PRACTICE"] = "practice";
})(AIMode || (exports.AIMode = AIMode = {}));
var MessageSender;
(function (MessageSender) {
    MessageSender["STUDENT"] = "student";
    MessageSender["AI"] = "ai";
})(MessageSender || (exports.MessageSender = MessageSender = {}));
var ResponseType;
(function (ResponseType) {
    ResponseType["EXPLANATION"] = "explanation";
    ResponseType["HINT"] = "hint";
    ResponseType["RESTRICTED"] = "restricted";
})(ResponseType || (exports.ResponseType = ResponseType = {}));
//# sourceMappingURL=api.js.map