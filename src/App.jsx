import { useState } from 'react'
import './App.css'
import { kenpo } from './data/kenpo.js'
import { minpo } from './data/minpo.js'
import { gyosei } from './data/gyosei.js'
import { shoho } from './data/shoho.js'

const postKey = 'ai-quiz-study.posts'
const historyKey = 'ai-quiz-study.history'

const banks = {
  '憲法': kenpo,
  '民法': minpo,
  '行政法': gyosei,
  '商法': shoho,
}
const subjects = ['憲法', '民法', '行政法', '商法', '全科目ミックス']
const countOptions = [10, 25, 50, 100]

const faqs = [
  ['無料で使えますか？', 'はい、会員登録なしで無料でご利用いただけます。'],
  ['学習履歴はどこに残りますか？', 'ご利用の端末（ブラウザ）にのみ保存されます。他の端末とは共有されないため、機種変更やブラウザのデータ削除で消える点にご注意ください。'],
  ['行政書士以外の資格にも対応していますか？', '現在は行政書士試験の科目（憲法・民法・行政法・商法）のみです。他資格への対応は今後検討していきます。'],
  ['問題の誤りを見つけた場合は？', 'ページ下部の投稿フォームからお知らせください。確認のうえ修正します。'],
]

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}

function shuffle(array) {
  const next = [...array]
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

function pickQuestions(subject, count) {
  const pool = subject === '全科目ミックス'
    ? Object.entries(banks).flatMap(([name, list]) => list.map((item) => ({ ...item, subject: name })))
    : banks[subject].map((item) => ({ ...item, subject }))
  return shuffle(pool).slice(0, Math.min(count, pool.length))
}

/** 正答率（%）から合格判定メッセージを返す */
function judge(rate) {
  if (rate >= 60) return { label: '合格の可能性あり', tone: 'ok', comment: '本試験の合格ライン（6割）を超えています。この調子で維持しましょう。' }
  if (rate >= 30) return { label: 'もう少しで合格レベルに達します', tone: 'mid', comment: '間違えた問題の解説を読み直して、正答率6割を目指しましょう。' }
  return { label: '本腰を入れて勉強しないと今年の合格は難しいです', tone: 'low', comment: 'まずは科目ごとに基礎を固めるところから始めましょう。' }
}

function App() {
  const [screen, setScreen] = useState('home')
  const [subject, setSubject] = useState('行政法')
  const [count, setCount] = useState(10)
  const [questions, setQuestions] = useState([])
  const [index, setIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [answered, setAnswered] = useState(null) // null=未回答 / {choice, isCorrect}
  const [history, setHistory] = useState(() => readJson(historyKey, { answered: 0, correct: 0, sessions: [] }))
  const [posts, setPosts] = useState(() => readJson(postKey, []))
  const [form, setForm] = useState({ title: '', target: '行政法', memo: '' })

  const totalQuestions = Object.values(banks).reduce((sum, list) => sum + list.length, 0)
  const totalRate = history.answered > 0 ? Math.round((history.correct / history.answered) * 100) : null

  function startQuiz() {
    setQuestions(pickQuestions(subject, count))
    setIndex(0)
    setCorrectCount(0)
    setAnswered(null)
    setScreen('quiz')
  }

  function saveHistory(next) {
    setHistory(next)
    localStorage.setItem(historyKey, JSON.stringify(next))
  }

  function answer(choice) {
    if (answered) return
    const question = questions[index]
    const isCorrect = choice === question.a
    setAnswered({ choice, isCorrect })
    if (isCorrect) setCorrectCount(correctCount + 1)
    saveHistory({ ...history, answered: history.answered + 1, correct: history.correct + (isCorrect ? 1 : 0) })
  }

  function next() {
    if (index + 1 < questions.length) {
      setIndex(index + 1)
      setAnswered(null)
      return
    }
    const session = {
      date: new Date().toLocaleDateString('ja-JP'),
      subject,
      count: questions.length,
      correct: correctCount,
    }
    saveHistory({ ...history, sessions: [session, ...history.sessions].slice(0, 30) })
    setScreen('result')
  }

  function resetHistory() {
    if (!window.confirm('学習履歴をすべて削除します。よろしいですか？')) return
    saveHistory({ answered: 0, correct: 0, sessions: [] })
  }

  function addPost(event) {
    event.preventDefault()
    if (!form.title.trim() || !form.memo.trim()) return
    const nextPosts = [{ ...form, id: crypto.randomUUID(), date: new Date().toLocaleDateString('ja-JP') }, ...posts]
    setPosts(nextPosts)
    localStorage.setItem(postKey, JSON.stringify(nextPosts))
    setForm({ title: '', target: '行政法', memo: '' })
  }

  const question = questions[index]
  const sessionRate = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">行政書士試験・一問一答</p>
          <h1>AI Quiz Study</h1>
          <p className="lead">行政書士試験の科目別に、○×形式の一問一答で知識を確認できる無料の学習アプリです。科目と問題数を選んで、すぐに演習を始められます。</p>
        </div>
        <aside className="hero-panel">
          <span>aiichimon.jp</span>
          <strong>科目を選んで、すぐに一問一答。</strong>
          <p>会員登録は不要です。解答するたびに正誤と解説が表示され、学習履歴はこの端末に自動保存されます。</p>
        </aside>
      </section>

      {screen === 'home' && (
        <>
          <section className="quiz-setup panel" aria-label="出題設定">
            <h2>今すぐ始める</h2>
            <div className="setup-row">
              <label>
                科目
                <select value={subject} onChange={(event) => setSubject(event.target.value)}>
                  {subjects.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>
                問題数
                <select value={count} onChange={(event) => setCount(Number(event.target.value))}>
                  {countOptions.map((item) => <option key={item} value={item}>{item}問</option>)}
                </select>
              </label>
              <button type="button" onClick={startQuiz}>一問一答を始める</button>
            </div>
            <p className="setup-note">収録 {totalQuestions} 問（憲法 {kenpo.length}／民法 {minpo.length}／行政法 {gyosei.length}／商法 {shoho.length}）。出題順はランダムです。</p>
          </section>

          <section className="metrics" aria-label="学習履歴">
            <article><span>これまでの回答数</span><strong>{history.answered}</strong></article>
            <article><span>正解数</span><strong>{history.correct}</strong></article>
            <article><span>累計正答率</span><strong>{totalRate === null ? '—' : `${totalRate}%`}</strong></article>
          </section>

          {totalRate !== null && (
            <section className={`verdict verdict-${judge(totalRate).tone}`}>
              <b>{judge(totalRate).label}</b>
              <p>{judge(totalRate).comment}</p>
            </section>
          )}

          {history.sessions.length > 0 && (
            <section className="panel history-panel">
              <h2>最近の演習</h2>
              <table className="history-table">
                <thead><tr><th>日付</th><th>科目</th><th>結果</th><th>正答率</th></tr></thead>
                <tbody>
                  {history.sessions.map((session, i) => {
                    const rate = Math.round((session.correct / session.count) * 100)
                    return (
                      <tr key={i}>
                        <td>{session.date}</td>
                        <td>{session.subject}</td>
                        <td>{session.correct}／{session.count}問</td>
                        <td>{rate}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <button type="button" className="ghost-button" onClick={resetHistory}>履歴をリセット</button>
            </section>
          )}
        </>
      )}

      {screen === 'quiz' && question && (
        <section className="quiz-panel panel" aria-label="一問一答">
          <div className="quiz-head">
            <span>{question.subject}　第{index + 1}問／全{questions.length}問</span>
            <span>正解 {correctCount}</span>
          </div>
          <p className="quiz-question">{question.q}</p>
          {!answered && (
            <div className="quiz-buttons">
              <button type="button" className="maru" onClick={() => answer(true)}>○ 正しい</button>
              <button type="button" className="batsu" onClick={() => answer(false)}>× 誤り</button>
            </div>
          )}
          {answered && (
            <div className={`quiz-feedback ${answered.isCorrect ? 'correct' : 'wrong'}`}>
              <b>{answered.isCorrect ? '正解！' : '不正解'}　正解は「{question.a ? '○' : '×'}」</b>
              <p>{question.e}</p>
              <button type="button" onClick={next}>{index + 1 < questions.length ? '次の問題へ' : '結果を見る'}</button>
            </div>
          )}
          <button type="button" className="ghost-button" onClick={() => setScreen('home')}>中断してトップに戻る</button>
        </section>
      )}

      {screen === 'result' && (
        <section className="quiz-panel panel" aria-label="結果">
          <h2>演習結果</h2>
          <p className="result-score">{subject}　{correctCount}／{questions.length}問正解（正答率 {sessionRate}%）</p>
          <div className={`verdict verdict-${judge(sessionRate).tone}`}>
            <b>{judge(sessionRate).label}</b>
            <p>{judge(sessionRate).comment}</p>
          </div>
          <div className="quiz-buttons">
            <button type="button" onClick={startQuiz}>同じ条件でもう一度</button>
            <button type="button" className="ghost-button" onClick={() => setScreen('home')}>トップに戻る</button>
          </div>
        </section>
      )}

      {screen === 'home' && (
        <>
          <section className="split">
            <div className="panel">
              <h2>このサービスについて</h2>
              <article><b>収録内容</b><p>行政書士試験の科目（憲法・民法・行政法・商法）ごとに、本試験の出題傾向に沿った○×形式の予想問題を各100問収録しています。すべての問題に解説付きです。</p></article>
              <article><b>合格判定の目安</b><p>正答率6割以上で「合格の可能性あり」、3割以上6割未満で「もう少しで合格レベル」、3割未満は基礎からの学習をおすすめしています。本試験の合格基準（300点満点中180点）を参考にした目安です。</p></article>
              <article><b>データの保存先</b><p>学習履歴や投稿は、お使いの端末（ブラウザ）にのみ記録されます。サーバーには送信されません。</p></article>
            </div>
            <div className="panel">
              <h2>みんなの投稿</h2>
              <p>問題の誤りに気づいた、補足情報を共有したい、という場合にご利用ください。</p>
              <form className="ugc-form" onSubmit={addPost}>
                <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="投稿タイトル" />
                <input value={form.target} onChange={(event) => setForm({ ...form, target: event.target.value })} placeholder="対象科目" />
                <input value={form.memo} onChange={(event) => setForm({ ...form, memo: event.target.value })} placeholder="気づいた点・補足情報" />
                <button>投稿</button>
              </form>
              <div className="post-list">
                {posts.length === 0 && <p className="empty">まだ投稿はありません。</p>}
                {posts.map((post) => <article key={post.id}><b>{post.title}</b><p>{post.memo}</p><small>{post.target} / {post.date}</small></article>)}
              </div>
            </div>
          </section>
          <section className="faq-section">
            <h2>FAQ</h2>
            <div className="faq-grid">{faqs.map(([q, a]) => <article key={q}><h3>{q}</h3><p>{a}</p></article>)}</div>
          </section>
        </>
      )}
    </main>
  )
}

export default App
