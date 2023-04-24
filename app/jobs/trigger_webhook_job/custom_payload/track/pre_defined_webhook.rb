# Copyright (C) 2012-2023 Zammad Foundation, https://zammad-foundation.org/

class TriggerWebhookJob::CustomPayload::Track::PreDefinedWebhook < TriggerWebhookJob::CustomPayload::Track
  WEBHOOK_PREDEFINED_CLASS_PREFIX = 'Webhook::PreDefined::'.freeze

  class << self

    def root?
      true
    end

    def klass
      'Struct::PreDefinedWebhook'
    end

    def functions
      %w[
        messaging_channel
        messaging_username
        messaging_icon_url
      ].freeze
    end

    def replacements
      {
        webhook: functions,
      }
    end

    def generate(tracks, data)
      webhook = data[:webhook]
      return if webhook.pre_defined_webhook_type.blank?

      pre_defined_webhook = "#{WEBHOOK_PREDEFINED_CLASS_PREFIX}#{webhook.pre_defined_webhook_type}".constantize.new
      struct = struct(pre_defined_webhook)

      values = webhook.preferences&.dig('pre_defined_webhook') || {}
      tracks[:webhook] = struct.new(*values.values_at(*struct.members))
    end

    def payload(type)
      pre_defined_webhook = "#{WEBHOOK_PREDEFINED_CLASS_PREFIX}#{type}".constantize.new

      JSON.pretty_generate(pre_defined_webhook.custom_payload)
    end

    private

    def struct(pre_defined_webhook)
      @struct ||= Struct.new('PreDefinedWebhook', *pre_defined_webhook.field_names)
    end

  end

end
