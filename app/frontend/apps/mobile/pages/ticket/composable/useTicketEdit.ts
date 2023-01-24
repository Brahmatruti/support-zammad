// Copyright (C) 2012-2023 Zammad Foundation, https://zammad-foundation.org/

import type { ComputedRef, ShallowRef } from 'vue'
import { computed, reactive, watch } from 'vue'
import { pick } from 'lodash-es'
import type { FormValues, FormRef, FormData } from '@shared/components/Form'
import { useObjectAttributeFormData } from '@shared/entities/object-attributes/composables/useObjectAttributeFormData'
import { useObjectAttributes } from '@shared/entities/object-attributes/composables/useObjectAttributes'
import type { TicketUpdateInput } from '@shared/graphql/types'
import { EnumObjectManagerObjects } from '@shared/graphql/types'
import { MutationHandler } from '@shared/server/apollo/handler'
import type { TicketById } from '@shared/entities/ticket/types'
import type { FileUploaded } from '@shared/components/Form/fields/FieldFile/types'
import { useTicketUpdateMutation } from '../graphql/mutations/update.api'

interface ArticleFormValues {
  articleType: string
  body: string
  internal: boolean
  cc?: string[]
  to?: string[]
  subject?: string
  attachments?: FileUploaded[]
}

export const useTicketEdit = (
  ticket: ComputedRef<TicketById | undefined>,
  form: ShallowRef<FormRef | undefined>,
) => {
  const initialTicketValue = reactive<FormValues>({})
  const mutationUpdate = new MutationHandler(useTicketUpdateMutation({}))

  watch(ticket, (ticket) => {
    if (!ticket) {
      return
    }
    const ticketId = initialTicketValue.id || ticket.id
    const { internalId: ownerInternalId } = ticket.owner
    initialTicketValue.id = ticket.id
    // show Zammad user as empty
    initialTicketValue.owner_id = ownerInternalId === 1 ? null : ownerInternalId

    form.value?.resetForm(initialTicketValue, ticket, {
      // don't reset to new values, if user changes something
      // if ticket is different, it's probably navigation to another ticket,
      // so we can safely reset the form
      resetDirty: ticketId !== ticket.id,
    })
  })

  const isTicketFormGroupValid = computed(() => {
    const ticketGroup = form.value?.formNode?.at('ticket')
    return !!ticketGroup?.context?.state.valid
  })

  const { attributesLookup: ticketObjectAttributesLookup } =
    useObjectAttributes(EnumObjectManagerObjects.Ticket)

  const processArticle = (
    formId: string,
    article: ArticleFormValues | undefined,
  ) => {
    if (!article) return null

    const attachments = article.attachments || []
    const files = attachments.map((file) =>
      pick(file, ['content', 'name', 'type']),
    )

    return {
      type: article.articleType,
      body: article.body,
      internal: article.internal,
      cc: article.cc,
      to: article.to,
      subject: article.subject,
      contentType: 'text/html', // TODO can be plain text
      attachments: attachments.length ? { files, formId } : null,
      // TODO security
    }
  }

  const editTicket = async (formData: FormData) => {
    if (!ticket.value) return undefined

    if (!formData.owner_id) {
      formData.owner_id = 1
    }

    const { internalObjectAttributeValues, additionalObjectAttributeValues } =
      useObjectAttributeFormData(ticketObjectAttributesLookup.value, formData)

    const formArticle = formData.article as ArticleFormValues | undefined
    const article = processArticle(formData.formId, formArticle)

    return mutationUpdate.send({
      ticketId: ticket.value.id,
      input: {
        ...internalObjectAttributeValues,
        objectAttributeValues: additionalObjectAttributeValues,
        article,
      } as TicketUpdateInput,
    })
  }

  return {
    initialTicketValue,
    isTicketFormGroupValid,
    editTicket,
  }
}