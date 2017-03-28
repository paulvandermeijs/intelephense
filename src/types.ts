/* Copyright (c) Ben Mewburn ben@mewburn.id.au
 * Licensed under the MIT Licence.
 */

'use strict';

export interface Predicate<T> {
    (t: T): boolean;
}

export interface DebugLogger {
    debug(message: string): void;
}

export interface EventHandler<T> {
    (t: T): void;
}

export class Event<T> {

    private _subscribed: EventHandler<T>[];

    constructor() {
        this._subscribed = [];
    }

    subscribe(handler: EventHandler<T>) {
        this._subscribed.push(handler);
        let index = this._subscribed.length - 1;
        let subscribed = this._subscribed;
        return () => {
            subscribed.splice(index, 1);
        };
    }

    trigger(args: T) {
        let handler: EventHandler<T>;
        for (let n = 0; n < this._subscribed.length; ++n) {
            handler = this._subscribed[n];
            handler(args);
        }
    }

}

export interface TreeLike {
    children?: TreeLike[]
}

export class TreeTraverser<T extends TreeLike> {

    constructor(public spine: T[]) { }

    get node() {
        return this.spine.length ? this.spine[this.spine.length - 1] : null;
    }

    traverse(visitor: TreeVisitor<T>) {
        this._traverse(this.node, visitor, this.spine.slice(0));
    }

    filter(predicate: Predicate<T>) {

        let visitor = new FilterVisitor<T>(predicate);
        this.traverse(visitor);
        return visitor.array;

    }

    find(predicate: Predicate<T>) {

        let visitor = new FindVisitor<T>(predicate);
        this.traverse(visitor);

        if (visitor.found) {
            this.spine = visitor.found;
            return this.node;
        }

        return null;

    }

    prevSibling() {

        if (this.spine.length < 2) {
            return null;
        }

        let parent = this.spine[this.spine.length - 2];
        let childIndex = parent.children.indexOf(this);

        if (childIndex > 0) {
            this.spine.pop();
            this.spine.push(<T>parent.children[childIndex - 1]);
            return this.node;
        } else {
            return null;
        }

    }

    nextSibling() {

        if (this.spine.length < 2) {
            return null;
        }

        let parent = this.spine[this.spine.length - 2];
        let childIndex = parent.children.indexOf(this);

        if (childIndex < parent.children.length - 1) {
            this.spine.pop();
            this.spine.push(<T>parent.children[childIndex + 1]);
            return this.node;
        } else {
            return null;
        }

    }

    ancestor(predicate: Predicate<T>) {

        for (let n = this.spine.length - 2; n >= 0; --n) {
            if (predicate(this.spine[n])) {
                this.spine = this.spine.slice(0, n + 1);
                return this.node;
            }
        }

        return null;

    }

    private _traverse(treeNode: T, visitor: TreeVisitor<T>, spine: T[]) {

        if (visitor.haltTraverse) {
            return;
        }

        let descend = true;

        if (visitor.preOrder) {
            descend = visitor.preOrder(treeNode, spine);
            if (visitor.haltTraverse) {
                return;
            }
        }

        if (treeNode.children && descend) {

            spine.push(treeNode);
            for (let n = 0, l = treeNode.children.length; n < l; ++n) {
                this._traverse(<T>treeNode.children[n], visitor, spine);
                if (visitor.haltTraverse) {
                    return;
                }
            }
            spine.pop();

        }

        if (visitor.postOrder) {
            visitor.postOrder(treeNode, spine);
        }

    }

}

export interface TreeVisitor<T extends TreeLike> {

    haltTraverse?: boolean;
    preOrder?(node: T, spine: T[]): boolean;
    postOrder?(node: T, spine: T[]): void;

}

class FilterVisitor<T> implements TreeVisitor<T>{

    private _predicate: Predicate<T>;
    private _array: T[];

    constructor(predicate: Predicate<T>) {
        this._predicate = predicate;
        this._array = [];
    }

    get array() {
        return this._array;
    }

    preOrder(node: T, spine: T[]) {
        if (this._predicate(node)) {
            this._array.push(node);
        }
        return true;
    }

}

class FindVisitor<T> implements TreeVisitor<T> {

    private _predicate: Predicate<T>;
    private _found: T[];

    haltTraverse: boolean;

    constructor(predicate: Predicate<T>) {
        this._predicate = predicate;
        this.haltTraverse = false;
    }

    get found() {
        return this._found;
    }

    preOrder(node: T, spine: T[]) {

        if (this._predicate(node)) {
            this._found = spine.slice(0);
            this.found.push(node);
            this.haltTraverse = true;
            return false;
        }

        return true;
    }

}

