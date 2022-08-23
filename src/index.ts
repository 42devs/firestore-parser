import { DocumentReference, CollectionReference, DocumentData } from 'firebase-admin/firestore';

async function docRefArrayFromCollectionRef(collection: CollectionReference): Promise<Array<any>> {
  const insertArr: DocumentReference[] = [];
  return collection.get()
    .then((snapshot: DocumentData) => {
      snapshot.forEach((element: DocumentData) => {
        insertArr.push(element.ref);
      });
      return insertArr;
    });
}

function isDocRef(val:any) {
  return typeof (val.collection) === 'function'
        && typeof (val.doc) === 'undefined'
        && typeof (val.startAfter) === 'undefined';
}

function isCollRef(val: any) {
  return typeof (val.collection) === 'undefined'
    && typeof (val.doc) === 'function'
    && typeof (val.startAfter) === 'function';
}

export default async function materialize(obj: DocumentData, depth: number = 5): Promise<any> {
  return new Promise((resolve) => {
    if (depth <= 0) resolve(obj);

    const objStruct = { ...obj };

    const propToProm: [string, Promise<any>][] = [];

    let foundProp = false;

    Object.keys(objStruct).forEach((prop) => {
      if (Object.prototype.hasOwnProperty.call(objStruct, prop)) {
        if (isDocRef(objStruct[prop])) {
          const ref = objStruct[prop] as DocumentReference;
          const dataProm = ref
            .get()
            .then((value: DocumentData) => value.data())
            .then((data: DocumentData) => materialize(data!, depth - 1));
          propToProm.push([prop, dataProm]);
          foundProp = true;
        } else if (objStruct[prop] instanceof Array
            && objStruct[prop].length > 0
            && isDocRef(objStruct[prop][0])) {
          const refArr = objStruct[prop] as Array<DocumentReference>;
          const groupProp = refArr.map((item) => item
            .get()
            .then((val: DocumentData) => val.data())
            .then((data: DocumentData) => materialize(data!, depth - 1)));
          propToProm.push([prop, Promise.all(groupProp)]);
          foundProp = true;
        } else if (isCollRef(objStruct[prop])) {
          const collection = objStruct[prop] as CollectionReference;
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

    const waitForThese: Promise<any>[] = propToProm.map(([,v]) => v);

    Promise.all(waitForThese)
      .then((values) => {
        values.forEach((v, k) => {
          objStruct[propToProm[k][0]] = v;
        });
        resolve(objStruct);
      });
  });
}
