$( document ).ready(function() {
    $('body').on('keyup', '#checkout_place', function(){
        delay(function(){
            if ($('#checkout_place').val().length > 2) {
                $('.ui-autocomplete').addClass('f-dropdown');
                get_place_by_query($('#checkout_place').val())
            }
        }, 1000 );

    });

    $('body').on('change', '.select_delivery_checkout', function(){
        var option = $('.delivery_check:checked').siblings('select').find('option:selected')
    });

    $('body').on('click', '.delivery_check', function(){
        $(this).siblings().removeClass('hide')
        $('.delivery_check:unchecked').siblings().addClass('hide')
    });

    $('body').on('keyup', '#checkout_street', function(){
        delay(function(){
            if ($('#checkout_street').val().length > 2) {
                get_street_by_query($('#checkout_street').val())
            }
        }, 1000 );
    });

    $('body').on('click', '.ship_method', function(){
        if  ($('#checkout_place').attr('placeId')!=undefined){
            calculation( $('#checkout_place').attr('placeId'))
        }
    })
    $('body').on('click', '#checkout_save', function(){
        var params = {}
        params['firstname'] = $('#checkout_firstname').val()
        params['lastname'] = $('#checkout_lastname').val()
        params['phone'] = $('#checkout_phone').val()
        var deliveryMethod = $('input[name=delivery]:checked').val()
        params['ship_method'] = $('input[name=ship_method]:checked').val()
        if  ($.inArray(deliveryMethod,["pvz", "postamat"]) > -1){
            var select =  $("#select_"+deliveryMethod+"")
            var option =  select.find('option:selected')
            params["deliveryMethod"] = deliveryMethod
            params["placeId"] = select.data('place')
            params["street"] = option.attr('place')
            params["cost"] = option.attr('cost')
            params["deliveryId"] = option.val()
            params["minTerm"] = option.attr('min')
            params["maxTerm"] = option.attr('max')
        }
        else
        {
            params["deliveryMethod"] = deliveryMethod
            params["placeId"] = $('#express').attr('place')
            params["streetId"] = $('#checkout_street').attr('streetId')
            params["cost"] = $('#express').attr('cost')
            params["deliveryId"] = $('#express').attr('delivery')
            params["minTerm"] = $('#express').attr('min')
            params["maxTerm"] = $('#express').attr('max')
            params["house"] = $('#checkout_house').val()
            params["housing"] = $('#checkout_housing').val()
            params["building"] = $('#checkout_building').val()
            params["appartment"] = $('#checkout_appartment').val()
        }
        $.ajax({
            url: '/checkout/create_checkout_order',
            type: 'POST',
            data: params
        })  .always(function( data ) {
                if (JSON.parse(data.responseText).code != 200) {
                    $('<span class="wait">'+$(JSON.parse(data.responseText).body).find('u').get(0).innerHTML+'</span>').insertBefore('#checkout_save')
                }
                else{
                    $('<span class="wait">Заказ успешно создан</span>').insertBefore('#checkout_save')
                }
            });
        return false
    });
});
var delay = (function(){
    var timer = 0;
    return function(callback, ms){
        clearTimeout (timer);
        timer = setTimeout(callback, ms);
    };
})();

get_place_by_query = function(text){
    $('<span class="wait">Поиск населенного пункта</span>').insertAfter('#checkout_place')
    $.ajax({
        url: '/checkout/get_place_by_query',
        type: 'POST',
        data:{
            query:encodeURIComponent(text)}
    })  .always(function( data ) {
            var items = [];
            var placeIds = [];
            request = JSON.parse(data.responseText);
            for (var i in request['suggestions']) {
                items.push(request['suggestions'][i]["fullName"])
                placeIds.push(request['suggestions'][i]["id"])
            }

            $( "#checkout_place" ).autocomplete({
                source: items,
                minLength: 0,
                select: function (item,place) {
                    i = jQuery.inArray(place.item.value , items)
                    var placeId
                    placeId = placeIds[i]
                    console.log(placeId)
                    $('#checkout_place').attr('placeId', placeId)
                    calculation(placeId)
                }
            });
            $('body').on('click', '#checkout_place', function(){
                $("#checkout_place").autocomplete("search", '');
            });
            $("#checkout_place").autocomplete("search", '');
            $('.wait').remove()
        });
}

