import api from './api'

export const permissionService = {
  getAll(params) {
    return api.get('/permissions', { params })
  },

  getSearch(params) {
    return api.get('/permissions/search', { params })
  },

  getList() {
    return api.get('/permissions/list')
  },

  /**
   * Transforms flat permissions into a grouped structure for UI display
   * @param {Array} permissions - List of permission objects { name, slug }
   * @returns {Array} List of grouped permissions { group, items: [{ label, value }] }
   */
  groupPermissions(permissions) {
    if (!permissions || !Array.isArray(permissions)) return []

    const groups = {}

    permissions.forEach((perm) => {
      const parts = perm.slug.split('.')
      let groupKey = 'Other'

      if (parts.length > 0) {
        // Remove generic prefixes like "manage" or "master" to find the real module name
        const ignorePrefixes = ['manage', 'master', 'view', 'create', 'edit', 'delete']
        let startIdx = 0

        while (startIdx < parts.length - 1 && ignorePrefixes.includes(parts[startIdx])) {
          startIdx++
        }

        // Use the module part as the group key
        groupKey = parts[startIdx]
      }

      // Format Group Name (e.g., "eagle-eye" -> "Eagle Eye", "user" -> "User")
      const groupName = groupKey
        .split(/[._-]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      if (!groups[groupName]) {
        groups[groupName] = []
      }

      groups[groupName].push({
        label: perm.name,
        value: perm.slug,
      })
    })

    // Sort groups alphabetically
    return Object.keys(groups)
      .sort()
      .map((key) => ({
        group: key,
        items: groups[key].sort((a, b) => a.label.localeCompare(b.label)),
      }))
  },
}
