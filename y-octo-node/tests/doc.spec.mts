import assert, { equal, deepEqual } from "node:assert";
import { test } from "node:test";

import { Doc, YArray, YMap, YText } from "../index";

test("y-octo doc", { concurrency: false }, async (t) => {
  let client_id: number;
  let doc: Doc;
  t.beforeEach(async () => {
    client_id = (Math.random() * 100000) | 0;
    doc = new Doc(client_id);
  });

  t.afterEach(async () => {
    client_id = -1;
    // @ts-ignore - doc must not null in next range
    doc = null;
  });

  await t.test("doc id should be set", () => {
    equal(doc.clientId, client_id);
  });

  await t.test("array should be created", () => {
    let arr = doc.getOrCreateArray("arr");
    deepEqual(doc.keys, ["arr"]);
    equal(arr.length, 0);
  });

  await t.test("array editing", () => {
    let arr = doc.getOrCreateArray("arr");
    arr.insert(0, true);
    arr.insert(1, false);
    arr.insert(2, 1);
    arr.insert(3, "hello world");
    equal(arr.length, 4);
    equal(arr.get(0), true);
    equal(arr.get(1), false);
    equal(arr.get(2), 1);
    equal(arr.get(3), "hello world");
    equal(arr.length, 4);
    arr.remove(1, 1);
    equal(arr.length, 3);
    equal(arr.get(2), "hello world");
  });

  await t.test("map should be created", () => {
    let map = doc.getOrCreateMap("map");
    deepEqual(doc.keys, ["map"]);
    equal(map.length, 0);
  });

  await t.test("map editing", () => {
    let map = doc.getOrCreateMap("map");
    map.set("a", true);
    map.set("b", false);
    map.set("c", 1);
    map.set("d", "hello world");
    equal(map.length, 4);
    equal(map.get("a"), true);
    equal(map.get("b"), false);
    equal(map.get("c"), 1);
    equal(map.get("d"), "hello world");
    equal(map.length, 4);
    map.remove("b");
    equal(map.length, 3);
    equal(map.get("d"), "hello world");
  });

  await t.test("text should be created", () => {
    let text = doc.getOrCreateText("text");
    deepEqual(doc.keys, ["text"]);
    equal(text.len, 0);
  });

  await t.test("text editing", () => {
    let text = doc.getOrCreateText("text");
    text.insert(0, "a");
    text.insert(1, "b");
    text.insert(2, "c");
    equal(text.toString(), "abc");
    text.remove(0, 1);
    equal(text.toString(), "bc");
    text.remove(1, 1);
    equal(text.toString(), "b");
    text.remove(0, 1);
    equal(text.toString(), "");
  });

  await t.test("sub array should can edit", () => {
    let map = doc.getOrCreateMap("map");
    let sub = doc.createArray();
    map.setArray("sub", sub);

    sub.insert(0, true);
    sub.insert(1, false);
    sub.insert(2, 1);
    sub.insert(3, "hello world");
    equal(sub.length, 4);

    let sub2 = map.get<YArray>("sub");
    assert(sub2);
    equal(sub2.get(0), true);
    equal(sub2.get(1), false);
    equal(sub2.get(2), 1);
    equal(sub2.get(3), "hello world");
    equal(sub2.length, 4);
  });

  await t.test("sub map should can edit", () => {
    let map = doc.getOrCreateMap("map");
    let sub = doc.createMap();
    map.setMap("sub", sub);

    sub.set("a", true);
    sub.set("b", false);
    sub.set("c", 1);
    sub.set("d", "hello world");
    equal(sub.length, 4);

    let sub2 = map.get<YMap>("sub");
    assert(sub2);
    equal(sub2.get("a"), true);
    equal(sub2.get("b"), false);
    equal(sub2.get("c"), 1);
    equal(sub2.get("d"), "hello world");
    equal(sub2.length, 4);
  });

  await t.test("sub text should can edit", () => {
    let map = doc.getOrCreateMap("map");
    let sub = doc.createText();
    map.setText("sub", sub);

    sub.insert(0, "a");
    sub.insert(1, "b");
    sub.insert(2, "c");
    equal(sub.toString(), "abc");

    let sub2 = map.get<YText>("sub");
    assert(sub2);
    equal(sub2.toString(), "abc");
  });
});
