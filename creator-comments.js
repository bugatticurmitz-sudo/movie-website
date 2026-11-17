// Public comment threads beneath Creator's Movies reviews.
async function loadCreatorComments(movieId,host){
  const list=host.querySelector('.creator-comment-list');
  list.textContent='Loading comments…';
  const {data,error}=await db.from('creator_comments').select('id,user_id,body,created_at').eq('movie_id',movieId).order('created_at',{ascending:false}).limit(100);
  if(error){list.textContent='Comments are not available yet. The site owner needs to enable the comments database.';return}
  list.replaceChildren();
  if(!data.length){list.textContent='No comments yet. Start the conversation!';return}
  for(const c of data){
    const item=document.createElement('div');item.className='creator-comment';
    const head=document.createElement('div');head.className='creator-comment-head';
    const who=document.createElement('strong');who.textContent=c.user_id===currentUser?.id?'You':'ReelRate member';
    const date=document.createElement('small');date.textContent=new Date(c.created_at).toLocaleDateString();
    head.append(who,date);
    const body=document.createElement('p');body.textContent=c.body;
    item.append(head,body);
    if(c.user_id===currentUser?.id){
      const del=document.createElement('button');del.type='button';del.className='text-button';del.textContent='Delete';
      del.addEventListener('click',async()=>{
        if(!confirm('Delete your comment?'))return;
        del.disabled=true;
        const {error}=await db.from('creator_comments').delete().eq('id',c.id).eq('user_id',currentUser.id);
        if(error){del.disabled=false;alert('Could not delete comment.');return}
        loadCreatorComments(movieId,host);
      });item.append(del);
    }
    list.append(item);
  }
}
function addCreatorComments(card,movieId){
  const host=document.createElement('section');host.className='creator-comments';
  const heading=document.createElement('h4');heading.textContent='Comments';
  const list=document.createElement('div');list.className='creator-comment-list';list.textContent='Loading comments…';
  const form=document.createElement('form');form.className='creator-comment-form';
  const field=document.createElement('textarea');field.placeholder='Share your thoughts about this review…';field.maxLength=1000;field.required=true;field.rows=2;field.setAttribute('aria-label','Your comment');
  const button=document.createElement('button');button.className='primary-button';button.type='submit';button.textContent='Post comment';
  const status=document.createElement('p');status.className='creator-comment-status';status.setAttribute('role','status');
  form.append(field,button,status);
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    if(!requireUser())return;
    const body=field.value.trim();if(!body)return;
    button.disabled=true;status.textContent='Posting…';
    const {error}=await db.from('creator_comments').insert({movie_id:movieId,user_id:currentUser.id,body});
    button.disabled=false;
    if(error){status.textContent='Could not post comment. Please try again.';return}
    field.value='';status.textContent='Comment posted.';
    loadCreatorComments(movieId,host);
  });
  host.append(heading,list,form);
  card.querySelector('.creator-review').append(host);
  loadCreatorComments(movieId,host);
}
