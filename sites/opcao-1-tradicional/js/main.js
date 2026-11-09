
document.querySelectorAll('[data-year]').forEach(function(e){e.textContent=new Date().getFullYear();});
// menu mobile
var t=document.querySelector('.nav-toggle'),n=document.querySelector('.nav');
if(t){t.addEventListener('click',function(){var o=n.classList.toggle('open');t.setAttribute('aria-expanded',o);});}
// sombra no cabeçalho ao rolar
var h=document.querySelector('.header');
window.addEventListener('scroll',function(){h.classList.toggle('scrolled',window.scrollY>10);},{passive:true});
// animação suave de entrada
if('IntersectionObserver' in window){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.12});
  document.querySelectorAll('.reveal').forEach(function(el){io.observe(el);});
}else{document.querySelectorAll('.reveal').forEach(function(el){el.classList.add('in');});}


/* Formulário de orçamento: monta a mensagem e abre o WhatsApp da Refrimaia.
   Para enviar por e-mail/servidor, troque esta função por um envio (ex.: PHP, Formspree). */
(function(){
  var f=document.querySelector('[data-orcamento]'); if(!f) return;
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var d=new FormData(f), linhas=['*Solicitação de orçamento – site*'];
    d.forEach(function(v,k){ if(String(v).trim()) linhas.push('*'+k+':* '+v); });
    var ok=f.querySelector('.form-ok'); if(ok){ok.hidden=false;}
    window.open('https://wa.me/5511940054773?text='+encodeURIComponent(linhas.join('\n')),'_blank');
  });
})();

/* Prévia de foto que acompanha o cursor na lista de serviços */
(function(){
  var box=document.querySelector('[data-preview]');
  if(!box||!matchMedia('(hover:hover) and (pointer:fine)').matches)return;
  var img=box.querySelector('.sr-prev'),x=0,y=0,cx=0,cy=0,raf=0;
  box.addEventListener('mouseover',function(e){var a=e.target.closest('a[data-img]');if(!a)return;
    if(img.getAttribute('src')!==a.dataset.img)img.src=a.dataset.img;box.classList.add('show');});
  box.addEventListener('mouseleave',function(){box.classList.remove('show');});
  box.addEventListener('mousemove',function(e){x=e.clientX;y=e.clientY;if(!raf)raf=requestAnimationFrame(loop);});
  function loop(){cx+=(x-cx)*.16;cy+=(y-cy)*.16;img.style.transform='translate3d('+(cx+28)+'px,'+(cy-110)+'px,0) rotate('+((x-cx)*.04)+'deg)';
    raf=(Math.abs(x-cx)+Math.abs(y-cy)>.4)?requestAnimationFrame(loop):0;}
})();
/* Fotos entram com uma "cortina" ao aparecer na tela */
(function(){
  var ph=document.querySelectorAll('.photo.has-img');if(!ph.length||!('IntersectionObserver' in window))return;
  document.documentElement.classList.add('js-photos');
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('shown');io.unobserve(e.target);}});},{threshold:.2});
  ph.forEach(function(p){io.observe(p);});
})();
