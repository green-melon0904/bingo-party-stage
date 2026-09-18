import { useEffect, useRef, useState } from 'react';
import { loadDraws, nextNumber, letterFor, numbers } from './game.js';
const palette = ['#f36183', '#ffd35b', '#28b5a7', '#ff9857', '#9983c8'];
const colorFor = n => palette[Math.floor((n - 1) / 15)];
export function App() {
  const [called, setCalled] = useState(() => { try { return loadDraws(localStorage); } catch { return []; } });
  const [spinning, setSpinning] = useState(false);
  const [preview, setPreview] = useState(null);
  const [full, setFull] = useState(false);
  const [warning, setWarning] = useState('');
  const lock = useRef(false), timers = useRef([]), resetDialog = useRef(null);
  const latest = called.at(-1);
  const shown = spinning ? preview : latest;
  useEffect(() => { try { localStorage.setItem('bingo-stage-v1', JSON.stringify(called)); } catch { setWarning('履歴を保存できません。この画面を開いたままご利用ください。'); } }, [called]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => { const change = () => setFull(Boolean(document.fullscreenElement)); document.addEventListener('fullscreenchange', change); return () => document.removeEventListener('fullscreenchange', change); }, []);
  function draw() {
    if (lock.current || called.length === 75 || resetDialog.current?.open) return;
    lock.current = true;
    const selected = nextNumber(called);
    setSpinning(true); setPreview(nextNumber(called));
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduced ? 150 : 1900;
    timers.current = [];
    if (!reduced) for (let i = 1; i <= 15; i++) timers.current.push(setTimeout(() => { setPreview(nextNumber(called)); }, i * 100));
    timers.current.push(setTimeout(() => { setCalled(previous => [...previous, selected]); setSpinning(false); lock.current = false; }, duration));
  }
  useEffect(() => { const key = e => { if (e.code === 'Space' && !e.repeat && !['BUTTON','INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)) { e.preventDefault(); draw(); } }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); });
  async function toggleFull() { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { setWarning('全画面表示に対応していません。ブラウザの全画面機能をご利用ください。'); } }
  return <main className="app">
    <header className="toolbar">
      <div className="brand"><h1 className="wordmark" aria-label="BINGO!">{'BINGO'.split('').map((l,i) => <span key={i} style={{color:palette[i]}}>{l}</span>)}<span className="exclamation">!</span></h1><p>みんなで、わくわく。ビンゴの時間。</p></div>
      <div className="tools"><button onClick={toggleFull}>{full ? '全画面を終了' : '全画面にする'} <span aria-hidden="true">↗</span></button><button className="reset-button" disabled={spinning || !called.length} onClick={() => resetDialog.current.showModal()}>リセット</button></div>
    </header>
    <div className="game-layout">
      <section className={`stage ${spinning ? 'drawing' : ''}`} aria-label="ビンゴ抽選">
        <div className="stage-top"><p>{spinning ? 'つぎの番号は…' : latest ? 'ただいまの番号' : 'さあ、はじめよう！'}</p><span>残り <b>{75-called.length}</b> 個</span></div>
        <div className={`result ${latest && !spinning ? 'revealed' : ''}`} key={spinning ? 'spin' : latest || 'ready'} aria-hidden="true"><span className="letter" style={{background:shown ? colorFor(shown) : palette[2]}}>{shown ? letterFor(shown) : 'GO'}</span><strong>{shown ? String(shown).padStart(2,'0') : '？'}</strong></div>
        <p className="sr-only" role="status">{!spinning && latest ? `ただいまの番号は ${letterFor(latest)}、${latest} です。` : ''}</p>
        <p className="message">{spinning ? 'ドキドキ、もうすぐ出るよ！' : called.length === 75 ? 'すべての番号が出ました！' : latest ? 'みんな、カードをチェック！' : 'カードを用意して、準備はいい？'}</p>
        <div className="draw-controls"><button className="draw-button" onClick={draw} disabled={spinning || called.length === 75}>{spinning ? '抽選中…' : called.length === 75 ? '抽選が終了しました' : latest ? '次の番号を引く' : 'ビンゴをはじめる'} <span aria-hidden="true">→</span></button><span className="keyboard-hint"><kbd>SPACE</kbd> キーでも抽選できます</span></div>
        <div className="recent"><span>ひとつ前の番号</span>{called.length > 1 ? <b style={{background:colorFor(called.at(-2))}}>{letterFor(called.at(-2))} · {called.at(-2)}</b> : <b>—</b>}</div>
      </section>
      <aside className="history-panel" aria-labelledby="history-title">
        <div className="panel-heading"><div><p>みんなで確認しよう</p><h2 id="history-title">これまでの番号</h2></div><span className="count"><b>{called.length}</b><small> / 75</small></span></div>
        <div className="number-board" aria-label="全75番号の抽選状況">{'BINGO'.split('').map((l,i) => <div className="number-column" key={l} style={{'--column-color':palette[i]}}><h3>{l}</h3>{numbers.slice(i*15, i*15+15).map(n => <span key={n} aria-label={`${n}、${called.includes(n) ? '抽選済み' : '未抽選'}${n === latest ? '、最新' : ''}`} className={`number-cell ${called.includes(n) ? 'called' : ''} ${n === latest ? 'latest' : ''}`}>{String(n).padStart(2,'0')}{n === latest && <i aria-hidden="true" />}</span>)}</div>)}</div>
        <div className="board-legend"><span><i className="legend-called" />抽選済み</span><span><i className="legend-latest" />いま出た番号</span></div>
      </aside>
    </div>
    <footer className="bottom-note"><span>カードはお手元に。そろったら、大きな声で「ビンゴ！」</span><span>1–75 / 重複なし</span></footer>
    {warning && <p className="warning" role="alert">{warning}</p>}
    <dialog ref={resetDialog} className="reset-dialog" aria-labelledby="reset-title"><h2 id="reset-title">新しいゲームをはじめる？</h2><p>これまでの抽選履歴を消して、1〜75の番号をすべて戻します。</p><div className="dialog-actions"><button onClick={() => resetDialog.current.close()}>もどる</button><button className="confirm" onClick={() => { setCalled([]); setPreview(null); resetDialog.current.close(); }}>リセットする</button></div></dialog>
  </main>;
}
