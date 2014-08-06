module CheckoutRu
  module Generators
    class InstallGenerator < Rails::Generators::Base
      source_root File.expand_path("../../lib", __FILE__)
      def copy_files
        copy_file "checkout_controller_decorator.rb", "app/controllers/spree/checkout_controller_decorator.rb"
        copy_file "checkout.js", "app/assets/javascripts/spree/frontend/checkoutru.js"
        copy_file "_checkout_ru.html.erb", "app/views/spree/checkout/_checkout_ru.html.erb"
      end

    end
  end
end
