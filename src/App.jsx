import { useEffect, useRef, useState } from 'react';
import { loadDraws, nextNumber, letterFor, numbers } from './game.js';
const palette = ['#f36183', '#ffd35b', '#28b5a7', '#ff9857', '#9983c8'];
const colorFor = n => palette[Math.floor((n - 1) / 15)];
export function App() {
  const [called, setCalled] = useState(() => { try { return loadDraws(localStorage); } catch { return []; } });
  const [spinning, setSpinning] = useState(false);
  const [preview, setPreview] = useState(null);
  const [sound, setSound] = useState(false);
  const [full, setFull] = useState(false);
  const [warning, setWarning] = useState('');
  const lock = useRef(false), timers = useRef([]), audio = useRef(null), resetDialog = useRef(null), historyDialog = useRef(null);
  const latest = called.at(-1);
  const shown = spinning ? preview : latest;
  useEffect(() => { try { localStorage.setItem('bingo-stage-v1', JSON.stringify(called)); } catch { setWarning('履歴を保存できません。この画面を開いたままご利用ください。'); } }, [called]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => { const change = () => setFull(Boolean(document.fullscreenElement)); document.addEventListener('fullscreenchange', change); return () => document.removeEventListener('fullscreenchange', change); }, []);
  function beep(final = false) {
    if (!sound) return;
    try { const ctx = audio.current ||= new (window.AudioContext || window.webkitAudioContext)(); ctx.resume(); const osc = ctx.createOscillator(), gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); osc.frequency.value = final ? 880 : 330; gain.gain.setValueAtTime(.07, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .2); osc.start(); osc.stop(ctx.currentTime + .2); } catch { /* Sound is optional. */ }
  }
  function draw() {
    if (lock.current || called.length === 75 || resetDialog.current?.open || historyDialog.current?.open) return;
    lock.current = true;
    const selected = nextNumber(called);
    setSpinning(true); setPreview(nextNumber(called)); beep();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduced ? 150 : 1900;
    timers.current = [];
    if (!reduced) for (let i = 1; i <= 15; i++) timers.current.push(setTimeout(() => { setPreview(nextNumber(called)); beep(); }, i * 100));
    timers.current.push(setTimeout(() => { setCalled(previous => [...previous, selected]); setSpinning(false); lock.current = false; beep(true); }, duration));
  }
  useEffect(() => { const key = e => { if (e.code === 'Space' && !e.repeat && !['BUTTON','INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)) { e.preventDefault(); draw(); } }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); });
  async function toggleFull() { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { setWarning('全画面表示に対応していません。ブラウザの全画面機能をご利用ください。'); } }
  return <main className="app">
    <div className="toolbar"><h1 className="wordmark" aria-label="BINGO!">{'BINGO!'.split('').map((l,i) => <span key={i} style={{color:palette[i % 5]}}>{l}</span>)}</h1><div><button onClick={() => setSound(!sound)} aria-pressed={sound}>♪ 音 {sound ? 'ON' : 'OFF'}</button><button onClick={toggleFull}>⛶ {full ? '全画面を終了' : '全画面'}</button><button disabled={spinning || !called.length} onClick={() => resetDialog.current.showModal()}>リセット</button></div></div>
    <section className={`stage ${spinning ? 'drawing' : ''}`} aria-label="ビンゴ抽選">
      <div className="decoration decor-left" aria-hidden="true">✦</div><div className="decoration decor-right" aria-hidden="true">✳</div>
      <div className="draw-area">
        <p className="result-caption">{spinning ? 'つぎの番号は…？' : latest ? 'ただいまの番号' : 'みんな、準備はいい？'}</p>
        <div className={`result ${latest && !spinning ? 'revealed' : ''}`} key={spinning ? 'spin' : latest || 'ready'} aria-hidden="true"><span style={{color:shown ? colorFor(shown) : palette[2]}}>{shown ? letterFor(shown) : '★'}</span><strong>{shown || '?'}</strong></div>
        <p className="sr-only" role="status">{!spinning && latest ? `ただいまの番号は ${letterFor(latest)}、${latest} です。` : ''}</p>
        <p className="message">{spinning ? 'ドキドキ、もうすぐ出るよ！' : called.length === 75 ? 'すべての番号が出ました！' : latest ? 'みんな、カードをチェック！' : 'カードを用意して、はじめよう。'}</p>
        <button className="draw-button" onClick={draw} disabled={spinning || called.length === 75}>{spinning ? '抽選中…' : called.length === 75 ? '抽選が終了しました' : latest ? '次の番号を引く' : 'ビンゴをはじめる'} <span aria-hidden="true">→</span></button>
        <div className="draw-footer"><span>抽選済み <b>{called.length}</b> / 75</span><span className="keyboard-hint"><kbd>SPACE</kbd> でも抽選</span></div>
      </div>
    </section>
    <section className="history-strip" aria-label="直近の抽選履歴"><div className="history-title"><h2>これまでの番号</h2><span>新しい順</span></div><div className="recent">{called.length ? [...called].reverse().slice(0,10).map((n,i) => <span className={`history-ball ${i === 0 ? 'newest' : ''}`} style={{background:colorFor(n)}} key={n}><small>{letterFor(n)}</small>{n}</span>) : <p>最初の番号を待っています。みんなに幸運が訪れますように！</p>}</div><button className="history-button" onClick={() => historyDialog.current.showModal()}>全番号を見る <span>↗</span></button></section>
    <footer className="bottom-note"><span>1〜75から、重複なしでランダム抽選</span><span>カードはお手元に。ビンゴになったら声をかけよう！</span></footer>
    {warning && <p className="warning" role="alert">{warning}</p>}
    <dialog ref={historyDialog} aria-labelledby="history-title"><div className="dialog-head"><h2 id="history-title">これまでの番号 <small>{called.length} / 75</small></h2><button onClick={() => historyDialog.current.close()} aria-label="履歴を閉じる">✕</button></div><p>色のついた番号が抽選済みです。</p><div className="number-board">{'BINGO'.split('').map((l,i) => <div className="number-row" key={l}><b style={{background:palette[i]}}>{l}</b>{numbers.slice(i*15, i*15+15).map(n => <span key={n} className={called.includes(n) ? 'called' : ''} style={called.includes(n) ? {background:palette[i]} : {}}>{n}</span>)}</div>)}</div></dialog>
    <dialog ref={resetDialog} className="reset-dialog" aria-labelledby="reset-title"><h2 id="reset-title">新しいゲームをはじめる？</h2><p>これまでの抽選履歴を消して、1〜75の番号をすべて戻します。</p><div className="dialog-actions"><button onClick={() => resetDialog.current.close()}>もどる</button><button className="confirm" onClick={() => { setCalled([]); setPreview(null); resetDialog.current.close(); }}>リセットする</button></div></dialog>
  </main>;
}
