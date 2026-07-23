/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { Download, FileText } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import {
  CodeBlock,
  CodeBlockCopyButton,
} from '@/components/ai-elements/code-block'
import { Loader } from '@/components/ai-elements/loader'
import { MessageContent } from '@/components/ai-elements/message'
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning'
import { Response } from '@/components/ai-elements/response'
import { Shimmer } from '@/components/ai-elements/shimmer'
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/sources'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { MESSAGE_STATUS } from '../../constants'
import { useVideoTaskResult } from '../../hooks/use-video-task-result'
import {
  getMessageAlignmentClass,
  getMessageContentState,
  isErrorMessage,
  type MessageAlignment,
} from '../../lib'
import { downloadGeneratedMedia } from '../../lib/download-generated-media'
import { getMessageContentStyles } from '../../lib/message/message-styles'
import type { Message } from '../../types'
import { MessageError } from './message-error'
import { MessageMetadata } from './message-metadata'

type PlaygroundMessageContentProps = {
  actions: ReactNode
  alignment: MessageAlignment
  errorActions?: ReactNode
  isSourceVisible?: boolean
  message: Message
  versionContent: string
}

export function PlaygroundMessageContent({
  actions,
  alignment,
  errorActions,
  isSourceVisible = false,
  message,
  versionContent,
}: PlaygroundMessageContentProps) {
  const { t } = useTranslation()
  const {
    displayContent,
    hasReasoning,
    hasSources,
    reasoningContent,
    showLoader,
    showMessageContent,
    sources,
  } = getMessageContentState(message, versionContent)
  const isError = isErrorMessage(message)
  const isMessageFinal =
    message.status !== MESSAGE_STATUS.LOADING &&
    message.status !== MESSAGE_STATUS.STREAMING
  const videoResult = useVideoTaskResult(
    message.managedTool?.taskId,
    message.managedTool?.action === 'generate_video',
    message.managedTool?.runId
  )
  const toolVideoUrl = videoResult.resultUrl || message.managedTool?.videoUrl
  const toolStatus =
    message.managedTool?.action === 'generate_video' && videoResult.status
      ? videoResult.status.toLowerCase()
      : message.managedTool?.status
  const toolError =
    message.managedTool?.action === 'generate_video' && videoResult.failed
      ? videoResult.failReason
      : message.managedTool?.error

  let managedToolTitle = t('Platform tool')
  if (message.managedTool?.action === 'generate_image') {
    managedToolTitle = t('Image generation')
  } else if (message.managedTool?.action === 'generate_video') {
    managedToolTitle = t('Video generation')
  } else if (message.managedTool?.action === 'web_search') {
    managedToolTitle = t('Web search')
  }

  return (
    <div
      className={cn(
        'flex w-full min-w-0 flex-col',
        getMessageAlignmentClass(alignment)
      )}
    >
      {message.attachments && message.attachments.length > 0 && (
        <div className='mb-2 flex flex-wrap gap-2'>
          {message.attachments.map((attachment, index) =>
            attachment.type === 'image' ? (
              <img
                key={attachment.id}
                src={attachment.dataUrl}
                alt={t('Attachment {{index}}', { index: index + 1 })}
                className='border-border size-24 rounded-lg border object-cover'
              />
            ) : (
              <div
                key={attachment.id}
                className='border-border bg-muted flex max-w-64 items-center gap-2 rounded-lg border px-3 py-2'
              >
                <FileText className='text-muted-foreground size-5 shrink-0' />
                <span className='truncate text-sm' title={attachment.name}>
                  {attachment.name}
                </span>
              </div>
            )
          )}
        </div>
      )}

      {hasSources && (
        <Sources>
          <SourcesTrigger count={sources.length} />
          <SourcesContent>
            {sources.map((source) => (
              <Source
                href={source.href}
                key={`${source.href}-${source.title}`}
                title={source.title}
              />
            ))}
          </SourcesContent>
        </Sources>
      )}

      {message.managedTool && (
        <section className='border-border bg-muted/30 mb-2 rounded-xl border p-3'>
          <div className='flex flex-wrap items-center justify-between gap-2 text-sm'>
            <span className='font-medium'>{managedToolTitle}</span>
            <span className='bg-muted rounded-full px-2 py-0.5 text-xs'>
              {t(toolStatus || message.managedTool.status)}
            </span>
          </div>
          {toolError && (
            <p className='text-destructive mt-2 text-sm'>{toolError}</p>
          )}
          {message.managedTool.images && (
            <div className='mt-3 grid gap-2 sm:grid-cols-2'>
              {message.managedTool.images.map((url, index) => (
                <ManagedToolImage
                  key={url}
                  url={url}
                  index={index}
                  alt={t('Generated image')}
                  downloadLabel={t('Download')}
                />
              ))}
            </div>
          )}
          {toolVideoUrl && (
            <div className='mt-3'>
              <video
                src={toolVideoUrl}
                controls
                className='w-full rounded-lg'
              />
              <Button
                size='sm'
                variant='outline'
                className='mt-2'
                onClick={() =>
                  void downloadGeneratedMedia(toolVideoUrl, 'video', 'video')
                }
              >
                <Download aria-hidden='true' />
                {t('Download')}
              </Button>
            </div>
          )}
        </section>
      )}

      {hasReasoning && (
        <Reasoning
          defaultOpen
          duration={message.reasoning?.duration}
          isStreaming={message.isReasoningStreaming}
        >
          <ReasoningTrigger />
          <ReasoningContent>{reasoningContent}</ReasoningContent>
        </Reasoning>
      )}

      {showLoader && (
        <div className='flex items-center gap-2 py-2'>
          <Loader />
          <Shimmer className='text-sm' duration={1}>
            {t('Responding...')}
          </Shimmer>
        </div>
      )}

      {isError && (
        <>
          <MessageError message={message} className='mb-2' />
          <MessageMetadata alignment={alignment} message={message} />
          {errorActions}
        </>
      )}

      {!isError && showMessageContent && (
        <>
          {isSourceVisible ? (
            <CodeBlock
              code={versionContent}
              className='my-0 group-[.is-assistant]:w-full group-[.is-assistant]:max-w-[78ch]'
              collapsedLines={24}
              defaultCollapsed={false}
              language='markdown'
              maxExpandedLines={48}
              showLineNumbers
              showToolbar
              title={t('Raw response')}
            >
              <CodeBlockCopyButton />
            </CodeBlock>
          ) : (
            <MessageContent
              variant='flat'
              className={cn(getMessageContentStyles())}
            >
              <Response final={isMessageFinal}>{displayContent}</Response>
            </MessageContent>
          )}
          <MessageMetadata alignment={alignment} message={message} />
          {actions}
        </>
      )}
    </div>
  )
}

