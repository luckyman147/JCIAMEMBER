import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { outingSchema, type OutingFormValues } from '../schemas/outing.schema'
import type { Outing } from '../types/outing.types'

export function useOutingForm(outing?: Outing) {
  const defaultValues: OutingFormValues = {
    title: outing?.title ?? '',
    description: outing?.description ?? '',
    category: outing?.category ?? 'other',
    date: outing?.date ?? '',
    start_time: outing?.start_time ?? '',
    end_time: outing?.end_time ?? '',
    max_participants: outing?.max_participants ?? 10,
    latitude: outing?.latitude ?? 0,
    longitude: outing?.longitude ?? 0,
    address: outing?.address ?? '',
    cover_image: outing?.cover_image ?? '',
  }

  const form = useForm<OutingFormValues>({
    // ponytail: zod v4 + hookform resolver type mismatch
    resolver: zodResolver(outingSchema) as any,
    defaultValues,
  })

  return form
}
