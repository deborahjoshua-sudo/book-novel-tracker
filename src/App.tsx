
import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, ChevronDown, Globe2, Loader2, Plus, Search, Target, Trash2 } from 'lucide-react';

type Book = {
  id: number;
  title: string;
  author: string;
  genre: string;
  status: string;
  progress: number;
  rating: number;
  note: string;
  quote: string;
  coverUrl?: string;
};

type SearchBook = {
  key: string;
  title: string;
  author: string;
  year?: number;
  coverId?: number;
  subjects?: string[];
};

const seed: Book[] = [
  { id: 1, title: 'The Seven Husbands of Evelyn Hugo', author: 'Taylor Jenkins Reid', genre: 'Fiction', status: 'Completed', progress: 100, rating: 5, note: 'Beautiful character-driven story.', quote: 'Make them pay attention.' },
  { id: 2, title: 'Atomic Habits', author: 'James Clear', genre: 'Self-development', status: 'Currently Reading', progress: 42, rating: 0, note: '', quote: '' },
  { id: 3, title: 'The Midnight Library', author: 'Matt Haig', genre: 'Fiction', status: 'Want to Read', progress: 0, rating: 0, note: '', quote: '' },
];

function App() {
  const [books, setBooks] = useState<Book[]>(() => JSON.parse(localStorage.getItem('book-tracker') || 'null') || seed);
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalog, setCatalog] = useState<SearchBook[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [goal, setGoal] = useState(12);
  const [newBook, setNewBook] = useState({ title: '', author: '', genre: 'Fiction', status: 'Want to Read' });

  useEffect(() => localStorage.setItem('book-tracker', JSON.stringify(books)), [books]);

  const visible = useMemo(() => books.filter(b =>
    (filter === 'All' || b.status === filter) &&
    `${b.title} ${b.author}`.toLowerCase().includes(query.toLowerCase())
  ), [books, filter, query]);

  const completed = books.filter(b => b.status === 'Completed').length;
  const readingBooks = books.filter(b => b.status === 'Currently Reading');
  const progress = readingBooks.reduce((a, b) => a + b.progress, 0);

  const searchCatalog = async () => {
    const q = catalogQuery.trim();
    if (!q) return;
    setSearching(true);
    setSearchMessage('');
    try {
      const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=12&fields=key,title,author_name,first_publish_year,cover_i,subject`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      const results: SearchBook[] = (data.docs || []).map((item: any) => ({
        key: item.key || `${item.title}-${item.author_name?.[0] || ''}`,
        title: item.title || 'Untitled',
        author: item.author_name?.[0] || 'Unknown author',
        year: item.first_publish_year,
        coverId: item.cover_i,
        subjects: item.subject?.slice(0, 3),
      }));
      setCatalog(results);
      if (!results.length) setSearchMessage('No books found. Try another author or title.');
    } catch {
      setCatalog([]);
      setSearchMessage('We could not reach the book catalog. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const addCatalogBook = (result: SearchBook) => {
    if (books.some(b => b.title.toLowerCase() === result.title.toLowerCase() && b.author.toLowerCase() === result.author.toLowerCase())) {
      setSearchMessage('That book is already in your library.');
      return;
    }
    setBooks([...books, {
      id: Date.now(),
      title: result.title,
      author: result.author,
      genre: result.subjects?.[0] || 'Fiction',
      status: 'Want to Read',
      progress: 0,
      rating: 0,
      note: '',
      quote: '',
      coverUrl: result.coverId ? `https://covers.openlibrary.org/b/id/${result.coverId}-M.jpg` : undefined,
    }]);
    setSearchMessage(`Added “${result.title}” to your library.`);
  };

  const addBook = () => {
    if (!newBook.title.trim()) return;
    setBooks([...books, {
      ...newBook,
      id: Date.now(),
      progress: newBook.status === 'Completed' ? 100 : 0,
      rating: 0,
      note: '',
      quote: '',
    }]);
    setNewBook({ title: '', author: '', genre: 'Fiction', status: 'Want to Read' });
    setShowAdd(false);
  };

  const updateBook = (id: number, patch: Partial<Book>) => setBooks(books.map(b => b.id === id ? { ...b, ...patch } : b));

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="logo"><BookOpen size={21} /></div>
          <div><strong>My Library</strong><span>Book & Novel Tracker</span></div>
        </div>
        <button className="primary" onClick={() => setShowAdd(true)}><Plus size={17} /> Add book</button>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">Discover stories from everywhere</p>
          <h1>Read more. Remember more.</h1>
          <p className="muted">Track your reading and discover books by African and international writers in one place.</p>
        </div>
        <div className="goal-card">
          <div className="goal-icon"><Target size={18} /></div>
          <div><b>{completed} / {goal}</b><span>books completed this goal</span></div>
          <input aria-label="Reading goal" type="number" min="1" value={goal} onChange={e => setGoal(Number(e.target.value) || 1)} />
        </div>
      </section>

      <section className="discover-card">
        <div className="discover-heading">
          <div>
            <span className="discover-kicker"><Globe2 size={15} /> Global book discovery</span>
            <h2>Find any author or book</h2>
            <p>Search a large public catalog for writers from Africa and around the world — including authors not already featured in the app.</p>
          </div>
        </div>
        <div className="catalog-search">
          <Search size={18} />
          <input
            aria-label="Search the book catalog"
            placeholder="Try Ana Huang, Chimamanda Ngozi Adichie, or a book title..."
            value={catalogQuery}
            onChange={e => setCatalogQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchCatalog()}
          />
          <button className="primary" onClick={searchCatalog} disabled={searching}>
            {searching ? <Loader2 className="spin" size={17} /> : <Search size={17} />}
            {searching ? 'Searching' : 'Search'}
          </button>
        </div>
        {searchMessage && <p className="search-message">{searchMessage}</p>}
        {catalog.length > 0 && (
          <div className="catalog-grid">
            {catalog.map(result => (
              <article className="catalog-result" key={result.key}>
                <div className="catalog-cover">
                  {result.coverId ? <img src={`https://covers.openlibrary.org/b/id/${result.coverId}-M.jpg`} alt="" /> : <BookOpen size={25} />}
                </div>
                <div className="catalog-info">
                  <h3>{result.title}</h3>
                  <p>{result.author}</p>
                  {result.year && <small>First published {result.year}</small>}
                  <button className="add-result" onClick={() => addCatalogBook(result)}><Plus size={14} /> Add to library</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="stats">
        <div><span>Library</span><b>{books.length}</b></div>
        <div><span>Reading now</span><b>{readingBooks.length}</b></div>
        <div><span>Completed</span><b>{completed}</b></div>
        <div><span>Reading progress</span><b>{readingBooks.length ? Math.round(progress / readingBooks.length) : 0}%</b></div>
      </section>

      <section className="toolbar">
        <div className="tabs">
          {['All', 'Currently Reading', 'Completed', 'Want to Read'].map(s => (
            <button className={filter === s ? 'active' : ''} onClick={() => setFilter(s)} key={s}>{s}</button>
          ))}
        </div>
        <label className="search"><Search size={17} /><input placeholder="Search my library" value={query} onChange={e => setQuery(e.target.value)} /></label>
      </section>

      <section className="book-grid">
        {visible.map(book => (
          <article className="book-card" key={book.id}>
            <div className="cover">
              {book.coverUrl ? <img src={book.coverUrl} alt="" /> : <BookOpen size={30} />}
              <small>{book.genre}</small>
            </div>
            <div className="book-main">
              <div className="book-heading">
                <div><h2>{book.title}</h2><p>by {book.author}</p></div>
                <button className="icon-btn" title="Delete" onClick={() => setBooks(books.filter(b => b.id !== book.id))}><Trash2 size={16} /></button>
              </div>
              <div className="status-row">
                <span className={`pill ${book.status.replaceAll(' ', '-').toLowerCase()}`}>{book.status}</span>
                {book.rating > 0 && <span className="stars">{'★'.repeat(book.rating)}{'☆'.repeat(5 - book.rating)}</span>}
              </div>
              {book.status === 'Currently Reading' && <div className="progress"><div><span>Reading progress</span><b>{book.progress}%</b></div><input aria-label={`Progress for ${book.title}`} type="range" min="0" max="100" value={book.progress} onChange={e => updateBook(book.id, { progress: Number(e.target.value) })} /></div>}
              <div className="book-fields">
                <label>Rating <select value={book.rating} onChange={e => updateBook(book.id, { rating: Number(e.target.value) })}><option value="0">Not rated</option>{[1,2,3,4,5].map(n => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}</select></label>
                <label>Status <select value={book.status} onChange={e => updateBook(book.id, { status: e.target.value, progress: e.target.value === 'Completed' ? 100 : book.progress })}><option>Want to Read</option><option>Currently Reading</option><option>Completed</option></select></label>
              </div>
              <label className="text-field">Personal note<textarea value={book.note} onChange={e => updateBook(book.id, { note: e.target.value })} placeholder="What did you think?" /></label>
              <label className="text-field">Favorite quote<textarea value={book.quote} onChange={e => updateBook(book.id, { quote: e.target.value })} placeholder="Save a line you loved..." /></label>
            </div>
          </article>
        ))}
        {visible.length === 0 && <div className="empty"><BookOpen size={30} /><h2>No books found</h2><p>Try another search or add a new book.</p></div>}
      </section>

      {showAdd && <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && setShowAdd(false)}>
        <div className="modal">
          <div className="modal-head"><div><p className="eyebrow">New addition</p><h2>Add a book</h2></div><button className="icon-btn" onClick={() => setShowAdd(false)}><ChevronDown size={19} /></button></div>
          <label>Title<input autoFocus value={newBook.title} onChange={e => setNewBook({ ...newBook, title: e.target.value })} /></label>
          <label>Author<input value={newBook.author} onChange={e => setNewBook({ ...newBook, author: e.target.value })} /></label>
          <label>Genre<select value={newBook.genre} onChange={e => setNewBook({ ...newBook, genre: e.target.value })}><option>Fiction</option><option>Romance</option><option>Mystery</option><option>Fantasy</option><option>Self-development</option><option>Biography</option><option>African Literature</option></select></label>
          <label>Status<select value={newBook.status} onChange={e => setNewBook({ ...newBook, status: e.target.value })}><option>Want to Read</option><option>Currently Reading</option><option>Completed</option></select></label>
          <button className="primary full" onClick={addBook}><Check size={17} /> Save book</button>
        </div>
      </div>}
    </main>
  );
}

export default App;
