import { watchEffect } from 'vue'

const MAX_DESCRIPTION_LENGTH = 160

/**
 * Composable for managing SEO meta tags dynamically.
 *
 * Updates `document.title` and `<meta name="description">` reactively.
 * If the meta element does not exist, it is created and appended to `<head>`.
 * Description is truncated to a maximum of 160 characters.
 *
 * @param title - The page title to set on `document.title`
 * @param description - Optional meta description; truncated to 160 chars
 */
export function useSeoMeta(title: string, description?: string): void {
  watchEffect(() => {
    // Update document title
    document.title = title

    // Truncate description to max 160 characters
    const truncatedDescription = description
      ? description.slice(0, MAX_DESCRIPTION_LENGTH)
      : ''

    // Find existing <meta name="description"> or create one
    let metaDescription = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    )

    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.setAttribute('name', 'description')
      document.head.appendChild(metaDescription)
    }

    metaDescription.setAttribute('content', truncatedDescription)
  })
}
