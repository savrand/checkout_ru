require 'rails/generators/base'
module CheckoutRu
  module Generators
    class InstallGenerator < Rails::Generators::Base

      def copy_files
        copy_file "../../../lib/checkout_controller_decorator.rb", "app/controllers/spree/checkout_controller_decorator.rb"
        copy_file "../../../lib/checkout.js", "app/assets/javascripts/spree/frontend/checkoutru.js"
        copy_file "../../../lib/_checkout_ru.html.erb", "app/views/spree/checkout/_checkout_ru.html.erb"
      end

    end
  end
end
