/* REFRIMAIA: Opção 2 · Efeitos */
(function(){
var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.querySelectorAll('[data-year]').forEach(function(e){e.textContent=new Date().getFullYear();});

// menu mobile
var t=document.querySelector('.nav-toggle'),n=document.querySelector('.nav');
t&&t.addEventListener('click',function(){var o=document.body.classList.toggle('menu-open');t.setAttribute('aria-expanded',o);});

// header + barra de progresso + parallax
var h=document.querySelector('.header'),pb=document.querySelector('.progress'),px=[].slice.call(document.querySelectorAll('.parallax'));
var th=document.querySelector('.thermo'),tv=th&&th.querySelector('.thermo-v'),tb=th&&th.querySelector('.thermo-bar b');
function onScroll(){var y=window.scrollY,max=document.documentElement.scrollHeight-innerHeight;
  h.classList.toggle('scrolled',y>30);var pr=max>0?y/max:0;pb.style.transform='scaleX('+pr+')';
  if(tv){tv.textContent=(32-25*pr).toFixed(1);tb.style.transform='scaleX('+(1-pr*.78)+')';th.classList.toggle('cold',pr>.6);}
  if(!reduce)px.forEach(function(el){var r=el.getBoundingClientRect(),c=r.top+r.height/2-innerHeight/2;var v=Math.max(-60,Math.min(60,-c*parseFloat(el.dataset.speed||.1)));el.style.transform='translateY('+v+'px)';});
  var tl=document.querySelector('.timeline');if(tl){var r=tl.getBoundingClientRect(),p=Math.min(1,Math.max(0,(innerHeight*.6-r.top)/r.height));tl.querySelector('.tl-line i').style.transform='scaleY('+p+')';}
}
window.addEventListener('scroll',onScroll,{passive:true});onScroll();

// divide títulos em palavras para animar
document.querySelectorAll('.split-words').forEach(function(el){
  var w=el.textContent.trim().split(/\s+/);el.setAttribute('aria-label',el.textContent.trim());
  el.innerHTML=w.map(function(x,i){return '<span class="w" aria-hidden="true"><span style="transition-delay:'+(i*0.05)+'s">'+x+'</span></span>';}).join(' ');
  el.classList.add('reveal');
});

// contadores
function count(el){var to=+el.dataset.count,st=null,d=1600;
  function step(ts){if(!st)st=ts;var p=Math.min(1,(ts-st)/d),e=1-Math.pow(1-p,3);el.textContent=Math.round(to*e);if(p<1)requestAnimationFrame(step);}
  reduce?el.textContent=to:requestAnimationFrame(step);}

// revelação ao rolar
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;var el=e.target;el.classList.add('in');
  el.querySelectorAll('[data-count]').forEach(count);if(el.matches('[data-count]'))count(el);
  el.querySelectorAll('[data-gauge]').forEach(function(g){g.style.strokeDashoffset=327*(1-g.dataset.gauge);});
  io.unobserve(el);});},{threshold:.15});
document.querySelectorAll('.reveal,.stat,.feature-media').forEach(function(el){io.observe(el);});

// palavra rotativa no hero
var rot=document.querySelector('.rotator');
if(rot){var bs=rot.querySelectorAll('b'),i=0;bs[0].classList.add('on');
  setInterval(function(){bs[i].classList.remove('on');bs[i].classList.add('out');var old=bs[i];setTimeout(function(){old.classList.remove('out');},700);i=(i+1)%bs.length;bs[i].classList.add('on');},2600);}

// cards com inclinação 3D e brilho que segue o mouse
if(!reduce&&matchMedia('(hover:hover)').matches){
  document.querySelectorAll('.tilt').forEach(function(c){
    c.addEventListener('mousemove',function(e){var r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
      c.style.setProperty('--mx',x*100+'%');c.style.setProperty('--my',y*100+'%');
      c.style.transform='perspective(800px) rotateX('+((.5-y)*6)+'deg) rotateY('+((x-.5)*8)+'deg) translateY(-4px)';});
    c.addEventListener('mouseleave',function(){c.style.transform='';});
  });
  document.querySelectorAll('.magnetic').forEach(function(b){
    b.addEventListener('mousemove',function(e){var r=b.getBoundingClientRect();b.style.transform='translate('+((e.clientX-r.left-r.width/2)*.18)+'px,'+((e.clientY-r.top-r.height/2)*.25)+'px)';});
    b.addEventListener('mouseleave',function(){b.style.transform='';});
  });
}

// partículas de ar frio (canvas)
document.querySelectorAll('canvas.air').forEach(function(cv){
  var ctx=cv.getContext('2d'),W,H,P=[],mx=-999,my=-999,dpr=Math.min(2,window.devicePixelRatio||1);
  function size(){W=cv.offsetWidth;H=cv.offsetHeight;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
    var q=Math.round(W*H/9000);P=[];for(var k=0;k<q;k++)P.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.8+.3,vx:Math.random()*.6+.15,vy:(Math.random()-.5)*.25,a:Math.random()*.6+.2});}
  size();addEventListener('resize',size);
  cv.parentElement.addEventListener('mousemove',function(e){var r=cv.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top;});
  cv.parentElement.addEventListener('mouseleave',function(){mx=my=-999;});
  var vis=true;new IntersectionObserver(function(es){vis=es[0].isIntersecting;}).observe(cv);
  function draw(){requestAnimationFrame(draw);if(!vis)return;ctx.clearRect(0,0,W,H);
    for(var k=0;k<P.length;k++){var p=P[k],dx=p.x-mx,dy=p.y-my,d=dx*dx+dy*dy;
      if(d<14000){var f=(14000-d)/14000;p.x+=dx*f*.04;p.y+=dy*f*.04;}
      p.x+=p.vx;p.y+=p.vy+Math.sin((p.x+k)*.01)*.15;if(p.x>W+5){p.x=-5;p.y=Math.random()*H;}if(p.y<-5)p.y=H+5;if(p.y>H+5)p.y=-5;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.283);ctx.fillStyle='rgba(120,220,245,'+p.a+')';ctx.fill();
      for(var j=k+1;j<Math.min(k+6,P.length);j++){var o=P[j],ex=p.x-o.x,ey=p.y-o.y,dd=ex*ex+ey*ey;if(dd<5000){ctx.strokeStyle='rgba(44,180,212,'+(.12*(1-dd/5000))+')';ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(o.x,o.y);ctx.stroke();}}
    }}
  if(!reduce)draw();else{draw=function(){};}
});
})();


/* Formulário de orçamento: monta a mensagem e abre o WhatsApp da Refrimaia.
   Para enviar por e-mail/servidor, troque esta função por um envio (ex.: PHP, Formspree). */
(function(){
  var f=document.querySelector('[data-orcamento]'); if(!f) return;
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var d=new FormData(f), linhas=['*Solicitação de orçamento: site*'];
    d.forEach(function(v,k){ if(String(v).trim()) linhas.push('*'+k+':* '+v); });
    var ok=f.querySelector('.form-ok'); if(ok){ok.hidden=false;}
    window.open('https://wa.me/5511940054773?text='+encodeURIComponent(linhas.join('\n')),'_blank');
  });
})();

/* Fotos: uma "cortina" na cor da marca recolhe quando a foto aparece na tela */
(function(){
  var ph=document.querySelectorAll('.photo.has-img');if(!ph.length||!('IntersectionObserver' in window))return;
  document.documentElement.classList.add('js-photos');
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('shown');io.unobserve(e.target);}});},{threshold:.15});
  ph.forEach(function(p){io.observe(p);});
})();
