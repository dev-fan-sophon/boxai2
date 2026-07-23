/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { usePlaygroundStore } from '@/stores/playground-store'

import {
  createPlaygroundRun,
  generateImages,
  generateSpeech,
  submitVideo,
  uploadPlaygroundAsset,
} from '../api'
import { persistGeneratedMediaAsset } from '../lib/download-generated-media'
import type { GeneratedImage, VideoSubmission } from '../types'

/**
 * Generation results and mutations for the studio modalities. Settings live
 * in the shared playground store (persisted, migrated); the transient
 * results below reset when the playground unmounts, matching the previous
 * behavior.
 */
export type UseStudioResult = ReturnType<typeof useStudio>

export function useStudio() {
  const queryClient = useQueryClient()
  const settings = usePlaygroundStore((state) => state.studioSettings)
  const setSettings = usePlaygroundStore((state) => state.setStudioSettings)
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [video, setVideo] = useState<VideoSubmission | null>(null)
  const [audioUrl, setAudioUrl] = useState('')

  useEffect(
    () => () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    },
    [audioUrl]
  )

  const imageMutation = useMutation({
    mutationFn: generateImages,
    onSuccess: (images, variables) => {
      setImages(images)
      void (async () => {
        await Promise.allSettled(
          images.map(async (image, index) => {
            const asset = await persistGeneratedMediaAsset(
              image.url,
              `generated-image-${index + 1}`,
              'image'
            )
            await createPlaygroundRun({
              modality: 'image',
              model: variables.model,
              prompt: variables.prompt,
              asset_id: asset.id,
            })
          })
        )
        await queryClient.invalidateQueries({
          queryKey: ['playground', 'runs'],
        })
      })()
    },
  })
  const videoMutation = useMutation({
    mutationFn: submitVideo,
    onSuccess: (submission, variables) => {
      setVideo(submission)
      void createPlaygroundRun({
        modality: 'video',
        model: variables.model,
        prompt: variables.prompt,
        task_id: submission.taskId,
      })
      void queryClient.invalidateQueries({
        queryKey: ['playground', 'task-history'],
      })
      void queryClient.invalidateQueries({ queryKey: ['playground', 'runs'] })
    },
  })
  const audioMutation = useMutation({
    mutationFn: generateSpeech,
    onSuccess: (blob, variables) => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      setAudioUrl(URL.createObjectURL(blob))
      void (async () => {
        let assetId: number
        try {
          const extension = variables.settings.audioFormat || 'mp3'
          const asset = await uploadPlaygroundAsset(
            new File([blob], `speech.${extension}`, { type: blob.type }),
            'audio'
          )
          assetId = asset.id
        } catch {
          // Playback remains available without creating a broken saved run.
          return
        }
        await createPlaygroundRun({
          modality: 'audio',
          model: variables.model,
          prompt: variables.text,
          asset_id: assetId,
        })
        await queryClient.invalidateQueries({
          queryKey: ['playground', 'runs'],
        })
      })()
    },
  })

  return {
    settings,
    setSettings,
    images,
    video,
    audioUrl,
    imageMutation,
    videoMutation,
    audioMutation,
  }
}
