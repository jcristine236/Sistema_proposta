
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