get_street_by_query = function(text){
    $('<span class="wait">Поиск улиц</span>').insertAfter('#checkout_street')
    $.ajax({
        url: '/checkout/get_street_by_query',
        type: 'POST',
        data:{
            query:encodeURIComponent(text),
            placeId: $('#express').attr('place')
        }
    })  .always(function( data ) {
            var items = [];
            var placeIds = [];
            request = JSON.parse(data.responseText);
            for (var i in request['suggestions']) {
                items.push(request['suggestions'][i]["type"]+ '.' + request['suggestions'][i]["name"])
                placeIds.push(request['suggestions'][i]["id"])
            }
            $( "#checkout_street" ).autocomplete({
                source: items,
                minLength: 0,
                select: function (item,place) {
                    i = jQuery.inArray(place.item.value , items)
                    var placeId
                    placeId = placeIds[i]
                    $('#checkout_street').attr('streetId', placeId)
                }
            });
            $("#checkout_street").autocomplete("search", '');
            $('.wait').remove()
        });
}

calculation = function(text){
    $('<span class="wait">Расчет стоимости доставки</span>').insertAfter('#checkout_place')
    var ship_method = $('input[name=ship_method]:checked').val()
    $.ajax({
        url: '/checkout/calculation',
        type: 'POST',
        data:{
            query:encodeURIComponent(text),
            ship_method: ship_method}
    })  .always(function( data ) {
            request = JSON.parse(data.responseText);
            console.log(request)
            console.log(data)
            $('.wait').remove()
            generate_delivery_method(request, text)
        });

}

generate_delivery_method = function(text, placeId){
    $('#postamat').remove()
    $('#pvz').remove()
    $('#express').remove()
    if (request.postamat) {
        var s = $("<select id='select_postamat' class='hide select_delivery_checkout' data-place="+placeId+">");
        for(var val=0; val < request.postamat.addresses.length; val++) {
            $("<option />", {value: request.postamat.deliveries[val],min: request.postamat.minTerms[val], max: request.postamat.maxTerms[val] ,place: request.postamat.addresses[val], cost: request.postamat.costs[val] , text: request.postamat.addresses[val] + " ("+request.postamat.costs[val]+" руб)"}).appendTo(s);
        }
        $( "#checkout_place").parent().append( "<div id = 'postamat'><input type='radio' class='delivery_check' name='delivery' value='postamat'>Постамат<br></div>" );
        $("#postamat").append(s)
    }
    if (request.pvz) {
        var s = $("<select id='select_pvz' class='hide select_delivery_checkout' data-place="+placeId+">");
        for(var val=0; val < request.pvz.addresses.length; val++)  {
            $("<option />", {value: request.pvz.deliveries[val],min: request.pvz.minTerms[val], max: request.pvz.maxTerms[val],place: request.pvz.addresses[val], cost: request.pvz.costs[val], text: request.pvz.addresses[val]+ " ("+request.pvz.costs[val]+" руб)"}).appendTo(s);
        }
        $( "#checkout_place").parent().append( "<div id = 'pvz'><input type='radio' class='delivery_check' name='delivery' value='pvz'>PVZ<br></div>" );
        $("#pvz").append(s)
    }
    if (request.express) {
        $( "#checkout_place").parent().append( "<div id = 'express' place="+placeId+" delivery="+request.express.deliveryId+" min="+request.express.minDeliveryTerm+" max="+request.express.maxDeliveryTerm+" cost="+request.express.cost+"><input type='radio' class='delivery_check' name='delivery' value='express'>Курьер<br></div>" );
        $("#express").append("<div class='ui-widget hide'><input id='checkout_street' type='text' autocomplete='off' placeholder='Улица'><input id='checkout_house' type='text' placeholder='Дом'><input id='checkout_housing' type='text' placeholder='Корпус'><input id='checkout_building' type='text' placeholder='Строение'><input id='checkout_appartment' type='text' placeholder='Квартира/офис'></div>")
    }
    if (request.emptyWithLimit){
        $( "#checkout_place").parent().append( "<div class='wait'> К сожалению, в ваш населенный пункт возможна доставка заказов со стоимостью, не превышающей"+request.emptyWithLimit+"р. Выберите другой способ оплаты. </div>" );
    }
}