export class Debounce<T> {

    private _handler: (e: T) => void;
    private _lastEvent: T;
    private _timer: number;
    private _wait: number;

    constructor(handler: (e: T) => void, wait: number) {
        this._handler = handler;
        this._wait = wait;
    }

    clear = () => {
        clearTimeout(this._timer);
        this._timer = null;
        this._lastEvent = null;
    }

    handle(event: T) {
        this.clear();
        this._lastEvent = event;
        let that = this;
        let handler = this._handler;
        let clear = this.clear;
        let later = () => {
            handler.apply(that, [event]);
            clear();
        };
        this._timer = setTimeout(later, this._wait);
    }

    flush() {
        if (!this._timer) {
            return;
        }

        let event = this._lastEvent;
        this.clear();
        if (event) {
            this._handler.apply(this, [event]);
        }

    }

}


export class ToArrayVisitor<T> implements TreeVisitor<T> {

    private _array: T[];

    constructor() {
        this._array = [];
    }

    get array() {
        return this._array;
    }

    preOrder(t: T, spine: T[]) {
        this._array.push(t);
        return true;
    }

}

export class CountVisitor<T> implements TreeVisitor<T> {

    private _count: number

    constructor() {
        this._count = 0;
    }

    get count(){
        return this._count;
    }

    preOrder(t: T, spine: T[]) {
        ++this._count;
        return true;
    }
}

/*
class MultiVisitor<T> implements TreeVisitor<T> {

    private _visitors: [TreeVisitor<T>, Tree<T>][];

    constructor(visitors: TreeVisitor<T>[] = []) {
        for (let n = 0; n < visitors.length; ++n) {
            this.add(visitors[n]);
        }
    }

    add(v: TreeVisitor<T>) {
        this._visitors.push([v, null]);
    }

    preOrder(t) {
        let v: [TreeVisitor<T>, Tree<T>];
        for (let n = 0; n < this._visitors.length; ++n) {
            v = this._visitors[n];
            if (!v[1]) {
                v[0].preOrder(t);
            }
        }
    }

    inOrder(t, afterChildIndex) {
        let v: [TreeVisitor<T>, Tree<T>];
        for (let n = 0; n < this._visitors.length; ++n) {
            v = this._visitors[n];
            if (!v[1]) {
                v[0].inOrder(t, afterChildIndex);
            }
        }
    }

    postOrder(t) {
        let v: [TreeVisitor<T>, Tree<T>];
        for (let n = 0; n < this._visitors.length; ++n) {
            v = this._visitors[n];
            if (v[1] === t) {
                v[1] = null;
            }
            if (!v[1]) {
                v[0].postOrder(t);
            }
        }
    }

    shouldDescend(t) {

        let v: [TreeVisitor<T>, Tree<T>];
        let descend = false;

        for (let n = 0; n < this._visitors.length; ++n) {
            v = this._visitors[n];
            if (v[1]) {
                continue;
            }
            if (v[0].shouldDescend(t)) {
                descend = true;
            } else {
                v[1] = t;
            }
        }

        return descend;

    }


}
*/

export class BinarySearch<T> {

    private _sortedArray: T[];

    constructor(sortedArray: T[]) {
        this._sortedArray = sortedArray;
    }

    find(compare: (n: T) => number) {
        let result = this._search(compare);
        return result.isExactMatch ? this._sortedArray[result.rank] : null;
    }

    rank(compare: (n: T) => number) {
        return this._search(compare).rank;
    }

    range(compareLower: (n: T) => number, compareUpper: (T) => number) {
        let rankLower = this.rank(compareLower);
        return this._sortedArray.slice(rankLower, this._search(compareUpper, rankLower).rank);
    }

    private _search(compare: (n: T) => number, left = 0): BinarySearchResult {

        let right = this._sortedArray.length - 1;
        let mid = 0;
        let compareResult = 0;
        let searchResult: BinarySearchResult;

        while (true) {

            if (left > right) {
                searchResult = { rank: left, isExactMatch: false };
                break;
            }

            mid = Math.floor((left + right) / 2);
            compareResult = compare(this._sortedArray[mid]);

            if (compareResult < 0) {
                left = mid + 1;
            } else if (compareResult > 0) {
                right = mid - 1;
            } else {
                searchResult = { rank: mid, isExactMatch: true };
                break;
            }

        }

        return searchResult;

    }

}

interface BinarySearchResult {
    rank: number;
    isExactMatch: boolean
}


