import { useEffect, useRef, useState } from 'react';
import { loadDraws, nextNumber, letterFor, numbers, loadWinners } from './game.js';
const palette = ['#f36183', '#ffd35b', '#28b5a7', '#ff9857', '#9983c8'];
const colorFor = n => palette[Math.floor((n - 1) / 15)];
export function App() {
  const [called, setCalled] = useState(() => { try { return loadDraws(localStorage); } catch { return []; } });
  const [winners, setWinners] = useState(() => { try { return loadWinners(localStorage); } catch { return { count: 0, limit: 10 }; } });
  const [limitDraft, setLimitDraft] = useState(null);
  const [limitError, setLimitError] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [preview, setPreview] = useState(null);
  const [ended, setEnded] = useState(() => { try { return localStorage.getItem('bingo-ended-v1') === 'true'; } catch { return false; } });
  const [full, setFull] = useState(false);
  const [warning, setWarning] = useState('');
  const lock = useRef(false), timers = useRef([]), resetDialog = useRef(null), endDialog = useRef(null), endHeading = useRef(null), offeredLimit = useRef(null), audioContext = useRef(null);
  const latest = called.at(-1);
  const shown = spinning ? preview : latest;
  useEffect(() => { try { localStorage.setItem('bingo-stage-v1', JSON.stringify(called)); } catch { setWarning('履歴を保存できません。この画面を開いたままご利用ください。'); } }, [called]);
  useEffect(() => { try { localStorage.setItem('bingo-winners-v1', JSON.stringify(winners)); } catch { setWarning('人数を保存できません。この画面を開いたままご利用ください。'); } }, [winners]);
  useEffect(() => { try { localStorage.setItem('bingo-ended-v1', String(ended)); } catch { setWarning('終了状態を保存できません。'); } if (ended) endHeading.current?.focus(); }, [ended]);
  useEffect(() => { if (winners.count < winners.limit) { offeredLimit.current = null; return; } if (!ended && !spinning && offeredLimit.current !== winners.limit && !endDialog.current?.open) { offeredLimit.current = winners.limit; endDialog.current?.showModal(); } }, [winners.count, winners.limit, ended, spinning]);
  function finishGame() { timers.current.forEach(clearTimeout); lock.current = false; setSpinning(false); endDialog.current.close(); setEnded(true); }
  function saveLimit() {
    if (limitDraft === null) return;
    const limit = Number(limitDraft);
    if (!Number.isInteger(limit) || limit < Math.max(1, winners.count) || limit > 9999) { setLimitError(`上限は${Math.max(1, winners.count)}〜9999人で設定してください。`); setLimitDraft(null); return; }
    setWinners(previous => ({ ...previous, limit })); setLimitDraft(null); setLimitError('');
  }
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => { const change = () => setFull(Boolean(document.fullscreenElement)); document.addEventListener('fullscreenchange', change); return () => document.removeEventListener('fullscreenchange', change); }, []);
  function draw() {
    if (ended || endDialog.current?.open || lock.current || called.length === 75 || resetDialog.current?.open) return;
    lock.current = true;
    const selected = nextNumber(called);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduced ? 150 : 1900;
    setSpinning(true); setPreview(nextNumber(called));
    playDrawSound(duration);
    timers.current = [];
    if (!reduced) for (let i = 1; i <= 15; i++) timers.current.push(setTimeout(() => { setPreview(nextNumber(called)); }, i * 100));
    timers.current.push(setTimeout(() => { playRevealSound(); setCalled(previous => [...previous, selected]); setSpinning(false); lock.current = false; }, duration));
  }
  useEffect(() => { const key = e => { if (e.code === 'Space' && !e.repeat && !['BUTTON','INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)) { e.preventDefault(); draw(); } }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); });
  async function toggleFull() { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { setWarning('全画面表示に対応していません。ブラウザの全画面機能をご利用ください。'); } }
  function getAudioContext() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      const context = audioContext.current ??= new AudioContextClass();
      void context.resume();
      return context;
    } catch {
      return null;
    }
  }
  function playTone(context, frequency, offset, duration, volume, type = 'triangle') {
    const start = context.currentTime + offset;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }
  function playDrawSound(duration) {
    const context = getAudioContext();
    if (!context) return;
    const count = duration < 500 ? 2 : 15;
    for (let i = 0; i < count; i++) {
      const progress = i / Math.max(1, count - 1);
      playTone(context, 180 + (i % 4) * 48 + progress * 170, i * (duration / count) / 1000, 0.055, 0.045, 'square');
    }
  }
  function playRevealSound() {
    const context = getAudioContext();
    if (!context) return;
    playTone(context, 523.25, 0, 0.2, 0.11);
    playTone(context, 659.25, 0.07, 0.24, 0.1);
    playTone(context, 783.99, 0.14, 0.38, 0.12);
  }
  return <main className="app">
    <header className="toolbar">
      <div className="brand"><h1 className="wordmark" aria-label="BINGO!">{'BINGO'.split('').map((l,i) => <span key={i} style={{color:palette[i]}}>{l}</span>)}<span className="exclamation">!</span></h1></div>
      <div className="tools"><button onClick={toggleFull}>{full ? '全画面を終了' : '全画面にする'} <span aria-hidden="true">↗</span></button><button className="reset-button" disabled={spinning || (!called.length && !winners.count)} onClick={() => resetDialog.current.showModal()}>リセット</button></div>
    </header>
    {ended ? <section className="end-screen" aria-labelledby="end-title"><p className="end-eyebrow">THANK YOU FOR PLAYING</p><h2 id="end-title" ref={endHeading} tabIndex={-1}>BINGO 終了！</h2><p className="end-thanks">ご参加ありがとうございました。</p><div className="end-summary"><div><span>BINGOした人数</span><strong>{winners.count}<small> / {winners.limit} 人</small></strong></div><div><span>抽選した番号</span><strong>{called.length}<small> / 75 個</small></strong></div></div><button className="draw-button" onClick={() => resetDialog.current.showModal()}>新しいゲームをはじめる <span aria-hidden="true">→</span></button></section> : <div className="game-layout">
      <section className={`stage ${spinning ? 'drawing' : ''}`} aria-label="ビンゴ抽選">
        <div className="stage-top"><p>{spinning ? 'つぎの番号は…' : latest ? 'ただいまの番号' : 'さあ、はじめよう！'}</p><span>残り <b>{75-called.length}</b> 個</span></div>
        <div className={`result ${latest && !spinning ? 'revealed' : ''}`} key={spinning ? 'spin' : latest || 'ready'} aria-hidden="true"><span className="letter" style={{background:shown ? colorFor(shown) : palette[2]}}>{shown ? letterFor(shown) : 'GO'}</span><strong>{shown ? String(shown).padStart(2,'0') : '？'}</strong></div>
        <p className="sr-only" role="status">{!spinning && latest ? `ただいまの番号は ${letterFor(latest)}、${latest} です。` : ''}</p>
        <div className="draw-controls"><button className="draw-button" onClick={draw} disabled={spinning || called.length === 75}>{spinning ? '抽選中…' : called.length === 75 ? '抽選が終了しました' : latest ? '次の番号を引く' : 'ビンゴをはじめる'} <span aria-hidden="true">→</span></button><span className="keyboard-hint"><kbd>SPACE</kbd> キーでも抽選できます</span></div>
        <section className={`winner-counter ${winners.count === winners.limit ? 'at-limit' : ''}`} aria-labelledby="winner-title">
          <div className="winner-label"><h2 id="winner-title">BINGOした人数</h2><span>{winners.count === winners.limit ? <button className="end-again" onClick={() => endDialog.current.showModal()}>上限に到達 · 終了する</button> : 'ビンゴが出たら＋を押す'}</span></div>
          <div className="winner-stepper"><button type="button" aria-label="BINGO人数を1人減らす" disabled={winners.count === 0} onClick={() => setWinners(previous => ({ ...previous, count: Math.max(0, previous.count - 1) }))}>−</button><output aria-live="polite" aria-atomic="true"><strong>{winners.count}</strong><span> / {winners.limit}</span><small> 人</small></output><button type="button" className="winner-plus" aria-label="BINGO人数を1人増やす" disabled={winners.count >= winners.limit} onClick={() => setWinners(previous => ({ ...previous, count: Math.min(previous.limit, previous.count + 1) }))}>＋</button></div>
          <label className="winner-limit">上限 <input type="number" min={Math.max(1, winners.count)} max="9999" step="1" aria-label="BINGO人数の上限" aria-describedby={limitError ? 'limit-error' : undefined} value={limitDraft ?? winners.limit} onChange={event => setLimitDraft(event.target.value)} onBlur={saveLimit} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); } }} /> 人</label>
          {limitError && <p className="limit-error" id="limit-error" role="alert">{limitError}</p>}
        </section>
        <div className="recent"><span>ひとつ前の番号</span>{called.length > 1 ? <b style={{background:colorFor(called.at(-2))}}>{letterFor(called.at(-2))} · {called.at(-2)}</b> : <b>—</b>}</div>
      </section>
      <aside className="history-panel" aria-labelledby="history-title">
        <div className="panel-heading"><div><p>みんなで確認しよう</p><h2 id="history-title">これまでの番号</h2></div><span className="count"><b>{called.length}</b><small> / 75</small></span></div>
        <div className="number-board" aria-label="全75番号の抽選状況">{'BINGO'.split('').map((l,i) => <div className="number-column" key={l} style={{'--column-color':palette[i]}}><h3>{l}</h3>{numbers.slice(i*15, i*15+15).map(n => <span key={n} aria-label={`${n}、${called.includes(n) ? '抽選済み' : '未抽選'}${n === latest ? '、最新' : ''}`} className={`number-cell ${called.includes(n) ? 'called' : ''} ${n === latest ? 'latest' : ''}`}>{String(n).padStart(2,'0')}{n === latest && <i aria-hidden="true" />}</span>)}</div>)}</div>
        <div className="board-legend"><span><i className="legend-called" />抽選済み</span><span><i className="legend-latest" />いま出た番号</span></div>
      </aside>
    </div>}
    <footer className="bottom-note"><span>カードはお手元に。そろったら、大きな声で「ビンゴ！」</span><span>1–75 / 重複なし</span></footer>
    {warning && <p className="warning" role="alert">{warning}</p>}
    <dialog ref={endDialog} aria-labelledby="end-question"><h2 id="end-question">BINGOを終了しますか？</h2><p>BINGOした人数が上限の<strong>{winners.limit}人</strong>に達しました。</p><div className="dialog-actions"><button onClick={() => endDialog.current.close()}>続ける</button><button className="confirm" onClick={finishGame}>終了する</button></div></dialog>
    <dialog ref={resetDialog} className="reset-dialog" aria-labelledby="reset-title"><h2 id="reset-title">新しいゲームをはじめる？</h2><p>抽選履歴とBINGO人数をリセットします。上限人数の設定は引き継ぎます。</p><div className="dialog-actions"><button onClick={() => resetDialog.current.close()}>もどる</button><button className="confirm" onClick={() => { setEnded(false); setCalled([]); setPreview(null); setWinners(previous => ({ ...previous, count: 0 })); setLimitError(''); resetDialog.current.close(); }}>リセットする</button></div></dialog>
  </main>;
}
