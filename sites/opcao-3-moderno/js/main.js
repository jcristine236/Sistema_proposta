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
