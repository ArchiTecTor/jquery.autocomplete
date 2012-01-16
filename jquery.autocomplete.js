/*
  в этой версии нет подложки под строку, работает как с внутренним словарем
так и полученным из веб (в формате json массива строк)
*/
(function($){
    
    
    $.fn.autocomplete=function(settings){
        settings=$.extend({
                dictonary: [],
                url: null,
                minChars: 3,
                reqParam: 'word',
                maxResults: 5,
                multipleEnter: false
            },settings);
        
        
        var tempArray=settings.dictonary;
        settings.dictonary={};
        for(var i=0; i<tempArray.length; i++){
            settings.dictonary[tempArray[i]]=i;
        }
        
        return this.each(function(){
            
            var input=$(this)
                .attr({autocomplete:'off'})
                .addClass('autocomplete-input');
            
            var container=$('<div class="autocomplete-container">')
                .css({
                    position:'relative',
                    width: (input.outerWidth()+4)+'px'
                    });
                
            var wordContainer=$('<div class="autocomplete-word-container">')
                .appendTo(container);
                
            input.replaceWith(container);
            input.appendTo(container);
            
            
            var dictonaryContainer=$('<ul class="autocomplete-dictonary-container">')
                .css({
                    position:'absolute',
                    width: input.width()+'px'
                    

                    })
                .hide()
                .appendTo(container);
            
            
            
            function addWord(word){
                if(!word.replace(' ',''))
                    return;
                $('<div class="autocomplete-word">'+word+'<input type="hidden" name="'+input.attr('name')+'" value="'+word+'"/><button class="autocomplete-word-close"></button></div>').appendTo(wordContainer);
                
            }
            
            function findInDictonary(word){
                
                var dictonary=settings.dictonary;
                var outWord=[];
                
                // проверим словарь который уже в памяти
                var regExp=new RegExp('(^| )('+word+')','i');
                
                for(var i in dictonary){
                    
                    
                    if(i.search(regExp)!=-1){
                        outWord.push('<li>'+i.replace(new RegExp(word,'i'),'<strong class="autocomplete-found-word">'+word+'</strong>')+'</li>');
                        if(outWord.length>settings.maxResults)
                            break;
                    }
                }
                return outWord;
            }
            
            
            function checkDictonary(word){
                if(!word){
                    
                    dictonaryContainer.hide();
                    return -1;
                }
                
                
                
                //ищим слово
                var outWord=findInDictonary(word);
                
                if(outWord.length){
                    var position=input.position();
            
                    dictonaryContainer.html(outWord.join('\n'))
                        .css({
                            top: (position.top+input.outerHeight())+'px',
                            left: position.left+'px'
                        })
                        .show();
                    return 1;
                }
                else{
                    dictonaryContainer.hide();
                    return 0;
                }
                
            }
            
            function changeFoundWord(key){
                var active=dictonaryContainer.children('.active');
                if(!active.length){
                    active=dictonaryContainer.children(':first-child');
                }
                else{
                    dictonaryContainer.children().removeClass('active');
                    
                    if(key==40){
                        if(!(active=active.next()).length){
                            active=dictonaryContainer.children(':first-child');
                        }
                    }
                    else if(key==38){
                        if(!(active=active.prev()).length){
                            active=dictonaryContainer.children(':last-child');
                        }
                    }
                }
                active.addClass('active');
                input.data({buffer:active.text()});
            }

            input.on('keydown',
                function(event){
                    switch(event.keyCode){
                        
                        case 220:
                            
                            event.preventDefault();
                            
                            break;
                        case 13:
                            var word=input.attr('value');
                            if(dictonaryContainer.is(':visible') && dictonaryContainer.children('.active').length){
                                
                                
                                input.attr({
                                    value: input.attr('value').replace(/(^| )([a-zA-Z\u00A1-\uFFFF]+)$/i,'$1'+input.data('buffer'))
                                });
                                dictonaryContainer.hide();
                                
                                event.preventDefault();
                                break;
                            }
                            dictonaryContainer.hide();
                            
                            if(settings.multipleEnter){
                                addWord(word);
                                input.attr('value','');
                                event.preventDefault();
                            }
                            
                            
                            
                            break;
                        case 38:
                        case 40:
                        event.preventDefault();
                    }
                })
                .on('keyup',
                    function(event){
                
                switch(event.keyCode){
                    
                    case 27:
                        dictonaryContainer.hide();
                        break;
                    
                    case 37:
                    case 39:
                    case 13:
                        break;
                    
                    case 38:
                    case 40:
                        
                        changeFoundWord(event.keyCode);
                        
                        
                        break;
                    
                    
                        
                    
                    
                    default:
                        var word=input.attr('value');
                        
                        var result=word.match(/(?:\s*)([a-zA-Z\u00A1-\uFFFF]+)$/i);
                
                        if(!result){
                            dictonaryContainer.hide();
                            break;
                        }
                        
                        word=result[1];
                        
                        // проверяем 1 раз, проходим по имеющемуся словарю
                        if(checkDictonary(word)==0 && (word.length % settings.minChars)==0){
                    
                            $.ajax({
                                url: settings.url+'?'+settings.reqParam+'='+encodeURIComponent(word),
                                dataType: 'json',
                                success: function(dict){
                                    
                                    
                                    if(dict.length){
                                        
                                        for(var i=0; i<dict.length; i++){
                                            settings.dictonary[dict[i]]=i;
                                        }
                                        
                                    }
                                }
                            });
                        }
                        // проверяем 2 раз, проходим по дополненному из сети словарю
                        checkDictonary(word);
                        break;        
                }
            })
                .focusout(function(){
                    if(dictonaryContainer.is(':visible')){
                        setTimeout(function(){
                            dictonaryContainer.hide();
                        },300);
                    }
                });
                
            dictonaryContainer.delegate('li','click',function(event){
                var text=input.attr('value').replace(/(^| )([a-zA-Z\u00A1-\uFFFF]+)$/i,'$1'+$(this).text());
                if(!text)
                    text=$(this).text();
                input.attr({
                    value: text
                });
                input.focus();
                
            });
            
            wordContainer.delegate('.autocomplete-word-close','click',function(event){
                $(this).parent('.autocomplete-word').remove();
            });
        });
    };
    
})(jQuery);