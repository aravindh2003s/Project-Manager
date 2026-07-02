"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var user, workspace, project;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Seeding database...');
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'demo@example.com' },
                            update: {},
                            create: {
                                email: 'demo@example.com',
                                name: 'Demo User',
                                password: 'hashed_password_here', // In real app, hash this!
                            },
                        })];
                case 1:
                    user = _a.sent();
                    console.log('Created user:', user.name);
                    return [4 /*yield*/, prisma.workspace.create({
                            data: {
                                name: 'Personal Projects',
                                ownerId: user.id,
                                members: {
                                    create: {
                                        userId: user.id,
                                        role: 'ADMIN',
                                    },
                                },
                            },
                        })];
                case 2:
                    workspace = _a.sent();
                    console.log('Created workspace:', workspace.name);
                    return [4 /*yield*/, prisma.project.create({
                            data: {
                                name: 'Antigravity PMS',
                                description: 'Building the best project management tool.',
                                workspaceId: workspace.id,
                                columns: {
                                    create: [
                                        { name: 'To Do', order: 0 },
                                        { name: 'In Progress', order: 1 },
                                        { name: 'Done', order: 2 },
                                    ],
                                },
                            },
                        })];
                case 3:
                    project = _a.sent();
                    console.log('Created project:', project.name);
                    // Create some tasks
                    return [4 /*yield*/, prisma.task.create({
                            data: {
                                title: 'Setup Environment',
                                status: 'DONE',
                                projectId: project.id,
                                createdById: user.id,
                            },
                        })];
                case 4:
                    // Create some tasks
                    _a.sent();
                    return [4 /*yield*/, prisma.task.create({
                            data: {
                                title: 'Build UI',
                                status: 'IN_PROGRESS',
                                projectId: project.id,
                                createdById: user.id,
                            },
                        })];
                case 5:
                    _a.sent();
                    console.log('Seeding finished.');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
