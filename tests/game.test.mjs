import test from 'node:test';
import assert from 'node:assert/strict';
import {nextNumber, loadDraws, letterFor} from '../src/game.js';
test('draws all 75 without repetition then stops',()=>{const called=[];for(let i=0;i<75;i++)called.push(nextNumber(called));assert.equal(new Set(called).size,75);assert.deepEqual([...called].sort((a,b)=>a-b),Array.from({length:75},(_,i)=>i+1));assert.equal(nextNumber(called),null)});
test('rejects corrupted and duplicate persisted draws',()=>{for(const data of ['null','{}','[1,1]','[0]','[76]','[1.5]','oops'])assert.deepEqual(loadDraws({getItem:()=>data}),[]);assert.deepEqual(loadDraws({getItem:()=> '[1,75]'}),[1,75]);assert.deepEqual(loadDraws({getItem:()=>{throw Error()}}),[])});
test('maps bingo letter boundaries',()=>{assert.deepEqual([1,15,16,30,31,45,46,60,61,75].map(letterFor),['B','B','I','I','N','N','G','G','O','O'])});
