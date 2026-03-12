'use strict'; 

const moreButton = document.querySelector('.moreButton');

moreButton.addEventListener('click',()=>{
    
    moreButton.classList.toggle('tileButton__more__active');
    if(moreButton.classList.contains('tileButton__more__active')){
        moreButton.innerHTML = "一部だけ表示";
    }else{
        moreButton.innerHTML = "さらに表示";
    }

    const tileButton__more = document.querySelectorAll('.tileButton__more');
    tileButton__more.forEach(function(item, index){
        item.classList.toggle('tileButton__more__is-open');
        if(item.classList.contains('tileButton__more__is-open')){
            item.style.height = '30vw';
            item.style.marginBottom = '0.6em';
        }else{
            setTimeout(function(){
                item.style.marginBottom = 0;
                item.style.height = 0;
            },200)
        }
    })
})