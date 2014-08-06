Spree::CheckoutController.class_eval do
  before_filter :get_ticket

  def get_place_by_query
    @res = Net::HTTP.get_response(URI('http://platform.checkout.ru/service/checkout/getPlacesByQuery?ticket='+session[:ticket]+'&place='+ params[:query]))
    respond_to do |format|
      format.js {render :json => @res.body}
    end
  end

  def get_street_by_query
    @res = Net::HTTP.get_response(URI('http://platform.checkout.ru/service/checkout/getStreetsByQuery?ticket='+session[:ticket]+'&placeId='+ params[:placeId]+'&street='+ params[:query]))
    respond_to do |format|
      format.js {render :json => @res.body}
    end
  end

  def calculation
    @weight = 0
    @total_sum = current_order.item_total.to_f * params[:ship_method].to_i
    current_order.line_items.each do |li|
      @weight += li.variant.weight * li.quantity if li.variant.weight
    end
    @res = Net::HTTP.get_response(URI('http://platform.checkout.ru/service/checkout/calculation?ticket='+session[:ticket]+
                                          '&placeId='+ params[:query]+
                                          '&totalSum='+@total_sum.to_s+
                                          '&assessedSum='+current_order.item_total.to_f.to_s+
                                          '&totalWeight='+ @weight.to_f.to_s +
                                          '&itemsCount='+current_order.item_count.to_s))
    respond_to do |format|
      format.js {render :json => @res.body}
    end

  end

  def create_checkout_order
    items = []
    current_order.line_items.each do |li|
      good = {
          "name" => li.product.name ,
          "code"=> li.variant.sku,
          "variantCode"=> li.variant.sku,
          "quantity"=> li.quantity,
          "assessedCost"=> li.price.to_f ,
          "payCost"=> (li.price.to_f * params[:ship_method].to_i),
          "weight"=> (li.variant.weight ).to_f,
      }
      items << good
    end
    ship_method = params[:ship_method]=='1' ? 'cash' : 'prepay'
    if params[:deliveryMethod] == "express"
      delivery = {
          "deliveryId"=> params[:deliveryId],
          "placeFiasId"=>params[:placeId],
          "addressExpress" => {
              "postindex" => "",
              "streetFiasId" => params[:streetId],
              "house" => params[:house],
              "housing" => params[:housing],
              "building" => params[:building],
              "appartment" => params[:appartment]
          },
          "type" => params[:deliveryMethod],
          "cost"=> params[:cost].to_f,
          "minTerm" => params[:minTerm].to_i,
          "maxTerm" => params[:maxTerm].to_i,

      }
    else
      delivery = {
          "deliveryId"=> params[:deliveryId],
          "placeFiasId"=>params[:placeId],
          "courierOptions" =>["none"],
          "addressPvz" => params[:street],
          "type" => params[:deliveryMethod],
          "cost"=> params[:cost].to_f,
          "minTerm" => params[:minTerm].to_i,
          "maxTerm" => params[:maxTerm].to_i,

      }
    end

    @order_request = {"apiKey" => Spree::Config[:checkout_store_key],
                      "order"=> {
                          "goods"   => items,
                          "delivery" => delivery,

                          "user"=> {
                              "fullname"=> params[:firstname]+ " " + params[:lastname],
                              "email"=> current_order.user.email,
                              "phone"=> params[:phone]
                          },

                          "comment"=>"комментарий к заказу",
                          "shopOrderId"=> current_order.number,
                          "paymentMethod"=> ship_method

                      }}
    json_headers = {"Content-Type" => "application/json",
                    "Accept" => "application/json"}

    uri = URI.parse('http://platform.checkout.ru/service/order/create')
    http = Net::HTTP.new(uri.host, uri.port)
    @res = http.post(uri.path, @order_request.to_json, json_headers)
    respond_to do |format|
      format.js do
        render :js => {:body=>@res.body, :code=>@res.code}.to_json
      end
    end
  end

  private

  def get_ticket
    params.require(:order_info).permit! if params[:order_info]
    res = Net::HTTP.get_response(URI('http://platform.checkout.ru/service/login/ticket/'+Spree::Config[:checkout_store_key]))
    session[:ticket] = (JSON.parse res.body)["ticket"]
  end
end