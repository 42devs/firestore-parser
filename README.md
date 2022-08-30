# firestore-parser

All of us who have had to work with subcollections or references in "firestore" have encountered the same problem of having to resolve the queries sequentially or having the typical "Pending" response without resolving the result.

With this simple and useful script it will no longer be necessary to think about solving each reference or subcollection one by one.

## How to..

add as a dependency to you project:

```bash
$ npm install @42devs/firestore-parser # if you use npm
$ yarn add @42devs/firestore-parser # for yarn classic users
```

## use it

```javascript
import firestoreParser from '@42devs/firestore-parser';

const reference = await db.collection('mycollecion').where('param', '==', 'value').get();

const res = reference.map(async (value) => {
    const data = value.data();
    const result = await firestoreParser(data);
    return result;
});

console.log(res);

```


## FAQ

Is type ready?
- Yes!

Its gonna make my request a litte bit harder? 
- not necessarily, but the idea of this type of getting request is that one can reuse its responses to avoid making requests every time

Works with streaming or live changes?
- We have not tested it, but if it is a problem, it is always recommended to create an issue about it
