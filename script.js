const API='https://reelrate-api.bugatticurmitz.workers.dev';
const IMG='https://image.tmdb.org/t/p/w500';
const BACKDROP='https://image.tmdb.org/t/p/original';

// Public creator reviews. Add TMDB movie IDs, your rating, and your review here.
const creatorReviews=[
  {id:8681,rating:9,review:'Taken was a difficult film to watch at times because of its violence and disturbing subject matter. However, the story kept me engaged from beginning to end, and I thought it was very well executed. The acting, especially Liam Neeson’s performance, was excellent and helped make the tension feel convincing. I also liked the film’s fast pace and suspense. I would recommend it to viewers who enjoy intense action thrillers, but younger viewers should be aware that it deals with mature themes, including sexual violence and human trafficking.'}
];

const grid=document.querySelector('#movieGrid');
const creatorGrid=document.querySelector('#creatorGrid');
const form=document.querySelector('#searchForm');
const input=document.querySelector('#searchInput');
const title=document.querySelector('#resultsTitle');
const clear=document.querySelector('#clearSearch');
const empty=document.querySelector('#emptyState');
const creatorEmpty=document.querySelector('#creatorEmpty');
const modal=document.querySelector('#movieModal');
let activeMovie=null;

function escapeHtml(value=''){
  return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function year(date){return date?date.slice(0,4):'—'}
function score(value){return value?Number(value).toFixed(1):'N/A'}
function poster(movie){return movie.poster_path?`${IMG}${movie.poster_path}`:''}
function setLoading(message='Loading movies…'){grid.innerHTML=`<p class="loading">${escapeHtml(message)}</p>`;empty.classList.add('hidden')}
async function api(path){const response=await fetch(`${API}${path}`);if(!response.ok)throw new Error(`API error ${response.status}`);return response.json()}

function render(list){
  grid.innerHTML='';empty.classList.toggle('hidden',list.length>0);
  list.forEach(movie=>{
    const card=document.createElement('article');card.className='movie-card';const image=poster(movie);
    card.innerHTML=`<div class="poster">${image?`<img class="poster-image" src="${image}" alt="${escapeHtml(movie.title)} poster" loading="lazy">`:`<div class="poster-fallback">${escapeHtml(movie.title)}</div>`}<div class="rating"><span>★</span> ${score(movie.vote_average)}</div></div><div class="movie-info"><h3>${escapeHtml(movie.title)}</h3><p>${year(movie.release_date)}</p></div>`;
    card.addEventListener('click',()=>openMovie(movie.id));grid.appendChild(card);
  });
}

async function loadCreatorReviews(){
  creatorGrid.innerHTML='<p class="loading">Loading creator reviews…</p>';
  if(!creatorReviews.length){creatorGrid.innerHTML='';creatorEmpty.classList.remove('hidden');return}
  creatorEmpty.classList.add('hidden');
  const results=await Promise.all(creatorReviews.map(async review=>{try{return {review,movie:await api(`/movie/${review.id}`)}}catch(e){return null}}));
  creatorGrid.innerHTML='';
  results.filter(Boolean).forEach(({review,movie})=>{
    const card=document.createElement('article');card.className='creator-card';const image=poster(movie);
    card.innerHTML=`<button class="creator-poster" aria-label="Open ${escapeHtml(movie.title)}">${image?`<img src="${image}" alt="${escapeHtml(movie.title)} poster" loading="lazy">`:`<span>${escapeHtml(movie.title)}</span>`}</button><div class="creator-review"><p class="eyebrow">MY RATING · ${escapeHtml(review.rating)}/10</p><h3>${escapeHtml(movie.title)} <span>${year(movie.release_date)}</span></h3><p class="review-text">“${escapeHtml(review.review)}”</p><p class="tmdb-score">TMDB rating: ★ ${score(movie.vote_average)}</p></div>`;
    card.querySelector('.creator-poster').addEventListener('click',()=>openMovie(movie.id));creatorGrid.appendChild(card);
  });
  if(!results.filter(Boolean).length){creatorGrid.innerHTML='<p class="loading">Could not load creator reviews. Please refresh and try again.</p>'}
}

async function loadTrending(){title.textContent='Trending now';setLoading();try{const data=await api('/trending');render(data.results||[])}catch(e){showError()}}
async function openMovie(id){
  modal.classList.remove('hidden');document.body.style.overflow='hidden';document.querySelector('#modalTitle').textContent='Loading…';document.querySelector('#modalMeta').textContent='';document.querySelector('#modalDescription').textContent='';
  try{
    const movie=await api(`/movie/${id}`);activeMovie=movie;const genres=(movie.genres||[]).map(g=>g.name).join(' · ');
    document.querySelector('#modalTitle').textContent=movie.title;document.querySelector('#modalMeta').textContent=`${year(movie.release_date)}${genres?' · '+genres:''} · ★ ${score(movie.vote_average)}`;document.querySelector('#modalDescription').textContent=movie.overview||'No description available.';
    const backdrop=document.querySelector('#modalBackdrop');if(movie.backdrop_path){backdrop.style.backgroundImage=`linear-gradient(0deg,rgba(16,19,27,.35),rgba(16,19,27,.15)),url('${BACKDROP}${movie.backdrop_path}')`;backdrop.style.backgroundSize='cover';backdrop.style.backgroundPosition='center'}else{backdrop.style.backgroundImage='linear-gradient(145deg,#202533,#0e1016)'}
    const saved=JSON.parse(localStorage.getItem('reelrate-watchlist')||'[]');document.querySelector('#watchlistButton').textContent=saved.includes(movie.id)?'✓ In watchlist':'+ Watchlist';const own=localStorage.getItem(`reelrate-rating-${movie.id}`);document.querySelector('#rateButton').textContent=own?`★ Your rating: ${own}/10`:'★ Rate movie';
  }catch(e){document.querySelector('#modalTitle').textContent='Could not load movie';document.querySelector('#modalDescription').textContent='Please try again.'}
}
function closeMovie(){modal.classList.add('hidden');document.body.style.overflow=''}
function showError(){grid.innerHTML='<p class="loading">Could not load movies. Please try again.</p>';empty.classList.add('hidden')}

form.addEventListener('submit',async e=>{e.preventDefault();const q=input.value.trim();if(!q)return;title.textContent=`Results for “${q}”`;clear.classList.remove('hidden');setLoading('Searching…');try{const data=await api(`/search?q=${encodeURIComponent(q)}`);render(data.results||[])}catch(e){showError()}});
clear.addEventListener('click',()=>{input.value='';clear.classList.add('hidden');loadTrending()});
document.querySelector('.search-toggle').addEventListener('click',()=>input.focus());document.querySelector('#closeModal').addEventListener('click',closeMovie);modal.addEventListener('click',e=>{if(e.target===modal)closeMovie()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMovie()});
document.querySelector('#watchlistButton').addEventListener('click',()=>{if(!activeMovie)return;let saved=JSON.parse(localStorage.getItem('reelrate-watchlist')||'[]');if(saved.includes(activeMovie.id))saved=saved.filter(id=>id!==activeMovie.id);else saved.push(activeMovie.id);localStorage.setItem('reelrate-watchlist',JSON.stringify(saved));document.querySelector('#watchlistButton').textContent=saved.includes(activeMovie.id)?'✓ In watchlist':'+ Watchlist'});
document.querySelector('#rateButton').addEventListener('click',()=>{if(!activeMovie)return;const value=prompt(`Rate ${activeMovie.title} from 1 to 10:`);const rating=Number(value);if(rating>=1&&rating<=10){localStorage.setItem(`reelrate-rating-${activeMovie.id}`,rating);document.querySelector('#rateButton').textContent=`★ Your rating: ${rating}/10`}});

loadTrending();loadCreatorReviews();