Spree::Core::Engine.routes.draw do
  post '/checkout/get_place_by_query' => 'checkout#get_place_by_query', :as => :checkout_get_place_by_query
  post '/checkout/calculation' => 'checkout#calculation', :as => :calculation
  post '/checkout/create_checkout_order' => 'checkout#create_checkout_order', :as => :create_checkout_order
  post '/checkout/get_street_by_query' => 'checkout#get_street_by_query', :as => :get_street_by_query
end
