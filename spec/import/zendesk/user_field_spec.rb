require 'rails_helper'
require 'import/zendesk/object_field_examples'

RSpec.describe Import::Zendesk::UserField do
  it_behaves_like 'Import::Zendesk::ObjectField'
end
