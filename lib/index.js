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
Object.defineProperty(exports, "__esModule", { value: true });
function docRefArrayFromCollectionRef(collection) {
    return __awaiter(this, void 0, void 0, function* () {
        const insertArr = [];
        return collection.get()
            .then((snapshot) => {
            snapshot.forEach((element) => {
                insertArr.push(element.ref);
            });
            return insertArr;
        });
    });
}
function isDocRef(val) {
    return typeof (val.collection) === 'function'
        && typeof (val.doc) === 'undefined'
        && typeof (val.startAfter) === 'undefined';
}
function isCollRef(val) {
    return typeof (val.collection) === 'undefined'
        && typeof (val.doc) === 'function'
        && typeof (val.startAfter) === 'function';
}
function materialize(obj, depth = 5) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            if (depth <= 0)
                resolve(obj);
            const objStruct = Object.assign({}, obj);
            const propToProm = [];
            let foundProp = false;
            Object.keys(objStruct).forEach((prop) => {
                if (Object.prototype.hasOwnProperty.call(objStruct, prop)) {
                    if (isDocRef(objStruct[prop])) {
                        const ref = objStruct[prop];
                        const dataProm = ref
                            .get()
                            .then((value) => value.data())
                            .then((data) => materialize(data, depth - 1));
                        propToProm.push([prop, dataProm]);
                        foundProp = true;
                    }
                    else if (objStruct[prop] instanceof Array
                        && objStruct[prop].length > 0
                        && isDocRef(objStruct[prop][0])) {
                        const refArr = objStruct[prop];
                        const groupProp = refArr.map((item) => item
                            .get()
                            .then((val) => val.data())
                            .then((data) => materialize(data, depth - 1)));
                        propToProm.push([prop, Promise.all(groupProp)]);
                        foundProp = true;
                    }
                    else if (isCollRef(objStruct[prop])) {
                        const collection = objStruct[prop];
                        const promRet = docRefArrayFromCollectionRef(collection)
                            .then((colectionAsArr) => materialize(colectionAsArr, depth - 1));
                        propToProm.push([prop, promRet]);
                        foundProp = true;
                    }
                }
            });
            if (!foundProp) {
                resolve(objStruct);
            }
            const waitForThese = propToProm.map(([, v]) => v);
            Promise.all(waitForThese)
                .then((values) => {
                values.forEach((v, k) => {
                    objStruct[propToProm[k][0]] = v;
                });
                resolve(objStruct);
            });
        });
    });
}
exports.default = materialize;
//# sourceMappingURL=index.js.map