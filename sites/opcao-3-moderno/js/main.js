/* REFRIMAIA – Opção 3 · Moderno */
(function(){
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
document.querySelectorAll('[data-year]').forEach(function(e){e.textContent=new Date().getFullYear();});
var t=document.querySelector('.nav-toggle');
t&&t.addEventListener('click',function(){var o=document.body.classList.toggle('menu-open');t.setAttribute('aria-expanded',o);});
var h=document.querySelector('.header');
addEventListener('scroll',function(){h.classList.toggle('scrolled',scrollY>20);},{passive:true});

function count(el){var to=+el.dataset.count,s=null;if(reduce){el.textContent=to;return;}
  (function f(ts){if(!s)s=ts;var p=Math.min(1,(ts-s)/1400);el.textContent=Math.round(to*(1-Math.pow(1-p,4)));if(p<1)requestAnimationFrame(f);})(performance.now());}
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;e.target.classList.add('in');
  e.target.querySelectorAll('[data-count]').forEach(count);io.unobserve(e.target);});},{threshold:.15});
document.querySelectorAll('.reveal').forEach(function(el,i){el.style.setProperty('--i',i%4);io.observe(el);});

// carrossel horizontal: setas + arrastar
var hs=document.querySelector('.hscroll');
if(hs){
  document.querySelectorAll('[data-scroll]').forEach(function(b){b.addEventListener('click',function(){hs.scrollBy({left:+b.dataset.scroll*hs.clientWidth*.6,behavior:'smooth'});});});
  var down=false,sx,sl,moved=false;
  hs.addEventListener('pointerdown',function(e){if(e.pointerType!=='mouse')return;down=true;moved=false;sx=e.clientX;sl=hs.scrollLeft;hs.classList.add('drag');});
  addEventListener('pointerup',function(){down=false;hs.classList.remove('drag');});
  hs.addEventListener('pointermove',function(e){if(!down)return;var dx=e.clientX-sx;if(Math.abs(dx)>4)moved=true;hs.scrollLeft=sl-dx;});
  hs.addEventListener('click',function(e){if(moved){e.preventDefault();moved=false;}},true);
}

// abas de serviços (abre a aba pelo #hash também)
var tabs=[].slice.call(document.querySelectorAll('[role=tab]'));
function sel(id,focus){tabs.forEach(function(b){var on=b.getAttribute('aria-controls')===id;b.setAttribute('aria-selected',on);b.tabIndex=on?0:-1;
  var p=document.getElementById(b.getAttribute('aria-controls'));p.hidden=!on;if(on){p.classList.remove('show');void p.offsetWidth;p.classList.add('show');if(focus)b.focus();}});}
tabs.forEach(function(b,i){b.addEventListener('click',function(){sel(b.getAttribute('aria-controls'));history.replaceState(null,'','#'+b.getAttribute('aria-controls'));});
  b.addEventListener('keydown',function(e){var k=e.key==='ArrowRight'||e.key==='ArrowDown'?1:e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:0;if(k){e.preventDefault();sel(tabs[(i+k+tabs.length)%tabs.length].getAttribute('aria-controls'),true);}});});
if(tabs.length&&location.hash){var id=location.hash.slice(1);if(document.getElementById('t-'+id)){sel(id);setTimeout(function(){document.querySelector('.tabs').scrollIntoView({block:'start'});},50);}}

})();

// zoom suave da foto principal conforme a rolagem
var hp=document.querySelector('.hero-photo');
if(hp&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
  var zf=function(){var r=hp.getBoundingClientRect(),p=Math.min(1,Math.max(0,1-(r.top/innerHeight)));hp.style.setProperty('--z',(1.1-.1*p).toFixed(4));};
  addEventListener('scroll',zf,{passive:true});zf();
}

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