function ManagedToolImage(props: {
  url: string
  index: number
  alt: string
  downloadLabel: string
}) {
  const [sizeLabel, setSizeLabel] = useState<string | null>(null)

  return (
    <div
      className='generation-result-enter border-border/70 bg-muted/30 relative overflow-hidden rounded-xl border'
      style={{ animationDelay: `${props.index * 70}ms` }}
    >
      <img
        src={props.url}
        alt={props.alt}
        className='generation-image-reveal w-full object-contain'
        referrerPolicy='no-referrer'
        loading='lazy'
        decoding='async'
        onLoad={(event) => {
          const img = event.currentTarget
          if (img.naturalWidth > 0 && img.naturalHeight > 0) {
            setSizeLabel(`${img.naturalWidth}×${img.naturalHeight}`)
          }
        }}
      />
      {sizeLabel && (
        <span className='generation-size-badge bg-background/85 text-foreground/90 absolute top-2 left-2 rounded-full px-2 py-0.5 font-mono text-[11px] shadow-sm backdrop-blur-sm'>
          {sizeLabel}
        </span>
      )}
      <Button
        size='icon-sm'
        variant='secondary'
        className='absolute right-2 bottom-2'
        aria-label={props.downloadLabel}
        onClick={() =>
          void downloadGeneratedMedia(
            props.url,
            `image-${props.index + 1}`,
            'image'
          )
        }
      >
        <Download aria-hidden='true' />
      </Button>
    </div>
  )
}
