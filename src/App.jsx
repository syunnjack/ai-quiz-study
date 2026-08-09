import { useMemo, useState } from 'react'
import './App.css'

const saveKey = 'ai-quiz-study.saved'
const postKey = 'ai-quiz-study.posts'
const items = [
  {
    "id": "ai-quiz-study-1",
    "title": "行政法 一問一答セット",
    "area": "名古屋会場向け",
    "category": "行政法",
    "score": 94,
    "summary": "行政事件訴訟法・行政手続法・国家賠償法などを中心にした行政法の一問一答セットです。条文の趣旨と判例のポイントを短い解説つきで確認できます。",
    "tags": ["行政法", "条文", "判例"],
  },
  {
    "id": "ai-quiz-study-2",
    "title": "民法 一問一答セット",
    "area": "東京会場向け",
    "category": "民法",
    "score": 90,
    "summary": "総則・物権・債権・親族・相続の頻出テーマを中心にした民法の一問一答セットです。間違えやすい判例・条文の言い回しを重点的に扱っています。",
    "tags": ["民法", "条文", "判例"],
  },
  {
    "id": "ai-quiz-study-3",
    "title": "憲法 一問一答セット",
    "area": "大阪会場向け",
    "category": "憲法",
    "score": 86,
    "summary": "人権分野・統治機構それぞれの頻出論点を中心にした憲法の一問一答セットです。重要判例の結論と理由づけをセットで確認できます。",
    "tags": ["憲法", "人権", "統治機構"],
  },
  {
    "id": "ai-quiz-study-4",
    "title": "商法・会社法 一問一答セット",
    "area": "静岡会場向け",
    "category": "商法",
    "score": 82,
    "summary": "商法総則・会社法の設立・機関設計などを中心にした一問一答セットです。出題頻度の高い数字・要件を整理して確認できます。",
    "tags": ["商法", "会社法"],
  }
]
const faqs = [
  ['無料で使えますか？', 'はい、会員登録なしで無料でご利用いただけます。'],
  ['保存した問題セットはどこに残りますか？', 'ご利用の端末（ブラウザ）にのみ保存されます。他の端末とは共有されないため、機種変更やブラウザのデータ削除で消える点にご注意ください。'],
  ['行政書士以外の資格にも対応していますか？', '現在は行政書士試験の科目（行政法・民法・憲法・商法）のみです。他資格への対応は今後検討していきます。'],
  ['投稿した口コミ・訂正情報は誰が見られますか？', '現在は投稿者ご本人の端末内のみで保存される試験運用です。全体への公開は準備中です。'],
]

function readArray(key) {
  try { return JSON.parse(localStorage.getItem(key)) ?? [] } catch { return [] }
}

function App() {
  const [query, setQuery] = useState('名古屋')
  const [category, setCategory] = useState('すべて')
  const [saved, setSaved] = useState(() => readArray(saveKey))
  const [posts, setPosts] = useState(() => readArray(postKey))
  const [form, setForm] = useState({ title: '', target: '行政法', memo: '' })
  const categories = ['すべて', ...new Set(items.map((item) => item.category))]

  const filtered = useMemo(() => items.filter((item) => {
    const text = [item.title, item.area, item.category, item.summary, item.tags.join(' ')].join(' ')
    return text.includes(query) && (category === 'すべて' || item.category === category)
  }), [query, category])

  function toggleSave(id) {
    const next = saved.includes(id) ? saved.filter((item) => item !== id) : [...saved, id]
    setSaved(next)
    localStorage.setItem(saveKey, JSON.stringify(next))
  }

  function addPost(event) {
    event.preventDefault()
    if (!form.title.trim() || !form.memo.trim()) return
    const next = [{ ...form, id: crypto.randomUUID(), date: new Date().toLocaleDateString('ja-JP') }, ...posts]
    setPosts(next)
    localStorage.setItem(postKey, JSON.stringify(next))
    setForm({ title: '', target: '行政法', memo: '' })
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">資格試験・一問一答</p>
          <h1>AI Quiz Study</h1>
          <p className="lead">行政書士試験の科目別に、一問一答形式で知識を確認できる学習アプリです。すきま時間に気になる科目だけ選んで取り組めます。</p>
        </div>
        <aside className="hero-panel">
          <span>aiichimon.jp</span>
          <strong>科目を選んで、すぐに一問一答。</strong>
          <p>会員登録は不要です。気になる問題セットを保存しておけば、次に開いたときすぐに続きから取り組めます。</p>
        </aside>
      </section>
      <section className="controls" aria-label="検索条件">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="科目名などで検索" />
        <select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select>
      </section>
      <section className="metrics">
        <article><span>収録セット数</span><strong>{items.length}</strong></article>
        <article><span>保存した問題セット</span><strong>{saved.length}</strong></article>
        <article><span>みんなの投稿</span><strong>{posts.length}</strong></article>
      </section>
      <section className="card-grid">
        {filtered.map((item) => (
          <article className="data-card" key={item.id}>
            <div className="card-top"><span>{item.area} / {item.category}</span><b>{item.score}</b></div>
            <h2>{item.title}</h2>
            <p>{item.summary}</p>
            <div className="tag-row">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            <button type="button" onClick={() => toggleSave(item.id)}>{saved.includes(item.id) ? '保存済み' : 'この問題セットを保存'}</button>
          </article>
        ))}
      </section>
      <section className="split">
        <div className="panel">
          <h2>このサービスについて</h2>
          <article><b>収録内容</b><p>行政書士試験の科目（行政法・民法・憲法・商法）ごとに、頻出論点を一問一答形式でまとめています。</p></article>
          <article><b>データの保存先</b><p>保存した問題セットやみんなの投稿は、お使いの端末（ブラウザ）にのみ記録されます。サーバーには送信されません。</p></article>
          <article><b>今後の対応予定</b><p>科目・問題数を順次追加していく予定です。行政書士以外の資格への対応は検討中です。</p></article>
        </div>
        <div className="panel">
          <h2>みんなの投稿</h2>
          <p>問題セットの誤りに気づいた、補足情報を共有したい、という場合にご利用ください。</p>
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
    </main>
  )
}

export default App
